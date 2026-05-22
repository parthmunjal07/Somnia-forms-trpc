import { z } from "../../schema";
import { router, publicProcedure, protectedProcedure } from "../../../../../apps/api/src/trpc/procedures";
import { generatePath } from "../../utils/path-generator";
import { db } from "@repo/database";
import { usersTable, emailVerificationsTable } from "@repo/database/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { TRPCError } from "@trpc/server";
import {
  clearTokenCookies,
  generateTokens,
  setTokenCookies,
  verifyAccessToken,
  verifyRefreshToken,
} from "../../lib/tokens";
import { roleEnum } from "@repo/database/schema";

const TAGS = ["Authentication"];
const getPath = generatePath("/auth");

export const authRouter = router({
  // ─── Register ────────────────────────────────────────────────────────────────
  register: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/register"), tags: TAGS } })
    .input(
      z.object({
        fullName: z.string().min(1).max(80),
        email: z.string().email(),
        password: z
          .string()
          .min(8)
          .regex(/[A-Z]/, "Must contain uppercase")
          .regex(/[0-9]/, "Must contain number"),
      }),
    )
    .output(z.object({ message: z.string() }))
    .mutation(async ({ input }) => {
      const existing = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.email, input.email))
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "Email already in use" });
      }

      const passwordHash = await bcrypt.hash(input.password, 12);
      const [user] = await db
        .insert(usersTable)
        .values({
          fullName: input.fullName,
          email: input.email,
          passwordHash,
          role: "THE_ARCHITECT",
        })
        .returning({ id: usersTable.id });

      if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Create email verification token (expires in 24h)
      const token = randomBytes(32).toString("hex");
      await db.insert(emailVerificationsTable).values({
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      // TODO: send verification email with link /verify?token=<token>

      return { message: "Registration successful. Please verify your email." };
    }),

  // ─── Send Verification ───────────────────────────────────────────────────────
  sendVerification: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/send-verification"), tags: TAGS } })
    .input(z.object({ email: z.string().email() }))
    .output(z.object({ message: z.string() }))
    .mutation(async ({ input }) => {
      const [user] = await db
        .select({ id: usersTable.id, emailVerifiedAt: usersTable.emailVerifiedAt })
        .from(usersTable)
        .where(eq(usersTable.email, input.email))
        .limit(1);

      if (!user) {
        // Return success anyway to prevent email enumeration
        return { message: "If this email is registered, a verification link will be sent." };
      }

      if (user.emailVerifiedAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Email is already verified" });
      }

      const token = randomBytes(32).toString("hex");

      await db.delete(emailVerificationsTable).where(eq(emailVerificationsTable.userId, user.id));

      await db.insert(emailVerificationsTable).values({
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      // TODO: send verification email

      return { message: "If this email is registered, a verification link will be sent." };
    }),

  // ─── Verify Email ────────────────────────────────────────────────────────────
  verifyEmail: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/verify-email"), tags: TAGS } })
    .input(z.object({ token: z.string() }))
    .output(z.object({ message: z.string() }))
    .mutation(async ({ input }) => {
      const [record] = await db
        .select()
        .from(emailVerificationsTable)
        .where(eq(emailVerificationsTable.token, input.token))
        .limit(1);

      if (!record) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invalid or expired token" });
      }

      if (record.verifiedAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Token already used" });
      }

      if (record.expiresAt < new Date()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Token has expired" });
      }

      await db.transaction(async (tx) => {
        await tx
          .update(emailVerificationsTable)
          .set({ verifiedAt: new Date() })
          .where(eq(emailVerificationsTable.id, record.id));
        await tx
          .update(usersTable)
          .set({ emailVerifiedAt: new Date() })
          .where(eq(usersTable.id, record.userId));
      });

      return { message: "Email verified successfully" };
    }),

  // ─── Login ───────────────────────────────────────────────────────────────────
  login: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/login"), tags: TAGS } })
    .input(z.object({ email: z.string().email(), password: z.string() }))
    .output(
      z.object({
        user: z.object({
          id: z.string(),
          email: z.string(),
          role: z.enum(roleEnum.enumValues),
          emailVerifiedAt: z.string().nullable(),
          subscriptionTier: z.enum(["free", "pro", "team"]),
        }),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, input.email))
        .limit(1);

      const GENERIC_ERROR = new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid email or password",
      });

      if (!user || !user.passwordHash) throw GENERIC_ERROR;

      const passwordMatch = await bcrypt.compare(input.password, user.passwordHash);
      if (!passwordMatch) throw GENERIC_ERROR;

      if (!user.emailVerifiedAt) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Please verify your email before logging in",
        });
      }

      const tokens = generateTokens(user);
      setTokenCookies(ctx.res, tokens);

      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          emailVerifiedAt: user.emailVerifiedAt ? user.emailVerifiedAt.toISOString() : null,
          subscriptionTier: user.subscriptionTier,
        },
      };
    }),

  // ─── Me ──────────────────────────────────────────────────────────────────────
  me: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/me"), tags: TAGS } })
    .input(z.undefined())
    .output(
      z.object({
        user: z.object({
          id: z.string(),
          email: z.string(),
          role: z.enum(roleEnum.enumValues),
          emailVerifiedAt: z.string().nullable(),
          subscriptionTier: z.enum(["free", "pro", "team"]),
        }),
      }),
    )
    .mutation(async ({ ctx }) => {
      const { access_token, refresh_token } = (ctx.req.cookies ?? {}) as Record<string, string>;

      // 1. Try accessToken
      if (access_token) {
        try {
          const payload = verifyAccessToken(access_token);
          const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.sub)).limit(1);
          if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });
          return {
            user: {
              id: user.id,
              email: user.email,
              role: user.role,
              emailVerifiedAt: user.emailVerifiedAt ? user.emailVerifiedAt.toISOString() : null,
              subscriptionTier: user.subscriptionTier,
            },
          };
        } catch {
          // expired — fall through to refresh
        }
      }

      // 2. Try refreshToken
      if (refresh_token) {
        try {
          const { sub } = verifyRefreshToken(refresh_token);
          const [user] = await db.select().from(usersTable).where(eq(usersTable.id, sub)).limit(1);

          if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

          const tokens = generateTokens(user);
          setTokenCookies(ctx.res, tokens);

          return {
            user: {
              id: user.id,
              email: user.email,
              role: user.role,
              emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
              subscriptionTier: user.subscriptionTier,
            },
          };
        } catch {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Session expired. Please log in again.",
          });
        }
      }

      // 5. Both invalid
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }),

  upgradeTier: protectedProcedure
    .input(z.object({ tier: z.enum(["free", "pro", "team"]) }))
    .mutation(async ({ input, ctx }: { input: any, ctx: any }) => {
      await db
        .update(usersTable)
        .set({ subscriptionTier: input.tier })
        .where(eq(usersTable.id, ctx.user.id));
      return { success: true, tier: input.tier };
    }),

    logout: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/logout"), tags: TAGS } })
    .input(z.undefined())
    .output(z.object({ message: z.string() }))
    .mutation(({ ctx }) => {
      // Instructs Express to clear the httpOnly cookies from the browser
      clearTokenCookies(ctx.res); 
      return { message: "Logged out successfully" };
    }),
});

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { db } from "@repo/database";
import { usersTable } from "@repo/database/schema";
import { eq } from "drizzle-orm";
import { env } from "../env";

if (env.GOOGLE_OAUTH_CLIENT_ID && env.GOOGLE_OAUTH_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_OAUTH_CLIENT_ID,
        clientSecret: env.GOOGLE_OAUTH_CLIENT_SECRET,
        callbackURL: `${env.FRONTEND_URL}/api/auth/google/callback`,
        proxy:true
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("No email found in Google profile"));
          }

          let [user] = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.googleId, profile.id))
            .limit(1);

          console.log(user);
          
          if (user) {
            return done(null, user);
          }
          
          [user] = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.email, email))
          .limit(1);
          
          console.log(user);
          
          if (user) {
            [user] = await db
            .update(usersTable)
            .set({ googleId: profile.id })
            .where(eq(usersTable.id, user.id))
            .returning();
            return done(null, user);
          }

          [user] = await db
          .insert(usersTable)
          .values({
            googleId: profile.id.toString(),
            email: email,
            fullName: profile.displayName || "Google User",
            role: "THE_ARCHITECT",
            emailVerifiedAt: new Date(),
            profileImageUrl: profile.photos?.[0]?.value,
          })
          .returning();
          
          console.log(user);
          
          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );
}

export default passport;

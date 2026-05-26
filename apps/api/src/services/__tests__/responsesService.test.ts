import { describe, it, expect, vi, beforeEach } from "vitest";
import { responsesService } from "../responsesService";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";

// Mock dependencies
vi.mock("../formsService", () => ({
  getUserFormRole: vi.fn(),
}));

vi.mock("../../lib/compileFormSchema", () => ({
  compileFormSchema: vi.fn(),
}));

vi.mock("@repo/email", () => ({
  sendSignalNotification: vi.fn().mockResolvedValue(true),
  sendSurfacingConfirmation: vi.fn().mockResolvedValue(true),
  sendExpiryWarning: vi.fn().mockResolvedValue(true),
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
  },
}));

const mockDbSelect = vi.fn();
const mockDbInsert = vi.fn();
const mockDbUpdate = vi.fn();

vi.mock("@repo/database", () => {
  return {
    db: {
      select: (...args: any[]) => {
        const chain: any = {
          from: vi.fn(() => chain),
          where: vi.fn(() => chain),
          orderBy: vi.fn(() => chain),
          limit: vi.fn(() => {
            const ret: any = { offset: vi.fn(() => mockDbSelect(...args)) };
            ret.then = (resolve: any) => Promise.resolve(mockDbSelect(...args)).then(resolve);
            return ret;
          }),
        };
        chain.then = (resolve: any) => Promise.resolve(mockDbSelect(...args)).then(resolve);
        return chain;
      },
      transaction: async (cb: any) => {
        const tx = {
          insert: () => {
            const chain: any = {
              values: vi.fn(() => {
                const ret: any = { returning: vi.fn(() => mockDbInsert()) };
                ret.then = (resolve: any) => Promise.resolve(mockDbInsert()).then(resolve);
                return ret;
              }),
            };
            return chain;
          },
          update: () => {
            const chain: any = {
              set: vi.fn(() => {
                const ret: any = { where: vi.fn(() => mockDbUpdate()) };
                ret.then = (resolve: any) => Promise.resolve(mockDbUpdate()).then(resolve);
                return ret;
              }),
            };
            return chain;
          },
        };
        return cb(tx);
      },
    },
  };
});

describe("ResponsesService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbSelect.mockReset();
    mockDbInsert.mockReset();
    mockDbUpdate.mockReset();
  });

  describe("submit", () => {
    it("should throw NOT_FOUND if form is not published", async () => {
      mockDbSelect.mockResolvedValueOnce([{ status: "draft" }]);

      await expect(responsesService.submit("form_1", {}, "127.0.0.1")).rejects.toThrowError(
        new TRPCError({ code: "NOT_FOUND", message: "Form not published or not found" })
      );
    });

    it("should throw FORBIDDEN if form has expired", async () => {
      mockDbSelect.mockResolvedValueOnce([{ status: "published", expiresAt: new Date(Date.now() - 10000) }]);

      await expect(responsesService.submit("form_1", {}, "127.0.0.1")).rejects.toThrowError(
        new TRPCError({ code: "FORBIDDEN", message: "Form has expired" })
      );
    });

    it("should throw UNAUTHORIZED if incorrect password provided", async () => {
      mockDbSelect.mockResolvedValueOnce([{ status: "published", passwordHash: "hashed_pwd" }]);
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(false as never);

      await expect(responsesService.submit("form_1", {}, "127.0.0.1", "wrong")).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED", message: "Incorrect password" })
      );
    });

    it("should successfully submit response", async () => {
      // 1. Form fetch
      mockDbSelect.mockResolvedValueOnce([{ status: "published", userId: "user_1" }]);
      // 2. Owner fetch
      mockDbSelect.mockResolvedValueOnce([{ subscriptionTier: "pro", email: "test@test.com" }]);
      // 3. Analytics fetch
      mockDbSelect.mockResolvedValueOnce([{ submissionsCount: 10 }]);
      
      const { compileFormSchema } = await import("../../lib/compileFormSchema");
      vi.mocked(compileFormSchema).mockResolvedValueOnce({
        safeParse: vi.fn().mockReturnValue({ success: true, data: { field_1: "test" } }),
      } as any);

      // 4. Fields fetch
      mockDbSelect.mockResolvedValueOnce([{ id: "field_1", required: true }]);

      // DB insert & update inside transaction
      mockDbInsert.mockResolvedValueOnce([{ id: "resp_1" }]);

      const result = await responsesService.submit("form_1", { field_1: "test" }, "127.0.0.1");
      expect(result).toEqual({ id: "resp_1" });
    });
  });

  describe("list", () => {
    it("should allow THE_FORGER to view responses", async () => {
      const { getUserFormRole } = await import("../formsService");
      vi.mocked(getUserFormRole).mockResolvedValueOnce("THE_FORGER");

      mockDbSelect.mockResolvedValueOnce([{ id: "resp_1" }]);

      const result = await responsesService.list("form_1", "user_1", { limit: 10 });
      expect(result.items).toHaveLength(1);
    });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { FormsService, formsService } from "../formsService";
import { TRPCError } from "@trpc/server";

const mockDbSelect = vi.fn();
const mockDbInsert = vi.fn();
const mockDbUpdate = vi.fn();
const mockDbDelete = vi.fn();
const mockDbTransaction = vi.fn();

vi.mock("@repo/database", () => {
  return {
    db: {
      select: (...args: any[]) => {
        const chain: any = {
          from: vi.fn(() => chain),
          where: vi.fn(() => chain),
          leftJoin: vi.fn(() => chain),
          orderBy: vi.fn(() => chain),
          limit: vi.fn(() => {
            return mockDbSelect(...args);
          }),
        };
        // Some queries don't use limit, so we also make the chain itself awaitable
        chain.then = (resolve: any) => Promise.resolve(mockDbSelect(...args)).then(resolve);
        return chain;
      },
      insert: (...args: any[]) => {
        const chain: any = {
          values: vi.fn((vals) => {
            const retChain: any = {
              returning: vi.fn(() => mockDbInsert(vals)),
            };
            retChain.then = (resolve: any) => Promise.resolve(mockDbInsert(vals)).then(resolve);
            return retChain;
          }),
        };
        return chain;
      },
      update: (...args: any[]) => {
        const chain: any = {
          set: vi.fn((vals) => {
            const retChain: any = {
              where: vi.fn(() => ({
                returning: vi.fn(() => mockDbUpdate(vals)),
              })),
            };
            return retChain;
          }),
        };
        return chain;
      },
      delete: (...args: any[]) => {
        const chain: any = {
          where: vi.fn(() => mockDbDelete(...args)),
        };
        return chain;
      },
      transaction: (cb: any) => mockDbTransaction(cb),
    },
  };
});

describe("FormsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbSelect.mockReset();
    mockDbInsert.mockReset();
    mockDbUpdate.mockReset();
    mockDbDelete.mockReset();
  });

  describe("create", () => {
    it("should prevent THE_SHADE from creating a form", async () => {
      mockDbSelect.mockResolvedValueOnce([{ role: "THE_SHADE", subscriptionTier: "free" }]);

      await expect(formsService.create("user_1", "Test Form", "test-form", "public")).rejects.toThrowError(
        new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions to create form" })
      );
    });

    it("should prevent Limbo tier from creating more than 4 forms", async () => {
      mockDbSelect.mockResolvedValueOnce([{ role: "THE_ARCHITECT", subscriptionTier: "free" }]); // Users query
      mockDbSelect.mockResolvedValueOnce([{ id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }]); // forms count query

      await expect(formsService.create("user_1", "Test Form", "test-form", "public")).rejects.toThrowError(
        new TRPCError({
          code: "FORBIDDEN",
          message: "Limbo tier is restricted to 4 dreamscapes. Upgrade to Architect to project more.",
        })
      );
    });

    it("should successfully create a form", async () => {
      mockDbSelect.mockResolvedValueOnce([{ role: "THE_ARCHITECT", subscriptionTier: "pro" }]);
      mockDbInsert.mockResolvedValueOnce([{ id: "form_123" }]); // form insert
      mockDbInsert.mockResolvedValueOnce([{ id: "analytics_123" }]); // analytics insert

      const result = await formsService.create("user_1", "Test Form", "test-form", "public");
      expect(result).toEqual({ id: "form_123" });
    });
  });

  describe("getById", () => {
    it("should throw FORBIDDEN if user has no role for the form", async () => {
      // getUserFormRole returns null because form is not owned and not a collaborator
      mockDbSelect.mockResolvedValueOnce([]); // form owner check
      mockDbSelect.mockResolvedValueOnce([]); // collaborator check

      await expect(formsService.getById("form_1", "user_1")).rejects.toThrowError(
        new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions to view form" })
      );
    });

    it("should return the form if user is owner", async () => {
      mockDbSelect.mockResolvedValueOnce([{ userId: "user_1" }]); // form owner check
      mockDbSelect.mockResolvedValueOnce([{ role: "THE_ARCHITECT" }]); // user role
      mockDbSelect.mockResolvedValueOnce([{ id: "form_1", title: "My Form" }]); // get form

      const result = await formsService.getById("form_1", "user_1");
      expect(result).toEqual({ id: "form_1", title: "My Form" });
    });
  });
});

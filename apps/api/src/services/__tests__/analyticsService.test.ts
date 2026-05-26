import { describe, it, expect, vi, beforeEach } from "vitest";
import { analyticsService } from "../analyticsService";
import { TRPCError } from "@trpc/server";

// Mock dependencies
vi.mock("../formsService", () => ({
  getUserFormRole: vi.fn(),
}));

const mockDbSelect = vi.fn();

vi.mock("@repo/database", () => {
  return {
    db: {
      select: (...args: any[]) => {
        const chain: any = {
          from: vi.fn(() => chain),
          where: vi.fn(() => chain),
          orderBy: vi.fn(() => chain),
          groupBy: vi.fn(() => chain),
          limit: vi.fn(() => mockDbSelect(...args)),
        };
        chain.then = (resolve: any) => Promise.resolve(mockDbSelect(...args)).then(resolve);
        return chain;
      },
    },
  };
});

describe("AnalyticsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbSelect.mockReset();
  });

  describe("getSummary", () => {
    it("should throw FORBIDDEN if user has no role", async () => {
      const { getUserFormRole } = await import("../formsService");
      vi.mocked(getUserFormRole).mockResolvedValueOnce(null);

      await expect(analyticsService.getSummary("form_1", "user_1")).rejects.toThrowError(
        new TRPCError({ code: "FORBIDDEN", message: "Access Revoked: Insufficient permissions to view analytics" })
      );
    });

    it("should throw FORBIDDEN if user is THE_SHADE", async () => {
      const { getUserFormRole } = await import("../formsService");
      vi.mocked(getUserFormRole).mockResolvedValueOnce("THE_SHADE");

      await expect(analyticsService.getSummary("form_1", "user_1")).rejects.toThrowError(
        new TRPCError({ code: "FORBIDDEN", message: "Access Revoked: Insufficient permissions to view analytics" })
      );
    });

    it("should return analytics summary for THE_ARCHITECT", async () => {
      const { getUserFormRole } = await import("../formsService");
      vi.mocked(getUserFormRole).mockResolvedValueOnce("THE_ARCHITECT");

      mockDbSelect.mockResolvedValueOnce([{ count: 100 }]); // views
      mockDbSelect.mockResolvedValueOnce([{ submissionsCount: 50, avgTimeToComplete: 120.5 }]); // responses

      const result = await analyticsService.getSummary("form_1", "user_1");
      expect(result).toEqual({
        viewsCount: 100,
        submissionsCount: 50,
        avgTimeToComplete: 121, // rounded
      });
    });
  });

  describe("getFieldDropoffs", () => {
    it("should return empty array if no fields exist", async () => {
      const { getUserFormRole } = await import("../formsService");
      vi.mocked(getUserFormRole).mockResolvedValueOnce("THE_ARCHITECT");

      mockDbSelect.mockResolvedValueOnce([]); // fields query

      const result = await analyticsService.getFieldDropoffs("form_1", "user_1");
      expect(result).toEqual([]);
    });

    it("should return filled and total counts for fields", async () => {
      const { getUserFormRole } = await import("../formsService");
      vi.mocked(getUserFormRole).mockResolvedValueOnce("THE_ARCHITECT");

      mockDbSelect.mockResolvedValueOnce([
        { id: "field_1", label: "Name", type: "short_text", required: true, order: 1 },
      ]); // fields query
      
      mockDbSelect.mockResolvedValueOnce([{ total: 10, field_1: 8 }]); // counts query

      const result = await analyticsService.getFieldDropoffs("form_1", "user_1");
      expect(result).toEqual([
        {
          fieldId: "field_1",
          label: "Name",
          type: "short_text",
          required: true,
          order: 1,
          filled: 8,
          total: 10,
        },
      ]);
    });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { compileFormSchema } from "../compileFormSchema";
import { z } from "zod";

// Mock the database
const mockOrderBy = vi.fn();
vi.mock("@repo/database", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: mockOrderBy,
        })),
      })),
    })),
  },
}));

describe("compileFormSchema", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should compile a basic schema with string fields", async () => {
    mockOrderBy.mockResolvedValueOnce([
      {
        id: "field_1",
        type: "short_text",
        required: true,
        validationRules: null,
      },
      {
        id: "field_2",
        type: "long_text",
        required: false,
        validationRules: null,
      },
    ]);

    const schema = await compileFormSchema("form_123");
    
    // Test parsing
    const validData = { field_1: "hello" };
    expect(() => schema.parse(validData)).not.toThrow();
    expect(schema.parse(validData)).toEqual({ field_1: "hello" });

    // field_1 is required
    const invalidData = { field_2: "world" };
    expect(() => schema.parse(invalidData)).toThrow();
  });

  it("should map each field type to the correct Zod primitive", async () => {
    mockOrderBy.mockResolvedValueOnce([
      { id: "f_short", type: "short_text", required: true, validationRules: null },
      { id: "f_email", type: "email", required: true, validationRules: null },
      { id: "f_num", type: "number", required: true, validationRules: null },
      { id: "f_single", type: "single_select", required: true, options: ["A", "B"] },
      { id: "f_multi", type: "multi_select", required: true, options: ["A", "B"] },
      { id: "f_rating", type: "rating", required: true, options: 5 },
      { id: "f_date", type: "date", required: true, validationRules: null },
      { id: "f_check", type: "checkbox", required: true, validationRules: null },
      { id: "f_break", type: "layer_break", required: false, validationRules: null },
    ]);

    const schema = await compileFormSchema("form_123");

    const validData = {
      f_short: "text",
      f_email: "test@example.com",
      f_num: 42,
      f_single: "A",
      f_multi: ["B"],
      f_rating: 4,
      f_date: "2024-01-01", // string date
      f_check: true,
    };

    expect(() => schema.parse(validData)).not.toThrow();

    // Check invalid types
    expect(() => schema.parse({ ...validData, f_email: "not-an-email" })).toThrow();
    expect(() => schema.parse({ ...validData, f_num: "not-a-number" })).toThrow(); // coerce might make "not-a-number" fail parse, actually z.coerce.number() returns NaN for "not-a-number", which fails z.number() depending on version, wait z.coerce.number() allows NaN? Zod coerce number parsing "invalid" gives a ZodError for invalid type.
    expect(() => schema.parse({ ...validData, f_single: "C" })).toThrow(); // Enum validation
  });

  it("should apply validation rules correctly", async () => {
    mockOrderBy.mockResolvedValueOnce([
      {
        id: "f_short",
        type: "short_text",
        required: true,
        validationRules: { minLength: 3, maxLength: 10, pattern: "^[a-z]+$" },
      },
      {
        id: "f_num",
        type: "number",
        required: true,
        validationRules: { min: 10, max: 100 },
      },
    ]);

    const schema = await compileFormSchema("form_123");

    // Valid
    expect(() => schema.parse({ f_short: "hello", f_num: 50 })).not.toThrow();

    // Invalid length
    expect(() => schema.parse({ f_short: "hi", f_num: 50 })).toThrow();
    expect(() => schema.parse({ f_short: "hellooooooooo", f_num: 50 })).toThrow();

    // Invalid pattern
    expect(() => schema.parse({ f_short: "Hello", f_num: 50 })).toThrow(); // uppercase

    // Invalid number range
    expect(() => schema.parse({ f_short: "hello", f_num: 5 })).toThrow();
    expect(() => schema.parse({ f_short: "hello", f_num: 150 })).toThrow();
  });

  it("should gracefully handle missing options for select types", async () => {
    mockOrderBy.mockResolvedValueOnce([
      { id: "f_single", type: "single_select", required: true, options: null },
      { id: "f_multi", type: "multi_select", required: true, options: [] },
    ]);

    const schema = await compileFormSchema("form_123");

    // Falls back to z.string() and z.array(z.string())
    const validData = {
      f_single: "Any string",
      f_multi: ["Any", "String"],
    };

    expect(() => schema.parse(validData)).not.toThrow();
  });
});

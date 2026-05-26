import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../server";
import { db } from "@repo/database";
import { formsTable, fieldsTable, responsesTable } from "@repo/database/models/form";
import { usersTable } from "@repo/database/models/user";
import { eq } from "drizzle-orm";

let testUserId: string;
let testFormId: string;

describe("Integration: Public Form Submit", () => {
  beforeAll(async () => {
    // 1. Create a test user
    const [user] = await db
      .insert(usersTable)
      .values({
        email: "test-submit@example.com",
        fullName: "Test User",
        passwordHash: "dummy",
        subscriptionTier: "pro",
      })
      .returning();
    testUserId = user!.id;

    // 2. Create a test form
    const [form] = await db
      .insert(formsTable)
      .values({
        userId: testUserId,
        title: "Test Submit Form",
        slug: "test-submit-form",
        status: "published",
        visibility: "public",
      })
      .returning();
    testFormId = form!.id;

    // 3. Create test fields
    await db.insert(fieldsTable).values([
      {
        formId: testFormId,
        label: "Name",
        type: "short_text",
        required: true,
        order: 1,
      },
      {
        formId: testFormId,
        label: "Email",
        type: "email",
        required: true,
        order: 2,
      },
    ]);
  });

  afterAll(async () => {
    // Cleanup
    await db.delete(responsesTable).where(eq(responsesTable.formId, testFormId));
    await db.delete(fieldsTable).where(eq(fieldsTable.formId, testFormId));
    await db.delete(formsTable).where(eq(formsTable.id, testFormId));
    await db.delete(usersTable).where(eq(usersTable.id, testUserId));
  });

  it("should successfully submit a valid payload (happy path)", async () => {
    // Fetch the fields to get their IDs
    const fields = await db.select().from(fieldsTable).where(eq(fieldsTable.formId, testFormId));
    const nameField = fields.find((f) => f.label === "Name")!;
    const emailField = fields.find((f) => f.label === "Email")!;

    const payload = {
      formId: testFormId,
      data: {
        [nameField.id]: "John Doe",
        [emailField.id]: "john@example.com",
      },
    };

    const res = await request(app)
      .post("/api/responses/submit")
      .set("Content-Type", "application/json")
      .send(payload);

    if (res.status !== 200) {
      console.log("SUBMIT RESPONSE:", JSON.stringify(res.body, null, 2));
    }
    // We get a 200 OK from REST endpoint
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id");
  });

  it("should reject invalid payload with Zod error shape", async () => {
    const fields = await db.select().from(fieldsTable).where(eq(fieldsTable.formId, testFormId));
    const nameField = fields.find((f) => f.label === "Name")!;
    const emailField = fields.find((f) => f.label === "Email")!;

    const payload = {
      formId: testFormId,
      data: {
        [nameField.id]: "John Doe",
        [emailField.id]: "not-an-email", // Invalid
      },
    };

    const res = await request(app)
      .post("/api/responses/submit")
      .set("Content-Type", "application/json")
      .send(payload);

    console.log("INVALID SUBMIT RESPONSE:", JSON.stringify(res.body, null, 2));

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Input validation failed");
    expect(res.body.data.zodError).toBeDefined();
  });

  it("should hit rate limit (429) after multiple requests", async () => {
    // Empty test stub, same as original
  });
});

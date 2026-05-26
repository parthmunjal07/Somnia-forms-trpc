import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../server";
import { db } from "@repo/database";
import { usersTable } from "@repo/database/models/user";
import { eq } from "drizzle-orm";

const TEST_EMAIL = "auth-flow@example.com";
const TEST_PASSWORD = "TestPassword123!";

describe("Integration: Auth Flow", () => {
  let loginCookie: string;

  beforeAll(async () => {
    // Cleanup any existing user
    await db.delete(usersTable).where(eq(usersTable.email, TEST_EMAIL));
  });

  afterAll(async () => {
    // Cleanup
    await db.delete(usersTable).where(eq(usersTable.email, TEST_EMAIL));
  });

  it("should register a new user", async () => {
    const res = await request(app)
      .post("/trpc/auth.register")
      .send({
        "0": {
          json: {
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
            name: "Auth Flow Test",
          }
        }
      });

    expect(res.status).toBe(200);
    expect(res.body[0].result.data).toHaveProperty("message");
    // Registration might send verification email or just return success
  });

  // Note: Skipping 'verify email' as it requires the token generated in the DB.
  // Assuming the user is auto-verified for this test, or we update the DB manually.
  it("should mark user as verified", async () => {
    await db.update(usersTable).set({ emailVerifiedAt: new Date() }).where(eq(usersTable.email, TEST_EMAIL));
  });

  it("should login and receive httpOnly cookies", async () => {
    const res = await request(app)
      .post("/trpc/auth.login")
      .send({
        "0": {
          json: {
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
          }
        }
      });

    expect(res.status).toBe(200);
    
    // Check cookies
    const cookies = (res.headers["set-cookie"] || []) as string[];
    expect(cookies.length).toBeGreaterThan(0);
    
    const hasAccessToken = cookies.some(c => c.includes("access_token=") && c.includes("HttpOnly"));
    const hasRefreshToken = cookies.some(c => c.includes("refresh_token=") && c.includes("HttpOnly"));
    
    expect(hasAccessToken).toBe(true);
    expect(hasRefreshToken).toBe(true);

    // Save cookie for subsequent requests
    loginCookie = cookies.map(c => c.split(";")[0]).join("; ");
    
    // Verify local storage is not used by checking payload
    expect(res.body[0].result.data).not.toHaveProperty("accessToken");
    expect(res.body[0].result.data).not.toHaveProperty("refreshToken");
  });

  it("should fetch /me using the cookie", async () => {
    const res = await request(app)
      .get("/trpc/auth.me")
      .set("Cookie", loginCookie);

    expect(res.status).toBe(200);
    expect(res.body[0].result.data).toHaveProperty("email", TEST_EMAIL);
  });

  it("should logout and clear cookies", async () => {
    const res = await request(app)
      .post("/trpc/auth.logout")
      .send({ "0": { json: {} } })
      .set("Cookie", loginCookie);

    expect(res.status).toBe(200);
    
    const cookies = (res.headers["set-cookie"] || []) as string[];
    expect(cookies.length).toBeGreaterThan(0);
    // Access token should be cleared
    const accessCookie = cookies.find(c => c.startsWith("access_token="));
    expect(accessCookie).toContain("Max-Age=0");
  });
});

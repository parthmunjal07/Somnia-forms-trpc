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
      .post("/api/auth/register")
      .send({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        fullName: "Auth Flow Test",
      });

    if (res.status !== 200) {
      console.log("REGISTER RESPONSE:", JSON.stringify(res.body, null, 2));
    }
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message");
  });

  it("should mark user as verified", async () => {
    await db.update(usersTable).set({ emailVerifiedAt: new Date() }).where(eq(usersTable.email, TEST_EMAIL));
  });

  it("should login and receive httpOnly cookies", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

    if (res.status !== 200) {
      console.log("LOGIN RESPONSE:", JSON.stringify(res.body, null, 2));
    }
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
    expect(res.body).not.toHaveProperty("accessToken");
    expect(res.body).not.toHaveProperty("refreshToken");
    expect(res.body).toHaveProperty("user");
  });

  it("should fetch /me using the cookie", async () => {
    const res = await request(app)
      .post("/api/auth/me")
      .set("Content-Type", "application/json")
      .set("Cookie", loginCookie)
      .send();

    if (res.status !== 200) {
      console.log("ME RESPONSE:", JSON.stringify(res.body, null, 2));
    }
    expect(res.status).toBe(200);
    expect(res.body.user).toHaveProperty("email", TEST_EMAIL);
  });

  it("should logout and clear cookies", async () => {
    const res = await request(app)
      .post("/api/auth/logout")
      .set("Content-Type", "application/json")
      .set("Cookie", loginCookie)
      .send();

    expect(res.status).toBe(200);
    
    const cookies = (res.headers["set-cookie"] || []) as string[];
    expect(cookies.length).toBeGreaterThan(0);
    // Access token should be cleared
    const accessCookie = cookies.find(c => c.startsWith("access_token="));
    expect(accessCookie).toContain("Expires=Thu, 01 Jan 1970 00:00:00 GMT");
  });
});

import "dotenv/config";
import { beforeAll, afterAll } from "vitest";

// Here we can run global setup logic like starting a separate test DB
// or running migrations. For this implementation, we will use the existing
// Database connection from .env, but ensure it cleans up.

beforeAll(async () => {
  // Initialization if required
});

afterAll(async () => {
  // Close database connections after all tests finish
  const { pool } = await import("@repo/database");
  await pool.end();
});

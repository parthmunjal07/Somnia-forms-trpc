import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: ["node_modules", "dist", "src/__tests__/integration/**/*.ts"],
    env: {
      NODE_ENV: "development",
      JWT_SECRET: "test-secret-that-is-at-least-32-characters-long",
      FRONTEND_URL: "http://localhost:3000",
      ALLOWED_ORIGINS: "http://localhost:3000",
      DATABASE_URL: "postgres://user:pass@localhost:5432/db",
    },
  },
});

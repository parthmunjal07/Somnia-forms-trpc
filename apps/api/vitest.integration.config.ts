import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/__tests__/integration/**/*.test.ts"],
    setupFiles: ["./src/__tests__/integration/setup.ts"],
    hookTimeout: 30000,
    testTimeout: 30000,
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    env: {
      NODE_ENV: "development",
      JWT_SECRET: "test-secret-that-is-at-least-32-characters-long",
      FRONTEND_URL: "http://localhost:3000",
      ALLOWED_ORIGINS: "http://localhost:3000",
      DATABASE_URL: "postgresql://somnia:somnia@127.0.0.1:5432/form",
    },
  },
});

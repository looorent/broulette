import path from "path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/features/**/*.ts", "src/features/**/*.tsx"],
      exclude: [
        "src/features/**/index.ts",
        "src/features/**/types.ts",
        "src/features/**/*.test.ts",
        "src/features/**/*.test.tsx"
      ]
    }
  },
  resolve: {
    alias: {
      "@persistence": path.resolve(__dirname, "./src/features/db.server/index.ts"),
      "@features": path.resolve(__dirname, "./src/features"),
      "@routes": path.resolve(__dirname, "./src/routes"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@config/server": path.resolve(__dirname, "./src/config.server.ts"),
      "@config": path.resolve(__dirname, "./src/config.ts")
    }
  }
});

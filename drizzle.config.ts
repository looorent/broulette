import { defineConfig, } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/features/db.server/schema.ts",
  dialect: "sqlite",
  driver: "d1-http"
});

import { defineConfig, } from "drizzle-kit";

// only used to run the studio locally
export default defineConfig({
  out: "./drizzle",
  schema: "./src/features/db.server/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DB_PATH || "db.sqlite"
  },
});

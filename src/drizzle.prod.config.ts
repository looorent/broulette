import { defineConfig, } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./app/features/db.server/schema.ts",
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    databaseId: process.env.BROULETTE_CF_DATABASE_ID,
    accountId: process.env.BROULETTE_CF_ACCOUNT_ID,
    token: process.env.BROULETTE_CF_TOKEN,
    url: ""
  }
});

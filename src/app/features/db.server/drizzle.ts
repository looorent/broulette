import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";

import * as schema from "./schema";

export type DrizzleClient = DrizzleD1Database<typeof schema>;

export function getDrizzle(env: Env): DrizzleClient {
  return drizzle(env.DB, { schema: schema });
}

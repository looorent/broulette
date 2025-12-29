import { createRequestHandler } from "react-router";

import { getPrisma, type ExtendedPrismaClient } from "@features/db.server";
import { createAppSessionStorage } from "@features/session.server";

import { createAppContext } from "../app/config.server";

declare module "react-router" {
  interface AppLoadContext {
    config: ReturnType<typeof createAppContext>;
    sessionStorage: ReturnType<typeof createAppSessionStorage>;
    db: ExtendedPrismaClient,
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE
);

export default {
  async fetch(request, env, ctx) {
    const sessionStorage = createAppSessionStorage(
      env.BROULETTE_SESSION_SECRET,
      env.BROULETTE_SESSION_SECURE?.toLowerCase() === "true"
    );

    const prisma = await getPrisma(env);

    return requestHandler(request, {
      config: createAppContext(env),
      sessionStorage: sessionStorage,
      cloudflare: { env, ctx },
      db: prisma
    });
  },
} satisfies ExportedHandler<Env>;

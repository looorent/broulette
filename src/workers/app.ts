import { createRequestHandler } from "react-router";

import { createDrizzleRepositories, createPrismaRepositories, type DatabaseRepositories } from "@features/db.server";
import { createAppSessionStorage, createCSRFToken } from "@features/session.server";
import { getLocale } from "@features/utils/locale.server";

import { createAppContext } from "../app/config.server";

declare module "react-router" {
  interface AppLoadContext {
    config: ReturnType<typeof createAppContext>;
    sessionStorage: ReturnType<typeof createAppSessionStorage>;
    repositories: DatabaseRepositories,
    repositories2: DatabaseRepositories,
    locale: string;
    csrf: {
      token: string;
      headers: HeadersInit | undefined;
    };
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

    const { token, headers: csrfHeaders } = await createCSRFToken(request.headers, sessionStorage);

    return requestHandler(request, {
      config: createAppContext(env),
      sessionStorage: sessionStorage,
      cloudflare: { env, ctx },
      locale: await getLocale(request),
      csrf: {
        token: token,
        headers: csrfHeaders
      },
      repositories: await createPrismaRepositories(env),
      repositories2: await createDrizzleRepositories(env)
    });
  },
} satisfies ExportedHandler<Env>;

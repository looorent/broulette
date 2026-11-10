import { createRequestHandler, RouterContextProvider } from "react-router";

import { createAppSessionStorage, createCSRFToken } from "@features/session.server";
import { getLocale } from "@features/utils/locale.server";
import { createRepositories } from "@persistence";

import { createAppContext } from "../src/config.server";
import { requestContext } from "../src/request-context.server";

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

    const context = new RouterContextProvider();
    context.set(requestContext, {
      config: createAppContext(env),
      sessionStorage: sessionStorage,
      cloudflare: { env, ctx },
      locale: await getLocale(request),
      csrf: {
        token: token,
        headers: csrfHeaders
      },
      repositories: await createRepositories(env)
    });

    return requestHandler(request, context);
  },
} satisfies ExportedHandler<Env>;

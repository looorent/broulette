import { createContext } from "react-router";

import type { createAppSessionStorage } from "@features/session.server";
import type { DatabaseRepositories } from "@persistence";

import type { createAppContext } from "./config.server";

export interface RequestContext {
  config: ReturnType<typeof createAppContext>;
  sessionStorage: ReturnType<typeof createAppSessionStorage>;
  repositories: DatabaseRepositories,
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

export const requestContext = createContext<RequestContext>();

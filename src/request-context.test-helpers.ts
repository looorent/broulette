import { RouterContextProvider } from "react-router";

import { requestContext, type RequestContext } from "./request-context.server";

export function createTestRouterContext(values: unknown): RouterContextProvider {
  const context = new RouterContextProvider();
  context.set(requestContext, values as RequestContext);
  return context;
}

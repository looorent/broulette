import type { SessionStorage } from "react-router";

import { logger } from "@features/utils/logger";

import type { SessionData, SessionFlashData } from "./session";

const HEADER_NAME = "X-CSRF-Token";
export const CSRF_KEY = "csrf";

export async function validateCSRF(
  data: FormData,
  headers: Headers,
  sessionStorage: SessionStorage<SessionData, SessionFlashData>
) {
  logger.debug("[CSRF] Validating...");
  const session = await sessionStorage.getSession(headers.get("Cookie"));
  logger.debug("[CSRF] Validating. Searching session.");
  const sessionToken = session.get(CSRF_KEY);
  logger.debug("[CSRF] Validating. Session token found: %s", sessionToken);

  if (sessionToken) {
    let receivedToken: string | null = null;
    if (headers.has(HEADER_NAME)) {
      receivedToken = headers.get(HEADER_NAME);
    } else if (data instanceof FormData) {
      receivedToken = data.get(CSRF_KEY) as string;
    }

    if (!receivedToken || receivedToken !== sessionToken) {
      logger.error("[CSRF] Validating. Failed.", receivedToken);
      throw new Response("Invalid CSRF Token", { status: 403 });
    } else {
      logger.log("[CSRF] Validating. Success.");
    }
  } else {
    logger.error("[CSRF] Validating. Failed. Missing session token");
    throw new Response("Missing Session Token", { status: 403 });
  }
}

export async function createCSRFToken(headers: Headers, sessionStorage: SessionStorage<SessionData, SessionFlashData>): Promise<{
  token: string;
  headers: HeadersInit | undefined;
}> {
  const session = await sessionStorage.getSession(headers.get("Cookie"));

  if (session.has(CSRF_KEY)) {
    return {
      token: session.get(CSRF_KEY) as string,
      headers: undefined
    };
  } else {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const token = [...array].map(b => b.toString(16).padStart(2, "0")).join("");
    session.set(CSRF_KEY, token);
    return {
      token,
      headers: { "Set-Cookie": await sessionStorage.commitSession(session) }
    };
  }
}

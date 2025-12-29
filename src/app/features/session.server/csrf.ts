import type { SessionStorage } from "react-router";

import type { SessionData, SessionFlashData } from "./session";

const HEADER_NAME = "X-CSRF-Token";
export const CSRF_KEY = "csrf";

export async function validateCSRF(
  data: FormData,
  headers: Headers,
  sessionStorage: SessionStorage<SessionData, SessionFlashData>
) {
  const session = await sessionStorage.getSession(headers.get("Cookie"));
  const sessionToken = session.get(CSRF_KEY);

  if (sessionToken) {
    let receivedToken: string | null = null;
    if (headers.has(HEADER_NAME)) {
      receivedToken = headers.get(HEADER_NAME);
    } else if (data instanceof FormData) {
      receivedToken = data.get(CSRF_KEY) as string;
    }

    if (!receivedToken || receivedToken !== sessionToken) {
      throw new Response("Invalid CSRF Token", { status: 403 });
    }
  } else {
    throw new Response("Missing Session Token", { status: 403 });
  }
}

export async function createCSRFToken(headers: Headers, sessionStorage: SessionStorage<SessionData, SessionFlashData>) {
  const session = await sessionStorage.getSession(headers.get("Cookie"));

  if (session.has(CSRF_KEY)) {
    return {
      token: session.get(CSRF_KEY) as string,
      headers: null
    };
  } else {
    const array = new Uint8Array(32);
    // crypto.getRandomValues(array);
    const token = [...array].map(b => b.toString(16).padStart(2, "0")).join("");
    session.set(CSRF_KEY, token);
    return {
      token,
      headers: { "Set-Cookie": await sessionStorage.commitSession(session) }
    };
  }
}

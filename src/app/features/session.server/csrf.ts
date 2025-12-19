import { randomBytes } from "crypto";
import { commitSession, getSession } from "./session";

const HEADER_NAME = "X-CSRF-Token";
export const CSRF_KEY = "csrf";

export async function validateCSRF(data: FormData, headers: Headers) {
  const session = await getSession(headers.get("Cookie"));
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

export async function createCSRFToken(headers: Headers) {
  const session = await getSession(headers.get("Cookie"));

  if (session.has(CSRF_KEY)) {
    return {
      token: session.get(CSRF_KEY) as string,
      headers: null
    };
  } else {
    const token = randomBytes(32).toString("hex");
    session.set(CSRF_KEY, token);
    return {
      token,
      headers: { "Set-Cookie": await commitSession(session) }
    };
  }
}

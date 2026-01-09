import { createCookieSessionStorage, type SessionStorage } from "react-router";

export type SessionData = {
  csrf: string;
};

export type SessionFlashData = {
  error: string;
};

export function createAppSessionStorage(
  secret: string,
  secure: boolean
): SessionStorage<SessionData, SessionFlashData> {
  return createCookieSessionStorage({
    cookie: {
      name: "__session",
      httpOnly: true,
      maxAge: 60 * 60 * 24,
      path: "/",
      sameSite: "lax",
      secrets: [secret],
      secure: secure
    },
  });
}

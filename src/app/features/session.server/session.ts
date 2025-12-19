import { createCookieSessionStorage } from "react-router";

type SessionData = {
  csrf: string;
};

type SessionFlashData = {
  error: string;
};

export const { getSession, commitSession, destroySession } = createCookieSessionStorage<SessionData, SessionFlashData>({
  cookie: {
    name: "__session",
    httpOnly: true,
    maxAge: 60 * 60 * 24,
    path: "/",
    sameSite: "lax",
    secrets: [process.env.BROULETTE_SESSION_SECRET ?? ""],
    secure: process.env.NODE_ENV === "production"
  },
});

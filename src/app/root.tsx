import {
  data,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  type ShouldRevalidateFunction
} from "react-router";

import { SearchLoader, SearchLoaderProvider, useSearchLoader } from "@components/search-loader";

import type { Route } from "./+types/root";
import "./app.css";

export const shouldRevalidate: ShouldRevalidateFunction = ({
  currentUrl,
  nextUrl,
  defaultShouldRevalidate,
}) => {
  if (!defaultShouldRevalidate) {
    return false;
  } else {
    const currentSearch = new URLSearchParams(currentUrl.search);
    const nextSearch = new URLSearchParams(nextUrl.search);
    currentSearch.delete("modal");
    nextSearch.delete("modal");

    return currentSearch.toString() !== nextSearch.toString() || defaultShouldRevalidate;
  }
};

export async function loader({ context }: Route.LoaderArgs) {
  return data({
    locale: context.locale,
    csrfToken: context.csrf.token
  }, {
    headers: context.csrf.headers
  });
}

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useLoaderData<typeof loader>();
  const locale = data?.locale || "en";

  return (
    <html lang={locale} className={`
      h-full w-full overflow-hidden bg-fun-dark select-none
    `}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />

        <title>BiteRoulette</title>
        <meta name="description" content="The lazy way to decide where to eat." />

        {/* PWA Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BiteRoulette" />
        <meta name="theme-color" content="#D64035" />
        <link rel="manifest" href="/manifest.webmanifest" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.biteroulette.com/" />
        <meta property="og:title" content="BiteRoulette" />
        <meta property="og:description" content="The lazy way to decide where to eat. Spin the wheel and find your next meal!" />
        <meta property="og:image" content="https://biteroulette.app/pwa-512x512.png" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://www.biteroulette.com/" />
        <meta name="twitter:title" content="BiteRoulette" />
        <meta name="twitter:description" content="The lazy way to decide where to eat. Spin the wheel and find your next meal!" />
        <meta name="twitter:image" content="https://www.biteroulette.com/pwa-512x512.png" />

        <Meta />
        <Links />
      </head>
      <body className={`
        flex h-full w-full items-center justify-center overflow-hidden
        bg-slate-900
      `}>
        <div className={`
          relative h-full w-full overflow-hidden bg-fun-red
          bg-[radial-gradient(circle_at_20%_80%,rgba(255,209,102,0.6)_0%,transparent_40%),radial-gradient(circle_at_80%_20%,rgba(6,214,160,0.5)_0%,transparent_40%),conic-gradient(from_45deg_at_50%_50%,rgba(232,90,79,0.2)_0deg,rgba(255,209,102,0.2)_120deg,rgba(232,90,79,0.2)_240deg),linear-gradient(135deg,#D64035_0%,#A33028_100%)]
          background-blend
          md:h-[85vh] md:max-w-120 md:rounded-xl md:shadow-2xl
        `}>
          <SearchLoaderProvider>
            {children}
          </SearchLoaderProvider>
        </div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const { state: loaderState } = useSearchLoader();
  return (
    <>
      <SearchLoader
        visible={loaderState.visible}
        title={loaderState.message} />

      <div
        aria-hidden={loaderState.visible}
        inert={loaderState.visible ? true : undefined}
        className={`
          h-full w-full
          ${loaderState.visible ? "hidden": "block"}
        `}>
        <Outlet />
      </div>
    </>
  );
}

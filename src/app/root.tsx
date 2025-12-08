import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  type Navigation
} from "react-router";

import "./app.css";
import { SearchLoaderProvider, useSearchLoader } from "./components/search-loader/context";
import { SearchLoader } from "./components/search-loader/search-loader";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full w-full overflow-hidden bg-fun-dark select-none">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />

        <meta title="BiteRoulette" />
        <meta name="description" content="The lazy way to decide where to eat." />

         {/* PWA Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#D64035" />

        <Meta />
        <Links />
      </head>
      <body className="flex items-center justify-center h-full w-full overflow-hidden bg-slate-900">
        <div className="
          relative
          w-full h-full
          md:max-w-[480px]
          md:shadow-2xl
          md:h-[85vh]
          md:rounded-3xl

          bg-fun-red
          bg-[radial-gradient(circle_at_20%_80%,rgba(255,209,102,0.6)_0%,transparent_40%),radial-gradient(circle_at_80%_20%,rgba(6,214,160,0.5)_0%,transparent_40%),conic-gradient(from_45deg_at_50%_50%,rgba(232,90,79,0.2)_0deg,rgba(255,209,102,0.2)_120deg,rgba(232,90,79,0.2)_240deg),linear-gradient(135deg,#D64035_0%,#A33028_100%)]
          bg-fixed
          background-blend
          overflow-hidden">
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

// function mustDisplayLoader(navigation: Navigation): boolean {
//   const isRedirecting =
//     navigation.state === "loading" &&
//     navigation.formMethod != null;

//   const isSubmittingSearch =
//     navigation.state === "submitting"
//     && (navigation.formAction?.startsWith("/searches"));

//   // console.log("navigation.state", navigation.state);
//   // console.log("navigation.formMethod", navigation.formMethod);
//   // console.log("navigation.location", navigation.location);
//   return isRedirecting || isSubmittingSearch;
// }

export default function App() {
  const { state } = useSearchLoader();
  return (
    <>
      {state.visible && (
        <SearchLoader title={state.message} />
      )}

      <div
        aria-hidden={state.visible}
        inert={state.visible}
        className={`
          h-full w-full
          ${state.visible ? "none": "block"}
        `}>
        <Outlet />
      </div>
    </>
  );
}

// TODO
// export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
//   let message = "Oops!";
//   let details = "An unexpected error occurred.";
//   let stack: string | undefined;

//   if (isRouteErrorResponse(error)) {
//     message = error.status === 404 ? "404" : "Error";
//     details =
//       error.status === 404
//         ? "The requested page could not be found."
//         : error.statusText || details;
//   } else if (import.meta.env.DEV && error && error instanceof Error) {
//     details = error.message;
//     stack = error.stack;
//   }

//   return (
//     <main className="pt-16 p-4 container mx-auto">
//       <h1>{message}</h1>
//       <p>{details}</p>
//       {stack && (
//         <pre className="w-full p-4 overflow-x-auto">
//           <code>{stack}</code>
//         </pre>
//       )}
//     </main>
//   );
// }

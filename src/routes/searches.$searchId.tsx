import { useEffect, useState } from "react";
import { href, redirect, useNavigate, useRouteLoaderData } from "react-router";

import { ErrorUnknown } from "@components/error/error-unknown";
import { useSearchLoader } from "@components/search-loader";
import { getLocale } from "@features/utils/locale.server";
import { findSearchViewModel } from "@features/view.server";
import type { loader as rootLoader } from "src/root";

import type { Route } from "./+types/searches.$searchId";

export async function loader({ params, request, context }: Route.LoaderArgs) {
  const view = await findSearchViewModel(params.searchId, await getLocale(request), context.repositories.search);
  if (view) {
    if (view.redirectRequired) {
      return redirect(href("/searches/:searchId/candidates/:candidateId", { searchId: view.searchId, candidateId: view.latestCandidateId }));
    } else {
      return {
        view: view,
        newCandidateUrl: href("/searches/:searchId/candidates", { searchId: view.id })
      };
    }
  } else {
    console.error(`No candidate found for searchId='${params.searchId}'`);
    return redirect(href("/"));
  }
}

export default function SearchPage({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const { setLoaderMessage, setLoaderStreaming } = useSearchLoader();
  const session = useRouteLoaderData<typeof rootLoader>("root");
  const { view, newCandidateUrl } = loaderData;
  const [_, setMessages] = useState<string[]>([]);

  useEffect(() => {
    const abortController = new AbortController();

    async function streamSearch() {
      try {
        const formData = new FormData();
        formData.append("csrf", session?.csrfToken ?? "");

        setLoaderStreaming(true);
        const response = await fetch(newCandidateUrl, {
          method: "POST",
          body: formData,
          signal: abortController.signal,
          headers: { "Accept": "text/event-stream" }
        });

        if (!response.body) {
          throw new Error("No stream body");
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let hasRedirected = false; // Flag to stop processing after redirect

        for await (const value of response.body) {
          if (hasRedirected) {
            // If we've already redirected, we should not process any more data.
            // The abort signal will eventually stop the stream, and the
            // catch block will handle the AbortError.
            continue;
          }
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          // Split by standard SSE double newline
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || ""; // Keep the last partial chunk

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const jsonStr = line.replace("data: ", "");
              try {
                const data = JSON.parse(jsonStr);

                // --- HANDLE EVENTS ---
                if (data.type === "searching" || data.type === "exhausted" || data.type === "batch-discovered" || data.type === "looking-for-fallbacks") {
                  setLoaderMessage(data.message);
                  setMessages((prev) => [...prev, data.message]);
                } else if (data.type === "checking-restaurant") {
                  const message = `${data.restaurantName} ?!?`;
                  setLoaderMessage(message);
                  setMessages((prev) => [...prev, message]);
                } else if (data.type === "redirect") {
                  setLoaderStreaming(false);
                  navigate(data.url, { viewTransition: true, replace: true });
                  hasRedirected = true; // Corrected
                }
              } catch (e) {
                setLoaderStreaming(false);
                console.warn("Stream parse error", e);
              }
            }
          }
        }
      } catch (error: any) {
        setLoaderStreaming(false);
        if (error.name === "AbortError") {
          console.log("Stream aborted (cleanup)");
          return;
        } else {
          console.error("Streaming failed", error);
        }
      }
    }

    const timeoutId = setTimeout(() => {
      setLoaderStreaming(false);
      streamSearch();
    }, 50);
    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [newCandidateUrl, session?.csrfToken, navigate, setLoaderStreaming, setLoaderMessage]);

  return (
    <title>{`BiteRoulette - ${view.label} - Searching...`}</title>
  );
}

export function ErrorBoundary({
  error,
}: Route.ErrorBoundaryProps) {
  console.error("[POST search] Unexpected error", error);
  return (
    <ErrorUnknown />
  );
}

import { useEffect } from "react";
import { href, redirect, useNavigate, useRouteLoaderData } from "react-router";

import { ErrorUnknown } from "@components/error/error-unknown";
import { useSearchLoader } from "@components/search-loader";
import type { SearchStreamEvent } from "@features/search-engine.server";
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

        const redirectUrl = await processStream(
          response.body.getReader(),
          (event) => handleStreamEvent(event, setLoaderMessage),
          () => setLoaderStreaming(false)
        );

        if (redirectUrl) {
          setLoaderStreaming(false);
          navigate(redirectUrl, { viewTransition: true, replace: true });
        }
      } catch (error: any) {
        setLoaderStreaming(false);
        if (error.name === "AbortError") {
          console.log("[Search engine] Stream aborted (cleanup)");
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
  }, [newCandidateUrl, session?.csrfToken, navigate, setLoaderStreaming, setLoaderMessage, setMessages]);

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

function handleStreamEvent(
  event: SearchStreamEvent,
  setLoaderMessage: (message: string) => void
): string | undefined {
  if (event.type === "searching" || event.type === "exhausted" || event.type === "batch-discovered" || event.type === "looking-for-fallbacks") {
    setLoaderMessage(event.message);
    return undefined;
  } else if (event.type === "checking-restaurants") {
    const messages = event.restaurantNames?.map(restaurantName => `${restaurantName} ?!?`) || [];
    messages.forEach(setLoaderMessage);
    return undefined;
  } else if (event.type === "redirect") {
    return event.url;
  }
}

async function processStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onEvent: (event: SearchStreamEvent) => string | undefined,
  onParseError: () => void
): Promise<string | undefined> {
  const decoder = new TextDecoder();
  let buffer = "";
  let streamFinished = false;
  let redirectUrl: string | undefined;

  while (!streamFinished && !redirectUrl) {
    const { value, done: readerDone } = await reader.read();
    streamFinished = readerDone;

    if (value) {
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const jsonStr = line.replace("data: ", "");
          try {
            const event = JSON.parse(jsonStr) as SearchStreamEvent;
            redirectUrl = onEvent(event);
          } catch (e) {
            onParseError();
            console.warn("[Search engine] Stream parse error", e);
          }
        }
      }
    }
  }
  return redirectUrl;
}

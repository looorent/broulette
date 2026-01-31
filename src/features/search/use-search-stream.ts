import { useCallback } from "react";
import { useNavigate } from "react-router";

import { useSearchLoader } from "@components/search-loader";
import type { SearchStreamEvent } from "@features/search-engine.server";
import { logger } from "@features/utils/logger";
import { sleep } from "@features/utils/time";

export function useSearchStream() {
  const navigate = useNavigate();
  const { setLoaderMessage, setLoaderStreaming } = useSearchLoader();

  const streamSearch = useCallback(async (url: string, csrfToken: string, signal?: AbortSignal) => {
    try {
      const formData = new FormData();
      formData.append("csrf", csrfToken);

      setLoaderStreaming(true);
      const response = await fetch(url, {
        method: "POST",
        body: formData,
        signal: signal,
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
        logger.log("[Search engine] Stream aborted (cleanup)");
      } else {
        logger.error("Streaming failed", error);
      }
    }
  }, [navigate, setLoaderMessage, setLoaderStreaming]);

  return { streamSearch };
}

async function handleStreamEvent(
  event: SearchStreamEvent,
  setLoaderMessage: (message: string, instant?: boolean) => void
): Promise<string | undefined> {
  if (event.type === "searching" || event.type === "exhausted" || event.type === "batch-discovered" || event.type === "looking-for-fallbacks") {
    setLoaderMessage(event.message);
  } else if (event.type === "checking-restaurants") {
    const messages = event.restaurantNames?.map(restaurantName => `${restaurantName} ?!?`) || [];
    messages.forEach(message => setLoaderMessage(message));
  } else if (event.type === "redirect") {
    setLoaderMessage("Bingo!", true);
    await sleep(1000);
    return event.url;
  }
  return undefined;
}

async function processStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onEvent: (event: SearchStreamEvent) => Promise<string | undefined>,
  onParseError: () => void
): Promise<string | undefined> {
  const decoder = new TextDecoder();
  let buffer = "";
  let streamFinished = false;
  let redirectUrl: string | undefined;

  try {
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
              redirectUrl = await onEvent(event);
            } catch (e) {
              onParseError();
              logger.warn("[Search engine] Stream parse error", e);
            }
          }
        }
      }
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  return redirectUrl;
}

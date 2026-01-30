import { href, redirect } from "react-router";

import { searchCandidate, type SearchStreamEvent } from "@features/search-engine.server";
import { validateCSRF } from "@features/session.server";
import { getLocale } from "@features/utils/locale.server";
import { sleep } from "@features/utils/time";

import type { Route } from "./+types/searches.$searchId_.candidates._index";

export async function action({
  request,
  params,
  context
}: Route.ActionArgs) {
  try {
    if (!context.config) {
      throw new Error("AppContext is not initialized.");
    }
    const formData = await request.formData();
    await validateCSRF(formData, request.headers, context.sessionStorage);
    const data = parseAndValidate(formData, params, await getLocale(request));

    const { readable, writable } = new TransformStream<Uint8Array>();
    const writer = writable.getWriter();

    streamSearchResults(writer, request.signal, data, context);

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Content-Encoding": "none"
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function loader({ params }: Route.LoaderArgs) {
  return redirect(href("/searches/:searchId/candidates/:candidateId", {
    searchId: params.searchId,
    candidateId: "latest"
  }));
}


async function waitToGiveThrottlingExperience(startTime: number, minimumDurationInMillis: number = 5_000) {
  const elapsedTime = Date.now() - startTime;
  const remainingTime = minimumDurationInMillis - elapsedTime;
  if (remainingTime > 0) {
    await sleep(remainingTime);
  }
}

function parseAndValidate(
  _formData: FormData,
  params: { searchId: string | undefined; },
  locale: string
): {
  searchId: string;
  locale: string;
} {
  if (!params.searchId) {
    throw new Response("No search id", { status: 400 });
  } else {
    return {
      searchId: params.searchId,
      locale: locale
    };
  }
}

async function streamSearchResults(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  signal: AbortSignal,
  data: { searchId: string; locale: string; },
  context: Route.LoaderArgs["context"]
) {
  const encoder = new TextEncoder();
  const handleAbort = () => {
    console.log("[Search engine] Request signaled abort. Closing writer.");
    writer.abort().catch(() => { /* ignore */ });
  };
  signal.addEventListener("abort", handleAbort);

  const startTime = Date.now();
  try {
    const send = async (event: SearchStreamEvent) => {
      if (!signal.aborted) {
        await writer.ready;
        await writer.write(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      }
    };

    const generator = searchCandidate(
      data.searchId,
      data.locale,
      context.repositories.search,
      context.repositories.candidate,
      context.repositories.restaurant,
      context.repositories.matching,
      context.config!.search,
      context.config!.overpass,
      context.config!.google,
      context.config!.tripAdvisor,
      signal
    );

    for await (const event of generator) {
      if (event.type === "result") {
        await waitToGiveThrottlingExperience(startTime);
        const redirectUrl = href("/searches/:searchId/candidates/:candidateId", {
          searchId: event.candidate.searchId,
          candidateId: event.candidate.id
        });
        send({ type: "redirect", url: redirectUrl });
      } else {
        send(event);
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name !== 'AbortError') {
      console.error("Stream error", error);
    }
  } finally {
    signal.removeEventListener("abort", handleAbort);
    if (!writer.closed) {
      try {
        if (!signal.aborted) {
          await writer.close();
        }
      } catch (_error) {
        // ignore error on close
      }
    }
  }
}

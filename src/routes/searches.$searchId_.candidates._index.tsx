
import { href, redirect } from "react-router";

import { searchCandidate, type SearchStreamEvent } from "@features/search-engine.server";
import { validateCSRF } from "@features/session.server";
import { getLocale } from "@features/utils/locale.server";

import type { Route } from "./+types/searches.$searchId_.candidates._index";

export async function action({
  request,
  params,
  context
}: Route.ActionArgs) {
  const formData = await request.formData();
  await validateCSRF(formData, request.headers, context.sessionStorage);
  try {
    if (context.config) {
      const data = parseAndValidate(formData, params, await getLocale(request));

      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();

      (async () => {
        try {
          writer.closed.catch((err) => {
            console.log("[Stream] Client disconnected or aborted:", err); // TODO
          });

          const send = async (event: SearchStreamEvent) => {
            console.log("SSR New Event", event); // TODO
            await writer.ready;
            await writer.write(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          };

          try {
            const generator = searchCandidate(
              data.searchId,
              data.locale,
              context.repositories.search,
              context.repositories.candidate,
              context.repositories.restaurant,
              context.repositories.matching,
              context.config.search,
              context.config.overpass,
              context.config.google,
              context.config.tripAdvisor,
              request.signal
            );

            for await (const event of generator) {
              if (event.type === "result") {
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
            console.error("Stream error", error);
          } finally {
            writer.releaseLock();
          }
        } catch (err) {
          console.error("[Stream] Broken pipe / Client disconnected", err);
        } finally {
          try {
            await writer.close();
          } catch (e) {
            console.warn("Error when closing the stream", e);
          }
        }
      })();

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
          "Content-Encoding": "none"
        },
      });
    } else {
      throw new Error("AppContext is not initialized.");
    }
  } catch (error) {
    console.error("ACTION SETUP ERROR:", error);
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

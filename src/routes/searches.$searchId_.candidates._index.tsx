
import { ErrorUnknown } from "@components/error/error-unknown";

import type { Route } from "./+types/searches.$searchId_.candidates._index";

export async function action() {
  // 1. Create a Transform Stream (Pipe)
  // The 'readable' side goes to the browser.
  // The 'writable' side is where we push data.
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // 2. Start the streaming logic in the background
  // We do NOT await this, otherwise the response waits for the stream to finish!
  (async () => {
    try {
      // FORCE FLUSH: Send padding immediately to bypass any proxy buffering
      await writer.write(encoder.encode(": " + " ".repeat(4096) + "\n\n"));

      let count = 0;
      while (true) {
        // Check if the client disconnected
        await writer.ready;

        count++;
        const message = JSON.stringify({
          type: "progress",
          message: `Ping #${count} via TransformStream`
        });

        // Write the SSE event
        const data = `data: ${message}\n\n`;
        await writer.write(encoder.encode(data));
        console.log(`[Stream] Sent #${count}`);

        // Simulate work (1 second delay)
        await new Promise(r => setTimeout(r, 1000));
      }
    } catch (err) {
      console.error("[Stream] Broken pipe / Client disconnected", err);
    } finally {
      // Always close the writer when done
      try { await writer.close(); } catch { }
    }
  })();

  // 3. Return the response IMMEDIATELY with the readable stream
  return new Response(readable, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
      "Content-Encoding": "none",
    },
  });
}

// export async function action({
//   request,
//   params,
//   context
// }: Route.ActionArgs) {
//   const formData = await request.formData();
//   await validateCSRF(formData, request.headers, context.sessionStorage);
//   try {
//     if (context.config) {
//       const data = parseAndValidate(formData, params, await getLocale(request));

//       const stream = new ReadableStream({
//         async start(controller) {
//           const encoder = new TextEncoder();

//           const send = (event: SearchStreamEvent) => {
//             console.log("SSR New Event", event);
//             controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
//           };

//           try {
//             const generator = searchCandidate(
//               data.searchId,
//               data.locale,
//               context.repositories.search,
//               context.repositories.candidate,
//               context.repositories.restaurant,
//               context.repositories.matching,
//               context.config.search,
//               context.config.overpass,
//               context.config.google,
//               context.config.tripAdvisor,
//               request.signal
//             );

//             for await (const event of generator) {
//               if (event.type === "result") {
//                 const redirectUrl = href("/searches/:searchId/candidates/:candidateId", {
//                   searchId: event.candidate.searchId,
//                   candidateId: event.candidate.id
//                 });
//                 send({ type: "redirect", url: redirectUrl });
//               } else {
//                 send(event);
//               }
//             }
//           } catch (error) {
//             console.error("Stream error", error);
//             controller.error(error);
//           } finally {
//             controller.close();
//           }
//         }
//       });

//       return new Response(stream, {
//         headers: {
//           "Content-Type": "text/event-stream",
//           "Cache-Control": "no-cache",
//           "Connection": "keep-alive"
//         },
//       });
//     } else {
//       throw new Error("AppContext is not initialized.");
//     }
//   } catch (error) {
//     console.error("ACTION SETUP ERROR:", error);
//     return new Response(JSON.stringify({ error: String(error) }), {
//       status: 500,
//       headers: { "Content-Type": "application/json" }
//     });
//   }
// }

// export async function loader({ params }: Route.LoaderArgs) {
//   return redirect(href("/searches/:searchId/candidates/:candidateId", {
//     searchId: params.searchId,
//     candidateId: "latest"
//   }));
// }

// function parseAndValidate(
//   _formData: FormData,
//   params: { searchId: string | undefined; },
//   locale: string
// ): {
//   searchId: string;
//   locale: string;
// } {
//   if (!params.searchId) {
//     throw new Response("No search id", { status: 400 });
//   } else {
//     return {
//       searchId: params.searchId,
//       locale: locale
//     };
//   }
// }

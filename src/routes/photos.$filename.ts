import type { Route } from "./+types/photos.$filename";

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const r2PublicUrl = context.cloudflare.env.BROULETTE_R2_PUBLIC_URL;
  if (r2PublicUrl && new URL(r2PublicUrl).origin !== new URL(request.url).origin) {
    throw new Response("Not Found", { status: 404 });
  }

  const object = await context.cloudflare.env.IMAGES.get(`photos/${params.filename}`);
  if (!object) {
    throw new Response("Not Found", { status: 404 });
  }
  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType || "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}

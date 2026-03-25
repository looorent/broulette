import { describe, it, expect, vi } from "vitest";

import { loader } from "./photos.$filename";

function createRequest(filename: string, origin = "http://localhost:5173") {
  return new Request(`${origin}/photos/${filename}`);
}

function createContext(r2PublicUrl: string, r2Object?: { body: ReadableStream; httpMetadata?: { contentType?: string } } | null) {
  return {
    cloudflare: {
      env: {
        BROULETTE_R2_PUBLIC_URL: r2PublicUrl,
        IMAGES: {
          get: vi.fn().mockResolvedValue(r2Object ?? null)
        }
      }
    }
  };
}

function createR2Object(content: string, contentType = "image/jpeg") {
  return {
    body: new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(content));
        controller.close();
      }
    }),
    httpMetadata: { contentType }
  };
}

describe("GET /photos/:filename", () => {
  it("returns the image from R2 when serving locally", async () => {
    const context = createContext("http://localhost:5173", createR2Object("image-data"));
    const response = await loader({
      request: createRequest("abc-123.jpg"),
      params: { filename: "abc-123.jpg" },
      context
    } as never);

    expect(context.cloudflare.env.IMAGES.get).toHaveBeenCalledWith("photos/abc-123.jpg");
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/jpeg");
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=31536000, immutable");
  });

  it("preserves the original content type from R2 metadata", async () => {
    const context = createContext("http://localhost:5173", createR2Object("image-data", "image/webp"));
    const response = await loader({
      request: createRequest("abc-123.jpg"),
      params: { filename: "abc-123.jpg" },
      context
    } as never);

    expect(response.headers.get("Content-Type")).toBe("image/webp");
  });

  it("defaults to image/jpeg when R2 metadata has no content type", async () => {
    const context = createContext("http://localhost:5173", { body: new ReadableStream(), httpMetadata: {} });
    const response = await loader({
      request: createRequest("abc-123.jpg"),
      params: { filename: "abc-123.jpg" },
      context
    } as never);

    expect(response.headers.get("Content-Type")).toBe("image/jpeg");
  });

  it("returns 404 when the image does not exist in R2", async () => {
    const context = createContext("http://localhost:5173", null);

    try {
      await loader({
        request: createRequest("missing.jpg"),
        params: { filename: "missing.jpg" },
        context
      } as never);
      expect.unreachable("Should have thrown");
    } catch (error) {
      expect((error as Response).status).toBe(404);
    }
  });

  it("returns 404 when R2 public URL points to an external domain", async () => {
    const context = createContext("https://images.biteroulette.com", createR2Object("image-data"));

    try {
      await loader({
        request: createRequest("abc-123.jpg"),
        params: { filename: "abc-123.jpg" },
        context
      } as never);
      expect.unreachable("Should have thrown");
    } catch (error) {
      expect((error as Response).status).toBe(404);
      expect(context.cloudflare.env.IMAGES.get).not.toHaveBeenCalled();
    }
  });

  it("serves images when R2 public URL is empty", async () => {
    const context = createContext("", createR2Object("image-data"));
    const response = await loader({
      request: createRequest("abc-123.jpg"),
      params: { filename: "abc-123.jpg" },
      context
    } as never);

    expect(response.status).toBe(200);
  });
});

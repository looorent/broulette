import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSearchStream } from "./use-search-stream";

const navigate = vi.fn();
const setLoaderMessage = vi.fn();
const setLoaderStreaming = vi.fn();

vi.mock("react-router", () => ({ useNavigate: () => navigate }));
vi.mock("@components/search-loader", () => ({
  useSearchLoader: () => ({ setLoaderMessage, setLoaderStreaming })
}));
vi.mock("@features/utils/time", () => ({ sleep: vi.fn().mockResolvedValue(undefined) }));

function streamOf(...events: object[]): Response {
  const encoder = new TextEncoder();
  return new Response(new ReadableStream({
    start(controller) {
      events.forEach(event => controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`)));
      controller.close();
    }
  }));
}

describe("useSearchStream", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("navigates to the redirect url sent by the stream", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(streamOf(
      { type: "searching", message: "Looking..." },
      { type: "redirect", url: "/searches/s1/candidates/c1" }
    )));
    const { result } = renderHook(() => useSearchStream());

    const outcome = await result.current.streamSearch("/searches/s1/candidates", "token");

    expect(outcome).toBe("redirected");
    expect(navigate).toHaveBeenCalledWith("/searches/s1/candidates/c1", { viewTransition: true, replace: true });
  });

  it("stops the loader and reports a failure when the stream ends without a redirect", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(streamOf(
      { type: "searching", message: "Looking..." }
    )));
    const { result } = renderHook(() => useSearchStream());

    const outcome = await result.current.streamSearch("/searches/s1/candidates", "token");

    expect(outcome).toBe("failed");
    expect(setLoaderStreaming).toHaveBeenLastCalledWith(false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it("reports a failure when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Network error")));
    const { result } = renderHook(() => useSearchStream());

    const outcome = await result.current.streamSearch("/searches/s1/candidates", "token");

    expect(outcome).toBe("failed");
    expect(setLoaderStreaming).toHaveBeenLastCalledWith(false);
  });

  it("does not report a failure when the stream is aborted", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(Object.assign(new Error("Aborted"), { name: "AbortError" })));
    const { result } = renderHook(() => useSearchStream());

    const outcome = await result.current.streamSearch("/searches/s1/candidates", "token");

    expect(outcome).toBe("aborted");
  });
});

// TODO merge this with the circuit breaker
export class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "APIError";
  }
}

export async function executeRequest(
  url: string,
  options: RequestInit = {},
  timeoutInMs: number,
  parentSignal?: AbortSignal
): Promise<Response> {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => controller.abort(), timeoutInMs);
  const onParentAbort = () => controller.abort();

  if (parentSignal) {
    if (parentSignal.aborted) {
      controller.abort();
    } else {
      parentSignal.addEventListener("abort", onParentAbort);
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    if (response.ok) {
      return response;
    } else {
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        throw new APIError(response.status, `Client Error: ${response.statusText}`);
      } else {
        throw new Error(`Server Error: ${response.status} ${response.statusText}`);
      }
    }
  } finally {
    // Cleanup: Clear timeout and remove listeners to prevent memory leaks
    clearTimeout(timeoutId);
    if (parentSignal) {
      parentSignal.removeEventListener("abort", onParentAbort);
    }
  }
}

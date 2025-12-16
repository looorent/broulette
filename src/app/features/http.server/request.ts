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
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
    if (parentSignal) {
      parentSignal.removeEventListener("abort", onParentAbort);
    }
  }
}

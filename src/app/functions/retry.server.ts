const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_BACKOFF_MS: 500,
  TIMEOUT_MS: 5000,
};

export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = RETRY_CONFIG.MAX_RETRIES,
  backoff = RETRY_CONFIG.INITIAL_BACKOFF_MS
): Promise<Response> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), RETRY_CONFIG.TIMEOUT_MS);

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(id);

    // If successful, return immediately
    if (response.ok) {
      return response;
    } else {
      // Do not retry on client errors (4xx), unless it's a rate limit (429)
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        throw new APIError(response.status, `Client Error: ${response.statusText}`);
      } else {
        throw new Error(`Server Error: ${response.status} ${response.statusText}`);
      }
    }
  } catch (error) {
    if (retries <= 0) {
      console.error(`[Fetch Failure] Max retries reached for ${url}`);
      throw error;
    }

    const isAbort = error instanceof Error && error.name === 'AbortError';
    const logPrefix = isAbort ? '[Timeout]' : '[Network/Server]';

    console.warn(`${logPrefix} Request failed. Retrying in ${backoff}ms... (${retries} left)`);

    // Wait for the backoff period
    await new Promise((resolve) => setTimeout(resolve, backoff));

    // Recursive call with decremented retries and doubled backoff (Exponential)
    return fetchWithRetry(url, options, retries - 1, backoff * 2);
  }
}

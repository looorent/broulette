export class CircuitBreakerError extends Error {
    constructor(message, retriable = false) {
        super(message);
        this.retriable = retriable;
    }

    isRetriable() {
        return this.retriable;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function createCircuitBreaker(asyncFunctionToCall, retriesLeft = 3, resetTimeoutMs = 30_000) {
    while (retriesLeft > 0) {
        try {
            return await asyncFunctionToCall();
        } catch (e) {
            if (e instanceof CircuitBreakerError && e.isRetriable()) {
                console.debug(`[CircuitBreaker] Retrying... ${--retriesLeft} attempts left`);
                await sleep(resetTimeoutMs);
            } else {
                throw e;
            }
        }
    }
    throw new CircuitBreakerError("Circuit breaker open: no retries left");
}
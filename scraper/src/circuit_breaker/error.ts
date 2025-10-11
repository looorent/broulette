
export abstract class CircuitBreakerError extends Error {
    constructor(message: string, readonly retriable: boolean = false) {
        super(message);
    }

    abstract isRetriable(): boolean;
}

export class NoRetryLeftError extends CircuitBreakerError {
    constructor(message: string = "[CircuitBreaker] No retries left") {
        super(message, false);
        this.name = "NoRetryLeftError";
    }

    isRetriable(): boolean {
        return false;
    }
}

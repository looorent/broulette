export const DEFAULT_FAILOVER: FailoverConfiguration = {
  retry: 3,
  halfOpenAfterInMs: 5_000,
  closeAfterNumberOfFailures: 5,
  timeoutInMs: 5_000,
  consecutiveFailures: 5
};

export interface FailoverConfiguration {
  retry: number;
  halfOpenAfterInMs: number;
  closeAfterNumberOfFailures: number;
  timeoutInMs: number;
  consecutiveFailures: number;
}

export type FailingOperation<T> = (signal: AbortSignal) => Promise<T>;

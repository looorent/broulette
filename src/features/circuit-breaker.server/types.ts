export const DEFAULT_FAILOVER: FailoverConfiguration = {
  retry: 3,
  halfOpenAfterInMs: 10_000,
  closeAfterNumberOfFailures: 5,
  timeoutInMs: 10_000,
  consecutiveFailures: 5
};

export const SLOW_NETWORK_FAILOVER: FailoverConfiguration = {
  retry: 4,
  halfOpenAfterInMs: 15_000,
  closeAfterNumberOfFailures: 7,
  timeoutInMs: 20_000,
  consecutiveFailures: 7
};

export interface FailoverConfiguration {
  retry: number;
  halfOpenAfterInMs: number;
  closeAfterNumberOfFailures: number;
  timeoutInMs: number;
  consecutiveFailures: number;
}

export type FailingOperation<T> = (signal: AbortSignal) => Promise<T>;

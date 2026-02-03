export const DEFAULT_FAILOVER: FailoverConfiguration = {
  retry: 3,
  halfOpenAfterInMs: 10_000,
  timeoutInMs: 10_000,
  consecutiveFailures: 5
};

export const SLOW_NETWORK_FAILOVER: FailoverConfiguration = {
  retry: 4,
  halfOpenAfterInMs: 15_000,
  timeoutInMs: 20_000,
  consecutiveFailures: 7
};

export interface FailoverConfiguration {
  retry: number;
  halfOpenAfterInMs: number;
  timeoutInMs: number;
  consecutiveFailures: number;
}

export type FailingOperation<T> = (signal: AbortSignal) => Promise<T>;

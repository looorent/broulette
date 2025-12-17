export const DEFAULT_FAILOVER: FailoverConfiguration = {
  retry: 3,
  halfOpenAfterInMs: 5_000,
  closeAfterNumberOfFailures: 5,
  timeoutInMs: 5_000
};

export interface FailoverConfiguration {
  retry: number;
  halfOpenAfterInMs: number;
  closeAfterNumberOfFailures: number;
  timeoutInMs: number;
}

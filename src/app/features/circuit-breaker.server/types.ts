export interface FailoverConfiguration {
  retries: number;
  intervalBetweenRetriesInMs: number;
  timeoutInMs: number;
}

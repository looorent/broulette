import type { CircuitBreakerPolicy, ICancellationContext, IDefaultPolicyContext, IMergedPolicy, IRetryContext, RetryPolicy, TimeoutPolicy } from "cockatiel";
import { circuitBreaker, ConsecutiveBreaker, ExponentialBackoff, retry, timeout, TimeoutStrategy, wrap } from "cockatiel";
import { handleRetrieableErrors } from "./filter";
import { DEFAULT_FAILOVER, type FailoverConfiguration } from "./types";

export function initializeCircuitBreaker(configuration: FailoverConfiguration = DEFAULT_FAILOVER): IMergedPolicy<IDefaultPolicyContext & IRetryContext & ICancellationContext, never, [CircuitBreakerPolicy, RetryPolicy, TimeoutPolicy]> {
  const retryPolicy = retry(handleRetrieableErrors, {
    maxAttempts: configuration.retry,
    backoff: new ExponentialBackoff()
  });
  const circuitBreakerPolicy = circuitBreaker(handleRetrieableErrors, {
    halfOpenAfter: configuration.halfOpenAfterInMs,
    breaker: new ConsecutiveBreaker(5)
  });
  const timeoutPolicy = timeout(
    configuration.timeoutInMs,
    TimeoutStrategy.Cooperative
  );
  return wrap(retryPolicy, timeoutPolicy, circuitBreakerPolicy);
}


import { handleWhen } from "cockatiel";
import { CircuitBreakerError } from "./error";

export const handleRetrieableErrors =
  handleWhen(err => err instanceof CircuitBreakerError && !err.isRetriable())
  .orWhen(err => !(err instanceof CircuitBreakerError));

import { isAbortError } from "@features/utils/error";
import { logger } from "@features/utils/logger";

export interface PriorityStrategy<TResult> {
  name: string;
  /** Resolves `undefined` when the strategy has no answer, letting the next one try. */
  execute(): Promise<TResult | undefined>;
}

/**
 * Runs the strategies one after the other and returns the first answer.
 * A strategy that throws or has no answer hands over to the next one; an abort error stops the chain.
 * Throws the first error raised when no strategy answers, or a generic error when none raised any.
 */
export async function executeInPriorityOrder<TResult>(strategies: PriorityStrategy<TResult>[]): Promise<TResult> {
  let firstError: unknown;

  for (const strategy of strategies) {
    try {
      const result = await strategy.execute();
      if (result !== undefined) {
        return result;
      }
    } catch (error: unknown) {
      if (isAbortError(error)) {
        throw error;
      }
      logger.warn("[Priority] %s failed. Trying next strategy... %s", strategy.name, error);
      firstError ??= error;
    }
  }

  throw firstError ?? new Error("No strategy could answer.");
}

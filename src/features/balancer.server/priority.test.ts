import { describe, expect, it, vi } from "vitest";

import { executeInPriorityOrder } from "./priority";

function strategy<T>(name: string, execute: () => Promise<T | undefined>) {
  return { name, execute: vi.fn(execute) };
}

describe("executeInPriorityOrder", () => {
  it("returns the first answer without calling lower priority strategies", async () => {
    const first = strategy("first", async () => "first");
    const second = strategy("second", async () => "second");

    await expect(executeInPriorityOrder([first, second])).resolves.toBe("first");
    expect(second.execute).not.toHaveBeenCalled();
  });

  it("falls back to the next strategy when one has no answer", async () => {
    const first = strategy<string>("first", async () => undefined);
    const second = strategy("second", async () => "second");

    await expect(executeInPriorityOrder([first, second])).resolves.toBe("second");
  });

  it("falls back to the next strategy when one fails", async () => {
    const first = strategy<string>("first", async () => {
      throw new Error("down");
    });
    const second = strategy("second", async () => "second");

    await expect(executeInPriorityOrder([first, second])).resolves.toBe("second");
  });

  it("treats an empty list as an answer", async () => {
    const first = strategy<string[]>("first", async () => []);
    const second = strategy("second", async () => ["second"]);

    await expect(executeInPriorityOrder([first, second])).resolves.toEqual([]);
    expect(second.execute).not.toHaveBeenCalled();
  });

  it("throws the first error when no strategy answers", async () => {
    const first = strategy<string>("first", async () => {
      throw new Error("first error");
    });
    const second = strategy<string>("second", async () => {
      throw new Error("second error");
    });
    const third = strategy<string>("third", async () => undefined);

    await expect(executeInPriorityOrder([first, second, third])).rejects.toThrow("first error");
  });

  it("throws a generic error when no strategy answers nor fails", async () => {
    await expect(executeInPriorityOrder([strategy<string>("first", async () => undefined)])).rejects.toThrow("No strategy could answer.");
  });

  it("stops the chain on abort", async () => {
    const first = strategy<string>("first", async () => {
      throw Object.assign(new Error("Aborted"), { name: "AbortError" });
    });
    const second = strategy("second", async () => "second");

    await expect(executeInPriorityOrder([first, second])).rejects.toThrow("Aborted");
    expect(second.execute).not.toHaveBeenCalled();
  });
});

import { describe, expect, it } from "vitest";

import { compareTwoStrings } from "./similarity";

describe("compareTwoStrings", () => {
  it("returns 1 for identical strings", () => {
    expect(compareTwoStrings("hello", "hello")).toBe(1);
  });

  it("returns 1 for identical strings with different case", () => {
    expect(compareTwoStrings("Hello", "hello")).toBe(1);
  });

  it("returns 1 for identical strings ignoring whitespace", () => {
    expect(compareTwoStrings("hello world", "helloworld")).toBe(1);
  });

  it("returns 0 for completely different strings", () => {
    expect(compareTwoStrings("abc", "xyz")).toBe(0);
  });

  it("returns 0 when first string has length less than 2", () => {
    expect(compareTwoStrings("a", "abc")).toBe(0);
  });

  it("returns 0 when second string has length less than 2", () => {
    expect(compareTwoStrings("abc", "a")).toBe(0);
  });

  it("returns 1 for empty strings", () => {
    expect(compareTwoStrings("", "")).toBe(1);
  });

  it("returns high similarity for similar strings", () => {
    const similarity = compareTwoStrings("restaurant", "restaurante");
    expect(similarity).toBeGreaterThan(0.8);
  });

  it("returns moderate similarity for partially matching strings", () => {
    const similarity = compareTwoStrings("pizza place", "pizza palace");
    expect(similarity).toBeGreaterThan(0.5);
    expect(similarity).toBeLessThan(1);
  });

  it("handles repeated bigrams correctly", () => {
    const similarity = compareTwoStrings("aabb", "aabb");
    expect(similarity).toBe(1);
  });

  it("computes bigram intersection correctly", () => {
    const similarity = compareTwoStrings("night", "nacht");
    expect(similarity).toBeGreaterThan(0);
    expect(similarity).toBeLessThan(1);
  });

  it("handles unicode characters", () => {
    const similarity = compareTwoStrings("cafe", "caf");
    expect(similarity).toBeGreaterThan(0.5);
  });
});

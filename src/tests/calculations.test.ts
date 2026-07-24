import { describe, expect, it } from "vitest";
import {
  classifyConsistency,
  classifyRisk,
  coefficientOfVariation,
  expectedValue,
  fairOdd,
  impliedProbability,
} from "@/lib/calculations/ev";

describe("odds calculations", () => {
  it("computes implied probability from a market odd", () => {
    expect(impliedProbability(2)).toBeCloseTo(0.5);
    expect(impliedProbability(1.5)).toBeCloseTo(0.6667, 3);
  });

  it("returns 0 implied probability for invalid odds", () => {
    expect(impliedProbability(0)).toBe(0);
    expect(impliedProbability(1)).toBe(0);
  });

  it("computes fair odd from projected probability", () => {
    expect(fairOdd(0.5)).toBeCloseTo(2);
    expect(fairOdd(0)).toBeUndefined();
  });

  it("computes expected value", () => {
    expect(expectedValue(0.5, 2.2)).toBeCloseTo(0.1);
    expect(expectedValue(0.5, 1.8)).toBeCloseTo(-0.1);
    expect(expectedValue(0, 2)).toBeUndefined();
  });

  it("classifies risk from EV and consistency", () => {
    expect(classifyRisk(0.05, "stable")).toBe("low");
    expect(classifyRisk(-0.05, "very_volatile")).toBe("high");
    expect(classifyRisk(undefined, "stable")).toBe("high");
  });

  it("computes coefficient of variation", () => {
    expect(coefficientOfVariation([2, 2, 2])).toBeCloseTo(0);
    expect(coefficientOfVariation([1])).toBeUndefined();
  });

  it("classifies consistency from CV thresholds", () => {
    expect(classifyConsistency(0.2)).toBe("stable");
    expect(classifyConsistency(0.6)).toBe("moderate");
    expect(classifyConsistency(0.9)).toBe("volatile");
    expect(classifyConsistency(1.5)).toBe("very_volatile");
    expect(classifyConsistency(undefined)).toBe("moderate");
  });
});

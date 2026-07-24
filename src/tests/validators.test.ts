import { describe, expect, it } from "vitest";
import { parseFutOdds } from "@/lib/parser/futoddsParser";
import { computeConfidenceScore, validateFutOdds } from "@/lib/validators/validateFutOdds";
import { SEED_FUTODDS_TEXT } from "@/data/seedRawText";

describe("validateFutOdds", () => {
  it("produces no error-level issue for well-formed seed data", () => {
    const data = parseFutOdds(SEED_FUTODDS_TEXT);
    const issues = validateFutOdds(data);
    expect(issues.some((i) => i.severity === "error")).toBe(false);
  });

  it("flags missing teams as an error", () => {
    const data = parseFutOdds("Odds\nCasa: 1.5\nEmpate: 4\nFora: 5");
    const issues = validateFutOdds(data);
    expect(issues.some((i) => i.severity === "error")).toBe(true);
  });

  it("flags probabilities that do not sum close to 100%", () => {
    const text = `Time da Casa: A\nTime Visitante: B\n\nProbabilidades\nCasa: 80%\nEmpate: 30%\nFora: 20%`;
    const data = parseFutOdds(text);
    const issues = validateFutOdds(data);
    expect(issues.some((i) => i.message.includes("somam"))).toBe(true);
  });

  it("computes a lower confidence score when issues are present", () => {
    const clean = computeConfidenceScore([]);
    const withIssues = computeConfidenceScore([
      { id: "1", severity: "error", message: "erro" },
      { id: "2", severity: "warning", message: "aviso" },
    ]);
    expect(clean).toBe(10);
    expect(withIssues).toBeLessThan(clean);
  });
});

import { describe, expect, it } from "vitest";
import type { AIReport } from "@/types";
import {
  computeMarketConsensus,
  computeSimilarityMap,
  detectOutliers,
  levelFromScore,
} from "@/lib/consensus/consensus";

function makeReport(overrides: Partial<AIReport> & { id: string; provider: string }): AIReport {
  return {
    createdAt: new Date().toISOString(),
    rawText: "Favorito: A\nRiscos: nenhum risco relevante",
    receivedSameBaseData: true,
    usedExternalResearch: false,
    alternativePicks: [],
    avoidPicks: [],
    markets: [],
    arguments: [],
    risks: ["Amostra pequena"],
    inconsistencies: [],
    ...overrides,
  };
}

describe("levelFromScore", () => {
  it("classifies consensus levels using the documented thresholds", () => {
    expect(levelFromScore(85)).toBe("strong");
    expect(levelFromScore(70)).toBe("near");
    expect(levelFromScore(50)).toBe("divided");
    expect(levelFromScore(20)).toBe("weak");
  });
});

describe("computeMarketConsensus", () => {
  const agreeing: AIReport[] = [
    makeReport({
      id: "1",
      provider: "ChatGPT",
      mainPick: { market: "Under 3.5", selection: "Under 3.5", odd: 1.6, projectedProbability: 0.6, recommendation: "main", confidence: 7 },
    }),
    makeReport({
      id: "2",
      provider: "Qwen",
      mainPick: { market: "Under 3.5", selection: "Under 3.5", odd: 1.6, projectedProbability: 0.62, recommendation: "main", confidence: 7 },
    }),
    makeReport({
      id: "3",
      provider: "Kimi",
      mainPick: { market: "Under 3.5", selection: "Under 3.5", odd: 1.6, projectedProbability: 0.58, recommendation: "main", confidence: 6 },
    }),
  ];

  it("scores a fully agreeing market as strong consensus", () => {
    const result = computeMarketConsensus(agreeing);
    const market = result.find((m) => m.selection === "Under 3.5");
    expect(market?.level).toBe("strong");
    expect(market?.occurrenceScore).toBeGreaterThan(80);
  });

  it("returns an empty array when there are no reports", () => {
    expect(computeMarketConsensus([])).toEqual([]);
  });

  it("flags a report with a very different projected probability as an outlier", () => {
    const withOutlier: AIReport[] = [
      ...agreeing,
      makeReport({
        id: "4",
        provider: "DeepSeek",
        mainPick: { market: "Under 3.5", selection: "Under 3.5", odd: 1.6, projectedProbability: 0.95, recommendation: "main", confidence: 8 },
      }),
    ];
    const consensus = computeMarketConsensus(withOutlier);
    const outliers = detectOutliers(withOutlier, consensus);
    expect(outliers.some((o) => o.provider === "DeepSeek")).toBe(true);
  });
});

describe("computeSimilarityMap", () => {
  it("gives high similarity to reports with the same favorite, score and main pick", () => {
    const reportsA: AIReport[] = [
      makeReport({
        id: "1",
        provider: "ChatGPT",
        favorite: "Västerås SK",
        expectedScore: "2-1",
        mainPick: { market: "Under 3.5", selection: "Under 3.5", recommendation: "main" },
      }),
      makeReport({
        id: "2",
        provider: "Qwen",
        favorite: "Västerås SK",
        expectedScore: "2-1",
        mainPick: { market: "Under 3.5", selection: "Under 3.5", recommendation: "main" },
      }),
    ];
    const pairs = computeSimilarityMap(reportsA);
    expect(pairs[0].score).toBeGreaterThan(80);
  });

  it("gives low similarity to reports that disagree on everything", () => {
    const reportsB: AIReport[] = [
      makeReport({
        id: "1",
        provider: "ChatGPT",
        favorite: "Västerås SK",
        expectedScore: "2-1",
        mainPick: { market: "Under 3.5", selection: "Under 3.5", recommendation: "main" },
      }),
      makeReport({
        id: "2",
        provider: "DeepSeek",
        favorite: "Örgryte",
        expectedScore: "0-2",
        mainPick: { market: "Resultado final", selection: "Fora", recommendation: "main" },
      }),
    ];
    const pairs = computeSimilarityMap(reportsB);
    expect(pairs[0].score).toBeLessThan(30);
  });
});

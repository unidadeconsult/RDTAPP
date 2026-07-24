import type {
  ConsistencyLevel,
  FutOddsData,
  MarketAnalysis,
  ValidationIssue,
} from "@/types";
import { classifyRisk, expectedValue, fairOdd, impliedProbability } from "./ev";

function baseConsistency(data: FutOddsData): ConsistencyLevel {
  const hasHome20 = !!data.home.lastTwenty;
  const hasAway20 = !!data.away.lastTwenty;
  const hasHome5 = !!data.home.lastFive;
  const hasAway5 = !!data.away.lastFive;

  if (hasHome20 && hasAway20) return "moderate";
  if (hasHome5 || hasAway5) return "volatile";
  return "very_volatile";
}

function computeSupport(
  data: FutOddsData,
  hasOdd: boolean,
  hasProbability: boolean
): number {
  let support = 40;
  if (hasOdd) support += 20;
  if (hasProbability) support += 20;
  if (data.home.lastTwenty && data.away.lastTwenty) support += 15;
  if (data.home.lastFive && data.away.lastFive) support += 5;
  return Math.max(0, Math.min(100, support));
}

export function buildMarketAnalyses(
  data: FutOddsData,
  issues: ValidationIssue[]
): MarketAnalysis[] {
  const consistency = baseConsistency(data);
  const hasVolatilityWarning = issues.some(
    (i) => i.severity === "warning" && i.message.includes("xG")
  );
  const finalConsistency: ConsistencyLevel = hasVolatilityWarning
    ? consistency === "moderate"
      ? "volatile"
      : consistency
    : consistency;

  const analyses: MarketAnalysis[] = data.marketValues.map((row) => {
    const ev =
      row.projectedProbability !== undefined && row.marketOdd !== undefined
        ? expectedValue(row.projectedProbability, row.marketOdd)
        : undefined;
    const support = computeSupport(
      data,
      row.marketOdd !== undefined,
      row.projectedProbability !== undefined
    );
    const risk = classifyRisk(ev, finalConsistency);

    return {
      market: row.market,
      selection: row.selection,
      projectedProbability: row.projectedProbability,
      impliedProbability:
        row.marketOdd !== undefined ? impliedProbability(row.marketOdd) : undefined,
      fairOdd:
        row.projectedProbability !== undefined
          ? fairOdd(row.projectedProbability)
          : undefined,
      marketOdd: row.marketOdd,
      ev,
      risk,
      consistency: finalConsistency,
      support,
      recommendation: "neutral",
    };
  });

  return rankRecommendations(analyses);
}

function rankRecommendations(markets: MarketAnalysis[]): MarketAnalysis[] {
  const eligible = markets.filter(
    (m) => m.ev !== undefined && m.support >= 50 && m.risk !== "high"
  );
  eligible.sort((a, b) => (b.ev ?? -1) - (a.ev ?? -1));

  const mainKey = eligible[0]
    ? `${eligible[0].market}|${eligible[0].selection}`
    : undefined;
  const altKey = eligible[1]
    ? `${eligible[1].market}|${eligible[1].selection}`
    : undefined;

  return markets.map((m) => {
    const key = `${m.market}|${m.selection}`;
    if (key === mainKey) return { ...m, recommendation: "main" };
    if (key === altKey) return { ...m, recommendation: "alternative" };
    if ((m.ev !== undefined && m.ev < -0.03) || m.support < 40) {
      return { ...m, recommendation: "avoid" };
    }
    return { ...m, recommendation: "neutral" };
  });
}

export function pickMarkets(markets: MarketAnalysis[]) {
  return {
    mainPick: markets.find((m) => m.recommendation === "main"),
    alternativePick: markets.find((m) => m.recommendation === "alternative"),
    avoidPicks: markets.filter((m) => m.recommendation === "avoid"),
  };
}

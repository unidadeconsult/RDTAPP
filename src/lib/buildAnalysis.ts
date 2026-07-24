import type { Analysis, AIReport, MatchInfo, MatchOdds } from "@/types";
import { buildMarketValues, parseFutOdds } from "@/lib/parser/futoddsParser";
import { computeConfidenceScore, validateFutOdds } from "@/lib/validators/validateFutOdds";
import { buildMarketAnalyses, pickMarkets } from "@/lib/calculations/markets";
import {
  buildSynthesis,
  computeMarketConsensus,
  detectOutliers,
} from "@/lib/consensus/consensus";

/** Remove chaves com valor undefined para que o spread não apague dados já extraídos. */
function withoutUndefined<T extends object>(obj: T | undefined): Partial<T> {
  if (!obj) return {};
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
}

export function buildAnalysisFromText(
  rawText: string,
  overrides: { info?: Partial<MatchInfo>; odds?: Partial<MatchOdds> } = {}
): Analysis {
  const futOdds = parseFutOdds(rawText);
  futOdds.info = { ...futOdds.info, ...withoutUndefined(overrides.info) };
  const definedOdds = withoutUndefined(overrides.odds);
  if (Object.keys(definedOdds).length > 0) {
    futOdds.odds = { ...futOdds.odds, ...definedOdds };
    futOdds.marketValues = buildMarketValues(futOdds.odds, futOdds.probabilities);
  }

  const validationIssues = validateFutOdds(futOdds);
  const confidenceScore = computeConfidenceScore(validationIssues);
  const markets = buildMarketAnalyses(futOdds, validationIssues);
  const { mainPick, alternativePick, avoidPicks } = pickMarkets(markets);

  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    futOdds,
    validationIssues,
    confidenceScore,
    markets,
    mainPick,
    alternativePick,
    avoidPicks,
    aiReports: [],
    marketConsensus: [],
    synthesis: undefined,
    betTracking: [],
    riskProfile: "moderate",
  };
}

export function recomputeConsensus(analysis: Analysis, reports: AIReport[]): Analysis {
  const marketConsensus = computeMarketConsensus(reports);
  const outliers = detectOutliers(reports, marketConsensus);
  const synthesis = buildSynthesis(reports, marketConsensus, outliers);
  return {
    ...analysis,
    aiReports: reports,
    marketConsensus,
    synthesis,
    updatedAt: new Date().toISOString(),
  };
}

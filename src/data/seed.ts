import { buildAnalysisFromText, recomputeConsensus } from "@/lib/buildAnalysis";
import { SEED_FUTODDS_TEXT } from "./seedRawText";
import { buildSeedAIReports } from "./seedAIReports";

export const SEED_ANALYSIS_ID = "demo-vasteras-orgryte";

export function buildSeedAnalysis() {
  const base = buildAnalysisFromText(SEED_FUTODDS_TEXT);
  const now = new Date().toISOString();
  const withId = {
    ...base,
    id: SEED_ANALYSIS_ID,
    isDemo: true,
    createdAt: now,
    updatedAt: now,
  };
  const reports = buildSeedAIReports(now);
  return recomputeConsensus(withId, reports);
}

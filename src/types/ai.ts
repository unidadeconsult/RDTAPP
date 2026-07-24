// Relatórios de inteligências artificiais (Camada 2)

import type { Recommendation } from "./match";

export type MarketOpinion = {
  market: string;
  selection: string;
  odd?: number;
  projectedProbability?: number;
  fairOdd?: number;
  expectedValue?: number;
  recommendation: Recommendation;
  confidence?: number;
  reasoning?: string;
};

export type AIProvider =
  | "ChatGPT"
  | "Kimi"
  | "DeepSeek"
  | "Perplexity"
  | "Qwen"
  | (string & {});

export type AIReport = {
  id: string;
  provider: AIProvider;
  createdAt: string;
  rawText: string;
  receivedSameBaseData: boolean;
  usedExternalResearch: boolean;
  favorite?: string;
  homeProbability?: number;
  drawProbability?: number;
  awayProbability?: number;
  expectedScore?: string;
  expectedGoalRange?: string;
  mainPick?: MarketOpinion;
  alternativePicks: MarketOpinion[];
  avoidPicks: MarketOpinion[];
  markets: MarketOpinion[];
  confidence?: number;
  arguments: string[];
  risks: string[];
  inconsistencies: string[];
  isDemo?: boolean;
};

export type ReportQuality = {
  reportId: string;
  score: number; // 0-100
  usesData: boolean;
  coherent: boolean;
  hasCalculations: boolean;
  cautious: boolean;
  identifiesRisk: boolean;
  noInventedData: boolean;
  separatesProbabilityFromValue: boolean;
  notes: string[];
};

export type ConsensusLevel =
  | "strong"
  | "near"
  | "divided"
  | "weak";

export type MarketConsensus = {
  market: string;
  selection: string;
  occurrenceScore: number; // 0-100
  valueScore: number; // 0-100
  dataScore: number; // 0-100
  overall: number; // 0-100
  level: ConsensusLevel;
  outlierProviders: string[];
  explanation: string;
};

export type SimilarityPair = {
  providerA: string;
  providerB: string;
  score: number; // 0-100
};

export type OutlierAlert = {
  providerId: string;
  provider: string;
  market: string;
  message: string;
};

export type ConsensusSynthesis = {
  mainConsensus?: string;
  nearConsensus?: string;
  mainDivergence?: string;
  mostCitedMarket?: string;
  mostSupportedMarket?: string;
  bestBalance?: string;
  speculativeMarket?: string;
  outlierAnalysis?: string;
  cautions: string[];
  conclusion: string;
  consensusLevel: ConsensusLevel;
  confidence: number; // 0-100
};

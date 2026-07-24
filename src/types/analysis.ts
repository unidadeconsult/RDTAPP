// Camada 3 — síntese produzida pelo auditor Kylian+Movic

import type {
  FutOddsData,
  MarketAnalysis,
  ValidationIssue,
} from "./match";
import type { AIReport, MarketConsensus, ConsensusSynthesis } from "./ai";

export type BetStatus =
  | "not_placed"
  | "placed"
  | "green"
  | "red"
  | "void"
  | "cashout";

export type BetTracking = {
  market: string;
  stake?: number;
  odd?: number;
  status: BetStatus;
  returnValue?: number;
  profitLoss?: number;
  comment?: string;
};

export type RiskProfile = "conservative" | "moderate" | "aggressive";

export type Analysis = {
  id: string;
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;

  futOdds: FutOddsData;
  validationIssues: ValidationIssue[];
  confidenceScore: number; // 0-10

  markets: MarketAnalysis[];
  mainPick?: MarketAnalysis;
  alternativePick?: MarketAnalysis;
  avoidPicks: MarketAnalysis[];

  aiReports: AIReport[];
  marketConsensus: MarketConsensus[];
  synthesis?: ConsensusSynthesis;

  betTracking: BetTracking[];
  riskProfile: RiskProfile;
};

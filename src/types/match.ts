// Dados-base extraídos do FutOdds (Camada 1)

export type MatchInfo = {
  competition?: string;
  season?: string;
  matchDate?: string;
  matchTime?: string;
  venue?: string;
  city?: string;
  country?: string;
  homeTeam: string;
  awayTeam: string;
  homePosition?: number;
  awayPosition?: number;
};

export type MatchOdds = {
  home?: number;
  draw?: number;
  away?: number;
  over05HT?: number;
  over15?: number;
  over25?: number;
  under25?: number;
  under35?: number;
  bttsYes?: number;
  bttsNo?: number;
  [extra: string]: number | undefined;
};

export type MatchProbabilities = {
  home?: number;
  draw?: number;
  away?: number;
  bttsYes?: number;
  over25?: number;
  under35?: number;
  over05HT?: number;
  firstToScoreHome?: number;
  firstToScoreAway?: number;
  expectedScore?: string;
  expectedGoalRange?: string;
};

/** Estatística comparada entre as duas equipes (usada nas tabelas casa x fora). */
export type TeamPairStat = {
  label: string;
  home?: number;
  away?: number;
  unit?: "percent" | "count" | "decimal" | "text";
};

export type LastFiveForm = {
  form?: string; // ex: "V-V-E-D-V"
  over05HT?: number;
  over25?: number;
  bttsYes?: number;
};

export type LastTwentyStats = {
  ppg?: number;
  wins?: number;
  draws?: number;
  losses?: number;
  avgGoals?: number;
  goalsFor?: number;
  goalsAgainst?: number;
  firstHalfGoalsFor?: number;
  secondHalfGoalsFor?: number;
  over25?: number;
  under25?: number;
  cleanSheet?: number;
  failedToScore?: number;
  scoredFirst?: number;
  scoredAfter70?: number;
  xg?: number;
  xgAgainst?: number;
  shots?: number;
  shotsOnTarget?: number;
  conversion?: number;
  corners?: number;
  cards?: number;
  possession?: number;
  attacks?: number;
  dangerousAttacks?: number;
  fouls?: number;
  offsides?: number;
};

export type TeamStats = {
  lastFive?: LastFiveForm;
  lastTwenty?: LastTwentyStats;
};

export type MarketValueRow = {
  market: string;
  selection: string;
  marketOdd?: number;
  projectedProbability?: number;
};

export type FutOddsData = {
  info: MatchInfo;
  odds: MatchOdds;
  probabilities: MatchProbabilities;
  home: TeamStats;
  away: TeamStats;
  comparison: TeamPairStat[];
  marketValues: MarketValueRow[];
  /** Linhas do texto original que não foram reconhecidas pelo parser. */
  unparsedLines: string[];
  rawText: string;
};

export type RiskLevel = "low" | "medium" | "high";
export type ConsistencyLevel = "stable" | "moderate" | "volatile" | "very_volatile";
export type Recommendation = "main" | "alternative" | "neutral" | "avoid";

export type MarketAnalysis = {
  market: string;
  selection: string;
  projectedProbability?: number;
  impliedProbability?: number;
  fairOdd?: number;
  marketOdd?: number;
  ev?: number;
  risk: RiskLevel;
  consistency: ConsistencyLevel;
  support: number; // 0-100, sustentação estatística
  recommendation: Recommendation;
  notes?: string;
};

export type ValidationIssue = {
  id: string;
  severity: "info" | "warning" | "error";
  message: string;
};

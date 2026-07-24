import type { ConsistencyLevel, RiskLevel } from "@/types";

/** Probabilidade implícita de uma odd decimal de mercado. */
export function impliedProbability(marketOdd: number): number {
  if (!marketOdd || marketOdd <= 1) return 0;
  return 1 / marketOdd;
}

/** Odd justa a partir da probabilidade projetada (0-1). */
export function fairOdd(projectedProbability: number): number | undefined {
  if (!projectedProbability || projectedProbability <= 0) return undefined;
  return 1 / projectedProbability;
}

/** Valor esperado (EV) a partir da probabilidade projetada (0-1) e da odd de mercado. */
export function expectedValue(
  projectedProbability: number,
  marketOdd: number
): number | undefined {
  if (!projectedProbability || !marketOdd) return undefined;
  return projectedProbability * marketOdd - 1;
}

export function formatPercent(value?: number, digits = 1): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatOdd(value?: number): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  return value.toFixed(2);
}

/** Classifica o risco de um mercado a partir do EV e da consistência dos dados. */
export function classifyRisk(
  ev: number | undefined,
  consistency: ConsistencyLevel
): RiskLevel {
  if (ev === undefined) return "high";
  if (ev >= 0.03 && consistency !== "volatile" && consistency !== "very_volatile") {
    return "low";
  }
  if (ev >= -0.02 && consistency !== "very_volatile") {
    return "medium";
  }
  return "high";
}

/**
 * Coeficiente de variação simplificado (desvio / média) para uma amostra numérica.
 * Usado como proxy de volatilidade quando o FutOdds não informa o CV diretamente.
 */
export function coefficientOfVariation(samples: number[]): number | undefined {
  const valid = samples.filter((n) => Number.isFinite(n));
  if (valid.length < 2) return undefined;
  const mean = valid.reduce((a, b) => a + b, 0) / valid.length;
  if (mean === 0) return undefined;
  const variance =
    valid.reduce((acc, n) => acc + (n - mean) ** 2, 0) / valid.length;
  const stdDev = Math.sqrt(variance);
  return stdDev / mean;
}

export function classifyConsistency(cv: number | undefined): ConsistencyLevel {
  if (cv === undefined) return "moderate";
  if (cv <= 0.5) return "stable";
  if (cv <= 0.8) return "moderate";
  if (cv <= 1.1) return "volatile";
  return "very_volatile";
}

export const consistencyLabels: Record<ConsistencyLevel, string> = {
  stable: "Estável",
  moderate: "Moderada",
  volatile: "Volátil",
  very_volatile: "Muito volátil",
};

export const riskLabels: Record<RiskLevel, string> = {
  low: "Baixo",
  medium: "Moderado",
  high: "Alto",
};

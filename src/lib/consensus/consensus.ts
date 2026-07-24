import type {
  AIReport,
  ConsensusLevel,
  ConsensusSynthesis,
  MarketConsensus,
  MarketOpinion,
  OutlierAlert,
  SimilarityPair,
} from "@/types";
import { computeReportQuality } from "./reportQuality";

type WeightedOpinion = {
  report: AIReport;
  weight: number;
  opinion: MarketOpinion;
};

function collectOpinions(report: AIReport, weight: number): WeightedOpinion[] {
  const all: MarketOpinion[] = [
    ...(report.mainPick ? [report.mainPick] : []),
    ...report.alternativePicks,
    ...report.avoidPicks,
    ...report.markets,
  ];
  const seen = new Set<string>();
  const unique: MarketOpinion[] = [];
  for (const op of all) {
    const key = `${op.market}|${op.selection}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(op);
  }
  return unique.map((opinion) => ({ report, weight, opinion }));
}

const recommendationWeight: Record<MarketOpinion["recommendation"], number> = {
  main: 100,
  alternative: 70,
  neutral: 40,
  avoid: 0,
};

export function levelFromScore(score: number): ConsensusLevel {
  if (score >= 80) return "strong";
  if (score >= 65) return "near";
  if (score >= 45) return "divided";
  return "weak";
}

export const consensusLevelLabels: Record<ConsensusLevel, string> = {
  strong: "Consenso forte",
  near: "Quase consenso",
  divided: "Opinião dividida",
  weak: "Baixo consenso / divergência",
};

export function computeMarketConsensus(reports: AIReport[]): MarketConsensus[] {
  if (reports.length === 0) return [];

  const qualities = new Map(reports.map((r) => [r.id, computeReportQuality(r)]));
  const weighted = reports.flatMap((r) =>
    collectOpinions(r, (qualities.get(r.id)?.score ?? 50) / 100)
  );

  const byKey = new Map<string, WeightedOpinion[]>();
  for (const item of weighted) {
    const key = `${item.opinion.market}|${item.opinion.selection}`;
    byKey.set(key, [...(byKey.get(key) ?? []), item]);
  }

  const results: MarketConsensus[] = [];
  for (const [key, items] of byKey.entries()) {
    const [market, selection] = key.split("|");
    const totalWeight = items.reduce((a, b) => a + b.weight, 0) || items.length;

    const occurrenceScore =
      (items.reduce(
        (acc, i) =>
          acc + (i.opinion.recommendation !== "avoid" ? i.weight : 0),
        0
      ) /
        totalWeight) *
      100;

    const valueScore =
      items.reduce(
        (acc, i) => acc + recommendationWeight[i.opinion.recommendation] * i.weight,
        0
      ) / totalWeight;

    const confidences = items
      .map((i) => i.opinion.confidence ?? i.report.confidence)
      .filter((c): c is number => c !== undefined);
    const dataScore =
      confidences.length > 0
        ? (confidences.reduce((a, b) => a + b, 0) / confidences.length) * 10
        : 55;

    const overall = occurrenceScore * 0.4 + valueScore * 0.4 + dataScore * 0.2;
    const level = levelFromScore(overall);

    const probs = items
      .map((i) => i.opinion.projectedProbability)
      .filter((p): p is number => p !== undefined);
    const mean = probs.length ? probs.reduce((a, b) => a + b, 0) / probs.length : undefined;
    const outlierProviders: string[] = [];
    if (mean !== undefined && probs.length >= 3) {
      for (const i of items) {
        if (
          i.opinion.projectedProbability !== undefined &&
          Math.abs(i.opinion.projectedProbability - mean) > 0.2
        ) {
          outlierProviders.push(i.report.provider);
        }
      }
    }
    const recSet = new Set(items.map((i) => i.opinion.recommendation));
    if (recSet.has("main") && recSet.has("avoid")) {
      for (const i of items) {
        if (i.opinion.recommendation === "avoid" && !outlierProviders.includes(i.report.provider)) {
          const mainCount = items.filter((x) => x.opinion.recommendation === "main").length;
          if (mainCount > items.length / 2) outlierProviders.push(i.report.provider);
        }
      }
    }

    const citingProviders = Array.from(new Set(items.map((i) => i.report.provider)));
    results.push({
      market,
      selection,
      occurrenceScore: Math.round(occurrenceScore),
      valueScore: Math.round(valueScore),
      dataScore: Math.round(dataScore),
      overall: Math.round(overall),
      level,
      outlierProviders,
      explanation: `${citingProviders.length} de ${reports.length} relatório(s) mencionam este mercado (${citingProviders.join(", ")}).`,
    });
  }

  return results.sort((a, b) => b.overall - a.overall);
}

export function computeSimilarityMap(reports: AIReport[]): SimilarityPair[] {
  const pairs: SimilarityPair[] = [];
  for (let a = 0; a < reports.length; a++) {
    for (let b = a + 1; b < reports.length; b++) {
      pairs.push({
        providerA: reports[a].provider,
        providerB: reports[b].provider,
        score: Math.round(similarity(reports[a], reports[b]) * 100),
      });
    }
  }
  return pairs.sort((x, y) => y.score - x.score);
}

function similarity(a: AIReport, b: AIReport): number {
  let matches = 0;
  let total = 0;

  total += 1;
  if (a.favorite && b.favorite && a.favorite === b.favorite) matches += 1;

  total += 1;
  if (a.expectedScore && b.expectedScore && a.expectedScore === b.expectedScore) matches += 1;

  total += 1;
  if (
    a.mainPick &&
    b.mainPick &&
    a.mainPick.market === b.mainPick.market &&
    a.mainPick.selection === b.mainPick.selection
  ) {
    matches += 1;
  }

  const marketsA = new Set([a.mainPick, ...a.alternativePicks].filter(Boolean).map((m) => `${m!.market}|${m!.selection}`));
  const marketsB = new Set([b.mainPick, ...b.alternativePicks].filter(Boolean).map((m) => `${m!.market}|${m!.selection}`));
  total += 1;
  const intersection = [...marketsA].filter((m) => marketsB.has(m)).length;
  const union = new Set([...marketsA, ...marketsB]).size;
  if (union > 0) matches += intersection / union;

  return total > 0 ? matches / total : 0;
}

export function detectOutliers(
  reports: AIReport[],
  marketConsensus: MarketConsensus[]
): OutlierAlert[] {
  const alerts: OutlierAlert[] = [];
  for (const mc of marketConsensus) {
    for (const provider of mc.outlierProviders) {
      alerts.push({
        providerId: provider,
        provider,
        market: `${mc.market} — ${mc.selection}`,
        message: `O relatório de ${provider} está fora da curva em ${mc.market} (${mc.selection}), divergindo das demais análises.`,
      });
    }
  }

  for (const report of reports) {
    if (/certeza|garantido|100% de chance/i.test(report.rawText)) {
      alerts.push({
        providerId: report.provider,
        provider: report.provider,
        market: "Linguagem",
        message: `O relatório de ${report.provider} utiliza linguagem de certeza, incomum entre os demais relatórios.`,
      });
    }
    if (report.risks.length === 0) {
      alerts.push({
        providerId: report.provider,
        provider: report.provider,
        market: "Riscos",
        message: `O relatório de ${report.provider} não identifica nenhum risco.`,
      });
    }
  }

  return alerts;
}

export function buildSynthesis(
  reports: AIReport[],
  marketConsensus: MarketConsensus[],
  outliers: OutlierAlert[]
): ConsensusSynthesis | undefined {
  if (reports.length === 0) return undefined;

  const strong = marketConsensus.filter((m) => m.level === "strong");
  const near = marketConsensus.filter((m) => m.level === "near");
  const divergent = [...marketConsensus].sort((a, b) => a.overall - b.overall)[0];

  const citationCount = new Map<string, number>();
  for (const m of marketConsensus) {
    const times = m.explanation.match(/^(\d+) de/);
    citationCount.set(`${m.market}|${m.selection}`, times ? Number.parseInt(times[1], 10) : 0);
  }
  const mostCited = [...marketConsensus].sort(
    (a, b) => (citationCount.get(`${b.market}|${b.selection}`) ?? 0) - (citationCount.get(`${a.market}|${a.selection}`) ?? 0)
  )[0];
  const mostSupported = [...marketConsensus].sort((a, b) => b.dataScore - a.dataScore)[0];
  const bestBalance = [...marketConsensus]
    .filter((m) => m.valueScore >= 55)
    .sort((a, b) => b.overall - a.overall)[0];
  const speculative = [...marketConsensus]
    .filter((m) => m.level === "weak" || m.level === "divided")
    .sort((a, b) => b.valueScore - a.valueScore)[0];

  const mainConsensus = strong[0];
  const nearConsensus = near[0];

  const cautions = [
    "O consenso entre modelos não representa independência estatística — IAs diferentes podem repetir raciocínios semelhantes a partir dos mesmos dados.",
  ];
  if (reports.some((r) => r.usedExternalResearch)) {
    cautions.push("Ao menos um relatório declara ter utilizado pesquisa externa além dos dados fornecidos.");
  }
  if (outliers.length > 0) {
    cautions.push(`${outliers.length} alerta(s) de análise fora da curva foram identificados.`);
  }

  const overallConfidence =
    marketConsensus.length > 0
      ? Math.round(
          marketConsensus.slice(0, 3).reduce((a, b) => a + b.overall, 0) /
            Math.min(3, marketConsensus.length)
        )
      : 0;

  const conclusionParts: string[] = [];
  if (mainConsensus) {
    conclusionParts.push(
      `Há consenso forte em torno de ${mainConsensus.market} (${mainConsensus.selection}).`
    );
  } else if (nearConsensus) {
    conclusionParts.push(
      `Há quase consenso em torno de ${nearConsensus.market} (${nearConsensus.selection}), sem unanimidade plena.`
    );
  } else {
    conclusionParts.push("Não há consenso forte entre os relatórios analisados — as opiniões estão divididas.");
  }
  if (divergent && divergent !== mainConsensus) {
    conclusionParts.push(
      `A maior divergência ocorre em ${divergent.market} (${divergent.selection}).`
    );
  }

  return {
    mainConsensus: mainConsensus ? `${mainConsensus.market} — ${mainConsensus.selection}` : undefined,
    nearConsensus: nearConsensus ? `${nearConsensus.market} — ${nearConsensus.selection}` : undefined,
    mainDivergence: divergent ? `${divergent.market} — ${divergent.selection}` : undefined,
    mostCitedMarket: mostCited ? `${mostCited.market} — ${mostCited.selection}` : undefined,
    mostSupportedMarket: mostSupported ? `${mostSupported.market} — ${mostSupported.selection}` : undefined,
    bestBalance: bestBalance ? `${bestBalance.market} — ${bestBalance.selection}` : undefined,
    speculativeMarket: speculative ? `${speculative.market} — ${speculative.selection}` : undefined,
    outlierAnalysis: outliers[0]?.message,
    cautions,
    conclusion: conclusionParts.join(" "),
    consensusLevel: mainConsensus ? "strong" : nearConsensus ? "near" : levelFromScore(overallConfidence),
    confidence: overallConfidence,
  };
}

import type { AIReport, ReportQuality } from "@/types";

/**
 * Avalia a qualidade do relatório específico (não da IA em geral):
 * uso dos dados, coerência, cálculo, cautela, identificação de risco,
 * ausência de invenções e separação entre probabilidade e valor.
 */
export function computeReportQuality(report: AIReport): ReportQuality {
  const notes: string[] = [];

  const usesData = report.receivedSameBaseData;
  if (!usesData) notes.push("Relatório não confirma ter recebido os mesmos dados-base.");

  const hasCalculations =
    report.markets.some((m) => m.fairOdd !== undefined || m.expectedValue !== undefined) ||
    !!report.mainPick?.fairOdd ||
    !!report.mainPick?.expectedValue;
  if (!hasCalculations) notes.push("Não apresenta odd justa ou EV calculado explicitamente.");

  const identifiesRisk = report.risks.length > 0;
  if (!identifiesRisk) notes.push("Não identifica riscos.");

  const cautious = !/certeza|garantido|com certeza|100%/i.test(report.rawText);
  if (!cautious) notes.push("Usa linguagem de certeza, incompatível com análise probabilística.");

  const separatesProbabilityFromValue =
    report.markets.some((m) => m.projectedProbability !== undefined) &&
    report.markets.some((m) => m.expectedValue !== undefined || m.fairOdd !== undefined);

  const coherent =
    report.homeProbability === undefined ||
    report.drawProbability === undefined ||
    report.awayProbability === undefined
      ? true
      : Math.abs(
          (report.homeProbability + report.drawProbability + report.awayProbability) - 1
        ) <= 0.08;
  if (!coherent) notes.push("Probabilidades informadas não somam próximo de 100%.");

  const noInventedData = !report.usedExternalResearch;
  if (!noInventedData) {
    notes.push("Relatório declara uso de pesquisa externa além dos dados fornecidos.");
  }

  let score = 100;
  if (!usesData) score -= 20;
  if (!hasCalculations) score -= 20;
  if (!identifiesRisk) score -= 15;
  if (!cautious) score -= 15;
  if (!separatesProbabilityFromValue) score -= 10;
  if (!coherent) score -= 15;
  if (!noInventedData) score -= 5;

  return {
    reportId: report.id,
    score: Math.max(0, Math.min(100, score)),
    usesData,
    coherent,
    hasCalculations,
    cautious,
    identifiesRisk,
    noInventedData,
    separatesProbabilityFromValue,
    notes,
  };
}

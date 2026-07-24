import type { FutOddsData, ValidationIssue } from "@/types";

let counter = 0;
function issue(
  severity: ValidationIssue["severity"],
  message: string
): ValidationIssue {
  counter += 1;
  return { id: `issue-${counter}`, severity, message };
}

/**
 * Valida a coerência dos dados extraídos do FutOdds.
 * Não corrige nem inventa dados — apenas sinaliza limitações e inconsistências.
 */
export function validateFutOdds(data: FutOddsData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { info, odds, probabilities, home, away, unparsedLines } = data;

  if (!info.homeTeam || !info.awayTeam) {
    issues.push(
      issue("error", "Não foi possível identificar os dois times da partida.")
    );
  }

  if (odds.home === undefined || odds.draw === undefined || odds.away === undefined) {
    issues.push(
      issue("warning", "Odds de resultado final incompletas (casa, empate ou fora ausente).")
    );
  }

  const probSum =
    (probabilities.home ?? 0) + (probabilities.draw ?? 0) + (probabilities.away ?? 0);
  if (probabilities.home !== undefined && probabilities.draw !== undefined && probabilities.away !== undefined) {
    if (Math.abs(probSum - 1) > 0.05) {
      issues.push(
        issue(
          "warning",
          `As probabilidades de resultado final somam ${(probSum * 100).toFixed(1)}%, fora da faixa esperada (95%–105%).`
        )
      );
    }
  } else {
    issues.push(
      issue("info", "Probabilidades de resultado final incompletas no texto informado.")
    );
  }

  for (const [label, stats] of [
    ["time da casa", home.lastTwenty],
    ["time visitante", away.lastTwenty],
  ] as const) {
    if (!stats) continue;
    if (stats.xg !== undefined && stats.goalsFor !== undefined && stats.xg > 0) {
      const diff = Math.abs(stats.goalsFor - stats.xg) / stats.xg;
      if (diff > 0.35) {
        issues.push(
          issue(
            "warning",
            `Gols reais do ${label} (${stats.goalsFor}) divergem consideravelmente do xG (${stats.xg}), indicando possível variância de finalização.`
          )
        );
      }
    }
  }

  if (!home.lastFive && !away.lastFive) {
    issues.push(issue("info", "Dados dos últimos 5 jogos não foram informados."));
  }
  if (!home.lastTwenty && !away.lastTwenty) {
    issues.push(issue("info", "Dados dos últimos 20 jogos não foram informados."));
  }

  if (odds.over25 === undefined && probabilities.over25 !== undefined) {
    issues.push(issue("info", "Probabilidade de Over 2.5 informada, mas sem odd de mercado correspondente — EV não pôde ser calculado para este mercado."));
  }
  if (odds.bttsYes === undefined && probabilities.bttsYes !== undefined) {
    issues.push(issue("info", "Probabilidade de BTTS informada, mas sem odd de mercado correspondente — EV não pôde ser calculado para este mercado."));
  }

  if (unparsedLines.length > 0) {
    issues.push(
      issue(
        "info",
        `${unparsedLines.length} linha(s) do texto colado não foram reconhecidas pelo parser e não entraram na análise.`
      )
    );
  }

  return issues;
}

/**
 * Nota de confiança (0-10) — reflete a qualidade e completude dos dados, não a probabilidade de acerto.
 */
export function computeConfidenceScore(issues: ValidationIssue[]): number {
  let score = 10;
  for (const item of issues) {
    if (item.severity === "error") score -= 2.5;
    if (item.severity === "warning") score -= 1;
    if (item.severity === "info") score -= 0.3;
  }
  return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
}

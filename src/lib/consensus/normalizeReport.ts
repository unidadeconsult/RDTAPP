import type { AIReport, MarketOpinion } from "@/types";
import { normalizeKey, parseNumber, parsePercent, splitKeyValue } from "@/lib/parser/normalize";

/**
 * Extração best-effort de campos estruturados a partir do texto colado de um relatório de IA.
 * Reconhece linhas no formato "rótulo: valor". Não interpreta linguagem natural livre —
 * o que não for reconhecido permanece apenas no texto bruto, disponível para leitura manual.
 */
export function extractAIReportFields(rawText: string): Partial<AIReport> {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const partial: Partial<AIReport> = {};
  const arguments_: string[] = [];
  const risks: string[] = [];
  const inconsistencies: string[] = [];

  for (const line of lines) {
    const kv = splitKeyValue(line);
    if (!kv) continue;
    const [rawKey, value] = kv;
    const key = normalizeKey(rawKey);

    switch (key) {
      case "favorito":
        partial.favorite = value.trim();
        break;
      case "placar":
      case "placar esperado":
      case "placar-base":
        partial.expectedScore = value.trim();
        break;
      case "faixa de gols":
        partial.expectedGoalRange = value.trim();
        break;
      case "casa":
        partial.homeProbability = parsePercent(value);
        break;
      case "empate":
        partial.drawProbability = parsePercent(value);
        break;
      case "fora":
      case "visitante":
        partial.awayProbability = parsePercent(value);
        break;
      case "confianca":
        partial.confidence = parseNumber(value);
        break;
      case "mercado principal":
      case "palpite principal":
        partial.mainPick = toMarketOpinion(value, "main");
        break;
      case "alternativa":
      case "palpite alternativo":
        partial.alternativePicks = [
          ...(partial.alternativePicks ?? []),
          toMarketOpinion(value, "alternative"),
        ];
        break;
      case "evitar":
        partial.avoidPicks = [
          ...(partial.avoidPicks ?? []),
          toMarketOpinion(value, "avoid"),
        ];
        break;
      case "argumento":
      case "argumentos":
        arguments_.push(value.trim());
        break;
      case "risco":
      case "riscos":
        risks.push(value.trim());
        break;
      case "inconsistencia":
      case "inconsistencias":
        inconsistencies.push(value.trim());
        break;
      case "pesquisa externa":
      case "usou pesquisa externa":
        partial.usedExternalResearch = /sim|yes|true/i.test(value);
        break;
      default:
        break;
    }
  }

  if (arguments_.length) partial.arguments = arguments_;
  if (risks.length) partial.risks = risks;
  if (inconsistencies.length) partial.inconsistencies = inconsistencies;

  return partial;
}

function toMarketOpinion(
  value: string,
  recommendation: MarketOpinion["recommendation"]
): MarketOpinion {
  const oddMatch = value.match(/@\s*([\d.,]+)/);
  const selection = value.replace(/@\s*[\d.,]+/, "").trim();
  return {
    market: selection,
    selection,
    odd: oddMatch ? parseNumber(oddMatch[1]) : undefined,
    recommendation,
  };
}

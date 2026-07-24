import type { AIReport, MarketOpinion } from "@/types";
import { normalizeKey, parseNumber, parsePercent, splitKeyValue } from "@/lib/parser/normalize";

export type ExtractContext = { homeTeam?: string; awayTeam?: string };

/**
 * Extração best-effort de campos estruturados a partir do texto colado de um relatório de IA.
 * Primeiro tenta linhas no formato "rótulo: valor" (mais confiável); o que não for reconhecido
 * assim é buscado depois em linguagem natural (prosa). Nada é inventado — campos não encontrados
 * por nenhuma das duas passagens ficam vazios para preenchimento manual.
 */
export function extractAIReportFields(
  rawText: string,
  context: ExtractContext = {}
): Partial<AIReport> {
  const structured = extractStructuredFields(rawText, context);
  const prose = extractProseFields(rawText, context);
  return mergeExtracted(structured, prose);
}

// ---------------------------------------------------------------------------
// Vocabulário de mercados — usado tanto na extração estruturada quanto na de
// prosa para que os relatórios de IA usem os mesmos nomes de mercado/seleção
// do FutOdds (necessário para o cálculo de consenso comparar corretamente).
// ---------------------------------------------------------------------------

type MarketVocabEntry = { market: string; selection: string; patterns: RegExp[] };

const MARKET_VOCAB: MarketVocabEntry[] = [
  { market: "Resultado final", selection: "Casa", patterns: [/vit[oó]ria (?:da|do) casa/i, /\bcasa vence\b/i, /\bmandante\b/i] },
  { market: "Resultado final", selection: "Empate", patterns: [/\bempate\b/i] },
  { market: "Resultado final", selection: "Fora", patterns: [/vit[oó]ria (?:do|de) (?:visitante|fora)/i, /\bvisitante vence\b/i, /\bfora vence\b/i] },
  { market: "Gols", selection: "Over 2.5", patterns: [/over\s*2[.,]5/i, /mais de 2[.,]5 gols/i] },
  { market: "Gols", selection: "Under 3.5", patterns: [/under\s*3[.,]5/i, /menos de 3[.,]5 gols/i] },
  { market: "Gols", selection: "Under 2.5", patterns: [/under\s*2[.,]5/i, /menos de 2[.,]5 gols/i] },
  { market: "Gols", selection: "Over 3.5", patterns: [/over\s*3[.,]5/i, /mais de 3[.,]5 gols/i] },
  { market: "Gols", selection: "Over 1.5", patterns: [/over\s*1[.,]5/i, /mais de 1[.,]5 gols?/i] },
  { market: "Gols", selection: "Under 1.5", patterns: [/under\s*1[.,]5/i, /menos de 1[.,]5 gols?/i] },
  { market: "Gols 1º tempo", selection: "Over 0.5 HT", patterns: [/over\s*0[.,]5\s*(?:ht|1t)?/i, /gol no primeiro tempo/i] },
  { market: "Ambas marcam", selection: "Não", patterns: [/btts\s*n[aã]o/i, /ambas(?:\s+as\s+equipes)?\s+n[aã]o\s+marcam/i] },
  { market: "Ambas marcam", selection: "Sim", patterns: [/btts\s*sim/i, /ambas(?:\s+as\s+equipes)?\s+marcam/i] },
];

const RESULT_CUE = /vence|vencer|vit[oó]ria|ganha|triunfo|favorito/i;

/**
 * Se o texto casar com um mercado conhecido, retorna o par canônico (mesmo nome usado pelo
 * FutOdds). Além do vocabulário fixo, quando o nome de um dos times é informado, também
 * reconhece variações como "Athletico PR vence", "Vitória do Athletico PR" ou "Athletico PR
 * (Vitória Casa)" como o mesmo mercado — sem isso, cada IA que escrever o resultado com suas
 * próprias palavras vira uma linha separada no consenso, mesmo dizendo a mesma coisa.
 */
function canonicalizeMarket(
  text: string,
  context: ExtractContext = {}
): { market: string; selection: string } | undefined {
  for (const entry of MARKET_VOCAB) {
    if (entry.patterns.some((p) => p.test(text))) {
      return { market: entry.market, selection: entry.selection };
    }
  }

  if (RESULT_CUE.test(text)) {
    const lower = text.toLowerCase();
    if (context.homeTeam && lower.includes(context.homeTeam.toLowerCase())) {
      return { market: "Resultado final", selection: "Casa" };
    }
    if (context.awayTeam && lower.includes(context.awayTeam.toLowerCase())) {
      return { market: "Resultado final", selection: "Fora" };
    }
  }

  return undefined;
}

// ---------------------------------------------------------------------------
// Passagem 1 — linhas "rótulo: valor"
// ---------------------------------------------------------------------------

function extractStructuredFields(rawText: string, context: ExtractContext): Partial<AIReport> {
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
      case "placar projetado":
        // Normaliza para "N-N" mesmo quando o rótulo vem com o nome dos times
        // (ex.: "Santos 2 x 0 Chapecoense") — mantém o placar comparável entre
        // relatórios de IAs diferentes no cálculo de similaridade/consenso.
        partial.expectedScore = extractScorePair(value) ?? value.trim();
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
      case "melhor mercado":
        partial.mainPick = toMarketOpinion(value, "main", context);
        break;
      case "alternativa":
      case "palpite alternativo":
        partial.alternativePicks = [
          ...(partial.alternativePicks ?? []),
          toMarketOpinion(value, "alternative", context),
        ];
        break;
      case "evitar":
      case "mercado a evitar":
      case "mercado sem valor":
      case "mercado para evitar":
        partial.avoidPicks = [
          ...(partial.avoidPicks ?? []),
          toMarketOpinion(value, "avoid", context),
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
  recommendation: MarketOpinion["recommendation"],
  context: ExtractContext = {}
): MarketOpinion {
  const oddMatch = value.match(/@\s*([\d.,]+)/);
  const text = value.replace(/@\s*[\d.,]+/, "").trim();
  const canonical = canonicalizeMarket(text, context);
  return {
    market: canonical?.market ?? text,
    selection: canonical?.selection ?? text,
    odd: oddMatch ? parseNumber(oddMatch[1]) : undefined,
    recommendation,
  };
}

// ---------------------------------------------------------------------------
// Passagem 2 — linguagem natural (prosa)
// ---------------------------------------------------------------------------

const MAIN_CUES = /gosto|recomendo|melhor (?:op[cç][aã]o|mercado|escolha|entrada)|principal|prefiro|aposto (?:em|no|na)|entrada principal/i;
const ALT_CUES = /alternativa|segunda op[cç][aã]o|outra op[cç][aã]o|tamb[eé]m (?:parece|gosto|vejo|sólido|solido)/i;
const AVOID_CUES = /evitar|evitaria|n[aã]o gosto|fugir|cuidado com|n[aã]o recomendo|melhor n[aã]o/i;
const ARGUMENT_CUES = /\bporque\b|\bpois\b|\bargumento\b|pelo fato de|\bconsiderando\b|\bjustifica/i;
const RISK_CUES = /\brisco\b|\bcuidado\b|aten[cç][aã]o|\bressalva\b|limita[cç][aã]o/i;
const INCONSISTENCY_CUES = /inconsist[êe]nc|contradiz|diverge|incoer/i;
const EXTERNAL_RESEARCH_CUES = /pesquisei|busquei informa|de acordo com not[ií]cias|fontes externas|al[ée]m dos dados fornecidos/i;

const DECIMAL_PLACEHOLDER = "@@DEC@@";

function toClauses(text: string): string[] {
  // Protege "." decimal (ex.: "3.5", "1.62") antes de dividir por frase, senão
  // nomes de mercado como "Under 3.5" seriam partidos ao meio.
  const protectedText = text.replace(/(\d)\.(\d)/g, `$1${DECIMAL_PLACEHOLDER}$2`);
  return protectedText
    .split(/[\n.!?;]+/)
    .map((s) => s.split(DECIMAL_PLACEHOLDER).join(".").trim())
    .filter(Boolean);
}

function findOddInClause(clause: string): number | undefined {
  const match =
    clause.match(/@\s*(\d+[.,]\d{1,2})/) ??
    clause.match(/odd\s*(?:de|:)?\s*(\d+[.,]\d{1,2})/i) ??
    clause.match(/\ba\s+(\d+[.,]\d{2})\b/i);
  return match ? parseNumber(match[1]) : undefined;
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findProbability(text: string, keywordPatterns: string[]): number | undefined {
  for (const keyword of keywordPatterns) {
    // "NN% de <termo>" é o padrão mais comum quando várias probabilidades são
    // listadas em sequência ("55%... 22% de empate e 23% para o visitante", ou
    // uma tabela "Santos\t64%\nEmpate\t23%"), então tenta primeiro. "[^%\d\n]"
    // impede pular por cima de outro percentual, número ou linha da tabela.
    const backward = new RegExp(`(\\d{1,3}(?:[.,]\\d+)?)\\s*%[^%\\d\\n]{0,20}?(?:${keyword})`, "i");
    const forward = new RegExp(`(?:${keyword})[^%\\d\\n]{0,20}(\\d{1,3}(?:[.,]\\d+)?)\\s*%`, "i");
    const match = text.match(backward) ?? text.match(forward);
    if (match) return parsePercent(match[1]);
  }
  return undefined;
}

const PROBABILITY_ANCHOR = /probabilidad|proje[cç][aã]o de (?:resultado|probabilidades)|chance de (?:vencer|vit[oó]ria)/i;

/**
 * Só tenta extrair probabilidades de resultado quando o texto tem uma menção
 * explícita a "probabilidade/projeção" por perto. Relatórios reais de IA costumam
 * estar cheios de outros percentuais (aproveitamento, posse, conversão...) que não
 * têm relação com a probabilidade do resultado — sem essa âncora, o risco de
 * associar o número errado ao mercado errado é alto demais para valer a pena.
 */
function findMatchProbabilities(
  text: string,
  context: ExtractContext
): { home?: number; draw?: number; away?: number } {
  const anchorMatch = text.match(PROBABILITY_ANCHOR);
  if (!anchorMatch || anchorMatch.index === undefined) return {};

  const scope = text.slice(anchorMatch.index, anchorMatch.index + 400);
  const homeKeywords = [
    ...(context.homeTeam ? [escapeRegex(context.homeTeam)] : []),
    "vit[oó]ria da casa",
    "\\bcasa\\b",
  ];
  const awayKeywords = [
    ...(context.awayTeam ? [escapeRegex(context.awayTeam)] : []),
    "vit[oó]ria (?:do|de) (?:visitante|fora)",
    "\\bvisitante\\b",
    "\\bfora\\b",
  ];

  return {
    home: findProbability(scope, homeKeywords),
    draw: findProbability(scope, ["\\bempate\\b"]),
    away: findProbability(scope, awayKeywords),
  };
}

function findFavorite(text: string, context: ExtractContext): string | undefined {
  const { homeTeam, awayTeam } = context;
  if (!homeTeam && !awayTeam) return undefined;

  const clauses = toClauses(text);
  const favoriteClause = clauses.find((c) => /favorit|deve vencer|tende a vencer/i.test(c));
  const searchIn = favoriteClause ?? text;

  if (homeTeam && searchIn.toLowerCase().includes(homeTeam.toLowerCase())) return homeTeam;
  if (awayTeam && searchIn.toLowerCase().includes(awayTeam.toLowerCase())) return awayTeam;
  return undefined;
}

// Placares em português costumam usar "a" como separador ("2 a 0"), além de
// "x" ou hífen ("2x0", "2-0").
const SCORE_PAIR = /(\d{1,2})\s*(?:[-–x×]|\ba\b)\s*(\d{1,2})/i;

/** Extrai um par "N-N" de dentro de um texto livre (ex.: "Santos 2 x 0 Chapecoense" -> "2-0"). */
function extractScorePair(text: string): string | undefined {
  const match = text.match(SCORE_PAIR);
  return match ? `${match[1]}-${match[2]}` : undefined;
}

function findScore(text: string): string | undefined {
  const match = text.match(
    new RegExp(`(?:placar|vence(?:r)? por|triunfo por|resultado provável)[^\\d]{0,30}${SCORE_PAIR.source}`, "i")
  );
  return match ? `${match[1]}-${match[2]}` : undefined;
}

function findGoalRange(text: string): string | undefined {
  const match = text.match(/(?:faixa de gols|entre)\D{0,15}(\d)\s*(?:e|a|-|–)\s*(\d)\s*gols/i);
  return match ? `${match[1]} a ${match[2]} gols` : undefined;
}

function findConfidence(text: string): number | undefined {
  const match = text.match(/confian[çc]a[^\d]{0,30}(\d{1,2}(?:[.,]\d)?)(?:\s*(?:\/|em|de)\s*10)?/i);
  if (!match) return undefined;
  const value = parseNumber(match[1]);
  return value !== undefined && value >= 0 && value <= 10 ? value : undefined;
}

function findMarketMentions(
  text: string,
  context: ExtractContext
): {
  mainPick?: MarketOpinion;
  alternativePicks: MarketOpinion[];
  avoidPicks: MarketOpinion[];
} {
  const alternativePicks: MarketOpinion[] = [];
  const avoidPicks: MarketOpinion[] = [];
  const seen = new Set<string>();
  let resolvedMainPick: MarketOpinion | undefined;

  for (const clause of toClauses(text)) {
    const canonical = canonicalizeMarket(clause, context);
    if (!canonical) continue;

    const key = `${canonical.market}|${canonical.selection}`;
    let recommendation: MarketOpinion["recommendation"] | undefined;
    if (AVOID_CUES.test(clause)) recommendation = "avoid";
    else if (ALT_CUES.test(clause)) recommendation = "alternative";
    else if (MAIN_CUES.test(clause)) recommendation = "main";
    if (!recommendation) continue;

    if (seen.has(`${key}|${recommendation}`)) continue;
    seen.add(`${key}|${recommendation}`);

    const opinion: MarketOpinion = {
      market: canonical.market,
      selection: canonical.selection,
      odd: findOddInClause(clause),
      recommendation,
    };

    if (recommendation === "main" && !resolvedMainPick) resolvedMainPick = opinion;
    else if (recommendation === "alternative") alternativePicks.push(opinion);
    else if (recommendation === "avoid") avoidPicks.push(opinion);
  }

  return { mainPick: resolvedMainPick, alternativePicks, avoidPicks };
}

function findByCue(text: string, cue: RegExp, max: number): string[] {
  const found: string[] = [];
  for (const clause of toClauses(text)) {
    if (cue.test(clause)) {
      found.push(clause.length > 220 ? `${clause.slice(0, 217)}...` : clause);
      if (found.length >= max) break;
    }
  }
  return found;
}

function extractProseFields(rawText: string, context: ExtractContext): Partial<AIReport> {
  const { mainPick, alternativePicks, avoidPicks } = findMarketMentions(rawText, context);
  const probabilities = findMatchProbabilities(rawText, context);

  const partial: Partial<AIReport> = {
    favorite: findFavorite(rawText, context),
    expectedScore: findScore(rawText),
    expectedGoalRange: findGoalRange(rawText),
    homeProbability: probabilities.home,
    drawProbability: probabilities.draw,
    awayProbability: probabilities.away,
    confidence: findConfidence(rawText),
    mainPick,
    alternativePicks,
    avoidPicks,
    usedExternalResearch: EXTERNAL_RESEARCH_CUES.test(rawText) ? true : undefined,
    arguments: findByCue(rawText, ARGUMENT_CUES, 3),
    risks: findByCue(rawText, RISK_CUES, 3),
    inconsistencies: findByCue(rawText, INCONSISTENCY_CUES, 3),
  };

  return partial;
}

// ---------------------------------------------------------------------------
// Combinação — o formato "rótulo: valor" é mais intencional, então vence em
// caso de conflito; a prosa só preenche o que ainda estiver vazio.
// ---------------------------------------------------------------------------

function dedupeOpinions(opinions: MarketOpinion[]): MarketOpinion[] {
  const seen = new Set<string>();
  return opinions.filter((o) => {
    const key = `${o.market}|${o.selection}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function mergeExtracted(structured: Partial<AIReport>, prose: Partial<AIReport>): Partial<AIReport> {
  const alternativePicks = dedupeOpinions([
    ...(structured.alternativePicks ?? []),
    ...(prose.alternativePicks ?? []),
  ]);
  const avoidPicks = dedupeOpinions([
    ...(structured.avoidPicks ?? []),
    ...(prose.avoidPicks ?? []),
  ]);
  const arguments_ = [...new Set([...(structured.arguments ?? []), ...(prose.arguments ?? [])])];
  const risks = [...new Set([...(structured.risks ?? []), ...(prose.risks ?? [])])];
  const inconsistencies = [
    ...new Set([...(structured.inconsistencies ?? []), ...(prose.inconsistencies ?? [])]),
  ];

  return {
    favorite: structured.favorite ?? prose.favorite,
    expectedScore: structured.expectedScore ?? prose.expectedScore,
    expectedGoalRange: structured.expectedGoalRange ?? prose.expectedGoalRange,
    homeProbability: structured.homeProbability ?? prose.homeProbability,
    drawProbability: structured.drawProbability ?? prose.drawProbability,
    awayProbability: structured.awayProbability ?? prose.awayProbability,
    confidence: structured.confidence ?? prose.confidence,
    mainPick: structured.mainPick ?? prose.mainPick,
    usedExternalResearch: structured.usedExternalResearch ?? prose.usedExternalResearch,
    ...(alternativePicks.length ? { alternativePicks } : {}),
    ...(avoidPicks.length ? { avoidPicks } : {}),
    ...(arguments_.length ? { arguments: arguments_ } : {}),
    ...(risks.length ? { risks } : {}),
    ...(inconsistencies.length ? { inconsistencies } : {}),
  };
}

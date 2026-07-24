import type {
  FutOddsData,
  LastFiveForm,
  LastTwentyStats,
  MatchInfo,
  MatchOdds,
  MatchProbabilities,
  TeamStats,
} from "@/types";
import {
  infoAliases,
  lastFiveAliases,
  lastTwentyAliases,
  oddsAliases,
  probabilityAliases,
  percentFields,
} from "./aliases";
import { normalizeKey, parseNumber, parsePercent, splitKeyValue } from "./normalize";

type Section =
  | "info"
  | "odds"
  | "probabilities"
  | "lastFiveHome"
  | "lastFiveAway"
  | "lastTwentyHome"
  | "lastTwentyAway"
  | "unknown";

const HOME_LABELS = ["time da casa", "mandante", "time mandante"];
const AWAY_LABELS = ["time visitante", "visitante", "time fora"];

function detectSection(line: string, info: MatchInfo): Section | undefined {
  const key = normalizeKey(line.replace(/[-–].*$/, "").trim());
  if (key === "odds") return "odds";
  if (key === "probabilidades" || key === "probabilities") return "probabilities";

  const normalizedLine = normalizeKey(line);
  const last5Match = normalizedLine.match(/ultimos?\s*5\s*jogos/i);
  const last20Match = normalizedLine.match(/ultimos?\s*20\s*jogos/i);
  if (last5Match || last20Match) {
    const teamPart = line.split(/[-–]/).slice(1).join("-").trim();
    const isHome =
      teamPart && info.homeTeam
        ? teamPart.toLowerCase().includes(info.homeTeam.toLowerCase())
        : undefined;
    const isAway =
      teamPart && info.awayTeam
        ? teamPart.toLowerCase().includes(info.awayTeam.toLowerCase())
        : undefined;
    if (last5Match) {
      if (isAway) return "lastFiveAway";
      return "lastFiveHome";
    }
    if (isAway) return "lastTwentyAway";
    return "lastTwentyHome";
  }
  return undefined;
}

function extractTeamLine(line: string): { field: "homeTeam" | "awayTeam"; name: string; position?: number } | undefined {
  const kv = splitKeyValue(line);
  if (!kv) return undefined;
  const [rawKey, rawValue] = kv;
  const key = normalizeKey(rawKey);
  const isHome = HOME_LABELS.includes(key);
  const isAway = AWAY_LABELS.includes(key);
  if (!isHome && !isAway) return undefined;

  const posMatch = rawValue.match(/posi[cç][aã]o\s*(\d+)/i);
  const name = rawValue.replace(/\(.*posi[cç][aã]o.*\)/i, "").trim();
  return {
    field: isHome ? "homeTeam" : "awayTeam",
    name,
    position: posMatch ? Number.parseInt(posMatch[1], 10) : undefined,
  };
}

function applyOddsLine(odds: MatchOdds, key: string, value: string) {
  const norm = normalizeKey(key);
  const target = oddsAliases[norm];
  const num = parseNumber(value);
  if (target && num !== undefined) {
    odds[target] = num;
  } else if (num !== undefined) {
    odds[norm.replace(/\s+/g, "_")] = num;
  }
}

function applyProbabilityLine(prob: MatchProbabilities, key: string, value: string) {
  const norm = normalizeKey(key);
  const target = probabilityAliases[norm];
  if (!target) return;
  if (target === "expectedScore" || target === "expectedGoalRange") {
    (prob as Record<string, unknown>)[target] = value.trim();
    return;
  }
  const num = percentFields.has(target) ? parsePercent(value) : parseNumber(value);
  if (num !== undefined) {
    (prob as Record<string, number>)[target] = num;
  }
}

function applyLastFiveLine(stats: LastFiveForm, key: string, value: string) {
  const norm = normalizeKey(key);
  const target = lastFiveAliases[norm];
  if (!target) return;
  if (target === "form") {
    stats.form = value.trim();
    return;
  }
  const num = percentFields.has(target) ? parsePercent(value) : parseNumber(value);
  if (num !== undefined) {
    (stats as Record<string, number>)[target] = num;
  }
}

function applyLastTwentyLine(stats: LastTwentyStats, key: string, value: string) {
  const norm = normalizeKey(key);
  const target = lastTwentyAliases[norm];
  if (!target) return;
  const num = percentFields.has(target) ? parsePercent(value) : parseNumber(value);
  if (num !== undefined) {
    (stats as Record<string, number>)[target] = num;
  }
}

export function parseFutOdds(rawText: string): FutOddsData {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const info: MatchInfo = { homeTeam: "", awayTeam: "" };
  const odds: MatchOdds = {};
  const probabilities: MatchProbabilities = {};
  const home: TeamStats = {};
  const away: TeamStats = {};
  const unparsedLines: string[] = [];

  let section: Section = "info";

  // Primeira passagem: localizar nomes dos times para permitir detecção de seção "últimos N jogos - <time>".
  for (const line of lines) {
    const teamLine = extractTeamLine(line);
    if (teamLine) {
      info[teamLine.field] = teamLine.name;
      if (teamLine.position !== undefined) {
        info[teamLine.field === "homeTeam" ? "homePosition" : "awayPosition"] =
          teamLine.position;
      }
    }
  }

  // Fallback: linha "Time A x Time B" ou "Time A vs Time B"
  if (!info.homeTeam || !info.awayTeam) {
    const vsLine = lines.find((l) => /\s(x|vs\.?)\s/i.test(l) && !l.includes(":"));
    if (vsLine) {
      const [a, b] = vsLine.split(/\s(?:x|vs\.?)\s/i);
      if (a && b) {
        info.homeTeam = info.homeTeam || a.trim();
        info.awayTeam = info.awayTeam || b.trim();
      }
    }
  }

  for (const line of lines) {
    const detected = detectSection(line, info);
    if (detected) {
      section = detected;
      continue;
    }
    if (extractTeamLine(line)) continue; // já processado na primeira passagem

    const kv = splitKeyValue(line);
    if (!kv) {
      unparsedLines.push(line);
      continue;
    }
    const [key, value] = kv;
    const norm = normalizeKey(key);

    if (section === "info") {
      const target = infoAliases[norm];
      if (target) {
        (info as unknown as Record<string, string>)[target] = value.trim();
      } else {
        unparsedLines.push(line);
      }
      continue;
    }

    if (section === "odds") {
      applyOddsLine(odds, key, value);
      continue;
    }
    if (section === "probabilities") {
      applyProbabilityLine(probabilities, key, value);
      continue;
    }
    if (section === "lastFiveHome") {
      home.lastFive = home.lastFive ?? {};
      applyLastFiveLine(home.lastFive, key, value);
      continue;
    }
    if (section === "lastFiveAway") {
      away.lastFive = away.lastFive ?? {};
      applyLastFiveLine(away.lastFive, key, value);
      continue;
    }
    if (section === "lastTwentyHome") {
      home.lastTwenty = home.lastTwenty ?? {};
      applyLastTwentyLine(home.lastTwenty, key, value);
      continue;
    }
    if (section === "lastTwentyAway") {
      away.lastTwenty = away.lastTwenty ?? {};
      applyLastTwentyLine(away.lastTwenty, key, value);
      continue;
    }
    unparsedLines.push(line);
  }

  const comparison = buildComparison(home, away);

  return {
    info,
    odds,
    probabilities,
    home,
    away,
    comparison,
    marketValues: buildMarketValues(odds, probabilities),
    unparsedLines,
    rawText,
  };
}

function buildComparison(home: TeamStats, away: TeamStats) {
  const rows: FutOddsData["comparison"] = [];
  const h = home.lastTwenty;
  const a = away.lastTwenty;
  if (!h && !a) return rows;

  const push = (
    label: string,
    homeVal?: number,
    awayVal?: number,
    unit: "percent" | "count" | "decimal" = "decimal"
  ) => {
    if (homeVal === undefined && awayVal === undefined) return;
    rows.push({ label, home: homeVal, away: awayVal, unit });
  };

  push("PPG", h?.ppg, a?.ppg);
  push("Gols marcados", h?.goalsFor, a?.goalsFor, "count");
  push("Gols sofridos", h?.goalsAgainst, a?.goalsAgainst, "count");
  push("xG", h?.xg, a?.xg, "decimal");
  push("Clean sheet", h?.cleanSheet, a?.cleanSheet, "percent");
  push("Falhou em marcar", h?.failedToScore, a?.failedToScore, "percent");
  push("Chutes", h?.shots, a?.shots, "decimal");
  push("Chutes no alvo", h?.shotsOnTarget, a?.shotsOnTarget, "decimal");
  push("Conversão", h?.conversion, a?.conversion, "percent");
  push("Escanteios", h?.corners, a?.corners, "decimal");
  push("Cartões", h?.cards, a?.cards, "decimal");
  push("Posse", h?.possession, a?.possession, "percent");

  return rows;
}

export function buildMarketValues(odds: MatchOdds, probabilities: MatchProbabilities) {
  const rows: FutOddsData["marketValues"] = [];
  const push = (market: string, selection: string, odd?: number, prob?: number) => {
    if (odd === undefined && prob === undefined) return;
    rows.push({ market, selection, marketOdd: odd, projectedProbability: prob });
  };

  push("Resultado final", "Casa", odds.home, probabilities.home);
  push("Resultado final", "Empate", odds.draw, probabilities.draw);
  push("Resultado final", "Fora", odds.away, probabilities.away);
  push("Gols", "Over 2.5", odds.over25, probabilities.over25);
  push("Gols", "Under 3.5", odds.under35, probabilities.under35);
  push("Gols 1º tempo", "Over 0.5 HT", odds.over05HT, probabilities.over05HT);
  push("Ambas marcam", "Sim", odds.bttsYes, probabilities.bttsYes);
  push("Ambas marcam", "Não", odds.bttsNo, undefined);

  return rows;
}

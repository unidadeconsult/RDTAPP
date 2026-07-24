import type { Analysis, MarketAnalysis } from "@/types";

export type ConvergenceCell = "favor" | "against" | "neutral" | "absent";

export type ConvergenceRow = {
  market: string;
  selection: string;
  lastFive: ConvergenceCell;
  lastTwenty: ConvergenceCell;
  futOdds: ConvergenceCell;
  ai: ConvergenceCell;
  conclusion: string;
};

function avg(values: (number | undefined)[]): number | undefined {
  const valid = values.filter((v): v is number => v !== undefined);
  if (valid.length === 0) return undefined;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function sampleSignal(market: MarketAnalysis, analysis: Analysis, horizon: "five" | "twenty"): ConvergenceCell {
  const { home, away } = analysis.futOdds;
  const key = `${market.market} ${market.selection}`.toLowerCase();

  if (horizon === "five") {
    if (key.includes("over 0.5 ht")) {
      const value = avg([home.lastFive?.over05HT, away.lastFive?.over05HT]);
      return classify(value);
    }
    if (key.includes("over 2.5") || key.includes("under")) {
      const value = avg([home.lastFive?.over25, away.lastFive?.over25]);
      return classify(key.includes("under") ? value !== undefined ? 1 - value : undefined : value);
    }
    if (key.includes("btts") || key.includes("ambas marcam")) {
      const value = avg([home.lastFive?.bttsYes, away.lastFive?.bttsYes]);
      return classify(market.selection.toLowerCase().includes("não") ? value !== undefined ? 1 - value : undefined : value);
    }
    return "absent";
  }

  if (key.includes("over 2.5")) return classify(avg([home.lastTwenty?.over25, away.lastTwenty?.over25]));
  if (key.includes("under")) {
    const over = avg([home.lastTwenty?.over25, away.lastTwenty?.over25]);
    return classify(over !== undefined ? 1 - over : undefined);
  }
  if (key.includes("casa") || key.includes("fora") || key.includes("empate")) {
    const homeRate = winRate(home.lastTwenty);
    const awayRate = winRate(away.lastTwenty);
    if (homeRate === undefined || awayRate === undefined) return "absent";
    if (key.includes("casa")) return classify(homeRate > awayRate ? 0.7 : 0.3);
    if (key.includes("fora")) return classify(awayRate > homeRate ? 0.7 : 0.3);
    return "neutral";
  }
  return "absent";
}

function winRate(stats?: { wins?: number; draws?: number; losses?: number }): number | undefined {
  if (!stats) return undefined;
  const total = (stats.wins ?? 0) + (stats.draws ?? 0) + (stats.losses ?? 0);
  if (total === 0) return undefined;
  return (stats.wins ?? 0) / total;
}

function classify(value: number | undefined): ConvergenceCell {
  if (value === undefined) return "absent";
  if (value >= 0.55) return "favor";
  if (value <= 0.4) return "against";
  return "neutral";
}

function futOddsSignal(market: MarketAnalysis): ConvergenceCell {
  if (market.ev === undefined) return "absent";
  if (market.ev >= 0.02 && market.support >= 50) return "favor";
  if (market.ev < -0.02) return "against";
  return "neutral";
}

function aiSignal(analysis: Analysis, market: MarketAnalysis): ConvergenceCell {
  const consensus = analysis.marketConsensus.find(
    (mc) => mc.market === market.market && mc.selection === market.selection
  );
  if (!consensus) return "absent";
  if (consensus.level === "strong" || consensus.level === "near") return "favor";
  if (consensus.level === "weak") return "against";
  return "neutral";
}

function conclude(cells: ConvergenceCell[]): string {
  const relevant = cells.filter((c) => c !== "absent");
  if (relevant.length === 0) return "Dados insuficientes";
  const favor = relevant.filter((c) => c === "favor").length;
  const against = relevant.filter((c) => c === "against").length;
  if (favor === relevant.length) return "Convergência total";
  if (against === relevant.length) return "Contradição consistente";
  if (favor > against) return "Convergência parcial";
  if (against > favor) return "Divergência predominante";
  return "Sinais mistos";
}

export function buildConvergenceMatrix(analysis: Analysis): ConvergenceRow[] {
  return analysis.markets
    .filter((m) => m.recommendation !== "neutral" || m.support >= 50)
    .map((market) => {
      const lastFive = sampleSignal(market, analysis, "five");
      const lastTwenty = sampleSignal(market, analysis, "twenty");
      const futOdds = futOddsSignal(market);
      const ai = aiSignal(analysis, market);
      return {
        market: market.market,
        selection: market.selection,
        lastFive,
        lastTwenty,
        futOdds,
        ai,
        conclusion: conclude([lastFive, lastTwenty, futOdds, ai]),
      };
    });
}

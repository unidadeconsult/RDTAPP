import type { Analysis, MarketAnalysis } from "@/types";

export type Scenario = {
  key: "conservative" | "likely" | "alternative";
  title: string;
  description: string;
  markets: MarketAnalysis[];
  score?: string;
};

function findMarket(markets: MarketAnalysis[], market: string, selection: string) {
  return markets.find(
    (m) => m.market.toLowerCase() === market.toLowerCase() && m.selection.toLowerCase() === selection.toLowerCase()
  );
}

export function buildScenarios(analysis: Analysis): Scenario[] {
  const { markets, futOdds } = analysis;
  const { info, probabilities } = futOdds;
  const home = info.homeTeam || "time da casa";
  const away = info.awayTeam || "time visitante";

  const under35 = findMarket(markets, "Gols", "Under 3.5") ?? findMarket(markets, "Resultado final", "Under 3.5");
  const over05HT = findMarket(markets, "Gols 1º tempo", "Over 0.5 HT");
  const bttsNao = findMarket(markets, "Ambas marcam", "Não");

  const conservativeMarkets = [under35, bttsNao].filter((m): m is MarketAnalysis => !!m);

  const conservative: Scenario = {
    key: "conservative",
    title: "Conservador",
    description:
      conservativeMarkets.length > 0
        ? `Os dados sugerem uma partida mais controlada, com poucos gols. A projeção de ${
            probabilities.expectedGoalRange ?? "gols limitados"
          } e a sustentação estatística dos últimos 20 jogos indicam cautela ofensiva de ambos os lados.`
        : "Não há dados suficientes para sustentar um cenário conservador específico para esta partida.",
    markets: conservativeMarkets,
    score: probabilities.expectedScore,
  };

  const likelyMarkets = [analysis.mainPick, over05HT].filter(
    (m): m is MarketAnalysis => !!m
  );
  const favorite =
    probabilities.home !== undefined && probabilities.away !== undefined
      ? probabilities.home >= probabilities.away
        ? home
        : away
      : undefined;

  const likely: Scenario = {
    key: "likely",
    title: "Provável",
    description: favorite
      ? `O cenário mais provável, segundo a projeção, tem ${favorite} como favorito, com volume de jogo suficiente para sustentar o mercado principal identificado (${
          analysis.mainPick ? `${analysis.mainPick.market} — ${analysis.mainPick.selection}` : "sem indicação clara"
        }).`
      : "A projeção não aponta um favorito claro para esta partida com os dados informados.",
    markets: likelyMarkets,
    score: probabilities.expectedScore,
  };

  const speculative = [...markets]
    .filter((m) => m.recommendation === "avoid" || (m.projectedProbability ?? 1) < 0.3)
    .sort((a, b) => (b.marketOdd ?? 0) - (a.marketOdd ?? 0))[0];

  const alternative: Scenario = {
    key: "alternative",
    title: "Alternativo",
    description: speculative
      ? `Cenário de maior variância: ${speculative.market} — ${speculative.selection} tem probabilidade projetada baixa (${
          speculative.projectedProbability !== undefined
            ? `${(speculative.projectedProbability * 100).toFixed(1)}%`
            : "não informada"
        }), mas representa a via especulativa dentro dos dados disponíveis, sujeita a falhas de conversão ou transições.`
      : "Não há indicação clara de cenário alternativo de alta variância nos dados informados.",
    markets: speculative ? [speculative] : [],
  };

  return [conservative, likely, alternative];
}

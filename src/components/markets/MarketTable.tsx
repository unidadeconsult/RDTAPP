import type { MarketAnalysis } from "@/types";
import { formatOdd, formatPercent } from "@/lib/calculations/ev";
import { MarketTrafficLight } from "./MarketTrafficLight";
import { ConsistencyBadge } from "./ConsistencyBadge";
import { EVRuler } from "./EVRuler";

const recommendationLabels: Record<MarketAnalysis["recommendation"], string> = {
  main: "Principal",
  alternative: "Alternativo",
  neutral: "Neutro",
  avoid: "Evitar",
};

const recommendationClasses: Record<MarketAnalysis["recommendation"], string> = {
  main: "bg-green text-white",
  alternative: "bg-blue text-white",
  neutral: "bg-bg-steel text-text-secondary dark:bg-white/10 dark:text-white/70",
  avoid: "bg-red text-white",
};

export function MarketTable({ markets }: { markets: MarketAnalysis[] }) {
  if (markets.length === 0) {
    return (
      <p className="text-sm text-text-secondary dark:text-white/60">
        Nenhum mercado com dados suficientes foi identificado no texto informado.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-secondary dark:border-white/10 dark:text-white/50">
            <th className="py-2 pr-3 font-medium">Mercado</th>
            <th className="py-2 pr-3 font-medium">Seleção</th>
            <th className="py-2 pr-3 font-medium">Prob.</th>
            <th className="py-2 pr-3 font-medium">Odd justa</th>
            <th className="py-2 pr-3 font-medium">Odd mercado</th>
            <th className="py-2 pr-3 font-medium">EV</th>
            <th className="py-2 pr-3 font-medium">Risco</th>
            <th className="py-2 pr-3 font-medium">Consistência</th>
            <th className="py-2 pr-3 font-medium">Recomendação</th>
          </tr>
        </thead>
        <tbody>
          {markets.map((market) => (
            <tr
              key={`${market.market}-${market.selection}`}
              className="border-b border-border last:border-0 dark:border-white/10"
            >
              <td className="py-2.5 pr-3 font-medium text-text-primary dark:text-white">
                {market.market}
              </td>
              <td className="py-2.5 pr-3 text-text-secondary dark:text-white/70">
                {market.selection}
              </td>
              <td className="py-2.5 pr-3">{formatPercent(market.projectedProbability)}</td>
              <td className="py-2.5 pr-3">{formatOdd(market.fairOdd)}</td>
              <td className="py-2.5 pr-3">{formatOdd(market.marketOdd)}</td>
              <td className="py-2.5 pr-3">
                <EVRuler market={market} />
              </td>
              <td className="py-2.5 pr-3">
                <MarketTrafficLight market={market} />
              </td>
              <td className="py-2.5 pr-3">
                <ConsistencyBadge level={market.consistency} />
              </td>
              <td className="py-2.5 pr-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${recommendationClasses[market.recommendation]}`}
                >
                  {recommendationLabels[market.recommendation]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

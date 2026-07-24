import { formatOdd, formatPercent } from "@/lib/calculations/ev";
import type { MarketAnalysis } from "@/types";

export function EVRuler({ market }: { market: MarketAnalysis }) {
  const ev = market.ev;
  const clamped = ev === undefined ? 0 : Math.max(-0.15, Math.min(0.15, ev));
  const position = ((clamped + 0.15) / 0.3) * 100;

  const title = [
    `Odd mercado: ${formatOdd(market.marketOdd)}`,
    `Odd justa: ${formatOdd(market.fairOdd)}`,
    `Probabilidade: ${formatPercent(market.projectedProbability)}`,
    `EV: ${ev !== undefined ? `${(ev * 100).toFixed(1)}%` : "—"}`,
  ].join(" · ");

  return (
    <div title={title} className="w-40">
      <div className="relative h-2 rounded-full bg-gradient-to-r from-red via-amber to-green">
        {ev !== undefined && (
          <span
            className="absolute top-1/2 h-3 w-3 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 border-white bg-blue-dark shadow"
            style={{ left: `${position}%` }}
          />
        )}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-text-secondary dark:text-white/50">
        <span>-15%</span>
        <span>0%</span>
        <span>+15%</span>
      </div>
    </div>
  );
}

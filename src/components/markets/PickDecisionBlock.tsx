import type { MarketAnalysis } from "@/types";
import { formatOdd, formatPercent } from "@/lib/calculations/ev";

function PickCard({
  title,
  market,
  colorClass,
  emptyText,
}: {
  title: string;
  market?: MarketAnalysis;
  colorClass: string;
  emptyText: string;
}) {
  return (
    <div className={`rounded-xl border p-4 ${colorClass}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{title}</p>
      {market ? (
        <>
          <p className="mt-1 font-heading text-lg font-bold">
            {market.market} — {market.selection}
          </p>
          <p className="mt-1 text-sm opacity-90">
            Odd {formatOdd(market.marketOdd)} · Prob. {formatPercent(market.projectedProbability)} · EV{" "}
            {market.ev !== undefined ? `${(market.ev * 100).toFixed(1)}%` : "—"}
          </p>
        </>
      ) : (
        <p className="mt-1 text-sm opacity-80">{emptyText}</p>
      )}
    </div>
  );
}

export function PickDecisionBlock({
  mainPick,
  alternativePick,
  avoidPicks,
}: {
  mainPick?: MarketAnalysis;
  alternativePick?: MarketAnalysis;
  avoidPicks: MarketAnalysis[];
}) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <PickCard
        title="Palpite principal"
        market={mainPick}
        colorClass="border-green/30 bg-green-soft text-green-dark dark:border-green/30 dark:bg-green/10 dark:text-green"
        emptyText="Nenhum mercado reúne dados suficientes para ser indicado como principal."
      />
      <PickCard
        title="Palpite alternativo"
        market={alternativePick}
        colorClass="border-blue/30 bg-blue-soft text-blue-strong dark:border-blue/30 dark:bg-blue/10 dark:text-blue"
        emptyText="Nenhuma alternativa sustentável foi identificada."
      />
      <div className="rounded-xl border border-red/30 bg-red/10 p-4 text-red">
        <p className="text-xs font-semibold uppercase tracking-wide opacity-80">Evitar</p>
        {avoidPicks.length > 0 ? (
          <ul className="mt-1 space-y-1 text-sm">
            {avoidPicks.map((m) => (
              <li key={`${m.market}-${m.selection}`}>
                {m.market} — {m.selection} (odd {formatOdd(m.marketOdd)})
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm opacity-80">Nenhum mercado mal precificado identificado.</p>
        )}
      </div>
    </div>
  );
}

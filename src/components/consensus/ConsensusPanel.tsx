import type { MarketConsensus } from "@/types";
import { consensusLevelLabels } from "@/lib/consensus/consensus";

const levelClasses: Record<MarketConsensus["level"], string> = {
  strong: "bg-green-soft text-green-dark dark:bg-green/20 dark:text-green",
  near: "bg-blue-soft text-blue-strong dark:bg-blue/20 dark:text-blue",
  divided: "bg-amber/20 text-amber",
  weak: "bg-red/15 text-red",
};

export function ConsensusPanel({ marketConsensus }: { marketConsensus: MarketConsensus[] }) {
  if (marketConsensus.length === 0) {
    return (
      <p className="text-sm text-text-secondary dark:text-white/60">
        Adicione relatórios de IA para calcular o índice de consenso.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-secondary dark:border-white/10 dark:text-white/50">
            <th className="py-2 pr-3 font-medium">Mercado</th>
            <th className="py-2 pr-3 font-medium">Ocorrência</th>
            <th className="py-2 pr-3 font-medium">Valor</th>
            <th className="py-2 pr-3 font-medium">Dados</th>
            <th className="py-2 pr-3 font-medium">Resultado</th>
          </tr>
        </thead>
        <tbody>
          {marketConsensus.map((mc) => (
            <tr key={`${mc.market}-${mc.selection}`} className="border-b border-border last:border-0 dark:border-white/10">
              <td className="py-2.5 pr-3 font-medium text-text-primary dark:text-white">
                {mc.market} — {mc.selection}
              </td>
              <td className="py-2.5 pr-3">{mc.occurrenceScore}</td>
              <td className="py-2.5 pr-3">{mc.valueScore}</td>
              <td className="py-2.5 pr-3">{mc.dataScore}</td>
              <td className="py-2.5 pr-3">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${levelClasses[mc.level]}`}>
                  {consensusLevelLabels[mc.level]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

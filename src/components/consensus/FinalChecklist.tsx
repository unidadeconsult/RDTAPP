import { CheckCircle2, CircleDashed, XCircle } from "lucide-react";
import type { ChecklistAnswer, ChecklistItem } from "@/lib/checklist";
import type { MarketAnalysis } from "@/types";
import { formatOdd, formatPercent } from "@/lib/calculations/ev";

const answerConfig: Record<ChecklistAnswer, { Icon: typeof CheckCircle2; className: string }> = {
  yes: { Icon: CheckCircle2, className: "text-green" },
  partial: { Icon: CircleDashed, className: "text-amber" },
  no: { Icon: XCircle, className: "text-red" },
};

export function FinalChecklist({
  items,
  markets,
}: {
  items: ChecklistItem[];
  markets: MarketAnalysis[];
}) {
  return (
    <div className="space-y-6">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-secondary dark:border-white/10 dark:text-white/50">
              <th className="py-2 pr-3 font-medium">Mercado</th>
              <th className="py-2 pr-3 font-medium">Prob.</th>
              <th className="py-2 pr-3 font-medium">Odd justa</th>
              <th className="py-2 pr-3 font-medium">Odd mercado</th>
              <th className="py-2 pr-3 font-medium">EV</th>
              <th className="py-2 pr-3 font-medium">Risco</th>
              <th className="py-2 pr-3 font-medium">Recomendação</th>
            </tr>
          </thead>
          <tbody>
            {markets.map((m) => (
              <tr key={`${m.market}-${m.selection}`} className="border-b border-border last:border-0 dark:border-white/10">
                <td className="py-2 pr-3 font-medium text-text-primary dark:text-white">
                  {m.market} — {m.selection}
                </td>
                <td className="py-2 pr-3">{formatPercent(m.projectedProbability)}</td>
                <td className="py-2 pr-3">{formatOdd(m.fairOdd)}</td>
                <td className="py-2 pr-3">{formatOdd(m.marketOdd)}</td>
                <td className="py-2 pr-3">{m.ev !== undefined ? `${(m.ev * 100).toFixed(1)}%` : "—"}</td>
                <td className="py-2 pr-3 capitalize">{m.risk}</td>
                <td className="py-2 pr-3 capitalize">{m.recommendation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h4 className="mb-2 font-heading text-sm font-semibold text-text-primary dark:text-white">
          Checklist de prudência
        </h4>
        <ul className="space-y-2">
          {items.map((item) => {
            const { Icon, className } = answerConfig[item.answer];
            return (
              <li key={item.question} className="flex items-start gap-2 text-sm">
                <Icon size={16} className={`mt-0.5 shrink-0 ${className}`} />
                <div>
                  <p className="font-medium text-text-primary dark:text-white">{item.question}</p>
                  <p className="text-xs text-text-secondary dark:text-white/50">{item.detail}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

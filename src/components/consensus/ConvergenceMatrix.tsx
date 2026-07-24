import type { ConvergenceCell, ConvergenceRow } from "@/lib/convergence";

const cellStyle: Record<ConvergenceCell, string> = {
  favor: "bg-green-soft text-green-dark dark:bg-green/15 dark:text-green",
  against: "bg-red/10 text-red",
  neutral: "bg-amber/15 text-amber",
  absent: "bg-bg-steel text-text-secondary dark:bg-white/5 dark:text-white/40",
};

const cellLabel: Record<ConvergenceCell, string> = {
  favor: "A favor",
  against: "Contra",
  neutral: "Neutro",
  absent: "—",
};

function Cell({ value }: { value: ConvergenceCell }) {
  return (
    <span className={`inline-block w-full rounded-md px-2 py-1 text-center text-xs font-medium ${cellStyle[value]}`}>
      {cellLabel[value]}
    </span>
  );
}

export function ConvergenceMatrix({ rows }: { rows: ConvergenceRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-text-secondary dark:text-white/60">
        Nenhum mercado com dados suficientes para compor a matriz de convergência.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-secondary dark:border-white/10 dark:text-white/50">
            <th className="py-2 pr-3 font-medium">Mercado</th>
            <th className="py-2 pr-3 font-medium">Últimos 5</th>
            <th className="py-2 pr-3 font-medium">Últimos 20</th>
            <th className="py-2 pr-3 font-medium">FutOdds</th>
            <th className="py-2 pr-3 font-medium">IAs</th>
            <th className="py-2 pr-3 font-medium">Conclusão</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.market}-${row.selection}`} className="border-b border-border last:border-0 dark:border-white/10">
              <td className="py-2 pr-3 font-medium text-text-primary dark:text-white">
                {row.market} — {row.selection}
              </td>
              <td className="py-2 pr-3"><Cell value={row.lastFive} /></td>
              <td className="py-2 pr-3"><Cell value={row.lastTwenty} /></td>
              <td className="py-2 pr-3"><Cell value={row.futOdds} /></td>
              <td className="py-2 pr-3"><Cell value={row.ai} /></td>
              <td className="py-2 pr-3 text-text-secondary dark:text-white/70">{row.conclusion}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import type { TeamPairStat } from "@/types";
import { formatPercent } from "@/lib/calculations/ev";

function formatValue(value: number | undefined, unit: TeamPairStat["unit"]) {
  if (value === undefined) return "—";
  if (unit === "percent") return formatPercent(value);
  if (unit === "count") return value.toFixed(0);
  return value.toFixed(2);
}

export function TeamComparison({
  homeTeam,
  awayTeam,
  rows,
}: {
  homeTeam: string;
  awayTeam: string;
  rows: TeamPairStat[];
}) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-text-secondary dark:text-white/60">
        Dados comparativos insuficientes no texto informado.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-secondary dark:border-white/10 dark:text-white/50">
            <th className="w-1/3 py-2 font-medium text-blue">{homeTeam}</th>
            <th className="w-1/3 py-2 text-center font-medium">Indicador</th>
            <th className="w-1/3 py-2 text-right font-medium text-green">{awayTeam}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-border last:border-0 dark:border-white/10">
              <td className="py-2 font-semibold text-blue-dark dark:text-white">
                {formatValue(row.home, row.unit)}
              </td>
              <td className="py-2 text-center text-text-secondary dark:text-white/60">{row.label}</td>
              <td className="py-2 text-right font-semibold text-green-dark dark:text-green">
                {formatValue(row.away, row.unit)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

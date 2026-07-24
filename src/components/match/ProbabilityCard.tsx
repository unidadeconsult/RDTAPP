import { formatPercent } from "@/lib/calculations/ev";

export function ProbabilityCard({
  label,
  value,
  implied,
}: {
  label: string;
  value?: number;
  implied?: number;
}) {
  const diff = value !== undefined && implied !== undefined ? value - implied : undefined;

  return (
    <div className="rounded-xl border border-border bg-bg-card p-4 shadow-card dark:border-white/10 dark:bg-white/5">
      <p className="text-xs font-medium text-text-secondary dark:text-white/60">{label}</p>
      <p className="font-heading text-2xl font-bold text-blue-dark dark:text-white">
        {formatPercent(value)}
      </p>
      {implied !== undefined && (
        <p className="mt-1 text-xs text-text-secondary dark:text-white/50">
          Implícita: {formatPercent(implied)}{" "}
          {diff !== undefined && (
            <span className={diff >= 0 ? "text-green" : "text-red"}>
              ({diff >= 0 ? "+" : ""}
              {(diff * 100).toFixed(1)}pp)
            </span>
          )}
        </p>
      )}
    </div>
  );
}

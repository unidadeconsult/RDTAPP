import { formatOdd } from "@/lib/calculations/ev";

export function OddsCard({
  label,
  odd,
  accent = "blue",
}: {
  label: string;
  odd?: number;
  accent?: "blue" | "green";
}) {
  const accentClass = accent === "green" ? "text-green" : "text-blue";
  return (
    <div className="rounded-xl border border-border bg-bg-card px-4 py-3 text-center shadow-card dark:border-white/10 dark:bg-white/5">
      <p className="text-xs font-medium text-text-secondary dark:text-white/60">{label}</p>
      <p className={`font-heading text-xl font-bold ${accentClass}`}>{formatOdd(odd)}</p>
    </div>
  );
}

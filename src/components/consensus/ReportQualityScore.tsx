import type { ReportQuality } from "@/types";

export function ReportQualityScore({ quality }: { quality: ReportQuality }) {
  const color =
    quality.score >= 75 ? "text-green" : quality.score >= 50 ? "text-amber" : "text-red";

  return (
    <div title={quality.notes.join(" · ") || "Sem ressalvas identificadas."}>
      <div className="flex items-center justify-between text-xs text-text-secondary dark:text-white/50">
        <span>Qualidade do relatório</span>
        <span className={`font-semibold ${color}`}>{quality.score}/100</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-bg-steel dark:bg-white/10">
        <div
          className={`h-full ${quality.score >= 75 ? "bg-green" : quality.score >= 50 ? "bg-amber" : "bg-red"}`}
          style={{ width: `${quality.score}%` }}
        />
      </div>
    </div>
  );
}

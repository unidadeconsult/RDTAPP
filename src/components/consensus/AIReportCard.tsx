import { Pencil, Trash2 } from "lucide-react";
import type { AIReport } from "@/types";
import { computeReportQuality } from "@/lib/consensus/reportQuality";
import { ReportQualityScore } from "./ReportQualityScore";

export function AIReportCard({
  report,
  onEdit,
  onRemove,
}: {
  report: AIReport;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const quality = computeReportQuality(report);

  return (
    <div className="rounded-xl border border-border bg-bg-card p-4 shadow-card dark:border-white/10 dark:bg-white/5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-heading text-base font-semibold text-text-primary dark:text-white">
              {report.provider}
            </p>
            {report.isDemo && (
              <span className="rounded-full bg-purple/15 px-2 py-0.5 text-[10px] font-semibold text-purple">
                demonstração
              </span>
            )}
          </div>
          <p className="text-xs text-text-secondary dark:text-white/50">
            {new Date(report.createdAt).toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-full p-1.5 text-text-secondary hover:bg-bg-steel hover:text-blue dark:hover:bg-white/10"
            aria-label="Editar relatório"
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="rounded-full p-1.5 text-text-secondary hover:bg-red/10 hover:text-red dark:hover:bg-white/10"
            aria-label="Remover relatório"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-1 text-sm text-text-secondary dark:text-white/70">
        {report.favorite && <p>Favorito: <span className="font-medium text-text-primary dark:text-white">{report.favorite}</span></p>}
        {report.mainPick && (
          <p>
            Principal: <span className="font-medium text-text-primary dark:text-white">{report.mainPick.selection}</span>
          </p>
        )}
        {report.confidence !== undefined && <p>Confiança declarada: {report.confidence}/10</p>}
      </div>

      <div className="mt-3">
        <ReportQualityScore quality={quality} />
      </div>
    </div>
  );
}

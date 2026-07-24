"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";
import type { AIReport, Analysis } from "@/types";
import { AIReportForm } from "./AIReportForm";
import { AIReportCard } from "./AIReportCard";
import { ConsensusPanel } from "./ConsensusPanel";
import { ConsensusMatrix } from "./ConsensusMatrix";
import { SimilarityMap } from "./SimilarityMap";
import { OutlierAlert } from "./OutlierAlert";
import { computeSimilarityMap, detectOutliers } from "@/lib/consensus/consensus";
import { recomputeConsensus } from "@/lib/buildAnalysis";
import { saveAnalysis } from "@/lib/storage/analysisStorage";

export function ConsensusLabPanel({
  analysis,
  onChange,
}: {
  analysis: Analysis;
  onChange: (analysis: Analysis) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AIReport | undefined>();

  const persist = (reports: AIReport[]) => {
    const updated = recomputeConsensus(analysis, reports);
    saveAnalysis(updated);
    onChange(updated);
  };

  const handleSave = (report: AIReport) => {
    const exists = analysis.aiReports.some((r) => r.id === report.id);
    const next = exists
      ? analysis.aiReports.map((r) => (r.id === report.id ? report : r))
      : [...analysis.aiReports, report];
    persist(next);
    setShowForm(false);
    setEditing(undefined);
  };

  const handleRemove = (id: string) => {
    persist(analysis.aiReports.filter((r) => r.id !== id));
  };

  const similarity = computeSimilarityMap(analysis.aiReports);
  const outliers = detectOutliers(analysis.aiReports, analysis.marketConsensus);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-bg-blue/60 px-4 py-3 text-sm text-text-secondary dark:border-white/10 dark:bg-white/5 dark:text-white/70">
        O consenso entre modelos não representa independência estatística. Diferentes
        inteligências artificiais podem reproduzir raciocínios semelhantes a partir dos mesmos
        dados.
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-heading text-lg font-semibold text-text-primary dark:text-white">
            Relatórios de IA ({analysis.aiReports.length})
          </h3>
          {!showForm && (
            <button
              type="button"
              onClick={() => {
                setEditing(undefined);
                setShowForm(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-strong"
            >
              <PlusCircle size={16} />
              Adicionar relatório
            </button>
          )}
        </div>

        {showForm && (
          <div className="mb-4">
            <AIReportForm
              editingReport={editing}
              onSave={handleSave}
              onCancel={() => {
                setShowForm(false);
                setEditing(undefined);
              }}
            />
          </div>
        )}

        {analysis.aiReports.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {analysis.aiReports.map((report) => (
              <AIReportCard
                key={report.id}
                report={report}
                onEdit={() => {
                  setEditing(report);
                  setShowForm(true);
                }}
                onRemove={() => handleRemove(report.id)}
              />
            ))}
          </div>
        ) : (
          !showForm && (
            <p className="text-sm text-text-secondary dark:text-white/60">
              Nenhum relatório de IA adicionado ainda. Cole os relatórios de ChatGPT, Kimi,
              DeepSeek, Perplexity, Qwen ou outra IA para calcular o consenso.
            </p>
          )
        )}
      </div>

      <section>
        <h3 className="mb-3 font-heading text-lg font-semibold text-text-primary dark:text-white">
          Índice de consenso
        </h3>
        <ConsensusPanel marketConsensus={analysis.marketConsensus} />
      </section>

      <section>
        <h3 className="mb-3 font-heading text-lg font-semibold text-text-primary dark:text-white">
          Matriz comparativa das IAs
        </h3>
        <ConsensusMatrix reports={analysis.aiReports} />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section>
          <h3 className="mb-3 font-heading text-lg font-semibold text-text-primary dark:text-white">
            Mapa de similaridade
          </h3>
          <SimilarityMap pairs={similarity} />
        </section>
        <section>
          <h3 className="mb-3 font-heading text-lg font-semibold text-text-primary dark:text-white">
            Fora da curva
          </h3>
          <OutlierAlert alerts={outliers} />
        </section>
      </div>

      {analysis.synthesis && (
        <section className="rounded-xl border border-green/30 bg-green-soft p-5 dark:border-green/20 dark:bg-green/10">
          <h3 className="mb-2 font-heading text-lg font-semibold text-green-dark dark:text-green">
            Síntese final multi-IA
          </h3>
          <p className="text-sm text-text-primary dark:text-white/90">{analysis.synthesis.conclusion}</p>
          <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            {analysis.synthesis.mostCitedMarket && (
              <Item label="Mercado mais citado" value={analysis.synthesis.mostCitedMarket} />
            )}
            {analysis.synthesis.mostSupportedMarket && (
              <Item label="Mercado mais sustentado" value={analysis.synthesis.mostSupportedMarket} />
            )}
            {analysis.synthesis.bestBalance && (
              <Item label="Melhor equilíbrio" value={analysis.synthesis.bestBalance} />
            )}
            {analysis.synthesis.speculativeMarket && (
              <Item label="Mercado especulativo" value={analysis.synthesis.speculativeMarket} />
            )}
          </dl>
          {analysis.synthesis.cautions.length > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-text-secondary dark:text-white/60">
              {analysis.synthesis.cautions.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-text-secondary dark:text-white/50">{label}</dt>
      <dd className="font-medium text-text-primary dark:text-white">{value}</dd>
    </div>
  );
}

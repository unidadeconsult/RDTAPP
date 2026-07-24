"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Copy, ExternalLink, Trash2 } from "lucide-react";
import type { Analysis } from "@/types";
import { deleteAnalysis, duplicateAnalysis } from "@/lib/storage/analysisStorage";
import { consensusLevelLabels } from "@/lib/consensus/consensus";
import { formatOdd } from "@/lib/calculations/ev";

export function HistoryTable({
  analyses,
  onChange,
}: {
  analyses: Analysis[];
  onChange: (analyses: Analysis[]) => void;
}) {
  const [search, setSearch] = useState("");
  const [minConfidence, setMinConfidence] = useState(0);

  const filtered = useMemo(() => {
    return analyses.filter((a) => {
      const haystack = [
        a.futOdds.info.competition,
        a.futOdds.info.homeTeam,
        a.futOdds.info.awayTeam,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch = search.trim() === "" || haystack.includes(search.toLowerCase());
      const matchesConfidence = a.confidenceScore >= minConfidence;
      return matchesSearch && matchesConfidence;
    });
  }, [analyses, search, minConfidence]);

  const handleDuplicate = (id: string) => {
    duplicateAnalysis(id);
    onChange(analyses);
    window.location.reload();
  };

  const handleDelete = (id: string) => {
    deleteAnalysis(id);
    onChange(analyses.filter((a) => a.id !== id));
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por competição ou time..."
          className="flex-1 min-w-[220px] rounded-lg border border-border bg-bg-card px-3 py-2 text-sm outline-none focus:border-blue dark:border-white/10 dark:bg-white/5 dark:text-white"
        />
        <select
          value={minConfidence}
          onChange={(e) => setMinConfidence(Number(e.target.value))}
          className="rounded-lg border border-border bg-bg-card px-3 py-2 text-sm outline-none focus:border-blue dark:border-white/10 dark:bg-white/5 dark:text-white"
        >
          <option value={0}>Qualquer confiança</option>
          <option value={5}>Confiança ≥ 5</option>
          <option value={7}>Confiança ≥ 7</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-text-secondary dark:text-white/60">
          Nenhuma análise encontrada. Crie uma nova análise na tela inicial.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-secondary dark:border-white/10 dark:text-white/50">
                <th className="py-2 pr-3 font-medium">Data</th>
                <th className="py-2 pr-3 font-medium">Partida</th>
                <th className="py-2 pr-3 font-medium">Favorito</th>
                <th className="py-2 pr-3 font-medium">Palpite principal</th>
                <th className="py-2 pr-3 font-medium">Odd</th>
                <th className="py-2 pr-3 font-medium">Confiança</th>
                <th className="py-2 pr-3 font-medium">Consenso</th>
                <th className="py-2 pr-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0 dark:border-white/10">
                  <td className="py-2.5 pr-3 text-text-secondary dark:text-white/60">
                    {new Date(a.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="py-2.5 pr-3 font-medium text-text-primary dark:text-white">
                    {a.futOdds.info.homeTeam} x {a.futOdds.info.awayTeam}
                    {a.isDemo && (
                      <span className="ml-2 rounded-full bg-purple/15 px-2 py-0.5 text-[10px] font-semibold text-purple">
                        demo
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 pr-3">
                    {a.futOdds.probabilities.home !== undefined && a.futOdds.probabilities.away !== undefined
                      ? a.futOdds.probabilities.home >= a.futOdds.probabilities.away
                        ? a.futOdds.info.homeTeam
                        : a.futOdds.info.awayTeam
                      : "—"}
                  </td>
                  <td className="py-2.5 pr-3">
                    {a.mainPick ? `${a.mainPick.market} — ${a.mainPick.selection}` : "—"}
                  </td>
                  <td className="py-2.5 pr-3">{formatOdd(a.mainPick?.marketOdd)}</td>
                  <td className="py-2.5 pr-3">{a.confidenceScore.toFixed(1)}</td>
                  <td className="py-2.5 pr-3">
                    {a.synthesis ? consensusLevelLabels[a.synthesis.consensusLevel] : "—"}
                  </td>
                  <td className="py-2.5 pr-3">
                    <div className="flex gap-1">
                      <Link
                        href={`/analysis/${a.id}`}
                        className="rounded-full p-1.5 text-text-secondary hover:bg-bg-steel hover:text-blue dark:hover:bg-white/10"
                        aria-label="Abrir análise"
                      >
                        <ExternalLink size={14} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDuplicate(a.id)}
                        className="rounded-full p-1.5 text-text-secondary hover:bg-bg-steel hover:text-blue dark:hover:bg-white/10"
                        aria-label="Duplicar análise"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(a.id)}
                        className="rounded-full p-1.5 text-text-secondary hover:bg-red/10 hover:text-red dark:hover:bg-white/10"
                        aria-label="Excluir análise"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

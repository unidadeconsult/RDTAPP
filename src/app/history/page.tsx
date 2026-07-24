"use client";

import { useEffect, useState } from "react";
import type { Analysis } from "@/types";
import { listAnalyses } from "@/lib/storage/analysisStorage";
import { HistoryTable } from "@/components/common/HistoryTable";

export default function HistoryPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setAnalyses(listAnalyses());
    setLoaded(true);
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold text-text-primary dark:text-white">Histórico</h1>
        <p className="text-sm text-text-secondary dark:text-white/60">
          Análises salvas neste navegador. O armazenamento é local — em uma próxima etapa, o
          histórico poderá ser sincronizado com Supabase.
        </p>
      </div>

      {loaded && <HistoryTable analyses={analyses} onChange={setAnalyses} />}
    </div>
  );
}

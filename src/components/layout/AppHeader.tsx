"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { History, PlusCircle, Radar } from "lucide-react";
import { Logo } from "@/components/common/Logo";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { listAnalyses } from "@/lib/storage/analysisStorage";

export function AppHeader() {
  const [latestId, setLatestId] = useState<string | undefined>();

  useEffect(() => {
    const all = listAnalyses();
    setLatestId(all[0]?.id);
  }, []);

  return (
    <header className="no-print sticky top-0 z-20 border-b border-border bg-bg-ice/90 backdrop-blur dark:border-white/10 dark:bg-[#0F1D2B]/90">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="shrink-0">
          <Logo size="md" />
        </Link>

        <nav className="flex flex-wrap items-center gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full bg-blue px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-strong"
          >
            <PlusCircle size={16} />
            Nova análise
          </Link>

          <Link
            href="/history"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium text-text-primary transition hover:border-blue hover:text-blue dark:border-white/10 dark:text-white"
          >
            <History size={16} />
            Histórico
          </Link>

          {latestId ? (
            <Link
              href={`/analysis/${latestId}?tab=consensus`}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium text-text-primary transition hover:border-green hover:text-green dark:border-white/10 dark:text-white"
            >
              <Radar size={16} />
              Consensus Lab
            </Link>
          ) : (
            <span
              title="Abra ou crie uma análise para acessar o Consensus Lab"
              className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-4 py-2 text-sm font-medium text-text-secondary/60 dark:border-white/10"
            >
              <Radar size={16} />
              Consensus Lab
            </span>
          )}

          <span
            title="Painel de desempenho — recurso futuro"
            className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-4 py-2 text-sm font-medium text-text-secondary/60 dark:border-white/10"
          >
            Desempenho
            <span className="rounded-full bg-amber/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber">
              em breve
            </span>
          </span>

          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Analysis, TeamPairStat } from "@/types";
import { getAnalysis } from "@/lib/storage/analysisStorage";
import { buildConvergenceMatrix } from "@/lib/convergence";
import { buildPrudenceChecklist } from "@/lib/checklist";
import { MatchHeader } from "@/components/match/MatchHeader";
import { ProbabilityCard } from "@/components/match/ProbabilityCard";
import { TeamComparison } from "@/components/match/TeamComparison";
import { RadarComparison } from "@/components/charts/RadarComparison";
import { ComparativoBlocks } from "@/components/match/ComparativoBlocks";
import { MarketTable } from "@/components/markets/MarketTable";
import { PickDecisionBlock } from "@/components/markets/PickDecisionBlock";
import { ScenarioSelector } from "@/components/match/ScenarioSelector";
import { ConsensusLabPanel } from "@/components/consensus/ConsensusLabPanel";
import { ConvergenceMatrix } from "@/components/consensus/ConvergenceMatrix";
import { FinalChecklist } from "@/components/consensus/FinalChecklist";
import { ConfidenceGauge } from "@/components/consensus/ConfidenceGauge";
import { CollapsibleCard } from "@/components/common/CollapsibleCard";
import { PrintButton } from "@/components/common/PrintButton";
import { Disclaimer } from "@/components/common/Disclaimer";
import { formatOdd, formatPercent } from "@/lib/calculations/ev";

const TABS = [
  { id: "overview", label: "Visão Geral" },
  { id: "comparative", label: "Comparativo" },
  { id: "markets", label: "Mercados Premium" },
  { id: "scenarios", label: "Cenários" },
  { id: "consensus", label: "Consensus Lab" },
  { id: "convergence", label: "Matriz de Convergência" },
  { id: "checklist", label: "Checklist Final" },
  { id: "risks", label: "Riscos e Conclusão" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AnalysisPage({ params }: { params: { id: string } }) {
  const [analysis, setAnalysis] = useState<Analysis | undefined | null>(undefined);
  const [tab, setTab] = useState<TabId>("overview");

  useEffect(() => {
    setAnalysis(getAnalysis(params.id) ?? null);
    const query = new URLSearchParams(window.location.search);
    const initialTab = query.get("tab");
    if (initialTab && TABS.some((t) => t.id === initialTab)) {
      setTab(initialTab as TabId);
    }
  }, [params.id]);

  if (analysis === undefined) {
    return <p className="text-sm text-text-secondary">Carregando análise...</p>;
  }

  if (analysis === null) {
    return (
      <div className="rounded-2xl border border-border bg-bg-card p-8 text-center dark:border-white/10 dark:bg-white/5">
        <p className="text-text-primary dark:text-white">Análise não encontrada neste navegador.</p>
        <Link href="/" className="mt-3 inline-block text-sm font-medium text-blue">
          Voltar para a tela inicial
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 print-area">
      <MatchHeader analysis={analysis} />

      <div className="no-print flex flex-wrap gap-1 overflow-x-auto rounded-full border border-border bg-bg-card p-1 dark:border-white/10 dark:bg-white/5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
              tab === t.id
                ? "bg-blue text-white"
                : "text-text-secondary hover:text-blue dark:text-white/60"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab analysis={analysis} />}
      {tab === "comparative" && <ComparativeTab analysis={analysis} />}
      {tab === "markets" && <MarketsTab analysis={analysis} />}
      {tab === "scenarios" && (
        <CollapsibleCard id="tab-scenarios" title="Cenários">
          <ScenarioSelector analysis={analysis} />
        </CollapsibleCard>
      )}
      {tab === "consensus" && (
        <ConsensusLabPanel analysis={analysis} onChange={setAnalysis} />
      )}
      {tab === "convergence" && (
        <CollapsibleCard id="tab-convergence" title="Matriz de Convergência">
          <ConvergenceMatrix rows={buildConvergenceMatrix(analysis)} />
        </CollapsibleCard>
      )}
      {tab === "checklist" && (
        <CollapsibleCard id="tab-checklist" title="Checklist Final">
          <FinalChecklist items={buildPrudenceChecklist(analysis)} markets={analysis.markets} />
        </CollapsibleCard>
      )}
      {tab === "risks" && <RisksTab analysis={analysis} />}

      <div className="no-print flex justify-end">
        <PrintButton />
      </div>
    </div>
  );
}

function OverviewTab({ analysis }: { analysis: Analysis }) {
  const { probabilities, odds, home, away, info } = analysis.futOdds;
  const implied = (odd?: number) => (odd ? 1 / odd : undefined);

  const strengthRows: TeamPairStat[] = (
    [
      { label: "PPG", home: home.lastTwenty?.ppg, away: away.lastTwenty?.ppg, unit: "decimal" },
      { label: "Vitórias", home: home.lastTwenty?.wins, away: away.lastTwenty?.wins, unit: "count" },
      { label: "Gols marcados", home: home.lastTwenty?.goalsFor, away: away.lastTwenty?.goalsFor, unit: "count" },
      { label: "Gols sofridos", home: home.lastTwenty?.goalsAgainst, away: away.lastTwenty?.goalsAgainst, unit: "count" },
      { label: "Clean sheet", home: home.lastTwenty?.cleanSheet, away: away.lastTwenty?.cleanSheet, unit: "percent" },
      { label: "Falhou em marcar", home: home.lastTwenty?.failedToScore, away: away.lastTwenty?.failedToScore, unit: "percent" },
      { label: "Chutes", home: home.lastTwenty?.shots, away: away.lastTwenty?.shots, unit: "decimal" },
      { label: "Conversão", home: home.lastTwenty?.conversion, away: away.lastTwenty?.conversion, unit: "percent" },
      { label: "xG", home: home.lastTwenty?.xg, away: away.lastTwenty?.xg, unit: "decimal" },
    ] as TeamPairStat[]
  ).filter((r) => r.home !== undefined || r.away !== undefined);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <ProbabilityCard label="Casa" value={probabilities.home} implied={implied(odds.home)} />
        <ProbabilityCard label="Empate" value={probabilities.draw} implied={implied(odds.draw)} />
        <ProbabilityCard label="Fora" value={probabilities.away} implied={implied(odds.away)} />
        <ProbabilityCard label="Over 2.5" value={probabilities.over25} implied={implied(odds.over25)} />
        <ProbabilityCard label="BTTS Sim" value={probabilities.bttsYes} implied={implied(odds.bttsYes)} />
        <ProbabilityCard label="Over 0.5 HT" value={probabilities.over05HT} implied={implied(odds.over05HT)} />
      </div>

      <CollapsibleCard id="overview-strength" title="Resumo da força" subtitle="Últimos 20 jogos">
        <TeamComparison
          homeTeam={info.homeTeam}
          awayTeam={info.awayTeam}
          rows={strengthRows}
        />
      </CollapsibleCard>

      <CollapsibleCard id="overview-radar" title="Radar visual">
        <RadarComparison
          homeTeam={info.homeTeam}
          awayTeam={info.awayTeam}
          home={home.lastTwenty}
          away={away.lastTwenty}
        />
      </CollapsibleCard>

      <CollapsibleCard id="overview-summary" title="Resumo executivo">
        <p className="text-sm leading-relaxed text-text-primary dark:text-white/80">
          {buildExecutiveSummary(analysis)}
        </p>
      </CollapsibleCard>
    </div>
  );
}

function buildExecutiveSummary(analysis: Analysis): string {
  const { info, probabilities } = analysis.futOdds;
  const parts: string[] = [];
  if (probabilities.home !== undefined && probabilities.away !== undefined) {
    const favorite = probabilities.home >= probabilities.away ? info.homeTeam : info.awayTeam;
    parts.push(`Os dados projetam ${favorite || "nenhum time"} como favorito para esta partida.`);
  }
  if (probabilities.expectedGoalRange) {
    parts.push(`A faixa de gols mais provável, segundo os dados informados, é de ${probabilities.expectedGoalRange}.`);
  }
  if (analysis.mainPick) {
    parts.push(
      `O mercado com melhor equilíbrio entre probabilidade e preço é ${analysis.mainPick.market} — ${analysis.mainPick.selection}.`
    );
  }
  if (parts.length === 0) {
    return "Não há dados suficientes para compor um resumo executivo desta partida.";
  }
  return parts.join(" ");
}

function ComparativeTab({ analysis }: { analysis: Analysis }) {
  const { info, home, away } = analysis.futOdds;

  const timeSplitRows: TeamPairStat[] = (
    [
      { label: "Over 0.5 HT (últimos 5)", home: home.lastFive?.over05HT, away: away.lastFive?.over05HT, unit: "percent" },
      { label: "Over 2.5 (últimos 5)", home: home.lastFive?.over25, away: away.lastFive?.over25, unit: "percent" },
      { label: "BTTS (últimos 5)", home: home.lastFive?.bttsYes, away: away.lastFive?.bttsYes, unit: "percent" },
      { label: "Gols 1º tempo (últimos 20)", home: home.lastTwenty?.firstHalfGoalsFor, away: away.lastTwenty?.firstHalfGoalsFor, unit: "count" },
      { label: "Gols 2º tempo (últimos 20)", home: home.lastTwenty?.secondHalfGoalsFor, away: away.lastTwenty?.secondHalfGoalsFor, unit: "count" },
      { label: "Marcou após os 70min", home: home.lastTwenty?.scoredAfter70, away: away.lastTwenty?.scoredAfter70, unit: "percent" },
    ] as TeamPairStat[]
  ).filter((r) => r.home !== undefined || r.away !== undefined);

  return (
    <div className="space-y-5">
      <CollapsibleCard id="comparative-blocks" title="Comparativo por área">
        <ComparativoBlocks
          homeTeam={info.homeTeam}
          awayTeam={info.awayTeam}
          home={home.lastTwenty}
          away={away.lastTwenty}
        />
      </CollapsibleCard>

      <CollapsibleCard id="comparative-time" title="Desempenho por tempo">
        <TeamComparison homeTeam={info.homeTeam} awayTeam={info.awayTeam} rows={timeSplitRows} />
      </CollapsibleCard>
    </div>
  );
}

function MarketsTab({ analysis }: { analysis: Analysis }) {
  return (
    <div className="space-y-5">
      <CollapsibleCard id="markets-decision" title="Bloco de decisão">
        <PickDecisionBlock
          mainPick={analysis.mainPick}
          alternativePick={analysis.alternativePick}
          avoidPicks={analysis.avoidPicks}
        />
      </CollapsibleCard>
      <CollapsibleCard id="markets-table" title="Mercados Premium">
        <MarketTable markets={analysis.markets} />
      </CollapsibleCard>
    </div>
  );
}

function RisksTab({ analysis }: { analysis: Analysis }) {
  return (
    <div className="space-y-5">
      <CollapsibleCard id="risks-confidence" title="Grau de confiança">
        <ConfidenceGauge score={analysis.confidenceScore} />
      </CollapsibleCard>

      <CollapsibleCard id="risks-issues" title="Riscos e limitações identificadas">
        {analysis.validationIssues.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {analysis.validationIssues.map((issue) => (
              <li key={issue.id} className="flex items-start gap-2">
                <span
                  className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                    issue.severity === "error"
                      ? "bg-red"
                      : issue.severity === "warning"
                        ? "bg-amber"
                        : "bg-blue"
                  }`}
                />
                <span className="text-text-primary dark:text-white/80">{issue.message}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-text-secondary dark:text-white/60">
            Nenhum risco de dados identificado nesta análise.
          </p>
        )}
      </CollapsibleCard>

      <CollapsibleCard id="risks-conclusion" title="Conclusão">
        <p className="text-sm leading-relaxed text-text-primary dark:text-white/80">
          {analysis.synthesis?.conclusion ?? buildExecutiveSummary(analysis)}
        </p>
        {analysis.mainPick && (
          <p className="mt-2 text-sm text-text-secondary dark:text-white/60">
            Mercado sugerido: {analysis.mainPick.market} — {analysis.mainPick.selection} (odd{" "}
            {formatOdd(analysis.mainPick.marketOdd)}, probabilidade{" "}
            {formatPercent(analysis.mainPick.projectedProbability)}).
          </p>
        )}
      </CollapsibleCard>

      <Disclaimer />
    </div>
  );
}

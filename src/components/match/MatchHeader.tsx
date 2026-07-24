import type { Analysis } from "@/types";
import { OddsCard } from "./OddsCard";
import { formatOdd } from "@/lib/calculations/ev";
import { consensusLevelLabels } from "@/lib/consensus/consensus";

export function MatchHeader({ analysis }: { analysis: Analysis }) {
  const { info, odds } = analysis.futOdds;

  return (
    <div className="rounded-2xl border border-border bg-bg-card p-6 shadow-card dark:border-white/10 dark:bg-white/5 print-area">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-text-secondary dark:text-white/60">
        <span>
          {[info.competition, info.season].filter(Boolean).join(" · ") || "Competição não informada"}
        </span>
        <span>
          {[info.matchDate, info.matchTime].filter(Boolean).join(" · ")}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-blue-dark dark:text-white sm:text-3xl">
            {info.homeTeam || "Time da casa"}
            {info.homePosition !== undefined && (
              <span className="ml-2 align-middle text-sm font-normal text-text-secondary">
                #{info.homePosition}
              </span>
            )}
            <span className="mx-3 text-text-secondary">x</span>
            {info.awayTeam || "Time visitante"}
            {info.awayPosition !== undefined && (
              <span className="ml-2 align-middle text-sm font-normal text-text-secondary">
                #{info.awayPosition}
              </span>
            )}
          </h1>
          {info.venue && (
            <p className="mt-1 text-sm text-text-secondary dark:text-white/60">
              {[info.venue, info.city, info.country].filter(Boolean).join(", ")}
            </p>
          )}
        </div>

        {analysis.synthesis && (
          <span className="rounded-full bg-green-soft px-3 py-1 text-xs font-semibold text-green-dark dark:bg-green/20 dark:text-green">
            {consensusLevelLabels[analysis.synthesis.consensusLevel]}
          </span>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <OddsCard label="Casa" odd={odds.home} />
        <OddsCard label="Empate" odd={odds.draw} />
        <OddsCard label="Fora" odd={odds.away} />
        <OddsCard label="Over 2.5" odd={odds.over25} accent="green" />
        <OddsCard label="BTTS Sim" odd={odds.bttsYes} accent="green" />
      </div>

      <SummaryStrip analysis={analysis} />
    </div>
  );
}

function SummaryStrip({ analysis }: { analysis: Analysis }) {
  const { probabilities } = analysis.futOdds;
  const items: { label: string; value: string }[] = [
    {
      label: "Favorito projetado",
      value:
        probabilities.home !== undefined && probabilities.away !== undefined
          ? probabilities.home >= probabilities.away
            ? analysis.futOdds.info.homeTeam || "Casa"
            : analysis.futOdds.info.awayTeam || "Fora"
          : "—",
    },
    { label: "Placar-base", value: probabilities.expectedScore || "—" },
    { label: "Faixa de gols", value: probabilities.expectedGoalRange || "—" },
    {
      label: "Mercado principal",
      value: analysis.mainPick ? `${analysis.mainPick.market} — ${analysis.mainPick.selection}` : "—",
    },
    {
      label: "Palpite alternativo",
      value: analysis.alternativePick
        ? `${analysis.alternativePick.market} — ${analysis.alternativePick.selection}`
        : "—",
    },
    {
      label: "Mercado a evitar",
      value: analysis.avoidPicks[0]
        ? `${analysis.avoidPicks[0].market} — ${analysis.avoidPicks[0].selection} (${formatOdd(analysis.avoidPicks[0].marketOdd)})`
        : "—",
    },
    { label: "Confiança geral", value: `${analysis.confidenceScore.toFixed(1)} / 10` },
    {
      label: "Consenso multi-IA",
      value: analysis.synthesis
        ? consensusLevelLabels[analysis.synthesis.consensusLevel]
        : "Sem relatórios de IA",
    },
  ];

  return (
    <div className="mt-5 grid grid-cols-1 gap-3 border-t border-border pt-4 text-sm sm:grid-cols-2 lg:grid-cols-4 dark:border-white/10">
      {items.map((item) => (
        <div key={item.label}>
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary dark:text-white/50">
            {item.label}
          </p>
          <p className="font-medium text-text-primary dark:text-white">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

import type { LastTwentyStats, TeamPairStat } from "@/types";
import { TeamComparison } from "./TeamComparison";

function rows(
  home: LastTwentyStats | undefined,
  away: LastTwentyStats | undefined,
  defs: { label: string; key: keyof LastTwentyStats; unit: TeamPairStat["unit"] }[]
): TeamPairStat[] {
  return defs
    .map((d) => ({ label: d.label, home: home?.[d.key], away: away?.[d.key], unit: d.unit }))
    .filter((r) => r.home !== undefined || r.away !== undefined);
}

export function ComparativoBlocks({
  homeTeam,
  awayTeam,
  home,
  away,
}: {
  homeTeam: string;
  awayTeam: string;
  home?: LastTwentyStats;
  away?: LastTwentyStats;
}) {
  const blocks: { title: string; rows: TeamPairStat[] }[] = [
    {
      title: "Ataque e defesa",
      rows: rows(home, away, [
        { label: "Gols marcados", key: "goalsFor", unit: "count" },
        { label: "Gols sofridos", key: "goalsAgainst", unit: "count" },
        { label: "Clean sheet", key: "cleanSheet", unit: "percent" },
        { label: "Falhou em marcar", key: "failedToScore", unit: "percent" },
      ]),
    },
    {
      title: "xG",
      rows: rows(home, away, [
        { label: "xG a favor", key: "xg", unit: "decimal" },
        { label: "xG contra", key: "xgAgainst", unit: "decimal" },
      ]),
    },
    {
      title: "Chutes",
      rows: rows(home, away, [
        { label: "Chutes", key: "shots", unit: "decimal" },
        { label: "Chutes no alvo", key: "shotsOnTarget", unit: "decimal" },
        { label: "Conversão", key: "conversion", unit: "percent" },
      ]),
    },
    {
      title: "Escanteios",
      rows: rows(home, away, [{ label: "Escanteios", key: "corners", unit: "decimal" }]),
    },
    {
      title: "Cartões e faltas",
      rows: rows(home, away, [
        { label: "Cartões", key: "cards", unit: "decimal" },
        { label: "Faltas", key: "fouls", unit: "decimal" },
        { label: "Impedimentos", key: "offsides", unit: "decimal" },
      ]),
    },
    {
      title: "Posse e território",
      rows: rows(home, away, [
        { label: "Posse", key: "possession", unit: "percent" },
        { label: "Ataques", key: "attacks", unit: "decimal" },
        { label: "Ataques perigosos", key: "dangerousAttacks", unit: "decimal" },
      ]),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {blocks.map((block) => (
        <div key={block.title} className="rounded-xl border border-border bg-bg-card p-4 dark:border-white/10 dark:bg-white/5">
          <h4 className="mb-3 font-heading text-sm font-semibold text-text-primary dark:text-white">
            {block.title}
          </h4>
          <TeamComparison homeTeam={homeTeam} awayTeam={awayTeam} rows={block.rows} />
        </div>
      ))}
    </div>
  );
}

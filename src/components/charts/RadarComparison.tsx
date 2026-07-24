"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { LastTwentyStats } from "@/types";

type Metric = {
  key: keyof LastTwentyStats;
  label: string;
  lowerIsBetter?: boolean;
};

const METRICS: Metric[] = [
  { key: "goalsFor", label: "Ataque" },
  { key: "goalsAgainst", label: "Defesa", lowerIsBetter: true },
  { key: "conversion", label: "Eficiência" },
  { key: "shots", label: "Volume" },
  { key: "firstHalfGoalsFor", label: "1º tempo" },
  { key: "secondHalfGoalsFor", label: "2º tempo" },
  { key: "possession", label: "Posse" },
  { key: "cards", label: "Disciplina", lowerIsBetter: true },
];

export function RadarComparison({
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
  const data = METRICS.map((metric) => {
    const homeVal = home?.[metric.key];
    const awayVal = away?.[metric.key];
    if (homeVal === undefined && awayVal === undefined) return undefined;

    const max = Math.max(homeVal ?? 0, awayVal ?? 0) || 1;
    const score = (value: number | undefined) => {
      if (value === undefined) return 0;
      return metric.lowerIsBetter ? 100 - (value / max) * 100 : (value / max) * 100;
    };

    return {
      metric: metric.label,
      [homeTeam]: Math.round(score(homeVal)),
      [awayTeam]: Math.round(score(awayVal)),
      homeRaw: homeVal,
      awayRaw: awayVal,
    };
  }).filter((d): d is NonNullable<typeof d> => d !== undefined);

  if (data.length === 0) {
    return (
      <p className="text-sm text-text-secondary dark:text-white/60">
        Dados insuficientes para montar o radar comparativo.
      </p>
    );
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="70%">
          <PolarGrid stroke="#DDE8F1" />
          <PolarAngleAxis dataKey="metric" tick={{ fill: "#64788A", fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name={homeTeam}
            dataKey={homeTeam}
            stroke="#1479D1"
            fill="#1479D1"
            fillOpacity={0.35}
          />
          <Radar
            name={awayTeam}
            dataKey={awayTeam}
            stroke="#21B66F"
            fill="#21B66F"
            fillOpacity={0.3}
          />
          <Tooltip
            formatter={(value: number, name: string, entry) => {
              const raw =
                name === homeTeam ? entry.payload.homeRaw : entry.payload.awayRaw;
              return [`${raw ?? "—"} (índice ${value})`, name];
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
      <p className="mt-2 text-xs text-text-secondary dark:text-white/50">
        Escala relativa entre as duas equipes nesta partida — não representa percentil da liga.
      </p>
    </div>
  );
}

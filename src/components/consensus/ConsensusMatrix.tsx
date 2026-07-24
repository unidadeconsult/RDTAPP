import type { AIReport } from "@/types";

type Row = {
  label: string;
  values: (report: AIReport) => string | undefined;
};

const ROWS: Row[] = [
  { label: "Favorito", values: (r) => r.favorite },
  { label: "Placar esperado", values: (r) => r.expectedScore },
  { label: "Faixa de gols", values: (r) => r.expectedGoalRange },
  { label: "Mercado principal", values: (r) => r.mainPick?.selection },
  { label: "Alternativa", values: (r) => r.alternativePicks[0]?.selection },
  { label: "Evitar", values: (r) => r.avoidPicks[0]?.selection },
  { label: "Confiança", values: (r) => (r.confidence !== undefined ? String(r.confidence) : undefined) },
  { label: "Maior risco", values: (r) => r.risks[0] },
];

function cellClass(value: string | undefined, mode: string | undefined) {
  if (!value) return "bg-bg-steel text-text-secondary dark:bg-white/5 dark:text-white/40";
  if (!mode) return "bg-bg-card text-text-primary dark:bg-white/5 dark:text-white";
  if (value === mode) return "bg-green-soft text-green-dark dark:bg-green/15 dark:text-green";
  if (mode.toLowerCase().includes(value.toLowerCase()) || value.toLowerCase().includes(mode.toLowerCase())) {
    return "bg-amber/15 text-amber";
  }
  return "bg-red/10 text-red";
}

function computeMode(values: (string | undefined)[]): string | undefined {
  const counts = new Map<string, number>();
  for (const v of values) {
    if (!v) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  let best: string | undefined;
  let bestCount = 0;
  for (const [value, count] of counts.entries()) {
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  }
  return best;
}

export function ConsensusMatrix({ reports }: { reports: AIReport[] }) {
  if (reports.length === 0) {
    return (
      <p className="text-sm text-text-secondary dark:text-white/60">
        Adicione relatórios de IA para visualizar a matriz comparativa.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-secondary dark:border-white/10 dark:text-white/50">
            <th className="py-2 pr-3 font-medium">Critério</th>
            {reports.map((r) => (
              <th key={r.id} className="py-2 pr-3 font-medium">
                {r.provider}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => {
            const values = reports.map((r) => row.values(r));
            const mode = computeMode(values);
            return (
              <tr key={row.label} className="border-b border-border last:border-0 dark:border-white/10">
                <td className="py-2 pr-3 font-medium text-text-primary dark:text-white">{row.label}</td>
                {reports.map((r, i) => (
                  <td key={r.id} className="py-2 pr-3">
                    <span className={`inline-block max-w-[160px] truncate rounded-md px-2 py-1 text-xs ${cellClass(values[i], mode)}`} title={values[i]}>
                      {values[i] ?? "—"}
                    </span>
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-text-secondary dark:text-white/50">
        Verde: concordância com a maioria · Amarelo: proximidade textual · Vermelho: divergência · Cinza: ausente.
      </p>
    </div>
  );
}

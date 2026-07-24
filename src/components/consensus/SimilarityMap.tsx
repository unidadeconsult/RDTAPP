import type { SimilarityPair } from "@/types";

export function SimilarityMap({ pairs }: { pairs: SimilarityPair[] }) {
  if (pairs.length === 0) {
    return (
      <p className="text-sm text-text-secondary dark:text-white/60">
        São necessários pelo menos dois relatórios para calcular similaridade.
      </p>
    );
  }

  return (
    <div>
      <ul className="space-y-2">
        {pairs.map((pair) => (
          <li
            key={`${pair.providerA}-${pair.providerB}`}
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-bg-card px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
          >
            <span className="text-text-primary dark:text-white">
              {pair.providerA} × {pair.providerB}
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-24 overflow-hidden rounded-full bg-bg-steel dark:bg-white/10">
                <span
                  className="block h-full bg-purple"
                  style={{ width: `${pair.score}%` }}
                />
              </span>
              <span className="w-10 text-right font-medium text-text-secondary dark:text-white/70">
                {pair.score}%
              </span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-text-secondary dark:text-white/50">
        Similaridade não representa qualidade — apenas o quanto dois relatórios chegaram a
        conclusões parecidas.
      </p>
    </div>
  );
}

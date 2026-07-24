"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Analysis } from "@/types";
import { buildScenarios } from "@/lib/scenarios";
import { formatOdd, formatPercent } from "@/lib/calculations/ev";

export function ScenarioSelector({ analysis }: { analysis: Analysis }) {
  const scenarios = buildScenarios(analysis);
  const [active, setActive] = useState(scenarios[1]?.key ?? scenarios[0].key);
  const current = scenarios.find((s) => s.key === active) ?? scenarios[0];

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {scenarios.map((scenario) => (
          <button
            key={scenario.key}
            type="button"
            onClick={() => setActive(scenario.key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              active === scenario.key
                ? "bg-blue text-white"
                : "border border-border text-text-secondary hover:border-blue hover:text-blue dark:border-white/10 dark:text-white/70"
            }`}
          >
            {scenario.title}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.key}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="mt-4 rounded-xl border border-border bg-bg-blue/60 p-5 dark:border-white/10 dark:bg-white/5"
        >
          <p className="text-sm leading-relaxed text-text-primary dark:text-white/80">
            {current.description}
          </p>
          {current.score && (
            <p className="mt-2 text-xs text-text-secondary dark:text-white/50">
              Placar de referência: {current.score}
            </p>
          )}
          {current.markets.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {current.markets.map((m) => (
                <span
                  key={`${m.market}-${m.selection}`}
                  className="rounded-full bg-bg-card px-3 py-1 text-xs font-medium text-text-primary shadow-sm dark:bg-white/10 dark:text-white"
                >
                  {m.market} — {m.selection} · {formatOdd(m.marketOdd)} ·{" "}
                  {formatPercent(m.projectedProbability)}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

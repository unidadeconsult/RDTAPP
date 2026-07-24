import type { ConsistencyLevel } from "@/types";
import { consistencyLabels } from "@/lib/calculations/ev";

const colorByLevel: Record<ConsistencyLevel, string> = {
  stable: "bg-green-soft text-green-dark dark:bg-green/20 dark:text-green",
  moderate: "bg-blue-soft text-blue-strong dark:bg-blue/20 dark:text-blue",
  volatile: "bg-amber/20 text-amber",
  very_volatile: "bg-red/15 text-red",
};

export function ConsistencyBadge({ level }: { level: ConsistencyLevel }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${colorByLevel[level]}`}>
      {consistencyLabels[level]}
    </span>
  );
}

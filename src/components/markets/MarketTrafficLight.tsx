import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import type { MarketAnalysis } from "@/types";
import { riskLabels } from "@/lib/calculations/ev";

export function MarketTrafficLight({ market }: { market: MarketAnalysis }) {
  const config = {
    low: { Icon: CheckCircle2, color: "text-green", bg: "bg-green-soft dark:bg-green/15" },
    medium: { Icon: AlertTriangle, color: "text-amber", bg: "bg-amber/15" },
    high: { Icon: XCircle, color: "text-red", bg: "bg-red/10" },
  }[market.risk];

  const explanation = explain(market);

  return (
    <span
      title={explanation}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.bg} ${config.color}`}
    >
      <config.Icon size={14} />
      {riskLabels[market.risk]}
    </span>
  );
}

function explain(market: MarketAnalysis): string {
  const parts: string[] = [];
  if (market.ev !== undefined) {
    parts.push(`EV ${(market.ev * 100).toFixed(1)}%`);
  } else {
    parts.push("EV não calculável (dados incompletos)");
  }
  parts.push(`sustentação ${market.support}/100`);
  return parts.join(" · ");
}

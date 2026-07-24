import { AlertOctagon } from "lucide-react";
import type { OutlierAlert as OutlierAlertType } from "@/types";

export function OutlierAlert({ alerts }: { alerts: OutlierAlertType[] }) {
  if (alerts.length === 0) {
    return (
      <p className="text-sm text-text-secondary dark:text-white/60">
        Nenhuma análise fora da curva foi identificada entre os relatórios atuais.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {alerts.map((alert, idx) => (
        <li
          key={`${alert.providerId}-${alert.market}-${idx}`}
          className="flex gap-2 rounded-lg border border-amber/30 bg-amber/10 px-3 py-2 text-sm text-text-primary dark:text-white"
        >
          <AlertOctagon size={16} className="mt-0.5 shrink-0 text-amber" />
          <span>{alert.message}</span>
        </li>
      ))}
    </ul>
  );
}

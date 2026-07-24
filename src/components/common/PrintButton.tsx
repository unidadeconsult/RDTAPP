"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print inline-flex items-center gap-2 rounded-full border border-border bg-bg-card px-4 py-2 text-sm font-medium text-text-primary transition hover:border-blue hover:text-blue dark:border-white/10 dark:bg-white/5 dark:text-white"
    >
      <Printer size={16} />
      Imprimir / PDF
    </button>
  );
}

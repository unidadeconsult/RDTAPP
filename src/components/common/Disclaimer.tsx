import { Info } from "lucide-react";

export function Disclaimer() {
  return (
    <div className="flex gap-3 rounded-2xl border border-border bg-bg-blue px-5 py-4 text-sm text-text-secondary dark:border-white/10 dark:bg-white/5 dark:text-white/70">
      <Info size={18} className="mt-0.5 shrink-0 text-blue" />
      <p>
        Esta ferramenta oferece análises estatísticas e comparações entre relatórios de
        inteligência artificial para fins informativos. Valor esperado positivo não representa
        garantia de lucro. Apostas envolvem risco financeiro. O consenso entre modelos não
        equivale a independência estatística. Utilize gestão responsável e nunca comprometa
        recursos essenciais.
      </p>
    </div>
  );
}

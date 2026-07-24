import { AnalysisForm } from "@/components/forms/AnalysisForm";
import { LoadDemoButton } from "@/components/forms/LoadDemoButton";
import { Disclaimer } from "@/components/common/Disclaimer";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-border bg-gradient-to-br from-bg-blue via-bg-card to-bg-ice px-6 py-10 shadow-card dark:border-white/10 dark:from-white/5 dark:via-transparent dark:to-transparent sm:px-10">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-green">
          Leitura do jogo
        </p>
        <h1 className="font-heading text-3xl font-bold text-blue-dark dark:text-white sm:text-4xl">
          Dados, odds e inteligências em busca do melhor consenso.
        </h1>
        <p className="mt-3 max-w-2xl text-text-secondary dark:text-white/70">
          O Kylian+Movic organiza os dados do FutOdds, calcula odds justas e valor esperado,
          compara relatórios de diferentes inteligências artificiais e produz uma síntese
          auditada — sem inventar dados e sem prometer certezas.
        </p>
        <div className="mt-5">
          <LoadDemoButton />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-bg-card p-6 shadow-card dark:border-white/10 dark:bg-white/5 sm:p-8">
        <h2 className="mb-1 font-heading text-xl font-semibold text-text-primary dark:text-white">
          Nova análise
        </h2>
        <p className="mb-6 text-sm text-text-secondary dark:text-white/60">
          Cole o texto exportado do FutOdds. O sistema tentará extrair automaticamente
          competição, times, odds, probabilidades e estatísticas de forma.
        </p>
        <AnalysisForm />
      </section>

      <Disclaimer />
    </div>
  );
}

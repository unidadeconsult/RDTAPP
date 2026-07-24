"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { forwardRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { ChevronDown, Sparkles } from "lucide-react";
import { analysisFormSchema, type AnalysisFormValues } from "@/lib/formSchema";
import { buildAnalysisFromText } from "@/lib/buildAnalysis";
import { saveAnalysis } from "@/lib/storage/analysisStorage";

export function AnalysisForm() {
  const router = useRouter();
  const [showOptional, setShowOptional] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AnalysisFormValues>({
    resolver: zodResolver(analysisFormSchema),
    defaultValues: { rawText: "" },
  });

  const onSubmit = handleSubmit((values) => {
    setFormError(undefined);
    try {
      const num = (v?: string) => (v && v.trim() !== "" ? Number(v.replace(",", ".")) : undefined);

      const analysis = buildAnalysisFromText(values.rawText, {
        info: {
          competition: values.competition || undefined,
          season: values.season || undefined,
          matchDate: values.matchDate || undefined,
          matchTime: values.matchTime || undefined,
          venue: values.venue || undefined,
          homeTeam: values.homeTeam || undefined,
          awayTeam: values.awayTeam || undefined,
          homePosition: num(values.homePosition),
          awayPosition: num(values.awayPosition),
        },
        odds: {
          home: num(values.oddHome),
          draw: num(values.oddDraw),
          away: num(values.oddAway),
          over25: num(values.oddOver25),
          bttsYes: num(values.oddBttsYes),
        },
      });

      if (!analysis.futOdds.info.homeTeam || !analysis.futOdds.info.awayTeam) {
        setFormError(
          "Não foi possível identificar os times automaticamente. Preencha os campos opcionais \"Time da casa\" e \"Time visitante\" e tente novamente."
        );
        return;
      }

      saveAnalysis(analysis);
      router.push(`/analysis/${analysis.id}`);
    } catch {
      setFormError("Não foi possível interpretar o texto informado. Revise o conteúdo colado.");
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label htmlFor="rawText" className="mb-2 block text-sm font-medium text-text-primary dark:text-white">
          Dados da partida (FutOdds)
        </label>
        <textarea
          id="rawText"
          rows={12}
          placeholder="Cole aqui todos os dados da partida extraídos do FutOdds."
          className="w-full rounded-xl border border-border bg-bg-card p-4 font-sans text-sm text-text-primary shadow-sm outline-none transition focus:border-blue focus:ring-2 focus:ring-blue-soft dark:border-white/10 dark:bg-white/5 dark:text-white"
          {...register("rawText")}
        />
        {errors.rawText && (
          <p className="mt-1 text-sm text-red">{errors.rawText.message}</p>
        )}
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowOptional((v) => !v)}
          className="flex items-center gap-1.5 text-sm font-medium text-blue"
        >
          <ChevronDown size={16} className={`transition-transform ${showOptional ? "rotate-180" : ""}`} />
          Campos opcionais (usados quando o texto não é reconhecido automaticamente)
        </button>

        {showOptional && (
          <div className="mt-3 grid grid-cols-1 gap-3 rounded-xl border border-border bg-bg-blue/60 p-4 sm:grid-cols-2 md:grid-cols-3 dark:border-white/10 dark:bg-white/5">
            <Field label="Competição" {...register("competition")} />
            <Field label="Temporada" {...register("season")} />
            <Field label="Data" placeholder="DD/MM/AAAA" {...register("matchDate")} />
            <Field label="Horário" placeholder="HH:MM" {...register("matchTime")} />
            <Field label="Local" {...register("venue")} />
            <Field label="Posição casa" {...register("homePosition")} />
            <Field label="Time da casa" {...register("homeTeam")} />
            <Field label="Time visitante" {...register("awayTeam")} />
            <Field label="Posição visitante" {...register("awayPosition")} />
            <Field label="Odd casa" {...register("oddHome")} />
            <Field label="Odd empate" {...register("oddDraw")} />
            <Field label="Odd visitante" {...register("oddAway")} />
            <Field label="Odd Over 2.5" {...register("oddOver25")} />
            <Field label="Odd BTTS Sim" {...register("oddBttsYes")} />
          </div>
        )}
      </div>

      {formError && (
        <p className="rounded-xl border border-red/30 bg-red/10 px-4 py-3 text-sm text-red">
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center gap-2 rounded-full bg-green px-6 py-3 font-heading text-sm font-semibold text-white shadow-card transition hover:bg-green-dark disabled:opacity-60"
      >
        <Sparkles size={18} />
        Analisar partida
      </button>
    </form>
  );
}

const Field = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label: string }
>(function Field({ label, ...props }, ref) {
  return (
    <label className="block text-xs font-medium text-text-secondary dark:text-white/60">
      {label}
      <input
        {...props}
        ref={ref}
        className="mt-1 w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-text-primary outline-none focus:border-blue dark:border-white/10 dark:bg-white/5 dark:text-white"
      />
    </label>
  );
});

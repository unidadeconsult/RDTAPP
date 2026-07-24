"use client";

import { useState } from "react";
import { Wand2 } from "lucide-react";
import type { AIReport, MarketOpinion } from "@/types";
import { extractAIReportFields } from "@/lib/consensus/normalizeReport";

const PROVIDER_OPTIONS = ["ChatGPT", "Kimi", "DeepSeek", "Perplexity", "Qwen"];

/** Converte fração (0-1) para string percentual sem artefatos de ponto flutuante (ex.: 55.00000000000001). */
function toPercentString(value: number): string {
  return String(Math.round(value * 1000) / 10);
}

type FormState = {
  provider: string;
  rawText: string;
  receivedSameBaseData: boolean;
  usedExternalResearch: boolean;
  favorite: string;
  expectedScore: string;
  expectedGoalRange: string;
  homeProbability: string;
  drawProbability: string;
  awayProbability: string;
  confidence: string;
  mainMarket: string;
  mainOdd: string;
  altMarket: string;
  altOdd: string;
  avoidMarket: string;
  avoidOdd: string;
  argumentsText: string;
  risksText: string;
};

const EMPTY_STATE: FormState = {
  provider: "",
  rawText: "",
  receivedSameBaseData: true,
  usedExternalResearch: false,
  favorite: "",
  expectedScore: "",
  expectedGoalRange: "",
  homeProbability: "",
  drawProbability: "",
  awayProbability: "",
  confidence: "",
  mainMarket: "",
  mainOdd: "",
  altMarket: "",
  altOdd: "",
  avoidMarket: "",
  avoidOdd: "",
  argumentsText: "",
  risksText: "",
};

function reportToState(report: AIReport): FormState {
  return {
    provider: report.provider,
    rawText: report.rawText,
    receivedSameBaseData: report.receivedSameBaseData,
    usedExternalResearch: report.usedExternalResearch,
    favorite: report.favorite ?? "",
    expectedScore: report.expectedScore ?? "",
    expectedGoalRange: report.expectedGoalRange ?? "",
    homeProbability: report.homeProbability !== undefined ? toPercentString(report.homeProbability) : "",
    drawProbability: report.drawProbability !== undefined ? toPercentString(report.drawProbability) : "",
    awayProbability: report.awayProbability !== undefined ? toPercentString(report.awayProbability) : "",
    confidence: report.confidence !== undefined ? String(report.confidence) : "",
    mainMarket: report.mainPick?.selection ?? "",
    mainOdd: report.mainPick?.odd !== undefined ? String(report.mainPick.odd) : "",
    altMarket: report.alternativePicks[0]?.selection ?? "",
    altOdd: report.alternativePicks[0]?.odd !== undefined ? String(report.alternativePicks[0].odd) : "",
    avoidMarket: report.avoidPicks[0]?.selection ?? "",
    avoidOdd: report.avoidPicks[0]?.odd !== undefined ? String(report.avoidPicks[0].odd) : "",
    argumentsText: report.arguments.join("\n"),
    risksText: report.risks.join("\n"),
  };
}

function toOpinion(
  market: string,
  odd: string,
  recommendation: MarketOpinion["recommendation"]
): MarketOpinion | undefined {
  if (!market.trim()) return undefined;
  return {
    market: market.trim(),
    selection: market.trim(),
    odd: odd ? Number(odd.replace(",", ".")) : undefined,
    recommendation,
  };
}

export function AIReportForm({
  editingReport,
  homeTeam,
  awayTeam,
  onSave,
  onCancel,
}: {
  editingReport?: AIReport;
  homeTeam?: string;
  awayTeam?: string;
  onSave: (report: AIReport) => void;
  onCancel?: () => void;
}) {
  const [state, setState] = useState<FormState>(
    editingReport ? reportToState(editingReport) : EMPTY_STATE
  );

  const update = (patch: Partial<FormState>) => setState((s) => ({ ...s, ...patch }));

  const autoExtract = () => {
    const extracted = extractAIReportFields(state.rawText, { homeTeam, awayTeam });
    update({
      favorite: extracted.favorite ?? state.favorite,
      expectedScore: extracted.expectedScore ?? state.expectedScore,
      expectedGoalRange: extracted.expectedGoalRange ?? state.expectedGoalRange,
      homeProbability:
        extracted.homeProbability !== undefined
          ? toPercentString(extracted.homeProbability)
          : state.homeProbability,
      drawProbability:
        extracted.drawProbability !== undefined
          ? toPercentString(extracted.drawProbability)
          : state.drawProbability,
      awayProbability:
        extracted.awayProbability !== undefined
          ? toPercentString(extracted.awayProbability)
          : state.awayProbability,
      confidence: extracted.confidence !== undefined ? String(extracted.confidence) : state.confidence,
      mainMarket: extracted.mainPick?.selection ?? state.mainMarket,
      mainOdd: extracted.mainPick?.odd !== undefined ? String(extracted.mainPick.odd) : state.mainOdd,
      altMarket: extracted.alternativePicks?.[0]?.selection ?? state.altMarket,
      altOdd:
        extracted.alternativePicks?.[0]?.odd !== undefined
          ? String(extracted.alternativePicks[0].odd)
          : state.altOdd,
      avoidMarket: extracted.avoidPicks?.[0]?.selection ?? state.avoidMarket,
      avoidOdd:
        extracted.avoidPicks?.[0]?.odd !== undefined ? String(extracted.avoidPicks[0].odd) : state.avoidOdd,
      argumentsText: extracted.arguments?.join("\n") ?? state.argumentsText,
      risksText: extracted.risks?.join("\n") ?? state.risksText,
      usedExternalResearch: extracted.usedExternalResearch ?? state.usedExternalResearch,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.provider.trim() || !state.rawText.trim()) return;

    const pct = (v: string) => (v.trim() ? Number(v.replace(",", ".")) / 100 : undefined);

    const report: AIReport = {
      id: editingReport?.id ?? crypto.randomUUID(),
      provider: state.provider.trim(),
      createdAt: editingReport?.createdAt ?? new Date().toISOString(),
      rawText: state.rawText,
      receivedSameBaseData: state.receivedSameBaseData,
      usedExternalResearch: state.usedExternalResearch,
      favorite: state.favorite || undefined,
      homeProbability: pct(state.homeProbability),
      drawProbability: pct(state.drawProbability),
      awayProbability: pct(state.awayProbability),
      expectedScore: state.expectedScore || undefined,
      expectedGoalRange: state.expectedGoalRange || undefined,
      mainPick: toOpinion(state.mainMarket, state.mainOdd, "main"),
      alternativePicks: [toOpinion(state.altMarket, state.altOdd, "alternative")].filter(
        (m): m is MarketOpinion => !!m
      ),
      avoidPicks: [toOpinion(state.avoidMarket, state.avoidOdd, "avoid")].filter(
        (m): m is MarketOpinion => !!m
      ),
      markets: [],
      confidence: state.confidence ? Number(state.confidence) : undefined,
      arguments: state.argumentsText.split("\n").map((s) => s.trim()).filter(Boolean),
      risks: state.risksText.split("\n").map((s) => s.trim()).filter(Boolean),
      inconsistencies: [],
    };

    onSave(report);
    if (!editingReport) setState(EMPTY_STATE);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-bg-blue/50 p-5 dark:border-white/10 dark:bg-white/5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="text-xs font-medium text-text-secondary dark:text-white/60">
          Provedor
          <input
            list="ai-providers"
            value={state.provider}
            onChange={(e) => update({ provider: e.target.value })}
            className="mt-1 w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-sm outline-none focus:border-blue dark:border-white/10 dark:bg-white/5 dark:text-white"
            placeholder="ChatGPT, Kimi, DeepSeek..."
          />
          <datalist id="ai-providers">
            {PROVIDER_OPTIONS.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </label>

        <div className="flex items-end gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={state.receivedSameBaseData}
              onChange={(e) => update({ receivedSameBaseData: e.target.checked })}
            />
            Recebeu os mesmos dados-base
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={state.usedExternalResearch}
              onChange={(e) => update({ usedExternalResearch: e.target.checked })}
            />
            Usou pesquisa externa
          </label>
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-xs font-medium text-text-secondary dark:text-white/60">
            Texto do relatório
          </label>
          <button
            type="button"
            onClick={autoExtract}
            className="inline-flex items-center gap-1 text-xs font-medium text-blue"
          >
            <Wand2 size={13} />
            Extrair automaticamente
          </button>
        </div>
        <textarea
          rows={6}
          value={state.rawText}
          onChange={(e) => update({ rawText: e.target.value })}
          placeholder={"Cole a resposta da IA — funciona tanto em texto livre (\"Acho o time X favorito, o mercado com mais valor é Under 3.5 a 1.62...\") quanto no formato \"rótulo: valor\" (Favorito: ...\\nMercado principal: Under 3.5 @1.62)."}
          className="w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-sm outline-none focus:border-blue dark:border-white/10 dark:bg-white/5 dark:text-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <TextField label="Favorito" value={state.favorite} onChange={(v) => update({ favorite: v })} />
        <TextField label="Placar esperado" value={state.expectedScore} onChange={(v) => update({ expectedScore: v })} />
        <TextField label="Faixa de gols" value={state.expectedGoalRange} onChange={(v) => update({ expectedGoalRange: v })} />
        <TextField label="Confiança (0-10)" value={state.confidence} onChange={(v) => update({ confidence: v })} />
        <TextField label="Prob. casa (%)" value={state.homeProbability} onChange={(v) => update({ homeProbability: v })} />
        <TextField label="Prob. empate (%)" value={state.drawProbability} onChange={(v) => update({ drawProbability: v })} />
        <TextField label="Prob. fora (%)" value={state.awayProbability} onChange={(v) => update({ awayProbability: v })} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex gap-2">
          <TextField label="Mercado principal" value={state.mainMarket} onChange={(v) => update({ mainMarket: v })} />
          <TextField label="Odd" value={state.mainOdd} onChange={(v) => update({ mainOdd: v })} />
        </div>
        <div className="flex gap-2">
          <TextField label="Alternativa" value={state.altMarket} onChange={(v) => update({ altMarket: v })} />
          <TextField label="Odd" value={state.altOdd} onChange={(v) => update({ altOdd: v })} />
        </div>
        <div className="flex gap-2">
          <TextField label="Evitar" value={state.avoidMarket} onChange={(v) => update({ avoidMarket: v })} />
          <TextField label="Odd" value={state.avoidOdd} onChange={(v) => update({ avoidOdd: v })} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="text-xs font-medium text-text-secondary dark:text-white/60">
          Argumentos (um por linha)
          <textarea
            rows={3}
            value={state.argumentsText}
            onChange={(e) => update({ argumentsText: e.target.value })}
            className="mt-1 w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-sm outline-none focus:border-blue dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
        </label>
        <label className="text-xs font-medium text-text-secondary dark:text-white/60">
          Riscos (um por linha)
          <textarea
            rows={3}
            value={state.risksText}
            onChange={(e) => update({ risksText: e.target.value })}
            className="mt-1 w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-sm outline-none focus:border-blue dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
        </label>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-full bg-blue px-5 py-2 text-sm font-semibold text-white hover:bg-blue-strong"
        >
          {editingReport ? "Salvar alterações" : "Adicionar relatório"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-border px-5 py-2 text-sm font-medium text-text-secondary dark:border-white/10"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex-1 text-xs font-medium text-text-secondary dark:text-white/60">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-sm outline-none focus:border-blue dark:border-white/10 dark:bg-white/5 dark:text-white"
      />
    </label>
  );
}

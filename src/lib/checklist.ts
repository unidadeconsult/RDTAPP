import type { Analysis } from "@/types";
import { computeSimilarityMap } from "@/lib/consensus/consensus";

export type ChecklistAnswer = "yes" | "no" | "partial";

export type ChecklistItem = {
  question: string;
  answer: ChecklistAnswer;
  detail: string;
};

export function buildPrudenceChecklist(analysis: Analysis): ChecklistItem[] {
  const { validationIssues, aiReports, mainPick, marketConsensus } = analysis;

  const hasErrors = validationIssues.some((i) => i.severity === "error");
  const hasWarnings = validationIssues.some((i) => i.severity === "warning");
  const xgIssue = validationIssues.find((i) => i.message.includes("xG"));

  const sameData = aiReports.length > 0 && aiReports.every((r) => r.receivedSameBaseData);
  const similarity = computeSimilarityMap(aiReports);
  const avgSimilarity = similarity.length
    ? similarity.reduce((a, b) => a + b.score, 0) / similarity.length
    : undefined;

  const topConsensus = marketConsensus[0];

  const items: ChecklistItem[] = [
    {
      question: "Os dados estão completos?",
      answer: hasErrors ? "no" : hasWarnings ? "partial" : "yes",
      detail: hasErrors
        ? "Foram identificados erros de extração dos dados."
        : hasWarnings
          ? "Há avisos sobre dados parcialmente ausentes."
          : "Nenhum erro ou aviso crítico identificado.",
    },
    {
      question: "Há inconsistências?",
      answer: hasErrors || hasWarnings ? "no" : "yes",
      detail: `${validationIssues.length} observação(ões) de validação registrada(s).`,
    },
    {
      question: "O xG confirma os gols?",
      answer: xgIssue ? "no" : "yes",
      detail: xgIssue ? xgIssue.message : "Gols reais e xG dentro da faixa esperada, quando informados.",
    },
    {
      question: "A odd oferece margem?",
      answer: mainPick && mainPick.ev !== undefined ? (mainPick.ev >= 0.02 ? "yes" : mainPick.ev >= 0 ? "partial" : "no") : "no",
      detail: mainPick?.ev !== undefined ? `EV do palpite principal: ${(mainPick.ev * 100).toFixed(1)}%.` : "Sem palpite principal com EV calculável.",
    },
    {
      question: "O consenso é real?",
      answer: topConsensus ? (topConsensus.level === "strong" ? "yes" : topConsensus.level === "near" ? "partial" : "no") : "no",
      detail: aiReports.length < 2 ? "São necessários ao menos 2 relatórios para avaliar consenso." : `Nível do mercado mais citado: ${topConsensus?.level ?? "indefinido"}.`,
    },
    {
      question: "As IAs receberam os mesmos dados?",
      answer: aiReports.length === 0 ? "no" : sameData ? "yes" : "partial",
      detail: sameData ? "Todos os relatórios confirmam o mesmo dado-base." : "Ao menos um relatório não confirma ter recebido os mesmos dados.",
    },
    {
      question: "Existe dependência entre os modelos?",
      answer: avgSimilarity === undefined ? "no" : avgSimilarity >= 70 ? "yes" : avgSimilarity >= 45 ? "partial" : "no",
      detail: avgSimilarity !== undefined ? `Similaridade média entre relatórios: ${avgSimilarity.toFixed(0)}%.` : "Sem pares suficientes para calcular similaridade.",
    },
    {
      question: "O mercado tem alta variância?",
      answer: mainPick ? (mainPick.consistency === "volatile" || mainPick.consistency === "very_volatile" ? "yes" : "no") : "partial",
      detail: mainPick ? `Consistência do palpite principal: ${mainPick.consistency}.` : "Sem palpite principal definido.",
    },
  ];

  return items;
}

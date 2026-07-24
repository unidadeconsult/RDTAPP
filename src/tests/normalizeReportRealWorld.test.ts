import { describe, expect, it } from "vitest";
import { extractAIReportFields } from "@/lib/consensus/normalizeReport";

// Trechos reais de relatórios (Santos x Chapecoense, Brasileirão 2026) usados para
// validar o extrator contra o formato real de cada IA — bem mais denso e variado
// que texto sintético: tabelas markdown, estatísticas soltas (aproveitamento,
// posse) e rótulos que não seguem exatamente o vocabulário assumido inicialmente.
const ctx = { homeTeam: "Santos", awayTeam: "Chapecoense" };

describe("extractAIReportFields — relatório real (Kimi)", () => {
  // Este texto tem uma tabela de "aproveitamento" com percentuais (36,8%, 15,8%)
  // que NÃO são probabilidade de resultado — é o principal risco de falso positivo.
  const text = `📊 Situação na Tabela
Posição	Clube	Pontos	Aproveitamento
15º	Santos	21 pts	36,8%
20º	Chapecoense	9 pts	15,8%
Na Vila Belmiro, os números são melhores: 5 vitórias em 10 jogos como mandante, com 15 gols marcados e 12 sofridos (aproveitamento de 56%).
🎯 Prognóstico
Tudo indica um jogo de domínio santista.
Palpite: Santos vence por 2 a 0 ou 2 a 1. A aposta mais segura é na vitória do Santos com mais de 1,5 gol na partida.`;

  const extracted = extractAIReportFields(text, ctx);

  it("identifica favorito e placar", () => {
    expect(extracted.favorite).toBe("Santos");
    expect(extracted.expectedScore).toBe("2-0");
  });

  it("NÃO confunde percentual de aproveitamento com probabilidade de resultado", () => {
    expect(extracted.homeProbability).toBeUndefined();
    expect(extracted.drawProbability).toBeUndefined();
    expect(extracted.awayProbability).toBeUndefined();
  });
});

describe("extractAIReportFields — relatório real (ChatGPT, com tabela de probabilidades)", () => {
  const text = `O mercado coloca o Santos como grande favorito.

3. Minha projeção de probabilidades
Resultado	Probabilidade RDT	Odd justa
Santos	64%	1.56
Empate	23%	4.35
Chapecoense	13%	7.69

Veredito RDT
Melhor mercado: Santos mais de 1.5 gols
Alternativa: Santos -0.75 acima de 1.70
Mercado sem valor: Santos ML a 1.42–1.45
Placar projetado: Santos 2 x 0 Chapecoense`;

  const extracted = extractAIReportFields(text, ctx);

  it("associa cada percentual da tabela ao resultado correto (não ao vizinho)", () => {
    expect(extracted.homeProbability).toBeCloseTo(0.64);
    expect(extracted.drawProbability).toBeCloseTo(0.23);
    expect(extracted.awayProbability).toBeCloseTo(0.13);
  });

  it("reconhece rótulos alternativos de mercado (Melhor mercado / Mercado sem valor)", () => {
    expect(extracted.mainPick?.market).toBe("Gols");
    expect(extracted.mainPick?.selection).toBe("Over 1.5");
    expect(extracted.avoidPicks?.[0]?.selection).toContain("Santos ML");
  });

  it("reconhece placar no formato 'N x N'", () => {
    expect(extracted.expectedScore).toBe("2-0");
  });
});

describe("extractAIReportFields — relatório real (DeepSeek, apenas prosa)", () => {
  const text = `O Santos é amplo favorito para esta partida. O fator casa, o momento positivo na Sul-Americana e, principalmente, o retorno de Neymar criam um cenário muito favorável ao Peixe.
Palpite: Vitória do Santos. Um triunfo por dois ou mais gols de diferença é um cenário bastante plausível.`;

  const extracted = extractAIReportFields(text, ctx);

  it("identifica o favorito mesmo sem tabela ou rótulos", () => {
    expect(extracted.favorite).toBe("Santos");
  });

  it("não inventa placar quando o texto só descreve a diferença de gols por extenso", () => {
    expect(extracted.expectedScore).toBeUndefined();
  });
});

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

describe("extractAIReportFields — mesmo mercado escrito de formas diferentes por IAs diferentes", () => {
  // Caso real: 4 IAs escreveram "o time da casa vence" com palavras próprias em vez de usar
  // o rótulo canônico "Casa" — sem o nome do time no contexto, cada frase virava um mercado
  // diferente no Índice de Consenso, mesmo todas dizendo exatamente a mesma coisa.
  const athleticoCtx = { homeTeam: "Athletico PR", awayTeam: "Internacional" };

  const phrasings = [
    "Alternativa: Athletico PR para vencer",
    "Alternativa: Athletico PR (Vitória Casa)",
    "Alternativa: Athletico PR vence",
    "Alternativa: Vitória do Athletico PR",
  ];

  it("canoniza todas as variações para o mesmo par mercado/seleção", () => {
    const results = phrasings.map(
      (text) => extractAIReportFields(text, athleticoCtx).alternativePicks?.[0]
    );

    for (const opinion of results) {
      expect(opinion?.market).toBe("Resultado final");
      expect(opinion?.selection).toBe("Casa");
    }
  });

  it("sem o nome do time no contexto, mantém o texto original (comportamento anterior)", () => {
    const opinion = extractAIReportFields("Alternativa: Athletico PR vence").alternativePicks?.[0];
    expect(opinion?.market).toBe("Athletico PR vence");
  });

  it("reconhece o time visitante da mesma forma", () => {
    const opinion = extractAIReportFields("Evitar: Vitória do Internacional", athleticoCtx)
      .avoidPicks?.[0];
    expect(opinion?.market).toBe("Resultado final");
    expect(opinion?.selection).toBe("Fora");
  });
});

describe("extractAIReportFields — formato de seções numeradas (Vasco x Mirassol)", () => {
  // Formato real usado por 3 de 4 IAs do usuário: rótulo numa linha ("1. Favorito
  // Apontado:"), conteúdo na(s) linha(s) seguinte(s) — bem diferente do "rótulo: valor".
  const vascoCtx = { homeTeam: "Vasco da Gama", awayTeam: "Mirassol" };

  const text = `1. Favorito Apontado:
Vasco — O fator casa pesa bastante. Odds em torno de 2.08 refletem esse favoritismo moderado.

2. Placar Provável Estimado:
2 x 1 para o Vasco
A tendência é de um jogo truncado.

3. Palpite Principal RDT (EV+):
Vitória do Vasco + Ambas as Equipes Marcam (BTTS Sim)
A vitória do Vasco isolada já tem valor.

4. Palpite Alternativo:
Mais de 4,5 escanteios para o Vasco
O Vasco tem média de 5,2 escanteios a favor por jogo.

5. Mercado a Evitar (Risco):
Placar Exato
Apostar em placar exato neste confronto é de alto risco.

6. Nota de Confiança (1 a 10):
6,5/10
O favoritismo do Vasco é justificado pelo fator casa.

7. Argumentos Principais:
- Fator casa decisivo: o Vasco tem 5 vitórias em 10 jogos em São Januário.
- Necessidade extrema de pontos: ambos estão na zona de rebaixamento.

8. Principais Riscos e Ameaças:
- Pesadelo do Vasco contra o Mirassol: perdeu os 3 confrontos diretos.
- Novo técnico do Vasco ainda sem vitória.`;

  const extracted = extractAIReportFields(text, vascoCtx);

  it("reconhece o time mesmo com o nome abreviado no texto ('Vasco' para 'Vasco da Gama')", () => {
    expect(extracted.favorite).toBe("Vasco da Gama");
  });

  it("extrai placar e confiança (aceitando '6,5/10')", () => {
    expect(extracted.expectedScore).toBe("2-1");
    expect(extracted.confidence).toBeCloseTo(6.5);
  });

  it("NÃO reduz uma aposta combinada a apenas um dos componentes", () => {
    // "Vitória do Vasco + BTTS Sim" não é só "BTTS Sim" — melhor manter o texto
    // original do que apresentar uma seleção mais estreita do que a real.
    expect(extracted.mainPick?.market).toContain("+");
  });

  it("mantém mercado sem correspondência no vocabulário como texto original", () => {
    expect(extracted.avoidPicks?.[0]?.market).toBe("Placar Exato");
  });

  it("não confunde a nota de confiança decimal (7.5) com um novo cabeçalho de seção", () => {
    const qwenText = text.replace("6,5/10", "7.5");
    const requoted = extractAIReportFields(qwenText, vascoCtx);
    expect(requoted.confidence).toBeCloseTo(7.5);
  });

  it("não deixa o título da seção vazar para dentro dos argumentos/riscos", () => {
    expect(extracted.risks).not.toContain(expect.stringContaining("Mercado a Evitar"));
    expect(extracted.risks?.length).toBe(2);
    expect(extracted.arguments?.length).toBe(2);
  });
});

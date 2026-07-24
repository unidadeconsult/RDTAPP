import { describe, expect, it } from "vitest";
import { extractAIReportFields } from "@/lib/consensus/normalizeReport";

describe("extractAIReportFields — formato estruturado (rótulo: valor)", () => {
  const text = [
    "Favorito: Västerås SK",
    "Placar: 2-1",
    "Casa: 55%",
    "Empate: 23%",
    "Fora: 22%",
    "Mercado principal: Under 3.5 @1.62",
    "Alternativa: Over 0.5 HT @1.22",
    "Evitar: Casa @1.57",
    "Confiança: 7",
    "Argumentos: Under 3.5 tem boa sustentação",
    "Riscos: amostra pequena",
  ].join("\n");

  const extracted = extractAIReportFields(text);

  it("extrai campos escalares", () => {
    expect(extracted.favorite).toBe("Västerås SK");
    expect(extracted.expectedScore).toBe("2-1");
    expect(extracted.homeProbability).toBeCloseTo(0.55);
    expect(extracted.confidence).toBe(7);
  });

  it("extrai e canoniza mercados", () => {
    expect(extracted.mainPick?.market).toBe("Gols");
    expect(extracted.mainPick?.selection).toBe("Under 3.5");
    expect(extracted.mainPick?.odd).toBeCloseTo(1.62);
    expect(extracted.alternativePicks?.[0]?.selection).toBe("Over 0.5 HT");
    expect(extracted.avoidPicks?.[0]?.selection).toBe("Casa");
  });

  it("extrai argumentos e riscos", () => {
    expect(extracted.arguments).toContain("Under 3.5 tem boa sustentação");
    expect(extracted.risks).toContain("amostra pequena");
  });
});

describe("extractAIReportFields — linguagem natural (prosa)", () => {
  const text =
    "Acho que Västerås SK é o favorito nessa partida. O placar mais provável seria 2-1. " +
    "A probabilidade de vitória da casa gira em torno de 55%, com 22% de empate e 23% para o visitante. " +
    "O mercado que mais gosto aqui é Under 3.5, com odd de 1.62 — vejo bom valor nessa linha porque as duas equipes têm médias baixas de gols. " +
    "Como alternativa, Over 0.5 no primeiro tempo também parece sólido a 1.22. " +
    "Evitaria apostar em BTTS Sim a 1.57, a odd está muito baixa pro risco. " +
    "Minha confiança nessa análise é de 7 em 10. " +
    "Um risco a considerar: amostra pequena nos últimos 5 jogos.";

  const extracted = extractAIReportFields(text, {
    homeTeam: "Västerås SK",
    awayTeam: "Örgryte",
  });

  it("identifica o favorito a partir dos nomes dos times fornecidos", () => {
    expect(extracted.favorite).toBe("Västerås SK");
  });

  it("não identifica favorito sem contexto de times", () => {
    const withoutContext = extractAIReportFields(text);
    expect(withoutContext.favorite).toBeUndefined();
  });

  it("extrai o placar esperado", () => {
    expect(extracted.expectedScore).toBe("2-1");
  });

  it("associa cada percentual ao time/resultado correto", () => {
    expect(extracted.homeProbability).toBeCloseTo(0.55);
    expect(extracted.drawProbability).toBeCloseTo(0.22);
    expect(extracted.awayProbability).toBeCloseTo(0.23);
  });

  it("identifica o mercado principal com odd e o canoniza", () => {
    expect(extracted.mainPick?.market).toBe("Gols");
    expect(extracted.mainPick?.selection).toBe("Under 3.5");
    expect(extracted.mainPick?.odd).toBeCloseTo(1.62);
  });

  it("identifica a alternativa citada", () => {
    const alt = extracted.alternativePicks?.[0];
    expect(alt?.market).toBe("Gols 1º tempo");
    expect(alt?.selection).toBe("Over 0.5 HT");
    expect(alt?.odd).toBeCloseTo(1.22);
  });

  it("identifica o mercado a evitar", () => {
    const avoid = extracted.avoidPicks?.[0];
    expect(avoid?.market).toBe("Ambas marcam");
    expect(avoid?.selection).toBe("Sim");
    expect(avoid?.odd).toBeCloseTo(1.57);
  });

  it("extrai a confiança declarada em texto livre", () => {
    expect(extracted.confidence).toBe(7);
  });

  it("captura ao menos um argumento e um risco mencionados em prosa", () => {
    expect(extracted.arguments?.length).toBeGreaterThan(0);
    expect(extracted.risks?.length).toBeGreaterThan(0);
    expect(extracted.risks?.some((r) => r.includes("amostra pequena"))).toBe(true);
  });
});

describe("extractAIReportFields — texto misto", () => {
  it("dá prioridade ao valor estruturado quando ambos aparecem", () => {
    const text = "Confiança: 9\nEssa análise tem uma confiança de 3 em 10, apesar de tudo.";
    const extracted = extractAIReportFields(text);
    expect(extracted.confidence).toBe(9);
  });

  it("usa a prosa para preencher o que o texto estruturado não cobre", () => {
    const text = "Favorito: Västerås SK\nO mercado que mais gosto é Under 3.5 a 1.62.";
    const extracted = extractAIReportFields(text);
    expect(extracted.favorite).toBe("Västerås SK");
    expect(extracted.mainPick?.selection).toBe("Under 3.5");
  });
});

describe("extractAIReportFields — texto sem nenhum campo reconhecível", () => {
  it("não inventa dados e retorna campos vazios", () => {
    const extracted = extractAIReportFields("Isso é só um comentário qualquer sem estrutura nenhuma.");
    expect(extracted.favorite).toBeUndefined();
    expect(extracted.mainPick).toBeUndefined();
    expect(extracted.confidence).toBeUndefined();
  });
});

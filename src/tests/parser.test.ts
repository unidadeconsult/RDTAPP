import { describe, expect, it } from "vitest";
import { parseFutOdds } from "@/lib/parser/futoddsParser";
import { SEED_FUTODDS_TEXT } from "@/data/seedRawText";

describe("parseFutOdds", () => {
  const data = parseFutOdds(SEED_FUTODDS_TEXT);

  it("extracts basic match info", () => {
    expect(data.info.homeTeam).toBe("Västerås SK");
    expect(data.info.awayTeam).toBe("Örgryte");
    expect(data.info.competition).toBe("Sweden Allsvenskan");
    expect(data.info.homePosition).toBe(5);
    expect(data.info.awayPosition).toBe(8);
  });

  it("extracts odds", () => {
    expect(data.odds.home).toBeCloseTo(1.57);
    expect(data.odds.draw).toBeCloseTo(4.2);
    expect(data.odds.away).toBeCloseTo(5.0);
    expect(data.odds.under35).toBeCloseTo(1.62);
    expect(data.odds.bttsYes).toBeCloseTo(1.57);
  });

  it("extracts probabilities as fractions", () => {
    expect(data.probabilities.home).toBeCloseTo(0.56);
    expect(data.probabilities.under35).toBeCloseTo(0.641);
    expect(data.probabilities.expectedScore).toBe("2-1");
  });

  it("extracts last five form per team", () => {
    expect(data.home.lastFive?.form).toBe("V-V-E-D-V");
    expect(data.home.lastFive?.over25).toBeCloseTo(0.6);
    expect(data.away.lastFive?.bttsYes).toBeCloseTo(0.6);
  });

  it("extracts last twenty stats per team", () => {
    expect(data.home.lastTwenty?.ppg).toBeCloseTo(1.85);
    expect(data.home.lastTwenty?.goalsFor).toBe(32);
    expect(data.away.lastTwenty?.goalsAgainst).toBe(27);
    expect(data.home.lastTwenty?.possession).toBeCloseTo(0.54);
  });

  it("builds market values from odds and probabilities", () => {
    const over25 = data.marketValues.find((m) => m.selection === "Over 2.5");
    expect(over25?.marketOdd).toBeCloseTo(1.59);
  });

  it("handles unparseable text without throwing", () => {
    const empty = parseFutOdds("linha qualquer sem estrutura\noutra linha solta");
    expect(empty.info.homeTeam).toBe("");
    expect(empty.unparsedLines.length).toBeGreaterThan(0);
  });
});

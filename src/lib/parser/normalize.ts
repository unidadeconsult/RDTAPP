/** Remove acentos, baixa para minúsculas e tira espaços/pontuação de borda. */
const DIACRITICS_REGEX = /[̀-ͯ]/g;

export function normalizeKey(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "")
    .toLowerCase()
    .replace(/[:\-–]+$/g, "")
    .trim();
}

/** Interpreta um número em formato brasileiro ou internacional, com ou sem "%". */
export function parseNumber(raw: string): number | undefined {
  const cleaned = raw
    .trim()
    .replace(/%/g, "")
    .replace(/\s/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "") // remove separador de milhar "1.234"
    .replace(",", ".");
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) ? value : undefined;
}

/** Interpreta um percentual textual ("56%", "56") como fração 0-1. */
export function parsePercent(raw: string): number | undefined {
  const value = parseNumber(raw);
  if (value === undefined) return undefined;
  return value > 1 ? value / 100 : value;
}

/** Divide "chave: valor" respeitando o primeiro ":" encontrado. */
export function splitKeyValue(line: string): [string, string] | undefined {
  const idx = line.indexOf(":");
  if (idx === -1) return undefined;
  const key = line.slice(0, idx).trim();
  const value = line.slice(idx + 1).trim();
  if (!key || !value) return undefined;
  return [key, value];
}

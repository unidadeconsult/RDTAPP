import type { Analysis } from "@/types";

const STORAGE_KEY = "kylian-movic:analyses";

function isBrowser() {
  return typeof window !== "undefined";
}

function readAll(): Analysis[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Analysis[];
  } catch {
    return [];
  }
}

function writeAll(analyses: Analysis[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(analyses));
}

export function listAnalyses(): Analysis[] {
  return readAll().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getAnalysis(id: string): Analysis | undefined {
  return readAll().find((a) => a.id === id);
}

export function saveAnalysis(analysis: Analysis): void {
  const all = readAll();
  const idx = all.findIndex((a) => a.id === analysis.id);
  const updated = { ...analysis, updatedAt: new Date().toISOString() };
  if (idx >= 0) {
    all[idx] = updated;
  } else {
    all.push(updated);
  }
  writeAll(all);
}

export function deleteAnalysis(id: string): void {
  writeAll(readAll().filter((a) => a.id !== id));
}

export function duplicateAnalysis(id: string): Analysis | undefined {
  const original = getAnalysis(id);
  if (!original) return undefined;
  const now = new Date().toISOString();
  const copy: Analysis = {
    ...original,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    isDemo: false,
  };
  saveAnalysis(copy);
  return copy;
}

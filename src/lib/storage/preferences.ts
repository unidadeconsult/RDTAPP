import type { RiskProfile } from "@/types";

const THEME_KEY = "kylian-movic:theme";
const RISK_KEY = "kylian-movic:risk-profile";
const COLLAPSED_KEY = "kylian-movic:collapsed-cards";

export type Theme = "light" | "dark";

function isBrowser() {
  return typeof window !== "undefined";
}

export function getStoredTheme(): Theme {
  if (!isBrowser()) return "light";
  return (window.localStorage.getItem(THEME_KEY) as Theme) || "light";
}

export function setStoredTheme(theme: Theme): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(THEME_KEY, theme);
}

export function getStoredRiskProfile(): RiskProfile {
  if (!isBrowser()) return "moderate";
  return (window.localStorage.getItem(RISK_KEY) as RiskProfile) || "moderate";
}

export function setStoredRiskProfile(profile: RiskProfile): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(RISK_KEY, profile);
}

export function getCollapsedCards(): Record<string, boolean> {
  if (!isBrowser()) return {};
  try {
    const raw = window.localStorage.getItem(COLLAPSED_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function setCollapsedCard(cardId: string, collapsed: boolean): void {
  if (!isBrowser()) return;
  const all = getCollapsedCards();
  all[cardId] = collapsed;
  window.localStorage.setItem(COLLAPSED_KEY, JSON.stringify(all));
}

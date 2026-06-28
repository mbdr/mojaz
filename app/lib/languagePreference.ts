/**
 * Shared language preference, persisted to localStorage so it carries over
 * between the home page and other routes (e.g. /settings) that don't share
 * React state with it.
 */

const STORAGE_KEY = "mojaz-language";

export type AppLanguage = "ar" | "en";

export function getStoredLanguage(): AppLanguage {
  if (typeof window === "undefined") return "ar";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "en" ? "en" : "ar";
}

export function setStoredLanguage(language: AppLanguage): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, language);
}

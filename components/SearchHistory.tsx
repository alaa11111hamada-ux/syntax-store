"use client";

const STORAGE_KEY = "search_history:v1";
const MAX_ITEMS = 5;

export function getSearchHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

export function addToSearchHistory(term: string): string[] {
  const trimmed = term.trim();
  if (!trimmed) return getSearchHistory();
  const current = getSearchHistory().filter((s) => s !== trimmed);
  const updated = [trimmed, ...current].slice(0, MAX_ITEMS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
  return updated;
}

export function clearSearchHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

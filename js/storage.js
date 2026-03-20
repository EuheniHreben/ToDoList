import { state, resetState } from "./state.js";

/* =========================
   Keys
========================= */

const STORAGE_KEY = "myList";
const PREFS_KEY = "todoPrefs";

/* =========================
   Safe JSON parse
========================= */

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/* =========================
   Save state
========================= */

export function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

/* =========================
   Load state
========================= */

export function loadFromStorage() {
  const saved = safeParse(localStorage.getItem(STORAGE_KEY));

  if (!saved) return;

  if (!Array.isArray(saved.lists)) return;

  resetState(saved);
}

/* =========================
   Preferences
========================= */

export function readPrefs() {
  const raw = safeParse(localStorage.getItem(PREFS_KEY)) || {};

  return {
    theme: ["light", "dark", "system", "time"].includes(raw.theme)
      ? raw.theme
      : "time",

    sort: raw.sort === "alpha" ? "alpha" : "added",
  };
}

export function writePrefs(next) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  } catch {}
}

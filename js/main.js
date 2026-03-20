import { render, updateEmptyState } from "./render.js";
import {
  loadFromStorage,
  saveToStorage,
  readPrefs,
  writePrefs,
} from "./storage.js";
import { addTask, isDuplicate, normalizeText, clearChecks } from "./tasks.js";
import { addList } from "./lists.js";

/* =========================
   Elements
========================= */

const input = document.getElementById("taskInput");
const form = document.querySelector(".form");
const clearChecksBtn = document.getElementById("clearChecksBtn");

const settingsBtn = document.getElementById("settingsBtn");
const settingsPanel = document.getElementById("settingsPanel");
const themeSelect = document.getElementById("themeSelect");
const sortSelect = document.getElementById("sortSelect");
const backdrop = document.getElementById("backdrop");
const newListBtn = document.getElementById("newListBtn");

/* =========================
   Preferences
========================= */

let prefs = readPrefs();

/* =========================
   Theme logic
========================= */

function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getTimeTheme() {
  const h = new Date().getHours();
  return h >= 21 || h < 7 ? "dark" : "light";
}

function applyTheme(mode) {
  document.body.classList.remove("light", "dark");

  let theme;

  switch (mode) {
    case "light":
    case "dark":
      theme = mode;
      break;

    case "system":
      theme = getSystemTheme();
      break;

    case "time":
    default:
      theme = getTimeTheme();
  }

  document.body.classList.add(theme);
}

/* =========================
   Settings UI
========================= */

function setPanelOpen(isOpen) {
  if (!settingsBtn || !settingsPanel) return;

  settingsBtn.setAttribute("aria-expanded", String(isOpen));

  const wrap = settingsBtn.closest(".settings");
  if (wrap) wrap.classList.toggle("open", isOpen);

  const icon = settingsBtn.querySelector("i");

  if (icon) {
    icon.classList.toggle("fa-gear", !isOpen);
    icon.classList.toggle("fa-xmark", isOpen);
  }

  if (backdrop) {
    backdrop.classList.toggle("hidden", !isOpen);

    requestAnimationFrame(() => {
      backdrop.classList.toggle("show", isOpen);
    });
  }

  settingsBtn.setAttribute(
    "aria-label",
    isOpen ? "Закрыть настройки" : "Открыть настройки",
  );
}

/* =========================
   Events
========================= */

form?.addEventListener("submit", (e) => {
  e.preventDefault();

  const value = normalizeText(input.value);

  if (!value) return;
  if (isDuplicate(value)) return;

  addTask(value);

  saveToStorage();
  render(prefs.sort);

  input.value = "";
});

clearChecksBtn?.addEventListener("click", () => {
  clearChecks();

  saveToStorage();
  render(prefs.sort);
});

/* Settings */

settingsBtn?.addEventListener("click", () => {
  const isOpen = settingsBtn.getAttribute("aria-expanded") === "true";
  setPanelOpen(!isOpen);
});

backdrop?.addEventListener("click", () => setPanelOpen(false));

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") setPanelOpen(false);
});

themeSelect?.addEventListener("change", () => {
  prefs.theme = themeSelect.value;

  writePrefs(prefs);
  applyTheme(prefs.theme);

  setPanelOpen(false);
});

sortSelect?.addEventListener("change", () => {
  prefs.sort = sortSelect.value;

  writePrefs(prefs);
  render(prefs.sort);

  setPanelOpen(false);
});

newListBtn?.addEventListener("click", () => {
  addList("Новый список");

  saveToStorage();
  render(prefs.sort);
});

/* =========================
   Init
========================= */

window.addEventListener("DOMContentLoaded", () => {
  loadFromStorage();

  render(prefs.sort);
  applyTheme(prefs.theme);

  if (themeSelect) themeSelect.value = prefs.theme;
  if (sortSelect) sortSelect.value = prefs.sort;

  updateEmptyState();
});

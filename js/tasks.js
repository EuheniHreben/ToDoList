import { state } from "./state.js";

/* =========================
   Utils
========================= */

export function normalizeText(s) {
  return String(s).trim().replace(/\s+/g, " ").toLowerCase();
}

export function titleCaseFirst(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

export function cryptoId() {
  try {
    return crypto.randomUUID();
  } catch {
    return Date.now() + Math.random().toString(16).slice(2);
  }
}

/* =========================
   Helpers
========================= */

export function getActiveList() {
  return state.lists.find((l) => l.id === state.activeListId);
}

/* =========================
   Duplicate check
========================= */

export function isDuplicate(text) {
  const list = getActiveList();
  if (!list) return false;

  const normalized = normalizeText(text);

  return list.tasks.some((task) => normalizeText(task.text) === normalized);
}

/* =========================
   Add task
========================= */

export function addTask(text) {
  const list = getActiveList();
  if (!list) return;

  list.tasks.push({
    id: cryptoId(),
    text: normalizeText(text),
    done: false,
    createdAt: Date.now(),
  });
}

/* =========================
   Toggle task
========================= */

export function toggleTask(id) {
  const list = getActiveList();
  if (!list) return;

  const task = list.tasks.find((t) => t.id === id);
  if (!task) return;

  task.done = !task.done;
}

/* =========================
   Delete task
========================= */

export function deleteTask(id) {
  const list = getActiveList();
  if (!list) return;

  list.tasks = list.tasks.filter((t) => t.id !== id);
}

/* =========================
   Reset checks
========================= */

export function clearChecks() {
  const list = getActiveList();
  if (!list) return;

  list.tasks.forEach((task) => {
    task.done = false;
  });
}

/* =========================
   Sorting
========================= */

export function compareTasks(a, b, sortMode = "added") {
  if (a.done !== b.done) return a.done ? 1 : -1;

  if (sortMode === "alpha") {
    return normalizeText(a.text).localeCompare(normalizeText(b.text));
  }

  return a.createdAt - b.createdAt;
}

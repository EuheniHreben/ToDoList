import { state } from "./state.js";
import { cryptoId } from "./tasks.js";

/* =========================
   Helpers
========================= */

function findList(id) {
  return state.lists.find((list) => list.id === id);
}

/* =========================
   Add list
========================= */

export function addList(title = "Новый список") {
  const newList = {
    id: cryptoId(),
    title: title.trim(),
    createdAt: Date.now(),
    tasks: [],
  };

  state.lists.push(newList);

  // новый список сразу становится активным
  state.activeListId = newList.id;

  return newList;
}

/* =========================
   Set active list
========================= */

export function setActiveList(id) {
  const list = findList(id);
  if (!list) return;

  state.activeListId = id;
}

/* =========================
   Rename list
========================= */

export function renameList(id, newTitle) {
  const list = findList(id);
  if (!list) return;

  const title = String(newTitle).trim();
  if (!title) return;

  list.title = title;
}

/* =========================
   Delete list
========================= */

export function deleteList(id) {
  const index = state.lists.findIndex((list) => list.id === id);
  if (index === -1) return;

  state.lists.splice(index, 1);

  /* если удалили активный список —
     выбираем следующий */
  if (state.activeListId === id) {
    const next = state.lists[index] || state.lists[index - 1];
    state.activeListId = next ? next.id : null;
  }
}

/* =========================
   Get active list
========================= */

export function getActiveList() {
  return state.lists.find((list) => list.id === state.activeListId);
}

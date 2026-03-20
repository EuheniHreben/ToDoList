import { state } from "./state.js";
import {
  toggleTask,
  deleteTask,
  titleCaseFirst,
  compareTasks,
} from "./tasks.js";
import { saveToStorage } from "./storage.js";

/* =========================
   Elements
========================= */

const list = document.getElementById("taskList");
let emptyState = document.getElementById("emptyState");

if (!emptyState) {
  emptyState = document.createElement("p");
  emptyState.id = "emptyState";
  emptyState.className = "empty-state hidden";
  emptyState.textContent = "Пока пусто... Добавь первую задачу ➕";
  list.after(emptyState);
}

/* =========================
   Helpers
========================= */

function getActiveList() {
  return state.lists.find((l) => l.id === state.activeListId);
}

export function updateEmptyState() {
  const list = getActiveList();
  const hasTasks = list && list.tasks.length > 0;

  emptyState.classList.toggle("hidden", hasTasks);
}

/* =========================
   Render
========================= */

export function render(sortMode = "added") {
  const activeList = getActiveList();

  list.innerHTML = "";

  if (!activeList) {
    updateEmptyState();
    return;
  }

  const sorted = [...activeList.tasks].sort((a, b) =>
    compareTasks(a, b, sortMode),
  );

  sorted.forEach((task) => {
    const li = createTaskElement(task);
    list.appendChild(li);
  });

  updateEmptyState();
}

/* =========================
   Task element
========================= */

function createTaskElement(task) {
  const li = document.createElement("li");
  li.dataset.id = task.id;
  li.classList.toggle("done", task.done);

  const label = document.createElement("label");
  label.className = "custom-checkbox";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "checkbox-input";
  checkbox.checked = task.done;

  const mark = document.createElement("span");
  mark.className = "checkbox-mark";
  mark.textContent = "✅";

  label.append(checkbox, mark);

  const span = document.createElement("span");
  span.className = "task-text";
  span.textContent = titleCaseFirst(task.text);

  const del = document.createElement("button");
  del.type = "button";
  del.className = "btn btn--remove";
  del.textContent = "❌";

  /* =========================
     Toggle
  ========================= */

  function handleToggle() {
    li.classList.add("hide");

    setTimeout(() => {
      toggleTask(task.id);

      li.classList.toggle("done", checkbox.checked);

      saveToStorage();

      li.classList.remove("hide");

      render();
    }, 200);
  }

  checkbox.addEventListener("change", handleToggle);

  li.addEventListener("click", (e) => {
    if (e.target.closest("button")) return;

    checkbox.checked = !checkbox.checked;

    handleToggle();
  });

  /* =========================
     Delete
  ========================= */

  del.addEventListener("click", (e) => {
    e.stopPropagation();

    li.classList.add("remove");

    setTimeout(() => {
      deleteTask(task.id);

      saveToStorage();

      render();
    }, 200);
  });

  li.append(label, span, del);

  return li;
}

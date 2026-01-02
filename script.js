(() => {
  "use strict";

  const STORAGE_KEY = "myList";

  const input = document.getElementById("taskInput");
  const addBtn = document.getElementById("addBtn");
  const list = document.getElementById("taskList");
  const clearChecksBtn = document.getElementById("clearChecksBtn");
  const form = document.querySelector(".form");

  if (!input || !addBtn || !list || !clearChecksBtn || !form) return;

  let emptyState = document.getElementById("emptyState");
  if (!emptyState) {
    emptyState = document.createElement("p");
    emptyState.id = "emptyState";
    emptyState.textContent = "Пока пусто... Добавь первую задачу ➕";
    emptyState.classList.add("empty-state", "hidden");
    list.insertAdjacentElement("afterend", emptyState);
  }

  const normalizeText = (str) =>
    String(str).trim().replace(/\s+/g, " ").toLowerCase();

  const titleCaseFirst = (str) => {
    const s = String(str);
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  };

  function updateEmptyState() {
    emptyState.classList.toggle("hidden", list.children.length !== 0);
  }

  function setThemeByTime() {
    const hour = new Date().getHours();
    const isDark = !(hour >= 6 && hour <= 18);
    document.body.classList.toggle("dark", isDark);
  }

  function saveToStorage() {
    const items = [...list.querySelectorAll("li")].map((li) => {
      const span = li.querySelector(".task-text");
      const checkbox = li.querySelector("input[type='checkbox']");
      return {
        text: span ? span.textContent : "",
        done: Boolean(checkbox && checkbox.checked),
      };
    });

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {}
  }

  function safeParse(json) {
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  function loadFromStorage() {
    const raw = localStorage.getItem(STORAGE_KEY);
    const savedList = raw ? safeParse(raw) : null;

    if (savedList === null) {
      const defaultItems = [
        { text: "1. Проснуться", done: false },
        { text: "2. Позавтракать", done: false },
        { text: "3. Пойти на работу", done: false },
        { text: "4. Дожить до вечера", done: false },
      ];
      defaultItems.forEach((item) => addListItem(item.text, item.done));
      saveToStorage();
      updateEmptyState();
      return;
    }

    if (Array.isArray(savedList) && savedList.length > 0) {
      savedList.forEach((item) => {
        if (!item) return;
        const text = typeof item.text === "string" ? item.text : "";
        const done = Boolean(item.done);
        if (normalizeText(text)) addListItem(text, done);
      });
    }

    updateEmptyState();
  }

  function insertSortedItem(li, done) {
    const items = [...list.children];
    const newText = normalizeText(li.querySelector(".task-text")?.textContent);

    let inserted = false;

    for (const item of items) {
      const itemText = normalizeText(
        item.querySelector(".task-text")?.textContent
      );
      const itemDone = item.classList.contains("done");

      if (!done && itemDone) {
        list.insertBefore(li, item);
        inserted = true;
        break;
      }

      if (done === itemDone && newText && itemText && newText < itemText) {
        list.insertBefore(li, item);
        inserted = true;
        break;
      }
    }

    if (!inserted) list.append(li);
  }

  function resortList() {
    const items = [...list.children];

    items.sort((a, b) => {
      const aDone = a.classList.contains("done");
      const bDone = b.classList.contains("done");
      if (aDone !== bDone) return aDone ? 1 : -1;

      const aText = normalizeText(a.querySelector(".task-text")?.textContent);
      const bText = normalizeText(b.querySelector(".task-text")?.textContent);
      return aText.localeCompare(bText);
    });

    items.forEach((item) => list.appendChild(item));
    updateEmptyState();
  }

  function toggleDone(li, checkbox) {
    li.classList.toggle("done", checkbox.checked);
    li.classList.add("hide");

    window.setTimeout(() => {
      li.classList.remove("hide");
      if (li.parentElement === list) list.removeChild(li);
      insertSortedItem(li, checkbox.checked);
      saveToStorage();
      updateEmptyState();
    }, 200);
  }

  function addListItem(text, done = false) {
    const newLi = document.createElement("li");
    newLi.classList.add("list__item");

    const label = document.createElement("label");
    label.classList.add("custom-checkbox");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.classList.add("checkbox-input");
    checkbox.checked = done;

    const mark = document.createElement("span");
    mark.classList.add("checkbox-mark");
    mark.textContent = "✅";

    label.append(checkbox, mark);

    const span = document.createElement("span");
    span.classList.add("task-text");
    span.textContent = titleCaseFirst(text);

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.textContent = "❌";
    delBtn.classList.add("btn", "btn--remove");

    checkbox.addEventListener("change", () => toggleDone(newLi, checkbox));

    span.addEventListener("click", () => {
      checkbox.checked = !checkbox.checked;
      toggleDone(newLi, checkbox);
    });

    delBtn.addEventListener("click", (e) => {
      e.preventDefault();
      newLi.classList.add("remove");
      window.setTimeout(() => {
        newLi.remove();
        saveToStorage();
        updateEmptyState();
      }, 200);
    });

    newLi.classList.toggle("done", done);
    newLi.append(label, span, delBtn);

    insertSortedItem(newLi, done);
    updateEmptyState();
  }

  function hasDuplicate(value) {
    const normalized = normalizeText(value);
    if (!normalized) return false;

    const all = list.querySelectorAll("li .task-text");
    for (const span of all) {
      if (normalizeText(span.textContent) === normalized) return true;
    }
    return false;
  }

  function handleAdd() {
    const value = input.value;
    const normalized = normalizeText(value);

    if (!normalized) {
      input.value = "";
      input.focus();
      return;
    }

    if (hasDuplicate(value)) {
      input.select();
      return;
    }

    addListItem(value, false);
    saveToStorage();
    updateEmptyState();

    input.value = "";
    input.focus();
  }

  window.addEventListener("DOMContentLoaded", () => {
    loadFromStorage();
    setThemeByTime();
    updateEmptyState();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    handleAdd();
  });

  clearChecksBtn.addEventListener("click", (e) => {
    e.preventDefault();

    const allCheckboxes = list.querySelectorAll("input[type='checkbox']");
    allCheckboxes.forEach((checkbox) => {
      checkbox.checked = false;
      const li = checkbox.closest("li");
      if (li) li.classList.remove("done");
    });

    resortList();
    saveToStorage();
    updateEmptyState();
  });

  setThemeByTime();
  window.setInterval(setThemeByTime, 60 * 1000);
})();

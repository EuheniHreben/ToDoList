(() => {
  "use strict";

  const STORAGE_KEY = "myList";
  const PREFS_KEY = "todoPrefs";

  const input = document.getElementById("taskInput");
  const addBtn = document.getElementById("addBtn");
  const list = document.getElementById("taskList");
  const clearChecksBtn = document.getElementById("clearChecksBtn");
  const form = document.querySelector(".form");

  // Settings UI
  const settingsBtn = document.getElementById("settingsBtn");
  const settingsPanel = document.getElementById("settingsPanel");
  const themeSelect = document.getElementById("themeSelect");
  const sortSelect = document.getElementById("sortSelect");
  const settingsWrap = document.querySelector(".settings");
  const settingsIcon = settingsBtn?.querySelector("i");
  const backdrop = document.getElementById("backdrop");

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

  function safeParse(json) {
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  function readPrefs() {
    const raw = localStorage.getItem(PREFS_KEY);
    const parsed = raw ? safeParse(raw) : null;
    const theme =
      parsed && typeof parsed.theme === "string" ? parsed.theme : "auto";
    const sort =
      parsed && typeof parsed.sort === "string" ? parsed.sort : "added";
    return {
      theme:
        theme === "light" || theme === "dark" || theme === "auto"
          ? theme
          : "auto",
      sort: sort === "alpha" || sort === "added" ? sort : "added",
    };
  }

  function writePrefs(next) {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    } catch (e) {}
  }

  let prefs = readPrefs();

  const prefersDark = () => {
    try {
      return (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      );
    } catch {
      return true;
    }
  };

  function applyTheme(mode) {
    const isDark =
      mode === "dark" ? true : mode === "light" ? false : prefersDark();
    document.body.classList.toggle("dark", isDark);
  }

  function cryptoSafeId() {
    try {
      return crypto.randomUUID();
    } catch {
      return String(Date.now()) + Math.random().toString(16).slice(2);
    }
  }

  function saveToStorage() {
    const items = [...list.querySelectorAll("li")].map((li) => {
      const span = li.querySelector(".task-text");
      const checkbox = li.querySelector("input[type='checkbox']");
      return {
        id: li.dataset.id || "",
        createdAt: Number(li.dataset.createdAt) || 0,
        text: span ? span.textContent : "",
        done: Boolean(checkbox && checkbox.checked),
      };
    });

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {}
  }

  function compareItems(a, b) {
    const aDone = a.classList.contains("done");
    const bDone = b.classList.contains("done");
    if (aDone !== bDone) return aDone ? 1 : -1; // undone first

    if (prefs.sort === "alpha") {
      const aText = normalizeText(a.querySelector(".task-text")?.textContent);
      const bText = normalizeText(b.querySelector(".task-text")?.textContent);
      return aText.localeCompare(bText);
    }

    const aCreated = Number(a.dataset.createdAt) || 0;
    const bCreated = Number(b.dataset.createdAt) || 0;
    return aCreated - bCreated;
  }

  function insertSortedItem(li) {
    const items = [...list.children];
    for (const item of items) {
      if (compareItems(li, item) < 0) {
        list.insertBefore(li, item);
        return;
      }
    }
    list.append(li);
  }

  function resortList() {
    const items = [...list.children];
    items.sort(compareItems);
    items.forEach((item) => list.appendChild(item));
    updateEmptyState();
  }

  function toggleDone(li, checkbox) {
    li.classList.toggle("done", checkbox.checked);
    li.classList.add("hide");

    window.setTimeout(() => {
      li.classList.remove("hide");
      if (li.parentElement === list) list.removeChild(li);
      insertSortedItem(li);
      saveToStorage();
      updateEmptyState();
    }, 200);
  }

  function addListItem(text, done = false, meta = {}) {
    const newLi = document.createElement("li");
    newLi.classList.add("list__item");

    newLi.dataset.id =
      typeof meta.id === "string" && meta.id ? meta.id : cryptoSafeId();
    newLi.dataset.createdAt = String(Number(meta.createdAt) || Date.now());

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

    insertSortedItem(newLi);
    updateEmptyState();
  }

  function loadFromStorage() {
    const raw = localStorage.getItem(STORAGE_KEY);
    const savedList = raw ? safeParse(raw) : null;

    if (savedList === null) {
      const now = Date.now();
      const defaultItems = [
        { text: "1. Проснуться", done: false, createdAt: now + 1 },
        { text: "2. Позавтракать", done: false, createdAt: now + 2 },
        { text: "3. Пойти на работу", done: false, createdAt: now + 3 },
        { text: "4. Дожить до вечера", done: false, createdAt: now + 4 },
      ];
      defaultItems.forEach((item) =>
        addListItem(item.text, item.done, {
          id: cryptoSafeId(),
          createdAt: item.createdAt,
        }),
      );
      saveToStorage();
      updateEmptyState();
      return;
    }

    if (Array.isArray(savedList) && savedList.length > 0) {
      const base = Date.now();
      savedList.forEach((item, idx) => {
        if (!item) return;
        const text = typeof item.text === "string" ? item.text : "";
        const done = Boolean(item.done);
        const createdAt = Number(item.createdAt) || 0;
        const id = typeof item.id === "string" ? item.id : "";
        if (normalizeText(text))
          addListItem(text, done, {
            id: id || cryptoSafeId(),
            createdAt: createdAt || base + idx,
          });
      });
    }

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

  // --- Settings UI behavior ---
  function setPanelOpen(isOpen) {
    if (!settingsBtn || !settingsPanel) return;

    settingsBtn.setAttribute("aria-expanded", String(isOpen));
    settingsPanel.classList.toggle("hidden", !isOpen);

    // класс open на обёртке (для иконки/анимаций)
    const wrap = settingsBtn.closest(".settings");
    if (wrap) wrap.classList.toggle("open", isOpen);

    // FontAwesome icon toggle (если ты уже перешёл на 2 иконки — это не надо)
    const icon = settingsBtn.querySelector("i");
    if (icon) {
      icon.classList.toggle("fa-gear", !isOpen);
      icon.classList.toggle("fa-xmark", isOpen);
    }

    // backdrop
    if (backdrop) {
      backdrop.classList.toggle("hidden", !isOpen);
      // чтобы opacity анимировалась, а не “прыгала”
      requestAnimationFrame(() => {
        backdrop.classList.toggle("show", isOpen);
      });
    }

    settingsBtn.setAttribute(
      "aria-label",
      isOpen ? "Закрыть настройки" : "Открыть настройки",
    );
  }

  if (settingsBtn && settingsPanel) {
    settingsBtn.addEventListener("click", () => {
      const isOpen = settingsBtn.getAttribute("aria-expanded") === "true";
      setPanelOpen(!isOpen);
    });

    // click outside to close
    document.addEventListener("click", (e) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const isOpen = settingsBtn.getAttribute("aria-expanded") === "true";
      if (!isOpen) return;
      if (settingsPanel.contains(target) || settingsBtn.contains(target))
        return;
      setPanelOpen(false);
    });

    // esc to close
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      const isOpen = settingsBtn.getAttribute("aria-expanded") === "true";
      if (isOpen) setPanelOpen(false);
    });
    if (backdrop) {
      backdrop.addEventListener("click", () => setPanelOpen(false));
    }
  }

  if (themeSelect) {
    themeSelect.addEventListener("change", () => {
      prefs = { ...prefs, theme: themeSelect.value };
      writePrefs(prefs);
      applyTheme(prefs.theme);
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      prefs = { ...prefs, sort: sortSelect.value };
      writePrefs(prefs);
      resortList();
      saveToStorage();
    });
  }

  // Keep AUTO theme in sync with OS preference
  try {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", () => {
      if (prefs.theme === "auto") applyTheme("auto");
    });
  } catch (e) {}

  window.addEventListener("DOMContentLoaded", () => {
    loadFromStorage();
    applyTheme(prefs.theme);
    updateEmptyState();

    // init settings values
    if (themeSelect) themeSelect.value = prefs.theme;
    if (sortSelect) sortSelect.value = prefs.sort;
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
    setPanelOpen(false);
  });
})();

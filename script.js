(() => {
  "use strict";

  /* =========================
     Keys
  ========================= */
  const STORAGE_KEY = "myList";
  const PREFS_KEY = "todoPrefs";

  /* =========================
     Elements
  ========================= */
  const input = document.getElementById("taskInput");
  const list = document.getElementById("taskList");
  const clearChecksBtn = document.getElementById("clearChecksBtn");
  const form = document.querySelector(".form");

  const settingsBtn = document.getElementById("settingsBtn");
  const settingsPanel = document.getElementById("settingsPanel");
  const themeSelect = document.getElementById("themeSelect");
  const sortSelect = document.getElementById("sortSelect");
  const backdrop = document.getElementById("backdrop");

  if (!input || !list || !clearChecksBtn || !form) return;

  /* =========================
     State
  ========================= */

  let state = {
    tasks: [],
  };

  let emptyState = document.getElementById("emptyState");
  if (!emptyState) {
    emptyState = document.createElement("p");
    emptyState.id = "emptyState";
    emptyState.className = "empty-state hidden";
    emptyState.textContent = "Пока пусто... Добавь первую задачу ➕";
    list.after(emptyState);
  }

  const updateEmptyState = () =>
    emptyState.classList.toggle("hidden", state.tasks.length > 0);

  /* =========================
     Utils
  ========================= */
  const normalizeText = (s) =>
    String(s).trim().replace(/\s+/g, " ").toLowerCase();

  const titleCaseFirst = (s) =>
    s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

  const safeParse = (json) => {
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  };

  const cryptoId = () => {
    try {
      return crypto.randomUUID();
    } catch {
      return Date.now() + Math.random().toString(16).slice(2);
    }
  };

  function isDuplicate(title) {
    const normalized = normalizeText(title);
    return state.tasks.some((t) => normalizeText(t.text) === normalized);
  }

  /* =========================
     Preferences
  ========================= */
  const readPrefs = () => {
    const raw = safeParse(localStorage.getItem(PREFS_KEY)) || {};
    return {
      theme: ["light", "dark", "system", "time"].includes(raw.theme)
        ? raw.theme
        : "time",
      sort: raw.sort === "alpha" ? "alpha" : "added",
    };
  };

  const writePrefs = (next) => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    } catch {}
  };

  let prefs = readPrefs();

  /* =========================
     Theme logic
  ========================= */
  const getSystemTheme = () =>
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";

  const getTimeTheme = () => {
    const h = new Date().getHours();
    return h >= 21 || h < 7 ? "dark" : "light";
  };

  const applyTheme = (mode) => {
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
  };

  /* =========================
     Storage
  ========================= */
  function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
  }

  function loadFromStorage() {
    const saved = safeParse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved)) {
      state.tasks = saved;
    }
  }

  /* =========================
   Settings UI
========================= */
  function setPanelOpen(isOpen) {
    if (!settingsBtn || !settingsPanel) return;

    settingsBtn.setAttribute("aria-expanded", String(isOpen));
    // settingsPanel.classList.toggle("hidden", !isOpen);

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

  settingsBtn?.addEventListener("click", () => {
    const isOpen = settingsBtn.getAttribute("aria-expanded") === "true";
    setPanelOpen(!isOpen);
  });

  backdrop?.addEventListener("click", () => setPanelOpen(false));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setPanelOpen(false);
  });

  /* =========================
     Sorting
  ========================= */
  function compareTasks(a, b) {
    if (a.done !== b.done) return a.done ? 1 : -1;

    if (prefs.sort === "alpha") {
      return normalizeText(a.text).localeCompare(normalizeText(b.text));
    }

    return a.createdAt - b.createdAt;
  }

  /* =========================
     Add item
  ========================= */

  function addTask(text) {
    state.tasks.push({
      id: cryptoId(),
      text,
      done: false,
      createdAt: Date.now(),
    });
  }

  function render() {
    list.innerHTML = "";

    const sorted = [...state.tasks].sort(compareTasks);

    sorted.forEach((task) => {
      const li = createTaskElement(task);
      list.appendChild(li);
    });

    updateEmptyState();
  }

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
     TOGGLE LOGIC (единая)
  ========================= */
    function handleToggle() {
      li.classList.add("hide");

      setTimeout(() => {
        toggleTask(task.id);

        li.classList.toggle("done", checkbox.checked);

        saveToStorage();

        li.classList.remove("hide");

        list.removeChild(li);

        const sorted = [...state.tasks].sort(compareTasks);
        const newIndex = sorted.findIndex((t) => t.id === task.id);

        if (newIndex >= list.children.length) {
          list.appendChild(li);
        } else {
          list.insertBefore(li, list.children[newIndex]);
        }
      }, 200);
    }

    /* =========================
     Checkbox toggle
  ========================= */
    checkbox.addEventListener("change", handleToggle);

    /* =========================
     Click on row
  ========================= */
    li.addEventListener("click", (e) => {
      if (e.target.closest("button")) return;

      // переключаем чекбокс вручную
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
        // 1️⃣ удаляем из state
        state.tasks = state.tasks.filter((t) => t.id !== task.id);

        // 2️⃣ удаляем только этот элемент из DOM
        li.remove();

        // 3️⃣ сохраняем
        saveToStorage();

        // 4️⃣ обновляем empty
        updateEmptyState();
      }, 200);
    });

    li.append(label, span, del);

    return li;
  }

  function toggleTask(id) {
    const task = state.tasks.find((t) => t.id === id);
    if (!task) return;

    task.done = !task.done;
  }

  /* =========================
     Controls
  ========================= */
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const value = normalizeText(input.value);
    if (!value) return;
    if (isDuplicate(value)) return;

    // 1️⃣ создаём задачу
    const newTask = {
      id: cryptoId(),
      text: value,
      done: false,
      createdAt: Date.now(),
    };

    state.tasks.push(newTask);
    saveToStorage();

    // 2️⃣ создаём DOM
    const li = createTaskElement(newTask);

    // 3️⃣ вычисляем позицию
    const sorted = [...state.tasks].sort(compareTasks);
    const newIndex = sorted.findIndex((t) => t.id === newTask.id);

    if (newIndex >= list.children.length) {
      list.appendChild(li);
    } else {
      list.insertBefore(li, list.children[newIndex]);
    }

    updateEmptyState();
    input.value = "";
  });

  clearChecksBtn.addEventListener("click", () => {
    state.tasks.forEach((task) => (task.done = false));
    saveToStorage();
    render();
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
    render();
    setPanelOpen(false);
  });

  window.addEventListener("DOMContentLoaded", () => {
    loadFromStorage();
    render();
    applyTheme(prefs.theme);
    themeSelect && (themeSelect.value = prefs.theme);
    sortSelect && (sortSelect.value = prefs.sort);
    updateEmptyState();
  });
})();

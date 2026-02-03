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
  const addBtn = document.getElementById("addBtn");
  const list = document.getElementById("taskList");
  const clearChecksBtn = document.getElementById("clearChecksBtn");
  const form = document.querySelector(".form");

  const settingsBtn = document.getElementById("settingsBtn");
  const settingsPanel = document.getElementById("settingsPanel");
  const themeSelect = document.getElementById("themeSelect");
  const sortSelect = document.getElementById("sortSelect");
  const backdrop = document.getElementById("backdrop");

  if (!input || !addBtn || !list || !form || !clearChecksBtn) return;

  /* =========================
     Empty state
  ========================= */
  let emptyState = document.getElementById("emptyState");
  if (!emptyState) {
    emptyState = document.createElement("p");
    emptyState.id = "emptyState";
    emptyState.className = "empty-state hidden";
    emptyState.textContent = "Пока пусто... Добавь первую задачу ➕";
    list.after(emptyState);
  }

  const updateEmptyState = () =>
    emptyState.classList.toggle("hidden", list.children.length > 0);

  /* =========================
     Utils
  ========================= */
  const normalizeText = (s) =>
    String(s).trim().replace(/\s+/g, " ").toLowerCase();

  const titleCaseFirst = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

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
  const saveToStorage = () => {
    const items = [...list.children].map((li) => ({
      id: li.dataset.id,
      createdAt: Number(li.dataset.createdAt),
      text: li.querySelector(".task-text")?.textContent || "",
      done: li.classList.contains("done"),
    }));

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  };

  const loadFromStorage = () => {
    const saved = safeParse(localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(saved)) return;

    saved.forEach((item, i) => {
      if (!item?.text) return;
      addItem(item.text, item.done, {
        id: item.id || cryptoId(),
        createdAt: item.createdAt || Date.now() + i,
      });
    });

    updateEmptyState();
  };

  /* =========================
     Sorting
  ========================= */
  const compareItems = (a, b) => {
    const aDone = a.classList.contains("done");
    const bDone = b.classList.contains("done");
    if (aDone !== bDone) return aDone ? 1 : -1;

    if (prefs.sort === "alpha") {
      return normalizeText(
        a.querySelector(".task-text").textContent,
      ).localeCompare(normalizeText(b.querySelector(".task-text").textContent));
    }

    return Number(a.dataset.createdAt) - Number(b.dataset.createdAt);
  };

  const resortList = () => {
    [...list.children].sort(compareItems).forEach((li) => list.appendChild(li));
    updateEmptyState();
  };

  /* =========================
     Items
  ========================= */
  const addItem = (text, done = false, meta = {}) => {
    const li = document.createElement("li");
    li.dataset.id = meta.id || cryptoId();
    li.dataset.createdAt = meta.createdAt || Date.now();
    li.classList.toggle("done", done);

    const label = document.createElement("label");
    label.className = "custom-checkbox";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "checkbox-input";
    checkbox.checked = done;

    const mark = document.createElement("span");
    mark.className = "checkbox-mark";
    mark.textContent = "✅";

    label.append(checkbox, mark);

    const span = document.createElement("span");
    span.className = "task-text";
    span.textContent = titleCaseFirst(text);

    const del = document.createElement("button");
    del.type = "button";
    del.className = "btn btn--remove";
    del.textContent = "❌";

    checkbox.addEventListener("change", () => {
      li.classList.toggle("done", checkbox.checked);
      resortList();
      saveToStorage();
    });

    span.addEventListener("click", () => {
      checkbox.checked = !checkbox.checked;
      checkbox.dispatchEvent(new Event("change"));
    });

    del.addEventListener("click", () => {
      li.remove();
      saveToStorage();
      updateEmptyState();
    });

    li.append(label, span, del);
    list.appendChild(li);
    resortList();
  };

  /* =========================
     Settings UI
  ========================= */
  function setPanelOpen(isOpen) {
    if (!settingsBtn || !settingsPanel) return;

    settingsBtn.setAttribute("aria-expanded", String(isOpen));
    settingsPanel.classList.toggle("hidden", !isOpen);

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
    const open = settingsBtn.getAttribute("aria-expanded") === "true";
    setPanelOpen(!open);
  });

  backdrop?.addEventListener("click", () => setPanelOpen(false));

  /* =========================
     Controls
  ========================= */
  themeSelect?.addEventListener("change", () => {
    prefs.theme = themeSelect.value;
    writePrefs(prefs);
    applyTheme(prefs.theme);
    setPanelOpen(false);
  });

  sortSelect?.addEventListener("change", () => {
    prefs.sort = sortSelect.value;
    writePrefs(prefs);
    resortList();
    saveToStorage();
    setPanelOpen(false);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = normalizeText(input.value);
    if (!value) return;
    addItem(value);
    saveToStorage();
    input.value = "";
    input.focus();
  });

  clearChecksBtn.addEventListener("click", () => {
    list.querySelectorAll("li").forEach((li) => {
      li.classList.remove("done");
      li.querySelector("input")?.removeAttribute("checked");
    });
    resortList();
    saveToStorage();
    setPanelOpen(false);
  });

  /* =========================
     Init
  ========================= */
  window.addEventListener("DOMContentLoaded", () => {
    loadFromStorage();
    applyTheme(prefs.theme);
    themeSelect && (themeSelect.value = prefs.theme);
    sortSelect && (sortSelect.value = prefs.sort);
    updateEmptyState();
  });
})();

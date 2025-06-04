console.clear();
const input = document.getElementById("taskInput");
const btn = document.getElementById("addBtn");
const list = document.getElementById("taskList");
const clearChecksBtn = document.getElementById("clearChecksBtn");

function saveToStorage() {
  const items = [...list.querySelectorAll("li")].map((li) => {
    const span = li.querySelector(".task-text");
    const checkbox = li.querySelector("input[type='checkbox']");
    return {
      text: span.textContent,
      done: checkbox.checked,
    };
  });
  localStorage.setItem("myList", JSON.stringify(items));
}

function loadFromStorage() {
  const savedList = JSON.parse(localStorage.getItem("myList")) || [];
  savedList.forEach((item) => addListItem(item.text, item.done));
}

window.addEventListener("DOMContentLoaded", () => {
  loadFromStorage();
});

function addListItem(text, done = false) {
  const newLi = document.createElement("li");
  newLi.classList.add("list__item");

  const label = document.createElement("label");
  label.classList.add("custom-checkbox");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.classList.add("checkbox-input");
  checkbox.checked = done;

  checkbox.addEventListener("change", () => {
    newLi.classList.toggle("done", checkbox.checked);
    saveToStorage();
  });

  const mark = document.createElement("span");
  mark.classList.add("checkbox-mark");
  mark.textContent = "✅";

  label.append(checkbox, mark);

  const span = document.createElement("span");
  span.classList.add("task-text");
  span.textContent = text;

  span.addEventListener("click", () => {
    checkbox.checked = !checkbox.checked;
    newLi.classList.toggle("done", checkbox.checked);
    saveToStorage();
  });

  const delBtn = document.createElement("button");
  delBtn.textContent = "❌";
  delBtn.classList.add("btn", "btn--remove");
  delBtn.addEventListener("click", () => {
    newLi.classList.add("hide");
    setTimeout(() => {
      newLi.remove();
      saveToStorage();
    }, 300);
  });

  newLi.classList.toggle("done", done);
  newLi.append(label, span, delBtn);
  list.append(newLi);
}

btn.addEventListener("click", (e) => {
  e.preventDefault();
  const value = input.value.trim();
  if (value !== "") {
    const allLi = list.querySelectorAll("li .task-text");
    let isDuplicate = false;
    for (let span of allLi) {
      if (span.textContent === value) {
        isDuplicate = true;
        break;
      }
    }
    if (!isDuplicate) {
      addListItem(value, false);
      saveToStorage();
    }
  }
  input.value = "";
  input.focus();
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") btn.click();
});

clearChecksBtn.addEventListener("click", () => {
  const allCheckboxes = document.querySelectorAll("input[type='checkbox']");
  allCheckboxes.forEach((checkbox) => {
    checkbox.checked = false;
    checkbox.closest("li").classList.remove("done");
  });
  saveToStorage();
});

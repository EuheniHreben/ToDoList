console.clear();
const input = document.getElementById("taskInput");
const btn = document.getElementById("addBtn");
const list = document.getElementById("taskList");
const clearChecksBtn = document.getElementById("clearChecksBtn");

function saveToStorage() {
  const items = [...list.querySelectorAll("li")];
  items.sort((a, b) => {
    const textA = a.querySelector(".task-text").textContent.toLowerCase();
    const textB = b.querySelector(".task-text").textContent.toLowerCase();
    return textA.localeCompare(textB);
  });
  const result = items.map((li) => {
    const span = li.querySelector(".task-text");
    const checkbox = li.querySelector("input[type='checkbox']");
    return {
      text: span.textContent,
      done: checkbox.checked,
    };
  });
  localStorage.setItem("myList", JSON.stringify(result));
}

function loadFromStorage() {
  const savedList = JSON.parse(localStorage.getItem("myList")) || [];
  savedList.forEach((item) => addListItem(item.text, item.done));
}

function stringToUpperCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
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

  checkbox.addEventListener("change", () => {
    newLi.classList.toggle("done", checkbox.checked);
    list.removeChild(newLi);
    insertSortedItem(newLi, checkbox.checked);
    saveToStorage();
  });

  const mark = document.createElement("span");
  mark.classList.add("checkbox-mark");
  mark.textContent = "✅";

  label.append(checkbox, mark);

  const span = document.createElement("span");
  span.classList.add("task-text");
  span.textContent = stringToUpperCase(text);

  span.addEventListener("click", () => {
    checkbox.checked = !checkbox.checked;
    newLi.classList.toggle("done", checkbox.checked);
    list.removeChild(newLi);
    insertSortedItem(newLi, checkbox.checked);
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

  insertSortedItem(newLi, done);
}

function insertSortedItem(li, done) {
  const items = [...list.children];
  const newText = li.querySelector(".task-text").textContent.toLowerCase();
  let inserted = false;

  for (let item of items) {
    const itemText = item.querySelector(".task-text").textContent.toLowerCase();
    const itemDone = item.classList.contains("done");

    if (!done && itemDone) {
      list.insertBefore(li, item);
      inserted = true;
      break;
    }

    if (done === itemDone) {
      if (newText < itemText) {
        list.insertBefore(li, item);
        inserted = true;
        break;
      }
    }
  }
  if (!inserted) {
    list.append(li);
  }
}

function resortList() {
  const items = [...list.children];
  list.innerHTML = "";
  items.sort((a, b) => {
    const aDone = a.classList.contains("done");
    const bDone = b.classList.contains("done");
    if (aDone !== bDone) {
      return aDone ? 1 : -1;
    }
    const aText = a.querySelector(".task-text").textContent.toLowerCase();
    const bText = b.querySelector(".task-text").textContent.toLowerCase();
    return aText.localeCompare(bText);
  });
  items.forEach((item) => list.appendChild(item));
}

window.addEventListener("DOMContentLoaded", () => {
  loadFromStorage();
});

btn.addEventListener("click", (e) => {
  e.preventDefault();
  const value = input.value.trim();
  if (value !== "") {
    const allLi = list.querySelectorAll("li .task-text");
    let isDuplicate = false;
    for (let span of allLi) {
      if (span.textContent.toLowerCase() === value.toLowerCase()) {
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
  if (e.key === "Enter") {
    e.preventDefault();
    btn.click();
  }
});

clearChecksBtn.addEventListener("click", (e) => {
  e.preventDefault();
  const allCheckboxes = document.querySelectorAll("input[type='checkbox']");
  allCheckboxes.forEach((checkbox) => {
    checkbox.checked = false;
    checkbox.closest("li").classList.remove("done");
  });
  resortList();
  saveToStorage();
});

console.clear();
const input = document.getElementById("taskInput");
const btn = document.getElementById("addBtn");
const list = document.getElementById("taskList");

function saveToStorage() {
  const items = [...list.querySelectorAll("li span")].map(
    (span) => span.textContent
  );
  localStorage.setItem("myList", JSON.stringify(items));
}

function loadFromStorage() {
  const savedList = JSON.parse(localStorage.getItem("myList")) || [];
  savedList.forEach((item) => addListItem(item));
}

window.addEventListener("DOMContentLoaded", () => {
  loadFromStorage();
});

function addListItem(text) {
  const newLi = document.createElement("li");
  newLi.classList.add("list__item");
  const span = document.createElement("span");
  span.textContent = text;
  newLi.append(span);
  list.append(newLi);

  newLi.addEventListener("click", () => {
    newLi.classList.add("hide");
    setTimeout(() => {
      newLi.remove();
      saveToStorage();
    }, 500);
  });
}

btn.addEventListener("click", (e) => {
  e.preventDefault();
  const value = input.value.trim();
  if (value !== "") {
    const allLi = list.querySelectorAll("li span");
    let isDuplicate = false;
    for (let span of allLi) {
      if (span.textContent === value) {
        isDuplicate = true;
        break;
      }
    }
    if (!isDuplicate) {
      addListItem(value);
      saveToStorage();
    }
    input.value = "";
  }
});

input.addEventListener("keydown", e => {
  if (e.key === "Enter") btn.click();
});
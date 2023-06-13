import { signal } from "@preact/signals";
import "../styles/main.css";

const openFile = signal();

const template = document.getElementById("fileRow");
const container = document.getElementById("filesList");

const handleFileClick = (e) => {
  openFile.value = e.target.textContent;
  document.querySelector("#openFileName h2").textContent = openFile.value;
};

const filesData = new Map(
  Object.entries(
    JSON.parse(document.getElementById("filesData").textContent).content_urls
  )
);

filesData.forEach((url, fileName) => {
  const el = template.content.firstElementChild.cloneNode(true);

  el.querySelector(`[data-file="name"]`).textContent = fileName;
  el.querySelector(`[data-file="link"]`).href = `#${url}`;
  el.addEventListener("click", handleFileClick);

  container.appendChild(el);
});

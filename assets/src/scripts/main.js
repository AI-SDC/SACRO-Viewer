import "../styles/main.css";

const filesData = new Map(
  Object.entries(JSON.parse(document.getElementById("filesData").textContent))
);
const template = document.getElementById("fileRow");
const container = document.getElementById("filesList");

filesData.forEach((values, file) => {
  const fileName = values.output.replace(/^.*[\\/]/, "");

  const el = template.content.firstElementChild.cloneNode(true);
  el.querySelector(`[data-file="name"]`).textContent = fileName;
  el.querySelector(`[data-file="link"]`).href = `#${file}`;

  container.appendChild(el);
});

import "../styles/main.css";

const outputs = new Map(
  Object.entries(JSON.parse(document.getElementById("OUTPUTS").textContent))
);
const template = document.getElementById("fileRow");
const container = document.getElementById("filesList");

outputs.forEach((values, file) => {
  const fileName = values.output.replace(/^.*[\\/]/, "");

  const el = template.content.firstElementChild.cloneNode(true);
  el.querySelector(`[data-file="name"]`).textContent = fileName;
  el.querySelector(`[data-file="link"]`).href = `#${file}`;

  container.appendChild(el);
});

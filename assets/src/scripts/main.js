import { signal } from "@preact/signals";
import "../styles/main.css";

const openFile = signal();

const template = document.getElementById("fileRow");
const container = document.getElementById("filesList");

const handleFileClick = (e) => {
  openFile.value = e.target.textContent;
  document.querySelector("#openFileName h2").textContent = openFile.value;
};

const siteData = JSON.parse(document.getElementById("filesData").textContent);
const reviewUrl = siteData.review_url;
const contentUrls = new Map(Object.entries(siteData.content_urls));

contentUrls.forEach((url, fileName) => {
  const el = template.content.firstElementChild.cloneNode(true);

  el.querySelector(`[data-file="name"]`).textContent = fileName;
  el.querySelector(`[data-file="link"]`).href = `#${url}`;
  el.addEventListener("click", handleFileClick);

  container.appendChild(el);
});

function formSetup() {
  const form = document.querySelector("#approveForm");
  const button = form.querySelector(`button[type="submit"]`);
  form.action = reviewUrl;

  button.classList.remove(
    "cursor-not-allowed",
    "bg-slate-300",
    "text-slate-800"
  );
  button.classList.add(
    "bg-blue-600",
    "text-white",
    "hover:bg-blue-700",
    "focus:bg-blue-700",
    "focus:ring-blue-500",
    "focus:ring-offset-white"
  );
  button.removeAttribute("disabled");
}

formSetup();

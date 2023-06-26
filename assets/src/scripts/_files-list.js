import { effect } from "@preact/signals";
import { contentUrls, outputs } from "./_data";
import handleFileClick from "./_file-click";
import { approvedFiles } from "./_signals";

const fileList = () => {
  const template = document.getElementById("fileRow");
  const container = document.getElementById("filesList");

  contentUrls.forEach((url, fileName) => {
    const el = template.content.firstElementChild.cloneNode(true);

    el.querySelector(`[data-file="name"]`).textContent = fileName;
    el.querySelector(`[data-file="link"]`).href = `#${url}`;
    el.id = `list_${fileName}`;

    const metadata = outputs.get(fileName);

    el.addEventListener("click", () => {
      handleFileClick({ fileName, metadata, url });
      const children = [...container.children];
      children.forEach((e) => e.classList.remove("selected"));
      el.classList.add("selected");
    });

    container.appendChild(el);
  });

  effect(() => {
    outputs.forEach((_, name) => {
      const el = container.querySelector(`#list_${name}`);
      if (approvedFiles.value.includes(name)) {
        el.classList.add("approved");
      } else {
        el.classList.remove("approved");
      }
    });
  });
};

export default fileList;

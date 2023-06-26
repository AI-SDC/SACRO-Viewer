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

    // toggle selected state for the file list
    el.addEventListener("click", () => {
      handleFileClick({ fileName, metadata, url });
      const children = [...container.children];
      children.forEach((e) => e.classList.remove("selected"));
      el.classList.add("selected");
    });

    container.appendChild(el);
  });

  // toggle css changes on state change
  effect(() => {
    outputs.forEach((_, name) => {
      const el = container.querySelector(`#list_${name}`);
      const state = approvedFiles.value.get(name);
      if (state === null) {
        el.classList.add("state_unknown");
        el.classList.remove("state_approved", "state_rejected");
      } else if (state) {
        el.classList.add("state_approved");
        el.classList.remove("state_unknown", "state_rejected");
      } else {
        el.classList.add("state_rejected");
        el.classList.remove("state_unknown", "state_approved");
      }
    });
  });
};

export default fileList;

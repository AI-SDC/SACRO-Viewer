import { effect } from "@preact/signals";
import { contentUrls, outputs } from "./_data";
import handleFileClick from "./_file-click";
import { approvedFiles } from "./_signals";

const fileList = () => {
  const container = document.getElementById("filesList");

  // add click handler to each list item
  contentUrls.forEach((url, fileName) => {
    const el = document.getElementById(`list_${fileName}`)
    const metadata = outputs.get(fileName);

    // toggle selected state for the file list
    el.addEventListener("click", () => {
      handleFileClick({ fileName, metadata, url });

      // clear selected class from all items in the list
      [...container.children].forEach((e) => e.classList.remove("selected"));

      // set selected class on this list item
      el.classList.add("selected");
    });
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

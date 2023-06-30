import { effect } from "@preact/signals";
import { outputs } from "./_data";
import handleFileClick from "./_file-click";
import { approvedFiles } from "./_signals";

const fileList = () => {
  const container = document.getElementById("filesList");
  const children = [...container.children];

  // add click handler to each list item
  children.forEach((el) => {
    const fileName = el.id;
    const metadata = outputs.get(fileName);

    // get the URL and strip off the leading #
    const url = el.firstElementChild.getAttribute("href").replace("#", "");

    // toggle selected state for the file list
    el.addEventListener("click", () => {
      handleFileClick({ fileName, metadata, url });

      // clear selected class from all items in the list
      children.forEach((e) => e.classList.remove("selected"));

      // set selected class on this list item
      el.classList.add("selected");
    });
  });

  // toggle css changes on state change
  effect(() => {
    outputs.forEach((_, name) => {
      const el = container.querySelector(`#${name}`);
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

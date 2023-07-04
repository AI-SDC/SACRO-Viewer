import { effect } from "@preact/signals";
import { outputs } from "./_data";
import fileClick from "./_file-click";
import { approvedFiles } from "./_signals";

const fileList = () => {
  const container = document.getElementById("filesList");
  const fileListItems = [...container.querySelectorAll("li")];

  // add click handler to each list item
  fileListItems.forEach((el) => {
    const fileName = el.getAttribute("data-file-name");
    const metadata = outputs[fileName];

    // get the URL and strip off the leading #
    const url = el.querySelector("a").getAttribute("href").replace("#/", "");

    // toggle selected state for the file list
    el.addEventListener("click", () => {
      fileClick({ fileName, metadata, url });

      // clear selected class from all items in the list
      fileListItems.forEach((e) => e.classList.remove("bg-blue-50"));

      // set selected class on this list item
      el.classList.add("bg-blue-50");
    });

    // toggle icon changes on state change
    effect(() => {
      Object.keys(outputs).forEach((file) => {
        if (fileName === file) {
          const state = approvedFiles.value[file]?.approved;

          if (state === null) {
            el.setAttribute("data-review-status", "none");
          } else {
            el.setAttribute("data-review-status", state);
          }
        }
      });

      return null;
    });
  });
};

export default fileList;

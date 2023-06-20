import { contentUrls, outputs } from "./_data";
import handleFileClick from "./_file-click";

const fileList = () => {
  const template = document.getElementById("fileRow");
  const container = document.getElementById("filesList");

  contentUrls.forEach((url, fileName) => {
    const el = template.content.firstElementChild.cloneNode(true);

    el.querySelector(`[data-file="name"]`).textContent = fileName;
    el.querySelector(`[data-file="link"]`).href = `#${url}`;

    let metadata;
    outputs.forEach((outputContent, outputFileName) => {
      if (outputFileName === fileName) {
        metadata = outputContent;
      }
    });

    el.addEventListener("click", () =>
      handleFileClick({ fileName, metadata, url })
    );

    container.appendChild(el);
  });
};

export default fileList;

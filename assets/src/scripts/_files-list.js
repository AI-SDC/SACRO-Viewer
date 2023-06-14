import { contentUrls, outputs } from "./_data";
import fileLoader from "./_file-loader";
import { openFile } from "./_signals";
import { csvStringToTable, getFileExt } from "./_utils";

const fileList = () => {
  const template = document.getElementById("fileRow");
  const container = document.getElementById("filesList");

  const handleFileClick = async ({ fileName, metadata, url }) => {
    openFile.value = {
      fileName,
      ext: getFileExt(metadata.output),
      url,
      metadata,
    };

    document.querySelector("#openFileName h2").textContent =
      openFile.value.fileName;

    const data = await fileLoader(openFile);

    document.getElementById("fileMetadata").innerHTML = `
      <ul>
        <li><strong>Summary:</strong> ${JSON.stringify(
          metadata.summary
        ).substring(1, metadata.summary.length + 1)}</li>
        <li><strong>Comments:</strong> ${JSON.stringify(
          metadata.comments
        ).substring(1, metadata.comments.length + 1)}</li>
      </ul>
    `;

    document.getElementById("fileContent").classList.remove("hidden");

    if (data) {
      csvStringToTable(data, document.getElementById("fileContent"));
      document.getElementById("fileContent").classList.add("overflow-x-scroll");
    } else {
      document.getElementById("fileContent").textContent =
        "This file cannot be displayed";
    }
  };

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

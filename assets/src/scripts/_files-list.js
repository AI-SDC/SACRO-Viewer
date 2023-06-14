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

    const summaryItems = metadata.summary
      .split("; ")
      .filter((i) => i !== " " && i.length)
      .map((i) => `<li>${i}</li>`)
      .join("");
    const commentItems = metadata.comments
      .split(", ")
      .filter((i) => i !== " " && i.length)
      .map((i) => `<li>${i}</li>`)
      .join("");

    document.getElementById("fileMetadata").innerHTML = `
      <ul>
        <li class="mb-2"><strong>Summary:</strong>
          <ul>${summaryItems}</ul>
        </li>
        ${
          metadata.comments
            ? `
              <li><strong>Comments:</strong>
                <ul>${commentItems}</ul>
              </li>
            `
            : ""
        }
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

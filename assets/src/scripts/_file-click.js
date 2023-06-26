import fileLoader from "./_file-loader";
import { approvedFiles, openFile } from "./_signals";
import { csvStringToTable, getFileExt, isCsv, isImg } from "./_utils";

const fileContentElement = document.getElementById("fileContent");

const splitTextToList = ({ splitter, text }) =>
  text
    .split(splitter)
    .filter((i) => i !== " " && i.length)
    .map((i) => `<li>${i}</li>`)
    .join("");

const createCsvTableElement = (data) => {
  csvStringToTable(data, fileContentElement);
  fileContentElement.classList.add("overflow-x-scroll");
};

const createImageElement = (data) => {
  fileContentElement.innerHTML = "";
  fileContentElement.classList.remove("overflow-x-scroll");

  const img = document.createElement("img");
  img.src = data;
  fileContentElement.appendChild(img);
};

const invalidFileElement = () => {
  fileContentElement.classList.remove("overflow-x-scroll");

  fileContentElement.textContent = "This file cannot be displayed";
};

const fileClick = async ({ fileName, metadata, url }) => {
  // Set the file values
  openFile.value = {
    fileName,
    ext: getFileExt(metadata.output),
    url,
    metadata,
  };

  // Set the title
  document.querySelector("#openFileName h2").textContent =
    openFile.value.fileName;

  // Set the metadata
  const fileMetadata = document.getElementById("fileMetadata");
  fileMetadata.innerHTML = `
    <ul>
      <li><strong>Summary:</strong>
        <ul>${splitTextToList({
          splitter: "; ",
          text: metadata.summary,
        })}</ul>
      </li>
      ${
        metadata.comments
          ? `
            <li class="mt-2"><strong>Comments:</strong>
              <ul>${splitTextToList({
                splitter: ", ",
                text: metadata.comments,
              })}</ul>
            </li>
          `
          : ""
      }
      ${
        isImg(openFile.value.ext)
          ? `
            <ul class="mt-2">
              <li>
                <strong>Status:</strong>
                <ul>
                  <li class="text-red-800 font-semibold py-0.5 px-1 bg-red-50 inline-block">
                    This output has not been checked by ACRO
                  </li>
                </ul>
              </li>
            </ul>`
          : ""
      }
      <li>
        <ul class="mt-2">
          <li>
            <strong>Review:</strong>
            <ul>
              <button class="inline-flex items-center justify-center rounded-md shadow-sm transition-buttons duration-200 px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 focus:bg-blue-700 focus:ring-blue-500 focus:ring-offset-white">Approve for Release</button>
            </ul>
          </li>
        </ul>
      </li>
    </ul>
  `;

  const button = fileMetadata.querySelector("button");
  const toggleButton = () => {
    if (approvedFiles.value.includes(fileName)) {
      button.textContent = "Remove from Release";
    } else {
      button.textContent = "Approve for Release";
    }
  };

  // set initial state of button
  toggleButton();

  button.addEventListener("click", () => {
    if (approvedFiles.value.includes(fileName)) {
      approvedFiles.value = approvedFiles.value.filter((o) => o !== fileName);
    } else {
      approvedFiles.value = approvedFiles.value.concat([fileName]);
    }
    toggleButton();
  });

  if (isCsv(openFile.value.ext)) {
    const data = await fileLoader(openFile);
    createCsvTableElement(data);
  } else if (isImg(openFile.value.ext)) {
    createImageElement(openFile.value.url);
  } else {
    invalidFileElement();
  }

  return fileContentElement.classList.remove("hidden");
};

export default fileClick;

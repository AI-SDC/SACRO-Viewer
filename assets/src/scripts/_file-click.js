import fileLoader from "./_file-loader";
import { openFile } from "./_signals";
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
  document.getElementById("fileMetadata").innerHTML = `
    <ul>
      <li class="mb-2"><strong>Summary:</strong>
        <ul>${splitTextToList({
          splitter: "; ",
          text: metadata.summary,
        })}</ul>
      </li>
      ${
        metadata.comments
          ? `
            <li><strong>Comments:</strong>
              <ul>${splitTextToList({
                splitter: ", ",
                text: metadata.comments,
              })}</ul>
            </li>
          `
          : ""
      }
    </ul>
  `;

  if (isCsv(openFile.value.url)) {
    const data = await fileLoader(openFile);
    createCsvTableElement(data);
  } else if (isImg(openFile.value.url)) {
    createImageElement(openFile.value.url);
  } else {
    invalidFileElement();
  }

  return fileContentElement.classList.remove("hidden");
};

export default fileClick;

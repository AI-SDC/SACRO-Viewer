import fileLoader from "./_file-loader";
import { openFile, setReviewState } from "./_signals";
import { csvStringToTable, getFileExt, isCsv, isImg } from "./_utils";

const fileContentElement = document.getElementById("fileContent");

const toList = ({ list }) => list.map((i) => `<li>${i}</li>`).join("");

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
    ext: getFileExt(metadata.path),
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
        <ul>${metadata.summary}</ul>
      </li>
      ${
        metadata.comments
          ? `
            <li class="mt-2"><strong>Comments:</strong>
              <ul>${toList({ list: metadata.comments })}</ul>
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
              <button class="approve inline-flex items-center justify-center rounded-md shadow-sm transition-buttons duration-200 px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 focus:bg-blue-700 focus:ring-blue-500 focus:ring-offset-white" data-cy="approve">Approve</button>
              <button class="reset inline-flex items-center justify-center rounded-md shadow-sm transition-buttons duration-200 px-4 py-2 text-sm font-medium bg-slate-600 text-white hover:bg focus:bg-slate-500 focus:ring-slate-400 focus:ring-offset-white">Reset</button>
              <button class="reject  inline-flex items-center justify-center rounded-md shadow-sm transition-buttons duration-200 px-4 py-2 text-sm font-medium bg-red-600 text-white hover:bg-red-700 focus:bg-red-700 focus:ring-red-500 focus:ring-offset-white">Reject</button>
            </ul>
          </li>
        </ul>
      </li>
    </ul>
  `;

  const approveButton = fileMetadata.querySelector("button.approve");
  const resetButton = fileMetadata.querySelector("button.reset");
  const rejectButton = fileMetadata.querySelector("button.reject");

  approveButton.addEventListener("click", () => setReviewState(fileName, true));
  resetButton.addEventListener("click", () => setReviewState(fileName, null));
  rejectButton.addEventListener("click", () => setReviewState(fileName, false));

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

/* eslint-disable no-param-reassign */
import fileLoader from "./_file-loader";
import tableBuilder from "./_table-builder";

export const fileContentElement = document.getElementById("fileContent");

export async function createTableElement(file) {
  const data = await fileLoader(file);

  tableBuilder({
    csvString: data,
    el: fileContentElement,
    outcome: file.value.metadata.outcome,
  });

  fileContentElement.classList.add("overflow-x-scroll");
}

export function createImageElement(data) {
  fileContentElement.innerHTML = "";
  fileContentElement.classList.remove("overflow-x-scroll");

  const img = document.createElement("img");
  img.src = data;
  fileContentElement.appendChild(img);
}

export function invalidFileElement() {
  fileContentElement.classList.remove("overflow-x-scroll");

  fileContentElement.textContent =
    "This type of file cannot be displayed. It should be reviewed outside of this application";
}

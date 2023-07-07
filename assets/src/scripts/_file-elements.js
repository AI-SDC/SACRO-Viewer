/* eslint-disable no-param-reassign */
import fileLoader from "./_file-loader";
import tableBuilder from "./_table-builder";

export async function createTableElement(el, ext, url, outcome) {
  const data = await fileLoader(ext, url);

  el.classList.add("overflow-x-scroll");

  tableBuilder({
    csvString: data,
    el,
    outcome,
  });
}

export function createImageElement(el, url) {
  const img = document.createElement("img");
  img.src = url;
  el.appendChild(img);
}

export function invalidFileElement(el) {
  el.textContent =
    "This type of file cannot be displayed. It should be reviewed outside of this application";
}

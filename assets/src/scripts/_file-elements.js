/* eslint-disable no-param-reassign */
import fileLoader from "./_file-loader";
import tableBuilder from "./_table-builder";

/**
 * @param {Node} el
 * @param {string} ext
 * @param {string} url
 * @param {object} outcome
 */
export async function createTableElement(el, ext, url, outcome) {
  const data = await fileLoader(ext, url);

  el.classList.add("overflow-x-auto");

  tableBuilder({
    csvString: data,
    el,
    outcome,
  });
}

/**
 * @param {Node} el
 * @param {string} url
 */
export function createImageElement(el, url) {
  const img = document.createElement("img");
  img.src = url;
  el.appendChild(img);
}

/**
 *
 * @param {Node} el
 */
export function invalidFileElement(el) {
  el.textContent =
    "This type of file cannot be displayed. It should be reviewed outside of this application";
}

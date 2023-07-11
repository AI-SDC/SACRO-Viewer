/* eslint-disable no-param-reassign */
import fileLoader from "./_file-loader";
import tableBuilder from "./_table-builder";

/**
 * @param {HTMLElement} el
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
 * @param {HTMLElement} el
 * @param {string} url
 */
export function createImageElement(el, url) {
  const img = document.createElement("img");
  img.src = url;
  el.appendChild(img);
}

/**
 * @param {HTMLElement} el - Append the text to this element
 * @param {string} ext - File type extension
 * @param {string} url - Valid URL for the file location
 */
export async function createTextElement(el, ext, url) {
  const data = await fileLoader(ext, url);

  const textEl = document.createElement("pre");
  textEl.classList.add("break-words", "text-sm", "whitespace-pre-line");
  textEl.innerText = data;

  el.appendChild(textEl);
}

/**
 *
 * @param {HTMLElement} el
 */
export function invalidFileElement(el) {
  el.textContent =
    "This type of file cannot be displayed. It should be reviewed outside of this application";
}

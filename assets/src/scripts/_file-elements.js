/* eslint-disable no-param-reassign */
import fileLoader from "./_file-loader";
import tableBuilder from "./_table-builder";

/**
 * Create a table element from a link to a CSV file
 * @param {HTMLElement} el - Append the table to this element
 * @param {string} ext - File type extension
 * @param {string} url - Valid URL for the file location
 * @param {object} outcome - ACRO outcome object for the file specified
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
 * Create an image element
 * @param {HTMLElement} el - Append the image to this element
 * @param {string} url - Valid URL for the image location
 */
export function createImageElement(el, url) {
  const img = document.createElement("img");
  img.src = url;
  el.appendChild(img);
}

/**
 * Create a preformatted plaintext element
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
 * Display text confirming the requested file type cannot be previewed
 * @param {HTMLElement} el - Append the text to this element
 */
export function invalidFileElement(el) {
  el.textContent =
    "This type of file cannot be displayed. It should be reviewed outside of this application";
}

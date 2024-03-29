/* eslint-disable no-param-reassign */
import hljs from "highlight.js";
import fileLoader from "./_file-loader";
import tableBuilder from "./_table-builder";
import "highlight.js/styles/github.css";
import { highlightJsName } from "./_utils";

/**
 * @param {Object} params
 * @param {HTMLElement} params.element
 * @param {string} params.fileExtension
 * @param {string} params.fileUrl
 * @param {object} params.outcome
 * @param {string} params.fileIndex
 */
export async function createTableElement({
  element,
  fileExtension,
  fileUrl,
  outcome,
  fileIndex,
}) {
  const data = await fileLoader(fileExtension, fileUrl);

  tableBuilder({
    csvString: data,
    el: element,
    outcome,
    fileIndex,
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
 * @param {HTMLElement} el - Append the text to this element
 * @param {string} ext - File type extension
 * @param {string} url - Valid URL for the file location
 */
export async function createTextElement(el, ext, url) {
  const data = await fileLoader(ext, url);

  const textEl = document.createElement("code");
  textEl.classList.add(
    "break-words",
    "text-sm",
    `language-${highlightJsName(ext)}`
  );
  textEl.innerHTML = data;

  const preEl = document.createElement("pre");
  preEl.appendChild(textEl);
  el.appendChild(preEl);

  hljs.highlightAll();
}

/**
 * @param {HTMLElement} el - Append the JSON to this element
 * @param {string} ext - File type extension
 * @param {string} url - Valid URL for the file location
 */
export async function createCodeElement(el, ext, url) {
  const data = await fileLoader(ext, url);

  const codeEl = document.createElement("code");
  codeEl.classList.add("break-words", "text-sm", "language-json");
  codeEl.innerHTML = JSON.stringify(JSON.parse(JSON.stringify(data)), null, 2);

  const preEl = document.createElement("pre");
  preEl.appendChild(codeEl);
  el.appendChild(preEl);

  hljs.highlightAll();
}

/**
 *
 * @param {Node} el
 */
export function invalidFileElement(el) {
  el.textContent =
    "This type of file cannot be displayed. It should be reviewed outside of this application";
}

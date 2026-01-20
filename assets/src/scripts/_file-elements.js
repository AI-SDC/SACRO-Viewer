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

/**
 * Create an embedded viewer for PDF and document files
 * @param {HTMLElement} el - Append the viewer to this element
 * @param {string} url - Valid URL for the file location
 * @param {string} ext - File extension
 */
export function createDocumentElement(el, url, ext) {
  const container = document.createElement("div");
  container.classList.add("document-preview-container");

  if (ext.toLowerCase() === "pdf") {
    // For PDFs, use an embed element
    const embed = document.createElement("embed");
    embed.src = url;
    embed.type = "application/pdf";
    embed.style.width = "100%";
    embed.style.height = "600px";
    embed.style.border = "1px solid #ddd";
    container.appendChild(embed);
  } else {
    // For DOC/DOCX files, show a message with download link
    const message = document.createElement("div");
    message.classList.add("p-4", "bg-blue-50", "border", "border-blue-200", "rounded");
    message.innerHTML = `
      <p class="text-sm text-gray-700 mb-2">
        <strong>Document files cannot be previewed in the browser.</strong>
      </p>
      <p class="text-sm text-gray-600">
        Please use the "Open file" button above to download and view this ${ext.toUpperCase()} file in your preferred application.
      </p>
    `;
    container.appendChild(message);
  }

  el.appendChild(container);
}

import htm from "htm";
import vhtml from "vhtml";

export const html = htm.bind(vhtml);

/**
 *
 * @param {string} str - file path
 * @returns {string} - file extension or blank string
 */
export function getFileExt(str) {
  return str.split(`.`).pop() || "";
}

/**
 *
 * @param {string} ext - file extension
 * @returns {boolean} - true/false
 */
export function isCsv(ext) {
  return ext.toLowerCase() === "csv";
}

/**
 *
 * @param {string} ext - file extension
 * @returns {boolean} - true/false
 */
export function isImg(ext) {
  return ["gif", "jpg", "jpeg", "png", "svg"].includes(ext.toLowerCase());
}

/**
 * Confirm if file is .txt
 * @param {string} ext - file extension
 * @returns {boolean} - true/false
 */
export function isTxt(ext) {
  return ext.toLowerCase() === "txt";
}

/**
 *
 * @param {string} ext - file extension
 * @returns {boolean} - true/false
 */
export function canDisplay(ext) {
  return isCsv(ext) || isImg(ext) || isTxt(ext);
}

/**
 * Capitalise the first letter of a string
 * @param {string} s - string to capitalise first letter
 * @returns {string} - capitalised string
 */
export function capitalise(s) {
  return (s && s[0].toUpperCase() + s.slice(1)) || "";
}

/**
 * Set HTML to an element identified by the SACRO data attribute
 * @param {string} element - data attribute name used in the template
 * @param {string} code - HTML code to replace the innerHTML of the element
 */
export function setElementHTML(element, code) {
  /** @type {HTMLElement|null} */
  const el = document.querySelector(`[data-sacro-el="${element}"]`);
  if (el) el.innerHTML = code;
}

/**
 * Assign a text string to an HTML element identified by the SACRO
 * data attribute
 * @param {string} element - data attribute name used in the template
 * @param {string} text - text to be replaced
 */
export function setElementText(element, text) {
  /** @type {HTMLElement|null} */
  const el = document.querySelector(`[data-sacro-el="${element}"]`);
  if (el) el.innerText = text;
}

/**
 * Show or hide the parent element of a SACRO element
 * @param {string} element - data attribute name used in the template
 * @param {string} parent - valid CSS selector string
 * @param {('show'|'hide')} setState - set if the element is shown or hidden
 */
export function toggleParentVisibility(element, parent, setState) {
  const parentEl = document
    .querySelector(`[data-sacro-el="${element}"]`)
    ?.closest(parent);

  if (parentEl && setState === "show") {
    parentEl.removeAttribute("hidden");
    parentEl.classList.remove("hidden");
  }

  if (parentEl && setState === "hide") {
    parentEl.setAttribute("hidden", true);
    parentEl.classList.add("hidden");
  }
}

/**
 * Convert date string to standard en-GB format
 * @param {string} date - valid ISO date string
 * @returns {string} - formatted date
 */
export function formatDate(date) {
  const jsDate = new Date(date);

  return jsDate.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });
}

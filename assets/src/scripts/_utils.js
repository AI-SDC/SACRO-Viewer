import htm from "htm";
import vhtml from "vhtml";
import { outputComments } from "./_signals";

export const html = htm.bind(vhtml);

export const getFileExt = (str) => str.split(`.`).pop();

export const isCsv = (ext) => ext.toLowerCase() === "csv";

export const isImg = (ext) =>
  ["gif", "jpg", "jpeg", "png", "svg"].includes(ext.toLowerCase());

/**
 * Confirm if file is .txt
 * @param {string} ext - file extension
 * @returns {boolean}
 */
export function isTxt(ext) {
  return ext.toLowerCase() === "txt";
}

/**
 * Confirm if file is .json
 * @param {string} ext - file extension
 * @returns {boolean}
 */
export function isJson(ext) {
  return ext.toLowerCase() === "json";
}

/**
 * Confirm if file the file is allowed to be displayed
 * @param {string} ext - file extension
 * @returns {boolean}
 */
export function canDisplay(ext) {
  return isCsv(ext) || isImg(ext) || isTxt(ext) || isJson(ext);
}

/**
 * Capitalise the first letter of a string
 *
 * @param {string} s - string to capitalise first letter
 * @returns {string} - capitalised string
 */
export function capitalise(s) {
  return (s && s[0].toUpperCase() + s.slice(1)) || "";
}

/**
 * Set HTML to an element identified by the SACRO data attribute
 *
 * @param {string} element - data attribute name used in the template
 * @param {string} code - HTML code to replace the innerHTML of the element
 */
export function setElementHTML(element, code) {
  document.querySelector(
    `[data-sacro-el="${element}"]`
  ).innerHTML = html`${code}`;
}

/**
 * Assign a text string to an HTML element identified by the SACRO
 * data attribute
 *
 * @param {string} element - data attribute name used in the template
 * @param {string} text - text to be replaced
 */
export function setElementText(element, text) {
  document.querySelector(`[data-sacro-el="${element}"]`).innerText = text;
}

/**
 * Show or hide the parent element of a SACRO element
 *
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
 * @param {Date} date - valid ISO date string
 * @returns string
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

/**
 * Given an output name, find out if the user has entered a comment
 * @param {string} outputName - output name
 * @returns {boolean} - comment status
 */
export function hasComment(outputName) {
  return outputComments.value[outputName].trim() !== "";
}

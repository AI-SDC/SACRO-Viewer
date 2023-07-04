import htm from "htm";
import vhtml from "vhtml";

export const html = htm.bind(vhtml);

export const getFileExt = (str) => str.split(`.`).pop();

export const isCsv = (ext) => ext.toLowerCase() === "csv";

export const isImg = (ext) =>
  ["gif", "jpg", "jpeg", "png", "svg"].includes(ext.toLowerCase());

export const canDisplay = (ext) => isCsv(ext) || isImg(ext);

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
 * @param {Node} parent - parent element node name to find
 * @param {('show'|'hide')} setState - set if the element is shown or hidden
 */
export function toggleParentVisibility(element, parent, setState) {
  const parentEl = document
    .querySelector(`[data-sacro-el="${element}"]`)
    .closest(parent);

  if (setState === "show") {
    parentEl.removeAttribute("hidden");
    parentEl.classList.remove("hidden");
  }

  if (setState === "hide") {
    parentEl.setAttribute("hidden", true);
    parentEl.classList.add("hidden");
  }
}

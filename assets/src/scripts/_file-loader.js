import { canDisplay, isCsv, isTxt } from "./_utils";

/**
 * Load the contents of a file, if it can be loaded
 * @param {string} ext - File type extension
 * @param {string} url - URL string
 * @returns {Promise} - return a JS promise
 */
export default async function fileLoader(ext, url) {
  const response = await fetch(url);

  if (!response.ok) {
    // eslint-disable-next-line no-console
    console.error(`An error has occurred: ${response.status}`);
    return null;
  }

  let res;

  if (canDisplay(ext)) {
    if (isCsv(ext) || isTxt(ext)) {
      res = await response.text();
    }
  }

  return res;
}

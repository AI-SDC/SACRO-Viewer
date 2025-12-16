import { canDisplay, isCsv, isJson, isTxt } from "./_utils";

async function fileLoader(ext, url) {
  const response = await fetch(url);

  if (!response.ok) {
    // eslint-disable-next-line no-console
    console.error(`An error has occurred: ${response.status}`);
    return null;
  }

  let res;

  if (canDisplay(ext)) {
    if (isCsv(ext) || isTxt(ext)) {
      return response.text();
    }

    if (isJson(ext)) {
      return response.json();
    }
  }

  return res;
}

export default fileLoader;

import { canDisplay, isCsv } from "./_utils";

async function fileLoader(ext, url) {
  const response = await fetch(url);

  if (!response.ok) {
    // eslint-disable-next-line no-console
    console.error(`An error has occurred: ${response.status}`);
    return null;
  }

  let res;

  if (canDisplay(ext)) {
    if (isCsv(ext)) {
      res = await response.text();
    }
  }

  return res;
}

export default fileLoader;

import { canDisplay, isCsv, isImg } from "./_utils";

async function fileLoader(openFile) {
  if (!openFile) return null;
  const response = await fetch(openFile.value.url);

  if (!response.ok) {
    // eslint-disable-next-line no-console
    console.error(`An error has occurred: ${response.status}`);
    return null;
  }

  let res;

  if (canDisplay(openFile.value.ext)) {
    if (isCsv(openFile.value.ext)) {
      res = await response.text();
    }
  }

  return res;
}

export default fileLoader;

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

  if (canDisplay(openFile.value.url)) {
    console.log(openFile.value.url);

    if (isCsv(openFile.value.url)) {
      res = await response.text();
    }

    if (isImg(openFile.value.url)) {
      const blob = await response.blob();
      res = URL.createObjectURL(blob);
    }
  }

  return res;
}

export default fileLoader;

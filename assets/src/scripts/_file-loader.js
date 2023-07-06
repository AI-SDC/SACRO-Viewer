import { canDisplay, isCsv } from "./_utils";

async function fileLoader(openOutput) {
  if (!openOutput) return null;
  const response = await fetch(openOutput.value.url);

  if (!response.ok) {
    // eslint-disable-next-line no-console
    console.error(`An error has occurred: ${response.status}`);
    return null;
  }

  let res;

  if (canDisplay(openOutput.value.ext)) {
    if (isCsv(openOutput.value.ext)) {
      res = await response.text();
    }
  }

  return res;
}

export default fileLoader;

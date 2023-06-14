async function fileLoader(openFile) {
  if (!openFile) return null;
  const response = await fetch(openFile.value.url);

  if (!response.ok) {
    console.error(`An error has occurred: ${response.status}`);
    return null;
  }

  let res;

  if (openFile.value.ext === "csv") {
    res = await response.text();
  }

  return res;
}

export default fileLoader;

const getOutputDataNode = document.getElementById("outputData");
const outputs = getOutputDataNode?.textContent
  ? JSON.parse(getOutputDataNode.textContent)
  : {};

export default outputs;

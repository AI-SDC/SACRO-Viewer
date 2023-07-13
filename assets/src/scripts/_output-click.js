import {
  createCodeElement,
  createImageElement,
  createTableElement,
  createTextElement,
  invalidFileElement,
} from "./_file-elements";
import setFormState from "./_form-state";
import {
  setAcroStatus,
  setCreatedAtDate,
  setOutputTitle,
  setOutputType,
  setResearcherComments,
} from "./_set-metadata";
import { openOutput } from "./_signals";
import { getFileExt, isCsv, isImg, isJson, isTxt } from "./_utils";

export default async function outputClick({ outputName, metadata }) {
  // Set the file values
  openOutput.value = {
    outputName,
    metadata,
  };

  setOutputTitle(outputName);
  setCreatedAtDate(openOutput.value.metadata.timestamp);
  setOutputType(
    openOutput.value.metadata.properties.method,
    openOutput.value.metadata.type
  );
  setAcroStatus(openOutput.value.metadata.summary);
  setResearcherComments(openOutput.value.metadata.comments);
  setFormState(openOutput.value.outputName);

  // Clear existing content
  const filePreviewContainer = document.getElementById("filePreviewContainer");
  filePreviewContainer.innerHTML = "";

  const filePreviewTemplate = document.querySelector(
    `[data-sacro-el="file-preview-template"]`
  );

  const filesCount = Object.keys(openOutput.value.metadata.files).length;

  // only attempt to render outcome cells if there is a single output file
  const outcome = filesCount === 1 ? openOutput.value.metadata.outcome : {};

  Object.entries(openOutput.value.metadata.files).map(([i, filedata]) => {
    const path = filedata.name;
    const { url } = filedata;
    const ext = getFileExt(path);
    const newFilesContainer =
      filePreviewTemplate.content.firstElementChild.cloneNode(true);

    newFilesContainer.dataset.sacroEl = `file-preview-${i}`;

    const filePreviewTitle = newFilesContainer.querySelector(
      `[data-sacro-el="file-preview-template-title"]`
    );
    const filePreviewLink = newFilesContainer.querySelector(
      `[data-sacro-el="file-preview-template-link"]`
    );
    const filePreviewContent = newFilesContainer.querySelector(
      `[data-sacro-el="file-preview-template-content"]`
    );

    filePreviewTitle.innerText = path;
    filePreviewLink.setAttribute("href", url);

    if (isCsv(ext)) {
      createTableElement(filePreviewContent, ext, url, outcome);
    } else if (isImg(ext)) {
      createImageElement(filePreviewContent, url);
    } else if (isTxt(ext)) {
      createTextElement(filePreviewContent, ext, url);
    } else if (isJson(ext)) {
      createCodeElement(filePreviewContent, ext, url);
    } else {
      invalidFileElement(filePreviewContent);
    }

    return filePreviewContainer.appendChild(newFilesContainer);
  });
}

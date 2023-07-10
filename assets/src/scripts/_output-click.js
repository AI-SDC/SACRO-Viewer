import { btnStyles, setButtonActive } from "./_buttons";
import {
  createImageElement,
  createTableElement,
  invalidFileElement,
} from "./_file-elements";
import {
  setAcroStatus,
  setCreatedAtDate,
  setOutputTitle,
  setOutputType,
  setResearcherComments,
} from "./_set-metadata";
import {
  approvedOutputs,
  openOutput,
  outputComments,
  setComment,
  setReviewState,
} from "./_signals";
import {
  getFileExt,
  html,
  isCsv,
  isImg,
  toggleParentVisibility,
} from "./_utils";

function enableButton(button) {
  if (!button.disabled) return;

  button.disabled = false; // eslint-disable-line no-param-reassign
  btnStyles.disabled.split(" ").map((style) => button.classList.remove(style));
  btnStyles.notDisabled.split(" ").map((style) => button.classList.add(style));
  button.setAttribute("title", "");
}

function disableButton(button) {
  if (button.disabled) return;

  button.disabled = true; // eslint-disable-line no-param-reassign
  btnStyles.notDisabled
    .split(" ")
    .map((style) => button.classList.remove(style));
  btnStyles.disabled.split(" ").map((style) => button.classList.add(style));
  button.setAttribute("title", "You must enter a comment first");
}

function setButtonState(button, enableOnEmpty) {
  // we know the comment is empty here so now we only have to care about the
  // value of enableOnEmpty to drive enable/disable
  if (enableOnEmpty) {
    enableButton(button);
  } else {
    disableButton(button);
  }
}

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

  /**
   * Set up the review form
   */
  toggleParentVisibility("outputDetailsReviewForm", "div", "show");

  const outputMetadata = document.getElementById("outputMetadata");

  outputMetadata.innerHTML = html`
    <div>
      <div class="flex flex-row">
        <button
          class="${btnStyles.default} ${approvedOutputs.value[outputName]
            .approved === true
            ? btnStyles.success
            : btnStyles.successOutline} rounded-l-md"
          data-sacro-el="outputDetailsBtnApprove"
          data-cy="approve"
        >
          Approve
        </button>
        <button
          class="${btnStyles.default} ${btnStyles.secondaryOutline} ${btnStyles.notDisabled} border-x-0"
          data-sacro-el="outputDetailsBtnReset"
        >
          Reset
        </button>
        <button
          class="${btnStyles.default} ${approvedOutputs.value[outputName]
            .approved === false
            ? btnStyles.warning
            : btnStyles.warningOutline} ${btnStyles.notDisabled} rounded-r-md"
          data-sacro-el="outputDetailsBtnReject"
        >
          Reject
        </button>
      </div>
      <label
        class="mt-2 inline-block font-semibold text-slate-900 cursor-pointer"
        for="comments"
      >
        Review comments on ${outputName}:
      </label>
      <textarea
        class="
          comments
          mt-1 mb-2 block w-full rounded-md border-slate-300 text-slate-900 shadow-sm resize-none
          sm:text-sm
          focus:border-oxford-500 focus:ring-oxford-500
          invalid:border-bn-ribbon-600 invalid:ring-bn-ribbon-600 invalid:ring-1
        "
        data-sacro-el="outputDetailsTextareaComments"
        name="comments"
        id="comments"
        type="text"
      >
${outputComments.value[outputName]}</textarea
      >
    </div>
  `;

  const approveButton = outputMetadata.querySelector(
    `[data-sacro-el="outputDetailsBtnApprove"]`
  );
  const resetButton = outputMetadata.querySelector(
    `[data-sacro-el="outputDetailsBtnReset"]`
  );
  const rejectButton = outputMetadata.querySelector(
    `[data-sacro-el="outputDetailsBtnReject"]`
  );
  const commentInput = outputMetadata.querySelector(
    `[data-sacro-el="outputDetailsTextareaComments"]`
  );

  // set initial state for approve/reject buttons
  setButtonState(approveButton, metadata.status === "pass");
  setButtonState(rejectButton, metadata.status === "fail");

  approveButton.addEventListener("click", () => {
    setReviewState(outputName, true);
    setButtonActive(approveButton, "success", true);
    setButtonActive(rejectButton, "warning", false);
  });

  resetButton.addEventListener("click", () => {
    setReviewState(outputName, null);
    setButtonActive(approveButton, "success", false);
    setButtonActive(rejectButton, "warning", false);
  });

  rejectButton.addEventListener("click", () => {
    setReviewState(outputName, false);
    setButtonActive(rejectButton, "warning", true);
    setButtonActive(approveButton, "success", false);
  });

  commentInput.addEventListener("keyup", (e) => {
    setComment(outputName, e.target.value);

    if (outputComments.value[outputName].trim() !== "") {
      // when the comment isn't empty we can enable our buttons and move on
      enableButton(approveButton);
      enableButton(rejectButton);
      return;
    }

    // always remove the review state when the comment is empty
    setReviewState(outputName, null);

    setButtonState(approveButton, metadata.status === "pass");
    setButtonActive(approveButton, "success", false);
    setButtonState(rejectButton, metadata.status === "fail");
    setButtonActive(rejectButton, "warning", false);
  });

  // Clear existing content
  const filePreviewContainer = document.getElementById("filePreviewContainer");
  filePreviewContainer.innerHTML = "";

  const filePreviewTemplate = document.querySelector(
    `[data-sacro-el="file-preview-template"]`
  );

  const filesCount = Object.keys(openOutput.value.metadata.files).length;

  // only attempt to render outcome cells if there is a single output file
  const outcome = filesCount === 1 ? openOutput.value.metadata.outcome : {};

  Object.entries(openOutput.value.metadata.files).map(([path, url], i) => {
    const ext = getFileExt(path);
    const newFilesContainer =
      filePreviewTemplate.content.firstElementChild.cloneNode(true);

    newFilesContainer.dataset.sacroEl = `file-preview-${i}`;

    const filePreviewTitle = newFilesContainer.querySelector(
      `[data-sacro-el="file-preview-template-title"]`
    );
    const filePreviewContent = newFilesContainer.querySelector(
      `[data-sacro-el="file-preview-template-content"]`
    );

    filePreviewTitle.innerText = path;

    if (isCsv(ext)) {
      createTableElement(filePreviewContent, ext, url, outcome);
    } else if (isImg(ext)) {
      createImageElement(filePreviewContent, url);
    } else {
      invalidFileElement(filePreviewContent);
    }

    return filePreviewContainer.appendChild(newFilesContainer);
  });
}

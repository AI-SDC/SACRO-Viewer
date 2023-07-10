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

function checkComment(button, comment) {
  // if no comment, ensure button disabled. Other was ensure is enabled
  if (comment.trim() === "") {
    // ensure button is disabled
    if (!button.disabled) {
      button.disabled = true; // eslint-disable-line no-param-reassign
      btnStyles.notDisabled
        .split(" ")
        .map((style) => button.classList.remove(style));
      btnStyles.disabled.split(" ").map((style) => button.classList.add(style));
      button.setAttribute("title", "You must enter a comment first");
    }
  } else if (button.disabled) {
    // make sure button is enabled
    button.disabled = false; // eslint-disable-line no-param-reassign
    btnStyles.disabled
      .split(" ")
      .map((style) => button.classList.remove(style));
    btnStyles.notDisabled
      .split(" ")
      .map((style) => button.classList.add(style));
    button.setAttribute("title", "");
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

  const requireCommentButtons = [];

  if (openOutput.value.metadata.status === "review") {
    // custom outputs require a comment either way
    requireCommentButtons.push(approveButton);
    requireCommentButtons.push(rejectButton);
  } else if (openOutput.value.metadata.status === "fail") {
    // if ACRO passed, require a comment to approve it
    requireCommentButtons.push(approveButton);
  } else if (openOutput.value.metadata.status === "pass") {
    // if ACRO passed, require a comment to reject it
    requireCommentButtons.push(rejectButton);
  }

  requireCommentButtons.forEach((button) =>
    checkComment(button, commentInput.value)
  );

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

  commentInput.addEventListener("keyup", () => {
    setComment(outputName, commentInput.value);
    requireCommentButtons.forEach((button) =>
      checkComment(button, commentInput.value)
    );
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

import { btnStyles, setButtonActive } from "./_buttons";
import {
  createImageElement,
  createTableElement,
  invalidFileElement,
} from "./_file-elements";
import {
  approvedOutputs,
  outputComments,
  openOutput,
  setComment,
  setReviewState,
} from "./_signals";
import {
  capitalise,
  formatDate,
  getFileExt,
  html,
  isCsv,
  isImg,
  setElementHTML,
  setElementText,
  toggleParentVisibility,
} from "./_utils";

/**
 * Set style string for ACRO status
 * @param {string} status - ACRO status with capitalised first letter
 * @returns string
 */
function statusStyles(status) {
  if (status === "Pass") return `bg-green-100 text-green-900`;
  if (status === "Fail") return `bg-red-100 text-red-900`;
  return `bg-yellow-100 text-yellow-900`;
}

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

  const {
    metadata: {
      comments,
      summary,
      timestamp,
      type,
      properties: { method },
    },
  } = openOutput.value;

  /**
   * Set the page name
   */
  toggleParentVisibility("outputTitle", "h1", "show");
  setElementText("outputTitle", outputName);

  /**
   * Display the created at date
   */
  if (timestamp) {
    toggleParentVisibility("outputCreatedDate", "div", "show");
    setElementHTML(
      "outputCreatedDate",
      `<time datetime="${timestamp}" title="${timestamp}">
      ${formatDate(timestamp)}
    </time>`
    );
  }

  toggleParentVisibility("outputType", "div", "show");
  if (method) {
    setElementText("outputType", `${method ?? ""} ${type}`);
  } else {
    setElementText("outputType", "Unknown");
  }

  toggleParentVisibility("outputDetailsStatus", "div", "show");

  if (summary) {
    /**
     * Parse the metadata summary so we can show the ACRO status clearly
     */
    const splitSummary = summary.split("; ").filter((i) => i !== "");
    let status = capitalise(splitSummary[0]);
    let statusInfo;
    if (status === "Review") {
      status = "Unknown";
      statusInfo = ["This type of output cannot be checked automatically"];
    } else {
      statusInfo = splitSummary.filter((item, i) => item !== "" && i !== 0);
    }

    setElementHTML(
      "outputDetailsStatus",
      `<span class="inline-flex items-center rounded-md px-2 py-0.5 font-medium ${statusStyles(
        status
      )}">${status}</span>`
    );

    if (statusInfo.length) {
      setElementHTML(
        "outputDetailsSummary",
        `(${statusInfo.map((item) => `<span>${item}</span>`).join(", ")})`
      );
    } else {
      setElementText("outputDetailsSummary", ``);
    }
  } else {
    toggleParentVisibility("outputDetailsStatus", "div", "show");
    setElementHTML(
      "outputDetailsStatus",
      `<span class="inline-flex items-center rounded-md px-2 py-0.5 font-medium ${statusStyles()}">Unknown</span>`
    );
    setElementText("outputDetailsSummary", ``);
  }

  /**
   * Show the comments summary information
   */
  if (comments.length) {
    toggleParentVisibility("outputDetailsComments", "div", "show");
    setElementHTML(
      "outputDetailsComments",
      comments.map((item) => `<li>${item}</li>`).join("")
    );
  } else {
    toggleParentVisibility("outputDetailsComments", "div", "hide");
  }

  /**
   * Set up the review form
   */
  toggleParentVisibility("outputDetailsReviewForm", "div", "show");

  // Set the metadata
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

  if (metadata.status === "review") {
    // custom outputs require a comment either way
    requireCommentButtons.push(approveButton);
    requireCommentButtons.push(rejectButton);
  } else if (metadata.status === "fail") {
    // if ACRO passed, require a comment to approve it
    requireCommentButtons.push(approveButton);
  } else if (metadata.status === "pass") {
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

  const filesCount = Object.keys(metadata.files).length;

  // only attempt to render outcome cells if there is a single output file
  const outcome = filesCount === 1 ? metadata.outcome : {};

  Object.entries(metadata.files).map(([path, url], i) => {
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

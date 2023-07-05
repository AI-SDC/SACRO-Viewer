import { btnStyles, setButtonActive } from "./_buttons";
import {
  createImageElement,
  createTableElement,
  fileContentElement,
  invalidFileElement,
} from "./_file-elements";
import {
  approvedFiles,
  fileComments,
  openFile,
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

const fileClick = async ({ outputName, metadata, url }) => {
  // Set the file values
  openFile.value = {
    outputName,
    ext: getFileExt(metadata.path),
    url,
    metadata,
  };

  const {
    outputName: openOutput,
    metadata: {
      comments,
      output,
      summary,
      timestamp,
      type,
      properties: { method },
    },
  } = openFile.value;

  /**
   * Show the file viewer
   */
  document
    .getElementById("select-a-file-title")
    .closest("section")
    .classList.remove("hidden");

  /**
   * Set the page name
   */
  toggleParentVisibility("fileTitle", "h1", "show");
  setElementText("fileTitle", openOutput);

  /**
   * Set the file title
   */
  // eslint-disable-next-line prefer-destructuring
  document.getElementById("select-a-file-title").innerText = output[0];

  /**
   * Display the created at date
   */
  if (timestamp) {
    toggleParentVisibility("fileCreatedDate", "div", "show");
    setElementHTML(
      "fileCreatedDate",
      `<time datetime="${timestamp}" title="${timestamp}">
      ${formatDate(timestamp)}
    </time>`
    );
  }

  if (method) {
    toggleParentVisibility("fileType", "div", "show");
    setElementText("fileType", `${method ?? ""} ${type}`);
  }

  toggleParentVisibility("fileDetailsStatus", "div", "show");

  if (summary) {
    const splitSummary = summary.split("; ").filter((i) => i !== "");
    const status =
      splitSummary[0] !== "review" ? capitalise(splitSummary[0]) : "Unknown";
    const statusInfo = splitSummary.filter((item, i) => item !== "" && i !== 0);

    /**
     * Split the metadata summary to show the overall file status
     */
    setElementHTML(
      "fileDetailsStatus",
      `<span class="inline-flex items-center rounded-md px-2 py-0.5 font-medium ${statusStyles(
        status
      )}">${status}</span>`
    );

    if (splitSummary.length > 1) {
      /**
       * Show the remaining summary information
       */
      setElementHTML(
        "fileDetailsSummary",
        `(${statusInfo.map((item) => `<span>${item}</span>`).join(", ")})`
      );
    } else {
      setElementText("fileDetailsSummary", ``);
    }
  } else {
    toggleParentVisibility("fileDetailsStatus", "div", "show");
    setElementHTML(
      "fileDetailsStatus",
      `<span class="inline-flex items-center rounded-md px-2 py-0.5 font-medium ${statusStyles()}">Unknown</span>`
    );
    setElementText("fileDetailsSummary", ``);
  }

  /**
   * Show the comments summary information
   */
  if (comments.length) {
    toggleParentVisibility("fileDetailsComments", "div", "show");
    setElementHTML(
      "fileDetailsComments",
      comments.map((item) => `<li>${item}</li>`).join("")
    );
  } else {
    toggleParentVisibility("fileDetailsComments", "div", "hide");
  }

  /**
   * Set up the review form
   */
  toggleParentVisibility("fileDetailsReviewForm", "div", "show");

  // Set the metadata
  const fileMetadata = document.getElementById("fileMetadata");

  fileMetadata.innerHTML = html`
    <div>
      <div class="flex flex-row">
        <button
          class="${btnStyles.default} ${approvedFiles.value[openOutput]
            .approved === true
            ? btnStyles.success
            : btnStyles.successOutline} rounded-l-md"
          data-sacro-el="fileDetailsBtnApprove"
          data-cy="approve"
        >
          Approve
        </button>
        <button
          class="${btnStyles.default} ${btnStyles.secondaryOutline} ${btnStyles.notDisabled} border-x-0"
          data-sacro-el="fileDetailsBtnReset"
        >
          Reset
        </button>
        <button
          class="${btnStyles.default} ${approvedFiles.value[openOutput]
            .approved === false
            ? btnStyles.warning
            : btnStyles.warningOutline} ${btnStyles.notDisabled} rounded-r-md"
          data-sacro-el="fileDetailsBtnReject"
        >
          Reject
        </button>
      </div>
      <label
        class="mt-2 inline-block font-semibold text-slate-900 cursor-pointer"
        for="comments"
      >
        Review comments on ${openOutput}:
      </label>
      <textarea
        class="
          comments
          mt-1 mb-2 block w-full rounded-md border-slate-300 text-slate-900 shadow-sm resize-none
          sm:text-sm
          focus:border-oxford-500 focus:ring-oxford-500
          invalid:border-bn-ribbon-600 invalid:ring-bn-ribbon-600 invalid:ring-1
        "
        data-sacro-el="fileDetailsTextareaComments"
        name="comments"
        id="comments"
        type="text"
      >
${fileComments.value[openOutput]}</textarea
      >
    </div>
  `;

  const approveButton = fileMetadata.querySelector(
    `[data-sacro-el="fileDetailsBtnApprove"]`
  );
  const resetButton = fileMetadata.querySelector(
    `[data-sacro-el="fileDetailsBtnReset"]`
  );
  const rejectButton = fileMetadata.querySelector(
    `[data-sacro-el="fileDetailsBtnReject"]`
  );
  const commentInput = fileMetadata.querySelector(
    `[data-sacro-el="fileDetailsTextareaComments"]`
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
    setReviewState(openOutput, true);
    setButtonActive(approveButton, "success", true);
    setButtonActive(rejectButton, "warning", false);
  });

  resetButton.addEventListener("click", () => {
    setReviewState(openOutput, null);
    setButtonActive(approveButton, "success", false);
    setButtonActive(rejectButton, "warning", false);
  });

  rejectButton.addEventListener("click", () => {
    setReviewState(openOutput, false);
    setButtonActive(rejectButton, "warning", true);
    setButtonActive(approveButton, "success", false);
  });

  commentInput.addEventListener("keyup", () => {
    setComment(openOutput, commentInput.value);
    requireCommentButtons.forEach((button) =>
      checkComment(button, commentInput.value)
    );
  });

  if (isCsv(openFile.value.ext)) {
    createTableElement(openFile, output);
  } else if (isImg(openFile.value.ext)) {
    createImageElement(openFile.value.url);
  } else {
    invalidFileElement();
  }

  return fileContentElement.classList.remove("hidden");
};

export default fileClick;

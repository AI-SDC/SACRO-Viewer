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
  getFileExt,
  html,
  isCsv,
  isImg,
  setElementHTML,
  setElementText,
  toggleParentVisibility,
} from "./_utils";

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

    const createdAt = new Date(timestamp).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    });

    setElementHTML(
      "fileCreatedDate",
      `<time datetime="${timestamp}" title="${timestamp}">
      ${createdAt}
    </time>`
    );
  }

  if (method) {
    toggleParentVisibility("fileType", "div", "show");
    setElementText("fileType", `${method ?? ""} ${type}`);
  }

  const statusStyles = (status) => {
    if (status === "Pass") return `bg-green-100 text-green-900`;
    if (status === "Fail") return `bg-red-100 text-red-900`;
    return `bg-yellow-100 text-yellow-900`;
  };

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
      `<span class="inline-flex items-center rounded-md px-2 py-0.5 font-medium ${statusStyles(
        "unknown"
      )}">Unknown</span>`
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

  const btnStyles = {
    default: `inline-flex items-center justify-center shadow-sm transition-buttons duration-200 px-4 py-2 text-sm font-medium`,
    success: `bg-green-600 text-white border border-green-600 hover:bg-green-700 focus:bg-green-700 focus:ring-green-500 focus:ring-offset-white`,
    successOutline: `bg-transparent border border-green-700 text-green-700 hover:bg-green-100 focus:bg-green-100 focus:ring-green-500 focus:ring-offset-white`,
    // secondary: ``,
    secondaryOutline: `bg-transparent border border-slate-400/75 text-slate-700 !shadow-none hover:bg-slate-200 focus:bg-slate-200 focus:ring-slate-500 focus:ring-offset-white`,
    warning: `bg-red-600 text-white border border-red-600 hover:bg-red-700 focus:ring-red-500 focus:ring-offset-white`,
    warningOutline: `bg-transparent border border-red-700 text-red-700 hover:bg-red-100 focus:bg-red-100 focus:ring-red-500 focus:ring-offset-white`,
    disabled: `cursor-not-allowed !bg-slate-300 !text-slate-800 !border-slate-400`,
    notDisabled: `hover:shadow-lg focus:outline-none focus:ring-current`,
  };

  fileMetadata.innerHTML = html`
    <div>
      <div class="flex flex-row">
        <button
          class="
            ${btnStyles.default}
            ${approvedFiles.value[openOutput].approved === true
            ? btnStyles.success
            : btnStyles.successOutline}
            rounded-l-md
            approve
          "
          data-sacro-el="fileDetailsBtnApprove"
          data-cy="approve"
        >
          Approve
        </button>
        <button
          class="
            ${btnStyles.default}
            ${btnStyles.secondaryOutline}
            ${btnStyles.notDisabled}
            reset border-l-0 border-r-0
          "
          data-sacro-el="fileDetailsBtnReset"
        >
          Reset
        </button>
        <button
          class="
            ${btnStyles.default}
            ${approvedFiles.value[openOutput].approved === false
            ? btnStyles.warning
            : btnStyles.warningOutline}
            ${btnStyles.notDisabled}
            reject rounded-r-md
          "
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

  const checkComment = (button, comment) => {
    // if no comment, ensure button disabled. Other was ensure is enabled
    if (comment.trim() === "") {
      // ensure button is disabled
      if (!button.disabled) {
        button.disabled = true; // eslint-disable-line no-param-reassign
        btnStyles.notDisabled
          .split(" ")
          .map((style) => button.classList.remove(style));
        btnStyles.disabled
          .split(" ")
          .map((style) => button.classList.add(style));
        button.setAttribute("title", "You must enter a comment first");

        approvedFiles.value = {
          ...approvedFiles.value,
          [openOutput]: {
            approved: null,
          },
        };
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
  };

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
    btnStyles.successOutline
      .split(" ")
      .map((style) => approveButton.classList.remove(style));
    btnStyles.success
      .split(" ")
      .map((style) => approveButton.classList.add(style));

    btnStyles.warning
      .split(" ")
      .map((style) => rejectButton.classList.remove(style));
    btnStyles.warningOutline
      .split(" ")
      .map((style) => rejectButton.classList.add(style));
  });

  resetButton.addEventListener("click", () => {
    setReviewState(openOutput, null);

    btnStyles.success
      .split(" ")
      .map((style) => approveButton.classList.remove(style));
    btnStyles.successOutline
      .split(" ")
      .map((style) => approveButton.classList.add(style));

    btnStyles.warning
      .split(" ")
      .map((style) => rejectButton.classList.remove(style));
    btnStyles.warningOutline
      .split(" ")
      .map((style) => rejectButton.classList.add(style));
  });

  rejectButton.addEventListener("click", () => {
    setReviewState(openOutput, false);

    btnStyles.warningOutline
      .split(" ")
      .map((style) => rejectButton.classList.remove(style));
    btnStyles.warning
      .split(" ")
      .map((style) => rejectButton.classList.add(style));

    btnStyles.success
      .split(" ")
      .map((style) => approveButton.classList.remove(style));
    btnStyles.successOutline
      .split(" ")
      .map((style) => approveButton.classList.add(style));
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

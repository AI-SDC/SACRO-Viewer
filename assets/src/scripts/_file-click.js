import {
  createImageElement,
  createTableElement,
  fileContentElement,
  invalidFileElement,
} from "./_file-elements";
import { fileComments, openFile, setComment, setReviewState } from "./_signals";
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
    }
  } else {
    toggleParentVisibility("fileDetailsStatus", "div", "show");
    setElementHTML(
      "fileDetailsStatus",
      `<span class="inline-flex items-center rounded-md px-2 py-0.5 font-medium ${statusStyles(
        "unknown"
      )}">Unknown</span>`
    );
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

  // define active button styles
  const approveButtonStyles =
    "bg-blue-600 text-white hover:bg-blue-700 focus:bg-blue-700 focus:ring-blue-500 focus:ring-offset-white";
  const rejectButtonStyles =
    "bg-red-600 text-white hover:bg-red-700 focus:bg-red-700 focus:ring-red-500 focus:ring-offset-white";

  const btnStyles = {
    default: `inline-flex items-center justify-center shadow-sm transition-buttons duration-200 px-4 py-2 text-sm font-medium`,
    primary: `bg-blue-600 text-white hover:bg-blue-700 focus:bg-blue-700 focus:ring-blue-500 focus:ring-offset-white`,
    primaryOutline: `bg-transparent border border-blue-700 text-blue-700 hover:bg-blue-100 focus:bg-blue-100 focus:ring-blue-500 focus:ring-offset-white`,
    // secondary: ``,
    secondaryOutline: `bg-transparent border border-slate-400/75 text-slate-700 !shadow-none hover:bg-slate-200 focus:bg-slate-200 focus:ring-slate-500 focus:ring-offset-white`,
    warning: `bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 focus:ring-offset-white`,
    warningOutline: `bg-transparent border border-red-700 text-red-700 hover:bg-red-100 focus:bg-red-100 focus:ring-red-500 focus:ring-offset-white`,
    disabled: `cursor-not-allowed bg-slate-300 text-slate-800`,
    notDisabled: `hover:shadow-lg focus:outline-none focus:ring-current`,
  };

  fileMetadata.innerHTML = html`
    <div>
      <div class="flex flex-row">
        <button
          class="
            ${btnStyles.default}
            ${btnStyles.primaryOutline}
            rounded-l-md
            approve
            ${approveButtonStyles}
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
            ${btnStyles.warningOutline}
            reject rounded-r-md
            ${rejectButtonStyles}
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

  const checkComment = (button, activeStyles, comment) => {
    // if no comment, ensure button disabled. Other was ensure is enabled
    if (comment.trim() === "") {
      // ensure button is disabled
      if (!button.disabled) {
        button.disabled = true; // eslint-disable-line no-param-reassign
        button.classList.add(
          "cursor-not-allowed",
          "bg-slate-300",
          "text-slate-800"
        );
        button.classList.remove(...activeStyles.split(/ +/));
        button.setAttribute("title", "You must enter a comment first");
      }
    } else if (button.disabled) {
      // make sure button is enabled
      button.disabled = false; // eslint-disable-line no-param-reassign
      button.classList.remove(
        "cursor-not-allowed",
        "bg-slate-300",
        "text-slate-800"
      );
      button.classList.add(...activeStyles.split(/ +/));
      button.setAttribute("title", "");
    }
  };

  const requireCommentButtons = [];

  if (metadata.status === "review") {
    // custom outputs require a comment either way
    requireCommentButtons.push([approveButton, approveButtonStyles]);
    requireCommentButtons.push([rejectButton, rejectButtonStyles]);
  } else if (metadata.status === "fail") {
    // if ACRO passed, require a comment to approve it
    requireCommentButtons.push([approveButton, approveButtonStyles]);
  } else if (metadata.status === "pass") {
    // if ACRO passed, require a comment to reject it
    requireCommentButtons.push([rejectButton, rejectButtonStyles]);
  }

  requireCommentButtons.forEach(([b, cls]) =>
    checkComment(b, cls, commentInput.value)
  );

  approveButton.addEventListener("click", () =>
    setReviewState(openOutput, true)
  );
  resetButton.addEventListener("click", () => setReviewState(openOutput, null));
  rejectButton.addEventListener("click", () =>
    setReviewState(openOutput, false)
  );
  commentInput.addEventListener("keyup", () => {
    setComment(openOutput, commentInput.value);
    requireCommentButtons.forEach(([b, cls]) =>
      checkComment(b, cls, commentInput.value)
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

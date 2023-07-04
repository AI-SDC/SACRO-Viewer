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
    metadata: { comments, output, summary, timestamp },
  } = openFile.value;

  toggleParentVisibility("fileDetailsReviewForm", "details", "show");

  /**
   * Set the file name
   */
  setElementText("fileTitle", openFile.value.outputName);

  /**
   * List the files included in the current output
   */
  if (output) {
    toggleParentVisibility("fileDetailsFileNames", "details", "show");

    setElementHTML(
      "fileDetailsFileNames",
      output.map((fileName) => `<li>${fileName}</li>`).join("")
    );
  }

  /**
   * Display the created at date
   */
  if (timestamp) {
    toggleParentVisibility("fileCreatedDate", "details", "show");

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

  if (summary) {
    toggleParentVisibility("fileDetailsStatus", "details", "show");

    /**
     * Split the metadata summary to show the overall file status
     */
    setElementText("fileDetailsStatus", capitalise(summary.split("; ")[0]));

    if (summary.split("; ").filter((i) => i !== "").length > 1) {
      toggleParentVisibility("fileDetailsSummary", "li", "show");
      /**
       * Show the remaining summary information
       */
      setElementHTML(
        "fileDetailsSummary",
        summary
          .split("; ")
          .filter((i) => i !== "")
          .map((item, i) => (i > 0 ? `<li>${item}</li>` : null))
          .join("")
      );
    } else {
      toggleParentVisibility("fileDetailsSummary", "li", "hide");
    }
  } else {
    toggleParentVisibility("fileDetailsStatus", "details", "hide");
  }

  /**
   * Show the comments summary information
   */
  if (comments.length) {
    toggleParentVisibility("fileDetailsComments", "details", "show");
    setElementHTML(
      "fileDetailsComments",
      comments.map((item) => `<li>${item}</li>`).join("")
    );
  } else {
    toggleParentVisibility("fileDetailsComments", "details", "hide");
  }

  // Set the metadata
  const fileMetadata = document.getElementById("fileMetadata");

  // define active button styles
  const approveButtonStyles =
    "bg-blue-600 text-white hover:bg-blue-700 focus:bg-blue-700 focus:ring-blue-500 focus:ring-offset-white";
  const rejectButtonStyles =
    "bg-red-600 text-white hover:bg-red-700 focus:bg-red-700 focus:ring-red-500 focus:ring-offset-white";

  fileMetadata.innerHTML = html`
    <ul>
      <li>
        <ul class="mt-2">
          <li>
            <strong>Review:</strong>
            <div class="flex flex-row">
              <button
                class="approve inline-flex items-center justify-center rounded-l-md shadow-sm transition-buttons duration-200 px-4 py-2 text-sm font-medium ${approveButtonStyles}"
                data-cy="approve"
              >
                Approve
              </button>
              <button
                class="reset inline-flex items-center justify-center shadow-sm transition-buttons duration-200 px-4 py-2 text-sm font-medium bg-slate-600 text-white hover:bg focus:bg-slate-500 focus:ring-slate-400 focus:ring-offset-white"
              >
                Reset
              </button>
              <button
                class="reject inline-flex items-center justify-center rounded-r-md shadow-sm transition-buttons duration-200 px-4 py-2 text-sm font-medium ${rejectButtonStyles}"
              >
                Reject
              </button>
            </div>
          </li>
          <li class="mt-2">
            <label
              class="inline-block font-semibold text-slate-900 cursor-pointer"
              for="comments"
            >
              Review comments on ${openOutput}:
            </label>
            <textarea
              class="
                  comments
                  mt-1 block w-full rounded-md border-slate-300 text-slate-900 shadow-sm resize-none
                  sm:text-sm
                  focus:border-oxford-500 focus:ring-oxford-500
                  invalid:border-bn-ribbon-600 invalid:ring-bn-ribbon-600 invalid:ring-1
                "
              name="comments"
              id="comments"
              type="text"
            >
  ${fileComments.value[openOutput]}</textarea
            >
          </li>
        </ul>
      </li>
    </ul>
  `;

  const approveButton = fileMetadata.querySelector("button.approve");
  const resetButton = fileMetadata.querySelector("button.reset");
  const rejectButton = fileMetadata.querySelector("button.reject");
  const commentInput = fileMetadata.querySelector("textarea.comments");

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

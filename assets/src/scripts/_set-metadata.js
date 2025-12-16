import {
  capitalise,
  formatDate,
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

/**
 * @param {string} outputName
 */
export function setOutputTitle(outputName) {
  toggleParentVisibility("outputTitle", "h1", "show");
  setElementText("outputTitle", outputName);
}

/**
 * @param {string} timestamp
 */
export function setCreatedAtDate(timestamp) {
  if (timestamp) {
    toggleParentVisibility("outputCreatedDate", "div", "show");
    setElementHTML(
      "outputCreatedDate",
      `<time datetime="${timestamp}" title="${timestamp}">
      ${formatDate(timestamp)}
    </time>`
    );
  }
}

/**
 * @param {string} method
 * @param {string} type
 */
export function setOutputType(method, type) {
  toggleParentVisibility("outputType", "div", "show"); // Show the outputType div

  if (method) {
    setElementText("outputType", `${method ?? ""} ${type}`);
  } else {
    setElementText("outputType", "Unknown");
  }
}

export function setAcroStatus(summary) {
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
}

/**
 *
 * @param {string[]} comments
 */
export function setResearcherComments(comments) {
  if (comments.length) {
    toggleParentVisibility("outputDetailsComments", "div", "show");
    setElementHTML(
      "outputDetailsComments",
      comments.map((item) => `<li>${item}</li>`).join("")
    );
  } else {
    toggleParentVisibility("outputDetailsComments", "div", "hide");
  }
}

/**
 * Show the exception request for outputs that don't pass an acro check.
 *
 * @param {string} comment
 * @param {string} status
 */
export function setExceptionRequest(comment, status) {
  if (status === "pass") {
    toggleParentVisibility("outputExceptionRequest", "div", "hide");
    setElementHTML("outputExceptionRequest", ``);
  } else {
    toggleParentVisibility("outputExceptionRequest", "div", "show");
    setElementHTML("outputExceptionRequest", comment);
  }
}

/**
 * If the checksum is invalid, show a message to the user
 * @param {HTMLElement} el - Append the text to this element
 * @param {boolean} checksumValid - true/false if the checksum is valid
 */
export function setChecksumInfo(el, checksumValid) {
  if (!checksumValid) {
    // eslint-disable-next-line no-param-reassign
    el.innerText =
      "This file had been modified since the ACRO runner generated it.";
  } else {
    el.remove();
  }
}

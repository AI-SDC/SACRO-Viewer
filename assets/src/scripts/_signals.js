import { signal } from "@preact/signals";
import { outputs } from "./_data";

// Signal for the currently visible output
export const openFile = signal();

// Signal for file comments, initial state is an empty string
// for each output
export const fileComments = signal(
  Object.fromEntries(Object.keys(outputs).map((output) => [output, ""]))
);

// Signal for the approval state, initial approval status for each output
// is null
export const approvedFiles = signal(
  Object.fromEntries(
    Object.entries(outputs).map(([output]) => [output, { approved: null }])
  )
);

/**
 * @param {string} name
 * @param {string} comment
 */
export function setComment(name, comment) {
  fileComments.value = { ...fileComments.value, [name]: comment };
}

/**
 * @param {string} name
 * @param {boolean | null} state
 */
export function setReviewState(name, state) {
  approvedFiles.value = {
    ...approvedFiles.value,
    [name]: { ...approvedFiles.value[name], approved: state },
  };
}

/**
 * @returns boolean | null
 */
export function isReviewComplete() {
  const allFilesReviewed = !Object.values(approvedFiles.value).filter(
    (item) => item.approved === null
  ).length;

  return allFilesReviewed;
}

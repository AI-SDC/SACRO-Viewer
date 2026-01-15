import { signal } from "@preact/signals";
import outputs from "./_data";

// Signal for the currently visible output
export const openOutput = signal();

// Signal for output comments, initial state is an empty string
// for each output
export const outputComments = signal(
  Object.fromEntries(Object.keys(outputs).map((output) => [output, ""]))
);

// Signal for the approval state, initial approval status for each output
// is null
export const approvedOutputs = signal(
  Object.fromEntries(
    Object.entries(outputs).map(([output]) => [output, { approved: null }])
  )
);

/**
 * @param {string} name
 * @param {string} comment
 */
export function setComment(name, comment) {
  outputComments.value = { ...outputComments.value, [name]: comment };
}

/**
 * @param {string} name
 * @param {boolean | null} state
 */
export function setReviewState(name, state) {
  approvedOutputs.value = {
    ...approvedOutputs.value,
    [name]: { ...approvedOutputs.value[name], approved: state },
  };
}

/**
 * @returns boolean | null
 */
export function isReviewComplete() {
  const allOutputsReviewed = !Object.values(approvedOutputs.value).filter(
    (item) => item.approved === null
  ).length;

  return allOutputsReviewed;
}

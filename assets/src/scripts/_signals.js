/* eslint-disable import/prefer-default-export */
import { signal } from "@preact/signals";
import { outputs } from "./_data";

// Store the file currently visible in the preview
const openFile = signal();

// initially empty file comments
const fileComments = signal(
  Object.fromEntries(Object.keys(outputs).map((output) => [output, ""]))
);

// Set each output approval status to null
const approvedFiles = signal(
  Object.fromEntries(
    Object.entries(outputs).map(([output]) => [output, { approved: null }])
  )
);

const setComment = (name, comment) => {
  const newState = { ...fileComments.value };
  newState[name] = comment;
  fileComments.value = newState;
};

const setReviewState = (name, state) => {
  approvedFiles.value = {
    ...approvedFiles.value,
    [name]: { ...approvedFiles.value[name], approved: state },
  };
};

const isReviewComplete = () => {
  const allFilesReviewed = !Object.values(approvedFiles.value).filter(
    (item) => item.approved === null
  ).length;

  return allFilesReviewed;
};

export {
  openFile,
  fileComments,
  approvedFiles,
  setReviewState,
  setComment,
  isReviewComplete,
};

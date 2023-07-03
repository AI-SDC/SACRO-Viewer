/* eslint-disable import/prefer-default-export */
import { signal } from "@preact/signals";
import { outputs } from "./_data";

// Store the file currently visible in the preview
const openFile = signal();

// Set each output approval status to null
const approvedFiles = signal(
  Object.fromEntries(
    Object.entries(outputs).map(([key]) => [key, { approved: null }])
  )
);

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

export { openFile, approvedFiles, setReviewState, isReviewComplete };

/* eslint-disable import/prefer-default-export */
import { signal } from "@preact/signals";
import { outputs } from "./_data";

const openFile = signal();

const initialReviewState = new Map();
outputs.forEach((_, k) => initialReviewState.set(k, null));

const approvedFiles = signal(initialReviewState);

const setReviewState = (name, state) => {
  const newState = new Map(approvedFiles.value);
  newState.set(name, state);
  approvedFiles.value = newState;
};

const isReviewComplete = () =>
  Array.from(approvedFiles.value.values()).every((x) => x !== null);

export { openFile, approvedFiles, setReviewState, isReviewComplete };

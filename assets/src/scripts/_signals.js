/* eslint-disable import/prefer-default-export */
import { signal } from "@preact/signals";

const openFile = signal();
const approvedFiles = signal([]);

export { openFile, approvedFiles };

import {
  approvedOutputs,
  openOutput,
  outputComments,
  setComment,
  setReviewState,
} from "./_signals";
import { hasComment } from "./_utils";

/**
 * @param {object} obj
 * @param {boolean} [obj.isChecked]
 * @param {HTMLInputElement} obj.el
 * @param {boolean} [obj.isEnabled]
 */
function setRadioState({ el, isChecked, isEnabled }) {
  if (isEnabled !== undefined) {
    if (isEnabled) {
      el.removeAttribute("disabled");
    } else {
      el.setAttribute("disabled", "true");
    }
  }

  if (isChecked !== undefined) {
    el.checked = isChecked; // eslint-disable-line no-param-reassign
  }
}

/**
 * @param {object} obj
 * @param {HTMLElement} obj.el
 * @param {boolean} obj.isVisible
 * @param {string} [obj.text]
 */
function setReviewHint({ el, isVisible, text }) {
  if (isVisible) {
    el.classList.remove("hidden");
  } else {
    el.classList.add("hidden");
  }

  if (text) {
    el.innerText = text; // eslint-disable-line no-param-reassign
  }
}

/**
 *
 * @param {string} outputName - name of ACRO output
 * @returns {void}
 */
// eslint-disable-next-line consistent-return
export default function setFormState(outputName) {
  const reviewFormTemplate = /** @type {HTMLTemplateElement} */ (
    document.querySelector(`[data-sacro-el="output-details-review-form"]`)
  );
  if (!reviewFormTemplate?.content?.firstElementChild) {
    // eslint-disable-next-line no-console
    return console.error(
      `[data-sacro-el="output-details-review-form"] not found`
    );
  }
  const newReviewForm =
    reviewFormTemplate.content.firstElementChild.cloneNode(true);

  const reviewForm = /** @type {HTMLElement} */ (
    document.getElementById("reviewForm")
  );
  reviewForm.innerHTML = "";
  reviewForm?.appendChild(newReviewForm);

  const approveRadio = /** @type {HTMLInputElement} */ (
    document.querySelector(`[data-sacro-el="output-details-review-approve"]`)
  );
  const rejectRadio = /** @type {HTMLInputElement} */ (
    document.querySelector(`[data-sacro-el="output-details-review-reject"]`)
  );
  const reviewHint = /** @type {HTMLInputElement} */ (
    document.querySelector(`[data-sacro-el="output-details-review-hint"]`)
  );
  const reviewLabel = /** @type {HTMLInputElement} */ (
    document.querySelector(
      `[data-sacro-el="output-details-review-comment-label"]`
    )
  );
  const reviewComment = /** @type {HTMLTextAreaElement} */ (
    document.querySelector(`[data-sacro-el="output-details-review-comment"]`)
  );

  reviewLabel.innerText = `Review comments on ${outputName}:`;

  if (approvedOutputs.value[outputName].approved === true) {
    setRadioState({ el: approveRadio, isChecked: true });
  }

  if (approvedOutputs.value[outputName].approved === false) {
    setRadioState({ el: rejectRadio, isChecked: true });
  }

  reviewComment.value = outputComments.value[outputName];

  if (!hasComment(outputName)) {
    if (openOutput.value.metadata.status === "pass") {
      setRadioState({ el: approveRadio, isEnabled: true });
      setRadioState({ el: rejectRadio, isEnabled: false });
      setReviewHint({
        el: reviewHint,
        isVisible: true,
        text: "You cannot reject this output until you add a comment.",
      });
    } else if (openOutput.value.metadata.status === "fail") {
      setRadioState({ el: approveRadio, isEnabled: false });
      setRadioState({ el: rejectRadio, isEnabled: true });
      setReviewHint({
        el: reviewHint,
        isVisible: true,
        text: "You cannot approve this output until you add a comment.",
      });
    } else {
      setRadioState({ el: approveRadio, isEnabled: false });
      setRadioState({ el: rejectRadio, isEnabled: false });
      setReviewHint({
        el: reviewHint,
        isVisible: true,
        text: "You cannot set a review status on this output until you add a comment.",
      });
    }
  } else if (hasComment(outputName)) {
    setRadioState({ el: approveRadio, isEnabled: true });
    setRadioState({ el: rejectRadio, isEnabled: true });
    setReviewHint({
      el: reviewHint,
      isVisible: false,
    });
  }

  approveRadio.addEventListener("change", () => {
    if (!approveRadio.getAttribute("disabled")) {
      setReviewState(outputName, true);
    }
  });

  rejectRadio.addEventListener("change", () => {
    if (!rejectRadio.getAttribute("disabled")) {
      setReviewState(outputName, false);
    }
  });

  reviewComment.addEventListener(
    "keyup",
    /** @param {KeyboardEvent} e */ (e) => {
      console.log({ e });
      const target = /** @type {HTMLTextAreaElement} */ (e.target); // eslint-disable-line prefer-destructuring
      setComment(outputName, target.value);

      if (hasComment(outputName)) {
        setRadioState({ el: approveRadio, isEnabled: true });
        setRadioState({ el: rejectRadio, isEnabled: true });
        setReviewHint({
          el: reviewHint,
          isVisible: false,
        });
      } else if (!hasComment(outputName)) {
        if (openOutput.value.metadata.status === "pass") {
          setRadioState({ el: approveRadio, isEnabled: true });
          setRadioState({
            el: rejectRadio,
            isEnabled: false,
            isChecked: false,
          });
          setReviewHint({
            el: reviewHint,
            isVisible: true,
            text: "You cannot reject this output until you add a comment.",
          });

          if (approvedOutputs.value[outputName].approved === false) {
            setReviewState(outputName, null);
          }
        } else if (openOutput.value.metadata.status === "fail") {
          setRadioState({
            el: approveRadio,
            isEnabled: false,
            isChecked: false,
          });
          setRadioState({ el: rejectRadio, isEnabled: true });
          setReviewHint({
            el: reviewHint,
            isVisible: true,
            text: "You cannot approve this output until you add a comment.",
          });

          if (approvedOutputs.value[outputName].approved === true) {
            setReviewState(outputName, null);
          }
        } else {
          setRadioState({
            el: approveRadio,
            isEnabled: false,
            isChecked: false,
          });
          setRadioState({
            el: rejectRadio,
            isEnabled: false,
            isChecked: false,
          });
          setReviewState(outputName, null);
          setReviewHint({
            el: reviewHint,
            isVisible: true,
            text: "You cannot set a review status on this output until you add a comment.",
          });
        }
      }
    }
  );
}

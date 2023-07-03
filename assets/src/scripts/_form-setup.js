import { effect } from "@preact/signals";
import { reviewUrl } from "./_data";
import { approvedFiles, isReviewComplete } from "./_signals";

const formSetup = () => {
  const form = document.querySelector("#approveForm");
  const button = form.querySelector(`button[type="submit"]`);
  form.action = reviewUrl;

  const enabledClasses = [
    "bg-blue-600",
    "text-white",
    "hover:bg-blue-700",
    "focus:bg-blue-700",
    "focus:ring-blue-500",
    "focus:ring-offset-white",
  ];

  const disabledClasses = [
    "cursor-not-allowed",
    "bg-slate-300",
    "text-slate-800",
  ];

  const setButtonState = (enabled) => {
    if (enabled) {
      if (button.disabled) {
        button.classList.remove(...disabledClasses);
        button.classList.add(...enabledClasses);
        button.disabled = false;
        button.setAttribute("title", "");
      }
    } else {
      // disable
      if (!button.disabled) button.classList.remove(...enabledClasses);
      button.classList.add(...disabledClasses);
      button.disabled = true;
      button.setAttribute("title", "You must approve or reject all outputs");
    }
  };

  setButtonState(false);

  effect(() => setButtonState(isReviewComplete()));

  form.addEventListener("formdata", (e) => {
    const reviewedApprovedFiles = Object.keys(approvedFiles.value).filter(
      (key) => approvedFiles.value[key]?.approved === true
    );

    reviewedApprovedFiles.map((file) => e.formData.append("outputs", file));
  });
};

export default formSetup;

import { effect } from "@preact/signals";
import { approvedOutputs, isReviewComplete } from "./_signals";

export default function modalSetup() {
  const button = document.querySelector("#openModalBtn");
  const modal = document.querySelector("#submitModal");

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

  button.addEventListener("click", () => {
    const approvedCount = Object.keys(approvedOutputs.value).filter(
      (k) => approvedOutputs.value[k].approved
    ).length;
    modal.querySelector(".count").innerHTML = approvedCount;

    modal.classList.remove("hidden");
  });
}

import { effect } from "@preact/signals";
import outputs from "./_data";
import outputClick from "./_output-click";
import { approvedOutputs } from "./_signals";

/**
 *
 */
export default function outputList() {
  const container = document.getElementById("outputList");
  const outputListItems = [...container.querySelectorAll("li")];

  // add click handler to each list item
  outputListItems.forEach((el) => {
    const outputName = el.getAttribute("data-output-name");
    const metadata = outputs[outputName];

    // toggle selected state for the output list
    el.addEventListener("click", () => {
      outputClick({ outputName, metadata });

      // clear selected class from all items in the list
      outputListItems.forEach((e) => e.classList.remove("bg-blue-50"));

      // set selected class on this list item
      el.classList.add("bg-blue-50");
    });

    // toggle icon changes on state change
    effect(() => {
      Object.keys(outputs).forEach((output) => {
        if (outputName === output) {
          const state = approvedOutputs.value[output]?.approved;

          if (state === null) {
            el.setAttribute("data-review-status", "none");
          } else {
            el.setAttribute("data-review-status", state);
          }
        }
      });

      return null;
    });
  });
}

import { approvedOutputs, outputComments } from "./_signals";

const formSetup = () => {
  const modal = document.querySelector("#submitModal");
  const submit = modal.querySelector(`#approveForm button[type="submit"]`);

  // close the modal
  modal.querySelector(".cancel").addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  // update the form with approved files data before its submitted
  document.querySelector("#approveForm").addEventListener("formdata", (ev) => {
    const data = Object.fromEntries(
      Object.keys(approvedOutputs.value).map((output) => [
        output,
        {
          state: approvedOutputs.value[output].approved,
          comment: outputComments.value[output],
        },
      ])
    );
    // serialize the review state as a JSON string in the form submission
    // We tunnel JSON via default form encoding because of Django CSRF, mainly
    ev.formData.set("review", JSON.stringify(data));
  });

  const activeStyles = [
    "bg-green-600",
    "focus:ring-green-500",
    "focus:ring-offset-white",
    "hover:bg-green-700",
    "text-white",
  ];
  const disabledStyles = [
    "bg-slate-300",
    "cursor-not-allowed",
    "text-slate-800",
  ];

  // enable the submit button once the comment box has content
  modal.querySelector("#id_comment").addEventListener("keyup", (e) => {
    // if no comment, ensure button disabled. Other was ensure is enabled
    if (e.target.value.trim() === "") {
      // ensure button is disabled
      if (!submit.disabled) {
        submit.disabled = true; // eslint-disable-line no-param-reassign
        submit.classList.add(...disabledStyles);
        submit.classList.remove(...activeStyles);
        submit.setAttribute("title", "You must enter a comment first");
      }
    } else if (submit.disabled) {
      // make sure button is enabled
      submit.disabled = false; // eslint-disable-line no-param-reassign
      submit.classList.remove(...disabledStyles);
      submit.classList.add(...activeStyles);
      submit.setAttribute("title", "");
    }
  });
};

export default formSetup;

import { approvedFiles, fileComments } from "./_signals";

const formSetup = () => {
  const modal = document.querySelector("#submitModal");

  // close the modal
  modal.querySelector(".cancel").addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  // update the form with approved files data before its submitted
  document.querySelector("#approveForm").addEventListener("formdata", (ev) => {
    const data = Object.fromEntries(
      Object.keys(approvedFiles.value).map((output) => [
        output,
        {
          state: approvedFiles.value[output].approved,
          comment: fileComments.value[output],
        },
      ])
    );
    // serialize the review state as a JSON string in the form submission
    // We tunnel JSON via default form encoding because of Django CSRF, mainly
    ev.formData.set("review", JSON.stringify(data));
  });
};

export default formSetup;

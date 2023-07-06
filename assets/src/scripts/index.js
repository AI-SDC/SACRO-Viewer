import "../styles/index.css";
import formSetup from "./_form-setup";
import modalSetup from "./_modal-setup";
import outputList from "./_output-list";

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("fileContent").classList.add("hidden");
  outputList();
  formSetup();
  modalSetup();
});

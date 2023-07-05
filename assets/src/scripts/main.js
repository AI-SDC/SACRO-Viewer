import "../styles/main.css";
import fileList from "./_files-list";
import formSetup from "./_form-setup";
import modalSetup from "./_modal-setup";

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("fileContent").classList.add("hidden");
  fileList();
  formSetup();
  modalSetup();
});

import { contentUrls } from "./_data";
import { openFile } from "./_signals";

const fileList = () => {
  const template = document.getElementById("fileRow");
  const container = document.getElementById("filesList");

  const handleFileClick = (e) => {
    openFile.value = e.target.textContent;
    document.querySelector("#openFileName h2").textContent = openFile.value;
  };

  contentUrls.forEach((url, fileName) => {
    const el = template.content.firstElementChild.cloneNode(true);

    el.querySelector(`[data-file="name"]`).textContent = fileName;
    el.querySelector(`[data-file="link"]`).href = `#${url}`;
    el.addEventListener("click", handleFileClick);

    container.appendChild(el);
  });
};

export default fileList;

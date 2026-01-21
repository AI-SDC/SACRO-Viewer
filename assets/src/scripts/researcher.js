import "../styles/index.css";
import outputs from "./_data";
import outputClick from "./_output-click";
import { isDocumentFile, getFileExt } from "./_utils";

document.addEventListener("DOMContentLoaded", () => {
  console.log("Researcher JS loaded");

  const currentPath = JSON.parse(
    document.getElementById("currentPath").textContent
  );
  const version = JSON.parse(
    document.getElementById("outputVersion").textContent
  );
  const config = JSON.parse(
    document.getElementById("outputConfig").textContent
  );

  const sessionData = {
    version,
    config,
    results: {},
  };

  Object.keys(outputs).forEach((key) => {
    sessionData.results[key] = {
      ...outputs[key],
      comments: outputs[key].comments || [],
      exception: outputs[key].exception || null,
    };
  });

  setupResearcherInterface();

  function updateOutputCount() {
    const outputCountElement = document.getElementById("outputCount");
    const finalizeBtn = document.getElementById("finalizeBtn");
    const count = Object.keys(sessionData.results).length;

    if (outputCountElement) {
      outputCountElement.textContent = count;
    }

    if (finalizeBtn) {
      finalizeBtn.disabled = count === 0;
      if (count === 0) {
        finalizeBtn.classList.add("opacity-50", "cursor-not-allowed");
      } else {
        finalizeBtn.classList.remove("opacity-50", "cursor-not-allowed");
      }
    }
  }

  function setupResearcherInterface() {
    setupOutputList();
    setupAddCommentButton();
    setupAddExceptionButton();
    setupViewAllCommentsButton();
    setupModalClose();
    setupSaveDraftButton();
    setupFinalizeButton();
    setupOutputManagement();
    setupUploadZone();
    updateOutputCount();
  }

  function setupOutputList() {
    const outputList = document.getElementById("outputList");
    const form = document.querySelector("#researcherForm form");

    if (!outputList) return;

    outputList.addEventListener("click", async (e) => {
      const item = e.target.closest("li[data-output-name]");
      if (!item) return;

      if (
        e.target.closest(".edit-output-btn") ||
        e.target.closest(".delete-output-btn")
      ) {
        return;
      }

      const outputName = item.getAttribute("data-output-name");
      const metadata = sessionData.results[outputName];

      await outputClick({ outputName, metadata });

      document.querySelectorAll("#outputList li").forEach((el) => {
        el.classList.remove("bg-blue-50");
      });
      item.classList.add("bg-blue-50");

      if (form) form.style.display = "grid";

      updateCommentsDisplay(outputName);
      updateExceptionDisplay(outputName);


      const hasDocumentFiles = metadata.files && metadata.files.some((file) => {
        const ext = getFileExt(file.name);
        return isDocumentFile(ext);
      });


      const exceptionLabel = document.querySelector('label[for="exceptionRequest"]');
      const exceptionTextarea = document.querySelector(
        '[data-sacro-el="researcher-exception-request"]'
      );
      const exceptionButton = document.querySelector(
        '[data-sacro-el="researcher-add-exception-btn"]'
      );

      if (hasDocumentFiles) {

        if (exceptionLabel) exceptionLabel.style.display = "none";
        if (exceptionTextarea) exceptionTextarea.style.display = "none";
        if (exceptionButton) exceptionButton.style.display = "none";
      } else {
        if (exceptionLabel) exceptionLabel.style.display = "block";
        if (exceptionTextarea) exceptionTextarea.style.display = "block";
        if (exceptionButton) exceptionButton.style.display = "inline-flex";
      }

      if (exceptionTextarea) {
        exceptionTextarea.value = sessionData.results[outputName].exception || "";
      }
    });
  }

  function getCurrentlySelectedOutput() {
    const selectedItem = document.querySelector("#outputList li.bg-blue-50");
    return selectedItem ? selectedItem.getAttribute("data-output-name") : null;
  }

  function updateCommentsDisplay(outputName) {
    const commentsContainer = document.querySelector(
      '[data-sacro-el="outputDetailsComments"]'
    );
    const viewAllBtn = document.querySelector(
      '[data-sacro-el="viewAllCommentsBtn"]'
    );
    if (!commentsContainer) return;

    const comments = sessionData.results[outputName]?.comments || [];
    commentsContainer.innerHTML = "";

    const displayComments = comments.slice(0, 3);
    displayComments.forEach((comment, index) => {
      const li = document.createElement("li");
      li.className = "flex justify-between items-start gap-2";
      li.innerHTML = `
        <span class="flex-1">${comment}</span>
        <div class="flex gap-1">
          <button class="edit-comment text-xs text-blue-600 hover:text-blue-800" data-index="${index}">Edit</button>
          <button class="delete-comment text-xs text-red-600 hover:text-red-800" data-index="${index}">Delete</button>
        </div>
      `;
      commentsContainer.appendChild(li);
    });

    commentsContainer.querySelectorAll(".edit-comment").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const index = parseInt(e.target.dataset.index);
        editComment(outputName, index);
      });
    });

    commentsContainer.querySelectorAll(".delete-comment").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const index = parseInt(e.target.dataset.index);
        deleteComment(outputName, index);
      });
    });

    if (viewAllBtn) {
      if (comments.length > 3) {
        viewAllBtn.textContent = `View All (${comments.length})`;
        viewAllBtn.style.display = "inline-block";
      } else if (comments.length > 0) {
        viewAllBtn.textContent = "View All";
        viewAllBtn.style.display = "inline-block";
      } else {
        viewAllBtn.style.display = "none";
      }
    }

    const commentsSection = commentsContainer.closest(".grid");
    if (commentsSection) {
      if (comments.length > 0) {
        commentsSection.hidden = false;
        commentsSection.classList.remove("hidden");
      } else {
        commentsSection.hidden = true;
        commentsSection.classList.add("hidden");
      }
    }
  }

  function updateExceptionDisplay(outputName) {
    const exceptionContainer = document.querySelector(
      '[data-sacro-el="outputExceptionRequest"]'
    );
    if (!exceptionContainer) return;

    const exception = sessionData.results[outputName]?.exception;
    if (exception) {
      exceptionContainer.textContent = exception;
      const exceptionSection = exceptionContainer.closest(".grid");
      if (exceptionSection) {
        exceptionSection.hidden = false;
        exceptionSection.classList.remove("hidden");
      }
    }
  }

  let editingCommentIndex = null;

  function setupAddCommentButton() {
    const addCommentBtn = document.querySelector(
      '[data-sacro-el="researcher-add-comment-btn"]'
    );
    const commentTextarea = document.querySelector(
      '[data-sacro-el="researcher-new-comment"]'
    );

    console.log("Setup add comment:", {
      btn: !!addCommentBtn,
      textarea: !!commentTextarea,
    });

    if (!addCommentBtn || !commentTextarea) return;

    addCommentBtn.addEventListener("click", () => {
      console.log("Add/Edit comment clicked");
      const commentText = commentTextarea.value.trim();
      if (!commentText) {
        alert("Please enter a comment");
        return;
      }

      const selectedOutput = getCurrentlySelectedOutput();
      if (!selectedOutput) {
        alert("Please select an output first");
        return;
      }

      if (!sessionData.results[selectedOutput].comments) {
        sessionData.results[selectedOutput].comments = [];
      }

      if (editingCommentIndex !== null) {
        sessionData.results[selectedOutput].comments[editingCommentIndex] =
          commentText;
        editingCommentIndex = null;
        addCommentBtn.textContent = "Add Comment";
        console.log("Comment edited in", selectedOutput);
      } else {
        sessionData.results[selectedOutput].comments.push(commentText);
        console.log("Comment added to", selectedOutput);
      }

      commentTextarea.value = "";
      updateCommentsDisplay(selectedOutput);
    });
  }

  function setupAddExceptionButton() {
    const addExceptionBtn = document.querySelector(
      '[data-sacro-el="researcher-add-exception-btn"]'
    );
    const exceptionTextarea = document.querySelector(
      '[data-sacro-el="researcher-exception-request"]'
    );

    console.log("Setup add exception:", {
      btn: !!addExceptionBtn,
      textarea: !!exceptionTextarea,
    });

    if (!addExceptionBtn || !exceptionTextarea) return;

    addExceptionBtn.addEventListener("click", () => {
      console.log("Add exception clicked");
      const exceptionText = exceptionTextarea.value.trim();
      if (!exceptionText) {
        alert("Please enter an exception request");
        return;
      }

      const selectedOutput = getCurrentlySelectedOutput();
      if (!selectedOutput) {
        alert("Please select an output first");
        return;
      }

      sessionData.results[selectedOutput].exception = exceptionText;
      exceptionTextarea.value = "";
      updateExceptionDisplay(selectedOutput);
      console.log(
        "Exception added to",
        selectedOutput,
        sessionData.results[selectedOutput].exception
      );
    });
  }

  function setupViewAllCommentsButton() {
    const viewAllBtn = document.querySelector(
      '[data-sacro-el="viewAllCommentsBtn"]'
    );
    console.log("Setup view all:", { btn: !!viewAllBtn });

    if (!viewAllBtn) return;

    viewAllBtn.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("View all clicked");

      const selectedOutput = getCurrentlySelectedOutput();
      if (!selectedOutput) return;

      const comments = sessionData.results[selectedOutput]?.comments || [];
      const modal = document.getElementById("commentsModal");
      const commentsList = document.getElementById("allCommentsList");

      console.log("Modal elements:", {
        modal: !!modal,
        list: !!commentsList,
        comments: comments.length,
      });

      if (!modal || !commentsList) return;

      commentsList.innerHTML = "";
      comments.forEach((comment, index) => {
        const div = document.createElement("div");
        div.className =
          "p-3 bg-gray-50 rounded flex justify-between items-start gap-2";
        div.innerHTML = `
          <div class="flex-1">
            <p class="text-sm font-medium text-gray-900">Comment ${index + 1
          }</p>
            <p class="text-sm text-gray-700 mt-1">${comment}</p>
          </div>
          <div class="flex gap-2">
            <button class="edit-comment-modal text-xs text-blue-600 hover:text-blue-800" data-index="${index}">Edit</button>
            <button class="delete-comment-modal text-xs text-red-600 hover:text-red-800" data-index="${index}">Delete</button>
          </div>
        `;
        commentsList.appendChild(div);
      });

      commentsList.querySelectorAll(".edit-comment-modal").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const index = parseInt(e.target.dataset.index);
          modal.classList.add("hidden");
          editComment(selectedOutput, index);
        });
      });

      commentsList.querySelectorAll(".delete-comment-modal").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const index = parseInt(e.target.dataset.index);
          deleteComment(selectedOutput, index);

          const updatedComments =
            sessionData.results[selectedOutput]?.comments || [];
          commentsList.innerHTML = "";
          updatedComments.forEach((comment, idx) => {
            const div = document.createElement("div");
            div.className =
              "p-3 bg-gray-50 rounded flex justify-between items-start gap-2";
            div.innerHTML = `
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-900">Comment ${idx + 1
              }</p>
                <p class="text-sm text-gray-700 mt-1">${comment}</p>
              </div>
              <div class="flex gap-2">
                <button class="edit-comment-modal text-xs text-blue-600 hover:text-blue-800" data-index="${idx}">Edit</button>
                <button class="delete-comment-modal text-xs text-red-600 hover:text-red-800" data-index="${idx}">Delete</button>
              </div>
            `;
            commentsList.appendChild(div);
          });

          commentsList
            .querySelectorAll(".edit-comment-modal")
            .forEach((btn) => {
              btn.addEventListener("click", (e) => {
                const index = parseInt(e.target.dataset.index);
                modal.classList.add("hidden");
                editComment(selectedOutput, index);
              });
            });

          commentsList
            .querySelectorAll(".delete-comment-modal")
            .forEach((btn) => {
              btn.addEventListener("click", (e) => {
                const index = parseInt(e.target.dataset.index);
                deleteComment(selectedOutput, index);
              });
            });
        });
      });

      modal.classList.remove("hidden");
      console.log("Modal shown");
    });
  }

  function setupModalClose() {
    const modals = document.querySelectorAll("#commentsModal, #addOutputModal, #editOutputModal, #deleteOutputModal, #finalizeSessionModal");
    modals.forEach(modal => {
      if (!modal) return;

      const closeBtn = modal.querySelector(".cancel");
      if (closeBtn) {
        closeBtn.addEventListener("click", () => {
          modal.classList.add("hidden");
        });
      }

      const closeX = modal.querySelector(".close-x");
      if (closeX) {
        closeX.addEventListener("click", () => {
          modal.classList.add("hidden");
        });
      }

      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.classList.add("hidden");
        }
      });
    });
  }

  function setupSaveDraftButton() {
    const saveDraftBtn = document.getElementById("saveDraftBtn");
    if (!saveDraftBtn) return;

    saveDraftBtn.addEventListener("click", () => {
      console.log("Save draft clicked", sessionData);
      const formData = new FormData();
      formData.append("session_data", JSON.stringify(sessionData));

      fetch(
        `/researcher/session/save/?path=${encodeURIComponent(currentPath)}`,
        {
          method: "POST",
          body: formData,
          headers: {
            "X-CSRFToken": getCsrfToken(),
          },
        }
      )
        .then((response) => response.json())
        .then((result) => {
          if (result.success) {
            alert("Draft saved successfully!");
          } else {
            alert(`Error saving draft: ${result.message}`);
          }
        })
        .catch((error) => {
          alert(`Error saving draft: ${error}`);
          console.error(error);
        });
    });
  }

  function editComment(outputName, index) {
    const comments = sessionData.results[outputName]?.comments || [];
    const currentComment = comments[index];
    if (!currentComment) return;

    const commentTextarea = document.querySelector(
      '[data-sacro-el="researcher-new-comment"]'
    );
    const addCommentBtn = document.querySelector(
      '[data-sacro-el="researcher-add-comment-btn"]'
    );

    if (!commentTextarea || !addCommentBtn) return;

    commentTextarea.value = currentComment;
    commentTextarea.focus();

    addCommentBtn.textContent = "Update Comment";
    editingCommentIndex = index;

    console.log("Editing comment:", outputName, index, currentComment);
  }

  function deleteComment(outputName, index) {
    const comments = sessionData.results[outputName]?.comments || [];
    if (index < 0 || index >= comments.length) return;

    if (confirm("Are you sure you want to delete this comment?")) {
      sessionData.results[outputName].comments.splice(index, 1);

      if (editingCommentIndex === index) {
        editingCommentIndex = null;
        const addCommentBtn = document.querySelector(
          '[data-sacro-el="researcher-add-comment-btn"]'
        );
        const commentTextarea = document.querySelector(
          '[data-sacro-el="researcher-new-comment"]'
        );
        if (addCommentBtn) addCommentBtn.textContent = "Add Comment";
        if (commentTextarea) commentTextarea.value = "";
      } else if (editingCommentIndex !== null && editingCommentIndex > index) {
        editingCommentIndex--;
      }

      updateCommentsDisplay(outputName);
      console.log("Comment deleted:", outputName, index);
    }
  }

  function setupFinalizeButton() {
    const finalizeBtn = document.getElementById("finalizeBtn");
    const finalizeModal = document.getElementById("finalizeSessionModal");

    if (!finalizeBtn || !finalizeModal) return;

    finalizeBtn.addEventListener("click", () => {
      document.getElementById("finalizeSessionName").value = sessionData.title || "";
      document.querySelectorAll("#finalizeSessionModal input[type='checkbox']").forEach(cb => cb.checked = false);
      finalizeModal.classList.remove("hidden");
    });

    document.getElementById("cancelFinalize")?.addEventListener("click", () => {
      finalizeModal.classList.add("hidden");
    });

    document.getElementById("confirmFinalize")?.addEventListener("click", () => {
      const sessionName = document.getElementById("finalizeSessionName").value.trim();
      const checkboxes = document.querySelectorAll("#finalizeSessionModal input[type='checkbox']");
      const allChecked = Array.from(checkboxes).every(cb => cb.checked);

      if (!sessionName) {
        alert("Please enter a Session Name.");
        return;
      }

      if (!allChecked) {
        alert("Please confirm all checklist items before finalizing.");
        return;
      }

      sessionData.title = sessionName;
      sessionData.checklist = Array.from(checkboxes).map(cb => ({
        id: cb.id,
        label: cb.nextElementSibling.textContent,
        checked: cb.checked
      }));

      const formData = new FormData();
      formData.append("session_data", JSON.stringify(sessionData));

      fetch(`/researcher/finalize/?path=${encodeURIComponent(currentPath)}`, {
        method: "POST",
        body: formData,
        headers: {
          "X-CSRFToken": getCsrfToken(),
        },
      })
        .then((response) => response.json())
        .then((result) => {
          if (result.success) {
            finalizeModal.classList.add("hidden");
            alert("Session finalized successfully! Ready for Output Checker review.");
          } else {
            alert(`Error finalizing: ${result.message}`);
          }
        })
        .catch((error) => {
          alert(`Error finalizing: ${error}`);
          console.error(error);
        });
    });
  }

  function setupUploadZone() {
    const uploadZone = document.getElementById("uploadZone");
    const addModal = document.getElementById("addOutputModal");
    const fileInput = document.getElementById("addOutputFile");

    if (!uploadZone || !addModal || !fileInput) return;

    uploadZone.addEventListener("click", () => {
      addModal.classList.remove("hidden");
    });

    uploadZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      uploadZone.classList.add("border-blue-500", "bg-blue-100");
    });

    uploadZone.addEventListener("dragleave", () => {
      uploadZone.classList.remove("border-blue-500", "bg-blue-100");
    });

    uploadZone.addEventListener("drop", (e) => {
      e.preventDefault();
      uploadZone.classList.remove("border-blue-500", "bg-blue-100");
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(files[0]);
        fileInput.files = dataTransfer.files;

        const nameInput = document.getElementById("addOutputName");
        nameInput.value = files[0].name.split(".").slice(0, -1).join(".");

        addModal.classList.remove("hidden");
      }
    });
  }

  function setupOutputManagement() {
    const addModal = document.getElementById("addOutputModal");
    const editModal = document.getElementById("editOutputModal");
    const deleteModal = document.getElementById("deleteOutputModal");

    let currentEditOutput = null;
    let currentDeleteOutput = null;

    document
      .getElementById("cancelAddOutput")
      ?.addEventListener("click", () => {
        addModal.classList.add("hidden");
        document.getElementById("addOutputName").value = "";
        document.getElementById("addOutputFile").value = "";
      });

    document
      .getElementById("confirmAddOutput")
      ?.addEventListener("click", () => {
        const name = document.getElementById("addOutputName").value.trim();
        const type = document.getElementById("addOutputType").value;
        const file = document.getElementById("addOutputFile").files[0];

        if (!name || !file) {
          alert("Please provide a name and a file.");
          return;
        }

        const newOutputData = {
          uid: name,
          type: type,
          status: "review",
          properties: { method: file.type },
          files: [{ name: file.name }],
          comments: [],
          exception: null,
        };

        const formData = new FormData();
        formData.append("session_data", JSON.stringify(sessionData));
        formData.append("name", name);
        formData.append("data", JSON.stringify(newOutputData));
        formData.append("file", file);

        fetch(
          `/researcher/output/add/?path=${encodeURIComponent(currentPath)}`,
          {
            method: "POST",
            body: formData,
            headers: { "X-CSRFToken": getCsrfToken() },
          }
        )
          .then((response) => response.json())
          .then((result) => {
            if (result.success) {
              sessionData.results[name] = result.output_data;
              const outputList = document.getElementById("outputList");
              outputList.insertAdjacentHTML("beforeend", result.html);
              updateOutputCount();
              addModal.classList.add("hidden");
              document.getElementById("addOutputName").value = "";
              document.getElementById("addOutputFile").value = "";
            } else {
              alert(`Error: ${result.message}`);
            }
          })
          .catch((error) => alert(`Error: ${error}`));
      });

    document.addEventListener("click", (e) => {
      const target = e.target.closest(".edit-output-btn");
      if (target) {
        e.preventDefault();
        e.stopPropagation();
        currentEditOutput = target.dataset.outputName;
        document.getElementById("editOutputName").value = currentEditOutput;

        const currentData = sessionData.results[currentEditOutput];
        if (currentData && document.getElementById("editOutputType")) {
          document.getElementById("editOutputType").value = currentData.type || "custom";
        }

        editModal?.classList.remove("hidden");
      }
    });

    document
      .getElementById("cancelEditOutput")
      ?.addEventListener("click", () => {
        editModal?.classList.add("hidden");
        currentEditOutput = null;
      });

    document
      .getElementById("confirmEditOutput")
      ?.addEventListener("click", () => {
        const newName = document.getElementById("editOutputName").value.trim();
        const newType = document.getElementById("editOutputType").value;

        if (!newName) {
          alert("Please enter a name");
          return;
        }

        if (newName !== currentEditOutput && sessionData.results[newName]) {
          alert("An output with this name already exists");
          return;
        }

        const updatedData = { ...sessionData.results[currentEditOutput] };
        updatedData.type = newType;

        const formData = new FormData();
        formData.append("session_data", JSON.stringify(sessionData));
        formData.append("original_name", currentEditOutput);
        formData.append("new_name", newName);
        formData.append("data", JSON.stringify(updatedData));

        fetch(
          `/researcher/output/edit/?path=${encodeURIComponent(currentPath)}`,
          {
            method: "POST",
            body: formData,
            headers: { "X-CSRFToken": getCsrfToken() },
          }
        )
          .then((response) => response.json())
          .then((result) => {
            if (result.success) {
              sessionData.results[newName] = result.output_data || sessionData.results[currentEditOutput];
              delete sessionData.results[currentEditOutput];

              const item = document.querySelector(`li[data-output-name="${currentEditOutput}"]`);
              if (item) {
                item.setAttribute("data-output-name", newName);
                item.querySelector(".relative").textContent = newName;

                const typeDisplay = item.querySelector(".order-3 dd");
                if (typeDisplay) {
                  const method = sessionData.results[newName].properties?.method || "";
                  typeDisplay.textContent = `${method} ${sessionData.results[newName].type}`;
                }

                item.querySelectorAll("button").forEach(btn => btn.dataset.outputName = newName);
              }

              updateOutputCount();
              editModal?.classList.add("hidden");
              currentEditOutput = null;
            } else {
              alert(`Error: ${result.message}`);
            }
          })
          .catch((error) => alert(`Error: ${error}`));
      });

    document.addEventListener("click", (e) => {
      const target = e.target.closest(".delete-output-btn");
      if (target) {
        e.preventDefault();
        e.stopPropagation();
        currentDeleteOutput = target.dataset.outputName;
        document.getElementById("deleteOutputName").textContent = currentDeleteOutput;
        deleteModal?.classList.remove("hidden");
      }
    });

    document
      .getElementById("cancelDeleteOutput")
      ?.addEventListener("click", () => {
        deleteModal?.classList.add("hidden");
        currentDeleteOutput = null;
      });

    document
      .getElementById("confirmDeleteOutput")
      ?.addEventListener("click", () => {
        const outputName = currentDeleteOutput;
        const formData = new FormData();
        formData.append("session_data", JSON.stringify(sessionData));
        formData.append("name", outputName);

        fetch(
          `/researcher/output/delete/?path=${encodeURIComponent(currentPath)}`,
          {
            method: "POST",
            body: formData,
            headers: { "X-CSRFToken": getCsrfToken() },
          }
        )
          .then((response) => response.json())
          .then((result) => {
            if (result.success) {
              delete sessionData.results[outputName];
              const item = document.querySelector(`li[data-output-name="${outputName}"]`);
              if (item) item.remove();
              updateOutputCount();
              deleteModal?.classList.add("hidden");
              currentDeleteOutput = null;
            } else {
              alert(`Error: ${result.message}`);
            }
          })
          .catch((error) => alert(`Error: ${error}`));
      });
  }

  function getCsrfToken() {
    const name = "csrftoken";
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === `${name}=`) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }
});

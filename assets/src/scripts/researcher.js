import "../styles/index.css";
import outputs from "./_data";
import outputClick from "./_output-click";
import { getFileExt } from "./_utils";

/* eslint-disable no-use-before-define */
// Functions in this file are intentionally organised top-down (entry point
// first, helpers last) for readability. Hoisting handles the ordering at
// runtime; ESLint's no-use-before-define is disabled for the whole file.

// ─── Shared utilities (module-level, no DOM dependency) ──────────────────────

/**
 * Read the Django CSRF token from the session cookie.
 * Required by every mutating backend request.
 * @returns {string}
 */
function getCsrfToken() {
  const name = "csrftoken";
  if (document.cookie) {
    const match = document.cookie
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${name}=`));
    if (match) return decodeURIComponent(match.split("=")[1]);
  }
  return "";
}

/**
 * POST to a Django API endpoint and return the parsed JSON response.
 * All researcher backend writes go through here — no direct filesystem access.
 *
 * @param {string} url - Relative URL including query string
 * @param {FormData} formData
 * @returns {Promise<object>} Parsed JSON body
 * @throws {Error} On network failure, non-ok status, or `success: false`
 */
async function apiPost(url, formData) {
  const response = await fetch(url, {
    method: "POST",
    body: formData,
    headers: { "X-CSRFToken": getCsrfToken() },
  });

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Server error ${response.status}`);
  }

  if (!response.ok || !data.success) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }

  return data;
}

/**
 * Disable a button and swap its label while a request is in flight.
 * Returns a restore function — always call it in a `finally` block.
 *
 * @param {HTMLButtonElement} btn
 * @param {string} [loadingText]
 * @returns {() => void}
 */
function setButtonLoading(btn, loadingText = "Saving…") {
  const original = btn.textContent;
  btn.disabled = true; // eslint-disable-line no-param-reassign
  btn.textContent = loadingText; // eslint-disable-line no-param-reassign
  btn.classList.add("opacity-75", "cursor-not-allowed");
  return () => {
    btn.disabled = false; // eslint-disable-line no-param-reassign
    btn.textContent = original; // eslint-disable-line no-param-reassign
    btn.classList.remove("opacity-75", "cursor-not-allowed");
  };
}

/**
 * Show a small inline status message immediately after `anchor`.
 * Success messages auto-dismiss after 4 s; errors stay until next action.
 *
 * @param {HTMLElement} anchor
 * @param {string} message
 * @param {'success'|'error'} [type]
 */
function showInlineStatus(anchor, message, type = "success") {
  anchor.parentElement
    .querySelectorAll(".sacro-inline-status")
    .forEach((el) => el.remove());

  const el = document.createElement("p");
  el.className = `sacro-inline-status text-sm mt-1 ${
    type === "error" ? "text-red-600" : "text-green-700"
  }`;
  el.setAttribute("role", "status");
  el.textContent = message;
  anchor.insertAdjacentElement("afterend", el);

  if (type === "success") {
    setTimeout(() => el.remove(), 4000);
  }
}

// ─────────────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
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

      const hasDocumentFiles =
        metadata.files &&
        metadata.files.some((file) => {
          const ext = getFileExt(file.name);
          return ext === "pdf" || ext === "docx" || ext === "txt";
        });

      const exceptionLabel = document.querySelector(
        'label[for="exceptionRequest"]'
      );
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
        exceptionTextarea.value =
          sessionData.results[outputName].exception || "";
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
        const index = parseInt(e.target.dataset.index, 10);
        editComment(outputName, index);
      });
    });

    commentsContainer.querySelectorAll(".delete-comment").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const index = parseInt(e.target.dataset.index, 10);
        deleteComment(outputName, index);
      });
    });

    if (viewAllBtn) {
      if (comments.length > 0) {
        viewAllBtn.textContent =
          comments.length > 3 ? `View All (${comments.length})` : "View All";
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

    if (!addCommentBtn || !commentTextarea) return;

    addCommentBtn.addEventListener("click", () => {
      const commentText = commentTextarea.value.trim();
      if (!commentText) {
        showInlineStatus(addCommentBtn, "Please enter a comment.", "error");
        return;
      }

      const selectedOutput = getCurrentlySelectedOutput();
      if (!selectedOutput) {
        showInlineStatus(
          addCommentBtn,
          "Please select an output first.",
          "error"
        );
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
      } else {
        sessionData.results[selectedOutput].comments.push(commentText);
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

    if (!addExceptionBtn || !exceptionTextarea) return;

    addExceptionBtn.addEventListener("click", () => {
      const exceptionText = exceptionTextarea.value.trim();
      if (!exceptionText) {
        showInlineStatus(
          addExceptionBtn,
          "Please enter an exception request.",
          "error"
        );
        return;
      }

      const selectedOutput = getCurrentlySelectedOutput();
      if (!selectedOutput) {
        showInlineStatus(
          addExceptionBtn,
          "Please select an output first.",
          "error"
        );
        return;
      }

      sessionData.results[selectedOutput].exception = exceptionText;
      exceptionTextarea.value = "";
      updateExceptionDisplay(selectedOutput);
    });
  }

  function setupViewAllCommentsButton() {
    const viewAllBtn = document.querySelector(
      '[data-sacro-el="viewAllCommentsBtn"]'
    );
    if (!viewAllBtn) return;

    viewAllBtn.addEventListener("click", (e) => {
      e.preventDefault();

      const selectedOutput = getCurrentlySelectedOutput();
      if (!selectedOutput) return;

      const comments = sessionData.results[selectedOutput]?.comments || [];
      const modal = document.getElementById("commentsModal");
      const commentsList = document.getElementById("allCommentsList");

      if (!modal || !commentsList) return;

      renderModalCommentsList(commentsList, comments, selectedOutput, modal);
      modal.classList.remove("hidden");
    });
  }

  function renderModalCommentsList(
    commentsListEl,
    comments,
    outputName,
    modal
  ) {
    const list = commentsListEl;
    list.innerHTML = "";
    comments.forEach((comment, index) => {
      const div = document.createElement("div");
      div.className =
        "p-3 bg-gray-50 rounded flex justify-between items-start gap-2";
      div.innerHTML = `
        <div class="flex-1">
          <p class="text-sm font-medium text-gray-900">Comment ${index + 1}</p>
          <p class="text-sm text-gray-700 mt-1">${comment}</p>
        </div>
        <div class="flex gap-2">
          <button class="edit-comment-modal text-xs text-blue-600 hover:text-blue-800" data-index="${index}">Edit</button>
          <button class="delete-comment-modal text-xs text-red-600 hover:text-red-800" data-index="${index}">Delete</button>
        </div>
      `;
      list.appendChild(div);
    });

    list.querySelectorAll(".edit-comment-modal").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const index = parseInt(e.target.dataset.index, 10);
        modal.classList.add("hidden");
        editComment(outputName, index);
      });
    });

    list.querySelectorAll(".delete-comment-modal").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const index = parseInt(e.target.dataset.index, 10);
        deleteComment(outputName, index);
        const updated = sessionData.results[outputName]?.comments || [];
        renderModalCommentsList(list, updated, outputName, modal);
      });
    });
  }

  function setupModalClose() {
    const modals = document.querySelectorAll(
      "#commentsModal, #addOutputModal, #editOutputModal, #deleteOutputModal, #finalizeSessionModal"
    );
    modals.forEach((modal) => {
      if (!modal) return;

      modal.querySelector(".cancel")?.addEventListener("click", () => {
        modal.classList.add("hidden");
      });

      modal.querySelector(".close-x")?.addEventListener("click", () => {
        modal.classList.add("hidden");
      });

      modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.classList.add("hidden");
      });
    });
  }

  function setupSaveDraftButton() {
    const saveDraftBtn = document.getElementById("saveDraftBtn");
    if (!saveDraftBtn) return;

    saveDraftBtn.addEventListener("click", async () => {
      const restoreBtn = setButtonLoading(saveDraftBtn, "Saving…");
      const formData = new FormData();
      formData.append("session_data", JSON.stringify(sessionData));

      try {
        await apiPost(
          `/researcher/session/save/?path=${encodeURIComponent(currentPath)}`,
          formData
        );
        showInlineStatus(saveDraftBtn, "Draft saved.", "success");
      } catch (err) {
        showInlineStatus(saveDraftBtn, `Save failed: ${err.message}`, "error");
      } finally {
        restoreBtn();
      }
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
  }

  function deleteComment(outputName, index) {
    const comments = sessionData.results[outputName]?.comments || [];
    if (index < 0 || index >= comments.length) return;

    // eslint-disable-next-line no-alert
    if (!window.confirm("Are you sure you want to delete this comment?"))
      return;

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
      editingCommentIndex -= 1;
    }

    updateCommentsDisplay(outputName);
  }

  function setupFinalizeButton() {
    const finalizeBtn = document.getElementById("finalizeBtn");
    const finalizeModal = document.getElementById("finalizeSessionModal");
    const confirmFinalizeBtn = document.getElementById("confirmFinalize");

    if (!finalizeBtn || !finalizeModal) return;

    finalizeBtn.addEventListener("click", () => {
      document.getElementById("finalizeSessionName").value =
        sessionData.title || "";
      document
        .querySelectorAll("#finalizeSessionModal input[type='checkbox']")
        .forEach((cb) => {
          cb.checked = false; // eslint-disable-line no-param-reassign
        });
      finalizeModal.classList.remove("hidden");
    });

    document.getElementById("cancelFinalize")?.addEventListener("click", () => {
      finalizeModal.classList.add("hidden");
    });

    confirmFinalizeBtn?.addEventListener("click", async () => {
      const sessionName = document
        .getElementById("finalizeSessionName")
        .value.trim();
      const checkboxes = document.querySelectorAll(
        "#finalizeSessionModal input[type='checkbox']"
      );
      const allChecked = Array.from(checkboxes).every((cb) => cb.checked);

      if (!sessionName) {
        showInlineStatus(
          confirmFinalizeBtn,
          "Please enter a Session Name.",
          "error"
        );
        return;
      }

      if (!allChecked) {
        showInlineStatus(
          confirmFinalizeBtn,
          "Please confirm all checklist items before finalizing.",
          "error"
        );
        return;
      }

      sessionData.title = sessionName;
      sessionData.checklist = Array.from(checkboxes).map((cb) => ({
        id: cb.id,
        label: cb.nextElementSibling.textContent.trim(),
        checked: cb.checked,
      }));

      const restoreBtn = setButtonLoading(confirmFinalizeBtn, "Finalizing…");
      const formData = new FormData();
      formData.append("session_data", JSON.stringify(sessionData));

      try {
        await apiPost(
          `/researcher/finalize/?path=${encodeURIComponent(currentPath)}`,
          formData
        );
        // Show success message inside the modal, then redirect to role selection
        showInlineStatus(
          confirmFinalizeBtn,
          "Session finalized successfully. Returning to the home screen…",
          "success"
        );
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
      } catch (err) {
        showInlineStatus(
          confirmFinalizeBtn,
          `Finalize failed: ${err.message}`,
          "error"
        );
        restoreBtn();
      }
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
      const [file] = e.dataTransfer.files;
      if (file) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;
        document.getElementById("addOutputName").value = file.name
          .split(".")
          .slice(0, -1)
          .join(".");
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

    // ── Add output ────────────────────────────────────────────────────────────

    document
      .getElementById("cancelAddOutput")
      ?.addEventListener("click", () => {
        addModal.classList.add("hidden");
        document.getElementById("addOutputName").value = "";
        document.getElementById("addOutputFile").value = "";
      });

    document
      .getElementById("confirmAddOutput")
      ?.addEventListener("click", async () => {
        const name = document.getElementById("addOutputName").value.trim();
        const type = document.getElementById("addOutputType").value;
        const file = document.getElementById("addOutputFile").files[0];
        const confirmBtn = document.getElementById("confirmAddOutput");

        if (!name || !file) {
          showInlineStatus(
            confirmBtn,
            "Please provide a name and a file.",
            "error"
          );
          return;
        }

        const newOutputData = {
          uid: name,
          type,
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

        const restoreBtn = setButtonLoading(confirmBtn, "Adding…");
        try {
          const result = await apiPost(
            `/researcher/output/add/?path=${encodeURIComponent(currentPath)}`,
            formData
          );
          sessionData.results[name] = result.output_data;
          document
            .getElementById("outputList")
            .insertAdjacentHTML("beforeend", result.html);
          updateOutputCount();
          addModal.classList.add("hidden");
          document.getElementById("addOutputName").value = "";
          document.getElementById("addOutputFile").value = "";
        } catch (err) {
          showInlineStatus(confirmBtn, `Error: ${err.message}`, "error");
        } finally {
          restoreBtn();
        }
      });

    // ── Edit output ───────────────────────────────────────────────────────────

    document.addEventListener("click", (e) => {
      const target = e.target.closest(".edit-output-btn");
      if (!target) return;
      e.preventDefault();
      e.stopPropagation();
      currentEditOutput = target.dataset.outputName;
      document.getElementById("editOutputName").value = currentEditOutput;
      const currentData = sessionData.results[currentEditOutput];
      if (currentData && document.getElementById("editOutputType")) {
        document.getElementById("editOutputType").value =
          currentData.type || "custom";
      }
      editModal?.classList.remove("hidden");
    });

    document
      .getElementById("cancelEditOutput")
      ?.addEventListener("click", () => {
        editModal?.classList.add("hidden");
        currentEditOutput = null;
      });

    document
      .getElementById("confirmEditOutput")
      ?.addEventListener("click", async () => {
        const newName = document.getElementById("editOutputName").value.trim();
        const newType = document.getElementById("editOutputType").value;
        const confirmBtn = document.getElementById("confirmEditOutput");

        if (!newName) {
          showInlineStatus(confirmBtn, "Please enter a name.", "error");
          return;
        }
        if (newName !== currentEditOutput && sessionData.results[newName]) {
          showInlineStatus(
            confirmBtn,
            "An output with this name already exists.",
            "error"
          );
          return;
        }

        const updatedData = {
          ...sessionData.results[currentEditOutput],
          type: newType,
        };
        const formData = new FormData();
        formData.append("session_data", JSON.stringify(sessionData));
        formData.append("original_name", currentEditOutput);
        formData.append("new_name", newName);
        formData.append("data", JSON.stringify(updatedData));

        const restoreBtn = setButtonLoading(confirmBtn, "Saving…");
        try {
          const result = await apiPost(
            `/researcher/output/edit/?path=${encodeURIComponent(currentPath)}`,
            formData
          );
          sessionData.results[newName] =
            result.output_data || sessionData.results[currentEditOutput];
          delete sessionData.results[currentEditOutput];

          const item = document.querySelector(
            `li[data-output-name="${currentEditOutput}"]`
          );
          if (item) {
            item.setAttribute("data-output-name", newName);
            item.querySelector(".relative").textContent = newName;
            const typeDisplay = item.querySelector(".order-3 dd");
            if (typeDisplay) {
              const method =
                sessionData.results[newName].properties?.method || "";
              typeDisplay.textContent = `${method} ${sessionData.results[newName].type}`;
            }
            item.querySelectorAll("button").forEach((btn) => {
              btn.dataset.outputName = newName; // eslint-disable-line no-param-reassign
            });
          }

          updateOutputCount();
          editModal?.classList.add("hidden");
          currentEditOutput = null;
        } catch (err) {
          showInlineStatus(confirmBtn, `Error: ${err.message}`, "error");
        } finally {
          restoreBtn();
        }
      });

    // ── Delete output ─────────────────────────────────────────────────────────

    document.addEventListener("click", (e) => {
      const target = e.target.closest(".delete-output-btn");
      if (!target) return;
      e.preventDefault();
      e.stopPropagation();
      currentDeleteOutput = target.dataset.outputName;
      document.getElementById("deleteOutputName").textContent =
        currentDeleteOutput;
      deleteModal?.classList.remove("hidden");
    });

    document
      .getElementById("cancelDeleteOutput")
      ?.addEventListener("click", () => {
        deleteModal?.classList.add("hidden");
        currentDeleteOutput = null;
      });

    document
      .getElementById("confirmDeleteOutput")
      ?.addEventListener("click", async () => {
        const outputName = currentDeleteOutput;
        const confirmBtn = document.getElementById("confirmDeleteOutput");
        const formData = new FormData();
        formData.append("session_data", JSON.stringify(sessionData));
        formData.append("name", outputName);

        const restoreBtn = setButtonLoading(confirmBtn, "Deleting…");
        try {
          await apiPost(
            `/researcher/output/delete/?path=${encodeURIComponent(
              currentPath
            )}`,
            formData
          );
          delete sessionData.results[outputName];
          document
            .querySelector(`li[data-output-name="${outputName}"]`)
            ?.remove();
          updateOutputCount();
          deleteModal?.classList.add("hidden");
          currentDeleteOutput = null;
        } catch (err) {
          showInlineStatus(confirmBtn, `Error: ${err.message}`, "error");
        } finally {
          restoreBtn();
        }
      });
  }

  setupResearcherInterface();
});

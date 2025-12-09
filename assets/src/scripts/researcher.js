import "../styles/index.css";
import outputClick from "./_output-click";
import outputs from "./_data";

document.addEventListener("DOMContentLoaded", () => {
  console.log("Researcher JS loaded");

  const currentPath = JSON.parse(document.getElementById("currentPath").textContent);
  const version = JSON.parse(document.getElementById("outputVersion").textContent);
  const config = JSON.parse(document.getElementById("outputConfig").textContent);

  let sessionData = {
    version: version,
    config: config,
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

  function setupResearcherInterface() {
    setupOutputList();
    setupAddCommentButton();
    setupAddExceptionButton();
    setupViewAllCommentsButton();
    setupModalClose();
    setupSaveDraftButton();
    setupFinalizeButton();
    setupOutputManagement();
  }

  function setupOutputList() {
    const outputItems = document.querySelectorAll('#outputList li');
    const form = document.querySelector('#researcherForm form');

    outputItems.forEach(item => {
      item.addEventListener('click', async (e) => {
        if (e.target.classList.contains('edit-output-btn') || e.target.classList.contains('delete-output-btn')) {
          return;
        }

        const outputName = item.getAttribute('data-output-name');
        const metadata = outputs[outputName];


        await outputClick({ outputName, metadata });


        outputItems.forEach(el => el.classList.remove('bg-blue-50'));
        item.classList.add('bg-blue-50');


        if (form) form.style.display = 'grid';


        updateCommentsDisplay(outputName);
        updateExceptionDisplay(outputName);


        const exceptionTextarea = document.querySelector('[data-sacro-el="researcher-exception-request"]');
        if (exceptionTextarea) {
          exceptionTextarea.value = sessionData.results[outputName].exception || '';
        }
      });
    });
  }

  function getCurrentlySelectedOutput() {
    const selectedItem = document.querySelector('#outputList li.bg-blue-50');
    return selectedItem ? selectedItem.getAttribute('data-output-name') : null;
  }

  function updateCommentsDisplay(outputName) {
    const commentsContainer = document.querySelector('[data-sacro-el="outputDetailsComments"]');
    const viewAllBtn = document.querySelector('[data-sacro-el="viewAllCommentsBtn"]');
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


    commentsContainer.querySelectorAll('.edit-comment').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        editComment(outputName, index);
      });
    });

    commentsContainer.querySelectorAll('.delete-comment').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        deleteComment(outputName, index);
      });
    });


    if (viewAllBtn) {
      if (comments.length > 3) {
        viewAllBtn.textContent = `View All (${comments.length})`;
        viewAllBtn.style.display = 'inline-block';
      } else if (comments.length > 0) {
        viewAllBtn.textContent = 'View All';
        viewAllBtn.style.display = 'inline-block';
      } else {
        viewAllBtn.style.display = 'none';
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
    const exceptionContainer = document.querySelector('[data-sacro-el="outputExceptionRequest"]');
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
    const addCommentBtn = document.querySelector('[data-sacro-el="researcher-add-comment-btn"]');
    const commentTextarea = document.querySelector('[data-sacro-el="researcher-new-comment"]');

    console.log('Setup add comment:', { btn: !!addCommentBtn, textarea: !!commentTextarea });

    if (!addCommentBtn || !commentTextarea) return;

    addCommentBtn.addEventListener("click", () => {
      console.log('Add/Edit comment clicked');
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

        sessionData.results[selectedOutput].comments[editingCommentIndex] = commentText;
        editingCommentIndex = null;
        addCommentBtn.textContent = 'Add Comment';
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
    const addExceptionBtn = document.querySelector('[data-sacro-el="researcher-add-exception-btn"]');
    const exceptionTextarea = document.querySelector('[data-sacro-el="researcher-exception-request"]');

    console.log('Setup add exception:', { btn: !!addExceptionBtn, textarea: !!exceptionTextarea });

    if (!addExceptionBtn || !exceptionTextarea) return;

    addExceptionBtn.addEventListener("click", () => {
      console.log('Add exception clicked');
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
      console.log("Exception added to", selectedOutput, sessionData.results[selectedOutput].exception);
    });
  }

  function setupViewAllCommentsButton() {
    const viewAllBtn = document.querySelector('[data-sacro-el="viewAllCommentsBtn"]');
    console.log('Setup view all:', { btn: !!viewAllBtn });

    if (!viewAllBtn) return;

    viewAllBtn.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('View all clicked');

      const selectedOutput = getCurrentlySelectedOutput();
      if (!selectedOutput) return;

      const comments = sessionData.results[selectedOutput]?.comments || [];
      const modal = document.getElementById('commentsModal');
      const commentsList = document.getElementById('allCommentsList');

      console.log('Modal elements:', { modal: !!modal, list: !!commentsList, comments: comments.length });

      if (!modal || !commentsList) return;

      commentsList.innerHTML = '';
      comments.forEach((comment, index) => {
        const div = document.createElement('div');
        div.className = 'p-3 bg-gray-50 rounded flex justify-between items-start gap-2';
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
        commentsList.appendChild(div);
      });


      commentsList.querySelectorAll('.edit-comment-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const index = parseInt(e.target.dataset.index);
          modal.classList.add('hidden');
          editComment(selectedOutput, index);
        });
      });

      commentsList.querySelectorAll('.delete-comment-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const index = parseInt(e.target.dataset.index);
          deleteComment(selectedOutput, index);

          const updatedComments = sessionData.results[selectedOutput]?.comments || [];
          commentsList.innerHTML = '';
          updatedComments.forEach((comment, idx) => {
            const div = document.createElement('div');
            div.className = 'p-3 bg-gray-50 rounded flex justify-between items-start gap-2';
            div.innerHTML = `
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-900">Comment ${idx + 1}</p>
                <p class="text-sm text-gray-700 mt-1">${comment}</p>
              </div>
              <div class="flex gap-2">
                <button class="edit-comment-modal text-xs text-blue-600 hover:text-blue-800" data-index="${idx}">Edit</button>
                <button class="delete-comment-modal text-xs text-red-600 hover:text-red-800" data-index="${idx}">Delete</button>
              </div>
            `;
            commentsList.appendChild(div);
          });


          commentsList.querySelectorAll('.edit-comment-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
              const index = parseInt(e.target.dataset.index);
              modal.classList.add('hidden');
              editComment(selectedOutput, index);
            });
          });

          commentsList.querySelectorAll('.delete-comment-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
              const index = parseInt(e.target.dataset.index);
              deleteComment(selectedOutput, index);
            });
          });
        });
      });

      modal.classList.remove('hidden');
      console.log('Modal shown');
    });
  }

  function setupModalClose() {
    const modal = document.getElementById('commentsModal');
    if (!modal) return;

    const closeBtn = modal.querySelector('.cancel');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
      });
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });
  }

  function setupSaveDraftButton() {
    const saveDraftBtn = document.getElementById("saveDraftBtn");
    if (!saveDraftBtn) return;

    saveDraftBtn.addEventListener("click", () => {
      console.log('Save draft clicked', sessionData);
      const formData = new FormData();
      formData.append("session_data", JSON.stringify(sessionData));

      fetch(`/researcher/session/save/?path=${encodeURIComponent(currentPath)}`, {
        method: "POST",
        body: formData,
        headers: {
          "X-CSRFToken": getCsrfToken(),
        },
      })
        .then((response) => response.json())
        .then((result) => {
          if (result.success) {
            alert("Draft saved successfully!");
          } else {
            alert("Error saving draft: " + result.message);
          }
        })
        .catch((error) => {
          alert("Error saving draft: " + error);
          console.error(error);
        });
    });
  }

  function editComment(outputName, index) {
    const comments = sessionData.results[outputName]?.comments || [];
    const currentComment = comments[index];
    if (!currentComment) return;

    const commentTextarea = document.querySelector('[data-sacro-el="researcher-new-comment"]');
    const addCommentBtn = document.querySelector('[data-sacro-el="researcher-add-comment-btn"]');

    if (!commentTextarea || !addCommentBtn) return;


    commentTextarea.value = currentComment;
    commentTextarea.focus();


    addCommentBtn.textContent = 'Update Comment';
    editingCommentIndex = index;

    console.log('Editing comment:', outputName, index, currentComment);
  }

  function deleteComment(outputName, index) {
    const comments = sessionData.results[outputName]?.comments || [];
    if (index < 0 || index >= comments.length) return;

    if (confirm('Are you sure you want to delete this comment?')) {
      sessionData.results[outputName].comments.splice(index, 1);


      if (editingCommentIndex === index) {
        editingCommentIndex = null;
        const addCommentBtn = document.querySelector('[data-sacro-el="researcher-add-comment-btn"]');
        const commentTextarea = document.querySelector('[data-sacro-el="researcher-new-comment"]');
        if (addCommentBtn) addCommentBtn.textContent = 'Add Comment';
        if (commentTextarea) commentTextarea.value = '';
      } else if (editingCommentIndex !== null && editingCommentIndex > index) {

        editingCommentIndex--;
      }

      updateCommentsDisplay(outputName);
      console.log('Comment deleted:', outputName, index);
    }
  }

  function setupFinalizeButton() {
    const finalizeBtn = document.getElementById("finalizeBtn");
    if (!finalizeBtn) return;

    finalizeBtn.addEventListener("click", () => {
      if (!confirm("Are you sure you want to finalize?")) return;

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
            alert("Session finalized successfully!");
          } else {
            alert("Error finalizing: " + result.message);
          }
        })
        .catch((error) => {
          alert("Error finalizing: " + error);
          console.error(error);
        });
    });
  }

  function setupOutputManagement() {
    const addBtn = document.getElementById('addOutputBtn');
    const addModal = document.getElementById('addOutputModal');
    const editModal = document.getElementById('editOutputModal');
    const deleteModal = document.getElementById('deleteOutputModal');

    let currentEditOutput = null;
    let currentDeleteOutput = null;


    if (addBtn) {
      addBtn.addEventListener('click', () => {
        addModal.classList.remove('hidden');
      });
    }

    document.getElementById('cancelAddOutput')?.addEventListener('click', () => {
      addModal.classList.add('hidden');
      document.getElementById('addOutputName').value = '';
      document.getElementById('addOutputFile').value = '';
    });

    document.getElementById('confirmAddOutput')?.addEventListener('click', () => {
      const name = document.getElementById('addOutputName').value.trim();
      const file = document.getElementById('addOutputFile').files[0];

      if (!name) {
        alert('Please enter an output name');
        return;
      }

      if (!file) {
        alert('Please select a file');
        return;
      }


      sessionData.results[name] = {
        type: 'custom',
        status: 'review',
        properties: { method: file.type },
        files: [file.name],
        comments: [],
        exception: null
      };


      refreshOutputList();
      addModal.classList.add('hidden');
      document.getElementById('addOutputName').value = '';
      document.getElementById('addOutputFile').value = '';

      console.log('Added output:', name);
    });


    document.addEventListener('click', (e) => {
      console.log('Click detected on:', e.target, 'Classes:', e.target.classList.toString());
      if (e.target.classList.contains('edit-output-btn')) {
        console.log('Edit button clicked!');
        e.preventDefault();
        e.stopPropagation();
        currentEditOutput = e.target.dataset.outputName;
        document.getElementById('editOutputName').value = currentEditOutput;
        editModal?.classList.remove('hidden');
      }
    });

    document.getElementById('cancelEditOutput')?.addEventListener('click', () => {
      editModal?.classList.add('hidden');
      currentEditOutput = null;
    });

    document.getElementById('confirmEditOutput')?.addEventListener('click', () => {
      const newName = document.getElementById('editOutputName').value.trim();

      if (!newName) {
        alert('Please enter a name');
        return;
      }

      if (newName !== currentEditOutput && sessionData.results[newName]) {
        alert('An output with this name already exists');
        return;
      }


      if (newName !== currentEditOutput) {
        sessionData.results[newName] = sessionData.results[currentEditOutput];
        delete sessionData.results[currentEditOutput];
      }

      refreshOutputList();
      editModal?.classList.add('hidden');
      currentEditOutput = null;

      console.log('Renamed output to:', newName);
    });


    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('delete-output-btn')) {
        console.log('Delete button clicked!');
        e.preventDefault();
        e.stopPropagation();
        currentDeleteOutput = e.target.dataset.outputName;
        document.getElementById('deleteOutputName').textContent = currentDeleteOutput;
        deleteModal?.classList.remove('hidden');
      }
    });

    document.getElementById('cancelDeleteOutput')?.addEventListener('click', () => {
      deleteModal?.classList.add('hidden');
      currentDeleteOutput = null;
    });

    document.getElementById('confirmDeleteOutput')?.addEventListener('click', () => {
      delete sessionData.results[currentDeleteOutput];
      refreshOutputList();
      deleteModal?.classList.add('hidden');
      currentDeleteOutput = null;

      console.log('Deleted output:', currentDeleteOutput);
    });
  }

  function refreshOutputList() {
    const outputList = document.getElementById('outputList');
    if (!outputList) return;

    outputList.innerHTML = '';

    Object.keys(sessionData.results).forEach(name => {
      const output = sessionData.results[name];
      const li = document.createElement('li');
      li.className = `relative group py-0.5 px-1 hover:bg-slate-50 ${
        output.status === 'fail' ? 'text-red-800' :
        output.status === 'pass' ? 'text-blue-800' : 'text-fuchsia-900'
      }`;
      li.setAttribute('data-output-name', name);

      li.innerHTML = `
        <dl class="flex flex-row gap-x-2 items-center" aria-label="Output information">
          <div class="order-2 cursor-pointer flex-1">
            <dt class="sr-only">Output name:</dt>
            <dd>
              <a class="before:absolute before:inset-0 before:right-20 before:h-full">
                <span class="relative">${name}</span>
              </a>
            </dd>
          </div>
          <div class="order-1">
            <dt class="sr-only">ACRO status:</dt>
            <dd>
              <span class="sr-only">${output.status}</span>
              <span class="h-5 w-5">${output.status === 'fail' ? '❌' : output.status === 'pass' ? '📄' : '❓'}</span>
            </dd>
          </div>
          <div class="order-3 ml-auto text-right">
            <dt class="sr-only">Output type:</dt>
            <dd>${output.properties?.method || ''} ${output.type}</dd>
          </div>
          <div class="order-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" style="z-index: 10; position: relative;">
            <button class="edit-output-btn w-7 h-7 border border-gray-300 bg-white rounded cursor-pointer flex items-center justify-center text-sm hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors" data-output-name="${name}" title="Edit">✏️</button>
            <button class="delete-output-btn w-7 h-7 border border-gray-300 bg-white rounded cursor-pointer flex items-center justify-center text-sm hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors" data-output-name="${name}" title="Delete">🗑️</button>
          </div>
        </dl>
      `;

      outputList.appendChild(li);
    });

    setupOutputList();
  }

  function getCsrfToken() {
    const name = "csrftoken";
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === name + "=") {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }
});

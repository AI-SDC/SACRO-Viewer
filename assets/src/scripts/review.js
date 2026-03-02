import "../styles/review.css";

/**
 * Handle the server-side "Save approved outputs" form so the page stays
 * responsive and gives the user clear feedback instead of doing a full
 * POST/redirect that would just return JSON.
 *
 * Only wired up when the form is present in the DOM (i.e. SACRO_OUTPUT_DIR
 * is configured and the server_side_output flag is set in the template).
 */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("[data-sacro-el='writeOutputsForm']");
  if (!form) return; // Electron / desktop path — nothing to do here

  const btn = document.getElementById("writeOutputsBtn");
  const statusEl = document.getElementById("writeOutputsStatus");
  const successMsg = form.dataset.sacroWriteSuccessMsg;
  const errorMsg = form.dataset.sacroWriteErrorMsg;

  function getCsrfToken() {
    const cookie = document.cookie
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("csrftoken="));
    return cookie ? decodeURIComponent(cookie.split("=")[1]) : "";
  }

  function setStatus(message, isError) {
    statusEl.textContent = message;
    statusEl.classList.remove("hidden", "text-green-700", "text-red-600");
    statusEl.classList.add(isError ? "text-red-600" : "text-green-700");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const originalLabel = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Saving…";

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { "X-CSRFToken": getCsrfToken() },
      });

      const data = await response.json();

      if (data.success) {
        setStatus(successMsg, false);
        btn.textContent = "Saved ✓";
      } else {
        setStatus(`${errorMsg} (${data.message})`, true);
        btn.disabled = false;
        btn.textContent = originalLabel;
      }
    } catch (err) {
      setStatus(`${errorMsg} (${err.message})`, true);
      btn.disabled = false;
      btn.textContent = originalLabel;
    }
  });
});

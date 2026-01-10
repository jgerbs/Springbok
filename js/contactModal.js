// Contact

// =========================
// Contact "Send a Message" Modal
// =========================
(() => {
  const openBtn = document.getElementById("sendMessageBtn");
  const modal = document.getElementById("contactModal");
  const form = document.getElementById("contactForm");

  if (!openBtn || !modal) return;

  const dialog = modal.querySelector(".modal-dialog");
  const focusablesSel =
    'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])';

  let lastFocus = null;
  let autoCloseTimer = null;

  function openModal() {
    lastFocus = document.activeElement;

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    const firstInput = modal.querySelector("input, textarea, select, button");
    firstInput?.focus();

    // auto-close after a bit ONLY if user hasn't started typing
    clearTimeout(autoCloseTimer);
    autoCloseTimer = setTimeout(() => {
      const dirty =
        form &&
        Array.from(form.querySelectorAll("input, textarea")).some(
          (el) => el.value && el.value.trim().length > 0
        );

      if (!dirty) closeModal();
    }, 14000);
  }

  function closeModal() {
    clearTimeout(autoCloseTimer);

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  // Open
  openBtn.addEventListener("click", (e) => {
    e.preventDefault();
    openModal();
  });

  // Click backdrop or X or Cancel
  modal.addEventListener("click", (e) => {
    const t = e.target;
    if (t?.dataset?.close === "true") closeModal();
  });

  // ESC + focus trap
  document.addEventListener("keydown", (e) => {
    if (!modal.classList.contains("is-open")) return;

    if (e.key === "Escape") {
      e.preventDefault();
      closeModal();
      return;
    }

    if (e.key === "Tab") {
      const focusables = Array.from(dialog.querySelectorAll(focusablesSel));
      if (!focusables.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  // Fake send (matches your “leave it up for a bit” behavior)
  form?.addEventListener("submit", (e) => {
    e.preventDefault();

    const sendBtn = form.querySelector('button[type="submit"]');
    const cancelBtn = form.querySelector('button[data-close="true"]');

    // prevent double submit
    sendBtn && (sendBtn.disabled = true);
    cancelBtn && (cancelBtn.disabled = true);

    const prevText = sendBtn ? sendBtn.textContent : "";

    if (sendBtn) sendBtn.textContent = "Sending…";

  // keep modal up briefly, then show sent, then close
  setTimeout(() => {
    if (sendBtn) sendBtn.textContent = "Sent ✓";

    // ⬇️ INCREASE THIS DURATION (milliseconds)
    setTimeout(() => {
      closeModal();
      form.reset();

      if (sendBtn) {
        sendBtn.textContent = prevText;
        sendBtn.disabled = false;
      }
      if (cancelBtn) cancelBtn.disabled = false;
    }, 3000); // was 1100
  }, 900); // slight pause before showing "Sent ✓"

  });
})();

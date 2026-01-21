(() => {
  const modal = document.getElementById("doctorModal");
  if (!modal) return;

  const openBtns = document.querySelectorAll("[data-open-doctor-modal]");
  const closeEls = modal.querySelectorAll('[data-close="true"]');

  const form = document.getElementById("doctorContactForm");
  const doctorHidden = document.getElementById("doctorSelect"); // hidden input
  const apptHidden = document.getElementById("apptTypeSelect"); // hidden input

  let lastFocus = null;

  // ---------- Custom dropdown wiring ----------
  const dropdowns = modal.querySelectorAll(".field-dd[data-dd]");

  const closeAllDropdowns = () => {
    dropdowns.forEach((dd) => {
      dd.classList.remove("is-open");
      const btn = dd.querySelector(".dd-btn");
      btn?.setAttribute("aria-expanded", "false");
    });
  };

  const setDropdownValue = (dd, val) => {
    const hidden = dd.querySelector('input[type="hidden"]');
    const valueEl = dd.querySelector(".dd-value");
    const opts = dd.querySelectorAll(".dd-opt");

    hidden.value = val;
    valueEl.textContent = val;

    opts.forEach((o) =>
      o.setAttribute("aria-selected", o.dataset.value === val ? "true" : "false")
    );

    // Let HTML form validation see it as changed
    hidden.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const resetDropdown = (dd) => {
    const hidden = dd.querySelector('input[type="hidden"]');
    const valueEl = dd.querySelector(".dd-value");
    const opts = dd.querySelectorAll(".dd-opt");

    hidden.value = "";
    valueEl.textContent = "Select one";
    opts.forEach((o) => o.setAttribute("aria-selected", "false"));
  };

  dropdowns.forEach((dd) => {
    const btn = dd.querySelector(".dd-btn");
    const opts = dd.querySelectorAll(".dd-opt");

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const willOpen = !dd.classList.contains("is-open");
      closeAllDropdowns();
      dd.classList.toggle("is-open", willOpen);
      btn.setAttribute("aria-expanded", willOpen ? "true" : "false");
    });

    opts.forEach((o) => {
      o.addEventListener("click", () => {
        setDropdownValue(dd, o.dataset.value);
        dd.classList.remove("is-open");
        btn.setAttribute("aria-expanded", "false");
      });
    });
  });

  document.addEventListener("click", (e) => {
    if (!modal.classList.contains("is-open")) return;
    if (!modal.contains(e.target)) closeAllDropdowns();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAllDropdowns();
  });

  // ---------- Modal open/close ----------
  const openModal = () => {
    lastFocus = document.activeElement;

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.documentElement.style.overflow = "hidden";

    // Force both dropdowns to "Select one" every time
    dropdowns.forEach(resetDropdown);

    // Focus first input
    modal.querySelector('input[name="name"]')?.focus();
  };

  const closeModal = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.documentElement.style.overflow = "";
    closeAllDropdowns();
    lastFocus?.focus?.();
  };

  openBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openModal();
    });
  });

  closeEls.forEach((el) => el.addEventListener("click", closeModal));

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
  });

  // ---------- "Sending..." / "Sent ✓" submit behavior ----------
  let sending = false;

  const setDisabled = (state) => {
    // disable submit + cancel + X while sending (prevents double submit + accidental close)
    const sendBtn = form?.querySelector('button[type="submit"]');
    const cancelBtn = form?.querySelector('button[data-close="true"]');
    const xBtn = modal.querySelector('.modal-x[data-close="true"]');

    if (sendBtn) sendBtn.disabled = state;
    if (cancelBtn) cancelBtn.disabled = state;
    if (xBtn) xBtn.disabled = state;

    // also disable inputs to prevent edits during send
    form?.querySelectorAll("input, textarea, select, button").forEach((el) => {
      if (el === sendBtn || el === cancelBtn || el === xBtn) return;
      el.disabled = state;
    });

    return { sendBtn, cancelBtn, xBtn };
  };

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (sending) return;

    // Let built-in validation run (required/format). If invalid, show browser UI.
    if (form && !form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // Basic required validation for our hidden selects
    if (!doctorHidden.value || !apptHidden.value) {
      alert("Please select a Doctor/Service and Appointment type.");
      return;
    }

    sending = true;

    const sendBtn = form.querySelector('button[type="submit"]');
    const prevText = sendBtn ? sendBtn.textContent : "";

    // lock UI
    setDisabled(true);

    if (sendBtn) sendBtn.textContent = "Sending…";

    // simulate send delay
    setTimeout(() => {
      if (sendBtn) sendBtn.textContent = "Sent ✓";

      // keep "Sent ✓" visible, then close + reset
      setTimeout(() => {
        form.reset();
        dropdowns.forEach(resetDropdown);
        closeModal();

        // restore
        if (sendBtn) sendBtn.textContent = prevText;
        setDisabled(false);
        sending = false;
      }, 2500); // how long "Sent ✓" stays visible
    }, 850); // short pause for "Sending…"
  });
})();

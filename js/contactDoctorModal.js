(() => {
  const modal = document.getElementById("doctorModal");
  if (!modal) return;

  const openBtns = document.querySelectorAll("[data-open-doctor-modal]");
  const closeEls = modal.querySelectorAll('[data-close="true"]');

  const form = document.getElementById("doctorContactForm");
  if (!form) return;

  const doctorHidden = document.getElementById("doctorSelect"); // hidden input
  const apptHidden = document.getElementById("apptTypeSelect"); // hidden input

  let lastFocus = null;

  // =========================================================
  // Sanitization helpers (safe + simple)
  // - trims
  // - normalizes unicode
  // - removes control chars
  // - collapses whitespace
  // - caps length per field
  // - optionally strips angle brackets to prevent HTML-ish payloads
  // =========================================================
  const LIMITS = {
    name: 80,
    phone: 30,
    email: 254,
    doctor: 80,
    apptType: 80,
    subject: 120,
    message: 2000
  };

  const normalizeString = (s) => {
    if (typeof s !== "string") return "";
    // NFKC reduces weird unicode lookalikes / odd forms
    let out = s.normalize("NFKC");
    // remove ASCII control chars incl. DEL
    out = out.replace(/[\u0000-\u001F\u007F]/g, "");
    // collapse whitespace
    out = out.replace(/\s+/g, " ").trim();
    return out;
  };

  const stripAngleBrackets = (s) => s.replace(/[<>]/g, "");

  const clampLen = (s, max) => (max ? s.slice(0, max) : s);

  // Field-aware sanitizer
  const sanitizeField = (fieldName, value) => {
    let v = normalizeString(value);

    // basic field-specific handling
    switch (fieldName) {
      case "email":
        // emails should not have spaces
        v = v.replace(/\s+/g, "");
        v = clampLen(v, LIMITS.email);
        return v;

      case "phone":
        // keep common phone chars; remove everything else
        v = v.replace(/[^\d+().\-\s]/g, "");
        v = clampLen(v, LIMITS.phone);
        return v;

      case "message":
        // allow new lines (normalizeString collapsed them) -> keep original but still safe
        // Rebuild message sanitization separately to preserve line breaks.
        v = (typeof value === "string" ? value.normalize("NFKC") : "")
          .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "") // keep \t \n \r
          .replace(/[<>]/g, "") // prevent HTML-ish payloads
          .trim();
        v = clampLen(v, LIMITS.message);
        return v;

      default:
        // generic text fields
        v = stripAngleBrackets(v);
        v = clampLen(v, LIMITS[fieldName] || 200);
        return v;
    }
  };

  const sanitizeAndSet = (el) => {
    if (!el || !el.name) return;
    const clean = sanitizeField(el.name, el.value);
    if (clean !== el.value) el.value = clean;
  };

  // Sanitize all relevant inputs before submit
  const sanitizeForm = () => {
    const fields = form.querySelectorAll("input[name], textarea[name]");
    fields.forEach((el) => sanitizeAndSet(el));

    // Also sanitize hidden dropdown fields by their names
    if (doctorHidden) doctorHidden.value = sanitizeField("doctor", doctorHidden.value);
    if (apptHidden) apptHidden.value = sanitizeField("apptType", apptHidden.value);
  };

  // Live sanitization (lightweight): on blur + paste
  // (avoid sanitizing on every keypress to keep typing smooth)
  const wireSanitizers = () => {
    const fields = form.querySelectorAll('input[name]:not([type="hidden"]), textarea[name]');
    fields.forEach((el) => {
      el.addEventListener("blur", () => sanitizeAndSet(el));
      el.addEventListener("paste", () => {
        // wait for paste to land
        requestAnimationFrame(() => sanitizeAndSet(el));
      });
    });
  };
  wireSanitizers();

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

    // ✅ sanitize before storing/displaying
    const ddName = hidden?.name || "text";
    const safeVal =
      ddName === "doctor"
        ? sanitizeField("doctor", val)
        : ddName === "apptType"
          ? sanitizeField("apptType", val)
          : sanitizeField("text", val);

    hidden.value = safeVal;
    valueEl.textContent = safeVal;

    opts.forEach((o) =>
      o.setAttribute("aria-selected", o.dataset.value === val ? "true" : "false")
    );

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
  const openModal = (preselectDoctor = "") => {
    lastFocus = document.activeElement;

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.documentElement.style.overflow = "hidden";

    dropdowns.forEach(resetDropdown);

    if (preselectDoctor) {
      const doctorDD = modal.querySelector('.field-dd[data-dd="doctor"]');
      if (doctorDD) {
        const opt = doctorDD.querySelector(`.dd-opt[data-value="${CSS.escape(preselectDoctor)}"]`);
        if (opt) setDropdownValue(doctorDD, preselectDoctor);
      }
    }

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
      const preselectDoctor = btn.getAttribute("data-doctor") || "";
      openModal(preselectDoctor);
    });
  });

  closeEls.forEach((el) => el.addEventListener("click", closeModal));

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
  });

  // ---------- "Sending..." / "Sent ✓" submit behavior ----------
  let sending = false;

  const setDisabled = (state) => {
    const sendBtn = form?.querySelector('button[type="submit"]');
    const cancelBtn = form?.querySelector('button[data-close="true"]');
    const xBtn = modal.querySelector('.modal-x[data-close="true"]');

    if (sendBtn) sendBtn.disabled = state;
    if (cancelBtn) cancelBtn.disabled = state;
    if (xBtn) xBtn.disabled = state;

    form?.querySelectorAll("input, textarea, select, button").forEach((el) => {
      if (el === sendBtn || el === cancelBtn || el === xBtn) return;
      el.disabled = state;
    });

    return { sendBtn, cancelBtn, xBtn };
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (sending) return;

    // ✅ sanitize everything right before validation + send
    sanitizeForm();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // ✅ sanitize hidden selects too (already done), then validate
    if (!doctorHidden?.value || !apptHidden?.value) {
      alert("Please select a Doctor/Service and Appointment type.");
      return;
    }

    sending = true;

    const sendBtn = form.querySelector('button[type="submit"]');
    const prevText = sendBtn ? sendBtn.textContent : "";

    setDisabled(true);
    if (sendBtn) sendBtn.textContent = "Sending…";

    // simulate send delay
    setTimeout(() => {
      if (sendBtn) sendBtn.textContent = "Sent ✓";

      setTimeout(() => {
        form.reset();
        dropdowns.forEach(resetDropdown);
        closeModal();

        if (sendBtn) sendBtn.textContent = prevText;
        setDisabled(false);
        sending = false;
      }, 2500);
    }, 850);
  });
})();
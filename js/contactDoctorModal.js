/* contactDoctorModal.js — Netlify Forms + custom dropdowns + sanitization + real POST (to "/") */
(() => {
  const modal = document.getElementById("doctorModal");
  if (!modal) return;

  const openBtns = document.querySelectorAll("[data-open-doctor-modal]");
  const closeEls = modal.querySelectorAll('[data-close="true"]');

  const form = document.getElementById("doctorContactForm");
  if (!form) return;

  const doctorHidden = document.getElementById("doctorSelect"); // hidden input
  const apptHidden = document.getElementById("apptTypeSelect"); // hidden input

  // IMPORTANT: must match your form's name + hidden form-name value
  const NETLIFY_FORM_NAME = form.getAttribute("name") || "doctor-contact";

  let lastFocus = null;

  // =========================================================
  // Sanitization helpers (safe + simple)
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
    let out = s.normalize("NFKC");
    out = out.replace(/[\u0000-\u001F\u007F]/g, "");
    out = out.replace(/\s+/g, " ").trim();
    return out;
  };

  const stripAngleBrackets = (s) => s.replace(/[<>]/g, "");
  const clampLen = (s, max) => (max ? s.slice(0, max) : s);

  const sanitizeField = (fieldName, value) => {
    let v = normalizeString(value);

    switch (fieldName) {
      case "email":
        v = v.replace(/\s+/g, "");
        return clampLen(v, LIMITS.email);

      case "phone":
        v = v.replace(/[^\d+().\-\s]/g, "");
        return clampLen(v, LIMITS.phone);

      case "message":
        v = (typeof value === "string" ? value.normalize("NFKC") : "")
          .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "") // keep \t \n \r
          .replace(/[<>]/g, "")
          .trim();
        return clampLen(v, LIMITS.message);

      default:
        v = stripAngleBrackets(v);
        return clampLen(v, LIMITS[fieldName] || 200);
    }
  };

  const sanitizeAndSet = (el) => {
    if (!el || !el.name) return;
    const clean = sanitizeField(el.name, el.value);
    if (clean !== el.value) el.value = clean;
  };

  const sanitizeForm = () => {
    const fields = form.querySelectorAll("input[name], textarea[name]");
    fields.forEach((el) => sanitizeAndSet(el));

    if (doctorHidden) doctorHidden.value = sanitizeField("doctor", doctorHidden.value);
    if (apptHidden) apptHidden.value = sanitizeField("apptType", apptHidden.value);
  };

  const wireSanitizers = () => {
    const fields = form.querySelectorAll('input[name]:not([type="hidden"]), textarea[name]');
    fields.forEach((el) => {
      el.addEventListener("blur", () => sanitizeAndSet(el));
      el.addEventListener("paste", () => requestAnimationFrame(() => sanitizeAndSet(el)));
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

  // ---------- Submit behavior (REAL Netlify POST) ----------
  let sending = false;

  const setDisabled = (state) => {
    const sendBtn = form.querySelector('button[type="submit"]');
    const cancelBtn = form.querySelector('button[data-close="true"]');
    const xBtn = modal.querySelector('.modal-x[data-close="true"]');

    if (sendBtn) sendBtn.disabled = state;
    if (cancelBtn) cancelBtn.disabled = state;
    if (xBtn) xBtn.disabled = state;

    form.querySelectorAll("input, textarea, select, button").forEach((el) => {
      if (el === sendBtn || el === cancelBtn || el === xBtn) return;
      el.disabled = state;
    });

    return { sendBtn, cancelBtn, xBtn };
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (sending) return;

    sanitizeForm();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (!doctorHidden?.value || !apptHidden?.value) {
      alert("Please select a Doctor/Service and Appointment type.");
      return;
    }

    sending = true;

    const sendBtn = form.querySelector('button[type="submit"]');
    const prevText = sendBtn ? sendBtn.textContent : "";

    setDisabled(true);
    if (sendBtn) sendBtn.textContent = "Sending…";

    try {
      const formData = new FormData(form);

      // ✅ guarantee Netlify sees the form-name in the POST body
      formData.set("form-name", NETLIFY_FORM_NAME);

      const body = new URLSearchParams(formData).toString();

      // ✅ IMPORTANT: Netlify Forms AJAX submissions should POST to "/"
      const res = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });

      if (!res.ok) {
        // try to read response text for debugging
        let txt = "";
        try { txt = await res.text(); } catch (_) { }
        throw new Error(`Netlify form submit failed (${res.status})${txt ? `: ${txt}` : ""}`);
      }

      if (sendBtn) sendBtn.textContent = "Sent ✓";

      setTimeout(() => {
        form.reset();
        dropdowns.forEach(resetDropdown);
        closeModal();

        if (sendBtn) sendBtn.textContent = prevText;
        setDisabled(false);
        sending = false;
      }, 1800);

    } catch (err) {
      console.error("Form submit error:", err);
      alert("Could not send your request. Please try again." + (err?.message ? ` (${err.message})` : ""));
      if (sendBtn) sendBtn.textContent = prevText;
      setDisabled(false);
      sending = false;
    }
  });
})();
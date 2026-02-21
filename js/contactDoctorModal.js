/* contactDoctorModal.js — Netlify Forms POST + dropdown modal (stable) + light sanitization
   NOTE: your “Subject” field is now name="requestSubject" (NOT "subject") so Netlify won’t hijack email subject.
*/
(() => {
  const modal = document.getElementById("doctorModal");
  if (!modal) return;

  const openBtns = document.querySelectorAll("[data-open-doctor-modal]");
  const closeEls = modal.querySelectorAll('[data-close="true"]');

  const form = document.getElementById("doctorContactForm");
  if (!form) return;

  const doctorHidden = document.getElementById("doctorSelect");     // hidden input
  const apptHidden = document.getElementById("apptTypeSelect");     // hidden input
  const summaryHidden = document.getElementById("doctorSummary");   // <input type="hidden" name="summary" id="doctorSummary" />

  const NETLIFY_FORM_NAME = form.getAttribute("name") || "doctor-contact";

  let lastFocus = null;

  // =========================================================
  // Light sanitization (won't nuke content)
  // - trims
  // - removes control chars
  // - strips < >
  // - caps length
  // =========================================================
  const LIMITS = {
    name: 80,
    phone: 30,
    email: 254,
    doctor: 120,
    apptType: 120,
    requestSubject: 140, // renamed
    message: 2000
  };

  const cleanText = (s, max = 200) => {
    if (s == null) return "";
    let out = String(s);

    // remove control chars except newline/tab
    out = out.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");

    // strip angle brackets (avoid HTML-ish payloads)
    out = out.replace(/[<>]/g, "");

    // trim only ends (do NOT collapse internal whitespace)
    out = out.trim();

    if (max) out = out.slice(0, max);
    return out;
  };

  const cleanEmail = (s) => cleanText(s, LIMITS.email).replace(/\s+/g, "");
  const cleanPhone = (s) => cleanText(s, LIMITS.phone).replace(/[^\d+().\-\s]/g, "");

  const sanitizeFormFields = () => {
    const nameEl = form.querySelector('input[name="name"]');
    const phoneEl = form.querySelector('input[name="phone"]');
    const emailEl = form.querySelector('input[name="email"]');
    const subjEl = form.querySelector('input[name="requestSubject"]'); // renamed
    const msgEl = form.querySelector('textarea[name="message"]');

    if (nameEl) nameEl.value = cleanText(nameEl.value, LIMITS.name);
    if (phoneEl) phoneEl.value = cleanPhone(phoneEl.value);
    if (emailEl) emailEl.value = cleanEmail(emailEl.value);
    if (subjEl) subjEl.value = cleanText(subjEl.value, LIMITS.requestSubject);
    if (msgEl) msgEl.value = cleanText(msgEl.value, LIMITS.message);

    // Hidden dropdowns: sanitize but DO NOT blank valid values
    if (doctorHidden) doctorHidden.value = cleanText(doctorHidden.value, LIMITS.doctor);
    if (apptHidden) apptHidden.value = cleanText(apptHidden.value, LIMITS.apptType);
  };

  // Optional: build a summary so the Netlify notification email is readable
  const buildSummary = () => {
    const name = cleanText(form.querySelector('input[name="name"]')?.value || "", LIMITS.name);
    const email = cleanEmail(form.querySelector('input[name="email"]')?.value || "");
    const phone = cleanPhone(form.querySelector('input[name="phone"]')?.value || "");
    const doctor = cleanText(doctorHidden?.value || "", LIMITS.doctor);
    const apptType = cleanText(apptHidden?.value || "", LIMITS.apptType);
    const reqSubject = cleanText(
      form.querySelector('input[name="requestSubject"]')?.value || "",
      LIMITS.requestSubject
    );
    const message = cleanText(form.querySelector('textarea[name="message"]')?.value || "", LIMITS.message);

    const line = "────────────────────────────";

    return [
      "SPRINGBOK MEDICAL — BOOKING REQUEST",
      line,
      `Name:        ${name}`,
      `Email:       ${email}`,
      `Phone:       ${phone || "—"}`,
      `Doctor:      ${doctor}`,
      `Appt Type:   ${apptType}`,
      line,
      `Subject:     ${reqSubject || "—"}`,
      "",
      "Message:",
      message || "—",
      "",
      line,
      `Submitted:   ${new Date().toLocaleString()}`
    ].join("\n");
  };

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
        const opt = doctorDD.querySelector(
          `.dd-opt[data-value="${CSS.escape(preselectDoctor)}"]`
        );
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

  // ---------- Submit behavior (Netlify POST + UI states) ----------
  let sending = false;

  const setDisabled = (state) => {
    const sendBtn = form.querySelector('button[type="submit"]');
    const cancelBtn = form.querySelector('button[data-close="true"]');
    const xBtn = modal.querySelector('.modal-x[data-close="true"]');

    if (sendBtn) sendBtn.disabled = state;
    if (cancelBtn) cancelBtn.disabled = state;
    if (xBtn) xBtn.disabled = state;

    // lock the form without disabling fields (so FormData includes them)
    form.classList.toggle("is-sending", state);

    return { sendBtn, cancelBtn, xBtn };
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (sending) return;

    sanitizeFormFields();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (!doctorHidden?.value || !apptHidden?.value) {
      alert("Please select a Doctor/Service and Appointment type.");
      return;
    }

    if (summaryHidden) summaryHidden.value = buildSummary();

    sending = true;

    const sendBtn = form.querySelector('button[type="submit"]');
    const prevText = sendBtn ? sendBtn.textContent : "";

    setDisabled(true);
    if (sendBtn) sendBtn.textContent = "Sending…";

    try {
      const fd = new FormData(form);

      // Guarantee Netlify sees form-name
      fd.set("form-name", NETLIFY_FORM_NAME);

      // Ensure hidden fields are present in fd (belt + suspenders)
      if (doctorHidden) fd.set("doctor", doctorHidden.value);
      if (apptHidden) fd.set("apptType", apptHidden.value);
      if (summaryHidden) fd.set("summary", summaryHidden.value);

      const body = new URLSearchParams(fd).toString();

      const res = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body
      });

      if (!res.ok) {
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
      }, 1500);
    } catch (err) {
      console.error("Form submit error:", err);
      alert("Could not send your request. Please try again." + (err?.message ? ` (${err.message})` : ""));
      if (sendBtn) sendBtn.textContent = prevText;
      setDisabled(false);
      sending = false;
    }
  });
})();
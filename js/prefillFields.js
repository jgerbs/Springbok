// js/prefillFields.js
(() => {
    "use strict";

    // ============================================================
    // 1) Prefill modal subject from any [data-open-doctor-modal]
    // ============================================================
    document.addEventListener("click", (e) => {
        const trigger = e.target.closest("[data-open-doctor-modal]");
        if (!trigger) return;

        const subj = trigger.getAttribute("data-subject");
        if (!subj) return;

        const subjectInput = document.getElementById("subjectInput");
        if (subjectInput) subjectInput.value = subj;
    });

    // ============================================================
    // 2) Packages accordion auto-open (only runs if the markup exists)
    //    - First choice: localStorage "spaPkgOpen"
    //    - Fallback: URL hash that targets a details.pkg-acc
    // ============================================================
    function openPkgGroup(group) {
        const target = document.querySelector(`details.pkg-acc[data-pkg-group="${group}"]`);
        if (!target) return;

        // Open ONLY the selected one
        document.querySelectorAll("details.pkg-acc").forEach((d) => {
            if (d !== target) d.removeAttribute("open");
        });

        target.setAttribute("open", "open");

        // Scroll with header offset
        const y = target.getBoundingClientRect().top + window.pageYOffset - 110;
        window.scrollTo({ top: y, behavior: "smooth" });
    }

    window.addEventListener("DOMContentLoaded", () => {
        // If this page doesn't have packages accordions, bail quietly.
        if (!document.querySelector("details.pkg-acc")) return;

        const group = localStorage.getItem("spaPkgOpen");
        if (group) {
            localStorage.removeItem("spaPkgOpen");
            requestAnimationFrame(() => openPkgGroup(group));
            return;
        }

        const hash = window.location.hash;
        if (hash) {
            const el = document.querySelector(hash);
            if (el && el.matches("details.pkg-acc")) {
                el.setAttribute("open", "open");
            }
        }
    });
})();

// ============================================================
// 3) Appointment type options depend on selected doctor
// ============================================================
(function () {
    "use strict";

    const APPT_OPTIONS = {
        "Dr. Amor Kloppers": [
            { label: "Phone call appointment", value: "Phone call appointment" },
            { label: "In-person appointment", value: "In-person appointment" },
            { label: "Follow-up appointment", value: "Follow-up appointment" },
            { label: "Spa Inquiry", value: "Spa Inquiry" },
        ],
        "Dr. Francois Erasmus": [
            { label: "Phone call appointment", value: "Phone call appointment" },
            { label: "In-person appointment", value: "In-person appointment" },
            { label: "Follow-up appointment", value: "Follow-up appointment" },
            { label: "Spa Inquiry", value: "Spa Inquiry" },
        ],
        "Dr. Janneme Frouws": [
            { label: "Phone call appointment", value: "Phone call appointment" },
            { label: "In-person appointment", value: "In-person appointment" },
            { label: "Follow-up appointment", value: "Follow-up appointment" },
        ],
        "Dr. Kacey Kiesman": [
            { label: "Phone call appointment", value: "Phone call appointment" },
            { label: "In-person appointment", value: "In-person appointment" },
            { label: "Video call appointment", value: "Video call appointment" },
            { label: "Follow-up appointment", value: "Follow-up appointment" },
            { label: "Spa Inquiry", value: "Spa Inquiry" },
            { label: "Package Inquiry", value: "Package Inquiry" },
            { label: "Product Inquiry", value: "Product Inquiry" },
        ],
        "General Inquiry": [
            { label: "Family Practice Inquiry", value: "Family Practice Inquiry" },
            { label: "Hormone Inquiry", value: "Hormone Inquiry" },
            { label: "Naturopath Inquiry", value: "Naturopath Inquiry" },
            { label: "Spa Inquiry", value: "Spa Inquiry" },
            { label: "Package Inquiry", value: "Package Inquiry" },
            { label: "Product Inquiry", value: "Product Inquiry" },
        ],
    };

    const qs = (sel, root = document) => root.querySelector(sel);

    function getDD(name) {
        return document.querySelector(`.field-dd[data-dd="${name}"]`);
    }

    function resetDropdown(ddEl, hiddenInputEl) {
        if (!ddEl) return;

        const valueSpan = qs(".dd-value", ddEl);
        const placeholder = valueSpan?.getAttribute("data-placeholder") || "Select one";

        if (hiddenInputEl) hiddenInputEl.value = "";
        if (valueSpan) valueSpan.textContent = placeholder;

        ddEl.classList.remove("open");
        const btn = qs(".dd-btn", ddEl);
        if (btn) btn.setAttribute("aria-expanded", "false");
    }

    function rebuildApptOptionsForDoctor(doctorValue) {
        const apptDD = getDD("appt");
        if (!apptDD) return;

        const apptMenu = qs(".dd-menu", apptDD);
        const apptHidden = qs("#apptTypeSelect");

        if (!apptMenu || !apptHidden) return;

        const list = APPT_OPTIONS[doctorValue] || APPT_OPTIONS["General Inquiry"] || [];

        apptMenu.innerHTML = "";

        list.forEach((opt) => {
            const li = document.createElement("li");
            li.className = "dd-opt";
            li.setAttribute("role", "option");
            li.dataset.value = opt.value;
            li.textContent = opt.label;
            apptMenu.appendChild(li);
        });

        // Clear stale selection whenever doctor changes
        resetDropdown(apptDD, apptHidden);
    }

    // When doctor changes (dispatched by dropdown controller below)
    document.addEventListener("doctor:changed", (e) => {
        rebuildApptOptionsForDoctor(e.detail.doctorValue);
    });

    // Rebuild when modal opens (doctor may be prefilled)
    document.addEventListener("click", (e) => {
        const trigger = e.target.closest("[data-open-doctor-modal]");
        if (!trigger) return;

        setTimeout(() => {
            const doctorHidden = document.getElementById("doctorSelect");
            const doctorValue = doctorHidden?.value || "General Inquiry";
            rebuildApptOptionsForDoctor(doctorValue);
        }, 0);
    });

    // Initial run (safe)
    window.addEventListener("DOMContentLoaded", () => {
        const doctorHidden = document.getElementById("doctorSelect");
        const doctorValue = doctorHidden?.value || "General Inquiry";
        rebuildApptOptionsForDoctor(doctorValue);
    });
})();

// ============================================================
// 4) Custom dropdown controller (works with injected options)
//    - Click button opens/closes
//    - Selecting option closes immediately (doctor + appt both)
//    - Click outside closes
//    - ESC closes
//
// Key: use mousedown + capture on option select so it closes reliably
// ============================================================
(function () {
    "use strict";

    const qs = (sel, root = document) => root.querySelector(sel);

    function closeAll(except = null) {
        document.querySelectorAll(".field-dd.open").forEach((dd) => {
            if (except && dd === except) return;
            dd.classList.remove("open");
            const btn = qs(".dd-btn", dd);
            if (btn) btn.setAttribute("aria-expanded", "false");
        });
    }

    // OPEN/CLOSE (button)
    document.addEventListener("click", (e) => {
        const btn = e.target.closest(".field-dd .dd-btn");
        if (!btn) return;

        e.preventDefault();
        e.stopPropagation();

        const dd = btn.closest(".field-dd");
        if (!dd) return;

        const willOpen = !dd.classList.contains("open");
        closeAll(dd);

        if (willOpen) {
            dd.classList.add("open");
            btn.setAttribute("aria-expanded", "true");
        } else {
            dd.classList.remove("open");
            btn.setAttribute("aria-expanded", "false");
        }
    });

    // SELECT (option) — mousedown + capture makes it close reliably
    document.addEventListener(
        "mousedown",
        (e) => {
            const opt = e.target.closest(".field-dd .dd-opt");
            if (!opt) return;

            e.preventDefault();
            e.stopPropagation();

            const dd = opt.closest(".field-dd");
            if (!dd) return;

            const value = opt.dataset.value || opt.textContent.trim();
            const label = opt.textContent.trim();

            // visible label
            const valueSpan = qs(".dd-value", dd);
            if (valueSpan) valueSpan.textContent = label;

            // hidden value
            const hidden = qs('input[type="hidden"]', dd);
            if (hidden) hidden.value = value;

            // force close like your DC one
            closeAll();

            // doctor changed → tell appointment builder
            if (dd.dataset.dd === "doctor") {
                document.dispatchEvent(
                    new CustomEvent("doctor:changed", { detail: { doctorValue: value } })
                );
            }
        },
        true
    );

    // OUTSIDE CLICK closes
    document.addEventListener("click", (e) => {
        if (e.target.closest(".field-dd")) return;
        closeAll();
    });

    // ESC closes
    document.addEventListener("keydown", (e) => {
        if (e.key !== "Escape") return;
        closeAll();
    });
})();

// ============================================================
// 4) Delegated dropdown OPTION selection + selected styling
//    - Sets aria-selected="true" on the chosen option
//    - Clears aria-selected from siblings
//    - Syncs highlight when opening dropdown (uses hidden value)
// ============================================================
(function () {
    "use strict";

    const qs = (sel, root = document) => root.querySelector(sel);

    function syncSelected(dd) {
        if (!dd) return;

        const hidden = qs('input[type="hidden"]', dd);
        const current = hidden?.value || "";

        dd.querySelectorAll(".dd-opt").forEach((li) => {
            const v = li.dataset.value || li.textContent.trim();
            if (current && v === current) li.setAttribute("aria-selected", "true");
            else li.removeAttribute("aria-selected");
        });
    }

    // When opening a dropdown, highlight the currently-selected option
    // (run AFTER contactDoctorModal.js toggles .is-open)
    document.addEventListener(
        "click",
        (e) => {
            const btn = e.target.closest(".field-dd .dd-btn");
            if (!btn) return;

            const dd = btn.closest(".field-dd");
            if (!dd) return;

            setTimeout(() => syncSelected(dd), 0);
        },
        true
    );

    // Select an option (works for injected appt options)
    document.addEventListener(
        "click",
        (e) => {
            const opt = e.target.closest(".field-dd .dd-opt");
            if (!opt) return;

            const dd = opt.closest(".field-dd");
            if (!dd) return;

            // Beat other handlers so it closes properly
            e.preventDefault();
            e.stopPropagation();
            if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();

            const value = opt.dataset.value || opt.textContent.trim();
            const label = opt.textContent.trim();

            // Visible label
            const valueSpan = qs(".dd-value", dd);
            if (valueSpan) valueSpan.textContent = label;

            // Hidden value
            const hidden = qs('input[type="hidden"]', dd);
            if (hidden) {
                hidden.value = value;
                hidden.dispatchEvent(new Event("input", { bubbles: true }));
                hidden.dispatchEvent(new Event("change", { bubbles: true }));
            }

            // ✅ Selected styling: clear siblings, set this one selected
            dd.querySelectorAll(".dd-opt").forEach((li) => li.removeAttribute("aria-selected"));
            opt.setAttribute("aria-selected", "true");

            // Close (match your CSS/state class)
            dd.classList.remove("is-open");

            const btn = qs(".dd-btn", dd);
            if (btn) btn.setAttribute("aria-expanded", "false");

            // Doctor changed → rebuild appointment list
            if (dd.dataset.dd === "doctor") {
                document.dispatchEvent(
                    new CustomEvent("doctor:changed", { detail: { doctorValue: value } })
                );
            }
        },
        true
    );
})();

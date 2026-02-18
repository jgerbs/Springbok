// js/prefillFields.js
(() => {
    "use strict";

    const qs = (sel, root = document) => root.querySelector(sel);

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
    // ============================================================
    function openPkgGroup(group) {
        const target = document.querySelector(`details.pkg-acc[data-pkg-group="${group}"]`);
        if (!target) return;

        document.querySelectorAll("details.pkg-acc").forEach((d) => {
            if (d !== target) d.removeAttribute("open");
        });

        target.setAttribute("open", "open");

        const y = target.getBoundingClientRect().top + window.pageYOffset - 110;
        window.scrollTo({ top: y, behavior: "smooth" });
    }

    window.addEventListener("DOMContentLoaded", () => {
        if (!document.querySelector("details.pkg-acc")) return;

        const group = localStorage.getItem("spaPkgOpen");
        if (group) {
            localStorage.removeItem("spaPkgOpen");
            requestAnimationFrame(() => openPkgGroup(group));
            return;
        }

        const hash = window.location.hash;
        if (!hash) return;

        const el = document.querySelector(hash);
        if (el && el.matches("details.pkg-acc")) el.setAttribute("open", "open");
    });

    // ============================================================
    // 3) Appointment type options depend on selected doctor
    // ============================================================
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

    function getDD(name) {
        return document.querySelector(`.field-dd[data-dd="${name}"]`);
    }

    function resetDropdown(ddEl, hiddenEl) {
        if (!ddEl) return;

        const valueSpan = qs(".dd-value", ddEl);
        const placeholder = valueSpan?.getAttribute("data-placeholder") || "Select one";

        if (hiddenEl) hiddenEl.value = "";
        if (valueSpan) valueSpan.textContent = placeholder;

        // your CSS uses .is-open
        ddEl.classList.remove("is-open");
        const btn = qs(".dd-btn", ddEl);
        if (btn) btn.setAttribute("aria-expanded", "false");

        // clear selected highlight
        ddEl.querySelectorAll(".dd-opt").forEach((li) => li.removeAttribute("aria-selected"));
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

        resetDropdown(apptDD, apptHidden);
    }

    // doctor changed (we dispatch this on doctor option select below)
    document.addEventListener("doctor:changed", (e) => {
        rebuildApptOptionsForDoctor(e.detail.doctorValue);
    });

    // rebuild when modal opens (doctor might be prefilled)
    document.addEventListener("click", (e) => {
        const trigger = e.target.closest("[data-open-doctor-modal]");
        if (!trigger) return;

        setTimeout(() => {
            const doctorHidden = document.getElementById("doctorSelect");
            rebuildApptOptionsForDoctor(doctorHidden?.value || "General Inquiry");
        }, 0);
    });

    // initial safe run
    window.addEventListener("DOMContentLoaded", () => {
        const doctorHidden = document.getElementById("doctorSelect");
        rebuildApptOptionsForDoctor(doctorHidden?.value || "General Inquiry");
    });

    // ============================================================
    // 4) Delegated dropdown selection + selected styling (aria-selected)
    //    - Works for injected appointment options
    //    - Keeps selected highlighted like your DC CSS
    // ============================================================
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

    // On dropdown open, highlight the current selection
    document.addEventListener(
        "click",
        (e) => {
            const btn = e.target.closest(".field-dd .dd-btn");
            if (!btn) return;

            const dd = btn.closest(".field-dd");
            if (!dd) return;

            // contactDoctorModal.js toggles .is-open; wait a tick
            setTimeout(() => syncSelected(dd), 0);
        },
        true
    );

    // Select option (doctor + appt) with capture so injected options behave the same
    document.addEventListener(
        "click",
        (e) => {
            const opt = e.target.closest(".field-dd .dd-opt");
            if (!opt) return;

            const dd = opt.closest(".field-dd");
            if (!dd) return;

            // beat other handlers for consistent close
            e.preventDefault();
            e.stopPropagation();
            if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();

            const value = opt.dataset.value || opt.textContent.trim();
            const label = opt.textContent.trim();

            // visible label
            const valueSpan = qs(".dd-value", dd);
            if (valueSpan) valueSpan.textContent = label;

            // hidden value
            const hidden = qs('input[type="hidden"]', dd);
            if (hidden) {
                hidden.value = value;
                hidden.dispatchEvent(new Event("input", { bubbles: true }));
                hidden.dispatchEvent(new Event("change", { bubbles: true }));
            }

            // selected highlight
            dd.querySelectorAll(".dd-opt").forEach((li) => li.removeAttribute("aria-selected"));
            opt.setAttribute("aria-selected", "true");

            // close (your CSS uses .is-open)
            dd.classList.remove("is-open");
            const btn = qs(".dd-btn", dd);
            if (btn) btn.setAttribute("aria-expanded", "false");

            // if doctor changed, rebuild appointment list
            if (dd.dataset.dd === "doctor") {
                document.dispatchEvent(
                    new CustomEvent("doctor:changed", { detail: { doctorValue: value } })
                );
            }
        },
        true
    );
})();

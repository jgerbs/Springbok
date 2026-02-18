// js/prefillFields.js
(() => {
    "use strict";

    // ------------------------------------------------------------
    // 1) Prefill modal subject from any [data-open-doctor-modal]
    // ------------------------------------------------------------
    document.addEventListener("click", (e) => {
        const trigger = e.target.closest("[data-open-doctor-modal]");
        if (!trigger) return;

        const subj = trigger.getAttribute("data-subject");
        if (!subj) return;

        const subjectInput = document.getElementById("subjectInput");
        if (subjectInput) subjectInput.value = subj;
    });

    // ------------------------------------------------------------
    // 2) Packages accordion auto-open (only runs if the markup exists)
    //    - First choice: localStorage "spaPkgOpen"
    //    - Fallback: URL hash that targets a details.pkg-acc
    // ------------------------------------------------------------
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

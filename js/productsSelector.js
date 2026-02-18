// js/productsSelector.js
(function () {
    function initProductsFilter() {
        const filterButtons = Array.from(document.querySelectorAll(".prod-filter[data-filter]"));
        const cards = Array.from(document.querySelectorAll(".doc-card[data-cat]"));

        if (!filterButtons.length || !cards.length) return;

        const selected = new Set();

        function applyFilter() {
            if (selected.size === 0) {
                cards.forEach(card => (card.hidden = false));
                return;
            }

            cards.forEach(card => {
                const cat = (card.getAttribute("data-cat") || "").trim().toLowerCase();
                card.hidden = !selected.has(cat);
            });
        }

        function setBtnState(btn, isOn) {
            btn.classList.toggle("is-active", isOn);
            btn.setAttribute("aria-pressed", String(isOn));
        }

        // Start: NONE selected => show all
        filterButtons.forEach(btn => setBtnState(btn, false));
        applyFilter();

        filterButtons.forEach(btn => {
            btn.addEventListener("click", () => {
                const cat = (btn.getAttribute("data-filter") || "").trim().toLowerCase();
                if (!cat) return;

                if (selected.has(cat)) {
                    selected.delete(cat);
                    setBtnState(btn, false);
                } else {
                    selected.add(cat);
                    setBtnState(btn, true);
                }

                applyFilter();
            });
        });
    }

    // Ensure DOM exists
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initProductsFilter);
    } else {
        initProductsFilter();
    }
})();

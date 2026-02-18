// productsSelector.js
(() => {
    const grid = document.querySelector("[data-products-grid]");
    if (!grid) return;

    const cards = Array.from(grid.querySelectorAll(".doc-card"));
    const buttons = Array.from(document.querySelectorAll(".prod-filter"));
    const selected = new Set();

    // --- Reveal observer for cards (independent of scrollReveal.js) ---
    const revealObserver = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-revealed");
                    revealObserver.unobserve(entry.target);
                }
            }
        },
        {
            root: null,
            threshold: 0.12,
            rootMargin: "0px 0px -10% 0px",
        }
    );

    function observeVisibleCards() {
        cards.forEach((card) => {
            if (!card.hidden && !card.classList.contains("is-revealed")) {
                revealObserver.observe(card);
            }
        });
    }

    // If a card becomes visible and is already in view, reveal it immediately
    function revealIfInViewport(el) {
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight || document.documentElement.clientHeight;
        if (r.top < vh * 0.92 && r.bottom > 0) {
            el.classList.add("is-revealed");
            revealObserver.unobserve(el);
        } else {
            revealObserver.observe(el);
        }
    }

    // --- Filtering ---
    function setButtonState(btn, isOn) {
        btn.classList.toggle("is-active", isOn);
        btn.setAttribute("aria-pressed", isOn ? "true" : "false");
    }

    function applyFilters() {
        const anySelected = selected.size > 0;

        cards.forEach((card) => {
            const cat = (card.dataset.cat || "").trim();
            const shouldShow = !anySelected || selected.has(cat);

            // If we are hiding, just hide.
            if (!shouldShow) {
                card.hidden = true;
                return;
            }

            // Show:
            const wasHidden = card.hidden;
            card.hidden = false;

            // If it was previously hidden, it never got revealed — re-arm it:
            if (wasHidden) {
                // Remove reveal state so it can animate again if needed
                card.classList.remove("is-revealed");

                // Reveal now if already in viewport, otherwise observe
                revealIfInViewport(card);
            }
        });

        // Also observe any visible cards that haven't been revealed yet
        observeVisibleCards();
    }

    // --- Init: IMPORTANT: show everything immediately on load ---
    cards.forEach((c) => (c.hidden = false));

    // Attach handlers
    buttons.forEach((btn) => {
        const filter = (btn.dataset.filter || "").trim();

        // Ensure clean initial UI state
        setButtonState(btn, false);

        btn.addEventListener("click", () => {
            const isOn = selected.has(filter);

            if (isOn) selected.delete(filter);
            else selected.add(filter);

            setButtonState(btn, !isOn);
            applyFilters();
        });
    });

    // Kick off reveal + filtering after layout settles (mobile-safe)
    // (This avoids "hidden on init" races with other scripts)
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            applyFilters();
            observeVisibleCards();
        });
    });

    // If orientation changes / resize, re-check visible reveal (mobile)
    window.addEventListener("resize", () => {
        observeVisibleCards();
    });
})();

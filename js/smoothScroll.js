(() => {
    const HEADER_OFFSET = 90;          // tweak for your fixed header
    const DURATION_MS = 1100;          // slower = bigger number (900–1400 is nice)

    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    const easeInOutCubic = (t) =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    function animatedScrollTo(targetY, duration = DURATION_MS) {
        if (prefersReducedMotion) {
            window.scrollTo(0, targetY);
            return;
        }

        const startY = window.pageYOffset || document.documentElement.scrollTop || 0;
        const diff = targetY - startY;

        // If it's basically the same spot, don’t animate (prevents "micro jump" weirdness)
        if (Math.abs(diff) < 2) return;

        const startTime = performance.now();

        function step(now) {
            const elapsed = now - startTime;
            const t = Math.min(1, elapsed / duration);
            const eased = easeInOutCubic(t);

            window.scrollTo(0, startY + diff * eased);

            if (t < 1) requestAnimationFrame(step);
        }

        requestAnimationFrame(step);
    }

    // Smooth scroll for in-page links like href="#services"
    document.addEventListener("click", (e) => {
        const link = e.target.closest('a[href^="#"]');
        if (!link) return;

        const href = link.getAttribute("href");
        if (!href || href === "#") return;

        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();

        const y =
            target.getBoundingClientRect().top +
            (window.pageYOffset || document.documentElement.scrollTop) -
            HEADER_OFFSET;

        animatedScrollTo(Math.max(0, y));
    });

    // OPTIONAL: make your to-top button use the same slower animation
    const toTopBtn = document.getElementById("toTopBtn");
    if (toTopBtn) {
        toTopBtn.addEventListener("click", (e) => {
            e.preventDefault();
            animatedScrollTo(0);
        });
    }
})();

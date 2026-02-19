(() => {
    "use strict";

    // init every mission slider on the page
    const sliders = document.querySelectorAll("[data-mission-slider]");
    if (!sliders.length) return;

    sliders.forEach((slider) => initMissionSlider(slider));

    function initMissionSlider(slider) {
        const shell = slider.closest(".mission-v2-shell");
        if (!shell) return;

        const rootSection = slider.closest(".mission-v2");
        const isAbout = !!rootSection?.classList.contains("mission-v2--about");

        const bar = shell.querySelector("[data-mission-timer]");
        const nextBtn = shell.querySelector(".mission-next");
        const prevBtn = shell.querySelector(".mission-prev");

        const items = Array.from(slider.querySelectorAll(".mission-item"));
        const len = items.length;
        if (!len) return;

        const DURATION = 6000;
        const mqPair = window.matchMedia("(min-width: 980px)");

        let index = items.findIndex((el) => el.classList.contains("is-active"));
        if (index < 0) index = 0;

        let rafId = null;
        let lastTs = null;
        let elapsed = 0;
        let paused = false;
        let inView = true;

        function setProgress(p) {
            if (!bar) return;
            const clamped = Math.max(0, Math.min(1, p));
            bar.style.width = `${clamped * 100}%`;
        }

        function clearStates() {
            items.forEach((el) => {
                el.classList.remove("is-active");
                el.classList.remove("is-paired");
            });
        }

        // ✅ only enforce even pairing on ABOUT (where you want TL/BR alternating pairs)
        function normalizeIndex(i) {
            i = ((i % len) + len) % len;

            // paired mode only matters on ABOUT and only if even length (clean pairs)
            if (isAbout && mqPair.matches && len >= 2 && len % 2 === 0) {
                if (i % 2 === 1) i = i - 1; // snap to even (pair start)
            }
            return i;
        }

        function applyStates() {
            clearStates();

            index = normalizeIndex(index);

            const a = items[index];
            a.classList.add("is-active");

            // only ABOUT uses paired mode visuals
            if (isAbout && mqPair.matches && len > 1) {
                const b = items[index + 1]; // safe because normalizeIndex prevents last-odd
                if (b) b.classList.add("is-paired");
            }

            // restart any CSS anim hooks
            void a.offsetHeight;
        }

        function setActive(i) {
            index = normalizeIndex(i);
            applyStates();
        }

        function stepSize() {
            // ABOUT paired mode advances by 2; everything else advances by 1
            return isAbout && mqPair.matches ? 2 : 1;
        }

        function next() {
            setActive(index + stepSize());
        }

        function prev() {
            setActive(index - stepSize());
        }

        function resetTimer() {
            elapsed = 0;
            lastTs = null;
            setProgress(0);
        }

        function tick(ts) {
            if (!lastTs) lastTs = ts;
            const dt = ts - lastTs;
            lastTs = ts;

            if (!paused && inView) {
                elapsed += dt;
                setProgress(elapsed / DURATION);

                if (elapsed >= DURATION) {
                    next();
                    resetTimer();
                }
            }

            rafId = requestAnimationFrame(tick);
        }

        // Pause on hover
        shell.addEventListener("mouseenter", () => { paused = true; });
        shell.addEventListener("mouseleave", () => { paused = false; });

        // Pause when not visible
        const io = new IntersectionObserver(
            ([entry]) => { inView = entry.isIntersecting; },
            { threshold: 0.35 }
        );
        io.observe(shell);

        // Arrows
        nextBtn?.addEventListener("click", (e) => {
            e.preventDefault();
            next();
            resetTimer();
        });

        prevBtn?.addEventListener("click", (e) => {
            e.preventDefault();
            prev();
            resetTimer();
        });

        // Swipe
        let startX = 0, startY = 0, tracking = false;

        shell.addEventListener("touchstart", (e) => {
            if (!e.touches?.length) return;
            tracking = true;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: true });

        shell.addEventListener("touchend", (e) => {
            if (!tracking) return;
            tracking = false;

            const t = e.changedTouches?.[0];
            if (!t) return;

            const dx = t.clientX - startX;
            const dy = t.clientY - startY;

            if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;

            if (dx < 0) next();
            else prev();

            resetTimer();
        }, { passive: true });

        // Breakpoint changes (ABOUT needs re-snap)
        mqPair.addEventListener?.("change", () => {
            index = normalizeIndex(index);
            applyStates();
            resetTimer();
        });

        // Reduced motion
        if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
            paused = true;
            setProgress(1);
        }

        // Init
        index = normalizeIndex(index);
        applyStates();
        setProgress(0);
        rafId = requestAnimationFrame(tick);
    }
})();

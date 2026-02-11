(() => {
    const slider = document.querySelector("[data-mission-slider]");
    if (!slider) return;

    const shell = slider.closest(".mission-v2-shell");
    if (!shell) return;

    const bar = shell.querySelector("[data-mission-timer]");
    const nextBtn = shell.querySelector(".mission-next");
    const prevBtn = shell.querySelector(".mission-prev");

    const items = Array.from(slider.querySelectorAll(".mission-item"));
    if (!items.length) return;

    const DURATION = 6000;

    let active = items.findIndex((el) => el.classList.contains("is-active"));
    if (active < 0) active = 0;

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

    function setActive(idx) {
        items[active]?.classList.remove("is-active");
        active = (idx + items.length) % items.length;
        items[active]?.classList.add("is-active");

        // restart stagger animations reliably
        void items[active].offsetHeight;
    }

    function next() { setActive(active + 1); }
    function prev() { setActive(active - 1); }

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
    const io = new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting;
    }, { threshold: 0.35 });
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

    // Reduced motion
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
        paused = true;
        setProgress(1);
    }

    // Init
    items.forEach((el, i) => el.classList.toggle("is-active", i === active));
    setProgress(0);
    rafId = requestAnimationFrame(tick);
})();

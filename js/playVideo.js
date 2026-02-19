(() => {
    const v = document.querySelector(".hero-video");
    if (!v) return;

    // Respect reduced motion
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
        v.pause();
        v.removeAttribute("autoplay");
        return;
    }

    const pickSrc = () => {
        const isMobile = window.matchMedia("(max-width: 700px)").matches;
        return isMobile ? v.dataset.srcMobile : v.dataset.srcDesktop;
    };

    const setIOSFlags = () => {
        v.muted = true;
        v.defaultMuted = true;
        v.volume = 0;

        v.playsInline = true;
        v.setAttribute("muted", "");
        v.setAttribute("playsinline", "");
        v.setAttribute("webkit-playsinline", "");
    };

    let armed = false;

    const armForAnyTap = () => {
        if (armed) return;
        armed = true;

        const unlock = async () => {
            setIOSFlags();
            try {
                const p = v.play();
                if (p && typeof p.then === "function") await p;
                disarm(); // success
            } catch {
                // If it still fails, stay armed and keep listening
            }
        };

        const disarm = () => {
            window.removeEventListener("touchstart", unlock, opts);
            window.removeEventListener("pointerdown", unlock, opts);
            window.removeEventListener("click", unlock, opts);
            window.removeEventListener("keydown", unlock, opts);
            window.removeEventListener("scroll", unlock, scrollOpts);
        };

        // capture+passive lets us catch the earliest gesture without blocking scroll
        const opts = { passive: true, capture: true };
        const scrollOpts = { passive: true, capture: true };

        window.addEventListener("touchstart", unlock, opts);
        window.addEventListener("pointerdown", unlock, opts);
        window.addEventListener("click", unlock, opts);
        window.addEventListener("keydown", unlock, opts);
        window.addEventListener("scroll", unlock, scrollOpts);
    };

    const tryPlay = async () => {
        setIOSFlags();
        try {
            const p = v.play();
            if (p && typeof p.then === "function") await p;
            return true;
        } catch {
            return false;
        }
    };

    const init = async () => {
        setIOSFlags();

        // Set src (and keep poster visible instantly via CSS background + poster attribute)
        const src = pickSrc();
        if (src) {
            v.src = src;
            v.load();
        }

        // Try autoplay
        const ok = await tryPlay();

        // If blocked, wait for ANY interaction anywhere
        if (!ok) armForAnyTap();

        // Retry on readiness events too
        v.addEventListener("canplay", () => tryPlay().then((played) => { if (!played) armForAnyTap(); }), { once: true });
        v.addEventListener("loadeddata", () => tryPlay().then((played) => { if (!played) armForAnyTap(); }), { once: true });

        // Small delayed retry for iOS oddities
        setTimeout(() => {
            tryPlay().then((played) => { if (!played) armForAnyTap(); });
        }, 150);
    };

    // Resume when returning to tab/app
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            tryPlay().then((played) => { if (!played) armForAnyTap(); });
        }
    });

    // If you resize across breakpoint, swap source safely
    window.addEventListener("resize", () => {
        const newSrc = pickSrc();
        if (!newSrc || v.src === newSrc) return;

        const time = v.currentTime || 0;
        const wasPlaying = !v.paused;

        v.src = newSrc;
        v.load();

        v.addEventListener("loadeddata", async () => {
            try { v.currentTime = time; } catch { }
            if (wasPlaying) {
                const played = await tryPlay();
                if (!played) armForAnyTap();
            }
        }, { once: true });
    });

    init();
})();

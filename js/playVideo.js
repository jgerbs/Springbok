(() => {
    const v = document.querySelector(".hero-video");
    if (!v) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

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

    let armed = false;
    const armForAnyTouch = () => {
        if (armed) return;
        armed = true;

        const opts = { passive: true, capture: true };

        const unlock = async () => {
            const ok = await tryPlay();
            if (!ok) return;

            // success → remove listeners
            window.removeEventListener("touchstart", unlock, opts);
            window.removeEventListener("pointerdown", unlock, opts);
            window.removeEventListener("click", unlock, opts);
            window.removeEventListener("keydown", unlock, opts);
            window.removeEventListener("scroll", unlock, opts);
        };

        // Any interaction anywhere triggers playback
        window.addEventListener("touchstart", unlock, opts);
        window.addEventListener("pointerdown", unlock, opts);
        window.addEventListener("click", unlock, opts);
        window.addEventListener("keydown", unlock, opts);
        window.addEventListener("scroll", unlock, opts);
    };

    const init = async () => {
        setIOSFlags();

        const src = pickSrc();
        if (src) {
            v.src = src;
            v.load();
        }

        const ok = await tryPlay();
        if (!ok) armForAnyTouch();

        // extra retries (iOS sometimes needs a moment)
        v.addEventListener("loadeddata", () => tryPlay().then((played) => { if (!played) armForAnyTouch(); }), { once: true });
        v.addEventListener("canplay", () => tryPlay().then((played) => { if (!played) armForAnyTouch(); }), { once: true });

        setTimeout(() => {
            tryPlay().then((played) => { if (!played) armForAnyTouch(); });
        }, 150);
    };

    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            tryPlay().then((played) => { if (!played) armForAnyTouch(); });
        }
    });

    window.addEventListener("resize", () => {
        const newSrc = pickSrc();
        if (!newSrc || v.src === newSrc) return;

        const t = v.currentTime || 0;
        const wasPlaying = !v.paused;

        v.src = newSrc;
        v.load();

        v.addEventListener("loadeddata", async () => {
            try { v.currentTime = t; } catch { }
            if (wasPlaying) {
                const played = await tryPlay();
                if (!played) armForAnyTouch();
            }
        }, { once: true });
    });

    init();
})();

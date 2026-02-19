(() => {
    const v = document.querySelector(".hero-video");
    if (!v) return;

    // Respect reduced motion
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

    const isActuallyPlaying = () =>
        v &&
        !v.paused &&
        !v.ended &&
        v.readyState >= 2;

    const tryPlay = async () => {
        // ✅ If already playing, do nothing (prevents “jump/glitch”)
        if (isActuallyPlaying()) return true;

        setIOSFlags();
        try {
            const p = v.play();
            if (p && typeof p.then === "function") await p;
            return true;
        } catch {
            return false;
        }
    };

    // ---------- global unlock-on-any-touch (only if needed) ----------
    let armed = false;
    const opts = { passive: true, capture: true };

    const disarm = () => {
        if (!armed) return;
        armed = false;

        window.removeEventListener("touchstart", unlock, opts);
        window.removeEventListener("pointerdown", unlock, opts);
        window.removeEventListener("click", unlock, opts);
        window.removeEventListener("keydown", unlock, opts);
        window.removeEventListener("scroll", unlock, opts);
    };

    const unlock = async () => {
        // ✅ If it started playing already, stop listening immediately
        if (isActuallyPlaying()) {
            disarm();
            return;
        }

        const ok = await tryPlay();
        if (ok) disarm();
    };

    const armForAnyTouch = () => {
        // ✅ Don’t arm if already playing
        if (armed || isActuallyPlaying()) return;
        armed = true;

        window.addEventListener("touchstart", unlock, opts);
        window.addEventListener("pointerdown", unlock, opts);
        window.addEventListener("click", unlock, opts);
        window.addEventListener("keydown", unlock, opts);
        window.addEventListener("scroll", unlock, opts);
    };

    // If the video ever starts playing (from autoplay or gesture), disarm listeners.
    v.addEventListener("playing", disarm, { passive: true });

    const init = async () => {
        setIOSFlags();

        const src = pickSrc();
        if (src) {
            v.src = src;
            v.load();
        }

        const ok = await tryPlay();
        if (!ok) armForAnyTouch();

        // Extra retries (iOS sometimes needs a beat)
        const retry = () => tryPlay().then((played) => { if (!played) armForAnyTouch(); });

        v.addEventListener("loadeddata", retry, { once: true });
        v.addEventListener("canplay", retry, { once: true });

        setTimeout(retry, 150);
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
        const wasPlaying = isActuallyPlaying();

        v.src = newSrc;
        v.load();

        v.addEventListener("loadeddata", async () => {
            try { v.currentTime = t; } catch { /* ignore */ }

            if (wasPlaying) {
                const played = await tryPlay();
                if (!played) armForAnyTouch();
            }
        }, { once: true });
    });

    init();
})();

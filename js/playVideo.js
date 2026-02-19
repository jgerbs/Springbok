(() => {
    const v = document.querySelector(".hero-video");
    if (!v) return;

    // Respect reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

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

    const isActuallyPlaying = () => !v.paused && !v.ended && v.readyState >= 2;

    // Next play should start at the beginning (poster-aligned)
    let restartOnNextPlay = false;

    let armed = false;
    const opts = { passive: true, capture: true };

    const disarm = () => {
        if (!armed) return;
        armed = false;

        window.removeEventListener("touchstart", unlock, opts);
        window.removeEventListener("pointerdown", unlock, opts);
        window.removeEventListener("click", unlock, opts);
        window.removeEventListener("keydown", unlock, opts);
    };

    const tryPlay = async () => {
        if (isActuallyPlaying()) return true;

        setIOSFlags();

        if (restartOnNextPlay) {
            try { v.currentTime = 0; } catch { }
            restartOnNextPlay = false;
        }

        try {
            const p = v.play();
            if (p && typeof p.then === "function") await p;
            return true;
        } catch {
            return false;
        }
    };

    const unlock = async () => {
        if (isActuallyPlaying()) {
            disarm();
            return;
        }
        const ok = await tryPlay();
        if (ok) disarm();
    };

    const armForAnyTouch = () => {
        if (armed || isActuallyPlaying()) return;
        armed = true;

        window.addEventListener("touchstart", unlock, opts);
        window.addEventListener("pointerdown", unlock, opts);
        window.addEventListener("click", unlock, opts);
        window.addEventListener("keydown", unlock, opts);
    };

    // If video starts playing, stop listening
    v.addEventListener("playing", disarm, { passive: true });
    v.addEventListener("timeupdate", disarm, { once: true, passive: true });

    const retryPlaySoon = () => {
        // a couple retries after resize / iOS viewport settle
        setTimeout(() => tryPlay().then(ok => { if (!ok) armForAnyTouch(); }), 80);
        setTimeout(() => tryPlay().then(ok => { if (!ok) armForAnyTouch(); }), 220);
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

        const retry = () => tryPlay().then((played) => { if (!played) armForAnyTouch(); });

        v.addEventListener("loadeddata", retry, { once: true });
        v.addEventListener("canplay", retry, { once: true });
        setTimeout(retry, 150);
    };

    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            tryPlay().then((played) => {
                if (!played) armForAnyTouch();
            });
        }
    });

    // ✅ Resize: pause, ensure next play starts at 0, then retry/arm
    window.addEventListener("resize", () => {
        const newSrc = pickSrc();

        restartOnNextPlay = true;

        // If breakpoint changed, swap sources and then restart at 0 + retry
        if (newSrc && !v.src.includes(newSrc)) {
            v.pause();
            v.src = newSrc;
            v.load();

            v.addEventListener("loadeddata", () => {
                // force poster-aligned restart
                restartOnNextPlay = true;
                retryPlaySoon();        // try to resume automatically
                armForAnyTouch();       // and allow any tap to resume if blocked
            }, { once: true });

            return;
        }

        // Src didn't change: pause now, then retry + arm so it can resume
        v.pause();
        retryPlaySoon();
        armForAnyTouch();
    });

    init();
})();

(() => {
    const v = document.querySelector(".hero-video");
    const btn = document.querySelector(".hero-video-btn");
    if (!v) return;

    // Respect reduced motion
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
        v.pause();
        if (btn) btn.hidden = true;
        return;
    }

    const pickSrc = () => {
        const isMobile = window.matchMedia("(max-width: 700px)").matches;
        return isMobile ? v.dataset.srcMobile : v.dataset.srcDesktop;
    };

    const setIOSFlags = () => {
        // iOS autoplay requirements (and a few “extra safe” flags)
        v.muted = true;
        v.defaultMuted = true;
        v.volume = 0;

        v.playsInline = true;
        v.setAttribute("muted", "");
        v.setAttribute("playsinline", "");
        v.setAttribute("webkit-playsinline", "");
    };

    const showTap = () => {
        if (!btn) return;
        btn.hidden = false;
    };

    const hideTap = () => {
        if (!btn) return;
        btn.hidden = true;
    };

    const tryPlay = async () => {
        try {
            const p = v.play();
            if (p && typeof p.then === "function") await p;
            hideTap();
            return true;
        } catch {
            showTap();
            return false;
        }
    };

    const loadAndPlay = async () => {
        setIOSFlags();

        const src = pickSrc();
        if (src && v.src !== src) {
            v.src = src;
            v.load();
        }

        // Try a few times across different readiness moments
        await tryPlay();
        v.addEventListener("loadeddata", () => { tryPlay(); }, { once: true });
        v.addEventListener("canplay", () => { tryPlay(); }, { once: true });

        // Some iOS cases need a micro-delay after load/paint
        setTimeout(() => { tryPlay(); }, 150);
        requestAnimationFrame(() => { tryPlay(); });
    };

    // Tap-to-play fallback (guaranteed to work everywhere)
    if (btn) {
        btn.addEventListener("click", async () => {
            setIOSFlags();
            await tryPlay();
        });
    }

    // Re-try when returning to the page (iOS often pauses video)
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) tryPlay();
    });

    // If they rotate / resize across breakpoint, swap source cleanly
    let lastSrc = null;
    const onResize = () => {
        const next = pickSrc();
        if (next && next !== lastSrc) {
            lastSrc = next;

            const wasPlaying = !v.paused;
            const t = v.currentTime || 0;

            v.src = next;
            v.load();

            v.addEventListener("loadeddata", async () => {
                try { v.currentTime = t; } catch { }
                if (wasPlaying) await tryPlay();
            }, { once: true });
        }
    };
    window.addEventListener("resize", () => { onResize(); });

    // Kick off
    loadAndPlay();
})();

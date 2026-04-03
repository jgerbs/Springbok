(() => {
    const video = document.querySelector(".hero-video");
    const heroMedia = document.querySelector(".hero-media");
    const heroImg = document.querySelector(".hero-poster-img");

    // Image-only hero — just sync the blur bg and exit
    if (!video) {
        syncHeroBlurBackground();
        if (heroImg) heroImg.addEventListener("load", syncHeroBlurBackground);
        return;
    }

    const mobileMQ = window.matchMedia("(max-width: 980px)");
    const reduceMotionMQ = window.matchMedia("(prefers-reduced-motion: reduce)");

    const mobileSrc = video.dataset.videoMobile || "";
    const desktopSrc = video.dataset.videoDesktop || "";
    let activeSrc = "";
    let playAttempted = false;

    // ── Fix 1: use a real template literal ──────────────────────────
    function syncHeroBlurBackground() {
        if (!heroMedia || !heroImg) return;
        const src = heroImg.currentSrc || heroImg.src;
        if (!src) return;
        heroMedia.style.setProperty("--hero-blur-bg", `url("${src}")`);
    }

    function wantedSrc() {
        if (reduceMotionMQ.matches) return "";
        return mobileMQ.matches ? mobileSrc : desktopSrc;
    }

    function stopVideo() {
        video.pause();
        video.removeAttribute("src");
        video.load();
        activeSrc = "";
        playAttempted = false;
    }

    // ── Fix 2: preload="metadata" + load before play ─────────────────
    async function startVideo() {
        syncHeroBlurBackground();

        const src = wantedSrc();
        if (!src) { stopVideo(); return; }

        if (activeSrc !== src) {
            video.pause();
            video.src = src;
            // Ensure attributes are set every time (some mobile browsers reset them)
            video.muted = true;
            video.defaultMuted = true;
            video.playsInline = true;
            video.setAttribute("muted", "");
            video.setAttribute("playsinline", "");
            video.setAttribute("webkit-playsinline", "");
            video.load();
            activeSrc = src;
            playAttempted = false;
        }

        if (playAttempted) return;
        playAttempted = true;

        try {
            await video.play();
        } catch (err) {
            // Poster remains visible — non-fatal on restrictive browsers
            console.warn("Hero video autoplay blocked:", err.message);
        }
    }

    // ── Fix 3: IntersectionObserver fires play the moment hero is visible ──
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    startVideo();
                } else {
                    if (video && !video.paused) video.pause();
                }
            });
        },
        { threshold: 0.01 }
    );
    observer.observe(video.closest(".hero") || video);

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            video.pause();
        } else {
            playAttempted = false; // allow retry
            startVideo();
        }
    });

    mobileMQ.addEventListener
        ? mobileMQ.addEventListener("change", () => { activeSrc = ""; playAttempted = false; startVideo(); })
        : mobileMQ.addListener(() => { activeSrc = ""; playAttempted = false; startVideo(); });

    reduceMotionMQ.addEventListener
        ? reduceMotionMQ.addEventListener("change", () => { activeSrc = ""; playAttempted = false; startVideo(); })
        : reduceMotionMQ.addListener(() => { activeSrc = ""; playAttempted = false; startVideo(); });

    if (heroImg) heroImg.addEventListener("load", syncHeroBlurBackground);
    window.addEventListener("resize", syncHeroBlurBackground);

    // ── Fix 4: don't wait for full page load — start as soon as DOM is ready ──
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", startVideo);
    } else {
        startVideo();
    }
})();
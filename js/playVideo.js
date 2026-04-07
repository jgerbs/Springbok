(() => {
    const video = document.querySelector(".hero-video");
    const heroMedia = document.querySelector(".hero-media");
    const heroImg = document.querySelector(".hero-poster-img");

    if (!video && !heroImg) return;

    const mobileMQ = window.matchMedia("(max-width: 980px)");
    const reduceMotionMQ = window.matchMedia("(prefers-reduced-motion: reduce)");

    const mobileSrc = video?.dataset.videoMobile || "";
    const desktopSrc = video?.dataset.videoDesktop || "";

    let activeSrc = "";

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
        if (!video) return;
        video.pause();
        video.removeAttribute("src");
        video.load();
        activeSrc = "";
    }

    async function startVideo() {
        syncHeroBlurBackground();

        if (!video) return;

        const src = wantedSrc();
        if (!src) {
            stopVideo();
            return;
        }

        if (activeSrc !== src) {
            video.pause();
            video.src = src;
            video.load();
            activeSrc = src;
        }

        try {
            video.muted = true;
            video.defaultMuted = true;
            video.playsInline = true;
            video.setAttribute("muted", "");
            video.setAttribute("playsinline", "");
            video.setAttribute("webkit-playsinline", "");
            await video.play();
        } catch {
            // poster stays visible
        }
    }

    function onChange() {
        syncHeroBlurBackground();
        startVideo();
    }

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            if (video) video.pause();
        } else {
            startVideo();
        }
    });

    window.addEventListener("load", syncHeroBlurBackground);
    window.addEventListener("resize", syncHeroBlurBackground);

    if (heroImg) {
        heroImg.addEventListener("load", syncHeroBlurBackground);
    }

    if (mobileMQ.addEventListener) {
        mobileMQ.addEventListener("change", onChange);
        reduceMotionMQ.addEventListener("change", onChange);
    } else {
        mobileMQ.addListener(onChange);
        reduceMotionMQ.addListener(onChange);
    }

    syncHeroBlurBackground();
    startVideo();
})();
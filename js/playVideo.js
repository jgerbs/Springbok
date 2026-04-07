(() => {
    const video = document.querySelector(".hero-video");
    const heroImg = document.querySelector(".hero-poster-img");
    const heroMedia = document.querySelector(".hero-media");

    if (!video && !heroImg) return;

    function syncBlur() {
        if (!heroMedia || !heroImg) return;
        const src = heroImg.currentSrc || heroImg.src;
        if (src) heroMedia.style.setProperty("--hero-blur-bg", `url("${src}")`);
    }

    function tryPlay() {
        if (!video) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        video.play().catch(() => {});
    }

    document.addEventListener("visibilitychange", () => {
        if (!video) return;
        document.hidden ? video.pause() : tryPlay();
    });

    syncBlur();
    if (heroImg) heroImg.addEventListener("load", syncBlur);
    window.addEventListener("resize", syncBlur);

    if (video.readyState >= 3) {
        tryPlay();
    } else {
        video.addEventListener("canplay", tryPlay, { once: true });
    }
})();

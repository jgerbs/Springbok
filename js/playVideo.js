(() => {
    const video = document.querySelector(".hero-video");
    if (!video) return;

    const mobileMQ = window.matchMedia("(max-width: 960px)");
    const reduceMotionMQ = window.matchMedia("(prefers-reduced-motion: reduce)");

    const mobileSrc = video.dataset.videoMobile;
    const desktopSrc = video.dataset.videoDesktop;

    let activeSrc = "";

    function wantedSrc() {
        if (reduceMotionMQ.matches) return "";
        return mobileMQ.matches ? mobileSrc : desktopSrc;
    }

    function stopVideo() {
        video.pause();
        video.removeAttribute("src");
        video.load();
        activeSrc = "";
    }

    async function startVideo() {
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
        startVideo();
    }

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            video.pause();
        } else {
            startVideo();
        }
    });

    if (mobileMQ.addEventListener) {
        mobileMQ.addEventListener("change", onChange);
        reduceMotionMQ.addEventListener("change", onChange);
    } else {
        mobileMQ.addListener(onChange);
        reduceMotionMQ.addListener(onChange);
    }

    startVideo();
})();
(() => {
    const heroes = document.querySelectorAll(".hero");

    if (!heroes.length) return;

    const mobileMQ = window.matchMedia("(max-width: 960px)");
    const reduceMotionMQ = window.matchMedia("(prefers-reduced-motion: reduce)");

    function setupHero(hero) {
        const video = hero.querySelector(".hero-video");
        const heroMedia = hero.querySelector(".hero-media");
        const heroImg = hero.querySelector(".hero-poster-img");

        if (!video && !heroImg) return;

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

            video.muted = true;
            video.defaultMuted = true;
            video.autoplay = true;
            video.loop = true;
            video.playsInline = true;

            video.setAttribute("muted", "");
            video.setAttribute("autoplay", "");
            video.setAttribute("loop", "");
            video.setAttribute("playsinline", "");
            video.setAttribute("webkit-playsinline", "");

            try {
                const playPromise = video.play();
                if (playPromise && typeof playPromise.then === "function") {
                    await playPromise;
                }
            } catch (err) {
                // poster remains visible if autoplay is blocked or loading fails
                console.warn("Hero video could not autoplay:", err);
            }
        }

        function onChange() {
            syncHeroBlurBackground();
            startVideo();
        }

        document.addEventListener("visibilitychange", () => {
            if (!video) return;

            if (document.hidden) {
                video.pause();
            } else {
                startVideo();
            }
        });

        window.addEventListener("load", startVideo);
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
    }

    heroes.forEach(setupHero);
})();
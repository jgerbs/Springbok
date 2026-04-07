(() => {
    const reduceMotionMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileMQ = window.matchMedia("(max-width: 980px)");

    const heroes = [...document.querySelectorAll(".hero")];

    if (!heroes.length) return;

    function getWantedSrc(video) {
        if (reduceMotionMQ.matches) return "";
        return mobileMQ.matches
            ? (video.dataset.videoMobile || "")
            : (video.dataset.videoDesktop || "");
    }

    function syncHeroBlurBackground(hero) {
        const heroMedia = hero.querySelector(".hero-media");
        const heroImg = hero.querySelector(".hero-poster-img");
        if (!heroMedia || !heroImg) return;

        const src = heroImg.currentSrc || heroImg.src;
        if (!src) return;

        heroMedia.style.setProperty("--hero-blur-bg", `url("${src}")`);
    }

    function stopVideo(video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
        video.dataset.activeSrc = "";
    }

    async function startVideo(hero) {
        const video = hero.querySelector(".hero-video");
        if (!video) return;

        syncHeroBlurBackground(hero);

        const src = getWantedSrc(video);
        if (!src) {
            stopVideo(video);
            return;
        }

        if (video.dataset.activeSrc !== src) {
            video.pause();
            video.src = src;
            video.load();
            video.dataset.activeSrc = src;
        }

        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
        video.setAttribute("muted", "");
        video.setAttribute("autoplay", "");
        video.setAttribute("playsinline", "");
        video.setAttribute("webkit-playsinline", "");

        const tryPlay = async () => {
            try {
                await video.play();
            } catch {
                // poster remains as fallback
            }
        };

        if (video.readyState >= 2) {
            await tryPlay();
        } else {
            const onReady = async () => {
                video.removeEventListener("loadeddata", onReady);
                video.removeEventListener("canplay", onReady);
                await tryPlay();
            };

            video.addEventListener("loadeddata", onReady, { once: true });
            video.addEventListener("canplay", onReady, { once: true });
        }
    }

    const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            const hero = entry.target;
            const video = hero.querySelector(".hero-video");
            if (!video) return;

            if (entry.isIntersecting) {
                startVideo(hero);
            } else {
                video.pause();
            }
        });
    }, {
        rootMargin: "200px 0px",
        threshold: 0.01
    });

    heroes.forEach((hero) => {
        syncHeroBlurBackground(hero);

        const heroImg = hero.querySelector(".hero-poster-img");
        if (heroImg) {
            heroImg.addEventListener("load", () => syncHeroBlurBackground(hero));
        }

        io.observe(hero);
    });

    function refreshAll() {
        heroes.forEach((hero) => {
            syncHeroBlurBackground(hero);
            const rect = hero.getBoundingClientRect();
            const inView = rect.bottom > -200 && rect.top < window.innerHeight + 200;
            if (inView) startVideo(hero);
        });
    }

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            heroes.forEach((hero) => {
                const video = hero.querySelector(".hero-video");
                if (video) video.pause();
            });
        } else {
            refreshAll();
        }
    });

    window.addEventListener("load", refreshAll);
    window.addEventListener("resize", refreshAll);

    if (mobileMQ.addEventListener) {
        mobileMQ.addEventListener("change", refreshAll);
        reduceMotionMQ.addEventListener("change", refreshAll);
    } else {
        mobileMQ.addListener(refreshAll);
        reduceMotionMQ.addListener(refreshAll);
    }
})();
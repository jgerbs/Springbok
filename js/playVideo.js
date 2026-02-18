(function () {
    const media = document.querySelector(".hero-media");
    const v = document.querySelector(".hero-video");
    if (!media || !v) return;

    const mark = () => media.classList.add("is-playing");
    v.addEventListener("playing", mark, { once: true });
    v.addEventListener("canplay", mark, { once: true });
})();


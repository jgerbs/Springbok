(function () {
    const media = document.querySelector(".hero-media");
    const video = document.querySelector(".hero-video");
    if (!media || !video) return;

    // when the browser actually starts playing, fade in the video
    const markPlaying = () => media.classList.add("is-playing");

    // "playing" is the most reliable signal that frames are being shown
    video.addEventListener("playing", markPlaying, { once: true });

    // fallback: sometimes "canplay" happens before "playing" on certain devices
    video.addEventListener("canplay", markPlaying, { once: true });
})();
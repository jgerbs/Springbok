// js/testimonialsWheel.js
(() => {
  const track = document.getElementById("tWheelTrack");
  if (!track) return;

  const cards = Array.from(track.children);
  if (cards.length < 2) return;

  // Duplicate content once for seamless looping
  cards.forEach(card => track.appendChild(card.cloneNode(true)));

  let x = 0;
  let speed = 0.35; // <-- slower = smaller number (try 0.25 if you want slower)

  // total width of original set only
  const originalWidth = () => {
    const half = track.children.length / 2;
    let w = 0;
    for (let i = 0; i < half; i++) {
      w += track.children[i].getBoundingClientRect().width;
      if (i !== half - 1) w += parseFloat(getComputedStyle(track).gap || "0");
    }
    return w;
  };

  let wrapW = 0;
  const measure = () => (wrapW = originalWidth());
  measure();
  window.addEventListener("resize", measure);

  // Pause on hover (also handled by CSS, but we’ll keep JS pause too)
  let paused = false;
  track.parentElement?.addEventListener("mouseenter", () => (paused = true));
  track.parentElement?.addEventListener("mouseleave", () => (paused = false));

  function tick() {
    if (!paused) {
      x -= speed;
      if (Math.abs(x) >= wrapW) x = 0; // wrap seamlessly
      track.style.transform = `translate3d(${x}px,0,0)`;
    }
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();

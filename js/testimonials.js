// Testimonials

(() => {
  const track = document.getElementById("tTrack");
  const dotsWrap = document.getElementById("tDots");
  if (!track || !dotsWrap) return;

  const cards = Array.from(track.querySelectorAll(".t-card"));
  const prevBtn = document.querySelector(".t-prev");
  const nextBtn = document.querySelector(".t-next");

  function cardWidth() {
    const first = cards[0];
    const gap = parseFloat(getComputedStyle(track).gap || "0");
    return first.getBoundingClientRect().width + gap;
  }

  // build dots
  const pageCount = Math.max(1, Math.ceil(cards.length / 3)); // 3 visible desktop
  dotsWrap.innerHTML = "";
  const dots = Array.from({ length: pageCount }, (_, i) => {
    const b = document.createElement("button");
    b.className = "t-dot" + (i === 0 ? " is-active" : "");
    b.type = "button";
    b.setAttribute("aria-label", `Go to testimonials ${i + 1}`);
    b.addEventListener("click", () => goToPage(i));
    dotsWrap.appendChild(b);
    return b;
  });

  function setActiveDot() {
    const w = cardWidth();
    const page = Math.round(track.scrollLeft / (w * 3));
    dots.forEach((d, i) => d.classList.toggle("is-active", i === page));
  }

  function goToPage(i) {
    const w = cardWidth();
    track.scrollTo({ left: i * (w * 3), behavior: "smooth" });
  }

  prevBtn?.addEventListener("click", () => {
    const w = cardWidth();
    track.scrollBy({ left: -(w * 3), behavior: "smooth" });
  });

  nextBtn?.addEventListener("click", () => {
    const w = cardWidth();
    track.scrollBy({ left: w * 3, behavior: "smooth" });
  });

  track.addEventListener("scroll", () => {
    window.requestAnimationFrame(setActiveDot);
  });

  window.addEventListener("resize", setActiveDot);
})();
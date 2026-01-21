// Staff looping wheel (5 visible on ultra-wide, 3 on desktop, swipe-scroll on mobile)
(() => {
  const shell = document.querySelector(".staff-wheel-shell");
  const wheel = document.getElementById("staffWheel");
  if (!shell || !wheel) return;

  const cards = Array.from(wheel.querySelectorAll(".service-tile"));
  if (cards.length === 0) return;

  const prevBtn = shell.querySelector(".staff-prev");
  const nextBtn = shell.querySelector(".staff-next");

  let index = 0;
  let locked = false;

  const isMobile = () => window.matchMedia("(max-width: 900px)").matches;
  const isUltra = () => window.matchMedia("(min-width: 2150px)").matches;

  const mod = (n, m) => ((n % m) + m) % m;

  function clearStates(el) {
    el.classList.remove(
      "is-far-left",
      "is-left",
      "is-center",
      "is-right",
      "is-far-right",
      "is-off"
    );
  }

  function applyDesktopStates() {
    const n = cards.length;

    // reset to off
    cards.forEach(c => {
      clearStates(c);
      c.classList.add("is-off");
    });

    const center = mod(index, n);
    const left = mod(index - 1, n);
    const right = mod(index + 1, n);

    // always show center
    cards[center].classList.remove("is-off");
    cards[center].classList.add("is-center");

    // show left/right when we have more than 1
    if (n > 1) {
      cards[left].classList.remove("is-off");
      cards[left].classList.add("is-left");

      cards[right].classList.remove("is-off");
      cards[right].classList.add("is-right");
    }

    // ultra-wide: also show far-left/far-right
    if (isUltra() && n > 3) {
      const farLeft = mod(index - 2, n);
      const farRight = mod(index + 2, n);

      cards[farLeft].classList.remove("is-off");
      cards[farLeft].classList.add("is-far-left");

      cards[farRight].classList.remove("is-off");
      cards[farRight].classList.add("is-far-right");
    }
  }

  function applyMobileMode() {
    // mobile is pure scroll/snap, so we don't need staged classes
    cards.forEach(c => clearStates(c));
  }

  function paint() {
    if (isMobile()) applyMobileMode();
    else applyDesktopStates();
  }

  function step(dir) {
    if (locked) return;

    // On mobile, arrows scroll instead of class-rotating
    if (isMobile()) {
      const card = wheel.querySelector(".service-tile");
      const dx = card ? (card.getBoundingClientRect().width + 14) : 320;
      wheel.scrollBy({ left: dir * dx, behavior: "smooth" });
      return;
    }

    locked = true;
    index = index + dir;
    paint();
    window.setTimeout(() => { locked = false; }, 560);
  }

  prevBtn?.addEventListener("click", () => step(-1));
  nextBtn?.addEventListener("click", () => step(1));

  // keyboard support
  wheel.setAttribute("tabindex", "0");
  wheel.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });

  // pointer swipe (desktop only)
  let startX = 0;
  wheel.addEventListener("pointerdown", (e) => {
    if (isMobile()) return; // native scroll
    startX = e.clientX;
  });
  wheel.addEventListener("pointerup", (e) => {
    if (isMobile()) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
  });

  // re-apply on resize
  window.addEventListener("resize", paint);

  // Initial paint
  paint();

  // Optional auto-rotate (desktop only, pause on hover)
  let auto = window.setInterval(() => {
    if (!isMobile()) step(1);
  }, 6000);

  shell.addEventListener("mouseenter", () => { clearInterval(auto); });
  shell.addEventListener("mouseleave", () => {
    auto = window.setInterval(() => {
      if (!isMobile()) step(1);
    }, 6000);
  });
})();

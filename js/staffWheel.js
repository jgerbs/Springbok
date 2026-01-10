// Staff looping wheel (3 visible, fades + slides, infinite)
(() => {
  const wheel = document.getElementById("staffWheel");
  if (!wheel) return;

  const cards = Array.from(wheel.querySelectorAll(".service-tile"));
  if (cards.length === 0) return;

  const prevBtn = document.querySelector(".staff-prev");
  const nextBtn = document.querySelector(".staff-next");

  let index = 0;       // center card index
  let locked = false;  // prevent spam clicking during transition

  const isMobile = () => window.matchMedia("(max-width: 1050px)").matches;

  function mod(n, m){ return ((n % m) + m) % m; }

  function clearStates(el){
    el.classList.remove("is-left","is-center","is-right","is-off");
  }

  function apply(){
    const n = cards.length;

    // reset
    cards.forEach(c => { clearStates(c); c.classList.add("is-off"); });

    const center = mod(index, n);
    const left   = mod(index - 1, n);
    const right  = mod(index + 1, n);

    // center always
    cards[center].classList.remove("is-off");
    cards[center].classList.add("is-center");

    if (!isMobile() && n > 1){
      cards[left].classList.remove("is-off");
      cards[left].classList.add("is-left");

      cards[right].classList.remove("is-off");
      cards[right].classList.add("is-right");
    }
  }

  function step(dir){
    if (locked) return;
    locked = true;

    // move index first, then apply classes (CSS transitions handle slide/fade)
    index = index + dir;
    apply();

    // unlock after animation
    window.setTimeout(() => { locked = false; }, 560);
  }

  prevBtn?.addEventListener("click", () => step(-1));
  nextBtn?.addEventListener("click", () => step(1));

  // keyboard support (optional, feels premium)
  wheel.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });

  // Re-apply on resize (mobile = 1 visible)
  window.addEventListener("resize", apply);

  // Initial paint
  apply();

  // Optional auto-rotate (pause on hover)
  let auto = window.setInterval(() => step(1), 6000);

  wheel.addEventListener("mouseenter", () => { clearInterval(auto); });
  wheel.addEventListener("mouseleave", () => { auto = window.setInterval(() => step(1), 6000); });
})();
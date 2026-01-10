// Mobile menu
const mobileBtn = document.getElementById("mobileMenuBtn");
const mobilePanel = document.getElementById("mobilePanel");

if (mobileBtn && mobilePanel) {
  mobileBtn.addEventListener("click", () => {
    const open = mobilePanel.classList.toggle("open");
    mobileBtn.setAttribute("aria-expanded", open ? "true" : "false");
  });
}

// Dropdown click support for touch/mobile
const dd = document.getElementById("clinicDropdown");
const ddBtn = document.getElementById("clinicBtn");

function isMobile() {
  return window.matchMedia("(max-width: 980px)").matches;
}

function closeDropdown(){
  if(!dd || !ddBtn) return;
  dd.classList.remove("open");
  ddBtn.setAttribute("aria-expanded", "false");
}

if (dd && ddBtn) {
  ddBtn.addEventListener("click", (e) => {
    if (!isMobile()) return; // desktop uses hover
    e.preventDefault();
    const open = dd.classList.toggle("open");
    ddBtn.setAttribute("aria-expanded", open ? "true" : "false");
  });

  document.addEventListener("click", (e) => {
    if (!dd.contains(e.target)) closeDropdown();
  });

  window.addEventListener("resize", () => {
    if (!isMobile()) closeDropdown();
  });
}

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


// Contact

// =========================
// Contact "Send a Message" Modal
// =========================
(() => {
  const openBtn = document.getElementById("sendMessageBtn");
  const modal = document.getElementById("contactModal");
  const form = document.getElementById("contactForm");

  if (!openBtn || !modal) return;

  const dialog = modal.querySelector(".modal-dialog");
  const focusablesSel =
    'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])';

  let lastFocus = null;
  let autoCloseTimer = null;

  function openModal() {
    lastFocus = document.activeElement;

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    const firstInput = modal.querySelector("input, textarea, select, button");
    firstInput?.focus();

    // auto-close after a bit ONLY if user hasn't started typing
    clearTimeout(autoCloseTimer);
    autoCloseTimer = setTimeout(() => {
      const dirty =
        form &&
        Array.from(form.querySelectorAll("input, textarea")).some(
          (el) => el.value && el.value.trim().length > 0
        );

      if (!dirty) closeModal();
    }, 14000);
  }

  function closeModal() {
    clearTimeout(autoCloseTimer);

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  // Open
  openBtn.addEventListener("click", (e) => {
    e.preventDefault();
    openModal();
  });

  // Click backdrop or X or Cancel
  modal.addEventListener("click", (e) => {
    const t = e.target;
    if (t?.dataset?.close === "true") closeModal();
  });

  // ESC + focus trap
  document.addEventListener("keydown", (e) => {
    if (!modal.classList.contains("is-open")) return;

    if (e.key === "Escape") {
      e.preventDefault();
      closeModal();
      return;
    }

    if (e.key === "Tab") {
      const focusables = Array.from(dialog.querySelectorAll(focusablesSel));
      if (!focusables.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  // Fake send (matches your “leave it up for a bit” behavior)
  form?.addEventListener("submit", (e) => {
    e.preventDefault();

    const sendBtn = form.querySelector('button[type="submit"]');
    const cancelBtn = form.querySelector('button[data-close="true"]');

    // prevent double submit
    sendBtn && (sendBtn.disabled = true);
    cancelBtn && (cancelBtn.disabled = true);

    const prevText = sendBtn ? sendBtn.textContent : "";

    if (sendBtn) sendBtn.textContent = "Sending…";

  // keep modal up briefly, then show sent, then close
  setTimeout(() => {
    if (sendBtn) sendBtn.textContent = "Sent ✓";

    // ⬇️ INCREASE THIS DURATION (milliseconds)
    setTimeout(() => {
      closeModal();
      form.reset();

      if (sendBtn) {
        sendBtn.textContent = prevText;
        sendBtn.disabled = false;
      }
      if (cancelBtn) cancelBtn.disabled = false;
    }, 3000); // was 1100
  }, 900); // slight pause before showing "Sent ✓"

  });
})();

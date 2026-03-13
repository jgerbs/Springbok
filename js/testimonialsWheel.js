// js/testimonialsWheel.js
(() => {
  const track = document.getElementById("tWheelTrack");
  if (!track) return;

  const cards = Array.from(track.children);
  if (cards.length < 2) return;

  // Duplicate once for seamless looping
  cards.forEach((card) => track.appendChild(card.cloneNode(true)));

  let x = 0;
  let speed = 0.35;
  let paused = false;
  let wrapW = 0;

  const wheel = track.parentElement;
  if (!wheel) return;

  const desktopHoverMQ = window.matchMedia("(hover: hover) and (pointer: fine)");
  const mobileOpenMQ = window.matchMedia("(max-width: 780px)");

  let openTimer = null;
  let closeTimer = null;
  let activeCard = null;
  let lockedCard = null;

  const OPEN_DELAY = 110;
  const CLOSE_DELAY = 220;

  const originalWidth = () => {
    const half = track.children.length / 2;
    let w = 0;
    const gap = parseFloat(getComputedStyle(track).gap || "0");

    for (let i = 0; i < half; i++) {
      w += track.children[i].getBoundingClientRect().width;
      if (i !== half - 1) w += gap;
    }
    return w;
  };

  function setPaused(state) {
    paused = state;
    wheel.classList.toggle("is-paused", state);
  }

  function clearTimers() {
    if (openTimer) {
      clearTimeout(openTimer);
      openTimer = null;
    }
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
  }

  function unlockCard() {
    if (lockedCard) {
      lockedCard.classList.remove("is-locked", "is-expanded");
      lockedCard = null;
    }
  }

  function clearExpandedCards() {
    track.querySelectorAll(".t-card.is-expanded").forEach((card) => {
      if (card !== lockedCard) card.classList.remove("is-expanded");
    });
    activeCard = lockedCard || null;
  }

  function expandCard(card) {
    if (!card || lockedCard) return;
    clearExpandedCards();
    card.classList.add("is-expanded");
    activeCard = card;
    setPaused(true);
  }

  function collapseCard(card) {
    if (!card || card === lockedCard) return;
    card.classList.remove("is-expanded");
    if (activeCard === card) activeCard = null;
  }

  function lockCard(card) {
    if (!card) return;
    if (lockedCard === card) return;

    unlockCard();
    clearExpandedCards();

    card.classList.add("is-expanded", "is-locked");
    lockedCard = card;
    activeCard = card;
    setPaused(true);
  }

  function scheduleOpen(card) {
    if (lockedCard) return;
    clearTimers();
    openTimer = setTimeout(() => {
      expandCard(card);
    }, OPEN_DELAY);
  }

  function scheduleClose(card) {
    if (lockedCard) return;
    clearTimers();
    closeTimer = setTimeout(() => {
      collapseCard(card);
      setPaused(false);
    }, CLOSE_DELAY);
  }

  function detectOverflow() {
    if (mobileOpenMQ.matches) {
      track.querySelectorAll(".t-card").forEach((card) => {
        card.classList.remove("has-overflow");
      });
      return;
    }

    track.querySelectorAll(".t-card").forEach((card) => {
      const measureText = card.querySelector(".t-textMeasure");
      const previewText = card.querySelector(".t-text");
      if (!measureText || !previewText) return;

      const lineHeight = parseFloat(getComputedStyle(previewText).lineHeight);
      const clampLines = window.innerWidth <= 980 ? 2 : 3;
      const clampHeight = lineHeight * clampLines;
      const fullHeight = measureText.scrollHeight;

      card.classList.toggle("has-overflow", fullHeight > clampHeight + 2);
    });
  }

  const measure = () => {
    wrapW = originalWidth();
    detectOverflow();
  };

  measure();
  window.addEventListener("resize", measure);

  track.querySelectorAll(".t-card").forEach((card) => {
    if (!card.hasAttribute("tabindex")) card.setAttribute("tabindex", "0");
  });

  wheel.addEventListener("mouseenter", () => {
    if (!mobileOpenMQ.matches) setPaused(true);
  });

  wheel.addEventListener("mouseleave", () => {
    if (mobileOpenMQ.matches || lockedCard) return;

    clearTimers();
    closeTimer = setTimeout(() => {
      clearExpandedCards();
      setPaused(false);
    }, CLOSE_DELAY);
  });

  track.addEventListener("mouseover", (e) => {
    if (!desktopHoverMQ.matches || mobileOpenMQ.matches || lockedCard) return;

    const card = e.target.closest(".t-card");
    if (!card) return;

    if (activeCard === card) {
      clearTimers();
      setPaused(true);
      return;
    }

    scheduleOpen(card);
  });

  track.addEventListener("mouseout", (e) => {
    if (!desktopHoverMQ.matches || mobileOpenMQ.matches || lockedCard) return;

    const card = e.target.closest(".t-card");
    if (!card) return;

    const related = e.relatedTarget;
    if (related && card.contains(related)) return;

    scheduleClose(card);
  });

  track.addEventListener("focusin", (e) => {
    if (mobileOpenMQ.matches || lockedCard) return;

    const card = e.target.closest(".t-card");
    if (!card) return;

    clearTimers();
    expandCard(card);
  });

  track.addEventListener("focusout", () => {
    if (mobileOpenMQ.matches || lockedCard) return;

    clearTimers();
    closeTimer = setTimeout(() => {
      clearExpandedCards();
      setPaused(false);
    }, CLOSE_DELAY);
  });

  // Click / tap card = lock open and pause (desktop + mobile)
  track.addEventListener("click", (e) => {
    const card = e.target.closest(".t-card");
    if (!card) return;

    e.stopPropagation();
    clearTimers();

    // Tap/click same card again = close it
    if (lockedCard === card) {
      unlockCard();
      clearExpandedCards();
      setPaused(false);
      return;
    }

    lockCard(card);
  });

  // Click / tap anywhere else = unlock and resume
  document.addEventListener("click", (e) => {
    if (!lockedCard) return;
    if (wheel.contains(e.target)) return;

    clearTimers();
    unlockCard();
    clearExpandedCards();
    setPaused(false);
  });

  function tick() {
    if (!paused) {
      x -= speed;
      if (Math.abs(x) >= wrapW) x = 0;
      track.style.transform = `translate3d(${x}px,0,0)`;
    }
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();
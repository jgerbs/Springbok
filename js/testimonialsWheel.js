// js/testimonialsWheel.js
(() => {
  const track = document.getElementById("tWheelTrack");
  if (!track) return;

  const cards = Array.from(track.children);
  if (cards.length < 2) return;

  // Duplicate once for seamless looping
  cards.forEach((card) => track.appendChild(card.cloneNode(true)));

  const wheel = track.parentElement;
  if (!wheel) return;

  const desktopHoverMQ = window.matchMedia("(hover: hover) and (pointer: fine)");
  const mobileOpenMQ = window.matchMedia("(max-width: 780px)");
  const coarsePointerMQ = window.matchMedia("(pointer: coarse)");

  function getIdleSpeed() {
    const isSmall = window.innerWidth <= 780;
    const isCoarse = coarsePointerMQ.matches;

    // real phone / touch device on small view
    if (isSmall && isCoarse) return -0.82;

    // narrow desktop window
    if (isSmall && !isCoarse) return -0.45;

    // larger touch device / tablet / touch laptop
    if (!isSmall && isCoarse) return -0.68;

    // desktop
    return -0.72;
  }

  let x = 0;
  let wrapW = 0;
  let paused = false;

  let idleSpeed = getIdleSpeed();
  let velocity = idleSpeed;

  // drag state
  let isPointerDown = false;
  let pointerMoved = false;
  let startX = 0;
  let lastX = 0;
  let lastT = 0;
  let activePointerId = null;

  let openTimer = null;
  let closeTimer = null;
  let activeCard = null;
  let lockedCard = null;

  const OPEN_DELAY = 110;
  const CLOSE_DELAY = 220;

  // tuning
  const DRAG_MULTIPLIER = 1.0;
  const RELEASE_MULTIPLIER = 1.0;
  const FRICTION = 0.972;
  const RETURN_PULL = 0.018;
  const MOVE_THRESHOLD = 8;
  const MAX_VELOCITY = 6.2;

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

  function normalizeX() {
    if (!wrapW) return;
    while (x <= -wrapW) x += wrapW;
    while (x > 0) x -= wrapW;
  }

  function applyTransform() {
    normalizeX();
    track.style.transform = `translate3d(${x}px,0,0)`;
  }

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
    if (lockedCard || isPointerDown || pointerMoved) return;
    clearTimers();
    openTimer = setTimeout(() => {
      expandCard(card);
    }, OPEN_DELAY);
  }

  function scheduleClose(card) {
    if (lockedCard || isPointerDown) return;
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

  function measure() {
    wrapW = originalWidth();
    idleSpeed = getIdleSpeed();

    // if we're basically idle, sync velocity to new idle speed
    if (Math.abs(velocity) < 1) velocity = idleSpeed;

    detectOverflow();
    applyTransform();
  }

  measure();
  window.addEventListener("resize", measure);

  track.querySelectorAll(".t-card").forEach((card) => {
    if (!card.hasAttribute("tabindex")) card.setAttribute("tabindex", "0");
  });

  wheel.addEventListener("mouseenter", () => {
    if (!mobileOpenMQ.matches && !isPointerDown) setPaused(true);
  });

  wheel.addEventListener("mouseleave", () => {
    if (mobileOpenMQ.matches || lockedCard || isPointerDown) return;

    clearTimers();
    closeTimer = setTimeout(() => {
      clearExpandedCards();
      setPaused(false);
    }, CLOSE_DELAY);
  });

  track.addEventListener("mouseover", (e) => {
    if (!desktopHoverMQ.matches || mobileOpenMQ.matches || lockedCard || isPointerDown) return;

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
    if (!desktopHoverMQ.matches || mobileOpenMQ.matches || lockedCard || isPointerDown) return;

    const card = e.target.closest(".t-card");
    if (!card) return;

    const related = e.relatedTarget;
    if (related && card.contains(related)) return;

    scheduleClose(card);
  });

  track.addEventListener("focusin", (e) => {
    if (mobileOpenMQ.matches || lockedCard || isPointerDown) return;

    const card = e.target.closest(".t-card");
    if (!card) return;

    clearTimers();
    expandCard(card);
  });

  track.addEventListener("focusout", () => {
    if (mobileOpenMQ.matches || lockedCard || isPointerDown) return;

    clearTimers();
    closeTimer = setTimeout(() => {
      clearExpandedCards();
      setPaused(false);
    }, CLOSE_DELAY);
  });

  // -------------------------
  // drag / swipe on all views
  // -------------------------
  function onPointerDown(e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;

    isPointerDown = true;
    pointerMoved = false;
    activePointerId = e.pointerId;
    startX = e.clientX;
    lastX = e.clientX;
    lastT = performance.now();

    clearTimers();

    try {
      wheel.setPointerCapture?.(e.pointerId);
    } catch { }

    // stop hover weirdness while dragging
    if (!lockedCard) {
      clearExpandedCards();
      setPaused(false);
    }
  }

  function onPointerMove(e) {
    if (!isPointerDown) return;
    if (activePointerId !== null && e.pointerId !== activePointerId) return;

    const now = performance.now();
    const dx = e.clientX - lastX;
    const totalDx = e.clientX - startX;
    const dt = Math.max(now - lastT, 1);

    if (Math.abs(totalDx) > MOVE_THRESHOLD) {
      pointerMoved = true;
    }

    x += dx * DRAG_MULTIPLIER;
    applyTransform();

    velocity = Math.max(
      -MAX_VELOCITY,
      Math.min(MAX_VELOCITY, (dx / dt) * 16 * RELEASE_MULTIPLIER)
    );

    lastX = e.clientX;
    lastT = now;
  }

  function endPointerDrag(e) {
    if (!isPointerDown) return;
    if (activePointerId !== null && e.pointerId !== activePointerId) return;

    isPointerDown = false;

    try {
      wheel.releasePointerCapture?.(e.pointerId);
    } catch { }

    activePointerId = null;

    // reset drag flag a tick later so click suppression still works
    if (pointerMoved) {
      setTimeout(() => {
        pointerMoved = false;
      }, 0);
    }
  }

  wheel.addEventListener("pointerdown", onPointerDown);
  wheel.addEventListener("pointermove", onPointerMove);
  wheel.addEventListener("pointerup", endPointerDrag);
  wheel.addEventListener("pointercancel", endPointerDrag);
  wheel.addEventListener("lostpointercapture", () => {
    isPointerDown = false;
    activePointerId = null;
  });

  // Click / tap card = lock open and pause
  track.addEventListener("click", (e) => {
    const card = e.target.closest(".t-card");
    if (!card) return;

    // ignore clicks created by dragging
    if (pointerMoved) return;

    e.stopPropagation();
    clearTimers();

    if (lockedCard === card) {
      unlockCard();
      clearExpandedCards();
      setPaused(false);
      velocity = idleSpeed;
      return;
    }

    lockCard(card);
  });

  // Tap/click outside = unlock and resume
  document.addEventListener("click", (e) => {
    if (!lockedCard) return;
    if (wheel.contains(e.target)) return;

    clearTimers();
    unlockCard();
    clearExpandedCards();
    setPaused(false);
    velocity = idleSpeed;
  });

  function tick() {
    if (!paused && !isPointerDown) {
      velocity *= FRICTION;
      velocity += (idleSpeed - velocity) * RETURN_PULL;

      x += velocity;
      applyTransform();
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();
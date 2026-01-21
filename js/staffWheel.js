function initStaffWheel(shell) {
  const wheel = shell.querySelector('.staff-wheel');
  if (!wheel) return;

  const cards = [...wheel.querySelectorAll('.service-tile')];
  if (!cards.length) return;

  // ✅ support BOTH overlay + row buttons
  const prevBtns = [...shell.querySelectorAll('.staff-prev')];
  const nextBtns = [...shell.querySelectorAll('.staff-next')];

  let index = 0;
  let locked = false;

  function paint() {
    const n = cards.length;

    cards.forEach((card, i) => {
      card.classList.remove('is-far-left', 'is-left', 'is-center', 'is-right', 'is-far-right', 'is-off');

      const rel = (i - index + n) % n;

      if (rel === 0) card.classList.add('is-center');
      else if (rel === 1) card.classList.add('is-right');
      else if (rel === 2) card.classList.add('is-far-right');
      else if (rel === n - 1) card.classList.add('is-left');
      else if (rel === n - 2) card.classList.add('is-far-left');
      else card.classList.add('is-off');
    });
  }

  function go(dir) {
    if (locked) return;
    locked = true;

    const n = cards.length;
    index = (index + dir + n) % n;
    paint();

    window.setTimeout(() => { locked = false; }, 560);
  }

  prevBtns.forEach(btn => btn.addEventListener('click', () => go(-1)));
  nextBtns.forEach(btn => btn.addEventListener('click', () => go(1)));

  wheel.setAttribute('tabindex', '0');
  wheel.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'ArrowRight') go(1);
  });

  // Swipe (touch + trackpad friendly)
  let startX = 0, startY = 0, tracking = false, horizontalIntent = false;

  wheel.addEventListener('pointerdown', (e) => {
    tracking = true;
    horizontalIntent = false;
    startX = e.clientX;
    startY = e.clientY;
  });

  wheel.addEventListener('pointermove', (e) => {
    if (!tracking) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (!horizontalIntent && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      horizontalIntent = Math.abs(dx) > Math.abs(dy);
    }

    if (horizontalIntent && e.cancelable) e.preventDefault();
  }, { passive: false });

  wheel.addEventListener('pointerup', (e) => {
    if (!tracking) return;
    tracking = false;

    const dx = e.clientX - startX;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
  });

  wheel.addEventListener('pointercancel', () => { tracking = false; });

  paint();
}

document.querySelectorAll('.staff-wheel-shell[data-wheel]').forEach(initStaffWheel);

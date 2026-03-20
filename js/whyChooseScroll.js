(() => {
    const shell = document.querySelector("[data-why-scroll]");
    const founders = document.querySelector(".founders");
    if (!shell || !founders) return;

    const panels = Array.from(shell.querySelectorAll(".why-panel"));
    const jumpButtons = Array.from(shell.querySelectorAll("[data-why-jump]"));

    const currentEl = document.getElementById("whyCurrent");
    const activeTitleEl = document.getElementById("whyActiveTitle");
    const activeTextEl = document.getElementById("whyActiveText");
    const progressBar = document.getElementById("whyProgressBar");

    if (!panels.length || !currentEl || !activeTitleEl || !activeTextEl || !progressBar) return;

    const maxIndex = panels.length - 1;

    let activeIndex = 0;
    let displayProgress = 0;

    let isLocked = false;
    let isAnimating = false;
    let rafId = null;
    let touchStartY = 0;

    let tweenFrom = 0;
    let tweenTo = 0;
    let tweenStart = 0;
    let tweenDuration = 430;

    let wheelBuffer = 0;
    const wheelThreshold = 42;

    let touchGestureActive = false;
    let touchHasCommitted = false;
    let touchGestureStartY = 0;
    let touchLastY = 0;

    const panelData = panels.map((panel, index) => ({
        title: panel.querySelector(".why-panel-tag")?.textContent?.trim() || `Item ${index + 1}`,
        text: panel.querySelector(".why-panel-text")?.textContent?.trim() || ""
    }));

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    function easeInOutCubic(t) {
        return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function inInteractiveMode() {
        return true;
    }

    function getFoundersRevealGap() {
        // how much of founders may be allowed to approach before blocking
        // bigger = founders stays further below the screen
        if (window.innerWidth <= 1180) return 120;
        return 120;
    }

    function getBlockScrollY() {
        return Math.max(
            0,
            founders.offsetTop - window.innerHeight + getFoundersRevealGap()
        );
    }

    function whySequenceComplete() {
        return activeIndex >= maxIndex;
    }

    function shouldHardBlockDownwardScroll() {
        if (!inInteractiveMode()) return false;
        if (whySequenceComplete()) return false;

        return window.scrollY >= getBlockScrollY() - 2;
    }

    function forceToBlockPoint() {
        const y = getBlockScrollY();
        if (Math.abs(window.scrollY - y) > 1) {
            window.scrollTo(0, y);
        }
    }

    function setLocked(locked) {
        isLocked = locked;
        document.body.classList.toggle("why-scroll-locked", locked);

        if (!locked) {
            wheelBuffer = 0;
        }
    }

    function updateCopy(index) {
        currentEl.textContent = String(index + 1).padStart(2, "0");
        activeTitleEl.textContent = panelData[index].title;
        activeTextEl.textContent = panelData[index].text;
        progressBar.style.width = `${((index + 1) / panels.length) * 100}%`;

        jumpButtons.forEach((btn, i) => {
            const active = i === index;
            btn.classList.toggle("is-active", active);
            btn.setAttribute("aria-current", active ? "true" : "false");
        });
    }

    function paint(progress) {
        const dir = tweenTo >= tweenFrom ? 1 : -1;

        panels.forEach((panel, i) => {
            const delta = progress - i;
            const distance = Math.abs(delta);

            let y = 0;
            let opacity = 0;
            let scale = 1;
            const z = 20 - Math.round(distance * 10);

            if (dir === 1) {
                if (delta <= -1) {
                    y = 44;
                    opacity = 0;
                    scale = 0.985;
                } else if (delta < 0) {
                    const t = easeOutCubic(1 + delta);
                    y = 44 - (44 * t);
                    opacity = 0.18 + (0.82 * t);
                    scale = 0.985 + (0.015 * t);
                } else if (delta < 1) {
                    const t = easeOutCubic(delta);
                    y = -(28 * t);
                    opacity = 1 - t;
                    scale = 1 - (0.012 * t);
                } else {
                    y = -28;
                    opacity = 0;
                    scale = 0.988;
                }
            } else {
                if (delta >= 1) {
                    y = -44;
                    opacity = 0;
                    scale = 0.985;
                } else if (delta > 0) {
                    const t = easeOutCubic(1 - delta);
                    y = -44 + (44 * t);
                    opacity = 0.18 + (0.82 * t);
                    scale = 0.985 + (0.015 * t);
                } else if (delta > -1) {
                    const t = easeOutCubic(-delta);
                    y = 28 * t;
                    opacity = 1 - t;
                    scale = 1 - (0.012 * t);
                } else {
                    y = 28;
                    opacity = 0;
                    scale = 0.988;
                }
            }

            panel.style.transform = `translate3d(0, ${y}px, 0) scale(${scale})`;
            panel.style.opacity = `${clamp(opacity, 0, 1)}`;
            panel.style.zIndex = String(z);
            panel.style.pointerEvents = i === activeIndex ? "auto" : "none";
        });
    }

    function animateTween(now) {
        const elapsed = now - tweenStart;
        const t = clamp(elapsed / tweenDuration, 0, 1);
        const eased = easeInOutCubic(t);

        displayProgress = tweenFrom + (tweenTo - tweenFrom) * eased;
        paint(displayProgress);

        if (t < 1) {
            rafId = requestAnimationFrame(animateTween);
            return;
        }

        displayProgress = tweenTo;
        paint(displayProgress);
        rafId = null;
        isAnimating = false;
    }

    function startTween(toIndex, duration = 430) {
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }

        tweenFrom = displayProgress;
        tweenTo = toIndex;
        tweenStart = performance.now();
        tweenDuration = duration;

        isAnimating = true;
        rafId = requestAnimationFrame(animateTween);
    }

    function snapTo(index, duration = 430) {
        const next = clamp(index, 0, maxIndex);
        if (next === activeIndex) return;

        activeIndex = next;
        updateCopy(activeIndex);
        startTween(next, duration);
    }

    function stepDown() {
        if (isAnimating) return;
        if (activeIndex < maxIndex) {
            snapTo(activeIndex + 1, activeIndex === 0 ? 520 : 430);
            return;
        }
        setLocked(false);
    }

    function stepUp() {
        if (isAnimating) return;

        if (activeIndex > 0) {
            snapTo(activeIndex - 1, 430);
            return;
        }

        // at panel 1, allow user to leave upward
        setLocked(false);
    }

    function lockIfNeededForDownwardTravel() {
        if (!shouldHardBlockDownwardScroll()) return false;

        forceToBlockPoint();
        setLocked(true);
        return true;
    }

    function handleDirectionalInput(directionDown, preventDefault) {
        if (!inInteractiveMode()) return;

        if (!isLocked && directionDown) {
            const blocked = lockIfNeededForDownwardTravel();
            if (!blocked) return;
        }

        if (!isLocked && !directionDown) return;

        preventDefault();

        if (directionDown) {
            forceToBlockPoint();
            stepDown();
        } else {
            stepUp();
        }
    }

    function onWheel(e) {
        if (!inInteractiveMode()) return;
        if (Math.abs(e.deltaY) < 4) return;

        const directionDown = e.deltaY > 0;

        if (!isLocked && !directionDown) return;
        if (!isLocked && directionDown && !shouldHardBlockDownwardScroll()) return;

        e.preventDefault();
        wheelBuffer += e.deltaY;

        if (Math.abs(wheelBuffer) < wheelThreshold) return;

        const stepDirectionDown = wheelBuffer > 0;
        wheelBuffer = 0;

        handleDirectionalInput(stepDirectionDown, () => { });
    }

    function onTouchStart(e) {
        if (!e.touches?.length) return;

        touchGestureActive = true;
        touchHasCommitted = false;
        touchGestureStartY = e.touches[0].clientY;
        touchLastY = touchGestureStartY;
    }

    function onTouchMove(e) {
        if (!e.touches?.length) return;

        const currentY = e.touches[0].clientY;
        const totalDeltaY = touchGestureStartY - currentY;
        const directionDown = totalDeltaY > 0;

        touchLastY = currentY;

        if (!inInteractiveMode()) return;

        // if we're in the blocked zone or already locked, stop native page motion
        if (isLocked || (directionDown && shouldHardBlockDownwardScroll())) {
            e.preventDefault();
        }

        // one card max per finger-down gesture
        if (touchHasCommitted) return;

        const swipeThreshold = 36;
        if (Math.abs(totalDeltaY) < swipeThreshold) return;

        if (!isLocked && !directionDown) return;
        if (!isLocked && directionDown && !shouldHardBlockDownwardScroll()) return;

        touchHasCommitted = true;
        handleDirectionalInput(directionDown, () => e.preventDefault());
    }

    function onTouchEnd() {
        touchGestureActive = false;
        touchHasCommitted = false;
    }

    function onScroll() {
        if (!inInteractiveMode()) {
            setLocked(false);
            return;
        }

        if (shouldHardBlockDownwardScroll()) {
            forceToBlockPoint();
            setLocked(true);
        }
    }

    function onResize() {
        if (!inInteractiveMode()) {
            setLocked(false);

            panels.forEach((panel) => {
                panel.style.transform = "";
                panel.style.opacity = "";
                panel.style.zIndex = "";
                panel.style.pointerEvents = "";
            });
            return;
        }

        if (isLocked) {
            forceToBlockPoint();
        }

        displayProgress = activeIndex;
        tweenFrom = activeIndex;
        tweenTo = activeIndex;
        paint(displayProgress);
    }

    function jumpTo(index) {
        snapTo(index, 360);

        if (index < maxIndex && inInteractiveMode()) {
            const shouldLock = window.scrollY >= getBlockScrollY() - 2;
            setLocked(shouldLock);
            if (shouldLock) forceToBlockPoint();
        } else {
            setLocked(false);
        }
    }

    jumpButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            jumpTo(Number(btn.dataset.whyJump));
        });
    });

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });
    
    updateCopy(activeIndex);
    paint(displayProgress);
})();
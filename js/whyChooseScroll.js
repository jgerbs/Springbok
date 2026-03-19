// js/whyChooseScroll.js
(() => {
    const shell = document.querySelector("[data-why-scroll]");
    if (!shell) return;

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
    let targetProgress = 0;

    let isLocked = false;
    let rafId = null;
    let touchStartY = 0;

    let stepCooldown = false;
    let isAnimating = false;
    let travelDirection = 1; // 1 = moving forward/down, -1 = moving backward/up

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

    function getHeaderOffset() {
        const raw = getComputedStyle(document.documentElement).getPropertyValue("--header-h");
        return parseFloat(raw) || 82;
    }

    function getLockTop() {
        return getHeaderOffset() + 24;
    }

    function inDesktopMode() {
        return window.innerWidth > 1080;
    }

    function setLocked(locked) {
        isLocked = locked;
        document.body.classList.toggle("why-scroll-locked", locked);
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
        panels.forEach((panel, i) => {
            const delta = progress - i;

            let y = 0;
            let opacity = 0;
            let scale = 1;

            const distance = Math.abs(delta);
            let z = Math.round((panels.length - distance) * 100);

            if (delta <= -1) {
                y = 160;
                opacity = 0;
                scale = 0.95;
            } else if (delta < 0) {
                const t = easeOutCubic(1 + delta);
                y = 160 - (160 * t);
                opacity = 0.18 + (0.82 * t);
                scale = 0.95 + (0.05 * t);
            } else if (delta < 1) {
                const t = easeOutCubic(delta);
                y = -(130 * t);
                opacity = 1 - t;
                scale = 1 - (0.03 * t);
            } else {
                y = -130;
                opacity = 0;
                scale = 0.97;
            }

            panel.style.transform = `translate3d(0, ${y}px, 0) scale(${scale})`;
            panel.style.opacity = `${clamp(opacity, 0, 1)}`;
            panel.style.zIndex = String(z);
            panel.style.pointerEvents = i === activeIndex ? "auto" : "none";
        });
    }

    function animateToTarget() {
        const diff = targetProgress - displayProgress;

        if (Math.abs(diff) < 0.001) {
            displayProgress = targetProgress;
            paint(displayProgress);
            rafId = null;
            isAnimating = false;
            return;
        }

        isAnimating = true;

        // slower + smoother than your current 0.14
        displayProgress += diff * 0.09;
        paint(displayProgress);
        rafId = requestAnimationFrame(animateToTarget);
    }

    function startAnimation() {
        if (rafId) return;
        rafId = requestAnimationFrame(animateToTarget);
    }

    function snapTo(index) {
        const next = clamp(index, 0, maxIndex);
        if (next === activeIndex) return;

        travelDirection = next > activeIndex ? 1 : -1;
        activeIndex = next;
        targetProgress = next;
        updateCopy(activeIndex);
        startAnimation();
    }

    function getZoneState() {
        const rect = shell.getBoundingClientRect();
        const lockTop = getLockTop();

        return {
            rect,
            isAtLockLine: rect.top <= lockTop && rect.bottom > window.innerHeight * 0.55,
            enteredFromTop: rect.top <= lockTop,
            stillVisible: rect.bottom > lockTop + 120
        };
    }

    function shouldCapture(directionDown) {
        if (!inDesktopMode()) return false;

        const zone = getZoneState();
        if (!zone.isAtLockLine) return false;

        if (directionDown) {
            return activeIndex < maxIndex;
        }

        return activeIndex > 0;
    }

    function releaseIfDone(directionDown) {
        if (directionDown && activeIndex >= maxIndex) {
            setLocked(false);
            return true;
        }

        if (!directionDown && activeIndex <= 0) {
            setLocked(false);
            return true;
        }

        return false;
    }

    function engageCooldown(ms = 420) {
        stepCooldown = true;
        setTimeout(() => {
            stepCooldown = false;
        }, ms);
    }

    function handleStep(directionDown, preventDefault) {
        if (!inDesktopMode()) return;

        if (!isLocked) {
            if (!shouldCapture(directionDown)) return;
            setLocked(true);
        }

        if (!isLocked) return;

        // allow natural exit at ends
        if (releaseIfDone(directionDown)) {
            return;
        }

        preventDefault();

        if (stepCooldown || isAnimating) return;

        if (directionDown) {
            snapTo(activeIndex + 1);
        } else {
            snapTo(activeIndex - 1);
        }

        engageCooldown();
    }

    function onWheel(e) {
        if (Math.abs(e.deltaY) < 8) return;
        handleStep(e.deltaY > 0, () => e.preventDefault());
    }

    function onTouchStart(e) {
        if (!e.touches?.length) return;
        touchStartY = e.touches[0].clientY;
    }

    function onTouchMove(e) {
        if (!inDesktopMode()) return;
        if (!e.touches?.length) return;

        const currentY = e.touches[0].clientY;
        const deltaY = touchStartY - currentY;

        if (Math.abs(deltaY) < 24) return;

        handleStep(deltaY > 0, () => e.preventDefault());
        touchStartY = currentY;
    }

    function onResize() {
        if (!inDesktopMode()) {
            setLocked(false);
            panels.forEach((panel) => {
                panel.style.transform = "";
                panel.style.opacity = "";
                panel.style.zIndex = "";
                panel.style.pointerEvents = "";
            });
            return;
        }

        targetProgress = activeIndex;
        displayProgress = activeIndex;
        paint(displayProgress);
    }

    function jumpTo(index) {
        snapTo(index);

        if (activeIndex > 0 && activeIndex < maxIndex && shouldCapture(true)) {
            setLocked(true);
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
    window.addEventListener("resize", onResize);

    updateCopy(activeIndex);
    paint(displayProgress);
})();
// scrollReveal.js
(() => {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (prefersReducedMotion) {
    document.querySelectorAll(".reveal, .reveal-stagger").forEach(el => {
      el.classList.add("is-visible");
    });
    return;
  }

  const revealItems = document.querySelectorAll(".reveal, .reveal-stagger");

  if (!("IntersectionObserver" in window) || !revealItems.length) return;

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const el = entry.target;
        el.classList.add("is-visible");

        // stagger children if needed
        if (el.classList.contains("reveal-stagger")) {
          [...el.children].forEach((child, i) => {
            child.style.transitionDelay = `${i * 200}ms`;
          });
        }

        obs.unobserve(el);
      });
    },
    {
      threshold: 0.15,
      rootMargin: "0px 0px -80px 0px"
    }
  );

  revealItems.forEach(el => observer.observe(el));
})();

// js/mobileMenu.js
(() => {
  const btn = document.getElementById("mobileMenuBtn");
  const panel = document.getElementById("mobilePanel");
  const menu = panel ? panel.querySelector(".mobile-menu") : null;

  if (!btn || !panel || !menu) return;

  const openMenu = () => {
    panel.classList.add("is-open");
    document.body.classList.add("menu-open");
    btn.classList.add("is-open");

    btn.setAttribute("aria-expanded", "true");
    panel.setAttribute("aria-hidden", "false");
  };

  const closeMenu = () => {
    panel.classList.remove("is-open");
    document.body.classList.remove("menu-open");
    btn.classList.remove("is-open");

    btn.setAttribute("aria-expanded", "false");
    panel.setAttribute("aria-hidden", "true");
  };

  const isOpen = () => panel.classList.contains("is-open");

  // Toggle on button
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    isOpen() ? closeMenu() : openMenu();
  });

  // IMPORTANT: clicking inside the card should NOT close or block links
  menu.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  // Click backdrop closes
  panel.addEventListener("click", () => {
    if (isOpen()) closeMenu();
  });

  // ESC closes
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen()) closeMenu();
  });

  // Let links navigate; close right after tap (doesn't cancel navigation)
  panel.querySelectorAll("a").forEach((a) => {
    a.addEventListener("pointerup", () => {
      // small delay so navigation isn't interrupted on mobile browsers
      setTimeout(() => closeMenu(), 50);
    });
  });

  // If resizing to desktop, close menu
  window.addEventListener("resize", () => {
    if (window.innerWidth > 860 && isOpen()) closeMenu();
  });
})();

// footer.js
(() => {
  const year = document.getElementById("footerYear");
  if (year) year.textContent = new Date().getFullYear();

  const toTopBtn = document.getElementById("toTopBtn");
  toTopBtn?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
})();

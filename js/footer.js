(() => {
  const year = document.getElementById("footerYear");
  if (year) year.textContent = new Date().getFullYear();

  const btn = document.getElementById("toTopBtn");
  if (!btn) return;

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  });
})();

document.addEventListener("DOMContentLoaded", () => {
  const v = document.querySelector(".hero-video");
  if (!v) return;
  const p = v.play();
  if (p?.catch) p.catch(() => { });
});

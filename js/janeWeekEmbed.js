// js/janeWeekEmbed.js
(function () {
  const wrap = document.querySelector("[data-jane-base]");
  const openBtn = document.getElementById("janeOpenBtn");
  const frame = document.getElementById("janeFrame");

  if (!wrap || !openBtn || !frame) return;

  const base = wrap.getAttribute("data-jane-base");
  const staff = wrap.getAttribute("data-staff") || "1";
  const treatment = wrap.getAttribute("data-treatment") || "3";

  // Get Monday of the current week (local browser time)
  function getWeekMondayISO(d = new Date()) {
    const date = new Date(d);
    const day = date.getDay(); // 0=Sun, 1=Mon...
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    date.setDate(date.getDate() + diffToMonday);
    date.setHours(0, 0, 0, 0);

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  const monday = getWeekMondayISO();
  const url = `${base}#staff_member/${staff}/treatment/${treatment}/${monday}`;

  openBtn.href = url;
  frame.src = url;
})();

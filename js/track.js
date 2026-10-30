
(function () {
  const counts = {};
  window.SiteTrack = { counts, report() { console.table(counts); } };
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-track]");
    if (t) counts[t.dataset.track] = (counts[t.dataset.track] || 0) + 1;
  });
})();

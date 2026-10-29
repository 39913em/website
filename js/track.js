// track.js — mide los clics de [data-track] sin cookies ni servicios externos.
// Consola del navegador: SiteTrack.report()  → tabla de clics por botón en tu sesión.
// Para medir visitas reales: ver README (GoatCounter, gratis y sin cookies).
(function () {
  const counts = {};
  window.SiteTrack = { counts, report() { console.table(counts); } };
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-track]");
    if (t) counts[t.dataset.track] = (counts[t.dataset.track] || 0) + 1;
  });
})();

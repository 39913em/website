// contact.js — arma el mailto en el navegador (no queda como texto plano en el HTML).
// Configura tu correo en data/site.json. Mientras sea "ejemplo.com", el botón de correo permanece oculto.
(function () {
  async function init() {
    const a = document.querySelector("[data-email]");
    if (!a) return;
    try {
      const s = await (await fetch("data/site.json")).json();
      if (!s.email || !s.email.domain || /ejemplo\.com$/i.test(s.email.domain)) {
        console.warn("[contacto] Falta tu correo real en data/site.json");
        return;
      }
      const addr = `${s.email.user}@${s.email.domain}`;
      a.href = `mailto:${addr}?subject=${encodeURIComponent(s.email.subject || "Proyecto")}`;
      a.querySelector("[data-email-label]").textContent = addr;
      a.hidden = false;
    } catch (e) { console.error(e); }
  }
  document.addEventListener("partials:loaded", init);
})();

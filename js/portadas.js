(function () {
  const YT_ID = /^[A-Za-z0-9_-]{11}$/;
  const FOLDER = "PORTAFOLIO/EXPERIENCIAS-VIRTUALES/";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Acepta el ID de 11 caracteres o cualquier enlace normal de YouTube (watch, youtu.be, shorts, embed).
  function youtubeId(value) {
    const v = String(value || "").trim();
    if (!v) return null;
    if (YT_ID.test(v)) return v;
    try {
      const u = new URL(v);
      if (u.hostname === "youtu.be") { const id = u.pathname.slice(1, 12); return YT_ID.test(id) ? id : null; }
      if (/(^|\.)youtube(-nocookie)?\.com$/.test(u.hostname)) {
        const q = u.searchParams.get("v");
        if (q && YT_ID.test(q)) return q;
        const m = u.pathname.match(/^\/(?:embed|shorts|live|v)\/([A-Za-z0-9_-]{11})/);
        if (m) return m[1];
      }
    } catch (e) { /* no era un enlace */ }
    return null;
  }

  // Solo imágenes del propio sitio: un nombre suelto se busca en PORTAFOLIO/EXPERIENCIAS-VIRTUALES/.
  function imagePath(value) {
    const v = String(value || "").trim();
    if (!v || /^[a-z][a-z0-9+.-]*:|^\/\//i.test(v) || v.includes("..") || !/\.(gif|webp|apng|png|avif|jpe?g)$/i.test(v)) return null;
    return v.includes("/") ? v : FOLDER + v;
  }

  function whenVisible(el, margin, onEnter, onLeave) {
    new IntersectionObserver((entries) => entries.forEach((e) => (e.isIntersecting ? onEnter() : onLeave && onLeave())), { rootMargin: margin, threshold: onLeave ? 0.25 : 0 }).observe(el);
  }

  // GIF alojado en el sitio: reemplaza la imagen fija; si el archivo no existe, se queda la de siempre.
  function gifCover(box, img, src) {
    let done = false;
    whenVisible(box, "300px", () => {
      if (done) return; done = true;
      const probe = new Image();
      probe.onload = () => { img.removeAttribute("loading"); img.src = src; };
      probe.src = src;
    });
  }

  // Video de YouTube sin sonido, en bucle y sin controles. Solo existe mientras la portada está a la vista.
  function videoCover(box, id, title, zoom) {
    let frame = null, timer = 0;
    if (zoom >= 1 && zoom <= 3) box.style.setProperty("--zoom", String(zoom));
    const start = () => {
      if (frame) return;
      frame = document.createElement("iframe");
      frame.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&modestbranding=1&playsinline=1&rel=0&disablekb=1&iv_load_policy=3&fs=0`;
      frame.title = title; frame.allow = "autoplay; encrypted-media; picture-in-picture";
      frame.referrerPolicy = "strict-origin-when-cross-origin"; frame.tabIndex = -1; frame.setAttribute("aria-hidden", "true");
      frame.addEventListener("load", () => { timer = setTimeout(() => box.classList.add("is-video"), 900); });
      box.appendChild(frame);
    };
    const stop = () => {
      clearTimeout(timer);
      if (frame) { frame.remove(); frame = null; }
      box.classList.remove("is-video");
    };
    whenVisible(box, "0px", start, stop);
  }

  async function init() {
    let cfg;
    try { cfg = await (await fetch("data/portadas.json")).json(); } catch (e) { return; }
    if (reduce) return; // quien pide menos movimiento ve la imagen fija
    document.querySelectorAll(".exp__card[data-track]").forEach((card) => {
      const c = cfg[card.dataset.track];
      const box = card.querySelector(".exp__img");
      const img = box && box.querySelector("img");
      if (!c || !box || !img) return;
      const id = youtubeId(c.youtube), src = imagePath(c.gif);
      if (id) videoCover(box, id, img.alt || "Portada", Number(c.zoom) || 1.2);
      else if (src) gifCover(box, img, src);
    });
  }
  document.addEventListener("partials:loaded", init);
})();

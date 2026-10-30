// obra.js — lee data/obra.json y pinta 3 pestañas (Video / Sonido / Imagen) + su grilla.
// Para agregar obra edita solo data/obra.json. Para ocultar una pieza: "hidden": true.
(function () {
  const pad = (n) => String(n).padStart(2, "0");

  function card(w, n, featured) {
    const li = document.createElement("article");
    li.className = "card" + (featured ? " card--feat" : "");
    li.dataset.id = w.id;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "card__btn";
    btn.dataset.openWork = w.id;
    btn.dataset.track = "card-" + w.id;
    btn.setAttribute("aria-label", "Abrir: " + w.title);

    const media = document.createElement("span");
    media.className = "card__media";
    if (typeof w.cover === "string") {
      const img = document.createElement("img");
      img.src = w.cover; img.alt = ""; img.loading = "lazy"; img.decoding = "async";
      media.appendChild(img);
      media.style.setProperty("--img", `url("${new URL(w.cover, document.baseURI).href}")`);
      ["s1", "s2"].forEach((c) => { const s = document.createElement("i"); s.className = "slice " + c; media.appendChild(s); });
    } else {
      media.classList.add("card__media--text");
      const b = document.createElement("b"); b.textContent = w.cover.text; media.appendChild(b);
    }
    const idx = document.createElement("span");
    idx.className = "card__idx"; idx.textContent = "N°" + pad(n);
    media.appendChild(idx);

    const meta = document.createElement("span");
    meta.className = "card__meta";
    const t = document.createElement("span"); t.className = "card__title"; t.textContent = w.title;
    const k = document.createElement("span"); k.className = "card__kicker"; k.textContent = w.kicker;
    meta.append(t, k);

    btn.append(media, meta);
    li.appendChild(btn);
    return li;
  }

  async function init() {
    const grid = document.querySelector("[data-grid]");
    const tabsEl = document.querySelector("[data-tabs]");
    if (!grid) return;

    let data;
    try { data = await (await fetch("data/obra.json")).json(); }
    catch (e) { grid.textContent = "No se pudo cargar la obra (data/obra.json)."; console.error(e); return; }

    data.works = data.works.filter((w) => !w.hidden);
    window.OBRA = data;
    data.visibleIds = data.works.map((w) => w.id);
    let current = data.categories[0].id;

    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { threshold: 0.1 });

    function render() {
      const list = data.works.filter((w) => w.cat === current);
      data.visibleIds = list.map((w) => w.id);
      grid.replaceChildren(...list.map((w, i) => card(w, i + 1, i === 0 && w.featured)));
      grid.querySelectorAll(".card").forEach((c, i) => { c.style.transitionDelay = (i % 6) * 50 + "ms"; io.observe(c); });
      tabsEl.querySelectorAll(".tab").forEach((b) => {
        b.setAttribute("aria-selected", String(b.dataset.tab === current));
        b.tabIndex = b.dataset.tab === current ? 0 : -1;
      });
      grid.setAttribute("aria-labelledby", "tab-" + current);
    }

    tabsEl.replaceChildren(...data.categories.map((c) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "tab"; b.id = "tab-" + c.id;
      b.setAttribute("role", "tab"); b.dataset.tab = c.id; b.dataset.track = "tab-" + c.id;
      const t = document.createElement("b"); t.textContent = c.label;
      const d = document.createElement("span"); d.textContent = c.desc;
      b.append(t, d);
      b.addEventListener("click", () => { current = c.id; render(); });
      return b;
    }));

    // flechas ←/→ entre pestañas (accesibilidad)
    tabsEl.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const ids = data.categories.map((c) => c.id);
      const next = ids[(ids.indexOf(current) + (e.key === "ArrowRight" ? 1 : -1) + ids.length) % ids.length];
      current = next; render(); tabsEl.querySelector(`[data-tab="${next}"]`).focus();
    });

    // si llegan por enlace directo #obra/id, mostrar la pestaña de esa pieza
    const m = location.hash.match(/^#obra\/([\w-]+)$/);
    const target = m && data.works.find((w) => w.id === m[1]);
    if (target) current = target.cat;

    render();
    document.dispatchEvent(new CustomEvent("obra:ready"));
  }
  document.addEventListener("partials:loaded", init);
})();

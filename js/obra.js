// obra.js — lee data/obra.json y pinta filtros + grilla. Para agregar obra edita solo el JSON.
(function () {
  const pad = (n) => String(n).padStart(2, "0");

  function card(w, index, featured) {
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
    idx.className = "card__idx"; idx.textContent = "N°" + pad(index + 1);
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
    const filtersEl = document.querySelector("[data-filters]");
    if (!grid) return;

    let data;
    try { data = await (await fetch("data/obra.json")).json(); }
    catch (e) { grid.textContent = "No se pudo cargar la obra (data/obra.json)."; console.error(e); return; }

    window.OBRA = data;
    data.visibleIds = data.works.map((w) => w.id);
    let current = "all";

    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { threshold: 0.1 });

    function render() {
      const list = data.works.filter((w) => current === "all" || w.cat === current);
      data.visibleIds = list.map((w) => w.id);
      const cta = document.createElement("article");
      cta.className = "card card--cta";
      const a = document.createElement("a");
      a.className = "card__btn"; a.href = "#contacto"; a.dataset.track = "grid-cta";
      const big = document.createElement("b"); big.textContent = "¿Tienes un proyecto?";
      const go = document.createElement("span"); go.textContent = "Hablemos →";
      a.append(big, go); cta.appendChild(a);
      grid.replaceChildren(...list.map((w) => card(w, data.works.indexOf(w), current === "all" && w.featured)), cta);
      grid.querySelectorAll(".card").forEach((c, i) => { c.style.transitionDelay = (i % 6) * 50 + "ms"; io.observe(c); });
      filtersEl.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filter === current)));
    }

    const defs = [{ id: "all", label: "Todo" }, ...data.categories];
    filtersEl.replaceChildren(...defs.map((c) => {
      const b = document.createElement("button");
      b.type = "button"; b.dataset.filter = c.id; b.dataset.track = "filter-" + c.id;
      const n = c.id === "all" ? data.works.length : data.works.filter((w) => w.cat === c.id).length;
      b.append(c.label);
      const sup = document.createElement("sup"); sup.textContent = n; b.appendChild(sup);
      b.addEventListener("click", () => { current = c.id; render(); });
      return b;
    }));

    render();
    document.dispatchEvent(new CustomEvent("obra:ready"));
  }
  document.addEventListener("partials:loaded", init);
})();

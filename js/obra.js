(function () {
  const pad = (n) => String(n).padStart(2, "0");
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };

  function soonTile(text) {
    const li = el("article", "card card--soon");
    const box = el("div", "soon"); box.append(el("b", null, text), el("span", null, "Próximamente")); li.appendChild(box); return li;
  }

  function card(w, n, featured) {
    const li = el("article", "card" + (featured ? " card--feat" : ""));
    li.dataset.id = w.id;
    const btn = el("button", "card__btn");
    btn.type = "button"; btn.dataset.openWork = w.id; btn.dataset.track = "card-" + w.id;
    btn.setAttribute("aria-label", "Abrir: " + w.title);
    const media = el("span", "card__media");
    if (typeof w.cover === "string") {
      const img = el("img"); img.src = w.cover; img.alt = ""; img.loading = "lazy"; img.decoding = "async";
      media.appendChild(img); media.style.setProperty("--img", `url("${new URL(w.cover, document.baseURI).href}")`);
      ["s1", "s2"].forEach((c) => media.appendChild(el("i", "slice " + c)));
    } else if (w.cover && w.cover.video) {
      const v = el("video"); v.src = w.cover.video; v.poster = w.cover.poster || "";
      v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true; v.preload = "metadata";
      v.setAttribute("aria-hidden", "true"); media.appendChild(v);
    } else if (w.cover && w.cover.text) {
      media.classList.add("card__media--text"); media.appendChild(el("b", null, w.cover.text));
    }
    media.appendChild(el("span", "card__idx", "N°" + pad(n)));
    const meta = el("span", "card__meta");
    meta.append(el("span", "card__title", w.title), el("span", "card__kicker", w.kicker || ""));
    btn.append(media, meta); li.appendChild(btn); return li;
  }

  function init() {
    const grid = document.querySelector("[data-grid]"), tabsEl = document.querySelector("[data-tabs]"), subtabsEl = document.querySelector("[data-subtabs]");
    if (!grid || !tabsEl || !subtabsEl) return;
    let data;
    try { data = window.OBRA || null; } catch (_) {}
    const load = data ? Promise.resolve(data) : fetch("data/obra.json").then(r => r.json());
    load.then((loaded) => {
      data = loaded; window.OBRA = data; data.visibleIds = data.works.map(w => w.id);
      let current = data.categories[0].id, currentSub = "all";
      const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.1 });

      function renderSubtabs(cat) {
        const subs = cat.subcategories || [];
        subtabsEl.hidden = !subs.length;
        if (!subs.length) { subtabsEl.replaceChildren(); currentSub = "all"; return; }
        const options = [{id:"all",label:"Todas"}, ...subs];
        if (!options.some(x => x.id === currentSub)) currentSub = "all";
        subtabsEl.replaceChildren(...options.map((sub) => {
          const b = el("button", "subtab", sub.label); b.type = "button"; b.dataset.subtab = sub.id;
          b.setAttribute("role", "tab"); b.setAttribute("aria-selected", String(sub.id === currentSub));
          b.addEventListener("click", () => { currentSub = sub.id; render(); }); return b;
        }));
      }

      function render() {
        const cat = data.categories.find(c => c.id === current);
        if (!cat) return;
        renderSubtabs(cat);
        const list = data.works.filter(w => w.cat === current && (currentSub === "all" || w.subcat === currentSub));
        data.visibleIds = list.map(w => w.id);
        const nodes = list.map((w, i) => card(w, i + 1, i === 0 && w.featured));
        const sub = (cat.subcategories || []).find(x => x.id === currentSub);
        if (sub && sub.soon && !list.length) nodes.push(soonTile(sub.soon));
        if (cat.soon && currentSub === "all") nodes.push(soonTile(cat.soon));
        grid.replaceChildren(...nodes);
        grid.querySelectorAll(".card").forEach((c, i) => { c.style.transitionDelay = (i % 6) * 50 + "ms"; io.observe(c); });
        tabsEl.querySelectorAll(".tab").forEach((b) => {
          b.setAttribute("aria-selected", String(b.dataset.tab === current)); b.tabIndex = b.dataset.tab === current ? 0 : -1;
        });
        subtabsEl.querySelectorAll(".subtab").forEach(b => b.setAttribute("aria-selected", String(b.dataset.subtab === currentSub)));
        grid.setAttribute("aria-labelledby", "tab-" + current);
      }

      tabsEl.replaceChildren(...data.categories.map((c) => {
        const b = el("button", "tab"); b.type = "button"; b.id = "tab-" + c.id;
        b.setAttribute("role", "tab"); b.dataset.tab = c.id; b.dataset.track = "tab-" + c.id;
        b.append(el("b", null, c.label), el("span", null, c.desc));
        b.addEventListener("click", () => { current = c.id; currentSub = "all"; render(); }); return b;
      }));
      tabsEl.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        const ids = data.categories.map(c => c.id);
        current = ids[(ids.indexOf(current) + (e.key === "ArrowRight" ? 1 : -1) + ids.length) % ids.length];
        currentSub = "all"; render(); tabsEl.querySelector(`[data-tab="${current}"]`).focus();
      });
      const m = location.hash.match(/^#obra\/([\w-]+)$/), target = m && data.works.find(w => w.id === m[1]);
      if (target) { current = target.cat; currentSub = target.subcat || "all"; }
      render(); document.dispatchEvent(new CustomEvent("obra:ready"));
    }).catch(() => { grid.textContent = "No se pudo cargar la obra (data/obra.json)."; });
  }
  document.addEventListener("partials:loaded", init);
})();

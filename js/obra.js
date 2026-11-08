(function () {
  const pad = (n) => String(n).padStart(2, "0");
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };

  function card(w, n, featured) {
    const li = el("article", "card" + (featured ? " card--feat" : ""));
    li.dataset.id = w.id;

    const btn = el("button", "card__btn");
    btn.type = "button";
    btn.dataset.openWork = w.id;
    btn.dataset.track = "card-" + w.id;
    btn.setAttribute("aria-label", "Abrir: " + w.title);

    const media = el("span", "card__media");
    if (typeof w.cover === "string") {
      const img = el("img");
      img.src = w.cover; img.alt = ""; img.loading = "lazy"; img.decoding = "async";
      media.appendChild(img);
      media.style.setProperty("--img", `url("${new URL(w.cover, document.baseURI).href}")`);
      ["s1", "s2"].forEach((c) => media.appendChild(el("i", "slice " + c)));
    } else if (w.cover.video) {
      const v = el("video");
      v.src = w.cover.video; v.poster = w.cover.poster || "";
      v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true; v.preload = "metadata";
      v.setAttribute("aria-hidden", "true");
      media.appendChild(v);
    } else {
      media.classList.add("card__media--text");
      media.appendChild(el("b", null, w.cover.text));
    }
    media.appendChild(el("span", "card__idx", "N°" + pad(n)));

    const meta = el("span", "card__meta");
    meta.append(el("span", "card__title", w.title), el("span", "card__kicker", w.kicker));
    btn.append(media, meta);
    li.appendChild(btn);
    return li;
  }

  function soonTile(text) {
    const li = el("article", "card card--soon");
    const box = el("div", "soon");
    box.append(el("b", null, text), el("span", null, "Próximamente"));
    li.appendChild(box);
    return li;
  }

  // Secciones "planas" (categoría con "flat": true): cada imagen o video de la sección es un
  // recuadro suelto. Se muestran todas juntas, sin tarjetas intermedias por proyecto.
  function flatten(data) {
    const info = {};
    data.categories.filter((c) => c.flat).forEach((c) => {
      if (Array.isArray(c.subcategories) && c.subcategories.length) c.subcategories.forEach((s) => { info[s.id] = { title: s.label, kicker: c.label }; });
      else info[c.id] = { title: c.label, kicker: c.desc || "" };
    });
    data.works = data.works.flatMap((w) => {
      const section = info[w.cat];
      if (!section) return [w];
      return w.items.map((it, n) => ({
        id: w.id + "-f" + (n + 1), cat: w.cat, flat: true, title: section.title, kicker: section.kicker, items: [it],
        cover: it.type === "img" ? (it.thumb || it.src)
          : it.type === "video" ? { video: it.src, poster: it.thumb || "" }
          : { text: it.label || section.title },
      }));
    });
  }

  async function init() {
    const grid = document.querySelector("[data-grid]");
    const tabsEl = document.querySelector("[data-tabs]");
    const subtabsEl = document.querySelector("[data-subtabs]");
    if (!grid) return;

    let data;
    try { data = await (await fetch("data/obra.json")).json(); }
    catch (e) { grid.textContent = "No se pudo cargar la obra (data/obra.json)."; return; }

    flatten(data);
    window.OBRA = data;
    data.visibleIds = data.works.map((w) => w.id);
    let current = data.categories[0].id;
    const subs = {}; // subsección elegida en cada categoría que tiene subcategorías

    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { threshold: 0.1 });

    function render() {
      const cat = data.categories.find((c) => c.id === current);
      const hasSubs = Array.isArray(cat.subcategories) && cat.subcategories.length > 0;
      if (hasSubs && !cat.subcategories.some((s) => s.id === subs[cat.id])) subs[cat.id] = cat.subcategories[0].id;
      const list = data.works.filter((w) => w.cat === (hasSubs ? subs[cat.id] : current));
      data.visibleIds = list.map((w) => w.id);
      const nodes = list.map((w, i) => card(w, i + 1, i === 0 && w.featured));
      if (cat.soon) nodes.push(soonTile(cat.soon));
      grid.replaceChildren(...nodes);
      grid.querySelectorAll(".card").forEach((c, i) => { c.style.transitionDelay = (i % 6) * 50 + "ms"; io.observe(c); });

      subtabsEl.hidden = !hasSubs;
      subtabsEl.replaceChildren();
      if (hasSubs) {
        subtabsEl.setAttribute("aria-label", "Tipo de " + cat.label.toLowerCase());
        subtabsEl.style.setProperty("--subtabs", cat.subcategories.length);
        subtabsEl.replaceChildren(...cat.subcategories.map((sub) => {
          const b = el("button", "subtab", sub.label.toUpperCase());
          b.type = "button"; b.setAttribute("role", "tab"); b.dataset.subtab = sub.id;
          b.setAttribute("aria-selected", String(sub.id === subs[cat.id]));
          b.addEventListener("click", () => { subs[cat.id] = sub.id; render(); });
          return b;
        }));
      }

      tabsEl.querySelectorAll(".tab").forEach((b) => {
        b.setAttribute("aria-selected", String(b.dataset.tab === current));
        b.tabIndex = b.dataset.tab === current ? 0 : -1;
      });
      grid.setAttribute("aria-labelledby", "tab-" + current);
    }

    tabsEl.replaceChildren(...data.categories.map((c) => {
      const b = el("button", "tab");
      b.type = "button"; b.id = "tab-" + c.id;
      b.setAttribute("role", "tab"); b.dataset.tab = c.id; b.dataset.track = "tab-" + c.id;
      b.append(el("b", null, c.label), el("span", null, c.desc || ""));
      b.addEventListener("click", () => { current = c.id; render(); });
      return b;
    }));

    tabsEl.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const ids = data.categories.map((c) => c.id);
      current = ids[(ids.indexOf(current) + (e.key === "ArrowRight" ? 1 : -1) + ids.length) % ids.length];
      render();
      tabsEl.querySelector(`[data-tab="${current}"]`).focus();
    });

    subtabsEl.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const cat = data.categories.find((c) => c.id === current);
      if (!cat || !cat.subcategories) return;
      const ids = cat.subcategories.map((s) => s.id);
      subs[cat.id] = ids[(ids.indexOf(subs[cat.id]) + (e.key === "ArrowRight" ? 1 : -1) + ids.length) % ids.length];
      render();
      subtabsEl.querySelector(`[data-subtab="${subs[cat.id]}"]`).focus();
    });

    // Botón flotante «Menú de obra»: aparece cuando ya bajaste de las áreas y regresa a ellas
    // de un salto, para pasar a otra área (Dibujo, Foto, etc.) sin volver a recorrer la galería.
    const upBtn = document.querySelector("[data-obra-up]");
    const obraSec = document.getElementById("obra");
    if (upBtn && obraSec) {
      let queued = false;
      const refresh = () => {
        queued = false;
        const hdr = (document.getElementById("hdr") || {}).offsetHeight || 64;
        const tabs = tabsEl.getBoundingClientRect(), sec = obraSec.getBoundingClientRect();
        upBtn.hidden = !(tabs.bottom < hdr + 8 && sec.bottom > innerHeight * 0.35);
      };
      const queue = () => { if (!queued) { queued = true; requestAnimationFrame(refresh); } };
      addEventListener("scroll", queue, { passive: true });
      addEventListener("resize", queue);
      upBtn.addEventListener("click", () => {
        tabsEl.scrollIntoView({ block: "start" });
        const sel = tabsEl.querySelector('[aria-selected="true"]');
        if (sel) sel.focus({ preventScroll: true });
      });
    }

    const m = location.hash.match(/^#obra\/([\w-]+)$/);
    const target = m && data.works.find((w) => w.id === m[1]);
    if (target) {
      const parent = data.categories.find((c) => c.subcategories && c.subcategories.some((s) => s.id === target.cat));
      current = parent ? parent.id : target.cat;
      if (parent) subs[parent.id] = target.cat;
    }

    render();
    document.dispatchEvent(new CustomEvent("obra:ready"));
  }
  document.addEventListener("partials:loaded", init);
})();

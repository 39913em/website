// lightbox.js — abre cada pieza en pantalla completa, navega por piezas y obras, enlaza #obra/id.
(function () {
  const YT = /^[A-Za-z0-9_-]{11}$/;
  let dlg, stage, S = { id: null, i: 0 };

  const $ = (s) => dlg.querySelector(s);
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  const works = () => window.OBRA.works;
  const find = (id) => works().find((w) => w.id === id);
  const seq = () => (window.OBRA.visibleIds.includes(S.id) ? window.OBRA.visibleIds : works().map((w) => w.id));

  function media(it) {
    if (it.type === "img") { const i = el("img"); i.src = it.src; i.alt = it.alt || ""; return i; }
    if (it.type === "video") { const v = el("video"); v.src = it.src; v.poster = it.thumb || ""; v.autoplay = v.loop = v.muted = v.playsInline = true; v.controls = true; return v; }
    if (it.type === "yt") {
      if (!YT.test(it.id)) return el("p", null, "Video no disponible");
      const box = el("div", "lb__embed" + (it.vertical ? " lb__embed--v" : ""));
      const f = el("iframe");
      f.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(it.id)}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
      f.title = it.label || "Video"; f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen"; f.allowFullscreen = true;
      f.referrerPolicy = "strict-origin-when-cross-origin";
      box.appendChild(f); return box;
    }
    if (it.type === "audio") {
      const box = el("div", "lb__audio");
      if (it.cover) { const i = el("img"); i.src = it.cover; i.alt = it.alt || ""; box.appendChild(i); }
      const a = el("audio"); a.controls = true; a.src = it.src; a.preload = "metadata"; box.appendChild(a); return box;
    }
    if (it.type === "link") {
      const box = el("div", "lb__link");
      box.appendChild(el("p", null, find(S.id).title));
      const a = el("a", "btn btn--inv btn--xl", it.label + " ↗");
      a.href = it.url; a.target = "_blank"; a.rel = "noopener noreferrer"; a.dataset.track = "lb-external-" + S.id;
      box.appendChild(a); return box;
    }
    return el("p", null, "");
  }

  function render() {
    const w = find(S.id), it = w.items[S.i], ids = seq();
    stage.replaceChildren(media(it));
    $("[data-lb-count]").textContent = `${String(ids.indexOf(S.id) + 1).padStart(2, "0")}/${String(ids.length).padStart(2, "0")} — pieza ${S.i + 1}/${w.items.length}`;
    $("[data-lb-kicker]").textContent = w.kicker || "";
    $("[data-lb-title]").textContent = w.title;
    $("[data-lb-desc]").textContent = w.desc || "";
    $("[data-lb-desc]").hidden = !w.desc;
    $("[data-lb-badges]").replaceChildren(...(w.badges || []).map((b) => el("li", null, b)));
    $("[data-lb-credits]").replaceChildren(...(w.credits || []).map(([k, v]) => { const d = el("div"); d.append(el("dt", null, k), el("dd", null, v)); return d; }));

    const th = $("[data-lb-thumbs]");
    th.hidden = w.items.length < 2;
    th.replaceChildren(...w.items.map((x, n) => {
      const b = el("button", "lb__thumb"); b.type = "button";
      b.setAttribute("aria-label", `Pieza ${n + 1}: ${x.label || x.alt || x.type}`);
      if (n === S.i) b.setAttribute("aria-current", "true");
      if (x.thumb) { const i = el("img"); i.src = x.thumb; i.alt = ""; i.loading = "lazy"; b.appendChild(i); }
      else b.textContent = x.type === "yt" ? "▶ " + (x.label || "Video") : x.label || x.type;
      b.addEventListener("click", () => { S.i = n; render(); });
      return b;
    }));
    history.replaceState(null, "", "#obra/" + S.id);
  }

  function open(id, i = 0) {
    if (!window.OBRA || !find(id)) return;
    S = { id, i };
    if (!dlg.open) { dlg.showModal(); document.documentElement.classList.add("no-scroll"); }
    render();
    dlg.querySelector(".lb__info").scrollTop = 0;
  }

  function step(dir) {
    const w = find(S.id), ids = seq();
    const n = S.i + dir;
    if (n >= 0 && n < w.items.length) { S.i = n; return render(); }
    const next = ids[(ids.indexOf(S.id) + dir + ids.length) % ids.length];
    S = { id: next, i: dir > 0 ? 0 : find(next).items.length - 1 };
    render();
  }

  function init() {
    dlg = document.getElementById("lb");
    if (!dlg) return;
    stage = $("[data-lb-stage]");

    document.addEventListener("click", (e) => {
      const t = e.target.closest("[data-open-work]");
      if (t) open(t.dataset.openWork);
    });

    $("[data-lb-close]").addEventListener("click", () => dlg.close());
    $("[data-lb-prev]").addEventListener("click", () => step(-1));
    $("[data-lb-next]").addEventListener("click", () => step(1));
    $("[data-lb-contact]").addEventListener("click", () => dlg.close());
    dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener("keydown", (e) => {
      if (e.target.closest("audio, video, [role=slider]")) return;
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    });
    dlg.addEventListener("close", () => {
      stage.replaceChildren();
      document.documentElement.classList.remove("no-scroll");
      if (location.hash.startsWith("#obra/")) history.replaceState(null, "", "#obra");
    });

    document.addEventListener("obra:ready", () => {
      const m = location.hash.match(/^#obra\/([\w-]+)$/);
      if (m) { document.getElementById("obra")?.scrollIntoView(); open(m[1]); }
    });
  }
  document.addEventListener("partials:loaded", init);
})();

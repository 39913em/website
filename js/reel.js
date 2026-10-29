// reel.js — reel vertical: timecode real, activar sonido, pausa, barra, pantalla completa.
(function () {
  const FPS = 30;
  const pad = (n) => String(n).padStart(2, "0");
  const fmt = (t) => `${pad(Math.floor(t / 3600))}:${pad(Math.floor(t / 60) % 60)}:${pad(Math.floor(t) % 60)}:${pad(Math.floor((t % 1) * FPS))}`;

  function init() {
    const reel = document.querySelector("[data-reel]");
    if (!reel) return;
    const v = reel.querySelector("video");
    const tc = reel.querySelector("[data-reel-tc]");
    const fill = reel.querySelector("[data-reel-fill]");
    const track = reel.querySelector("[data-reel-track]");
    const label = reel.querySelector("[data-reel-cover-label]");
    const playBtn = reel.querySelector("[data-reel-play]");
    const muteBtn = reel.querySelector("[data-reel-mute]");
    const fullBtn = reel.querySelector("[data-reel-full]");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

    let manualPause = false;
    let raf = 0;

    const paint = () => {
      const p = v.duration ? v.currentTime / v.duration : 0;
      fill.style.setProperty("--p", p.toFixed(4));
      track.setAttribute("aria-valuenow", Math.round(p * 100));
      tc.textContent = fmt(v.currentTime);
    };
    const loop = () => { paint(); raf = requestAnimationFrame(loop); };
    const startLoop = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); };
    const stopLoop = () => { cancelAnimationFrame(raf); paint(); };

    const sync = () => {
      reel.classList.toggle("is-paused", v.paused);
      reel.classList.toggle("is-muted", v.muted);
      playBtn.setAttribute("aria-label", v.paused ? "Reproducir" : "Pausar");
      muteBtn.setAttribute("aria-label", v.muted ? "Activar sonido" : "Silenciar");
      v.paused ? stopLoop() : startLoop();
    };

    const enableSound = () => {
      reel.classList.add("is-sound");
      manualPause = false;
      v.loop = false;
      v.muted = false;
      v.currentTime = 0;
      v.play().catch(() => { v.muted = true; v.play(); });
      sync();
      reel.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
    };

    document.querySelectorAll("[data-reel-sound]").forEach((b) => b.addEventListener("click", enableSound));

    playBtn.addEventListener("click", () => {
      if (v.paused) { manualPause = false; v.play(); } else { manualPause = true; v.pause(); }
    });
    v.addEventListener("click", () => { if (reel.classList.contains("is-sound")) playBtn.click(); });
    muteBtn.addEventListener("click", () => { v.muted = !v.muted; sync(); });

    fullBtn.addEventListener("click", () => {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (reel.requestFullscreen) reel.requestFullscreen();
      else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
    });

    const seek = (clientX) => {
      const r = track.getBoundingClientRect();
      v.currentTime = Math.max(0, Math.min(1, (clientX - r.left) / r.width)) * (v.duration || 0);
      paint();
    };
    track.addEventListener("click", (e) => seek(e.clientX));
    track.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") v.currentTime = Math.min(v.duration, v.currentTime + 5);
      if (e.key === "ArrowLeft") v.currentTime = Math.max(0, v.currentTime - 5);
    });

    // al terminar con sonido: vuelve al loop mudo y ofrece repetir
    v.addEventListener("ended", () => {
      reel.classList.remove("is-sound");
      label.textContent = "Ver de nuevo con sonido";
      v.loop = true; v.muted = true; v.currentTime = 0; v.play(); sync();
    });
    v.addEventListener("play", sync);
    v.addEventListener("pause", sync);
    v.addEventListener("volumechange", sync);

    // ahorro de batería/datos: pausa fuera de pantalla
    new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) v.pause();
      else if (!manualPause && !reduce) v.play().catch(() => {});
    }, { threshold: 0.15 }).observe(reel);

    if (reduce) { v.removeAttribute("autoplay"); v.pause(); }
    v.addEventListener("loadedmetadata", paint);
    sync();
  }
  document.addEventListener("partials:loaded", init);
})();

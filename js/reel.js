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
    const playBtn = reel.querySelector("[data-reel-play]");
    const muteBtn = reel.querySelector("[data-reel-mute]");
    const fullBtn = reel.querySelector("[data-reel-full]");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let manualPause = false, raf = 0;

    const paint = () => {
      const p = v.duration ? v.currentTime / v.duration : 0;
      fill.style.setProperty("--p", p.toFixed(4));
      track.setAttribute("aria-valuenow", Math.round(p * 100));
      tc.textContent = fmt(v.currentTime);
    };
    const loop = () => { paint(); raf = requestAnimationFrame(loop); };

    const sync = () => {
      reel.classList.toggle("is-paused", v.paused);
      reel.classList.toggle("is-muted", v.muted);
      playBtn.setAttribute("aria-label", v.paused ? "Reproducir" : "Pausar");
      muteBtn.setAttribute("aria-label", v.muted ? "Activar sonido" : "Silenciar");
      cancelAnimationFrame(raf);
      if (v.paused) paint(); else raf = requestAnimationFrame(loop);
    };

    const toggleMute = () => { v.muted = !v.muted; sync(); };
    muteBtn.addEventListener("click", toggleMute);
    v.addEventListener("click", toggleMute);

    playBtn.addEventListener("click", () => {
      if (v.paused) { manualPause = false; v.play(); } else { manualPause = true; v.pause(); }
    });

    fullBtn.addEventListener("click", () => {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (reel.requestFullscreen) reel.requestFullscreen();
      else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
    });

    const seek = (x) => {
      const r = track.getBoundingClientRect();
      v.currentTime = Math.max(0, Math.min(1, (x - r.left) / r.width)) * (v.duration || 0);
      paint();
    };
    track.addEventListener("click", (e) => seek(e.clientX));
    track.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") v.currentTime = Math.min(v.duration, v.currentTime + 5);
      if (e.key === "ArrowLeft") v.currentTime = Math.max(0, v.currentTime - 5);
    });

    ["play", "pause", "volumechange"].forEach((ev) => v.addEventListener(ev, sync));
    v.addEventListener("loadedmetadata", paint);

    new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) v.pause();
      else if (!manualPause && !reduce) v.play().catch(() => {});
    }, { threshold: 0.15 }).observe(reel);

    if (reduce) { v.removeAttribute("autoplay"); v.pause(); }
    sync();
  }
  document.addEventListener("partials:loaded", init);
})();

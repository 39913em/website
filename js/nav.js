(function () {
  function init() {
    const y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();

    const bar = document.querySelector("[data-progress]");
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - innerHeight;
        bar && bar.style.setProperty("--p", max > 0 ? Math.min(1, scrollY / max).toFixed(4) : 0);
        ticking = false;
      });
    };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const links = new Map([...document.querySelectorAll("[data-nav]")].map((a) => [a.dataset.nav, a]));
    const secs = [...document.querySelectorAll("[data-section]")];
    const visible = new Set();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? visible.add(e.target.dataset.section) : visible.delete(e.target.dataset.section)));
      const current = secs.map((s) => s.dataset.section).filter((id) => visible.has(id)).pop();
      links.forEach((a, id) => a.setAttribute("aria-current", id === current ? "true" : "false"));
    }, { rootMargin: "-35% 0px -45% 0px" });
    secs.forEach((s) => io.observe(s));
  }
  document.addEventListener("partials:loaded", init);
})();

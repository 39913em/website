// reveal.js — aparición al hacer scroll + decodificación glitch de títulos (una sola vez).
(function () {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#";

  function scramble(el) {
    const finalText = el.textContent;
    el.setAttribute("aria-label", finalText);
    const total = 650, start = performance.now();
    (function tick(now) {
      const p = Math.min(1, (now - start) / total);
      const keep = Math.floor(finalText.length * p);
      let out = "";
      for (let i = 0; i < finalText.length; i++) {
        const c = finalText[i];
        out += i < keep || c === " " || c === "." ? c : LETTERS[(Math.random() * LETTERS.length) | 0];
      }
      el.textContent = out;
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  }

  function init() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        el.classList.add("in");
        if (el.hasAttribute("data-scramble") && !reduce) scramble(el);
        io.unobserve(el);
      });
    }, { threshold: 0.2 });

    document.querySelectorAll("[data-reveal]").forEach((el, i) => {
      el.style.transitionDelay = (i % 5) * 60 + "ms";
      io.observe(el);
    });
    document.querySelectorAll("[data-scramble]").forEach((el) => io.observe(el));
  }
  document.addEventListener("partials:loaded", init);
})();

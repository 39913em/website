document.documentElement.classList.add("js");

async function loadPartial(el) {
  const path = el.getAttribute("data-include");
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error("HTTP " + res.status);
    el.outerHTML = await res.text();
  } catch (err) {
    el.textContent = location.protocol === "file:"
      ? "Abre este sitio con Live Server (VS Code) o desde GitHub Pages: el navegador no permite cargarlo con doble clic."
      : "No se pudo cargar " + path;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await Promise.all([...document.querySelectorAll("[data-include]")].map(loadPartial));
  if (document.body.dataset.page === "legal") {
    document.querySelectorAll('a[href^="#"]').forEach((a) => a.setAttribute("href", "index.html" + a.getAttribute("href")));
  }
  document.dispatchEvent(new CustomEvent("partials:loaded"));
});

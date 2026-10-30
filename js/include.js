
document.documentElement.classList.add("js");

async function loadPartial(el) {
  const path = el.getAttribute("data-include");
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error("HTTP " + res.status);
    el.outerHTML = await res.text();
  } catch (err) {
    el.textContent = "No se pudo cargar " + path + ". Usa Live Server o un servidor local (file:// no funciona).";
    console.error("Partial:", path, err);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await Promise.all([...document.querySelectorAll("[data-include]")].map(loadPartial));
  document.getElementById("boot")?.remove();
  document.dispatchEvent(new CustomEvent("partials:loaded"));
});

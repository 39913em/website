# Portafolio — Eduardo Manuel

Landing brutalista, estática (HTML + CSS + JS puro, sin frameworks ni dependencias). Lista para **GitHub Pages**.

## Estructura (cada cosa en su archivo)

```
index.html            cáscara: <head>, CSP y placeholders
partials/             una sección = un archivo HTML (header, hero, ticker, servicios, obra, trayectoria, contacto, footer, lightbox)
css/                  un CSS por bloque (base.css = colores, tipografía, botones)
js/                   un módulo por función (reel, nav, reveal, obra, lightbox, contact, track)
data/obra.json        TODA la galería (títulos, créditos, links). Para agregar obra, edita solo este archivo
data/site.json        tu correo
assets/               img/ (miniaturas t/ + completas f/), video/, audio/, logo/, fonts/
```

## Ver el sitio en tu compu
No abras `index.html` con doble clic (el navegador bloquea `fetch` en `file://`).
Usa **VS Code → extensión Live Server → clic derecho en index.html → Open with Live Server**,
o en terminal: `python3 -m http.server 8000` y abre http://localhost:8000

## Pendientes tuyos (importante)
1. **Correo**: edita `data/site.json` (`user` y `domain`). Mientras diga `ejemplo.com`, el botón de correo permanece oculto y solo se muestra Instagram.
2. **Verifica los datos que no venían en tus fichas**: años/ficha de "1,376,400 fotos…", "Autorretrato", "Bitumen" y los dos videos de Tic-TOC (se muestran como "Pieza 1/2"). Edita `data/obra.json`.
3. **Pie de cartel/foto**: en `data/obra.json` puedes añadir `desc`, `credits` y `badges` a cualquier obra.

## Identidad visual
- Solo grises neutros + **un** rojo puro (`--accent` en `css/base.css`). Sin naranja, ámbar, crema, azul, cian ni violeta.
- Fotos, ilustraciones y portadas se muestran en B/N; dentro de cada pieza el botón **"Ver a color"** muestra el original.
- El **reel y los videos de YouTube** se ven con su color real. Si quieres reel en B/N: en `css/base.css` cambia `--reel-filter` a `grayscale(1) contrast(1.1)`.
- Logo: `assets/logo/mark.svg` (vectorizado, usa `currentColor`, sirve para botones a cualquier tamaño y color), `favicon-32.png`, `icon-192/512.png`, `apple-touch-icon.png`, y `logo-glitch.gif` (aparece al pasar el cursor por el logo del header).

## Control de clics (lectura y conversión)
- Menú de solo 3 enlaces + 1 botón (Contacto). Un único estilo para la acción principal.
- Cada sección termina con "Siguiente: …" (ruta de lectura: Reel → Servicios → Obra → Trayectoria → Contacto).
- Todas las piezas se abren **dentro de la página** (lightbox) con flechas continuas; ninguna te saca del sitio salvo las experiencias externas.
- CTA flotante "Contactar" que aparece solo después del reel y se oculta en Contacto.
- Cada pieza tiene enlace directo compartible: `tusitio/#obra/la-linea-eterea`.
- Medición sin cookies: cada botón lleva `data-track`. En la consola del navegador escribe `SiteTrack.report()` para ver clics por botón. Para medir visitas reales usa **GoatCounter** (gratis, sin cookies): añade su script y su dominio a `script-src`/`connect-src`/`img-src` en el `<meta>` CSP de `index.html`.

## Publicar gratis en GitHub Pages
1. Sube TODO el contenido de esta carpeta al repositorio (la raíz debe tener `index.html`).
2. Settings → Pages → Source: rama `main`, carpeta `/ (root)` → Save.
3. Peso total ≈ 27 MB: bien por debajo de los límites de GitHub (archivo < 100 MB, repo < 1 GB).

## Seguridad (sitio estático = superficie de ataque mínima)
- **CSP estricta** en `<meta>`: sin scripts ni estilos inline; solo `youtube-nocookie.com` permitido para iframes.
- **Fuentes autoalojadas** (Archivo + IBM Plex Mono, licencia OFL): ningún pedido a Google.
- Videos de YouTube con `youtube-nocookie.com`, cargados **solo al abrir la pieza**.
- Enlaces externos con `rel="noopener noreferrer"`.
- El correo se arma en el navegador (no queda como texto plano en el HTML).
- Sin formularios, sin backend, sin claves. No subas contraseñas ni tokens al repo.
- Activa en GitHub: Settings → Pages → **Enforce HTTPS**, y protege la rama `main`.

## Qué se optimizó de tu carpeta original (478 MB → 27 MB)
- `DEMOREEL.MOV` (67 MB) → `reel.mp4` 720×1280 (9.5 MB).
- `kg3.gif` (104 MB, supera el límite de GitHub) y demás gifs → mp4 en loop. `dh.gif` y `unnamed.gif` eran idénticos.
- `CTRL+FE…wav` (35 MB) → mp3 160 kbps (3.6 MB).
- Imágenes → WebP (miniatura 760 px + versión 1800 px).
- No se usaron: archivos `.HEIC` (duplicados de PNG/TIF), capturas de pantalla y láminas de texto de `foto/`.

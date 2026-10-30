# Portafolio — Eduardo Manuel

Landing brutalista, estática (HTML + CSS + JS puro, sin frameworks). Lista para **GitHub Pages**.

## Guion de la página (una idea por escena)
1. **Gancho** — Reel (a pantalla completa, vertical) + nombre + 2 botones: *Ver obra* / *Contactar*.
2. **Qué hago + prueba, en un solo lugar** — Obra con 3 pestañas: **Video / Sonido / Imagen**. Cada pestaña dice lo que hago y lo demuestra.
3. **Credibilidad** — Trayectoria (4 bloques, sin clics).
4. **Cierre** — Contacto: una sola acción.

Menos clics: menú de 2 enlaces + Contacto, todo se abre en el mismo visor (sin salir de la página), flechas continuas entre piezas, cada pieza con enlace directo (`tusitio/#obra/la-linea-eterea`).

## Estructura
```
index.html        cáscara (head, CSP, placeholders)
partials/         una sección = un archivo (header, hero, ticker, obra, trayectoria, contacto, footer, lightbox)
css/              un CSS por bloque (base.css = colores, tipografía, botones)
js/               un módulo por función (reel, nav, reveal, obra, lightbox, contact, track)
data/obra.json    TODA la galería (títulos, créditos, links)
data/site.json    tu correo
assets/           img/, video/, audio/, logo/, fonts/
```

## Ver el sitio en tu compu
No abras `index.html` con doble clic. Usa **VS Code → Live Server → Open with Live Server**,
o `python3 -m http.server 8000` y abre http://localhost:8000

## Pendientes tuyos
1. **Correo**: edita `data/site.json`. Mientras diga `ejemplo.com`, el botón de correo queda oculto y solo aparece Instagram.
2. **Datos que tus fichas no traían** (revisa en `data/obra.json`): años de "1,376,400 fotos…", "Autorretrato" y "Bitumen"; los dos videos de Tic-TOC aparecen como "Pieza 1/2".

## Agregar o quitar obra
Todo está en `data/obra.json`. Cada obra tiene `cat`: `video`, `sonido` o `imagen` (la pestaña donde aparece).
Hay 4 series guardadas con `"hidden": true` (Espejos y simetrías, Registro en vivo, Dibujo y pintura, Loops): borra esa línea para mostrarlas.
Recomendación: máximo 6–8 piezas por pestaña.

## Identidad visual
- **Solo blanco, negro y rojo** (`--accent` en `css/base.css`). Sin naranja, azul ni sus derivados.
- Todo el material gráfico se muestra en blanco y negro (fotos, ilustraciones, reel y videos de YouTube) con un único filtro: `--art-filter` en `css/base.css`.
- El texto se fuerza a suavizado en escala de grises (evita los bordes naranja/azul del texto LCD en Windows). Está en la última regla de `css/base.css`.
- Logo: `assets/logo/mark.svg` (vector, `currentColor`), favicon, íconos y `logo-glitch.gif` (en blanco y negro puro).

## Publicar gratis en GitHub Pages
1. Sube TODO el contenido de esta carpeta al repositorio (`index.html` debe quedar en la raíz).
2. Settings → Pages → Source: rama `main`, carpeta `/ (root)` → Save.

## Seguridad
CSP estricta en `<meta>` (sin scripts/estilos inline, solo `youtube-nocookie.com` en iframes), fuentes autoalojadas, enlaces externos con `noopener noreferrer`, correo armado en el navegador, sin formularios ni claves. Activa *Enforce HTTPS* en GitHub Pages y no subas contraseñas ni tokens.

## Medir clics
Cada botón lleva `data-track`. En la consola del navegador: `SiteTrack.report()`. Para visitas reales usa GoatCounter (gratis, sin cookies) y añade su dominio a la CSP.

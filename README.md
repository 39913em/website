# Eduardo Manuel — Portafolio

Sitio estático (HTML + CSS + JS puro, sin frameworks), listo para GitHub Pages.

## Orden de la página
Reel → Experiencias interactivas → Obra (Video / Sonido / Fotografía / Arte digital / Pintura) → About (foto, semblanza, presskit y trayectoria) → Contacto.
Páginas aparte: `terminos.html` y `privacidad.html` (enlazadas desde el footer).

## Estructura
```
index.html, terminos.html, privacidad.html
partials/   una sección por archivo
css/        un CSS por bloque
js/         un módulo por función
data/obra.json   toda la galería
data/site.json   correo de contacto
assets/     img/, video/, audio/, logo/, fonts/, presskit/
```

## Ver el sitio en tu compu
No abras `index.html` con doble clic. Usa VS Code con la extensión Live Server (clic derecho en `index.html` → Open with Live Server) o `python3 -m http.server 8000`.

## Editar contenido
- **Obra**: `data/obra.json`. Cada obra tiene `cat`: `video`, `sonido`, `fotografia`, `arte` o `pintura` (la pestaña donde aparece).
- **Pintura**: agrega obras con `"cat": "pintura"`. La tarjeta "Próximamente" se muestra al final mientras exista `"soon"` en esa categoría.
- **Experiencias**: `partials/experiencias.html` (imagen, texto y enlace de cada una).
- **Semblanza y trayectoria**: `partials/about.html`.
- **Presskit**: `assets/presskit/` (PDF y foto en alta).
- **Correo**: `data/site.json`.
- **Páginas legales**: `partials/legal-terminos.html` y `partials/legal-privacidad.html`. Son un borrador basado en las páginas legales de tus otros proyectos; conviene que un abogado las revise.

## Publicar en GitHub Pages
1. Sube todo el contenido de esta carpeta al repositorio (`index.html` en la raíz).
2. Settings → Pages → Source: rama `main`, carpeta `/ (root)`.
3. Activa Enforce HTTPS.

## Seguridad
CSP estricta en `<meta>` (sin scripts ni estilos inline, solo `youtube-nocookie.com` en iframes), fuentes autoalojadas, enlaces externos con `noopener noreferrer`, correo armado en el navegador, sin formularios ni claves.

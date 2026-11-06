# Portafolio — organización automática de obra

La interfaz original se conserva. La galería se alimenta de las carpetas `PORTAFOLIO/`: no necesitas editar `data/obra.json`, HTML, CSS ni JavaScript para añadir una obra.

## Carpetas de contenido

```text
PORTAFOLIO/
├── AUDIO/
├── VIDEO/
├── FOTOGRAFIA/
├── ILUSTRACION/
│   ├── DIGITAL/
│   └── FISICA/
├── PINTURA/
├── DIBUJO/
└── EXPERIENCIAS-VIRTUALES/
```

Sube cada archivo a la carpeta que corresponda. El nombre del archivo se usa como título de la tarjeta. Se admiten imágenes JPG/JPEG/PNG/WEBP/GIF/AVIF/SVG, audio MP3/WAV/OGG/M4A/AAC/FLAC, video MP4/WEBM/MOV, PDF y HTML.

Para una experiencia virtual compuesta por varios archivos, crea una subcarpeta dentro de `EXPERIENCIAS-VIRTUALES/` y coloca ahí el sitio completo con su `index.html`. Se mostrará como una sola experiencia; los archivos internos no se convertirán en tarjetas independientes.

## Publicación automática

1. Copia la imagen en su carpeta (por ejemplo `PORTAFOLIO/DIBUJO/`) y **súbela a Git**: `git add PORTAFOLIO`, `git commit` y `git push` a la rama `main`. Un archivo que solo está en tu equipo no existe para GitHub.
2. GitHub Actions detecta el contenido, genera el catálogo, publica el sitio y, al final, comprueba que el sitio publicado incluye las obras nuevas y que sus portadas se descargan (paso «Verificar que la galería publicada…»).
3. No necesitas editar `data/obra.json` ni ejecutar el script a mano. Si lo ejecutas para previsualizar, puedes subir o descartar el cambio en `data/obra.json`: Actions lo regenera siempre.

En GitHub, configura una sola vez **Settings → Pages → Build and deployment → Source: GitHub Actions**. Si queda en «Deploy from a branch», GitHub publica el `data/obra.json` que está guardado en el repositorio y **nunca** el catálogo que genera Actions: las imágenes nuevas no aparecen aunque el flujo termine en verde. El flujo está en `.github/workflows/pages.yml`.

### Si una imagen no aparece

- En GitHub abre **Actions → Publicar portafolio →** la última ejecución. El resumen lista las obras nuevas por categoría y los archivos que se omitieron con su motivo.
- Se omiten a propósito: archivos con una extensión no admitida, archivos ocultos (empiezan con `.`), miniaturas/pósters dentro de subcarpetas (nombres terminados en `-thumb`, `_thumb`, `--thumb`, `-poster`, `_poster`) y archivos con **exactamente el mismo contenido** que otro ya publicado.
- Los nombres de carpeta no distinguen mayúsculas de minúsculas, pero conviene mantener `DIBUJO`, `PINTURA`, etc. tal como están.

## Desarrollo local

Desde esta carpeta ejecuta `python3 -m http.server 8000` y abre `http://localhost:8000`. Para probar el catálogo automático, ejecuta `python3 scripts/generar_catalogo.py`: informa de las obras nuevas y avisa de cada archivo que omite y por qué.

## Contenido existente

Las obras originales, sus descripciones, créditos, elementos multimedia y miniaturas se conservaron. Sus archivos multimedia referenciados también están organizados dentro de las carpetas `PORTAFOLIO/`; los recursos originales de `assets/` se mantienen para no romper el reel, las secciones ni los recursos compartidos del sitio.

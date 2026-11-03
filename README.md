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

1. Sube los archivos y confirma los cambios en la rama `main`.
2. GitHub Actions detecta el contenido, genera el catálogo y publica el sitio.
3. No edites el JSON generado ni ejecutes el script manualmente.

En GitHub, configura una sola vez **Settings → Pages → Build and deployment → Source: GitHub Actions**. El flujo está en `.github/workflows/pages.yml`.

## Desarrollo local

Desde esta carpeta ejecuta `python3 -m http.server 8000` y abre `http://localhost:8000`. Para probar el catálogo automático, ejecuta `python3 scripts/generar_catalogo.py`.

## Contenido existente

Las obras originales, sus descripciones, créditos, elementos multimedia y miniaturas se conservaron. Sus archivos multimedia referenciados también están organizados dentro de las carpetas `PORTAFOLIO/`; los recursos originales de `assets/` se mantienen para no romper el reel, las secciones ni los recursos compartidos del sitio.

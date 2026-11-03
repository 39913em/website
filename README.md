# Eduardo Manuel — Portafolio

Sitio estático (HTML + CSS + JavaScript), publicado en GitHub Pages.

## Añadir obra: solo subir archivos

La galería se alimenta automáticamente de las carpetas de `PORTAFOLIO/`. Para añadir material, entra a la carpeta de su categoría y sube el archivo. No edites `data/obra.json`, no agregues entradas manuales y no cambies el código.

| Carpeta | Contenido admitido |
|---|---|
| `PORTAFOLIO/AUDIO/` | MP3, WAV, OGG, M4A, AAC, FLAC |
| `PORTAFOLIO/VIDEO/` | MP4, WEBM, M4V, MOV |
| `PORTAFOLIO/FOTOGRAFIA/` | JPG, JPEG, PNG, WEBP, GIF, AVIF |
| `PORTAFOLIO/ILUSTRACION/DIGITAL/` | Imágenes |
| `PORTAFOLIO/ILUSTRACION/FISICA/` | Imágenes |
| `PORTAFOLIO/PINTURA/` | Imágenes |
| `PORTAFOLIO/DIBUJO/` | Imágenes |
| `PORTAFOLIO/EXPERIENCIAS-VIRTUALES/` | HTML, PDF o una carpeta de experiencia con `index.html` |

Cada archivo compatible genera automáticamente una tarjeta en su categoría. El título se obtiene del nombre del archivo: `mi-obra-01.webp` aparece como **Mi Obra 01**. Conviene usar nombres claros, sin necesidad de añadir metadatos. También se admiten subcarpetas; se conserva su contenido y se procesa recursivamente.

Para experiencias virtuales, puedes subir un HTML directamente dentro de `EXPERIENCIAS-VIRTUALES/`, o una carpeta con su `index.html` y los recursos que necesite. La tarjeta abre la experiencia en una pestaña nueva. Los PDF también se ofrecen como enlace.

Formatos no reconocidos se ignoran. Para que una obra aparezca, el archivo debe estar dentro de la carpeta correcta; no basta con subirlo a `assets/`.

## Publicación automática

El repositorio incluye `.github/workflows/pages.yml`. Cada vez que subas cambios a la rama `main`, GitHub Actions:

1. Recorre las carpetas de `PORTAFOLIO/`.
2. Genera el catálogo que consume la galería.
3. Publica el sitio en GitHub Pages.

**Configuración única necesaria:** en GitHub abre `Settings → Pages` y selecciona `GitHub Actions` como `Build and deployment → Source`. Después de eso, las siguientes cargas se publican mediante el flujo automático.

Puedes consultar el resultado y los errores en la pestaña `Actions` del repositorio.

## Contenido anterior

Las obras que ya estaban registradas manualmente en `data/obra.json` se conservan. El generador añade las nuevas piezas encontradas en `PORTAFOLIO/` sin borrar los créditos, descripciones ni galerías anteriores. Las nuevas piezas se muestran con el nombre derivado del archivo.

## Desarrollo local

Para regenerar el catálogo localmente ejecuta desde la raíz del repositorio:

```bash
python3 scripts/generar_catalogo.py
python3 -m http.server 8000
```

Abre `http://localhost:8000`.

## Estructura principal

```text
PORTAFOLIO/
  AUDIO/
  VIDEO/
  FOTOGRAFIA/
  ILUSTRACION/
    DIGITAL/
    FISICA/
  PINTURA/
  DIBUJO/
  EXPERIENCIAS-VIRTUALES/
scripts/
  generar_catalogo.py
.github/
  workflows/
    pages.yml
data/
  obra.json
```

Las demás secciones, estilos, navegación y componentes del portafolio se mantienen en sus ubicaciones actuales.

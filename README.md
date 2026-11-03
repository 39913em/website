# Portafolio — estructura de obra

## Dónde colocar obra nueva

Todo el material artístico se administra dentro de `PORTAFOLIO/`. No uses `assets/img/f`, `assets/img/t`, `assets/video` ni `assets/audio` para añadir obra nueva. Esas antiguas ubicaciones ya no forman parte del catálogo.

- `PORTAFOLIO/VIDEO/`
- `PORTAFOLIO/AUDIO/`
- `PORTAFOLIO/FOTOGRAFIA/SESIONES/`
- `PORTAFOLIO/FOTOGRAFIA/RETRATO/`
- `PORTAFOLIO/FOTOGRAFIA/EXPERIMENTAL/`
- `PORTAFOLIO/ILUSTRACION/DIGITAL/`
- `PORTAFOLIO/ILUSTRACION/FISICA/`
- `PORTAFOLIO/PINTURA/`
- `PORTAFOLIO/DIBUJO/`
- `PORTAFOLIO/EXPERIENCIAS-VIRTUALES/`

Crea una carpeta por proyecto dentro del apartado correspondiente y coloca ahí sus archivos. Ejemplo: `PORTAFOLIO/FOTOGRAFIA/RETRATO/nuevo-retrato/`. El nombre de esa carpeta se usa como título de la tarjeta. El primer archivo visual funciona como portada; las demás imágenes y videos se agregan a la secuencia. Si agregas archivos a la carpeta de una obra que ya existe, se incorporan a esa misma obra. Para una miniatura opcional, usa el mismo nombre terminado en `--thumb` antes de la extensión (por ejemplo `foto--thumb.webp`). También puedes colocar un archivo directamente en el apartado: se mostrará como una obra individual.

Formatos: imágenes JPG/JPEG/PNG/WEBP/GIF/AVIF/SVG; video MP4/WEBM/M4V/MOV; audio MP3/WAV/OGG/M4A/AAC/FLAC. PDF y HTML/HTM se abren como enlaces. Para una experiencia virtual local, crea su carpeta dentro de `EXPERIENCIAS-VIRTUALES/`, coloca ahí un `index.html` y, si quieres, una imagen de portada.

La indexación se ejecuta automáticamente al desplegar en GitHub Actions. En GitHub, configura una sola vez **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Recursos del sitio

`assets/` queda reservado para recursos de funcionamiento general (fuentes, logotipos, presskit y video del reel), no para duplicar obras del catálogo.

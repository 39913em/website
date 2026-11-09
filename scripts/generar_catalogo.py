#!/usr/bin/env python3
"""Actualiza el catálogo sin convertir recursos internos o duplicados en obras.

Uso:
    python scripts/generar_catalogo.py                       # genera/actualiza data/obra.json
    python scripts/generar_catalogo.py --verificar-publicado https://usuario.github.io/repo/
"""
import hashlib
import json
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.request
from functools import lru_cache
from pathlib import Path
from urllib.parse import parse_qs, quote, unquote, urlparse

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "obra.json"
BASE = ROOT / "PORTAFOLIO"
PORTADAS = ROOT / "data" / "portadas.json"
CARPETA_PORTADAS = "PORTAFOLIO/EXPERIENCIAS-VIRTUALES/"

MEDIA = {
    ".jpg": "img", ".jpeg": "img", ".png": "img", ".webp": "img",
    ".gif": "img", ".avif": "img", ".svg": "img",
    ".mp3": "audio", ".wav": "audio", ".ogg": "audio", ".oga": "audio",
    ".m4a": "audio", ".aac": "audio", ".flac": "audio",
    ".mp4": "video", ".webm": "video", ".m4v": "video", ".mov": "video",
    ".pdf": "pdf", ".html": "web", ".htm": "web",
}
CATEGORY_DIRS = {
    "AUDIO": "audio", "VIDEO": "video",
    "FOTOGRAFIA/SESIONES": "fotografia-sesiones",
    "FOTOGRAFIA/AUTORIA": "fotografia-autoria",
    "FOTOGRAFIA/CALLE-RETRATO": "fotografia-calle-retrato",
    "ILUSTRACION/DIGITAL": "ilustracion-digital",
    "ILUSTRACION/FISICA": "ilustracion-fisica",
    "PINTURA": "pintura", "DIBUJO": "dibujo", "EXPOSICIONES": "exposiciones",
}
THUMB_SUFFIXES = ("--thumb", "-thumb", "_thumb", "-poster", "_poster")


def slug(value):
    ascii_value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode().lower()
    cleaned = re.sub(r"[^a-z0-9]+", "-", ascii_value).strip("-")
   
    return cleaned or "archivo-" + hashlib.sha1(value.encode("utf-8")).hexdigest()[:6]


def rel(path):
    return path.relative_to(ROOT).as_posix()


def web(path_text):
    """Ruta tal como se escribe en el catálogo: '#', '?' y '%' en un nombre de
    archivo romperían la URL (el navegador los toma como fragmento/consulta)."""
    return path_text.replace("%", "%25").replace("#", "%23").replace("?", "%3F")


def find_dir(base, relative):
    """Busca una carpeta ignorando mayúsculas/minúsculas.

    Windows y macOS no distinguen 'DIBUJO' de 'Dibujo'; GitHub Actions (Linux) sí.
    """
    current = base
    for part in relative.split("/"):
        if not current.is_dir():
            return None
        match = next((c for c in sorted(current.iterdir())
                      if c.is_dir() and c.name.lower() == part.lower()), None)
        if match is None:
            return None
        current = match
    return current


def es_derivado(path):
    """Los archivos con '--' en el nombre son derivados (miniaturas/portadas) de otro archivo."""
    return "--" in path.stem


def _nfc(texto):
    return unicodedata.normalize("NFC", texto)


@lru_cache(maxsize=None)
def _nombres(carpeta):
    try:
        return frozenset(_nfc(n) for n in os.listdir(carpeta))
    except OSError:
        return frozenset()


def existe(ruta):
    """True si el archivo existe con las MISMAS mayúsculas (como lo ve GitHub Pages en Linux)."""
    actual = ROOT
    for parte in ruta.split("/"):
        if _nfc(parte) not in _nombres(actual):
            return False
        actual = actual / parte
    return actual.is_file()


def referencia(valor):
    """Ruta (sin codificar) si el valor apunta a un archivo de PORTAFOLIO/; si no, None."""
    return unquote(valor) if isinstance(valor, str) and valor.startswith("PORTAFOLIO/") else None


def falta(valor):
    ruta = referencia(valor)
    return ruta is not None and not existe(ruta)


def portada_valida(work, items):
    cover = work["cover"]
    if isinstance(cover, str):
        if not falta(cover):
            return cover
    elif isinstance(cover, dict) and "video" in cover:
        if not falta(cover["video"]):
            return {k: v for k, v in cover.items() if k != "poster"} if falta(cover.get("poster")) else cover
    else:
        return cover  # portada de texto: no depende de ningún archivo
    for it in items:  # la portada desapareció: usa la primera pieza que sigue existiendo
        if it.get("type") == "img":
            return it.get("thumb") or it["src"]
    for it in items:
        if it.get("type") == "video":
            return {"video": it["src"], "poster": it["thumb"]} if it.get("thumb") else {"video": it["src"]}
    return {"text": work["title"]}


def limpiar_catalogo(data):
    """Quita del catálogo lo que ya no está en PORTAFOLIO/.

    Una foto (src + miniatura) se quita si falta CUALQUIERA de sus dos archivos; una obra
    se quita cuando se queda sin piezas. Devuelve (quitados, sobrantes): el informe y los
    archivos que siguen en las carpetas pero ya no pertenecen a nada.
    """
    quitados, sobrantes, vivas = [], set(), []
    for work in data["works"]:
        piezas = []
        for it in work["items"]:
            archivos = [it.get("src"), it.get("thumb")] if it.get("type") == "img" else [it.get("src") or it.get("url")]
            ausentes = [referencia(v) for v in archivos if falta(v)]
            if ausentes:
                quitados.append(f"{ausentes[0]} (de «{work['title']}»)")
                for v in (it.get("src"), it.get("thumb"), it.get("cover"), it.get("poster")):
                    ruta = referencia(v)
                    if ruta and existe(ruta):
                        sobrantes.add(ruta)
                continue
            for clave in ("thumb", "cover", "poster"):  # extras opcionales: si faltan, se omiten
                if falta(it.get(clave)):
                    del it[clave]
            piezas.append(it)
        if not piezas:
            quitados.append(f"obra «{work['title']}» ({work['id']}): ya no tiene archivos")
            continue
        work["items"] = piezas
        work["cover"] = portada_valida(work, piezas)
        vivas.append(work)
    data["works"] = vivas
    return quitados, sobrantes


def media_files(folder):
    if not folder.exists():
        return []
    found = []
    for path in sorted(folder.rglob("*")):
        if not path.is_file() or any(part.startswith(".") for part in path.relative_to(folder).parts):
            continue
        if path.stem.lower().endswith(THUMB_SUFFIXES) or es_derivado(path):
            continue
        if path.suffix.lower() in MEDIA:
            found.append(path)
    return found


def path_refs(value, found):
    if isinstance(value, dict):
        for item in value.values(): path_refs(item, found)
    elif isinstance(value, list):
        for item in value: path_refs(item, found)
    elif isinstance(value, str) and value.startswith("PORTAFOLIO/"):
        found.add(unquote(value))


@lru_cache(maxsize=None)
def file_hash(path):
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def make_item(path, kind):
    src = web(rel(path))
    title = path.stem.replace("_", " ").replace("-", " ").strip().title()
    if kind == "img": return {"type": "img", "src": src, "thumb": src, "alt": title}
    if kind == "video": return {"type": "video", "src": src, "alt": title}
    if kind == "audio": return {"type": "audio", "src": src, "label": "Escuchar"}
    return {"type": "link", "url": src, "label": "Abrir"}


def unique_id(cat, name, first, taken):
    base = "archivo-" + cat + "-" + slug(name)
    if base not in taken:
        return base
    # Dos nombres distintos pueden dar el mismo slug (p. ej. «Árbol» y «arbol»).
    # El sufijo sale de la ruta del archivo, así que es estable entre ejecuciones.
    digest = hashlib.sha1(rel(first).encode("utf-8")).hexdigest()
    for size in range(6, len(digest) + 1):
        candidate = base + "-" + digest[:size]
        if candidate not in taken:
            return candidate
    raise RuntimeError("No se pudo generar un id único para " + rel(first))


def make_work(cat, name, files, taken):
    items = [make_item(path, MEDIA[path.suffix.lower()]) for path in files]
    first = files[0]
    kind = MEDIA[first.suffix.lower()]
    if kind == "img": cover = web(rel(first))
    elif kind == "video": cover = {"video": web(rel(first))}
    else: cover = {"text": name}
    return {
        "id": unique_id(cat, name, first, taken), "cat": cat,
        "title": name.replace("_", " ").replace("-", " ").title(),
        "kicker": "Obra nueva", "cover": cover, "items": items,
    }


def auditar(known, owner, sobrantes=frozenset()):
    """Revisa TODOS los archivos de las carpetas de categoría y explica cada uno
    que no quedó como obra. Devuelve (omitidos, sin_registrar)."""
    omitted, missing = [], []
    for folder_name in CATEGORY_DIRS:
        root = find_dir(BASE, folder_name)
        if root is None:
            continue
        for path in sorted(root.rglob("*")):
            parts = path.relative_to(root).parts
            if not path.is_file() or any(p.startswith(".") for p in parts):
                continue
            r = rel(path)
            if r in known:
                continue
            if r in sobrantes:
                omitted.append((r, "sobra: era parte de una foto/obra que ya quitaste; bórralo también"))
            elif path.suffix.lower() not in MEDIA:
                omitted.append((r, "extensión no admitida (" + (path.suffix or "sin extensión") + ")"))
            elif es_derivado(path):
                omitted.append((r, "es un archivo derivado (lleva '--' en el nombre); no se publica por sí solo"))
            elif len(parts) > 1 and path.stem.lower().endswith(THUMB_SUFFIXES):
                omitted.append((r, "es una miniatura/póster interno; se omite a propósito"))
            elif file_hash(path) in owner:
                omitted.append((r, "es idéntico (mismo contenido) a " + owner[file_hash(path)]))
            else:
                missing.append(r)
    return omitted, missing


def avisar_sueltas(known, sobrantes=frozenset()):
    """Fotografía se divide en SESIONES, AUTORIA y CALLE-RETRATO: una imagen nueva
    suelta en PORTAFOLIO/FOTOGRAFIA/ no pertenece a ningún apartado y no se publicaría."""
    root = find_dir(BASE, "FOTOGRAFIA")
    sueltas = []
    if root is not None:
        for path in sorted(root.iterdir()):
            if path.is_file() and not path.name.startswith(".") and path.suffix.lower() in MEDIA and rel(path) not in known:
                sueltas.append(rel(path))
                if rel(path) in sobrantes:
                    aviso(f"{rel(path)} no se publicó como obra: sobra: era parte de una foto/obra que ya quitaste; bórralo también.")
                elif not es_derivado(path):
                    aviso(f"{rel(path)} está suelto en FOTOGRAFIA y no se publicó: muévelo a SESIONES, AUTORIA o CALLE-RETRATO.")
    return sueltas


def youtube_id(valor):
    """ID de 11 caracteres si el valor es un ID o un enlace de YouTube; si no, None."""
    ide = re.compile(r"[A-Za-z0-9_-]{11}")
    v = (valor or "").strip()
    if ide.fullmatch(v):
        return v
    u = urlparse(v)
    host = (u.hostname or "").lower()
    if host == "youtu.be":
        c = u.path.lstrip("/")[:11]
        return c if ide.fullmatch(c) else None
    if host == "youtube.com" or host.endswith(".youtube.com") or host.endswith("youtube-nocookie.com"):
        q = parse_qs(u.query).get("v", [""])[0]
        if ide.fullmatch(q):
            return q
        m = re.match(r"/(?:embed|shorts|live|v)/([A-Za-z0-9_-]{11})", u.path)
        return m.group(1) if m else None
    return None


def revisar_portadas():
    """Avisa si data/portadas.json tiene un error o apunta a un archivo que no existe."""
    if not PORTADAS.is_file():
        return
    try:
        cfg = json.loads(PORTADAS.read_text(encoding="utf-8"))
    except ValueError as exc:
        aviso(f"data/portadas.json tiene un error de escritura y las portadas animadas no se mostrarán: {exc}")
        return
    for clave, c in cfg.items():
        if clave.startswith("_") or not isinstance(c, dict):
            continue
        video = (c.get("youtube") or "").strip()
        if video and not youtube_id(video):
            aviso(f"portadas.json → {clave}: «{video}» no parece un ID ni un enlace de YouTube; no se mostrará el video.")
        gif = (c.get("gif") or "").strip()
        if gif and not video:
            ruta = gif if "/" in gif else CARPETA_PORTADAS + gif
            if not existe(ruta):
                aviso(f"portadas.json → {clave}: el archivo «{ruta}» no existe; se verá la imagen fija.")


def aviso(texto):
    if os.environ.get("GITHUB_ACTIONS") == "true":
        escapado = texto.replace("%", "%25").replace("\r", "%0D").replace("\n", "%0A")
        print("::warning title=Catálogo::" + escapado)
    else:
        print("AVISO: " + texto)


def resumen_markdown(data, nuevas, omitidos, quitados=()):
    por_cat = {}
    for w in data["works"]:
        por_cat.setdefault(w["cat"], [0, 0])
        por_cat[w["cat"]][0] += 1
        por_cat[w["cat"]][1] += len(w["items"])
    lineas = ["## Catálogo generado", "", "| Categoría | Obras | Archivos |", "|---|---:|---:|"]
    lineas += [f"| {cat} | {n} | {f} |" for cat, (n, f) in sorted(por_cat.items())]
    lineas += ["", f"**Obras nuevas en esta ejecución:** {len(nuevas)}", ""]
    lineas += [f"- `{w['id']}` ({w['cat']})" for w in nuevas]
    if quitados:
        lineas += ["", "### Quitado del catálogo (ya no está en PORTAFOLIO/)", ""] + [f"- `{q}`" for q in quitados]
    if omitidos:
        lineas += ["", "### Archivos omitidos", ""] + [f"- `{r}`: {motivo}" for r, motivo in omitidos]
    return "\n".join(lineas) + "\n"


def main():
    try:
        data = json.loads(DATA.read_text(encoding="utf-8"))
    except ValueError as exc:
        detalle = (f"línea {exc.lineno}, columna {exc.colno}: {exc.msg}" if hasattr(exc, "lineno") else str(exc))
        mensaje = ("data/obra.json está mal escrito y no se publicó nada nuevo (" + detalle + "). "
                   "Casi siempre falta una coma, una comilla o un cierre } ]. Mira esa línea y la anterior; "
                   "para volver atrás usa «Deshacer cambios» en VS Code o restaura el archivo anterior.")
        print(("::error title=obra.json mal escrito::" if os.environ.get("GITHUB_ACTIONS") == "true" else "ERROR: ") + mensaje, file=sys.stderr)
        return 1
    quitados, sobrantes = [], set()
    if any(p.is_file() for p in BASE.rglob("*")):
        quitados, sobrantes = limpiar_catalogo(data)
        vigentes = set()
        path_refs(data["works"], vigentes)
        sobrantes -= vigentes  # lo que otra pieza sigue usando no es un sobrante
    else:  # sin PORTAFOLIO/ (p. ej. una copia incompleta) no se puede saber qué falta: no se toca nada
        aviso("No se encontró la carpeta PORTAFOLIO/ con archivos: no se limpió el catálogo.")
    known = set()
    path_refs(data.get("works", []), known)
    owner = {}  # hash de contenido -> primera ruta que lo usa
    for item in sorted(known):
        path = ROOT / item
        if path.is_file():
            owner.setdefault(file_hash(path), item)
    taken = {w.get("id") for w in data["works"]}

    additions, new_works = [], []
    # Other sections: a new subfolder is one project/mosaic; a loose file is one card.
    for folder_name, cat in CATEGORY_DIRS.items():
        root = find_dir(BASE, folder_name)
        if root is None:
            continue
        for child in sorted(root.iterdir()):
            if child.name.startswith("."):
                continue
            if child.is_file():
                candidates = [child] if child.suffix.lower() in MEDIA and not es_derivado(child) else []
                title = child.stem
            elif child.is_dir():
                candidates = media_files(child)
                title = child.name
            else:
                continue
            candidates = [p for p in candidates if rel(p) not in known and rel(p) not in sobrantes and file_hash(p) not in owner]
            if not candidates:
                continue
            work = make_work(cat, title, candidates, taken)
            data["works"].append(work)
            new_works.append(work)
            taken.add(work["id"])
            for path in candidates:
                known.add(rel(path)); owner.setdefault(file_hash(path), rel(path)); additions.append(path)

    DATA.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Catálogo listo: {len(additions)} archivos nuevos; {len(data['works'])} obras totales.")
    for w in new_works:
        print(f"  + {w['id']}  [{w['cat']}]  {len(w['items'])} archivo(s)")
    if quitados:
        print(f"Quitado del catálogo porque ya no existe en PORTAFOLIO/ ({len(quitados)}):")
        for q in quitados:
            print("  - " + q)

    revisar_portadas()
    omitted, missing = auditar(known, owner, sobrantes)
    for r, motivo in omitted:
        aviso(f"{r} no se publicó como obra: {motivo}.")

    avisar_sueltas(known, sobrantes)
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as stream:
            stream.write(resumen_markdown(data, new_works, omitted, quitados))

    if missing:
        print("ERROR: archivos de PORTAFOLIO que no quedaron en el catálogo y no tienen motivo conocido:", file=sys.stderr)
        for r in missing:
            print("  - " + r, file=sys.stderr)
        return 1
    return 0


def recursos_del_sitio():
    """Archivos locales que el HTML del sitio y portadas.json referencian (Presskit, logo, reel...)."""
    encontrados = set()
    for archivo in [ROOT / "index.html", *sorted((ROOT / "partials").glob("*.html"))]:
        for m in re.finditer(r'(?:src|href|poster)="([^"]+)"', archivo.read_text(encoding="utf-8")):
            ruta = m.group(1).split("#")[0].split("?")[0]
            if ruta and not re.match(r"^[a-z][a-z0-9+.-]*:|^//", ruta, re.I):
                encontrados.add(unquote(ruta))
    if PORTADAS.is_file():
        try:
            for clave, c in json.loads(PORTADAS.read_text(encoding="utf-8")).items():
                gif = (c.get("gif") or "").strip() if isinstance(c, dict) and not (c.get("youtube") or "").strip() else ""
                if gif:
                    encontrados.add(gif if "/" in gif else CARPETA_PORTADAS + gif)
        except ValueError:
            pass
    return sorted(encontrados)


def verificar_publicado(base_url):
    """Comprueba que el sitio ya publicado sirve el catálogo nuevo y sus imágenes."""
    intentos = int(os.environ.get("VERIFICAR_INTENTOS", "8"))
    espera = float(os.environ.get("VERIFICAR_ESPERA", "15"))
    base_url = base_url.rstrip("/") + "/"
    local = json.loads(DATA.read_text(encoding="utf-8"))
    esperados = [w["id"] for w in local["works"]]

    def pedir(url, metodo="GET"):
        req = urllib.request.Request(url, method=metodo, headers={"Cache-Control": "no-cache"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status, resp.read() if metodo == "GET" else b""

    ultimo = "sin intentos"
    for n in range(1, intentos + 1):
        try:
            _, cuerpo = pedir(f"{base_url}data/obra.json?v={int(time.time())}")
            publicados = {w["id"] for w in json.loads(cuerpo.decode("utf-8"))["works"]}
            faltan = [i for i in esperados if i not in publicados]
            if not faltan:
                break
            ultimo = f"{len(faltan)} obras del catálogo generado no están en el sitio publicado (p. ej. {faltan[0]})"
        except (urllib.error.URLError, ValueError, KeyError) as exc:
            ultimo = f"no se pudo leer el catálogo publicado: {exc}"
        print(f"Intento {n}/{intentos}: {ultimo}")
        if n < intentos:
            time.sleep(espera)
    else:
        print("ERROR: " + ultimo, file=sys.stderr)
        return 1

    # Las imágenes de las obras generadas por este sistema deben responder 200.
    rotas = []
    for w in local["works"]:
        if w["id"].startswith("archivo-") and isinstance(w["cover"], str):
            url = base_url + quote(w["cover"], safe="/%")
            try:
                pedir(url, "HEAD")
            except urllib.error.URLError as exc:
                rotas.append(f"{w['cover']} -> {exc}")
    if rotas:
        print("ERROR: portadas que no se pueden descargar del sitio publicado:", file=sys.stderr)
        for r in rotas:
            print("  - " + r, file=sys.stderr)
        return 1

    # Presskit, foto en alta, logo, reel, hojas de estilo... deben responder en el sitio publicado.
    ausentes = []
    recursos = recursos_del_sitio()
    for ruta in recursos:
        try:
            pedir(base_url + quote(ruta, safe="/%"), "HEAD")
        except urllib.error.URLError as exc:
            ausentes.append(f"{ruta} -> {exc}")
    if ausentes:
        print("ERROR: archivos del sitio que NO responden en la página publicada:", file=sys.stderr)
        for r in ausentes:
            print("  - " + r, file=sys.stderr)
        return 1
    print(f"Verificado: {len(esperados)} obras publicadas, sus portadas y {len(recursos)} archivos del sitio (Presskit, logo, reel...) responden correctamente.")
    return 0


if __name__ == "__main__":
    if len(sys.argv) == 3 and sys.argv[1] == "--verificar-publicado":
        sys.exit(verificar_publicado(sys.argv[2]))
    sys.exit(main())

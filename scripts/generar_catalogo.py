#!/usr/bin/env python3
"""Actualiza el catálogo sin convertir recursos internos o duplicados en obras."""
import hashlib
import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "obra.json"
BASE = ROOT / "PORTAFOLIO"

MEDIA = {
    ".jpg": "img", ".jpeg": "img", ".png": "img", ".webp": "img",
    ".gif": "img", ".avif": "img", ".svg": "img",
    ".mp3": "audio", ".wav": "audio", ".ogg": "audio", ".oga": "audio",
    ".m4a": "audio", ".aac": "audio", ".flac": "audio",
    ".mp4": "video", ".webm": "video", ".m4v": "video", ".mov": "video",
    ".pdf": "pdf", ".html": "web", ".htm": "web",
}
CATEGORY_DIRS = {
    "AUDIO": "audio", "VIDEO": "video", "FOTOGRAFIA": "fotografia",
    "ILUSTRACION/DIGITAL": "ilustracion-digital",
    "ILUSTRACION/FISICA": "ilustracion-fisica",
    "PINTURA": "pintura", "DIBUJO": "dibujo",
}


def slug(value):
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", value).strip("-") or "archivo"


def rel(path):
    return path.relative_to(ROOT).as_posix()


def media_files(folder):
    if not folder.exists():
        return []
    found = []
    for path in sorted(folder.rglob("*")):
        if not path.is_file() or any(part.startswith(".") for part in path.relative_to(folder).parts):
            continue
        if path.stem.lower().endswith(("--thumb", "-thumb", "_thumb", "-poster", "_poster")):
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
        found.add(value)


def file_hash(path):
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def make_item(path, kind):
    src = rel(path)
    title = path.stem.replace("_", " ").replace("-", " ").strip().title()
    if kind == "img": return {"type": "img", "src": src, "thumb": src, "alt": title}
    if kind == "video": return {"type": "video", "src": src, "alt": title}
    if kind == "audio": return {"type": "audio", "src": src, "label": "Escuchar"}
    return {"type": "link", "url": src, "label": "Abrir"}


def make_work(cat, name, files):
    items = [make_item(path, MEDIA[path.suffix.lower()]) for path in files]
    first = files[0]
    kind = MEDIA[first.suffix.lower()]
    if kind == "img": cover = rel(first)
    elif kind == "video": cover = {"video": rel(first)}
    else: cover = {"text": name}
    return {
        "id": "archivo-" + cat + "-" + slug(name), "cat": cat,
        "title": name.replace("_", " ").replace("-", " ").title(),
        "kicker": "Obra nueva", "cover": cover, "items": items,
    }


def main():
    data = json.loads(DATA.read_text(encoding="utf-8"))
    known = set()
    path_refs(data.get("works", []), known)
    hashes = set()
    for item in known:
        path = ROOT / item
        if path.is_file():
            hashes.add(file_hash(path))

    additions = []
    # Other sections: a new subfolder is one project/mosaic; a loose file is one card.
    for folder_name, cat in CATEGORY_DIRS.items():
        root = BASE / folder_name
        if not root.exists():
            continue
        for child in sorted(root.iterdir()):
            if child.name.startswith("."):
                continue
            if child.is_file():
                candidates = [child] if child.suffix.lower() in MEDIA else []
                title = child.stem
            elif child.is_dir():
                candidates = media_files(child)
                title = child.name
            else:
                continue
            candidates = [p for p in candidates if rel(p) not in known and file_hash(p) not in hashes]
            if not candidates:
                continue
            work = make_work(cat, title, candidates)
            if not any(w.get("id") == work["id"] for w in data["works"]):
                data["works"].append(work)
            for path in candidates:
                known.add(rel(path)); hashes.add(file_hash(path)); additions.append(path)

    DATA.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Catálogo listo: {len(additions)} archivos nuevos; {len(data['works'])} obras totales.")


if __name__ == "__main__":
    main()

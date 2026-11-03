#!/usr/bin/env python3
"""Build the portfolio catalog from files placed in PORTAFOLIO/*."""
import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "obra.json"
MEDIA_ROOT = ROOT / "PORTAFOLIO"

CATEGORIES = [
    ("AUDIO", "audio", "Audio", "Piezas sonoras"),
    ("VIDEO", "video", "Video", "Piezas audiovisuales"),
    ("FOTOGRAFIA", "fotografia", "Fotografía", "Fotografía"),
    ("ILUSTRACION/DIGITAL", "ilustracion-digital", "Ilustración digital", "Ilustración digital"),
    ("ILUSTRACION/FISICA", "ilustracion-fisica", "Ilustración física", "Ilustración física"),
    ("PINTURA", "pintura", "Pintura", "Obra pictórica"),
    ("DIBUJO", "dibujo", "Dibujo", "Dibujo"),
    ("EXPERIENCIAS-VIRTUALES", "experiencias-virtuales", "Experiencias virtuales", "Experiencia virtual"),
]
IMAGE = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".svg"}
AUDIO = {".mp3", ".wav", ".ogg", ".oga", ".m4a", ".aac", ".flac"}
VIDEO = {".mp4", ".webm", ".m4v", ".mov"}
WEB = {".html", ".htm"}
DOC = {".pdf"}

def slug(value):
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-") or "archivo"

def title_from(path):
    return re.sub(r"[_-]+", " ", path.stem).strip().title() or "Sin título"

def rel(path):
    return path.relative_to(ROOT).as_posix()

def make_work(category_id, path, relative_key, kind, title=None):
    src = rel(path)
    title = title or title_from(path)
    work_id = "archivo-" + category_id + "-" + slug(relative_key)
    item = {"type": kind, "src": src, "label": title}
    if kind == "img":
        item.update({"thumb": src, "alt": title})
        cover = src
    elif kind == "video":
        item.update({"thumb": "", "alt": title})
        cover = {"video": src}
    elif kind == "audio":
        cover = {"text": title}
    elif kind == "link":
        item = {"type": "link", "url": src, "label": "Abrir experiencia ↗"}
        cover = {"text": title}
    else:
        item = {"type": "link", "url": src, "label": "Abrir documento ↗"}
        cover = {"text": title}
    return {
        "id": work_id,
        "cat": category_id,
        "title": title,
        "kicker": path.suffix.lstrip(".").upper(),
        "cover": cover,
        "items": [item],
    }

def main():
    data = json.loads(DATA.read_text(encoding="utf-8"))
    generated = []
    for folder, cat_id, _label, _desc in CATEGORIES:
        base = MEDIA_ROOT / folder
        base.mkdir(parents=True, exist_ok=True)
        if not base.exists():
            continue

        # In EXPERIENCIAS-VIRTUALES, a folder containing index.html is one experience.
        consumed = set()
        if cat_id == "experiencias-virtuales":
            for index in sorted(base.rglob("index.html")):
                if any(part.startswith(".") for part in index.relative_to(base).parts):
                    continue
                key = index.parent.relative_to(base).as_posix()
                title = index.parent.name.replace("-", " ").replace("_", " ").title()
                generated.append(make_work(cat_id, index, key or "inicio", "link", title or "Experiencia virtual"))
                consumed.add(index.resolve())

        for path in sorted(base.rglob("*")):
            if not path.is_file() or path.resolve() in consumed:
                continue
            if any(part.startswith(".") for part in path.relative_to(base).parts):
                continue
            ext = path.suffix.lower()
            if ext in IMAGE:
                kind = "img"
            elif ext in AUDIO:
                kind = "audio"
            elif ext in VIDEO:
                kind = "video"
            elif ext in WEB:
                kind = "link"
            elif ext in DOC:
                kind = "pdf"
            else:
                continue
            key = path.relative_to(base).with_suffix("").as_posix()
            generated.append(make_work(cat_id, path, key, kind))

    # Existing hand-curated projects remain intact; new files are appended automatically.
    existing_ids = {w.get("id") for w in data.get("works", [])}
    data["works"] = data.get("works", []) + [w for w in generated if w["id"] not in existing_ids]
    DATA.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Catálogo generado: {len(generated)} archivos nuevos; {len(data['works'])} obras en total.")

if __name__ == "__main__":
    main()

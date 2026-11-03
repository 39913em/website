#!/usr/bin/env python3
"""Genera obras desde PORTAFOLIO/* sin editar manualmente el catálogo."""
import json, re, unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "obra.json"
BASE = ROOT / "PORTAFOLIO"
CATEGORIES = [
    ("AUDIO", "audio", "Audio"),
    ("VIDEO", "video", "Video"),
    ("FOTOGRAFIA", "fotografia", "Fotografía"),
    ("ILUSTRACION/DIGITAL", "ilustracion-digital", "Ilustración digital"),
    ("ILUSTRACION/FISICA", "ilustracion-fisica", "Ilustración física"),
    ("PINTURA", "pintura", "Pintura"),
    ("DIBUJO", "dibujo", "Dibujo"),
    ("EXPERIENCIAS-VIRTUALES", "experiencias-virtuales", "Experiencias virtuales"),
]
IMAGES={".jpg",".jpeg",".png",".webp",".gif",".avif",".svg"}
AUDIOS={".mp3",".wav",".ogg",".oga",".m4a",".aac",".flac"}
VIDEOS={".mp4",".webm",".m4v",".mov"}
WEB={".html",".htm"}
PDF={".pdf"}

def slug(s):
    s=unicodedata.normalize("NFKD",s).encode("ascii","ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+","-",s).strip("-") or "archivo"

def title_for(path):
    return re.sub(r"[_-]+"," ",path.stem).strip().title() or "Sin título"

def rel(path): return path.relative_to(ROOT).as_posix()

def referenced_paths(value, found):
    if isinstance(value,dict):
        for v in value.values(): referenced_paths(v,found)
    elif isinstance(value,list):
        for v in value: referenced_paths(v,found)
    elif isinstance(value,str) and value.startswith("PORTAFOLIO/"):
        found.add(value)

def make_work(cat,path,key,kind,title=None):
    title=title or title_for(path)
    src=rel(path)
    if kind=="img":
        cover=src; item={"type":"img","src":src,"thumb":src,"alt":title,"label":title}
    elif kind=="video":
        cover={"video":src}; item={"type":"video","src":src,"alt":title,"label":title}
    elif kind=="audio":
        cover={"text":title}; item={"type":"audio","src":src,"label":"Escuchar"}
    else:
        cover={"text":title}
        item={"type":"link","url":src,"label":"Abrir experiencia" if kind=="web" else "Abrir documento"}
    return {"id":"archivo-"+cat+"-"+slug(key),"cat":cat,"title":title,"kicker":path.suffix.lstrip(".").upper(),"cover":cover,"items":[item]}

def main():
    data=json.loads(DATA.read_text(encoding="utf-8"))
    known=set(); referenced_paths(data.get("works",[]),known)
    generated=[]
    for folder,cat,label in CATEGORIES:
        root=BASE/folder
        root.mkdir(parents=True,exist_ok=True)
        # A directory containing index.html is one complete virtual experience.
        experience_dirs=[]
        if cat=="experiencias-virtuales":
            for index in sorted(root.rglob("index.html")):
                rel_parts=index.relative_to(root).parts
                if any(part.startswith(".") for part in rel_parts): continue
                experience_dirs.append(index.parent)
                key=index.parent.relative_to(root).as_posix()
                title=index.parent.name.replace("-"," ").replace("_"," ").title() or "Experiencia virtual"
                if rel(index) not in known:
                    generated.append(make_work(cat,index,key or "inicio","web",title))
        for path in sorted(root.rglob("*")):
            if not path.is_file(): continue
            rel_parts=path.relative_to(root).parts
            if any(part.startswith(".") for part in rel_parts): continue
            if any(parent==path.parent or parent in path.parents for parent in experience_dirs):
                continue
            if rel(path) in known: continue
            ext=path.suffix.lower()
            if ext in IMAGES: kind="img"
            elif ext in AUDIOS: kind="audio"
            elif ext in VIDEOS: kind="video"
            elif ext in WEB: kind="web"
            elif ext in PDF: kind="pdf"
            else: continue
            key=path.relative_to(root).with_suffix("").as_posix()
            generated.append(make_work(cat,path,key,kind))
    ids={w.get("id") for w in data.get("works",[])}
    fresh=[]
    for work in generated:
        if work["id"] not in ids:
            fresh.append(work); ids.add(work["id"])
    data["works"].extend(fresh)
    DATA.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(f"Catálogo listo: {len(fresh)} archivos nuevos; {len(data['works'])} obras totales.")

if __name__=="__main__": main()

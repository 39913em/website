#!/usr/bin/env python3
"""Sincroniza archivos añadidos a PORTAFOLIO con data/obra.json antes de publicar."""
import json, re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'data/obra.json'
SUPPORTED={
 '.jpg':'img','.jpeg':'img','.png':'img','.webp':'img','.gif':'img','.avif':'img','.svg':'img',
 '.mp4':'video','.webm':'video','.m4v':'video','.mov':'video',
 '.mp3':'audio','.wav':'audio','.ogg':'audio','.oga':'audio','.m4a':'audio','.aac':'audio','.flac':'audio'
}
CATEGORY_ROOTS={
 'VIDEO':'video','AUDIO':'audio','ILUSTRACION/DIGITAL':'ilustracion',
 'ILUSTRACION/FISICA':'ilustracion','PINTURA':'pintura','DIBUJO':'dibujo'
}

def slug(s):
    s=s.lower().strip()
    s=re.sub(r'[^a-z0-9áéíóúñü]+','-',s)
    return s.strip('-') or 'obra-nueva'

def title_from_folder(s):
    return re.sub(r'[-_]+',' ',s).strip().title()

def scan(folder):
    files=[]
    video_stems={p.stem.lower() for p in folder.iterdir() if p.is_file() and p.suffix.lower() in {'.mp4','.webm','.m4v','.mov'}}
    for p in sorted(folder.iterdir(),key=lambda x:x.name.lower()):
        if not p.is_file() or p.name.startswith('.') or '--thumb.' in p.name.lower():
            continue
        if p.suffix.lower() in SUPPORTED:
            if SUPPORTED[p.suffix.lower()]=='img' and p.stem.lower() in video_stems:
                continue  # poster de video, no una pieza independiente
            files.append(p)
    return files

def make_items(folder, title):
    files=scan(folder); items=[]
    for p in files:
        rel=p.relative_to(ROOT).as_posix(); typ=SUPPORTED[p.suffix.lower()]
        if typ=='img':
            thumb=p.with_name(p.stem+'--thumb'+p.suffix)
            items.append({'type':'img','src':rel,'thumb':thumb.relative_to(ROOT).as_posix() if thumb.exists() else rel,'alt':title})
        elif typ=='video':
            poster=next((q for q in [p.with_suffix('.jpg'),p.with_suffix('.webp'),p.with_suffix('.png')] if q.exists()),None)
            item={'type':'video','src':rel,'alt':title}
            if poster: item['thumb']=poster.relative_to(ROOT).as_posix()
            items.append(item)
        elif typ=='audio':
            items.append({'type':'audio','src':rel,'alt':title})
    return files,items

def main():
    data=json.loads(DATA.read_text(encoding='utf-8'))
    by_folder={w.get('folder'):w for w in data['works'] if w.get('folder')}
    known_ids={w['id'] for w in data['works']}
    added_works=added_items=0

    # Add new media to existing cards/collections, including the three fixed photo collections.
    for folder_rel,work in list(by_folder.items()):
        folder=ROOT/folder_rel
        if not folder.is_dir(): continue
        _,fresh=make_items(folder,work['title'])
        existing=set()
        for old in work.get('items',[]):
            for key in ('src','thumb','cover'):
                if isinstance(old.get(key),str): existing.add(old[key])
        cover=work.get('cover')
        if isinstance(cover,str): existing.add(cover)
        elif isinstance(cover,dict): existing.update(v for v in cover.values() if isinstance(v,str))
        for item in fresh:
            if item.get('src') not in existing:
                work.setdefault('items',[]).append(item); existing.add(item.get('src')); added_items+=1

    # New folders create new cards, never new menu tabs or nested navigation.
    for root_rel,cat in CATEGORY_ROOTS.items():
        base=ROOT/'PORTAFOLIO'/root_rel
        if not base.is_dir(): continue
        for folder in sorted(base.iterdir(),key=lambda x:x.name.lower()):
            if not folder.is_dir(): continue
            rel=folder.relative_to(ROOT).as_posix()
            if rel in by_folder: continue
            files,items=make_items(folder,title_from_folder(folder.name))
            if not items: continue
            wid=slug(rel.replace('PORTAFOLIO/',''))
            if wid in known_ids: wid += '-2'
            title=title_from_folder(folder.name)
            first_img=next((i for i in items if i['type']=='img'),None)
            first_vid=next((i for i in items if i['type']=='video'),None)
            if first_img: cover=first_img.get('thumb') or first_img['src']
            elif first_vid: cover={'video':first_vid['src'],'poster':first_vid.get('thumb','')}
            else: cover={'text':title}
            data['works'].append({'id':wid,'cat':cat,'title':title,'kicker':cat.upper(),'cover':cover,'items':items,'folder':rel})
            known_ids.add(wid); by_folder[rel]=data['works'][-1]; added_works+=1

    DATA.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f'PORTAFOLIO sincronizado: {added_items} archivos nuevos; {added_works} obras nuevas; {len(data["works"])} obras totales.')

if __name__=='__main__': main()

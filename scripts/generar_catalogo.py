#!/usr/bin/env python3
"""Index new files placed under PORTAFOLIO without editing data/obra.json by hand."""
import json, re, os
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
PORT=ROOT/'PORTAFOLIO'; DB=ROOT/'data/obra.json'
IMG={'.jpg','.jpeg','.png','.webp','.gif','.avif','.svg'}
VID={'.mp4','.webm','.m4v','.mov'}; AUD={'.mp3','.wav','.ogg','.oga','.m4a','.aac','.flac'}; LINK={'.html','.htm','.pdf'}

def slug(s):
 s=s.lower().strip(); s=re.sub(r'[^a-z0-9]+','-',s).strip('-'); return s or 'obra'
def title(s): return re.sub(r'[-_]+',' ',s).strip().title()
def rel(p): return p.relative_to(ROOT).as_posix()
def media_item(p, files):
 ext=p.suffix.lower(); path=rel(p)
 if ext in IMG:
  if p.stem.endswith('--thumb') or any(q.stem==p.stem and q.suffix.lower() in VID for q in files): return None
  thumb=next((q for q in files if q.stem==p.stem+'--thumb' and q.suffix.lower() in IMG),None)
  return {'type':'img','src':path,'thumb':rel(thumb) if thumb else path,'alt':title(p.stem)}
 if ext in VID:
  poster=next((q for q in files if q.stem==p.stem and q.suffix.lower() in IMG),None)
  return {'type':'video','src':path,'thumb':rel(poster) if poster else None,'alt':title(p.stem)}
 if ext in AUD: return {'type':'audio','src':path,'label':title(p.stem)}
 if ext in LINK: return {'type':'link','url':path,'label':'Abrir proyecto'}
 return None

def main():
 data=json.loads(DB.read_text(encoding='utf-8')); known={w['id']:w for w in data['works']}; cats={c['id']:c for c in data['categories']}
 roots=[('VIDEO','video',None),('AUDIO','audio',None),('FOTOGRAFIA/SESIONES','fotografia','sesiones'),('FOTOGRAFIA/RETRATO','fotografia','retrato'),('FOTOGRAFIA/EXPERIMENTAL','fotografia','experimental'),('ILUSTRACION/DIGITAL','ilustracion','digital'),('ILUSTRACION/FISICA','ilustracion','fisica'),('PINTURA','pintura',None),('DIBUJO','dibujo',None),('EXPERIENCIAS-VIRTUALES','experiencias-virtuales',None)]
 changed=0
 for folder,cat,sub in roots:
  base=PORT/folder
  if not base.exists(): continue
  # A folder directly inside a category represents one project. Files placed directly in the category become one-card works.
  projects=[p for p in base.iterdir() if p.is_dir()]
  direct=[p for p in base.iterdir() if p.is_file() and p.suffix.lower() in IMG|VID|AUD|LINK]
  groups=[(p.name,sorted([q for q in p.rglob('*') if q.is_file() and q.suffix.lower() in IMG|VID|AUD|LINK])) for p in projects]
  groups += [(p.stem,[p]) for p in direct]
  for name,files in groups:
   files=sorted(files,key=lambda p:(p.stem.endswith('--thumb'),p.name.lower()))
   index_file=next((p for p in files if p.name.lower() in ('index.html','index.htm')),None) if cat=='experiencias-virtuales' else None
   if index_file:
    items=[{'type':'link','url':rel(index_file),'label':'Abrir experiencia'}]
   else:
    items=[x for p in files if (x:=media_item(p,files))]
   if not items: continue
   wid=slug(name)
   if wid in known and (known[wid].get('cat') != cat or known[wid].get('subcat') != sub):
    wid=slug((sub or cat)+'-'+name)
   if wid in known:
    w=known[wid]; existing=set()
    for item in w.get('items',[]):
     for key in ('src','thumb','cover'):
      if isinstance(item.get(key),str): existing.add(item[key])
    if isinstance(w.get('cover'),str): existing.add(w['cover'])
    elif isinstance(w.get('cover'),dict): existing.update(v for v in w['cover'].values() if isinstance(v,str))
    new=[x for x in items if x.get('src') not in existing]
    if new: w.setdefault('items',[]).extend(new); changed+=len(new)
    continue
   first=items[0]
   image_cover=next((rel(p) for p in files if p.suffix.lower() in IMG and not p.stem.endswith('--thumb')),None)
   cover=image_cover or first.get('thumb') or first.get('src') or {'text':title(name)}
   w={'id':wid,'title':title(name),'cat':cat,'kicker':cats[cat]['label'],'cover':cover,'items':items}
   if sub: w['subcat']=sub
   data['works'].append(w); known[wid]=w; changed+=1
 DB.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print(f'Catálogo actualizado: {changed} elementos nuevos; {len(data["works"])} obras.')
if __name__=='__main__': main()

set -e
cd /home/claude/geo
python3 -I scripts/prep_countries.py >/dev/null
python3 -I scripts/build_geo.py
python3 -I scripts/tz.py
node scripts/build_topo.mjs
python3 -I -c "import sys,json; sys.path.insert(0,'scripts'); import f_langs; json.dump(f_langs.L, open('build/langs.json','w'), ensure_ascii=False)"
node scripts/build_info.mjs >/dev/null
node scripts/tz_topo.mjs
python3 -I - <<'PY'
import json
m=json.load(open('build/phys_meta.json')); lab=json.load(open('build/labels.json'))
for k,v in lab.items():
    if k in m['items']: m['items'][k].update({'L':v})
json.dump(m,open('out/data/phys.json','w'),ensure_ascii=False,separators=(',',':'))
r=json.load(open('build/relief_meta.json')); p=json.load(open('build/world_params.json')); r.update(p)
json.dump(r,open('out/data/params.json','w'))
import sys; sys.path.insert(0,'scripts')
import special_data as S
json.dump({'disputes':S.DISPUTES,'changes':S.CHANGES,'colonies':{k:[dict(geo=e[0],n=e[1],a=e[2],b=e[3],t=e[4],end=e[5]) for e in v] for k,v in S.COLONIES.items()}},open('out/data/special.json','w'),ensure_ascii=False,separators=(',',':'))
PY
ls -la out/data

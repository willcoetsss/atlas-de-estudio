# Reparte las unidades que solo existen en la escala 1:10m entre los países de la versión general
import json
from shapely.geometry import shape, mapping
from shapely.ops import unary_union
B='/home/claude/geo/build/'
lo={f['properties']['id']:shape(f['geometry']) for f in json.load(open(B+'countries_ll.geojson'))['features']}
fc=json.load(open(B+'countries_hd_ll.geojson'))
hd={f['properties']['id']:f for f in fc['features']}
for k in [k for k in hd if k not in lo]:
    g=shape(hd[k]['geometry']); p=g.representative_point()
    host=[i for i,lg in lo.items() if lg.buffer(0.05).contains(p)]
    print(k, hd[k]['properties']['name'], '->', host)
    if host:
        h=hd[host[0]]; h['geometry']=mapping(unary_union([shape(h['geometry']).buffer(0),g.buffer(0)]))
    del hd[k]
fc['features']=list(hd.values())
json.dump(fc,open(B+'countries_hd_ll.geojson','w'))
print(len(fc['features']))
# quita islotes lejanos que el mapa general no tiene (Bouvet en Noruega, Clipperton en Francia...)
from shapely.geometry import MultiPolygon, box
fc=json.load(open(B+'countries_hd_ll.geojson'))
for f in fc['features']:
    k=f['properties']['id']; g=shape(f['geometry'])
    if k not in lo or g.geom_type!='MultiPolygon': continue
    zone=lo[k].buffer(6)
    keep=[p for p in g.geoms if zone.intersects(p)]
    drop=[p for p in g.geoms if not zone.intersects(p)]
    if drop: print('drop', k, len(drop), [tuple(round(c,1) for c in p.representative_point().coords[0]) for p in drop][:4])
    f['geometry']=mapping(MultiPolygon(keep) if len(keep)>1 else keep[0])
json.dump(fc,open(B+'countries_hd_ll.geojson','w'))

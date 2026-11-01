import json, sys
from shapely.geometry import shape, mapping, MultiPolygon, Polygon
from shapely.ops import unary_union
D='/home/claude/geo/dl/'; B='/home/claude/geo/build/'
c50=json.load(open(D+'ne_50m_admin_0_countries.geojson'))['features']
c10=json.load(open(D+'ne_10m_admin_0_countries.geojson'))['features']
dis=json.load(open(D+'ne_10m_admin_0_disputed_areas.geojson'))['features']
def key(p):
    e=p['ISO_A3_EH']; k= e if e and e!='-99' and p['ADM0_A3'] not in ('IOA','ATC') else p['ADM0_A3']
    return {'XKX':'KOS'}.get(k,k)
SOVMAP={'US1':'USA','GB1':'GBR','FR1':'FRA','DN1':'DNK','NL1':'NLD','NZ1':'NZL','AU1':'AUS','CH1':'CHN','FI1':'FIN','KA1':'KAZ','IS1':'ISR','CU1':'CUB'}
MERGE={'SOL':'SOM','CYN':'CYP','ALA':'FIN'}
# far parts: (sov, id, name, test(lon,lat))
FAR=[('FRA','GUF','Guayana Francesa',lambda x,y: -56<x<-50 and 1<y<7),
     ('FRA','GLP','Guadalupe',lambda x,y: -62<x<-60.8 and 15.8<y<16.6),
     ('FRA','MTQ','Martinica',lambda x,y: -61.3<x<-60.7 and 14.3<y<15),
     ('FRA','REU','Reunión',lambda x,y: 55<x<56 and -21.5<y<-20.8),
     ('FRA','MYT','Mayotte',lambda x,y: 44.9<x<45.4 and -13.1<y<-12.5),
     ('NLD','BES','Caribe neerlandés',lambda x,y: x<-30),
     ('NOR','SJM','Svalbard y Jan Mayen',lambda x,y: y>73 or x<0),
     ('ESP','CAN','Islas Canarias',lambda x,y: y<30),
     ('PRT','AZO','Azores',lambda x,y: x<-24),
     ('PRT','MAD','Madeira',lambda x,y: -18<x<-15.5 and y<34),
     ('CHL','PAS','Isla de Pascua',lambda x,y: x<-100),
     ('ECU','GAL','Islas Galápagos',lambda x,y: x<-85),
]
out=[]; meta={}
groups={}
for f in c50:
    p=f['properties']; k=key(p); g=shape(f['geometry'])
    k=MERGE.get(k,k)
    groups.setdefault(k,[]).append((g,p))
# add Gibraltar from 10m
for f in c10:
    p=f['properties']
    if key(p)=='GIB': groups['GIB']=[(shape(f['geometry']),p)]
for k,lst in groups.items():
    g=unary_union([x[0] for x in lst]) if len(lst)>1 else lst[0][0]
    # main props: prefer one whose key equals k
    p=[x[1] for x in lst if key(x[1])==k] or [lst[0][1]]; p=p[0]
    sov=SOVMAP.get(p['SOV_A3'],p['SOV_A3'])
    if p['TYPE'] in ('Sovereign country','Sovereignty') or p['SOV_A3']==p['ADM0_A3']: sov=k
    if k in ('PSX','PSE'): sov=k
    if k in ('GIB',): sov='GBR'
    if k in ('HKG','MAC'): sov='CHN'
    if k in ('KOS','TWN','SAH','ESH','KAS','ATA','ISR'): sov=k
    polys=list(g.geoms) if g.geom_type=='MultiPolygon' else [g]
    rest=[]
    for poly in polys:
        c=poly.representative_point(); hit=None
        for (s,fid,name,t) in FAR:
            if s==k and t(c.x,c.y): hit=(fid,name);break
        if hit:
            fid=k+'-'+hit[0]
            out.append({'id':fid,'sov':k,'kind':'far','name':hit[1],'geom':poly})
        else: rest.append(poly)
    gg=MultiPolygon(rest) if len(rest)>1 else rest[0]
    kind='state' if sov==k else 'territory'
    out.append({'id':k,'sov':sov,'kind':kind,'name':p['NAME_ES'],'geom':gg})
    meta[k]={'ne_name':p['NAME_ES'],'lx':p['LABEL_X'],'ly':p['LABEL_Y'],'minlab':p['MIN_LABEL'],'cont':p['CONTINENT'],'sub':p['SUBREGION'],'pop':p['POP_EST'],'iso2':p['ISO_A2_EH'],'type':p['TYPE'],'sovn':p['SOVEREIGNT']}
# merge far parts with same id
m={}
for o in out:
    if o['id'] in m: m[o['id']]['geom']=unary_union([m[o['id']]['geom'],o['geom']])
    else: m[o['id']]=o
# Ceuta y Melilla from disputed 10m
for f in dis:
    p=f['properties']
    if p['NAME_ES'] in ('Ceuta','Melilla'):
        fid='ESP-'+p['NAME_ES'][:3].upper()
        m[fid]={'id':fid,'sov':'ESP','kind':'far','name':p['NAME_ES'],'geom':shape(f['geometry'])}
feats=[{'type':'Feature','properties':{k:v for k,v in o.items() if k!='geom'},'geometry':mapping(o['geom'])} for o in m.values()]
json.dump({'type':'FeatureCollection','features':feats},open(B+'countries_ll.geojson','w'))
json.dump(meta,open(B+'ne_meta.json','w'),ensure_ascii=False)
print(len(feats)); print(sorted([(o['id'],o['sov'],o['kind']) for o in m.values() if o['kind']!='state']))

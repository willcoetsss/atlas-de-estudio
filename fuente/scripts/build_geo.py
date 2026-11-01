import json, math, sys
sys.path.insert(0,'/home/claude/geo/scripts')
from shapely.geometry import shape, mapping, Polygon, MultiPolygon, Point, box
from shapely.ops import unary_union
from shapely.geometry.polygon import orient
from shapely.prepared import prep
import special_data as S
D='/home/claude/geo/dl/'; B='/home/claude/geo/build/'
L=lambda f: json.load(open(D+f+'.geojson'))['features']

def cw(g):
    if g.geom_type=='Polygon': return orient(g,-1.0)
    if g.geom_type=='MultiPolygon': return MultiPolygon([orient(p,-1.0) for p in g.geoms])
    return g
def fc(feats): return {'type':'FeatureCollection','features':feats}
def feat(props,g): return {'type':'Feature','properties':props,'geometry':mapping(cw(g))}

countries=json.load(open(B+'countries_ll.geojson'))['features']
cgeom={f['properties']['id']:shape(f['geometry']) for f in countries}

# ---------- extra geometries for special layers
dis={}
for f in L('ne_10m_admin_0_disputed_areas'):
    g=shape(f['geometry'])
    for n in set([f['properties']['NAME_ES'] or f['properties']['NAME'], 'en:'+f['properties']['NAME']]):
        dis[n]=unary_union([dis[n],g]) if n in dis else g
a1={}; a1reg={}
for f in L('ne_10m_admin_1_states_provinces'):
    p=f['properties']; a1[(p['adm0_a3'],p['name'])]=shape(f['geometry']); a1reg[(p['adm0_a3'],p['name'])]=p['region']
def ant(l0,l1):
    pts=[]; n=40
    for i in range(n+1): pts.append((l0+(l1-l0)*i/n,-60))
    for i in range(n+1): pts.append((l1-(l1-l0)*i/n,-89.9))
    return Polygon(pts)
refs={}
def need(r):
    if r in refs or r.startswith('c:'):
        if r.startswith('c:') and r[2:] not in cgeom: print('MISSING country',r)
        return
    t,_,rest=r.partition(':')
    if t=='ne':
        if rest in dis: refs[r]=dis[rest]
        else: print('MISSING ne',rest)
    elif t=='a1':
        iso,name=rest.split(':',1)
        if (iso,name) in a1: refs[r]=a1[(iso,name)]
        else: print('MISSING a1',iso,name,[k[1] for k in a1 if k[0]==iso][:60])
    elif t=='u':
        if rest=='MAR-FR':
            iso,names=S.UNIONS['MAR-ES']; refs[r]=cgeom['MAR'].buffer(0).difference(unary_union([a1[(iso,n)] for n in names]).buffer(0.01))
        elif rest=='SAKH-SUR': refs[r]=a1[('RUS','Sakhalin')].intersection(box(140,40,150,50))
        elif rest=='CANAL':
            from shapely.geometry import LineString
            refs[r]=LineString([(-79.92,9.36),(-79.83,9.27),(-79.70,9.10),(-79.60,9.02),(-79.54,8.94)]).buffer(0.08)
        else:
            iso,names=S.UNIONS[rest]
            if names=='*': refs[r]=unary_union([g for (k,n),g in a1.items() if k==iso])
            elif iso is None: refs[r]=unary_union([a1[x] for x in names])
            else: refs[r]=unary_union([a1[(iso,n)] for n in names])
    elif t=='r1':
        iso,reg=rest.split(':',1); gs=[g for (k,n),g in a1.items() if k==iso and a1reg.get((k,n))==reg]
        if not gs: print('MISSING r1',rest)
        else: refs[r]=unary_union([x.buffer(0) for x in gs])
    elif t=='ant':
        l0,l1=map(float,rest.split(':')); refs[r]=ant(l0,l1)
for d in S.DISPUTES+S.CHANGES:
    for r in d['geo']: need(r)
for k,lst in S.COLONIES.items():
    for e in lst:
        for r in e[0]: need(r)
json.dump(fc([feat({'id':k},g) for k,g in refs.items()]),open(B+'extra_ll.geojson','w'))
print('extra refs',len(refs))

# ---------- physical layers
def es(p,*keys):
    for k in keys:
        if p.get(k): return p[k]
    return None
marine=[]
MCL={'ocean':'océano','sea':'mar','gulf':'golfo','bay':'bahía','strait':'estrecho','channel':'canal','sound':'estrecho','fjord':'fiordo','lagoon':'laguna','inlet':'ensenada','reef':'arrecife','generic':'mar','river':'estuario'}
for i,f in enumerate(L('ne_10m_geography_marine_polys')):
    p=f['properties']; c=p['featurecla']
    if c not in ('ocean','sea','gulf','bay','strait','channel','sound','fjord','reef','generic','lagoon'): continue
    if p['scalerank']>5 and c not in ('ocean','sea','strait'): continue
    n=es(p,'name_es','name')
    if not n: continue
    marine.append(dict(id='m%d'%i,n=n,c=MCL[c],r=p['scalerank'],g=shape(f['geometry'])))
RCL={'Range/mtn':'cordillera','Desert':'desierto','Plateau':'meseta','Plain':'llanura','Peninsula':'península','Pen/cape':'península','Island group':'archipiélago','Island':'isla','Basin':'cuenca','Delta':'delta','Lowland':'llanura','Tundra':'tundra','Isthmus':'istmo','Valley':'valle','Depression':'depresión','Wetlands':'humedal'}
regions=[]
for i,f in enumerate(L('ne_10m_geography_regions_polys')):
    p=f['properties']; c=p['FEATURECLA']
    if c not in RCL: continue
    if c=='Island' and p['SCALERANK']>4: continue
    n=es(p,'NAME_ES','NAME')
    if not n: continue
    regions.append(dict(id='r%d'%i,n=n,c=RCL[c],r=p['SCALERANK'],g=shape(f['geometry'])))
peaks=[]
for i,f in enumerate(L('ne_10m_geography_regions_elevation_points')):
    p=f['properties']
    if p['featurecla'] not in ('mountain','spot elevation','depression'): continue
    n=es(p,'name_es','name')
    if not n or p['elevation'] is None: continue
    peaks.append(dict(id='p%d'%i,n=n,c='depresión' if p['featurecla']=='depression' else ('volcán' if 'volc' in (p.get('comment') or '').lower() else 'pico'),r=p['scalerank'],e=p['elevation'],x=p['long_x'],y=p['lat_y']))
rivers={}
for f in L('ne_50m_rivers_lake_centerlines_scale_rank'):
    p=f['properties']
    if p['featurecla']!='River': continue
    n=es(p,'name_es','name')
    if not n or not f['geometry']: continue
    k=n
    g=shape(f['geometry'])
    if k in rivers:
        rivers[k]['g'].append(g); rivers[k]['r']=min(rivers[k]['r'],p['scalerank'])
    else: rivers[k]=dict(id='v%d'%len(rivers),n=n,c='río',r=p['scalerank'],g=[g])
from shapely.ops import linemerge
from shapely.geometry import MultiLineString
for k,v in rivers.items():
    lines=[]
    for g in v['g']:
        lines+= list(g.geoms) if g.geom_type=='MultiLineString' else [g]
    m=linemerge(MultiLineString(lines))
    v['g']=m
lakes=[]
for i,f in enumerate(L('ne_50m_lakes')):
    p=f['properties']
    n=es(p,'name_es','name')
    if not n: continue
    g=shape(f['geometry']); a=g.area*math.cos(math.radians(g.representative_point().y))
    rk=1 if a>3 else 2 if a>0.7 else 3 if a>0.2 else 4 if a>0.06 else 5 if a>0.02 else 6
    lakes.append(dict(id='l%d'%i,n=('Lago '+n) if not n.lower().startswith(('lago','mar','laguna','embalse','presa')) else n,c='lago' if p['featurecla']!='Reservoir' else 'embalse',r=rk,g=g))
print('marine',len(marine),'regions',len(regions),'peaks',len(peaks),'rivers',len(rivers),'lakes',len(lakes))

def dump(name,items):
    json.dump(fc([feat({'id':o['id']},o['g']) for o in items]),open(B+name+'_ll.geojson','w'))
dump('marine',marine); dump('regions',regions); dump('lakes',lakes)
json.dump(fc([{'type':'Feature','properties':{'id':o['id']},'geometry':mapping(o['g'])} for o in rivers.values()]),open(B+'rivers_ll.geojson','w'))

# ---------- per-country physical index
idx={}
allc={}
for cid,g in cgeom.items():
    if not g.is_valid: g=g.buffer(0)
    allc[cid]=g
for cid,g in allc.items():
    pg=prep(g); bufp=prep(g.buffer(0.35))
    lst=[]
    for o in marine:
        if bufp.intersects(o['g']): lst.append(o['id'])
    for o in regions:
        if pg.intersects(o['g']):
            inter=g.intersection(o['g'].buffer(0)).area
            if inter> 0.15*o['g'].area or inter>0.5*g.area or inter>4: lst.append(o['id'])
    for o in peaks:
        if pg.contains(Point(o['x'],o['y'])) or g.distance(Point(o['x'],o['y']))<0.05: lst.append(o['id'])
    for o in rivers.values():
        if pg.intersects(o['g']):
            if g.intersection(o['g']).length>0.3 or o['g'].length<1: lst.append(o['id'])
    for o in lakes:
        if bufp.intersects(o['g']): lst.append(o['id'])
    idx[cid]=lst
meta={'items':{}}
for o in marine+regions+lakes:
    c=o['g'].representative_point(); meta['items'][o['id']]=dict(n=o['n'],c=o['c'],r=o['r'],x=round(c.x,3),y=round(c.y,3))
for o in rivers.values():
    meta['items'][o['id']]=dict(n=o['n'],c=o['c'],r=o['r'])
for o in peaks:
    meta['items'][o['id']]=dict(n=o['n'],c=o['c'],r=o['r'],e=o['e'],x=o['x'],y=o['y'])
meta['idx']=idx
json.dump(meta,open(B+'phys_meta.json','w'),ensure_ascii=False)

# ---------- cities
wc=json.load(open('/home/claude/geo/node_modules/world-countries/countries.json'))
a2=dict((c['cca2'],c['cca3']) for c in wc)
A3FIX={'SDS':'SSD','KOS':'KOS','SAH':'ESH','PSX':'PSE','SOL':'SOM','CYN':'CYP'}
cities={}
for f in L('ne_10m_populated_places'):
    p=f['properties']
    k=A3FIX.get(p['ADM0_A3'],p['ADM0_A3'])
    if k not in cgeom and p['ISO_A2'] in a2: k=a2[p['ISO_A2']]
    cities.setdefault(k,[]).append(dict(n=p['NAME_ES'] or p['NAME'],p=p['POP_MAX'],x=round(p['LONGITUDE'],3),y=round(p['LATITUDE'],3),cap=1 if p['FEATURECLA']=='Admin-0 capital' else (2 if p['FEATURECLA']=='Admin-0 capital alt' else 0)))
out={}
for k,l in cities.items():
    l.sort(key=lambda c:-c['p'])
    top=l[:6]
    for c in l:
        if c['cap'] and c not in top: top=top[:5]+[c]
    out[k]=top
json.dump(out,open(B+'cities.json','w'),ensure_ascii=False)
print('done')

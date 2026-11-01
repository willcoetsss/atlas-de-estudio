# Husos horarios: Natural Earth (2012-14) corregido con los cambios posteriores
import json
from shapely.geometry import shape, mapping, MultiPolygon, Polygon
from shapely.ops import unary_union
from shapely.geometry.polygon import orient
D = '/home/claude/geo/dl/'; B = '/home/claude/geo/build/'
L = lambda f: json.load(open(D + f + '.geojson'))['features']
tz = [(shape(f['geometry']).buffer(0), f['properties']['zone'], f['properties']['places'] or '') for f in L('ne_10m_time_zones')]
cty = {}
for f in L('ne_10m_admin_0_countries'):
    p = f['properties']; k = p['ADM0_A3']; g = shape(f['geometry']).buffer(0)
    cty[k] = unary_union([cty[k], g]) if k in cty else g
a1 = {}
for f in L('ne_10m_admin_1_states_provinces'):
    p = f['properties']; a1[(p['adm0_a3'], p['name'])] = shape(f['geometry']).buffer(0)
RUS = {2: ['Kaliningrad'], 4: ['Samara', 'Udmurt', "Astrakhan'", 'Saratov', "Ul'yanovsk"],
       5: ['Bashkortostan', 'Chelyabinsk', 'Kurgan', 'Orenburg', "Perm'", 'Sverdlovsk', "Tyumen'", 'Khanty-Mansiy', 'Yamal-Nenets'],
       6: ['Omsk'], 7: ['Altay', 'Gorno-Altay', 'Kemerovo', 'Khakass', 'Krasnoyarsk', 'Novosibirsk', 'Tomsk', 'Tuva'],
       8: ['Irkutsk', 'Buryat'], 9: ['Chita', 'Amur', 'Sakha (Yakutia)'], 10: ["Primor'ye", 'Khabarovsk', 'Yevrey'],
       11: ['Maga Buryatdan', 'Sakhalin'], 12: ['Kamchatka', 'Chukchi Autonomous Okrug']}
RNAME = {2: 'Rusia (Kaliningrado)', 3: 'Rusia (hora de Moscú)', 4: 'Rusia (Samara)', 5: 'Rusia (Ekaterimburgo)', 6: 'Rusia (Omsk)', 7: 'Rusia (Krasnoyarsk, Novosibirsk)', 8: 'Rusia (Irkutsk)', 9: 'Rusia (Yakutsk)', 10: 'Rusia (Vladivostok)', 11: 'Rusia (Magadán, Sajalín)', 12: 'Rusia (Kamchatka)'}
over = []  # (geom, zone, label)
done = set()
for z, names in RUS.items():
    g = unary_union([a1[('RUS', n)] for n in names]); done |= set(names); over.append((g, z, RNAME[z]))
rest = unary_union([g for (k, n), g in a1.items() if k == 'RUS' and n not in done])
over.append((rest, 3, RNAME[3]))
over += [(cty['KAZ'], 5, 'Kazajistán (hora única desde 2024)'), (cty['TUR'], 3, 'Turquía (UTC+3 fijo desde 2016)'),
         (cty['VEN'], -4, 'Venezuela (desde 2016)'), (cty['SDN'], 2, 'Sudán (desde 2017)'), (cty['SDS'], 2, 'Sudán del Sur (desde 2021)'),
         (unary_union([cty['MAR'], cty['SAH']]), 1, 'Marruecos y Sáhara Occidental (UTC+1 desde 2018)'),
         (a1[('MEX', 'Quintana Roo')], -5, 'México (Quintana Roo, desde 2015)')]
# Groenlandia central pasó a UTC-2 en 2023
tz = [(g, -2 if 'Greenland (central' in p else z, p) for g, z, p in tz]
ov = unary_union([o[0] for o in over])
from shapely.prepared import prep
FIX = {'SDS': 'SSD', 'SAH': 'ESH', 'PSX': 'PSE', 'KOS': 'KOS', 'SOL': 'SOM', 'CYN': 'CYP'}
carea = {k: g.area for k, g in cty.items()}
cprep = {k: prep(g) for k, g in cty.items()}
def countries(g):
    out = []
    for k, cg in cty.items():
        if not cprep[k].intersects(g): continue
        a = cg.intersection(g).area
        if a < 0.002 or a < carea[k] * 0.02: continue
        out.append([FIX.get(k, k), 0 if a > carea[k] * 0.9 else 1])
    return out
feats = []
def add(g, z, label):
    if g.is_empty: return
    polys = [g] if g.geom_type == 'Polygon' else [x for x in getattr(g, 'geoms', []) if x.geom_type == 'Polygon']
    polys = [orient(p, -1.0) for p in polys if p.area > 1e-4]
    if not polys: return
    geom = MultiPolygon(polys) if len(polys) > 1 else polys[0]
    feats.append({'type': 'Feature', 'properties': {'z': z, 'p': label, 'c': countries(geom)}, 'geometry': mapping(MultiPolygon(polys) if len(polys) > 1 else polys[0])})
for g, z, p in tz: add(g.difference(ov), z, p)
for g, z, p in over: add(g, z, p)
json.dump({'type': 'FeatureCollection', 'features': feats}, open(B + 'tz_ll.geojson', 'w'))
print(len(feats))

"""Compose the three playable floors and their surroundings from the camper art sheets."""
import json
import subprocess

import numpy as np
from PIL import Image, ImageDraw, ImageOps


SIZE = 960  # 24 walkable units × 40 projected pixels along either horizontal axis
PAN_WIDTH = 640
PAN_HEIGHT = 400
# Grove locations are authored on this coarse grid, then drawn at world-pixel resolution.
PAN_SCALE = 5
PAN_ORIGIN = (PAN_WIDTH // 2, PAN_HEIGHT // 2)


def panel(image, col, row):
    side = image.width // 2
    return image.crop((col*side+2, row*side+2, (col+1)*side-2, (row+1)*side-2)).convert('RGB')


def variation(rng, size, cells):
    """A seeded, continuous patch field; quantize at the material edge, not on the path."""
    grid = rng.integers(0, 256, (cells, cells), dtype=np.uint8)
    return np.asarray(Image.fromarray(grid).resize(size, Image.Resampling.BICUBIC)).astype(float)/255 - .5


def mix(a, b, weight):
    return a + (b-a)*np.clip(weight, 0, 1)[..., None]


def rgb(array):
    return Image.fromarray(np.uint8(np.clip(array, 0, 255)))


def material(image, x, y, span, warp=0, density=1):
    # Warp grass patches gently across swatch joins. Paving keeps its laid courses.
    span = round(span*density)
    tile = np.asarray(image.resize((span, span), Image.Resampling.BOX), dtype=float)
    u = np.floor(x + density*warp*(np.sin(y/(59*density)) + .48*np.sin((x/35+y/83)/density))).astype(int)
    v = np.floor(y + density*warp*(np.sin(x/(73*density)) - .35*np.cos((y/33-x/69)/density))).astype(int)
    return tile[v % span, u % span]


def route_distance(x, y, route):
    points = np.array(route['points'], dtype=float)
    # Round the authored corners while leaving both interaction points fixed.
    for _ in range(2):
        left, right = points[:-1], points[1:]
        bends = np.stack((left*.75+right*.25, left*.25+right*.75), axis=1)
        points = np.vstack((points[0], bends.reshape(-1, 2), points[-1]))
    distance = np.full_like(x, np.inf)
    for (ax, ay), (bx, by) in zip(points, points[1:]):
        dx, dy = bx-ax, by-ay
        t = np.clip(((x-ax)*dx+(y-ay)*dy)/max(.00001, dx*dx+dy*dy), 0, 1)
        distance = np.minimum(distance, np.hypot(x-ax-t*dx, y-ay-t*dy))
    return distance - route['width']/80


def scatter_leaves(image, allowed, count, rng, meadow):
    pen = ImageDraw.Draw(image)
    locations = np.argwhere(allowed)
    if len(locations) == 0:
        return
    for idx in rng.choice(len(locations), count, replace=True):
        y, x = map(int, locations[idx])
        for _ in range(int(rng.integers(2, 6))):
            u, v = x+int(rng.integers(-7, 8)), y+int(rng.integers(-5, 6))
            if not (3 <= u < SIZE-4 and 3 <= v < SIZE-4 and allowed[v,u]):
                continue
            base = np.asarray(image.getpixel((u,v)))
            shade = tuple(np.maximum(0, base-[16, 12, 11]))
            light = tuple(np.minimum(255, base+([12, 16, 3] if meadow else [35, 16, 2])))
            pen.line([(u-2,v+1),(u,v+1),(u+2,v-1)], fill=shade, width=2)
            pen.line([(u-1,v),(u+2,v-2)], fill=light, width=1)


def forest_floor_details(image, world, worn, rng):
    pen = ImageDraw.Draw(image)
    # Ferns grow in small groups at the tree bases. Keep the actual bench approaches open.
    for tree in (s for s in world['scenery'] if s['type']=='tree'):
        for _ in range(4):
            u,v = (int(SIZE*(.5+(tree[axis]+rng.uniform(-1,1))/(2*world['bounds']['edge']))) for axis in ('x','y'))
            base = np.array(image.getpixel((u,v)), dtype=int)
            shadow, leaf, tip = [tuple(np.clip(base+delta,0,255)) for delta in
                                 [(-26,-19,-12), (3,19,5), (31,35,11)]]
            for dx,dy in [(-14,-6),(-7,-12),(2,-15),(13,-8),(12,4),(-10,5)]:
                pen.line((u,v+1,u+dx,v+dy+1),fill=shadow,width=2)
                pen.line((u,v,u+dx,v+dy),fill=leaf,width=1)
                for step in (.42,.68,.88):
                    ax,ay = int(u+dx*step),int(v+dy*step)
                    pen.line((ax,ay,ax+int(dy*.27),ay-int(dx*.27)),fill=tip,width=1)
                    pen.line((ax,ay,ax-int(dy*.22),ay+int(dx*.22)),fill=leaf,width=2)
    # Short broken twigs and half-buried gravel occupy the seam between soil and turf.
    sites = np.argwhere((worn>-.46)&(worn<.28))
    for k in rng.choice(len(sites), 75, replace=False):
        v,u = map(int, sites[k])
        base = np.array(image.getpixel((u,v)),dtype=int)
        shadow = tuple(np.maximum(base-[25,23,18],0))
        light = tuple(np.minimum(base+[28,25,17],255))
        pen.polygon([(u-2,v),(u,v-2),(u+3,v-1),(u+4,v+1),(u,v+2)],fill=shadow)
        pen.line((u-1,v,u+2,v-1),fill=light,width=2)


def camp_hedgerow(image, bounds, rng):
    """Low banks of moss and leaf clusters rooted on the actual walk limit."""
    pen = ImageDraw.Draw(image)
    inset = round((bounds['edge']-bounds['walk'])*SIZE/(2*bounds['edge']))
    for side in range(4):
        def point(along, across):
            a,b=along,inset+across
            return [(a,b),(SIZE-1-b,a),(SIZE-1-a,SIZE-1-b),(b,SIZE-1-a)][side]
        along=0
        while along<SIZE:
            width=int(rng.integers(18,36))
            depth=int(rng.integers(6,17))
            # Leafy lobes spill onto the grass, with the root line at the stop.
            hull=[(-3,0),(2,-7),(width//3,-10),(width-4,-9),(width+3,-2),
                  (width,5),(width*2//3,depth),(width//2,depth-3),(5,depth-2)]
            pen.polygon([point(along+a,b+3) for a,b in hull],fill=(59,57,37))
            pen.polygon([point(along+a,b) for a,b in hull],fill=(83,91,51))
            for u in range(3,width-2,6):
                v=int(rng.integers(0,depth-2))
                pen.polygon([point(along+u-3,v-3),point(along+u,v-5),
                             point(along+u+5,v-3),point(along+u+4,v+2),
                             point(along+u,v+3)],fill=(109,121,66))
                pen.line([point(along+u-2,v-3),point(along+u+1,v-5),
                          point(along+u+4,v-4)],fill=(136,140,83),width=2)
            along+=width-1


def floor_image(name, world, ground, rng):
    py, px = np.indices((SIZE, SIZE))
    edge = world['bounds']['edge']
    x, y = ((axis+.5)/SIZE*2*edge-edge for axis in (px,py))
    broad = variation(rng, (SIZE,SIZE), 11)
    fine = variation(rng, (SIZE,SIZE), 85)
    noise = broad*.66 + fine*.28
    route = np.minimum.reduce([route_distance(x,y,r) for r in world['routes']])
    grass = material(panel(ground, int(name!='camp'), 0), px, py, 139, 18, SIZE/640)
    grass = mix(grass, grass.mean(axis=(0,1)), .43) + (broad*14)[...,None]
    earth = material(panel(ground,1,1), px, py, 167, 9, SIZE/640)
    earth = mix(earth, earth.mean(axis=(0,1)), .23)
    outer = edge-np.maximum(abs(x),abs(y))
    if name == 'showroom':
        # Larger flagstones and quieter joints leave the booth illustration readable at 1x.
        stone = material(panel(ground,0,1), px, py, 142, density=SIZE/640)
        stone = mix(stone, np.array([178.,163.,140.]), .70)
        # A lighter limestone aisle branches towards the two actual booth fronts.
        lane = np.clip((.56-route)*5, 0, 1)
        paving = mix(stone, stone*np.array([1.075,1.035,.98]), lane)
        curb = (abs(route-.61)<.075) | (abs(outer-.78)<.105)
        paving[curb] = paving[curb]*[.94,.91,.88]
        # A small flush inlay at the junction, with grout still visible through it.
        diamond = abs(x)+abs(y)
        paving[abs(diamond-.72)<.075] *= [.93,.90,.86]
        floor = mix(grass, paving, np.clip((outer-.54+noise*.10)*18,0,1))
    else:
        worn = route
        if name == 'camp':
            angle = np.arctan2(y,x)
            worn = np.minimum(worn, np.hypot(x,y) - (3.44+.31*np.cos(3*angle)+.24*np.sin(5*angle)))
            for item in world['scenery']:
                if item['type'] != 'bench':
                    continue
                # Two pairs of feet and the approach to each bench wear a wider pocket.
                dx, dy = x-item['x']*.85, y-item['y']*.85
                along = dx*np.cos(item['angle']) + dy*np.sin(item['angle'])
                across = dy*np.cos(item['angle']) - dx*np.sin(item['angle'])
                worn = np.minimum(worn, np.hypot(along, across*.76)-1.03)
            for item in world['scenery']:
                if item['type']=='tree':
                    roots = np.hypot(x-item['x'], y-item['y'])
                    grass = mix(grass, grass*[.84,.81,.77], (1.55-roots)*.7)
            earth = mix(earth, np.array([150.,112.,79.]), .16)
        else:
            for item in world['trampolines'] + world['portals']:
                worn = np.minimum(worn, np.hypot(x-item['x'],y-item['y'])-1.05)
            earth = mix(earth, grass, .38)
        wear = np.clip(.5-(worn+noise+fine*.46)*2.4, 0, 1)
        wear = np.round(wear*5)/5
        floor = mix(grass, earth, wear)
    # A broken turf lip is broadest along the two viewer-facing banks.
    bank = outer + noise*1.05
    front = (x>abs(y)) | (y>abs(x))
    soil = np.where(front[...,None], [100.,77.,53.], [87.,95.,62.])
    pockets = np.clip(broad*2.2+.22,0,1)
    fringe = grass*.46 + np.array([110.,132.,76.] if name=='camp' else [153.,168.,103.])*.54
    floor = mix(floor, fringe, np.clip((1.25-bank+2*broad)*.80,0,1))
    floor = mix(floor, soil, np.clip((.30-bank)*7,0,1)*pockets)
    image = rgb(floor)
    if name!='showroom':
        scatter_leaves(image, (wear<.88) & ((abs(worn)<1.1) | (outer<2.3)), 440, rng, name=='playground')
    if name=='camp':
        forest_floor_details(image, world, worn, rng)
        camp_hedgerow(image, world['bounds'], np.random.default_rng(4811))
    alpha = Image.fromarray(np.uint8(bank>.10)*255)
    image.putalpha(alpha)
    return image


def panorama(name, art, rng):
    """World-anchored meadow with a distant skyline and groves outside the walkable area."""
    width, height = PAN_WIDTH, PAN_HEIGHT
    y, x = np.indices((height,width))
    distant = panel(art['field'],1,1).resize((width,91), Image.Resampling.BOX)
    night = name=='camp'
    if night:
        distant = ImageOps.colorize(ImageOps.grayscale(distant),'#253d45','#777690')
    else:
        distant = Image.blend(distant, Image.new('RGB',distant.size,'#efd9b7'), .32)
    grass = material(panel(art['ground'],int(not night),0), x, y, 59, 7)
    tint = np.array([29.,39.,30.] if night else [150.,166.,101.])
    grass = mix(grass*(.30 if night else .91), tint, .60)
    grass += (variation(rng,(width,height),20)*(6 if night else 13))[...,None]
    # Nearby grass gradually takes over from two misty wooded foothills.
    hills = [97+4*np.sin(x/44)+6*np.cos(x/87), 115+7*np.cos(x/76)-5*np.sin(x/38)]
    for ridge, haze in zip(reversed(hills), ([53,66,61],[66,78,79]) if night else ([137,159,128],[153,171,148])):
        grass = mix(grass, np.asarray(haze,dtype=float), np.clip((ridge-y)*.12,0,1)*.92)
    image = rgb(grass)
    # The horizon meets the near meadow along a rolling far bank.
    skyline = 81 + 5*np.sin(x/57)+3*np.cos(x/30)
    sky = Image.new('RGB',image.size)
    sky.paste(distant)
    image.paste(sky, mask=Image.fromarray(np.uint8(y<skyline)*255))
    tree_boxes = [(59,67,380,379),(485,56,760,382),(902,59,1155,382)]
    trees = [art['scenery'].crop(box).convert('RGBA') for box in tree_boxes]
    image = image.resize((width*PAN_SCALE,height*PAN_SCALE), Image.Resampling.BICUBIC)
    pen = ImageDraw.Draw(image)
    if night:
        for _ in range(42):
            u,v = int(rng.integers(width)),int(rng.integers(4,38))
            pen.point((u*PAN_SCALE,v*PAN_SCALE),fill='#aaa5a4')
    stems = []
    for u in range(-14,width+20,5):
        stems.append((u+rng.integers(-3,4), 94+4*np.sin(u/44)+6*np.cos(u/87)+rng.integers(-2,4), int(rng.integers(8,15)), True))
    # Separate groves and small open glades, especially alongside the playable clearing.
    for cx,cy in [(40,115),(142,123),(248,101),(363,91),(472,114),(580,132),
                  (55,204),(574,215),(144,277),(486,290),(254,345),(395,365)]:
        for _ in range(12 if night else 8):
            u, v = cx+rng.normal(0,19), cy+rng.normal(0,9)
            wx = (u-PAN_ORIGIN[0])*PAN_SCALE/80 + (v-PAN_ORIGIN[1])*PAN_SCALE/40
            wy = (v-PAN_ORIGIN[1])*PAN_SCALE/40 - (u-PAN_ORIGIN[0])*PAN_SCALE/80
            if max(abs(wx),abs(wy)) > 12.7:
                stems.append((u,v,int(rng.integers(19,38)),False))
    for u,v,h,far in sorted(stems,key=lambda t:t[1]):
        u,v,h = round(u*PAN_SCALE),round(v*PAN_SCALE),h*PAN_SCALE
        sprite = trees[int(rng.integers(3))]
        thumb = sprite.resize((round(sprite.width*h/sprite.height),h), Image.Resampling.LANCZOS)
        if not far and 0<=u<image.width and 0<=v<image.height:
            shade = tuple(int(c*.90) for c in image.getpixel((int(u),int(v))))
            pen.ellipse((u-h*.29,v-h*.05,u+h*.44,v+h*.07),fill=shade)
        value = ImageOps.grayscale(thumb)
        shades = (('#33464e','#69727a') if far else ('#182824','#3b4a40')) if night else (
            ('#758f89','#b1ba9a') if far else ('#536a59','#9da67a'))
        colored = ImageOps.colorize(value,*shades)
        image.paste(colored,(u-thumb.width//2,v-h),thumb.getchannel('A'))
    return image


def build_landscapes(root, art):
    query = """import {getMap} from './web/lib/camp-maps.mjs';
        console.log(JSON.stringify(['camp','playground','showroom'].map(getMap)));"""
    maps = json.loads(subprocess.check_output(['node','--input-type=module','-e',query],cwd=root))
    for index, world in enumerate(maps):
        name = world['id']
        rng = np.random.default_rng(3921+index)
        floor = floor_image(name,world,art['ground'],rng)
        yield 'landscape-'+name, floor
        horizon = panorama(name,art,rng)
        yield 'horizon-'+name, horizon
        # Grade the large backdrop offline to avoid two full-size temporary canvases on mobile.
        gain,bias = (.72,1) if name=='camp' else (.30,7)
        yield 'horizon-'+name+'-dark', horizon.convert('L',(.30,.58,.12,0)).point(lambda t: round(t*gain+bias))

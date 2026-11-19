"""Pack the illustrated camper release. Run with Python and Pillow from any directory."""
from hashlib import sha256
from io import BytesIO
import json
import math
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'art/sprites/camper-style-release'
PUBLIC = ROOT / 'web/public/sprites'
files, frames = {}, {}
sources = json.loads((SOURCE/'sources.json').read_text())['originals']
art = {}
for name, receipt in sources.items():
    raw = (SOURCE/name).read_bytes()
    if sha256(raw).hexdigest() != receipt['sha256']:
        raise ValueError(f'Original differs from recorded art: {name}')
    art[Path(name).stem] = Image.open(BytesIO(raw)).convert('RGBA')


def crop(sheet, box, size):
    tile = art[sheet].crop(box).resize(size, Image.Resampling.LANCZOS)
    tile.putalpha(tile.getchannel('A').point(lambda v: 255 if v >= 120 else 0))
    return tile


def save(key, image):
    buf = BytesIO()
    image.save(buf, format='PNG', optimize=True)
    raw = buf.getvalue()
    digest = sha256(raw).hexdigest()
    name = f'camper-style-{key}.{digest[:12]}.png'
    (PUBLIC/name).write_bytes(raw)
    files[key] = dict(url='/sprites/'+name, width=image.width, height=image.height,
                      bytes=len(raw), sha256=digest, sampling='nearest')


def surfaces(key, color, relief=True):
    mask = color.getchannel('A')
    layer = color.convert('RGB').quantize(colors=150, dither=Image.Dither.NONE).convert('RGBA')
    layer.putalpha(mask)
    save(key, layer)
    mono = ImageOps.grayscale(layer).quantize(colors=48).convert('RGBA')
    mono.putalpha(mask)
    save(key+'-dark', mono)
    if relief:
        luma = ImageOps.grayscale(layer).load()
        normal = Image.new('RGBA', layer.size)
        pixels = normal.load()
        alpha = mask.load()
        for y in range(layer.height):
            for x in range(layer.width):
                if not alpha[x,y]:
                    continue
                center = luma[x,y]
                def sample(dx,dy):
                    u,v = x+dx,y+dy
                    return luma[u,v] if 0<=u<layer.width and 0<=v<layer.height and alpha[u,v] else center
                du = (sample(-1,0)-sample(1,0))//3
                dv = (sample(0,1)-sample(0,-1))//3
                pixels[x,y] = (128+max(-42,min(42,du)),151+max(-42,min(42,dv)),244,255)
        save('normal-'+key, normal)


# A booth's screen tracks the exhibition-cover aspect while timber and awning keep their proportions.
def booth():
    image = art['scenery'].crop((47,877,396,1183))
    result = Image.new('RGBA',(118,96))
    xs,ys = [0,58,278,349],[0,152,226,306]
    dx,dy = [0,16,102,118],[0,33,73,96]
    for j in range(3):
        for i in range(3):
            part = image.crop((xs[i],ys[j],xs[i+1],ys[j+1]))
            result.paste(part.resize((dx[i+1]-dx[i],dy[j+1]-dy[j]),Image.Resampling.LANCZOS),(dx[i],dy[j]))
    result.putalpha(result.getchannel('A').point(lambda v: 255 if v>=120 else 0))
    return result


props = [
    ('scenery','tree',(59,67,380,379),(100,97),(.50,.97)),
    ('scenery','tree-birch',(485,56,760,382),(87,103),(.49,.97)),
    ('scenery','tree-pine',(902,59,1155,382),(85,108),(.50,.97)),
    ('scenery','tent',(64,479,380,778),(118,110),(.51,.96)),
    ('scenery','shade',(458,462,796,778),(112,104),(.48,.96)),
    ('scenery','trampoline',(895,548,1175,752),(85,62),(.50,.91)),
    ('scenery','gameBooth',(47,877,396,1183),(118,96),(.50,.97)),
    ('scenery','crate',(486,911,765,1165),(48,44),(.50,.95)),
    ('scenery','fence',(896,916,1165,1176),(61,59),(.50,.77)),
    ('details','lantern',(111,67,344,386),(34,47),(.19,.96)),
    ('details','radio',(502,108,746,383),(49,56),(.50,.96)),
    ('details','sign',(888,63,1172,386),(58,66),(.50,.96)),
    ('details','portal',(43,447,426,817),(83,81),(.50,.96)),
    ('details','firewood',(476,546,783,759),(79,54),(.50,.88)),
    ('details','football',(934,543,1138,745),(22,22),(.50,.95)),
    ('details','flowers',(73,940,370,1157),(30,22),(.50,.94)),
    ('details','rock',(458,934,788,1152),(28,19),(.50,.94))
]
scenery = Image.new('RGBA',(6*122,3*114))
for i,(sheet,name,box,size,foot) in enumerate(props):
    tile = booth() if name=='gameBooth' else crop(sheet,box,size)
    if name=='fence':
        tile = ImageOps.mirror(tile)
    x,y = i%6*122+2,i//6*114+2
    scenery.paste(tile,(x,y))
    w,h = size
    frames[name] = dict(sheet='camp-scenery',x=x,y=y,w=w,h=h,sampling='nearest',
                        contacts={'ground':{'x':round(w*foot[0]),'y':round(h*foot[1])}})
frames['gameBooth']['poster'] = dict(x=16/118,y=33/96,w=86/118,h=40/96)
surfaces('camp-scenery',scenery)

# Plank surfaces line up with the two pre-existing seat contacts in each direction.
benches = Image.new('RGBA',(352,312))
for i,box in enumerate([(90,112,352,344),(492,118,765,353)]):
    tile = crop('bits',box,(110,67))
    benches.paste(tile,(i*110,0))
    weathered = ImageEnhance.Color(tile).enhance(.62)
    benches.paste(weathered,(i*110,68))
# The fallback terrain painter still uses clearing stamps before the landscape atlas loads.
old = Image.open(PUBLIC/'camp-clearing-art.8ce94e115d06.png').convert('RGBA')
benches.paste(old.crop((0,136,352,312)),(0,136))
benches.paste(old.crop((224,0,266,10)),(224,0))
surfaces('camp-clearing-art',benches)

# Each fire style retains a distinct outline and flicker even in grayscale.
effects = Image.new('RGBA',(6*54,7*56))
centers = [256,768,1280]
styles = [
    ('amber',None,42,48), ('gold',('#673a2d','#ffe58b'),48,38),
    ('blue',('#294153','#bae7fa'),35,49), ('jade',('#28594b','#f3f6a2'),45,43),
    ('violet',('#49345b','#f5cbe1'),37,47)
]
for row,(name,ramp,w,h) in enumerate(styles):
    seq = []
    for index in range(6):
        col,band = index%3,index//3
        cx = centers[col]
        baseline = [470,977][band]
        tile = crop('fire',(cx-174,baseline-390,cx+174,baseline+1),(w,h))
        if ramp:
            colored = ImageOps.colorize(ImageOps.grayscale(tile),*ramp).convert('RGBA')
            colored.putalpha(tile.getchannel('A')); tile = colored
        x,y = index*54+(54-w)//2,row*56+52-h
        effects.paste(tile,(x,y))
        seq.append(dict(sheet='effects',x=index*54,y=row*56,w=54,h=54,
                        sampling='nearest',contacts={'ground':{'x':27,'y':52}}))
    frames[name] = dict(seq[0],animation=dict(frames=seq,durations=[111]*6,loop=True))
bits = [('gun',(896,119,1165,332),(33,26)),('snowball',(109,536,326,751),(23,23)),
        ('bomb',(517,526,706,772),(26,34)),('impact',(884,498,1171,767),(45,42)),
        ('dust',(100,944,337,1106),(38,26)),('heart',(523,950,729,1122),(23,19)),
        ('spark',(936,937,1121,1126),(18,18))]
for i,(name,box,(w,h)) in enumerate(bits):
    x,y = i%6*54+2,(5+i//6)*56+2
    effects.paste(crop('bits',box,(w,h)),(x,y))
    frames[name]=dict(sheet='effects',x=x,y=y,w=w,h=h,sampling='nearest',
                      contacts={'ground':{'x':w/2,'y':h}})
surfaces('effects',effects,False)

# Use the world route definitions directly so the trails still lead to the portals.
route_query = """
import {getMap} from './web/lib/camp-maps.mjs';
console.log(JSON.stringify(Object.fromEntries(['camp','playground','showroom'].map(id=>{
  const {bounds,routes}=getMap(id); return [id,{edge:bounds.edge,routes}];
}))));
"""
maps = json.loads(subprocess.check_output(['node','--input-type=module','-e',route_query],cwd=ROOT))
size = 512
def panel(sheet, col, row):
    image = art[sheet].convert('RGB')
    side = image.width//2
    return image.crop((side*col+2, side*row+2, side*(col+1)-2, side*(row+1)-2))


def tiled(source, span):
    tile = source.resize((span,span),Image.Resampling.LANCZOS)
    canvas = Image.new('RGB',(size,size))
    # Alternating the corresponding edges keeps the swatch boundaries continuous.
    for j,y in enumerate(range(0,size,span)):
        for i,x in enumerate(range(0,size,span)):
            part = ImageOps.mirror(tile) if i%2 else tile
            canvas.paste(ImageOps.flip(part) if j%2 else part,(x,y))
    return canvas


def blend_patch(floor, detail, center, diameter):
    tile = detail.resize((diameter,diameter),Image.Resampling.LANCZOS)
    mask = Image.new('L',tile.size)
    pen = ImageDraw.Draw(mask)
    inset = diameter//9
    pen.ellipse((inset,inset,diameter-inset,diameter-inset),fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(max(1,diameter/15)))
    x,y = center
    floor.paste(tile,(x-diameter//2,y-diameter//2),mask)


sky = panel('field',1,1).resize((size,160),Image.Resampling.LANCZOS)
earth = tiled(panel('ground',1,1),107)
for name,(u,v) in {'camp':(0,0),'playground':(1,0),'showroom':(0,1)}.items():
    motif = panel('field',u,v)
    floor = tiled(panel('ground',u,v),119 if name=='showroom' else 107)
    if name=='showroom':
        # The medallion is a local feature between booths, with paving to its edges.
        blend_patch(floor,motif,(256,253),207)
    else:
        wear = Image.new('L',(size,size))
        pen = ImageDraw.Draw(wear)
        if name=='camp':
            pen.ellipse((143,156,376,365),fill=237)
        world = maps[name]
        factor = size/(2*world['edge'])
        for route in world['routes']:
            points = [(round(size/2+x*factor),round(size/2+y*factor)) for x,y in route['points']]
            width = max(2,round(route['width']/40*factor))
            for radius,opacity in [(width,138),(max(2,width//2),180)]:
                pen.line(points,fill=opacity if name=='camp' else opacity//2,width=radius,joint='curve')
        floor.paste(earth,(0,0),wear.filter(ImageFilter.GaussianBlur(5)))
        # Small authored clumps break repetition at the edge without crowding avatars.
        plants = [(0,0,188,185),(432,364,619,559),(33,318,223,508)] if name=='camp' else [
            (405,0,570,154),(0,200,161,365),(197,467,366,620)]
        for i in range(25):
            side,irow = i%4,i//4
            along = (irow*83+41+side*39)%size
            inset = round(21+33*(1+math.sin(i*2.7))*.5)
            positions = [(along,inset),(size-inset,along),(along,size-inset),(inset,along)]
            blend_patch(floor,motif.crop(plants[i%3]),positions[side],26+(7*i)%18)
    if name=='camp':
        horizon = ImageOps.colorize(ImageOps.grayscale(sky),'#172637','#575369')
    else:
        horizon = Image.blend(sky,Image.new('RGB',sky.size,'#d7cabe'),.50 if name=='showroom' else .46)
    floor = ImageEnhance.Color(floor).enhance(.78)
    atlas = Image.new('RGB',(size,size+horizon.height))
    atlas.paste(floor,(0,0)); atlas.paste(horizon,(0,size))
    save('landscape-'+name,atlas.quantize(colors=112,dither=Image.Dither.NONE))

icon = Image.new('RGBA',(64,64))
icon.paste(crop('details',(915,903,1149,1181),(45,53)),(9,5))
save('camp-icon',icon)
module = '// Generated by tools/build-camper-style.py.\n'
for key,value in [('STYLE_FILES',files),('STYLE_FRAMES',frames)]:
    module += f'export const {key} = '+json.dumps(value,separators=(',',':'),indent=2)+';\n'
(ROOT/'web/lib/camp-style-files.mjs').write_text(module)

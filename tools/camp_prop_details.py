"""Native-size joinery and material details for the illustrated camp props."""
import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageOps


def bench_point(direction,u,v,drop=0):
    sign = 1 if direction=='nw' else -1
    return round(55+sign*(u-v)), round(25+(u+v)/2+drop)


BENCH_LEGS = [(-31,-5),(-31,5),(31,-5),(31,5)]
BENCH_RISE = 23
BENCH_SIZE = (110,68)


def bench_profile(direction):
    half,height = BENCH_SIZE[0]//2,BENCH_SIZE[1]
    mid = half if direction=='ne' else 0
    return dict(frameSize=BENCH_SIZE,feet=[[*bench_point(direction,u,v,BENCH_RISE),4] for u,v in BENCH_LEGS],
                origin=bench_point(direction,0,0,BENCH_RISE),seat=bench_point(direction,0,0),
                rise=BENCH_RISE,deck=[bench_point(direction,u,v) for u,v in [(-40,-9),(40,-9),(40,9),(-40,9)]],
                back=[[mid,0,half,height]],front=[[half-mid,0,half,height]])


def bench_tile(source, direction, weathered):
    # Sample the original timber in each view. Both seats share a 2:1 ground plane.
    colors = np.asarray(source)
    timber = colors[colors[:,:,3] == 255,:3]
    timber = timber[np.argsort(timber @ [0.30, 0.58, 0.12])]

    def wood(level):
        center = round(level*(len(timber)-1))
        rgb = timber[max(0,center-16):center+17].mean(axis=0)
        if weathered:
            gray = rgb @ [.30,.58,.12]
            rgb = rgb*.63 + gray*.37 + [4,5,4]
        return tuple(np.uint8(rgb))

    sign = 1 if direction == 'nw' else -1
    tile = Image.new('RGBA',BENCH_SIZE)
    pen = ImageDraw.Draw(tile)
    # Reproject the original seat grain into the slimmer plan. Sample inside the
    # old bevel so its heavy painted rim is not baked into the new top surface.
    py,px = np.indices((tile.height,tile.width))
    along = np.clip((sign*(px-55)+2*(py-25))/2,-37,37)
    across = np.clip((2*(py-25)-sign*(px-55))/2,-7,7)
    sample_x = np.rint(55+sign*(along-1.25*across)).astype(int)
    sample_y = np.rint((24 if sign==1 else 22)+along*.42+across*.50).astype(int).clip(0,source.height-1)
    grain = colors[sample_y,sample_x,:3].astype(float)
    if weathered:
        grain = grain*.63+(grain @ [.30,.58,.12])[...,None]*.37+[4,5,4]

    def point(u,v,drop):
        return bench_point(direction,u,v,drop)

    def face(vertices, shade):
        pen.polygon([point(*p) for p in vertices],fill=wood(shade))

    def stroke(vertices, shade):
        pen.line([point(*p) for p in vertices],fill=wood(shade),width=1)

    # Four tapered feet. Light follows screen-left in both independently drawn views.
    for u,v in BENCH_LEGS:
        corners = [(-3,-2),(3,-2),(3,2),(-3,2)]
        top = [(u+x,v+y,3) for x,y in corners]
        foot = [(u+x*.72,v+y*.82,BENCH_RISE) for x,y in corners]
        for a,b,shade in [(3,2,.43 if sign==1 else .23),(2,1,.24 if sign==1 else .43)]:
            face([top[a],top[b],foot[b],foot[a]],shade)
        stroke([(u,v+2,7),(u,v+2,18)],.48 if sign==1 else .33)
        stroke([(u+2,v+1,4),(u+2,v+1,9)],.22)
        stroke([foot[3],foot[2],foot[1]],.09)
    # A short apron behind the legs leaves an open gap above the ground.
    face([(-33,5,3),(33,5,3),(33,5,8),(-33,5,8)],.25)
    stroke([(-30,5,7),(29,5,7)],.32)
    for u in (-31,31):
        face([(u,-7,3),(u,7,3),(u,7,7),(u,-7,7)],.31)

    # Build a stepped end and a three-pixel exposed edge on each board.
    for v0,v1,level in [(-9,0,.71),(1,9,.77)]:
        face([(-40,v1,0),(40,v1,0),(40,v1,3),(-40,v1,3)],.42 if sign==1 else .34)
        face([(40,v0,0),(40,v1,0),(40,v1,3),(40,v0,3)],.33 if sign==1 else .44)
        stroke([(-39,v1,3),(40,v1,3),(40,v0,3)],.16)
        outline=[(-39,v0),(39,v0),(40,v0+1),(40,v1-1),(39,v1),(-39,v1),(-40,v1-1),(-40,v0+1)]
        mask = Image.new('L',tile.size)
        ImageDraw.Draw(mask).polygon([point(u,v,0) for u,v in outline],fill=255)
        # The plane catching the fire is warmer and lighter than the shoe-height apron.
        plank = np.uint8(np.clip(grain*.39 + np.array(wood(level))*.61 + [12,10,4],0,255))
        tile.paste(Image.fromarray(plank),mask=mask)
        stroke([(-38,v1,0),(36,v1,0)],.83)
        stroke([(-38,v0,0),(38,v0,0)],.42 if v0==1 else .63)
    # Broken grain and inset peg heads read as single-pixel marks beside a camper's boots.
    for u,v,length in [(-33,-6,13),(-11,-4,7),(8,-6,13),(-26,4,12),(3,6,7),(22,3,8)]:
        stroke([(u,v,0),(u+length,v,0)],.64)
    for u in (-31,31):
        for v in (-5,5):
            pen.point(point(u,v,0),fill=wood(.37))
    if weathered:
        for u,v in [(-25,-8),(-16,8),(14,-1),(27,8)]:
            stroke([(u,v,0),(u+4,v,0)],.87)
    return tile


def taper_posts(tile, centers, start, full):
    """Pin each shaft to its contact while narrowing it below the joint."""
    width,height = tile.size
    x = np.arange(width)
    rgba = np.asarray(tile)
    result = rgba.copy()
    for y in range(start+1,height):
        amount = min(1,(y-start)/(full-start))
        source_x = x.astype(float)
        for axis,radius,reach,trim in centers:
            center = np.interp(y,*zip(*axis)) if isinstance(axis,tuple) else axis
            stop = radius-trim*amount
            distance = x-center
            source_x += np.sign(distance)*(np.interp(abs(distance),[0,stop,reach],[0,radius,reach])-np.minimum(abs(distance),reach))
        source_x = np.rint(source_x).astype(int)
        result[y] = rgba[y,source_x.clip(0,width-1)]
        result[y,(source_x<0)|(source_x>=width)] = 0
    return Image.fromarray(result)


def fence_rails(tile):
    # Thin along the rail normal, preserving both post caps and both foot positions.
    rgba = np.asarray(tile)
    result = rgba.copy()
    y = np.arange(tile.height)
    for x in range(14,77):
        blend = min(1,(x-14)/8,(77-x)/8)
        centers = (48.5-.35*x,71-.35*x)
        source_y = y.astype(float)
        for center in centers:
            distance = y-center
            half = 8.5-3.5*blend
            source_y += np.sign(distance)*(np.interp(abs(distance),[0,half,11.25],[0,8.5,11.25])-np.minimum(abs(distance),11.25))
        result[:,x] = rgba[np.rint(source_y).astype(int).clip(0,tile.height-1),x]
    return Image.fromarray(result)


def scenery_profile(name):
    if name in ('fence-corner','fence-run'):
        corner = name=='fence-corner'
        line = [(5,84),(45,64),(85,84)] if corner else [(5,84),(85,44)]
        return dict(origin=[45,64],groundLine=line,railHeights=[30,13],
                    feet=[[x,y,4] for x,y in (line if corner else line[:1])])
    if name=='shade':
        return dict(feet=[[7,85,3.5],[71,69,3],[103,90,3.5],[47,103,4.5]],origin=[54,85],
                    rise=62,deck=[[2,26],[58,2],[110,26],[49,52]],
                    rearPost=[[56,52,32,52]],leftPost=[[0,52,40,52]],rightPost=[[88,52,24,52]],
                    front=[[0,0,112,52],[40,52,16,52]],
                    postLayers=[['rearPost',1],['leftPost',0],['rightPost',2],['front',3]])


def joined_fence(tile, profile):
    """Reproject the source post and its timber rails on the map's 2:1 axes."""
    source = ImageOps.mirror(tile)
    outline = Image.new('L',source.size)
    ImageDraw.Draw(outline).polygon([(12,20),(21,24),(23,29),(22,78),(20,83),
                                     (15,86),(7,85),(0,81),(1,28),(5,23)],fill=255)
    post = source.copy()
    post.putalpha(ImageChops.darker(outline,source.getchannel('A')))
    post = post.crop((0,20,24,87)).resize((11,45),Image.Resampling.LANCZOS)
    post.putalpha(post.getchannel('A').point(lambda a: 255 if a>=120 else 0))
    result = Image.new('RGBA',(90,87))
    points = profile['groundLine']
    corner = len(points)==3
    for (x1,y1),(x2,y2) in zip(points,points[1:]):
        # A run ends at the edge of the adjoining post. The corner owns both junctions.
        for x in range(x1,x2+1 if corner else x2-3):
            t = (x-x1)/(x2-x1)
            sx = round(25+38*t)
            base = round(y1+(y2-y1)*t)
            for rise,source_mid in zip(profile['railHeights'],[48.5,71]):
                for dy in range(-3,4):
                    sy = round(source_mid-.35*sx+dy*2.2)
                    result.putpixel((x,base-rise+dy),source.getpixel((sx,sy)))
    for x,y,_ in profile['feet']:
        result.alpha_composite(post,(x-5,y-44))
    return result


# Centers, shaft half-widths, influence radii and reductions in release-frame pixels.
POSTS = {
    'tent': ([(((52,65),(145,9)),8,17,3),
              (((52,65),(159,120),(176,123)),9,20,3.5)],60,85),
    'shade': ([(11,8,17,2.5),(65,10,22,3.5),(99,7,13,2),(143,8,15,2.5)],57,86),
    'gameBooth': ([(14,6,10,2),(166,6,10,2)],42,58),
    'trampoline': ([(8,6,13,1.5),(48,7,15,2),(87,6,12,1.5)],43,55),
    'portal': ([(18,13,30,2.5),(97,13,29,2.5)],35,57),
    'sign': ([(40,8,17,2)],59,70),
    'fence': ([(12,11,21,3.5),(77,10,20,3)],0,9),
}


def refine_material(tile, name):
    if name=='fence':
        tile = fence_rails(tile)
    if name in POSTS:
        tile = taper_posts(tile,*POSTS[name])

    # Keep one-pixel line centres. Recede the shoulders of painted seams toward the
    # surrounding material, without lifting broad dark openings, leaves or cast shadows.
    strengths = {'tent':.57,'tree':.44,'tree-pine':.40,'tree-birch':.38,'gameBooth':.53,
                 'shade':.44,'sign':.48,'fence':.45,'portal':.51,'crate':.58,'firewood':.42,
                 'radio':.34,'trampoline':.32}
    if name not in strengths:
        return tile
    alpha = tile.getchannel('A')
    rgb = tile.convert('RGB')
    color = np.asarray(rgb,dtype=float)
    lum = np.asarray(rgb.convert('L'),dtype=float)
    # Pixels beside darker ink may be raised; the darkest pixel in a joint remains.
    low = np.asarray(rgb.convert('L').filter(ImageFilter.MinFilter(3)),dtype=float)
    nearby = np.asarray(rgb.filter(ImageFilter.MedianFilter(5)),dtype=float)
    inner = np.asarray(alpha.filter(ImageFilter.MinFilter(5)))==255
    weight = np.clip((lum-low)/18,0,1)*inner*strengths[name]
    refined = Image.fromarray(np.uint8(color+np.maximum(nearby-color,0)*weight[...,None]))
    refined.putalpha(alpha)
    return refined


def camp_material_colors(tile, name):
    """Reserve the brightest creams for faces, lamp glass and exhibit covers."""
    color = np.asarray(tile.convert('RGB'),dtype=float)
    light = color @ [.30,.58,.12]
    red, green, blue = color.transpose(2,0,1)
    # Timber adopts the warm brown of camper boots. Muted grain and a soft
    # shoulder on the brightest planks keep awning trim from reading as neon.
    wood = np.clip((red-green-5)/30,0,1)*np.clip((green-blue)/18,0,1)
    highlight = np.clip((light-104)/96,0,1)
    amount = .24 if name.startswith(('shade','fence','gameBooth')) else .14
    toned = color + wood[...,None]*((light[...,None]-color)*amount
            + [1,4,4] - highlight[...,None]*[35,29,22])
    # Give the broad canvas folds a shared teal and keep their coloured seams.
    if name in ('shade','tent','gameBooth','trampoline'):
        cloth = np.clip((green-red+4)/23,0,1)*np.clip((blue-red+6)/24,0,1)
        teal = light[...,None]*[.64,1.10,1.03]+[3,1,0]
        toned += (teal-toned)*cloth[...,None]*.40
        cream = np.clip((light-155)/65,0,1)
        toned -= cream[...,None]*[24,25,23]
    if name.startswith('tree'):
        foliage = np.clip((green-red+2)/25,0,1)
        toned += foliage[...,None]*((light[...,None]-toned)*.14+[3,0,1])
    if name=='lantern':
        toned = np.where((light>145)[...,None],color,toned)
    result=Image.fromarray(np.uint8(np.clip(toned,0,255)))
    result.putalpha(tile.getchannel('A'))
    return result

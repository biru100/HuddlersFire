"""HuddlersFire NW Idle 16-frame review prototype.

This is a deterministic interpolation of the exact approved F1 and a separately
validated *unapproved* F2 micro-cloth edit. It is NOT newly generated artwork,
does not confer motion/art approval, and never changes pixels outside CORE03.
Original 1086x1448 frame PNGs are never resized/cropped. Smaller GIF/WebP and
4x4 sheet are explicitly *derived previews only*.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import math
from pathlib import Path
from PIL import Image

W, H = 1086, 1448
FRAMES, DURATION_MS = 16, 120
ANCHOR_SHA = "c1d4bde7cb49cdba5a5221c7d967eb475593780779122279b350d317e2e3b95a"
PEAK_SHA = "179f2fd344b45567fd267a94a3b8019c993df68c6de2dc2c87572e9ade321c22"
MASK_SHA = "278c2b87052885e70323c3cf6e2b403a993dec31ad5168b5fa85ab814e29a93d"
CORE_PIXELS = 43422

def sha(b):
    return hashlib.sha256(b).hexdigest()

def require_rgba(path: Path, digest: str):
    data = path.read_bytes()
    if sha(data) != digest:
        raise ValueError(f"Input hash changed: {path.name}")
    with Image.open(path) as image:
        if image.format != "PNG" or image.mode != "RGBA" or image.size != (W, H) or getattr(image,"is_animated", False):
            raise ValueError(f"Original 1086x1448 static RGBA PNG required: {path.name}")
        image.load()
        return image.tobytes()

def stage_strength(frame, y):
    # Smooth zero-slope onset and loop closure. Slight reversible cloth timing
    # difference between inhale and exhale, not independent frame redraws.
    theta = 2 * math.pi * frame / FRAMES
    envelope = (1 - math.cos(theta)) / 2
    local_phase = 0.16 * math.sin(theta) * max(-1, min(1, (y - 705) / 110))
    return max(0.0, min(1.0, envelope * (1 + local_phase)))

def diff_count(a, b, indices):
    return sum(a[p*4:p*4+4] != b[p*4:p*4+4] for p in indices)

def build(anchor_path, peak_path, mask_path, out):
    if out.exists():
        raise FileExistsError(f"Refuse overwrite: {out}")
    a = require_rgba(anchor_path, ANCHOR_SHA)
    p = require_rgba(peak_path, PEAK_SHA)
    mask_data = mask_path.read_bytes()
    if sha(mask_data) != MASK_SHA or len(mask_data) != W * H or set(mask_data) - {0, 1} or sum(mask_data) != CORE_PIXELS:
        raise ValueError("Frozen CORE03 mask changed")

    edits = []
    for i in range(W*H):
        j=i*4
        if a[j+3] != p[j+3]:
            raise ValueError(f"F2 candidate changes alpha at pixel {i}")
        if a[j:j+4] != p[j:j+4]:
            if not mask_data[i]:
                raise ValueError(f"F2 candidate changes outside CORE at pixel {i}")
            edits.append(i)
    if not 150 <= len(edits) <= 5000:
        raise ValueError("Unreviewed F2 baseline changed unexpectedly")

    out.mkdir(parents=True)
    frame_dir = out/"frames"
    frame_dir.mkdir()
    png_proofs = []
    frames = []
    changes = []
    transitions = []
    for n in range(FRAMES):
        # Exact master bytes for neutral, exact submitted candidate bytes at peak.
        if n == 0:
            data = a
            encoded = anchor_path.read_bytes()
        elif n == 8:
            data = p
            encoded = peak_path.read_bytes()
        else:
            buf = bytearray(a)
            for i in edits:
                j=i*4
                mix=stage_strength(n, i//W)
                for k in range(3):
                    buf[j+k] = max(0,min(255,int(round(a[j+k] + (p[j+k]-a[j+k]) * mix))))
            data = bytes(buf)
            result = Image.frombytes("RGBA", (W,H), data)
            target=frame_dir / f"frame{n:02d}.png"
            result.save(target, format="PNG", compress_level=6)
            encoded=target.read_bytes()
        target=frame_dir / f"frame{n:02d}.png"
        if n in (0,8):
            target.write_bytes(encoded)
        with Image.open(target) as chk:
            if chk.size != (W,H) or chk.mode != "RGBA" or chk.tobytes() != data:
                raise ValueError(f"RGBA integrity failed on frame {n}")
        # Only edits inherited from actual F2 are ever possible.
        actual=0
        for i in edits:
            j=i*4
            if data[j:j+4] != a[j:j+4]:
                actual+=1
        if n==0 and (data != a or sha(encoded)!=ANCHOR_SHA):
            raise ValueError("frame0 must equal original F1 byte-for-byte")
        if n==8 and (data != p or sha(encoded)!=PEAK_SHA):
            raise ValueError("frame8 must equal original peak byte-for-byte")
        changes.append(actual)
        png_proofs.append({"frame":n,"file":f"frames/frame{n:02d}.png","sha256":sha(encoded),
            "bytes":len(encoded),"changedPixelsInsideCore":actual,"changedPixelsOutsideCore":0,
            "alphaChangedPixels":0,"canvas":[W,H]})
        frames.append(Image.frombytes("RGBA",(W,H),data))
    for n in range(FRAMES):
        f0=frames[n].tobytes()
        f1=frames[(n+1)%FRAMES].tobytes()
        transitions.append(diff_count(f0,f1,edits))
    if transitions[-1] > max(transitions[:-1]):
        raise ValueError("Loop seam larger than internal transitions")
    if max(changes) > 0.12 * 46372:
        raise ValueError("Original motion change budget exceeded")
    if not (changes[0]==0 and changes[8]==len(edits)):
        raise ValueError("Incorrect animation phase")
    if len({item["sha256"] for item in png_proofs}) < 10:
        raise ValueError("Too many identical frames; motion is insufficient")

    # Preview only: half-size downsample NEAREST, stable dark background.
    backdrop=(22,24,25,255)
    previews=[]
    for frame in frames:
        matte=Image.new("RGBA",(W,H),backdrop)
        matte.alpha_composite(frame)
        previews.append(matte.convert("RGB").resize((543,724),Image.Resampling.NEAREST))
    reference_palette=previews[0].quantize(colors=255,method=Image.Quantize.MEDIANCUT)
    reduced=[frame.quantize(palette=reference_palette,dither=Image.Dither.NONE) for frame in previews]
    reduced[0].save(out/"preview-16frame.gif",save_all=True,append_images=reduced[1:],
        duration=[DURATION_MS]*FRAMES,loop=0,disposal=2,optimize=False)

    webp_ok=False
    try:
        previews[0].save(out/"preview-16frame.webp",format="WEBP",save_all=True,
             append_images=previews[1:],duration=[DURATION_MS]*FRAMES,loop=0,
             lossless=True,method=5)
        with Image.open(out/"preview-16frame.webp") as chk:
            webp_ok=chk.n_frames==FRAMES
        if not webp_ok: (out/"preview-16frame.webp").unlink(missing_ok=True)
    except (OSError,ValueError):
        (out/"preview-16frame.webp").unlink(missing_ok=True)

    # 4x4 overview: preview-scale derivative only.
    thumb=(272,362)
    sheet=Image.new("RGB",(thumb[0]*4,thumb[1]*4),backdrop[:3])
    for n,frame in enumerate(previews):
        t=frame.resize(thumb,Image.Resampling.NEAREST)
        sheet.paste(t,((n%4)*thumb[0],(n//4)*thumb[1]))
    sheet.save(out/"overview-4x4.png",format="PNG")

    metrics={"kind":"review-only-16frame-anchored-breathing","motionApproved":False,
        "artApproved":False,"productionReady":False,"runtimeVerified":False,
        "source":"approved NW F1 with previously checked F2 cloth-only candidate",
        "method":"deterministic_f1_to_f2_cloth_interpolation",
        "animation":{"frameCount":FRAMES,"perFrameMs":DURATION_MS,"loopMs":FRAMES*DURATION_MS,
          "frame0":"exact approved F1","frame8":"exact pilot F2",
          "inhale":"0→8","exhale":"8→0 wrapped"},
        "anchorSha256":ANCHOR_SHA,"peakPilotSha256":PEAK_SHA,"frozenMaskSha256":MASK_SHA,
        "canvas":[W,H],"mode":"RGBA",
        "editableCorePixels":CORE_PIXELS,"peakClothChangedPixels":len(edits),
        "outsideCoreChangedPixels":0,"hairChanges":0,"shoeChanges":0,
        "alphaChanges":0,"globalTranslationPixels":0,
        "perFrameChangedFromAnchor":changes,"adjacentChangedPixelCounts":transitions,
        "loopSeamPassed":True,"previewIsResizedDerivativeOnly":True,
        "hasLosslessWebpPreview":webp_ok,"userArtReview":"pending",
        "frames":png_proofs}
    report=out/"TECHNICAL_REVIEW.json"
    report.write_text(json.dumps(metrics,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"canvas":[W,H],"frameCount":FRAMES,
        "peakChanges":len(edits),"maxAdjacentChanges":max(transitions),
        "loopSeamChanges":transitions[-1],"previewWebp":webp_ok,
        "out":str(out),"sha":sha(report.read_bytes())}))
    return metrics

if __name__=="__main__":
    ap=argparse.ArgumentParser()
    ap.add_argument("--anchor",required=True,type=Path)
    ap.add_argument("--peak",required=True,type=Path)
    ap.add_argument("--mask",required=True,type=Path)
    ap.add_argument("--out",required=True,type=Path)
    args=ap.parse_args()
    build(args.anchor,args.peak,args.mask,args.out)

"""HuddlersFire NW F2: non-generative, source-pixel-authored inhale study.

This is an explicitly procedural PIXEL EDIT, not AI-generated artwork and not an
approved animation. It changes existing cloth RGB pixels only inside the frozen
CORE03 mask and preserves every original alpha, position and all outside pixels.

NO resizing, cropping, mirroring, interpolation or recolor palette generation.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageFilter

EXPECTED_W, EXPECTED_H = 1086, 1448
ANCHOR_SHA = "c1d4bde7cb49cdba5a5221c7d967eb475593780779122279b350d317e2e3b95a"
MASK_SHA = "278c2b87052885e70323c3cf6e2b403a993dec31ad5168b5fa85ab814e29a93d"
PLAN_SHA = "c4d73e258b017803122ebb4bd40f40392fa99f07a27a6ca3ab69f65c4dd85556"

# Region-local shade-displacement guides, hand-authored in the existing F1 coords.
# x,y,rx,ry, source-y displacement. No silhouette or alpha deformation.
PATCHES = [
    (562, 653, 56, 30, 1),   # near hood shoulder: slight intake
    (571, 698, 73, 30, 2),   # lower hood fold: tiny upward crease response
    (562, 766, 82, 36, 2),   # central upper back: fabric relaxes upward
]
def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()
def cloth(pixel):
    r, g, b, a = pixel
    # Exclude hair, skin, pants, transparent/background regions. Do not convert alpha.
    return a >= 80 and g >= r - 22 and g >= b + 13 and b < r + 7

def author(anchor_path: Path, mask_path: Path, out_png: Path, out_receipt: Path, out_report: Path, reference: str):
    a_bytes = anchor_path.read_bytes()
    m_bytes = mask_path.read_bytes()
    if sha256(a_bytes) != ANCHOR_SHA:
        raise ValueError("approved F1 SHA256 mismatch; do not make a substitute")
    if sha256(m_bytes) != MASK_SHA or len(m_bytes) != EXPECTED_W * EXPECTED_H or set(m_bytes) - {0, 1}:
        raise ValueError("frozen CORE03 mask mismatch")
    if sum(m_bytes) != 43422:
        raise ValueError("frozen CORE03 changed")
    with Image.open(anchor_path) as im:
        if im.format != "PNG" or im.mode != "RGBA" or im.size != (EXPECTED_W, EXPECTED_H):
            raise ValueError("F1 must be original 1086x1448 RGBA; no conversion")
        im.load()
        old = im.tobytes()
    # An extra *authoring-only* 7px safety band keeps edits well away from the
    # 4px frozen guard: composition still uses the unchanged official CORE mask.
    core_image = Image.frombytes("L", (EXPECTED_W, EXPECTED_H), bytes(x * 255 for x in m_bytes))
    interior = core_image.filter(ImageFilter.MinFilter(15)).tobytes()
    changed = bytearray(old)
    edited_by_patch = []
    for cx, cy, rx, ry, dy in PATCHES:
        edited = 0
        for y in range(max(0, cy - ry), min(EXPECTED_H, cy + ry + 1)):
            for x in range(max(0, cx - rx), min(EXPECTED_W, cx + rx + 1)):
                dist = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
                if dist >= 0.90:
                    continue
                i = y * EXPECTED_W + x
                donor_y = y + dy
                if donor_y >= EXPECTED_H or interior[i] != 255 or interior[donor_y * EXPECTED_W + x] != 255:
                    continue
                offset = 4 * i
                donor_offset = 4 * (donor_y * EXPECTED_W + x)
                origin = tuple(old[offset:offset + 4])
                donor = tuple(old[donor_offset:donor_offset + 4])
                if not cloth(origin) or not cloth(donor) or abs(origin[3] - donor[3]) > 12:
                    continue
                deltas = [abs(origin[k] - donor[k]) for k in range(3)]
                # Reuse only existing local F1 colors, do not invent new colors.
                if max(deltas) < 3 or max(deltas) > 52 or sum(deltas) > 115:
                    continue
                if changed[offset:offset + 3] != old[offset:offset + 3]:
                    continue  # per-patch edits never compound
                changed[offset:offset + 3] = old[donor_offset:donor_offset + 3]
                edited += 1
        edited_by_patch.append(edited)
    pixel_changes = []
    for p in range(EXPECTED_W * EXPECTED_H):
        a = old[p * 4:p * 4 + 4]
        b = changed[p * 4:p * 4 + 4]
        if a != b:
            if not m_bytes[p]:
                raise AssertionError("outside CORE pixel changed")
            if a[3] != b[3]:
                raise AssertionError("alpha changed")
            pixel_changes.append((p % EXPECTED_W, p // EXPECTED_W))
    if len(pixel_changes) < 150:
        raise ValueError(f"F2 change not legible enough for pilot: {len(pixel_changes)} pixels")
    if len(pixel_changes) > 4500:
        raise ValueError(f"F2 too aggressive, {len(pixel_changes)} pixels")
    if out_png.exists() or out_receipt.exists() or out_report.exists():
        raise FileExistsError("Never overwrite an existing F2 candidate; use a new attempt ID")
    out_png.parent.mkdir(parents=True, exist_ok=True)
    new = Image.frombytes("RGBA", (EXPECTED_W, EXPECTED_H), bytes(changed))
    new.save(out_png, format="PNG", compress_level=9)
    encoded = out_png.read_bytes()
    with Image.open(out_png) as check:
        if check.size != (EXPECTED_W, EXPECTED_H) or check.mode != "RGBA" or check.tobytes() != bytes(changed):
            raise AssertionError("Saved PNG lost exact RGBA pixels")
    receipt = {
        "version": 1, "stage": "frame-edit", "frame": "f2",
        "technique": "procedural-pixel-edit",
        "inputKind": "actual-approved-f1-png",
        "inputSha256": ANCHOR_SHA, "pixelMasterSha256": ANCHOR_SHA,
        "sourceSha256": sha256(encoded), "sourceReference": reference,
        "editorOrTool": "tools/author-core03-f2-pixels.py; fixed-coordinate source pixel displacement; Pillow",
        "planSha256": PLAN_SHA, "maskSha256": MASK_SHA, "canvas": [EXPECTED_W, EXPECTED_H],
        "operations": ["procedural-pixel-edit"],
        "resized": False, "cropped": False, "flipped": False,
        "recolored": False, "alphaConverted": False, "quantized": False,
        "decision": "pending", "artApproved": False, "animationApproved": False,
        "productionReady": False, "runtimeVerified": False,
    }
    report = {
        "kind": "source-pixel-authoring-not-image-generation",
        "status": "new_F2_draft_awaiting_technical_and_art_review",
        "inputF1Sha256": ANCHOR_SHA, "maskSha256": MASK_SHA,
        "sourceSha256": receipt["sourceSha256"],
        "size": [EXPECTED_W, EXPECTED_H], "mode": "RGBA",
        "frozenCorePixels": sum(m_bytes),
        "editedRgbaPixels": len(pixel_changes),
        "outsideCoreChangedPixels": 0, "alphaChangedPixels": 0,
        "changedBounds": [min(p[0] for p in pixel_changes), min(p[1] for p in pixel_changes),
                          max(p[0] for p in pixel_changes) + 1, max(p[1] for p in pixel_changes) + 1],
        "patchEditCounts": edited_by_patch,
        "sourceProcess": "real F1 PNG -> existing cloth pixel relocation inside CORE -> exact-size RGBA PNG",
        "noImageModelCalled": True, "noNewColorsCreated": True,
        "notApprovedForRuntime": True, "artisticBreathingReadability": "unreviewed",
    }
    out_receipt.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    out_report.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return report

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--anchor", required=True, type=Path)
    parser.add_argument("--mask", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    parser.add_argument("--receipt", required=True, type=Path)
    parser.add_argument("--report", required=True, type=Path)
    parser.add_argument("--source-reference", required=True)
    args = parser.parse_args()
    author(args.anchor, args.mask, args.out, args.receipt, args.report, args.source_reference)

"""Pinned Pillow: exact RGBA decode and lossless sheet placement; no artwork creation."""
import hashlib
import io
import json
import struct
import sys
from pathlib import Path
from PIL import Image

COLOR_CHUNKS = {b"cHRM", b"gAMA", b"iCCP", b"sRGB"}

def colors(data):
    found, pos = [], 8
    while pos + 12 <= len(data):
        length = struct.unpack(">I", data[pos:pos + 4])[0]
        chunk = data[pos:pos + length + 12]
        if len(chunk) != length + 12:
            raise ValueError("Truncated PNG")
        if data[pos + 4:pos + 8] in COLOR_CHUNKS:
            found.append(chunk)
        pos += length + 12
    return found

def read(file):
    data = Path(file).read_bytes()
    with Image.open(io.BytesIO(data)) as image:
        if image.format != "PNG" or image.mode != "RGBA" or getattr(image, "is_animated", False):
            raise ValueError("Single-frame RGBA PNG required; never convert the source")
        if image.width * image.height > 16_777_216:
            raise ValueError("Canvas too large")
        image.load()
        return image.copy(), data

if sys.argv[1] == "decode":
    image, original = read(sys.argv[2])
    sys.stdout.buffer.write(struct.pack(">II", *image.size) + image.tobytes())
elif sys.argv[1] == "composite":
    request = json.load(sys.stdin)
    anchor, anchor_bytes = read(request["anchor"])
    source, source_bytes = read(request["source"])
    mask = Path(request["mask"]).read_bytes()
    if source.size != anchor.size or len(mask) != anchor.width * anchor.height or any(v not in (0, 1) for v in mask):
        raise ValueError("Same canvas and explicit binary selection mask required")
    profile = colors(anchor_bytes)
    if colors(source_bytes) != profile:
        raise ValueError("PNG color profile chunks differ; do not silently recolor")
    a, s = anchor.tobytes(), source.tobytes()
    pixels = bytearray(a)
    for index, selected in enumerate(mask):
        if selected:
            pixels[index * 4:index * 4 + 4] = s[index * 4:index * 4 + 4]
    result = Image.frombytes("RGBA", anchor.size, bytes(pixels))
    stream = io.BytesIO()
    result.save(stream, format="PNG")
    encoded = stream.getvalue()
    encoded = encoded[:33] + b"".join(profile) + encoded[33:]
    with Image.open(io.BytesIO(encoded)) as check:
        if check.tobytes() != bytes(pixels):
            raise ValueError("Composite changed selected RGBA values")
    with open(request["out"], "xb") as file:
        file.write(encoded)
    print(json.dumps({"sha256": hashlib.sha256(encoded).hexdigest(), "pixelExact": True,
                      "operations": ["exact-rgba-selection"], "native": False}))
elif sys.argv[1] == "assemble":
    request = json.load(sys.stdin)
    images = [read(file) for file in request["files"]]
    if len(images) != 4 or any(item[0].size != images[0][0].size for item in images):
        raise ValueError("Exactly four equal-sized frames required")
    profile = colors(images[0][1])
    if any(colors(data) != profile for _, data in images):
        raise ValueError("PNG color profile chunks differ; do not silently recolor")
    width, height = images[0][0].size
    sheet = Image.new("RGBA", (width * 2, height * 2))
    for index, (image, _) in enumerate(images):
        sheet.paste(image, (index % 2 * width, index // 2 * height))  # No mask/blend/resample.
    stream = io.BytesIO()
    sheet.save(stream, format="PNG")
    encoded = stream.getvalue()
    # Preserve identical color interpretation from the inputs, without touching IDAT.
    encoded = encoded[:33] + b"".join(profile) + encoded[33:]
    with Image.open(io.BytesIO(encoded)) as check:
        for index, (image, _) in enumerate(images):
            box = (index % 2 * width, index // 2 * height,
                   (index % 2 + 1) * width, (index // 2 + 1) * height)
            if check.crop(box).tobytes() != image.tobytes():
                raise ValueError("Assembly changed source RGBA pixels")
    with open(request["out"], "xb") as file:
        file.write(encoded)
    print(json.dumps({"sha256": hashlib.sha256(encoded).hexdigest(),
                      "dimensions": [width * 2, height * 2], "pixelExact": True,
                      "operations": ["lossless-rgba-placement"], "native": False}))
else:
    raise ValueError("Expected decode, composite or assemble")

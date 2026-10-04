#!/usr/bin/env python3
"""Generate Tauri bundle icons in pure Python (no PIL/ImageMagick).
Draws an indigo rounded-square with a white ascending-bar 'sales' glyph.
Writes PNGs at each size, a PNG-compressed .ico, and an .icns container.
"""
import struct, zlib, os

OUT = os.path.join("desktop", "src-tauri", "icons")
os.makedirs(OUT, exist_ok=True)

BG = (99, 102, 241, 255)      # indigo #6366F1
FG = (255, 255, 255, 255)     # white

def draw(size):
    """Return list of rows, each row = bytearray of RGBA*size."""
    px = [[(0, 0, 0, 0) for _ in range(size)] for _ in range(size)]
    r = size * 0.22
    # glyph geometry (3 ascending bars), in normalized coords
    bars = [(0.24, 0.52), (0.42, 0.38), (0.60, 0.24)]  # (cx, top_y) fractions
    bw = size * 0.11
    base_y = size * 0.74
    for y in range(size):
        for x in range(size):
            # rounded-square mask
            cx, cy = x + 0.5, y + 0.5
            inside = True
            # corner distance check
            if cx < r and cy < r:
                inside = (cx - r) ** 2 + (cy - r) ** 2 <= r * r
            elif cx > size - r and cy < r:
                inside = (cx - (size - r)) ** 2 + (cy - r) ** 2 <= r * r
            elif cx < r and cy > size - r:
                inside = (cx - r) ** 2 + (cy - (size - r)) ** 2 <= r * r
            elif cx > size - r and cy > size - r:
                inside = (cx - (size - r)) ** 2 + (cy - (size - r)) ** 2 <= r * r
            if not inside:
                continue
            col = BG
            # bars glyph
            for (bx, topf) in bars:
                left = bx * size - bw / 2
                right = bx * size + bw / 2
                top = topf * size
                if left <= cx <= right and top <= cy <= base_y:
                    col = FG
                    break
            px[y][x] = col
    raw = bytearray()
    for y in range(size):
        raw.append(0)  # filter type 0
        for x in range(size):
            raw += bytes(px[y][x])
    return raw, size

def write_png(path, size):
    raw, sz = draw(size)
    def chunk(typ, data):
        return struct.pack(">I", len(data)) + typ + data + struct.pack(">I", zlib.crc32(typ + data) & 0xFFFFFFFF)
    ihdr = struct.pack(">IIBBBBB", sz, sz, 8, 6, 0, 0, 0)  # 8-bit RGBA
    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", ihdr)
    png += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    png += chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)
    return png

def png_bytes(size):
    return write_png_to_bytes(size)

def write_png_to_bytes(size):
    import io
    raw, sz = draw(size)
    def chunk(typ, data):
        return struct.pack(">I", len(data)) + typ + data + struct.pack(">I", zlib.crc32(typ + data) & 0xFFFFFFFF)
    ihdr = struct.pack(">IIBBBBB", sz, sz, 8, 6, 0, 0, 0)
    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", ihdr)
    png += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    png += chunk(b"IEND", b"")
    return png

# --- individual PNGs referenced by tauri.conf.json ---
write_png(os.path.join(OUT, "32x32.png"), 32)
write_png(os.path.join(OUT, "128x128.png"), 128)
write_png(os.path.join(OUT, "128x128@2x.png"), 256)
write_png(os.path.join(OUT, "icon.png"), 512)          # base icon (commonly expected)
print("PNGs written")

# --- icon.ico (PNG-compressed frames; Vista+) ---
frames = [16, 24, 32, 48, 64, 128, 256]
imgs = [(s, write_png_to_bytes(s)) for s in frames]
ico = struct.pack("<HHH", 0, 1, len(imgs))  # reserved, type=1 (icon), count
offset = 6 + 16 * len(imgs)
for s, data in imgs:
    w = 0 if s >= 256 else s
    h = 0 if s >= 256 else s
    ico += struct.pack("<BBBBHHII", w, h, 0, 0, 1, 32, len(data), offset)
    offset += len(data)
for s, data in imgs:
    ico += data
with open(os.path.join(OUT, "icon.ico"), "wb") as f:
    f.write(ico)
print("icon.ico written", len(ico), "bytes")

# --- icon.icns (Apple container with PNG entries) ---
# types: ic07=128, ic08=256, ic09=512, ic10=1024, ic11=32, ic12=64, ic13=256, ic14=512
entries = []
for typ, s in [(b"ic11", 32), (b"ic12", 64), (b"ic07", 128), (b"ic08", 256), (b"ic09", 512), (b"ic10", 1024)]:
    data = write_png_to_bytes(s)
    entries.append(typ + struct.pack(">I", len(data) + 8) + data)
body = b"".join(entries)
icns = b"icns" + struct.pack(">I", len(body) + 8) + body
with open(os.path.join(OUT, "icon.icns"), "wb") as f:
    f.write(icns)
print("icon.icns written", len(icns), "bytes")
print("DONE. files:", sorted(os.listdir(OUT)))

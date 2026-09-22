#!/usr/bin/env python3
"""
Generate responsive image variants for BLANKED KYOTO.

For each source photo in assets/img/photos/ (top-level only), produce:
  <name>-600.webp, <name>-1200.webp, <name>-1800.webp   (quality 80)
  <name>-1200.jpg                                        (fallback, quality 82)

Also builds PNG icons from the SVG favicon:
  assets/img/icons/apple-touch-icon.png (180x180)
  assets/img/icons/icon-192.png, icon-512.png

Original files are left untouched. Re-run safely: existing outputs are overwritten.
"""
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PHOTOS = ROOT / "assets" / "img" / "photos"
ICONS = ROOT / "assets" / "img" / "icons"
FAVICON_SVG = ROOT / "assets" / "img" / "apple-touch-icon.png"  # actually SVG content (bg included)

WIDTHS = (600, 1200, 1800)
WEBP_Q = 80
JPG_Q = 82

GENERATED = re.compile(r"-(600|1200|1800)\.(webp|jpg)$")


def slug_for(name: str) -> str:
    """Shiori.png -> shiori, Sacoche_up.png -> sacoche-up, teoristyle.JPG -> teoristyle"""
    stem = Path(name).stem.lower().replace("_", "-")
    return re.sub(r"[^a-z0-9-]", "", stem)


def discover_sources() -> dict[str, str]:
    out: dict[str, str] = {}
    for f in sorted(PHOTOS.iterdir()):
        if not f.is_file() or f.suffix.lower() not in (".jpg", ".jpeg", ".png"):
            continue
        if GENERATED.search(f.name):
            continue
        out[f.name] = slug_for(f.name)
    return out


def flatten(im: Image.Image) -> Image.Image:
    """Drop alpha onto the site background colour so JPG/WebP look consistent."""
    if im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info):
        bg = Image.new("RGB", im.size, (250, 248, 244))
        bg.paste(im.convert("RGBA"), mask=im.convert("RGBA").split()[-1])
        return bg
    return im.convert("RGB")


def resize_to_width(im: Image.Image, width: int) -> Image.Image:
    if im.width <= width:
        return im.copy()
    h = round(im.height * width / im.width)
    return im.resize((width, h), Image.LANCZOS)


def process_photo(src: Path, slug: str) -> list[tuple[str, int, int, int]]:
    out: list[tuple[str, int, int, int]] = []
    with Image.open(src) as raw:
        im = flatten(raw)
        for w in WIDTHS:
            v = resize_to_width(im, w)
            dst = PHOTOS / f"{slug}-{w}.webp"
            v.save(dst, "WEBP", quality=WEBP_Q, method=6)
            out.append((dst.name, v.width, v.height, dst.stat().st_size))
        v = resize_to_width(im, 1200)
        dst = PHOTOS / f"{slug}-1200.jpg"
        v.save(dst, "JPEG", quality=JPG_Q, optimize=True, progressive=True)
        out.append((dst.name, v.width, v.height, dst.stat().st_size))
    return out


def build_icons() -> None:
    ICONS.mkdir(parents=True, exist_ok=True)
    svg_text = FAVICON_SVG.read_text(encoding="utf-8")
    tmp_svg = ICONS / "_icon_src.svg"
    tmp_svg.write_text(svg_text, encoding="utf-8")
    for size, name in ((180, "apple-touch-icon.png"), (192, "icon-192.png"), (512, "icon-512.png")):
        subprocess.run(
            ["rsvg-convert", "-w", str(size), "-h", str(size), "-o", str(ICONS / name), str(tmp_svg)],
            check=True,
        )
    tmp_svg.unlink()
    # 32x32 favicon.ico at site root
    with Image.open(ICONS / "icon-192.png") as im:
        im.convert("RGBA").resize((32, 32), Image.LANCZOS).save(ROOT / "favicon.ico", format="ICO", sizes=[(32, 32)])


def main() -> int:
    total = 0
    for fname, slug in discover_sources().items():
        src = PHOTOS / fname
        if not src.exists():
            print(f"skip (missing): {fname}", file=sys.stderr)
            continue
        for name, w, h, size in process_photo(src, slug):
            total += size
            print(f"{name:34s} {w:5d}x{h:<5d} {size/1024:7.1f} KB")
    print(f"--- generated total: {total/1024/1024:.2f} MB")
    build_icons()
    for p in sorted(ICONS.glob("*.png")):
        with Image.open(p) as im:
            print(f"{p.relative_to(ROOT)} {im.size} {p.stat().st_size} B")
    print(f"favicon.ico {(ROOT / 'favicon.ico').stat().st_size} B")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

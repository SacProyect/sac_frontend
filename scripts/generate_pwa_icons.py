#!/usr/bin/env python3
"""Generate PWA / install icons for SAC (Android + iOS)."""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
ICONS = PUBLIC / "icons"
SOURCE_CANDIDATES = [
    Path("/home/gabdev/.cursor/projects/home-gabdev-Escritorio-SAC/assets/sac-app-icon-master.png"),
    Path("/home/gabdev/.cursor/projects/home-gabdev-Escritorio-SAC/assets/Gemini_Generated_Image_yx39pyyx39pyyx39-4080f838-d207-4963-adf6-02aaeab2676b.png"),
]

# Standard PWA + legacy sizes
SIZES = [48, 72, 96, 128, 144, 152, 167, 180, 192, 256, 384, 512]
MASKABLE_SIZES = [192, 512]
MASTER_SIZE = 1024
BG = (8, 12, 24, 255)  # deep navy/charcoal matching the brand icon


def load_source() -> Image.Image:
    for path in SOURCE_CANDIDATES:
        if path.exists():
            img = Image.open(path).convert("RGBA")
            print(f"source={path}")
            return img
    raise FileNotFoundError("No source icon found")


def autocrop_content(img: Image.Image, pad_ratio: float = 0.04) -> Image.Image:
    """Trim empty outer margin while keeping a small brand padding."""
    alpha = img.split()[-1]
    bbox = alpha.getbbox()
    if not bbox:
        return img
    # Also consider near-black background margins by converting to luminance mask
    gray = img.convert("L")
    # pixels brighter than very dark = content
    mask = gray.point(lambda p: 255 if p > 18 else 0)
    content = mask.getbbox() or bbox
    left, top, right, bottom = content
    w, h = right - left, bottom - top
    pad = int(max(w, h) * pad_ratio)
    left = max(0, left - pad)
    top = max(0, top - pad)
    right = min(img.width, right + pad)
    bottom = min(img.height, bottom + pad)
    return img.crop((left, top, right, bottom))


def fit_square(img: Image.Image, size: int, bg: tuple[int, int, int, int] = BG) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), bg)
    # cover fit keeping aspect
    scale = max(size / img.width, size / img.height)
    nw, nh = int(img.width * scale), int(img.height * scale)
    resized = img.resize((nw, nh), Image.Resampling.LANCZOS)
    x = (size - nw) // 2
    y = (size - nh) // 2
    canvas.alpha_composite(resized, (x, y))
    return canvas


def make_maskable(img: Image.Image, size: int) -> Image.Image:
    """Android maskable: keep logo in safe ~80% center zone."""
    canvas = Image.new("RGBA", (size, size), BG)
    safe = int(size * 0.72)
    logo = fit_square(img, safe, BG)
    offset = (size - safe) // 2
    canvas.alpha_composite(logo, (offset, offset))
    return canvas


def rounded_preview(img: Image.Image, size: int = 512, radius_ratio: float = 0.22) -> Image.Image:
    """Optional squircle-ish preview for docs (not required for install)."""
    base = fit_square(img, size)
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    r = int(size * radius_ratio)
    draw.rounded_rectangle((0, 0, size, size), radius=r, fill=255)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(base, (0, 0), mask)
    return out


def write_ico(src: Image.Image, dest: Path) -> None:
    icons = [fit_square(src, s).convert("RGBA") for s in (16, 32, 48)]
    icons[0].save(dest, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])


def main() -> None:
    ICONS.mkdir(parents=True, exist_ok=True)
    raw = load_source()
    cropped = autocrop_content(raw)
    master = fit_square(cropped, MASTER_SIZE)
    master_path = ICONS / "sac-icon-1024.png"
    master.save(master_path, optimize=True)
    print(f"wrote {master_path}")

    for size in SIZES:
        out = fit_square(cropped, size)
        path = ICONS / f"icon-{size}.png"
        out.save(path, optimize=True)
        print(f"wrote {path.name}")

    for size in MASKABLE_SIZES:
        out = make_maskable(cropped, size)
        path = ICONS / f"maskable-{size}.png"
        out.save(path, optimize=True)
        print(f"wrote {path.name}")

    # Convenience aliases expected by many browsers / docs
    fit_square(cropped, 180).save(PUBLIC / "apple-touch-icon.png", optimize=True)
    fit_square(cropped, 192).save(PUBLIC / "pwa-192.png", optimize=True)
    fit_square(cropped, 512).save(PUBLIC / "pwa-512.png", optimize=True)
    make_maskable(cropped, 512).save(PUBLIC / "pwa-maskable-512.png", optimize=True)
    write_ico(cropped, PUBLIC / "favicon.ico")
    fit_square(cropped, 32).save(PUBLIC / "favicon-32x32.png", optimize=True)
    fit_square(cropped, 16).save(PUBLIC / "favicon-16x16.png", optimize=True)
    rounded_preview(cropped, 512).save(ICONS / "preview-squircle-512.png", optimize=True)
    print("done")


if __name__ == "__main__":
    main()

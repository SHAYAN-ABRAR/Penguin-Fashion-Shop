"""Prepare a product photo for the Penguin Fashion catalog.

Takes a cut-out garment on a transparent background, trims it to the garment, and places it at a
consistent scale on a 4:5 transparent canvas, so every piece lines up in cards, the product view,
the bag and the Winter Edit. Writes three WebP sizes to assets/img/products/:

    <slug>-720.webp   product view and large compositions
    <slug>-400.webp   collection cards
    <slug>-200.webp   bag, saved pieces and search thumbnails

Usage (needs Python 3 and Pillow: pip install Pillow):
    python3 tools/prepare_product_image.py path/to/cutout.png marigold-pea-coat

Then add the product to assets/js/catalog.js with image: "<slug>".
"""
import sys
from pathlib import Path

from PIL import Image

CANVAS_W, CANVAS_H = 720, 900       # 4:5
MAX_HEIGHT, MAX_WIDTH = 0.86, 0.94  # share of the canvas the garment may fill
SIZES = (720, 400, 200)
OUT = Path(__file__).resolve().parent.parent / "assets" / "img" / "products"


def prepare(source: Path, slug: str) -> None:
    image = Image.open(source).convert("RGBA")
    mask = image.split()[-1].point(lambda a: 255 if a > 8 else 0)
    box = mask.getbbox()
    if not box:
        sys.exit(f"{source} has no visible pixels. It needs a transparent background around the garment.")
    garment = image.crop(box)
    scale = min(MAX_HEIGHT * CANVAS_H / garment.height, MAX_WIDTH * CANVAS_W / garment.width)
    size = (round(garment.width * scale), round(garment.height * scale))
    canvas = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
    canvas.alpha_composite(garment.resize(size, Image.LANCZOS), ((CANVAS_W - size[0]) // 2, (CANVAS_H - size[1]) // 2))
    OUT.mkdir(parents=True, exist_ok=True)
    for width in SIZES:
        version = canvas if width == CANVAS_W else canvas.resize((width, width * 5 // 4), Image.LANCZOS)
        target = OUT / f"{slug}-{width}.webp"
        version.save(target, "WEBP", quality=86, method=6, alpha_quality=90)
        print(f"wrote {target.relative_to(OUT.parent.parent.parent)}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    prepare(Path(sys.argv[1]), sys.argv[2])

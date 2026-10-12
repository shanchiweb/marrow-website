"""Extract placed image assets from the supplied Marrow Illustrator PDF.

Usage: python scripts/extract-design.py /absolute/path/to/design.pdf
"""

from pathlib import Path
import sys

import pypdf.filters
from pypdf import PdfReader
from PIL import Image

pypdf.filters.MAX_DECLARED_STREAM_LENGTH = 200_000_000
pypdf.filters.ZLIB_MAX_OUTPUT_LENGTH = 500_000_000

source = Path(sys.argv[1])
destination = Path(__file__).resolve().parent.parent / "public" / "design"
destination.mkdir(parents=True, exist_ok=True)
pages = PdfReader(str(source)).pages

images = [
    (0, "/Im2", "home-03.jpg", (2510, 1673)),
    (0, "/Im3", "heart.png", (700, 950)),
    (0, "/Im6", "collection-1-left.jpg", (1000, 1400)),
    (0, "/Im1", "collection-1-right.jpg", (1000, 1400)),
    (0, "/Im5", "collection-2-left.jpg", (1100, 1500)),
    (0, "/Im7", "collection-2-middle.jpg", (1100, 1500)),
    (0, "/Im0", "collection-2-right.jpg", (1100, 1500)),
    (0, "/Im10", "flower.png", (700, 700)),
    (0, "/Im4", "collection-3-left.jpg", (1100, 1600)),
    (0, "/Im11", "collection-3-middle.jpg", (1100, 1600)),
    (0, "/Im9", "collection-3-right.jpg", (900, 1300)),
    (0, "/Im8", "bow.png", (900, 600)),
    (2, "/Im0", "stockists.jpg", (1100, 1600)),
]

for page_index, name, filename, maximum in images:
    image = pages[page_index].images[name].image
    image.thumbnail(maximum)
    path = destination / filename
    if path.suffix == ".jpg":
        image.convert("RGB").save(path, quality=88, optimize=True)
    else:
        image.save(path, optimize=True)
    print(f"{path.name}: {image.width}x{image.height}")

# These are the exact visible frame crops in the flattened reference page.
# Several source photos are aggressively masked in Illustrator, so exporting
# their full image object would not reproduce the editorial composition.
flat_page = source.parent / "0001" / f"{source.stem}-01.jpg"
if flat_page.exists():
    page = Image.open(flat_page)
    scale = page.width / 1920
    frames = [
        ("frame-1-left.jpg", (100, 1800, 665, 2553)),
        ("frame-1-right.jpg", (675, 1800, 1242, 2553)),
        ("frame-2-left.jpg", (388, 3095, 666, 3853)),
        ("frame-2-middle.jpg", (675, 3095, 957, 3853)),
        ("frame-2-right.jpg", (966, 3095, 1820, 3853)),
        ("frame-3-left.jpg", (100, 4400, 666, 5160)),
        ("frame-3-middle.jpg", (677, 4645, 1243, 5413)),
        ("frame-3-right.jpg", (1542, 5070, 1820, 5352)),
    ]
    for filename, (x0, y0, x1, y1) in frames:
        crop = page.crop(tuple(round(v * scale) for v in (x0, y0, x1, y1)))
        crop.save(destination / filename, quality=90, optimize=True)
        print(f"{filename}: {crop.width}x{crop.height}")

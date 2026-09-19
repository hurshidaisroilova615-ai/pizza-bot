"""One consistent treatment for every catalogue picture.

The source frames come from different videos — different light, different
backgrounds, different colour casts — which is why the catalogue looks
assembled rather than shot. Every image goes through the same steps here, so
they read as one set: square, the food centred and sharp, the surroundings
pushed back and darkened slightly so the product is what the eye lands on.
"""
from PIL import Image, ImageOps, ImageEnhance, ImageFilter, ImageDraw, ImageChops
import os

SIDE = 800
UP = "/root/.claude/uploads/ebb7772f-1369-5b23-a869-601409cfceb4/"
OUT = "backend/prisma/catalogs/fedya-shaurma/"


def open_src(name):
    return Image.open(UP + name + "-image.png").convert("RGB")


def lift(img, thresh=62):
    """Separate a product from the flat background of a poster.

    A shop's own photographs are shot in the kitchen and fill the frame, but
    the ones taken off a printed menu come cut out on a flat colour, and that
    colour turns into a bright slab behind the price. Filling inwards from
    the border rather than testing every pixel means a bun the same shade as
    the paper is never punched out, because the fill cannot reach it.
    """
    w, h = img.size
    marker = (0, 255, 0)  # a colour no photograph of food contains
    work = img.copy()
    for seed in ((1, 1), (w - 2, 1), (w // 2, 1), (1, h - 2), (w - 2, h - 2),
                 (w // 2, h - 2), (1, h // 2), (w - 2, h // 2)):
        ImageDraw.floodfill(work, seed, marker, thresh=thresh)

    r, g, b = work.split()
    background = ImageChops.multiply(
        ImageChops.multiply(Image.eval(r, lambda v: 255 if v == 0 else 0),
                            Image.eval(g, lambda v: 255 if v == 255 else 0)),
        Image.eval(b, lambda v: 255 if v == 0 else 0),
    )
    # Pull the edge in by a pixel before softening it, so no rim of the old
    # background survives as a halo.
    mask = ImageChops.invert(background)
    mask = mask.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.5))
    cut = img.convert("RGBA")
    cut.putalpha(mask)
    return cut


def ground(canvas, cut, width_share=0.96):
    """Set a cut-out product on the dark ground, over its own shadow."""
    scale = SIDE * width_share / cut.width
    cut = cut.resize((int(cut.width * scale), int(cut.height * scale)), Image.LANCZOS)
    x = (SIDE - cut.width) // 2
    y = (SIDE - cut.height) // 2

    # Without a shadow the product reads as a sticker laid on the card.
    shadow = Image.new("L", (SIDE, SIDE), 0)
    ImageDraw.Draw(shadow).ellipse(
        (x + cut.width * 0.06, y + cut.height * 0.72,
         x + cut.width * 0.94, y + cut.height * 1.16),
        fill=120,
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(SIDE * 0.05))
    canvas.paste(Image.new("RGB", (SIDE, SIDE), (0, 0, 0)), (0, 0), shadow)

    canvas.paste(cut, (x, y), cut)
    return canvas


def backdrop(base=(26, 18, 14), edge=(9, 6, 5)):
    """A warm dark ground for a shot too wide to crop square.

    The catalogue cards lay white text over the foot of every picture, so a
    pale filler turns into a bright band under the price. Every other frame
    already falls away dark at its edges; this builds the same fall-off for
    the ones that have to be padded, so a padded shot sits in the grid
    without announcing itself.
    """
    canvas = Image.new("RGB", (SIDE, SIDE), edge)
    glow = Image.new("RGB", (SIDE, SIDE), base)
    mask = Image.new("L", (SIDE, SIDE), 0)
    ImageDraw.Draw(mask).ellipse(
        (SIDE * 0.06, SIDE * 0.02, SIDE * 0.94, SIDE * 0.98), fill=255
    )
    mask = mask.filter(ImageFilter.GaussianBlur(SIDE * 0.22))
    canvas.paste(glow, (0, 0), mask)
    return canvas


def square(img, pad=None):
    """A square frame. Wide shots are set on a ground rather than cut in half."""
    if pad is None:
        return ImageOps.fit(img, (SIDE, SIDE), Image.LANCZOS)
    if pad == "lift":
        big = img.resize((img.width * 2, img.height * 2), Image.LANCZOS)
        return ground(backdrop(), lift(big))
    scale = SIDE / max(img.size)
    img = img.resize((max(1, int(img.width * scale)), max(1, int(img.height * scale))), Image.LANCZOS)
    canvas = Image.new("RGB", (SIDE, SIDE), pad)
    canvas.paste(img, ((SIDE - img.width) // 2, (SIDE - img.height) // 2))
    return canvas


def enhance(img):
    """Even out the exposure differences between frames."""
    img = ImageOps.autocontrast(img, cutoff=1)
    img = ImageEnhance.Color(img).enhance(1.12)
    img = ImageEnhance.Contrast(img).enhance(1.05)
    return img.filter(ImageFilter.UnsharpMask(radius=2, percent=90, threshold=3))


def studio(img, pad=None):
    """Square, evened out, and focused on the middle."""
    if pad == "lift":
        # Autocontrast stretches to the brightest pixel in the frame, and on
        # a cut-out that is the paper it was printed on — it crushes the food
        # to white. A lifted product gets colour and edge only.
        img = ImageEnhance.Color(img).enhance(1.1)
        img = ImageEnhance.Contrast(img).enhance(1.06)
        img = img.filter(ImageFilter.UnsharpMask(radius=2, percent=80, threshold=3))
        return square(img, pad)
    if pad is not None:
        # Levelling has to happen before the ground is laid, or it shifts the
        # flat colour too and the padding stops matching the card.
        return square(enhance(img), pad)

    img = enhance(square(img))

    # The surroundings go soft and a shade darker so the dish reads as the
    # subject even when the frame was shot in a busy kitchen.
    blurred = img.filter(ImageFilter.GaussianBlur(4))
    mask = Image.new("L", (SIDE, SIDE), 0)
    d = ImageDraw.Draw(mask)
    d.ellipse((-SIDE * 0.10, -SIDE * 0.10, SIDE * 1.10, SIDE * 1.10), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(SIDE * 0.16))
    img = Image.composite(img, blurred, mask)

    shade = Image.new("L", (SIDE, SIDE), 255)
    d = ImageDraw.Draw(shade)
    d.ellipse((-SIDE * 0.02, -SIDE * 0.02, SIDE * 1.02, SIDE * 1.02), fill=205)
    shade = shade.filter(ImageFilter.GaussianBlur(SIDE * 0.20))
    return Image.composite(img, ImageEnhance.Brightness(img).enhance(0.88), shade)


def build(name, src, box, pad=None):
    studio(open_src(src).crop(box), pad).save(
        OUT + name, "JPEG", quality=90, optimize=True, subsampling=0
    )
    return name


SHOTS = [
    # the wrap cut open on the counter — filling and grill marks
    ("lavash.jpg",     "4177c153", (150, 300, 880, 1030)),
    # a pair topped with crisps, the spit behind
    ("pita.jpg",       "85325537", (85, 690, 700, 1305)),
    # the two long ones, cropped in away from the drinks fridge
    ("shaurma.jpg",    "bf0ec2c6", (195, 640, 735, 1180)),
    # the poster's hot dog, clear of its yellow band
    # A long shot: padded instead of cut, so the whole hot dog stays in frame.
    ("hot-dog.jpg",    "b0c96071", (70, 1675, 605, 1985), "lift"),
    # the shop's own prep trays and a close-up off the reel
    ("sous-oq.jpg",    "bf0ec2c6", (655, 1265, 950, 1560)),
    ("sous-chili.jpg", "bf0ec2c6", (85, 1235, 365, 1515)),
    ("xalapenyo.jpg",  "fb8fd436", (80, 950, 500, 1370)),
]

if __name__ == "__main__":
    for name, src, box, *rest in SHOTS:
        build(name, src, box, rest[0] if rest else None)
        print(f"  {name:14} {os.path.getsize(OUT+name)//1024} KB")

    sheet = Image.new("RGB", (len(SHOTS) * 210, 210), "white")
    for i, shot in enumerate(SHOTS):
        sheet.paste(Image.open(OUT + shot[0]).resize((200, 200)), (i * 210 + 5, 5))
    sheet.save("/tmp/claude-0/-home-user-pizza-bot/ebb7772f-1369-5b23-a869-601409cfceb4/scratchpad/crops/studio.png")

"""One consistent treatment for every catalogue picture.

The source frames come from different videos — different light, different
backgrounds, different colour casts — which is why the catalogue looks
assembled rather than shot. Every image goes through the same steps here, so
they read as one set: square, the food centred and sharp, the surroundings
pushed back and darkened slightly so the product is what the eye lands on.
"""
from PIL import Image, ImageOps, ImageEnhance, ImageFilter, ImageDraw
import os

SIDE = 800
UP = "/root/.claude/uploads/ebb7772f-1369-5b23-a869-601409cfceb4/"
OUT = "backend/prisma/catalogs/fedya-shaurma/"


def open_src(name):
    return Image.open(UP + name + "-image.png").convert("RGB")


def square(img, pad=None):
    """A square frame. Wide shots are padded rather than cut in half."""
    if pad is None:
        return ImageOps.fit(img, (SIDE, SIDE), Image.LANCZOS)
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
    ("hot-dog.jpg",    "b0c96071", (62, 1712, 566, 1946), (247, 247, 248)),
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

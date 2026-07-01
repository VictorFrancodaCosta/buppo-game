from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
IMG_DIR = ROOT / "assets" / "img"
GEN_DIR = Path(r"C:\Users\Victor Franco\.codex\generated_images\019f10b1-7919-77a2-8061-f27fec20be13")

TEMPLATE_PATH = IMG_DIR / "cluster_jogador.webp"
OUTPUT_PATH = IMG_DIR / "cluster_cavaleiro_guardareal.webp"
PREVIEW_PATH = IMG_DIR / "cluster_cavaleiro_guardareal_preview.png"

AI_KNIGHT_SOURCE = GEN_DIR / "ig_07c1f2575ebdbe42016a438320092c8191b7f07f6f819fc802.png"


def rgba(path):
    return Image.open(path).convert("RGBA")


def alpha_mask(img):
    return img.getchannel("A")


def classify_template(template):
    arr = np.array(template.convert("RGBA")).astype(np.int16)
    r, g, b, a = [arr[:, :, i] for i in range(4)]
    maxc = np.maximum.reduce([r, g, b])
    minc = np.minimum.reduce([r, g, b])
    sat = maxc - minc
    visible = a > 24

    parchment = visible & (r > 150) & (g > 95) & (b > 60) & (r > g) & (g > b)
    metal = visible & (sat < 42) & (r > 70) & (g > 70) & (b > 65)
    gold = visible & (r > 145) & (g > 85) & (b < 95) & (sat > 48)
    wood = visible & ~(parchment | metal | gold)

    def mask(cond, blur=0.25):
        m = Image.fromarray(np.where(cond, a, 0).clip(0, 255).astype(np.uint8), "L")
        return m.filter(ImageFilter.GaussianBlur(blur))

    return {
        "visible": Image.fromarray(np.where(visible, a, 0).clip(0, 255).astype(np.uint8), "L"),
        "wood": mask(wood, 0.35),
        "parchment": mask(parchment, 0.2),
        "metal": mask(metal, 0.35),
        "gold": mask(gold, 0.2),
    }


def clean_ai_texture(template_size):
    img = rgba(AI_KNIGHT_SOURCE)
    key = np.array(img.getpixel((0, 0))[:3], dtype=np.float32)
    arr = np.array(img).astype(np.float32)
    rgb = arr[:, :, :3]
    dist = np.sqrt(np.sum((rgb - key) ** 2, axis=2))
    alpha = arr[:, :, 3]
    alpha = np.where(dist < 44, 0, alpha)
    alpha = np.where((dist >= 44) & (dist < 130), alpha * ((dist - 44) / 86), alpha)
    arr[:, :, 3] = np.clip(alpha, 0, 255)
    img = Image.fromarray(arr.astype(np.uint8), "RGBA")
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
    img = img.resize(template_size, Image.Resampling.LANCZOS)
    return ImageEnhance.Contrast(img.filter(ImageFilter.SMOOTH_MORE)).enhance(1.08)


def color_layer(template, mask, color, opacity=1.0):
    gray = ImageEnhance.Contrast(template.convert("L")).enhance(1.16)
    arr = np.array(gray).astype(np.float32) / 255.0
    shade = 0.54 + arr * 0.68
    rgb = np.zeros((template.height, template.width, 4), dtype=np.uint8)
    for i, c in enumerate(color):
        rgb[:, :, i] = np.clip(c * shade, 0, 255)
    rgb[:, :, 3] = np.array(mask.point(lambda p: int(p * opacity)), dtype=np.uint8)
    return Image.fromarray(rgb, "RGBA")


def alpha_composite_masked(base, layer, mask, opacity=255):
    layer = layer.copy()
    layer.putalpha(ImageChops.multiply(mask, Image.new("L", base.size, opacity)))
    base.alpha_composite(layer)


def add_knight_details(img, masks):
    d = ImageDraw.Draw(img, "RGBA")
    w, h = img.size
    sx = w / 370
    sy = h / 138

    def p(x, y):
        return (x * sx, y * sy)

    blue = (28, 94, 210, 230)
    gold = (234, 178, 46, 235)
    ink = (32, 18, 10, 230)
    steel = (210, 220, 219, 215)

    # Blue enamel accents on existing metal zones; all are outside text/HUD centers.
    for cx, cy, r in ((64, 72, 49), (158, 111, 17), (210, 111, 17)):
        x, y = p(cx, cy)
        d.ellipse((x - r * sx, y - r * sy, x + r * sx, y + r * sy), outline=blue, width=max(4, int(2.2 * sx)))
        d.arc((x - (r - 4) * sx, y - (r - 4) * sy, x + (r - 4) * sx, y + (r - 4) * sy), 205, 322, fill=(255, 255, 255, 70), width=max(2, int(0.75 * sx)))

    # A knight shield/fleur-de-lis ornament on the original right ornament area.
    shield = [p(338, 45), p(361, 54), p(357, 93), p(340, 110), p(323, 93), p(319, 54)]
    d.polygon(shield, fill=(24, 83, 186, 215), outline=ink)
    inner = [p(340, 53), p(353, 59), p(350, 88), p(340, 99), p(330, 88), p(327, 59)]
    d.polygon(inner, outline=gold, fill=(18, 70, 165, 210))
    x, y = p(340, 75)
    d.polygon([(x, y - 19 * sy), (x + 8 * sx, y + 6 * sy), (x, y + 20 * sy), (x - 8 * sx, y + 6 * sy)], fill=gold, outline=ink)
    d.ellipse((x - 18 * sx, y - 2 * sy, x - 1 * sx, y + 17 * sy), outline=gold, width=max(3, int(1.7 * sx)))
    d.ellipse((x + 1 * sx, y - 2 * sy, x + 18 * sx, y + 17 * sy), outline=gold, width=max(3, int(1.7 * sx)))

    # Small steel scratches and rivet highlights, clipped to original visible silhouette.
    for x1, y1, x2, y2 in ((112, 57, 145, 54), (184, 64, 228, 62), (258, 86, 304, 83), (315, 103, 333, 101)):
        d.line((*p(x1, y1), *p(x2, y2)), fill=steel, width=max(1, int(0.55 * sx)))

    img.putalpha(masks["visible"])


def build_knight_cluster():
    template = rgba(TEMPLATE_PATH)
    masks = classify_template(template)
    out = Image.new("RGBA", template.size, (0, 0, 0, 0))

    # AI art contributes painterly texture only, clipped to the original cluster silhouette.
    texture = clean_ai_texture(template.size).convert("RGBA")
    texture_gray = ImageEnhance.Contrast(texture.convert("L")).enhance(1.15)
    texture_color = Image.merge(
        "RGBA",
        (
            texture_gray.point(lambda p: int(32 + p * 0.22)),
            texture_gray.point(lambda p: int(82 + p * 0.26)),
            texture_gray.point(lambda p: int(160 + p * 0.34)),
            ImageChops.multiply(alpha_mask(texture), masks["visible"]).point(lambda p: int(p * 0.18)),
        ),
    )
    out.alpha_composite(texture_color)

    alpha_composite_masked(out, color_layer(template, masks["wood"], (42, 101, 190), 0.94), masks["wood"])
    alpha_composite_masked(out, color_layer(template, masks["metal"], (178, 187, 184), 0.9), masks["metal"])
    alpha_composite_masked(out, color_layer(template, masks["gold"], (232, 174, 42), 0.88), masks["gold"])
    alpha_composite_masked(out, color_layer(template, masks["parchment"], (236, 193, 126), 0.58), masks["parchment"])

    # Preserve original cartoon ink/wood grain, which preserves visual alignment.
    linework = ImageEnhance.Contrast(template).enhance(1.18)
    linework.putalpha(masks["visible"].point(lambda p: int(p * 0.5)))
    out.alpha_composite(linework)

    add_knight_details(out, masks)
    out.putalpha(masks["visible"])
    return out


def make_preview(cluster):
    preview = cluster.resize((370, 138), Image.Resampling.LANCZOS)
    d = ImageDraw.Draw(preview, "RGBA")
    # Reference boxes from the current CSS, not new positions.
    d.rectangle((30, 38, 98, 106), outline=(255, 230, 0, 230), width=2)
    d.rectangle((100, 17, 310, 39), outline=(0, 255, 255, 230), width=2)
    d.rectangle((140, 45, 300, 78), outline=(0, 255, 0, 230), width=2)
    d.ellipse((142, 95, 174, 127), outline=(255, 0, 255, 230), width=2)
    d.ellipse((194, 95, 226, 127), outline=(255, 0, 255, 230), width=2)
    preview.save(PREVIEW_PATH)


def main():
    cluster = build_knight_cluster()
    cluster.save(OUTPUT_PATH, "WEBP", lossless=True, quality=100, method=6)
    make_preview(cluster)
    print(f"saved {OUTPUT_PATH}")
    print(f"saved {PREVIEW_PATH}")


if __name__ == "__main__":
    main()

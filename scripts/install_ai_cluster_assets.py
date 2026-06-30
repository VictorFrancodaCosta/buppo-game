from pathlib import Path
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "img"
GEN = Path(r"C:\Users\Victor Franco\.codex\generated_images\019f10b1-7919-77a2-8061-f27fec20be13")

ASSETS = [
    ("cluster_cavaleiro_guardareal.webp", "ig_06b0d5b496bc2f85016a43728540c08191892046e8b183e5ce.png", (24, 89, 190)),
    ("cluster_mago_chamaarcana.webp", "ig_06b0d5b496bc2f85016a4372d2a0cc81919dde653b87cff7a2.png", (184, 35, 30)),
    ("cluster_arqueiro_sentinelaverde.webp", "ig_06b0d5b496bc2f85016a4373141ca081919793b6028c5b254d.png", (40, 142, 55)),
    ("cluster_ladino_maodourada.webp", "ig_06b0d5b496bc2f85016a43735b70bc81919908427aba2fd92f.png", (54, 48, 43)),
    ("cluster_oraculo_visaoastral.webp", "ig_06b0d5b496bc2f85016a4373b37a2481918fde7aedb29abee2.png", (92, 35, 160)),
]

W, H = 2048, 739
HUD = {
    "level": (354, 386, 136),
    "name": (554, 65, 1716, 165),
    "hp": (775, 257, 1661, 402),
    "masteries": ((913, 578, 86), (1190, 578, 86)),
}


def key_color_for(img):
    corners = [
        img.getpixel((0, 0))[:3],
        img.getpixel((img.width - 1, 0))[:3],
        img.getpixel((0, img.height - 1))[:3],
        img.getpixel((img.width - 1, img.height - 1))[:3],
    ]
    return max(set(corners), key=corners.count)


def remove_key(img):
    rgba = img.convert("RGBA")
    key = key_color_for(rgba)
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = pixels[x, y]
            dist = ((r - key[0]) ** 2 + (g - key[1]) ** 2 + (b - key[2]) ** 2) ** 0.5
            if dist < 34:
                pixels[x, y] = (r, g, b, 0)
            elif dist < 118:
                alpha = int(255 * (dist - 34) / 84)
                # Despill toward neutral dark to avoid green/magenta fringes.
                nr = int((r + min(r, 40)) / 2) if key[0] > 200 else r
                ng = int((g + min(g, 40)) / 2) if key[1] > 200 else g
                nb = int((b + min(b, 40)) / 2) if key[2] > 200 else b
                pixels[x, y] = (nr, ng, nb, min(a, alpha))
    return rgba


def prepare(src):
    img = Image.open(src).convert("RGBA")
    if img.size != (W, H):
        img = img.resize((W, H), Image.Resampling.LANCZOS)
    return remove_key(img)


def draw_fixed_hp_socket(img, accent):
    x1, y1, x2, y2 = HUD["hp"]
    d = ImageDraw.Draw(img, "RGBA")
    gold = (228, 178, 56, 255)
    dark = (13, 22, 25, 242)
    shadow = (0, 0, 0, 165)
    x1 += 12
    y1 += 12
    x2 -= 12
    y2 -= 12
    radius = 38
    d.rounded_rectangle((x1 + 10, y1 + 12, x2 + 10, y2 + 12), radius=radius, fill=shadow)
    d.rounded_rectangle((x1, y1, x2, y2), radius=radius, fill=dark, outline=(20, 12, 8, 255), width=15)
    d.rounded_rectangle((x1 + 7, y1 + 7, x2 - 7, y2 - 7), radius=radius - 8, outline=gold, width=9)
    d.rounded_rectangle((x1 + 20, y1 + 20, x2 - 20, y2 - 20), radius=radius - 20, outline=(*accent, 235), width=5)
    return img


def make_audit(images):
    rows = []
    for name, img in images:
        bg = Image.new("RGBA", (W, H), (28, 28, 28, 255))
        bg.alpha_composite(img)
        d = ImageDraw.Draw(bg)
        x, y, r = HUD["level"]
        d.ellipse((x - r, y - r, x + r, y + r), outline=(255, 230, 0, 255), width=7)
        d.rectangle(HUD["name"], outline=(0, 255, 255, 255), width=7)
        d.rectangle(HUD["hp"], outline=(0, 255, 0, 255), width=7)
        for x, y, r in HUD["masteries"]:
            d.ellipse((x - r, y - r, x + r, y + r), outline=(255, 0, 255, 255), width=7)
            d.line((x - 26, y, x + 26, y), fill=(255, 255, 255, 255), width=5)
            d.line((x, y - 26, x, y + 26), fill=(255, 255, 255, 255), width=5)
        rows.append(bg.resize((740, 267), Image.Resampling.LANCZOS))

    audit = Image.new("RGBA", (740, 267 * len(rows)), (18, 18, 18, 255))
    for i, row in enumerate(rows):
        audit.alpha_composite(row, (0, 267 * i))
    return audit


def main():
    processed = []
    for out_name, src_name, accent in ASSETS:
        img = prepare(GEN / src_name)
        img = draw_fixed_hp_socket(img, accent)
        img.save(OUT / out_name, "WEBP", lossless=True, quality=100, method=6)
        processed.append((out_name, img))
    make_audit(processed).save(OUT / "cluster_alignment_audit.png")
    print("Installed", len(processed), "AI cluster assets")


if __name__ == "__main__":
    main()

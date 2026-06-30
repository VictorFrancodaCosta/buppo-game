from pathlib import Path
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "img"

W, H = 2048, 739
CSS_W, CSS_H = 370, 138
SX, SY = W / CSS_W, H / CSS_H


def cx(x):
    return int(round(x * SX))


def cy(y):
    return int(round(y * SY))


HUD = {
    "level": (cx(64), cy(72)),
    "name": (cx(100), cy(15), cx(310), cy(37)),
    "hp": (cx(140), cy(48), cx(300), cy(75)),
    "mastery_a": (cx(165), cy(108)),
    "mastery_b": (cx(215), cy(108)),
}

PALETTES = {
    "cluster_cavaleiro_guardareal.webp": {
        "base": "#0a55a5",
        "dark": "#062b55",
        "line": "#07111c",
        "metal": "#9ba5a8",
        "metal_dark": "#596064",
        "trim": "#d8a12a",
        "paper": "#f0d99b",
        "paper_shadow": "#b9854b",
        "emblem": "shield",
    },
    "cluster_mago_chamaarcana.webp": {
        "base": "#5b118f",
        "dark": "#220638",
        "line": "#14071d",
        "metal": "#9e72cf",
        "metal_dark": "#56316e",
        "trim": "#f0c032",
        "paper": "#efe0b0",
        "paper_shadow": "#a87652",
        "emblem": "moon",
    },
    "cluster_arqueiro_sentinelaverde.webp": {
        "base": "#217b38",
        "dark": "#0d351a",
        "line": "#07180c",
        "metal": "#8c7a49",
        "metal_dark": "#51472d",
        "trim": "#d7b64b",
        "paper": "#ead99c",
        "paper_shadow": "#9b7141",
        "emblem": "arrow",
    },
    "cluster_ladino_maodourada.webp": {
        "base": "#4a4c55",
        "dark": "#17191f",
        "line": "#090a0c",
        "metal": "#846130",
        "metal_dark": "#3f2c18",
        "trim": "#e0ad2d",
        "paper": "#e9d39a",
        "paper_shadow": "#9a6d3b",
        "emblem": "dagger",
    },
    "cluster_oraculo_visaoastral.webp": {
        "base": "#7d238f",
        "dark": "#2a0b38",
        "line": "#16051f",
        "metal": "#b686d2",
        "metal_dark": "#5a3470",
        "trim": "#f0c13c",
        "paper": "#efe1b8",
        "paper_shadow": "#a77855",
        "emblem": "eye",
    },
}


def color(hex_color, alpha=255):
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i:i + 2], 16) for i in (0, 2, 4)) + (alpha,)


def line(draw, points, fill, width=8):
    draw.line(points, fill=fill, width=width, joint="curve")


def ellipse(draw, box, fill, outline, width=8):
    draw.ellipse(box, fill=fill, outline=outline, width=width)


def rounded(draw, box, radius, fill, outline, width=8):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def poly(draw, points, fill, outline, width=8):
    draw.polygon(points, fill=fill)
    line(draw, points + [points[0]], outline, width)


def add_rivets(draw, center, radius, count, palette, offset=0):
    import math
    for i in range(count):
        angle = offset + (math.tau * i / count)
        x = center[0] + int(math.cos(angle) * radius)
        y = center[1] + int(math.sin(angle) * radius)
        ellipse(
            draw,
            (x - 17, y - 17, x + 17, y + 17),
            color(palette["metal"]),
            color(palette["line"]),
            7,
        )
        ellipse(draw, (x - 6, y - 7, x + 6, y + 5), color("#f0f0d0", 120), None, 1)


def add_jewel(draw, x, y, palette):
    fill = color(palette["trim"])
    outline = color(palette["line"])
    poly(draw, [(x, y - 30), (x + 30, y), (x, y + 30), (x - 30, y)], fill, outline, 7)
    poly(draw, [(x, y - 18), (x + 18, y), (x, y + 18), (x - 18, y)], color("#1a6de0"), outline, 4)


def parchment(draw, palette):
    x1, y1, x2, y2 = HUD["name"]
    pad_x, pad_y = 16, 16
    body = (x1 - pad_x, y1 - pad_y, x2 + pad_x, y2 + pad_y)
    rounded(draw, body, 20, color(palette["paper"]), color(palette["line"]), 9)
    line(draw, [(body[0] + 28, body[3] - 8), (body[2] - 28, body[3] - 7)], color(palette["paper_shadow"], 150), 4)
    for x in (body[0] - 22, body[2] + 22):
        rounded(draw, (x - 20, body[1] - 8, x + 20, body[3] + 8), 18, color("#c99a64"), color(palette["line"]), 8)
        line(draw, [(x - 14, body[1] + 8), (x + 12, body[3] - 8)], color("#7a4727", 180), 5)


def draw_emblem(draw, x, y, palette):
    trim = color(palette["trim"])
    linec = color(palette["line"])
    kind = palette["emblem"]
    if kind == "shield":
        poly(draw, [(x, y - 30), (x + 28, y - 18), (x + 20, y + 20), (x, y + 36), (x - 20, y + 20), (x - 28, y - 18)], trim, linec, 6)
        line(draw, [(x, y - 22), (x, y + 26)], color("#f5d878"), 5)
    elif kind == "moon":
        ellipse(draw, (x - 30, y - 30, x + 30, y + 30), trim, linec, 6)
        ellipse(draw, (x - 12, y - 32, x + 42, y + 24), color(palette["base"]), linec, 0)
    elif kind == "arrow":
        line(draw, [(x - 34, y + 24), (x + 30, y - 28)], trim, 10)
        poly(draw, [(x + 34, y - 32), (x + 8, y - 22), (x + 24, y - 2)], trim, linec, 5)
        line(draw, [(x - 30, y + 20), (x - 12, y + 26)], linec, 5)
    elif kind == "dagger":
        poly(draw, [(x, y - 36), (x + 11, y + 12), (x, y + 31), (x - 11, y + 12)], trim, linec, 6)
        line(draw, [(x - 28, y + 5), (x + 28, y + 5)], color(palette["metal"]), 9)
    else:
        ellipse(draw, (x - 36, y - 22, x + 36, y + 22), trim, linec, 6)
        ellipse(draw, (x - 12, y - 12, x + 12, y + 12), color(palette["dark"]), linec, 5)


def socket(draw, center, palette):
    x, y = center
    ellipse(draw, (x - 94, y - 94, x + 94, y + 94), color(palette["metal_dark"]), color(palette["line"]), 11)
    ellipse(draw, (x - 78, y - 78, x + 78, y + 78), color(palette["metal"]), color(palette["line"]), 7)
    ellipse(draw, (x - 54, y - 54, x + 54, y + 54), color("#6d3f1f"), color(palette["line"]), 7)
    for dx, dy in ((0, -76), (64, 0), (0, 76), (-64, 0)):
        ellipse(draw, (x + dx - 10, y + dy - 10, x + dx + 10, y + dy + 10), color(palette["trim"]), color(palette["line"]), 4)


def make_cluster(filename, palette):
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    linec = color(palette["line"])

    lx, ly = HUD["level"]
    hp = HUD["hp"]
    right = cx(360)

    # Main body keeps the HUD hp region clean while framing it with class color.
    rounded(draw, (cx(62), cy(33), right, cy(120)), 22, color(palette["dark"]), linec, 12)
    rounded(draw, (cx(76), cy(39), right - 28, cy(112)), 18, color(palette["base"]), linec, 8)
    rounded(draw, (hp[0] - 38, hp[1] - 17, hp[2] + 38, hp[3] + 17), 36, color(palette["base"]), color(palette["trim"]), 8)
    rounded(draw, (hp[0] - 8, hp[1] - 3, hp[2] + 8, hp[3] + 3), 30, color("#11151e", 130), linec, 6)

    # Knight-like side plate shape also works as a consistent class crest holder.
    plate = [(right - 210, cy(32)), (right - 36, cy(35)), (right - 30, cy(119)), (right - 222, cy(118)), (right - 170, cy(75))]
    poly(draw, plate, color(palette["metal"]), linec, 10)
    draw_emblem(draw, right - 92, cy(49), palette)
    draw_emblem(draw, right - 92, cy(103), palette)

    # Decorative rails stay outside readable HUD regions.
    line(draw, [(cx(93), cy(40)), (right - 220, cy(40))], color(palette["trim"]), 8)
    line(draw, [(cx(93), cy(112)), (right - 230, cy(112))], color(palette["trim"]), 8)
    line(draw, [(cx(138), cy(83)), (right - 230, cy(83))], color("#ffffff", 75), 4)

    # Level medallion.
    ellipse(draw, (lx - 190, ly - 190, lx + 190, ly + 190), color(palette["metal_dark"]), linec, 13)
    ellipse(draw, (lx - 166, ly - 166, lx + 166, ly + 166), color(palette["metal"]), linec, 7)
    ellipse(draw, (lx - 128, ly - 128, lx + 128, ly + 128), color(palette["paper"]), linec, 7)
    add_rivets(draw, (lx, ly), 168, 12, palette, 0.16)
    add_jewel(draw, lx, ly - 188, palette)
    add_jewel(draw, lx, ly + 188, palette)
    line(draw, [(lx - 150, ly - 90), (lx - 150, ly + 85)], color(palette["trim"]), 9)
    line(draw, [(lx + 150, ly - 90), (lx + 150, ly + 85)], color(palette["trim"]), 9)

    parchment(draw, palette)
    socket(draw, HUD["mastery_a"], palette)
    socket(draw, HUD["mastery_b"], palette)

    # Small class marks near the bottom, deliberately outside mastery centers.
    for x in (cx(315), cx(335)):
        line(draw, [(x, cy(113)), (x + 40, cy(113))], color(palette["metal"]), 7)

    return img


def make_audit(generated):
    rows = []
    for name, img in generated:
        base = Image.new("RGBA", (W, H), (30, 30, 30, 255))
        base.alpha_composite(img)
        d = ImageDraw.Draw(base)
        lx, ly = HUD["level"]
        d.ellipse((lx - 136, ly - 136, lx + 136, ly + 136), outline=(255, 230, 0, 255), width=7)
        d.rectangle(HUD["name"], outline=(0, 255, 255, 255), width=7)
        d.rectangle(HUD["hp"], outline=(0, 255, 0, 255), width=7)
        for center in (HUD["mastery_a"], HUD["mastery_b"]):
            x, y = center
            d.ellipse((x - 86, y - 86, x + 86, y + 86), outline=(255, 0, 255, 255), width=7)
            d.line((x - 25, y, x + 25, y), fill=(255, 255, 255, 255), width=5)
            d.line((x, y - 25, x, y + 25), fill=(255, 255, 255, 255), width=5)
        rows.append(base.resize((740, 267)))

    audit = Image.new("RGBA", (740, 267 * len(rows)), (18, 18, 18, 255))
    for i, row in enumerate(rows):
        audit.alpha_composite(row, (0, 267 * i))
    return audit


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    generated = []
    for filename, palette in PALETTES.items():
        img = make_cluster(filename, palette)
        img.save(OUT / filename, "WEBP", lossless=True, quality=100, method=6)
        generated.append((filename, img))
    make_audit(generated).save(OUT / "cluster_alignment_audit.png")
    print("Generated", len(generated), "cluster assets in", OUT)


if __name__ == "__main__":
    main()

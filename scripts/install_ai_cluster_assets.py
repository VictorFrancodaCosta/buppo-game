from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "img"
GEN = Path(r"C:\Users\Victor Franco\.codex\generated_images\019f10b1-7919-77a2-8061-f27fec20be13")

W, H = 2048, 739
DOM_W, DOM_H = 370, 138

ASSETS = [
    ("cluster_cavaleiro_guardareal.webp", "ig_07c1f2575ebdbe42016a438320092c8191b7f07f6f819fc802.png"),
    ("cluster_mago_chamaarcana.webp", "ig_07c1f2575ebdbe42016a43837cde488191a7e75cc9aa2c05e1.png"),
    ("cluster_arqueiro_sentinelaverde.webp", "ig_07c1f2575ebdbe42016a4383cf5d008191a2dd2db66d39ac3c.png"),
    ("cluster_ladino_maodourada.webp", "ig_07c1f2575ebdbe42016a43842472548191988d0e3305902cd6.png"),
    ("cluster_oraculo_visaoastral.webp", "ig_07c1f2575ebdbe42016a4384737308819184164f90caf2f45e.png"),
]

HUD_DOM = {
    "level_center": (64, 72),
    "level_radius": 34,
    "name_box": (100, 17, 310, 39),
    "hp_box": (140, 48, 300, 75),
    "mastery_centers": ((165, 108), (215, 108)),
    "mastery_radius": 16,
}


def sx(x):
    return x * W / DOM_W


def sy(y):
    return y * H / DOM_H


def box_dom(box):
    x1, y1, x2, y2 = box
    return (sx(x1), sy(y1), sx(x2), sy(y2))


def point_dom(point):
    x, y = point
    return (sx(x), sy(y))


def key_color_for(img):
    corners = [
        img.getpixel((0, 0))[:3],
        img.getpixel((img.width - 1, 0))[:3],
        img.getpixel((0, img.height - 1))[:3],
        img.getpixel((img.width - 1, img.height - 1))[:3],
    ]
    return max(set(corners), key=corners.count)


def remove_key(img):
    img = img.convert("RGBA")
    key = key_color_for(img)
    arr = np.array(img).astype(np.float32)
    rgb = arr[:, :, :3]
    alpha = arr[:, :, 3]
    key_arr = np.array(key, dtype=np.float32)
    dist = np.sqrt(np.sum((rgb - key_arr) ** 2, axis=2))
    alpha = np.where(dist < 38, 0, alpha)
    soft = (dist >= 38) & (dist < 120)
    alpha = np.where(soft, alpha * ((dist - 38) / 82), alpha)
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    if key[1] > 180:
        chroma = (g > 120) & (g > r * 1.22) & (g > b * 1.22)
        alpha = np.where(chroma, 0, alpha)
    if key[0] > 180 and key[2] > 180:
        chroma = (r > 120) & (b > 120) & (r > g * 1.22) & (b > g * 1.22)
        alpha = np.where(chroma, 0, alpha)
    arr[:, :, 3] = np.clip(alpha, 0, 255)
    return Image.fromarray(arr.astype(np.uint8), "RGBA")


def normalize_to_canvas(src):
    img = remove_key(Image.open(src))
    bbox = img.getbbox()
    if not bbox:
        raise ValueError(f"Empty generated art: {src}")
    cropped = img.crop(bbox)
    # Fit the AI-painted cluster itself to the exact game asset canvas.
    fitted = cropped.resize((W, H), Image.Resampling.LANCZOS)
    return fitted


def draw_audit_marks(img):
    d = ImageDraw.Draw(img, "RGBA")
    lx, ly = point_dom(HUD_DOM["level_center"])
    lr = sx(HUD_DOM["level_radius"])
    d.ellipse((lx - lr, ly - lr, lx + lr, ly + lr), outline=(255, 230, 0, 255), width=7)
    d.rectangle(box_dom(HUD_DOM["name_box"]), outline=(0, 255, 255, 255), width=7)
    d.rectangle(box_dom(HUD_DOM["hp_box"]), outline=(0, 255, 0, 255), width=7)
    mr = sx(HUD_DOM["mastery_radius"])
    for center in HUD_DOM["mastery_centers"]:
        cx, cy = point_dom(center)
        d.ellipse((cx - mr, cy - mr, cx + mr, cy + mr), outline=(255, 0, 255, 255), width=7)
        d.line((cx - sx(5), cy, cx + sx(5), cy), fill=(255, 255, 255, 255), width=5)
        d.line((cx, cy - sy(5), cx, cy + sy(5)), fill=(255, 255, 255, 255), width=5)


def make_audit(processed):
    rows = []
    for _, img in processed:
        bg = Image.new("RGBA", (W, H), (28, 28, 28, 255))
        bg.alpha_composite(img)
        draw_audit_marks(bg)
        rows.append(bg.resize((740, 267), Image.Resampling.LANCZOS))
    audit = Image.new("RGBA", (740, 267 * len(rows)), (18, 18, 18, 255))
    for i, row in enumerate(rows):
        audit.alpha_composite(row, (0, i * 267))
    return audit


def main():
    processed = []
    for out_name, src_name in ASSETS:
        img = normalize_to_canvas(GEN / src_name)
        img.save(OUT / out_name, "WEBP", lossless=True, quality=100, method=6)
        processed.append((out_name, img))
    make_audit(processed).save(OUT / "cluster_alignment_audit.png")
    print("Installed", len(processed), "AI-painted cluster assets")


if __name__ == "__main__":
    main()

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
IMG_DIR = ROOT / "assets" / "img"
GEN_DIR = Path(r"C:\Users\Victor Franco\.codex\generated_images\019f10b1-7919-77a2-8061-f27fec20be13")

SOURCE = GEN_DIR / "ig_07c1f2575ebdbe42016a438320092c8191b7f07f6f819fc802.png"
OUTPUT = IMG_DIR / "cluster_cavaleiro_guardareal.webp"
PREVIEW = IMG_DIR / "cluster_cavaleiro_guardareal_hud_preview.png"

CANVAS = (3456, 1248)
HUD_SIZE = (370, 138)


def remove_chroma(img):
    img = img.convert("RGBA")
    key = np.array(img.getpixel((0, 0))[:3], dtype=np.float32)
    arr = np.array(img).astype(np.float32)
    rgb = arr[:, :, :3]
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    dist = np.sqrt(np.sum((rgb - key) ** 2, axis=2))
    alpha = arr[:, :, 3]
    alpha = np.where(dist < 46, 0, alpha)
    alpha = np.where((dist >= 46) & (dist < 132), alpha * ((dist - 46) / 86), alpha)
    if key[1] > 180:
        green = (g > 92) & (g > r * 1.12) & (g > b * 1.12)
        alpha = np.where(green, 0, alpha)
        arr[:, :, 1] = np.where(alpha < 245, np.minimum(g, np.maximum(r, b) * 1.03), g)
    arr[:, :, 3] = np.clip(alpha, 0, 255)
    return Image.fromarray(arr.astype(np.uint8), "RGBA")


def build_asset():
    img = remove_chroma(Image.open(SOURCE))
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
    return img.resize(CANVAS, Image.Resampling.LANCZOS)


def make_hud_preview(asset):
    preview = asset.resize(HUD_SIZE, Image.Resampling.LANCZOS)
    d = ImageDraw.Draw(preview, "RGBA")
    try:
        f_big = ImageFont.truetype("arialbd.ttf", 50)
        f_med = ImageFont.truetype("arialbd.ttf", 18)
        f_small = ImageFont.truetype("arialbd.ttf", 20)
        f_x = ImageFont.truetype("arialbd.ttf", 15)
    except Exception:
        f_big = f_med = f_small = f_x = None

    # Current HUD positions from css/game.css. This preview must not invent new coordinates.
    d.text((64, 72), "3", anchor="mm", font=f_big, fill=(251, 197, 49, 255), stroke_width=2, stroke_fill=(60, 34, 15, 255))
    d.text((205, 28), "VOCE", anchor="mm", font=f_med, fill=(62, 39, 35, 255))
    d.rounded_rectangle((140, 45, 300, 78), radius=16, outline=(38, 11, 0, 255), width=3, fill=(0, 0, 0, 125))
    d.rounded_rectangle((143, 48, 224, 75), radius=13, fill=(76, 209, 55, 255))
    d.text((220, 61), "3/6", anchor="mm", font=f_med, fill=(255, 255, 255, 255), stroke_width=1, stroke_fill=(0, 0, 0, 255))
    for cx, symbol in ((158, "X"), (210, "S")):
        d.text((cx, 111), symbol, anchor="mm", font=f_small, fill=(245, 247, 251, 255), stroke_width=1, stroke_fill=(20, 8, 3, 255))
        d.ellipse((cx + 8, 118, cx + 24, 134), fill=(252, 211, 35, 255), outline=(0, 0, 0, 255), width=1)
        d.text((cx + 16, 126), "1", anchor="mm", font=f_x, fill=(0, 0, 0, 255))
    preview.save(PREVIEW)


def main():
    asset = build_asset()
    asset.save(OUTPUT, "WEBP", lossless=True, quality=100, method=6)
    make_hud_preview(asset)
    print(f"saved {OUTPUT}")
    print(f"saved {PREVIEW}")


if __name__ == "__main__":
    main()

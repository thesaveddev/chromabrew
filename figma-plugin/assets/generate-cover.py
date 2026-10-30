#!/usr/bin/env python3
"""Community cover art for the ChromaBrew Figma plugin (1920x1080 PNG).

Shot 0 of docs/FIGMA_COMMUNITY_LISTING.md: the genuine 50-950 perceptual
ramp for #47003A as full-height bars, the plugin window floating over it,
wordmark + one-line value prop. Ramp hexes below are engine output
(verbatim from buildDesignSystem), not hand-picked.

  python figma-plugin/assets/generate-cover.py
"""
from pathlib import Path
from shutil import copyfile
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).parent

# Genuine engine output for primary #47003A (lightest -> darkest).
RAMP = [
    "#fff4fb", "#ffe4f6", "#ffcdef", "#f5b4e2", "#e097cb", "#c87cb3",
    "#b0639b", "#934b81", "#773867", "#5e2750", "#47003a",
]

W, H = 1920, 1080
BG = (26, 10, 20)  # deep plum, near-black


def font(size: int, bold: bool = False):
    for name in (
        "arialbd.ttf" if bold else "arial.ttf",
        "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf",
    ):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def main() -> None:
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)

    # 11 full-height ramp bars bleeding off every edge.
    bar_w = W / len(RAMP)
    for i, hx in enumerate(RAMP):
        h = hx.lstrip("#")
        r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
        d.rectangle([i * bar_w, 0, (i + 1) * bar_w + 1, H], fill=(r, g, b))

    # Soft dark wash so text and the plugin card read on top.
    wash = Image.new("RGB", (W, H), (20, 6, 16))
    img = Image.blend(img, wash, 0.28)
    d = ImageDraw.Draw(img)

    # Floating plugin card (mirrors figma-plugin/ui.html proportions).
    cw, chh, cx, cy = 560, 330, 1340, 560
    d.rounded_rectangle([cx, cy, cx + cw, cy + chh], radius=28,
                        fill=(255, 255, 255))
    d.rounded_rectangle([cx, cy, cx + cw, cy + chh], radius=28,
                        outline=(255, 255, 255), width=2)
    # Quadrant mark inside the card.
    q, qs = (cx + 48, cy + 44), 64
    for (qx, qy), col in zip(
        [(0, 0), (1, 0), (0, 1), (1, 1)],
        [(0x47, 0x00, 0x3A), (0xF5, 0x9E, 0x0B),
         (0x14, 0xB8, 0xA6), (0xF8, 0xF4, 0xEC)],
    ):
        d.rectangle([q[0] + qx * qs // 2, q[1] + qy * qs // 2,
                     q[0] + (qx + 1) * qs // 2, q[1] + (qy + 1) * qs // 2],
                    fill=col)
    d.text((q[0] + qs + 24, q[1] + 4), "ChromaBrew",
           font=font(44, True), fill=(24, 24, 27))
    d.text((cx + 48, cy + 140), "Brand colour",
           font=font(20, True), fill=(113, 113, 122))
    d.rounded_rectangle([cx + 48, cy + 176, cx + 340, cy + 232], radius=12,
                        fill=(250, 250, 250), outline=(229, 229, 234), width=2)
    d.text((cx + 64, cy + 188), "#47003a",
           font=font(28), fill=(24, 24, 27))
    d.rounded_rectangle([cx + 356, cy + 176, cx + 512, cy + 232], radius=12,
                        fill=(24, 161, 251))
    d.text((cx + 378, cy + 190), "Generate",
           font=font(26, True), fill=(255, 255, 255))
    d.text((cx + 48, cy + 256), "50\u2013950 scale \u00b7 palette \u00b7 Light + Dark",
           font=font(22), fill=(113, 113, 122))

    # Wordmark + value prop, lower-left over the bars.
    d.text((90, H - 330), "ChromaBrew",
           font=font(120, True), fill=(255, 255, 255),
           stroke_width=2, stroke_fill=(26, 10, 20))
    d.text((94, H - 180), "One color \u2192 49 accessible Figma variables.",
           font=font(52), fill=(255, 255, 255),
           stroke_width=1, stroke_fill=(26, 10, 20))

    cover = HERE / "cover-1920x1080.png"
    img.save(cover)
    print(f"wrote {cover}")

    icon_src = Path("chrome-extension/icons/icon-128.png")
    icon_dst = HERE / "icon-128.png"
    copyfile(icon_src, icon_dst)
    print(f"wrote {icon_dst} (copied from {icon_src})")


if __name__ == "__main__":
    main()

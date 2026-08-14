#!/usr/bin/env python3
"""Build deterministic review and delivery boards for refrigerator v2."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / "artifacts" / "appliance-v2" / "refrigerator"
V1 = ROOT / "docs" / "history" / "appliance-model-v1-2026-08-11" / "screenshots" / "models" / "refrigerator"
REFERENCE = ROOT / "references" / "intake-v2" / "refrigerator" / "views"
VIEWS = ["front", "side", "back", "three-quarter"]
BACKGROUND = (244, 240, 235)
INK = (62, 48, 68)


def fitted(path: Path, size: tuple[int, int]) -> Image.Image:
    with Image.open(path) as source:
        image = source.convert("RGB")
    image.thumbnail(size, Image.Resampling.LANCZOS)
    tile = Image.new("RGB", size, BACKGROUND)
    tile.paste(image, ((size[0] - image.width) // 2, (size[1] - image.height) // 2))
    return tile


def comparison(columns: list[tuple[str, list[Path]]], output: Path, title: str) -> None:
    tile_size = (430, 323)
    margin = 24
    header = 76
    label_height = 28
    width = margin * 2 + len(columns) * tile_size[0]
    height = header + len(VIEWS) * (tile_size[1] + label_height) + margin
    board = Image.new("RGB", (width, height), BACKGROUND)
    draw = ImageDraw.Draw(board)
    draw.text((margin, 22), title, fill=INK, font=ImageFont.load_default(size=22))
    for column, (column_label, paths) in enumerate(columns):
        x = margin + column * tile_size[0]
        draw.text((x + 8, 52), column_label, fill=INK, font=ImageFont.load_default(size=16))
        for row, (view, path) in enumerate(zip(VIEWS, paths, strict=True)):
            y = header + row * (tile_size[1] + label_height)
            board.paste(fitted(path, tile_size), (x, y))
            draw.rectangle((x, y, x + tile_size[0] - 1, y + tile_size[1] - 1), outline=(190, 176, 196), width=1)
            draw.text((x + 8, y + tile_size[1] + 5), view, fill=INK, font=ImageFont.load_default(size=16))
    output.parent.mkdir(parents=True, exist_ok=True)
    board.save(output, optimize=True)


def interaction_board(output: Path) -> None:
    entries = [
        ("v1 startup", V1 / "active-startup-0.6.png"),
        ("v1 climax", V1 / "active-climax-2.8.png"),
        ("v1 wind-down", V1 / "active-wind-down-4.75.png"),
        ("v2 startup", ARTIFACTS / "startup" / "render-on-three-quarter.png"),
        ("v2 climax", ARTIFACTS / "climax" / "render-on-three-quarter.png"),
        ("v2 wind-down", ARTIFACTS / "wind-down" / "render-on-three-quarter.png"),
    ]
    tile_size = (430, 323)
    margin = 24
    header = 72
    label_height = 30
    board = Image.new("RGB", (margin * 2 + 3 * tile_size[0], header + 2 * (tile_size[1] + label_height) + margin), BACKGROUND)
    draw = ImageDraw.Draw(board)
    draw.text((margin, 20), "SAKURA refrigerator v1 / v2 animation contact", fill=INK, font=ImageFont.load_default(size=22))
    for index, (label, path) in enumerate(entries):
        row, column = divmod(index, 3)
        x = margin + column * tile_size[0]
        y = header + row * (tile_size[1] + label_height)
        board.paste(fitted(path, tile_size), (x, y))
        draw.text((x + 8, y + tile_size[1] + 7), label, fill=INK, font=ImageFont.load_default(size=16))
    output.parent.mkdir(parents=True, exist_ok=True)
    board.save(output, optimize=True)


def main() -> None:
    v1 = [V1 / f"idle-{view}.png" for view in VIEWS]
    v2 = [ARTIFACTS / "static" / f"render-off-{view}.png" for view in VIEWS]
    concept = [REFERENCE / f"{view}.png" for view in VIEWS]
    comparison(
        [("v1 runtime", v1), ("v2 runtime", v2)],
        ARTIFACTS / "review" / "refrigerator-v1-v2-four-view-comparison.png",
        "SAKURA refrigerator - v1 / v2 runtime comparison",
    )
    comparison(
        [("IMAGEN v2 reference", concept), ("procedural Three.js v2", v2)],
        ARTIFACTS / "review" / "refrigerator-reference-v2-four-view-comparison.png",
        "SAKURA refrigerator - admitted reference / runtime evidence",
    )
    comparison(
        [("v1 runtime", v1), ("IMAGEN v2 reference", concept), ("v2 runtime", v2)],
        ARTIFACTS / "final" / "refrigerator-v2-delivery-board.png",
        "SAKURA refrigerator v2 delivery board",
    )
    interaction_board(ARTIFACTS / "interaction" / "refrigerator-animation-comparison.png")
    print(ARTIFACTS / "final" / "refrigerator-v2-delivery-board.png")


if __name__ == "__main__":
    main()

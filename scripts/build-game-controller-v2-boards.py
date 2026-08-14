#!/usr/bin/env python3
"""Build deterministic review and delivery boards for game-controller v2."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / "artifacts" / "img2threejs-v2" / "game-controller"
REFERENCE = ROOT / "references" / "intake-v2" / "game-controller" / "views"
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
    title_font = ImageFont.load_default(size=22)
    label_font = ImageFont.load_default(size=16)
    draw.text((margin, 22), title, fill=INK, font=title_font)
    for column, (column_label, paths) in enumerate(columns):
        x = margin + column * tile_size[0]
        draw.text((x + 8, 52), column_label, fill=INK, font=label_font)
        for row, (view, path) in enumerate(zip(VIEWS, paths, strict=True)):
            y = header + row * (tile_size[1] + label_height)
            board.paste(fitted(path, tile_size), (x, y))
            draw.rectangle((x, y, x + tile_size[0] - 1, y + tile_size[1] - 1), outline=(190, 176, 196), width=1)
            draw.text((x + 8, y + tile_size[1] + 5), view, fill=INK, font=label_font)
    output.parent.mkdir(parents=True, exist_ok=True)
    board.save(output, optimize=True)


def triptych(output: Path) -> None:
    states = ["startup", "climax", "winddown"]
    paths = [ARTIFACTS / "interaction" / state / f"render-{state}-three-quarter.png" for state in states]
    tile_size = (480, 360)
    margin = 24
    header = 72
    board = Image.new("RGB", (margin * 2 + len(paths) * tile_size[0], header + tile_size[1] + 42), BACKGROUND)
    draw = ImageDraw.Draw(board)
    draw.text((margin, 20), "SAKURA game-controller v2 powered sequence", fill=INK, font=ImageFont.load_default(size=22))
    for index, (state, path) in enumerate(zip(states, paths, strict=True)):
        x = margin + index * tile_size[0]
        board.paste(fitted(path, tile_size), (x, header))
        draw.text((x + 8, header + tile_size[1] + 8), state, fill=INK, font=ImageFont.load_default(size=16))
    output.parent.mkdir(parents=True, exist_ok=True)
    board.save(output, optimize=True)


def main() -> None:
    v1 = [ARTIFACTS / "v1-runtime-baseline" / f"render-off-{view}.png" for view in VIEWS]
    v2 = [ARTIFACTS / "current" / f"render-off-{view}.png" for view in VIEWS]
    concept = [REFERENCE / f"{view}.png" for view in VIEWS]
    comparison(
        [("v1 runtime", v1), ("v2 runtime", v2)],
        ARTIFACTS / "review" / "game-controller-v1-v2-four-view-comparison.png",
        "SAKURA game-controller - v1 / v2 runtime comparison",
    )
    comparison(
        [("IMAGEN v2 reference", concept), ("procedural Three.js v2", v2)],
        ARTIFACTS / "review" / "game-controller-reference-v2-four-view-comparison.png",
        "SAKURA game-controller - admitted reference / runtime evidence",
    )
    comparison(
        [("v1 runtime", v1), ("IMAGEN v2 reference", concept), ("v2 runtime", v2)],
        ARTIFACTS / "final" / "game-controller-v2-delivery-board.png",
        "SAKURA game-controller v2 delivery board",
    )
    triptych(ARTIFACTS / "interaction" / "interaction-triptych.png")
    print(ARTIFACTS / "final" / "game-controller-v2-delivery-board.png")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Build the immutable v1 appliance contact sheet and screenshot index."""

from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


MODELS = [
    "lamp", "fan", "radio", "television", "humidifier", "toaster",
    "refrigerator", "washer", "microwave", "coffee-maker", "kettle",
    "rice-cooker", "phone", "robot-vacuum", "bubble-machine",
    "gumball-machine", "popcorn-machine", "alarm-clock", "smart-bin",
    "record-player", "stand-mixer", "printer", "induction-cooktop",
    "blender", "dehumidifier", "portable-speaker", "hair-dryer",
    "desktop-computer", "game-controller",
]
REQUIRED_CAPTURES = [
    "idle-front.png",
    "idle-side.png",
    "idle-back.png",
    "idle-three-quarter.png",
    "active-startup-0.6.png",
    "active-climax-2.8.png",
    "active-wind-down-4.75.png",
]


def main() -> int:
    screenshot_root = Path(
        sys.argv[1]
        if len(sys.argv) > 1
        else "docs/history/appliance-model-v1-2026-08-11/screenshots"
    ).resolve()
    model_root = screenshot_root / "models"
    columns = 5
    rows = 6
    card_width = 300
    card_height = 245
    image_width = 280
    image_height = 210
    margin = 24
    header = 72
    board = Image.new(
        "RGB",
        (margin * 2 + columns * card_width, header + margin + rows * card_height),
        (240, 239, 245),
    )
    draw = ImageDraw.Draw(board)
    font = ImageFont.load_default(size=18)
    label_font = ImageFont.load_default(size=15)
    draw.text((margin, 22), "SAKURA appliance model v1 catalog - 2026-08-11", fill=(54, 47, 76), font=font)

    index = {
        "schemaVersion": 1,
        "applianceCount": len(MODELS),
        "requiredCapturesPerAppliance": len(REQUIRED_CAPTURES),
        "models": [],
        "game": {},
    }
    missing_total: list[str] = []
    for model_index, model in enumerate(MODELS):
        model_directory = model_root / model
        files = []
        missing = []
        for filename in REQUIRED_CAPTURES:
            capture_path = model_directory / filename
            if capture_path.is_file():
                with Image.open(capture_path) as capture:
                    files.append({
                        "name": filename,
                        "width": capture.width,
                        "height": capture.height,
                    })
            else:
                missing.append(filename)
                missing_total.append(f"{model}/{filename}")

        hero_path = model_directory / "idle-three-quarter.png"
        if hero_path.is_file():
            with Image.open(hero_path) as hero:
                preview = hero.convert("RGB")
                preview.thumbnail((image_width, image_height), Image.Resampling.LANCZOS)
                column = model_index % columns
                row = model_index // columns
                card_x = margin + column * card_width
                card_y = header + row * card_height
                image_x = card_x + (image_width - preview.width) // 2
                image_y = card_y + (image_height - preview.height) // 2
                board.paste(preview, (image_x, image_y))
                draw.rectangle(
                    (card_x, card_y, card_x + image_width, card_y + image_height),
                    outline=(190, 184, 207),
                    width=1,
                )
                draw.text(
                    (card_x + 6, card_y + image_height + 8),
                    f"{model_index + 1:02d}  {model}",
                    fill=(54, 47, 76),
                    font=label_font,
                )

        index["models"].append({
            "id": model,
            "captureCount": len(files),
            "captures": files,
            "missing": missing,
        })

    for filename in ["game-seed-2679418801.png", "game-seed-2679418801-canvas.png"]:
        capture_path = screenshot_root / filename
        if capture_path.is_file():
            with Image.open(capture_path) as capture:
                index["game"][filename] = {
                    "width": capture.width,
                    "height": capture.height,
                }
        else:
            missing_total.append(filename)

    index["missing"] = missing_total
    index["complete"] = not missing_total
    board_path = screenshot_root / "appliance-catalog-v1.png"
    index_path = screenshot_root / "capture-index.json"
    board.save(board_path, optimize=True)
    index_path.write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "board": str(board_path),
        "index": str(index_path),
        "complete": not missing_total,
        "missing": missing_total,
    }, ensure_ascii=False, indent=2))
    return 0 if not missing_total else 1


if __name__ == "__main__":
    raise SystemExit(main())

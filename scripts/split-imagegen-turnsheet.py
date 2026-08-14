#!/usr/bin/env python3
"""Split a square 2x2 appliance turn-sheet into four named reference views."""

from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image


VIEW_NAMES = ("front", "side", "back", "three-quarter")


def main() -> int:
    if len(sys.argv) != 3:
        print("usage: split-imagegen-turnsheet.py <turnsheet.png> <output-directory>")
        return 2

    source_path = Path(sys.argv[1]).resolve()
    output_directory = Path(sys.argv[2]).resolve()
    output_directory.mkdir(parents=True, exist_ok=True)

    with Image.open(source_path) as source:
        image = source.convert("RGB")
        width, height = image.size
        if abs(width - height) > 2:
            raise ValueError(f"expected a square turn-sheet, got {width}x{height}")
        split_x = width // 2
        split_y = height // 2
        boxes = (
            (0, 0, split_x, split_y),
            (split_x, 0, width, split_y),
            (0, split_y, split_x, height),
            (split_x, split_y, width, height),
        )
        outputs = []
        for view_name, crop_box in zip(VIEW_NAMES, boxes, strict=True):
            output_path = output_directory / f"{view_name}.png"
            image.crop(crop_box).save(output_path, optimize=True)
            outputs.append({"view": view_name, "path": str(output_path), "crop": crop_box})

    manifest_path = output_directory / "split-manifest.json"
    manifest_path.write_text(
        json.dumps(
            {
                "source": str(source_path),
                "sourceWidth": width,
                "sourceHeight": height,
                "outputs": outputs,
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(manifest_path.read_text(encoding="utf-8"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

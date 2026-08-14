#!/usr/bin/env python3
"""Create a solid exterior silhouette from a model-review screenshot.

This is used only for geometry-invariant IMG2THREEJS pass gates. It removes
small petals/UI noise, closes ink-contour gaps, and fills interior material
regions so a dark screen cannot be misread as a change to the outer shape.
"""

from __future__ import annotations

import math
import sys
from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter


def median(values: list[int]) -> int:
    values = sorted(values)
    return values[len(values) // 2]


def exterior_fill(mask: Image.Image) -> Image.Image:
    width, height = mask.size
    source = mask.load()
    outside = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()

    def push(x: int, y: int) -> None:
        index = y * width + x
        if outside[index] or source[x, y] != 0:
            return
        outside[index] = 1
        queue.append((x, y))

    for x in range(width):
        push(x, 0)
        push(x, height - 1)
    for y in range(height):
        push(0, y)
        push(width - 1, y)
    while queue:
        x, y = queue.popleft()
        if x > 0:
            push(x - 1, y)
        if x + 1 < width:
            push(x + 1, y)
        if y > 0:
            push(x, y - 1)
        if y + 1 < height:
            push(x, y + 1)

    result = Image.new('L', (width, height), 0)
    target = result.load()
    for y in range(height):
        for x in range(width):
            target[x, y] = 255 if source[x, y] != 0 or not outside[y * width + x] else 0
    return result


def remove_small_components(mask: Image.Image, minimum_area: int) -> Image.Image:
    width, height = mask.size
    source = mask.load()
    visited = bytearray(width * height)
    result = Image.new('L', (width, height), 0)
    target = result.load()
    for start_y in range(height):
        for start_x in range(width):
            start_index = start_y * width + start_x
            if visited[start_index] or source[start_x, start_y] == 0:
                continue
            visited[start_index] = 1
            queue: deque[tuple[int, int]] = deque([(start_x, start_y)])
            component: list[tuple[int, int]] = []
            while queue:
                x, y = queue.popleft()
                component.append((x, y))
                for next_y in range(max(0, y - 1), min(height, y + 2)):
                    for next_x in range(max(0, x - 1), min(width, x + 2)):
                        index = next_y * width + next_x
                        if visited[index] or source[next_x, next_y] == 0:
                            continue
                        visited[index] = 1
                        queue.append((next_x, next_y))
            if len(component) >= minimum_area:
                for x, y in component:
                    target[x, y] = 255
    return result


def main() -> int:
    if len(sys.argv) != 3:
        raise SystemExit('usage: extract-review-silhouette.py <input.png> <output.png>')
    source_path = Path(sys.argv[1]).resolve()
    output_path = Path(sys.argv[2]).resolve()
    image = Image.open(source_path).convert('RGB')
    width, height = image.size
    pixels = image.load()
    radius = max(3, min(width, height) // 40)
    samples: list[tuple[int, int, int]] = []
    for x0, y0 in ((0, 0), (width - radius, 0), (0, height - radius), (width - radius, height - radius)):
        for y in range(y0, y0 + radius):
            for x in range(x0, x0 + radius):
                samples.append(pixels[x, y])
    background = tuple(median([sample[channel] for sample in samples]) for channel in range(3))

    raw = Image.new('L', (width, height), 0)
    mask = raw.load()
    for y in range(height):
        for x in range(width):
            red, green, blue = pixels[x, y]
            distance = math.sqrt(
                (red - background[0]) ** 2
                + (green - background[1]) ** 2
                + (blue - background[2]) ** 2
            )
            high = max(red, green, blue)
            saturation = 0 if high == 0 else (high - min(red, green, blue)) / high
            luma = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255
            if (distance > 24 and (saturation > 0.045 or luma < 0.72)) or (saturation > 0.16 and luma < 0.94):
                mask[x, y] = 255

    cleaned = remove_small_components(raw, max(96, width * height // 4000))
    closed = cleaned.filter(ImageFilter.MaxFilter(11)).filter(ImageFilter.MinFilter(11))
    solid = exterior_fill(closed)
    # Remove isolated petals and the lower-left status pill while preserving
    # the four/five large workstation component islands.
    binary = solid.point(lambda value: 255 if value > 0 else 0)
    output = Image.new('RGB', (width, height), 'white')
    output.paste('black', mask=binary)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output.save(output_path)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

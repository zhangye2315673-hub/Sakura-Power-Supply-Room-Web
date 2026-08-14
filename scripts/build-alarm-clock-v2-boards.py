#!/usr/bin/env python3
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'artifacts' / 'appliance-v2' / 'alarm-clock'
V1 = ROOT / 'docs' / 'history' / 'appliance-model-v1-2026-08-11' / 'screenshots' / 'models' / 'alarm-clock'
V2 = ART / 'evidence' / 'models' / 'alarm-clock'
REF = ROOT / 'references' / 'intake-v2' / 'alarm-clock' / 'views'
VIEWS = ['front', 'side', 'back', 'three-quarter']
BG = (244, 240, 235); INK = (62, 48, 68)

def fitted(path: Path, size: tuple[int, int]) -> Image.Image:
    with Image.open(path) as source: image = source.convert('RGB')
    image.thumbnail(size, Image.Resampling.LANCZOS); tile = Image.new('RGB', size, BG); tile.paste(image, ((size[0] - image.width) // 2, (size[1] - image.height) // 2)); return tile

def board(columns, output: Path, title: str) -> None:
    tile = (390, 293); margin = 24; header = 74; label = 26
    canvas = Image.new('RGB', (margin * 2 + len(columns) * tile[0], header + len(VIEWS) * (tile[1] + label) + margin), BG); draw = ImageDraw.Draw(canvas)
    draw.text((margin, 20), title, fill=INK, font=ImageFont.load_default(size=21))
    for column, (name, paths) in enumerate(columns):
        x = margin + column * tile[0]; draw.text((x + 8, 50), name, fill=INK, font=ImageFont.load_default(size=15))
        for row, (view, source) in enumerate(zip(VIEWS, paths, strict=True)):
            y = header + row * (tile[1] + label); canvas.paste(fitted(source, tile), (x, y)); draw.text((x + 8, y + tile[1] + 4), view, fill=INK, font=ImageFont.load_default(size=14))
    output.parent.mkdir(parents=True, exist_ok=True); canvas.save(output, optimize=True)

def animation(output: Path) -> None:
    items = [('startup 0.6s', V2 / 'render-startup-three-quarter.png'), ('climax 3.42s', V2 / 'render-climax-three-quarter.png'), ('wind-down 4.75s', V2 / 'render-wind-down-three-quarter.png')]
    tile = (390, 293); margin = 24; header = 70; label = 28; canvas = Image.new('RGB', (margin * 2 + 3 * tile[0], header + tile[1] + label + margin), BG); draw = ImageDraw.Draw(canvas); draw.text((margin, 20), 'SAKURA alarm clock v2 ringing contact', fill=INK, font=ImageFont.load_default(size=21))
    for index, (name, source) in enumerate(items): x = margin + index * tile[0]; y = header; canvas.paste(fitted(source, tile), (x, y)); draw.text((x + 8, y + tile[1] + 5), name, fill=INK, font=ImageFont.load_default(size=14))
    output.parent.mkdir(parents=True, exist_ok=True); canvas.save(output, optimize=True)

v1 = [V1 / f'idle-{view}.png' for view in VIEWS]; ref = [REF / f'{view}.png' for view in VIEWS]; v2 = [V2 / f'render-off-{view}.png' for view in VIEWS]
board([('v1 runtime', v1), ('procedural v2', v2)], ART / 'final' / 'alarm-clock-v2-delivery-board.png', 'SAKURA alarm clock v1 / v2 delivery board')
board([('conditional v1 fallback', ref), ('procedural v2', v2)], ART / 'review' / 'alarm-clock-reference-v2-four-view-comparison.png', 'SAKURA alarm clock reference / runtime')
animation(ART / 'final' / 'alarm-clock-v2-animation-board.png')
print(ART / 'final' / 'alarm-clock-v2-delivery-board.png')

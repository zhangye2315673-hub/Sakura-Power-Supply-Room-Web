#!/usr/bin/env python3
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'artifacts' / 'appliance-v2' / 'induction-cooktop'
V1 = ROOT / 'docs' / 'history' / 'appliance-model-v1-2026-08-11' / 'screenshots' / 'models' / 'induction-cooktop'
V2 = ART / 'evidence' / 'models' / 'induction-cooktop'
REF = ROOT / 'references' / 'intake-v2' / 'induction-cooktop' / 'views'
VIEWS = ['front', 'side', 'back', 'three-quarter']
BG = (244, 240, 235); INK = (62, 48, 68)

def fitted(path: Path, size: tuple[int, int]) -> Image.Image:
    with Image.open(path) as source: image = source.convert('RGB')
    image.thumbnail(size, Image.Resampling.LANCZOS)
    tile = Image.new('RGB', size, BG); tile.paste(image, ((size[0] - image.width) // 2, (size[1] - image.height) // 2)); return tile

def board(columns, output: Path, title: str) -> None:
    tile = (390, 293); margin = 24; header = 74; label = 26
    canvas = Image.new('RGB', (margin * 2 + len(columns) * tile[0], header + len(VIEWS) * (tile[1] + label) + margin), BG); draw = ImageDraw.Draw(canvas)
    draw.text((margin, 20), title, fill=INK, font=ImageFont.load_default(size=21))
    for column, (name, paths) in enumerate(columns):
        x = margin + column * tile[0]; draw.text((x + 8, 50), name, fill=INK, font=ImageFont.load_default(size=15))
        for row, (view, source) in enumerate(zip(VIEWS, paths, strict=True)):
            y = header + row * (tile[1] + label); canvas.paste(fitted(source, tile), (x, y)); draw.text((x + 8, y + tile[1] + 4), view, fill=INK, font=ImageFont.load_default(size=14))
    output.parent.mkdir(parents=True, exist_ok=True); canvas.save(output, optimize=True)

def animation_board(output: Path) -> None:
    phases = [('startup', '0.72'), ('climax', '3.61'), ('wind-down', '4.75')]; tile = (390, 293); margin = 24; header = 74; label = 26
    canvas = Image.new('RGB', (margin * 2 + tile[0], header + 3 * (tile[1] + label) + margin), BG); draw = ImageDraw.Draw(canvas); draw.text((margin, 20), 'SAKURA induction cooktop frozen animation alignment', fill=INK, font=ImageFont.load_default(size=21))
    for row, (phase, time) in enumerate(phases):
        y = header + row * (tile[1] + label); canvas.paste(fitted(V2 / f'active-{phase}-{time}.png', tile), (margin, y)); draw.text((margin + 8, y + tile[1] + 4), phase, fill=INK, font=ImageFont.load_default(size=14))
    output.parent.mkdir(parents=True, exist_ok=True); canvas.save(output, optimize=True)

def main() -> None:
    v1 = [V1 / f'idle-{view}.png' for view in VIEWS]; ref = [REF / f'{view}.png' for view in VIEWS]; v2 = [V2 / f'idle-{view}.png' for view in VIEWS]
    board([('v1 runtime', v1), ('conditional v1 view evidence', ref), ('v2 runtime', v2)], ART / 'final' / 'induction-cooktop-v2-delivery-board.png', 'SAKURA induction cooktop v2 delivery board')
    board([('conditional reference', ref), ('procedural v2', v2)], ART / 'review' / 'induction-cooktop-reference-v2-four-view-comparison.png', 'SAKURA induction cooktop reference / runtime')
    animation_board(ART / 'final' / 'induction-cooktop-v2-animation-board.png')
    print(ART / 'final' / 'induction-cooktop-v2-delivery-board.png')

if __name__ == '__main__': main()

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path('artifacts/appliance-v2/stand-mixer')
EVIDENCE = ROOT / 'evidence/models/stand-mixer'
FINAL = ROOT / 'final'
REVIEW = ROOT / 'review'
FINAL.mkdir(parents=True, exist_ok=True)
REVIEW.mkdir(parents=True, exist_ok=True)

def font(size):
    try:
        return ImageFont.truetype('C:/Windows/Fonts/arial.ttf', size)
    except OSError:
        return ImageFont.load_default()

def tile(path, label, size=(520, 390)):
    image = Image.open(path).convert('RGB')
    image.thumbnail(size, Image.Resampling.LANCZOS)
    canvas = Image.new('RGB', size, '#f5f0e9')
    canvas.paste(image, ((size[0]-image.width)//2, (size[1]-image.height)//2))
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((0, 0, size[0], 38), fill='#2f2935')
    draw.text((14, 9), label, fill='#fff8ed', font=font(18))
    return canvas

views = [('review-front.png', 'FRONT'), ('review-side.png', 'SIDE'), ('review-back.png', 'BACK'), ('review-three-quarter.png', 'THREE QUARTER')]
board = Image.new('RGB', (1080, 850), '#eadfe1')
draw = ImageDraw.Draw(board)
draw.text((30, 18), 'SAKURA STAND MIXER V2', fill='#2f2935', font=font(30))
draw.text((30, 56), 'conditional reference fallback / frozen runtime contract', fill='#695e6d', font=font(16))
for index, (name, label) in enumerate(views):
    board.paste(tile(EVIDENCE / name, label), (20 + index % 2 * 530, 90 + index // 2 * 380))
board.save(FINAL / 'stand-mixer-v2-delivery-board.png')

phases = [('review-head-lift.png', 'STARTUP'), ('review-powered.png', 'CLIMAX'), ('review-splash.png', 'SPLASH')]
animation = Image.new('RGB', (1600, 500), '#eadfe1')
draw = ImageDraw.Draw(animation)
draw.text((28, 16), 'STAND MIXER V2 / ANIMATION CONTACT', fill='#2f2935', font=font(28))
for index, (name, label) in enumerate(phases):
    animation.paste(tile(EVIDENCE / name, label, (510, 410)), (20 + index * 525, 70))
animation.save(FINAL / 'stand-mixer-v2-animation-board.png')

reference = tile('references/intake-v2/stand-mixer/views/three-quarter.png', 'CONDITIONAL REFERENCE', (520, 390))
render = tile(EVIDENCE / 'review-three-quarter.png', 'V2 RENDER', (520, 390))
comparison = Image.new('RGB', (1080, 450), '#eadfe1')
comparison.paste(reference, (20, 40))
comparison.paste(render, (540, 40))
comparison.save(REVIEW / 'stand-mixer-reference-v2-comparison.png')

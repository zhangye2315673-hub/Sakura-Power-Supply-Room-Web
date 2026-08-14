from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT=Path('.')
OUT=ROOT/'artifacts/appliance-v2/popcorn-machine/final'; OUT.mkdir(parents=True,exist_ok=True)
V1=ROOT/'docs/history/appliance-model-v1-2026-08-11/screenshots/models/popcorn-machine'
REF=ROOT/'references/intake-v2/popcorn-machine/views'
V2=ROOT/'artifacts/appliance-v2/popcorn-machine/evidence/models/popcorn-machine'
font=ImageFont.load_default()
def tile(path,size=(360,280)):
    image=Image.open(path).convert('RGB'); image.thumbnail(size)
    canvas=Image.new('RGB',size,'#eef1f6'); canvas.paste(image,((size[0]-image.width)//2,(size[1]-image.height)//2)); return canvas
def board(columns,rows,out,title):
    width=360*len(columns); height=44+310*len(rows); image=Image.new('RGB',(width,height),'#f7f7fb'); draw=ImageDraw.Draw(image); draw.text((14,14),title,fill='#302a38',font=font)
    for c,label in enumerate(columns): draw.text((c*360+12,32),label,fill='#655a70',font=font)
    for r,row in enumerate(rows):
        for c,path in enumerate(row): image.paste(tile(path),(c*360,44+r*310)); draw.text((c*360+12,44+r*310+284),path.stem,fill='#655a70',font=font)
    image.save(out)
views=['front','side','back','three-quarter']
board(['v1 archived','v1 fallback reference','v2 runtime'],[[V1/f'idle-{v}.png',REF/f'{v}.png',V2/f'idle-{v}.png'] for v in views],OUT/'popcorn-machine-v2-delivery-board.png','SAKURA Popcorn Machine v2 - conditional reference delivery')
phases=[('startup',0.6),('climax',2.8),('wind-down',4.75)]
board(['v1 animation','v2 animation'],[[V1/f'active-{name}-{time}.png',V2/f'active-{name}-{time}.png'] for name,time in phases],OUT/'popcorn-machine-v2-animation-board.png','Frozen animation alignment')

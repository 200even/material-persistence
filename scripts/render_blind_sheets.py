#!/usr/bin/env python3
import io
import json
import math
import os
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

manifest_path = Path(sys.argv[1] if len(sys.argv) > 1 else 'out/gate2/private/render-manifest.jsonl')
out_dir = Path(sys.argv[2] if len(sys.argv) > 2 else 'out/gate2/coding-packet')
out_dir.mkdir(parents=True, exist_ok=True)

COLS = 4
ROWS = 4
CELL_W = 360
CELL_H = 285
IMG_H = 255
PAD = 8
PER_SHEET = COLS * ROWS
UA = 'material-persistence/0.1 research calibration'
font = ImageFont.load_default()

rows = [json.loads(line) for line in manifest_path.read_text().splitlines() if line.strip()]
failures = []


def fetch_image(url, attempts=3):
    err = None
    for i in range(attempts):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'image/*'})
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = resp.read()
                ctype = resp.headers.get('content-type', '')
            if not ctype.startswith('image/'):
                raise ValueError(f'non-image content-type {ctype!r}')
            image = Image.open(io.BytesIO(data))
            image.load()
            return ImageOps.exif_transpose(image).convert('RGB')
        except Exception as e:
            err = e
            time.sleep(0.5 * (i + 1))
    raise err


def render_placeholder(index, reason='download failed'):
    im = Image.new('RGB', (CELL_W - 2*PAD, IMG_H - 2*PAD), 'white')
    d = ImageDraw.Draw(im)
    d.rectangle((0,0,im.width-1,im.height-1), outline='black')
    d.text((10, 10), f'Image {index:04d}', fill='black', font=font)
    d.text((10, 28), reason[:48], fill='black', font=font)
    return im


def fit_image(im):
    box = (CELL_W - 2*PAD, IMG_H - 2*PAD)
    thumb = ImageOps.contain(im, box, Image.Resampling.LANCZOS)
    canvas = Image.new('RGB', box, 'white')
    x = (box[0] - thumb.width)//2
    y = (box[1] - thumb.height)//2
    canvas.paste(thumb, (x,y))
    return canvas


def render_household(row):
    hid = row['blind_id']
    urls = row['source_image_urls']
    hdir = out_dir / 'households' / hid
    hdir.mkdir(parents=True, exist_ok=True)
    print(f'{hid}: rendering {len(urls)} images', flush=True)

    for sheet_no, start in enumerate(range(0, len(urls), PER_SHEET), start=1):
        batch = urls[start:start+PER_SHEET]
        results = [None] * len(batch)
        with ThreadPoolExecutor(max_workers=min(8, len(batch))) as pool:
            futs = {pool.submit(fetch_image, u): j for j,u in enumerate(batch)}
            for fut in as_completed(futs):
                j = futs[fut]
                absolute_index = start + j + 1
                try:
                    results[j] = fit_image(fut.result())
                except Exception as e:
                    failures.append((hid, absolute_index, type(e).__name__, str(e)))
                    results[j] = render_placeholder(absolute_index)

        sheet = Image.new('RGB', (COLS*CELL_W, ROWS*CELL_H), 'white')
        draw = ImageDraw.Draw(sheet)
        for j, thumb in enumerate(results):
            r, c = divmod(j, COLS)
            x, y = c*CELL_W, r*CELL_H
            sheet.paste(thumb, (x+PAD, y+PAD))
            absolute_index = start + j + 1
            draw.text((x+PAD, y+IMG_H+2), f'{absolute_index:04d}', fill='black', font=font)
            draw.rectangle((x, y, x+CELL_W-1, y+CELL_H-1), outline=(210,210,210))
        sheet.save(hdir / f'sheet-{sheet_no:03d}.jpg', quality=84, optimize=True)

    (hdir / 'packet.txt').write_text(f'blind_id={hid}\npicture_count={len(urls)}\nsheets={math.ceil(len(urls)/PER_SHEET)}\n')


for row in rows:
    render_household(row)

fail_path = out_dir / 'download-failures.tsv'
with fail_path.open('w') as f:
    f.write('blind_id\timage_index\terror_type\terror\n')
    for rec in failures:
        f.write('\t'.join(str(x).replace('\t',' ') for x in rec) + '\n')

summary = {
    'households': len(rows),
    'images_expected': sum(r['picture_count'] for r in rows),
    'download_failures': len(failures),
    'contact_sheet_cell_px': [CELL_W, CELL_H],
    'images_per_sheet': PER_SHEET,
}
(out_dir / 'render-summary.json').write_text(json.dumps(summary, indent=2) + '\n')
print(json.dumps(summary), flush=True)
if failures:
    print(f'WARNING: {len(failures)} image downloads failed; see {fail_path}', file=sys.stderr)

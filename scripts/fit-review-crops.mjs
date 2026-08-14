#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PNG } from 'pngjs';

const [sourcePath, outputPath, xArg, yArg, widthArg, heightArg, sizeArg = '800'] = process.argv.slice(2);
if (!sourcePath || !outputPath || !heightArg) {
  throw new Error('Usage: node scripts/fit-review-crops.mjs <source> <out> <x> <y> <w> <h>');
}
const source = PNG.sync.read(await readFile(sourcePath));
const crop = {
  x: Number(xArg), y: Number(yArg), width: Number(widthArg), height: Number(heightArg),
};
const size = Number(sizeArg);
const target = new PNG({ width: size, height: size });
for (let ty = 0; ty < size; ty += 1) {
  const sy = Math.min(source.height - 1, crop.y + Math.floor(ty * crop.height / size));
  for (let tx = 0; tx < size; tx += 1) {
    const sx = Math.min(source.width - 1, crop.x + Math.floor(tx * crop.width / size));
    const sourceOffset = (sy * source.width + sx) * 4;
    const targetOffset = (ty * size + tx) * 4;
    target.data[targetOffset] = source.data[sourceOffset];
    target.data[targetOffset + 1] = source.data[sourceOffset + 1];
    target.data[targetOffset + 2] = source.data[sourceOffset + 2];
    target.data[targetOffset + 3] = source.data[sourceOffset + 3];
  }
}
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, PNG.sync.write(target));
console.log(JSON.stringify({ sourcePath, outputPath, crop, size }, null, 2));

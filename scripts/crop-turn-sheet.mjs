#!/usr/bin/env node
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PNG } from 'pngjs';

const sourcePath = process.argv[2];
const outputDirectory = process.argv[3];
if (!sourcePath || !outputDirectory) {
  throw new Error('Usage: node scripts/crop-turn-sheet.mjs <turn-sheet.png> <output-directory>');
}

const source = PNG.sync.read(await readFile(sourcePath));
const widths = [Math.floor(source.width / 3), Math.floor(source.width / 3)];
widths.push(source.width - widths[0] - widths[1]);
const names = ['front', 'side', 'back'];
let sourceX = 0;
await mkdir(outputDirectory, { recursive: true });

for (let panelIndex = 0; panelIndex < 3; panelIndex += 1) {
  const width = widths[panelIndex];
  const target = new PNG({ width, height: source.height });
  PNG.bitblt(source, target, sourceX, 0, width, source.height, 0, 0);
  const targetPath = path.join(outputDirectory, `${names[panelIndex]}.png`);
  await writeFile(targetPath, PNG.sync.write(target));
  sourceX += width;
}

console.log(JSON.stringify({ sourcePath, outputDirectory, width: source.width, height: source.height, panels: names }, null, 2));

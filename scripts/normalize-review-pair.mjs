#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PNG } from 'pngjs';

const [referencePath, renderPath, outputDirectory] = process.argv.slice(2);
if (!referencePath || !renderPath || !outputDirectory) {
  throw new Error('Usage: node scripts/normalize-review-pair.mjs <reference.png> <render.png> <output-directory>');
}

const TARGET_SIZE = 720;
const TARGET_HEIGHT = 640;

function colorDistance(a, b) {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function backgroundColor(image) {
  const channels = [[], [], []];
  for (let index = 0; index < 32; index += 1) {
    const x = Math.round((image.width - 1) * index / 31);
    const y = Math.round((image.height - 1) * index / 31);
    for (const [sampleX, sampleY] of [[x, 2], [x, image.height - 3], [2, y], [image.width - 3, y]]) {
      const offset = (sampleY * image.width + sampleX) * 4;
      channels[0].push(image.data[offset]);
      channels[1].push(image.data[offset + 1]);
      channels[2].push(image.data[offset + 2]);
    }
  }
  return channels.map((values) => values.sort((a, b) => a - b)[Math.floor(values.length / 2)]);
}

function foregroundBounds(image, threshold = 52) {
  const background = backgroundColor(image);
  let minX = image.width;
  let minY = image.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const offset = (y * image.width + x) * 4;
      const pixel = [image.data[offset], image.data[offset + 1], image.data[offset + 2]];
      if (image.data[offset + 3] < 16 || colorDistance(pixel, background) < threshold) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < minX || maxY < minY) throw new Error('Unable to detect foreground object.');
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1, background };
}

function normalize(image, bounds) {
  const output = new PNG({ width: TARGET_SIZE, height: TARGET_SIZE });
  for (let pixel = 0; pixel < TARGET_SIZE * TARGET_SIZE; pixel += 1) {
    output.data[pixel * 4] = bounds.background[0];
    output.data[pixel * 4 + 1] = bounds.background[1];
    output.data[pixel * 4 + 2] = bounds.background[2];
    output.data[pixel * 4 + 3] = 255;
  }
  const scale = TARGET_HEIGHT / bounds.height;
  const width = Math.max(1, Math.round(bounds.width * scale));
  const height = TARGET_HEIGHT;
  const startX = Math.round((TARGET_SIZE - width) * 0.5);
  const startY = Math.round((TARGET_SIZE - height) * 0.5);
  for (let targetY = 0; targetY < height; targetY += 1) {
    const sourceY = bounds.y + Math.min(bounds.height - 1, Math.floor(targetY / scale));
    for (let targetX = 0; targetX < width; targetX += 1) {
      const sourceX = bounds.x + Math.min(bounds.width - 1, Math.floor(targetX / scale));
      const destinationX = startX + targetX;
      const destinationY = startY + targetY;
      if (destinationX < 0 || destinationX >= TARGET_SIZE) continue;
      const sourceOffset = (sourceY * image.width + sourceX) * 4;
      const destinationOffset = (destinationY * TARGET_SIZE + destinationX) * 4;
      output.data.set(image.data.subarray(sourceOffset, sourceOffset + 4), destinationOffset);
    }
  }
  return output;
}

const reference = PNG.sync.read(await readFile(referencePath));
const render = PNG.sync.read(await readFile(renderPath));
const referenceBounds = foregroundBounds(reference);
const renderBounds = foregroundBounds(render);
await mkdir(outputDirectory, { recursive: true });
await writeFile(path.join(outputDirectory, 'reference-normalized.png'), PNG.sync.write(normalize(reference, referenceBounds)));
await writeFile(path.join(outputDirectory, 'render-normalized.png'), PNG.sync.write(normalize(render, renderBounds)));
await writeFile(path.join(outputDirectory, 'normalization.json'), JSON.stringify({ referenceBounds, renderBounds }, null, 2));
console.log(JSON.stringify({ referenceBounds, renderBounds }, null, 2));

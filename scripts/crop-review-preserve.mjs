#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { PNG } from 'pngjs';

const [sourcePath, outputPath, xArg, yArg, widthArg, heightArg] = process.argv.slice(2);
if (!heightArg) throw new Error('Usage: crop-review-preserve.mjs <source> <out> <x> <y> <width> <height>');
const source = PNG.sync.read(await readFile(sourcePath));
const x = Number(xArg);
const y = Number(yArg);
const width = Number(widthArg);
const height = Number(heightArg);
const target = new PNG({ width, height });
PNG.bitblt(source, target, x, y, width, height, 0, 0);
await writeFile(outputPath, PNG.sync.write(target));
console.log(JSON.stringify({ sourcePath, outputPath, x, y, width, height }));

import { readFile, writeFile } from 'node:fs/promises';
import { basename, extname, resolve } from 'node:path';

function parseArgs(argv) {
  const options = { images: [], model: 'gpt-image-2', size: '2048x2048', quality: 'high' };
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (flag === '--image') {
      options.images.push(value);
      index += 1;
    } else if (flag === '--prompt-file') {
      options.promptFile = value;
      index += 1;
    } else if (flag === '--out') {
      options.out = value;
      index += 1;
    } else if (flag === '--model') {
      options.model = value;
      index += 1;
    } else if (flag === '--size') {
      options.size = value;
      index += 1;
    } else if (flag === '--quality') {
      options.quality = value;
      index += 1;
    } else {
      throw new Error(`Unknown or incomplete argument: ${flag}`);
    }
  }
  if (!options.promptFile || !options.out || options.images.length === 0) {
    throw new Error('Required: --prompt-file, --out, and at least one --image');
  }
  return options;
}

function mimeTypeFor(path) {
  const extension = extname(path).toLowerCase();
  if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg';
  if (extension === '.webp') return 'image/webp';
  return 'image/png';
}

async function fetchWithRetry(url, attempts = 4) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fetch(url);
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 1500 * (2 ** (attempt - 1))));
    }
  }
  throw lastError;
}

const options = parseArgs(process.argv.slice(2));
const apiKey = process.env.OPENAI_API_KEY;
const baseUrl = (process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1').replace(/\/$/, '');
if (!apiKey) throw new Error('OPENAI_API_KEY is required');

const form = new FormData();
form.set('model', options.model);
form.set('prompt', await readFile(resolve(options.promptFile), 'utf8'));
form.set('size', options.size);
form.set('quality', options.quality);
form.set('output_format', 'png');

for (const imagePath of options.images) {
  const absolutePath = resolve(imagePath);
  const bytes = await readFile(absolutePath);
  form.append('image', new Blob([bytes], { type: mimeTypeFor(absolutePath) }), basename(absolutePath));
}

const response = await fetch(`${baseUrl}/images/edits`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${apiKey}` },
  body: form,
});
if (!response.ok) {
  throw new Error(`Image API failed (${response.status}): ${await response.text()}`);
}

const payload = await response.json();
const result = payload?.data?.[0];
if (!result) throw new Error('Image API returned no image data');
await writeFile(`${resolve(options.out)}.response.json`, `${JSON.stringify({
  model: options.model,
  size: options.size,
  quality: options.quality,
  receivedAt: new Date().toISOString(),
  result,
}, null, 2)}\n`);

let outputBytes;
if (result.b64_json) {
  outputBytes = Buffer.from(result.b64_json, 'base64');
} else if (result.url) {
  const download = await fetchWithRetry(result.url);
  if (!download.ok) throw new Error(`Image download failed (${download.status})`);
  outputBytes = Buffer.from(await download.arrayBuffer());
} else {
  throw new Error('Image API returned neither b64_json nor url');
}

await writeFile(resolve(options.out), outputBytes);
console.log(JSON.stringify({
  model: options.model,
  size: options.size,
  quality: options.quality,
  inputCount: options.images.length,
  output: resolve(options.out),
  bytes: outputBytes.byteLength,
}, null, 2));

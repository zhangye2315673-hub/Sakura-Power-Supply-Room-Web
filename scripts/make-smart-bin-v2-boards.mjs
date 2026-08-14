import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';

const root = process.cwd();
const output = path.resolve('artifacts/appliance-v2/smart-bin/final');
const review = path.resolve('artifacts/appliance-v2/smart-bin/review');
await mkdir(output, { recursive: true });
await mkdir(review, { recursive: true });

const dataUrl = async (relative) => `data:image/png;base64,${(await readFile(path.resolve(relative))).toString('base64')}`;
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1040 }, deviceScaleFactor: 1 });

async function board(title, columns, rows, destination) {
  const cells = [];
  for (const row of rows) {
    for (const source of row.sources) cells.push({ row: row.label, source: await dataUrl(source) });
  }
  await page.setContent(`<!doctype html><html><head><style>
    *{box-sizing:border-box}html,body{margin:0;background:#e9edf4;color:#40384b;font-family:Arial,sans-serif}
    main{width:1600px;height:1040px;padding:30px 36px 38px;display:grid;grid-template-rows:54px 1fr;gap:18px}
    h1{margin:0;font-size:28px;letter-spacing:0;font-weight:700}.grid{display:grid;grid-template-columns:88px repeat(${columns.length},1fr);grid-template-rows:34px repeat(${rows.length},1fr);gap:10px}
    .label{display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:700;color:#67576f}.cell{background:#eef2f8;border:1px solid #cbd2dd;overflow:hidden;position:relative}
    img{width:100%;height:100%;object-fit:cover;display:block}.corner{font-size:12px;color:#8a7e90}
  </style></head><body><main><h1>${title}</h1><div class="grid"><div></div>${columns.map((c)=>`<div class="label">${c}</div>`).join('')}${rows.map((r)=>`<div class="label">${r.label}</div>${r.sources.map(()=>'<div class="cell"></div>').join('')}`).join('')}</div></main></body></html>`);
  await page.evaluate((cells) => {
    const targets = [...document.querySelectorAll('.cell')];
    targets.forEach((target, index) => {
      const image = document.createElement('img');
      image.src = cells[index].source;
      target.append(image);
    });
  }, cells);
  await page.waitForFunction(() => [...document.images].every((image) => image.complete && image.naturalWidth > 0));
  await page.screenshot({ path: destination });
}

const history = 'docs/history/appliance-model-v1-2026-08-11/screenshots/models/smart-bin';
const evidence = 'artifacts/appliance-v2/smart-bin/evidence/models/smart-bin';
const views = ['front', 'side', 'back', 'three-quarter'];
await board('SAKURA Smart Bin v1 / v2 Static Comparison', views, [
  { label: 'v1', sources: views.map((view) => `${history}/idle-${view}.png`) },
  { label: 'v2', sources: views.map((view) => `${evidence}/render-off-${view}.png`) },
], path.join(output, 'smart-bin-v2-delivery-board.png'));

const phases = [
  ['startup', 'active-startup-0.6.png', 'render-startup-three-quarter.png'],
  ['climax', 'active-climax-2.8.png', 'render-climax-three-quarter.png'],
  ['wind-down', 'active-wind-down-4.75.png', 'render-wind-down-three-quarter.png'],
];
await board('SAKURA Smart Bin v1 / v2 Animation Contact', phases.map(([name]) => name), [
  { label: 'v1', sources: phases.map(([, old]) => `${history}/${old}`) },
  { label: 'v2', sources: phases.map(([, , current]) => `${evidence}/${current}`) },
], path.join(output, 'smart-bin-v2-animation-board.png'));

await board('SAKURA Smart Bin Conditional Reference / v2 Review', views, [
  { label: 'reference', sources: views.map((view) => `references/intake-v2/smart-bin/views/${view}.png`) },
  { label: 'render', sources: views.map((view) => `${evidence}/render-off-${view}.png`) },
], path.join(review, 'smart-bin-reference-v2-four-view-comparison.png'));

await browser.close();
console.log(JSON.stringify({ root, output, review, boards: 3 }, null, 2));

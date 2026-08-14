import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const baseUrl = process.env.MODEL_REVIEW_URL ?? 'http://127.0.0.1:5190';
const out = process.env.STAND_MIXER_REVIEW_OUT ?? 'artifacts/img2threejs/stand-mixer';
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
for (const view of ['front', 'side', 'back', 'three-quarter']) {
  await page.goto(`${baseUrl}/model-review.html?model=stand-mixer&view=${view}&spin=0&power=0`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__MODEL_REVIEW_DIAGNOSTICS__?.ready === true);
  await page.waitForTimeout(500);
  await page.locator('#model-review-canvas').screenshot({ path: `${out}/review-${view}.png` });
}
await page.goto(`${baseUrl}/model-review.html?model=stand-mixer&view=three-quarter&spin=0&power=1`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__MODEL_REVIEW_DIAGNOSTICS__?.ready === true);
await page.evaluate(() => window.__MODEL_REVIEW_SET_VIEW__?.('side'));
await page.evaluate(() => window.__MODEL_REVIEW_SET_POWER__?.(true));
await page.waitForTimeout(500);
await page.locator('#model-review-canvas').screenshot({ path: `${out}/review-head-lift.png` });
await page.evaluate(() => window.__MODEL_REVIEW_SET_VIEW__?.('three-quarter'));
await page.evaluate(() => window.__MODEL_REVIEW_SET_POWER__?.(true));
await page.waitForTimeout(2700);
await page.locator('#model-review-canvas').screenshot({ path: `${out}/review-powered.png` });
await page.evaluate(() => window.__MODEL_REVIEW_SET_POWER__?.(false));
await page.evaluate(() => window.__MODEL_REVIEW_SET_POWER__?.(true));
await page.waitForTimeout(1900);
await page.locator('#model-review-canvas').screenshot({ path: `${out}/review-splash.png` });
const diagnostics = await page.evaluate(() => window.__MODEL_REVIEW_DIAGNOSTICS__);
const resetCheck = await page.evaluate(async () => {
  const { createStandMixerModel } = await import('/src/appliances/models/standMixer.ts');
  const { createApplianceMechanicalAnimation } = await import('/src/appliances/performance/ApplianceMechanics.ts');
  const model = createStandMixerModel({ id: 'stand-mixer-reset-check', accent: 0xe8a7b7 });
  const animation = createApplianceMechanicalAnimation('stand-mixer', model.root);
  const names = [
    'stand-mixer-motor-head-pivot',
    'stand-mixer-head-release-lever-pivot',
    'stand-mixer-front-speed-dial-pivot',
    'stand-mixer-lower-control-dial-pivot',
    'stand-mixer-planetary-pivot',
    'stand-mixer-beater-spin-pivot',
    'stand-mixer-mixture-pivot',
  ];
  const nodes = model.root.userData.sculptRuntime.nodes;
  const snapshot = () => names.map((name) => ({
    name,
    position: nodes[name].position.toArray(),
    rotation: [nodes[name].rotation.x, nodes[name].rotation.y, nodes[name].rotation.z],
    scale: nodes[name].scale.toArray(),
  }));
  const before = snapshot();
  animation.update(0.5, 1);
  const headCue = snapshot();
  animation.stop();
  const afterHeadCue = snapshot();
  animation.update(2.7, 1);
  const during = snapshot();
  animation.stop();
  const after = snapshot();
  return {
    headCueMovedNodes: names.filter((_, i) => JSON.stringify(before[i]) !== JSON.stringify(headCue[i])),
    movedNodes: names.filter((_, i) => JSON.stringify(before[i]) !== JSON.stringify(during[i])),
    exactReset: JSON.stringify(before) === JSON.stringify(afterHeadCue) && JSON.stringify(before) === JSON.stringify(after),
  };
});
await browser.close();
console.log(JSON.stringify({ diagnostics, resetCheck, errors }, null, 2));
if (errors.length) process.exit(1);

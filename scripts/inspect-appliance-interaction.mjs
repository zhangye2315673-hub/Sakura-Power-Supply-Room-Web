#!/usr/bin/env node
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const url = process.argv[2] ?? 'http://127.0.0.1:4173/';
const outputDirectory = process.argv[3] ?? 'artifacts/appliance-interaction';
await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch();
const viewportWidth = Number(process.env.APPLIANCE_VIEWPORT_WIDTH ?? 1280);
const viewportHeight = Number(process.env.APPLIANCE_VIEWPORT_HEIGHT ?? 720);
const page = await browser.newPage({ viewport: { width: viewportWidth, height: viewportHeight } });
const consoleErrors = [];
const pageErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => pageErrors.push(error.message));

await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true, null, {
  timeout: 90_000,
});
await page.click('#start-game-button');
await page.waitForFunction(
  () => {
    const opening = window.__THREE_GAME_DIAGNOSTICS__?.opening;
    return opening?.active === false && opening.cameraPhase === 'idle';
  },
  null,
  { timeout: 35_000 },
);

const canvas = page.locator('#game-canvas');
const box = await canvas.boundingBox();
if (!box) throw new Error('Missing game canvas bounds.');
const before = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.appliances[0] ?? null);
if (!before) throw new Error('Missing appliance diagnostics.');
const startX = box.x + before.screenX * box.width;
const startY = box.y + before.screenY * box.height;

await page.mouse.click(startX, startY);
await page.waitForTimeout(320);
const afterClick = await page.evaluate(
  (id) => window.__THREE_GAME_DIAGNOSTICS__?.appliances.find((item) => item.id === id) ?? null,
  before.id,
);
await page.screenshot({ path: path.join(outputDirectory, 'after-click.png') });

await page.mouse.move(startX, startY);
await page.mouse.down();
await page.waitForFunction(
  (id) => window.__THREE_GAME_DIAGNOSTICS__?.appliances.find((item) => item.id === id)?.dragging === true,
  before.id,
  { timeout: 2_000 },
);
const afterHold = await page.evaluate(
  (id) => window.__THREE_GAME_DIAGNOSTICS__?.appliances.find((item) => item.id === id) ?? null,
  before.id,
);
const direction = before.screenX < 0.5 ? 1 : -1;
await page.mouse.move(startX + direction * 150, startY - 46, { steps: 12 });
const afterMove = await page.evaluate(
  (id) => window.__THREE_GAME_DIAGNOSTICS__?.appliances.find((item) => item.id === id) ?? null,
  before.id,
);
await page.mouse.up();

const frames = [];
const sampledFrames = await page.evaluate(async (id) => new Promise((resolve) => {
  const samples = [];
  const startedAt = performance.now();
  const sample = () => {
    const frame = window.__THREE_GAME_DIAGNOSTICS__?.appliances.find((item) => item.id === id) ?? null;
    if (!frame) {
      resolve(samples);
      return;
    }
    samples.push({
      dropping: frame.dropping,
      dropOffset: frame.dropOffset,
      rootScreenY: frame.rootScreenY,
      deformPull: frame.deformPull,
      landingSway: frame.landingSway,
      landingTilt: frame.landingTilt,
      landingImpactCount: frame.landingImpactCount,
      landingContactSide: frame.landingContactSide,
      screenX: frame.screenX,
      screenY: frame.screenY,
      instanceId: frame.instanceId,
    });
    if (!frame.dropping || performance.now() - startedAt > 8_000) {
      resolve(samples);
      return;
    }
    requestAnimationFrame(sample);
  };
  requestAnimationFrame(sample);
}), before.id);
frames.push(...sampledFrames);

const settled = await page.evaluate(
  (id) => window.__THREE_GAME_DIAGNOSTICS__?.appliances.find((item) => item.id === id) ?? null,
  before.id,
);
await page.screenshot({ path: path.join(outputDirectory, 'settled.png') });

const clickStayedStill = Boolean(
  afterClick
  && Math.abs(afterClick.screenX - before.screenX) < 0.0005
  && Math.abs(afterClick.screenY - before.screenY) < 0.0005
  && !afterClick.dragging
  && !afterClick.dropping
  && afterClick.deformPull < 0.002,
);
const holdActivatedDrag = Boolean(afterHold?.dragging);
const bodyMoved = Boolean(
  afterMove
  && Math.hypot(afterMove.screenX - before.screenX, afterMove.screenY - before.screenY) > 0.02,
);
const offsets = frames.filter((frame) => frame.dropping).map((frame) => frame.dropOffset);
const peakIndex = offsets.indexOf(Math.max(...offsets));
const afterPeak = offsets.slice(Math.max(0, peakIndex));
const expectedDropDistance = 1.08;
const recoveredIndex = afterPeak.findIndex(
  (value, index) => index > 0 && value > expectedDropDistance - 0.03,
);
const afterRecovery = recoveredIndex >= 0 ? afterPeak.slice(recoveredIndex) : [];
const finalDroppingFrame = [...frames].reverse().find((frame) => frame.dropping);
const observedTravel = Math.max(...frames.map((frame) => frame.rootScreenY)) -
  Math.min(...frames.map((frame) => frame.rootScreenY));
const settleGap = finalDroppingFrame && settled
  ? Math.abs(settled.rootScreenY - finalDroppingFrame.rootScreenY)
  : Number.POSITIVE_INFINITY;
const bounceDipObserved = Math.min(...afterPeak) < expectedDropDistance - 0.03;
const swaySigns = frames
  .map((frame) => frame.landingSway)
  .filter((value) => Math.abs(value) > 0.002)
  .map((value) => Math.sign(value));
const swaySignChanges = swaySigns.reduce(
  (count, sign, index) => count + (index > 0 && sign !== swaySigns[index - 1] ? 1 : 0),
  0,
);
const reboundFrames = frames.filter((frame) => frame.landingImpactCount > 0);
const impactCounts = [...new Set(reboundFrames.map((frame) => frame.landingImpactCount))];
const contactSides = [1, 2, 3, 4, 5].map(
  (impact) => reboundFrames.find((frame) => frame.landingImpactCount === impact)?.landingContactSide ?? 0,
);
const reboundPeaks = [1, 2, 3, 4, 5].map((impact) => Math.max(
  ...reboundFrames
    .filter((frame) => frame.landingImpactCount === impact)
    .map((frame) => -frame.dropOffset),
));
const alternatingContacts = contactSides.every(
  (side, index) => side !== 0 && (index === 0 || side === -contactSides[index - 1]),
);
const decayingRebounds = reboundPeaks.every(
  (peak, index) => index === 0 || peak < reboundPeaks[index - 1] * 0.85,
);
const groundAnchor = reboundFrames[0];
const stableGroundAnchor = Boolean(
  groundAnchor
  && settled
  && reboundFrames.every(
    (frame) => Math.abs(frame.screenX - groundAnchor.screenX) < 0.00001
      && Math.abs(frame.screenY - groundAnchor.screenY) < 0.00001,
  )
  && Math.abs(settled.screenX - groundAnchor.screenX) < 0.00001
  && Math.abs(settled.screenY - groundAnchor.screenY) < 0.00001,
);
const singleModelInstance = new Set([
  ...frames.map((frame) => frame.instanceId),
  settled?.instanceId,
].filter(Boolean)).size === 1;
const singleLandingBounce =
  observedTravel > 0.02
  && settleGap < 0.018;
const settledCleanly = Boolean(
  settled
  && !settled.dragging
  && !settled.dropping
  && settled.deformPull < 0.002,
);

const report = {
  url,
  targetId: before.id,
  clickStayedStill,
  holdActivatedDrag,
  bodyMoved,
  singleLandingBounce,
  settledCleanly,
  expectedDropDistance,
  maxObservedDropOffset: Math.max(...offsets),
  minAfterPeak: Math.min(...afterPeak),
  bounceDipObserved,
  swaySignChanges,
  impactCounts,
  contactSides,
  reboundPeaks,
  alternatingContacts,
  decayingRebounds,
  stableGroundAnchor,
  singleModelInstance,
  observedTravel,
  settleGap,
  sampledFrames: frames.length,
  before,
  afterClick,
  afterHold,
  afterMove,
  settled,
  consoleErrors,
  pageErrors,
};
await writeFile(path.join(outputDirectory, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
await browser.close();
console.log(JSON.stringify(report, null, 2));

if (
  !clickStayedStill
  || !holdActivatedDrag
  || !bodyMoved
  || !singleLandingBounce
  || impactCounts.length !== 5
  || !alternatingContacts
  || !decayingRebounds
  || !stableGroundAnchor
  || !singleModelInstance
  || !settledCleanly
  || consoleErrors.length > 0
  || pageErrors.length > 0
) {
  process.exitCode = 1;
}

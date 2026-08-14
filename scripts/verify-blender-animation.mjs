import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { PNG } from 'pngjs';

const outputDirectory = 'artifacts/img2threejs/blender/interaction-timeline';
await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ args: ['--use-angle=swiftshader-webgl', '--enable-webgl'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
page.on('pageerror', (error) => errors.push(error.message));

async function waitForRenderedState(predicate, argument) {
  await page.waitForFunction(predicate, argument);
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let remainingFrames = 4;
      const waitForFrame = () => {
        remainingFrames -= 1;
        if (remainingFrames === 0) resolve();
        else requestAnimationFrame(waitForFrame);
      };
      requestAnimationFrame(waitForFrame);
    });
  });
}

await page.goto('http://127.0.0.1:5190/model-review.html?model=blender&view=front&power=0&spin=0', { waitUntil: 'domcontentloaded' });
await waitForRenderedState(() => {
  const diagnostics = window.__MODEL_REVIEW_DIAGNOSTICS__;
  return diagnostics?.ready === true
    && diagnostics.power === 0
    && diagnostics.animationSignal === 0
    && Number(diagnostics.drawCalls) > 0
    && Number(diagnostics.triangles) > 0;
});
const canvas = page.locator('#model-review-canvas');
const baseline = await canvas.screenshot({ path: `${outputDirectory}/render-idle-before.png` });
const resetNodeNames = [
  'blender-motor-base-pivot',
  'blender-removable-jar-pivot',
  'blender-removable-lid-pivot',
  'blender-whole-fruit-pivot',
  'blender-cut-fruit-chunk-pivot',
  'blender-powered-liquid-vortex-pivot',
  'blender-powered-rising-smoothie-volume',
  'blender-powered-smoothie-concave-surface',
];
const baselineNodeState = await page.evaluate(
  (names) => window.__MODEL_REVIEW_GET_NODE_STATE__?.(names),
  resetNodeNames,
);

async function captureMoment(time, filename) {
  await page.evaluate((moment) => {
    window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = moment;
    window.__MODEL_REVIEW_SET_POWER__?.(true);
  }, time);
  await waitForRenderedState((moment) => {
    const diagnostics = window.__MODEL_REVIEW_DIAGNOSTICS__;
    const elapsed = diagnostics?.performance?.elapsedByKind?.blender;
    return diagnostics?.ready === true
      && diagnostics.power > 0.9
      && Math.abs(Number(elapsed) - moment) < 0.015;
  }, time);
  await canvas.screenshot({ path: `${outputDirectory}/${filename}` });
  return page.evaluate(() => window.__MODEL_REVIEW_DIAGNOSTICS__);
}

const chopDiagnostics = await captureMoment(1.15, 'render-chop-1.15s.png');
const blendDiagnostics = await captureMoment(2.45, 'render-blend-2.45s.png');
const climaxDiagnostics = await captureMoment(3.45, 'render-climax-3.45s.png');
const settleDiagnostics = await captureMoment(4.24, 'render-settle-4.24s.png');

await page.evaluate(() => {
  delete window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__;
  window.__MODEL_REVIEW_SET_POWER__?.(false);
});
await waitForRenderedState(() => {
  const diagnostics = window.__MODEL_REVIEW_DIAGNOSTICS__;
  return diagnostics?.ready === true
    && diagnostics.power === 0
    && diagnostics.animationSignal === 0
    && Number(diagnostics.drawCalls) > 0
    && Number(diagnostics.triangles) > 0;
});
const reset = await canvas.screenshot({ path: `${outputDirectory}/render-idle-after.png` });
const resetDiagnostics = await page.evaluate(() => window.__MODEL_REVIEW_DIAGNOSTICS__);
const resetNodeState = await page.evaluate(
  (names) => window.__MODEL_REVIEW_GET_NODE_STATE__?.(names),
  resetNodeNames,
);

const beforePng = PNG.sync.read(baseline);
const afterPng = PNG.sync.read(reset);
let differingPixels = 0;
let maxChannelDelta = 0;
for (let index = 0; index < beforePng.data.length; index += 4) {
  let pixelDelta = 0;
  for (let channel = 0; channel < 4; channel += 1) {
    pixelDelta = Math.max(pixelDelta, Math.abs(beforePng.data[index + channel] - afterPng.data[index + channel]));
  }
  if (pixelDelta > 0) differingPixels += 1;
  maxChannelDelta = Math.max(maxChannelDelta, pixelDelta);
}

await browser.close();
const report = {
  chopDiagnostics,
  blendDiagnostics,
  climaxDiagnostics,
  settleDiagnostics,
  resetDiagnostics,
  exactNodeReset: JSON.stringify(baselineNodeState) === JSON.stringify(resetNodeState),
  baselineNodeState,
  resetNodeState,
  resetPixelComparison: {
    width: beforePng.width,
    height: beforePng.height,
    differingPixels,
    differingFraction: differingPixels / (beforePng.width * beforePng.height),
    maxChannelDelta,
    exact: differingPixels === 0,
  },
  errors,
};
const chop = chopDiagnostics?.performance?.blender?.mechanics;
const blend = blendDiagnostics?.performance?.blender?.mechanics;
const climax = climaxDiagnostics?.performance?.blender;
const climaxSplash = climax?.splash;
const settle = settleDiagnostics?.performance?.blender?.mechanics;
const assertions = {
  chopPhase: chop?.phase === 'chop',
  chopHasWholeAndChunks: Number(chop?.wholeFruitScale) > 0.35 && Number(chop?.chunkScale) > 0.05,
  blendJuiceAboveHalf: Number(blend?.juiceFill) > 0.55,
  blendFruitMostlyProcessed: Number(blend?.wholeFruitScale) < 0.2,
  climaxAtSharedEvidenceTime: Math.abs(Number(climax?.mechanics?.timelineTime) - 3.45) < 0.015,
  climaxLidLifted: Number(climax?.mechanics?.lidLift) > 0.25,
  climaxJuiceNearFull: Number(climax?.mechanics?.juiceFill) > 0.9,
  climaxUsesMouthSocket: climaxSplash?.sourceSocket === 'blender-splash-mouth-socket',
  climaxHasVolumetricDrops: Number(climaxSplash?.activeDroplets) >= 6,
  climaxHasVolumetricSplashes: Number(climaxSplash?.activeSplashes) >= 3,
  climaxHasGeometryVariation: (climaxSplash?.geometryVariants?.length ?? 0) >= 3,
  legacyMixerEffectsInactive: Number(climaxDiagnostics?.performance?.activeByKind?.drop) === 0
    && Number(climaxDiagnostics?.performance?.activeByKind?.sheet) === 0,
  lidReturnedToSeat: Number(settle?.lidLift) < 0.015,
  exactNodeReset: report.exactNodeReset,
  idleSignalReset: resetDiagnostics?.animationSignal === 0,
};
report.assertions = assertions;
await writeFile(`${outputDirectory}/animation-report.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ assertions, resetPixelComparison: report.resetPixelComparison, errors }, null, 2));
if (errors.length > 0 || Object.values(assertions).some((value) => !value)) process.exit(1);

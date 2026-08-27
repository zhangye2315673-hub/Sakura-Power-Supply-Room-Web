import { writeFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { PNG } from 'pngjs';

const ASSETS = [
  'humidifier-glass-wiper', 'fan-airflow-ribbon',
  'hair-dryer-heat-ribbon',
  'bubble-shell-wave-membrane', 'radio-sequence-markers', 'kettle-steam-ribbon',
  'blender-energy-shards', 'gacha-card-frame',
  'alarm-time-ring', 'popcorn-target-marker',
  'controller-continue-token', 'controller-impact-star', 'microwave-double-heat-ring',
  'induction-heat-ring', 'speaker-bass-wave-arcs',
] as const;

test('all generated skill effect assets instantiate with runtime sockets', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  await page.addInitScript(() => {
    window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 1;
  });
  await page.goto('/?mode=skill&direct=1&seed=20260812');
  await page.waitForFunction(
    () => typeof window.__SHOW_SKILL_EFFECT_FOR_EVIDENCE__ === 'function',
    null,
    { timeout: 90_000 },
  );

  for (const asset of ASSETS) {
    expect(await page.evaluate((id) => window.__SHOW_SKILL_EFFECT_FOR_EVIDENCE__?.(id), asset)).toBe(true);
    await page.waitForTimeout(30);
  }

  expect(await page.evaluate(() => (
    window.__SHOW_SKILL_EFFECT_FOR_EVIDENCE__?.('record-note-orb-ring') ?? false
  ))).toBe(false);
  expect(await page.evaluate(() => window.__SHOW_SKILL_EFFECT_FOR_EVIDENCE__?.('missing-asset'))).toBe(false);
  const screenshot = await page.locator('#game-canvas').screenshot();
  writeFileSync(testInfo.outputPath('skill-effect-assets.png'), screenshot);
  const image = PNG.sync.read(screenshot);
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (let index = 0; index < image.width * image.height; index += 1) {
    const offset = index * 4;
    const value = image.data[offset] + image.data[offset + 1] + image.data[offset + 2];
    min = Math.min(min, value);
    max = Math.max(max, value);
  }
  expect(max - min).toBeGreaterThan(120);
});

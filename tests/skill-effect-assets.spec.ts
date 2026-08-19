import { expect, test } from '@playwright/test';
import { PNG } from 'pngjs';

const ASSETS = [
  'humidifier-glass-wiper', 'fan-airflow-ribbon',
  'dehumidifier-shield-droplets', 'hair-dryer-heat-ribbon',
  'bubble-shell-wave-membrane', 'radio-sequence-markers', 'kettle-steam-ribbon',
  'blender-energy-shards', 'gacha-card-frame', 'record-note-orb-ring',
  'alarm-time-ring', 'popcorn-heart-crown', 'stand-mixer-status-token',
  'controller-continue-token', 'controller-impact-star', 'microwave-double-heat-ring',
  'induction-heat-ring', 'speaker-bass-wave-arcs',
] as const;

test('all generated skill effect assets instantiate with runtime sockets', async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  await page.addInitScript(() => {
    window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 1;
  });
  await page.goto('/?mode=skill&direct=1&seed=20260812');
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true
      && typeof window.__SHOW_SKILL_EFFECT_FOR_EVIDENCE__ === 'function',
    null,
    { timeout: 90_000 },
  );
  await page.click('#start-game-button');
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.opening.active === false,
    null,
    { timeout: 90_000 },
  );

  for (const asset of ASSETS) {
    expect(await page.evaluate((id) => window.__SHOW_SKILL_EFFECT_FOR_EVIDENCE__?.(id), asset)).toBe(true);
    await page.waitForTimeout(30);
    await page.locator('#game-canvas').screenshot({ path: testInfo.outputPath(`${asset}.png`) });
  }

  expect(await page.evaluate(() => window.__SHOW_SKILL_EFFECT_FOR_EVIDENCE__?.('missing-asset'))).toBe(false);
  const image = PNG.sync.read(await page.locator('#game-canvas').screenshot());
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (let index = 0; index < image.width * image.height; index += 1) {
    const offset = index * 4;
    const value = image.data[offset] + image.data[offset + 1] + image.data[offset + 2];
    min = Math.min(min, value);
    max = Math.max(max, value);
  }
  expect(max - min).toBeGreaterThan(120);
  await page.screenshot({ path: testInfo.outputPath('skill-effect-assets.png'), fullPage: true });
});

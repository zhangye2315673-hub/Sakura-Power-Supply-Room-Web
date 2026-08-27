import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5190';
const output = new URL('../references/skill-effects/review/', import.meta.url);
const hudOnly = process.argv.includes('--hud-only');
const assetArgIndex = process.argv.indexOf('--asset');
const assets = [
  'humidifier-glass-wiper', 'fan-airflow-ribbon',
  'dehumidifier-shield-droplets', 'refrigerator-ice-shell', 'hair-dryer-heat-ribbon',
  'bubble-shell-wave-membrane', 'radio-sequence-markers', 'kettle-steam-ribbon',
  'blender-energy-shards', 'gacha-card-frame', 'record-note-orb-ring',
  'alarm-time-ring', 'popcorn-target-marker',
  'controller-continue-token', 'controller-impact-star', 'microwave-double-heat-ring',
  'induction-heat-ring', 'speaker-bass-wave-arcs',
];
const selectedAssets = assetArgIndex >= 0 ? [process.argv[assetArgIndex + 1]] : assets;

await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
if (!hudOnly) {
  await page.addInitScript(() => { window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 1; });
  await page.goto(`${baseUrl}/?mode=skill&direct=1&seed=20260812`);
  await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true, null, { timeout: 90_000 });
  const finishedOpening = await page.evaluate(() => window.__FINISH_OPENING_FOR_EVIDENCE__?.() ?? false);
  if (!finishedOpening) await page.click('#start-game-button');
  await page.waitForFunction(() => {
    const opening = window.__THREE_GAME_DIAGNOSTICS__?.opening;
    return opening?.active === false && opening.transitioning === false;
  }, null, { timeout: 90_000 });
  await page.waitForTimeout(900);
  await page.evaluate((id) => window.__SHOW_SKILL_EFFECT_FOR_EVIDENCE__?.(id, 0), assets[0]);
  await page.waitForTimeout(700);

  for (const asset of selectedAssets) {
    const views = assetArgIndex >= 0
      ? [['front', 0], ['left', -0.62], ['right', 0.62]]
      : [['front', 0], ['left', -0.62], ['right', 0.62]];
    for (const [view, yaw] of views) {
      const shown = await page.evaluate(({ id, yaw }) => window.__SHOW_SKILL_EFFECT_FOR_EVIDENCE__?.(id, yaw), { id: asset, yaw });
      if (!shown) throw new Error(`Could not show ${asset}`);
      await page.waitForTimeout(assetArgIndex >= 0 ? 5000 : 180);
      await page.locator('#game-canvas').screenshot({ path: new URL(`${asset}-${view}.png`, output).pathname.slice(1) });
    }
  }
}

if (assetArgIndex < 0 || hudOnly) {
  const hudPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await hudPage.goto(`${baseUrl}/?mode=skill&direct=1&seed=20260812`);
  await hudPage.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true, null, { timeout: 90_000 });
  await hudPage.click('#start-game-button');
  await hudPage.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.opening.active === false, null, { timeout: 90_000 });
  await hudPage.waitForTimeout(1800);
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await hudPage.setViewportSize(viewport);
    await hudPage.evaluate(() => {
      const buff = document.querySelector('#skill-buff-slot');
      const debuff = document.querySelector('#skill-debuff-slot');
      buff.classList.add('occupied');
      buff.dataset.status = 'iridescent-bubble';
      buff.querySelector('.skill-status-mark').textContent = '○';
      debuff.classList.add('occupied');
      debuff.dataset.status = 'overheated-plug';
      debuff.querySelector('.skill-status-mark').textContent = '!';
      document.querySelector('#skill-printer-pending').classList.add('visible');
    });
    await hudPage.waitForFunction(() => {
      const curtain = document.querySelector('#scene-transition-curtain');
      return curtain && Number.parseFloat(getComputedStyle(curtain).opacity) < 0.05;
    }, null, { timeout: 30_000 });
    await hudPage.waitForTimeout(1200);
    await hudPage.screenshot({ path: new URL(`skill-status-${viewport.width}x${viewport.height}.png`, output).pathname.slice(1), fullPage: true });
  }
}

await browser.close();
console.log(`Captured ${hudOnly ? 0 : selectedAssets.length * 3} model frames and 2 HUD frames in ${output.pathname}`);

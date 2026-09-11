import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
const directory = 'artifacts/recording-readiness-20260910';
await fs.mkdir(directory, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
const report = { errors, stages: [] };
async function snapshot(label) {
  const state = await page.evaluate(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return { opening: diagnostics?.opening, mode: diagnostics?.mode, remaining: diagnostics?.remainingArrows, targets: diagnostics?.availableClickTargets?.length ? diagnostics.availableClickTargets : diagnostics?.clickTarget ? [diagnostics.clickTarget] : [], audio: diagnostics?.audio, renderer: diagnostics?.renderer, visibility: diagnostics?.sceneVisibility, animations: diagnostics?.activeAnimations, appliances: diagnostics?.appliances.map(item => ({kind:item.kind,state:item.state})), busy:document.querySelector('#app')?.getAttribute('aria-busy') };
  });
  report.stages.push({ label, state });
  console.log(label, JSON.stringify(state));
  await page.screenshot({ path: directory + '/' + label + '.png', timeout: 20000 });
  return state;
}
try {
  await page.goto('http://127.0.0.1:5198/?diagnostics=1&theme=day&seed=2679418801', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true, null, { timeout: 120000 });
  await snapshot('live-home');
  await page.locator('#start-game-button').click();
  console.log('clicked start');
  await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.opening.active === false && window.__THREE_GAME_DIAGNOSTICS__?.opening.transitioning === false && Boolean(window.__THREE_GAME_DIAGNOSTICS__?.clickTarget), null, { timeout: 90000 }).catch(error => report.transitionWarning=error.message);
  const state = await snapshot('live-game');
  if (state.opening?.active || !state.targets?.length) throw Error('No playable game targets after entry');
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const state = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__);
    const target = state.availableClickTargets[0] ?? state.clickTarget;
    if (!target) throw Error('No exposed removable cable');
    await page.mouse.click(target.x, target.y);
    await page.waitForFunction(remaining => window.__THREE_GAME_DIAGNOSTICS__.remainingArrows < remaining, state.remainingArrows, { timeout: 30000 });
    await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__.activeAnimations === 0, null, { timeout: 30000 });
    await snapshot('pull-' + (attempt + 1));
  }
  await page.locator('#settings-button').click();
  await page.locator('#audio-button').click();
  report.muteSaved = await page.evaluate(() => localStorage.getItem('sakura.audioMuted'));
  await page.locator('#audio-button').click();
  await page.locator('#appliance-gallery-button').click();
  await page.waitForFunction(() => window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.open === true);
  await page.locator('[data-appliance-kind="coffee-maker"]').click();
  await page.waitForFunction(() => window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.selected === 'coffee-maker', null, { timeout: 30000 });
  report.gallery = await page.evaluate(() => window.__APPLIANCE_GALLERY_DIAGNOSTICS__);
  await page.getByRole('button', { name: '退出家电图鉴' }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await snapshot('mobile');
  report.mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  report.passed = errors.length === 0 && report.muteSaved === 'true' && !report.mobileOverflow;
  if (!report.passed) throw new Error('Recording readiness checks failed; inspect live-report.json');
} catch (error) {
  report.failure = error.stack ?? error.message;
  await snapshot('failure').catch(()=>{});
  process.exitCode = 1;
} finally {
  await fs.writeFile(directory + '/live-report.json', JSON.stringify(report, null, 2));
  await browser.close();
}

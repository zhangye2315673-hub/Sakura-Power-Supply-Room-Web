import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const directory = 'artifacts/home-depth-reveal-20260910';
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5190';
await fs.mkdir(directory, { recursive: true });
const browser = await chromium.launch({ headless: true });
const report = { errors: [], stages: [] };
let currentPage;

async function openPage(name, options = {}) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, ...options });
  currentPage = page;
  page.on('pageerror', error => report.errors.push(`${name}: ${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error') report.errors.push(`${name}: ${message.text()}`);
  });
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('sakura.audioMuted', 'true');
    window.__homeRevealSamples = [];
    function sample() {
      const state = window.__THREE_GAME_DIAGNOSTICS__?.opening.depthReveal;
      const previous = window.__homeRevealSamples.at(-1);
      if (state && (!previous || state.progress !== previous.progress || state.active !== previous.active)) {
        window.__homeRevealSamples.push({ time: performance.now(), ...state });
      }
      requestAnimationFrame(sample);
    }
    requestAnimationFrame(sample);
  });
  await page.goto(`${baseURL}/?diagnostics=1&theme=day&seed=2679418801`, { waitUntil: 'domcontentloaded' });
  return page;
}

async function snapshot(page, label) {
  const state = await page.evaluate(() => {
    const d = window.__THREE_GAME_DIAGNOSTICS__;
    const title = document.querySelector('.start-screen-copy h1');
    const button = document.querySelector('#start-game-button');
    const rect = button.getBoundingClientRect();
    return {
      opening: d?.opening,
      renderer: d?.renderer,
      remaining: d?.remainingArrows,
      visibility: d?.sceneVisibility,
      titleFilter: getComputedStyle(title).filter,
      titleBackdropFilter: getComputedStyle(title).backdropFilter,
      buttonDisabled: button.disabled,
      buttonHit: button.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)),
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
    };
  });
  report.stages.push({ label, state });
  await page.screenshot({ path: `${directory}/${label}.png`, timeout: 20000 });
  console.log(label, JSON.stringify(state));
  return state;
}

async function waitReady(page) {
  await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready, null, { timeout: 120000 });
}

try {
  const desktop = await openPage('desktop');
  await desktop.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.opening.depthReveal.active, null, { timeout: 60000 });
  await snapshot(desktop, 'desktop-soft');
  await waitReady(desktop);
  await snapshot(desktop, 'desktop-focusing');
  await desktop.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.opening.depthReveal.complete);
  const sharp = await snapshot(desktop, 'desktop-sharp');
  assert.equal(sharp.opening.depthReveal.active, false);
  assert.equal(sharp.titleFilter, 'none');
  assert.equal(sharp.titleBackdropFilter, 'none');
  assert.equal(sharp.buttonDisabled, false);
  assert.equal(sharp.buttonHit, true);
  assert.equal(sharp.overflow, false);
  report.desktopSamples = await desktop.evaluate(() => window.__homeRevealSamples);
  assert(report.desktopSamples.some(sample => sample.active && sample.progress > 0 && sample.progress < 1));
  const start = report.desktopSamples.find(sample => sample.progress > 0);
  const finish = report.desktopSamples.find(sample => sample.complete);
  report.observedRevealMs = finish.time - start.time;

  await desktop.locator('#start-game-button').click();
  await desktop.waitForFunction(() => {
    const d = window.__THREE_GAME_DIAGNOSTICS__;
    return d && !d.opening.active && !d.opening.transitioning && d.clickTarget;
  }, null, { timeout: 90000 });
  const before = await desktop.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__);
  assert.equal(before.opening.depthReveal.active, false);
  const target = before.availableClickTargets[0] ?? before.clickTarget;
  await desktop.mouse.click(target.x, target.y);
  await desktop.waitForFunction(remaining => window.__THREE_GAME_DIAGNOSTICS__.remainingArrows < remaining, before.remainingArrows, { timeout: 30000 });
  await snapshot(desktop, 'desktop-gameplay');
  await desktop.locator('#home-button').click();
  await desktop.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.opening.active);
  const returned = await snapshot(desktop, 'desktop-return-home');
  assert.deepEqual(returned.opening.depthReveal, { active: false, progress: 1, complete: true });
  await desktop.locator('#settings-button').click();
  await desktop.locator('#appliance-gallery-button').click();
  await desktop.waitForFunction(() => window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.open);
  report.gallery = await desktop.evaluate(() => ({
    open: window.__APPLIANCE_GALLERY_DIAGNOSTICS__.open,
    reveal: window.__THREE_GAME_DIAGNOSTICS__.opening.depthReveal,
  }));
  assert.equal(report.gallery.reveal.active, false);
  await desktop.getByRole('button', { name: '退出家电图鉴' }).click();
  await desktop.close();

  const mobile = await openPage('mobile', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await mobile.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.opening.depthReveal.active, null, { timeout: 60000 });
  await snapshot(mobile, 'mobile-soft');
  await waitReady(mobile);
  report.mobileBeforeClick = await mobile.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__.opening.depthReveal);
  assert.equal(report.mobileBeforeClick.active, true);
  // Use the real start button before the 1.4-second reveal has finished.
  await mobile.locator('#start-game-button').click();
  await mobile.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.opening.transitioning, null, { timeout: 10000 });
  const left = await snapshot(mobile, 'mobile-enter-during-reveal');
  assert.equal(left.overflow, false);
  assert.equal(left.opening.depthReveal.active, false);
  assert.equal(left.opening.depthReveal.complete, true);
  report.mobileSamples = await mobile.evaluate(() => window.__homeRevealSamples);
  await mobile.close();

  const reduced = await openPage('reduced-motion', { viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await waitReady(reduced);
  const reducedState = await snapshot(reduced, 'reduced-motion');
  assert.equal(reducedState.opening.depthReveal.active, false);
  report.reducedSamples = await reduced.evaluate(() => window.__homeRevealSamples);
  assert(report.reducedSamples.every(sample => !sample.active));
  await reduced.close();
  assert.deepEqual(report.errors, []);
  report.passed = true;
} catch (error) {
  report.failure = error.stack ?? error.message;
  if (currentPage && !currentPage.isClosed()) await snapshot(currentPage, 'failure').catch(() => {});
  process.exitCode = 1;
} finally {
  await fs.writeFile(`${directory}/report.json`, JSON.stringify(report, null, 2));
  await browser.close();
  console.log(JSON.stringify({ passed: report.passed, failure: report.failure, errors: report.errors, observedRevealMs: report.observedRevealMs }));
}

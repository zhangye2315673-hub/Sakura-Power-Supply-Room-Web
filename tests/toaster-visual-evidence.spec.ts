import { expect, test, type Browser, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PNG } from 'pngjs';

const ARTIFACT_DIR = path.resolve('artifacts/toaster-performance');
// Seed 14 is a standard random challenge whose first solution arrow is routed
// to the toaster colour, so the evidence exercises the real game connection.
const GAME_SEED = 14;
const GAME_URL = `/?seed=${GAME_SEED}&mode=random&direct=1`;

async function pageWithClock(browser: Browser): Promise<Page> {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.addInitScript(() => {
    window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 3.55;
    window.__APPLIANCE_PERFORMANCE_FLIGHT_TIME_OVERRIDE__ = 0;
  });
  return page;
}

async function waitForGame(page: Page): Promise<void> {
  await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true, null, { timeout: 90_000 });
  if (await page.locator('#start-game-button').isVisible()) await page.click('#start-game-button');
  if (await page.locator('#double-ended-start-button').isVisible()) {
    await page.click('#double-ended-start-button');
  }
  await page.waitForFunction(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return diagnostics?.sceneVisibility.appliances === true
      && diagnostics.opening.cameraPhase === 'idle'
      && (diagnostics.clickTarget !== null || diagnostics.availableClickTargets.length > 0);
  }, null, { timeout: 60_000 });
}

async function activateToaster(page: Page): Promise<void> {
  for (let attempt = 0; attempt < 48; attempt += 1) {
    const diagnostics = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__ ?? null);
    const toaster = diagnostics?.appliances.find((item) => item.kind === 'toaster');
    if (toaster?.state === 'active') {
      await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.performances.kinds.includes('toaster'));
      return;
    }
    const clickTarget = diagnostics?.availableClickTargets?.find((candidate) => candidate.color === toaster?.accent)
      ?? diagnostics?.availableClickTargets?.[0]
      ?? diagnostics?.clickTarget;
    if (!clickTarget || !diagnostics) {
      await page.waitForTimeout(80);
      continue;
    }
    const remaining = diagnostics.remainingArrows;
    await page.mouse.click(clickTarget.x, clickTarget.y);
    try {
      await page.waitForFunction(
        (before) => (window.__THREE_GAME_DIAGNOSTICS__?.remainingArrows ?? before) < before,
        remaining,
        { timeout: 2_500 },
      );
    } catch {
      // Diagnostics can change between the read and click after a cable lands.
      // Re-read the authoritative target instead of failing on the stale point.
      await page.waitForTimeout(80);
    }
    await page.waitForTimeout(120);
  }
  throw new Error('Unable to activate toaster in deterministic game.');
}

function sideBySide(gameBuffer: Buffer, galleryBuffer: Buffer): Buffer {
  const game = PNG.sync.read(gameBuffer);
  const gallery = PNG.sync.read(galleryBuffer);
  const output = new PNG({ width: game.width + gallery.width, height: Math.max(game.height, gallery.height) });
  PNG.bitblt(game, output, 0, 0, game.width, game.height, 0, 0);
  PNG.bitblt(gallery, output, 0, 0, gallery.width, gallery.height, game.width, 0);
  return PNG.sync.write(output);
}

test('captures game and gallery at the same toaster latch and flight timestamps', async ({ browser }) => {
  test.setTimeout(300_000);
  await mkdir(ARTIFACT_DIR, { recursive: true });
  const game = await pageWithClock(browser);
  const seed = GAME_SEED;
  const gameShots = new Map<string, Buffer>();
  const galleryShots = new Map<string, Buffer>();
  const timestamps = [
    '00-lever-held-3.55s',
    '01-launch-plus-0.08s',
    '02-apex-plus-0.58s',
    '03-fall-plus-1.11s',
  ] as const;

  await game.goto(GAME_URL);
  await waitForGame(game);
  await activateToaster(game);
  gameShots.set(timestamps[0], await game.screenshot());
  await game.evaluate(() => {
    window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 3.72;
    window.__APPLIANCE_PERFORMANCE_FLIGHT_TIME_OVERRIDE__ = 0.08;
  });
  await game.waitForTimeout(80);
  gameShots.set(timestamps[1], await game.screenshot());
  await game.evaluate(() => { window.__APPLIANCE_PERFORMANCE_FLIGHT_TIME_OVERRIDE__ = 0.58; });
  await game.waitForTimeout(60);
  gameShots.set(timestamps[2], await game.screenshot());
  await game.evaluate(() => { window.__APPLIANCE_PERFORMANCE_FLIGHT_TIME_OVERRIDE__ = 1.11; });
  await game.waitForTimeout(60);
  gameShots.set(timestamps[3], await game.screenshot());
  const gameRuntime = await game.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.performances);
  await game.close();

  // Capture sequentially: two simultaneous software-WebGL scenes can starve
  // the generator worker on Windows and are not needed for equal timestamps.
  const gallery = await pageWithClock(browser);
  await gallery.goto(GAME_URL);
  await waitForGame(gallery);
  await gallery.click('#appliance-gallery-button');
  await gallery.locator('[data-appliance-kind="toaster"]').click();
  await gallery.waitForFunction(() => window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.selected === 'toaster'
    && window.__APPLIANCE_GALLERY_DIAGNOSTICS__.performanceTimelineOwners === 1);
  galleryShots.set(timestamps[0], await gallery.screenshot());
  await gallery.evaluate(() => {
    window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 3.72;
    window.__APPLIANCE_PERFORMANCE_FLIGHT_TIME_OVERRIDE__ = 0.08;
  });
  await gallery.waitForTimeout(80);
  galleryShots.set(timestamps[1], await gallery.screenshot());
  await gallery.evaluate(() => { window.__APPLIANCE_PERFORMANCE_FLIGHT_TIME_OVERRIDE__ = 0.58; });
  await gallery.waitForTimeout(60);
  galleryShots.set(timestamps[2], await gallery.screenshot());
  await gallery.evaluate(() => { window.__APPLIANCE_PERFORMANCE_FLIGHT_TIME_OVERRIDE__ = 1.11; });
  await gallery.waitForTimeout(60);
  galleryShots.set(timestamps[3], await gallery.screenshot());
  const galleryRuntime = await gallery.evaluate(() => window.__APPLIANCE_GALLERY_DIAGNOSTICS__);

  for (const timestamp of timestamps) {
    const gameShot = gameShots.get(timestamp)!;
    const galleryShot = galleryShots.get(timestamp)!;
    await Promise.all([
      writeFile(path.join(ARTIFACT_DIR, `${timestamp}-game.png`), gameShot),
      writeFile(path.join(ARTIFACT_DIR, `${timestamp}-gallery.png`), galleryShot),
      writeFile(path.join(ARTIFACT_DIR, `${timestamp}-game-gallery.png`), sideBySide(gameShot, galleryShot)),
    ]);
  }

  const runtime = { seed, sharedTimelineOverride: 3.72, game: gameRuntime, gallery: galleryRuntime };
  await writeFile(path.join(ARTIFACT_DIR, 'runtime-diagnostics.json'), `${JSON.stringify(runtime, null, 2)}\n`, 'utf8');
  expect(runtime.game?.activeByKind.toast ?? 0).toBeGreaterThan(0);
  expect(runtime.gallery?.performanceTimelineOwners).toBe(1);
  expect(runtime.gallery?.orbitAzimuth).not.toBe(0);

  await gallery.close();
});

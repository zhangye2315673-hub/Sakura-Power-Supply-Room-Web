import { expect, test, type Browser, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PNG } from 'pngjs';

const ARTIFACT_DIR = path.resolve('artifacts/lamp-performance');
// Seed 12 assigns the lamp to the first removable solution arrow; evidence can
// activate it without solving the board or triggering a next-puzzle navigation.
const GAME_URL = '/?seed=12&mode=random&direct=1';
const MOMENTS = [
  { label: '00-left-look-0.84s', time: 0.84, phase: 'look-left' },
  { label: '01-right-look-1.96s', time: 1.96, phase: 'look-right' },
  { label: '02-up-look-climax-3.30s', time: 3.30, phase: 'look-up' },
  { label: '03-settle-4.36s', time: 4.36, phase: 'settle' },
] as const;

async function pageWithClock(browser: Browser): Promise<Page> {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.addInitScript(() => { window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 0.84; });
  return page;
}

async function waitForGame(page: Page): Promise<void> {
  await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true, null, { timeout: 90_000 });
  if (await page.locator('#start-game-button').isVisible()) await page.click('#start-game-button');
  await page.waitForFunction(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return diagnostics?.sceneVisibility.appliances === true
      && diagnostics.opening.cameraPhase === 'idle'
      && diagnostics.clickTarget !== null;
  }, null, { timeout: 60_000 });
}

async function activateLamp(page: Page): Promise<void> {
  const diagnostics = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__ ?? null);
  const lamp = diagnostics?.appliances.find((item) => item.kind === 'lamp');
  const clickTarget = diagnostics?.availableClickTargets?.find((candidate) => candidate.color === lamp?.accent);
  if (!clickTarget || !diagnostics || !lamp) throw new Error('Deterministic seed has no clickable lamp-colour arrow.');
  await page.mouse.click(clickTarget.x, clickTarget.y);
  await page.waitForFunction(
    () => {
      const state = window.__THREE_GAME_DIAGNOSTICS__?.appliances.find((item) => item.kind === 'lamp')?.state;
      return state === 'connected' || state === 'active';
    },
    null,
    { timeout: 30_000 },
  );
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.appliances.find((item) => item.kind === 'lamp')?.state === 'active',
    null,
    { timeout: 60_000 },
  );
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.performances.lampBeam !== null,
    null,
    { timeout: 10_000 },
  );
}

function sideBySide(gameBuffer: Buffer, galleryBuffer: Buffer): Buffer {
  const game = PNG.sync.read(gameBuffer);
  const gallery = PNG.sync.read(galleryBuffer);
  const output = new PNG({ width: game.width + gallery.width, height: Math.max(game.height, gallery.height) });
  PNG.bitblt(game, output, 0, 0, game.width, game.height, 0, 0);
  PNG.bitblt(gallery, output, 0, 0, gallery.width, gallery.height, game.width, 0);
  return PNG.sync.write(output);
}

test('captures the same lamp timeline and volumetric form in game and gallery', async ({ browser }) => {
  test.setTimeout(300_000);
  await mkdir(ARTIFACT_DIR, { recursive: true });
  const gameShots = new Map<string, Buffer>();
  const galleryShots = new Map<string, Buffer>();
  const runtime: Record<string, unknown> = { sharedMoments: MOMENTS };

  const game = await pageWithClock(browser);
  await game.goto(GAME_URL);
  await waitForGame(game);
  await activateLamp(game);
  for (const moment of MOMENTS) {
    await game.evaluate((time) => { window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = time; }, moment.time);
    await game.waitForFunction(
      ({ time, phase }) => {
        const beam = window.__THREE_GAME_DIAGNOSTICS__?.performances.lampBeam;
        return beam !== null && Math.abs((beam?.timelineTime ?? -10) - time) < 0.001 && beam?.headPhase === phase;
      },
      { time: moment.time, phase: moment.phase },
    );
    gameShots.set(moment.label, await game.screenshot());
  }
  runtime.game = await game.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.performances);
  // Reuse the already-generated live game page. A second full random-level
  // generation can take several minutes under SwiftShader and adds no coverage:
  // the in-game gallery owns its own AppliancePerformanceSystem instance while
  // importing the same model/mechanics/timeline module.
  const gallery = game;
  await gallery.click('#appliance-gallery-button');
  await gallery.locator('[data-appliance-kind="lamp"]').click();
  await gallery.waitForFunction(() => window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.selected === 'lamp'
    && window.__APPLIANCE_GALLERY_DIAGNOSTICS__.performanceTimelineOwners === 1);
  for (const moment of MOMENTS) {
    await gallery.evaluate((time) => { window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = time; }, moment.time);
    await gallery.waitForFunction(
      ({ time, phase }) => {
        const beam = window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.lampBeam;
        return beam !== null && Math.abs((beam?.timelineTime ?? -10) - time) < 0.001 && beam?.headPhase === phase;
      },
      { time: moment.time, phase: moment.phase },
    );
    galleryShots.set(moment.label, await gallery.screenshot());
  }
  runtime.gallery = await gallery.evaluate(() => window.__APPLIANCE_GALLERY_DIAGNOSTICS__);

  for (const moment of MOMENTS) {
    const gameShot = gameShots.get(moment.label)!;
    const galleryShot = galleryShots.get(moment.label)!;
    await Promise.all([
      writeFile(path.join(ARTIFACT_DIR, `${moment.label}-game.png`), gameShot),
      writeFile(path.join(ARTIFACT_DIR, `${moment.label}-gallery.png`), galleryShot),
      writeFile(path.join(ARTIFACT_DIR, `${moment.label}-game-gallery.png`), sideBySide(gameShot, galleryShot)),
    ]);
  }
  await writeFile(path.join(ARTIFACT_DIR, 'runtime-diagnostics.json'), `${JSON.stringify(runtime, null, 2)}\n`, 'utf8');

  const gameRuntime = runtime.game as ThreeGameDiagnostics['performances'];
  const galleryRuntime = runtime.gallery as NonNullable<Window['__APPLIANCE_GALLERY_DIAGNOSTICS__']>;
  expect(gameRuntime.timelineOwners).toBe(1);
  expect(galleryRuntime.performanceTimelineOwners).toBe(1);
  expect(gameRuntime.lampBeam?.farToNearRatio).toBeCloseTo(3.35, 6);
  expect(galleryRuntime.lampBeam?.farToNearRatio).toBeCloseTo(3.35, 6);
  expect(gameRuntime.lampBeam?.geometryAxis).toBe('-Y-near/+Y-far');
  expect(galleryRuntime.lampBeam?.geometryAxis).toBe('-Y-near/+Y-far');
  expect(galleryRuntime.orbitAzimuth).not.toBe(0);
  await game.close();
});

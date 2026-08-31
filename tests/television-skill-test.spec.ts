import { expect, test } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PNG } from 'pngjs';

const ARTIFACT_DIR = path.resolve('artifacts/television-skill-test');

test('television skill test shows the fault reconstruction effect and keeps the puzzle solvable', async ({ page }) => {
  test.setTimeout(240_000);
  await mkdir(ARTIFACT_DIR, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/?theme=day&mode=skill-test&skill=television&direct=1');
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true,
    null,
    { timeout: 90_000 },
  );
  await page.click('#start-game-button');
  await page.waitForFunction(
    () => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      return diagnostics?.opening.active === false
        && diagnostics.skill?.testId === 'television'
        && diagnostics.totalArrows === 4
        && diagnostics.clickTarget !== null;
    },
    null,
    { timeout: 90_000 },
  );

  const initial = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  expect(initial.appliances.map(({ kind }) => kind)).toEqual(['television']);
  expect(initial.skill?.invulnerable).toBe(true);
  await expect(page.locator('#skill-cue-source')).toHaveText('电视机');
  await expect(page.locator('#skill-cue-title')).toHaveText('故障重构');
  await expect(page.locator('#skill-cue-detail')).toHaveText('重构最多三根线的空间路径。');
  const initialCanvas = await page.locator('#game-canvas').screenshot();
  await writeFile(path.join(ARTIFACT_DIR, 'television-skill-test-before.png'), await page.screenshot({ fullPage: true }));

  await page.evaluate(() => { window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 0.8; });
  const target = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.clickTarget!);
  await page.mouse.click(target.x, target.y);
  await page.waitForFunction(
    () => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      return diagnostics?.remainingArrows === 3
        && diagnostics.skill?.inputLocked === true
        && diagnostics.skill.televisionReconstruction.active === true
        && diagnostics.skill.televisionReconstruction.targetIds.length === 3;
    },
    null,
    { timeout: 45_000 },
  );

  const setTelevisionTime = async (time: number, phase: string): Promise<ThreeGameDiagnostics> => {
    await page.evaluate((value) => { window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = value; }, time);
    await page.waitForFunction(
      ({ time, phase }) => {
        const reconstruction = window.__THREE_GAME_DIAGNOSTICS__?.skill?.televisionReconstruction;
        return reconstruction?.phase === phase && Math.abs(reconstruction.elapsed - time) < 0.035;
      },
      { time, phase },
      { timeout: 30_000 },
    );
    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
    return page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  };

  const oldHold = await setTelevisionTime(0.62, 'old-hold');
  expect(oldHold.skill?.televisionReconstruction).toMatchObject({
    currentTopology: 'old',
    rgbGhostCount: 0,
    committed: false,
  });
  const oldCanvas = await page.locator('#game-canvas').screenshot();
  await writeFile(path.join(ARTIFACT_DIR, 'television-skill-test-old-hold.png'), await page.screenshot({ fullPage: true }));

  const firstNewFlash = await setTelevisionTime(0.98, 'new-glitch');
  expect(firstNewFlash.skill?.effectAssets).toEqual([]);
  expect(firstNewFlash.skill?.televisionReconstruction).toMatchObject({
    currentTopology: 'new',
    switchCount: 1,
    rgbGhostCount: 6,
    committed: false,
  });
  const firstNewCanvas = await page.locator('#game-canvas').screenshot();
  await writeFile(path.join(ARTIFACT_DIR, 'television-skill-test-first-new-flash.png'), await page.screenshot({ fullPage: true }));

  const oldReturn = await setTelevisionTime(1.24, 'old-hold');
  expect(oldReturn.skill?.televisionReconstruction.currentTopology).toBe('old');
  await writeFile(path.join(ARTIFACT_DIR, 'television-skill-test-old-return.png'), await page.screenshot({ fullPage: true }));

  const rapidNewFlash = await setTelevisionTime(3.06, 'new-glitch');
  expect(rapidNewFlash.skill?.televisionReconstruction).toMatchObject({
    currentTopology: 'new',
    switchCount: 4,
    rgbGhostCount: 6,
  });
  await writeFile(path.join(ARTIFACT_DIR, 'television-skill-test-rapid-new-flash.png'), await page.screenshot({ fullPage: true }));

  const finalLock = await setTelevisionTime(4.82, 'new-locked');
  expect(finalLock.skill?.televisionReconstruction).toMatchObject({
    currentTopology: 'new',
    switchCount: 9,
    rgbGhostCount: 0,
    committed: false,
  });
  const finalLockCanvas = await page.locator('#game-canvas').screenshot();
  await writeFile(path.join(ARTIFACT_DIR, 'television-skill-test-final-lock.png'), await page.screenshot({ fullPage: true }));

  await page.evaluate(() => { window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 5.13; });
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.skill?.televisionReconstruction.phase === 'complete'
      && window.__THREE_GAME_DIAGNOSTICS__?.skill?.televisionReconstruction.committed === true,
    null,
    { timeout: 30_000 },
  );
  const committed = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  await writeFile(path.join(ARTIFACT_DIR, 'television-skill-test-committed.png'), await page.screenshot({ fullPage: true }));
  await page.evaluate(() => { window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = undefined; });

  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.skill?.inputLocked === false
      && window.__THREE_GAME_DIAGNOSTICS__?.activeAnimations === 0,
    null,
    { timeout: 45_000 },
  );
  const settled = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  expect(settled.remainingArrows).toBe(3);
  expect(settled.skill?.phase).toBe('idle');
  const settledCanvas = await page.locator('#game-canvas').screenshot();
  await writeFile(path.join(ARTIFACT_DIR, 'television-skill-test-settled.png'), await page.screenshot({ fullPage: true }));
  await writeFile(
    path.join(ARTIFACT_DIR, 'runtime-diagnostics.json'),
    `${JSON.stringify({ initial, oldHold, firstNewFlash, oldReturn, rapidNewFlash, finalLock, committed, settled }, null, 2)}\n`,
    'utf8',
  );

  const before = PNG.sync.read(initialCanvas);
  const old = PNG.sync.read(oldCanvas);
  const firstNew = PNG.sync.read(firstNewCanvas);
  const finalNew = PNG.sync.read(finalLockCanvas);
  const after = PNG.sync.read(settledCanvas);
  let changedPixels = 0;
  for (let index = 0; index < before.width * before.height; index += 1) {
    const offset = index * 4;
    const difference = Math.abs(old.data[offset] - firstNew.data[offset])
      + Math.abs(old.data[offset + 1] - firstNew.data[offset + 1])
      + Math.abs(old.data[offset + 2] - firstNew.data[offset + 2]);
    if (difference > 18) changedPixels += 1;
  }
  expect(changedPixels).toBeGreaterThan(before.width * before.height * 0.001);

  let topologyChangedPixels = 0;
  for (let index = 0; index < before.width * before.height; index += 1) {
    const offset = index * 4;
    const difference = Math.abs(before.data[offset] - finalNew.data[offset])
      + Math.abs(before.data[offset + 1] - finalNew.data[offset + 1])
      + Math.abs(before.data[offset + 2] - finalNew.data[offset + 2]);
    if (difference > 18) topologyChangedPixels += 1;
  }
  expect(topologyChangedPixels).toBeGreaterThan(before.width * before.height * 0.001);

  let settledDifference = 0;
  for (let index = 0; index < before.width * before.height; index += 1) {
    const offset = index * 4;
    const difference = Math.abs(finalNew.data[offset] - after.data[offset])
      + Math.abs(finalNew.data[offset + 1] - after.data[offset + 1])
      + Math.abs(finalNew.data[offset + 2] - after.data[offset + 2]);
    if (difference > 18) settledDifference += 1;
  }
  expect(settledDifference).toBeGreaterThan(0);
});

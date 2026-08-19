import { expect, test } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PNG } from 'pngjs';
import { availableCableEnds, makeRuntime } from '../src/puzzle/collision';
import {
  FAN_SKILL_TEST,
  HUMIDIFIER_SKILL_TEST,
  LAMP_SKILL_TEST,
  RADIO_SKILL_TEST,
  REFRIGERATOR_SKILL_TEST,
  TELEVISION_SKILL_TEST,
  TOASTER_SKILL_TEST,
  WASHER_SKILL_TEST,
  buildSkillTestPuzzle,
} from '../src/skill/SkillTestMode';

const ARTIFACT_DIR = path.resolve('artifacts/fan-skill-test');

test('lamp skill test fixture keeps one readable dependency among four short cables', () => {
  const puzzle = buildSkillTestPuzzle(LAMP_SKILL_TEST);
  const availableIds = new Set(availableCableEnds(puzzle.arrows.map(makeRuntime)).map(({ id }) => id));

  expect(puzzle.arrows).toHaveLength(4);
  expect(new Set(puzzle.arrows.map((arrow) => arrow.color))).toEqual(new Set([LAMP_SKILL_TEST.accent]));
  expect(availableIds.has('lamp-test-blocked')).toBe(false);
  expect(availableIds).toEqual(new Set(['lamp-test-key', 'lamp-test-side', 'lamp-test-depth']));
});

test('fan skill test fixture preserves the same readable four-cable topology', () => {
  const puzzle = buildSkillTestPuzzle(FAN_SKILL_TEST);
  const availableIds = new Set(availableCableEnds(puzzle.arrows.map(makeRuntime)).map(({ id }) => id));

  expect(puzzle.arrows).toHaveLength(4);
  expect(new Set(puzzle.arrows.map((arrow) => arrow.color))).toEqual(new Set([FAN_SKILL_TEST.accent]));
  expect(availableIds.has('fan-test-blocked')).toBe(false);
  expect(availableIds).toEqual(new Set(['fan-test-key', 'fan-test-side', 'fan-test-depth']));
});

test('humidifier skill test fixture starts clear with the same four-cable topology', () => {
  const puzzle = buildSkillTestPuzzle(HUMIDIFIER_SKILL_TEST);
  const availableIds = new Set(availableCableEnds(puzzle.arrows.map(makeRuntime)).map(({ id }) => id));

  expect(puzzle.arrows).toHaveLength(4);
  expect(HUMIDIFIER_SKILL_TEST.initialCommands).toEqual([]);
  expect(new Set(puzzle.arrows.map((arrow) => arrow.color))).toEqual(new Set([HUMIDIFIER_SKILL_TEST.accent]));
  expect(availableIds.has('humidifier-test-blocked')).toBe(false);
  expect(availableIds).toEqual(new Set([
    'humidifier-test-key',
    'humidifier-test-side',
    'humidifier-test-depth',
  ]));
});

test('radio skill test leaves three ordered cables after its trigger connection', () => {
  const puzzle = buildSkillTestPuzzle(RADIO_SKILL_TEST);
  const availableIds = new Set(availableCableEnds(puzzle.arrows.map(makeRuntime)).map(({ id }) => id));

  expect(puzzle.arrows).toHaveLength(4);
  expect(RADIO_SKILL_TEST.initialCommands).toEqual([]);
  expect(new Set(puzzle.arrows.map((arrow) => arrow.color))).toEqual(new Set([RADIO_SKILL_TEST.accent]));
  expect(availableIds.has('radio-test-blocked')).toBe(false);
  expect(availableIds).toEqual(new Set(['radio-test-key', 'radio-test-side', 'radio-test-depth']));
  expect(puzzle.solution).toEqual([
    'radio-test-key',
    'radio-test-blocked',
    'radio-test-side',
    'radio-test-depth',
  ]);
});

test('television skill test exposes the same readable topology for fault reconstruction', () => {
  const puzzle = buildSkillTestPuzzle(TELEVISION_SKILL_TEST);
  const availableIds = new Set(availableCableEnds(puzzle.arrows.map(makeRuntime)).map(({ id }) => id));

  expect(puzzle.arrows).toHaveLength(4);
  expect(TELEVISION_SKILL_TEST.initialCommands).toEqual([]);
  expect(new Set(puzzle.arrows.map((arrow) => arrow.color))).toEqual(new Set([TELEVISION_SKILL_TEST.accent]));
  expect(availableIds.has('television-test-blocked')).toBe(false);
  expect(availableIds).toEqual(new Set([
    'television-test-key',
    'television-test-side',
    'television-test-depth',
  ]));
});

test('toaster skill test exposes the same readable topology for double-sided toast', () => {
  const puzzle = buildSkillTestPuzzle(TOASTER_SKILL_TEST);
  const availableIds = new Set(availableCableEnds(puzzle.arrows.map(makeRuntime)).map(({ id }) => id));

  expect(puzzle.arrows).toHaveLength(4);
  expect(TOASTER_SKILL_TEST.initialCommands).toEqual([]);
  expect(new Set(puzzle.arrows.map((arrow) => arrow.color))).toEqual(new Set([TOASTER_SKILL_TEST.accent]));
  expect(availableIds.has('toaster-test-blocked')).toBe(false);
  expect(availableIds).toEqual(new Set([
    'toaster-test-key',
    'toaster-test-side',
    'toaster-test-depth',
  ]));
  expect(puzzle.solution).toEqual([
    'toaster-test-key',
    'toaster-test-blocked',
    'toaster-test-side',
    'toaster-test-depth',
  ]);
});

test('refrigerator skill test exposes enough exits for the freeze-plugs debuff', () => {
  const puzzle = buildSkillTestPuzzle(REFRIGERATOR_SKILL_TEST);
  const availableIds = new Set(availableCableEnds(puzzle.arrows.map(makeRuntime)).map(({ id }) => id));

  expect(puzzle.arrows).toHaveLength(4);
  expect(REFRIGERATOR_SKILL_TEST.initialCommands).toEqual([]);
  expect(new Set(puzzle.arrows.map((arrow) => arrow.color))).toEqual(new Set([REFRIGERATOR_SKILL_TEST.accent]));
  expect(availableIds.has('refrigerator-test-blocked')).toBe(false);
  expect(availableIds).toEqual(new Set([
    'refrigerator-test-key',
    'refrigerator-test-side',
    'refrigerator-test-depth',
  ]));
});

test('washer skill test fixture exposes the three initial exits for spin-remove', () => {
  const puzzle = buildSkillTestPuzzle(WASHER_SKILL_TEST);
  const availableIds = new Set(availableCableEnds(puzzle.arrows.map(makeRuntime)).map(({ id }) => id));

  expect(puzzle.arrows).toHaveLength(4);
  expect(WASHER_SKILL_TEST.initialCommands).toEqual([]);
  expect(new Set(puzzle.arrows.map((arrow) => arrow.color))).toEqual(new Set([WASHER_SKILL_TEST.accent]));
  expect(availableIds.has('washer-test-blocked')).toBe(false);
  expect(availableIds).toEqual(new Set([
    'washer-test-key',
    'washer-test-side',
    'washer-test-depth',
  ]));
  expect(puzzle.solution).toEqual([
    'washer-test-key',
    'washer-test-blocked',
    'washer-test-side',
    'washer-test-depth',
  ]);
});

test('washer skill test removes up to two remaining cables after its trigger connection', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/?theme=day&mode=skill-test&direct=1');
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
        && diagnostics.skill?.testId === 'washer'
        && diagnostics.totalArrows === 4
        && diagnostics.clickTarget !== null;
    },
    null,
    { timeout: 90_000 },
  );

  const initial = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  expect(initial.appliances.map(({ kind }) => kind)).toEqual(['washer']);
  expect(initial.skill?.invulnerable).toBe(true);
  expect(initial.skill?.effectAssets).toEqual([]);
  await expect(page.locator('#skill-cue-source')).toHaveText('洗衣机');
  await expect(page.locator('#skill-cue-title')).toHaveText('脱水甩线');
  await expect(page.locator('#skill-cue-detail')).toHaveText('从全部剩余线中甩出最多两根。');

  const target = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.clickTarget!);
  await page.mouse.click(target.x, target.y);
  await page.waitForFunction(
    () => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      return diagnostics?.remainingArrows === 1
        && diagnostics.skill?.inputLocked === true
        && diagnostics.performances?.kinds.includes('washer') === true;
    },
    null,
    { timeout: 45_000 },
  );
  await expect(page.locator('#skill-cue-title')).toHaveText('脱水甩线');
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.skill?.inputLocked === false,
    null,
    { timeout: 45_000 },
  );
});

test('fan steam remains animated and frosted in the daytime theme', async ({ page }) => {
  test.setTimeout(180_000);
  await mkdir(ARTIFACT_DIR, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/?theme=day&mode=skill-test&skill=fan&direct=1');
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
        && diagnostics.skill?.testId === 'fan'
        && diagnostics.skill.debuff === 'bathroom-steam';
    },
    null,
    { timeout: 90_000 },
  );
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('day');

  await page.waitForTimeout(2_000);
  const initialSteam = await page.locator('#game-canvas').screenshot();
  await page.waitForTimeout(5_500);
  const flowingSteam = await page.locator('#game-canvas').screenshot();
  await Promise.all([
    writeFile(path.join(ARTIFACT_DIR, 'fan-skill-test-steam-day.png'), initialSteam),
    writeFile(path.join(ARTIFACT_DIR, 'fan-skill-test-steam-day-flow.png'), flowingSteam),
  ]);

  const initial = PNG.sync.read(initialSteam);
  const flowing = PNG.sync.read(flowingSteam);
  let changedPixels = 0;
  for (let index = 0; index < initial.width * initial.height; index += 1) {
    const offset = index * 4;
    const difference = Math.abs(initial.data[offset] - flowing.data[offset])
      + Math.abs(initial.data[offset + 1] - flowing.data[offset + 1])
      + Math.abs(initial.data[offset + 2] - flowing.data[offset + 2]);
    if (difference > 18) changedPixels += 1;
  }
  expect(changedPixels).toBeGreaterThan(initial.width * initial.height * 0.004);

  const measureFps = async (): Promise<number> => page.evaluate(async () => {
    const start = performance.now();
    let frames = 0;
    await new Promise<void>((resolve) => {
      const countFrame = (now: number): void => {
        frames += 1;
        if (now - start >= 2_000) resolve();
        else requestAnimationFrame(countFrame);
      };
      requestAnimationFrame(countFrame);
    });
    return frames / ((performance.now() - start) / 1_000);
  });
  const steamFps = await measureFps();

  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.clickTarget !== null,
    null,
    { timeout: 30_000 },
  );
  const target = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.clickTarget!);
  await page.mouse.click(target.x, target.y);
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.skill?.debuff === null
      && window.__THREE_GAME_DIAGNOSTICS__?.skill?.steamClear.active === true,
    null,
    { timeout: 30_000 },
  );
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.skill?.steamClear.active === false
      && window.__THREE_GAME_DIAGNOSTICS__?.activeAnimations === 0,
    null,
    { timeout: 30_000 },
  );
  const clearFps = await measureFps();
  await writeFile(
    path.join(ARTIFACT_DIR, 'daytime-steam-performance.json'),
    `${JSON.stringify({ steamFps, clearFps, ratio: steamFps / clearFps }, null, 2)}\n`,
    'utf8',
  );
  expect(steamFps).toBeGreaterThan(2);
  expect(steamFps / clearFps).toBeGreaterThan(0.55);
});

test('fan skill test mode is invulnerable, quiet, and clears the primed steam state', async ({ page }) => {
  test.setTimeout(300_000);
  await mkdir(ARTIFACT_DIR, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/?theme=night&mode=skill-test&skill=fan&direct=1');
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
        && diagnostics.skill?.testId === 'fan'
        && diagnostics.totalArrows === 4
        && diagnostics.clickTarget !== null
        && diagnostics.blockedClickTarget !== null;
    },
    null,
    { timeout: 90_000 },
  );

  const initial = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  expect(initial.skill?.invulnerable).toBe(true);
  expect(initial.skill?.debuff).toBe('bathroom-steam');
  expect(initial.appliances.map(({ kind }) => kind)).toEqual(['fan']);
  expect(new Set(initial.routing.requiredColors)).toEqual(new Set([initial.appliances[0].accent]));
  await expect(page.locator('#skill-challenge-ui')).toBeVisible();
  await expect(page.locator('#skill-challenge-ui')).toHaveClass(/visible/);
  await expect(page.locator('#skill-cue')).toBeVisible();
  await expect(page.locator('#skill-cue-source')).toHaveText('风扇');
  await expect(page.locator('#skill-cue-title')).toHaveText('吹散蒸汽');
  await expect(page.locator('#skill-cue-detail')).toHaveText('提前清除浴室蒸汽。');
  await expect(page.locator('#skill-status-rack')).toBeHidden();
  await expect(page.locator('#random-lives')).toBeHidden();
  await expect(page.locator('#hint-button')).toBeHidden();
  await expect(page.locator('#status-line')).toBeHidden();

  const steamScreenshot = await page.locator('#game-canvas').screenshot();
  await writeFile(path.join(ARTIFACT_DIR, 'fan-skill-test-steam.png'), steamScreenshot);
  await page.waitForTimeout(5_500);
  const flowingSteamScreenshot = await page.locator('#game-canvas').screenshot();
  await writeFile(path.join(ARTIFACT_DIR, 'fan-skill-test-steam-flow.png'), flowingSteamScreenshot);
  const steamStart = PNG.sync.read(steamScreenshot);
  const steamFlow = PNG.sync.read(flowingSteamScreenshot);
  let changedSteamPixels = 0;
  for (let index = 0; index < steamStart.width * steamStart.height; index += 1) {
    const offset = index * 4;
    const difference = Math.abs(steamStart.data[offset] - steamFlow.data[offset])
      + Math.abs(steamStart.data[offset + 1] - steamFlow.data[offset + 1])
      + Math.abs(steamStart.data[offset + 2] - steamFlow.data[offset + 2]);
    if (difference > 18) changedSteamPixels += 1;
  }
  expect(changedSteamPixels).toBeGreaterThan(steamStart.width * steamStart.height * 0.004);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(750);
  const mobileSteamScreenshot = await page.locator('#game-canvas').screenshot();
  await writeFile(path.join(ARTIFACT_DIR, 'fan-skill-test-steam-mobile.png'), mobileSteamScreenshot);
  const mobileSteam = PNG.sync.read(mobileSteamScreenshot);
  expect(mobileSteam.width).toBe(390);
  expect(mobileSteam.height).toBe(844);

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(750);
  const blockedTarget = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.blockedClickTarget!);
  await page.mouse.click(blockedTarget.x, blockedTarget.y);
  await page.waitForTimeout(700);
  expect(await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.skill?.lives)).toBe(initial.skill?.lives);

  const target = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.clickTarget!);
  await page.mouse.click(target.x, target.y);
  await page.waitForFunction(
    () => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      return diagnostics?.remainingArrows === 3
        && diagnostics.skill?.debuff === null
        && diagnostics.skill.effectAssets.length === 0
        && diagnostics.skill.steamClear.active;
    },
    null,
    { timeout: 30_000 },
  );

  await page.evaluate(() => { window.__STEAM_CLEAR_PROGRESS_OVERRIDE__ = 0.08; });
  await page.waitForFunction(
    () => (window.__THREE_GAME_DIAGNOSTICS__?.skill?.steamClear.progress ?? 1) <= 0.1,
    null,
    { timeout: 30_000 },
  );
  const clearStart = await page.screenshot();
  const clearingStart = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.skill!.steamClear);
  expect(clearingStart.origin).toBeLessThan(0.5);
  expect(clearingStart.direction).toBe('left-to-right');
  expect(clearingStart.progress).toBeLessThan(0.55);

  await page.evaluate(() => { window.__STEAM_CLEAR_PROGRESS_OVERRIDE__ = 0.52; });
  await page.waitForFunction(
    () => Math.abs((window.__THREE_GAME_DIAGNOSTICS__?.skill?.steamClear.progress ?? 0) - 0.52) < 0.02,
    null,
    { timeout: 30_000 },
  );
  const clearMid = await page.screenshot();

  await page.evaluate(() => { window.__STEAM_CLEAR_PROGRESS_OVERRIDE__ = 1; });
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.skill?.steamClear.active === false
      && window.__THREE_GAME_DIAGNOSTICS__?.activeAnimations === 0,
    null,
    { timeout: 30_000 },
  );
  await page.evaluate(() => { window.__STEAM_CLEAR_PROGRESS_OVERRIDE__ = undefined; });

  const triggered = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  expect(triggered.skill!.debuff).toBeNull();
  expect(triggered.skill!.steamClear.active).toBe(false);

  const screenshot = await page.locator('#game-canvas').screenshot();
  await Promise.all([
    writeFile(path.join(ARTIFACT_DIR, 'fan-skill-test-clear-start.png'), clearStart),
    writeFile(path.join(ARTIFACT_DIR, 'fan-skill-test-clear-mid.png'), clearMid),
    writeFile(path.join(ARTIFACT_DIR, 'fan-skill-test-triggered.png'), screenshot),
    writeFile(
      path.join(ARTIFACT_DIR, 'runtime-diagnostics.json'),
      `${JSON.stringify(triggered.skill, null, 2)}\n`,
      'utf8',
    ),
    writeFile(
      path.join(ARTIFACT_DIR, 'steam-renderer-diagnostics.json'),
      `${JSON.stringify({ active: initial.renderer, cleared: triggered.renderer }, null, 2)}\n`,
      'utf8',
    ),
  ]);
  const image = PNG.sync.read(screenshot);
  let minimum = Number.POSITIVE_INFINITY;
  let maximum = Number.NEGATIVE_INFINITY;
  for (let index = 0; index < image.width * image.height; index += 1) {
    const offset = index * 4;
    const value = image.data[offset] + image.data[offset + 1] + image.data[offset + 2];
    minimum = Math.min(minimum, value);
    maximum = Math.max(maximum, value);
  }
  expect(maximum - minimum).toBeGreaterThan(120);
});

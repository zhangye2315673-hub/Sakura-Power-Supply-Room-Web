import { expect, test, type Page } from '@playwright/test';
import { availableCableEnds, makeRuntime } from '../src/puzzle/collision';
import { generatePuzzle } from '../src/puzzle/generator';
import { validatePuzzleGeometry } from '../src/puzzle/geometryValidation';
import { CAMPAIGN_LEVELS, getRandomLevel } from '../src/puzzle/levels';
import {
  RANDOM_CHALLENGE_MODE_WEIGHTS,
  selectRandomChallengeMode,
} from '../src/puzzle/randomChallengeModes';

function interactiveDoubleEndedSeed(): number {
  return Array.from({ length: 1_000 }, (_, candidate) => candidate)
    .find((candidate) => {
      const level = getRandomLevel(candidate);
      return level.challengeKind === 'double-ended' && level.referenceTargetCount === 42;
    })!;
}

async function enterDoubleEndedBriefing(page: Page, seed: number): Promise<void> {
  await page.goto(`/?seed=${seed}&mode=random&direct=1`);
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true,
    null,
    { timeout: 120_000 },
  );
  if (await page.locator('#start-game-button').isVisible()) {
    await page.click('#start-game-button');
  }
  await expect(page.locator('#double-ended-briefing-panel')).toBeVisible({ timeout: 90_000 });
}

async function rotateUntilVisibleExit(page: Page) {
  const canvas = page.locator('#game-canvas');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Game canvas has no screen bounds');

  for (let turn = 0; turn < 10; turn += 1) {
    const target = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.clickTarget ?? null);
    if (target) return target;
    const centerX = box.x + box.width * 0.5;
    const centerY = box.y + box.height * 0.5;
    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    await page.mouse.move(centerX + 110, centerY, { steps: 4 });
    await page.mouse.up();
    await page.waitForTimeout(460);
  }

  throw new Error('No visible exit found after a full manual orbit');
}

test('double-ended and RUSH modes have equal twenty-percent random-pool weights', () => {
  const doubleEndedWeight = RANDOM_CHALLENGE_MODE_WEIGHTS.find(
    ({ mode }) => mode === 'double-ended',
  )?.weight;
  const rushWeight = RANDOM_CHALLENGE_MODE_WEIGHTS.find(({ mode }) => mode === 'rush')?.weight;
  expect(doubleEndedWeight).toBe(20);
  expect(rushWeight).toBe(doubleEndedWeight);

  const doubleEnded = Array.from({ length: 10_000 }, (_, seed) => ({
    mode: selectRandomChallengeMode(seed),
    level: getRandomLevel(seed),
  })).filter(({ mode, level }) => mode === 'double-ended' && level.challengeKind === 'double-ended');
  const rushCount = Array.from(
    { length: 10_000 },
    (_, seed) => selectRandomChallengeMode(seed),
  ).filter((mode) => mode === 'rush').length;

  expect(doubleEnded.length).toBeGreaterThanOrEqual(1_800);
  expect(doubleEnded.length).toBeLessThanOrEqual(2_200);
  expect(rushCount).toBeGreaterThanOrEqual(1_800);
  expect(rushCount).toBeLessThanOrEqual(2_200);
  expect(Math.abs(doubleEnded.length - rushCount)).toBeLessThanOrEqual(200);
  expect(doubleEnded.every(({ level }) =>
    level.referenceTargetCount !== undefined &&
    level.targetCount === Math.round(level.referenceTargetCount * 0.8)
  )).toBe(true);
  expect(doubleEnded.every(({ level }) => getRandomLevel(level.seed).challengeKind === 'double-ended')).toBe(true);
});

test('campaign levels remain single-ended tutorial and progression levels', () => {
  expect(CAMPAIGN_LEVELS.every((level) => level.challengeKind === undefined)).toBe(true);
});

test('double-ended mode explains the rule without revealing exits or moving the opening view', async ({ page }) => {
  test.setTimeout(180_000);
  const seed = interactiveDoubleEndedSeed();
  await enterDoubleEndedBriefing(page, seed);

  const diagnostics = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  expect(diagnostics.availableArrows).toBeGreaterThanOrEqual(1);
  expect(diagnostics.doubleEndedHints?.visibleEnds).toBe(0);
  expect(diagnostics.doubleEndedHints?.visibleClickTargets).toBe(0);
  expect(diagnostics.hint.remaining).toBe(3);
  expect(diagnostics.hint.maximum).toBe(3);
  expect(diagnostics.orbit.yaw).toBeCloseTo(0.76, 4);
  expect(diagnostics.orbit.pitch).toBeCloseTo(0.56, 4);
  expect(diagnostics.doubleEndedHints?.briefingVisible).toBe(true);
  await page.click('#double-ended-start-button');
  await expect(page.locator('#double-ended-briefing-panel')).not.toBeVisible();
  expect(await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.doubleEndedHints.briefingVisible))
    .toBe(false);
});

test('double-ended generator produces a complete solvable route with one to three live exits', () => {
  test.setTimeout(120_000);
  const seeds = Array.from({ length: 5_000 }, (_, candidate) => candidate)
    .filter((candidate) => getRandomLevel(candidate).challengeKind === 'double-ended')
    .slice(0, 12);
  expect(seeds).toHaveLength(12);
  let sawThreeChoiceStep = false;

  for (const seed of seeds) {
    const level = getRandomLevel(seed);
    const puzzle = generatePuzzle(seed, level.targetCount, {
      shape: level.shape,
      lengthQuota: level.lengthQuota,
      minInitiallyFree: level.minInitiallyFree,
      maxInitiallyFree: level.maxInitiallyFree,
      level,
      mode: 'random',
    });

    expect(puzzle.challengeKind).toBe('double-ended');
    expect(puzzle.arrows).toHaveLength(level.targetCount);
    expect(puzzle.arrows.every((arrow) => arrow.doubleEnded)).toBe(true);
    expect(puzzle.solutionEnds).toHaveLength(puzzle.arrows.length);
    expect(validatePuzzleGeometry(puzzle.arrows), `seed ${seed}`).toEqual([]);

    const runtimes = puzzle.arrows.map(makeRuntime);
    const choicesPerStep: number[] = [];
    puzzle.solution.forEach((id, index) => {
      const choices = availableCableEnds(runtimes);
      choicesPerStep.push(choices.length);
      expect(choices.length, `seed ${seed}, cable ${id}`).toBeGreaterThanOrEqual(1);
      expect(choices.length, `seed ${seed}, cable ${id}`).toBeLessThanOrEqual(3);
      expect(choices).toContainEqual({ id, end: puzzle.solutionEnds![index] });
      runtimes.find((runtime) => runtime.definition.id === id)!.state = 'removed';
    });
    expect(choicesPerStep.filter((count) => count <= 2).length / choicesPerStep.length)
      .toBeGreaterThanOrEqual(0.8);
    if (choicesPerStep.includes(3)) sawThreeChoiceStep = true;

    const alternate = puzzle.arrows.map(makeRuntime);
    for (let step = 0; step < alternate.length; step += 1) {
      const choices = availableCableEnds(alternate);
      expect(choices.length, `alternate seed ${seed}, step ${step}`).toBeGreaterThanOrEqual(1);
      if (choices.length === 3) sawThreeChoiceStep = true;
      const selected = choices[(seed + step) % choices.length];
      alternate.find((runtime) => runtime.definition.id === selected.id)!.state = 'removed';
    }
  }
  expect(sawThreeChoiceStep).toBe(true);
});

test('player can pull the selected end and a blocked end costs one heart', async ({ page }) => {
  test.setTimeout(300_000);
  const seed = interactiveDoubleEndedSeed();
  await enterDoubleEndedBriefing(page, seed);
  await expect(page.locator('#double-ended-briefing-panel')).toBeVisible();
  await page.click('#double-ended-start-button');
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.challengeKind === 'double-ended',
    null,
    { timeout: 30_000 },
  );

  const available = await rotateUntilVisibleExit(page);
  const prepared = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  expect(prepared.doubleEndedCables).toBe(prepared.totalArrows);
  expect(prepared.availableArrows).toBeGreaterThanOrEqual(1);
  expect(prepared.availableArrows).toBeLessThanOrEqual(3);
  await page.mouse.click(available.x, available.y);
  await page.waitForFunction(
    ({ id, end }) => {
      const motion = window.__THREE_GAME_DIAGNOSTICS__?.activeMotion;
      return motion?.id === id && motion.end === end && motion.kind === 'exit';
    },
    { id: available.id, end: available.end },
    { timeout: 5_000 },
  );
  await page.waitForFunction(
    () => (window.__THREE_GAME_DIAGNOSTICS__?.activeAnimations ?? 0) === 0,
    null,
    { timeout: 90_000 },
  );

  const blocked = await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.blockedClickTarget ?? null,
    null,
    { timeout: 10_000 },
  );
  const blockedPoint = await blocked.jsonValue();
  if (!blockedPoint) throw new Error('No blocked double-ended plug target found');
  await page.mouse.click(blockedPoint.x, blockedPoint.y);
  await expect(page.locator('#random-lives i.lost')).toHaveCount(1);
});

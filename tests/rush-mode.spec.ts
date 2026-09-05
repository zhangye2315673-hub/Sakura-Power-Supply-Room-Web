import { expect, test } from '@playwright/test';
import { measureWiringComplexity, removalSequenceIsValid } from '../src/puzzle/difficulty';
import { validatePuzzleGeometry } from '../src/puzzle/geometryValidation';
import {
  RUSH_CHALLENGES,
  RUSH_RANDOM_LINE_RATIO,
  RUSH_WARMUP_RULES,
  buildRushPuzzle,
  getNextRushChallenge,
  pickRushChallenge,
} from '../src/puzzle/rushChallenges';
import { selectRandomChallengeMode } from '../src/puzzle/randomChallengeModes';
import { RushRound } from '../src/game/RushRound';
import {
  capRushTimerScaleToTopQuarter,
  mapRushTimerContentScale,
  measureRushVisualPressure,
} from '../src/systems/RushModeUi';

test.describe('RUSH challenge cards', () => {
  test('defines two low-turn warm-ups followed by eight reference-density challenges', () => {
    test.setTimeout(120_000);
    expect(RUSH_CHALLENGES).toHaveLength(10);
    expect(new Set(RUSH_CHALLENGES.map((challenge) => challenge.id)).size).toBe(10);
    expect(RUSH_CHALLENGES.map((challenge) => challenge.level.targetCount))
      .toEqual([20, 22, 34, 34, 37, 37, 37, 37, 40, 44]);
    expect(RUSH_CHALLENGES.map((challenge) => challenge.timeLimitSeconds))
      .toEqual([43, 47, 67, 69, 74, 78, 81, 84, 90, 96]);

    for (const [index, challenge] of RUSH_CHALLENGES.entries()) {
      const first = buildRushPuzzle(challenge);
      const second = buildRushPuzzle(challenge);
      const referenceTargetCount = challenge.level.referenceTargetCount;
      const referenceFloor = Math.ceil((referenceTargetCount ?? 0) * RUSH_RANDOM_LINE_RATIO);
      const warmup = index < RUSH_WARMUP_RULES.challengeCount;

      expect(challenge.timeLimitSeconds).toBeGreaterThan(0);
      expect(referenceTargetCount).toBeDefined();
      if (warmup) {
        const shortShare = first.arrows.filter((arrow) => arrow.lengthClass === 'short').length
          / first.arrows.length;
        const longShare = first.arrows.filter((arrow) => arrow.lengthClass === 'long').length
          / first.arrows.length;
        expect(challenge.level.targetCount).toBeLessThan(referenceFloor);
        expect(shortShare).toBeGreaterThanOrEqual(RUSH_WARMUP_RULES.minimumShortShare);
        expect(longShare).toBeLessThanOrEqual(RUSH_WARMUP_RULES.maximumLongShare);
        expect(measureWiringComplexity(first.arrows).averageTurns)
          .toBeLessThanOrEqual(RUSH_WARMUP_RULES.maximumAverageTurns);
        expect(first.initiallyFree).toBeGreaterThanOrEqual(challenge.level.minInitiallyFree);
        expect(first.initiallyFree).toBeLessThanOrEqual(challenge.level.maxInitiallyFree);
      } else {
        expect(challenge.level.targetCount).toBeGreaterThanOrEqual(referenceFloor);
      }
      expect(challenge.title.zh).not.toBe('');
      expect(challenge.title.en).not.toBe('');
      expect(challenge.objective.zh).not.toBe('');
      expect(challenge.objective.en).not.toBe('');
      expect(challenge.layout.arrows).toHaveLength(challenge.level.targetCount);
      expect(first.mode).toBe('rush');
      expect(first.arrows).toHaveLength(challenge.level.targetCount);
      expect(second.arrows).toEqual(first.arrows);
      expect(removalSequenceIsValid(first.arrows, first.solution)).toBe(true);
      expect(validatePuzzleGeometry(first.arrows)).toEqual([]);
      expect(challenge.validation).toEqual({
        solvable: true,
        geometrySafe: true,
      });
    }
  });

  test('randomizes only the selected fixed card and includes all challenge types in the total pool', () => {
    const selected = Array.from({ length: 40 }, (_, seed) => pickRushChallenge(seed).id);
    expect(new Set(selected).size).toBeGreaterThan(1);
    expect(new Set(Array.from({ length: 100 }, (_, seed) => selectRandomChallengeMode(seed))))
      .toEqual(new Set(['standard', 'exploration', 'double-ended', 'rush', 'skill']));
    expect(getNextRushChallenge(RUSH_CHALLENGES[0])?.id).toBe('rush-02');
    expect(getNextRushChallenge(RUSH_CHALLENGES.at(-1)!)).toBeNull();
  });
});

test('RUSH countdown spans the whole round and expires without lives or time penalties', () => {
  const round = new RushRound(12);
  expect(round.phase).toBe('briefing');
  expect(round.remainingSeconds).toBe(12);

  round.start();
  round.update(2.25);
  const afterFirstRemoval = round.remainingSeconds;
  round.recordRemoval();
  expect(round.remainingSeconds).toBe(afterFirstRemoval);

  round.recordMistake();
  expect(round.remainingSeconds).toBe(afterFirstRemoval);
  expect(round.update(20)).toBe('failed');
  expect(round.phase).toBe('failed');
  expect(round.remainingSeconds).toBe(0);

  const cleared = new RushRound(12);
  cleared.start();
  cleared.recordRemoval();
  cleared.succeed();
  expect(cleared.phase).toBe('succeeded');
});

test('RUSH visual pressure grows toward a two-times cap and strengthens the edge warning', () => {
  const opening = measureRushVisualPressure(48, 48);
  const finalFive = measureRushVisualPressure(5, 48);
  const expired = measureRushVisualPressure(0, 48);

  expect(opening.baseScale).toBe(1);
  expect(finalFive.baseScale).toBeGreaterThan(1.35);
  expect(finalFive.tickScale).toBeGreaterThan(finalFive.baseScale);
  expect(mapRushTimerContentScale(finalFive.baseScale)).toBeGreaterThan(1.15);
  expect(finalFive.edgePressure).toBeGreaterThan(0.6);
  expect(expired.baseScale).toBe(2);
  expect(expired.tickScale).toBe(2);
  expect(expired.edgePressure).toBe(1);
  expect(capRushTimerScaleToTopQuarter(2, 720, 14, 54)).toBe(2);
  expect(capRushTimerScaleToTopQuarter(2, 320, 14, 54)).toBeCloseTo(1.2222, 3);
  expect(mapRushTimerContentScale(2)).toBe(2);
});

test('main screen exposes RUSH and its briefing enters a cable-only timed scene', async ({ page }) => {
  test.setTimeout(120_000);
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.addInitScript(() => window.localStorage.setItem('plug-spirits-locale', 'en'));
  await page.goto('/');
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true,
    null,
    { timeout: 90_000 },
  );

  await page.click('#challenge-mode-button');
  await expect(page.locator('#start-rush-button')).toBeVisible();
  await expect(page.locator('#start-rush-button')).toBeEnabled();
  await page.click('#start-rush-button');
  await page.waitForTimeout(500);
  expect(pageErrors).toEqual([]);

  await expect(page.locator('#rush-briefing-panel')).toBeVisible({ timeout: 35_000 });
  await expect(page.locator('#rush-briefing-panel')).toContainText('RUSH');
  await expect(page.locator('#rush-briefing-time')).not.toHaveText('');
  await expect(page.locator('#rush-briefing-title')).toHaveText('SAKURA CORE WARM-UP');
  await expect(page.locator('#rush-briefing-goal')).toHaveText('Quick-clear 20 short cables');
  await expect(page.locator('#hint-button')).not.toBeVisible();
  await page.click('#rush-start-button');

  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.rush?.phase === 'running',
    null,
    { timeout: 10_000 },
  );
  const started = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__ ?? null);
  expect(started?.mode).toBe('rush');
  expect(started?.rush?.challengeId).toBe('rush-01');
  expect(started?.rush?.flow).toBe('sequence');
  expect(started?.sceneVisibility.appliances).toBe(false);
  expect(started?.sceneVisibility.connections).toBe(false);
  expect(started?.appliances).toEqual([]);
  expect(started?.hint.enabled).toBe(false);
  expect(started?.hint.remaining).toBe(3);
  expect(started?.hint.maximum).toBe(3);
  await expect(page.locator('#rush-timer')).toBeVisible();
  await expect(page.locator('#random-lives')).not.toBeVisible();
  await expect(page.locator('#hint-button')).not.toBeVisible();

  const initialLayout = await page.locator('#rush-timer').evaluate((element) => {
    const timer = element.getBoundingClientRect();
    return { width: timer.width, height: timer.height };
  });
  expect(initialLayout).toEqual({ width: 126, height: 61 });

  const firstTime = started?.rush?.remainingSeconds ?? 0;
  const firstTickScale = await page.locator('#rush-timer').evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).getPropertyValue('--rush-tick-scale')));
  await page.waitForTimeout(1_100);
  const laterTime = await page.evaluate(
    () => window.__THREE_GAME_DIAGNOSTICS__?.rush?.remainingSeconds ?? 0,
  );
  expect(laterTime).toBeLessThan(firstTime);
  const laterTickScale = await page.locator('#rush-timer').evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).getPropertyValue('--rush-tick-scale')));
  expect(laterTickScale).toBeGreaterThan(firstTickScale);
  expect(laterTickScale).toBeLessThanOrEqual(2);
  await expect(page.locator('#rush-timer')).toHaveClass(/tick/);

  const timerAnimation = await page.locator('#rush-timer').evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const timerStyle = getComputedStyle(element);
    const valueStyle = getComputedStyle(element.querySelector('strong')!);
    return {
      width: bounds.width,
      height: bounds.height,
      timerAnimationName: timerStyle.animationName,
      valueAnimationName: valueStyle.animationName,
    };
  });
  expect(timerAnimation.timerAnimationName).toBe('rush-timer-tick');
  expect(timerAnimation.valueAnimationName).toBe('none');
});

test('RUSH failure retries the exact same fixed card', async ({ page }) => {
  test.setTimeout(175_000);
  await page.goto('/?mode=rush&direct=1&rush=rush-01');
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true,
    null,
    { timeout: 90_000 },
  );
  await page.click('#challenge-mode-button');
  await page.click('#start-rush-button');
  await expect(page.locator('#rush-briefing-panel')).toBeVisible({ timeout: 35_000 });
  const original = await page.evaluate(() => ({
    challengeId: window.__THREE_GAME_DIAGNOSTICS__?.rush?.challengeId,
    signature: window.__THREE_GAME_DIAGNOSTICS__?.layoutSignature,
  }));
  await page.click('#rush-start-button');
  await page.waitForFunction(
    () => {
      const rush = window.__THREE_GAME_DIAGNOSTICS__?.rush;
      return rush?.phase === 'running' && rush.remainingSeconds <= 5;
    },
    null,
    { timeout: 70_000 },
  );
  const pressureVisuals = await page.evaluate(() => {
    const timer = document.querySelector<HTMLElement>('#rush-timer')!;
    const edge = document.querySelector<HTMLElement>('#rush-edge-alert')!;
    const timerStyle = getComputedStyle(timer);
    const edgeStyle = getComputedStyle(edge);
    const bounds = timer.getBoundingClientRect();
    const hintBounds = document.querySelector<HTMLElement>('#hint-button')!.getBoundingClientRect();
    return {
      timerClasses: [...timer.classList],
      edgeClasses: [...edge.classList],
      baseScale: Number.parseFloat(timerStyle.getPropertyValue('--rush-base-scale')),
      tickScale: Number.parseFloat(timerStyle.getPropertyValue('--rush-tick-scale')),
      edgePressure: Number.parseFloat(edgeStyle.getPropertyValue('--rush-edge-pressure')),
      timerBottom: bounds.bottom,
      overlapsHint: !(
        bounds.right <= hintBounds.left
        || bounds.left >= hintBounds.right
        || bounds.bottom <= hintBounds.top
        || bounds.top >= hintBounds.bottom
      ),
      viewportHeight: window.innerHeight,
      finalRedOpacity: Number.parseFloat(getComputedStyle(timer, '::before').opacity),
    };
  });
  expect(pressureVisuals.timerClasses).toContain('critical');
  expect(pressureVisuals.edgeClasses).toContain('visible');
  expect(pressureVisuals.baseScale).toBeGreaterThan(1.005);
  expect(pressureVisuals.tickScale).toBeLessThanOrEqual(2);
  expect(pressureVisuals.edgePressure).toBeGreaterThan(0.6);
  expect(pressureVisuals.finalRedOpacity).toBeGreaterThan(0.4);
  expect(pressureVisuals.timerBottom).toBeLessThan(pressureVisuals.viewportHeight * 0.25);
  expect(pressureVisuals.overlapsHint).toBe(false);
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.rush?.phase === 'failed',
    null,
    { timeout: 80_000 },
  );

  await expect(page.locator('#rush-result-title')).toHaveText('挑战失败');
  await expect(page.locator('#rush-retry-button')).toBeVisible();
  await expect(page.locator('#rush-next-button')).not.toBeVisible();
  await page.click('#rush-retry-button');
  await expect(page.locator('#rush-briefing-panel')).toBeVisible();
  const retry = await page.evaluate(() => ({
    challengeId: window.__THREE_GAME_DIAGNOSTICS__?.rush?.challengeId,
    signature: window.__THREE_GAME_DIAGNOSTICS__?.layoutSignature,
    phase: window.__THREE_GAME_DIAGNOSTICS__?.rush?.phase,
    remaining: window.__THREE_GAME_DIAGNOSTICS__?.rush?.remainingSeconds,
  }));
  expect(retry.challengeId).toBe(original.challengeId);
  expect(retry.signature).toBe(original.signature);
  expect(retry.phase).toBe('briefing');
  expect(retry.remaining).toBe(43);
});

test('RUSH success advances from the first warm-up to the second', async ({ page }) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => {
    window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 0;
  });
  await page.goto('/?mode=rush&direct=1&rush=rush-01');
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true,
    null,
    { timeout: 90_000 },
  );
  await page.click('#challenge-mode-button');
  await page.click('#start-rush-button');
  await expect(page.locator('#rush-briefing-panel')).toBeVisible({ timeout: 35_000 });
  await page.click('#rush-start-button');

  const solution = [...RUSH_CHALLENGES[0].layout.solution];
  const activationResults = await page.evaluate((ids) => ids.map((id) => ({
    id,
    activated: window.__ACTIVATE_RUSH_CABLE_FOR_EVIDENCE__?.(id) ?? false,
  })), solution);
  expect(activationResults.filter(({ activated }) => !activated)).toEqual([]);

  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.rush?.phase === 'succeeded',
    null,
    { timeout: 5_000 },
  );
  await expect(page.locator('#rush-result-title')).toHaveText('挑战成功');
  await expect(page.locator('#rush-next-button')).toBeVisible();
  await expect(page.locator('#rush-next-button')).toHaveText('重新挑战');
  await expect(page.locator('#rush-retry-button')).not.toBeVisible();

  const revision = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.puzzleRevision ?? 0);
  await page.click('#rush-next-button');
  await page.waitForFunction(
    (previousRevision) => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      const urlMode = new URL(window.location.href).searchParams.get('mode');
      return diagnostics !== undefined
        && diagnostics.mode === 'rush'
        && diagnostics.rush?.challengeId === 'rush-02'
        && diagnostics.rush.flow === 'sequence'
        && (diagnostics.puzzleRevision ?? 0) > previousRevision
        && urlMode === 'rush';
    },
    revision,
    { timeout: 35_000 },
  );
  await expect(page.locator('#rush-result-panel')).not.toBeVisible();
  await expect(page.locator('#rush-briefing-panel')).toBeVisible();
  await expect(page.locator('#rush-briefing-title')).toHaveText('花筒起速');
});

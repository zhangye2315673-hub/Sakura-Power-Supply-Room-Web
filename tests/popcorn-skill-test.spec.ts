import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

test('popcorn skill uses a local plug marker instead of hearts or whole-cable glow', async ({ page }) => {
  test.setTimeout(180_000);
  await page.addInitScript(() => {
    window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 0;
  });
  await page.goto('/?theme=day&mode=skill-test&direct=1&skill=popcorn-machine&seed=20260825');
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true
      && typeof window.__FINISH_OPENING_FOR_EVIDENCE__ === 'function'
      && typeof window.__PULL_CABLE_FOR_EVIDENCE__ === 'function',
    null,
    { timeout: 90_000 },
  );
  expect(await page.evaluate(() => window.__FINISH_OPENING_FOR_EVIDENCE__?.() ?? false)).toBe(true);
  await page.waitForFunction(
    () => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      return diagnostics?.opening.active === false
        && diagnostics.opening.transitioning === false
        && diagnostics.skill?.testId === 'popcorn-machine'
        && diagnostics.skill.inputLocked === false;
    },
    null,
    { timeout: 90_000 },
  );

  await expect(page.locator('#random-lives')).toBeVisible();
  await expect(page.locator('#random-lives div > i')).toHaveCount(3);
  expect((await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!)).skill?.maxLives).toBe(3);

  const burstObserved = page.waitForFunction(
    () => document.querySelector('#random-lives')?.classList.contains('popcorn-burst') === true,
    null,
    { timeout: 10_000 },
  );
  expect(await page.evaluate(() => window.__PULL_CABLE_FOR_EVIDENCE__?.() ?? false)).toBe(true);
  await burstObserved;
  await page.waitForFunction(
    () => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      const skill = diagnostics?.skill;
      return skill?.phase === 'idle'
        && skill.inputLocked === false
        && skill.maxLives === 4
        && skill.lives === 4
        && skill.popcornHintCableId !== null
        && skill.popcornMarkers.length === 1
        && skill.popcornTransientCount === 0
        && diagnostics?.activeAnimations === 0
        && diagnostics.queuedConnections === 0
        && diagnostics.activeConnections === 0;
    },
    null,
    { timeout: 90_000 },
  );

  const afterFirstSkill = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.skill!);
  const targetId = afterFirstSkill.popcornHintCableId!;
  expect(afterFirstSkill.effectAssets).toContain('popcorn-target-marker');
  expect(afterFirstSkill.effectAssets).not.toContain('popcorn-heart-crown');
  expect(afterFirstSkill.popcornMarkers).toEqual([
    expect.objectContaining({
      cableId: targetId,
      kernelCount: 3,
      ringSegmentCount: 8,
      rayCount: 6,
      ringTubeRadius: 0.055,
      orientationMode: 'plug-end',
    }),
  ]);
  expect(afterFirstSkill.popcornTransientCount).toBe(0);
  expect(afterFirstSkill.popcornMarkers[0].directionAlignment).toBeGreaterThan(0.999);
  expect(afterFirstSkill.popcornMarkers[0].kernelAngularGaps).toHaveLength(3);
  afterFirstSkill.popcornMarkers[0].kernelAngularGaps.forEach((gap) => {
    expect(gap).toBeCloseTo(Math.PI * 2 / 3, 5);
  });
  expect(afterFirstSkill.cableEffects.find(({ id }) => id === targetId)?.glowStrength).toBe(0);
  await expect(page.locator('#random-lives div > i')).toHaveCount(4);

  expect(await page.evaluate(() => window.__SETTLE_APPLIANCE_FOR_EVIDENCE__?.() ?? false)).toBe(true);
  await page.waitForFunction(
    () => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      return diagnostics?.activeAnimations === 0
        && diagnostics.activeConnections === 0
        && diagnostics.availableArrows > 0;
    },
    null,
    { timeout: 45_000 },
  );
  expect(await page.evaluate((id) => window.__PULL_CABLE_FOR_EVIDENCE__?.(id) ?? false, targetId)).toBe(true);
  await page.waitForFunction(
    (removedId) => {
      const skill = window.__THREE_GAME_DIAGNOSTICS__?.skill;
      return skill?.inputLocked === false
        && !skill.remainingCableIds.includes(removedId)
        && !skill.popcornMarkers.some(({ cableId }) => cableId === removedId);
    },
    targetId,
    { timeout: 90_000 },
  );
});

test('deprecated popcorn heart asset is removed from source and review tooling', () => {
  const modelKit = readFileSync('src/skill/SkillEffectModelKit.ts', 'utf8');
  const assetTest = readFileSync('tests/skill-effect-assets.spec.ts', 'utf8');
  const captureScript = readFileSync('scripts/capture-skill-effect-review.mjs', 'utf8');
  expect(`${modelKit}\n${assetTest}\n${captureScript}`).not.toContain('popcorn-heart-crown');
  expect(modelKit).not.toContain('heart-cluster');
  expect(modelKit).not.toContain('prompt-crown');
});

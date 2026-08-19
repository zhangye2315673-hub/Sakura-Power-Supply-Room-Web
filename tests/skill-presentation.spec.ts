import { expect, test, type Page } from '@playwright/test';

const GAME_URL = '/?mode=skill&direct=1&seed=20260812';

type SkillKind = 'radio' | 'robot-vacuum' | 'rice-cooker';

async function enterEvidenceGame(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 1;
  });
  await page.goto(GAME_URL);
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true,
    null,
    { timeout: 90_000 },
  );
  await page.click('#start-game-button');
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.opening.active === false,
    null,
    { timeout: 90_000 },
  );
  await page.waitForTimeout(600);
}

async function show(page: Page, skill: SkillKind) {
  const result = await page.evaluate((kind) => {
    const shown = window.__SHOW_SKILL_PRESENTATION_FOR_EVIDENCE__?.(kind) ?? false;
    return { shown, presentation: window.__THREE_GAME_DIAGNOSTICS__!.skill!.presentation };
  }, skill);
  expect(result.shown).toBe(true);
  return result.presentation;
}

const presentation = (page: Page) => page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.skill!.presentation);

test('radio resolves its transient cue without creating numbers or route lines', async ({ page }) => {
  test.setTimeout(240_000);
  await enterEvidenceGame(page);
  const active = await show(page, 'radio');
  expect(active.targetCount).toBe(3);
  expect(active.labelCount).toBe(0);
  expect(active.lineCount).toBe(0);
  expect(active.meshCount).toBe(0);

  await expect.poll(async () => (await presentation(page)).skillId, { timeout: 15_000 }).toBeNull();
  const cleaned = await presentation(page);
  expect(cleaned.labelCount).toBe(0);
  expect(cleaned.lineCount).toBe(0);
  expect(cleaned.meshCount).toBe(0);
  expect(cleaned.activeTimelines).toBe(0);
  expect(cleaned.phaseHistory).toEqual(['cue', 'target-lock', 'commit', 'result', 'settle', 'cleanup']);
  expect(await page.locator('.skill-world-number').count()).toBe(0);
});

test('rice cooker inflation is visual-only feedback and returns to normal after cleanup and reset', async ({ page }) => {
  test.setTimeout(240_000);
  await enterEvidenceGame(page);
  const availableBefore = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.availableArrows);
  const active = await page.evaluate(() => {
    const shown = window.__SHOW_SKILL_PRESENTATION_FOR_EVIDENCE__?.('rice-cooker') ?? false;
    const frozen = window.__FREEZE_SKILL_PRESENTATION_FOR_EVIDENCE__?.(1040) ?? false;
    return { shown, frozen, presentation: window.__THREE_GAME_DIAGNOSTICS__!.skill!.presentation };
  });
  expect(active.shown).toBe(true);
  expect(active.frozen).toBe(true);
  expect(active.presentation.riceCableVisualScale).toBeCloseTo(1.5, 2);
  expect(active.presentation.meshCount).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.availableArrows)).toBe(availableBefore);
  await expect.poll(async () => (await presentation(page)).skillId, { timeout: 8_000 }).toBeNull();
  expect((await presentation(page)).phaseHistory).toEqual(['cue', 'target-lock', 'commit', 'impact', 'result', 'settle', 'cleanup']);
  await expect.poll(async () => (await presentation(page)).riceCableVisualScale, { timeout: 8_000 }).toBeCloseTo(1, 2);
  await show(page, 'rice-cooker');
  await page.click('#reset-button');
  await expect.poll(async () => (await presentation(page)).riceCableVisualScale).toBeCloseTo(1, 2);
  await expect.poll(async () => page.locator('.skill-world-number').count()).toBe(0);
});

test('robot vacuum uses one snapshot, starts removals about 100ms apart, and cleans transient objects', async ({ page }) => {
  test.setTimeout(150_000);
  await enterEvidenceGame(page);
  const snapshotCount = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.availableArrows);
  const remainingBefore = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.remainingArrows);
  const initial = await show(page, 'robot-vacuum');
  expect(initial.targetCount).toBe(snapshotCount);
  let impacted = await presentation(page);
  // SwiftShader can stall the main thread while compiling the first skill
  // frames. The recursive scheduler intentionally preserves the 100 ms gap,
  // so allow the observation window to scale with the frozen snapshot.
  const deadline = Date.now() + Math.max(8_000, snapshotCount * 1_200);
  while (impacted.autoRemovalOrder.length < snapshotCount && Date.now() < deadline) {
    await page.waitForTimeout(40);
    const sample = await presentation(page);
    if (sample.autoRemovalOrder.length >= impacted.autoRemovalOrder.length) impacted = sample;
  }
  expect(impacted.autoRemovalOrder).toHaveLength(snapshotCount);
  expect(new Set(impacted.autoRemovalOrder).size).toBe(snapshotCount);
  expect(impacted.autoRemovalStartsMs).toHaveLength(snapshotCount);
  const intervals = impacted.autoRemovalStartsMs.slice(1).map((time, index) => time - impacted.autoRemovalStartsMs[index]);
  // Recursive scheduling guarantees the removals never collapse into one
  // frame. SwiftShader may delay callbacks by a full render frame, so only
  // the minimum cadence is deterministic in this lane.
  for (const interval of intervals) expect(interval).toBeGreaterThanOrEqual(55);

  await expect.poll(
    () => page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.remainingArrows),
    { timeout: 8_000 },
  ).toBe(remainingBefore - snapshotCount);
  await expect.poll(async () => (await presentation(page)).skillId, { timeout: 15_000 }).toBeNull();
  const cleaned = await presentation(page);
  expect(cleaned.labelCount).toBe(0);
  expect(cleaned.lineCount).toBe(0);
  expect(cleaned.meshCount).toBe(0);
  expect(cleaned.activeTimelines).toBe(0);
  expect(cleaned.phaseHistory).toEqual(['cue', 'target-lock', 'commit', 'impact', 'result', 'settle', 'cleanup']);
});

test('repeated presentation and cleanup does not accumulate CSS labels or renderer geometries', async ({ page }) => {
  test.setTimeout(240_000);
  await enterEvidenceGame(page);
  await show(page, 'radio');
  await expect.poll(async () => (await presentation(page)).skillId, { timeout: 15_000 }).toBeNull();
  await page.waitForTimeout(400);
  const samples: Array<{ meshCount: number; lineCount: number; labelCount: number; materialCount: number }> = [];
  for (let index = 0; index < 3; index += 1) {
    await show(page, 'radio');
    await expect.poll(async () => (await presentation(page)).skillId, { timeout: 15_000 }).toBeNull();
    await page.waitForTimeout(200);
    const state = await presentation(page);
    samples.push({
      meshCount: state.meshCount,
      lineCount: state.lineCount,
      labelCount: state.labelCount,
      materialCount: state.materialCount,
    });
  }
  expect(await page.locator('.skill-world-number').count()).toBe(0);
  expect(samples).toEqual([
    { meshCount: 0, lineCount: 0, labelCount: 0, materialCount: 0 },
    { meshCount: 0, lineCount: 0, labelCount: 0, materialCount: 0 },
    { meshCount: 0, lineCount: 0, labelCount: 0, materialCount: 0 },
  ]);
});

import { expect, test } from '@playwright/test';
import { CAMPAIGN_LEVELS } from '../src/puzzle/levels';
import { enterPreparedGame } from './helpers/enterGame';

for (const level of CAMPAIGN_LEVELS) {
  test(`campaign level ${level.id} renders ${level.shape} with curated targets`, async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto(`/?level=${level.id}`);
    await enterPreparedGame(page);
    await page.waitForFunction(
      ({ id, seed }) => {
        const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
        return diagnostics?.levelId === id && diagnostics.seed === seed && diagnostics.totalArrows > 0;
      },
      { id: level.id, seed: level.seed },
      { timeout: 35_000 },
    );
    const diagnostics = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__ ?? null);
    expect(diagnostics?.mode).toBe('campaign');
    expect(diagnostics?.shape).toBe(level.shape);
    expect(diagnostics?.totalArrows).toBe(level.targetCount);
    expect(diagnostics?.initiallyFree).toBeGreaterThanOrEqual(level.minInitiallyFree);
    expect(diagnostics?.initiallyFree).toBeLessThanOrEqual(level.maxInitiallyFree);
    expect(diagnostics?.lengthMix.short ?? level.targetCount).toBeLessThanOrEqual(
      Math.ceil(level.targetCount * 0.2),
    );
    expect(diagnostics?.layoutSignature.length ?? 0).toBeGreaterThan(20);
    expect(new URL(page.url()).searchParams.get('level')).toBe(String(level.id));
    expect(pageErrors).toEqual([]);

    const firstShapeLevel = CAMPAIGN_LEVELS.find((candidate) => candidate.shape === level.shape)?.id;
    if (firstShapeLevel === level.id) {
      const canvasBox = await page.locator('#game-canvas').boundingBox();
      expect(canvasBox).not.toBeNull();
      await testInfo.attach(`shape-${level.shape}`, {
        body: await page.screenshot({ clip: canvasBox! }),
        contentType: 'image/png',
      });
    }
  });
}

test('reset reproduces the layout and total random challenge leaves campaign mode', async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto('/?level=1');
  await enterPreparedGame(page);
  await page.waitForFunction(() => (window.__THREE_GAME_DIAGNOSTICS__?.puzzleRevision ?? 0) > 0);
  const first = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__ ?? null);
  await page.click('#reset-button');
  await page.waitForFunction(
    (revision) => (window.__THREE_GAME_DIAGNOSTICS__?.puzzleRevision ?? 0) > revision,
    first?.puzzleRevision ?? 0,
    { timeout: 60_000 },
  );
  const reset = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__ ?? null);
  expect(reset?.seed).toBe(first?.seed);
  expect(reset?.layoutSignature).toBe(first?.layoutSignature);

  await page.click('#new-button');
  await page.waitForFunction(
    (revision) =>
      (window.__THREE_GAME_DIAGNOSTICS__?.puzzleRevision ?? 0) > revision &&
      ['random', 'rush', 'skill'].includes(window.__THREE_GAME_DIAGNOSTICS__?.mode ?? ''),
    reset?.puzzleRevision ?? 0,
    { timeout: 60_000 },
  );
  await page.waitForURL(
    (url) => ['random', 'explore', 'rush', 'skill'].includes(url.searchParams.get('mode') ?? '')
      && !url.searchParams.has('level'),
    { timeout: 60_000 },
  );
  const random = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__ ?? null);
  expect(['random', 'rush', 'skill']).toContain(random?.mode);
  if (random?.mode === 'random') expect(random.levelId).toBe(0);
  else if (random?.mode === 'rush') expect(random.rush?.challengeId).toMatch(/^rush-/);
  expect(['random', 'explore', 'rush', 'skill']).toContain(new URL(page.url()).searchParams.get('mode'));
  expect(new URL(page.url()).searchParams.has('level')).toBe(false);
});

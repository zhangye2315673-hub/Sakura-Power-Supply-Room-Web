import { test, expect } from '@playwright/test';

test('formal skill mode never exposes a queued-only cable as a clickable target', async ({ page }) => {
  test.setTimeout(180_000);
  await page.addInitScript(() => {
    window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 0;
  });
  await page.goto('/?theme=day&mode=skill&direct=1&seed=20260829');
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true
      && typeof window.__FINISH_OPENING_FOR_EVIDENCE__ === 'function'
      && typeof window.__ACTIVATE_APPLIANCE_FOR_EVIDENCE__ === 'function',
    null,
    { timeout: 90_000 },
  );
  expect(await page.evaluate(() => window.__FINISH_OPENING_FOR_EVIDENCE__?.() ?? false)).toBe(true);
  await page.waitForFunction(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return diagnostics?.mode === 'skill'
      && diagnostics.opening.active === false
      && diagnostics.opening.transitioning === false
      && diagnostics.skill?.inputLocked === false
      && diagnostics.activeAnimations === 0
      && diagnostics.availableClickTargets.length > 0;
  }, null, { timeout: 45_000 });

  const initial = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  const applianceKind = initial.appliances.find(({ accent, state, dropping }) => state === 'idle'
    && !dropping
    && initial.availableClickTargets.filter(({ color }) => color === accent).length >= 2)?.kind;
  expect(applianceKind).toBeTruthy();
  expect(await page.evaluate(
    (kind) => window.__ACTIVATE_APPLIANCE_FOR_EVIDENCE__?.(kind) ?? false,
    applianceKind!,
  )).toBe(true);

  await page.waitForFunction(
    (kind) => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      return diagnostics?.skill?.inputLocked === false
        && diagnostics.activeAnimations === 0
        && diagnostics.appliances.some(({ kind: currentKind, state }) =>
          currentKind === kind && state === 'active');
    },
    applianceKind,
    { timeout: 45_000 },
  );

  const active = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  const assignableColors = new Set(active.routing.assignableColors);
  const queuedOnlyTargets = active.availableClickTargets.filter(({ color }) => !assignableColors.has(color));
  expect(
    queuedOnlyTargets,
    'skill mode must not publish cables whose appliance can only queue the color',
  ).toEqual([]);

  const clickable = active.availableClickTargets[0];
  expect(clickable).toBeTruthy();
  const remainingBeforeClick = active.remainingArrows;
  await page.mouse.click(clickable.x, clickable.y);
  await page.waitForFunction(
    (remaining) => (window.__THREE_GAME_DIAGNOSTICS__?.remainingArrows ?? remaining) < remaining,
    remainingBeforeClick,
    { timeout: 45_000 },
  );
});

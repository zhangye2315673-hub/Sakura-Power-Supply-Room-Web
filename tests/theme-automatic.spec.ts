import { expect, test } from '@playwright/test';

test('automatic day-night timing, manual reset, and exploration pause', async ({ page }) => {
  await page.route('**/theme-controller-test', (route) => route.fulfill({
    contentType: 'text/html', body: '<html><body></body></html>',
  }));
  await page.goto('/theme-controller-test');
  const result = await page.evaluate(async () => {
    localStorage.clear();
    const load = new Function('return import("/src/theme/ThemeController.ts")') as () => Promise<{
      ThemeController: typeof import('../src/theme/ThemeController').ThemeController;
    }>;
    const { ThemeController } = await load();
    const controller = new ThemeController();
    for (let second = 0; second < 44; second += 1) controller.update(1);
    const before = controller.snapshot;
    controller.update(1);
    const night = controller.snapshot;
    for (let frame = 0; frame < 100; frame += 1) controller.update(0.05);
    const settledNight = controller.snapshot;
    for (let second = 0; second < 40; second += 1) controller.update(1);
    controller.update(0.01);
    const day = controller.snapshot;
    controller.toggle();
    controller.update(0.4);
    const manual = controller.snapshot;
    for (let second = 0; second < 90; second += 1) controller.update(1, false);
    const paused = controller.snapshot;
    for (let second = 0; second < 44; second += 1) controller.update(1);
    controller.update(0.7);
    const resumed = controller.snapshot;
    const saved = localStorage.getItem('sakura.theme');
    controller.dispose();
    return { before, night, settledNight, day, manual, paused, resumed, saved };
  });
  expect(result.before.targetMode).toBe('day');
  expect(result.before.autoRemaining).toBe(1);
  expect(result.night.targetMode).toBe('night');
  expect(result.night.source).toBe('automatic');
  expect(result.night.progress).toBeCloseTo(0.2);
  expect(result.settledNight.progress).toBe(1);
  expect(result.day.targetMode).toBe('day');
  expect(result.manual.targetMode).toBe('night');
  expect(result.manual.autoElapsed).toBeCloseTo(0.4);
  expect(result.paused.automatic).toBe(false);
  expect(result.paused.targetMode).toBe('night');
  expect(result.paused.autoElapsed).toBeCloseTo(0.4);
  expect(result.resumed.targetMode).toBe('day');
  expect(result.resumed.source).toBe('automatic');
  expect(result.saved).toBe('night');
});

test('only the home screen cycles theme and gameplay keeps its entry theme', async ({ page }) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/?theme=day&diagnostics=1');
  await expect(page.locator('#theme-button')).toHaveAttribute('data-mode', 'night', { timeout: 120_000 });
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'night');
  await page.getByRole('button', { name: '设置', exact: true }).click();
  await page.locator('#theme-button').click();
  await expect(page.locator('#theme-button')).toHaveAttribute('data-mode', 'day');
  await page.locator('#settings-done-button').click();
  await page.locator('#start-game-button').click();
  await page.waitForFunction(() => !document.documentElement.classList.contains('opening-active'), {}, { timeout: 90000 });
  const entry = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.theme);
  await page.waitForTimeout(47000);
  const later = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.theme);
  expect(later.automatic).toBe(false);
  expect(later.autoElapsed).toBeCloseTo(entry.autoElapsed, 1);
  expect(later.targetMode).toBe(entry.targetMode);
  expect(errors).toEqual([]);
});

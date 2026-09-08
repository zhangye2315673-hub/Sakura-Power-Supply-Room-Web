import { expect, test } from '@playwright/test';

test('settled season avoids document writes but still updates transitions', async ({ page }) => {
  await page.route('**/season-controller-test', route => route.fulfill({ contentType: 'text/html', body: '<html><body></body></html>' }));
  await page.goto('/season-controller-test');
  const result = await page.evaluate(async () => {
    const load = new Function('return import("/src/theme/SeasonController.ts")') as () => Promise<{
      SeasonController: typeof import('../src/theme/SeasonController').SeasonController;
    }>;
    const { SeasonController } = await load();
    const controller = new SeasonController();
    controller.update(0, 1);
    const observer = new MutationObserver(() => {});
    observer.observe(document.documentElement, { attributes: true });
    for (let frame = 0; frame < 120; frame += 1) controller.update(1 / 60, 1);
    const settled = observer.takeRecords().length;
    controller.update(0.05, 0.5);
    const themeChanged = observer.takeRecords().length;
    controller.setMode('winter', true);
    controller.update(0.05, 0.5);
    const seasonChanged = observer.takeRecords().length;
    const target = document.documentElement.dataset.seasonTarget;
    observer.disconnect();
    controller.dispose();
    return { settled, themeChanged, seasonChanged, target };
  });
  expect(result.settled).toBe(0);
  expect(result.themeChanged).toBeGreaterThan(0);
  expect(result.seasonChanged).toBeGreaterThan(0);
  expect(result.target).toBe('winter');
});

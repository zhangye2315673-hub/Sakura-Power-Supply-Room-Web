import { expect, test } from '@playwright/test';

type WorkerCountWindow = Window & typeof globalThis & {
  __WORKER_CONSTRUCTION_COUNT__?: number;
};

test('random mode startup creates only the active puzzle worker', async ({ page }) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => {
    const workerWindow = window as WorkerCountWindow;
    const NativeWorker = window.Worker;
    workerWindow.__WORKER_CONSTRUCTION_COUNT__ = 0;
    window.Worker = class CountingWorker extends NativeWorker {
      constructor(scriptURL: string | URL, options?: WorkerOptions) {
        workerWindow.__WORKER_CONSTRUCTION_COUNT__ =
          (workerWindow.__WORKER_CONSTRUCTION_COUNT__ ?? 0) + 1;
        super(scriptURL, options);
      }
    };
  });

  await page.goto('/?seed=2679418801&mode=random&direct=1&theme=day&diagnostics=1');
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true,
    null,
    { timeout: 90_000 },
  );

  expect(await page.evaluate(
    () => (window as WorkerCountWindow).__WORKER_CONSTRUCTION_COUNT__ ?? 0,
  )).toBe(1);
});

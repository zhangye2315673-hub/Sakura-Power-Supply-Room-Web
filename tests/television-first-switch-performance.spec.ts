import { expect, test } from '@playwright/test';

type SwitchFrameSample = {
  firstFrameMs: number;
  maxFrameMs: number;
  frameIntervals: number[];
};

test('television first topology switch does not introduce a one-time frame stall', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });

  await page.goto('/?theme=day&mode=skill-test&skill=television&direct=1');
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
        && diagnostics.skill?.testId === 'television'
        && diagnostics.clickTarget !== null;
    },
    null,
    { timeout: 90_000 },
  );

  const target = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.clickTarget!);
  await page.mouse.click(target.x, target.y);
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.skill?.televisionReconstruction.active === true,
    null,
    { timeout: 45_000 },
  );

  const measureSwitch = async (fromTime: number, toTime: number): Promise<SwitchFrameSample> => {
    await page.evaluate((time) => { window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = time; }, fromTime);
    await page.waitForFunction(
      (time) => Math.abs(
        (window.__THREE_GAME_DIAGNOSTICS__?.skill?.televisionReconstruction.elapsed ?? -1) - time,
      ) < 0.035,
      fromTime,
      { timeout: 30_000 },
    );
    return page.evaluate((time) => new Promise<SwitchFrameSample>((resolve) => {
      let previous = performance.now();
      const frameIntervals: number[] = [];
      requestAnimationFrame(() => {
        window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = time;
        previous = performance.now();
        const collect = (now: number): void => {
          frameIntervals.push(now - previous);
          previous = now;
          if (frameIntervals.length >= 8) {
            resolve({
              firstFrameMs: frameIntervals[0],
              maxFrameMs: Math.max(...frameIntervals),
              frameIntervals,
            });
            return;
          }
          requestAnimationFrame(collect);
        };
        requestAnimationFrame(collect);
      });
    }), toTime);
  };

  const firstSwitch = await measureSwitch(0.62, 0.98);
  const laterSwitch = await measureSwitch(1.24, 3.06);
  console.log(JSON.stringify({ firstSwitch, laterSwitch }));

  expect(firstSwitch.maxFrameMs).toBeLessThan(laterSwitch.maxFrameMs * 1.6);
  expect(firstSwitch.maxFrameMs - laterSwitch.maxFrameMs).toBeLessThan(120);
  await page.evaluate(() => { window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = undefined; });
});

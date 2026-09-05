import { expect, test } from '@playwright/test';

test('泡泡机第一次显示模型内泡泡时不集中产生长帧', async ({ page }, testInfo) => {
  test.setTimeout(360_000);
  await page.addInitScript(() => {
    window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 1.25;
    window.__COLLECT_ALL_CLICK_TARGETS_FOR_EVIDENCE__ = false;
  });
  await page.goto('/?theme=day&mode=skill&direct=1&seed=20260828');
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true,
    null,
    { timeout: 240_000 },
  );
  expect(await page.evaluate(() => window.__FINISH_OPENING_FOR_EVIDENCE__?.() ?? false)).toBe(true);
  await page.waitForFunction(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return diagnostics?.opening.active === false
      && diagnostics.opening.transitioning === false
      && diagnostics.appliances.some(({ kind }) => kind === 'bubble-machine')
      && diagnostics.applianceReplacement.warmupPendingCount === 0
      && diagnostics.skill?.inputLocked === false;
  }, null, { timeout: 30_000 });

  const bubbleTarget = await page.evaluate(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    const bubble = diagnostics?.appliances.find(({ kind }) => kind === 'bubble-machine');
    return bubble
      ? diagnostics?.availableCableChoices.find(({ color }) => color === bubble.accent) ?? null
      : null;
  });
  expect(bubbleTarget).not.toBeNull();

  await page.evaluate(() => {
    const samples: Array<{
      ms: number;
      bubbleActive: boolean;
      warmupPendingCount: number;
      lastWarmupMs: number;
      lastFromKind: string | null;
      lastToKind: string | null;
    }> = [];
    let previous = performance.now();
    let active = true;
    Reflect.set(window, '__BUBBLE_FIRST_USE_FRAME_SAMPLES__', samples);
    Reflect.set(window, '__STOP_BUBBLE_FIRST_USE_FRAME_SAMPLES__', () => { active = false; });
    const measure = (now: number): void => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      samples.push({
        ms: now - previous,
        bubbleActive: diagnostics?.appliances.some(({ kind, state }) => (
          kind === 'bubble-machine' && state === 'active'
        )) === true,
        warmupPendingCount: diagnostics?.applianceReplacement.warmupPendingCount ?? -1,
        lastWarmupMs: diagnostics?.applianceReplacement.lastWarmupMs ?? -1,
        lastFromKind: diagnostics?.applianceReplacement.lastFromKind ?? null,
        lastToKind: diagnostics?.applianceReplacement.lastToKind ?? null,
      });
      previous = now;
      if (active) requestAnimationFrame(measure);
    };
    requestAnimationFrame(measure);
  });
  expect(await page.evaluate(({ id, end }) => (
    window.__PULL_CABLE_FOR_EVIDENCE__?.(id, end) ?? false
  ), bubbleTarget!)).toBe(true);
  await page.waitForFunction(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return diagnostics?.appliances.some(({ kind, state, animationSignal }) => (
      kind === 'bubble-machine' && state === 'active' && animationSignal > 0.05
    )) === true;
  }, null, { timeout: 45_000 });
  await page.waitForFunction(() => {
    const samples = Reflect.get(window, '__BUBBLE_FIRST_USE_FRAME_SAMPLES__') as Array<{
      bubbleActive: boolean;
    }> | undefined;
    return (samples?.filter(({ bubbleActive }) => bubbleActive).length ?? 0) >= 5;
  }, null, { timeout: 45_000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: testInfo.outputPath('bubble-machine-first-use.png'), fullPage: true });
  const frameStats = await page.evaluate(() => {
    const stop = Reflect.get(window, '__STOP_BUBBLE_FIRST_USE_FRAME_SAMPLES__') as (() => void) | undefined;
    stop?.();
    const samples = (Reflect.get(window, '__BUBBLE_FIRST_USE_FRAME_SAMPLES__') as Array<{
      ms: number;
      bubbleActive: boolean;
      warmupPendingCount: number;
      lastWarmupMs: number;
      lastFromKind: string | null;
      lastToKind: string | null;
    }> | undefined) ?? [];
    const values = samples.map(({ ms }) => ms);
    const ordered = [...values].sort((a, b) => a - b);
    const activeSamples = samples.filter(({ bubbleActive }) => bubbleActive).map(({ ms }) => ms);
    const inactiveSamples = samples.filter(({ bubbleActive }) => !bubbleActive).map(({ ms }) => ms);
    const recentInactive = inactiveSamples.slice(-5).sort((a, b) => a - b);
    const baselineMedianMs = recentInactive[Math.floor(recentInactive.length / 2)] ?? 0;
    return {
      count: samples.length,
      maximumMs: Math.max(0, ...values),
      p95Ms: ordered[Math.max(0, Math.ceil(ordered.length * 0.95) - 1)] ?? 0,
      over100Ms: values.filter((sample) => sample > 100).length,
      firstActiveMs: activeSamples[0] ?? 0,
      activeMaximumMs: Math.max(0, ...activeSamples),
      activeOver100Ms: activeSamples.filter((sample) => sample > 100).length,
      baselineMedianMs,
      activeToBaselineRatio: baselineMedianMs > 0
        ? Math.max(0, ...activeSamples) / baselineMedianMs
        : Number.POSITIVE_INFINITY,
      activeSamples: activeSamples.map((sample) => Number(sample.toFixed(1))),
      samples: samples.map(({ ms, bubbleActive, ...replacement }) => ({
        ms: Number(ms.toFixed(1)),
        bubbleActive,
        ...replacement,
      })),
    };
  });
  console.log(`BUBBLE_FIRST_USE ${JSON.stringify(frameStats)}`);
  expect(frameStats.count).toBeGreaterThan(10);
  expect(frameStats.baselineMedianMs).toBeGreaterThan(0);
  expect(frameStats.activeMaximumMs).toBeLessThan(100);
  expect(frameStats.activeOver100Ms).toBe(0);
  expect(frameStats.activeToBaselineRatio).toBeLessThan(5);
});

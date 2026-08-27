import { expect, test } from '@playwright/test';
import { enterPreparedGame } from './helpers/enterGame';

type FrameSample = {
  deltaMs: number;
  cycle: number;
  wrapped: boolean;
};

function percentile(values: number[], ratio: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * ratio))] ?? 0;
}

test('gallery appliance preview does not hitch when its performance cycle restarts', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/?seed=2679418801');
  await enterPreparedGame(page);
  await page.click('#appliance-gallery-button');
  await page.locator('[data-appliance-kind="desktop-computer"]')
    .evaluate((button: HTMLButtonElement) => button.click());
  await page.waitForFunction(() => {
    const diagnostics = window.__APPLIANCE_GALLERY_DIAGNOSTICS__;
    return diagnostics?.selected === 'desktop-computer' && diagnostics.cycle > 0.5;
  });

  const samples = await page.evaluate(() => new Promise<FrameSample[]>((resolve) => {
    const values: FrameSample[] = [];
    let previousNow = performance.now();
    let previousCycle = window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.cycle ?? 0;
    let wrapFrame = -1;

    const sample = (now: number) => {
      const cycle = window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.cycle ?? previousCycle;
      const wrapped = cycle < previousCycle;
      if (wrapped && wrapFrame < 0) wrapFrame = values.length;
      values.push({ deltaMs: now - previousNow, cycle, wrapped });
      previousNow = now;
      previousCycle = cycle;
      if (wrapFrame >= 0 && values.length >= wrapFrame + 8) {
        resolve(values);
        return;
      }
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  }));

  const wrapIndex = samples.findIndex((sample) => sample.wrapped);
  expect(wrapIndex).toBeGreaterThan(20);
  const steadyFrames = samples
    .filter((_, index) => index > 8 && Math.abs(index - wrapIndex) > 4)
    .map((sample) => sample.deltaMs);
  const transitionFrames = samples
    .slice(Math.max(0, wrapIndex - 2), wrapIndex + 5)
    .map((sample) => sample.deltaMs);
  const steadyP95Ms = percentile(steadyFrames, 0.95);
  const transitionMaxMs = Math.max(...transitionFrames);
  const allowedMaxMs = Math.max(34, steadyP95Ms * 1.75);

  console.log(JSON.stringify({
    frames: samples.length,
    steadyP95Ms,
    transitionMaxMs,
    allowedMaxMs,
    transitionFrames,
  }));
  expect(transitionMaxMs, 'animation-cycle replacement must not create a visible long frame')
    .toBeLessThanOrEqual(allowedMaxMs);
});

test('game appliance replacement does not create a visible long frame', async ({ page }) => {
  test.setTimeout(300_000);
  await page.addInitScript(() => {
    window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 0;
  });
  await page.goto('/?seed=1&mode=random&direct=1&theme=night');
  await enterPreparedGame(page);
  const baselineFrames = await page.evaluate(() => new Promise<number[]>((resolve) => {
    const values: number[] = [];
    let previousNow = performance.now();
    const sample = (now: number) => {
      values.push(now - previousNow);
      previousNow = now;
      if (values.length >= 6) {
        resolve(values);
        return;
      }
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  }));
  const activation = await page.evaluate(() => {
    const kind = window.__THREE_GAME_DIAGNOSTICS__?.appliances[0]?.kind;
    if (!kind) return null;
    const startedAt = performance.now();
    return window.__ACTIVATE_APPLIANCE_FOR_EVIDENCE__?.(kind) ? { kind, startedAt } : null;
  });
  expect(activation).not.toBeNull();
  if (!activation) throw new Error('Unable to activate an appliance for replacement evidence');
  const activatedKind = activation.kind;
  await page.evaluate(() => {
    window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = undefined;
  });
  await page.waitForFunction((kind) =>
    window.__THREE_GAME_DIAGNOSTICS__?.appliances
      .some((appliance) => appliance.kind === kind && appliance.state === 'active'), activatedKind);

  const result = await page.evaluate(({ kind, activationStartedAt }) => new Promise<{
    samples: FrameSample[];
    replacementIndex: number;
    elapsedSinceActivationMs: number;
    initialKinds: string[];
    finalKinds: string[];
  }>((resolve, reject) => {
    const samples: FrameSample[] = [];
    const initialKinds = window.__THREE_GAME_DIAGNOSTICS__?.appliances.map((item) => item.kind) ?? [];
    let previousNow = performance.now();
    let replacementIndex = -1;
    const timeoutAt = previousNow + 20_000;
    const sample = (now: number) => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      const finalKinds = diagnostics?.appliances.map((item) => item.kind) ?? [];
      const replaced = !finalKinds.includes(kind as typeof initialKinds[number]);
      if (replaced && replacementIndex < 0) {
        replacementIndex = samples.length;
      }
      samples.push({
        deltaMs: now - previousNow,
        cycle: diagnostics?.appliances.find((item) => item.kind === kind)?.activeTimeRemaining ?? 0,
        wrapped: replaced,
      });
      previousNow = now;
      if (replacementIndex >= 0 && samples.length >= replacementIndex + 8) {
        resolve({
          samples,
          replacementIndex,
          elapsedSinceActivationMs: now - activationStartedAt,
          initialKinds,
          finalKinds,
        });
        return;
      }
      if (now >= timeoutAt) {
        reject(new Error(`Timed out waiting for ${kind} replacement`));
        return;
      }
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  }), { kind: activatedKind, activationStartedAt: activation.startedAt });

  expect(result.elapsedSinceActivationMs).toBeGreaterThan(1_000);
  expect(result.finalKinds).not.toEqual(result.initialKinds);
  const steadyFrames = baselineFrames.slice(1);
  const replacementFrames = result.samples
    .slice(Math.max(0, result.replacementIndex - 3), result.replacementIndex + 5)
    .map((sample) => sample.deltaMs);
  const steadyP95Ms = percentile(steadyFrames, 0.95);
  const replacementMaxMs = Math.max(...replacementFrames);
  const allowedMaxMs = Math.max(34, steadyP95Ms * 1.75);
  console.log(JSON.stringify({
    activatedKind,
    frames: result.samples.length,
    steadyP95Ms,
    replacementMaxMs,
    allowedMaxMs,
    replacementFrames,
    elapsedSinceActivationMs: result.elapsedSinceActivationMs,
    initialKinds: result.initialKinds,
    finalKinds: result.finalKinds,
  }));
  expect(replacementMaxMs, 'replacing a completed appliance must not create a visible long frame')
    .toBeLessThanOrEqual(allowedMaxMs);

  const replacementKind = result.finalKinds.find((kind) => !result.initialKinds.includes(kind));
  expect(replacementKind).toBeTruthy();
  await page.waitForFunction(
    (kind) => {
      const item = window.__THREE_GAME_DIAGNOSTICS__?.appliances.find(
        (appliance) => appliance.kind === kind,
      );
      return item?.state === 'idle' && item.dropping === false;
    },
    replacementKind,
    { timeout: 90_000 },
  );
  const settled = await page.evaluate(() => ({
    applianceCount: window.__THREE_GAME_DIAGNOSTICS__?.appliances.length ?? 0,
    sensoryCount: window.__THREE_GAME_DIAGNOSTICS__?.sensory.length ?? 0,
    routing: window.__THREE_GAME_DIAGNOSTICS__?.routing ?? null,
    renderer: window.__THREE_GAME_DIAGNOSTICS__?.renderer ?? null,
  }));
  await page.waitForTimeout(500);
  const rendererAfterCleanup = await page.evaluate(
    () => window.__THREE_GAME_DIAGNOSTICS__?.renderer ?? null,
  );
  expect(settled.sensoryCount).toBe(settled.applianceCount);
  expect(settled.routing?.allRequiredCovered).toBe(true);
  expect(rendererAfterCleanup?.geometries).toBe(settled.renderer?.geometries);
  expect(rendererAfterCleanup?.textures).toBe(settled.renderer?.textures);
});

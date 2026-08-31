import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { enterPreparedGame } from './helpers/enterGame';

const ARTIFACT_DIR = path.resolve('artifacts/visual-performance-qa-20260831');

type FrameSummary = {
  label: string;
  frames: number;
  p50Ms: number;
  p95Ms: number;
  maxMs: number;
  over34Ms: number;
};

function percentile(values: number[], ratio: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * ratio))] ?? 0;
}

function summarize(label: string, values: number[]): FrameSummary {
  const samples = values.slice(1);
  return {
    label,
    frames: samples.length,
    p50Ms: percentile(samples, 0.5),
    p95Ms: percentile(samples, 0.95),
    maxMs: Math.max(0, ...samples),
    over34Ms: samples.filter((value) => value > 34).length,
  };
}

async function beginFrames(page: Page): Promise<void> {
  await page.evaluate(() => {
    const capture = { active: true, previous: performance.now(), values: [] as number[] };
    (window as unknown as { __VISUAL_QA_FRAMES__: typeof capture }).__VISUAL_QA_FRAMES__ = capture;
    const sample = (now: number) => {
      if (!capture.active) return;
      capture.values.push(now - capture.previous);
      capture.previous = now;
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
}

async function endFrames(page: Page, label: string): Promise<FrameSummary> {
  const values = await page.evaluate(() => {
    const capture = (window as unknown as {
      __VISUAL_QA_FRAMES__?: { active: boolean; values: number[] };
    }).__VISUAL_QA_FRAMES__;
    if (!capture) return [];
    capture.active = false;
    return capture.values;
  });
  return summarize(label, values);
}

async function screenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: path.join(ARTIFACT_DIR, name), fullPage: true });
}

test('production visuals and interaction frame pacing remain stable', async ({ page }) => {
  test.setTimeout(900_000);
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedRequests: string[] = [];
  const badResponses: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('requestfailed', (request) => {
    failedRequests.push(`${request.method()} ${request.url()} ${request.failure()?.errorText ?? ''}`);
  });
  page.on('response', (response) => {
    if (response.status() >= 400) badResponses.push(`${response.status()} ${response.url()}`);
  });
  await page.addInitScript(() => {
    window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 0;
  });

  await page.goto('/?seed=2679418801&mode=random&direct=1&theme=night');
  await enterPreparedGame(page);
  await page.waitForTimeout(800);

  const report: Record<string, unknown> = {
    capturedAt: new Date().toISOString(),
    buildMode: 'vite-preview-production',
    browser: await page.evaluate(() => navigator.userAgent),
    devicePixelRatio: await page.evaluate(() => window.devicePixelRatio),
    viewport: page.viewportSize(),
    randomUrl: page.url(),
    frames: [] as FrameSummary[],
    replacements: [] as unknown[],
  };

  report.randomInitial = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__ ?? null);
  await screenshot(page, '01-random-initial.png');

  await beginFrames(page);
  await page.waitForTimeout(2_000);
  (report.frames as FrameSummary[]).push(await endFrames(page, 'random-steady'));

  const canvas = page.locator('#game-canvas');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) throw new Error('Game canvas has no layout box');
  const centerX = box.x + box.width * 0.5;
  const centerY = box.y + box.height * 0.5;
  await beginFrames(page);
  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX + 240, centerY - 90, { steps: 24 });
  await page.mouse.up();
  await page.waitForTimeout(700);
  (report.frames as FrameSummary[]).push(await endFrames(page, 'camera-orbit'));
  report.afterOrbit = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.orbit ?? null);
  await screenshot(page, '02-after-orbit.png');

  for (let index = 1; index <= 3; index += 1) {
    const before = await page.evaluate(() => ({
      kinds: window.__THREE_GAME_DIAGNOSTICS__?.appliances.map((item) => item.kind) ?? [],
      replacement: window.__THREE_GAME_DIAGNOSTICS__?.applianceReplacement ?? null,
      renderer: window.__THREE_GAME_DIAGNOSTICS__?.renderer ?? null,
    }));
    await beginFrames(page);
    const activation = await page.evaluate((kinds) => {
      window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 2.6;
      for (const kind of kinds) {
        if (window.__ACTIVATE_APPLIANCE_FOR_EVIDENCE__?.(kind)) {
          return { activated: true, kind, index: kinds.indexOf(kind) };
        }
      }
      return { activated: false, kind: '', index: -1 };
    }, before.kinds);
    expect(activation.activated).toBe(true);
    const activeKind = activation.kind;
    await page.waitForFunction(
      (kind) => window.__THREE_GAME_DIAGNOSTICS__?.appliances
        .some((item) => item.kind === kind && item.state === 'active'),
      activeKind,
      { timeout: 30_000 },
    );
    await page.waitForTimeout(300);
    (report.frames as FrameSummary[]).push(await endFrames(page, `appliance-activation-${index}`));
    await screenshot(page, `03-${index}-appliance-animation.png`);
    await beginFrames(page);
    await page.evaluate(() => {
      window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = undefined;
    });
    await page.waitForFunction(
      (kind) => !window.__THREE_GAME_DIAGNOSTICS__?.appliances.some((item) => item.kind === kind),
      activeKind,
      { timeout: 40_000 },
    );
    await page.waitForFunction(
      (activeIndex) => window.__THREE_GAME_DIAGNOSTICS__?.appliances[activeIndex]?.state === 'idle'
        && window.__THREE_GAME_DIAGNOSTICS__?.appliances[activeIndex]?.dropping === false,
      activation.index,
      { timeout: 90_000 },
    );
    await page.waitForTimeout(350);
    (report.frames as FrameSummary[]).push(await endFrames(page, `appliance-replacement-${index}`));
    const after = await page.evaluate(() => ({
      kinds: window.__THREE_GAME_DIAGNOSTICS__?.appliances.map((item) => item.kind) ?? [],
      replacement: window.__THREE_GAME_DIAGNOSTICS__?.applianceReplacement ?? null,
      renderer: window.__THREE_GAME_DIAGNOSTICS__?.renderer ?? null,
    }));
    (report.replacements as unknown[]).push({ index, activeKind, activeIndex: activation.index, before, after });
    await screenshot(page, `04-${index}-replacement-settled.png`);
  }

  await page.goto('/?seed=20260812&mode=skill&direct=1&theme=night');
  await enterPreparedGame(page);
  await page.waitForTimeout(800);
  report.skillUrl = page.url();
  report.skillInitial = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__ ?? null);
  await screenshot(page, '05-skill-initial.png');

  await beginFrames(page);
  expect(await page.evaluate(() => window.__SHOW_SKILL_PRESENTATION_FOR_EVIDENCE__?.('radio') ?? false)).toBe(true);
  await page.waitForTimeout(600);
  (report.frames as FrameSummary[]).push(await endFrames(page, 'skill-radio'));
  await screenshot(page, '06-skill-radio.png');
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.skill?.presentation.skillId === null,
    null,
    { timeout: 20_000 },
  );
  await beginFrames(page);
  const riceShown = await page.evaluate(() => {
    const shown = window.__SHOW_SKILL_PRESENTATION_FOR_EVIDENCE__?.('rice-cooker') ?? false;
    const frozen = window.__FREEZE_SKILL_PRESENTATION_FOR_EVIDENCE__?.(1040) ?? false;
    return { shown, frozen };
  });
  expect(riceShown).toEqual({ shown: true, frozen: true });
  await page.waitForTimeout(350);
  (report.frames as FrameSummary[]).push(await endFrames(page, 'skill-rice-cooker'));
  await screenshot(page, '07-skill-rice-cooker.png');
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.skill?.presentation.skillId === null,
    null,
    { timeout: 20_000 },
  );
  await beginFrames(page);
  expect(await page.evaluate(() => window.__SHOW_SKILL_PRESENTATION_FOR_EVIDENCE__?.('robot-vacuum') ?? false)).toBe(true);
  await page.waitForTimeout(650);
  (report.frames as FrameSummary[]).push(await endFrames(page, 'skill-robot-vacuum'));
  await screenshot(page, '08-skill-robot-vacuum.png');
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.skill?.presentation.skillId === null,
    null,
    { timeout: 60_000 },
  );
  await page.waitForTimeout(500);
  report.skillFinal = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__ ?? null);

  report.consoleErrors = consoleErrors;
  report.pageErrors = pageErrors;
  report.failedRequests = failedRequests;
  report.badResponses = badResponses;
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'report.json'), JSON.stringify(report, null, 2));

  expect(pageErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
});

test('three production replacements without screenshot readback avoid long frames', async ({ page }) => {
  test.setTimeout(480_000);
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  await page.addInitScript(() => {
    window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 0;
  });
  const qaTheme = process.env.VISUAL_QA_THEME ?? 'night';
  await page.goto(`/?seed=2679418801&mode=random&direct=1&theme=${qaTheme}`);
  await enterPreparedGame(page);
  await page.waitForTimeout(1_000);

  const runs: Array<Record<string, unknown>> = [];
  for (let index = 1; index <= 3; index += 1) {
    const before = await page.evaluate(() => ({
      kinds: window.__THREE_GAME_DIAGNOSTICS__?.appliances.map((item) => item.kind) ?? [],
      replacement: window.__THREE_GAME_DIAGNOSTICS__?.applianceReplacement ?? null,
      renderer: window.__THREE_GAME_DIAGNOSTICS__?.renderer ?? null,
    }));
    await beginFrames(page);
    const activation = await page.evaluate((kinds) => {
      window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 2.6;
      for (const kind of kinds) {
        if (window.__ACTIVATE_APPLIANCE_FOR_EVIDENCE__?.(kind)) {
          return { activated: true, kind, index: kinds.indexOf(kind) };
        }
      }
      return { activated: false, kind: '', index: -1 };
    }, before.kinds);
    expect(activation.activated).toBe(true);
    await page.waitForFunction(
      (kind) => window.__THREE_GAME_DIAGNOSTICS__?.appliances
        .some((item) => item.kind === kind && item.state === 'active'),
      activation.kind,
      { timeout: 30_000 },
    );
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = undefined;
    });
    await page.waitForFunction(
      (kind) => !window.__THREE_GAME_DIAGNOSTICS__?.appliances.some((item) => item.kind === kind),
      activation.kind,
      { timeout: 40_000 },
    );
    await page.waitForFunction(
      (activeIndex) => window.__THREE_GAME_DIAGNOSTICS__?.appliances[activeIndex]?.state === 'idle'
        && window.__THREE_GAME_DIAGNOSTICS__?.appliances[activeIndex]?.dropping === false,
      activation.index,
      { timeout: 90_000 },
    );
    await page.waitForTimeout(350);
    const frames = await endFrames(page, `no-screenshot-replacement-${index}`);
    const after = await page.evaluate(() => ({
      kinds: window.__THREE_GAME_DIAGNOSTICS__?.appliances.map((item) => item.kind) ?? [],
      replacement: window.__THREE_GAME_DIAGNOSTICS__?.applianceReplacement ?? null,
      renderer: window.__THREE_GAME_DIAGNOSTICS__?.renderer ?? null,
    }));
    runs.push({ index, activation, frames, before, after });
  }

  fs.writeFileSync(
    path.join(ARTIFACT_DIR, 'replacement-no-screenshot.json'),
    JSON.stringify({
      capturedAt: new Date().toISOString(),
      theme: qaTheme,
      runs,
    }, null, 2),
  );
  expect(runs.every((run) => (run.after as { replacement: { preparedMissCount: number } })
    .replacement.preparedMissCount === 0)).toBe(true);
});

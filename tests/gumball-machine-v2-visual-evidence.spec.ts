import { expect, test } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const OUTPUT_DIR = path.resolve('artifacts/appliance-v2/gumball-machine/evidence/models/gumball-machine');
const VIEWS = ['front', 'side', 'back', 'three-quarter'] as const;
const PHASES = [{ id: 'startup', time: 0.6 }, { id: 'climax', time: 2.8 }, { id: 'wind-down', time: 4.75 }] as const;
type ReviewWindow = Window & typeof globalThis & { __MODEL_REVIEW_DIAGNOSTICS__?: { ready?: boolean; triangles?: number; drawCalls?: number; performance: { timelineOwners: number } }; __MODEL_REVIEW_SET_POWER__?: (powered: boolean) => void; __MODEL_REVIEW_SET_ELAPSED__?: (elapsed: number | null) => void };

test('captures gumball machine v2 static views and frozen prize phases', async ({ page }) => {
  test.setTimeout(180_000); await mkdir(OUTPUT_DIR, { recursive: true }); const errors: string[] = []; const captures: Array<Record<string, unknown>> = [];
  page.on('pageerror', (error) => errors.push(error.message)); page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  for (const view of VIEWS) {
    await page.goto(`/model-review.html?model=gumball-machine&view=${view}&spin=0&power=0`); await page.waitForFunction(() => (window as ReviewWindow).__MODEL_REVIEW_DIAGNOSTICS__?.ready === true);
    await page.evaluate(() => (window as ReviewWindow).__MODEL_REVIEW_SET_POWER__?.(false)); await page.waitForTimeout(150);
    const screenshotPath = path.join(OUTPUT_DIR, `idle-${view}.png`); await page.locator('#model-review-canvas').screenshot({ path: screenshotPath });
    const diagnostics = await page.evaluate(() => (window as ReviewWindow).__MODEL_REVIEW_DIAGNOSTICS__); expect(diagnostics?.triangles ?? 0).toBeGreaterThan(10_000); expect(diagnostics?.drawCalls ?? 0).toBeGreaterThan(60); captures.push({ state: 'idle', view, screenshotPath, diagnostics });
  }
  await page.goto('/model-review.html?model=gumball-machine&view=three-quarter&spin=0&power=0'); await page.waitForFunction(() => (window as ReviewWindow).__MODEL_REVIEW_DIAGNOSTICS__?.ready === true);
  for (const phase of PHASES) { await page.evaluate((elapsed) => (window as ReviewWindow).__MODEL_REVIEW_SET_ELAPSED__?.(elapsed), phase.time); await page.waitForTimeout(120); const screenshotPath = path.join(OUTPUT_DIR, `active-${phase.id}-${phase.time}.png`); await page.locator('#model-review-canvas').screenshot({ path: screenshotPath }); const diagnostics = await page.evaluate(() => (window as ReviewWindow).__MODEL_REVIEW_DIAGNOSTICS__); expect(diagnostics?.performance.timelineOwners).toBe(1); captures.push({ state: phase.id, view: 'three-quarter', time: phase.time, screenshotPath, diagnostics }); }
  await writeFile(path.join(OUTPUT_DIR, 'capture-report.json'), `${JSON.stringify({ model: 'gumball-machine', captures, errors }, null, 2)}\n`); expect(errors).toEqual([]);
});

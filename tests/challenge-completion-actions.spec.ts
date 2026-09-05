import { expect, test, type Page } from '@playwright/test';
import { resolveCompletionContinuation } from '../src/game/ChallengeCompletion';

async function finishOpening(page: Page): Promise<void> {
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true,
    null,
    { timeout: 90_000 },
  );
  expect(await page.evaluate(() => window.__FINISH_OPENING_FOR_EVIDENCE__?.() ?? false)).toBe(true);
  await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.opening.active === false);
}

async function revealCompletePanel(page: Page): Promise<void> {
  await page.evaluate(() => {
    const panel = document.querySelector<HTMLElement>('#complete-panel');
    panel?.classList.add('visible');
    panel?.setAttribute('aria-hidden', 'false');
  });
  await expect(page.locator('#complete-panel')).toBeVisible();
}

test('挑战完成后继续按钮保持在当前挑战类型而不是进入战役第一关', () => {
  expect(resolveCompletionContinuation({ mode: 'skill' })).toEqual({
    action: 'new-skill',
    labelKey: 'complete.retry',
  });
  expect(resolveCompletionContinuation({ mode: 'random', challengeKind: 'standard' })).toEqual({
    action: 'new-random',
    labelKey: 'complete.retry',
  });
  expect(resolveCompletionContinuation({ mode: 'random', challengeKind: 'double-ended' })).toEqual({
    action: 'new-double-ended',
    labelKey: 'complete.retry',
  });
  expect(resolveCompletionContinuation({ mode: 'random', exploration: true })).toEqual({
    action: 'new-exploration',
    labelKey: 'complete.retry',
  });
  expect(resolveCompletionContinuation({ mode: 'rush' })).toEqual({
    action: 'new-rush',
    labelKey: 'complete.retry',
  });
});

test('战役完成后仍继续下一关，最终关结束后进入随机挑战', () => {
  expect(resolveCompletionContinuation({ mode: 'campaign', levelId: 1, campaignLevelCount: 5 })).toEqual({
    action: 'next-campaign-level',
    labelKey: 'continue.next',
  });
  expect(resolveCompletionContinuation({ mode: 'campaign', levelId: 5, campaignLevelCount: 5 })).toEqual({
    action: 'new-random',
    labelKey: 'continue.random',
  });
});

test('完成页提供返回主界面与继续当前挑战两个独立操作', async ({ page }) => {
  await page.goto('/?level=1');
  await page.waitForFunction(() => Boolean(window.__THREE_GAME_DIAGNOSTICS__));
  await expect(page.locator('#continue-button')).toHaveCount(1);
  await expect(page.locator('#complete-home-button')).toHaveCount(1);
});

test('技能挑战完成页点击重新挑战后仍加载技能挑战', async ({ page }) => {
  test.setTimeout(180_000);
  await page.addInitScript(() => { window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 0; });
  await page.goto('/?theme=day&mode=skill&direct=1&seed=20260829');
  await finishOpening(page);
  const revision = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.puzzleRevision ?? 0);
  await revealCompletePanel(page);
  await page.click('#continue-button');
  await page.waitForFunction((previousRevision) => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return diagnostics?.mode === 'skill'
      && diagnostics.challengeKind === 'standard'
      && diagnostics.exploration.active === false
      && diagnostics.puzzleRevision > previousRevision;
  }, revision, { timeout: 90_000 });
  await expect(page.locator('#continue-button')).toHaveText('重新挑战');
});

test('挑战完成页点击返回主界面后恢复模式选择首页', async ({ page }) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => { window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 0; });
  await page.goto('/?level=1');
  await finishOpening(page);
  await revealCompletePanel(page);
  await page.click('#complete-home-button');
  await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.opening.active === true);
  await expect(page.locator('#start-screen')).toBeVisible();
  await expect(page.locator('#challenge-mode-button')).toBeEnabled();
});

test('技能挑战返回主界面后再次进入技能挑战不会短暂提交第一关场景', async ({ page }) => {
  test.setTimeout(240_000);
  await page.addInitScript(() => { window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 0; });
  await page.goto('/?theme=day&mode=skill&direct=1&seed=20260829');
  await finishOpening(page);
  await page.click('#home-button');
  await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.opening.active === true);

  await page.evaluate(() => {
    const samples: Array<{ mode: string; levelId: number | null; arrowsVisible: boolean; revision: number }> = [];
    (window as typeof window & { __REENTRY_SCENE_SAMPLES__?: typeof samples }).__REENTRY_SCENE_SAMPLES__ = samples;
    const sample = () => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      if (diagnostics && !diagnostics.opening.active) {
        samples.push({
          mode: diagnostics.mode,
          levelId: diagnostics.levelId,
          arrowsVisible: diagnostics.sceneVisibility.arrows,
          revision: diagnostics.puzzleRevision,
        });
      }
      if (samples.length < 600) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });

  await page.click('#challenge-mode-button');
  await page.click('#start-skill-button');
  await page.waitForFunction(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return diagnostics?.opening.active === false
      && diagnostics.mode === 'skill'
      && diagnostics.levelId === 0
      && diagnostics.sceneVisibility.arrows
      && diagnostics.skill?.inputLocked === false;
  }, null, { timeout: 120_000 });

  const samples = await page.evaluate(() => (
    window as typeof window & {
      __REENTRY_SCENE_SAMPLES__?: Array<{ mode: string; levelId: number | null; arrowsVisible: boolean; revision: number }>;
    }
  ).__REENTRY_SCENE_SAMPLES__ ?? []);
  expect(samples.length).toBeGreaterThan(0);
  expect(samples.filter((sample) => sample.arrowsVisible && (sample.mode !== 'skill' || sample.levelId === 1))).toEqual([]);
});

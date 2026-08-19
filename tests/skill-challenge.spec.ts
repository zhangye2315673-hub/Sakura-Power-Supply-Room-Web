import { expect, test, type Page } from '@playwright/test';
import { PNG } from 'pngjs';

async function waitForOpening(page: Page): Promise<void> {
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true,
    null,
    { timeout: 90_000 },
  );
}

async function openChallengeMenu(page: Page): Promise<void> {
  await page.click('#challenge-mode-button');
  await expect(page.locator('#challenge-mode-menu')).toBeVisible();
}

async function expectMenuFitsViewport(page: Page): Promise<void> {
  const result = await page.locator('#challenge-mode-menu').evaluate((menu) => {
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    const rect = menu.getBoundingClientRect();
    const items = [...menu.querySelectorAll('button')].map((button) => ({
      text: button.textContent?.trim() ?? '',
      fitsText: button.scrollWidth <= button.clientWidth + 1,
      rect: button.getBoundingClientRect().toJSON(),
    }));
    return {
      labels: items.map((item) => item.text),
      allTextFits: items.every((item) => item.fitsText),
      menuFits: rect.left >= 0 && rect.top >= 0 && rect.right <= viewportWidth && rect.bottom <= viewportHeight,
      noHorizontalOverflow: document.documentElement.scrollWidth <= viewportWidth + 1,
    };
  });
  expect(result.labels).toEqual(['随机挑战', '探索模式', 'RUSH挑战', '双头挑战', '技能挑战', '洗衣机技能测试']);
  expect(result.allTextFits).toBe(true);
  expect(result.menuFits).toBe(true);
  expect(result.noHorizontalOverflow).toBe(true);
}

test('挑战模式菜单在桌面端与移动端均可完整展开和关闭', async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await waitForOpening(page);
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await expect(page.locator('#start-game-button')).toBeVisible();
    await expect(page.locator('#challenge-mode-button')).toBeVisible();
    await openChallengeMenu(page);
    await expectMenuFitsViewport(page);
    await page.screenshot({
      path: testInfo.outputPath(`challenge-menu-${viewport.width}x${viewport.height}.png`),
      fullPage: true,
    });

    await page.click('#challenge-mode-button');
    await expect(page.locator('#challenge-mode-menu')).toBeHidden();
    await openChallengeMenu(page);
    await page.locator('#start-screen-title').click({ position: { x: 4, y: 4 } });
    await expect(page.locator('#challenge-mode-menu')).toBeHidden();
  }
});

test('五种挑战入口连接到各自现有或新增模式', async ({ page }) => {
  test.setTimeout(300_000);
  const cases = [
    { selector: '#start-random-button', mode: 'random', challengeKind: 'standard', testId: null },
    { selector: '#start-rush-button', mode: 'rush', challengeKind: null, testId: null },
    { selector: '#start-double-ended-button', mode: 'random', challengeKind: 'double-ended', testId: null },
    { selector: '#start-skill-button', mode: 'skill', challengeKind: 'standard', testId: null },
    { selector: '#start-skill-test-button', mode: 'skill', challengeKind: 'standard', testId: 'washer' },
  ] as const;

  for (const entry of cases) {
    await page.goto('/');
    await waitForOpening(page);
    const previousRevision = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.puzzleRevision ?? 0);
    await openChallengeMenu(page);
    await page.click(entry.selector);
    await page.waitForFunction(
      ({ mode, challengeKind, testId, previousRevision }) => {
        const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
        return diagnostics?.opening.active === false
          && diagnostics.puzzleRevision > previousRevision
          && diagnostics.mode === mode
          && (challengeKind === null || diagnostics.challengeKind === challengeKind)
          && (testId === null || diagnostics.skill?.testId === testId)
          && diagnostics.totalArrows > 0;
      },
      { ...entry, previousRevision },
      { timeout: 90_000 },
    );
    if (entry.mode === 'rush') {
      await expect(page.locator('#rush-briefing-panel')).toBeVisible({ timeout: 60_000 });
    }
    if (entry.challengeKind === 'double-ended') {
      await expect(page.locator('#double-ended-briefing-panel')).toBeVisible({ timeout: 60_000 });
    }
  }
});

test('技能挑战完成一次正确抽线事务并恢复输入', async ({ page }, testInfo) => {
  test.setTimeout(300_000);
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto('/?seed=20260812&mode=skill&direct=1');
  await waitForOpening(page);
  await page.click('#start-game-button');
  await page.waitForFunction(
    () => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      return diagnostics?.opening.active === false
        && diagnostics.mode === 'skill'
        && [42, 46, 50, 54].includes(diagnostics.remainingArrows)
        && diagnostics.clickTarget !== null;
    },
    null,
    { timeout: 90_000 },
  );
  const before = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.remainingArrows);
  expect([42, 46, 50, 54]).toContain(before);
  expect(await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.initiallyFree)).toBeGreaterThanOrEqual(4);
  expect(await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.initiallyFree)).toBeLessThanOrEqual(8);
  const target = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.clickTarget!);
  await page.mouse.click(target.x, target.y);
  await page.waitForFunction(
    (remaining) => (window.__THREE_GAME_DIAGNOSTICS__?.remainingArrows ?? remaining) < remaining,
    before,
    { timeout: 30_000 },
  );
  await expect(page.locator('.brand-block strong')).toBeVisible();
  await expect(page.locator('.brand-kicker')).toBeHidden();
  await expect(page.locator('.brand-block small')).toBeHidden();
  await expect(page.locator('#status-line')).toBeHidden();
  await expect(page.locator('#skill-cue-source')).not.toHaveText('');
  await expect(page.locator('#skill-cue-source')).not.toContainText('连接完成');
  await expect(page.locator('#skill-cue-title')).not.toHaveText('技能触发');
  await expect(page.locator('#skill-cue-detail')).not.toHaveText('');
  const triggeredFeedback = await page.locator('#skill-cue').evaluate((cue) => ({
    title: cue.querySelector('#skill-cue-title')?.textContent,
    detail: cue.querySelector('#skill-cue-detail')?.textContent,
  }));
  const feedbackLayout = await page.evaluate(() => {
    const cue = document.querySelector<HTMLElement>('#skill-cue')!.getBoundingClientRect();
    const brandTitle = document.querySelector<HTMLElement>('.brand-block strong')!.getBoundingClientRect();
    const rack = document.querySelector<HTMLElement>('#skill-status-rack')!.getBoundingClientRect();
    return {
      cueFits: cue.left >= 0 && cue.top >= 0 && cue.right <= innerWidth && cue.bottom <= innerHeight,
      belowBrandTitle: cue.top >= brandTitle.bottom,
      avoidsStatusRack: cue.right <= rack.left || cue.left >= rack.right || cue.bottom <= rack.top || cue.top >= rack.bottom,
      noHorizontalOverflow: document.documentElement.scrollWidth <= innerWidth + 1,
    };
  });
  expect(feedbackLayout).toEqual({
    cueFits: true,
    belowBrandTitle: true,
    avoidsStatusRack: true,
    noHorizontalOverflow: true,
  });

  await page.waitForFunction(
    () => {
      const phase = window.__THREE_GAME_DIAGNOSTICS__?.skill?.phase;
      return phase === 'idle' || phase === 'select-card' || phase === 'select-recycle-target' || phase === 'complete';
    },
    null,
    { timeout: 30_000 },
  );
  let phase = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.skill?.phase);
  if (phase === 'select-card') {
    await page.locator('.skill-card').first().click();
    await page.waitForTimeout(800);
    phase = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.skill?.phase);
  }
  if (phase === 'select-recycle-target') {
    const recycleTarget = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.clickTarget!);
    await page.mouse.click(recycleTarget.x, recycleTarget.y);
  }
  await page.waitForFunction(
    () => ['idle', 'complete'].includes(window.__THREE_GAME_DIAGNOSTICS__?.skill?.phase ?? ''),
    null,
    { timeout: 30_000 },
  );
  await expect(page.locator('#skill-cue-title')).toHaveText(triggeredFeedback.title ?? '');
  await expect(page.locator('#skill-cue-detail')).toHaveText(triggeredFeedback.detail ?? '');
  await expect(page.locator('#skill-cue-phase')).toHaveText(/结算完成|挑战完成/);
  expect(pageErrors).toEqual([]);
  await expect(page.locator('#skill-challenge-ui')).toHaveClass(/visible/);
  await expect(page.locator('#skill-status-rack')).toHaveClass(/visible/);
  const statusState = await page.evaluate(() => ({
    buff: window.__THREE_GAME_DIAGNOSTICS__?.skill?.buff ?? null,
    debuff: window.__THREE_GAME_DIAGNOSTICS__?.skill?.debuff ?? null,
    visibleSlots: document.querySelectorAll('.skill-status-slot.occupied').length,
  }));
  expect(statusState.visibleSlots).toBe(Number(statusState.buff !== null) + Number(statusState.debuff !== null));
  expect(await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.skill?.registrySize)).toBe(29);
  const canvasImage = PNG.sync.read(await page.locator('#game-canvas').screenshot());
  const luminance: number[] = [];
  for (let y = 0; y < canvasImage.height; y += 12) {
    for (let x = 0; x < canvasImage.width; x += 12) {
      const index = (y * canvasImage.width + x) * 4;
      luminance.push(
        canvasImage.data[index] * 0.2126
        + canvasImage.data[index + 1] * 0.7152
        + canvasImage.data[index + 2] * 0.0722,
      );
    }
  }
  const average = luminance.reduce((sum, value) => sum + value, 0) / luminance.length;
  const variance = luminance.reduce((sum, value) => sum + (value - average) ** 2, 0) / luminance.length;
  expect(variance).toBeGreaterThan(120);
  await page.screenshot({ path: testInfo.outputPath('skill-challenge-core.png'), fullPage: true });
});

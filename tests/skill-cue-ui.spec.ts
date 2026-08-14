import { expect, test } from '@playwright/test';

type SkillCueTestUi = {
  setVisible: (visible: boolean) => void;
  showCue: (label: string, phase: 'cue' | 'commit' | 'settle', detail: string, source: string) => void;
};

declare global {
  interface Window {
    __SKILL_CUE_TEST_UI__?: SkillCueTestUi;
  }
}

const mountSkillCue = async (page: import('@playwright/test').Page): Promise<void> => {
  await page.route('**/src/main.ts', async (route) => {
    await route.fulfill({
      contentType: 'application/javascript',
      body: "import '/src/styles.css'; document.documentElement.classList.add('app-ready');",
    });
  });
  await page.goto('/');
  await page.evaluate(async () => {
    document.documentElement.classList.remove('opening-active');
    const startScreen = document.querySelector<HTMLElement>('#start-screen');
    if (startScreen) startScreen.style.display = 'none';
    const loadSkillUi = Function('return import("/src/skill/SkillChallengeUi.ts")') as () => Promise<{
      SkillChallengeUi: new (options: { onCardSelected: (index: number) => void }) => SkillCueTestUi;
    }>;
    const { SkillChallengeUi } = await loadSkillUi();
    const ui = new SkillChallengeUi({ onCardSelected: () => undefined });
    window.__SKILL_CUE_TEST_UI__ = ui;
    ui.setVisible(true);
    ui.showCue('干燥护罩', 'settle', '抵挡下一次新增的负面状态。', '除湿机');
  });
};

test('技能提示位于标题下方并遵守悬停停留规则', async ({ page }, testInfo) => {
  await mountSkillCue(page);

  const cue = page.locator('#skill-cue');
  await expect(page.locator('.brand-block strong')).toBeVisible();
  await expect(page.locator('.brand-kicker')).toBeHidden();
  await expect(page.locator('.brand-block small')).toBeHidden();
  await expect(page.locator('#status-line')).toBeHidden();
  await expect(cue).toHaveClass(/visible/);
  await expect(page.locator('#skill-cue-source')).toHaveText('除湿机');
  await expect(page.locator('#skill-cue-title')).toHaveText('干燥护罩');
  await expect(page.locator('#skill-cue-detail')).toHaveText('抵挡下一次新增的负面状态。');

  const layout = await page.evaluate(() => {
    const cue = document.querySelector<HTMLElement>('#skill-cue')!;
    const cueRect = cue.getBoundingClientRect();
    const titleRect = document.querySelector<HTMLElement>('.brand-block strong')!.getBoundingClientRect();
    const hit = document.elementFromPoint(cueRect.left + cueRect.width / 2, cueRect.top + cueRect.height / 2);
    return {
      belowTitle: cueRect.top >= titleRect.bottom,
      fitsViewport: cueRect.left >= 0 && cueRect.right <= innerWidth && cueRect.bottom <= innerHeight,
      receivesPointer: hit?.closest('#skill-cue')?.id === 'skill-cue',
    };
  });
  expect(layout).toEqual({ belowTitle: true, fitsViewport: true, receivesPointer: true });

  await cue.hover();
  await page.waitForTimeout(5_200);
  await expect(cue).toHaveClass(/visible/);
  await page.screenshot({ path: testInfo.outputPath('skill-cue-desktop.png'), fullPage: true });

  await page.mouse.move(page.viewportSize()!.width - 8, page.viewportSize()!.height - 8);
  await page.waitForTimeout(800);
  await expect(cue).toHaveClass(/visible/);
  await expect(cue).not.toHaveClass(/visible/, { timeout: 1_000 });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    window.__SKILL_CUE_TEST_UI__?.showCue('蒸汽遮挡', 'cue', '正确抽线后，遮挡会逐回合消退。', '加湿器');
  });
  await expect(cue).toHaveClass(/visible/);
  const mobileFits = await cue.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return rect.left >= 0 && rect.right <= innerWidth && rect.bottom <= innerHeight;
  });
  expect(mobileFits).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('skill-cue-mobile.png'), fullPage: true });
  await page.waitForTimeout(5_200);
  await expect(cue).not.toHaveClass(/visible/);
});

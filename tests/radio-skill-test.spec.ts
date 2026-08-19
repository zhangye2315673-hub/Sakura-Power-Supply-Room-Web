import { expect, test } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ARTIFACT_DIR = path.resolve('artifacts/radio-skill-test');

test('radio skill test keeps three radio guides above their plugs until each cable is removed', async ({ page }) => {
  test.setTimeout(240_000);
  await mkdir(ARTIFACT_DIR, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/?theme=day&mode=skill-test&skill=radio&direct=1');
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
        && diagnostics.skill?.testId === 'radio'
        && diagnostics.totalArrows === 4
        && diagnostics.clickTarget !== null;
    },
    null,
    { timeout: 90_000 },
  );

  const initial = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  expect(initial.appliances.map(({ kind }) => kind)).toEqual(['radio']);
  expect(initial.skill?.effectAssets).toEqual([]);
  await expect(page.locator('#skill-cue-source')).toHaveText('收音机');
  await expect(page.locator('#skill-cue-title')).toHaveText('三步路线广播');
  await expect(page.locator('#skill-cue-detail')).toHaveText('持续标记接下来三根可抽线路，当前目标会脉冲提示。');
  await writeFile(
    path.join(ARTIFACT_DIR, 'radio-skill-test-before.png'),
    await page.screenshot({ fullPage: true }),
  );

  const target = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.clickTarget!);
  await page.mouse.click(target.x, target.y);
  await page.waitForFunction(
    () => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      return diagnostics?.remainingArrows === 3
        && diagnostics.skill?.presentation.radioGuideVisibleCount === 3;
    },
    null,
    { timeout: 45_000 },
  );
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));

  const active = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  expect(active.skill?.presentation).toMatchObject({
    labelCount: 0,
    lineCount: 0,
    radioGuideVisibleCount: 3,
  });
  expect(active.skill?.effectAssets).toEqual([]);
  expect(active.skill?.presentation.radioGuideCurrentId).toBe(active.skill?.presentation.radioGuideTargetIds[0]);
  await expect(page.locator('.skill-world-number')).toHaveCount(0);
  await writeFile(
    path.join(ARTIFACT_DIR, 'radio-skill-test-triggered.png'),
    await page.screenshot({ fullPage: true }),
  );
  await page.locator('#theme-button').click();
  await page.waitForFunction(
    () => (window.__THREE_GAME_DIAGNOSTICS__?.theme.progress ?? 0) > 0.98,
    null,
    { timeout: 15_000 },
  );
  await writeFile(
    path.join(ARTIFACT_DIR, 'radio-skill-test-night.png'),
    await page.screenshot({ fullPage: true }),
  );
  await writeFile(
    path.join(ARTIFACT_DIR, 'runtime-diagnostics.json'),
    `${JSON.stringify(active.skill, null, 2)}\n`,
    'utf8',
  );

  await page.waitForTimeout(4_000);
  const persistent = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.skill!.presentation);
  expect(persistent.radioGuideVisibleCount).toBe(3);
  expect(persistent.lineCount).toBe(0);
  expect(persistent.labelCount).toBe(0);
  const previousCurrentId = persistent.radioGuideCurrentId;
  await page.waitForFunction(
    (currentId) => window.__THREE_GAME_DIAGNOSTICS__?.clickTarget?.id === currentId,
    previousCurrentId,
    { timeout: 60_000 },
  );
  const currentTarget = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.clickTarget);
  expect(currentTarget).not.toBeNull();
  await page.mouse.click(currentTarget!.x, currentTarget!.y);
  await page.waitForFunction(
    ({ previousCurrentId }) => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      return diagnostics?.remainingArrows === 2
        && diagnostics.skill?.presentation.radioGuideVisibleCount === 2
        && diagnostics.skill.presentation.radioGuideCurrentId !== previousCurrentId;
    },
    { previousCurrentId },
    { timeout: 45_000 },
  );
  const advanced = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.skill!.presentation);
  expect(advanced.radioGuideTargetIds).not.toContain(previousCurrentId);
  await writeFile(
    path.join(ARTIFACT_DIR, 'radio-skill-test-advanced.png'),
    await page.screenshot({ fullPage: true }),
  );

  await page.mouse.move(940, 470);
  await page.mouse.down();
  await page.mouse.move(1120, 520, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(1_000);
  const rotated = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  expect(rotated.skill?.presentation.radioGuideVisibleCount).toBe(2);
  expect(rotated.skill?.presentation.radioGuideCurrentId).toBe(advanced.radioGuideCurrentId);
  await writeFile(
    path.join(ARTIFACT_DIR, 'radio-skill-test-rotated.png'),
    await page.screenshot({ fullPage: true }),
  );
});

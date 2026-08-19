import { expect, test } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ARTIFACT_DIR = path.resolve('artifacts/humidifier-skill-test');

test('humidifier gradually forms bathroom steam without spawning a temporary skill model', async ({ page }) => {
  test.setTimeout(300_000);
  await mkdir(ARTIFACT_DIR, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/?theme=day&mode=skill-test&skill=humidifier&direct=1');
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
        && diagnostics.skill?.testId === 'humidifier'
        && diagnostics.totalArrows === 4
        && diagnostics.clickTarget !== null;
    },
    null,
    { timeout: 90_000 },
  );

  const initial = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  expect(initial.skill?.debuff).toBeNull();
  expect(initial.skill?.effectAssets).toEqual([]);
  expect(initial.skill?.steamReveal.active).toBe(false);
  expect(initial.appliances.map(({ kind }) => kind)).toEqual(['humidifier']);
  await expect(page.locator('#skill-cue-source')).toHaveText('加湿器');
  await expect(page.locator('#skill-cue-title')).toHaveText('浴室蒸汽');
  await expect(page.locator('#skill-cue-detail')).toHaveText('三次正确抽线后擦除的蒸汽遮罩。');
  await writeFile(
    path.join(ARTIFACT_DIR, 'humidifier-steam-clear.png'),
    await page.locator('#game-canvas').screenshot(),
  );

  await page.evaluate(() => { window.__STEAM_REVEAL_PROGRESS_OVERRIDE__ = 0.08; });
  const target = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.clickTarget!);
  await page.mouse.click(target.x, target.y);
  await page.waitForFunction(
    () => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      return diagnostics?.remainingArrows === 3
        && diagnostics.skill?.debuff === 'bathroom-steam'
        && diagnostics.skill.steamReveal.active
        && Math.abs(diagnostics.skill.steamReveal.progress - 0.08) < 0.02;
    },
    null,
    { timeout: 45_000 },
  );
  const revealStart = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.skill!.steamReveal);
  expect(revealStart.direction).toBe(revealStart.origin < 0.5 ? 'left-to-right' : 'right-to-left');
  expect(await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.skill!.effectAssets)).toEqual([]);
  await writeFile(
    path.join(ARTIFACT_DIR, 'humidifier-steam-forming-start.png'),
    await page.locator('#game-canvas').screenshot(),
  );

  await page.evaluate(() => { window.__STEAM_REVEAL_PROGRESS_OVERRIDE__ = 0.52; });
  await page.waitForFunction(
    () => Math.abs((window.__THREE_GAME_DIAGNOSTICS__?.skill?.steamReveal.progress ?? 0) - 0.52) < 0.02,
    null,
    { timeout: 30_000 },
  );
  await writeFile(
    path.join(ARTIFACT_DIR, 'humidifier-steam-forming-mid.png'),
    await page.locator('#game-canvas').screenshot(),
  );

  await page.evaluate(() => { window.__STEAM_REVEAL_PROGRESS_OVERRIDE__ = 1; });
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.skill?.steamReveal.active === false
      && window.__THREE_GAME_DIAGNOSTICS__?.skill?.steamReveal.progress === 1,
    null,
    { timeout: 30_000 },
  );
  await page.evaluate(() => { window.__STEAM_REVEAL_PROGRESS_OVERRIDE__ = undefined; });
  const complete = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  expect(complete.skill?.debuff).toBe('bathroom-steam');
  expect(complete.skill?.effectAssets).toEqual([]);
  await writeFile(
    path.join(ARTIFACT_DIR, 'humidifier-steam-complete.png'),
    await page.locator('#game-canvas').screenshot(),
  );
  await writeFile(
    path.join(ARTIFACT_DIR, 'runtime-diagnostics.json'),
    `${JSON.stringify(complete.skill, null, 2)}\n`,
    'utf8',
  );
});


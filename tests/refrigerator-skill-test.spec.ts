import { expect, test } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ARTIFACT_DIR = path.resolve('artifacts/refrigerator-skill-test');

test('refrigerator skill test freezes about half of the available cable exits', async ({ page }) => {
  test.setTimeout(240_000);
  await mkdir(ARTIFACT_DIR, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/?theme=day&mode=skill-test&direct=1');
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
        && diagnostics.skill?.testId === 'refrigerator'
        && diagnostics.appliances.some(({ kind }) => kind === 'refrigerator')
        && diagnostics.clickTarget !== null;
    },
    null,
    { timeout: 90_000 },
  );

  await expect(page.locator('#skill-cue-source')).toHaveText('冰箱');
  await expect(page.locator('#skill-cue-title')).toHaveText('急冻封头');
  await expect(page.locator('#skill-cue-detail')).toHaveText('冻结约一半当前出口三回合。');
  await writeFile(path.join(ARTIFACT_DIR, 'refrigerator-skill-test-before.png'), await page.screenshot({ fullPage: true }));

  const target = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.clickTarget!);
  await page.mouse.click(target.x, target.y);
  await page.waitForFunction(
    () => {
      const skill = window.__THREE_GAME_DIAGNOSTICS__?.skill;
      return skill?.debuff === 'frozen-plug'
        && skill.refrigeratorFreeze.phase === 'freezing'
        && skill.inputLocked === true
        && skill.effectAssets.length === 0;
    },
    null,
    { timeout: 45_000 },
  );

  await page.waitForTimeout(700);
  const cooling = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.skill!);
  expect(cooling.screenEffect.mode).toBe('none');
  expect(cooling.refrigeratorFreeze.environmentAmount).toBeGreaterThan(0);
  expect(cooling.refrigeratorFreeze.environmentAmount).toBeLessThan(0.5);
  expect(cooling.refrigeratorScreenIce.progress).toBeCloseTo(cooling.refrigeratorFreeze.environmentAmount, 3);
  expect(cooling.refrigeratorScreenIce.visible).toBe(true);
  expect(cooling.refrigeratorScreenIce.visibleCrystalCount).toBeGreaterThanOrEqual(0);
  expect(cooling.refrigeratorScreenIce.centerObscured).toBe(false);
  expect(cooling.coldParticles.progress).toBeCloseTo(cooling.refrigeratorFreeze.environmentAmount, 3);
  expect(cooling.coldParticles.snowflakeCount).toBeGreaterThanOrEqual(0);
  await writeFile(path.join(ARTIFACT_DIR, 'refrigerator-skill-test-cooling.png'), await page.screenshot({ fullPage: true }));

  await page.waitForTimeout(1_750);
  const growing = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.skill!);
  expect(growing.screenEffect.mode).toBe('none');
  expect(growing.refrigeratorFreeze.cableProgress).toBeGreaterThan(0.45);
  expect(growing.refrigeratorScreenIce.visibleCrystalCount)
    .toBeGreaterThan(cooling.refrigeratorScreenIce.visibleCrystalCount);
  expect(growing.coldParticles.snowflakeCount).toBeGreaterThan(cooling.coldParticles.snowflakeCount);
  await page.waitForTimeout(450);
  await writeFile(path.join(ARTIFACT_DIR, 'refrigerator-skill-test-freezing.png'), await page.screenshot({ fullPage: true }));

  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.skill?.refrigeratorFreeze.phase === 'persistent',
    null,
    { timeout: 12_000 },
  );

  const frozen = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.skill!);
  expect(frozen.invulnerable).toBe(true);
  expect(frozen.effectAssets).toEqual([]);
  expect(frozen.screenEffect.mode).toBe('none');
  expect(frozen.refrigeratorFreeze.environmentAmount).toBeGreaterThan(0.8);
  expect(frozen.refrigeratorScreenIce.progress).toBeGreaterThan(0.8);
  expect(frozen.refrigeratorScreenIce.connectedRootCount).toBe(4);
  expect(frozen.refrigeratorScreenIce.visibleCrystalCount).toBe(frozen.refrigeratorScreenIce.crystalCount);
  const frozenCableEffects = frozen.cableEffects.filter(({ freezeAmount }) => freezeAmount > 0.98);
  const unfrozenCableEffects = frozen.cableEffects.filter(({ freezeAmount }) => freezeAmount < 0.01);
  expect(frozenCableEffects).toHaveLength(2);
  expect(frozen.cableEffects.every(({ glowStrength }) => glowStrength === 0)).toBe(true);
  expect(frozenCableEffects.every(({ iceShellVisible }) => iceShellVisible === true)).toBe(true);
  expect(frozenCableEffects.every(({ iceShellOpacity }) => Math.abs(iceShellOpacity - 0.86) < 0.001)).toBe(true);
  expect(frozenCableEffects.every(({ plugIceShellCount }) => plugIceShellCount === 1)).toBe(true);
  expect(unfrozenCableEffects.every(({ iceShellVisible }) => iceShellVisible === false)).toBe(true);
  expect(unfrozenCableEffects.every(({ plugIceShellCount }) => plugIceShellCount === 0)).toBe(true);
  expect(frozen.coldParticles.progress).toBeGreaterThan(0.8);
  expect(frozen.coldParticles.snowflakeCount).toBeGreaterThanOrEqual(growing.coldParticles.snowflakeCount);
  await page.waitForTimeout(650);
  await writeFile(path.join(ARTIFACT_DIR, 'refrigerator-skill-test-frozen.png'), await page.screenshot({ fullPage: true }));

  const canvas = await page.locator('#game-canvas').boundingBox();
  expect(canvas).not.toBeNull();
  await page.mouse.move(canvas!.x + canvas!.width * 0.5, canvas!.y + canvas!.height * 0.54);
  await page.mouse.down();
  await page.mouse.move(canvas!.x + canvas!.width * 0.66, canvas!.y + canvas!.height * 0.47, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(500);
  await writeFile(
    path.join(ARTIFACT_DIR, 'refrigerator-skill-test-frozen-rotated.png'),
    await page.screenshot({ fullPage: true }),
  );
});

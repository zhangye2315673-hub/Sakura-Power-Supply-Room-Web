import { expect, test, type Page } from '@playwright/test';

async function expectSettingsFit(page: Page): Promise<void> {
  const viewport = page.viewportSize()!;
  const { dialog, overflow, buttons } = await page.locator('#settings-dialog').evaluate(element => {
    const bounds = element.getBoundingClientRect();
    return {
      dialog: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height },
      overflow: element.scrollWidth > element.clientWidth,
      buttons: [...element.querySelectorAll('button')]
        .filter(button => button.getClientRects().length > 0 && getComputedStyle(button).visibility !== 'hidden')
        .map(button => {
          const buttonBounds = button.getBoundingClientRect();
          return { id: button.id, width: buttonBounds.width, height: buttonBounds.height, left: buttonBounds.left, right: buttonBounds.right };
        }),
    };
  });
  expect(dialog!.x).toBeGreaterThanOrEqual(0);
  expect(dialog!.y).toBeGreaterThanOrEqual(0);
  expect(dialog!.x + dialog!.width).toBeLessThanOrEqual(viewport.width);
  expect(dialog!.y + dialog!.height).toBeLessThanOrEqual(viewport.height);
  expect(overflow).toBe(false);
  for (const button of buttons) {
    expect(Math.round(button.width * 100) / 100, button.id).toBeGreaterThanOrEqual(44);
    expect(Math.round(button.height * 100) / 100, button.id).toBeGreaterThanOrEqual(44);
    expect(button.left, button.id).toBeGreaterThanOrEqual(dialog!.x);
    expect(button.right, button.id).toBeLessThanOrEqual(dialog!.x + dialog!.width);
  }
}

async function installSettingsFixture(page: Page): Promise<void> {
  await page.route('**/src/main.ts*', route => route.fulfill({
    contentType: 'application/javascript',
    body: `import '/src/styles.css';
import { Hud } from '/src/systems/Hud.ts';
import { GlobalToolbar } from '/src/theme/GlobalToolbar.ts';
import { ThemeController } from '/src/theme/ThemeController.ts';
import { SeasonController } from '/src/theme/SeasonController.ts';
import { AudioManager } from '/src/audio/AudioManager.ts';
import { toggleLocale } from '/src/systems/Locale.ts';
const hud = new Hud();
const theme = new ThemeController();
const season = new SeasonController();
const audio = new AudioManager();
const toolbar = new GlobalToolbar(theme, season, audio, hud.languageButton);
document.documentElement.classList.remove('opening-active');
document.documentElement.classList.add('app-ready');
document.querySelector('#start-screen').hidden = true;
hud.finishPuzzleLoad();
hud.setHintEnabled(true);
hud.refreshLocale();
toolbar.refreshLocale();
hud.languageButton.addEventListener('click', () => { toggleLocale(); hud.refreshLocale(); toolbar.refreshLocale(); });
hud.hintButton.addEventListener('click', () => hud.setHintUses(2));
hud.homeButton.addEventListener('click', () => document.documentElement.classList.add('opening-active'));
window.addEventListener('pagehide', () => { toolbar.dispose(); hud.dispose(); theme.dispose(); season.dispose(); audio.dispose(); });`,
  }));
  await page.goto('/');
  await expect(page.locator('#settings-button')).toBeVisible();
}

test('unified settings fit phone and desktop with no persistent action bars', async ({ page }) => {
  await installSettingsFixture(page);
  for (const viewport of [
    { width: 320, height: 568 }, { width: 390, height: 844 },
    { width: 430, height: 932 }, { width: 760, height: 1024 },
    { width: 568, height: 320 }, { width: 844, height: 390 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await expect(page.locator('button:visible')).toHaveCount(1);
    await expect(page.locator('#game-actions')).toBeHidden();
    await expect(page.locator('#help-strip')).toBeHidden();
    await page.locator('#settings-button').click();
    await expect(page.locator('#settings-close-button')).toBeFocused();
    for (let locale = 0; locale < 2; locale += 1) {
      await expectSettingsFit(page);
      await page.locator('#language-button').click();
    }
    await page.locator('#settings-done-button').click();
    await expect(page.locator('#settings-dialog')).not.toBeVisible();
    await expect(page.locator('#settings-button')).toBeFocused();
  }
});

test('settings reuse the original square outlined buttons and hard shadows', async ({ page }) => {
  await installSettingsFixture(page);
  await page.locator('#settings-button').click();
  await page.mouse.move(0, 0);
  await expect(page.locator('#settings-dialog')).toHaveCSS('border-radius', '0px');
  await expect(page.locator('#settings-dialog')).toHaveCSS('box-shadow', /8px 8px 0px 0px$/);
  const buttons = page.locator('#settings-button, #settings-dialog button:visible');
  for (const button of await buttons.all()) {
    await expect(button).toHaveCSS('border-radius', '0px');
    await expect(button).toHaveCSS('border-top-style', 'solid');
    await expect(button).toHaveCSS('box-shadow', /[23]px [23]px 0px 0px$/);
  }
  const reset = page.locator('#reset-view-button');
  await reset.hover();
  await expect(reset).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 1, 1)');
  await page.mouse.down();
  await expect(reset).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 3, 3)');
  await expect(reset).toHaveCSS('box-shadow', 'none');
  await page.mouse.up();
  await expect(page.locator('#settings-dialog')).not.toBeVisible();
});

test('settings preserve controls, nested Escape, focus and opening-screen access', async ({ page }) => {
  await installSettingsFixture(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#settings-button').click();
  const initialMute = await page.locator('#audio-button').getAttribute('aria-pressed');
  await page.locator('#audio-button').click();
  await expect(page.locator('#audio-button')).not.toHaveAttribute('aria-pressed', initialMute!);
  await page.locator('#theme-button').click();
  await expect(page.locator('#theme-button')).toHaveAttribute('data-mode', 'night');
  const closedMenuBounds = await page.locator('#settings-dialog').boundingBox();
  await page.locator('#season-button').click();
  await expect(page.locator('#season-menu')).toBeVisible();
  expect(await page.locator('#settings-dialog').boundingBox()).toEqual(closedMenuBounds);
  await page.keyboard.press('Escape');
  await expect(page.locator('#season-menu')).toBeHidden();
  await expect(page.locator('#settings-dialog')).toBeVisible();
  await page.locator('#season-button').click();
  await page.locator('#season-menu button[data-season="winter"]').click();
  await expect(page.locator('#season-button')).toHaveAttribute('data-season', 'winter');
  for (let index = 0; index < 20; index += 1) {
    await page.keyboard.press('Tab');
    expect(await page.locator('#settings-dialog').evaluate(dialog => dialog.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(page.locator('#settings-button')).toBeFocused();
  await page.locator('#settings-button').click();
  await page.locator('#hint-button').click();
  await expect(page.locator('#settings-dialog')).not.toBeVisible();
  await expect(page.locator('#hint-button .used')).toHaveCount(1);
  await page.locator('#settings-button').click();
  await page.locator('#home-button').click();
  await page.locator('#settings-button').click();
  await expect(page.locator('#settings-gameplay')).toBeHidden();
  await expect(page.locator('#theme-button')).toBeVisible();
  await expectSettingsFit(page);
  await page.mouse.click(2, 2);
  await expect(page.locator('#settings-dialog')).not.toBeVisible();
});

test('real game uses unified settings on mobile and desktop', async ({ browser }) => {
  test.setTimeout(240_000);
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto('/?diagnostics=1');
    await expect(page.locator('#start-game-button')).toBeEnabled({ timeout: 150_000 });
    await page.screenshot({ path: 'artifacts/mobile-controls-20260907/opening.png' });
    await page.locator('#start-game-button').tap();
    await page.waitForFunction(() => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      return diagnostics?.opening.active === false && diagnostics.opening.transitioning === false
        && diagnostics.sceneVisibility.appliances;
    }, null, { timeout: 60_000 });
    await expect(page.locator('button:visible')).toHaveCount(1);
    await page.screenshot({ path: 'artifacts/unified-settings-20260907/mobile-game.png' });
    const appliances = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.appliances);
    for (const appliance of appliances) {
      expect(appliance.screenX - appliance.screenWidth * 0.5, appliance.kind).toBeGreaterThanOrEqual(0.01);
      expect(appliance.screenX + appliance.screenWidth * 0.5, appliance.kind).toBeLessThanOrEqual(0.99);
      expect(appliance.screenY < 0.3 || appliance.screenY > 0.7, appliance.kind).toBe(true);
    }
    await page.locator('#settings-button').tap();
    await expectSettingsFit(page);
    await page.screenshot({ path: 'artifacts/unified-settings-20260907/mobile-settings.png' });
    await page.locator('#hint-button').tap();
    await expect(page.locator('#settings-dialog')).not.toBeVisible();
    await expect.poll(() => page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.hint.remaining)).toBe(2);
    const initialYaw = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.orbit.yaw);
    await page.mouse.move(195, 730);
    await page.mouse.down();
    await page.mouse.move(245, 730, { steps: 2 });
    await page.mouse.up();
    await expect.poll(() => page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.orbit.yaw)).not.toBe(initialYaw);
    await page.locator('#settings-button').tap();
    await page.locator('#reset-view-button').tap();
    await expect.poll(() => page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.orbit.yaw)).toBe(0.76);
    for (const [name, viewport] of [
      ['landscape', { width: 844, height: 390 }],
      ['desktop', { width: 1440, height: 900 }],
    ] as const) {
      await page.setViewportSize(viewport);
      await page.screenshot({ path: `artifacts/unified-settings-20260907/${name}-game.png` });
      await page.locator('#settings-button').tap();
      await expectSettingsFit(page);
      await page.screenshot({ path: `artifacts/unified-settings-20260907/${name}-settings.png` });
      await page.locator('#settings-done-button').tap();
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('#settings-button').tap();
    await page.locator('#home-button').tap();
    await expect(page.locator('#start-game-button')).toBeVisible();
    await page.locator('#settings-button').tap();
    await expect(page.locator('#settings-gameplay')).toBeHidden();
    expect(errors).toEqual([]);
  } finally {
    await context.close();
  }
});

test('mobile preview offers both design proportions and fills a real phone viewport', async ({ page }) => {
  await page.route('**/src/main.ts*', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
  await page.setViewportSize({ width: 1280, height: 1000 });
  for (const [size, height] of [['750x1624', 812], ['750x1334', 667]] as const) {
    await page.goto(`/mobile-preview.html?size=${size}`);
    expect(await page.frameLocator('iframe').locator('html').evaluate(() => [innerWidth, innerHeight])).toEqual([375, height]);
  }
  await page.setViewportSize({ width: 375, height: 812 });
  expect(await page.frameLocator('iframe').locator('html').evaluate(() => [innerWidth, innerHeight])).toEqual([375, 812]);
});

test('dense portrait puzzle keeps appliances in upper and lower bands on long and short phones', async ({ browser }) => {
  test.setTimeout(240_000);
  const context = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto('/?seed=42&mode=random&direct=1&diagnostics=1');
    await expect(page.locator('#start-game-button')).toBeEnabled({ timeout: 150_000 });
    await page.locator('#start-game-button').tap();
    await page.waitForFunction(() => {
      const state = window.__THREE_GAME_DIAGNOSTICS__;
      return state && !state.opening.active && !state.opening.transitioning && state.remainingArrows >= 30 && state.sceneVisibility.appliances;
    }, null, { timeout: 150_000 });
    for (const height of [812, 667]) {
      await page.setViewportSize({ width: 375, height });
      await expect.poll(() => page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.appliances.every(appliance => {
        const top = appliance.screenY - appliance.screenHeight / 2;
        const bottom = appliance.screenY + appliance.screenHeight / 2;
        return top >= 0.08 && bottom <= 0.92 && (bottom < 0.31 || top > 0.69);
      }))).toBe(true);
      const appliances = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.appliances);
      expect(appliances.filter(appliance => appliance.screenY < 0.5).length).toBeGreaterThanOrEqual(3);
      expect(appliances.filter(appliance => appliance.screenY > 0.5).length).toBeGreaterThanOrEqual(3);
      await page.screenshot({ path: `artifacts/mobile-bands-20260907/750x${height * 2}.png` });
      await page.locator('#settings-button').tap();
      await expectSettingsFit(page);
      await page.locator('#settings-done-button').tap();
    }
    const beforeRemoval = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.remainingArrows);
    await page.locator('#settings-button').tap();
    await page.locator('#reset-view-button').tap();
    const target = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.clickTarget);
    expect(target).toBeTruthy();
    await page.touchscreen.tap(target!.x, target!.y);
    await expect.poll(() => page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.remainingArrows), { timeout: 15_000 }).toBeLessThan(beforeRemoval);
    await page.setViewportSize({ width: 844, height: 390 });
    await expect.poll(() => page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.appliances.every(appliance => appliance.screenX < 0.25 || appliance.screenX > 0.75))).toBe(true);
    expect(errors).toEqual([]);
  } finally {
    await context.close();
  }
});

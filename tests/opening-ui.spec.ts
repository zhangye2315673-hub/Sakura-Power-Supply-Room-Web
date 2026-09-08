import { expect, test } from '@playwright/test';

test('opening menu supports keyboard, translations and small viewports', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/src/main.ts*', route => route.fulfill({
    contentType: 'application/javascript',
    body: `import '/src/styles.css';
import { StartScreen } from '/src/systems/StartScreen.ts';
import { toggleLocale } from '/src/systems/Locale.ts';
const noop = () => {};
const screen = new StartScreen({ onStart: noop, onRandom: noop, onExplore: noop, onRush: noop, onDoubleEnded: noop, onSkill: noop });
screen.markReady();
document.documentElement.classList.add('app-ready');
const toolbar = document.createElement('nav');
toolbar.id = 'global-toolbar';
toolbar.append(document.querySelector('#language-button'));
document.querySelector('#app').append(toolbar);
document.querySelector('#language-button').addEventListener('click', () => { toggleLocale(); screen.refreshLocale(); });`,
  }));
  await page.goto('/');
  const trigger = page.locator('#challenge-mode-button');
  const menu = page.locator('#challenge-mode-menu');
  await trigger.click();
  await expect(page.locator('#start-random-button')).toBeFocused();
  await page.keyboard.press('End');
  await expect(page.locator('#start-skill-button')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#start-random-button')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await expect(menu).toBeHidden();
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 568 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    await trigger.click();
    await expect(menu).toBeVisible();
    await page.keyboard.press('End');
    await expect(page.locator('#start-skill-button')).toBeFocused();
    await expect.poll(async () => {
      const box = await menu.boundingBox();
      return !!box && box.x >= 0 && box.y >= 0 && box.x + box.width <= viewport.width && box.y + box.height <= viewport.height;
    }).toBe(true);
    const last = await page.locator('#start-skill-button').boundingBox();
    expect(last!.y + last!.height).toBeLessThanOrEqual(viewport.height);
    await page.keyboard.press('Escape');
  }
  await page.setViewportSize({ width: 320, height: 568 });
  for (let iteration = 0; iteration < 4; iteration += 1) {
    await page.locator('#language-button').click();
    await expect(menu.locator('small')).toHaveCount(5);
    await trigger.click();
    await expect(menu).toBeVisible();
    await expect.poll(async () => {
      const box = await menu.boundingBox();
      return !!box && box.y + box.height <= 568;
    }).toBe(true);
    await page.keyboard.press('Escape');
  }
  expect(errors).toEqual([]);
});

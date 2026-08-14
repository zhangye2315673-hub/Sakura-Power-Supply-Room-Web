import { expect, test } from '@playwright/test';

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]) {
  test(`SAKURA global controls align without overlap at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/?theme=night&mode=random&direct=1&seed=2679418801');
    await page.waitForFunction(() => Boolean(window.__THREE_GAME_DIAGNOSTICS__));
    const layout = await page.evaluate(() => {
      const toolbar = document.querySelector<HTMLElement>('#global-toolbar');
      const controls = [...document.querySelectorAll<HTMLButtonElement>('#global-toolbar button')];
      const existing = document.querySelector<HTMLButtonElement>('#home-button');
      if (existing) {
        existing.style.transition = 'none';
        existing.disabled = false;
      }
      const existingStyle = existing ? getComputedStyle(existing) : null;
      const candidates = ['#global-toolbar', '#game-actions', '#play-tools', '#hud']
        .map((selector) => ({ selector, rect: document.querySelector(selector)?.getBoundingClientRect() }));
      const overlaps: string[] = [];
      candidates.forEach((first, index) => candidates.slice(index + 1).forEach((second) => {
        const a = first.rect;
        const b = second.rect;
        if (a && b && !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom)) {
          overlaps.push(`${first.selector}:${second.selector}`);
        }
      }));
      const toolbarStyle = toolbar ? getComputedStyle(toolbar) : null;
      const controlStyles = controls.map((control) => getComputedStyle(control));
      return {
        overlaps,
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        existingHeight: existing?.getBoundingClientRect().height ?? 0,
        heights: controls.map((control) => control.getBoundingClientRect().height),
        toolbarBorder: toolbarStyle?.borderTopWidth,
        toolbarShadow: toolbarStyle?.boxShadow,
        backgrounds: controlStyles.map((style) => style.backgroundColor),
        colors: controlStyles.map((style) => style.color),
        existingBackground: existingStyle?.backgroundColor,
        existingBorderColor: existingStyle?.borderTopColor,
        existingShadow: existingStyle?.boxShadow,
        controlBorderColors: controlStyles.map((style) => style.borderTopColor),
        controlShadows: controlStyles.map((style) => style.boxShadow),
      };
    });
    expect(layout.overlaps).toEqual([]);
    expect(layout.overflow).toBe(false);
    expect(layout.toolbarBorder).toBe('0px');
    expect(layout.toolbarShadow).toBe('none');
    expect(new Set(layout.backgrounds).size).toBe(1);
    expect(new Set(layout.colors).size).toBe(1);
    expect(layout.controlBorderColors.every((color) => color === layout.existingBorderColor)).toBe(true);
    expect(layout.controlShadows.every((shadow) => shadow === layout.existingShadow)).toBe(true);
    expect(layout.backgrounds.every((background) => background === layout.existingBackground)).toBe(true);
    if (viewport.width > 760) {
      expect(layout.heights.every((height) => Math.abs(height - layout.existingHeight) < 0.6)).toBe(true);
    } else {
      expect(layout.heights.every((height) => height >= 44)).toBe(true);
    }
  });
}

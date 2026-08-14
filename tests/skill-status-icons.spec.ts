import { expect, test } from '@playwright/test';

const STATUSES = [
  'dry-shield',
  'iridescent-bubble',
  'soothing-record',
  'continue',
  'induction-reveal',
  'bathroom-steam',
  'frozen-plug',
  'coffee-lock',
  'rice-thick-cable',
  'overheated-plug',
  'fake-double-plug',
] as const;

test('skill status HUD uses simple CSS low-poly icons without generated image assets', async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  await page.goto('/?mode=skill&direct=1&seed=20260812');
  await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true, null, { timeout: 90_000 });
  await page.click('#start-game-button');
  await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.opening.active === false, null, { timeout: 90_000 });
  await expect(page.locator('#skill-buff-slot')).toBeHidden();
  await expect(page.locator('#skill-debuff-slot')).toBeHidden();

  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.evaluate(() => {
      const buff = document.querySelector<HTMLElement>('#skill-buff-slot')!;
      const debuff = document.querySelector<HTMLElement>('#skill-debuff-slot')!;
      buff.classList.add('occupied');
      buff.dataset.status = 'iridescent-bubble';
      buff.tabIndex = 0;
      buff.querySelector<HTMLElement>('.skill-status-mark')!.textContent = '';
      buff.querySelector<HTMLElement>('.skill-status-name')!.textContent = '虹膜泡泡';
      buff.querySelector<HTMLElement>('.skill-status-detail')!.textContent = '抵挡一次受阻点击。剩余 5 回合。';
      buff.querySelector<HTMLElement>('.skill-status-tooltip')!.style.transition = 'none';
      buff.querySelector<HTMLElement>('.skill-status-count')!.textContent = '5';
      debuff.classList.add('occupied');
      debuff.dataset.status = 'overheated-plug';
      debuff.querySelector<HTMLElement>('.skill-status-mark')!.textContent = '';
      document.querySelector<HTMLElement>('#skill-printer-pending')!.classList.add('visible');
    });
    const metrics = await page.locator('#skill-status-rack').evaluate((rack) => {
      const rects = Object.fromEntries(['#skill-buff-slot', '#random-lives', '#hint-button', '#skill-debuff-slot']
        .map((selector) => [selector, document.querySelector<HTMLElement>(selector)!.getBoundingClientRect().toJSON()]));
      const iconStyles = [...rack.querySelectorAll<HTMLElement>('.skill-status-glyph, #skill-printer-pending > span')]
        .map((element) => ({
          image: getComputedStyle(element).backgroundImage,
          clipPath: getComputedStyle(element, '::before').clipPath,
        }));
      return {
        fits: Object.values(rects).every((rect) => rect.left >= 0 && rect.right <= document.documentElement.clientWidth
          && rect.top >= 0 && rect.bottom <= document.documentElement.clientHeight),
        order: rects['#skill-buff-slot'].right <= rects['#random-lives'].left
          && rects['#random-lives'].right <= rects['#hint-button'].left
          && rects['#hint-button'].right <= rects['#skill-debuff-slot'].left,
        avoidsGlobalToolbar: (() => {
          const toolbar = document.querySelector<HTMLElement>('#global-toolbar')?.getBoundingClientRect();
          if (!toolbar) return true;
          return Object.values(rects).every((rect) => rect.right <= toolbar.left || rect.left >= toolbar.right
            || rect.bottom <= toolbar.top || rect.top >= toolbar.bottom);
        })(),
        avoidsHud: (() => {
          const hud = document.querySelector<HTMLElement>('#hud')?.getBoundingClientRect();
          if (!hud) return true;
          return Object.values(rects).every((rect) => rect.right <= hud.left || rect.left >= hud.right
            || rect.bottom <= hud.top || rect.top >= hud.bottom);
        })(),
        noPageOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
        generatedImagesRemoved: iconStyles.every(({ image }) => !image.includes('url(')),
        lowPolyShapes: iconStyles.every(({ clipPath }) => clipPath.startsWith('polygon(')),
        iconOnly: [...rack.querySelectorAll<HTMLElement>('.skill-status-slot.occupied')]
          .every((slot) => getComputedStyle(slot).borderTopWidth === '0px'
            && getComputedStyle(slot).backgroundColor === 'rgba(0, 0, 0, 0)'),
      };
    });
    expect(metrics.fits).toBe(true);
    expect(metrics.order).toBe(true);
    expect(metrics.avoidsGlobalToolbar).toBe(true);
    expect(metrics.avoidsHud).toBe(true);
    expect(metrics.noPageOverflow).toBe(true);
    expect(metrics.generatedImagesRemoved).toBe(true);
    expect(metrics.lowPolyShapes).toBe(true);
    expect(metrics.iconOnly).toBe(true);
    const tooltip = await page.evaluate(() => {
      const buff = document.querySelector<HTMLElement>('#skill-buff-slot')!;
      const bubble = buff.querySelector<HTMLElement>('.skill-status-tooltip')!;
      buff.focus({ focusVisible: true });
      const style = getComputedStyle(bubble);
      return { visible: style.opacity === '1', text: bubble.textContent ?? '' };
    });
    expect(tooltip.visible).toBe(true);
    expect(tooltip.text).toContain('剩余 5 回合');
    await page.screenshot({ path: testInfo.outputPath(`skill-status-${viewport.width}x${viewport.height}.png`), fullPage: true });
  }
});

test('all eleven status themes use original CSS pictograms and never load an image or font symbol', async ({ page }) => {
  await page.goto('/?mode=skill&direct=1&seed=20260812');

  const results = await page.evaluate((statuses) => {
    const slot = document.querySelector<HTMLElement>('#skill-buff-slot')!;
    const glyph = slot.querySelector<HTMLElement>('.skill-status-glyph')!;
    const markElement = slot.querySelector<HTMLElement>('.skill-status-mark')!;
    const signature = (style: CSSStyleDeclaration): string => [
      style.inset, style.left, style.top, style.right, style.bottom,
      style.width, style.height, style.background, style.clipPath,
      style.border, style.borderRadius, style.boxShadow, style.transform,
    ].join(';');
    return statuses.map((status) => {
      slot.dataset.status = status;
      markElement.textContent = '';
      const style = getComputedStyle(glyph);
      const markStyle = getComputedStyle(markElement);
      return {
        status,
        mark: markElement.textContent,
        image: style.backgroundImage,
        shellClipPath: style.clipPath,
        clipPath: getComputedStyle(glyph, '::before').clipPath,
        pictogram: [
          signature(markStyle),
          signature(getComputedStyle(markElement, '::before')),
          signature(getComputedStyle(markElement, '::after')),
        ].join('|'),
      };
    });
  }, STATUSES);

  expect(results).toHaveLength(11);
  for (const result of results) {
    expect(result.mark, result.status).toBe('');
    expect(result.image, result.status).not.toContain('url(');
    expect(result.clipPath, result.status).toMatch(/^polygon\(/);
    expect(result.shellClipPath, result.status).toBe(results[0].shellClipPath);
  }
  expect(new Set(results.map(({ pictogram }) => pictogram)).size).toBe(11);
});

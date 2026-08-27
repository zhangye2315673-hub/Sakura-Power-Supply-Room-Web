import { expect, test } from '@playwright/test';
import { nextSeason, resolveInitialSeason } from '../src/theme/SeasonController';
import { SEASON_PROFILES } from '../src/theme/SeasonProfiles';
import { createSakuraPetalGeometry } from '../src/systems/PetalVisual';
import {
  createAutumnLeafGeometry,
  createSeasonParticleMaterial,
  createSummerLeafGeometry,
  createWinterSnowGeometry,
} from '../src/systems/SeasonParticleVisual';

const GAME_URL = '/?mode=random&direct=1&seed=2679418801';
test.describe.configure({ timeout: 120_000 });

async function waitForOpeningReady(page: import('@playwright/test').Page): Promise<void> {
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true,
    null,
    { timeout: 90_000 },
  );
}

async function chooseSeason(page: import('@playwright/test').Page, mode: string): Promise<void> {
  await page.locator('#season-button').evaluate((button: HTMLButtonElement) => button.click());
  await page.locator(`#season-menu [data-season="${mode}"]`).evaluate((button: HTMLButtonElement) => button.click());
}

test('spring remains the default compatibility profile and query takes priority', () => {
  expect(resolveInitialSeason('', null, false)).toEqual({ mode: 'spring', source: 'default' });
  expect(resolveInitialSeason('', 'autumn', false)).toEqual({ mode: 'autumn', source: 'saved' });
  expect(resolveInitialSeason('?season=winter', 'summer', false)).toEqual({ mode: 'winter', source: 'query' });
  expect(resolveInitialSeason('', 'winter', true)).toEqual({ mode: 'spring', source: 'default' });

  expect(SEASON_PROFILES.spring.day.pageBackground.getHex()).toBe(0xd4e8fa);
  expect(SEASON_PROFILES.spring.day.sunIntensity).toBe(2.25);
  expect(SEASON_PROFILES.spring.night.pageBackground.getHex()).toBe(0x11152c);
  expect(SEASON_PROFILES.spring.night.sunIntensity).toBe(0.82);
});

test('automatic order and flat rounded seasonal particle contracts remain explicit', () => {
  expect(nextSeason('spring')).toBe('summer');
  expect(nextSeason('summer')).toBe('autumn');
  expect(nextSeason('autumn')).toBe('winter');
  expect(nextSeason('winter')).toBe('spring');

  const spring = createSakuraPetalGeometry();
  spring.computeBoundingBox();
  const springBounds = spring.boundingBox!;
  const springSize = Math.max(
    springBounds.max.x - springBounds.min.x,
    springBounds.max.y - springBounds.min.y,
  );
  const geometries = [
    createSummerLeafGeometry(),
    createAutumnLeafGeometry(),
    createWinterSnowGeometry(),
  ];
  for (const geometry of geometries) {
    geometry.computeBoundingBox();
    const bounds = geometry.boundingBox!;
    const size = Math.max(bounds.max.x - bounds.min.x, bounds.max.y - bounds.min.y);
    expect(bounds.max.z - bounds.min.z).toBeLessThan(0.0001);
    expect(size / springSize).toBeGreaterThan(0.82);
    expect(size / springSize).toBeLessThan(1.12);
    expect(geometry.userData.flatParticleKind).toMatch(/summer-leaf|autumn-maple|winter-snow/);
    geometry.dispose();
  }
  spring.dispose();
  const autumn = createAutumnLeafGeometry();
  expect(autumn.userData.autumnStyle).toBe('minimal-rounded-v6');
  expect(autumn.userData.autumnLobeCount).toBe(5);
  expect(autumn.userData.autumnSecondarySerrations).toBe(0);
  expect(autumn.userData.autumnStemCurved).toBe(true);
  expect(autumn.userData.autumnStemLengthRatio).toBeLessThan(0.2);
  const colors = autumn.getAttribute('color');
  expect(colors.count).toBe(autumn.getAttribute('position').count);
  const first = [colors.getX(0), colors.getY(0), colors.getZ(0)];
  expect(Array.from({ length: colors.count }, (_, index) => (
    Math.abs(colors.getX(index) - first[0])
    + Math.abs(colors.getY(index) - first[1])
    + Math.abs(colors.getZ(index) - first[2])
  )).some((difference) => difference > 0.03)).toBe(true);
  const average = Array.from({ length: colors.count }, (_, index) => ({
    r: colors.getX(index), g: colors.getY(index), b: colors.getZ(index),
  })).reduce((sum, color) => ({
    r: sum.r + color.r / colors.count,
    g: sum.g + color.g / colors.count,
    b: sum.b + color.b / colors.count,
  }), { r: 0, g: 0, b: 0 });
  expect(average.r).toBeGreaterThan(average.g * 1.45);
  expect(average.r).toBeGreaterThan(average.b * 1.3);
  autumn.dispose();
  const snow = createWinterSnowGeometry();
  expect(snow.userData.winterArmCount).toBe(6);
  expect(snow.userData.winterBranchPairsPerArm).toBe(2);
  snow.dispose();
  const material = createSeasonParticleMaterial(0x8fbd78, 0.8);
  expect(material.type).toBe('MeshBasicMaterial');
  material.dispose();

  expect(SEASON_PROFILES.spring.day.cloudOpacity).toBe(0.48);
  expect(SEASON_PROFILES.spring.day.cloudShadeOpacity).toBe(0.25);
  for (const season of ['summer', 'autumn', 'winter'] as const) {
    expect(SEASON_PROFILES[season].day.cloudOpacity).toBeLessThanOrEqual(0.15);
    expect(SEASON_PROFILES[season].day.cloudShadeOpacity).toBeLessThanOrEqual(0.06);
  }
  const summerHaze = SEASON_PROFILES.summer.day.skyHaze;
  expect(summerHaze.g).toBeGreaterThan(summerHaze.r);
  expect(summerHaze.g).toBeGreaterThan(summerHaze.b);
  const autumnHaze = SEASON_PROFILES.autumn.day.skyHaze;
  expect(autumnHaze.r).toBeGreaterThan(autumnHaze.g);
  expect(autumnHaze.g).toBeGreaterThan(autumnHaze.b);
  const winterHaze = SEASON_PROFILES.winter.day.skyHaze;
  expect(winterHaze.b).toBeGreaterThan(winterHaze.g);
  expect(winterHaze.g).toBeGreaterThan(winterHaze.r);
});

test('automatic season timing advances independently and manual selection resets its clock', async ({ page }) => {
  await page.goto('/?season=spring&theme=night');
  const state = await page.evaluate(async () => {
    const loadController = new Function('return import("/src/theme/SeasonController.ts")') as () => Promise<{
      SeasonController: typeof import('../src/theme/SeasonController').SeasonController;
    }>;
    const { SeasonController } = await loadController();
    const controller = new SeasonController({ autoIntervalSeconds: 2 });
    controller.update(1, 1);
    controller.update(1, 1);
    const automatic = controller.snapshot;
    controller.setMode('autumn', true);
    controller.update(0.4, 1);
    const manual = controller.snapshot;
    controller.dispose();
    return { automatic, manual };
  });
  expect(state.automatic.targetMode).toBe('summer');
  expect(state.automatic.source).toBe('automatic');
  expect(state.automatic.autoElapsed).toBeLessThan(0.01);
  expect(state.manual.targetMode).toBe('autumn');
  expect(state.manual.source).toBe('manual');
  expect(state.manual.autoElapsed).toBeCloseTo(0.4, 2);
  expect(await page.locator('#theme-button').getAttribute('data-mode')).toBe('night');
});

test('live automatic season cycle leaves the day-night target unchanged', async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto(`${GAME_URL}&season=spring&theme=night&seasonAutoSeconds=1`);
  await page.waitForFunction(() => {
    const theme = window.__THREE_GAME_DIAGNOSTICS__?.theme;
    return theme?.season.source === 'automatic' && theme.season.targetMode === 'summer';
  }, null, { timeout: 90_000 });
  const state = await page.evaluate(() => ({
    theme: window.__THREE_GAME_DIAGNOSTICS__!.theme,
    themeButton: document.querySelector<HTMLButtonElement>('#theme-button')?.dataset.mode,
  }));
  expect(state.theme.season.autoInterval).toBe(1);
  expect(state.theme.season.automatic).toBe(true);
  expect(state.theme.targetMode).toBe('night');
  expect(state.themeButton).toBe('night');
});

test('opening foreground wash follows summer, autumn, and winter palettes', async ({ page }) => {
  test.setTimeout(300_000);
  const expected = {
    summer: '221, 226, 202',
    autumn: '240, 217, 187',
    winter: '219, 223, 213',
  } as const;
  for (const [season, rgb] of Object.entries(expected)) {
    await page.goto(`${GAME_URL}&season=${season}&theme=day`);
    await page.waitForFunction(() => Boolean(window.__THREE_GAME_DIAGNOSTICS__));
    const wash = await page.evaluate(() => ({
      variable: document.documentElement.style.getPropertyValue('--start-wash-rgb').trim(),
      background: getComputedStyle(document.querySelector('.start-screen-wash')!).backgroundImage,
      pageOpacity: document.documentElement.style.getPropertyValue('--start-wash-page-opacity').trim(),
    }));
    expect(wash.variable).toBe(rgb);
    expect(wash.background).toContain(rgb);
    expect(wash.pageOpacity).toBe('0.0000');
  }

  const expectedNight = {
    spring: '29, 33, 57',
    summer: '21, 48, 74',
    autumn: '42, 44, 66',
    winter: '24, 43, 59',
  } as const;
  for (const [season, rgb] of Object.entries(expectedNight)) {
    await page.goto(`${GAME_URL}&season=${season}&theme=night`);
    await page.waitForFunction(() => Boolean(window.__THREE_GAME_DIAGNOSTICS__));
    const wash = await page.evaluate(() => ({
      variable: document.documentElement.style.getPropertyValue('--start-wash-rgb').trim(),
      background: getComputedStyle(document.querySelector('.start-screen-wash')!).backgroundImage,
      nightOverlay: getComputedStyle(document.querySelector('.start-screen-wash')!, '::after').content,
      pageOpacity: document.documentElement.style.getPropertyValue('--start-wash-page-opacity').trim(),
    }));
    expect(wash.variable).toBe(rgb);
    expect(wash.background).toContain(rgb);
    expect(wash.nightOverlay).toBe('none');
    expect(wash.pageOpacity).toBe('0.1400');
  }
});

test('season menu persists a manual choice and redirects a live transition without jumping', async ({ page }) => {
  test.setTimeout(240_000);
  await page.addInitScript(() => localStorage.clear());
  await page.goto(GAME_URL);
  await page.waitForFunction(() => Boolean(window.__THREE_GAME_DIAGNOSTICS__));
  await waitForOpeningReady(page);

  const initial = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.theme.season);
  expect(initial.mode).toBe('spring');
  expect(initial.source).toBe('default');
  expect(initial.weights).toEqual({ spring: 1, summer: 0, autumn: 0, winter: 0 });

  await page.locator('#season-button').evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.locator('#season-button')).toHaveAttribute('aria-expanded', 'true');
  await page.locator('#season-menu [data-season="summer"]').evaluate((button: HTMLButtonElement) => button.click());
  await expect.poll(
    async () => page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.theme.season.weights.summer ?? 0),
    { timeout: 45_000 },
  ).toBeGreaterThan(0.08);

  const redirect = await page.evaluate(() => {
    const before = { ...window.__THREE_GAME_DIAGNOSTICS__!.theme.season.weights };
    document.querySelector<HTMLButtonElement>('#season-button')?.click();
    document.querySelector<HTMLButtonElement>('#season-menu [data-season="autumn"]')?.click();
    const after = { ...window.__THREE_GAME_DIAGNOSTICS__!.theme.season.weights };
    return { before, after };
  });
  for (const mode of ['spring', 'summer', 'autumn', 'winter'] as const) {
    expect(Math.abs(redirect.after[mode] - redirect.before[mode])).toBeLessThan(0.01);
  }
  await expect.poll(
    async () => page.evaluate(() => {
      const season = window.__THREE_GAME_DIAGNOSTICS__?.theme.season;
      return season?.targetMode === 'autumn' && season.progress > 0.999 ? season.mode : 'pending';
    }),
    { timeout: 90_000 },
  ).toBe('autumn');
  const settled = await page.evaluate(() => ({
    season: window.__THREE_GAME_DIAGNOSTICS__!.theme.season,
    saved: localStorage.getItem('sakura.season'),
    dataset: document.documentElement.dataset.season,
  }));
  expect(settled.season.mode).toBe('autumn');
  expect(settled.season.weights.autumn).toBeGreaterThan(0.999);
  expect(settled.saved).toBe('autumn');
  expect(settled.dataset).toBe('autumn');
});

test('season and day-night transitions remain orthogonal', async ({ page }) => {
  test.setTimeout(180_000);
  await page.addInitScript(() => localStorage.clear());
  await page.goto(`${GAME_URL}&season=winter&theme=day`);
  await page.waitForFunction(() => Boolean(window.__THREE_GAME_DIAGNOSTICS__));
  await waitForOpeningReady(page);
  await chooseSeason(page, 'summer');
  await page.locator('#theme-button').evaluate((button: HTMLButtonElement) => button.click());

  const targets = await page.evaluate(() => ({
    season: document.querySelector<HTMLButtonElement>('#season-button')?.dataset.season,
    theme: document.querySelector<HTMLButtonElement>('#theme-button')?.dataset.mode,
  }));
  expect(targets).toEqual({ season: 'summer', theme: 'night' });
  await page.waitForFunction(() => {
    const theme = window.__THREE_GAME_DIAGNOSTICS__?.theme;
    return theme?.season.mode === 'summer'
      && theme.season.progress > 0.999
      && theme.mode === 'night'
      && theme.progress > 0.98;
  }, null, { timeout: 60_000 });
  const final = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.theme);
  expect(final.season.targetMode).toBe('summer');
  expect(final.targetMode).toBe('night');
  expect(final.seasonParticles.fireflyOpacity).toBe(0);
  expect(final.seasonParticles.summerOpacity).toBeGreaterThan(0.25);
});

test('winter ambient snow is independent from refrigerator skill crystals', async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto(`${GAME_URL}&season=winter&theme=day`);
  await page.waitForFunction(() => Boolean(window.__THREE_GAME_DIAGNOSTICS__));
  await waitForOpeningReady(page);
  const state = await page.evaluate(() => ({
    particles: window.__THREE_GAME_DIAGNOSTICS__!.theme.seasonParticles,
    opening: window.__THREE_GAME_DIAGNOSTICS__!.opening,
    skill: window.__THREE_GAME_DIAGNOSTICS__!.skill,
  }));
  expect(state.particles.winterOpacity).toBeGreaterThan(0.9);
  expect(state.particles.refrigeratorSnowVisible).toBe(false);
  expect(state.particles.refrigeratorColdProgress).toBe(0);
  expect(state.opening.visibleSeasonLayers).toEqual(['winter']);
  expect(state.skill).toBeNull();
});

test('reduced motion keeps the seasonal target and finishes with the shortened transition', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => localStorage.clear());
  await page.goto(GAME_URL);
  await page.waitForFunction(() => Boolean(window.__THREE_GAME_DIAGNOSTICS__));
  expect(await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.theme.season.reducedMotion)).toBe(true);
  await chooseSeason(page, 'autumn');
  await page.waitForFunction(() => {
    const season = window.__THREE_GAME_DIAGNOSTICS__?.theme.season;
    return season?.targetMode === 'autumn' && season.mode === 'autumn' && season.progress > 0.999;
  }, null, { timeout: 15_000 });
});

test('exploration night keeps the selected seasonal layer while preserving cave atmosphere', async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/?mode=explore&direct=1&seed=2679418801&season=autumn&theme=night');
  await page.waitForFunction(() => Boolean(window.__THREE_GAME_DIAGNOSTICS__));
  const state = await page.evaluate(() => ({
    exploration: window.__THREE_GAME_DIAGNOSTICS__!.exploration,
    season: window.__THREE_GAME_DIAGNOSTICS__!.theme.season,
    particles: window.__THREE_GAME_DIAGNOSTICS__!.theme.seasonParticles,
    eyes: window.__THREE_GAME_DIAGNOSTICS__!.theme.explorationEyes,
  }));
  expect(state.exploration.active).toBe(true);
  expect(state.season.mode).toBe('autumn');
  expect(state.particles.autumnOpacity).toBeGreaterThan(0.8);
  expect(state.particles.refrigeratorSnowVisible).toBe(false);
  expect(state.eyes.pairs).toBeGreaterThan(0);
});

test('season menu supports keyboard focus, Escape, outside close, and mobile viewport bounds', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.clear());
  await page.goto(GAME_URL);
  await page.waitForFunction(() => Boolean(window.__THREE_GAME_DIAGNOSTICS__));
  await waitForOpeningReady(page);

  await page.locator('#season-button').focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#season-button')).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#season-menu button.active')).toBeFocused();
  await page.keyboard.press('End');
  await expect(page.locator('#season-menu [data-season="winter"]')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#season-button')).toBeFocused();
  await expect(page.locator('#season-button')).toHaveAttribute('aria-expanded', 'false');

  await page.locator('#season-button').click();
  await page.locator('#game-canvas').dispatchEvent('pointerdown', { pointerType: 'mouse' });
  await expect(page.locator('#season-button')).toHaveAttribute('aria-expanded', 'false');
  const bounds = await page.locator('#season-menu').evaluate((menu) => {
    const rect = menu.getBoundingClientRect();
    return { left: rect.left, right: rect.right, viewport: innerWidth, overflow: document.documentElement.scrollWidth > innerWidth + 1 };
  });
  expect(bounds.left).toBeGreaterThanOrEqual(0);
  expect(bounds.right).toBeLessThanOrEqual(bounds.viewport);
  expect(bounds.overflow).toBe(false);
});

import { expect, test } from '@playwright/test';
import { APPLIANCE_CATALOG } from '../src/systems/ApplianceCatalog';
import { APPLIANCE_SENSORY_PROFILES } from '../src/appliances/ApplianceSensoryProfiles';
import { APPLIANCE_AUDIO_PROFILES } from '../src/audio/ApplianceAudioProfiles';
import { AdaptiveNightQuality } from '../src/theme/AdaptiveQuality';
import { ApplianceSensoryController } from '../src/appliances/ApplianceSensoryController';
import { createApplianceModel } from '../src/appliances/models';

test('adaptive night quality degrades after two seconds and restores after eight', () => {
  const changes: string[] = [];
  const quality = new AdaptiveNightQuality((tier) => changes.push(tier));
  for (let frame = 0; frame < 79; frame += 1) quality.update(1 / 40);
  expect(quality.tier).toBe('high');
  quality.update(1 / 40);
  expect(quality.tier).toBe('reduced');
  for (let frame = 0; frame < 80; frame += 1) quality.update(1 / 40);
  expect(quality.tier).toBe('sparse');
  for (let frame = 0; frame < 80; frame += 1) quality.update(1 / 40);
  expect(quality.tier).toBe('minimal');
  for (let frame = 0; frame < 479; frame += 1) quality.update(1 / 60);
  expect(quality.tier).toBe('minimal');
  quality.update(1 / 60);
  expect(quality.tier).toBe('sparse');
  expect(changes).toEqual(['reduced', 'sparse', 'minimal', 'sparse']);
});

test('all 29 appliances have sensory and four-stage audio profiles', () => {
  const catalogKinds = APPLIANCE_CATALOG.map((definition) => definition.id).sort();
  expect(Object.keys(APPLIANCE_SENSORY_PROFILES).sort()).toEqual(catalogKinds);
  expect(Object.keys(APPLIANCE_AUDIO_PROFILES).sort()).toEqual(catalogKinds);
  expect(catalogKinds).toHaveLength(29);
  for (const kind of catalogKinds) {
    const sensory = APPLIANCE_SENSORY_PROFILES[kind];
    const audio = APPLIANCE_AUDIO_PROFILES[kind];
    expect(sensory.standbyBrightness).toBeGreaterThanOrEqual(0.35);
    expect(sensory.standbyBrightness).toBeLessThanOrEqual(0.45);
    expect(audio.stages).toHaveLength(4);
    expect(audio.stages.map((stage) => stage.at)).toEqual([...audio.stages.map((stage) => stage.at)].sort((a, b) => a - b));
    expect(audio.stages[3].at + audio.stages[3].duration).toBeLessThanOrEqual(audio.duration);
  }
  expect(APPLIANCE_AUDIO_PROFILES.printer.duration).toBeGreaterThan(5.2);
});

test('all 29 appliance models expose a real functional light node', () => {
  const sensory = new ApplianceSensoryController();
  const targets = APPLIANCE_CATALOG.map((definition, index) => {
    const model = createApplianceModel(definition.id, {
      id: `night-light-${definition.id}`,
      accent: 0xe05f61 + index,
      referencePath: definition.referencePath,
    });
    return {
      root: model.root,
      state: 'idle' as const,
      kind: definition.id,
      facingSide: 1 as const,
      getActiveElapsed: () => 0,
    };
  });
  sensory.register(targets);
  const diagnostics = sensory.getDiagnostics();
  expect(diagnostics).toHaveLength(29);
  expect(diagnostics.filter((item) => item.missingFunctionalNode)).toEqual([]);
  sensory.dispose();
});

test('theme defaults to day, persists only after manual toggle, and syncs browser color', async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/?mode=random&direct=1&seed=2679418801');
  await page.waitForFunction(() => Boolean(window.__THREE_GAME_DIAGNOSTICS__));
  const initial = await page.evaluate(() => ({
    theme: window.__THREE_GAME_DIAGNOSTICS__?.theme,
    saved: localStorage.getItem('sakura.theme'),
    color: document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.content,
  }));
  expect(initial.theme?.mode).toBe('day');
  expect(initial.theme?.source).toBe('default');
  expect(initial.saved).toBeNull();
  expect(initial.color?.toLowerCase()).toBe('#d4e8fa');

  await page.locator('#theme-button').click();
  await expect.poll(
    async () => page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.theme.progress ?? 0),
    { timeout: 15_000 },
  ).toBeGreaterThan(0.98);
  const night = await page.evaluate(() => ({
    theme: window.__THREE_GAME_DIAGNOSTICS__?.theme,
    saved: localStorage.getItem('sakura.theme'),
    color: document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.content,
  }));
  expect(night.theme?.mode).toBe('night');
  expect(night.theme?.stars).toBeGreaterThanOrEqual(90);
  expect(night.saved).toBe('night');
  expect(night.color?.toLowerCase()).not.toBe('#d4e8fa');
});

test('query overrides saved theme and internal showcase ignores saved preference', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('sakura.theme', 'night'));
  await page.goto('/?theme=day&mode=random&direct=1&seed=2679418801');
  await page.waitForFunction(() => Boolean(window.__THREE_GAME_DIAGNOSTICS__));
  expect(await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.theme.mode)).toBe('day');
  expect(await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.theme.source)).toBe('query');

  await page.goto('/?showcase=plugs');
  await page.waitForFunction(() => Boolean(window.__PLUG_SHOWCASE_DIAGNOSTICS__));
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('day');
});

test('rapid toggle reverses from the current transition progress', async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/?mode=random&direct=1&seed=2679418801');
  await page.waitForFunction(() => Boolean(window.__THREE_GAME_DIAGNOSTICS__));
  await page.locator('#theme-button').click();
  await page.waitForFunction(() => {
    const progress = window.__THREE_GAME_DIAGNOSTICS__?.theme.progress ?? 0;
    return progress > 0.2 && progress < 0.9;
  });
  const reversal = await page.evaluate(() => {
    const before = window.__THREE_GAME_DIAGNOSTICS__?.theme.progress ?? 0;
    document.querySelector<HTMLButtonElement>('#theme-button')?.click();
    const after = window.__THREE_GAME_DIAGNOSTICS__?.theme.progress ?? 0;
    return { before, after };
  });
  expect(reversal.after).toBeGreaterThan(0);
  expect(Math.abs(reversal.after - reversal.before)).toBeLessThan(0.001);
  await expect.poll(
    async () => page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.theme.progress ?? 1),
    { timeout: 15_000 },
  ).toBeLessThan(0.02);
});

test('lantern follows canvas input, dims at appliance edges, and returns on UI hover', async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto('/?theme=night&level=1');
  await page.waitForFunction(() => (window.__THREE_GAME_DIAGNOSTICS__?.theme.progress ?? 0) > 0.98);
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true
      && document.querySelector<HTMLButtonElement>('#start-game-button')?.disabled === false,
    null,
    { timeout: 150_000 },
  );
  await page.locator('#start-game-button').click({ force: true });
  await page.waitForFunction(
    () => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      return diagnostics?.opening.active === false
        && diagnostics.sceneVisibility.appliances
        && diagnostics.appliances.length > 0
        && diagnostics.clickTarget !== null;
    },
    null,
    { timeout: 150_000 },
  );
  const canvas = page.locator('#game-canvas');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.48);
  await expect.poll(
    async () => page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.theme.lantern.returning ?? true),
    { timeout: 30_000 },
  ).toBe(false);
  await expect.poll(
    async () => page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.theme.lantern.intensity ?? 0),
    { timeout: 30_000 },
  ).toBeGreaterThan(0.85);
  await page.mouse.move(box.x + box.width * 0.08, box.y + box.height * 0.5);
  await expect.poll(
    async () => page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.theme.lantern.inApplianceZone ?? false),
    { timeout: 30_000 },
  ).toBe(true);
  await expect.poll(
    async () => page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.theme.lantern.intensity ?? 1),
    { timeout: 30_000 },
  ).toBeGreaterThan(0.72);
  expect(await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.theme.lantern.intensity ?? 1)).toBeLessThan(0.9);
  await page.locator('#theme-button').dispatchEvent('pointermove', {
    pointerType: 'mouse',
    clientX: 0,
    clientY: 0,
  });
  await expect.poll(
    async () => page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.theme.lantern.returning ?? false),
    { timeout: 30_000 },
  ).toBe(true);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');
    canvas?.dispatchEvent(new PointerEvent('pointermove', {
      bubbles: true,
      clientX: 195,
      clientY: 422,
      pointerId: 7,
      pointerType: 'touch',
    }));
  });
  const mobileTargetY = await page.evaluate(
    () => window.__THREE_GAME_DIAGNOSTICS__?.theme.lantern.target[1] ?? 0,
  );
  expect(mobileTargetY).toBeGreaterThan(0.1);

  const layout = await page.evaluate(() => {
    const selectors = ['#global-toolbar', '#play-tools', '#hud', '#game-actions'];
    const boxes = selectors.map((selector) => ({
      selector,
      rect: document.querySelector(selector)?.getBoundingClientRect(),
    }));
    const overlaps: string[] = [];
    boxes.forEach((first, firstIndex) => boxes.slice(firstIndex + 1).forEach((second) => {
      const a = first.rect;
      const b = second.rect;
      if (a && b && !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom)) {
        overlaps.push(`${first.selector}:${second.selector}`);
      }
    }));
    return {
      overlaps,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
    };
  });
  expect(layout).toEqual({ overlaps: [], horizontalOverflow: false });

  await page.evaluate(() => {
    const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');
    canvas?.dispatchEvent(new PointerEvent('pointerup', {
      bubbles: true,
      clientX: 195,
      clientY: 422,
      pointerId: 7,
      pointerType: 'touch',
    }));
  });
  await expect.poll(
    async () => page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.theme.lantern.returning ?? false),
    { timeout: 30_000 },
  ).toBe(true);
});

test('opening night lantern follows the non-interactive start-screen surface', async ({ page }) => {
  test.setTimeout(150_000);
  await page.goto('/?theme=night&seed=2679418801');
  await page.waitForFunction(
    () => (window.__THREE_GAME_DIAGNOSTICS__?.theme.progress ?? 0) > 0.98
      && window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true,
    null,
    { timeout: 120_000 },
  );
  const startScreen = page.locator('#start-screen');
  const box = await startScreen.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.45);
  await expect.poll(
    async () => page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.theme.lantern.returning ?? true),
    { timeout: 15_000 },
  ).toBe(false);
  await expect.poll(
    async () => page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.theme.lantern.position[0] ?? 0),
    { timeout: 15_000 },
  ).toBeGreaterThan(0.2);
  await page.hover('#start-game-button');
  await expect.poll(
    async () => page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.theme.lantern.returning ?? false),
    { timeout: 15_000 },
  ).toBe(true);
});

test('audio unlocks after user interaction and mute preference persists independently', async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/?mode=random&direct=1&seed=2679418801');
  await page.waitForFunction(() => Boolean(window.__THREE_GAME_DIAGNOSTICS__));
  expect(await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.audio.unlocked)).toBe(false);
  await page.locator('#start-screen').click({ position: { x: 8, y: 8 } });
  await expect.poll(
    async () => page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.audio.unlocked ?? false),
  ).toBe(true);
  await page.locator('#audio-button').click();
  expect(await page.evaluate(() => localStorage.getItem('sakura.audioMuted'))).toBe('true');
  expect(await page.locator('#audio-button').getAttribute('aria-pressed')).toBe('false');
  expect(await page.evaluate(() => localStorage.getItem('sakura.theme'))).toBeNull();
});

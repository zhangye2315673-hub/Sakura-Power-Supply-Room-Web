import { expect, test } from '@playwright/test';
import { horizontalOrbitInputSign } from '../src/systems/OrbitController';

test('horizontal orbit input keeps its screen-space direction after crossing a pole', () => {
  expect(horizontalOrbitInputSign(0.56)).toBe(1);
  expect(horizontalOrbitInputSign(Math.PI - 0.56)).toBe(-1);
  expect(horizontalOrbitInputSign(-Math.PI + 0.56)).toBe(-1);
});
import { enterPreparedGame } from './helpers/enterGame';

async function waitForPuzzle(page: import('@playwright/test').Page): Promise<void> {
  await enterPreparedGame(page);
  await page.waitForFunction(
    () => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      return (diagnostics?.frame ?? 0) > 10
        && ((diagnostics?.availableClickTargets?.length ?? 0) > 0
          || diagnostics?.clickTarget !== null);
    },
    null,
    { timeout: 35_000 },
  );
}

test('opening screen preloads the first level before the player enters', async ({ page }) => {
  test.setTimeout(100_000);
  await page.goto('/');
  await expect(page.locator('#start-screen')).toBeVisible();
  await expect(page.locator('#hud')).not.toBeVisible();
  await expect(page.locator('#start-game-button')).toBeDisabled();
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true,
    null,
    { timeout: 90_000 },
  );
  const prepared = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__ ?? null);
  expect(prepared?.opening.active).toBe(true);
  expect(prepared?.opening.progress).toBe(1);
  expect(prepared?.levelId).toBe(1);
  expect(prepared?.totalArrows).toBe(5);
  expect(prepared?.appliances).toHaveLength(5);
  await expect(page.locator('#start-game-button')).toBeEnabled();

  await page.click('#start-game-button');
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.opening.active === false,
    null,
    { timeout: 35_000 },
  );
  await expect(page.locator('#start-screen')).not.toBeVisible();
  await expect(page.locator('#hud')).toBeVisible();
});

test('main puzzle supports unrestricted vertical orbit through its top and bottom', async ({ page }) => {
  // The opening cinematic plus first-time WebGL shader compilation can take
  // longer on software-rendered/low-FPS CI machines. Keep the assertions and
  // interaction sequence unchanged; only give the complete orbit sweep enough
  // wall-clock budget to reach its final direction check.
  test.setTimeout(300_000);
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto('/?level=1');
  await waitForPuzzle(page);

  const canvas = page.locator('#game-canvas');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;

  const centerX = box.x + box.width * 0.5;
  const centerY = box.y + box.height * 0.5;
  const beforeHorizontalOrbit = await page.evaluate(() => ({
    yaw: window.__THREE_GAME_DIAGNOSTICS__!.orbit.yaw,
    orientation: window.__THREE_GAME_DIAGNOSTICS__!.appliances[0].orientationQuaternion,
  }));
  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX + 120, centerY, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(460);
  const afterHorizontalOrbit = await page.evaluate(() => ({
    yaw: window.__THREE_GAME_DIAGNOSTICS__!.orbit.yaw,
    orientation: window.__THREE_GAME_DIAGNOSTICS__!.appliances[0].orientationQuaternion,
  }));
  expect(Math.abs(afterHorizontalOrbit.yaw - beforeHorizontalOrbit.yaw)).toBeGreaterThan(0.5);
  const orientationDot = Math.abs(afterHorizontalOrbit.orientation.reduce(
    (sum, value, index) => sum + value * beforeHorizontalOrbit.orientation[index],
    0,
  ));
  expect(1 - orientationDot).toBeGreaterThan(0.001);

  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX, box.y + 48, { steps: 12 });
  await page.mouse.up();
  await page.waitForFunction(
    () => (window.__THREE_GAME_DIAGNOSTICS__?.orbit.pitch ?? 0) < -1.12,
  );
  await page.waitForTimeout(460);
  const afterUpwardOrbit = await page.evaluate(() => ({
    pitch: window.__THREE_GAME_DIAGNOSTICS__!.orbit.pitch,
    appliancePitch: window.__THREE_GAME_DIAGNOSTICS__!.orbit.appliancePitch,
    applianceUp: window.__THREE_GAME_DIAGNOSTICS__!.appliances.map(
      (appliance) => appliance.screenUpAlignment,
    ),
  }));
  expect(afterUpwardOrbit.pitch).toBeLessThan(-1.12);
  expect(afterUpwardOrbit.appliancePitch).toBeCloseTo(-1.12, 4);
  expect(afterUpwardOrbit.applianceUp.every((alignment) => alignment > 0.55)).toBe(true);

  for (let pass = 0; pass < 2; pass += 1) {
    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    await page.mouse.move(centerX, box.y + box.height - 48, { steps: 14 });
    await page.mouse.up();
    await page.waitForTimeout(80);
  }
  await page.waitForFunction(
    (previousPitch) => {
      const pitch = window.__THREE_GAME_DIAGNOSTICS__?.orbit.pitch ?? previousPitch;
      return pitch > 1.18 && pitch - previousPitch > Math.PI;
    },
    afterUpwardOrbit.pitch,
  );
  await page.waitForTimeout(80);
  const afterDownwardOrbit = await page.evaluate(() => ({
    yaw: window.__THREE_GAME_DIAGNOSTICS__!.orbit.yaw,
    pitch: window.__THREE_GAME_DIAGNOSTICS__!.orbit.pitch,
    appliancePitch: window.__THREE_GAME_DIAGNOSTICS__!.orbit.appliancePitch,
    applianceUp: window.__THREE_GAME_DIAGNOSTICS__!.appliances.map(
      (appliance) => appliance.screenUpAlignment,
    ),
  }));
  expect(afterDownwardOrbit.appliancePitch).toBeCloseTo(1.18, 4);
  expect(afterDownwardOrbit.applianceUp.every((alignment) => alignment > 0.55)).toBe(true);

  const expectedYawDirection = horizontalOrbitInputSign(afterDownwardOrbit.pitch);
  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX + 100, centerY, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(80);
  const flippedYaw = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.orbit.yaw);
  expect(Math.sign(flippedYaw - afterDownwardOrbit.yaw)).toBe(-expectedYawDirection);
  expect(pageErrors).toEqual([]);
});

test('hint button spends three exclamation charges and reveals one zooming beacon', async ({ page }) => {
  // First-load SwiftShader compilation can consume most of the default budget
  // before the three real button interactions begin on Windows CI.
  test.setTimeout(240_000);
  await page.goto('/?level=1');
  await waitForPuzzle(page);

  const hintButton = page.locator('#hint-button');
  await expect(hintButton).toBeVisible();
  await expect(hintButton).toBeEnabled();
  await expect(hintButton.locator('.life-label')).toHaveText('提示');
  await expect(hintButton.locator('.hint-icons i')).toHaveCount(3);
  const symbolStyle = await hintButton.locator('.hint-icons i').first().evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      color: style.color,
      stroke: style.getPropertyValue('-webkit-text-stroke-width'),
      shadow: style.textShadow,
    };
  });
  expect(symbolStyle.color).toBe('rgb(244, 192, 51)');
  expect(symbolStyle.stroke).toBe('4px');
  expect(symbolStyle.shadow).not.toBe('none');

  const before = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  expect(before.availableArrows).toBeGreaterThan(1);
  expect(before.hint.visibleEnds).toBe(0);
  expect(before.hint.remaining).toBe(3);
  expect(before.hint.maximum).toBe(3);

  let revealedTarget: { id: string; end: 'head' | 'tail' } | null = null;
  for (const remaining of [2, 1, 0]) {
    await hintButton.click();
    await page.waitForFunction(
      (expected) => {
        const hint = window.__THREE_GAME_DIAGNOSTICS__?.hint;
        return hint?.target !== null && hint?.visibleEnds === 1 && hint.remaining === expected;
      },
      remaining,
    );
    const revealed = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.hint);
    revealedTarget ??= revealed.target;
    expect(revealed.target).toEqual(revealedTarget);
    await expect(hintButton.locator('.hint-icons i.used')).toHaveCount(3 - remaining);
  }

  await page.waitForFunction(() => {
    const hint = window.__THREE_GAME_DIAGNOSTICS__?.hint;
    return hint?.visibleEnds === 1 && hint.scale > 1.05;
  });
  const revealed = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.hint);
  expect(revealed.visibleEnds).toBe(1);
  expect(revealed.remaining).toBe(0);
  await expect(hintButton).toBeDisabled();

  const canvas = page.locator('#game-canvas');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;
  const centerX = box.x + box.width * 0.5;
  const centerY = box.y + box.height * 0.5;
  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX + 90, centerY, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(460);
  const afterOrbit = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.hint);
  expect(afterOrbit.target).toEqual(revealedTarget);
  expect(afterOrbit.visibleEnds).toBe(1);

  const revisionBeforeReset = await page.evaluate(
    () => window.__THREE_GAME_DIAGNOSTICS__!.puzzleRevision,
  );
  await page.click('#reset-button');
  await page.waitForFunction(
    (revision) => (window.__THREE_GAME_DIAGNOSTICS__?.puzzleRevision ?? revision) > revision,
    revisionBeforeReset,
  );
  const afterReset = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.hint);
  expect(afterReset.remaining).toBe(0);
  expect(afterReset.visibleEnds).toBe(0);
  await expect(hintButton).toBeDisabled();
});

test('main screen exposes the total random challenge pool as a direct entry', async ({ page }) => {
  test.setTimeout(240_000);
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#start-random-button')).toBeDisabled();
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true,
    null,
    { timeout: 90_000 },
  );
  const initialRevision = await page.evaluate(
    () => window.__THREE_GAME_DIAGNOSTICS__?.puzzleRevision ?? 0,
  );
  await expect(page.locator('#start-random-button')).toBeEnabled();
  await expect(page.locator('#start-random-button')).toHaveText('随机挑战');
  await page.click('#challenge-mode-button');
  await page.click('#start-random-button');
  await page.waitForFunction(
    (revision) => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      return diagnostics?.opening.active === false
        && diagnostics.puzzleRevision > revision
        && ['random', 'rush'].includes(diagnostics.mode);
    },
    initialRevision,
    { timeout: 35_000 },
  );
  await expect(page.locator('#start-screen')).not.toBeVisible();
  await page.waitForURL(
    (url) => ['random', 'rush'].includes(url.searchParams.get('mode') ?? '') && !url.searchParams.has('level'),
    { timeout: 90_000 },
  );
  const mode = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.mode ?? null);
  expect(['random', 'rush']).toContain(mode);
  expect(['random', 'rush']).toContain(new URL(page.url()).searchParams.get('mode'));
  expect(new URL(page.url()).searchParams.has('level')).toBe(false);
  expect(pageErrors).toEqual([]);
});

test('a short appliance click stays inert until a long-press drag is activated', async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto('/?level=1');
  await waitForPuzzle(page);
  const canvas = page.locator('#game-canvas');
  const box = await canvas.boundingBox();
  const before = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.appliances[0] ?? null);
  expect(box).not.toBeNull();
  expect(before).not.toBeNull();
  if (!box || !before) return;

  const x = box.x + before.screenX * box.width;
  const y = box.y + before.screenY * box.height;
  await page.mouse.click(x, y);
  await page.waitForTimeout(320);
  const afterClick = await page.evaluate(
    (id) => window.__THREE_GAME_DIAGNOSTICS__?.appliances.find((item) => item.id === id) ?? null,
    before.id,
  );
  expect(afterClick?.screenX).toBeCloseTo(before.screenX, 4);
  expect(afterClick?.screenY).toBeCloseTo(before.screenY, 4);
  expect(afterClick?.dragging).toBe(false);
  expect(afterClick?.dropping).toBe(false);
  expect(afterClick?.deformPull ?? 1).toBeLessThan(0.002);

  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.waitForFunction(
    (id) => window.__THREE_GAME_DIAGNOSTICS__?.appliances.find((item) => item.id === id)?.dragging === true,
    before.id,
    { timeout: 15_000 },
  );
  await page.mouse.up();
  await page.waitForTimeout(320);
  const afterLongClick = await page.evaluate(
    (id) => window.__THREE_GAME_DIAGNOSTICS__?.appliances.find((item) => item.id === id) ?? null,
    before.id,
  );
  expect(afterLongClick?.screenX).toBeCloseTo(before.screenX, 4);
  expect(afterLongClick?.screenY).toBeCloseTo(before.screenY, 4);
  expect(afterLongClick?.dragging).toBe(false);
  expect(afterLongClick?.dropping).toBe(false);
  expect(afterLongClick?.deformPull ?? 1).toBeLessThan(0.002);
});

test('a stale random URL still opens the official first campaign level', async ({ page }) => {
  test.setTimeout(100_000);
  await page.goto('/?seed=42&mode=random');
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true,
    null,
    { timeout: 90_000 },
  );
  const prepared = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__ ?? null);
  expect(prepared?.mode).toBe('campaign');
  expect(prepared?.levelId).toBe(1);
  expect(prepared?.totalArrows).toBe(5);
  expect(prepared?.seed).not.toBe(42);
});

test('connection petals wait for socket contact and the appliance completes its recycle animation', async ({ page }) => {
  test.setTimeout(300_000);
  await page.addInitScript(() => {
    window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 0;
  });
  await page.goto('/?level=1');
  await waitForPuzzle(page);

  const target = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.clickTarget ?? null);
  expect(target).not.toBeNull();
  if (!target) return;

  await page.evaluate(() => {
    const evidence = {
      sawConnection: false,
      petalsBeforeConnection: false,
      petalsDuringConnection: false,
      applianceDuringConnection: false,
      sawPetals: false,
      activated: null as null | { id: string; kind: string; screenX: number; screenY: number },
      sawInflating: false,
      maximumScale: 1,
      maximumPeakCount: 0,
      peakCycles: 0,
      abovePeakThreshold: false,
      replacement: null as null | { id: string; kind: string; dropping: boolean },
      replacementIdle: false,
    };
    const publishEvidence = () => {
      document.documentElement.dataset.connectionEvidence = JSON.stringify(evidence);
    };
    publishEvidence();
    const observe = (diagnostics: NonNullable<Window['__THREE_GAME_DIAGNOSTICS__']>) => {
      if (!diagnostics) return;
      const connectedAppliances = diagnostics.appliances.reduce(
        (sum, appliance) => sum + appliance.connections,
        0,
      );
      if (diagnostics.activeBurstPetals > 0 && !evidence.sawConnection) {
        evidence.petalsBeforeConnection = true;
      }
      if (diagnostics.activeConnections > 0) {
        evidence.sawConnection = true;
        evidence.petalsDuringConnection ||= diagnostics.activeBurstPetals > 0;
        evidence.applianceDuringConnection ||= connectedAppliances > 0;
      }
      evidence.sawPetals ||= diagnostics.activeBurstPetals > 0;
      const activated = diagnostics.appliances.find((appliance) => appliance.connections > 0);
      if (activated && !evidence.activated) {
        evidence.activated = {
          id: activated.id,
          kind: activated.kind,
          screenX: activated.screenX,
          screenY: activated.screenY,
        };
      }
      if (evidence.activated) {
        const activeItem = diagnostics.appliances.find((item) => item.id === evidence.activated?.id);
        if (activeItem?.state === 'inflating') {
          evidence.sawInflating = true;
          evidence.maximumScale = Math.max(evidence.maximumScale, activeItem.lifecycleScale);
          evidence.maximumPeakCount = Math.max(evidence.maximumPeakCount, activeItem.inflationPeakCount);
          const above = activeItem.lifecycleScale > 1.055;
          if (above && !evidence.abovePeakThreshold) evidence.peakCycles += 1;
          evidence.abovePeakThreshold = above;
        }
        if (!evidence.replacement) {
          const replacement = diagnostics.appliances.find((item) =>
            item.id !== evidence.activated?.id
            && Math.abs(item.screenX - evidence.activated!.screenX) < 0.01
            && Math.abs(item.screenY - evidence.activated!.screenY) < 0.01
            && item.state === 'spawning');
          if (replacement) {
            evidence.replacement = {
              id: replacement.id,
              kind: replacement.kind,
              dropping: replacement.dropping,
            };
          }
        }
      }
      if (evidence.replacement) {
        const replacement = diagnostics.appliances.find((item) => item.id === evidence.replacement?.id);
        evidence.replacementIdle ||= replacement?.state === 'idle' && replacement.dropping === false;
      }
      publishEvidence();
    };
    const sample = () => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      if (diagnostics) observe(diagnostics);
      requestAnimationFrame(sample);
    };
    sample();
  });
  const routedMotionState = await page.evaluate(({ id, end }) => {
    const pulled = window.__PULL_CABLE_FOR_EVIDENCE__?.(id, end) ?? false;
    window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = undefined;
    if (!pulled) return null;
    return window.__THREE_GAME_DIAGNOSTICS__?.activeMotion ?? null;
  }, target);
  expect(routedMotionState?.kind).toBe('exit');
  expect(routedMotionState?.targetAccent).toBe(routedMotionState?.color);
  await page.waitForFunction(
    () => JSON.parse(document.documentElement.dataset.connectionEvidence ?? '{}').sawConnection === true,
    null,
    { timeout: 90_000 },
  );
  await page.waitForFunction(
    () => {
      const evidence = JSON.parse(document.documentElement.dataset.connectionEvidence ?? '{}');
      return evidence.sawPetals === true
        && evidence.sawInflating === true
        && evidence.maximumScale > 1.12;
    },
    null,
    { timeout: 90_000 },
  );
  await page.waitForFunction(
    () => JSON.parse(document.documentElement.dataset.connectionEvidence ?? '{}').replacementIdle === true,
    null,
    { timeout: 90_000 },
  );
  const evidence = await page.evaluate(() =>
    JSON.parse(document.documentElement.dataset.connectionEvidence ?? '{}'),
  );
  expect(evidence.petalsBeforeConnection).toBe(false);
  expect(evidence.petalsDuringConnection).toBe(false);
  expect(evidence.applianceDuringConnection).toBe(false);
  expect(evidence.activated).not.toBeNull();
  expect(evidence.maximumScale).toBeGreaterThan(1.12);
  expect(evidence.peakCycles).toBe(1);
  expect(evidence.maximumPeakCount).toBe(1);
  const replacementState = evidence.replacement as null | { id: string; kind: string; dropping: boolean };
  expect(replacementState).not.toBeNull();
  expect(replacementState?.kind).not.toBe(evidence.activated.kind);
  expect(replacementState?.dropping).toBe(true);
  const routing = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.routing ?? null);
  expect(routing?.allRequiredCovered).toBe(true);
  expect(routing?.requiredColors.every((color) => routing.coveredColors.includes(color))).toBe(true);
});

test('loading overlay blocks play immediately and the next-level button keeps readable contrast', async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto('/?level=1');
  await waitForPuzzle(page);

  await page.evaluate(() => {
    const panel = document.querySelector<HTMLElement>('#complete-panel');
    panel?.classList.add('visible');
    panel?.setAttribute('aria-hidden', 'false');
  });
  const continueButton = page.locator('#continue-button');
  await continueButton.hover();
  await page.waitForTimeout(180);
  const colors = await continueButton.evaluate((element) => {
    const style = getComputedStyle(element);
    return { color: style.color, background: style.backgroundColor };
  });
  expect(colors.color).toBe('rgb(255, 250, 240)');
  expect(colors.background).toBe('rgb(173, 63, 77)');

  const nextTransition = await continueButton.evaluate((element) => {
    const button = element as HTMLButtonElement;
    button.click();
    const loader = document.querySelector<HTMLElement>('#puzzle-loader');
    const app = document.querySelector<HTMLElement>('#app');
    return {
      visible: loader?.classList.contains('visible') ?? false,
      busy: app?.getAttribute('aria-busy'),
      disabled: button.disabled,
      pointerEvents: loader ? getComputedStyle(loader).pointerEvents : '',
    };
  });
  expect(nextTransition).toEqual({
    visible: true,
    busy: 'true',
    disabled: true,
    pointerEvents: 'auto',
  });
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.levelId === 2,
    null,
    { timeout: 25_000 },
  );

  const randomTransition = await page.locator('#new-button').evaluate((element) => {
    const button = element as HTMLButtonElement;
    button.click();
    const loader = document.querySelector<HTMLElement>('#puzzle-loader');
    const app = document.querySelector<HTMLElement>('#app');
    return {
      visible: loader?.classList.contains('visible') ?? false,
      busy: app?.getAttribute('aria-busy'),
      disabled: button.disabled,
      pointerEvents: loader ? getComputedStyle(loader).pointerEvents : '',
    };
  });
  expect(randomTransition).toEqual({
    visible: true,
    busy: 'true',
    disabled: true,
    pointerEvents: 'auto',
  });
});

test('random challenge never exposes appliances before their final layout is committed', async ({ page }) => {
  test.setTimeout(240_000);
  await page.goto('/?level=1');
  await waitForPuzzle(page);

  const exposedFrames = await page.evaluate(async () => {
    const startingRevision = window.__THREE_GAME_DIAGNOSTICS__?.puzzleRevision ?? 0;
    document.querySelector<HTMLButtonElement>('#new-button')?.click();
    const exposed: Array<{ count: number; positions: string[] }> = [];
    const startedAt = performance.now();

    while (performance.now() - startedAt < 30_000) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      if (!diagnostics) continue;
      const loaderVisible = document.querySelector('#puzzle-loader')?.classList.contains('visible') ?? false;
      const positions = diagnostics.appliances.map(
        (item) => `${item.screenX.toFixed(3)},${item.screenY.toFixed(3)}`,
      );
      const uniquePositions = new Set(positions);
      if (
        loaderVisible &&
        diagnostics.sceneVisibility.appliances &&
        diagnostics.appliances.length > 0 &&
        uniquePositions.size === 1 &&
        positions[0] === '0.100,0.500'
      ) {
        exposed.push({ count: diagnostics.appliances.length, positions });
      }
      if (
        diagnostics.puzzleRevision > startingRevision &&
        !loaderVisible &&
        diagnostics.clickTarget !== null
      ) break;
    }
    return exposed;
  });

  expect(exposedFrames).toEqual([]);
});

test('language toggle updates the visible flow and home returns to the reusable opening scene', async ({ page }) => {
  test.setTimeout(240_000);
  await page.goto('/?level=1');
  await waitForPuzzle(page);

  await page.click('#language-button');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('#home-button')).toHaveText('HOME');
  await expect(page.locator('#status-line')).toContainText('Find a plug cable');

  await page.click('#home-button');
  await expect(page.locator('#start-screen')).toBeVisible();
  await expect(page.locator('#start-screen-title')).toContainText('Sakura Cable Room');
  await expect(page.locator('#hud')).not.toBeVisible();
  expect(await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.opening.active)).toBe(true);

  await page.click('#start-game-button');
  await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.opening.active === false);
  await expect(page.locator('#hud')).toBeVisible();

  await page.click('#language-button');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page.locator('#home-button')).toHaveText('主界面');
});

test('random challenge has three hearts and each blocked cable costs one life', async ({ page }) => {
  test.setTimeout(240_000);
  await page.goto('/?seed=42&mode=random&direct=1');
  await waitForPuzzle(page);
  await expect(page.locator('#random-lives')).toBeVisible();
  await expect(page.locator('#hint-button')).toBeVisible();
  expect(await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.hint.remaining)).toBe(3);
  const livesBox = await page.locator('#random-lives').boundingBox();
  const hintBox = await page.locator('#hint-button').boundingBox();
  expect(livesBox).not.toBeNull();
  expect(hintBox).not.toBeNull();
  if (livesBox && hintBox) expect(hintBox.x).toBeGreaterThan(livesBox.x + livesBox.width);
  expect(await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.randomLives)).toBe(3);

  for (const expectedLives of [2, 1, 0]) {
    const target = await page.waitForFunction(
      () => window.__THREE_GAME_DIAGNOSTICS__?.blockedClickTarget ?? null,
      null,
      { timeout: 10_000 },
    );
    const point = await target.jsonValue();
    if (!point) throw new Error('No visible blocked cable target found');
    await page.locator('#game-canvas').click({ position: { x: point.x, y: point.y } });
    await page.waitForFunction(
      (lives) => window.__THREE_GAME_DIAGNOSTICS__?.randomLives === lives,
      expectedLives,
      { timeout: 5_000 },
    );
    if (expectedLives > 0) {
      await page.waitForFunction(
        () => (window.__THREE_GAME_DIAGNOSTICS__?.activeAnimations ?? 0) === 0,
        null,
        { timeout: 5_000 },
      );
    }
  }

  expect(await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.randomGameOver)).toBe(true);
  await expect(page.locator('#game-over-panel')).toBeVisible();
  await expect(page.locator('#random-lives i.lost')).toHaveCount(3);
});

test('different random seeds shuffle colours and unique appliances across screen slots', async ({ browser }) => {
  test.setTimeout(420_000);
  const capture = async (seed: number) => {
    // A full navigation retires both a generator worker and a WebGL context.
    // Isolate each seed in its own page so teardown from the first random game
    // cannot delay the second game's readiness signal.
    const page = await browser.newPage();
    try {
      await page.goto(`/?seed=${seed}&mode=random&direct=1`);
      await page.waitForFunction(
        () => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true,
        null,
        { timeout: 90_000 },
      );
      if (await page.locator('#start-game-button').isVisible()) {
        await page.click('#start-game-button');
      }
      await page.waitForFunction(
        () => {
          const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
          return diagnostics?.opening.active === false
            && diagnostics.sceneVisibility.appliances === true
            && diagnostics.appliances.length > 0;
        },
        null,
        { timeout: 150_000 },
      );
      await page.waitForFunction(
        (expectedSeed) => window.__THREE_GAME_DIAGNOSTICS__?.seed === expectedSeed,
        seed,
        { timeout: 60_000 },
      );
      return page.evaluate(() => {
        const appliances = [...(window.__THREE_GAME_DIAGNOSTICS__?.appliances ?? [])]
          .sort((left, right) => left.screenX - right.screenX || left.screenY - right.screenY);
        return {
          kinds: appliances.map((item) => item.kind),
          colors: appliances.map((item) => item.accent),
        };
      });
    } finally {
      await page.close();
    }
  };

  const first = await capture(42);
  const second = await capture(314159);
  expect(new Set(first.kinds).size).toBe(first.kinds.length);
  expect(new Set(second.kinds).size).toBe(second.kinds.length);
  expect(first.kinds).not.toEqual(second.kinds);
  expect(first.colors).not.toEqual(second.colors);
});

import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { ApplianceScene, type ApplianceTarget } from '../src/systems/ApplianceScene';
import { APPLIANCE_CATALOG } from '../src/systems/ApplianceCatalog';
import { enterPreparedGame } from './helpers/enterGame';

test('same-colour cables reserve only real same-colour appliances and spread across free duplicates', () => {
  const yellow = 0xffc857;
  const blue = 0x5f9ee8;
  const first = APPLIANCE_CATALOG[0];
  const second = APPLIANCE_CATALOG.find((definition) => (
    definition.id !== first.id && definition.plugStyleId === first.plugStyleId
  ));
  const third = APPLIANCE_CATALOG.find((definition) => (
    definition.id !== first.id && definition.id !== second?.id
  ));
  expect(second).toBeTruthy();
  expect(third).toBeTruthy();
  if (!second || !third) return;

  const scene = new ApplianceScene();
  scene.configure(0x12345678, [first, second, third], [yellow, yellow, blue]);
  scene.setRequiredColors([yellow, blue]);

  expect(scene.canAssignColor(yellow)).toBe(true);
  expect(scene.canAssignColor(0xff5575)).toBe(false);
  const firstReservation = scene.reserveAssignment('yellow-a', yellow);
  const secondReservation = scene.reserveAssignment('yellow-b', yellow);
  expect(firstReservation?.accent).toBe(yellow);
  expect(secondReservation?.accent).toBe(yellow);
  expect(secondReservation).not.toBe(firstReservation);
  expect(scene.canAssignColor(yellow)).toBe(false);

  firstReservation?.activate(yellow);
  expect(scene.canAssignColor(yellow)).toBe(false);
  expect(scene.canQueueColor(yellow)).toBe(true);
  expect(scene.reserveAssignment('yellow-a', yellow)).toBe(firstReservation);
  const thirdReservation = scene.reserveAssignment('yellow-c', yellow);
  expect(thirdReservation).toBeNull();
  expect(scene.canQueueColor(yellow)).toBe(true);
  expect(scene.getRoutingSummary()).toMatchObject({
    requiredColors: [yellow, blue],
    allRequiredCovered: true,
  });
  scene.dispose();
});

test('a busy same-colour appliance is never reused for a second reservation', () => {
  const yellow = 0xffc857;
  const blue = 0x5f9ee8;
  const scene = new ApplianceScene();
  scene.configure(0x55aa11, APPLIANCE_CATALOG.slice(0, 2), [yellow, blue]);
  scene.setRequiredColors([yellow, yellow, blue]);
  const first = scene.reserveAssignment('yellow-a', yellow);
  expect(first).toBeTruthy();
  first?.activate(yellow);
  expect(scene.reserveAssignment('yellow-b', yellow)).toBeNull();
  expect(scene.canQueueColor(yellow)).toBe(true);
  scene.dispose();
});

test('a second same-colour cable can exit while the first is moving and then waits in the queue', async ({ page }) => {
  test.setTimeout(240_000);
  await page.addInitScript(() => {
    window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 0;
  });
  await page.goto('/?seed=42&mode=random&direct=1');
  await enterPreparedGame(page);

  const pair = await page.waitForFunction(
    () => {
      const candidates = window.__THREE_GAME_DIAGNOSTICS__?.availableClickTargets ?? [];
      const first = candidates.find((candidate) => candidate.id === 'arrow-1');
      if (!first) return null;
      const second = candidates.find((candidate) => (
        candidate.id !== first.id && candidate.color === first.color
      ));
      return second ? { first, second } : null;
    },
    null,
    { timeout: 10_000 },
  );
  const targets = await pair.jsonValue();
  if (!targets) throw new Error('Expected the deterministic same-colour cable pair.');
  await page.evaluate(({ first, second }) => {
    // Dispatch both validated clicks in one page task so SwiftShader cannot
    // render enough slow frames between Playwright round-trips to finish the
    // first exit before the second click reaches the queueing path.
    const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');
    if (!canvas) throw new Error('Missing game canvas.');
    for (const target of [first, second]) {
      canvas.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        clientX: target.x,
        clientY: target.y,
      }));
    }
  }, targets);

  await expect.poll(
    async () => page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.activeAnimations ?? 0),
    { timeout: 8_000 },
  ).toBeGreaterThanOrEqual(2);
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.queuedConnections === 1,
    null,
    { timeout: 60_000 },
  );
  const queued = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__ ?? null);
  expect(queued?.remainingArrows).toBe(queued ? queued.totalArrows - 1 : -1);
  expect(queued?.routing.reservations).toHaveLength(1);
  await page.evaluate(() => {
    document.documentElement.dataset.queuedResumeEvidence = JSON.stringify({
      resumed: false,
    });
    const observe = (diagnostics: NonNullable<Window['__THREE_GAME_DIAGNOSTICS__']>) => {
      if (diagnostics?.queuedConnections === 0
        && diagnostics.remainingArrows === diagnostics.totalArrows - 2
        && diagnostics.activeConnections > 0) {
        document.documentElement.dataset.queuedResumeEvidence = JSON.stringify({
          resumed: true,
        });
      }
    };
    const sample = () => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      if (diagnostics) observe(diagnostics);
      requestAnimationFrame(sample);
    };
    sample();
  });
  const settled = await page.evaluate(() => window.__SETTLE_APPLIANCE_FOR_EVIDENCE__?.() ?? false);
  expect(settled).toBe(true);
  await page.waitForFunction(
    () => JSON.parse(document.documentElement.dataset.queuedResumeEvidence ?? '{}').resumed === true,
    null,
    { timeout: 30_000 },
  );
});

test('reset restores the configured appliance colours after replacements', () => {
  const yellow = 0xffc857;
  const blue = 0x5f9ee8;
  const definitions = APPLIANCE_CATALOG.slice(0, 3);
  const scene = new ApplianceScene();
  scene.configure(0x2468ace0, definitions, [yellow, yellow, blue]);
  const configuredColors = scene.targets.map((target) => target.accent);
  const configuredKinds = scene.targets.map((target) => target.kind);
  scene.setRequiredColors([blue]);

  const camera = new THREE.PerspectiveCamera(26, 16 / 9, 0.1, 100);
  camera.position.set(0, 0, 13.6);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld(true);
  const replaceTarget = (scene as unknown as {
    replaceTarget(
      previous: ApplianceTarget,
      camera: THREE.PerspectiveCamera,
      screenDepth: number,
      now: number,
    ): void;
  }).replaceTarget.bind(scene);

  for (let index = 0; index < 2; index += 1) {
    const target = scene.targets.find((candidate) => candidate.accent === yellow);
    expect(target).toBeTruthy();
    if (target) replaceTarget(target, camera, 18.8, index);
  }
  expect(scene.getRoutingSummary().coveredColors).not.toContain(yellow);

  scene.reset();
  scene.setRequiredColors([yellow, blue]);
  expect(scene.targets.map((target) => target.accent)).toEqual(configuredColors);
  expect(scene.targets.map((target) => target.kind)).toEqual(configuredKinds);
  expect(scene.getRoutingSummary()).toMatchObject({
    allRequiredCovered: true,
  });
  scene.clear();
  expect(scene.targets).toHaveLength(0);
  scene.dispose();
});

test('different random seeds shuffle appliance colours across screen slots', () => {
  const colors = [
    0xffc857,
    0x5f9ee8,
    0xff5575,
    0x4fc7b2,
    0xa987e8,
    0xff8f4f,
    0x8dc95f,
    0xd47ab1,
  ];
  const definitions = APPLIANCE_CATALOG.slice(0, 8);
  const first = new ApplianceScene();
  const second = new ApplianceScene();
  first.configure(0x11111111, definitions, colors);
  second.configure(0x22222222, definitions, colors);
  expect(first.targets.map((target) => target.accent))
    .not.toEqual(second.targets.map((target) => target.accent));
  first.dispose();
  second.dispose();
});

test('replacement avoids two-appliance slot loops while keeping every appliance unique', () => {
  const ids = [
    'washer',
    'dehumidifier',
    'desktop-computer',
    'lamp',
    'radio',
    'toaster',
    'kettle',
    'phone',
  ];
  const definitions = ids.map((id) => APPLIANCE_CATALOG.find((candidate) => candidate.id === id)!);
  const colors = [
    0xffc857,
    0x5f9ee8,
    0xff5575,
    0x4fc7b2,
    0xa987e8,
    0xff8f4f,
    0x8dc95f,
    0xd47ab1,
  ];
  const scene = new ApplianceScene();
  scene.configure(0x31415926, definitions, colors);
  scene.setRequiredColors(colors);
  const camera = new THREE.PerspectiveCamera(26, 16 / 9, 0.1, 100);
  camera.position.set(0, 0, 13.6);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld(true);
  const replaceTarget = (scene as unknown as {
    replaceTarget(
      previous: ApplianceTarget,
      camera: THREE.PerspectiveCamera,
      screenDepth: number,
      now: number,
    ): void;
  }).replaceTarget.bind(scene);
  const seen = new Set<string>();
  for (let index = 0; index < 10; index += 1) {
    replaceTarget(scene.targets[0], camera, 18.8, index);
    scene.targets[0].root.visible = true;
    seen.add(scene.targets[0].kind);
    expect(new Set(scene.targets.map((target) => target.kind)).size).toBe(scene.targets.length);
  }
  expect(seen.size).toBeGreaterThanOrEqual(6);
  scene.dispose();
});

test('replacing one appliance preserves every other appliance instance', () => {
  const colors = [0xffc857, 0x5f9ee8, 0xff5575, 0x4fc7b2];
  const scene = new ApplianceScene();
  scene.configure(0x1234abcd, APPLIANCE_CATALOG.slice(0, 4), colors);
  scene.setRequiredColors(colors);
  const previous = scene.targets[0];
  const otherTargets = scene.targets.slice(1);
  const camera = new THREE.PerspectiveCamera(26, 16 / 9, 0.1, 100);
  camera.position.set(0, 0, 13.6);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld(true);
  (scene as unknown as {
    replaceTarget(
      previous: ApplianceTarget,
      camera: THREE.PerspectiveCamera,
      screenDepth: number,
      now: number,
    ): void;
  }).replaceTarget(previous, camera, 18.8, 0);

  expect(scene.targets[0]).not.toBe(previous);
  otherTargets.forEach((target, index) => {
    expect(scene.targets[index + 1]).toBe(target);
  });
  scene.dispose();
});

test('a replacement keeps a uniquely covered colour without changing another appliance', () => {
  const colors = [0xffc857, 0x5f9ee8, 0xff5575, 0x4fc7b2];
  const scene = new ApplianceScene();
  scene.configure(0x27182818, APPLIANCE_CATALOG.slice(0, 4), colors);
  scene.setRequiredColors(colors);
  const previousColor = scene.targets[0].accent;
  const otherTargets = scene.targets.slice(1);
  const camera = new THREE.PerspectiveCamera(26, 16 / 9, 0.1, 100);
  camera.position.set(0, 0, 13.6);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld(true);
  (scene as unknown as {
    replaceTarget(
      previous: ApplianceTarget,
      camera: THREE.PerspectiveCamera,
      screenDepth: number,
      now: number,
    ): void;
  }).replaceTarget(scene.targets[0], camera, 18.8, 0);
  expect(scene.targets[0].accent).toBe(previousColor);
  otherTargets.forEach((target, index) => {
    expect(scene.targets[index + 1]).toBe(target);
  });
  expect(scene.getRoutingSummary().allRequiredCovered).toBe(true);
  scene.dispose();
});

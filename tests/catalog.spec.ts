import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { PLUG_HEAD_ENVELOPE, PLUG_STYLE_IDS, measurePlugStyle } from '../src/render/PlugParts';
import { APPLIANCE_CATALOG, selectAppliancesForSeed } from '../src/systems/ApplianceCatalog';
import { applianceSeedForPuzzle } from '../src/puzzle/levels';
import { appliancePresentation } from '../src/systems/AppliancePresentation';
import { enterPreparedGame } from './helpers/enterGame';
import { addHullOutline } from '../src/style/outline';
import {
  drivePoweredAnimation,
  POWERED_ACTIVE_DURATION,
  PRINTER_POWERED_ACTIVE_DURATION,
  POWERED_WIND_DOWN_DURATION,
  poweredActiveDuration,
  poweredAnimationState,
  poweredPreviewCycleDuration,
} from '../src/appliances/poweredAnimation';
import {
  SoftDeformController,
  softCageDeformPoint,
  softDeformWeightAtPoint,
  softGrabProfile,
  softReboundProfile,
} from '../src/systems/SoftDeformController';

test('game and gallery share the same powered animation clock', () => {
  expect(poweredAnimationState(-1)).toEqual({ time: 0, power: 1, active: true });
  const windDownStart = poweredAnimationState(POWERED_ACTIVE_DURATION - POWERED_WIND_DOWN_DURATION);
  expect(windDownStart.time).toBe(POWERED_ACTIVE_DURATION - POWERED_WIND_DOWN_DURATION);
  expect(windDownStart.power).toBeCloseTo(1, 12);
  expect(windDownStart.active).toBe(true);
  expect(poweredAnimationState(POWERED_ACTIVE_DURATION)).toEqual({
    time: POWERED_ACTIVE_DURATION,
    power: 0,
    active: false,
  });

  const calls: Array<['update' | 'stop', number, number?]> = [];
  const animation = {
    update: (time: number, power: number) => calls.push(['update', time, power]),
    stop: () => calls.push(['stop', 0]),
    signal: () => 0,
  };
  drivePoweredAnimation(animation, 1.25);
  drivePoweredAnimation(animation, POWERED_ACTIVE_DURATION);
  expect(calls).toEqual([
    ['update', 1.25, 1],
    ['stop', 0],
  ]);

  expect(poweredActiveDuration('printer')).toBe(PRINTER_POWERED_ACTIVE_DURATION);
  expect(PRINTER_POWERED_ACTIVE_DURATION).toBeGreaterThan(POWERED_ACTIVE_DURATION);
  expect(poweredAnimationState(POWERED_ACTIVE_DURATION, 'printer').active).toBe(true);
  expect(poweredAnimationState(PRINTER_POWERED_ACTIVE_DURATION, 'printer')).toEqual({
    time: PRINTER_POWERED_ACTIVE_DURATION,
    power: 0,
    active: false,
  });
  expect(poweredPreviewCycleDuration('printer'))
    .toBeGreaterThan(PRINTER_POWERED_ACTIVE_DURATION);
});

test('soft deformation keeps front and interior layers coupled along the viewing depth', () => {
  const grab = new THREE.Vector3(0, 0, 0);
  const viewDepth = new THREE.Vector3(0, 0, 1);
  const shellWeight = softDeformWeightAtPoint(new THREE.Vector3(0, 0, 0), grab, 1, viewDepth);
  const interiorWeight = softDeformWeightAtPoint(new THREE.Vector3(0, 0, -0.35), grab, 1, viewDepth);
  expect(Math.abs(shellWeight - interiorWeight)).toBeLessThan(0.01);
  expect(interiorWeight).toBeGreaterThanOrEqual(0.55);
});

test('broad face centres use a shared cage with a visibly stronger surface-to-back bend', () => {
  const bounds = new THREE.Box3(
    new THREE.Vector3(-1, -1.5, -0.5),
    new THREE.Vector3(1, 1.5, 0.5),
  );
  const profile = softGrabProfile(
    new THREE.Vector3(1, 0, 0),
    bounds,
    new THREE.Vector3(1, 0, 0),
  );

  expect(profile.centerFactor).toBeGreaterThan(0.9);
  expect(profile.indentStrength).toBeGreaterThan(0.35);
  expect(profile.wholeCoupling).toBeLessThan(0.55);
  expect(profile.localGain).toBeGreaterThan(1.05);
});

test('corner grabs increase cage surface gain without splitting the model into local patches', () => {
  const bounds = new THREE.Box3(
    new THREE.Vector3(-1, -1.5, -0.5),
    new THREE.Vector3(1, 1.5, 0.5),
  );
  const centre = softGrabProfile(
    new THREE.Vector3(1, 0, 0),
    bounds,
    new THREE.Vector3(1, 0, 0),
  );
  const corner = softGrabProfile(
    new THREE.Vector3(1, 1.45, 0.48),
    bounds,
    new THREE.Vector3(1, 0, 0),
  );

  expect(corner.cornerFactor).toBeGreaterThan(0.9);
  expect(corner.localGain).toBeGreaterThan(1.2);
  expect(corner.localGain).toBeGreaterThan(centre.localGain);
  expect(corner.radiusScale).toBe(centre.radiusScale);
  expect(corner.indentStrength).toBeGreaterThan(0.2);
  expect(corner.indentStrength).toBeLessThan(centre.indentStrength);
});

test('face-centre deformation falls off from the cursor toward both sides', () => {
  const grab = new THREE.Vector3(0, 0, 0);
  const centreWeight = softDeformWeightAtPoint(
    new THREE.Vector3(0, 0, 0),
    grab,
    1,
    new THREE.Vector3(0, 0, 1),
  );
  const midWeight = softDeformWeightAtPoint(
    new THREE.Vector3(0.48, 0, 0),
    grab,
    1,
    new THREE.Vector3(0, 0, 1),
  );
  const edgeWeight = softDeformWeightAtPoint(
    new THREE.Vector3(0.96, 0, 0),
    grab,
    1,
    new THREE.Vector3(0, 0, 1),
  );

  expect(centreWeight).toBeGreaterThan(midWeight);
  expect(midWeight).toBeGreaterThan(edgeWeight);
  expect(edgeWeight).toBeCloseTo(0.48, 1);
});

test('shared cage deformation keeps disconnected parts ordered through the compressed depth', () => {
  const bounds = new THREE.Box3(
    new THREE.Vector3(-1, -1, -0.5),
    new THREE.Vector3(1, 1, 0.5),
  );
  const parameters = {
    surfaceNormalLocal: new THREE.Vector3(0, 0, 1),
    pullLocal: new THREE.Vector3(0.2, -0.1, -0.12),
    pullRatio: 0.8,
    wholeCoupling: 0.48,
    localGain: 1.08,
    indentStrength: 0.38,
  };
  const back = softCageDeformPoint(new THREE.Vector3(0, 0, -0.5), bounds, parameters);
  const middle = softCageDeformPoint(new THREE.Vector3(0, 0, 0), bounds, parameters);
  const front = softCageDeformPoint(new THREE.Vector3(0, 0, 0.5), bounds, parameters);
  const frontOffset = softCageDeformPoint(new THREE.Vector3(0.7, 0, 0.5), bounds, parameters);

  expect(back.z).toBeLessThan(middle.z);
  expect(middle.z).toBeLessThan(front.z);
  expect(front.z - frontOffset.z).toBeCloseTo(0, 3);
});

test('full cage pull visibly compresses depth and bulges the silhouette', () => {
  const bounds = new THREE.Box3(
    new THREE.Vector3(-1, -1, -0.5),
    new THREE.Vector3(1, 1, 0.5),
  );
  const parameters = {
    surfaceNormalLocal: new THREE.Vector3(0, 0, 1),
    pullLocal: new THREE.Vector3(0.8, 0, 0),
    pullRatio: 1,
    wholeCoupling: 0.48,
    localGain: 1.08,
    indentStrength: 0.38,
  };
  const back = softCageDeformPoint(new THREE.Vector3(0, 0, -0.5), bounds, parameters);
  const front = softCageDeformPoint(new THREE.Vector3(0, 0, 0.5), bounds, parameters);
  const left = softCageDeformPoint(new THREE.Vector3(-1, 0, 0), bounds, parameters);
  const right = softCageDeformPoint(new THREE.Vector3(1, 0, 0), bounds, parameters);

  expect(front.z - back.z).toBeLessThanOrEqual(0.75);
  expect(right.x - left.x).toBeGreaterThanOrEqual(2.2);
});

test('soft deformation keeps every appliance part topology unchanged', () => {
  const root = new THREE.Group();
  const geometry = new THREE.BoxGeometry(2, 3, 1);
  const mesh = new THREE.Mesh(geometry, new THREE.MeshToonMaterial());
  root.add(mesh);
  root.updateMatrixWorld(true);
  const originalVertexCount = geometry.getAttribute('position').count;
  const controller = new SoftDeformController(root);

  controller.begin(
    new THREE.Vector3(1, 0, 0),
    2,
    1,
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(1, 0, 0),
  );

  expect(geometry.getAttribute('position').count).toBe(originalVertexCount);
});

test('inverted hull outlines never write depth over deforming appliance surfaces', () => {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshToonMaterial(),
  );
  const outline = addHullOutline(mesh);

  expect((outline.material as THREE.ShaderMaterial).depthWrite).toBe(false);
});

test('soft rebound strength grows progressively with pull distance', () => {
  const near = softReboundProfile(0.2, 1);
  const middle = softReboundProfile(0.6, 1);
  const far = softReboundProfile(1, 1);

  expect(near.response).toBeLessThan(0.08);
  expect(near.damping).toBeGreaterThan(14);
  expect(near.snapGain).toBeLessThan(0.2);
  expect(middle.response).toBeGreaterThan(near.response);
  expect(middle.damping).toBeLessThan(near.damping);
  expect(far.response).toBe(1);
  expect(far.stiffness).toBe(205);
  expect(far.damping).toBeCloseTo(3.15);
  expect(far.snapGain).toBeCloseTo(2.2);
});

test('all seven plug styles stay inside the shared visual envelope', () => {
  for (const styleId of PLUG_STYLE_IDS) {
    const bounds = measurePlugStyle(styleId);
    expect(bounds.min.x, `${styleId} min x`).toBeGreaterThanOrEqual(-PLUG_HEAD_ENVELOPE.maxRadius - 1e-4);
    expect(bounds.max.x, `${styleId} max x`).toBeLessThanOrEqual(PLUG_HEAD_ENVELOPE.maxRadius + 1e-4);
    expect(bounds.min.z, `${styleId} min z`).toBeGreaterThanOrEqual(-PLUG_HEAD_ENVELOPE.maxRadius - 1e-4);
    expect(bounds.max.z, `${styleId} max z`).toBeLessThanOrEqual(PLUG_HEAD_ENVELOPE.maxRadius + 1e-4);
    expect(bounds.min.y, `${styleId} min y`).toBeGreaterThanOrEqual(-1e-4);
    expect(bounds.max.y, `${styleId} max y`).toBeLessThanOrEqual(PLUG_HEAD_ENVELOPE.maxLength + 1e-4);
  }
});

test('twenty seeds produce distinct balanced appliance sets', () => {
  const seen = new Set<string>();
  for (let seed = 1; seed <= 20; seed += 1) {
    const selection = selectAppliancesForSeed(seed);
    const counts = { S: 0, M: 0, L: 0, XL: 0 };
    selection.forEach((item) => {
      counts[item.sizeTier] += 1;
      seen.add(item.id);
    });
    expect(selection).toHaveLength(8);
    expect(new Set(selection.map((item) => item.id)).size).toBe(8);
    expect(counts.S).toBe(2);
    expect(counts.M).toBe(4);
    expect(counts.L + counts.XL).toBe(2);
  }
  expect(seen.size).toBe(APPLIANCE_CATALOG.length);
});

test('campaign levels keep deterministic but different appliance casts', () => {
  const seed = 2654435761;
  const firstSeed = applianceSeedForPuzzle(seed, 1);
  const secondSeed = applianceSeedForPuzzle(seed, 2);
  const first = selectAppliancesForSeed(firstSeed).map((item) => item.id);
  const repeated = selectAppliancesForSeed(firstSeed).map((item) => item.id);
  const second = selectAppliancesForSeed(secondSeed).map((item) => item.id);
  expect(first).toEqual(repeated);
  expect(second).not.toEqual(first);
});

test('flat appliances use the top-readable presentation preset', () => {
  expect(appliancePresentation('robot-vacuum')).toBe('top-three-quarter');
  expect(appliancePresentation('induction-cooktop')).toBe('top-three-quarter');
  expect(appliancePresentation('record-player')).toBe('top-three-quarter');
  expect(appliancePresentation('refrigerator')).toBe('front-three-quarter');
  expect(appliancePresentation('television')).toBe('front-three-quarter');
});

test('default seed exposes varied plug forms and keeps initial appliances out of the centre', async ({ browser }) => {
  test.setTimeout(600_000);
  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 1600, height: 900 },
    { width: 1920, height: 1080 },
  ]) {
    // A full navigation tears down a generator worker and a WebGL context.
    // Give each responsive viewport its own page so a retiring worker from the
    // previous navigation cannot delay the next readiness signal.
    const page = await browser.newPage({ viewport });
    try {
      await page.goto('/?seed=2679418801&mode=random&direct=1');
      await enterPreparedGame(page);
      await page.waitForFunction(
        () =>
          window.__THREE_GAME_DIAGNOSTICS__?.seed === 2679418801 &&
          window.__THREE_GAME_DIAGNOSTICS__?.appliances.length === 8,
      );
      const appliances = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.appliances ?? []);
      expect(appliances).toHaveLength(8);
      expect(new Set(appliances.map((item) => item.plugStyleId)).size).toBeGreaterThanOrEqual(4);
      for (const item of appliances) {
        const minX = item.screenX - item.screenWidth * 0.5;
        const maxX = item.screenX + item.screenWidth * 0.5;
        expect(maxX <= 0.25 + 1e-4 || minX >= 0.75 - 1e-4, `${item.id} at ${viewport.width}`).toBe(true);
        expect(minX).toBeGreaterThan(0);
        expect(maxX).toBeLessThan(1);
      }
    } finally {
      await page.close();
    }
  }
});

test('appliance gallery exposes all models with a live orbitable WebGL preview', async ({ page }) => {
  test.setTimeout(720_000);
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto('/?seed=2679418801');
  await enterPreparedGame(page);
  await page.click('#appliance-gallery-button');
  await expect(page.locator('#appliance-gallery')).toHaveAttribute('aria-hidden', 'false');
  const buttons = page.locator('.appliance-gallery-list button');
  await expect(buttons).toHaveCount(APPLIANCE_CATALOG.length);

  for (const definition of APPLIANCE_CATALOG) {
    await page.locator(`[data-appliance-kind="${definition.id}"]`).evaluate((button: HTMLButtonElement) => button.click());
    await page.waitForFunction(
      (kind) => {
        const diagnostics = window.__APPLIANCE_GALLERY_DIAGNOSTICS__;
        return diagnostics?.selected === kind &&
          diagnostics.drawCalls > 0 &&
          diagnostics.triangles > 0 &&
          diagnostics.spectacleSessions === 1 &&
          (kind !== 'fan' || diagnostics.spectacleActiveTotal > 0) &&
          diagnostics.deformEnabled &&
          diagnostics.deformRenderableMeshes > 0 &&
          diagnostics.deformBoundRenderableMeshes === diagnostics.deformRenderableMeshes;
      },
      definition.id,
    );
    await expect(page.locator('.appliance-gallery-stage > p')).not.toHaveText('');
  }

  const canvas = page.locator('.appliance-gallery-canvas');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (box) {
    await page.mouse.move(box.x + box.width * 0.45, box.y + box.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.65, box.y + box.height * 0.42, { steps: 6 });
    await page.mouse.up();
  }
  await page.click('.appliance-gallery-header nav button:first-child');
  expect(pageErrors).toEqual([]);
});

test('refrigerator stretches before moving and springs back after release', async ({ page }) => {
  test.setTimeout(200_000);
  await page.goto('/?seed=2&mode=random&direct=1');
  await enterPreparedGame(page);
  await page.waitForFunction(() =>
    (window.__THREE_GAME_DIAGNOSTICS__?.puzzleRevision ?? 0) > 0 &&
    window.__THREE_GAME_DIAGNOSTICS__?.seed === 2 &&
    window.__THREE_GAME_DIAGNOSTICS__?.appliances.some((item) => item.kind === 'refrigerator'),
  );

  const canvas = page.locator('#game-canvas');
  const box = await canvas.boundingBox();
  const refrigerator = await page.evaluate(() =>
    window.__THREE_GAME_DIAGNOSTICS__?.appliances.find((item) => item.kind === 'refrigerator') ?? null,
  );
  expect(box).not.toBeNull();
  expect(refrigerator).not.toBeNull();
  if (!box || !refrigerator) return;

  let startX = box.x + refrigerator.screenX * box.width;
  let startY = box.y + refrigerator.screenY * box.height;
  const direction = refrigerator.screenX < 0.5 ? 1 : -1;
  let engaged = false;
  const offsets = [
    [0, 0],
    [0, -0.18],
    [0, 0.18],
    [-0.16, 0],
    [0.16, 0],
  ] as const;
  for (const [xRatio, yRatio] of offsets) {
    startX = box.x + (refrigerator.screenX + refrigerator.screenWidth * xRatio) * box.width;
    startY = box.y + (refrigerator.screenY + refrigerator.screenHeight * yRatio) * box.height;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.waitForTimeout(220);
    await page.mouse.move(startX + direction * 28, startY - 4, { steps: 4 });
    await page.waitForTimeout(120);
    engaged = await page.evaluate(() => {
      const target = window.__THREE_GAME_DIAGNOSTICS__?.appliances.find((item) => item.kind === 'refrigerator');
      return Boolean(target?.dragging && target.deformPull > 0.002);
    });
    if (engaged) break;
    await page.mouse.up();
  }
  expect(engaged, 'refrigerator should respond to a direct body drag').toBe(true);

  const softlyPulled = await page.evaluate(() =>
    window.__THREE_GAME_DIAGNOSTICS__?.appliances.find((item) => item.kind === 'refrigerator') ?? null,
  );
  expect(Math.abs((softlyPulled?.screenX ?? 0) - refrigerator.screenX)).toBeLessThan(0.002);

  await page.mouse.move(startX + direction * 128, startY - 16, { steps: 8 });
  await page.waitForFunction(
    ({ initialX }) => {
      const target = window.__THREE_GAME_DIAGNOSTICS__?.appliances.find((item) => item.kind === 'refrigerator');
      return target ? Math.abs(target.screenX - initialX) > 0.025 : false;
    },
    { initialX: refrigerator.screenX },
  );
  await page.mouse.up();
  await page.waitForFunction(() => {
    const target = window.__THREE_GAME_DIAGNOSTICS__?.appliances.find((item) => item.kind === 'refrigerator');
    return Boolean(target && !target.dragging && !target.dropping && !target.deforming && target.deformPull < 0.002);
  }, null, { timeout: 30_000 });
});

test('a non-refrigerator appliance also kneads before moving in the game', async ({ page }) => {
  test.setTimeout(150_000);
  await page.goto('/?seed=2&mode=random&direct=1');
  await enterPreparedGame(page);
  await page.waitForFunction(() =>
    (window.__THREE_GAME_DIAGNOSTICS__?.puzzleRevision ?? 0) > 0 &&
    window.__THREE_GAME_DIAGNOSTICS__?.seed === 2 &&
    window.__THREE_GAME_DIAGNOSTICS__?.appliances.some((item) => item.kind === 'coffee-maker'),
  );

  const canvas = page.locator('#game-canvas');
  const box = await canvas.boundingBox();
  const appliance = await page.evaluate(() =>
    window.__THREE_GAME_DIAGNOSTICS__?.appliances.find((item) => item.kind === 'coffee-maker') ?? null,
  );
  expect(box).not.toBeNull();
  expect(appliance).not.toBeNull();
  if (!box || !appliance) return;

  const startX = box.x + appliance.screenX * box.width;
  const startY = box.y + appliance.screenY * box.height;
  const direction = appliance.screenX < 0.5 ? 1 : -1;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.waitForTimeout(220);
  await page.mouse.move(startX + direction * 28, startY - 4, { steps: 5 });
  await page.waitForFunction(() => {
    const target = window.__THREE_GAME_DIAGNOSTICS__?.appliances.find((item) => item.kind === 'coffee-maker');
    return Boolean(target?.dragging && target.deformPull > 0.002);
  });
  const kneaded = await page.evaluate(() =>
    window.__THREE_GAME_DIAGNOSTICS__?.appliances.find((item) => item.kind === 'coffee-maker') ?? null,
  );
  expect(Math.abs((kneaded?.screenX ?? 0) - appliance.screenX)).toBeLessThan(0.002);
  await page.mouse.up();
  await page.waitForFunction(() => {
    const target = window.__THREE_GAME_DIAGNOSTICS__?.appliances.find((item) => item.kind === 'coffee-maker');
    return Boolean(target && !target.dragging && !target.dropping && !target.deforming);
  }, null, { timeout: 5_000 });
});

test('gallery rotates from empty space and squishes the refrigerator without a mode toggle', async ({ page }) => {
  test.setTimeout(140_000);
  await page.goto('/?seed=2679418801');
  await enterPreparedGame(page);
  await page.click('#appliance-gallery-button');
  await page.locator('[data-appliance-kind="refrigerator"]').evaluate((button: HTMLButtonElement) => button.click());
  await page.waitForFunction(() =>
    window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.selected === 'refrigerator' &&
    window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.active,
  );
  await expect(page.locator('.appliance-gallery-mode-toggle')).toHaveCount(0);
  await page.getByRole('button', { name: '暂停自转' }).click();
  await page.waitForTimeout(250);

  const canvas = page.locator('.appliance-gallery-canvas');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;

  const orbitStart = await page.evaluate(() => window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.orbitAzimuth ?? 0);
  await page.mouse.move(box.x + box.width * 0.08, box.y + box.height * 0.32);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.24, box.y + box.height * 0.32, { steps: 6 });
  await page.mouse.up();
  await page.waitForFunction(
    (start) => Math.abs((window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.orbitAzimuth ?? start) - start) > 0.04,
    orbitStart,
  );
  expect(await page.evaluate(() => window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.deformPull ?? 0)).toBe(0);
  await page.waitForFunction(() => window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.active);

  const startX = box.x + box.width * 0.5;
  const startY = box.y + box.height * 0.5;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 54, startY - 12, { steps: 6 });
  await page.waitForFunction(() => {
    const diagnostics = window.__APPLIANCE_GALLERY_DIAGNOSTICS__;
    return Boolean(diagnostics && diagnostics.deformPull > 0.01 && !diagnostics.active);
  });
  await page.mouse.up();
  await page.waitForFunction(() => window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.active);
  await page.waitForFunction(() => {
    const diagnostics = window.__APPLIANCE_GALLERY_DIAGNOSTICS__;
    return Boolean(diagnostics && !diagnostics.deforming && diagnostics.deformPull < 0.002);
  }, null, { timeout: 8_000 });
});

test('flat, layered, and articulated non-refrigerator appliances knead as one shape', async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto('/?seed=2679418801');
  await enterPreparedGame(page);
  await page.click('#appliance-gallery-button');
  await page.locator('.appliance-gallery-header nav button').nth(1).click();

  const canvas = page.locator('.appliance-gallery-canvas');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;

  for (const kind of ['robot-vacuum', 'blender', 'desktop-computer'] as const) {
    await page.locator(`[data-appliance-kind="${kind}"]`).evaluate((button: HTMLButtonElement) => button.click());
    await page.waitForFunction(
      (selected) => {
        const diagnostics = window.__APPLIANCE_GALLERY_DIAGNOSTICS__;
        return diagnostics?.selected === selected &&
          diagnostics.deformEnabled &&
          diagnostics.deformBoundRenderableMeshes === diagnostics.deformRenderableMeshes;
      },
      kind,
    );

    let engaged = false;
    for (const [xRatio, yRatio] of [[0.5, 0.5], [0.5, 0.4], [0.4, 0.5], [0.6, 0.5], [0.5, 0.62]]) {
      const x = box.x + box.width * xRatio;
      const y = box.y + box.height * yRatio;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x + 38, y - 8, { steps: 4 });
      await page.waitForTimeout(120);
      engaged = await page.evaluate(() => (window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.deformPull ?? 0) > 0.005);
      if (engaged) break;
      await page.mouse.up();
    }
    expect(engaged, `${kind} should respond to a direct knead gesture`).toBe(true);
    expect(await page.evaluate(() => window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.active ?? true)).toBe(false);
    await page.mouse.up();
    await page.waitForFunction(() => window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.deforming === false, null, { timeout: 8_000 });
  }
});

test('gallery freezes the refrigerator demo pose while kneading and resumes it after release', async ({ page }) => {
  test.setTimeout(140_000);
  await page.goto('/?seed=2679418801');
  await enterPreparedGame(page);
  await page.click('#appliance-gallery-button');
  await page.locator('[data-appliance-kind="refrigerator"]').evaluate((button: HTMLButtonElement) => button.click());
  await page.locator('.appliance-gallery-header nav button').nth(1).click();
  await page.waitForFunction(() =>
    (window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.refrigeratorDoorRotationY ?? 0) > 0.72,
  );

  const canvas = page.locator('.appliance-gallery-canvas');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;

  const startX = box.x + box.width * 0.5;
  const startY = box.y + box.height * 0.5;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 62, startY - 10, { steps: 6 });
  await page.waitForFunction(() => (window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.deformPull ?? 0) > 0.01);
  const atGrab = await page.evaluate(() => ({
    door: window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.refrigeratorDoorRotationY ?? 0,
    signal: window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.animationSignal ?? 0,
  }));
  expect(atGrab.door).toBeGreaterThan(0.5);
  expect(atGrab.signal).toBeGreaterThan(0.5);
  await page.waitForTimeout(250);

  const held = await page.evaluate(() => ({
    active: window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.active ?? true,
    door: window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.refrigeratorDoorRotationY ?? 0,
    signal: window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.animationSignal ?? 0,
  }));
  expect(held.active).toBe(false);
  expect(Math.abs(held.door - atGrab.door)).toBeLessThan(0.02);
  expect(Math.abs(held.signal - atGrab.signal)).toBeLessThan(0.02);

  await page.mouse.up();
  await page.waitForFunction((door) => {
    const diagnostics = window.__APPLIANCE_GALLERY_DIAGNOSTICS__;
    return Boolean(
      diagnostics?.active &&
      Math.abs((diagnostics.refrigeratorDoorRotationY ?? door) - door) > 0.02
    );
  }, atGrab.door);
});

test('short refrigerator pulls settle with only a restrained rebound', async ({ page }) => {
  test.setTimeout(140_000);
  await page.goto('/?seed=2679418801');
  await enterPreparedGame(page);
  await page.click('#appliance-gallery-button');
  await page.locator('[data-appliance-kind="refrigerator"]').evaluate((button: HTMLButtonElement) => button.click());
  await page.locator('.appliance-gallery-header nav button').nth(1).click();
  await page.waitForFunction(() =>
    window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.selected === 'refrigerator' &&
    (window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.refrigeratorDoorRotationY ?? 0) > 0.72,
  );

  const canvas = page.locator('.appliance-gallery-canvas');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;
  const startX = box.x + box.width * 0.5;
  const startY = box.y + box.height * 0.5;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 32, startY - 5, { steps: 6 });
  await page.waitForFunction(() => (window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.deformPull ?? 0) > 0.015);
  await page.mouse.up();
  await page.waitForFunction(() =>
    (window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.deformReboundPullRatio ?? 0) > 0,
  );

  const rebound = await page.evaluate(() => ({
    pullRatio: window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.deformReboundPullRatio ?? 1,
    response: window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.deformReboundResponse ?? 1,
  }));
  expect(rebound.pullRatio).toBeLessThan(0.45);
  expect(rebound.response).toBeLessThan(0.2);

  const samples: number[] = [];
  for (let index = 0; index < 36; index += 1) {
    await page.waitForTimeout(30);
    samples.push(await page.evaluate(() => window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.deformSignedPull ?? 0));
  }
  let directionChanges = 0;
  let previousSign = 0;
  for (const sample of samples) {
    if (Math.abs(sample) < 0.0015) continue;
    const sign = Math.sign(sample);
    if (previousSign !== 0 && sign !== previousSign) directionChanges += 1;
    previousSign = sign;
  }
  expect(directionChanges).toBeLessThanOrEqual(2);
});

test('refrigerator visibly rebounds back and forth several times after release', async ({ page }) => {
  test.setTimeout(140_000);
  await page.goto('/?seed=2679418801');
  await enterPreparedGame(page);
  await page.click('#appliance-gallery-button');
  await page.locator('[data-appliance-kind="refrigerator"]').evaluate((button: HTMLButtonElement) => button.click());
  await page.waitForFunction(() =>
    window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.selected === 'refrigerator' &&
    (window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.refrigeratorDoorRotationY ?? 0) > 0.72,
  );

  const canvas = page.locator('.appliance-gallery-canvas');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;
  const startX = box.x + box.width * 0.5;
  const startY = box.y + box.height * 0.5;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + Math.min(112, box.width * 0.26), startY - 14, { steps: 9 });
  await page.waitForFunction(() => (window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.deformPull ?? 0) > 0.05);
  await page.mouse.up();

  const samples: number[] = [];
  for (let index = 0; index < 55; index += 1) {
    await page.waitForTimeout(35);
    samples.push(await page.evaluate(() => window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.deformSignedPull ?? 0));
  }
  let directionChanges = 0;
  let previousSign = 0;
  for (const sample of samples) {
    if (Math.abs(sample) < 0.003) continue;
    const sign = Math.sign(sample);
    if (previousSign !== 0 && sign !== previousSign) directionChanges += 1;
    previousSign = sign;
  }
  expect(directionChanges).toBeGreaterThanOrEqual(4);
});

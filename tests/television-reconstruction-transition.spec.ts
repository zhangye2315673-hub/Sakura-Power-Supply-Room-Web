import { expect, test } from '@playwright/test';
import { PNG } from 'pngjs';
import * as THREE from 'three';
import type { ArrowDefinition } from '../src/puzzle/types';
import { PlugCableModel } from '../src/render/PlugCableModel';
import { TelevisionReconstructionTransition } from '../src/skill/TelevisionReconstructionTransition';
import { buildTelevisionSpatialReplacements } from '../src/skill/skillTopology';
import { createTelevisionModel } from '../src/appliances/models/television';
import {
  SkillEffectActivationTimeline,
  sampleTelevisionGlitchBurst,
} from '../src/style/post';

function meanPixelDifference(leftBuffer: Buffer, rightBuffer: Buffer): number {
  const left = PNG.sync.read(leftBuffer);
  const right = PNG.sync.read(rightBuffer);
  expect([left.width, left.height]).toEqual([right.width, right.height]);
  let total = 0;
  for (let index = 0; index < left.data.length; index += 4) {
    total += Math.abs(left.data[index] - right.data[index]);
    total += Math.abs(left.data[index + 1] - right.data[index + 1]);
    total += Math.abs(left.data[index + 2] - right.data[index + 2]);
  }
  return total / (left.width * left.height * 3);
}

async function waitForTwoFrames(page: import('@playwright/test').Page): Promise<void> {
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
}

test('电视全屏故障是短促爆发并在每次触发时从头播放', () => {
  const timeline = new SkillEffectActivationTimeline();
  timeline.activate('television-glitch', 'none', true, 10);
  expect(timeline.activationCount).toBe(1);
  expect(timeline.age('television-glitch', 10.04)).toBeCloseTo(0.04, 6);
  expect(sampleTelevisionGlitchBurst(0.12)).toBeGreaterThan(0.6);
  expect(sampleTelevisionGlitchBurst(0.46)).toBe(0);
  expect(sampleTelevisionGlitchBurst(0.9)).toBeGreaterThan(0.35);

  timeline.activate('television-glitch', 'television-glitch', true, 20);
  expect(timeline.activationCount).toBe(2);
  expect(timeline.age('television-glitch', 20.03)).toBeCloseTo(0.03, 6);
});

test('真实后处理管线连续触发电视故障时重置本轮时间', async ({ page }) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => { window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 0; });
  await page.goto('/?level=1');
  await page.waitForFunction(() => typeof window.__TRIGGER_TELEVISION_GLITCH_FOR_EVIDENCE__ === 'function');
  await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true);
  const first = await page.evaluate(() => window.__TRIGGER_TELEVISION_GLITCH_FOR_EVIDENCE__?.());
  await page.waitForTimeout(180);
  const aged = await page.evaluate(() => window.__TRIGGER_TELEVISION_GLITCH_FOR_EVIDENCE__?.(false));
  const second = await page.evaluate(() => window.__TRIGGER_TELEVISION_GLITCH_FOR_EVIDENCE__?.());

  expect(first?.mode).toBe('television-glitch');
  expect(aged?.activationCount).toBe(first!.activationCount);
  expect(aged?.age).toBeGreaterThan(0.12);
  expect(second?.activationCount).toBe(first!.activationCount + 1);
  expect(second?.age).toBeLessThan(0.08);
});

test('电视全屏数字故障在第二次触发仍产生可见像素爆发并快速复原', async ({ page }) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => {
    window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 0;
    window.__TELEVISION_GLITCH_AGE_OVERRIDE__ = 0.46;
  });
  await page.setViewportSize({ width: 640, height: 360 });
  await page.goto('/?level=1');
  await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true);
  expect(await page.evaluate(() => window.__FINISH_OPENING_FOR_EVIDENCE__?.() ?? false)).toBe(true);
  await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.opening.active === false);

  const canvas = page.locator('canvas');
  await page.evaluate(() => window.__TRIGGER_TELEVISION_GLITCH_FOR_EVIDENCE__?.());
  await waitForTwoFrames(page);
  const quietA = await canvas.screenshot();
  await page.evaluate(() => { window.__TELEVISION_GLITCH_AGE_OVERRIDE__ = 0.12; });
  await waitForTwoFrames(page);
  const firstBurst = await canvas.screenshot();

  await page.evaluate(() => { window.__TELEVISION_GLITCH_AGE_OVERRIDE__ = 0.46; });
  await waitForTwoFrames(page);
  const quietB = await canvas.screenshot();

  const firstCount = await page.evaluate(() => (
    window.__TRIGGER_TELEVISION_GLITCH_FOR_EVIDENCE__?.(false).activationCount ?? 0
  ));
  await page.evaluate(() => {
    window.__TELEVISION_GLITCH_AGE_OVERRIDE__ = 0.12;
    window.__TRIGGER_TELEVISION_GLITCH_FOR_EVIDENCE__?.();
  });
  await waitForTwoFrames(page);
  const secondBurst = await canvas.screenshot();
  const secondCount = await page.evaluate(() => (
    window.__TRIGGER_TELEVISION_GLITCH_FOR_EVIDENCE__?.(false).activationCount ?? 0
  ));

  const ambientMotion = meanPixelDifference(quietA, quietB);
  const firstBurstDifference = meanPixelDifference(firstBurst, quietB);
  const secondBurstDifference = meanPixelDifference(secondBurst, quietB);
  console.log('TELEVISION_GLITCH_PIXELS', JSON.stringify({
    ambientMotion,
    firstBurstDifference,
    secondBurstDifference,
  }));
  expect(firstBurstDifference).toBeGreaterThan(ambientMotion * 1.25 + 0.35);
  expect(secondBurstDifference).toBeGreaterThan(ambientMotion * 1.25 + 0.35);
  expect(secondCount).toBe(firstCount + 1);
});

test('电视故障重构同时预览三条新路径并在故障屏时序结束后提交', () => {
  const definitions: ArrowDefinition[] = [
    { id: 'tv-a', path: [[2, 5, 5], [3, 5, 5], [4, 5, 5]], exitDirection: '+X', color: 0xf0a044, lengthClass: 'short' },
    { id: 'tv-b', path: [[6, 2, 2], [6, 3, 2], [6, 4, 2]], exitDirection: '+Y', color: 0x56a8ff, lengthClass: 'short' },
    { id: 'tv-c', path: [[8, 8, 8], [8, 8, 7], [8, 8, 6]], exitDirection: '-Z', color: 0xffc14d, lengthClass: 'short' },
  ];
  const replacements = buildTelevisionSpatialReplacements(definitions, definitions.map(({ id }) => id));
  const models = new Map(definitions.map((definition, index) => {
    const model = new PlugCableModel(definition, 'round-two-pin');
    model.root.position.set(index * 0.2, index * -0.1, index * 0.05);
    return [definition.id, model] as const;
  }));
  const television = createTelevisionModel({ id: 'television', accent: 0xe8aec4 });
  const staticGroup = television.root.getObjectByName('television-static-snow-group')!;
  const screen = television.root.getObjectByName('television-crt-bulged-screen') as THREE.Mesh;
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 8);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld(true);
  let timeline = 0;
  let commitCount = 0;
  let committedDefinitions = definitions;
  const transition = new TelevisionReconstructionTransition();

  transition.start({
    replacements,
    existingModels: models,
    getPlugStyle: () => 'round-two-pin',
    getTimelineElapsed: () => timeline,
    televisionRoot: television.root,
    commit: () => {
      commitCount += 1;
      committedDefinitions = definitions.map((definition) => replacements.get(definition.id) ?? definition);
      return true;
    },
  });

  expect(transition.diagnostics.targetIds).toEqual(['tv-a', 'tv-b', 'tv-c']);
  timeline = 0.98;
  transition.update(camera);
  expect(transition.diagnostics).toMatchObject({
    active: true,
    phase: 'new-glitch',
    currentTopology: 'new',
    rgbGhostCount: 6,
    committed: false,
  });
  expect(transition.root.children.filter((child) => child.name.startsWith('television-next-'))).toHaveLength(3);
  const flash = television.root.userData.televisionReconstructionFlash as { active: boolean; intensity: number; staticVisible: boolean };
  expect(flash.active).toBe(true);
  expect(flash.staticVisible).toBe(true);
  expect(flash.intensity).toBeGreaterThan(0.7);
  expect(staticGroup.visible).toBe(true);
  const screenMaterial = screen.material as THREE.MeshToonMaterial;
  expect(screenMaterial.emissiveIntensity).toBeGreaterThan(0.7);


  timeline = 5.13;
  transition.update(camera);
  expect(commitCount).toBe(1);
  expect(committedDefinitions.map(({ path }) => path)).not.toEqual(definitions.map(({ path }) => path));
  expect(transition.diagnostics).toMatchObject({
    active: false,
    phase: 'complete',
    currentTopology: 'committed',
    committed: true,
  });
  expect(staticGroup.visible).toBe(false);

  timeline = 0;
  transition.start({
    replacements,
    existingModels: models,
    getPlugStyle: () => 'round-two-pin',
    getTimelineElapsed: () => timeline,
    televisionRoot: television.root,
    commit: () => true,
  });
  timeline = 0.98;
  transition.update(camera);
  const repeatedFlash = television.root.userData.televisionReconstructionFlash as {
    active: boolean;
    staticVisible: boolean;
  };
  expect(repeatedFlash).toMatchObject({ active: true, staticVisible: true });
  expect(staticGroup.visible).toBe(true);
  expect(transition.diagnostics.rgbGhostCount).toBe(6);

  transition.dispose();
  expect(television.root.userData.televisionReconstructionFlash).toBeUndefined();
  models.forEach((model) => model.dispose());
  television.root.traverse((object) => { if (object.type === 'Mesh') { (object as THREE.Mesh).geometry.dispose(); const material = (object as THREE.Mesh).material; (Array.isArray(material) ? material : [material]).forEach((entry) => entry.dispose()); } });
});

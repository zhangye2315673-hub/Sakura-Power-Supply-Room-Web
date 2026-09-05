import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { makeRuntime } from '../src/puzzle/collision';
import type { ArrowDefinition } from '../src/puzzle/types';
import { PlugCableModel } from '../src/render/PlugCableModel';
import { WasherSpinPresentation } from '../src/skill/WasherSpinPresentation';

test('洗衣机技能完成后保留最终停止角度，不回弹到技能前姿态', () => {
  const definitions: ArrowDefinition[] = [
    {
      id: 'washer-final-pose-a',
      path: [[2, 2, 2], [3, 2, 2], [4, 2, 2]],
      exitDirection: '+X',
      color: 0xe56b9f,
      lengthClass: 'short',
    },
    {
      id: 'washer-final-pose-b',
      path: [[2, 4, 4], [2, 5, 4], [2, 6, 4]],
      exitDirection: '+Y',
      color: 0x56a8ff,
      lengthClass: 'short',
    },
  ];
  const cableRoot = new THREE.Group();
  cableRoot.position.set(0.3, -0.2, 0.4);
  cableRoot.rotation.set(0.1, -0.2, 0.15);
  const baseQuaternion = cableRoot.quaternion.clone();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 8);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld(true);

  const models = new Map<string, PlugCableModel>();
  const arrows = definitions.map((definition) => {
    const model = new PlugCableModel(definition, 'round-two-pin');
    cableRoot.add(model.root);
    models.set(definition.id, model);
    return makeRuntime(definition);
  });

  const presentation = new WasherSpinPresentation();
  presentation.start({
    cableRoot,
    camera,
    arrows,
    models,
    targetIds: definitions.map(({ id }) => id),
    onLaunch: () => true,
  });

  for (let frame = 0; frame < 160; frame += 1) presentation.update(0.05);

  expect(presentation.diagnostics.phase).toBe('complete');
  expect(presentation.diagnostics.angularVelocity).toBe(0);
  expect(presentation.diagnostics.spinAngle).toBeGreaterThan(0);
  expect(cableRoot.quaternion.equals(baseQuaternion)).toBe(false);

  presentation.reset();
  models.forEach((model) => model.dispose());
});

test('洗衣机把局部线组中心转换到父坐标后再设旋转枢轴，启动与停止均不跳位', () => {
  const definitions: ArrowDefinition[] = [
    {
      id: 'washer-pivot-a',
      path: [[1, 2, 2], [1, 2, 5], [4, 2, 5]],
      exitDirection: '+X',
      color: 0xe56b9f,
      lengthClass: 'medium',
    },
    {
      id: 'washer-pivot-b',
      path: [[3, 5, 1], [3, 7, 1], [3, 7, 4]],
      exitDirection: '+Z',
      color: 0x56a8ff,
      lengthClass: 'medium',
    },
    {
      id: 'washer-pivot-c',
      path: [[6, 3, 2], [6, 5, 2], [4, 5, 2]],
      exitDirection: '-X',
      color: 0x6ed6b5,
      lengthClass: 'medium',
    },
  ];
  const sceneRoot = new THREE.Group();
  sceneRoot.position.set(-1.4, 0.8, 2.1);
  sceneRoot.rotation.set(-0.18, 0.31, 0.12);
  sceneRoot.scale.set(1.08, 0.92, 1.15);
  const cableRoot = new THREE.Group();
  cableRoot.position.set(0.7, -0.35, 0.55);
  cableRoot.rotation.set(0.24, -0.37, 0.19);
  cableRoot.scale.set(1.2, 0.86, 1.05);
  sceneRoot.add(cableRoot);
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(1.5, 0.8, 10);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld(true);

  const models = new Map<string, PlugCableModel>();
  const arrows = definitions.map((definition) => {
    const model = new PlugCableModel(definition, 'round-two-pin');
    cableRoot.add(model.root);
    models.set(definition.id, model);
    return makeRuntime(definition);
  });
  sceneRoot.updateWorldMatrix(true, true);
  const before = new Map([...models].map(([id, model]) => [
    id,
    model.getHeadWorldPosition(new THREE.Vector3()),
  ]));
  const samplePoints = arrows.flatMap((arrow) => arrow.samplePoints);
  const localCenter = samplePoints.reduce((sum, point) => sum.add(point), new THREE.Vector3())
    .multiplyScalar(1 / samplePoints.length);
  const expectedPivotWorld = cableRoot.localToWorld(localCenter.clone());

  const presentation = new WasherSpinPresentation();
  presentation.start({
    cableRoot,
    camera,
    arrows,
    models,
    targetIds: definitions.slice(0, 2).map(({ id }) => id),
    onLaunch: () => true,
  });
  sceneRoot.updateWorldMatrix(true, true);

  for (const [id, model] of models) {
    expect(model.getHeadWorldPosition(new THREE.Vector3()).distanceTo(before.get(id)!)).toBeLessThan(1e-5);
  }
  expect(cableRoot.getWorldPosition(new THREE.Vector3()).distanceTo(expectedPivotWorld)).toBeLessThan(1e-5);

  for (let frame = 0; frame < 131; frame += 1) presentation.update(0.05);
  sceneRoot.updateWorldMatrix(true, true);
  const beforeComplete = new Map([...models].map(([id, model]) => [
    id,
    model.getHeadWorldPosition(new THREE.Vector3()),
  ]));
  presentation.update(0.05);
  presentation.update(0.05);
  sceneRoot.updateWorldMatrix(true, true);
  expect(presentation.diagnostics.phase).toBe('complete');
  const launchedIds = new Set(definitions.slice(0, 2).map(({ id }) => id));
  for (const [id, model] of models) {
    if (launchedIds.has(id)) continue;
    expect(model.getHeadWorldPosition(new THREE.Vector3()).distanceTo(beforeComplete.get(id)!)).toBeLessThan(1e-5);
  }
  expect(cableRoot.getWorldPosition(new THREE.Vector3()).distanceTo(expectedPivotWorld)).toBeLessThan(1e-5);

  const afterComplete = new Map([...models].map(([id, model]) => [
    id,
    model.getHeadWorldPosition(new THREE.Vector3()),
  ]));
  models.forEach((model) => model.setBundleSpacingOffset(null));
  sceneRoot.updateWorldMatrix(true, true);
  for (const [id, model] of models) {
    if (launchedIds.has(id)) continue;
    expect(model.getHeadWorldPosition(new THREE.Vector3()).distanceTo(afterComplete.get(id)!)).toBeLessThan(1e-5);
  }

  presentation.reset();
  models.forEach((model) => model.dispose());
});

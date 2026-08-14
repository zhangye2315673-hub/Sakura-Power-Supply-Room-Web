import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { createWasherModel } from '../src/appliances/models/washer';
import {
  createWasherPerformance,
  type WasherPerformanceDiagnostics,
} from '../src/appliances/performance/WasherPerformance';

function pose(root: THREE.Group): string {
  const values: Array<[string, number[] | boolean]> = [];
  root.traverse((object) => values.push([
    object.name,
    [
      ...object.position.toArray(),
      ...object.quaternion.toArray(),
      ...object.scale.toArray(),
    ].map((value) => Number(value.toFixed(7))),
  ]));
  return JSON.stringify(values);
}

test('washer is a deep front-load assembly with volumetric laundry and closed wet-effect rigs', () => {
  const model = createWasherModel({ id: 'washer', accent: 0xe8aec4 });
  const drum = model.root.getObjectByName('washer-deep-perforated-drum-wall') as THREE.Mesh<THREE.CylinderGeometry>;
  expect(drum.geometry.parameters.height).toBeGreaterThan(0.9);
  expect(model.root.getObjectByName('washer-fixed-rubber-door-gasket')).toBeTruthy();
  expect(model.root.getObjectByName('washer-door-gasket-depth-throat')).toBeTruthy();
  expect(model.root.getObjectByName('washer-front-face')).toBeFalsy();
  for (const side of ['left', 'right']) {
    const shell = model.root.getObjectByName(`washer-cabinet-${side}-side-shell`) as THREE.Mesh;
    expect(shell, `${side} cabinet shell`).toBeTruthy();
    shell.geometry.computeBoundingBox();
    const size = shell.geometry.boundingBox?.getSize(new THREE.Vector3()) ?? new THREE.Vector3();
    expect(size.x).toBeGreaterThan(0.25);
    expect(size.y).toBeGreaterThan(2.6);
    expect(size.z).toBeGreaterThan(1.8);
  }

  const laundry: THREE.Object3D[] = [];
  const effects: THREE.Object3D[] = [];
  const forbidden: string[] = [];
  model.root.traverse((object) => {
    if (object.name.startsWith('washer-laundry-volume-')) laundry.push(object);
    if (object.name.startsWith('washer-volumetric-')) effects.push(object);
    if (object.name === 'washer-squeezed-foam' || object instanceof THREE.Sprite || object instanceof THREE.Line) forbidden.push(object.name);
  });
  expect(laundry).toHaveLength(5);
  laundry.forEach((cloth) => expect((cloth as THREE.Mesh).geometry.type).toBe('IcosahedronGeometry'));
  expect(effects).toHaveLength(12);
  expect(forbidden).toEqual([]);
});

test('washer performs two tumbles, sudden spin, rigid-body imbalance and a controlled settle', () => {
  const model = createWasherModel({ id: 'washer', accent: 0xe8aec4 });
  const performance = createWasherPerformance(model.root);
  const idle = pose(model.root);

  performance.update(2.18, 1);
  let diagnostics = model.root.userData.washerPerformanceDiagnostics as WasherPerformanceDiagnostics;
  expect(diagnostics.phase).toBe('tumble');
  expect(diagnostics.slowTumbleRotations).toBe(2);
  expect(diagnostics.laundryMode).toBe('lift-and-drop');

  performance.update(3.55, 1);
  diagnostics = model.root.userData.washerPerformanceDiagnostics as WasherPerformanceDiagnostics;
  expect(diagnostics.phase).toBe('high-spin');
  expect(diagnostics.drumSpeed).toBeGreaterThan(25);
  expect(diagnostics.laundryMode).toBe('centrifuged');
  expect(diagnostics.cabinetRigidScale).toEqual([1, 1, 1]);
  expect(Math.max(...diagnostics.footLoads) - Math.min(...diagnostics.footLoads)).toBeGreaterThan(0.01);
  expect(diagnostics.visibleSuds).toBeGreaterThan(0);
  expect(diagnostics.visibleSuds).toBeLessThanOrEqual(7);
  expect(diagnostics.visibleDroplets).toBeLessThanOrEqual(5);

  performance.update(5.16, 1);
  diagnostics = model.root.userData.washerPerformanceDiagnostics as WasherPerformanceDiagnostics;
  expect(diagnostics.phase).toBe('braking');
  expect(diagnostics.laundryMode).toBe('falling');
  expect(diagnostics.drumSpeed).toBeLessThan(1);

  performance.stop();
  expect(pose(model.root)).toBe(idle);
  expect(performance.signal()).toBe(0);
});

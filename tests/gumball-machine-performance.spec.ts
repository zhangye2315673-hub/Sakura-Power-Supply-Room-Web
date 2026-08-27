import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { createGumballMachineModel } from '../src/appliances/models/gumballMachine';
import { createApplianceMechanicalAnimation } from '../src/appliances/performance/ApplianceMechanics';

test('output capsule is twice as large and travels through two bounces to a far foreground landing', () => {
  const model = createGumballMachineModel({ id: 'gumball-machine', accent: 0xe8aec4 });
  const animation = createApplianceMechanicalAnimation('gumball-machine', model.root);
  const output = model.root.getObjectByName('gumball-machine-output-capsule-motion-pivot') as THREE.Group;
  const idleScale = output.scale.clone();

  animation.update(2.2, 1);
  expect(output.visible).toBe(true);
  expect(output.scale.x / idleScale.x).toBeCloseTo(2, 5);
  expect(output.scale.y / idleScale.y).toBeCloseTo(2, 5);
  expect(output.scale.z / idleScale.z).toBeCloseTo(2, 5);

  const forwardSamples = [3, 3.42, 3.73, 4.05].map((time) => {
    animation.update(time, 1);
    return output.position.z;
  });
  expect(forwardSamples.every((value, index) => index === 0 || value >= forwardSamples[index - 1])).toBe(true);
  expect(forwardSamples.at(-1)).toBeGreaterThanOrEqual(6.7);
  expect(forwardSamples.at(-1)! - 1.04).toBeGreaterThan(5.5);

  animation.stop();
  expect(output.scale.toArray()).toEqual(idleScale.toArray());
  expect(output.visible).toBe(false);
});
test('clear output cap owns its white seam and the full prize assembly uses appliance outlines', () => {
  const model = createGumballMachineModel({ id: 'gumball-machine', accent: 0xe8aec4 });
  const clearCap = model.root.getObjectByName('gumball-machine-output-capsule-left-shell-pivot') as THREE.Group;
  const seam = model.root.getObjectByName('gumball-machine-output-capsule-equator-seam') as THREE.Mesh;

  expect(seam.parent).toBe(clearCap);
  for (const name of [
    'gumball-machine-output-capsule-left-clear-upper-shell',
    'gumball-machine-output-capsule-right-clear-upper-shell',
    'gumball-machine-output-capsule-equator-seam',
    'gumball-machine-output-star-prize',
    'gumball-machine-output-flower-prize',
    'gumball-machine-output-key-prize',
    'gumball-machine-output-bear-prize',
  ]) {
    const mesh = model.root.getObjectByName(name) as THREE.Mesh;
    const outline = mesh.getObjectByName(`${name}-ink`) as THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;
    expect(outline?.userData.isOutline).toBe(true);
    expect(outline.material.uniforms.uThickness.value).toBeCloseTo(0.0048, 5);
  }

  const clearOutline = model.root.getObjectByName(
    'gumball-machine-output-capsule-left-clear-upper-shell-ink',
  ) as THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;
  const lowerOutline = model.root.getObjectByName(
    'gumball-machine-output-capsule-right-clear-upper-shell-ink',
  ) as THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;
  expect(clearOutline.material.uniforms.uSilhouetteOnly.value).toBe(1);
  expect(lowerOutline.material.uniforms.uSilhouetteOnly.value).toBe(0);
});

test('each powered cycle reveals a different prize shape in deterministic order', () => {
  const model = createGumballMachineModel({ id: 'gumball-machine', accent: 0xe8aec4 });
  const animation = createApplianceMechanicalAnimation('gumball-machine', model.root);
  const kinds = ['star', 'flower', 'key', 'bear'] as const;

  for (const expectedKind of kinds) {
    animation.update(4.5, 1);
    const visibleKinds = kinds.filter((kind) => (
      model.root.getObjectByName(`gumball-machine-output-${kind}-prize`)?.visible === true
    ));
    expect(visibleKinds).toEqual([expectedKind]);
    expect(model.root.userData.gumballMachinePerformanceDiagnostics.prizeKind).toBe(expectedKind);
    animation.stop();
  }
});

test('released prize falls vertically, makes two smaller bounces, and settles on the floor', () => {
  const model = createGumballMachineModel({ id: 'gumball-machine', accent: 0xe8aec4 });
  const animation = createApplianceMechanicalAnimation('gumball-machine', model.root);
  const prize = model.root.getObjectByName('gumball-machine-output-prize-pivot') as THREE.Group;

  animation.update(4.85, 1);
  const firstBounce = prize.position.clone();
  expect(model.root.userData.gumballMachinePerformanceDiagnostics.toyBounceIndex).toBe(1);

  animation.update(5.075, 1);
  const secondBounce = prize.position.clone();
  expect(model.root.userData.gumballMachinePerformanceDiagnostics.toyBounceIndex).toBe(2);

  animation.update(5.18, 1);
  const settled = prize.position.clone();
  const diagnostics = model.root.userData.gumballMachinePerformanceDiagnostics;

  expect(firstBounce.y).toBeGreaterThan(secondBounce.y);
  expect(secondBounce.y).toBeGreaterThan(settled.y);
  expect(firstBounce.x).toBeCloseTo(secondBounce.x, 6);
  expect(secondBounce.x).toBeCloseTo(settled.x, 6);
  expect(firstBounce.z).toBeCloseTo(secondBounce.z, 6);
  expect(secondBounce.z).toBeCloseTo(settled.z, 6);
  expect(diagnostics.toyGrounded).toBe(true);
  expect(diagnostics.phase).toBe('settled');
});

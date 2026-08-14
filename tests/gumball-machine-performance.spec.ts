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

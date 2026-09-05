import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { PLUG_HEAD_MAX_LENGTH, cableSocketPointsToWorld, type ArrowDefinition } from '../src/puzzle/types';
import { PlugCableModel } from '../src/render/PlugCableModel';

test('手机假双头插头覆盖尾线，接触点仍停在原逻辑尾端', () => {
  const definition: ArrowDefinition = {
    id: 'phone-fake-tail-geometry',
    path: [[2, 3, 4], [3, 3, 4], [3, 4, 4]],
    exitDirection: '+Y',
    color: 0xf08b98,
    lengthClass: 'medium',
  };
  const model = new PlugCableModel(definition, 'round-two-pin');
  const logicalTail = cableSocketPointsToWorld(definition)[0];
  model.setFakeTailPlug(true);
  model.root.updateMatrixWorld(true);

  const fakeTailRoot = model.getHeadWorldPosition(new THREE.Vector3(), 'tail');
  const firstDirection = cableSocketPointsToWorld(definition)[1]
    .clone()
    .sub(logicalTail)
    .normalize();

  expect(fakeTailRoot.clone().sub(logicalTail).dot(firstDirection)).toBeCloseTo(PLUG_HEAD_MAX_LENGTH, 5);
  expect(fakeTailRoot.clone().sub(logicalTail).cross(firstDirection).length()).toBeLessThan(1e-5);
  model.dispose();
});

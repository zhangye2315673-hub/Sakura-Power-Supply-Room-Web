import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { PLUG_HEAD_MAX_LENGTH, cableSocketPointsToWorld, type ArrowDefinition } from '../src/puzzle/types';
import { PLUG_CABLE_SOCKET_OVERLAP, PlugCableModel } from '../src/render/PlugCableModel';

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
  const body = model.root.getObjectByName(definition.id + '-cable') as THREE.Mesh;
  const positions = body.geometry.getAttribute('position');
  let closestToTail = Infinity;
  for (let i = 0; i < positions.count; i++) {
    closestToTail = Math.min(closestToTail, new THREE.Vector3().fromBufferAttribute(positions, i).sub(logicalTail).dot(firstDirection));
  }
  expect(closestToTail).toBeGreaterThan(PLUG_HEAD_MAX_LENGTH - PLUG_CABLE_SOCKET_OVERLAP - 0.15);
  model.setMotionDistance(0.2, 'tail');
  const movingPlug = model.getHeadWorldPosition(new THREE.Vector3(), 'tail');
  const movingBody = model.root.getObjectByName(definition.id + '-cable') as THREE.Mesh;
  const movingPositions = movingBody.geometry.getAttribute('position');
  let furthestOut = -Infinity;
  for (let i = 0; i < movingPositions.count; i++) {
    furthestOut = Math.max(furthestOut, new THREE.Vector3().fromBufferAttribute(movingPositions, i).sub(movingPlug).dot(firstDirection.clone().negate()));
  }
  expect(furthestOut).toBeLessThan(PLUG_CABLE_SOCKET_OVERLAP + 0.15);
  model.setFakeTailPlug(false);
  const restored = model.root.getObjectByName(definition.id + '-cable') as THREE.Mesh;
  restored.geometry.computeBoundingBox();
  expect(restored.geometry.boundingBox!.min.x).toBeLessThan(body.geometry.boundingBox!.min.x);
  model.dispose();
});

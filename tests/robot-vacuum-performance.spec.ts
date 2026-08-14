import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { createRobotVacuumModel } from '../src/appliances/models/robotVacuum';
import {
  createRobotVacuumPerformance,
  ROBOT_VACUUM_TIMELINE,
} from '../src/appliances/performance/RobotVacuumPerformance';
import { ApplianceTarget } from '../src/systems/ApplianceScene';
import { APPLIANCE_CATALOG } from '../src/systems/ApplianceCatalog';
import { ConnectionSystem } from '../src/systems/ConnectionSystem';

function pose(root: THREE.Group): string {
  const names = [
    'robot-vacuum-motion-pivot',
    'robot-vacuum-chassis-pivot',
    'robot-vacuum-lidar-rotor-pivot',
    'robot-vacuum-main-brush-pivot',
    'robot-vacuum-left-side-brush-pivot',
    'robot-vacuum-right-side-brush-pivot',
    'robot-vacuum-left-drive-wheel-pivot',
    'robot-vacuum-right-drive-wheel-pivot',
  ];
  return JSON.stringify(names.map((name) => {
    const object = root.getObjectByName(name)!;
    return [name, ...object.position.toArray(), ...object.quaternion.toArray(), ...object.scale.toArray()]
      .map((value) => typeof value === 'number' ? Number(value.toFixed(7)) : value);
  }));
}

test('robot vacuum underside has paired front edge brushes and a real wheel/roller layout', () => {
  const model = createRobotVacuumModel({ id: 'robot-vacuum', accent: 0xe8aec4 });
  const left = model.root.getObjectByName('robot-vacuum-left-side-brush-pivot');
  const right = model.root.getObjectByName('robot-vacuum-right-side-brush-pivot');
  expect(left).toBeTruthy();
  expect(right).toBeTruthy();
  expect(left?.position.x).toBeLessThan(-0.5);
  expect(right?.position.x).toBeGreaterThan(0.5);
  expect(left?.position.z).toBeGreaterThan(0.4);
  expect(right?.position.z).toBeGreaterThan(0.4);
  expect(model.root.getObjectByName('robot-vacuum-three-arm-side-brush-pivot')).toBeFalsy();
  expect(model.root.getObjectByName('robot-vacuum-left-drive-wheel-pivot')).toBeTruthy();
  expect(model.root.getObjectByName('robot-vacuum-right-drive-wheel-pivot')).toBeTruthy();
  expect(model.root.getObjectByName('robot-vacuum-front-caster-pivot')).toBeTruthy();
  expect(model.root.getObjectByName('robot-vacuum-main-brush-pivot')).toBeTruthy();
  for (const side of ['left', 'right']) {
    for (let arm = 1; arm <= 3; arm += 1) {
      expect(model.root.getObjectByName(`robot-vacuum-${side}-side-brush-arm-${arm}`)).toBeTruthy();
      for (let bristle = 1; bristle <= 3; bristle += 1) {
        expect(model.root.getObjectByName(`robot-vacuum-${side}-side-brush-bristle-${arm}-${bristle}`)).toBeTruthy();
      }
    }
  }
});

test('robot vacuum connection anchor sits on the round side rim instead of the empty front corner', () => {
  const definition = APPLIANCE_CATALOG.find((candidate) => candidate.id === 'robot-vacuum');
  expect(definition).toBeTruthy();
  if (!definition) return;
  const target = new ApplianceTarget(definition, 0xe8aec4, [0.1, 0.5]);
  target.setScreenPlacement(new THREE.Vector2(0.1, 0.5));
  expect(target.outwardEdge).toBe('left');
  expect(Math.abs(target.connectionAnchor.position.z)).toBeLessThan(0.35);
  expect(Math.hypot(target.connectionAnchor.position.x, target.connectionAnchor.position.z))
    .toBeLessThan(1.15);
  target.dispose();
});

test('robot vacuum plug head stays visible until it reaches the side socket', () => {
  const definition = APPLIANCE_CATALOG.find((candidate) => candidate.id === 'robot-vacuum');
  expect(definition).toBeTruthy();
  if (!definition) return;
  const target = new ApplianceTarget(definition, 0xe8aec4, [0.1, 0.5]);
  target.setScreenPlacement(new THREE.Vector2(0.1, 0.5));
  const camera = new THREE.PerspectiveCamera(26, 16 / 9, 0.1, 100);
  camera.position.set(0, 0, 13.6);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld(true);
  target.root.position.set(-4, 0, 0);
  target.root.updateMatrixWorld(true);
  const connections = new ConnectionSystem();
  connections.begin(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-1, 0, 0),
    target,
    0xe8aec4,
    definition.plugStyleId,
    camera,
    () => undefined,
  );
  const flight = (connections as unknown as {
    flights: Array<{
      phase: 'exit' | 'enter';
      phaseStartedAt: number;
      duration: number;
      head: { root: THREE.Group };
    }>;
  }).flights[0];
  flight.phase = 'enter';
  flight.duration = 1;
  flight.phaseStartedAt = performance.now() * 0.001 - 0.95;
  connections.update(0, camera);
  expect(flight.head.root.visible).toBe(true);
  expect(flight.head.root.position.distanceTo(target.getConnectionWorldPosition())).toBeLessThan(0.03);
  connections.dispose();
  target.dispose();
});

test('robot vacuum leaves origin, follows tangent around one large circle and returns exactly', () => {
  const model = createRobotVacuumModel({ id: 'robot-vacuum', accent: 0xe8aec4 });
  const performance = createRobotVacuumPerformance(model.root);
  const motion = model.root.getObjectByName('robot-vacuum-motion-pivot')!;
  const positions: THREE.Vector3[] = [];
  for (let time = ROBOT_VACUUM_TIMELINE.circleStart; time <= ROBOT_VACUUM_TIMELINE.circleEnd; time += 0.025) {
    performance.apply(time, 1);
    positions.push(motion.position.clone());
    if (performance.diagnostics.circleProgress > 0.04 && performance.diagnostics.circleProgress < 0.96) {
      const theta = performance.diagnostics.circleProgress * Math.PI * 2;
      const tangent = new THREE.Vector3(-Math.sin(theta), 0, Math.cos(theta)).normalize();
      const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(motion.quaternion).normalize();
      expect(forward.dot(tangent)).toBeGreaterThan(0.9999);
    }
  }
  expect(Math.max(...positions.map((position) => position.length()))).toBeGreaterThan(2.85);
  performance.apply(ROBOT_VACUUM_TIMELINE.circleEnd, 1);
  expect(motion.position.length()).toBeLessThan(1e-8);
  expect(performance.diagnostics.circleProgress).toBe(1);
  performance.apply(ROBOT_VACUUM_TIMELINE.settleEnd, 1);
  expect(motion.position.length()).toBeLessThan(1e-8);
  expect(Math.abs(motion.rotation.y)).toBeLessThan(1e-8);
  expect(performance.diagnostics.phase).toBe('complete');
});

test('robot vacuum owns only volumetric debris and visibly collects every preset item', () => {
  const model = createRobotVacuumModel({ id: 'robot-vacuum', accent: 0xe8aec4 });
  const field = model.root.getObjectByName('robot-vacuum-debris-field')!;
  expect(field.visible).toBe(false);
  const performance = createRobotVacuumPerformance(model.root);
  const required = ['paper-scrap', 'dust-clump', 'granules', 'fragment', 'hairball'];
  required.forEach((name) => expect(field.getObjectByName(`robot-vacuum-debris-${name}`)).toBeTruthy());
  field.traverse((object) => {
    expect(object instanceof THREE.Sprite).toBe(false);
    expect(object instanceof THREE.Line).toBe(false);
    if (object instanceof THREE.Mesh) expect(object.geometry.type).not.toBe('PlaneGeometry');
  });
  performance.apply(1.08, 1);
  expect(field.visible).toBe(true);
  expect(performance.diagnostics.visibleDebris).toBeGreaterThan(0);
  expect(performance.diagnostics.visibleSuctionLights).toBeGreaterThan(0);
  performance.apply(4.7, 1);
  expect(performance.diagnostics.collectedDebris).toBe(5);
  expect(performance.diagnostics.visibleDebris).toBe(0);
  const idle = pose(model.root);
  performance.apply(2.7, 1);
  expect(pose(model.root)).not.toBe(idle);
  performance.reset();
  expect(performance.diagnostics.phase).toBe('idle');
  expect(performance.diagnostics.visibleDebris).toBe(0);
  expect(field.visible).toBe(false);
});

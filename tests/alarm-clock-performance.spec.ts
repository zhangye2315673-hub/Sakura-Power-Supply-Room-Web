import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { createAlarmClockModel } from '../src/appliances/models/alarmClock';
import {
  ALARM_CLOCK_TIMELINE,
  createAlarmClockPerformance,
} from '../src/appliances/performance/AlarmClockPerformance';

function build() {
  return createAlarmClockModel({ id: 'alarm-clock', accent: 0xe58da8 });
}

function pose(root: THREE.Group): string {
  const names = [
    'alarm-clock-body-pivot',
    'alarm-clock-carry-handle-pivot',
    'alarm-clock-top-alarm-lever-pivot',
    'alarm-clock-bell-1-pivot',
    'alarm-clock-bell-2-pivot',
    'alarm-clock-hour-hand-pivot',
    'alarm-clock-minute-hand-pivot',
  ];
  return JSON.stringify(names.map((name) => {
    const node = root.getObjectByName(name)!;
    return [name, node.visible, ...node.position.toArray(), ...node.quaternion.toArray(), ...node.scale.toArray()];
  }));
}

function materialColor(root: THREE.Group, name: string): number {
  const mesh = root.getObjectByName(name) as THREE.Mesh<THREE.BufferGeometry, THREE.MeshToonMaterial>;
  return mesh.material.color.getHex();
}

test('alarm clock routes its complete painted shell and bell palette through the appliance accent', () => {
  const pink = createAlarmClockModel({ id: 'alarm-clock', accent: 0xe58da8 });
  const blue = createAlarmClockModel({ id: 'alarm-clock', accent: 0x56a8ff });
  const routedParts = [
    'alarm-clock-circular-shell',
    'alarm-clock-shell-front-band',
    'alarm-clock-bell-1-dome',
    'alarm-clock-bell-1-lower-lip',
    'alarm-clock-arched-carry-handle',
    'alarm-clock-top-alarm-lever-bar',
  ];

  routedParts.forEach((name) => {
    expect(materialColor(pink.root, name), `${name} should use pink route color`)
      .not.toBe(materialColor(blue.root, name));
  });
  expect(materialColor(pink.root, 'alarm-clock-ivory-dial'))
    .toBe(materialColor(blue.root, 'alarm-clock-ivory-dial'));
});

test('alarm clock is one rigid hierarchy with clearly enlarged twin bells', () => {
  const model = build();
  const body = model.root.getObjectByName('alarm-clock-body-pivot');
  expect(body).toBeTruthy();
  [
    'alarm-clock-carry-handle-pivot',
    'alarm-clock-top-alarm-lever-pivot',
    'alarm-clock-bell-1-pivot',
    'alarm-clock-bell-2-pivot',
    'alarm-clock-bell-hammer-1-pivot',
    'alarm-clock-bell-hammer-2-pivot',
  ].forEach((name) => expect(model.root.getObjectByName(name)?.parent).toBe(body));

  const bells = [1, 2].map((index) => model.root.getObjectByName(`alarm-clock-bell-${index}-dome`) as THREE.Mesh);
  expect(bells.every((bell) => bell.geometry.type === 'SphereGeometry')).toBe(true);
  expect(bells.every((bell) => Number((bell.geometry as THREE.SphereGeometry).parameters.radius) >= 0.5)).toBe(true);
  expect(model.root.userData.alarmClockEffectContract).toMatchObject({
    structuralRoot: 'alarm-clock-body-pivot',
    stereoWaveVolumes: 6,
    vibrationArcVolumes: 4,
    flatEffects: 0,
  });
});

test('ringing feedback is closed volumetric geometry with no Plane, Sprite or Line', () => {
  const model = build();
  const rig = model.root.getObjectByName('alarm-clock-ringing-feedback-rig');
  const geometryTypes: string[] = [];
  const forbidden: string[] = [];
  rig?.traverse((object) => {
    if (object instanceof THREE.Sprite || object instanceof THREE.Line) forbidden.push(object.name);
    if (!(object instanceof THREE.Mesh)) return;
    geometryTypes.push(object.geometry.type);
    if (object.geometry.type === 'PlaneGeometry') forbidden.push(object.name);
  });
  expect(forbidden).toEqual([]);
  expect(geometryTypes.filter((type) => type === 'TorusGeometry')).toHaveLength(6);
  expect(geometryTypes.filter((type) => type === 'TubeGeometry')).toHaveLength(4);
});

test('alarm clock reaches a frantic rigid-body climax with faster bells and hands', () => {
  const model = build();
  const performance = createAlarmClockPerformance(model.root);
  let maxShake = 0;
  let maxLift = 0;
  let maxRoll = 0;
  let maxBell = 0;
  for (let time = 3.2; time <= 4.1; time += 0.01) {
    performance.apply(time, 1);
    maxShake = Math.max(maxShake, Math.abs(performance.diagnostics.bodyShakeX));
    maxLift = Math.max(maxLift, performance.diagnostics.bodyLift);
    maxRoll = Math.max(maxRoll, Math.abs(performance.diagnostics.bodyRoll));
    maxBell = Math.max(maxBell, Math.abs(performance.diagnostics.leftBellOffset));
  }
  expect(maxShake).toBeGreaterThan(0.16);
  expect(maxLift).toBeGreaterThan(0.22);
  expect(maxRoll).toBeGreaterThan(0.13);
  expect(maxBell).toBeGreaterThan(0.32);

  performance.apply(3.42, 1);
  expect(performance.diagnostics.phase).toBe('climax');
  expect(performance.diagnostics.structureAttached).toBe(true);
  expect(performance.diagnostics.rigidBodyScale).toEqual([1, 1, 1]);
  expect(Math.abs(performance.diagnostics.minuteHandRadians)).toBeGreaterThan(
    Math.abs(performance.diagnostics.hourHandRadians) * 6,
  );
  expect(performance.diagnostics.visibleStereoWaves).toBeGreaterThan(0);
  expect(performance.diagnostics.visibleVibrationArcs).toBeGreaterThan(0);
  expect(performance.diagnostics.sharedSpectacleEffects).toBe('disabled');
});

test('same timestamp matches game and gallery and reset restores the exact rigid pose', () => {
  const game = build();
  const gallery = build();
  const gamePerformance = createAlarmClockPerformance(game.root);
  const galleryPerformance = createAlarmClockPerformance(gallery.root);
  const baseline = pose(game.root);
  gamePerformance.apply(2.36, 1);
  galleryPerformance.apply(2.36, 1);
  expect(pose(game.root)).toBe(pose(gallery.root));
  expect(gamePerformance.diagnostics).toEqual(galleryPerformance.diagnostics);
  gamePerformance.reset();
  expect(pose(game.root)).toBe(baseline);
  expect(game.root.userData.alarmClockPerformance).toBeUndefined();
  expect(gamePerformance.signal()).toBe(0);
  expect(ALARM_CLOCK_TIMELINE.settleEnd).toBe(5.2);
});

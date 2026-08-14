import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { createTelevisionModel } from '../src/appliances/models/television';
import {
  applyTelevisionPerformance,
  type TelevisionPerformanceDiagnostics,
} from '../src/appliances/performance/TelevisionPerformance';
import { createApplianceMechanicalAnimation } from '../src/appliances/performance/ApplianceMechanics';

function sample(time: number): {
  root: THREE.Group;
  diagnostics: TelevisionPerformanceDiagnostics;
} {
  const model = createTelevisionModel({ id: 'television', accent: 0xe8aec4 });
  applyTelevisionPerformance(model.root, time, 1);
  return {
    root: model.root,
    diagnostics: model.root.userData.televisionPerformanceDiagnostics as TelevisionPerformanceDiagnostics,
  };
}

test('television replaces the duplicate lower dial with explicit thick channel controls', () => {
  const model = createTelevisionModel({ id: 'television', accent: 0xe8aec4 });
  expect(model.root.getObjectByName('television-control-dial-2-pivot')).toBeUndefined();
  expect(model.root.getObjectByName('television-channel-selector-pivot')).not.toBeNull();

  for (let channel = 1; channel <= 3; channel += 1) {
    const button = model.root.getObjectByName(`television-channel-button-${channel}`) as THREE.Mesh;
    button.geometry.computeBoundingBox();
    const size = button.geometry.boundingBox!.getSize(new THREE.Vector3());
    expect(size.z, `channel ${channel} key must have visible physical depth`).toBeGreaterThan(0.1);
    expect(button.userData.controlAction).toBe(`select-channel-${channel}`);
    expect(model.root.getObjectByName(`television-channel-${channel}-${channel === 1 ? 'sakura' : channel === 2 ? 'test-card' : 'night-city'}`)).not.toBeNull();
  }
});

test('every physical channel action is synchronized with the selected programme and static flash', () => {
  const firstSwitch = sample(0.94);
  expect(firstSwitch.diagnostics.selectedChannel).toBe(2);
  expect(firstSwitch.diagnostics.pressedChannelButton).toBe(2);
  expect(firstSwitch.diagnostics.staticVisible).toBe(true);
  expect(firstSwitch.diagnostics.selectorAngle).toBeCloseTo(0, 6);

  const secondSwitch = sample(1.84);
  expect(secondSwitch.diagnostics.selectedChannel).toBe(3);
  expect(secondSwitch.diagnostics.pressedChannelButton).toBe(3);
  expect(secondSwitch.diagnostics.staticVisible).toBe(true);
  expect(secondSwitch.diagnostics.selectorAngle).toBeCloseTo(0.82, 6);

  const stableChannel = sample(2.3);
  expect(stableChannel.diagnostics.selectedChannel).toBe(3);
  expect(stableChannel.diagnostics.pressedChannelButton).toBeNull();
  expect(stableChannel.diagnostics.staticVisible).toBe(false);
  expect(stableChannel.diagnostics.visibleProgrammeCount).toBe(1);
});

test('rapid surf uses model-owned snow and the shutdown collapses image to line then dot', () => {
  const rapid = sample(3.28);
  expect(rapid.diagnostics.phase).toBe('rapid-channel-surf');
  expect(rapid.diagnostics.selectedChannel).toBe(3);
  expect(rapid.diagnostics.pressedChannelButton).toBe(3);
  expect(rapid.diagnostics.staticVisible).toBe(true);
  expect(rapid.root.getObjectByName('television-static-snow-group')!.visible).toBe(true);
  expect(rapid.root.userData.televisionPerformanceRig.forbiddenGenericEffects).toContain('debris-particles');

  const line = sample(4.7).diagnostics;
  expect(line.phase).toBe('power-off-line-collapse');
  expect(line.selectedChannel).toBeNull();
  expect(line.shutdownLineVisible).toBe(true);
  expect(line.pictureScale[1]).toBeLessThan(line.pictureScale[0] * 0.35);

  const dot = sample(4.96).diagnostics;
  expect(dot.shutdownLineVisible).toBe(true);
  expect(dot.shutdownLineScale[0]).toBeLessThan(0.2);

  const dark = sample(5.16).diagnostics;
  expect(dark.phase).toBe('dark');
  expect(dark.shutdownLineVisible).toBe(false);
});

test('television v2 preserves one timeline owner and restores every animated node exactly', () => {
  const model = createTelevisionModel({ id: 'television', accent: 0xe8aec4 });
  const animation = createApplianceMechanicalAnimation('television', model.root);
  const names = [
    'television-picture-pivot', 'television-static-snow-group',
    'television-channel-selector-pivot', 'television-channel-button-1-pivot',
    'television-channel-button-2-pivot', 'television-channel-button-3-pivot',
    'television-power-button-pivot', 'television-scanline-pivot',
  ];
  const snapshot = () => names.map((name) => {
    const node = model.root.getObjectByName(name)!;
    return {
      name, position: node.position.toArray(), quaternion: node.quaternion.toArray(),
      scale: node.scale.toArray(), visible: node.visible,
    };
  });
  const before = snapshot();
  animation.update(2.8, 1);
  expect(model.root.userData.televisionPerformanceDiagnostics.timelineOwner).toBe('AppliancePerformanceSystem');
  expect(snapshot()).not.toEqual(before);
  animation.stop();
  expect(snapshot()).toEqual(before);
  expect(model.root.userData.televisionPerformanceDiagnostics).toBeUndefined();
});

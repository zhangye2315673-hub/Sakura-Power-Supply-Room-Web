import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import {
  PORTABLE_SPEAKER_SPACING_MULTIPLIER,
  PORTABLE_SPEAKER_SPACING_RELEASE_DURATION,
  PortableSpeakerSpacingPresentation,
  portableSpeakerSpacingMultiplierAt,
} from '../src/skill/PortableSpeakerSpacingPresentation';
import type { ArrowDefinition } from '../src/puzzle/types';
import { PlugCableModel } from '../src/render/PlugCableModel';

test('便携音箱按共享节拍扩距且只把线缆表面净空加倍', () => {
  expect(portableSpeakerSpacingMultiplierAt(0.38)).toBeLessThan(1);
  expect(portableSpeakerSpacingMultiplierAt(0.485)).toBeGreaterThan(1);

  const presentation = new PortableSpeakerSpacingPresentation();
  const applied = new Map<string, THREE.Vector3>();
  const targets = [-0.8, 0.8].map((x, index) => ({
    id: `speaker-spacing-${index + 1}`,
    center: new THREE.Vector3(x, 0, 0),
    clearanceSegments: [{
      start: new THREE.Vector3(x - 0.5, 0, 0),
      end: new THREE.Vector3(x + 0.5, 0, 0),
      radius: 0.1,
    }],
    setOffset: (offset: THREE.Vector3) => applied.set(`speaker-spacing-${index + 1}`, offset.clone()),
  }));
  const originalCenterDistance = targets[0].center.distanceTo(targets[1].center);
  const originalSurfaceGap = originalCenterDistance - 1 - 0.2;

  presentation.start(targets);
  presentation.update(presentation.durationMs / 1_000, targets);

  expect(presentation.phase).toBe('holding');
  expect(presentation.diagnostics.multiplier).toBe(PORTABLE_SPEAKER_SPACING_MULTIPLIER);
  expect(presentation.diagnostics.referenceSurfaceGap).toBeCloseTo(originalSurfaceGap, 5);
  const left = targets[0].center.clone().add(applied.get(targets[0].id)!);
  const right = targets[1].center.clone().add(applied.get(targets[1].id)!);
  const finalCenterDistance = left.distanceTo(right);
  const finalSurfaceGap = finalCenterDistance - 1 - 0.2;
  expect(finalSurfaceGap).toBeCloseTo(originalSurfaceGap * 2, 5);
  expect(finalCenterDistance).toBeLessThan(originalCenterDistance * 2);

  const thickTargets = targets.map((target) => ({
    ...target,
    clearanceSegments: target.clearanceSegments.map((segment) => ({ ...segment, radius: 0.15 })),
  }));
  presentation.sync(true, thickTargets);
  expect(presentation.diagnostics.referenceSurfaceGap).toBeCloseTo(originalCenterDistance - 1 - 0.3, 5);

  presentation.sync(false, thickTargets);
  presentation.update(PORTABLE_SPEAKER_SPACING_RELEASE_DURATION, thickTargets);
  expect(presentation.phase).toBe('idle');
  expect([...applied.values()].every((offset) => offset.length() < 0.00001)).toBe(true);
});

test('技能状态先到达时仍从压缩膨胀节拍开始，而不是直接跳到 holding', () => {
  const presentation = new PortableSpeakerSpacingPresentation();
  const offsets = new Map<string, THREE.Vector3>();
  const targets = [-0.7, 0.7].map((x, index) => ({
    id: `sync-before-start-${index}`,
    center: new THREE.Vector3(x, 0, 0),
    clearanceSegments: [{
      start: new THREE.Vector3(x - 0.35, 0, 0),
      end: new THREE.Vector3(x + 0.35, 0, 0),
      radius: 0.1,
    }],
    setOffset: (offset: THREE.Vector3) => offsets.set(`sync-before-start-${index}`, offset.clone()),
  }));

  presentation.sync(true, targets);
  expect(presentation.phase).toBe('pulsing');
  expect(presentation.diagnostics.timeline).toBe(0);
  presentation.update(0.49, targets);
  expect(presentation.phase).toBe('pulsing');
  expect(presentation.diagnostics.multiplier).toBeLessThan(PORTABLE_SPEAKER_SPACING_MULTIPLIER);
  expect([...offsets.values()].some((offset) => offset.length() > 0)).toBe(true);
});

test('便携音箱扩距叠加到线组当前姿态，释放后不把插头传送回原点', () => {
  const definition: ArrowDefinition = {
    id: 'speaker-preserve-live-root',
    path: [[3, 3, 3], [4, 3, 3], [5, 3, 3]],
    exitDirection: '+X',
    color: 0x56a8ff,
    lengthClass: 'short',
  };
  const model = new PlugCableModel(definition, 'round-two-pin');
  const liveRootPosition = new THREE.Vector3(1.35, -0.42, 0.76);
  const spacingOffset = new THREE.Vector3(0.24, 0.08, -0.12);
  model.root.position.copy(liveRootPosition);

  model.setBundleSpacingOffset(spacingOffset);
  expect(model.root.position.toArray()).toEqual(
    liveRootPosition.clone().add(spacingOffset).toArray(),
  );

  model.setBundleSpacingOffset(null);
  expect(model.root.position.toArray()).toEqual(liveRootPosition.toArray());
  model.dispose();
});

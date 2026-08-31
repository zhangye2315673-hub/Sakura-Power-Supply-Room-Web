import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import {
  PORTABLE_SPEAKER_SPACING_MULTIPLIER,
  PORTABLE_SPEAKER_SPACING_RELEASE_DURATION,
  PortableSpeakerSpacingPresentation,
  portableSpeakerSpacingMultiplierAt,
} from '../src/skill/PortableSpeakerSpacingPresentation';

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

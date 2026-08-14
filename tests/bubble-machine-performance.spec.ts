import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { createBubbleMachineModel } from '../src/appliances/models/bubbleMachine';
import {
  BUBBLE_MACHINE_TIMELINE,
  createBubbleMachinePerformance,
} from '../src/appliances/performance/BubbleMachinePerformance';

function bubbleGroups(root: THREE.Group): THREE.Group[] {
  const result: THREE.Group[] = [];
  root.traverse((object) => {
    if (object instanceof THREE.Group && /^bubble-machine-performance-bubble-\d+$/.test(object.name)) {
      result.push(object);
    }
  });
  return result.sort((first, second) => (
    Number(first.name.match(/(\d+)$/)?.[1]) - Number(second.name.match(/(\d+)$/)?.[1])
  ));
}

function pose(root: THREE.Group): string {
  const values: Array<[string, number[], boolean]> = [];
  root.traverse((object) => {
    values.push([
      object.name || object.type,
      [
        object.position.x, object.position.y, object.position.z,
        object.quaternion.x, object.quaternion.y, object.quaternion.z, object.quaternion.w,
        object.scale.x, object.scale.y, object.scale.z,
      ].map((value) => Number(value.toFixed(7))),
      object.visible,
    ]);
  });
  return JSON.stringify(values);
}

test('bubble machine owns 48 visible-ready volumetric iridescent bubbles with four clear sizes', () => {
  const model = createBubbleMachineModel({ id: 'bubble-machine', accent: 0xe8aec4, referencePath: null });
  const rig = model.root.getObjectByName('bubble-machine-performance-rig') as THREE.Group;
  const bubbles = bubbleGroups(model.root);
  const forbidden: string[] = [];
  rig.traverse((object) => {
    if (object instanceof THREE.Sprite || object instanceof THREE.Line) {
      forbidden.push(`${object.name}:${object.type}`);
    }
    if (object instanceof THREE.Mesh && object.geometry.type === 'PlaneGeometry') {
      forbidden.push(`${object.name}:${object.geometry.type}`);
    }
  });

  expect(bubbles).toHaveLength(BUBBLE_MACHINE_TIMELINE.ordinaryBubbleCount);
  expect(BUBBLE_MACHINE_TIMELINE.ordinaryBubbleCount)
    .toBeGreaterThan(BUBBLE_MACHINE_TIMELINE.previousGenericPoolCapacity);
  expect(forbidden).toEqual([]);

  const sizeClasses = new Set(bubbles.map((bubble) => bubble.userData.sizeClass as string));
  const radii = bubbles.map((bubble) => Number(bubble.userData.baseRadius));
  expect([...sizeClasses].sort()).toEqual(['hero-large', 'large', 'medium', 'small']);
  expect(Math.max(...radii) / Math.min(...radii)).toBeGreaterThan(2.5);
  expect(Math.min(...bubbles.map((bubble) => Number(bubble.userData.configuredTravelDistance))))
    .toBeGreaterThan(12);

  for (const bubble of bubbles) {
    const shell = bubble.getObjectByName(`${bubble.name}-film-shell`) as THREE.Mesh;
    const warmArc = bubble.getObjectByName(`${bubble.name}-rainbow-arc-warm`) as THREE.Mesh;
    const coolArc = bubble.getObjectByName(`${bubble.name}-rainbow-arc-cool`) as THREE.Mesh;
    const highlight = bubble.getObjectByName(`${bubble.name}-soft-highlight`) as THREE.Mesh;
    const filmMaterial = shell.material as THREE.MeshPhysicalMaterial;
    expect(shell.geometry.type).toBe('SphereGeometry');
    expect(filmMaterial.type).toBe('MeshPhysicalMaterial');
    expect(filmMaterial.transparent).toBe(true);
    expect(filmMaterial.opacity).toBeGreaterThanOrEqual(0.35);
    expect(filmMaterial.iridescence).toBe(1);
    expect(warmArc.geometry.type).toBe('TorusGeometry');
    expect(coolArc.geometry.type).toBe('TorusGeometry');
    expect(highlight.geometry.type).toBe('SphereGeometry');
  }

  const giant = model.root.getObjectByName('bubble-machine-giant-bubble') as THREE.Group;
  const burstFragments = rig.children
    .flatMap((object) => object.children)
    .filter((object) => /^bubble-machine-burst-(?:mini-bubble|light-point)-\d+$/.test(object.name));
  expect(Number(giant.userData.baseRadius)).toBeGreaterThan(Math.max(...radii) * 2.8);
  expect(burstFragments).toHaveLength(BUBBLE_MACHINE_TIMELINE.burstFragmentCount);
  expect(burstFragments.length).toBeLessThanOrEqual(10);
  expect(model.root.userData.bubbleMachinePerformanceRig.sharedSpectacleEffects).toBe('disabled');
});

test('bubble machine stream drifts, rises, spreads beyond twice the old range, then a giant bubble bursts', () => {
  const model = createBubbleMachineModel({ id: 'bubble-machine', accent: 0xe8aec4, referencePath: null });
  const performance = createBubbleMachinePerformance(model.root);
  const bubbles = bubbleGroups(model.root);
  const firstBubble = bubbles[0];
  const giant = model.root.getObjectByName('bubble-machine-giant-bubble') as THREE.Group;
  const idle = pose(model.root);

  performance.apply(0.85, 1);
  const early = firstBubble.position.clone();
  performance.apply(1.35, 1);
  const later = firstBubble.position.clone();
  expect(later.y).toBeGreaterThan(early.y);
  expect(later.z).toBeGreaterThan(early.z);
  expect(Math.abs(later.x + 0.76)).toBeGreaterThan(Math.abs(early.x + 0.76));

  performance.apply(2.92, 1);
  expect(performance.diagnostics.phase).toBe('bubble-stream');
  expect(performance.diagnostics.visibleOrdinaryBubbles).toBe(48);
  expect(performance.diagnostics.minimumConfiguredTravelDistance).toBeGreaterThan(12);
  expect(performance.diagnostics.currentMaximumTravelDistance).toBeGreaterThan(10);
  expect(performance.diagnostics.currentLateralSpread).toBeGreaterThan(16);
  expect(performance.diagnostics.currentHeightSpread).toBeGreaterThan(2);
  expect(performance.diagnostics.maximumFlightDuration)
    .toBeGreaterThan(performance.diagnostics.minimumFlightDuration + 0.9);
  expect(performance.diagnostics.maximumDriftRate)
    .toBeGreaterThan(performance.diagnostics.minimumDriftRate + 0.6);

  performance.apply(4.54, 1);
  expect(performance.diagnostics.phase).toBe('giant-rise');
  expect(performance.diagnostics.giantBubbleVisible).toBe(true);
  expect(performance.diagnostics.giantBubbleTopY).toBeGreaterThan(8);
  expect(giant.scale.x).toBeGreaterThan(0.85);

  performance.apply(4.68, 1);
  expect(performance.diagnostics.phase).toBe('giant-burst');
  expect(performance.diagnostics.giantBubbleVisible).toBe(false);
  expect(performance.diagnostics.visibleBurstFragments).toBe(8);
  expect(performance.diagnostics.allEffectsVolumetric).toBe(true);
  expect(performance.diagnostics.sharedSpectacleEffects).toBe('disabled');

  performance.reset();
  expect(pose(model.root)).toBe(idle);
  expect(performance.signal()).toBe(0);
  expect(performance.diagnostics.phase).toBe('idle');
});

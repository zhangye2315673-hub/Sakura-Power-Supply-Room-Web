import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { createPopcornMachineModel } from '../src/appliances/models/popcornMachine';
import {
  createPopcornMachinePerformance,
  POPCORN_MACHINE_TIMELINE,
} from '../src/appliances/performance/PopcornMachinePerformance';

function performancePose(root: THREE.Group): string {
  const values: Array<[string, boolean, number[]]> = [];
  root.traverse((object) => {
    if (!/^popcorn-machine-(?:popper-pivot|unpopped-seed-|powered-pop-|outward-pop-)/.test(object.name)) return;
    values.push([
      object.name,
      object.visible,
      [
        ...object.position.toArray(),
        ...object.quaternion.toArray(),
        ...object.scale.toArray(),
      ].map((value) => Number(value.toFixed(7))),
    ]);
  });
  return JSON.stringify(values);
}

test('inside and outside popcorn use the exact same 3D geometry and material language', () => {
  const model = createPopcornMachineModel({ id: 'popcorn-machine', accent: 0xe8aec4 });
  const chute = model.root.getObjectByName('popcorn-machine-deep-arched-delivery-chute') as THREE.Mesh;
  const chuteBack = model.root.getObjectByName('popcorn-machine-delivery-chute-back-wall') as THREE.Mesh;
  const socket = model.root.getObjectByName('popcorn-machine-dispense-socket') as THREE.Object3D;
  const chuteShapes = (chute.geometry as THREE.ExtrudeGeometry).parameters.shapes;
  const chuteShape = Array.isArray(chuteShapes) ? chuteShapes[0] : chuteShapes;
  const backShapes = (chuteBack.geometry as THREE.ExtrudeGeometry).parameters.shapes;
  const backShape = Array.isArray(backShapes) ? backShapes[0] : backShapes;
  expect(chuteShape.holes).toHaveLength(1);
  expect(backShape.holes).toHaveLength(1);
  expect(socket.position.y).toBeLessThan(0.9);
  const internal: THREE.Mesh[] = [];
  const external: THREE.Mesh[] = [];
  model.root.traverse((object) => {
    expect(object instanceof THREE.Sprite, `${object.name} must not be a Sprite`).toBe(false);
    expect(object instanceof THREE.Line, `${object.name} must not be a Line`).toBe(false);
    if (!(object instanceof THREE.Mesh)) return;
    if (object.name.startsWith('popcorn-machine-powered-pop-')) internal.push(object);
    if (object.name.startsWith('popcorn-machine-outward-pop-')) external.push(object);
  });

  expect(internal).toHaveLength(POPCORN_MACHINE_TIMELINE.poweredPieceCount);
  expect(external).toHaveLength(POPCORN_MACHINE_TIMELINE.externalPieceCount);
  const interiorGeometries = new Set(internal.map((piece) => piece.geometry));
  const interiorMaterials = new Set(internal.map((piece) => piece.material));
  expect(interiorGeometries.size).toBe(1);
  expect(external.every((piece) => interiorGeometries.has(piece.geometry))).toBe(true);
  expect(external.every((piece) => interiorMaterials.has(piece.material))).toBe(true);
  expect(external.every((piece) => !(piece.geometry instanceof THREE.PlaneGeometry))).toBe(true);
  expect(model.root.userData.popcornMachinePerformanceRig).toMatchObject({
    internalPieceCount: 80,
    staticPieceCount: 56,
    poweredPieceCount: 24,
    externalPieceCount: 48,
    direction: 'chamber-to-front-outlet-to-positive-z-exterior',
    sharedSpectacleEffects: 'must-be-disabled-during-integration',
  });
});

test('every packed chamber popcorn instance participates in the powered jumping motion', () => {
  const model = createPopcornMachineModel({ id: 'popcorn-machine', accent: 0xe8aec4 });
  const performance = createPopcornMachinePerformance(model.root);
  const batches: THREE.InstancedMesh[] = [];
  model.root.traverse((object) => {
    if (object instanceof THREE.InstancedMesh && object.name.includes('popped-kernel')) batches.push(object);
  });
  const rest = batches.map((batch) => Array.from(batch.instanceMatrix.array));

  performance.apply(1.63, 1);
  const moving = batches.reduce((count, batch, batchIndex) => {
    const before = rest[batchIndex];
    const after = Array.from(batch.instanceMatrix.array);
    for (let instance = 0; instance < batch.count; instance += 1) {
      const offset = instance * 16;
      const changed = after.slice(offset, offset + 16)
        .some((value, component) => Math.abs(value - before[offset + component]) > 1e-5);
      if (changed) count += 1;
    }
    return count;
  }, 0);

  expect(moving).toBe(56);
  expect(performance.diagnostics.staticPieceCount).toBe(56);
  expect(performance.diagnostics.animatedStaticPieces).toBe(56);
});

test('dedicated performance makes a dense high-frequency chamber eruption and varied outward burst', () => {
  const model = createPopcornMachineModel({ id: 'popcorn-machine', accent: 0xe8aec4 });
  const performance = createPopcornMachinePerformance(model.root);
  let greatestJump = 0;
  let greatestJumpingCount = 0;
  let greatestExternalCount = 0;
  let frontmostZ = 0;
  for (let frame = 0; frame <= 624; frame += 1) {
    performance.apply(frame / 120, 1);
    greatestJump = Math.max(greatestJump, performance.diagnostics.maximumInternalJumpHeight);
    greatestJumpingCount = Math.max(greatestJumpingCount, performance.diagnostics.internalJumping);
    greatestExternalCount = Math.max(greatestExternalCount, performance.diagnostics.visibleExternal);
    frontmostZ = Math.max(frontmostZ, performance.diagnostics.externalFrontmostZ);
  }

  expect(performance.diagnostics.internalPieceCount).toBe(80);
  expect(performance.diagnostics.minimumInternalFrequencyHz).toBeGreaterThanOrEqual(7.4);
  expect(performance.diagnostics.maximumInternalFrequencyHz).toBeGreaterThan(9);
  expect(greatestJump).toBeGreaterThan(0.62);
  expect(greatestJumpingCount).toBeGreaterThanOrEqual(60);
  expect(greatestExternalCount).toBeGreaterThanOrEqual(18);
  expect(frontmostZ).toBeGreaterThan(6.5);
  expect(performance.diagnostics.outwardMinimumDistance).toBeGreaterThan(5.5);
  expect(performance.diagnostics.peakHeightSpread).toBeGreaterThan(0.7);
  expect(performance.diagnostics.externalGeometryMatchesInterior).toBe(true);
  expect(performance.diagnostics.externalMaterialMatchesInterior).toBe(true);
  expect(performance.diagnostics.direction).toBe('inside-to-outside-positive-z');
});

test('outward paths preserve direction while launch, height and rotation stay staggered', () => {
  const model = createPopcornMachineModel({ id: 'popcorn-machine', accent: 0xe8aec4 });
  model.root.updateMatrixWorld(true);
  const socket = model.root.getObjectByName('popcorn-machine-dispense-socket') as THREE.Object3D;
  const socketPosition = socket.getWorldPosition(new THREE.Vector3());
  const launches = new Set<number>();
  const crestHeights = new Set<number>();
  const spins = new Set<string>();
  for (let index = 1; index <= POPCORN_MACHINE_TIMELINE.externalPieceCount; index += 1) {
    const piece = model.root.getObjectByName(`popcorn-machine-outward-pop-${index}`) as THREE.Mesh;
    const path = piece.userData.performancePath as number[][];
    expect(path).toHaveLength(4);
    expect(path[0][0]).toBeCloseTo(socketPosition.x, 5);
    expect(path[0][1]).toBeCloseTo(socketPosition.y, 5);
    expect(path[0][2]).toBeCloseTo(socketPosition.z, 5);
    expect(path[0][1]).toBeLessThan(0.9);
    expect(path[1][1]).toBeLessThan(0.9);
    expect(path[0][2]).toBeLessThan(path[1][2]);
    expect(path[1][2]).toBeLessThan(path[2][2]);
    expect(path[2][2]).toBeLessThan(path[3][2]);
    launches.add(Number(piece.userData.performanceLaunchTime));
    crestHeights.add(path[2][1]);
    spins.add(JSON.stringify(piece.userData.performanceRotationRate));
  }
  expect(launches.size).toBe(48);
  expect(crestHeights.size).toBeGreaterThanOrEqual(5);
  expect(spins.size).toBeGreaterThanOrEqual(12);
});

test('outward spray remains dense late in the performance instead of disappearing in one short burst', () => {
  const model = createPopcornMachineModel({ id: 'popcorn-machine', accent: 0xe8aec4 });
  const performance = createPopcornMachinePerformance(model.root);
  performance.apply(4.3, 1);
  expect(performance.diagnostics.visibleExternal).toBeGreaterThanOrEqual(18);
  expect(performance.diagnostics.externalFrontmostZ).toBeGreaterThan(5.5);
});

test('same timestamp is deterministic and reset restores the exact popcorn rig pose', () => {
  const game = createPopcornMachineModel({ id: 'popcorn-machine', accent: 0xe8aec4 });
  const gallery = createPopcornMachineModel({ id: 'popcorn-machine', accent: 0xe8aec4 });
  const gamePerformance = createPopcornMachinePerformance(game.root);
  const galleryPerformance = createPopcornMachinePerformance(gallery.root);
  const idle = performancePose(game.root);

  gamePerformance.apply(3.64, 1);
  galleryPerformance.apply(3.64, 1);
  expect(performancePose(game.root)).toBe(performancePose(gallery.root));
  expect(gamePerformance.diagnostics).toEqual(galleryPerformance.diagnostics);
  expect(performancePose(game.root)).not.toBe(idle);

  gamePerformance.reset();
  expect(performancePose(game.root)).toBe(idle);
  expect(gamePerformance.signal()).toBe(0);
  expect(gamePerformance.diagnostics.phase).toBe('idle');
});

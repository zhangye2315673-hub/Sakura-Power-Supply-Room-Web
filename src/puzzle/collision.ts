import * as THREE from 'three';
import {
  COLLISION_RADIUS,
  DIRECTION_VECTORS,
  EXIT_DISTANCE,
  LANE_PITCH,
  gridPointToWorld,
  type ArrowDefinition,
  type ArrowRuntime,
  type CableEnd,
  type DirectionKey,
  directionKeyFromDelta,
} from './types';

export type ExitCheck = {
  clear: boolean;
  blockerId: string | null;
  contact: THREE.Vector3 | null;
};

type SpatialPoint = {
  arrowId: string;
  point: THREE.Vector3;
};

const SPATIAL_CELL_SIZE = COLLISION_RADIUS * 2;
const SPATIAL_KEY_OFFSET = 128;
const SPATIAL_KEY_STRIDE = 256;

function spatialCoordinate(value: number): number {
  return Math.floor(value / SPATIAL_CELL_SIZE);
}

function spatialKey(x: number, y: number, z: number): number {
  return (
    (x + SPATIAL_KEY_OFFSET) * SPATIAL_KEY_STRIDE * SPATIAL_KEY_STRIDE +
    (y + SPATIAL_KEY_OFFSET) * SPATIAL_KEY_STRIDE +
    z +
    SPATIAL_KEY_OFFSET
  );
}

export function sampleArrowPath(definition: ArrowDefinition): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const spacing = LANE_PITCH * 0.2;

  for (let index = 0; index < definition.path.length - 1; index += 1) {
    const start = gridPointToWorld(definition.path[index]);
    const end = gridPointToWorld(definition.path[index + 1]);
    const distance = start.distanceTo(end);
    const steps = Math.max(2, Math.ceil(distance / spacing));
    for (let step = 0; step <= steps; step += 1) {
      if (index > 0 && step === 0) continue;
      points.push(start.clone().lerp(end, step / steps));
    }
  }
  return points;
}

export function makeRuntime(definition: ArrowDefinition): ArrowRuntime {
  return {
    definition,
    samplePoints: sampleArrowPath(definition),
    state: 'idle',
  };
}

export function checkArrowExit(
  candidate: ArrowRuntime,
  arrows: readonly ArrowRuntime[],
): ExitCheck {
  return checkCableEndExit(candidate, arrows, 'head');
}

export function cableEndsFor(definition: ArrowDefinition): readonly CableEnd[] {
  return definition.doubleEnded ? ['head', 'tail'] : ['head'];
}

export function cableEndDirection(
  definition: ArrowDefinition,
  end: CableEnd,
): DirectionKey {
  if (end === 'head') return definition.exitDirection;
  const start = definition.path[0];
  const next = definition.path[1];
  return directionKeyFromDelta([
    Math.sign(start[0] - next[0]),
    Math.sign(start[1] - next[1]),
    Math.sign(start[2] - next[2]),
  ]);
}

export function checkCableEndExit(
  candidate: ArrowRuntime,
  arrows: readonly ArrowRuntime[],
  end: CableEnd,
): ExitCheck {
  return checkCableEndAgainstSharedIndex(
    candidate,
    end,
    buildSharedBlockerIndex(arrows),
  );
}

function buildSharedBlockerIndex(arrows: readonly ArrowRuntime[]): Map<number, SpatialPoint[]> {
  const blockerCells = new Map<number, SpatialPoint[]>();
  for (const other of arrows) {
    if (other.state === 'removed' || other.state === 'moving') continue;
    for (const point of other.samplePoints) {
      const key = spatialKey(
        spatialCoordinate(point.x),
        spatialCoordinate(point.y),
        spatialCoordinate(point.z),
      );
      const cell = blockerCells.get(key);
      const spatialPoint = { arrowId: other.definition.id, point };
      if (cell) cell.push(spatialPoint);
      else blockerCells.set(key, [spatialPoint]);
    }
  }
  return blockerCells;
}

function checkCableEndAgainstSharedIndex(
  candidate: ArrowRuntime,
  end: CableEnd,
  blockerCells: ReadonlyMap<number, SpatialPoint[]>,
): ExitCheck {
  const direction = DIRECTION_VECTORS[cableEndDirection(candidate.definition, end)];
  const collisionDistanceSq = (COLLISION_RADIUS * 2) ** 2;
  const stepSize = LANE_PITCH * 0.17;
  const headPoint = end === 'head'
    ? candidate.samplePoints[candidate.samplePoints.length - 1]
    : candidate.samplePoints[0];
  const adjacentBodyPoints = ownAdjacentBodyPoints(candidate, end, stepSize + COLLISION_RADIUS * 2);
  const movingPoint = new THREE.Vector3();
  for (let distance = stepSize; distance <= EXIT_DISTANCE; distance += stepSize) {
    movingPoint.copy(headPoint).addScaledVector(direction, distance);
    const cellX = spatialCoordinate(movingPoint.x);
    const cellY = spatialCoordinate(movingPoint.y);
    const cellZ = spatialCoordinate(movingPoint.z);
    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
      for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
        for (let offsetZ = -1; offsetZ <= 1; offsetZ += 1) {
          const cell = blockerCells.get(spatialKey(
            cellX + offsetX,
            cellY + offsetY,
            cellZ + offsetZ,
          ));
          const blocker = cell?.find((candidateBlocker) => {
            if (movingPoint.distanceToSquared(candidateBlocker.point) >= collisionDistanceSq) return false;
            if (candidateBlocker.arrowId !== candidate.definition.id) return true;
            return !adjacentBodyPoints.has(candidateBlocker.point);
          });
          if (blocker) {
            return {
              clear: false,
              blockerId: blocker.arrowId,
              contact: movingPoint.clone(),
            };
          }
        }
      }
    }
  }
  return { clear: true, blockerId: null, contact: null };
}

function ownAdjacentBodyPoints(
  candidate: ArrowRuntime,
  end: CableEnd,
  clearance: number,
): Set<THREE.Vector3> {
  const points = end === 'head' ? [...candidate.samplePoints].reverse() : candidate.samplePoints;
  const adjacent = new Set<THREE.Vector3>();
  let travelled = 0;
  for (let index = 0; index < points.length; index += 1) {
    if (index > 0) travelled += points[index - 1].distanceTo(points[index]);
    if (travelled > clearance) break;
    adjacent.add(points[index]);
  }
  return adjacent;
}

export type AvailableCableEnd = Readonly<{ id: string; end: CableEnd }>;

export function availableCableEnds(
  runtimes: readonly ArrowRuntime[],
): AvailableCableEnd[] {
  const available: AvailableCableEnd[] = [];
  const blockerIndex = buildSharedBlockerIndex(runtimes);
  for (const runtime of runtimes) {
    if (runtime.state !== 'idle') continue;
    for (const end of cableEndsFor(runtime.definition)) {
      if (checkCableEndAgainstSharedIndex(runtime, end, blockerIndex).clear) {
        available.push({ id: runtime.definition.id, end });
      }
    }
  }
  return available;
}

export function findDoubleEndedRemovalSequence(
  definitions: readonly ArrowDefinition[],
): AvailableCableEnd[] | null {
  const runtimes = definitions.map(makeRuntime);
  const sequence: AvailableCableEnd[] = [];

  while (sequence.length < runtimes.length) {
    const removable = availableCableEnds(runtimes)[0];
    if (!removable) return null;
    const runtime = runtimes.find((candidate) => candidate.definition.id === removable.id);
    if (!runtime) return null;
    runtime.state = 'removed';
    sequence.push(removable);
  }

  return sequence;
}

export function findRemovalSequence(definitions: ArrowDefinition[]): string[] | null {
  const runtimes = definitions.map(makeRuntime);
  const sequence: string[] = [];

  while (sequence.length < runtimes.length) {
    const removable = runtimes.find(
      (arrow) => arrow.state !== 'removed' && checkArrowExit(arrow, runtimes).clear,
    );
    if (!removable) return null;
    removable.state = 'removed';
    sequence.push(removable.definition.id);
  }

  return sequence;
}

export function countInitiallyFree(definitions: ArrowDefinition[]): number {
  const runtimes = definitions.map(makeRuntime);
  if (definitions.some((definition) => definition.doubleEnded)) {
    return availableCableEnds(runtimes).length;
  }
  return runtimes.filter((arrow) => checkArrowExit(arrow, runtimes).clear).length;
}

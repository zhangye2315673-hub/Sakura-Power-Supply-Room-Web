import { checkArrowExit, makeRuntime } from './collision';
import { pointInsideShape } from './shapes';
import {
  DIRECTION_VECTORS,
  type ArrowDefinition,
  type GridExtents,
  type GridPoint,
  type ShapeId,
} from './types';

export type DifficultySnapshot = {
  remaining: number;
  free: number;
  obvious: number;
};

export type RandomDifficultyCurve = {
  opening: DifficultySnapshot;
  firstGate: DifficultySnapshot;
  centralGate: DifficultySnapshot;
  release: DifficultySnapshot;
};

export type WiringComplexity = {
  averageLength: number;
  averageTurns: number;
  threeAxisShare: number;
  planarShare: number;
};

export function measureWiringComplexity(
  definitions: readonly ArrowDefinition[],
): WiringComplexity {
  const metrics = definitions.map((definition) => {
    const axes = new Set<number>();
    let length = 0;
    for (let index = 0; index < definition.path.length - 1; index += 1) {
      for (let axis = 0; axis < 3; axis += 1) {
        const distance = Math.abs(definition.path[index + 1][axis] - definition.path[index][axis]);
        if (distance > 0) axes.add(axis);
        length += distance;
      }
    }
    return { length, axes: axes.size, turns: Math.max(0, definition.path.length - 2) };
  });
  const count = Math.max(1, metrics.length);
  return {
    averageLength: metrics.reduce((sum, metric) => sum + metric.length, 0) / count,
    averageTurns: metrics.reduce((sum, metric) => sum + metric.turns, 0) / count,
    threeAxisShare: metrics.filter((metric) => metric.axes === 3).length / count,
    planarShare: metrics.filter((metric) => metric.axes <= 2).length / count,
  };
}

export function hardWiringChecks(complexity: WiringComplexity): Record<string, boolean> {
  return {
    spatialLength: complexity.averageLength >= 7,
    spatialTurns: complexity.averageTurns >= 2.8,
    spatialAxes: complexity.threeAxisShare >= 0.7,
  };
}

export function desiredHardFreeCount(currentCount: number, totalCount: number): number {
  const releaseTarget = Math.max(4, Math.round(totalCount * 0.12));
  if (currentCount <= Math.ceil(totalCount * 0.25)) {
    return Math.min(currentCount, releaseTarget);
  }
  // This is the backwards-authoring target, not the final number shown to the
  // player. Some newly inserted cables cannot physically cross an existing
  // exit lane, so aiming below the play target absorbs those unavoidable free
  // plugs instead of letting them accumulate around the shell.
  if (currentCount <= Math.ceil(totalCount * 0.58)) return 1;
  if (currentCount <= Math.ceil(totalCount * 0.82)) return 2;
  return 2;
}

export function freeDefinitions(definitions: readonly ArrowDefinition[]): ArrowDefinition[] {
  const runtimes = definitions.map(makeRuntime);
  return runtimes
    .filter((runtime) => checkArrowExit(runtime, runtimes).clear)
    .map((runtime) => runtime.definition);
}

export function headIsOnBoundary(
  definition: ArrowDefinition,
  shape: ShapeId,
  halfExtents: GridExtents,
): boolean {
  const head = definition.path[definition.path.length - 1];
  const direction = DIRECTION_VECTORS[definition.exitDirection];
  const outward: GridPoint = [
    head[0] + Math.sign(direction.x),
    head[1] + Math.sign(direction.y),
    head[2] + Math.sign(direction.z),
  ];
  return !pointInsideShape(shape, outward, halfExtents);
}

function snapshotAtRemaining(
  definitions: readonly ArrowDefinition[],
  solution: readonly string[],
  remainingTarget: number,
  shape: ShapeId,
  halfExtents: GridExtents,
): DifficultySnapshot {
  const removedCount = Math.max(0, definitions.length - remainingTarget);
  const removed = new Set(solution.slice(0, removedCount));
  const remaining = definitions.filter((definition) => !removed.has(definition.id));
  const free = freeDefinitions(remaining);
  return {
    remaining: remaining.length,
    free: free.length,
    obvious: free.filter((definition) => headIsOnBoundary(definition, shape, halfExtents)).length,
  };
}

export function analyzeRandomDifficulty(
  definitions: readonly ArrowDefinition[],
  solution: readonly string[],
  shape: ShapeId,
  halfExtents: GridExtents,
): RandomDifficultyCurve {
  const total = definitions.length;
  return {
    opening: snapshotAtRemaining(definitions, solution, total, shape, halfExtents),
    firstGate: snapshotAtRemaining(definitions, solution, Math.ceil(total * 0.75), shape, halfExtents),
    centralGate: snapshotAtRemaining(definitions, solution, Math.ceil(total * 0.5), shape, halfExtents),
    release: snapshotAtRemaining(definitions, solution, Math.ceil(total * 0.25), shape, halfExtents),
  };
}

export function hardDifficultyChecks(curve: RandomDifficultyCurve): Record<string, boolean> {
  return {
    openingChoices: curve.opening.free >= 4 && curve.opening.free <= 18,
    openingObvious: curve.opening.obvious <= 3,
    openingHiddenShare:
      curve.opening.obvious / Math.max(1, curve.opening.free) <= 0.34,
    firstGate: curve.firstGate.free >= 2 && curve.firstGate.free <= 10,
    firstGateHidden: curve.firstGate.obvious <= 2,
    centralGate: curve.centralGate.free >= 1 && curve.centralGate.free <= 8,
    centralGateHidden: curve.centralGate.obvious <= 1,
    release: curve.release.free >= 4 && curve.release.free <= 7,
    releaseDensity:
      curve.release.free / Math.max(1, curve.release.remaining) >
      curve.centralGate.free / Math.max(1, curve.centralGate.remaining),
  };
}

export function removalSequenceIsValid(
  definitions: readonly ArrowDefinition[],
  solution: readonly string[],
): boolean {
  const runtimes = definitions.map(makeRuntime);
  for (const id of solution) {
    const runtime = runtimes.find((candidate) => candidate.definition.id === id);
    if (!runtime || runtime.state === 'removed' || !checkArrowExit(runtime, runtimes).clear) return false;
    runtime.state = 'removed';
  }
  return solution.length === definitions.length;
}

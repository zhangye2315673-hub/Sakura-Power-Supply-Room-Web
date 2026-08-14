import * as THREE from 'three';
import { ARROW_COLORS } from '../style/palette';
import {
  COLLISION_RADIUS,
  DIRECTION_VECTORS,
  EXIT_DISTANCE,
  GRID_HALF,
  GRID_SIZE,
  directionKeyFromDelta,
  type ArrowDefinition,
  type ArrowLengthClass,
  type DirectionKey,
  type GridPoint,
  type GridExtents,
  type LevelDefinition,
  type PuzzleDefinition,
  type ShapeId,
} from './types';
import { pointInsideShape } from './shapes';
import { candidateGeometryIsClear, geometryIsClear } from './geometryValidation';
import { measurePuzzleCompactness } from './gridOccupancy';
import { RANDOM_PUZZLE_TEMPLATES } from './randomTemplates.generated';
import { DOUBLE_ENDED_PUZZLE_TEMPLATES } from './doubleEndedTemplates.generated';
import {
  analyzeRandomDifficulty,
  desiredHardFreeCount,
  hardDifficultyChecks,
  hardWiringChecks,
  headIsOnBoundary,
  measureWiringComplexity,
  removalSequenceIsValid,
} from './difficulty';
import {
  checkArrowExit,
  checkCableEndExit,
  availableCableEnds,
  cableEndDirection,
  cableEndsFor,
  countInitiallyFree,
  findRemovalSequence,
  makeRuntime,
} from './collision';

type MutablePoint = [number, number, number];
type AxisDirection = readonly [number, number, number];

type HeadPlacement = {
  head: GridPoint;
  inward: AxisDirection;
  exitDirection: AxisDirection;
  boundary: boolean;
};

type HeadPlacementCatalog = {
  byFace: HeadPlacement[][];
  all: HeadPlacement[];
};

type PathProfile = {
  segments: readonly [number, number];
  minimumLength: number;
  maximumLength: number;
  minimumSpan: number;
  threeAxisChance: number;
};

function buildLengthBag(
  _random: () => number,
  targetCount: number,
  quota: Readonly<Record<ArrowLengthClass, number>>,
): ArrowLengthClass[] {
  const classes: ArrowLengthClass[] = ['short', 'medium', 'long'];
  const counts = classes.map((lengthClass) => Math.floor(targetCount * quota[lengthClass]));
  let remainder = targetCount - counts.reduce((sum, count) => sum + count, 0);
  const remainderOrder = [...classes].sort((a, b) => quota[b] - quota[a]);
  for (let index = 0; remainder > 0; index += 1, remainder -= 1) {
    counts[classes.indexOf(remainderOrder[index % remainderOrder.length])] += 1;
  }
  // Place the hardest-to-pack paths first. Arrow ids and colors are presentation
  // details; the final dependency graph, not insertion order, determines play.
  return (['long', 'medium', 'short'] as const).flatMap((lengthClass) =>
    Array.from({ length: counts[classes.indexOf(lengthClass)] }, () => lengthClass),
  );
}

const PATH_PROFILES: Record<ArrowLengthClass, PathProfile> = {
  short: {
    segments: [2, 3],
    minimumLength: 3,
    maximumLength: 5,
    minimumSpan: 3,
    threeAxisChance: 0,
  },
  medium: {
    segments: [3, 4],
    minimumLength: 5,
    maximumLength: 8,
    minimumSpan: 4,
    threeAxisChance: 0.22,
  },
  long: {
    segments: [4, 5],
    minimumLength: 8,
    maximumLength: 12,
    minimumSpan: 6,
    threeAxisChance: 0.42,
  },
};

const DIRECTIONS: AxisDirection[] = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function integer(random: () => number, min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

const CUBE_AXIS_PERMUTATIONS = [
  [0, 1, 2], [0, 2, 1], [1, 0, 2],
  [1, 2, 0], [2, 0, 1], [2, 1, 0],
] as const;

function transformTemplateVector(
  vector: GridPoint,
  shape: ShapeId,
  seed: number,
): GridPoint {
  if (shape === 'cube') {
    const permutation = CUBE_AXIS_PERMUTATIONS[(seed >>> 3) % CUBE_AXIS_PERMUTATIONS.length];
    return [
      vector[permutation[0]] * (((seed >>> 11) & 1) === 0 ? 1 : -1),
      vector[permutation[1]] * (((seed >>> 12) & 1) === 0 ? 1 : -1),
      vector[permutation[2]] * (((seed >>> 13) & 1) === 0 ? 1 : -1),
    ];
  }

  const y = vector[1] * (((seed >>> 9) & 1) === 0 ? 1 : -1);
  switch ((seed >>> 4) % 4) {
    case 1: return [-vector[2], y, vector[0]];
    case 2: return [-vector[0], y, -vector[2]];
    case 3: return [vector[2], y, -vector[0]];
    default: return [vector[0], y, vector[2]];
  }
}

function transformTemplatePoint(point: GridPoint, shape: ShapeId, seed: number): GridPoint {
  const centered: GridPoint = [
    point[0] - GRID_HALF,
    point[1] - GRID_HALF,
    point[2] - GRID_HALF,
  ];
  const transformed = transformTemplateVector(centered, shape, seed);
  return [
    transformed[0] + GRID_HALF,
    transformed[1] + GRID_HALF,
    transformed[2] + GRID_HALF,
  ];
}

function shuffle<T>(random: () => number, source: readonly T[]): T[] {
  const result = [...source];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const next = Math.floor(random() * (index + 1));
    [result[index], result[next]] = [result[next], result[index]];
  }
  return result;
}

function pointKey(point: readonly number[]): string {
  return `${point[0].toFixed(2)}|${point[1].toFixed(2)}|${point[2].toFixed(2)}`;
}

function sampleGridPath(path: GridPoint[], interval = 0.25): string[] {
  const keys: string[] = [];
  for (let index = 0; index < path.length - 1; index += 1) {
    const start = path[index];
    const end = path[index + 1];
    const distance =
      Math.abs(end[0] - start[0]) +
      Math.abs(end[1] - start[1]) +
      Math.abs(end[2] - start[2]);
    const steps = Math.max(1, Math.round(distance / interval));
    for (let step = 0; step <= steps; step += 1) {
      if (index > 0 && step === 0) continue;
      const t = step / steps;
      keys.push(
        pointKey([
          start[0] + (end[0] - start[0]) * t,
          start[1] + (end[1] - start[1]) * t,
          start[2] + (end[2] - start[2]) * t,
        ]),
      );
    }
  }
  return keys;
}

function pathNeighborRatio(path: GridPoint[], occupancy: ReadonlySet<string>): number {
  if (occupancy.size === 0) return 1;
  const samples = sampleGridPath(path);
  let neighboring = 0;
  for (const key of samples) {
    const [x, y, z] = key.split('|').map(Number);
    const hasNeighbor = DIRECTIONS.some((direction) =>
      occupancy.has(pointKey([
        x + direction[0],
        y + direction[1],
        z + direction[2],
      ])),
    );
    if (hasNeighbor) neighboring += 1;
  }
  return neighboring / Math.max(1, samples.length);
}

function sampledBoundingVolume(keys: ReadonlySet<string>): number {
  if (keys.size === 0) return 0;
  const points = [...keys].map((key) => key.split('|').map(Number));
  return [0, 1, 2].reduce((volume, axis) => {
    const values = points.map((point) => point[axis]);
    return volume * (Math.max(...values) - Math.min(...values) + 1);
  }, 1);
}

function puzzleNeighborRatio(definitions: readonly ArrowDefinition[]): number {
  if (definitions.length <= 1) return 1;
  const pathSamples = definitions.map((definition) => sampleGridPath(definition.path));
  const all = new Set(pathSamples.flat());
  let neighboring = 0;
  let total = 0;
  pathSamples.forEach((samples) => {
    for (const key of samples) {
      all.delete(key);
      const [x, y, z] = key.split('|').map(Number);
      if (DIRECTIONS.some((direction) => all.has(pointKey([
        x + direction[0],
        y + direction[1],
        z + direction[2],
      ])))) neighboring += 1;
      total += 1;
      all.add(key);
    }
  });
  return neighboring / Math.max(1, total);
}

function isInside(point: MutablePoint): boolean {
  return point.every((value) => value >= 0 && value < GRID_SIZE);
}

function perpendicularDirections(previous: AxisDirection): AxisDirection[] {
  return DIRECTIONS.filter(
    (direction) =>
      direction[0] * previous[0] +
        direction[1] * previous[1] +
        direction[2] * previous[2] ===
      0,
  );
}

function addPoint(point: GridPoint, direction: AxisDirection): GridPoint {
  return [
    point[0] + direction[0],
    point[1] + direction[1],
    point[2] + direction[2],
  ];
}

function exitRayHitsOccupancy(
  endpoint: GridPoint,
  direction: AxisDirection,
  occupancy: ReadonlySet<string>,
  shape: ShapeId,
  halfExtents: GridExtents,
): boolean {
  for (let distance = 2; distance < GRID_SIZE; distance += 1) {
    const point: GridPoint = [
      endpoint[0] + direction[0] * distance,
      endpoint[1] + direction[1] * distance,
      endpoint[2] + direction[2] * distance,
    ];
    if (!isInside([...point]) || !pointInsideShape(shape, point, halfExtents)) return false;
    if (occupancy.has(pointKey(point))) return true;
  }
  return false;
}

function createHeadPlacements(shape: ShapeId, halfExtents: GridExtents): HeadPlacementCatalog {
  const byFace = DIRECTIONS.map(() => [] as HeadPlacement[]);
  for (let x = 0; x < GRID_SIZE; x += 1) {
    for (let y = 0; y < GRID_SIZE; y += 1) {
      for (let z = 0; z < GRID_SIZE; z += 1) {
        const head: GridPoint = [x, y, z];
        if (!pointInsideShape(shape, head, halfExtents)) continue;
        for (let face = 0; face < DIRECTIONS.length; face += 1) {
          const exitDirection = DIRECTIONS[face];
          const inward: AxisDirection = [
            -exitDirection[0],
            -exitDirection[1],
            -exitDirection[2],
          ];
          const firstBodyPoint = addPoint(head, inward);
          if (!isInside([...firstBodyPoint]) || !pointInsideShape(shape, firstBodyPoint, halfExtents)) continue;
          const outwardPoint = addPoint(head, exitDirection);
          const boundary = !isInside([...outwardPoint]) || !pointInsideShape(shape, outwardPoint, halfExtents);
          byFace[face].push({ head, inward, exitDirection, boundary });
        }
      }
    }
  }
  return { byFace, all: byFace.flat() };
}

function compressUnitPath(points: readonly GridPoint[]): GridPoint[] {
  if (points.length <= 2) return points.map((point) => [...point] as GridPoint);
  const compressed: GridPoint[] = [[...points[0]] as GridPoint];
  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const next = points[index + 1];
    const incoming = [
      Math.sign(current[0] - previous[0]),
      Math.sign(current[1] - previous[1]),
      Math.sign(current[2] - previous[2]),
    ];
    const outgoing = [
      Math.sign(next[0] - current[0]),
      Math.sign(next[1] - current[1]),
      Math.sign(next[2] - current[2]),
    ];
    if (incoming.some((value, axis) => value !== outgoing[axis])) {
      compressed.push([...current] as GridPoint);
    }
  }
  compressed.push([...points[points.length - 1]] as GridPoint);
  return compressed;
}

function findGridRoute(
  random: () => number,
  start: GridPoint,
  goal: GridPoint,
  blocked: ReadonlySet<string>,
  shape: ShapeId,
  halfExtents: GridExtents,
): GridPoint[] | null {
  const startKey = pointKey(start);
  const goalKey = pointKey(goal);
  const queue: GridPoint[] = [[...start] as GridPoint];
  const parents = new Map<string, string | null>([[startKey, null]]);
  const points = new Map<string, GridPoint>([[startKey, [...start] as GridPoint]]);

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const current = queue[cursor];
    if (pointKey(current) === goalKey) break;
    for (const direction of shuffle(random, DIRECTIONS)) {
      const next = addPoint(current, direction);
      const key = pointKey(next);
      if (
        parents.has(key) ||
        (key !== goalKey && blocked.has(key)) ||
        !isInside([...next]) ||
        !pointInsideShape(shape, next, halfExtents)
      ) continue;
      parents.set(key, pointKey(current));
      points.set(key, next);
      queue.push(next);
    }
  }
  if (!parents.has(goalKey)) return null;

  const reversed: GridPoint[] = [];
  let key: string | null = goalKey;
  while (key) {
    const point = points.get(key);
    if (!point) return null;
    reversed.push(point);
    key = parents.get(key) ?? null;
  }
  return reversed.reverse();
}

function createDoubleEndedDependencyPath(
  random: () => number,
  occupancy: ReadonlySet<string>,
  runtimes: readonly ReturnType<typeof makeRuntime>[],
  freeEnds: readonly ReturnType<typeof availableCableEnds>[number][],
  shape: ShapeId,
  halfExtents: GridExtents,
  placements: HeadPlacementCatalog,
): GridPoint[] | null {
  const blockable = shuffle(random, freeEnds).flatMap((choice) => {
    const runtime = runtimes.find((candidate) => candidate.definition.id === choice.id);
    if (!runtime) return [];
    const endpoint = choice.end === 'head'
      ? runtime.definition.path[runtime.definition.path.length - 1]
      : runtime.definition.path[0];
    const vector = DIRECTION_VECTORS[cableEndDirection(runtime.definition, choice.end)];
    return shuffle(random, [4, 5, 6]).flatMap((distance) => {
      const tail: GridPoint = [
        endpoint[0] + vector.x * (distance - 1),
        endpoint[1] + vector.y * (distance - 1),
        endpoint[2] + vector.z * (distance - 1),
      ];
      const block: GridPoint = [
        endpoint[0] + vector.x * distance,
        endpoint[1] + vector.y * distance,
        endpoint[2] + vector.z * distance,
      ];
      return isInside([...tail]) &&
        isInside([...block]) &&
        pointInsideShape(shape, tail, halfExtents) &&
        pointInsideShape(shape, block, halfExtents) &&
        !occupancy.has(pointKey(tail)) &&
        !occupancy.has(pointKey(block))
        ? [{ tail, block }]
        : [];
    });
  });
  if (blockable.length === 0) return null;

  const { tail, block } = blockable[0];
  const headPlacements = shuffle(random, placements.all).filter((placement) => {
    const firstBody = addPoint(placement.head, placement.inward);
    const farPoint: GridPoint = [
      placement.head[0] + placement.exitDirection[0] * 4,
      placement.head[1] + placement.exitDirection[1] * 4,
      placement.head[2] + placement.exitDirection[2] * 4,
    ];
    return !placement.boundary &&
      isInside([...farPoint]) &&
      pointInsideShape(shape, farPoint, halfExtents) &&
      !occupancy.has(pointKey(placement.head)) &&
      !occupancy.has(pointKey(firstBody)) &&
      pointKey(placement.head) !== pointKey(tail) &&
      pointKey(firstBody) !== pointKey(block) &&
      !exitRayHitsOccupancy(placement.head, placement.exitDirection, occupancy, shape, halfExtents);
  });

  for (const placement of headPlacements.slice(0, 24)) {
    const firstBody = addPoint(placement.head, placement.inward);
    const blocked = new Set(occupancy);
    blocked.add(pointKey(tail));
    const route = findGridRoute(random, block, firstBody, blocked, shape, halfExtents);
    if (!route) continue;
    const path = compressUnitPath([tail, ...route, placement.head]);
    if (new Set(sampleGridPath(path)).size !== sampleGridPath(path).length) continue;
    return path;
  }
  return null;
}

function octantOf(point: GridPoint): number {
  const middle = (GRID_SIZE - 1) * 0.5;
  return (point[0] >= middle ? 1 : 0) |
    (point[1] >= middle ? 2 : 0) |
    (point[2] >= middle ? 4 : 0);
}

function chooseHeadPlacement(
  random: () => number,
  placements: HeadPlacementCatalog,
  preferredFace: number,
  preferredOctant: number,
  boundaryHeadRatio: number,
  desiredBlockPoints: ReadonlySet<string>,
): HeadPlacement | null {
  if (desiredBlockPoints.size > 0) {
    const blockingPlacements = placements.all.filter((placement) =>
      desiredBlockPoints.has(pointKey(addPoint(placement.head, placement.inward))),
    );
    const nearbyPlacements = blockingPlacements.length > 0
      ? blockingPlacements
      : placements.all.filter((placement) => {
          const body = addPoint(placement.head, placement.inward);
          return [...desiredBlockPoints].some((key) => {
            const [x, y, z] = key.split('|').map(Number);
            return Math.abs(body[0] - x) + Math.abs(body[1] - y) + Math.abs(body[2] - z) <= 1;
          });
        });
    if (nearbyPlacements.length > 0) {
      const internalPlacements = nearbyPlacements.filter((placement) => !placement.boundary);
      const pool = internalPlacements.length > 0 ? internalPlacements : nearbyPlacements;
      return pool[integer(random, 0, pool.length - 1)];
    }
  }

  const facePlacements = placements.byFace[preferredFace];
  if (facePlacements.length === 0) return null;
  const wantBoundary = random() < boundaryHeadRatio;
  const exact = facePlacements.filter(
    (placement) => placement.boundary === wantBoundary && octantOf(placement.head) === preferredOctant,
  );
  const sameKind = facePlacements.filter((placement) => placement.boundary === wantBoundary);
  const pool = exact.length > 0 ? exact : sameKind.length > 0 ? sameKind : facePlacements;
  return pool[integer(random, 0, pool.length - 1)] ?? null;
}

function pathBlocksExit(
  blocker: ReturnType<typeof makeRuntime>,
  arrow: ReturnType<typeof makeRuntime>,
): boolean {
  const direction = DIRECTION_VECTORS[arrow.definition.exitDirection];
  const head = arrow.samplePoints[arrow.samplePoints.length - 1];
  const offset = new THREE.Vector3();
  const collisionDistanceSq = (COLLISION_RADIUS * 2) ** 2;
  for (const sample of blocker.samplePoints) {
    offset.copy(sample).sub(head);
    const forwardDistance = offset.dot(direction);
    if (forwardDistance <= 0 || forwardDistance > EXIT_DISTANCE) continue;
    offset.addScaledVector(direction, -forwardDistance);
    if (offset.lengthSq() < collisionDistanceSq) return true;
  }
  return false;
}

function createPath(
  random: () => number,
  globalOccupancy: ReadonlySet<string>,
  preferredFace: number,
  preferredOctant: number,
  lengthClass: ArrowLengthClass,
  shape: ShapeId,
  halfExtents: GridExtents,
  placements: HeadPlacementCatalog,
  boundaryHeadRatio: number,
  desiredBlockPoints: ReadonlySet<string>,
  minimumThreeAxisChance = 0,
  requireBlockedTail = false,
): GridPoint[] | null {
  const profile = PATH_PROFILES[lengthClass];
  const segmentCount = integer(random, profile.segments[0], profile.segments[1]);
  const requireThreeAxes = random() < Math.max(profile.threeAxisChance, minimumThreeAxisChance);
  const placement = chooseHeadPlacement(
    random,
    placements,
    preferredFace,
    preferredOctant,
    boundaryHeadRatio,
    desiredBlockPoints,
  );
  if (!placement) return null;
  const head = [...placement.head] as MutablePoint;
  const inward = [...placement.inward] as MutablePoint;
  const constructionPath: MutablePoint[] = [head];
  let direction: AxisDirection = inward;
  const localVertices = new Set([pointKey(head)]);

  for (let segment = 0; segment < segmentCount; segment += 1) {
    const options =
      segment === 0 ? [direction] : shuffle(random, perpendicularDirections(direction));
    let nextPoint: MutablePoint | null = null;
    let nextDirection: AxisDirection | null = null;

    for (const candidateDirection of options) {
      const favorLongSegment = lengthClass === 'long' ? 0.72 : lengthClass === 'medium' ? 0.42 : 0.18;
      const lengths = lengthClass === 'long'
        ? (random() < favorLongSegment ? [3, 2, 1] : [2, 3, 1])
        : lengthClass === 'medium'
          ? (random() < favorLongSegment ? [2, 1] : [1, 2])
          : (random() < favorLongSegment ? [2, 1] : [1, 2]);
      for (const length of lengths) {
        const current = constructionPath[constructionPath.length - 1];
        const candidate: MutablePoint = [
          current[0] + candidateDirection[0] * length,
          current[1] + candidateDirection[1] * length,
          current[2] + candidateDirection[2] * length,
        ];
        if (!isInside(candidate) || !pointInsideShape(shape, candidate, halfExtents) || localVertices.has(pointKey(candidate))) continue;
        if (
          requireBlockedTail &&
          segment === segmentCount - 1 &&
          !exitRayHitsOccupancy(candidate, candidateDirection, globalOccupancy, shape, halfExtents)
        ) continue;
        nextPoint = candidate;
        nextDirection = candidateDirection;
        break;
      }
      if (nextPoint) break;
    }

    if (!nextPoint || !nextDirection) return null;
    constructionPath.push(nextPoint);
    localVertices.add(pointKey(nextPoint));
    direction = nextDirection;
  }

  // The path was grown from an outward-facing head into the cube. Reverse it
  // so gameplay data remains tail -> head.
  const path = constructionPath.reverse();
  for (let index = 0; index < path.length - 1; index += 1) {
    const start = path[index];
    const end = path[index + 1];
    const distance = Math.abs(end[0] - start[0]) + Math.abs(end[1] - start[1]) + Math.abs(end[2] - start[2]);
    for (let step = 1; step < distance; step += 1) {
      const point: GridPoint = [
        start[0] + Math.sign(end[0] - start[0]) * step,
        start[1] + Math.sign(end[1] - start[1]) * step,
        start[2] + Math.sign(end[2] - start[2]) * step,
      ];
      if (!pointInsideShape(shape, point, halfExtents)) return null;
    }
  }
  const occupied = sampleGridPath(path);
  if (occupied.some((key) => globalOccupancy.has(key))) return null;
  if (new Set(occupied).size !== occupied.length) return null;

  const axes = new Set<number>();
  let totalLength = 0;
  for (let index = 0; index < path.length - 1; index += 1) {
    const startPoint = path[index];
    const endPoint = path[index + 1];
    for (let axis = 0; axis < 3; axis += 1) {
      const length = Math.abs(endPoint[axis] - startPoint[axis]);
      if (length > 0) {
        axes.add(axis);
        totalLength += length;
      }
    }
  }
  const spans = [0, 1, 2].map((axis) => {
    const values = path.map((point) => point[axis]);
    return Math.max(...values) - Math.min(...values);
  });
  if (
    totalLength < profile.minimumLength ||
    totalLength > profile.maximumLength ||
    spans[0] + spans[1] + spans[2] < profile.minimumSpan
  ) {
    return null;
  }
  if (axes.size < (requireThreeAxes ? 3 : 2)) return null;

  return path;
}

function collectExitBlockPoints(
  arrows: readonly ReturnType<typeof makeRuntime>[],
  shape: ShapeId,
  halfExtents: GridExtents,
  occupancy: ReadonlySet<string>,
  includeTailEnds = false,
): Set<string> {
  const points = new Set<string>();
  for (const arrow of arrows) {
    const ends = includeTailEnds ? cableEndsFor(arrow.definition) : ['head' as const];
    for (const end of ends) {
      const head = end === 'head'
        ? arrow.definition.path[arrow.definition.path.length - 1]
        : arrow.definition.path[0];
      const vector = DIRECTION_VECTORS[cableEndDirection(arrow.definition, end)];
      // The first lane is occupied by the plug envelope. A blocker placed there
      // is rejected later even though it scores as a dependency candidate.
      for (let distance = 2; distance < GRID_SIZE; distance += 1) {
        const point: GridPoint = [
          head[0] + vector.x * distance,
          head[1] + vector.y * distance,
          head[2] + vector.z * distance,
        ];
        if (!isInside([...point]) || !pointInsideShape(shape, point, halfExtents)) break;
        const key = pointKey(point);
        if (!occupancy.has(key)) points.add(key);
      }
    }
  }
  return points;
}

function desiredDoubleEndedFreeCount(currentCount: number): number {
  if (currentCount <= 1) return 2;
  if (currentCount === 2) return 3;
  if (currentCount % 9 === 0) return 3;
  return currentCount % 3 === 0 ? 2 : 1;
}

function buildCandidate(
  seed: number,
  targetCount: number,
  shape: ShapeId,
  quota: Readonly<Record<ArrowLengthClass, number>>,
  minInitiallyFree: number,
  maxInitiallyFree: number,
  boundaryHeadRatio: number,
  halfExtents: GridExtents,
  minNeighborRatio: number,
  compactnessBias: number,
  initialDefinitions: readonly ArrowDefinition[] = [],
  quotaTargetCount = targetCount,
  freeProfile: 'linear' | 'random-hard' | 'double-ended' = 'linear',
): ArrowDefinition[] {
  const random = mulberry32(seed);
  const arrows: ArrowDefinition[] = initialDefinitions.map((definition) => ({
    ...definition,
    path: definition.path.map((point) => [...point] as GridPoint),
  }));
  const runtimes = arrows.map(makeRuntime);
  const occupancy = new Set<string>();
  arrows.forEach((definition) => {
    sampleGridPath(definition.path).forEach((key) => occupancy.add(key));
  });
  const faceOffset = integer(random, 0, 5);
  const octantOffset = integer(random, 0, 7);
  const colorOrder = shuffle(random, ARROW_COLORS);
  const lengthBag = buildLengthBag(random, quotaTargetCount, quota);
  const extensionLengthBag = initialDefinitions.length > 0
    ? buildLengthBag(random, Math.max(1, targetCount - initialDefinitions.length), {
        short: 0,
        medium: 0.45,
        long: 0.55,
      })
    : [];
  const placements = createHeadPlacements(shape, halfExtents);
  const targetInitiallyFree = Math.round((minInitiallyFree + maxInitiallyFree) * 0.5);

  while (arrows.length < targetCount) {
    const doubleEnded = freeProfile === 'double-ended';
    const previouslyFreeEnds = doubleEnded ? availableCableEnds(runtimes) : [];
    const previouslyFree = doubleEnded
      ? runtimes.filter((arrow) => previouslyFreeEnds.some((choice) => choice.id === arrow.definition.id))
      : runtimes.filter((arrow) => checkArrowExit(arrow, runtimes).clear);
    let bestPlacement: { definition: ArrowDefinition; runtime: ReturnType<typeof makeRuntime> } | null = null;
    let bestPlacementScore = Number.POSITIVE_INFINITY;
    const progress = (arrows.length + 1) / targetCount;
    const fullPuzzleProgress = (arrows.length + 1) / quotaTargetCount;
    const boundaryHeadCount = freeProfile === 'random-hard'
      ? arrows.filter((arrow) => headIsOnBoundary(arrow, shape, halfExtents)).length
      : 0;
    const needsOpeningHandle =
      freeProfile === 'random-hard' &&
      fullPuzzleProgress >= 0.82 &&
      boundaryHeadCount < 2;
    const desiredFreeNow = doubleEnded
      ? desiredDoubleEndedFreeCount(arrows.length + 1)
      : freeProfile === 'random-hard'
        ? desiredHardFreeCount(arrows.length + 1, quotaTargetCount)
        : Math.max(1, Math.round(targetInitiallyFree * progress));
    const exitBlockPoints = collectExitBlockPoints(
      previouslyFree,
      shape,
      halfExtents,
      occupancy,
      doubleEnded,
    );
    const requestedLengthClass = initialDefinitions.length > 0
      ? extensionLengthBag[arrows.length - initialDefinitions.length] ?? 'medium'
      : lengthBag[arrows.length];
    const shortCount = arrows.filter((arrow) => arrow.lengthClass === 'short').length;
    const canUseShortFallback = shortCount < Math.max(1, Math.floor(targetCount * 0.18));
    const lengthFallbacks: ArrowLengthClass[] = requestedLengthClass === 'long'
      ? ['long', 'medium', ...(canUseShortFallback ? ['short' as const] : [])]
      : requestedLengthClass === 'medium'
        ? ['medium', ...(canUseShortFallback ? ['short' as const] : [])]
        : ['short'];

    for (const lengthClass of lengthFallbacks) {
      let validCandidates = 0;
      for (let attempt = 0; attempt < 180; attempt += 1) {
        const preferredFace = (faceOffset + arrows.length) % 6;
        const preferredOctant = (octantOffset + arrows.length) % 8;
        const attemptNeedsOpeningHandle = needsOpeningHandle && attempt < 120;
        const shouldForceBlock =
          !attemptNeedsOpeningHandle &&
          (doubleEnded ? previouslyFreeEnds.length + 2 : previouslyFree.length + 1) > desiredFreeNow &&
          random() < (freeProfile === 'random-hard' || doubleEnded ? 0.98 : 0.9);
        // The torus has a curved inner wall and fewer straight runs. Keep a
        // portion of its nominal long quota at medium span so the shape can
        // reach the campaign count without turning every cable into a failed
        // search attempt.
        const generationLengthClass = shape === 'torus' && lengthClass === 'long' && random() < 0.5
          ? 'medium'
          : lengthClass;
        // In hard random mode, boundary plugs are authored late. They are the
        // obvious opening handles and are therefore removed before the middle
        // of the solution, leaving the player to rotate and inspect the core.
        const effectiveBoundaryHeadRatio = freeProfile === 'random-hard'
          ? attemptNeedsOpeningHandle
            ? 1
            : 0
          : boundaryHeadRatio;
        const path = doubleEnded && arrows.length > 0 && arrows.length + 1 !== targetCount
          ? createDoubleEndedDependencyPath(
              random,
              occupancy,
              runtimes,
              previouslyFreeEnds,
              shape,
              halfExtents,
              placements,
            )
          : createPath(
              random,
              occupancy,
              preferredFace,
              preferredOctant,
              generationLengthClass,
              shape,
              halfExtents,
              placements,
              effectiveBoundaryHeadRatio,
              shouldForceBlock ? exitBlockPoints : new Set<string>(),
              freeProfile === 'random-hard'
                ? shape === 'cuboid'
                  ? 0.45
                  : 0.58
                : 0,
              false,
            );
        if (!path) continue;

        const last = path[path.length - 1];
        const previous = path[path.length - 2];
        const delta: GridPoint = [
          Math.sign(last[0] - previous[0]),
          Math.sign(last[1] - previous[1]),
          Math.sign(last[2] - previous[2]),
        ];
        const definition: ArrowDefinition = {
          id: `arrow-${arrows.length + 1}`,
          path,
          exitDirection: directionKeyFromDelta(delta),
          color: colorOrder[arrows.length % colorOrder.length],
          lengthClass: generationLengthClass,
          doubleEnded: doubleEnded || undefined,
        };
        const runtime = makeRuntime(definition);
        // Use the same complete body/contact segment envelopes as final
        // validation while candidates are being built.
        if (!candidateGeometryIsClear(definition, arrows)) {
          continue;
        }

        // The puzzle is authored backwards. Every newly inserted arrow must be
        // able to leave while all previously inserted arrows remain. Reversing
        // insertion order therefore gives a guaranteed solution.
        const combinedRuntimes = [runtime, ...runtimes];
        const candidateFreeEnds = doubleEnded
          ? cableEndsFor(definition).filter((end) => checkCableEndExit(runtime, combinedRuntimes, end).clear)
          : [];
        if (doubleEnded ? candidateFreeEnds.length === 0 : !checkArrowExit(runtime, combinedRuntimes).clear) {
          continue;
        }

        const survivingPreviousFreeEnds = doubleEnded
          ? previouslyFreeEnds.filter((choice) => {
              const arrow = runtimes.find((candidate) => candidate.definition.id === choice.id);
              return arrow ? checkCableEndExit(arrow, combinedRuntimes, choice.end).clear : false;
            }).length
          : 0;
        const blockScore = doubleEnded
          ? previouslyFreeEnds.length - survivingPreviousFreeEnds
          : previouslyFree.reduce(
              (score, arrow) => score + (pathBlocksExit(runtime, arrow) ? 1 : 0),
              0,
            );
        const projectedFree = doubleEnded
          ? survivingPreviousFreeEnds + candidateFreeEnds.length
          : previouslyFree.length - blockScore + 1;
        if (doubleEnded && projectedFree > 3) continue;
        const neighborRatio = pathNeighborRatio(definition.path, occupancy);
        const minimumPathNeighborRatio = compactnessBias > 0 ? minNeighborRatio * 0.42 : 0;
        if (arrows.length > 0 && neighborRatio <= minimumPathNeighborRatio) {
          continue;
        }
        validCandidates += 1;
        const multiBlockBonus = blockScore >= 2 ? (blockScore - 1) * 4 : 0;
        const isolatedPenalty = arrows.length > 0 && neighborRatio < minNeighborRatio
          ? (minNeighborRatio - neighborRatio) * 34
          : 0;
        const pathSamples = sampleGridPath(definition.path);
        const combinedOccupancy = compactnessBias > 0
          ? new Set([...occupancy, ...pathSamples])
          : occupancy;
        const expansionPenalty = compactnessBias > 0
          ? Math.max(
              0,
              sampledBoundingVolume(combinedOccupancy) - sampledBoundingVolume(occupancy),
            ) * compactnessBias
          : 0;
        const placementScore =
          Math.abs(projectedFree - desiredFreeNow) * (freeProfile === 'random-hard' || doubleEnded ? 34 : 20) -
          blockScore * (progress > 0.45 ? 3 : 1) -
          multiBlockBonus -
          neighborRatio * 18 +
          isolatedPenalty +
          expansionPenalty +
          random() * 0.25;
        if (placementScore < bestPlacementScore) {
          bestPlacement = { definition, runtime };
          bestPlacementScore = placementScore;
        }

        if (doubleEnded && validCandidates >= 5) break;
        if (validCandidates >= 5 && projectedFree === desiredFreeNow) break;
        if (validCandidates >= 10) break;
      }
      if (bestPlacement) break;
    }
    if (!bestPlacement) break;

    arrows.push(bestPlacement.definition);
    runtimes.push(bestPlacement.runtime);
    sampleGridPath(bestPlacement.definition.path).forEach((key) => occupancy.add(key));
  }

  return arrows;
}

export type UnifiedRandomPuzzleDiagnostic = {
  puzzle: PuzzleDefinition | null;
  generatedCount: number;
  checks: Record<string, boolean>;
  difficulty: ReturnType<typeof analyzeRandomDifficulty> | null;
};

function constrainSkillInitialExits(
  source: readonly ArrowDefinition[],
  minimum: number,
  maximum: number,
): { arrows: ArrowDefinition[]; solution: string[]; initiallyFree: number } | null {
  let arrows = source.map((arrow) => ({
    ...arrow,
    path: arrow.path.map((point) => [...point] as GridPoint),
  }));
  let initiallyFree = countInitiallyFree(arrows);
  const directions = Object.keys(DIRECTION_VECTORS) as DirectionKey[];

  while (initiallyFree > maximum) {
    const freeIds = arrows
      .map(makeRuntime)
      .filter((arrow, _index, runtimes) => checkArrowExit(arrow, runtimes).clear)
      .map((arrow) => arrow.definition.id);
    let replacement: ArrowDefinition[] | null = null;
    let replacementFree = initiallyFree;

    for (const id of freeIds) {
      const index = arrows.findIndex((arrow) => arrow.id === id);
      if (index < 0) continue;
      const original = arrows[index];
      const orderedDirections = directions.filter((direction) => direction !== original.exitDirection);
      for (const exitDirection of orderedDirections) {
        const trial = arrows.map((arrow, arrowIndex) => arrowIndex === index
          ? { ...arrow, exitDirection }
          : arrow);
        const trialFree = countInitiallyFree(trial);
        if (trialFree >= initiallyFree || trialFree < minimum) continue;
        if (!findRemovalSequence(trial)) continue;
        replacement = trial;
        replacementFree = trialFree;
        break;
      }
      if (replacement) break;
    }
    if (!replacement) return null;
    arrows = replacement;
    initiallyFree = replacementFree;
  }

  const solution = findRemovalSequence(arrows);
  return solution && initiallyFree >= minimum && initiallyFree <= maximum
    ? { arrows, solution, initiallyFree }
    : null;
}

export function diagnoseUnifiedRandomPuzzle(
  seed: number,
  targetCount: number,
  level: LevelDefinition,
  initialArrows: readonly ArrowDefinition[] = [],
): UnifiedRandomPuzzleDiagnostic {
  let arrows: ArrowDefinition[] = initialArrows.map((arrow) => ({
    ...arrow,
    path: arrow.path.map((point) => [...point] as GridPoint),
  }));
  let stalledStages = 0;
  for (let stage = 0; stage < 12 && arrows.length < targetCount; stage += 1) {
    const stageStartCount = arrows.length;
    const stageTarget = Math.min(targetCount, stageStartCount + 5);
    let best = arrows;
    let bestScore = Number.NEGATIVE_INFINITY;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const attemptSeed = (
        seed + Math.imul(stage + 1, 0x45d9f3b) + Math.imul(attempt + 1, 104729)
      ) >>> 0;
      const candidate = buildCandidate(
        attemptSeed,
        stageTarget,
        level.shape,
        level.shape === 'cuboid'
          ? { short: 0.08, medium: 0.47, long: 0.45 }
          : { short: 0.05, medium: 0.45, long: 0.5 },
        level.minInitiallyFree,
        level.maxInitiallyFree,
        level.boundaryHeadRatio,
        level.halfExtents,
        Math.max(0.32, level.minNeighborRatio),
        0.2,
        arrows,
        targetCount,
        'random-hard',
      );
      if (candidate.length <= stageStartCount) continue;
      const compactness = measurePuzzleCompactness(candidate);
      const freeCount = countInitiallyFree(candidate);
      const desiredFree = desiredHardFreeCount(candidate.length, targetCount);
      const score =
        candidate.length * 100 +
        compactness.connectedRatio * 30 +
        compactness.neighborRatio * 20 +
        compactness.density * 12 -
        Math.abs(freeCount - desiredFree) * 40;
      if (score <= bestScore) continue;
      best = candidate;
      bestScore = score;
      if (candidate.length === stageTarget && compactness.connectedRatio >= 0.98) break;
    }
    arrows = best;
    if (arrows.length === stageStartCount) stalledStages += 1;
    else stalledStages = 0;
    if (stalledStages >= 2) break;
  }
  if (arrows.length !== targetCount) {
    return {
      puzzle: null,
      generatedCount: arrows.length,
      checks: { targetCount: false },
      difficulty: null,
    };
  }
  const compactness = measurePuzzleCompactness(arrows);
  const solution = arrows.map((arrow) => arrow.id).reverse();
  const difficulty = analyzeRandomDifficulty(arrows, solution, level.shape, level.halfExtents);
  const difficultyChecks = hardDifficultyChecks(difficulty);
  const wiringChecks = hardWiringChecks(measureWiringComplexity(arrows));
  const checks = {
    targetCount: true,
    removalSequence: removalSequenceIsValid(arrows, solution),
    geometryClear: geometryIsClear(arrows),
    connectedCluster: compactness.connectedRatio >= 0.95,
    noIsolatedArrows: compactness.isolatedArrowIds.length === 0,
    ...difficultyChecks,
    ...wiringChecks,
  };
  const puzzle: PuzzleDefinition = {
    seed: seed >>> 0,
    arrows,
    solution,
    initiallyFree: countInitiallyFree(arrows),
    level,
    mode: 'random',
  };
  return {
    puzzle,
    generatedCount: arrows.length,
    checks,
    difficulty,
  };
}

type DoubleEndedSolution = {
  ids: string[];
  ends: Array<'head' | 'tail'>;
  choiceCounts: number[];
};

function traceReverseConstructionSolution(
  arrows: readonly ArrowDefinition[],
): DoubleEndedSolution | null {
  const runtimes = arrows.map(makeRuntime);
  const ids: string[] = [];
  const ends: Array<'head' | 'tail'> = [];
  const choiceCounts: number[] = [];

  for (const definition of [...arrows].reverse()) {
    const choices = availableCableEnds(runtimes);
    const selected = choices.find((choice) => choice.id === definition.id);
    if (!selected) return null;
    ids.push(selected.id);
    ends.push(selected.end);
    choiceCounts.push(choices.length);
    const runtime = runtimes.find((candidate) => candidate.definition.id === selected.id);
    if (!runtime) return null;
    runtime.state = 'removed';
  }

  return { ids, ends, choiceCounts };
}

function generateDoubleEndedPuzzle(
  seed: number,
  targetCount: number,
  level: LevelDefinition,
  useTemplate = true,
): PuzzleDefinition {
  const template = DOUBLE_ENDED_PUZZLE_TEMPLATES[targetCount];
  if (useTemplate && template) {
    const colorOrder = shuffle(mulberry32((seed ^ 0x7f4a7c15) >>> 0), ARROW_COLORS);
    const arrows = template.arrows.map((arrow, index) => ({
      ...arrow,
      path: arrow.path.map((point) => transformTemplatePoint(point, 'cube', seed)),
      exitDirection: directionKeyFromDelta(transformTemplateVector(
        [
          DIRECTION_VECTORS[arrow.exitDirection].x,
          DIRECTION_VECTORS[arrow.exitDirection].y,
          DIRECTION_VECTORS[arrow.exitDirection].z,
        ],
        'cube',
        seed,
      )),
      color: colorOrder[index % colorOrder.length],
      doubleEnded: true,
    }));
    return {
      seed: seed >>> 0,
      arrows,
      solution: [...template.solution],
      solutionEnds: [...template.solutionEnds],
      initiallyFree: template.initiallyFree,
      level,
      mode: 'random',
      challengeKind: 'double-ended',
    };
  }

  let bestCount = 0;
  let bestMaxChoices = Number.POSITIVE_INFINITY;

  for (let attempt = 0; attempt < 1; attempt += 1) {
    const attemptSeed = (seed + Math.imul(attempt, 0x45d9f3b)) >>> 0;
    const arrows = buildCandidate(
      attemptSeed,
      targetCount,
      level.shape,
      level.lengthQuota,
      1,
      3,
      level.boundaryHeadRatio,
      level.halfExtents,
      Math.max(0.28, level.minNeighborRatio * 0.8),
      0,
      [],
      targetCount,
      'double-ended',
    );
    bestCount = Math.max(bestCount, arrows.length);
    if (arrows.length !== targetCount || !geometryIsClear(arrows)) continue;

    const traced = traceReverseConstructionSolution(arrows);
    if (!traced) continue;
    const maxChoices = Math.max(...traced.choiceCounts);
    bestMaxChoices = Math.min(bestMaxChoices, maxChoices);
    const focusedShare = traced.choiceCounts.filter((count) => count <= 2).length / traced.choiceCounts.length;
    if (maxChoices > 3 || focusedShare < 0.8) continue;

    return {
      seed: seed >>> 0,
      arrows,
      solution: traced.ids,
      solutionEnds: traced.ends,
      initiallyFree: traced.choiceCounts[0] ?? 0,
      level,
      mode: 'random',
      challengeKind: 'double-ended',
    };
  }

  throw new Error(
    `Unable to generate double-ended challenge ${seed}: ${bestCount}/${targetCount} cables, best max choices ${bestMaxChoices}`,
  );
}

export function generatePuzzle(
  seed: number,
  targetCount = 15,
  options: {
    shape?: ShapeId;
    lengthQuota?: Readonly<Record<ArrowLengthClass, number>>;
    minInitiallyFree?: number;
    maxInitiallyFree?: number;
    level?: LevelDefinition;
    mode?: 'campaign' | 'random' | 'skill' | 'rush';
    maxSearchAttempts?: number;
    forceRegenerateDoubleEnded?: boolean;
  } = {},
): PuzzleDefinition {
  const shape = options.shape ?? 'cube';
  const lengthQuota = options.lengthQuota ?? { short: 0.2, medium: 0.4, long: 0.4 };
  const minInitiallyFree = options.minInitiallyFree ?? 0;
  const maxInitiallyFree = options.maxInitiallyFree ?? targetCount;
  const boundaryHeadRatio = options.level?.boundaryHeadRatio ?? 0.3;
  const halfExtents = options.level?.halfExtents ?? [GRID_HALF, GRID_HALF, GRID_HALF];
  const minNeighborRatio = options.level?.minNeighborRatio ?? 0.28;
  const minDensity = options.level?.minDensity ?? 0;
  const maxSearchAttempts = options.maxSearchAttempts ?? (options.mode === 'random' ? 6 : 10);
  if (options.mode === 'random' && options.level?.challengeKind === 'double-ended') {
    return generateDoubleEndedPuzzle(
      seed,
      targetCount,
      options.level,
      !options.forceRegenerateDoubleEnded,
    );
  }
  if ((options.mode === 'random' || options.mode === 'skill') && options.level && targetCount >= 40) {
    const template = RANDOM_PUZZLE_TEMPLATES[`${shape}-${targetCount}`];
    if (template) {
      const colorOrder = shuffle(mulberry32((seed ^ 0x9e3779b9) >>> 0), ARROW_COLORS);
      const arrows = template.arrows.map((arrow, index) => ({
        ...arrow,
        path: arrow.path.map((point) => transformTemplatePoint(point, shape, seed)),
        exitDirection: directionKeyFromDelta(transformTemplateVector(
          [
            DIRECTION_VECTORS[arrow.exitDirection].x,
            DIRECTION_VECTORS[arrow.exitDirection].y,
            DIRECTION_VECTORS[arrow.exitDirection].z,
          ],
          shape,
          seed,
        )),
        color: colorOrder[index % colorOrder.length],
      }));
      // Templates are transformed per seed; reject a transformed variant if
      // its full plug envelopes no longer satisfy the same segment rules used
      // during candidate generation, then fall through to regeneration.
      if (geometryIsClear(arrows)) {
        const skillTemplate = options.mode === 'skill'
          ? constrainSkillInitialExits(arrows, minInitiallyFree, maxInitiallyFree)
          : null;
        if (options.mode === 'skill' && !skillTemplate) {
          // Fall through to deterministic regeneration if this transformed
          // template cannot satisfy the stricter 4-8 initial exit window.
        } else {
          const selected = skillTemplate ?? {
            arrows,
            solution: [...template.solution],
            initiallyFree: template.initiallyFree,
          };
        return {
          seed: seed >>> 0,
            arrows: selected.arrows,
            solution: selected.solution,
            initiallyFree: selected.initiallyFree,
          level: options.level,
            mode: options.mode,
        };
        }
      }
    }
    const unified = diagnoseUnifiedRandomPuzzle(seed, targetCount, options.level);
    if (unified.puzzle && Object.values(unified.checks).every(Boolean)) return unified.puzzle;
  }
  // Concave and tapered voxel volumes have different packing characteristics.
  // Start the octahedron from its proven dense-search sequence while keeping
  // the public seed stable for URL reloads and appliance selection.
  const searchSeed = options.mode === 'random' && shape === 'octahedron'
    ? (seed + Math.imul(5, 7919)) >>> 0
    : seed >>> 0;
  let best: PuzzleDefinition | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (let attempt = 0; attempt < maxSearchAttempts; attempt += 1) {
    const attemptSeed = (searchSeed + Math.imul(attempt, 7919)) >>> 0;
    const arrows = buildCandidate(
      attemptSeed,
      targetCount,
      shape,
      lengthQuota,
      minInitiallyFree,
      maxInitiallyFree,
      boundaryHeadRatio,
      halfExtents,
      minNeighborRatio,
      options.mode === 'random' ? 0.28 : 0,
    );
    if (arrows.length < Math.max(1, Math.floor(targetCount * 0.9))) continue;

    const solution = findRemovalSequence(arrows);
    if (!solution) continue;
    const initiallyFree = countInitiallyFree(arrows);
    // The public seed identifies the whole deterministic search, not whichever
    // internal attempt happened to succeed. Reload/reset must reproduce the
    // exact same puzzle even when generation needed a later attempt.
    const candidate = { seed: seed >>> 0, arrows, solution, initiallyFree };
    const neighborRatio = puzzleNeighborRatio(arrows);
    const compactness = measurePuzzleCompactness(arrows);
    const spanDeficit = options.level
      ? compactness.spans.reduce(
          (sum, span, axis) => sum + Math.max(0, options.level!.minSpans[axis] - span),
          0,
        )
      : 0;
    const candidateScore =
      Math.min(Math.abs(initiallyFree - minInitiallyFree), Math.abs(initiallyFree - maxInitiallyFree)) +
      (initiallyFree < minInitiallyFree || initiallyFree > maxInitiallyFree ? 14 : 0) +
      (targetCount - arrows.length) * 6 +
      Math.max(0, minNeighborRatio - neighborRatio) * 24 +
      Math.max(0, minDensity - compactness.density) * 50 +
      Math.max(0, 1 - compactness.connectedRatio) * 30 +
      spanDeficit * 8;
    if (candidateScore < bestScore) {
      best = candidate;
      bestScore = candidateScore;
    }

    if (
      arrows.length === targetCount &&
      initiallyFree >= minInitiallyFree &&
      initiallyFree <= maxInitiallyFree &&
      neighborRatio >= minNeighborRatio &&
      compactness.connectedRatio >= 0.98 &&
      compactness.density >= minDensity &&
      spanDeficit === 0 &&
      geometryIsClear(arrows)
    ) {
      return { ...candidate, level: options.level, mode: options.mode };
    }
  }

  if (best) return { ...best, level: options.level, mode: options.mode };

  const randomFallbackTarget = Math.min(targetCount, Math.max(18, Math.floor(targetCount * 0.9)));
  const fallbackTarget = options.mode === 'random' ? randomFallbackTarget : Math.min(targetCount, 10);
  const fallbackQuota = options.mode === 'random'
    ? { short: 0.15, medium: 0.5, long: 0.35 }
    : lengthQuota;
  const fallbackArrows = buildCandidate(
    seed >>> 0,
    fallbackTarget,
    shape,
    fallbackQuota,
    options.mode === 'random' ? 3 : 1,
    options.mode === 'random' ? Math.min(fallbackTarget, 7) : Math.min(targetCount, 6),
    boundaryHeadRatio,
    halfExtents,
    Math.min(options.mode === 'random' ? 0.32 : 0.2, minNeighborRatio),
    options.mode === 'random' ? 0.2 : 0,
  );
  const solution = findRemovalSequence(fallbackArrows) ?? fallbackArrows.map((arrow) => arrow.id);
  return {
    seed: seed >>> 0,
    arrows: fallbackArrows,
    solution,
    initiallyFree: countInitiallyFree(fallbackArrows),
    level: options.level,
    mode: options.mode,
  };
}

export function createRandomSeed(): number {
  const cryptoSeed = new Uint32Array(1);
  crypto.getRandomValues(cryptoSeed);
  return cryptoSeed[0] || (Date.now() >>> 0);
}

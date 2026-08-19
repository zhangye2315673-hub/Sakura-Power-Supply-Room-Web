import * as THREE from 'three';

export type DirectionKey = '+X' | '-X' | '+Y' | '-Y' | '+Z' | '-Z';
export type GridPoint = readonly [number, number, number];
export type ArrowLengthClass = 'short' | 'medium' | 'long';
export type ShapeId =
  | 'cube'
  | 'cuboid'
  | 'octahedron'
  | 'pyramid'
  | 'cylinder'
  | 'sphere'
  | 'torus'
  | 'arch';
export type DifficultyBand = 'easy' | 'normal' | 'hard' | 'expert';
export type RandomChallengeKind = 'standard' | 'double-ended';
export type CableEnd = 'head' | 'tail';

export type LengthQuota = Readonly<Record<ArrowLengthClass, number>>;
export type GridExtents = readonly [number, number, number];

export type LevelDefinition = {
  id: number;
  seed: number;
  label: string;
  shape: ShapeId;
  difficulty: DifficultyBand;
  targetCount: number;
  lengthQuota: LengthQuota;
  minInitiallyFree: number;
  maxInitiallyFree: number;
  boundaryHeadRatio: number;
  halfExtents: GridExtents;
  minSpans: GridExtents;
  minNeighborRatio: number;
  minDensity: number;
  cameraRadius: number;
  challengeKind?: RandomChallengeKind;
  referenceTargetCount?: number;
};

export const GRID_SIZE = 11;
export const GRID_HALF = (GRID_SIZE - 1) / 2;
// One shared lane unit for every cable node. The enlarged plug envelope still
// fits inside the next lane with a visible silhouette gap.
export const LANE_PITCH = 0.58;
export const ARROW_RADIUS = 0.105;
export const COLLISION_RADIUS = 0.15;
export const PLUG_HEAD_MAX_RADIUS = 0.18;
export const PLUG_HEAD_MAX_LENGTH = 0.64;
// Distance from the cable socket to the visible end of the single-ended tail.
// The tail cap is centred 0.55 radii behind the socket and has a 0.76-radius
// extent, so its outer terminal is exactly 1.31 radii from the socket.
export const CABLE_TAIL_TERMINAL_LENGTH = ARROW_RADIUS * 1.31;
export const TERMINAL_PRESERVING_SOCKET_SHIFT = PLUG_HEAD_MAX_LENGTH - CABLE_TAIL_TERMINAL_LENGTH;
export const PLUG_HEAD_BODY_CLEARANCE_LENGTH = 0.52;
export const PLUG_HEAD_PIN_RADIUS = 0.035;
export const PLUG_HEAD_PIN_CLEARANCE = 0.08;
export const PLUG_HEAD_CLEARANCE = 0.015;
export const STATIC_BODY_CLEARANCE = ARROW_RADIUS * 2 + 0.035;
export const STATIC_PLUG_CLEARANCE = PLUG_HEAD_MAX_RADIUS + ARROW_RADIUS + PLUG_HEAD_CLEARANCE;
export const EXIT_DISTANCE = GRID_SIZE * LANE_PITCH * 1.65;

export const DIRECTION_VECTORS: Record<DirectionKey, THREE.Vector3> = {
  '+X': new THREE.Vector3(1, 0, 0),
  '-X': new THREE.Vector3(-1, 0, 0),
  '+Y': new THREE.Vector3(0, 1, 0),
  '-Y': new THREE.Vector3(0, -1, 0),
  '+Z': new THREE.Vector3(0, 0, 1),
  '-Z': new THREE.Vector3(0, 0, -1),
};

export type ArrowDefinition = {
  id: string;
  path: GridPoint[];
  exitDirection: DirectionKey;
  color: number;
  lengthClass: ArrowLengthClass;
  doubleEnded?: boolean;
  terminalAnchorMode?: 'preserve-external-endpoints';
};

export type PuzzleDefinition = {
  seed: number;
  arrows: ArrowDefinition[];
  solution: string[];
  solutionEnds?: CableEnd[];
  initiallyFree: number;
  level?: LevelDefinition;
  mode?: 'campaign' | 'random' | 'skill' | 'rush';
  challengeKind?: RandomChallengeKind;
};

export type ArrowState = 'idle' | 'moving' | 'removed' | 'bumping';

export type ArrowRuntime = {
  definition: ArrowDefinition;
  samplePoints: THREE.Vector3[];
  state: ArrowState;
};

export function gridPointToWorld(point: GridPoint, target = new THREE.Vector3()): THREE.Vector3 {
  return target.set(
    (point[0] - GRID_HALF) * LANE_PITCH,
    (point[1] - GRID_HALF) * LANE_PITCH,
    (point[2] - GRID_HALF) * LANE_PITCH,
  );
}

export function cableSocketPointsToWorld(definition: ArrowDefinition): THREE.Vector3[] {
  const points = definition.path.map((point) => gridPointToWorld(point));
  if (definition.terminalAnchorMode !== 'preserve-external-endpoints' || points.length < 2) {
    return points;
  }
  const tailDirection = points[0].clone().sub(points[1]).normalize();
  const headDirection = DIRECTION_VECTORS[definition.exitDirection];
  points[0].addScaledVector(tailDirection, TERMINAL_PRESERVING_SOCKET_SHIFT);
  points[points.length - 1].addScaledVector(headDirection, -TERMINAL_PRESERVING_SOCKET_SHIFT);
  return points;
}

export function cableExternalTerminalPositions(definition: ArrowDefinition): Readonly<{
  tail: THREE.Vector3;
  head: THREE.Vector3;
}> {
  const points = cableSocketPointsToWorld(definition);
  const tailDirection = points[0].clone().sub(points[1]).normalize();
  const headDirection = DIRECTION_VECTORS[definition.exitDirection];
  return {
    tail: points[0].clone().addScaledVector(tailDirection, CABLE_TAIL_TERMINAL_LENGTH),
    head: points[points.length - 1].clone().addScaledVector(headDirection, PLUG_HEAD_MAX_LENGTH),
  };
}

export function directionKeyFromDelta(delta: GridPoint): DirectionKey {
  if (delta[0] > 0) return '+X';
  if (delta[0] < 0) return '-X';
  if (delta[1] > 0) return '+Y';
  if (delta[1] < 0) return '-Y';
  if (delta[2] > 0) return '+Z';
  return '-Z';
}

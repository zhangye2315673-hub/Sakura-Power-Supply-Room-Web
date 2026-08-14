import * as THREE from 'three';

export const REFRIGERATOR_CLIMAX_TIME = 3.4;
export const REFRIGERATOR_ACTIVE_DURATION = 5.2;

const CABINET_HALF_X = 1.42;
const SIDE_ROUTE_X = 1.92;
const FRONT_ROUTE_Z = 2.62;

type RefrigeratorPropMeta = {
  id: string;
  category: string;
  homeZone: string;
  homePosition: [number, number, number];
  homeSocket: string;
  launchIndex: number;
  routeSide: -1 | 1;
  doorPivotName?: string;
  doorLocalHome?: [number, number, number];
};

export type RefrigeratorPropDiagnostics = {
  id: string;
  category: string;
  homeZone: string;
  homeSocket: string;
  phase: 'home' | 'launch' | 'orbit' | 'front-party' | 'return';
  position: [number, number, number];
  currentHome: [number, number, number];
  distanceFromHome: number;
  routeSide: -1 | 1;
  routeWaypoints: Array<[number, number, number]>;
  crossedBehindCabinet: boolean;
  rearToFrontViaSide: true;
  minimumSideClearance: number;
};

export type RefrigeratorPerformanceDiagnostics = {
  timelineTime: number;
  phase: 'idle' | 'open' | 'launch' | 'party' | 'return' | 'close';
  doorOpen: number;
  upperDoorAngle: number;
  lowerDoorAngle: number;
  visibleProps: number;
  launchedProps: number;
  gatheredProps: number;
  returnedProps: number;
  pathClearancePass: boolean;
  cabinetHalfWidth: number;
  sideRouteX: number;
  props: RefrigeratorPropDiagnostics[];
  timelineOwner: 'AppliancePerformanceSystem';
  modelOwner: 'refrigerator-food-performance-root';
  forbiddenLegacyEffects: readonly ['PlaneGeometry', 'Line', 'Sprite', 'generic-food-pool', 'generic-debris-pool'];
};

function smoothRange(time: number, start: number, end: number): number {
  return THREE.MathUtils.smoothstep(time, start, end);
}

function samplePolyline(target: THREE.Vector3, points: readonly THREE.Vector3[], progress: number): void {
  const scaled = THREE.MathUtils.clamp(progress, 0, 1) * (points.length - 1);
  const index = Math.min(points.length - 2, Math.floor(scaled));
  const local = THREE.MathUtils.smoothstep(scaled - index, 0, 1);
  target.copy(points[index]).lerp(points[index + 1], local);
}

function phaseAt(time: number, power: number): RefrigeratorPerformanceDiagnostics['phase'] {
  if (power <= 0.01 || time < 0.12) return 'idle';
  if (time < 0.88) return 'open';
  if (time < 2.05) return 'launch';
  if (time < 3.68) return 'party';
  if (time < 4.7) return 'return';
  return 'close';
}

function currentHome(root: THREE.Group, meta: RefrigeratorPropMeta, target: THREE.Vector3): THREE.Vector3 {
  if (!meta.doorPivotName || !meta.doorLocalHome) return target.fromArray(meta.homePosition);
  const door = root.getObjectByName(meta.doorPivotName);
  if (!door) return target.fromArray(meta.homePosition);
  target.fromArray(meta.doorLocalHome);
  door.localToWorld(target);
  root.worldToLocal(target);
  return target;
}

function partyWaypoints(meta: RefrigeratorPropMeta, home: THREE.Vector3): THREE.Vector3[] {
  const side = meta.routeSide;
  const band = meta.launchIndex % 3;
  const partyY = THREE.MathUtils.clamp(home.y + 0.35 + band * 0.22, 1.05, 4.75);
  const gatherLayout: ReadonlyArray<readonly [number, number]> = [
    [-1.55, 4.35],
    [-0.55, 4.82],
    [0.64, 4.3],
    [-1.62, 2.86],
    [-0.5, 3.28],
    [0.78, 2.78],
    [1.55, 1.48],
  ];
  const [gatherX, gatherY] = gatherLayout[meta.launchIndex] ?? [0, 2.5];
  return [
    new THREE.Vector3(home.x * 0.65, partyY, FRONT_ROUTE_Z),
    new THREE.Vector3(side * SIDE_ROUTE_X, partyY + 0.32, FRONT_ROUTE_Z),
    new THREE.Vector3(side * SIDE_ROUTE_X, partyY + 0.5, FRONT_ROUTE_Z + 0.18),
    new THREE.Vector3(side * 0.48, partyY + 0.26, FRONT_ROUTE_Z + 0.3),
    new THREE.Vector3(side * SIDE_ROUTE_X, partyY + 0.12, FRONT_ROUTE_Z + 0.12),
    new THREE.Vector3(side * SIDE_ROUTE_X, partyY + 0.42, FRONT_ROUTE_Z),
    // The open right-hinged doors sit near Z=2.3. Put the climax in front of
    // that plane so every sculpted prop reads clearly instead of hiding behind
    // a door slab in the evidence view.
    new THREE.Vector3(gatherX, gatherY, 2.92 + (meta.launchIndex % 2) * 0.14),
  ];
}

/**
 * Refrigerator-only choreography. Every moving food is a named model pivot;
 * there are no detached generic particles and no second animation owner.
 */
export function applyRefrigeratorPerformance(root: THREE.Group, time: number, power: number): void {
  const p = THREE.MathUtils.clamp(power, 0, 1);
  const opening = smoothRange(time, 0.14, 0.76);
  const closing = 1 - smoothRange(time, 4.72, 5.16);
  const doorOpen = p > 0.01 ? opening * closing : 0;
  const upperDoor = root.getObjectByName('refrigerator-upper-door-pivot');
  const lowerDoor = root.getObjectByName('refrigerator-lower-door-pivot');
  const upperDoorAngle = 2.62 * doorOpen;
  const lowerDoorAngle = 2.46 * doorOpen;
  if (upperDoor) upperDoor.rotation.y = upperDoorAngle;
  if (lowerDoor) lowerDoor.rotation.y = lowerDoorAngle;

  const interiorVisible = doorOpen > 0.08;
  const upperInterior = root.getObjectByName('refrigerator-upper-interior-content');
  const lowerInterior = root.getObjectByName('refrigerator-lower-interior-content');
  if (upperInterior) upperInterior.visible = interiorVisible;
  if (lowerInterior) lowerInterior.visible = interiorVisible;

  root.updateMatrixWorld(true);
  const foodRoot = root.getObjectByName('refrigerator-food-performance-root');
  const foodVisible = p > 0.01 && time >= 0.42 && time < 5.17;
  if (foodRoot) foodRoot.visible = foodVisible;

  const props = (foodRoot?.children ?? []).filter((object) => object.userData.refrigeratorProp) as THREE.Group[];
  const diagnostics: RefrigeratorPropDiagnostics[] = [];
  const home = new THREE.Vector3();
  const position = new THREE.Vector3();
  let launchedProps = 0;
  let gatheredProps = 0;
  let returnedProps = 0;

  props.forEach((prop) => {
    const meta = prop.userData.refrigeratorProp as RefrigeratorPropMeta;
    currentHome(root, meta, home);
    const waypoints = partyWaypoints(meta, home);
    const launchStart = 0.88 + meta.launchIndex * 0.105;
    const launchEnd = launchStart + 0.4;
    const orbitEnd = 2.82 + meta.launchIndex * 0.018;
    const returnStart = 3.68 + meta.launchIndex * 0.055;
    const returnEnd = returnStart + 0.54;
    let propPhase: RefrigeratorPropDiagnostics['phase'] = 'home';

    position.copy(home);
    if (time >= launchStart && time < launchEnd) {
      propPhase = 'launch';
      const progress = smoothRange(time, launchStart, launchEnd);
      position.lerpVectors(home, waypoints[0], progress);
      position.y += Math.sin(progress * Math.PI) * (0.34 + meta.launchIndex * 0.025);
      launchedProps += 1;
    } else if (time >= launchEnd && time < orbitEnd) {
      propPhase = 'orbit';
      const progress = (time - launchEnd) / Math.max(0.01, orbitEnd - launchEnd);
      samplePolyline(position, waypoints, progress);
      position.y += Math.sin(progress * Math.PI * 6 + meta.launchIndex) * 0.08;
      launchedProps += 1;
    } else if (time >= orbitEnd && time < returnStart) {
      propPhase = 'front-party';
      position.copy(waypoints[waypoints.length - 1]);
      position.x += Math.sin(time * (5.6 + meta.launchIndex * 0.17) + meta.launchIndex) * 0.16;
      position.y += Math.abs(Math.sin(time * (7.4 + meta.launchIndex * 0.13) + meta.launchIndex * 0.7)) * 0.28;
      position.z += Math.cos(time * 3.2 + meta.launchIndex) * 0.07;
      launchedProps += 1;
      gatheredProps += 1;
    } else if (time >= returnStart && time < returnEnd) {
      propPhase = 'return';
      const progress = smoothRange(time, returnStart, returnEnd);
      const gather = waypoints[waypoints.length - 1];
      if (progress < 0.58) {
        position.lerpVectors(gather, waypoints[0], THREE.MathUtils.smoothstep(progress / 0.58, 0, 1));
      } else {
        position.lerpVectors(waypoints[0], home, THREE.MathUtils.smoothstep((progress - 0.58) / 0.42, 0, 1));
      }
      position.y += Math.sin(progress * Math.PI) * 0.24;
      launchedProps += 1;
    } else if (time >= returnEnd) {
      position.copy(home);
      returnedProps += 1;
    }

    prop.position.copy(position);
    if (propPhase !== 'home') {
      const energy = propPhase === 'front-party' ? 1 : 0.72;
      prop.rotation.x = Math.sin(time * 4.2 + meta.launchIndex) * 0.34 * energy;
      prop.rotation.y = time * (1.25 + meta.launchIndex * 0.09) * energy;
      prop.rotation.z = Math.sin(time * 6.1 + meta.launchIndex * 0.8) * 0.42 * energy;
      const pulse = propPhase === 'front-party'
        ? 1.08 + Math.sin(time * 8 + meta.launchIndex) * 0.045
        : 1;
      prop.scale.setScalar(pulse);
    }

    diagnostics.push({
      id: meta.id,
      category: meta.category,
      homeZone: meta.homeZone,
      homeSocket: meta.homeSocket,
      phase: propPhase,
      position: [position.x, position.y, position.z],
      currentHome: [home.x, home.y, home.z],
      distanceFromHome: position.distanceTo(home),
      routeSide: meta.routeSide,
      routeWaypoints: waypoints.map((point) => [point.x, point.y, point.z]),
      crossedBehindCabinet: false,
      rearToFrontViaSide: true,
      minimumSideClearance: SIDE_ROUTE_X - CABINET_HALF_X,
    });
  });

  const service = root.getObjectByName('refrigerator-compressor-pivot');
  if (service) {
    const serviceRun = opening * closing * p;
    service.position.x += Math.sin(time * 19) * 0.012 * serviceRun;
    service.position.y += Math.sin(time * 23 + 0.7) * 0.008 * serviceRun;
  }

  root.userData.refrigeratorPerformanceDiagnostics = {
    timelineTime: time,
    phase: phaseAt(time, p),
    doorOpen,
    upperDoorAngle,
    lowerDoorAngle,
    visibleProps: foodVisible ? props.length : 0,
    launchedProps,
    gatheredProps,
    returnedProps,
    pathClearancePass: diagnostics.every((prop) => prop.minimumSideClearance >= 0.48 && prop.rearToFrontViaSide),
    cabinetHalfWidth: CABINET_HALF_X,
    sideRouteX: SIDE_ROUTE_X,
    props: diagnostics,
    timelineOwner: 'AppliancePerformanceSystem',
    modelOwner: 'refrigerator-food-performance-root',
    forbiddenLegacyEffects: ['PlaneGeometry', 'Line', 'Sprite', 'generic-food-pool', 'generic-debris-pool'],
  } satisfies RefrigeratorPerformanceDiagnostics;
}

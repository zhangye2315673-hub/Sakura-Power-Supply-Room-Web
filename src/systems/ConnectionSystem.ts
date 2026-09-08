import * as THREE from 'three';
import { cableJelly } from '../style/jelly';
import {
  createPlugHead,
  PLUG_HEAD_SCALE,
  type PlugHead,
  type PlugStyleId,
} from '../render/PlugParts';
import {
  CABLE_RADIAL_SEGMENTS,
  CABLE_RADIUS,
} from '../render/CableGeometry';
import type { ApplianceTarget } from './ApplianceScene';

type ConnectionFlight = {
  root: THREE.Group;
  phase: 'exit' | 'enter';
  curve: THREE.CatmullRomCurve3;
  start: THREE.Vector3;
  exitDirection: THREE.Vector3;
  head: PlugHead;
  cable: THREE.InstancedMesh<THREE.CylinderGeometry, THREE.MeshPhysicalMaterial>;
  material: THREE.MeshPhysicalMaterial;
  target: ApplianceTarget;
  color: number;
  phaseStartedAt: number;
  duration: number;
  onComplete: () => void;
};

const up = new THREE.Vector3(0, 1, 0);
const easeOutCubic = (value: number): number => 1 - (1 - value) ** 3;
const OFFSCREEN_NDC = 1.16;
const INNER_EDGE_NDC = 0.86;
const EXIT_DURATION = 0.58;
const ENTER_DURATION = 0.96;
const TRAIL_SEGMENT_COUNT = 9;
const hiddenTrailMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
const trailPointA = new THREE.Vector3();
const trailPointB = new THREE.Vector3();
const trailMidpoint = new THREE.Vector3();
const trailDirection = new THREE.Vector3();
const trailQuaternion = new THREE.Quaternion();
const trailScale = new THREE.Vector3();
const trailMatrix = new THREE.Matrix4();

function worldPointAtNdc(
  ndc: THREE.Vector2,
  reference: THREE.Vector3,
  camera: THREE.PerspectiveCamera,
): THREE.Vector3 {
  const depth = reference.clone().project(camera).z;
  return new THREE.Vector3(ndc.x, ndc.y, depth).unproject(camera);
}

function screenExitDirection(
  start: THREE.Vector3,
  direction: THREE.Vector3,
  camera: THREE.PerspectiveCamera,
): THREE.Vector2 {
  const projectedStart = start.clone().project(camera);
  const projectedAhead = start.clone().addScaledVector(direction, 1.2).project(camera);
  const result = new THREE.Vector2(
    projectedAhead.x - projectedStart.x,
    projectedAhead.y - projectedStart.y,
  );
  if (result.lengthSq() > 0.0004) return result.normalize();

  const cameraRight = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
  const cameraUp = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
  result.set(direction.dot(cameraRight), direction.dot(cameraUp));
  if (result.lengthSq() > 0.0001) return result.normalize();

  result.set(projectedStart.x, projectedStart.y);
  return result.lengthSq() > 0.0001 ? result.normalize() : result.set(1, 0);
}

function offscreenPoint(origin: THREE.Vector2, direction: THREE.Vector2): THREE.Vector2 {
  const distances: number[] = [];
  if (direction.x > 0.0001) distances.push((OFFSCREEN_NDC - origin.x) / direction.x);
  if (direction.x < -0.0001) distances.push((-OFFSCREEN_NDC - origin.x) / direction.x);
  if (direction.y > 0.0001) distances.push((OFFSCREEN_NDC - origin.y) / direction.y);
  if (direction.y < -0.0001) distances.push((-OFFSCREEN_NDC - origin.y) / direction.y);
  const distance = Math.min(...distances.filter((value) => value > 0.02));
  return Number.isFinite(distance)
    ? origin.clone().addScaledVector(direction, distance + 0.08)
    : origin.clone().addScaledVector(direction, 0.42);
}

function buildExitCurve(
  start: THREE.Vector3,
  exitDirection: THREE.Vector3,
  camera: THREE.PerspectiveCamera,
): THREE.CatmullRomCurve3 {
  const projectedStart3 = start.clone().project(camera);
  const projectedStart = new THREE.Vector2(projectedStart3.x, projectedStart3.y);
  const screenDirection = screenExitDirection(start, exitDirection, camera);
  const projectedEnd = offscreenPoint(projectedStart, screenDirection);
  const projectedBridge = projectedStart.clone().lerp(projectedEnd, 0.62);
  const bridge = worldPointAtNdc(projectedBridge, start, camera);
  const end = worldPointAtNdc(projectedEnd, start, camera);

  return new THREE.CatmullRomCurve3(
    [start.clone(), start.clone().addScaledVector(exitDirection, 1.25), bridge, end],
    false,
    'centripetal',
    0.45,
  );
}

function buildEntryCurve(
  target: ApplianceTarget,
  camera: THREE.PerspectiveCamera,
): THREE.CatmullRomCurve3 {
  const end = target.getConnectionWorldPosition();
  const projectedSocket = end.clone().project(camera);
  const outside = new THREE.Vector2(
    THREE.MathUtils.clamp(projectedSocket.x, -0.82, 0.82),
    THREE.MathUtils.clamp(projectedSocket.y, -0.82, 0.82),
  );
  const inside = outside.clone();

  if (target.outwardEdge === 'left') {
    outside.x = -OFFSCREEN_NDC;
    inside.x = -INNER_EDGE_NDC;
  } else if (target.outwardEdge === 'right') {
    outside.x = OFFSCREEN_NDC;
    inside.x = INNER_EDGE_NDC;
  } else if (target.outwardEdge === 'top') {
    outside.y = OFFSCREEN_NDC;
    inside.y = INNER_EDGE_NDC;
  } else {
    outside.y = -OFFSCREEN_NDC;
    inside.y = -INNER_EDGE_NDC;
  }

  const entry = worldPointAtNdc(outside, end, camera);
  const edgeInside = worldPointAtNdc(inside, end, camera);

  return new THREE.CatmullRomCurve3(
    [entry, edgeInside, end],
    false,
    'centripetal',
    0.45,
  );
}

export class ConnectionSystem {
  readonly root = new THREE.Group();
  private readonly flights: ConnectionFlight[] = [];

  get activeCount(): number {
    return this.flights.length;
  }

  constructor() {
    this.root.name = 'connection-flights';
  }

  begin(
    start: THREE.Vector3,
    exitDirection: THREE.Vector3,
    target: ApplianceTarget,
    color: number,
    plugStyleId: PlugStyleId,
    camera: THREE.PerspectiveCamera,
    onComplete: () => void,
  ): void {
    target.reserve(color);
    const material = cableJelly({ color, thickness: CABLE_RADIUS * 2 });
    const head = createPlugHead(color, PLUG_HEAD_SCALE, true, plugStyleId);
    // Flying plugs share the gel of the side connection. The puzzle's original
    // plug materials and skill shaders remain owned by their existing factory.
    const gelMaterials = new Map<THREE.Material, THREE.Material>();
    head.root.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      if (object.userData.isOutline) { object.visible = false; return; }
      const convert = (source: THREE.Material): THREE.Material => {
        if (!(source instanceof THREE.MeshToonMaterial)) return source;
        let gel = gelMaterials.get(source);
        if (!gel) {
          gel = cableJelly({ color: source.color, thickness: 0.12 });
          gelMaterials.set(source, gel);
        }
        return gel;
      };
      object.material = Array.isArray(object.material)
        ? object.material.map(convert) : convert(object.material);
    });
    gelMaterials.forEach((_, source) => source.dispose());
    const cable = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(
        CABLE_RADIUS,
        CABLE_RADIUS,
        1,
        CABLE_RADIAL_SEGMENTS,
        1,
        false,
      ),
      material,
      TRAIL_SEGMENT_COUNT,
    );
    cable.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    for (let index = 0; index < TRAIL_SEGMENT_COUNT; index += 1) {
      cable.setMatrixAt(index, hiddenTrailMatrix);
    }
    cable.instanceMatrix.needsUpdate = true;
    cable.castShadow = false;
    cable.receiveShadow = false;
    cable.frustumCulled = false;
    cable.visible = false;
    const root = new THREE.Group();
    root.add(cable, head.root);
    this.root.add(root);
    this.flights.push({
      root,
      phase: 'exit',
      curve: buildExitCurve(start, exitDirection, camera),
      start: start.clone(),
      exitDirection: exitDirection.clone().normalize(),
      head,
      cable,
      material,
      target,
      color,
      phaseStartedAt: performance.now() * 0.001,
      duration: EXIT_DURATION,
      onComplete,
    });
  }

  update(delta: number, camera: THREE.PerspectiveCamera): void {
    void delta;
    const now = performance.now() * 0.001;
    for (let index = this.flights.length - 1; index >= 0; index -= 1) {
      const flight = this.flights[index];
      flight.curve =
        flight.phase === 'exit'
          ? buildExitCurve(flight.start, flight.exitDirection, camera)
          : buildEntryCurve(flight.target, camera);
      const rawProgress = Math.min(1, (now - flight.phaseStartedAt) / flight.duration);
      const progress = easeOutCubic(rawProgress);
      const position = flight.curve.getPointAt(progress);
      const tangent = flight.curve.getTangentAt(Math.min(0.999, progress)).normalize();
      flight.head.root.position.copy(position);
      flight.head.root.quaternion.setFromUnitVectors(up, tangent);

      const trailStart = Math.max(0, progress - (flight.phase === 'exit' ? 0.34 : 0.24));
      if (progress > 0.012) {
        flight.curve.getPointAt(trailStart, trailPointA);
        for (let segment = 0; segment < TRAIL_SEGMENT_COUNT; segment += 1) {
          const sampleProgress = THREE.MathUtils.lerp(
            trailStart,
            progress,
            (segment + 1) / TRAIL_SEGMENT_COUNT,
          );
          flight.curve.getPointAt(sampleProgress, trailPointB);
          trailDirection.subVectors(trailPointB, trailPointA);
          const length = Math.max(0.0001, trailDirection.length());
          trailDirection.multiplyScalar(1 / length);
          trailMidpoint.addVectors(trailPointA, trailPointB).multiplyScalar(0.5);
          trailQuaternion.setFromUnitVectors(up, trailDirection);
          trailScale.set(1, length, 1);
          trailMatrix.compose(trailMidpoint, trailQuaternion, trailScale);
          flight.cable.setMatrixAt(segment, trailMatrix);
          trailPointA.copy(trailPointB);
        }
        flight.cable.instanceMatrix.needsUpdate = true;
        flight.cable.visible = true;
      }

      if (flight.phase === 'enter' && rawProgress > 0.86) {
        const settle = (rawProgress - 0.86) / 0.14;
        const squash = 1 - Math.sin(settle * Math.PI) * 0.08;
        flight.head.root.scale.set(squash, 1 / squash, squash);
      }
      if (flight.phase === 'enter') flight.head.root.visible = rawProgress < 0.995;
      if (rawProgress < 1) continue;

      if (flight.phase === 'exit') {
        flight.phase = 'enter';
        flight.phaseStartedAt = now;
        flight.duration = ENTER_DURATION;
        flight.curve = buildEntryCurve(flight.target, camera);
        flight.cable.visible = false;
        flight.head.root.visible = true;
        flight.head.root.scale.setScalar(1);
        continue;
      }

      flight.target.activate(flight.color);
      flight.onComplete();
      this.disposeFlight(flight);
      this.flights.splice(index, 1);
    }
  }

  clear(): void {
    this.flights.forEach((flight) => this.disposeFlight(flight));
    this.flights.length = 0;
  }

  dispose(): void {
    this.clear();
    this.root.removeFromParent();
  }

  private disposeFlight(flight: ConnectionFlight): void {
    flight.root.removeFromParent();
    flight.cable.geometry.dispose();
    flight.head.dispose();
    flight.material.dispose();
  }
}

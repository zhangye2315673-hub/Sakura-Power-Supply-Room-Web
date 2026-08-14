import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ARROW_RADIUS } from '../puzzle/types';
import { cel } from '../style/toon';

export const CABLE_RADIUS = ARROW_RADIUS;
export const CABLE_RADIAL_SEGMENTS = 8;
export const CABLE_FILLET_RADIUS = 0.13;
export const CABLE_FILLET_LEG_LIMIT = 0.28;
export const CABLE_FILLET_MIN_RADIUS = 0.025;
export const CABLE_FILLET_ARC_SEGMENTS = 4;

const EPSILON = 1e-6;
const zAxis = new THREE.Vector3(0, 0, 1);

export type CableFilletDiagnostic = {
  cornerIndex: number;
  applied: boolean;
  radius: number;
  incomingLength: number;
  outgoingLength: number;
  tangentStart: THREE.Vector3;
  tangentEnd: THREE.Vector3;
  center: THREE.Vector3 | null;
};

export type RoundedCablePath = {
  curve: THREE.CurvePath<THREE.Vector3>;
  fillets: CableFilletDiagnostic[];
  sourcePoints: THREE.Vector3[];
};

export type RoundedCableGeometry = RoundedCablePath & {
  geometry: THREE.BufferGeometry;
};

export function createCableToonMaterial(
  color: THREE.ColorRepresentation,
): THREE.MeshToonMaterial {
  const material = cel({
    color,
    bands: 3,
    tint: 0x625874,
    flatShading: true,
  });
  material.name = 'sakura-cable-toon';
  material.userData.materialRole = 'cable-rubber';
  material.userData.radialSegments = CABLE_RADIAL_SEGMENTS;
  const visualInflation = { value: 0 };
  const previousOnBeforeCompile = material.onBeforeCompile.bind(material);
  const previousProgramCacheKey = material.customProgramCacheKey.bind(material);
  material.userData.visualInflation = visualInflation;
  material.onBeforeCompile = (shader, renderer) => {
    previousOnBeforeCompile(shader, renderer);
    shader.uniforms.uCableVisualInflation = visualInflation;
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nuniform float uCableVisualInflation;',
      )
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\ntransformed += objectNormal * uCableVisualInflation;',
      );
  };
  material.customProgramCacheKey = () => `${previousProgramCacheKey()}-cable-visual-inflation-v1`;
  return material;
}

export function setCableVisualInflation(
  material: THREE.MeshToonMaterial,
  inflation: number,
): void {
  const uniform = material.userData.visualInflation as { value: number } | undefined;
  if (uniform) uniform.value = Math.max(0, inflation);
}

class QuarterCircleCurve3 extends THREE.Curve<THREE.Vector3> {
  constructor(
    private readonly center: THREE.Vector3,
    private readonly startRadius: THREE.Vector3,
    private readonly axis: THREE.Vector3,
  ) {
    super();
  }

  override getPoint(t: number, target = new THREE.Vector3()): THREE.Vector3 {
    return target
      .copy(this.startRadius)
      .applyAxisAngle(this.axis, THREE.MathUtils.clamp(t, 0, 1) * Math.PI * 0.5)
      .add(this.center);
  }

  override getTangent(t: number, target = new THREE.Vector3()): THREE.Vector3 {
    const radial = this.startRadius
      .clone()
      .applyAxisAngle(this.axis, THREE.MathUtils.clamp(t, 0, 1) * Math.PI * 0.5);
    return target.crossVectors(this.axis, radial).normalize();
  }
}

function distinctPoints(points: readonly THREE.Vector3[]): THREE.Vector3[] {
  const result: THREE.Vector3[] = [];
  points.forEach((point) => {
    if (!result.length || result[result.length - 1].distanceToSquared(point) > EPSILON ** 2) {
      result.push(point.clone());
    }
  });
  return result;
}

function addLine(
  curve: THREE.CurvePath<THREE.Vector3>,
  start: THREE.Vector3,
  end: THREE.Vector3,
): void {
  if (start.distanceToSquared(end) <= EPSILON ** 2) return;
  curve.add(new THREE.LineCurve3(start.clone(), end.clone()));
}

export function createRoundedCablePath(
  points: readonly THREE.Vector3[],
  requestedRadius = CABLE_FILLET_RADIUS,
): RoundedCablePath {
  const sourcePoints = distinctPoints(points);
  if (sourcePoints.length < 2) throw new Error('A cable path needs at least two distinct points.');

  const curve = new THREE.CurvePath<THREE.Vector3>();
  const fillets: CableFilletDiagnostic[] = [];
  let cursor = sourcePoints[0].clone();

  for (let index = 1; index < sourcePoints.length - 1; index += 1) {
    const previous = sourcePoints[index - 1];
    const corner = sourcePoints[index];
    const next = sourcePoints[index + 1];
    const incomingVector = corner.clone().sub(previous);
    const outgoingVector = next.clone().sub(corner);
    const incomingLength = incomingVector.length();
    const outgoingLength = outgoingVector.length();
    const incoming = incomingVector.clone().normalize();
    const outgoing = outgoingVector.clone().normalize();
    const dot = incoming.dot(outgoing);
    const axis = incoming.clone().cross(outgoing);
    const isOrthogonal = Math.abs(dot) <= 1e-4 && axis.lengthSq() > 1e-8;
    const radius = isOrthogonal
      ? Math.min(requestedRadius, incomingLength * CABLE_FILLET_LEG_LIMIT, outgoingLength * CABLE_FILLET_LEG_LIMIT)
      : 0;

    if (!isOrthogonal || radius < CABLE_FILLET_MIN_RADIUS) {
      if (dot < 0.9999) {
        addLine(curve, cursor, corner);
        cursor = corner.clone();
      }
      fillets.push({
        cornerIndex: index,
        applied: false,
        radius,
        incomingLength,
        outgoingLength,
        tangentStart: corner.clone(),
        tangentEnd: corner.clone(),
        center: null,
      });
      continue;
    }

    axis.normalize();
    const tangentStart = corner.clone().addScaledVector(incoming, -radius);
    const tangentEnd = corner.clone().addScaledVector(outgoing, radius);
    const center = tangentStart.clone().addScaledVector(outgoing, radius);
    const startRadius = tangentStart.clone().sub(center);
    addLine(curve, cursor, tangentStart);
    curve.add(new QuarterCircleCurve3(center, startRadius, axis));
    cursor = tangentEnd;
    fillets.push({
      cornerIndex: index,
      applied: true,
      radius,
      incomingLength,
      outgoingLength,
      tangentStart,
      tangentEnd,
      center,
    });
  }

  addLine(curve, cursor, sourcePoints[sourcePoints.length - 1]);
  if (curve.curves.length === 0) {
    throw new Error('Cable path collapsed to zero length.');
  }
  return { curve, fillets, sourcePoints };
}

function capGeometry(
  point: THREE.Vector3,
  outwardNormal: THREE.Vector3,
  radius: number,
  radialSegments: number,
): THREE.BufferGeometry {
  const cap = new THREE.CircleGeometry(radius, radialSegments);
  cap.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(zAxis, outwardNormal.clone().normalize()));
  cap.translate(point.x, point.y, point.z);
  return cap;
}

function takeNonIndexed(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  const result = geometry.index ? geometry.toNonIndexed() : geometry.clone();
  geometry.dispose();
  return result;
}

export function createCappedTubeGeometry(
  curve: THREE.Curve<THREE.Vector3>,
  radius = CABLE_RADIUS,
  radialSegments = CABLE_RADIAL_SEGMENTS,
  tubularSegments = Math.max(2, Math.ceil(curve.getLength() / 0.16)),
): THREE.BufferGeometry {
  const segmentCount = Math.max(2, tubularSegments);
  const tube = new THREE.TubeGeometry(curve, segmentCount, radius, radialSegments, false);
  const start = curve.getPoint(0);
  const end = curve.getPoint(1);
  const startTangent = curve.getTangent(0).normalize();
  const endTangent = curve.getTangent(1).normalize();
  const parts = [
    takeNonIndexed(tube),
    takeNonIndexed(capGeometry(start, startTangent.clone().negate(), radius, radialSegments)),
    takeNonIndexed(capGeometry(end, endTangent, radius, radialSegments)),
  ];
  const geometry = mergeGeometries(parts, false);
  parts.forEach((part) => part.dispose());
  if (!geometry) throw new Error('Unable to merge capped cable tube geometry.');
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

export function createRoundedCableGeometry(
  points: readonly THREE.Vector3[],
  requestedRadius = CABLE_FILLET_RADIUS,
): RoundedCableGeometry {
  const path = createRoundedCablePath(points, requestedRadius);
  const lineSegments = Math.max(2, Math.ceil(path.curve.getLength() / 0.16));
  const arcSegments = path.fillets.filter((fillet) => fillet.applied).length * CABLE_FILLET_ARC_SEGMENTS;
  const geometry = createCappedTubeGeometry(
    path.curve,
    CABLE_RADIUS,
    CABLE_RADIAL_SEGMENTS,
    lineSegments + arcSegments,
  );
  geometry.userData.cableFillets = path.fillets.map((fillet) => ({
    cornerIndex: fillet.cornerIndex,
    applied: fillet.applied,
    radius: fillet.radius,
    tangentStart: fillet.tangentStart.toArray(),
    tangentEnd: fillet.tangentEnd.toArray(),
    center: fillet.center?.toArray() ?? null,
  }));
  return { ...path, geometry };
}

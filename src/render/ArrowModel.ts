import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { addHullOutline } from '../style/outline';
import { cel } from '../style/toon';
import { PAL } from '../style/palette';
import {
  ARROW_RADIUS,
  DIRECTION_VECTORS,
  gridPointToWorld,
  type ArrowDefinition,
} from '../puzzle/types';

const up = new THREE.Vector3(0, 1, 0);
const segmentGeometry = new THREE.CylinderGeometry(ARROW_RADIUS, ARROW_RADIUS, 1, 8, 1, false);
const jointGeometry = new THREE.DodecahedronGeometry(ARROW_RADIUS * 1.08, 1);
const headGeometry = new THREE.ConeGeometry(ARROW_RADIUS * 1.72, ARROW_RADIUS * 3.75, 8, 1, false);
const tailGeometry = new THREE.CylinderGeometry(
  ARROW_RADIUS * 0.86,
  ARROW_RADIUS * 1.02,
  ARROW_RADIUS * 0.72,
  8,
);

function transformedGeometry(
  source: THREE.BufferGeometry,
  position: THREE.Vector3,
  quaternion = new THREE.Quaternion(),
  scale = new THREE.Vector3(1, 1, 1),
): THREE.BufferGeometry {
  const geometry = source.index ? source.toNonIndexed() : source.clone();
  geometry.applyMatrix4(new THREE.Matrix4().compose(position, quaternion, scale));
  return geometry;
}

export class ArrowModel {
  readonly root = new THREE.Group();
  readonly pickMeshes: THREE.Mesh[] = [];
  readonly material: THREE.MeshToonMaterial;
  readonly pathLength: number;
  private readonly basePoints: THREE.Vector3[];
  private readonly cumulativeLengths: number[];
  private readonly exitDirection: THREE.Vector3;
  private readonly baseColor: THREE.Color;
  private bodyMesh: THREE.Mesh | null = null;
  private outlineMesh: THREE.Mesh | null = null;
  private lastMotionDistance = Number.NaN;

  get motionDistance(): number {
    return Number.isFinite(this.lastMotionDistance) ? this.lastMotionDistance : 0;
  }

  constructor(readonly definition: ArrowDefinition) {
    this.root.name = definition.id;
    this.root.userData.arrowId = definition.id;
    this.baseColor = new THREE.Color(definition.color);
    this.material = cel({
      color: definition.color,
      bands: 3,
      tint: 0x6c5f8c,
      flatShading: true,
    });
    this.basePoints = definition.path.map((point) => gridPointToWorld(point));
    this.cumulativeLengths = [0];
    for (let index = 1; index < this.basePoints.length; index += 1) {
      this.cumulativeLengths.push(
        this.cumulativeLengths[index - 1] + this.basePoints[index - 1].distanceTo(this.basePoints[index]),
      );
    }
    this.pathLength = this.cumulativeLengths[this.cumulativeLengths.length - 1];
    this.exitDirection = DIRECTION_VECTORS[this.definition.exitDirection].clone();
    this.build(this.basePoints, true);
  }

  setHovered(hovered: boolean): void {
    this.material.color.copy(this.baseColor).lerp(new THREE.Color(PAL.blossomLight), hovered ? 0.24 : 0);
    this.material.emissive.set(hovered ? 0x33263e : 0x000000);
    this.material.emissiveIntensity = hovered ? 0.35 : 1;
  }

  setBlockedFlash(amount: number): void {
    this.material.emissive.set(PAL.redDeep);
    this.material.emissiveIntensity = amount * 0.75;
  }

  resetMaterial(): void {
    this.material.color.copy(this.baseColor);
    this.material.emissive.set(0x000000);
    this.material.emissiveIntensity = 1;
  }

  /**
   * Move the visible arrow window along its own polyline. The tail and head
   * remain one fixed-length shape, while every bend is visited in sequence.
   * This is the snake-like motion used by the 2D puzzle, not rigid translation.
   */
  setMotionDistance(distance: number): void {
    if (Number.isFinite(this.lastMotionDistance) && Math.abs(distance - this.lastMotionDistance) < 0.004) {
      return;
    }
    this.lastMotionDistance = Math.max(0, distance);
    const start = this.lastMotionDistance;
    const end = start + this.pathLength;
    const points: THREE.Vector3[] = [this.pointAtDistance(start)];

    for (let index = 1; index < this.basePoints.length - 1; index += 1) {
      const length = this.cumulativeLengths[index];
      if (length > start && length < end) points.push(this.basePoints[index].clone());
    }
    points.push(this.pointAtDistance(end));
    this.build(points, this.lastMotionDistance === 0);
  }

  dispose(): void {
    this.root.removeFromParent();
    this.bodyMesh?.geometry.dispose();
    this.outlineMesh?.geometry.dispose();
    (this.outlineMesh?.material as THREE.Material | undefined)?.dispose();
    this.material.dispose();
    this.bodyMesh = null;
    this.outlineMesh = null;
    this.pickMeshes.length = 0;
  }

  private pointAtDistance(distance: number): THREE.Vector3 {
    if (distance <= 0) return this.basePoints[0].clone();
    if (distance >= this.pathLength) {
      return this.basePoints[this.basePoints.length - 1]
        .clone()
        .addScaledVector(this.exitDirection, distance - this.pathLength);
    }

    for (let index = 1; index < this.cumulativeLengths.length; index += 1) {
      if (distance > this.cumulativeLengths[index]) continue;
      const segmentStart = this.cumulativeLengths[index - 1];
      const segmentLength = this.cumulativeLengths[index] - segmentStart;
      return this.basePoints[index - 1]
        .clone()
        .lerp(this.basePoints[index], (distance - segmentStart) / segmentLength);
    }
    return this.basePoints[this.basePoints.length - 1].clone();
  }

  private build(points: readonly THREE.Vector3[], withOutline = true): void {
    if (points.length < 2) return;
    const previousBody = this.bodyMesh;
    const previousOutline = this.outlineMesh;
    if (previousBody) {
      this.root.remove(previousBody);
      previousBody.geometry.dispose();
      previousOutline?.geometry.dispose();
      (previousOutline?.material as THREE.Material | undefined)?.dispose();
    }
    this.pickMeshes.length = 0;

    const parts: THREE.BufferGeometry[] = [];
    for (let index = 0; index < points.length - 1; index += 1) {
      const start = points[index];
      const end = points[index + 1];
      const direction = end.clone().sub(start);
      const length = direction.length();
      if (length < 1e-4) continue;
      direction.normalize();
      parts.push(
        transformedGeometry(
          segmentGeometry,
          start.clone().lerp(end, 0.5),
          new THREE.Quaternion().setFromUnitVectors(up, direction),
          new THREE.Vector3(1, length, 1),
        ),
      );
      if (index > 0) parts.push(transformedGeometry(jointGeometry, start));
    }

    const firstDirection = points[1].clone().sub(points[0]).normalize();
    parts.push(
      transformedGeometry(
        tailGeometry,
        points[0].clone().addScaledVector(firstDirection, -ARROW_RADIUS * 0.16),
        new THREE.Quaternion().setFromUnitVectors(up, firstDirection),
      ),
    );

    const headPoint = points[points.length - 1];
    parts.push(
      transformedGeometry(
        headGeometry,
        headPoint.clone().addScaledVector(this.exitDirection, ARROW_RADIUS * 1.5),
        new THREE.Quaternion().setFromUnitVectors(up, this.exitDirection),
      ),
    );

    const mergedGeometry = mergeGeometries(parts, false);
    parts.forEach((part) => part.dispose());
    if (!mergedGeometry) throw new Error(`Unable to merge geometry for ${this.definition.id}`);
    mergedGeometry.computeBoundingSphere();

    const mesh = new THREE.Mesh(mergedGeometry, this.material);
    mesh.name = `${this.definition.id}-body`;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.arrowId = this.definition.id;
    this.outlineMesh = withOutline ? addHullOutline(mesh, 0.00345) : null;
    this.bodyMesh = mesh;
    this.pickMeshes.push(mesh);
    this.root.add(mesh);
  }
}

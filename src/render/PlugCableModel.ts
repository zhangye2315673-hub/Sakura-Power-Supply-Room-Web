import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { addHullOutline, setHullOutlineVisualInflation } from '../style/outline';
import { PAL } from '../style/palette';
import { cel } from '../style/toon';
import {
  ARROW_RADIUS,
  DIRECTION_VECTORS,
  PLUG_HEAD_MAX_LENGTH,
  PLUG_HEAD_MAX_RADIUS,
  gridPointToWorld,
  type ArrowDefinition,
  type CableEnd,
} from '../puzzle/types';
import { cableEndDirection } from '../puzzle/collision';
import {
  createPlugHead,
  PLUG_HEAD_SCALE,
  type PlugHead,
  type PlugStyleId,
} from './PlugParts';
import {
  CABLE_RADIUS,
  createCableToonMaterial,
  createRoundedCableGeometry,
  setCableVisualInflation,
} from './CableGeometry';

const up = new THREE.Vector3(0, 1, 0);
export const PLUG_CABLE_SOCKET_OVERLAP = ARROW_RADIUS * 0.48;
const tailGeometry = new THREE.CylinderGeometry(
  ARROW_RADIUS * 0.82,
  ARROW_RADIUS * 1.08,
  ARROW_RADIUS * 1.15,
  10,
);
const availableHintGeometry = new THREE.TorusGeometry(
  PLUG_HEAD_MAX_RADIUS * 1.58,
  PLUG_HEAD_MAX_RADIUS * 0.22,
  8,
  28,
);
const availableHintOuterGeometry = new THREE.TorusGeometry(
  PLUG_HEAD_MAX_RADIUS * 2.05,
  PLUG_HEAD_MAX_RADIUS * 0.08,
  8,
  28,
);
const availableHintBeaconGeometry = new THREE.OctahedronGeometry(PLUG_HEAD_MAX_RADIUS * 0.56, 0);
const AVAILABLE_HINT_REVEAL_DURATION = 0.48;
const AVAILABLE_HINT_REVEAL_OVERSHOOT = 1.72;
const AVAILABLE_HINT_PULSE_SPEED = 5.2;
const AVAILABLE_HINT_PULSE_AMOUNT = 0.11;
const AVAILABLE_HINT_BOB_SPEED = 4.1;
const AVAILABLE_HINT_BOB_AMOUNT = PLUG_HEAD_MAX_RADIUS * 0.08;
const availableHintMaterial = new THREE.MeshBasicMaterial({
  color: PAL.yellow,
  transparent: true,
  opacity: 0.94,
  depthWrite: false,
  toneMapped: false,
});
const availableHintOuterMaterial = new THREE.MeshBasicMaterial({
  color: PAL.yellow,
  transparent: true,
  opacity: 0.58,
  depthWrite: false,
  toneMapped: false,
});

function createAvailableEndHint(): THREE.Group {
  const hint = new THREE.Group();
  hint.name = 'available-end-hint';
  hint.position.y = PLUG_HEAD_MAX_LENGTH * 0.58;
  hint.visible = false;
  const innerRing = new THREE.Mesh(availableHintGeometry, availableHintMaterial);
  innerRing.rotation.x = Math.PI * 0.5;
  innerRing.renderOrder = 8;
  const outerRing = new THREE.Mesh(availableHintOuterGeometry, availableHintOuterMaterial);
  outerRing.rotation.x = Math.PI * 0.5;
  outerRing.renderOrder = 8;
  const beacon = new THREE.Mesh(availableHintBeaconGeometry, availableHintMaterial);
  beacon.position.y = PLUG_HEAD_MAX_LENGTH * 0.82;
  beacon.rotation.y = Math.PI * 0.25;
  beacon.renderOrder = 8;
  hint.add(innerRing, outerRing, beacon);
  return hint;
}

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

export class PlugCableModel {
  readonly root = new THREE.Group();
  readonly pickMeshes: THREE.Mesh[] = [];
  readonly material: THREE.MeshToonMaterial;
  readonly pathLength: number;
  private readonly basePoints: THREE.Vector3[];
  private readonly cumulativeLengths: number[];
  private readonly exitDirection: THREE.Vector3;
  private readonly tailExitDirection: THREE.Vector3;
  private readonly baseColor: THREE.Color;
  private readonly head: PlugHead;
  private tailHead: PlugHead | null;
  private readonly headAvailableHint = createAvailableEndHint();
  private tailAvailableHint: THREE.Group | null;
  private readonly tailRoot = new THREE.Group();
  private readonly tailMaterial: THREE.MeshToonMaterial;
  private bodyMesh: THREE.Mesh | null = null;
  private outlineMesh: THREE.Mesh | null = null;
  private lastMotionDistance = 0;
  private lastMotionEnd: CableEnd = 'head';
  private hintRevealProgress = 1;
  private visualThickness = 1;

  get motionDistance(): number {
    return Number.isFinite(this.lastMotionDistance) ? this.lastMotionDistance : 0;
  }

  constructor(
    readonly definition: ArrowDefinition,
    readonly plugStyleId: PlugStyleId = 'round-two-pin',
  ) {
    this.root.name = definition.id;
    this.root.userData.arrowId = definition.id;
    this.baseColor = new THREE.Color(definition.color);
    this.material = createCableToonMaterial(definition.color);
    this.tailMaterial = cel({
      color: this.baseColor.clone().multiplyScalar(0.72),
      bands: 3,
      tint: 0x625874,
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
    this.tailExitDirection = DIRECTION_VECTORS[cableEndDirection(definition, 'tail')].clone();
    this.head = createPlugHead(definition.color, PLUG_HEAD_SCALE, false, plugStyleId);
    this.tagHeadPickMeshes(this.head, 'head');
    this.tailHead = definition.doubleEnded
      ? createPlugHead(definition.color, PLUG_HEAD_SCALE, false, plugStyleId)
      : null;
    if (this.tailHead) {
      this.tagHeadPickMeshes(this.tailHead, 'tail');
    }
    this.tailAvailableHint = this.tailHead ? createAvailableEndHint() : null;
    this.head.root.add(this.headAvailableHint);
    if (this.tailHead && this.tailAvailableHint) this.tailHead.root.add(this.tailAvailableHint);

    const tailBand = new THREE.Mesh(
      new THREE.CylinderGeometry(ARROW_RADIUS * 1.03, ARROW_RADIUS * 1.03, ARROW_RADIUS * 0.38, 10),
      this.tailMaterial,
    );
    tailBand.position.y = -ARROW_RADIUS * 0.16;
    const tailCap = new THREE.Mesh(
      new THREE.SphereGeometry(ARROW_RADIUS * 0.76, 8, 5),
      this.tailMaterial,
    );
    tailCap.position.y = -ARROW_RADIUS * 0.55;
    this.tailRoot.add(tailBand, tailCap);
    this.root.add(this.head.root, this.tailHead?.root ?? this.tailRoot);
    this.build(this.basePoints, true);
  }

  setHovered(hovered: boolean, end?: CableEnd, nightProgress = 0): void {
    const night = THREE.MathUtils.clamp(nightProgress, 0, 1);
    this.material.color.copy(this.baseColor).lerp(new THREE.Color(PAL.blossomLight), hovered ? 0.22 : 0);
    this.material.emissive.set(hovered ? 0x33263e : 0x000000);
    this.material.emissiveIntensity = hovered ? 0.35 : 1;
    this.head.setHovered(hovered && (!end || end === 'head'), night);
    this.tailHead?.setHovered(hovered && (!end || end === 'tail'), night);
  }

  setSkillTint(color: number | null, strength = 0.42): void {
    this.material.color.copy(this.baseColor);
    if (color !== null) this.material.color.lerp(new THREE.Color(color), strength);
    this.material.emissive.set(color ?? 0x000000);
    this.material.emissiveIntensity = color === null ? 1 : 0.3;
    this.head.setSkillTint(color, strength);
    this.tailHead?.setSkillTint(color, strength);
  }

  setFakeTailPlug(enabled: boolean): void {
    if (this.definition.doubleEnded) return;
    if (enabled && !this.tailHead) {
      this.tailHead = createPlugHead(this.definition.color, PLUG_HEAD_SCALE, false, this.plugStyleId);
      this.tagHeadPickMeshes(this.tailHead, 'tail');
      this.tailAvailableHint = createAvailableEndHint();
      this.tailHead.root.add(this.tailAvailableHint);
      this.tailAvailableHint.visible = false;
      this.tailRoot.visible = false;
      this.root.add(this.tailHead.root);
      this.build(this.basePoints, true);
      return;
    }
    if (!enabled && this.tailHead) {
      this.tailHead.root.removeFromParent();
      this.tailHead.dispose();
      this.tailHead = null;
      this.tailAvailableHint = null;
      this.tailRoot.visible = true;
      this.build(this.basePoints, true);
    }
  }

  get availableEndCount(): number {
    return Number(this.headAvailableHint.visible) + Number(this.tailAvailableHint?.visible ?? false);
  }

  get availableHintScale(): number {
    if (this.headAvailableHint.visible) return this.headAvailableHint.scale.x;
    if (this.tailAvailableHint?.visible) return this.tailAvailableHint.scale.x;
    return 0;
  }

  // Reserved for a future reveal/hint item. Normal double-ended play leaves
  // both markers hidden so finding a route remains part of the puzzle.
  setAvailableEnds(ends: readonly CableEnd[], replayReveal = false): void {
    this.headAvailableHint.visible = ends.includes('head');
    if (this.tailAvailableHint) this.tailAvailableHint.visible = ends.includes('tail');
    if (replayReveal && ends.length > 0) this.hintRevealProgress = 0;
  }

  updateAvailableHints(delta: number, elapsed: number): void {
    this.hintRevealProgress = Math.min(
      1,
      this.hintRevealProgress + Math.max(0, delta) / AVAILABLE_HINT_REVEAL_DURATION,
    );
    const revealOffset = this.hintRevealProgress - 1;
    const revealScale = 1
      + (AVAILABLE_HINT_REVEAL_OVERSHOOT + 1) * revealOffset ** 3
      + AVAILABLE_HINT_REVEAL_OVERSHOOT * revealOffset ** 2;
    const pulse = 1 + (
      Math.sin(elapsed * AVAILABLE_HINT_PULSE_SPEED + this.definition.id.length) + 1
    ) * AVAILABLE_HINT_PULSE_AMOUNT;
    const scale = Math.max(0, revealScale) * pulse;
    this.headAvailableHint.scale.setScalar(scale);
    this.tailAvailableHint?.scale.setScalar(scale);
    const bob = Math.sin(
      elapsed * AVAILABLE_HINT_BOB_SPEED + this.definition.id.length,
    ) * AVAILABLE_HINT_BOB_AMOUNT;
    this.headAvailableHint.position.y = PLUG_HEAD_MAX_LENGTH * 0.58 + bob;
    if (this.tailAvailableHint) {
      this.tailAvailableHint.position.y = PLUG_HEAD_MAX_LENGTH * 0.58 + bob;
    }
  }

  setBlockedFlash(amount: number, end: CableEnd = 'head'): void {
    this.material.emissive.set(PAL.redDeep);
    this.material.emissiveIntensity = amount * 0.75;
    (end === 'tail' ? this.tailHead : this.head)?.setBlockedFlash(amount);
  }

  setPrepare(amount: number, end: CableEnd = 'head'): void {
    const scale = PLUG_HEAD_SCALE * (1 + amount * 0.025);
    const selected = end === 'tail' ? this.tailHead : this.head;
    selected?.root.scale.set(scale, scale * (1 - amount * 0.02), scale);
  }

  resetMaterial(): void {
    this.material.color.copy(this.baseColor);
    this.material.emissive.set(0x000000);
    this.material.emissiveIntensity = 1;
    this.head.root.scale.setScalar(PLUG_HEAD_SCALE);
    this.head.reset();
    if (this.tailHead) {
      this.tailHead.root.scale.setScalar(PLUG_HEAD_SCALE);
      this.tailHead.reset();
    }
  }

  resetPose(): void {
    this.root.visible = true;
    this.root.position.set(0, 0, 0);
    if (this.lastMotionDistance > 0.004) this.setMotionDistance(0, this.lastMotionEnd);
    else this.lastMotionDistance = 0;
    this.lastMotionEnd = 'head';
    this.resetMaterial();
  }

  setVisualThickness(scale: number): void {
    this.visualThickness = THREE.MathUtils.clamp(scale, 1, 2.4);
    const inflation = CABLE_RADIUS * (this.visualThickness - 1);
    setCableVisualInflation(this.material, inflation);
    setHullOutlineVisualInflation(this.outlineMesh, inflation);
  }

  get visualThicknessScale(): number {
    return this.visualThickness;
  }

  setMotionDistance(distance: number, end: CableEnd = 'head'): void {
    if (
      this.lastMotionEnd === end &&
      Number.isFinite(this.lastMotionDistance) &&
      Math.abs(distance - this.lastMotionDistance) < 0.004
    ) {
      return;
    }
    this.lastMotionEnd = end;
    this.lastMotionDistance = Math.max(0, distance);
    const start = this.lastMotionDistance;
    const finish = start + this.pathLength;
    const orientedPoints = end === 'head' ? this.basePoints : [...this.basePoints].reverse();
    const orientedLengths = end === 'head'
      ? this.cumulativeLengths
      : this.cumulativeLengths.map((length) => this.pathLength - length).reverse();
    const points: THREE.Vector3[] = [this.pointAtDistance(start, end)];

    for (let index = 1; index < orientedPoints.length - 1; index += 1) {
      const length = orientedLengths[index];
      if (length > start && length < finish) points.push(orientedPoints[index].clone());
    }
    points.push(this.pointAtDistance(finish, end));
    this.build(points, this.lastMotionDistance === 0, end);
  }

  getHeadWorldPosition(target = new THREE.Vector3(), end: CableEnd = 'head'): THREE.Vector3 {
    return (end === 'tail' ? this.tailHead : this.head)?.root.getWorldPosition(target) ?? target;
  }

  dispose(): void {
    this.root.removeFromParent();
    this.bodyMesh?.geometry.dispose();
    this.outlineMesh?.geometry.dispose();
    (this.outlineMesh?.material as THREE.Material | undefined)?.dispose();
    this.head.dispose();
    this.tailHead?.dispose();
    this.tailRoot.traverse((object) => {
      if (object instanceof THREE.Mesh) object.geometry.dispose();
    });
    this.material.dispose();
    this.tailMaterial.dispose();
    this.bodyMesh = null;
    this.outlineMesh = null;
    this.pickMeshes.length = 0;
  }

  private pointAtDistance(distance: number, end: CableEnd): THREE.Vector3 {
    const orientedPoints = end === 'head' ? this.basePoints : [...this.basePoints].reverse();
    const orientedLengths = end === 'head'
      ? this.cumulativeLengths
      : this.cumulativeLengths.map((length) => this.pathLength - length).reverse();
    const exitDirection = end === 'head' ? this.exitDirection : this.tailExitDirection;
    if (distance <= 0) return orientedPoints[0].clone();
    if (distance >= this.pathLength) {
      return orientedPoints[orientedPoints.length - 1]
        .clone()
        .addScaledVector(exitDirection, distance - this.pathLength);
    }

    for (let index = 1; index < orientedLengths.length; index += 1) {
      if (distance > orientedLengths[index]) continue;
      const segmentStart = orientedLengths[index - 1];
      const segmentLength = orientedLengths[index] - segmentStart;
      return orientedPoints[index - 1]
        .clone()
        .lerp(orientedPoints[index], (distance - segmentStart) / segmentLength);
    }
    return orientedPoints[orientedPoints.length - 1].clone();
  }

  private build(points: readonly THREE.Vector3[], withOutline = true, activeEnd: CableEnd = 'head'): void {
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

    const firstDirection = points[1].clone().sub(points[0]).normalize();
    const activeExitDirection = activeEnd === 'tail' ? this.tailExitDirection : this.exitDirection;
    const renderPoints = points.map((point) => point.clone());
    renderPoints.push(
      points[points.length - 1].clone().addScaledVector(activeExitDirection, PLUG_CABLE_SOCKET_OVERLAP),
    );
    if (this.tailHead) {
      renderPoints.unshift(points[0].clone().addScaledVector(firstDirection, -PLUG_CABLE_SOCKET_OVERLAP));
    }
    const roundedCable = createRoundedCableGeometry(renderPoints);
    const parts: THREE.BufferGeometry[] = [roundedCable.geometry];
    if (!this.tailHead) {
      parts.push(
        transformedGeometry(
          tailGeometry,
          points[0].clone().addScaledVector(firstDirection, -ARROW_RADIUS * 0.3),
          new THREE.Quaternion().setFromUnitVectors(up, firstDirection),
        ),
      );
    }

    const mergedGeometry = mergeGeometries(parts, false);
    parts.forEach((part) => part.dispose());
    if (!mergedGeometry) throw new Error(`Unable to merge cable geometry for ${this.definition.id}`);
    mergedGeometry.computeBoundingBox();
    mergedGeometry.computeBoundingSphere();

    const mesh = new THREE.Mesh(mergedGeometry, this.material);
    mesh.name = `${this.definition.id}-cable`;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.arrowId = this.definition.id;
    mesh.userData.cableFillets = roundedCable.geometry.userData.cableFillets;
    this.outlineMesh = withOutline ? addHullOutline(mesh, 0.00345) : null;
    this.bodyMesh = mesh;
    this.setVisualThickness(this.visualThickness);
    mesh.userData.cableEnd = 'head';
    if (!this.tailHead) this.pickMeshes.push(mesh);
    this.pickMeshes.push(...this.head.pickMeshes);
    if (this.tailHead) this.pickMeshes.push(...this.tailHead.pickMeshes);
    this.root.add(mesh);

    const lastPoint = points[points.length - 1];
    const activeHead = activeEnd === 'tail' ? this.tailHead : this.head;
    const passiveHead = activeEnd === 'tail' ? this.head : this.tailHead;
    activeHead?.root.position.copy(lastPoint);
    activeHead?.root.quaternion.setFromUnitVectors(
      up,
      activeExitDirection,
    );
    if (passiveHead) {
      passiveHead.root.position.copy(points[0]);
      passiveHead.root.quaternion.setFromUnitVectors(up, firstDirection.clone().negate());
    } else {
      this.tailRoot.position.copy(points[0]);
      this.tailRoot.quaternion.setFromUnitVectors(up, firstDirection);
    }
  }

  private tagHeadPickMeshes(head: PlugHead, end: CableEnd): void {
    for (const mesh of head.pickMeshes) {
      mesh.userData.arrowId = this.definition.id;
      mesh.userData.cableEnd = end;
    }
  }
}

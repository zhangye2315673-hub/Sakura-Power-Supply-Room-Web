import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  addHullOutline,
  setHullOutlineRootFade,
  setHullOutlineReveal,
  setHullOutlineStyle,
  setHullOutlineVisualInflation,
} from '../style/outline';
import { PAL } from '../style/palette';
import { cel } from '../style/toon';
import {
  ARROW_RADIUS,
  DIRECTION_VECTORS,
  PLUG_HEAD_MAX_LENGTH,
  PLUG_HEAD_MAX_RADIUS,
  cableSocketPointsToWorld,
  type ArrowDefinition,
  type CableEnd,
} from '../puzzle/types';
import { cableEndDirection } from '../puzzle/collision';
import {
  createLampVolumetricBeam,
  LAMP_BEAM_DEFAULT_LENGTH_LOCAL,
  LAMP_BEAM_FAR_TO_NEAR_RATIO,
  LAMP_BEAM_SOURCE_RADIUS_LOCAL,
} from '../appliances/performance/LampPerformance';
import {
  createPlugHead,
  PLUG_HEAD_ENVELOPE,
  PLUG_HEAD_SCALE,
  type PlugHead,
  type PlugStyleId,
} from './PlugParts';
import {
  type CableIceShellMaterial,
  CABLE_RADIUS,
  createCableIceShellMaterial,
  createCableToonMaterial,
  createRoundedIceShellGeometry,
  createRoundedCableGeometry,
  REFRIGERATOR_FREEZE_COLOR,
  REFRIGERATOR_ICE_COLOR,
  REFRIGERATOR_ICE_OPACITY,
  REFRIGERATOR_SPIKE_OPACITY,
  setCableFreeze,
  setCableIceShell,
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
const LAMP_GUIDE_APERTURE_RADIUS = PLUG_HEAD_MAX_RADIUS * 0.94;
const LAMP_GUIDE_SCALE = LAMP_GUIDE_APERTURE_RADIUS / LAMP_BEAM_SOURCE_RADIUS_LOCAL;
const LAMP_GUIDE_LENGTH = LAMP_BEAM_DEFAULT_LENGTH_LOCAL * LAMP_GUIDE_SCALE;
const LAMP_GUIDE_NEAR_FEATHER = 0.08;
const LAMP_GUIDE_SOURCE_RADIUS = LAMP_GUIDE_APERTURE_RADIUS / (
  1 + (LAMP_BEAM_FAR_TO_NEAR_RATIO - 1) * LAMP_GUIDE_NEAR_FEATHER
);
const LAMP_GUIDE_APERTURE_Y = PLUG_HEAD_ENVELOPE.bodyRange[1];
const LAMP_GUIDE_GEOMETRY_START_Y = LAMP_GUIDE_APERTURE_Y
  - LAMP_GUIDE_LENGTH * LAMP_GUIDE_NEAR_FEATHER;
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

function createLampGuide(): THREE.Group {
  const guide = new THREE.Group();
  guide.name = 'lamp-cable-guide';
  guide.visible = false;
  const beam = createLampVolumetricBeam('lamp-cable-guide-beam');
  beam.visible = true;
  beam.position.y = LAMP_GUIDE_GEOMETRY_START_Y + LAMP_GUIDE_LENGTH * 0.5;
  beam.scale.set(LAMP_GUIDE_SOURCE_RADIUS, LAMP_GUIDE_LENGTH, LAMP_GUIDE_SOURCE_RADIUS);
  guide.userData.beam = beam;
  guide.userData.apertureY = LAMP_GUIDE_APERTURE_Y;
  guide.userData.geometryStartY = LAMP_GUIDE_GEOMETRY_START_Y;
  guide.userData.sourceRadius = LAMP_GUIDE_SOURCE_RADIUS;
  guide.userData.apertureRadius = LAMP_GUIDE_APERTURE_RADIUS;
  guide.userData.length = LAMP_GUIDE_LENGTH;
  guide.add(beam);
  return guide;
}

function transformedGeometry(
  source: THREE.BufferGeometry,
  position: THREE.Vector3,
  quaternion = new THREE.Quaternion(),
  scale = new THREE.Vector3(1, 1, 1),
): THREE.BufferGeometry {
  const geometry = source.index ? source.toNonIndexed() : source.clone();
  geometry.applyMatrix4(new THREE.Matrix4().compose(position, quaternion, scale));
  if (!geometry.getAttribute('aCableProgress')) {
    geometry.setAttribute(
      'aCableProgress',
      new THREE.BufferAttribute(new Float32Array(geometry.getAttribute('position').count), 1),
    );
  }
  return geometry;
}

type IceSpikeShape = 'flat-blade' | 'pointed';

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function createIceSpikeGeometry(shape: IceSpikeShape, random: () => number): THREE.BufferGeometry {
  const radialSegments = shape === 'flat-blade' ? 4 : 3 + Math.floor(random() * 3);
  // Open bases avoid a dark floating seam where the spike grows through the
  // cloudy shell. The lower part is deliberately buried inside the casing.
  const source = new THREE.ConeGeometry(1, 1, radialSegments, 1, true);
  const geometry = source.toNonIndexed();
  source.dispose();
  geometry.translate(0, 0.5, 0);
  const position = geometry.getAttribute('position');
  const leanX = (random() - 0.5) * (shape === 'flat-blade' ? 0.52 : 0.32);
  const leanZ = (random() - 0.5) * (shape === 'flat-blade' ? 0.24 : 0.32);
  for (let index = 0; index < position.count; index += 1) {
    const y = position.getY(index);
    const tipWeight = THREE.MathUtils.smoothstep(y, 0.38, 1);
    position.setXYZ(
      index,
      position.getX(index) + leanX * tipWeight,
      Math.max(0, y + (y < 0.05 ? (random() - 0.5) * 0.06 : 0)),
      position.getZ(index) + leanZ * tipWeight,
    );
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.userData.iceSpikeShape = shape;
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
  private headLampGuide: THREE.Group | null = null;
  private tailAvailableHint: THREE.Group | null;
  private tailLampGuide: THREE.Group | null = null;
  private readonly tailRoot = new THREE.Group();
  private readonly tailMaterial: THREE.MeshToonMaterial;
  private readonly tailIceShell = new THREE.Group();
  private readonly iceSpikesRoot = new THREE.Group();
  private readonly tailBaseColor: THREE.Color;
  private readonly freezeSeed: number;
  private refrigeratorIceGeometryEnabled = false;
  private iceShellMaterial: CableIceShellMaterial | null = null;
  private iceSpikeMaterial: THREE.MeshPhysicalMaterial | null = null;
  private skillTintColor: THREE.Color | null = null;
  private skillTintStrength = 0;
  private skillGlowStrength = 0;
  private freezeAmount = 0;
  private freezeProgress = 0;
  private isHovered = false;
  private bodyMesh: THREE.Mesh | null = null;
  private iceShellMesh: THREE.Mesh | null = null;
  private iceShellOutlineMesh: THREE.Mesh | null = null;
  private currentIceCurve: THREE.Curve<THREE.Vector3> | null = null;
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
    this.freezeSeed = [...this.definition.id].reduce((value, character) => (
      Math.imul(value ^ character.charCodeAt(0), 16777619) >>> 0
    ), 2166136261) / 4294967295;
    this.tailBaseColor = this.baseColor.clone().multiplyScalar(0.72);
    this.tailMaterial = cel({
      color: this.tailBaseColor,
      bands: 3,
      tint: 0x625874,
    });
    this.basePoints = cableSocketPointsToWorld(definition);
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
    tailBand.name = 'plug-cable-tail-ring';
    tailBand.position.y = -ARROW_RADIUS * 0.16;
    const tailCap = new THREE.Mesh(
      new THREE.SphereGeometry(ARROW_RADIUS * 0.76, 8, 5),
      this.tailMaterial,
    );
    tailCap.name = 'plug-cable-tail-cap';
    tailCap.position.y = -ARROW_RADIUS * 0.55;
    this.tailIceShell.name = 'plug-cable-tail-frozen-shell';
    this.tailIceShell.visible = false;
    this.tailIceShell.userData.iceShell = true;
    this.iceSpikesRoot.name = `${definition.id}-ice-spikes`;
    this.iceSpikesRoot.visible = false;
    this.iceSpikesRoot.userData.iceSpikes = true;
    this.tailRoot.name = 'plug-cable-tail-assembly';
    this.tailRoot.add(tailBand, tailCap, this.tailIceShell);
    this.root.add(this.head.root, this.tailHead?.root ?? this.tailRoot, this.iceSpikesRoot);
    this.build(this.basePoints, true);
  }

  setHovered(hovered: boolean, end?: CableEnd, nightProgress = 0): void {
    const night = THREE.MathUtils.clamp(nightProgress, 0, 1);
    this.isHovered = hovered;
    this.refreshCableVisual();
    this.head.setHovered(hovered && (!end || end === 'head'), night);
    this.tailHead?.setHovered(hovered && (!end || end === 'tail'), night);
  }

  setSkillTint(color: number | null, strength = 0.42): void {
    this.skillTintColor = color === null ? null : new THREE.Color(color);
    this.skillTintStrength = color === null ? 0 : THREE.MathUtils.clamp(strength, 0, 1);
    this.refreshCableVisual();
    this.head.setSkillTint(color, strength);
    this.tailHead?.setSkillTint(color, strength);
  }

  setSkillGlow(strength = 0): void {
    this.skillGlowStrength = THREE.MathUtils.clamp(strength, 0, 1);
    this.refreshCableVisual();
    this.head.setSkillGlow(this.skillGlowStrength);
    this.tailHead?.setSkillGlow(this.skillGlowStrength);
  }

  setRefrigeratorIceGeometryEnabled(enabled: boolean): void {
    if (this.refrigeratorIceGeometryEnabled === enabled) return;
    this.refrigeratorIceGeometryEnabled = enabled;
    this.head.setFrozenGeometryEnabled(enabled);
    this.tailHead?.setFrozenGeometryEnabled(enabled);
    if (enabled && this.bodyMesh && this.currentIceCurve) {
      this.buildRefrigeratorIceGeometry(this.bodyMesh.geometry, this.currentIceCurve);
    } else if (!enabled) {
      this.clearRefrigeratorIceGeometry(true);
    }
    this.refreshRefrigeratorIceGeometry();
  }

  setFrozen(amount = 0, progress = amount): void {
    const nextAmount = THREE.MathUtils.clamp(amount, 0, 1);
    const nextProgress = THREE.MathUtils.clamp(progress, 0, 1);
    if (
      Math.abs(nextAmount - this.freezeAmount) < 0.0005
      && Math.abs(nextProgress - this.freezeProgress) < 0.0005
    ) return;
    this.freezeAmount = nextAmount;
    this.freezeProgress = nextProgress;
    setCableFreeze(this.material, this.freezeAmount, this.freezeProgress, this.freezeSeed);
    const headFreeze = THREE.MathUtils.smoothstep(this.freezeProgress, 0.02, 0.2) * this.freezeAmount;
    const tailFreeze = THREE.MathUtils.smoothstep(this.freezeProgress, 0.76, 1) * this.freezeAmount;
    this.head.setFrozen(headFreeze);
    this.tailHead?.setFrozen(tailFreeze);
    this.tailIceShell.visible = false;
    this.tailIceShell.userData.amount = 0;
    this.refreshRefrigeratorIceGeometry();
    this.refreshCableVisual();
    if (this.outlineMesh?.material instanceof THREE.ShaderMaterial) {
      const outlineColor = this.outlineMesh.material.uniforms.uColor?.value;
      if (outlineColor instanceof THREE.Color) {
        outlineColor.set(PAL.ink).lerp(
          new THREE.Color(0x405d70),
          this.freezeAmount * this.freezeProgress * 0.62,
        );
      }
    }
  }

  setIceShellWarmupVisible(enabled: boolean): void {
    if (enabled && this.refrigeratorIceGeometryEnabled) {
      if (this.iceShellMesh) this.iceShellMesh.visible = true;
      this.iceSpikesRoot.visible = true;
      this.head.frozenShell.visible = true;
      if (this.tailHead) this.tailHead.frozenShell.visible = true;
      return;
    }
    this.refreshRefrigeratorIceGeometry();
    this.head.frozenShell.visible = false;
    if (this.tailHead) this.tailHead.frozenShell.visible = false;
    this.tailIceShell.visible = false;
  }

  setLampGuide(end: CableEnd | null): void {
    if (end === 'head' && !this.headLampGuide) {
      this.headLampGuide = createLampGuide();
      this.head.root.add(this.headLampGuide);
    }
    if (end === 'tail' && this.tailHead && !this.tailLampGuide) {
      this.tailLampGuide = createLampGuide();
      this.tailHead.root.add(this.tailLampGuide);
    }
    if (this.headLampGuide) this.headLampGuide.visible = end === 'head';
    if (this.tailLampGuide) this.tailLampGuide.visible = end === 'tail';
  }

  setFakeTailPlug(enabled: boolean): void {
    if (this.definition.doubleEnded) return;
    if (enabled && !this.tailHead) {
      this.tailHead = createPlugHead(this.definition.color, PLUG_HEAD_SCALE, false, this.plugStyleId);
      this.tagHeadPickMeshes(this.tailHead, 'tail');
      this.tailAvailableHint = createAvailableEndHint();
      this.tailHead.root.add(this.tailAvailableHint);
      this.tailAvailableHint.visible = false;
      this.tailHead.setSkillTint(this.skillTintColor, this.skillTintStrength);
      this.tailHead.setSkillGlow(this.skillGlowStrength);
      this.tailHead.setFrozenGeometryEnabled(this.refrigeratorIceGeometryEnabled);
      this.tailHead.setFrozen(this.freezeAmount);
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
      this.tailLampGuide = null;
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
    if (this.headLampGuide) this.updateLampGuide(this.headLampGuide, elapsed);
    if (this.tailLampGuide) this.updateLampGuide(this.tailLampGuide, elapsed);
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
    this.skillTintColor = null;
    this.skillTintStrength = 0;
    this.skillGlowStrength = 0;
    this.freezeAmount = 0;
    this.freezeProgress = 0;
    setCableFreeze(this.material, 0, 0, 0);
    this.tailIceShell.visible = false;
    this.isHovered = false;
    this.refreshCableVisual();
    this.setLampGuide(null);
    this.head.root.scale.setScalar(PLUG_HEAD_SCALE);
    this.head.reset();
    if (this.tailHead) {
      this.tailHead.root.scale.setScalar(PLUG_HEAD_SCALE);
      this.tailHead.reset();
    }
    this.refreshRefrigeratorIceGeometry();
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

  get skillVisualState(): Readonly<{
    baseColor: number;
    cableColor: number;
    tailColor: number;
    glowStrength: number;
    freezeAmount: number;
    freezeProgress: number;
    iceShellVisible: boolean;
    iceShellOpacity: number;
    plugIceShellCount: number;
    lampGuideEnd: CableEnd | null;
  }> {
    return {
      baseColor: this.baseColor.getHex(),
      cableColor: this.material.color.getHex(),
      tailColor: this.tailMaterial.color.getHex(),
      glowStrength: this.skillGlowStrength,
      freezeAmount: this.freezeAmount,
      freezeProgress: this.freezeProgress,
      iceShellVisible: this.iceShellMesh?.visible ?? false,
      iceShellOpacity: this.iceShellMaterial?.opacity ?? 0,
      plugIceShellCount: Number(this.head.frozenShell.visible)
        + Number(this.tailHead?.frozenShell.visible ?? this.tailIceShell.visible),
      lampGuideEnd: this.headLampGuide?.visible ? 'head' : this.tailLampGuide?.visible ? 'tail' : null,
    };
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
    this.clearRefrigeratorIceGeometry(true);
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
    this.currentIceCurve = null;
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

  private ensureRefrigeratorIceMaterials(): void {
    if (!this.iceShellMaterial) {
      this.iceShellMaterial = createCableIceShellMaterial();
      this.iceShellMaterial.name = 'sakura-refrigerator-cable-ice-shell';
      this.iceShellMaterial.opacity = 0;
      this.iceShellMaterial.depthWrite = false;
      this.iceShellMaterial.flatShading = true;
    }
    if (!this.iceSpikeMaterial) {
      this.iceSpikeMaterial = new THREE.MeshPhysicalMaterial({
        name: 'sakura-refrigerator-ice-spikes',
        color: REFRIGERATOR_ICE_COLOR,
        emissive: 0x315f69,
        emissiveIntensity: 0.025,
        roughness: 0.56,
        metalness: 0,
        clearcoat: 0.44,
        clearcoatRoughness: 0.32,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        flatShading: true,
      });
      this.iceSpikeMaterial.userData.materialRole = 'refrigerator-ice-spike';
    }
  }

  private buildRefrigeratorIceGeometry(
    sourceGeometry: THREE.BufferGeometry,
    curve: THREE.Curve<THREE.Vector3>,
  ): void {
    this.clearRefrigeratorIceGeometry(false);
    if (!this.refrigeratorIceGeometryEnabled) return;
    this.ensureRefrigeratorIceMaterials();

    const shell = new THREE.Mesh(
      createRoundedIceShellGeometry(sourceGeometry, CABLE_RADIUS * 0.28),
      this.iceShellMaterial!,
    );
    shell.name = `${this.definition.id}-cable-ice-shell`;
    shell.renderOrder = 4;
    shell.castShadow = false;
    shell.receiveShadow = false;
    shell.userData.iceShell = true;
    this.iceShellOutlineMesh = addHullOutline(shell, 0.0058, PAL.ink);
    setHullOutlineStyle(this.iceShellOutlineMesh, {
      thickness: 0.0058,
      variation: 0.08,
      phase: this.freezeSeed * Math.PI * 2,
      color: PAL.ink,
    });
    setHullOutlineReveal(this.iceShellOutlineMesh, this.freezeProgress);
    this.iceShellMesh = shell;
    this.root.add(shell);

    const seed = [...this.definition.id].reduce((value, character) => (
      Math.imul(value ^ character.charCodeAt(0), 16777619) >>> 0
    ), 2166136261);
    const random = seededRandom(seed);
    const length = Math.max(curve.getLength(), CABLE_RADIUS * 2);
    const spikeCount = THREE.MathUtils.clamp(Math.round(length * 4.1), 10, 18);
    const flatSpikeCount = Math.ceil(spikeCount * 0.72);
    const spikeShapes: IceSpikeShape[] = Array.from(
      { length: spikeCount },
      (_, index) => index < flatSpikeCount ? 'flat-blade' : 'pointed',
    );
    for (let index = spikeShapes.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      [spikeShapes[index], spikeShapes[swapIndex]] = [spikeShapes[swapIndex], spikeShapes[index]];
    }
    const tangent = new THREE.Vector3();
    const radialA = new THREE.Vector3();
    const radialB = new THREE.Vector3();
    const radial = new THREE.Vector3();
    const reference = new THREE.Vector3();

    for (let index = 0; index < spikeCount; index += 1) {
      // Stratified randomness keeps the full cable readable as frozen while
      // preserving uneven spacing inside each path slice.
      const t = THREE.MathUtils.clamp(
        (index + 0.18 + random() * 0.64) / spikeCount,
        0.035,
        0.965,
      );
      curve.getTangentAt(t, tangent).normalize();
      reference.set(Math.abs(tangent.y) < 0.82 ? 0 : 1, Math.abs(tangent.y) < 0.82 ? 1 : 0, 0);
      radialA.crossVectors(tangent, reference).normalize();
      radialB.crossVectors(tangent, radialA).normalize();
      const angle = random() * Math.PI * 2;
      radial.copy(radialA).multiplyScalar(Math.cos(angle)).addScaledVector(radialB, Math.sin(angle)).normalize();

      const shape = spikeShapes[index];
      const geometry = createIceSpikeGeometry(shape, random);
      const spike = new THREE.Mesh(geometry, this.iceSpikeMaterial!);
      spike.name = `${this.definition.id}-ice-spike-${index + 1}`;
      const surfaceRadiusFactor = 1;
      spike.position.copy(curve.getPointAt(t)).addScaledVector(radial, CABLE_RADIUS * surfaceRadiusFactor);
      spike.quaternion.setFromUnitVectors(up, radial);
      spike.rotateY(random() * Math.PI * 2);
      const baseScale = shape === 'flat-blade'
        ? new THREE.Vector3(
            CABLE_RADIUS * (0.62 + random() * 0.92),
            CABLE_RADIUS * (0.88 + random() * 1.62),
            CABLE_RADIUS * (0.2 + random() * 0.22),
          )
        : new THREE.Vector3(
            CABLE_RADIUS * (0.3 + random() * 0.34),
            CABLE_RADIUS * (0.82 + random() * 1.52),
            CABLE_RADIUS * (0.3 + random() * 0.34),
          );
      spike.scale.setScalar(0.001);
      spike.renderOrder = 5;
      spike.userData.iceSpike = true;
      spike.userData.iceSpikeShape = shape;
      spike.userData.baseScale = baseScale;
      spike.userData.pathT = t;
      spike.userData.surfaceRadiusFactor = surfaceRadiusFactor;
      spike.userData.revealAt = THREE.MathUtils.clamp(
        0.05 + (1 - t) * 0.84 + (random() - 0.5) * 0.1,
        0.04,
        0.9,
      );
      const spikeOutline = addHullOutline(spike, shape === 'flat-blade' ? 0.0088 : 0.0078, PAL.ink);
      setHullOutlineStyle(spikeOutline, {
        thickness: shape === 'flat-blade' ? 0.0088 : 0.0078,
        variation: 0.13,
        phase: random() * Math.PI * 2,
        color: PAL.ink,
      });
      setHullOutlineRootFade(spikeOutline, 0.035, 0.28);
      spikeOutline.userData.iceSpikeRootFade = true;
      this.iceSpikesRoot.add(spike);
    }
    this.refreshRefrigeratorIceGeometry();
  }

  private refreshRefrigeratorIceGeometry(): void {
    const enabled = this.refrigeratorIceGeometryEnabled;
    const amount = enabled ? THREE.MathUtils.clamp(this.freezeAmount, 0, 1) : 0;
    const progress = enabled ? THREE.MathUtils.clamp(this.freezeProgress, 0, 1) : 0;
    if (this.iceShellMaterial) {
      setCableIceShell(this.iceShellMaterial, amount, progress);
      this.iceShellMaterial.opacity = REFRIGERATOR_ICE_OPACITY * amount;
    }
    if (this.iceShellMesh) this.iceShellMesh.visible = amount > 0.01;
    setHullOutlineReveal(this.iceShellOutlineMesh, enabled ? progress : null);
    if (this.iceShellOutlineMesh?.material instanceof THREE.ShaderMaterial) {
      this.iceShellOutlineMesh.material.uniforms.uOpacity.value = amount;
    }
    if (this.iceSpikeMaterial) this.iceSpikeMaterial.opacity = REFRIGERATOR_SPIKE_OPACITY * amount;
    this.iceSpikesRoot.visible = amount > 0.01;
    this.iceSpikesRoot.children.forEach((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const revealAt = child.userData.revealAt as number;
      const baseScale = child.userData.baseScale as THREE.Vector3;
      const growth = THREE.MathUtils.smoothstep(progress, revealAt, Math.min(1, revealAt + 0.14))
        * Math.pow(amount, 0.72);
      child.visible = growth > 0.015;
      child.scale.copy(baseScale).multiplyScalar(Math.max(0.001, growth));
    });
  }

  private clearRefrigeratorIceGeometry(disposeMaterials: boolean): void {
    if (this.iceShellMesh) {
      this.iceShellMesh.traverse((object) => {
        if (!(object instanceof THREE.Mesh) || object === this.iceShellMesh) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      });
      this.root.remove(this.iceShellMesh);
      this.iceShellMesh.geometry.dispose();
      this.iceShellMesh = null;
      this.iceShellOutlineMesh = null;
    }
    this.iceSpikesRoot.children.slice().forEach((child) => {
      this.iceSpikesRoot.remove(child);
      child.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
          if (material !== this.iceSpikeMaterial) material.dispose();
        });
      });
    });
    if (!disposeMaterials) return;
    this.iceShellMaterial?.dispose();
    this.iceSpikeMaterial?.dispose();
    this.iceShellMaterial = null;
    this.iceSpikeMaterial = null;
  }

  private refreshCableVisual(): void {
    const displayColor = this.baseColor.clone();
    if (this.skillTintColor) displayColor.lerp(this.skillTintColor, this.skillTintStrength);
    if (this.isHovered) displayColor.lerp(new THREE.Color(PAL.blossomLight), 0.22);
    this.material.color.copy(displayColor);

    const tailColor = this.tailBaseColor.clone();
    if (this.skillTintColor) tailColor.lerp(this.skillTintColor, this.skillTintStrength);
    const tailFreeze = THREE.MathUtils.smoothstep(this.freezeProgress, 0.76, 1) * this.freezeAmount;
    if (tailFreeze > 0) tailColor.lerp(new THREE.Color(REFRIGERATOR_FREEZE_COLOR), tailFreeze * 0.9);
    this.tailMaterial.color.copy(tailColor);

    if (this.skillGlowStrength > 0) {
      this.material.emissive.copy(this.baseColor);
      this.material.emissiveIntensity = 0.58 + this.skillGlowStrength * 0.82;
      this.tailMaterial.emissive.copy(this.tailBaseColor);
      this.tailMaterial.emissiveIntensity = 0.58 + this.skillGlowStrength * 0.82;
    } else if (this.skillTintColor) {
      this.material.emissive.copy(this.skillTintColor);
      this.material.emissiveIntensity = 0.3;
      this.tailMaterial.emissive.copy(this.skillTintColor);
      this.tailMaterial.emissiveIntensity = 0.3;
    } else if (this.freezeAmount > 0) {
      this.material.emissive.set(0x000000);
      this.material.emissiveIntensity = 1;
      this.tailMaterial.emissive.set(0x83b9ca);
      this.tailMaterial.emissiveIntensity = tailFreeze * 0.2;
    } else {
      this.material.emissive.set(this.isHovered ? 0x33263e : 0x000000);
      this.material.emissiveIntensity = this.isHovered ? 0.35 : 1;
      this.tailMaterial.emissive.set(0x000000);
      this.tailMaterial.emissiveIntensity = 1;
    }
  }

  private updateLampGuide(guide: THREE.Group, elapsed: number): void {
    if (!guide.visible) return;
    const pulse = (Math.sin(elapsed * 3.4 + this.definition.id.length) + 1) * 0.5;
    const beam = guide.userData.beam as THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;
    beam.material.uniforms.uOpacity.value = 0.15 + pulse * 0.02;
  }

  private build(points: readonly THREE.Vector3[], withOutline = true, activeEnd: CableEnd = 'head'): void {
    if (points.length < 2) return;
    const previousBody = this.bodyMesh;
    const previousOutline = this.outlineMesh;
    if (previousBody) {
      this.clearRefrigeratorIceGeometry(false);
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
    this.currentIceCurve = roundedCable.curve;
    this.setVisualThickness(this.visualThickness);
    mesh.userData.cableEnd = 'head';
    if (!this.tailHead) this.pickMeshes.push(mesh);
    this.pickMeshes.push(...this.head.pickMeshes);
    if (this.tailHead) this.pickMeshes.push(...this.tailHead.pickMeshes);
    this.root.add(mesh);
    if (this.refrigeratorIceGeometryEnabled) {
      this.buildRefrigeratorIceGeometry(mergedGeometry, roundedCable.curve);
    }

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
    setCableFreeze(this.material, this.freezeAmount, this.freezeProgress, this.freezeSeed);
    if (this.freezeAmount > 0) {
      const amount = this.freezeAmount;
      const progress = this.freezeProgress;
      this.freezeAmount = -1;
      this.setFrozen(amount, progress);
    }
  }

  private tagHeadPickMeshes(head: PlugHead, end: CableEnd): void {
    for (const mesh of head.pickMeshes) {
      mesh.userData.arrowId = this.definition.id;
      mesh.userData.cableEnd = end;
    }
  }
}

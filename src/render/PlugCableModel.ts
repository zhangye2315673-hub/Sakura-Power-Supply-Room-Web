import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  addHullOutline,
  setHullOutlineRootFade,
  setHullOutlineReveal,
  setHullOutlineStyle,
} from '../style/outline';
import { PAL } from '../style/palette';
import { cel } from '../style/toon';
import {
  ARROW_RADIUS,
  CABLE_TAIL_TERMINAL_LENGTH,
  DIRECTION_VECTORS,
  PLUG_HEAD_MAX_LENGTH,
  PLUG_HEAD_MAX_RADIUS,
  PLUG_HEAD_PIN_RADIUS,
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
  COFFEE_STAIN_COLOR,
  createCableIceShellMaterial,
  createCableToonMaterial,
  createRoundedIceShellGeometry,
  createRoundedCableGeometry,
  REFRIGERATOR_FREEZE_COLOR,
  REFRIGERATOR_ICE_COLOR,
  REFRIGERATOR_ICE_OPACITY,
  REFRIGERATOR_SPIKE_OPACITY,
  setCableCoffeeStain,
  setCableFreeze,
  setCableIceShell,
  setCableOverheat,
  setCableSkillRecolor,
  setCableSkillSweep,
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
const RECYCLE_HOVER_COLOR = 0x5ff2cf;
const RECYCLE_SELECTED_COLOR = 0xffdf72;
const BASE_CABLE_OUTLINE_THICKNESS = 0.00345;
const RECYCLE_SELECTED_OUTLINE_COLOR = 0x17141f;
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
  guide.userData.performanceEffect = true;
  guide.userData.preparedBeforeSkillTrigger = true;
  const beam = createLampVolumetricBeam('lamp-cable-guide-beam');
  beam.visible = true;
  beam.userData.performanceEffect = true;
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

type GeometryThicknessState = {
  geometry: THREE.BufferGeometry;
  basePositions: Float32Array;
  baseNormals: Float32Array;
  baseBoundingBox: THREE.Box3;
  baseBoundingSphere: THREE.Sphere;
};

function captureGeometryThicknessState(geometry: THREE.BufferGeometry): GeometryThicknessState {
  const position = geometry.getAttribute('position');
  const normal = geometry.getAttribute('normal');
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return {
    geometry,
    basePositions: Float32Array.from(position.array as ArrayLike<number>),
    baseNormals: Float32Array.from(normal.array as ArrayLike<number>),
    baseBoundingBox: geometry.boundingBox!.clone(),
    baseBoundingSphere: geometry.boundingSphere!.clone(),
  };
}

function applyGeometryThickness(
  state: GeometryThicknessState | null,
  scale: number,
): void {
  if (!state) return;
  const position = state.geometry.getAttribute('position') as THREE.BufferAttribute;
  const inflation = CABLE_RADIUS * (scale - 1);
  for (let index = 0; index < position.count; index += 1) {
    const offset = index * 3;
    position.setXYZ(
      index,
      state.basePositions[offset] + state.baseNormals[offset] * inflation,
      state.basePositions[offset + 1] + state.baseNormals[offset + 1] * inflation,
      state.basePositions[offset + 2] + state.baseNormals[offset + 2] * inflation,
    );
  }
  position.needsUpdate = true;
  state.geometry.boundingBox = state.baseBoundingBox.clone().expandByScalar(inflation);
  state.geometry.boundingSphere = state.baseBoundingSphere.clone();
  state.geometry.boundingSphere.radius += inflation;
  state.geometry.userData.visualThicknessScale = scale;
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
  private fakeTailPlug = false;
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
  private skillTintEmissionScale = 1;
  private skillGlowStrength = 0;
  private skillRecolorColor: THREE.Color | null = null;
  private skillRecolorProgress = 0;
  private coffeeStainAmount = 0;
  private coffeeStainReveal = 0;
  private coffeeStainDirection = 0;
  private overheatTarget = 0;
  private overheatAmount = 0;
  private overheatReveal = 0;
  private overheatTurns = 2;
  private inductionRevealActive = false;
  private inductionHeatTarget = 0;
  private inductionHeatAmount = 0;
  private inductionRingAge = 0;
  private readonly inductionRingRoot = new THREE.Group();
  private readonly inductionInnerRingMaterial = cel({
    color: 0xffd45a,
    tint: 0xb5653b,
    emissive: 0xff9d38,
    emissiveIntensity: 0.3,
    bands: 3,
  });
  private readonly inductionOuterRingMaterial = cel({
    color: 0xe85b55,
    tint: 0x8f3949,
    emissive: 0xc83e42,
    emissiveIntensity: 0.24,
    bands: 3,
  });
  private readonly inductionInnerRing = new THREE.Mesh(
    new THREE.TorusGeometry(CABLE_RADIUS * 1.52, CABLE_RADIUS * 0.18, 8, 28),
    this.inductionInnerRingMaterial,
  );
  private readonly inductionOuterRing = new THREE.Mesh(
    new THREE.TorusGeometry(CABLE_RADIUS * 2.08, CABLE_RADIUS * 0.24, 8, 32),
    this.inductionOuterRingMaterial,
  );
  private inductionRingProgresses: [number, number] = [0.5, 0.5];
  private inductionRingTangentAlignments: [number, number] = [1, 1];
  private freezeAmount = 0;
  private freezeProgress = 0;
  private isHovered = false;
  private recycleSelectionState: 'none' | 'hover' | 'selected' = 'none';
  private recycleSelectionPulse = 0;
  private recycleSelectionScale = 1;
  private recycleSelectionStartedAt: number | null = null;
  private readonly recycleSelectionCenter = new THREE.Vector3();
  private readonly bundleSpacingOffset = new THREE.Vector3();
  private readonly bundleBaseRootPosition = new THREE.Vector3();
  private bundleClearanceSegmentsCache: Array<{
    start: THREE.Vector3;
    end: THREE.Vector3;
    radius: number;
  }> | null = null;
  private bodyMesh: THREE.Mesh | null = null;
  private iceShellMesh: THREE.Mesh | null = null;
  private iceShellOutlineMesh: THREE.Mesh | null = null;
  private currentIceCurve: THREE.Curve<THREE.Vector3> | null = null;
  private outlineMesh: THREE.Mesh | null = null;
  private bodyThicknessState: GeometryThicknessState | null = null;
  private outlineThicknessState: GeometryThicknessState | null = null;
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
    this.bundleBaseRootPosition.copy(this.root.position);
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
    new THREE.Box3().setFromPoints(this.basePoints).getCenter(this.recycleSelectionCenter);
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
    this.headLampGuide = createLampGuide();
    this.head.root.add(this.headLampGuide);
    this.tailHead = definition.doubleEnded
      ? createPlugHead(definition.color, PLUG_HEAD_SCALE, false, plugStyleId)
      : null;
    if (this.tailHead) {
      this.tagHeadPickMeshes(this.tailHead, 'tail');
      this.tailLampGuide = createLampGuide();
      this.tailHead.root.add(this.tailLampGuide);
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
    this.inductionRingRoot.name = `${definition.id}-induction-heat-rings`;
    this.inductionRingRoot.visible = false;
    this.inductionRingRoot.userData.effectId = 'induction-heat-ring';
    this.inductionInnerRing.name = `${definition.id}-induction-inner-yellow-ring`;
    this.inductionOuterRing.name = `${definition.id}-induction-outer-red-ring`;
    this.inductionInnerRing.renderOrder = 7;
    this.inductionOuterRing.renderOrder = 7;
    this.inductionInnerRing.castShadow = false;
    this.inductionOuterRing.castShadow = false;
    this.inductionRingRoot.add(this.inductionInnerRing, this.inductionOuterRing);
    this.root.add(
      this.head.root,
      this.tailHead?.root ?? this.tailRoot,
      this.iceSpikesRoot,
      this.inductionRingRoot,
    );
    this.build(this.basePoints, true);
  }

  setHovered(hovered: boolean, end?: CableEnd, nightProgress = 0): void {
    const night = THREE.MathUtils.clamp(nightProgress, 0, 1);
    this.isHovered = hovered;
    this.refreshCableVisual();
    this.head.setHovered(hovered && (!end || end === 'head'), night);
    this.tailHead?.setHovered(hovered && (!end || end === 'tail'), night);
  }

  setRecycleSelectionState(state: 'none' | 'hover' | 'selected'): void {
    if (this.recycleSelectionState === state) return;
    this.recycleSelectionState = state;
    this.recycleSelectionStartedAt = null;
    if (state === 'selected') this.applyRecycleSelectionScale(1);
    if (state === 'none') {
      this.recycleSelectionPulse = 0;
      this.applyRecycleSelectionScale(1);
    }
    this.refreshCableVisual();
    this.head.setRecycleSelectionState(state, this.recycleSelectionPulse);
    this.tailHead?.setRecycleSelectionState(state, this.recycleSelectionPulse);
  }

  updateRecycleSelection(elapsed: number): void {
    if (this.recycleSelectionState === 'none') return;
    if (this.recycleSelectionStartedAt === null) this.recycleSelectionStartedAt = elapsed;
    const selectionAge = elapsed - this.recycleSelectionStartedAt;
    if (this.recycleSelectionState === 'selected') {
      this.recycleSelectionPulse = (Math.sin(selectionAge * 10) + 1) * 0.5;
      this.applyRecycleSelectionScale(1);
    } else {
      this.recycleSelectionPulse = (Math.sin(selectionAge * 6.2) + 1) * 0.5;
      this.applyRecycleSelectionScale(1.012 + this.recycleSelectionPulse * 0.016);
    }
    this.refreshCableVisual();
    this.head.setRecycleSelectionState(this.recycleSelectionState, this.recycleSelectionPulse);
    this.tailHead?.setRecycleSelectionState(this.recycleSelectionState, this.recycleSelectionPulse);
  }

  setSkillTint(color: number | null, strength = 0.42, emissionScale = 1): void {
    this.skillTintColor = color === null ? null : new THREE.Color(color);
    this.skillTintStrength = color === null ? 0 : THREE.MathUtils.clamp(strength, 0, 1);
    this.skillTintEmissionScale = color === null ? 1 : THREE.MathUtils.clamp(emissionScale, 0, 1);
    this.refreshCableVisual();
    this.head.setSkillTint(color, strength, emissionScale);
    this.tailHead?.setSkillTint(color, strength, emissionScale);
  }

  setSkillGlow(strength = 0): void {
    this.skillGlowStrength = THREE.MathUtils.clamp(strength, 0, 1);
    this.refreshCableVisual();
    this.head.setSkillGlow(this.skillGlowStrength);
    this.tailHead?.setSkillGlow(this.skillGlowStrength);
  }

  setSkillSweep(progress: number, strength = 0, color = 0x9b7bc8): void {
    setCableSkillSweep(this.material, progress, strength, color);
  }

  setSkillRecolor(color: number | null, progress = 0): void {
    this.skillRecolorColor = color === null ? null : new THREE.Color(color);
    this.skillRecolorProgress = color === null ? 0 : THREE.MathUtils.clamp(progress, 0, 1);
    setCableSkillRecolor(this.material, this.skillRecolorProgress, color ?? this.baseColor);
    const endpointProgress = THREE.MathUtils.smoothstep(this.skillRecolorProgress, 0.82, 1);
    this.head.setSkillTint(color, endpointProgress, 0);
    this.tailHead?.setSkillTint(color, endpointProgress, 0);
    this.refreshCableVisual();
  }

  setCoffeeStain(amount: number, reveal: number, elapsed: number, direction: number): void {
    this.coffeeStainAmount = THREE.MathUtils.clamp(amount, 0, 1);
    this.coffeeStainReveal = THREE.MathUtils.clamp(reveal, 0, 1);
    this.coffeeStainDirection = direction >= 0.5 ? 1 : 0;
    setCableCoffeeStain(
      this.material,
      this.coffeeStainAmount,
      this.coffeeStainReveal,
      this.freezeSeed,
      elapsed,
      this.coffeeStainDirection,
    );
    const startFromHead = this.coffeeStainDirection >= 0.5;
    const headDistance = startFromHead ? 0 : 1;
    const tailDistance = startFromHead ? 1 : 0;
    const endpointCoverage = (distance: number): number => THREE.MathUtils.smoothstep(
      this.coffeeStainReveal,
      Math.max(0, distance - 0.035),
      Math.min(1, distance + 0.11),
    );
    const headCoverage = endpointCoverage(headDistance) * this.coffeeStainAmount;
    const tailCoverage = endpointCoverage(tailDistance) * this.coffeeStainAmount;
    this.head.setSkillTint(COFFEE_STAIN_COLOR, headCoverage);
    this.tailHead?.setSkillTint(COFFEE_STAIN_COLOR, tailCoverage);
    this.tailMaterial.color.copy(this.tailBaseColor).lerp(new THREE.Color(COFFEE_STAIN_COLOR), tailCoverage);
    this.tailMaterial.emissive.set(COFFEE_STAIN_COLOR);
    this.tailMaterial.emissiveIntensity = tailCoverage * 0.22;
  }

  clearCoffeeStain(): void {
    if (this.coffeeStainAmount <= 0 && this.coffeeStainReveal <= 0) return;
    this.coffeeStainAmount = 0;
    this.coffeeStainReveal = 0;
    this.coffeeStainDirection = 0;
    setCableCoffeeStain(this.material, 0, 0, this.freezeSeed, 0, 0);
    this.head.setSkillTint(null);
    this.tailHead?.setSkillTint(null);
    this.refreshCableVisual();
  }

  setOverheated(enabled: boolean, turnsRemaining = 2): void {
    this.overheatTarget = enabled ? 1 : 0;
    this.overheatTurns = Math.max(1, Math.round(turnsRemaining));
  }

  setInductionReveal(enabled: boolean): void {
    if (this.inductionRevealActive === enabled) return;
    this.inductionRevealActive = enabled;
    this.inductionHeatTarget = enabled ? 0.62 : 0;
    this.inductionRingAge = 0;
    this.inductionRingRoot.visible = enabled;
    if (!enabled) {
      this.inductionHeatAmount = 0;
      this.inductionRingProgresses = [0.5, 0.5];
      this.inductionRingTangentAlignments = [1, 1];
    }
  }

  updateOverheat(delta: number, elapsed: number): void {
    const response = this.overheatTarget > this.overheatAmount ? 8.5 : 13;
    this.overheatAmount = THREE.MathUtils.damp(
      this.overheatAmount,
      this.overheatTarget,
      response,
      Math.max(0, delta),
    );
    if (this.overheatTarget > 0.5) {
      this.overheatReveal = Math.min(1, this.overheatReveal + Math.max(0, delta) / 0.42);
    } else if (this.overheatAmount < 0.002) {
      this.overheatAmount = 0;
      this.overheatReveal = 0;
    }
    this.inductionHeatAmount = THREE.MathUtils.damp(
      this.inductionHeatAmount,
      this.inductionHeatTarget,
      7.5,
      Math.max(0, delta),
    );
    const cableHeatAmount = Math.max(this.overheatAmount, this.inductionHeatAmount);
    const cableHeatTurns = this.overheatAmount >= this.inductionHeatAmount ? this.overheatTurns : 2;
    const cableHeatReveal = this.overheatTarget > 0.5 ? this.overheatReveal : 1;
    setCableOverheat(
      this.material,
      cableHeatAmount,
      cableHeatTurns,
      elapsed,
      cableHeatReveal,
    );
    this.head.setOverheated(
      this.overheatAmount,
      this.overheatTurns,
      elapsed,
      this.overheatReveal,
      this.pathLength,
    );
    this.updateInductionRings(delta);
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
    if (
      this.recycleSelectionState === 'none'
      && this.outlineMesh?.material instanceof THREE.ShaderMaterial
    ) {
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

  setLampGuideWarmupVisible(enabled: boolean): void {
    if (this.headLampGuide) this.headLampGuide.visible = enabled;
    if (this.tailLampGuide) this.tailLampGuide.visible = enabled;
  }

  setFakeTailPlug(enabled: boolean): void {
    if (this.definition.doubleEnded) return;
    if (enabled === this.fakeTailPlug && (enabled ? this.tailHead !== null : this.tailHead === null)) return;
    if (enabled && !this.tailHead) {
      this.fakeTailPlug = true;
      this.tailHead = createPlugHead(this.definition.color, PLUG_HEAD_SCALE, false, this.plugStyleId);
      this.tagHeadPickMeshes(this.tailHead, 'tail');
      this.tailAvailableHint = createAvailableEndHint();
      this.tailHead.root.add(this.tailAvailableHint);
      this.tailAvailableHint.visible = false;
      this.tailHead.setSkillTint(this.skillTintColor, this.skillTintStrength, this.skillTintEmissionScale);
      this.tailHead.setSkillGlow(this.skillGlowStrength);
      this.tailHead.setFrozenGeometryEnabled(this.refrigeratorIceGeometryEnabled);
      this.tailHead.setFrozen(this.freezeAmount);
      this.tailRoot.visible = false;
      this.root.add(this.tailHead.root);
      this.bundleClearanceSegmentsCache = null;
      this.build(this.basePoints, true);
      return;
    }
    if (!enabled && this.tailHead) {
      this.fakeTailPlug = false;
      this.tailHead.root.removeFromParent();
      this.tailHead.dispose();
      this.tailHead = null;
      this.tailAvailableHint = null;
      this.tailLampGuide = null;
      this.tailRoot.visible = true;
      this.bundleClearanceSegmentsCache = null;
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
    this.skillTintEmissionScale = 1;
    this.skillGlowStrength = 0;
    this.setSkillSweep(0, 0);
    this.skillRecolorColor = null;
    this.skillRecolorProgress = 0;
    setCableSkillRecolor(this.material, 0, this.baseColor);
    this.coffeeStainAmount = 0;
    this.coffeeStainReveal = 0;
    this.coffeeStainDirection = 0;
    setCableCoffeeStain(this.material, 0, 0, this.freezeSeed, 0, 0);
    this.overheatTarget = 0;
    this.overheatAmount = 0;
    this.overheatReveal = 0;
    this.overheatTurns = 2;
    this.inductionRevealActive = false;
    this.inductionHeatTarget = 0;
    this.inductionHeatAmount = 0;
    this.inductionRingAge = 0;
    this.inductionRingRoot.visible = false;
    this.inductionRingProgresses = [0.5, 0.5];
    this.inductionRingTangentAlignments = [1, 1];
    setCableOverheat(this.material, 0, 2, 0, 0);
    this.freezeAmount = 0;
    this.freezeProgress = 0;
    setCableFreeze(this.material, 0, 0, 0);
    this.tailIceShell.visible = false;
    this.isHovered = false;
    this.recycleSelectionState = 'none';
    this.recycleSelectionPulse = 0;
    this.recycleSelectionStartedAt = null;
    this.applyRecycleSelectionScale(1);
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
    this.applyRootPresentationTransform();
    if (this.lastMotionDistance > 0.004) this.setMotionDistance(0, this.lastMotionEnd);
    else this.lastMotionDistance = 0;
    this.lastMotionEnd = 'head';
    this.resetMaterial();
  }

  setVisualThickness(scale: number): void {
    this.visualThickness = THREE.MathUtils.clamp(scale, 1, 2.4);
    this.bundleClearanceSegmentsCache = null;
    applyGeometryThickness(this.bodyThicknessState, this.visualThickness);
    applyGeometryThickness(this.outlineThicknessState, this.visualThickness);
    this.head.setCableJointThickness(this.visualThickness);
    this.tailHead?.setCableJointThickness(this.visualThickness);
    this.tailRoot.scale.set(this.visualThickness, 1, this.visualThickness);
  }

  get visualThicknessScale(): number {
    return this.visualThickness;
  }

  getBundleBaseCenter(target = new THREE.Vector3()): THREE.Vector3 {
    return target.copy(this.recycleSelectionCenter);
  }

  getBundleBaseCenterRef(): Readonly<THREE.Vector3> {
    return this.recycleSelectionCenter;
  }

  getBundleClearanceSegments(): readonly {
    start: THREE.Vector3;
    end: THREE.Vector3;
    radius: number;
  }[] {
    if (this.bundleClearanceSegmentsCache) return this.bundleClearanceSegmentsCache;
    const segments: Array<{ start: THREE.Vector3; end: THREE.Vector3; radius: number }> = [];
    for (let index = 0; index < this.basePoints.length - 1; index += 1) {
      segments.push({
        start: this.basePoints[index].clone(),
        end: this.basePoints[index + 1].clone(),
        radius: CABLE_RADIUS * this.visualThickness,
      });
    }
    const addPlug = (anchor: THREE.Vector3, direction: THREE.Vector3): void => {
      segments.push({
        start: anchor.clone().addScaledVector(direction, PLUG_HEAD_ENVELOPE.bodyRange[0]),
        end: anchor.clone().addScaledVector(direction, PLUG_HEAD_ENVELOPE.bodyRange[1]),
        radius: PLUG_HEAD_MAX_RADIUS,
      });
      segments.push({
        start: anchor.clone().addScaledVector(direction, PLUG_HEAD_ENVELOPE.pinRange[0]),
        end: anchor.clone().addScaledVector(direction, PLUG_HEAD_MAX_LENGTH),
        radius: PLUG_HEAD_PIN_RADIUS,
      });
    };
    addPlug(this.basePoints[this.basePoints.length - 1], this.exitDirection);
    const tailDirection = this.basePoints[0].clone().sub(this.basePoints[1]).normalize();
    if (this.tailHead) addPlug(this.basePoints[0], tailDirection);
    else {
      segments.push({
        start: this.basePoints[0].clone(),
        end: this.basePoints[0].clone().addScaledVector(tailDirection, CABLE_TAIL_TERMINAL_LENGTH),
        radius: ARROW_RADIUS * this.visualThickness,
      });
    }
    this.bundleClearanceSegmentsCache = segments;
    return segments;
  }

  setBundleSpacingOffset(offset: THREE.Vector3 | null): void {
    const nextOffset = offset ?? this.bundleSpacingOffset.set(0, 0, 0);
    if (
      this.bundleSpacingOffset.lengthSq() < 1e-10
      && nextOffset.lengthSq() >= 1e-10
    ) {
      // Other presentations (notably the washer) can leave each cable root at
      // a legitimate non-zero pose. Capture that live pose when spacing begins
      // instead of snapping every plug back to the constructor-time origin.
      this.bundleBaseRootPosition.copy(this.root.position)
        .addScaledVector(this.recycleSelectionCenter, this.recycleSelectionScale - 1);
    }
    if (offset) this.bundleSpacingOffset.copy(offset);
    else this.bundleSpacingOffset.set(0, 0, 0);
    this.applyRootPresentationTransform();
  }

  /**
   * Accept the current root position as the new baseline after another
   * presentation has permanently repositioned the cable. This keeps the
   * spacing/recycle presentation owner from restoring a stale constructor-time
   * position on its next update.
   */
  commitBundleBaseRootPose(): void {
    this.bundleBaseRootPosition.copy(this.root.position)
      .sub(this.bundleSpacingOffset)
      .addScaledVector(this.recycleSelectionCenter, this.recycleSelectionScale - 1);
  }

  get skillVisualState(): Readonly<{
    baseColor: number;
    cableColor: number;
    tailColor: number;
    glowStrength: number;
    skillTintStrength: number;
    skillTintEmissionScale: number;
    skillSweepProgress: number;
    skillSweepStrength: number;
    skillRecolorProgress: number;
    skillRecolorColor: number | null;
    recycleSelectionState: 'none' | 'hover' | 'selected';
    recycleHighlightStrength: number;
    recyclePulse: number;
    recycleScale: number;
    bundleSpacingOffset: number[];
    bundleSpacingOffsetLength: number;
    overheatAmount: number;
    overheatReveal: number;
    overheatTurns: number;
    inductionRevealActive: boolean;
    inductionHeatAmount: number;
    inductionRingCount: number;
    inductionRingProgresses: [number, number];
    inductionRingTangentAlignments: [number, number];
    inductionRingMotion: string;
    plugOverheatAmount: number;
    plugOverheatReveal: number;
    plugOverheatMaterialCount: number;
    plugOverheatPathScale: number;
    freezeAmount: number;
    freezeProgress: number;
    coffeeStainAmount: number;
    coffeeStainReveal: number;
    coffeeStainDirection: number;
    iceShellVisible: boolean;
    iceShellOpacity: number;
    plugIceShellCount: number;
    visualThicknessScale: number;
    geometryThicknessScale: number;
    plugJointThicknessScale: number;
    fakeTailPlugVisible: boolean;
    lampGuideEnd: CableEnd | null;
  }> {
    return {
      baseColor: this.baseColor.getHex(),
      cableColor: this.material.color.getHex(),
      tailColor: this.tailMaterial.color.getHex(),
      glowStrength: this.skillGlowStrength,
      skillTintStrength: this.skillTintStrength,
      skillTintEmissionScale: this.skillTintEmissionScale,
      skillSweepProgress: (this.material.userData.skillSweepProgress as { value: number } | undefined)?.value ?? 0,
      skillSweepStrength: (this.material.userData.skillSweepStrength as { value: number } | undefined)?.value ?? 0,
      skillRecolorProgress: this.skillRecolorProgress,
      skillRecolorColor: this.skillRecolorColor?.getHex() ?? null,
      recycleSelectionState: this.recycleSelectionState,
      recycleHighlightStrength: this.recycleSelectionState === 'selected'
        ? 1
        : this.recycleSelectionState === 'hover'
          ? 0.78
          : 0,
      recyclePulse: this.recycleSelectionPulse,
      recycleScale: this.recycleSelectionScale,
      bundleSpacingOffset: this.bundleSpacingOffset.toArray(),
      bundleSpacingOffsetLength: this.bundleSpacingOffset.length(),
      overheatAmount: this.overheatAmount,
      overheatReveal: this.overheatReveal,
      overheatTurns: this.overheatTurns,
      inductionRevealActive: this.inductionRevealActive,
      inductionHeatAmount: this.inductionHeatAmount,
      inductionRingCount: this.inductionRingRoot.visible ? 2 : 0,
      inductionRingProgresses: [...this.inductionRingProgresses],
      inductionRingTangentAlignments: [...this.inductionRingTangentAlignments],
      inductionRingMotion: 'opposed-path-ping-pong',
      plugOverheatAmount: this.head.overheatVisualState.amount,
      plugOverheatReveal: this.head.overheatVisualState.reveal,
      plugOverheatMaterialCount: this.head.overheatVisualState.materialCount,
      plugOverheatPathScale: this.head.overheatVisualState.pathScale,
      freezeAmount: this.freezeAmount,
      freezeProgress: this.freezeProgress,
      coffeeStainAmount: this.coffeeStainAmount,
      coffeeStainReveal: this.coffeeStainReveal,
      coffeeStainDirection: this.coffeeStainDirection,
      iceShellVisible: this.iceShellMesh?.visible ?? false,
      iceShellOpacity: this.iceShellMaterial?.opacity ?? 0,
      plugIceShellCount: Number(this.head.frozenShell.visible)
        + Number(this.tailHead?.frozenShell.visible ?? this.tailIceShell.visible),
      visualThicknessScale: this.visualThickness,
      geometryThicknessScale: this.bodyMesh?.geometry.userData.visualThicknessScale ?? 1,
      plugJointThicknessScale: this.head.cableJointThicknessScale,
      fakeTailPlugVisible: this.tailHead !== null && !this.definition.doubleEnded,
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

    // Keep every original path vertex that still lies inside the moving cable
    // window, including the socket endpoint. Older templates and transient
    // topology replacements can briefly carry an exit direction that differs
    // from the final authored segment. Skipping the endpoint in that case
    // joins the previous corner directly to the displaced plug and creates a
    // long diagonal cable. Retaining it makes extraction follow the original
    // polyline all the way to the plug before continuing along the exit ray.
    for (let index = 1; index < orientedPoints.length; index += 1) {
      const length = orientedLengths[index];
      if (length > start && length < finish) points.push(orientedPoints[index].clone());
    }
    points.push(this.pointAtDistance(finish, end));
    this.build(points, this.lastMotionDistance === 0, end);
  }

  getHeadWorldPosition(target = new THREE.Vector3(), end: CableEnd = 'head'): THREE.Vector3 {
    return (end === 'tail' ? this.tailHead : this.head)?.root.getWorldPosition(target) ?? target;
  }

  getHeadWorldQuaternion(target = new THREE.Quaternion(), end: CableEnd = 'head'): THREE.Quaternion {
    return (end === 'tail' ? this.tailHead : this.head)?.root.getWorldQuaternion(target) ?? target;
  }

  dispose(): void {
    this.root.removeFromParent();
    this.clearRefrigeratorIceGeometry(true);
    this.bodyMesh?.geometry.dispose();
    this.outlineMesh?.geometry.dispose();
    (this.outlineMesh?.material as THREE.Material | undefined)?.dispose();
    this.head.dispose();
    this.tailHead?.dispose();
    this.inductionInnerRing.geometry.dispose();
    this.inductionOuterRing.geometry.dispose();
    this.inductionInnerRingMaterial.dispose();
    this.inductionOuterRingMaterial.dispose();
    this.tailRoot.traverse((object) => {
      if (object instanceof THREE.Mesh) object.geometry.dispose();
    });
    this.material.dispose();
    this.tailMaterial.dispose();
    this.bodyMesh = null;
    this.bodyThicknessState = null;
    this.currentIceCurve = null;
    this.outlineMesh = null;
    this.outlineThicknessState = null;
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

  private updateInductionRings(delta: number): void {
    if (!this.inductionRevealActive || !this.currentIceCurve) {
      this.inductionRingRoot.visible = false;
      return;
    }
    this.inductionRingRoot.visible = true;
    this.inductionRingAge += Math.max(0, delta);
    const curveLength = Math.max(this.currentIceCurve.getLength(), CABLE_RADIUS * 8);
    const segmentDuration = Math.max(0.72, curveLength * 0.46 / 1.15);
    const phase = (this.inductionRingAge / segmentDuration) % 4;
    const signedTravel = phase < 1
      ? phase
      : phase < 3
        ? 2 - phase
        : phase - 4;
    const innerProgress = THREE.MathUtils.clamp(0.5 + signedTravel * 0.46, 0.04, 0.96);
    const outerProgress = THREE.MathUtils.clamp(0.5 - signedTravel * 0.46, 0.04, 0.96);
    this.inductionRingProgresses = [innerProgress, outerProgress];
    this.inductionRingTangentAlignments = [
      this.placeInductionRing(this.inductionInnerRing, innerProgress),
      this.placeInductionRing(this.inductionOuterRing, outerProgress),
    ];
  }

  private placeInductionRing(ring: THREE.Mesh, progress: number): number {
    if (!this.currentIceCurve) return 0;
    const tangent = this.currentIceCurve.getTangentAt(progress, new THREE.Vector3()).normalize();
    ring.position.copy(this.currentIceCurve.getPointAt(progress, new THREE.Vector3()));
    ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
    return new THREE.Vector3(0, 0, 1).applyQuaternion(ring.quaternion).dot(tangent);
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
    const recycleColor = this.recycleSelectionState === 'selected'
      ? new THREE.Color(RECYCLE_SELECTED_COLOR)
      : this.recycleSelectionState === 'hover'
        ? new THREE.Color(RECYCLE_HOVER_COLOR)
        : null;
    const displayColor = this.baseColor.clone();
    if (this.skillTintColor) displayColor.lerp(this.skillTintColor, this.skillTintStrength);
    if (this.isHovered && !recycleColor) displayColor.lerp(new THREE.Color(PAL.blossomLight), 0.22);
    if (recycleColor) {
      displayColor.lerp(recycleColor, this.recycleSelectionState === 'selected' ? 0.56 : 0.38);
    }
    this.material.color.copy(displayColor);

    const tailColor = this.tailBaseColor.clone();
    if (this.skillTintColor) tailColor.lerp(this.skillTintColor, this.skillTintStrength);
    if (this.skillRecolorColor) {
      tailColor.lerp(
        this.skillRecolorColor,
        THREE.MathUtils.smoothstep(this.skillRecolorProgress, 0.82, 1),
      );
    }
    const tailFreeze = THREE.MathUtils.smoothstep(this.freezeProgress, 0.76, 1) * this.freezeAmount;
    if (tailFreeze > 0) tailColor.lerp(new THREE.Color(REFRIGERATOR_FREEZE_COLOR), tailFreeze * 0.9);
    if (recycleColor) {
      tailColor.lerp(recycleColor, this.recycleSelectionState === 'selected' ? 0.58 : 0.4);
    }
    this.tailMaterial.color.copy(tailColor);

    if (recycleColor) {
      const intensity = this.recycleSelectionState === 'selected'
        ? 0.34 + this.recycleSelectionPulse * 0.2
        : 0.16 + this.recycleSelectionPulse * 0.1;
      this.material.emissive.copy(recycleColor);
      this.material.emissiveIntensity = intensity;
      this.tailMaterial.emissive.copy(recycleColor);
      this.tailMaterial.emissiveIntensity = intensity;
    } else if (this.skillGlowStrength > 0) {
      this.material.emissive.copy(this.baseColor);
      this.material.emissiveIntensity = 0.58 + this.skillGlowStrength * 0.82;
      this.tailMaterial.emissive.copy(this.tailBaseColor);
      this.tailMaterial.emissiveIntensity = 0.58 + this.skillGlowStrength * 0.82;
    } else if (this.skillTintColor) {
      this.material.emissive.copy(this.skillTintColor);
      this.material.emissiveIntensity = 0.3 * this.skillTintEmissionScale;
      this.tailMaterial.emissive.copy(this.skillTintColor);
      this.tailMaterial.emissiveIntensity = 0.3 * this.skillTintEmissionScale;
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

    if (this.outlineMesh) {
      const outlineColor = this.recycleSelectionState === 'selected'
        ? new THREE.Color(RECYCLE_SELECTED_OUTLINE_COLOR)
        : new THREE.Color(PAL.ink).lerp(
          new THREE.Color(0x405d70),
          this.recycleSelectionState === 'none' ? this.freezeAmount * this.freezeProgress * 0.62 : 0,
        );
      const pulseThickness = this.recycleSelectionState === 'selected'
        ? 0.0012 * this.recycleSelectionPulse
        : 0.0003 * this.recycleSelectionPulse;
      setHullOutlineStyle(this.outlineMesh, {
        thickness: this.recycleSelectionState === 'selected'
          ? 0.009 + pulseThickness
          : this.recycleSelectionState === 'hover'
            ? 0.0052 + pulseThickness
            : BASE_CABLE_OUTLINE_THICKNESS,
        color: outlineColor,
      });
    }
  }

  private applyRecycleSelectionScale(scale: number): void {
    this.recycleSelectionScale = scale;
    this.root.scale.setScalar(scale);
    this.applyRootPresentationTransform();
  }

  private applyRootPresentationTransform(): void {
    this.root.position.copy(this.bundleBaseRootPosition)
      .add(this.bundleSpacingOffset)
      .addScaledVector(this.recycleSelectionCenter, 1 - this.recycleSelectionScale);
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
    this.bodyThicknessState = null;
    this.outlineThicknessState = null;
    this.pickMeshes.length = 0;

    const firstDirection = points[1].clone().sub(points[0]).normalize();
    const activeExitDirection = activeEnd === 'tail' ? this.tailExitDirection : this.exitDirection;
    const renderPoints = points.map((point) => point.clone());
    renderPoints.push(
      points[points.length - 1].clone().addScaledVector(activeExitDirection, PLUG_CABLE_SOCKET_OVERLAP),
    );
    if (this.tailHead && !this.fakeTailPlug) {
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
    this.outlineMesh = withOutline ? addHullOutline(mesh, BASE_CABLE_OUTLINE_THICKNESS) : null;
    this.bodyMesh = mesh;
    this.bodyThicknessState = captureGeometryThicknessState(mesh.geometry);
    this.outlineThicknessState = this.outlineMesh
      ? captureGeometryThicknessState(this.outlineMesh.geometry)
      : null;
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
    const activeFakeTailHead = activeHead === this.tailHead && this.fakeTailPlug
      ? this.tailHead
      : null;
    if (activeFakeTailHead) {
      // During a tail-first extraction the fake plug keeps its contact at the
      // moving endpoint while its body overlaps the cable behind it.
      activeFakeTailHead.root.position.addScaledVector(activeExitDirection, -PLUG_HEAD_MAX_LENGTH);
    }
    activeHead?.root.quaternion.setFromUnitVectors(
      up,
      activeExitDirection,
    );
    if (passiveHead) {
      passiveHead.root.position.copy(points[0]);
      if (passiveHead === this.tailHead && this.fakeTailPlug) {
        // The fake tail's contact point is the original logical tail
        // endpoint. Move the plug body inward so it covers the existing
        // strain-relief segment instead of appending a second plug beyond the
        // cable tail.
        passiveHead.root.position.addScaledVector(firstDirection, PLUG_HEAD_MAX_LENGTH);
      }
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

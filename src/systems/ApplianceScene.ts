import * as THREE from 'three';
import { PAL } from '../style/palette';
import { ARROW_COLORS } from '../style/palette';
import type { PlugStyleId } from '../render/PlugParts';
import { createApplianceModel } from '../appliances/models';
import {
  poweredActiveDuration,
  poweredAnimationState,
} from '../appliances/poweredAnimation';
import {
  APPLIANCE_CATALOG,
  applianceCatalogSummary,
  selectAppliancesForSeed,
  type ActiveApplianceLayout,
  type ApplianceDefinition,
  type ApplianceKind,
  type ApplianceSizeTier,
  type ApplianceState,
} from './ApplianceCatalog';
import { applianceTopTilt } from './AppliancePresentation';
import { SoftDeformController } from './SoftDeformController';

export type { ApplianceKind, ApplianceSizeTier, ApplianceState } from './ApplianceCatalog';

const REFERENCE_SCREEN_DEPTH = 13.6;
const BACK_LAYER_OFFSET = 5.2;
const THREE_QUARTER_YAW = 0.46;
const DROP_DISTANCE = 1.08;
const DROP_FALL_DURATION = 0.46;
const SPAWN_DROP_FALL_DURATION = 0.86;
const SPAWN_DROP_BOUNCE_DURATION = 1.07;
const SPAWN_DROP_TOTAL_DURATION = SPAWN_DROP_FALL_DURATION + SPAWN_DROP_BOUNCE_DURATION;
const DROP_BOUNCE_HEIGHT = 0.34;
const DROP_BOUNCE_FREQUENCY = 8.5;
const DROP_BOUNCE_DAMPING = 2.25;
const SWAY_FREQUENCY = 9.4;
const SWAY_DAMPING = 2.35;
const DROP_REBOUND_COUNT = 5;
const DROP_GRAVITY = 13;
const DROP_FIRST_REBOUND_SPEED = 2.35;
const DROP_RESTITUTION = 0.78;
const DROP_FIRST_CONTACT_TILT = 0.14;
const DROP_CONTACT_TILT_DECAY = 0.75;
const DROP_CONTACT_SWAY = [0, -0.105, 0.074, -0.047, 0.025, 0] as const;
const EDGE_PADDING = 0.035;
const REPLACEMENT_KIND_HISTORY_SIZE = 6;
const INFLATE_CYCLE_DURATION = 0.58;
const INFLATE_AMPLITUDES = [0.18] as const;
const REPLACEMENT_DELAY = 0.18;
const SPAWN_DROP_MIN_HEIGHT = 0.46;
const SPAWN_DROP_PREPARE_AFTER = 0.75;
const SPAWN_DROP_TOP_MARGIN_MIN_PX = 88;
const SPAWN_DROP_TOP_MARGIN_MAX_PX = 120;
const CENTRAL_SAFE_MIN = 0.25;
const CENTRAL_SAFE_MAX = 0.75;
const LAYOUT_TOP = 0.175;
const LAYOUT_BOTTOM = 0.905;
const LAYOUT_GAP = 0.017;
const SOFT_ELASTIC_LEASH_PX = 42;
const DRAG_HOLD_DELAY_MS = 180;
const DRAG_POSITION_EPSILON = 0.002;

type ScreenLayout = readonly [number, number];

type PreparedReplacement = {
  replacement: ApplianceTarget;
  targetIndex: number;
  previousResources: Array<THREE.BufferGeometry | THREE.Material>;
  randomState: number;
  nextRandomState: number;
  warmupReady: boolean;
  warmupPromise: Promise<void>;
};

type DeferredDisposal = {
  resources: Array<THREE.BufferGeometry | THREE.Material>;
  nextIndex: number;
  readyAt: number;
};

function dropReboundSpeed(index: number): number {
  return DROP_FIRST_REBOUND_SPEED * DROP_RESTITUTION ** index;
}

function dropContactTilt(index: number, direction: -1 | 1): number {
  if (index >= DROP_REBOUND_COUNT) return 0;
  const side = index % 2 === 0 ? direction : -direction;
  return side * DROP_FIRST_CONTACT_TILT * DROP_CONTACT_TILT_DECAY ** index;
}

function dropContactSway(index: number, direction: -1 | 1): number {
  return direction * DROP_CONTACT_SWAY[Math.min(index, DROP_CONTACT_SWAY.length - 1)];
}

export class ApplianceTarget {
  readonly root = new THREE.Group();
  readonly connectionAnchor = new THREE.Group();
  readonly interactiveMeshes: THREE.Mesh[] = [];
  readonly screenPosition: THREE.Vector2;
  state: ApplianceState = 'idle';
  connectionCount = 0;
  isConnecting = false;
  isDragging = false;
  facingSide: -1 | 1 = 1;
  outwardEdge: 'left' | 'right' | 'top' | 'bottom' = 'right';
  dropOffset = 0;
  dropVelocity = 0;
  isDropping = false;
  isSpawnDrop = false;
  dropLanded = false;
  depthScale = 1;
  landingSway = 0;
  landingSwayVelocity = 0;
  landingTilt = 0;
  landingTiltVelocity = 0;
  landingDirection: -1 | 1 = 1;
  landingImpactCount = 0;
  landingContactSide: -1 | 0 | 1 = 0;
  dropElapsed = 0;
  spawnDropHeight = SPAWN_DROP_MIN_HEIGHT;
  dropStartedAt = 0;
  dropLandedAt = 0;
  dropCommitPending = false;
  activeTimeRemaining = 0;
  lifecycleScale = 1;
  private readonly materials = new Set<THREE.Material>();
  private readonly indicatorMaterial: THREE.MeshToonMaterial;
  private readonly softDeform: SoftDeformController | null;
  private readonly deviceBounds = new THREE.Box3();
  private readonly connectionSocketsByEdge: Partial<Record<
    'left' | 'right' | 'top' | 'bottom',
    THREE.Object3D
  >> = {};
  private baseScale = 0.68;
  private actualScreenHeight = 0.1;
  private pulse = 0;
  private activeElapsed = 0;
  private activeStartedAt = 0;
  private animationPausedAt = 0;
  private inflationStartedAt = 0;
  private inflationPeakCycle = -1;
  private inflationPeakHoldFrames = 0;
  private recycleRequested = false;

  constructor(
    readonly definition: ApplianceDefinition,
    readonly accent: number,
    screenPosition: ScreenLayout,
  ) {
    this.id = definition.id;
    this.label = definition.label;
    this.kind = definition.id;
    this.sizeTier = definition.sizeTier;
    this.plugStyleId = definition.plugStyleId;
    this.root.name = `appliance-${this.id}`;
    this.screenPosition = new THREE.Vector2(...screenPosition);

    const model = createApplianceModel(definition.id, {
      id: definition.id,
      accent,
      referencePath: definition.referencePath,
    });
    this.indicatorMaterial = model.indicatorMaterial;
    model.materials.forEach((material) => this.materials.add(material));
    this.interactiveMeshes.push(...model.interactiveMeshes);
    this.root.add(model.root);
    this.root.scale.setScalar(1);
    this.root.updateMatrixWorld(true);
    this.deviceBounds.setFromObject(this.root);
    for (const edge of ['left', 'right', 'top', 'bottom'] as const) {
      const socket = model.root.getObjectByName(`${definition.id}-${edge}-connection-socket`);
      if (socket) this.connectionSocketsByEdge[edge] = socket;
    }
    const modelCenter = this.deviceBounds.getCenter(new THREE.Vector3());
    model.root.position.sub(modelCenter);
    this.root.updateMatrixWorld(true);
    this.deviceBounds.setFromObject(this.root);
    const modelWidth = Math.max(0.01, this.deviceBounds.max.x - this.deviceBounds.min.x);
    const modelHeight = Math.max(0.01, this.deviceBounds.max.y - this.deviceBounds.min.y);
    const referenceVerticalSpan = 2 * Math.tan(THREE.MathUtils.degToRad(26 * 0.5)) * REFERENCE_SCREEN_DEPTH;
    const rawScreenWidth = definition.targetScreenHeight * (modelWidth / modelHeight) / (16 / 9);
    const maxScreenWidth = definition.sizeTier === 'L' ? 0.22 : definition.sizeTier === 'XL' ? 0.2 : 0.205;
    const widthFit = Math.min(1, maxScreenWidth / rawScreenWidth);
    this.actualScreenHeight = definition.targetScreenHeight * widthFit;
    this.baseScale = (this.actualScreenHeight * referenceVerticalSpan) / modelHeight;
    this.root.scale.setScalar(this.baseScale);
    this.softDeform = new SoftDeformController(this.root, model.root);
    this.buildConnectionAnchor();
  }

  readonly id: string;
  readonly label: string;
  readonly kind: ApplianceKind;
  readonly sizeTier: ApplianceSizeTier;
  readonly plugStyleId: PlugStyleId;

  reserve(color: number): void {
    this.isConnecting = true;
    this.pulse = 1;
    if (this.state === 'idle') this.state = 'connected';
    this.indicatorMaterial.color.set(color).lerp(new THREE.Color(PAL.paper), 0.25);
    this.indicatorMaterial.emissive.set(color);
    this.indicatorMaterial.emissiveIntensity = 0.34;
    this.root.userData.sensoryConnectionColor = color;
  }

  activate(color: number): void {
    this.isConnecting = false;
    this.state = 'active';
    this.connectionCount += 1;
    this.activeElapsed = 0;
    this.activeStartedAt = performance.now() * 0.001;
    this.animationPausedAt = 0;
    this.activeTimeRemaining = poweredActiveDuration(this.kind);
    this.inflationStartedAt = 0;
    this.inflationPeakCycle = -1;
    this.inflationPeakHoldFrames = 0;
    this.recycleRequested = false;
    this.lifecycleScale = 1;
    this.root.visible = true;
    this.pulse = 1;
    this.indicatorMaterial.color.set(PAL.blossomLight);
    this.indicatorMaterial.emissive.set(color);
    this.indicatorMaterial.emissiveIntensity = 1.15;
    this.root.userData.sensoryConnectionColor = color;
  }

  reset(): void {
    this.state = 'idle';
    this.connectionCount = 0;
    this.isConnecting = false;
    this.isDragging = false;
    this.dropOffset = 0;
    this.dropVelocity = 0;
    this.isDropping = false;
    this.isSpawnDrop = false;
    this.dropLanded = false;
    this.landingSway = 0;
    this.landingSwayVelocity = 0;
    this.landingTilt = 0;
    this.landingTiltVelocity = 0;
    this.landingImpactCount = 0;
    this.landingContactSide = 0;
    this.dropElapsed = 0;
    this.spawnDropHeight = SPAWN_DROP_MIN_HEIGHT;
    this.dropStartedAt = 0;
    this.dropLandedAt = 0;
    this.dropCommitPending = false;
    this.activeElapsed = 0;
    this.activeStartedAt = 0;
    this.animationPausedAt = 0;
    this.activeTimeRemaining = 0;
    this.inflationStartedAt = 0;
    this.inflationPeakCycle = -1;
    this.inflationPeakHoldFrames = 0;
    this.recycleRequested = false;
    this.lifecycleScale = 1;
    this.root.visible = true;
    this.pulse = 0;
    this.softDeform?.reset();
    this.resetPoweredState();
  }

  update(delta: number, _elapsed: number): void {
    const now = performance.now() * 0.001;
    this.pulse = Math.max(0, this.pulse - delta * 2.8);
    const bounce = 1 + Math.sin((1 - this.pulse) * Math.PI) * this.pulse * 0.055;
    const dragScale = this.isDragging && !this.softDeform ? 1.055 : 1;
    if (this.state === 'inflating') this.updateInflation(now);
    this.root.scale.setScalar(
      this.baseScale * this.depthScale * bounce * dragScale * this.lifecycleScale,
    );
    if (this.state !== 'active') return;
    if (this.softDeform?.isGrabbing || this.animationPausedAt > 0) return;

    // Visual-evidence pages deliberately hold the unified performance at one
    // timestamp. Freeze the appliance lifecycle at that same timestamp too;
    // otherwise a slow software-WebGL capture can recycle the appliance before
    // the rendered frame catches up with the performance diagnostics.
    const fixedPerformanceTime = window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__;
    this.activeElapsed = Number.isFinite(fixedPerformanceTime)
      ? Math.max(0, fixedPerformanceTime as number)
      : Math.max(0, now - this.activeStartedAt);
    const activeDuration = poweredActiveDuration(this.kind);
    const powered = poweredAnimationState(this.activeElapsed, this.kind);
    this.activeTimeRemaining = Math.max(0, activeDuration - this.activeElapsed);
    if (!powered.active) {
      this.state = 'inflating';
      this.inflationStartedAt = now;
      this.inflationPeakCycle = -1;
      this.inflationPeakHoldFrames = 0;
      this.resetPoweredState();
    }
  }

  consumeRecycleRequest(): boolean {
    if (!this.recycleRequested) return false;
    this.recycleRequested = false;
    return true;
  }

  get isLifecycleTransitioning(): boolean {
    return this.state === 'inflating' || this.state === 'hidden' || this.state === 'spawning';
  }

  get inflationPeakCount(): number {
    return this.inflationPeakCycle + 1;
  }

  beginSpawnDrop(height = SPAWN_DROP_MIN_HEIGHT): void {
    this.state = 'spawning';
    this.root.visible = true;
    this.isDropping = true;
    this.isSpawnDrop = true;
    this.dropLanded = false;
    this.spawnDropHeight = Math.max(SPAWN_DROP_MIN_HEIGHT, height);
    this.dropOffset = -this.spawnDropHeight;
    this.dropVelocity = 0;
    this.landingDirection = this.id.charCodeAt(0) % 2 === 0 ? 1 : -1;
    this.landingSway = 0;
    this.landingTilt = 0;
    this.landingImpactCount = 0;
    this.landingContactSide = 0;
    this.dropElapsed = 0;
    this.dropStartedAt = performance.now() * 0.001;
    this.dropLandedAt = 0;
  }

  private updateInflation(now: number): void {
    if (this.inflationPeakHoldFrames > 0) {
      this.inflationPeakHoldFrames -= 1;
      return;
    }
    const elapsed = Math.max(0, now - this.inflationStartedAt);
    const cycleIndex = Math.floor(elapsed / INFLATE_CYCLE_DURATION);
    const phase = (elapsed % INFLATE_CYCLE_DURATION) / INFLATE_CYCLE_DURATION;
    const nextPeakCycle = this.inflationPeakCycle + 1;
    if (
      nextPeakCycle < INFLATE_AMPLITUDES.length &&
      (nextPeakCycle < cycleIndex || (nextPeakCycle === cycleIndex && phase >= 0.3))
    ) {
      this.inflationPeakCycle = nextPeakCycle;
      this.lifecycleScale = 1 + INFLATE_AMPLITUDES[nextPeakCycle];
      this.inflationPeakHoldFrames = 2;
      return;
    }
    if (cycleIndex >= INFLATE_AMPLITUDES.length) {
      this.lifecycleScale = 1;
      if (this.isConnecting) return;
      this.state = 'hidden';
      this.root.visible = false;
      this.recycleRequested = true;
      return;
    }
    this.lifecycleScale = 1 + Math.sin(phase * Math.PI) * INFLATE_AMPLITUDES[cycleIndex];
  }

  private resetPoweredState(): void {
    this.activeElapsed = 0;
    this.activeStartedAt = 0;
    this.activeTimeRemaining = 0;
  }

  getConnectionWorldPosition(target = new THREE.Vector3()): THREE.Vector3 {
    return this.connectionAnchor.getWorldPosition(target);
  }

  getAnimationSignal(): number {
    return typeof this.root.userData.appliancePerformanceSignal === 'number'
      ? this.root.userData.appliancePerformanceSignal
      : 0;
  }

  getActiveElapsed(): number {
    const override = window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__;
    return this.state === 'active' && Number.isFinite(override)
      ? Math.max(0, override as number)
      : this.state === 'active' ? this.activeElapsed : 0;
  }

  get supportsSoftDeform(): boolean {
    return this.softDeform !== null;
  }

  get softDeformPull(): number {
    return this.softDeform?.pullLength ?? 0;
  }

  get softDeformSignedPull(): number {
    return this.softDeform?.signedPull ?? 0;
  }

  get isSoftDeforming(): boolean {
    return this.softDeform ? !this.softDeform.isSettled : false;
  }

  beginSoftDeform(
    grabWorld: THREE.Vector3,
    viewDepthAxisWorld?: THREE.Vector3,
    surfaceNormalWorld?: THREE.Vector3,
  ): void {
    if (!this.softDeform) return;
    this.root.updateWorldMatrix(true, true);
    const size = new THREE.Box3().setFromObject(this.root).getSize(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z);
    const influenceRadius = size.length() * 0.72;
    this.softDeform.begin(
      grabWorld,
      influenceRadius,
      maxDimension * 0.52,
      viewDepthAxisWorld,
      surfaceNormalWorld,
    );
    if (this.state === 'active' && this.animationPausedAt <= 0) {
      this.animationPausedAt = performance.now() * 0.001;
    }
  }

  setSoftDeformPointer(pointerWorld: THREE.Vector3): void {
    this.softDeform?.setPointerWorld(pointerWorld);
  }

  releaseSoftDeform(): void {
    this.softDeform?.release();
    if (this.animationPausedAt > 0) {
      this.activeStartedAt += Math.max(0, performance.now() * 0.001 - this.animationPausedAt);
      this.animationPausedAt = 0;
    }
  }

  settleSoftDeformForDrop(): void {
    this.softDeform?.reset();
    if (this.animationPausedAt > 0) {
      this.activeStartedAt += Math.max(0, performance.now() * 0.001 - this.animationPausedAt);
      this.animationPausedAt = 0;
    }
  }

  updateSoftDeform(delta: number): void {
    if (!this.isDragging && this.softDeform?.isGrabbing) this.softDeform.release();
    this.softDeform?.update(delta);
  }

  getScreenSize(aspect: number): THREE.Vector2 {
    const width = Math.max(0.01, this.deviceBounds.max.x - this.deviceBounds.min.x);
    const height = Math.max(0.01, this.deviceBounds.max.y - this.deviceBounds.min.y);
    return new THREE.Vector2(
      this.actualScreenHeight * (width / height) / Math.max(0.6, aspect),
      this.actualScreenHeight,
    );
  }

  setScreenPlacement(position: THREE.Vector2): void {
    const side: -1 | 1 = position.x < 0.5 ? -1 : 1;
    this.facingSide = side;
    const distances = {
      left: position.x,
      right: 1 - position.x,
      top: position.y,
      bottom: 1 - position.y,
    };
    this.outwardEdge = (Object.keys(distances) as Array<keyof typeof distances>).reduce(
      (closest, edge) => (distances[edge] < distances[closest] ? edge : closest),
      'left',
    );
    this.connectionAnchor.rotation.set(0, 0, 0);
    const centerY = (this.deviceBounds.min.y + this.deviceBounds.max.y) * 0.5;
    const centerX = (this.deviceBounds.min.x + this.deviceBounds.max.x) * 0.5;
    const frontZ = this.deviceBounds.max.z + EDGE_PADDING;
    const preferredSocket = this.connectionSocketsByEdge[this.outwardEdge];
    if (preferredSocket) {
      this.root.updateWorldMatrix(true, true);
      preferredSocket.getWorldPosition(this.connectionAnchor.position);
      this.root.worldToLocal(this.connectionAnchor.position);
    } else if (this.outwardEdge === 'left') {
      this.connectionAnchor.position.set(this.deviceBounds.min.x - EDGE_PADDING, centerY, frontZ);
    } else if (this.outwardEdge === 'right') {
      this.connectionAnchor.position.set(this.deviceBounds.max.x + EDGE_PADDING, centerY, frontZ);
    } else if (this.outwardEdge === 'top') {
      this.connectionAnchor.position.set(centerX, this.deviceBounds.max.y + EDGE_PADDING, frontZ);
    } else {
      this.connectionAnchor.position.set(centerX, this.deviceBounds.min.y - EDGE_PADDING, frontZ);
    }
    if (this.outwardEdge === 'left') {
      this.connectionAnchor.rotation.y = -Math.PI * 0.5;
    } else if (this.outwardEdge === 'right') {
      this.connectionAnchor.rotation.y = Math.PI * 0.5;
    } else if (this.outwardEdge === 'top') {
      this.connectionAnchor.rotation.x = -Math.PI * 0.5;
    } else {
      this.connectionAnchor.rotation.x = Math.PI * 0.5;
    }
  }

  beginDrop(): void {
    this.isDropping = true;
    this.isSpawnDrop = false;
    this.dropLanded = false;
    this.dropOffset = 0;
    this.dropVelocity = 0;
    this.landingDirection = this.id.charCodeAt(0) % 2 === 0 ? 1 : -1;
    this.landingSway = 0;
    this.landingSwayVelocity = 0;
    this.landingTilt = 0;
    this.landingTiltVelocity = 0;
    this.landingImpactCount = 0;
    this.landingContactSide = 0;
    this.dropElapsed = 0;
    const now = performance.now() * 0.001;
    this.dropStartedAt = now;
    this.dropLandedAt = 0;
    this.dropCommitPending = false;
    if (this.state === 'active' && this.animationPausedAt <= 0) this.animationPausedAt = now;
  }

  finishDrop(): void {
    if (this.animationPausedAt <= 0) return;
    this.activeStartedAt += Math.max(0, performance.now() * 0.001 - this.animationPausedAt);
    this.animationPausedAt = 0;
  }

  dispose(): void {
    this.detachForDisposal();
    this.collectDisposalResources().forEach((resource) => resource.dispose());
  }

  detachForDisposal(): void {
    this.softDeform?.reset();
    this.root.removeFromParent();
  }

  collectDisposalResources(): Array<THREE.BufferGeometry | THREE.Material> {
    const geometries = new Set<THREE.BufferGeometry>();
    this.root.traverse((object) => {
      if (object instanceof THREE.Mesh) geometries.add(object.geometry);
    });
    return [...geometries, ...this.materials];
  }

  private buildConnectionAnchor(): void {
    // Invisible connection anchor. The wire ends at the device silhouette;
    // there is intentionally no rendered socket or cap on the appliance.
    this.connectionAnchor.name = `${this.id}-connection-anchor`;
    this.root.add(this.connectionAnchor);
  }

}

/* Legacy six-item coordinates are intentionally replaced by seeded safe-band layout.
const TARGET_LAYOUT: Array<{
  id: string;
  label: string;
  kind: ApplianceKind;
  accent: number;
  screen: ScreenLayout;
}> = [
  { id: 'lamp', label: '台灯', kind: 'lamp', accent: PAL.yellow, screen: [0.16, 0.29] },
  { id: 'fan', label: '风扇', kind: 'fan', accent: PAL.blue, screen: [0.88, 0.67] },
  { id: 'radio', label: '收音机', kind: 'radio', accent: PAL.blossomDeep, screen: [0.66, 0.88] },
  { id: 'television', label: '电视', kind: 'television', accent: PAL.red, screen: [0.12, 0.72] },
  { id: 'humidifier', label: '加湿器', kind: 'humidifier', accent: PAL.teal, screen: [0.1, 0.5] },
  { id: 'toaster', label: '烤面包机', kind: 'toaster', accent: PAL.orange, screen: [0.88, 0.27] },
];

*/

export class ApplianceScene {
  readonly root = new THREE.Group();
  readonly targets: ApplianceTarget[] = [];
  private readonly assignments = new Map<string, ApplianceTarget>();
  private readonly requiredColors = new Set<number>();
  private readonly colorPlugStyles = new Map<number, PlugStyleId>();
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly projected = new THREE.Vector3();
  private readonly cameraUp = new THREE.Vector3();
  private readonly cameraRight = new THREE.Vector3();
  private readonly boundedOrbitCamera = new THREE.PerspectiveCamera();
  private readonly boundedOrbitTarget = new THREE.Vector3(0, 0.05, 0);
  private readonly boundedOrbitProjected = new THREE.Vector3();
  private readonly boundedOrbitProbe = new THREE.Object3D();
  private readonly boundedCameraInverse = new THREE.Quaternion();
  private readonly boundedRelativeQuaternion = new THREE.Quaternion();
  private readonly diagnosticRootUp = new THREE.Vector3();
  private readonly diagnosticScreenUp = new THREE.Vector3();
  private readonly diagnosticRootQuaternion = new THREE.Quaternion();
  private readonly dragOffset = new THREE.Vector2();
  private readonly dragStartClient = new THREE.Vector2();
  private readonly dragStartScreenPosition = new THREE.Vector2();
  private readonly dragPlane = new THREE.Plane();
  private readonly dragPlanePoint = new THREE.Vector3();
  private readonly dragHitPoint = new THREE.Vector3();
  private readonly dragViewAxis = new THREE.Vector3();
  private readonly dragSurfaceNormal = new THREE.Vector3();
  private readonly dragNormalMatrix = new THREE.Matrix3();
  private readonly openingTransforms = new Map<ApplianceTarget, {
    position: THREE.Vector3;
    quaternion: THREE.Quaternion;
    scale: THREE.Vector3;
  }>();
  private readonly transitionPosition = new THREE.Vector3();
  private readonly transitionQuaternion = new THREE.Quaternion();
  private readonly transitionScale = new THREE.Vector3();
  private canvas: HTMLCanvasElement | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private orbitYaw = 0.76;
  private orbitPitch = 0.56;
  private appliancePitch = 0.56;
  private orbitRadius = 19.2;
  private boundedOrbitScreenDepth = 19.2 + BACK_LAYER_OFFSET;
  private pointerId: number | null = null;
  private dragHoldTimer = 0;
  private draggedTarget: ApplianceTarget | null = null;
  private suppressClick = false;
  private burstHandler: ((origin: THREE.Vector3, direction: THREE.Vector3, count: number) => void) | null = null;
  private replacementState = 0;
  private configuredSeed = 0;
  private configuredDefinitions: ApplianceDefinition[] = [];
  private configuredColors: number[] = [];
  private readonly replacementKindHistory = new Map<number, ApplianceKind[]>();
  private routingStateRevision = 0;
  private routingStateSignature = '';
  private replacementFilter: ((definition: ApplianceDefinition) => boolean) | null = null;
  private replacementWarmupHandler: ((root: THREE.Object3D) => Promise<unknown> | void) | null = null;
  private interactionEnabled = true;
  private readonly pendingSpawns: Array<{
    target: ApplianceTarget;
    readyAt: number;
    warmup: PreparedReplacement;
  }> = [];
  private readonly preparedReplacements = new Map<ApplianceTarget, PreparedReplacement>();
  private readonly deferredDisposals: DeferredDisposal[] = [];

  constructor() {
    this.root.name = 'appliance-scene';
  }

  configure(
    seed: number,
    definitions: readonly ApplianceDefinition[] = selectAppliancesForSeed(seed),
    colors: readonly number[] = ARROW_COLORS,
  ): void {
    const arrangedColors = this.arrangeColors(seed, colors, definitions.length);
    this.rememberConfiguration(seed, definitions, arrangedColors);
    const restoreVisibility = this.root.visible;
    this.root.visible = false;
    this.clearTargets(seed);
    definitions.forEach((definition, index) => {
      this.addTarget(definition, index, arrangedColors);
    });
    this.commitInitialLayout(seed, restoreVisibility);
  }

  async configureAsync(
    seed: number,
    onProgress?: (progress: number, buildMs: number) => void,
    definitions: readonly ApplianceDefinition[] = selectAppliancesForSeed(seed),
    colors: readonly number[] = ARROW_COLORS,
  ): Promise<void> {
    const arrangedColors = this.arrangeColors(seed, colors, definitions.length);
    this.rememberConfiguration(seed, definitions, arrangedColors);
    const restoreVisibility = this.root.visible;
    this.root.visible = false;
    this.clearTargets(seed);
    for (let index = 0; index < definitions.length; index += 1) {
      const startedAt = performance.now();
      this.addTarget(definitions[index], index, arrangedColors);
      onProgress?.((index + 1) / definitions.length, performance.now() - startedAt);
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }
    this.commitInitialLayout(seed, restoreVisibility);
  }

  private rememberConfiguration(
    seed: number,
    definitions: readonly ApplianceDefinition[],
    colors: readonly number[],
  ): void {
    this.configuredSeed = seed;
    this.configuredDefinitions = [...definitions];
    this.configuredColors = [...colors];
  }

  private arrangeColors(seed: number, colors: readonly number[], count: number): number[] {
    const source = colors.length > 0 ? colors : ARROW_COLORS;
    const arranged = Array.from({ length: count }, (_, index) => source[index % source.length]);
    let state = (seed ^ 0xb5297a4d) >>> 0;
    const random = (): number => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 4294967296;
    };
    for (let index = arranged.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      [arranged[index], arranged[swapIndex]] = [arranged[swapIndex], arranged[index]];
    }
    return arranged;
  }

  private clearTargets(seed: number): void {
    this.clearPreparedReplacements();
    this.flushDeferredDisposals();
    this.assignments.clear();
    this.requiredColors.clear();
    this.colorPlugStyles.clear();
    this.targets.forEach((target) => target.dispose());
    this.targets.length = 0;
    this.pendingSpawns.length = 0;
    this.replacementKindHistory.clear();
    this.replacementState = (seed ^ 0x7f4a7c15) >>> 0;
    this.syncRoutingRevision();
  }

  private addTarget(
    definition: ApplianceDefinition,
    index: number,
    colors: readonly number[],
  ): void {
    const color = colors[index % Math.max(1, colors.length)] ?? ARROW_COLORS[index % ARROW_COLORS.length];
    const target = new ApplianceTarget(definition, color, [0.1, 0.5]);
    target.root.visible = false;
    this.targets.push(target);
    if (!this.colorPlugStyles.has(color)) this.colorPlugStyles.set(color, target.plugStyleId);
    this.root.add(target.root);
  }

  setBurstHandler(
    handler: (origin: THREE.Vector3, direction: THREE.Vector3, count: number) => void,
  ): void {
    this.burstHandler = handler;
  }

  getPlugStyleForColor(color: number): PlugStyleId {
    const style = this.colorPlugStyles.get(color)
      ?? this.targets.find((target) => target.accent === color)?.plugStyleId;
    if (!style) throw new Error(`No appliance plug style registered for color ${color}.`);
    return style;
  }

  get routingRevision(): number {
    return this.routingStateRevision;
  }

  setRequiredColors(colors: readonly number[]): void {
    this.clearPreparedReplacements();
    this.requiredColors.clear();
    colors.forEach((color) => this.requiredColors.add(color));
    this.syncRoutingRevision();
  }

  setReplacementFilter(filter: ((definition: ApplianceDefinition) => boolean) | null): void {
    this.clearPreparedReplacements();
    this.replacementFilter = filter;
  }

  setReplacementWarmupHandler(
    handler: ((root: THREE.Object3D) => Promise<unknown> | void) | null,
  ): void {
    this.replacementWarmupHandler = handler;
  }

  setInteractionEnabled(enabled: boolean): void {
    this.interactionEnabled = enabled;
    if (enabled || this.pointerId === null) return;
    this.pointerId = null;
    this.draggedTarget = null;
    this.canvas?.classList.remove('dragging-appliance');
  }

  canAssignColor(color: number): boolean {
    return this.assignmentCandidates(color).length > 0;
  }

  canQueueColor(color: number): boolean {
    return this.targets.some((target) => target.accent === color && !target.isDropping);
  }

  canHandleColor(color: number): boolean {
    return this.canAssignColor(color) || this.canQueueColor(color);
  }

  reserveAssignment(cableId: string, color: number): ApplianceTarget | null {
    const existing = this.assignments.get(cableId);
    if (existing) return existing;
    const candidates = this.assignmentCandidates(color);
    if (candidates.length === 0) return null;
    const target = candidates[Math.floor(this.nextReplacementRandom() * candidates.length)] ?? null;
    if (!target) return null;
    this.assignments.set(cableId, target);
    target.reserve(color);
    this.syncRoutingRevision();
    return target;
  }

  getRoutingSummary(): {
    requiredColors: number[];
    coveredColors: number[];
    assignableColors: number[];
    allRequiredCovered: boolean;
    reservations: Array<{ cableId: string; color: number; targetId: string }>;
  } {
    const coveredColors = [...new Set(this.targets.map((target) => target.accent))];
    const assignableColors = [...new Set(
      this.targets.filter((target) => this.isAssignableTarget(target)).map((target) => target.accent),
    )];
    const requiredColors = [...this.requiredColors];
    return {
      requiredColors,
      coveredColors,
      assignableColors,
      allRequiredCovered: requiredColors.every((color) => coveredColors.includes(color)),
      reservations: [...this.assignments].map(([cableId, target]) => ({
        cableId,
        color: target.accent,
        targetId: target.id,
      })),
    };
  }

  getActiveLayout(): ActiveApplianceLayout[] {
    return this.targets.map((target) => ({
      definition: target.definition,
      color: target.accent,
      side: target.screenPosition.x < 0.5 ? 'left' : 'right',
      screen: [target.screenPosition.x, target.screenPosition.y],
    }));
  }

  getCatalogSummary(): ReturnType<typeof applianceCatalogSummary> {
    return applianceCatalogSummary();
  }

  isScreenPointBlockedByAppliance(ndcX: number, ndcY: number): boolean {
    const aspect = this.canvas
      ? Math.max(0.8, this.canvas.clientWidth / Math.max(1, this.canvas.clientHeight))
      : 16 / 9;
    const screenX = (ndcX + 1) * 0.5;
    const screenY = (1 - ndcY) * 0.5;
    return this.targets.some((target) => {
      if (!target.root.visible || target.isLifecycleTransitioning || target.isConnecting) return false;
      const size = target.getScreenSize(aspect);
      return Math.abs(screenX - target.screenPosition.x) <= size.x * 0.46 &&
        Math.abs(screenY - target.screenPosition.y) <= size.y * 0.46;
    });
  }

  bind(canvas: HTMLCanvasElement, camera: THREE.PerspectiveCamera): void {
    this.unbind();
    this.canvas = canvas;
    this.camera = camera;
    canvas.addEventListener('pointerdown', this.onPointerDown, true);
    canvas.addEventListener('pointermove', this.onPointerMove, true);
    canvas.addEventListener('pointerup', this.onPointerUp, true);
    canvas.addEventListener('pointercancel', this.onPointerCancel, true);
    canvas.addEventListener('click', this.onClickCapture, true);
  }

  setOrbitState(state: {
    yaw: number;
    pitch: number;
    appliancePitch: number;
    radius: number;
  }): void {
    this.orbitYaw = state.yaw;
    this.orbitPitch = state.pitch;
    this.appliancePitch = state.appliancePitch;
    this.orbitRadius = state.radius;
  }

  assign(cableId: string, color: number): ApplianceTarget {
    const target = this.reserveAssignment(cableId, color);
    if (!target) throw new Error(`No assignable appliance for cable ${cableId} and color ${color}.`);
    return target;
  }

  update(delta: number, elapsed: number): void {
    const camera = this.camera;
    if (!camera) return;
    camera.updateMatrixWorld(true);
    this.prepareBoundedOrbitCamera(camera);
    const screenDepth = camera.position.length() + BACK_LAYER_OFFSET;
    const now = performance.now() * 0.001;
    this.processDeferredDisposals(now);
    const spawnBursts: ApplianceTarget[] = [];
    for (let index = this.pendingSpawns.length - 1; index >= 0; index -= 1) {
      const pending = this.pendingSpawns[index];
      if (now < pending.readyAt || !pending.warmup.warmupReady) continue;
      this.pendingSpawns.splice(index, 1);
      pending.target.beginSpawnDrop(this.spawnDropHeightFor(pending.target, camera, screenDepth));
      spawnBursts.push(pending.target);
    }

    const recycle: ApplianceTarget[] = [];
    let preparedReplacementThisFrame = false;
    for (const target of [...this.targets]) {
      target.depthScale = screenDepth / REFERENCE_SCREEN_DEPTH;
      target.update(delta, elapsed);
      const shouldPrepareReplacement = !this.preparedReplacements.has(target)
        && !target.isDragging
        && (
          (target.state === 'active' && target.getActiveElapsed() >= SPAWN_DROP_PREPARE_AFTER)
          || target.state === 'inflating'
        );
      if (shouldPrepareReplacement && !preparedReplacementThisFrame) {
        this.prepareReplacement(target);
        preparedReplacementThisFrame = true;
      }
      this.updateDrop(target, delta);
      this.positionTarget(target, camera, screenDepth);
      if (target.dropCommitPending) {
        const settledWorld = target.root.getWorldPosition(new THREE.Vector3()).project(camera);
        target.screenPosition.set(
          settledWorld.x * 0.5 + 0.5,
          0.5 - settledWorld.y * 0.5,
        );
        target.dropOffset = 0;
        target.landingSway = 0;
        target.dropCommitPending = false;
        this.positionTarget(target, camera, screenDepth);
      }
      target.updateSoftDeform(delta);
      if (!target.isDragging && !target.isDropping && target.consumeRecycleRequest()) {
        recycle.push(target);
      }
    }
    spawnBursts.forEach((target) => {
      target.root.updateWorldMatrix(true, true);
      this.burstHandler?.(
        target.getConnectionWorldPosition(),
        this.cameraUp.clone().multiplyScalar(0.8),
        22,
      );
    });
    recycle.forEach((target) => this.replaceTarget(target, camera, screenDepth, now));
    this.syncRoutingRevision();
  }

  beginOpeningCameraTransition(): void {
    this.openingTransforms.clear();
    for (const target of this.targets) {
      this.openingTransforms.set(target, {
        position: target.root.position.clone(),
        quaternion: target.root.quaternion.clone(),
        scale: target.root.scale.clone(),
      });
    }
  }

  updateOpeningCameraTransition(delta: number, elapsed: number, anchorBlend: number): void {
    if (this.openingTransforms.size === 0) this.beginOpeningCameraTransition();
    this.update(delta, elapsed);
    const blend = THREE.MathUtils.clamp(anchorBlend, 0, 1);
    for (const target of this.targets) {
      const opening = this.openingTransforms.get(target);
      if (!opening) continue;
      this.transitionPosition.copy(target.root.position);
      this.transitionQuaternion.copy(target.root.quaternion);
      this.transitionScale.copy(target.root.scale);
      target.root.position.lerpVectors(opening.position, this.transitionPosition, blend);
      target.root.quaternion.slerpQuaternions(opening.quaternion, this.transitionQuaternion, blend);
      target.root.scale.lerpVectors(opening.scale, this.transitionScale, blend);
    }
  }

  endOpeningCameraTransition(): void {
    this.openingTransforms.clear();
  }

  reset(): void {
    this.resetInteractionState();
    this.clearPreparedReplacements();
    if (this.configuredDefinitions.length > 0) {
      const restoreVisibility = this.root.visible;
      this.clearTargets(this.configuredSeed);
      this.configuredDefinitions.forEach((definition, index) => {
        this.addTarget(definition, index, this.configuredColors);
      });
      this.commitInitialLayout(this.configuredSeed, restoreVisibility);
      return;
    }
    this.assignments.clear();
    this.pendingSpawns.length = 0;
    this.targets.forEach((target) => target.reset());
    this.syncRoutingRevision();
  }

  clear(): void {
    this.resetInteractionState();
    this.configuredDefinitions = [];
    this.configuredColors = [];
    this.clearTargets(0);
  }

  private resetInteractionState(): void {
    globalThis.clearTimeout(this.dragHoldTimer);
    this.dragHoldTimer = 0;
    this.pointerId = null;
    this.draggedTarget = null;
    this.canvas?.classList.remove('dragging-appliance');
    this.openingTransforms.clear();
  }

  dispose(): void {
    this.unbind();
    this.clearPreparedReplacements();
    this.flushDeferredDisposals();
    this.targets.forEach((target) => target.dispose());
    this.root.removeFromParent();
  }

  getStateSummary(): Array<{
    id: string;
    kind: ApplianceKind;
    accent: number;
    sizeTier: ApplianceSizeTier;
    plugStyleId: PlugStyleId;
    state: ApplianceState;
    connections: number;
    activeTimeRemaining: number;
    animationSignal: number;
    screenX: number;
    screenY: number;
    screenWidth: number;
    screenHeight: number;
    rootScreenY: number;
    instanceId: string;
    dragging: boolean;
    dropping: boolean;
    dropOffset: number;
    landingSway: number;
    landingTilt: number;
    landingImpactCount: number;
    landingContactSide: -1 | 0 | 1;
    lifecycleScale: number;
    inflationPeakCount: number;
    deforming: boolean;
    deformPull: number;
    deformSignedPull: number;
    screenUpAlignment: number;
    orientationQuaternion: [number, number, number, number];
    facingSide: -1 | 1;
    outwardEdge: 'left' | 'right' | 'top' | 'bottom';
  }> {
    const aspect = this.canvas
      ? Math.max(0.8, this.canvas.clientWidth / Math.max(1, this.canvas.clientHeight))
      : 16 / 9;
    if (this.camera) {
      this.diagnosticScreenUp.set(0, 1, 0).applyQuaternion(this.camera.quaternion);
    }
    return this.targets.map((target) => {
      const size = target.getScreenSize(aspect);
      const rootWorldPosition = target.root.getWorldPosition(new THREE.Vector3());
      const rootScreenY = this.camera
        ? 0.5 - rootWorldPosition.project(this.camera).y * 0.5
        : target.screenPosition.y;
      const screenUpAlignment = this.camera
        ? this.diagnosticRootUp
          .set(0, 1, 0)
          .applyQuaternion(target.root.getWorldQuaternion(this.diagnosticRootQuaternion))
          .dot(this.diagnosticScreenUp)
        : 1;
      const orientation = target.root.getWorldQuaternion(this.diagnosticRootQuaternion);
      return {
      id: target.id,
      kind: target.kind,
      accent: target.accent,
      sizeTier: target.sizeTier,
      plugStyleId: target.plugStyleId,
      state: target.state,
      connections: target.connectionCount,
      activeTimeRemaining: target.activeTimeRemaining,
      animationSignal: target.getAnimationSignal(),
      screenX: target.screenPosition.x,
      screenY: target.screenPosition.y,
      screenWidth: size.x,
      screenHeight: size.y,
      rootScreenY,
      instanceId: target.root.uuid,
      dragging: target.isDragging,
      dropping: target.isDropping,
      dropOffset: target.dropOffset,
      landingSway: target.landingSway,
      landingTilt: target.landingTilt,
      landingImpactCount: target.landingImpactCount,
      landingContactSide: target.landingContactSide,
      lifecycleScale: target.lifecycleScale,
      inflationPeakCount: target.inflationPeakCount,
      deforming: target.isSoftDeforming,
      deformPull: target.softDeformPull,
      deformSignedPull: target.softDeformSignedPull,
      screenUpAlignment,
      orientationQuaternion: [orientation.x, orientation.y, orientation.z, orientation.w],
      facingSide: target.facingSide,
      outwardEdge: target.outwardEdge,
    };
    });
  }

  private unbind(): void {
    if (!this.canvas) return;
    window.clearTimeout(this.dragHoldTimer);
    this.dragHoldTimer = 0;
    this.pointerId = null;
    this.draggedTarget = null;
    this.canvas.removeEventListener('pointerdown', this.onPointerDown, true);
    this.canvas.removeEventListener('pointermove', this.onPointerMove, true);
    this.canvas.removeEventListener('pointerup', this.onPointerUp, true);
    this.canvas.removeEventListener('pointercancel', this.onPointerCancel, true);
    this.canvas.removeEventListener('click', this.onClickCapture, true);
    this.canvas = null;
    this.camera = null;
  }

  private applyInitialLayout(seed: number): void {
    const aspect = this.canvas
      ? Math.max(0.8, this.canvas.clientWidth / Math.max(1, this.canvas.clientHeight))
      : 16 / 9;
    const left: ApplianceTarget[] = [];
    const right: ApplianceTarget[] = [];
    const refrigerator = this.targets.find((target) => target.kind === 'refrigerator');
    const refrigeratorSide = (seed >>> 0) % 2 === 0 ? left : right;
    const oppositeSide = refrigeratorSide === left ? right : left;
    if (refrigerator) refrigeratorSide.push(refrigerator);

    const remaining = this.targets
      .filter((target) => target !== refrigerator)
      .sort((a, b) => b.definition.targetScreenHeight - a.definition.targetScreenHeight);
    for (const target of remaining) {
      const leftHeight = left.reduce((sum, item) => sum + item.definition.targetScreenHeight, 0);
      const rightHeight = right.reduce((sum, item) => sum + item.definition.targetScreenHeight, 0);
      let destination: ApplianceTarget[];
      if (left.length >= 4) destination = right;
      else if (right.length >= 4) destination = left;
      else destination = leftHeight <= rightHeight ? left : right;
      destination.push(target);
    }
    while (refrigeratorSide.length > 4) {
      const movable = refrigeratorSide
        .filter((target) => target !== refrigerator)
        .sort((a, b) => a.definition.targetScreenHeight - b.definition.targetScreenHeight)[0];
      if (!movable) break;
      refrigeratorSide.splice(refrigeratorSide.indexOf(movable), 1);
      oppositeSide.push(movable);
    }

    const arrange = (sideTargets: ApplianceTarget[], side: 'left' | 'right') => {
      const refrigeratorTarget = sideTargets.find((target) => target.kind === 'refrigerator');
      let ordered = [...sideTargets].sort(
        (a, b) => a.definition.targetScreenHeight - b.definition.targetScreenHeight,
      );
      if (refrigeratorTarget) {
        const rest = ordered.filter((target) => target !== refrigeratorTarget);
        ordered = rest.length > 0 ? [rest[0], refrigeratorTarget, ...rest.slice(1)] : [refrigeratorTarget];
      } else {
        ordered.reverse();
      }
      const totalHeight = ordered.reduce(
        (sum, target) => sum + target.definition.targetScreenHeight,
        Math.max(0, ordered.length - 1) * LAYOUT_GAP,
      );
      let cursor = LAYOUT_TOP + Math.max(0, (LAYOUT_BOTTOM - LAYOUT_TOP - totalHeight) * 0.5);
      for (let index = 0; index < ordered.length; index += 1) {
        const target = ordered[index];
        const size = target.getScreenSize(aspect);
        const halfWidth = size.x * 0.5;
        const staggeredLane = side === 'left'
          ? index % 2 === 0 ? 0.12 : 0.19
          : index % 2 === 0 ? 0.88 : 0.81;
        const x = side === 'left'
          ? THREE.MathUtils.clamp(
              staggeredLane,
              0.025 + halfWidth,
              CENTRAL_SAFE_MIN - LAYOUT_GAP - halfWidth,
            )
          : THREE.MathUtils.clamp(
              staggeredLane,
              CENTRAL_SAFE_MAX + LAYOUT_GAP + halfWidth,
              0.975 - halfWidth,
            );
        target.screenPosition.set(x, cursor + target.definition.targetScreenHeight * 0.5);
        cursor += target.definition.targetScreenHeight + LAYOUT_GAP;
      }
    };
    arrange(left, 'left');
    arrange(right, 'right');
  }

  private commitInitialLayout(seed: number, restoreVisibility: boolean): void {
    this.applyInitialLayout(seed);
    const camera = this.camera;
    if (camera) {
      camera.updateMatrixWorld(true);
      const screenDepth = camera.position.length() + BACK_LAYER_OFFSET;
      for (const target of this.targets) {
        target.depthScale = screenDepth / REFERENCE_SCREEN_DEPTH;
        this.positionTarget(target, camera, screenDepth);
        target.root.updateWorldMatrix(true, true);
      }
    }
    this.targets.forEach((target) => {
      target.root.visible = true;
    });
    this.root.visible = restoreVisibility;
    this.syncRoutingRevision();
  }

  private positionTarget(
    target: ApplianceTarget,
    camera: THREE.PerspectiveCamera,
    screenDepth: number,
  ): void {
    this.projected
      .set(target.screenPosition.x * 2 - 1, 1 - target.screenPosition.y * 2, 0)
      .unproject(camera)
      .sub(camera.position)
      .normalize()
      .multiplyScalar(screenDepth)
      .add(camera.position);
    this.cameraUp.set(0, 1, 0).applyQuaternion(camera.quaternion);
    this.cameraRight.set(1, 0, 0).applyQuaternion(camera.quaternion);
    target.root.position
      .copy(this.projected)
      .addScaledVector(this.cameraUp, -target.dropOffset)
      .addScaledVector(this.cameraRight, target.landingSway * 0.28);

    const side: -1 | 1 = target.screenPosition.x < 0.5 ? -1 : 1;
    if (Math.abs(this.orbitPitch - this.appliancePitch) < 0.0001) {
      // Preserve the original orbit response while the appliance camera is
      // inside its old vertical range. World-up keeps the side turn and toon
      // lighting reactive instead of making every appliance a rigid billboard.
      target.root.up.set(0, 1, 0);
      target.root.lookAt(camera.position);
      target.root.rotateY(-side * THREE_QUARTER_YAW);
      target.root.rotateX(applianceTopTilt(target.kind));
      target.root.rotateZ(target.landingTilt);
    } else {
      this.applyBoundedOrbitOrientation(target, camera, side);
    }
    target.setScreenPlacement(target.screenPosition);
  }

  private prepareBoundedOrbitCamera(camera: THREE.PerspectiveCamera): void {
    if (Math.abs(this.orbitPitch - this.appliancePitch) < 0.0001) return;
    const horizontal = Math.cos(this.appliancePitch) * this.orbitRadius;
    this.boundedOrbitCamera.position.set(
      Math.sin(this.orbitYaw) * horizontal,
      Math.sin(this.appliancePitch) * this.orbitRadius,
      Math.cos(this.orbitYaw) * horizontal,
    );
    this.boundedOrbitCamera.up.set(0, 1, 0);
    this.boundedOrbitCamera.projectionMatrix.copy(camera.projectionMatrix);
    this.boundedOrbitCamera.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
    this.boundedOrbitCamera.lookAt(this.boundedOrbitTarget);
    this.boundedOrbitCamera.updateMatrixWorld(true);
    this.boundedOrbitScreenDepth = this.boundedOrbitCamera.position.length() + BACK_LAYER_OFFSET;
  }

  private applyBoundedOrbitOrientation(
    target: ApplianceTarget,
    camera: THREE.PerspectiveCamera,
    side: -1 | 1,
  ): void {
    this.boundedOrbitProjected
      .set(target.screenPosition.x * 2 - 1, 1 - target.screenPosition.y * 2, 0)
      .unproject(this.boundedOrbitCamera)
      .sub(this.boundedOrbitCamera.position)
      .normalize()
      .multiplyScalar(this.boundedOrbitScreenDepth)
      .add(this.boundedOrbitCamera.position);
    this.boundedOrbitProbe.position.copy(this.boundedOrbitProjected);
    this.boundedOrbitProbe.up.set(0, 1, 0);
    this.boundedOrbitProbe.lookAt(this.boundedOrbitCamera.position);
    this.boundedOrbitProbe.rotateY(-side * THREE_QUARTER_YAW);
    this.boundedOrbitProbe.rotateX(applianceTopTilt(target.kind));
    this.boundedOrbitProbe.rotateZ(target.landingTilt);

    this.boundedCameraInverse.copy(this.boundedOrbitCamera.quaternion).invert();
    this.boundedRelativeQuaternion
      .copy(this.boundedCameraInverse)
      .multiply(this.boundedOrbitProbe.quaternion);
    target.root.quaternion
      .copy(camera.quaternion)
      .multiply(this.boundedRelativeQuaternion);
  }

  private updateDrop(target: ApplianceTarget, delta: number): void {
    if (!target.isDropping || target.isDragging) return;
    target.dropElapsed += THREE.MathUtils.clamp(delta, 0, 0.05);
    const now = performance.now() * 0.001;
    const elapsed = target.dropElapsed;
    if (target.isSpawnDrop) {
      if (elapsed < SPAWN_DROP_FALL_DURATION) {
        const fall = elapsed / SPAWN_DROP_FALL_DURATION;
        target.dropOffset = -target.spawnDropHeight * (1 - fall * fall);
        return;
      }
      const bounceTime = elapsed - SPAWN_DROP_FALL_DURATION;
      const bounceDecay = Math.exp(-DROP_BOUNCE_DAMPING * bounceTime);
      const swayDecay = Math.exp(-SWAY_DAMPING * bounceTime);
      target.dropOffset = -DROP_BOUNCE_HEIGHT * bounceDecay * Math.abs(
        Math.sin(bounceTime * DROP_BOUNCE_FREQUENCY),
      );
      target.landingSway =
        target.landingDirection * 0.12 * swayDecay * Math.sin(bounceTime * SWAY_FREQUENCY);
      target.landingTilt =
        -target.landingDirection *
        0.065 *
        swayDecay *
        Math.sin(bounceTime * SWAY_FREQUENCY + 0.42);
      if (elapsed < SPAWN_DROP_TOTAL_DURATION) return;
      target.isDropping = false;
      target.isSpawnDrop = false;
      target.dropOffset = 0;
      target.spawnDropHeight = SPAWN_DROP_MIN_HEIGHT;
      target.landingSway = 0;
      target.landingTilt = 0;
      if (target.state === 'spawning') target.state = 'idle';
      return;
    }
    if (!target.dropLanded && elapsed < DROP_FALL_DURATION) {
      const fall = elapsed / DROP_FALL_DURATION;
      target.dropOffset = DROP_DISTANCE * fall * fall;
      target.landingTilt = dropContactTilt(0, target.landingDirection) * fall * fall;
      target.landingSway = 0;
      target.landingImpactCount = 0;
      target.landingContactSide = 0;
      return;
    }

    // Commit the fixed fall distance once, at the first corner impact. Every
    // rebound after this point is relative to that one ground anchor, so the
    // final pose cannot acquire a second screen-space offset.
    if (!target.dropLanded) {
      target.dropLanded = true;
      target.dropLandedAt = now;
      target.dropElapsed = 0;
      target.dropOffset = DROP_DISTANCE;
      target.landingSway = 0;
      target.landingTilt = dropContactTilt(0, target.landingDirection);
      target.landingImpactCount = 1;
      target.landingContactSide = target.landingDirection;
      target.dropCommitPending = true;
      return;
    }

    let reboundElapsed = target.dropElapsed;
    for (let rebound = 0; rebound < DROP_REBOUND_COUNT; rebound += 1) {
      const upwardSpeed = dropReboundSpeed(rebound);
      const flightDuration = (2 * upwardSpeed) / DROP_GRAVITY;
      if (reboundElapsed < flightDuration) {
        const phase = reboundElapsed / flightDuration;
        const lift = upwardSpeed * reboundElapsed
          - 0.5 * DROP_GRAVITY * reboundElapsed * reboundElapsed;
        target.dropOffset = -Math.max(0, lift);
        target.landingTilt = THREE.MathUtils.lerp(
          dropContactTilt(rebound, target.landingDirection),
          dropContactTilt(rebound + 1, target.landingDirection),
          phase,
        );
        target.landingSway = THREE.MathUtils.lerp(
          dropContactSway(rebound, target.landingDirection),
          dropContactSway(rebound + 1, target.landingDirection),
          phase,
        );
        target.landingImpactCount = rebound + 1;
        target.landingContactSide = (
          rebound % 2 === 0 ? target.landingDirection : -target.landingDirection
        ) as -1 | 1;
        return;
      }
      reboundElapsed -= flightDuration;
    }

    target.finishDrop();
    target.isDropping = false;
    target.dropLanded = false;
    target.dropLandedAt = 0;
    target.dropElapsed = 0;
    target.dropVelocity = 0;
    target.dropOffset = 0;
    target.landingSway = 0;
    target.landingTilt = 0;
    target.landingSwayVelocity = 0;
    target.landingTiltVelocity = 0;
    target.landingImpactCount = 0;
    target.landingContactSide = 0;
  }

  private spawnDropHeightFor(
    target: ApplianceTarget,
    camera: THREE.PerspectiveCamera,
    screenDepth: number,
  ): number {
    const viewportHeight = Math.max(1, this.canvas?.clientHeight ?? 720);
    const viewportWidth = Math.max(1, this.canvas?.clientWidth ?? viewportHeight * 16 / 9);
    const aspect = Math.max(0.8, viewportWidth / viewportHeight);
    const screenHeight = target.getScreenSize(aspect).y;
    const marginPx = THREE.MathUtils.clamp(
      viewportHeight * 0.13,
      SPAWN_DROP_TOP_MARGIN_MIN_PX,
      SPAWN_DROP_TOP_MARGIN_MAX_PX,
    );
    const marginRatio = marginPx / viewportHeight;
    const visibleVerticalSpan = 2
      * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5))
      * screenDepth;
    return Math.max(
      SPAWN_DROP_MIN_HEIGHT,
      (target.screenPosition.y + screenHeight * 0.55 + marginRatio) * visibleVerticalSpan,
    );
  }

  private replaceTarget(
    previous: ApplianceTarget,
    camera: THREE.PerspectiveCamera,
    screenDepth: number,
    now: number,
  ): void {
    const targetIndex = this.targets.indexOf(previous);
    if (targetIndex < 0) return;
    previous.root.updateWorldMatrix(true, true);
    this.burstHandler?.(
      previous.getConnectionWorldPosition(),
      this.cameraUp.clone().multiplyScalar(0.95),
      32,
    );

    const otherTargets = this.targets.filter((target) => target !== previous);
    const prepared = this.preparedReplacements.get(previous);
    this.preparedReplacements.delete(previous);
    const usePrepared = prepared
      && prepared.targetIndex === targetIndex
      && prepared.randomState === this.replacementState
      && this.isPreparedReplacementValid(previous, prepared.replacement, otherTargets);
    const candidate: PreparedReplacement = usePrepared
      ? prepared
      : (() => {
        const created = this.createReplacement(previous, targetIndex, otherTargets);
        const fallback: PreparedReplacement = {
          replacement: created.replacement,
          targetIndex,
          previousResources: prepared?.previousResources ?? previous.collectDisposalResources(),
          randomState: this.replacementState,
          nextRandomState: created.nextRandomState,
          warmupReady: this.replacementWarmupHandler === null,
          warmupPromise: Promise.resolve(),
        };
        this.warmPreparedReplacement(fallback);
        return fallback;
      })();
    const replacement = candidate.replacement;
    this.replacementState = candidate.nextRandomState;
    if (prepared && prepared.replacement !== replacement) this.disposePreparedReplacement(prepared);
    const recentKinds = this.replacementKindHistory.get(targetIndex) ?? [];
    this.replacementKindHistory.set(
      targetIndex,
      [...new Set<ApplianceKind>([replacement.kind, previous.kind, ...recentKinds])]
        .slice(0, REPLACEMENT_KIND_HISTORY_SIZE),
    );
    replacement.root.visible = false;
    replacement.depthScale = screenDepth / REFERENCE_SCREEN_DEPTH;

    for (const [cableId, target] of this.assignments) {
      if (target === previous) this.assignments.delete(cableId);
    }
    this.targets[targetIndex] = replacement;
    this.root.add(replacement.root);
    this.positionTarget(replacement, camera, screenDepth);
    previous.detachForDisposal();
    this.deferredDisposals.push({
      resources: candidate.previousResources,
      nextIndex: 0,
      readyAt: now + 0.12,
    });
    this.pendingSpawns.push({
      target: replacement,
      readyAt: now + REPLACEMENT_DELAY,
      warmup: candidate,
    });
  }

  private prepareReplacement(previous: ApplianceTarget): void {
    if (this.preparedReplacements.has(previous)) return;
    const targetIndex = this.targets.indexOf(previous);
    if (targetIndex < 0) return;
    const otherTargets = this.targets.filter((target) => target !== previous);
    const candidate = this.createReplacement(previous, targetIndex, otherTargets);
    const replacement = candidate.replacement;
    replacement.root.visible = false;
    const prepared: PreparedReplacement = {
      replacement,
      targetIndex,
      previousResources: previous.collectDisposalResources(),
      randomState: this.replacementState,
      nextRandomState: candidate.nextRandomState,
      warmupReady: this.replacementWarmupHandler === null,
      warmupPromise: Promise.resolve(),
    };
    this.preparedReplacements.set(previous, prepared);
    this.warmPreparedReplacement(prepared);
  }

  private warmPreparedReplacement(prepared: PreparedReplacement): void {
    if (!this.replacementWarmupHandler) {
      prepared.warmupReady = true;
      prepared.warmupPromise = Promise.resolve();
      return;
    }
    prepared.warmupPromise = Promise.resolve(
      this.replacementWarmupHandler(prepared.replacement.root),
    )
      .catch(() => undefined)
      .then(() => {
        prepared.warmupReady = true;
      });
    window.setTimeout(() => {
      prepared.warmupReady = true;
    }, 1_500);
  }

  private createReplacement(
    previous: ApplianceTarget,
    targetIndex: number,
    otherTargets: readonly ApplianceTarget[],
  ): { replacement: ApplianceTarget; nextRandomState: number } {
    let randomState = this.replacementState;
    const random = (): number => {
      randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
      return randomState / 4294967296;
    };
    const occupiedKinds = new Set(otherTargets.map((target) => target.kind));
    const available = APPLIANCE_CATALOG.filter(
      (definition) => definition.id !== previous.kind
        && !occupiedKinds.has(definition.id)
        && (this.replacementFilter?.(definition) ?? true),
    );
    const recentKinds = this.replacementKindHistory.get(targetIndex) ?? [];
    const excludedRecentKinds = new Set<ApplianceKind>([previous.kind, ...recentKinds]);
    const diversePool = available.filter((definition) => !excludedRecentKinds.has(definition.id));
    const pool = diversePool.length > 0 ? diversePool : available;
    const definition = pool[Math.floor(random() * pool.length)] ?? previous.definition;

    const requiredColorPool: number[] = this.requiredColors.size > 0
      ? [...this.requiredColors]
      : [...ARROW_COLORS];
    const previousColorRequired = this.requiredColors.size > 0
      && this.requiredColors.has(previous.accent);
    const previousCoveredByOther = otherTargets.some((target) => target.accent === previous.accent);
    // Keep the only appliance carrying a still-needed colour. This preserves
    // the cable-to-appliance route without rebuilding a second screen slot.
    const canChangeAccent = !previousColorRequired || previousCoveredByOther;
    const accentPool = canChangeAccent
      ? requiredColorPool.filter((color) => color !== previous.accent)
      : [];
    const accent = accentPool[Math.floor(random() * accentPool.length)]
      ?? previous.accent;
    return {
      replacement: new ApplianceTarget(
        definition,
        accent,
        [previous.screenPosition.x, previous.screenPosition.y],
      ),
      nextRandomState: randomState,
    };
  }

  private isPreparedReplacementValid(
    previous: ApplianceTarget,
    replacement: ApplianceTarget,
    otherTargets: readonly ApplianceTarget[],
  ): boolean {
    if (replacement.kind === previous.kind) return false;
    if (otherTargets.some((target) => target.kind === replacement.kind)) return false;
    if (!(this.replacementFilter?.(replacement.definition) ?? true)) return false;
    const requiredColorPool = this.requiredColors.size > 0 ? this.requiredColors : new Set(ARROW_COLORS);
    if (!requiredColorPool.has(replacement.accent)) return false;
    const previousOnlyRequiredColor = this.requiredColors.has(previous.accent)
      && !otherTargets.some((target) => target.accent === previous.accent);
    return !previousOnlyRequiredColor || replacement.accent === previous.accent;
  }

  private clearPreparedReplacements(): void {
    this.preparedReplacements.forEach((prepared) => this.disposePreparedReplacement(prepared));
    this.preparedReplacements.clear();
  }

  private disposePreparedReplacement(prepared: PreparedReplacement): void {
    void prepared.warmupPromise.finally(() => prepared.replacement.dispose());
  }

  private nextReplacementRandom(): number {
    this.replacementState = (Math.imul(this.replacementState, 1664525) + 1013904223) >>> 0;
    return this.replacementState / 4294967296;
  }

  private processDeferredDisposals(now: number): void {
    const deadline = performance.now() + 1.25;
    while (this.deferredDisposals.length > 0) {
      const batch = this.deferredDisposals[0];
      if (now < batch.readyAt) return;
      batch.resources[batch.nextIndex]?.dispose();
      batch.nextIndex += 1;
      if (batch.nextIndex >= batch.resources.length) this.deferredDisposals.shift();
      if (performance.now() >= deadline) return;
    }
  }

  private flushDeferredDisposals(): void {
    this.deferredDisposals.forEach((batch) => {
      for (let index = batch.nextIndex; index < batch.resources.length; index += 1) {
        batch.resources[index].dispose();
      }
    });
    this.deferredDisposals.length = 0;
  }

  private readonly onPointerDown = (event: PointerEvent) => {
    if (!this.interactionEnabled || event.button !== 0 || this.pointerId !== null || !this.canvas || !this.camera) return;
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.camera.updateMatrixWorld(true);
    this.root.updateMatrixWorld(true);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const meshes = this.targets.flatMap((target) =>
      target.isConnecting || target.isLifecycleTransitioning || target.isDropping
        ? []
        : target.interactiveMeshes,
    );
    const hit = this.raycaster.intersectObjects(meshes, false)[0];
    const applianceId = hit?.object.userData.applianceId;
    const target = this.targets.find((candidate) => candidate.id === applianceId);
    if (!target) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    this.pointerId = event.pointerId;
    this.draggedTarget = target;
    this.dragStartClient.set(event.clientX, event.clientY);
    this.dragStartScreenPosition.copy(target.screenPosition);
    this.dragHitPoint.copy(hit.point);
    this.camera.getWorldDirection(this.dragViewAxis);
    if (hit.face) {
      this.dragNormalMatrix.getNormalMatrix(hit.object.matrixWorld);
      this.dragSurfaceNormal.copy(hit.face.normal).applyNormalMatrix(this.dragNormalMatrix);
    } else {
      this.dragSurfaceNormal.copy(this.dragViewAxis).negate();
    }
    this.dragPlane.setFromNormalAndCoplanarPoint(this.dragViewAxis, hit.point);
    const pointerX = (event.clientX - rect.left) / rect.width;
    const pointerY = (event.clientY - rect.top) / rect.height;
    this.dragOffset.set(target.screenPosition.x - pointerX, target.screenPosition.y - pointerY);
    this.canvas.setPointerCapture(event.pointerId);
    window.clearTimeout(this.dragHoldTimer);
    this.dragHoldTimer = window.setTimeout(this.activatePendingDrag, DRAG_HOLD_DELAY_MS);
  };

  private readonly activatePendingDrag = () => {
    this.dragHoldTimer = 0;
    const target = this.draggedTarget;
    if (!target || this.pointerId === null) return;
    target.isDragging = true;
    target.isDropping = false;
    target.dropOffset = 0;
    target.dropVelocity = 0;
    target.beginSoftDeform(this.dragHitPoint, this.dragViewAxis, this.dragSurfaceNormal);
    this.canvas?.classList.add('dragging-appliance');
  };

  private readonly onPointerMove = (event: PointerEvent) => {
    if (event.pointerId !== this.pointerId || !this.canvas || !this.draggedTarget) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!this.draggedTarget.isDragging) return;
    const rect = this.canvas.getBoundingClientRect();
    if (this.draggedTarget.supportsSoftDeform && this.camera) {
      const deltaX = event.clientX - this.dragStartClient.x;
      const deltaY = event.clientY - this.dragStartClient.y;
      const distance = Math.hypot(deltaX, deltaY);
      const bodyRatio = distance > SOFT_ELASTIC_LEASH_PX
        ? (distance - SOFT_ELASTIC_LEASH_PX) / distance
        : 0;
      this.draggedTarget.screenPosition.set(
        THREE.MathUtils.clamp(
          this.dragStartScreenPosition.x + (deltaX * bodyRatio) / rect.width,
          0.06,
          0.94,
        ),
        THREE.MathUtils.clamp(
          this.dragStartScreenPosition.y + (deltaY * bodyRatio) / rect.height,
          0.07,
          0.92,
        ),
      );
      this.pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      this.camera.updateMatrixWorld(true);
      this.raycaster.setFromCamera(this.pointer, this.camera);
      if (this.raycaster.ray.intersectPlane(this.dragPlane, this.dragPlanePoint)) {
        this.draggedTarget.setSoftDeformPointer(this.dragPlanePoint);
      }
      return;
    }
    this.draggedTarget.screenPosition.set(
      THREE.MathUtils.clamp((event.clientX - rect.left) / rect.width + this.dragOffset.x, 0.06, 0.94),
      THREE.MathUtils.clamp((event.clientY - rect.top) / rect.height + this.dragOffset.y, 0.07, 0.92),
    );
  };

  private readonly onPointerUp = (event: PointerEvent) => {
    if (event.pointerId !== this.pointerId || !this.canvas || !this.draggedTarget) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const target = this.draggedTarget;
    window.clearTimeout(this.dragHoldTimer);
    this.dragHoldTimer = 0;
    const wasDragging = target.isDragging;
    const moved = target.screenPosition.distanceTo(this.dragStartScreenPosition) > DRAG_POSITION_EPSILON;
    target.isDragging = false;
    if (wasDragging && moved) {
      target.settleSoftDeformForDrop();
      target.beginDrop();
    } else if (wasDragging) {
      // A long click without movement is still a click. Clear the dormant
      // deform state instead of releasing it into a visible rebound.
      target.settleSoftDeformForDrop();
    }
    this.suppressClick = true;
    this.pointerId = null;
    this.draggedTarget = null;
    this.canvas.classList.remove('dragging-appliance');
    try {
      this.canvas.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture can already be released when the pointer leaves the window.
    }
  };

  private readonly onPointerCancel = (event: PointerEvent) => {
    if (event.pointerId !== this.pointerId) return;
    event.stopImmediatePropagation();
    window.clearTimeout(this.dragHoldTimer);
    this.dragHoldTimer = 0;
    if (this.draggedTarget) {
      this.draggedTarget.isDragging = false;
      this.draggedTarget.releaseSoftDeform();
    }
    this.pointerId = null;
    this.draggedTarget = null;
    this.canvas?.classList.remove('dragging-appliance');
  };

  private readonly onClickCapture = (event: MouseEvent) => {
    if (!this.suppressClick) return;
    this.suppressClick = false;
    event.preventDefault();
    event.stopImmediatePropagation();
  };

  private isAssignableTarget(target: ApplianceTarget): boolean {
    return target.root.visible
      && target.state === 'idle'
      && !target.isLifecycleTransitioning
      && !target.isConnecting;
  }

  private assignmentCandidates(color: number): ApplianceTarget[] {
    return this.targets.filter((target) => (
      target.accent === color
      && target.state === 'idle'
      && this.isAssignableTarget(target)
    ));
  }

  private syncRoutingRevision(): void {
    const targetSignature = this.targets.map((target) => [
      target.root.uuid,
      target.accent,
      target.root.visible ? 1 : 0,
      target.isLifecycleTransitioning ? 1 : 0,
      target.isConnecting ? 1 : 0,
    ].join(':')).join('|');
    const signature = `${[...this.requiredColors].join(',')}#${targetSignature}`;
    if (signature === this.routingStateSignature) return;
    this.routingStateSignature = signature;
    this.routingStateRevision += 1;
  }
}

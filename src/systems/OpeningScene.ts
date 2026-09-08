import * as THREE from 'three';
import { CooperativeYieldBudget } from '../core/CooperativeYield';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { ArrowDefinition } from '../puzzle/types';
import { createPlugHead, type PlugHead } from '../render/PlugParts';
import { PlugCableModel } from '../render/PlugCableModel';
import { addHullOutline } from '../style/outline';
import { PAL } from '../style/palette';
import { cel } from '../style/toon';
import { SEASON_MODES, type SeasonMode } from '../theme/SeasonProfiles';
import { createSakuraPetalGeometry, createSakuraPetalMaterial } from './PetalVisual';
import {
  createAutumnLeafGeometry,
  createFireflyGeometry,
  createSeasonParticleMaterial,
  createSummerLeafGeometry,
  createWinterSnowGeometry,
} from './SeasonParticleVisual';

const TRANSITION_DURATION = 0.9;
const UP = new THREE.Vector3(0, 1, 0);
const FORWARD = new THREE.Vector3(0, 0, 1);
const BUNDLE_VISUAL_RADIUS = 3.15;
const BUNDLE_BASE_SCALE = 0.88;
const OPENING_PETAL_COUNT = 22;
const PETAL_SPRING = 8.2;
const PETAL_DAMPING = 3.55;
// A collision is a soft nudge, not a fixed 19% squash. The spring handles the
// visible deformation over several frames so light contacts stay light.
const JELLY_SPRING = 45;
const JELLY_DAMPING = 7.6;

type OpeningCable = {
  model: PlugCableModel;
  threshold: number;
};

type IntroPetal = {
  mesh: THREE.Group;
  visuals: Record<SeasonMode, THREE.Mesh>;
  firefly: THREE.Mesh;
  season: SeasonMode;
  anchor: THREE.Vector3;
  velocity: THREE.Vector3;
  phase: number;
  size: number;
  burstVelocity: THREE.Vector3;
  fallCycle: number;
};

export const OPENING_CABLES: readonly ArrowDefinition[] = [
  {
    id: 'opening-red',
    color: PAL.red,
    lengthClass: 'long',
    exitDirection: '-Z',
    path: [[7, 6, 6], [6, 6, 6], [6, 3, 6], [3, 3, 6], [3, 3, 3]],
  },
  {
    id: 'opening-yellow',
    color: PAL.yellow,
    lengthClass: 'long',
    exitDirection: '+X',
    path: [[7, 7, 6], [5, 7, 6], [5, 4, 6], [3, 4, 6], [3, 4, 4], [4, 4, 4]],
  },
  {
    id: 'opening-teal',
    color: PAL.teal,
    lengthClass: 'long',
    exitDirection: '+Y',
    path: [[4, 6, 6], [4, 6, 3], [4, 3, 3], [4, 3, 4], [7, 3, 4], [7, 5, 4]],
  },
  {
    id: 'opening-blue',
    color: PAL.blue,
    lengthClass: 'medium',
    exitDirection: '-X',
    path: [[5, 6, 5], [7, 6, 5], [7, 7, 5], [7, 7, 4], [6, 7, 4]],
  },
  {
    id: 'opening-purple',
    color: PAL.purple,
    lengthClass: 'long',
    exitDirection: '-Y',
    path: [[3, 7, 6], [4, 7, 6], [4, 7, 3], [6, 7, 3], [6, 5, 3]],
  },
] as const;

export class OpeningScene {
  readonly root = new THREE.Group();
  private readonly bundleMotion = new THREE.Group();
  private readonly bundleJelly = new THREE.Group();
  private readonly bundle = new THREE.Group();
  private readonly socket = new THREE.Group();
  private readonly cables: OpeningCable[] = [];
  private readonly petals: IntroPetal[] = [];
  private readonly springPetalMaterials = [
    createSakuraPetalMaterial(PAL.petal, 0.82),
    createSakuraPetalMaterial(PAL.petalDeep, 0.76),
  ];
  private readonly summerLeafMaterial = createSeasonParticleMaterial(0x84ad91, 0);
  private readonly autumnLeafMaterial = createSeasonParticleMaterial(0xffffff, 0, false, true);
  private readonly winterSnowMaterial = createSeasonParticleMaterial(0xffffff, 0);
  private readonly fireflyMaterial = createSeasonParticleMaterial(0xffd86a, 0, true);
  private seasonWeights: Record<SeasonMode, number> = { spring: 1, summer: 0, autumn: 0, winter: 0 };
  private activeSeason: SeasonMode = 'spring';
  private seasonInitialized = false;
  private readonly heroPlug: PlugHead;
  private readonly socketNormal = new THREE.Vector3();
  private readonly plugStart = new THREE.Vector3();
  private readonly plugApproach = new THREE.Vector3();
  private readonly plugContact = new THREE.Vector3();
  private readonly plugStartQuaternion = new THREE.Quaternion();
  private readonly plugContactQuaternion = new THREE.Quaternion();
  private readonly cameraRight = new THREE.Vector3();
  private readonly cameraUp = new THREE.Vector3();
  private readonly plugDirection = new THREE.Vector3();
  private readonly bundleScreenPosition = new THREE.Vector2(0.69, 0.46);
  private readonly bundleScreenVelocity = new THREE.Vector2(0.044, 0.029);
  private readonly bundleRotationVelocity = new THREE.Vector3(0.11, 0.17, 0.075);
  private readonly projectedBundlePosition = new THREE.Vector3();
  private readonly previousBundlePosition = new THREE.Vector3();
  private readonly bundleLocalVelocity = new THREE.Vector3();
  private readonly impactVelocity = new THREE.Vector3();
  private readonly petalTarget = new THREE.Vector3();
  private readonly petalForce = new THREE.Vector3();
  private readonly petalRadial = new THREE.Vector3();
  private readonly jellyVelocity = new THREE.Vector3();
  private readonly rootStartPosition = new THREE.Vector3(1.12, 0.34, 0);
  private jellyTilt = 0;
  private jellyTiltVelocity = 0;
  private impactCount = 0;
  private petalMotion = 0;
  private petalsInitialized = false;
  private progress = 0.03;
  private targetProgress = 0.03;
  private transitionStarted = false;
  private transitionElapsed = 0;
  private burstTriggered = false;
  private finished = false;
  private preparePromise: Promise<void> | null = null;
  private disposed = false;

  constructor() {
    this.root.name = 'opening-scene';
    this.root.position.copy(this.rootStartPosition);
    this.bundleMotion.name = 'opening-bundle-motion';
    this.bundleJelly.name = 'opening-bundle-jelly';
    this.bundle.name = 'opening-cable-bundle';
    this.bundle.scale.setScalar(BUNDLE_BASE_SCALE);
    this.bundleMotion.add(this.bundleJelly);
    this.bundleJelly.add(this.bundle);
    this.root.add(this.bundleMotion);
    this.buildSocket();

    this.heroPlug = createPlugHead(PAL.blossomDeep, 1.55, false, 'flat-two-blade');
    this.heroPlug.root.name = 'opening-hero-plug';
    this.root.add(this.heroPlug.root);
    this.buildPetals();
  }

  prepareAsync(onProgress?: (progress: number, buildMs: number) => void): Promise<void> {
    if (this.preparePromise) return this.preparePromise;
    this.preparePromise = (async () => {
      const buildBudget = new CooperativeYieldBudget();
      for (let index = 0; index < OPENING_CABLES.length; index += 1) {
        if (this.disposed) return;
        const startedAt = performance.now();
        this.buildCable(index);
        onProgress?.((index + 1) / OPENING_CABLES.length, performance.now() - startedAt);
        await buildBudget.afterItem();
      }
    })();
    return this.preparePromise;
  }

  get transitionComplete(): boolean {
    return this.finished;
  }

  getSocketWorldPosition(target = new THREE.Vector3()): THREE.Vector3 {
    this.root.updateWorldMatrix(true, true);
    return this.socket.getWorldPosition(target);
  }

  getBundleWorldPosition(target = new THREE.Vector3()): THREE.Vector3 {
    this.bundleMotion.updateWorldMatrix(true, false);
    return this.bundleMotion.getWorldPosition(target);
  }

  getStateSummary(): {
    screenX: number;
    screenY: number;
    trailLength: number;
    petalMotion: number;
    impactCount: number;
    seasonWeights: Record<SeasonMode, number>;
    visibleSeasonLayers: SeasonMode[];
    summerFirefliesVisible: boolean;
    jellyScale: [number, number, number];
  } {
    return {
      screenX: this.bundleScreenPosition.x,
      screenY: this.bundleScreenPosition.y,
      trailLength: this.petals.length,
      petalMotion: this.petalMotion,
      impactCount: this.impactCount,
      seasonWeights: { ...this.seasonWeights },
      visibleSeasonLayers: SEASON_MODES.filter((mode) => this.petals.some((petal) => petal.season === mode)),
      summerFirefliesVisible: this.fireflyMaterial.opacity > 0.002,
      jellyScale: [
        this.bundleJelly.scale.x,
        this.bundleJelly.scale.y,
        this.bundleJelly.scale.z,
      ],
    };
  }

  setProgress(progress: number): void {
    this.targetProgress = Math.max(this.targetProgress, Math.min(1, progress));
  }

  setSeasonState(weights: Readonly<Record<SeasonMode, number>>, themeProgress: number): void {
    for (const mode of SEASON_MODES) this.seasonWeights[mode] = weights[mode];
    this.activeSeason = SEASON_MODES.reduce((best, mode) => (
      weights[mode] > weights[best] ? mode : best
    ), SEASON_MODES[0]);
    if (!this.seasonInitialized) {
      this.petals.forEach((petal) => { petal.season = this.activeSeason; });
      this.seasonInitialized = true;
    }
    const night = THREE.MathUtils.clamp(themeProgress, 0, 1);
    this.springPetalMaterials[0].opacity = 0.82;
    this.springPetalMaterials[1].opacity = 0.76;
    this.summerLeafMaterial.opacity = 0.78 * THREE.MathUtils.lerp(1, 0.35, night);
    this.autumnLeafMaterial.opacity = 0.84;
    this.winterSnowMaterial.opacity = 1;
    this.fireflyMaterial.opacity = 0;
    this.petals.forEach((petal) => {
      for (const mode of SEASON_MODES) petal.visuals[mode].visible = petal.season === mode;
      petal.firefly.visible = false;
    });
  }

  beginTransition(): void {
    if (this.transitionStarted) return;
    this.transitionStarted = true;
    this.transitionElapsed = 0;
  }

  reset(): void {
    this.root.visible = true;
    this.root.position.copy(this.rootStartPosition);
    this.root.scale.setScalar(1);
    this.transitionStarted = false;
    this.transitionElapsed = 0;
    this.burstTriggered = false;
    this.finished = false;
    this.bundleJelly.scale.set(1, 1, 1);
    this.bundleJelly.rotation.set(0, 0, 0);
    this.jellyVelocity.set(0, 0, 0);
    this.jellyTilt = 0;
    this.jellyTiltVelocity = 0;
    this.impactCount = 0;
    this.petalMotion = 0;
    this.petalsInitialized = false;
    this.petals.forEach((petal) => {
      petal.mesh.position.copy(petal.anchor);
      petal.velocity.set(0, 0, 0);
      petal.burstVelocity.set(0, 0, 0);
      petal.season = this.activeSeason;
      petal.fallCycle = Number.NaN;
      for (const mode of SEASON_MODES) petal.visuals[mode].visible = mode === petal.season;
      petal.firefly.visible = false;
    });
  }

  update(
    delta: number,
    elapsed: number,
    camera: THREE.PerspectiveCamera,
    transitionDelta = delta,
  ): void {
    this.progress = THREE.MathUtils.damp(this.progress, this.targetProgress, 5.5, delta);
    this.updateBundleMotion(delta, camera);
    this.updateBundleJelly(delta);
    this.updateSocketAndHeroPlug(camera);

    this.cables.forEach((entry, index) => {
      const reveal = THREE.MathUtils.smoothstep(this.progress, entry.threshold, entry.threshold + 0.19);
      const pulse = 1 + Math.sin(elapsed * 2 + index * 0.8) * 0.008 * reveal;
      entry.model.root.visible = reveal > 0.002;
      entry.model.root.scale.setScalar(Math.max(0.001, reveal * pulse));
    });

    this.updatePetals(delta, elapsed);
    if (!this.transitionStarted) {
      const idle = Math.sin(elapsed * 1.55) * 0.025;
      this.heroPlug.root.position.copy(this.plugStart).addScaledVector(UP, idle);
      return;
    }

    // Keep the authored transition duration in wall-clock time when software
    // WebGL renders at very low frame rates. The normal motion simulation still
    // uses the bounded frame delta so cable and petal physics cannot jump.
    this.transitionElapsed += transitionDelta;
    const transition = Math.min(1, this.transitionElapsed / TRANSITION_DURATION);
    const insert = 1 - (1 - transition) ** 3;
    const inverse = 1 - insert;
    this.heroPlug.root.position
      .copy(this.plugStart).multiplyScalar(inverse * inverse)
      .addScaledVector(this.plugApproach, 2 * inverse * insert)
      .addScaledVector(this.plugContact, insert * insert);
    this.heroPlug.root.quaternion.slerpQuaternions(
      this.plugStartQuaternion,
      this.plugContactQuaternion,
      THREE.MathUtils.smoothstep(insert, 0.18, 0.88),
    );
    if (transition > 0.56 && !this.burstTriggered) {
      this.burstTriggered = true;
      const burstOrigin = this.socket.position.clone().addScaledVector(this.socketNormal, 0.22);
      this.petals.forEach((petal, index) => {
        const angle = index / this.petals.length * Math.PI * 2;
        petal.mesh.position.copy(burstOrigin);
        petal.burstVelocity.set(
          Math.cos(angle) * (1.8 + index % 3 * 0.24),
          1.3 + index % 4 * 0.35,
          Math.sin(angle) * (1.8 + index % 2 * 0.3),
        );
      });
    }

    if (transition >= 1) this.finished = true;
  }

  dispose(): void {
    this.disposed = true;
    this.cables.forEach((entry) => entry.model.dispose());
    this.heroPlug.dispose();
    this.root.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => material.dispose());
    });
    this.root.removeFromParent();
  }

  private buildCable(index: number): void {
    const plugStyles = [
      'round-two-pin',
      'usb-c',
      'three-pin',
      'dc-barrel',
      'grounded-round',
    ] as const;
    const definition = OPENING_CABLES[index];
    const model = new PlugCableModel(definition, plugStyles[index]);
    model.root.visible = false;
    model.root.scale.setScalar(0.001);
    this.bundle.add(model.root);
    this.cables.push({ model, threshold: 0.08 + index * 0.12 });
  }

  private buildSocket(): void {
    const panel = new THREE.Mesh(
      new RoundedBoxGeometry(1.25, 1.62, 0.28, 3, 0.15),
      cel({ color: PAL.paper, bands: 3, tint: PAL.platformShade }),
    );
    panel.name = 'opening-socket-panel';
    panel.castShadow = true;
    addHullOutline(panel, 0.006);
    this.socket.add(panel);

    const inset = new THREE.Mesh(
      new RoundedBoxGeometry(0.92, 1.22, 0.13, 3, 0.13),
      cel({ color: PAL.blossomLight, bands: 3, tint: PAL.blossomDeep }),
    );
    inset.name = 'opening-socket-face';
    inset.position.z = 0.185;
    addHullOutline(inset, 0.0045);
    this.socket.add(inset);

    const slotMaterial = cel({ color: PAL.ink, bands: 2, tint: PAL.inkSoft });
    for (const x of [-0.18, 0.18]) {
      const slot = new THREE.Mesh(new RoundedBoxGeometry(0.095, 0.34, 0.07, 2, 0.035), slotMaterial);
      slot.position.set(x, 0.1, 0.29);
      this.socket.add(slot);
    }
    const earth = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.07, 14), slotMaterial);
    earth.rotation.x = Math.PI * 0.5;
    earth.position.set(0, -0.34, 0.29);
    this.socket.add(earth);

    this.socket.position.set(3.35, 0.38, 1.32);
    this.socket.scale.setScalar(0.72);
    this.root.add(this.socket);
  }

  private updateBundleMotion(delta: number, camera: THREE.PerspectiveCamera): void {
    const distance = Math.max(1, camera.position.length() - 2.2);
    const halfViewHeight = Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * distance;
    const radiusY = THREE.MathUtils.clamp(BUNDLE_VISUAL_RADIUS / (halfViewHeight * 2), 0.13, 0.24);
    const radiusX = THREE.MathUtils.clamp(radiusY / Math.max(0.8, camera.aspect), 0.075, 0.2);
    const bounds = {
      minX: Math.max(0.035, radiusX * 0.78),
      maxX: Math.min(0.965, 1 - radiusX * 0.78),
      minY: Math.max(0.045, radiusY * 0.76),
      maxY: Math.min(0.955, 1 - radiusY * 0.76),
    };
    this.impactVelocity.copy(this.bundleLocalVelocity);
    if (!this.transitionStarted) {
      this.bundleScreenPosition.addScaledVector(this.bundleScreenVelocity, delta);
      let bouncedX = false;
      let bouncedY = false;
      if (
        this.bundleScreenPosition.x <= bounds.minX ||
        this.bundleScreenPosition.x >= bounds.maxX
      ) {
        this.bundleScreenPosition.x = THREE.MathUtils.clamp(
          this.bundleScreenPosition.x,
          bounds.minX,
          bounds.maxX,
        );
        this.bundleScreenVelocity.x *= -1;
        bouncedX = true;
      }
      if (
        this.bundleScreenPosition.y <= bounds.minY ||
        this.bundleScreenPosition.y >= bounds.maxY
      ) {
        this.bundleScreenPosition.y = THREE.MathUtils.clamp(
          this.bundleScreenPosition.y,
          bounds.minY,
          bounds.maxY,
        );
        this.bundleScreenVelocity.y *= -1;
        bouncedY = true;
      }
      if (bouncedX || bouncedY) {
        this.bundleRotationVelocity.x *= -0.96;
        this.bundleRotationVelocity.z += this.bundleScreenVelocity.x * 0.28;
        this.bundleScreenVelocity.x *= 0.92;
        this.bundleScreenVelocity.y *= 0.92;
        this.triggerBundleImpact(bouncedX, bouncedY);
      }

      // Let the bundle breathe back to its normal drift after the impact. A
      // damped recovery reads as inertia instead of a scripted snap.
      const cruiseX = Math.sign(this.bundleScreenVelocity.x || 1) * 0.044;
      const cruiseY = Math.sign(this.bundleScreenVelocity.y || 1) * 0.029;
      this.bundleScreenVelocity.x = THREE.MathUtils.damp(this.bundleScreenVelocity.x, cruiseX, 1.45, delta);
      this.bundleScreenVelocity.y = THREE.MathUtils.damp(this.bundleScreenVelocity.y, cruiseY, 1.45, delta);
    }

    this.bundle.rotation.x += this.bundleRotationVelocity.x * delta;
    this.bundle.rotation.y += this.bundleRotationVelocity.y * delta;
    this.bundle.rotation.z += this.bundleRotationVelocity.z * delta;
    camera.updateMatrixWorld(true);
    this.projectedBundlePosition
      .set(
        this.bundleScreenPosition.x * 2 - 1,
        1 - this.bundleScreenPosition.y * 2,
        0,
      )
      .unproject(camera)
      .sub(camera.position)
      .normalize()
      .multiplyScalar(Math.max(8, camera.position.length() - 2.2))
      .add(camera.position);
    this.root.updateWorldMatrix(true, false);
    this.root.worldToLocal(this.projectedBundlePosition);
    if (this.petalsInitialized) {
      this.bundleLocalVelocity
        .copy(this.projectedBundlePosition)
        .sub(this.previousBundlePosition)
        .multiplyScalar(1 / Math.max(delta, 1 / 240));
    } else {
      this.bundleLocalVelocity.set(0, 0, 0);
    }
    this.previousBundlePosition.copy(this.projectedBundlePosition);
    this.bundleMotion.position.copy(this.projectedBundlePosition);
  }

  private triggerBundleImpact(bouncedX: boolean, bouncedY: boolean): void {
    this.impactCount += 1;
    const driftSpeed = Math.hypot(this.bundleScreenVelocity.x, this.bundleScreenVelocity.y);
    const contactSpeed = THREE.MathUtils.clamp(driftSpeed * 9, 0.38, 0.62);
    if (bouncedX) {
      this.jellyVelocity.x -= contactSpeed;
      this.jellyVelocity.y += contactSpeed * 0.26;
      this.jellyVelocity.z += contactSpeed * 0.16;
      this.jellyTiltVelocity += Math.sign(this.bundleScreenVelocity.y || 1) * contactSpeed * 0.5;
    }
    if (bouncedY) {
      this.jellyVelocity.y -= contactSpeed;
      this.jellyVelocity.x += contactSpeed * 0.26;
      this.jellyVelocity.z += contactSpeed * 0.16;
      this.jellyTiltVelocity -= Math.sign(this.bundleScreenVelocity.x || 1) * contactSpeed * 0.5;
    }
    this.petals.forEach((petal, index) => {
      petal.velocity.addScaledVector(this.impactVelocity, 0.16 + (index % 5) * 0.022);
    });
  }

  private updateBundleJelly(delta: number): void {
    for (const axis of ['x', 'y', 'z'] as const) {
      this.jellyVelocity[axis] += (1 - this.bundleJelly.scale[axis]) * JELLY_SPRING * delta;
      this.jellyVelocity[axis] *= Math.exp(-JELLY_DAMPING * delta);
      this.bundleJelly.scale[axis] = THREE.MathUtils.clamp(
        this.bundleJelly.scale[axis] + this.jellyVelocity[axis] * delta,
        0.76,
        1.14,
      );
    }
    this.jellyTiltVelocity += -this.jellyTilt * 45 * delta;
    this.jellyTiltVelocity *= Math.exp(-8.2 * delta);
    this.jellyTilt += this.jellyTiltVelocity * delta;
    this.bundleJelly.rotation.z = this.jellyTilt;
  }

  private updateSocketAndHeroPlug(camera: THREE.PerspectiveCamera): void {
    this.socket.position.x = camera.aspect < 0.8 ? 0.2 : 3.35;
    this.socket.position.y = camera.aspect < 0.8 ? -2.12 : 0.38;
    this.socket.lookAt(camera.position);
    this.socket.rotateY(-0.46);
    this.socketNormal.copy(FORWARD).applyQuaternion(this.socket.quaternion).normalize();
    this.cameraRight.set(1, 0, 0).applyQuaternion(camera.quaternion);
    this.cameraUp.set(0, 1, 0).applyQuaternion(camera.quaternion);
    this.plugContact.copy(this.socket.position).addScaledVector(this.socketNormal, 1.08);
    this.plugApproach
      .copy(this.socket.position)
      .addScaledVector(this.socketNormal, 1.58)
      .addScaledVector(this.cameraRight, -0.12);
    this.plugStart
      .copy(this.socket.position)
      .addScaledVector(this.socketNormal, 2.08)
      .addScaledVector(this.cameraRight, -0.92)
      .addScaledVector(this.cameraUp, 0.18);
    this.plugDirection.copy(this.plugContact).sub(this.plugStart).normalize();
    this.plugStartQuaternion.setFromUnitVectors(UP, this.plugDirection);
    this.plugContactQuaternion.setFromUnitVectors(UP, this.socketNormal.clone().negate());
    if (!this.transitionStarted) this.heroPlug.root.quaternion.copy(this.plugStartQuaternion);
  }

  private buildPetals(): void {
    const geometries = {
      spring: createSakuraPetalGeometry(1.22),
      summer: createSummerLeafGeometry(1.18),
      autumn: createAutumnLeafGeometry(1.16),
      winter: createWinterSnowGeometry(1.15),
      firefly: createFireflyGeometry(1.18),
    };
    for (let index = 0; index < OPENING_PETAL_COUNT; index += 1) {
      const progress = index / OPENING_PETAL_COUNT;
      const angle = progress * Math.PI * 2 + Math.sin(index * 2.17) * 0.19;
      const phase = index * 0.73;
      const beltRadius = 2.72 + Math.sin(index * 1.91) * 0.38;
      const anchor = new THREE.Vector3(
        Math.cos(angle) * beltRadius,
        Math.sin(angle * 2 + 0.45) * 0.78 + Math.sin(index * 0.91) * 0.32,
        Math.sin(angle) * (1.7 + Math.cos(index * 1.37) * 0.22),
      );
      const mesh = new THREE.Group();
      mesh.name = 'opening-season-particle';
      const visuals: Record<SeasonMode, THREE.Mesh> = {
        spring: new THREE.Mesh(geometries.spring, this.springPetalMaterials[index % this.springPetalMaterials.length]),
        summer: new THREE.Mesh(geometries.summer, this.summerLeafMaterial),
        autumn: new THREE.Mesh(geometries.autumn, this.autumnLeafMaterial),
        winter: new THREE.Mesh(geometries.winter, this.winterSnowMaterial),
      };
      const firefly = new THREE.Mesh(geometries.firefly, this.fireflyMaterial);
      firefly.position.set(0.08, 0.06, 0.015);
      firefly.scale.setScalar(0.8 + (index % 4) * 0.1);
      for (const mode of SEASON_MODES) {
        visuals[mode].name = `opening-${mode}-particle`;
        visuals[mode].visible = this.seasonWeights[mode] > 0.002;
        mesh.add(visuals[mode]);
      }
      visuals.summer.scale.set(0.72 + (index % 3) * 0.055, 0.9 + (index % 4) * 0.025, 1);
      visuals.autumn.scale.set(0.76 + (index % 4) * 0.045, 0.75 + (index % 5) * 0.035, 1);
      visuals.winter.scale.set(0.94 + (index % 4) * 0.06, 0.94 + (index % 3) * 0.055, 1);
      firefly.name = 'opening-summer-night-firefly';
      firefly.visible = false;
      mesh.add(firefly);
      mesh.position.copy(anchor);
      mesh.rotation.set(phase * 0.4, phase * 0.7, phase);
      this.root.add(mesh);
      this.petals.push({
        mesh,
        visuals,
        firefly,
        season: this.activeSeason,
        anchor,
        velocity: new THREE.Vector3(),
        phase,
        size: 0.78 + (index % 7) * 0.055,
        burstVelocity: new THREE.Vector3(),
        fallCycle: Number.NaN,
      });
    }
  }

  private updatePetals(delta: number, elapsed: number): void {
    let motion = 0;
    for (let index = 0; index < this.petals.length; index += 1) {
      const petal = this.petals[index];
      if (petal.burstVelocity.lengthSq() > 0.001) {
        petal.burstVelocity.y -= delta * 2.1;
        petal.mesh.position.addScaledVector(petal.burstVelocity, delta);
        petal.mesh.rotation.x += delta * 7;
        petal.mesh.rotation.z += delta * 5;
        motion += petal.burstVelocity.length();
        continue;
      }
      const orbit = elapsed * 0.2 + Math.sin(elapsed * 0.31 + petal.phase) * 0.08;
      const breathe = 1 + Math.sin(elapsed * 0.82 + petal.phase) * 0.045;
      // Each petal follows its own slow fall cycle and sideways sway before the
      // spring pulls it back into the loose belt. This keeps the wreath from
      // reading as a rigid decoration while preserving impact inertia.
      const fallCycle = ((elapsed * (0.09 + index % 5 * 0.011) + petal.phase) % 1) - 0.5;
      const lateralSway = Math.sin(elapsed * (0.72 + index % 4 * 0.13) + petal.phase) * 0.24;
      this.petalTarget
        .copy(petal.anchor)
        .multiplyScalar(breathe)
        .applyAxisAngle(UP, orbit)
        .applyAxisAngle(FORWARD, Math.sin(elapsed * 0.24 + petal.phase) * 0.09)
        .add(this.bundleMotion.position)
        .addScaledVector(UP, fallCycle * 0.62)
        .addScaledVector(this.petalRadial.set(Math.cos(petal.phase), 0, Math.sin(petal.phase)), lateralSway);
      const fallRate = 0.09 + (index % 5) * 0.011;
      const fallCycleIndex = Math.floor(elapsed * fallRate + petal.phase);
      if (!Number.isFinite(petal.fallCycle)) {
        petal.fallCycle = fallCycleIndex;
      } else if (fallCycleIndex !== petal.fallCycle) {
        // Existing particles keep their birth appearance until they complete
        // their own fall cycle. Only the respawn point adopts the new season,
        // making the turnover staggered and natural instead of a global morph.
        petal.fallCycle = fallCycleIndex;
        petal.season = this.activeSeason;
        for (const mode of SEASON_MODES) petal.visuals[mode].visible = mode === petal.season;
        petal.firefly.visible = false;
      }
      if (!this.petalsInitialized) {
        petal.mesh.position.copy(this.petalTarget);
        petal.velocity.copy(this.bundleLocalVelocity);
      }
      this.petalForce
        .copy(this.petalTarget)
        .sub(petal.mesh.position)
        .multiplyScalar(PETAL_SPRING)
        .addScaledVector(petal.velocity, -PETAL_DAMPING);
      this.petalRadial.copy(petal.mesh.position).sub(this.bundleMotion.position);
      const shellDistance = this.petalRadial.length();
      if (shellDistance < 2.15 && shellDistance > 0.001) {
        this.petalForce.addScaledVector(this.petalRadial, (2.15 - shellDistance) * 2.8 / shellDistance);
      } else if (shellDistance > 4.1) {
        this.petalForce.addScaledVector(this.petalRadial, -(shellDistance - 4.1) * 3.2 / shellDistance);
      }
      petal.velocity.addScaledVector(this.petalForce, delta);
      petal.mesh.position.addScaledVector(petal.velocity, delta);
      motion += petal.velocity.length();
      const pulseScale = petal.size * (0.92 + Math.sin(elapsed * 1.3 + petal.phase) * 0.1);
      petal.mesh.scale.setScalar(pulseScale);
      petal.mesh.rotation.x += delta * (0.7 + index % 4 * 0.16);
      petal.mesh.rotation.y += delta * (0.45 + index % 5 * 0.12);
      petal.mesh.rotation.z += delta * (0.32 + index % 3 * 0.15);
    }
    this.petalsInitialized = true;
    this.petalMotion = motion / Math.max(1, this.petals.length);
  }
}

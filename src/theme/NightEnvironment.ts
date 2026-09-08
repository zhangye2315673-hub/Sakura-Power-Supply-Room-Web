import * as THREE from 'three';
import type { SkyRig } from '../style/sky';
import type { NightQualityTier } from './ThemeController';
import { SEASON_PROFILES, type SeasonEnvironmentState } from './SeasonProfiles';

export type LanternSnapshot = {
  position: [number, number];
  worldPosition: [number, number, number];
  target: [number, number];
  intensity: number;
  targetIntensity: number;
  inApplianceZone: boolean;
  returning: boolean;
};

type LightingRig = {
  sun: THREE.DirectionalLight;
  fill: THREE.DirectionalLight;
  bounce: THREE.DirectionalLight;
  hemi: THREE.HemisphereLight;
};

const EXPLORATION_FOG = new THREE.Color(0x070914);
const EXPLORATION_AMBIENT = 0.015;

export class NightEnvironment {
  private progress = 0;
  private explorationProgress = 0;
  private quality: NightQualityTier = 'high';
  private readonly lanternPoint = new THREE.PointLight(0xffd7b0, 0, 18, 1.45);
  private readonly lanternNdc = new THREE.Vector2(0, 0);
  private readonly lanternTarget = new THREE.Vector2(0, 0);
  private readonly lanternCenter = new THREE.Vector2(0, 0);
  // Start dark and let the first real frame ease the cursor lantern in. The
  // previous 0.65 default combined with the centered NDC origin on refresh
  // and rendered a one-frame oval flash in the middle of the homepage.
  private lanternIntensity = 0;
  private lanternTargetIntensity = 0;
  private lastElapsed = 0;
  private pointerActive = false;
  private touchTarget = false;
  private readonly touchHint = document.createElement('div');
  private pointerOverUi = false;
  private inApplianceZone = false;
  private reducedMotion = false;
  private environment: Readonly<SeasonEnvironmentState> = SEASON_PROFILES.spring.day;
  private readonly raycaster = new THREE.Raycaster();
  private readonly lanternPlane = new THREE.Plane();
  private readonly lanternWorld = new THREE.Vector3();
  private readonly cameraDirection = new THREE.Vector3();
  private readonly lanternPlanePoint = new THREE.Vector3();
  private readonly baseEnvironmentIntensity: number;
  private readonly baseFogNear: number;
  private readonly baseFogFar: number;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly scene: THREE.Scene,
    private readonly camera: THREE.PerspectiveCamera,
    private readonly sky: SkyRig,
    private readonly lights: LightingRig,
  ) {
    const fog = scene.fog instanceof THREE.Fog ? scene.fog : null;
    this.baseEnvironmentIntensity = scene.environmentIntensity;
    this.baseFogNear = fog?.near ?? 30;
    this.baseFogFar = fog?.far ?? 82;
    this.touchHint.className = 'exploration-touch-hint';
    this.touchHint.textContent = '单指提灯 · 双指拖动旋转 / 捏合缩放 · 轻点抽线';
    document.body.append(this.touchHint);
    this.lanternPoint.name = 'night-lantern-point-light';
    this.lanternPoint.castShadow = false;
    scene.add(this.lanternPoint);
    canvas.addEventListener('pointermove', this.onPointerMove, { passive: true });
    canvas.addEventListener('pointerdown', this.onPointerMove, { passive: true });
    canvas.addEventListener('pointerleave', this.onPointerLeave, { passive: true });
    canvas.addEventListener('pointerup', this.onPointerUp, { passive: true });
    window.addEventListener('pointermove', this.onWindowPointerMove, { passive: true });
  }

  setThemeProgress(progress: number): void {
    this.progress = THREE.MathUtils.clamp(progress, 0, 1);
    this.applyEnvironmentLighting();
  }

  setSeasonEnvironment(environment: Readonly<SeasonEnvironmentState>): void {
    this.environment = environment;
    this.applyEnvironmentLighting();
    this.sky.setSeasonEnvironment(environment);
  }

  setExplorationProgress(progress: number): void {
    this.explorationProgress = THREE.MathUtils.clamp(progress, 0, 1);
    this.applyEnvironmentLighting();
    this.sky.setExplorationProgress(this.explorationProgress);
  }

  private applyEnvironmentLighting(): void {
    const fog = this.scene.fog instanceof THREE.Fog ? this.scene.fog : null;
    if (fog) {
      fog.color.copy(this.environment.fog);
      fog.color.lerp(EXPLORATION_FOG, this.explorationProgress * this.progress);
      fog.near = this.baseFogNear * this.environment.fogNearScale;
      fog.far = this.baseFogFar * this.environment.fogFarScale;
    }
    this.lights.sun.color.copy(this.environment.sun);
    this.lights.fill.color.copy(this.environment.fill);
    this.lights.bounce.color.copy(this.environment.bounce);
    this.lights.hemi.color.copy(this.environment.hemiSky);
    this.lights.hemi.groundColor.copy(this.environment.hemiGround);
    const ambientScale = THREE.MathUtils.lerp(1, EXPLORATION_AMBIENT, this.explorationProgress * this.progress);
    // The studio environment must fade with night too, not only exploration.
    this.scene.environmentIntensity = this.baseEnvironmentIntensity * THREE.MathUtils.lerp(1, 0.22, this.progress) * ambientScale;
    this.lights.sun.intensity = this.environment.sunIntensity * ambientScale;
    this.lights.fill.intensity = this.environment.fillIntensity * ambientScale;
    this.lights.bounce.intensity = this.environment.bounceIntensity * ambientScale;
    this.lights.hemi.intensity = this.environment.hemiIntensity * ambientScale;
    this.sky.setThemeProgress(this.progress);
  }

  setQualityTier(tier: NightQualityTier): void {
    this.quality = tier;
    this.sky.setQualityTier(tier);
  }

  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
    this.sky.setReducedMotion(reduced);
  }

  update(delta: number, elapsed: number, options: {
    opening: boolean;
    galleryOpen: boolean;
    openingFocus?: THREE.Vector3;
  }): void {
    // The main loop deliberately clamps simulation delta to 50 ms. Cursor
    // lighting is presentation state, though: on a slow WebGL frame it should
    // still catch up to the real pointer instead of needing several seconds.
    // Cap the wall-clock step so tab resumes cannot create a hard snap.
    const wallDelta = this.lastElapsed > 0 ? elapsed - this.lastElapsed : delta;
    this.lastElapsed = elapsed;
    const presentationDelta = THREE.MathUtils.clamp(
      Number.isFinite(wallDelta) ? wallDelta : delta,
      0,
      0.25,
    );
    const mobileExploration = this.explorationProgress > 0 && !options.opening &&
      (this.touchTarget || window.matchMedia('(pointer: coarse)').matches);
    const forceCenter = options.galleryOpen || (!mobileExploration && (this.pointerOverUi || !this.pointerActive));
    const desired = forceCenter ? this.lanternCenter : this.lanternTarget;
    const response = this.reducedMotion ? 1 : 1 - Math.exp(-presentationDelta / 0.105);
    this.lanternNdc.lerp(desired, response);
    // No cursor interaction means there is no authored lantern source yet.
    // Keeping the old centered fallback here made refreshes paint a very
    // obvious oval in the middle of the homepage after the first dark frame.
    // The light should only exist once the pointer has supplied a real target.
    const desiredIntensity = options.galleryOpen
      ? 0
      : forceCenter ? 0 : options.opening ? 1.04 : 1;
    this.lanternTargetIntensity = desiredIntensity;
    const intensityResponse = 1 - Math.exp(-presentationDelta / (forceCenter ? 0.4 : 0.12));
    this.lanternIntensity = THREE.MathUtils.lerp(
      this.lanternIntensity,
      this.lanternTargetIntensity,
      intensityResponse,
    );

    this.camera.getWorldDirection(this.cameraDirection);
    this.lanternPlane.setFromNormalAndCoplanarPoint(this.cameraDirection, this.lanternPlanePoint.set(0, 0, 0));
    this.raycaster.setFromCamera(this.lanternNdc, this.camera);
    if (!this.raycaster.ray.intersectPlane(this.lanternPlane, this.lanternWorld)) {
      this.lanternWorld.set(0, 0, 0);
    }
    if (options.opening && options.openingFocus) {
      // The opening bundle floats across a much shallower plane than the game
      // board. Put the real light at that depth while keeping its X/Y aligned
      // with the cursor, so plugs and cable turns actually catch the lantern.
      const focusDepth = options.openingFocus.clone().sub(this.camera.position).dot(this.cameraDirection);
      this.raycaster.ray.at(Math.max(1, focusDepth), this.lanternWorld);
    }
    this.lanternWorld.addScaledVector(this.cameraDirection, -2.2);
    this.lanternPoint.position.copy(this.lanternWorld);
    const shimmer = this.reducedMotion ? 1 : 0.985 + Math.sin(elapsed * 2.3) * 0.015;
    const openingModelBoost = options.opening ? 1.08 : 1;
    this.lanternPoint.intensity = this.progress * this.lanternIntensity * 3.1 * openingModelBoost * shimmer;
    this.lanternPoint.distance = this.quality === 'minimal' ? 18 : 26;
    this.sky.updateTheme(elapsed);
  }

  get lantern(): LanternSnapshot {
    return {
      position: [this.lanternNdc.x, this.lanternNdc.y],
      worldPosition: [this.lanternWorld.x, this.lanternWorld.y, this.lanternWorld.z],
      target: [this.lanternTarget.x, this.lanternTarget.y],
      intensity: this.lanternIntensity,
      targetIntensity: this.lanternTargetIntensity,
      inApplianceZone: this.inApplianceZone,
      returning: this.explorationProgress > 0 && (this.touchTarget || window.matchMedia('(pointer: coarse)').matches) ? false : !this.pointerActive || this.pointerOverUi,
    };
  }

  dispose(): void {
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerdown', this.onPointerMove);
    this.canvas.removeEventListener('pointerleave', this.onPointerLeave);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointermove', this.onWindowPointerMove);
    this.touchHint.remove();
    this.lanternPoint.removeFromParent();
    this.lanternPoint.dispose();
  }

  private readonly onPointerMove = (event: PointerEvent) => {
    this.updatePointerTarget(event);
  };

  private updatePointerTarget(event: PointerEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    this.touchTarget = event.pointerType === 'touch';
    const mobileOffset = event.pointerType === 'touch' ? 56 : 0;
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - mobileOffset - rect.top) / rect.height;
    this.lanternTarget.set(x * 2 - 1, -(y * 2 - 1));
    this.pointerActive = true;
    this.pointerOverUi = false;
    this.inApplianceZone = x < 0.24 || x > 0.76;
  }

  private readonly onPointerLeave = () => {
    if (!(this.touchTarget && this.explorationProgress > 0)) this.pointerActive = false;
  };

  private readonly onPointerUp = (event: PointerEvent) => {
    if (event.pointerType === 'touch' && this.explorationProgress === 0) this.pointerActive = false;
  };

  private readonly onWindowPointerMove = (event: PointerEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const startSurface = target.closest('#start-screen');
    const interactive = target.closest('button, a, input, select, textarea, [role="button"]');
    if (startSurface && !interactive) {
      this.updatePointerTarget(event);
      return;
    }
    this.pointerOverUi = target.closest('#game-canvas') === null;
  };
}

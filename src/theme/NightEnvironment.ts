import * as THREE from 'three';
import type { ApplianceTarget } from '../systems/ApplianceScene';
import type { SkyRig } from '../style/sky';
import type { NightQualityTier } from './ThemeController';

export type LanternSnapshot = {
  position: [number, number];
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

const DAY = {
  fog: new THREE.Color(0xd4e8fa),
  sun: new THREE.Color(0xfff1d2),
  fill: new THREE.Color(0xaab4ec),
  bounce: new THREE.Color(0xd8cbe8),
  hemiSky: new THREE.Color(0xd4e8fa),
  hemiGround: new THREE.Color(0x9d89aa),
};

const NIGHT = {
  fog: new THREE.Color(0x202641),
  sun: new THREE.Color(0xd6ddf4),
  fill: new THREE.Color(0xaeb8d5),
  bounce: new THREE.Color(0xc4a8bd),
  hemiSky: new THREE.Color(0xb5c2dc),
  hemiGround: new THREE.Color(0x77788e),
};

export class NightEnvironment {
  private progress = 0;
  private quality: NightQualityTier = 'high';
  private readonly lanternPoint = new THREE.PointLight(0xffd7b0, 0, 18, 1.45);
  private readonly lanternNdc = new THREE.Vector2(0, 0);
  private readonly lanternTarget = new THREE.Vector2(0, 0);
  private readonly lanternCenter = new THREE.Vector2(0, 0);
  private lanternIntensity = 0.65;
  private lanternTargetIntensity = 0.65;
  private pointerActive = false;
  private pointerOverUi = false;
  private inApplianceZone = false;
  private reducedMotion = false;
  private readonly raycaster = new THREE.Raycaster();
  private readonly lanternPlane = new THREE.Plane();
  private readonly lanternWorld = new THREE.Vector3();
  private readonly cameraDirection = new THREE.Vector3();
  private readonly lanternPlanePoint = new THREE.Vector3();
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
    this.baseFogNear = fog?.near ?? 30;
    this.baseFogFar = fog?.far ?? 82;
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
    const fog = this.scene.fog instanceof THREE.Fog ? this.scene.fog : null;
    if (fog) {
      fog.color.copy(DAY.fog).lerp(NIGHT.fog, this.progress);
      fog.near = THREE.MathUtils.lerp(this.baseFogNear, this.baseFogNear * 0.88, this.progress);
      fog.far = THREE.MathUtils.lerp(this.baseFogFar, this.baseFogFar * 0.88, this.progress);
    }
    this.lights.sun.color.copy(DAY.sun).lerp(NIGHT.sun, this.progress);
    this.lights.fill.color.copy(DAY.fill).lerp(NIGHT.fill, this.progress);
    this.lights.bounce.color.copy(DAY.bounce).lerp(NIGHT.bounce, this.progress);
    this.lights.hemi.color.copy(DAY.hemiSky).lerp(NIGHT.hemiSky, this.progress);
    this.lights.hemi.groundColor.copy(DAY.hemiGround).lerp(NIGHT.hemiGround, this.progress);
    this.lights.sun.intensity = THREE.MathUtils.lerp(2.25, 0.82, this.progress);
    this.lights.fill.intensity = THREE.MathUtils.lerp(1.08, 0.62, this.progress);
    this.lights.bounce.intensity = THREE.MathUtils.lerp(0.34, 0.28, this.progress);
    this.lights.hemi.intensity = THREE.MathUtils.lerp(1.12, 0.68, this.progress);
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
    appliances: readonly ApplianceTarget[];
    openingFocus?: THREE.Vector3;
  }): void {
    const forceCenter = options.galleryOpen || this.pointerOverUi || !this.pointerActive;
    const desired = forceCenter ? this.lanternCenter : this.lanternTarget;
    const response = this.reducedMotion ? 1 : 1 - Math.exp(-delta / 0.105);
    this.lanternNdc.lerp(desired, response);
    const desiredIntensity = options.galleryOpen
      ? 0
      : forceCenter ? 0.68 : this.inApplianceZone ? 0.82 : options.opening ? 1.04 : 1;
    this.lanternTargetIntensity = desiredIntensity;
    const intensityResponse = 1 - Math.exp(-delta / (forceCenter ? 0.4 : 0.12));
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
    if (this.inApplianceZone && !forceCenter) {
      const pointerX = this.lanternNdc.x * 0.5 + 0.5;
      const pointerY = 0.5 - this.lanternNdc.y * 0.5;
      const nearest = options.appliances.reduce<{ target: ApplianceTarget; distance: number } | null>(
        (best, target) => {
          const distance = Math.hypot(
            target.screenPosition.x - pointerX,
            target.screenPosition.y - pointerY,
          );
          return best === null || distance < best.distance ? { target, distance } : best;
        },
        null,
      );
      if (nearest && nearest.distance < 0.24) nearest.target.root.getWorldPosition(this.lanternWorld);
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
      target: [this.lanternTarget.x, this.lanternTarget.y],
      intensity: this.lanternIntensity,
      targetIntensity: this.lanternTargetIntensity,
      inApplianceZone: this.inApplianceZone,
      returning: !this.pointerActive || this.pointerOverUi,
    };
  }

  dispose(): void {
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerdown', this.onPointerMove);
    this.canvas.removeEventListener('pointerleave', this.onPointerLeave);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointermove', this.onWindowPointerMove);
    this.lanternPoint.removeFromParent();
    this.lanternPoint.dispose();
  }

  private readonly onPointerMove = (event: PointerEvent) => {
    this.updatePointerTarget(event);
  };

  private updatePointerTarget(event: PointerEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const mobileOffset = event.pointerType === 'touch' ? 56 : 0;
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - mobileOffset - rect.top) / rect.height;
    this.lanternTarget.set(x * 2 - 1, -(y * 2 - 1));
    this.pointerActive = true;
    this.pointerOverUi = false;
    this.inApplianceZone = x < 0.24 || x > 0.76;
  }

  private readonly onPointerLeave = () => {
    this.pointerActive = false;
  };

  private readonly onPointerUp = (event: PointerEvent) => {
    if (event.pointerType === 'touch') this.pointerActive = false;
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

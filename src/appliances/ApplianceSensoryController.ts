import * as THREE from 'three';
import type { AppliancePerformanceTarget } from '../systems/AppliancePerformanceSystem';
import type { ApplianceKind, ApplianceState } from '../systems/ApplianceCatalog';
import { APPLIANCE_SENSORY_PROFILES } from './ApplianceSensoryProfiles';

type MaterialBaseline = {
  color?: THREE.Color;
  emissive?: THREE.Color;
  emissiveIntensity?: number;
  opacity?: number;
};

type TargetState = {
  materials: Array<{
    objectName: string;
    material: THREE.Material;
    baseline: MaterialBaseline;
    hinted: boolean;
    status: boolean;
    eligibleNeonAccent: boolean;
    neonAccent: boolean;
    neonColor?: THREE.Color;
    neonGain: number;
    poweredReveal: boolean;
    poweredRevealColor?: THREE.Color;
    poweredRevealApplied: boolean;
  }>;
  matchedNodes: string[];
  neonMaterialCount: number;
  neonIntensity: number;
  poweredReveal: number;
  poweredLight: THREE.PointLight | null;
  poweredLightColor: THREE.Color;
};

const NIGHT_NEON_DEFAULT = { intensity: 0.36, pulseRate: 1.45 } as const;
const NIGHT_NEON_OVERRIDES: Partial<Record<ApplianceKind, { intensity: number; pulseRate: number }>> = {
  radio: { intensity: 0.46, pulseRate: 1.7 },
  lamp: { intensity: 0.38, pulseRate: 1.35 },
  washer: { intensity: 0.42, pulseRate: 1.5 },
};

const NIGHT_NEON_START = 0.42;
const NIGHT_NEON_FULL = 0.9;
const NIGHT_NEON_TARGET_LUMINANCE = 0.5;
const NIGHT_NEON_MIN_GAIN = 0.42;
const NIGHT_NEON_MAX_GAIN = 1.8;
const EXPLORATION_NEON_BOOST = 1.76;
const EXPLORATION_POWERED_REVEAL_START = 0.06;
const EXPLORATION_POWERED_REVEAL_FULL = 0.92;
const EXPLORATION_POWERED_BODY_INTENSITY = 0.88;
const EXPLORATION_POWERED_ACCENT_MIX = 0.52;
const EXPLORATION_POWERED_LIGHT_INTENSITY = 1.25;
const EXPLORATION_POWERED_LIGHT_DISTANCE = 9.5;

function hueDistance(first: number, second: number): number {
  const distance = Math.abs(first - second);
  return Math.min(distance, 1 - distance);
}

function isAccentFamily(color: THREE.Color, accent: THREE.Color): boolean {
  const colorHsl = { h: 0, s: 0, l: 0 };
  const accentHsl = { h: 0, s: 0, l: 0 };
  color.getHSL(colorHsl);
  accent.getHSL(accentHsl);
  const colorChroma = Math.max(color.r, color.g, color.b) - Math.min(color.r, color.g, color.b);
  const accentChroma = Math.max(accent.r, accent.g, accent.b) - Math.min(accent.r, accent.g, accent.b);
  return colorChroma >= Math.max(0.14, accentChroma * 0.3)
    && colorHsl.s >= 0.2
    && colorHsl.l >= 0.16
    && colorHsl.l <= Math.min(0.82, accentHsl.l + 0.24)
    && hueDistance(colorHsl.h, accentHsl.h) <= 0.105;
}

function neonPerceptualGain(color: THREE.Color): number {
  const luminance = color.r * 0.2126 + color.g * 0.7152 + color.b * 0.0722;
  return THREE.MathUtils.clamp(
    NIGHT_NEON_TARGET_LUMINANCE / Math.max(luminance, 0.001),
    NIGHT_NEON_MIN_GAIN,
    NIGHT_NEON_MAX_GAIN,
  );
}

function neonPhase(kind: ApplianceKind): number {
  let hash = 0;
  for (let index = 0; index < kind.length; index += 1) hash = (hash * 31 + kind.charCodeAt(index)) >>> 0;
  return (hash % 628) / 100;
}

export class ApplianceSensoryController {
  readonly root = new THREE.Group();
  private readonly materialBaselines = new WeakMap<THREE.Material, MaterialBaseline>();
  private readonly targets = new Map<AppliancePerformanceTarget, TargetState>();

  constructor(private readonly neonScale = 1) {
    this.root.name = 'appliance-sensory-lights';
  }

  update(
    targets: readonly AppliancePerformanceTarget[],
    themeProgress: number,
    elapsed: number,
    explorationProgress = 0,
  ): void {
    targets.forEach((target) => this.updateTarget(
      target,
      themeProgress,
      elapsed,
      explorationProgress,
    ));
    [...this.targets.keys()].forEach((target) => {
      if (targets.includes(target)) return;
      this.removeTarget(target);
    });
  }

  register(targets: readonly AppliancePerformanceTarget[]): void {
    targets.forEach((target) => this.ensureTarget(target));
  }

  dispose(): void {
    [...this.targets.keys()].forEach((target) => this.removeTarget(target));
    this.root.removeFromParent();
  }

  getDiagnostics(): Array<{
    kind: string;
    state: ApplianceState;
    matchedNodes: string[];
    missingFunctionalNode: boolean;
    lightIntensity: number;
    neonMaterialCount: number;
    neonIntensity: number;
    poweredReveal: number;
  }> {
    return [...this.targets.entries()].map(([target, state]) => {
      return {
        kind: target.kind,
        state: target.state,
        matchedNodes: state.matchedNodes,
        missingFunctionalNode: state.matchedNodes.length === 0,
        lightIntensity: state.poweredLight?.intensity ?? 0,
        neonMaterialCount: state.neonMaterialCount,
        neonIntensity: state.neonIntensity,
        poweredReveal: state.poweredReveal,
      };
    });
  }

  private updateTarget(
    target: AppliancePerformanceTarget,
    themeProgress: number,
    elapsed: number,
    explorationProgress: number,
  ): void {
    const state = this.ensureTarget(target);
    const neonProfile = NIGHT_NEON_OVERRIDES[target.kind] ?? NIGHT_NEON_DEFAULT;
    const nightNeon = THREE.MathUtils.smoothstep(themeProgress, NIGHT_NEON_START, NIGHT_NEON_FULL);
    const exploration = THREE.MathUtils.clamp(explorationProgress, 0, 1) * nightNeon;
    const explorationBoost = THREE.MathUtils.lerp(1, EXPLORATION_NEON_BOOST, exploration);
    const neonPulse = 0.94 + Math.sin(
      elapsed * neonProfile.pulseRate + neonPhase(target.kind) + state.neonMaterialCount * 0.37,
    ) * 0.06;
    state.neonIntensity = state.neonMaterialCount > 0
      ? neonProfile.intensity * nightNeon * neonPulse * this.neonScale * explorationBoost
      : 0;
    state.poweredReveal = target.state === 'active'
      ? THREE.MathUtils.smoothstep(
          target.getActiveElapsed(),
          EXPLORATION_POWERED_REVEAL_START,
          EXPLORATION_POWERED_REVEAL_FULL,
        ) * exploration
      : 0;
    this.updatePoweredLight(target, state, elapsed);

    state.materials.forEach((entry) => {
      const {
        material,
        baseline,
        neonAccent,
        neonColor,
        neonGain,
        poweredReveal,
        poweredRevealColor,
      } = entry;
      const toon = material as THREE.MeshToonMaterial;
      const bodyRevealActive = poweredReveal && state.poweredReveal > 0.001;
      if (
        (neonAccent || bodyRevealActive || entry.poweredRevealApplied)
        && baseline.emissive
        && 'emissive' in toon
        && toon.emissive instanceof THREE.Color
      ) {
        toon.emissive.copy(baseline.emissive);
        toon.emissiveIntensity = baseline.emissiveIntensity ?? 0;
        if (neonAccent && neonColor && state.neonIntensity > 0.001) {
          toon.emissive.copy(neonColor);
          toon.emissiveIntensity = state.neonIntensity * neonGain;
        }
        if (
          bodyRevealActive
          && poweredRevealColor
          && EXPLORATION_POWERED_BODY_INTENSITY * state.poweredReveal > toon.emissiveIntensity
        ) {
          toon.emissive.copy(poweredRevealColor);
          toon.emissiveIntensity = EXPLORATION_POWERED_BODY_INTENSITY * state.poweredReveal;
        }
      }
      entry.poweredRevealApplied = bodyRevealActive;
    });
  }

  private ensureTarget(target: AppliancePerformanceTarget): TargetState {
    const existing = this.targets.get(target);
    if (existing) return existing;
    const profile = APPLIANCE_SENSORY_PROFILES[target.kind];
    const materials: TargetState['materials'] = [];
    const matchedNodes: string[] = [];
    const modelRoot = target.root.getObjectByName(`appliance-model-${target.kind}`) ?? target.root;
    const accentValue = Number(modelRoot.userData.applianceAccent);
    const accent = Number.isFinite(accentValue) ? new THREE.Color(accentValue) : null;
    target.root.traverse((object) => {
      if (!(object instanceof THREE.Mesh) || object.userData.isOutline) return;
      const objectName = object.name;
      const lowerName = objectName.toLowerCase();
      const hinted = profile.nodeHints.some((hint) => lowerName.includes(hint));
      const status = lowerName.includes('indicator') || lowerName.includes('status');
      if (hinted) {
        matchedNodes.push(objectName);
      }
      const entries = Array.isArray(object.material) ? object.material : [object.material];
      entries.forEach((material) => {
        const baseline = this.getBaseline(material);
        const toon = material as THREE.MeshToonMaterial;
        const eligibleNeonAccent = Boolean(
          accent
          && baseline.color
          && baseline.emissive
          && !object.userData.performanceEffect
          && material.opacity >= 0.72
          && 'emissive' in toon
          && toon.emissive instanceof THREE.Color
          && isAccentFamily(baseline.color, accent),
        );
        const neonAccent = eligibleNeonAccent && !hinted && !status;
        const poweredReveal = Boolean(
          accent
          && baseline.color
          && baseline.emissive
          && !object.userData.performanceEffect
          && material.opacity >= 0.72
          && 'emissive' in toon
          && toon.emissive instanceof THREE.Color
          && !hinted
          && !status,
        );
        const poweredRevealColor = poweredReveal && baseline.color && accent
          ? baseline.color.clone().lerp(accent, EXPLORATION_POWERED_ACCENT_MIX)
          : undefined;
        materials.push({
          objectName,
          material,
          baseline,
          hinted,
          status,
          eligibleNeonAccent,
          neonAccent,
          neonColor: neonAccent ? baseline.color?.clone() : undefined,
          neonGain: neonAccent && baseline.color ? neonPerceptualGain(baseline.color) : 1,
          poweredReveal,
          poweredRevealColor,
          poweredRevealApplied: false,
        });
      });
    });
    if (!materials.some((entry) => entry.status)) {
      const fallbackStatus = materials.find((entry) => entry.hinted);
      if (fallbackStatus) fallbackStatus.status = true;
    }
    if (!materials.some((entry) => entry.neonAccent)) {
      materials.forEach((entry) => {
        if (!entry.eligibleNeonAccent) return;
        entry.neonAccent = true;
        entry.neonColor = entry.baseline.color?.clone();
        entry.neonGain = entry.neonColor ? neonPerceptualGain(entry.neonColor) : 1;
      });
    }
    target.root.updateWorldMatrix(true, true);
    const state: TargetState = {
      materials,
      matchedNodes,
      neonMaterialCount: new Set(
        materials.filter((entry) => entry.neonAccent).map((entry) => entry.material),
      ).size,
      neonIntensity: 0,
      poweredReveal: 0,
      poweredLight: null,
      poweredLightColor: (accent ?? new THREE.Color(0xd8b5a6)).clone().lerp(new THREE.Color(0xfff0df), 0.68),
    };
    this.targets.set(target, state);
    return state;
  }

  private getBaseline(material: THREE.Material): MaterialBaseline {
    const existing = this.materialBaselines.get(material);
    if (existing) return existing;
    const toon = material as THREE.MeshToonMaterial;
    const baseline: MaterialBaseline = {
      color: 'color' in toon && toon.color instanceof THREE.Color ? toon.color.clone() : undefined,
      emissive: 'emissive' in toon && toon.emissive instanceof THREE.Color ? toon.emissive.clone() : undefined,
      emissiveIntensity: 'emissiveIntensity' in toon ? toon.emissiveIntensity : undefined,
      opacity: material.opacity,
    };
    this.materialBaselines.set(material, baseline);
    return baseline;
  }

  private updatePoweredLight(
    target: AppliancePerformanceTarget,
    state: TargetState,
    elapsed: number,
  ): void {
    if (state.poweredReveal <= 0.001) {
      this.removePoweredLight(state);
      return;
    }
    if (!state.poweredLight) {
      state.poweredLight = new THREE.PointLight(
        state.poweredLightColor,
        0,
        EXPLORATION_POWERED_LIGHT_DISTANCE,
        1.65,
      );
      state.poweredLight.name = `exploration-powered-fill-${target.kind}`;
      state.poweredLight.castShadow = false;
      this.root.add(state.poweredLight);
    }
    target.root.getWorldPosition(state.poweredLight.position);
    state.poweredLight.position.y += 0.45;
    state.poweredLight.intensity = EXPLORATION_POWERED_LIGHT_INTENSITY
      * state.poweredReveal
      * (0.97 + Math.sin(elapsed * 2.1 + neonPhase(target.kind)) * 0.03);
  }

  private removePoweredLight(state: TargetState): void {
    if (!state.poweredLight) return;
    state.poweredLight.removeFromParent();
    state.poweredLight.dispose();
    state.poweredLight = null;
  }

  private removeTarget(target: AppliancePerformanceTarget): void {
    const state = this.targets.get(target);
    if (state) this.removePoweredLight(state);
    this.targets.delete(target);
  }
}

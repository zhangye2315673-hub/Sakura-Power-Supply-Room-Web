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
const POWERED_BODY_WHITE = new THREE.Color(0xffffff);

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
        // This is a diagnostic brightness score, not a scene light. Exploration
        // brightens the appliance materials themselves so it cannot wash out
        // neighbouring cables with an invisible point light.
        lightIntensity: state.poweredReveal * EXPLORATION_POWERED_BODY_INTENSITY,
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
    // Exploration is an independent visibility mode. Appliance body reveal
    // must not wait for the night-neon theme transition to finish.
    const exploration = THREE.MathUtils.clamp(explorationProgress, 0, 1);
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
      if (baseline.color && 'color' in toon && toon.color instanceof THREE.Color) {
        toon.color.copy(baseline.color);
        if (bodyRevealActive) {
          const boost = state.poweredReveal;
          toon.color.lerp(POWERED_BODY_WHITE, boost * 0.22);
          toon.color.multiplyScalar(1 + boost * 0.28);
        }
      }
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
      // Use the stable Three.js object type instead of instanceof so sensory
      // registration also works across bundled/runtime Three.js realms.
      if (object.type !== 'Mesh' || object.userData.isOutline) return;
      const objectName = object.name;
      const lowerName = objectName.toLowerCase();
      const hinted = profile.nodeHints.some((hint) => lowerName.includes(hint));
      const status = lowerName.includes('indicator') || lowerName.includes('status');
      if (hinted) {
        matchedNodes.push(objectName);
      }
      const mesh = object as THREE.Mesh;
      const entries: THREE.Material[] = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
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

  private removeTarget(target: AppliancePerformanceTarget): void {
    this.targets.delete(target);
  }
}

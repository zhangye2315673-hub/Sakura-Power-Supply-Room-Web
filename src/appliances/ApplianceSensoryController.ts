import * as THREE from 'three';
import type { AppliancePerformanceTarget } from '../systems/AppliancePerformanceSystem';
import type { ApplianceState } from '../systems/ApplianceCatalog';
import { APPLIANCE_SENSORY_PROFILES } from './ApplianceSensoryProfiles';
import { poweredActiveDuration } from './poweredAnimation';

type MaterialBaseline = {
  color?: THREE.Color;
  emissive?: THREE.Color;
  emissiveIntensity?: number;
  opacity?: number;
};

type TargetState = {
  state: ApplianceState;
  connectedAt: number;
  activeAt: number;
  light: THREE.PointLight;
  lightAnchor: THREE.Vector3;
  lightWorldPosition: THREE.Vector3;
  materials: Array<{
    objectName: string;
    material: THREE.Material;
    baseline: MaterialBaseline;
    hinted: boolean;
    status: boolean;
  }>;
  matchedNodes: string[];
};

export class ApplianceSensoryController {
  readonly root = new THREE.Group();
  private readonly materialBaselines = new WeakMap<THREE.Material, MaterialBaseline>();
  private readonly targets = new Map<AppliancePerformanceTarget, TargetState>();
  private readonly activeColor = new THREE.Color();

  constructor() {
    this.root.name = 'appliance-sensory-lights';
  }

  update(
    targets: readonly AppliancePerformanceTarget[],
    themeProgress: number,
    elapsed: number,
  ): void {
    targets.forEach((target) => this.updateTarget(target, themeProgress, elapsed));
    [...this.targets.keys()].forEach((target) => {
      if (targets.includes(target)) return;
      this.removeTarget(target);
    });
  }

  register(targets: readonly AppliancePerformanceTarget[]): void {
    targets.forEach((target) => this.ensureTarget(target, 0));
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
  }> {
    return [...this.targets.entries()].map(([target, state]) => {
      return {
        kind: target.kind,
        state: target.state,
        matchedNodes: state.matchedNodes,
        missingFunctionalNode: state.matchedNodes.length === 0,
        lightIntensity: state.light.intensity,
      };
    });
  }

  private updateTarget(target: AppliancePerformanceTarget, themeProgress: number, elapsed: number): void {
    const profile = APPLIANCE_SENSORY_PROFILES[target.kind];
    const state = this.ensureTarget(target, elapsed);
    if (state.state !== target.state) {
      if (target.state === 'connected') state.connectedAt = elapsed;
      if (target.state === 'active') state.activeAt = elapsed;
      state.state = target.state;
    }

    const activeElapsed = Math.max(0, target.getActiveElapsed());
    const attack = THREE.MathUtils.smoothstep(activeElapsed, 0, 0.4);
    const release = target.state === 'active'
      ? THREE.MathUtils.smoothstep(poweredActiveDuration(target.kind) - activeElapsed, 0, 0.6)
      : 0;
    const activeEnvelope = target.state === 'active' ? Math.min(attack, release) : 0;
    const connectedElapsed = Math.max(0, elapsed - state.connectedAt);
    const doublePulse = target.state === 'connected'
      ? Math.max(0, Math.sin(connectedElapsed * Math.PI * 4.6)) ** 8
      : 0;

    state.lightWorldPosition.copy(state.lightAnchor);
    target.root.localToWorld(state.lightWorldPosition);
    state.light.position.copy(state.lightWorldPosition);
    state.light.intensity = themeProgress * profile.spill * profile.activeGain * activeEnvelope * 1.45;
    state.light.distance = profile.radius;
    state.light.color.setHex(profile.lightColor);

    state.materials.forEach(({ material, baseline, hinted, status }) => {
        const toon = material as THREE.MeshToonMaterial;
        if (baseline.color && 'color' in toon && toon.color instanceof THREE.Color) {
          if (target.state !== 'active') toon.color.copy(baseline.color);
        }
        if (baseline.emissive && 'emissive' in toon && toon.emissive instanceof THREE.Color) {
          if (target.state !== 'active') {
            toon.emissive.copy(baseline.emissive);
            toon.emissiveIntensity = baseline.emissiveIntensity ?? 0;
          }
          const intensity = status
            ? 0.12 + doublePulse * 0.7 + activeEnvelope * 0.55
            : hinted ? activeEnvelope * profile.activeGain : 0;
          if (intensity > 0) {
            const connectionColor = Number(target.root.userData.sensoryConnectionColor);
            const statusColor = target.state === 'connected' && Number.isFinite(connectionColor)
              ? connectionColor
              : target.state !== 'active' ? 0x7babb4 : profile.lightColor;
            this.activeColor.setHex(status ? statusColor : profile.lightColor);
            toon.emissive.lerp(this.activeColor, themeProgress);
            toon.emissiveIntensity = Math.max(toon.emissiveIntensity, intensity * themeProgress);
          }
        }
    });
  }

  private ensureTarget(target: AppliancePerformanceTarget, elapsed: number): TargetState {
    const existing = this.targets.get(target);
    if (existing) return existing;
    const profile = APPLIANCE_SENSORY_PROFILES[target.kind];
    const light = new THREE.PointLight(profile.lightColor, 0, profile.radius, 1.7);
    light.name = `${target.kind}-sensory-light`;
    light.castShadow = false;
    // Keep appliance lights in an always-visible layer. Parenting them to a
    // target made the renderer see 8 -> 7 -> 8 point lights while a completed
    // appliance was hidden and replaced, recompiling every lit shader twice.
    this.root.add(light);
    const materials: TargetState['materials'] = [];
    const matchedNodes: string[] = [];
    const functionalNodes: THREE.Object3D[] = [];
    target.root.traverse((object) => {
      if (!(object instanceof THREE.Mesh) || object.userData.isOutline) return;
      const objectName = object.name;
      const lowerName = objectName.toLowerCase();
      const hinted = profile.nodeHints.some((hint) => lowerName.includes(hint));
      const status = lowerName.includes('indicator') || lowerName.includes('status');
      if (hinted) {
        matchedNodes.push(objectName);
        functionalNodes.push(object);
      }
      const entries = Array.isArray(object.material) ? object.material : [object.material];
      entries.forEach((material) => materials.push({
        objectName,
        material,
        baseline: this.getBaseline(material),
        hinted,
        status,
      }));
    });
    if (!materials.some((entry) => entry.status)) {
      const fallbackStatus = materials.find((entry) => entry.hinted);
      if (fallbackStatus) fallbackStatus.status = true;
    }
    target.root.updateWorldMatrix(true, true);
    const lightAnchor = this.resolveLightAnchor(target.root, functionalNodes);
    const state: TargetState = {
      state: target.state,
      connectedAt: elapsed,
      activeAt: elapsed,
      light,
      lightAnchor,
      lightWorldPosition: new THREE.Vector3(),
      materials,
      matchedNodes,
    };
    this.targets.set(target, state);
    return state;
  }

  private resolveLightAnchor(root: THREE.Object3D, nodes: readonly THREE.Object3D[]): THREE.Vector3 {
    if (nodes.length === 0) return new THREE.Vector3(0, 0.18, 0.35);
    const preferred = nodes.find((node) => (
      /bulb|screen|display|heater|heating|interior|cavity|indicator|status|sensor|slot|gauge/i
        .test(node.name)
    )) ?? nodes[0];
    const center = new THREE.Box3().setFromObject(preferred).getCenter(new THREE.Vector3());
    return root.worldToLocal(center);
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
    const state = this.targets.get(target);
    if (!state) return;
    state.light.removeFromParent();
    state.light.dispose();
    this.targets.delete(target);
  }
}

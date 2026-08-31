import * as THREE from 'three';
import { createApplianceMechanicalAnimation } from '../appliances/performance/ApplianceMechanics';
import { poweredAnimationState } from '../appliances/poweredAnimation';
import type { ApplianceKind, ApplianceState } from './ApplianceCatalog';
import { ApplianceSpectacleSystem } from './ApplianceSpectacleSystem';
import type { PetalField } from './PetalField';
import type { LampBeamDiagnostics } from '../appliances/performance/LampPerformance';
import type {
  RadioMechanicalDiagnostics,
  RadioPerformanceDiagnostics,
} from '../appliances/performance/RadioPerformance';
import type { BlenderPerformanceDiagnostics } from '../appliances/performance/BlenderPerformance';
import type { HairDryerPerformanceDiagnostics } from '../appliances/performance/HairDryerPerformance';
import type { RefrigeratorPerformanceDiagnostics } from '../appliances/performance/RefrigeratorPerformance';

export type AppliancePerformanceTarget = {
  root: THREE.Group;
  state: ApplianceState;
  kind: ApplianceKind;
  facingSide: -1 | 1;
  getActiveElapsed(): number;
};

type PerformanceSession = {
  target: AppliancePerformanceTarget;
  animation: ReturnType<typeof createApplianceMechanicalAnimation>;
  elapsed: number;
};

export class AppliancePerformanceSystem {
  readonly root = new THREE.Group();
  private readonly effects = new ApplianceSpectacleSystem();
  private readonly sessions = new Map<AppliancePerformanceTarget, PerformanceSession>();
  private readonly preparedAnimations = new WeakMap<THREE.Object3D, PerformanceSession['animation']>();

  constructor() {
    this.root.name = 'appliance-performance-system';
    this.root.add(this.effects.root);
  }

  start(target: AppliancePerformanceTarget): void {
    if (this.sessions.has(target)) return;
    const modelRoot = target.root.getObjectByName(`appliance-model-${target.kind}`);
    const rigRoot = modelRoot instanceof THREE.Group ? modelRoot : target.root;
    this.sessions.set(target, {
      target,
      animation: this.preparedAnimations.get(target.root)
        ?? createApplianceMechanicalAnimation(target.kind, rigRoot),
      elapsed: 0,
    });
  }

  /** Build the mechanical driver before the appliance becomes interactive. */
  prime(target: AppliancePerformanceTarget): void {
    if (this.preparedAnimations.has(target.root)) return;
    const modelRoot = target.root.getObjectByName(`appliance-model-${target.kind}`);
    const rigRoot = modelRoot instanceof THREE.Group ? modelRoot : target.root;
    this.preparedAnimations.set(target.root, createApplianceMechanicalAnimation(target.kind, rigRoot));
  }

  /** Prime a replacement while its renderer warmup is running. */
  primeRoot(root: THREE.Object3D): void {
    const kind = root.userData.applianceKind as ApplianceKind | undefined;
    if (!kind || this.preparedAnimations.has(root)) return;
    const modelRoot = root.getObjectByName(`appliance-model-${kind}`);
    const rigRoot = modelRoot instanceof THREE.Group ? modelRoot : root;
    this.preparedAnimations.set(root, createApplianceMechanicalAnimation(kind, rigRoot as THREE.Group));
  }

  update(
    delta: number,
    elapsed: number,
    camera: THREE.PerspectiveCamera,
    targets: readonly AppliancePerformanceTarget[],
    petals: PetalField,
  ): void {
    targets.forEach((target) => {
      if (target.state !== 'active') return;
      this.start(target);
      const session = this.sessions.get(target);
      if (!session) return;
      const powered = poweredAnimationState(target.getActiveElapsed(), target.kind);
      session.elapsed = powered.time;
      if (powered.active) session.animation.update(powered.time, powered.power);
      else session.animation.stop();
      target.root.userData.appliancePerformanceSignal = session.animation.signal();
      target.root.userData.appliancePerformanceElapsed = powered.time;
    });
    [...this.sessions.keys()].forEach((target) => {
      if (target.state === 'active' && targets.includes(target)) return;
      this.stop(target, target.kind === 'toaster');
    });
    this.effects.update(delta, elapsed, camera, targets, petals);
  }

  stop(target: AppliancePerformanceTarget, preserveDetachedToast = false): void {
    const session = this.sessions.get(target);
    if (session) session.animation.stop();
    target.root.userData.appliancePerformanceSignal = 0;
    target.root.userData.appliancePerformanceElapsed = 0;
    this.sessions.delete(target);
    this.effects.stop(target, preserveDetachedToast);
    this.preparedAnimations.delete(target.root);
  }

  reset(): void {
    [...this.sessions.keys()].forEach((target) => this.stop(target));
    this.effects.reset();
  }

  getStateSummary(): {
    sessions: number;
    timelineOwners: number;
    kinds: ApplianceKind[];
    elapsedByKind: Partial<Record<ApplianceKind, number>>;
    signalsByKind: Partial<Record<ApplianceKind, number>>;
    activeTotal: number;
    activeByKind: Record<string, number>;
    capacityByKind: Record<string, number>;
    activeToastNdc: [number, number, number] | null;
    lampBeam: LampBeamDiagnostics | null;
    radio: RadioPerformanceDiagnostics;
    blender: {
      mechanics: BlenderPerformanceDiagnostics | null;
      splash: ReturnType<ApplianceSpectacleSystem['getStateSummary']>['blenderSplash'];
    };
    hairDryer: HairDryerPerformanceDiagnostics | null;
    refrigerator: RefrigeratorPerformanceDiagnostics | null;
  } {
    const effectState = this.effects.getStateSummary();
    const elapsedByKind: Partial<Record<ApplianceKind, number>> = {};
    const signalsByKind: Partial<Record<ApplianceKind, number>> = {};
    this.sessions.forEach((session) => {
      elapsedByKind[session.target.kind] = session.elapsed;
      signalsByKind[session.target.kind] = session.animation.signal();
    });
    const radioSession = [...this.sessions.values()].find((session) => session.target.kind === 'radio');
    const radioModel = radioSession?.target.root.getObjectByName('appliance-model-radio')
      ?? radioSession?.target.root;
    const radioMechanics = radioModel?.userData.radioPerformanceDiagnostics as
      RadioMechanicalDiagnostics | undefined;
    const blenderSession = [...this.sessions.values()].find((session) => session.target.kind === 'blender');
    const blenderModel = blenderSession?.target.root.getObjectByName('appliance-model-blender')
      ?? blenderSession?.target.root;
    const blenderMechanics = blenderModel?.userData.blenderPerformanceDiagnostics as
      BlenderPerformanceDiagnostics | undefined;
    const hairDryerSession = [...this.sessions.values()].find((session) => session.target.kind === 'hair-dryer');
    const hairDryerModel = hairDryerSession?.target.root.getObjectByName('appliance-model-hair-dryer')
      ?? hairDryerSession?.target.root;
    const hairDryerDiagnostics = hairDryerModel?.userData.hairDryerPerformanceDiagnostics as
      HairDryerPerformanceDiagnostics | undefined;
    const refrigeratorSession = [...this.sessions.values()].find((session) => session.target.kind === 'refrigerator');
    const refrigeratorModel = refrigeratorSession?.target.root.getObjectByName('appliance-model-refrigerator')
      ?? refrigeratorSession?.target.root;
    const refrigeratorDiagnostics = refrigeratorModel?.userData.refrigeratorPerformanceDiagnostics as
      RefrigeratorPerformanceDiagnostics | undefined;
    return {
      sessions: this.sessions.size,
      timelineOwners: this.sessions.size,
      kinds: [...this.sessions.values()].map((session) => session.target.kind),
      elapsedByKind,
      signalsByKind,
      activeTotal: effectState.activeTotal,
      activeByKind: effectState.activeByKind,
      capacityByKind: effectState.capacityByKind,
      activeToastNdc: effectState.activeToastNdc,
      lampBeam: effectState.lampBeam,
      radio: {
        mechanics: radioMechanics ?? null,
        wave: effectState.radioWave,
      },
      blender: {
        mechanics: blenderMechanics ?? null,
        splash: effectState.blenderSplash,
      },
      hairDryer: hairDryerDiagnostics ?? null,
      refrigerator: refrigeratorDiagnostics ?? null,
    };
  }

  dispose(): void {
    this.reset();
    this.effects.dispose();
    this.root.removeFromParent();
  }
}

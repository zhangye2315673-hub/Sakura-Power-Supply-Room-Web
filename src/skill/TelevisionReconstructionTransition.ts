import * as THREE from 'three';
import { POWERED_ACTIVE_DURATION } from '../appliances/poweredAnimation';
import {
  TELEVISION_INITIAL_SWITCHES,
  TELEVISION_RAPID_SWITCH_TIMES,
  TELEVISION_RECONSTRUCTION_COMMIT_TIME,
  TELEVISION_RECONSTRUCTION_FINAL_LOCK_TIME,
} from '../appliances/performance/TelevisionPerformance';
import type { ArrowDefinition } from '../puzzle/types';
import { PlugCableModel } from '../render/PlugCableModel';
import type { PlugStyleId } from '../render/PlugParts';

export type TelevisionReconstructionPhase =
  | 'idle'
  | 'old-hold'
  | 'old-flicker'
  | 'new-glitch'
  | 'new-locked'
  | 'complete';

export type TelevisionReconstructionDiagnostics = Readonly<{
  active: boolean;
  elapsed: number;
  duration: number;
  phase: TelevisionReconstructionPhase;
  currentTopology: 'old' | 'new' | 'committed';
  targetIds: string[];
  switchCount: number;
  rgbGhostCount: number;
  committed: boolean;
}>;

type TransitionEntry = {
  cableId: string;
  oldModel: PlugCableModel;
  nextModel: PlugCableModel;
  redGhost: PlugCableModel;
  cyanGhost: PlugCableModel;
  nextMaterials: PreviewMaterial[];
  redGhostMaterials: PreviewMaterial[];
  cyanGhostMaterials: PreviewMaterial[];
};

type PreviewMaterial = {
  material: THREE.Material;
  visibleOpacity: number;
};

type StartOptions = Readonly<{
  replacements: ReadonlyMap<string, ArrowDefinition>;
  existingModels: ReadonlyMap<string, PlugCableModel>;
  getPlugStyle: (color: number) => PlugStyleId;
  getTimelineElapsed?: () => number;
  commit: () => boolean;
}>;

type SwitchWindow = Readonly<{ start: number; end: number }>;

const SWITCH_CENTERS = [
  ...TELEVISION_INITIAL_SWITCHES,
  ...TELEVISION_RAPID_SWITCH_TIMES,
] as const;
const NEW_FLASH_DURATIONS = [0.12, 0.14, 0.1, 0.11, 0.12, 0.13, 0.15, 0.18] as const;
const OLD_FLICKER_LEAD = 0.085;
const RGB_OFFSET = 0.045;

const SWITCH_WINDOWS: readonly SwitchWindow[] = SWITCH_CENTERS.map((start, index) => ({
  start,
  end: start + NEW_FLASH_DURATIONS[index],
}));

const EMPTY_DIAGNOSTICS = (): TelevisionReconstructionDiagnostics => ({
  active: false,
  elapsed: 0,
  duration: POWERED_ACTIVE_DURATION,
  phase: 'idle',
  currentTopology: 'old',
  targetIds: [],
  switchCount: 0,
  rgbGhostCount: 0,
  committed: false,
});

function preparePreviewMaterials(model: PlugCableModel, opacityScale: number): PreviewMaterial[] {
  const materials: PreviewMaterial[] = [];
  const visited = new Set<THREE.Material>();
  model.root.traverseVisible((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const meshMaterials = Array.isArray(object.material) ? object.material : [object.material];
    meshMaterials.forEach((material) => {
      if (visited.has(material)) return;
      visited.add(material);
      materials.push({
        material,
        visibleOpacity: material.opacity * opacityScale,
      });
      material.transparent = true;
      material.opacity = 0;
      material.depthWrite = false;
      material.needsUpdate = true;
    });
  });
  return materials;
}

function setPreviewOpacity(materials: readonly PreviewMaterial[], amount: number): void {
  materials.forEach(({ material, visibleOpacity }) => {
    material.opacity = visibleOpacity * amount;
  });
}

function configureGhost(model: PlugCableModel, color: number): PreviewMaterial[] {
  model.setSkillTint(color, 1);
  model.setSkillGlow(1);
  model.root.traverseVisible((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.renderOrder = 82;
  });
  return preparePreviewMaterials(model, 0.3);
}

export class TelevisionReconstructionTransition {
  readonly root = new THREE.Group();

  private entries: TransitionEntry[] = [];
  private startedAt = 0;
  private getTimelineElapsed: (() => number) | null = null;
  private commit: (() => boolean) | null = null;
  private diagnosticsValue = EMPTY_DIAGNOSTICS();

  constructor() {
    this.root.name = 'television-reconstruction-transition';
  }

  get diagnostics(): TelevisionReconstructionDiagnostics {
    return {
      ...this.diagnosticsValue,
      targetIds: [...this.diagnosticsValue.targetIds],
    };
  }

  start(options: StartOptions): number {
    this.reset();
    this.startedAt = performance.now() * 0.001;
    this.getTimelineElapsed = options.getTimelineElapsed ?? null;
    this.commit = options.commit;

    options.replacements.forEach((definition, cableId) => {
      const oldModel = options.existingModels.get(cableId);
      if (!oldModel) return;
      const plugStyle = options.getPlugStyle(definition.color);
      const nextModel = new PlugCableModel(definition, plugStyle);
      const redGhost = new PlugCableModel(definition, plugStyle);
      const cyanGhost = new PlugCableModel(definition, plugStyle);
      nextModel.root.name = `television-next-${cableId}`;
      redGhost.root.name = `television-rgb-red-${cableId}`;
      cyanGhost.root.name = `television-rgb-cyan-${cableId}`;
      nextModel.setSkillGlow(0.72);
      const nextMaterials = preparePreviewMaterials(nextModel, 1);
      const redGhostMaterials = configureGhost(redGhost, 0xff365f);
      const cyanGhostMaterials = configureGhost(cyanGhost, 0x35d7ff);
      this.root.add(redGhost.root, cyanGhost.root, nextModel.root);
      this.entries.push({
        cableId,
        oldModel,
        nextModel,
        redGhost,
        cyanGhost,
        nextMaterials,
        redGhostMaterials,
        cyanGhostMaterials,
      });
    });

    this.diagnosticsValue = {
      active: this.entries.length > 0,
      elapsed: 0,
      duration: POWERED_ACTIVE_DURATION,
      phase: this.entries.length > 0 ? 'old-hold' : 'complete',
      currentTopology: 'old',
      targetIds: this.entries.map(({ cableId }) => cableId),
      switchCount: 0,
      rgbGhostCount: 0,
      committed: false,
    };
    return POWERED_ACTIVE_DURATION * 1_000;
  }

  update(camera: THREE.Camera): void {
    if (!this.diagnosticsValue.active) return;
    const wallElapsed = Math.max(0, performance.now() * 0.001 - this.startedAt);
    const externalElapsed = this.getTimelineElapsed?.();
    const elapsed = Number.isFinite(externalElapsed) && (externalElapsed ?? 0) > 0
      ? Math.max(0, externalElapsed!)
      : wallElapsed;

    if (elapsed >= TELEVISION_RECONSTRUCTION_COMMIT_TIME) {
      this.finish(elapsed);
      return;
    }

    const sample = this.sample(elapsed);
    const cameraRight = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    const cameraUp = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
    const jitter = Math.sin(elapsed * 91) * 0.008;
    const ghostOffset = RGB_OFFSET + Math.abs(Math.sin(elapsed * 73)) * 0.018;
    const oldVisible = sample.phase === 'old-hold'
      || (sample.phase === 'old-flicker' && Math.sin(elapsed * 118) > -0.18);
    const newVisible = sample.phase === 'new-glitch' || sample.phase === 'new-locked';
    const ghostsVisible = sample.phase === 'new-glitch'
      || (sample.phase === 'new-locked' && elapsed < TELEVISION_RECONSTRUCTION_FINAL_LOCK_TIME + 0.24);

    this.entries.forEach((entry, index) => {
      entry.oldModel.root.visible = oldVisible;
      entry.oldModel.root.scale.setScalar(1 + (sample.phase === 'old-flicker' ? Math.abs(Math.sin(elapsed * 72)) * 0.018 : 0));
      entry.oldModel.setSkillGlow(sample.phase === 'old-flicker' ? 0.95 : 0.58);

      setPreviewOpacity(entry.nextMaterials, newVisible ? 1 : 0);
      entry.nextModel.root.position
        .copy(cameraRight).multiplyScalar(jitter * (index % 2 === 0 ? 1 : -1))
        .addScaledVector(cameraUp, Math.cos(elapsed * 83 + index) * 0.006);
      entry.nextModel.root.scale.setScalar(1 + (sample.phase === 'new-glitch' ? Math.sin(elapsed * 64 + index) * 0.012 : 0));

      setPreviewOpacity(entry.redGhostMaterials, ghostsVisible ? 1 : 0);
      setPreviewOpacity(entry.cyanGhostMaterials, ghostsVisible ? 1 : 0);
      entry.redGhost.root.position
        .copy(cameraRight).multiplyScalar(-ghostOffset)
        .addScaledVector(cameraUp, jitter);
      entry.cyanGhost.root.position
        .copy(cameraRight).multiplyScalar(ghostOffset)
        .addScaledVector(cameraUp, -jitter);
    });

    this.diagnosticsValue = {
      ...this.diagnosticsValue,
      elapsed,
      phase: sample.phase,
      currentTopology: newVisible ? 'new' : 'old',
      switchCount: sample.switchCount,
      rgbGhostCount: ghostsVisible ? this.entries.length * 2 : 0,
    };
  }

  reset(): void {
    this.entries.forEach((entry) => {
      entry.oldModel.root.visible = true;
      entry.oldModel.root.position.set(0, 0, 0);
      entry.oldModel.root.scale.setScalar(1);
      entry.oldModel.setSkillGlow(0);
      entry.nextModel.dispose();
      entry.redGhost.dispose();
      entry.cyanGhost.dispose();
    });
    this.entries = [];
    this.getTimelineElapsed = null;
    this.commit = null;
    this.diagnosticsValue = EMPTY_DIAGNOSTICS();
  }

  dispose(): void {
    this.reset();
    this.root.removeFromParent();
  }

  private sample(elapsed: number): {
    phase: Exclude<TelevisionReconstructionPhase, 'idle' | 'complete'>;
    switchCount: number;
  } {
    if (elapsed >= TELEVISION_RECONSTRUCTION_FINAL_LOCK_TIME) {
      return { phase: 'new-locked', switchCount: SWITCH_WINDOWS.length + 1 };
    }
    const activeWindow = SWITCH_WINDOWS.find((window) => elapsed >= window.start && elapsed < window.end);
    if (activeWindow) {
      return {
        phase: 'new-glitch',
        switchCount: SWITCH_WINDOWS.filter((window) => window.start <= elapsed).length,
      };
    }
    const nextWindow = SWITCH_WINDOWS.find((window) => elapsed < window.start);
    if (nextWindow && elapsed >= nextWindow.start - OLD_FLICKER_LEAD) {
      return {
        phase: 'old-flicker',
        switchCount: SWITCH_WINDOWS.filter((window) => window.end <= elapsed).length,
      };
    }
    return {
      phase: 'old-hold',
      switchCount: SWITCH_WINDOWS.filter((window) => window.end <= elapsed).length,
    };
  }

  private finish(elapsed: number): void {
    const commit = this.commit;
    const committed = commit?.() ?? false;
    this.entries.forEach((entry) => {
      if (!committed) {
        entry.oldModel.root.visible = true;
        entry.oldModel.root.scale.setScalar(1);
        entry.oldModel.setSkillGlow(0);
      }
      entry.nextModel.dispose();
      entry.redGhost.dispose();
      entry.cyanGhost.dispose();
    });
    this.entries = [];
    this.getTimelineElapsed = null;
    this.commit = null;
    this.diagnosticsValue = {
      ...this.diagnosticsValue,
      active: false,
      elapsed,
      phase: 'complete',
      currentTopology: committed ? 'committed' : 'old',
      rgbGhostCount: 0,
      committed,
    };
  }
}

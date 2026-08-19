import * as THREE from 'three';
import { POWERED_ACTIVE_DURATION } from '../appliances/poweredAnimation';
import type { ArrowDefinition } from '../puzzle/types';
import { PlugCableModel } from '../render/PlugCableModel';
import type { PlugStyleId } from '../render/PlugParts';

export type ToasterHeatSwapPhase =
  | 'idle'
  | 'preheat'
  | 'compression'
  | 'swap'
  | 'release'
  | 'complete';

export type ToasterHeatSwapDiagnostics = Readonly<{
  active: boolean;
  elapsed: number;
  duration: number;
  phase: ToasterHeatSwapPhase;
  currentTopology: 'old' | 'blend' | 'new' | 'committed';
  targetIds: string[];
  screenProgress: number;
  isolation: number;
  lineProgress: number;
  terminalProgress: number;
  swapProgress: number;
  previewCount: number;
  committed: boolean;
}>;

type MaterialState = {
  material: THREE.Material;
  role: 'line' | 'terminal';
  visibleOpacity: number;
  visibleUniformOpacity: number | null;
  transparent: boolean;
  opacity: number;
  depthWrite: boolean;
};

type SwapEntry = {
  cableId: string;
  oldModel: PlugCableModel;
  nextModel: PlugCableModel;
  oldMaterials: MaterialState[];
  nextMaterials: MaterialState[];
};

type StartOptions = Readonly<{
  replacements: ReadonlyMap<string, ArrowDefinition>;
  existingModels: ReadonlyMap<string, PlugCableModel>;
  getPlugStyle: (color: number) => PlugStyleId;
  getTimelineElapsed?: () => number;
  commit: () => boolean;
}>;

const PREHEAT_START = 0.32;
const COMPRESSION_START = 3.2;
const SWAP_START = 3.52;
const SWAP_END = 4.18;
const LINE_SWAP_START = 3.28;
const LINE_SWAP_END = 3.66;
const TERMINAL_SWAP_START = 3.56;
const TERMINAL_SWAP_END = 4.16;
const RELEASE_END = 4.86;
const COMMIT_TIME = 5.12;

const EMPTY_DIAGNOSTICS = (): ToasterHeatSwapDiagnostics => ({
  active: false,
  elapsed: 0,
  duration: POWERED_ACTIVE_DURATION,
  phase: 'idle',
  currentTopology: 'old',
  targetIds: [],
  screenProgress: 0,
  isolation: 0,
  lineProgress: 0,
  terminalProgress: 0,
  swapProgress: 0,
  previewCount: 0,
  committed: false,
});

function collectMaterials(model: PlugCableModel, initialOpacity = 1): MaterialState[] {
  const states: MaterialState[] = [];
  const visited = new Set<THREE.Material>();
  model.root.traverseVisible((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      if (visited.has(material) || material.opacity <= 0.001 || material.colorWrite === false) return;
      visited.add(material);
      const uniformOpacity = material instanceof THREE.ShaderMaterial
        && typeof material.uniforms.uOpacity?.value === 'number'
        ? Number(material.uniforms.uOpacity.value)
        : null;
      const role = material.name === 'sakura-cable-toon'
        || object.name.endsWith('-cable')
        || object.name.endsWith('-cable-ink')
        ? 'line'
        : 'terminal';
      states.push({
        material,
        role,
        visibleOpacity: material.opacity,
        visibleUniformOpacity: uniformOpacity,
        transparent: material.transparent,
        opacity: material.opacity,
        depthWrite: material.depthWrite,
      });
      material.transparent = true;
      material.depthWrite = false;
      material.opacity *= initialOpacity;
      if (uniformOpacity !== null) material.uniforms.uOpacity.value = uniformOpacity * initialOpacity;
      material.needsUpdate = true;
    });
  });
  return states;
}

function setOpacity(
  states: readonly MaterialState[],
  amount: number,
  role?: MaterialState['role'],
): void {
  const clamped = THREE.MathUtils.clamp(amount, 0, 1);
  states.forEach(({ material, visibleOpacity, visibleUniformOpacity, role: stateRole }) => {
    if (role && stateRole !== role) return;
    material.opacity = visibleOpacity * clamped;
    if (visibleUniformOpacity !== null && material instanceof THREE.ShaderMaterial) {
      material.uniforms.uOpacity.value = visibleUniformOpacity * clamped;
    }
  });
}

function restoreMaterials(states: readonly MaterialState[]): void {
  states.forEach((state) => {
    state.material.transparent = state.transparent;
    state.material.opacity = state.opacity;
    if (state.visibleUniformOpacity !== null && state.material instanceof THREE.ShaderMaterial) {
      state.material.uniforms.uOpacity.value = state.visibleUniformOpacity;
    }
    state.material.depthWrite = state.depthWrite;
    state.material.needsUpdate = true;
  });
}

function phaseAt(elapsed: number): ToasterHeatSwapPhase {
  if (elapsed < COMPRESSION_START) return 'preheat';
  if (elapsed < SWAP_START) return 'compression';
  if (elapsed < SWAP_END) return 'swap';
  if (elapsed < COMMIT_TIME) return 'release';
  return 'complete';
}

export class ToasterHeatSwapTransition {
  readonly root = new THREE.Group();

  private entries: SwapEntry[] = [];
  private backgroundMaterials: MaterialState[] = [];
  private startedAt = 0;
  private getTimelineElapsed: (() => number) | null = null;
  private commit: (() => boolean) | null = null;
  private diagnosticsValue = EMPTY_DIAGNOSTICS();

  constructor() {
    this.root.name = 'toaster-heat-swap-transition';
  }

  get diagnostics(): ToasterHeatSwapDiagnostics {
    return { ...this.diagnosticsValue, targetIds: [...this.diagnosticsValue.targetIds] };
  }

  start(options: StartOptions): number {
    this.reset();
    this.startedAt = performance.now() * 0.001;
    this.getTimelineElapsed = options.getTimelineElapsed ?? null;
    this.commit = options.commit;
    const targetIds = new Set(options.replacements.keys());

    options.existingModels.forEach((model, cableId) => {
      if (!targetIds.has(cableId)) this.backgroundMaterials.push(...collectMaterials(model));
    });

    options.replacements.forEach((definition, cableId) => {
      const oldModel = options.existingModels.get(cableId);
      if (!oldModel) return;
      const nextModel = new PlugCableModel(definition, options.getPlugStyle(definition.color));
      nextModel.root.name = `toaster-heat-next-${cableId}`;
      oldModel.setSkillGlow(0);
      nextModel.setSkillGlow(0);
      const oldMaterials = collectMaterials(oldModel);
      const nextMaterials = collectMaterials(nextModel, 0);
      this.root.add(nextModel.root);
      this.entries.push({ cableId, oldModel, nextModel, oldMaterials, nextMaterials });
    });

    this.diagnosticsValue = {
      active: this.entries.length > 0,
      elapsed: 0,
      duration: POWERED_ACTIVE_DURATION,
      phase: this.entries.length > 0 ? 'preheat' : 'complete',
      currentTopology: 'old',
      targetIds: this.entries.map(({ cableId }) => cableId),
      screenProgress: 0,
      isolation: 0,
      lineProgress: 0,
      terminalProgress: 0,
      swapProgress: 0,
      previewCount: this.entries.length,
      committed: false,
    };
    return POWERED_ACTIVE_DURATION * 1_000;
  }

  update(): void {
    if (!this.diagnosticsValue.active) return;
    const wallElapsed = Math.max(0, performance.now() * 0.001 - this.startedAt);
    const externalElapsed = this.getTimelineElapsed?.();
    const elapsed = Number.isFinite(externalElapsed) && (externalElapsed ?? 0) > 0
      ? Math.max(0, externalElapsed!)
      : wallElapsed;
    if (elapsed >= COMMIT_TIME) {
      this.finish(elapsed);
      return;
    }

    const phase = phaseAt(elapsed);
    const screenProgress = THREE.MathUtils.clamp(elapsed / COMMIT_TIME, 0, 1);
    const heatIn = THREE.MathUtils.smoothstep(elapsed, PREHEAT_START, COMPRESSION_START);
    const heatOut = 1 - THREE.MathUtils.smoothstep(elapsed, RELEASE_END, COMMIT_TIME);
    const isolation = heatIn * heatOut;
    const lineProgress = THREE.MathUtils.smoothstep(elapsed, LINE_SWAP_START, LINE_SWAP_END);
    const terminalProgress = THREE.MathUtils.smoothstep(elapsed, TERMINAL_SWAP_START, TERMINAL_SWAP_END);
    const oldLineOpacity = Math.sqrt(1 - lineProgress);
    const nextLineOpacity = Math.sqrt(lineProgress);
    const oldTerminalOpacity = Math.sqrt(1 - terminalProgress);
    const nextTerminalOpacity = Math.sqrt(terminalProgress);

    setOpacity(this.backgroundMaterials, 1 - isolation * 0.14);
    this.entries.forEach((entry) => {
      entry.oldModel.root.visible = oldLineOpacity > 0.015 || oldTerminalOpacity > 0.015;
      entry.nextModel.root.visible = nextLineOpacity > 0.015 || nextTerminalOpacity > 0.015;
      setOpacity(entry.oldMaterials, oldLineOpacity, 'line');
      setOpacity(entry.nextMaterials, nextLineOpacity, 'line');
      setOpacity(entry.oldMaterials, oldTerminalOpacity, 'terminal');
      setOpacity(entry.nextMaterials, nextTerminalOpacity, 'terminal');
      entry.oldModel.setSkillGlow(0);
      entry.nextModel.setSkillGlow(0);
    });

    this.diagnosticsValue = {
      ...this.diagnosticsValue,
      elapsed,
      phase,
      currentTopology: lineProgress <= 0.001 && terminalProgress <= 0.001
        ? 'old'
        : terminalProgress >= 0.999
          ? 'new'
          : 'blend',
      screenProgress,
      isolation,
      lineProgress,
      terminalProgress,
      swapProgress: terminalProgress,
    };
  }

  reset(): void {
    restoreMaterials(this.backgroundMaterials);
    this.backgroundMaterials = [];
    this.entries.forEach((entry) => {
      restoreMaterials(entry.oldMaterials);
      entry.oldModel.root.visible = true;
      entry.oldModel.setSkillGlow(0);
      entry.nextModel.dispose();
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

  private finish(elapsed: number): void {
    restoreMaterials(this.backgroundMaterials);
    this.backgroundMaterials = [];
    const committed = this.commit?.() ?? false;
    this.entries.forEach((entry) => {
      if (!committed) {
        restoreMaterials(entry.oldMaterials);
        entry.oldModel.root.visible = true;
        entry.oldModel.setSkillGlow(0);
      }
      entry.nextModel.dispose();
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
      screenProgress: 1,
      isolation: 0,
      lineProgress: 1,
      terminalProgress: 1,
      swapProgress: 1,
      previewCount: 0,
      committed,
    };
  }
}

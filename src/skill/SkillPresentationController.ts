import * as THREE from 'three';
import { createTimeline, type Timeline } from 'animejs';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { PAL } from '../style/palette';
import { cel, flat } from '../style/toon';
import type { SkillResolution, SkillStatusId } from './SkillChallengeEngine';

type PresentationPhase = 'idle' | 'cue' | 'target-lock' | 'commit' | 'impact' | 'result' | 'settle' | 'cleanup';

export type SkillPresentationTarget = Readonly<{
  cableId: string;
  position: THREE.Vector3;
  direction?: THREE.Vector3;
  path?: readonly THREE.Vector3[];
}>;

export type SkillPresentationDiagnostics = Readonly<{
  phase: PresentationPhase;
  phaseHistory: PresentationPhase[];
  skillId: string | null;
  targetCount: number;
  labelCount: number;
  lineCount: number;
  meshCount: number;
  materialCount: number;
  activeTimelines: number;
  riceCableVisualScale: number;
  autoRemovalOrder: string[];
  autoRemovalStartsMs: number[];
  radioPulseOrder: number[];
  radioGuideTargetIds: string[];
  radioGuideCurrentId: string | null;
  radioGuideVisibleCount: number;
  cleanupCount: number;
  sweepPassCount: number;
  sweepActiveCableCount: number;
  colorCycleCount: number;
  colorCycleSpeed: number;
  colorPreviewStrength: number;
  colorPreviewActiveCableCount: number;
  colorCommitCount: number;
}>;

export type SkillPresentationHooks = Readonly<{
  commitAutoRemoval: (cableId: string) => boolean;
  setCableVisualScale: (scale: number) => void;
  getRiceCableVisualScale: () => number;
  getCableBaseColor: (cableId: string) => number | null;
  setCableSkillSweep: (cableId: string, progress: number, strength: number, color: number) => void;
  setCableSkillTint: (cableId: string, color: number | null, strength: number, emissionScale: number) => void;
  commitCableColors: (changes: readonly { cableId: string; color: number }[]) => void;
}>;

const emptyDiagnostics = (): SkillPresentationDiagnostics => ({
  phase: 'idle',
  phaseHistory: [],
  skillId: null,
  targetCount: 0,
  labelCount: 0,
  lineCount: 0,
  meshCount: 0,
  materialCount: 0,
  activeTimelines: 0,
  riceCableVisualScale: 1,
  autoRemovalOrder: [],
  autoRemovalStartsMs: [],
  radioPulseOrder: [],
  radioGuideTargetIds: [],
  radioGuideCurrentId: null,
  radioGuideVisibleCount: 0,
  cleanupCount: 0,
  sweepPassCount: 0,
  sweepActiveCableCount: 0,
  colorCycleCount: 0,
  colorCycleSpeed: 0,
  colorPreviewStrength: 0,
  colorPreviewActiveCableCount: 0,
  colorCommitCount: 0,
});

export function resolveBlenderColorCycle(progress: number): Readonly<{
  position: number;
  speed: number;
}> {
  const normalized = THREE.MathUtils.clamp(progress, 0, 1);
  return {
    position: normalized * 5 + normalized * normalized * normalized * 17,
    speed: (5 + 51 * normalized * normalized) / 4.4,
  };
}

const makeMaterial = (color: number): THREE.MeshToonMaterial => {
  const material = cel({
    color,
    bands: 3,
    tint: 0x625874,
    flatShading: true,
  });
  material.depthTest = false;
  material.depthWrite = false;
  return material;
};

const makeOccludedMaterial = (color: number): THREE.MeshToonMaterial => {
  const material = makeMaterial(color);
  material.depthTest = true;
  material.polygonOffset = true;
  material.polygonOffsetFactor = -1;
  material.polygonOffsetUnits = -1;
  return material;
};

function createLowPolyRiceGeometry(): THREE.BufferGeometry {
  const radialSegments = 6;
  const rings = [
    { x: -0.072, radius: 0.038 },
    { x: 0, radius: 0.052 },
    { x: 0.072, radius: 0.038 },
  ] as const;
  const positions: number[] = [-0.12, 0, 0];
  for (const ring of rings) {
    for (let index = 0; index < radialSegments; index += 1) {
      const angle = (index / radialSegments) * Math.PI * 2;
      positions.push(ring.x, Math.sin(angle) * ring.radius, Math.cos(angle) * ring.radius * 0.68);
    }
  }
  positions.push(0.12, 0, 0);
  const indices: number[] = [];
  for (let segment = 0; segment < radialSegments; segment += 1) {
    const next = (segment + 1) % radialSegments;
    indices.push(0, 1 + next, 1 + segment);
  }
  for (let ring = 0; ring < rings.length - 1; ring += 1) {
    const current = 1 + ring * radialSegments;
    const nextRing = current + radialSegments;
    for (let segment = 0; segment < radialSegments; segment += 1) {
      const next = (segment + 1) % radialSegments;
      indices.push(
        current + segment, current + next, nextRing + segment,
        current + next, nextRing + next, nextRing + segment,
      );
    }
  }
  const finalTip = 1 + rings.length * radialSegments;
  const lastRing = 1 + (rings.length - 1) * radialSegments;
  for (let segment = 0; segment < radialSegments; segment += 1) {
    const next = (segment + 1) % radialSegments;
    indices.push(lastRing + segment, lastRing + next, finalTip);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.userData.skillShape = 'low-poly-rice-kernel';
  return geometry;
}

function samplePath(
  points: readonly THREE.Vector3[],
  progress: number,
  position: THREE.Vector3,
  tangent: THREE.Vector3,
): void {
  if (points.length < 2) {
    position.copy(points[0] ?? new THREE.Vector3());
    tangent.set(1, 0, 0);
    return;
  }
  const lengths = points.slice(1).map((point, index) => point.distanceTo(points[index]));
  const total = lengths.reduce((sum, length) => sum + length, 0);
  let remaining = THREE.MathUtils.clamp(progress, 0, 1) * total;
  for (let index = 0; index < lengths.length; index += 1) {
    const length = lengths[index];
    if (remaining > length && index < lengths.length - 1) {
      remaining -= length;
      continue;
    }
    position.lerpVectors(points[index], points[index + 1], length > 0 ? remaining / length : 0);
    tangent.subVectors(points[index + 1], points[index]).normalize();
    if (tangent.lengthSq() < 0.001) tangent.set(1, 0, 0);
    return;
  }
}

export class SkillPresentationController {
  readonly root = new THREE.Group();
  readonly cssRenderer = new CSS2DRenderer();

  private readonly transient = new THREE.Group();
  private readonly radioGuide = new THREE.Group();
  private readonly materials = new Set<THREE.Material>();
  private readonly radioGuideMaterials = new Set<THREE.Material>();
  private radioGuideEntries: Array<{ cableId: string; root: THREE.Group }> = [];
  private timeline: Timeline | null = null;
  private statusTimeline: Timeline | null = null;
  private readonly transientTimers = new Set<number>();
  private generation = 0;
  private diagnosticsValue = emptyDiagnostics();
  private riceVisualScale = 1;
  private sweepCableIds = new Set<string>();
  private colorShuffleCableIds = new Set<string>();

  constructor(
    private readonly scene: THREE.Scene,
    private readonly camera: THREE.Camera,
    private readonly hooks: SkillPresentationHooks,
  ) {
    this.root.name = 'skill-presentation-root';
    this.transient.name = 'skill-presentation-transient';
    this.radioGuide.name = 'radio-route-guide';
    this.root.add(this.transient, this.radioGuide);
    this.scene.add(this.root);
    this.cssRenderer.domElement.className = 'skill-world-overlay';
    this.cssRenderer.domElement.setAttribute('aria-hidden', 'true');
    Object.assign(this.cssRenderer.domElement.style, {
      position: 'absolute',
      inset: '0',
      pointerEvents: 'none',
      overflow: 'hidden',
      zIndex: '7',
    });
    document.querySelector<HTMLElement>('#app')?.append(this.cssRenderer.domElement);
  }

  get diagnostics(): SkillPresentationDiagnostics {
    return {
      ...this.diagnosticsValue,
      materialCount: this.materials.size,
      riceCableVisualScale: this.hooks.getRiceCableVisualScale(),
      radioGuideTargetIds: this.radioGuideEntries.map(({ cableId }) => cableId),
      radioGuideCurrentId: this.radioGuideEntries[0]?.cableId ?? null,
      radioGuideVisibleCount: this.radioGuideEntries.length,
    };
  }

  play(
    resolution: SkillResolution,
    targets: readonly THREE.Vector3[] | readonly SkillPresentationTarget[],
  ): number {
    this.cancelTransient(false);
    const token = ++this.generation;
    const normalizedTargets = targets.map((target, index): SkillPresentationTarget => (
      target instanceof THREE.Vector3
        ? { cableId: resolution.targetCableIds[index] ?? `target-${index + 1}`, position: target }
        : target
    ));
    this.diagnosticsValue = {
      ...emptyDiagnostics(),
      phase: 'cue',
      phaseHistory: ['cue'],
      skillId: resolution.skillId,
      targetCount: normalizedTargets.length,
      activeTimelines: 1,
      riceCableVisualScale: this.hooks.getRiceCableVisualScale(),
    };

    if (resolution.appliance === 'radio') return this.playRadio(resolution, normalizedTargets, token);
    if (resolution.appliance === 'robot-vacuum') {
      const duration = this.playRobotVacuum(resolution, normalizedTargets, token);
      return duration;
    }
    if (resolution.appliance === 'rice-cooker') {
      const duration = this.playRiceCooker(resolution, normalizedTargets, token);
      return duration;
    }
    if (resolution.appliance === 'stand-mixer') return this.playStandMixer(normalizedTargets, token);
    if (resolution.appliance === 'blender') return this.playBlender(resolution, normalizedTargets, token);
    this.diagnosticsValue = { ...this.diagnosticsValue, phase: 'settle', activeTimelines: 0 };
    return resolution.topologyChanged ? 900 : 650;
  }

  syncRiceStatus(statusId: SkillStatusId | null): void {
    const target = statusId === 'rice-thick-cable' ? 1.5 : 1;
    if (
      target === 1.5
      && this.diagnosticsValue.skillId === 'rice-thick-cable'
      && ['cue', 'target-lock', 'commit'].includes(this.diagnosticsValue.phase)
    ) return;
    if (
      Math.abs(target - this.riceVisualScale) < 0.01
      && Math.abs(target - this.hooks.getRiceCableVisualScale()) < 0.01
    ) return;
    this.riceVisualScale = target;
    this.statusTimeline?.cancel();
    const state = { scale: this.hooks.getRiceCableVisualScale() };
    this.statusTimeline = createTimeline({
      defaults: { ease: 'out(3)' },
      onUpdate: () => this.hooks.setCableVisualScale(state.scale),
      onComplete: () => {
        this.hooks.setCableVisualScale(target);
        this.statusTimeline = null;
      },
    }).add(state, { scale: target, duration: statusId === 'rice-thick-cable' ? 420 : 340 });
  }

  update(elapsed: number): void {
    this.radioGuideEntries.forEach(({ root }, index) => {
      const baseScale = index === 0 ? 0.96 : 0.78;
      const pulse = index === 0 ? 1 + Math.sin(elapsed * 5.4) * 0.08 : 1;
      root.scale.setScalar(baseScale * pulse);
    });
  }

  syncRadioGuide(targets: readonly SkillPresentationTarget[]): void {
    const targetIds = targets.map(({ cableId }) => cableId);
    const currentIds = this.radioGuideEntries.map(({ cableId }) => cableId);
    if (targetIds.length !== currentIds.length || targetIds.some((id, index) => id !== currentIds[index])) {
      this.clearRadioGuide();
      this.radioGuideEntries = targets.map((target, index) => ({
        cableId: target.cableId,
        root: this.createPersistentRadioGuide(index),
      }));
    }
    const screenUp = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion);
    const screenRight = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
    const inverseCamera = this.camera.quaternion.clone().invert();
    targets.forEach((target, index) => {
      const entry = this.radioGuideEntries[index];
      if (!entry) return;
      const cameraDirection = (target.direction ?? screenUp).clone().normalize().applyQuaternion(inverseCamera);
      const projectedDirection = new THREE.Vector2(cameraDirection.x, cameraDirection.y);
      if (projectedDirection.lengthSq() > 0.001) projectedDirection.normalize();

      // A plug pointing toward the top of the screen occupies the same space as the
      // normal label offset. Move those labels sideways while keeping them above
      // the plug, so the marker never sits inside the plug head.
      const upwardOverlap = THREE.MathUtils.smoothstep(projectedDirection.y, 0.2, 0.86);
      const stableSide = index % 2 === 0 ? 1 : -1;
      const lateralOffset = stableSide * upwardOverlap * 0.5;
      const verticalOffset = 0.79 - upwardOverlap * 0.08;
      entry.root.position
        .copy(target.position)
        .addScaledVector(screenUp, verticalOffset)
        .addScaledVector(screenRight, lateralOffset);

      const tail = entry.root.getObjectByName('radio-guide-tail');
      if (tail) {
        const towardPlug = new THREE.Vector2(-lateralOffset, -verticalOffset).normalize();
        tail.position.set(towardPlug.x * 0.47, towardPlug.y * 0.37, 0.095);
        tail.rotation.z = Math.atan2(-towardPlug.x, towardPlug.y);
      }
    });
  }

  render(): void {
    this.transient.traverse((object) => {
      if (object.userData.skillBillboard === true) object.quaternion.copy(this.camera.quaternion);
    });
    this.radioGuide.traverse((object) => {
      if (object.userData.skillBillboard === true) object.quaternion.copy(this.camera.quaternion);
    });
    this.cssRenderer.render(this.scene, this.camera);
  }

  resize(width: number, height: number): void {
    this.cssRenderer.setSize(Math.max(1, width), Math.max(1, height));
    this.transient.traverse((object) => {
      const line = object as Line2;
      if (line.material instanceof LineMaterial) line.material.resolution.set(width, height);
    });
  }

  reset(): void {
    this.generation += 1;
    this.cancelTransient(true);
    this.clearRadioGuide();
    this.statusTimeline?.cancel();
    this.statusTimeline = null;
    this.riceVisualScale = 1;
    this.hooks.setCableVisualScale(1);
  }

  complete(): void {
    this.cancelTransient(true);
  }

  freezeForEvidence(timeMs: number): boolean {
    if (!this.timeline || this.diagnosticsValue.skillId === null) return false;
    this.timeline.pause();
    this.timeline.seek(Math.max(0, Math.min(timeMs, this.timeline.duration)), false, true);
    this.transient.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof Line2) {
        object.visible = true;
        if (object.scale.lengthSq() < 0.01) object.scale.setScalar(1);
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
          if ('opacity' in material) material.opacity = Math.max(material.opacity, 0.9);
        });
      }
    });
    if (this.diagnosticsValue.skillId === 'route-broadcast') {
      this.transient.children
        .filter((child) => child.name.startsWith('skill-target-beacon-'))
        .forEach((child) => child.scale.setScalar(0.52));
    } else if (this.diagnosticsValue.skillId === 'rice-thick-cable') {
      const position = new THREE.Vector3();
      const tangent = new THREE.Vector3();
      this.transient.children
        .filter((child) => child.name.startsWith('rice-signal-'))
        .forEach((child, index) => {
          const path = child.userData.skillRicePath as readonly THREE.Vector3[] | undefined;
          if (path) {
            samplePath(path, 0.48 + (index % 2) * 0.12, position, tangent);
            child.position.copy(position);
            child.position.y += 0.24;
            child.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), tangent);
          }
          child.scale.setScalar(1.2);
        });
    }
    this.root.updateMatrixWorld(true);
    this.scene.updateMatrixWorld(true);
    return true;
  }

  dispose(): void {
    this.reset();
    this.cssRenderer.domElement.remove();
    this.root.removeFromParent();
    this.materials.forEach((material) => material.dispose());
    this.materials.clear();
    this.radioGuideMaterials.forEach((material) => material.dispose());
    this.radioGuideMaterials.clear();
  }

  private playRadio(resolution: SkillResolution, targets: readonly SkillPresentationTarget[], token: number): number {
    const timeline = this.makeTimeline(token);
    timeline.label('cue', 0);
    timeline.call(() => this.setPhase('target-lock', token), 0);
    timeline.call(() => this.setPhase('commit', token), 180);
    timeline.call(() => this.setPhase('result', token), 360);
    timeline.call(() => this.finishTimeline(token), 520);
    this.diagnosticsValue = { ...this.diagnosticsValue, labelCount: 0, lineCount: 0, meshCount: 0 };
    void resolution;
    void targets;
    return 560;
  }

  private playRiceCooker(resolution: SkillResolution, targets: readonly SkillPresentationTarget[], token: number): number {
    const selected = targets.length > 0 ? targets.slice(0, 12) : [{
      cableId: 'fallback',
      position: new THREE.Vector3(0, 0.3, 0),
      path: [new THREE.Vector3(-0.4, 0.3, 0), new THREE.Vector3(0.4, 0.3, 0)],
    }];
    const grainGeometry = createLowPolyRiceGeometry();
    const creaseGeometry = new THREE.CylinderGeometry(0.008, 0.008, 0.11, 4);
    creaseGeometry.rotateZ(Math.PI * 0.5);
    const bodyMaterials = [makeOccludedMaterial(0xfff2bd), makeOccludedMaterial(0xf0bd55)];
    const creaseMaterial = makeOccludedMaterial(0x9f743f);
    bodyMaterials.forEach((material) => this.materials.add(material));
    this.materials.add(creaseMaterial);
    const grains: Array<{
      root: THREE.Group;
      path: readonly THREE.Vector3[];
      state: { scale: number; progress: number; turn: number };
    }> = [];
    selected.forEach((target, index) => {
      const fallbackPath = [target.position.clone().add(new THREE.Vector3(-0.45, 0, 0)), target.position];
      const path = target.path && target.path.length > 1 ? target.path : fallbackPath;
      for (let grainIndex = 0; grainIndex < 2; grainIndex += 1) {
        const root = new THREE.Group();
        root.name = `rice-signal-${target.cableId}-${grainIndex + 1}`;
        root.userData.skillRicePath = path;
        root.scale.setScalar(0.01);
        const body = new THREE.Mesh(grainGeometry, bodyMaterials[grainIndex]);
        body.renderOrder = 90;
        const crease = new THREE.Mesh(creaseGeometry, creaseMaterial);
        crease.position.y = 0.052;
        crease.renderOrder = 91;
        root.add(body, crease);
        this.transient.add(root);
        grains.push({
          root,
          path,
          state: { scale: 0.01, progress: -0.18 - grainIndex * 0.14, turn: index * 0.3 },
        });
      }
    });
    const samplePosition = new THREE.Vector3();
    const sampleTangent = new THREE.Vector3();
    const localX = new THREE.Vector3(1, 0, 0);
    const updateGrain = (grain: typeof grains[number]): void => {
      const progress = THREE.MathUtils.clamp(grain.state.progress, 0, 1);
      samplePath(grain.path, progress, samplePosition, sampleTangent);
      grain.root.position.copy(samplePosition);
      grain.root.position.y += 0.12 + Math.sin(progress * Math.PI) * 0.16;
      grain.root.quaternion.setFromUnitVectors(localX, sampleTangent);
      grain.root.rotateX(grain.state.turn);
      grain.root.scale.setScalar(grain.state.scale * THREE.MathUtils.smoothstep(progress, 0, 0.1) * 1.65);
    };
    const timeline = this.makeTimeline(token);
    timeline.call(() => this.setPhase('target-lock', token), 120);
    grains.forEach((grain, index) => {
      timeline.add(grain.state, {
        scale: 1.4,
        progress: 1,
        turn: grain.state.turn + Math.PI * 1.2,
        duration: 500,
        ease: 'inOut(2)',
        onUpdate: () => updateGrain(grain),
      }, 120 + (index % 2) * 80);
    });
    timeline.call(() => this.setPhase('commit', token), 430);
    timeline.call(() => this.setPhase('impact', token), 620);
    const thickness = { scale: this.hooks.getRiceCableVisualScale() };
    timeline.add(thickness, {
      scale: 1.5,
      duration: 420,
      ease: 'outBack(1.15)',
      onUpdate: () => this.hooks.setCableVisualScale(thickness.scale),
      onComplete: () => {
        this.riceVisualScale = 1.5;
        this.hooks.setCableVisualScale(1.5);
      },
    }, 620);
    timeline.call(() => this.setPhase('result', token), 960);
    grains.forEach((grain, index) => timeline.add(grain.state, {
      scale: 0,
      progress: 1.06,
      duration: 220,
      onUpdate: () => updateGrain(grain),
    }, 980 + index * 12));
    timeline.call(() => this.finishTimeline(token), 1320);

    this.diagnosticsValue = { ...this.diagnosticsValue, meshCount: grains.length };
    void resolution;
    return 1380;
  }

  private playStandMixer(targets: readonly SkillPresentationTarget[], token: number): number {
    const selected = targets.filter((target) => target.path && target.path.length > 1);
    this.sweepCableIds = new Set(selected.map(({ cableId }) => cableId));
    const sweep = { progress: -0.16, strength: 0, pass: 1 };
    const applySweep = (): void => {
      const color = sweep.pass === 1 ? PAL.purple : 0x76d4cc;
      selected.forEach(({ cableId }) => this.hooks.setCableSkillSweep(
        cableId,
        sweep.progress,
        sweep.strength,
        color,
      ));
    };
    const timeline = this.makeTimeline(token);
    timeline.call(() => this.setPhase('target-lock', token), 100);
    timeline.add(sweep, {
      progress: 1.16,
      strength: 1,
      duration: 680,
      ease: 'inOut(2)',
      onUpdate: applySweep,
    }, 120);
    timeline.call(() => {
      sweep.pass = 2;
      this.setPhase('commit', token);
    }, 820);
    timeline.add(sweep, {
      progress: -0.16,
      strength: 0.86,
      duration: 680,
      ease: 'inOut(2)',
      onUpdate: applySweep,
    }, 840);
    timeline.call(() => this.setPhase('impact', token), 1_540);
    timeline.add(sweep, {
      strength: 0,
      duration: 180,
      ease: 'out(3)',
      onUpdate: applySweep,
    }, 1_540);
    timeline.call(() => this.setPhase('result', token), 1_740);
    timeline.call(() => this.finishTimeline(token), 1_860);
    this.diagnosticsValue = {
      ...this.diagnosticsValue,
      lineCount: selected.length,
      meshCount: 0,
      sweepPassCount: 2,
      sweepActiveCableCount: selected.length,
    };
    return 1_920;
  }

  private playBlender(
    resolution: SkillResolution,
    targets: readonly SkillPresentationTarget[],
    token: number,
  ): number {
    const changes = resolution.commands.flatMap((command) => (
      command.type === 'recolor' ? command.changes : []
    ));
    const palette = [...new Set(changes.map(({ color }) => color))];
    this.colorShuffleCableIds = new Set(changes.map(({ cableId }) => cableId));
    const offsets = new Map(changes.map(({ cableId }, index) => {
      let hash = 2166136261;
      for (let character = 0; character < cableId.length; character += 1) {
        hash = Math.imul(hash ^ cableId.charCodeAt(character), 16777619) >>> 0;
      }
      return [cableId, ((hash % 997) / 997) * Math.max(1, palette.length) + index * 0.37] as const;
    }));
    const state = { progress: 0 };
    const previewColor = new THREE.Color();
    const applyPreview = (): void => {
      if (token !== this.generation || palette.length === 0) return;
      const progress = THREE.MathUtils.clamp(state.progress, 0, 1);
      const colorCycle = resolveBlenderColorCycle(progress);
      const cyclePosition = colorCycle.position;
      let peakStrength = 0;
      changes.forEach((change, index) => {
        const phase = cyclePosition + (offsets.get(change.cableId) ?? index);
        let paletteIndex = Math.floor(phase) % palette.length;
        const baseColor = this.hooks.getCableBaseColor(change.cableId);
        if (palette.length > 1 && palette[paletteIndex] === baseColor) {
          paletteIndex = (paletteIndex + 1) % palette.length;
        }
        const paletteColor = palette[paletteIndex] ?? change.color;
        previewColor.set(paletteColor);
        const strength = 1;
        peakStrength = Math.max(peakStrength, strength);
        this.hooks.setCableSkillTint(change.cableId, previewColor.getHex(), strength, 0);
      });
      this.diagnosticsValue = {
        ...this.diagnosticsValue,
        colorCycleCount: Math.floor(cyclePosition),
        colorCycleSpeed: colorCycle.speed,
        colorPreviewStrength: peakStrength,
        colorPreviewActiveCableCount: changes.length,
      };
    };
    const clearPreview = (): void => {
      this.colorShuffleCableIds.forEach((cableId) => (
        this.hooks.setCableSkillTint(cableId, null, 0, 0)
      ));
    };
    const timeline = this.makeTimeline(token);
    timeline.call(() => this.setPhase('target-lock', token), 120);
    timeline.add(state, {
      progress: 1,
      duration: 4_400,
      ease: 'linear',
      onUpdate: applyPreview,
    }, 180);
    timeline.call(() => {
      if (token !== this.generation) return;
      clearPreview();
      this.hooks.commitCableColors(changes);
      this.setPhase('commit', token);
      this.diagnosticsValue = {
        ...this.diagnosticsValue,
        colorCommitCount: changes.length,
        colorPreviewActiveCableCount: 0,
      };
    }, 4_680);
    timeline.call(() => this.setPhase('result', token), 4_840);
    timeline.call(() => this.finishTimeline(token), 5_120);
    this.diagnosticsValue = {
      ...this.diagnosticsValue,
      lineCount: targets.length,
      meshCount: 0,
      colorPreviewActiveCableCount: changes.length,
    };
    return 5_200;
  }

  private playRobotVacuum(resolution: SkillResolution, targets: readonly SkillPresentationTarget[], token: number): number {
    const timeline = this.makeTimeline(token);
    timeline.call(() => this.setPhase('target-lock', token), 0);
    const commitAt = 520;
    timeline.call(() => this.setPhase('commit', token), commitAt);
    this.scheduleAutoRemovals(resolution.targetCableIds, token, commitAt);
    const lastCommitAt = commitAt + Math.max(0, resolution.targetCableIds.length - 1) * 100;
    const resultAt = lastCommitAt + 520;
    timeline.call(() => this.setPhase('result', token), resultAt);
    timeline.call(() => this.finishTimeline(token), resultAt + 320);

    this.diagnosticsValue = {
      ...this.diagnosticsValue,
      meshCount: 0,
      autoRemovalOrder: [],
      autoRemovalStartsMs: [],
    };
    void targets;
    return resultAt + 380;
  }

  private createPersistentRadioGuide(index: number): THREE.Group {
    const root = new THREE.Group();
    root.name = `radio-route-guide-${index + 1}`;
    root.userData.skillBillboard = true;
    root.renderOrder = 150;
    const material = (color: number): THREE.MeshToonMaterial => {
      const result = makeMaterial(color);
      // Sky clouds are transparent and Three.js renders the transparent queue
      // after opaque objects. Keep the guide fully opaque visually, but place
      // it in that same queue so its high renderOrder can put it above clouds.
      result.transparent = true;
      result.opacity = 1;
      result.needsUpdate = true;
      this.radioGuideMaterials.add(result);
      return result;
    };
    const plateMaterial = material(index === 0 ? 0xfff1cf : 0xfff8e8);
    const frameMaterial = flat(index === 0 ? PAL.blossomDeep : 0x5fc9c1);
    frameMaterial.transparent = true;
    frameMaterial.opacity = 1;
    frameMaterial.depthTest = false;
    frameMaterial.depthWrite = false;
    frameMaterial.needsUpdate = true;
    this.radioGuideMaterials.add(frameMaterial);
    const inkMaterial = flat(0x453b58);
    inkMaterial.transparent = true;
    inkMaterial.opacity = 1;
    inkMaterial.depthTest = false;
    inkMaterial.depthWrite = false;
    inkMaterial.needsUpdate = true;
    this.radioGuideMaterials.add(inkMaterial);
    const darkMaterial = material(0x453b58);
    const signalMaterial = material(index === 0 ? PAL.blossomDeep : 0x5fc9c1);

    const makePlateGeometry = (scale = 1, volumetric = true): THREE.BufferGeometry => {
      const shape = new THREE.Shape();
      shape.moveTo(-0.43 * scale, -0.3 * scale);
      shape.lineTo(0.31 * scale, -0.32 * scale);
      shape.lineTo(0.43 * scale, -0.19 * scale);
      shape.lineTo(0.41 * scale, 0.25 * scale);
      shape.lineTo(0.29 * scale, 0.34 * scale);
      shape.lineTo(-0.35 * scale, 0.32 * scale);
      shape.lineTo(-0.44 * scale, 0.18 * scale);
      shape.closePath();
      if (!volumetric) {
        // The bubble is one outlined object. The inset color is intentionally a
        // flat face so its own perimeter cannot create a second dark contour.
        return new THREE.ShapeGeometry(shape);
      }
      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: 0.07,
        // The appliance/cable outline shader needs a volumetric silhouette.
        // A single flat billboard only exposes its side faces, which made the
        // old radio bubble outline look thin and broken while moving.
        bevelEnabled: true,
        bevelThickness: 0.028,
        bevelSize: 0.026,
        bevelOffset: 0,
        bevelSegments: 1,
        curveSegments: 1,
      });
      geometry.translate(0, 0, -0.035);
      return geometry;
    };

    const outerInk = new THREE.Mesh(makePlateGeometry(1.055), inkMaterial);
    outerInk.name = 'radio-guide-outer-ink';
    outerInk.renderOrder = 149;
    outerInk.userData.outlineTier = 'main';
    outerInk.userData.outlineStable = true;
    root.add(outerInk);

    const frame = new THREE.Mesh(makePlateGeometry(), frameMaterial);
    frame.name = 'radio-guide-frame';
    frame.renderOrder = 150;
    root.add(frame);

    const plate = new THREE.Mesh(makePlateGeometry(0.88, false), plateMaterial);
    plate.name = 'radio-guide-bubble';
    plate.position.z = 0.055;
    plate.renderOrder = 153;
    root.add(plate);

    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.22, 3), frameMaterial);
    tail.name = 'radio-guide-tail';
    tail.position.set(0, -0.37, 0.095);
    tail.rotation.z = Math.PI;
    tail.renderOrder = 151;
    root.add(tail);

    const mast = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.36, 4), darkMaterial);
    mast.name = 'radio-guide-mast';
    mast.position.set(0, -0.025, 0.13);
    mast.renderOrder = 154;
    root.add(mast);
    const cap = new THREE.Mesh(new THREE.OctahedronGeometry(0.075, 0), signalMaterial);
    cap.position.set(0, 0.19, 0.14);
    cap.renderOrder = 155;
    root.add(cap);
    [-1, 1].forEach((side) => {
      [0, 1].forEach((level) => {
        const wave = new THREE.Mesh(
          new THREE.BoxGeometry(0.19 + level * 0.07, level === 0 ? 0.065 : 0.055, 0.065),
          signalMaterial,
        );
        wave.position.set(side * (0.2 + level * 0.085), 0.07 - level * 0.12, 0.14);
        wave.rotation.z = side * (0.38 + level * 0.05);
        wave.renderOrder = 154;
        root.add(wave);
      });
    });
    this.radioGuide.add(root);
    return root;
  }

  private clearRadioGuide(): void {
    this.clearGroup(this.radioGuide);
    this.radioGuideEntries = [];
    this.radioGuideMaterials.forEach((material) => material.dispose());
    this.radioGuideMaterials.clear();
  }

  private makeTimeline(token: number): Timeline {
    this.timeline?.cancel();
    const timeline = createTimeline({
      defaults: { ease: 'out(3)' },
      onComplete: () => { if (token === this.generation) this.finishTimeline(token); },
    });
    this.timeline = timeline;
    return timeline;
  }

  private setPhase(phase: PresentationPhase, token: number): void {
    if (token !== this.generation || this.diagnosticsValue.phase === phase) return;
    this.diagnosticsValue = {
      ...this.diagnosticsValue,
      phase,
      phaseHistory: [...this.diagnosticsValue.phaseHistory, phase],
    };
  }

  private finishTimeline(token: number): void {
    if (token !== this.generation) return;
    this.setPhase('settle', token);
    this.diagnosticsValue = { ...this.diagnosticsValue, activeTimelines: 0 };
  }

  private scheduleAutoRemovals(cableIds: readonly string[], token: number, delay: number): void {
    const commitNext = (index: number): void => {
      if (index >= cableIds.length || token !== this.generation) return;
      const timer = window.setTimeout(() => {
        this.transientTimers.delete(timer);
        if (token !== this.generation) return;
        const cableId = cableIds[index];
        this.hooks.commitAutoRemoval(cableId);
        if (this.diagnosticsValue.phase === 'commit' || this.diagnosticsValue.phase === 'target-lock') {
          this.setPhase('impact', token);
        }
        this.diagnosticsValue = {
          ...this.diagnosticsValue,
          autoRemovalOrder: [...this.diagnosticsValue.autoRemovalOrder, cableId],
          autoRemovalStartsMs: [...this.diagnosticsValue.autoRemovalStartsMs, performance.now()],
        };
        commitNext(index + 1);
      }, index === 0 ? delay : 100);
      this.transientTimers.add(timer);
    };
    commitNext(0);
  }

  private cancelTransient(countCleanup: boolean): void {
    const lastAutoRemovalOrder = this.diagnosticsValue.autoRemovalOrder;
    const lastAutoRemovalStartsMs = this.diagnosticsValue.autoRemovalStartsMs;
    const lastRadioPulseOrder = this.diagnosticsValue.radioPulseOrder;
    const phaseHistory = this.diagnosticsValue.skillId === null
      ? this.diagnosticsValue.phaseHistory
      : [
          ...this.diagnosticsValue.phaseHistory,
          ...(this.diagnosticsValue.phaseHistory.includes('settle') ? [] : ['settle' as const]),
          'cleanup' as const,
        ];
    this.timeline?.cancel();
    this.timeline = null;
    this.transientTimers.forEach((timer) => window.clearTimeout(timer));
    this.transientTimers.clear();
    this.sweepCableIds.forEach((cableId) => this.hooks.setCableSkillSweep(cableId, 0, 0, PAL.purple));
    this.sweepCableIds.clear();
    this.colorShuffleCableIds.forEach((cableId) => this.hooks.setCableSkillTint(cableId, null, 0, 0));
    this.colorShuffleCableIds.clear();
    this.clearGroup(this.transient);
    this.diagnosticsValue = {
      ...emptyDiagnostics(),
      cleanupCount: this.diagnosticsValue.cleanupCount + Number(countCleanup || this.diagnosticsValue.skillId !== null),
      riceCableVisualScale: this.hooks.getRiceCableVisualScale(),
      autoRemovalOrder: lastAutoRemovalOrder,
      autoRemovalStartsMs: lastAutoRemovalStartsMs,
      radioPulseOrder: lastRadioPulseOrder,
      phaseHistory,
      sweepPassCount: this.diagnosticsValue.sweepPassCount,
      sweepActiveCableCount: this.diagnosticsValue.sweepActiveCableCount,
    };
  }

  private clearGroup(group: THREE.Group): void {
    [...group.children].forEach((child) => {
      child.removeFromParent();
      child.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof Line2) {
          object.geometry.dispose();
          const objectMaterials = Array.isArray(object.material) ? object.material : [object.material];
          objectMaterials.forEach((material) => {
            if (!this.materials.has(material)) return;
            material.dispose();
            this.materials.delete(material);
          });
        }
      });
    });
  }
}

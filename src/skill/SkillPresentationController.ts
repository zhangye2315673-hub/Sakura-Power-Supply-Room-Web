import * as THREE from 'three';
import { createTimeline, type Timeline } from 'animejs';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { PAL } from '../style/palette';
import { cel } from '../style/toon';
import type { SkillResolution, SkillStatusId } from './SkillChallengeEngine';

type PresentationPhase = 'idle' | 'cue' | 'target-lock' | 'commit' | 'impact' | 'result' | 'settle' | 'cleanup';

export type SkillPresentationTarget = Readonly<{
  cableId: string;
  position: THREE.Vector3;
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
  cleanupCount: number;
}>;

export type SkillPresentationHooks = Readonly<{
  commitAutoRemoval: (cableId: string) => boolean;
  setCableVisualScale: (scale: number) => void;
  getRiceCableVisualScale: () => number;
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
  cleanupCount: 0,
});

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
  private readonly materials = new Set<THREE.Material>();
  private timeline: Timeline | null = null;
  private statusTimeline: Timeline | null = null;
  private readonly transientTimers = new Set<number>();
  private generation = 0;
  private diagnosticsValue = emptyDiagnostics();
  private riceVisualScale = 1;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly camera: THREE.Camera,
    private readonly hooks: SkillPresentationHooks,
  ) {
    this.root.name = 'skill-presentation-root';
    this.transient.name = 'skill-presentation-transient';
    this.root.add(this.transient);
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
    if (resolution.appliance === 'robot-vacuum') return this.playRobotVacuum(resolution, normalizedTargets, token);
    if (resolution.appliance === 'rice-cooker') return this.playRiceCooker(resolution, normalizedTargets, token);
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

  update(): void {
    // Anime.js owns timing. This is the stable Game-loop hook for future
    // per-frame occlusion and reduced-motion handling.
  }

  render(): void {
    this.transient.traverse((object) => {
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
      if (object instanceof CSS2DObject) {
        object.element.style.opacity = '1';
        object.element.style.transform = 'translate(-50%, -50%) scale(1)';
        return;
      }
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
    } else if (this.diagnosticsValue.skillId === 'snapshot-sweep') {
      this.transient.children
        .filter((child) => child.name.startsWith('skill-target-beacon-'))
        .forEach((child) => child.scale.setScalar(0.58));
      const scan = this.transient.getObjectByName('robot-vacuum-lidar-scan');
      scan?.scale.setScalar(1.35);
      if (scan instanceof THREE.Mesh && 'opacity' in scan.material) scan.material.opacity = 0.46;
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
  }

  private playRadio(resolution: SkillResolution, targets: readonly SkillPresentationTarget[], token: number): number {
    const points = targets.slice(0, 3).map((target) => target.position.clone());
    const labels = points.map((point, index) => this.createNumberLabel(index + 1, point));
    const nodes = points.map((point, index) => this.createRadioBeacon(point, index));
    const lines = points.length > 1 ? [this.createRouteLine(points)] : [];
    const labelStates = labels.map(({ element }) => {
      Object.assign(element.style, { opacity: '0', transform: 'translate(-50%, -50%) scale(0.45)' });
      return { opacity: 0, scale: 0.45 };
    });
    const nodeStates = nodes.map(() => ({ scale: 0.2, turn: 0 }));
    nodes.forEach((node) => node.scale.setScalar(0.2));
    const lineState = { opacity: 0, dash: 0 };
    lines.forEach((line) => { line.material.opacity = 0; line.material.dashOffset = 0; });

    const timeline = this.makeTimeline(token);
    timeline.label('cue', 0);
    // The confirmed radio grammar is 123—123, not one simultaneous flash.
    for (let pass = 0; pass < 2; pass += 1) {
      points.forEach((_, index) => {
        const at = pass * 1120 + index * 320;
        timeline.call(() => this.setPhase('target-lock', token), at);
        timeline.call(() => {
          if (token !== this.generation) return;
          this.diagnosticsValue = {
            ...this.diagnosticsValue,
            radioPulseOrder: [...this.diagnosticsValue.radioPulseOrder, index + 1],
          };
        }, at);
        timeline.add(labelStates[index], {
          opacity: 1,
          scale: pass === 0 ? 1 : 1.08,
          duration: 150,
          ease: 'outBack(1.7)',
          onUpdate: () => {
            const { element } = labels[index];
            const state = labelStates[index];
            element.style.opacity = `${state.opacity}`;
            element.style.transform = `translate(-50%, -50%) scale(${state.scale})`;
          },
        }, at);
        timeline.add(nodeStates[index], {
          scale: pass === 0 ? 0.52 : 0.58,
          turn: nodeStates[index].turn + Math.PI * 0.32,
          duration: 150,
          ease: 'outBack(1.55)',
          onUpdate: () => {
            nodes[index].scale.setScalar(nodeStates[index].scale);
            nodes[index].rotation.z = nodeStates[index].turn;
          },
        }, at);
        timeline.add(labelStates[index], {
          opacity: 0.2,
          scale: 0.72,
          duration: 120,
          onUpdate: () => {
            const { element } = labels[index];
            const state = labelStates[index];
            element.style.opacity = `${state.opacity}`;
            element.style.transform = `translate(-50%, -50%) scale(${state.scale})`;
          },
        }, at + 180);
        timeline.add(nodeStates[index], {
          scale: 0.32,
          duration: 120,
          onUpdate: () => nodes[index].scale.setScalar(nodeStates[index].scale),
        }, at + 180);
      });
    }
    timeline.call(() => this.setPhase('commit', token), 2040);
    timeline.add(lineState, {
      opacity: 0.9,
      dash: -1.4,
      duration: 360,
      ease: 'inOut(2)',
      onUpdate: () => lines.forEach((line) => {
        line.material.opacity = lineState.opacity;
        line.material.dashOffset = lineState.dash;
      }),
    }, 2040);
    timeline.call(() => this.setPhase('impact', token), 2220);
    timeline.call(() => this.setPhase('result', token), 2400);
    timeline.add(lineState, {
      opacity: 0,
      duration: 220,
      onUpdate: () => lines.forEach((line) => { line.material.opacity = lineState.opacity; }),
    }, 2420);
    labelStates.forEach((state, index) => timeline.add(state, {
      opacity: 0,
      scale: 0.72,
      duration: 200,
      onUpdate: () => {
        const { element } = labels[index];
        element.style.opacity = `${state.opacity}`;
        element.style.transform = `translate(-50%, -50%) scale(${state.scale})`;
      },
    }, 2440 + index * 50));
    timeline.call(() => this.finishTimeline(token), 2760);

    this.diagnosticsValue = { ...this.diagnosticsValue, labelCount: labels.length, lineCount: lines.length, meshCount: nodes.length };
    void resolution;
    return 2820;
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

  private playRobotVacuum(resolution: SkillResolution, targets: readonly SkillPresentationTarget[], token: number): number {
    const points = targets.map((target) => target.position.clone());
    const beacons = points.map((point, index) => this.createRobotVacuumBeacon(point, index));
    const scanCenter = points.length > 0
      ? points.reduce((sum, point) => sum.add(point), new THREE.Vector3()).multiplyScalar(1 / points.length)
      : new THREE.Vector3();
    const scanMaterial = makeMaterial(0x75d8ca);
    scanMaterial.transparent = true;
    scanMaterial.opacity = 0;
    scanMaterial.depthWrite = false;
    this.materials.add(scanMaterial);
    const scan = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.035, 5, 20), scanMaterial);
    scan.name = 'robot-vacuum-lidar-scan';
    scan.renderOrder = 89;
    scan.position.copy(scanCenter);
    scan.userData.skillBillboard = true;
    scan.scale.setScalar(0.1);
    this.transient.add(scan);

    const scanState = { scale: 0.1, opacity: 0 };
    const timeline = this.makeTimeline(token);
    timeline.call(() => this.setPhase('target-lock', token), 0);
    timeline.add(scanState, {
      scale: 3.2,
      opacity: 0.75,
      duration: 520,
      ease: 'out(3)',
      onUpdate: () => {
        scan.scale.setScalar(scanState.scale);
        scanMaterial.opacity = scanState.opacity;
        scan.rotation.z += 0.025;
      },
    }, 0);
    beacons.forEach((beacon, index) => {
      const state = { scale: 0.08, turn: 0 };
      beacon.scale.setScalar(0.08);
      timeline.add(state, {
        scale: 0.58,
        turn: Math.PI * 0.45,
        duration: 250,
        ease: 'outBack(1.5)',
        onUpdate: () => { beacon.scale.setScalar(state.scale); beacon.rotation.z = state.turn; },
      }, 180 + index * 70);
    });
    const commitAt = 520;
    timeline.call(() => this.setPhase('commit', token), commitAt);
    this.scheduleAutoRemovals(resolution.targetCableIds, token, commitAt);
    const lastCommitAt = commitAt + Math.max(0, resolution.targetCableIds.length - 1) * 100;
    const resultAt = lastCommitAt + 520;
    timeline.call(() => this.setPhase('result', token), resultAt);
    timeline.add(scanState, {
      opacity: 0,
      scale: 3.8,
      duration: 260,
      onUpdate: () => { scan.scale.setScalar(scanState.scale); scanMaterial.opacity = scanState.opacity; },
    }, resultAt);
    timeline.call(() => this.finishTimeline(token), resultAt + 320);

    this.diagnosticsValue = {
      ...this.diagnosticsValue,
      meshCount: beacons.length + 1,
      autoRemovalOrder: [],
      autoRemovalStartsMs: [],
    };
    return resultAt + 380;
  }

  private createNumberLabel(value: number, position: THREE.Vector3): CSS2DObject {
    const element = document.createElement('div');
    element.className = 'skill-world-number';
    element.textContent = `${value}`;
    const label = new CSS2DObject(element);
    label.name = `skill-world-number-${value}`;
    label.position.copy(position).add(new THREE.Vector3(0, 0.54, 0));
    this.transient.add(label);
    return label;
  }

  private createShieldFrame(position: THREE.Vector3, index: number, accent: number): THREE.Group {
    const group = new THREE.Group();
    group.name = `skill-target-beacon-${index + 1}`;
    group.position.copy(position).add(new THREE.Vector3(0, 0.2, 0));
    group.userData.skillBillboard = true;
    const material = makeMaterial(accent);
    this.materials.add(material);
    const points = [
      new THREE.Vector2(0, 0.35), new THREE.Vector2(0.3, 0.22),
      new THREE.Vector2(0.25, -0.13), new THREE.Vector2(0, -0.35),
      new THREE.Vector2(-0.25, -0.13), new THREE.Vector2(-0.3, 0.22),
    ];
    points.forEach((start, pointIndex) => {
      const end = points[(pointIndex + 1) % points.length];
      const delta = end.clone().sub(start);
      const bar = new THREE.Mesh(new THREE.BoxGeometry(delta.length(), 0.055, 0.055), material);
      bar.position.set((start.x + end.x) * 0.5, (start.y + end.y) * 0.5, 0);
      bar.rotation.z = Math.atan2(delta.y, delta.x);
      bar.renderOrder = 90;
      group.add(bar);
    });
    this.transient.add(group);
    return group;
  }

  private createRadioBeacon(position: THREE.Vector3, index: number): THREE.Group {
    const group = this.createShieldFrame(position, index, index === 1 ? PAL.yellow : 0x75d8ca);
    const dark = makeMaterial(0x453b58);
    const signal = makeMaterial(index === 1 ? 0xf09a55 : PAL.blossomDeep);
    this.materials.add(dark);
    this.materials.add(signal);
    const mast = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.27, 3), dark);
    mast.position.y = -0.02;
    mast.renderOrder = 91;
    const cap = new THREE.Mesh(new THREE.OctahedronGeometry(0.045, 0), signal);
    cap.position.y = 0.14;
    cap.renderOrder = 92;
    group.add(mast, cap);
    [-1, 1].forEach((side) => {
      [0, 1].forEach((level) => {
        const wave = new THREE.Mesh(new THREE.BoxGeometry(0.11 + level * 0.035, 0.045, 0.05), signal);
        wave.position.set(side * (0.14 + level * 0.055), 0.04 - level * 0.075, 0.015);
        wave.rotation.z = side * (0.26 + level * 0.08);
        wave.renderOrder = 91;
        group.add(wave);
      });
    });
    return group;
  }

  private createRobotVacuumBeacon(position: THREE.Vector3, index: number): THREE.Group {
    const group = this.createShieldFrame(position, index, index % 2 === 0 ? PAL.blossomDeep : PAL.yellow);
    const bodyMaterial = makeMaterial(0x75d8ca);
    const dark = makeMaterial(0x453b58);
    const brushMaterial = makeMaterial(0xf09a75);
    this.materials.add(bodyMaterial);
    this.materials.add(dark);
    this.materials.add(brushMaterial);
    const chassis = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.075, 8), bodyMaterial);
    chassis.rotation.x = Math.PI * 0.5;
    chassis.position.y = -0.025;
    chassis.renderOrder = 91;
    const lidar = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.055, 8), dark);
    lidar.rotation.x = Math.PI * 0.5;
    lidar.position.set(0.03, 0.045, 0.055);
    lidar.renderOrder = 92;
    const bumper = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.035, 0.055), dark);
    bumper.position.set(0, 0.115, 0.04);
    bumper.renderOrder = 92;
    group.add(chassis, lidar, bumper);
    [-1, 1].forEach((side) => {
      const brush = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.13, 3), brushMaterial);
      brush.position.set(side * 0.18, -0.12, 0.025);
      brush.rotation.z = side * 0.55;
      brush.renderOrder = 91;
      group.add(brush);
    });
    return group;
  }

  private createRouteLine(points: readonly THREE.Vector3[]): Line2 {
    const geometry = new LineGeometry();
    geometry.setPositions(points.flatMap((point) => [point.x, point.y + 0.18, point.z]));
    const material = new LineMaterial({
      color: 0x5fc9c1,
      linewidth: 3.2,
      transparent: true,
      opacity: 0,
      dashed: true,
      dashScale: 1.4,
      dashSize: 0.28,
      gapSize: 0.16,
      depthTest: false,
      depthWrite: false,
    });
    material.resolution.copy(this.getRendererSize());
    this.materials.add(material);
    const line = new Line2(geometry, material);
    line.name = 'skill-route-line';
    line.renderOrder = 89;
    line.computeLineDistances();
    this.transient.add(line);
    return line;
  }

  private getRendererSize(): THREE.Vector2 {
    return new THREE.Vector2(
      this.cssRenderer.domElement.clientWidth || window.innerWidth,
      this.cssRenderer.domElement.clientHeight || window.innerHeight,
    );
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
    this.clearGroup(this.transient);
    this.diagnosticsValue = {
      ...emptyDiagnostics(),
      cleanupCount: this.diagnosticsValue.cleanupCount + Number(countCleanup || this.diagnosticsValue.skillId !== null),
      riceCableVisualScale: this.hooks.getRiceCableVisualScale(),
      autoRemovalOrder: lastAutoRemovalOrder,
      autoRemovalStartsMs: lastAutoRemovalStartsMs,
      radioPulseOrder: lastRadioPulseOrder,
      phaseHistory,
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
        if (object instanceof CSS2DObject) object.element.remove();
      });
    });
  }
}

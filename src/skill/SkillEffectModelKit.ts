import * as THREE from 'three';
import { addHullOutline } from '../style/outline';
import { PAL } from '../style/palette';
import { cel } from '../style/toon';
import type { ApplianceKind } from '../systems/ApplianceCatalog';
import type { SkillChallengeState } from './SkillChallengeEngine';

export type SkillEffectAssetId =
  | 'humidifier-glass-wiper' | 'fan-airflow-ribbon'
  | 'hair-dryer-heat-ribbon'
  | 'bubble-shell-wave-membrane' | 'radio-sequence-markers' | 'kettle-steam-ribbon'
  | 'blender-energy-shards' | 'gacha-card-frame'
  | 'alarm-time-ring' | 'popcorn-target-marker'
  | 'controller-continue-token' | 'controller-impact-star' | 'microwave-double-heat-ring'
  | 'induction-heat-ring' | 'speaker-bass-wave-arcs';

export const SKILL_EFFECT_ASSET_REFERENCES: Readonly<Record<SkillEffectAssetId, string>> = {
  'humidifier-glass-wiper': 'references/skill-effects/intake/humidifier-glass-wiper/reference.png',
  'fan-airflow-ribbon': 'references/skill-effects/intake/fan-airflow-ribbon/reference.png',
  'hair-dryer-heat-ribbon': 'references/skill-effects/intake/hair-dryer-heat-ribbon/reference.png',
  'bubble-shell-wave-membrane': 'references/skill-effects/intake/bubble-shell-wave-membrane/reference.png',
  'radio-sequence-markers': 'references/skill-effects/intake/radio-sequence-markers/reference.png',
  'kettle-steam-ribbon': 'references/skill-effects/intake/kettle-steam-ribbon/reference.png',
  'blender-energy-shards': 'references/skill-effects/intake/blender-energy-shards/reference.png',
  'gacha-card-frame': 'references/skill-effects/intake/gacha-card-frame/reference.png',
  'alarm-time-ring': 'references/skill-effects/intake/alarm-time-ring/reference.png',
  'popcorn-target-marker': 'references/skill-effects/intake/popcorn-target-marker/reference.png',
  'controller-continue-token': 'references/skill-effects/intake/controller-continue-token/reference.png',
  'controller-impact-star': 'references/skill-effects/intake/controller-impact-star/reference.png',
  'microwave-double-heat-ring': 'references/skill-effects/intake/microwave-double-heat-ring/reference.png',
  'induction-heat-ring': 'references/skill-effects/intake/induction-heat-ring/reference.png',
  'speaker-bass-wave-arcs': 'references/skill-effects/intake/speaker-bass-wave-arcs/reference.png',
};

type EffectInstance = { root: THREE.Group; age: number; duration: number; seed: number };

const POPCORN_PLANE_TO_PLUG_DIRECTION = new THREE.Quaternion()
  .setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);

function popcornMarkerQuaternion(plugQuaternion: THREE.Quaternion): THREE.Quaternion {
  return plugQuaternion.clone().multiply(POPCORN_PLANE_TO_PLUG_DIRECTION);
}

const ASSET_BY_APPLIANCE: Partial<Record<ApplianceKind, SkillEffectAssetId>> = {
  'hair-dryer': 'hair-dryer-heat-ribbon',
  radio: 'radio-sequence-markers',
  kettle: 'kettle-steam-ribbon',
  'gumball-machine': 'gacha-card-frame',
  'popcorn-machine': 'popcorn-target-marker',
  'game-controller': 'controller-continue-token',
  microwave: 'microwave-double-heat-ring',
  'portable-speaker': 'speaker-bass-wave-arcs',
};

function polygonShape(points: readonly [number, number][]): THREE.Shape {
  const shape = new THREE.Shape();
  points.forEach(([x, y], index) => index === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y));
  shape.closePath();
  return shape;
}

function starShape(points = 8, outer = 0.58, inner = 0.3): THREE.Shape {
  return polygonShape(Array.from({ length: points * 2 }, (_, index) => {
    const angle = Math.PI * 0.5 + (index * Math.PI) / points;
    const radius = index % 2 === 0 ? outer : inner;
    return [Math.cos(angle) * radius, Math.sin(angle) * radius] as [number, number];
  }));
}

function heartShape(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(0, -0.48);
  shape.bezierCurveTo(-0.72, -0.04, -0.62, 0.52, -0.26, 0.5);
  shape.bezierCurveTo(-0.08, 0.5, 0, 0.34, 0, 0.23);
  shape.bezierCurveTo(0, 0.34, 0.08, 0.5, 0.26, 0.5);
  shape.bezierCurveTo(0.62, 0.52, 0.72, -0.04, 0, -0.48);
  return shape;
}

export class SkillEffectModelKit {
  readonly root = new THREE.Group();
  private readonly persistent = new THREE.Group();
  private readonly transient = new THREE.Group();
  private readonly materials = new Set<THREE.Material>();
  private readonly textures = new Set<THREE.Texture>();
  private heatCoreTexture: THREE.CanvasTexture | null = null;
  private heatArcTexture: THREE.CanvasTexture | null = null;
  private readonly instances: EffectInstance[] = [];
  private readonly pools = new Map<SkillEffectAssetId, THREE.Group[]>();
  private persistentSignature = '';
  private evidenceAsset: SkillEffectAssetId | null = null;

  private readonly coral = this.material(PAL.red, 0x9b414e);
  private readonly teal = this.material(0x49c9c3, 0x2b7285);
  private readonly yellow = this.material(0xffd45a, 0xb5653b, 0xff9d38, 0.22);
  private readonly cream = this.material(PAL.paper, 0xb8a4bd);
  private readonly purple = this.material(0xa98dd5, 0x66547e);
  private readonly ice = this.material(0x8ee8ff, 0x407cad, 0x73dfff, 0.2, true, 0.72);
  private readonly bubble = this.material(0xc8b9ff, 0x6f70a5, 0xbecbff, 0.2, true, 0.34);

  constructor() {
    this.root.name = 'skill-effect-model-kit';
    this.persistent.name = 'skill-effect-persistent';
    this.transient.name = 'skill-effect-transient';
    this.root.add(this.persistent, this.transient);
    this.root.userData.sculptRuntime = {
      nodes: { root: this.root, persistent: this.persistent, transient: this.transient },
      sockets: { scene: this.root },
      pivots: ['cue-pivot', 'pulse-pivot', 'flip-pivot', 'attachment-socket'],
      pooledAssets: Object.keys(SKILL_EFFECT_ASSET_REFERENCES),
      referenceRoot: 'references/skill-effects/intake',
    };
  }

  get activeAssetIds(): string[] {
    const assets = new Set<string>();
    this.root.traverse((object) => {
      if (typeof object.userData.assetId === 'string') assets.add(object.userData.assetId);
    });
    return [...assets];
  }

  get popcornTransientCount(): number {
    return this.transient.children
      .filter((child) => child.userData.assetId === 'popcorn-target-marker')
      .length;
  }

  get microwaveMarkerDiagnostics(): Array<{
    cableId: string;
    quaternion: [number, number, number, number];
    rings: Array<{ type: string; depthTest: boolean }>;
  }> {
    return this.persistent.children
      .filter((child) => child.userData.assetId === 'microwave-double-heat-ring')
      .map((child) => ({
        cableId: String(child.userData.cableId ?? ''),
        quaternion: child.quaternion.toArray(),
        rings: ['heat-chance-one', 'heat-chance-two'].map((name) => {
          const ring = child.getObjectByName(name);
          const material = ring instanceof THREE.Mesh ? ring.material : null;
          return {
            type: ring?.type ?? 'missing',
            depthTest: material instanceof THREE.Material ? material.depthTest : false,
          };
        }),
      }));
  }

  get popcornMarkerDiagnostics(): Array<{
    cableId: string;
    position: [number, number, number];
    kernelCount: number;
    ringSegmentCount: number;
    rayCount: number;
    ringTubeRadius: number;
    directionAlignment: number;
    orientationMode: string;
    kernelAngularGaps: number[];
  }> {
    return this.persistent.children
      .filter((child) => child.userData.assetId === 'popcorn-target-marker')
      .map((child) => {
        const ringSegment = child.getObjectByName('popcorn-ring-segment-1');
        const ringTubeRadius = ringSegment instanceof THREE.Mesh
          && ringSegment.geometry instanceof THREE.TorusGeometry
          ? ringSegment.geometry.parameters.tube
          : 0;
        const hintDirection = child.userData.hintDirection;
        const markerDirection = new THREE.Vector3(0, 0, 1).applyQuaternion(child.quaternion).normalize();
        const kernelAngles = (child.getObjectByName('popcorn-kernels')?.children ?? [])
          .map((kernel) => kernel.userData.basePosition)
          .filter((position): position is THREE.Vector3 => position instanceof THREE.Vector3)
          .map((position) => Math.atan2(position.y, position.x))
          .sort((a, b) => a - b);
        const kernelAngularGaps = kernelAngles.map((angle, index) => {
          const next = kernelAngles[(index + 1) % kernelAngles.length] ?? angle;
          return (next - angle + Math.PI * 2) % (Math.PI * 2);
        });
        return {
          cableId: String(child.userData.cableId ?? ''),
          position: child.position.toArray(),
          kernelCount: child.getObjectByName('popcorn-kernels')?.children.length ?? 0,
          ringSegmentCount: child.getObjectByName('popcorn-target-ring')?.children.length ?? 0,
          rayCount: child.getObjectByName('popcorn-rays')?.children.length ?? 0,
          ringTubeRadius,
          directionAlignment: hintDirection instanceof THREE.Vector3 ? markerDirection.dot(hintDirection) : 0,
          orientationMode: String(child.userData.orientationMode ?? ''),
          kernelAngularGaps,
        };
      });
  }

  play(appliance: ApplianceKind, targets: readonly THREE.Vector3[] = []): void {
    const asset = ASSET_BY_APPLIANCE[appliance];
    if (!asset || asset === 'popcorn-target-marker') return;
    const root = this.acquire(asset);
    root.name = `skill-effect-${asset}`;
    root.userData.assetId = asset;
    root.userData.referencePath = SKILL_EFFECT_ASSET_REFERENCES[asset];
    root.userData.sculptRuntime = {
      nodes: Object.fromEntries(root.children.map((node) => [node.name, node])),
      sockets: { attachment: root.getObjectByName('attachment-socket') ?? root },
      pivots: ['cue-pivot', 'pulse-pivot', 'flip-pivot'].filter((name) => root.getObjectByName(name)),
    };
    root.position.copy(targets[0] ?? new THREE.Vector3(0, 0.2, 2.1));
    if (targets.length === 0) root.position.z = 3.2;
    root.scale.setScalar(0.001);
    this.transient.add(root);
    this.instances.push({ root, age: 0, duration: asset === 'gacha-card-frame' ? 1.8 : 1.35, seed: this.instances.length * 0.77 });
  }

  showAssetForEvidence(asset: SkillEffectAssetId, yaw = 0): THREE.Group {
    this.reset();
    const model = this.acquire(asset);
    model.name = `skill-effect-evidence-${asset}`;
    model.userData.assetId = asset;
    model.userData.referencePath = SKILL_EFFECT_ASSET_REFERENCES[asset];
    model.userData.baseScale = 2.4;
    model.position.set(0, 0, 3.2);
    model.rotation.y = yaw;
    model.scale.setScalar(2.4);
    this.persistent.add(model);
    this.evidenceAsset = asset;
    this.persistentSignature = `evidence:${asset}`;
    return model;
  }

  syncPersistent(
    state: Readonly<SkillChallengeState>,
    cablePositions: ReadonlyMap<string, THREE.Vector3>,
    cableOrientations: ReadonlyMap<string, THREE.Quaternion>,
    _availablePositions: readonly THREE.Vector3[],
    hintPositions: ReadonlyMap<string, THREE.Vector3>,
    hintOrientations: ReadonlyMap<string, THREE.Quaternion>,
  ): void {
    if (this.evidenceAsset) return;
    this.syncPersistentMarkerTransforms(cablePositions, cableOrientations, hintPositions, hintOrientations);
    const popcornTargetPosition = state.popcornHintCableId
      ? hintPositions.get(state.popcornHintCableId)
      : null;
    const signature = JSON.stringify({
      buff: state.buff?.id ?? null,
      debuff: state.debuff?.id ?? null,
      targets: state.debuff?.targetCableIds ?? [],
      turns: state.debuff?.id === 'overheated-plug' ? state.debuff.turnsRemaining : null,
      cablePositions: [...cablePositions].map(([id, position]) => [id, position.toArray().map((value) => value.toFixed(2))]),
      popcornTarget: state.popcornHintCableId,
      popcornPosition: popcornTargetPosition?.toArray().map((value) => value.toFixed(2)) ?? null,
    });
    if (signature === this.persistentSignature) return;
    this.persistentSignature = signature;
    this.persistent.clear();

    if (state.debuff?.id === 'overheated-plug') {
      state.debuff.targetCableIds.forEach((id) => {
        const marker = this.attach('microwave-double-heat-ring', cablePositions.get(id), 0.72);
        if (marker) {
          marker.userData.cableId = id;
          marker.userData.turnsRemaining = state.debuff?.turnsRemaining ?? 2;
          const orientation = cableOrientations.get(id);
          if (orientation) marker.quaternion.copy(orientation);
        }
      });
    }
    if (state.popcornHintCableId) {
      const marker = this.attach('popcorn-target-marker', hintPositions.get(state.popcornHintCableId), 0.86);
      if (marker) {
        marker.userData.cableId = state.popcornHintCableId;
        marker.userData.anchorPosition = marker.position.clone();
        marker.userData.orientationMode = 'plug-end';
        const orientation = hintOrientations.get(state.popcornHintCableId);
        if (orientation) {
          marker.quaternion.copy(popcornMarkerQuaternion(orientation));
          marker.userData.hintDirection = new THREE.Vector3(0, 1, 0).applyQuaternion(orientation).normalize();
        }
      }
    }
    if (state.buff?.id === 'continue') {
      this.attach('controller-continue-token', new THREE.Vector3(0, -0.15, 1.9), 1.6);
    }
  }

  update(delta: number, elapsed: number): void {
    for (let index = this.instances.length - 1; index >= 0; index -= 1) {
      const instance = this.instances[index];
      instance.age += delta;
      const progress = THREE.MathUtils.clamp(instance.age / instance.duration, 0, 1);
      const enter = THREE.MathUtils.smoothstep(progress, 0, 0.2);
      const exit = 1 - THREE.MathUtils.smoothstep(progress, 0.72, 1);
      instance.root.scale.setScalar(Math.max(0.001, enter * exit * 1.2));
      if (instance.root.userData.assetId === 'popcorn-target-marker') {
        this.updatePopcornBurst(instance.root, progress, elapsed, instance.seed);
      } else {
        instance.root.rotation.y = Math.sin(elapsed * 3.2 + instance.seed) * 0.16;
        instance.root.rotation.z = Math.sin(elapsed * 4.1 + instance.seed) * 0.05;
      }
      if (progress < 1) continue;
      this.release(instance.root);
      this.instances.splice(index, 1);
    }
    this.persistent.children.forEach((child, index) => {
      const asset = child.userData.assetId as SkillEffectAssetId | undefined;
      if (asset === 'microwave-double-heat-ring') {
        this.updateMicrowaveMarker(child, elapsed);
        return;
      }
      if (asset === 'popcorn-target-marker') {
        this.updatePopcornMarker(child, elapsed);
        return;
      }
      const pulse = 1 + Math.sin(elapsed * 3.6 + index * 0.8) * 0.06;
      child.scale.setScalar((Number(child.userData.baseScale) || 1) * pulse);
      child.rotation.y += delta * 0.45;
    });
  }

  reset(): void {
    this.instances.length = 0;
    [...this.transient.children, ...this.persistent.children]
      .filter((child): child is THREE.Group => child instanceof THREE.Group)
      .forEach((child) => this.release(child));
    this.persistentSignature = '';
    this.evidenceAsset = null;
  }

  dispose(): void {
    this.reset();
    const disposed = new Set<THREE.BufferGeometry>();
    const disposeGeometry = (root: THREE.Object3D): void => root.traverse((object) => {
      if (object instanceof THREE.Mesh && !disposed.has(object.geometry)) {
        disposed.add(object.geometry);
        object.geometry.dispose();
      }
    });
    this.pools.forEach((pool) => pool.forEach(disposeGeometry));
    this.pools.clear();
    this.materials.forEach((material) => material.dispose());
    this.materials.clear();
    this.textures.forEach((texture) => texture.dispose());
    this.textures.clear();
    this.root.removeFromParent();
  }

  private attach(asset: SkillEffectAssetId, position?: THREE.Vector3, scale = 0.72): THREE.Group | null {
    if (!position) return null;
    const model = this.acquire(asset);
    model.position.copy(position);
    model.scale.setScalar(scale);
    model.userData.baseScale = scale;
    model.userData.assetId = asset;
    model.userData.referencePath = SKILL_EFFECT_ASSET_REFERENCES[asset];
    this.persistent.add(model);
    return model;
  }

  private acquire(asset: SkillEffectAssetId): THREE.Group {
    const model = this.pools.get(asset)?.pop() ?? this.build(asset);
    model.visible = true;
    model.position.set(0, 0, 0);
    model.rotation.set(0, 0, 0);
    model.scale.setScalar(1);
    model.userData.assetId = asset;
    delete model.userData.anchorPosition;
    delete model.userData.cableId;
    delete model.userData.turnsRemaining;
    return model;
  }

  private release(model: THREE.Group): void {
    const asset = model.userData.assetId as SkillEffectAssetId | undefined;
    model.removeFromParent();
    model.visible = false;
    if (!asset) return;
    const pool = this.pools.get(asset) ?? [];
    if (!this.pools.has(asset)) this.pools.set(asset, pool);
    pool.push(model);
  }

  private material(
    color: THREE.ColorRepresentation,
    tint: THREE.ColorRepresentation,
    emissive: THREE.ColorRepresentation = 0,
    emissiveIntensity = 0,
    transparent = false,
    opacity = 1,
  ): THREE.MeshToonMaterial {
    const material = cel({ color, tint, emissive, emissiveIntensity, transparent, opacity, bands: 3 });
    material.depthWrite = !transparent;
    this.materials.add(material);
    return material;
  }

  private mesh(
    parent: THREE.Object3D,
    name: string,
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    position: readonly [number, number, number] = [0, 0, 0],
    rotation: readonly [number, number, number] = [0, 0, 0],
    scale: readonly [number, number, number] = [1, 1, 1],
    outline = true,
  ): THREE.Mesh {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.position.set(...position);
    mesh.rotation.set(...rotation);
    mesh.scale.set(...scale);
    mesh.castShadow = !material.transparent;
    if (outline) addHullOutline(mesh, 0.006);
    parent.add(mesh);
    return mesh;
  }

  private ring(parent: THREE.Object3D, name: string, radius: number, tube: number, material = this.yellow): THREE.Mesh {
    return this.mesh(parent, name, new THREE.TorusGeometry(radius, tube, 8, 32), material);
  }

  private tube(parent: THREE.Object3D, name: string, points: THREE.Vector3[], radius: number, material: THREE.Material): THREE.Mesh {
    return this.mesh(parent, name, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 24, radius, 7, false), material);
  }

  private heatTexture(kind: 'core' | 'arc'): THREE.CanvasTexture {
    const existing = kind === 'core' ? this.heatCoreTexture : this.heatArcTexture;
    if (existing) return existing;
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Unable to create microwave marker texture.');
    context.clearRect(0, 0, 128, 128);
    if (kind === 'core') {
      const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 62);
      gradient.addColorStop(0, 'rgba(255,255,238,1)');
      gradient.addColorStop(0.16, 'rgba(255,225,130,0.98)');
      gradient.addColorStop(0.42, 'rgba(255,116,30,0.58)');
      gradient.addColorStop(1, 'rgba(255,40,0,0)');
      context.fillStyle = gradient;
      context.fillRect(0, 0, 128, 128);
    } else {
      context.lineCap = 'round';
      context.shadowColor = 'rgba(255,132,34,0.42)';
      context.shadowBlur = 5;
      context.lineWidth = 18;
      context.strokeStyle = 'rgba(50,30,58,0.96)';
      context.beginPath();
      context.arc(64, 64, 45, -Math.PI * 0.39, Math.PI * 0.39);
      context.stroke();
      context.shadowBlur = 0;
      context.lineWidth = 8;
      context.strokeStyle = 'rgba(255,255,245,1)';
      context.beginPath();
      context.arc(64, 64, 45, -Math.PI * 0.39, Math.PI * 0.39);
      context.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.name = `microwave-${kind}-texture`;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    this.textures.add(texture);
    if (kind === 'core') this.heatCoreTexture = texture;
    else this.heatArcTexture = texture;
    return texture;
  }

  private sprite(
    parent: THREE.Object3D,
    name: string,
    texture: THREE.Texture,
    color: THREE.ColorRepresentation,
    size: number,
    opacity: number,
    rotation = 0,
    blending: THREE.Blending = THREE.AdditiveBlending,
  ): THREE.Sprite {
    const material = new THREE.SpriteMaterial({
      map: texture,
      color,
      opacity,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      blending,
      rotation,
    });
    this.materials.add(material);
    const sprite = new THREE.Sprite(material);
    sprite.name = name;
    sprite.scale.setScalar(size);
    sprite.userData.baseScale = size;
    sprite.renderOrder = 8;
    parent.add(sprite);
    return sprite;
  }

  private texturedPlane(
    parent: THREE.Object3D,
    name: string,
    texture: THREE.Texture,
    color: THREE.ColorRepresentation,
    size: number,
    opacity: number,
    rotation = 0,
  ): THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> {
    const geometry = new THREE.PlaneGeometry(1, 1);
    geometry.rotateX(Math.PI * 0.5);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      color,
      opacity,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.NormalBlending,
    });
    this.materials.add(material);
    const plane = new THREE.Mesh(geometry, material);
    plane.name = name;
    plane.scale.set(size, size, 1);
    plane.rotation.y = rotation;
    plane.userData.baseScale = size;
    plane.renderOrder = 8;
    parent.add(plane);
    return plane;
  }

  private syncPersistentMarkerTransforms(
    cablePositions: ReadonlyMap<string, THREE.Vector3>,
    cableOrientations: ReadonlyMap<string, THREE.Quaternion>,
    hintPositions: ReadonlyMap<string, THREE.Vector3>,
    hintOrientations: ReadonlyMap<string, THREE.Quaternion>,
  ): void {
    this.persistent.children.forEach((child) => {
      const cableId = String(child.userData.cableId ?? '');
      const popcornMarker = child.userData.assetId === 'popcorn-target-marker';
      if (!popcornMarker && child.userData.assetId !== 'microwave-double-heat-ring') return;
      const position = (popcornMarker ? hintPositions : cablePositions).get(cableId);
      const orientation = popcornMarker ? hintOrientations.get(cableId) : cableOrientations.get(cableId);
      if (position) child.position.copy(position);
      if (position && popcornMarker) child.userData.anchorPosition = position.clone();
      if (orientation) {
        child.quaternion.copy(popcornMarker ? popcornMarkerQuaternion(orientation) : orientation);
        if (popcornMarker) {
          child.userData.orientationMode = 'plug-end';
          child.userData.hintDirection = new THREE.Vector3(0, 1, 0).applyQuaternion(orientation).normalize();
        }
      }
    });
  }

  private updatePopcornMarker(root: THREE.Object3D, elapsed: number): void {
    const baseScale = Number(root.userData.baseScale) || 1;
    const anchor = root.userData.anchorPosition;
    if (anchor instanceof THREE.Vector3) {
      root.position.copy(anchor);
      root.position.addScaledVector(
        new THREE.Vector3(0, 0, 1).applyQuaternion(root.quaternion),
        Math.sin(elapsed * 3.8) * 0.055,
      );
    }
    root.scale.setScalar(baseScale * (1 + Math.sin(elapsed * 4.6) * 0.035));
    const pivot = root.getObjectByName('pulse-pivot');
    if (pivot) pivot.rotation.z = Math.sin(elapsed * 2.7) * 0.045;
    this.posePopcornKernels(root, elapsed, 0);
    this.pulsePopcornAccents(root, elapsed, 0);
  }

  private updatePopcornBurst(root: THREE.Object3D, progress: number, elapsed: number, seed: number): void {
    const burst = Math.sin(Math.PI * THREE.MathUtils.clamp(progress, 0, 1));
    const pivot = root.getObjectByName('pulse-pivot');
    if (pivot) {
      pivot.rotation.y = Math.sin(elapsed * 4.8 + seed) * 0.12;
      pivot.rotation.z = Math.sin(elapsed * 6.4 + seed) * 0.08;
    }
    this.posePopcornKernels(root, elapsed, burst * 0.38);
    this.pulsePopcornAccents(root, elapsed, burst * 0.72);
  }

  private posePopcornKernels(root: THREE.Object3D, elapsed: number, expansion: number): void {
    const kernels = root.getObjectByName('popcorn-kernels');
    kernels?.children.forEach((kernel, index) => {
      const basePosition = kernel.userData.basePosition;
      if (!(basePosition instanceof THREE.Vector3)) return;
      const direction = basePosition.clone().setZ(0).normalize();
      kernel.position.copy(basePosition).addScaledVector(direction, expansion);
      kernel.position.y += Math.sin(elapsed * 5.2 + index * 1.9) * 0.045;
      kernel.rotation.z = Math.sin(elapsed * 4.1 + index * 1.4) * 0.11;
      kernel.scale.setScalar(1 + Math.sin(elapsed * 6.2 + index) * 0.035 + expansion * 0.3);
    });
  }

  private pulsePopcornAccents(root: THREE.Object3D, elapsed: number, burst: number): void {
    const ring = root.getObjectByName('popcorn-target-ring');
    if (ring) ring.rotation.z = elapsed * 0.24;
    ring?.children.forEach((segment, index) => {
      const pulse = 0.9 + (Math.sin(elapsed * 5.4 - index * 0.78) + 1) * 0.08 + burst * 0.24;
      segment.scale.setScalar(pulse);
    });
    const rays = root.getObjectByName('popcorn-rays');
    rays?.children.forEach((ray, index) => {
      const pulse = Math.max(0.55, 0.72 + Math.sin(elapsed * 6.8 - index * 0.95) * 0.18 + burst * 0.5);
      ray.scale.set(1, pulse, 1);
    });
  }

  private updateMicrowaveMarker(root: THREE.Object3D, elapsed: number): void {
    const turns = Number(root.userData.turnsRemaining) || 2;
    const urgent = turns <= 1;
    const baseScale = Number(root.userData.baseScale) || 1;
    const pulseSpeed = urgent ? 5.2 : 3.4;
    const pulse = 1 + Math.sin(elapsed * pulseSpeed) * (urgent ? 0.065 : 0.038);
    root.scale.setScalar(baseScale * pulse);
    const core = root.getObjectByName('heat-core') as THREE.Sprite | undefined;
    const halo = root.getObjectByName('heat-halo') as THREE.Sprite | undefined;
    const chanceOne = root.getObjectByName('heat-chance-one') as THREE.Mesh | undefined;
    const chanceTwo = root.getObjectByName('heat-chance-two') as THREE.Mesh | undefined;
    if (core?.material instanceof THREE.SpriteMaterial) {
      core.material.color.set(urgent ? 0xffb0a0 : 0xfff0b0);
      core.material.opacity = urgent ? 1 : 0.9;
    }
    if (halo?.material instanceof THREE.SpriteMaterial) {
      halo.material.color.set(urgent ? 0xff351f : 0xff7a24);
      halo.material.opacity = (urgent ? 0.46 : 0.34) + Math.sin(elapsed * pulseSpeed) * 0.04;
      halo.material.rotation = -elapsed * (urgent ? 0.34 : 0.2);
    }
    [chanceOne, chanceTwo].forEach((chance, index) => {
      if (!(chance?.material instanceof THREE.MeshBasicMaterial)) return;
      chance.material.color.set(urgent ? 0xff3a25 : 0xff9a24);
      chance.material.opacity = 1;
      chance.rotation.y = (index === 0 ? 0 : Math.PI)
        + Math.sin(elapsed * 1.15) * 0.025;
      const chanceBaseScale = Number(chance.userData.baseScale) || 1;
      const chancePulse = index === 0 && urgent ? 1 + Math.sin(elapsed * 7.2) * 0.055 : 1;
      chance.scale.set(chanceBaseScale * chancePulse, chanceBaseScale * chancePulse, 1);
    });
    if (chanceTwo) chanceTwo.visible = turns > 1;
    const sparks = root.getObjectByName('heat-sparks');
    if (sparks) {
      sparks.rotation.z = elapsed * (urgent ? 1.15 : 0.72);
      sparks.children.forEach((spark, index) => {
        const sparkPulse = 0.72 + (Math.sin(elapsed * (4.2 + index * 0.17) + index) + 1) * 0.22;
        const sparkBaseScale = Number(spark.userData.baseScale) || 0.06;
        spark.scale.setScalar(sparkBaseScale * sparkPulse);
      });
    }
  }

  private build(asset: SkillEffectAssetId): THREE.Group {
    const root = new THREE.Group();
    const pivot = new THREE.Group();
    pivot.name = asset === 'gacha-card-frame' ? 'flip-pivot' : 'pulse-pivot';
    root.add(pivot);
    const socket = new THREE.Object3D();
    socket.name = 'attachment-socket';
    root.add(socket);

    switch (asset) {
      case 'humidifier-glass-wiper':
        this.mesh(pivot, 'wiper-glass-edge', new THREE.BoxGeometry(1.5, 0.22, 0.16, 3, 1, 1), this.ice, [0, 0.18, 0]);
        this.mesh(pivot, 'wiper-arm', new THREE.CapsuleGeometry(0.11, 0.48, 4, 8), this.coral, [0, -0.2, 0], [0, 0, Math.PI / 2]);
        break;
      case 'fan-airflow-ribbon': case 'hair-dryer-heat-ribbon': case 'kettle-steam-ribbon': {
        const material = asset === 'fan-airflow-ribbon' ? this.ice : asset === 'hair-dryer-heat-ribbon' ? this.yellow : this.cream;
        this.tube(pivot, 'flow-ribbon', [new THREE.Vector3(-0.8, -0.12, 0), new THREE.Vector3(-0.3, 0.28, 0), new THREE.Vector3(0.25, -0.15, 0), new THREE.Vector3(0.85, 0.18, 0)], 0.1, material);
        this.ring(pivot, 'nozzle-socket-ring', 0.18, 0.06, this.coral).position.x = -0.82;
        break;
      }
      case 'bubble-shell-wave-membrane':
        this.mesh(pivot, 'bubble-shell', new THREE.SphereGeometry(0.68, 16, 10), this.bubble, [0, 0, 0], [0, 0, 0], [1, 1, 0.42]);
        this.ring(pivot, 'impact-wave', 0.84, 0.045, this.purple);
        this.mesh(pivot, 'membrane', new THREE.CircleGeometry(0.42, 24), this.bubble, [0, 0, 0.08], [0, 0, 0], [1, 1, 1], false);
        break;
      case 'radio-sequence-markers':
        [1, 2, 3].forEach((count, row) => Array.from({ length: count }, (_, index) => this.mesh(pivot, `marker-${row + 1}-${index + 1}`, new THREE.SphereGeometry(0.1, 8, 6), this.teal, [(index - (count - 1) / 2) * 0.28, 0.36 - row * 0.36, 0])));
        break;
      case 'blender-energy-shards':
        [this.coral, this.teal, this.yellow, this.purple].forEach((material, index) => this.mesh(pivot, `energy-shard-${index + 1}`, new THREE.OctahedronGeometry(0.24, 0), material, [(index - 1.5) * 0.34, Math.abs(index - 1.5) * -0.12, 0], [0, 0, index * 0.4], [0.65, 1.5, 0.65]));
        break;
      case 'gacha-card-frame':
        this.mesh(pivot, 'card-frame', new THREE.BoxGeometry(0.9, 1.25, 0.12), this.coral);
        this.mesh(pivot, 'card-face', new THREE.BoxGeometry(0.7, 1.02, 0.14), this.teal, [0, 0, 0.05]);
        this.mesh(pivot, 'card-emblem', new THREE.ExtrudeGeometry(heartShape(), { depth: 0.07, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03 }), this.cream, [0, 0, 0.14], [0, 0, 0], [0.36, 0.36, 0.36]);
        break;
      case 'alarm-time-ring':
        this.ring(pivot, 'time-ring', 0.58, 0.1, this.teal);
        this.ring(pivot, 'time-ripple', 0.82, 0.035, this.cream);
        for (let index = 0; index < 8; index += 1) {
          const angle = index * Math.PI / 4;
          this.mesh(pivot, `tick-${index + 1}`, new THREE.BoxGeometry(0.08, 0.18, 0.08), this.coral, [Math.cos(angle) * 0.58, Math.sin(angle) * 0.58, 0], [0, 0, angle - Math.PI / 2]);
        }
        break;
      case 'popcorn-target-marker': {
        pivot.position.z = 0.28;
        const kernels = new THREE.Group();
        kernels.name = 'popcorn-kernels';
        pivot.add(kernels);
        const kernelPositions: Array<readonly [number, number, number]> = Array.from(
          { length: 3 },
          (_, index) => {
            const angle = Math.PI / 2 + index * Math.PI * 2 / 3;
            return [Math.cos(angle) * 0.26, Math.sin(angle) * 0.26, 0] as const;
          },
        );
        kernelPositions.forEach((position, index) => {
          const kernel = new THREE.Group();
          kernel.name = `popcorn-kernel-${index + 1}`;
          kernel.position.set(...position);
          kernel.userData.basePosition = kernel.position.clone();
          kernels.add(kernel);
          const lobeOffsets: Array<readonly [number, number, number]> = [
            [-0.08, 0.04, 0],
            [0.08, 0.05, 0.01],
            [0, 0.12, -0.02],
            [0, -0.03, 0.035],
          ];
          lobeOffsets.forEach((offset, lobeIndex) => this.mesh(
            kernel,
            `popcorn-kernel-${index + 1}-lobe-${lobeIndex + 1}`,
            new THREE.DodecahedronGeometry(0.105, 0),
            this.cream,
            offset,
            [0, lobeIndex * 0.42, lobeIndex * 0.31],
            [1, 0.86 + lobeIndex * 0.035, 0.92],
          ));
          this.mesh(
            kernel,
            `popcorn-kernel-${index + 1}-core`,
            new THREE.CylinderGeometry(0.085, 0.105, 0.13, 6),
            this.yellow,
            [0, -0.09, 0],
            [Math.PI / 2, 0, 0],
          );
        });
        const targetRing = new THREE.Group();
        targetRing.name = 'popcorn-target-ring';
        pivot.add(targetRing);
        for (let index = 0; index < 8; index += 1) {
          this.mesh(
            targetRing,
            `popcorn-ring-segment-${index + 1}`,
            new THREE.TorusGeometry(0.54, 0.055, 6, 10, Math.PI * 0.18),
            index % 2 === 0 ? this.teal : this.yellow,
            [0, 0, index % 2 === 0 ? -0.025 : 0.025],
            [0, 0, index * Math.PI / 4],
            [1, 1, 1],
          );
        }
        const rays = new THREE.Group();
        rays.name = 'popcorn-rays';
        pivot.add(rays);
        for (let index = 0; index < 6; index += 1) {
          const angle = index * Math.PI / 3;
          this.mesh(
            rays,
            `popcorn-ray-${index + 1}`,
            new THREE.BoxGeometry(0.055, 0.2, 0.085),
            index % 2 === 0 ? this.coral : this.teal,
            [Math.cos(angle) * 0.75, Math.sin(angle) * 0.75, index % 2 === 0 ? -0.035 : 0.035],
            [0, 0, angle - Math.PI / 2],
            [1, 1, 1],
          );
        }
        break;
      }
      case 'controller-continue-token':
        this.ring(pivot, 'token-ring', 0.58, 0.13, this.coral);
        this.mesh(pivot, 'token-core', new THREE.CylinderGeometry(0.42, 0.42, 0.14, 20), this.cream, [0, 0, 0], [Math.PI / 2, 0, 0]);
        this.mesh(pivot, 'token-mark', new THREE.ExtrudeGeometry(heartShape(), { depth: 0.08, bevelEnabled: false }), this.teal, [0, 0, 0.1], [0, 0, 0], [0.7, 0.7, 0.7]);
        break;
      case 'controller-impact-star':
        this.mesh(pivot, 'impact-star', new THREE.ExtrudeGeometry(starShape(9), { depth: 0.12, bevelEnabled: true, bevelSize: 0.035, bevelThickness: 0.035 }), this.coral, [0, 0, -0.06]);
        break;
      case 'microwave-double-heat-ring': {
        this.sprite(pivot, 'heat-halo', this.heatTexture('core'), 0xff6d20, 0.9, 0.2);
        this.sprite(pivot, 'heat-core', this.heatTexture('core'), 0xfff0b0, 0.42, 0.72);
        this.texturedPlane(
          pivot,
          'heat-chance-one',
          this.heatTexture('arc'),
          0xff9a24,
          1.18,
          1,
          0,
        );
        this.texturedPlane(
          pivot,
          'heat-chance-two',
          this.heatTexture('arc'),
          0xff9a24,
          1.18,
          1,
          Math.PI,
        );
        const sparks = new THREE.Group();
        sparks.name = 'heat-sparks';
        pivot.add(sparks);
        for (let index = 0; index < 6; index += 1) {
          const angle = (index / 6) * Math.PI * 2 + 0.31;
          const radius = 0.66 + (index % 2) * 0.055;
          const spark = this.sprite(
            sparks,
            `heat-spark-${index + 1}`,
            this.heatTexture('core'),
            index % 2 === 0 ? 0xfff08a : 0xff5528,
            0.055 + (index % 3) * 0.01,
            0.68,
          );
          spark.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0.02);
        }
        break;
      }
      case 'induction-heat-ring':
        this.ring(pivot, 'induction-ring-outer', 0.48, 0.08, this.coral);
        this.ring(pivot, 'induction-ring-inner', 0.27, 0.045, this.yellow);
        break;
      case 'speaker-bass-wave-arcs':
        [-1, 1].forEach((side) => [0.38, 0.62, 0.86].forEach((radius, index) => {
          const curve = new THREE.EllipseCurve(0, 0, radius, radius, side < 0 ? Math.PI * 0.62 : -Math.PI * 0.38, side < 0 ? Math.PI * 1.38 : Math.PI * 0.38, false, 0);
          this.tube(pivot, `bass-arc-${side}-${index}`, curve.getPoints(18).map((point) => new THREE.Vector3(point.x, point.y, 0)), 0.055, index % 2 ? this.coral : this.teal);
        }));
        break;
      default:
        break;
    }
    return root;
  }
}

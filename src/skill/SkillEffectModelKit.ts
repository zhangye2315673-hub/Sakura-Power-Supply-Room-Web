import * as THREE from 'three';
import { addHullOutline } from '../style/outline';
import { PAL } from '../style/palette';
import { cel } from '../style/toon';
import type { ApplianceKind } from '../systems/ApplianceCatalog';
import type { SkillChallengeState } from './SkillChallengeEngine';

export type SkillEffectAssetId =
  | 'lamp-spotlight-crown' | 'humidifier-glass-wiper' | 'fan-airflow-ribbon'
  | 'dehumidifier-shield-droplets' | 'refrigerator-ice-shell' | 'hair-dryer-heat-ribbon'
  | 'bubble-shell-wave-membrane' | 'radio-sequence-markers' | 'kettle-steam-ribbon'
  | 'blender-energy-shards' | 'gacha-card-frame' | 'record-note-orb-ring'
  | 'alarm-time-ring' | 'popcorn-heart-crown' | 'stand-mixer-status-token'
  | 'controller-continue-token' | 'controller-impact-star' | 'microwave-double-heat-ring'
  | 'induction-heat-ring' | 'speaker-bass-wave-arcs';

export const SKILL_EFFECT_ASSET_REFERENCES: Readonly<Record<SkillEffectAssetId, string>> = {
  'lamp-spotlight-crown': 'references/skill-effects/intake/lamp-spotlight-crown/reference.png',
  'humidifier-glass-wiper': 'references/skill-effects/intake/humidifier-glass-wiper/reference.png',
  'fan-airflow-ribbon': 'references/skill-effects/intake/fan-airflow-ribbon/reference.png',
  'dehumidifier-shield-droplets': 'references/skill-effects/intake/dehumidifier-shield-droplets/reference.png',
  'refrigerator-ice-shell': 'references/skill-effects/intake/refrigerator-ice-shell/reference.png',
  'hair-dryer-heat-ribbon': 'references/skill-effects/intake/hair-dryer-heat-ribbon/reference.png',
  'bubble-shell-wave-membrane': 'references/skill-effects/intake/bubble-shell-wave-membrane/reference.png',
  'radio-sequence-markers': 'references/skill-effects/intake/radio-sequence-markers/reference.png',
  'kettle-steam-ribbon': 'references/skill-effects/intake/kettle-steam-ribbon/reference.png',
  'blender-energy-shards': 'references/skill-effects/intake/blender-energy-shards/reference.png',
  'gacha-card-frame': 'references/skill-effects/intake/gacha-card-frame/reference.png',
  'record-note-orb-ring': 'references/skill-effects/intake/record-note-orb-ring/reference.png',
  'alarm-time-ring': 'references/skill-effects/intake/alarm-time-ring/reference.png',
  'popcorn-heart-crown': 'references/skill-effects/intake/popcorn-heart-crown/reference.png',
  'stand-mixer-status-token': 'references/skill-effects/intake/stand-mixer-status-token/reference.png',
  'controller-continue-token': 'references/skill-effects/intake/controller-continue-token/reference.png',
  'controller-impact-star': 'references/skill-effects/intake/controller-impact-star/reference.png',
  'microwave-double-heat-ring': 'references/skill-effects/intake/microwave-double-heat-ring/reference.png',
  'induction-heat-ring': 'references/skill-effects/intake/induction-heat-ring/reference.png',
  'speaker-bass-wave-arcs': 'references/skill-effects/intake/speaker-bass-wave-arcs/reference.png',
};

type EffectInstance = { root: THREE.Group; age: number; duration: number; seed: number };

const ASSET_BY_APPLIANCE: Partial<Record<ApplianceKind, SkillEffectAssetId>> = {
  lamp: 'lamp-spotlight-crown',
  humidifier: 'humidifier-glass-wiper',
  fan: 'fan-airflow-ribbon',
  dehumidifier: 'dehumidifier-shield-droplets',
  refrigerator: 'refrigerator-ice-shell',
  'hair-dryer': 'hair-dryer-heat-ribbon',
  'bubble-machine': 'bubble-shell-wave-membrane',
  radio: 'radio-sequence-markers',
  kettle: 'kettle-steam-ribbon',
  blender: 'blender-energy-shards',
  'gumball-machine': 'gacha-card-frame',
  'record-player': 'record-note-orb-ring',
  'alarm-clock': 'alarm-time-ring',
  'popcorn-machine': 'popcorn-heart-crown',
  'stand-mixer': 'stand-mixer-status-token',
  'game-controller': 'controller-continue-token',
  microwave: 'microwave-double-heat-ring',
  'induction-cooktop': 'induction-heat-ring',
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

  play(appliance: ApplianceKind, targets: readonly THREE.Vector3[] = []): void {
    const asset = ASSET_BY_APPLIANCE[appliance];
    if (!asset) return;
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
    availablePositions: readonly THREE.Vector3[],
  ): void {
    if (this.evidenceAsset) return;
    const signature = JSON.stringify({
      buff: state.buff?.id ?? null,
      debuff: state.debuff?.id ?? null,
      targets: state.debuff?.targetCableIds ?? [],
      cablePositions: [...cablePositions].map(([id, position]) => [id, position.toArray().map((value) => value.toFixed(2))]),
      available: state.buff?.id === 'induction-reveal'
        ? availablePositions.map((position) => position.toArray().map((value) => value.toFixed(2)))
        : [],
    });
    if (signature === this.persistentSignature) return;
    this.persistentSignature = signature;
    this.persistent.clear();

    if (state.debuff?.id === 'frozen-plug') {
      state.debuff.targetCableIds.forEach((id) => this.attach('refrigerator-ice-shell', cablePositions.get(id)));
    } else if (state.debuff?.id === 'overheated-plug') {
      state.debuff.targetCableIds.forEach((id) => this.attach('microwave-double-heat-ring', cablePositions.get(id)));
    }
    if (state.buff?.id === 'induction-reveal') {
      availablePositions.forEach((position) => this.attach('induction-heat-ring', position));
    } else if (state.buff?.id === 'dry-shield') {
      this.attach('dehumidifier-shield-droplets', new THREE.Vector3(0, 0.2, 1.75), 2.8);
    } else if (state.buff?.id === 'iridescent-bubble') {
      this.attach('bubble-shell-wave-membrane', new THREE.Vector3(0, 0.1, 1.65), 3.5);
    } else if (state.buff?.id === 'soothing-record') {
      this.attach('record-note-orb-ring', new THREE.Vector3(0, 0.5, 1.9), 1.7);
    } else if (state.buff?.id === 'continue') {
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
      instance.root.rotation.y = Math.sin(elapsed * 3.2 + instance.seed) * 0.16;
      instance.root.rotation.z = Math.sin(elapsed * 4.1 + instance.seed) * 0.05;
      if (progress < 1) continue;
      this.release(instance.root);
      this.instances.splice(index, 1);
    }
    this.persistent.children.forEach((child, index) => {
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
    this.root.removeFromParent();
  }

  private attach(asset: SkillEffectAssetId, position?: THREE.Vector3, scale = 0.72): void {
    if (!position) return;
    const model = this.acquire(asset);
    model.position.copy(position);
    model.scale.setScalar(scale);
    model.userData.baseScale = scale;
    model.userData.assetId = asset;
    model.userData.referencePath = SKILL_EFFECT_ASSET_REFERENCES[asset];
    this.persistent.add(model);
  }

  private acquire(asset: SkillEffectAssetId): THREE.Group {
    const model = this.pools.get(asset)?.pop() ?? this.build(asset);
    model.visible = true;
    model.position.set(0, 0, 0);
    model.rotation.set(0, 0, 0);
    model.scale.setScalar(1);
    model.userData.assetId = asset;
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

  private build(asset: SkillEffectAssetId): THREE.Group {
    const root = new THREE.Group();
    const pivot = new THREE.Group();
    pivot.name = asset === 'gacha-card-frame' ? 'flip-pivot' : 'pulse-pivot';
    root.add(pivot);
    const socket = new THREE.Object3D();
    socket.name = 'attachment-socket';
    root.add(socket);

    switch (asset) {
      case 'lamp-spotlight-crown':
        this.ring(pivot, 'target-ring', 0.5, 0.1, this.coral);
        [-0.32, 0, 0.32].forEach((x, index) => this.mesh(pivot, `crown-point-${index + 1}`, new THREE.ConeGeometry(0.16, index === 1 ? 0.48 : 0.34, 4), this.yellow, [x, 0.58, 0]));
        break;
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
      case 'dehumidifier-shield-droplets':
        this.ring(pivot, 'segmented-shield', 0.62, 0.16, this.ice);
        [-0.75, 0.75].forEach((x, index) => this.mesh(pivot, `water-drop-${index + 1}`, new THREE.OctahedronGeometry(0.17, 1), this.ice, [x, -0.2 + index * 0.35, 0]));
        break;
      case 'refrigerator-ice-shell':
        for (let index = 0; index < 8; index += 1) {
          const angle = (index / 8) * Math.PI * 2;
          this.mesh(pivot, `ice-plate-${index + 1}`, new THREE.OctahedronGeometry(0.23, 0), this.ice, [Math.cos(angle) * 0.5, Math.sin(angle) * 0.5, 0], [0, 0, angle], [1, 1.45, 0.65]);
        }
        break;
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
      case 'record-note-orb-ring':
        this.mesh(pivot, 'note-orb', new THREE.SphereGeometry(0.3, 12, 8), this.yellow);
        this.ring(pivot, 'sound-ring-inner', 0.5, 0.05, this.cream);
        this.ring(pivot, 'sound-ring-outer', 0.72, 0.035, this.yellow);
        this.mesh(pivot, 'note-stem', new THREE.BoxGeometry(0.08, 0.45, 0.08), this.coral, [0.12, 0.22, 0]);
        break;
      case 'alarm-time-ring':
        this.ring(pivot, 'time-ring', 0.58, 0.1, this.teal);
        this.ring(pivot, 'time-ripple', 0.82, 0.035, this.cream);
        for (let index = 0; index < 8; index += 1) {
          const angle = index * Math.PI / 4;
          this.mesh(pivot, `tick-${index + 1}`, new THREE.BoxGeometry(0.08, 0.18, 0.08), this.coral, [Math.cos(angle) * 0.58, Math.sin(angle) * 0.58, 0], [0, 0, angle - Math.PI / 2]);
        }
        break;
      case 'popcorn-heart-crown':
        this.mesh(pivot, 'heart-cluster', new THREE.ExtrudeGeometry(heartShape(), { depth: 0.16, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04 }), this.cream, [0, 0, -0.08]);
        this.mesh(pivot, 'prompt-crown', new THREE.ConeGeometry(0.28, 0.42, 5), this.yellow, [0, 0.62, 0]);
        break;
      case 'stand-mixer-status-token': case 'controller-continue-token':
        this.ring(pivot, 'token-ring', 0.58, 0.13, asset === 'stand-mixer-status-token' ? this.purple : this.coral);
        this.mesh(pivot, 'token-core', new THREE.CylinderGeometry(0.42, 0.42, 0.14, 20), this.cream, [0, 0, 0], [Math.PI / 2, 0, 0]);
        this.mesh(pivot, 'token-mark', new THREE.ExtrudeGeometry(asset === 'stand-mixer-status-token' ? starShape(6, 0.3, 0.16) : heartShape(), { depth: 0.08, bevelEnabled: false }), this.teal, [0, 0, 0.1], [0, 0, 0], [0.7, 0.7, 0.7]);
        break;
      case 'controller-impact-star':
        this.mesh(pivot, 'impact-star', new THREE.ExtrudeGeometry(starShape(9), { depth: 0.12, bevelEnabled: true, bevelSize: 0.035, bevelThickness: 0.035 }), this.coral, [0, 0, -0.06]);
        break;
      case 'microwave-double-heat-ring':
        this.ring(pivot, 'heat-ring-outer', 0.6, 0.12, this.coral);
        this.ring(pivot, 'heat-ring-inner', 0.36, 0.07, this.yellow);
        break;
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

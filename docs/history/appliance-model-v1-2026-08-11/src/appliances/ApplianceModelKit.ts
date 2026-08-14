import * as THREE from 'three';
import { addHullOutline } from '../style/outline';
import { cel } from '../style/toon';

export type ApplianceModelBuild = {
  root: THREE.Group;
  indicatorMaterial: THREE.MeshToonMaterial;
  interactiveMeshes: THREE.Mesh[];
  materials: Set<THREE.Material>;
  accuracy: {
    referencePath: string | null;
    reconstructed: string[];
    inferred: string[];
  };
};

export type ApplianceModelOptions = {
  id: string;
  accent: number;
  referencePath?: string | null;
};

export class ApplianceModelKit {
  readonly root = new THREE.Group();
  readonly materials = new Set<THREE.Material>();
  readonly interactiveMeshes: THREE.Mesh[] = [];
  readonly nodes = new Map<string, THREE.Object3D>();
  readonly sockets = new Map<string, THREE.Object3D>();
  readonly indicatorMaterial: THREE.MeshToonMaterial;

  constructor(readonly options: ApplianceModelOptions) {
    this.root.name = `appliance-model-${options.id}`;
    this.nodes.set('root', this.root);
    this.indicatorMaterial = this.material(0x81798f, { emissive: 0x000000 });
  }

  material(
    color: THREE.ColorRepresentation,
    options: {
      tint?: THREE.ColorRepresentation;
      emissive?: THREE.ColorRepresentation;
      transparent?: boolean;
      opacity?: number;
    } = {},
  ): THREE.MeshToonMaterial {
    const material = cel({
      color,
      bands: 3,
      tint: options.tint ?? 0x71667f,
      emissive: options.emissive ?? 0x000000,
      emissiveIntensity: options.emissive ? 0 : 1,
      transparent: options.transparent,
      opacity: options.opacity,
    });
    this.materials.add(material);
    return material;
  }

  mesh(
    name: string,
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    parent: THREE.Object3D = this.root,
    outlined = true,
  ): THREE.Mesh {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.applianceId = this.options.id;
    this.interactiveMeshes.push(mesh);
    this.nodes.set(name, mesh);
    if (outlined) addHullOutline(mesh, 0.00305);
    parent.add(mesh);
    return mesh;
  }

  pivot(name: string, parent: THREE.Object3D = this.root): THREE.Group {
    const pivot = new THREE.Group();
    pivot.name = name;
    pivot.userData.applianceId = this.options.id;
    parent.add(pivot);
    this.nodes.set(name, pivot);
    return pivot;
  }

  socket(
    name: string,
    parent: THREE.Object3D,
    position: THREE.Vector3 | readonly [number, number, number],
  ): THREE.Object3D {
    const socket = new THREE.Object3D();
    socket.name = name;
    if (position instanceof THREE.Vector3) socket.position.copy(position);
    else socket.position.set(position[0], position[1], position[2]);
    socket.userData.socket = true;
    parent.add(socket);
    this.nodes.set(name, socket);
    this.sockets.set(name, socket);
    return socket;
  }

  indicator(position: readonly [number, number, number], radius = 0.045): THREE.Mesh {
    const indicator = this.mesh(
      'status-indicator',
      new THREE.SphereGeometry(radius, 8, 6),
      this.indicatorMaterial,
      this.root,
      false,
    );
    indicator.position.set(position[0], position[1], position[2]);
    return indicator;
  }

  finish(accuracy: ApplianceModelBuild['accuracy']): ApplianceModelBuild {
    this.root.userData.sculptRuntime = {
      nodes: Object.fromEntries(this.nodes),
      sockets: Object.fromEntries(this.sockets),
      colliders: [{ id: `${this.options.id}-body`, type: 'box', node: 'root' }],
      destructionGroups: [],
    };
    this.root.userData.referenceAccuracy = accuracy;
    return {
      root: this.root,
      indicatorMaterial: this.indicatorMaterial,
      interactiveMeshes: this.interactiveMeshes,
      materials: this.materials,
      accuracy,
    };
  }
}

export function orientCylinderBetween(
  mesh: THREE.Object3D,
  start: THREE.Vector3,
  end: THREE.Vector3,
): void {
  const direction = end.clone().sub(start);
  mesh.position.copy(start).lerp(end, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
  mesh.scale.y = direction.length();
}

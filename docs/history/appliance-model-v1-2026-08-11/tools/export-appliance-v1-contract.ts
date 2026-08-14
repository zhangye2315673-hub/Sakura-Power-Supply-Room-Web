import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';
import { createApplianceModel } from '../src/appliances/models';
import { createApplianceMechanicalAnimation } from '../src/appliances/performance/ApplianceMechanics';
import { APPLIANCE_CATALOG } from '../src/systems/ApplianceCatalog';

const outputPath = path.resolve(
  process.argv[2] ?? 'docs/history/appliance-model-v1-2026-08-11/appliance-rig-v1-contract.json',
);
const KEYFRAME_TIMES = [0.6, 2.8, 4.75] as const;
const EDGE_PADDING = 0.035;

function round(value: number): number {
  return Math.round(value * 1e8) / 1e8;
}

function vector(value: THREE.Vector3): [number, number, number] {
  return [round(value.x), round(value.y), round(value.z)];
}

function quaternion(value: THREE.Quaternion): [number, number, number, number] {
  return [round(value.x), round(value.y), round(value.z), round(value.w)];
}

function objectPath(object: THREE.Object3D, root: THREE.Object3D): string {
  const parts: string[] = [];
  let cursor: THREE.Object3D | null = object;
  while (cursor) {
    parts.push(cursor.name || cursor.type);
    if (cursor === root) break;
    cursor = cursor.parent;
  }
  return parts.reverse().join('/');
}

function transform(object: THREE.Object3D, root: THREE.Object3D) {
  object.updateWorldMatrix(true, false);
  return {
    path: objectPath(object, root),
    parentPath: object.parent ? objectPath(object.parent, root) : null,
    position: vector(object.position),
    quaternion: quaternion(object.quaternion),
    scale: vector(object.scale),
    worldPosition: vector(object.getWorldPosition(new THREE.Vector3())),
    worldQuaternion: quaternion(object.getWorldQuaternion(new THREE.Quaternion())),
    visible: object.visible,
  };
}

function transformSignature(object: THREE.Object3D): string {
  return JSON.stringify({
    position: vector(object.position),
    quaternion: quaternion(object.quaternion),
    scale: vector(object.scale),
    visible: object.visible,
  });
}

function triangleCount(root: THREE.Object3D): number {
  let triangles = 0;
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    triangles += object.geometry.index
      ? object.geometry.index.count / 3
      : (object.geometry.getAttribute('position')?.count ?? 0) / 3;
  });
  return Math.round(triangles);
}

function dispose(root: THREE.Object3D, materials: Set<THREE.Material>): void {
  const geometries = new Set<THREE.BufferGeometry>();
  root.traverse((object) => {
    if (object instanceof THREE.Mesh) geometries.add(object.geometry);
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
}

const appliances = APPLIANCE_CATALOG.map((definition, index) => {
  const build = createApplianceModel(definition.id, {
    id: definition.id,
    accent: [0xe58da8, 0x89cbbf, 0xf1c96b][index % 3],
    referencePath: definition.referencePath,
  });
  const animation = createApplianceMechanicalAnimation(definition.id, build.root);
  animation.stop();
  build.root.updateMatrixWorld(true);

  const runtime = build.root.userData.sculptRuntime as {
    nodes?: Record<string, THREE.Object3D>;
    sockets?: Record<string, THREE.Object3D>;
    colliders?: unknown[];
    destructionGroups?: unknown[];
  } | undefined;
  const namedObjects: THREE.Object3D[] = [];
  build.root.traverse((object) => {
    if (object.name) namedObjects.push(object);
  });
  const restSignatures = new Map(namedObjects.map((object) => [object, transformSignature(object)]));
  const animatedNames = new Set<string>();
  const keyframes = KEYFRAME_TIMES.map((time) => {
    animation.update(time, 1);
    build.root.updateMatrixWorld(true);
    const changed = namedObjects.filter((object) => {
      const changedNow = restSignatures.get(object) !== transformSignature(object);
      if (changedNow) animatedNames.add(object.name);
      return changedNow;
    });
    return {
      time,
      signal: round(animation.signal()),
      changedNodes: Object.fromEntries(changed.map((object) => [object.name, transform(object, build.root)])),
      sockets: Object.fromEntries(Object.entries(runtime?.sockets ?? {}).map(([name, socket]) => [
        name,
        {
          ...transform(socket, build.root),
          direction: Array.isArray(socket.userData.direction) ? socket.userData.direction : null,
        },
      ])),
    };
  });
  animation.stop();
  build.root.updateMatrixWorld(true);

  const bounds = new THREE.Box3().setFromObject(build.root);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const frontZ = bounds.max.z + EDGE_PADDING;
  const edgeAnchors = {
    left: [bounds.min.x - EDGE_PADDING, center.y, frontZ],
    right: [bounds.max.x + EDGE_PADDING, center.y, frontZ],
    top: [center.x, bounds.max.y + EDGE_PADDING, frontZ],
    bottom: [center.x, bounds.min.y - EDGE_PADDING, frontZ],
  } as const;

  const materials = [...build.materials].map((material, materialIndex) => {
    const candidate = material as THREE.Material & {
      color?: THREE.Color;
      emissive?: THREE.Color;
      emissiveIntensity?: number;
      roughness?: number;
      metalness?: number;
    };
    return {
      index: materialIndex,
      type: material.type,
      color: candidate.color ? `#${candidate.color.getHexString()}` : null,
      emissive: candidate.emissive ? `#${candidate.emissive.getHexString()}` : null,
      emissiveIntensity: candidate.emissiveIntensity === undefined ? null : round(candidate.emissiveIntensity),
      opacity: round(material.opacity),
      transparent: material.transparent,
      roughness: candidate.roughness === undefined ? null : round(candidate.roughness),
      metalness: candidate.metalness === undefined ? null : round(candidate.metalness),
    };
  });

  const result = {
    id: definition.id,
    label: definition.label,
    sizeTier: definition.sizeTier,
    plugStyleId: definition.plugStyleId,
    targetScreenHeight: definition.targetScreenHeight,
    referencePath: definition.referencePath,
    bounds: {
      min: vector(bounds.min),
      max: vector(bounds.max),
      size: vector(size),
      center: vector(center),
      groundY: round(bounds.min.y),
    },
    edgeAnchors: Object.fromEntries(Object.entries(edgeAnchors).map(([edge, value]) => [
      edge,
      value.map(round),
    ])),
    metrics: {
      namedObjects: namedObjects.length,
      meshes: namedObjects.filter((object) => object instanceof THREE.Mesh).length,
      interactiveMeshes: build.interactiveMeshes.length,
      materials: build.materials.size,
      triangles: triangleCount(build.root),
    },
    requiredAnimatedNodeNames: [...animatedNames].sort(),
    runtimeNodes: Object.fromEntries(Object.entries(runtime?.nodes ?? {}).map(([name, object]) => [
      name,
      transform(object, build.root),
    ])),
    runtimeSockets: Object.fromEntries(Object.entries(runtime?.sockets ?? {}).map(([name, socket]) => [
      name,
      {
        ...transform(socket, build.root),
        direction: Array.isArray(socket.userData.direction) ? socket.userData.direction : null,
      },
    ])),
    colliders: runtime?.colliders ?? [],
    destructionGroups: runtime?.destructionGroups ?? [],
    materials,
    keyframes,
  };
  dispose(build.root, build.materials);
  return result;
});

const contract = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  source: 'SAKURA appliance visual runtime before v2 redesign',
  tolerances: {
    frozenTransform: 0.0001,
    boundsRelative: 0.02,
    groundY: 0.005,
    projectedConnectionPixels: 2,
  },
  keyframeTimes: KEYFRAME_TIMES,
  applianceCount: appliances.length,
  appliances,
};

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(contract, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, applianceCount: appliances.length }, null, 2));

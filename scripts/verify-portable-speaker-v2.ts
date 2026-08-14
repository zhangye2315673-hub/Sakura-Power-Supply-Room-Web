import * as THREE from 'three';
import { createPortableSpeakerModel } from '../src/appliances/models/portableSpeaker';

const envelope = {
  min: new THREE.Vector3(-1.7975, -0.025, -0.863),
  max: new THREE.Vector3(1.7975, 5.00501415, 1.17799384),
};
const frozenNodes: Record<string, readonly [number, number, number]> = {
  'portable-speaker-whole-machine-pivot': [0, 0, 0],
  'portable-speaker-cabinet-pivot': [0, 0, 0],
  'portable-speaker-front-fascia-pivot': [0, 0, 0],
  'portable-speaker-driver-pulse-pivot': [-0.22, 1.94, 0.902],
  'portable-speaker-power-button-pivot': [1, 0.91, 0.94],
  'portable-speaker-status-indicator': [1, 0.42, 0.944],
  'portable-speaker-handle-pivot': [0, 2.72, 0],
  'portable-speaker-left-hinge-pivot': [-1.65, 2.72, 0],
  'portable-speaker-right-hinge-pivot': [1.65, 2.72, 0],
  'portable-speaker-bass-wave-root': [-0.22, 1.94, 1.08],
};
const frozenSockets: Record<string, readonly [number, number, number]> = {
  'portable-speaker-sound-wave-socket': [-0.22, 1.94, 1.08],
  'portable-speaker-power-cable-socket': [0, 0.56, -0.86],
  'portable-speaker-handle-left-hinge-socket': [0, 0, 0],
  'portable-speaker-handle-right-hinge-socket': [0, 0, 0],
  'portable-speaker-left-connection-socket': [-1.8325, 2.49000708, 1.21299384],
  'portable-speaker-right-connection-socket': [1.8325, 2.49000708, 1.21299384],
  'portable-speaker-top-connection-socket': [0, 5.04001415, 1.21299384],
  'portable-speaker-bottom-connection-socket': [0, -0.06, 1.21299384],
};

function close(actual: number, expected: number, tolerance = 1e-4): boolean {
  return Math.abs(actual - expected) <= tolerance;
}

function vectorMatches(actual: THREE.Vector3, expected: readonly [number, number, number]): boolean {
  return close(actual.x, expected[0]) && close(actual.y, expected[1]) && close(actual.z, expected[2]);
}

function inspectBuild() {
  const build = createPortableSpeakerModel({ id: 'portable-speaker', accent: 0xe8a7b7 });
  build.root.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(build.root);
  const finiteGeometry: string[] = [];
  const unnamedMeshes: string[] = [];
  const outlines: Record<string, number[]> = { main: [], structure: [], detail: [] };
  let waveCount = 0;
  let grilleCount = -1;
  const geometries = new Set<THREE.BufferGeometry>();

  build.root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    if (!object.name) unnamedMeshes.push(object.uuid);
    geometries.add(object.geometry);
    const position = object.geometry.getAttribute('position');
    if (position) {
      for (let index = 0; index < position.count; index += 1) {
        if (![position.getX(index), position.getY(index), position.getZ(index)].every(Number.isFinite)) {
          finiteGeometry.push(object.name);
          break;
        }
      }
    }
    if (object.name === 'portable-speaker-grille-perforations' && object instanceof THREE.InstancedMesh) {
      grilleCount = object.count;
    }
    if (object.name.startsWith('portable-speaker-bass-wave-ring-')) {
      waveCount += 1;
      if (object.geometry.type !== 'TubeGeometry') finiteGeometry.push(`${object.name}:${object.geometry.type}`);
    }
    if (object.userData.isOutline === true && object.material instanceof THREE.ShaderMaterial) {
      const tier = object.userData.outlineTier as keyof typeof outlines;
      if (outlines[tier]) outlines[tier].push(object.material.uniforms.uThickness.value as number);
      if (!close(object.material.uniforms.uVariation.value as number, 0.18, 1e-6)) {
        finiteGeometry.push(`${object.name}:outline-variation`);
      }
    }
  });

  const nodeResults = Object.entries(frozenNodes).map(([name, expected]) => {
    const node = build.root.getObjectByName(name);
    return { name, present: Boolean(node), localTransformMatches: Boolean(node && vectorMatches(node.position, expected)) };
  });
  const socketResults = Object.entries(frozenSockets).map(([name, expected]) => {
    const socket = build.root.getObjectByName(name);
    return { name, present: Boolean(socket), localTransformMatches: Boolean(socket && vectorMatches(socket.position, expected)) };
  });
  const withinEnvelope = bounds.min.x >= envelope.min.x - 1e-4
    && bounds.min.y >= envelope.min.y - 1e-4
    && bounds.min.z >= envelope.min.z - 1e-4
    && bounds.max.x <= envelope.max.x + 1e-4
    && bounds.max.y <= envelope.max.y + 1e-4
    && bounds.max.z <= envelope.max.z + 1e-4;
  const outlineWidthsMatch = outlines.main.length >= 2
    && outlines.structure.length >= 1
    && outlines.detail.length >= 1
    && outlines.main.every((value) => close(value, 0.0048, 1e-6))
    && outlines.structure.every((value) => close(value, 0.0041, 1e-6))
    && outlines.detail.every((value) => close(value, 0.0033, 1e-6));

  const signature = JSON.stringify({
    bounds: [bounds.min.toArray(), bounds.max.toArray()],
    nodes: nodeResults,
    sockets: socketResults,
    grilleCount,
    waveCount,
    outlines: Object.fromEntries(Object.entries(outlines).map(([key, values]) => [key, values.length])),
  });

  const result = {
    bounds: { min: bounds.min.toArray(), max: bounds.max.toArray(), withinEnvelope, groundMatches: close(bounds.min.y, -0.025, 0.005) },
    nodeResults,
    socketResults,
    grilleCount,
    waveCount,
    unnamedMeshes: unnamedMeshes.length,
    finiteGeometry: finiteGeometry.length === 0,
    outlineWidthsMatch,
    outlineCounts: Object.fromEntries(Object.entries(outlines).map(([key, values]) => [key, values.length])),
    signature,
  };

  geometries.forEach((geometry) => geometry.dispose());
  build.materials.forEach((material) => material.dispose());
  return result;
}

const cycles = [inspectBuild(), inspectBuild(), inspectBuild()];
const deterministicRebuild = cycles.every((cycle) => cycle.signature === cycles[0].signature);
const first = cycles[0];
const passed = first.bounds.withinEnvelope
  && first.bounds.groundMatches
  && first.nodeResults.every((entry) => entry.present && entry.localTransformMatches)
  && first.socketResults.every((entry) => entry.present && entry.localTransformMatches)
  && first.grilleCount === 480
  && first.waveCount === 8
  && first.unnamedMeshes === 0
  && first.finiteGeometry
  && first.outlineWidthsMatch
  && deterministicRebuild;

console.log(JSON.stringify({ ...first, deterministicRebuild, rebuildCycles: cycles.length }, null, 2));
if (!passed) process.exit(1);

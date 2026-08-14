import * as THREE from 'three';
import { createFanModel } from '../src/appliances/models/fan';

const envelope = {
  min: new THREE.Vector3(-0.655, -0.89175808, -0.61652837),
  max: new THREE.Vector3(0.655, 0.91090842, 0.37499997),
};
const frozenNodes: Record<string, readonly [number, number, number]> = {
  'fan-speed-dial-pivot': [0, -0.675, 0.305],
  'fan-oscillation-pivot': [0, 0.25, -0.33],
  'fan-head-hinge': [0, 0, 0.33],
  'fan-rotor-pivot': [0, 0, 0.02],
};
const frozenSockets: Record<string, readonly [number, number, number]> = {
  'fan-head-socket': [0, 0, 0],
  'fan-rotor-axis-socket': [0, 0, 0],
  'fan-front-air-socket': [0, 0, 0.22],
  'fan-left-connection-socket': [-0.69, 0.00957517, 0.41],
  'fan-right-connection-socket': [0.69, 0.00957517, 0.41],
  'fan-top-connection-socket': [0, 0.94590842, 0.41],
  'fan-bottom-connection-socket': [0, -0.92675808, 0.41],
};

function close(actual: number, expected: number, tolerance = 1e-4): boolean {
  return Math.abs(actual - expected) <= tolerance;
}
function vectorMatches(actual: THREE.Vector3, expected: readonly [number, number, number]): boolean {
  return close(actual.x, expected[0]) && close(actual.y, expected[1]) && close(actual.z, expected[2]);
}

function inspectBuild() {
  const build = createFanModel({ id: 'fan', accent: 0xe8a7b7 });
  build.root.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(build.root);
  const invalidGeometry: string[] = [];
  const unnamedMeshes: string[] = [];
  const outlines: Record<string, number[]> = { main: [], structure: [], detail: [] };
  let bladeCount = 0;
  let frontSpokes = 0;
  let rearSpokes = 0;
  const geometries = new Set<THREE.BufferGeometry>();
  build.root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    if (!object.name) unnamedMeshes.push(object.uuid);
    geometries.add(object.geometry);
    const position = object.geometry.getAttribute('position');
    if (position) {
      for (let index = 0; index < position.count; index += 1) {
        if (![position.getX(index), position.getY(index), position.getZ(index)].every(Number.isFinite)) {
          invalidGeometry.push(object.name);
          break;
        }
      }
    }
    if (object.name.startsWith('fan-blade-') && !object.name.includes('root') && !object.name.endsWith('-ink')) bladeCount += 1;
    if (object.name.startsWith('fan-front-spoke-')) frontSpokes += 1;
    if (object.name.startsWith('fan-rear-spoke-')) rearSpokes += 1;
    if (object.userData.isOutline === true && object.material instanceof THREE.ShaderMaterial) {
      const tier = object.userData.outlineTier as keyof typeof outlines;
      if (outlines[tier]) outlines[tier].push(object.material.uniforms.uThickness.value as number);
      if (!close(object.material.uniforms.uVariation.value as number, 0.18, 1e-6)) invalidGeometry.push(`${object.name}:outline-variation`);
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
  const signature = JSON.stringify({ bounds: [bounds.min.toArray(), bounds.max.toArray()], nodeResults, socketResults, bladeCount, frontSpokes, rearSpokes, outlineCounts: Object.fromEntries(Object.entries(outlines).map(([key, values]) => [key, values.length])) });
  const result = {
    bounds: { min: bounds.min.toArray(), max: bounds.max.toArray(), withinEnvelope, groundMatches: close(bounds.min.y, envelope.min.y, 0.005) },
    nodeResults, socketResults, bladeCount, frontSpokes, rearSpokes,
    unnamedMeshes: unnamedMeshes.length,
    finiteGeometry: invalidGeometry.length === 0,
    invalidGeometry,
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
const passed = first.bounds.withinEnvelope && first.bounds.groundMatches
  && first.nodeResults.every((entry) => entry.present && entry.localTransformMatches)
  && first.socketResults.every((entry) => entry.present && entry.localTransformMatches)
  && first.bladeCount === 5 && first.frontSpokes === 8 && first.rearSpokes === 8
  && first.unnamedMeshes === 0 && first.finiteGeometry && first.outlineWidthsMatch && deterministicRebuild;
console.log(JSON.stringify({ ...first, deterministicRebuild, rebuildCycles: cycles.length }, null, 2));
if (!passed) process.exit(1);

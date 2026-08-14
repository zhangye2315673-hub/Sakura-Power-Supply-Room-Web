import * as THREE from 'three';
import { createMicrowaveModel } from '../src/appliances/models/microwave';

const envelope = {
  min: new THREE.Vector3(-1.895, 0, -0.936),
  max: new THREE.Vector3(1.78, 2.19000001, 1.24),
};
const frozenNodes: Record<string, readonly [number, number, number]> = {
  'microwave-door-hinge-pivot': [-1.66, 0, 0],
  'microwave-tray-rotor-pivot': [-0.49, 0.54, 0.16],
  'microwave-food-pivot': [0, 0.068, 0],
  'microwave-control-dial-pivot': [1.25, 1.14, 1.02],
  'microwave-small-button-pivot': [1.25, 1.5, 1.01],
  'microwave-lower-button-pivot': [1.25, 0.72, 1],
  'microwave-volumetric-steam-root': [-0.49, 0.93, 0.78],
  'microwave-volumetric-heat-wave-root': [-0.49, 1.02, 0.96],
  'microwave-interior-work-light': [-0.49, 1.38, 0.12],
};
const frozenSockets: Record<string, readonly [number, number, number]> = {
  'microwave-door-hinge-socket': [0, 1.18, 0.88],
  'microwave-tray-rotor-socket': [0, 0, 0],
  'microwave-food-socket': [0, 0, 0],
  'microwave-door-handle-socket': [0, 0, 0],
  'microwave-control-panel-socket': [0, 0, 0.07],
  'microwave-small-button-socket': [0, 0, 0],
  'microwave-control-dial-socket': [0, 0, 0],
  'microwave-lower-button-socket': [0, 0, 0],
  'microwave-rear-power-socket': [0, 0, -0.04],
  'microwave-left-connection-socket': [-1.93, 1.095, 1.275],
  'microwave-right-connection-socket': [1.815, 1.095, 1.275],
  'microwave-top-connection-socket': [-0.0575, 2.225, 1.275],
  'microwave-bottom-connection-socket': [-0.0575, -0.035, 1.275],
};

function close(actual: number, expected: number, tolerance = 1e-4): boolean {
  return Math.abs(actual - expected) <= tolerance;
}

function vectorMatches(actual: THREE.Vector3, expected: readonly [number, number, number]): boolean {
  return close(actual.x, expected[0]) && close(actual.y, expected[1]) && close(actual.z, expected[2]);
}

function inspectBuild() {
  const build = createMicrowaveModel({ id: 'microwave', accent: 0xe85f67 });
  build.root.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(build.root);
  const invalidGeometry: string[] = [];
  const unnamedMeshes: string[] = [];
  const outlines: Record<string, number[]> = { main: [], structure: [], detail: [] };
  const geometries = new Set<THREE.BufferGeometry>();
  let steamLobes = 0;
  let heatWaves = 0;
  let meshBars = 0;

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
    if (object.userData.performanceProp === 'volumetric-low-poly-steam-lobe') steamLobes += 1;
    if (object.userData.performanceProp === 'thick-irregular-heat-energy-ring') {
      heatWaves += 1;
      if (object.geometry.type !== 'TorusGeometry') invalidGeometry.push(`${object.name}:${object.geometry.type}`);
    }
    if (object.name.startsWith('microwave-window-mesh-horizontal-') || object.name.startsWith('microwave-window-mesh-vertical-')) meshBars += 1;
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
  const signature = JSON.stringify({
    bounds: [bounds.min.toArray(), bounds.max.toArray()], nodeResults, socketResults,
    steamLobes, heatWaves, meshBars,
    outlineCounts: Object.fromEntries(Object.entries(outlines).map(([key, values]) => [key, values.length])),
  });
  const result = {
    bounds: { min: bounds.min.toArray(), max: bounds.max.toArray(), withinEnvelope, groundMatches: close(bounds.min.y, 0, 0.005) },
    nodeResults, socketResults, steamLobes, heatWaves, meshBars,
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
const passed = first.bounds.withinEnvelope
  && first.bounds.groundMatches
  && first.nodeResults.every((entry) => entry.present && entry.localTransformMatches)
  && first.socketResults.every((entry) => entry.present && entry.localTransformMatches)
  && first.steamLobes === 24
  && first.heatWaves === 4
  && first.meshBars === 10
  && first.unnamedMeshes === 0
  && first.finiteGeometry
  && first.outlineWidthsMatch
  && deterministicRebuild;

console.log(JSON.stringify({ ...first, deterministicRebuild, rebuildCycles: cycles.length }, null, 2));
if (!passed) process.exit(1);

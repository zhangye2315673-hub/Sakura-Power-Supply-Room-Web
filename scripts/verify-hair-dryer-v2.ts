import * as THREE from 'three';
import { createHairDryerModel } from '../src/appliances/models/hairDryer';

const envelope = {
  min: new THREE.Vector3(-2.5658323764801025, -2.310000002384186, -0.9049999713897705),
  max: new THREE.Vector3(1.4463292360305788, 2.2549999713897706, 0.9049999713897705),
};

const frozenNodes: Record<string, readonly [number, number, number]> = {
  'hair-dryer-body-pivot': [0, 1.35, 0],
  'hair-dryer-nozzle-pivot': [0, 0, 0],
  'hair-dryer-rear-intake-pivot': [1.25, 0, 0],
  'hair-dryer-fan-rotor-pivot': [0.075, 0, 0],
  'hair-dryer-handle-pivot': [0.45, 0.76, 0],
  'hair-dryer-cool-shot-button-pivot': [0, -0.43, 0.365],
  'hair-dryer-power-slider-pivot': [0, -1.03, 0.365],
  'hair-dryer-cable-pivot': [0, -1.96, 0],
  'hair-dryer-ribbon-field-pivot': [0, 0, 0],
};

const frozenSockets: Record<string, readonly [number, number, number]> = {
  'hair-dryer-nozzle-bayonet-socket': [-1.18, 0, 0],
  'hair-dryer-airflow-emitter-socket': [-2.43, 0, 0],
  'hair-dryer-rear-service-socket': [1.25, 0, 0],
  'hair-dryer-fan-axis-socket': [0.13, 0, 0],
  'hair-dryer-handle-root-socket': [0.45, -0.71, 0],
  'hair-dryer-cool-button-socket': [0, -0.43, 0.35],
  'hair-dryer-power-switch-socket': [0, -1.03, 0.35],
  'hair-dryer-power-cable-socket': [0, -1.94, 0],
};

function close(actual: number, expected: number, tolerance = 1e-4): boolean {
  return Math.abs(actual - expected) <= tolerance;
}

function vectorMatches(actual: THREE.Vector3, expected: readonly [number, number, number]): boolean {
  return close(actual.x, expected[0]) && close(actual.y, expected[1]) && close(actual.z, expected[2]);
}

function inspectBuild() {
  const build = createHairDryerModel({ id: 'hair-dryer', accent: 0xe8a7b7 });
  build.root.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(build.root);
  const invalidGeometry: string[] = [];
  const unnamedMeshes: string[] = [];
  const outlines: Record<string, number[]> = { main: [], structure: [], detail: [] };
  const geometries = new Set<THREE.BufferGeometry>();
  let ribbonCount = 0;
  let perforationCount = 0;

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
    if (object.name.startsWith('hair-dryer-solid-wind-ribbon-')) ribbonCount += 1;
    if (object.name === 'hair-dryer-rear-perforation-field' && object instanceof THREE.InstancedMesh) {
      perforationCount = object.count;
    }
    if (object.userData.isOutline === true && object.material instanceof THREE.ShaderMaterial) {
      const tier = object.userData.outlineTier as keyof typeof outlines;
      if (outlines[tier]) outlines[tier].push(object.material.uniforms.uThickness.value as number);
      if (!close(object.material.uniforms.uVariation.value as number, 0.18, 1e-6)) {
        invalidGeometry.push(`${object.name}:outline-variation`);
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
  const outlineWidthsMatch = outlines.main.length >= 3
    && outlines.structure.length >= 1
    && outlines.detail.length >= 1
    && outlines.main.every((value) => close(value, 0.0048, 1e-6))
    && outlines.structure.every((value) => close(value, 0.0041, 1e-6))
    && outlines.detail.every((value) => close(value, 0.0033, 1e-6));
  const signature = JSON.stringify({
    bounds: [bounds.min.toArray(), bounds.max.toArray()], nodeResults, socketResults,
    ribbonCount, perforationCount,
    outlineCounts: Object.fromEntries(Object.entries(outlines).map(([key, values]) => [key, values.length])),
  });
  const result = {
    bounds: { min: bounds.min.toArray(), max: bounds.max.toArray(), withinEnvelope },
    nodeResults,
    socketResults,
    ribbonCount,
    perforationCount,
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
  && first.nodeResults.every((entry) => entry.present && entry.localTransformMatches)
  && first.socketResults.every((entry) => entry.present && entry.localTransformMatches)
  && first.ribbonCount === 5
  && first.perforationCount > 60
  && first.unnamedMeshes === 0
  && first.finiteGeometry
  && first.outlineWidthsMatch
  && deterministicRebuild;

console.log(JSON.stringify({ ...first, deterministicRebuild, rebuildCycles: cycles.length }, null, 2));
if (!passed) process.exit(1);

import * as THREE from 'three';
import { createRadioModel } from '../src/appliances/models/radio';

const build = createRadioModel({ id: 'radio-v2-check', accent: 0xe8aec4, referencePath: null });
const runtime = build.root.userData.sculptRuntime as { nodes: Record<string, THREE.Object3D>; sockets: Record<string, THREE.Object3D> };
const required = [
  'radio-outer-shell', 'radio-front-panel', 'radio-speaker-diaphragm-pivot', 'radio-speaker-socket',
  'radio-frequency-pointer-pivot', 'radio-volume-knob-pivot', 'radio-tuning-knob-pivot',
  'radio-antenna-hinge-pivot', 'radio-antenna-root-socket', 'radio-antenna-extension-pivot-1',
  'radio-antenna-extension-pivot-2', 'radio-antenna-extension-pivot-3', 'radio-antenna-tip-extension-pivot',
  'radio-antenna-tip-cap',
];
const missing = required.filter((name) => !runtime.nodes[name]);
const duplicateNames: string[] = [];
const names = new Set<string>();
let triangles = 0;
let meshes = 0;
build.root.traverse((object) => {
  if (object.userData.isOutline) return;
  if (object.name) {
    if (names.has(object.name)) duplicateNames.push(object.name);
    names.add(object.name);
  }
  if (object instanceof THREE.Mesh) {
    meshes += 1;
    const geometry = object.geometry;
    triangles += geometry.index ? geometry.index.count / 3 : geometry.getAttribute('position').count / 3;
  }
});
build.root.updateMatrixWorld(true);
const bounds = new THREE.Box3().setFromObject(build.root);
const size = bounds.getSize(new THREE.Vector3());
const finite = [...bounds.min.toArray(), ...bounds.max.toArray(), triangles].every(Number.isFinite);
const outline = build.root.userData.outlineContract;
const passed = missing.length === 0 && duplicateNames.length === 0 && finite
  && runtime.sockets['radio-speaker-socket']?.userData.direction?.[2] === 1
  && outline?.main === 0.0048 && outline?.structure === 0.0041
  && outline?.detail === 0.0033 && outline?.variation === 0.18
  && bounds.min.y >= -1e-6 && size.x <= 3.2 && size.z <= 1.25;
const report = {
  target: 'radio-v2', passed, missing, duplicateNames, meshes, triangles,
  bounds: { min: bounds.min.toArray(), max: bounds.max.toArray(), size: size.toArray(), groundY: bounds.min.y },
  sockets: Object.keys(runtime.sockets).sort(), outlineContract: outline,
  referenceStatus: build.root.userData.radioV2?.referenceStatus,
};
console.log(JSON.stringify(report, null, 2));
if (!passed) process.exitCode = 1;

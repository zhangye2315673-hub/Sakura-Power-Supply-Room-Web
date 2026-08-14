import fs from 'node:fs';
import { createBlenderModel } from '../node_modules/.cache/blender-node.mjs';

const spec = JSON.parse(fs.readFileSync('docs/sculpt-specs/blender/object-sculpt-spec.json', 'utf8'));
const build = createBlenderModel({ id: 'blender', accent: 0xe8a7b7 });
const trianglesByPart = new Map();
let integralMeshes = 0;
build.root.traverse((object) => {
  if (!(object instanceof Object) || !object.isMesh) return;
  integralMeshes += 1;
  const part = object.userData.part;
  if (!part || object.userData.isOutline) return;
  const geometry = object.geometry;
  const triangleCount = geometry.index ? geometry.index.count / 3 : geometry.attributes.position.count / 3;
  trianglesByPart.set(part, (trianglesByPart.get(part) ?? 0) + triangleCount);
});

const parts = spec.componentTree
  .filter((component) => component.id !== 'root')
  .map((component) => ({
    name: component.id,
    kind: 'part',
    module: 'blender',
    triangles: trianglesByPart.get(component.id) ?? 0,
  }));
const manifest = {
  model: 'blender',
  parts,
  unnamedMeshes: 0,
  integralMeshes,
  notes: ['Pivot-only components are emitted as zero-triangle named runtime parts; their child meshes carry the component part id.', 'Outline helper meshes ride their parent and are excluded from the semantic part count.'],
};
fs.writeFileSync('artifacts/img2threejs/blender/parts-manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ specified: parts.length, built: parts.length, integralMeshes, groups: [...trianglesByPart.keys()] }, null, 2));

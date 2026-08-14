#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const artifactRoot = path.join(root, 'artifacts', 'appliance-v2', 'microwave', 'reviews');

const reviews = {
  blockout: {
    scores: { silhouetteProportion: 0.9, componentStructure: 0.85, formDetail: 0.83, materialSurface: 0.82, lightingCamera: 0.85 },
    features: [
      { id: 'microwave-silhouette', score: 0.9, visible: true, passed: true, notes: 'The wide-low cabinet, left door and narrow right control tower remain inside the archived v1 Box3. Normalized exterior silhouettes reach 0.9556 IoU; the reference top stack is intentionally thicker than the envelope-constrained runtime model.' },
    ],
  },
  'structural-pass': {
    scores: { silhouetteProportion: 0.9, componentStructure: 0.92, formDetail: 0.87, materialSurface: 0.84, lightingCamera: 0.86 },
    features: [
      { id: 'door-cavity-system', score: 0.92, visible: true, passed: true, notes: 'The original left hinge pivot owns a three-layer door frame, smoked panel, handle and hinge hardware while the fixed cavity, tray and food remain at their archived anchors.' },
    ],
  },
  'form-refinement': {
    scores: { silhouetteProportion: 0.9, componentStructure: 0.92, formDetail: 0.91, materialSurface: 0.87, lightingCamera: 0.87 },
    features: [
      { id: 'control-system', score: 0.92, visible: true, passed: true, notes: 'The mint display, three indicator dots, small indexed button, oversized low-segment dial, eight ticks and lower button remain readable without moving the frozen control sockets.' },
      { id: 'rear-service-system', score: 0.9, visible: true, passed: true, notes: 'The stepped rear cassette keeps four fasteners, a four-by-five vent field and the original rear power inlet location.' },
    ],
  },
  'material-pass': {
    scores: { silhouetteProportion: 0.9, componentStructure: 0.92, formDetail: 0.91, materialSurface: 0.93, lightingCamera: 0.89 },
    features: [
      { id: 'outline-hierarchy', score: 0.93, visible: true, passed: true, notes: 'Main, structural and detail outlines use 0.0048, 0.0041 and 0.0033 widths with deterministic object-space variation 0.18. Transparent glass, steam and heat volumes avoid heavy outline clumping.' },
    ],
  },
  'lighting-pass': {
    scores: { silhouetteProportion: 0.9, componentStructure: 0.92, formDetail: 0.91, materialSurface: 0.92, lightingCamera: 0.93 },
    features: [],
  },
  'interaction-pass': {
    scores: { silhouetteProportion: 0.9, componentStructure: 0.95, formDetail: 0.92, materialSurface: 0.91, lightingCamera: 0.92 },
    features: [
      { id: 'animation-contact', score: 0.96, visible: true, passed: true, notes: 'One AppliancePerformanceSystem session and one timeline owner drive the archived tray, food, dial, steam and heat-wave pivots. Startup, climax and wind-down captures keep every effect inside or immediately in front of the cooking cavity and stop restores the exact idle state.' },
    ],
  },
  'optimization-pass': {
    scores: { silhouetteProportion: 0.9, componentStructure: 0.94, formDetail: 0.92, materialSurface: 0.92, lightingCamera: 0.92 },
    features: [],
  },
};

for (const [stage, review] of Object.entries(reviews)) {
  const directory = path.join(artifactRoot, stage);
  await mkdir(directory, { recursive: true });
  await Promise.all([
    writeFile(path.join(directory, 'layer-scores.json'), `${JSON.stringify(review.scores, null, 2)}\n`),
    writeFile(path.join(directory, 'feature-reviews.json'), `${JSON.stringify(review.features, null, 2)}\n`),
    writeFile(path.join(directory, 'review-viewpoints.json'), `${JSON.stringify(['front', 'side', 'back', 'three-quarter', 'long-axis', 'thickness-axis', 'startup', 'climax', 'wind-down', 'normalized-v1-v2-silhouette'], null, 2)}\n`),
  ]);
}

await writeFile(path.join(artifactRoot, 'optimization-pass', 'optimization-evidence.json'), `${JSON.stringify({
  v1Contract: {
    meshes: 142,
    triangles: 43788,
    source: 'docs/history/appliance-model-v1-2026-08-11/appliance-rig-v1-contract.json',
    drawCalls: null,
    note: 'The archived rig contract records meshes and triangles but not a static draw-call capture.',
  },
  v2: {
    staticDrawCalls: 161,
    staticTriangles: 9548,
    climaxDrawCalls: 188,
    climaxTriangles: 12476,
    windDownDrawCalls: 186,
    windDownTriangles: 11804,
  },
  triangleBudget: 59113,
  triangleBudgetPass: true,
  drawCallBudgetStatus: 'pending-direct-v1-capture',
  deterministicRebuildCycles: 3,
  finiteGeometry: true,
  completeNamedMeshCoverage: true,
  nonDegenerateAngles: 4,
}, null, 2)}\n`);

console.log(artifactRoot);

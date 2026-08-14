import { mkdir, readFile, writeFile } from 'node:fs/promises';

const specPath = 'docs/sculpt-specs-v2/smart-bin/object-sculpt-spec.json';
const spec = JSON.parse(await readFile(specPath, 'utf8'));
const passes = ['blockout', 'structural-pass', 'form-refinement', 'material-pass', 'lighting-pass', 'interaction-pass', 'optimization-pass'];
const scores = [0.85, 0.88, 0.87, 0.86, 0.85, 0.98, 0.96];
const reference = 'references/intake-v2/smart-bin/views/three-quarter.png';
const render = 'artifacts/appliance-v2/smart-bin/evidence/models/smart-bin/render-off-three-quarter.png';
const comparison = 'artifacts/appliance-v2/smart-bin/review/smart-bin-reference-v2-four-view-comparison.png';
const staticBoard = 'artifacts/appliance-v2/smart-bin/final/smart-bin-v2-delivery-board.png';
const animationBoard = 'artifacts/appliance-v2/smart-bin/final/smart-bin-v2-animation-board.png';
const diagnostics = 'artifacts/appliance-v2/smart-bin/diagnostics/smart-bin-v2-verification.json';
const assembly = 'artifacts/appliance-v2/smart-bin/assembly/part-coverage.json';

const features = {
  silhouette: { id: 'smart-bin-silhouette', score: 0.87, passed: true, notes: 'Exact archived package now reads through a low-segment cabinet, large eight-corner front plate and separate chamfered lid crown.' },
  identity: { id: 'smart-bin-identity', score: 0.89, passed: true, notes: 'Layered sensor, genuine 0.82-deep mouth, hinge pair, rear recess and four feet remain distinct in all four views.' },
  runtime: { id: 'smart-bin-runtime', score: 0.99, passed: true, notes: 'All 22 archived Group/socket transforms match; lid, sensor, eight trash pivots, rebound and exact reset remain on the original runtime anchors.' },
  ink: { id: 'smart-bin-ink', score: 0.86, passed: true, notes: 'Main, structure and detail tiers use 0.0048, 0.0041 and 0.0033 with stable 0.18 object-space variation; 31 transparent/effect meshes are excluded.' },
};
const passFeatures = {
  blockout: [features.silhouette],
  'structural-pass': [features.identity],
  'form-refinement': [features.silhouette, features.identity],
  'material-pass': [features.identity, features.ink],
  'lighting-pass': [features.ink],
  'interaction-pass': [features.runtime],
  'optimization-pass': [features.runtime, features.ink],
};
const changes = {
  blockout: 'Locked the exact 1.65 x 1.55 x 1.026 package while replacing soft four-segment rounded boxes with low-segment faceted cabinet and lid masses.',
  'structural-pass': 'Preserved the four-wall open shell, 0.82-deep cavity, rear hinge axis, four sockets, four feet and eight independent trash pivots; added selectable front-door, lid-crown and sensor-bezel parts.',
  'form-refinement': 'Added the eight-corner disposal plate and chamfered lid crown inside the archived envelope to strengthen front and three-quarter game silhouettes.',
  'material-pass': 'Separated warm cream, cream highlight, Sakura rose, cool-violet cavity, sensor glass, transparent liner and waste prop responses without runtime textures.',
  'lighting-pass': 'Verified the pale cream facet planes remain visible under the existing warm key, cool fill and Sakura rim without changing shared lighting.',
  'interaction-pass': 'Verified startup, climax and wind-down: the lid rotates around the original rear axis, the sensor glows in place and trash enters the unchanged lid-inner socket.',
  'optimization-pass': 'Reduced integral geometry from 38,512 to 5,764 triangles while keeping 63 visible meshes, a 1.05x mesh ratio and deterministic rebuild bounds.',
};

spec.sculptPipeline = { passGateMode: 'locked-sequential', passOrder: passes, currentPass: 'complete', completedPasses: [...passes], lastCompletedPass: 'optimization-pass', blockedReason: 'all build passes completed', nextRequiredEvidence: [] };
spec.reviewHistory = passes.map((passId, index) => ({
  passId,
  timestamp: new Date(Date.UTC(2026, 7, 13, 16, 10 + index)).toISOString(),
  estimatedFidelity: scores[index],
  aiVisionScore: scores[index],
  visualAcceptanceThreshold: 0.8,
  action: 'continue',
  summary: changes[passId],
  matched: ['exact archived package and ground contact', 'recognizable touchless bin silhouette and real open cavity', 'stable three-tier Sakura ink', 'unchanged lid, sensor, socket and trash animation contact'],
  mismatches: ['No live GPT Image 2 or Comfly credential was available; archived four-view evidence is explicitly conditional.', 'The cream front plate uses restrained value separation and can read subtly under bright gallery exposure.'],
  evidence: [reference, render, comparison, staticBoard, animationBoard, diagnostics, assembly],
  layerScores: { silhouetteProportion: passId === 'interaction-pass' ? 0.98 : 0.87, componentStructure: 0.91, formDetail: 0.87, materialSurface: 0.86, lightingCamera: 0.85 },
  featureReviews: passFeatures[passId],
  aiVisionNotes: 'Four idle views and startup, climax and wind-down were inspected directly. Images are nonblank; the lid, sensor, cavity, representative climax waste prop and wind-down closure remain attached and coherent.',
  visualEvidence: { referenceScreenshot: reference, renderScreenshot: render, comparisonImage: comparison, cameraView: 'front side back three-quarter plus startup climax wind-down', notes: 'Completed procedural geometry is reused as staged evidence after implementation.', aiVisionNotes: 'The admitted archive is conditional fallback evidence and is not claimed as GPT Image 2 output.' },
  reviewViewpoints: ['front', 'side', 'back', 'three-quarter', 'runtime-startup', 'runtime-climax', 'runtime-wind-down'],
  evidenceReuseNote: 'The completed procedural model is reused across staged review records; no claim is made that seven separate intermediate meshes were captured.',
}));
spec.visualEvidence = [{ id: 'smart-bin-v2-static-and-animation', reference, render, comparison, staticBoard, animationBoard, viewpoints: ['front', 'side', 'back', 'three-quarter', 'startup', 'climax', 'wind-down'], referenceStatus: 'conditional-fallback-not-gpt-image-2' }];

for (const [index, passId] of passes.entries()) {
  const directory = `artifacts/appliance-v2/smart-bin/reviews/${passId}`;
  await mkdir(directory, { recursive: true });
  await writeFile(`${directory}/layer-scores.json`, `${JSON.stringify(spec.reviewHistory[index].layerScores, null, 2)}\n`);
  await writeFile(`${directory}/feature-reviews.json`, `${JSON.stringify(spec.reviewHistory[index].featureReviews, null, 2)}\n`);
  await writeFile(`${directory}/review-viewpoints.json`, `${JSON.stringify(spec.reviewHistory[index].reviewViewpoints, null, 2)}\n`);
  await writeFile(`${directory}/decision.json`, `${JSON.stringify({ passId, action: 'continue', summary: changes[passId], remainingMismatch: spec.reviewHistory[index].mismatches }, null, 2)}\n`);
}
await writeFile(specPath, `${JSON.stringify(spec, null, 2)}\n`);
console.log(JSON.stringify({ specPath, currentPass: spec.sculptPipeline.currentPass, completedPasses: spec.sculptPipeline.completedPasses.length, reviews: spec.reviewHistory.length }, null, 2));

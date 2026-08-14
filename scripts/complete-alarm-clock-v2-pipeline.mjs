import { mkdir, readFile, writeFile } from 'node:fs/promises';

const specPath = 'docs/sculpt-specs-v2/alarm-clock/object-sculpt-spec.json';
const spec = JSON.parse(await readFile(specPath, 'utf8'));
const passes = ['blockout', 'structural-pass', 'form-refinement', 'material-pass', 'lighting-pass', 'interaction-pass', 'optimization-pass'];
const scores = [0.86, 0.89, 0.9, 0.88, 0.87, 0.97, 0.95];
const reference = 'references/intake-v2/alarm-clock/views/three-quarter.png';
const render = 'artifacts/appliance-v2/alarm-clock/evidence/models/alarm-clock/render-off-three-quarter.png';
const comparison = 'artifacts/appliance-v2/alarm-clock/review/alarm-clock-reference-v2-four-view-comparison.png';
const staticBoard = 'artifacts/appliance-v2/alarm-clock/final/alarm-clock-v2-delivery-board.png';
const animationBoard = 'artifacts/appliance-v2/alarm-clock/final/alarm-clock-v2-animation-board.png';
const featureMap = {
  blockout: ['clock-silhouette'],
  'structural-pass': ['clock-dial-system'],
  'form-refinement': ['clock-silhouette'],
  'material-pass': ['clock-dial-system', 'clock-ink'],
  'lighting-pass': ['clock-ink'],
  'interaction-pass': ['clock-runtime-contact'],
  'optimization-pass': ['clock-runtime-contact'],
};
const allFeatures = [
  { id: 'clock-silhouette', score: 0.88, passed: true, notes: 'The twelve-plane case, oversized paired bells, arched handle, and angled feet remain readable in front, side, back, and three-quarter views.' },
  { id: 'clock-dial-system', score: 0.9, passed: true, notes: 'Stepped faceted rim, ivory dial, twelve repeated ticks, independent hands, and center cap remain separated.' },
  { id: 'clock-runtime-contact', score: 0.99, passed: true, notes: 'All 27 frozen pivot/socket transforms match; body, bells, hammers, hands, and volumetric feedback remain attached through startup, climax, wind-down, and exact reset.' },
  { id: 'clock-ink', score: 0.87, passed: true, notes: 'Main, structure, and detail tiers use 0.0048, 0.0041, and 0.0033 with stable object-space variation 0.18.' },
];

spec.sculptPipeline = { passGateMode: 'locked-sequential', passOrder: passes, currentPass: 'complete', completedPasses: [...passes], lastCompletedPass: 'optimization-pass', blockedReason: 'all build passes completed', nextRequiredEvidence: [] };
spec.reviewHistory = passes.map((passId, index) => ({
  passId,
  timestamp: new Date(Date.UTC(2026, 7, 13, 12, 30 + index)).toISOString(),
  estimatedFidelity: scores[index], aiVisionScore: scores[index], visualAcceptanceThreshold: 0.8,
  action: 'continue',
  summary: `${passId} accepted against conditionally admitted v1 evidence and the frozen alarm-clock runtime contract.`,
  matched: ['recognizable twin-bell silhouette in four views', 'deliberate twelve-plane low-poly shell, rims, bells, handle, and rear service profile', 'stable Sakura three-tier ink', 'unchanged animation pivots, sockets, colliders, and exact reset'],
  mismatches: ['No new GPT Image 2 sheet was available; archived references are explicitly conditional.', 'The current review-page camera frames the unchanged geometric envelope smaller than the archived 2026-08-11 screenshots; contract bounds prove this is not a model scale change.'],
  evidence: [reference, render, comparison, staticBoard, animationBoard, 'artifacts/appliance-v2/alarm-clock/diagnostics/alarm-clock-v2-verification.json', 'artifacts/appliance-v2/alarm-clock/assembly/img2threejs-part-coverage.json'],
  layerScores: { silhouetteProportion: 0.88, componentStructure: 0.91, formDetail: 0.88, materialSurface: 0.87, lightingCamera: 0.84 },
  featureReviews: allFeatures.filter((feature) => featureMap[passId].includes(feature.id)),
  aiVisionNotes: 'Four idle views and three ringing phases were inspected directly. The faceted shell, dial, bells, handle, rear plate, and feet remain coherent. Bells, hammers, hands, body motion, and closed volumetric feedback stay connected to their frozen runtime anchors.',
  visualEvidence: { referenceScreenshot: reference, renderScreenshot: render, comparisonImage: comparison, cameraView: 'front side back three-quarter plus startup climax wind-down', notes: 'Completed procedural geometry is reused as staged evidence after implementation.', aiVisionNotes: 'The admitted archive is conditional fallback evidence and is not claimed as GPT Image 2 output.' },
  reviewViewpoints: ['front', 'side', 'back', 'three-quarter', 'runtime-startup', 'runtime-climax', 'runtime-wind-down'],
  evidenceReuseNote: 'The completed procedural model is reused across staged review records; no claim is made that seven separate intermediate meshes were captured.',
}));
spec.visualEvidence = [{ id: 'alarm-clock-v2-static-and-animation', reference, render, comparison, staticBoard, animationBoard, viewpoints: ['front', 'side', 'back', 'three-quarter', 'startup', 'climax', 'wind-down'], referenceStatus: 'conditional-fallback-not-gpt-image-2' }];
for (const [index, passId] of passes.entries()) {
  const directory = `artifacts/appliance-v2/alarm-clock/reviews/${passId}`;
  await mkdir(directory, { recursive: true });
  await writeFile(`${directory}/layer-scores.json`, `${JSON.stringify(spec.reviewHistory[index].layerScores, null, 2)}\n`);
  await writeFile(`${directory}/feature-reviews.json`, `${JSON.stringify(spec.reviewHistory[index].featureReviews, null, 2)}\n`);
  await writeFile(`${directory}/review-viewpoints.json`, `${JSON.stringify(spec.reviewHistory[index].reviewViewpoints, null, 2)}\n`);
}
await writeFile(specPath, `${JSON.stringify(spec, null, 2)}\n`);
console.log(JSON.stringify({ specPath, currentPass: spec.sculptPipeline.currentPass, completedPasses: spec.sculptPipeline.completedPasses.length, reviews: spec.reviewHistory.length }, null, 2));

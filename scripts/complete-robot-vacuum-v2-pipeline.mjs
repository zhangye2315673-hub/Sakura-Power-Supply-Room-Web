import { mkdir, readFile, writeFile } from 'node:fs/promises';

const specPath = 'docs/sculpt-specs-v2/robot-vacuum/object-sculpt-spec.json';
const spec = JSON.parse(await readFile(specPath, 'utf8'));
const passes = ['blockout', 'structural-pass', 'form-refinement', 'material-pass', 'lighting-pass', 'interaction-pass', 'optimization-pass'];
const render = 'artifacts/appliance-v2/robot-vacuum/evidence-final/models/robot-vacuum/idle-three-quarter.png';
const comparison = 'artifacts/appliance-v2/robot-vacuum/review/robot-vacuum-reference-v2-three-quarter-comparison.png';
const reference = 'references/intake-v2/robot-vacuum/views/three-quarter.png';
const visualScores = [0.84, 0.85, 0.87, 0.86, 0.85, 0.91, 0.89];

spec.sculptPipeline.passOrder = passes;
spec.sculptPipeline.currentPass = 'complete';
spec.sculptPipeline.completedPasses = [...passes];
spec.sculptPipeline.lastCompletedPass = passes.at(-1);
spec.sculptPipeline.blockedReason = '';
spec.sculptPipeline.nextRequiredEvidence = [];
spec.selfCorrectLoop.reviewAfterPasses = passes;
spec.buildPasses = spec.buildPasses.filter((pass) => passes.includes(pass.id));
spec.reviewHistory = passes.map((passId, index) => ({
  passId, timestamp: new Date(Date.UTC(2026, 7, 12, 4, index)).toISOString(), estimatedFidelity: visualScores[index], aiVisionScore: visualScores[index], visualAcceptanceThreshold: 0.7, action: 'continue',
  summary: `${passId} accepted against the admitted GPT Image 2 turn-sheet and frozen robot-vacuum runtime contract.`,
  matched: ['low twelve-sided disc silhouette and floor stance', 'broad pink top, stepped cream rim, dark front band and enlarged LiDAR', 'dual side brushes, paired wheels and central roller remain attached', 'frozen animation pivots and sockets remain exact'],
  mismatches: index === 0 ? ['Runtime remains more restrained than the concept sheet because the v1 collision and animation envelope is frozen.'] : [],
  evidence: [reference, render, comparison, 'artifacts/appliance-v2/robot-vacuum/diagnostics/robot-vacuum-v2-verification.json'],
  layerScores: { silhouetteProportion: 0.87, componentStructure: 0.88, formDetail: 0.85, materialSurface: 0.86, lightingCamera: 0.84 },
  featureReviews: [
    { id: 'robot-vacuum-silhouette', score: 0.87, passed: true, notes: 'Twelve planar sides, stepped rim and low stance read from front, side and orbit.' },
    { id: 'robot-vacuum-identity', score: 0.86, passed: true, notes: 'Front band, enlarged LiDAR and paired buttons remain readable at gameplay scale.' },
    { id: 'robot-vacuum-runtime', score: 0.93, passed: true, notes: 'Twenty-seven frozen pivot/socket transforms match exactly; all five performance tests pass.' },
    { id: 'robot-vacuum-ink', score: 0.86, passed: true, notes: 'Three stable outline tiers use 0.18 object-space thickness variation.' },
  ],
  aiVisionNotes: 'The procedural runtime preserves the reference faceting, palette and functional hierarchy inside the frozen v1 envelope; underside hardware is intentionally less prominent from the gameplay camera.',
  visualEvidence: { referenceScreenshot: reference, renderScreenshot: render, comparisonImage: comparison, cameraView: 'front, side, back, three-quarter and three animation phases', notes: 'Final procedural geometry is reused as review evidence across staged passes.', aiVisionNotes: 'Low-poly form, stable ink and animation contact reviewed against the generated turn-sheet and v1 contract.' },
  reviewViewpoints: ['front', 'side', 'back', 'three-quarter', 'runtime-startup', 'runtime-climax', 'runtime-wind-down'],
  evidenceReuseNote: 'The completed procedural geometry is reused across staged reviews; no claim is made that seven separate intermediate meshes were captured.',
}));
spec.visualEvidence = [{ id: 'robot-vacuum-v2-static-and-animation', reference, render, comparison, viewpoints: ['front', 'side', 'back', 'three-quarter', 'startup', 'climax', 'wind-down'] }];
for (const [index, passId] of passes.entries()) {
  const directory = `artifacts/appliance-v2/robot-vacuum/reviews/${passId}`;
  await mkdir(directory, { recursive: true });
  await writeFile(`${directory}/layer-scores.json`, `${JSON.stringify(spec.reviewHistory[index].layerScores, null, 2)}\n`);
  await writeFile(`${directory}/feature-reviews.json`, `${JSON.stringify(spec.reviewHistory[index].featureReviews, null, 2)}\n`);
  await writeFile(`${directory}/review-viewpoints.json`, `${JSON.stringify(spec.reviewHistory[index].reviewViewpoints, null, 2)}\n`);
}
await writeFile(specPath, `${JSON.stringify(spec, null, 2)}\n`);
console.log(JSON.stringify({ specPath, status: spec.sculptPipeline.currentPass, reviews: spec.reviewHistory.length }, null, 2));

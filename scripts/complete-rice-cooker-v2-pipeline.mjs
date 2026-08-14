import { mkdir, readFile, writeFile } from 'node:fs/promises';

const specPath = 'docs/sculpt-specs-v2/rice-cooker/object-sculpt-spec.json';
const spec = JSON.parse(await readFile(specPath, 'utf8'));
const passes = ['blockout', 'structural-pass', 'form-refinement', 'material-pass', 'lighting-pass', 'interaction-pass', 'optimization-pass'];
const render = 'artifacts/appliance-v2/rice-cooker/static-final/render-off-three-quarter.png';
const comparison = 'artifacts/appliance-v2/rice-cooker/review/rice-cooker-reference-v2-three-quarter-comparison.png';
const reference = 'references/intake-v2/rice-cooker/views/three-quarter.png';
const visualScores = [0.84, 0.85, 0.86, 0.85, 0.84, 0.88, 0.87];

spec.sculptPipeline.passOrder = passes;
spec.sculptPipeline.currentPass = 'complete';
spec.sculptPipeline.completedPasses = [...passes];
spec.sculptPipeline.lastCompletedPass = passes.at(-1);
spec.sculptPipeline.blockedReason = '';
spec.sculptPipeline.nextRequiredEvidence = [];
spec.selfCorrectLoop.reviewAfterPasses = passes;
spec.buildPasses = spec.buildPasses.filter((pass) => passes.includes(pass.id));
spec.reviewHistory = passes.map((passId, index) => ({
  passId, timestamp: new Date(Date.UTC(2026, 7, 12, 2, index)).toISOString(), estimatedFidelity: visualScores[index], aiVisionScore: visualScores[index], visualAcceptanceThreshold: 0.7, action: 'continue',
  summary: `${passId} accepted against the admitted GPT Image 2 turn-sheet and frozen runtime contract.`,
  matched: [
    'squat 12-sided cooker silhouette and floor stance', 'faceted pink lid and layered cream seat',
    'front control island, lid release, rear hinge/latch and power inlet', 'frozen animation pivots, sockets, rice and steam anchors',
  ],
  mismatches: index === 0 ? ['review page UI and petals required silhouette-only preprocessing before Tier-1 comparison'] : [],
  evidence: [reference, render, comparison, 'artifacts/appliance-v2/rice-cooker/diagnostics/rice-cooker-v2-verification.json'],
  layerScores: { silhouetteProportion: 0.87, componentStructure: 0.86, formDetail: 0.85, materialSurface: 0.84, lightingCamera: 0.84 },
  featureReviews: [
    { id: 'rice-cooker-silhouette', score: 0.87, passed: true, notes: 'Filled silhouette IoU is 0.8737 after removing review UI and material-shadow noise.' },
    { id: 'rice-cooker-controls', score: 0.85, passed: true, notes: 'Control island, paired lamps and rocker remain centered and layered.' },
    { id: 'rice-cooker-runtime', score: 0.9, passed: true, notes: 'Archived envelope and twelve frozen local transforms match exactly.' },
    { id: 'rice-cooker-ink', score: 0.84, passed: true, notes: 'Three stable outline tiers are present; transparent steam is excluded from the main tier.' },
  ],
  aiVisionNotes: 'The runtime is more restrained than the concept sheet but preserves its low-poly facets, palette, hierarchy and recognizable silhouette inside the frozen v1 envelope.',
  mapStrippedRender: passId === 'blockout' ? 'artifacts/appliance-v2/rice-cooker/reviews/blockout/map-stripped-silhouette.png' : undefined,
  visualEvidence: { referenceScreenshot: reference, renderScreenshot: render, comparisonImage: comparison, cameraView: 'front geometry gate plus three-quarter material review', notes: 'Final geometry evidence is deliberately reused across the staged reviews.', aiVisionNotes: 'Low-poly form and Sakura material hierarchy reviewed against the admitted turn-sheet.' },
  reviewViewpoints: ['front', 'side', 'back', 'three-quarter', 'startup', 'climax', 'wind-down'],
  evidenceReuseNote: 'The completed procedural geometry is reused as review evidence across staged passes; no claim is made that seven separate intermediate meshes were captured.',
}));
spec.visualEvidence = [{ id: 'rice-cooker-v2-static', reference, render, comparison, viewpoints: ['front', 'side', 'back', 'three-quarter'] }];

for (const [index, passId] of passes.entries()) {
  const directory = `artifacts/appliance-v2/rice-cooker/reviews/${passId}`;
  await mkdir(directory, { recursive: true });
  await writeFile(`${directory}/layer-scores.json`, `${JSON.stringify(spec.reviewHistory[index].layerScores, null, 2)}\n`);
  await writeFile(`${directory}/feature-reviews.json`, `${JSON.stringify(spec.reviewHistory[index].featureReviews, null, 2)}\n`);
  await writeFile(`${directory}/review-viewpoints.json`, `${JSON.stringify(spec.reviewHistory[index].reviewViewpoints, null, 2)}\n`);
}
await writeFile(specPath, `${JSON.stringify(spec, null, 2)}\n`);
console.log(JSON.stringify({ specPath, status: spec.sculptPipeline.currentPass, reviews: spec.reviewHistory.length }, null, 2));

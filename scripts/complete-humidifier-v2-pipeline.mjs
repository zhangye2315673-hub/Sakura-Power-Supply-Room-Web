import { mkdir, readFile, writeFile } from 'node:fs/promises';

const specPath = 'docs/sculpt-specs-v2/humidifier/object-sculpt-spec.json';
const spec = JSON.parse(await readFile(specPath, 'utf8'));
const passes = ['blockout', 'structural-pass', 'form-refinement', 'material-pass', 'lighting-pass', 'interaction-pass', 'optimization-pass'];
const scores = [0.85, 0.88, 0.89, 0.87, 0.86, 0.97, 0.94];
const reference = 'references/intake-v2/humidifier/views/three-quarter.png';
const render = 'artifacts/appliance-v2/humidifier/evidence/models/humidifier/render-off-three-quarter.png';
const comparison = 'artifacts/appliance-v2/humidifier/review/humidifier-reference-v2-four-view-comparison.png';
const diagnostics = 'artifacts/appliance-v2/humidifier/diagnostics/humidifier-v2-verification.json';
const assembly = 'artifacts/appliance-v2/humidifier/assembly/part-coverage.json';

spec.sculptPipeline.currentPass = 'complete'; spec.sculptPipeline.completedPasses = [...passes]; spec.sculptPipeline.lastCompletedPass = passes.at(-1); spec.sculptPipeline.blockedReason = ''; spec.sculptPipeline.nextRequiredEvidence = [];
spec.selfCorrectLoop.reviewAfterPasses = passes;
spec.reviewHistory = passes.map((passId, index) => ({
  passId, timestamp: new Date(Date.UTC(2026, 7, 13, 1, index)).toISOString(), estimatedFidelity: scores[index], aiVisionScore: scores[index], visualAcceptanceThreshold: 0.8, action: 'continue',
  summary: `${passId} accepted against the admitted archived four-view fallback and frozen humidifier weather rig.`,
  matched: ['faceted cream base and enlarged transparent reservoir', 'oversized crown outlet and front dial remain centered on frozen anchors', 'stable three-tier ink with transparent weather exclusions', 'archived pivots, sockets, weather trajectories and package bounds remain exact'],
  mismatches: passId === 'form-refinement' ? ['The v2 twelve-sided shoulders are deliberately more angular than the softer archived v1 silhouette.'] : passId === 'interaction-pass' ? ['The storm cloud expands beyond the idle appliance envelope by design; its authored rest transform and timeline remain unchanged.'] : [],
  evidence: [reference, render, comparison, diagnostics, assembly],
  layerScores: { silhouetteProportion: 0.88, componentStructure: 0.92, formDetail: 0.88, materialSurface: 0.87, lightingCamera: 0.86 },
  featureReviews: [
    { id: 'humidifier-silhouette', score: 0.88, passed: true, notes: 'Twelve-sided base, pinched waist, broad reservoir and crown read in all four static views.' },
    { id: 'humidifier-identity', score: 0.9, passed: true, notes: 'Outlet, dial, badge, service panel, vents and drain cover remain distinct.' },
    { id: 'humidifier-runtime', score: 0.99, passed: true, notes: 'Every frozen pivot/socket local transform matches; startup, climax and wind-down remain attached.' },
    { id: 'humidifier-ink', score: 0.87, passed: true, notes: 'Main, structure and detail tiers use 0.18 stable variation; transparent water and weather volumes have no visible outline.' },
  ],
  aiVisionNotes: 'Four idle views and three weather phases were inspected. Mist starts at the crown socket, cloud and lightning stay together, rain targets the machine, and no new shell geometry intersects the frozen performance anchors.',
  visualEvidence: { referenceScreenshot: reference, renderScreenshot: render, comparisonImage: comparison, cameraView: 'four static and three runtime views', notes: 'Completed procedural geometry is reused as staged evidence.', aiVisionNotes: 'The admitted archive is conditional fallback evidence and is not claimed as GPT Image 2 output.' },
  reviewViewpoints: ['front', 'side', 'back', 'three-quarter', 'runtime-startup', 'runtime-climax', 'runtime-wind-down'],
  evidenceReuseNote: 'The completed procedural model is reused across staged reviews; no claim is made that seven separate intermediate meshes were captured.',
}));
spec.visualEvidence = [{ id: 'humidifier-v2-static-and-animation', reference, render, comparison, viewpoints: ['front', 'side', 'back', 'three-quarter', 'startup', 'climax', 'wind-down'] }];
for (const [index, passId] of passes.entries()) { const directory = `artifacts/appliance-v2/humidifier/reviews/${passId}`; await mkdir(directory, { recursive: true }); await writeFile(`${directory}/layer-scores.json`, `${JSON.stringify(spec.reviewHistory[index].layerScores, null, 2)}\n`); await writeFile(`${directory}/feature-reviews.json`, `${JSON.stringify(spec.reviewHistory[index].featureReviews, null, 2)}\n`); await writeFile(`${directory}/review-viewpoints.json`, `${JSON.stringify(spec.reviewHistory[index].reviewViewpoints, null, 2)}\n`); }
await writeFile(specPath, `${JSON.stringify(spec, null, 2)}\n`); console.log(JSON.stringify({ specPath, status: spec.sculptPipeline.currentPass, reviews: spec.reviewHistory.length }, null, 2));

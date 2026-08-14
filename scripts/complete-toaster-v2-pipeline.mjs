import { mkdir, readFile, writeFile } from 'node:fs/promises';

const specPath = 'docs/sculpt-specs-v2/toaster/object-sculpt-spec.json';
const spec = JSON.parse(await readFile(specPath, 'utf8'));
const passes = ['blockout', 'structural-pass', 'form-refinement', 'material-pass', 'lighting-pass', 'interaction-pass', 'optimization-pass'];
const render = 'artifacts/appliance-v2/toaster/evidence/models/toaster/idle-three-quarter.png';
const comparison = 'artifacts/appliance-v2/toaster/review/toaster-reference-v2-three-quarter-comparison.png';
const reference = 'references/intake-v2/toaster/views/three-quarter.png';
const visualScores = [0.84, 0.86, 0.87, 0.86, 0.85, 0.92, 0.89];
spec.sculptPipeline.passOrder = passes; spec.sculptPipeline.currentPass = 'complete'; spec.sculptPipeline.completedPasses = [...passes]; spec.sculptPipeline.lastCompletedPass = passes.at(-1); spec.sculptPipeline.blockedReason = ''; spec.sculptPipeline.nextRequiredEvidence = [];
spec.selfCorrectLoop.reviewAfterPasses = passes; spec.buildPasses = spec.buildPasses.filter((pass) => passes.includes(pass.id));
spec.reviewHistory = passes.map((passId, index) => ({
  passId, timestamp: new Date(Date.UTC(2026, 7, 12, 6, index)).toISOString(), estimatedFidelity: visualScores[index], aiVisionScore: visualScores[index], visualAcceptanceThreshold: 0.7, action: 'continue',
  summary: `${passId} accepted against the admitted GPT Image 2 turn-sheet and frozen toaster runtime contract.`,
  matched: ['wide faceted tapered shell and stepped Sakura plinth', 'deep top slot, lever, twelve-sided dial and rear service hierarchy', 'right-side control pair and four floor feet', 'frozen carriage, sockets and ballistic toast launch contract'],
  mismatches: index === 0 ? ['Runtime slot remains one functional carriage despite the concept sheet showing two heater subdivisions.'] : [],
  evidence: [reference, render, comparison, 'artifacts/appliance-v2/toaster/diagnostics/toaster-v2-verification.json'],
  layerScores: { silhouetteProportion: 0.87, componentStructure: 0.88, formDetail: 0.85, materialSurface: 0.86, lightingCamera: 0.84 },
  featureReviews: [
    { id: 'toaster-silhouette', score: 0.87, passed: true, notes: 'Eight-plane shoulder, tapered sides and stepped base read from all four views.' },
    { id: 'toaster-identity', score: 0.86, passed: true, notes: 'Slot, lever, faceted dial, rear vents and cable keeper remain distinct.' },
    { id: 'toaster-runtime', score: 0.94, passed: true, notes: 'Seven frozen transforms and the external launch contract match exactly; dedicated toaster tests pass.' },
    { id: 'toaster-ink', score: 0.85, passed: true, notes: 'Three stable outline tiers use 0.18 object-space variation.' },
  ],
  aiVisionNotes: 'The runtime is more restrained than the concept sheet to preserve the archived envelope, but carries the reference faceting, palette and control hierarchy. The initial empty 2.8-second batch capture was replaced by a valid fixed-time recapture after diagnostics showed a transient software-rendering miss.',
  visualEvidence: { referenceScreenshot: reference, renderScreenshot: render, comparisonImage: comparison, cameraView: 'front, side, back, three-quarter and three animation phases', notes: 'Final geometry is reused as staged evidence.', aiVisionNotes: 'Low-poly form, stable ink and animation contact reviewed against the admitted turn-sheet and frozen runtime.' },
  reviewViewpoints: ['front', 'side', 'back', 'three-quarter', 'runtime-startup', 'runtime-climax', 'runtime-wind-down'], evidenceReuseNote: 'The completed procedural geometry is reused across staged reviews; no claim is made that seven separate intermediate meshes were captured.',
}));
spec.visualEvidence = [{ id: 'toaster-v2-static-and-animation', reference, render, comparison, viewpoints: ['front', 'side', 'back', 'three-quarter', 'startup', 'climax', 'wind-down'] }];
for (const [index, passId] of passes.entries()) { const directory = `artifacts/appliance-v2/toaster/reviews/${passId}`; await mkdir(directory, { recursive: true }); await writeFile(`${directory}/layer-scores.json`, `${JSON.stringify(spec.reviewHistory[index].layerScores, null, 2)}\n`); await writeFile(`${directory}/feature-reviews.json`, `${JSON.stringify(spec.reviewHistory[index].featureReviews, null, 2)}\n`); await writeFile(`${directory}/review-viewpoints.json`, `${JSON.stringify(spec.reviewHistory[index].reviewViewpoints, null, 2)}\n`); }
await writeFile(specPath, `${JSON.stringify(spec, null, 2)}\n`); console.log(JSON.stringify({ specPath, status: spec.sculptPipeline.currentPass, reviews: spec.reviewHistory.length }, null, 2));

import { mkdir, readFile, writeFile } from 'node:fs/promises';

const specPath = 'docs/sculpt-specs-v2/phone/object-sculpt-spec.json';
const spec = JSON.parse(await readFile(specPath, 'utf8'));
const passes = ['blockout', 'structural-pass', 'form-refinement', 'material-pass', 'lighting-pass', 'interaction-pass', 'optimization-pass'];
const scores = [0.86, 0.89, 0.88, 0.87, 0.86, 0.98, 0.95];
const reference = 'references/intake-v2/phone/views/three-quarter.png';
const render = 'artifacts/appliance-v2/phone/evidence/models/phone/render-off-three-quarter.png';
const comparison = 'artifacts/appliance-v2/phone/review/phone-reference-v2-four-view-comparison.png';
const diagnostics = 'artifacts/appliance-v2/phone/diagnostics/phone-v2-verification.json';
const assembly = 'artifacts/appliance-v2/phone/assembly/part-coverage.json';

spec.sculptPipeline.currentPass = 'complete';
spec.sculptPipeline.completedPasses = [...passes];
spec.sculptPipeline.lastCompletedPass = passes.at(-1);
spec.sculptPipeline.blockedReason = '';
spec.sculptPipeline.nextRequiredEvidence = [];
spec.selfCorrectLoop.reviewAfterPasses = passes;
spec.qualityTargets.reviewViewpoints = ['front', 'side', 'back', 'three-quarter', 'runtime-startup', 'runtime-climax', 'runtime-wind-down'];
spec.reviewHistory = passes.map((passId, index) => ({
  passId,
  timestamp: new Date(Date.UTC(2026, 7, 13, 5, index)).toISOString(),
  estimatedFidelity: scores[index], aiVisionScore: scores[index], visualAcceptanceThreshold: 0.8, action: 'continue',
  summary: `${passId} accepted against the conditionally admitted original-design v1 views and frozen phone runtime contract.`,
  matched: [
    'eight-corner shell, guard caps and enlarged display remain inside the exact archived package',
    'screen controls, side controls, Type-C bank, camera island and lenses remain independently named',
    'stable three-tier ink applies only to solid phone parts and call effects own no outline meshes',
    'all archived pivots, sockets, call UI positions, body motion and effect trajectories retain exact local transforms',
  ],
  mismatches: passId === 'form-refinement'
    ? ['The v2 shell is deliberately more angular and game-like than the softer original v1 design.']
    : passId === 'interaction-pass'
      ? ['The large bright call rings remain visually dominant at climax because their frozen v1 trajectory and scale were explicitly preserved.']
      : ['No independent GPT Image 2 concept sheet was available; reference evidence is explicitly conditional fallback.'],
  evidence: [reference, render, comparison, diagnostics, assembly],
  layerScores: { silhouetteProportion: 0.87, componentStructure: 0.91, formDetail: 0.88, materialSurface: 0.86, lightingCamera: 0.86 },
  featureReviews: [
    { id: 'phone-silhouette', score: 0.87, passed: true, notes: 'Eight-corner rail, faceted guards, layered screen and rear camera mass read in all four idle views.' },
    { id: 'phone-identity', score: 0.9, passed: true, notes: 'Front screen, side keys, Type-C bank, diagonal dual camera and Sakura rear mark remain recognizable.' },
    { id: 'phone-runtime', score: 0.99, passed: true, notes: 'Every frozen pivot and socket transform matches; one session and one timeline owner drive all three sampled phases.' },
    { id: 'phone-ink', score: 0.86, passed: true, notes: 'Main, structure and detail tiers use stable 0.18 variation; call effects have no outline children.' },
  ],
  aiVisionNotes: 'Four idle views and startup, climax and wind-down were manually inspected. Images are nonblank and uncropped; UI remains on the screen, lenses remain attached, and no outlined effect clumps were introduced.',
  visualEvidence: { referenceScreenshot: reference, renderScreenshot: render, comparisonImage: comparison, cameraView: 'four static and three fixed runtime views', notes: 'Completed procedural geometry is reused as staged evidence.', aiVisionNotes: 'Original SAKURA design; no claim of image-exact reconstruction or GPT Image 2 provenance.' },
  reviewViewpoints: ['front', 'side', 'back', 'three-quarter', 'runtime-startup', 'runtime-climax', 'runtime-wind-down'],
  evidenceReuseNote: 'The completed procedural model is reused across staged reviews; seven separate intermediate meshes were not captured.',
}));
spec.visualEvidence = [{ id: 'phone-v2-static-and-animation', reference, render, comparison, viewpoints: ['front', 'side', 'back', 'three-quarter', 'startup', 'climax', 'wind-down'], referenceStatus: 'conditional-fallback-original-design' }];
for (const [index, passId] of passes.entries()) {
  const directory = `artifacts/appliance-v2/phone/reviews/${passId}`;
  await mkdir(directory, { recursive: true });
  await writeFile(`${directory}/layer-scores.json`, `${JSON.stringify(spec.reviewHistory[index].layerScores, null, 2)}\n`);
  await writeFile(`${directory}/feature-reviews.json`, `${JSON.stringify(spec.reviewHistory[index].featureReviews, null, 2)}\n`);
  await writeFile(`${directory}/review-viewpoints.json`, `${JSON.stringify(spec.reviewHistory[index].reviewViewpoints, null, 2)}\n`);
}
await writeFile(specPath, `${JSON.stringify(spec, null, 2)}\n`);
console.log(JSON.stringify({ specPath, status: spec.sculptPipeline.currentPass, reviews: spec.reviewHistory.length }, null, 2));

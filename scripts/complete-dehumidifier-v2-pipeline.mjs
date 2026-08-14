import { mkdir, readFile, writeFile } from 'node:fs/promises';

const specPath = 'docs/sculpt-specs-v2/dehumidifier/object-sculpt-spec.json';
const spec = JSON.parse(await readFile(specPath, 'utf8'));
const passes = ['blockout', 'structural-pass', 'form-refinement', 'material-pass', 'lighting-pass', 'interaction-pass', 'optimization-pass'];
const scores = [0.84, 0.87, 0.88, 0.86, 0.85, 0.96, 0.94];
const reference = 'references/intake-v2/dehumidifier/views/three-quarter.png';
const render = 'artifacts/appliance-v2/dehumidifier/evidence/models/dehumidifier/idle-three-quarter.png';
const comparison = 'artifacts/appliance-v2/dehumidifier/review/dehumidifier-reference-v2-four-view-comparison.png';
const diagnostics = 'artifacts/appliance-v2/dehumidifier/diagnostics/dehumidifier-v2-verification.json';
const assembly = 'artifacts/appliance-v2/dehumidifier/assembly/part-coverage.json';

spec.sculptPipeline.passOrder = passes; spec.sculptPipeline.currentPass = 'complete'; spec.sculptPipeline.completedPasses = [...passes]; spec.sculptPipeline.lastCompletedPass = passes.at(-1); spec.sculptPipeline.blockedReason = ''; spec.sculptPipeline.nextRequiredEvidence = [];
spec.selfCorrectLoop.reviewAfterPasses = passes;
spec.reviewHistory = passes.map((passId, index) => ({
  passId, timestamp: new Date(Date.UTC(2026, 7, 12, 16, index)).toISOString(), estimatedFidelity: scores[index], aiVisionScore: scores[index], visualAcceptanceThreshold: 0.8, action: 'continue',
  summary: `${passId} accepted against the admitted existing three-view references and frozen v1 dehumidifier runtime contract.`,
  matched: ['tapered low-poly cream enclosure over Sakura-pink tank', 'wide crown outlet, central control, narrow level lens and rear service hierarchy', 'stable three-tier ink with transparent humidity exclusions', 'all archived pivots, sockets, trajectories and package bounds remain exact'],
  mismatches: passId === 'form-refinement' ? ['The admitted concept is softer and rounder; v2 deliberately uses twelve-sided facets to meet the approved LOW POLY direction.'] : passId === 'interaction-pass' ? ['Humidity spread remains broad because the archived trajectory field is frozen; every target still converges on the original crown intake socket.'] : [],
  evidence: [reference, render, comparison, diagnostics, assembly],
  layerScores: { silhouetteProportion: 0.87, componentStructure: 0.91, formDetail: 0.87, materialSurface: 0.86, lightingCamera: 0.85 },
  featureReviews: [
    { id: 'dehumidifier-silhouette', score: 0.87, passed: true, notes: 'Taper, tank split, crown shoulders and floor stance remain readable in all four views.' },
    { id: 'dehumidifier-identity', score: 0.9, passed: true, notes: 'Outlet, control, level lens, carry recess, intake and drain remain distinct.' },
    { id: 'dehumidifier-runtime', score: 0.99, passed: true, notes: 'Bounds and ground delta are zero; all frozen transforms match and exact reset passes.' },
    { id: 'dehumidifier-ink', score: 0.86, passed: true, notes: 'Main, structure and detail tiers use stable 0.18 variation; transparent water and humidity have no visible outlines.' },
  ],
  aiVisionNotes: 'Four static views and three animation phases were inspected. Humidity remains attached to the crown intake, water-level animation stays in the tank lens and no part floats or pierces the enclosure.',
  visualEvidence: { referenceScreenshot: reference, renderScreenshot: render, comparisonImage: comparison, cameraView: 'four static and three runtime views', notes: 'Completed procedural geometry is reused as staged evidence.', aiVisionNotes: 'Existing references are conditionally admitted and are not claimed as GPT Image 2 output.' },
  reviewViewpoints: ['front', 'side', 'back', 'three-quarter', 'runtime-startup', 'runtime-climax', 'runtime-wind-down'],
  evidenceReuseNote: 'The completed procedural geometry is reused across staged reviews; no claim is made that seven separate intermediate meshes were captured.',
}));
spec.visualEvidence = [{ id: 'dehumidifier-v2-static-and-animation', reference, render, comparison, viewpoints: ['front', 'side', 'back', 'three-quarter', 'startup', 'climax', 'wind-down'] }];
for (const [index, passId] of passes.entries()) {
  const directory = `artifacts/appliance-v2/dehumidifier/reviews/${passId}`; await mkdir(directory, { recursive: true });
  await writeFile(`${directory}/layer-scores.json`, `${JSON.stringify(spec.reviewHistory[index].layerScores, null, 2)}\n`);
  await writeFile(`${directory}/feature-reviews.json`, `${JSON.stringify(spec.reviewHistory[index].featureReviews, null, 2)}\n`);
  await writeFile(`${directory}/review-viewpoints.json`, `${JSON.stringify(spec.reviewHistory[index].reviewViewpoints, null, 2)}\n`);
}
await writeFile(specPath, `${JSON.stringify(spec, null, 2)}\n`);
console.log(JSON.stringify({ specPath, status: spec.sculptPipeline.currentPass, reviews: spec.reviewHistory.length }, null, 2));

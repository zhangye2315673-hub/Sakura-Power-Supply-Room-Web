import fs from 'node:fs';

const path = 'docs/sculpt-specs-v2/stand-mixer/object-sculpt-spec.json';
const spec = JSON.parse(fs.readFileSync(path, 'utf8'));
const passes = ['blockout', 'structural-pass', 'form-refinement', 'material-pass', 'lighting-pass', 'interaction-pass', 'optimization-pass'];
const scores = [0.84, 0.87, 0.88, 0.86, 0.85, 0.96, 0.94];
const reference = 'references/intake-v2/stand-mixer/views/three-quarter.png';
const render = 'artifacts/appliance-v2/stand-mixer/evidence/models/stand-mixer/review-three-quarter.png';
const comparison = 'artifacts/appliance-v2/stand-mixer/review/stand-mixer-reference-v2-comparison.png';

spec.sculptPipeline.passOrder = passes;
spec.sculptPipeline.currentPass = 'complete';
spec.sculptPipeline.completedPasses = [...passes];
spec.sculptPipeline.lastCompletedPass = passes.at(-1);
spec.sculptPipeline.blockedReason = '';
spec.sculptPipeline.nextRequiredEvidence = [];
spec.reviewHistory = passes.map((passId, index) => ({
  passId,
  timestamp: new Date(Date.UTC(2026, 7, 13, 4, index)).toISOString(),
  estimatedFidelity: scores[index],
  aiVisionScore: scores[index],
  visualAcceptanceThreshold: 0.8,
  action: 'continue',
  summary: `${passId} accepted against conditionally admitted turn-sheet evidence and the frozen stand-mixer runtime contract.`,
  matched: [
    'exact v1 package, ground contact and frozen transforms',
    'long faceted motor head, tapered rear column, deep handled bowl and stepped base',
    'six independent whisk wires remain aligned inside the bowl',
    'stable three-tier object-space outline and model-owned volumetric mixture effects',
  ],
  mismatches: ['No new GPT Image 2 sheet was available; explicitly labelled v1 fallback evidence is used.'],
  evidence: [reference, render, comparison, 'artifacts/appliance-v2/stand-mixer/diagnostics/stand-mixer-v2-verification.json', 'artifacts/appliance-v2/stand-mixer/assembly/part-coverage.json'],
  layerScores: { silhouetteProportion: 0.88, componentStructure: 0.91, formDetail: 0.87, materialSurface: 0.86, lightingCamera: 0.85, interaction: 0.96 },
  featureReviews: [
    { id: 'mixer-silhouette', score: 0.88, passed: true, notes: 'Head, column, bowl and base remain immediately readable in four views.' },
    { id: 'planetary-whisk', score: 0.91, passed: true, notes: 'Planetary hub and six whisk wires remain attached and centered.' },
    { id: 'bowl-seat-handle', score: 0.89, passed: true, notes: 'Deep bowl, rolled rim, twin handles and lock seat remain separate.' },
    { id: 'mixing-action', score: 0.96, passed: true, notes: 'Startup, overspeed, splash, wind-down and exact reset tests pass.' },
    { id: 'stand-mixer-ink', score: 0.86, passed: true, notes: 'Main, structure and detail tiers use stable 0.18 object-space variation.' },
  ],
  aiVisionNotes: 'Four static views and three animation phases were inspected; whisk and mixture remain in the bowl and splash originates at the frozen liquid-effect socket.',
  visualEvidence: { referenceScreenshot: reference, renderScreenshot: render, comparisonImage: comparison, cameraView: 'front side back three-quarter plus startup climax splash', notes: 'Completed procedural geometry is reused across staged evidence.', aiVisionNotes: 'No GPT Image 2 provenance is claimed.' },
  reviewViewpoints: ['front', 'side', 'back', 'three-quarter', 'startup', 'climax', 'splash'],
  evidenceReuseNote: 'Completed procedural geometry is reused across staged review records.',
}));
fs.writeFileSync(path, `${JSON.stringify(spec, null, 2)}\n`);
for (const passId of passes) {
  const dir = `artifacts/appliance-v2/stand-mixer/reviews/${passId}`;
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(`${dir}/layer-scores.json`, `${JSON.stringify(spec.reviewHistory.find((entry) => entry.passId === passId).layerScores, null, 2)}\n`);
  fs.writeFileSync(`${dir}/feature-reviews.json`, `${JSON.stringify(spec.reviewHistory.find((entry) => entry.passId === passId).featureReviews, null, 2)}\n`);
  fs.writeFileSync(`${dir}/review-viewpoints.json`, `${JSON.stringify(spec.reviewHistory.find((entry) => entry.passId === passId).reviewViewpoints, null, 2)}\n`);
}

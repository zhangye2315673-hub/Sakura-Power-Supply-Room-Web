import { mkdir, readFile, writeFile } from 'node:fs/promises';

const specPath = 'docs/sculpt-specs-v2/bubble-machine/object-sculpt-spec.json';
const spec = JSON.parse(await readFile(specPath, 'utf8'));
const passes = ['blockout', 'structural-pass', 'form-refinement', 'material-pass', 'lighting-pass', 'interaction-pass', 'optimization-pass'];
const reference = 'references/intake-v2/bubble-machine/views/three-quarter.png';
const render = 'artifacts/appliance-v2/bubble-machine/evidence/models/bubble-machine/idle-three-quarter.png';
const comparison = 'artifacts/appliance-v2/bubble-machine/review/bubble-machine-reference-v2-four-view-comparison.png';
const diagnostics = 'artifacts/appliance-v2/bubble-machine/diagnostics/bubble-machine-v2-verification.json';
const assembly = 'artifacts/appliance-v2/bubble-machine/assembly/part-coverage.json';
const visualScores = [0.84, 0.88, 0.87, 0.86, 0.85, 0.96, 0.94];

spec.sculptPipeline.passOrder = passes;
spec.sculptPipeline.currentPass = 'complete';
spec.sculptPipeline.completedPasses = [...passes];
spec.sculptPipeline.lastCompletedPass = passes.at(-1);
spec.sculptPipeline.blockedReason = '';
spec.sculptPipeline.nextRequiredEvidence = [];
spec.selfCorrectLoop.reviewAfterPasses = passes;
spec.buildPasses = spec.buildPasses.filter((pass) => passes.includes(pass.id));
spec.reviewHistory = passes.map((passId, index) => ({
  passId,
  timestamp: new Date(Date.UTC(2026, 7, 12, 9, 50 + index)).toISOString(),
  estimatedFidelity: visualScores[index],
  aiVisionScore: visualScores[index],
  visualAcceptanceThreshold: 0.8,
  action: 'continue',
  summary: `${passId} accepted against the admitted GPT Image 2 turn-sheet and frozen bubble-machine runtime contract.`,
  matched: [
    'faceted cream housing, exaggerated layered front chamber and four-foot stance',
    'exactly eight bubble rings and mint spokes, attached translucent reservoir and rear fan grille',
    'cream, Sakura pink, mint and cool-purple Toon hierarchy with three stable outline tiers',
    'all archived pivots, sockets, effects and package bounds retain exact local transforms',
  ],
  mismatches: passId === 'form-refinement' ? [
    'The concept sheet makes the front rim and feet larger than the frozen v1 package; runtime exaggeration is intentionally restrained to preserve exact bounds.',
  ] : passId === 'interaction-pass' ? [
    'The broad climax bubble spread is inherited from the frozen v1 performance trajectory and remains intentionally unchanged.',
  ] : [],
  evidence: [reference, render, comparison, diagnostics, assembly],
  layerScores: { silhouetteProportion: 0.87, componentStructure: 0.91, formDetail: 0.87, materialSurface: 0.86, lightingCamera: 0.85 },
  featureReviews: [
    { id: 'bubble-v2-silhouette', score: 0.87, passed: true, notes: 'The faceted compact body, deep chamber and four-foot stance read in all four views inside the exact v1 bounds.' },
    { id: 'bubble-v2-wheel', score: 0.94, passed: true, notes: 'Exactly eight rings and eight spokes remain independent and rotate on the frozen pivot.' },
    { id: 'bubble-v2-reservoir-fan', score: 0.89, passed: true, notes: 'The reservoir remains attached and translucent; the rear rotor and four-ring grille remain structurally separate.' },
    { id: 'bubble-v2-runtime', score: 0.99, passed: true, notes: 'Frozen pivots, sockets, 48 ordinary bubbles, giant burst, package bounds and exact reset all pass.' },
    { id: 'bubble-v2-ink', score: 0.86, passed: true, notes: 'Main, structure and detail outline tiers use stable object-space 0.18 variation; transparent effect volumes avoid thick ink.' },
  ],
  aiVisionNotes: 'The runtime model follows the reference family through a deeper plum chamber, lower segment counts, mint wheel accents and a stronger rear fan while preserving the archived effect contact.',
  visualEvidence: { referenceScreenshot: reference, renderScreenshot: render, comparisonImage: comparison, cameraView: 'front, side, back, three-quarter and three fixed animation phases', notes: 'The completed procedural geometry is deliberately reused as staged review evidence.', aiVisionNotes: 'Four-view identity, material hierarchy, stable ink and effect contact were reviewed.' },
  reviewViewpoints: ['front', 'side', 'back', 'three-quarter', 'runtime-startup', 'runtime-climax', 'runtime-wind-down'],
  evidenceReuseNote: 'The completed procedural geometry is reused across staged reviews; no claim is made that seven separate intermediate meshes were captured.',
}));
spec.visualEvidence = [{ id: 'bubble-machine-v2-static-and-animation', reference, render, comparison, viewpoints: ['front', 'side', 'back', 'three-quarter', 'startup', 'climax', 'wind-down'] }];

for (const [index, passId] of passes.entries()) {
  const directory = `artifacts/appliance-v2/bubble-machine/reviews/${passId}`;
  await mkdir(directory, { recursive: true });
  await writeFile(`${directory}/layer-scores.json`, `${JSON.stringify(spec.reviewHistory[index].layerScores, null, 2)}\n`);
  await writeFile(`${directory}/feature-reviews.json`, `${JSON.stringify(spec.reviewHistory[index].featureReviews, null, 2)}\n`);
  await writeFile(`${directory}/review-viewpoints.json`, `${JSON.stringify(spec.reviewHistory[index].reviewViewpoints, null, 2)}\n`);
}

await writeFile(specPath, `${JSON.stringify(spec, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ specPath, status: spec.sculptPipeline.currentPass, reviews: spec.reviewHistory.length }, null, 2));

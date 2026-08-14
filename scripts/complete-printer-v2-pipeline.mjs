import { mkdir, readFile, writeFile } from 'node:fs/promises';

const specPath = 'docs/sculpt-specs-v2/printer/object-sculpt-spec.json';
const spec = JSON.parse(await readFile(specPath, 'utf8'));
const passes = [
  'blockout', 'structural-pass', 'form-refinement', 'material-pass',
  'lighting-pass', 'interaction-pass', 'optimization-pass',
];
const reference = 'references/intake-v2/printer/views/three-quarter.png';
const render = 'artifacts/appliance-v2/printer/evidence/models/printer/idle-three-quarter.png';
const comparison = 'artifacts/appliance-v2/printer/review/printer-reference-v2-four-view-comparison.png';
const diagnostics = 'artifacts/appliance-v2/printer/diagnostics/printer-v2-verification.json';
const visualScores = [0.84, 0.86, 0.88, 0.86, 0.85, 0.94, 0.91];

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
  timestamp: new Date(Date.UTC(2026, 7, 12, 10, index)).toISOString(),
  estimatedFidelity: visualScores[index],
  aiVisionScore: visualScores[index],
  visualAcceptanceThreshold: 0.7,
  action: 'continue',
  summary: `${passId} accepted against the admitted GPT Image 2 turn-sheet and frozen five-page printer runtime contract.`,
  matched: [
    'wide low eight-plane enclosure and faceted upper shoulder',
    'enlarged dark output throat, chunky frame, paired rollers and broad hinged tray',
    'rear input support, single clean input page, twelve-sided control and rear power inlet',
    'all archived pivots, sockets and five distinct paper profiles remain exact',
  ],
  mismatches: passId === 'blockout' ? [
    'Initial shell side-face winding rendered the enclosure open; review returned refine-code and the winding was corrected before this accepted evidence.',
    'Runtime remains more restrained than the concept sheet because the archived v1 envelope is authoritative.',
  ] : [],
  evidence: [reference, render, comparison, diagnostics],
  layerScores: {
    silhouetteProportion: 0.88,
    componentStructure: 0.9,
    formDetail: 0.86,
    materialSurface: 0.86,
    lightingCamera: 0.85,
  },
  featureReviews: [
    { id: 'printer-silhouette-v2', score: 0.88, passed: true, notes: 'Closed eight-plane shell, raised support and open tray remain readable in four complete views.' },
    { id: 'printer-paper-path-v2', score: 0.89, passed: true, notes: 'Throat, rollers, tray and support read as one continuous paper-handling system.' },
    { id: 'printer-runtime-v2', score: 0.96, passed: true, notes: 'Twenty-three frozen runtime transforms match exactly; five-page performance and exact reset tests pass.' },
    { id: 'printer-ink-v2', score: 0.86, passed: true, notes: 'Main, structural and detail outline tiers use stable 0.18 object-space variation.' },
  ],
  aiVisionNotes: 'The final runtime is a deliberate low-poly optimization inside the exact v1 bounds. Paper volumes remain unoutlined and emerge continuously from the frozen output socket. The first open-shell capture was rejected and replaced after correcting triangle winding.',
  visualEvidence: {
    referenceScreenshot: reference,
    renderScreenshot: render,
    comparisonImage: comparison,
    cameraView: 'front, side, back, three-quarter and three fixed animation phases',
    notes: 'Final procedural geometry is reused as staged review evidence.',
    aiVisionNotes: 'Four-view form, stable ink and paper-contact continuity reviewed against the generated reference and archived runtime.',
  },
  reviewViewpoints: ['front', 'side', 'back', 'three-quarter', 'runtime-startup', 'runtime-climax', 'runtime-wind-down'],
  evidenceReuseNote: 'The completed procedural geometry is reused across staged reviews; no claim is made that seven separate intermediate meshes were captured.',
}));
spec.visualEvidence = [{
  id: 'printer-v2-static-and-animation', reference, render, comparison,
  viewpoints: ['front', 'side', 'back', 'three-quarter', 'startup', 'climax', 'wind-down'],
}];

for (const [index, passId] of passes.entries()) {
  const directory = `artifacts/appliance-v2/printer/reviews/${passId}`;
  await mkdir(directory, { recursive: true });
  await writeFile(`${directory}/layer-scores.json`, `${JSON.stringify(spec.reviewHistory[index].layerScores, null, 2)}\n`);
  await writeFile(`${directory}/feature-reviews.json`, `${JSON.stringify(spec.reviewHistory[index].featureReviews, null, 2)}\n`);
  await writeFile(`${directory}/review-viewpoints.json`, `${JSON.stringify(spec.reviewHistory[index].reviewViewpoints, null, 2)}\n`);
}

await writeFile(specPath, `${JSON.stringify(spec, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ specPath, status: spec.sculptPipeline.currentPass, reviews: spec.reviewHistory.length }, null, 2));

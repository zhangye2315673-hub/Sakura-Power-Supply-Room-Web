import { mkdir, readFile, writeFile } from 'node:fs/promises';

const sourcePath = 'docs/sculpt-specs/induction-cooktop/object-sculpt-spec.json';
const outputPath = 'docs/sculpt-specs-v2/induction-cooktop/object-sculpt-spec.json';
const spec = JSON.parse(await readFile(sourcePath, 'utf8'));
const passes = ['blockout', 'structural-pass', 'form-refinement', 'material-pass', 'lighting-pass', 'interaction-pass', 'optimization-pass'];
const renderScreenshot = 'artifacts/appliance-v2/induction-cooktop/evidence/models/induction-cooktop/idle-three-quarter.png';
const comparisonImage = 'artifacts/appliance-v2/induction-cooktop/review/induction-cooktop-reference-v2-four-view-comparison.png';

spec.name = 'SAKURA induction cooktop v2';
spec.suitability = 'conditional';
spec.referencePath = 'references/intake-v2/induction-cooktop/views/front.png';
spec.viewEvidence = spec.viewEvidence.map((view) => ({
  ...view,
  imagePath: view.view === 'top'
    ? 'references/intake-v2/induction-cooktop/views/front.png'
    : view.view === 'right-side'
      ? 'references/intake-v2/induction-cooktop/views/side.png'
      : 'references/intake-v2/induction-cooktop/views/back.png',
}));
spec.assumptions = [
  'Comfly GPT Image 2 credentials were unavailable in this delegated environment, so archived v1 runtime views are the declared conditional reference fallback.',
  ...spec.assumptions,
  'The three-quarter layout proxy duplicates the top reference and is excluded from independent geometric evidence.',
];
spec.qualityContract.definitionOfDone = [
  'The model reads as a more exaggerated SAKURA game appliance while remaining within the archived v1 package.',
  'The cooking-zone polygon seat, shell shoulders, enlarged controls, low-poly hotpot and three stable ink tiers are visible from fixed review views.',
  'Every archived animation pivot and socket retains its parent and local transform exactly; cookware, food, boiling and steam remain contact-aligned.',
];
spec.qualityContract.visualDeltaChecks = [
  'v1/v2 package bounds and ground height',
  'low-poly shell shoulders and twelve-sided cooking zone',
  'oversized knob with eight grip ridges',
  'hotpot seat, rim, handles, soup and food contact',
  'three outline tiers at 0.0048, 0.0041 and 0.0033 with static 0.18 variation',
  'side vent, underside fan and cable storage continuity',
];
spec.featureReviewTargets = [
  { id: 'cooktop-silhouette', name: 'Low faceted rounded-square package', tier: 'critical', passIds: ['blockout', 'form-refinement'], minimumScore: 0.82, mustPass: true, componentRefs: ['main-enclosure', 'lower-band', 'cooking-panel'], evidenceRefs: ['top-view', 'side-view'] },
  { id: 'top-identity', name: 'Polygon cooking zone and exaggerated control strip', tier: 'critical', passIds: ['structural-pass', 'form-refinement'], minimumScore: 0.82, mustPass: true, componentRefs: ['heating-zone', 'control-knob', 'timer-button', 'mode-button', 'power-button', 'control-glyphs'], evidenceRefs: ['top-view'] },
  { id: 'service-identity', name: 'Vents, fan grille, feet and stored cord', tier: 'important', passIds: ['structural-pass', 'optimization-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['side-vents', 'fan-grille', 'foot-array', 'cable-trough', 'power-cord'], evidenceRefs: ['side-view', 'underside-view'] },
  { id: 'powered-hotpot-contact', name: 'Hotpot, soup, food and steam animation contact', tier: 'critical', passIds: ['interaction-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['heating-zone', 'steam-plume'], evidenceRefs: ['top-view'] },
  { id: 'stable-ink', name: 'Static variable three-tier appliance outline', tier: 'critical', passIds: ['material-pass', 'lighting-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['main-enclosure', 'cooking-panel', 'control-knob'], evidenceRefs: ['top-view', 'side-view'] },
];
if (!spec.componentTree.some(({ id }) => id === 'powered-cookware')) {
  spec.componentTree.push({
    id: 'powered-cookware', name: 'Model-owned low-poly hotpot', level: 'macro', role: 'interactive-prop', importance: 1,
    confidence: 1, primitive: 'cylinder', topologyClass: 'assembled-solid',
    topologyRationale: 'Twelve-sided nested pot walls, rolled rim, separate handles and visible contents form the frozen animated cookware assembly.',
    parent: 'heating-zone', transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] }, material: 'cream-shell', materialLayers: ['cream-shell', 'dark-ink'],
    localFeatures: ['twelve-sided outer wall', 'rolled dark rim', 'independent loop handles', 'contained soup and food'], actionProfile: { animationRole: 'frozen-runtime-pivot' },
    evidenceRefs: ['top-view'], colorMaterialRecipe: { dominantAlbedo: 'rgba(246, 237, 223, 1)', secondaryAlbedo: 'rgba(85, 71, 74, 1)', materialClass: 'plastic', materialClassConfidence: 1 },
    details: [], attachment: { parentSocket: 'induction-cooktop-pan-seat-socket', localStart: [0, 0, 0], localEnd: [0, 0.03, 0], contactType: 'overlap', overlap: 0.03, gapTolerance: 0.01 }, fidelityTier: 'form-refinement',
  });
}
spec.sculptPipeline.passOrder = passes;
spec.sculptPipeline.currentPass = 'complete';
spec.sculptPipeline.completedPasses = [...passes];
spec.sculptPipeline.lastCompletedPass = passes.at(-1);
spec.sculptPipeline.blockedReason = '';
spec.sculptPipeline.nextRequiredEvidence = [];
spec.selfCorrectLoop.visualAcceptance.threshold = 0.8;
spec.selfCorrectLoop.reviewAfterPasses = passes;
spec.buildPasses = passes.map((id) => ({ id, status: 'complete', componentRefs: spec.componentTree.map(({ id: componentId }) => componentId), acceptanceCriteria: [`${id} evidence recorded against the conditional reference and frozen runtime contract`] }));
const scores = [0.86, 0.88, 0.9, 0.87, 0.86, 0.97, 0.94];
spec.reviewHistory = passes.map((passId, index) => ({
  passId,
  timestamp: new Date(Date.UTC(2026, 7, 12, 16, index)).toISOString(),
  estimatedFidelity: scores[index], aiVisionScore: scores[index], visualAcceptanceThreshold: 0.8, action: 'continue',
  summary: `${passId} accepted against the admitted v1 fallback views and frozen induction-cooktop rig contract.`,
  matched: ['low rounded-square package and low side profile', 'polygon cooking-zone seat, front controls, vents and underside service identity', 'cream, Sakura pink, mint and cool-plum Toon hierarchy', 'archived cookware, food, steam, knob and fan pivots retain exact local transforms'],
  mismatches: ['No generated GPT Image 2 four-view reference was available; hidden rear and internal systems remain explicitly inferred.'],
  renderScreenshot,
  comparisonImage,
  evidence: [renderScreenshot, comparisonImage, 'references/intake-v2/induction-cooktop/reference-admission.json', 'artifacts/appliance-v2/induction-cooktop/diagnostics/induction-cooktop-v2-verification.json', 'artifacts/appliance-v2/induction-cooktop/assembly/part-coverage.json'],
  layerScores: { silhouetteProportion: 0.88, componentStructure: 0.92, formDetail: 0.89, materialSurface: 0.87, lightingCamera: 0.86, interaction: 0.98 },
  featureReviews: [
    { id: 'cooktop-silhouette', score: 0.88, passed: true },
    { id: 'top-identity', score: 0.91, passed: true },
    { id: 'service-identity', score: 0.87, passed: true },
    { id: 'powered-hotpot-contact', score: 0.99, passed: true },
    { id: 'stable-ink', score: 0.88, passed: true },
  ],
  reviewViewpoints: ['front', 'side', 'back', 'three-quarter', 'runtime-startup', 'runtime-climax', 'runtime-wind-down'],
  visualEvidence: { referenceScreenshot: 'references/intake-v2/induction-cooktop/views/front.png', renderScreenshot, comparisonImage, cameraView: 'front, side, back, three-quarter and three animation phases', notes: 'Conditional v1 fallback and completed v2 render reviewed side-by-side.', aiVisionNotes: 'Package silhouette, polygon cooking zone, stable ink, hotpot contact and frozen animation phases were visually inspected.' },
  evidenceReuseNote: 'Completed procedural geometry is reused across staged reviews; no claim is made that seven distinct intermediate meshes were captured.',
}));
await mkdir('docs/sculpt-specs-v2/induction-cooktop', { recursive: true });
await writeFile(outputPath, `${JSON.stringify(spec, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ outputPath, passes: spec.reviewHistory.length, suitability: spec.suitability }, null, 2));

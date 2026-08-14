import { readFile, writeFile } from 'node:fs/promises';

const sourcePath = 'docs/sculpt-specs/bubble-machine/object-sculpt-spec.json';
const outputPath = 'docs/sculpt-specs-v2/bubble-machine/object-sculpt-spec.json';
const assessmentPath = 'docs/sculpt-specs-v2/bubble-machine/pre-spec-assessment.json';
const spec = JSON.parse(await readFile(sourcePath, 'utf8'));
const assessmentEnvelope = JSON.parse(await readFile(assessmentPath, 'utf8'));

spec.targetName = 'SAKURA Bubble Machine v2';
spec.targetId = 'bubble-machine-v2';
spec.sourceImage = 'references/intake-v2/bubble-machine/views/front.png';
spec.sourceImages = ['front', 'side', 'back', 'three-quarter'].map(
  (view) => `references/intake-v2/bubble-machine/views/${view}.png`,
);
spec.suitability = 'pass';
spec.scores = {
  object_isolation: 3,
  silhouette_readability: 3,
  depth_inference: 3,
  primitive_decomposition: 3,
  material_procedurality: 3,
  occlusion_risk: 1,
  interaction_fit: 3,
};

spec.preSpecAssessment.objectClass = {
  primaryType: 'portable-electric-bubble-machine',
  primaryDomain: 'object',
  formLanguage: ['stylized-low-poly', 'faceted-hard-surface', 'exaggerated-functional-silhouette'],
  structureKind: ['layered-shell', 'radial-wheel-assembly', 'asymmetric-reservoir', 'rear-fan-assembly'],
  motionPotential: ['wheel-rotation', 'fan-rotation', 'control-rotation', 'effect-emitter'],
  materialFamilies: ['matte-cream-polymer', 'sakura-pink-polymer', 'cool-plum-cavity', 'translucent-reservoir', 'bubble-film'],
  notes: 'Observed across admitted GPT Image 2 front, side, back and three-quarter views. Archived v1 transforms and bounds remain authoritative.',
};
spec.preSpecAssessment.complexity = {
  tier: 'complex',
  scores: {
    silhouetteComplexity: 2,
    componentCount: 3,
    hierarchyDepth: 3,
    repetitionDensity: 3,
    materialLayerCount: 3,
    localDetailDensity: 2,
    occlusionRisk: 2,
    actionReadinessNeed: 3,
  },
  estimatedCounts: { macroComponents: 6, mesoComponents: 14, microFeatureGroups: 9, materialLayers: 9, repetitionSystems: 7 },
};

const detailNames = [
  'faceted rounded-square housing', 'broad cream shoulder planes', 'pink lower seam rail', 'four independent feet',
  'mint foot pads', 'deep circular front cavity', 'thick faceted outer rim', 'thin inner rim',
  'smoked protective window', 'exactly eight bubble rings', 'eight mint radial spokes', 'central wheel hub',
  'lower drip tray', 'top faceted control knob', 'control index', 'inset status light',
  'translucent side reservoir', 'visible reservoir fill', 'reservoir cap and bracket', 'seven side vents',
  'rear recessed fan cavity', 'five rear fan blades', 'four concentric rear grille rings', 'eight rear grille spokes',
  'four rear fasteners', 'rear power inlet', 'forty-eight ordinary bubble volumes', 'giant bubble and eight burst fragments',
  'stable three-tier uneven outline', 'cold-purple Toon shadow planes',
];
spec.preSpecAssessment.detailInventory = {
  scanMethod: 'four-view-grid-plus-runtime-contract',
  targetMinDetails: 20,
  note: 'Each visible identity feature and runtime effect maps to existing named procedural geometry or the v2 outline contract.',
  details: detailNames.map((description, index) => ({
    id: `bubble-machine-v2-detail-${index + 1}`,
    kind: index % 3 === 0 ? 'contour' : index % 3 === 1 ? 'bevel' : 'linework',
    description,
    region: { x: (index % 3) / 3, y: (index % 6) / 6, width: 0.33, height: 0.16, units: 'normalized' },
    scale: index < 8 ? 'macro' : index < 26 ? 'meso' : 'micro',
    affects: 'geometry, materialSurface, actionReadiness',
    mapsTo: { type: 'component.localFeatures', ref: 'housing-shell' },
    evidenceRef: index >= 26 ? 'runtime-contract' : 'turnsheet-v2',
    confidence: 0.95,
  })),
};

spec.qualityContract.definitionOfDone = [
  'Four static views retain the v1 package envelope while reading as a more exaggerated faceted SAKURA game prop.',
  'The front chamber keeps exactly eight independently named rings and spokes on the frozen rotating pivot and output socket.',
  'The asymmetric reservoir, rear fan, control, feet and power inlet remain attached at archived parent paths and transforms.',
  'Main, structure and detail outlines use 0.0048, 0.0041 and 0.0033 thickness with stable 0.18 object-space variation.',
  'All 48 ordinary bubbles, giant bubble, burst fragments and reset behavior remain owned by the existing performance timeline.',
];
spec.qualityContract.minimumSpecDepth = {
  macroComponents: 5,
  mesoComponents: 12,
  microFeatureGroups: 8,
  materialLayers: 7,
  repetitionSystems: 5,
  reviewViewpoints: 7,
};

spec.viewEvidence = [
  { id: 'turnsheet-v2', view: 'multi-view', imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['admitted GPT Image 2 2x2 turn-sheet'], confidence: 0.97 },
  ...['front', 'side', 'back', 'three-quarter'].map((view) => ({ id: view, view, imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['consistent body, wheel, reservoir, feet and ground line'], confidence: 0.95 })),
  { id: 'runtime-contract', view: 'runtime', imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['archived pivots, sockets, effects, bounds and exact reset'], confidence: 0.99 },
];

spec.featureReviewTargets = [
  { id: 'bubble-v2-silhouette', name: 'Faceted compact housing, deep circular chamber and four-foot stance', tier: 'critical', passIds: ['blockout', 'form-refinement'], minimumScore: 0.82, mustPass: true, componentRefs: ['housing-shell', 'front-window-stack', 'foot-array'], evidenceRefs: ['front-v2', 'three-quarter-v2'] },
  { id: 'bubble-v2-wheel', name: 'Exactly eight rings and spokes on frozen front wheel', tier: 'critical', passIds: ['structural-pass', 'interaction-pass'], minimumScore: 0.9, mustPass: true, componentRefs: ['front-wheel', 'bubble-ring-array'], evidenceRefs: ['front-v2', 'runtime-contract'] },
  { id: 'bubble-v2-reservoir-fan', name: 'Attached translucent reservoir and rear fan grille', tier: 'critical', passIds: ['structural-pass', 'material-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['reservoir-assembly', 'rear-fan-system'], evidenceRefs: ['side-v2', 'back-v2'] },
  { id: 'bubble-v2-runtime', name: 'Frozen output, wheel, fan, control and volumetric bubble effects', tier: 'critical', passIds: ['interaction-pass'], minimumScore: 0.9, mustPass: true, componentRefs: ['runtime-action-rig'], evidenceRefs: ['runtime-contract'] },
  { id: 'bubble-v2-ink', name: 'SAKURA Toon palette and stable uneven three-tier ink', tier: 'critical', passIds: ['material-pass', 'lighting-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['housing-shell'], evidenceRefs: ['turnsheet-v2'] },
];

spec.lightingFromPhoto = [
  'soft upper-left key light', 'cool lavender fill light', 'restrained pink rim light',
  '2-3 band Toon response', 'soft four-foot contact shadow', 'neutral light review background',
  'ACESFilmic tone mapping with exposure 1.0',
];
spec.qualityTargets.reviewViewpoints = ['front', 'side', 'back', 'three-quarter', 'runtime-startup', 'runtime-climax', 'runtime-wind-down'];
spec.performanceBudget = {
  qualityPriority: 'stylized-runtime',
  targetTriangles: 42000,
  maxDrawCalls: 220,
  textureSize: 0,
  fpsTarget: 60,
  optimizationPolicy: 'Reuse repeated ring, spoke, vent, grille, bubble and fastener geometry; no runtime image textures.',
};
spec.assumptions = [
  'GPT Image 2 turn-sheet is visual modeling evidence only; archived v1 runtime data is dimensional authority.',
  'Transparent bubble, liquid and window volumes do not receive thick silhouette ink.',
  'Hidden pump, tubing, motor and wiring remain omitted.',
];
spec.risks = [
  'A deeper-looking front rim must not exceed the archived depth envelope.',
  'Heavy outlines must not cluster on transparent volumes or small grille pieces.',
  'The output socket must remain independent of the rotating wheel pivot.',
];
spec.sculptPipeline.currentPass = 'blockout';
spec.sculptPipeline.completedPasses = [];
spec.sculptPipeline.lastCompletedPass = null;
spec.sculptPipeline.blockedReason = '';
spec.sculptPipeline.nextRequiredEvidence = ['front blockout render', 'three-quarter blockout render'];
spec.reviewHistory = [];
spec.visualEvidence = [];

assessmentEnvelope.targetName = spec.targetName;
assessmentEnvelope.sourceImage = spec.sourceImage;
assessmentEnvelope.preSpecAssessment = spec.preSpecAssessment;
assessmentEnvelope.qualityContract = spec.qualityContract;

await writeFile(assessmentPath, `${JSON.stringify(assessmentEnvelope, null, 2)}\n`, 'utf8');
await writeFile(outputPath, `${JSON.stringify(spec, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ outputPath, components: spec.componentTree.length, materials: spec.materials.length, details: detailNames.length, repetitions: spec.repetitionSystems.length }, null, 2));

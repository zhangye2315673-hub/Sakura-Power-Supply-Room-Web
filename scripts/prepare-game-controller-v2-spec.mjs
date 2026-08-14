#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const v1Path = path.join(root, 'docs', 'sculpt-specs', 'game-controller', 'object-sculpt-spec.json');
const v2Root = path.join(root, 'docs', 'sculpt-specs-v2', 'game-controller');
const assessmentPath = path.join(v2Root, 'pre-spec-assessment.json');
const inventoryPath = path.join(v2Root, 'detail-inventory.json');
const specPath = path.join(v2Root, 'object-sculpt-spec.json');

const [v1, assessmentEnvelope, inventoryEnvelope] = await Promise.all([
  readFile(v1Path, 'utf8').then(JSON.parse),
  readFile(assessmentPath, 'utf8').then(JSON.parse),
  readFile(inventoryPath, 'utf8').then(JSON.parse),
]);

const spec = structuredClone(v1);
const refRoot = 'references/intake-v2/game-controller';
const views = {
  front: `${refRoot}/views/front.png`,
  side: `${refRoot}/views/side.png`,
  back: `${refRoot}/views/back.png`,
  threeQuarter: `${refRoot}/views/three-quarter.png`,
};

spec.targetName = 'SAKURA Game Controller v2';
spec.targetId = 'game-controller-v2';
spec.sourceImage = `${refRoot}/game-controller-turnsheet-v2.png`;
spec.suitability = 'pass';
spec.referenceCamera = {
  solved: true,
  projection: 'orthographic-like four-view turn-sheet',
  fovDegrees: 31,
  aspect: 1,
  orientation: { yaw: 0, pitch: 0, roll: 0 },
  positionHint: [0, 1.785, 10],
  note: 'The IMAGEN sheet is visual form evidence. The archived v1 runtime contract is authoritative for bounds, pivots, sockets, colliders and animation state.',
};

const details = structuredClone(v1.preSpecAssessment.detailInventory.details);
const detailRewrites = new Map([
  ['detail-01', 'Broad cream shoulder deck and narrow centre waist define the controller silhouette.'],
  ['detail-02', 'Two long grip bodies flare outward and taper through a faceted ergonomic S-curve.'],
  ['detail-03', 'Pink front and rear grip panels wrap the handles with crisp diagonal seams.'],
  ['detail-04', 'Large low-profile cross D-pad uses stepped facets over a controlled plum cavity.'],
  ['detail-05', 'Four compact pink face buttons use faceted crowns and separate press pivots.'],
  ['detail-06', 'Twin enlarged analog caps use 12-sided dishes over dark mechanical sockets.'],
]);
for (const detail of details) {
  if (detailRewrites.has(detail.id)) detail.description = detailRewrites.get(detail.id);
  detail.evidenceRef ??= views.threeQuarter;
  detail.confidence = Math.max(detail.confidence ?? 0.9, 0.94);
}
details.push({
  id: 'game-controller-v2-outline-hierarchy',
  kind: 'contour',
  description: 'Stable dark-plum outline hierarchy uses main, structure and detail widths with object-space plus/minus 18 percent variation.',
  region: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' },
  scale: 'catalog-visible game contour',
  affects: 'silhouette, materialSurface',
  mapsTo: { type: 'material.localOverrides', ref: 'controller-outline-hierarchy' },
  evidenceRef: views.threeQuarter,
  confidence: 0.98,
});
[
  ['game-controller-v2-shell-facet-band', 'ridge', 'front-shell', 'Broad planar shell facets step around the shoulder deck and waist without adding a raised panel.'],
  ['game-controller-v2-shoulder-undercut', 'seam', 'shoulder-deck', 'A controlled plum undercut separates each bumper from its trigger through the full press arc.'],
  ['game-controller-v2-stick-thumb-dish', 'bevel', 'left-stick-assembly', 'Each faceted analog cap keeps a clearly recessed thumb dish and readable crown rim.'],
].forEach(([id, kind, componentRef, description]) => details.push({
  id,
  kind,
  description,
  region: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' },
  scale: 'meso',
  affects: 'geometry, materialSurface',
  mapsTo: { type: 'component.localFeatures', ref: componentRef },
  evidenceRef: views.threeQuarter,
  confidence: 0.96,
}));

spec.preSpecAssessment = {
  ...structuredClone(v1.preSpecAssessment),
  objectClass: {
    primaryType: 'faceted wireless game controller',
    primaryDomain: 'object',
    formLanguage: ['hard-surface', 'low-poly', 'faceted', 'ergonomic'],
    structureKind: ['compound object', 'layered shell', 'articulated controls', 'repeated modules'],
    motionPotential: ['articulated', 'button-press', 'stick-orbit', 'effect-emitter', 'destructible'],
    materialFamilies: ['matte plastic', 'dark cavity plastic', 'indicator lens', 'fastener metal'],
    notes: 'The archived runtime rig and v1 Box3 are compatibility truth. The IMAGEN sheet reallocates visual masses only inside that contract.',
  },
  complexity: {
    tier: 'ultra-complex',
    scores: {
      silhouetteComplexity: 3,
      componentCount: 3,
      hierarchyDepth: 3,
      repetitionDensity: 3,
      materialLayerCount: 3,
      localDetailDensity: 3,
      occlusionRisk: 3,
      actionReadinessNeed: 3,
    },
    estimatedCounts: {
      macroComponents: 5,
      mesoComponents: 20,
      microFeatureGroups: details.length,
      materialLayers: 10,
      repetitionSystems: 7,
    },
    reasoning: [
      'Eleven front-control pivots and four shoulder pivots must retain exact local transforms and full animation clearance.',
      'Five stars, four bolts, eight shards and six energy points form a model-owned volumetric ultimate effect.',
      'Front, rear, side and three-quarter identity depend on consistent shell, control and rear-service relationships.',
      'The shared performance system requires deterministic seeking, one timeline owner and exact stop reset.',
    ],
  },
  specDepthDecision: {
    requiredDepth: 'ultra-complex',
    minimumComponentLevels: ['macro', 'meso', 'micro'],
    needsRepetitionSystems: true,
    needsMaterialLocalOverrides: true,
    needsMultipleReviewViews: true,
    needsActionReadyHierarchy: true,
    rationale: 'The redesign changes visual geometry and outline styling while preserving an animation-rich runtime contract.',
  },
  unknownsToResolveBeforeImplementation: [],
  detailInventory: {
    scanMethod: 'grid-4x4 plus four-view component review',
    targetMinDetails: 22,
    details,
  },
  sourceImage: spec.sourceImage,
};
spec.localSpecSearch = assessmentEnvelope.localSpecSearch;

const cloneComponent = (sourceId, id, name, parent, material, primitive, role = 'part') => {
  const source = structuredClone(spec.componentTree.find((component) => component.id === sourceId));
  source.id = id;
  source.name = name;
  source.level = 'meso';
  source.parent = parent;
  source.material = material;
  source.materialLayers = [material];
  source.primitive = primitive;
  source.role = role;
  source.localFeatures = [id];
  source.details = [{ id, kind: 'construction', evidenceRefs: ['front-view', 'three-quarter-view'] }];
  source.evidenceRefs = ['front-view', 'three-quarter-view'];
  source.attachment = parent === 'root' ? {
    parentSocket: 'root-socket', localStart: [0, 0, 0], localEnd: [0, 0, 0],
    contactType: 'socket', overlap: 0.001, gapTolerance: 0.01, evidenceRefs: source.evidenceRefs,
  } : source.attachment;
  return source;
};
spec.componentTree.push(
  cloneComponent('face-button-array', 'central-control-cluster', 'Home Select and Status Cluster', 'front-shell', 'pink-plastic', 'instanced-cluster', 'control'),
  cloneComponent('face-button-array', 'ultimate-effect-rig', 'Model-owned Volumetric Ultimate Rig', 'root', 'pink-plastic', 'instanced-cluster', 'effect'),
  cloneComponent('shoulder-deck', 'scene-edge-socket-system', 'Frozen Scene Edge Connection Socket System', 'root', 'cavity-dark', 'instanced-cluster', 'attachment'),
);
spec.repetitionSystems.push({
  id: 'ultimate-effect-families',
  name: 'Volumetric ultimate effect families',
  componentRef: 'ultimate-effect-rig',
  count: 23,
  distribution: 'five stars, four bolts, eight shards and six orbit points',
  geometry: 'closed extrusions, tubes and low-poly solids',
  material: 'pink-plastic',
  evidenceRefs: ['three-quarter-view'],
});

spec.qualityContract = {
  ...structuredClone(v1.qualityContract),
  qualityBar: 'ultra-complex',
  definitionOfDone: [
    'The broad shoulder deck, narrow waist, deep lower notch and flared grips match the v2 sheet while staying within the v1 full-tree bounds.',
    'All existing animation pivots, semantic sockets, colliders, destruction groups and idle transforms remain compatible.',
    'The model uses broad 6-12 sided facets, restrained stepped bevels and a stable 0.0048/0.0041/0.0033 outline hierarchy.',
    'Anticipation, heartbeat, frenzy, ultimate, ready finale, settle and stop retain one animation owner and exact reset.',
  ],
  minimumSpecDepth: {
    macroComponents: 5,
    mesoComponents: 18,
    microFeatureGroups: 22,
    materialLayers: 5,
    repetitionSystems: 6,
    reviewViewpoints: 7,
  },
};
spec.qualityContract.featureGroups = [
  {
    id: 'controller-envelope-silhouette',
    name: 'Frozen controller envelope and silhouette',
    required: true,
    qualityCriteria: ['V1 full-tree Box3, ground height, four edge anchors, broad shoulders, deep notch and grip extremes stay compatible.'],
    evidenceRefs: ['front-view', 'side-view', 'back-view', 'three-quarter-view'],
    failureModes: ['Box3 drift', 'straight slab side profile', 'notch closes', 'grips exceed envelope'],
  },
  {
    id: 'grip-shell-system',
    name: 'Faceted shell and grip system',
    required: true,
    qualityCriteria: ['Cream shell and four pink wrap panels form broad readable facets with crisp boundaries and no floating seams.'],
    evidenceRefs: ['front-view', 'side-view', 'back-view', 'three-quarter-view'],
    failureModes: ['soft rubber toy form', 'flat painted grip panels', 'uniform tube-like handles'],
  },
  {
    id: 'front-control-system',
    name: 'Frozen front control system',
    required: true,
    qualityCriteria: ['D-pad, four face buttons, two sticks, home, select and status keep their exact pivots and full press/orbit clearance.'],
    evidenceRefs: ['front-view', 'three-quarter-view'],
    failureModes: ['control count changes', 'pivot moves', 'press travel penetrates shell', 'cavities become black clumps'],
  },
  {
    id: 'shoulder-system',
    name: 'Two-layer shoulder system',
    required: true,
    qualityCriteria: ['Bumpers and triggers remain distinct faceted wedges around the frozen hinges and clear the shell at maximum press.'],
    evidenceRefs: ['side-view', 'back-view', 'three-quarter-view'],
    failureModes: ['layers merge', 'hinges move', 'pressed key clips shell'],
  },
  {
    id: 'controller-animation-contact',
    name: 'Frozen powered animation and effect contact',
    required: true,
    qualityCriteria: ['All input actions and 23 ultimate effect bodies retain parentage, emission placement, one timeline owner and exact reset.'],
    evidenceRefs: ['front-view', 'three-quarter-view'],
    failureModes: ['effect duplication', 'old-position emission', 'multiple timeline owners', 'reset drift'],
  },
  {
    id: 'controller-outline-hierarchy',
    name: 'Stable unequal outline hierarchy',
    required: true,
    qualityCriteria: ['Main, structural and detail contours use stable 0.0048/0.0041/0.0033 widths with plus/minus 18 percent object-space variation.'],
    evidenceRefs: ['front-view', 'side-view', 'back-view', 'three-quarter-view'],
    failureModes: ['uniform technical outline', 'temporal wobble', 'small controls become black clumps'],
  },
];
spec.qualityContract.visualDeltaChecks = [
  'v1 full-tree Box3, center and ground contact within declared tolerance',
  'four frozen scene-edge cable anchors and all semantic socket transforms',
  'D-pad, face-button, stick, home, select and shoulder screen-space contacts',
  'faceted shell, S-curve grips and deep lower notch across four views',
  'rear battery cover, port cover and four screw count',
  'single timeline owner, model-owned ultimate effects and exact stop reset',
  'outline width hierarchy and stability under rotation',
];

spec.qualityTargets = {
  targetFidelity: 0.84,
  mustMatch: [
    'same controller identity and compatible v1 envelope',
    'broad shoulder deck, narrow waist, deep lower notch and flared grip pair',
    'exact front control count and frozen pivot placement',
    'two distinct shoulder layers on each side',
    'rear battery cover, upper port cover and four screws',
    'model-owned volumetric ultimate effect alignment',
    'stable unequal dark-plum outline hierarchy',
  ],
  niceToHave: ['lower triangle count than v1', 'stronger side-view S-curve and palm facets'],
  fpsTarget: 60,
  reviewViewpoints: ['front', 'side', 'back', 'three-quarter', 'top', 'three-quarter-powered', 'exploded'],
};
spec.selfCorrectLoop.visualAcceptance.threshold = 0.8;
spec.selfCorrectLoop.visualAcceptance.featureReviewPolicy.criticalDefaultThreshold = 0.82;
spec.selfCorrectLoop.visualAcceptance.featureReviewPolicy.importantAverageThreshold = 0.75;

spec.viewEvidence = [
  ['front-view', 'front', views.front, ['broad shoulder deck', 'deep lower notch', 'exact controls', 'pink grip panels'], 0.98],
  ['side-view', 'side', views.side, ['faceted S-curve', 'shell depth', 'two shoulder layers', 'tapered grip'], 0.98],
  ['back-view', 'back', views.back, ['battery cover', 'port cover', 'four screws', 'rear grip wraps'], 0.98],
  ['three-quarter-view', 'three-quarter', views.threeQuarter, ['low-poly facets', 'control depth', 'grip flare', 'outline hierarchy'], 0.99],
].map(([id, view, imagePath, observations, confidence]) => ({
  id,
  view,
  imagePath,
  imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' },
  observations,
  confidence,
}));

for (const component of spec.componentTree) {
  component.evidenceRefs = component.evidenceRefs?.map((ref) => (
    ref === 'front-view' || ref === 'side-view' || ref === 'back-view' ? ref : 'three-quarter-view'
  )) ?? ['three-quarter-view'];
  if (['front-shell', 'rear-shell', 'grip-shell-pair', 'shoulder-deck', 'pink-grip-panel-pair', 'dpad-cross', 'left-stick-assembly', 'right-stick-assembly', 'bumper-pair', 'trigger-pair'].includes(component.id)) {
    component.topologyClass = 'conforming-shell';
    component.topologyRationale = 'Deliberate low-poly hard-surface form with 6-12 sided profiles, broad planar facets and restrained stepped bevels.';
  }
}

const shellMaterial = spec.materials.find((material) => material.id === 'cream-shell');
if (shellMaterial) {
  shellMaterial.localOverrides ??= [];
  shellMaterial.localOverrides.push({
    id: 'controller-outline-hierarchy',
    region: 'opaque outer shells, grip panels, structural controls and small detail contours',
    response: 'main 0.0048, structure 0.0041, detail 0.0033, stable object-space variation 0.18',
    evidenceRefs: ['front-view', 'side-view', 'back-view', 'three-quarter-view'],
  });
}

spec.featureReviewTargets = [
  { id: 'controller-silhouette', name: 'Frozen shoulder waist notch and grip silhouette', tier: 'critical', passIds: ['blockout', 'form-refinement'], minimumScore: 0.82, mustPass: true, componentRefs: ['front-shell', 'rear-shell', 'grip-shell-pair', 'shoulder-deck'], evidenceRefs: ['front-view', 'side-view', 'back-view', 'three-quarter-view'] },
  { id: 'grip-shell-system', name: 'Faceted shell and wraparound grip panels', tier: 'critical', passIds: ['structural-pass', 'form-refinement', 'material-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['front-shell', 'rear-shell', 'grip-shell-pair', 'pink-grip-panel-pair', 'grip-boundary-seams'], evidenceRefs: ['front-view', 'side-view', 'back-view'] },
  { id: 'front-control-system', name: 'D-pad face buttons analog sticks and centre controls', tier: 'critical', passIds: ['structural-pass', 'form-refinement', 'material-pass', 'interaction-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['dpad-cross', 'face-button-array', 'left-stick-assembly', 'right-stick-assembly', 'home-button', 'select-button', 'status-lens'], evidenceRefs: ['front-view', 'three-quarter-view'] },
  { id: 'shoulder-system', name: 'Two-layer bumper and trigger wedges', tier: 'critical', passIds: ['structural-pass', 'form-refinement', 'interaction-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['bumper-pair', 'trigger-pair', 'shoulder-hinge-caps'], evidenceRefs: ['side-view', 'back-view', 'three-quarter-view'] },
  { id: 'rear-service-system', name: 'Battery cover port cover seams and four screws', tier: 'important', passIds: ['structural-pass', 'form-refinement'], minimumScore: 0.75, mustPass: false, componentRefs: ['rear-battery-cover', 'rear-port-cover', 'rear-screw-array', 'battery-cover-seam'], evidenceRefs: ['back-view'] },
  { id: 'controller-powered-action', name: 'Full input sequence ultimate burst ready finale and exact reset', tier: 'critical', passIds: ['interaction-pass'], minimumScore: 0.84, mustPass: true, componentRefs: ['front-shell', 'dpad-cross', 'face-button-array', 'left-stick-assembly', 'right-stick-assembly', 'bumper-pair', 'trigger-pair'], evidenceRefs: ['front-view', 'three-quarter-view'] },
  { id: 'controller-outline-hierarchy', name: 'Stable unequal dark-plum outline hierarchy', tier: 'critical', passIds: ['material-pass', 'lighting-pass', 'optimization-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['front-shell', 'rear-shell', 'grip-shell-pair', 'pink-grip-panel-pair', 'dpad-cross', 'face-button-array'], evidenceRefs: ['front-view', 'side-view', 'back-view', 'three-quarter-view'] },
];

for (const pass of spec.buildPasses) {
  if (pass.id === 'blockout') pass.acceptance.push('The v1 Box3 and ground height remain compatible after the low-poly silhouette change.');
  if (pass.id === 'form-refinement') pass.acceptance.push('Shells, grip panels, sticks and shoulders use broad readable facets instead of smooth slab or rubber-toy forms.');
  if (pass.id === 'material-pass') pass.acceptance.push('Opaque assemblies use the v2 outline hierarchy while status, screws and performance effects avoid black clumping.');
  if (pass.id === 'interaction-pass') pass.acceptance.push('All frozen input pivots, shoulder hinges and ultimate effect origins remain aligned through the complete 5.2 second sequence.');
  if (pass.id === 'optimization-pass') {
    pass.acceptance = [
      'Static triangles do not exceed 78840 and peak powered triangles do not exceed 82846.',
      'Static draw calls do not exceed 88 and peak powered draw calls do not exceed 129.',
      'Repeated low-poly controls share geometry where stable node identity permits.',
      'Three rebuild and disposal cycles leave no geometry or material undisposed.',
    ];
  }
}

spec.visualEvidence = [];
spec.reviewHistory = [];
spec.tier1Results = [];
spec.sculptPipeline = {
  passGateMode: 'locked-sequential',
  passOrder: ['blockout', 'structural-pass', 'form-refinement', 'material-pass', 'lighting-pass', 'interaction-pass', 'optimization-pass'],
  currentPass: 'blockout',
  completedPasses: [],
  lastCompletedPass: '',
  blockedReason: 'blockout requires browser screenshot and comparison review',
  nextRequiredEvidence: [],
};
spec.performanceBudget = {
  qualityPriority: 'reference-fidelity real-time browser',
  targetTriangles: 58400,
  maxTriangles: 82846,
  maxDrawCalls: 129,
  textureSize: 1024,
  fpsTarget: 60,
  optimizationPolicy: 'Use 6-12 sided profiles, share repeated controls, keep effects model-owned and avoid update-time allocations.',
};
spec.lodPlan = [
  { tier: 'near', distance: 0, strategy: 'full named controls, rear service and powered volumes' },
  { tier: 'far', distance: 18, strategy: 'inactive ultimate bodies stay hidden while all stable node identities are retained' },
];
spec.risks = [
  'Shell facet reduction must preserve input clearances and the archived full-tree Box3 tolerance.',
  'Enlarged analog caps, face buttons and shoulder wedges must not penetrate neighbours at maximum animation travel.',
  'Thicker outlines must exclude status, screws and performance effects to avoid black clumping and draw-call growth.',
  'The fixed pivots and sockets are animation truth when the IMAGEN sheet visually suggests a different spacing.',
];

assessmentEnvelope.targetName = spec.targetName;
assessmentEnvelope.sourceImage = spec.sourceImage;
assessmentEnvelope.preSpecAssessment = spec.preSpecAssessment;
assessmentEnvelope.qualityContract = spec.qualityContract;
inventoryEnvelope.sourceImage = spec.sourceImage;
inventoryEnvelope.sourceViews = Object.values(views);
inventoryEnvelope.detailInventory = spec.preSpecAssessment.detailInventory;
inventoryEnvelope.note = 'The IMAGEN sheet is visual evidence; the archived runtime contract is authoritative for dimensions and animation anchors.';

await Promise.all([
  writeFile(specPath, `${JSON.stringify(spec, null, 2)}\n`),
  writeFile(assessmentPath, `${JSON.stringify(assessmentEnvelope, null, 2)}\n`),
  writeFile(inventoryPath, `${JSON.stringify(inventoryEnvelope, null, 2)}\n`),
]);

console.log(specPath);

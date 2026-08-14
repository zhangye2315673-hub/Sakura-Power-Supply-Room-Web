#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const v1Path = path.join(root, 'docs', 'sculpt-specs', 'blender', 'object-sculpt-spec.json');
const v2Root = path.join(root, 'docs', 'sculpt-specs-v2', 'blender');
const assessmentPath = path.join(v2Root, 'pre-spec-assessment.json');
const inventoryPath = path.join(v2Root, 'detail-inventory.json');
const specPath = path.join(v2Root, 'object-sculpt-spec.json');

const [v1, assessmentEnvelope, inventoryEnvelope] = await Promise.all([
  readFile(v1Path, 'utf8').then(JSON.parse),
  readFile(assessmentPath, 'utf8').then(JSON.parse),
  readFile(inventoryPath, 'utf8').then(JSON.parse),
]);

const spec = structuredClone(v1);
const refRoot = 'references/intake-v2/blender';
const views = {
  front: `${refRoot}/views/front.png`,
  side: `${refRoot}/views/side.png`,
  back: `${refRoot}/views/back.png`,
  threeQuarter: `${refRoot}/views/three-quarter.png`,
};

spec.targetName = 'SAKURA Blender v2';
spec.targetId = 'blender-v2';
spec.sourceImage = `${refRoot}/blender-turnsheet-v2.png`;
spec.suitability = 'pass';
spec.referenceCamera = {
  solved: true,
  projection: 'orthographic-like four-view turn-sheet',
  fovDegrees: 31,
  aspect: 1,
  orientation: { yaw: 0, pitch: 0, roll: 0 },
  positionHint: [0, 2.42, 10],
  note: 'The IMAGEN sheet is visual form evidence. The archived v1 runtime contract is authoritative for bounds, pivots, sockets, colliders and animation state.',
};

const details = structuredClone(v1.preSpecAssessment.detailInventory.details);
details[0].description = 'Low 8-sided mint lid knob with a crisp stepped upper rim.';
details[1].description = 'Broad Sakura-pink lid uses a stepped 12-sided umbrella crown.';
details[4].description = 'Transparent jar widens upward as a readable 12-sided faceted vessel.';
details[5].description = 'Eight sparse molded ribs follow the faceted jar taper without milky overlap.';
details[6].description = 'Bold cream 8-sided three-bend handle forms a tall angular opening with thick embedded roots.';
details[7].description = 'Four enlarged dark metal blade wedges cant upward around a faceted hub.';
details[9].description = 'Warm cream upper motor shoulder is compressed into a stronger trapezoid transition.';
details[10].description = 'Sakura-pink lower enclosure reads as a chunky faceted plinth inside the v1 footprint.';
details[12].description = 'Oversized layered mint speed dial is approximately 18 percent larger while retaining the frozen pivot.';
details.push({
  id: 'blender-v2-detail-21',
  kind: 'contour',
  description: 'Stable dark-plum outline hierarchy uses main, structure and detail widths with object-space plus/minus 18 percent variation.',
  region: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' },
  scale: 'catalog-visible game contour',
  affects: 'silhouette, materialSurface',
  mapsTo: { type: 'material.localOverrides', ref: 'blender-outline-hierarchy' },
  evidenceRef: views.threeQuarter,
  confidence: 0.98,
});
for (const detail of details) {
  detail.evidenceRef ??= views.threeQuarter;
  detail.confidence = Math.max(detail.confidence ?? 0.9, 0.94);
}

spec.preSpecAssessment = {
  ...structuredClone(assessmentEnvelope.preSpecAssessment),
  objectClass: {
    primaryType: 'faceted countertop blender with transparent vessel',
    primaryDomain: 'object',
    formLanguage: ['hard-surface', 'low-poly', 'faceted', 'transparent-vessel'],
    structureKind: ['compound object', 'layered shell', 'articulated assembly', 'repeated modules'],
    motionPotential: ['articulated', 'rotating', 'effect-emitter', 'detachable', 'destructible'],
    materialFamilies: ['matte plastic', 'transparent jar wall', 'dark metal', 'rubber', 'translucent liquid'],
    notes: 'The v1 runtime contract freezes the 144-node rig. The IMAGEN sheet only reallocates visual masses within that envelope.',
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
      macroComponents: 4,
      mesoComponents: 18,
      microFeatureGroups: 21,
      materialLayers: 12,
      repetitionSystems: 6,
    },
    reasoning: [
      'Transparent jar ordering must coexist with opaque fruit, blades, liquid and splash volumes.',
      'Jar, lid, blade, dial, fruit and liquid pivots are all independently animated and must reset exactly.',
      'Eight ribs, four blades, five vents, four feet and twelve fruit chunks are repeated systems.',
      'The current runtime exposes 144 named objects and ten semantic sockets whose local transforms are frozen.',
    ],
  },
  specDepthDecision: {
    requiredDepth: 'ultra-complex',
    minimumComponentLevels: ['macro', 'meso', 'micro'],
    needsRepetitionSystems: true,
    needsMaterialLocalOverrides: true,
    needsMultipleReviewViews: true,
    needsActionReadyHierarchy: true,
    rationale: 'The redesign changes visual geometry only and must preserve the existing high-density performance rig.',
  },
  unknownsToResolveBeforeImplementation: [],
  detailInventory: {
    scanMethod: 'grid-4x4 plus four-view component review',
    targetMinDetails: 20,
    details,
  },
  sourceImage: spec.sourceImage,
};
spec.localSpecSearch = assessmentEnvelope.localSpecSearch;

spec.qualityContract = {
  ...structuredClone(v1.qualityContract),
  qualityBar: 'ultra-complex',
  definitionOfDone: [
    'The base, jar, lid, handle, fruit and control read as the same blender from all four reference views while preserving the exact v1 full-tree bounds.',
    'The jar, lid, handle, dial, blade, fruit, liquid and splash geometry remain children of the frozen v1 pivots and sockets.',
    'The model uses broad 6-12 sided facets, stepped bevels and a 0.0048/0.0041/0.0033 stable outline hierarchy without temporal jitter.',
    'Startup, chop, blend, two lid bounces, mouth splash, wind-down and stop all retain one animation owner and exact reset.',
  ],
  minimumSpecDepth: {
    macroComponents: 4,
    mesoComponents: 16,
    microFeatureGroups: 20,
    materialLayers: 10,
    repetitionSystems: 6,
    reviewViewpoints: 7,
  },
};
spec.qualityContract.featureGroups = [
  {
    id: 'blender-envelope-silhouette',
    name: 'Frozen blender envelope and silhouette',
    required: true,
    qualityCriteria: ['Exact v1 Box3, ground height, jar/base ratio, handle side and four cable edge anchors are preserved.'],
    evidenceRefs: ['front-view', 'side-view', 'back-view', 'three-quarter-view'],
    failureModes: ['full-tree Box3 changes', 'handle switches side', 'jar or base expands past the v1 footprint'],
  },
  {
    id: 'faceted-vessel-system',
    name: 'Faceted transparent vessel system',
    required: true,
    qualityCriteria: ['12-sided jar, sparse ribs, rolled rim, angular handle roots and stepped lid remain readable and attached.'],
    evidenceRefs: ['front-view', 'side-view', 'back-view', 'three-quarter-view'],
    failureModes: ['opaque or milky jar', 'hose-like handle', 'floating roots', 'lid hides splash gaps'],
  },
  {
    id: 'motor-control-system',
    name: 'Chunky base and oversized control',
    required: true,
    qualityCriteria: ['Pink plinth, compressed cream shoulder, enlarged dial, status dot, rear vents and inlet retain frozen placements.'],
    evidenceRefs: ['front-view', 'back-view', 'three-quarter-view'],
    failureModes: ['generic rectangular base', 'dial pivot moves', 'rear connection no longer matches'],
  },
  {
    id: 'blender-animation-contact',
    name: 'Frozen animation and effect contact',
    required: true,
    qualityCriteria: ['Blade, fruit, liquid, lid and splash remain aligned through all sampled phases and stop exactly restores idle state.'],
    evidenceRefs: ['front-view', 'three-quarter-view'],
    failureModes: ['fruit or liquid crosses jar wall', 'splash emits from old mouth', 'lid bounce separates from jar'],
  },
  {
    id: 'blender-outline-hierarchy',
    name: 'Stable unequal outline hierarchy',
    required: true,
    qualityCriteria: ['Main, structural and detail contours use stable 0.0048/0.0041/0.0033 widths with plus/minus 18 percent object-space variation.'],
    evidenceRefs: ['front-view', 'side-view', 'back-view', 'three-quarter-view'],
    failureModes: ['uniform technical outline', 'temporal wobble', 'transparent parts become black clumps'],
  },
];
spec.qualityContract.visualDeltaChecks = [
  'exact v1 full-tree Box3, center and ground contact',
  'four scene-edge cable anchors and ten semantic socket transforms',
  'jar-seat, blade-axis, lid-seat, dial and splash-mouth screen-space contacts',
  'faceted base, jar, lid and handle silhouette across four views',
  'transparent sorting with fruit, blade and smoothie volumes',
  'single timeline owner and exact stop reset',
  'outline width hierarchy and stability under rotation',
];

spec.qualityTargets = {
  targetFidelity: 0.84,
  mustMatch: [
    'same blender identity and exact v1 envelope',
    'faceted transparent jar with eight ribs',
    'bold angular right-side handle with frozen roots',
    'stepped lid with clear left and right splash gaps',
    'chunky two-band motor base and enlarged dial',
    'four-blade hub, fruit pile, smoothie and mouth splash alignment',
    'stable unequal dark-plum outline hierarchy',
  ],
  niceToHave: ['lower triangle count than v1', 'stronger jar and base facet readability'],
  fpsTarget: 60,
  reviewViewpoints: ['front', 'side', 'back', 'three-quarter', 'top', 'three-quarter-powered', 'exploded'],
};
spec.selfCorrectLoop.visualAcceptance.threshold = 0.8;
spec.selfCorrectLoop.visualAcceptance.featureReviewPolicy.criticalDefaultThreshold = 0.82;
spec.selfCorrectLoop.visualAcceptance.featureReviewPolicy.importantAverageThreshold = 0.75;

spec.viewEvidence = [
  ['front-view', 'front', views.front, ['two-band base', 'oversized dial', 'faceted jar', 'right-side handle', 'fruit and blade'], 0.98],
  ['side-view', 'side', views.side, ['handle depth and roots', 'jar flare', 'base depth', 'lid projection'], 0.98],
  ['back-view', 'back', views.back, ['left-projected handle', 'rear vents', 'power inlet', 'feet'], 0.98],
  ['three-quarter-view', 'three-quarter', views.threeQuarter, ['low-poly facets', 'transparent sorting', 'dial depth', 'handle opening'], 0.99],
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
  if (['jar-shell', 'lid-shell', 'jar-handle', 'lower-base-shell', 'upper-base-shell', 'speed-dial'].includes(component.id)) {
    component.geometryDescriptor.topologyIntent = 'deliberate low-poly hard-surface form with 6-12 sided profiles and broad planar facets';
  }
}

const creamMaterial = spec.materials.find((material) => material.id === 'cream-shell');
creamMaterial.localOverrides.push({
  id: 'blender-outline-hierarchy',
  region: 'opaque outer shells and structural seams; transparent jar uses sparse structure-only contour',
  response: 'main 0.0048, structure 0.0041, detail 0.0033, stable object-space variation 0.18',
  evidenceRefs: ['front-view', 'side-view', 'back-view', 'three-quarter-view'],
});

spec.featureReviewTargets = [
  { id: 'blender-silhouette', name: 'Frozen base jar lid and handle silhouette', tier: 'critical', passIds: ['blockout', 'form-refinement'], minimumScore: 0.82, mustPass: true, componentRefs: ['lower-base-shell', 'upper-base-shell', 'jar-shell', 'jar-handle', 'lid-shell'], evidenceRefs: ['front-view', 'side-view', 'back-view', 'three-quarter-view'] },
  { id: 'jar-system', name: 'Faceted transparent jar collar ribs and angular handle roots', tier: 'critical', passIds: ['structural-pass', 'form-refinement', 'material-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['jar-shell', 'jar-upper-collar', 'jar-rib-array', 'jar-handle'], evidenceRefs: ['front-view', 'side-view', 'back-view'] },
  { id: 'blade-seat-system', name: 'Jar seat coupling hub and four blades', tier: 'critical', passIds: ['structural-pass', 'interaction-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['jar-seat', 'coupling-ring', 'blade-hub', 'blade-array'], evidenceRefs: ['front-view', 'three-quarter-view'] },
  { id: 'control-system', name: 'Chunky base oversized dial marker and status indicator', tier: 'critical', passIds: ['structural-pass', 'form-refinement', 'material-pass', 'interaction-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['lower-base-shell', 'upper-base-shell', 'speed-dial', 'dial-marker', 'status-indicator'], evidenceRefs: ['front-view', 'three-quarter-view'] },
  { id: 'blender-powered-action', name: 'Fruit chop smoothie vortex lid bounce mouth splash and reset', tier: 'critical', passIds: ['interaction-pass'], minimumScore: 0.84, mustPass: true, componentRefs: ['blade-pivot', 'liquid-vortex-pivot', 'ingredient-chunk-array', 'lid-pivot'], evidenceRefs: ['front-view', 'three-quarter-view'] },
  { id: 'blender-outline-hierarchy', name: 'Stable unequal dark-plum outline hierarchy', tier: 'critical', passIds: ['material-pass', 'lighting-pass', 'optimization-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['lower-base-shell', 'upper-base-shell', 'jar-shell', 'jar-handle', 'lid-shell'], evidenceRefs: ['front-view', 'side-view', 'back-view', 'three-quarter-view'] },
  { id: 'rear-service', name: 'Five vents inlet and rear feet', tier: 'important', passIds: ['structural-pass', 'form-refinement'], minimumScore: 0.75, mustPass: false, componentRefs: ['rear-vent-array', 'rear-power-inlet', 'foot-array'], evidenceRefs: ['back-view'] },
];

for (const pass of spec.buildPasses) {
  if (pass.id === 'blockout') pass.acceptance.push('The v1 Box3 and ground height remain exact after the low-poly silhouette change.');
  if (pass.id === 'form-refinement') pass.acceptance.push('Jar, handle, lid and base use broad readable facets instead of smooth hose or toy forms.');
  if (pass.id === 'material-pass') pass.acceptance.push('Opaque shells use the v2 outline hierarchy while transparent jar, liquid and micro details avoid black clumping.');
  if (pass.id === 'interaction-pass') pass.acceptance.push('Both splash emitters remain aligned with their frozen cup-mouth sockets through lid motion.');
  if (pass.id === 'optimization-pass') {
    pass.acceptance = [
      'Peak triangles do not exceed 1.35 times the v1 browser peak of 29082.',
      'Peak draw calls do not exceed 1.20 times the v1 browser peak of 92.',
      'Repeated low-poly geometry is shared where stable node identity permits.',
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
  targetTriangles: 29082,
  maxTriangles: 39260,
  maxDrawCalls: 110,
  textureSize: 1024,
  fpsTarget: 60,
  optimizationPolicy: 'Use 6-12 sided profiles, share repeated geometry, pool effects and avoid update-time allocations.',
};
spec.lodPlan = [
  { tier: 'near', distance: 0, strategy: 'full named assemblies and powered volumes' },
  { tier: 'far', distance: 18, strategy: 'inactive fruit chunks and liquid volumes remain hidden; shared repeated geometry is retained' },
];
spec.risks = [
  'Reducing jar segments can change transparent sorting or shrink Box3 extrema unless axis-aligned facets are retained.',
  'Angular handle control points must stay embedded at both frozen roots and inside the v1 handle envelope.',
  'Thicker outlines must exclude liquid, splash and very small transparent parts to avoid black clumping.',
  'The fixed mouth sockets are animation truth even when the IMAGEN lid overhang is visually wider.',
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

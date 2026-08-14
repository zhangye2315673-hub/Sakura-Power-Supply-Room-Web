#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const specRoot = path.join(root, 'docs', 'sculpt-specs-v2', 'portable-speaker');
const assessmentPath = path.join(specRoot, 'pre-spec-assessment.json');
const inventoryPath = path.join(specRoot, 'detail-inventory.json');
const specPath = path.join(specRoot, 'object-sculpt-spec.json');
const v1SpecPath = path.join(root, 'docs', 'sculpt-specs', 'portable-speaker', 'object-sculpt-spec.json');

const [assessmentEnvelope, inventoryEnvelope, v1Spec] = await Promise.all([
  readFile(assessmentPath, 'utf8').then(JSON.parse),
  readFile(inventoryPath, 'utf8').then(JSON.parse),
  readFile(v1SpecPath, 'utf8').then(JSON.parse),
]);

const spec = structuredClone(v1Spec);
const refRoot = 'references/intake-v2/portable-speaker';
const views = {
  front: `${refRoot}/views/front.png`,
  side: `${refRoot}/views/side.png`,
  back: `${refRoot}/views/back.png`,
  threeQuarter: `${refRoot}/views/three-quarter.png`,
};
const evidenceIds = ['front-view', 'side-view', 'back-view', 'three-quarter-view'];

spec.targetName = 'SAKURA Portable Speaker v2';
spec.targetId = 'portable-speaker-v2';
spec.sourceImage = `${refRoot}/portable-speaker-turnsheet-v2.png`;
spec.suitability = 'pass';
spec.scores = {
  object_isolation: 3,
  silhouette_readability: 3,
  depth_inference: 3,
  primitive_decomposition: 3,
  material_procedurality: 3,
  occlusion_risk: 2,
  interaction_fit: 3,
};
spec.referenceCamera = {
  solved: true,
  projection: 'orthographic-like four-view turn-sheet',
  fovDegrees: 30,
  aspect: 1,
  orientation: { yaw: 0, pitch: 0, roll: 0 },
  positionHint: [0, 2.49, 10],
  note: 'The generated sheet is visual form evidence only. The archived v1 bounds, pivots, sockets, colliders and animation state remain authoritative.',
};
spec.coordinateFrame = {
  front: '+Z faces the perforated acoustic fascia',
  up: '+Y with the feet on the archived ground plane',
  scaleReference: 'archived v1 full-tree bounds 3.595 x 5.03001415 x 2.04099384',
};
spec.silhouette = {
  boundingShape: 'slightly-taller-than-wide faceted portable speaker with a broad inverted-U handle',
  aspectRatios: [3.595 / 5.03001415, 2.04099384 / 5.03001415],
  symmetry: 'bilateral cabinet and handle, with a lower-right front control cluster',
  dominantCurves: ['octagonal handle arch', 'clipped cabinet corners', 'stepped rounded-square fascia'],
  negativeSpaces: ['large handle opening', 'hinge-to-cabinet gaps', 'paired foot gaps'],
  landmarks: ['hinge axis at Y=2.72', 'fascia center at Y=1.92', 'power control at lower right', 'rear service panel near ground'],
};
spec.viewEvidence = [
  ['front-view', 'front', views.front, ['480-point grille field', 'deep stepped fascia', 'lower-right power control', 'status dot'], 0.99],
  ['side-view', 'side', views.side, ['deep cabinet profile', 'thick faceted handle', 'layered hinge stack', 'mint handle insert'], 0.98],
  ['back-view', 'back', views.back, ['rear service panel', 'horizontal port', 'paired feet', 'handle symmetry'], 0.99],
  ['three-quarter-view', 'three-quarter', views.threeQuarter, ['clipped shell planes', 'fascia depth', 'outline hierarchy', 'functional silhouette'], 0.99],
].map(([id, view, imagePath, observations, confidence]) => ({
  id,
  view,
  imagePath,
  imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' },
  observations,
  confidence,
}));

const featureData = [
  ['detail-01', 'contour', 'cabinet-shell', 'The complete faceted cabinet remains inside the archived v1 Box3.'],
  ['detail-02', 'bevel', 'cabinet-shell', 'Clipped upper and lower shell corners create broad LOW POLY planes.'],
  ['detail-03', 'contour', 'cabinet-shell', 'Side walls taper subtly without changing the archived footprint extremes.'],
  ['detail-04', 'seam', 'front-fascia', 'A dark construction seam separates the shell from the acoustic front.'],
  ['detail-05', 'bevel', 'front-fascia', 'The fascia uses a deep three-step frame with restrained chamfers.'],
  ['detail-06', 'fastener', 'grille-perforations', 'Exactly 480 visible grille instances retain radial delay metadata.'],
  ['detail-07', 'contour', 'grille-perforations', 'The lower-right exclusion remains clear for the power controls.'],
  ['detail-08', 'ridge', 'power-control', 'The power control keeps its concentric ring, bezel and face stack.'],
  ['detail-09', 'linework', 'power-control', 'The raised power glyph remains legible at catalog scale.'],
  ['detail-10', 'emissive', 'status-indicator', 'The mint status lens remains a small inset point below the control.'],
  ['detail-11', 'contour', 'carry-handle', 'The handle becomes thicker and more exaggerated without moving its pivot.'],
  ['detail-12', 'bevel', 'carry-handle', 'The handle arch uses a twelve-sided outer profile and broad inner chamfer.'],
  ['detail-13', 'seam', 'carry-handle', 'Mint side inserts stay attached to both outer handle roots.'],
  ['detail-14', 'fastener', 'handle-hinges', 'Each hinge becomes a readable three-layer low-poly cap stack.'],
  ['detail-15', 'contour', 'rear-service-panel', 'The rear service panel receives a stepped clipped perimeter.'],
  ['detail-16', 'linework', 'rear-service-panel', 'The horizontal rear port remains centered on its frozen cable socket.'],
  ['detail-17', 'contour', 'feet', 'Two faceted rubber feet preserve the archived ground contact.'],
  ['detail-18', 'contour', 'internal-driver', 'The driver remains hidden behind the grille and slightly left of center.'],
  ['detail-19', 'contour', 'sound-wave-emitter', 'Eight closed TubeGeometry waves remain thick from oblique views.'],
  ['detail-20', 'contour', 'root', 'Four zero-geometry scene-edge sockets freeze the old fallback cable anchors.'],
  ['detail-21', 'contour', 'root', 'Whole-machine, cabinet, fascia and handle pivots keep exact parent paths and transforms.'],
  ['detail-22', 'linework', 'outline-hierarchy', 'Main, structural and detail ink use 0.0048, 0.0041 and 0.0033 widths.'],
  ['detail-23', 'linework', 'outline-hierarchy', 'Outline variation is stable object-space low-frequency noise at plus/minus 18 percent.'],
  ['detail-24', 'gloss', 'pink-plastic', 'Broad satin Toon highlights explain the shell planes without realistic texture.'],
];
const details = featureData.map(([id, kind, ref, description], index) => ({
  id,
  kind,
  description,
  region: { x: (index % 4) * 0.25, y: Math.floor(index / 4) * 0.16, width: 0.25, height: 0.16, units: 'normalized' },
  scale: index < 5 ? 'macro' : index < 18 ? 'meso' : 'micro',
  affects: kind === 'gloss' || kind === 'emissive' || ref === 'outline-hierarchy' ? 'materialSurface' : 'geometry, materialSurface',
  mapsTo: ref === 'outline-hierarchy' || ref === 'pink-plastic'
    ? { type: 'material.localOverrides', ref }
    : { type: 'component.localFeatures', ref },
  evidenceRef: index >= 14 && index <= 15 ? views.back : views.threeQuarter,
  confidence: 0.96,
}));

spec.preSpecAssessment = {
  ...spec.preSpecAssessment,
  objectClass: {
    primaryType: 'faceted portable loudspeaker with articulated carry handle',
    primaryDomain: 'object',
    formLanguage: ['hard-surface', 'low-poly', 'faceted', 'retro game appliance'],
    structureKind: ['compound object', 'layered shell', 'articulated assembly', 'repeated modules'],
    motionPotential: ['whole-machine bass pulse', 'driver diaphragm travel', 'volumetric wave emitter'],
    materialFamilies: ['molded plastic', 'rubber', 'dark cavity', 'emissive indicator'],
    notes: 'The archived rig is compatibility truth. The four-view sheet reallocates only visual mass inside the frozen envelope.',
  },
  complexity: {
    tier: 'complex',
    scores: {
      silhouetteComplexity: 2,
      componentCount: 3,
      hierarchyDepth: 3,
      repetitionDensity: 3,
      materialLayerCount: 2,
      localDetailDensity: 3,
      occlusionRisk: 2,
      actionReadinessNeed: 3,
    },
    estimatedCounts: { macroComponents: 5, mesoComponents: 10, microFeatureGroups: details.length, materialLayers: 6, repetitionSystems: 2 },
    reasoning: [
      'The shell is compact, but identity depends on a dense 480-instance grille, a layered handle and hinge assembly, front controls and rear service geometry.',
      'The one-owner bass performance deforms the complete machine, drives a hidden diaphragm and emits eight volumetric waves before exact reset.',
    ],
  },
  specDepthDecision: {
    requiredDepth: 'complex',
    minimumComponentLevels: ['macro', 'meso', 'micro'],
    needsRepetitionSystems: true,
    needsMaterialLocalOverrides: true,
    needsMultipleReviewViews: true,
    needsActionReadyHierarchy: true,
    rationale: 'Visual replacement touches an animation-rich compound appliance with dense repeated relief and strict runtime anchors.',
  },
  unknownsToResolveBeforeImplementation: [],
  detailInventory: { scanMethod: 'grid-3x3 plus four-view component review', targetMinDetails: 24, details },
  sourceImage: spec.sourceImage,
};
spec.localSpecSearch = assessmentEnvelope.localSpecSearch;

const featuresByComponent = new Map();
for (const detail of details) {
  if (detail.mapsTo.type !== 'component.localFeatures') continue;
  const list = featuresByComponent.get(detail.mapsTo.ref) ?? [];
  list.push(detail.id);
  featuresByComponent.set(detail.mapsTo.ref, list);
}
for (const component of spec.componentTree) {
  component.localFeatures = featuresByComponent.get(component.id) ?? component.localFeatures ?? [];
  component.evidenceRefs = evidenceIds;
  component.confidence = Math.max(component.confidence ?? 0, 0.94);
  if (component.id === 'root') component.localFeatures = ['detail-20', 'detail-21'];
  if (component.id === 'cabinet-shell') {
    component.name = 'Faceted Sakura Cabinet Shell';
    component.topologyClass = 'assembled-solid';
    component.topologyRationale = 'Rigid clipped-corner shell with broad planar facets and a restrained stepped crown.';
  }
  if (component.id === 'front-fascia') {
    component.name = 'Deep Three-step Acoustic Fascia';
    component.topologyRationale = 'Three nested conforming shells create visible depth without moving the fascia pivot.';
  }
  if (component.id === 'carry-handle') {
    component.name = 'Thick Twelve-sided Carry Handle';
    component.topologyRationale = 'Continuous extruded U-profile with broad low-poly outer planes and physically overlapping hinge roots.';
  }
  if (component.id === 'handle-hinges') component.name = 'Mirrored Three-layer Hinge Stacks';
  if (component.id === 'sound-wave-emitter') component.primitive = 'tube';
  if (component.id === 'feet') {
    component.colorMaterialRecipe.dominantAlbedo = 'rgba(75, 67, 71, 1)';
    component.colorMaterialRecipe.secondaryAlbedo = 'rgba(106, 98, 102, 1)';
  }
}

for (const material of spec.materials) {
  material.shaderModel = 'MeshToonMaterial project style with stable object-space outline hierarchy';
  const pbrRoot = `docs/sculpt-specs-v2/portable-speaker/pbr/${material.id}`;
  material.referencePbr = {
    usable: true,
    confidence: 0.8,
    estimatedFidelity: 0.8,
    sourceImage: views.threeQuarter,
    maps: {
      albedo: { path: `${pbrRoot}/${material.id}_albedo.png` },
      roughness: { path: `${pbrRoot}/${material.id}_roughness.png` },
      height: { path: `${pbrRoot}/${material.id}_height.png` },
      normal: { path: `${pbrRoot}/${material.id}_normal.png` },
      ao: { path: `${pbrRoot}/${material.id}_ao.png` },
    },
    limitation: 'Stylized generated evidence supplies color and value response, not measured physical channels.',
  };
  material.localOverrides ??= [];
}
const pinkMaterial = spec.materials.find((entry) => entry.id === 'pink-plastic');
pinkMaterial?.localOverrides.push({
  id: 'pink-plastic',
  region: 'cabinet shell and carry handle planar crowns',
  response: 'broad satin Toon highlight with restrained roughness contrast',
  roughness: 0.48,
  evidenceRefs: evidenceIds,
});
pinkMaterial?.localOverrides.push({
  id: 'outline-hierarchy',
  region: 'opaque shell, fascia, handle, hinge and control geometry',
  response: 'main 0.0048, structure 0.0041, detail 0.0033 with stable object-space variation 0.18',
  evidenceRefs: evidenceIds,
});

spec.qualityTargets = {
  targetFidelity: 0.82,
  mustMatch: [
    'same portable speaker identity and archived v1 envelope',
    'slightly-taller cabinet, broad handle, layered hinges and deep fascia',
    '480-point grille with lower-right control clearance',
    'rear service panel, horizontal port and paired feet',
    'single timeline owner, eight closed wave tubes and exact reset',
    'stable unequal dark-plum outline hierarchy',
  ],
  niceToHave: ['stronger side depth readability', 'lower triangle count than v1'],
  fpsTarget: 60,
  reviewViewpoints: ['front', 'side', 'back', 'three-quarter', 'startup', 'climax', 'wind-down'],
};
spec.qualityContract = {
  ...spec.qualityContract,
  definitionOfDone: [
    'All four static views match the upgraded faceted silhouette while staying within the archived v1 envelope.',
    'The 480-instance grille, lower-right control clearance, layered hinges, rear service panel and paired feet remain countable and attached.',
    'All frozen pivots, sockets, colliders and destruction groups keep their parent paths and idle transforms within 1e-4.',
    'Startup, climax, wind-down, stop and rebuild retain one timeline owner, eight closed wave tubes and exact reset.',
    'Main, structure and detail contours use the required stable unequal width hierarchy without clumping on tiny effects.',
  ],
  minimumSpecDepth: { macroComponents: 4, mesoComponents: 6, microFeatureGroups: 20, materialLayers: 5, repetitionSystems: 2, reviewViewpoints: 4 },
  featureGroups: [
    { id: 'speaker-silhouette', name: 'Faceted cabinet and exaggerated handle silhouette', required: true, qualityCriteria: ['Slightly-taller cabinet, thick handle opening and clipped corners remain inside the archived bounds.'], evidenceRefs: evidenceIds, failureModes: ['inflated soft shell', 'handle opening collapse', 'envelope growth'] },
    { id: 'acoustic-front', name: 'Deep fascia and 480-point grille system', required: true, qualityCriteria: ['Three-step fascia, dense hole field and lower-right exclusion remain readable.'], evidenceRefs: ['front-view', 'three-quarter-view'], failureModes: ['exposed cone', 'sparse grille', 'flat fascia'] },
    { id: 'handle-hinge-system', name: 'Thick handle and layered hinge attachment', required: true, qualityCriteria: ['Both roots overlap their original hinge sockets through all motion.'], evidenceRefs: ['front-view', 'side-view', 'back-view'], failureModes: ['floating root', 'moved hinge axis', 'missing mint insert'] },
    { id: 'controls-service', name: 'Front controls and rear service assembly', required: true, qualityCriteria: ['Power ring, glyph, status dot, service panel and port remain at frozen anchors.'], evidenceRefs: ['front-view', 'back-view'], failureModes: ['face-like controls', 'moved port', 'missing rear panel'] },
    { id: 'powered-purpose', name: 'Single-owner bass performance and exact reset', required: true, qualityCriteria: ['Whole-machine pulse, hidden driver travel and eight thick waves complete without drift.'], evidenceRefs: ['animation-contract'], failureModes: ['duplicate timeline', 'flat effects', 'reset drift'] },
    { id: 'outline-hierarchy', name: 'Stable unequal SAKURA ink hierarchy', required: true, qualityCriteria: ['Three widths remain stable under rotation and do not outline particles or transparent effects.'], evidenceRefs: ['three-quarter-view'], failureModes: ['uniform outline', 'temporal shimmer', 'black clumps'] },
  ],
  visualDeltaChecks: ['full-tree bounds delta', 'handle negative-space delta', 'fascia depth and grille density delta', 'front/rear anchor projection delta', 'outline tier stability delta', 'startup/climax/wind-down contact delta'],
};

spec.featureReviewTargets = [
  ['speaker-silhouette', 'Faceted cabinet and thick handle silhouette', 'blockout', ['cabinet-shell', 'carry-handle'], ['front-view', 'side-view', 'three-quarter-view']],
  ['acoustic-front', 'Deep fascia and 480-point grille', 'structural-pass', ['front-fascia', 'grille-perforations'], ['front-view', 'three-quarter-view']],
  ['handle-hinge-system', 'Handle roots and layered hinges', 'structural-pass', ['carry-handle', 'handle-hinges'], ['front-view', 'side-view', 'back-view']],
  ['controls-service', 'Front controls and rear service panel', 'form-refinement', ['power-control', 'status-indicator', 'rear-service-panel'], ['front-view', 'back-view']],
  ['outline-hierarchy', 'Three-tier stable outline response', 'material-pass', ['cabinet-shell', 'front-fascia', 'carry-handle'], ['three-quarter-view']],
  ['powered-purpose', 'Bass pulse, wave emission and exact reset', 'interaction-pass', ['internal-driver', 'sound-wave-emitter'], ['animation-contract']],
].map(([id, name, passId, componentRefs, evidenceRefs]) => ({ id, name, tier: 'critical', passIds: [passId], minimumScore: 0.82, mustPass: true, componentRefs, evidenceRefs }));

spec.selfCorrectLoop.visualAcceptance.threshold = 0.8;
spec.visualEvidence = [];
spec.reviewHistory = [];
spec.tier1Results = [];
spec.sculptPipeline = {
  passGateMode: 'locked-sequential',
  passOrder: spec.buildPasses.map((pass) => pass.id),
  currentPass: 'blockout',
  completedPasses: [],
  lastCompletedPass: '',
  blockedReason: 'blockout requires deterministic browser screenshots and comparison review',
  nextRequiredEvidence: [],
};
spec.performanceBudget = {
  qualityPriority: 'reference-fidelity real-time browser',
  targetTriangles: 48224,
  maxTriangles: 65102,
  maxDrawCalls: 46,
  textureSize: 1024,
  fpsTarget: 60,
  optimizationPolicy: 'Use 6-12 sided profiles, shared geometry and instancing while keeping every frozen animation node stable.',
};
spec.proceduralStrategy = [
  'Freeze archived bounds, pivots, semantic sockets, colliders and line anchors before visual edits.',
  'Build clipped low-poly cabinet, stepped fascia, thick handle and layered hinges inside the frozen envelope.',
  'Keep the exact 480-instance grille field and hidden driver animation contract.',
  'Apply stable object-space outline tiers only to appropriate opaque geometry.',
  'Review four static views plus startup, climax and wind-down before optimization.',
];
spec.animationAnchors = [
  'whole-machine, cabinet, fascia, hidden-driver, power-button and handle pivots',
  'left and right hinge pivots and sockets',
  'sound-wave emitter socket and eight closed TubeGeometry wave rings',
  'rear power-cable socket and four frozen scene-edge connection sockets',
];
spec.risks = [
  'Thicker handle geometry must not move or visually detach from the archived hinge axes.',
  'Deep fascia layers and outline hull growth must remain inside the archived Box3 and cable anchor projections.',
  'Dense grille geometry must stay instanced and retain its radial animation delay metadata.',
  'Tiny indicator, wave effects and cavities must avoid heavy outline clumping.',
];
spec.assumptions = [
  'The generated sheet is stylized visual evidence rather than dimensional truth.',
  'The hidden driver remains invisible at rest and is represented only by its frozen animation pivot.',
  'No runtime texture, external model or new dependency is introduced.',
];

assessmentEnvelope.targetName = spec.targetName;
assessmentEnvelope.sourceImage = spec.sourceImage;
assessmentEnvelope.preSpecAssessment = spec.preSpecAssessment;
assessmentEnvelope.qualityContract = spec.qualityContract;
inventoryEnvelope.sourceImage = spec.sourceImage;
inventoryEnvelope.sourceViews = Object.values(views);
inventoryEnvelope.detailInventory = spec.preSpecAssessment.detailInventory;
inventoryEnvelope.note = 'GPT Image 2 owns visual form evidence; the archived runtime contract owns all dimensions and animation anchors.';

await Promise.all([
  writeFile(specPath, `${JSON.stringify(spec, null, 2)}\n`),
  writeFile(assessmentPath, `${JSON.stringify(assessmentEnvelope, null, 2)}\n`),
  writeFile(inventoryPath, `${JSON.stringify(inventoryEnvelope, null, 2)}\n`),
]);

console.log(specPath);

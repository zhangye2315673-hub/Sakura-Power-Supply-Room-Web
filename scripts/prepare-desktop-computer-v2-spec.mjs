#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repoRoot = process.cwd();
const v2Root = path.join(repoRoot, 'docs', 'sculpt-specs-v2', 'desktop-computer');
const specPath = path.join(v2Root, 'object-sculpt-spec.json');
const assessmentPath = path.join(v2Root, 'pre-spec-assessment.json');
const inventoryPath = path.join(v2Root, 'detail-inventory.json');

const [spec, assessmentEnvelope, inventoryEnvelope] = await Promise.all([
  readFile(specPath, 'utf8').then(JSON.parse),
  readFile(assessmentPath, 'utf8').then(JSON.parse),
  readFile(inventoryPath, 'utf8').then(JSON.parse),
]);

const refRoot = 'references/intake-v2/desktop-computer';
const evidence = {
  front: `${refRoot}/views/front.png`,
  side: `${refRoot}/views/side.png`,
  back: `${refRoot}/views/back.png`,
  threeQuarter: `${refRoot}/views/three-quarter.png`,
};

const detail = (id, kind, description, affects, type, ref, evidenceRef, confidence = 0.96) => ({
  id,
  kind,
  description,
  region: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' },
  scale: 'catalog-visible low-poly game detail',
  affects,
  mapsTo: { type, ref },
  evidenceRef,
  confidence,
});

const details = [
  detail('desktop-v2-inventory-01', 'bevel', 'Chunky stepped cream CRT bezel with broad chamfer bands.', 'silhouette, formDetail', 'component.localFeatures', 'monitor-bezel', evidence.front),
  detail('desktop-v2-inventory-02', 'contour', 'Deep swollen CRT belly behind the front shell.', 'silhouette, depth', 'component.localFeatures', 'monitor-crt-belly', evidence.side),
  detail('desktop-v2-inventory-03', 'contour', 'Tapered 8–10 facet rear CRT bell.', 'silhouette, depth', 'component.localFeatures', 'monitor-crt-rear-bell', evidence.side),
  detail('desktop-v2-inventory-04', 'seam', 'Shallow pink rear service cap nested into the CRT bell.', 'formDetail, material zone', 'component.localFeatures', 'monitor-crt-rear-cap', evidence.back),
  detail('desktop-v2-inventory-05', 'hole', 'Repeated top and side CRT ventilation slots with dark cavities.', 'formDetail, cavity response', 'component.localFeatures', 'monitor-crt-vent-system', evidence.side),
  detail('desktop-v2-inventory-06', 'emissive', 'Recessed charcoal screen with cyan/pink state layers.', 'materialSurface, interaction', 'component.localFeatures', 'screen-panel', evidence.front),
  detail('desktop-v2-inventory-07', 'emissive', 'Small cyan monitor and tower status dots.', 'materialSurface, interaction', 'material.localOverrides', 'screen-emissive', evidence.front),
  detail('desktop-v2-inventory-08', 'ridge', 'Short thick stand column and two-stage base remain visibly attached.', 'componentStructure, attachment', 'component.localFeatures', 'monitor-stand-base', evidence.side),
  detail('desktop-v2-inventory-09', 'bevel', 'Slightly tapered tower shell with broad low-poly corner facets.', 'silhouette, formDetail', 'component.localFeatures', 'tower-shell', evidence.threeQuarter),
  detail('desktop-v2-inventory-10', 'seam', 'Overhanging Sakura-pink tower top cap and top smoke opening.', 'formDetail, interaction', 'component.localFeatures', 'tower-top-cap', evidence.threeQuarter),
  detail('desktop-v2-inventory-11', 'decal', 'Raised Sakura flower emblems on tower front and CRT rear.', 'identity, material zone', 'component.localFeatures', 'tower-front-emblem', evidence.front),
  detail('desktop-v2-inventory-12', 'hole', 'Vertical tower front I/O strip with power button and port cavities.', 'identity, interaction', 'component.localFeatures', 'tower-front-io', evidence.front),
  detail('desktop-v2-inventory-13', 'hole', 'Regular side ventilation grid with real cavity depth.', 'formDetail, repetition', 'component.localFeatures', 'tower-side-vents', evidence.side),
  detail('desktop-v2-inventory-14', 'hole', 'Two rear ventilation fields and service-panel separation.', 'formDetail, repetition', 'component.localFeatures', 'tower-rear-vents', evidence.back),
  detail('desktop-v2-inventory-15', 'hole', 'Rear power inlet and I/O sockets remain distinct cavities.', 'identity, attachment', 'component.localFeatures', 'tower-power-inlet', evidence.back),
  detail('desktop-v2-inventory-16', 'fastener', 'Six-row cream/pink key matrix uses repeated faceted keycaps.', 'repetition, interaction', 'component.localFeatures', 'keyboard-key-system', evidence.front),
  detail('desktop-v2-inventory-17', 'ridge', 'Large pink spacebar is a separate animated part.', 'identity, interaction', 'component.localFeatures', 'keyboard-spacebar', evidence.front),
  detail('desktop-v2-inventory-18', 'contour', 'Faceted arched mouse upper shell over a cream lower shell.', 'silhouette, formDetail', 'component.localFeatures', 'mouse-shell', evidence.threeQuarter),
  detail('desktop-v2-inventory-19', 'seam', 'Mouse button split and enlarged wheel remain independently animated.', 'formDetail, interaction', 'component.localFeatures', 'mouse-button-system', evidence.threeQuarter),
  detail('desktop-v2-inventory-20', 'contour', 'Stable dark-plum outline hierarchy with subtle object-space width variation.', 'silhouette, materialSurface', 'material.localOverrides', 'cream-shell', evidence.threeQuarter),
];

const assessment = assessmentEnvelope.preSpecAssessment;
assessment.objectClass = {
  primaryType: 'retro desktop computer workstation set',
  primaryDomain: 'object',
  formLanguage: ['hard-surface', 'low-poly', 'geometric', 'faceted'],
  structureKind: ['compound object', 'layered shell', 'articulated assembly', 'repeated modules'],
  motionPotential: ['articulated', 'effect-emitter', 'screen-state', 'detachable', 'destructible'],
  materialFamilies: ['matte plastic', 'glass-like screen', 'rubber-like feet', 'dark cavity material'],
  notes: 'Five-piece SAKURA workstation. The v1 runtime contract is dimensional and animation authority; the imagegen sheet is visual form evidence.',
};
assessment.complexity = {
  tier: 'ultra-complex',
  scores: {
    silhouetteComplexity: 3,
    componentCount: 3,
    hierarchyDepth: 3,
    repetitionDensity: 3,
    materialLayerCount: 2,
    localDetailDensity: 3,
    occlusionRisk: 3,
    actionReadinessNeed: 3,
  },
  estimatedCounts: {
    macroComponents: 5,
    mesoComponents: 22,
    microFeatureGroups: 20,
    materialLayers: 9,
    repetitionSystems: 5,
  },
  reasoning: [
    'Five independently readable workstation assemblies must retain consistent scale and spacing.',
    'Deep CRT shell, tower, keyboard and mouse require multi-level hard-surface component trees.',
    'Six key rows, multiple vent grids, screen layers and smoke puffs are repeated systems.',
    'Existing runtime exposes 140 named nodes and many frozen pivots/sockets that must remain compatible.',
  ],
};
assessment.specDepthDecision = {
  requiredDepth: 'ultra-complex',
  minimumComponentLevels: ['macro', 'meso', 'micro'],
  needsRepetitionSystems: true,
  needsMaterialLocalOverrides: true,
  needsMultipleReviewViews: true,
  needsActionReadyHierarchy: true,
  rationale: 'Visual redesign must preserve a deep existing performance rig and multi-part assembly while adding CRT and low-poly identity.',
};
assessment.unknownsToResolveBeforeImplementation = [];
assessment.detailInventory = {
  scanMethod: 'grid-4x4 plus component cross-view review',
  targetMinDetails: 16,
  details,
};
assessment.sourceImage = `${refRoot}/desktop-computer-turnsheet-v2.png`;
assessmentEnvelope.sourceImage = `${refRoot}/desktop-computer-turnsheet-v2.png`;
assessmentEnvelope.qualityContract.qualityBar = 'ultra-complex';
assessmentEnvelope.qualityContract.definitionOfDone = [
  'All five workstation assemblies match the v2 reference silhouette while staying inside the v1 runtime envelope.',
  'The monitor reads as a deep stepped CRT from front, side, back and three-quarter views, never as a thin panel.',
  'All existing animation pivots, sockets, colliders, destruction groups and exact reset behavior remain compatible.',
  'Main, structural and detail outlines use stable unequal widths without temporal jitter or black clumping.',
];
assessmentEnvelope.qualityContract.minimumSpecDepth = {
  macroComponents: 5,
  mesoComponents: 20,
  microFeatureGroups: 16,
  materialLayers: 6,
  repetitionSystems: 4,
  reviewViewpoints: 7,
};

inventoryEnvelope.detailInventory = assessment.detailInventory;

spec.targetName = 'SAKURA Desktop Computer v2';
spec.targetId = 'desktop-computer-v2';
spec.sourceImage = `${refRoot}/desktop-computer-turnsheet-v2.png`;
spec.preSpecAssessment = assessment;
spec.localSpecSearch = assessmentEnvelope.localSpecSearch;
spec.suitability = 'pass';
spec.referenceCamera = {
  solved: true,
  projection: 'orthographic-like turn-sheet',
  fovDegrees: 32,
  aspect: 1,
  orientation: { yaw: 0, pitch: 0, roll: 0 },
  positionHint: [0, 3.0, 12],
  note: 'Four coherent views constrain exterior form. Runtime transforms and bounds come from appliance-rig-v1-contract.json.',
};
spec.qualityContract = {
  ...spec.qualityContract,
  ...assessmentEnvelope.qualityContract,
  qualityBar: 'ultra-complex',
  definitionOfDone: assessmentEnvelope.qualityContract.definitionOfDone,
  minimumSpecDepth: assessmentEnvelope.qualityContract.minimumSpecDepth,
};
spec.qualityContract.featureGroups = [
  {
    id: 'workstation-silhouette',
    name: 'Five-piece workstation silhouette',
    required: true,
    qualityCriteria: ['Monitor, stand, tower, keyboard and mouse preserve v1 footprints and remain fully visible in all four reference views.'],
    evidenceRefs: ['front-full', 'side-full', 'back-full', 'three-quarter-full'],
    failureModes: ['component omitted or hidden', 'assembly footprint expands beyond v1 envelope', 'relative scale or spacing changes animation/cable contact'],
  },
  {
    id: 'deep-crt-system',
    name: 'Deep stepped CRT system',
    required: true,
    qualityCriteria: ['Front shell, chunky bezel, CRT belly, faceted tapered rear bell and rear cap form one attached deep volume.'],
    evidenceRefs: ['front-monitor', 'side-monitor', 'back-monitor', 'three-quarter-full'],
    failureModes: ['monitor reads as a thin flat panel', 'rear bell becomes a box stack', 'screen opening or mount is displaced'],
  },
  {
    id: 'tower-shell-io',
    name: 'Tower shell, smoke outlet and I/O',
    required: true,
    qualityCriteria: ['Tapered shell, overhanging cap, vertical front I/O, rear ports, vents and top smoke outlet retain their frozen rig locations.'],
    evidenceRefs: ['front-full', 'side-full', 'back-tower', 'three-quarter-full'],
    failureModes: ['generic box', 'smoke emits away from top vent', 'front or rear controls move'],
  },
  {
    id: 'input-device-system',
    name: 'Keyboard and mouse input system',
    required: true,
    qualityCriteria: ['Six key rows, six animated keys, large spacebar, arched mouse, buttons and wheel remain independent and collision-free through animation.'],
    evidenceRefs: ['front-full', 'side-full', 'back-full', 'three-quarter-full'],
    failureModes: ['keyboard becomes a texture slab', 'mouse intersects tower/keyboard', 'button or key travel starts from the wrong pivot'],
  },
  {
    id: 'outline-hierarchy',
    name: 'Stable unequal outline hierarchy',
    required: true,
    qualityCriteria: ['Outer silhouette, structural seams and small details use 0.0048/0.0041/0.0033 base widths with stable object-space ±18% variation.'],
    evidenceRefs: ['front-full', 'side-full', 'back-full', 'three-quarter-full'],
    failureModes: ['uniform technical outline', 'temporal jitter', 'small vents or screen UI become black clumps', 'outline changes Box3 beyond tolerance'],
  },
  {
    id: 'computer-powered-state',
    name: 'Frozen-rig powered performance',
    required: true,
    qualityCriteria: ['Boot/UI, keypress, mouse, tower motion, top-vent smoke and exact reset continue under one AppliancePerformanceSystem timeline.'],
    evidenceRefs: ['front-full', 'back-tower', 'three-quarter-full'],
    failureModes: ['fan blades reappear', 'effects originate from old positions', 'screen/key/mouse/smoke residue remains after stop'],
  },
];
spec.qualityContract.visualDeltaChecks = [
  'v1 full-tree bounds, ground height and four fallback edge anchors',
  'five-piece silhouette and component spacing across four views',
  'deep CRT thickness and tapered rear profile',
  'tower smoke outlet, front I/O, rear I/O and vent placement',
  'keyboard key pivots and mouse button/wheel travel',
  'outline width hierarchy and stability under rotation',
  'startup, climax, wind-down and exact reset animation evidence',
];
spec.qualityTargets = {
  targetFidelity: 0.84,
  mustMatch: [
    'five-piece v2 workstation silhouette inside the v1 envelope',
    'deep stepped CRT front shell, belly, tapered rear bell and service cap',
    'tower cap, smoke outlet, front/rear I/O and ventilation fields',
    'wedge keyboard with six animated keys and large spacebar',
    'faceted mouse with nested button and wheel pivots',
    'stable unequal dark-plum outline hierarchy',
    'single-owner powered animation and exact reset',
  ],
  niceToHave: ['reduced triangle count versus v1', 'stronger broad low-poly facet readability'],
  fpsTarget: 60,
  reviewViewpoints: ['front', 'side', 'back', 'three-quarter', 'top', 'three-quarter-powered', 'exploded'],
};
spec.selfCorrectLoop.visualAcceptance.threshold = 0.8;
spec.selfCorrectLoop.visualAcceptance.featureReviewPolicy.criticalDefaultThreshold = 0.82;
spec.selfCorrectLoop.visualAcceptance.featureReviewPolicy.importantAverageThreshold = 0.75;

spec.featureReviewTargets = [
  ['workstation-silhouette', 'Five-piece workstation silhouette', ['blockout', 'form-refinement'], ['monitor-assembly', 'monitor-stand-assembly', 'tower-assembly', 'keyboard-assembly', 'mouse-assembly'], ['front-full', 'side-full', 'back-full', 'three-quarter-full']],
  ['deep-crt-system', 'Deep stepped CRT system', ['structural-pass', 'form-refinement'], ['monitor-shell', 'monitor-bezel', 'monitor-crt-belly', 'monitor-crt-rear-bell', 'monitor-crt-rear-cap', 'monitor-crt-vent-system'], ['front-monitor', 'side-monitor', 'back-monitor']],
  ['tower-shell-io', 'Tower shell smoke outlet and I O', ['structural-pass', 'form-refinement', 'material-pass'], ['tower-shell', 'tower-top-cap', 'tower-front-io', 'tower-rear-panel', 'tower-side-vents', 'tower-rear-vents', 'tower-power-inlet'], ['front-full', 'side-full', 'back-tower']],
  ['input-device-system', 'Keyboard and mouse input devices', ['structural-pass', 'form-refinement', 'interaction-pass'], ['keyboard-shell', 'keyboard-key-system', 'keyboard-spacebar', 'mouse-shell', 'mouse-top-shell', 'mouse-button-system', 'mouse-wheel'], ['front-full', 'side-full', 'three-quarter-full']],
  ['outline-hierarchy', 'Stable unequal outline hierarchy', ['material-pass', 'lighting-pass', 'optimization-pass'], ['monitor-assembly', 'tower-assembly', 'keyboard-assembly', 'mouse-assembly'], ['front-full', 'side-full', 'back-full', 'three-quarter-full']],
  ['computer-powered-state', 'Frozen rig powered action and exact reset', ['interaction-pass'], ['screen-panel', 'screen-gui-layer', 'tower-front-controls', 'keyboard-key-system', 'mouse-wheel', 'computer-powered-state'], ['front-full', 'back-tower', 'three-quarter-full']],
].map(([id, name, passIds, componentRefs, evidenceRefs]) => ({
  id,
  name,
  tier: 'critical',
  passIds,
  minimumScore: 0.82,
  mustPass: true,
  componentRefs,
  evidenceRefs,
}));

spec.viewEvidence = [
  ['front-full', 'front', evidence.front, ['complete five-piece layout', 'chunky CRT bezel', 'tower front I/O', 'six-row keyboard', 'mouse top'], 0.98],
  ['side-full', 'side', evidence.side, ['deep CRT belly and tapered bell', 'short stand', 'tower depth', 'keyboard wedge', 'mouse arch'], 0.98],
  ['back-full', 'back', evidence.back, ['CRT rear cap and mount', 'tower rear vents/I/O', 'keyboard and mouse visibility'], 0.98],
  ['three-quarter-full', 'three-quarter', evidence.threeQuarter, ['low-poly facets', 'five-piece spacing', 'tower/monitor depth', 'outline hierarchy'], 0.98],
  ['front-monitor', 'front', evidence.front, ['stepped bezel', 'recessed screen', 'status dot'], 0.99],
  ['side-monitor', 'side', evidence.side, ['front shell', 'CRT belly', 'rear bell', 'service cap'], 0.99],
  ['back-monitor', 'back', evidence.back, ['rear cap', 'mount plate', 'emblem', 'top/side vents'], 0.98],
  ['back-tower', 'back', evidence.back, ['rear vent arrays', 'I/O sockets', 'power inlet', 'feet'], 0.98],
].map(([id, view, imagePath, observations, confidence]) => ({
  id,
  view,
  imagePath,
  imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' },
  observations,
  confidence,
}));

const componentMap = new Map(spec.componentTree.map((component) => [component.id, component]));
const monitorShell = componentMap.get('monitor-shell');
monitorShell.name = 'Chunky CRT Front Shell';
monitorShell.dimensions.depth = 0.62;
monitorShell.geometryDescriptor.topologyIntent = 'faceted hard-surface front shell with broad stepped chamfers';
monitorShell.localFeatures = ['desktop-detail-01', 'desktop-v2-front-shell-facets'];
monitorShell.details.push({ id: 'desktop-v2-front-shell-facets', kind: 'bevel', evidenceRefs: ['front-monitor', 'side-monitor'] });

const cloneComponent = (templateId, overrides) => {
  const clone = structuredClone(componentMap.get(templateId));
  Object.assign(clone, overrides);
  clone.geometryDescriptor = { ...clone.geometryDescriptor, ...(overrides.geometryDescriptor ?? {}) };
  clone.dimensions = { ...clone.dimensions, ...(overrides.dimensions ?? {}) };
  clone.transform = { ...clone.transform, ...(overrides.transform ?? {}) };
  clone.actionProfile = { animationRole: 'static-part' };
  clone.localFeatures = [overrides.featureId];
  clone.details = [{ id: overrides.featureId, kind: overrides.featureKind, evidenceRefs: overrides.evidenceRefs }];
  clone.evidenceRefs = overrides.evidenceRefs;
  clone.attachment = {
    parentId: clone.parent,
    parentSocket: `${clone.parent}-socket`,
    localStart: [...clone.transform.position],
    localEnd: [clone.transform.position[0], clone.transform.position[1], clone.transform.position[2] + 0.03],
    contactType: 'overlap',
    embedDepth: 0.04,
    overlap: 0.05,
    gapTolerance: 0.01,
    evidenceRefs: overrides.evidenceRefs,
  };
  delete clone.featureId;
  delete clone.featureKind;
  return clone;
};

const v2Components = [
  cloneComponent('monitor-shell', {
    id: 'monitor-crt-belly',
    name: 'Faceted CRT Rear Belly',
    level: 'meso',
    parent: 'monitor-shell',
    primitive: 'extrude',
    topologyClass: 'continuous-sculpt',
    topologyRationale: 'A single swelling bilateral CRT volume that varies continuously in depth.',
    geometryDescriptor: { topologyIntent: '8–10 facet rounded loft with controlled side swell' },
    dimensions: { width: 5.15, height: 3.12, depth: 1.58, units: 'world', confidence: 0.98 },
    transform: { position: [0, 0, -0.91], rotation: [0, 0, 0], scale: [1, 1, 1] },
    featureId: 'desktop-v2-detail-17',
    featureKind: 'contour',
    evidenceRefs: ['side-monitor', 'back-monitor', 'three-quarter-full'],
  }),
  cloneComponent('monitor-shell', {
    id: 'monitor-crt-rear-bell',
    name: 'Tapered Faceted CRT Rear Bell',
    level: 'meso',
    parent: 'monitor-shell',
    primitive: 'extrude',
    topologyClass: 'continuous-sculpt',
    topologyRationale: 'Tapered deep shell with a varying bilateral cross-section, not a box stack.',
    geometryDescriptor: { topologyIntent: '8–10 facet tapered loft from CRT belly to service cap' },
    dimensions: { width: 4.38, height: 2.66, depth: 1.42, units: 'world', confidence: 0.98 },
    transform: { position: [0, 0, -2.18], rotation: [0, 0, 0], scale: [1, 1, 1] },
    featureId: 'desktop-v2-detail-18',
    featureKind: 'contour',
    evidenceRefs: ['side-monitor', 'back-monitor', 'three-quarter-full'],
  }),
  cloneComponent('monitor-mount-plate', {
    id: 'monitor-crt-rear-cap',
    name: 'Pink CRT Rear Service Cap',
    level: 'micro',
    parent: 'monitor-shell',
    primitive: 'box',
    topologyClass: 'assembled-solid',
    topologyRationale: 'Discrete shallow service cover nested into the rear bell.',
    geometryDescriptor: { topologyIntent: 'faceted shallow service plate with a narrow seam' },
    dimensions: { width: 3.64, height: 2.14, depth: 0.34, units: 'world', confidence: 0.98 },
    transform: { position: [0, 0, -3.02], rotation: [0, 0, 0], scale: [1, 1, 1] },
    featureId: 'desktop-v2-detail-19',
    featureKind: 'seam',
    evidenceRefs: ['back-monitor', 'side-monitor'],
  }),
  cloneComponent('tower-side-vents', {
    id: 'monitor-crt-vent-system',
    name: 'CRT Top And Side Vent System',
    level: 'micro',
    parent: 'monitor-shell',
    primitive: 'instanced-cluster',
    topologyClass: 'surface-relief',
    topologyRationale: 'Repeated dark ventilation openings that alter local relief but not the primary CRT mass.',
    geometryDescriptor: { topologyIntent: 'instanced low-segment vent slots embedded in the CRT shell' },
    dimensions: { width: 3.2, height: 2.9, depth: 0.7, units: 'world', confidence: 0.96 },
    transform: { position: [0, 0, -1.45], rotation: [0, 0, 0], scale: [1, 1, 1] },
    featureId: 'desktop-v2-detail-20',
    featureKind: 'hole',
    evidenceRefs: ['side-monitor', 'back-monitor'],
  }),
];
spec.componentTree = spec.componentTree.filter((component) => !v2Components.some((candidate) => candidate.id === component.id));
const shellIndex = spec.componentTree.findIndex((component) => component.id === 'monitor-shell');
spec.componentTree.splice(shellIndex + 1, 0, ...v2Components);

if (!spec.repetitionSystems.some((system) => system.id === 'monitor-crt-vents')) {
  spec.repetitionSystems.push({
    id: 'monitor-crt-vents',
    componentRef: 'monitor-crt-vent-system',
    mode: 'linear-mirrored',
    count: 21,
    distribution: '9 top slots plus 6 mirrored slots per side, aligned to the CRT belly and frozen screen tilt pivot',
    variation: { scale: 0, rotation: 0.025, color: 0 },
    evidenceRefs: ['side-monitor', 'back-monitor'],
  });
}

spec.animationAnchors = [
  'desktop-computer-monitor-assembly-pivot',
  'desktop-computer-monitor-stand-pivot',
  'desktop-computer-monitor-column-pivot',
  'desktop-computer-screen-tilt-pivot',
  'desktop-computer-screen-state-pivot',
  'desktop-computer-power-button-pivot',
  'desktop-computer-tower-assembly-pivot',
  'desktop-computer-keyboard-assembly-pivot',
  'desktop-computer-keybed-pivot',
  ...Array.from({ length: 6 }, (_, index) => `desktop-computer-active-key-${index + 1}-pivot`),
  'desktop-computer-spacebar-pivot',
  'desktop-computer-mouse-assembly-pivot',
  'desktop-computer-mouse-button-pivot',
  'desktop-computer-mouse-wheel-pivot',
  'desktop-computer-overheat-smoke-pivot',
];
spec.assumptions = [
  'The v1 full-tree bounds, root placement and all published runtime node/socket transforms are immutable compatibility evidence.',
  'Hidden electronics are excluded; no fan blades or generic cooling rotor are added.',
  'Top-vent smoke remains the only tower overheat emission and stays at the frozen socket.',
  'The imagegen sheet guides the visible form language; it does not override v1 assembly transforms or collision ownership.',
  'No runtime image texture is introduced; the final game model remains pure procedural Three.js geometry and Toon materials.',
];
spec.risks = [
  'The model has no four edge connection sockets, so any geometry or hidden smoke bounds change can move catalog scale and cable anchors.',
  'Thicker outlines can change Box3 and must be excluded from compatibility bounds or exactly compensated.',
  'The existing visible model is already about 92k triangles; v2 must reduce or stay below 1.35× the measured v1 baseline.',
  'The old thin-monitor references conflict with the current deep CRT runtime; only current v1 renders and the admitted v2 sheet are authoritative.',
  'Screen, key, mouse and smoke effects can appear detached if frozen pivot parentage changes.',
];
spec.performanceBudget = {
  qualityPriority: 'reference-fidelity real-time browser within measured v1 envelope',
  targetTriangles: 92064,
  maxTriangles: 124286,
  maxDrawCalls: 113,
  textureSize: 0,
  fpsTarget: 60,
  optimizationPolicy: 'Reuse keycap and vent geometries, keep repeated details instanced, avoid extra outline meshes per micro part, and allocate nothing inside update().',
};

spec.visualEvidence = [];
spec.reviewHistory = [];
spec.tier1Results = [];
spec.pbrExtractionHistory = [];
spec.sculptPipeline = {
  passGateMode: 'locked-sequential',
  passOrder: ['blockout', 'structural-pass', 'form-refinement', 'material-pass', 'lighting-pass', 'interaction-pass', 'optimization-pass'],
  currentPass: 'blockout',
  completedPasses: [],
  lastCompletedPass: '',
  blockedReason: 'blockout requires a browser screenshot and evidence-backed review before structural-pass unlocks',
  nextRequiredEvidence: [
    'blockout browser render screenshot',
    'side-by-side v2 reference/render comparison sheet',
    'AI vision score >= 0.80 with layer scores',
    'all selected critical feature scores >= 0.82',
    'reviewHistory blockout entry with action=continue',
  ],
};

await Promise.all([
  writeFile(specPath, `${JSON.stringify(spec, null, 2)}\n`),
  writeFile(assessmentPath, `${JSON.stringify(assessmentEnvelope, null, 2)}\n`),
  writeFile(inventoryPath, `${JSON.stringify(inventoryEnvelope, null, 2)}\n`),
]);

console.log(JSON.stringify({
  specPath,
  componentCount: spec.componentTree.length,
  detailCount: details.length,
  repetitionSystems: spec.repetitionSystems.length,
  currentPass: spec.sculptPipeline.currentPass,
}, null, 2));

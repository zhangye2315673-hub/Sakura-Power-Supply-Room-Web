#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const sourceSpecPath = path.join(root, 'artifacts', 'img2threejs', 'fan', 'fan-sculpt-spec.json');
const sourceAssessmentPath = path.join(root, 'artifacts', 'img2threejs', 'fan', 'pre-spec-assessment.json');
const outRoot = path.join(root, 'docs', 'sculpt-specs-v2', 'fan');
await mkdir(outRoot, { recursive: true });
const [spec, assessmentEnvelope] = await Promise.all([
  readFile(sourceSpecPath, 'utf8').then(JSON.parse),
  readFile(sourceAssessmentPath, 'utf8').then(JSON.parse),
]);

const refRoot = 'references/intake-v2/fan/views';
const views = {
  front: `${refRoot}/front.png`,
  side: `${refRoot}/side.png`,
  back: `${refRoot}/back.png`,
  threeQuarter: `${refRoot}/three-quarter.png`,
};
const evidenceIds = ['front-view', 'side-view', 'back-view', 'three-quarter-view'];
spec.targetName = 'SAKURA Fan v2';
spec.targetId = 'fan-v2';
spec.sourceImage = views.front;
spec.suitability = 'conditional';
spec.scores = { object_isolation: 3, silhouette_readability: 3, depth_inference: 3, primitive_decomposition: 3, material_procedurality: 3, occlusion_risk: 2, interaction_fit: 3 };
spec.coordinateFrame = { front: '+Z faces the front guard', up: '+Y', scaleReference: 'archived v1 full-tree bounds 1.30999994 x 1.8026665 x 0.99152834' };
spec.silhouette = {
  boundingShape: 'large circular guard over short tapered support and low trapezoidal base',
  aspectRatios: [1.30999994 / 1.8026665, 0.99152834 / 1.8026665],
  symmetry: 'radial head symmetry over bilateral base symmetry',
  dominantCurves: ['0.62 outer guard ring', 'five swept blades', 'tapered motor barrel'],
  negativeSpaces: ['guard wire openings', 'blade-to-ring clearance', 'support-to-head gap'],
  landmarks: ['head center Y=0.25', 'rotor Z=0.02', 'dial Y=-0.675 Z=0.305', 'ground Y=-0.89175808'],
};
spec.viewEvidence = [
  ['front-view', 'front', views.front, ['five blades', 'three concentric rings', 'eight spokes', 'front medallion', 'dial'], 0.99],
  ['side-view', 'side', views.side, ['guard depth', 'motor barrel', 'tilt hinge', 'support offset'], 0.98],
  ['back-view', 'back', views.back, ['rear guard', 'five vents', 'motor cap', 'support attachment'], 0.98],
  ['three-quarter-view', 'three-quarter', views.threeQuarter, ['cage bridges', 'faceted base', 'outline hierarchy', 'head/base proportion'], 0.99],
].map(([id, view, imagePath, observations, confidence]) => ({ id, view, imagePath, imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations, confidence }));

const featureData = [
  ['detail-01', 'contour', 'guard-assembly', 'Circular head stays within the archived 0.655 half-width.'],
  ['detail-02', 'contour', 'front-outer-ring', 'Front outer ring is the primary graphic silhouette.'],
  ['detail-03', 'contour', 'rear-outer-ring', 'Rear ring is depth-separated and connected by four bridges.'],
  ['detail-04', 'linework', 'concentric-rings', 'Three inner rings remain countable on each guard face.'],
  ['detail-05', 'linework', 'radial-spokes', 'Eight low-sided spokes remain countable on each guard face.'],
  ['detail-06', 'contour', 'rotor-assembly', 'Five broad swept blades preserve radial clearance.'],
  ['detail-07', 'contour', 'front-medallion', 'Cream center cap carries five restrained Sakura petals.'],
  ['detail-08', 'contour', 'motor-housing', 'Tapered fourteen-sided motor barrel reads in side view.'],
  ['detail-09', 'linework', 'rear-vents', 'Five horizontal rear vents remain aligned.'],
  ['detail-10', 'contour', 'motor-shaft', 'Visible central shaft bridges motor and rotor.'],
  ['detail-11', 'fastener', 'tilt-hinge', 'Large lateral hinge cap makes the tilt axis readable.'],
  ['detail-12', 'contour', 'support-column', 'Tapered support remains fixed while the head yaws.'],
  ['detail-13', 'contour', 'base-shell', 'Beveled trapezoidal base retains the v1 ground and width.'],
  ['detail-14', 'seam', 'base-rail', 'Pink lower rail and dark panel seam remain separated.'],
  ['detail-15', 'ridge', 'speed-dial', 'Front dial retains frozen center and index.'],
  ['detail-16', 'emissive', 'status-indicator', 'Small indicator remains above the dial.'],
  ['detail-17', 'contour', 'air-emitter', 'Air emitter stays on the front guard.'],
  ['detail-18', 'contour', 'scene-edge-sockets', 'Four cable sockets remain root children at archived positions.'],
  ['detail-19', 'linework', 'outline-hierarchy', 'Ink widths are 0.0048, 0.0041 and 0.0033 with stable 0.18 variation.'],
  ['detail-20', 'linework', 'toon-palette', 'Cream, pink and plum zones use two-to-three-band Toon response.'],
];
const details = featureData.map(([id, kind, ref, description], index) => ({
  id, kind, description,
  region: { x: (index % 4) * 0.25, y: Math.floor(index / 4) * 0.2, width: 0.25, height: 0.2, units: 'normalized' },
  scale: index < 4 ? 'macro' : index < 17 ? 'meso' : 'micro',
  affects: ['emissive', 'material'].includes(kind) || ref === 'outline-hierarchy' ? 'materialSurface' : 'geometry, materialSurface',
  mapsTo: ref === 'outline-hierarchy' || ref === 'toon-palette' ? { type: 'material.localOverrides', ref } : { type: 'component.localFeatures', ref },
  evidenceRef: index === 8 ? views.back : views.threeQuarter,
  confidence: 0.96,
}));

spec.preSpecAssessment = {
  ...spec.preSpecAssessment,
  objectClass: { primaryType: 'faceted articulated tabletop axial fan', primaryDomain: 'object', formLanguage: ['hard-surface', 'low-poly', 'faceted', 'retro game appliance'], structureKind: ['compound object', 'layered radial guard', 'articulated assembly', 'repeated modules'], motionPotential: ['rotor spin', 'head yaw', 'head tilt', 'dial turn', 'air emission'], materialFamilies: ['molded plastic', 'guard structure', 'emissive indicator'], notes: 'Archived runtime contract owns dimensions and animation anchors; admitted images own observed form.' },
  complexity: { tier: 'complex', scores: { silhouetteComplexity: 2, componentCount: 3, hierarchyDepth: 3, repetitionDensity: 3, materialLayerCount: 2, localDetailDensity: 3, occlusionRisk: 2, actionReadinessNeed: 3 }, estimatedCounts: { macroComponents: 6, mesoComponents: 14, microFeatureGroups: details.length, materialLayers: 6, repetitionSystems: 5 }, reasoning: ['Nested yaw, tilt and rotor pivots require a frozen action-ready hierarchy.', 'Two guard faces, rings, spokes, bridges, blades and vents create multiple repeated systems.'] },
  specDepthDecision: { requiredDepth: 'complex', minimumComponentLevels: ['macro', 'meso', 'micro'], needsRepetitionSystems: true, needsMaterialLocalOverrides: true, needsMultipleReviewViews: true, needsActionReadyHierarchy: true, rationale: 'The visual replacement touches articulated and repeated geometry with strict bounds and sockets.' },
  unknownsToResolveBeforeImplementation: [],
  detailInventory: { scanMethod: 'four-view component review', targetMinDetails: 20, details },
  sourceImage: spec.sourceImage,
};
spec.localSpecSearch = assessmentEnvelope.localSpecSearch;

const rootTemplate = structuredClone(spec.componentTree[0]);
function component(id, name, level, role, parent, material, primitive, localFeatures, options = {}) {
  const value = structuredClone(rootTemplate);
  Object.assign(value, { id, name, level, role, parent, material, primitive, materialLayers: [material], importance: options.importance ?? 0.9, confidence: 0.96, topologyClass: options.topologyClass ?? 'assembled-solid', topologyRationale: options.topologyRationale ?? 'Rigid low-poly assembly with countable broad planes, stable overlap and restrained chamfers.', localFeatures, evidenceRefs: evidenceIds, fidelityTier: options.fidelityTier ?? 'form-refinement' });
  value.dimensions = options.dimensions ?? { width: 1, height: 1, depth: 1, units: 'relative', confidence: 0.94 };
  value.transform = { position: options.position ?? [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] };
  value.attachment = parent ? { parentSocket: `${parent}-socket`, localStart: [0, 0, 0], localEnd: [0, 0.04, 0], contactType: options.contactType ?? 'overlap', overlap: 0.025, gapTolerance: 0.01, evidenceRefs: evidenceIds } : null;
  value.actionProfile.animationRole = options.animationRole ?? (parent ? 'static-part' : 'root');
  value.actionProfile.pivot = { mode: options.pivotMode ?? 'center', localPosition: options.pivot ?? [0, 0, 0], axis: options.axis ?? [0, 1, 0], confidence: 0.99 };
  value.actionProfile.collider = options.collider ?? null;
  value.actionProfile.destruction.fractureGroup = id;
  value.details = localFeatures.map((feature) => ({ id: feature, kind: 'construction', evidenceRefs: evidenceIds }));
  value.surfaceDetail = { macroRoughness: 0.1, microRoughness: 0.035, bumpAmplitude: 0.004, normalPattern: 'stable molded response', displacementPattern: 'none', occlusionPattern: 'ring overlaps and panel seams', edgeWearPattern: 'restrained chamfer highlight', notes: 'Broad planes dominate.' };
  value.colorMaterialRecipe = { dominantAlbedo: 'rgba(238, 232, 220, 1)', secondaryAlbedo: 'rgba(232, 167, 183, 1)', materialClass: 'plastic', materialClassConfidence: 0.94 };
  return value;
}
spec.componentTree = [
  component('root', 'Fan Runtime Root', 'macro', 'container', null, 'cream-shell', 'box', ['detail-01'], { importance: 1 }),
  component('base-assembly', 'Faceted Base Assembly', 'macro', 'body', 'root', 'cream-shell', 'extrude', ['detail-13', 'detail-14'], { collider: { type: 'box', offset: [0, -0.72, 0], scale: [1.04, 0.34, 0.68], isTrigger: false } }),
  component('support-assembly', 'Fixed Support Assembly', 'macro', 'support', 'root', 'cream-shell', 'extrude', ['detail-12']),
  component('head-assembly', 'Yaw and Tilt Head Assembly', 'macro', 'head', 'root', 'cream-shell', 'cylinder', ['detail-01', 'detail-11'], { animationRole: 'articulated-head', pivotMode: 'custom', pivot: [0, 0.25, -0.33] }),
  component('guard-assembly', 'Depth-separated Guard Cage', 'macro', 'guard', 'head-assembly', 'guard-cream', 'torus', ['detail-02', 'detail-03', 'detail-04', 'detail-05']),
  component('rotor-assembly', 'Five-blade Rotor', 'macro', 'rotor', 'head-assembly', 'sakura-accent', 'instanced-cluster', ['detail-06', 'detail-10'], { animationRole: 'rotor', pivot: [0, 0, 0.02], axis: [0, 0, 1] }),
  component('motor-housing', 'Tapered Rear Motor', 'meso', 'motor', 'head-assembly', 'cream-shell', 'cylinder', ['detail-08', 'detail-09']),
  component('front-outer-ring', 'Front Outer Ring', 'meso', 'guard', 'guard-assembly', 'guard-cream', 'torus', ['detail-02']),
  component('rear-outer-ring', 'Rear Outer Ring', 'meso', 'guard', 'guard-assembly', 'guard-cream', 'torus', ['detail-03']),
  component('concentric-rings', 'Six Concentric Rings', 'meso', 'linework', 'guard-assembly', 'guard-cream', 'instanced-cluster', ['detail-04']),
  component('radial-spokes', 'Sixteen Radial Spokes', 'meso', 'linework', 'guard-assembly', 'guard-cream', 'instanced-cluster', ['detail-05']),
  component('cage-bridges', 'Four Cage Bridges', 'meso', 'connector', 'guard-assembly', 'guard-cream', 'instanced-cluster', []),
  component('front-medallion', 'Sakura Front Medallion', 'meso', 'badge', 'guard-assembly', 'cream-shell', 'cylinder', ['detail-07']),
  component('rear-vents', 'Five Rear Vents', 'micro', 'vent', 'motor-housing', 'plum-detail', 'instanced-cluster', ['detail-09']),
  component('motor-shaft', 'Visible Motor Shaft', 'meso', 'shaft', 'motor-housing', 'plum-detail', 'cylinder', ['detail-10']),
  component('tilt-hinge', 'Tilt Hinge and Cap', 'meso', 'joint', 'head-assembly', 'sakura-accent', 'cylinder', ['detail-11'], { animationRole: 'hinge', pivot: [0, 0, 0.33], axis: [1, 0, 0] }),
  component('support-column', 'Tapered Fixed Column', 'meso', 'support', 'support-assembly', 'cream-shell', 'extrude', ['detail-12']),
  component('base-shell', 'Beveled Trapezoidal Base', 'meso', 'shell', 'base-assembly', 'cream-shell', 'extrude', ['detail-13']),
  component('base-rail', 'Pink Base Rail', 'meso', 'trim', 'base-assembly', 'sakura-accent', 'extrude', ['detail-14']),
  component('speed-dial', 'Indexed Speed Dial', 'meso', 'control', 'base-assembly', 'sakura-accent', 'cylinder', ['detail-15'], { animationRole: 'rotary-control', pivot: [0, -0.675, 0.305], axis: [0, 0, 1] }),
  component('status-indicator', 'Mint Status Dot', 'micro', 'indicator', 'base-assembly', 'mint-emissive', 'sphere', ['detail-16']),
  component('air-emitter', 'Front Air Emitter', 'micro', 'socket', 'guard-assembly', 'plum-detail', 'sphere', ['detail-17'], { animationRole: 'effect-emitter' }),
  component('scene-edge-sockets', 'Frozen Cable Sockets', 'micro', 'socket', 'root', 'plum-detail', 'instanced-cluster', ['detail-18'], { animationRole: 'attachment-sockets' }),
];

const materialTemplate = structuredClone(spec.materials[0]);
function material(id, name, baseColor, palette, roughness, localOverrides = []) {
  const value = structuredClone(materialTemplate);
  Object.assign(value, { id, name, type: 'toon', shaderModel: 'MeshToonMaterial plus stable object-space outline', baseColor, color: baseColor });
  value.albedo = { dominant: baseColor, secondary: palette, samplingNotes: 'Observed from admitted SAKURA renders.' };
  value.roughness = { base: roughness, variation: 0.05, map: 'procedural-independent', localResponse: 'broader response on shell planes and darker contact seams' };
  value.normal = { pattern: 'independent molded micro-normal', strength: 0.04, scale: 32, space: 'tangent' };
  value.bump = { pattern: 'restrained molded micrograin', amplitude: 0.004, scale: 64 };
  value.localOverrides = localOverrides;
  const pbrRoot = `docs/sculpt-specs-v2/fan/pbr/${id}`;
  value.referencePbr = { usable: true, confidence: 0.8, estimatedFidelity: 0.8, sourceImage: views.threeQuarter, maps: { albedo: { path: `${pbrRoot}/${id}_albedo.png` }, roughness: { path: `${pbrRoot}/${id}_roughness.png` }, height: { path: `${pbrRoot}/${id}_height.png` }, normal: { path: `${pbrRoot}/${id}_normal.png` }, ao: { path: `${pbrRoot}/${id}_ao.png` } }, limitation: 'Channels are stylized screenshot evidence rather than measured physical material data; runtime remains Toon.' };
  return value;
}
spec.materials = [
  material('cream-shell', 'Warm Cream Shell', '#EEE8DC', ['#FAF3E7', '#CFC4C9'], 0.52),
  material('guard-cream', 'Guard Cream', '#F1EADF', ['#FFF5E7', '#D3C8CC'], 0.5),
  material('sakura-accent', 'Sakura Accent', '#E8A7B7', ['#F2C1CD', '#A76F88'], 0.48),
  material('plum-detail', 'Dark Plum Detail', '#5D5967', ['#766F7C', '#3E3A47'], 0.66),
  material('mint-emissive', 'Mint Indicator', '#BCE9DD', ['#D8F6ED', '#6F9E97'], 0.42),
  material('outline-ink', 'Unequal Plum Ink', '#3B3544', ['#4D4558'], 0.7, [{ id: 'outline-hierarchy', region: 'opaque fan geometry', response: 'main 0.0048, structure 0.0041, detail 0.0033 with stable object-space variation 0.18', evidenceRefs: evidenceIds }, { id: 'toon-palette', region: 'all opaque surfaces', response: 'two-to-three-band cream pink and plum Toon separation', evidenceRefs: evidenceIds }]),
];
spec.repetitionSystems = [
  { id: 'guard-concentric-rings', componentRef: 'concentric-rings', count: 6, realization: 'geometry', buildsGeometry: true, geometry: { primitive: 'low-segment-torus' }, distribution: 'three radii on each of two guard faces' },
  { id: 'guard-radial-spokes', componentRef: 'radial-spokes', count: 16, realization: 'geometry', buildsGeometry: true, geometry: { primitive: 'six-sided-cylinder' }, distribution: 'eight equal-angle spokes on each guard face' },
  { id: 'guard-cage-bridges', componentRef: 'cage-bridges', count: 4, realization: 'geometry', buildsGeometry: true, geometry: { primitive: 'six-sided-cylinder' }, distribution: 'four diagonal outer-cage bridges' },
  { id: 'rotor-blades', componentRef: 'rotor-assembly', count: 5, realization: 'geometry', buildsGeometry: true, geometry: { primitive: 'beveled-extruded-profile' }, distribution: 'five equal-angle swept blades' },
  { id: 'rear-vents', componentRef: 'rear-vents', count: 5, realization: 'geometry', buildsGeometry: true, geometry: { primitive: 'faceted-slot' }, distribution: 'five horizontal slots' },
];
spec.qualityTargets = { targetFidelity: 0.82, mustMatch: ['archived bounds and ground', 'five-blade rotor and dual guard', 'frozen yaw tilt rotor and dial pivots', 'front air socket and four cable anchors', 'stable unequal outlines'], niceToHave: ['stronger cage depth readability'], fpsTarget: 60, reviewViewpoints: ['front', 'side', 'back', 'three-quarter', 'startup', 'climax', 'wind-down'] };
spec.qualityContract = {
  ...spec.qualityContract,
  qualityBar: 'complex',
  definitionOfDone: ['Four static views preserve fan identity inside the archived Box3.', 'All frozen nodes and sockets keep parent paths and transforms within 1e-4.', 'Five blades, six inner rings, sixteen spokes, four bridges and five vents remain countable.', 'Startup, climax, wind-down and reset retain the one-owner fan performance timeline.', 'Three stable outline widths remain readable without temporal shimmer.'],
  minimumSpecDepth: { macroComponents: 6, mesoComponents: 12, microFeatureGroups: 20, materialLayers: 5, repetitionSystems: 5, reviewViewpoints: 4 },
  featureGroups: [
    { id: 'fan-silhouette', name: 'Circular head support and base silhouette', required: true, qualityCriteria: ['Full tree stays inside the archived bounds and ground.'], evidenceRefs: evidenceIds, failureModes: ['head growth', 'soft inflated base'] },
    { id: 'guard-rotor-system', name: 'Dual guard and five-blade rotor', required: true, qualityCriteria: ['All repeated counts and blade clearance remain intact.'], evidenceRefs: ['front-view', 'side-view'], failureModes: ['blade clipping', 'fused guards'] },
    { id: 'motor-hinge-support', name: 'Motor hinge and fixed support', required: true, qualityCriteria: ['Head-only yaw keeps the column stationary and attached.'], evidenceRefs: ['side-view', 'back-view'], failureModes: ['floating hinge', 'moving support'] },
    { id: 'controls-anchors', name: 'Dial indicator emitters and cable sockets', required: true, qualityCriteria: ['Frozen transforms remain within 1e-4.'], evidenceRefs: evidenceIds, failureModes: ['moved dial', 'old-position emission'] },
    { id: 'outline-hierarchy', name: 'Stable unequal SAKURA ink', required: true, qualityCriteria: ['All three widths and 0.18 variation remain stable.'], evidenceRefs: ['three-quarter-view'], failureModes: ['uniform outline', 'temporal shimmer'] },
  ],
  visualDeltaChecks: ['full-tree bounds delta', 'guard depth and blade clearance delta', 'pivot/socket transform delta', 'outline tier delta'],
};
spec.featureReviewTargets = [
  ['fan-silhouette', 'Circular head support and base', 'blockout', ['guard-assembly', 'support-assembly', 'base-assembly']],
  ['guard-rotor-system', 'Dual guard and five-blade rotor', 'structural-pass', ['guard-assembly', 'rotor-assembly']],
  ['motor-hinge-support', 'Motor hinge and fixed support', 'form-refinement', ['motor-housing', 'tilt-hinge', 'support-column']],
  ['outline-hierarchy', 'Stable unequal outline response', 'material-pass', ['guard-assembly', 'base-shell']],
  ['controls-anchors', 'Frozen controls emitters and cable sockets', 'interaction-pass', ['speed-dial', 'air-emitter', 'scene-edge-sockets']],
].map(([id, name, passId, componentRefs]) => ({ id, name, tier: 'critical', passIds: [passId], minimumScore: 0.82, mustPass: true, componentRefs, evidenceRefs: evidenceIds }));
spec.buildPasses = spec.buildPasses.filter((pass) => pass.id !== 'surface-pass');
const passRefs = { blockout: ['guard-assembly', 'support-assembly', 'base-assembly'], 'structural-pass': ['guard-assembly', 'rotor-assembly', 'motor-housing'], 'form-refinement': ['tilt-hinge', 'support-column', 'speed-dial'], 'material-pass': ['guard-assembly', 'base-assembly'], 'lighting-pass': ['root'], 'interaction-pass': ['rotor-assembly', 'air-emitter', 'scene-edge-sockets'], 'optimization-pass': ['root'] };
for (const pass of spec.buildPasses) pass.componentRefs = passRefs[pass.id] ?? ['root'];
spec.selfCorrectLoop.visualAcceptance.threshold = 0.8;
spec.visualEvidence = [];
spec.reviewHistory = [];
spec.tier1Results = [];
spec.sculptPipeline = { passGateMode: 'locked-sequential', passOrder: spec.buildPasses.map((pass) => pass.id), currentPass: 'blockout', completedPasses: [], lastCompletedPass: '', blockedReason: 'blockout requires deterministic screenshot comparison', nextRequiredEvidence: [] };
spec.performanceBudget = { qualityPriority: 'reference-fidelity real-time browser', targetTriangles: 9788, maxTriangles: 13213, maxDrawCalls: 92, textureSize: 1024, fpsTarget: 60, optimizationPolicy: 'Use 6-16 sided profiles and shared repeated geometry while preserving every frozen node.' };
spec.proceduralStrategy = ['Freeze bounds pivots sockets and cable anchors.', 'Build dual low-poly guard faces around the isolated rotor.', 'Keep fixed support outside the yaw pivot.', 'Apply stable outline tiers to opaque geometry only.', 'Review four static and three animation stages.'];
spec.lightingFromPhoto = ['warm upper-left key light with broad soft shadow', 'cool right-side lavender fill light', 'restrained pink rear rim light', 'neutral exposure with ACES tone mapping', 'pale lavender background and soft floor contact shadow'];
spec.animationAnchors = ['fan-oscillation-pivot', 'fan-head-hinge', 'fan-rotor-pivot', 'fan-speed-dial-pivot', 'fan-front-air-socket', 'four root cable sockets'];
spec.risks = ['Blade tips can clip the 0.62 guard.', 'Guard depth can exceed the v1 Z envelope.', 'Support must not inherit head yaw.', 'Generated v2 turn-sheet remains blocked by the external image endpoint.'];
spec.assumptions = ['Archived four-view renders are dimensional evidence only.', 'Hidden motor and oscillation mechanisms remain omitted.', 'No runtime texture model or dependency is introduced.'];

const assessment = { targetName: spec.targetName, sourceImage: spec.sourceImage, preSpecAssessment: spec.preSpecAssessment, qualityContract: spec.qualityContract, localSpecSearch: spec.localSpecSearch };
const inventory = { sourceImage: spec.sourceImage, sourceViews: Object.values(views), detailInventory: spec.preSpecAssessment.detailInventory, note: 'Archived four-view fallback after external GPT Image 2 endpoint failure.' };
await Promise.all([
  writeFile(path.join(outRoot, 'object-sculpt-spec.json'), `${JSON.stringify(spec, null, 2)}\n`),
  writeFile(path.join(outRoot, 'pre-spec-assessment.json'), `${JSON.stringify(assessment, null, 2)}\n`),
  writeFile(path.join(outRoot, 'detail-inventory.json'), `${JSON.stringify(inventory, null, 2)}\n`),
]);
console.log(path.join(outRoot, 'object-sculpt-spec.json'));

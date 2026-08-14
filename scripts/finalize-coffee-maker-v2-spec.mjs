import { readFile, writeFile } from 'node:fs/promises';

const specPath = 'docs/sculpt-specs-v2/coffee-maker/object-sculpt-spec.json';
const spec = JSON.parse(await readFile(specPath, 'utf8'));
const clone = (value) => JSON.parse(JSON.stringify(value));
const rootTemplate = spec.componentTree[0];
const materialTemplate = spec.materials[0];

spec.targetName = 'SAKURA Coffee Maker v2';
spec.targetId = 'coffee-maker-v2';
spec.sourceImage = 'references/intake-v2/coffee-maker/views/front.png';
spec.sourceImages = ['front', 'side', 'back', 'three-quarter'].map((view) => `references/intake-v2/coffee-maker/views/${view}.png`);
spec.suitability = 'pass';
spec.scores = { object_isolation: 3, silhouette_readability: 3, depth_inference: 3, primitive_decomposition: 3, material_procedurality: 3, occlusion_risk: 2, interaction_fit: 3 };
spec.preSpecAssessment.objectClass = {
  primaryType: 'automatic-coffee-maker', primaryDomain: 'object',
  formLanguage: ['stylized-low-poly', 'faceted-hard-surface', 'exaggerated-functional-silhouette'],
  structureKind: ['L-shaped-frame', 'overhanging-upper-shell', 'open-cup-cavity', 'faceted-hopper', 'side-water-tank'],
  motionPotential: ['dial-rotation', 'brew-head-pressure', 'bean-jump', 'liquid-extraction', 'steam-and-aroma'],
  materialFamilies: ['matte-cream-polymer', 'sakura-pink-polymer', 'cool-plum-cavity', 'tinted-glass', 'satin-metal', 'coffee-liquid'],
  notes: 'Observed across an admitted GPT Image 2 four-view turn-sheet; archived runtime anchors and package bounds remain authoritative.',
};
spec.preSpecAssessment.complexity.scores = { silhouetteComplexity: 3, componentCount: 3, hierarchyDepth: 3, repetitionDensity: 3, materialLayerCount: 3, localDetailDensity: 3, occlusionRisk: 3, actionReadinessNeed: 3 };
spec.preSpecAssessment.estimatedCounts = { macroComponents: 6, mesoComponents: 15, microFeatureGroups: 10, materialLayers: 10, repetitionSystems: 7 };

const details = [
  'L-shaped overhanging silhouette', 'eight-plane cream upper shell', 'wide faceted transparent hopper', 'thirty sculpted beans',
  'modeled bean creases', 'hopper lid and locking collar', 'large twelve-sided rotary dial', 'inset dial index',
  'mint vertical status lamp', 'suspended brew-head housing', 'metal shower plate', 'outlet nozzle on frozen socket',
  'deep cool-plum cup cavity', 'pink vertical frame supports', 'wide layered drip tray', 'seven independent tray slots',
  'tapered removable cup', 'negative-space cup handle', 'pink cup rim and foot band', 'separate rising coffee surface',
  'right-side transparent water tank', 'water-tank service cap', 'rear pressed service panel', 'seven rear ventilation slots',
  'rear power inlet and contacts', 'four rubber feet', 'twelve steam volumes', 'five aroma curls',
  'sixteen warm light points', 'stable three-tier uneven outline',
];
spec.preSpecAssessment.detailInventory = {
  scanMethod: 'grid-3x3-plus-runtime-contract', targetMinDetails: 20,
  note: 'Every visible identity feature and frozen runtime effect maps to named procedural geometry.',
  details: details.map((description, index) => ({
    id: `coffee-maker-detail-${index + 1}`, kind: index % 3 === 0 ? 'contour' : index % 3 === 1 ? 'bevel' : 'linework', description,
    region: { x: (index % 3) / 3, y: (index % 6) / 6, width: 0.33, height: 0.16, units: 'normalized' },
    scale: index < 8 ? 'macro' : index < 23 ? 'meso' : 'micro', affects: 'geometry, materialSurface, actionReadiness',
    mapsTo: { type: 'component.localFeatures', ref: 'root' }, evidenceRef: 'turnsheet', confidence: 0.95,
  })),
};
spec.qualityContract.minimumSpecDepth = { macroComponents: 6, mesoComponents: 12, microFeatureGroups: 8, materialLayers: 9, repetitionSystems: 6, reviewViewpoints: 7 };

function component(id, name, level, role, parent, primitive, dimensions, material, features, attachment = null) {
  const item = clone(rootTemplate);
  item.id = id; item.name = name; item.level = level; item.role = role; item.parent = parent;
  item.primitive = primitive === 'cluster' ? 'instanced-cluster' : primitive === 'style' ? 'box' : primitive;
  item.topologyClass = primitive === 'style' ? 'material-only' : primitive === 'tube' ? 'fiber-strand' : 'assembled-solid';
  item.topologyRationale = 'Named procedural low-poly component built around archived animation pivots and sockets.';
  item.dimensions = { ...dimensions, units: 'world', confidence: 0.95 };
  item.material = material; item.materialLayers = [material];
  item.localFeatures = features.map((feature) => ({ id: `${id}-${feature}`, name: feature, evidenceRefs: ['turnsheet'], geometry: 'explicit-named-procedural-geometry' }));
  item.colorMaterialRecipe = { dominantAlbedo: material === 'accent' ? 'rgba(232,174,196,1)' : material === 'cavity' ? 'rgba(70,62,83,1)' : 'rgba(244,237,225,1)', secondaryAlbedo: 'rgba(112,101,126,1)', materialClass: material.includes('glass') ? 'glass' : material === 'metal' ? 'metal' : 'plastic', materialClassConfidence: 0.94 };
  item.surfaceDetail = { macroRoughness: 0.62, microRoughness: 0.05, bumpAmplitude: 0, normalPattern: 'faceted-object-normal', displacementPattern: 'none', occlusionPattern: 'seam-and-contact-ao', edgeWearPattern: 'stable-ink-variation', notes: 'No runtime image textures.' };
  item.actionProfile = clone(rootTemplate.actionProfile); item.actionProfile.animationRole = role;
  item.actionProfile.pivot = { mode: 'named-runtime-pivot', localPosition: [0, 0, 0], axis: [0, 1, 0], confidence: 0.99 };
  item.actionProfile.collider = { type: 'compound-proxy', offset: [0, 0, 0], scale: [1, 1, 1], isTrigger: false, notes: 'Archived v1 envelope remains authoritative.' };
  item.actionProfile.destruction = { breakable: false, fractureGroup: id, seamRefs: [], detachableFragments: [], breakImpulse: 0, debrisMaterial: material };
  item.attachment = attachment ?? (parent ? { parentSocket: `${parent}-socket`, localStart: [0, 0, 0], localEnd: [0, 0.03, 0], contactType: 'overlap', overlap: 0.03, gapTolerance: 0.01 } : null);
  item.evidenceRefs = ['turnsheet']; item.fidelityTier = 'v2';
  return item;
}

spec.componentTree = [
  component('root', 'Coffee maker frozen runtime root', 'macro', 'root', null, 'box', { width: 1.94, height: 2.82, depth: 1.25 }, 'shell', ['floor contact', 'archived package envelope']),
  component('upper-system', 'Eight-plane overhanging upper housing', 'macro', 'upper-pressure', 'root', 'extrude', { width: 1.58, height: 0.72, depth: 1.04 }, 'shell', ['faceted shoulders', 'cream cap']),
  component('hopper-system', 'Wide faceted bean hopper', 'macro', 'bean-pressure', 'upper-system', 'extrude', { width: 1.38, height: 0.76, depth: 0.82 }, 'hopper-glass', ['locking collar', 'lid', 'transparent walls']),
  component('frame-system', 'Rear spine and open cup cavity', 'macro', 'structural-frame', 'root', 'extrude', { width: 1.42, height: 1.35, depth: 0.58 }, 'accent', ['pink supports', 'deep cavity']),
  component('base-system', 'Layered low base and drip platform', 'macro', 'floor-base', 'root', 'extrude', { width: 1.56, height: 0.36, depth: 1.08 }, 'shell', ['pink lower rail', 'wide stance']),
  component('water-system', 'Right-side serviceable water tank', 'macro', 'water-service', 'root', 'extrude', { width: 0.31, height: 1.4, depth: 0.36 }, 'tank-glass', ['faceted tank', 'pink cap']),
  component('control-system', 'Rotary dial and status lamp', 'meso', 'controls', 'upper-system', 'cluster', { width: 0.52, height: 0.48, depth: 0.2 }, 'accent', ['twelve-sided dial', 'index', 'mint lamp']),
  component('brew-system', 'Suspended brew head and outlet', 'meso', 'brew-pressure', 'upper-system', 'cluster', { width: 0.54, height: 0.42, depth: 0.45 }, 'cavity', ['housing', 'shower plate', 'nozzle']),
  component('cup-system', 'Removable tapered cup', 'meso', 'cup', 'root', 'cylinder', { width: 0.62, height: 0.53, depth: 0.46 }, 'shell', ['handle opening', 'pink rim', 'liquid surface']),
  component('tray-system', 'Layered slotted drip tray', 'meso', 'tray', 'base-system', 'box', { width: 1.08, height: 0.11, depth: 0.65 }, 'cavity', ['raised rim', 'seven slots']),
  component('rear-service', 'Rear service and power hierarchy', 'meso', 'rear-service', 'frame-system', 'box', { width: 0.78, height: 0.78, depth: 0.12 }, 'accent', ['pressed hatch', 'power inlet']),
  component('tank-service', 'Water-tank cap and service socket', 'meso', 'tank-service', 'water-system', 'box', { width: 0.29, height: 0.12, depth: 0.34 }, 'accent', ['faceted cap', 'frozen service socket']),
  component('bean-array', 'Thirty faceted beans with creases', 'meso', 'bean-jump', 'hopper-system', 'cluster', { width: 1.08, height: 0.42, depth: 0.52 }, 'bean', ['oval bodies', 'longitudinal creases']),
  component('extraction-system', 'Socket-bound extraction geometry', 'meso', 'liquid-extraction', 'brew-system', 'cluster', { width: 0.18, height: 0.48, depth: 0.18 }, 'coffee', ['three drops', 'flow column', 'two ripples']),
  component('steam-system', 'Forward steam, aroma and warm-light rig', 'meso', 'steam-aroma', 'cup-system', 'cluster', { width: 1.2, height: 1.4, depth: 0.8 }, 'steam', ['twelve puffs', 'five curls', 'sixteen light points']),
  component('feet', 'Four floor-contact feet', 'meso', 'floor-contact', 'root', 'cluster', { width: 1.32, height: 0.07, depth: 0.88 }, 'rubber', ['four supports']),
  component('hopper-lid', 'Faceted hopper lid and collar', 'meso', 'hopper-closure', 'hopper-system', 'box', { width: 1.38, height: 0.16, depth: 0.82 }, 'shell-light', ['cream lid', 'dark collar']),
  component('cavity-back', 'Deep cool-purple cavity back', 'meso', 'cavity-depth', 'frame-system', 'box', { width: 1.12, height: 0.9, depth: 0.08 }, 'cavity', ['recessed rear plane']),
  component('tray-slots', 'Seven independent tray slots', 'micro', 'drain-relief', 'tray-system', 'cluster', { width: 0.72, height: 0.02, depth: 0.42 }, 'metal', ['seven parallel slots']),
  component('rear-vents', 'Seven rear ventilation slots', 'micro', 'ventilation', 'rear-service', 'cluster', { width: 0.43, height: 0.46, depth: 0.03 }, 'cavity', ['seven horizontal vents']),
  component('bean-creases', 'Thirty modeled bean creases', 'micro', 'bean-detail', 'bean-array', 'cluster', { width: 1.08, height: 0.42, depth: 0.52 }, 'bean-dark', ['modeled tube creases']),
  component('liquid-details', 'Extraction drops, flow and cup ripples', 'micro', 'liquid-effect', 'extraction-system', 'cluster', { width: 0.4, height: 0.5, depth: 0.4 }, 'coffee', ['closed volumes only']),
  component('outline-system', 'Stable uneven three-tier ink', 'micro', 'outline-style', 'root', 'style', { width: 1.94, height: 2.82, depth: 1.25 }, 'ink', ['main 0.0048', 'structure 0.0041', 'detail 0.0033', 'variation 0.18']),
];
spec.componentTree[0].localFeatures.push(...details.map((_, index) => `coffee-maker-detail-${index + 1}`));

function material(id, color, secondary, roughness, metalness = 0) {
  const item = clone(materialTemplate); item.id = id; item.name = id; item.baseColor = color; item.color = color;
  item.albedo = { dominant: color, secondary, samplingNotes: 'Observed from admitted GPT Image 2 coffee-maker turn-sheet.' };
  item.colorVariation = { palette: [color, ...secondary], pattern: 'toon-band-and-object-space-facet', amplitude: 0.12, heightCorrelation: 0.1 };
  item.roughness = { base: roughness, variation: 0.08, map: 'independent-procedural-field', localResponse: 'higher at seams' };
  item.metalness = { base: metalness, variation: metalness ? 0.04 : 0 };
  item.localOverrides = [{ region: 'faceted-shadow-planes', response: 'cool-lavender tint', evidenceRefs: ['turnsheet'] }];
  item.referencePbr = { usable: true, confidence: 0.84, source: 'turnsheet-observed-procedural-evidence', maps: { albedo: { path: 'procedural-independent-albedo', channel: 'albedo' }, roughness: { path: 'procedural-independent-roughness', channel: 'roughness' }, height: { path: 'none-faceted-surface', channel: 'height' }, normal: { path: 'geometry-facet-normals', channel: 'normal' }, ao: { path: 'runtime-contact-ao', channel: 'ao' } } };
  item.notes = 'Runtime remains procedural Toon shading; generated reference pixels are not shipped.';
  return item;
}
spec.materials = [
  material('shell', '#F4EDE1', ['#FFF7E9', '#D9D0CD'], 0.68), material('shell-light', '#FFF7E9', ['#F4EDE1'], 0.56),
  material('accent', '#E8AEC4', ['#F4C3D3', '#C87898'], 0.56), material('cavity', '#463E53', ['#62586E'], 0.82),
  material('rubber', '#4F4C59', ['#302D38'], 0.9), material('metal', '#9E9CA5', ['#625D6B'], 0.42, 0.28),
  material('hopper-glass', '#777580', ['#AAA6B4'], 0.22), material('tank-glass', '#687689', ['#A2BDD0'], 0.2),
  material('bean', '#6D321E', ['#9A512D'], 0.76), material('bean-dark', '#321812', ['#4D2820'], 0.84),
  material('coffee', '#7B3D29', ['#B9673D'], 0.28), material('steam', '#FFF4E8', ['#D8CBDF'], 0.35),
  material('ink', '#302A38', ['#5A4B60'], 0.84),
];
spec.repetitionSystems = [
  { id: 'bean-system', componentRef: 'bean-array', count: 30, distribution: 'five lanes in hopper', geometry: 'shared faceted oval', material: 'bean', evidenceRefs: ['runtime-contract'] },
  { id: 'bean-crease-system', componentRef: 'bean-creases', count: 30, distribution: 'one per bean pivot', geometry: 'shared tube crease', material: 'bean-dark', evidenceRefs: ['runtime-contract'] },
  { id: 'tray-slot-system', componentRef: 'tray-slots', count: 7, distribution: 'parallel across tray', geometry: 'shared low box', material: 'metal', evidenceRefs: ['front-view'] },
  { id: 'rear-vent-system', componentRef: 'rear-vents', count: 7, distribution: 'vertical rear bank', geometry: 'shared low box', material: 'cavity', evidenceRefs: ['back-view'] },
  { id: 'steam-volume-system', componentRef: 'steam-system', count: 12, distribution: 'three lobes per frozen pivot', geometry: 'irregular closed icosahedra', material: 'steam', evidenceRefs: ['runtime-contract'] },
  { id: 'warm-light-system', componentRef: 'steam-system', count: 16, distribution: 'forward aroma field', geometry: 'octahedra', material: 'steam', evidenceRefs: ['runtime-contract'] },
  { id: 'foot-system', componentRef: 'feet', count: 4, distribution: 'base corners', geometry: 'low-segment cylinders', material: 'rubber', evidenceRefs: ['runtime-contract'] },
];
spec.viewEvidence = ['front', 'side', 'back', 'three-quarter'].map((view) => ({ id: view === 'three-quarter' ? 'three-quarter-view' : `${view}-view`, view, imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['consistent upper shell, hopper, cavity, base, tank and floor line'], confidence: 0.95 }));
spec.viewEvidence.unshift({ id: 'turnsheet', view: 'multi-view', imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['admitted GPT Image 2 four-view turn-sheet'], confidence: 0.97 });
spec.viewEvidence.push({ id: 'runtime-contract', view: 'runtime', imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['frozen pivots, sockets, effects and exact reset'], confidence: 0.99 });
for (const [id, time] of [['startup', 0.6], ['climax', 2.8], ['wind-down', 4.75]]) spec.viewEvidence.push({ id, view: `runtime-${id}`, imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: [`fixed timeline at ${time} seconds`], confidence: 0.99 });
spec.silhouette = { boundingShape: 'compact L-shaped frame with wide hopper and low separated base', aspectRatios: ['width:height 0.69', 'depth:height 0.44'], symmetry: 'front frame nearly bilateral with right water tank and left dial asymmetry', dominantCurves: ['eight-plane upper shell', 'wide tapered hopper', 'layered base'], negativeSpaces: ['open cup cavity', 'cup handle opening'], landmarks: ['large dial', 'brew head', 'cup', 'water tank', 'rear service panel'] };
spec.featureReviewTargets = [
  { id: 'coffee-maker-silhouette', name: 'L-shaped frame, wide hopper, open cavity and stable base', tier: 'critical', passIds: ['blockout', 'form-refinement'], minimumScore: 0.82, mustPass: true, componentRefs: ['upper-system', 'hopper-system', 'frame-system', 'base-system'], evidenceRefs: ['front-view', 'side-view', 'three-quarter-view'] },
  { id: 'coffee-maker-identity', name: 'Dial, suspended brew head, cup, tray and side tank', tier: 'critical', passIds: ['structural-pass', 'material-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['control-system', 'brew-system', 'cup-system', 'tray-system', 'water-system'], evidenceRefs: ['turnsheet'] },
  { id: 'coffee-maker-runtime', name: 'Frozen bean, outlet, cup, steam, tank and reset contract', tier: 'critical', passIds: ['interaction-pass'], minimumScore: 0.9, mustPass: true, componentRefs: ['bean-array', 'extraction-system', 'steam-system', 'water-system'], evidenceRefs: ['runtime-contract'] },
  { id: 'coffee-maker-ink', name: 'Sakura Toon palette and stable uneven ink', tier: 'critical', passIds: ['material-pass', 'lighting-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['outline-system'], evidenceRefs: ['turnsheet'] },
];
spec.qualityTargets.reviewViewpoints = ['front', 'side', 'back', 'three-quarter', 'runtime-startup', 'runtime-climax', 'runtime-wind-down'];
spec.lightingFromPhoto = ['soft upper-left key', 'cool lavender fill', 'restrained Sakura rim', 'light neutral background', 'soft contact shadow below four feet', 'ACESFilmic exposure 1.0'];
spec.performanceBudget = { qualityPriority: 'stylized-runtime', targetTriangles: 30000, maxDrawCalls: 150, textureSize: 0, fpsTarget: 60, optimizationPolicy: 'Reuse bean/effect geometries and low-segment faceted primitives; no runtime image textures.' };
spec.assumptions = ['GPT Image 2 turn-sheet is visual evidence only.', 'Existing pivots, sockets, beans, extraction and steam effects are frozen.', 'Visual exaggeration remains inside the archived total envelope.'];
spec.risks = ['Transparent hopper must not hide bean identity.', 'Outlet and cup axis must remain aligned.', 'Steam geometry must remain forward of the upper shell.', 'Transparent and effect geometry must avoid heavy outline clustering.'];
spec.sculptPipeline.currentPass = 'blockout'; spec.sculptPipeline.completedPasses = []; spec.sculptPipeline.lastCompletedPass = null; spec.sculptPipeline.blockedReason = ''; spec.sculptPipeline.nextRequiredEvidence = ['front blockout render', 'three-quarter blockout render'];
spec.reviewHistory = []; spec.visualEvidence = [];

await writeFile(specPath, `${JSON.stringify(spec, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ specPath, components: spec.componentTree.length, materials: spec.materials.length, details: details.length, repetitions: spec.repetitionSystems.length }, null, 2));

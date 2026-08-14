#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';

const specPath = 'docs/sculpt-specs-v2/hair-dryer/object-sculpt-spec.json';
const assessmentPath = 'docs/sculpt-specs-v2/hair-dryer/pre-spec-assessment.json';
const [spec, assessment] = await Promise.all([
  readFile(specPath, 'utf8').then(JSON.parse),
  readFile(assessmentPath, 'utf8').then(JSON.parse),
]);

const refs = {
  front: 'references/intake/hair-dryer/front.png',
  side: 'references/intake/hair-dryer/side.png',
  back: 'references/intake/hair-dryer/back.png',
};
const evidenceIds = ['front-view', 'side-view', 'back-view'];
const detailComponentAliases = {
  'handle-shoulder': 'handle-shell',
  'cable-collar': 'cable-assembly',
  'power-cord': 'cable-assembly',
  'ribbon-rig': 'ribbon-system',
};
const detailData = [
  ['detail-01', 'contour', 'motor-shell', 'Twelve-sided tapered cream motor barrel remains inside the v1 envelope.'],
  ['detail-02', 'seam', 'body-seam', 'Rear mould seam and front transition lip remain countable.'],
  ['detail-03', 'contour', 'nozzle-loft', 'Six-ring concentrator pinches then widens into a flattened outlet.'],
  ['detail-04', 'linework', 'outlet-louvers', 'Five recessed outlet louvers remain evenly spaced.'],
  ['detail-05', 'contour', 'rear-intake', 'Cream and mint intake rings preserve the frozen rear pivot.'],
  ['detail-06', 'linework', 'perforation-field', 'Sixty-nine dark perforations remain bounded by the mint ring.'],
  ['detail-07', 'contour', 'fan-rotor', 'Seven fan blades retain the archived rotor axis.'],
  ['detail-08', 'contour', 'handle-shell', 'Clipped-corner pink handle retains the archived handle pivot.'],
  ['detail-09', 'bevel', 'handle-shoulder', 'Broad faceted shoulder overlaps the barrel without changing the socket.'],
  ['detail-10', 'contour', 'cool-control', 'Round cool-shot button retains its translation axis.'],
  ['detail-11', 'ridge', 'power-slider', 'Two-position slider and thumb groove remain readable.'],
  ['detail-12', 'contour', 'cable-collar', 'Cream cable collar preserves the archived cable pivot.'],
  ['detail-13', 'ridge', 'strain-relief', 'Six tapered strain-relief ribs remain countable.'],
  ['detail-14', 'contour', 'power-cord', 'Short eight-sided visible cord stays inside the v1 Box3.'],
  ['detail-15', 'contour', 'ribbon-rig', 'Five solid-section ribbons retain their exact emitter and release behavior.'],
  ['detail-16', 'linework', 'outline-system', 'Stable main, structure and detail ink uses 0.0048, 0.0041 and 0.0033 widths.'],
  ['detail-17', 'gloss', 'cream-shell', 'Cream shell uses restrained satin Toon response.'],
  ['detail-18', 'gloss', 'pink-shell', 'Pink structure uses separate highlight and shadow values.'],
];
const details = detailData.map(([id, kind, ref, description], index) => ({
  id,
  kind,
  description,
  region: { x: (index % 3) / 3, y: Math.floor(index / 3) / 6, width: 1 / 3, height: 1 / 6, units: 'normalized' },
  scale: index < 4 ? 'macro' : index < 15 ? 'meso' : 'micro',
  affects: kind === 'gloss' || ref === 'outline-system' ? 'materialSurface' : 'geometry, materialSurface',
  mapsTo: kind === 'gloss' || ref === 'outline-system'
    ? { type: 'material.localOverrides', ref }
    : { type: 'component.localFeatures', ref: detailComponentAliases[ref] ?? ref },
  evidenceRef: index >= 4 && index <= 7 ? refs.back : refs.front,
  confidence: 0.94,
}));

spec.targetName = 'SAKURA Hair Dryer v2';
spec.targetId = 'hair-dryer-v2';
spec.sourceImage = refs.front;
spec.suitability = 'conditional';
spec.scores = { object_isolation: 3, silhouette_readability: 3, depth_inference: 3, primitive_decomposition: 3, material_procedurality: 3, occlusion_risk: 2, interaction_fit: 3 };
spec.referenceCamera = { solved: true, projection: 'orthographic archived three-view', fovDegrees: 30, aspect: 557 / 941, orientation: { yaw: 0, pitch: 0, roll: 0 }, positionHint: [-0.56, -0.03, 10], note: 'Archived views own geometric evidence; v1 runtime contract owns pivots, sockets and envelope.' };
spec.coordinateFrame = { front: '+Z faces the handle controls', up: '+Y with visible cord ending at Y=-2.31', scaleReference: 'archived v1 full-tree bounds 4.0121616125 x 4.5649999738 x 1.8099999428' };
spec.silhouette = { boundingShape: 'horizontal barrel and nozzle over a long vertical handle', aspectRatios: [4.01216 / 4.565, 1.81 / 4.565], symmetry: 'radial barrel with asymmetric lower handle', dominantCurves: ['faceted barrel', 'pinched nozzle loft', 'clipped handle'], negativeSpaces: ['handle-to-nozzle undercut', 'outlet recess', 'rear perforations'], landmarks: ['body Y=1.35', 'handle X=0.45', 'emitter X=-2.43', 'rear pivot X=1.25'] };
spec.viewEvidence = [
  { id: 'front-view', view: 'front', imagePath: refs.front, imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['barrel/nozzle silhouette', 'handle controls', 'cable boot'], confidence: 0.98 },
  { id: 'side-view', view: 'side', imagePath: refs.side, imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['barrel depth', 'handle depth', 'outlet flattening'], confidence: 0.97 },
  { id: 'back-view', view: 'back', imagePath: refs.back, imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['mint intake ring', 'perforations', 'fan axis'], confidence: 0.98 },
];
spec.preSpecAssessment = {
  ...spec.preSpecAssessment,
  objectClass: {
    primaryType: 'faceted handheld hair dryer with articulated controls and model-owned ribbon performance',
    primaryDomain: 'object',
    formLanguage: ['hard-surface', 'low-poly', 'faceted', 'Sakura game appliance'],
    structureKind: ['compound object', 'radial shell', 'attached handle', 'repeated modules'],
    motionPotential: ['fan rotation', 'body recoil', 'button travel', 'slider travel', 'five-ribbon propagation and release'],
    materialFamilies: ['molded cream plastic', 'molded pink plastic', 'mint intake screen', 'plum cavity', 'soft cord'],
    notes: 'Visual mass changes only inside the frozen v1 runtime contract.',
  },
  complexity: {
    tier: 'complex',
    scores: { silhouetteComplexity: 3, componentCount: 3, hierarchyDepth: 3, repetitionDensity: 3, materialLayerCount: 2, localDetailDensity: 3, occlusionRisk: 2, actionReadinessNeed: 3 },
    estimatedCounts: { macroComponents: 6, mesoComponents: 15, microFeatureGroups: 18, materialLayers: 4, repetitionSystems: 4 },
    reasoning: ['Nine frozen pivots and eight sockets must retain exact local transforms.', 'Outlet louvers, perforations, fan blades, strain ribs and ribbons are count-sensitive systems.', 'The animated ribbon release must remain continuous and exactly resettable.'],
  },
  specDepthDecision: { requiredDepth: 'complex', minimumComponentLevels: ['macro', 'meso', 'micro'], needsRepetitionSystems: true, needsMaterialLocalOverrides: true, needsMultipleReviewViews: true, needsActionReadyHierarchy: true, rationale: 'Animation-rich handheld prop with exact emitter and reset contracts.' },
  unknownsToResolveBeforeImplementation: [],
  detailInventory: { scanMethod: 'grid-3x3 plus archived three-view review', targetMinDetails: 18, details },
  sourceImage: refs.front,
};
spec.localSpecSearch = assessment.localSpecSearch;
spec.qualityContract.qualityBar = 'complex';
spec.qualityContract.definitionOfDone = ['The v2 dryer preserves the v1 envelope, pivots, sockets and animation behavior while replacing smooth toy-like forms with countable low-poly planes and stable three-tier ink.'];

const rootTemplate = structuredClone(spec.componentTree[0]);
function component(id, name, level, role, parent, material, primitive, localFeatures, options = {}) {
  const value = structuredClone(rootTemplate);
  Object.assign(value, { id, name, level, role, parent, material, primitive, materialLayers: [material], importance: options.importance ?? 0.9, confidence: 0.96, topologyClass: options.topologyClass ?? 'assembled-solid', topologyRationale: options.topologyRationale ?? 'Rigid low-poly hard-surface assembly with broad planes and stable overlap.', localFeatures, evidenceRefs: evidenceIds, fidelityTier: options.fidelityTier ?? 'form-refinement' });
  value.dimensions = options.dimensions ?? { width: 1, height: 1, depth: 1, units: 'relative', confidence: 0.94 };
  value.transform = { position: options.position ?? [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] };
  value.attachment = parent ? { parentSocket: `${parent}-socket`, localStart: [0, 0, 0], localEnd: [0, 0.04, 0], contactType: options.contactType ?? 'overlap', overlap: 0.025, gapTolerance: 0.01, evidenceRefs: evidenceIds } : null;
  value.actionProfile.animationRole = options.animationRole ?? (parent ? 'static-part' : 'root');
  value.actionProfile.pivot = { mode: options.pivotMode ?? 'center', localPosition: options.pivot ?? [0, 0, 0], axis: options.axis ?? [0, 1, 0], confidence: 0.99 };
  value.actionProfile.collider = options.collider ?? null;
  value.actionProfile.destruction.fractureGroup = options.fractureGroup ?? id;
  value.details = localFeatures.map((feature) => ({ id: feature, kind: 'construction', evidenceRefs: evidenceIds }));
  value.surfaceDetail = { macroRoughness: 0.12, microRoughness: 0.04, bumpAmplitude: 0.006, normalPattern: 'stable molded response', displacementPattern: 'none', occlusionPattern: 'seams and contact overlaps', edgeWearPattern: 'restrained chamfer highlight', notes: 'Broad low-poly planes remain dominant.' };
  value.colorMaterialRecipe = { dominantAlbedo: options.dominant ?? 'rgba(247, 234, 214, 1)', secondaryAlbedo: options.secondary ?? 'rgba(232, 167, 183, 1)', materialClass: options.materialClass ?? 'plastic', materialClassConfidence: 0.94 };
  return value;
}

spec.componentTree = [
  component('root', 'Hair Dryer Runtime Root', 'macro', 'container', null, 'cream-shell', 'box', ['detail-01'], { importance: 1 }),
  component('body-assembly', 'Faceted Motor Body', 'macro', 'body', 'root', 'cream-shell', 'cylinder', ['detail-01', 'detail-02'], { dimensions: { width: 2.52, height: 1.64, depth: 1.64, units: 'world', confidence: 1 }, animationRole: 'body-recoil', pivot: [0, 1.35, 0], axis: [1, 0, 0], collider: { type: 'cylinder', offset: [0, 1.35, 0], scale: [2.52, 1.64, 1.64], isTrigger: false } }),
  component('nozzle-assembly', 'Pinched Concentrator', 'macro', 'nozzle', 'body-assembly', 'pink-shell', 'curve-sweep', ['detail-03', 'detail-04'], { animationRole: 'nozzle-recoil', pivot: [0, 0, 0], axis: [1, 0, 0] }),
  component('rear-assembly', 'Rear Intake Assembly', 'macro', 'intake', 'body-assembly', 'mint-intake', 'cylinder', ['detail-05', 'detail-06', 'detail-07'], { animationRole: 'fan-intake', pivot: [1.25, 0, 0], axis: [1, 0, 0] }),
  component('handle-assembly', 'Faceted Handle Assembly', 'macro', 'handle', 'root', 'pink-shell', 'extrude', ['detail-08', 'detail-09', 'detail-10', 'detail-11'], { animationRole: 'handle-recoil', pivot: [0.45, 0.76, 0], axis: [0, 0, 1] }),
  component('performance-rig', 'Ribbon Performance Rig', 'macro', 'effect', 'body-assembly', 'pink-shell', 'tube', ['detail-15'], { animationRole: 'model-owned-performance' }),
  component('motor-shell', 'Twelve-sided Motor Shell', 'meso', 'shell', 'body-assembly', 'cream-shell', 'cylinder', ['detail-01']),
  component('body-seam', 'Body Mould Seam', 'meso', 'seam', 'body-assembly', 'pink-shell', 'torus', ['detail-02']),
  component('nozzle-loft', 'Six-ring Nozzle Loft', 'meso', 'shell', 'nozzle-assembly', 'pink-shell', 'curve-sweep', ['detail-03']),
  component('outlet-louvers', 'Five Outlet Louvers', 'meso', 'vent', 'nozzle-assembly', 'plum-cavity', 'instanced-cluster', ['detail-04']),
  component('rear-intake', 'Layered Rear Intake', 'meso', 'intake', 'rear-assembly', 'mint-intake', 'torus', ['detail-05']),
  component('perforation-field', 'Rear Perforation Field', 'meso', 'vent', 'rear-assembly', 'plum-cavity', 'instanced-cluster', ['detail-06']),
  component('fan-rotor', 'Seven-blade Fan Rotor', 'meso', 'rotor', 'rear-assembly', 'plum-cavity', 'instanced-cluster', ['detail-07'], { animationRole: 'rotating-assembly', pivot: [0.075, 0, 0], axis: [1, 0, 0] }),
  component('handle-shell', 'Clipped Handle Shell', 'meso', 'grip', 'handle-assembly', 'pink-shell', 'extrude', ['detail-08', 'detail-09']),
  component('cool-control', 'Cool-shot Control', 'meso', 'control', 'handle-assembly', 'cream-shell', 'cylinder', ['detail-10'], { animationRole: 'button-travel', pivot: [0, -0.43, 0.365], axis: [0, 0, -1] }),
  component('power-slider', 'Power Slider', 'meso', 'control', 'handle-assembly', 'cream-shell', 'extrude', ['detail-11'], { animationRole: 'slider-travel', pivot: [0, -1.03, 0.365], axis: [0, 1, 0] }),
  component('cable-assembly', 'Cable Collar and Boot', 'meso', 'cable', 'handle-assembly', 'cream-shell', 'cylinder', ['detail-12', 'detail-13', 'detail-14'], { animationRole: 'cable-socket', pivot: [0, -1.96, 0] }),
  component('strain-relief', 'Six Strain-relief Ribs', 'micro', 'rib', 'cable-assembly', 'cream-shell', 'instanced-cluster', ['detail-13']),
  component('ribbon-system', 'Five Solid Wind Ribbons', 'micro', 'effect', 'performance-rig', 'pink-shell', 'tube', ['detail-15'], { animationRole: 'effect-emitter' }),
  component('outline-system', 'Stable Three-tier Ink', 'micro', 'material', 'root', 'plum-cavity', 'extrude', ['detail-16'], { topologyClass: 'conforming-shell' }),
];

const materialTemplate = structuredClone(spec.materials[0]);
function material(id, name, baseColor, secondary, options = {}) {
  const value = structuredClone(materialTemplate);
  Object.assign(value, { id, name, baseColor, color: baseColor, type: 'toon', shaderModel: 'MeshToonMaterial with project gradient response' });
  value.albedo = { dominant: baseColor, secondary, samplingNotes: 'Archived orthographic reference palette.' };
  value.colorVariation = { palette: [baseColor, ...secondary], pattern: 'stable molded value bands', amplitude: 0.04, heightCorrelation: 0 };
  value.roughness = { base: options.roughness ?? 0.56, variation: 0.06, map: 'independent roughness evidence', localResponse: 'higher in cavities, lower on facet crowns' };
  value.normal = { pattern: 'independent molded micro-normal', strength: 0.06, scale: 32, space: 'tangent' };
  value.bump = { pattern: 'restrained molded micrograin', amplitude: 0.006, scale: 64 };
  value.ambientOcclusion = { cavityStrength: 0.28, contactShadowBias: 0.3, notes: 'nozzle seams, intake stack and control recesses' };
  value.wear = { edgeWear: 0.01, scratches: [], chips: [] };
  value.dirt = { amount: 0.01, cavityBias: 0.08, color: '#443943' };
  value.localOverrides = [{ id: `${id}-facet-response`, mask: 'object-space facet normal', response: 'two to three stable Toon bands' }];
  const dir = `docs/sculpt-specs-v2/hair-dryer/pbr/${options.evidenceId ?? id}`;
  value.referencePbr = { usable: true, confidence: 0.86, estimatedFidelity: 0.86, sourceImage: refs.front, maps: Object.fromEntries(['albedo', 'roughness', 'height', 'normal', 'ao'].map((channel) => [channel, { path: `${dir}/${options.evidenceId ?? id}_${channel}.png` }])), limitation: 'Single-image evidence estimates response and does not claim measured physical channels.' };
  return value;
}
spec.materials = [
  material('cream-shell', 'Cream Molded Shell', '#F7EAD6', ['#FFF4E4', '#94828B'], { roughness: 0.32 }),
  material('pink-shell', 'Cherry Pink Structure', '#E8A7B7', ['#F3C1CC', '#A96F86'], { roughness: 0.34 }),
  material('mint-intake', 'Mint Intake', '#BFE1DA', ['#D7EEE7', '#789796']),
  material('plum-cavity', 'Cold Plum Cavity', '#4C4A4B', ['#756F6D', '#33323A']),
];
spec.repetitionSystems = [
  { id: 'outlet-louvers-five', componentRef: 'outlet-louvers', count: 5, realization: 'geometry', buildsGeometry: true, geometry: { primitive: 'faceted-bar' }, distribution: 'five vertical positions across flattened outlet' },
  { id: 'rear-perforations-sixty-nine', componentRef: 'perforation-field', count: 69, realization: 'instanced', buildsGeometry: true, geometry: { primitive: 'eight-sided-disc' }, distribution: 'bounded radial grid' },
  { id: 'fan-blades-seven', componentRef: 'fan-rotor', count: 7, realization: 'geometry', buildsGeometry: true, geometry: { primitive: 'faceted-blade' }, distribution: 'equal radial angles' },
  { id: 'strain-ribs-six', componentRef: 'strain-relief', count: 6, realization: 'geometry', buildsGeometry: true, geometry: { primitive: 'tapered-eight-sided-ring' }, distribution: 'descending cable axis' },
  { id: 'wind-ribbons-five', componentRef: 'ribbon-system', count: 5, realization: 'geometry', buildsGeometry: true, geometry: { primitive: 'segmented-solid-ribbon' }, distribution: 'five authored emitter anchors' },
];
spec.featureReviewTargets = [
  ['dryer-silhouette', 'Barrel, nozzle and handle silhouette', 'blockout', ['body-assembly', 'nozzle-assembly', 'handle-assembly']],
  ['nozzle-intake-identity', 'Flattened nozzle and layered rear intake', 'structural-pass', ['nozzle-assembly', 'rear-assembly']],
  ['control-and-cable-layout', 'Handle controls and cable boot', 'form-refinement', ['handle-assembly', 'cable-assembly']],
  ['toon-material-system', 'Cream, pink, mint and plum Toon response', 'material-pass', ['motor-shell', 'handle-shell', 'rear-intake']],
  ['outline-hierarchy', 'Stable three-tier irregular ink', 'lighting-pass', ['outline-system']],
  ['frozen-animation-rig', 'Frozen pivots, sockets and ribbon behavior', 'interaction-pass', ['performance-rig', 'ribbon-system']],
].map(([id, name, passId, componentRefs]) => ({ id, name, tier: 'critical', passIds: [passId], minimumScore: 0.82, mustPass: true, componentRefs, evidenceRefs: evidenceIds }));
spec.lightingFromPhoto = ['warm upper-left key light on cream facets', 'cool right-rear lavender fill', 'pink rim light on nozzle and handle', 'neutral exposure with ACES tone mapping', 'soft floor contact shadow'];
spec.proceduralStrategy = ['twelve-sided radial primitives for barrel and rings', 'six-ring authored loft for concentrator', 'clipped-corner extruded handle profile', 'instanced perforation grid and bounded repeated details', 'stable object-space outline variation'];
spec.animationAnchors = [
  { id: 'fan-axis', node: 'hair-dryer-fan-rotor-pivot', socket: 'hair-dryer-fan-axis-socket', purpose: 'fan rotation' },
  { id: 'airflow-emitter', node: 'hair-dryer-nozzle-pivot', socket: 'hair-dryer-airflow-emitter-socket', purpose: 'five-ribbon emission' },
  { id: 'controls', node: 'hair-dryer-handle-pivot', socket: 'hair-dryer-power-switch-socket', purpose: 'button and slider travel' },
];
spec.assumptions = ['Internal motor and heater remain omitted.', 'Archived v1 Box3 and local transforms are compatibility truth.', 'GPT Image 2 turn-sheet generation remains pending after bounded endpoint timeouts.'];
spec.risks = ['High segment counts would weaken the low-poly read.', 'Main ink on perforations could clump.', 'Moving the emitter would detach ribbon effects.', 'Generated turn-sheet is currently unavailable.'];
spec.buildPasses.forEach((pass) => {
  pass.componentRefs = spec.componentTree.filter((entry) => entry.fidelityTier === pass.id || entry.level === 'macro').map((entry) => entry.id);
});

await writeFile(specPath, `${JSON.stringify(spec, null, 2)}\n`);
console.log(specPath);

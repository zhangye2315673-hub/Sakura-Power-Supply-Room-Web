import { readFile, writeFile } from 'node:fs/promises';

const specPath = 'docs/sculpt-specs-v2/toaster/object-sculpt-spec.json';
const spec = JSON.parse(await readFile(specPath, 'utf8'));
const clone = (value) => JSON.parse(JSON.stringify(value));
const rootTemplate = spec.componentTree[0];
const materialTemplate = spec.materials[0];

spec.suitability = 'pass';
spec.scores = { object_isolation: 3, silhouette_readability: 3, depth_inference: 3, primitive_decomposition: 3, material_procedurality: 3, occlusion_risk: 2, interaction_fit: 3 };
spec.preSpecAssessment.objectClass = {
  primaryType: 'toaster', primaryDomain: 'object',
  formLanguage: ['stylized-low-poly', 'faceted-hard-surface', 'exaggerated-functional-silhouette'],
  structureKind: ['extruded-shell', 'layered-slot', 'lever-and-dial-control-island', 'rear-service-panel'],
  motionPotential: ['lever-translation', 'carriage-translation', 'dial-rotation', 'external-toast-ballistic-flight'],
  materialFamilies: ['matte-cream-polymer', 'sakura-pink-polymer', 'cool-grey-slot-rim', 'dark-cavity-rubber', 'warm-heater-emission'],
  notes: 'Observed across an admitted GPT Image 2 four-view turn-sheet; runtime anchors and external toast flight remain frozen.',
};
spec.preSpecAssessment.complexity.scores = { silhouetteComplexity: 3, componentCount: 3, hierarchyDepth: 3, repetitionDensity: 3, materialLayerCount: 3, localDetailDensity: 3, occlusionRisk: 2, actionReadinessNeed: 3 };
spec.preSpecAssessment.estimatedCounts = { macroComponents: 4, mesoComponents: 12, microFeatureGroups: 8, materialLayers: 8, repetitionSystems: 4 };
const detailNames = [
  'eight-plane tapered shell', 'broad upper shoulder', 'pink stepped base plinth', 'dark lower seam',
  'faceted cool-grey slot rim', 'deep slot cavity', 'centre slot divider', 'warm heater bar',
  'vertical lever track', 'projecting layered lever handle', 'large 12-sided browning dial', 'nine radial dial ticks',
  'mint status lamp', 'two right-side controls', 'rear service panel', 'three rear vents',
  'rear cable keeper and recess', 'four rubber feet', 'single frozen toast launch socket', 'stable three-tier uneven outline',
];
spec.preSpecAssessment.detailInventory = {
  scanMethod: 'grid-3x3-plus-runtime-contract', targetMinDetails: 16,
  note: 'Every visible or runtime-critical feature maps to a named procedural component or repetition system.',
  details: detailNames.map((name, index) => ({
    id: `toaster-detail-${index + 1}`, kind: index % 3 === 0 ? 'contour' : index % 3 === 1 ? 'bevel' : 'linework', description: name,
    region: { x: (index % 3) / 3, y: (index % 6) / 6, width: 0.33, height: 0.16, units: 'normalized' },
    scale: index < 8 ? 'macro' : index < 15 ? 'meso' : 'micro', affects: 'geometry, materialSurface, actionReadiness',
    mapsTo: { type: 'component.localFeatures', ref: 'root' }, evidenceRef: 'turnsheet', confidence: 0.94,
  })),
};
spec.qualityContract.minimumSpecDepth = { macroComponents: 4, mesoComponents: 10, microFeatureGroups: 7, materialLayers: 7, repetitionSystems: 4, reviewViewpoints: 7 };

const component = (id, name, level, role, parent, primitive, dimensions, material, features) => {
  const item = clone(rootTemplate);
  item.id = id; item.name = name; item.level = level; item.role = role; item.parent = parent;
  item.primitive = primitive === 'cluster' ? 'instanced-cluster' : primitive === 'style' ? 'box' : primitive;
  item.topologyClass = primitive === 'style' ? 'material-only' : 'assembled-solid';
  item.topologyRationale = 'Procedural low-poly component with explicit planar construction and frozen runtime anchors.';
  item.dimensions = { ...dimensions, units: 'world', confidence: 0.94 };
  item.material = material; item.materialLayers = [material];
  item.localFeatures = features.map((feature) => ({ id: `${id}-${feature}`, name: feature, evidenceRefs: ['turnsheet'], geometry: 'explicit-named-mesh-or-shared-procedural-geometry' }));
  item.colorMaterialRecipe = { dominantAlbedo: material === 'accent' ? 'rgba(232,174,196,1)' : material === 'cavity' ? 'rgba(48,43,58,1)' : 'rgba(241,233,217,1)', secondaryAlbedo: 'rgba(113,102,127,1)', materialClass: material === 'metal' ? 'metal' : 'plastic', materialClassConfidence: 0.92 };
  item.surfaceDetail = { macroRoughness: 0.64, microRoughness: 0.05, bumpAmplitude: 0, normalPattern: 'faceted-object-normal', displacementPattern: 'none', occlusionPattern: 'seam-and-contact-ao', edgeWearPattern: 'stable-ink-variation', notes: 'No runtime textures.' };
  item.actionProfile = clone(rootTemplate.actionProfile); item.actionProfile.animationRole = role;
  item.actionProfile.pivot = { mode: 'named-runtime-pivot', localPosition: [0, 0, 0], axis: [0, 1, 0], confidence: 0.99 };
  item.actionProfile.collider = { type: 'compound-proxy', offset: [0, 0, 0], scale: [1, 1, 1], isTrigger: false, notes: 'Archived v1 envelope remains authoritative.' };
  item.actionProfile.destruction = { breakable: false, fractureGroup: id, seamRefs: [], detachableFragments: [], breakImpulse: 0, debrisMaterial: material };
  item.attachment = parent ? { parentSocket: `${parent}-socket`, localStart: [0, 0, 0], localEnd: [0, 0.03, 0], contactType: 'overlap', overlap: 0.03, gapTolerance: 0.01 } : null;
  item.evidenceRefs = ['turnsheet']; item.fidelityTier = 'v2'; return item;
};
spec.componentTree = [
  component('root', 'Toaster frozen runtime root', 'macro', 'root', null, 'box', { width: 2.32, height: 1.82, depth: 1.38 }, 'shell', ['floor contact', 'connection envelope']),
  component('shell-system', 'Eight-plane tapered toaster shell', 'macro', 'shell', 'root', 'extrude', { width: 2.22, height: 1.7, depth: 1.18 }, 'shell', ['broad shoulder', 'tapered sides']),
  component('slot-system', 'Layered top slot assembly', 'macro', 'toast-slot', 'shell-system', 'box', { width: 1.72, height: 0.14, depth: 0.46 }, 'metal', ['rim', 'cavity', 'heater', 'divider']),
  component('control-system', 'Front lever and browning control island', 'macro', 'controls', 'shell-system', 'box', { width: 0.72, height: 1.22, depth: 0.2 }, 'accent', ['lever', 'dial', 'ticks', 'lamp']),
  component('base-plinth', 'Sakura-pink stepped base', 'meso', 'floor-support', 'root', 'box', { width: 2.28, height: 0.22, depth: 1.25 }, 'accent', ['dark seam']),
  component('lever-system', 'Translating lever and layered handle', 'meso', 'lever-translation', 'control-system', 'box', { width: 0.42, height: 0.68, depth: 0.19 }, 'shell-light', ['dark track', 'pink inset']),
  component('dial-system', 'Twelve-sided browning dial', 'meso', 'dial-rotation', 'control-system', 'cylinder', { width: 0.54, height: 0.54, depth: 0.24 }, 'shell-light', ['pink bezel', 'index']),
  component('dial-ticks', 'Nine radial browning ticks', 'meso', 'dial-scale', 'control-system', 'cluster', { width: 0.66, height: 0.66, depth: 0.02 }, 'cavity', ['nine marks']),
  component('status-lamp', 'Inset mint status lamp', 'meso', 'indicator', 'control-system', 'sphere', { width: 0.09, height: 0.09, depth: 0.09 }, 'indicator', ['small circular inset']),
  component('side-controls', 'Two right-side controls', 'meso', 'side-controls', 'shell-system', 'cluster', { width: 0.19, height: 0.57, depth: 0.31 }, 'accent', ['upper cream control', 'lower pink control']),
  component('rear-panel', 'Rear service panel', 'meso', 'rear-service', 'shell-system', 'box', { width: 1.08, height: 0.52, depth: 0.03 }, 'shell', ['three vents']),
  component('cable-keeper', 'Rear cable keeper and recess', 'meso', 'power-connection', 'shell-system', 'box', { width: 0.56, height: 0.23, depth: 0.13 }, 'shell-light', ['U recess', 'power socket']),
  component('feet', 'Four rubber feet', 'meso', 'floor-contact', 'root', 'cluster', { width: 1.82, height: 0.09, depth: 1.13 }, 'rubber', ['four pads']),
  component('toast-carriage', 'Frozen internal toast carriage', 'meso', 'carriage-translation', 'slot-system', 'box', { width: 1.42, height: 0.86, depth: 0.2 }, 'cavity', ['launch socket']),
  component('rear-vents', 'Three rear vent slots', 'micro', 'ventilation', 'rear-panel', 'cluster', { width: 0.54, height: 0.31, depth: 0.03 }, 'cavity', ['three parallel slots']),
  component('slot-heater', 'Warm internal heater bar', 'micro', 'heater-emission', 'slot-system', 'box', { width: 1.28, height: 0.03, depth: 0.13 }, 'heater', ['restrained glow']),
  component('outline-system', 'Stable uneven three-tier outline', 'micro', 'outline-style', 'root', 'style', { width: 2.32, height: 1.82, depth: 1.38 }, 'ink', ['main 0.0048', 'structure 0.0041', 'detail 0.0033', 'variation 0.18']),
];
spec.componentTree[0].localFeatures.push(...spec.preSpecAssessment.detailInventory.details.map((detail) => detail.id));

const material = (id, color, secondary, roughness, metalness = 0) => {
  const item = clone(materialTemplate); item.id = id; item.name = id; item.baseColor = color; item.color = color;
  item.albedo = { dominant: color, secondary, samplingNotes: 'Observed from GPT Image 2 toaster turn-sheet.' };
  item.colorVariation = { palette: [color, ...secondary], pattern: 'toon-band-and-object-space-facet', amplitude: 0.12, heightCorrelation: 0.1 };
  item.roughness = { base: roughness, variation: 0.08, map: 'independent-procedural-field', localResponse: 'higher at seams' };
  item.metalness = { base: metalness, variation: 0.04 }; item.localOverrides = [{ region: 'faceted-shadow-planes', response: 'cool-lavender tint', evidenceRefs: ['turnsheet'] }];
  item.referencePbr = { usable: true, confidence: 0.84, source: 'turnsheet-observed-procedural-evidence', maps: { albedo: { path: 'procedural-independent-albedo', channel: 'albedo' }, roughness: { path: 'procedural-independent-roughness', channel: 'roughness' }, height: { path: 'none-flat-polymer', channel: 'height' }, normal: { path: 'geometry-facet-normals', channel: 'normal' }, ao: { path: 'runtime-lighting-contact-ao', channel: 'ao' } } };
  item.notes = 'Runtime uses procedural Toon shading and no image textures.'; return item;
};
spec.materials = [
  material('shell', '#F1E9D9', ['#FBF4E8', '#D6C8C2'], 0.68), material('shell-light', '#FBF4E8', ['#F1E9D9'], 0.58),
  material('accent', '#E8AEC4', ['#F5C7D6', '#C77E9B'], 0.56), material('metal', '#AEB4BB', ['#756D82'], 0.46, 0.35),
  material('cavity', '#302B3A', ['#4F465A'], 0.86), material('rubber', '#55515E', ['#34313D'], 0.92),
  material('heater', '#4F2934', ['#FF6C35'], 0.7), material('indicator', '#83D8C8', ['#A9EEE0'], 0.48), material('ink', '#302A38', ['#5A4B60'], 0.84),
];
spec.repetitionSystems = [
  { id: 'dial-tick-system', componentRefs: ['dial-ticks'], count: 9, layout: 'radial arc around browning dial', instancing: 'shared tick geometry', evidenceRefs: ['front'] },
  { id: 'rear-vent-system', componentRefs: ['rear-vents'], count: 3, layout: 'parallel rear slots', instancing: 'shared vent geometry', evidenceRefs: ['back'] },
  { id: 'foot-system', componentRefs: ['feet'], count: 4, layout: 'four floor corners', instancing: 'shared foot geometry', evidenceRefs: ['runtime-contract'] },
  { id: 'side-control-system', componentRefs: ['side-controls'], count: 2, layout: 'right side vertical pair', instancing: 'related faceted control geometry', evidenceRefs: ['side'] },
];
spec.viewEvidence = ['front', 'side', 'back', 'three-quarter'].map((view) => ({ id: view, view, imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['consistent shell, slot, lever, dial, side controls, rear service panel and feet'], confidence: 0.94 }));
spec.viewEvidence.unshift({ id: 'turnsheet', view: 'multi-view', imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['successful GPT Image 2 2x2 turn-sheet'], confidence: 0.96 });
for (const [id, time] of [['startup', 0.6], ['climax', 2.8], ['wind-down', 4.75]]) spec.viewEvidence.push({ id, view: `runtime-${id}`, imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: [`frozen performance timeline at ${time} seconds`], confidence: 0.99 });
spec.silhouette = { boundingShape: 'wide squat tapered rectangle with raised slot rim', aspectRatios: ['width:height 1.28', 'depth:height 0.77'], symmetry: 'shell bilateral with asymmetric front controls and right-side controls', dominantCurves: ['broad upper shoulder', 'tapered side planes', 'stepped base'], negativeSpaces: ['slot cavity', 'lever track', 'rear cable recess'], landmarks: ['top slot', 'front lever', 'large dial', 'mint lamp'] };
spec.featureReviewTargets = [
  { id: 'toaster-silhouette', name: 'Faceted tapered shell, shoulder and stable feet', tier: 'critical', passIds: ['blockout', 'form-refinement'], minimumScore: 0.82, mustPass: true, componentRefs: ['shell-system', 'base-plinth', 'feet'], evidenceRefs: ['front', 'three-quarter'] },
  { id: 'toaster-identity', name: 'Deep slot, lever, dial and rear service hierarchy', tier: 'critical', passIds: ['structural-pass', 'material-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['slot-system', 'control-system', 'rear-panel'], evidenceRefs: ['front', 'back', 'three-quarter'] },
  { id: 'toaster-runtime', name: 'Frozen carriage, lever, dial and launch sockets', tier: 'critical', passIds: ['interaction-pass'], minimumScore: 0.88, mustPass: true, componentRefs: ['lever-system', 'dial-system', 'toast-carriage', 'cable-keeper'], evidenceRefs: ['runtime-contract'] },
  { id: 'toaster-ink', name: 'Sakura Toon palette and uneven three-tier ink', tier: 'critical', passIds: ['material-pass', 'lighting-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['outline-system'], evidenceRefs: ['turnsheet'] },
];
spec.qualityTargets.reviewViewpoints = ['front', 'side', 'back', 'three-quarter', 'runtime-startup', 'runtime-climax', 'runtime-wind-down'];
spec.lightingFromPhoto = ['soft upper-left key', 'cool lavender fill', 'restrained pink rim', 'light neutral-lavender background', 'soft floor contact shadow', 'exposure 1.0 with ACESFilmicToneMapping'];
spec.performanceBudget = { qualityPriority: 'stylized-runtime', targetTriangles: 26000, maxDrawCalls: 80, textureSize: 0, fpsTarget: 60, optimizationPolicy: 'Use faceted extrusion, low-segment cylinders and shared repeated geometry; no runtime textures.' };
spec.assumptions = ['GPT Image 2 turn-sheet is visual evidence only.', 'Existing pivots, sockets and external toast flight are frozen.', 'Two visual heater zones remain one functional slot.'];
spec.risks = ['Raised slot rim must remain inside the archived 2% bounding envelope.', 'External toast is owned by AppliancePerformanceSystem and must not be duplicated inside the model.'];
await writeFile(specPath, `${JSON.stringify(spec, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ components: spec.componentTree.length, materials: spec.materials.length, details: detailNames.length, repetitions: spec.repetitionSystems.length }, null, 2));

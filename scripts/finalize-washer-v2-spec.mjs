import { readFile, writeFile } from 'node:fs/promises';

const specPath = 'docs/sculpt-specs-v2/washer/object-sculpt-spec.json';
const spec = JSON.parse(await readFile(specPath, 'utf8'));
const clone = (value) => JSON.parse(JSON.stringify(value));
const rootTemplate = spec.componentTree[0];
const materialTemplate = spec.materials[0];

spec.targetName = 'SAKURA Washer v2';
spec.targetId = 'washer-v2';
spec.sourceImage = 'references/intake-v2/washer/views/front.png';
spec.sourceImages = ['front', 'side', 'back', 'three-quarter'].map((view) => `references/intake-v2/washer/views/${view}.png`);
spec.suitability = 'pass';
spec.scores = { object_isolation: 3, silhouette_readability: 3, depth_inference: 3, primitive_decomposition: 3, material_procedurality: 3, occlusion_risk: 2, interaction_fit: 3 };
spec.preSpecAssessment.objectClass = {
  primaryType: 'front-load-washing-machine', primaryDomain: 'object',
  formLanguage: ['stylized-low-poly', 'faceted-hard-surface', 'exaggerated-functional-porthole'],
  structureKind: ['eight-plane-cabinet', 'layered-control-band', 'hinged-door', 'deep-rotating-drum'],
  motionPotential: ['drum-tumble', 'high-spin', 'rigid-body-imbalance', 'door-hinge', 'drawer-travel'],
  materialFamilies: ['matte-cream-polymer', 'sakura-pink-polymer', 'dark-rubber', 'tinted-glass', 'satin-metal'],
  notes: 'Observed across an admitted GPT Image 2 four-view turn-sheet; archived animation anchors remain authoritative.',
};
spec.preSpecAssessment.complexity.scores = { silhouetteComplexity: 3, componentCount: 3, hierarchyDepth: 3, repetitionDensity: 3, materialLayerCount: 3, localDetailDensity: 3, occlusionRisk: 3, actionReadinessNeed: 3 };
spec.preSpecAssessment.estimatedCounts = { macroComponents: 5, mesoComponents: 15, microFeatureGroups: 10, materialLayers: 9, repetitionSystems: 6 };
const details = [
  'eight-plane cabinet', 'faceted pink top cap', 'layered upper control band', 'detergent drawer and handle',
  'twelve-sided program dial', 'dark display island', 'three control buttons', 'large twelve-sided door ring',
  'deep fixed rubber gasket', 'transparent faceted glass', 'right-edge door handle', 'deep sixteen-sided drum',
  'stainless drum mouth', 'three internal lifter baffles', 'twelve rear drum perforations', 'five laundry volumes',
  'seven closed suds bubbles', 'five closed glass droplets', 'paired side service stamps', 'rear pressed service panel',
  'rear drain hose and socket', 'rear power cord and socket', 'four rubber feet', 'stable three-tier uneven outline',
];
spec.preSpecAssessment.detailInventory = {
  scanMethod: 'grid-3x3-plus-runtime-contract', targetMinDetails: 16,
  note: 'Every identity or runtime feature maps to a named procedural component.',
  details: details.map((description, index) => ({
    id: `washer-detail-${index + 1}`, kind: index % 3 === 0 ? 'contour' : index % 3 === 1 ? 'bevel' : 'linework', description,
    region: { x: (index % 3) / 3, y: (index % 6) / 6, width: 0.33, height: 0.16, units: 'normalized' },
    scale: index < 9 ? 'macro' : index < 19 ? 'meso' : 'micro', affects: 'geometry, materialSurface, actionReadiness',
    mapsTo: { type: 'component.localFeatures', ref: 'root' }, evidenceRef: 'turnsheet', confidence: 0.95,
  })),
};
spec.qualityContract.minimumSpecDepth = { macroComponents: 5, mesoComponents: 12, microFeatureGroups: 8, materialLayers: 8, repetitionSystems: 6, reviewViewpoints: 7 };

function component(id, name, level, role, parent, primitive, dimensions, material, features) {
  const item = clone(rootTemplate);
  item.id = id; item.name = name; item.level = level; item.role = role; item.parent = parent;
  item.primitive = primitive === 'cluster' ? 'instanced-cluster' : primitive === 'style' ? 'box' : primitive;
  item.topologyClass = primitive === 'style' ? 'material-only' : 'assembled-solid';
  item.topologyRationale = 'Named procedural low-poly component using explicit planar, rotational or repeated construction around frozen runtime anchors.';
  item.dimensions = { ...dimensions, units: 'world', confidence: 0.95 };
  item.material = material; item.materialLayers = [material];
  item.localFeatures = features.map((feature) => ({ id: `${id}-${feature}`, name: feature, evidenceRefs: ['turnsheet'], geometry: 'explicit-named-procedural-geometry' }));
  item.colorMaterialRecipe = { dominantAlbedo: material === 'accent' ? 'rgba(232,174,196,1)' : material === 'rubber' ? 'rgba(63,57,75,1)' : 'rgba(241,233,217,1)', secondaryAlbedo: 'rgba(113,102,127,1)', materialClass: material === 'metal' ? 'metal' : material === 'glass' ? 'glass' : 'plastic', materialClassConfidence: 0.93 };
  item.surfaceDetail = { macroRoughness: 0.64, microRoughness: 0.05, bumpAmplitude: 0, normalPattern: 'faceted-object-normal', displacementPattern: 'none', occlusionPattern: 'seam-and-contact-ao', edgeWearPattern: 'stable-ink-variation', notes: 'No runtime textures.' };
  item.actionProfile = clone(rootTemplate.actionProfile); item.actionProfile.animationRole = role;
  item.actionProfile.pivot = { mode: 'named-runtime-pivot', localPosition: [0, 0, 0], axis: [0, 0, 1], confidence: 0.99 };
  item.actionProfile.collider = { type: 'compound-proxy', offset: [0, 0, 0], scale: [1, 1, 1], isTrigger: false, notes: 'Archived v1 envelope remains authoritative.' };
  item.actionProfile.destruction = { breakable: false, fractureGroup: id, seamRefs: [], detachableFragments: [], breakImpulse: 0, debrisMaterial: material };
  item.attachment = parent ? { parentSocket: `${parent}-socket`, localStart: [0, 0, 0], localEnd: [0, 0.03, 0], contactType: 'overlap', overlap: 0.03, gapTolerance: 0.01 } : null;
  item.evidenceRefs = ['turnsheet']; item.fidelityTier = 'v2'; return item;
}
spec.componentTree = [
  component('root', 'Washer frozen runtime root', 'macro', 'root', null, 'box', { width: 2.755, height: 3.06, depth: 2.6675 }, 'shell', ['floor contact', 'rigid imbalance envelope']),
  component('cabinet-system', 'Eight-plane cabinet and top cap', 'macro', 'rigid-cabinet', 'root', 'extrude', { width: 2.7, height: 3.0, depth: 2.1 }, 'shell', ['faceted corners', 'pink cap']),
  component('control-system', 'Layered upper control band', 'macro', 'controls', 'cabinet-system', 'box', { width: 2.6, height: 0.54, depth: 0.2 }, 'shell-light', ['drawer', 'dial', 'display', 'buttons']),
  component('door-system', 'Large twelve-sided hinged porthole', 'macro', 'door-hinge', 'cabinet-system', 'torus', { width: 2.14, height: 2.14, depth: 0.38 }, 'accent', ['outer ring', 'gasket', 'glass', 'handle']),
  component('drum-system', 'Deep rotating drum and tub', 'macro', 'drum-rotation', 'cabinet-system', 'cylinder', { width: 1.55, height: 1.55, depth: 0.98 }, 'metal', ['drum wall', 'back', 'mouth']),
  component('drawer', 'Detergent drawer', 'meso', 'drawer-travel', 'control-system', 'box', { width: 0.78, height: 0.27, depth: 0.11 }, 'shell-shadow', ['pink handle']),
  component('program-dial', 'Twelve-sided program dial', 'meso', 'dial-rotation', 'control-system', 'cylinder', { width: 0.48, height: 0.48, depth: 0.2 }, 'accent', ['index mark']),
  component('display-controls', 'Dark display and three buttons', 'meso', 'powered-controls', 'control-system', 'cluster', { width: 0.72, height: 0.27, depth: 0.08 }, 'display', ['mint status button']),
  component('gasket', 'Deep fixed rubber gasket', 'meso', 'door-seal', 'door-system', 'torus', { width: 1.85, height: 1.85, depth: 0.32 }, 'rubber', ['depth throat']),
  component('door-glass', 'Transparent door glass', 'meso', 'glass-plane', 'door-system', 'cylinder', { width: 1.46, height: 1.46, depth: 0.12 }, 'glass', ['no main outline']),
  component('door-handle', 'Right-edge door handle', 'meso', 'handle-travel', 'door-system', 'box', { width: 0.25, height: 0.58, depth: 0.16 }, 'accent', ['cream inset']),
  component('drum-baffles', 'Three drum lifter baffles', 'meso', 'drum-detail', 'drum-system', 'cluster', { width: 1.3, height: 1.3, depth: 0.5 }, 'shell-shadow', ['three radial paddles']),
  component('laundry-array', 'Five volumetric laundry bundles', 'meso', 'tumble-load', 'drum-system', 'cluster', { width: 1.1, height: 1.0, depth: 0.3 }, 'laundry', ['five closed icosahedra']),
  component('wet-effects', 'Closed suds and droplet rigs', 'meso', 'wet-effects', 'drum-system', 'cluster', { width: 1.2, height: 1.2, depth: 0.2 }, 'glass', ['seven suds', 'five droplets']),
  component('side-panels', 'Paired side service stamps', 'meso', 'service-panels', 'cabinet-system', 'cluster', { width: 2.72, height: 1.84, depth: 1.36 }, 'shell-shadow', ['mirrored left and right']),
  component('rear-system', 'Rear service hierarchy', 'meso', 'rear-service', 'cabinet-system', 'box', { width: 2.42, height: 2.56, depth: 0.13 }, 'shell-shadow', ['pressed panel', 'lower access']),
  component('rear-connections', 'Drain and power assemblies', 'meso', 'connections', 'rear-system', 'cluster', { width: 2.1, height: 2.0, depth: 0.2 }, 'rubber', ['hose socket', 'power socket', 'stowed plug']),
  component('feet', 'Four rigid-load feet', 'meso', 'imbalance-contact', 'root', 'cluster', { width: 2.48, height: 0.18, depth: 1.84 }, 'rubber', ['four load-responsive pads']),
  component('drum-perforations', 'Twelve drum perforations', 'micro', 'drum-detail', 'drum-system', 'cluster', { width: 1.0, height: 1.0, depth: 0.03 }, 'rubber', ['twelve radial holes']),
  component('rear-fasteners', 'Six rear fasteners', 'micro', 'service-detail', 'rear-system', 'cluster', { width: 2.2, height: 2.4, depth: 0.03 }, 'metal', ['six fasteners']),
  component('outline-system', 'Stable uneven three-tier ink', 'micro', 'outline-style', 'root', 'style', { width: 2.755, height: 3.06, depth: 2.6675 }, 'ink', ['main 0.0048', 'structure 0.0041', 'detail 0.0033', 'variation 0.18']),
];
spec.componentTree[0].localFeatures.push(...details.map((_, index) => `washer-detail-${index + 1}`));

function material(id, color, secondary, roughness, metalness = 0) {
  const item = clone(materialTemplate); item.id = id; item.name = id; item.baseColor = color; item.color = color;
  item.albedo = { dominant: color, secondary, samplingNotes: 'Observed from admitted GPT Image 2 washer turn-sheet.' };
  item.colorVariation = { palette: [color, ...secondary], pattern: 'toon-band-and-object-space-facet', amplitude: 0.12, heightCorrelation: 0.1 };
  item.roughness = { base: roughness, variation: 0.08, map: 'independent-procedural-field', localResponse: 'higher at seams' };
  item.metalness = { base: metalness, variation: 0.04 }; item.localOverrides = [{ region: 'faceted-shadow-planes', response: 'cool-lavender tint', evidenceRefs: ['turnsheet'] }];
  item.referencePbr = { usable: true, confidence: 0.84, source: 'turnsheet-observed-procedural-evidence', maps: { albedo: { path: 'procedural-independent-albedo', channel: 'albedo' }, roughness: { path: 'procedural-independent-roughness', channel: 'roughness' }, height: { path: 'none-flat-polymer', channel: 'height' }, normal: { path: 'geometry-facet-normals', channel: 'normal' }, ao: { path: 'runtime-lighting-contact-ao', channel: 'ao' } } };
  return item;
}
spec.materials = [
  material('shell', '#EEE9DF', ['#F8F1E7', '#D8D1CA'], 0.68), material('shell-light', '#F8F1E7', ['#EEE9DF'], 0.58),
  material('shell-shadow', '#D8D1CA', ['#B9B0B5'], 0.72), material('accent', '#E8AEC4', ['#F1C1D2', '#C97F9C'], 0.56),
  material('rubber', '#40394B', ['#565461'], 0.9), material('metal', '#A8A7AC', ['#666170'], 0.44, 0.32),
  material('glass', '#6D7480', ['#A9BCCB'], 0.2), material('display', '#565667', ['#83D8C8'], 0.42),
  material('laundry', '#E7BF6A', ['#F0B0B9', '#86B7B1'], 0.8), material('ink', '#302A38', ['#5A4B60'], 0.84),
];
spec.repetitionSystems = [
  { id: 'laundry-system', name: 'Five laundry volumes', componentRef: 'laundry-array', count: 5, distribution: 'inside drum', geometry: 'low-poly icosahedra', material: 'laundry', evidenceRefs: ['turnsheet'] },
  { id: 'suds-system', name: 'Seven suds bubbles', componentRef: 'wet-effects', count: 7, distribution: 'lower tub arc', geometry: 'closed spheres', material: 'glass', evidenceRefs: ['runtime-contract'] },
  { id: 'droplet-system', name: 'Five glass droplets', componentRef: 'wet-effects', count: 5, distribution: 'door plane', geometry: 'scaled closed spheres', material: 'glass', evidenceRefs: ['runtime-contract'] },
  { id: 'baffle-system', name: 'Three drum baffles', componentRef: 'drum-baffles', count: 3, distribution: 'radial', geometry: 'shared rounded boxes', material: 'shell-shadow', evidenceRefs: ['front-view'] },
  { id: 'foot-system', name: 'Four load-responsive feet', componentRef: 'feet', count: 4, distribution: 'cabinet corners', geometry: 'shared low-poly boxes', material: 'rubber', evidenceRefs: ['runtime-contract'] },
  { id: 'perforation-system', name: 'Twelve drum perforations', componentRef: 'drum-perforations', count: 12, distribution: 'radial drum back', geometry: 'shared flattened spheres', material: 'rubber', evidenceRefs: ['front-view'] },
];
spec.viewEvidence = ['front', 'side', 'back', 'three-quarter'].map((view) => ({ id: view === 'three-quarter' ? 'three-quarter-view' : `${view}-view`, view, imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['consistent cabinet, porthole, control band, feet and rear connections'], confidence: 0.95 }));
spec.viewEvidence.unshift({ id: 'turnsheet', view: 'multi-view', imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['successful GPT Image 2 four-view turn-sheet'], confidence: 0.97 });
spec.viewEvidence.push({ id: 'runtime-contract', view: 'runtime', imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['38 frozen transforms and exact reset'], confidence: 0.99 });
for (const [id, time] of [['startup', 0.6], ['climax', 2.8], ['wind-down', 4.75]]) spec.viewEvidence.push({ id, view: `runtime-${id}`, imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: [`fixed timeline at ${time} seconds`], confidence: 0.99 });
spec.silhouette = { boundingShape: 'tall near-square eight-plane cabinet with dominant twelve-sided porthole', aspectRatios: ['width:height 0.90', 'depth:height 0.87'], symmetry: 'cabinet bilateral with asymmetric drawer, display, door handle and rear connections', dominantCurves: ['large faceted door ring', 'pink top cap', 'layered control band'], negativeSpaces: ['transparent drum opening', 'door gasket throat'], landmarks: ['drawer', 'program dial', 'display', 'door handle', 'rear hoses'] };
spec.featureReviewTargets = [
  { id: 'washer-silhouette', name: 'Faceted cabinet, cap, feet and enlarged porthole', tier: 'critical', passIds: ['blockout', 'form-refinement'], minimumScore: 0.82, mustPass: true, componentRefs: ['cabinet-system', 'door-system', 'feet'], evidenceRefs: ['front-view', 'side-view', 'three-quarter-view'] },
  { id: 'washer-identity', name: 'Control band, deep drum, door layers and rear connections', tier: 'critical', passIds: ['structural-pass', 'material-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['control-system', 'door-system', 'drum-system', 'rear-connections'], evidenceRefs: ['turnsheet'] },
  { id: 'washer-runtime', name: 'Frozen tumble, wet effects, rigid imbalance and exact reset', tier: 'critical', passIds: ['interaction-pass'], minimumScore: 0.9, mustPass: true, componentRefs: ['drum-system', 'laundry-array', 'wet-effects', 'feet'], evidenceRefs: ['runtime-contract'] },
  { id: 'washer-ink', name: 'Sakura Toon palette and stable uneven ink', tier: 'critical', passIds: ['material-pass', 'lighting-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['outline-system'], evidenceRefs: ['turnsheet'] },
];
spec.qualityTargets.reviewViewpoints = ['front', 'side', 'back', 'three-quarter', 'runtime-startup', 'runtime-climax', 'runtime-wind-down'];
spec.lightingFromPhoto = ['soft upper-left key', 'cool lavender fill', 'restrained Sakura rim', 'light neutral background', 'soft contact shadow beneath all four feet on the ground plane', 'PCF ground shadow with restrained 0.20 opacity', 'ACESFilmic exposure 1.0'];
spec.performanceBudget = { qualityPriority: 'stylized-runtime', targetTriangles: 18000, maxDrawCalls: 110, textureSize: 0, fpsTarget: 60, optimizationPolicy: 'Use faceted rings, low-segment cylinders and shared repeated geometry; no runtime image textures.' };
spec.assumptions = ['GPT Image 2 turn-sheet is visual evidence only.', 'Existing pivots, sockets, wet effects and imbalance timeline are frozen.', 'The porthole grows only inside the archived total envelope.'];
spec.risks = ['Transparent glass must not hide laundry at gameplay scale.', 'Wet effects and hoses must remain free of heavy silhouette ink.', 'Door expansion must not move its right hinge or handle pivot.'];
spec.sculptPipeline.currentPass = 'blockout'; spec.sculptPipeline.completedPasses = []; spec.sculptPipeline.lastCompletedPass = null; spec.sculptPipeline.blockedReason = ''; spec.sculptPipeline.nextRequiredEvidence = ['front blockout render', 'three-quarter blockout render'];
spec.reviewHistory = []; spec.visualEvidence = [];
await writeFile(specPath, `${JSON.stringify(spec, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ specPath, components: spec.componentTree.length, materials: spec.materials.length, details: details.length, repetitions: spec.repetitionSystems.length }, null, 2));

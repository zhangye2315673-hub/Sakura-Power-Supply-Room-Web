import { readFile, writeFile } from 'node:fs/promises';

const specPath = 'docs/sculpt-specs-v2/robot-vacuum/object-sculpt-spec.json';
const spec = JSON.parse(await readFile(specPath, 'utf8'));
const clone = (value) => JSON.parse(JSON.stringify(value));
const rootTemplate = spec.componentTree[0];
const materialTemplate = spec.materials[0];

spec.suitability = 'pass';
spec.scores = { object_isolation: 3, silhouette_readability: 3, depth_inference: 3, primitive_decomposition: 3, material_procedurality: 3, occlusion_risk: 2, interaction_fit: 3 };
spec.preSpecAssessment.objectClass = {
  primaryType: 'robot-vacuum', primaryDomain: 'object',
  formLanguage: ['stylized-low-poly', 'faceted-hard-surface', 'exaggerated-functional-silhouette'],
  structureKind: ['assembled-disc-chassis', 'independent-bumper', 'rotating-lidar', 'underside-cleaning-rig'],
  motionPotential: ['large-circle-motion', 'bumper-press', 'lidar-rotation', 'wheel-rotation', 'roller-rotation', 'dual-side-brush-rotation'],
  materialFamilies: ['matte-cream-polymer', 'sakura-pink-polymer', 'cool-plum-rubber', 'dark-optical-sensor', 'cool-grey-metal'],
  notes: 'Observed across an admitted GPT Image 2 four-view turn-sheet; all runtime anchors are frozen to the existing robot-vacuum performance contract.',
};
spec.preSpecAssessment.complexity.scores = { silhouetteComplexity: 3, componentCount: 3, hierarchyDepth: 3, repetitionDensity: 3, materialLayerCount: 3, localDetailDensity: 3, occlusionRisk: 3, actionReadinessNeed: 3 };
spec.preSpecAssessment.estimatedCounts = { macroComponents: 4, mesoComponents: 12, microFeatureGroups: 9, materialLayers: 7, repetitionSystems: 5 };
const detailNames = [
  '12-sided low disc chassis', 'recessed dark lower skirt', 'stepped cream top shoulder', 'broad faceted pink cover',
  'independent front semicircle bumper', 'thick curved sensor band', 'paired bumper end splits', 'recessed LiDAR seat',
  'enlarged faceted LiDAR tower', 'dark LiDAR optical window', 'pink LiDAR cap and status ring', 'paired top buttons and glyphs',
  'front caster', 'paired charging contacts', 'two drive wheels with four tread rings each', 'central eight-fin roller brush',
  'two separate three-arm side brushes', 'four cliff sensor windows', 'eight underside fasteners', 'stable three-tier uneven outline',
];
spec.preSpecAssessment.detailInventory = {
  scanMethod: 'grid-3x3-plus-runtime-contract', targetMinDetails: 16,
  note: 'Every visible or runtime-critical detail maps to a named procedural component or repetition system.',
  details: detailNames.map((name, index) => ({
    id: `robot-vacuum-detail-${index + 1}`, kind: index % 3 === 0 ? 'contour' : index % 3 === 1 ? 'bevel' : 'linework',
    description: name, region: { x: (index % 3) / 3, y: (index % 6) / 6, width: 0.33, height: 0.16, units: 'normalized' },
    scale: index < 7 ? 'macro' : index < 13 ? 'meso' : 'micro', affects: 'geometry, materialSurface, actionReadiness',
    mapsTo: { type: 'component.localFeatures', ref: 'root' }, evidenceRef: 'turnsheet', confidence: 0.94,
  })),
};
spec.qualityContract.minimumSpecDepth = { macroComponents: 4, mesoComponents: 10, microFeatureGroups: 8, materialLayers: 6, repetitionSystems: 4, reviewViewpoints: 7 };

const component = (id, name, level, role, parent, primitive, dimensions, material, features, attachment = null) => {
  const item = clone(rootTemplate);
  item.id = id; item.name = name; item.level = level; item.role = role; item.parent = parent;
  item.primitive = primitive === 'cluster' ? 'instanced-cluster' : primitive === 'style' ? 'box' : primitive;
  item.topologyClass = primitive === 'style' ? 'material-only' : 'assembled-solid';
  item.topologyRationale = 'Procedural low-poly component with explicit facets and frozen runtime anchors.';
  item.dimensions = { ...dimensions, units: 'world', confidence: 0.94 };
  item.material = material; item.materialLayers = [material];
  item.localFeatures = features.map((feature) => ({ id: `${id}-${feature}`, name: feature, evidenceRefs: ['turnsheet'], geometry: 'explicit-named-mesh-or-shared-procedural-geometry' }));
  item.colorMaterialRecipe = { dominantAlbedo: material === 'accent' ? 'rgba(232,174,196,1)' : material === 'sensor' ? 'rgba(63,65,76,1)' : 'rgba(244,238,226,1)', secondaryAlbedo: 'rgba(113,102,127,1)', materialClass: material === 'metal' ? 'metal' : 'plastic', materialClassConfidence: 0.92 };
  item.surfaceDetail = { macroRoughness: 0.64, microRoughness: 0.05, bumpAmplitude: 0, normalPattern: 'faceted-object-normal', displacementPattern: 'none', occlusionPattern: 'seam-and-contact-ao', edgeWearPattern: 'stable-ink-variation', notes: 'No runtime textures.' };
  item.actionProfile = clone(rootTemplate.actionProfile);
  item.actionProfile.animationRole = role;
  item.actionProfile.pivot = { mode: 'named-runtime-pivot', localPosition: [0, 0, 0], axis: [0, 1, 0], confidence: 0.99 };
  item.actionProfile.collider = { type: 'compound-proxy', offset: [0, 0, 0], scale: [1, 1, 1], isTrigger: false, notes: 'Archived v1 envelope remains authoritative.' };
  item.actionProfile.destruction = { breakable: false, fractureGroup: id, seamRefs: [], detachableFragments: [], breakImpulse: 0, debrisMaterial: material };
  item.attachment = attachment ?? (parent ? { parentSocket: `${parent}-socket`, localStart: [0, 0, 0], localEnd: [0, 0.03, 0], contactType: 'overlap', overlap: 0.03, gapTolerance: 0.01 } : null);
  item.evidenceRefs = ['turnsheet']; item.fidelityTier = 'v2';
  return item;
};

spec.componentTree = [
  component('root', 'Robot vacuum frozen runtime root', 'macro', 'root', null, 'cylinder', { width: 2.02, height: 0.67, depth: 2.02 }, 'shell', ['floor contact', 'connection envelope']),
  component('chassis', 'Twelve-sided stepped chassis', 'macro', 'chassis', 'root', 'cylinder', { width: 1.92, height: 0.49, depth: 1.92 }, 'shell', ['low disc', 'rubber skirt', 'cream shoulder']),
  component('top-system', 'Faceted pink top and LiDAR system', 'macro', 'top-assembly', 'chassis', 'cylinder', { width: 1.86, height: 0.38, depth: 1.86 }, 'accent', ['broad cover', 'two buttons', 'enlarged LiDAR']),
  component('cleaning-system', 'Action-ready underside cleaning rig', 'macro', 'underside', 'chassis', 'cylinder', { width: 1.78, height: 0.28, depth: 1.78 }, 'rubber', ['wheels', 'caster', 'roller', 'dual edge brushes']),
  component('bumper', 'Independent front bumper shell', 'meso', 'bumper', 'chassis', 'curve-sweep', { width: 2.02, height: 0.22, depth: 0.22 }, 'shell', ['semicircle arc', 'end splits', 'press travel']),
  component('sensor-band', 'Thick front optical band', 'meso', 'sensor', 'bumper', 'curve-sweep', { width: 1.98, height: 0.11, depth: 0.05 }, 'sensor', ['dark curved window']),
  component('lidar', 'Enlarged rotating LiDAR turret', 'meso', 'lidar-rotation', 'top-system', 'cylinder', { width: 0.46, height: 0.23, depth: 0.46 }, 'shell-light', ['recessed seat', 'window', 'cap', 'status ring']),
  component('button-cluster', 'Paired top control buttons', 'meso', 'button-rotation', 'top-system', 'cylinder', { width: 0.12, height: 0.03, depth: 0.27 }, 'accent', ['power glyph', 'home glyph']),
  component('drive-wheels', 'Paired drive wheel assemblies', 'meso', 'wheel-rotation', 'cleaning-system', 'cluster', { width: 1.3, height: 0.29, depth: 0.2 }, 'rubber', ['four tread rings per wheel']),
  component('main-brush', 'Central eight-fin roller brush', 'meso', 'roller-rotation', 'cleaning-system', 'cylinder', { width: 0.58, height: 0.16, depth: 0.16 }, 'brush', ['eight alternating fins']),
  component('side-brushes', 'Left and right three-arm side brushes', 'meso', 'side-brush-rotation', 'cleaning-system', 'cluster', { width: 1.52, height: 0.06, depth: 0.83 }, 'brush', ['two hubs', 'six arms', 'eighteen bristles']),
  component('caster', 'Front caster wheel', 'meso', 'floor-contact', 'cleaning-system', 'sphere', { width: 0.11, height: 0.09, depth: 0.16 }, 'rubber', ['squashed wheel']),
  component('contacts', 'Paired charging contacts', 'meso', 'charging', 'cleaning-system', 'cluster', { width: 0.51, height: 0.03, depth: 0.11 }, 'metal', ['two plates']),
  component('underside-details', 'Fasteners and cliff sensors', 'meso', 'underside-detail', 'cleaning-system', 'cluster', { width: 1.4, height: 0.03, depth: 1.4 }, 'sensor', ['eight fasteners', 'four cliff sensors']),
  component('outline-system', 'Stable uneven three-tier outline', 'micro', 'outline-style', 'root', 'style', { width: 2.02, height: 0.67, depth: 2.02 }, 'ink', ['main 0.0048', 'structure 0.0041', 'detail 0.0033', 'variation 0.18']),
];
spec.componentTree[0].localFeatures.push(...spec.preSpecAssessment.detailInventory.details.map((detail) => detail.id));

const material = (id, color, secondary, roughness, metalness = 0) => {
  const item = clone(materialTemplate); item.id = id; item.name = id; item.baseColor = color; item.color = color;
  item.albedo = { dominant: color, secondary, samplingNotes: 'Observed from GPT Image 2 robot-vacuum turn-sheet.' };
  item.colorVariation = { palette: [color, ...secondary], pattern: 'toon-band-and-object-space-facet', amplitude: 0.12, heightCorrelation: 0.1 };
  item.roughness = { base: roughness, variation: 0.08, map: 'independent-procedural-field', localResponse: 'higher at seams' };
  item.metalness = { base: metalness, variation: 0.04 }; item.localOverrides = [{ region: 'faceted-shadow-planes', response: 'cool-lavender tint', evidenceRefs: ['turnsheet'] }];
  item.referencePbr = { usable: true, confidence: 0.84, source: 'turnsheet-observed-procedural-evidence', maps: {
    albedo: { path: 'procedural-independent-albedo', channel: 'albedo' }, roughness: { path: 'procedural-independent-roughness', channel: 'roughness' },
    height: { path: 'none-flat-polymer', channel: 'height' }, normal: { path: 'geometry-facet-normals', channel: 'normal' }, ao: { path: 'runtime-lighting-contact-ao', channel: 'ao' },
  } };
  item.notes = 'Runtime uses procedural Toon shading and no image textures.'; return item;
};
spec.materials = [
  material('shell', '#F4EEE2', ['#FFF8EB', '#D7C9C3'], 0.68), material('shell-light', '#FFF8EB', ['#F4EEE2'], 0.58),
  material('accent', '#E8AEC4', ['#F5C7D6', '#C77E9B'], 0.56), material('sensor', '#3F414C', ['#2E2B38'], 0.82),
  material('rubber', '#56545F', ['#34313D'], 0.92), material('brush', '#393844', ['#25232D'], 0.88),
  material('metal', '#A6A4AA', ['#6D6874'], 0.48, 0.42), material('ink', '#302A38', ['#5A4B60'], 0.84),
];
spec.repetitionSystems = [
  { id: 'drive-wheel-system', componentRefs: ['drive-wheels'], count: 2, layout: 'frozen left/right wheel pivots', instancing: 'shared wheel and tread language', evidenceRefs: ['runtime-contract'] },
  { id: 'side-brush-system', componentRefs: ['side-brushes'], count: 2, layout: 'frozen left/right front underside pivots', instancing: 'shared three-arm brush construction', evidenceRefs: ['runtime-contract'] },
  { id: 'side-brush-arm-system', componentRefs: ['side-brushes'], count: 6, layout: 'three radial arms per side', instancing: 'shared arm geometry', evidenceRefs: ['runtime-contract'] },
  { id: 'side-brush-bristle-system', componentRefs: ['side-brushes'], count: 18, layout: 'three bristles per arm', instancing: 'shared bristle geometry', evidenceRefs: ['runtime-contract'] },
  { id: 'roller-fin-system', componentRefs: ['main-brush'], count: 8, layout: 'radial roller fins', instancing: 'shared fin geometry', evidenceRefs: ['runtime-contract'] },
  { id: 'underside-fastener-system', componentRefs: ['underside-details'], count: 8, layout: 'perimeter radial', instancing: 'shared fastener geometry', evidenceRefs: ['turnsheet'] },
  { id: 'cliff-sensor-system', componentRefs: ['underside-details'], count: 4, layout: 'perimeter optical windows', instancing: 'shared sensor geometry', evidenceRefs: ['turnsheet'] },
];
spec.viewEvidence = ['front', 'side', 'back', 'three-quarter'].map((view) => ({ id: view, view, imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['consistent chassis, top cover, LiDAR, controls, bumper, wheels and dual side brushes'], confidence: 0.94 }));
spec.viewEvidence.unshift({ id: 'turnsheet', view: 'multi-view', imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['successful GPT Image 2 2x2 turn-sheet'], confidence: 0.96 });
for (const [id, time] of [['startup', 0.6], ['climax', 2.8], ['wind-down', 4.75]]) {
  spec.viewEvidence.push({ id, view: `runtime-${id}`, imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: [`frozen performance timeline at ${time} seconds`], confidence: 0.99 });
}
spec.silhouette = { boundingShape: 'low twelve-sided disc with rear-biased turret', aspectRatios: ['diameter:body-height 3.3', 'width:depth 1.0'], symmetry: 'bilateral chassis with asymmetric LiDAR optical direction', dominantCurves: ['front bumper arc', 'stepped shoulder', 'broad top plate'], negativeSpaces: ['side brush arm gaps', 'wheel recesses'], landmarks: ['dark front band', 'pink top plate', 'LiDAR turret', 'paired buttons'] };
spec.featureReviewTargets = [
  { id: 'robot-vacuum-silhouette', name: 'Low faceted disc, stepped rim and floor stance', tier: 'critical', passIds: ['blockout', 'form-refinement'], minimumScore: 0.82, mustPass: true, componentRefs: ['chassis', 'top-system', 'bumper'], evidenceRefs: ['front', 'three-quarter'] },
  { id: 'robot-vacuum-identity', name: 'Front sensor band, enlarged LiDAR and paired controls', tier: 'critical', passIds: ['structural-pass', 'material-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['sensor-band', 'lidar', 'button-cluster'], evidenceRefs: ['front', 'side', 'three-quarter'] },
  { id: 'robot-vacuum-runtime', name: 'Frozen bumper, wheel, roller and dual side brush anchors', tier: 'critical', passIds: ['interaction-pass'], minimumScore: 0.86, mustPass: true, componentRefs: ['bumper', 'drive-wheels', 'main-brush', 'side-brushes'], evidenceRefs: ['runtime-contract'] },
  { id: 'robot-vacuum-ink', name: 'Sakura Toon palette and uneven three-tier ink', tier: 'critical', passIds: ['material-pass', 'lighting-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['outline-system'], evidenceRefs: ['turnsheet'] },
];
spec.qualityTargets.reviewViewpoints = ['front', 'side', 'back', 'three-quarter', 'runtime-startup', 'runtime-climax', 'runtime-wind-down'];
spec.lightingFromPhoto = ['soft upper-left key', 'cool lavender fill', 'restrained pink rim', 'light neutral-lavender background', 'soft floor contact shadow', 'exposure 1.0 with ACESFilmicToneMapping'];
spec.performanceBudget = { qualityPriority: 'stylized-runtime', targetTriangles: 34000, maxDrawCalls: 120, textureSize: 0, fpsTarget: 60, optimizationPolicy: 'Use low segment counts and shared repeated geometry; no runtime textures.' };
spec.assumptions = ['GPT Image 2 turn-sheet is visual evidence only.', 'Existing pivots, sockets, effects and timeline are frozen.', 'Hidden internal cleaner mechanisms are omitted.'];
spec.risks = ['Side brushes exceed the chassis silhouette by design but remain within the archived v1 dynamic visual envelope.', 'Whole-sheet admission is not applicable to a four-panel layout; each crop is admitted independently.'];
await writeFile(specPath, `${JSON.stringify(spec, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ components: spec.componentTree.length, materials: spec.materials.length, details: detailNames.length, repetitions: spec.repetitionSystems.length }, null, 2));

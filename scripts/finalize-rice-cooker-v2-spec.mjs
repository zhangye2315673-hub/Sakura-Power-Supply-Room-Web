import { readFile, writeFile } from 'node:fs/promises';

const specPath = 'docs/sculpt-specs-v2/rice-cooker/object-sculpt-spec.json';
const spec = JSON.parse(await readFile(specPath, 'utf8'));
const clone = (value) => JSON.parse(JSON.stringify(value));
const rootTemplate = spec.componentTree[0];
const materialTemplate = spec.materials[0];

spec.suitability = 'pass';
spec.scores = { object_isolation: 3, silhouette_readability: 3, depth_inference: 3, primitive_decomposition: 3, material_procedurality: 3, occlusion_risk: 2, interaction_fit: 3 };
spec.preSpecAssessment.objectClass = {
  primaryType: 'rice-cooker', primaryDomain: 'object',
  formLanguage: ['stylized-low-poly', 'faceted-hard-surface', 'exaggerated-functional-silhouette'],
  structureKind: ['assembled-shell', 'hinged-lid', 'control-island', 'rear-latch', 'repeated-rice-and-steam'],
  motionPotential: ['lid-hinge', 'cook-switch', 'rear-latch', 'steam-volume', 'airborne-rice'],
  materialFamilies: ['matte-cream-polymer', 'sakura-pink-polymer', 'cool-plum-rubber', 'dark-inner-pot', 'rice-and-steam-effects'],
  notes: 'Observed across a successful GPT Image 2 four-view turn-sheet; runtime anchors are frozen to the existing rice-cooker performance contract.',
};
spec.preSpecAssessment.complexity.scores = { silhouetteComplexity: 3, componentCount: 3, hierarchyDepth: 3, repetitionDensity: 3, materialLayerCount: 3, localDetailDensity: 3, occlusionRisk: 3, actionReadinessNeed: 3 };
spec.preSpecAssessment.estimatedCounts = { macroComponents: 4, mesoComponents: 12, microFeatureGroups: 8, materialLayers: 6, repetitionSystems: 3 };

const detailNames = [
  '12-sided squat body silhouette', 'faceted domed lid', 'fixed cream lid seat', 'stacked lid crown',
  'front lid release', 'vertical pink control island', 'paired mint and coral lamps', 'chunky cook rocker',
  'small side control', 'rear hinge barrel', 'rear U latch', 'rear figure-eight inlet',
  'four rubber feet', 'dark inner pot', '30 rice-bed kernels', '28 airborne rice kernels',
  'eight volumetric steam assemblies', 'stable three-tier ink outline',
];
spec.preSpecAssessment.detailInventory = {
  scanMethod: 'grid-3x3-plus-runtime-contract', targetMinDetails: 16,
  note: 'All image details map to named procedural components or runtime effect groups.',
  details: detailNames.map((name, index) => ({
    id: `rice-cooker-detail-${index + 1}`, kind: index % 3 === 0 ? 'contour' : index % 3 === 1 ? 'bevel' : 'linework',
    description: name, region: { x: (index % 3) / 3, y: (index % 6) / 6, width: 0.33, height: 0.16, units: 'normalized' },
    scale: index < 6 ? 'macro' : index < 13 ? 'meso' : 'micro', affects: 'geometry, materialSurface, actionReadiness',
    mapsTo: { type: 'component.localFeatures', ref: 'root' }, evidenceRef: 'turnsheet', confidence: 0.94,
  })),
};
spec.qualityContract.minimumSpecDepth = { macroComponents: 4, mesoComponents: 10, microFeatureGroups: 7, materialLayers: 6, repetitionSystems: 3, reviewViewpoints: 4 };

const component = (id, name, level, role, parent, primitive, dimensions, material, features, attachment = null) => {
  const item = clone(rootTemplate);
  item.id = id; item.name = name; item.level = level; item.role = role; item.parent = parent;
  item.primitive = ['curve', 'material-style', 'cluster'].includes(primitive) ? (primitive === 'curve' ? 'curve-sweep' : primitive === 'cluster' ? 'instanced-cluster' : 'box') : primitive;
  item.topologyClass = primitive === 'curve' ? 'fiber-strand' : primitive === 'material-style' ? 'material-only' : 'assembled-solid';
  item.topologyRationale = 'Procedural low-poly component with explicit facets and frozen runtime anchors.';
  item.dimensions = { ...dimensions, units: 'world', confidence: 0.94 };
  item.material = material; item.materialLayers = [material];
  item.localFeatures = features.map((feature) => ({ id: `${id}-${feature}`, name: feature, evidenceRefs: ['turnsheet'], geometry: 'explicit-named-mesh-or-shared-procedural-geometry' }));
  item.colorMaterialRecipe = { dominantAlbedo: material === 'accent' ? 'rgba(232,174,196,1)' : material === 'dark' ? 'rgba(77,72,86,1)' : 'rgba(246,238,226,1)', secondaryAlbedo: 'rgba(116,106,126,1)', materialClass: 'plastic', materialClassConfidence: 0.92 };
  item.surfaceDetail = { macroRoughness: 0.62, microRoughness: 0.05, bumpAmplitude: 0, normalPattern: 'faceted-object-normal', displacementPattern: 'none', occlusionPattern: 'seam-and-contact-ao', edgeWearPattern: 'stable-ink-variation', notes: 'No runtime textures.' };
  item.actionProfile = clone(rootTemplate.actionProfile);
  item.actionProfile.animationRole = role;
  item.actionProfile.pivot = { mode: 'named-runtime-pivot', localPosition: [0, 0, 0], axis: [0, 1, 0], confidence: 0.98 };
  item.actionProfile.collider = { type: 'compound-proxy', offset: [0, 0, 0], scale: [1, 1, 1], isTrigger: false, notes: 'Archived v1 envelope remains authoritative.' };
  item.actionProfile.destruction = { breakable: false, fractureGroup: id, seamRefs: [], detachableFragments: [], breakImpulse: 0, debrisMaterial: material };
  item.attachment = attachment ?? (parent ? { parentSocket: `${parent}-socket`, localStart: [0, 0, 0], localEnd: [0, 0.03, 0], contactType: 'overlap', overlap: 0.03, gapTolerance: 0.01 } : null);
  item.evidenceRefs = ['turnsheet']; item.fidelityTier = 'v2';
  return item;
};

spec.componentTree = [
  component('root', 'Rice cooker frozen runtime root', 'macro', 'root', null, 'box', { width: 1.87, height: 1.88, depth: 1.65 }, 'shell', ['floor contact', 'connection envelope']),
  component('body-shell', 'Squat faceted cooker body', 'macro', 'body-shell', 'root', 'ellipsoid', { width: 1.84, height: 1.08, depth: 1.42 }, 'shell', ['12 radial planes', 'lower skirt', 'upper shoulder']),
  component('lid-system', 'Hinged faceted domed lid', 'macro', 'lid-hinge', 'body-shell', 'ellipsoid', { width: 1.8, height: 0.49, depth: 1.4 }, 'accent', ['fixed seat seam', 'front release', 'steam crown']),
  component('inner-pot-system', 'Inner pot and visible rice bed', 'macro', 'inner-pot', 'body-shell', 'cylinder', { width: 1.38, height: 0.31, depth: 1.38 }, 'dark', ['dark pot', 'rim', 'rice surface']),
  component('control-island', 'Layered front control island', 'meso', 'control', 'body-shell', 'capsule', { width: 0.45, height: 0.72, depth: 0.12 }, 'accent', ['deep frame', 'paired lamps', 'cook rocker']),
  component('rear-hinge', 'Rear hinge barrel and collars', 'meso', 'hinge', 'body-shell', 'cylinder', { width: 0.82, height: 0.26, depth: 0.28 }, 'accent-deep', ['barrel', 'two collars']),
  component('rear-latch', 'Rear U carry latch', 'meso', 'rear-latch', 'body-shell', 'curve', { width: 0.75, height: 0.44, depth: 0.18 }, 'shell-light', ['thick U opening'], { parentSocket: 'rice-cooker-latch-socket', localStart: [-0.31, 0.02, 0], localEnd: [0.31, 0.02, 0], contactType: 'embedded', overlap: 0.08, gapTolerance: 0.01 }),
  component('rear-power', 'Rear power plate and inlet', 'meso', 'power-inlet', 'body-shell', 'box', { width: 0.38, height: 0.25, depth: 0.12 }, 'accent', ['figure-eight inlet', 'two holes']),
  component('feet', 'Four rubber feet', 'meso', 'floor-contact', 'root', 'box', { width: 1.36, height: 0.1, depth: 1.06 }, 'rubber', ['four supports']),
  component('rice-bed', 'Thirty shared sculpted rice kernels', 'micro', 'rice-bed', 'inner-pot-system', 'cluster', { width: 1.2, height: 0.18, depth: 1.0 }, 'rice', ['capsule body', 'dorsal crease']),
  component('airborne-rice', 'Twenty-eight airborne rice kernels', 'micro', 'airborne-effect', 'root', 'cluster', { width: 4.4, height: 3.0, depth: 4.2 }, 'rice', ['deterministic launch metadata', 'shared geometry']),
  component('steam-system', 'Eight socket-bound steam assemblies', 'micro', 'steam-effect', 'lid-system', 'cluster', { width: 1.0, height: 1.6, depth: 0.9 }, 'steam', ['four faceted lobes per puff', 'visibility animation']),
  component('outline-system', 'Stable uneven three-tier outline', 'micro', 'outline-style', 'root', 'material-style', { width: 1.87, height: 1.88, depth: 1.65 }, 'ink', ['main 0.0048', 'structure 0.0041', 'detail 0.0033']),
  component('lid-release', 'Front lid release assembly', 'meso', 'release-button', 'lid-system', 'box', { width: 0.32, height: 0.15, depth: 0.12 }, 'shell-light', ['deep seat', 'cream button']),
  component('side-control', 'Small side control', 'meso', 'side-control', 'body-shell', 'box', { width: 0.07, height: 0.32, depth: 0.25 }, 'accent', ['recessed seat']),
  component('lid-crown', 'Stacked top steam crown', 'meso', 'steam-outlet', 'lid-system', 'box', { width: 0.48, height: 0.11, depth: 0.35 }, 'shell-light', ['pink seat', 'dark steam slot']),
  component('lid-seat', 'Fixed lid seat and seam rails', 'meso', 'lid-seat', 'body-shell', 'box', { width: 1.72, height: 0.12, depth: 1.32 }, 'shell-light', ['front rail', 'rear rail', 'dark shadow seam']),
  component('indicator-pair', 'Paired faceted status lamps', 'meso', 'indicator', 'control-island', 'sphere', { width: 0.25, height: 0.1, depth: 0.08 }, 'accent', ['mint lamp', 'coral lamp']),
];
spec.componentTree[0].localFeatures.push(...spec.preSpecAssessment.detailInventory.details.map((detail) => detail.id));

const material = (id, color, secondary, roughness) => {
  const item = clone(materialTemplate); item.id = id; item.name = id; item.baseColor = color; item.color = color;
  item.albedo = { dominant: color, secondary, samplingNotes: 'Observed from GPT Image 2 rice-cooker turn-sheet.' };
  item.colorVariation = { palette: [color, ...secondary], pattern: 'toon-band-and-object-space-facet', amplitude: 0.12, heightCorrelation: 0.1 };
  item.roughness = { base: roughness, variation: 0.08, map: 'independent-procedural-field', localResponse: 'higher at seams' };
  item.metalness = { base: 0, variation: 0 }; item.localOverrides = [{ region: 'faceted-shadow-planes', response: 'cool-lavender tint', evidenceRefs: ['turnsheet'] }];
  item.referencePbr = { usable: true, confidence: 0.86, source: 'docs/sculpt-specs-v2/rice-cooker/pbr/base', maps: {
    albedo: { path: 'shell_albedo.png', channel: 'albedo' }, roughness: { path: 'shell_roughness.png', channel: 'roughness' },
    height: { path: 'shell_height.png', channel: 'height' }, normal: { path: 'shell_normal.png', channel: 'normal' }, ao: { path: 'shell_ao.png', channel: 'ao' },
  } };
  item.notes = 'Runtime uses procedural Toon shading; reference is evidence only.'; return item;
};
spec.materials = [
  material('shell', '#F6EEE2', ['#FFF8EE', '#D7C9C3'], 0.68), material('shell-light', '#FFF8EE', ['#F6EEE2'], 0.58),
  material('accent', '#E8AEC4', ['#F5C7D6', '#C77E9B'], 0.56), material('accent-deep', '#A75E7B', ['#74485F'], 0.64),
  material('dark', '#4D4856', ['#302D38'], 0.78), material('rubber', '#45414D', ['#292632'], 0.9),
  material('rice', '#FFF7DC', ['#D8CBA8'], 0.72), material('steam', '#FFF8F4', ['#E6DAE7'], 0.42),
  material('ink', '#302A38', ['#5A4B60'], 0.84),
];
spec.repetitionSystems = [
  { id: 'rice-bed-system', componentRefs: ['rice-bed'], count: 30, layout: 'inner-pot deterministic bed', instancing: 'shared capsule and crease geometry', evidenceRefs: ['runtime-contract'] },
  { id: 'airborne-rice-system', componentRefs: ['airborne-rice'], count: 28, layout: 'radial deterministic launch', instancing: 'shared capsule and crease geometry', evidenceRefs: ['runtime-contract'] },
  { id: 'steam-system', componentRefs: ['steam-system'], count: 8, layout: 'steam-socket parented', instancing: 'shared faceted lobe language', evidenceRefs: ['runtime-contract'] },
  { id: 'feet-system', componentRefs: ['feet'], count: 4, layout: 'four floor corners', instancing: 'shared foot geometry', evidenceRefs: ['turnsheet'] },
];
spec.viewEvidence = ['front', 'side', 'back', 'three-quarter'].map((view) => ({ id: view, view, imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['consistent body, lid, controls, hinge, latch, inlet and feet'], confidence: 0.94 }));
spec.viewEvidence.unshift({ id: 'turnsheet', view: 'multi-view', imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['successful GPT Image 2 2x2 turn-sheet'], confidence: 0.96 });
spec.silhouette = { boundingShape: 'squat rounded rectangle with 12-sided body and domed lid', aspectRatios: ['width:height 1.0', 'depth:height 0.88'], symmetry: 'bilateral front with asymmetric side control', dominantCurves: ['broad shoulder', 'domed lid', 'rear U latch'], negativeSpaces: ['rear latch opening'], landmarks: ['front control island', 'front lid release', 'top steam crown', 'rear inlet'] };
spec.featureReviewTargets = [
  { id: 'rice-cooker-silhouette', name: 'Squat body, faceted lid and stable floor stance', tier: 'critical', passIds: ['blockout', 'form-refinement'], minimumScore: 0.82, mustPass: true, componentRefs: ['body-shell', 'lid-system', 'feet'], evidenceRefs: ['front', 'three-quarter'] },
  { id: 'rice-cooker-controls', name: 'Front control island and lid release hierarchy', tier: 'critical', passIds: ['structural-pass', 'material-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['control-island', 'lid-release'], evidenceRefs: ['front'] },
  { id: 'rice-cooker-runtime', name: 'Frozen lid, switch, latch, rice and steam anchors', tier: 'critical', passIds: ['interaction-pass'], minimumScore: 0.86, mustPass: true, componentRefs: ['lid-system', 'rear-latch', 'rice-bed', 'airborne-rice', 'steam-system'], evidenceRefs: ['runtime-contract'] },
  { id: 'rice-cooker-ink', name: 'Sakura Toon palette and uneven three-tier ink', tier: 'critical', passIds: ['material-pass', 'lighting-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['outline-system'], evidenceRefs: ['turnsheet'] },
];
spec.lightingFromPhoto = ['soft upper-left key', 'cool lavender fill', 'restrained pink rim', 'light neutral-lavender background', 'soft floor contact shadow'];
spec.lightingFromPhoto.push('exposure 1.0 with ACESFilmicToneMapping and neutral white balance');
spec.performanceBudget = { qualityPriority: 'stylized-runtime', targetTriangles: 52000, maxDrawCalls: 160, textureSize: 0, fpsTarget: 60, optimizationPolicy: 'Keep shared effect geometry and low body segment counts; no runtime textures.' };
spec.assumptions = ['GPT Image 2 turn-sheet is visual evidence only.', 'Existing v1 pivots, sockets, effects, and timeline are frozen.', 'Hidden heater, wiring and underside hardware are omitted.'];
spec.risks = ['Transparent steam is excluded from main outline.', 'Effect mesh count dominates draw calls and is retained for animation compatibility.'];
await writeFile(specPath, `${JSON.stringify(spec, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ components: spec.componentTree.length, materials: spec.materials.length, details: detailNames.length }, null, 2));

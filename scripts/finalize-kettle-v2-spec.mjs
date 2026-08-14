import { readFile, writeFile } from 'node:fs/promises';

const specPath = 'docs/sculpt-specs-v2/kettle/object-sculpt-spec.json';
const spec = JSON.parse(await readFile(specPath, 'utf8'));
const clone = (value) => JSON.parse(JSON.stringify(value));
const rootTemplate = spec.componentTree[0];
const materialTemplate = spec.materials[0];

spec.suitability = 'pass';
spec.scores = { object_isolation: 3, silhouette_readability: 3, depth_inference: 3, primitive_decomposition: 3, material_procedurality: 3, occlusion_risk: 2, interaction_fit: 3 };
spec.preSpecAssessment.objectClass = {
  primaryType: 'electric-kettle',
  primaryDomain: 'object',
  formLanguage: ['stylized-low-poly', 'faceted-hard-surface', 'exaggerated-functional-silhouette'],
  structureKind: ['assembled-shell', 'hinged-lid', 'tubular-handle', 'socketed-spout', 'repeated-gauge-marks'],
  motionPotential: ['lid-hinge', 'power-switch', 'steam-puff-visibility', 'boil-state-material-response'],
  materialFamilies: ['painted-composite', 'matte-cream-polymer', 'cool-grey-metal', 'translucent-water', 'rubber'],
  notes: 'Observed from the Sakura Crossing kettle render: a tapered faceted shell, offset spout, rear D handle, lid hinge and front gauge are identity-defining; hidden heater and wiring remain inferred.',
};
spec.preSpecAssessment.complexity.scores = { silhouetteComplexity: 3, componentCount: 3, hierarchyDepth: 3, repetitionDensity: 3, materialLayerCount: 3, localDetailDensity: 3, occlusionRisk: 2, actionReadinessNeed: 3 };
spec.preSpecAssessment.estimatedCounts = { macroComponents: 4, mesoComponents: 12, microFeatureGroups: 7, materialLayers: 5, repetitionSystems: 2 };
spec.preSpecAssessment.detailInventory = {
  scanMethod: 'grid-3x3-plus-runtime-contract',
  targetMinDetails: 14,
  note: 'Each detail is attached to a component or material override and reviewed from front, side, rear and three-quarter views.',
  details: [
    '12-sided tapered body silhouette', 'cream shoulder band', 'lower plinth seam', 'two-tier power base',
    'hinged domed lid', 'lid seat ring', 'top button', 'short rising metal spout', 'spout outlet lip',
    'D-shaped handle with inner grip', 'translucent water gauge', 'seven gauge ticks', 'indexed power switch',
    'embedded indicator lamp', 'rear cable socket', 'four rubber feet', 'volumetric steam lobes',
  ].map((name, index) => ({ id: `kettle-detail-${index + 1}`, kind: index % 3 === 0 ? 'contour' : index % 3 === 1 ? 'bevel' : 'linework', description: name, region: { x: (index % 3) / 3, y: (index % 6) / 6, width: 0.33, height: 0.16, units: 'normalized' }, scale: index < 6 ? 'macro' : index < 13 ? 'meso' : 'micro', affects: 'geometry, materialSurface', mapsTo: { type: 'component.localFeatures', ref: 'kettle-detail-anchor' }, evidenceRef: 'full-object', confidence: 0.9 })),
};
spec.qualityContract.minimumSpecDepth = { macroComponents: 4, mesoComponents: 10, microFeatureGroups: 6, materialLayers: 5, repetitionSystems: 1, reviewViewpoints: 4 };

const component = (id, name, level, role, parent, primitive, dimensions, material, features, attachment = null) => {
  const item = clone(rootTemplate);
  item.id = id;
  item.name = name;
  item.level = level;
  item.role = role;
  item.parent = parent;
  item.primitive = primitive === 'curve' ? 'curve-sweep' : primitive === 'rounded-panel' || primitive === 'rounded-bar' || primitive === 'material-style' ? 'box' : primitive === 'icosahedron-cluster' || primitive === 'icosahedron' ? 'instanced-cluster' : primitive;
  item.topologyClass = primitive === 'curve' ? 'fiber-strand' : primitive === 'material-style' ? 'material-only' : primitive === 'rounded-panel' ? 'surface-relief' : 'assembled-solid';
  item.topologyRationale = 'Use bounded procedural geometry with explicit facets and stable runtime pivots.';
  item.dimensions = { ...dimensions, units: 'world', confidence: 0.9 };
  item.material = material;
  item.materialLayers = [material];
  item.localFeatures = features.map((feature) => ({ id: `${id}-${feature}`, name: feature, evidenceRefs: ['full-object'], geometry: 'explicit-named-mesh-or-instanced-detail' }));
  item.colorMaterialRecipe = { dominantAlbedo: material === 'metal' ? 'rgba(169, 173, 176, 1)' : material === 'rubber' || material === 'seam' || material === 'ink' ? 'rgba(78, 75, 88, 1)' : material === 'gauge' ? 'rgba(213, 231, 229, 0.72)' : material === 'accent' || material === 'accent-deep' ? 'rgba(231, 167, 190, 1)' : 'rgba(246, 238, 226, 1)', secondaryAlbedo: 'rgba(102, 88, 111, 1)', materialClass: material === 'metal' ? 'metal' : material === 'rubber' ? 'rubber' : 'plastic', materialClassConfidence: 0.9 };
  item.surfaceDetail = { macroRoughness: 0.62, microRoughness: 0.08, bumpAmplitude: 0.04, normalPattern: 'object-space-toon-facet-normal', displacementPattern: 'none', occlusionPattern: 'seam-and-contact-ao', edgeWearPattern: 'stable-ink-edge-variation', notes: 'No runtime textures; use vertex/material variation.' };
  item.actionProfile = clone(rootTemplate.actionProfile);
  item.actionProfile.animationRole = role;
  item.actionProfile.pivot = { mode: 'named-runtime-pivot', localPosition: [0, 0, 0], axis: [0, 1, 0], confidence: 0.95 };
  item.actionProfile.collider = { type: 'compound-proxy', offset: [0, 0, 0], scale: [1, 1, 1], isTrigger: false, notes: 'Frozen v1 collision envelope.' };
  item.actionProfile.destruction = { breakable: false, fractureGroup: id, seamRefs: [], detachableFragments: [], breakImpulse: 0, debrisMaterial: material };
  item.attachment = attachment ?? (parent ? { parentSocket: `${parent}-socket`, localStart: [0, 0, 0], localEnd: [0, 0.02, 0], contactType: 'overlap', overlap: 0.03, gapTolerance: 0.01 } : null);
  item.evidenceRefs = ['full-object'];
  item.fidelityTier = 'v2';
  return item;
};

spec.componentTree = [
  component('root', 'Kettle frozen runtime root', 'macro', 'root', null, 'box', { width: 1.82, height: 2.0, depth: 1.82 }, 'shell', ['kettle-detail-anchor', '12-sided body silhouette', 'floor contact', 'connection socket envelope']),
  component('body-shell', 'Tapered faceted kettle body', 'macro', 'body-shell', 'root', 'lathe', { width: 1.76, height: 1.72, depth: 1.68 }, 'accent', ['broad belly', 'tapered shoulder', 'lower seam']),
  component('power-base', 'Two-tier circular power base', 'macro', 'power-base', 'root', 'cylinder', { width: 1.8, height: 0.2, depth: 1.8 }, 'shell', ['cream base', 'pink accent ring', 'rear cable port']),
  component('lid-system', 'Hinged domed lid assembly', 'macro', 'lid-hinge', 'body-shell', 'lathe', { width: 1.2, height: 0.26, depth: 1.2 }, 'shell-light', ['seat ring', 'top button', 'hinge socket']),
  component('spout-system', 'Short rising spout and outlet lip', 'meso', 'spout', 'body-shell', 'cone', { width: 0.62, height: 0.55, depth: 0.36 }, 'metal', ['body socket', 'outlet lip', 'steam socket'], { parentSocket: 'kettle-spout-body-socket', localStart: [-0.62, 1.48, 0.02], localEnd: [-1.05, 1.79, 0.02], contactType: 'embedded', overlap: 0.06, gapTolerance: 0.01 }),
  component('handle-system', 'Open D-shaped handle and inner grip', 'meso', 'handle', 'body-shell', 'curve', { width: 0.7, height: 1.12, depth: 0.28 }, 'accent-deep', ['upper mount', 'lower mount', 'cream inner grip'], { parentSocket: 'kettle-handle-upper-socket', localStart: [0.56, 1.65, -0.18], localEnd: [0.6, 0.55, -0.18], contactType: 'embedded', overlap: 0.08, gapTolerance: 0.01 }),
  component('gauge-system', 'Front translucent water gauge', 'meso', 'water-gauge', 'body-shell', 'rounded-panel', { width: 0.24, height: 0.92, depth: 0.06 }, 'gauge', ['water volume', 'seven repeated ticks', 'translucent window']),
  component('switch-system', 'Indexed power switch and indicator', 'meso', 'power-switch', 'body-shell', 'cylinder', { width: 0.24, height: 0.18, depth: 0.12 }, 'accent-deep', ['switch seat', 'index mark', 'embedded indicator']),
  component('steam-system', 'Seven staggered volumetric steam assemblies', 'meso', 'steam-effect', 'spout-system', 'icosahedron-cluster', { width: 0.9, height: 1.4, depth: 0.7 }, 'steam', ['five-lobe puff clusters', 'staggered phase offsets', 'socket parented puffs']),
  component('feet-system', 'Four rubber feet', 'meso', 'floor-contact', 'root', 'cylinder', { width: 1.2, height: 0.08, depth: 1.0 }, 'rubber', ['four repeated supports']),
  component('body-facets', 'Body facet bands and shoulder planes', 'micro', 'surface-relief', 'body-shell', 'lathe', { width: 1.76, height: 1.7, depth: 1.68 }, 'shell', ['12 radial facets', 'cool violet shadow planes']),
  component('gauge-ticks', 'Repeated gauge tick marks', 'micro', 'measurement-detail', 'gauge-system', 'rounded-bar', { width: 0.055, height: 0.013, depth: 0.014 }, 'seam', ['seven instances']),
  component('steam-lobes', 'Irregular low-poly steam lobes', 'micro', 'steam-detail', 'steam-system', 'icosahedron', { width: 0.45, height: 0.46, depth: 0.4 }, 'steam', ['vertex deformation', 'two-tone translucent toon']),
  component('ink-outline', 'Stable uneven three-tier ink outline', 'micro', 'outline-style', 'root', 'material-style', { width: 1.82, height: 2.0, depth: 1.82 }, 'ink', ['main 0.0048', 'structure 0.0041', 'detail 0.0033']),
  component('lid-seat', 'Lid seat and seam ring', 'meso', 'lid-seat', 'lid-system', 'torus', { width: 1.06, height: 0.08, depth: 1.06 }, 'seam', ['seat overlap', 'dark seam']),
  component('spout-lip', 'Spout outlet lip', 'meso', 'spout-lip', 'spout-system', 'torus', { width: 0.29, height: 0.29, depth: 0.08 }, 'seam', ['outlet ring']),
  component('switch-index', 'Switch index mark', 'meso', 'switch-index', 'switch-system', 'box', { width: 0.02, height: 0.07, depth: 0.02 }, 'seam', ['indexed stripe']),
  component('base-seam', 'Body-to-base dark seam', 'meso', 'base-seam', 'power-base', 'torus', { width: 1.7, height: 0.04, depth: 1.7 }, 'seam', ['shadow gap']),
  component('rear-port', 'Rear cable socket', 'meso', 'rear-port', 'power-base', 'box', { width: 0.22, height: 0.13, depth: 0.05 }, 'rubber', ['socket face']),
  component('lid-button', 'Lid top button', 'meso', 'lid-button', 'lid-system', 'box', { width: 0.32, height: 0.08, depth: 0.22 }, 'accent', ['low-profile button']),
];
spec.preSpecAssessment.detailInventory.details.forEach((detail) => { detail.mapsTo.ref = 'root'; });
spec.componentTree[0].localFeatures.push(...spec.preSpecAssessment.detailInventory.details.map((detail) => detail.id));

const makeMaterial = (id, baseColor, dominant, secondary, roughness, metalness = 0) => {
  const m = clone(materialTemplate);
  m.id = id; m.name = id; m.baseColor = baseColor; m.color = baseColor;
  m.albedo = { dominant, secondary, samplingNotes: 'Palette sampled from kettle render and Sakura city style.' };
  m.colorVariation = { palette: [dominant, ...secondary], pattern: 'toon-band-and-stable-object-space-variation', amplitude: 0.12, heightCorrelation: 0.2 };
  m.roughness = { base: roughness, variation: 0.12, map: 'independent-procedural-field', localResponse: 'higher in seams, lower on planar highlights' };
  m.metalness = { base: metalness, variation: 0.08 };
  m.localOverrides = [{ region: 'edge-facets', response: 'cool-violet shadow tint and 18% stable outline variation', evidenceRefs: ['full-object'] }];
  m.referencePbr = { usable: true, confidence: 0.86, source: 'docs/sculpt-specs-v2/kettle/pbr/base', maps: { albedo: { path: 'base_albedo.png', channel: 'albedo' }, roughness: { path: 'base_roughness.png', channel: 'roughness' }, height: { path: 'base_height.png', channel: 'height' }, normal: { path: 'base_normal.png', channel: 'normal' }, ao: { path: 'base_ao.png', channel: 'ao' } } };
  m.notes = 'Runtime uses procedural Toon materials; extracted maps are evidence only and are not shipped as runtime textures.';
  return m;
};
spec.materials = [
  makeMaterial('shell', '#F6EEE2', '#F6EEE2', ['#FFF8EE', '#D7C9C3'], 0.68),
  makeMaterial('shell-light', '#FFF8EE', '#FFF8EE', ['#F6EEE2', '#E5D9E2'], 0.58),
  makeMaterial('accent', '#E7A7BE', '#E7A7BE', ['#F4C4D4', '#B76F8C'], 0.56),
  makeMaterial('accent-deep', '#A9617E', '#A9617E', ['#7D5067', '#D58AA5'], 0.62),
  makeMaterial('metal', '#A9ADB0', '#A9ADB0', ['#D6D7D9', '#656875'], 0.36, 0.82),
  makeMaterial('gauge', '#D5E7E5', '#D5E7E5', ['#A9D9D2', '#F3FBF5'], 0.25),
  makeMaterial('rubber', '#4E4B58', '#4E4B58', ['#6B6373', '#302D38'], 0.9),
  makeMaterial('steam', '#FFF2F0', '#FFF2F0', ['#E9DCE8', '#D3C0D1'], 0.4),
  makeMaterial('seam', '#655D6A', '#655D6A', ['#413C4B', '#9B8BA0'], 0.76),
  makeMaterial('ink', '#322C3A', '#322C3A', ['#5A4B60'], 0.82),
];
spec.repetitionSystems = [{ id: 'gauge-tick-system', componentRefs: ['gauge-ticks'], count: 7, layout: 'vertical repeated marks', instancing: 'shared geometry', evidenceRefs: ['full-object'] }, { id: 'steam-puff-system', componentRefs: ['steam-lobes'], count: 7, layout: 'socket-parented staggered clusters', instancing: 'shared low-poly lobe geometry with deterministic deformation', evidenceRefs: ['full-object'] }];
spec.silhouette = { boundingShape: 'tapered 12-sided cylinder with broad lower belly and clipped shoulder', aspectRatios: ['width:height 0.91', 'depth:height 0.91'], symmetry: 'radial body with asymmetric spout and handle', dominantCurves: ['body taper', 'D handle arc', 'rising spout'], negativeSpaces: ['handle opening', 'spout-to-lid gap'], landmarks: ['front gauge at x=-0.15', 'switch at y=0.5', 'spout socket x=-0.62 y=1.52', 'lid hinge y=1.93'] };
spec.viewEvidence = [{ id: 'full-object', view: 'primary', imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['complete kettle silhouette and Sakura palette'], confidence: 0.88 }, ...['front', 'side', 'back', 'three-quarter'].map((view) => ({ id: view, view, imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['consistent body height and floor line', 'stable handle/spout/lid attachment locations'], confidence: 0.88 }))];
spec.lightingFromPhoto = ['warm upper-left key light with broad soft shadow', 'cool right-rear lavender fill light', 'pink rear rim light on faceted planes', 'neutral exposure with ACES tone mapping on pale lavender background', 'soft floor contact shadow beneath all four feet'];
spec.featureReviewTargets = [
  { id: 'kettle-silhouette', name: 'Tapered body, handle opening and spout profile', tier: 'critical', passIds: ['blockout', 'form-refinement'], minimumScore: 0.82, mustPass: true, componentRefs: ['body-shell', 'handle-system', 'spout-system'], evidenceRefs: ['three-quarter', 'front', 'side'] },
  { id: 'kettle-action-anchors', name: 'Lid hinge, switch pivot, steam socket and cable socket', tier: 'critical', passIds: ['structural-pass', 'interaction-pass'], minimumScore: 0.84, mustPass: true, componentRefs: ['lid-system', 'switch-system', 'steam-system'], evidenceRefs: ['full-object'] },
  { id: 'kettle-gauge-and-base', name: 'Water gauge, plinth seam and two-tier power base', tier: 'important', passIds: ['structural-pass', 'material-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['gauge-system', 'power-base'], evidenceRefs: ['front', 'three-quarter'] },
  { id: 'kettle-toon-ink', name: 'Cream/pink/mint Sakura palette with stable uneven ink tiers', tier: 'critical', passIds: ['material-pass', 'lighting-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['ink-outline'], evidenceRefs: ['full-object'] },
];
spec.performanceBudget = { qualityPriority: 'stylized-runtime', targetTriangles: 18000, maxDrawCalls: 64, textureSize: 0, fpsTarget: 60, optimizationPolicy: 'Keep shared steam geometry and low segment counts; no runtime textures.' };
spec.assumptions = ['GPT Image 2 turnsheet is reference evidence only; runtime remains pure procedural Three.js.', 'Animation pivots and sockets are frozen to existing kettle performance contract.', 'Hidden heater, wiring and underside construction are inferred and omitted.'];
spec.risks = ['single reference render is not a physical PBR truth source', 'steam is a translucent effect and is excluded from main outline tier'];
await writeFile(specPath, `${JSON.stringify(spec, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ specPath, components: spec.componentTree.length, materials: spec.materials.length, details: spec.preSpecAssessment.detailInventory.details.length }, null, 2));

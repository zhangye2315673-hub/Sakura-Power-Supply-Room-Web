#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const specRoot = path.join(root, 'docs', 'sculpt-specs-v2', 'microwave');
const assessmentPath = path.join(specRoot, 'pre-spec-assessment.json');
const inventoryPath = path.join(specRoot, 'detail-inventory.json');
const specPath = path.join(specRoot, 'object-sculpt-spec.json');
const [spec, assessmentEnvelope, inventoryEnvelope] = await Promise.all([
  readFile(specPath, 'utf8').then(JSON.parse),
  readFile(assessmentPath, 'utf8').then(JSON.parse),
  readFile(inventoryPath, 'utf8').then(JSON.parse),
]);

const refRoot = 'references/intake-v2/microwave';
const views = {
  front: `${refRoot}/views/front.png`,
  side: `${refRoot}/views/side.png`,
  back: `${refRoot}/views/back.png`,
  threeQuarter: `${refRoot}/views/three-quarter.png`,
};
const evidenceIds = ['front-view', 'side-view', 'back-view', 'three-quarter-view'];

spec.targetName = 'SAKURA Microwave v2';
spec.targetId = 'microwave-v2';
spec.sourceImage = `${refRoot}/microwave-turnsheet-v2.png`;
spec.suitability = 'pass';
spec.scores = {
  object_isolation: 3,
  silhouette_readability: 3,
  depth_inference: 3,
  primitive_decomposition: 3,
  material_procedurality: 3,
  occlusion_risk: 3,
  interaction_fit: 3,
};
spec.referenceCamera = {
  solved: true,
  projection: 'orthographic-like four-view turn-sheet',
  fovDegrees: 30,
  aspect: 1,
  orientation: { yaw: 0, pitch: 0, roll: 0 },
  positionHint: [-0.0575, 1.095, 10],
  note: 'GPT Image 2 supplies visual form evidence. The archived v1 runtime contract owns bounds, pivots, sockets, colliders, cable anchors and animation state.',
};
spec.coordinateFrame = {
  front: '+Z faces the closed microwave door',
  up: '+Y with floor at Y=0',
  scaleReference: 'archived v1 full-tree bounds 3.675 x 2.19000001 x 2.176',
};
spec.silhouette = {
  boundingShape: 'wide low faceted countertop microwave with dominant left door and narrow right control tower',
  aspectRatios: [3.675 / 2.19000001, 2.176 / 2.19000001],
  symmetry: 'asymmetric front split with left cooking chamber and right control column',
  dominantCurves: ['clipped top hood', 'stepped door perimeter', 'oversized octagonal dial bezel'],
  negativeSpaces: ['handle shadow channel', 'four foot gaps', 'door gasket recess'],
  landmarks: ['left hinge axis X=-1.66', 'tray center X=-0.49', 'dial center X=1.25 Y=1.14', 'rear inlet X=0.9 Y=0.61'],
};
spec.viewEvidence = [
  ['front-view', 'front', views.front, ['large dark door window', 'tall handle', 'display-button-dial-button control order', 'four feet'], 0.99],
  ['side-view', 'side', views.side, ['deep cabinet', 'clipped side planes', 'front fascia depth', 'rear edge'], 0.98],
  ['back-view', 'back', views.back, ['service cassette', 'four by five vent field', 'four fasteners', 'low power inlet'], 0.99],
  ['three-quarter-view', 'three-quarter', views.threeQuarter, ['stepped hood', 'door frame depth', 'control tower separation', 'outline hierarchy'], 0.99],
].map(([id, view, imagePath, observations, confidence]) => ({
  id,
  view,
  imagePath,
  imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' },
  observations,
  confidence,
}));

const featureData = [
  ['detail-01', 'contour', 'cabinet-frame', 'Full tree remains inside the archived v1 Box3.'],
  ['detail-02', 'bevel', 'top-hood', 'Top hood uses broad clipped corner planes and a narrow pink step.'],
  ['detail-03', 'contour', 'side-shell-system', 'Side walls expose large tapered planes without changing depth extremes.'],
  ['detail-04', 'seam', 'lower-plinth', 'Low pink plinth separates the cabinet from four feet.'],
  ['detail-05', 'bevel', 'door-outer-frame', 'Door outer frame becomes deeper and more graphic.'],
  ['detail-06', 'seam', 'door-inner-gasket', 'Dark gasket frame remains separated from the outer pink door.'],
  ['detail-07', 'gloss', 'smoked-glass', 'Smoked glass stays a dark readable plane with restrained transparency.'],
  ['detail-08', 'linework', 'window-mesh', 'Bounded safety mesh remains behind the glass without black clumping.'],
  ['detail-09', 'contour', 'door-handle', 'Tall faceted handle keeps the archived right-edge pivot and socket.'],
  ['detail-10', 'fastener', 'door-hinge', 'Left hinge attachment remains readable at the frozen axis.'],
  ['detail-11', 'contour', 'cavity-assembly', 'True cavity panels remain behind the door with fixed depth.'],
  ['detail-12', 'contour', 'tray-food-system', 'Tray, plate and food retain their archived rotor and food pivots.'],
  ['detail-13', 'emissive', 'display-system', 'Mint display bars and three sequence indicators remain stable.'],
  ['detail-14', 'ridge', 'small-button', 'Small indexed button retains its travel pivot.'],
  ['detail-15', 'contour', 'dial-system', 'Oversized low-segment dial and bezel remain centered on the frozen pivot.'],
  ['detail-16', 'linework', 'dial-ticks', 'Eight radial tick marks remain a bounded repetition system.'],
  ['detail-17', 'bevel', 'lower-button', 'Lower rectangular button gains a clipped low-poly face.'],
  ['detail-18', 'contour', 'rear-service-panel', 'Rear service cassette uses a thick stepped perimeter.'],
  ['detail-19', 'linework', 'rear-vent-system', 'Four rows of five vent slots remain evenly spaced.'],
  ['detail-20', 'fastener', 'rear-fasteners', 'Four rear fasteners remain countable and unclumped.'],
  ['detail-21', 'contour', 'power-entry', 'Rear inlet and contacts remain on the frozen socket.'],
  ['detail-22', 'contour', 'foot-system', 'Four faceted feet preserve ground contact.'],
  ['detail-23', 'contour', 'performance-rig', 'Eight steam clusters and four thick heat waves retain authored emitters.'],
  ['detail-24', 'linework', 'outline-hierarchy', 'Main, structure and detail ink use stable 0.0048, 0.0041 and 0.0033 widths with 0.18 variation.'],
];
const details = featureData.map(([id, kind, ref, description], index) => ({
  id,
  kind,
  description,
  region: { x: (index % 4) * 0.25, y: Math.floor(index / 4) * 0.16, width: 0.25, height: 0.16, units: 'normalized' },
  scale: index < 5 ? 'macro' : index < 22 ? 'meso' : 'micro',
  affects: ['gloss', 'emissive'].includes(kind) || ref === 'outline-hierarchy' ? 'materialSurface' : 'geometry, materialSurface',
  mapsTo: ref === 'outline-hierarchy' || ref === 'smoked-glass'
    ? { type: 'material.localOverrides', ref }
    : { type: 'component.localFeatures', ref },
  evidenceRef: index >= 17 && index <= 20 ? views.back : views.threeQuarter,
  confidence: 0.96,
}));

spec.preSpecAssessment = {
  ...spec.preSpecAssessment,
  objectClass: {
    primaryType: 'faceted countertop microwave with articulated door and model-owned heat performance',
    primaryDomain: 'object',
    formLanguage: ['hard-surface', 'low-poly', 'faceted', 'retro game appliance'],
    structureKind: ['compound object', 'layered shell', 'articulated assembly', 'repeated modules'],
    motionPotential: ['hinged door', 'rotating tray', 'food pulse', 'whole-machine compression', 'volumetric steam and heat emission'],
    materialFamilies: ['molded plastic', 'smoked glass', 'warm cavity liner', 'rubber', 'metal contact', 'emissive indicator'],
    notes: 'The archived rig is compatibility truth. The turn-sheet reallocates only visual mass inside the frozen envelope.',
  },
  complexity: {
    tier: 'ultra-complex',
    scores: { silhouetteComplexity: 2, componentCount: 3, hierarchyDepth: 3, repetitionDensity: 3, materialLayerCount: 3, localDetailDensity: 3, occlusionRisk: 3, actionReadinessNeed: 3 },
    estimatedCounts: { macroComponents: 7, mesoComponents: 20, microFeatureGroups: details.length, materialLayers: 10, repetitionSystems: 6 },
    reasoning: [
      'A transparent articulated door, fixed cavity, rotating tray and food share strict depth and reset constraints.',
      'Three control pivots, rear socket, four cable anchors, eight steam clusters and four heat waves must keep exact transforms.',
      'Front mesh, dial ticks, rear vents, fasteners and effects form multiple repeated systems with outline exclusions.',
    ],
  },
  specDepthDecision: {
    requiredDepth: 'ultra-complex',
    minimumComponentLevels: ['macro', 'meso', 'micro'],
    needsRepetitionSystems: true,
    needsMaterialLocalOverrides: true,
    needsMultipleReviewViews: true,
    needsActionReadyHierarchy: true,
    rationale: 'Visual replacement touches an animation-rich transparent appliance with nested effects and exact reset.',
  },
  unknownsToResolveBeforeImplementation: [],
  detailInventory: { scanMethod: 'grid-4x4 plus four-view component review', targetMinDetails: 24, details },
  sourceImage: spec.sourceImage,
};
spec.localSpecSearch = assessmentEnvelope.localSpecSearch;

const rootTemplate = structuredClone(spec.componentTree[0]);
function component(id, name, level, role, parent, material, primitive, localFeatures, options = {}) {
  const value = structuredClone(rootTemplate);
  Object.assign(value, {
    id, name, level, role, parent, material, primitive,
    materialLayers: [material],
    importance: options.importance ?? 0.88,
    confidence: options.confidence ?? 0.96,
    topologyClass: options.topologyClass ?? 'assembled-solid',
    topologyRationale: options.topologyRationale ?? 'Rigid low-poly hard-surface assembly with broad planes, countable seams and stable contact overlap.',
    localFeatures,
    evidenceRefs: options.evidenceRefs ?? evidenceIds,
    fidelityTier: options.fidelityTier ?? 'form-refinement',
  });
  value.dimensions = options.dimensions ?? { width: 1, height: 1, depth: 1, units: 'relative', confidence: 0.92 };
  value.transform = { position: options.position ?? [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] };
  value.attachment = parent ? {
    parentSocket: `${parent}-socket`, localStart: [0, 0, 0], localEnd: [0, options.length ?? 0.04, 0],
    contactType: options.contactType ?? 'overlap', overlap: options.overlap ?? 0.025, gapTolerance: options.gapTolerance ?? 0.01,
    evidenceRefs: options.evidenceRefs ?? evidenceIds,
  } : null;
  value.actionProfile.animationRole = options.animationRole ?? (parent ? 'static-part' : 'root');
  value.actionProfile.pivot = { mode: options.pivotMode ?? 'center', localPosition: options.pivot ?? [0, 0, 0], axis: options.axis ?? [0, 1, 0], confidence: 0.99 };
  value.actionProfile.collider = options.collider ?? null;
  value.actionProfile.destruction.fractureGroup = options.fractureGroup ?? id;
  value.details = localFeatures.map((feature) => ({ id: feature, kind: 'construction', evidenceRefs: options.evidenceRefs ?? evidenceIds }));
  value.surfaceDetail = {
    macroRoughness: 0.12, microRoughness: 0.04, bumpAmplitude: 0.006,
    normalPattern: 'stable object-space molded response', displacementPattern: 'none',
    occlusionPattern: 'panel seams and contact overlaps', edgeWearPattern: 'restrained chamfer highlight',
    notes: 'Broad low-poly planes remain visually dominant.',
  };
  value.colorMaterialRecipe = {
    dominantAlbedo: options.dominant ?? 'rgba(245, 235, 221, 1)',
    secondaryAlbedo: options.secondary ?? 'rgba(218, 166, 184, 1)',
    materialClass: options.materialClass ?? 'plastic',
    materialClassConfidence: 0.94,
  };
  return value;
}

spec.componentTree = [
  component('root', 'Microwave Runtime Root', 'macro', 'container', null, 'cream-shell', 'box', ['detail-01'], { importance: 1 }),
  component('cabinet-frame', 'Faceted Cabinet Frame', 'macro', 'body', 'root', 'cream-shell', 'extrude', ['detail-01'], { dimensions: { width: 3.675, height: 2.19, depth: 2.176, units: 'world', confidence: 1 }, collider: { type: 'compound-box', offset: [-0.0575, 1.095, 0.152], scale: [3.675, 2.19, 2.176], isTrigger: false } }),
  component('door-assembly', 'Left-hinged Door Assembly', 'macro', 'door', 'root', 'pink-structure', 'extrude', ['detail-05', 'detail-06', 'detail-09', 'detail-10'], { animationRole: 'hinged-door', pivotMode: 'hinge', pivot: [-1.66, 0, 0], axis: [0, 1, 0] }),
  component('cavity-assembly', 'Fixed Cooking Cavity', 'macro', 'interior', 'root', 'warm-interior', 'box', ['detail-11', 'detail-12'], { animationRole: 'lit-interior' }),
  component('control-assembly', 'Fixed Control Tower', 'macro', 'controls', 'root', 'pink-structure', 'extrude', ['detail-13', 'detail-14', 'detail-15', 'detail-16', 'detail-17']),
  component('rear-service-assembly', 'Rear Service Assembly', 'macro', 'service', 'root', 'pink-structure', 'extrude', ['detail-18', 'detail-19', 'detail-20', 'detail-21']),
  component('performance-rig', 'Model-owned Heat Performance Rig', 'macro', 'effect', 'root', 'mint-emissive', 'instanced-cluster', ['detail-23'], { animationRole: 'model-owned-performance' }),

  component('top-hood', 'Stepped Faceted Top Hood', 'meso', 'shell', 'cabinet-frame', 'cream-highlight', 'extrude', ['detail-02']),
  component('side-shell-system', 'Broad Tapered Side Shells', 'meso', 'shell', 'cabinet-frame', 'cream-shell', 'extrude', ['detail-03']),
  component('lower-plinth', 'Low Pink Plinth', 'meso', 'structure', 'cabinet-frame', 'pink-structure', 'extrude', ['detail-04']),
  component('door-outer-frame', 'Deep Pink Door Frame', 'meso', 'frame', 'door-assembly', 'pink-structure', 'extrude', ['detail-05']),
  component('door-inner-gasket', 'Dark Inner Gasket Frame', 'meso', 'seal', 'door-assembly', 'plum-cavity', 'extrude', ['detail-06']),
  component('smoked-glass-panel', 'Smoked Door Glass', 'meso', 'window', 'door-assembly', 'smoked-glass', 'extrude', [], { topologyClass: 'conforming-shell', materialClass: 'glass', dominant: 'rgba(65, 56, 72, 0.18)' }),
  component('window-mesh', 'Bounded Safety Mesh', 'meso', 'linework', 'door-assembly', 'plum-cavity', 'instanced-cluster', ['detail-08']),
  component('door-handle', 'Tall Faceted Door Handle', 'meso', 'handle', 'door-assembly', 'cream-highlight', 'extrude', ['detail-09'], { animationRole: 'hinge-child', pivotMode: 'custom', pivot: [2.36, 1.2, 1.16], contactType: 'socket' }),
  component('door-hinge', 'Left Door Hinge', 'meso', 'joint', 'door-assembly', 'metal-detail', 'cylinder', ['detail-10']),
  component('tray-food-system', 'Rotating Tray and Food', 'meso', 'rotor', 'cavity-assembly', 'food-palette', 'cylinder', ['detail-12'], { animationRole: 'rotating-assembly', pivot: [-0.49, 0.54, 0.16], axis: [0, 1, 0] }),
  component('display-system', 'Mint Display and Indicators', 'meso', 'display', 'control-assembly', 'mint-emissive', 'extrude', ['detail-13']),
  component('small-button', 'Small Indexed Button', 'meso', 'control', 'control-assembly', 'cream-highlight', 'cylinder', ['detail-14'], { animationRole: 'button-travel', pivot: [1.25, 1.5, 1.01], axis: [0, 0, 1] }),
  component('dial-system', 'Oversized Indexed Dial', 'meso', 'control', 'control-assembly', 'cream-highlight', 'cylinder', ['detail-15'], { animationRole: 'rotary-control', pivot: [1.25, 1.14, 1.02], axis: [0, 0, 1] }),
  component('dial-ticks', 'Eight Dial Tick Marks', 'meso', 'linework', 'control-assembly', 'plum-cavity', 'instanced-cluster', ['detail-16']),
  component('lower-button', 'Lower Faceted Button', 'meso', 'control', 'control-assembly', 'cream-highlight', 'extrude', ['detail-17'], { animationRole: 'button-travel', pivot: [1.25, 0.72, 1], axis: [0, 0, 1] }),
  component('rear-service-panel', 'Stepped Rear Service Cassette', 'meso', 'panel', 'rear-service-assembly', 'pink-structure', 'extrude', ['detail-18']),
  component('rear-vent-system', 'Four-by-five Rear Vent Field', 'meso', 'vent', 'rear-service-assembly', 'plum-cavity', 'instanced-cluster', ['detail-19']),
  component('rear-fasteners', 'Four Rear Fasteners', 'meso', 'fastener', 'rear-service-assembly', 'metal-detail', 'instanced-cluster', ['detail-20']),
  component('power-entry', 'Rear Power Entry', 'meso', 'socket', 'rear-service-assembly', 'plum-cavity', 'extrude', ['detail-21'], { animationRole: 'cable-socket' }),
  component('foot-system', 'Four Faceted Rubber Feet', 'meso', 'support', 'root', 'rubber', 'instanced-cluster', ['detail-22'], { dominant: 'rgba(75, 67, 71, 1)', materialClass: 'rubber' }),
  component('steam-system', 'Eight Volumetric Steam Clusters', 'micro', 'effect', 'performance-rig', 'mint-emissive', 'instanced-cluster', ['detail-23'], { animationRole: 'effect-emitter' }),
  component('heat-wave-system', 'Four Thick Heat Waves', 'micro', 'effect', 'performance-rig', 'pink-structure', 'tube', ['detail-23'], { animationRole: 'effect-emitter' }),
  component('scene-edge-sockets', 'Four Frozen Cable Anchors', 'micro', 'socket', 'root', 'metal-detail', 'plane-card', ['detail-01'], { animationRole: 'cable-socket', topologyClass: 'material-only' }),
];

const materialTemplate = structuredClone(spec.materials[0]);
function material(id, name, baseColor, secondary, sourceImage, options = {}) {
  const value = structuredClone(materialTemplate);
  Object.assign(value, {
    id, name, baseColor, color: baseColor,
    type: options.type ?? 'physical',
    shaderModel: 'MeshToonMaterial project style with reference-derived PBR evidence',
  });
  value.albedo = { dominant: baseColor, secondary, samplingNotes: 'Sampled from the admitted GPT Image 2 four-view reference.' };
  value.colorVariation = { palette: [baseColor, ...secondary], pattern: 'stable molded value bands', amplitude: 0.04, heightCorrelation: 0 };
  value.roughness = { base: options.roughness ?? 0.52, variation: 0.08, map: 'independent roughness field', localResponse: 'higher in cavities and lower on chamfer crowns' };
  value.metalness = { base: options.metalness ?? 0, variation: 0 };
  value.normal = { pattern: 'independent molded micro-normal', strength: 0.06, scale: 32, space: 'tangent' };
  value.bump = { pattern: 'restrained molded micrograin', amplitude: 0.006, scale: 64 };
  value.ambientOcclusion = { cavityStrength: 0.3, contactShadowBias: 0.3, notes: 'panel seams, gasket recesses, handle channel and service cassette' };
  value.wear = { edgeWear: 0.01, scratches: [], chips: [] };
  value.dirt = { amount: 0.005, cavityBias: 0.25, color: '#4E4252' };
  value.localOverrides = [{ id: `${id}-edge-response`, region: 'named visible component zones', response: 'localized roughness and cavity response under Toon bands', roughness: options.roughness ?? 0.52, evidenceRefs: evidenceIds }];
  const pbrRoot = `docs/sculpt-specs-v2/microwave/pbr/${id}`;
  value.referencePbr = {
    usable: true, confidence: 0.86, estimatedFidelity: 0.86, sourceImage,
    maps: {
      albedo: { path: `${pbrRoot}/${id}_albedo.png` }, roughness: { path: `${pbrRoot}/${id}_roughness.png` },
      height: { path: `${pbrRoot}/${id}_height.png` }, normal: { path: `${pbrRoot}/${id}_normal.png` }, ao: { path: `${pbrRoot}/${id}_ao.png` },
    },
    limitation: 'Stylized generated evidence supports palette and value response, not measured physical channels.',
  };
  return value;
}
spec.materials = [
  material('cream-shell', 'Warm Cream Shell', '#F3E8D9', ['#FFF6E9', '#D6C7C4'], views.side, { roughness: 0.5 }),
  material('cream-highlight', 'Cream Highlight Planes', '#FFF4E6', ['#EAD8CE', '#BFAEB8'], views.threeQuarter, { roughness: 0.44 }),
  material('pink-structure', 'Sakura Pink Structure', '#DEA6B8', ['#F0BFD0', '#9D6E88'], views.front, { roughness: 0.5 }),
  material('mint-emissive', 'Muted Mint Emissive', '#A9D8CF', ['#D5F2E9', '#5E8588'], views.front, { roughness: 0.42 }),
  material('plum-cavity', 'Deep Plum Cavity', '#514758', ['#706477', '#2D2934'], views.front, { roughness: 0.64 }),
  material('smoked-glass', 'Smoked Toon Glass', '#4A404F', ['#6A5D6C', '#292631'], views.front, { roughness: 0.24, type: 'physical-transparent' }),
  material('rubber', 'Dark Rubber Feet', '#56515C', ['#6C6670', '#37333D'], views.side, { roughness: 0.78 }),
  material('metal-detail', 'Cool Grey Metal Detail', '#9C98A2', ['#C3BEC7', '#5C5663'], views.back, { roughness: 0.4, metalness: 0.68 }),
  material('warm-interior', 'Warm Interior Liner', '#8E817D', ['#B6A6A0', '#625960'], views.front, { roughness: 0.58 }),
  material('food-palette', 'Stylized Food Palette', '#E4A7B8', ['#F3E3D9', '#9C7088'], views.front, { roughness: 0.56 }),
];
spec.materials.find((entry) => entry.id === 'pink-structure').localOverrides.push({ id: 'outline-hierarchy', region: 'opaque cabinet, door, control and rear service geometry', response: 'main 0.0048, structure 0.0041, detail 0.0033 with stable object-space variation 0.18', evidenceRefs: evidenceIds });
spec.materials.find((entry) => entry.id === 'smoked-glass').localOverrides.push({ id: 'smoked-glass', region: 'door window only', response: 'transparent dark Toon plane, depthWrite disabled, no main outline', roughness: 0.24, evidenceRefs: ['front-view', 'three-quarter-view'] });

spec.repetitionSystems = [
  { id: 'window-mesh-grid', componentRef: 'window-mesh', count: 10, realization: 'geometry', buildsGeometry: true, geometry: { primitive: 'faceted-bar' }, distribution: 'four horizontal and six vertical bounded safety bars' },
  { id: 'dial-tick-ring', componentRef: 'dial-ticks', count: 8, realization: 'geometry', buildsGeometry: true, geometry: { primitive: 'faceted-bar' }, distribution: 'eight marks around frozen dial center' },
  { id: 'rear-vent-grid', componentRef: 'rear-vent-system', count: 20, realization: 'geometry', buildsGeometry: true, geometry: { primitive: 'faceted-slot' }, distribution: 'four rows by five columns' },
  { id: 'rear-fastener-set', componentRef: 'rear-fasteners', count: 4, realization: 'geometry', buildsGeometry: true, geometry: { primitive: 'low-segment-cylinder' }, distribution: 'four corners of rear cassette' },
  { id: 'steam-lobe-system', componentRef: 'steam-system', count: 24, realization: 'geometry', buildsGeometry: true, geometry: { primitive: 'irregular-icosahedron' }, distribution: 'three lobes on each of eight frozen steam pivots' },
  { id: 'heat-wave-set', componentRef: 'heat-wave-system', count: 4, realization: 'geometry', buildsGeometry: true, geometry: { primitive: 'thick-irregular-torus', forbidden: ['PlaneGeometry', 'Sprite', 'Line'] }, distribution: 'four time-offset closed volumetric waves' },
];

spec.qualityTargets = {
  targetFidelity: 0.82,
  mustMatch: ['same microwave identity and archived v1 envelope', 'left-hinged door and fixed right control order', 'tray, food, light and effect emitter contact', 'rear service, vents and power inlet', 'single timeline owner and exact reset', 'stable unequal outline hierarchy'],
  niceToHave: ['stronger top and side plane readability', 'lower triangle count than v1'],
  fpsTarget: 60,
  reviewViewpoints: ['front', 'side', 'back', 'three-quarter', 'startup', 'climax', 'wind-down'],
};
spec.qualityContract = {
  ...spec.qualityContract,
  qualityBar: 'ultra-complex',
  definitionOfDone: [
    'All four static views match the upgraded faceted silhouette while remaining inside the archived v1 Box3.',
    'Door, handle, control tower, cavity, tray, food, rear service and feet retain their exact runtime attachment points.',
    'All frozen pivots and sockets preserve parent paths and idle transforms within 1e-4.',
    'Startup, climax, wind-down, stop and rebuild retain one timeline owner, 24 steam lobes, four thick waves and exact reset.',
    'Main, structure and detail contours use the required stable unequal width hierarchy without clumping on glass or effects.',
  ],
  minimumSpecDepth: { macroComponents: 6, mesoComponents: 16, microFeatureGroups: 24, materialLayers: 9, repetitionSystems: 6, reviewViewpoints: 7 },
  featureGroups: [
    { id: 'microwave-silhouette', name: 'Faceted wide-low microwave silhouette', required: true, qualityCriteria: ['Dominant left door, narrow right control tower and deep side shell remain inside the archived bounds.'], evidenceRefs: evidenceIds, failureModes: ['soft inflated shell', 'control tower merge', 'envelope growth'] },
    { id: 'door-cavity-system', name: 'Door, gasket, glass and cavity depth', required: true, qualityCriteria: ['Door rotates on the archived hinge and the cavity remains visible without glass sorting artifacts.'], evidenceRefs: ['front-view', 'side-view', 'three-quarter-view'], failureModes: ['floating handle', 'blocked cavity', 'glass projection'] },
    { id: 'control-system', name: 'Display, buttons and oversized dial', required: true, qualityCriteria: ['Control order and all pivot centers remain frozen.'], evidenceRefs: ['front-view', 'three-quarter-view'], failureModes: ['face-like controls', 'moved dial', 'extra keypad'] },
    { id: 'rear-service-system', name: 'Rear service cassette and power entry', required: true, qualityCriteria: ['Four-by-five vents, four fasteners and rear socket remain countable and aligned.'], evidenceRefs: ['back-view'], failureModes: ['missing vent', 'moved inlet', 'flat rear'] },
    { id: 'animation-contact', name: 'Tray, food, steam and heat animation contact', required: true, qualityCriteria: ['All effects originate from their archived positions and reset exactly.'], evidenceRefs: ['animation-contract'], failureModes: ['old-position emission', 'duplicate timeline', 'reset drift'] },
    { id: 'outline-hierarchy', name: 'Stable unequal SAKURA ink hierarchy', required: true, qualityCriteria: ['Three widths stay stable under rotation and avoid transparent or tiny effect clumps.'], evidenceRefs: ['three-quarter-view'], failureModes: ['uniform outline', 'temporal shimmer', 'black clumps'] },
  ],
  visualDeltaChecks: ['full-tree bounds delta', 'door window and handle contact delta', 'control pivot delta', 'rear socket and cable anchor projection delta', 'outline tier stability delta', 'startup/climax/wind-down effect contact delta'],
};
spec.featureReviewTargets = [
  ['microwave-silhouette', 'Faceted wide-low silhouette', 'blockout', ['cabinet-frame', 'door-assembly', 'control-assembly'], ['front-view', 'side-view', 'three-quarter-view']],
  ['door-cavity-system', 'Door, glass and cavity system', 'structural-pass', ['door-assembly', 'cavity-assembly'], ['front-view', 'side-view', 'three-quarter-view']],
  ['control-system', 'Display, buttons and dial', 'form-refinement', ['control-assembly', 'dial-system'], ['front-view', 'three-quarter-view']],
  ['rear-service-system', 'Rear service cassette', 'form-refinement', ['rear-service-assembly'], ['back-view']],
  ['outline-hierarchy', 'Three-tier stable outline response', 'material-pass', ['cabinet-frame', 'door-assembly', 'control-assembly'], ['three-quarter-view']],
  ['animation-contact', 'Tray, food, steam and heat contact', 'interaction-pass', ['tray-food-system', 'performance-rig'], ['animation-contract']],
].map(([id, name, passId, componentRefs, evidenceRefs]) => ({ id, name, tier: 'critical', passIds: [passId], minimumScore: 0.82, mustPass: true, componentRefs, evidenceRefs }));

spec.buildPasses = spec.buildPasses.filter((pass) => pass.id !== 'surface-pass');
const passRefs = {
  blockout: ['cabinet-frame', 'door-assembly', 'control-assembly'],
  'structural-pass': ['door-assembly', 'cavity-assembly', 'rear-service-assembly'],
  'form-refinement': ['top-hood', 'door-handle', 'dial-system', 'rear-service-panel'],
  'material-pass': ['cabinet-frame', 'door-assembly', 'control-assembly', 'rear-service-assembly'],
  'lighting-pass': ['root'],
  'interaction-pass': ['tray-food-system', 'performance-rig', 'scene-edge-sockets'],
  'optimization-pass': ['root'],
};
for (const pass of spec.buildPasses) pass.componentRefs = passRefs[pass.id] ?? ['root'];
spec.selfCorrectLoop.visualAcceptance.threshold = 0.8;
spec.selfCorrectLoop.reviewAfterPasses = spec.buildPasses.map((pass) => pass.id);
spec.selfCorrectLoop.screenshotPolicy.requiredForPasses = spec.buildPasses.filter((pass) => pass.id !== 'optimization-pass').map((pass) => pass.id);
spec.visualEvidence = [];
spec.reviewHistory = [];
spec.tier1Results = [];
spec.sculptPipeline = { passGateMode: 'locked-sequential', passOrder: spec.buildPasses.map((pass) => pass.id), currentPass: 'blockout', completedPasses: [], lastCompletedPass: '', blockedReason: 'blockout requires deterministic browser screenshots and comparison review', nextRequiredEvidence: [] };
spec.performanceBudget = { qualityPriority: 'reference-fidelity real-time browser', targetTriangles: 43788, maxTriangles: 59114, maxDrawCalls: 171, textureSize: 1024, fpsTarget: 60, optimizationPolicy: 'Use 6-12 sided profiles, shared geometry and bounded repetition while preserving every frozen animation node.' };
spec.lightingFromPhoto = [
  'warm upper-left key light with broad soft shadow',
  'cool right-rear lavender fill light',
  'pink rear rim light on stepped planes',
  'neutral exposure with ACES tone mapping on pale lavender background',
  'soft floor contact shadow beneath all four feet',
];
spec.proceduralStrategy = [
  'Freeze archived bounds, pivots, semantic sockets, colliders and line anchors before visual edits.',
  'Replace soft rounded cabinet masses with clipped low-poly panels and stepped depth bands.',
  'Keep the exact door, cavity, tray, food, control and effect hierarchy.',
  'Apply stable object-space outline tiers only to appropriate opaque geometry.',
  'Review four static views plus startup, climax and wind-down before optimization.',
];
spec.animationAnchors = [
  'door hinge, handle, tray rotor, food, dial, small-button and lower-button pivots',
  'interior light, eight steam roots and four heat-wave meshes',
  'rear power socket and four frozen scene-edge connection sockets',
];
spec.risks = [
  'Deeper door layers must not occlude the cavity or make the tray project through glass.',
  'Thicker handle and dial geometry must not move their archived pivots or exceed the Box3.',
  'Glass, mesh, steam and heat waves must avoid outline and transparency clumping.',
  'New side and top planes must preserve cable anchor screen projections.',
];
spec.assumptions = [
  'The generated sheet is stylized visual evidence rather than dimensional truth.',
  'Hidden electronics and internal hinge construction remain omitted.',
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

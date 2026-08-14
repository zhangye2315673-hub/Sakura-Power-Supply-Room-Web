#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const specRoot = path.join(root, 'docs', 'sculpt-specs-v2', 'refrigerator');
const assessmentPath = path.join(specRoot, 'pre-spec-assessment.json');
const inventoryPath = path.join(specRoot, 'detail-inventory.json');
const specPath = path.join(specRoot, 'object-sculpt-spec.json');

const [starter, assessmentEnvelope, inventoryEnvelope] = await Promise.all([
  readFile(specPath, 'utf8').then(JSON.parse),
  readFile(assessmentPath, 'utf8').then(JSON.parse),
  readFile(inventoryPath, 'utf8').then(JSON.parse),
]);

const spec = structuredClone(starter);
const refRoot = 'references/intake-v2/refrigerator';
const views = {
  front: `${refRoot}/views/front.png`,
  side: `${refRoot}/views/side.png`,
  back: `${refRoot}/views/back.png`,
  threeQuarter: `${refRoot}/views/three-quarter.png`,
};
const allEvidence = ['front-view', 'side-view', 'back-view', 'three-quarter-view'];

spec.targetName = 'SAKURA Refrigerator v2';
spec.targetId = 'refrigerator-v2';
spec.sourceImage = `${refRoot}/refrigerator-turnsheet-v2.png`;
spec.suitability = 'pass';
spec.scores = {
  object_isolation: 3,
  silhouette_readability: 3,
  depth_inference: 3,
  primitive_decomposition: 3,
  material_procedurality: 3,
  occlusion_risk: 2,
  interaction_fit: 3,
};
spec.referenceCamera = {
  solved: true,
  projection: 'orthographic-like four-view turn-sheet',
  fovDegrees: 31,
  aspect: 1,
  orientation: { yaw: 0, pitch: 0, roll: 0 },
  positionHint: [0, 2.5725, 10],
  note: 'IMAGEN supplies visual form evidence. The archived v1 runtime contract is authoritative for bounds, pivots, sockets, colliders and animation state.',
};
spec.coordinateFrame = {
  front: '+Z faces the closed doors',
  up: '+Y with floor at Y=0',
  scaleReference: 'archived v1 full-tree bounds 2.885 x 5.145 x 2.6395',
};
spec.silhouette = {
  boundingShape: 'narrow tall top-freezer cuboid with stepped crown and lower plinth',
  aspectRatios: [2.885 / 5.145, 2.6395 / 5.145],
  symmetry: 'front bilateral mass with asymmetric right-edge hinges and left handles',
  dominantCurves: ['stepped crown chamfer', 'faceted door perimeter', 'subtle side-wall taper'],
  negativeSpaces: ['freezer-main separation undercut', 'handle standoff gaps', 'plinth foot gaps'],
  landmarks: ['upper freezer split at Y=3.28', 'right hinge line', 'rear lower service plate'],
};

spec.viewEvidence = [
  ['front-view', 'front', views.front, ['top-freezer split', 'two left handles', 'right hinge caps', 'stepped plinth'], 0.99],
  ['side-view', 'side', views.side, ['deep cabinet', 'door thickness', 'hinge line', 'rear service projection'], 0.98],
  ['back-view', 'back', views.back, ['rear service plate', 'five vent slats', 'four fasteners', 'power inlet'], 0.99],
  ['three-quarter-view', 'three-quarter', views.threeQuarter, ['faceted crown', 'door bevel bands', 'tapered side planes', 'outline hierarchy'], 0.99],
].map(([id, view, imagePath, observations, confidence]) => ({
  id,
  view,
  imagePath,
  imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' },
  observations,
  confidence,
}));

const featureData = [
  ['detail-01', 'contour', 'cabinet-frame', 'Narrow tall full-tree envelope remains inside the archived Box3.'],
  ['detail-02', 'bevel', 'stepped-crown', 'Stepped crown uses broad eight-sided corner planes and a narrow highlight band.'],
  ['detail-03', 'contour', 'side-panel-system', 'Side walls taper subtly toward the crown without changing footprint extremes.'],
  ['detail-04', 'bevel', 'upper-door-shell', 'Upper freezer door uses a thick faceted perimeter and recessed face plane.'],
  ['detail-05', 'bevel', 'lower-door-shell', 'Lower main door uses a deeper faceted perimeter and recessed face plane.'],
  ['detail-06', 'seam', 'freezer-divider', 'Dark freezer-main separation undercut remains readable at catalog scale.'],
  ['detail-07', 'contour', 'upper-handle-assembly', 'Upper handle has a chunky octagonal grip, two pink standoffs and mint insert.'],
  ['detail-08', 'contour', 'lower-handle-assembly', 'Lower handle repeats the grip language at larger vertical scale.'],
  ['detail-09', 'fastener', 'hinge-cap-system', 'Four pink hinge blocks share a stable low-poly form along the right edge.'],
  ['detail-10', 'linework', 'gasket-system', 'Upper and lower gasket frames remain true perimeter geometry around open cavities.'],
  ['detail-11', 'contour', 'upper-cavity-panels', 'Freezer cavity preserves separate back, side, ceiling and floor panels.'],
  ['detail-12', 'contour', 'lower-cavity-panels', 'Main cavity preserves separate back, side, ceiling and floor panels.'],
  ['detail-13', 'linework', 'shelf-system', 'Three volumetric shelves retain front lips and archived heights.'],
  ['detail-14', 'bevel', 'produce-drawer', 'Produce drawer retains a thick faceted front and recessed translucent inset.'],
  ['detail-15', 'linework', 'door-bin-system', 'One freezer bin and three main-door bins preserve surface contact and count.'],
  ['detail-16', 'contour', 'rear-service-panel', 'Rear lower service plate has a thick pink stepped perimeter.'],
  ['detail-17', 'linework', 'rear-vent-system', 'Five horizontal rear vent slats keep even rhythm and dark cavities.'],
  ['detail-18', 'fastener', 'rear-fastener-system', 'Four rear service fasteners remain legible without heavy contour clumps.'],
  ['detail-19', 'contour', 'power-entry-assembly', 'Rear power inlet remains anchored beside the service plate at the frozen socket.'],
  ['detail-20', 'contour', 'foot-system', 'Four dark feet support the pink plinth at the archived ground plane.'],
  ['detail-21', 'contour', 'food-performance-rig', 'Seven named food pivots retain distinct closed low-poly volumes.'],
  ['detail-22', 'gloss', 'interior-light-system', 'Two cold interior light bars remain emissive and free of heavy outline.'],
  ['detail-23', 'contour', 'scene-edge-socket-system', 'Four zero-geometry edge sockets freeze the archived line anchors.'],
  ['detail-24', 'contour', 'outline-hierarchy', 'Main, structure and detail contours use stable 0.0048, 0.0041 and 0.0033 widths with 0.18 variation.'],
];
const details = featureData.map(([id, kind, ref, description], index) => ({
  id,
  kind,
  description,
  region: { x: (index % 4) * 0.25, y: Math.floor(index / 4) * 0.16, width: 0.25, height: 0.16, units: 'normalized' },
  scale: index < 6 ? 'macro' : index < 20 ? 'meso' : 'micro',
  affects: kind === 'gloss' ? 'materialSurface' : 'geometry, materialSurface',
  mapsTo: ref === 'outline-hierarchy'
    ? { type: 'material.localOverrides', ref }
    : { type: 'component.localFeatures', ref },
  evidenceRef: index >= 15 && index <= 18 ? views.back : views.threeQuarter,
  confidence: 0.96,
}));

spec.preSpecAssessment = {
  ...spec.preSpecAssessment,
  objectClass: {
    primaryType: 'faceted retro top-freezer refrigerator',
    primaryDomain: 'object',
    formLanguage: ['hard-surface', 'low-poly', 'faceted', 'retro appliance'],
    structureKind: ['compound object', 'layered shell', 'articulated assembly', 'repeated modules'],
    motionPotential: ['articulated doors', 'effect-emitter', 'whole-object deform', 'destructible'],
    materialFamilies: ['matte plastic', 'satin painted metal', 'rubber gasket', 'transparent shelf', 'indicator lens'],
    notes: 'The archived rig is compatibility truth. The four-view sheet reallocates only visual mass inside the frozen envelope.',
  },
  complexity: {
    tier: 'ultra-complex',
    scores: {
      silhouetteComplexity: 2,
      componentCount: 3,
      hierarchyDepth: 3,
      repetitionDensity: 3,
      materialLayerCount: 3,
      localDetailDensity: 3,
      occlusionRisk: 3,
      actionReadinessNeed: 3,
    },
    estimatedCounts: {
      macroComponents: 7,
      mesoComponents: 24,
      microFeatureGroups: details.length,
      materialLayers: 9,
      repetitionSystems: 8,
    },
    reasoning: [
      'Two independent doors rotate through large arcs while retaining liners, handles and four door bins.',
      'Two true cavities, three shelves, a drawer and seven home sockets must remain aligned when doors open.',
      'Seven semantic food props use staggered launch, side-clear orbit, front party, exact return and reset.',
      'Rear compressor vibration, power socket, scene-edge anchors and five collider records remain runtime contracts.',
    ],
  },
  specDepthDecision: {
    requiredDepth: 'ultra-complex',
    minimumComponentLevels: ['macro', 'meso', 'micro'],
    needsRepetitionSystems: true,
    needsMaterialLocalOverrides: true,
    needsMultipleReviewViews: true,
    needsActionReadyHierarchy: true,
    rationale: 'Visual replacement touches an animation-rich articulated appliance with interior and exterior evidence.',
  },
  unknownsToResolveBeforeImplementation: [],
  detailInventory: {
    scanMethod: 'grid-4x4 plus four-view component review',
    targetMinDetails: 24,
    details,
  },
  sourceImage: spec.sourceImage,
};
spec.localSpecSearch = assessmentEnvelope.localSpecSearch;

function referencePbr(materialId, imagePath, confidence) {
  const base = `docs/sculpt-specs-v2/refrigerator/pbr/${materialId}`;
  return {
    usable: true,
    confidence,
    estimatedFidelity: confidence,
    sourceImage: imagePath,
    maps: {
      albedo: { path: `${base}/${materialId}_albedo.png` },
      roughness: { path: `${base}/${materialId}_roughness.png` },
      height: { path: `${base}/${materialId}_height.png` },
      normal: { path: `${base}/${materialId}_normal.png` },
      ao: { path: `${base}/${materialId}_ao.png` },
    },
  };
}

function material(id, name, color, secondary, sourceImage, confidence, options = {}) {
  return {
    id,
    name,
    type: options.type ?? 'physical',
    shaderModel: options.shaderModel ?? 'MeshToonMaterial project style with reference-derived PBR evidence',
    baseColor: color,
    color,
    albedo: { dominant: color, secondary, samplingNotes: 'Sampled from the admitted four-view reference.' },
    colorVariation: { palette: [color, ...secondary], pattern: 'stable molded value bands', amplitude: 0.04 },
    textureResolution: 1024,
    textureProjection: { mode: 'object-space', repeat: [2, 2], anisotropy: 8, texelDensityIntent: 'stable object-scale detail' },
    surfaceFrequencyBands: [
      { id: 'macro', frequency: 2, amplitude: 0.16, role: 'broad planar value rolloff' },
      { id: 'meso', frequency: 14, amplitude: 0.07, role: 'seam and chamfer response' },
      { id: 'micro', frequency: 64, amplitude: 0.02, role: 'restrained grazing-light breakup' },
    ],
    roughness: { base: options.roughness ?? 0.5, variation: 0.08, map: 'independent roughness field', localResponse: 'higher in cavities and lower on chamfer crowns' },
    metalness: { base: options.metalness ?? 0, variation: 0 },
    normal: { pattern: 'independent molded micro-normal', strength: 0.06, scale: 32, space: 'tangent' },
    bump: { pattern: 'restrained molded micrograin', amplitude: 0.006, scale: 64 },
    displacement: { pattern: 'none', amplitude: 0, scale: 1, silhouetteAffects: false },
    ambientOcclusion: { cavityStrength: 0.3, contactShadowBias: 0.3, notes: 'panel seams, handle standoffs and service recesses' },
    wear: { edgeWear: 0.01, scratches: [], chips: [] },
    dirt: { amount: 0.005, cavityBias: 0.25, color: '#514650' },
    localOverrides: [{
      id: `${id}-edge-response`,
      region: 'named visible component zones',
      response: 'localized roughness and cavity response under Toon bands',
      roughness: options.roughness ?? 0.5,
      evidenceRefs: allEvidence,
    }],
    referencePbr: referencePbr(id, sourceImage, confidence),
  };
}

spec.materials = [
  material('cream-shell', 'Warm Cream Satin Shell', '#F5EBDD', ['#FFF7E9', '#D8CBC5'], views.front, 0.86, { roughness: 0.48 }),
  material('cream-highlight', 'Cream Highlight Chamfer', '#FFF5E8', ['#F0DFD2', '#C9BAC5'], views.threeQuarter, 0.83, { roughness: 0.44 }),
  material('pink-structure', 'Sakura Pink Structure', '#E9A8BC', ['#F4BED0', '#A9708F'], views.back, 0.85, { roughness: 0.5 }),
  material('mint-accent', 'Muted Mint Accent', '#A9D3CB', ['#C9E6DE', '#678D90'], views.front, 0.82, { roughness: 0.46 }),
  material('plum-cavity', 'Deep Plum Cavity', '#574C5E', ['#736879', '#39333F'], views.threeQuarter, 0.8, { roughness: 0.62 }),
  material('interior-mint', 'Cool Interior Liner', '#D8E8E4', ['#EDF5F1', '#8EAAA9'], views.front, 0.8, { roughness: 0.42 }),
  material('transparent-shelf', 'Translucent Mint Shelf', '#DDEEEA', ['#FFFFFF', '#A5C5C2'], views.front, 0.78, { roughness: 0.28, type: 'physical-transparent' }),
  material('metal-detail', 'Cool Grey Metal Detail', '#A7A2AC', ['#CDC8CF', '#68616E'], views.back, 0.8, { roughness: 0.38, metalness: 0.7 }),
  material('food-palette', 'Semantic Food Toon Palette', '#D86B79', ['#E6A05F', '#79A978', '#8FC4C8'], views.threeQuarter, 0.78, { roughness: 0.56 }),
];
spec.materials[0].localOverrides.push({
  id: 'outline-hierarchy',
  region: 'opaque cabinet, doors, structural panels and small exterior details',
  response: 'main 0.0048, structure 0.0041, detail 0.0033, stable object-space variation 0.18',
  evidenceRefs: allEvidence,
});

function component(id, name, level, role, parent, materialId, primitive, localFeatures, options = {}) {
  const evidenceRefs = options.evidenceRefs ?? allEvidence;
  const primitiveMap = {
    'rounded-box-frame': 'box',
    'faceted-extrude': 'extrude',
    'open-box-assembly': 'box',
    'faceted-panel': 'extrude',
    'rounded-box': 'box',
    'faceted-rail': 'box',
    'faceted-frame': 'extrude',
    'faceted-recess': 'extrude',
    'material-only': 'plane-card',
  };
  const hexToRgba = (hex) => {
    const value = Number.parseInt(hex.slice(1), 16);
    return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, 1)`;
  };
  const selectedMaterial = spec.materials.find((entry) => entry.id === materialId);
  const materialClass = materialId === 'plum-cavity'
    ? 'rubber'
    : materialId === 'metal-detail'
      ? 'metal'
      : 'plastic';
  return {
    id,
    name,
    level,
    role,
    importance: options.importance ?? 0.86,
    confidence: options.confidence ?? 0.96,
    primitive: primitiveMap[primitive] ?? primitive,
    topologyClass: options.topologyClass ?? 'assembled-solid',
    topologyRationale: options.topologyRationale ?? 'Rigid low-poly hard-surface assembly with countable broad planes, stepped chamfers and a stable seam.',
    parent,
    attachment: parent ? {
      parentSocket: `${parent}-socket`,
      localStart: [0, 0, 0],
      localEnd: [0, options.length ?? 0.04, 0],
      contactType: options.contactType ?? 'overlap',
      overlap: options.overlap ?? 0.025,
      gapTolerance: options.gapTolerance ?? 0.01,
      evidenceRefs,
    } : null,
    dimensions: options.dimensions ?? { width: 1, height: 1, depth: 1, units: 'relative', confidence: 0.92 },
    transform: { position: options.position ?? [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
    actionProfile: {
      animationRole: options.animationRole ?? 'static-part',
      pivot: { mode: options.pivotMode ?? 'center', localPosition: options.pivot ?? [0, 0, 0], axis: options.axis ?? [0, 1, 0], confidence: 0.99 },
      collider: options.collider ?? null,
      destruction: { breakable: false, fractureGroup: options.fractureGroup ?? id, seamRefs: [], detachableFragments: [] },
    },
    material: materialId,
    materialLayers: [materialId],
    localFeatures,
    surfaceDetail: {
      macroRoughness: 0.12,
      microRoughness: 0.04,
      bumpAmplitude: 0.006,
      normalPattern: 'stable object-space molded response',
      displacementPattern: 'none',
      occlusionPattern: 'panel seams and contact overlaps',
      edgeWearPattern: 'restrained chamfer highlight',
      notes: 'Broad low-poly planes remain visually dominant.',
    },
    colorMaterialRecipe: {
      dominantAlbedo: hexToRgba(selectedMaterial?.baseColor ?? '#F5EBDD'),
      secondaryAlbedo: hexToRgba(selectedMaterial?.albedo.secondary[0] ?? '#FFFFFF'),
      materialClass: options.materialClass ?? materialClass,
      materialClassConfidence: 0.94,
    },
    evidenceRefs,
    details: localFeatures.map((feature) => ({ id: feature, kind: 'construction', evidenceRefs })),
    fidelityTier: 'form-refinement',
  };
}

spec.componentTree = [
  component('root', 'Refrigerator Runtime Root', 'macro', 'container', null, 'cream-shell', 'box', ['root-runtime'], { importance: 1 }),
  component('cabinet-frame', 'Open Load-bearing Cabinet Frame', 'macro', 'body', 'root', 'cream-shell', 'rounded-box-frame', ['detail-01'], { dimensions: { width: 2.6, height: 4.7, depth: 1.82, units: 'world', confidence: 1 }, collider: { type: 'compound-box', offset: [0, 2.62, -0.01], scale: [2.6, 4.7, 1.82], isTrigger: false } }),
  component('upper-door-assembly', 'Upper Freezer Door Assembly', 'macro', 'door', 'root', 'cream-highlight', 'faceted-extrude', ['detail-04'], { animationRole: 'hinged-door', pivotMode: 'hinge', pivot: [1.38, 4.31, 1.02], axis: [0, 1, 0] }),
  component('lower-door-assembly', 'Lower Main Door Assembly', 'macro', 'door', 'root', 'cream-highlight', 'faceted-extrude', ['detail-05'], { animationRole: 'hinged-door', pivotMode: 'hinge', pivot: [1.38, 2, 1.02], axis: [0, 1, 0] }),
  component('upper-cavity', 'Freezer Cavity Assembly', 'macro', 'interior', 'root', 'interior-mint', 'open-box-assembly', ['detail-11'], { animationRole: 'visibility-state' }),
  component('lower-cavity', 'Main Cavity Assembly', 'macro', 'interior', 'root', 'interior-mint', 'open-box-assembly', ['detail-12'], { animationRole: 'visibility-state' }),
  component('rear-service-assembly', 'Rear Compressor Service Assembly', 'macro', 'service', 'root', 'pink-structure', 'faceted-panel', ['detail-16', 'detail-19'], { animationRole: 'vibration' }),
  component('food-performance-rig', 'Seven-prop Food Performance Rig', 'macro', 'effect', 'root', 'food-palette', 'instanced-cluster', ['detail-21'], { animationRole: 'model-owned-performance' }),

  component('stepped-crown', 'Stepped Faceted Crown', 'meso', 'shell', 'cabinet-frame', 'cream-highlight', 'faceted-extrude', ['detail-02']),
  component('side-panel-system', 'Tapered Side Panel Pair', 'meso', 'shell', 'cabinet-frame', 'cream-shell', 'faceted-extrude', ['detail-03']),
  component('rear-inset-panel', 'Rear Inset Shell', 'meso', 'shell', 'cabinet-frame', 'cream-shell', 'rounded-box', ['rear-depth-step']),
  component('freezer-divider', 'Freezer Main Divider', 'meso', 'structure', 'cabinet-frame', 'plum-cavity', 'faceted-rail', ['detail-06']),
  component('base-plinth', 'Pink Stepped Base Plinth', 'meso', 'structure', 'root', 'pink-structure', 'faceted-extrude', ['base-step-band']),
  component('upper-door-shell', 'Faceted Upper Door Shell', 'meso', 'shell', 'upper-door-assembly', 'cream-highlight', 'faceted-extrude', ['detail-04']),
  component('lower-door-shell', 'Faceted Lower Door Shell', 'meso', 'shell', 'lower-door-assembly', 'cream-highlight', 'faceted-extrude', ['detail-05']),
  component('upper-handle-assembly', 'Upper Octagonal Handle', 'meso', 'handle', 'upper-door-assembly', 'pink-structure', 'tube', ['detail-07'], { contactType: 'socket', pivotMode: 'custom' }),
  component('lower-handle-assembly', 'Lower Octagonal Handle', 'meso', 'handle', 'lower-door-assembly', 'pink-structure', 'tube', ['detail-08'], { contactType: 'socket', pivotMode: 'custom' }),
  component('hinge-cap-system', 'Four Right-edge Hinge Caps', 'meso', 'joint', 'root', 'pink-structure', 'instanced-cluster', ['detail-09']),
  component('gasket-system', 'Upper and Lower Perimeter Gaskets', 'meso', 'seal', 'root', 'plum-cavity', 'faceted-frame', ['detail-10'], { topologyClass: 'surface-relief' }),
  component('upper-cavity-panels', 'Freezer Cavity Panels', 'meso', 'interior', 'upper-cavity', 'interior-mint', 'open-box-assembly', ['detail-11']),
  component('lower-cavity-panels', 'Main Cavity Panels', 'meso', 'interior', 'lower-cavity', 'interior-mint', 'open-box-assembly', ['detail-12']),
  component('shelf-system', 'Three Volumetric Shelves', 'meso', 'storage', 'root', 'transparent-shelf', 'instanced-cluster', ['detail-13']),
  component('produce-drawer', 'Faceted Produce Drawer', 'meso', 'storage', 'lower-cavity', 'interior-mint', 'rounded-box', ['detail-14']),
  component('door-bin-system', 'Four Volumetric Door Bins', 'meso', 'storage', 'root', 'transparent-shelf', 'instanced-cluster', ['detail-15']),
  component('rear-service-panel', 'Rear Lower Service Plate', 'meso', 'service', 'rear-service-assembly', 'pink-structure', 'faceted-panel', ['detail-16']),
  component('rear-vent-system', 'Five Rear Vent Slats', 'meso', 'vent', 'rear-service-assembly', 'plum-cavity', 'instanced-cluster', ['detail-17']),
  component('rear-fastener-system', 'Four Rear Fasteners', 'micro', 'fastener', 'rear-service-assembly', 'metal-detail', 'instanced-cluster', ['detail-18']),
  component('power-entry-assembly', 'Rear Power Entry', 'meso', 'socket', 'rear-service-assembly', 'plum-cavity', 'faceted-recess', ['detail-19'], { animationRole: 'attachment-socket' }),
  component('foot-system', 'Four Ground Feet', 'meso', 'support', 'root', 'plum-cavity', 'instanced-cluster', ['detail-20']),
  component('interior-light-system', 'Two Interior Cold Light Bars', 'micro', 'light', 'root', 'mint-accent', 'instanced-cluster', ['detail-22'], { animationRole: 'visibility-state' }),
  component('scene-edge-socket-system', 'Frozen Scene Edge Connection Sockets', 'meso', 'attachment', 'root', 'plum-cavity', 'instanced-cluster', ['detail-23'], { animationRole: 'attachment-socket' }),
  component('outline-hierarchy', 'Stable Unequal Outline System', 'micro', 'material-style', 'root', 'plum-cavity', 'material-only', ['detail-24'], { topologyClass: 'material-only' }),
];

spec.repetitionSystems = [
  ['hinge-cap-repeat', 'hinge-cap-system', 4, 'two caps aligned to each frozen door pivot'],
  ['shelf-repeat', 'shelf-system', 3, 'one freezer and two main-cavity shelves at frozen heights'],
  ['door-bin-repeat', 'door-bin-system', 4, 'one upper and three lower door-local bins'],
  ['rear-vent-repeat', 'rear-vent-system', 5, 'even horizontal rear-service rhythm'],
  ['rear-fastener-repeat', 'rear-fastener-system', 4, 'service-plate corner fasteners'],
  ['foot-repeat', 'foot-system', 4, 'four cabinet support corners'],
  ['food-prop-repeat', 'food-performance-rig', 7, 'seven named semantic food pivots with fixed home sockets'],
  ['scene-edge-repeat', 'scene-edge-socket-system', 4, 'left right top bottom frozen cable anchors'],
].map(([id, componentRef, count, distribution]) => ({
  id,
  name: id.replaceAll('-', ' '),
  componentRef,
  count,
  distribution,
  geometry: 'closed low-poly solids or zero-geometry Object3D sockets as appropriate',
  material: componentRef === 'scene-edge-socket-system' ? 'plum-cavity' : 'pink-structure',
  evidenceRefs: allEvidence,
}));

spec.qualityContract = {
  ...spec.qualityContract,
  qualityBar: 'ultra-complex',
  definitionOfDone: [
    'The stepped crown, faceted doors, tapered sides, bold handles, right hinges and rear service plate match the v2 sheet inside the archived v1 bounds.',
    'All existing animated pivots, semantic sockets, collider records and idle transforms remain compatible, with four frozen scene-edge sockets added.',
    'Both doors, interiors, four bins, shelves, drawer and seven food props retain animation contact and exact stop reset.',
    'Opaque assemblies use the stable 0.0048, 0.0041 and 0.0033 outline hierarchy without clumping transparent or tiny parts.',
  ],
  minimumSpecDepth: {
    macroComponents: 7,
    mesoComponents: 20,
    microFeatureGroups: 24,
    materialLayers: 8,
    repetitionSystems: 8,
    reviewViewpoints: 7,
  },
  featureGroups: [
    { id: 'refrigerator-envelope', name: 'Frozen refrigerator envelope and silhouette', required: true, qualityCriteria: ['V1 full-tree Box3, ground and four edge anchors stay compatible while the crown and plinth read more strongly.'], evidenceRefs: allEvidence, failureModes: ['bounds drift', 'wider footprint', 'thin side view', 'ground float'] },
    { id: 'door-cavity-system', name: 'Two-door and two-cavity articulated system', required: true, qualityCriteria: ['Door pivots, liners, handles, gaskets, cavities, shelves and bins retain attachment through the full opening arc.'], evidenceRefs: ['front-view', 'side-view', 'three-quarter-view'], failureModes: ['hinge move', 'door collision', 'interior hidden', 'bin floats'] },
    { id: 'rear-service-system', name: 'Rear service and power system', required: true, qualityCriteria: ['Lower service plate, five vents, four fasteners and power inlet match the back view without moving frozen sockets.'], evidenceRefs: ['back-view'], failureModes: ['vent count changes', 'power socket drift', 'compressor vibration affects root'] },
    { id: 'food-animation-contact', name: 'Seven-prop food animation contact', required: true, qualityCriteria: ['Every prop retains its home support, side-clear route, launch order, front climax and exact return.'], evidenceRefs: ['front-view', 'three-quarter-view'], failureModes: ['old-position launch', 'cabinet crossing', 'home socket mismatch', 'reset residue'] },
    { id: 'outline-hierarchy', name: 'Stable unequal outline hierarchy', required: true, qualityCriteria: ['Main, structure and detail widths remain stable under rotation and animation while transparent and tiny parts avoid black clumps.'], evidenceRefs: allEvidence, failureModes: ['uniform technical line', 'temporal wobble', 'shelf clump', 'food clump'] },
  ],
  visualDeltaChecks: [
    'archived full-tree bounds, center, ground and four connection anchors',
    'upper and lower hinge paths and peak rotation clearance',
    'cavity, shelf, drawer and door-bin surface contact',
    'seven food home sockets, route clearance and front-party emission',
    'rear service, power inlet and compressor socket transforms',
    'four-view low-poly silhouette and stable unequal outline hierarchy',
  ],
};

spec.qualityTargets = {
  targetFidelity: 0.84,
  mustMatch: [
    'same top-freezer refrigerator identity and archived v1 envelope',
    'smaller upper door, larger lower door, two left handles and right hinges',
    'stepped crown, faceted doors, tapered side planes and pink lower plinth',
    'rear lower service panel with five vents, four fasteners and power inlet',
    'two true cavities, shelves, drawer, four bins and seven food home zones',
    'single timeline owner, exact return and exact stop reset',
    'stable unequal dark-plum outline hierarchy',
  ],
  niceToHave: ['lower triangle count than v1', 'stronger side depth and rear service readability'],
  fpsTarget: 60,
  reviewViewpoints: ['front', 'side', 'back', 'three-quarter', 'long-axis', 'thickness-axis', 'three-quarter-powered'],
};
spec.selfCorrectLoop.visualAcceptance.threshold = 0.8;
spec.selfCorrectLoop.visualAcceptance.featureReviewPolicy.criticalDefaultThreshold = 0.82;
spec.selfCorrectLoop.visualAcceptance.featureReviewPolicy.importantAverageThreshold = 0.75;
spec.featureReviewTargets = [
  { id: 'refrigerator-silhouette', name: 'Frozen tall envelope stepped crown and plinth silhouette', tier: 'critical', passIds: ['blockout', 'form-refinement'], minimumScore: 0.82, mustPass: true, componentRefs: ['cabinet-frame', 'stepped-crown', 'side-panel-system', 'base-plinth'], evidenceRefs: allEvidence },
  { id: 'door-cavity-system', name: 'Two doors gaskets cavities shelves drawer and bins', tier: 'critical', passIds: ['structural-pass', 'form-refinement', 'interaction-pass'], minimumScore: 0.84, mustPass: true, componentRefs: ['upper-door-assembly', 'lower-door-assembly', 'upper-cavity', 'lower-cavity', 'shelf-system', 'door-bin-system'], evidenceRefs: ['front-view', 'side-view', 'three-quarter-view'] },
  { id: 'handle-hinge-system', name: 'Chunky handles standoffs and frozen right hinges', tier: 'critical', passIds: ['structural-pass', 'form-refinement', 'interaction-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['upper-handle-assembly', 'lower-handle-assembly', 'hinge-cap-system'], evidenceRefs: ['front-view', 'side-view', 'three-quarter-view'] },
  { id: 'rear-service-system', name: 'Rear service plate vents fasteners and power entry', tier: 'important', passIds: ['structural-pass', 'form-refinement', 'material-pass'], minimumScore: 0.78, mustPass: false, componentRefs: ['rear-service-panel', 'rear-vent-system', 'rear-fastener-system', 'power-entry-assembly'], evidenceRefs: ['back-view'] },
  { id: 'food-animation-contact', name: 'Seven semantic props full route and exact reset', tier: 'critical', passIds: ['interaction-pass'], minimumScore: 0.84, mustPass: true, componentRefs: ['food-performance-rig', 'upper-cavity', 'lower-cavity', 'door-bin-system'], evidenceRefs: ['front-view', 'three-quarter-view'] },
  { id: 'outline-hierarchy', name: 'Stable unequal main structure and detail contours', tier: 'critical', passIds: ['material-pass', 'lighting-pass', 'optimization-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['cabinet-frame', 'upper-door-shell', 'lower-door-shell', 'rear-service-panel', 'outline-hierarchy'], evidenceRefs: allEvidence },
];

spec.buildPasses = spec.buildPasses.filter((pass) => pass.id !== 'surface-pass');
for (const pass of spec.buildPasses) {
  pass.componentRefs = spec.componentTree.map((entry) => entry.id);
  if (pass.id === 'blockout') pass.acceptance.push('Archived v1 Box3 and ground height remain compatible after silhouette reallocation.');
  if (pass.id === 'structural-pass') pass.acceptance.push('Both doors, cavities, handles, bins, rear service and zero-geometry edge sockets retain stable hierarchy.');
  if (pass.id === 'form-refinement') pass.acceptance.push('Cabinet, doors, crown, plinth and handles use broad 6-12 sided facets instead of smooth slabs.');
  if (pass.id === 'material-pass') pass.acceptance.push('Opaque assemblies use the v2 outline hierarchy while transparent shelves, lights, food and fasteners avoid clumping.');
  if (pass.id === 'lighting-pass') pass.acceptance.push('Warm key, cool fill and pink rim preserve readable cream facets and plum cavities.');
  if (pass.id === 'interaction-pass') pass.acceptance.push('Doors, interiors, seven props, compressor and four cable anchors remain aligned through the full sequence.');
  if (pass.id === 'optimization-pass') pass.acceptance = [
    'Static triangles do not exceed 84366.',
    'Draw calls do not exceed 1.20 times the measured v1 static baseline.',
    'Repeated vents, hinges, fasteners and feet share geometry where stable node identity permits.',
    'Three rebuild and disposal cycles leave no NaN, geometry or material leak.',
  ];
}
spec.selfCorrectLoop.reviewAfterPasses = spec.buildPasses.map((pass) => pass.id);
spec.selfCorrectLoop.screenshotPolicy.requiredForPasses = spec.buildPasses.filter((pass) => pass.id !== 'optimization-pass').map((pass) => pass.id);
spec.sculptPipeline = {
  passGateMode: 'locked-sequential',
  passOrder: spec.buildPasses.map((pass) => pass.id),
  currentPass: 'blockout',
  completedPasses: [],
  lastCompletedPass: '',
  blockedReason: 'blockout requires browser screenshot and comparison review',
  nextRequiredEvidence: [],
};
spec.lightingFromPhoto = [
  'warm upper-left key light intensity 3.2 with broad soft shadow',
  'cool rear-right fill intensity 1.35',
  'Sakura-pink rear rim intensity 1.6',
  'warm-white hemisphere ambient over muted lavender ground',
  'ACES tone mapping intent, exposure 1.0 and pale neutral background',
  'soft contact shadow beneath all four feet',
];
spec.performanceBudget = {
  qualityPriority: 'reference-fidelity real-time browser',
  targetTriangles: 62494,
  maxTriangles: 84366,
  maxDrawCalls: 160,
  textureSize: 1024,
  fpsTarget: 60,
  optimizationPolicy: 'Use 6-12 sided profiles, share repeated geometry and keep every frozen animation node stable.',
};
spec.lodPlan = [
  { tier: 'near', distance: 0, strategy: 'full named exterior, interior, rear service and food geometry' },
  { tier: 'far', distance: 20, strategy: 'inactive interiors and food remain hidden while stable node identities are retained' },
];
spec.proceduralStrategy = [
  'Freeze archived bounds, pivots, semantic sockets, colliders and line anchors before visual edits.',
  'Build faceted cabinet, doors, crown and plinth inside the frozen envelope.',
  'Retain true cavity depth and door-local storage with named hierarchy.',
  'Apply stable object-space outline tiers only to appropriate opaque geometry.',
  'Review static four views and powered startup, climax and wind-down before optimization.',
];
spec.animationAnchors = [
  'upper and lower right-edge door pivots',
  'upper and lower interior visibility roots',
  'seven named food pivots and seven home sockets',
  'compressor vibration pivot, rear service socket and power-entry socket',
  'freezer and main exit sockets plus four party waypoints',
  'four frozen scene-edge connection sockets',
];
spec.destructionAnchors = ['cabinet frame', 'upper door assembly', 'lower door assembly', 'rear service assembly', 'food performance rig'];
spec.risks = [
  'Door visual thickness and handle enlargement must not collide through the archived 2.62 and 2.46 radian arcs.',
  'Outline hull growth must not change the archived cable anchors or full-tree centering.',
  'Cavity and bin restyling must not move any food home support or old-position emission will be visible.',
  'Transparent shelves, light bars, food and tiny fasteners must be excluded from heavy outline tiers.',
];
spec.assumptions = [
  'The IMAGEN sheet is stylized visual evidence rather than dimensional truth.',
  'Existing internal insulation and refrigeration mechanics remain hidden and omitted.',
  'No runtime texture or external model is introduced.',
];
spec.visualEvidence = [];
spec.reviewHistory = [];
spec.tier1Results = [];

assessmentEnvelope.targetName = spec.targetName;
assessmentEnvelope.sourceImage = spec.sourceImage;
assessmentEnvelope.preSpecAssessment = spec.preSpecAssessment;
assessmentEnvelope.qualityContract = spec.qualityContract;
inventoryEnvelope.sourceImage = spec.sourceImage;
inventoryEnvelope.sourceViews = Object.values(views);
inventoryEnvelope.detailInventory = spec.preSpecAssessment.detailInventory;
inventoryEnvelope.note = 'IMAGEN owns visual form evidence; the archived runtime contract owns all dimensions and animation anchors.';

await Promise.all([
  writeFile(specPath, `${JSON.stringify(spec, null, 2)}\n`),
  writeFile(assessmentPath, `${JSON.stringify(assessmentEnvelope, null, 2)}\n`),
  writeFile(inventoryPath, `${JSON.stringify(inventoryEnvelope, null, 2)}\n`),
]);

console.log(specPath);

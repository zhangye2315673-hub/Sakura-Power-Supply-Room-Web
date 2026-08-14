import fs from 'node:fs';

const templatePath = 'docs/sculpt-specs/bubble-machine/object-sculpt-spec.json';
const outPath = 'docs/sculpt-specs/blender/object-sculpt-spec.json';
const assessmentPath = 'artifacts/img2threejs/blender/pre-spec-assessment.json';
const inventoryPath = 'artifacts/img2threejs/blender/detail-inventory.json';
const spec = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
const componentTemplate = structuredClone(spec.componentTree[0]);
const materialTemplate = structuredClone(spec.materials[0]);

spec.targetName = 'SAKURA Countertop Blender';
spec.targetId = 'blender';
spec.sourceImage = 'references/intake/blender/front.png';
spec.suitability = 'pass';
spec.scores = { object_isolation: 3, silhouette_readability: 3, depth_inference: 3, primitive_decomposition: 3, material_procedurality: 3, occlusion_risk: 2, interaction_fit: 3 };
spec.referenceCamera = { solved: false, fovDegrees: 32, aspect: 557 / 941, orientation: { yaw: 0, pitch: 0, roll: 0 }, positionHint: [0, 0, 8], note: 'Three orthographic-like exterior views constrain proportions. Hidden blade coupling, motor and lid lock remain inferred.' };
spec.preSpecAssessment.objectClass = {
  primaryType: 'countertop jar blender', primaryDomain: 'object',
  formLanguage: ['rounded hard-surface', 'continuous vessel profiles', 'transparent-like shell', 'mechanical'],
  structureKind: ['compound object', 'layered enclosure', 'removable vessel and lid', 'rotating blade assembly', 'repeated relief'],
  motionPotential: ['speed dial rotation', 'blade spin', 'liquid vortex', 'removable lid and jar'],
  materialFamilies: ['satin molded plastic', 'transparent plastic or glass', 'painted plastic', 'metal', 'rubber', 'liquid-like effect'],
  notes: 'Front, side and back establish the exterior. The motor, wiring, coupling and locking structures are hidden and explicitly inferred or omitted.'
};
spec.preSpecAssessment.complexity = {
  tier: 'complex',
  scores: { silhouetteComplexity: 3, componentCount: 3, hierarchyDepth: 3, repetitionDensity: 2, materialLayerCount: 3, localDetailDensity: 2, occlusionRisk: 2, actionReadinessNeed: 3 },
  estimatedCounts: { macroComponents: 4, mesoComponents: 16, microFeatureGroups: 12, materialLayers: 10, repetitionSystems: 6 },
  reasoning: ['The tapered transparent jar, curved loop handle, four-blade assembly, two-band enclosure, repeated ribs and vents, controls and powered vortex require a complex action-ready hierarchy.']
};
spec.preSpecAssessment.specDepthDecision = { requiredDepth: 'complex', minimumComponentLevels: ['macro', 'meso', 'micro'], needsRepetitionSystems: true, needsMaterialLocalOverrides: true, needsMultipleReviewViews: true, needsActionReadyHierarchy: true, rationale: 'Visible identity depends on nested jar, lid, blade, handle, control and rear-service systems.' };
spec.preSpecAssessment.unknownsToResolveBeforeImplementation = [];
spec.preSpecAssessment.sourceImage = spec.sourceImage;

const detailRows = [
  ['lid-knob', 'bevel', 'Low mint cylindrical lid knob with softened upper rim.', 'micro', 'front-view', 0.96],
  ['lid-shell', 'contour', 'Broad shallow Sakura-pink lid dome with a soft crown.', 'meso', 'front-view', 0.98],
  ['lid-flange', 'seam', 'Thin projecting lid flange overlaps the jar rim.', 'micro', 'side-view', 0.97],
  ['jar-upper-collar', 'seam', 'Translucent pink collar continues below the lid.', 'meso', 'front-view', 0.96],
  ['jar-shell', 'contour', 'Transparent jar widens upward and narrows toward the blade floor.', 'macro', 'front-view', 0.99],
  ['jar-rib-array', 'ridge', 'Eight tall molded relief ribs follow the jar taper.', 'meso', 'front-view', 0.92],
  ['jar-handle', 'contour', 'Thick cream closed handle forms a tall rounded rectangular opening.', 'macro', 'side-view', 0.98],
  ['blade-array', 'ridge', 'Four dark metal blades cant upward around a central hub.', 'meso', 'front-view', 0.95],
  ['jar-seat', 'seam', 'Shallow pink jar seat separates vessel from motor base.', 'meso', 'front-view', 0.97],
  ['upper-base-shell', 'bevel', 'Warm cream upper motor enclosure tapers inward toward the jar.', 'macro', 'front-view', 0.99],
  ['lower-base-shell', 'bevel', 'Sakura-pink lower enclosure has a wide rounded footprint.', 'macro', 'front-view', 0.99],
  ['base-seam-band', 'seam', 'Straight horizontal cream-to-pink enclosure seam.', 'meso', 'side-view', 0.98],
  ['speed-dial', 'bevel', 'Large layered mint circular speed dial projects from the front.', 'meso', 'front-view', 0.99],
  ['dial-marker', 'linework', 'Narrow vertical marker is recessed into the dial face.', 'micro', 'front-view', 0.98],
  ['status-indicator', 'emissive', 'Small circular status lens sits above the speed dial.', 'micro', 'front-view', 0.98],
  ['rear-vent-array', 'hole', 'Five horizontal rounded vent slots occupy the rear cream panel.', 'micro', 'back-view', 0.99],
  ['rear-power-inlet', 'hole', 'Dark two-pin inlet is centered low on the rear pink panel.', 'micro', 'back-view', 0.99],
  ['foot-array', 'fastener', 'Four shallow dark rubber feet support the base.', 'micro', 'side-view', 0.9],
  ['transparent-jar-edge-response', 'gloss', 'Jar edges and ribs carry brighter low-roughness highlights than the center.', 'micro', 'front-view', 0.9],
  ['liquid-vortex-pivot', 'contour', 'Powered-only smoothie vortex and ingredient spiral communicate blending.', 'meso', 'front-view', 0.62],
];
spec.preSpecAssessment.detailInventory = {
  scanMethod: 'grid-3x3 plus three-view component zones', targetMinDetails: 18,
  note: 'All visible details map to named component features or material overrides. The powered liquid cue is explicitly inferred.',
  details: detailRows.map(([ref, kind, description, scale, evidenceRef, confidence], index) => ({
    id: `blender-detail-${index + 1}`, kind, description,
    region: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, scale,
    affects: 'silhouette/material/interaction',
    mapsTo: { type: ref === 'transparent-jar-edge-response' ? 'material.localOverrides' : 'component.localFeatures', ref },
    evidenceRef, confidence,
  }))
};
spec.qualityContract.definitionOfDone = ['The browser model matches the three-view jar-to-base proportions, tapered silhouettes, loop handle negative space, four-blade assembly, pastel material zoning and rear service details, and unmistakably blends ingredients during the 5.2 second powered cue.'];
spec.qualityContract.minimumSpecDepth = { macroComponents: 4, mesoComponents: 12, microFeatureGroups: 9, materialLayers: 8, repetitionSystems: 4, reviewViewpoints: 4 };
spec.qualityTargets.mustMatch = ['tall upward-widening transparent jar', 'broad pink domed lid and mint knob', 'cream loop handle with large negative space', 'cream upper and pink lower tapered base', 'large mint dial with marker and status dot', 'four metal blades, jar ribs, rear vents and inlet', 'reference-derived material separation and clear powered vortex'];
spec.assumptions = ['Blade bearing, motor, wiring and coupling depth are hidden and omitted or simplified.', 'Jar wall thickness, handle-root reinforcement and lid seal are inferred from silhouettes.', 'The smoothie liquid, chunks and vortex appear only as a powered-use cue and are not reference geometry.', 'Underside fasteners and cable geometry are not shown; the power inlet is the connection socket.'];
spec.coordinateFrame = { front: '+Z faces the speed dial', up: '+Y with floor at y=0', scaleReference: 'base width = 2.65 world units; total height = 4.95 world units' };
spec.silhouette = {
  boundingShape: 'wide rounded tapered motor base below a tall upward-flaring jar, domed lid and right-side loop handle',
  aspectRatios: ['total width including handle:height:depth = 3.70:4.95:2.25', 'jar body width top:bottom:height = 2.58:1.90:2.56', 'base width:height = 2.65:1.66'],
  symmetry: 'base and jar are frontally bilateral; the right-side handle breaks symmetry',
  dominantCurves: ['jar taper', 'domed lid crown', 'large handle loop', 'rounded lower base corners'],
  negativeSpaces: ['large handle opening', 'thin lid-to-collar seam', 'small gaps below feet'],
  landmarks: ['mint lid knob', 'four blade tips', 'mint front dial', 'small status dot', 'five rear vents']
};
spec.viewEvidence = [
  { id: 'front-view', view: 'front', imagePath: 'references/intake/blender/front.png', imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['jar and base ratios', 'lid profile', 'front dial, status dot, blades and feet'], confidence: 0.99 },
  { id: 'side-view', view: 'side', imagePath: 'references/intake/blender/side.png', imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['base depth', 'handle loop depth and roots', 'dial projection and lid flange'], confidence: 0.97 },
  { id: 'back-view', view: 'back', imagePath: 'references/intake/blender/back.png', imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['rear handle alignment', 'five vents, power inlet and rear feet'], confidence: 0.99 }
];

const componentRows = [
  ['root', 'Blender Root', 'macro', null, 'assembled-solid', 'group', 'cream-shell'],
  ['lower-base-shell', 'Pink Lower Motor Base', 'macro', 'root', 'continuous-sculpt', 'deformed-rounded-box', 'pink-shell'],
  ['upper-base-shell', 'Cream Upper Motor Base', 'macro', 'root', 'continuous-sculpt', 'deformed-rounded-box', 'cream-shell'],
  ['base-seam-band', 'Horizontal Base Seam', 'meso', 'upper-base-shell', 'surface-relief', 'rounded-band', 'pink-accent'],
  ['jar-seat', 'Pink Jar Seat', 'meso', 'upper-base-shell', 'assembled-solid', 'cylinder', 'pink-shell'],
  ['jar-shell', 'Transparent Tapered Jar', 'macro', 'jar-seat', 'continuous-sculpt', 'lathe-shell', 'transparent-jar'],
  ['jar-upper-collar', 'Pink Jar Upper Collar', 'meso', 'jar-shell', 'conforming-shell', 'lathe-ring', 'pink-accent'],
  ['jar-rim', 'Jar Rolled Rim', 'meso', 'jar-shell', 'surface-relief', 'torus', 'jar-highlight'],
  ['jar-rib-array', 'Eight Jar Relief Ribs', 'micro', 'jar-shell', 'surface-relief', 'tube-array', 'jar-highlight'],
  ['handle-pivot', 'Jar Handle Attachment Pivot', 'meso', 'jar-shell', 'assembled-solid', 'group', 'cream-shell'],
  ['jar-handle', 'Cream Loop Handle', 'macro', 'handle-pivot', 'fiber-strand', 'curve-sweep', 'cream-shell'],
  ['lid-pivot', 'Removable Lid Pivot', 'meso', 'jar-shell', 'assembled-solid', 'group', 'pink-shell'],
  ['lid-shell', 'Domed Pink Lid', 'meso', 'lid-pivot', 'continuous-sculpt', 'lathe', 'pink-shell'],
  ['lid-flange', 'Lid Overlap Flange', 'micro', 'lid-shell', 'surface-relief', 'lathe-ring', 'pink-accent'],
  ['lid-knob', 'Mint Lid Knob', 'meso', 'lid-pivot', 'assembled-solid', 'rounded-cylinder', 'mint-control'],
  ['blade-pivot', 'Blade Rotation Pivot', 'meso', 'jar-shell', 'assembled-solid', 'group', 'steel'],
  ['blade-hub', 'Stepped Blade Hub', 'meso', 'blade-pivot', 'assembled-solid', 'cylinder', 'steel'],
  ['blade-array', 'Four Canted Blades', 'meso', 'blade-pivot', 'assembled-solid', 'wedge-array', 'steel'],
  ['coupling-ring', 'Inferred Blade Coupling', 'meso', 'jar-seat', 'assembled-solid', 'cylinder', 'cavity-dark'],
  ['dial-pivot', 'Front Dial Pivot', 'meso', 'lower-base-shell', 'assembled-solid', 'group', 'mint-control'],
  ['speed-dial', 'Layered Mint Speed Dial', 'meso', 'dial-pivot', 'assembled-solid', 'cylinder', 'mint-control'],
  ['dial-marker', 'Vertical Dial Marker', 'micro', 'speed-dial', 'surface-relief', 'rounded-box', 'cavity-dark'],
  ['status-indicator', 'Front Status Indicator', 'micro', 'upper-base-shell', 'surface-relief', 'sphere', 'indicator-lens'],
  ['rear-service-panel', 'Rear Service Region', 'meso', 'upper-base-shell', 'conforming-shell', 'rounded-box', 'cream-shell'],
  ['rear-vent-array', 'Five Rear Vent Slots', 'micro', 'rear-service-panel', 'surface-relief', 'rounded-box-array', 'cavity-dark'],
  ['rear-power-inlet', 'Rear Power Inlet', 'micro', 'lower-base-shell', 'assembled-solid', 'rounded-box', 'cavity-dark'],
  ['foot-array', 'Four Rubber Feet', 'micro', 'lower-base-shell', 'assembled-solid', 'rounded-box-array', 'rubber'],
  ['liquid-vortex-pivot', 'Powered Liquid Vortex Pivot', 'meso', 'jar-shell', 'continuous-sculpt', 'lathe-effect', 'smoothie'],
  ['ingredient-chunk-array', 'Powered Ingredient Chunk Array', 'micro', 'liquid-vortex-pivot', 'assembled-solid', 'ellipsoid-array', 'ingredient']
];

function component(row, index) {
  const [id, name, level, parent, topologyClass, primitive, material] = row;
  const c = structuredClone(componentTemplate);
  const primitiveMap = { group: 'box', 'deformed-rounded-box': 'extrude', 'rounded-band': 'torus', cylinder: 'cylinder', 'lathe-shell': 'lathe', 'lathe-ring': 'torus', torus: 'torus', 'tube-array': 'tube', 'curve-sweep': 'curve-sweep', lathe: 'lathe', 'rounded-cylinder': 'cylinder', 'wedge-array': 'extrude', 'rounded-box': 'box', 'rounded-box-array': 'box', 'lathe-effect': 'lathe', 'ellipsoid-array': 'ellipsoid' };
  c.id = id; c.name = name; c.level = level; c.parent = parent; c.primitive = primitiveMap[primitive] ?? primitive;
  c.topologyClass = topologyClass;
  c.topologyRationale = `${name} uses ${topologyClass} because its observed surface and assembly role require ${primitive}, not a generic box.`;
  c.importance = level === 'macro' ? 1 : level === 'meso' ? 0.82 : 0.64;
  c.confidence = ['coupling-ring', 'liquid-vortex-pivot', 'ingredient-chunk-array'].includes(id) ? 0.62 : 0.93;
  c.geometryDescriptor = { topologyIntent: `${primitive} with reference-constrained proportions`, edgeTreatment: { type: 'rounded bevel', bevelRadius: level === 'micro' ? 0.015 : 0.045, segments: 3 }, deformationStack: [], uvStrategy: 'generated procedural coordinates', normalStrategy: 'vertex normals' };
  c.dimensions = { width: index === 0 ? 3.7 : 1, height: index === 0 ? 4.95 : 1, depth: index === 0 ? 2.25 : 1, units: 'world', confidence: c.confidence };
  c.transform = { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] };
  c.material = material; c.materialLayers = [material]; c.fidelityTier = 'form-refinement';
  c.evidenceRefs = id.startsWith('rear-') ? ['back-view'] : id.includes('handle') ? ['front-view', 'side-view', 'back-view'] : ['front-view', 'side-view'];
  c.localFeatures = [`${id}.silhouette`, `${id}.bevel`, `${id}.material-zone`];
  c.details = c.localFeatures.map((featureId) => ({ id: featureId, kind: 'contour', evidenceRefs: c.evidenceRefs }));
  c.attachment = parent ? { parentSocket: parent, localStart: [0, 0, 0], localEnd: [0, 0.04, 0], contactType: id.includes('pivot') ? 'socket' : 'overlap', overlap: 0.04, embedDepth: 0.025, gapTolerance: 0.01, evidenceRefs: c.evidenceRefs } : null;
  c.actionProfile.animationRole = id.includes('pivot') ? 'rotating-pivot' : id.includes('lid') ? 'removable-part' : 'static-part';
  c.actionProfile.pivot = { mode: id.includes('pivot') ? 'custom' : 'center', localPosition: [0, 0, 0], axis: [0, 1, 0], confidence: c.confidence };
  const colorRecipe = { 'cream-shell': ['rgba(247,237,220,1)', 'rgba(255,247,234,1)', 'plastic', 0.98], 'pink-shell': ['rgba(237,170,169,1)', 'rgba(255,222,215,1)', 'plastic', 0.98], 'pink-accent': ['rgba(246,197,192,1)', 'rgba(255,232,224,1)', 'plastic', 0.95], 'transparent-jar': ['rgba(244,242,232,0.24)', 'rgba(255,253,244,0.18)', 'glass', 0.86], 'jar-highlight': ['rgba(255,253,244,0.65)', 'rgba(240,246,239,0.35)', 'glass', 0.84], 'mint-control': ['rgba(191,216,208,1)', 'rgba(225,240,231,1)', 'plastic', 0.96], steel: ['rgba(102,103,106,1)', 'rgba(213,215,211,1)', 'metal', 0.96], 'cavity-dark': ['rgba(78,71,77,1)', 'rgba(108,93,101,1)', 'plastic', 0.9], rubber: ['rgba(73,68,73,1)', 'rgba(104,96,102,1)', 'rubber', 0.92], 'indicator-lens': ['rgba(200,221,215,1)', 'rgba(247,255,248,1)', 'glass', 0.84], smoothie: ['rgba(245,169,185,0.72)', 'rgba(255,228,211,0.6)', 'glass', 0.62], ingredient: ['rgba(243,196,107,1)', 'rgba(255,229,159,1)', 'plastic', 0.62] };
  const [dominantAlbedo, secondaryAlbedo, materialClass, materialClassConfidence] = colorRecipe[material] ?? colorRecipe['cream-shell'];
  c.actionProfile.sockets = id === 'jar-shell' ? [
    { id: 'handle-upper-socket', localPosition: [1.03, 1.02, 0] },
    { id: 'handle-lower-socket', localPosition: [1.03, -0.9, 0] },
    { id: 'lid-seat-socket', localPosition: [0, 1.38, 0] },
    { id: 'blade-bearing-socket', localPosition: [0, -1.22, 0] },
  ] : id === 'lower-base-shell' ? [{ id: 'power-cable-socket', localPosition: [0, 0.22, -1.0] }] : [];
  c.colorMaterialRecipe = { dominantAlbedo, secondaryAlbedo, materialClass, materialClassConfidence };
  return c;
}
spec.componentTree = componentRows.map(component);

const materialRows = [
  ['cream-shell', 'Warm Cream Satin Plastic', '#F7EDDC', 0.46, 0],
  ['pink-shell', 'Sakura Pink Satin Plastic', '#EDAAA9', 0.42, 0],
  ['pink-accent', 'Pale Pink Edge Plastic', '#F6C5C0', 0.38, 0],
  ['transparent-jar', 'Transparent Jar Wall', '#F4F2E8', 0.14, 0],
  ['jar-highlight', 'Jar Molded Highlight', '#FFFDF4', 0.12, 0],
  ['mint-control', 'Pale Mint Control Plastic', '#BFD8D0', 0.34, 0],
  ['steel', 'Dark Blade Steel', '#66676A', 0.24, 0.78],
  ['cavity-dark', 'Dark Recess Material', '#4E474D', 0.76, 0],
  ['rubber', 'Foot Rubber', '#494449', 0.86, 0],
  ['indicator-lens', 'Status Lens', '#C8DDD7', 0.24, 0],
  ['smoothie', 'Powered Pastel Smoothie', '#F5A9B9', 0.22, 0],
  ['ingredient', 'Powered Ingredient Pieces', '#F3C46B', 0.55, 0]
];
spec.materials = materialRows.map(([id, name, color, roughness, metalness]) => {
  const m = structuredClone(materialTemplate);
  m.id = id; m.name = name; m.baseColor = color; m.color = color;
  m.albedo = { dominant: color, secondary: [color, '#FFF7EA'], samplingNotes: 'Observed from the admitted turn sheet or explicitly marked powered-only interaction cue.' };
  m.colorVariation = { palette: [color, '#FFF7EA'], pattern: 'subtle molded response', amplitude: 0.06, heightCorrelation: 0.1 };
  m.textureResolution = 1024;
  m.textureProjection = { mode: 'uv', repeat: [2, 2], anisotropy: 8, texelDensityIntent: 'Stable object-scale detail without visible tiling.' };
  m.surfaceFrequencyBands = [{ id: 'macro', frequency: 2, amplitude: 0.16, role: 'broad form response' }, { id: 'meso', frequency: 14, amplitude: 0.07, role: 'seam and molded relief response' }, { id: 'micro', frequency: 60, amplitude: 0.022, role: 'grazing highlight breakup' }];
  m.roughness = { base: roughness, variation: 0.09, map: `independent-${id}-roughness`, localResponse: 'slightly smoother exposed edge crests and rougher cavities' };
  m.metalness = { base: metalness, variation: metalness > 0 ? 0.08 : 0 };
  m.normal = { pattern: `independent-${id}-micro-normal`, strength: id === 'transparent-jar' ? 0.08 : 0.18, scale: 48, space: 'tangent' };
  m.ambientOcclusion = { cavityStrength: 0.3, contactShadowBias: 0.32, notes: 'Contact and seam response only; never reuse albedo.' };
  m.localOverrides = [{ id: `${id}-edge-response`, region: 'bevel crests, seams and contact zones', response: 'lower roughness at exposed edges; cavity AO at intersections', evidenceRefs: ['front-view', 'side-view'] }];
  if (id === 'transparent-jar') {
    m.type = 'physical-transparent'; m.opacity = 0.23; m.transmission = 0.72; m.ior = 1.47;
    m.localOverrides.push({ id: 'transparent-jar-edge-response', region: 'jar silhouette, rolled rim and raised ribs', response: 'opacity and specular response increase toward edges', evidenceRefs: ['front-view', 'side-view', 'back-view'] });
  }
  m.referencePbr = { usable: true, confidence: 0.82, estimatedFidelity: 0.82, sourceImage: spec.sourceImage, acceptedLimitation: 'Stylized source allows palette and relative roughness evidence, not exact inverse-rendered PBR.', maps: { albedo: { path: spec.sourceImage }, roughness: { path: `procedural-${id}-roughness` }, height: { path: `procedural-${id}-height` }, normal: { path: `procedural-${id}-normal` }, ao: { path: `procedural-${id}-ao` } } };
  return m;
});

spec.repetitionSystems = [
  { id: 'eight-jar-ribs', name: 'Eight molded jar ribs', componentRef: 'jar-rib-array', count: 8, distribution: 'radial around jar wall', geometry: 'taper-following tube curves', material: 'jar-highlight', evidenceRefs: ['front-view', 'side-view', 'back-view'] },
  { id: 'four-blades', name: 'Four canted blender blades', componentRef: 'blade-array', count: 4, distribution: 'radial at 90 degree intervals', geometry: 'thin tapered wedge blades', material: 'steel', evidenceRefs: ['front-view', 'back-view'] },
  { id: 'five-rear-vents', name: 'Five rear vent slots', componentRef: 'rear-vent-array', count: 5, distribution: 'vertical stack of horizontal slots', geometry: 'shallow rounded cavities', material: 'cavity-dark', evidenceRefs: ['back-view'] },
  { id: 'four-feet', name: 'Four rubber feet', componentRef: 'foot-array', count: 4, distribution: 'base corners', geometry: 'shallow rounded pads', material: 'rubber', evidenceRefs: ['front-view', 'side-view', 'back-view'] },
  { id: 'dial-rings', name: 'Layered dial rings', componentRef: 'speed-dial', count: 3, distribution: 'coaxial front-facing layers', geometry: 'cylinders and torus rim', material: 'mint-control', evidenceRefs: ['front-view'] },
  { id: 'powered-ingredient-pool', name: 'Powered ingredient pieces', componentRef: 'ingredient-chunk-array', count: 12, distribution: 'deterministic helical lanes inside jar', geometry: 'low-segment ellipsoids', material: 'ingredient', evidenceRefs: ['front-view'] }
];
spec.featureReviewTargets = [
  { id: 'blender-silhouette', name: 'Base jar lid and handle silhouette', tier: 'critical', passIds: ['blockout', 'form-refinement'], minimumScore: 0.8, mustPass: true, componentRefs: ['lower-base-shell', 'upper-base-shell', 'jar-shell', 'jar-handle', 'lid-shell'], evidenceRefs: ['front-view', 'side-view', 'back-view'] },
  { id: 'jar-system', name: 'Transparent tapered jar, collar, ribs and handle roots', tier: 'critical', passIds: ['structural-pass', 'form-refinement', 'material-pass'], minimumScore: 0.8, mustPass: true, componentRefs: ['jar-shell', 'jar-upper-collar', 'jar-rib-array', 'jar-handle'], evidenceRefs: ['front-view', 'side-view', 'back-view'] },
  { id: 'blade-seat-system', name: 'Jar seat, coupling, hub and four blades', tier: 'critical', passIds: ['structural-pass', 'interaction-pass'], minimumScore: 0.78, mustPass: true, componentRefs: ['jar-seat', 'coupling-ring', 'blade-hub', 'blade-array'], evidenceRefs: ['front-view', 'back-view'] },
  { id: 'control-system', name: 'Front dial, marker and status indicator', tier: 'critical', passIds: ['structural-pass', 'material-pass', 'interaction-pass'], minimumScore: 0.8, mustPass: true, componentRefs: ['speed-dial', 'dial-marker', 'status-indicator'], evidenceRefs: ['front-view', 'side-view'] },
  { id: 'rear-service', name: 'Five vents, inlet and rear feet', tier: 'important', passIds: ['structural-pass', 'form-refinement'], minimumScore: 0.74, mustPass: false, componentRefs: ['rear-vent-array', 'rear-power-inlet', 'foot-array'], evidenceRefs: ['back-view'] },
  { id: 'blending-action', name: 'Dial turn, blade spin, ingredient spiral and smoothie vortex', tier: 'critical', passIds: ['interaction-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['dial-pivot', 'blade-pivot', 'liquid-vortex-pivot', 'ingredient-chunk-array'], evidenceRefs: ['front-view', 'side-view'] }
];
spec.lightingFromPhoto = ['warm upper-left key intensity 3.2 with broad soft shadow', 'cool right-rear fill intensity 1.35', 'pink rear rim intensity 1.6', 'pale blue-gray background with soft floor contact shadow', 'neutral exposure keeps transparent jar edge and cream/pink zoning readable'];
spec.proceduralStrategy = ['Lock total height, base taper, jar flare, lid width and handle negative space first.', 'Use a lathed shell profile for real jar wall thickness and a separate lathed lid.', 'Use a curve-swept handle rooted at named upper/lower jar sockets.', 'Keep blade, dial, lid, jar, handle, vents, inlet and feet as independent named components.', 'Pool ingredient meshes and update transforms allocation-free during the 5.2 second cue.'];
spec.animationAnchors = ['dial-pivot on front face', 'blade-pivot at jar floor bearing', 'liquid-vortex-pivot inside jar', 'lid-pivot above jar rim', 'power-cable-socket on rear inlet'];
spec.destructionAnchors = ['motor base group', 'jar and handle group', 'lid group', 'blade and coupling group', 'rear service group'];
spec.risks = ['Transparent toon surfaces can visually sort against internal blades and liquid.', 'Handle curve must remain embedded at both roots across animation and scale.', 'Powered effects must remain inside the jar and reset deterministically.', 'Illustrated source does not provide exact physical PBR or manufacturing dimensions.'];
spec.buildPasses = [
  { id: 'blockout', goal: 'Lock the total silhouette and macro proportions.', componentRefs: ['lower-base-shell', 'upper-base-shell', 'jar-shell', 'jar-handle', 'lid-shell'], acceptance: ['Front, side and back macro silhouette agrees with the turn sheet.', 'Handle opening and jar flare remain recognizable.', 'Browser comparison score is at least 0.7.'] },
  { id: 'structural-pass', goal: 'Build independent vessel, lid, blade, control, rear-service and foot assemblies.', componentRefs: ['jar-seat', 'jar-shell', 'jar-upper-collar', 'jar-rim', 'jar-rib-array', 'handle-pivot', 'jar-handle', 'lid-pivot', 'lid-shell', 'lid-knob', 'blade-pivot', 'blade-hub', 'blade-array', 'dial-pivot', 'speed-dial', 'status-indicator', 'rear-vent-array', 'rear-power-inlet', 'foot-array'], acceptance: ['Named pivots and sockets exist for blade, dial, lid, handle and power.', 'Four blades, eight ribs, five vents and four feet remain independent readable systems.', 'No visible floating attachments.'] },
  { id: 'form-refinement', goal: 'Refine jar wall thickness, handle roots, lid crown, base taper, seams, ribs and rear recesses.', componentRefs: ['lower-base-shell', 'upper-base-shell', 'jar-shell', 'jar-upper-collar', 'jar-rim', 'jar-handle', 'lid-shell', 'lid-flange', 'speed-dial', 'rear-service-panel'], acceptance: ['Curves, bevels and negative spaces remain legible across four browser views.', 'Three-quarter render proves non-planar depth.'] },
  { id: 'material-pass', goal: 'Separate cream, pink, mint, transparent jar, steel, cavity and rubber responses.', componentRefs: ['lower-base-shell', 'upper-base-shell', 'jar-shell', 'jar-rib-array', 'jar-handle', 'lid-shell', 'speed-dial', 'blade-array', 'foot-array'], acceptance: ['Transparent jar reveals blades without reading as an opaque white cup.', 'Cream, pink, mint, steel and dark recess materials remain distinct.', 'Stylized source PBR limitation is documented.'] },
  { id: 'lighting-pass', goal: 'Verify bevels, transparent edges, blade depth and contact shadows.', componentRefs: ['root'], acceptance: ['Key, fill and rim reveal jar edges and pastel zoning without highlight blowout.', 'Neutral, grazing and reference-matched checks remain readable.'] },
  { id: 'interaction-pass', goal: 'Show an unmistakable blender cycle and exact reset.', componentRefs: ['dial-pivot', 'blade-pivot', 'liquid-vortex-pivot', 'ingredient-chunk-array', 'status-indicator'], acceptance: ['Dial turns, indicator lights, four blades spin and ingredients visibly spiral into a smoothie vortex.', 'Powered cue completes within 5.2 seconds.', 'stop restores all transforms, visibility, opacity and emissive state exactly.'] },
  { id: 'optimization-pass', goal: 'Preserve browser real-time performance after fidelity acceptance.', componentRefs: ['root', 'jar-rib-array', 'blade-array', 'rear-vent-array', 'ingredient-chunk-array'], acceptance: ['Shared repeated geometries and pooled effects are used.', 'Draw calls <= 95 and triangles <= 65000.', 'No per-frame geometry or material allocation.'] }
];
spec.visualEvidence = []; spec.reviewHistory = []; spec.tier1Results = [];
spec.sculptPipeline.currentPass = 'blockout'; spec.sculptPipeline.completedPasses = []; spec.sculptPipeline.lastCompletedPass = ''; spec.sculptPipeline.blockedReason = 'blockout requires browser screenshot and comparison review';
spec.performanceBudget = { qualityPriority: 'reference-fidelity real-time browser', targetTriangles: 65000, maxDrawCalls: 95, textureSize: 1024, fpsTarget: 60, optimizationPolicy: 'Share repeated geometries, pool all powered effects and avoid update-time allocations.' };
spec.lodPlan = [{ tier: 'near', distance: 0, strategy: 'full named assemblies' }, { tier: 'far', distance: 18, strategy: 'hide powered ingredient chunks when inactive and reuse repeated geometry' }];
spec.localSpecSearch = JSON.parse(fs.readFileSync(assessmentPath, 'utf8')).localSpecSearch;

fs.writeFileSync(outPath, `${JSON.stringify(spec, null, 2)}\n`);
fs.writeFileSync(assessmentPath, `${JSON.stringify({ targetName: spec.targetName, sourceImage: spec.sourceImage, preSpecAssessment: spec.preSpecAssessment, qualityContract: spec.qualityContract, localSpecSearch: spec.localSpecSearch }, null, 2)}\n`);
fs.writeFileSync(inventoryPath, `${JSON.stringify({ sourceImage: spec.sourceImage, sourceViews: spec.viewEvidence.map((view) => view.imagePath), zonesDir: 'artifacts/img2threejs/blender/detail-grid', detailInventory: spec.preSpecAssessment.detailInventory, inferredDetailIds: ['blender-detail-20'], note: 'Powered liquid and ingredient motion are inferred interaction cues; all other rows are supported by the supplied views.' }, null, 2)}\n`);
console.log(`wrote ${outPath}`);

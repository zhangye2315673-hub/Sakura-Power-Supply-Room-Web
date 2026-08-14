import fs from 'node:fs';

const path = 'docs/sculpt-specs/dehumidifier/object-sculpt-spec.json';
const spec = JSON.parse(fs.readFileSync(path, 'utf8'));
const source = 'references/intake/dehumidifier/front.png';

spec.targetName = 'SAKURA Compact Compressor Dehumidifier';
spec.targetId = 'dehumidifier';
spec.sourceImage = source;
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
  solved: false,
  fovDegrees: 34,
  aspect: 557 / 941,
  orientation: { yaw: 0, pitch: 0, roll: 0 },
  positionHint: [0, 0, 4],
  note: 'Three orthographic-like panels constrain the exterior. Compressor, coils, ducting, tank float and electronics remain hidden.',
};

spec.preSpecAssessment.objectClass = {
  primaryType: 'compact floor-standing compressor dehumidifier',
  primaryDomain: 'object',
  formLanguage: ['hard-surface', 'rounded-retro', 'layered-shell', 'soft-industrial'],
  structureKind: ['compound enclosure', 'removable tank', 'repeated air grilles', 'rotating fan'],
  motionPotential: ['fan rotation', 'control press', 'water-level rise', 'tank slide', 'material-state'],
  materialFamilies: ['warm ABS', 'Sakura pink ABS', 'mint grille plastic', 'transparent level lens', 'dark vent cavity'],
  notes: 'Front, side and back constrain all exterior identity systems. Internal refrigeration and water-handling hardware are occluded.',
};
spec.preSpecAssessment.complexity = {
  tier: 'complex',
  scores: { silhouetteComplexity: 2, componentCount: 3, hierarchyDepth: 3, repetitionDensity: 3, materialLayerCount: 3, localDetailDensity: 3, occlusionRisk: 2, actionReadinessNeed: 3 },
  estimatedCounts: { macroComponents: 5, mesoComponents: 15, microFeatureGroups: 13, materialLayers: 9, repetitionSystems: 5 },
  reasoning: ['The enclosure silhouette is restrained, but the removable tank, two distinct grille systems, visible fan, rear service hardware, layered controls and condensation animation require a complex action-ready hierarchy.'],
};
spec.preSpecAssessment.specDepthDecision = {
  requiredDepth: 'complex',
  minimumComponentLevels: ['macro', 'meso', 'micro'],
  needsRepetitionSystems: true,
  needsMaterialLocalOverrides: true,
  needsMultipleReviewViews: true,
  needsActionReadyHierarchy: true,
  rationale: 'Compound appliance with repeated vents, transparent water indication and multiple runtime pivots/sockets.',
};
spec.preSpecAssessment.unknownsToResolveBeforeImplementation = [];

const details = [
  ['upper-shell', 'contour', 'Continuous lofted cream shell narrows into broad rounded crown shoulders without a box-stack break.', 'macro', 'front-view', 0.98],
  ['water-tank', 'seam', 'Sakura-pink removable lower tank occupies roughly forty-two percent of total height.', 'macro', 'front-view', 0.98],
  ['tank-seam', 'seam', 'Thin continuous horizontal seam separates the tank from the upper enclosure.', 'meso', 'side-view', 0.97],
  ['water-level-window', 'hole', 'Narrow vertically rounded front water-level window is deeply inset in the tank.', 'meso', 'front-view', 0.99],
  ['collected-water', 'gloss', 'Blue-green transparent water column remains visible behind the level lens.', 'micro', 'front-view', 0.82],
  ['top-exhaust', 'contour', 'Wide mint rounded-rectangle outlet is embedded through a true opening in the lofted crown.', 'macro', 'front-view', 0.99],
  ['top-grille-array', 'ridge', 'Thirteen horizontal outlet slats with five longitudinal dividers remain readable in the front view.', 'meso', 'front-view', 0.95],
  ['exhaust-fan', 'ridge', 'Six-blade fan is visible beneath the top outlet for powered motion readability.', 'meso', 'front-view', 0.68],
  ['control-button', 'bevel', 'Large layered Sakura-pink circular control sits on the upper front shell.', 'meso', 'front-view', 0.99],
  ['status-indicator', 'gloss', 'Narrow dark vertical status lens sits directly below the control.', 'micro', 'front-view', 0.99],
  ['rear-carry-handle', 'hole', 'Wide shallow rounded carry-handle recess sits near the rear crown.', 'meso', 'back-view', 0.99],
  ['rear-air-intake', 'bevel', 'Large framed rounded rear air intake occupies the center of the upper shell.', 'macro', 'back-view', 0.99],
  ['rear-intake-slot-array', 'hole', 'Twenty-six narrow intake slots form two aligned rear columns.', 'micro', 'back-view', 0.98],
  ['rear-drain-port', 'hole', 'Centered lower rear circular continuous-drain port interrupts the pink tank.', 'micro', 'back-view', 0.99],
  ['foot-array', 'fastener', 'Four shallow feet support the lower tank corners.', 'micro', 'front-view', 0.88],
  ['shell-highlight', 'gloss', 'Broad pale highlights follow the cream shell shoulders and rounded corners.', 'micro', 'front-view', 0.92],
  ['pink-shell-edge-response', 'gloss', 'Tank edge highlights preserve the glossy molded Sakura plastic response.', 'micro', 'side-view', 0.91],
  ['inferred-power-inlet', 'hole', 'Lower rear power connection is required by gameplay but not visible in the supplied views.', 'micro', 'back-view', 0.35],
];
spec.preSpecAssessment.detailInventory = {
  scanMethod: 'three-view component zones plus grid-3x3 crop inventory',
  targetMinDetails: 16,
  note: 'Observed details map to named component features; the hidden power inlet is explicitly low-confidence inference.',
  details: details.map(([ref, kind, description, scale, evidenceRef, confidence], index) => ({
    id: `dehumidifier-detail-${index + 1}`,
    kind,
    description,
    region: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' },
    scale,
    affects: 'silhouette/material/interaction',
    mapsTo: { type: kind === 'gloss' ? 'material.localOverrides' : 'component.localFeatures', ref: kind === 'gloss' && ref === 'collected-water' ? 'water-lens-response' : ref },
    evidenceRef,
    confidence,
  })),
};
spec.preSpecAssessment.sourceImage = source;

spec.qualityContract.qualityBar = 'complex';
spec.qualityContract.definitionOfDone = [
  'The model matches the tall cream-over-pink three-view silhouette, preserves tank and airflow structure, and unmistakably dehumidifies through visible fan motion, converging moisture droplets and a rising water-level column during the 5.2 second powered cue.',
];
spec.qualityContract.minimumSpecDepth = { macroComponents: 5, mesoComponents: 9, microFeatureGroups: 11, materialLayers: 9, repetitionSystems: 5, reviewViewpoints: 5 };
spec.qualityContract.featureGroups = [
  {
    id: 'dehumidifier-proportion', name: 'Tall enclosure and tank proportion', required: true,
    qualityCriteria: ['Overall width:height:depth remains close to 2.10:2.83:1.38; upper and tank shells use matched loft rings rather than stacked boxes.'],
    evidenceRefs: ['front-view', 'side-view'], failureModes: ['squat enclosure', 'tank too short', 'side depth too thick'],
  },
  {
    id: 'airflow-system', name: 'Top outlet and rear intake', required: true,
    qualityCriteria: ['The true-hole top outlet shows thirteen horizontal slats and five dividers in front/three-quarter views; rear two-column intake remains layered.'],
    evidenceRefs: ['front-view', 'back-view'], failureModes: ['flat decal vents', 'missing mint outlet', 'wrong slot density'],
  },
  {
    id: 'tank-system', name: 'Removable water tank and level lens', required: true,
    qualityCriteria: ['Tank, seam, inset level window and moving water remain independent named parts.'],
    evidenceRefs: ['front-view', 'side-view'], failureModes: ['fused tank', 'painted-on water window'],
  },
  {
    id: 'rear-service', name: 'Rear handle intake and drain', required: true,
    qualityCriteria: ['Carry recess, intake frame/slots and centered drain port match the rear panel hierarchy.'],
    evidenceRefs: ['back-view'], failureModes: ['missing drain', 'flat handle', 'unframed intake'],
  },
  {
    id: 'powered-purpose', name: 'Dehumidification action', required: true,
    qualityCriteria: ['Button depresses, fan rotates, moisture converges and water level rises before exact reset.'],
    evidenceRefs: ['front-view'], failureModes: ['generic wobble', 'fan without water cue', 'reset drift'],
  },
  ...(spec.qualityContract.featureGroups ?? []).filter((group) => ['attachment-integrity', 'surface-material-response', 'reference-lookdev'].includes(group.id)),
];
spec.qualityTargets.fidelity = 'high real-time procedural match';
spec.qualityTargets.minimumReadDistance = 'catalog orbit and play-space pickup';
spec.qualityTargets.identityCritical = ['cream-over-pink split', 'mint top outlet', 'vertical level window', 'rear intake and drain'];
spec.qualityTargets.reviewViewpoints = ['front', 'side', 'back', 'three-quarter', 'powered'];
spec.qualityTargets.mustMatch = [
  'tall rounded cream enclosure over Sakura-pink removable tank',
  'mint slatted top outlet with visible powered fan',
  'front circular control, narrow status lens and inset level window',
  'rear carry recess, two-column intake and centered drain port',
  'air moisture capture and rising collected water',
];
spec.assumptions = [
  'Compressor, refrigerant loop, coils, filter media, float and electronics are hidden and omitted.',
  'Top fan profile and depth are inferred from the outlet; the fan exists to expose purpose-readable motion.',
  'Water level is represented only through the observed narrow lens because the tank shell is opaque.',
  'Power inlet position is inferred for the existing plug gameplay; the visible rear circular port is treated as a drain.',
  'Underside fasteners and filter retention hardware are not visible.',
];
spec.coordinateFrame = { front: '+Z faces the control and water-level window', up: '+Y with floor at y=0', scaleReference: 'overall width 2.10, height 2.83 and depth 1.38 world units' };
spec.silhouette = {
  boundingShape: 'tall softly rounded rectangular enclosure with slightly wider lower tank and a low mint outlet crown',
  aspectRatios: ['width:height:depth = 2.10:2.83:1.38', 'tank height = 1.18', 'top outlet width = 1.94'],
  symmetry: 'main shell is bilateral; inferred lower rear power inlet breaks symmetry',
  dominantCurves: ['broad upper shoulder radii', 'rounded tank corners', 'pill-shaped exhaust and handle recess', 'vertical level-window capsule'],
  negativeSpaces: ['top grille gaps', 'rear intake slot grid', 'carry-handle well', 'drain-port core'],
  landmarks: ['mint outlet', 'front pink control', 'pink tank split', 'vertical level lens', 'rear intake'],
};
spec.viewEvidence = [
  { id: 'front-view', view: 'front', imagePath: 'references/intake/dehumidifier/front.png', imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['overall ratio', 'cream/pink split', 'top outlet', 'control and level window'], confidence: 0.99 },
  { id: 'side-view', view: 'side', imagePath: 'references/intake/dehumidifier/side.png', imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['depth ratio', 'sloped top deck', 'tank side seam and feet'], confidence: 0.97 },
  { id: 'back-view', view: 'back', imagePath: 'references/intake/dehumidifier/back.png', imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['carry recess', 'framed intake slot grid', 'tank split and drain port'], confidence: 0.99 },
];

const componentDefs = [
  ['root', null, 'macro', 'assembly', 'cream-shell'],
  ['upper-shell', 'root', 'macro', 'enclosure', 'cream-shell'],
  ['shell-highlight', 'upper-shell', 'micro', 'surface relief', 'cream-highlight'],
  ['tank-slide-pivot', 'root', 'macro', 'translation pivot', 'pink-shell'],
  ['water-tank', 'tank-slide-pivot', 'macro', 'removable reservoir', 'pink-shell'],
  ['tank-seam', 'water-tank', 'micro', 'panel seam', 'pink-shadow'],
  ['water-level-window', 'water-tank', 'meso', 'level lens', 'cavity-dark'],
  ['collected-water', 'water-level-window', 'micro', 'animated liquid', 'water-lens'],
  ['top-exhaust', 'upper-shell', 'macro', 'air outlet', 'mint-plastic'],
  ['top-grille-array', 'top-exhaust', 'meso', 'repeated outlet slats', 'mint-dark'],
  ['exhaust-fan-pivot', 'top-exhaust', 'meso', 'rotation pivot', 'mint-dark'],
  ['exhaust-fan', 'exhaust-fan-pivot', 'meso', 'six-blade rotor', 'mint-dark'],
  ['control-button-pivot', 'upper-shell', 'meso', 'press pivot', 'pink-accent'],
  ['control-button', 'control-button-pivot', 'meso', 'layered control', 'pink-accent'],
  ['status-indicator', 'upper-shell', 'micro', 'indicator lens', 'indicator-lens'],
  ['rear-carry-handle', 'upper-shell', 'meso', 'recessed handle', 'cavity-dark'],
  ['rear-air-intake', 'upper-shell', 'macro', 'framed air intake', 'cream-highlight'],
  ['rear-intake-slot-array', 'rear-air-intake', 'micro', 'repeated intake slots', 'cream-shell'],
  ['rear-drain-port-pivot', 'water-tank', 'meso', 'drain socket pivot', 'pink-shadow'],
  ['rear-drain-port', 'rear-drain-port-pivot', 'micro', 'drain outlet', 'cavity-dark'],
  ['inferred-power-inlet', 'water-tank', 'micro', 'connection inlet', 'pink-shadow'],
  ['foot-array', 'water-tank', 'micro', 'support feet', 'pink-shadow'],
  ['airborne-moisture', 'root', 'meso', 'animated purpose cue', 'moisture-lens'],
  ['dry-air-output-socket', 'top-exhaust', 'micro', 'attachment socket', 'mint-plastic'],
  ['drain-hose-socket', 'rear-drain-port', 'micro', 'attachment socket', 'cavity-dark'],
  ['power-cable-socket', 'inferred-power-inlet', 'micro', 'attachment socket', 'cavity-dark'],
];
const baseComponent = spec.componentTree[0];
const componentColors = {
  'cream-shell': '#F5EADB', 'cream-highlight': '#FFF6E8', 'pink-shell': '#EDB0B7',
  'pink-accent': '#F7C6C9', 'pink-shadow': '#C78694', 'mint-plastic': '#A9C8BC',
  'mint-dark': '#6E8F86', 'cavity-dark': '#554E50', 'water-lens': '#86C7CF',
  'indicator-lens': '#B9DED6', 'moisture-lens': '#B8E3DF',
};
function rgba(hex) {
  const value = Number.parseInt(hex.slice(1), 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, 1)`;
}
spec.componentTree = componentDefs.map(([id, parent, level, role, material], index) => {
  const component = structuredClone(baseComponent);
  component.id = id;
  component.name = id.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join(' ');
  component.parent = parent;
  component.level = level;
  component.role = role;
  component.importance = index < 2 ? 1 : 0.82;
  component.confidence = id.startsWith('inferred') || id === 'power-cable-socket' ? 0.35 : 0.9;
  component.primitive = role.includes('rotor') ? 'extrude' : role.includes('slots') || role.includes('slats') || role.includes('cue') || id === 'foot-array' ? 'instanced-cluster' : role.includes('outlet') || role.includes('control') ? 'cylinder' : 'box';
  component.topologyClass = role.includes('relief') ? 'surface-relief' : 'assembled-solid';
  component.topologyRationale = `${role} is authored as ${component.primitive} because its visible silhouette and runtime ownership are independent.`;
  if (id === 'upper-shell' || id === 'water-tank') {
    component.primitive = 'curve-sweep';
    component.topologyClass = 'continuous-sculpt';
    component.topologyRationale = 'Observed side and front contours vary continuously through several rounded-rectangle rings; stacked boxes are explicitly disallowed.';
  }
  if (id === 'top-exhaust') {
    component.primitive = 'extrude';
    component.topologyClass = 'conforming-shell';
    component.topologyRationale = 'Thin mint frame conforms to and cuts through the sloped crown while preserving a true central opening.';
  }
  component.geometryDescriptor.topologyIntent = `Named ${role} with independent geometry and deterministic transforms.`;
  component.geometryDescriptor.edgeTreatment = { type: 'rounded bevel', bevelRadius: level === 'macro' ? 0.12 : 0.025, segments: level === 'macro' ? 4 : 2 };
  component.dimensions = id === 'root' ? { width: 2.1, height: 2.83, depth: 1.38, units: 'world', confidence: 0.97 } : { width: 0.5, height: 0.5, depth: 0.2, units: 'relative', confidence: component.confidence };
  component.material = material;
  component.materialLayers = [material];
  component.colorMaterialRecipe = {
    dominantAlbedo: rgba(componentColors[material] ?? '#F5EADB'),
    secondaryAlbedo: rgba(componentColors[material] ?? '#F5EADB'),
    materialClass: material.includes('water') || material.includes('moisture') || material.includes('indicator') ? 'glass' : 'plastic',
    materialClassConfidence: component.confidence,
  };
  component.localFeatures = [`${id}.silhouette`, `${id}.edge-treatment`, `${id}.material-zone`];
  component.details = component.localFeatures.map((detailId) => ({ id: detailId, kind: 'contour', evidenceRefs: ['front-view', 'side-view', 'back-view'] }));
  component.evidenceRefs = ['front-view', 'side-view', 'back-view'];
  component.fidelityTier = 'form-refinement';
  if (parent) {
    component.attachment = { parentSocket: parent, localStart: [0, 0, 0], localEnd: [0, 0.04, 0], contactType: 'overlap', overlap: 0.04, gapTolerance: 0.01 };
  } else {
    component.attachment = null;
  }
  component.actionProfile.pivot.mode = role.includes('pivot') ? 'explicit-local' : 'center';
  component.actionProfile.pivot.axis = id.includes('fan') ? [0, 1, 0] : id.includes('tank') ? [0, 0, 1] : [0, 1, 0];
  component.actionProfile.sockets = id === 'top-exhaust'
    ? [{ id: 'dry-air-output-socket', localPosition: [0, 0.12, 0] }]
    : id === 'rear-drain-port'
      ? [{ id: 'drain-hose-socket', localPosition: [0, 0, -0.12] }]
      : id === 'inferred-power-inlet'
        ? [{ id: 'power-cable-socket', localPosition: [0, 0, -0.1] }]
        : [];
  component.actionProfile.destruction.fractureGroup = parent ?? 'root';
  return component;
});

const materialDefs = [
  ['cream-shell', 'Warm Cream ABS', '#F5EADB', 0.42, 0],
  ['cream-highlight', 'Cream Edge Highlight', '#FFF6E8', 0.34, 0],
  ['pink-shell', 'Sakura Pink Tank ABS', '#EDB0B7', 0.4, 0],
  ['pink-accent', 'Light Sakura Control', '#F7C6C9', 0.36, 0],
  ['pink-shadow', 'Dark Sakura Seam Plastic', '#C78694', 0.5, 0],
  ['mint-plastic', 'Mint Exhaust Plastic', '#A9C8BC', 0.5, 0],
  ['mint-dark', 'Dark Mint Grille Plastic', '#6E8F86', 0.58, 0],
  ['cavity-dark', 'Dark Vent Cavity', '#554E50', 0.72, 0],
  ['water-lens', 'Transparent Water Lens', '#86C7CF', 0.24, 0],
  ['indicator-lens', 'Powered Indicator Lens', '#B9DED6', 0.26, 0],
  ['moisture-lens', 'Airborne Moisture Lens', '#B8E3DF', 0.2, 0],
];
const baseMaterial = spec.materials[0];
spec.materials = materialDefs.map(([id, name, color, roughness, metalness]) => {
  const material = structuredClone(baseMaterial);
  material.id = id;
  material.name = name;
  material.baseColor = color;
  material.color = color;
  material.albedo = { dominant: color, secondary: [color], samplingNotes: 'Observed from admitted three-view color zone or explicitly marked conceptual water cue.' };
  material.colorVariation = { palette: [color], pattern: 'subtle molded response', amplitude: 0.04, heightCorrelation: 0.1 };
  material.roughness = { base: roughness, variation: 0.08, map: `independent-${id}-roughness`, localResponse: 'slightly lower roughness at exposed rounded edges' };
  material.metalness = { base: metalness, variation: 0 };
  material.surfaceFrequencyBands = [
    { id: 'macro', frequency: 2, amplitude: 0.14, role: 'broad molded color response' },
    { id: 'meso', frequency: 16, amplitude: 0.05, role: 'panel and seam response' },
    { id: 'micro', frequency: 60, amplitude: 0.018, role: 'subtle highlight breakup' },
  ];
  material.localOverrides = [{ id: id === 'water-lens' ? 'water-lens-response' : `${id}-edge-response`, region: 'beveled edges, cavity contacts and local lens zones', response: 'reference-observed local roughness and transparency response', evidenceRefs: ['front-view', 'side-view', 'back-view'] }];
  material.referencePbr = { usable: true, confidence: id.includes('water') || id.includes('moisture') ? 0.72 : 0.86, estimatedFidelity: id.includes('water') || id.includes('moisture') ? 0.72 : 0.86, sourceImage: source, maps: { albedo: { path: source }, roughness: { path: `procedural-${id}-roughness` }, height: { path: `procedural-${id}-height` }, normal: { path: `procedural-${id}-normal` }, ao: { path: `procedural-${id}-ao` } } };
  return material;
});

spec.repetitionSystems = [
  { id: 'top-outlet-slats', name: 'Top outlet slats and dividers', componentRef: 'top-grille-array', count: 18, distribution: 'thirteen dense horizontal slats plus five longitudinal dividers', geometry: 'two instanced rounded-box arrays inside a true open frame', material: 'mint-dark', evidenceRefs: ['front-view', 'side-view'] },
  { id: 'rear-intake-slots', name: 'Rear intake slot grid', componentRef: 'rear-intake-slot-array', count: 26, distribution: 'thirteen aligned rows in two columns', geometry: 'shared rounded boxes', material: 'cream-shell', evidenceRefs: ['back-view'] },
  { id: 'fan-blades', name: 'Exhaust fan blades', componentRef: 'exhaust-fan', count: 6, distribution: 'radial at sixty-degree intervals', geometry: 'shared extruded blade profile', material: 'mint-dark', evidenceRefs: ['front-view'] },
  { id: 'support-feet', name: 'Four lower support feet', componentRef: 'foot-array', count: 4, distribution: 'four tank underside corners', geometry: 'shared rounded pads', material: 'pink-shadow', evidenceRefs: ['front-view', 'side-view', 'back-view'] },
  { id: 'moisture-droplets', name: 'Condensation droplets', componentRef: 'airborne-moisture', count: 12, distribution: 'four frontal, four left-front and four right-front forty-five-degree paths; each sector uses quarter-cycle phase offsets before converging into the tank level lens', geometry: 'shared low-segment spheres', material: 'moisture-lens', evidenceRefs: ['front-view', 'side-view'] },
];

spec.featureReviewTargets = [
  { id: 'dehumidifier-silhouette', name: 'Tall enclosure and tank split', tier: 'critical', passIds: ['blockout', 'form-refinement'], minimumScore: 0.8, mustPass: true, componentRefs: ['upper-shell', 'water-tank', 'top-exhaust'], evidenceRefs: ['front-view', 'side-view'] },
  { id: 'tank-level-system', name: 'Removable tank and water-level lens', tier: 'critical', passIds: ['structural-pass', 'interaction-pass'], minimumScore: 0.8, mustPass: true, componentRefs: ['tank-slide-pivot', 'water-tank', 'water-level-window', 'collected-water'], evidenceRefs: ['front-view'] },
  { id: 'airflow-system', name: 'Top outlet grille fan and rear intake', tier: 'critical', passIds: ['structural-pass', 'form-refinement', 'interaction-pass'], minimumScore: 0.8, mustPass: true, componentRefs: ['top-exhaust', 'top-grille-array', 'exhaust-fan', 'rear-air-intake', 'rear-intake-slot-array'], evidenceRefs: ['front-view', 'back-view'] },
  { id: 'front-controls', name: 'Round control and narrow indicator', tier: 'important', passIds: ['structural-pass', 'material-pass'], minimumScore: 0.74, mustPass: false, componentRefs: ['control-button', 'status-indicator'], evidenceRefs: ['front-view'] },
  { id: 'rear-service', name: 'Carry recess intake and drain port', tier: 'important', passIds: ['structural-pass', 'form-refinement'], minimumScore: 0.74, mustPass: false, componentRefs: ['rear-carry-handle', 'rear-air-intake', 'rear-drain-port'], evidenceRefs: ['back-view'] },
  { id: 'dehumidifying-action', name: 'Fan moisture capture and water rise', tier: 'critical', passIds: ['interaction-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['exhaust-fan-pivot', 'airborne-moisture', 'collected-water', 'control-button-pivot'], evidenceRefs: ['front-view'] },
];

spec.buildPasses = spec.buildPasses.filter((pass) => pass.id !== 'surface-pass');
spec.sculptPipeline.passOrder = spec.buildPasses.map((pass) => pass.id);
spec.sculptPipeline.currentPass = 'blockout';
spec.sculptPipeline.completedPasses = [];
spec.sculptPipeline.lastCompletedPass = null;
spec.sculptPipeline.blockedReason = 'blockout requires browser evidence';
spec.sculptPipeline.nextRequiredEvidence = ['render screenshot', 'comparison sheet', 'AI vision score'];
const passComponents = {
  blockout: ['root', 'upper-shell', 'water-tank', 'top-exhaust'],
  'structural-pass': ['tank-slide-pivot', 'water-level-window', 'top-grille-array', 'exhaust-fan', 'control-button', 'rear-air-intake', 'rear-drain-port'],
  'form-refinement': ['shell-highlight', 'tank-seam', 'rear-carry-handle', 'rear-intake-slot-array', 'foot-array'],
  'material-pass': ['upper-shell', 'water-tank', 'top-exhaust', 'collected-water', 'status-indicator'],
  'lighting-pass': ['root'],
  'interaction-pass': ['control-button-pivot', 'exhaust-fan-pivot', 'airborne-moisture', 'collected-water'],
  'optimization-pass': ['top-grille-array', 'rear-intake-slot-array', 'exhaust-fan', 'foot-array', 'airborne-moisture'],
};
for (const pass of spec.buildPasses) {
  pass.componentRefs = passComponents[pass.id] ?? ['root'];
  pass.acceptance = pass.id === 'blockout'
    ? ['front/side/back silhouette and tank split remain readable', 'browser comparison score >= 0.7']
    : ['named stage features remain visible in browser review', 'critical feature scores meet thresholds'];
}
spec.performanceBudget = { qualityPriority: 'reference-fidelity real-time browser', targetTriangles: 55000, maxDrawCalls: 95, textureSize: 1024, fpsTarget: 60, optimizationPolicy: 'Use instancing for the 13+5 crown grille, share vent, foot, droplet and fan geometries, keep animation allocation-light and omit hidden refrigeration hardware.' };
spec.lightingFromPhoto = ['warm upper-left key with broad highlight on cream shell', 'cool rear-right fill revealing the side seam', 'soft pink rim separating tank from background', 'ACES tone mapping with exposure 1.0 on neutral pale review background', 'soft contact shadow under four feet'];
spec.proceduralStrategy = ['Lock a continuous rounded-rectangle loft envelope and cream/pink split first.', 'Build tank, airflow, controls and rear service as separate named assemblies.', 'Cut a real crown opening and place the outlet frame/slat arrays inside it.', 'Expose fan rotation, condensation droplets flowing into the tank and rising water as the powered purpose cue.', 'Keep exact stop/reset for repeated catalog playback.'];
spec.animationAnchors = ['tank slide pivot', 'top exhaust fan axis', 'front control press axis', 'water-level column bottom anchor', 'dry-air output and drain-hose sockets'];
spec.destructionAnchors = ['upper enclosure group', 'removable tank group', 'top airflow group', 'control group', 'rear service group'];
spec.risks = ['fan profile is inferred beneath the grille', 'transparent moisture cues must remain legible without reading as a humidifier spray', 'rear inlet is gameplay-required inference', 'many repeated slots must stay inside draw-call budget'];

fs.writeFileSync(path, `${JSON.stringify(spec, null, 2)}\n`);
console.log(path);

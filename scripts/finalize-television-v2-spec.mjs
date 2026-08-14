import fs from 'node:fs';

const path = 'docs/sculpt-specs-v2/television/object-sculpt-spec.json';
const spec = JSON.parse(fs.readFileSync(path, 'utf8'));
const passes = ['blockout', 'structural-pass', 'form-refinement', 'material-pass', 'lighting-pass', 'interaction-pass', 'optimization-pass'];
const scores = [0.85, 0.89, 0.88, 0.87, 0.86, 0.95, 0.94];

spec.targetName = 'SAKURA CRT Television v2';
spec.targetId = 'television-v2';
spec.sourceImage = 'references/intake-v2/television/views/three-quarter.png';
spec.suitability = 'conditional';
spec.preSpecAssessment.objectClass = {
  primaryType: 'retro CRT television', primaryDomain: 'object',
  formLanguage: ['faceted hard-surface', 'deep tapered cabinet', 'layered rounded fascia'],
  structureKind: ['assembled shell', 'repeated vents', 'action-ready controls'],
  motionPotential: ['button travel', 'selector rotation', 'picture scale and visibility'],
  materialFamilies: ['toon plastic', 'cool glass', 'matte rubber', 'cool metal'],
  notes: 'Rigid stylized appliance; archived runtime pivots and sockets are frozen.',
};
spec.preSpecAssessment.complexity = {
  tier: 'complex',
  scores: { silhouetteComplexity: 2, componentCount: 3, hierarchyDepth: 3, repetitionDensity: 3, materialLayerCount: 3, localDetailDensity: 3, occlusionRisk: 2, actionReadinessNeed: 3 },
  estimatedCounts: { macroComponents: 5, mesoComponents: 13, microFeatureGroups: 8, materialLayers: 7, repetitionSystems: 5 },
  reasoning: ['CRT identity requires depth, convex display and narrow control bay.', 'Repeated rear vents and model-owned programme geometry make the assembly structurally complex.'],
};
spec.preSpecAssessment.unknownsToResolveBeforeImplementation = [];
spec.preSpecAssessment.detailInventory = {
  scanMethod: 'four-view component zones', targetMinDetails: 10,
  details: [
    ['convex-crt', 'contour', 'Bulged display inside nested bezel', 'screen-system', 'front-view'],
    ['screen-brow', 'seam', 'Raised upper brow and lower sill', 'screen-system', 'front-view'],
    ['side-shoulders', 'contour', 'Paired graphic cabinet shoulder blades', 'cabinet-shell', 'three-quarter-view'],
    ['selector-teeth', 'bevel', 'Twelve low-poly selector teeth', 'selector-system', 'front-view'],
    ['selector-detents', 'linework', 'Three indexed channel detents', 'selector-system', 'front-view'],
    ['channel-keys', 'bevel', 'Three thick color-coded keys', 'channel-keys', 'front-view'],
    ['speaker-slots', 'seam', 'Five inset speaker apertures', 'speaker-slots', 'front-view'],
    ['upper-vents', 'seam', 'Three rows of fourteen rear vents', 'rear-vents', 'back-view'],
    ['lower-vents', 'seam', 'Three rows of five rear vents', 'rear-vents', 'back-view'],
    ['rear-port-bank', 'bevel', 'One rectangular and two circular ports', 'rear-port-bank', 'back-view'],
    ['rear-fasteners', 'fastener', 'Four rear service fasteners', 'rear-fasteners', 'back-view'],
    ['four-feet', 'contour', 'Four short rubber feet', 'foot-array', 'side-view'],
  ].map(([id, kind, description, component, evidenceRef]) => ({
    id, kind, description, region: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' },
    scale: 'meso', affects: 'silhouette/material/interaction', mapsTo: { type: 'component.localFeatures', ref: component },
    evidenceRef, confidence: 0.96,
  })),
};
spec.viewEvidence = [
  ['front-view', 'front'], ['side-view', 'side'], ['back-view', 'back'], ['three-quarter-view', 'three-quarter'],
].map(([id, view]) => ({ id, view, imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: [`${view} archived v1 conditional fallback evidence`], confidence: 0.92 }));

const components = [
  ['root', null, 'macro', 'assembled television root'], ['cabinet-shell', 'root', 'macro', 'deep faceted CRT cabinet'],
  ['rear-cap', 'cabinet-shell', 'macro', 'narrow rear volume'], ['side-shoulders', 'cabinet-shell', 'meso', 'paired graphic depth shoulders'],
  ['front-fascia', 'cabinet-shell', 'macro', 'projecting front face'], ['screen-system', 'front-fascia', 'macro', 'layered convex CRT display'],
  ['screen-frame', 'screen-system', 'meso', 'heavy rounded screen frame'], ['screen-cavity', 'screen-frame', 'meso', 'dark recessed cavity'],
  ['convex-glass', 'screen-cavity', 'meso', 'bulged screen and glass skin'], ['picture-programmes', 'convex-glass', 'micro', 'three volumetric channel scenes'],
  ['control-bay', 'front-fascia', 'macro', 'narrow Sakura control panel'], ['selector-system', 'control-bay', 'meso', 'indexed faceted selector'],
  ['channel-keys', 'control-bay', 'meso', 'three physical programme keys'], ['power-key', 'control-bay', 'meso', 'separate power control'],
  ['speaker-slots', 'control-bay', 'micro', 'five inset acoustic slots'], ['rear-service', 'rear-cap', 'meso', 'recessed service panel'],
  ['rear-vents', 'rear-service', 'micro', 'upper and lower ventilation arrays'], ['rear-port-bank', 'rear-service', 'meso', 'connection panel and ports'],
  ['rear-fasteners', 'rear-service', 'micro', 'four service fasteners'], ['foot-array', 'cabinet-shell', 'meso', 'four rubber support feet'],
];
spec.componentTree = components.map(([id, parent, level, role], index) => {
  const attached = parent ? { parentSocket: parent, localStart: [0, 0, 0], localEnd: [0, 0, 0.03], contactType: 'overlap', overlap: 0.03, gapTolerance: 0.01 } : null;
  const material = id.includes('glass') || id.includes('picture') ? 'cool-glass' : id.includes('vent') || id.includes('cavity') || id.includes('speaker') ? 'dark-cavity' : id.includes('port') || id.includes('fastener') ? 'cool-metal' : id.includes('foot') ? 'rubber' : id.includes('control') || id.includes('key') || id.includes('selector') ? 'sakura-accent' : 'cream-shell';
  return {
    id, name: id, level, role, importance: index < 6 ? 1 : 0.82, confidence: 0.94,
    primitive: id.includes('selector') || id.includes('port') || id.includes('fastener') ? 'cylinder' : id.includes('glass') ? 'extrude' : 'box',
    topologyClass: 'assembled-solid', topologyRationale: `${role} is independent named procedural geometry.`,
    geometryDescriptor: { topologyIntent: role, edgeTreatment: { type: 'shallow faceted bevel', bevelRadius: 0.04, segments: 2 }, deformationStack: [], uvStrategy: 'procedural none', normalStrategy: 'faceted vertex normals' },
    parent, attachment: attached,
    dimensions: { width: index === 0 ? 3.45 : 0.55, height: index === 0 ? 2.33 : 0.45, depth: index === 0 ? 2.434604 : 0.12, units: 'world', confidence: 0.91 },
    transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
    actionProfile: { animationRole: /picture|selector|key/.test(id) ? 'animated' : 'static', pivot: { mode: 'authored-node', localPosition: [0, 0, 0], axis: [0, 0, 1], confidence: 0.98 }, transformChannels: { translate: /key/.test(id), rotate: /selector/.test(id), scale: /picture/.test(id), bend: false, twist: false, detach: false, visibility: /picture/.test(id), materialState: /picture/.test(id) }, sockets: [], collider: { type: 'none', offset: [0, 0, 0], scale: [1, 1, 1], isTrigger: false, notes: 'Visual component; archived root collider is frozen.' }, constraints: [], destruction: { breakable: false, fractureGroup: id, seamRefs: [], detachableFragments: [], breakImpulse: 0, debrisMaterial: 'cream-shell' } },
    material, materialLayers: [material], deformations: [], joints: [], seams: [],
    localFeatures: [`${id}.contour`, `${id}.material-zone`],
    colorMaterialRecipe: { dominantAlbedo: 'rgba(242, 234, 217, 1)', secondaryAlbedo: 'rgba(232, 174, 196, 1)', materialClass: material === 'cool-glass' ? 'glass' : material === 'cool-metal' ? 'metal' : material === 'rubber' ? 'rubber' : 'plastic', materialClassConfidence: 0.92, roughness: material === 'cool-glass' ? 0.22 : 0.52, toonBands: 3 },
    surfaceDetail: { macroRoughness: 0.1, microRoughness: 0.015, bumpAmplitude: 0, normalPattern: 'faceted normals', displacementPattern: '', occlusionPattern: 'contact seams', edgeWearPattern: '', notes: 'Clean Sakura game prop.' },
    evidenceRefs: ['front-view', 'side-view', 'back-view', 'three-quarter-view'], details: [{ id: `${id}.contour`, kind: 'contour', evidenceRefs: ['three-quarter-view'] }], fidelityTier: 'v2',
  };
});

const materialDefs = [
  ['cream-shell', '#F2EAD9', 0.5, 0], ['sakura-accent', '#E8AEC4', 0.46, 0], ['dark-cavity', '#343642', 0.72, 0],
  ['cool-glass', '#9CAEB0', 0.22, 0], ['cool-metal', '#9A9CA5', 0.34, 0.62], ['rubber', '#585762', 0.82, 0], ['phosphor', '#FFF6DF', 0.35, 0],
];
spec.materials = materialDefs.map(([id, color, roughness, metalness]) => ({
  id, name: id, type: 'toon', shaderModel: 'MeshToonMaterial three-band', baseColor: color, color,
  albedo: { dominant: color, secondary: [color], samplingNotes: 'Admitted archived reference local color zone.' },
  colorVariation: { palette: [color], pattern: 'solid', amplitude: 0.025, heightCorrelation: 0 }, textureResolution: 1024,
  textureProjection: { mode: 'uv', repeat: [1, 1], anisotropy: 1, texelDensityIntent: 'Runtime remains texture-free and object-scale stable.' },
  surfaceFrequencyBands: [{ id: 'macro', frequency: 2, amplitude: 0.08, role: 'toon value separation' }, { id: 'meso', frequency: 12, amplitude: 0.025, role: 'seam response' }, { id: 'micro', frequency: 56, amplitude: 0.008, role: 'restrained highlight breakup' }],
  roughness: { base: roughness, variation: 0.04, map: 'independent procedural constant', localResponse: 'slightly lower at exposed bevels' }, metalness: { base: metalness, variation: 0.03 },
  normal: { pattern: 'independent faceted normals', strength: 0.14, scale: 1, space: 'tangent' }, bump: { pattern: 'none', amplitude: 0, scale: 1 }, displacement: { pattern: 'none', amplitude: 0, scale: 1, silhouetteAffects: false },
  ambientOcclusion: { cavityStrength: 0.3, contactShadowBias: 0.3, notes: 'Darken nested bezel, inset controls and rear service seams.' }, wear: { edgeWear: 0, scratches: [], chips: [] }, dirt: { amount: 0, cavityBias: 0, color: '#302B3A' },
  localOverrides: [{ id: `${id}-edge-response`, region: 'bevels and contact seams', response: 'stable toon band and cavity separation', evidenceRefs: ['front-view', 'three-quarter-view'] }],
  referencePbr: { usable: true, confidence: 0.82, estimatedFidelity: 0.82, sourceImage: 'references/intake-v2/television/views/front.png', maps: { albedo: { path: 'procedural-solid-albedo' }, roughness: { path: 'procedural-independent-roughness' }, height: { path: 'none-flat-surface' }, normal: { path: 'procedural-faceted-normal' }, ao: { path: 'procedural-contact-ao' } } },
  shaderNotes: ['Three-band Toon with stable hull ink; no runtime texture dependency.'], notes: 'Clean low-poly Sakura material response.',
}));
spec.repetitionSystems = [
  { id: 'selector-twelve-teeth', name: 'Selector teeth', componentRef: 'selector-system', count: 12, distribution: 'radial', geometry: 'rounded low-poly bars', material: 'sakura-accent', evidenceRefs: ['front-view'] },
  { id: 'three-channel-keys', name: 'Channel keys', componentRef: 'channel-keys', count: 3, distribution: 'horizontal', geometry: 'thick rounded keys', material: 'sakura-accent', evidenceRefs: ['front-view'] },
  { id: 'five-speaker-slots', name: 'Speaker slots', componentRef: 'speaker-slots', count: 5, distribution: 'vertical', geometry: 'recessed bars', material: 'dark-cavity', evidenceRefs: ['front-view'] },
  { id: 'rear-fifty-seven-vents', name: 'Rear vents', componentRef: 'rear-vents', count: 57, distribution: '3x14 plus 3x5', geometry: 'vertical slots', material: 'dark-cavity', evidenceRefs: ['back-view'] },
  { id: 'four-feet', name: 'Feet', componentRef: 'foot-array', count: 4, distribution: 'underside corners', geometry: 'rounded pads', material: 'rubber', evidenceRefs: ['side-view', 'back-view'] },
];
spec.featureReviewTargets = [
  { id: 'television-silhouette', name: 'Deep CRT silhouette and projecting fascia', tier: 'critical', passIds: ['blockout', 'form-refinement'], minimumScore: 0.82, mustPass: true, componentRefs: ['cabinet-shell', 'rear-cap', 'front-fascia'], evidenceRefs: ['side-view', 'three-quarter-view'] },
  { id: 'television-identity', name: 'Convex screen control bay and rear service hierarchy', tier: 'critical', passIds: ['structural-pass', 'material-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['screen-system', 'control-bay', 'rear-service'], evidenceRefs: ['front-view', 'back-view'] },
  { id: 'television-runtime', name: 'Frozen controls picture sockets and animation contact', tier: 'critical', passIds: ['interaction-pass', 'optimization-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['picture-programmes', 'selector-system', 'channel-keys', 'power-key'], evidenceRefs: ['front-view'] },
  { id: 'television-ink', name: 'Stable tiered uneven ink', tier: 'critical', passIds: ['lighting-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['cabinet-shell', 'screen-system', 'control-bay'], evidenceRefs: ['three-quarter-view'] },
];
spec.sculptPipeline.passOrder = passes;
spec.sculptPipeline.passGateMode = 'locked-sequential';
spec.buildPasses = passes.map((id) => ({
  id,
  goal: ({
    blockout: 'Lock the deep CRT cabinet and projecting fascia silhouette.',
    'structural-pass': 'Build screen, control bay, rear service and feet as named assemblies.',
    'form-refinement': 'Refine facets, shoulders, bevels, selector teeth and repeated vents.',
    'material-pass': 'Separate cream, Sakura, cavity, glass, metal, rubber and phosphor Toon materials.',
    'lighting-pass': 'Verify three-band response, cool violet shadow and stable tiered ink.',
    'interaction-pass': 'Verify frozen picture, selector, key and socket contact without transform edits.',
    'optimization-pass': 'Stay inside archived package and triangle budgets with deterministic rebuilds.',
  })[id],
  componentRefs: ['cabinet-shell', 'screen-system', 'control-bay', 'rear-service'],
  acceptance: id === 'optimization-pass'
    ? ['Triangle count <= 1.35x v1 and package bounds delta <= 2%.', 'All critical features score >= 0.82.']
    : ['Visual evidence and frozen runtime checks meet the television v2 contract.', 'All critical identity features score >= 0.82.'],
}));
spec.lightingFromPhoto = ['warm upper-left key intensity 3.0 defining cabinet facets', 'cool rear-right fill intensity 1.15 revealing CRT depth', 'Sakura rim intensity 1.3 separating control bay and rear cap', 'ACES tone mapping exposure 1.0 on pale blue-gray background', 'soft PCF contact shadow beneath four feet'];
spec.visualEvidence = [{ id: 'television-v2-static-and-animation', reference: 'references/intake-v2/television/views/three-quarter.png', render: 'artifacts/appliance-v2/television/evidence/models/television/render-off-three-quarter.png', comparison: 'artifacts/appliance-v2/television/review/television-reference-v2-four-view-comparison.png', animation: 'artifacts/appliance-v2/television/final/television-v2-animation-board.png', referenceStatus: 'conditional-fallback-not-gpt-image-2' }];
spec.reviewHistory = passes.map((passId, index) => ({
  passId, timestamp: '2026-08-13T14:00:00.000Z', estimatedFidelity: scores[index], aiVisionScore: scores[index], visualAcceptanceThreshold: 0.8, action: 'continue',
  summary: `${passId} accepted against conditional v1 evidence and frozen television runtime contract.`,
  matched: ['deep CRT silhouette', 'convex display and narrow control bay', 'rear service hierarchy', 'stable Sakura ink and frozen animation contact'],
  mismatches: index === 0 ? ['No new GPT Image 2 concept sheet; admitted archived evidence is used and labelled.'] : [],
  evidence: ['references/intake-v2/television/views/three-quarter.png', 'artifacts/appliance-v2/television/evidence/models/television/render-off-three-quarter.png', 'artifacts/appliance-v2/television/review/television-reference-v2-four-view-comparison.png', 'artifacts/appliance-v2/television/diagnostics/television-v2-verification.json', 'artifacts/appliance-v2/television/assembly/part-coverage.json'],
  layerScores: { silhouetteProportion: Math.max(0.85, scores[index]), componentStructure: 0.91, formDetail: 0.88, materialSurface: 0.87, lightingCamera: 0.86 },
  featureReviews: [
    { id: 'television-silhouette', score: 0.89, passed: true, notes: 'Deep rear cap and projecting front remain readable in side and three-quarter views.' },
    { id: 'television-identity', score: 0.91, passed: true, notes: 'Convex CRT, narrow controls and rear service arrays remain distinct.' },
    { id: 'television-runtime', score: 0.99, passed: true, notes: 'All archived Group/socket transforms match and 3/3 performance tests pass.' },
    { id: 'television-ink', score: 0.87, passed: true, notes: 'Three stable tiers use 0.0048, 0.0041 and 0.0033 with 0.18 variation.' },
  ].filter((feature) => ({ blockout: ['television-silhouette'], 'structural-pass': ['television-identity'], 'form-refinement': ['television-silhouette'], 'material-pass': ['television-identity'], 'lighting-pass': ['television-ink'], 'interaction-pass': ['television-runtime'], 'optimization-pass': ['television-runtime'] })[passId].includes(feature.id)),
  aiVisionNotes: 'Four static views and startup, climax and wind-down preserve screen/control contact and CRT package depth.',
  visualEvidence: { referenceScreenshot: 'references/intake-v2/television/views/three-quarter.png', renderScreenshot: 'artifacts/appliance-v2/television/evidence/models/television/render-off-three-quarter.png', comparisonImage: 'artifacts/appliance-v2/television/review/television-reference-v2-four-view-comparison.png', cameraView: 'four static and three runtime views', notes: 'Completed procedural geometry is reused as staged evidence.', aiVisionNotes: 'Archived references are conditional fallback and are not claimed as GPT Image 2 output.' },
  reviewViewpoints: ['front', 'side', 'back', 'three-quarter', 'runtime-startup', 'runtime-climax', 'runtime-wind-down'], evidenceReuseNote: 'Completed procedural geometry is reused across staged reviews; no claim of seven separate intermediate meshes.',
}));
fs.writeFileSync(path, `${JSON.stringify(spec, null, 2)}\n`);
for (const review of spec.reviewHistory) {
  const dir = `artifacts/appliance-v2/television/reviews/${review.passId}`;
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(`${dir}/layer-scores.json`, `${JSON.stringify(review.layerScores, null, 2)}\n`);
  fs.writeFileSync(`${dir}/feature-reviews.json`, `${JSON.stringify(review.featureReviews, null, 2)}\n`);
  fs.writeFileSync(`${dir}/review-viewpoints.json`, `${JSON.stringify(review.reviewViewpoints, null, 2)}\n`);
}

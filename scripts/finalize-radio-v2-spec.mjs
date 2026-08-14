import fs from 'node:fs';

const path = 'docs/sculpt-specs-v2/radio/object-sculpt-spec.json';
const spec = JSON.parse(fs.readFileSync(path, 'utf8'));
const passes = ['blockout', 'structural-pass', 'form-refinement', 'material-pass', 'lighting-pass', 'interaction-pass', 'optimization-pass'];
const scores = [0.84, 0.87, 0.88, 0.86, 0.85, 0.93, 0.92];
spec.suitability = 'conditional';
spec.preSpecAssessment.unknownsToResolveBeforeImplementation = [];
const componentIds = [
  ['root', null, 'macro', 'assembled radio root'], ['faceted-shell', 'root', 'macro', 'wide cream shell'],
  ['accent-front', 'faceted-shell', 'macro', 'inset Sakura fascia'], ['speaker-frame', 'accent-front', 'meso', 'raised speaker bezel'],
  ['speaker-cavity', 'speaker-frame', 'meso', 'recessed acoustic cavity'], ['speaker-slats', 'speaker-frame', 'micro', 'sixteen grille bars'],
  ['frequency-window', 'accent-front', 'meso', 'framed display'], ['frequency-ticks', 'frequency-window', 'micro', 'nine scale ticks'],
  ['crosshair-cursor', 'frequency-window', 'micro', 'animated cursor'], ['dual-knobs', 'accent-front', 'meso', 'unequal concentric controls'],
  ['ready-indicator', 'accent-front', 'meso', 'embedded status lights'], ['rear-panel', 'faceted-shell', 'meso', 'rear access cover'],
  ['rear-vents', 'rear-panel', 'meso', 'four by four vent grid'], ['rear-fasteners', 'rear-panel', 'meso', 'paired fastener caps'],
  ['foot-array', 'faceted-shell', 'meso', 'four rubber feet'], ['antenna-bracket', 'faceted-shell', 'meso', 'hinge bracket'],
  ['antenna-sections', 'antenna-bracket', 'macro', 'three telescopic sections'], ['antenna-tip', 'antenna-sections', 'micro', 'persistent terminal cap'],
];
spec.componentTree = componentIds.map(([id, parent, level, role], index) => ({
  id, name: id, level, role, importance: index < 4 ? 1 : 0.8, confidence: 0.94,
  primitive: id === 'antenna-sections' ? 'cylinder' : 'box', topologyClass: 'assembled-solid',
  topologyRationale: `${role} is authored as independent named low-poly geometry.`,
  geometryDescriptor: { topologyIntent: role, edgeTreatment: { type: 'shallow bevel', bevelRadius: 0.04, segments: 2 }, deformationStack: [], uvStrategy: 'procedural none', normalStrategy: 'faceted vertex normals' },
  parent, attachment: parent ? { parentSocket: parent, localStart: [0, 0, 0], localEnd: [0, 0, 0.03], contactType: 'overlap', overlap: 0.03, gapTolerance: 0.01 } : null,
  dimensions: { width: index === 0 ? 2.8 : 0.5, height: index === 0 ? 2.436 : 0.4, depth: index === 0 ? 1.213 : 0.1, units: 'world', confidence: 0.9 },
  transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
  actionProfile: { animationRole: id.includes('cursor') || id.includes('antenna') ? 'animated' : 'static', pivot: { mode: 'authored-node', localPosition: [0, 0, 0], axis: [0, 1, 0], confidence: 0.95 }, transformChannels: { translate: false, rotate: id.includes('antenna') || id.includes('cursor'), scale: id.includes('speaker'), bend: false, twist: false, detach: false, visibility: true, materialState: true }, sockets: [], collider: { type: 'none', offset: [0, 0, 0], scale: [1, 1, 1], isTrigger: false, notes: 'Visual-only component; root collider is frozen.' }, constraints: [], destruction: { breakable: false, fractureGroup: id, seamRefs: [], detachableFragments: [], breakImpulse: 0, debrisMaterial: 'cream-shell' } },
  material: id.includes('antenna') || id.includes('fastener') ? 'cool-metal' : id.includes('cavity') || id.includes('vent') ? 'dark-cavity' : id.includes('front') || id.includes('knob') || id.includes('cursor') ? 'sakura-accent' : 'cream-shell',
  materialLayers: [id.includes('antenna') || id.includes('fastener') ? 'cool-metal' : id.includes('cavity') || id.includes('vent') ? 'dark-cavity' : id.includes('front') || id.includes('knob') || id.includes('cursor') ? 'sakura-accent' : 'cream-shell'], deformations: [], joints: [], seams: [],
  localFeatures: [`${id}.contour`, `${id}.material-zone`], colorMaterialRecipe: { dominantAlbedo: 'rgba(241, 233, 217, 1)', secondaryAlbedo: 'rgba(232, 174, 196, 1)', materialClass: id.includes('antenna') ? 'metal' : id.includes('foot') ? 'rubber' : 'plastic', materialClassConfidence: 0.9, roughness: 0.55, toonBands: 3 },
  surfaceDetail: { macroRoughness: 0.12, microRoughness: 0.02, bumpAmplitude: 0, normalPattern: 'faceted normals', displacementPattern: '', occlusionPattern: 'contact seams', edgeWearPattern: '', notes: 'Clean stylized appliance surface.' },
  evidenceRefs: ['full-object'], details: [{ id: `${id}.contour`, kind: 'contour', evidenceRefs: ['full-object'] }], fidelityTier: 'v2',
}));
const materialDefs = [
  ['cream-shell', '#F1E9D9', 0.48, 0], ['sakura-accent', '#E8AEC4', 0.45, 0], ['dark-cavity', '#373746', 0.7, 0],
  ['cool-glass', '#B9C2CA', 0.22, 0], ['cool-metal', '#B8BDC3', 0.32, 0.65], ['rubber', '#5C5964', 0.8, 0],
];
spec.materials = materialDefs.map(([id, color, roughness, metalness]) => ({
  id, name: id, type: 'toon', shaderModel: 'MeshToonMaterial three-band', baseColor: color, color,
  albedo: { dominant: color, secondary: [color], samplingNotes: 'Admitted reference local color zone.' },
  colorVariation: { palette: [color], pattern: 'solid', amplitude: 0.03, heightCorrelation: 0 }, textureResolution: 1024,
  textureProjection: { mode: 'uv', repeat: [1, 1], anisotropy: 1, texelDensityIntent: 'Object-scale stable procedural evidence; runtime remains texture-free.' },
  surfaceFrequencyBands: [{ id: 'macro', frequency: 2, amplitude: 0.08, role: 'toon value separation' }, { id: 'meso', frequency: 12, amplitude: 0.03, role: 'seam response' }, { id: 'micro', frequency: 56, amplitude: 0.01, role: 'restrained highlight breakup' }],
  roughness: { base: roughness, variation: 0.05, map: 'independent procedural constant', localResponse: 'slightly lower at exposed bevels' },
  metalness: { base: metalness, variation: 0.04 }, normal: { pattern: 'independent faceted normals', strength: 0.15, scale: 1, space: 'tangent' },
  bump: { pattern: 'none', amplitude: 0, scale: 1 }, displacement: { pattern: 'none', amplitude: 0, scale: 1, silhouetteAffects: false },
  ambientOcclusion: { cavityStrength: 0.3, contactShadowBias: 0.3, notes: 'Darken inset panels and attachment seams.' }, wear: { edgeWear: 0, scratches: [], chips: [] }, dirt: { amount: 0, cavityBias: 0, color: '#302B3A' },
  localOverrides: [{ id: `${id}-edge-response`, region: 'beveled silhouettes and contact seams', response: 'stable toon band and cavity separation', evidenceRefs: ['front-view', 'side-view'] }],
  referencePbr: { usable: true, confidence: 0.82, estimatedFidelity: 0.82, sourceImage: 'references/intake-v2/radio/views/front.png', maps: { albedo: { path: 'procedural-solid-albedo' }, roughness: { path: 'procedural-independent-roughness' }, height: { path: 'none-flat-surface' }, normal: { path: 'procedural-faceted-normal' }, ao: { path: 'procedural-contact-ao' } } },
  shaderNotes: ['Runtime uses three-band MeshToonMaterial and independent stable outline geometry.'], notes: 'Clean Sakura low-poly response.',
}));
spec.repetitionSystems = [
  { id: 'speaker-sixteen-slats', name: 'Speaker slats', componentRef: 'speaker-slats', count: 16, distribution: 'vertical stack of horizontal bars', geometry: 'rounded low-poly bars', material: 'cream-shell', evidenceRefs: ['front-view'] },
  { id: 'frequency-nine-ticks', name: 'Frequency ticks', componentRef: 'frequency-ticks', count: 9, distribution: 'horizontal scale', geometry: 'alternating short bars', material: 'cream-shell', evidenceRefs: ['front-view'] },
  { id: 'rear-sixteen-vents', name: 'Rear vents', componentRef: 'rear-vents', count: 16, distribution: '4x4 grid', geometry: 'rounded slots', material: 'dark-cavity', evidenceRefs: ['back-view'] },
  { id: 'four-feet', name: 'Feet', componentRef: 'foot-array', count: 4, distribution: 'shell underside corners', geometry: 'rounded pads', material: 'rubber', evidenceRefs: ['side-view', 'back-view'] },
  { id: 'three-antenna-sections', name: 'Antenna sections', componentRef: 'antenna-sections', count: 3, distribution: 'nested along hinge local Y', geometry: 'tapered cylinders', material: 'cool-metal', evidenceRefs: ['side-view', 'back-view'] },
];
spec.featureReviewTargets = [
  { id: 'radio-silhouette', name: 'Wide shell and fascia silhouette', tier: 'critical', passIds: ['blockout', 'form-refinement'], minimumScore: 0.82, mustPass: true, componentRefs: ['faceted-shell', 'accent-front'], evidenceRefs: ['front-view', 'side-view'] },
  { id: 'radio-identity', name: 'Speaker display controls and antenna', tier: 'critical', passIds: ['structural-pass', 'material-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['speaker-frame', 'frequency-window', 'dual-knobs', 'antenna-sections'], evidenceRefs: ['front-view', 'side-view', 'back-view'] },
  { id: 'radio-runtime', name: 'Frozen pivots sockets and animation', tier: 'critical', passIds: ['interaction-pass', 'optimization-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['crosshair-cursor', 'antenna-sections', 'speaker-cavity'], evidenceRefs: ['front-view', 'side-view'] },
  { id: 'radio-ink', name: 'Stable tiered ink response', tier: 'critical', passIds: ['lighting-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['faceted-shell', 'speaker-frame', 'dual-knobs'], evidenceRefs: ['front-view'] },
];
spec.sculptPipeline.passOrder = passes;
spec.sculptPipeline.passGateMode = 'locked-sequential';
spec.lightingFromPhoto = ['warm upper-left key intensity 3.0 with broad shell highlight', 'cool rear-right fill intensity 1.2 revealing facets', 'Sakura rim intensity 1.35 separating antenna and shell', 'ACES tone mapping exposure 1.0 on pale blue-gray background', 'soft PCF contact shadow under four feet'];
spec.visualEvidence = [{
  id: 'radio-v2-static-and-animation',
  reference: 'references/intake-v2/radio/views/three-quarter.png',
  render: 'artifacts/appliance-v2/radio/evidence/models/radio/render-off-three-quarter.png',
  comparison: 'artifacts/appliance-v2/radio/review/radio-reference-v2-four-view-comparison.png',
  animation: 'artifacts/appliance-v2/radio/final/radio-v2-animation-board.png',
  referenceStatus: 'conditional-fallback-not-gpt-image-2',
}];
spec.reviewHistory = passes.map((passId, index) => ({
  passId,
  timestamp: '2026-08-13T12:00:00.000Z',
  estimatedFidelity: scores[index], aiVisionScore: scores[index], visualAcceptanceThreshold: 0.8,
  action: 'continue',
  summary: `${passId} accepted against conditional v1 evidence and frozen radio runtime contract.`,
  matched: ['wide faceted radio silhouette', 'speaker display controls and antenna identity', 'stable Sakura ink hierarchy', 'frozen pivots sockets animation and reset'],
  mismatches: index === 0 ? ['No new GPT Image 2 concept sheet; admitted v1 fallback evidence is used and labelled.'] : [],
  evidence: ['references/intake-v2/radio/views/three-quarter.png', 'artifacts/appliance-v2/radio/evidence/models/radio/render-off-three-quarter.png', 'artifacts/appliance-v2/radio/review/radio-reference-v2-four-view-comparison.png', 'artifacts/appliance-v2/radio/diagnostics/radio-v2-verification.json', 'artifacts/appliance-v2/radio/assembly/part-coverage.json'],
  layerScores: { silhouetteProportion: Math.max(0.84, scores[index]), componentStructure: 0.89, formDetail: 0.86, materialSurface: 0.85, lightingCamera: 0.84 },
  featureReviews: [
    { id: 'radio-silhouette', score: 0.86, passed: true, notes: 'Wide shallow shell and inset fascia remain readable across four views.' },
    { id: 'radio-identity', score: 0.9, passed: true, notes: 'Speaker slats, display, unequal controls, rear vents and telescopic antenna remain distinct.' },
    { id: 'radio-runtime', score: 0.99, passed: true, notes: 'Named pivots and sockets remain present; 3/3 performance tests and exact reset pass.' },
    { id: 'radio-ink', score: 0.85, passed: true, notes: 'Three stable tiers use 0.0048, 0.0041 and 0.0033 with 0.18 variation.' },
  ].filter((feature) => ({
    blockout: ['radio-silhouette'], 'structural-pass': ['radio-identity'], 'form-refinement': ['radio-silhouette'],
    'material-pass': ['radio-identity'], 'lighting-pass': ['radio-ink'], 'interaction-pass': ['radio-runtime'], 'optimization-pass': ['radio-runtime'],
  })[passId].includes(feature.id)),
  aiVisionNotes: 'Four static views plus startup, climax and wind-down were inspected. The antenna remains attached to its hinge and speaker waves emit only from the frozen front socket.',
  visualEvidence: { referenceScreenshot: 'references/intake-v2/radio/views/three-quarter.png', renderScreenshot: 'artifacts/appliance-v2/radio/evidence/models/radio/render-off-three-quarter.png', comparisonImage: 'artifacts/appliance-v2/radio/review/radio-reference-v2-four-view-comparison.png', cameraView: 'four static and three runtime views', notes: 'Completed procedural geometry is reused as staged evidence.', aiVisionNotes: 'Existing references are conditional fallback and are not claimed as GPT Image 2 output.' },
  reviewViewpoints: ['front', 'side', 'back', 'three-quarter', 'runtime-startup', 'runtime-climax', 'runtime-wind-down'],
  evidenceReuseNote: 'The completed procedural geometry is reused across staged reviews; no claim is made that seven separate intermediate meshes were captured.',
}));
fs.writeFileSync(path, `${JSON.stringify(spec, null, 2)}\n`);
for (const review of spec.reviewHistory) {
  const dir = `artifacts/appliance-v2/radio/reviews/${review.passId}`;
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(`${dir}/layer-scores.json`, `${JSON.stringify(review.layerScores, null, 2)}\n`);
  fs.writeFileSync(`${dir}/feature-reviews.json`, `${JSON.stringify(review.featureReviews, null, 2)}\n`);
  fs.writeFileSync(`${dir}/review-viewpoints.json`, `${JSON.stringify(review.reviewViewpoints, null, 2)}\n`);
}

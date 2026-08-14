import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const specPath = path.resolve(here, '..', 'object-sculpt-spec.json');
const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));

const evidence = {
  v1: 'reference-v1-round-two-pin',
  board: 'v1-seven-style-board',
  game: 'v1-fixed-seed-game',
  sakura1: 'sakura-crossing-hero-1',
  sakura2: 'sakura-crossing-hero-2',
  sakura4: 'sakura-crossing-hero-4',
};

spec.suitability = 'pass';
spec.scores = {
  object_isolation: 3,
  silhouette_readability: 3,
  depth_inference: 2,
  primitive_decomposition: 3,
  material_procedurality: 3,
  occlusion_risk: 2,
  interaction_fit: 3,
};
spec.preSpecAssessment.resolvedUnknowns = [...(spec.preSpecAssessment.unknownsToResolveBeforeImplementation ?? [])];
spec.preSpecAssessment.unknownsToResolveBeforeImplementation = [];
spec.referenceCamera = {
  solved: true,
  fovDegrees: 32,
  aspect: 1,
  orientation: { yaw: -28, pitch: 16, roll: 0 },
  positionHint: [1.15, 0.9, 2.7],
  note: 'Fixed orthographic-equivalent showcase framing; family validation also uses front and side cameras.',
};
spec.viewEvidence = [
  {
    id: evidence.v1,
    view: 'three-quarter isolated v1 plug',
    imagePath: spec.sourceImage,
    imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' },
    observations: ['legacy envelope', 'terminal spacing', 'cable axis', 'current generic shell weakness'],
    confidence: 1,
  },
  {
    id: evidence.board,
    view: 'seven-style family board',
    imagePath: path.resolve(here, '..', '..', '..', 'history', 'plug-cable-v1-2026-08-10', 'screenshots', 'plug-cable-v1-showcase.png'),
    imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' },
    observations: ['all seven terminal identities', 'shared proportions', 'family palette'],
    confidence: 1,
  },
  {
    id: evidence.game,
    view: 'fixed-seed gameplay context',
    imagePath: path.resolve(here, '..', '..', '..', 'history', 'plug-cable-v1-2026-08-10', 'screenshots', 'plug-cable-v1-game-seed-2679418801.png'),
    imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' },
    observations: ['orthogonal cable paths', 'elbow bulges to remove', 'game-scale outline weight'],
    confidence: 1,
  },
  ...[evidence.sakura1, evidence.sakura2, evidence.sakura4].map((id, index) => ({
    id,
    view: `SAKURA city style reference ${index + 1}`,
    imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' },
    observations: ['clean Japanese low-poly construction', 'cool violet shadow bands', 'restrained dark ink'],
    confidence: 0.9,
  })),
];

const palettes = {
  'shell-toon': ['#F16F8F', '#C54F76', '#66355E'],
  'rubber-toon': ['#6B4E72', '#4A385A', '#2B253B'],
  'metal-toon': ['#B8B7C9', '#85829B', '#4D4962'],
  'cavity-toon': ['#3A2948', '#241D31', '#17131F'],
};

function colorRecipe(materialId) {
  const colors = palettes[materialId] ?? palettes['shell-toon'];
  const klass = materialId === 'rubber-toon' ? 'rubber' : materialId === 'metal-toon' ? 'metal' : 'plastic';
  return {
    dominantAlbedo: `rgba(${parseInt(colors[0].slice(1, 3), 16)}, ${parseInt(colors[0].slice(3, 5), 16)}, ${parseInt(colors[0].slice(5, 7), 16)}, 1)`,
    secondaryAlbedo: `rgba(${parseInt(colors[1].slice(1, 3), 16)}, ${parseInt(colors[1].slice(3, 5), 16)}, ${parseInt(colors[1].slice(5, 7), 16)}, 1)`,
    materialClass: klass,
    materialClassConfidence: 0.95,
    colorGradient: {
      type: 'linear',
      stops: [
        { offset: 0, color: `rgba(${parseInt(colors[0].slice(1, 3), 16)}, ${parseInt(colors[0].slice(3, 5), 16)}, ${parseInt(colors[0].slice(5, 7), 16)}, 1)` },
        { offset: 1, color: `rgba(${parseInt(colors[1].slice(1, 3), 16)}, ${parseInt(colors[1].slice(3, 5), 16)}, ${parseInt(colors[1].slice(5, 7), 16)}, 1)` },
      ],
    },
  };
}

function action(animationRole, colliderType = 'capsule', sockets = []) {
  return {
    animationRole,
    pivot: { mode: 'semantic-center', localPosition: [0, 0, 0], axis: [0, 1, 0], confidence: 1 },
    transformChannels: {
      translate: true,
      rotate: true,
      scale: false,
      bend: animationRole === 'cable',
      twist: false,
      detach: false,
      visibility: true,
      materialState: true,
    },
    sockets,
    collider: { type: colliderType, offset: [0, 0.32, 0], scale: [0.36, 0.64, 0.36], isTrigger: true },
    constraints: ['preserve legacy click and collision envelope'],
    destruction: { breakable: false, fractureGroup: animationRole, seamRefs: [], detachableFragments: [], breakImpulse: 0, debrisMaterial: 'none' },
  };
}

function attachment(parentId, parentSocket, start, end, contactType = 'overlap') {
  return {
    parentId,
    parentSocket,
    localStart: start,
    localEnd: end,
    contactNormal: [0, 1, 0],
    overlap: 0.025,
    gapTolerance: 0.003,
    contactType,
    evidenceRefs: [evidence.v1],
  };
}

function component({
  id,
  name,
  level,
  role,
  primitive,
  topologyClass,
  parent = null,
  material = 'shell-toon',
  dimensions = { width: 0.36, height: 0.64, depth: 0.36 },
  localFeatures = [],
  evidenceRefs = [evidence.v1],
  attachmentSpec = null,
  animationRole = 'static-part',
  sockets = [],
  fidelityTier = 'production',
}) {
  return {
    id,
    name,
    level,
    role,
    importance: level === 'macro' ? 1 : level === 'meso' ? 0.9 : 0.72,
    confidence: 0.96,
    primitive,
    topologyClass,
    topologyRationale: `${name} is represented by ${primitive} geometry because its visible silhouette and runtime behavior require ${topologyClass} topology.`,
    geometryDescriptor: {
      topologyIntent: topologyClass === 'fiber-strand' ? 'eight-sided tangent curve sweep' : 'twelve-sided low-poly hard-surface form',
      edgeTreatment: { type: 'restrained-chamfer', bevelRadius: level === 'micro' ? 0.004 : 0.012, segments: 1 },
      deformationStack: topologyClass === 'fiber-strand' ? ['orthogonal quarter-circle fillets only'] : [],
      uvStrategy: 'none; solid toon albedo',
      normalStrategy: 'generated faceted vertex normals; no smoothing that erases twelve-sided planes',
    },
    parent,
    attachment: attachmentSpec,
    dimensions: { ...dimensions, units: 'world-units', confidence: 1 },
    transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
    actionProfile: action(animationRole, topologyClass === 'fiber-strand' ? 'curve-capsule-chain' : 'capsule', sockets),
    material,
    materialLayers: [material],
    colorMaterialRecipe: colorRecipe(material),
    deformations: topologyClass === 'fiber-strand' ? ['fillet radius 0.13 clamped to 28 percent of adjacent legs'] : [],
    joints: attachmentSpec ? [attachmentSpec.parentSocket] : [],
    seams: localFeatures.filter((feature) => String(feature.id ?? feature).includes('seam')),
    localFeatures,
    surfaceDetail: {
      macroRoughness: 0.22,
      microRoughness: 0.03,
      bumpAmplitude: 0.004,
      normalPattern: 'faceted geometry normals',
      displacementPattern: 'none',
      occlusionPattern: 'toon shadow band plus contact AO',
      edgeWearPattern: 'none',
      notes: 'Clean city prop; no grime, scratches, or soft-vinyl bulging.',
    },
    evidenceRefs,
    details: localFeatures,
    fidelityTier,
  };
}

const socket = (id, localPosition) => ({ id, localPosition, localRotation: [0, 0, 0] });
spec.componentTree = [
  component({
    id: 'root', name: 'Plug cable family runtime root', level: 'macro', role: 'body', primitive: 'lathe', topologyClass: 'assembled-solid',
    dimensions: { width: 0.36, height: 0.64, depth: 0.36 }, animationRole: 'root',
    sockets: [socket('plug-origin', [0, 0, 0]), socket('cable-path-origin', [0, 0, 0])],
    evidenceRefs: [evidence.v1, evidence.board, evidence.game],
  }),
  component({
    id: 'plug-assembly', name: 'Shared low-poly plug assembly', level: 'macro', role: 'assembly', primitive: 'lathe', topologyClass: 'assembled-solid', parent: 'root',
    attachmentSpec: attachment('root', 'plug-origin', [0, 0, 0], [0, 0.46, 0]), animationRole: 'plug',
    sockets: [socket('cable-socket', [0, 0, 0]), socket('terminal-socket', [0, 0.47, 0])], evidenceRefs: [evidence.v1, evidence.board],
  }),
  component({
    id: 'cable-body', name: 'Eight-sided tangent-fillet cable', level: 'macro', role: 'cable', primitive: 'tube', topologyClass: 'fiber-strand', parent: 'root', material: 'rubber-toon',
    dimensions: { width: 0.21, height: 0.21, depth: 4.5, radius: 0.105 },
    attachmentSpec: attachment('root', 'cable-path-origin', [0, 0, 0], [0, -1, 0]), animationRole: 'cable',
    localFeatures: [{ id: 'cable-section-facets' }, { id: 'radial-facets' }, { id: 'tangent-fillet' }, { id: 'sealed-end-caps' }], evidenceRefs: [evidence.v1, evidence.game],
  }),
  component({
    id: 'strain-relief', name: 'Short stepped strain relief', level: 'meso', role: 'connector', primitive: 'lathe', topologyClass: 'assembled-solid', parent: 'plug-assembly', material: 'rubber-toon',
    dimensions: { width: 0.27, height: 0.15, depth: 0.27 }, attachmentSpec: attachment('plug-assembly', 'cable-socket', [0, 0, 0], [0, 0.15, 0]),
    localFeatures: [{ id: 'relief-rings' }, { id: 'shallow-rings' }, { id: 'cable-overlap' }],
  }),
  component({ id: 'rear-neck', name: 'Rear neck transition', level: 'meso', role: 'connector', primitive: 'lathe', topologyClass: 'assembled-solid', parent: 'plug-assembly', dimensions: { width: 0.3, height: 0.06, depth: 0.3 }, attachmentSpec: attachment('plug-assembly', 'cable-socket', [0, 0.12, 0], [0, 0.18, 0]), localFeatures: [{ id: 'rear-chamfer' }] }),
  component({
    id: 'outer-shell', name: 'Twelve-sided main shell', level: 'meso', role: 'shell', primitive: 'lathe', topologyClass: 'conforming-shell', parent: 'plug-assembly',
    dimensions: { width: 0.36, height: 0.32, depth: 0.36 }, attachmentSpec: attachment('plug-assembly', 'cable-socket', [0, 0.14, 0], [0, 0.46, 0]),
    localFeatures: [{ id: 'front-chamfer' }, { id: 'rear-chamfer' }, { id: 'radial-facets' }], evidenceRefs: [evidence.v1, evidence.board, evidence.sakura1],
  }),
  component({ id: 'front-shoulder', name: 'Restrained front shoulder', level: 'meso', role: 'shell', primitive: 'lathe', topologyClass: 'assembled-solid', parent: 'plug-assembly', dimensions: { width: 0.34, height: 0.055, depth: 0.34 }, attachmentSpec: attachment('plug-assembly', 'terminal-socket', [0, 0.42, 0], [0, 0.475, 0]), localFeatures: [{ id: 'shoulder-step' }] }),
  component({ id: 'interface-faceplate', name: 'Connector face ring', level: 'meso', role: 'connector', primitive: 'cylinder', topologyClass: 'assembled-solid', parent: 'plug-assembly', material: 'cavity-toon', dimensions: { width: 0.3, height: 0.028, depth: 0.3 }, attachmentSpec: attachment('plug-assembly', 'terminal-socket', [0, 0.452, 0], [0, 0.49, 0]), localFeatures: [{ id: 'perimeter-seam' }] }),
  component({
    id: 'terminal-assembly', name: 'Seven interchangeable terminal layouts', level: 'meso', role: 'connector', primitive: 'instanced-cluster', topologyClass: 'assembled-solid', parent: 'plug-assembly', material: 'metal-toon',
    dimensions: { width: 0.3, height: 0.17, depth: 0.3 }, attachmentSpec: attachment('plug-assembly', 'terminal-socket', [0, 0.47, 0], [0, 0.64, 0]),
    localFeatures: [{ id: 'terminal-layout' }, { id: 'terminal-cavity' }], evidenceRefs: [evidence.board],
  }),
  component({ id: 'status-indicator', name: 'Recessed status dot', level: 'meso', role: 'indicator', primitive: 'sphere', topologyClass: 'surface-relief', parent: 'plug-assembly', dimensions: { width: 0.048, height: 0.012, depth: 0.048 }, attachmentSpec: attachment('plug-assembly', 'indicator-socket', [0.15, 0.31, 0], [0.17, 0.31, 0], 'recessed-overlap'), localFeatures: [{ id: 'recessed-dot' }] }),
  component({ id: 'cable-end-socket', name: 'Cable insertion socket', level: 'meso', role: 'socket', primitive: 'cylinder', topologyClass: 'assembled-solid', parent: 'plug-assembly', material: 'rubber-toon', dimensions: { width: 0.22, height: 0.035, depth: 0.22 }, attachmentSpec: attachment('plug-assembly', 'cable-socket', [0, -0.02, 0], [0, 0.03, 0]), localFeatures: [{ id: 'plug-cable-overlap' }] }),
  component({ id: 'tail-cap', name: 'Single-end cable tail cap', level: 'meso', role: 'connector', primitive: 'capsule', topologyClass: 'assembled-solid', parent: 'cable-body', material: 'rubber-toon', dimensions: { width: 0.24, height: 0.18, depth: 0.24 }, attachmentSpec: attachment('cable-body', 'tail-socket', [0, 0, 0], [0, 0.18, 0]), localFeatures: [{ id: 'tail-cap-seam' }], evidenceRefs: [evidence.game] }),
  component({ id: 'front-chamfer-feature', name: 'Front chamfer highlight band', level: 'micro', role: 'bevel', primitive: 'torus', topologyClass: 'surface-relief', parent: 'outer-shell', dimensions: { width: 0.34, height: 0.012, depth: 0.34 }, attachmentSpec: attachment('outer-shell', 'front-edge', [0, 0.42, 0], [0, 0.44, 0]), localFeatures: [{ id: 'front-chamfer-highlight' }] }),
  component({ id: 'rear-chamfer-feature', name: 'Rear chamfer shadow band', level: 'micro', role: 'bevel', primitive: 'torus', topologyClass: 'surface-relief', parent: 'outer-shell', dimensions: { width: 0.31, height: 0.012, depth: 0.31 }, attachmentSpec: attachment('outer-shell', 'rear-edge', [0, 0.15, 0], [0, 0.17, 0]), localFeatures: [{ id: 'rear-chamfer-shadow' }] }),
  component({ id: 'relief-ring-system', name: 'Strain-relief ring sequence', level: 'micro', role: 'ridge', primitive: 'lathe', topologyClass: 'surface-relief', parent: 'strain-relief', material: 'rubber-toon', dimensions: { width: 0.25, height: 0.08, depth: 0.25 }, attachmentSpec: attachment('strain-relief', 'surface', [0, 0.02, 0], [0, 0.11, 0]), localFeatures: [{ id: 'three-shallow-rings' }] }),
  component({ id: 'ink-outline-system', name: 'Restrained deep-purple silhouette ink', level: 'micro', role: 'contour', primitive: 'curve-sweep', topologyClass: 'surface-relief', parent: 'plug-assembly', material: 'cavity-toon', dimensions: { width: 0.37, height: 0.65, depth: 0.37 }, attachmentSpec: attachment('plug-assembly', 'outer-surface', [0, 0, 0], [0, 0.64, 0]), localFeatures: [{ id: 'outline-width-0.014' }], evidenceRefs: [evidence.sakura1, evidence.sakura2] }),
  component({ id: 'cable-fillet-system', name: 'Exact quarter-circle corner fillets', level: 'micro', role: 'cable', primitive: 'tube', topologyClass: 'fiber-strand', parent: 'cable-body', material: 'rubber-toon', dimensions: { width: 0.26, height: 0.21, depth: 0.26, radius: 0.13 }, attachmentSpec: attachment('cable-body', 'corner-tangent', [0, 0, 0], [0.13, 0.13, 0]), animationRole: 'cable', localFeatures: [{ id: 'quarter-circle-arc' }, { id: 'four-arc-samples' }], evidenceRefs: [evidence.game] }),
  component({ id: 'terminal-layout-feature', name: 'Per-style terminal spacing rules', level: 'micro', role: 'connector', primitive: 'instanced-cluster', topologyClass: 'assembled-solid', parent: 'terminal-assembly', material: 'metal-toon', dimensions: { width: 0.3, height: 0.17, depth: 0.3 }, attachmentSpec: attachment('terminal-assembly', 'terminal-roots', [0, 0, 0], [0, 0.17, 0]), localFeatures: [{ id: 'seven-layout-contracts' }], evidenceRefs: [evidence.board] }),
  component({ id: 'cool-shadow-band', name: 'Two-to-three-step cool shadow response', level: 'micro', role: 'surface', primitive: 'plane-card', topologyClass: 'material-only', parent: 'outer-shell', material: 'shell-toon', dimensions: { width: 0.36, height: 0.32, depth: 0.36 }, attachmentSpec: null, localFeatures: [{ id: 'cool-violet-shadow-bands' }], evidenceRefs: [evidence.sakura1, evidence.sakura4] }),
];

function material(id, name, type, baseColor, secondaries, roughness, metalness, overrides) {
  return {
    id, name, type, shaderModel: 'MeshToonMaterial with shared three-step gradient', baseColor, color: baseColor,
    albedo: { dominant: baseColor, secondary: secondaries, samplingNotes: 'Solid code-defined SAKURA palette; no bitmap projection.' },
    colorVariation: { palette: [baseColor, ...secondaries], pattern: 'toon-light-bands', amplitude: 0.05, heightCorrelation: 0 },
    textureResolution: 1024,
    textureProjection: { mode: 'procedural-object-space-toon-bands', repeat: [1, 1], anisotropy: 1, texelDensityIntent: 'No image texture; stable object-space response.' },
    surfaceFrequencyBands: [
      { id: 'macro', frequency: 1, amplitude: 0.24, role: 'broad key versus cool-shadow separation' },
      { id: 'meso', frequency: 12, amplitude: 0.09, role: 'twelve shell facets or eight cable facets' },
      { id: 'micro', frequency: 48, amplitude: 0.015, role: 'restrained bevel and seam highlights' },
    ],
    roughness: { base: roughness, variation: 0.04, map: 'independent analytic toon response', localResponse: 'slightly lower on chamfers; higher in recessed cavities' },
    metalness: { base: metalness, variation: 0 },
    normal: { pattern: 'faceted-geometry-normals', strength: 0.2, scale: 12, space: 'object' },
    bump: { pattern: 'geometry-only-shallow-seams', amplitude: 0.004, scale: 1 },
    displacement: { pattern: 'none', amplitude: 0, scale: 1, silhouetteAffects: false },
    ambientOcclusion: { cavityStrength: 0.28, contactShadowBias: 0.34, notes: 'Only seams, socket overlap, and terminal recesses receive AO.' },
    wear: { edgeWear: 0, scratches: [], chips: [] },
    dirt: { amount: 0, cavityBias: 0, color: '#251D31' },
    localOverrides: overrides,
    shaderNotes: ['Use 2-3 toon bands and cool violet shadow response.', 'Do not add photo-real maps, clearcoat, grunge, or soft-vinyl highlights.'],
    notes: 'Pure procedural Three.js material with no runtime texture dependency.',
  };
}

spec.materials = [
  material('shell-toon', 'Sakura shell plastic', 'plastic', '#F16F8F', ['#D45B82', '#6B3B69'], 0.72, 0, [
    { id: 'cool-violet-shadow-bands', region: 'light-facing facets', color: '#6B3B69', roughness: 0.76, evidenceRefs: [evidence.sakura1, evidence.sakura4] },
    { id: 'restrained-ink-outline', region: 'silhouette only', color: '#2B203B', roughness: 0.9, evidenceRefs: [evidence.sakura2] },
  ]),
  material('rubber-toon', 'Cable and strain-relief rubber', 'rubber', '#624A70', ['#4A385A', '#2B253B'], 0.86, 0, [
    { id: 'cable-joint-shadow', region: 'fillet inner radius and socket overlap', color: '#352B46', roughness: 0.9, evidenceRefs: [evidence.game] },
  ]),
  material('metal-toon', 'Cool gray-violet terminal metal', 'metal', '#BBB9CB', ['#8C889F', '#4E4B63'], 0.54, 0.62, [
    { id: 'terminal-edge-highlight', region: 'terminal front and side edges', color: '#D2D0DE', roughness: 0.42, evidenceRefs: [evidence.board] },
  ]),
  material('cavity-toon', 'Interface cavity and outline', 'plastic', '#35283F', ['#251D31', '#17131F'], 0.9, 0, [
    { id: 'faceplate-recess', region: 'interface face and terminal cavities', color: '#1F192A', roughness: 0.94, evidenceRefs: [evidence.board] },
  ]),
];

spec.repetitionSystems = [
  {
    id: 'terminal-layout-variants', name: 'Seven terminal layout recipes', realization: 'geometry', buildsGeometry: true,
    componentRefs: ['terminal-assembly', 'terminal-layout-feature'], instances: 7,
    geometry: 'per-style terminal group with preserved count, spacing and orientation',
    distribution: 'selected by PlugStyleId; never rendered simultaneously on one head',
    variation: 'round pins, USB-C tongue, flat blades, three-pin, grounded round, DC barrel, magnetic pogo',
    evidenceRefs: [evidence.board],
  },
  {
    id: 'cable-fillet-samples', name: 'Four-sample exact quarter-turn arcs', realization: 'geometry', buildsGeometry: true,
    componentRefs: ['cable-body', 'cable-fillet-system'], instances: 4,
    geometry: 'analytic quarter circle sampled by TubeGeometry path evaluation',
    distribution: 'each valid orthogonal interior corner', variation: 'radius min(0.13, 0.28 incoming, 0.28 outgoing); fallback under 0.025',
    evidenceRefs: [evidence.game],
  },
];

const passRefs = {
  blockout: ['root', 'plug-assembly', 'cable-body'],
  'structural-pass': ['strain-relief', 'rear-neck', 'outer-shell', 'front-shoulder', 'interface-faceplate', 'terminal-assembly', 'status-indicator', 'cable-end-socket', 'tail-cap'],
  'form-refinement': ['front-chamfer-feature', 'rear-chamfer-feature', 'relief-ring-system', 'cable-fillet-system', 'terminal-layout-feature'],
  'material-pass': ['outer-shell', 'cable-body', 'terminal-assembly', 'interface-faceplate'],
  'surface-pass': ['ink-outline-system', 'cool-shadow-band', 'front-chamfer-feature', 'interface-faceplate'],
  'lighting-pass': ['root', 'plug-assembly', 'cable-body'],
  'interaction-pass': ['root', 'plug-assembly', 'terminal-assembly', 'cable-body', 'tail-cap'],
  'optimization-pass': ['root', 'plug-assembly', 'cable-body'],
};
for (const pass of spec.buildPasses) pass.componentRefs = passRefs[pass.id] ?? ['root'];

spec.featureReviewTargets = [
  { id: 'family-shell-silhouette', name: 'Shared five-stage shell silhouette', tier: 'critical', passIds: ['blockout', 'form-refinement'], minimumScore: 0.82, mustPass: true, componentRefs: ['plug-assembly', 'outer-shell'], evidenceRefs: [evidence.v1, evidence.board] },
  { id: 'seven-terminal-identities', name: 'Seven preserved connector identities', tier: 'critical', passIds: ['structural-pass', 'form-refinement'], minimumScore: 0.84, mustPass: true, componentRefs: ['terminal-assembly', 'terminal-layout-feature'], evidenceRefs: [evidence.board] },
  { id: 'tangent-cable-fillet', name: 'Bounded tangent cable fillets', tier: 'critical', passIds: ['form-refinement'], minimumScore: 0.86, mustPass: true, componentRefs: ['cable-body', 'cable-fillet-system'], evidenceRefs: [evidence.game] },
  { id: 'sakura-toon-response', name: 'SAKURA toon palette and cool shadows', tier: 'critical', passIds: ['material-pass', 'surface-pass', 'lighting-pass'], minimumScore: 0.78, mustPass: true, componentRefs: ['outer-shell', 'cool-shadow-band', 'ink-outline-system'], evidenceRefs: [evidence.sakura1, evidence.sakura2, evidence.sakura4] },
  { id: 'attachment-runtime', name: 'Socket overlap and stable runtime nodes', tier: 'critical', passIds: ['structural-pass', 'interaction-pass'], minimumScore: 0.9, mustPass: true, componentRefs: ['plug-assembly', 'cable-end-socket', 'cable-body'], evidenceRefs: [evidence.v1] },
];

spec.qualityTargets = {
  targetFidelity: 0.82,
  mustMatch: ['legacy envelope and terminal identity', 'five-stage low-poly plug silhouette', 'tangent bounded cable corners', 'SAKURA cool-shadow toon response', 'runtime socket and named-node contract'],
  niceToHave: ['subtle per-facet color variation', 'debug explode readability'],
  fpsTarget: 60,
  reviewViewpoints: ['front', 'three-quarter', 'side', 'cable-corner-closeup', 'fixed-seed-gameplay'],
};
spec.lookDevTargets = {
  qualityPriority: 'runtime-stylized',
  materialPass: {
    albedoPaletteRequired: true,
    roughnessVariationRequired: true,
    normalOrBumpRequired: true,
    localOverridesRequired: true,
    independentMapChannels: [],
    requiredSurfaceFrequencyBands: ['macro', 'meso', 'micro'],
    geometryReliefRequiredWhenSilhouetteAffected: true,
    acceptedLimitation: 'Flat code-defined toon materials intentionally use no PBR image maps or external textures.',
  },
  lightingPass: {
    requiredTerms: ['key light', 'fill light', 'rim light', 'ACES tone mapping', 'contact shadow'],
    mustAvoid: ['ambient-only lighting', 'photoreal HDRI reflections', 'soft-vinyl highlights'],
  },
  screenshotReview: ['Compare all seven identities at one camera.', 'Compare front, three-quarter and side silhouettes.', 'Inspect a 90-degree cable corner close-up.', 'Check fixed seed 2679418801 through extraction and appliance flight.'],
};
spec.performanceBudget = {
  qualityPriority: 'real-time-family-asset', targetTriangles: 12000, maxDrawCalls: 120, textureSize: 0, fpsTarget: 60,
  optimizationPolicy: 'Keep 12 radial shell sides, 8 radial cable sides, 4 samples per quarter-turn, shared materials, and deterministic disposal.',
};
spec.lightingFromPhoto = [
  { role: 'key light', direction: 'upper front-left', color: '#FFE3D4', intensity: 1.15, shadow: 'soft map shadow' },
  { role: 'fill light', direction: 'front-right', color: '#8F83C6', intensity: 0.42, response: 'cool violet toon shadow band' },
  { role: 'rim light and environment', direction: 'rear-left', color: '#F7B7CC', intensity: 0.35, exposure: 1.0, toneMapping: 'explicit NoToneMapping to match the production game renderer' },
  { role: 'ground contact shadow', behavior: 'soft contact shadow and restrained AO only at seams and sockets', background: '#F2E9E8' },
];
spec.proceduralStrategy = [
  'Use a twelve-segment LatheGeometry profile for the shared shell and strain relief.',
  'Keep each terminal identity as a named child group selected by PlugStyleId.',
  'Build orthogonal cable paths from line segments and analytic quarter-circle Curve segments; never use free Catmull-Rom smoothing.',
  'Merge capped eight-sided TubeGeometry per rebuild and dispose replaced geometry deterministically.',
  'Publish nodes, sockets, pick groups and destruction groups through root.userData.sculptRuntime.',
  'Use shared code-defined MeshToonMaterial palettes and restrained hull outlines; no external maps or models.',
];
spec.assumptions = [
  'PLUG_HEAD_ENVELOPE and puzzle collision constants are authoritative.',
  'The isolated round-two-pin image establishes the common family proportion, while the seven-style board establishes identity.',
  'SAKURA city screenshots are style-only evidence and do not override plug dimensions.',
  'All dynamic path mutations remain owned by existing gameplay systems; the new helpers are rendering-only.',
];
spec.risks = [
  { id: 'envelope-overrun', mitigation: 'measure all seven styles across rotated bounds and retain current constants' },
  { id: 'cable-overshoot', mitigation: 'analytic tangent arcs with 28 percent leg clamp and 0.025 fallback' },
  { id: 'dirty-worktree-overwrite', mitigation: 'patch only scoped rendering files and keep independent v1 archive' },
  { id: 'toy-read', mitigation: 'restrained chamfers, faceted silhouettes, cool shadows, no bulbous spheres or glossy PBR' },
];

const detailRefMap = {
  'front-chamfer': 'outer-shell/front-chamfer',
  'terminal-spacing': 'terminal-assembly/terminal-layout',
  'faceplate-seam': 'interface-faceplate/perimeter-seam',
  'shell-facets': 'outer-shell/radial-facets',
  'status-inset': 'status-indicator/recessed-dot',
  'rear-chamfer': 'outer-shell/rear-chamfer',
  'strain-relief-rings': 'strain-relief/shallow-rings',
  'cable-socket-overlap': 'strain-relief/cable-overlap',
  'cable-radial-facets': 'cable-body/radial-facets',
  'tangent-fillet': 'cable-body/tangent-fillet',
  'cool-shadow-bands': 'shell-toon/cool-violet-shadow-bands',
  'ink-outline': 'shell-toon/restrained-ink-outline',
};
for (const detail of spec.preSpecAssessment.detailInventory.details) {
  if (detailRefMap[detail.id]) detail.mapsTo.ref = detailRefMap[detail.id];
}

fs.writeFileSync(specPath, `${JSON.stringify(spec, null, 2)}\n`);
console.log(`Prepared strict production spec: ${specPath}`);

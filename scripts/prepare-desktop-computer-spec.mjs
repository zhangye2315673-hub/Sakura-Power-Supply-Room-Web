import fs from 'node:fs';

const path = 'docs/sculpt-specs/desktop-computer/object-sculpt-spec.json';
const s = JSON.parse(fs.readFileSync(path, 'utf8'));
s.targetId = 'desktop-computer';
s.referenceCamera = {
  solved: false,
  fovDegrees: 32,
  aspect: 557 / 941,
  orientation: { yaw: 0, pitch: 0, roll: 0 },
  positionHint: [0, 3.2, 12],
  note: 'Three orthographic-like turn-sheet views constrain exterior proportions. Perspective is weak; hidden electronics and hinge internals remain inferred.',
};
s.suitability = 'pass';
s.preSpecAssessment.unknownsToResolveBeforeImplementation = [];
s.scores = {
  object_isolation: 3,
  silhouette_readability: 3,
  depth_inference: 3,
  primitive_decomposition: 3,
  material_procedurality: 3,
  occlusion_risk: 2,
  interaction_fit: 3,
};
s.qualityTargets = {
  targetFidelity: 0.84,
  mustMatch: [
    'five-piece workstation silhouette and reference proportions',
    'monitor bezel, screen, rear mount and leaning two-stage stand',
    'tower top cap, front I/O, side/rear vents and rear power inlet',
    'independent two-tone keyboard key matrix and arched two-shell mouse',
    'computer-specific boot, desktop, cursor, keypress and cooling powered state',
  ],
  niceToHave: ['subtle plastic roughness variation', 'secondary rear-port silhouettes'],
  fpsTarget: 60,
  reviewViewpoints: ['front', 'side', 'back', 'three-quarter', 'top', 'three-quarter-powered'],
};
s.coordinateFrame = {
  front: '+Z faces the user and front turn-sheet',
  up: '+Y',
  right: '+X',
  scaleReference: 'monitor screen width = 5.45 world units',
};
s.silhouette = {
  boundingShape: 'wide horizontal workstation: monitor left, tower right, keyboard and mouse forward',
  aspectRatios: ['monitor outer width:height = 1.63:1', 'tower width:height = 0.56:1', 'keyboard width:depth = 4.1:1'],
  symmetry: 'each device is approximately bilateral; the workstation layout is asymmetric',
  dominantCurves: ['rounded display corners', 'tower vertical corner radii', 'mouse continuous arch', 'keyboard rounded front lip'],
  negativeSpaces: ['gap between monitor and tower', 'clearance beneath monitor', 'spacing between keyboard and mouse', 'keycap grid gaps'],
  landmarks: ['monitor top at y=5.65', 'tower top at y=5.42', 'keyboard front at z=2.65', 'monitor/tower baseline near y=0.25'],
};
s.viewEvidence = [
  { id: 'front-full', view: 'front', imageRegion: { x: 0, y: 0.25, width: 1, height: 0.48, units: 'normalized' }, observations: ['five-piece layout', 'monitor bezel/screen', 'tower front I/O', 'two-tone keyboard', 'mouse top'], confidence: 0.99 },
  { id: 'side-full', view: 'side', imageRegion: { x: 0.1, y: 0.25, width: 0.8, height: 0.48, units: 'normalized' }, observations: ['monitor thickness and stand lean', 'tower depth and side seam/vents', 'keyboard wedge', 'mouse arch'], confidence: 0.98 },
  { id: 'back-full', view: 'back', imageRegion: { x: 0, y: 0.29, width: 1, height: 0.4, units: 'normalized' }, observations: ['monitor back, emblem and mount', 'tower rear vent and I/O panels', 'IEC-like inlet'], confidence: 0.98 },
  { id: 'front-monitor', view: 'front', imageRegion: { x: 0.05, y: 0.27, width: 0.63, height: 0.3, units: 'normalized' }, observations: ['rounded cream bezel', 'recessed dark screen', 'pink stand'], confidence: 0.99 },
  { id: 'back-tower', view: 'back', imageRegion: { x: 0.63, y: 0.32, width: 0.37, height: 0.34, units: 'normalized' }, observations: ['two vent arrays', 'I/O sockets', 'power inlet', 'feet'], confidence: 0.98 },
];

const detailsByRef = new Map();
for (const d of s.preSpecAssessment.detailInventory.details) {
  const ref = d.mapsTo?.ref;
  if (ref) {
    const items = detailsByRef.get(ref) ?? [];
    items.push({ id: d.id, kind: d.kind, evidenceRefs: [d.evidenceRef] });
    detailsByRef.set(ref, items);
  }
}

const evidence = ['front-full', 'side-full', 'back-full'];
const component = ({ id, name, level, parent, primitive = 'box', topologyClass = 'assembled-solid', topologyRationale = 'Independent rigid hard-surface part.', material = 'cream-shell', role = 'part', importance = 0.86, confidence = 0.95, dimensions = [1, 1, 1], position = [0, 0, 0], pivot = null, evidenceRefs = evidence }) => {
  const mapped = detailsByRef.get(id) ?? [];
  const localFeatures = mapped.length ? mapped.map((d) => d.id) : [`${id}.silhouette`, `${id}.bevel`, `${id}.material-zone`];
  const detailEntries = mapped.length ? mapped : localFeatures.map((fid) => ({ id: fid, kind: 'contour', evidenceRefs }));
  const c = {
    id, name, level, role, importance, confidence, primitive, topologyClass, topologyRationale,
    geometryDescriptor: {
      topologyIntent: topologyClass === 'surface-relief' ? 'small independent relief riding parent shell' : 'rounded hard-surface procedural solid',
      edgeTreatment: { type: 'rounded bevel', bevelRadius: level === 'micro' ? 0.02 : 0.08, segments: level === 'micro' ? 2 : 4 },
      deformationStack: [], uvStrategy: 'generated procedural coordinates', normalStrategy: 'vertex normals',
    },
    parent,
    dimensions: { width: dimensions[0], height: dimensions[1], depth: dimensions[2], units: 'world', confidence },
    transform: { position, rotation: [0, 0, 0], scale: [1, 1, 1] },
    actionProfile: pivot ? { animationRole: pivot.role, pivot: { mode: pivot.mode, localPosition: pivot.position, axis: pivot.axis, confidence } } : { animationRole: 'static-part' },
    material, materialLayers: [material], deformations: [], joints: [], seams: [], localFeatures,
    surfaceDetail: { macroRoughness: 0.04, microRoughness: 0.07, bumpAmplitude: 0.01, normalPattern: 'subtle molded plastic', displacementPattern: '', occlusionPattern: 'contact seams', edgeWearPattern: '', notes: 'Real bevels provide the dominant toon highlight.' },
    colorMaterialRecipe: { dominantAlbedo: material === 'pink-shell' ? 'rgba(239,169,177,1)' : material === 'screen-glass' ? 'rgba(57,56,62,1)' : 'rgba(248,235,213,1)', secondaryAlbedo: 'rgba(215,181,170,1)', materialClass: material.includes('screen') ? 'glass' : 'plastic', materialClassConfidence: confidence },
    evidenceRefs, details: detailEntries, fidelityTier: 'form-refinement',
  };
  if (parent) c.attachment = { parentId: parent, parentSocket: `${parent}-socket`, localStart: position, localEnd: [position[0], position[1] + 0.03, position[2]], contactType: 'overlap', embedDepth: 0.02, overlap: 0.03, gapTolerance: 0.01, evidenceRefs };
  return c;
};

s.componentTree = [
  component({ id: 'root', name: 'Desktop Computer Root', level: 'macro', parent: null, role: 'container', confidence: 1, dimensions: [10.2, 5.8, 4.7], pivot: { role: 'root', mode: 'base', position: [0, 0, 0], axis: [0, 1, 0] } }),
  component({ id: 'monitor-assembly', name: 'Monitor Assembly', level: 'macro', parent: 'root', dimensions: [5.9, 5.45, 1.8], position: [-2.05, 0, 0] }),
  component({ id: 'monitor-stand-assembly', name: 'Monitor Stand Assembly', level: 'macro', parent: 'monitor-assembly', dimensions: [2.9, 2.45, 1.7], position: [0, 0, -0.4], pivot: { role: 'monitor-tilt', mode: 'hinge', position: [0, 4.0, -0.45], axis: [1, 0, 0] } }),
  component({ id: 'tower-assembly', name: 'Tower Assembly', level: 'macro', parent: 'root', dimensions: [2.8, 5.25, 3.15], position: [3.75, 0, -0.15] }),
  component({ id: 'keyboard-assembly', name: 'Keyboard Assembly', level: 'macro', parent: 'root', dimensions: [5.4, 0.72, 1.75], position: [-1.65, 0, 2.25] }),
  component({ id: 'mouse-assembly', name: 'Mouse Assembly', level: 'macro', parent: 'root', primitive: 'ellipsoid', topologyClass: 'continuous-sculpt', topologyRationale: 'Continuous arched ergonomic shell with variable cross-section.', dimensions: [1.45, 0.75, 1.85], position: [1.8, 0, 2.25] }),

  component({ id: 'monitor-shell', name: 'Rounded Monitor Rear Shell', level: 'meso', parent: 'monitor-assembly', dimensions: [5.9, 3.72, 0.46], position: [0, 2.08, -0.18] }),
  component({ id: 'monitor-bezel', name: 'Cream Monitor Bezel', level: 'meso', parent: 'monitor-shell', primitive: 'box', dimensions: [5.72, 3.55, 0.24], position: [0, 0, 0.25] }),
  component({ id: 'screen-panel', name: 'Recessed Dark Screen', level: 'meso', parent: 'monitor-bezel', dimensions: [5.25, 3.08, 0.06], position: [0, 0, 0.16], material: 'screen-glass', pivot: { role: 'screen-state', mode: 'center', position: [0, 0, 0], axis: [0, 0, 1] } }),
  component({ id: 'monitor-mount-plate', name: 'Pink Rear Monitor Mount', level: 'meso', parent: 'monitor-shell', dimensions: [1.45, 1.4, 0.22], position: [0, -0.58, -0.36], material: 'pink-shell' }),
  component({ id: 'monitor-stand-column', name: 'Leaning Pink Stand Column', level: 'meso', parent: 'monitor-stand-assembly', primitive: 'extrude', topologyClass: 'assembled-solid', topologyRationale: 'Rigid tapered support with a leaned side profile.', dimensions: [1.0, 2.45, 0.58], position: [0, 1.1, -0.48], material: 'pink-shell' }),
  component({ id: 'monitor-stand-base', name: 'Two Stage Monitor Base', level: 'meso', parent: 'monitor-stand-assembly', dimensions: [2.9, 0.42, 1.65], position: [0, 0.22, 0], material: 'pink-shell' }),
  component({ id: 'tower-shell', name: 'Rounded Cream Tower Shell', level: 'meso', parent: 'tower-assembly', dimensions: [2.8, 5.02, 3.05], position: [0, 2.68, 0] }),
  component({ id: 'tower-top-cap', name: 'Pink Tower Top Cap', level: 'meso', parent: 'tower-shell', dimensions: [2.82, 0.36, 3.08], position: [0, 2.44, 0], material: 'pink-shell' }),
  component({ id: 'tower-front-io', name: 'Pink Front I O Strip', level: 'meso', parent: 'tower-shell', dimensions: [0.55, 2.02, 0.12], position: [0.79, -0.35, 1.56], material: 'pink-shell' }),
  component({ id: 'tower-side-panel', name: 'Tower Side Panel', level: 'meso', parent: 'tower-shell', dimensions: [0.08, 4.42, 2.56], position: [1.39, -0.16, 0] }),
  component({ id: 'tower-rear-panel', name: 'Pink Rear Interface Panel', level: 'meso', parent: 'tower-shell', dimensions: [2.25, 4.22, 0.1], position: [0, -0.1, -1.55], material: 'pink-shell' }),
  component({ id: 'tower-rear-vent-panel', name: 'Tower Rear Vent Carrier', level: 'meso', parent: 'tower-rear-panel', dimensions: [1.65, 2.85, 0.05], position: [0.25, 0.42, -0.06], material: 'pink-light' }),
  component({ id: 'keyboard-shell', name: 'Rounded Keyboard Shell', level: 'meso', parent: 'keyboard-assembly', dimensions: [5.4, 0.52, 1.75], position: [0, 0.3, 0] }),
  component({ id: 'keyboard-deck', name: 'Pink Keyboard Inset Deck', level: 'meso', parent: 'keyboard-shell', dimensions: [5.05, 0.18, 1.5], position: [0, 0.34, -0.03], material: 'pink-shell' }),
  component({ id: 'keyboard-key-system', name: 'Two Tone Key Matrix', level: 'meso', parent: 'keyboard-deck', primitive: 'instanced-cluster', topologyClass: 'assembled-solid', topologyRationale: 'Repeated independent rigid keycaps socketed to a shared deck.', dimensions: [4.85, 0.26, 1.38], position: [0, 0.23, 0], pivot: { role: 'key-press', mode: 'center', position: [0, 0, 0], axis: [0, 1, 0] } }),
  component({ id: 'mouse-shell', name: 'Cream Mouse Lower Shell', level: 'meso', parent: 'mouse-assembly', primitive: 'ellipsoid', topologyClass: 'continuous-sculpt', topologyRationale: 'Continuous lower ergonomic body.', dimensions: [1.45, 0.55, 1.85], position: [0, 0.32, 0] }),
  component({ id: 'mouse-top-shell', name: 'Pink Mouse Upper Shell', level: 'meso', parent: 'mouse-shell', primitive: 'ellipsoid', topologyClass: 'conforming-shell', topologyRationale: 'Thin pink shell follows the mouse arch.', dimensions: [1.38, 0.6, 1.55], position: [0, 0.28, -0.08], material: 'pink-shell' }),
  component({ id: 'mouse-button-system', name: 'Mouse Button and Wheel System', level: 'meso', parent: 'mouse-top-shell', dimensions: [1.18, 0.16, 0.72], position: [0, 0.25, 0.34], pivot: { role: 'mouse-click', mode: 'front', position: [0, 0, 0.32], axis: [1, 0, 0] } }),

  component({ id: 'monitor-rear-emblem', name: 'Monitor Flower Emblem', level: 'micro', parent: 'monitor-shell', primitive: 'extrude', topologyClass: 'surface-relief', topologyRationale: 'Thin raised identity mark.', dimensions: [0.55, 0.55, 0.04], position: [0, 0.25, -0.28], material: 'pink-shell' }),
  component({ id: 'screen-gui-layer', name: 'Animated Screen Interface', level: 'micro', parent: 'screen-panel', primitive: 'plane-card', topologyClass: 'material-only', topologyRationale: 'Emissive interface planes ride the display surface.', dimensions: [4.7, 2.55, 0.01], position: [0, 0, 0.05], material: 'screen-emissive' }),
  component({ id: 'tower-front-emblem', name: 'Tower Flower Emblem', level: 'micro', parent: 'tower-shell', primitive: 'extrude', topologyClass: 'surface-relief', topologyRationale: 'Thin raised identity mark.', dimensions: [0.48, 0.48, 0.05], position: [0, 0.95, 1.57], material: 'pink-shell' }),
  component({ id: 'tower-front-controls', name: 'Tower Front Controls', level: 'micro', parent: 'tower-front-io', primitive: 'instanced-cluster', dimensions: [0.42, 1.6, 0.12], position: [0, 0, 0.08], material: 'port-dark', pivot: { role: 'power-button', mode: 'center', position: [0, 0.55, 0], axis: [0, 0, 1] } }),
  component({ id: 'tower-side-seam', name: 'Tower Side Panel Seam', level: 'micro', parent: 'tower-side-panel', primitive: 'box', topologyClass: 'surface-relief', topologyRationale: 'Thin recessed division line.', dimensions: [0.03, 4.2, 0.03], position: [0, 0, 0], material: 'seam-dark' }),
  component({ id: 'tower-side-vents', name: 'Tower Side Vent Grid', level: 'micro', parent: 'tower-side-panel', primitive: 'instanced-cluster', topologyClass: 'surface-relief', topologyRationale: 'Repeated dark cavities form the side ventilation field.', dimensions: [0.06, 1.65, 0.72], position: [0.06, -0.9, -0.7], material: 'port-dark' }),
  component({ id: 'tower-rear-vents', name: 'Tower Rear Vent Fields', level: 'micro', parent: 'tower-rear-panel', primitive: 'instanced-cluster', topologyClass: 'surface-relief', topologyRationale: 'Two dense repeated ventilation fields.', dimensions: [1.55, 2.7, 0.06], position: [0.25, 0.4, -0.08], material: 'port-dark' }),
  component({ id: 'tower-rear-io', name: 'Tower Rear I O Column', level: 'micro', parent: 'tower-rear-panel', primitive: 'instanced-cluster', dimensions: [0.45, 1.65, 0.08], position: [-0.7, 0.18, -0.08], material: 'port-dark' }),
  component({ id: 'tower-power-inlet', name: 'IEC Power Inlet', level: 'micro', parent: 'tower-rear-panel', primitive: 'extrude', dimensions: [0.5, 0.34, 0.12], position: [0.72, -1.6, -0.08], material: 'port-dark' }),
  component({ id: 'tower-service-panel', name: 'Rear Service Panel', level: 'micro', parent: 'tower-rear-panel', dimensions: [0.85, 0.32, 0.05], position: [-0.5, -1.55, -0.07], material: 'pink-light' }),
  component({ id: 'tower-feet', name: 'Four Tower Feet', level: 'micro', parent: 'tower-shell', primitive: 'instanced-cluster', dimensions: [2.3, 0.24, 2.42], position: [0, -2.62, 0], material: 'rubber-pink' }),
  component({ id: 'keyboard-row-system', name: 'Six Keyboard Rows', level: 'micro', parent: 'keyboard-key-system', primitive: 'instanced-cluster', dimensions: [4.85, 0.26, 1.34], position: [0, 0, 0], material: 'cream-key' }),
  component({ id: 'keyboard-spacebar', name: 'Long Pink Spacebar', level: 'micro', parent: 'keyboard-key-system', dimensions: [2.05, 0.22, 0.32], position: [-0.3, 0.04, 0.5], material: 'pink-shell' }),
  component({ id: 'mouse-wheel', name: 'Mouse Wheel', level: 'micro', parent: 'mouse-button-system', primitive: 'cylinder', topologyClass: 'assembled-solid', topologyRationale: 'Small rigid wheel rotating about lateral axis.', dimensions: [0.16, 0.18, 0.28], position: [0, 0.12, 0.18], material: 'port-dark', pivot: { role: 'mouse-wheel', mode: 'center', position: [0, 0, 0], axis: [1, 0, 0] } }),
  component({ id: 'computer-powered-state', name: 'Computer Powered State', level: 'micro', parent: 'root', primitive: 'plane-card', topologyClass: 'material-only', topologyRationale: 'Named animation state coordinating screen, LEDs, cursor, keys and cooling.', dimensions: [0.1, 0.1, 0.1], position: [0, 0, 0], material: 'screen-emissive' }),
];

const material = (id, name, color, roughness, extra = {}) => ({
  id, name, type: 'physical', shaderModel: 'MeshToonMaterial in SAKURA project style with reference-derived response', baseColor: color, color,
  albedo: { dominant: color, secondary: ['#FFF7E8', '#EFA9B1', '#6C626D'], samplingNotes: 'Observed from admitted front/side/back turn-sheet color zones.' },
  colorVariation: { palette: [color, '#FFF7E8', '#EFA9B1'], pattern: 'subtle molded gradient', amplitude: 0.04, heightCorrelation: 0 },
  textureResolution: 1024,
  textureProjection: { mode: 'uv', repeat: [2, 2], anisotropy: 8, texelDensityIntent: 'Object-scale stable procedural detail.' },
  surfaceFrequencyBands: [
    { id: 'macro', frequency: 2, amplitude: 0.16, role: 'broad material zone' },
    { id: 'meso', frequency: 12, amplitude: 0.07, role: 'panel and seam response' },
    { id: 'micro', frequency: 56, amplitude: 0.025, role: 'grazing highlight breakup' },
  ],
  roughness: { base: roughness, variation: 0.1, map: `independent-${id}-roughness`, localResponse: 'cavities rougher; bevel crests slightly smoother' },
  metalness: { base: 0, variation: 0 },
  normal: { pattern: `independent-${id}-fine-normal`, strength: id.includes('screen') ? 0.01 : 0.06, scale: 32, space: 'tangent' },
  bump: { pattern: 'independent-fine-height', amplitude: id.includes('screen') ? 0 : 0.005, scale: 48 },
  displacement: { pattern: 'none', amplitude: 0, scale: 1, silhouetteAffects: false },
  ambientOcclusion: { cavityStrength: 0.3, contactShadowBias: 0.3, notes: 'Darken panel seams, key gaps, vent cavities and shell contacts.' },
  wear: { edgeWear: 0.02, scratches: [], chips: [] }, dirt: { amount: 0.01, cavityBias: 0.3, color: '#665B64' },
  localOverrides: [{ id: `${id}-edge-response`, region: 'beveled edges and contact zones', response: 'lower roughness at exposed bevel crests', evidenceRefs: ['front-full', 'side-full', 'back-full'] }],
  referencePbr: { usable: true, confidence: 0.82, estimatedFidelity: 0.82, sourceImage: 'references/intake/desktop-computer/front.png', limitation: 'Multi-view reference-derived inference, not exact inverse rendering.', maps: { albedo: { path: 'references/intake/desktop-computer/front.png' }, roughness: { path: `procedural-independent-${id}-roughness` }, height: { path: `procedural-independent-${id}-height` }, normal: { path: `procedural-independent-${id}-normal` }, ao: { path: `procedural-independent-${id}-ao` } } },
  ...extra,
});
s.materials = [
  material('cream-shell', 'Warm Cream Satin Plastic', '#F8EBD5', 0.58),
  material('pink-shell', 'SAKURA Pink Satin Plastic', '#EFA9B1', 0.44, { clearcoat: 0.28 }),
  material('pink-light', 'Light Pink Recess Plastic', '#F5C1C5', 0.52),
  material('screen-glass', 'Dark Display Glass', '#39383E', 0.22, { clearcoat: 0.5 }),
  material('screen-emissive', 'Animated Screen Emissive', '#6DB7D5', 0.32, { emissive: '#82DDF2', emissiveIntensity: 1.8 }),
  material('port-dark', 'Port and Vent Cavity', '#5A5058', 0.7),
  material('seam-dark', 'Panel Seam', '#806E72', 0.76),
  material('cream-key', 'Cream Keycap', '#FFF4DF', 0.6),
  material('rubber-pink', 'Pink Rubber Foot', '#B98981', 0.82),
];
s.repetitionSystems = [
  { id: 'keyboard-keycaps', name: 'Six row two-tone keycap matrix', componentRef: 'keyboard-row-system', count: 63, distribution: 'six staggered rows with cream central field, pink edge/function keys and one long spacebar', geometry: 'shared rounded keycap boxes with row-dependent widths', material: 'cream-key/pink-shell', evidenceRefs: ['front-full', 'side-full'] },
  { id: 'tower-side-vent-grid', name: 'Tower side ventilation grid', componentRef: 'tower-side-vents', count: 48, distribution: '6 by 8 regular grid on lower rear side panel', geometry: 'shared shallow dark cylinders embedded in side shell', material: 'port-dark', evidenceRefs: ['side-full'] },
  { id: 'tower-rear-vent-grids', name: 'Tower rear dual ventilation grids', componentRef: 'tower-rear-vents', count: 132, distribution: 'narrow 5 by 10 field plus wide 8 by 11 field', geometry: 'shared shallow dark cylinders embedded in rear panel', material: 'port-dark', evidenceRefs: ['back-full'] },
  { id: 'tower-feet-four', name: 'Tower feet', componentRef: 'tower-feet', count: 4, distribution: 'four lower corners', geometry: 'shared rounded foot block', material: 'rubber-pink', evidenceRefs: ['front-full', 'side-full', 'back-full'] },
];
s.featureReviewTargets = [
  { id: 'workstation-silhouette', name: 'Five-piece workstation silhouette', tier: 'critical', passIds: ['blockout', 'form-refinement'], minimumScore: 0.8, mustPass: true, componentRefs: ['monitor-assembly', 'tower-assembly', 'keyboard-assembly', 'mouse-assembly'], evidenceRefs: ['front-full', 'side-full', 'back-full'] },
  { id: 'monitor-stand-system', name: 'Monitor bezel screen mount and stand', tier: 'critical', passIds: ['structural-pass', 'form-refinement'], minimumScore: 0.78, mustPass: true, componentRefs: ['monitor-shell', 'monitor-bezel', 'screen-panel', 'monitor-mount-plate', 'monitor-stand-column', 'monitor-stand-base'], evidenceRefs: ['front-monitor', 'side-full', 'back-full'] },
  { id: 'tower-shell-io', name: 'Tower shell top cap and I O', tier: 'critical', passIds: ['structural-pass', 'form-refinement', 'material-pass'], minimumScore: 0.78, mustPass: true, componentRefs: ['tower-shell', 'tower-top-cap', 'tower-front-io', 'tower-rear-panel', 'tower-rear-io', 'tower-power-inlet'], evidenceRefs: ['front-full', 'back-tower'] },
  { id: 'ventilation-system', name: 'Side and rear ventilation systems', tier: 'critical', passIds: ['structural-pass', 'form-refinement'], minimumScore: 0.75, mustPass: true, componentRefs: ['tower-side-vents', 'tower-rear-vents'], evidenceRefs: ['side-full', 'back-tower'] },
  { id: 'input-device-system', name: 'Keyboard and mouse input devices', tier: 'critical', passIds: ['structural-pass', 'form-refinement', 'material-pass'], minimumScore: 0.76, mustPass: true, componentRefs: ['keyboard-shell', 'keyboard-key-system', 'keyboard-spacebar', 'mouse-shell', 'mouse-top-shell', 'mouse-wheel'], evidenceRefs: ['front-full', 'side-full'] },
  { id: 'computer-powered-state', name: 'Computer-specific powered action', tier: 'critical', passIds: ['interaction-pass'], minimumScore: 0.8, mustPass: true, componentRefs: ['screen-panel', 'screen-gui-layer', 'tower-front-controls', 'keyboard-key-system', 'mouse-wheel'], evidenceRefs: ['front-full', 'back-tower'] },
];

const passOrder = ['blockout', 'structural-pass', 'form-refinement', 'material-pass', 'lighting-pass', 'interaction-pass', 'optimization-pass'];
s.buildPasses = s.buildPasses.filter((p) => passOrder.includes(p.id)).map((p) => ({ ...p, componentRefs: s.componentTree.map((c) => c.id) }));
s.sculptPipeline.passOrder = passOrder;
s.selfCorrectLoop.reviewAfterPasses = passOrder;
s.selfCorrectLoop.screenshotPolicy.requiredForPasses = passOrder.filter((id) => id !== 'optimization-pass');
s.actionReadiness = { contract: 'Named pivots, sockets, colliders, destruction groups and exact stop-state for the workstation.', defaultRigType: 'action-ready-appliance-rig', rootMotionNode: 'root' };
s.assumptions = [
  'Tower internal electronics and fans are hidden; only an external cooling cue is animated.',
  'Monitor hinge stop and tilt range are inferred from visible mount geometry.',
  'Keyboard switches and exact scan matrix are hidden; visible key rows are reconstructed.',
  'Rear port protocols are not claimed; visible socket silhouettes are reproduced.',
  'No cables are visible; sockets are published without rendered cable geometry.',
];
s.lightingFromPhoto = [
  'warm upper-left key light, color #FFF1DF, intensity 3.2, broad soft shadow',
  'cool right-rear fill light, color #B7D9EF, intensity 1.35',
  'pink rear rim light, color #F2B8CF, intensity 1.6',
  'neutral pale-blue background #EDF1F7 with filmic tone mapping and exposure 1.0',
  'soft ground contact shadow below monitor base, tower feet, keyboard and mouse',
];
s.proceduralStrategy = [
  'Lock workstation layout and five macro volumes before details.',
  'Use rounded boxes and extruded support profiles for cream/pink hard-surface shells.',
  'Use shared geometry for keycaps, vent perforations and tower feet.',
  'Build monitor GUI from independent emissive planes and animate bounded boot/window/cursor states.',
  'Keep all transforms deterministic and resettable without per-frame allocations.',
];
s.animationAnchors = ['tower-power-button-pivot', 'monitor-screen-state', 'screen-cursor-pivot', 'keyboard-keypress-pivot', 'mouse-wheel-pivot', 'tower-cooling-state', 'monitor-hinge-socket'];
s.destructionAnchors = ['monitor shell and bezel group', 'monitor stand group', 'tower shell and panel group', 'keyboard shell and key group', 'mouse shell and button group'];
s.risks = ['vent and key repetition can exceed draw-call budget if authored as unique geometry', 'screen emissive UI must remain legible at catalog scale', 'rear I/O and hidden internal structures are approximate', 'monitor/keyboard/tower relative scale must survive catalog normalization'];
s.performanceBudget = { qualityPriority: 'reference-fidelity real-time browser', targetTriangles: 80000, maxDrawCalls: 110, textureSize: 1024, fpsTarget: 60, optimizationPolicy: 'Reuse keycap, vent, foot, port and emblem geometries; avoid allocations inside update().' };
s.lodPlan = [
  { tier: 'near', distance: 0, strategy: 'all named assemblies, keycaps, vents and GUI layers' },
  { tier: 'far', distance: 20, strategy: 'retain silhouette and emissive screen; hide small port relief and cursor if needed' },
];
s.reviewHistory = [];
s.visualEvidence = [];
s.tier1Results = [];

fs.writeFileSync(path, `${JSON.stringify(s, null, 2)}\n`);

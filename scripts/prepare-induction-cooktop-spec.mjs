import fs from 'node:fs';

const path = 'docs/sculpt-specs/induction-cooktop/object-sculpt-spec.json';
const spec = JSON.parse(fs.readFileSync(path, 'utf8'));

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
spec.coordinateFrame = {
  front: '+Z is the control edge',
  up: '+Y, with the cooktop surface horizontal in XZ',
  scaleReference: 'body width 3.6 units, body depth 3.45 units, floor at Y=0',
};
spec.silhouette = {
  boundingShape: 'low rounded-square slab with a slightly inset pink top and a mint lower band',
  aspectRatios: ['width:depth = 1.04:1', 'width:body-thickness = 8.0:1', 'heating-zone diameter = 0.67 body width'],
  symmetry: 'footprint and heating zone are bilateral; control arrangement and underside fan/cable recess are asymmetric',
  dominantCurves: ['0.34-unit outer corner radius', 'large concentric heating ring', 'circular fan grille', 'round buttons and knob'],
  negativeSpaces: ['side ventilation slots', 'fan grille slots', 'cable storage trough'],
  landmarks: ['pink glass-ceramic top', 'large dotted heater circle', 'three small buttons and one center knob', 'mint lower rim'],
};
spec.viewEvidence = [
  { id: 'top-view', view: 'top', imagePath: 'references/intake/induction-cooktop/front.png', imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['rounded-square footprint', 'heater-zone circle', 'four control positions', 'cream bezel and mint feet'], confidence: 0.99 },
  { id: 'side-view', view: 'right-side', imagePath: 'references/intake/induction-cooktop/side.png', imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['very low slab thickness', 'raised control knob', 'nine vertical vents', 'mint lower band and feet'], confidence: 0.98 },
  { id: 'underside-view', view: 'underside', imagePath: 'references/intake/induction-cooktop/back.png', imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['four circular feet', 'large concentric fan grille', 'top-edge cable trough', 'stored U-cord and two-pin plug'], confidence: 0.97 },
];

function attachment(parentSocket = 'root', overlap = 0.03) {
  return { parentSocket, localStart: [0, 0, 0], localEnd: [0, overlap, 0], contactType: 'overlap', overlap, gapTolerance: 0.01 };
}

function component(id, name, level, parent, material, primitive, features, evidenceRefs, extra = {}) {
  const palette = { 'cream-shell': 'rgba(246, 237, 223, 1)', 'pink-glass': 'rgba(236, 175, 176, 1)', 'mint-plastic': 'rgba(169, 197, 181, 1)', 'dark-ink': 'rgba(85, 71, 74, 1)', 'dark-cavity': 'rgba(74, 65, 68, 1)', rubber: 'rgba(169, 197, 181, 1)', 'cable-rubber': 'rgba(117, 106, 104, 1)', steam: 'rgba(255, 245, 232, 0.24)' };
  const materialClass = { 'cream-shell': 'plastic', 'pink-glass': 'ceramic', 'mint-plastic': 'plastic', 'dark-ink': 'plastic', 'dark-cavity': 'plastic', rubber: 'rubber', 'cable-rubber': 'rubber', steam: 'unknown' };
  return {
    id, name, level, role: level === 'macro' ? 'body' : 'part', importance: level === 'macro' ? 1 : 0.8,
    confidence: 0.95, primitive, topologyClass: 'assembled-solid',
    topologyRationale: 'Rigid manufactured part with stable thickness and explicit seams.',
    parent, transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
    material, materialLayers: [material], localFeatures: features, actionProfile: {}, evidenceRefs,
    colorMaterialRecipe: { dominantAlbedo: palette[material] ?? 'rgba(246, 237, 223, 1)', secondaryAlbedo: palette[material] ?? 'rgba(246, 237, 223, 1)', materialClass: materialClass[material] ?? 'unknown', materialClassConfidence: 0.95 },
    details: features.map((feature) => ({ id: feature, kind: 'geometry', evidenceRefs })),
    attachment: parent ? attachment(parent) : null, fidelityTier: level === 'micro' ? 'detail' : 'form-refinement',
    ...extra,
  };
}

spec.componentTree = [
  component('root', 'Induction Cooktop Root', 'macro', null, 'cream-shell', 'box', [], ['top-view', 'side-view', 'underside-view']),
  component('main-enclosure', 'Rounded Main Enclosure', 'macro', 'root', 'cream-shell', 'box', ['top-rounded-square-silhouette'], ['top-view', 'side-view', 'underside-view']),
  component('lower-band', 'Mint Lower Enclosure Band', 'macro', 'main-enclosure', 'mint-plastic', 'box', ['mint-lower-band'], ['side-view', 'underside-view']),
  component('top-bezel', 'Cream Raised Top Bezel', 'meso', 'main-enclosure', 'cream-shell', 'box', ['cream-bezel-step'], ['top-view', 'side-view']),
  component('cooking-panel', 'Pink Glass Ceramic Cooking Panel', 'macro', 'top-bezel', 'pink-glass', 'box', ['pink-glass-ceramic-panel'], ['top-view', 'side-view']),
  component('heating-zone', 'Concentric Induction Heating Zone', 'meso', 'cooking-panel', 'dark-ink', 'torus', ['heater-zone-ring'], ['top-view'], { actionProfile: { animationRole: 'material-state', pivot: { mode: 'center', localPosition: [0, 0, 0], axis: [0, 1, 0], confidence: 1 } } }),
  component('control-knob', 'Front Center Rotary Control Knob', 'meso', 'cooking-panel', 'cream-shell', 'cylinder', ['control-knob'], ['top-view', 'side-view'], { actionProfile: { animationRole: 'rotary-control', pivot: { mode: 'axis', localPosition: [0, 0, 0], axis: [0, 1, 0], confidence: 0.98 } } }),
  component('timer-button', 'Timer Control Button', 'meso', 'cooking-panel', 'cream-shell', 'cylinder', ['left-timer-button'], ['top-view']),
  component('mode-button', 'Heat Mode Button', 'meso', 'cooking-panel', 'cream-shell', 'cylinder', ['left-mode-button'], ['top-view']),
  component('power-button', 'Power Control Button', 'meso', 'cooking-panel', 'cream-shell', 'cylinder', ['right-power-button'], ['top-view']),
  component('control-glyphs', 'Plus Minus and Button Glyphs', 'micro', 'cooking-panel', 'dark-ink', 'extrude', ['plus-minus-marks'], ['top-view']),
  component('side-vents', 'Right Side Vent Array', 'meso', 'main-enclosure', 'dark-cavity', 'instanced-cluster', ['right-side-vent-array'], ['side-view']),
  component('foot-array', 'Four Underside Rubber Feet', 'meso', 'lower-band', 'rubber', 'instanced-cluster', ['four-rubber-feet'], ['side-view', 'underside-view']),
  component('fan-grille', 'Underside Concentric Fan Grille', 'meso', 'lower-band', 'dark-cavity', 'instanced-cluster', ['underside-fan-grille'], ['underside-view']),
  component('cable-trough', 'Underside Cable Storage Recess', 'meso', 'lower-band', 'dark-cavity', 'box', ['cable-storage-recess'], ['underside-view']),
  component('power-cord', 'Stored U-Shaped Power Cord', 'micro', 'cable-trough', 'cable-rubber', 'tube', ['coiled-power-cord'], ['underside-view'], { attachment: { parentSocket: 'cable-trough-socket', localStart: [-0.75, 0, 0], localEnd: [0.72, 0, 0], contactType: 'inserted', embedDepth: 0.03, gapTolerance: 0.01 } }),
  component('seam-system', 'Panel and Enclosure Seam System', 'micro', 'main-enclosure', 'dark-ink', 'extrude', ['panel-seams'], ['top-view', 'side-view', 'underside-view']),
  component('steam-plume', 'Powered Steam Plume', 'meso', 'heating-zone', 'steam', 'instanced-cluster', [], ['top-view'], { confidence: 0.55, actionProfile: { animationRole: 'powered-use-effect', pivot: { mode: 'center', localPosition: [0, 0, 0], axis: [0, 1, 0], confidence: 0.8 } } }),
];

function material(id, name, color, roughness, extra = {}) {
  return {
    id, name, type: 'physical', shaderModel: 'MeshToonMaterial compatible PBR approximation', baseColor: color, color,
    albedo: { dominant: color, secondary: [color], samplingNotes: 'Sampled from the admitted three-view reference palette.' },
    colorVariation: { palette: [color], pattern: 'subtle bevel response', amplitude: 0.04 }, textureResolution: 1024,
    textureProjection: { mode: 'uv', repeat: [2, 2], anisotropy: 8, texelDensityIntent: 'Stable object-scale detail.' },
    surfaceFrequencyBands: [
      { id: 'macro', frequency: 2, amplitude: 0.14, role: 'broad molded shading' },
      { id: 'meso', frequency: 14, amplitude: 0.05, role: 'panel and seam response' },
      { id: 'micro', frequency: 58, amplitude: 0.018, role: 'highlight breakup' },
    ],
    roughness: { base: roughness, variation: 0.08, map: `independent-${id}-roughness` },
    metalness: { base: 0, variation: 0 }, normal: { strength: 0.04, pattern: `independent-${id}-normal` },
    ambientOcclusion: { cavityStrength: 0.3, contactShadowBias: 0.3, notes: 'Darken seams and contact zones.' },
    localOverrides: [{ id: `${id}-edge-response`, region: 'beveled edges and cavities', response: 'edge/cavity roughness contrast', evidenceRefs: ['top-view', 'side-view', 'underside-view'] }],
    referencePbr: { usable: true, confidence: 0.82, estimatedFidelity: 0.82, sourceImage: 'references/intake/induction-cooktop/front.png', maps: { albedo: { path: 'references/intake/induction-cooktop/front.png' }, roughness: { path: `procedural-${id}-roughness` }, height: { path: `procedural-${id}-height` }, normal: { path: `procedural-${id}-normal` }, ao: { path: `procedural-${id}-ao` } } },
    ...extra,
  };
}

spec.materials = [
  material('cream-shell', 'Warm Cream Painted Plastic', '#F6EDDF', 0.38, { clearcoat: 0.36 }),
  material('pink-glass', 'Sakura Pink Glass Ceramic', '#ECAFB0', 0.2, { clearcoat: 0.72 }),
  material('mint-plastic', 'Muted Mint Lower Plastic', '#A9C5B5', 0.46),
  material('dark-ink', 'Dark Printed Control Ink', '#55474A', 0.58),
  material('dark-cavity', 'Vent and Recess Shadow', '#4A4144', 0.7),
  material('rubber', 'Mint Rubber Feet', '#8DAFA1', 0.82),
  material('cable-rubber', 'Warm Gray Cable Rubber', '#756A68', 0.76),
  material('steam', 'Translucent Warm Steam', '#FFF5E8', 0.18, { transparent: true, opacity: 0.24 }),
];
spec.repetitionSystems = [
  { id: 'side-vent-slots', name: 'Nine right-side ventilation slots', componentRef: 'side-vents', count: 9, distribution: 'linear along the right side wall', geometry: 'narrow rounded vertical slots', material: 'dark-cavity', evidenceRefs: ['side-view'] },
  { id: 'underside-feet', name: 'Four underside rubber feet', componentRef: 'foot-array', count: 4, distribution: 'one near each rounded underside corner', geometry: 'short cylindrical pads', material: 'rubber', evidenceRefs: ['underside-view'] },
  { id: 'heater-dashes', name: 'Dotted circular heater mark', componentRef: 'heating-zone', count: 64, distribution: 'single circular orbit', geometry: 'short radial dash segments', material: 'dark-ink', evidenceRefs: ['top-view'] },
  { id: 'fan-grille-slots', name: 'Concentric underside fan slots', componentRef: 'fan-grille', count: 72, distribution: 'six rings of twelve arc slots', geometry: 'rounded tangential bars', material: 'dark-cavity', evidenceRefs: ['underside-view'] },
];
spec.featureReviewTargets = [
  { id: 'cooktop-silhouette', name: 'Low rounded-square body silhouette', tier: 'critical', passIds: ['blockout', 'form-refinement'], minimumScore: 0.82, mustPass: true, componentRefs: ['main-enclosure', 'lower-band', 'cooking-panel'], evidenceRefs: ['top-view', 'side-view'] },
  { id: 'top-identity', name: 'Heater circle and control strip', tier: 'critical', passIds: ['structural-pass', 'form-refinement'], minimumScore: 0.82, mustPass: true, componentRefs: ['heating-zone', 'control-knob', 'timer-button', 'mode-button', 'power-button', 'control-glyphs'], evidenceRefs: ['top-view'] },
  { id: 'side-identity', name: 'Low profile, vent array and mint band', tier: 'important', passIds: ['structural-pass', 'form-refinement'], minimumScore: 0.76, mustPass: true, componentRefs: ['side-vents', 'lower-band', 'foot-array'], evidenceRefs: ['side-view'] },
  { id: 'underside-identity', name: 'Fan grille, feet and cable trough', tier: 'important', passIds: ['structural-pass', 'form-refinement'], minimumScore: 0.76, mustPass: true, componentRefs: ['fan-grille', 'foot-array', 'cable-trough', 'power-cord'], evidenceRefs: ['underside-view'] },
  { id: 'powered-use', name: 'Readable induction heating action', tier: 'critical', passIds: ['interaction-pass'], minimumScore: 0.8, mustPass: true, componentRefs: ['heating-zone', 'control-knob', 'steam-plume'], evidenceRefs: ['top-view'] },
];
spec.buildPasses.forEach((pass) => { pass.componentRefs = spec.componentTree.map(({ id }) => id); });
spec.assumptions = [
  'The rear wall is inferred from the rounded footprint because no isolated rear elevation is provided.',
  'Internal induction coil, fan rotor, insulation, wiring and controller are hidden and omitted.',
  'Cable trough depth and strain relief are inferred from underside shadows.',
  'Steam and thermal glow are runtime action cues, not visible static construction.',
];
spec.animationAnchors = ['control-knob rotary pivot', 'heating-zone material-state pivot', 'steam-plume pooled particle root', 'power-cable socket'];
spec.destructionAnchors = ['main enclosure', 'glass ceramic cooking panel', 'control assembly', 'underside service assembly'];
spec.risks = ['Horizontal objects need an elevated three-quarter review camera to make top controls readable.', 'Dense fan slots can consume draw calls unless geometry/materials are shared.'];
spec.performanceBudget = { qualityPriority: 'reference-fidelity', targetTriangles: 65000, maxDrawCalls: 150, textureSize: 1024, fpsTarget: 60, optimizationPolicy: 'Share repeated geometries and pool steam meshes; preserve heater, control and underside identity details.' };
spec.lightingFromPhoto = [
  'warm upper-left key light intensity 3.1',
  'cool right fill light intensity 1.2',
  'soft Sakura pink rear rim light intensity 1.4',
  'ACESFilmic tone mapping with exposure 1.0 on pale neutral background',
  'soft contact shadow under all four feet',
];

spec.preSpecAssessment.complexity.scores = { silhouetteComplexity: 2, componentCount: 3, hierarchyDepth: 3, repetitionDensity: 3, materialLayerCount: 3, localDetailDensity: 3, occlusionRisk: 2, actionReadinessNeed: 3 };
spec.preSpecAssessment.unknownsToResolveBeforeImplementation = [];
const detailKinds = ['contour', 'seam', 'gloss', 'linework', 'ridge', 'ridge', 'ridge', 'ridge', 'linework', 'hole', 'seam', 'ridge', 'hole', 'groove', 'ridge', 'seam'];
spec.preSpecAssessment.detailInventory.details.forEach((detail, index) => {
  detail.kind = detailKinds[index];
  detail.description = detail.observation;
  detail.region = { x: 0, y: 0, width: 1, height: 1, units: 'normalized' };
  detail.affects = detail.scale === 'macro' ? 'silhouette/material' : 'geometry/material/interaction';
  detail.mapsTo = { type: 'component.localFeatures', ref: detail.mappedTo.componentId };
  detail.evidenceRef = detail.zone === 'underside' ? 'underside-view' : detail.zone === 'right-side' ? 'side-view' : 'top-view';
  detail.confidence = detail.id.includes('cord') ? 0.88 : 0.96;
  detail.realization = 'mapped-to-component-geometry';
});

fs.writeFileSync(path, `${JSON.stringify(spec, null, 2)}\n`);

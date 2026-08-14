import { readFile, writeFile } from 'node:fs/promises';

const specPath = 'docs/sculpt-specs-v2/gumball-machine/object-sculpt-spec.json';
const spec = JSON.parse(await readFile(specPath, 'utf8'));
const clone = (value) => JSON.parse(JSON.stringify(value));
const rootTemplate = spec.componentTree[0];
const materialTemplate = spec.materials[0];

spec.targetName = 'SAKURA Gumball Machine v2';
spec.targetId = 'gumball-machine-v2';
spec.sourceImage = 'references/intake-v2/gumball-machine/views/front.png';
spec.sourceImages = ['front', 'side', 'back', 'three-quarter'].map((view) => `references/intake-v2/gumball-machine/views/${view}.png`);
spec.suitability = 'pass';
spec.scores = { object_isolation: 3, silhouette_readability: 3, depth_inference: 3, primitive_decomposition: 3, material_procedurality: 3, occlusion_risk: 2, interaction_fit: 3 };
spec.preSpecAssessment.objectClass = {
  primaryType: 'capsule-toy-vending-machine', primaryDomain: 'object',
  formLanguage: ['stylized-low-poly', 'faceted-hard-surface', 'exaggerated-functional-silhouette'],
  structureKind: ['transparent-globe', 'tapered-pedestal', 'arched-dispense-chute', 'dual-crank-control'],
  motionPotential: ['front-crank-rotation', 'side-crank-rotation', 'capsule-frenzy', 'capsule-launch', 'shell-open', 'prize-reveal'],
  materialFamilies: ['matte-cream-polymer', 'sakura-pink-polymer', 'cool-plum-cavity', 'tinted-clear-polymer', 'pastel-capsules'],
  notes: 'The admitted GPT Image 2 turn-sheet controls visual language; the archived v1 rig controls all animation nodes, sockets, transforms and effects.',
};
spec.preSpecAssessment.complexity.scores = { silhouetteComplexity: 3, componentCount: 3, hierarchyDepth: 3, repetitionDensity: 3, materialLayerCount: 3, localDetailDensity: 3, occlusionRisk: 3, actionReadinessNeed: 3 };
spec.preSpecAssessment.estimatedCounts = { macroComponents: 6, mesoComponents: 17, microFeatureGroups: 12, materialLayers: 12, repetitionSystems: 8 };

const details = [
  'twelve-sided transparent globe', 'radially faceted pink lid dome', 'wide dark-pink lid rim', 'cream crown cap',
  'double-lip globe seat', 'tapered twelve-sided cream pedestal', 'pink lower plinth', 'four pink shoulder brackets',
  'deep arched dispense cavity', 'thick arched pink frame', 'projecting tray with raised lip', 'faceted front crank stack',
  'cross grip and center boss', 'right-side bent crank arm', 'oversized faceted side grip', 'rear service hatch and seam',
  'rear cable notch and socket', 'four independent rubber feet', 'seventeen two-piece capsules', 'seventeen equator seams',
  'seventeen opaque capsule prizes', 'central divider column and hub', 'output capsule split shells', 'output flower prize',
  'three volumetric success stars', 'purpose status dot', 'stable three-tier uneven ink', 'transparent-shell outline exclusion',
  'frozen prize exit trajectory', 'exact animation stop and reset',
];
spec.preSpecAssessment.detailInventory = {
  scanMethod: 'four-view-grid-plus-runtime-contract', targetMinDetails: 20,
  note: 'Every visible identity feature and frozen runtime effect maps to named procedural geometry.',
  details: details.map((description, index) => ({
    id: `gumball-machine-detail-${index + 1}`, kind: index % 3 === 0 ? 'contour' : index % 3 === 1 ? 'bevel' : 'linework', description,
    region: { x: (index % 3) / 3, y: (index % 6) / 6, width: 0.33, height: 0.16, units: 'normalized' },
    scale: index < 9 ? 'macro' : index < 22 ? 'meso' : 'micro', affects: 'geometry, materialSurface, actionReadiness',
    mapsTo: { type: 'component.localFeatures', ref: 'root' }, evidenceRef: index >= 18 ? 'runtime-contract' : 'turnsheet', confidence: 0.96,
  })),
};
spec.qualityContract.minimumSpecDepth = { macroComponents: 6, mesoComponents: 9, microFeatureGroups: 5, materialLayers: 10, repetitionSystems: 7, reviewViewpoints: 7 };

function component(id, name, level, role, parent, primitive, dimensions, material, features, attachment = null) {
  const item = clone(rootTemplate);
  item.id = id; item.name = name; item.level = level; item.role = role; item.parent = parent;
  item.primitive = primitive === 'cluster' ? 'instanced-cluster' : primitive === 'style' ? 'box' : primitive;
  item.topologyClass = primitive === 'style' ? 'material-only' : primitive === 'tube' ? 'fiber-strand' : primitive === 'sphere' || primitive === 'lathe' ? 'continuous-sculpt' : 'assembled-solid';
  item.topologyRationale = 'Named low-poly procedural component authored under the archived animation hierarchy.';
  item.dimensions = { ...dimensions, units: 'world', confidence: 0.96 };
  item.material = material; item.materialLayers = [material];
  item.localFeatures = features.map((feature) => ({ id: `${id}-${feature}`, name: feature, evidenceRefs: ['turnsheet'], geometry: 'explicit-named-procedural-geometry' }));
  item.colorMaterialRecipe = { dominantAlbedo: material === 'accent' ? 'rgba(232,174,196,1)' : material === 'cavity' ? 'rgba(70,62,83,1)' : 'rgba(246,238,222,1)', secondaryAlbedo: 'rgba(112,101,126,1)', materialClass: material.includes('clear') ? 'glass' : 'plastic', materialClassConfidence: 0.94 };
  item.surfaceDetail = { macroRoughness: 0.62, microRoughness: 0.04, bumpAmplitude: 0, normalPattern: 'faceted-object-normal', displacementPattern: 'none', occlusionPattern: 'seam-and-contact-ao', edgeWearPattern: 'stable-ink-variation', notes: 'No runtime image textures.' };
  item.actionProfile = clone(rootTemplate.actionProfile); item.actionProfile.animationRole = role;
  item.actionProfile.pivot = { mode: 'named-runtime-pivot', localPosition: [0, 0, 0], axis: [0, 1, 0], confidence: 0.99 };
  item.actionProfile.collider = { type: 'compound-proxy', offset: [0, 0, 0], scale: [1, 1, 1], isTrigger: false, notes: 'The archived v1 envelope remains authoritative.' };
  item.actionProfile.destruction = { breakable: false, fractureGroup: id, seamRefs: [], detachableFragments: [], breakImpulse: 0, debrisMaterial: material };
  item.attachment = attachment ?? (parent ? { parentSocket: `${parent}-socket`, localStart: [0, 0, 0], localEnd: [0, 0.03, 0], contactType: 'overlap', overlap: 0.03, gapTolerance: 0.01 } : null);
  item.evidenceRefs = ['turnsheet', 'runtime-contract']; item.fidelityTier = 'v2';
  return item;
}

spec.componentTree = [
  component('root', 'Frozen gumball machine runtime root', 'macro', 'root', null, 'box', { width: 3.09, height: 4.3, depth: 2.49 }, 'cream', ['floor contact', 'archived package envelope']),
  component('globe-system', 'Faceted transparent globe assembly', 'macro', 'capsule-vessel', 'root', 'sphere', { width: 2.98, height: 2.76, depth: 2.48 }, 'globe-clear', ['twelve-sided shell', 'transparent contour exclusion']),
  component('lid-system', 'Radially faceted top lid', 'macro', 'service-lid', 'globe-system', 'lathe', { width: 2.04, height: 0.57, depth: 1.71 }, 'accent', ['wide rim', 'cream crown']),
  component('pedestal-system', 'Twelve-sided tapered pedestal', 'macro', 'base-shell', 'root', 'lathe', { width: 2.12, height: 1.53, depth: 1.68 }, 'cream', ['vertical facets', 'pink shoulder brackets']),
  component('seat-system', 'Double-lip globe seat and lower plinth', 'macro', 'structural-rings', 'root', 'cylinder', { width: 2.15, height: 0.28, depth: 1.7 }, 'accent', ['upper seat', 'lower ring']),
  component('dispense-system', 'Arched front dispense assembly', 'macro', 'dispense', 'pedestal-system', 'extrude', { width: 0.9, height: 0.96, depth: 0.65 }, 'accent', ['negative-space frame', 'deep cavity', 'tray']),
  component('capsule-system', 'Seventeen frozen two-piece capsules', 'meso', 'capsule-frenzy', 'globe-system', 'cluster', { width: 2.1, height: 1.55, depth: 1.3 }, 'capsule-pastel', ['clear upper halves', 'pastel lower halves', 'equator seams']),
  component('prize-system', 'Seventeen solid capsule prizes', 'meso', 'capsule-prizes', 'capsule-system', 'cluster', { width: 2, height: 1.45, depth: 1.2 }, 'prize', ['star', 'flower', 'key', 'bear']),
  component('divider-system', 'Internal column and divider hub', 'meso', 'feed-divider', 'globe-system', 'cluster', { width: 0.46, height: 1.34, depth: 0.46 }, 'accent', ['central column', 'restrained hub']),
  component('front-control', 'Faceted front rotary crank', 'meso', 'front-crank', 'pedestal-system', 'cluster', { width: 0.76, height: 0.76, depth: 0.39 }, 'accent', ['seat', 'face', 'cross grip', 'boss']),
  component('side-control', 'Right-side crank and ball grip', 'meso', 'side-crank', 'pedestal-system', 'tube', { width: 0.45, height: 0.72, depth: 0.38 }, 'accent', ['axle hub', 'bent arm', 'faceted ball']),
  component('rear-service', 'Rear service and cable hierarchy', 'meso', 'rear-service', 'pedestal-system', 'cluster', { width: 0.76, height: 0.68, depth: 0.18 }, 'cream-light', ['service panel', 'seam', 'cable notch']),
  component('feet', 'Four floor-contact feet', 'meso', 'floor-contact', 'pedestal-system', 'cluster', { width: 1.7, height: 0.1, depth: 1.2 }, 'rubber', ['four independent feet']),
  component('indicator-system', 'Inset purpose status dot', 'micro', 'status', 'pedestal-system', 'sphere', { width: 0.09, height: 0.09, depth: 0.09 }, 'indicator', ['small circular lamp']),
  component('output-capsule', 'Frozen output capsule split rig', 'meso', 'prize-output', 'root', 'cluster', { width: 0.57, height: 0.57, depth: 0.57 }, 'capsule-pastel', ['clear upper shell', 'blue lower shell', 'equator seam']),
  component('output-prize', 'Frozen output flower prize', 'meso', 'prize-reveal', 'output-capsule', 'extrude', { width: 0.26, height: 0.26, depth: 0.05 }, 'prize', ['solid flower']),
  component('success-system', 'Three volumetric success stars', 'micro', 'success-burst', 'root', 'cluster', { width: 1.2, height: 1.2, depth: 0.22 }, 'success', ['three closed extrusions']),
  component('capsule-seams', 'Seventeen capsule equator seams', 'micro', 'capsule-detail', 'capsule-system', 'cluster', { width: 2.1, height: 1.55, depth: 1.3 }, 'accent-soft', ['seventeen thin torus seams']),
  component('lid-details', 'Lid rim and crown details', 'micro', 'lid-detail', 'lid-system', 'cluster', { width: 2.04, height: 0.57, depth: 1.71 }, 'accent-deep', ['dark rim', 'cream crown']),
  component('chute-details', 'Cavity and projecting tray details', 'micro', 'dispense-detail', 'dispense-system', 'cluster', { width: 0.9, height: 0.96, depth: 0.65 }, 'cavity', ['deep recess', 'raised tray lip']),
  component('outline-system', 'Stable uneven three-tier ink', 'micro', 'outline-style', 'root', 'style', { width: 3.09, height: 4.3, depth: 2.49 }, 'ink', ['main 0.0048', 'structure 0.0041', 'detail 0.0033', 'variation 0.18']),
];
spec.componentTree[0].localFeatures.push(...details.map((_, index) => `gumball-machine-detail-${index + 1}`));

function material(id, color, secondary, roughness, opacity = 1) {
  const item = clone(materialTemplate); item.id = id; item.name = id; item.baseColor = color; item.color = color;
  item.albedo = { dominant: color, secondary, samplingNotes: 'Observed from the admitted GPT Image 2 gumball-machine turn-sheet.' };
  item.colorVariation = { palette: [color, ...secondary], pattern: 'toon-band-and-object-space-facet', amplitude: 0.12, heightCorrelation: 0.1 };
  item.roughness = { base: roughness, variation: 0.06, map: 'independent-procedural-field', localResponse: 'higher at seams' };
  item.metalness = { base: 0, variation: 0 }; item.opacity = opacity;
  item.localOverrides = [{ region: 'faceted-shadow-planes', response: 'cool-lavender tint', evidenceRefs: ['turnsheet'] }];
  item.referencePbr = { usable: true, confidence: 0.84, source: 'turnsheet-observed-procedural-evidence', maps: { albedo: { path: 'procedural-independent-albedo', channel: 'albedo' }, roughness: { path: 'procedural-independent-roughness', channel: 'roughness' }, height: { path: 'none-faceted-surface', channel: 'height' }, normal: { path: 'geometry-facet-normals', channel: 'normal' }, ao: { path: 'runtime-contact-ao', channel: 'ao' } } };
  item.notes = 'Generated reference pixels are not shipped at runtime.'; return item;
}
spec.materials = [
  material('cream', '#F6EEDE', ['#FFF8EA', '#D9D0D4'], 0.7), material('cream-light', '#FFF8EA', ['#F6EEDE'], 0.58),
  material('accent', '#E8AEC4', ['#F4C3D3', '#C86F95'], 0.56), material('accent-soft', '#F4C3D3', ['#E8AEC4'], 0.52),
  material('accent-deep', '#A95779', ['#6A4D66'], 0.65), material('cavity', '#463E53', ['#6B5264'], 0.84),
  material('rubber', '#4F4C59', ['#302D38'], 0.9), material('globe-clear', '#F7FAF9', ['#B7CEDB'], 0.2, 0.22),
  material('capsule-pastel', '#9DD6E8', ['#ECA6B7', '#F2CF79', '#9ED3B9'], 0.48), material('prize', '#E5697F', ['#8A6FC2', '#E7A647', '#5FA991'], 0.62),
  material('indicator', '#FFF0A8', ['#E8AEC4'], 0.35), material('success', '#FFE7A6', ['#FF8D5F'], 0.4), material('ink', '#302A38', ['#5A4B60'], 0.86),
];
spec.repetitionSystems = [
  { id: 'capsule-array', componentRef: 'capsule-system', count: 17, distribution: 'frozen packed positions', geometry: 'shared low-segment hemispheres', material: 'capsule-pastel', evidenceRefs: ['runtime-contract'] },
  { id: 'capsule-seam-array', componentRef: 'capsule-seams', count: 17, distribution: 'one per capsule pivot', geometry: 'shared torus seam', material: 'accent-soft', evidenceRefs: ['runtime-contract'] },
  { id: 'prize-array', componentRef: 'prize-system', count: 17, distribution: 'one per prize pivot', geometry: 'four shared extruded prize families', material: 'prize', evidenceRefs: ['runtime-contract'] },
  { id: 'capsule-half-array', componentRef: 'capsule-system', count: 34, distribution: 'upper and lower per capsule', geometry: 'shared hemisphere', material: 'capsule-pastel', evidenceRefs: ['runtime-contract'] },
  { id: 'foot-array', componentRef: 'feet', count: 4, distribution: 'base corners', geometry: 'shared rounded box', material: 'rubber', evidenceRefs: ['runtime-contract'] },
  { id: 'output-shell-pair', componentRef: 'output-capsule', count: 2, distribution: 'frozen left/right pivots', geometry: 'upper and lower hemispheres', material: 'capsule-pastel', evidenceRefs: ['runtime-contract'] },
  { id: 'success-star-array', componentRef: 'success-system', count: 3, distribution: 'three frozen burst pivots', geometry: 'shared volumetric star', material: 'success', evidenceRefs: ['runtime-contract'] },
  { id: 'globe-facet-system', componentRef: 'globe-system', count: 12, distribution: 'radial shell facets', geometry: 'low-segment sphere rings', material: 'globe-clear', evidenceRefs: ['turnsheet'] },
];
spec.viewEvidence = ['front', 'side', 'back', 'three-quarter'].map((view) => ({ id: view === 'three-quarter' ? 'three-quarter-view' : `${view}-view`, view, imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['consistent globe, lid, pedestal, crank, chute and ground line'], confidence: 0.96 }));
spec.viewEvidence.unshift({ id: 'turnsheet', view: 'multi-view', imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['admitted GPT Image 2 four-view turn-sheet'], confidence: 0.97 });
spec.viewEvidence.push({ id: 'runtime-contract', view: 'runtime', imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['frozen pivots, sockets, effects and exact reset'], confidence: 0.99 });
for (const [id, time] of [['startup', 0.6], ['climax', 2.8], ['wind-down', 4.75]]) spec.viewEvidence.push({ id, view: `runtime-${id}`, imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: [`fixed timeline at ${time} seconds`], confidence: 0.99 });
spec.silhouette = { boundingShape: 'large faceted globe over a tapered pedestal and broad lower plinth', aspectRatios: ['width:height 0.72', 'depth:height 0.58'], symmetry: 'front body is nearly bilateral with the right side crank as controlled asymmetry', dominantCurves: ['twelve-sided globe', 'radial lid dome', 'tapered pedestal'], negativeSpaces: ['arched dispense opening', 'space around side crank'], landmarks: ['lid crown', 'globe seat', 'front crank', 'side crank', 'dispense tray'] };
spec.featureReviewTargets = [
  { id: 'gumball-silhouette', name: 'Large faceted globe, lid, tapered pedestal and grounded plinth', tier: 'critical', passIds: ['blockout', 'form-refinement'], minimumScore: 0.82, mustPass: true, componentRefs: ['globe-system', 'lid-system', 'pedestal-system', 'seat-system'], evidenceRefs: ['front-view', 'side-view', 'three-quarter-view'] },
  { id: 'gumball-identity', name: 'Dual cranks, arched chute and visible capsule contents', tier: 'critical', passIds: ['structural-pass', 'material-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['front-control', 'side-control', 'dispense-system', 'capsule-system', 'prize-system'], evidenceRefs: ['turnsheet'] },
  { id: 'gumball-runtime', name: 'Frozen capsules, output shell, prize reveal, sockets and exact reset', tier: 'critical', passIds: ['interaction-pass'], minimumScore: 0.9, mustPass: true, componentRefs: ['capsule-system', 'prize-system', 'output-capsule', 'output-prize', 'success-system'], evidenceRefs: ['runtime-contract'] },
  { id: 'gumball-ink', name: 'Sakura Toon palette and stable uneven ink without transparent clumping', tier: 'critical', passIds: ['material-pass', 'lighting-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['outline-system'], evidenceRefs: ['turnsheet'] },
];
spec.qualityTargets.reviewViewpoints = ['front', 'side', 'back', 'three-quarter', 'runtime-startup', 'runtime-climax', 'runtime-wind-down'];
spec.lightingFromPhoto = ['soft upper-left key', 'cool lavender fill', 'restrained Sakura rim', 'light neutral background', 'soft contact shadow below four feet', 'ACESFilmic exposure 1.0'];
spec.performanceBudget = { qualityPriority: 'stylized-runtime', targetTriangles: 50000, maxDrawCalls: 190, textureSize: 0, fpsTarget: 60, optimizationPolicy: 'Reuse capsule, prize and effect geometries; lower radial segments; no runtime image textures.' };
spec.assumptions = ['GPT Image 2 turn-sheet is visual evidence only.', 'Archived v1 pivots, sockets, capsule count, effect positions and reset state are frozen.', 'Visual exaggeration remains inside the archived total envelope.'];
spec.risks = ['Transparent globe must not cause outline clumping.', 'Capsule prizes must remain contained.', 'Cranks and chute must stay attached to frozen pivots.', 'Output capsule trajectory must remain unchanged.'];
spec.sculptPipeline.passOrder = ['blockout', 'structural-pass', 'form-refinement', 'material-pass', 'lighting-pass', 'interaction-pass', 'optimization-pass'];
spec.buildPasses = spec.sculptPipeline.passOrder.map((id) => ({ id, status: 'pending', acceptanceCriteria: [`${id} visual and runtime contract evidence recorded`] }));
spec.sculptPipeline.currentPass = 'blockout'; spec.sculptPipeline.completedPasses = []; spec.sculptPipeline.lastCompletedPass = null; spec.sculptPipeline.blockedReason = ''; spec.sculptPipeline.nextRequiredEvidence = ['front blockout render', 'three-quarter blockout render'];
spec.reviewHistory = []; spec.visualEvidence = [];

await writeFile(specPath, `${JSON.stringify(spec, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ specPath, components: spec.componentTree.length, materials: spec.materials.length, details: details.length, repetitions: spec.repetitionSystems.length }, null, 2));

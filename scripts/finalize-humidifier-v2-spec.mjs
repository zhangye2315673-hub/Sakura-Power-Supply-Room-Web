import { mkdir, readFile, writeFile } from 'node:fs/promises';

const sourcePath = 'artifacts/img2threejs/humidifier/humidifier-sculpt-spec.json';
const outputPath = 'docs/sculpt-specs-v2/humidifier/object-sculpt-spec.json';
const spec = JSON.parse(await readFile(sourcePath, 'utf8'));
const views = ['front', 'side', 'back', 'three-quarter'];

const component = (id, name, level, role, parent, material, features, primitive = 'lathe') => {
  const item = structuredClone(spec.componentTree[0]);
  item.id = id; item.name = name; item.level = level; item.role = role; item.parent = parent;
  item.material = material; item.materialLayers = [material]; item.primitive = primitive;
  item.topologyClass = primitive === 'lathe' || primitive === 'curve-sweep' ? 'continuous-sculpt' : 'assembled-solid';
  item.topologyRationale = `${name} uses ${primitive} to preserve the observed low-poly volume and independent runtime ownership.`;
  item.geometryDescriptor.topologyIntent = `${name} is a named independent procedural part with deterministic transforms.`;
  item.geometryDescriptor.edgeTreatment = { type: 'faceted chamfer', bevelRadius: level === 'macro' ? 0.06 : 0.025, segments: 1 };
  item.parent = parent;
  item.attachment = parent ? { parentSocket: parent, localStart: [0, 0, 0], localEnd: [0, 0.03, 0], contactType: 'overlap', overlap: 0.03, gapTolerance: 0.005 } : null;
  item.localFeatures = features;
  item.details = features.map((feature) => ({ id: feature, kind: 'contour', evidenceRefs: ['front-view', 'side-view', 'back-view'] }));
  item.evidenceRefs = ['front-view', 'side-view', 'back-view'];
  item.fidelityTier = level === 'macro' ? 'blockout' : level === 'meso' ? 'structural-pass' : 'form-refinement';
  const palette = {
    'cream-shell': ['rgba(243, 237, 223, 1)', 'rgba(255, 246, 231, 1)'],
    'cream-highlight': ['rgba(255, 246, 231, 1)', 'rgba(243, 237, 223, 1)'],
    'Sakura-accent': ['rgba(232, 167, 183, 1)', 'rgba(194, 116, 143, 1)'],
    'cool-violet': ['rgba(91, 79, 102, 1)', 'rgba(119, 113, 128, 1)'],
    'transparent-reservoir': ['rgba(232, 242, 240, 0.62)', 'rgba(184, 227, 223, 0.35)'],
    'transparent-water': ['rgba(184, 227, 223, 0.35)', 'rgba(139, 221, 228, 0.3)'],
    'weather-volume': ['rgba(217, 238, 237, 0.48)', 'rgba(83, 97, 114, 0.34)'],
    'weather-light': ['rgba(255, 216, 77, 1)', 'rgba(255, 240, 156, 1)'],
  };
  const colors = palette[material] ?? ['rgba(128, 128, 128, 1)', 'rgba(96, 96, 96, 1)'];
  item.colorMaterialRecipe = { dominantAlbedo: colors[0], secondaryAlbedo: colors[1], materialClass: material === 'cool-violet' ? 'rubber' : material.includes('transparent') || material.includes('weather') ? 'glass' : 'plastic', materialClassConfidence: 0.9, roughness: material.includes('transparent') ? 0.25 : 0.62, toonBands: 3 };
  item.actionProfile.destruction.fractureGroup = parent ?? id;
  return item;
};

spec.targetName = 'SAKURA Humidifier v2';
spec.targetId = 'humidifier-v2';
spec.sourceImage = 'references/intake-v2/humidifier/views/front.png';
spec.sourceImages = views.map((view) => `references/intake-v2/humidifier/views/${view}.png`);
spec.suitability = 'conditional';
spec.scores = { object_isolation: 3, silhouette_readability: 3, depth_inference: 3, primitive_decomposition: 3, material_procedurality: 3, occlusion_risk: 2, interaction_fit: 3 };
spec.preSpecAssessment.objectClass = {
  primaryType: 'compact tabletop humidifier with model-owned weather performance rig', primaryDomain: 'object',
  formLanguage: ['exaggerated-low-poly', 'twelve-sided-lathe-shell', 'faceted-Sakura-toon', 'stable-uneven-ink'],
  structureKind: ['stacked-shell-reservoir', 'frozen-pivot-and-socket-rig'], motionPotential: ['rotary nozzle', 'dial turn', 'mist plume', 'storm cloud', 'rain'],
  materialFamilies: ['cream molded shell', 'Sakura accent', 'translucent water tank', 'cool-violet metal/rubber'],
  notes: 'Four archived v1 runtime views are admitted as conditional fallback evidence. They are not GPT Image 2 output. The archived rig contract is authoritative.',
};
spec.preSpecAssessment.complexity = { tier: 'complex', scores: { silhouetteComplexity: 3, componentCount: 3, hierarchyDepth: 3, repetitionDensity: 3, materialLayerCount: 3, localDetailDensity: 3, occlusionRisk: 3, actionReadinessNeed: 3 }, estimatedCounts: { macroComponents: 4, mesoComponents: 10, microFeatureGroups: 8, materialLayers: 7, repetitionSystems: 5 }, reasoning: ['The body is simple but the frozen model-owned weather rig, repeated mist/rain volumes and transparent layering require a complex action-ready contract.'] };
spec.preSpecAssessment.specDepthDecision = { requiredDepth: 'complex', minimumComponentLevels: ['macro', 'meso', 'micro'], needsRepetitionSystems: true, needsMaterialLocalOverrides: true, needsMultipleReviewViews: true, needsActionReadyHierarchy: true, rationale: 'The animation contact points and transparent weather volumes must be independently verified.' };
const detailDefs = [
  ['humidifier-detail-1', 'Twelve-sided lower shell narrows through a pinched waist.', 'lower-body-shell'],
  ['humidifier-detail-2', 'Separate Sakura accent rail stabilizes the floor silhouette.', 'bottom-accent-rail'],
  ['humidifier-detail-3', 'Oversized transparent reservoir has broad planar shoulders.', 'reservoir-shell'],
  ['humidifier-detail-4', 'Tank-body seam remains continuous around all twelve sides.', 'tank-seam'],
  ['humidifier-detail-5', 'Enlarged crown outlet is centered on the frozen outlet pivot.', 'outlet-stack'],
  ['humidifier-detail-6', 'Open nozzle ring exposes the mist socket without moving it.', 'outlet-stack'],
  ['humidifier-detail-7', 'Oversized front panel frames a twelve-sided rotary dial.', 'control-panel'],
  ['humidifier-detail-8', 'Water-drop badge and status dot remain separated.', 'control-detail'],
  ['humidifier-detail-9', 'Rear service panel contains eight repeated vertical vents.', 'rear-service'],
  ['humidifier-detail-10', 'Rear drain cover remains a separate detachable module.', 'rear-service'],
  ['humidifier-detail-11', 'Four low feet preserve archived ground contact.', 'foot-array'],
  ['humidifier-detail-12', 'Three water glints remain inside the reservoir.', 'water-volume'],
  ['humidifier-detail-13', 'Eighteen four-lobe mist volumes start at the real outlet socket.', 'mist-rig'],
  ['humidifier-detail-14', 'Nine irregular low-poly cloud lobes form the storm body.', 'weather-cloud-rig'],
  ['humidifier-detail-15', 'Thirty-six lathed drops remain volumetric and target the machine.', 'rain-rig'],
  ['humidifier-detail-16', 'Solid shell parts use three stable uneven outline tiers.', 'outline-system'],
];
spec.preSpecAssessment.detailInventory = {
  scanMethod: 'admitted four-view inspection plus runtime-node inventory',
  targetMinDetails: 16,
  note: 'Every item maps to a component local feature; transparent weather volumes are excluded from thick outlines.',
  details: detailDefs.map(([id, description, ref], index) => ({
    id, kind: index > 11 ? 'ridge' : 'contour', description,
    region: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' },
    scale: index < 4 ? 'macro' : index < 12 ? 'meso' : 'micro', affects: 'silhouette/material/interaction',
    mapsTo: { type: 'component.localFeatures', ref }, evidenceRef: index === 8 || index === 9 ? 'back-view' : 'front-view',
    confidence: index > 11 ? 0.99 : 0.94,
  })),
};
spec.qualityContract.qualityBar = 'complex';
spec.qualityContract.definitionOfDone = [
  'The v2 humidifier preserves the archived package, ground, frozen pivots, sockets and weather trajectories while improving the body, reservoir, crown and control silhouette.',
  'Solid parts use 0.0048/0.0041/0.0033 stable ink with 0.18 object-space variation; transparent water, mist, cloud lighting and rain do not receive thick outlines.',
];
spec.qualityContract.minimumSpecDepth = { macroComponents: 4, mesoComponents: 9, microFeatureGroups: 6, materialLayers: 5, repetitionSystems: 4, reviewViewpoints: 7 };
spec.qualityTargets.targetFidelity = 0.8;
spec.qualityTargets.mustMatch = ['archived v1 package and ground contact', 'frozen outlet, dial, mist, cloud and rain runtime transforms', 'recognizable reservoir, crown outlet and front control silhouette', 'three stable solid-part outline tiers'];
spec.qualityTargets.reviewViewpoints = ['front', 'side', 'back', 'three-quarter', 'runtime-startup', 'runtime-climax', 'runtime-wind-down'];
spec.featureReviewTargets = [
  { id: 'humidifier-silhouette', name: 'Faceted body and oversized reservoir silhouette', tier: 'critical', passIds: ['blockout', 'form-refinement'], minimumScore: 0.82, mustPass: true, componentRefs: ['lower-body-shell', 'reservoir-shell'], evidenceRefs: ['front-view', 'side-view'] },
  { id: 'humidifier-identity', name: 'Crown outlet, dial, badge and rear service identity', tier: 'critical', passIds: ['structural-pass', 'material-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['outlet-stack', 'control-panel', 'rear-service'], evidenceRefs: ['front-view', 'back-view'] },
  { id: 'humidifier-runtime', name: 'Frozen outlet and weather animation contact', tier: 'critical', passIds: ['interaction-pass'], minimumScore: 0.9, mustPass: true, componentRefs: ['mist-rig', 'weather-cloud-rig', 'rain-rig'], evidenceRefs: ['runtime-contract'] },
  { id: 'humidifier-ink', name: 'Stable uneven ink with transparent exclusions', tier: 'critical', passIds: ['material-pass', 'lighting-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['outline-system'], evidenceRefs: ['three-quarter-view'] },
];
spec.coordinateFrame = { handedness: 'right-handed', upAxis: '+Y', forwardAxis: '+Z', origin: 'archived appliance root; floor package minY remains -0.35 because hidden weather rest geometry is frozen', units: 'Three.js world units' };
spec.silhouette = { primaryMass: 'twelve-sided tapered lower shell plus oversized translucent reservoir', secondaryMasses: ['crown outlet', 'front control panel', 'bottom accent rail'], negativeSpaces: ['outlet opening', 'rear vent gaps'], symmetry: 'radial shell with front/rear functional asymmetry', proportionNotes: 'All visible geometry remains within the archived 2.34 x 3.981833 x 2.519 package.' };
spec.viewEvidence = [
  ...views.map((view) => ({ id: `${view}-view`, view, imagePath: `references/intake-v2/humidifier/views/${view}.png`, imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['archived v1 silhouette, component placement, palette and framing'], confidence: view === 'three-quarter' ? 0.9 : 0.96 })),
  { id: 'runtime-contract', view: 'runtime', imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['frozen parent paths, local transforms, sockets, bounds and exact reset'], confidence: 0.99 },
];
spec.componentTree = [
  component('root', 'Humidifier root', 'macro', 'assembly', null, 'cream-shell', ['root-package'], 'box'),
  component('lower-body-shell', 'Faceted lower shell', 'macro', 'enclosure', 'root', 'cream-shell', ['humidifier-detail-1']),
  component('reservoir-shell', 'Transparent reservoir shell', 'macro', 'water enclosure', 'root', 'transparent-reservoir', ['humidifier-detail-3'], 'lathe'),
  component('weather-performance-rig', 'Weather performance rig', 'macro', 'frozen animation assembly', 'root', 'weather-volume', ['weather-rig-contract'], 'instanced-cluster'),
  component('bottom-accent-rail', 'Bottom accent rail', 'meso', 'base trim', 'lower-body-shell', 'Sakura-accent', ['humidifier-detail-2']),
  component('tank-seam', 'Reservoir seam', 'meso', 'assembly seam', 'reservoir-shell', 'cool-violet', ['humidifier-detail-4'], 'torus'),
  component('outlet-stack', 'Crown outlet stack', 'meso', 'mist outlet', 'reservoir-shell', 'cream-highlight', ['humidifier-detail-5', 'humidifier-detail-6'], 'cylinder'),
  component('control-panel', 'Front control panel', 'meso', 'control housing', 'lower-body-shell', 'cream-highlight', ['humidifier-detail-7']),
  component('control-detail', 'Dial badge and lamp', 'micro', 'control detail', 'control-panel', 'Sakura-accent', ['humidifier-detail-8'], 'cylinder'),
  component('rear-service', 'Rear service bank', 'meso', 'service access', 'lower-body-shell', 'cream-highlight', ['humidifier-detail-9', 'humidifier-detail-10'], 'box'),
  component('foot-array', 'Four support feet', 'micro', 'floor support', 'lower-body-shell', 'cool-violet', ['humidifier-detail-11'], 'cylinder'),
  component('water-volume', 'Internal water and glints', 'meso', 'transparent water', 'reservoir-shell', 'transparent-water', ['humidifier-detail-12'], 'lathe'),
  component('mist-rig', 'Outlet mist volume rig', 'meso', 'animated mist', 'outlet-stack', 'weather-volume', ['humidifier-detail-13'], 'instanced-cluster'),
  component('weather-cloud-rig', 'Storm cloud rig', 'meso', 'animated cloud', 'weather-performance-rig', 'weather-volume', ['humidifier-detail-14'], 'instanced-cluster'),
  component('lightning-rig', 'Internal flash and bolt', 'micro', 'animated lightning', 'weather-cloud-rig', 'weather-light', ['closed-volume-lightning'], 'tube'),
  component('rain-rig', 'Volumetric rain rig', 'meso', 'animated rain', 'weather-performance-rig', 'transparent-water', ['humidifier-detail-15'], 'instanced-cluster'),
  component('outline-system', 'Three-tier ink system', 'micro', 'solid-part silhouette ink', 'root', 'cool-violet', ['humidifier-detail-16'], 'box'),
  component('rear-vent-array', 'Eight rear vents', 'micro', 'repeated vent relief', 'rear-service', 'cool-violet', ['rear-vent-repeat'], 'instanced-cluster'),
];
const baseMaterial = structuredClone(spec.materials[0]);
const material = (id, name, color, roughness, transparent = false) => {
  const item = structuredClone(baseMaterial); item.id = id; item.name = name; item.baseColor = color; item.color = color;
  item.albedo.dominant = color; item.albedo.secondary = [color]; item.roughness.base = roughness;
  item.localOverrides = [{ id: `${id}-toon-response`, region: 'named material zone', response: transparent ? 'depth-write disabled transparent Toon response without thick outline' : 'two-to-three Toon bands with cool-violet shadow tint', evidenceRefs: ['front-view', 'three-quarter-view'] }];
  item.notes = transparent ? 'Transparent procedural material; no runtime image texture and no thick outline.' : 'Solid procedural Toon material with stable object-space ink.';
  item.referencePbr = { usable: true, confidence: 0.8, estimatedFidelity: 0.8, sourceImage: spec.sourceImage, maps: { albedo: { path: 'procedural-solid-albedo' }, roughness: { path: `procedural-${id}-roughness` }, height: { path: `procedural-${id}-height` }, normal: { path: `procedural-${id}-normal` }, ao: { path: `procedural-${id}-ao` } }, limitation: 'Conditional fallback screenshots provide palette evidence; independent procedural channels implement the approved non-textured Toon look.' };
  return item;
};
spec.materials = [
  material('cream-shell', 'Warm cream shell', '#F3EDDF', 0.72), material('cream-highlight', 'Cream highlight', '#FFF6E7', 0.66),
  material('Sakura-accent', 'Sakura accent', '#E8A7B7', 0.68), material('cool-violet', 'Cool violet structure', '#5B4F66', 0.74),
  material('transparent-reservoir', 'Translucent reservoir', '#E8F2F0', 0.28, true), material('transparent-water', 'Water volume', '#B8E3DF', 0.18, true),
  material('weather-volume', 'Mist and cloud volume', '#D9EEED', 0.82, true), material('weather-light', 'Lightning emissive', '#FFD84D', 0.42, true),
];
spec.repetitionSystems = [
  { id: 'rear-vents', name: 'Rear vent bank', componentRef: 'rear-vent-array', count: 8, distribution: 'eight evenly spaced vertical slots', geometry: 'shared rounded-box geometry', material: 'cool-violet', evidenceRefs: ['back-view'] },
  { id: 'feet', name: 'Support feet', componentRef: 'foot-array', count: 4, distribution: 'radial lower corners', geometry: 'shared eight-sided cylinders', material: 'cool-violet', evidenceRefs: ['side-view'] },
  { id: 'mist-volumes', name: 'Mist volumes', componentRef: 'mist-rig', count: 18, distribution: 'frozen lanes at outlet socket', geometry: 'four irregular icosahedron lobes per pivot', material: 'weather-volume', evidenceRefs: ['runtime-contract'] },
  { id: 'cloud-lobes', name: 'Storm cloud lobes', componentRef: 'weather-cloud-rig', count: 9, distribution: 'frozen broad cloud silhouette', geometry: 'irregular icosahedra', material: 'weather-volume', evidenceRefs: ['runtime-contract'] },
  { id: 'rain-drops', name: 'Volumetric rain drops', componentRef: 'rain-rig', count: 36, distribution: 'frozen phase and target lanes', geometry: 'shared ten-sided lathe drop', material: 'transparent-water', evidenceRefs: ['runtime-contract'] },
];
spec.actionReadiness = { hierarchyReady: true, pivotStrategy: 'Existing named pivots and sockets are frozen and published through root.userData.sculptRuntime.', sockets: ['humidifier-mist-outlet-socket', 'humidifier-control-dial-socket', 'humidifier-rear-service-socket'], colliders: ['humidifier-body-envelope'], destructionGroups: ['humidifier-shell-assembly', 'humidifier-reservoir-assembly', 'humidifier-outlet-assembly'], interactionNotes: ['No animation controller changes; v2 geometry remains under existing runtime anchors.', 'Transparent weather parts remain excluded from thick outline hulls.'] };
spec.assumptions = ['Archived runtime views are conditional fallback evidence and not GPT Image 2 output.', 'The archived v1 bounds, ground, parent paths, local transforms and socket directions are immutable.', 'Hidden atomizer, ducting, wiring and fasteners remain omitted.'];
spec.risks = ['Transparent tank depth sorting can soften the inner water boundary.', 'The hidden rest-state weather geometry controls the archived negative ground value and must remain unchanged.', 'The low-poly faceting is a deliberate stylistic approximation of the softer v1 reference.'];
spec.performanceBudget = { qualityPriority: 'stylized-runtime', targetTriangles: 20000, maxDrawCalls: 150, textureSize: 0, fpsTarget: 60, optimizationPolicy: 'Reuse repeated weather geometry and remain at or below 1.35x archived triangles; no runtime image textures.' };
spec.sculptPipeline.passOrder = ['blockout', 'structural-pass', 'form-refinement', 'material-pass', 'lighting-pass', 'interaction-pass', 'optimization-pass'];
spec.buildPasses = spec.buildPasses.filter((pass) => spec.sculptPipeline.passOrder.includes(pass.id)).sort((a, b) => spec.sculptPipeline.passOrder.indexOf(a.id) - spec.sculptPipeline.passOrder.indexOf(b.id));
spec.lightingFromPhoto = [
  'warm upper-left directional key intensity 1.4 with broad cream shell highlight',
  'mint hemisphere fill intensity 0.65 revealing transparent reservoir facets',
  'cool violet rear-right rim intensity 0.8 separating crown and shell',
  'ACES tone mapping exposure 1.0 on pale blue-gray background',
  'soft PCF contact shadow under the four low feet',
];
spec.sculptPipeline.currentPass = 'blockout'; spec.sculptPipeline.completedPasses = []; spec.sculptPipeline.lastCompletedPass = null; spec.sculptPipeline.blockedReason = ''; spec.sculptPipeline.nextRequiredEvidence = ['front and three-quarter blockout renders'];
spec.selfCorrectLoop.reviewAfterPasses = spec.sculptPipeline.passOrder; spec.selfCorrectLoop.visualAcceptance.threshold = 0.8;
spec.reviewHistory = []; spec.visualEvidence = [];

await mkdir('docs/sculpt-specs-v2/humidifier', { recursive: true });
await writeFile(outputPath, `${JSON.stringify(spec, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, components: spec.componentTree.length, materials: spec.materials.length, details: spec.preSpecAssessment.detailInventory.details.length, repetitions: spec.repetitionSystems.length }, null, 2));

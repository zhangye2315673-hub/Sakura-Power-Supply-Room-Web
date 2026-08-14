import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';

const basePath = 'docs/sculpt-specs-v2/humidifier/object-sculpt-spec.json';
const outputPath = 'docs/sculpt-specs-v2/phone/object-sculpt-spec.json';
const spec = JSON.parse(await readFile(basePath, 'utf8'));
const views = ['front', 'side', 'back', 'three-quarter'];
const archive = 'docs/history/appliance-model-v1-2026-08-11/screenshots/models/phone';
await mkdir('references/intake-v2/phone/views', { recursive: true });
for (const view of views) await copyFile(`${archive}/idle-${view}.png`, `references/intake-v2/phone/views/${view}.png`);

const component = (id, name, level, role, parent, material, features, primitive = 'box') => {
  const item = structuredClone(spec.componentTree[0]);
  Object.assign(item, { id, name, level, role, parent, material, materialLayers: [material], primitive });
  item.topologyClass = ['tube', 'torus'].includes(primitive) ? 'continuous-sculpt' : 'assembled-solid';
  item.topologyRationale = `${name} uses ${primitive} as a named low-poly runtime part while preserving archived anchors.`;
  item.geometryDescriptor.topologyIntent = 'low-poly hard-surface game prop with deterministic local transforms';
  item.geometryDescriptor.edgeTreatment = { type: 'single-segment planar chamfer', bevelRadius: level === 'macro' ? 0.05 : 0.018, segments: 1 };
  item.attachment = parent ? { parentSocket: parent, localStart: [0, 0, 0], localEnd: [0, 0.02, 0], contactType: 'overlap', overlap: 0.02, gapTolerance: 0.005 } : null;
  item.localFeatures = features;
  item.details = features.map((feature) => ({ id: feature, kind: 'contour', evidenceRefs: ['front-view', 'three-quarter-view', 'runtime-contract'] }));
  item.evidenceRefs = ['front-view', 'side-view', 'back-view', 'runtime-contract'];
  item.fidelityTier = level === 'macro' ? 'blockout' : level === 'meso' ? 'structural-pass' : 'form-refinement';
  const palette = {
    'cream-shell': ['rgba(247,240,228,1)', 'rgba(231,219,226,1)'],
    'Sakura-accent': ['rgba(232,167,183,1)', 'rgba(151,91,118,1)'],
    'screen-violet': ['rgba(77,83,106,1)', 'rgba(37,39,51,1)'],
    'call-ui': ['rgba(121,230,176,1)', 'rgba(241,127,159,1)'],
    'cool-metal': ['rgba(170,167,178,1)', 'rgba(81,71,89,1)'],
  };
  const colors = palette[material] ?? ['rgba(128,128,128,1)', 'rgba(96,96,96,1)'];
  item.colorMaterialRecipe = { dominantAlbedo: colors[0], secondaryAlbedo: colors[1], materialClass: material === 'cool-metal' ? 'metal' : material === 'screen-violet' ? 'glass' : 'plastic', materialClassConfidence: 0.9, roughness: material === 'screen-violet' ? 0.34 : 0.68, toonBands: 3 };
  item.actionProfile.destruction.fractureGroup = parent ?? id;
  return item;
};

spec.targetName = 'SAKURA Phone v2';
spec.targetId = 'phone-v2';
spec.sourceImage = 'references/intake-v2/phone/views/front.png';
spec.sourceImages = views.map((view) => `references/intake-v2/phone/views/${view}.png`);
spec.suitability = 'conditional';
spec.scores = { object_isolation: 3, silhouette_readability: 3, depth_inference: 3, primitive_decomposition: 3, material_procedurality: 3, occlusion_risk: 2, interaction_fit: 3 };
spec.preSpecAssessment.objectClass = {
  primaryType: 'original stylized smartphone with model-owned incoming-call performance rig', primaryDomain: 'object',
  formLanguage: ['faceted-handheld', 'exaggerated-low-poly', 'Sakura-toon', 'stable-uneven-ink'],
  structureKind: ['layered-slab', 'frozen-pivot-and-socket-rig'], motionPotential: ['body lift', 'high-frequency vibration', 'call UI pulse', 'volumetric reminders'],
  materialFamilies: ['warm cream polymer', 'Sakura accent polymer', 'cool-violet screen', 'painted metal', 'emissive call UI'],
  notes: 'No independent source artwork exists. Archived runtime views are conditional design evidence, not GPT Image 2 output or image-exact reconstruction.',
};
spec.preSpecAssessment.complexity = { tier: 'complex', scores: { silhouetteComplexity: 3, componentCount: 3, hierarchyDepth: 3, repetitionDensity: 3, materialLayerCount: 3, localDetailDensity: 3, occlusionRisk: 2, actionReadinessNeed: 3 }, estimatedCounts: { macroComponents: 4, mesoComponents: 9, microFeatureGroups: 10, materialLayers: 5, repetitionSystems: 6 }, reasoning: ['The slab is simple, but the complete incoming-call UI, repeated volumetric feedback and frozen action hierarchy require a complex contract.'] };
spec.preSpecAssessment.specDepthDecision = { requiredDepth: 'complex', minimumComponentLevels: ['macro', 'meso', 'micro'], needsRepetitionSystems: true, needsMaterialLocalOverrides: true, needsMultipleReviewViews: true, needsActionReadyHierarchy: true, rationale: 'Every call control, side control, I/O and feedback anchor must remain independently testable.' };
const detailDefs = [
  ['phone-detail-1', 'Eight-corner perimeter rail defines the archived handset package.', 'handset-shell'],
  ['phone-detail-2', 'Four hexagonal guard caps exaggerate the handheld silhouette.', 'corner-guard-array'],
  ['phone-detail-3', 'Cream rear shell and narrow center spine form separate planes.', 'rear-shell'],
  ['phone-detail-4', 'Front bezel contains oversized low-poly glass, crown and chin.', 'screen-assembly'],
  ['phone-detail-5', 'Earpiece and front camera remain discrete at the screen crown.', 'screen-details'],
  ['phone-detail-6', 'Avatar, MOMO label and CALLING prompt occupy the frozen UI pivot.', 'incoming-call-ui'],
  ['phone-detail-7', 'Answer and hang-up wells retain separate pivots and sockets.', 'call-controls'],
  ['phone-detail-8', 'Right power and left paired volume keys retain archived travel axes.', 'side-controls'],
  ['phone-detail-9', 'Bottom Type-C recess, tongue, five speakers and microphone remain independent.', 'bottom-io'],
  ['phone-detail-10', 'Chamfered rear camera island enlarges the recognizable camera mass.', 'camera-island'],
  ['phone-detail-11', 'Two twelve-sided lens stacks retain frozen lens pivots and sockets.', 'camera-lenses'],
  ['phone-detail-12', 'Five-petal brand-neutral Sakura motif replaces a generic rear mark.', 'rear-motif'],
  ['phone-detail-13', 'Three torus wave rings remain closed volumetric call feedback.', 'feedback-rig'],
  ['phone-detail-14', 'Four vibration arcs and six signal arcs use closed TubeGeometry.', 'feedback-rig'],
  ['phone-detail-15', 'Eight notification points and six message particles remain model-owned.', 'feedback-rig'],
  ['phone-detail-16', 'Main, structure and detail ink use stable 0.18 object-space variation.', 'outline-system'],
];
spec.preSpecAssessment.detailInventory = { scanMethod: 'four archived runtime views plus frozen hierarchy audit', targetMinDetails: 16, note: 'Every item maps to a component or material entry; no pixel-exact source claim is made.', details: detailDefs.map(([id, description, componentRef], index) => ({ id, kind: 'contour', description, region: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, scale: index < 5 ? 'macro' : index < 12 ? 'meso' : 'micro', affects: 'silhouette/material/interaction', mapsTo: { type: 'component.localFeatures', ref: componentRef }, evidenceRef: index < 5 ? 'front-view' : index < 12 ? 'back-view' : 'runtime-contract', confidence: index < 5 ? 0.92 : 0.98 })) };
spec.preSpecAssessment.unknownsToResolveBeforeImplementation = [];
spec.preSpecAssessment.sourceImage = spec.sourceImage;
spec.qualityContract.qualityBar = 'complex';
spec.qualityContract.definitionOfDone = [
  'Phone v2 preserves archived package, ground, pivots, sockets and call trajectories while strengthening low-poly identity.',
  'Solid parts use 0.0048/0.0041/0.0033 stable ink with 0.18 variation; call effects own no outline meshes.',
];
spec.qualityContract.minimumSpecDepth = { macroComponents: 4, mesoComponents: 7, microFeatureGroups: 6, materialLayers: 5, repetitionSystems: 5, reviewViewpoints: 0 };
spec.qualityContract.featureGroups = structuredClone(JSON.parse(await readFile(basePath, 'utf8')).qualityContract.featureGroups);
spec.qualityTargets = { silhouette: 0.84, proportions: 0.84, structure: 0.9, materials: 0.84, actionReadiness: 0.96, outline: 0.86 };
spec.featureReviewTargets = [
  { id: 'phone-silhouette', name: 'Faceted handheld silhouette and enlarged feature masses', tier: 'critical', passIds: ['blockout', 'form-refinement'], minimumScore: 0.82, mustPass: true, componentRefs: ['handset-shell', 'corner-guard-array', 'camera-island'], evidenceRefs: ['front-view', 'back-view', 'three-quarter-view'] },
  { id: 'phone-identity', name: 'Readable smartphone screen, side controls, I/O and dual camera identity', tier: 'critical', passIds: ['structural-pass', 'material-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['screen-assembly', 'side-controls', 'bottom-io', 'camera-lenses'], evidenceRefs: ['front-view', 'side-view', 'back-view'] },
  { id: 'phone-runtime', name: 'Frozen call UI, feedback and handset motion contact', tier: 'critical', passIds: ['interaction-pass'], minimumScore: 0.9, mustPass: true, componentRefs: ['incoming-call-ui', 'call-controls', 'feedback-rig'], evidenceRefs: ['runtime-contract'] },
  { id: 'phone-ink', name: 'Stable three-tier uneven ink without outlined call effects', tier: 'critical', passIds: ['material-pass', 'lighting-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['outline-system'], evidenceRefs: ['three-quarter-view'] },
];
spec.coordinateFrame = { handedness: 'right-handed', upAxis: '+Y', forwardAxis: '+Z', origin: 'archived phone root', units: 'Three.js world units' };
spec.referenceCamera = { projection: 'perspective', view: 'three-quarter', confidence: 0.9, notes: 'Review camera follows the existing model-review framing; not solved as a source-photo camera.' };
spec.silhouette = { primaryMass: 'tall eight-corner slab inside archived package', secondaryMasses: ['four guard caps', 'front screen stack', 'rear camera island'], negativeSpaces: ['Type-C recess', 'speaker perforations', 'lens centers'], symmetry: 'bilateral shell with asymmetric controls and diagonal dual camera', proportionNotes: 'All world-space package dimensions exactly equal archived v1 in automated verification.' };
spec.viewEvidence = [
  ...views.map((view) => ({ id: `${view}-view`, view, imagePath: `references/intake-v2/phone/views/${view}.png`, imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['archived original-design silhouette, palette, part placement and framing'], confidence: view === 'three-quarter' ? 0.9 : 0.94 })),
  { id: 'runtime-contract', view: 'runtime', imagePath: `${archive}/active-climax-2.8.png`, imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['frozen parent paths, local transforms, sockets, bounds, effect ownership and reset'], confidence: 0.99 },
];
spec.componentTree = [
  component('root', 'Phone root', 'macro', 'assembly', null, 'cream-shell', ['root-package']),
  component('handset-shell', 'Faceted handset shell', 'macro', 'enclosure', 'root', 'Sakura-accent', ['phone-detail-1']),
  component('screen-assembly', 'Layered screen assembly', 'macro', 'display enclosure', 'handset-shell', 'screen-violet', ['phone-detail-4']),
  component('feedback-rig', 'Incoming-call performance rig', 'macro', 'frozen animation assembly', 'root', 'call-ui', ['phone-detail-13', 'phone-detail-14', 'phone-detail-15'], 'instanced-cluster'),
  component('corner-guard-array', 'Four faceted guard caps', 'meso', 'protective silhouette', 'handset-shell', 'cool-metal', ['phone-detail-2'], 'instanced-cluster'),
  component('rear-shell', 'Cream rear shell and spine', 'meso', 'rear enclosure', 'handset-shell', 'cream-shell', ['phone-detail-3']),
  component('screen-details', 'Screen crown details', 'micro', 'earpiece and camera', 'screen-assembly', 'cool-metal', ['phone-detail-5']),
  component('incoming-call-ui', 'Incoming-call screen UI', 'meso', 'animated screen content', 'screen-assembly', 'call-ui', ['phone-detail-6']),
  component('call-controls', 'Answer and hang-up controls', 'meso', 'animated call actions', 'incoming-call-ui', 'call-ui', ['phone-detail-7']),
  component('side-controls', 'Power and volume controls', 'meso', 'physical controls', 'handset-shell', 'cool-metal', ['phone-detail-8']),
  component('bottom-io', 'Type-C and acoustic I/O', 'meso', 'connector bank', 'handset-shell', 'cool-metal', ['phone-detail-9']),
  component('camera-island', 'Chamfered camera island', 'meso', 'rear camera housing', 'rear-shell', 'Sakura-accent', ['phone-detail-10']),
  component('camera-lenses', 'Dual camera stacks', 'micro', 'camera optics', 'camera-island', 'cool-metal', ['phone-detail-11'], 'cylinder'),
  component('rear-motif', 'Five-petal Sakura motif', 'micro', 'brand-neutral identity mark', 'rear-shell', 'Sakura-accent', ['phone-detail-12'], 'instanced-cluster'),
  component('outline-system', 'Three-tier stable ink system', 'micro', 'solid-part silhouette ink', 'root', 'screen-violet', ['phone-detail-16']),
];
const baseMaterial = structuredClone(spec.materials[0]);
const material = (id, name, color, roughness, materialClass) => {
  const item = structuredClone(baseMaterial); Object.assign(item, { id, name, baseColor: color, color });
  item.albedo.dominant = color; item.albedo.secondary = [color]; item.roughness.base = roughness;
  item.localOverrides = [{ id: `${id}-toon-response`, region: 'named material zone', response: 'two-to-three Toon bands with cool-violet shadow tint and stable solid-part ink', evidenceRefs: ['front-view', 'three-quarter-view'] }];
  item.notes = 'Procedural solid Toon material; no runtime image texture.';
  item.referencePbr = { usable: true, confidence: 0.8, estimatedFidelity: 0.8, sourceImage: spec.sourceImage, maps: { albedo: { path: 'procedural-solid-albedo' }, roughness: { path: `procedural-${id}-roughness` }, height: { path: `procedural-${id}-height` }, normal: { path: `procedural-${id}-normal` }, ao: { path: `procedural-${id}-ao` } }, limitation: 'Archived original-design renders provide palette evidence only; channels are independently procedural for the approved Toon look.' };
  item.finishClass = materialClass;
  return item;
};
spec.materials = [
  material('cream-shell', 'Warm cream shell', '#F7F0E4', 0.72, 'plastic'),
  material('Sakura-accent', 'Sakura accent polymer', '#E8A7B7', 0.68, 'plastic'),
  material('screen-violet', 'Cool-violet screen glass', '#4D536A', 0.34, 'glass'),
  material('call-ui', 'Call UI accents', '#79E6B0', 0.54, 'plastic'),
  material('cool-metal', 'Cool gray-violet hardware', '#AAA7B2', 0.58, 'painted-metal'),
];
spec.repetitionSystems = [
  { id: 'corner-guards', name: 'Corner guard array', componentRef: 'corner-guard-array', count: 4, distribution: 'four handset corners', geometry: 'shared six-sided cylinder', material: 'cool-metal', evidenceRefs: ['front-view'] },
  { id: 'camera-lenses', name: 'Dual lens array', componentRef: 'camera-lenses', count: 2, distribution: 'diagonal on archived camera pivot', geometry: 'shared twelve-sided cylinder and torus', material: 'cool-metal', evidenceRefs: ['back-view'] },
  { id: 'speaker-holes', name: 'Speaker perforations', componentRef: 'bottom-io', count: 5, distribution: 'even row on bottom edge', geometry: 'shared eight-sided cylinder', material: 'screen-violet', evidenceRefs: ['side-view'] },
  { id: 'wave-rings', name: 'Stereo wave rings', componentRef: 'feedback-rig', count: 3, distribution: 'concentric frozen feedback root', geometry: 'closed torus volumes', material: 'call-ui', evidenceRefs: ['runtime-contract'] },
  { id: 'call-arcs', name: 'Vibration and signal arcs', componentRef: 'feedback-rig', count: 10, distribution: 'bilateral frozen animation lanes', geometry: 'closed TubeGeometry arcs', material: 'call-ui', evidenceRefs: ['runtime-contract'] },
  { id: 'notification-particles', name: 'Notification and message particles', componentRef: 'feedback-rig', count: 14, distribution: 'frozen orbital and rising lanes', geometry: 'icosahedra and rounded message volumes', material: 'call-ui', evidenceRefs: ['runtime-contract'] },
];
spec.actionReadiness = { hierarchyReady: true, pivotStrategy: 'All existing pivots and sockets retain exact local transforms and remain published through root.userData.sculptRuntime.', sockets: ['phone-body-socket', 'phone-screen-socket', 'phone-incoming-call-ui-socket', 'phone-call-answer-socket', 'phone-call-hangup-socket', 'phone-power-button-socket', 'phone-volume-button-socket', 'phone-bottom-io-socket', 'phone-usb-c-connection-socket', 'phone-rear-camera-island-socket', 'phone-camera-lens-1-socket', 'phone-camera-lens-2-socket'], colliders: ['phone-body'], destructionGroups: ['phone-shell-assembly', 'phone-camera-assembly', 'phone-call-feedback'], interactionNotes: ['No shared timeline or controller changes.', 'Call effects intentionally own no outline meshes.'] };
spec.assumptions = ['No independent phone artwork exists; this is a stylized original upgrade.', 'Archived runtime views are conditional fallback, not GPT Image 2 output.', 'Archived package, ground, parent paths, local transforms and socket directions are immutable.'];
spec.risks = ['Very thick outlines can close speaker and lens gaps at distant framing.', 'Call rings may dominate the small body at climax, so effect outlines remain disabled.', 'The more angular v2 silhouette deliberately departs from the soft v1 rectangle.'];
spec.localSpecSearch = { collection: 'core_3d', queries: ['stylized low poly smartphone rounded shell camera island runtime pivot socket', 'toon outline object-space stable variation game prop'], records: [
  { recordId: 'core.socket-pivot', sourceRefs: ['grimoire/glossary/3d_vocabulary.md#Animation, Physics, And Destruction', 'grimoire/readiness/action_rigging.md#Hierarchy Pattern'], appliedTo: ['frozen pivot and socket hierarchy'] },
  { recordId: 'core.runtime-hierarchy', sourceRefs: ['grimoire/readiness/action_rigging.md#Hierarchy Pattern'], appliedTo: ['runtime nodes, sockets, colliders and destruction groups'] },
  { recordId: 'core.topology-intent', sourceRefs: ['grimoire/glossary/3d_vocabulary.md#Geometry And Topology'], appliedTo: ['low-poly hard-surface topology classification'] },
] };
spec.performanceBudget = { qualityPriority: 'stylized-runtime', targetTriangles: 18000, maxDrawCalls: 120, textureSize: 0, fpsTarget: 60, optimizationPolicy: 'Stay below 1.35x archived triangles, reuse repeated geometry where practical and add no runtime textures.' };
spec.lightingFromPhoto = ['warm upper-left key for cream and Sakura planes', 'mint hemisphere fill for cool-violet screen separation', 'cool violet rear rim for camera and guard silhouette', 'ACES tone mapping at existing model-review exposure', 'soft contact shadow at archived ground'];
spec.proceduralStrategy = ['Extruded eight-corner slabs for primary shell planes.', 'Six-to-twelve sided cylinders and torus rings for deliberately faceted details.', 'Named meshes under frozen pivots for runtime compatibility.', 'Three-tier object-space outline variation on solid body parts only.'];
spec.animationAnchors = ['phone-handset-pivot', 'phone-incoming-call-ui-pivot', 'phone-call-answer-button-pivot', 'phone-call-hangup-button-pivot', 'phone-call-feedback-rig'];
spec.destructionAnchors = ['phone-shell-assembly', 'phone-camera-assembly', 'phone-call-feedback'];
spec.sculptPipeline.passOrder = ['blockout', 'structural-pass', 'form-refinement', 'material-pass', 'lighting-pass', 'interaction-pass', 'optimization-pass'];
spec.buildPasses = spec.buildPasses.filter((pass) => spec.sculptPipeline.passOrder.includes(pass.id)).sort((a, b) => spec.sculptPipeline.passOrder.indexOf(a.id) - spec.sculptPipeline.passOrder.indexOf(b.id));
spec.buildPasses.forEach((pass) => { pass.componentRefs = spec.componentTree.filter((item) => item.fidelityTier === pass.id || pass.id === 'interaction-pass' && ['incoming-call-ui', 'call-controls', 'feedback-rig'].includes(item.id) || pass.id === 'optimization-pass' && item.id === 'root').map((item) => item.id); if (!pass.componentRefs.length) pass.componentRefs = ['root']; pass.acceptance = [`${pass.id} evidence includes named phone v2 parts and admitted viewpoints`, 'critical feature thresholds remain satisfied']; });
spec.sculptPipeline.currentPass = 'blockout'; spec.sculptPipeline.completedPasses = []; spec.sculptPipeline.lastCompletedPass = null; spec.sculptPipeline.blockedReason = ''; spec.sculptPipeline.nextRequiredEvidence = ['front and three-quarter blockout renders'];
spec.selfCorrectLoop.reviewAfterPasses = spec.sculptPipeline.passOrder; spec.selfCorrectLoop.visualAcceptance.threshold = 0.8;
spec.reviewHistory = []; spec.visualEvidence = [];
await mkdir('docs/sculpt-specs-v2/phone', { recursive: true });
await writeFile(outputPath, `${JSON.stringify(spec, null, 2)}\n`);
await writeFile('references/intake-v2/phone/reference-status.json', `${JSON.stringify({ status: 'conditional-fallback', target: 'original SAKURA phone redesign', generationProvider: null, reason: 'OPENAI_API_KEY, COMFLY_API_KEY and COMFLY_KEY were absent at execution time', sources: views.map((view) => `views/${view}.png`), limitation: 'Archived v1 runtime views only; not GPT Image 2 output and not an image-exact reconstruction.' }, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, components: spec.componentTree.length, materials: spec.materials.length, details: detailDefs.length, repetitions: spec.repetitionSystems.length }, null, 2));

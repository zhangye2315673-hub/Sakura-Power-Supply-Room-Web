import { mkdir, readFile, writeFile } from 'node:fs/promises';

const path = 'docs/sculpt-specs-v2/smart-bin/object-sculpt-spec.json';
const generated = JSON.parse(await readFile('docs/sculpt-specs-v2/smart-bin/pre-spec-assessment.generated.json', 'utf8'));
const spec = JSON.parse(await readFile(path, 'utf8'));
const passes = ['blockout', 'structural-pass', 'form-refinement', 'material-pass', 'lighting-pass', 'interaction-pass', 'optimization-pass'];
const reference = 'references/intake-v2/smart-bin/views/three-quarter.png';
const render = 'artifacts/appliance-v2/smart-bin/evidence/models/smart-bin/render-off-three-quarter.png';
const comparison = 'artifacts/appliance-v2/smart-bin/review/smart-bin-reference-v2-four-view-comparison.png';
const diagnostics = 'artifacts/appliance-v2/smart-bin/diagnostics/smart-bin-v2-verification.json';
const assembly = 'artifacts/appliance-v2/smart-bin/assembly/part-coverage.json';
const staticBoard = 'artifacts/appliance-v2/smart-bin/final/smart-bin-v2-delivery-board.png';
const animationBoard = 'artifacts/appliance-v2/smart-bin/final/smart-bin-v2-animation-board.png';

spec.targetName = 'SAKURA Smart Bin v2';
spec.targetId = 'smart-bin-v2';
spec.sourceImage = reference;
spec.suitability = 'conditional';
spec.scores = { object_isolation: 3, silhouette_readability: 3, depth_inference: 3, primitive_decomposition: 3, material_procedurality: 3, occlusion_risk: 2, interaction_fit: 3 };
spec.preSpecAssessment = generated.preSpecAssessment;
spec.preSpecAssessment.objectClass = {
  primaryType: 'touchless low-poly smart waste bin with model-owned disposal performance rig',
  primaryDomain: 'object',
  formLanguage: ['faceted hard-surface', 'octagonal front plate', 'layered Sakura appliance', 'stable uneven ink'],
  structureKind: ['assembled open container', 'rear-axis hinged lid', 'repeated feet', 'frozen effect pivots'],
  motionPotential: ['sensor glow', 'hinged lid', 'whole-body rebound', 'eight parabolic trash arrivals'],
  materialFamilies: ['warm cream Toon plastic', 'Sakura rose Toon plastic', 'cool-violet cavity', 'transparent liner', 'volumetric trash'],
  notes: 'Four archived v1 runtime views are conditionally admitted. They are not GPT Image 2 output. The archived runtime hierarchy is authoritative.',
};
spec.preSpecAssessment.complexity = {
  tier: 'complex',
  scores: { silhouetteComplexity: 2, componentCount: 3, hierarchyDepth: 3, repetitionDensity: 3, materialLayerCount: 3, localDetailDensity: 3, occlusionRisk: 2, actionReadinessNeed: 3 },
  estimatedCounts: { macroComponents: 5, mesoComponents: 11, microFeatureGroups: 8, materialLayers: 7, repetitionSystems: 4 },
  reasoning: ['The cabinet is compact, but the genuine cavity, frozen hinge/socket contract, eight distinct trash rigs and outline exclusions require a complex action-ready specification.'],
};
spec.preSpecAssessment.specDepthDecision = { requiredDepth: 'complex', minimumComponentLevels: ['macro', 'meso', 'micro'], needsRepetitionSystems: true, needsMaterialLocalOverrides: true, needsMultipleReviewViews: true, needsActionReadyHierarchy: true, rationale: 'The lid, cavity, sensor, sockets and eight model-owned trash pivots must remain independently auditable.' };
const detailDefs = [
  ['faceted-shell', 'Four-wall cabinet retains the archived outline with low-segment corner planes.', 'body-shell'],
  ['octagonal-door', 'Inset eight-corner front disposal plate breaks the broad cream face.', 'front-door'],
  ['upper-rail', 'Sakura upper rail surrounds the real open mouth.', 'upper-rail'],
  ['lower-skirt', 'Wide Sakura lower skirt anchors the cabinet silhouette.', 'bottom-skirt'],
  ['lid-crown', 'Oversized lid carries a separate chamfered cream crown.', 'lid-shell'],
  ['hinge-pair', 'Paired rear hinge blocks and barrels remain attached to the frozen axis.', 'lid-hinge-array'],
  ['deep-cavity', 'Four liner walls and a recessed floor establish a true 0.82-deep cavity.', 'inner-opening'],
  ['sensor-bezel', 'Layered dark bezel enlarges the infrared sensor identity.', 'sensor-window'],
  ['sensor-glow', 'Small inset status strip reuses the frozen sensor position.', 'status-indicator'],
  ['rear-handle', 'Rear pull recess remains aligned with the archived back view.', 'rear-handle-recess'],
  ['feet', 'Four named support feet retain exact ground contact.', 'foot-array'],
  ['power-inlet', 'Rear lower inlet and cable socket retain their archived transform.', 'power-inlet'],
  ['trash-family', 'Eight named low-poly waste props stay volumetric.', 'trash-rig'],
  ['trash-flight', 'Eight parabolic arrivals enter the unchanged lid-inner socket.', 'trash-rig'],
  ['stable-ink', 'Solid parts use three stable outline tiers; transparent/effect parts are excluded.', 'outline-system'],
];
spec.preSpecAssessment.detailInventory = {
  scanMethod: 'four admitted v1 views plus runtime node and animation inventory',
  targetMinDetails: 15,
  note: 'Each observed or runtime-critical detail maps to a real component. Hidden electronics are not fabricated.',
  details: detailDefs.map(([id, description, ref], index) => ({ id, kind: index < 6 ? 'contour' : index < 12 ? 'seam' : 'ridge', description, region: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, scale: index < 5 ? 'macro' : index < 12 ? 'meso' : 'micro', affects: 'silhouette/material/interaction', mapsTo: { type: 'component.localFeatures', ref }, evidenceRef: index === 9 || index === 11 ? 'back-view' : index > 11 ? 'runtime-contract' : 'three-quarter-view', confidence: index > 11 ? 0.99 : 0.94 })),
};
spec.qualityContract.qualityBar = 'complex';
spec.qualityContract.definitionOfDone = [
  'The v2 bin preserves archived bounds, ground, hierarchy, sockets, colliders and disposal animation while improving the cabinet, lid and sensor silhouette.',
  'Solid parts use 0.0048/0.0041/0.0033 stable object-space ink with variation 0.18; transparent liner, sensor glow and flying trash are excluded.',
];
spec.qualityContract.minimumSpecDepth = { macroComponents: 5, mesoComponents: 7, microFeatureGroups: 4, materialLayers: 5, repetitionSystems: 4, reviewViewpoints: 7 };
spec.qualityTargets.targetFidelity = 0.8;
spec.qualityTargets.mustMatch = ['archived v1 package and ground contact', 'frozen hinge, lid-inner, sensor and power socket transforms', 'recognizable touchless bin silhouette and real open cavity', 'three stable solid-part outline tiers'];
spec.qualityTargets.reviewViewpoints = ['front', 'side', 'back', 'three-quarter', 'runtime-startup', 'runtime-climax', 'runtime-wind-down'];
spec.featureReviewTargets = [
  { id: 'smart-bin-silhouette', name: 'Faceted cabinet, octagonal door and oversized lid crown', tier: 'critical', passIds: ['blockout', 'form-refinement'], minimumScore: 0.82, mustPass: true, componentRefs: ['body-shell', 'front-door', 'lid-shell'], evidenceRefs: ['front-view', 'three-quarter-view'] },
  { id: 'smart-bin-identity', name: 'Sensor, real cavity, hinge and rear handle identity', tier: 'critical', passIds: ['structural-pass', 'material-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['sensor-window', 'inner-opening', 'lid-hinge-array', 'rear-handle-recess'], evidenceRefs: ['front-view', 'back-view'] },
  { id: 'smart-bin-runtime', name: 'Frozen lid and eight-trash animation contact', tier: 'critical', passIds: ['interaction-pass', 'optimization-pass'], minimumScore: 0.9, mustPass: true, componentRefs: ['lid-shell', 'trash-rig'], evidenceRefs: ['runtime-contract'] },
  { id: 'smart-bin-ink', name: 'Stable uneven ink with transparent and effect exclusions', tier: 'critical', passIds: ['material-pass', 'lighting-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['outline-system'], evidenceRefs: ['three-quarter-view'] },
];
spec.coordinateFrame = { handedness: 'right-handed', upAxis: '+Y', forwardAxis: '+Z', origin: 'archived appliance root with floor at package minY -0.25', units: 'Three.js world units' };
spec.silhouette = { primaryMass: 'wide faceted cream cabinet inside a 1.65 x 1.55 x 1.026 package', secondaryMasses: ['oversized thin lid crown', 'Sakura upper rail and lower skirt', 'octagonal front plate'], negativeSpaces: ['0.82-deep top cavity', 'rear handle recess'], symmetry: 'bilateral cabinet with rear and front functional asymmetry', proportionNotes: 'All visible geometry remains within the exact archived package.' };
spec.viewEvidence = [
  ...['front', 'side', 'back', 'three-quarter'].map((view) => ({ id: `${view}-view`, view, imagePath: `references/intake-v2/smart-bin/views/${view}.png`, imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['archived v1 silhouette, visible component placement, Sakura palette and camera framing'], confidence: view === 'three-quarter' ? 0.9 : 0.96 })),
  { id: 'runtime-contract', view: 'runtime', imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['22 frozen Group/socket transforms, exact bounds, single timeline, lid contact, eight trash paths and exact reset'], confidence: 0.99 },
];

const prototypes = Object.fromEntries(spec.componentTree.map((item) => [item.id, item]));
const component = (sourceId, id, name, level, role, parent, material, features, primitive = 'box') => {
  const item = structuredClone(prototypes[sourceId] ?? prototypes.root);
  item.id = id; item.name = name; item.level = level; item.role = role; item.parent = parent; item.material = material; item.primitive = primitive;
  item.topologyClass = primitive === 'extrude' ? 'conforming-shell' : 'assembled-solid';
  item.topologyRationale = `${name} is a named procedural ${primitive} assembly selected for the observed low-poly topology.`;
  item.localFeatures = features; item.evidenceRefs = ['three-quarter-view', 'runtime-contract'];
  return item;
};
const attach = (parentSocket, contactType = 'embedded') => ({ parentSocket, localStart: [0, 0, 0], localEnd: [0, 0, 0.02], contactType, embedDepth: 0.02, overlap: 0.02, gapTolerance: 0.005 });
spec.componentTree = [
  component('root', 'root', 'Smart bin root', 'macro', 'assembly', null, 'cream-shell', ['archived package'], 'box'),
  component('body-shell', 'body-shell', 'Four-wall faceted cabinet', 'macro', 'container shell', 'root', 'cream-shell', ['faceted-shell'], 'box'),
  component('lid-shell', 'lid-shell', 'Rear-axis lid and crown', 'macro', 'articulated cover', 'root', 'rose-accent', ['lid-crown'], 'extrude'),
  component('inner-opening', 'inner-opening', 'Open liner cavity', 'macro', 'waste opening', 'body-shell', 'transparent-liner', ['deep-cavity'], 'box'),
  component('root', 'trash-rig', 'Eight-prop disposal rig', 'macro', 'frozen animation assembly', 'root', 'trash-materials', ['trash-family', 'trash-flight'], 'instanced-cluster'),
  component('body-shell', 'front-door', 'Octagonal disposal door plate', 'meso', 'front identity panel', 'body-shell', 'cream-highlight', ['octagonal-door'], 'extrude'),
  component('seam-array', 'upper-rail', 'Sakura mouth rail', 'meso', 'upper frame', 'body-shell', 'rose-accent', ['upper-rail']),
  component('bottom-skirt', 'bottom-skirt', 'Sakura lower skirt', 'meso', 'floor frame', 'body-shell', 'rose-accent', ['lower-skirt']),
  component('lid-hinge-array', 'lid-hinge-array', 'Paired hinge blocks and barrels', 'meso', 'lid joint', 'lid-shell', 'rose-dark', ['hinge-pair'], 'instanced-cluster'),
  component('sensor-window', 'sensor-window', 'Layered infrared sensor module', 'meso', 'touchless sensor', 'upper-rail', 'sensor-dark', ['sensor-bezel']),
  component('rear-handle-recess', 'rear-handle-recess', 'Rear pull recess', 'meso', 'carry/service grip', 'body-shell', 'cavity-dark', ['rear-handle']),
  component('root', 'power-inlet', 'Rear power inlet and socket', 'meso', 'cable connection', 'body-shell', 'rose-dark', ['power-inlet']),
  component('foot-array', 'foot-array', 'Four support feet', 'micro', 'floor supports', 'body-shell', 'rose-dark', ['feet'], 'instanced-cluster'),
  component('status-indicator', 'status-indicator', 'Sensor status strip', 'micro', 'powered indicator', 'sensor-window', 'indicator-glow', ['sensor-glow']),
  component('root', 'outline-system', 'Three-tier stable ink system', 'micro', 'solid-part silhouette ink', 'root', 'cool-violet', ['stable-ink']),
  component('root', 'trash-prop-family', 'Eight distinct waste prop families', 'micro', 'animated repeated detail', 'trash-rig', 'trash-materials', ['trash-family'], 'instanced-cluster'),
];
for (const item of spec.componentTree) {
  if (item.parent && !item.attachment) item.attachment = attach(item.parent, item.id === 'trash-rig' || item.id === 'trash-prop-family' ? 'runtime-pivot' : 'embedded');
}

const baseMaterial = structuredClone(spec.materials[0]);
const material = (id, name, color, roughness, transparent = false) => {
  const item = structuredClone(baseMaterial);
  item.id = id; item.name = name; item.baseColor = color; item.color = color; item.albedo.dominant = color; item.albedo.secondary = [color]; item.roughness.base = roughness;
  item.localOverrides = [{ id: `${id}-toon-response`, region: 'named material zone', response: transparent ? 'depth-write-disabled transparent Toon response without thick outline' : 'two-to-three Toon bands with cool-violet shadow tint', evidenceRefs: ['front-view', 'three-quarter-view'] }];
  item.referencePbr = { usable: true, confidence: 0.8, source: reference, maps: { albedo: { path: `procedural-${id}-albedo` }, roughness: { path: `procedural-${id}-roughness` }, height: { path: `procedural-${id}-height` }, normal: { path: `procedural-${id}-normal` }, ao: { path: `procedural-${id}-ao` } }, limitation: 'Conditional fallback screenshots provide palette evidence; independent procedural channels implement the approved non-textured Toon look.' };
  item.notes = transparent ? 'Transparent procedural material; no runtime image texture and no thick outline.' : 'Solid procedural Toon material with stable object-space ink.';
  return item;
};
spec.materials = [
  material('cream-shell', 'Warm cream shell', '#F4E7D5', 0.72),
  material('cream-highlight', 'Cream highlight plane', '#FFF3DF', 0.66),
  material('rose-accent', 'Sakura rose structure', '#E8A7B7', 0.68),
  material('rose-dark', 'Rose shadow structure', '#745B70', 0.74),
  material('cavity-dark', 'Cool violet cavity', '#5B4854', 0.82),
  material('sensor-dark', 'Infrared sensor glass', '#18151C', 0.24),
  material('transparent-liner', 'Translucent inner liner', '#E9DED0', 0.42, true),
  material('indicator-glow', 'Sensor indicator', '#FFB5C8', 0.36, true),
  material('trash-materials', 'Eight waste prop palette', '#F3C85B', 0.7, true),
  material('cool-violet', 'Outline ink', '#433846', 0.9),
];
spec.repetitionSystems = [
  { id: 'four-feet', name: 'Support foot array', componentRef: 'foot-array', count: 4, distribution: 'archived rectangular lower corners', geometry: 'shared low-segment rounded boxes', material: 'rose-dark', evidenceRefs: ['front-view', 'side-view'] },
  { id: 'hinge-pair', name: 'Rear hinge pair', componentRef: 'lid-hinge-array', count: 2, distribution: 'symmetric about the frozen rear lid axis', geometry: 'paired block and barrel assemblies', material: 'rose-dark', evidenceRefs: ['back-view', 'runtime-contract'] },
  { id: 'trash-pivots', name: 'Animated trash pivot family', componentRef: 'trash-rig', count: 8, distribution: 'eight deterministic parabolic arrivals from both screen sides', geometry: 'eight distinct volumetric low-poly props', material: 'trash-materials', evidenceRefs: ['runtime-contract'] },
  { id: 'liner-walls', name: 'Open cavity walls', componentRef: 'inner-opening', count: 4, distribution: 'front, back, left and right around a recessed floor', geometry: 'shared low-segment boxes', material: 'transparent-liner', evidenceRefs: ['runtime-contract'] },
];
spec.actionReadiness = { hierarchyReady: true, pivotStrategy: 'All archived Group and socket nodes retain exact local transforms and remain published through root.userData.sculptRuntime.', sockets: ['smart-bin-lid-hinge-axis-socket', 'smart-bin-lid-inner-panel-socket', 'smart-bin-sensor-trigger-socket', 'smart-bin-power-connection-socket'], colliders: ['smart-bin-body', 'smart-bin-lid', 'smart-bin-sensor-trigger'], destructionGroups: ['body-shell', 'lid-assembly', 'sensor-module', 'foot-array'], interactionNotes: ['No shared animation controller changes.', 'New geometry remains subordinate to archived runtime anchors.', 'Flying trash and transparent liner remain excluded from thick outlines.'] };
spec.assumptions = ['Archived runtime views are conditional fallback evidence and not GPT Image 2 output.', 'The archived v1 bounds, ground, parent paths, local transforms and socket directions are immutable.', 'Hidden motor, battery, PCB and liner fasteners remain omitted.'];
spec.risks = ['The pale cream front plate uses restrained value separation to remain compatible with the Sakura city palette.', 'The trash props are only visible during their fixed flight windows, so the climax board shows one representative can.', 'Low-poly faceting is a deliberate stylized approximation of the softer v1 shell.'];
spec.performanceBudget = { qualityPriority: 'stylized-runtime', targetTriangles: 6000, maxDrawCalls: 72, textureSize: 0, fpsTarget: 60, optimizationPolicy: 'Stay at or below 1.35x archived triangles and 1.20x archived mesh/draw budget; no runtime image textures.' };
spec.lightingFromPhoto = ['warm upper-left directional key intensity 2.8 revealing cream facet planes', 'cool front-right fill intensity 1.1 separating the side walls', 'Sakura rear rim intensity 1.2 defining lid crown and rails', 'ACES tone mapping exposure 1.0 on pale blue-gray background', 'soft PCF contact shadow under four unchanged feet'];
spec.sculptPipeline = { passGateMode: 'locked-sequential', passOrder: passes, currentPass: 'blockout', completedPasses: [], lastCompletedPass: null, blockedReason: '', nextRequiredEvidence: ['front and three-quarter blockout render'] };
spec.buildPasses = spec.buildPasses.filter((pass) => passes.includes(pass.id)).sort((a, b) => passes.indexOf(a.id) - passes.indexOf(b.id));
spec.selfCorrectLoop.reviewAfterPasses = passes;
spec.selfCorrectLoop.visualAcceptance.threshold = 0.8;
spec.reviewHistory = [];
spec.visualEvidence = [];
spec.tier1Results = [];

await writeFile(path, `${JSON.stringify(spec, null, 2)}\n`);
console.log(JSON.stringify({ path, components: spec.componentTree.length, materials: spec.materials.length, details: spec.preSpecAssessment.detailInventory.details.length, repetitions: spec.repetitionSystems.length }, null, 2));

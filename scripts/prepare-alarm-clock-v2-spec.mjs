import { mkdir, readFile, writeFile } from 'node:fs/promises';

const source = 'docs/history/appliance-model-v1-2026-08-11/docs/sculpt-specs/alarm-clock/object-sculpt-spec.json';
const output = 'docs/sculpt-specs-v2/alarm-clock/object-sculpt-spec.json';
const spec = JSON.parse(await readFile(source, 'utf8'));
const views = ['front', 'side', 'back', 'three-quarter'];

spec.targetName = 'SAKURA Twin-Bell Alarm Clock v2';
spec.targetId = 'alarm-clock-v2';
spec.sourceImage = 'references/intake-v2/alarm-clock/views/front.png';
spec.sourceImages = views.map((view) => `references/intake-v2/alarm-clock/views/${view}.png`);
spec.suitability = 'conditional';
spec.preSpecAssessment.objectClass = {
  primaryType: 'exaggerated low-poly twin-bell alarm clock', primaryDomain: 'object',
  formLanguage: ['twelve-plane circular hard-surface', 'oversized twin bells', 'clean Sakura Toon', 'stable uneven ink'],
  structureKind: ['layered radial shell', 'paired articulated bell assemblies', 'frozen runtime hierarchy'],
  motionPotential: ['rigid-body ringing', 'opposed bell swing', 'hammer oscillation', 'independent hand rotation', 'volumetric feedback'],
  materialFamilies: ['Sakura pink painted shell', 'warm ivory dial', 'cream bell shell', 'cool violet hardware', 'transparent dial glass'],
  notes: 'Four archived v1 views are conditionally admitted. They are not GPT Image 2 output. The archived runtime hierarchy is authoritative for pivots, sockets, bounds, and animation contact.',
};
spec.preSpecAssessment.complexity.tier = 'complex';
spec.preSpecAssessment.complexity.reasoning = [
  'Identity depends on the circular case, paired bells, handle, feet, layered dial, and visible rear service assembly remaining readable together.',
  'The ringing animation owns body, bell, hammer, hand, feedback, and control pivots that cannot move during visual reconstruction.',
  'Three stable outline tiers and repeated radial details require named macro, meso, and micro realization.',
];
spec.preSpecAssessment.unknownsToResolveBeforeImplementation = [];
spec.preSpecAssessment.detailInventory.note = 'Archived multi-view inspection plus runtime contract. Every observed detail maps to an existing named component or material override.';
spec.preSpecAssessment.detailInventory.details.forEach((detail) => { detail.realization = `implemented by ${detail.mapsTo.ref}`; });
spec.qualityContract.qualityBar = 'complex';
spec.qualityContract.definitionOfDone = [
  'Preserve v1 width, height, depth within two percent and ground contact within 0.005 without moving any pivot or socket.',
  'Read as a more exaggerated game-style twin-bell clock through a twelve-plane shell, broad stepped dial, oversized faceted bells, arched handle, and angled feet.',
  'Preserve all model-owned ringing effects, one shared timeline, exact reset, colliders, destruction groups, and runtime node names.',
  'Use stable object-space outline tiers 0.0048, 0.0041, and 0.0033 with 0.18 variation; transparent glass and hidden feedback volumes avoid thick outline buildup.',
];
spec.qualityTargets.targetFidelity = 0.8;
spec.qualityTargets.mustMatch = ['archived v1 package and ground contact', 'all frozen local transforms and socket directions', 'twin-bell clock identity in four views', 'ringing contact at startup climax and wind-down', 'stable three-tier Sakura ink'];
spec.qualityTargets.reviewViewpoints = ['front', 'side', 'back', 'three-quarter', 'runtime-startup', 'runtime-climax', 'runtime-wind-down'];
spec.featureReviewTargets = [
  { id: 'clock-silhouette', name: 'Faceted round case, twin bells, handle, and feet', tier: 'critical', passIds: ['blockout', 'form-refinement'], minimumScore: 0.82, mustPass: true, componentRefs: ['alarm-clock-circular-shell', 'alarm-clock-bell-1-dome', 'alarm-clock-bell-2-dome', 'alarm-clock-arched-carry-handle', 'alarm-clock-foot-1', 'alarm-clock-foot-2'], evidenceRefs: ['front-view', 'side-view', 'three-quarter-view'] },
  { id: 'clock-dial-system', name: 'Stepped dial, twelve ticks, and independent hands', tier: 'critical', passIds: ['structural-pass', 'material-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['alarm-clock-ivory-dial', 'alarm-clock-dial-raised-rim', 'alarm-clock-dial-tick-1', 'alarm-clock-hour-hand', 'alarm-clock-minute-hand'], evidenceRefs: ['front-view'] },
  { id: 'clock-runtime-contact', name: 'Frozen bell, hammer, hand, body, and feedback contact', tier: 'critical', passIds: ['interaction-pass', 'optimization-pass'], minimumScore: 0.9, mustPass: true, componentRefs: ['alarm-clock-bell-1-pivot', 'alarm-clock-bell-2-pivot', 'alarm-clock-hands-pivot', 'alarm-clock-bell-hammer-1', 'alarm-clock-bell-hammer-2'], evidenceRefs: ['runtime-contract'] },
  { id: 'clock-ink', name: 'Stable three-tier uneven ink', tier: 'critical', passIds: ['material-pass', 'lighting-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['alarm-clock-circular-shell', 'alarm-clock-shell-front-band', 'alarm-clock-dial-tick-1'], evidenceRefs: ['front-view', 'three-quarter-view'] },
];
spec.viewEvidence = [
  ...views.map((view) => ({ id: `${view}-view`, view, imagePath: `references/intake-v2/alarm-clock/views/${view}.png`, imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['archived v1 silhouette, component placement, palette, and depth evidence'], confidence: view === 'three-quarter' ? 0.9 : 0.96 })),
  { id: 'runtime-contract', view: 'runtime', imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['27 frozen pivot/socket local transforms, 82 runtime nodes, 10 sockets, three colliders, four destruction groups, exact reset'], confidence: 1 },
  { id: 'behavior-requirement', view: 'runtime', imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['one rigid ringing hierarchy, opposed bell and hammer motion, independent hand speeds, stereo volumetric feedback, exact reset'], confidence: 1 },
  { id: 'inferred-rear-lower', view: 'back', imagePath: 'references/intake-v2/alarm-clock/views/back.png', imageRegion: { x: 0, y: 0.5, width: 1, height: 0.5, units: 'normalized' }, observations: ['rear-lower power inlet profile remains an interaction-driven inference'], confidence: 0.52 },
];
for (const component of spec.componentTree) {
  component.evidenceRefs = [...new Set([...(component.evidenceRefs ?? []), 'runtime-contract'])];
  if (['alarm-clock-circular-shell', 'alarm-clock-ivory-dial', 'alarm-clock-shell-front-band', 'alarm-clock-shell-inner-seam', 'alarm-clock-dial-raised-rim', 'alarm-clock-bell-1-dome', 'alarm-clock-bell-2-dome', 'alarm-clock-bell-1-lower-lip', 'alarm-clock-bell-2-lower-lip', 'alarm-clock-rear-circular-service-plate', 'alarm-clock-rear-service-seam'].includes(component.id)) {
    component.geometryDescriptor ??= { topologyIntent: component.role, edgeTreatment: { type: 'faceted chamfer', bevelRadius: 0.02, segments: 1 }, deformationStack: [], uvStrategy: 'none-solid-toon', normalStrategy: 'generated vertex normals' };
    component.geometryDescriptor.normalStrategy = 'deliberately faceted ten-to-twelve-plane vertex normals';
    component.topologyRationale = `${component.topologyRationale} v2 deliberately limits radial profiles to ten-to-twelve planes for the SAKURA low-poly silhouette.`;
  }
}
const outlineComponent = structuredClone(spec.componentTree.find((component) => component.id === 'alarm-clock-shell-inner-seam'));
outlineComponent.id = 'alarm-clock-outline-system'; outlineComponent.name = 'Alarm clock three-tier outline system'; outlineComponent.parent = 'root'; outlineComponent.level = 'micro'; outlineComponent.role = 'stable silhouette ink'; outlineComponent.primitive = 'box'; outlineComponent.topologyClass = 'assembled-solid'; outlineComponent.topologyRationale = 'Named solid parts receive deterministic object-space low-frequency hull ink; transparent glass and feedback volumes are excluded.'; outlineComponent.localFeatures = ['main-outline-0.0048', 'structure-outline-0.0041', 'detail-outline-0.0033', 'stable-variation-0.18']; outlineComponent.details = outlineComponent.localFeatures.map((id) => ({ id, kind: 'contour', evidenceRefs: ['front-view', 'three-quarter-view'] })); outlineComponent.evidenceRefs = ['front-view', 'three-quarter-view', 'runtime-contract']; outlineComponent.material = 'dark-hardware'; outlineComponent.materialLayers = ['dark-hardware'];
spec.componentTree.push(outlineComponent);
for (const material of spec.materials) {
  material.localOverrides = [...(material.localOverrides ?? []), { id: `${material.id}-v2-toon-response`, region: 'named component material zone', response: material.id === 'dial-glass' || material.id === 'powered-glow' ? 'transparent Toon response without thick primary outline' : 'two-to-three Toon value bands with cool-violet shadow and stable object-space ink', evidenceRefs: ['front-view', 'three-quarter-view'] }];
  material.notes = `${material.notes ?? ''} Runtime remains procedural and texture-free; archived evidence is conditional fallback.`.trim();
}
spec.repetitionSystems.push({ id: 'three-outline-tiers', componentRef: 'alarm-clock-outline-system', count: 3, realization: 'geometry', buildsGeometry: true, geometry: { primitive: 'box' }, distribution: 'main 0.0048, structure 0.0041, detail 0.0033 with object-space variation 0.18' });
spec.lightingFromPhoto = ['warm upper-left key for broad pink and cream Toon planes', 'cool violet right fill to separate the thick shell', 'soft Sakura rear rim around handle and bell silhouettes', 'ACES tone mapping exposure 1.0 on pale blue-gray background', 'soft contact shadow beneath the two angled feet'];
spec.proceduralStrategy = ['Freeze all archived pivots, sockets, bounds, and parent paths.', 'Replace high-segment radial shell, rim, dial, bell, handle, and rear profiles with low-segment procedural geometry.', 'Retain named model-owned ringing volumes and their hidden rest transforms.', 'Apply stable three-tier outline metadata after assembly.', 'Verify four idle views, three powered phases, exact reset, deterministic rebuild, and disposal.'];
spec.animationAnchors = ['alarm-clock-body-pivot', 'alarm-clock-bell-1-pivot', 'alarm-clock-bell-2-pivot', 'alarm-clock-bell-hammer-1-pivot', 'alarm-clock-bell-hammer-2-pivot', 'alarm-clock-hands-pivot', 'alarm-clock-top-alarm-lever-pivot', 'alarm-clock-ringing-feedback-rig'];
spec.assumptions = ['No usable GPT Image 2 credential was present; archived v1 references are explicitly conditional fallback.', 'Hidden escapement, spring, gear train, and shaft depths remain inferred.', 'The low-poly facets are an intentional game-style interpretation within the v1 envelope.'];
spec.performanceBudget = { qualityPriority: 'stylized-runtime', targetTriangles: 19000, maxDrawCalls: 90, textureSize: 0, fpsTarget: 60, optimizationPolicy: 'Remain at or below 1.35x archived triangles, reuse repeated radial geometry, and add no runtime textures.' };
spec.actionReadiness.hierarchyReady = true;
spec.actionReadiness.interactionNotes = ['No shared animation controller or timeline changes.', 'All v2 geometry remains under existing named runtime anchors.', 'Ringing feedback remains closed volumetric geometry and hidden at rest.'];
spec.sculptPipeline = { passGateMode: 'locked-sequential', passOrder: ['blockout', 'structural-pass', 'form-refinement', 'material-pass', 'lighting-pass', 'interaction-pass', 'optimization-pass'], currentPass: 'blockout', completedPasses: [], lastCompletedPass: null, blockedReason: '', nextRequiredEvidence: ['front and three-quarter v2 render evidence'] };
spec.reviewHistory = []; spec.visualEvidence = [];

await mkdir('docs/sculpt-specs-v2/alarm-clock', { recursive: true });
await writeFile(output, `${JSON.stringify(spec, null, 2)}\n`);
await writeFile('docs/sculpt-specs-v2/alarm-clock/detail-inventory.json', `${JSON.stringify(spec.preSpecAssessment.detailInventory, null, 2)}\n`);
console.log(JSON.stringify({ output, components: spec.componentTree.length, materials: spec.materials.length, details: spec.preSpecAssessment.detailInventory.details.length, repetitions: spec.repetitionSystems.length, currentPass: spec.sculptPipeline.currentPass }, null, 2));

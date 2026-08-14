import { mkdir, readFile, writeFile } from 'node:fs/promises';

const sourcePath = 'docs/sculpt-specs/record-player/object-sculpt-spec.json';
const assessmentPath = 'docs/sculpt-specs/record-player/pre-spec-assessment.json';
const outputDirectory = 'docs/sculpt-specs-v2/record-player';
const outputPath = `${outputDirectory}/object-sculpt-spec.json`;
const spec = JSON.parse(await readFile(sourcePath, 'utf8'));
const assessment = JSON.parse(await readFile(assessmentPath, 'utf8'));
const views = ['front', 'side', 'back', 'three-quarter'].map((view) => `references/intake-v2/record-player/views/${view}.png`);

spec.targetName = 'SAKURA Record Player v2';
spec.targetId = 'sakura-record-player-v2';
spec.sourceImage = views[0];
spec.sourceImages = views;
spec.preSpecAssessment.sourceImage = views[0];
spec.preSpecAssessment.complexity.tier = 'complex';
spec.preSpecAssessment.objectClass.formLanguage = ['hard-surface', 'faceted-low-poly', 'sakura-toon', 'hinged-mechanical'];
spec.preSpecAssessment.objectClass.notes = 'Four archived runtime views conditionally establish the exterior. They are not GPT Image 2 output. The visual rebuild preserves all archived animation anchors.';
spec.preSpecAssessment.detailInventory.targetMinDetails = 16;
spec.preSpecAssessment.detailInventory.details.push(
  { id: 'record-player-v2-detail-14', kind: 'contour', description: 'Two six-sided Sakura side cheeks break the rectangular base silhouette.', region: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, scale: 'meso', affects: 'silhouette/material', mapsTo: { type: 'component.localFeatures', ref: 'body-side-facets' }, evidenceRef: 'three-quarter-view', confidence: 0.88 },
  { id: 'record-player-v2-detail-15', kind: 'groove', description: 'Three concentric low-poly vinyl grooves reinforce record rotation.', region: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, scale: 'micro', affects: 'form/material/interaction', mapsTo: { type: 'component.localFeatures', ref: 'vinyl-grooves' }, evidenceRef: 'front-view', confidence: 0.9 },
  { id: 'record-player-v2-detail-16', kind: 'contour', description: 'Eight-sided pink tonearm counterweight remains attached to the cue pivot.', region: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, scale: 'meso', affects: 'form/interaction', mapsTo: { type: 'component.localFeatures', ref: 'tonearm-counterweight' }, evidenceRef: 'side-view', confidence: 0.82 },
  { id: 'record-player-v2-detail-17', kind: 'ridge', description: 'Octagonal speaker badge and pulse ring interrupt the uniform front slat field.', region: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, scale: 'meso', affects: 'form/material', mapsTo: { type: 'component.localFeatures', ref: 'speaker-badge' }, evidenceRef: 'front-view', confidence: 0.84 }
);
const component = (id, name, parent, primitive, topologyClass, material, localFeatures) => ({
  id, name, parent, primitive, topologyClass, level: 'meso', role: 'part', importance: 0.84, confidence: 0.84,
  topologyRationale: 'Independent stylized low-poly hard-surface part with stable animation-ready attachment.',
  material, materialLayers: [material], localFeatures, actionProfile: { movable: false, detachable: true },
  colorMaterialRecipe: { dominantAlbedo: material === 'cream-shell' ? 'rgba(248,234,215,1)' : 'rgba(232,167,183,1)', secondaryAlbedo: 'rgba(109,91,119,1)', materialClass: 'plastic', materialClassConfidence: 0.84 },
  evidenceRefs: ['front-view', 'side-view'],
  details: localFeatures.map((feature, index) => ({ id: `${id}.detail-${index + 1}`, kind: 'contour', evidenceRefs: ['front-view'] })),
  fidelityTier: 'form-refinement',
  attachment: { parentSocket: parent, localStart: [0, 0, 0], localEnd: [0, 0, 0], contactType: 'flush', overlap: 0.01, gapTolerance: 0.005 },
});
spec.componentTree.push(
  component('body-side-facets', 'Faceted Body Side Cheeks', 'body-shell', 'cylinder', 'assembled-solid', 'pink-accent', ['two mirrored six-sided side masses', 'inside archived width/depth envelope']),
  component('lid-side-spines', 'Lid Side Spines', 'hinged-lid', 'box', 'assembled-solid', 'pink-accent', ['mirrored low-poly structural rails']),
  component('vinyl-grooves', 'Concentric Vinyl Grooves', 'platter', 'torus', 'surface-relief', 'pink-accent', ['three twelve-sided concentric rings']),
  component('tonearm-counterweight', 'Tonearm Counterweight', 'tonearm-assembly', 'cylinder', 'assembled-solid', 'pink-accent', ['eight-sided horizontal weight under cue pivot']),
  component('speaker-badge', 'Speaker Pulse Badge', 'front-grille', 'cylinder', 'surface-relief', 'cream-shell', ['octagonal badge with dark pulse ring'])
);
spec.qualityContract.definitionOfDone = ['The v2 record player reads as a more exaggerated faceted SAKURA game prop while its archived package, platter/tonearm mechanics, effect origin and exact reset contract remain unchanged.'];
spec.qualityContract.minimumSpecDepth = { macroComponents: 5, mesoComponents: 16, microFeatureGroups: 10, materialLayers: 7, repetitionSystems: 6, reviewViewpoints: 7 };
spec.qualityContract.featureGroups.push({ id: 'outline-hierarchy', name: 'Stable irregular ink hierarchy', required: true, qualityCriteria: ['Main 0.0048, structure 0.0041 and detail 0.0033 use stable object-space variation 0.18.', 'Transparent lid and volumetric music effects have no visible hull outlines.'], evidenceRefs: ['runtime-contract'], failureModes: ['uniform thin outline', 'transparent/effect outline clumps'] });
spec.qualityTargets.fidelity = 'high stylized low-poly runtime upgrade';
spec.qualityTargets.reviewViewpoints = ['front', 'side', 'back', 'three-quarter', 'runtime-startup', 'runtime-climax', 'runtime-wind-down'];
spec.qualityTargets.mustMatch = ['faceted suitcase shell inside archived package', 'oversized twelve-sided record and visible concentric grooves', 'right-rear tonearm, counterweight, cartridge and stylus under frozen pivots', 'front eleven-slat grille with speaker pulse badge', 'stable three-tier outline and conditional transparent/effect exclusions', 'exact archived animation anchors and music effect center'];
spec.selfCorrectLoop.visualAcceptance.threshold = 0.8;
spec.featureReviewTargets = [
  { id: 'record-player-silhouette', name: 'Faceted suitcase silhouette', tier: 'critical', passIds: ['blockout', 'form-refinement'], minimumScore: 0.82, mustPass: true, componentRefs: ['body-shell', 'body-side-facets', 'hinged-lid'], evidenceRefs: ['front-view', 'side-view', 'three-quarter-view'] },
  { id: 'record-player-playback', name: 'Platter and tonearm identity', tier: 'critical', passIds: ['structural-pass', 'interaction-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['platter', 'vinyl-grooves', 'tonearm', 'tonearm-counterweight', 'cartridge', 'stylus'], evidenceRefs: ['front-view', 'side-view', 'runtime-contract'] },
  { id: 'record-player-speaker', name: 'Front grille and speaker badge', tier: 'critical', passIds: ['structural-pass', 'form-refinement'], minimumScore: 0.82, mustPass: true, componentRefs: ['front-grille', 'grille-slat-array', 'speaker-badge'], evidenceRefs: ['front-view'] },
  { id: 'record-player-animation-contact', name: 'Frozen playback and music effect contact', tier: 'critical', passIds: ['interaction-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['platter-assembly', 'tonearm-assembly', 'status-light'], evidenceRefs: ['runtime-startup', 'runtime-climax', 'runtime-wind-down'] },
  { id: 'record-player-ink', name: 'Three-tier stable SAKURA ink', tier: 'critical', passIds: ['material-pass', 'lighting-pass', 'optimization-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['body-shell', 'hinged-lid', 'platter', 'front-grille'], evidenceRefs: ['outline-contract'] }
];
spec.repetitionSystems.push({ id: 'vinyl-grooves-three', name: 'Three concentric vinyl grooves', componentRef: 'vinyl-grooves', count: 3, distribution: 'concentric on the frozen platter axis', geometry: 'shared twelve-sided torus topology', material: 'pink-accent', evidenceRefs: ['front-view'] });
spec.actionReadiness = { hierarchyReady: true, pivotStrategy: 'Existing named pivots and sockets are frozen; v2 geometry is rebuilt as their visual children.', sockets: ['record-player-lid-attachment-socket', 'record-player-platter-axis-socket', 'record-player-tonearm-attachment-socket', 'record-player-control-socket', 'record-player-motor-drive-socket', 'record-player-power-connection-socket', 'record-player-audio-connection-socket'], colliders: ['record-player-body', 'record-player-lid', 'record-player-platter'], destructionGroups: ['body-deck', 'lid-assembly', 'speaker-grille', 'platter-assembly'], interactionNotes: ['No controller or timeline changes.', 'Platter/effect center remains [-0.35, 1.2, 0].', 'Tonearm counterweight is a child of the frozen cue pivot.'] };
spec.assumptions = ['Archived v1 runtime views are conditional fallback evidence and not GPT Image 2 output.', 'Archived bounds, ground, pivot/socket parent paths, local transforms and socket directions are immutable.', 'Hidden motor, belt, speaker cone and wiring remain omitted.'];
spec.risks = ['The low-poly v2 is deliberately more angular than the soft v1 archive.', 'The transparent lid can soften internal borders under some view angles.', 'Dense climax effects can partially obscure the enlarged platter and tonearm.'];
spec.performanceBudget = { qualityPriority: 'stylized-runtime', targetTriangles: 76000, maxDrawCalls: 120, textureSize: 0, fpsTarget: 60, optimizationPolicy: 'Remain <=1.35x archived triangles and <=1.20x comparable browser draw calls; use no runtime textures.' };
spec.lightingFromPhoto = ['warm upper-left key separating cream and pink Toon bands', 'cool violet lower fill defining faceted side cheeks', 'soft pink rear rim around lid and tonearm', 'pale blue-gray background with contact shadow', 'transparent lid excluded from thick outline'];
spec.localSpecSearch = { collection: 'core_3d', query: 'low poly record player turntable hinged lid tonearm vinyl grille outline', index: { status: 'hit', reason: 'current', fingerprint: '6857e5ab528b42ac12f4f411f862610a0bffce8e47aee3610a7603c318072fe8' }, matches: [{ record_id: 'core.measurement-source-text', source_refs: [{ path: 'grimoire/intake/image_analysis.md', heading: 'Layer 2 - Overall form and silhouette' }], evidence_refs: [{ kind: 'source', ref: 'grimoire/intake/image_analysis.md' }] }, { record_id: 'core.pbr-roughness', source_refs: [{ path: 'grimoire/glossary/3d_vocabulary.md', heading: 'Material And PBR' }], evidence_refs: [{ kind: 'source', ref: 'grimoire/glossary/3d_vocabulary.md' }] }] };
spec.sculptPipeline.passOrder = ['blockout', 'structural-pass', 'form-refinement', 'material-pass', 'lighting-pass', 'interaction-pass', 'optimization-pass'];
spec.buildPasses = spec.buildPasses.filter((pass) => spec.sculptPipeline.passOrder.includes(pass.id)).sort((a, b) => spec.sculptPipeline.passOrder.indexOf(a.id) - spec.sculptPipeline.passOrder.indexOf(b.id));
spec.sculptPipeline.currentPass = 'blockout'; spec.sculptPipeline.completedPasses = []; spec.sculptPipeline.lastCompletedPass = null; spec.sculptPipeline.blockedReason = ''; spec.sculptPipeline.nextRequiredEvidence = ['front and three-quarter blockout renders'];
spec.selfCorrectLoop.reviewAfterPasses = spec.sculptPipeline.passOrder; spec.reviewHistory = []; spec.visualEvidence = [];
assessment.sourceImage = views[0]; assessment.objectClass = spec.preSpecAssessment.objectClass; assessment.complexity = spec.preSpecAssessment.complexity; assessment.detailInventory = spec.preSpecAssessment.detailInventory; assessment.qualityContract = spec.qualityContract; assessment.localSpecSearch = spec.localSpecSearch;
await mkdir(outputDirectory, { recursive: true }); await writeFile(`${outputDirectory}/pre-spec-assessment.json`, `${JSON.stringify(assessment, null, 2)}\n`); await writeFile(outputPath, `${JSON.stringify(spec, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, components: spec.componentTree.length, details: spec.preSpecAssessment.detailInventory.details.length, repetitions: spec.repetitionSystems.length }, null, 2));

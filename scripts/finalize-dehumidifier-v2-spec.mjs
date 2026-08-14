import { mkdir, readFile, writeFile } from 'node:fs/promises';

const sourcePath = 'docs/sculpt-specs/dehumidifier/object-sculpt-spec.json';
const outputPath = 'docs/sculpt-specs-v2/dehumidifier/object-sculpt-spec.json';
const spec = JSON.parse(await readFile(sourcePath, 'utf8'));

spec.targetName = 'SAKURA Dehumidifier v2';
spec.targetId = 'dehumidifier-v2';
spec.sourceImage = 'references/intake-v2/dehumidifier/views/front.png';
spec.sourceImages = ['front', 'side', 'back', 'three-quarter']
  .map((view) => `references/intake-v2/dehumidifier/views/${view}.png`);
spec.preSpecAssessment.objectClass.formLanguage = [
  'exaggerated-low-poly',
  'twelve-sided-hard-surface',
  'faceted-Sakura-toon',
  'stable-uneven-ink',
];
spec.preSpecAssessment.objectClass.notes = 'Existing front, side and back references were technically probed and visually admitted. They are not claimed as GPT Image 2 output. The archived runtime contract remains authoritative for hidden anchors and package bounds.';
spec.qualityContract.definitionOfDone = [
  'The v2 model preserves the archived dehumidifier package, ground contact and frozen runtime hierarchy while strengthening the tapered twelve-sided silhouette, crown outlet, tank level window, control and rear service identity.',
  'All solid geometry uses SAKURA Toon shading with stable three-tier ink at 0.0048, 0.0041 and 0.0033 plus 0.18 object-space variation; transparent water and volumetric humidity actors do not receive heavy ink.',
];
spec.qualityContract.minimumSpecDepth.reviewViewpoints = 7;
spec.qualityTargets.reviewViewpoints = ['front', 'side', 'back', 'three-quarter', 'runtime-startup', 'runtime-climax', 'runtime-wind-down'];
spec.featureReviewTargets = [
  { id: 'dehumidifier-silhouette', name: 'Tapered twelve-sided enclosure and tank split', tier: 'critical', passIds: ['blockout', 'form-refinement'], minimumScore: 0.82, mustPass: true, componentRefs: ['upper-shell', 'water-tank', 'top-exhaust'], evidenceRefs: ['front-view', 'side-view'] },
  { id: 'dehumidifier-identity', name: 'Crown outlet, control, level lens and rear service bank', tier: 'critical', passIds: ['structural-pass', 'material-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['top-exhaust', 'control-button', 'water-level-window', 'rear-air-intake', 'rear-drain-port'], evidenceRefs: ['front-view', 'back-view'] },
  { id: 'dehumidifier-runtime', name: 'Frozen pivots, sockets, humidity trajectories and exact reset', tier: 'critical', passIds: ['interaction-pass'], minimumScore: 0.9, mustPass: true, componentRefs: ['tank-slide-pivot', 'exhaust-fan-pivot', 'airborne-moisture', 'collected-water'], evidenceRefs: ['runtime-contract'] },
  { id: 'dehumidifier-ink', name: 'Stable three-tier SAKURA ink with transparent exclusions', tier: 'critical', passIds: ['material-pass', 'lighting-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['root'], evidenceRefs: ['front-view', 'three-quarter-view'] },
];
const statusComponent = spec.componentTree.find((component) => component.id === 'status-indicator');
if (statusComponent) {
  statusComponent.name = 'Control-integrated indicator response';
  statusComponent.role = 'material-state-within-control';
  statusComponent.localFeatures = ['No detached status dot', 'control face remains visible while pressed'];
}
spec.viewEvidence = [
  { id: 'front-view', view: 'front', imagePath: spec.sourceImages[0], imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['cream/pink split', 'crown outlet', 'control', 'level lens'], confidence: 0.99 },
  { id: 'side-view', view: 'side', imagePath: spec.sourceImages[1], imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['depth taper', 'sloped crown', 'tank seam'], confidence: 0.97 },
  { id: 'back-view', view: 'back', imagePath: spec.sourceImages[2], imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['carry recess', 'intake grid', 'drain'], confidence: 0.99 },
  { id: 'three-quarter-view', view: 'three-quarter', imagePath: spec.sourceImages[3], imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['archived v1 runtime view used only as package and framing evidence'], confidence: 0.82 },
  { id: 'runtime-contract', view: 'runtime', imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['frozen pivot/socket paths, transforms, humidity trajectories and exact reset'], confidence: 0.99 },
];
spec.assumptions = [
  'Existing three-view references are conditionally admitted visual evidence and are not represented as newly generated GPT Image 2 output.',
  'The archived v1 bounding package, ground contact, node paths, sockets and animation transforms are immutable.',
  'Hidden compressor, coils, filter clips and internal tank hardware remain omitted.',
  'The lower rear power inlet remains an explicitly inferred gameplay connection.',
];
spec.risks = [
  'The archived three-quarter image is a runtime screenshot rather than an orthographic concept panel.',
  'Transparent water and humidity volumes can visually clump if outlined.',
  'The exaggerated crown and shoulder facets must remain inside the archived package.',
];
spec.performanceBudget = { qualityPriority: 'stylized-runtime', targetTriangles: 26000, maxDrawCalls: 120, textureSize: 0, fpsTarget: 60, optimizationPolicy: 'Use twelve-segment loft rings, shared repeated geometry and no runtime image textures; remain at or below 1.35x archived triangles.' };
spec.sculptPipeline.currentPass = 'blockout';
spec.sculptPipeline.completedPasses = [];
spec.sculptPipeline.lastCompletedPass = null;
spec.sculptPipeline.blockedReason = '';
spec.sculptPipeline.nextRequiredEvidence = ['front blockout render', 'three-quarter blockout render'];
spec.reviewHistory = [];
spec.visualEvidence = [];

await mkdir('docs/sculpt-specs-v2/dehumidifier', { recursive: true });
await writeFile(outputPath, `${JSON.stringify(spec, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ outputPath, components: spec.componentTree.length, materials: spec.materials.length, details: spec.preSpecAssessment.detailInventory.details.length }, null, 2));

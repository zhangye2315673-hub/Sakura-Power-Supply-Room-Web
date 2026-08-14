import { mkdir, readFile, writeFile } from 'node:fs/promises';

const archivedSpec = 'docs/history/appliance-model-v1-2026-08-11/docs/sculpt-specs/printer/object-sculpt-spec.json';
const specPath = 'docs/sculpt-specs-v2/printer/object-sculpt-spec.json';
await mkdir('docs/sculpt-specs-v2/printer', { recursive: true });
const spec = JSON.parse(await readFile(archivedSpec, 'utf8'));

spec.sourceImages = [
  'references/intake-v2/printer/views/front.png',
  'references/intake-v2/printer/views/side.png',
  'references/intake-v2/printer/views/back.png',
  'references/intake-v2/printer/views/three-quarter.png',
];
spec.suitability = 'pass';
spec.scores = {
  object_isolation: 3, silhouette_readability: 3, depth_inference: 3,
  primitive_decomposition: 3, material_procedurality: 3, occlusion_risk: 2,
  interaction_fit: 3,
};
spec.preSpecAssessment.objectName = 'SAKURA Printer v2';
spec.preSpecAssessment.objectClass = {
  primaryType: 'compact-home-printer',
  primaryDomain: 'object',
  formLanguage: ['stylized-low-poly', 'faceted-hard-surface', 'exaggerated-paper-path'],
  structureKind: ['eight-plane-enclosure', 'hinged-output-tray', 'hinged-rear-support', 'continuous-paper-rig'],
  motionPotential: ['tray-rotation', 'support-rock', 'roller-spin', 'carriage-translation', 'five-page-flight'],
  materialFamilies: ['matte-cream-polymer', 'sakura-pink-polymer', 'dark-cavity-rubber', 'warm-white-paper'],
  notes: 'Observed across an admitted GPT Image 2 four-view turn-sheet; archived pivots, sockets and paper profiles remain frozen.',
};
spec.preSpecAssessment.complexity.scores = {
  silhouetteComplexity: 3, componentCount: 3, hierarchyDepth: 3, repetitionDensity: 3,
  materialLayerCount: 3, localDetailDensity: 3, occlusionRisk: 3, actionReadinessNeed: 3,
};
spec.preSpecAssessment.estimatedCounts = {
  macroComponents: 5, mesoComponents: 15, microFeatureGroups: 9, materialLayers: 8, repetitionSystems: 5,
};
const detailNames = [
  'eight-plane tapered enclosure', 'broad faceted top shoulder', 'thin top access lid', 'pink lower plinth',
  'enlarged dark output throat', 'thick three-sided pink throat frame', 'two eight-sided feed rollers',
  'compact printhead carriage', 'broad hinged output tray', 'cream tray paper inset', 'center tray grip',
  'rear hinged paper support', 'pink support backplate', 'paired paper guides', 'single clean input page',
  'twelve-sided front control', 'mint status lamp', 'rear framed power inlet', 'four floor feet',
  'five closed A4 paper volumes', 'five distinct paper flight profiles', 'stable three-tier uneven outline',
];
spec.preSpecAssessment.detailInventory = {
  scanMethod: 'grid-3x3-plus-runtime-contract',
  targetMinDetails: 16,
  note: 'Every visible or runtime-critical feature maps to an existing named procedural component or runtime rig.',
  details: detailNames.map((name, index) => ({
    id: `printer-v2-detail-${index + 1}`,
    kind: index % 3 === 0 ? 'contour' : index % 3 === 1 ? 'bevel' : 'linework',
    description: name,
    region: { x: (index % 3) / 3, y: (index % 6) / 6, width: 0.33, height: 0.16, units: 'normalized' },
    scale: index < 8 ? 'macro' : index < 18 ? 'meso' : 'micro',
    affects: 'geometry, materialSurface, actionReadiness',
    mapsTo: { type: 'component.localFeatures', ref: 'root' },
    evidenceRef: 'turnsheet',
    confidence: 0.95,
  })),
};
spec.qualityContract.minimumSpecDepth = {
  macroComponents: 5, mesoComponents: 12, microFeatureGroups: 8,
  materialLayers: 7, repetitionSystems: 5, reviewViewpoints: 7,
};
spec.qualityTargets.reviewViewpoints = [
  'front', 'side', 'back', 'three-quarter', 'runtime-startup', 'runtime-climax', 'runtime-wind-down',
];
spec.featureReviewTargets = [
  {
    id: 'printer-silhouette-v2', name: 'Low faceted enclosure with rear support and projecting tray', tier: 'critical',
    passIds: ['blockout', 'form-refinement'], minimumScore: 0.82, mustPass: true,
    componentRefs: ['root'], evidenceRefs: ['front', 'side', 'three-quarter'],
  },
  {
    id: 'printer-paper-path-v2', name: 'Output throat, rollers, tray and rear input support hierarchy', tier: 'critical',
    passIds: ['structural-pass', 'material-pass'], minimumScore: 0.82, mustPass: true,
    componentRefs: ['root'], evidenceRefs: ['front', 'side', 'three-quarter'],
  },
  {
    id: 'printer-runtime-v2', name: 'Frozen pivots, sockets and five distinct paper trajectories', tier: 'critical',
    passIds: ['interaction-pass'], minimumScore: 0.9, mustPass: true,
    componentRefs: ['root'], evidenceRefs: ['runtime-contract'],
  },
  {
    id: 'printer-ink-v2', name: 'Sakura Toon palette and stable uneven three-tier ink', tier: 'critical',
    passIds: ['material-pass', 'lighting-pass'], minimumScore: 0.82, mustPass: true,
    componentRefs: ['root'], evidenceRefs: ['turnsheet'],
  },
];
spec.viewEvidence = ['front', 'side', 'back', 'three-quarter'].map((view) => ({
  id: view === 'three-quarter' ? 'three-quarter-view' : `${view}-view`, view,
  imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' },
  observations: ['consistent enclosure, paper support, output throat, tray, control and rear inlet'], confidence: 0.95,
}));
spec.viewEvidence.unshift({
  id: 'turnsheet', view: 'multi-view', imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' },
  observations: ['successful GPT Image 2 2x2 turn-sheet with cross-view identity consistency'], confidence: 0.97,
});
for (const [id, time] of [['startup', 0.6], ['climax', 2.8], ['wind-down', 4.75]]) {
  spec.viewEvidence.push({
    id, view: `runtime-${id}`, imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' },
    observations: [`frozen printer performance timeline sampled at ${time} seconds`], confidence: 0.99,
  });
}
spec.silhouette = {
  boundingShape: 'wide low eight-plane enclosure with raised rear support and open projecting tray',
  aspectRatios: ['archived width:height unchanged', 'archived width:depth unchanged'],
  symmetry: 'main enclosure bilateral; front control and rear power inlet asymmetric',
  dominantCurves: ['faceted upper shoulder', 'wide front throat', 'low tray projection'],
  negativeSpaces: ['deep output cavity', 'paper-guide gaps', 'tray-to-shell hinge gap'],
  landmarks: ['rear input page', 'pink output frame', 'paired rollers', 'round control', 'mint lamp'],
};
spec.lightingFromPhoto = [
  'soft upper-left key', 'cool lavender fill', 'restrained Sakura rim',
  'light neutral background', 'soft floor contact shadow', 'ACESFilmic exposure 1.0',
];
spec.performanceBudget = {
  qualityPriority: 'stylized-runtime', targetTriangles: 22000, maxDrawCalls: 80,
  textureSize: 0, fpsTarget: 60,
  optimizationPolicy: 'Use explicit faceted shell topology, low-segment rollers and controls, shared repeated geometry and no runtime textures.',
};
spec.assumptions = [
  'GPT Image 2 turn-sheet is visual evidence only.',
  'Existing pivots, sockets, paper meshes, paper profiles and timeline ownership are frozen.',
  'The output throat may grow only inside the archived overall envelope.',
];
spec.risks = [
  'Tray enlargement must not move its hinge or intersect the paper source socket.',
  'Main outlines must not be applied to moving paper volumes.',
  'The five paper effects must never be duplicated by ApplianceSpectacleSystem.',
];
spec.sculptPipeline.currentPass = 'blockout';
spec.sculptPipeline.completedPasses = [];
spec.sculptPipeline.lastCompletedPass = null;
spec.sculptPipeline.blockedReason = '';
spec.sculptPipeline.nextRequiredEvidence = ['front blockout render', 'three-quarter blockout render'];
spec.reviewHistory = [];
spec.visualEvidence = [];
if (spec.componentTree?.[0]?.localFeatures) {
  spec.componentTree[0].localFeatures.push(...detailNames.map((name, index) => ({
    id: `printer-v2-feature-${index + 1}`, name, evidenceRefs: ['turnsheet'],
    geometry: 'existing-named-procedural-component-or-frozen-runtime-rig',
  })));
}
const legacyPaperPivot = spec.componentTree.find((component) => component.id === 'printed-paper-pivot');
if (legacyPaperPivot) {
  legacyPaperPivot.id = 'performance-paper-rig';
  legacyPaperPivot.name = 'Five Page Performance Rig';
  legacyPaperPivot.role = 'animation-rig';
}
const legacyPrintedPaper = spec.componentTree.find((component) => component.id === 'printed-paper');
if (legacyPrintedPaper) {
  legacyPrintedPaper.id = 'performance-paper-stream';
  legacyPrintedPaper.name = 'Five Clean Volumetric A4 Pages';
  legacyPrintedPaper.parent = 'performance-paper-rig';
  legacyPrintedPaper.role = 'performance-prop-array';
}
await writeFile(specPath, `${JSON.stringify(spec, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ specPath, details: detailNames.length, frozenRuntime: true }, null, 2));

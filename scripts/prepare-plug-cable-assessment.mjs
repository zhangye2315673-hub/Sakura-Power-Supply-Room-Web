import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const specDir = path.join(root, 'docs', 'sculpt-specs', 'plug-cable-family');
const assessmentPath = path.join(specDir, 'pre-spec-assessment.json');
const inventoryPath = path.join(specDir, 'detail-inventory.json');
const assessment = JSON.parse(fs.readFileSync(assessmentPath, 'utf8'));
const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));

const evidence = (zone) => path.join(specDir, 'detail-zones', `${zone}.png`);
const details = [
  ['front-chamfer', 'bevel', '主壳前肩的克制单段倒角形成连续亮边', 'zone-r0c1', '0.04 shell radius', 'component.localFeatures', 'outer-shell.front-chamfer', 0.96],
  ['terminal-spacing', 'contour', '双圆针保持平行、等长并与中心轴对称', 'zone-r0c1', 'pin spacing 0.15', 'component.localFeatures', 'terminal-assembly.terminal-layout', 1],
  ['faceplate-seam', 'seam', '接口面圈与主壳之间保留清晰但不夸张的构造缝', 'zone-r0c1', '0.01 axial seam', 'component.localFeatures', 'interface-faceplate.perimeter-seam', 0.94],
  ['shell-facets', 'contour', '主壳竖向低多边形面在三段 Toon 光下形成宽色带', 'zone-r1c1', '12 radial facets', 'component.localFeatures', 'outer-shell.radial-facets', 0.98],
  ['status-inset', 'emissive', '侧面状态点改为浅内嵌圆点并保留交互发光', 'zone-r1c2', '0.024 radius', 'component.localFeatures', 'status-indicator.recessed-dot', 0.92],
  ['rear-chamfer', 'bevel', '主壳后缘通过短倒角收向后颈而非球形鼓包', 'zone-r1c1', '0.035 shell radius', 'component.localFeatures', 'outer-shell.rear-chamfer', 0.94],
  ['strain-relief-rings', 'ridge', '护线套使用两道浅环脊表达真实弯折保护结构', 'zone-r2c1', '0.008 relief', 'component.localFeatures', 'strain-relief.shallow-rings', 0.88],
  ['cable-socket-overlap', 'seam', '线身嵌入护线套并至少重叠 0.02 世界单位', 'zone-r2c1', '0.02 overlap', 'component.localFeatures', 'strain-relief.cable-overlap', 0.98],
  ['cable-radial-facets', 'contour', '线身使用八边圆截面以保持城市风格的平面折光', 'zone-r2c1', '8 radial segments', 'component.localFeatures', 'cable-body.radial-facets', 0.96],
  ['tangent-fillet', 'contour', '每个正交折点使用不越界的相切四分之一圆角', 'zone-r2c1', '0.13 radius clamped to 28 percent', 'component.localFeatures', 'cable-body.tangent-fillet', 1],
  ['cool-shadow-bands', 'contour', '外壳与线身保持三段色阶并把暗部偏向冷紫', 'zone-r1c1', '3 toon bands', 'material.localOverrides', 'shell-toon.cool-violet-shadow-bands', 0.98],
  ['ink-outline', 'contour', '主壳、面圈与线身使用深紫倒置壳墨线，微小针脚不重复加粗', 'zone-r1c1', '0.0030-0.0033', 'material.localOverrides', 'shell-toon.restrained-ink-outline', 0.98],
].map(([id, kind, description, zone, scale, type, ref, confidence]) => ({
  id,
  kind,
  description,
  region: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' },
  scale,
  affects: type === 'material.localOverrides' ? 'toon material response' : 'procedural geometry',
  mapsTo: { type, ref },
  evidenceRef: evidence(zone),
  confidence,
}));

inventory.detailInventory = {
  scanMethod: 'component-zones-plus-grid-3x3',
  targetMinDetails: 10,
  details,
};
assessment.preSpecAssessment.objectClass = {
  primaryType: 'stylized plug-and-cable family',
  primaryDomain: 'object',
  formLanguage: ['low-poly hard-surface', 'axially revolved shell', 'fiber-strand cable'],
  structureKind: ['compound object', 'shared family shell', 'replaceable terminal variants'],
  motionPotential: ['whole-object transform', 'progressive path extraction', 'bendable visual cable', 'socket insertion'],
  materialFamilies: ['toon plastic', 'toon rubber', 'cool gray metal', 'dark connector cavity'],
  notes: 'Code-only real-time game prop. Preserve current gameplay envelope and seven terminal identities while refining the visible construction.',
};
assessment.preSpecAssessment.complexity = {
  tier: 'complex',
  scores: {
    silhouetteComplexity: 1,
    componentCount: 3,
    hierarchyDepth: 2,
    repetitionDensity: 2,
    materialLayerCount: 2,
    localDetailDensity: 2,
    occlusionRisk: 1,
    actionReadinessNeed: 3,
  },
  estimatedCounts: {
    macroComponents: 3,
    mesoComponents: 9,
    microFeatureGroups: 7,
    materialLayers: 4,
    repetitionSystems: 2,
  },
  reasoning: [
    'The common shell is simple, but seven terminal variants, two cable-end modes, progressive extraction, runtime picking and repeated geometry rebuilds require a complex action-ready contract.',
    'Identity depends on preserved terminal layouts and on a rounded-corner cable system that must remain inside the existing collision envelope.',
  ],
};
assessment.preSpecAssessment.specDepthDecision = {
  requiredDepth: 'complex',
  minimumComponentLevels: ['macro', 'meso', 'micro'],
  needsRepetitionSystems: true,
  needsMaterialLocalOverrides: true,
  needsMultipleReviewViews: true,
  needsActionReadyHierarchy: true,
  rationale: 'One shared authored family must cover seven visible terminal systems and dynamic cable geometry without changing gameplay data.',
};
assessment.preSpecAssessment.unknownsToResolveBeforeImplementation = [
  'Back-side shell detail is not visible; use axial symmetry and do not invent controls or branding.',
  'The reference does not establish manufacturing dimensions; retain current game-space constants as authoritative.',
  'The family board is multi-object style evidence, not single-object geometry ground truth.',
];
assessment.preSpecAssessment.detailInventory = inventory.detailInventory;

assessment.qualityContract = {
  qualityBar: 'complex',
  definitionOfDone: [
    'All seven plug styles remain instantly distinguishable by their terminal assembly while sharing one cleaner SAKURA construction language.',
    'Every style remains inside the current 0.18 radius and 0.64 length envelope in front, side and three-quarter views.',
    'Cable corners use tangent low-poly fillets without Catmull-Rom overshoot, spherical elbow bulges, gaps or reversed short-segment bends.',
    'Static, double-ended, showcase and appliance-flight cables share the same section, material hierarchy and plug attachment.',
    'Hover, blocked, energized, picking, reset, disposal and progressive extraction behavior remain compatible with existing callers.',
  ],
  minimumSpecDepth: {
    macroComponents: 3,
    mesoComponents: 8,
    microFeatureGroups: 5,
    materialLayers: 4,
    repetitionSystems: 2,
    reviewViewpoints: 4,
  },
  featureGroups: [
    {
      id: 'family-shell-silhouette',
      name: 'Shared shell silhouette and construction',
      required: true,
      qualityCriteria: ['A restrained five-stage axial profile replaces the generic cylinder without exceeding the legacy envelope.'],
      evidenceRefs: ['reference-v1-round-two-pin', 'v1-seven-style-board'],
      failureModes: ['bulbous toy silhouette', 'straight cylinder remains visually dominant', 'shell exceeds collision envelope'],
    },
    {
      id: 'seven-terminal-identities',
      name: 'Seven terminal identity systems',
      required: true,
      qualityCriteria: ['Pin count, slot/cavity layout, orientation and relative spacing remain recognizable for all seven PlugStyleId values.'],
      evidenceRefs: ['v1-seven-style-board'],
      failureModes: ['two styles become visually interchangeable', 'terminal tip exceeds maximum length', 'micro outlines obscure the connector'],
    },
    {
      id: 'tangent-cable-fillet',
      name: 'Orthogonal cable fillet system',
      required: true,
      qualityCriteria: ['A 0.13 radius quarter-turn is clamped to 28 percent of each adjacent leg, remains tangent and never overshoots the polyline cell.'],
      evidenceRefs: ['v1-fixed-seed-game'],
      failureModes: ['spherical elbow bulge', 'Catmull-Rom corner cutting', 'short-segment reversal', 'open tube end'],
    },
    {
      id: 'attachment-runtime',
      name: 'Cable attachment and runtime hierarchy',
      required: true,
      qualityCriteria: ['Cable overlaps the strain-relief socket, every visible part has a stable node name, and sculptRuntime publishes nodes, sockets and destruction groups.'],
      evidenceRefs: ['reference-v1-round-two-pin'],
      failureModes: ['floating cable', 'unnamed mesh', 'picking and explode part definitions disagree'],
    },
    {
      id: 'sakura-toon-response',
      name: 'SAKURA city toon response',
      required: true,
      qualityCriteria: ['Narrow saturated palette, cool violet shadow bands, restrained deep-purple ink and low-poly facets match the city source without toy or cyber-mechanical cues.'],
      evidenceRefs: ['sakura-crossing-hero-1', 'sakura-crossing-hero-2', 'sakura-crossing-hero-4'],
      failureModes: ['soft-vinyl toy read', 'photoreal PBR mismatch', 'excess panel clutter', 'thick micro-part outlines'],
    },
  ],
  visualDeltaChecks: [
    'legacy versus v2 shell silhouette and envelope',
    'seven-style terminal identity at one shared camera',
    'sharp elbow versus tangent fillet without path overshoot',
    'cable-to-strain-relief contact and outline continuity',
    'SAKURA palette and cool-shadow parity across neutral and three-quarter views',
  ],
  antiShallowSpecRules: [
    'Do not alter puzzle paths, pathLength, clickability, collision constants or appliance mappings to make the new visuals fit.',
    'Do not use a free Catmull-Rom spline for orthogonal puzzle cable corners.',
    'Do not represent a terminal hole as a dark decal when a real cavity face is visible.',
    'Do not merge all terminal variants into one anonymous mesh or omit runtime node names.',
    'Do not accept a cable-to-plug seam with less than 0.02 world-unit overlap.',
    'Do not add photo projection or external texture assets for flat SAKURA materials.',
  ],
};

fs.writeFileSync(inventoryPath, `${JSON.stringify(inventory, null, 2)}\n`);
fs.writeFileSync(assessmentPath, `${JSON.stringify(assessment, null, 2)}\n`);

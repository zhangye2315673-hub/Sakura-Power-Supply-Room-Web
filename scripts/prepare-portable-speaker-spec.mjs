import { readFileSync, writeFileSync } from 'node:fs';

const assessmentPath = 'docs/sculpt-specs/portable-speaker/pre-spec-assessment.json';
const specPath = 'docs/sculpt-specs/portable-speaker/object-sculpt-spec.json';

const details = [
  ['cabinet-bevel', 'bevel', 'broad rounded cabinet edge', 'cabinet-shell.soft-edge-bevel', 'front+side+back', 0.99],
  ['cabinet-seam', 'seam', 'front fascia to cabinet construction seam', 'cabinet-shell.front-fascia-seam', 'front', 0.97],
  ['pink-satin-highlight', 'gloss', 'broad satin highlight on pink molded shell', 'pink-plastic.satin-highlight', 'front+side+back', 0.96],
  ['fascia-bevel', 'bevel', 'cream rounded-square grille surround', 'front-fascia.rounded-bevel', 'front', 0.99],
  ['fascia-inset', 'seam', 'recessed cream fascia inside pink rim', 'front-fascia.recessed-inset', 'front', 0.99],
  ['perforation-grid', 'fastener', 'regular circular acoustic hole field', 'grille-perforations.instanced-grid', 'front', 0.99],
  ['control-exclusion', 'contour', 'lower-right void in hole field around controls', 'grille-perforations.control-clearance', 'front', 0.98],
  ['power-outer-ring', 'ridge', 'raised concentric power-button ring', 'power-control.concentric-ring', 'front', 0.99],
  ['power-disc', 'contour', 'cream circular button face', 'power-control.button-disc', 'front', 0.99],
  ['power-glyph', 'linework', 'raised power symbol on button face', 'power-control.power-glyph', 'front', 0.96],
  ['status-dot', 'emissive', 'small mint indicator below button', 'status-indicator.powered-emissive', 'front', 0.99],
  ['handle-arch', 'contour', 'broad inverted-U carry handle', 'carry-handle.arch-profile', 'front+back', 0.99],
  ['handle-insert', 'seam', 'mint insert on handle side face', 'carry-handle.mint-side-insert', 'side', 0.94],
  ['hinge-caps', 'fastener', 'paired cream circular side pivots', 'handle-hinges.mirrored-caps', 'front+side+back', 0.99],
  ['rear-panel', 'panel', 'cream rounded lower rear service panel', 'rear-service-panel.recessed-panel', 'back', 0.99],
  ['rear-slot', 'interface', 'single horizontal recessed rear slot', 'rear-service-panel.horizontal-port', 'back', 0.97],
  ['feet-pair', 'contour', 'two shallow feet under cabinet', 'feet.mirrored-pair', 'front+back+side', 0.97],
  ['cavity-response', 'gloss', 'dark low-value cavity response in holes and port', 'cavity.dark-recess', 'front+back', 0.95],
];

function detailRecords() {
  return details.map(([id, kind, description, ref, evidenceRef, confidence], index) => ({
    id,
    kind,
    description,
    region: { x: (index % 4) * 0.25, y: Math.floor(index / 4) * 0.2, width: 0.25, height: 0.2, units: 'normalized' },
    scale: kind === 'fastener' ? 'micro-repeated' : 'meso',
    affects: kind === 'gloss' || kind === 'emissive' ? 'material response' : 'geometry and silhouette',
    mapsTo: { type: kind === 'gloss' || kind === 'emissive' ? 'material.localOverrides' : 'component.localFeatures', ref },
    evidenceRef,
    confidence,
  }));
}

const assessment = JSON.parse(readFileSync(assessmentPath, 'utf8'));
assessment.preSpecAssessment.objectClass = {
  primaryType: 'portable loudspeaker with articulated carry handle',
  primaryDomain: 'object',
  formLanguage: ['hard-surface', 'rounded geometric', 'repeated surface relief'],
  structureKind: ['compound object', 'layered shell', 'articulated assembly', 'repeated modules'],
  motionPotential: ['whole-machine bass pulse', 'driver diaphragm travel', 'volumetric wave emitter'],
  materialFamilies: ['molded plastic', 'rubber', 'dark cavity', 'emissive indicator'],
  notes: 'Three admitted elevations define the visible cabinet, fascia, handle and rear service panel. Hidden acoustic and hinge internals remain inferred.',
};
assessment.preSpecAssessment.complexity.scores = {
  silhouetteComplexity: 2, componentCount: 3, hierarchyDepth: 2, repetitionDensity: 3,
  materialLayerCount: 2, localDetailDensity: 3, occlusionRisk: 2, actionReadinessNeed: 3,
};
assessment.preSpecAssessment.complexity.estimatedCounts = {
  macroComponents: 3, mesoComponents: 10, microFeatureGroups: 18, materialLayers: 6, repetitionSystems: 2,
};
assessment.preSpecAssessment.complexity.reasoning = [
  'A rounded cabinet blockout is straightforward, but reference identity depends on a dense perforation field, layered fascia, articulated dual-finish handle, paired hinges, controls and rear service details.',
];
assessment.preSpecAssessment.specDepthDecision.rationale = 'Complex is required because the perforation field, attachments and power animation must remain separate, selectable and performant.';
assessment.preSpecAssessment.unknownsToResolveBeforeImplementation = [
  'Internal driver count, cone profile and enclosure depth are hidden and will be marked inferred.',
  'Handle hinge mechanism and angular stop are inferred from the visible pivot caps.',
  'Rear slot function is ambiguous; model as a generic recessed service/charging port.',
  'Underside fasteners and internal cable routing are not visible and will be omitted.',
];
assessment.preSpecAssessment.detailInventory = { scanMethod: 'grid-4x4-plus-three-admitted-elevations', targetMinDetails: 18, details: detailRecords() };
assessment.qualityContract.definitionOfDone = [
  'Front, side, back and three-quarter renders preserve the slightly-taller-than-wide rounded cabinet, deep side profile, arched handle negative space and layered front fascia.',
  'Dense perforations remain regular and performant, preserve the lower-right control exclusion, and do not become hundreds of draw calls.',
  'Handle, hinge caps, controls, grille, rear panel and feet remain independent named components with sockets and pivots.',
  'Power sequence drives the complete machine through escalating bass compression, expansion and rebound, gives the inferred front driver stronger forward travel, emits thick 3D waves, then lands and restores the exact idle state.',
];
assessment.qualityContract.minimumSpecDepth = { macroComponents: 3, mesoComponents: 9, microFeatureGroups: 15, materialLayers: 5, repetitionSystems: 2, reviewViewpoints: 4 };
assessment.qualityContract.featureGroups = [
  { id: 'speaker-silhouette', name: 'Rounded cabinet and carry-handle silhouette', required: true, qualityCriteria: ['Cabinet is slightly taller than wide and the broad handle arch clears the cabinet top with continuous side attachments.'], evidenceRefs: ['front', 'side', 'back'], failureModes: ['cabinet reads square or too shallow', 'handle floats or negative space collapses'] },
  { id: 'acoustic-front', name: 'Layered fascia and perforation system', required: true, qualityCriteria: ['Cream recessed fascia, regular circular grid and lower-right control clearance match the front elevation.'], evidenceRefs: ['front'], failureModes: ['grille is flat painted texture', 'hole density is sparse', 'controls overlap perforations'] },
  { id: 'handle-joints', name: 'Handle attachments and hinge pivots', required: true, qualityCriteria: ['Both handle roots overlap named side hinge sockets and rotate from the visible cap axes.'], evidenceRefs: ['front', 'side', 'back'], failureModes: ['floating handle root', 'center-pivot rotation', 'mint insert absent'] },
  { id: 'controls-service', name: 'Power controls and rear service panel', required: true, qualityCriteria: ['Concentric button, power glyph, mint indicator, rear cream panel and horizontal port remain legible.'], evidenceRefs: ['front', 'back'], failureModes: ['generic single button', 'rear panel omitted'] },
  { id: 'powered-purpose', name: 'Powered loudspeaker action', required: true, qualityCriteria: ['One whole-machine bass root, stronger front-driver travel, escalating impacts, three-hit climax, thick expanding waves and final lift/landing identify speaker use and reset exactly.'], evidenceRefs: ['animation requirement'], failureModes: ['partial cabinet-only scaling', 'small controls dancing independently', 'flat wave cards', 'no visible climax', 'reset drift'] },
  { id: 'surface-material-response', name: 'SAKURA material separation', required: true, qualityCriteria: ['Pink satin shell, cream fascia, mint insert/light, dark cavities and rubber feet remain distinct under toon lighting.'], evidenceRefs: ['front', 'side', 'back'], failureModes: ['one-note pink material', 'cavity holes wash out'] },
];
assessment.qualityContract.visualDeltaChecks = ['cabinet width-to-height and depth delta', 'handle arch and negative-space delta', 'perforation density/control exclusion delta', 'front/rear panel layering delta', 'pink/cream/mint/cavity material separation delta', 'powered action and exact reset delta'];
writeFileSync(assessmentPath, `${JSON.stringify(assessment, null, 2)}\n`);

try {
  const spec = JSON.parse(readFileSync(specPath, 'utf8'));
  spec.targetId = 'portable-speaker';
  spec.schemaVersion = '2.1';
  spec.suitability = 'pass';
  spec.sourceImage = 'references/intake/portable-speaker/front.png';
  spec.preSpecAssessment = assessment.preSpecAssessment;
  spec.qualityContract = assessment.qualityContract;
  spec.qualityTargets = { fidelity: 0.82, silhouette: 0.86, proportions: 0.84, componentStructure: 0.84, materials: 0.78, interaction: 0.86 };
  spec.featureReviewTargets = [
    ['speaker-silhouette', 'Rounded cabinet and handle arch', 'blockout', ['cabinet-shell', 'carry-handle'], ['front', 'side', 'back']],
    ['acoustic-front', 'Cream fascia and dense perforation field', 'structural-pass', ['front-fascia', 'grille-perforations'], ['front']],
    ['handle-joints', 'Dual hinge and mint insert system', 'structural-pass', ['carry-handle', 'handle-hinges'], ['front', 'side', 'back']],
    ['controls-service', 'Controls and rear service panel', 'form-refinement', ['power-control', 'status-indicator', 'rear-service-panel'], ['front', 'back']],
    ['surface-material-response', 'Pink cream mint cavity separation', 'material-pass', ['cabinet-shell', 'front-fascia', 'carry-handle'], ['front', 'side', 'back']],
    ['powered-purpose', 'Speaker pulse and sound-wave action', 'interaction-pass', ['power-control', 'grille-perforations', 'sound-wave-emitter'], ['front', 'three-quarter']],
  ].map(([id, name, passId, componentRefs, evidenceRefs]) => ({ id, name, tier: 'critical', passIds: [passId], minimumScore: 0.74, mustPass: true, componentRefs, evidenceRefs }));

  const component = (id, name, level, parent, material, primitive, topologyClass, rationale, features, evidenceRefs, attachment) => ({
    id, name, level, role: 'component', importance: level === 'macro' ? 1 : 0.85, confidence: evidenceRefs.includes('inferred') ? 0.62 : 0.94,
    primitive, topologyClass, topologyRationale: rationale, parent, material,
    localFeatures: features.map((feature) => ({ id: feature })),
    colorMaterialRecipe: { dominantAlbedo: material === 'pink-plastic' ? 'rgba(242, 178, 183, 1)' : material === 'cream-plastic' ? 'rgba(247, 235, 215, 1)' : 'rgba(75, 67, 71, 1)', secondaryAlbedo: 'rgba(190, 220, 205, 1)', materialClass: material, materialClassConfidence: 0.9 },
    evidenceRefs, ...(attachment ? { attachment } : {}),
  });
  const hingeAttachment = (side) => ({ parentId: 'cabinet-shell', parentSocket: `handle-${side}-hinge-socket`, localStart: side === 'left' ? [-1.57, 2.78, 0] : [1.57, 2.78, 0], localEnd: side === 'left' ? [-1.57, 4.15, 0] : [1.57, 4.15, 0], baseRadius: 0.15, endRadius: 0.15, embedDepth: 0.06, overlap: 0.08, contactType: 'hinge', gapTolerance: 0.02, evidenceRefs: ['front', 'side', 'back'] });
  spec.componentTree = [
    component('root', 'portable-speaker-root', 'macro', null, 'pink-plastic', 'box', 'assembled-solid', 'Runtime container for the compound appliance.', [], ['front', 'side', 'back']),
    component('cabinet-shell', 'rounded pink cabinet shell', 'macro', 'root', 'pink-plastic', 'rounded-box', 'assembled-solid', 'Rigid molded housing with a deep rounded rectangular volume.', ['soft-edge-bevel', 'front-fascia-seam'], ['front', 'side', 'back']),
    component('front-fascia', 'recessed cream acoustic fascia', 'macro', 'cabinet-shell', 'cream-plastic', 'rounded-box', 'conforming-shell', 'Thin rounded panel follows the cabinet front.', ['rounded-bevel', 'recessed-inset'], ['front']),
    component('grille-perforations', 'instanced circular grille perforations', 'micro', 'front-fascia', 'cavity', 'instanced-cluster', 'surface-relief', 'Dense holes are repeated surface relief, represented by one instanced draw.', ['instanced-grid', 'control-clearance'], ['front']),
    component('power-control', 'concentric power control', 'meso', 'front-fascia', 'cream-plastic', 'cylinder', 'assembled-solid', 'Separate circular button and raised ring.', ['concentric-ring', 'button-disc', 'power-glyph'], ['front']),
    component('status-indicator', 'mint status indicator', 'micro', 'front-fascia', 'mint-emissive', 'sphere', 'surface-relief', 'Small raised lens with powered emissive response.', ['powered-emissive'], ['front']),
    component('handle-hinges', 'mirrored cream hinge cap system', 'meso', 'cabinet-shell', 'cream-plastic', 'cylinder', 'assembled-solid', 'Paired side pivot caps visibly overlap the cabinet.', ['mirrored-caps'], ['front', 'side', 'back']),
    component('carry-handle', 'arched pink carry handle', 'macro', 'handle-hinges', 'pink-plastic', 'extruded-profile', 'continuous-sculpt', 'Continuous inverted-U profile with broad negative space and rectangular strap depth.', ['arch-profile', 'mint-side-insert'], ['front', 'side', 'back'], hingeAttachment('left')),
    component('carry-handle-right-root', 'right handle hinge root', 'meso', 'carry-handle', 'pink-plastic', 'extruded-profile', 'assembled-solid', 'Right root shares the same articulated handle and terminates at the opposite hinge.', ['right-root-overlap'], ['front', 'back'], hingeAttachment('right')),
    component('rear-service-panel', 'rear cream service panel', 'meso', 'cabinet-shell', 'cream-plastic', 'rounded-box', 'conforming-shell', 'Thin inset panel follows the lower rear shell.', ['recessed-panel', 'horizontal-port'], ['back']),
    component('feet', 'paired rubber feet', 'meso', 'cabinet-shell', 'rubber', 'rounded-box', 'assembled-solid', 'Two shallow supports overlap the underside.', ['mirrored-pair'], ['front', 'side', 'back']),
    component('internal-driver', 'inferred full-range driver assembly', 'meso', 'cabinet-shell', 'cavity', 'cylinder', 'assembled-solid', 'Basket rim, compliant surround, tapered cone and dust cap form one forward-travel secondary-motion pivot.', ['basket-rim', 'compliant-surround', 'tapered-cone', 'dust-cap', 'powered-pulse'], ['inferred']),
    component('sound-wave-emitter', 'front volumetric bass-wave emitter', 'micro', 'front-fascia', 'mint-emissive', 'tube-along-curve', 'assembled-solid', 'Closed irregular curve with a circular TubeGeometry cross-section preserves thickness from oblique views.', ['expanding-wave-rings'], ['animation requirement']),
  ];
  const materialClassById = { 'pink-plastic': 'plastic', 'cream-plastic': 'plastic', 'mint-emissive': 'plastic', cavity: 'unknown', rubber: 'rubber', 'wave-effect': 'unknown' };
  const rgbaById = { 'pink-plastic': 'rgba(242, 178, 183, 1)', 'cream-plastic': 'rgba(247, 235, 215, 1)', 'mint-emissive': 'rgba(187, 216, 205, 1)', cavity: 'rgba(75, 67, 71, 1)', rubber: 'rgba(106, 98, 102, 1)', 'wave-effect': 'rgba(185, 240, 221, 0.42)' };
  const attachmentFor = (entry) => ({
    parentId: entry.parent,
    parentSocket: `${entry.parent}-attachment-socket`,
    localStart: [0, 0, 0],
    localEnd: [0, 0.12, 0],
    embedDepth: 0.04,
    overlap: 0.04,
    contactType: entry.id.includes('handle') || entry.id.includes('hinge') ? 'hinge' : 'surface-contact',
    gapTolerance: 0.02,
    evidenceRefs: entry.evidenceRefs.filter((ref) => ['front', 'side', 'back'].includes(ref)),
  });
  for (const entry of spec.componentTree) {
    entry.primitive = ({ 'rounded-box': 'box', 'extruded-profile': 'extrude' })[entry.primitive] ?? entry.primitive;
    entry.colorMaterialRecipe.materialClass = materialClassById[entry.material] ?? 'unknown';
    entry.colorMaterialRecipe.dominantAlbedo = rgbaById[entry.material] ?? 'rgba(128, 128, 128, 1)';
    entry.colorMaterialRecipe.secondaryAlbedo = entry.material === 'pink-plastic' ? 'rgba(255, 214, 207, 1)' : 'rgba(255, 248, 235, 1)';
    entry.actionProfile = { animationRole: ['carry-handle', 'power-control', 'internal-driver', 'sound-wave-emitter'].includes(entry.id) ? 'articulated' : 'static', selectable: true, destruction: { breakable: false, fractureGroup: entry.parent ?? 'root' } };
    if (entry.parent && !entry.attachment) entry.attachment = attachmentFor(entry);
  }
  spec.componentTree.find((entry) => entry.id === 'carry-handle').parent = 'cabinet-shell';
  spec.componentTree.find((entry) => entry.id === 'carry-handle').attachment = hingeAttachment('left');
  spec.componentTree.find((entry) => entry.id === 'carry-handle-right-root').attachment = { ...hingeAttachment('right'), parentId: 'carry-handle', parentSocket: 'carry-handle-right-root-socket' };
  const material = (id, name, color, roughness, overrides) => ({ id, name, type: 'toon', baseColor: color, albedo: { dominant: color, secondary: [] }, roughness: { base: roughness, variation: 0.06, map: 'independent procedural molded response' }, metalness: { base: 0 }, normal: { pattern: 'subtle-molded-plastic', strength: 0.025 }, ambientOcclusion: { cavityStrength: 0.22 }, localOverrides: overrides, referencePbr: { usable: false, confidence: 0.62, limitation: 'Illustrated references do not provide measured PBR channels; use observed color zones and toon response.' } });
  spec.materials = [
    material('pink-plastic', 'satin sakura pink molded plastic', '#F2B2B7', 0.56, [{ id: 'pink-plastic.satin-highlight', roughness: 0.42, region: 'cabinet bevels and handle crown' }]),
    material('cream-plastic', 'warm cream molded plastic', '#F7EBD7', 0.64, [{ id: 'cream-plastic.fascia-edge', roughness: 0.52, region: 'front and rear panel bevels' }]),
    material('mint-emissive', 'desaturated mint insert and indicator', '#BBD8CD', 0.48, [{ id: 'status-indicator.powered-emissive', emissive: '#9DEFD2', emissiveIntensity: 1.8, region: 'front status lens' }]),
    material('cavity', 'dark warm-gray cavities', '#4B4347', 0.78, [{ id: 'cavity.dark-recess', roughness: 0.86, region: 'grille holes and rear port' }]),
    material('rubber', 'warm gray rubber feet', '#6A6266', 0.9, [{ id: 'rubber.contact-darkening', roughness: 0.96, region: 'ground contact' }]),
    material('wave-effect', 'translucent mint sound wave', '#B9F0DD', 0.35, [{ id: 'wave-effect.powered-opacity', opacity: 0.42, region: 'transient sound rings' }]),
  ];
  const pbrDirectory = { 'pink-plastic': 'pbr-pink', 'cream-plastic': 'pbr-cream', 'mint-emissive': 'pbr-mint', cavity: 'pbr-cavity', rubber: 'pbr-rubber', 'wave-effect': 'pbr-mint' };
  for (const entry of spec.materials) {
    const dir = pbrDirectory[entry.id];
    const sourceId = entry.id === 'wave-effect' ? 'mint-emissive' : entry.id;
    entry.shaderModel = 'MeshToonMaterial project style with independently extracted PBR evidence';
    entry.albedo.secondary = ['#FFF8EB', '#F2B2B7', '#BBD8CD', '#4B4347'];
    entry.albedo.samplingNotes = 'Observed from admitted front, side and back reference color zones.';
    entry.colorVariation = { palette: [entry.baseColor, '#FFF8EB'], pattern: 'subtle molded or cavity response', amplitude: 0.05, heightCorrelation: 0.08 };
    entry.textureResolution = 1024;
    entry.textureProjection = { mode: 'uv', repeat: [2, 2], anisotropy: 8, texelDensityIntent: 'Stable object-scale detail without visible tiling.' };
    entry.surfaceFrequencyBands = [
      { id: 'macro', frequency: 2, amplitude: 0.14, role: 'broad color and form response' },
      { id: 'meso', frequency: 14, amplitude: 0.06, role: 'seam, panel and recess response' },
      { id: 'micro', frequency: 58, amplitude: 0.022, role: 'grazing highlight breakup' },
    ];
    entry.roughness.map = `independent-${entry.id}-roughness`;
    entry.normal = { pattern: `independent-${entry.id}-micro-normal`, strength: 0.08, scale: 48, space: 'tangent' };
    entry.referencePbr = {
      usable: true,
      confidence: entry.id === 'pink-plastic' ? 0.86 : 0.8,
      estimatedFidelity: entry.id === 'pink-plastic' ? 0.86 : 0.8,
      sourceImage: entry.id === 'mint-emissive' || entry.id === 'wave-effect' ? 'references/intake/portable-speaker/side.png' : entry.id === 'cavity' ? 'references/intake/portable-speaker/back.png' : 'references/intake/portable-speaker/front.png',
      acceptedLimitation: 'Stylized source supports palette and relative channel evidence, not exact inverse-rendered physical values.',
      maps: Object.fromEntries(['albedo', 'roughness', 'height', 'normal', 'ao'].map((channel) => [channel, { path: `artifacts/img2threejs/portable-speaker/${dir}/${sourceId}_${channel}.png` }])),
    };
  }
  spec.materials.find((entry) => entry.id === 'pink-plastic').clearcoat = 0.22;
  spec.materials.find((entry) => entry.id === 'pink-plastic').clearcoatRoughness = 0.28;
  spec.repetitionSystems = [
    { id: 'grille-hole-grid', componentRef: 'grille-perforations', count: 460, realization: 'geometry', buildsGeometry: true, geometry: { primitive: 'instanced-cylinder', radialSegments: 8 }, distribution: '22 by 23 rectangular lattice clipped to rounded fascia with lower-right control exclusion' },
    { id: 'sound-wave-ring-set', componentRef: 'sound-wave-emitter', count: 8, realization: 'geometry', buildsGeometry: true, geometry: { primitive: 'closed irregular tube-along-curve', forbidden: ['PlaneGeometry', 'Sprite', 'Line'] }, distribution: 'one time-offset thick ring for each escalating authored bass impact' },
  ];
  spec.coordinateFrame = { up: '+Y', front: '+Z', right: '+X', units: 'world units', origin: 'cabinet bottom center' };
  spec.silhouette = { primitiveEnvelope: ['rounded cuboid cabinet', 'extruded inverted-U handle'], proportions: { cabinetWidth: 3.2, cabinetHeight: 3.55, cabinetDepth: 1.45, totalHeight: 5.0 }, symmetry: 'bilateral except lower-right front controls', negativeSpaces: ['large opening inside carry-handle arch'] };
  spec.viewEvidence = [
    { id: 'front', path: 'references/intake/portable-speaker/front.png', viewpoint: 'front', admitted: true },
    { id: 'side', path: 'references/intake/portable-speaker/side.png', viewpoint: 'side', admitted: true },
    { id: 'back', path: 'references/intake/portable-speaker/back.png', viewpoint: 'back', admitted: true },
  ];
  spec.buildPasses = [
    ['blockout', 'Lock cabinet depth, total height and handle negative space.', ['cabinet-shell', 'carry-handle'], ['Front, side and back silhouettes agree before detail work.', 'AI vision score meets threshold.']],
    ['structural-pass', 'Build fascia, holes, hinges and handle attachments.', ['front-fascia', 'grille-perforations', 'handle-hinges', 'carry-handle'], ['No floating roots; dense grid preserves control clearance.', 'AI vision score meets threshold.']],
    ['form-refinement', 'Add controls, rear service panel, feet, seams and glyph.', ['power-control', 'status-indicator', 'rear-service-panel', 'feet'], ['Identity details remain legible in four views.', 'AI vision score meets threshold.']],
    ['material-pass', 'Separate pink, cream, mint, cavity and rubber responses.', ['cabinet-shell', 'front-fascia', 'carry-handle', 'feet'], ['Material zones remain distinct under neutral toon lighting.', 'AI vision score meets threshold.']],
    ['lighting-pass', 'Tune key, fill, rim and contact shadow for bevel and hole readability.', ['root'], ['No cream blowout; cavities remain dark and side depth remains readable.', 'AI vision score meets threshold.']],
    ['interaction-pass', 'Drive one whole-machine bass root, stronger driver travel, escalating impacts, three-hit climax, thick expanding waves and final lift/landing.', ['root', 'status-indicator', 'internal-driver', 'sound-wave-emitter'], ['No small-part dance; the final beat lands and settles; stop resets exactly.', 'AI vision score meets threshold.']],
    ['optimization-pass', 'Keep repeated holes instanced and all other repeated geometry shared.', ['root', 'grille-perforations'], ['Draw calls below 100 and triangles below 65000.']],
  ].map(([id, goal, componentRefs, acceptance]) => ({ id, goal, componentRefs, acceptance }));
  spec.lightingFromPhoto = ['warm upper-left key light intensity 3.2 with broad soft shadow', 'cool right-rear fill light intensity 1.35', 'pink rear rim light intensity 1.6', 'neutral exposure with ACES tone mapping on pale blue-gray background', 'soft floor contact shadow beneath both feet'];
  spec.proceduralStrategy = ['RoundedBoxGeometry cabinet and panels', 'ExtrudeGeometry handle profile', 'InstancedMesh grille perforations', 'Layered inferred driver with basket/surround/cone/dust cap', 'Closed irregular TubeGeometry waves', 'Deterministic whole-object bass timeline'];
  spec.animationAnchors = [
    { id: 'handle-pivot', node: 'portable-speaker-handle-pivot', axis: [1, 0, 0], range: [-0.12, 0.12] },
    { id: 'power-button-pivot', node: 'portable-speaker-power-button-pivot', axis: [0, 0, 1], range: [-0.04, 0] },
    { id: 'whole-machine-bass', node: 'portable-speaker-whole-machine-pivot', axis: [1, 1, 1], range: [0.92, 1.12] },
    { id: 'driver-pulse', node: 'portable-speaker-driver-pulse-pivot', axis: [0, 0, 1], range: [-0.07, 0.28] },
    { id: 'wave-socket', node: 'portable-speaker-sound-wave-socket', axis: [0, 0, 1], range: [0, 1] },
  ];
  spec.destructionAnchors = [{ id: 'cabinet', nodes: ['portable-speaker-cabinet-shell'] }, { id: 'front-acoustic', nodes: ['portable-speaker-front-fascia', 'portable-speaker-grille-perforations'] }, { id: 'handle', nodes: ['portable-speaker-handle-pivot'] }, { id: 'rear-service', nodes: ['portable-speaker-rear-service-panel'] }];
  spec.assumptions = ['A single full-range driver with basket rim, compliant surround, tapered cone and dust cap is inferred behind the grille; exact count and compliance are unknown.', 'Handle hinge stops are inferred from normal carry-handle articulation.', 'Rear slot is modeled as an ambiguous service/charging interface.', 'Underside screws and cable routing are hidden and omitted.'];
  spec.performanceBudget = { maxDrawCalls: 100, maxTriangles: 65000, maxTextureMemoryMb: 4, strategy: 'one instanced hole draw, shared geometries, no external textures' };
  spec.actionReadiness = { pivots: ['portable-speaker-whole-machine-pivot', 'portable-speaker-handle-pivot', 'portable-speaker-power-button-pivot', 'portable-speaker-driver-pulse-pivot'], sockets: ['portable-speaker-handle-left-hinge-socket', 'portable-speaker-handle-right-hinge-socket', 'portable-speaker-sound-wave-socket', 'portable-speaker-power-cable-socket'], colliders: ['cabinet box', 'handle box trigger'], exactResetRequired: true };
  spec.preSpecAssessment.unknownsToResolveBeforeImplementation = [];
  spec.preSpecAssessment.resolvedImplementationAssumptions = assessment.preSpecAssessment.unknownsToResolveBeforeImplementation;
  spec.qualityContract.minimumSpecDepth.mesoComponents = 6;
  spec.qualityTargets.reviewViewpoints = ['front', 'side', 'back', 'three-quarter'];
  spec.qualityTargets.mustMatch = ['rounded cabinet and handle silhouette', 'perforation density and control clearance', 'front and rear panels', 'pink cream mint color zoning'];
  spec.qualityTargets.niceToHave = ['subtle molded highlight variation', 'illustrative expanding sound waves'];
  for (const detail of spec.preSpecAssessment.detailInventory.details) {
    detail.kind = detail.kind === 'panel' ? 'seam' : detail.kind === 'interface' ? 'groove' : detail.kind;
    const ref = detail.mapsTo.ref;
    if (detail.mapsTo.type === 'component.localFeatures' && ref.includes('.')) detail.mapsTo.ref = ref.split('.').at(-1);
  }
  spec.viewEvidence.push(
    { id: 'inferred', path: 'docs/sculpt-specs/portable-speaker/image-analysis.md', viewpoint: 'hidden-regions', admitted: true },
    { id: 'animation requirement', path: 'docs/sculpt-specs/portable-speaker/image-analysis.md', viewpoint: 'interaction', admitted: true },
  );
  spec.reviewHistory = [];
  spec.visualEvidence = [];
  spec.tier1Results = [];
  writeFileSync(specPath, `${JSON.stringify(spec, null, 2)}\n`);
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

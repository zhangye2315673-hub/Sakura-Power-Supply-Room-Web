import fs from 'node:fs';

const templatePath = 'docs/sculpt-specs/bubble-machine/object-sculpt-spec.json';
const outPath = 'docs/sculpt-specs/printer/object-sculpt-spec.json';
const spec = JSON.parse(fs.readFileSync(templatePath, 'utf8'));

spec.targetName = 'SAKURA Compact Inkjet Printer';
spec.targetId = 'printer';
spec.sourceImage = 'references/intake/printer/front.png';
spec.suitability = 'pass';
spec.scores = { object_isolation: 3, silhouette_readability: 3, depth_inference: 3, primitive_decomposition: 3, material_procedurality: 3, occlusion_risk: 2, interaction_fit: 3 };
spec.referenceCamera = { solved: false, fovDegrees: 34, aspect: 557 / 941, orientation: { yaw: 0, pitch: 0, roll: 0 }, positionHint: [0, 0, 4], note: 'Three orthographic-like views constrain the complete exterior. Internal ink, roller and underside geometry remain inferred.' };
spec.preSpecAssessment.objectClass = {
  primaryType: 'compact desktop inkjet printer', primaryDomain: 'object',
  formLanguage: ['hard-surface', 'rounded-retro', 'layered-shell', 'soft-industrial'],
  structureKind: ['compound object', 'layered enclosure', 'hinged trays', 'repeated roller and foot modules'],
  motionPotential: ['paper feed', 'roller rotation', 'tray hinge', 'control press', 'status light'],
  materialFamilies: ['warm ABS plastic', 'Sakura pink ABS', 'dark rubber', 'paper', 'indicator lens'],
  notes: 'Front, side and back views establish the outer enclosure, paper support, output tray, controls and rear inlet. Printhead, cartridge bay, internal rollers and underside details are not visible.'
};
spec.preSpecAssessment.complexity = { tier: 'complex', scores: { silhouetteComplexity: 2, componentCount: 3, hierarchyDepth: 3, repetitionDensity: 2, materialLayerCount: 3, localDetailDensity: 3, occlusionRisk: 2, actionReadinessNeed: 3 }, estimatedCounts: { macroComponents: 5, mesoComponents: 15, microFeatureGroups: 11, materialLayers: 7, repetitionSystems: 4 }, reasoning: ['The broad rounded shell is simple, but front and rear articulated paper systems, inset output cavity, controls, rollers, feet and a purpose-readable paper animation require a complex runtime hierarchy.'] };

const detailRows = [
  ['main-shell', 'contour', 'Broad cream rectangular enclosure with strongly rounded shoulders and lower corners.', 'macro', 'front-view', 0.98],
  ['top-lid', 'seam', 'Thin horizontal top-lid seam wraps across the front and side.', 'meso', 'front-view', 0.95],
  ['rear-paper-support', 'contour', 'Tall rear paper support leans backward and frames the input sheet.', 'macro', 'side-view', 0.97],
  ['rear-support-backplate', 'contour', 'Wide Sakura-pink rear backplate with rounded corners and lower finger recess.', 'meso', 'back-view', 0.96],
  ['input-paper', 'contour', 'Single warm-white paper sheet rises above the rear support.', 'meso', 'front-view', 0.98],
  ['output-cavity', 'hole', 'Deep pink inset output bay with dark inner throat.', 'macro', 'front-view', 0.98],
  ['output-tray-pivot', 'bevel', 'Projecting Sakura-pink output tray with thick rounded front rim.', 'macro', 'front-view', 0.98],
  ['tray-handle', 'groove', 'Centered shallow grip recess in the tray front edge.', 'micro', 'front-view', 0.96],
  ['printed-paper', 'contour', 'Warm-white page rests on the output tray and emerges from the throat.', 'meso', 'front-view', 0.97],
  ['control-button-pivot', 'bevel', 'Large layered circular Sakura-pink power/action button.', 'micro', 'front-view', 0.98],
  ['status-indicator', 'fastener', 'Small circular indicator sits to the right of the main button.', 'micro', 'front-view', 0.97],
  ['feed-roller-array', 'ridge', 'Paired dark feed rollers are visible inside the output throat during operation.', 'micro', 'front-view', 0.64],
  ['rear-power-inlet', 'hole', 'Square rear power inlet with black circular core.', 'micro', 'back-view', 0.98],
  ['rear-lower-band', 'seam', 'Continuous pink lower rear band separates shell from feet.', 'meso', 'back-view', 0.95],
  ['foot-array', 'fastener', 'Four shallow Sakura-pink rubberized feet support the enclosure.', 'micro', 'side-view', 0.88],
  ['shell-corner-highlight', 'gloss', 'Pale broad edge highlights follow the shell corner radii.', 'micro', 'front-view', 0.9],
  ['output-cavity-inner-lip', 'bevel', 'Raised pink inner lip follows the rectangular output opening.', 'meso', 'front-view', 0.96],
  ['paper-guide-array', 'ridge', 'Two pink vertical guides flank the input page.', 'meso', 'front-view', 0.96],
];
spec.preSpecAssessment.detailInventory = { scanMethod: 'three-view component-zones', targetMinDetails: 16, note: 'Each observed or inferred identity detail maps to a named component local feature or material override.', details: detailRows.map(([ref, kind, description, scale, evidenceRef, confidence], i) => ({ id: `printer-detail-${i + 1}`, kind, description, region: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, scale, affects: 'silhouette/material/interaction', mapsTo: { type: kind === 'gloss' ? 'material.localOverrides' : 'component.localFeatures', ref: kind === 'gloss' ? 'cream-shell-edge-response' : ref }, evidenceRef, confidence })) };
spec.preSpecAssessment.sourceImage = spec.sourceImage;
spec.qualityContract.definitionOfDone = ['The printer matches the three-view silhouette and proportions, preserves the cream/pink material zoning, separates all paper-handling assemblies, and unmistakably prints and ejects a page during the 5.2 second powered cue.'];
spec.qualityTargets.mustMatch = ['wide rounded cream body and thin top seam', 'rear leaning paper support with white input sheet', 'deep pink output cavity and projecting hinged tray', 'large circular control plus small indicator', 'rear power inlet and lower pink band', 'visible paper feed and ejection action'];
spec.assumptions = ['The cartridge carriage, ink path, internal drive and most rollers are hidden and omitted.', 'Two feed rollers are added inside the throat to support the printing action; their exact profile is inferred.', 'The output tray hinge axis and opening travel are inferred from the fixed open pose.', 'Underside fasteners, ventilation and cable shape are not shown; only a rear power socket is provided.'];
spec.coordinateFrame = { front: '+Z faces the output opening and controls', up: '+Y with floor at y=0', scaleReference: 'body width = 3.4 world units; closed body height = 1.58 world units' };
spec.silhouette = { boundingShape: 'wide low rounded enclosure with a backward-leaning paper support above and a short tray projecting forward', aspectRatios: ['body width:height:depth = 3.40:1.58:2.38', 'overall height with input paper = 2.75', 'output tray projection = 0.86'], symmetry: 'main shell is bilateral; right-side controls and rear-right power inlet break symmetry', dominantCurves: ['large shell corner radii', 'rounded output opening', 'tray front lip', 'paper support shoulder radii'], negativeSpaces: ['deep output throat above tray', 'small gap below tray front edge', 'paper guide gaps beside input page'], landmarks: ['pink rear paper support', 'white input page', 'large right control', 'pink output tray', 'rear power inlet'] };
spec.viewEvidence = [
  { id: 'front-view', view: 'front', imagePath: 'references/intake/printer/front.png', imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['body width and corner radius', 'output cavity and tray', 'input page and two controls'], confidence: 0.98 },
  { id: 'side-view', view: 'side', imagePath: 'references/intake/printer/side.png', imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['body depth', 'tray projection', 'rear support lean and foot profile'], confidence: 0.96 },
  { id: 'back-view', view: 'back', imagePath: 'references/intake/printer/back.png', imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['wide rear support backplate', 'lower pink band', 'rear-right power inlet'], confidence: 0.98 },
];

const ids = ['root', 'main-shell', 'top-lid', 'shell-highlight-band', 'rear-paper-support-pivot', 'rear-paper-support', 'rear-support-backplate', 'paper-guide-array', 'input-paper', 'output-cavity', 'output-cavity-inner-lip', 'feed-roller-array', 'output-tray-pivot', 'output-tray', 'tray-handle', 'printed-paper-pivot', 'printed-paper', 'control-button-pivot', 'control-button', 'status-indicator', 'rear-power-inlet', 'rear-lower-band', 'foot-array', 'paper-exit-socket', 'power-cable-socket', 'inferred-print-carriage'];
const names = ['Printer Root', 'Rounded Main Enclosure', 'Top Access Lid', 'Shell Highlight Band', 'Rear Paper Support Pivot', 'Rear Pink Paper Support', 'Rear Support Backplate', 'Twin Paper Guides', 'Input Paper Sheet', 'Deep Output Cavity', 'Raised Output Inner Lip', 'Paired Feed Rollers', 'Output Tray Hinge Pivot', 'Projecting Output Tray', 'Tray Front Grip', 'Printed Paper Feed Pivot', 'Printed Output Sheet', 'Main Control Pivot', 'Layered Round Control', 'Small Status Indicator', 'Rear Power Inlet', 'Rear Pink Lower Band', 'Four Feet', 'Paper Exit Socket', 'Power Cable Socket', 'Inferred Printhead Carriage'];
const oldIds = spec.componentTree.map((c) => c.id);
const rename = new Map(oldIds.map((id, i) => [id, ids[i]]));
const mats = ['cream-shell', 'cream-shell', 'cream-shell', 'cream-shell', 'pink-shell', 'pink-shell', 'pink-shell', 'pink-accent', 'paper', 'cavity-dark', 'pink-accent', 'roller-rubber', 'pink-shell', 'pink-shell', 'pink-accent', 'paper', 'paper', 'pink-accent', 'pink-accent', 'indicator-lens', 'cavity-dark', 'pink-shell', 'roller-rubber', 'cavity-dark', 'cavity-dark', 'cavity-dark'];
spec.componentTree = spec.componentTree.map((c, i) => {
  c.id = ids[i]; c.name = names[i]; c.evidenceRefs = ['front-view', 'side-view', 'back-view'];
  c.localFeatures = [`${c.id}.silhouette`, `${c.id}.bevel`, `${c.id}.material-zone`];
  c.details = c.localFeatures.map((id) => ({ id, kind: 'contour', evidenceRefs: c.evidenceRefs }));
  if (c.parent && rename.has(c.parent)) c.parent = rename.get(c.parent);
  if (i > 0) c.attachment = { parentSocket: c.parent ?? 'root', localStart: [0, 0, 0], localEnd: [0, 0.03, 0], contactType: 'overlap', overlap: 0.03, gapTolerance: 0.01 };
  c.material = mats[i] ?? 'cream-shell'; c.materialLayers = [c.material]; c.fidelityTier = 'form-refinement';
  return c;
});
spec.componentTree[0].geometryDescriptor = { topologyIntent: 'assembled compact printer with independent enclosure, paper supports, cavity, trays, controls and feed modules', edgeTreatment: { type: 'rounded bevel', bevelRadius: 0.14, segments: 4 }, deformationStack: [], uvStrategy: 'generated procedural coordinates', normalStrategy: 'vertex normals' };
spec.componentTree[0].dimensions = { width: 3.4, height: 2.75, depth: 3.4, units: 'world', confidence: 0.96 };
const parents = { root: null, 'main-shell': 'root', 'top-lid': 'main-shell', 'shell-highlight-band': 'main-shell', 'rear-paper-support-pivot': 'main-shell', 'rear-paper-support': 'rear-paper-support-pivot', 'rear-support-backplate': 'rear-paper-support', 'paper-guide-array': 'rear-paper-support', 'input-paper': 'rear-paper-support-pivot', 'output-cavity': 'main-shell', 'output-cavity-inner-lip': 'output-cavity', 'feed-roller-array': 'output-cavity', 'output-tray-pivot': 'main-shell', 'output-tray': 'output-tray-pivot', 'tray-handle': 'output-tray', 'printed-paper-pivot': 'output-cavity', 'printed-paper': 'printed-paper-pivot', 'control-button-pivot': 'main-shell', 'control-button': 'control-button-pivot', 'status-indicator': 'main-shell', 'rear-power-inlet': 'main-shell', 'rear-lower-band': 'main-shell', 'foot-array': 'main-shell', 'paper-exit-socket': 'output-cavity-inner-lip', 'power-cable-socket': 'main-shell', 'inferred-print-carriage': 'output-cavity' };
for (const component of spec.componentTree) {
  component.parent = parents[component.id] ?? 'root';
  if (component.id === 'root') delete component.parent;
  if (component.attachment) component.attachment.parentSocket = component.parent ?? 'root';
}

const matIds = ['cream-shell', 'pink-shell', 'pink-accent', 'paper', 'cavity-dark', 'roller-rubber', 'indicator-lens'];
const matNames = ['Warm Cream ABS Shell', 'Sakura Pink ABS', 'Light Pink Edge Accent', 'Warm White Paper', 'Output Cavity Plastic', 'Dark Feed Roller Rubber', 'Indicator Lens'];
spec.materials = spec.materials.map((m, i) => {
  m.id = matIds[i]; m.name = matNames[i]; m.baseColor = ['#F7EDDE', '#EFB0B4', '#F7C7C5', '#FFFDF4', '#6E535B', '#4D454C', '#F7D9D1'][i]; m.color = m.baseColor;
  m.albedo = { dominant: m.baseColor, secondary: ['#FFF8EA', '#F6C4C4', '#FFE1D8', '#FFF9EA', '#8A676F', '#6A5C64', '#FFFFFF'], samplingNotes: 'Observed from admitted front, side and back color zones.' };
  m.textureResolution = 1024; m.textureProjection = { mode: 'uv', repeat: [2, 2], anisotropy: 8, texelDensityIntent: 'Object-scale stable detail.' };
  m.surfaceFrequencyBands = [{ id: 'macro', frequency: 2, amplitude: 0.18, role: 'broad molded color response' }, { id: 'meso', frequency: 14, amplitude: 0.08, role: 'panel and seam response' }, { id: 'micro', frequency: 58, amplitude: 0.025, role: 'subtle molded-plastic highlight breakup' }];
  m.roughness = { base: [0.43, 0.4, 0.38, 0.75, 0.7, 0.84, 0.3][i], variation: 0.1, map: `independent-${m.id}-roughness` };
  m.metalness = { base: 0, variation: 0 };
  m.ambientOcclusion = { cavityStrength: 0.35, contactShadowBias: 0.3, notes: 'Darken output throat, lid seam, button ring, paper guides and foot contacts.' };
  m.localOverrides = [{ id: `${m.id}-edge-response`, region: 'beveled edges and contact zones', response: 'slightly lower roughness at exposed rounded edges', evidenceRefs: ['front-view', 'side-view'] }];
  m.referencePbr = { usable: true, confidence: 0.84, estimatedFidelity: 0.84, sourceImage: spec.sourceImage, maps: { albedo: { path: spec.sourceImage }, roughness: { path: `procedural-${m.id}-roughness` }, height: { path: `procedural-${m.id}-height` }, normal: { path: `procedural-${m.id}-normal` }, ao: { path: `procedural-${m.id}-ao` } } };
  return m;
});
spec.repetitionSystems = [
  { id: 'paired-paper-guides', name: 'Two paper guide rails', componentRef: 'paper-guide-array', count: 2, distribution: 'mirrored about input page', geometry: 'slender rounded boxes', material: 'pink-accent', evidenceRefs: ['front-view', 'back-view'] },
  { id: 'paired-feed-rollers', name: 'Two feed rollers', componentRef: 'feed-roller-array', count: 2, distribution: 'horizontal pair inside output throat', geometry: 'rubber cylinders', material: 'roller-rubber', evidenceRefs: ['front-view'] },
  { id: 'four-feet', name: 'Four enclosure feet', componentRef: 'foot-array', count: 4, distribution: 'corners under body', geometry: 'shallow rounded pads', material: 'pink-shell', evidenceRefs: ['front-view', 'side-view', 'back-view'] },
  { id: 'control-rings', name: 'Layered control rings', componentRef: 'control-button', count: 3, distribution: 'coaxial layers', geometry: 'cylinders and torus rim', material: 'pink-accent', evidenceRefs: ['front-view'] },
  { id: 'support-side-wings', name: 'Mirrored paper support wings', componentRef: 'rear-paper-support', count: 2, distribution: 'mirrored beside input page', geometry: 'rounded upright rails', material: 'pink-shell', evidenceRefs: ['front-view', 'back-view'] },
];
spec.featureReviewTargets = [
  { id: 'printer-silhouette', name: 'Body, support and tray silhouette', tier: 'critical', passIds: ['blockout', 'form-refinement'], minimumScore: 0.8, mustPass: true, componentRefs: ['main-shell', 'rear-paper-support', 'output-tray'], evidenceRefs: ['front-view', 'side-view', 'back-view'] },
  { id: 'paper-handling', name: 'Input support, paper path, rollers and output sheet', tier: 'critical', passIds: ['structural-pass', 'interaction-pass'], minimumScore: 0.8, mustPass: true, componentRefs: ['rear-paper-support', 'input-paper', 'feed-roller-array', 'printed-paper'], evidenceRefs: ['front-view', 'side-view'] },
  { id: 'output-cavity', name: 'Deep inset output cavity and raised pink lip', tier: 'critical', passIds: ['structural-pass', 'form-refinement'], minimumScore: 0.8, mustPass: true, componentRefs: ['output-cavity', 'output-cavity-inner-lip', 'output-tray'], evidenceRefs: ['front-view'] },
  { id: 'controls', name: 'Large round control and small indicator', tier: 'important', passIds: ['structural-pass', 'material-pass'], minimumScore: 0.74, mustPass: false, componentRefs: ['control-button', 'status-indicator'], evidenceRefs: ['front-view'] },
  { id: 'rear-identity', name: 'Rear paper backplate, lower band and power inlet', tier: 'important', passIds: ['structural-pass', 'form-refinement'], minimumScore: 0.74, mustPass: false, componentRefs: ['rear-support-backplate', 'rear-lower-band', 'rear-power-inlet'], evidenceRefs: ['back-view'] },
  { id: 'printing-action', name: 'Button press, roller spin and page ejection', tier: 'critical', passIds: ['interaction-pass'], minimumScore: 0.82, mustPass: true, componentRefs: ['control-button-pivot', 'feed-roller-array', 'printed-paper-pivot'], evidenceRefs: ['front-view', 'side-view'] },
];
spec.lightingFromPhoto = ['warm upper-left key intensity 3.1 with broad highlight on cream shell', 'cool rear-right fill intensity 1.2', 'pink rear rim intensity 1.4', 'ACES exposure 1.0 on pale neutral background', 'soft contact shadow under four feet and tray'];
spec.proceduralStrategy = ['Lock the low wide enclosure, rear support and tray projection first.', 'Build enclosure, lid, paper support, cavity, tray, controls and power inlet as named assemblies.', 'Reuse paired guide, roller and foot geometries.', 'Animate a visible page from output throat to tray with button press, roller spin and indicator light.', 'Keep reset allocation-free and exact for repeated catalog playback.'];
spec.animationAnchors = ['output-tray-pivot at lower output lip', 'printed-paper-pivot at paper exit', 'control-button-pivot on right front face', 'feed-roller-array inside output throat', 'paper-exit-socket and power-cable-socket'];
spec.destructionAnchors = ['body and lid group', 'rear input support group', 'output cavity and tray group', 'control group', 'rear power group'];
spec.risks = ['internal feed rollers and printhead are inferred', 'paper must never visibly intersect the tray or shell', 'thin paper planes need enough thickness and two-sided shading without excessive draw calls'];
spec.buildPasses = [
  { id: 'blockout', goal: 'Match macro silhouette and ratios.', componentRefs: ['root', 'main-shell', 'rear-paper-support', 'output-tray'], acceptance: ['front/side/back silhouette readable', 'browser comparison score >=0.7'] },
  { id: 'structural-pass', goal: 'Build independent paper, feed, output, control and rear-service assemblies.', componentRefs: ['top-lid', 'rear-paper-support-pivot', 'rear-paper-support', 'paper-guide-array', 'input-paper', 'output-cavity', 'output-cavity-inner-lip', 'feed-roller-array', 'output-tray-pivot', 'output-tray', 'printed-paper-pivot', 'control-button-pivot', 'control-button', 'rear-power-inlet', 'foot-array', 'paper-exit-socket', 'power-cable-socket'], acceptance: ['named pivots and sockets', 'independent input, feed, output and control assemblies', 'rear power inlet and four-foot hierarchy'] },
  { id: 'form-refinement', goal: 'Refine bevels, seams, tray, controls and rear hardware.', componentRefs: ['top-lid', 'rear-support-backplate', 'paper-guide-array', 'output-cavity-inner-lip', 'tray-handle', 'control-button', 'status-indicator', 'rear-lower-band'], acceptance: ['identity details match reference views', 'no floating joints'] },
  { id: 'material-pass', goal: 'Match cream, Sakura pink, paper, dark cavity and rubber separation.', componentRefs: ['main-shell', 'rear-paper-support', 'input-paper', 'output-cavity', 'output-tray', 'feed-roller-array', 'status-indicator'], acceptance: ['reference PBR confidence >=0.7', 'cream, pink, paper and dark cavity zones remain distinct'] },
  { id: 'lighting-pass', goal: 'Verify neutral/reference/grazing readability.', componentRefs: ['root'], acceptance: ['key/fill/rim/contact shadow visible', 'palette remains stable'] },
  { id: 'interaction-pass', goal: 'Verify recognizable powered printing action and exact reset.', componentRefs: ['control-button-pivot', 'feed-roller-array', 'input-paper', 'printed-paper-pivot', 'status-indicator'], acceptance: ['control button visibly depresses and indicator lights', 'feed rollers spin and input sheet advances', 'printed page visibly emerges onto tray', '5.2 second reset exact'] },
  { id: 'optimization-pass', goal: 'Protect browser runtime performance.', componentRefs: ['root'], acceptance: ['shared guide, roller and foot geometries', 'draw calls <=85 and triangles <=55000', 'responsive orbit review and allocation-free update'] },
];
spec.visualEvidence = []; spec.reviewHistory = []; spec.tier1Results = [];
spec.sculptPipeline.currentPass = 'blockout'; spec.sculptPipeline.completedPasses = []; spec.sculptPipeline.lastCompletedPass = ''; spec.sculptPipeline.blockedReason = 'blockout requires browser screenshot and comparison review';
spec.performanceBudget = { qualityPriority: 'reference-fidelity real-time browser', targetTriangles: 55000, maxDrawCalls: 85, textureSize: 1024, fpsTarget: 60, optimizationPolicy: 'Share repeated geometries, use low-segment paper and roller meshes, and avoid allocations in animation update.' };
fs.writeFileSync(outPath, `${JSON.stringify(spec, null, 2)}\n`);
fs.writeFileSync('docs/sculpt-specs/printer/detail-inventory.json', `${JSON.stringify({ sourceImage: spec.sourceImage, sourceViews: ['references/intake/printer/front.png', 'references/intake/printer/side.png', 'references/intake/printer/back.png'], zonesDir: 'docs/sculpt-specs/printer/detail-zones', detailInventory: spec.preSpecAssessment.detailInventory, inferredDetailIds: ['printer-detail-12'], note: 'Feed rollers are inferred from the hidden paper path. All other listed details are directly supported by at least one supplied view.' }, null, 2)}\n`);
console.log(`wrote ${outPath}`);

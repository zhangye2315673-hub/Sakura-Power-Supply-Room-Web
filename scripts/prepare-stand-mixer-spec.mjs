import fs from 'node:fs';

const templatePath = 'docs/sculpt-specs/bubble-machine/object-sculpt-spec.json';
const outPath = 'docs/sculpt-specs/stand-mixer/object-sculpt-spec.json';
const spec = JSON.parse(fs.readFileSync(templatePath, 'utf8'));

spec.targetName = 'SAKURA Stand Mixer';
spec.targetId = 'stand-mixer';
spec.sourceImage = 'references/intake/stand-mixer/front.png';
spec.suitability = 'pass';
spec.scores = { object_isolation: 3, silhouette_readability: 3, depth_inference: 3, primitive_decomposition: 3, material_procedurality: 3, occlusion_risk: 2, interaction_fit: 3 };
spec.referenceCamera = { solved: false, fovDegrees: 36, aspect: 557 / 941, orientation: { yaw: 0, pitch: 0, roll: 0 }, positionHint: [0, 0, 4], note: 'Three orthographic-like views constrain the exterior; hidden drive, bowl lock and hinge internals remain inferred.' };
spec.preSpecAssessment.objectClass = {
  primaryType: 'tilt-head countertop stand mixer', primaryDomain: 'object',
  formLanguage: ['hard-surface', 'rounded-retro', 'layered-shell', 'mechanical'],
  structureKind: ['compound object', 'articulated head', 'rotating tool', 'repeated wire and vent modules'],
  motionPotential: ['tilt head', 'planetary rotation', 'control turn', 'lever actuation', 'material-state'],
  materialFamilies: ['gloss-painted housing', 'ceramic-like bowl', 'painted metal', 'brushed steel', 'rubber'],
  notes: 'Front, side and back establish all exterior masses and controls. Motor, gears, bowl lock and underside cable routing are inferred.'
};
spec.preSpecAssessment.complexity = { tier: 'complex', scores: { silhouetteComplexity: 3, componentCount: 3, hierarchyDepth: 3, repetitionDensity: 3, materialLayerCount: 3, localDetailDensity: 3, occlusionRisk: 2, actionReadinessNeed: 3 }, estimatedCounts: { macroComponents: 5, mesoComponents: 17, microFeatureGroups: 12, materialLayers: 7, repetitionSystems: 4 }, reasoning: ['Long rounded motor head, arched column, deep handled bowl, articulated tool train, controls and repeated whisk/vent structures require a complex hierarchy.'] };

const detailRows = [
  ['motor-head-shell', 'contour', 'Long cream motor head with domed nose and rounded rear cap.', 'macro', 'front-view', 0.96],
  ['head-seam-band', 'seam', 'Continuous Sakura-pink horizontal band around the lower head.', 'meso', 'side-view', 0.95],
  ['speed-dial', 'groove', 'Layered circular pink speed dial on the front face.', 'micro', 'front-view', 0.95],
  ['head-release-lever', 'ridge', 'Small stepped release lever below the left side of the head.', 'micro', 'side-view', 0.88],
  ['rear-column', 'contour', 'Tapered pink rear column with a deep bowl clearance arch.', 'macro', 'side-view', 0.96],
  ['column-hinge-pivot', 'fastener', 'Large concentric pink side hinge disc connecting head and column.', 'meso', 'side-view', 0.93],
  ['planetary-hub', 'bevel', 'Cream stepped drive collar beneath the head.', 'meso', 'front-view', 0.96],
  ['whisk-wire-array', 'ridge', 'Six bowed metal whisk wires converge at a lower ring.', 'meso', 'front-view', 0.94],
  ['mixing-bowl', 'contour', 'Deep cream bowl with flared rolled rim and rounded base.', 'macro', 'front-view', 0.96],
  ['bowl-handle', 'contour', 'Thick cream U-shaped handle attached to the bowl side.', 'meso', 'side-view', 0.92],
  ['bowl-seat', 'seam', 'Raised Sakura-pink circular bowl-lock pedestal.', 'meso', 'front-view', 0.94],
  ['base-shell', 'bevel', 'Wide pink plinth with softened corners and lower step.', 'macro', 'side-view', 0.97],
  ['lower-control-dial', 'groove', 'Concentric cream-and-pink lower column control dial.', 'micro', 'side-view', 0.9],
  ['rear-vent-slot-array', 'hole', 'Eight narrow vertical ventilation slots in an arched rear recess.', 'micro', 'back-view', 0.96],
  ['foot-array', 'fastener', 'Four shallow rubber feet under the plinth.', 'micro', 'side-view', 0.82],
  ['power-socket', 'hole', 'Rear lower power cable connection socket.', 'micro', 'back-view', 0.55],
];
spec.preSpecAssessment.detailInventory = { scanMethod: 'three-view component-zones', targetMinDetails: 14, note: 'Each observed or inferred identity detail maps to a named component feature.', details: detailRows.map(([ref, kind, description, scale, evidenceRef, confidence], i) => ({ id: `stand-mixer-detail-${i + 1}`, kind, description, region: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, scale, affects: 'silhouette/material/interaction', mapsTo: { type: 'component.localFeatures', ref }, evidenceRef, confidence })) };
spec.preSpecAssessment.sourceImage = spec.sourceImage;
spec.qualityContract.definitionOfDone = ['The stand mixer matches the turn-sheet silhouette, head-to-column-to-bowl proportions, repeated whisk and rear vent structures, pastel material separation, and clearly communicates mixing during the 5.2 second powered cue.'];
spec.qualityTargets.mustMatch = ['long rounded cream motor head and pink waist seam', 'arched rear column and side hinge', 'deep handled bowl on raised pink seat', 'stepped planetary hub and six-wire balloon whisk', 'front and lower controls plus eight rear vents', 'reference-derived material response'];
spec.assumptions = ['Motor, reduction gears and internal planetary train are hidden and omitted.', 'Bowl seat locking tabs and underside cable routing are not visible.', 'The exact hinge stop and head tilt angle are inferred from typical use.', 'The small rear lower power connection is inferred because the cable and underside are occluded.'];
spec.coordinateFrame = { front: '+Z faces the bowl and front speed dial', up: '+Y with floor at y=0', scaleReference: 'base width = 3.35 world units; total height = 4.35 world units' };
spec.silhouette = { boundingShape: 'wide stepped base supporting a deep bowl below a long pill-shaped motor head joined by an arched rear column', aspectRatios: ['overall width:height:depth = 3.35:4.35:2.55', 'head width:height:depth = 2.95:1.08:1.52', 'bowl width:height = 2.42:1.58'], symmetry: 'front is mostly bilateral; side view is strongly rear-weighted by column and forward-projecting head', dominantCurves: ['domed head nose', 'deep bowl spline', 'column clearance arch', 'balloon whisk wire arcs'], negativeSpaces: ['open gap below head around whisk', 'arched clearance between bowl and rear column', 'bowl handle opening'], landmarks: ['pink head seam', 'layered front dial', 'large side hinge disc', 'six-wire whisk', 'eight rear vents'] };
spec.viewEvidence = [
  { id: 'front-view', view: 'front', imagePath: 'references/intake/stand-mixer/front.png', imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['head face dial and seam', 'whisk centered over bowl', 'wide stepped base'], confidence: 0.97 },
  { id: 'side-view', view: 'side', imagePath: 'references/intake/stand-mixer/side.png', imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['long motor head depth', 'large side hinge and release lever', 'bowl handle and lower control'], confidence: 0.96 },
  { id: 'back-view', view: 'back', imagePath: 'references/intake/stand-mixer/back.png', imageRegion: { x: 0, y: 0, width: 1, height: 1, units: 'normalized' }, observations: ['tapered rear column', 'arched eight-slot vent recess', 'symmetric side hinge caps'], confidence: 0.95 },
];

const ids = ['root', 'base-shell', 'rear-column', 'motor-head-pivot', 'motor-head-shell', 'head-seam-band', 'planetary-hub', 'beater-pivot', 'beater-collar', 'whisk-wire-array', 'bowl-seat', 'mixing-bowl', 'bowl-rim', 'bowl-handle', 'speed-dial-pivot', 'speed-dial', 'head-release-lever', 'rear-vent-panel', 'rear-vent-slot-array', 'column-hinge-pivot', 'lower-control-dial-pivot', 'lower-control-dial', 'foot-array', 'power-socket', 'status-light', 'inferred-drive'];
const names = ['Stand Mixer Root', 'Stepped Base Shell', 'Tapered Rear Column', 'Tilt Head Pivot', 'Rounded Motor Head', 'Pink Head Seam Band', 'Planetary Drive Hub', 'Beater Spin Pivot', 'Stepped Beater Collar', 'Six-Wire Balloon Whisk', 'Raised Bowl Seat', 'Deep Mixing Bowl', 'Rolled Bowl Rim', 'Bowl U Handle', 'Front Speed Dial Pivot', 'Layered Speed Dial', 'Head Release Lever', 'Rear Vent Recess', 'Eight Rear Vent Slots', 'Side Head Hinge', 'Lower Control Pivot', 'Lower Cream Control Dial', 'Four Rubber Feet', 'Inferred Power Socket', 'Status Indicator', 'Inferred Internal Drive'];
const oldIds = spec.componentTree.map((c) => c.id);
const rename = new Map(oldIds.map((id, i) => [id, ids[i]]));
spec.componentTree = spec.componentTree.map((c, i) => {
  c.id = ids[i]; c.name = names[i]; c.evidenceRefs = ['front-view', 'side-view', 'back-view'];
  c.localFeatures = [`${c.id}.silhouette`, `${c.id}.bevel`, `${c.id}.material-zone`];
  c.details = c.localFeatures.map((id) => ({ id, kind: 'contour', evidenceRefs: c.evidenceRefs }));
  if (c.parent && rename.has(c.parent)) c.parent = rename.get(c.parent);
  if (i > 0) c.attachment = { parentSocket: c.parent ?? 'root', localStart: [0, 0, 0], localEnd: [0, 0.03, 0], contactType: 'overlap', overlap: 0.03, gapTolerance: 0.01 };
  const mats = ['pink-shell', 'pink-shell', 'pink-shell', 'pink-shell', 'cream-shell', 'pink-accent', 'cream-shell', 'steel-wire', 'cream-shell', 'steel-wire', 'pink-accent', 'cream-shell', 'cream-shell', 'cream-shell', 'pink-accent', 'pink-accent', 'pink-accent', 'cream-shell', 'vent-dark', 'pink-accent', 'pink-accent', 'cream-shell', 'rubber', 'vent-dark', 'pink-accent', 'vent-dark'];
  c.material = mats[i] ?? 'cream-shell'; c.materialLayers = [c.material]; c.fidelityTier = 'form-refinement';
  return c;
});
spec.componentTree[0].geometryDescriptor = { topologyIntent: 'assembled tilt-head mixer with independent shells, bowl and rotating tool', edgeTreatment: { type: 'rounded bevel', bevelRadius: 0.12, segments: 4 }, deformationStack: [], uvStrategy: 'generated procedural coordinates', normalStrategy: 'vertex normals' };
spec.componentTree[0].dimensions = { width: 3.35, height: 4.35, depth: 2.55, units: 'world', confidence: 0.94 };

const matIds = ['cream-shell', 'pink-shell', 'pink-accent', 'steel-wire', 'vent-dark', 'rubber', 'mixture'];
const matNames = ['Warm Cream Painted Shell', 'Sakura Pink Housing', 'Light Pink Accent', 'Brushed Steel Wires', 'Vent Cavity', 'Rubber Feet', 'Whipped Mixture'];
spec.materials = spec.materials.map((m, i) => {
  m.id = matIds[i]; m.name = matNames[i]; m.baseColor = ['#F8EBD5', '#EFA9B1', '#F7C2C2', '#D8D0C5', '#756269', '#514A52', '#FFF3D4'][i]; m.color = m.baseColor;
  m.albedo = { dominant: m.baseColor, secondary: ['#FFF7E8', '#F5C1C5', '#FFE0DB', '#EFE9DF', '#92777E', '#6C626D', '#FFFFFF'], samplingNotes: 'Observed from admitted turn-sheet color zones.' };
  m.textureResolution = 1024; m.textureProjection = { mode: 'uv', repeat: [2, 2], anisotropy: 8, texelDensityIntent: 'Object-scale stable detail.' };
  m.surfaceFrequencyBands = [{ id: 'macro', frequency: 2, amplitude: 0.22, role: 'broad shell color variation' }, { id: 'meso', frequency: 12, amplitude: 0.1, role: 'seam and panel response' }, { id: 'micro', frequency: 56, amplitude: 0.035, role: 'grazing highlight breakup' }];
  m.roughness = { base: [0.42, 0.4, 0.38, 0.24, 0.72, 0.78, 0.66][i], variation: 0.12, map: `independent-${m.id}-roughness` };
  m.metalness = { base: i === 3 ? 0.72 : 0, variation: i === 3 ? 0.08 : 0 };
  m.ambientOcclusion = { cavityStrength: 0.32, contactShadowBias: 0.3, notes: 'Darken seams, vent slots, whisk hub and bowl seat.' };
  m.localOverrides = [{ id: `${m.id}-edge-response`, region: 'beveled edges and contact zones', response: 'lower roughness at exposed edges', evidenceRefs: ['front-view', 'side-view'] }];
  m.referencePbr = { usable: true, confidence: 0.84, estimatedFidelity: 0.84, sourceImage: spec.sourceImage, maps: { albedo: { path: 'references/intake/stand-mixer/front.png' }, roughness: { path: 'procedural-independent-roughness' }, height: { path: 'procedural-independent-height' }, normal: { path: 'procedural-independent-normal' }, ao: { path: 'procedural-independent-ao' } } };
  return m;
});
spec.repetitionSystems = [
  { id: 'whisk-six-wires', name: 'Six balloon whisk wires', componentRef: 'whisk-wire-array', count: 6, distribution: 'radial around beater axis', geometry: 'tube curves bowed outward and reconverged', material: 'steel-wire', evidenceRefs: ['front-view', 'side-view'] },
  { id: 'rear-eight-vents', name: 'Eight rear vent slots', componentRef: 'rear-vent-slot-array', count: 8, distribution: 'vertical array in arched rear recess', geometry: 'rounded narrow slots', material: 'vent-dark', evidenceRefs: ['back-view'] },
  { id: 'four-feet', name: 'Four rubber feet', componentRef: 'foot-array', count: 4, distribution: 'corners under base', geometry: 'shallow rounded pads', material: 'rubber', evidenceRefs: ['front-view', 'side-view'] },
  { id: 'dial-concentric-rings', name: 'Concentric control dial rings', componentRef: 'speed-dial', count: 3, distribution: 'coaxial layers', geometry: 'cylinders and torus rings', material: 'pink-accent', evidenceRefs: ['front-view', 'side-view'] },
  { id: 'side-hinge-caps', name: 'Mirrored side hinge caps', componentRef: 'column-hinge-pivot', count: 2, distribution: 'mirrored on left and right sides of head-column joint', geometry: 'concentric cylindrical caps', material: 'pink-accent', evidenceRefs: ['side-view', 'back-view'] },
];
spec.featureReviewTargets = [
  { id: 'mixer-silhouette', name: 'Head column bowl and base silhouette', tier: 'critical', passIds: ['blockout', 'form-refinement'], minimumScore: 0.8, mustPass: true, componentRefs: ['motor-head-shell', 'rear-column', 'mixing-bowl', 'base-shell'], evidenceRefs: ['front-view', 'side-view'] },
  { id: 'planetary-whisk', name: 'Stepped drive and six-wire whisk', tier: 'critical', passIds: ['structural-pass', 'interaction-pass'], minimumScore: 0.8, mustPass: true, componentRefs: ['planetary-hub', 'beater-pivot', 'whisk-wire-array'], evidenceRefs: ['front-view', 'side-view'] },
  { id: 'bowl-seat-handle', name: 'Deep bowl, rolled rim, handle and seat', tier: 'critical', passIds: ['structural-pass', 'form-refinement'], minimumScore: 0.78, mustPass: true, componentRefs: ['mixing-bowl', 'bowl-rim', 'bowl-handle', 'bowl-seat'], evidenceRefs: ['front-view', 'side-view'] },
  { id: 'controls-hinge', name: 'Front dial, release lever, side hinge and lower dial', tier: 'important', passIds: ['structural-pass', 'form-refinement'], minimumScore: 0.72, mustPass: false, componentRefs: ['speed-dial', 'head-release-lever', 'column-hinge-pivot', 'lower-control-dial'], evidenceRefs: ['front-view', 'side-view'] },
  { id: 'rear-vents', name: 'Arched eight-slot rear vent', tier: 'important', passIds: ['structural-pass', 'form-refinement'], minimumScore: 0.72, mustPass: false, componentRefs: ['rear-vent-panel', 'rear-vent-slot-array'], evidenceRefs: ['back-view'] },
  { id: 'mixing-action', name: 'Tilt, lever, whisk and visible mixture action', tier: 'critical', passIds: ['interaction-pass'], minimumScore: 0.8, mustPass: true, componentRefs: ['motor-head-pivot', 'beater-pivot', 'whisk-wire-array', 'mixing-bowl'], evidenceRefs: ['front-view', 'side-view'] },
];
spec.lightingFromPhoto = ['warm upper-left key intensity 3.1 with broad soft shadow', 'cool rear-right fill intensity 1.25', 'pink rear rim intensity 1.45', 'ACES exposure 1.0 on pale neutral background', 'soft ground contact shadow under four feet'];
spec.proceduralStrategy = ['Lock base, column, head and bowl proportions first.', 'Build head, hinge, controls, bowl and whisk as separate named assemblies.', 'Use CatmullRom tube curves for six whisk wires and repeated rounded boxes for vents.', 'Animate head tilt, release lever, planetary rotation and visible cream mixture with exact reset.', 'Reuse repeated geometries to preserve real-time browser performance.'];
spec.animationAnchors = ['motor-head-pivot around rear side hinge', 'beater-pivot beneath planetary hub', 'speed-dial-pivot on front face', 'head-release-lever-pivot beneath head', 'bowl-seat-socket and power-cable-socket'];
spec.destructionAnchors = ['base and column shell group', 'tilt head and hinge group', 'bowl and handle group', 'planetary hub and whisk group'];
spec.risks = ['interior drive and bowl locking geometry are inferred', 'whisk wire arcs require enough segments to remain smooth without excessive triangles', 'visible mixture must remain inside bowl and reset deterministically'];
spec.visualEvidence = []; spec.reviewHistory = []; spec.tier1Results = [];
spec.sculptPipeline.currentPass = 'blockout'; spec.sculptPipeline.completedPasses = []; spec.sculptPipeline.lastCompletedPass = ''; spec.sculptPipeline.blockedReason = 'blockout requires browser screenshot and comparison review';
spec.performanceBudget = { qualityPriority: 'reference-fidelity real-time browser', targetTriangles: 80000, maxDrawCalls: 110, textureSize: 1024, fpsTarget: 60, optimizationPolicy: 'Share wire/vent/foot geometries and avoid particle allocations during update.' };
spec.buildPasses = [
  { id: 'blockout', goal: 'Lock the head, column, bowl and base silhouette.', componentRefs: ['base-shell', 'rear-column', 'motor-head-shell', 'mixing-bowl'], acceptance: ['Front, side and back macro silhouette matches the turn sheet.', 'Browser comparison score is at least 0.7.'] },
  { id: 'structural-pass', goal: 'Build every articulated and repeated assembly as named components.', componentRefs: ['motor-head-pivot', 'planetary-hub', 'beater-pivot', 'mixing-bowl', 'bowl-handle', 'speed-dial-pivot', 'rear-vent-slot-array'], acceptance: ['Named pivots and sockets exist for head, tool, bowl, controls and power.', 'Six whisk wires, eight rear vents, two handles, two hinge caps and four feet remain separate readable systems.', 'Browser comparison score is at least 0.7.'] },
  { id: 'form-refinement', goal: 'Refine head dome, column inset, bowl profile, seams, controls and wire curvature.', componentRefs: ['motor-head-shell', 'rear-column', 'mixing-bowl', 'whisk-wire-array', 'rear-vent-panel'], acceptance: ['Curves, bevels, seams and negative spaces remain legible across four views.', 'Browser comparison score is at least 0.7.'] },
  { id: 'material-pass', goal: 'Separate SAKURA cream, pink, steel, cavity, rubber and mixture responses.', componentRefs: ['motor-head-shell', 'base-shell', 'mixing-bowl', 'whisk-wire-array', 'rear-vent-slot-array'], acceptance: ['Material classes remain distinct under neutral and grazing light.', 'Browser comparison score is at least 0.7.'] },
  { id: 'lighting-pass', goal: 'Verify bevels, bowl depth, wire curves and contact shadows in the review scene.', componentRefs: ['root'], acceptance: ['Key, fill and rim reveal cream/pink separation without blowing out the bowl.', 'Browser comparison score is at least 0.7.'] },
  { id: 'interaction-pass', goal: 'Show release, head tilt, control turn, planetary whisk and mixture action with exact reset.', componentRefs: ['motor-head-pivot', 'head-release-lever', 'speed-dial-pivot', 'beater-pivot', 'mixing-bowl'], acceptance: ['The appliance purpose is recognizable at a glance during the 5.2-second cue.', 'stop restores every mutable transform and material state.', 'Browser comparison score is at least 0.7.'] },
  { id: 'optimization-pass', goal: 'Keep all identity details inside real-time browser budgets.', componentRefs: ['root', 'whisk-wire-array', 'rear-vent-slot-array', 'foot-array'], acceptance: ['Draw calls, triangle count and reset allocation behavior stay within budget.'] },
];
fs.writeFileSync(outPath, `${JSON.stringify(spec, null, 2)}\n`);
console.log(`wrote ${outPath}`);

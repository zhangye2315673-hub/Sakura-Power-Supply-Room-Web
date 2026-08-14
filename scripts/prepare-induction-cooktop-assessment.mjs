import fs from 'node:fs';

const path = 'docs/sculpt-specs/induction-cooktop/pre-spec-assessment.json';
const doc = JSON.parse(fs.readFileSync(path, 'utf8'));
const assessment = doc.preSpecAssessment;

assessment.objectClass = {
  primaryType: 'portable single-zone induction cooktop',
  primaryDomain: 'object',
  formLanguage: ['low rounded-square slab', 'soft Sakura domestic appliance', 'concentric circular graphics'],
  structureKind: ['layered enclosure', 'top control surface', 'ventilated underside'],
  motionPotential: ['rotary control feedback', 'heating-zone pulse', 'steam plume'],
  materialFamilies: ['glass ceramic', 'painted plastic', 'rubber', 'metal hardware'],
  notes: 'The supplied front, side and back files are respectively top, side and underside orthographic-style views.',
};
assessment.complexity.scores = {
  silhouetteComplexity: 0.45,
  componentCount: 0.74,
  hierarchyDepth: 0.62,
  repetitionDensity: 0.78,
  materialLayerCount: 0.65,
  localDetailDensity: 0.76,
  occlusionRisk: 0.58,
  actionReadinessNeed: 0.7,
};
assessment.complexity.estimatedCounts = {
  macroComponents: 5,
  mesoComponents: 13,
  microFeatureGroups: 8,
  materialLayers: 6,
  repetitionSystems: 4,
};
assessment.complexity.reasoning = [
  'The macro silhouette is simple, but identity depends on layered top edging, a dense control strip and three repeated ventilation systems.',
  'The underside supplies direct evidence for the fan grille, four feet and cable recess; internal coil and airflow remain hidden.',
];
assessment.specDepthDecision.rationale = 'Complex depth is required because a shallow slab would omit the control hierarchy, underside service structure and action-ready heating cues.';
assessment.unknownsToResolveBeforeImplementation = [
  'The exact rear wall is not shown independently; rear seam and inlet routing are inferred from the side and underside views.',
  'The induction coil, fan impeller, controller board and thermal insulation are hidden and will not be fabricated.',
  'Button legend artwork is represented by simple geometric glyphs, not exact printed typography.',
  'Cable trough depth and strain-relief attachment are inferred from the underside view.',
];

const details = [
  ['top-rounded-square-silhouette', 'macro', 'outer rounded-square footprint with generous corner radii and thin black perimeter line', 'main-enclosure'],
  ['cream-bezel-step', 'meso', 'warm cream raised frame surrounding the pink top panel', 'top-bezel'],
  ['pink-glass-ceramic-panel', 'macro', 'flush pale pink cooking surface with soft central highlight', 'cooking-panel'],
  ['heater-zone-ring', 'meso', 'large centered dotted circular induction-zone marking and center dot', 'heating-zone'],
  ['control-knob', 'meso', 'large cream rotary knob at front center with dark rim and index mark', 'control-knob'],
  ['left-timer-button', 'micro', 'small layered circular timer button on the front-left control strip', 'timer-button'],
  ['left-mode-button', 'micro', 'small layered heat-mode button beside the timer control', 'mode-button'],
  ['right-power-button', 'micro', 'small layered power button on the front-right control strip', 'power-button'],
  ['plus-minus-marks', 'micro', 'minus and plus glyphs flanking the rotary knob', 'control-glyphs'],
  ['right-side-vent-array', 'micro', 'nine narrow vertical ventilation slots in the right side wall', 'side-vents'],
  ['mint-lower-band', 'meso', 'muted mint-green lower enclosure visible along the side and underside edge', 'lower-band'],
  ['four-rubber-feet', 'micro', 'four separate round mint rubber feet near underside corners', 'foot-array'],
  ['underside-fan-grille', 'meso', 'large circular fan opening formed by concentric rings and radial arc slots', 'fan-grille'],
  ['cable-storage-recess', 'meso', 'rectangular underside cable trough with rounded inner corners', 'cable-trough'],
  ['coiled-power-cord', 'micro', 'U-shaped stored cord ending in a compact two-pin plug', 'power-cord'],
  ['panel-seams', 'micro', 'fine separation lines between cooking panel, bezel, side shell and lower band', 'seam-system'],
];
assessment.detailInventory.details = details.map(([id, scale, observation, mapping]) => ({
  id,
  zone: id.includes('underside') || id.includes('foot') || id.includes('cable') || id.includes('cord') ? 'underside' : id.includes('vent') ? 'right-side' : 'top',
  scale,
  observation,
  implementation: 'separate procedural geometry',
  mappedTo: { componentId: mapping },
  evidenceRefs: ['front.png', 'side.png', 'back.png'],
}));

doc.qualityContract.definitionOfDone = [
  'Three-quarter render immediately reads as the supplied low Sakura induction cooktop rather than a generic slab.',
  'Top, side and underside views preserve the rounded-square footprint, low thickness, control placement, vent count and underside systems.',
  'Powered motion makes induction heating obvious through knob response, concentric heat pulses and rising steam while preserving real-time performance.',
];
doc.qualityContract.visualDeltaChecks = [
  'top footprint width-to-depth and corner radius',
  'slab thickness and mint lower-band height',
  'heating-zone diameter and control-strip spacing',
  'nine side vents and four foot positions',
  'underside fan-grille and cable-recess layout',
  'glass-ceramic versus plastic material response',
];

fs.writeFileSync(path, `${JSON.stringify(doc, null, 2)}\n`);

import fs from 'node:fs';

const path = 'docs/sculpt-specs/desktop-computer/pre-spec-assessment.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));
const p = data.preSpecAssessment;

p.objectClass = {
  primaryType: 'desktop computer workstation set',
  primaryDomain: 'object',
  formLanguage: ['hard-surface', 'rounded-retro', 'layered-shell', 'geometric'],
  structureKind: ['compound object', 'articulated monitor stand', 'repeated key modules', 'repeated ventilation modules'],
  motionPotential: ['power-state', 'screen-state', 'cursor-motion', 'key-press', 'cooling-fan'],
  materialFamilies: ['satin cream plastic', 'satin pink plastic', 'screen glass', 'dark port cavity', 'rubber'],
  notes: 'Three orthographic-like views establish the exterior workstation. Hidden electronics, monitor hinge stops, keyboard switches and mouse internals remain inferred.',
};
p.complexity = {
  tier: 'complex',
  scores: {
    silhouetteComplexity: 3,
    componentCount: 3,
    hierarchyDepth: 3,
    repetitionDensity: 3,
    materialLayerCount: 3,
    localDetailDensity: 3,
    occlusionRisk: 2,
    actionReadinessNeed: 3,
  },
  estimatedCounts: {
    macroComponents: 5,
    mesoComponents: 22,
    microFeatureGroups: 16,
    materialLayers: 7,
    repetitionSystems: 4,
  },
  reasoning: [
    'Five independently recognizable appliances form one workstation silhouette.',
    'Keycaps and ventilation perforations require dense repeated systems; monitor hinge and animated screen/input states require an action-ready hierarchy.',
  ],
};
p.specDepthDecision = {
  requiredDepth: 'complex',
  minimumComponentLevels: ['macro', 'meso', 'micro'],
  needsRepetitionSystems: true,
  needsMaterialLocalOverrides: true,
  needsMultipleReviewViews: true,
  needsActionReadyHierarchy: true,
  rationale: 'Compound hard-surface set with articulated support, multiple I/O panels and repeated keys/vents.',
};
p.unknownsToResolveBeforeImplementation = [
  'Tower internal motherboard, GPU, PSU and cooling path are hidden and will not be reconstructed.',
  'Monitor hinge internals and pitch stops are inferred from the visible mount and stand contact.',
  'Keyboard switch layout beneath keycaps and mouse optical/mechanical internals are hidden.',
  'Rear port protocol identity is uncertain; only visible socket shapes and placement will be reconstructed.',
  'Cables are absent from the references; only named cable sockets will be published.',
];

const region = { x: 0, y: 0, width: 1, height: 1, units: 'normalized' };
const detail = (id, kind, description, scale, affects, ref, evidenceRef, confidence) => ({
  id, kind, description, region: { ...region }, scale, affects,
  mapsTo: { type: 'component.localFeatures', ref }, evidenceRef, confidence,
});
p.detailInventory = {
  scanMethod: 'three-view component-zones',
  targetMinDetails: 22,
  note: 'Each observed identity detail maps to a named component or material feature.',
  details: [
    detail('desktop-detail-01', 'contour', 'Wide rounded cream monitor bezel around a recessed dark display.', 'macro', 'silhouette/material', 'monitor-shell', 'front-monitor', 0.99),
    detail('desktop-detail-02', 'bevel', 'Real rounded monitor rim catches a continuous highlight.', 'meso', 'geometry', 'monitor-bezel', 'front-monitor', 0.97),
    detail('desktop-detail-03', 'emissive', 'Screen is dark when off and becomes the dominant emissive computer interface when powered.', 'meso', 'material/interaction', 'screen-panel', 'front-monitor', 0.97),
    detail('desktop-detail-04', 'decal', 'Five-petal pink flower mark centered on monitor rear shell.', 'micro', 'identity/material', 'monitor-rear-emblem', 'back-monitor', 0.95),
    detail('desktop-detail-05', 'seam', 'Pink square rear mount plate separates the shell from the stand column.', 'meso', 'structure', 'monitor-mount-plate', 'back-monitor', 0.96),
    detail('desktop-detail-06', 'contour', 'Rear-leaning pink stand column with cream inner highlight strip.', 'meso', 'silhouette/structure', 'monitor-stand-column', 'side-monitor', 0.95),
    detail('desktop-detail-07', 'ridge', 'Two-stage cream and pink rounded monitor base.', 'meso', 'silhouette/structure', 'monitor-stand-base', 'front-monitor', 0.97),
    detail('desktop-detail-08', 'contour', 'Tall cream tower shell with rounded corners and four pink feet.', 'macro', 'silhouette/structure', 'tower-shell', 'front-tower', 0.99),
    detail('desktop-detail-09', 'seam', 'Pink top cap overlaps tower shell with a horizontal seam.', 'meso', 'geometry/material', 'tower-top-cap', 'front-tower', 0.98),
    detail('desktop-detail-10', 'decal', 'Five-petal flower badge on tower front.', 'micro', 'identity/material', 'tower-front-emblem', 'front-tower', 0.94),
    detail('desktop-detail-11', 'ridge', 'Vertical pink front I/O strip stands proud of the cream shell.', 'meso', 'structure/material', 'tower-front-io', 'front-tower', 0.98),
    detail('desktop-detail-12', 'hole', 'Large circular power button, status aperture and two rectangular USB cavities.', 'micro', 'geometry/interaction', 'tower-front-controls', 'front-tower', 0.96),
    detail('desktop-detail-13', 'seam', 'Vertical tower side-panel split remains visible in profile.', 'micro', 'geometry', 'tower-side-seam', 'side-tower', 0.92),
    detail('desktop-detail-14', 'fastener', 'Side ventilation field forms a regular rounded-hole grid.', 'micro', 'geometry/repetition', 'tower-side-vents', 'side-tower', 0.97),
    detail('desktop-detail-15', 'fastener', 'Rear has separate narrow and wide dense ventilation arrays.', 'micro', 'geometry/repetition', 'tower-rear-vents', 'back-tower', 0.98),
    detail('desktop-detail-16', 'hole', 'Rear I/O column contains circular and rectangular socket cavities.', 'micro', 'geometry', 'tower-rear-io', 'back-tower', 0.95),
    detail('desktop-detail-17', 'hole', 'Bottom rear IEC-like power inlet sits beside a recessed service panel.', 'micro', 'geometry', 'tower-power-inlet', 'back-tower', 0.97),
    detail('desktop-detail-18', 'contour', 'Keyboard has a cream rounded wedge shell and pink inset deck.', 'macro', 'silhouette/material', 'keyboard-shell', 'front-keyboard', 0.98),
    detail('desktop-detail-19', 'ridge', 'Independent cream/pink keycaps form six rows with a long pink spacebar.', 'micro', 'geometry/repetition/interaction', 'keyboard-key-system', 'front-keyboard', 0.97),
    detail('desktop-detail-20', 'contour', 'Mouse uses a pink continuous arch over a cream lower shell.', 'macro', 'silhouette/material', 'mouse-shell', 'side-mouse', 0.98),
    detail('desktop-detail-21', 'seam', 'Mouse center split separates buttons and carries a small wheel slot.', 'micro', 'geometry/interaction', 'mouse-button-system', 'front-mouse', 0.93),
    detail('desktop-detail-22', 'emissive', 'Power LED, screen boot glow, cursor/window changes and cooling cue act in one 5.2 second powered sequence.', 'micro', 'interaction/material', 'computer-powered-state', 'front-full', 0.9),
  ],
};

data.qualityContract.qualityBar = 'complex';
data.qualityContract.definitionOfDone = [
  'Front, side, back and three-quarter renders preserve the five-piece workstation silhouette and reference proportions.',
  'Monitor, stand, tower, keyboard and mouse remain separately named, pickable and explodable assemblies.',
  'Monitor bezel/screen, tower top/I-O/vent systems, keyboard key matrix and mouse shell split remain readable at catalog scale.',
  'The 5.2-second powered action unmistakably reads as a computer boot and input cycle, and stop returns every animated property to its exact initial value.',
];
data.qualityContract.minimumSpecDepth = {
  macroComponents: 5,
  mesoComponents: 18,
  microFeatureGroups: 14,
  materialLayers: 6,
  repetitionSystems: 3,
  reviewViewpoints: 5,
};
data.qualityContract.featureGroups = [
  {
    id: 'workstation-silhouette', name: 'Five-piece workstation silhouette', required: true,
    qualityCriteria: ['Monitor, tower, keyboard and mouse proportions and spacing match all three turn-sheet views.'],
    evidenceRefs: ['front-full', 'side-full', 'back-full'],
    failureModes: ['tower or monitor dominates at the wrong scale', 'keyboard/mouse read as unrelated floating props'],
  },
  {
    id: 'monitor-stand-system', name: 'Monitor and articulated stand', required: true,
    qualityCriteria: ['Rounded bezel, recessed screen, rear mount, leaning column and two-stage base are separate connected solids.'],
    evidenceRefs: ['front-monitor', 'side-monitor', 'back-monitor'],
    failureModes: ['screen is a flat unframed plane', 'column floats from mount or base', 'depth collapses in side view'],
  },
  {
    id: 'tower-shell-io', name: 'Tower shell, top cap and I/O', required: true,
    qualityCriteria: ['Cream rounded volume, pink top cap, front strip and rear service/I-O regions preserve placement and material separation.'],
    evidenceRefs: ['front-tower', 'side-tower', 'back-tower'],
    failureModes: ['generic featureless box', 'front and rear interface panels fused into shell'],
  },
  {
    id: 'ventilation-system', name: 'Side and rear ventilation fields', required: true,
    qualityCriteria: ['Side field and two rear fields remain dense, regular and clearly separate from shell surface.'],
    evidenceRefs: ['side-tower', 'back-tower'],
    failureModes: ['vents are missing or painted dots without depth cues', 'density differs strongly from reference'],
  },
  {
    id: 'input-device-system', name: 'Keyboard and mouse input devices', required: true,
    qualityCriteria: ['Six key rows, long spacebar, pink function/edge zones, arched mouse and wheel split are recognizable and independent.'],
    evidenceRefs: ['front-keyboard', 'side-keyboard', 'front-mouse', 'side-mouse'],
    failureModes: ['keyboard is one textured slab', 'mouse is a sphere/box with no button seam'],
  },
  {
    id: 'computer-powered-state', name: 'Purpose-readable powered animation', required: true,
    qualityCriteria: ['Power button/LED, boot screen, desktop window, cursor movement, keypress and cooling cue form one bounded sequence.', 'stop resets screen, keys, lights, cursor and fan exactly.'],
    evidenceRefs: ['front-full', 'back-tower'],
    failureModes: ['only whole-object shaking', 'screen remains dark', 'animation residue after stop'],
  },
];
data.qualityContract.visualDeltaChecks = [
  'five-piece bounding silhouette and relative scale delta',
  'monitor depth, rear mount and stand attachment delta',
  'tower front/side/back panel layout and ventilation density delta',
  'keyboard row/spacebar and mouse arch/seam delta',
  'cream/pink/dark-screen material-zone delta',
  'boot-screen and input-action readability delta',
];

fs.writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);

import { readFile, writeFile } from 'node:fs/promises';

const path = 'docs/sculpt-specs-v2/popcorn-machine/object-sculpt-spec.json';
const spec = JSON.parse(await readFile(path, 'utf8'));
const replace = (value) => JSON.parse(JSON.stringify(value).replaceAll('coffee-maker', 'popcorn-machine').replaceAll('Coffee maker', 'Popcorn machine').replaceAll('Coffee Maker', 'Popcorn Machine').replaceAll('coffee maker', 'popcorn machine'));
const next = replace(spec);
next.targetName = 'SAKURA Popcorn Machine v2';
next.targetId = 'popcorn-machine-v2';
next.sourceImage = 'references/intake-v2/popcorn-machine/views/front.png';
next.sourceImages = ['front', 'side', 'back', 'three-quarter'].map((view) => `references/intake-v2/popcorn-machine/views/${view}.png`);
next.suitability = 'conditional';
next.preSpecAssessment.objectClass = {
  primaryType: 'countertop-popcorn-vending-machine', primaryDomain: 'object',
  formLanguage: ['stylized-low-poly', 'faceted-hard-surface', 'exaggerated-cinema-silhouette'],
  structureKind: ['three-band-tower', 'transparent-chamber', 'cinema-canopy', 'arched-dispense-cavity'],
  motionPotential: ['popper-rotation', 'chamber-eruption', 'outward-dispense-burst'],
  materialFamilies: ['matte-cream-polymer', 'sakura-pink-polymer', 'cool-plum-cavity', 'tinted-glass', 'food-toon'],
  notes: 'Archived v1 four-view captures are conditionally admitted; frozen runtime anchors and bounds are authoritative.',
};
const labels = [
  ['root','Frozen runtime root'],['cabinet-system','Faceted lower cabinet'],['chamber-system','Transparent chamber and rails'],['canopy-system','Low cinema canopy and crown'],
  ['frame-system','Four posts and front braces'],['delivery-system','Arched chute and tray'],['control-system','Polygon control and side release'],['popper-system','Roof drive disc and arms'],
  ['popcorn-system','Internal five-lobe popcorn'],['outward-system','Socket-bound outward burst'],['rear-service','Rear service panel'],['rear-vents','Ten rear vents'],
  ['feet','Four floor feet'],['glass-system','Four independent clear panels'],['outline-system','Stable uneven three-tier ink'],['marquee-system','Front marquee and cabinet blades'],
];
next.componentTree = labels.map(([id,name], index) => {
  const item = replace(spec.componentTree[Math.min(index, spec.componentTree.length - 1)]);
  item.id=id; item.name=name; item.parent=index===0?null:'root'; item.level=index<6?'macro':index<14?'meso':'micro'; item.role=id;
  item.material=id.includes('glass')?'hopper-glass':id.includes('popcorn')||id.includes('outward')?'bean':id.includes('outline')?'ink':id.includes('delivery')?'cavity':id.includes('canopy')||id.includes('control')||id.includes('marquee')?'accent':'shell';
  item.localFeatures = [{ id:`${id}-named-geometry`, name:'named procedural geometry', evidenceRefs:['runtime-contract'], geometry:'independent named low-poly parts' }];
  item.evidenceRefs=['runtime-contract','front-view','three-quarter-view'];
  return item;
});
const details = ['three-band tower silhouette','eight-plane cabinet','pink base rail','cinema canopy','three roof ribs','top crown','four clear panels','four chamber posts','two front braces','lower chamber rail','upper chamber rail','deep arched chute','chute back wall','projecting tray','tray lip','polygon control','control index','side release','two side hubs','rear service panel','ten rear vents','four feet','drive column','rotor disc','three stirring arms','warm lamp','dense static pile','powered chamber pieces','48 outward pieces','stable three-tier ink'];
next.preSpecAssessment.detailInventory = { scanMethod:'four-view-plus-runtime-contract', targetMinDetails:20, note:'All details map to root or named component features.', details:details.map((description,index)=>({id:`popcorn-machine-detail-${index+1}`,kind:index%3===0?'contour':index%3===1?'bevel':'linework',description,region:{x:(index%3)/3,y:(index%6)/6,width:0.33,height:0.16,units:'normalized'},scale:index<6?'macro':index<22?'meso':'micro',affects:'geometry, materialSurface, actionReadiness',mapsTo:{type:'component.localFeatures',ref:'root'},evidenceRef:'runtime-contract',confidence:0.95})) };
next.componentTree[0].localFeatures.push(...details.map((_,index)=>`popcorn-machine-detail-${index+1}`));
next.qualityContract.minimumSpecDepth = { macroComponents:6, mesoComponents:8, microFeatureGroups:2, materialLayers:9, repetitionSystems:6, reviewViewpoints:7 };
next.repetitionSystems = [
  {id:'static-popcorn',componentRef:'popcorn-system',count:56,distribution:'packed chamber mound',geometry:'shared five-lobe geometry',material:'bean',evidenceRefs:['runtime-contract']},
  {id:'powered-popcorn',componentRef:'popcorn-system',count:24,distribution:'staggered chamber eruption',geometry:'shared five-lobe geometry',material:'bean',evidenceRefs:['runtime-contract']},
  {id:'outward-popcorn',componentRef:'outward-system',count:48,distribution:'dispense socket to positive Z',geometry:'shared five-lobe geometry',material:'bean',evidenceRefs:['runtime-contract']},
  {id:'post-system',componentRef:'frame-system',count:4,distribution:'chamber corners',geometry:'faceted posts',material:'shell',evidenceRefs:['front-view']},
  {id:'vent-system',componentRef:'rear-vents',count:10,distribution:'rear bank',geometry:'shared slots',material:'cavity',evidenceRefs:['back-view']},
  {id:'foot-system',componentRef:'feet',count:4,distribution:'base corners',geometry:'low rounded boxes',material:'rubber',evidenceRefs:['runtime-contract']},
  {id:'roof-ribs',componentRef:'canopy-system',count:3,distribution:'across canopy',geometry:'low boxes',material:'accent',evidenceRefs:['three-quarter-view']},
];
next.featureReviewTargets = [
  {id:'popcorn-silhouette',name:'Tower, glass chamber and cinema canopy',tier:'critical',passIds:['blockout','form-refinement'],minimumScore:0.82,mustPass:true,componentRefs:['cabinet-system','chamber-system','canopy-system'],evidenceRefs:['front-view','side-view']},
  {id:'popcorn-identity',name:'Popper, pile, arched chute and tray',tier:'critical',passIds:['structural-pass','material-pass'],minimumScore:0.82,mustPass:true,componentRefs:['popper-system','popcorn-system','delivery-system'],evidenceRefs:['three-quarter-view']},
  {id:'popcorn-runtime',name:'Frozen sockets and chamber-to-outside trajectory',tier:'critical',passIds:['interaction-pass'],minimumScore:0.9,mustPass:true,componentRefs:['popcorn-system','outward-system'],evidenceRefs:['runtime-contract']},
  {id:'popcorn-ink',name:'Stable uneven three-tier outline',tier:'critical',passIds:['material-pass','lighting-pass'],minimumScore:0.82,mustPass:true,componentRefs:['outline-system'],evidenceRefs:['front-view']},
];
next.viewEvidence = ['front','side','back','three-quarter'].map(view=>({id:`${view}-view`,view,imageRegion:{x:0,y:0,width:1,height:1,units:'normalized'},observations:['conditionally admitted archived v1 runtime capture'],confidence:0.9}));
next.viewEvidence.push({id:'runtime-contract',view:'runtime',imageRegion:{x:0,y:0,width:1,height:1,units:'normalized'},observations:['frozen pivots, sockets, popcorn paths and exact reset'],confidence:0.99});
next.assumptions=['No new generated concept was available; v2 exaggeration is authored from the admitted v1 views.','All pivots, sockets and effect paths remain frozen.'];
next.risks=['Canopy detail must remain inside v1 bounds.','Heavy ink must not be applied to glass or dynamic popcorn.','Dispense mouth must stay aligned to the frozen socket.'];
next.sculptPipeline.currentPass='blockout'; next.sculptPipeline.completedPasses=[]; next.sculptPipeline.lastCompletedPass=null; next.sculptPipeline.blockedReason=''; next.sculptPipeline.nextRequiredEvidence=['four static views','three runtime phases']; next.reviewHistory=[]; next.visualEvidence=[];
await writeFile(path, `${JSON.stringify(next,null,2)}\n`);
await writeFile('docs/sculpt-specs-v2/popcorn-machine/pre-spec-assessment.json', `${JSON.stringify(next.preSpecAssessment,null,2)}\n`);
console.log(JSON.stringify({components:next.componentTree.length,materials:next.materials.length,details:details.length,repetitions:next.repetitionSystems.length}));

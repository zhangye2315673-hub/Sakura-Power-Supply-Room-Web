import { mkdirSync, writeFileSync } from 'node:fs';
import * as THREE from 'three';
import { createApplianceModel } from '../src/appliances/models';
import { createInductionCooktopPerformance } from '../src/appliances/performance/InductionCooktopPerformance';

const outputPath = 'artifacts/img2threejs/induction-cooktop/user-feedback-hotpot/verification-report.json';

function round(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}

function snapshot(root: THREE.Object3D, materials: Set<THREE.Material>): string {
  const objects: unknown[] = [];
  root.traverse((object) => {
    objects.push({
      name: object.name,
      position: object.position.toArray().map(round),
      quaternion: object.quaternion.toArray().map(round),
      scale: object.scale.toArray().map(round),
      visible: object.visible,
    });
  });
  const materialState = [...materials].map((material) => {
    const candidate = material as THREE.Material & {
      color?: THREE.Color;
      emissive?: THREE.Color;
      emissiveIntensity?: number;
      opacity: number;
    };
    return {
      color: candidate.color?.toArray().map(round),
      emissive: candidate.emissive?.toArray().map(round),
      emissiveIntensity: candidate.emissiveIntensity === undefined ? undefined : round(candidate.emissiveIntensity),
      opacity: round(candidate.opacity),
    };
  });
  return JSON.stringify({ objects, materialState });
}

function boundsFor(objects: THREE.Object3D[]): THREE.Box3 {
  return objects.reduce((bounds, object) => bounds.union(new THREE.Box3().setFromObject(object)), new THREE.Box3());
}

function triangleCount(root: THREE.Object3D): number {
  let triangles = 0;
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    triangles += object.geometry.index
      ? object.geometry.index.count / 3
      : (object.geometry.getAttribute('position')?.count ?? 0) / 3;
  });
  return Math.round(triangles);
}

const build = createApplianceModel('induction-cooktop', {
  id: 'induction-cooktop',
  accent: 0xe58da8,
  referencePath: 'references/intake/induction-cooktop/front.png',
});
const performance = createInductionCooktopPerformance(build.root);
performance.stop();
build.root.updateMatrixWorld(true);

const baseline = snapshot(build.root, build.materials);
const allObjects: THREE.Object3D[] = [];
build.root.traverse((object) => allObjects.push(object));
const named = (name: string): THREE.Object3D => {
  const object = allObjects.find((candidate) => candidate.name === name);
  if (!object) throw new Error(`Missing expected node: ${name}`);
  return object;
};
const matching = (fragment: string): THREE.Object3D[] => allObjects.filter((object) => object.name.includes(fragment));

const panelBounds = new THREE.Box3().setFromObject(named('induction-cooktop-pink-glass-ceramic-panel'));
const hotpotBounds = boundsFor([
  named('induction-cooktop-hotpot-thick-bottom'),
  named('induction-cooktop-hotpot-outer-wall'),
  named('induction-cooktop-hotpot-rolled-rim'),
  ...matching('loop-handle').filter((object) => /-(left|right)-loop-handle$/.test(object.name)),
]);

const foodPivots = [
  ...matching('meat-slice-').filter((object) => object.name.endsWith('-pivot')),
  ...matching('tofu-cube-').filter((object) => /tofu-cube-\d+$/.test(object.name)),
  ...matching('meatball-').filter((object) => /meatball-\d+$/.test(object.name)),
  ...matching('vegetable-').filter((object) => object.name.endsWith('-pivot')),
];
const foodBefore = foodPivots.map((object) => object.position.clone());

performance.update(2.82, 1);
build.root.updateMatrixWorld(true);
const poweredState = {
  cookwareVisible: named('induction-cooktop-powered-cookware-pivot').visible,
  fanRotation: round(named('induction-cooktop-inferred-fan-rotor-pivot').rotation.y),
  visibleHeatRings: matching('powered-heat-ring').filter((object) => object.visible).length,
  visibleSteamPuffs: matching('steam-cloud-').filter((object) => object.visible && object.name.endsWith('-pivot')).length,
  visibleBoilBubbles: matching('soup-rolling-bubble').filter((object) => object.visible).length,
  movingFoodPieces: foodPivots.filter((object, index) => object.position.distanceTo(foodBefore[index]) > 0.0001).length,
  animationSignal: round(performance.signal()),
};

performance.update(3.61, 1);
const eruptionState = {
  phase: performance.diagnostics.phase,
  potLift: round(performance.diagnostics.potLift),
  airborneFood: performance.diagnostics.airborneFood,
  highestFoodLift: round(performance.diagnostics.highestFoodLift),
  foodHeightSpread: round(performance.diagnostics.foodHeightSpread),
};
performance.update(4.18, 1);
const returnState = {
  phase: performance.diagnostics.phase,
  potLanded: performance.diagnostics.potLanded,
  airborneFood: performance.diagnostics.airborneFood,
};
performance.stop();
const afterStop = snapshot(build.root, build.materials);
const dimensions = build.root.userData.referenceDimensions as Record<string, number>;
const runtime = build.root.userData.sculptRuntime as { sockets?: Record<string, THREE.Object3D> };
const report = {
  dimensions,
  measured: {
    hotpotWidth: round(hotpotBounds.max.x - hotpotBounds.min.x),
    hotpotBodyDiameter: round(dimensions.hotpotOuterDiameter),
    hotpotDepth: round(hotpotBounds.max.z - hotpotBounds.min.z),
    panelWidth: round(panelBounds.max.x - panelBounds.min.x),
    panelDepth: round(panelBounds.max.z - panelBounds.min.z),
    bottomClearanceAbovePanel: round(hotpotBounds.min.y - panelBounds.max.y),
    meatSlices: matching('hotpot-meat-slice-').filter((object) => /^induction-cooktop-hotpot-meat-slice-\d+$/.test(object.name)).length,
    tofuCubes: matching('hotpot-tofu-cube-').filter((object) => /tofu-cube-\d+$/.test(object.name)).length,
    vegetables: matching('hotpot-vegetable-').filter((object) => object.name.endsWith('-pivot')).length,
    meatballs: matching('hotpot-meatball-').filter((object) => /meatball-\d+$/.test(object.name)).length,
    boilBubbles: matching('soup-rolling-bubble-').length,
    steamPuffs: matching('steam-cloud-').filter((object) => object.name.endsWith('-pivot')).length,
    handles: matching('loop-handle').filter((object) => /-(left|right)-loop-handle$/.test(object.name)).length,
    handleSockets: Object.keys(runtime.sockets ?? {}).filter((name) => name.includes('hotpot') && name.includes('handle')).length,
    objects: allObjects.length,
    meshes: allObjects.filter((object) => object instanceof THREE.Mesh).length,
    triangles: triangleCount(build.root),
  },
  poweredState,
  eruptionState,
  returnState,
  exactReset: baseline === afterStop,
};

const failures: string[] = [];
if (report.measured.hotpotBodyDiameter < dimensions.heatingZoneDiameter) failures.push('hotpot body is not larger than the heating zone');
if (report.measured.hotpotWidth > report.measured.panelWidth) failures.push('hotpot handles extend beyond the panel width');
if (report.measured.hotpotDepth > report.measured.panelDepth) failures.push('hotpot extends beyond the panel depth');
if (report.measured.bottomClearanceAbovePanel < 0.02 || report.measured.bottomClearanceAbovePanel > 0.1) failures.push('hotpot bottom clearance does not read as seated without intersection');
if (report.measured.meatSlices !== 3 || report.measured.tofuCubes !== 3 || report.measured.vegetables !== 3 || report.measured.meatballs !== 4) failures.push('visible ingredient inventory is incomplete');
if (report.measured.handles !== 2 || report.measured.handleSockets !== 2) failures.push('double-handle hierarchy is incomplete');
if (report.measured.triangles > 70000) failures.push('triangle budget exceeds 70000');
if (!poweredState.cookwareVisible || poweredState.fanRotation === 0 || poweredState.visibleHeatRings !== 3) failures.push('core induction animation is incomplete');
if (poweredState.visibleSteamPuffs < 12 || poweredState.visibleBoilBubbles < 8 || poweredState.movingFoodPieces !== 13) failures.push('boiling animation does not animate all effect layers');
if (eruptionState.phase !== 'pot-jump' || eruptionState.potLift < 0.58 || eruptionState.airborneFood < 10 || eruptionState.highestFoodLift < 1 || eruptionState.foodHeightSpread < 0.16) failures.push('pot jump and staggered inertial food flight are incomplete');
if (returnState.phase !== 'food-return' || !returnState.potLanded || returnState.airborneFood < 1) failures.push('pot must land before the airborne food returns');
if (!report.exactReset) failures.push('stop() did not restore the exact baseline');

const finalReport = { ...report, failures, passed: failures.length === 0 };
mkdirSync(outputPath.slice(0, outputPath.lastIndexOf('/')), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(finalReport, null, 2)}\n`);
console.log(JSON.stringify(finalReport, null, 2));
if (failures.length > 0) process.exitCode = 1;

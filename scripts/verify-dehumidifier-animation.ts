import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createApplianceModel } from '../src/appliances/models';
import { createApplianceMechanicalAnimation } from '../src/appliances/performance/ApplianceMechanics';
import {
  AppliancePerformanceSystem,
  type AppliancePerformanceTarget,
} from '../src/systems/AppliancePerformanceSystem';
import { PetalField } from '../src/systems/PetalField';

function snapshot(root: THREE.Group): string {
  const values: Array<[string, number[], boolean]> = [];
  root.traverse((object) => {
    if (object.userData.isOutline) return;
    values.push([
      object.name || object.type,
      [
        object.position.x, object.position.y, object.position.z,
        object.quaternion.x, object.quaternion.y, object.quaternion.z, object.quaternion.w,
        object.scale.x, object.scale.y, object.scale.z,
      ].map((value) => Number(value.toFixed(6))),
      object.visible,
    ]);
  });
  return JSON.stringify(values);
}

function humidityPivots(root: THREE.Group): THREE.Object3D[] {
  const pivots: THREE.Object3D[] = [];
  root.traverse((object) => {
    if (object.name.startsWith('dehumidifier-humidity-particle-pivot-')) pivots.push(object);
  });
  return pivots;
}

function hasAncestor(object: THREE.Object3D, ancestor: THREE.Object3D): boolean {
  let current = object.parent;
  while (current) {
    if (current === ancestor) return true;
    current = current.parent;
  }
  return false;
}

const gameBuild = createApplianceModel('dehumidifier', { id: 'dehumidifier', accent: 0xe8a7b7 });
const galleryBuild = createApplianceModel('dehumidifier', { id: 'dehumidifier', accent: 0xe8a7b7 });
const gameAnimation = createApplianceMechanicalAnimation('dehumidifier', gameBuild.root);
const galleryAnimation = createApplianceMechanicalAnimation('dehumidifier', galleryBuild.root);
const whole = gameBuild.root.getObjectByName('dehumidifier-whole-machine-pivot');
const mainBody = gameBuild.root.getObjectByName('dehumidifier-main-body-pivot');
const fan = gameBuild.root.getObjectByName('dehumidifier-exhaust-fan-pivot');
const water = gameBuild.root.getObjectByName('dehumidifier-visible-collected-water-column');
const particles = humidityPivots(gameBuild.root);
const controlPivot = gameBuild.root.getObjectByName('dehumidifier-front-control-button-pivot');
const controlFace = gameBuild.root.getObjectByName('dehumidifier-front-round-sakura-control');
const controlGlint = gameBuild.root.getObjectByName('dehumidifier-control-button-glint');

assert.ok(whole && mainBody && fan && water, 'dehumidifier action rig must be complete');
assert.equal(
  gameBuild.root.getObjectByName('status-indicator'),
  undefined,
  'the dehumidifier must not keep an unexplained detached status dot beside its central control',
);
assert.ok(controlPivot, 'the central control needs a stable front-face pivot');
assert.equal(particles.length, 18, 'the skill must own exactly eighteen volumetric humidity actors');
assert.ok(controlFace && controlGlint, 'the central control must retain its face and glint');

const captureTimes = particles.map((particle) => Number(particle.userData.captureTime));
assert.ok(captureTimes.every(Number.isFinite), 'every humidity actor needs a capture timestamp');
for (let index = 1; index < captureTimes.length; index += 1) {
  assert.ok(
    captureTimes[index] > captureTimes[index - 1],
    'humidity actors must be consumed in a strict sequence rather than together',
  );
}
assert.ok(captureTimes.at(-1)! > 4.8, 'the final actor must remain in the late timeline for a continuous intake');
particles.forEach((particle) => {
  const path = [
    particle.userData.trajectoryStart,
    particle.userData.trajectoryControl,
    particle.userData.trajectoryTarget,
  ] as Array<readonly number[]>;
  path.forEach(([x, y, z]) => {
    assert.ok(Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z));
    assert.ok(z >= 0, 'humidity paths must stay in the front 180-degree hemisphere');
  });
});

for (const name of [
  'dehumidifier-main-body-pivot',
  'dehumidifier-water-tank-slide-pivot',
  'dehumidifier-crown-surface-pivot',
  'dehumidifier-top-exhaust-pivot',
  'dehumidifier-front-control-button-pivot',
  'dehumidifier-rear-service-pivot',
]) {
  const part = gameBuild.root.getObjectByName(name);
  assert.ok(part && hasAncestor(part, whole), `${name} must move below the whole-machine pivot`);
}

const forbiddenEffects: string[] = [];
const effectGeometryTypes = new Set<string>();
gameBuild.root.traverse((object) => {
  if (object instanceof THREE.Sprite) forbiddenEffects.push(object.name || 'Sprite');
  if (!(object instanceof THREE.Mesh) || !object.name.includes('volumetric-')) return;
  effectGeometryTypes.add(object.geometry.type);
  if (object.geometry instanceof THREE.PlaneGeometry) forbiddenEffects.push(object.name);
});
assert.deepEqual(forbiddenEffects, [], 'humidity skill must not contain PlaneGeometry or Sprite effects');
assert.ok(effectGeometryTypes.has('LatheGeometry'));
assert.ok(effectGeometryTypes.has('IcosahedronGeometry'));
assert.ok(effectGeometryTypes.has('TubeGeometry'));

const initialSnapshot = snapshot(gameBuild.root);
const initialFanQuaternion = fan.quaternion.toArray();
const initialBodyScale = mainBody.scale.toArray();

gameAnimation.update(0.24, 1);
assert.ok(whole.position.y < 0, 'startup should briefly settle the complete machine downward');
assert.deepEqual(fan.quaternion.toArray(), initialFanQuaternion, 'the top fan must stay still');
assert.equal(controlFace.visible, true, 'the central control remains visible during the press');

gameAnimation.update(1.55, 1);
const slowPositions = particles.filter((particle) => particle.visible).map((particle) => particle.position.clone());
assert.ok(slowPositions.length >= 6, 'slow gathering phase should reveal all three humidity families');
assert.ok(water.scale.y > 0.12, 'captured moisture should raise the visible water column');
assert.equal(controlFace.visible, true, 'the central control face must remain present after activation');
assert.equal(controlGlint.visible, true, 'the central control glint must remain present after activation');
gameBuild.root.updateMatrixWorld(true);
const pressedButtonCenter = controlFace.getWorldPosition(new THREE.Vector3());
assert.ok(pressedButtonCenter.z > 0.72, 'the pressed central control must remain proud of the enclosure face');

for (const time of [1.4, 2, 2.6, 3.2, 3.8, 4.4]) {
  gameAnimation.update(time, 1);
  const inFlight = particles.filter((particle) => particle.visible).length;
  assert.ok(inFlight >= 2, `continuous intake needs actors in flight at ${time}s`);
  assert.ok(inFlight < particles.length, `actors must be captured progressively by ${time}s`);
}

gameAnimation.update(3.56, 1);
assert.ok(whole.scale.y < 0.9, 'climax should strongly compress the complete machine');
assert.ok(whole.scale.x > 1.04, 'climax compression needs readable transverse squash');
assert.deepEqual(mainBody.scale.toArray(), initialBodyScale, 'local shell pivot must never inflate independently');

gameAnimation.update(3.9, 1);
assert.ok(whole.scale.y > 1, 'climax compression should overshoot into a fast rebound');

gameAnimation.update(4.1, 1);
assert.ok(particles.filter((particle) => particle.visible).length >= 3, 'late intake should still have actors in flight');

gameAnimation.update(5.12, 1);
assert.ok(whole.position.y > 0, 'completion should include a small satisfied double-bounce');
assert.equal(particles.filter((particle) => particle.visible).length, 0, 'the final intake actors should clear at the end');
assert.equal(gameBuild.root.userData.dehumidifierPerformance.timelineOwner, 'AppliancePerformanceSystem');
assert.equal(gameBuild.root.userData.dehumidifierPerformance.fanRotates, false);

for (const time of [0.24, 1.55, 3.56, 3.9, 4.1, 5.12]) {
  gameAnimation.update(time, 1);
  galleryAnimation.update(time, 1);
  assert.equal(snapshot(gameBuild.root), snapshot(galleryBuild.root), `game/gallery pose drifted at ${time}s`);
}

gameAnimation.stop();
assert.equal(snapshot(gameBuild.root), initialSnapshot, 'stop() must exactly restore the authored model pose');
assert.equal(controlFace.visible, true, 'stop() must restore the central control face');
assert.equal(controlGlint.visible, true, 'stop() must restore the central control glint');
assert.equal(gameAnimation.signal(), 0);

const system = new AppliancePerformanceSystem();
const petals = new PetalField(1);
const camera = new THREE.PerspectiveCamera(31, 16 / 9, 0.1, 80);
camera.position.set(4, 3, 8);
camera.lookAt(0, 1.4, 0);
camera.updateMatrixWorld(true);
const target: AppliancePerformanceTarget = {
  root: galleryBuild.root,
  state: 'active',
  kind: 'dehumidifier',
  facingSide: 1,
  getActiveElapsed: () => 2.2,
};
system.update(1 / 60, 2.2, camera, [target], petals);
const systemState = system.getStateSummary();
assert.equal(systemState.timelineOwners, 1, 'game/gallery must use one timeline owner');
assert.equal(systemState.activeByKind.drop ?? 0, 0, 'old pooled droplet spectacle must be removed');
assert.equal(systemState.activeByKind.steam ?? 0, 0, 'old pooled steam spectacle must be removed');
system.dispose();
petals.dispose();

console.log(JSON.stringify({
  exactReset: true,
  gameGalleryPoseParity: true,
  timelineOwner: 'AppliancePerformanceSystem',
  particleCount: particles.length,
  effectGeometryTypes: [...effectGeometryTypes].sort(),
  forbiddenEffects,
  wholeMachineHierarchy: true,
  oldLocalInflationRemoved: true,
  oldPooledSpectacleRemoved: true,
  fanRotates: false,
  durationSeconds: gameBuild.root.userData.activeDuration,
}, null, 2));

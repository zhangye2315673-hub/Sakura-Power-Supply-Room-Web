import * as THREE from 'three';
import { SkillPresentationController } from '../skill/SkillPresentationController';
import type { SkillResolution } from '../skill/SkillChallengeEngine';

const app = document.querySelector<HTMLElement>('#app')!;
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(0xf7f1e7, 1);
app.append(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
camera.position.set(0, 0.2, 4.6);
scene.add(new THREE.HemisphereLight(0xffffff, 0x8c7898, 2.2));
const key = new THREE.DirectionalLight(0xfff2dc, 3.4);
key.position.set(4, 6, 8);
scene.add(key);

let cableScale = 1;
const controller = new SkillPresentationController(scene, camera, {
  commitAutoRemoval: () => true,
  setCableVisualScale: (scale) => { cableScale = scale; },
  getRiceCableVisualScale: () => cableScale,
  getCableBaseColor: () => null,
  setCableSkillSweep: () => {},
  setCableSkillTint: () => {},
  commitCableColors: () => {},
});

const params = new URLSearchParams(location.search);
const skill = (params.get('skill') ?? 'radio') as 'radio' | 'rice-cooker' | 'robot-vacuum';
const compact = innerWidth < 600;
if (compact) camera.position.z = 9;
const ids = skill === 'radio' ? ['a', 'b', 'c'] : skill === 'rice-cooker' ? ['a', 'b', 'c', 'd', 'e'] : ['a', 'b', 'c', 'd', 'e', 'f'];
const positions = skill === 'radio'
  ? compact
    ? [new THREE.Vector3(-0.7, 0, 0), new THREE.Vector3(0, 0.75, 0), new THREE.Vector3(0.7, 0, 0)]
    : [new THREE.Vector3(-1.7, 0.1, 0), new THREE.Vector3(0, 0.65, 0), new THREE.Vector3(1.7, 0.1, 0)]
  : skill === 'robot-vacuum'
    ? compact
      ? [new THREE.Vector3(-0.7, 0, 0), new THREE.Vector3(0, 0.75, 0), new THREE.Vector3(0.7, 0, 0)]
      : [new THREE.Vector3(-1.7, 0.1, 0), new THREE.Vector3(0, 0.65, 0), new THREE.Vector3(1.7, 0.1, 0)]
    : ids.map((_, index) => {
      const columns = compact ? 2 : 3;
      const column = index % columns;
      const centeredColumn = column - (columns - 1) * 0.5;
      return new THREE.Vector3(
        centeredColumn * (compact ? 1.05 : 1.55),
        (compact ? 1.05 : 0.6) - Math.floor(index / columns) * (compact ? 0.95 : 1.45),
        0,
      );
    });
if (skill === 'rice-cooker') {
  const cableMaterial = new THREE.MeshToonMaterial({ color: 0x6b6179 });
  positions.forEach((position, index) => {
    const points = [
      position.clone().add(new THREE.Vector3(-0.65, -0.18, 0)),
      position.clone().add(new THREE.Vector3(0, 0.2, 0)),
      position.clone().add(new THREE.Vector3(0.65, -0.18, 0)),
    ];
    const cable = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 12, 0.025, 6, false),
      cableMaterial,
    );
    cable.name = `review-rice-cable-${index + 1}`;
    scene.add(cable);
  });
}
const resolution: SkillResolution = {
  skillId: skill === 'radio' ? 'route-broadcast' : skill === 'rice-cooker' ? 'rice-thick-cable' : 'snapshot-sweep',
  appliance: skill,
  label: skill,
  targetCableIds: ids,
  commands: [],
  requiresSelection: null,
  topologyChanged: skill === 'robot-vacuum',
  presentation: { cue: 'review', commit: 'review', settle: 'review', assetIds: [] },
};
const reviewTargets = positions.map((position, index) => ({
  cableId: ids[index] ?? `review-${index + 1}`,
  position,
  path: skill === 'rice-cooker'
    ? [
        position.clone().add(new THREE.Vector3(-0.65, -0.18, 0)),
        position.clone().add(new THREE.Vector3(0, 0.2, 0)),
        position.clone().add(new THREE.Vector3(0.65, -0.18, 0)),
      ]
    : undefined,
}));
controller.play(resolution, reviewTargets);
controller.freezeForEvidence(skill === 'radio' ? 560 : skill === 'rice-cooker' ? 390 : 430);

function resize(): void {
  const width = innerWidth;
  const height = innerHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  controller.resize(width, height);
}
resize();
addEventListener('resize', resize);

function frame(): void {
  renderer.render(scene, camera);
  controller.render();
  requestAnimationFrame(frame);
}
frame();
(window as Window & { __SKILL_REVIEW_READY__?: boolean }).__SKILL_REVIEW_READY__ = true;

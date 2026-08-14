import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { ApplianceModelBuild, ApplianceModelOptions } from '../appliances/ApplianceModelKit';
import {
  poweredAnimationState,
  poweredPreviewCycleDuration,
} from '../appliances/poweredAnimation';
import { APPLIANCE_CATALOG } from '../systems/ApplianceCatalog';
import { AppliancePerformanceSystem, type AppliancePerformanceTarget } from '../systems/AppliancePerformanceSystem';
import { PetalField } from '../systems/PetalField';
import './modelReview.css';

type ModelFactory = (options: ApplianceModelOptions) => ApplianceModelBuild;
type ReviewView = 'front' | 'side' | 'side-flat' | 'back' | 'top' | 'underside' | 'three-quarter';

const modules = import.meta.glob(['../appliances/models/*.ts', '!../appliances/models/index.ts']);
const params = new URLSearchParams(location.search);
const requestedModel = params.get('model') ?? 'toaster';
const requestedView = (params.get('view') ?? 'three-quarter') as ReviewView;
const accent = Number.parseInt(params.get('accent') ?? 'e8a7b7', 16);
const clayReview = params.get('clay') === '1';
const silhouetteReview = params.get('silhouette') === '1';
const normalizedRequestedModel = requestedModel.replace(/\.ts$/i, '').replace(/[-_]/g, '').toLowerCase();
const reviewDefinition = APPLIANCE_CATALOG.find((definition) => (
  definition.id.replace(/[-_]/g, '').toLowerCase() === normalizedRequestedModel
)) ?? APPLIANCE_CATALOG[0];
function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Model review UI is missing ${selector}.`);
  return element;
}

const canvas = requireElement<HTMLCanvasElement>('#model-review-canvas');
const status = requireElement<HTMLElement>('#model-review-status');
const title = requireElement<HTMLElement>('#model-title');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setClearColor(0xedf1f7, 1);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xedf1f7);
scene.fog = new THREE.Fog(0xedf1f7, 18, 38);
const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 80);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.autoRotate = params.get('spin') === '1';
controls.autoRotateSpeed = 1.1;
controls.minDistance = 1;
controls.maxDistance = 24;

const stage = new THREE.Group();
scene.add(stage);
const floor = new THREE.Mesh(
  new THREE.CircleGeometry(5, 64),
  new THREE.ShadowMaterial({ color: 0x665b75, opacity: 0.15 }),
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const hemi = new THREE.HemisphereLight(0xfff8ef, 0x8a829c, 1.55);
scene.add(hemi);
const key = new THREE.DirectionalLight(0xfff1df, 3.2);
key.position.set(-4.5, 7.5, 6.5);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
key.shadow.radius = 4;
scene.add(key);
const fill = new THREE.DirectionalLight(0xb7d9ef, 1.35);
fill.position.set(5, 3, -4);
scene.add(fill);
const rim = new THREE.DirectionalLight(0xf2b8cf, 1.6);
rim.position.set(-3, 4, -6);
scene.add(rim);
const performances = new AppliancePerformanceSystem();
const petals = new PetalField(8);
scene.add(performances.root, petals.mesh);

let current: ApplianceModelBuild | null = null;
let performanceTarget: AppliancePerformanceTarget | null = null;
let radius = 2;
let powered = params.get('power') !== '0';
let startedAt = performance.now() * 0.001;
let lastFrameAt = startedAt;
let previousElapsed = -1;
let reviewElapsed = 0;
let fixedReviewElapsed: number | null = null;
let selectedView: ReviewView = requestedView;

function applyPreviewLightingProfile(profile: unknown): void {
  if (profile !== 'sakura-appliance-v2') return;
  const background = new THREE.Color(0xf3eee8);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(background, 1);
  scene.background = background;
  if (scene.fog instanceof THREE.Fog) {
    scene.fog.color.copy(background);
    scene.fog.near = 19;
    scene.fog.far = 40;
  }
  hemi.color.set(0xfff4e6);
  hemi.groundColor.set(0x81778f);
  hemi.intensity = 1.15;
  key.color.set(0xffead6);
  key.intensity = 2.4;
  fill.color.set(0xb9c8e8);
  fill.intensity = 0.9;
  rim.color.set(0xf1aec8);
  rim.intensity = 1.15;
  if (floor.material instanceof THREE.ShadowMaterial) floor.material.opacity = 0.2;
}

function applySilhouetteReview(model: ApplianceModelBuild): void {
  if (!silhouetteReview) return;
  const white = new THREE.Color(0xffffff);
  const silhouetteMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = false;
  renderer.setClearColor(white, 1);
  scene.background = white;
  scene.fog = null;
  floor.visible = false;
  petals.mesh.visible = false;
  performances.root.visible = false;
  model.root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    if (object.userData.isOutline === true) {
      object.visible = false;
      return;
    }
    object.material = silhouetteMaterial;
    object.castShadow = false;
    object.receiveShadow = false;
  });
}

function findModulePath(name: string): string | null {
  const normalized = name.replace(/\.ts$/i, '').replace(/[-_]/g, '').toLowerCase();
  const paths = Object.keys(modules);
  const basenameFor = (path: string): string => (
    path.split(/[\\/]/).at(-1)?.replace(/\.ts$/i, '').replace(/[-_]/g, '').toLowerCase() ?? ''
  );
  // Resolve the complete catalog id before considering a fuzzy fallback.
  // Otherwise `humidifier` can select `dehumidifier.ts` solely because the
  // glob happens to enumerate the longer filename first.
  const exact = paths.find((path) => basenameFor(path) === normalized);
  if (exact) return exact;
  return paths.find((path) => {
    const basename = basenameFor(path);
    return basename.includes(normalized) || normalized.includes(basename);
  }) ?? null;
}

function findFactory(module: Record<string, unknown>): ModelFactory | null {
  for (const [key, value] of Object.entries(module)) {
    if (key.startsWith('create') && key.endsWith('Model') && typeof value === 'function') {
      return value as ModelFactory;
    }
  }
  return null;
}

function applyView(view: ReviewView): void {
  selectedView = view;
  const directions: Record<ReviewView, THREE.Vector3> = {
    front: new THREE.Vector3(0, 0.08, 1),
    side: new THREE.Vector3(1, 0.08, 0),
    'side-flat': new THREE.Vector3(1, 0, 0),
    back: new THREE.Vector3(0, 0.08, -1),
    top: new THREE.Vector3(0, 1, 0.001),
    underside: new THREE.Vector3(0, -1, -0.001),
    'three-quarter': new THREE.Vector3(1.25, 0.82, 2.35),
  };
  const framingScale = Number(current?.root.userData.previewFramingScale ?? 1);
  const distance = Math.max(
    2.4,
    radius / Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * 1.25 * framingScale,
  );
  const focusOffsetY = Number(current?.root.userData.previewFocusOffsetY ?? 0);
  camera.position.copy(directions[view].normalize().multiplyScalar(distance));
  camera.position.y += focusOffsetY;
  camera.near = Math.max(0.01, distance / 100);
  camera.far = Math.max(30, distance * 10);
  camera.updateProjectionMatrix();
  controls.target.set(0, focusOffsetY, 0);
  controls.update();
}

function frameModel(model: ApplianceModelBuild): void {
  stage.position.set(0, 0, 0);
  model.root.position.set(0, 0, 0);
  model.root.rotation.set(0, 0, 0);
  model.root.scale.setScalar(1);
  model.root.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(model.root);
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  stage.position.copy(center).multiplyScalar(-1);
  radius = Math.max(size.x, size.y, size.z) * 0.58;
  floor.position.y = -size.y * 0.5 - 0.045;
  floor.scale.setScalar(Math.max(0.8, Math.max(size.x, size.z) * 0.48));
  applyView(selectedView);
}

async function loadModel(): Promise<void> {
  const path = findModulePath(requestedModel);
  if (!path) throw new Error(`找不到模型模块：${requestedModel}`);
  const loaded = await modules[path]();
  const factory = findFactory(loaded as Record<string, unknown>);
  if (!factory) throw new Error(`模块未导出 create*Model 工厂：${path}`);
  current = factory({ id: reviewDefinition.id, accent });
  applyPreviewLightingProfile(current.root.userData.previewLightingProfile);
  applySilhouetteReview(current);
  performanceTarget = {
    root: current.root,
    state: powered ? 'active' : 'idle',
    kind: reviewDefinition.id,
    facingSide: 1,
    getActiveElapsed: () => Number.isFinite(window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__)
      ? Math.max(0, window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ as number)
      : reviewElapsed,
  };
  if (clayReview) {
    const clay = new THREE.MeshBasicMaterial({ color: 0xc8bab5 });
    current.interactiveMeshes.forEach((mesh) => {
      mesh.material = clay;
    });
  }
  stage.add(current.root);
  frameModel(current);
  title.textContent = requestedModel;
  status.textContent = `视角 ${selectedView} · ${current.interactiveMeshes.length} 个可交互网格 · ${current.accuracy.inferred.length} 个推测项`;
}

function resize(): void {
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) return;
  renderer.setSize(rect.width, rect.height, false);
  camera.aspect = rect.width / rect.height;
  camera.updateProjectionMatrix();
}

document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach((button) => {
  button.addEventListener('click', () => applyView(button.dataset.view as ReviewView));
});
document.querySelector<HTMLButtonElement>('#review-reset')?.addEventListener('click', () => {
  performances.reset();
  startedAt = performance.now() * 0.001;
  if (current) frameModel(current);
});
document.querySelector<HTMLButtonElement>('#review-rotate')?.addEventListener('click', (event) => {
  controls.autoRotate = !controls.autoRotate;
  (event.currentTarget as HTMLButtonElement).textContent = controls.autoRotate ? '暂停自转' : '开始自转';
});
new ResizeObserver(resize).observe(canvas);
window.addEventListener('resize', resize);

const reviewWindow = window as typeof window & {
  __MODEL_REVIEW_DIAGNOSTICS__?: Record<string, unknown>;
  __MODEL_REVIEW_SET_VIEW__?: (view: ReviewView) => void;
  __MODEL_REVIEW_SET_POWER__?: (value: boolean) => void;
  __MODEL_REVIEW_SET_ELAPSED__?: (elapsed: number | null) => void;
  __MODEL_REVIEW_GET_NODE_STATE__?: (names: string[]) => Record<string, unknown>;
};
reviewWindow.__MODEL_REVIEW_SET_VIEW__ = applyView;
reviewWindow.__MODEL_REVIEW_SET_POWER__ = (value) => {
  powered = value;
  fixedReviewElapsed = null;
  startedAt = performance.now() * 0.001;
  previousElapsed = -1;
  if (!value) performances.reset();
};
reviewWindow.__MODEL_REVIEW_SET_ELAPSED__ = (elapsed) => {
  fixedReviewElapsed = elapsed === null ? null : Math.max(0, elapsed);
  powered = elapsed !== null;
  previousElapsed = -1;
};
reviewWindow.__MODEL_REVIEW_GET_NODE_STATE__ = (names) => Object.fromEntries(names.map((name) => {
  const object = current?.root.getObjectByName(name);
  const mesh = object instanceof THREE.Mesh ? object : null;
  const materials = mesh
    ? (Array.isArray(mesh.material) ? mesh.material : [mesh.material])
    : [];
  return [name, object ? {
    position: object.position.toArray(),
    quaternion: object.quaternion.toArray(),
    scale: object.scale.toArray(),
    visible: object.visible,
    materialOpacity: materials.map((material) => material.opacity),
  } : null];
}));

function radioAntennaReviewDiagnostics(): Record<string, unknown> | null {
  const hinge = current?.root.getObjectByName('radio-antenna-hinge-pivot');
  const tip = current?.root.getObjectByName('radio-antenna-tip-cap');
  if (!hinge || !tip) return null;
  const baseWorld = hinge.getWorldPosition(new THREE.Vector3());
  const tipWorld = tip.getWorldPosition(new THREE.Vector3());
  const direction = tipWorld.clone().sub(baseWorld).normalize();
  const baseNdc = baseWorld.clone().project(camera);
  const tipNdc = tipWorld.clone().project(camera);
  return {
    baseWorld: baseWorld.toArray(),
    tipWorld: tipWorld.toArray(),
    direction: direction.toArray(),
    angleFromWorldUp: THREE.MathUtils.radToDeg(direction.angleTo(new THREE.Vector3(0, 1, 0))),
    baseNdc: baseNdc.toArray(),
    tipNdc: tipNdc.toArray(),
    projectedAngleFromScreenUp: THREE.MathUtils.radToDeg(Math.atan2(
      Math.abs(tipNdc.x - baseNdc.x),
      Math.abs(tipNdc.y - baseNdc.y),
    )),
  };
}

function animate(): void {
  requestAnimationFrame(animate);
  const now = performance.now() * 0.001;
  const delta = Math.min(0.05, Math.max(0, now - lastFrameAt));
  lastFrameAt = now;
  const elapsed = fixedReviewElapsed
    ?? (now - startedAt) % poweredPreviewCycleDuration(reviewDefinition.id);
  reviewElapsed = elapsed;
  const state = poweredAnimationState(
    powered ? elapsed : Number.POSITIVE_INFINITY,
    reviewDefinition.id,
  );
  if (elapsed < previousElapsed) performances.reset();
  previousElapsed = elapsed;
  if (performanceTarget) {
    performanceTarget.state = state.active ? 'active' : 'idle';
    performances.update(delta, elapsed, camera, [performanceTarget], petals);
  }
  petals.update(delta);
  controls.update();
  renderer.render(scene, camera);
  reviewWindow.__MODEL_REVIEW_DIAGNOSTICS__ = {
    ready: Boolean(current),
    model: requestedModel,
    modelRootName: current?.root.name ?? null,
    view: selectedView,
    power: state.power,
    animationSignal: performanceTarget?.root.userData.appliancePerformanceSignal ?? 0,
    performance: performances.getStateSummary(),
    radioAntenna: radioAntennaReviewDiagnostics(),
    drawCalls: renderer.info.render.calls,
    triangles: renderer.info.render.triangles,
  };
}

loadModel().then(() => {
  resize();
  animate();
}).catch((error: unknown) => {
  status.textContent = error instanceof Error ? error.message : String(error);
  throw error;
});

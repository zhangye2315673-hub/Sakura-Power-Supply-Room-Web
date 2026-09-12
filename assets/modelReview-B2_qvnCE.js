const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./alarmClock-DoTzNaPP.js","./rolldown-runtime-D7D4PA-g.js","./three.core-DlTOC7bx.js","./BufferGeometryUtils-CtH-hlZf.js","./palette-knpLSfXB.js","./outline-Cv1Jem2g.js","./blender-N2eRuMD0.js","./bubbleMachine-Bw4WD49q.js","./coffeeMaker-B1MQF_Jg.js","./dehumidifier-BIvhccY7.js","./desktopComputer-C3rQd50i.js","./fan-B2o33Ay6.js","./gameController-BwCNJ2kl.js","./gumballMachine-Cr6dlZBK.js","./hairDryer-CqPdH-Dt.js","./humidifier-CojYbIlp.js","./inductionCooktop-DD5owD9D.js","./kettle-rP3ttAo7.js","./lamp-kvdyvhRA.js","./microwave-CqFxoCzU.js","./phone-DOXnLHvV.js","./popcornMachine-DwzZCN_D.js","./ParametricGeometry-CNqXT5Mu.js","./portableSpeaker-B_u6x5Nw.js","./printer-ChnJT7sE.js","./radio-BtjqkBIi.js","./recordPlayer-CceWS5ql.js","./refrigerator-DN6Lytqq.js","./riceCooker-1uhEi14Y.js","./robotVacuum-DBGIBbfo.js","./smartBin-CqTKJ_OO.js","./standMixer-CWdHDvAL.js","./television-BLz4LXUF.js","./toaster-DCU0xvOs.js","./washer-LtxQTif2.js"])))=>i.map(i=>d[i]);
import "./modulepreload-polyfill-BsPm7yBB.js";
import { H as Group, In as ShadowMaterial, Mn as SRGBColorSpace, Pn as Scene, W as HemisphereLight, d as CircleGeometry, dr as Vector3, ft as MathUtils, gt as MeshBasicMaterial, ht as Mesh, jt as PerspectiveCamera, k as DirectionalLight, p as Color, r as Box3, z as Fog } from "./three.core-DlTOC7bx.js";
import { s as WebGLRenderer } from "./palette-knpLSfXB.js";
import { t as __vitePreload } from "./preload-helper-DHlaQ_oz.js";
import { t as APPLIANCE_CATALOG } from "./ApplianceCatalog-B_KJFoGh.js";
import { T as installJellyEnvironment, b as poweredAnimationState, x as poweredPreviewCycleDuration } from "./BufferGeometryUtils-CtH-hlZf.js";
import { C as OrbitControls, f as AppliancePerformanceSystem, t as PetalField } from "./PetalField-BZccXHdn.js";
//#region src/review/modelReview.ts
var modules = /* #__PURE__ */ Object.assign({
	"../appliances/models/alarmClock.ts": () => __vitePreload(() => import("./alarmClock-DoTzNaPP.js").then((n) => n.t), __vite__mapDeps([0,1,2,3,4,5]), import.meta.url),
	"../appliances/models/blender.ts": () => __vitePreload(() => import("./blender-N2eRuMD0.js").then((n) => n.t), __vite__mapDeps([6,1,2,3,4,5]), import.meta.url),
	"../appliances/models/bubbleMachine.ts": () => __vitePreload(() => import("./bubbleMachine-Bw4WD49q.js").then((n) => n.t), __vite__mapDeps([7,1,2,3,4,5]), import.meta.url),
	"../appliances/models/coffeeMaker.ts": () => __vitePreload(() => import("./coffeeMaker-B1MQF_Jg.js").then((n) => n.t), __vite__mapDeps([8,1,2,3,4,5]), import.meta.url),
	"../appliances/models/dehumidifier.ts": () => __vitePreload(() => import("./dehumidifier-BIvhccY7.js").then((n) => n.n), __vite__mapDeps([9,1,2,3,4,5]), import.meta.url),
	"../appliances/models/desktopComputer.ts": () => __vitePreload(() => import("./desktopComputer-C3rQd50i.js").then((n) => n.n), __vite__mapDeps([10,1,2,3,4,5]), import.meta.url),
	"../appliances/models/fan.ts": () => __vitePreload(() => import("./fan-B2o33Ay6.js").then((n) => n.n), __vite__mapDeps([11,1,2,5,4,3]), import.meta.url),
	"../appliances/models/gameController.ts": () => __vitePreload(() => import("./gameController-BwCNJ2kl.js").then((n) => n.n), __vite__mapDeps([12,1,2,3,4,5]), import.meta.url),
	"../appliances/models/gumballMachine.ts": () => __vitePreload(() => import("./gumballMachine-Cr6dlZBK.js").then((n) => n.n), __vite__mapDeps([13,1,2,3,4,5]), import.meta.url),
	"../appliances/models/hairDryer.ts": () => __vitePreload(() => import("./hairDryer-CqPdH-Dt.js").then((n) => n.n), __vite__mapDeps([14,1,2,3,4,5]), import.meta.url),
	"../appliances/models/humidifier.ts": () => __vitePreload(() => import("./humidifier-CojYbIlp.js").then((n) => n.n), __vite__mapDeps([15,1,2,3,4,5]), import.meta.url),
	"../appliances/models/inductionCooktop.ts": () => __vitePreload(() => import("./inductionCooktop-DD5owD9D.js").then((n) => n.n), __vite__mapDeps([16,1,2,3,4,5]), import.meta.url),
	"../appliances/models/kettle.ts": () => __vitePreload(() => import("./kettle-rP3ttAo7.js").then((n) => n.n), __vite__mapDeps([17,1,2,3,4,5]), import.meta.url),
	"../appliances/models/lamp.ts": () => __vitePreload(() => import("./lamp-kvdyvhRA.js").then((n) => n.n), __vite__mapDeps([18,1,2,3,4,5]), import.meta.url),
	"../appliances/models/microwave.ts": () => __vitePreload(() => import("./microwave-CqFxoCzU.js").then((n) => n.n), __vite__mapDeps([19,1,2,3,4,5]), import.meta.url),
	"../appliances/models/phone.ts": () => __vitePreload(() => import("./phone-DOXnLHvV.js").then((n) => n.n), __vite__mapDeps([20,1,2,3,4,5]), import.meta.url),
	"../appliances/models/popcornMachine.ts": () => __vitePreload(() => import("./popcornMachine-DwzZCN_D.js").then((n) => n.n), __vite__mapDeps([21,1,2,3,4,5,22]), import.meta.url),
	"../appliances/models/portableSpeaker.ts": () => __vitePreload(() => import("./portableSpeaker-B_u6x5Nw.js").then((n) => n.n), __vite__mapDeps([23,1,2,3,4,5]), import.meta.url),
	"../appliances/models/printer.ts": () => __vitePreload(() => import("./printer-ChnJT7sE.js").then((n) => n.n), __vite__mapDeps([24,1,2,3,4,5]), import.meta.url),
	"../appliances/models/radio.ts": () => __vitePreload(() => import("./radio-BtjqkBIi.js").then((n) => n.n), __vite__mapDeps([25,1,2,3,4,5]), import.meta.url),
	"../appliances/models/recordPlayer.ts": () => __vitePreload(() => import("./recordPlayer-CceWS5ql.js").then((n) => n.n), __vite__mapDeps([26,1,2,3,4,5]), import.meta.url),
	"../appliances/models/refrigerator.ts": () => __vitePreload(() => import("./refrigerator-DN6Lytqq.js").then((n) => n.n), __vite__mapDeps([27,1,2,3,4,5]), import.meta.url),
	"../appliances/models/riceCooker.ts": () => __vitePreload(() => import("./riceCooker-1uhEi14Y.js").then((n) => n.n), __vite__mapDeps([28,1,2,3,4,5,22]), import.meta.url),
	"../appliances/models/robotVacuum.ts": () => __vitePreload(() => import("./robotVacuum-DBGIBbfo.js").then((n) => n.n), __vite__mapDeps([29,1,2,3,4,5]), import.meta.url),
	"../appliances/models/smartBin.ts": () => __vitePreload(() => import("./smartBin-CqTKJ_OO.js").then((n) => n.n), __vite__mapDeps([30,1,2,3,4,5]), import.meta.url),
	"../appliances/models/standMixer.ts": () => __vitePreload(() => import("./standMixer-CWdHDvAL.js").then((n) => n.n), __vite__mapDeps([31,1,2,3,4,5]), import.meta.url),
	"../appliances/models/television.ts": () => __vitePreload(() => import("./television-BLz4LXUF.js").then((n) => n.n), __vite__mapDeps([32,1,2,3,4,5]), import.meta.url),
	"../appliances/models/toaster.ts": () => __vitePreload(() => import("./toaster-DCU0xvOs.js").then((n) => n.n), __vite__mapDeps([33,1,2,3,4,5]), import.meta.url),
	"../appliances/models/washer.ts": () => __vitePreload(() => import("./washer-LtxQTif2.js").then((n) => n.n), __vite__mapDeps([34,1,2,3,4,5]), import.meta.url)
});
var params = new URLSearchParams(location.search);
var requestedModel = params.get("model") ?? "toaster";
var requestedView = params.get("view") ?? "three-quarter";
var accent = Number.parseInt(params.get("accent") ?? "e8a7b7", 16);
var clayReview = params.get("clay") === "1";
var silhouetteReview = params.get("silhouette") === "1";
var normalizedRequestedModel = requestedModel.replace(/\.ts$/i, "").replace(/[-_]/g, "").toLowerCase();
var reviewDefinition = APPLIANCE_CATALOG.find((definition) => definition.id.replace(/[-_]/g, "").toLowerCase() === normalizedRequestedModel) ?? APPLIANCE_CATALOG[0];
function requireElement(selector) {
	const element = document.querySelector(selector);
	if (!element) throw new Error(`Model review UI is missing ${selector}.`);
	return element;
}
var canvas = requireElement("#model-review-canvas");
var status = requireElement("#model-review-status");
var title = requireElement("#model-title");
var renderer = new WebGLRenderer({
	canvas,
	antialias: true,
	alpha: false
});
renderer.outputColorSpace = SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = 1;
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setClearColor(15593975, 1);
var scene = new Scene();
var disposeJellyEnvironment = installJellyEnvironment(renderer, scene);
window.addEventListener("pagehide", disposeJellyEnvironment, { once: true });
scene.background = new Color(15593975);
scene.fog = new Fog(15593975, 18, 38);
var camera = new PerspectiveCamera(32, 1, .05, 80);
var controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = .08;
controls.autoRotate = params.get("spin") === "1";
controls.autoRotateSpeed = 1.1;
controls.minDistance = 1;
controls.maxDistance = 24;
var stage = new Group();
scene.add(stage);
var floor = new Mesh(new CircleGeometry(5, 64), new ShadowMaterial({
	color: 6708085,
	opacity: .15
}));
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);
var hemi = new HemisphereLight(16775407, 9077404, 1.55);
scene.add(hemi);
var key = new DirectionalLight(16773599, 3.2);
key.position.set(-4.5, 7.5, 6.5);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
key.shadow.radius = 4;
scene.add(key);
var fill = new DirectionalLight(12048879, 1.35);
fill.position.set(5, 3, -4);
scene.add(fill);
var rim = new DirectionalLight(15907023, 1.6);
rim.position.set(-3, 4, -6);
scene.add(rim);
var performances = new AppliancePerformanceSystem();
var petals = new PetalField(8);
scene.add(performances.root, petals.mesh);
var current = null;
var performanceTarget = null;
var radius = 2;
var powered = params.get("power") !== "0";
var startedAt = performance.now() * .001;
var lastFrameAt = startedAt;
var previousElapsed = -1;
var reviewElapsed = 0;
var fixedReviewElapsed = null;
var selectedView = requestedView;
function applyPreviewLightingProfile(profile) {
	if (profile !== "sakura-appliance-v2") return;
	const background = new Color(15986408);
	renderer.toneMapping = 4;
	renderer.toneMappingExposure = 1.05;
	renderer.setClearColor(background, 1);
	scene.background = background;
	if (scene.fog instanceof Fog) {
		scene.fog.color.copy(background);
		scene.fog.near = 19;
		scene.fog.far = 40;
	}
	hemi.color.set(16774374);
	hemi.groundColor.set(8484751);
	hemi.intensity = 1.15;
	key.color.set(16771798);
	key.intensity = 2.4;
	fill.color.set(12175592);
	fill.intensity = .9;
	rim.color.set(15838920);
	rim.intensity = 1.15;
	if (floor.material instanceof ShadowMaterial) floor.material.opacity = .2;
}
function applySilhouetteReview(model) {
	if (!silhouetteReview) return;
	const white = new Color(16777215);
	const silhouetteMaterial = new MeshBasicMaterial({ color: 0 });
	renderer.toneMapping = 0;
	renderer.toneMappingExposure = 1;
	renderer.shadowMap.enabled = false;
	renderer.setClearColor(white, 1);
	scene.background = white;
	scene.fog = null;
	floor.visible = false;
	petals.mesh.visible = false;
	performances.root.visible = false;
	model.root.traverse((object) => {
		if (!(object instanceof Mesh)) return;
		if (object.userData.isOutline === true) {
			object.visible = false;
			return;
		}
		object.material = silhouetteMaterial;
		object.castShadow = false;
		object.receiveShadow = false;
	});
}
function findModulePath(name) {
	const normalized = name.replace(/\.ts$/i, "").replace(/[-_]/g, "").toLowerCase();
	const paths = Object.keys(modules);
	const basenameFor = (path) => path.split(/[\\/]/).at(-1)?.replace(/\.ts$/i, "").replace(/[-_]/g, "").toLowerCase() ?? "";
	const exact = paths.find((path) => basenameFor(path) === normalized);
	if (exact) return exact;
	return paths.find((path) => {
		const basename = basenameFor(path);
		return basename.includes(normalized) || normalized.includes(basename);
	}) ?? null;
}
function findFactory(module) {
	for (const [key, value] of Object.entries(module)) if (key.startsWith("create") && key.endsWith("Model") && typeof value === "function") return value;
	return null;
}
function applyView(view) {
	selectedView = view;
	const directions = {
		front: new Vector3(0, .08, 1),
		side: new Vector3(1, .08, 0),
		"side-flat": new Vector3(1, 0, 0),
		back: new Vector3(0, .08, -1),
		top: new Vector3(0, 1, .001),
		underside: new Vector3(0, -1, -.001),
		"three-quarter": new Vector3(1.25, .82, 2.35)
	};
	const framingScale = Number(current?.root.userData.previewFramingScale ?? 1);
	const distance = Math.max(2.4, radius / Math.tan(MathUtils.degToRad(camera.fov * .5)) * 1.25 * framingScale);
	const focusOffsetY = Number(current?.root.userData.previewFocusOffsetY ?? 0);
	camera.position.copy(directions[view].normalize().multiplyScalar(distance));
	camera.position.y += focusOffsetY;
	camera.near = Math.max(.01, distance / 100);
	camera.far = Math.max(30, distance * 10);
	camera.updateProjectionMatrix();
	controls.target.set(0, focusOffsetY, 0);
	controls.update();
}
function frameModel(model) {
	stage.position.set(0, 0, 0);
	model.root.position.set(0, 0, 0);
	model.root.rotation.set(0, 0, 0);
	model.root.scale.setScalar(1);
	model.root.updateMatrixWorld(true);
	const bounds = new Box3().setFromObject(model.root);
	const center = bounds.getCenter(new Vector3());
	const size = bounds.getSize(new Vector3());
	stage.position.copy(center).multiplyScalar(-1);
	radius = Math.max(size.x, size.y, size.z) * .58;
	floor.position.y = -size.y * .5 - .045;
	floor.scale.setScalar(Math.max(.8, Math.max(size.x, size.z) * .48));
	applyView(selectedView);
}
async function loadModel() {
	const path = findModulePath(requestedModel);
	if (!path) throw new Error(`找不到模型模块：${requestedModel}`);
	const factory = findFactory(await modules[path]());
	if (!factory) throw new Error(`模块未导出 create*Model 工厂：${path}`);
	current = factory({
		id: reviewDefinition.id,
		accent
	});
	applyPreviewLightingProfile(current.root.userData.previewLightingProfile);
	applySilhouetteReview(current);
	performanceTarget = {
		root: current.root,
		state: powered ? "active" : "idle",
		kind: reviewDefinition.id,
		facingSide: 1,
		getActiveElapsed: () => Number.isFinite(window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__) ? Math.max(0, window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__) : reviewElapsed
	};
	if (clayReview) {
		const clay = new MeshBasicMaterial({ color: 13154997 });
		current.interactiveMeshes.forEach((mesh) => {
			mesh.material = clay;
		});
	}
	stage.add(current.root);
	frameModel(current);
	title.textContent = requestedModel;
	status.textContent = `视角 ${selectedView} · ${current.interactiveMeshes.length} 个可交互网格 · ${current.accuracy.inferred.length} 个推测项`;
}
function resize() {
	const rect = canvas.getBoundingClientRect();
	if (rect.width < 1 || rect.height < 1) return;
	renderer.setSize(rect.width, rect.height, false);
	camera.aspect = rect.width / rect.height;
	camera.updateProjectionMatrix();
}
document.querySelectorAll("[data-view]").forEach((button) => {
	button.addEventListener("click", () => applyView(button.dataset.view));
});
document.querySelector("#review-reset")?.addEventListener("click", () => {
	performances.reset();
	startedAt = performance.now() * .001;
	if (current) frameModel(current);
});
document.querySelector("#review-rotate")?.addEventListener("click", (event) => {
	controls.autoRotate = !controls.autoRotate;
	event.currentTarget.textContent = controls.autoRotate ? "暂停自转" : "开始自转";
});
new ResizeObserver(resize).observe(canvas);
window.addEventListener("resize", resize);
var reviewWindow = window;
reviewWindow.__MODEL_REVIEW_SET_VIEW__ = applyView;
reviewWindow.__MODEL_REVIEW_SET_POWER__ = (value) => {
	powered = value;
	fixedReviewElapsed = null;
	startedAt = performance.now() * .001;
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
	const mesh = object instanceof Mesh ? object : null;
	const materials = mesh ? Array.isArray(mesh.material) ? mesh.material : [mesh.material] : [];
	return [name, object ? {
		position: object.position.toArray(),
		quaternion: object.quaternion.toArray(),
		scale: object.scale.toArray(),
		visible: object.visible,
		materialOpacity: materials.map((material) => material.opacity)
	} : null];
}));
function radioAntennaReviewDiagnostics() {
	const hinge = current?.root.getObjectByName("radio-antenna-hinge-pivot");
	const tip = current?.root.getObjectByName("radio-antenna-tip-cap");
	if (!hinge || !tip) return null;
	const baseWorld = hinge.getWorldPosition(new Vector3());
	const tipWorld = tip.getWorldPosition(new Vector3());
	const direction = tipWorld.clone().sub(baseWorld).normalize();
	const baseNdc = baseWorld.clone().project(camera);
	const tipNdc = tipWorld.clone().project(camera);
	return {
		baseWorld: baseWorld.toArray(),
		tipWorld: tipWorld.toArray(),
		direction: direction.toArray(),
		angleFromWorldUp: MathUtils.radToDeg(direction.angleTo(new Vector3(0, 1, 0))),
		baseNdc: baseNdc.toArray(),
		tipNdc: tipNdc.toArray(),
		projectedAngleFromScreenUp: MathUtils.radToDeg(Math.atan2(Math.abs(tipNdc.x - baseNdc.x), Math.abs(tipNdc.y - baseNdc.y)))
	};
}
function animate() {
	requestAnimationFrame(animate);
	const now = performance.now() * .001;
	const delta = Math.min(.05, Math.max(0, now - lastFrameAt));
	lastFrameAt = now;
	const elapsed = fixedReviewElapsed ?? (now - startedAt) % poweredPreviewCycleDuration(reviewDefinition.id);
	reviewElapsed = elapsed;
	const state = poweredAnimationState(powered ? elapsed : Number.POSITIVE_INFINITY, reviewDefinition.id);
	if (elapsed < previousElapsed) performances.reset();
	previousElapsed = elapsed;
	if (performanceTarget) {
		performanceTarget.state = state.active ? "active" : "idle";
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
		triangles: renderer.info.render.triangles
	};
}
loadModel().then(() => {
	resize();
	animate();
}).catch((error) => {
	status.textContent = error instanceof Error ? error.message : String(error);
	throw error;
});
//#endregion

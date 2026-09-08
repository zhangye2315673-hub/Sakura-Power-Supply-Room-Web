import "./modulepreload-polyfill-BsPm7yBB.js";
import { Pn as Scene, Qn as TubeGeometry, St as MeshToonMaterial, W as HemisphereLight, dr as Vector3, ht as Mesh, jt as PerspectiveCamera, k as DirectionalLight, u as CatmullRomCurve3 } from "./three.core-DlTOC7bx.js";
import { s as WebGLRenderer } from "./palette-knpLSfXB.js";
import { t as SkillPresentationController } from "./SkillPresentationController-Cu0MYo2a.js";
//#region src/review/skillPresentationReview.ts
var app = document.querySelector("#app");
var renderer = new WebGLRenderer({
	antialias: true,
	alpha: true
});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(16249319, 1);
app.append(renderer.domElement);
var scene = new Scene();
var camera = new PerspectiveCamera(34, 1, .1, 100);
camera.position.set(0, .2, 4.6);
scene.add(new HemisphereLight(16777215, 9205912, 2.2));
var key = new DirectionalLight(16773852, 3.4);
key.position.set(4, 6, 8);
scene.add(key);
var cableScale = 1;
var controller = new SkillPresentationController(scene, camera, {
	commitAutoRemoval: () => true,
	setCableVisualScale: (scale) => {
		cableScale = scale;
	},
	getRiceCableVisualScale: () => cableScale,
	getCableBaseColor: () => null,
	setCableSkillSweep: () => {},
	setCableSkillTint: () => {},
	setCableSkillRecolor: () => {},
	commitCableColors: () => {}
});
var skill = new URLSearchParams(location.search).get("skill") ?? "radio";
var compact = innerWidth < 600;
if (compact) camera.position.z = 9;
var ids = skill === "radio" ? [
	"a",
	"b",
	"c"
] : skill === "rice-cooker" ? [
	"a",
	"b",
	"c",
	"d",
	"e"
] : [
	"a",
	"b",
	"c",
	"d",
	"e",
	"f"
];
var positions = skill === "radio" ? compact ? [
	new Vector3(-.7, 0, 0),
	new Vector3(0, .75, 0),
	new Vector3(.7, 0, 0)
] : [
	new Vector3(-1.7, .1, 0),
	new Vector3(0, .65, 0),
	new Vector3(1.7, .1, 0)
] : skill === "robot-vacuum" ? compact ? [
	new Vector3(-.7, 0, 0),
	new Vector3(0, .75, 0),
	new Vector3(.7, 0, 0)
] : [
	new Vector3(-1.7, .1, 0),
	new Vector3(0, .65, 0),
	new Vector3(1.7, .1, 0)
] : ids.map((_, index) => {
	const columns = compact ? 2 : 3;
	const centeredColumn = index % columns - (columns - 1) * .5;
	return new Vector3(centeredColumn * (compact ? 1.05 : 1.55), (compact ? 1.05 : .6) - Math.floor(index / columns) * (compact ? .95 : 1.45), 0);
});
if (skill === "rice-cooker") {
	const cableMaterial = new MeshToonMaterial({ color: 7037305 });
	positions.forEach((position, index) => {
		const points = [
			position.clone().add(new Vector3(-.65, -.18, 0)),
			position.clone().add(new Vector3(0, .2, 0)),
			position.clone().add(new Vector3(.65, -.18, 0))
		];
		const cable = new Mesh(new TubeGeometry(new CatmullRomCurve3(points), 12, .025, 6, false), cableMaterial);
		cable.name = `review-rice-cable-${index + 1}`;
		scene.add(cable);
	});
}
var resolution = {
	skillId: skill === "radio" ? "route-broadcast" : skill === "rice-cooker" ? "rice-thick-cable" : "snapshot-sweep",
	appliance: skill,
	label: skill,
	targetCableIds: ids,
	commands: [],
	requiresSelection: null,
	topologyChanged: skill === "robot-vacuum",
	presentation: {
		cue: "review",
		commit: "review",
		settle: "review",
		assetIds: []
	}
};
var reviewTargets = positions.map((position, index) => ({
	cableId: ids[index] ?? `review-${index + 1}`,
	position,
	path: skill === "rice-cooker" ? [
		position.clone().add(new Vector3(-.65, -.18, 0)),
		position.clone().add(new Vector3(0, .2, 0)),
		position.clone().add(new Vector3(.65, -.18, 0))
	] : void 0
}));
controller.play(resolution, reviewTargets);
controller.freezeForEvidence(skill === "radio" ? 560 : skill === "rice-cooker" ? 390 : 430);
function resize() {
	const width = innerWidth;
	const height = innerHeight;
	renderer.setSize(width, height);
	camera.aspect = width / height;
	camera.updateProjectionMatrix();
	controller.resize(width, height);
}
resize();
addEventListener("resize", resize);
function frame() {
	renderer.render(scene, camera);
	controller.render();
	requestAnimationFrame(frame);
}
frame();
window.__SKILL_REVIEW_READY__ = true;
//#endregion

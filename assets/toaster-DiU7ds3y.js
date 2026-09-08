import { t as __exportAll } from "./rolldown-runtime-D7D4PA-g.js";
import { I as ExtrudeGeometry, Ln as Shape, S as CylinderGeometry, ft as MathUtils, ht as Mesh, p as Color } from "./three.core-DlTOC7bx.js";
import { i as RoundedBoxGeometry, r as toCreasedNormals } from "./BufferGeometryUtils-Bf_-bT2g.js";
import { a as setHullOutlineStyle, d as ApplianceModelKit } from "./outline-Brkgge31.js";
//#region src/appliances/models/toaster.ts
var toaster_exports = /* @__PURE__ */ __exportAll({ createToasterModel: () => createToasterModel });
var V2_REFERENCE_PATH = "references/intake-v2/toaster/views/front.png";
function stableOutlinePhase(name) {
	let hash = 2166136261;
	for (let index = 0; index < name.length; index += 1) {
		hash ^= name.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return (hash >>> 0) % 1e4 * (Math.PI * 2 / 1e4);
}
function applyToasterOutlineHierarchy(root) {
	const mainSilhouette = /outer-shell|base-band|slot-rim/;
	const fineDetail = /slider-accent|knob-index|dial-tick|status-indicator|rear-vent|cable-recess|foot|slot-divider|heater-bar/;
	root.traverse((object) => {
		if (!(object instanceof Mesh) || object.userData.isOutline !== true) return;
		const parentName = object.parent?.name ?? object.name;
		const tier = mainSilhouette.test(parentName) ? "main" : fineDetail.test(parentName) ? "detail" : "structure";
		setHullOutlineStyle(object, {
			thickness: tier === "main" ? .0048 : tier === "structure" ? .0041 : .0033,
			variation: .18,
			phase: stableOutlinePhase(parentName)
		});
		object.userData.outlineTier = tier;
		object.userData.outlineStable = true;
	});
}
var REFERENCE_PATH = "D:/下载文件/ChatGPT Image 2026年8月2日 19_55_19 (6).png";
var ACTIVE_DURATION = 5.2;
var CARRIAGE_IDLE_Y = 1.19;
var LEVER_IDLE_Y = 1.29;
var CONTROL_X = -.24;
function colorShift(color, lightness, saturation = 0) {
	return new Color(color).offsetHSL(0, saturation, lightness).getHex();
}
function taperedShellGeometry() {
	const shape = new Shape();
	shape.moveTo(-1.01, .24);
	shape.lineTo(-1.09, .31);
	shape.lineTo(-1.02, 1.37);
	shape.lineTo(-.93, 1.55);
	shape.lineTo(-.72, 1.64);
	shape.lineTo(.72, 1.64);
	shape.lineTo(.93, 1.55);
	shape.lineTo(1.02, 1.37);
	shape.lineTo(1.09, .31);
	shape.lineTo(1.01, .24);
	shape.closePath();
	const geometry = new ExtrudeGeometry(shape, {
		depth: 1.18,
		bevelEnabled: true,
		bevelSegments: 5,
		bevelSize: .075,
		bevelThickness: .075,
		curveSegments: 2,
		steps: 1
	});
	geometry.translate(0, 0, -.59);
	toCreasedNormals(geometry, Math.PI / 3);
	return geometry;
}
/**
* Procedural reconstruction of the Sakura two-slot toaster reference.
*
* Local frame: +Y up and +Z is the control/front side. The shell, controls,
* toast carriage and rear service details remain separate runtime components.
*/
function createToasterModel(options) {
	const kit = new ApplianceModelKit(options);
	const accent = new Color(options.accent);
	const shellMaterial = kit.material(15854041, { tint: 7431807 });
	const shellLightMaterial = kit.material(16512232, { tint: 7760514 });
	const accentMaterial = kit.material(colorShift(accent, .035, -.04));
	const accentDarkMaterial = kit.material(colorShift(accent, -.11, -.02));
	const cavityMaterial = kit.material(3156794, { tint: 6247278 });
	const metalMaterial = kit.material(11449531, { tint: 7169143 });
	const rubberMaterial = kit.material(5591390, { tint: 5326687 });
	const heaterMaterial = kit.material(5187892, {
		tint: 6114153,
		emissive: 16739381
	});
	const shell = kit.mesh("toaster-outer-shell", taperedShellGeometry(), shellMaterial);
	shell.position.y = .03;
	kit.mesh("toaster-base-band", new RoundedBoxGeometry(2.28, .22, 1.25, 4, .085), accentMaterial).position.set(0, .24, 0);
	kit.mesh("toaster-shell-lower-seam", new RoundedBoxGeometry(2.13, .028, 1.205, 2, .012), accentDarkMaterial, kit.root, false).position.set(0, .365, 0);
	kit.mesh("toaster-slot-rim", new RoundedBoxGeometry(1.72, .105, .46, 2, .075), metalMaterial).position.set(0, 1.685, .01);
	kit.mesh("toaster-slot-cavity", new RoundedBoxGeometry(1.48, .09, .28, 2, .045), cavityMaterial).position.set(0, 1.722, .01);
	kit.mesh("toaster-slot-glow", new RoundedBoxGeometry(1.28, .028, .13, 1, .025), heaterMaterial, kit.root, false).position.set(0, 1.767, .01);
	kit.mesh("toaster-slot-divider", new RoundedBoxGeometry(.035, .032, .24, 1, .01), metalMaterial, kit.root, false).position.set(0, 1.77, .01);
	const carriage = kit.pivot("toaster-toast-carriage");
	carriage.position.set(0, CARRIAGE_IDLE_Y, .02);
	carriage.userData.motionAxis = [
		0,
		1,
		0
	];
	carriage.userData.range = [CARRIAGE_IDLE_Y, 2.05];
	kit.socket("toaster-carriage-socket", carriage, [
		0,
		0,
		0
	]);
	kit.socket("toaster-external-toast-launch-socket", kit.root, [
		0,
		1.78,
		.02
	]);
	kit.mesh("toaster-lever-track", new RoundedBoxGeometry(.105, .68, .035, 3, .045), cavityMaterial).position.set(CONTROL_X, 1.02, .752);
	const leverPivot = kit.pivot("toaster-lever-pivot");
	leverPivot.position.set(CONTROL_X, LEVER_IDLE_Y, .8);
	leverPivot.userData.motionAxis = [
		0,
		1,
		0
	];
	const slider = kit.mesh("toaster-lever-slider", new RoundedBoxGeometry(.42, .18, .15, 3, .065), shellLightMaterial, leverPivot);
	slider.position.z = .015;
	kit.mesh("toaster-lever-slider-accent", new RoundedBoxGeometry(.35, .055, .17, 2, .025), accentMaterial, leverPivot).position.set(0, -.025, .075);
	kit.socket("toaster-lever-handle-socket", leverPivot, [
		0,
		0,
		.13
	]);
	const knobPivot = kit.pivot("toaster-browning-knob-pivot");
	knobPivot.position.set(CONTROL_X, .57, .785);
	knobPivot.userData.rotationAxis = [
		0,
		0,
		1
	];
	const knobBase = kit.mesh("toaster-browning-knob-base", new CylinderGeometry(.27, .27, .105, 12), accentDarkMaterial, knobPivot);
	knobBase.rotation.x = Math.PI * .5;
	const knob = kit.mesh("toaster-browning-knob", new CylinderGeometry(.22, .235, .13, 12), shellLightMaterial, knobPivot);
	knob.rotation.x = Math.PI * .5;
	knob.position.z = .055;
	kit.mesh("toaster-browning-knob-index", new RoundedBoxGeometry(.025, .095, .018, 1, .008), cavityMaterial, knobPivot, false).position.set(0, .07, .128);
	for (let index = 0; index < 9; index += 1) {
		const angle = MathUtils.lerp(-Math.PI * .72, Math.PI * .72, index / 8);
		const tick = kit.mesh(`toaster-dial-tick-${index + 1}`, new RoundedBoxGeometry(.018, index % 4 === 0 ? .065 : .045, .018, 1, .007), cavityMaterial, kit.root, false);
		tick.position.set(CONTROL_X + Math.sin(angle) * .31, .57 + Math.cos(angle) * .31, .8280000000000001);
		tick.rotation.z = -angle;
	}
	kit.indicator([
		.22,
		.56,
		.8300000000000001
	], .042);
	const sideLever = kit.mesh("toaster-side-upper-control", new RoundedBoxGeometry(.19, .16, .31, 3, .055), shellMaterial);
	sideLever.position.set(1.13, .93, .12);
	sideLever.rotation.z = .02;
	kit.mesh("toaster-side-lower-control", new RoundedBoxGeometry(.15, .22, .25, 3, .05), accentMaterial).position.set(1.12, .58, .09);
	kit.mesh("toaster-rear-panel", new RoundedBoxGeometry(1.08, .52, .025, 3, .1), shellMaterial).position.set(.15, .94, -.752);
	for (let index = 0; index < 3; index += 1) kit.mesh(`toaster-rear-vent-${index + 1}`, new RoundedBoxGeometry(.54, .045, .025, 2, .02), cavityMaterial, kit.root, false).position.set(.25, 1.05 - index * .13, -.781);
	const cableKeeper = kit.mesh("toaster-rear-cable-keeper", new RoundedBoxGeometry(.56, .23, .055, 3, .065), shellLightMaterial);
	cableKeeper.position.set(0, .36, -.79);
	for (const x of [-.17, .17]) kit.mesh(`toaster-cable-recess-${x < 0 ? "left" : "right"}`, new RoundedBoxGeometry(.07, .17, .035, 2, .025), cavityMaterial, kit.root, false).position.set(x, .36, -.823);
	kit.mesh("toaster-cable-recess-top", new RoundedBoxGeometry(.38, .055, .035, 2, .02), cavityMaterial, kit.root, false).position.set(0, .445, -.823);
	kit.socket("toaster-power-cable-socket", cableKeeper, [
		0,
		-.05,
		-.07
	]);
	for (const [x, z] of [
		[-.77, -.42],
		[.77, -.42],
		[-.77, .42],
		[.77, .42]
	]) kit.mesh(`toaster-foot-${x < 0 ? "left" : "right"}-${z < 0 ? "rear" : "front"}`, new RoundedBoxGeometry(.28, .09, .29, 2, .045), rubberMaterial, kit.root, false).position.set(x, .055, z);
	const result = kit.finish({
		referencePath: options.referencePath ?? V2_REFERENCE_PATH,
		reconstructed: [
			"eight-plane lower-wide tapered shell with stepped Sakura-pink base band",
			"deep four-layer recessed top slot with faceted metal rim, cavity, heater and centre divider",
			"front vertical lever track, projecting slider and concentric browning dial",
			"nine radial dial ticks and separate status lamp",
			"two projecting side controls",
			"rear panel, three vents, cable keeper recess and four feet",
			"independent single-slice toast carriage with named pivot and sockets"
		],
		inferred: [
			"heater coils and internal latch are hidden in the reference and intentionally omitted",
			"toast slice thickness, carriage depth and lift travel are inferred for the requested powered animation",
			"rear cable keeper depth and underside foot pads are inferred from the orthographic rear/contact views"
		]
	});
	result.root.userData.referenceDimensions = {
		totalWidth: 2.28,
		totalHeight: 1.78,
		totalDepth: 1.32,
		shellTopWidth: 2.04,
		shellBaseWidth: 2.22,
		slotWidth: 1.62
	};
	result.root.userData.activeDuration = ACTIVE_DURATION;
	result.root.userData.externalPerformance = {
		type: "ballistic-toast-launch",
		socket: "toaster-external-toast-launch-socket",
		launchTime: 3.72,
		initialVelocity: [
			.5,
			5.8,
			3.9
		],
		gravity: [
			0,
			-7.9,
			0
		],
		angularVelocity: [
			4.8,
			-2.1,
			7.2
		],
		peakHoldSeconds: .16,
		recycleAfterScreenExit: true
	};
	result.root.userData.legacyReferencePath = REFERENCE_PATH;
	applyToasterOutlineHierarchy(result.root);
	result.root.userData.sculptRuntime.colliders = [{
		id: "toaster-body-collider",
		type: "box",
		node: "toaster-outer-shell"
	}, {
		id: "toaster-control-collider",
		type: "compound",
		node: "toaster-lever-pivot"
	}];
	result.root.userData.sculptRuntime.destructionGroups = [
		{
			id: "toaster-shell-group",
			nodes: ["toaster-outer-shell", "toaster-base-band"]
		},
		{
			id: "toaster-slot-group",
			nodes: ["toaster-slot-rim", "toaster-slot-cavity"]
		},
		{
			id: "toaster-control-group",
			nodes: ["toaster-lever-pivot", "toaster-browning-knob-pivot"]
		},
		{
			id: "toaster-rear-group",
			nodes: ["toaster-rear-panel", "toaster-rear-cable-keeper"]
		}
	];
	return result;
}
//#endregion
export { toaster_exports as n, createToasterModel as t };

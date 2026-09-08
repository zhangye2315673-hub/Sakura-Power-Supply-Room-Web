import { t as __exportAll } from "./rolldown-runtime-D7D4PA-g.js";
import { Hn as SphereGeometry, S as CylinderGeometry, Xn as TorusGeometry, ht as Mesh, i as BoxGeometry, l as CapsuleGeometry, p as Color } from "./three.core-DlTOC7bx.js";
import { i as RoundedBoxGeometry } from "./BufferGeometryUtils-B_UDylAy.js";
import { a as setHullOutlineStyle, d as ApplianceModelKit } from "./outline-BxlNUz10.js";
//#region src/appliances/models/lamp.ts
var lamp_exports = /* @__PURE__ */ __exportAll({ createLampModel: () => createLampModel });
var REFERENCE_PATH = "D:/下载文件/ChatGPT Image 2026年8月2日 19_55_15 (1).png";
var SHADE_REST_PITCH = -.035;
function colorShift(color, lightness, saturation = 0) {
	return new Color(color).offsetHSL(0, saturation, lightness).getHex();
}
function stableOutlinePhase(name) {
	let hash = 2166136261;
	for (let index = 0; index < name.length; index += 1) {
		hash ^= name.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return (hash >>> 0) % 1e4 * (Math.PI * 2 / 1e4);
}
function applyLampOutlineHierarchy(root) {
	const main = /base-(?:lower-ring|body|top-plate)|stem$|shade-shell|shade-top-cap/;
	const detail = /foot-|hinge-(?:axle|cap)|top-button(?:-index)?$|status-indicator|bulb-volume/;
	const excluded = /warm-diffuser|inner-reflector/;
	root.traverse((object) => {
		if (!(object instanceof Mesh) || object.userData.isOutline !== true) return;
		const sourceName = object.parent?.name ?? object.name;
		if (excluded.test(sourceName)) {
			object.visible = false;
			object.userData.outlineTier = "excluded";
			return;
		}
		const tier = main.test(sourceName) ? "main" : detail.test(sourceName) ? "detail" : "structure";
		setHullOutlineStyle(object, {
			thickness: tier === "main" ? .0048 : tier === "structure" ? .0041 : .0033,
			variation: .18,
			phase: stableOutlinePhase(sourceName)
		});
		object.userData.outlineTier = tier;
		object.userData.outlineStable = true;
	});
}
/**
* Procedural reconstruction of the Sakura desk lamp reference.
*
* Local frame: +Y up, +Z front. The floor contact plane is Y=0.
* The shade, diffuser and light socket share `lamp-head-hinge-pivot`, so
* pitch animation never detaches the emitted light from the visible head.
*/
function createLampModel(options) {
	const kit = new ApplianceModelKit(options);
	const accent = new Color(options.accent);
	const accentLight = colorShift(accent, .075, -.06);
	const accentMid = colorShift(accent, .045, -.04);
	const accentDark = colorShift(accent, -.105, -.03);
	const accentMaterial = kit.material(accentMid);
	const accentLightMaterial = kit.material(accentLight);
	const accentDarkMaterial = kit.material(accentDark);
	const creamMaterial = kit.material(15985368, { tint: 7431807 });
	const creamShadeMaterial = kit.material(16314591, { tint: 7760514 });
	const hingeMaterial = kit.material(14127017, { tint: 6773624 });
	const diffuserMaterial = kit.material(16772541, {
		tint: 9073029,
		emissive: 16763243
	});
	const litRimMaterial = kit.material(16773848, {
		tint: 8942472,
		emissive: 16764802
	});
	const reflectorMaterial = kit.material(16770989, {
		tint: 10123141,
		emissive: 16761695
	});
	const lowerRing = kit.mesh("lamp-base-lower-ring", new CylinderGeometry(.845, .865, .105, 12, 1), accentDarkMaterial);
	lowerRing.position.y = .055;
	const baseBody = kit.mesh("lamp-base-body", new CylinderGeometry(.795, .845, .145, 12, 2), accentMaterial);
	baseBody.position.y = .165;
	const baseTop = kit.mesh("lamp-base-top-plate", new CylinderGeometry(.705, .795, .075, 12, 1), accentLightMaterial);
	baseTop.position.y = .275;
	for (const x of [-.57, .57]) kit.mesh(`lamp-base-foot-${x < 0 ? "left" : "right"}`, new CylinderGeometry(.095, .11, .045, 12), accentDarkMaterial, kit.root, false).position.set(x, .018, 0);
	const stemFoot = kit.mesh("lamp-stem-foot-collar", new CylinderGeometry(.135, .15, .28, 20), accentMaterial);
	stemFoot.position.y = .43;
	const stem = kit.mesh("lamp-stem", new CylinderGeometry(.055, .062, 2.55, 14), creamMaterial);
	stem.position.y = 1.795;
	kit.mesh("lamp-stem-top-socket", new CylinderGeometry(.095, .11, .23, 16), accentMaterial).position.set(0, 3.04, -.12);
	kit.mesh("lamp-stem-hinge-bridge", new BoxGeometry(.13, .12, .38, 1, 1, 2), hingeMaterial).position.set(0, 3.08, -.3);
	kit.mesh("lamp-hinge-yoke", new CapsuleGeometry(.075, .3, 4, 10), hingeMaterial).position.set(0, 3.13, -.47);
	const headPivot = kit.pivot("lamp-head-hinge-pivot");
	headPivot.position.set(0, 3.22, -.47);
	headPivot.rotation.x = SHADE_REST_PITCH;
	headPivot.userData.hingeAxis = [
		1,
		0,
		0
	];
	headPivot.userData.pitchRange = [-.9, .16];
	const axle = kit.mesh("lamp-hinge-axle", new CylinderGeometry(.06, .06, .34, 14), accentDarkMaterial, headPivot);
	axle.rotation.z = Math.PI * .5;
	axle.position.set(0, 0, -.04);
	for (const x of [-.19, .19]) {
		const cap = kit.mesh(`lamp-hinge-cap-${x < 0 ? "left" : "right"}`, new CylinderGeometry(.11, .11, .065, 18), accentLightMaterial, headPivot);
		cap.rotation.z = Math.PI * .5;
		cap.position.set(x, 0, -.04);
	}
	kit.mesh("lamp-shade-shell", new CylinderGeometry(.32, .665, .94, 24, 2, true), creamShadeMaterial, headPivot).position.set(0, .27, .74);
	kit.mesh("lamp-shade-top-cap", new CylinderGeometry(.305, .32, .07, 24), creamShadeMaterial, headPivot).position.set(0, .755, .74);
	const shadeRim = kit.mesh("lamp-shade-front-rim", new TorusGeometry(.607, .038, 8, 28), litRimMaterial, headPivot);
	shadeRim.rotation.x = Math.PI * .5;
	shadeRim.position.set(0, -.205, .74);
	kit.mesh("lamp-inner-reflector", new CylinderGeometry(.29, .545, .27, 12, 2, true), reflectorMaterial, headPivot).position.set(0, -.075, .74);
	const bulb = kit.mesh("lamp-bulb-volume", new SphereGeometry(.155, 18, 12), diffuserMaterial, headPivot);
	bulb.scale.set(1, .72, 1);
	bulb.position.set(0, -.12, .74);
	kit.mesh("lamp-warm-diffuser", new CylinderGeometry(.565, .565, .035, 12), diffuserMaterial, headPivot).position.set(0, -.218, .74);
	const topButtonPivot = kit.pivot("lamp-shade-top-button-pivot", headPivot);
	topButtonPivot.position.set(0, .845, .74);
	kit.mesh("lamp-shade-top-button", new CylinderGeometry(.135, .135, .115, 16), accentMaterial, topButtonPivot);
	kit.mesh("lamp-shade-top-button-index", new RoundedBoxGeometry(.024, .012, .075, 2, .007), accentDarkMaterial, topButtonPivot, false).position.set(0, .062, .025);
	const lightSocket = kit.socket("lamp-light-socket", headPivot, [
		0,
		-.285,
		.74
	]);
	lightSocket.userData.direction = [
		0,
		-1,
		0
	];
	lightSocket.userData.apertureRadius = .565;
	lightSocket.userData.emitter = "recessed-reflector-and-bulb";
	kit.indicator([
		0,
		.255,
		.675
	], .031);
	const result = kit.finish({
		referencePath: options.referencePath ?? REFERENCE_PATH,
		reconstructed: [
			"broad shallow three-layer circular base",
			"slender off-white vertical stem with pink foot collar",
			"rear hinge yoke with circular side caps",
			"stem-to-hinge bridge that keeps the rear articulation physically attached",
			"open tapered bell shade, separate front rim and warm diffuser",
			"recessed open reflector and volumetric bulb behind the diffuser",
			"small pink top button",
			"hinge pivot and child light socket"
		],
		inferred: [
			"diffuser mounting and lamp interior depth are inferred because the reference does not expose the shade interior",
			"base underside feet are inferred from the contact shadow",
			"hinge axle construction is inferred from the visible circular side cap"
		]
	});
	result.root.userData.referenceDimensions = {
		totalHeight: 4.12,
		baseDiameter: 1.73,
		baseHeight: .315,
		stemDiameter: .12,
		shadeHeight: .94,
		shadeMouthDiameter: 1.33
	};
	result.root.userData.visualRevision = "sakura-lamp-v2";
	result.root.userData.previewLightingProfile = "sakura-appliance-v2";
	result.root.userData.outlineContract = {
		main: .0048,
		structure: .0041,
		detail: .0033,
		variation: .18,
		stable: true
	};
	result.root.userData.sculptRuntime.colliders = [
		{
			id: "lamp-body",
			type: "box",
			node: "root"
		},
		{
			id: "lamp-head",
			type: "box",
			node: "lamp-head-hinge-pivot"
		},
		{
			id: "lamp-base",
			type: "cylinder",
			node: "lamp-base-body"
		}
	];
	result.root.userData.sculptRuntime.destructionGroups = [
		{
			id: "lamp-base-system",
			nodes: [
				"lamp-base-lower-ring",
				"lamp-base-body",
				"lamp-base-top-plate",
				"lamp-base-foot-left",
				"lamp-base-foot-right"
			]
		},
		{
			id: "lamp-stem-system",
			nodes: [
				"lamp-stem-foot-collar",
				"lamp-stem",
				"lamp-stem-top-socket"
			]
		},
		{
			id: "lamp-hinge-system",
			nodes: [
				"lamp-stem-hinge-bridge",
				"lamp-hinge-yoke",
				"lamp-hinge-axle",
				"lamp-hinge-cap-left",
				"lamp-hinge-cap-right"
			]
		},
		{
			id: "lamp-head-system",
			nodes: [
				"lamp-shade-shell",
				"lamp-shade-top-cap",
				"lamp-shade-front-rim",
				"lamp-inner-reflector",
				"lamp-bulb-volume",
				"lamp-warm-diffuser",
				"lamp-shade-top-button-pivot"
			]
		}
	];
	applyLampOutlineHierarchy(result.root);
	return result;
}
//#endregion
export { lamp_exports as n, createLampModel as t };

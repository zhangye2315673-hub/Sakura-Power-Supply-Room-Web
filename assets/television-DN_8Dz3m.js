import { t as __exportAll } from "./rolldown-runtime-D7D4PA-g.js";
import { G as IcosahedronGeometry, Ln as Shape, Rn as ShapeGeometry, S as CylinderGeometry, Xn as TorusGeometry, ht as Mesh, p as Color } from "./three.core-DlTOC7bx.js";
import { i as RoundedBoxGeometry } from "./BufferGeometryUtils-CSuwXBGj.js";
import { a as setHullOutlineStyle, d as ApplianceModelKit } from "./outline-DAm9XhPL.js";
//#region src/appliances/models/television.ts
var television_exports = /* @__PURE__ */ __exportAll({ createTelevisionModel: () => createTelevisionModel });
var REFERENCE_PATH = "D:/下载文件/ChatGPT Image 2026年8月2日 19_55_17 (4).png";
var ACTIVE_DURATION = 5.2;
function shiftedAccent(accent, lightness, saturation = 0) {
	return new Color(accent).offsetHSL(0, saturation, lightness).getHex();
}
function stableOutlinePhase(name) {
	let hash = 2166136261;
	for (let index = 0; index < name.length; index += 1) {
		hash ^= name.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return (hash >>> 0) % 1e4 * (Math.PI * 2 / 1e4);
}
function applyTelevisionOutlineHierarchy(root) {
	const main = /rear-shell|rear-cap|front-fascia|lower-accent-rail/;
	const structure = /screen-frame|screen-cavity|control-panel|control-brow|selector|channel-button|power-button|rear-service-panel|rear-port-panel|foot/;
	const excluded = /glass-skin|channel-[123]-|static-|shutdown-|active-scanline|raster-line/;
	root.traverse((object) => {
		if (!(object instanceof Mesh) || object.userData.isOutline !== true) return;
		const source = object.parent?.name ?? object.name;
		if (excluded.test(source)) {
			object.visible = false;
			object.userData.outlineTier = "excluded";
			return;
		}
		const tier = main.test(source) ? "main" : structure.test(source) ? "structure" : "detail";
		setHullOutlineStyle(object, {
			thickness: tier === "main" ? .0048 : tier === "structure" ? .0041 : .0033,
			variation: .18,
			phase: stableOutlinePhase(source)
		});
		object.userData.outlineTier = tier;
		object.userData.outlineStable = true;
	});
}
function roundedRectShape(width, height, radius) {
	const halfWidth = width * .5;
	const halfHeight = height * .5;
	const shape = new Shape();
	shape.moveTo(-halfWidth + radius, -halfHeight);
	shape.lineTo(halfWidth - radius, -halfHeight);
	shape.quadraticCurveTo(halfWidth, -halfHeight, halfWidth, -halfHeight + radius);
	shape.lineTo(halfWidth, halfHeight - radius);
	shape.quadraticCurveTo(halfWidth, halfHeight, halfWidth - radius, halfHeight);
	shape.lineTo(-halfWidth + radius, halfHeight);
	shape.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth, halfHeight - radius);
	shape.lineTo(-halfWidth, -halfHeight + radius);
	shape.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth + radius, -halfHeight);
	return shape;
}
function bulgedScreenGeometry(width, height, radius, bulge) {
	const geometry = new ShapeGeometry(roundedRectShape(width, height, radius), 18);
	const position = geometry.getAttribute("position");
	for (let index = 0; index < position.count; index += 1) {
		const normalizedX = Math.abs(position.getX(index) / (width * .5));
		const normalizedY = Math.abs(position.getY(index) / (height * .5));
		const edge = Math.min(1, Math.pow(normalizedX, 4) + Math.pow(normalizedY, 4));
		position.setZ(index, bulge * (1 - edge));
	}
	position.needsUpdate = true;
	geometry.computeVertexNormals();
	return geometry;
}
function addRoundedBar(kit, name, width, height, depth, material, parent, radius = Math.min(width, height) * .35) {
	const bar = kit.mesh(name, new RoundedBoxGeometry(width, height, depth, 2, Math.max(.004, radius)), material, parent, false);
	bar.userData.explodeWithParent = true;
	return bar;
}
/**
* Procedural reconstruction of the supplied three-view retro CRT television.
*
* Local frame: +Y up, +Z front, floor at Y=0. The front fascia, display,
* controls, rear service shell and feet are independent assemblies so the
* gallery can inspect and animate them without turning the prop into one mesh.
*/
function createTelevisionModel(options) {
	const kit = new ApplianceModelKit(options);
	const accentLight = shiftedAccent(options.accent, .18, -.08);
	const accentMid = shiftedAccent(options.accent, .07, -.04);
	const accentDark = shiftedAccent(options.accent, -.09, -.02);
	const shellMaterial = kit.material(15919833, { tint: 7431804 });
	const shellHighlightMaterial = kit.material(16446178, { tint: 7826305 });
	const shellShadowMaterial = kit.material(14143423, { tint: 6642800 });
	const accentMaterial = kit.material(accentMid, { tint: 7102068 });
	const accentDarkMaterial = kit.material(accentDark, { tint: 6181481 });
	const cavityMaterial = kit.material(3421762, { tint: 2630962 });
	const rubberMaterial = kit.material(5789538, { tint: 4209736 });
	const metalMaterial = kit.material(10132645, { tint: 5656927 });
	const screenMaterial = kit.material(4936536, {
		tint: 3158333,
		emissive: accentLight
	});
	const screenGlassMaterial = kit.material(10268336, {
		tint: 6185584,
		transparent: true,
		opacity: .12
	});
	const scanlineMaterial = kit.material(accentLight, {
		tint: 7168116,
		emissive: accentLight,
		transparent: true,
		opacity: .55
	});
	const channelMaterials = {
		sky: kit.material(6736360, {
			tint: 4683663,
			emissive: 3310756
		}),
		sun: kit.material(16766047, {
			tint: 10121552,
			emissive: 16753725
		}),
		hill: kit.material(6079883, {
			tint: 4684650,
			emissive: 2985827
		}),
		pink: kit.material(16742552, {
			tint: 9526386,
			emissive: 14041707
		}),
		purple: kit.material(9405151, {
			tint: 6444931,
			emissive: 6113718
		}),
		blue: kit.material(4154798, {
			tint: 3755890,
			emissive: 2705278
		}),
		cyan: kit.material(5626833, {
			tint: 3964283,
			emissive: 2927266
		}),
		white: kit.material(16774879, {
			tint: 9142673,
			emissive: 16768162
		}),
		staticDark: kit.material(5726327, {
			tint: 3422279,
			emissive: 2568525
		})
	};
	kit.mesh("television-rear-shell", new RoundedBoxGeometry(3.22, 2.18, 1.5, 2, .18), shellMaterial).position.set(0, 1.24, -.11);
	kit.mesh("television-rear-cap", new RoundedBoxGeometry(2.88, 1.85, .28, 2, .15), shellShadowMaterial).position.set(.02, 1.25, -.89);
	kit.mesh("television-front-fascia", new RoundedBoxGeometry(3.45, 2.14, .31, 2, .17), shellHighlightMaterial).position.set(0, 1.24, .71);
	kit.mesh("television-lower-accent-rail", new RoundedBoxGeometry(3.25, .17, 1.35, 3, .065), accentMaterial).position.set(0, .22, -.04);
	for (const side of [-1, 1]) {
		const shoulder = kit.mesh(`television-side-shoulder-${side < 0 ? "left" : "right"}`, new RoundedBoxGeometry(.14, 1.63, 1.12, 1, .055), shellShadowMaterial);
		shoulder.position.set(side * 1.565, 1.28, -.12);
		shoulder.rotation.z = side * -.025;
		shoulder.userData.explodeWithParent = true;
		const accentBlade = kit.mesh(`television-side-accent-blade-${side < 0 ? "left" : "right"}`, new RoundedBoxGeometry(.045, 1.22, .72, 1, .02), accentDarkMaterial, kit.root, false);
		accentBlade.position.set(side * 1.64, 1.22, .08);
		accentBlade.rotation.z = side * -.025;
		accentBlade.userData.explodeWithParent = true;
	}
	kit.mesh("television-screen-frame", new RoundedBoxGeometry(2.55, 1.77, .13, 2, .22), shellShadowMaterial).position.set(-.39, 1.3, .9);
	kit.mesh("television-screen-cavity", new RoundedBoxGeometry(2.34, 1.56, .09, 5, .18), cavityMaterial).position.set(-.39, 1.3, .985);
	const screenBrow = kit.mesh("television-screen-upper-brow", new RoundedBoxGeometry(2.28, .095, .12, 1, .035), shellHighlightMaterial);
	screenBrow.position.set(-.39, 2.135, .995);
	screenBrow.userData.explodeWithParent = true;
	const screenSill = kit.mesh("television-screen-lower-sill", new RoundedBoxGeometry(2.19, .075, .12, 1, .028), accentDarkMaterial);
	screenSill.position.set(-.39, .47, .995);
	screenSill.userData.explodeWithParent = true;
	const screenPivot = kit.pivot("television-crt-screen-pivot");
	screenPivot.position.set(-.39, 1.3, 1.045);
	screenPivot.userData.rotationAxis = [
		0,
		0,
		1
	];
	kit.socket("television-screen-socket", screenPivot, [
		0,
		0,
		0
	]);
	const screen = kit.mesh("television-crt-bulged-screen", bulgedScreenGeometry(2.18, 1.42, .19, .095), screenMaterial, screenPivot);
	screen.userData.explodeWithParent = true;
	const glass = kit.mesh("television-crt-glass-skin", bulgedScreenGeometry(2.2, 1.44, .2, .102), screenGlassMaterial, screenPivot, false);
	glass.position.z = .065;
	glass.userData.explodeWithParent = true;
	const picturePivot = kit.pivot("television-picture-pivot", screenPivot);
	picturePivot.position.z = .135;
	picturePivot.userData.performanceRoot = true;
	picturePivot.userData.screenEffect = "crt-picture-collapse";
	const channelGroups = [
		kit.pivot("television-channel-1-sakura", picturePivot),
		kit.pivot("television-channel-2-test-card", picturePivot),
		kit.pivot("television-channel-3-night-city", picturePivot)
	];
	channelGroups.forEach((group, index) => {
		group.visible = false;
		group.userData.channelIndex = index;
		group.userData.performanceEffect = true;
	});
	const addPicturePart = (group, name, width, height, material, x, y, depth = .018) => {
		const part = addRoundedBar(kit, name, width, height, depth, material, group, Math.min(width, height) * .18);
		part.position.set(x, y, 0);
		part.userData.performanceEffect = true;
		return part;
	};
	addPicturePart(channelGroups[0], "television-channel-1-sky", 2.06, 1.31, channelMaterials.sky, 0, 0);
	const sun = kit.mesh("television-channel-1-sun", new CylinderGeometry(.22, .22, .025, 20), channelMaterials.sun, channelGroups[0], false);
	sun.rotation.x = Math.PI * .5;
	sun.position.set(.57, .28, .025);
	addPicturePart(channelGroups[0], "television-channel-1-hill-back", 1.32, .34, channelMaterials.hill, -.43, -.34, .035).rotation.z = .12;
	addPicturePart(channelGroups[0], "television-channel-1-hill-front", 1.48, .29, channelMaterials.pink, .41, -.48, .042).rotation.z = -.07;
	for (let index = 0; index < 5; index += 1) kit.mesh(`television-channel-1-sakura-${index + 1}`, new IcosahedronGeometry(.065 + index % 2 * .018, 0), channelMaterials.pink, channelGroups[0], false).position.set(-.78 + index * .32, .38 - index % 2 * .16, .04);
	addPicturePart(channelGroups[1], "television-channel-2-background", 2.06, 1.31, channelMaterials.white, 0, 0);
	[
		channelMaterials.sun,
		channelMaterials.cyan,
		channelMaterials.hill,
		channelMaterials.pink,
		channelMaterials.purple,
		channelMaterials.blue
	].forEach((material, index) => {
		addPicturePart(channelGroups[1], `television-channel-2-colour-bar-${index + 1}`, .29, .9, material, -.78 + index * .312, .12, .032);
	});
	addPicturePart(channelGroups[1], "television-channel-2-lower-band", 1.9, .18, channelMaterials.staticDark, 0, -.48, .034);
	addPicturePart(channelGroups[2], "television-channel-3-sky", 2.06, 1.31, channelMaterials.blue, 0, 0);
	const moon = kit.mesh("television-channel-3-moon", new CylinderGeometry(.17, .17, .026, 18), channelMaterials.sun, channelGroups[2], false);
	moon.rotation.x = Math.PI * .5;
	moon.position.set(-.62, .34, .028);
	[
		.45,
		.7,
		.52,
		.86,
		.6,
		.76,
		.48
	].forEach((height, index) => {
		const material = index % 3 === 0 ? channelMaterials.purple : index % 3 === 1 ? channelMaterials.pink : channelMaterials.cyan;
		addPicturePart(channelGroups[2], `television-channel-3-building-${index + 1}`, .23, height, material, -.83 + index * .276, -.6 + height * .5, .035);
	});
	const staticGroup = kit.pivot("television-static-snow-group", picturePivot);
	staticGroup.visible = false;
	staticGroup.userData.performanceEffect = true;
	addPicturePart(staticGroup, "television-static-background", 2.06, 1.31, channelMaterials.staticDark, 0, 0);
	const snowMaterials = [
		channelMaterials.white,
		channelMaterials.sky,
		channelMaterials.pink,
		channelMaterials.staticDark
	];
	for (let index = 0; index < 48; index += 1) {
		const column = index % 12;
		const row = Math.floor(index / 12);
		const snow = addPicturePart(staticGroup, `television-static-snow-bit-${index + 1}`, .08 + index * 7 % 4 * .018, .035 + index * 5 % 3 * .016, snowMaterials[index % snowMaterials.length], -.91 + column * .166 + (row * 3 + index) % 2 * .025, -.49 + row * .31 + (column + row) % 3 * .036, .04);
		snow.userData.snowSeed = (index * 37 + 11) % 101;
	}
	for (let index = 0; index < 2; index += 1) {
		const band = addPicturePart(staticGroup, `television-static-signal-band-${index + 1}`, 1.92, .07, index === 0 ? channelMaterials.white : channelMaterials.cyan, 0, -.34 + index * .52, .052);
		band.userData.signalBand = true;
	}
	const shutdownLine = addPicturePart(picturePivot, "television-shutdown-phosphor-line", 1.96, .035, channelMaterials.white, 0, 0, .055);
	shutdownLine.visible = false;
	shutdownLine.userData.performanceEffect = true;
	const scanPivot = kit.pivot("television-scanline-pivot", screenPivot);
	scanPivot.position.set(0, -.58, .185);
	addRoundedBar(kit, "television-active-scanline", 1.92, .028, .014, scanlineMaterial, scanPivot, .012).position.set(0, 0, 0);
	for (let index = 0; index < 7; index += 1) addRoundedBar(kit, `television-raster-line-${index + 1}`, 1.98, .009, .008, screenGlassMaterial, screenPivot, .004).position.set(0, -.5 + index * .165, .18);
	kit.mesh("television-control-panel", new RoundedBoxGeometry(.63, 1.73, .105, 2, .11), accentMaterial).position.set(1.22, 1.28, .92);
	const controlBrow = kit.mesh("television-control-brow", new RoundedBoxGeometry(.51, .1, .11, 1, .035), accentDarkMaterial);
	controlBrow.position.set(1.22, 2.075, .995);
	controlBrow.userData.explodeWithParent = true;
	const channelSelector = kit.pivot("television-channel-selector-pivot");
	channelSelector.position.set(1.22, 1.72, 1.005);
	channelSelector.userData.rotationAxis = [
		0,
		0,
		1
	];
	channelSelector.userData.rotationRange = [-1.12, 1.12];
	channelSelector.userData.detents = 3;
	kit.socket("television-channel-selector-socket", channelSelector, [
		0,
		0,
		0
	]);
	const selectorOuter = kit.mesh("television-channel-selector-outer", new CylinderGeometry(.245, .245, .085, 20), accentDarkMaterial, channelSelector);
	selectorOuter.rotation.x = Math.PI * .5;
	const selectorDial = kit.mesh("television-channel-selector-dial", new CylinderGeometry(.195, .205, .125, 20), shellHighlightMaterial, channelSelector);
	selectorDial.rotation.x = Math.PI * .5;
	selectorDial.position.z = .072;
	for (let index = 0; index < 12; index += 1) {
		const angle = index * Math.PI * 2 / 12;
		const tooth = addRoundedBar(kit, `television-channel-selector-tooth-${index + 1}`, .045, .075, .035, accentDarkMaterial, channelSelector, .012);
		tooth.position.set(Math.sin(angle) * .215, Math.cos(angle) * .215, .105);
		tooth.rotation.z = -angle;
	}
	addRoundedBar(kit, "television-channel-selector-index", .022, .14, .02, accentDarkMaterial, channelSelector, .009).position.set(0, .077, .145);
	for (let index = 0; index < 3; index += 1) {
		const angle = -.82 + index * .82;
		const tick = addRoundedBar(kit, `television-channel-detent-${index + 1}`, .025, .065, .018, channelMaterials.white, kit.root, .01);
		tick.position.set(1.22 + Math.sin(angle) * .3, 1.72 + Math.cos(angle) * .3, 1.08);
		tick.rotation.z = -angle;
	}
	const buttonMaterials = [
		channelMaterials.cyan,
		channelMaterials.sun,
		channelMaterials.pink
	];
	for (let index = 0; index < 3; index += 1) {
		const pivot = kit.pivot(`television-channel-button-${index + 1}-pivot`);
		pivot.position.set(1.06 + index * .16, 1.28, 1.015);
		pivot.userData.travelAxis = [
			0,
			0,
			1
		];
		pivot.userData.channelIndex = index;
		kit.socket(`television-channel-button-${index + 1}-socket`, pivot, [
			0,
			0,
			0
		]);
		const key = kit.mesh(`television-channel-button-${index + 1}`, new RoundedBoxGeometry(.13, .2, .125, 3, .03), buttonMaterials[index], pivot);
		key.position.z = .055;
		key.userData.controlAction = `select-channel-${index + 1}`;
	}
	const powerPivot = kit.pivot("television-power-button-pivot");
	powerPivot.position.set(1.22, 1.02, 1.015);
	powerPivot.userData.travelAxis = [
		0,
		0,
		1
	];
	kit.socket("television-power-button-socket", powerPivot, [
		0,
		0,
		0
	]);
	const powerButton = kit.mesh("television-power-button", new RoundedBoxGeometry(.24, .12, .12, 3, .035), channelMaterials.pink, powerPivot);
	powerButton.position.z = .052;
	powerButton.userData.controlAction = "power-toggle";
	kit.indicator([
		1.39,
		1.02,
		1.09
	], .028);
	for (let index = 0; index < 5; index += 1) addRoundedBar(kit, `television-speaker-slot-${index + 1}`, .34, .025, .025, cavityMaterial, kit.root, .011).position.set(1.22, .82 - index * .065, 1.02);
	kit.socket("television-speaker-socket", kit.root, [
		1.22,
		.68,
		1.02
	]);
	kit.mesh("television-rear-service-panel", new RoundedBoxGeometry(2.75, 1.62, .055, 2, .13), shellHighlightMaterial).position.set(.02, 1.28, -1.045);
	for (let row = 0; row < 3; row += 1) for (let column = 0; column < 14; column += 1) addRoundedBar(kit, `television-rear-upper-vent-r${row + 1}-c${column + 1}`, .026, .18, .016, accentDarkMaterial, kit.root, .01).position.set(-.74 + column * .115, 1.72 - row * .2, -1.084);
	for (let row = 0; row < 3; row += 1) for (let column = 0; column < 5; column += 1) addRoundedBar(kit, `television-rear-lower-vent-r${row + 1}-c${column + 1}`, .025, .16, .016, accentDarkMaterial, kit.root, .01).position.set(-.94 + column * .12, .82 - row * .18, -1.084);
	const portPanel = kit.mesh("television-rear-port-panel", new RoundedBoxGeometry(.93, .31, .045, 3, .07), accentMaterial);
	portPanel.position.set(.79, .67, -1.085);
	kit.socket("television-rear-connection-socket", portPanel, [
		0,
		0,
		-.04
	]);
	kit.mesh("television-rear-rectangular-port", new RoundedBoxGeometry(.27, .1, .035, 2, .025), cavityMaterial).position.set(.52, .67, -1.119);
	for (const [index, x] of [.82, 1.08].entries()) kit.mesh(`television-rear-round-port-${index + 1}`, new TorusGeometry(.07, .024, 8, 16), index === 0 ? metalMaterial : accentDarkMaterial, kit.root, false).position.set(x, .67, -1.12);
	for (const [index, [x, y]] of [
		[-1.28, 1.9],
		[1.32, 1.9],
		[-1.28, .52],
		[1.32, .52]
	].entries()) {
		const fastener = kit.mesh(`television-rear-fastener-${index + 1}`, new CylinderGeometry(.035, .035, .024, 10), metalMaterial, kit.root, false);
		fastener.rotation.x = Math.PI * .5;
		fastener.position.set(x, y, -1.086);
		fastener.userData.explodeWithParent = true;
	}
	for (const x of [-1.28, 1.28]) for (const z of [-.55, .55]) kit.mesh(`television-foot-${x < 0 ? "left" : "right"}-${z < 0 ? "rear" : "front"}`, new RoundedBoxGeometry(.38, .18, .38, 2, .06), rubberMaterial, kit.root, false).position.set(x, .09, z);
	const build = kit.finish({
		referencePath: options.referencePath ?? REFERENCE_PATH,
		reconstructed: [
			"deep rounded CRT cabinet with a narrower rear cap and separate front fascia",
			"large left-side rounded bezel with a genuinely bulged display surface and glass skin",
			"accent-colored right control bay with one indexed channel selector, three thick coloured channel keys, power button and speaker slots",
			"accent lower rail and four separated low feet",
			"rear recessed service panel, upper and lower repeated ventilation arrays, fasteners and port bank",
			"three modelled colour programmes, volumetric snow bits, scanline, phosphor shutdown line and synchronized physical controls"
		],
		inferred: [
			"rear-cap taper and exact cabinet depth are inferred from the supplied side view",
			"the rectangular and two round rear ports reproduce the visible hierarchy but not an asserted electrical standard",
			"internal cathode-ray tube, speaker cone, tuner mechanism, wiring and electronics are intentionally omitted",
			"underside panel seams and internal foot fasteners are not visible and remain closed geometry"
		]
	});
	build.root.userData.activeDuration = ACTIVE_DURATION;
	build.root.userData.televisionPerformanceRig = {
		owner: "television-model-rig",
		timelineOwner: "AppliancePerformanceSystem",
		picture: "television-picture-pivot",
		channels: channelGroups.map((group) => group.name),
		static: "television-static-snow-group",
		shutdownLine: shutdownLine.name,
		selector: channelSelector.name,
		buttons: [
			1,
			2,
			3
		].map((index) => `television-channel-button-${index}-pivot`),
		forbiddenGenericEffects: [
			"debris-particles",
			"PlaneGeometry",
			"Sprite",
			"Line"
		]
	};
	build.root.userData.outlineContract = {
		main: .0048,
		structure: .0041,
		detail: .0033,
		variation: .18,
		stable: true,
		style: "Sakura low-poly three-band ink; transparent glass and programme effects excluded"
	};
	build.root.userData.televisionV2 = {
		geometryLanguage: "faceted-deep-crt-with-graphic-shoulders",
		referenceStatus: "conditional-fallback-v1-views-not-gpt-image-2",
		frozenRuntime: [
			"television-crt-screen-pivot",
			"television-picture-pivot",
			"television-channel-selector-pivot",
			"television-power-button-pivot",
			"television-screen-socket",
			"television-speaker-socket",
			"television-rear-connection-socket"
		],
		envelopePolicy: "archived v1 package bounds authoritative"
	};
	applyTelevisionOutlineHierarchy(build.root);
	return build;
}
//#endregion
export { television_exports as n, createTelevisionModel as t };

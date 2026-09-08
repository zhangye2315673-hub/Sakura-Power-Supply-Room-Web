import { t as __exportAll } from "./rolldown-runtime-D7D4PA-g.js";
import { A as DodecahedronGeometry, G as IcosahedronGeometry, I as ExtrudeGeometry, Ln as Shape, Pt as PointLight, S as CylinderGeometry, Xn as TorusGeometry, dr as Vector3, ht as Mesh, p as Color } from "./three.core-DlTOC7bx.js";
import { i as RoundedBoxGeometry } from "./BufferGeometryUtils-Bf_-bT2g.js";
import { a as setHullOutlineStyle, d as ApplianceModelKit } from "./outline-Brkgge31.js";
//#region src/appliances/models/microwave.ts
var microwave_exports = /* @__PURE__ */ __exportAll({ createMicrowaveModel: () => createMicrowaveModel });
var REFERENCE_PATH = "D:/下载文件/ChatGPT Image 2026年8月2日 19_55_20 (9).png";
function shiftedAccent(accent, lightness, saturation = 0) {
	return new Color(accent).offsetHSL(0, saturation, lightness).getHex();
}
var V2_REFERENCE_PATH = "references/intake-v2/microwave/views/front.png";
function stableOutlinePhase(name) {
	let hash = 2166136261;
	for (let index = 0; index < name.length; index += 1) {
		hash ^= name.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return (hash >>> 0) % 1e4 * (Math.PI * 2 / 1e4);
}
function applyMicrowaveOutlineHierarchy(root) {
	const mainSilhouette = /cabinet-shell|cabinet-(?:top-bridge|bottom-bridge|left-side-wall)|top-hood|side-facet-panel|lower-rail|door-outer-frame|control-panel|rear-service-panel/;
	const fineDetail = /display-digit|sequence-indicator|dial-(?:index|tick)|small-round-button-index|rear-(?:vent|fastener|power-contact)|food-topping|foot-/;
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
function facetedPanelGeometry(width, height, depth, chamfer) {
	const halfWidth = width * .5;
	const halfHeight = height * .5;
	const cut = Math.min(chamfer, halfWidth * .45, halfHeight * .45);
	const shape = new Shape();
	shape.moveTo(-halfWidth + cut, -halfHeight);
	shape.lineTo(halfWidth - cut, -halfHeight);
	shape.lineTo(halfWidth, -halfHeight + cut);
	shape.lineTo(halfWidth, halfHeight - cut);
	shape.lineTo(halfWidth - cut, halfHeight);
	shape.lineTo(-halfWidth + cut, halfHeight);
	shape.lineTo(-halfWidth, halfHeight - cut);
	shape.lineTo(-halfWidth, -halfHeight + cut);
	shape.closePath();
	const geometry = new ExtrudeGeometry(shape, {
		depth,
		steps: 1,
		bevelEnabled: false
	});
	geometry.translate(0, 0, -depth * .5);
	geometry.computeVertexNormals();
	return geometry;
}
function roundedBar(kit, name, width, height, depth, material, parent, radius = Math.min(width, height) * .32, outlined = true) {
	const mesh = kit.mesh(name, facetedPanelGeometry(width, height, depth, Math.max(.004, Math.min(radius, width * .35, height * .35))), material, parent, outlined);
	mesh.userData.explodeWithParent = true;
	return mesh;
}
function tag(mesh, part, relief = false) {
	mesh.userData.part = part;
	if (relief) mesh.userData.explodeWithParent = true;
}
function volumetricSteamLobeGeometry(seed) {
	const geometry = new IcosahedronGeometry(.12, 1);
	const positions = geometry.getAttribute("position");
	const vertex = new Vector3();
	for (let index = 0; index < positions.count; index += 1) {
		vertex.fromBufferAttribute(positions, index);
		const irregularity = 1 + Math.sin(index * 2.17 + seed * 1.91) * .12 + Math.cos(index * .83 + seed * 2.71) * .07;
		vertex.multiplyScalar(irregularity);
		positions.setXYZ(index, vertex.x, vertex.y, vertex.z);
	}
	positions.needsUpdate = true;
	geometry.computeVertexNormals();
	return geometry;
}
function volumetricHeatWaveGeometry(seed) {
	const geometry = new TorusGeometry(.24, .032, 6, 28);
	const positions = geometry.getAttribute("position");
	const vertex = new Vector3();
	for (let index = 0; index < positions.count; index += 1) {
		vertex.fromBufferAttribute(positions, index);
		const angle = Math.atan2(vertex.y, vertex.x);
		const radialWarp = 1 + Math.sin(angle * 5 + seed * 1.37) * .038;
		vertex.x *= radialWarp;
		vertex.y *= radialWarp;
		vertex.z += Math.sin(angle * 3 + seed * .73) * .009;
		positions.setXYZ(index, vertex.x, vertex.y, vertex.z);
	}
	positions.needsUpdate = true;
	geometry.computeVertexNormals();
	return geometry;
}
/**
* Three-view procedural reconstruction of the supplied rounded countertop
* microwave. Local frame: +Y up, +Z front, floor at Y=0.
*/
function createMicrowaveModel(options) {
	const kit = new ApplianceModelKit(options);
	const accentLight = shiftedAccent(options.accent, .2, -.1);
	const accentMid = shiftedAccent(options.accent, .07, -.04);
	const accentDark = shiftedAccent(options.accent, -.11, -.03);
	const shellMaterial = kit.material(15854299, { tint: 7563133 });
	const shellHighlightMaterial = kit.material(16446438, { tint: 7892355 });
	const shellShadowMaterial = kit.material(14208702, { tint: 6708336 });
	const accentMaterial = kit.material(accentMid, { tint: 7168118 });
	const accentDarkMaterial = kit.material(accentDark, { tint: 6115944 });
	const cavityMaterial = kit.material(2632243, { tint: 2367788 });
	const meshMaterial = kit.material(4605520, {
		tint: 3157305,
		transparent: true,
		opacity: .016
	});
	const glassMaterial = kit.material(14543334, {
		tint: 5658210,
		transparent: true,
		opacity: .018
	});
	const trayGlassMaterial = kit.material(14475999, {
		tint: 8024450,
		transparent: true,
		opacity: .58
	});
	const rubberMaterial = kit.material(5657437, { tint: 4012357 });
	const metalMaterial = kit.material(9869216, { tint: 5656927 });
	const warmInteriorMaterial = kit.material(9931650, { tint: 7300720 });
	const foodMaterial = kit.material(accentLight, {
		tint: 7956601,
		emissive: accentLight
	});
	const displayMaterial = kit.material(4343379, {
		tint: 2960181,
		emissive: 11131087
	});
	const digitMaterial = kit.material(13628905, {
		tint: 6455684,
		emissive: 11131087
	});
	meshMaterial.depthWrite = false;
	glassMaterial.depthWrite = false;
	trayGlassMaterial.depthWrite = false;
	const cabinet = kit.mesh("microwave-cabinet-shell", facetedPanelGeometry(1.24, 2.06, 1.58, .16), shellMaterial);
	cabinet.position.set(1.16, 1.16, 0);
	tag(cabinet, "cabinet-frame");
	const cabinetTopBridge = kit.mesh("microwave-cabinet-top-bridge", facetedPanelGeometry(2.34, .23, 1.58, .1), shellMaterial);
	cabinetTopBridge.position.set(-.63, 2.075, 0);
	tag(cabinetTopBridge, "cabinet-frame");
	const cabinetBottomBridge = kit.mesh("microwave-cabinet-bottom-bridge", facetedPanelGeometry(2.34, .23, 1.58, .09), shellMaterial);
	cabinetBottomBridge.position.set(-.63, .245, 0);
	tag(cabinetBottomBridge, "cabinet-frame");
	const cabinetLeftWall = kit.mesh("microwave-cabinet-left-side-wall", facetedPanelGeometry(.28, 1.72, 1.58, .09), shellMaterial);
	cabinetLeftWall.position.set(-1.64, 1.16, 0);
	tag(cabinetLeftWall, "cabinet-frame");
	const topHood = kit.mesh("microwave-top-hood", facetedPanelGeometry(3.34, .18, 1.44, .13), shellHighlightMaterial);
	topHood.position.set(-.055, 2.1, -.02);
	tag(topHood, "top-hood");
	const topHoodStep = kit.mesh("microwave-top-hood-pink-step", facetedPanelGeometry(2.62, .075, 1.36, .055), accentMaterial);
	topHoodStep.position.set(-.49, 2.02, .03);
	tag(topHoodStep, "top-hood", true);
	const sideFacetPanel = kit.mesh("microwave-side-facet-panel", facetedPanelGeometry(1.42, 1.74, .035, .14), shellHighlightMaterial);
	sideFacetPanel.rotation.y = Math.PI * .5;
	sideFacetPanel.position.set(1.762, 1.18, -.02);
	tag(sideFacetPanel, "side-shell-system");
	const frontFascia = roundedBar(kit, "microwave-front-fascia", 2.62, .19, .16, accentMaterial, kit.root, .07);
	frontFascia.position.set(-.49, 2.08, .78);
	tag(frontFascia, "door-surround");
	for (const [name, x] of [["left", -1.8], ["right", .82]]) {
		const rail = roundedBar(kit, `microwave-front-fascia-${name}-rail`, .19, 1.84, .16, accentMaterial, kit.root, .07);
		rail.position.set(x, 1.16, .78);
		tag(rail, "door-surround");
	}
	const lowerFascia = roundedBar(kit, "microwave-front-fascia-lower-rail", 2.62, .19, .16, accentMaterial, kit.root, .07);
	lowerFascia.position.set(-.49, .24, .78);
	tag(lowerFascia, "door-surround");
	const lowerRail = kit.mesh("microwave-lower-rail", facetedPanelGeometry(3.35, .17, 1.38, .06), shellShadowMaterial);
	lowerRail.position.set(0, .24, -.02);
	tag(lowerRail, "lower-plinth");
	const doorPivot = kit.pivot("microwave-door-hinge-pivot");
	doorPivot.position.set(-1.66, 0, 0);
	doorPivot.userData.rotationAxis = [
		0,
		1,
		0
	];
	doorPivot.userData.rotationRange = [0, -1.72];
	kit.socket("microwave-door-hinge-socket", doorPivot, [
		0,
		1.18,
		.88
	]);
	const addDoorRails = (prefix, width, height, rail, depth, z, material) => {
		for (const [side, x] of [["left", 1.17 - width * .5 + rail * .5], ["right", 1.17 + width * .5 - rail * .5]]) {
			const vertical = roundedBar(kit, `microwave-${prefix}-${side}-rail`, rail, height, depth, material, doorPivot, Math.min(.11, rail * .42));
			vertical.position.set(x, 1.2, z);
			tag(vertical, prefix.includes("outer") ? "door-outer-frame" : "door-inner-gasket");
		}
		for (const [side, y] of [["top", 1.2 + height * .5 - rail * .5], ["bottom", 1.2 - height * .5 + rail * .5]]) {
			const horizontal = roundedBar(kit, `microwave-${prefix}-${side}-rail`, width, rail, depth, material, doorPivot, Math.min(.11, rail * .42));
			horizontal.position.set(1.17, y, z);
			tag(horizontal, prefix.includes("outer") ? "door-outer-frame" : "door-inner-gasket");
		}
	};
	addDoorRails("door-outer-frame", 2.56, 1.73, .17, .17, .92, accentMaterial);
	addDoorRails("door-inner-frame", 2.36, 1.52, .09, .08, 1.025, cavityMaterial);
	kit.mesh("microwave-interior-back-wall", new RoundedBoxGeometry(2.28, 1.42, .045, 3, .08), warmInteriorMaterial, kit.root, false).position.set(-.49, 1.22, -.49);
	kit.mesh("microwave-interior-floor", new RoundedBoxGeometry(2.24, .045, 1.56, 2, .025), warmInteriorMaterial, kit.root, false).position.set(-.49, .49, .29);
	kit.mesh("microwave-interior-ceiling", new RoundedBoxGeometry(2.24, .04, 1.56, 2, .02), warmInteriorMaterial, kit.root, false).position.set(-.49, 1.95, .29);
	for (const [side, x] of [["left", -1.5], ["right", .52]]) kit.mesh(`microwave-interior-${side}-wall`, new RoundedBoxGeometry(.04, 1.42, 1.56, 2, .018), warmInteriorMaterial, kit.root, false).position.set(x, 1.22, .29);
	const trayPivot = kit.pivot("microwave-tray-rotor-pivot");
	trayPivot.position.set(-.49, .54, .16);
	trayPivot.userData.rotationAxis = [
		0,
		1,
		0
	];
	kit.socket("microwave-tray-rotor-socket", trayPivot, [
		0,
		0,
		0
	]);
	const tray = kit.mesh("microwave-glass-tray", new CylinderGeometry(.68, .68, .04, 28), trayGlassMaterial, trayPivot, false);
	tray.position.y = .018;
	const trayRim = kit.mesh("microwave-glass-tray-rim", new TorusGeometry(.65, .02, 6, 28), trayGlassMaterial, trayPivot, false);
	trayRim.rotation.x = Math.PI * .5;
	trayRim.position.y = .042;
	const foodPivot = kit.pivot("microwave-food-pivot", trayPivot);
	foodPivot.position.y = .068;
	kit.socket("microwave-food-socket", foodPivot, [
		0,
		0,
		0
	]);
	const plate = kit.mesh("microwave-food-plate", new CylinderGeometry(.57, .54, .06, 24), shellHighlightMaterial, foodPivot, false);
	plate.position.y = .012;
	const food = kit.mesh("microwave-food-main-volume", new RoundedBoxGeometry(.82, .3, .56, 3, .11), foodMaterial, foodPivot, false);
	food.position.set(.05, .145, 0);
	food.rotation.y = .28;
	for (const [index, [x, z, scale]] of [
		[
			-.18,
			.06,
			.92
		],
		[
			.03,
			-.1,
			.78
		],
		[
			.22,
			.09,
			.72
		]
	].entries()) {
		const topping = kit.mesh(`microwave-food-topping-${index + 1}`, new DodecahedronGeometry(.115, 0), foodMaterial, foodPivot, false);
		topping.position.set(x, .36, z);
		topping.scale.set(scale * 1.3, scale * .62, scale);
		topping.userData.explodeWithParent = true;
	}
	const meshLayer = kit.pivot("microwave-window-mesh-layer", doorPivot);
	meshLayer.position.set(1.17, 1.2, 1.105);
	for (let row = 0; row < 4; row += 1) {
		const bar = roundedBar(kit, `microwave-window-mesh-horizontal-${row + 1}`, 2.12, .01, .006, meshMaterial, meshLayer, .007, false);
		bar.position.y = -.48 + row * .32;
	}
	for (let column = 0; column < 6; column += 1) {
		const bar = roundedBar(kit, `microwave-window-mesh-vertical-${column + 1}`, .006, 1.16, .012, meshMaterial, meshLayer, .006, false);
		bar.position.x = -.9 + column * .36;
	}
	const doorGlass = kit.mesh("microwave-smoked-door-glass", new RoundedBoxGeometry(2.36, 1.48, .018, 4, .1), glassMaterial, doorPivot, false);
	doorGlass.position.set(1.17, 1.2, 1.13);
	doorGlass.renderOrder = 20;
	glassMaterial.depthTest = true;
	glassMaterial.depthWrite = false;
	glassMaterial.side = 2;
	const interiorLight = new PointLight(16770524, 0, 2.8, 1.4);
	interiorLight.name = "microwave-interior-work-light";
	interiorLight.position.set(-.49, 1.38, .12);
	interiorLight.castShadow = false;
	kit.root.add(interiorLight);
	kit.nodes.set(interiorLight.name, interiorLight);
	const steamRoot = kit.pivot("microwave-volumetric-steam-root");
	steamRoot.position.set(-.49, .93, .78);
	[
		[
			-.25,
			.01,
			-.05
		],
		[
			-.08,
			.04,
			.04
		],
		[
			.13,
			0,
			-.03
		],
		[
			.29,
			.03,
			.02
		],
		[
			-.18,
			.09,
			.07
		],
		[
			.03,
			.12,
			-.08
		],
		[
			.22,
			.1,
			.06
		],
		[
			-.02,
			.18,
			.02
		]
	].forEach(([x, y, z], index) => {
		const puff = kit.pivot(`microwave-steam-puff-${index + 1}`, steamRoot);
		puff.position.set(x, y, z);
		puff.visible = false;
		const material = kit.material(index % 2 === 0 ? 16774119 : 16767429, {
			tint: 14064555,
			emissive: 16758647,
			transparent: true,
			opacity: 0
		});
		for (let lobeIndex = 0; lobeIndex < 3; lobeIndex += 1) {
			const lobe = kit.mesh(`microwave-steam-puff-${index + 1}-lobe-${lobeIndex + 1}`, volumetricSteamLobeGeometry(index * 3 + lobeIndex), material, puff, false);
			lobe.position.set((lobeIndex - 1) * .085, lobeIndex === 1 ? .08 : 0, (lobeIndex % 2 === 0 ? -1 : 1) * .035);
			lobe.scale.set(1 + lobeIndex * .1, .85 + lobeIndex * .16, .9);
			lobe.userData.explodeWithParent = true;
			lobe.userData.performanceProp = "volumetric-low-poly-steam-lobe";
			lobe.userData.forbiddenPrimitives = [
				"PlaneGeometry",
				"Sprite",
				"Line"
			];
		}
	});
	const heatWaveRoot = kit.pivot("microwave-volumetric-heat-wave-root");
	heatWaveRoot.position.set(-.49, 1.02, .96);
	for (let index = 0; index < 4; index += 1) {
		const material = kit.material(index % 2 === 0 ? 16751452 : 16765803, {
			tint: 14044790,
			emissive: 16738885,
			transparent: true,
			opacity: 0
		});
		const wave = kit.mesh(`microwave-heat-energy-wave-${index + 1}`, volumetricHeatWaveGeometry(index), material, heatWaveRoot, false);
		wave.visible = false;
		wave.userData.performanceProp = "thick-irregular-heat-energy-ring";
		wave.userData.forbiddenPrimitives = [
			"PlaneGeometry",
			"Sprite",
			"Line"
		];
	}
	const handlePivot = kit.pivot("microwave-door-handle-pivot", doorPivot);
	handlePivot.position.set(2.36, 1.2, 1.16);
	handlePivot.userData.rotationAxis = [
		1,
		0,
		0
	];
	kit.socket("microwave-door-handle-socket", handlePivot, [
		0,
		0,
		0
	]);
	const handleShadow = roundedBar(kit, "microwave-door-handle-shadow-gap", .23, 1.28, .055, cavityMaterial, handlePivot, .1);
	handleShadow.position.z = -.04;
	const handle = roundedBar(kit, "microwave-door-handle", .17, 1.16, .11, shellHighlightMaterial, handlePivot, .075);
	handle.position.z = .025;
	tag(handle, "door-handle");
	for (const [name, y] of [["upper", .49], ["lower", -.49]]) {
		const mount = roundedBar(kit, `microwave-door-handle-${name}-mount`, .27, .23, .16, accentMaterial, handlePivot, .055);
		mount.position.set(0, y, -.02);
		tag(mount, "door-handle", true);
	}
	const controlPanel = kit.mesh("microwave-control-panel", facetedPanelGeometry(.68, 1.68, .1, .1), accentMaterial);
	controlPanel.position.set(1.25, 1.2, .94);
	tag(controlPanel, "control-assembly");
	kit.socket("microwave-control-panel-socket", controlPanel, [
		0,
		0,
		.07
	]);
	const display = kit.mesh("microwave-control-display", facetedPanelGeometry(.42, .24, .045, .045), displayMaterial);
	display.position.set(1.25, 1.78, 1);
	tag(display, "display-system");
	const displayDigits = kit.pivot("microwave-display-digits-pivot");
	displayDigits.position.set(1.25, 1.78, 1.025);
	for (const [index, x] of [
		-.11,
		-.035,
		.055,
		.13
	].entries()) {
		const digit = roundedBar(kit, `microwave-display-digit-${index + 1}`, .035, .095, .01, digitMaterial, displayDigits, .01);
		digit.position.x = x;
	}
	for (let index = 0; index < 3; index += 1) {
		const indicatorMaterial = kit.material(7235191, {
			tint: 5195864,
			emissive: index === 2 ? 16765803 : 16743544
		});
		const sequenceIndicator = kit.mesh(`microwave-sequence-indicator-${index + 1}`, new CylinderGeometry(.024, .024, .018, 8), indicatorMaterial, kit.root, false);
		sequenceIndicator.rotation.x = Math.PI * .5;
		sequenceIndicator.position.set(1.08 + index * .09, 1.94, 1.015);
		sequenceIndicator.userData.performanceProp = "sequential-work-state-indicator";
	}
	const smallButtonPivot = kit.pivot("microwave-small-button-pivot");
	smallButtonPivot.position.set(1.25, 1.5, 1.01);
	smallButtonPivot.userData.travelAxis = [
		0,
		0,
		1
	];
	kit.socket("microwave-small-button-socket", smallButtonPivot, [
		0,
		0,
		0
	]);
	const smallButton = kit.mesh("microwave-small-round-button", new CylinderGeometry(.075, .075, .055, 16), shellHighlightMaterial, smallButtonPivot);
	smallButton.rotation.x = Math.PI * .5;
	roundedBar(kit, "microwave-small-round-button-index", .015, .054, .012, accentDarkMaterial, smallButtonPivot, .006).position.set(0, .025, .032);
	const dialPivot = kit.pivot("microwave-control-dial-pivot");
	dialPivot.position.set(1.25, 1.14, 1.02);
	dialPivot.userData.rotationAxis = [
		0,
		0,
		1
	];
	dialPivot.userData.rotationRange = [-1.25, 1.25];
	kit.socket("microwave-control-dial-socket", dialPivot, [
		0,
		0,
		0
	]);
	const dialOuter = kit.mesh("microwave-control-dial-outer", new CylinderGeometry(.255, .255, .07, 12), accentDarkMaterial, dialPivot);
	dialOuter.rotation.x = Math.PI * .5;
	const dial = kit.mesh("microwave-control-dial", new CylinderGeometry(.215, .225, .1, 12), shellHighlightMaterial, dialPivot);
	dial.rotation.x = Math.PI * .5;
	dial.position.z = .055;
	roundedBar(kit, "microwave-control-dial-index", .018, .115, .015, accentDarkMaterial, dialPivot, .008).position.set(0, .072, .115);
	for (let index = 0; index < 8; index += 1) {
		const angle = -Math.PI * .78 + index / 7 * Math.PI * 1.56;
		const mark = roundedBar(kit, `microwave-control-dial-tick-${index + 1}`, .012, .035, .012, accentDarkMaterial, kit.root, .005);
		mark.position.set(1.25 + Math.sin(angle) * .295, 1.14 + Math.cos(angle) * .295, 1.015);
		mark.rotation.z = -angle;
	}
	const lowerButtonPivot = kit.pivot("microwave-lower-button-pivot");
	lowerButtonPivot.position.set(1.25, .72, 1);
	lowerButtonPivot.userData.travelAxis = [
		0,
		0,
		1
	];
	kit.socket("microwave-lower-button-socket", lowerButtonPivot, [
		0,
		0,
		0
	]);
	roundedBar(kit, "microwave-lower-button", .42, .23, .055, shellHighlightMaterial, lowerButtonPivot, .055);
	kit.indicator([
		1.48,
		1.48,
		1.035
	], .026);
	const rearPanel = kit.mesh("microwave-rear-service-panel", facetedPanelGeometry(3.03, 1.6, .055, .13), accentMaterial);
	rearPanel.position.set(0, 1.2, -.82);
	tag(rearPanel, "rear-service-panel");
	const ventPanel = kit.mesh("microwave-rear-vent-recess", facetedPanelGeometry(2.14, .86, .035, .1), shellShadowMaterial);
	ventPanel.position.set(.15, 1.45, -.857);
	tag(ventPanel, "rear-service-panel", true);
	for (let row = 0; row < 4; row += 1) for (let column = 0; column < 5; column += 1) roundedBar(kit, `microwave-rear-vent-r${row + 1}-c${column + 1}`, .3, .034, .018, accentDarkMaterial, kit.root, .016, false).position.set(-.61 + column * .37, 1.71 - row * .19, -.883);
	for (const [index, [x, y]] of [
		[-1.43, 1.91],
		[1.43, 1.91],
		[-1.43, .49],
		[1.43, .49]
	].entries()) {
		const screw = kit.mesh(`microwave-rear-fastener-${index + 1}`, new CylinderGeometry(.036, .036, .022, 10), metalMaterial, kit.root, false);
		screw.rotation.x = Math.PI * .5;
		screw.position.set(x, y, -.858);
	}
	kit.mesh("microwave-rear-power-inlet-plate", facetedPanelGeometry(.48, .3, .035, .055), accentMaterial).position.set(.9, .61, -.86);
	const inlet = kit.mesh("microwave-rear-power-inlet", facetedPanelGeometry(.29, .17, .045, .035), cavityMaterial);
	inlet.position.set(.9, .61, -.89);
	kit.socket("microwave-rear-power-socket", inlet, [
		0,
		0,
		-.04
	]);
	for (const x of [.84, .96]) {
		const pin = kit.mesh(`microwave-rear-power-contact-${x < .9 ? "left" : "right"}`, new CylinderGeometry(.018, .018, .024, 8), metalMaterial, kit.root, false);
		pin.rotation.x = Math.PI * .5;
		pin.position.set(x, .61, -.924);
	}
	for (const x of [-1.38, 1.38]) for (const z of [-.55, .55]) {
		const foot = kit.mesh(`microwave-foot-${x < 0 ? "left" : "right"}-${z < 0 ? "rear" : "front"}`, facetedPanelGeometry(.38, .18, .38, .055), rubberMaterial, kit.root, true);
		foot.position.set(x, .09, z);
		tag(foot, "foot-system");
	}
	kit.socket("microwave-left-connection-socket", kit.root, [
		-1.93,
		1.095,
		1.275
	]);
	kit.socket("microwave-right-connection-socket", kit.root, [
		1.815,
		1.095,
		1.275
	]);
	kit.socket("microwave-top-connection-socket", kit.root, [
		-.0575,
		2.225,
		1.275
	]);
	kit.socket("microwave-bottom-connection-socket", kit.root, [
		-.0575,
		-.035,
		1.275
	]);
	applyMicrowaveOutlineHierarchy(kit.root);
	const build = kit.finish({
		referencePath: options.referencePath ?? V2_REFERENCE_PATH,
		reconstructed: [
			"wide low clipped-corner cabinet with a stepped cream hood, pink plinth, broad right side facet and four faceted feet",
			"left-hinged three-depth door with pink outer frame, dark gasket, smoked glass, restrained safety mesh and thick mounted ivory handle",
			"faceted right control tower with mint display, small indexed button, oversized twelve-sided dial and lower clipped button",
			"stepped rear service cassette with four-by-five vent field, four corner fasteners and frozen recessed power inlet",
			"bright fixed-depth interior cavity with enlarged horizontal glass turntable, plate and readable food volume behind the clear door window",
			"model-owned irregular low-poly steam lobes and thick torus heat-energy waves staged inside the cavity",
			"independent door hinge, Y-axis tray rotor, controls, rear inlet and four frozen scene-edge cable sockets",
			"stable main, structure and detail outline tiers with object-space plus/minus eighteen percent variation"
		],
		inferred: [
			"interior cavity depth, glass tray support, plate and food silhouette are inferred because the door is closed in every source view",
			"door gasket cross-section and hinge barrel interior are inferred from typical domestic microwave construction",
			"underside service seams, magnetron, waveguide, wiring and electronics are not visible and intentionally omitted",
			"rear power inlet preserves the reference hierarchy but does not assert a specific electrical standard"
		]
	});
	build.root.userData.microwavePerformanceRig = {
		timelineOwner: "AppliancePerformanceSystem",
		effectOwner: "microwave-model-rig",
		wholeMachineNode: build.root.name,
		rotatingAssembly: "microwave-tray-rotor-pivot",
		foodNode: "microwave-food-pivot",
		steamRoot: "microwave-volumetric-steam-root",
		heatWaveRoot: "microwave-volumetric-heat-wave-root",
		indicatorNodes: [
			"microwave-sequence-indicator-1",
			"microwave-sequence-indicator-2",
			"microwave-sequence-indicator-3"
		],
		volumetricForms: ["irregular icosahedral steam clusters", "thick irregular torus heat-energy rings"],
		forbiddenPrimitives: [
			"PlaneGeometry",
			"Sprite",
			"Line"
		]
	};
	build.root.userData.previewLightingProfile = "sakura-appliance-v2";
	build.root.userData.previewFramingScale = .91;
	build.root.userData.legacyReferencePath = REFERENCE_PATH;
	build.root.userData.referenceDimensions = {
		archivedBounds: {
			min: [
				-1.895,
				0,
				-.936
			],
			max: [
				1.78,
				2.19,
				1.24
			]
		},
		doorHinge: [
			-1.66,
			0,
			0
		],
		trayRotor: [
			-.49,
			.54,
			.16
		],
		dialPivot: [
			1.25,
			1.14,
			1.02
		]
	};
	build.root.userData.sculptRuntime.colliders = [
		{
			id: "microwave-cabinet",
			type: "box",
			node: "microwave-cabinet-shell"
		},
		{
			id: "microwave-door",
			type: "box",
			node: "microwave-door-hinge-pivot",
			trigger: true
		},
		{
			id: "microwave-tray",
			type: "cylinder",
			node: "microwave-tray-rotor-pivot",
			trigger: true
		}
	];
	build.root.userData.sculptRuntime.destructionGroups = [
		[
			"microwave-cabinet-shell",
			"microwave-front-fascia",
			"microwave-lower-rail"
		],
		["microwave-door-hinge-pivot", "microwave-door-handle-pivot"],
		["microwave-tray-rotor-pivot", "microwave-food-pivot"],
		["microwave-control-panel", "microwave-control-dial-pivot"]
	];
	return build;
}
//#endregion
export { microwave_exports as n, createMicrowaveModel as t };

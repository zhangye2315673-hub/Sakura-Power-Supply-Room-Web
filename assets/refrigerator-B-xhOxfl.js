import { t as __exportAll } from "./rolldown-runtime-D7D4PA-g.js";
import { G as IcosahedronGeometry, Hn as SphereGeometry, I as ExtrudeGeometry, Ln as Shape, S as CylinderGeometry, Xn as TorusGeometry, h as ConeGeometry, ht as Mesh, i as BoxGeometry, p as Color } from "./three.core-DlTOC7bx.js";
import { i as RoundedBoxGeometry } from "./BufferGeometryUtils-CSuwXBGj.js";
import { a as setHullOutlineStyle, d as ApplianceModelKit } from "./outline-DAm9XhPL.js";
//#region src/appliances/models/refrigerator.ts
var refrigerator_exports = /* @__PURE__ */ __exportAll({ createRefrigeratorModel: () => createRefrigeratorModel });
var REFERENCE_PATH = "D:/下载文件/ChatGPT Image 2026年8月2日 19_55_19 (7).png";
var V2_REFERENCE_PATH = "references/intake-v2/refrigerator/views/front.png";
var ACTIVE_DURATION = 5.2;
function stableOutlinePhase(name) {
	let hash = 2166136261;
	for (let index = 0; index < name.length; index += 1) {
		hash ^= name.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return (hash >>> 0) % 1e4 * (Math.PI * 2 / 1e4);
}
function applyRefrigeratorOutlineHierarchy(root) {
	const mainSilhouette = /cabinet-(?:side|top|bottom)|rear-inset-shell|upper-door$|lower-door$|base-plinth|stepped-crown/;
	const fineDetail = /rear-(?:vent|fastener|cable-port)|door-hinge-cap|cold-light|interior|shelf|drawer-inset|prop-|foot-/;
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
	return new ExtrudeGeometry(shape, {
		depth,
		steps: 1,
		bevelEnabled: false
	}).translate(0, 0, -depth * .5);
}
function shiftedAccent(accent, lightness, saturation = 0) {
	return new Color(accent).offsetHSL(0, saturation, lightness).getHex();
}
function roundedBar(kit, name, width, height, depth, radius, material, parent, outlined = true) {
	const mesh = kit.mesh(name, new RoundedBoxGeometry(width, height, depth, 1, radius), material, parent, outlined);
	mesh.userData.explodeWithParent = true;
	return mesh;
}
/**
* Programmatic reconstruction of the supplied three-view retro refrigerator.
*
* Local frame: +Y up, +Z front, floor at Y=0. Upper and lower doors are
* children of separate right-edge hinge pivots. The rear service assembly is
* isolated so compressor vibration never perturbs drag/drop transforms.
*/
function createRefrigeratorModel(options) {
	const kit = new ApplianceModelKit(options);
	const accentLight = shiftedAccent(options.accent, .19, -.12);
	const accentMid = shiftedAccent(options.accent, .06, -.05);
	const accentDark = shiftedAccent(options.accent, -.1, -.02);
	const shellMaterial = kit.material(15657180, { tint: 7432062 });
	const shellHighlightMaterial = kit.material(16314854, { tint: 7760769 });
	const shellShadowMaterial = kit.material(14077894, { tint: 6708337 });
	const accentMaterial = kit.material(accentMid, { tint: 6839667 });
	const accentLightMaterial = kit.material(accentLight, { tint: 7628668 });
	const accentDarkMaterial = kit.material(accentDark, { tint: 6181480 });
	const mintAccentMaterial = kit.material(11129803, { tint: 6716546 });
	const gasketMaterial = kit.material(6907506, { tint: 4933206 });
	const rubberMaterial = kit.material(5986659, { tint: 4209737 });
	const metalMaterial = kit.material(11184045, { tint: 6380137 });
	const coldLightMaterial = kit.material(accentLight, {
		tint: 7432062,
		emissive: accentLight,
		transparent: true,
		opacity: .62
	});
	const interiorMaterial = kit.material(14477543, {
		tint: 7175046,
		emissive: accentLight
	});
	interiorMaterial.emissiveIntensity = .04;
	const interiorShadowMaterial = kit.material(10401979, {
		tint: 6253947,
		emissive: accentLight
	});
	interiorShadowMaterial.emissiveIntensity = .025;
	const shelfMaterial = kit.material(15397873, {
		tint: 7438476,
		transparent: true,
		opacity: .78
	});
	shelfMaterial.depthWrite = false;
	const cartonMaterial = kit.material(15985368, { tint: 9138561 });
	const cartonAccentMaterial = kit.material(15247032, { tint: 7756142 });
	const fishMaterial = kit.material(9422024, { tint: 5467002 });
	const fishBellyMaterial = kit.material(14216687, { tint: 7831949 });
	const steakMaterial = kit.material(13131634, { tint: 7685719 });
	const steakFatMaterial = kit.material(15845300, { tint: 8874611 });
	const storageMaterial = kit.material(12442585, {
		tint: accentMid,
		transparent: true,
		opacity: .72
	});
	storageMaterial.depthWrite = false;
	const storageLidMaterial = kit.material(15837118, { tint: 7953779 });
	const fruitRedMaterial = kit.material(14248056, { tint: 7883095 });
	const fruitWarmMaterial = kit.material(15114335, { tint: 8084071 });
	const vegetableMaterial = kit.material(7973240, { tint: 5401958 });
	const vegetableLightMaterial = kit.material(11522445, { tint: 6584164 });
	const drinkMaterial = kit.material(15774575, {
		tint: 8085872,
		transparent: true,
		opacity: .84
	});
	drinkMaterial.depthWrite = false;
	const labelMaterial = kit.material(16180206, { tint: accentMid });
	const darkFoodMaterial = kit.material(7166056, { tint: 4209225 });
	const cabinetFrame = kit.pivot("refrigerator-cabinet-frame");
	roundedBar(kit, "refrigerator-rear-inset-shell", 2.6, 4.58, .18, .15, shellShadowMaterial, cabinetFrame, false).position.set(0, 2.61, -.93);
	for (const [side, x] of [["left", -1.3], ["right", 1.3]]) roundedBar(kit, `refrigerator-cabinet-side-${side}`, .24, 4.7, 1.82, .11, shellMaterial, cabinetFrame).position.set(x, 2.62, -.01);
	for (const [name, y, height] of [
		[
			"top",
			4.98,
			.22
		],
		[
			"freezer-divider",
			3.28,
			.2
		],
		[
			"bottom",
			.35,
			.22
		]
	]) roundedBar(kit, `refrigerator-cabinet-${name}`, 2.44, height, 1.82, .09, name === "freezer-divider" ? shellShadowMaterial : shellMaterial, cabinetFrame, false).position.set(0, y, -.01);
	kit.mesh("refrigerator-base-plinth", new RoundedBoxGeometry(2.72, .22, 1.82, 1, .07), accentMaterial).position.set(0, .26, -.01);
	roundedBar(kit, "refrigerator-stepped-crown", 2.68, .16, 1.82, .06, shellHighlightMaterial, kit.root).position.set(0, 5.035, -.01);
	roundedBar(kit, "refrigerator-crown-accent-rail", 2.55, .055, 1.8, .02, accentLightMaterial, kit.root, false).position.set(0, 4.935, -.005);
	for (const [side, x] of [["left", -1.405], ["right", 1.405]]) {
		const sideFacet = kit.mesh(`refrigerator-side-facet-${side}`, new BoxGeometry(.025, 4.38, 1.52), shellShadowMaterial, cabinetFrame, false);
		sideFacet.position.set(x, 2.68, -.08);
		sideFacet.userData.explodeWithParent = true;
	}
	function addGasketFrame(prefix, centerY, height) {
		for (const [edge, y] of [["top", centerY + height * .5], ["bottom", centerY - height * .5]]) roundedBar(kit, `${prefix}-${edge}`, 2.58, .09, .08, .035, gasketMaterial, kit.root, false).position.set(0, y, .99);
		for (const [edge, x] of [["left", -1.245], ["right", 1.245]]) roundedBar(kit, `${prefix}-${edge}`, .09, height - .12, .08, .035, gasketMaterial, kit.root, false).position.set(x, centerY, .99);
	}
	addGasketFrame("refrigerator-upper-door-gasket", 4.31, 1.58);
	addGasketFrame("refrigerator-lower-door-gasket", 2, 2.9);
	const upperInteriorContent = kit.pivot("refrigerator-upper-interior-content");
	const lowerInteriorContent = kit.pivot("refrigerator-lower-interior-content");
	upperInteriorContent.visible = false;
	lowerInteriorContent.visible = false;
	function addCavity(prefix, parent, centerY, height) {
		roundedBar(kit, `${prefix}-back-panel`, 2.3, height, .12, .07, interiorShadowMaterial, parent).position.set(0, centerY, -.77);
		for (const [side, x] of [["left", -1.13], ["right", 1.13]]) roundedBar(kit, `${prefix}-${side}-wall`, .1, height, 1.44, .035, interiorMaterial, parent).position.set(x, centerY, -.03);
		for (const [surface, y] of [["ceiling", centerY + height * .5], ["floor", centerY - height * .5]]) roundedBar(kit, `${prefix}-${surface}`, 2.26, .09, 1.45, .035, interiorMaterial, parent).position.set(0, y, -.03);
	}
	addCavity("refrigerator-freezer-cavity", upperInteriorContent, 4.29, 1.31);
	addCavity("refrigerator-main-cavity", lowerInteriorContent, 1.95, 2.67);
	const interiorLights = [];
	for (const [index, [y, width]] of [[4.79, 1.72], [3.08, 1.82]].entries()) {
		const lightBar = roundedBar(kit, `refrigerator-interior-light-${index + 1}`, width, .075, .035, .025, coldLightMaterial, index === 0 ? upperInteriorContent : lowerInteriorContent, false);
		lightBar.position.set(0, y, -.69);
		interiorLights.push(lightBar);
	}
	for (const [index, y] of [
		4.02,
		2.43,
		1.63
	].entries()) {
		const shelf = roundedBar(kit, `refrigerator-interior-shelf-${index + 1}`, 2.12, .075, 1.32, .025, shelfMaterial, index === 0 ? upperInteriorContent : lowerInteriorContent, false);
		shelf.position.set(0, y, -.03);
		shelf.renderOrder = 3;
		roundedBar(kit, `refrigerator-interior-shelf-${index + 1}-front-lip`, 2.1, .09, .06, .018, interiorShadowMaterial, index === 0 ? upperInteriorContent : lowerInteriorContent, false).position.set(0, y + .02, .65);
	}
	roundedBar(kit, "refrigerator-produce-drawer", 1.98, .54, 1.2, .08, interiorMaterial, lowerInteriorContent).position.set(0, .86, -.02);
	roundedBar(kit, "refrigerator-produce-drawer-inset", 1.62, .24, .055, .06, shelfMaterial, lowerInteriorContent, false).position.set(0, .93, .595);
	const upperDoorPivot = kit.pivot("refrigerator-upper-door-pivot");
	upperDoorPivot.position.set(1.38, 4.31, 1.02);
	upperDoorPivot.userData.rotationAxis = [
		0,
		1,
		0
	];
	upperDoorPivot.userData.rotationRange = [0, 1.14];
	kit.socket("refrigerator-upper-door-socket", upperDoorPivot, [
		0,
		0,
		0
	]);
	roundedBar(kit, "refrigerator-upper-door", 2.73, 1.59, .22, .21, shellHighlightMaterial, upperDoorPivot).position.set(-1.365, 0, .1);
	const upperDoorFace = kit.mesh("refrigerator-upper-door-face-border", facetedPanelGeometry(2.53, 1.4, .055, .14), shellMaterial, upperDoorPivot);
	upperDoorFace.position.set(-1.365, 0, .235);
	upperDoorFace.userData.explodeWithParent = true;
	const lowerDoorPivot = kit.pivot("refrigerator-lower-door-pivot");
	lowerDoorPivot.position.set(1.38, 2, 1.02);
	lowerDoorPivot.userData.rotationAxis = [
		0,
		1,
		0
	];
	lowerDoorPivot.userData.rotationRange = [0, .96];
	kit.socket("refrigerator-lower-door-socket", lowerDoorPivot, [
		0,
		0,
		0
	]);
	roundedBar(kit, "refrigerator-lower-door", 2.73, 2.91, .22, .22, shellHighlightMaterial, lowerDoorPivot).position.set(-1.365, 0, .1);
	const lowerDoorFace = kit.mesh("refrigerator-lower-door-face-border", facetedPanelGeometry(2.53, 2.7, .055, .15), shellMaterial, lowerDoorPivot);
	lowerDoorFace.position.set(-1.365, 0, .235);
	lowerDoorFace.userData.explodeWithParent = true;
	function addDoorInterior(pivot, prefix, height, binYs) {
		roundedBar(kit, `${prefix}-inner-liner`, 2.42, height, .08, .13, interiorMaterial, pivot, false).position.set(-1.365, 0, -.055);
		binYs.forEach((y, index) => {
			roundedBar(kit, `${prefix}-door-bin-${index + 1}-base`, 1.94, .09, .48, .025, shelfMaterial, pivot, false).position.set(-1.365, y, -.29);
			roundedBar(kit, `${prefix}-door-bin-${index + 1}-front-rail`, 1.94, .23, .06, .025, interiorShadowMaterial, pivot, false).position.set(-1.365, y + .11, -.53);
		});
	}
	addDoorInterior(upperDoorPivot, "refrigerator-upper", 1.35, [-.38]);
	addDoorInterior(lowerDoorPivot, "refrigerator-lower", 2.64, [
		-.88,
		.05,
		.92
	]);
	const foodPerformanceRoot = kit.pivot("refrigerator-food-performance-root");
	foodPerformanceRoot.visible = false;
	function foodPivot(id, category, homeZone, home, launchIndex, routeSide, doorHome) {
		const pivot = kit.pivot(`refrigerator-prop-${id}-pivot`, foodPerformanceRoot);
		pivot.position.set(home[0], home[1], home[2]);
		pivot.userData.refrigeratorProp = {
			id,
			category,
			homeZone,
			homePosition: [...home],
			homeSocket: `refrigerator-home-${id}-socket`,
			launchIndex,
			routeSide,
			...doorHome ? {
				doorPivotName: doorHome.pivot,
				doorLocalHome: [...doorHome.local]
			} : {}
		};
		const socketParent = doorHome ? doorHome.pivot === "refrigerator-upper-door-pivot" ? upperDoorPivot : lowerDoorPivot : kit.root;
		kit.socket(`refrigerator-home-${id}-socket`, socketParent, doorHome?.local ?? home);
		return pivot;
	}
	const milk = foodPivot("milk-carton", "milk", "main-upper-shelf", [
		-.72,
		2.79,
		.08
	], 0, -1);
	const milkProfile = new Shape();
	milkProfile.moveTo(-.22, -.36);
	milkProfile.lineTo(.22, -.36);
	milkProfile.lineTo(.22, .18);
	milkProfile.lineTo(.08, .38);
	milkProfile.lineTo(-.08, .38);
	milkProfile.lineTo(-.22, .18);
	milkProfile.closePath();
	const milkBody = kit.mesh("refrigerator-prop-milk-carton-body", new ExtrudeGeometry(milkProfile, {
		depth: .32,
		steps: 1,
		bevelEnabled: true,
		bevelSize: .025,
		bevelThickness: .025,
		bevelSegments: 2
	}).translate(0, 0, -.16), cartonMaterial, milk, false);
	milkBody.userData.explodeWithParent = true;
	roundedBar(kit, "refrigerator-prop-milk-carton-band", .36, .13, .025, .025, cartonAccentMaterial, milk, false).position.set(0, -.04, .18);
	const milkCap = kit.mesh("refrigerator-prop-milk-carton-cap", new CylinderGeometry(.055, .065, .055, 12), accentDarkMaterial, milk, false);
	milkCap.rotation.x = Math.PI * .5;
	milkCap.position.set(.1, .28, .18);
	const fish = foodPivot("fish", "fish", "freezer-left-shelf", [
		-.48,
		4.35,
		.08
	], 1, 1);
	const fishBody = kit.mesh("refrigerator-prop-fish-body", new SphereGeometry(.26, 14, 9).scale(1.25, .58, .48), fishMaterial, fish, false);
	fishBody.userData.explodeWithParent = true;
	kit.mesh("refrigerator-prop-fish-belly", new SphereGeometry(.205, 12, 8).scale(1.22, .36, .51), fishBellyMaterial, fish, false).position.set(.02, -.08, .02);
	const fishTail = kit.mesh("refrigerator-prop-fish-tail", new ConeGeometry(.18, .28, 3), fishMaterial, fish, false);
	fishTail.rotation.z = -Math.PI * .5;
	fishTail.position.x = -.42;
	kit.mesh("refrigerator-prop-fish-eye", new SphereGeometry(.035, 8, 6), darkFoodMaterial, fish, false).position.set(.2, .06, .12);
	const steak = foodPivot("steak", "steak", "freezer-right-shelf", [
		.55,
		4.35,
		.08
	], 2, -1);
	const steakShape = new Shape();
	steakShape.moveTo(-.29, -.14);
	steakShape.bezierCurveTo(-.34, .08, -.15, .25, .08, .23);
	steakShape.bezierCurveTo(.34, .2, .39, -.04, .22, -.18);
	steakShape.bezierCurveTo(.05, -.3, -.2, -.27, -.29, -.14);
	steakShape.closePath();
	const steakBody = kit.mesh("refrigerator-prop-steak-body", new ExtrudeGeometry(steakShape, {
		depth: .15,
		bevelEnabled: true,
		bevelSize: .025,
		bevelThickness: .025,
		bevelSegments: 2
	}).translate(0, 0, -.075), steakMaterial, steak, false);
	steakBody.userData.explodeWithParent = true;
	const fatShape = steakShape.clone();
	const steakFat = kit.mesh("refrigerator-prop-steak-fat-cap", new ExtrudeGeometry(fatShape, {
		depth: .025,
		bevelEnabled: true,
		bevelSize: .012,
		bevelThickness: .012,
		bevelSegments: 2
	}).scale(.82, .7, 1).translate(.01, 0, .095), steakFatMaterial, steak, false);
	steakFat.userData.explodeWithParent = true;
	const storage = foodPivot("storage-box", "food-container", "main-middle-shelf", [
		.56,
		1.92,
		.03
	], 3, 1);
	const storageBody = roundedBar(kit, "refrigerator-prop-storage-box-body", .66, .36, .5, .07, storageMaterial, storage, false);
	storageBody.userData.explodeWithParent = true;
	const storageLid = roundedBar(kit, "refrigerator-prop-storage-box-lid", .72, .09, .54, .045, storageLidMaterial, storage, false);
	storageLid.position.y = .22;
	for (const [index, [x, z]] of [
		[-.16, -.08],
		[.12, .08],
		[.02, -.14]
	].entries()) kit.mesh(`refrigerator-prop-storage-box-content-${index + 1}`, new IcosahedronGeometry(.1, 1), index === 1 ? vegetableMaterial : fruitWarmMaterial, storage, false).position.set(x, .02, z);
	const fruit = foodPivot("fruit-basket", "fruit", "main-lower-shelf", [
		-.5,
		1.88,
		.05
	], 4, -1);
	const fruitSpecs = [
		[
			-.16,
			.02,
			fruitRedMaterial
		],
		[
			.13,
			0,
			fruitWarmMaterial
		],
		[
			0,
			.22,
			fruitRedMaterial
		]
	];
	for (const [index, [x, y, color]] of fruitSpecs.entries()) {
		const piece = kit.mesh(`refrigerator-prop-fruit-${index + 1}`, new IcosahedronGeometry(.18, 2), color, fruit, false);
		piece.position.set(x, y, (index - 1) * .04);
		piece.scale.set(1, .92, 1);
		kit.mesh(`refrigerator-prop-fruit-${index + 1}-stem`, new CylinderGeometry(.018, .025, .11, 7), darkFoodMaterial, fruit, false).position.set(x, y + .2, (index - 1) * .04);
	}
	const vegetables = foodPivot("vegetables", "vegetables", "produce-drawer", [
		.05,
		.96,
		.05
	], 5, 1);
	const carrot = kit.mesh("refrigerator-prop-vegetables-carrot", new ConeGeometry(.13, .5, 10), fruitWarmMaterial, vegetables, false);
	carrot.rotation.z = -.5;
	carrot.position.set(-.16, -.02, 0);
	for (const [index, angle] of [
		-.55,
		0,
		.55
	].entries()) {
		const leaf = kit.mesh(`refrigerator-prop-vegetables-leaf-${index + 1}`, new ConeGeometry(.075, .28, 7), vegetableLightMaterial, vegetables, false);
		leaf.rotation.z = angle;
		leaf.position.set(.05 + angle * .1, .28, 0);
	}
	kit.mesh("refrigerator-prop-vegetables-broccoli-stem", new CylinderGeometry(.07, .1, .3, 8), vegetableLightMaterial, vegetables, false).position.set(.24, 0, .02);
	for (const [index, [x, y, z]] of [
		[
			.16,
			.2,
			0
		],
		[
			.28,
			.22,
			.04
		],
		[
			.24,
			.28,
			-.05
		]
	].entries()) kit.mesh(`refrigerator-prop-vegetables-broccoli-floret-${index + 1}`, new IcosahedronGeometry(.13, 1), vegetableMaterial, vegetables, false).position.set(x, y, z);
	const drink = foodPivot("drink-bottle", "drink", "lower-door-bin", [
		.02,
		1.5,
		.6
	], 6, -1, {
		pivot: "refrigerator-lower-door-pivot",
		local: [
			-1.365,
			-.5,
			-.44
		]
	});
	const drinkBody = kit.mesh("refrigerator-prop-drink-bottle-body", new CylinderGeometry(.14, .16, .58, 12), drinkMaterial, drink, false);
	drinkBody.position.y = .02;
	const drinkShoulder = kit.mesh("refrigerator-prop-drink-bottle-shoulder", new CylinderGeometry(.08, .14, .16, 12), drinkMaterial, drink, false);
	drinkShoulder.position.y = .39;
	const drinkCap = kit.mesh("refrigerator-prop-drink-bottle-cap", new CylinderGeometry(.075, .075, .09, 12), accentDarkMaterial, drink, false);
	drinkCap.position.y = .52;
	roundedBar(kit, "refrigerator-prop-drink-bottle-label", .21, .2, .025, .045, labelMaterial, drink, false).position.set(0, .02, .155);
	function addHandle(parent, prefix, x, height) {
		const handlePivot = kit.pivot(`${prefix}-pivot`, parent);
		handlePivot.position.set(x, 0, .285);
		handlePivot.userData.travelAxis = [
			0,
			0,
			1
		];
		kit.socket(`${prefix}-socket`, handlePivot, [
			0,
			0,
			0
		]);
		const grip = kit.mesh(`${prefix}-grip`, new CylinderGeometry(.075, .075, height, 8), accentLightMaterial, handlePivot);
		grip.scale.set(1.4, 1, .86);
		grip.position.z = .075;
		grip.userData.explodeWithParent = true;
		const channel = roundedBar(kit, `${prefix}-shadow-channel`, .16, height + .09, .025, .035, accentDarkMaterial, handlePivot, false);
		channel.position.z = -.045;
		const mintInsert = roundedBar(kit, `${prefix}-mint-insert`, .055, height * .68, .012, .018, mintAccentMaterial, handlePivot, false);
		mintInsert.position.z = .132;
		for (const [index, y] of [-height * .4, height * .4].entries()) roundedBar(kit, `${prefix}-standoff-${index + 1}`, .28, .18, .23, .055, accentMaterial, handlePivot).position.set(0, y, -.01);
		return handlePivot;
	}
	addHandle(upperDoorPivot, "refrigerator-upper-handle", -2.15, .62);
	addHandle(lowerDoorPivot, "refrigerator-lower-handle", -2.15, 1.16);
	roundedBar(kit, "refrigerator-door-seam", 2.66, .09, .105, .035, accentDarkMaterial, kit.root, false).position.set(0, 3.27, 1.125);
	roundedBar(kit, "refrigerator-door-seam-cold-light", 2.47, .026, .018, .01, coldLightMaterial, kit.root, false).position.set(0, 3.27, 1.185);
	for (const [index, y] of [
		4.84,
		3.75,
		2.82,
		.74
	].entries()) {
		const hingeCap = kit.mesh(`refrigerator-door-hinge-cap-${index + 1}`, new RoundedBoxGeometry(.13, .18, .16, 1, .035), accentMaterial, kit.root);
		hingeCap.position.set(1.39, y, 1.08);
		hingeCap.userData.explodeWithParent = true;
	}
	const compressorPivot = kit.pivot("refrigerator-compressor-pivot");
	const servicePanel = kit.mesh("refrigerator-rear-service-panel", facetedPanelGeometry(2.3, .76, .07, .1), accentLightMaterial, compressorPivot, false);
	servicePanel.position.set(0, .79, -1.13);
	servicePanel.userData.explodeWithParent = true;
	kit.socket("refrigerator-rear-service-socket", servicePanel, [
		0,
		0,
		-.055
	]);
	for (let row = 0; row < 5; row += 1) roundedBar(kit, `refrigerator-rear-vent-${row + 1}`, 1.28, .035, .02, .014, accentDarkMaterial, compressorPivot, false).position.set(0, .94 - row * .115, -1.174);
	for (const [index, [x, y]] of [
		[-.98, 1.04],
		[.98, 1.04],
		[-.98, .54],
		[.98, .54]
	].entries()) {
		const fastener = kit.mesh(`refrigerator-rear-fastener-${index + 1}`, new CylinderGeometry(.035, .035, .025, 10), metalMaterial, compressorPivot, false);
		fastener.rotation.x = Math.PI * .5;
		fastener.position.set(x, y, -1.177);
		fastener.userData.explodeWithParent = true;
	}
	const rearCablePort = kit.mesh("refrigerator-rear-cable-port", new TorusGeometry(.095, .03, 8, 18), gasketMaterial, compressorPivot, false);
	rearCablePort.position.set(.92, .4, -1.12);
	kit.socket("refrigerator-power-entry-socket", rearCablePort, [
		0,
		0,
		-.04
	]);
	for (const [x, z, side] of [
		[
			-1.08,
			-.68,
			"rear-left"
		],
		[
			1.08,
			-.68,
			"rear-right"
		],
		[
			-1.08,
			.68,
			"front-left"
		],
		[
			1.08,
			.68,
			"front-right"
		]
	]) kit.mesh(`refrigerator-foot-${side}`, new RoundedBoxGeometry(.38, .2, .38, 2, .07), rubberMaterial, kit.root, false).position.set(x, .1, z);
	kit.socket("refrigerator-freezer-exit-socket", kit.root, [
		0,
		4.32,
		1.42
	]);
	kit.socket("refrigerator-main-exit-socket", kit.root, [
		0,
		2.2,
		1.42
	]);
	kit.socket("refrigerator-party-left-front-waypoint", kit.root, [
		-1.92,
		2.8,
		1.42
	]);
	kit.socket("refrigerator-party-left-rear-waypoint", kit.root, [
		-1.92,
		2.8,
		-1.42
	]);
	kit.socket("refrigerator-party-right-front-waypoint", kit.root, [
		1.92,
		2.8,
		1.42
	]);
	kit.socket("refrigerator-party-right-rear-waypoint", kit.root, [
		1.92,
		2.8,
		-1.42
	]);
	kit.socket("refrigerator-left-connection-socket", kit.root, [
		-1.455,
		2.5725,
		1.485
	]);
	kit.socket("refrigerator-right-connection-socket", kit.root, [
		1.5,
		2.5725,
		1.485
	]);
	kit.socket("refrigerator-top-connection-socket", kit.root, [
		.0225,
		5.18,
		1.485
	]);
	kit.socket("refrigerator-bottom-connection-socket", kit.root, [
		.0225,
		-.035,
		1.485
	]);
	kit.indicator([
		-.98,
		3.19,
		1.2
	], .038);
	applyRefrigeratorOutlineHierarchy(kit.root);
	const build = kit.finish({
		referencePath: options.referencePath ?? V2_REFERENCE_PATH,
		reconstructed: [
			"narrow tall faceted double-door cabinet with a stepped crown, Sakura-pink plinth and reference-matched freezer-to-main-door proportion",
			"separate upper and lower door shells with clipped-corner face planes, perimeter gaskets and a mint-lit recessed separation band",
			"two unequal left-biased octagonal handles with enlarged pink standoffs, dark channels and muted mint inserts",
			"real side depth with broad low-poly planes, subtle side-wall facets, rear inset shell and four low feet",
			"pink clipped-corner rear service cover with five horizontal vents, four fasteners and frozen cable entry",
			"true open freezer and refrigerator cavities assembled from back, side, ceiling and floor panels",
			"three full-depth shelves, a volumetric produce drawer and four door-side storage bins",
			"named layered milk, fish, steak, container, fruit, vegetable and drink props at semantic home sockets",
			"independent hinge pivots, handle sockets, food home sockets, collision-clear party waypoints and four frozen scene-edge cable sockets",
			"stable main, structure and detail outline tiers with object-space plus/minus eighteen percent variation"
		],
		inferred: [
			"right-edge hinge mechanism and exact hinge-cap count are inferred from the left-biased handles",
			"exact shelf spacing and food selection combine the supplied exterior reference with the cited real LG interior reference",
			"door interiors and storage-bin dimensions are stylized low-poly approximations of real refrigerator organization",
			"compressor, refrigerant tubing and internal fan are concealed; only service-cover vibration is represented",
			"rear cable entry depth, underside structure and leveling-foot mechanics are simplified inference"
		]
	});
	build.root.userData.sculptRuntime.colliders = [
		{
			id: "refrigerator-left-wall",
			type: "box",
			node: "refrigerator-cabinet-side-left",
			halfExtents: [
				.12,
				2.35,
				.91
			]
		},
		{
			id: "refrigerator-right-wall",
			type: "box",
			node: "refrigerator-cabinet-side-right",
			halfExtents: [
				.12,
				2.35,
				.91
			]
		},
		{
			id: "refrigerator-rear-wall",
			type: "box",
			node: "refrigerator-rear-inset-shell",
			halfExtents: [
				1.3,
				2.29,
				.09
			]
		},
		{
			id: "refrigerator-freezer-opening",
			type: "box-trigger",
			node: "refrigerator-freezer-exit-socket",
			halfExtents: [
				1.08,
				.61,
				.42
			]
		},
		{
			id: "refrigerator-main-opening",
			type: "box-trigger",
			node: "refrigerator-main-exit-socket",
			halfExtents: [
				1.08,
				1.25,
				.42
			]
		}
	];
	build.root.userData.refrigeratorRouteContract = {
		cabinetBounds: {
			min: [
				-1.42,
				.18,
				-1.05
			],
			max: [
				1.42,
				5.12,
				1.08
			]
		},
		sideClearance: .48,
		frontClearanceZ: 1.42,
		rearClearanceZ: -1.42,
		rule: "rear-to-front travel must keep |x| >= 1.9 until z >= 1.42"
	};
	build.root.userData.activeDuration = ACTIVE_DURATION;
	build.root.userData.previewLightingProfile = "sakura-appliance-v2";
	build.root.userData.legacyReferencePath = REFERENCE_PATH;
	build.root.userData.referenceDimensions = {
		overallWidth: 2.885,
		overallHeight: 5.145,
		overallDepth: 2.6395,
		freezerDoorHeight: 1.59,
		mainDoorHeight: 2.91,
		hingeX: 1.38
	};
	return build;
}
//#endregion
export { refrigerator_exports as n, createRefrigeratorModel as t };

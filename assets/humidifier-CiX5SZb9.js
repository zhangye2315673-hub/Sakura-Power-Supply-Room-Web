import { t as __exportAll } from "./rolldown-runtime-D7D4PA-g.js";
import { G as IcosahedronGeometry, I as ExtrudeGeometry, Ln as Shape, Qn as TubeGeometry, S as CylinderGeometry, Xn as TorusGeometry, Z as LatheGeometry, dr as Vector3, ht as Mesh, p as Color, u as CatmullRomCurve3, ur as Vector2 } from "./three.core-DlTOC7bx.js";
import { i as RoundedBoxGeometry } from "./BufferGeometryUtils-Bf_-bT2g.js";
import { a as setHullOutlineStyle, d as ApplianceModelKit } from "./outline-Brkgge31.js";
//#region src/appliances/models/humidifier.ts
var humidifier_exports = /* @__PURE__ */ __exportAll({ createHumidifierModel: () => createHumidifierModel });
var REFERENCE_PATH = "D:/下载文件/ChatGPT Image 2026年8月2日 19_55_18 (5).png";
function accentShift(accent, lightness, saturation = 0) {
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
function applyHumidifierOutlineHierarchy(root) {
	const main = /lower-body-shell|bottom-accent-rail|transparent-water-reservoir|outlet-recess-seat|front-control-panel/;
	const structure = /tank-body-seam|outlet-rotary-cap|control-dial-(?:outer-ring|$)|rear-service-panel|rear-drain-cover|foot-/;
	root.traverse((object) => {
		if (!(object instanceof Mesh) || object.userData.isOutline !== true) return;
		const source = object.parent?.name ?? object.name;
		const sourceMesh = object.parent instanceof Mesh ? object.parent : null;
		if ((sourceMesh ? Array.isArray(sourceMesh.material) ? sourceMesh.material : [sourceMesh.material] : []).some((material) => material.transparent) || /mist|cloud|lightning|rain|water-glint|inner-water/.test(source)) {
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
function latheShell(points, segments = 12) {
	return new LatheGeometry(points.map(([radius, y]) => new Vector2(radius, y)), segments);
}
function dropletGeometry() {
	const shape = new Shape();
	shape.moveTo(0, .15);
	shape.bezierCurveTo(.085, .035, .11, -.025, .11, -.09);
	shape.bezierCurveTo(.11, -.19, .06, -.25, 0, -.25);
	shape.bezierCurveTo(-.06, -.25, -.11, -.19, -.11, -.09);
	shape.bezierCurveTo(-.11, -.025, -.085, .035, 0, .15);
	const geometry = new ExtrudeGeometry(shape, {
		depth: .018,
		steps: 1,
		bevelEnabled: true,
		bevelSegments: 1,
		bevelSize: .009,
		bevelThickness: .008,
		curveSegments: 8
	});
	geometry.translate(0, 0, -.009);
	return geometry;
}
/** A closed, irregular low-poly volume. It deliberately has a real cross-section
* instead of a card or sprite so the plume/cloud stays readable while orbiting. */
function irregularVolume(radius, seed) {
	const geometry = new IcosahedronGeometry(radius, 1);
	const position = geometry.getAttribute("position");
	for (let index = 0; index < position.count; index += 1) {
		const x = position.getX(index);
		const y = position.getY(index);
		const z = position.getZ(index);
		const deformation = 1 + Math.sin(x * (8.3 + seed * .27) + y * (11.1 + seed * .19) + z * (9.7 + seed * .31) + seed * 1.41) * .14;
		position.setXYZ(index, x * deformation, y * deformation, z * deformation);
	}
	position.needsUpdate = true;
	geometry.computeVertexNormals();
	return geometry;
}
/** A rotationally symmetric water drop with a pointed crown and rounded belly. */
function volumetricDropGeometry() {
	return new LatheGeometry([
		[0, .24],
		[.055, .18],
		[.13, .08],
		[.17, -.08],
		[.14, -.23],
		[.075, -.32],
		[0, -.35]
	].map(([radius, y]) => new Vector2(radius, y)), 10);
}
function lightningGeometry() {
	const curve = new CatmullRomCurve3([
		new Vector3(-.04, .78, .08),
		new Vector3(.18, .44, .02),
		new Vector3(-.07, .19, .12),
		new Vector3(.08, -.1, .03),
		new Vector3(-.16, -.42, .04)
	], false, "catmullrom", .1);
	return new TubeGeometry(curve, 10, .06, 5, false);
}
/**
* Three-view procedural reconstruction of the supplied compact humidifier.
*
* Local frame: +Y up, +Z front, floor at Y=0. The water tank, water body,
* control panel, dial, outlet, service panel and mist system remain separate
* parts so the gallery can orbit and the activation system can animate them.
*/
function createHumidifierModel(options) {
	const kit = new ApplianceModelKit(options);
	const accentLight = accentShift(options.accent, .19, -.08);
	const accentMid = accentShift(options.accent, .07, -.05);
	const accentDark = accentShift(options.accent, -.11, -.02);
	const shellMaterial = kit.material(15986143, { tint: 7694974 });
	const shellHighlightMaterial = kit.material(16774887, { tint: 8023682 });
	const accentMaterial = kit.material(accentMid, { tint: 7101812 });
	const accentDarkMaterial = kit.material(accentDark, { tint: 5984102 });
	const seamMaterial = kit.material(7827840, { tint: 5721952 });
	const rubberMaterial = kit.material(6249320, { tint: 4801360 });
	const waterTankMaterial = kit.material(15266544, {
		tint: accentMid,
		transparent: true,
		opacity: .62
	});
	waterTankMaterial.depthWrite = false;
	waterTankMaterial.emissive.set(14282477);
	waterTankMaterial.emissiveIntensity = .38;
	const waterMaterial = kit.material(accentLight, {
		tint: 6780809,
		emissive: accentLight,
		transparent: true,
		opacity: .11
	});
	waterMaterial.depthWrite = false;
	const mistMaterial = kit.material(16055288, {
		tint: 8095637,
		emissive: 14286843,
		transparent: true,
		opacity: .48
	});
	mistMaterial.depthWrite = false;
	mistMaterial.emissiveIntensity = .08;
	mistMaterial.userData.humidifierEffectMaterial = "mist-shell";
	mistMaterial.userData.baseOpacity = .48;
	const mistShadeMaterial = kit.material(12178130, {
		tint: 6714500,
		emissive: 10345432,
		transparent: true,
		opacity: .34
	});
	mistShadeMaterial.depthWrite = false;
	mistShadeMaterial.emissiveIntensity = .035;
	mistShadeMaterial.userData.humidifierEffectMaterial = "mist-shade";
	mistShadeMaterial.userData.baseOpacity = .34;
	const stormMaterial = kit.material(5464434, { tint: 2370102 });
	stormMaterial.userData.humidifierEffectMaterial = "storm-shell";
	const stormBellyMaterial = kit.material(3621714, { tint: 1909296 });
	stormBellyMaterial.userData.humidifierEffectMaterial = "storm-belly";
	const lightningMaterial = kit.material(16773276, {
		tint: 10382904,
		emissive: 16767053,
		transparent: true,
		opacity: 0
	});
	lightningMaterial.depthWrite = false;
	lightningMaterial.emissiveIntensity = 0;
	lightningMaterial.userData.humidifierEffectMaterial = "internal-lightning";
	lightningMaterial.userData.baseOpacity = 0;
	const rainMaterial = kit.material(9166308, {
		tint: 4681610,
		emissive: 6605784,
		transparent: true,
		opacity: .84
	});
	rainMaterial.depthWrite = false;
	rainMaterial.emissiveIntensity = .12;
	rainMaterial.userData.humidifierEffectMaterial = "rain-drop";
	rainMaterial.userData.baseOpacity = .84;
	const lowerBody = kit.mesh("humidifier-lower-body-shell", latheShell([
		[0, .21],
		[.86, .21],
		[1.02, .25],
		[1.15, .38],
		[1.17, .82],
		[1.12, 1.08],
		[1.01, 1.23],
		[0, 1.23]
	]), shellMaterial);
	lowerBody.userData.part = "lower-body-shell";
	const bottomRail = kit.mesh("humidifier-bottom-accent-rail", latheShell([
		[0, .13],
		[.82, .13],
		[1.01, .16],
		[1.1, .23],
		[1.08, .35],
		[0, .34]
	]), accentMaterial);
	bottomRail.userData.part = "bottom-accent-rail";
	const reservoir = kit.mesh("humidifier-transparent-water-reservoir", latheShell([
		[0, 1.19],
		[.98, 1.19],
		[1.105, 1.29],
		[1.13, 2.25],
		[1.09, 2.52],
		[.96, 2.7],
		[.7, 2.81],
		[0, 2.81]
	], 12), waterTankMaterial);
	reservoir.renderOrder = 2;
	reservoir.userData.part = "transparent-reservoir-shell";
	const innerWater = kit.mesh("humidifier-inner-water-volume", latheShell([
		[0, 1.25],
		[.91, 1.25],
		[1.015, 1.35],
		[1.02, 2.18],
		[.94, 2.38],
		[0, 2.38]
	], 12), waterMaterial, kit.root, false);
	innerWater.renderOrder = 1;
	innerWater.userData.explodeWithParent = true;
	const tankSeam = kit.mesh("humidifier-tank-body-seam", new TorusGeometry(1.09, .028, 6, 12), seamMaterial, kit.root, false);
	tankSeam.rotation.x = Math.PI * .5;
	tankSeam.position.y = 1.22;
	tankSeam.userData.explodeWithParent = true;
	const outletPivot = kit.pivot("humidifier-outlet-cap-pivot");
	outletPivot.position.set(0, 2.79, 0);
	outletPivot.userData.rotationAxis = [
		0,
		1,
		0
	];
	outletPivot.userData.rotationRange = [-.45, .45];
	kit.mesh("humidifier-outlet-recess-seat", new CylinderGeometry(.34, .4, .07, 12), shellHighlightMaterial, outletPivot);
	const outletCap = kit.mesh("humidifier-outlet-rotary-cap", new CylinderGeometry(.255, .295, .18, 12), shellHighlightMaterial, outletPivot);
	outletCap.position.y = .09;
	const outletHole = kit.mesh("humidifier-outlet-opening", new TorusGeometry(.12, .04, 6, 12), seamMaterial, outletPivot, false);
	outletHole.rotation.x = Math.PI * .5;
	outletHole.position.set(0, .18, .035);
	const mistSocket = kit.socket("humidifier-mist-outlet-socket", outletPivot, [
		0,
		.2,
		.035
	]);
	const controlPanel = kit.mesh("humidifier-front-control-panel", new RoundedBoxGeometry(.68, .68, .035, 2, .11), shellHighlightMaterial, kit.root, false);
	controlPanel.position.set(0, .73, 1.165);
	controlPanel.userData.part = "front-control-panel";
	const dialPivot = kit.pivot("humidifier-control-dial-pivot");
	dialPivot.position.set(0, .62, 1.225);
	dialPivot.userData.rotationAxis = [
		0,
		0,
		1
	];
	dialPivot.userData.rotationRange = [-.6, .6];
	kit.socket("humidifier-control-dial-socket", dialPivot, [
		0,
		0,
		0
	]);
	const dialOuter = kit.mesh("humidifier-control-dial-outer-ring", new CylinderGeometry(.275, .275, .07, 12), accentDarkMaterial, dialPivot);
	dialOuter.rotation.x = Math.PI * .5;
	const dial = kit.mesh("humidifier-control-dial", new CylinderGeometry(.225, .235, .105, 12), accentMaterial, dialPivot);
	dial.rotation.x = Math.PI * .5;
	dial.position.z = .055;
	kit.mesh("humidifier-control-dial-index", new RoundedBoxGeometry(.018, .105, .018, 1, .007), accentDarkMaterial, dialPivot, false).position.set(0, .055, .115);
	const dropBadge = kit.mesh("humidifier-water-drop-badge", dropletGeometry(), accentDarkMaterial, kit.root, false);
	dropBadge.position.set(0, 1.05, 1.235);
	dropBadge.scale.setScalar(.38);
	kit.indicator([
		0,
		.93,
		1.245
	], .032);
	kit.mesh("humidifier-rear-service-panel", new RoundedBoxGeometry(.76, .4, .06, 2, .07), shellHighlightMaterial).position.set(0, .55, -1.11);
	for (let index = 0; index < 8; index += 1) {
		const vent = kit.mesh(`humidifier-rear-vent-${index + 1}`, new RoundedBoxGeometry(.035, .18, .025, 1, .012), seamMaterial, kit.root, false);
		vent.position.set(-.245 + index * .07, .6, -1.147);
		vent.userData.explodeWithParent = true;
	}
	const rearCover = kit.mesh("humidifier-rear-drain-cover", new RoundedBoxGeometry(.36, .26, .05, 3, .07), accentMaterial);
	rearCover.position.set(0, .29, -1.075);
	kit.socket("humidifier-rear-service-socket", rearCover, [
		0,
		0,
		-.06
	]);
	for (const [index, angle] of [
		.42,
		Math.PI - .42,
		Math.PI + .42,
		-.42
	].entries()) kit.mesh(`humidifier-foot-${index + 1}`, new CylinderGeometry(.11, .14, .12, 8), rubberMaterial, kit.root, false).position.set(Math.cos(angle) * .72, .06, Math.sin(angle) * .72);
	const waterGlints = [];
	for (let index = 0; index < 3; index += 1) {
		const glint = kit.mesh(`humidifier-water-glint-${index + 1}`, new TorusGeometry(.64 + index * .08, .012, 5, 24), waterMaterial, kit.root, false);
		glint.rotation.x = Math.PI * .5;
		glint.position.y = 1.66 + index * .25;
		waterGlints.push(glint);
	}
	const mistRig = kit.pivot("humidifier-volumetric-mist-rig", mistSocket);
	mistRig.userData.performanceEffect = true;
	mistRig.userData.effectGeometry = "overlapping irregular IcosahedronGeometry lobes";
	for (let index = 0; index < 18; index += 1) {
		const pivot = kit.pivot(`humidifier-mist-volume-pivot-${index + 1}`, mistRig);
		pivot.visible = false;
		pivot.userData.performanceEffect = true;
		pivot.userData.phaseOffset = index / 18;
		pivot.userData.lane = index % 7 - 3;
		pivot.userData.depthLane = index * 5 % 9 - 4;
		pivot.userData.baseScale = .78 + index % 4 * .08;
		for (let lobeIndex = 0; lobeIndex < 4; lobeIndex += 1) {
			const lobe = kit.mesh(`humidifier-mist-volume-${index + 1}-lobe-${lobeIndex + 1}`, irregularVolume(.17 + lobeIndex * .018, index * 5 + lobeIndex + 1), lobeIndex === 3 ? mistShadeMaterial : mistMaterial, pivot, false);
			lobe.position.set(((lobeIndex * 7 + index) % 5 - 2) * .055, lobeIndex * .105, ((lobeIndex * 3 + index) % 5 - 2) * .045);
			lobe.scale.set(1.05 + lobeIndex % 2 * .18, 1.28 + lobeIndex % 3 * .16, .96 + (lobeIndex + index) % 3 * .12);
			lobe.userData.explodeWithParent = true;
			lobe.userData.volumeEffect = "humidifier-condensed-mist";
		}
	}
	const cloudRig = kit.pivot("humidifier-volumetric-weather-cloud-rig");
	cloudRig.visible = false;
	cloudRig.scale.setScalar(.001);
	cloudRig.userData.performanceEffect = true;
	cloudRig.userData.targetWorldSize = [
		4.1,
		2.5,
		2.05
	];
	cloudRig.userData.bodyVisualAreaRatio = 1.5;
	const cloudLobes = [
		[
			-1.42,
			.02,
			.02,
			.78,
			1.02,
			.95,
			1.04
		],
		[
			-.78,
			.38,
			-.1,
			.74,
			1.08,
			1.04,
			1.08
		],
		[
			-.08,
			.5,
			.08,
			.79,
			1.12,
			1.02,
			1.1
		],
		[
			.7,
			.36,
			-.08,
			.73,
			1.09,
			.98,
			1.12
		],
		[
			1.43,
			.02,
			.04,
			.76,
			1.01,
			.92,
			1.06
		],
		[
			-1.05,
			-.46,
			.04,
			.7,
			1.04,
			.93,
			1.12
		],
		[
			-.35,
			-.53,
			-.1,
			.75,
			1.12,
			.92,
			1.08
		],
		[
			.4,
			-.5,
			.06,
			.73,
			1.1,
			.9,
			1.15
		],
		[
			1.08,
			-.43,
			-.05,
			.68,
			1.03,
			.9,
			1.1
		]
	];
	cloudLobes.forEach(([x, y, z, radius, sx, sy, sz], index) => {
		const lobe = kit.mesh(`humidifier-volumetric-weather-cloud-lobe-${index + 1}`, irregularVolume(radius, 71 + index * 3), index >= 5 ? stormBellyMaterial : stormMaterial, cloudRig, false);
		lobe.position.set(x, y, z);
		lobe.scale.set(sx, sy, sz);
		lobe.userData.basePosition = [
			x,
			y,
			z
		];
		lobe.userData.explodeWithParent = true;
		lobe.userData.volumeEffect = "large-low-poly-storm-cloud";
	});
	const internalLight = kit.pivot("humidifier-cloud-internal-light-pivot", cloudRig);
	internalLight.visible = false;
	internalLight.userData.performanceEffect = true;
	for (let index = 0; index < 3; index += 1) {
		const glow = kit.mesh(`humidifier-cloud-internal-light-${index + 1}`, irregularVolume(.34 + index * .06, 103 + index), lightningMaterial, internalLight, false);
		glow.position.set((index - 1) * .34, -.08 - index * .07, .18 - index * .12);
		glow.scale.set(1.15, .72, .88);
		glow.userData.explodeWithParent = true;
		glow.userData.volumeEffect = "cloud-internal-flash-body";
	}
	const mainBolt = kit.mesh("humidifier-cloud-volumetric-lightning-bolt", lightningGeometry(), lightningMaterial, cloudRig, false);
	mainBolt.visible = false;
	mainBolt.position.set(.17, -.22, .74);
	mainBolt.scale.set(1.05, 1.18, 1.05);
	mainBolt.userData.performanceEffect = true;
	mainBolt.userData.volumeEffect = "closed-tube-lightning-bolt";
	const rainRig = kit.pivot("humidifier-volumetric-rain-rig");
	rainRig.visible = false;
	rainRig.userData.performanceEffect = true;
	rainRig.userData.effectGeometry = "LatheGeometry pointed water drops";
	const rainDropGeometry = volumetricDropGeometry();
	for (let index = 0; index < 36; index += 1) {
		const pivot = kit.pivot(`humidifier-rain-drop-pivot-${index + 1}`, rainRig);
		pivot.visible = false;
		pivot.userData.performanceEffect = true;
		pivot.userData.phaseOffset = index * 13 % 37 / 37;
		pivot.userData.lane = index * 11 % 37 / 36 - .5;
		pivot.userData.depthLane = index * 17 % 29 / 28 - .5;
		pivot.userData.baseScale = .62 + index % 6 * .07;
		const drop = kit.mesh(`humidifier-rain-drop-${index + 1}`, rainDropGeometry, rainMaterial, pivot, false);
		drop.scale.set(.62, 1, .62);
		drop.userData.explodeWithParent = true;
		drop.userData.volumeEffect = "lathed-volumetric-raindrop";
	}
	kit.root.userData.humidifierEffectContract = {
		modelOwner: "humidifier-model-rig",
		timelineOwner: "AppliancePerformanceSystem",
		modelSpaceEffectRoot: kit.root.name,
		mistVolumes: 18,
		mistLobesPerVolume: 4,
		cloudLobes: cloudLobes.length,
		cloudWorldSize: [
			4.1,
			2.5,
			2.05
		],
		bodyVisualAreaRatio: 1.5,
		internalLightBodies: 3,
		lightningBolts: 1,
		volumetricRainDrops: 36,
		usesPlaneGeometry: false,
		usesSprite: false,
		sharedSpectacleEffects: "must-be-disabled-during-integration"
	};
	kit.root.userData.previewFocusOffsetY = 1.2;
	kit.root.userData.previewFramingScale = 1.42;
	const build = kit.finish({
		referencePath: options.referencePath ?? REFERENCE_PATH,
		reconstructed: [
			"twelve-sided faceted cream body with pinched waist and separated Sakura accent foot rail",
			"oversized translucent reservoir with broad planar shoulders, internal water and pronounced tank seam",
			"enlarged low-poly crown outlet, rotary nozzle cap, opening and unchanged mist socket",
			"oversized front inset panel with layered twelve-sided dial, index mark, water-drop badge and status lamp",
			"low feet plus rear service panel, repeated vertical ventilation slots and removable low cover",
			"model-owned weather rig with eighteen four-lobe mist volumes anchored to the real outlet",
			"large nine-lobe storm cloud sized to about 1.5 times the appliance visual area",
			"three internal flash volumes, one closed tubular lightning bolt and thirty-six lathed water drops"
		],
		inferred: [
			"the transparent tank wall thickness and internal water volume are inferred from the three exterior views",
			"rear service cover, drainage route and ventilation duct depth are inferred because the reference hides the interior",
			"atomizer, fan, wick, electrical wiring and screw bosses are intentionally not fabricated inside the closed shell",
			"underside fasteners and exact foot attachment sockets are not visible and use a symmetric four-foot layout"
		]
	});
	build.root.userData.outlineContract = {
		main: .0048,
		structure: .0041,
		detail: .0033,
		variation: .18,
		stable: true,
		style: "SAKURA low-poly three-band ink; transparent water and weather volumes excluded"
	};
	build.root.userData.humidifierV2 = {
		geometryLanguage: "faceted-twelve-sided-weather-totem",
		referenceStatus: "conditional-fallback-v1-four-view-not-gpt-image-2",
		frozenRuntime: [
			"humidifier-outlet-cap-pivot",
			"humidifier-mist-outlet-socket",
			"humidifier-control-dial-pivot"
		],
		envelopePolicy: "archived v1 package and weather rig are authoritative"
	};
	build.root.userData.sculptRuntime.colliders = [{
		id: "humidifier-body-envelope",
		type: "box",
		center: [
			0,
			1.405,
			0
		],
		size: [
			2.34,
			2.81,
			2.34
		]
	}];
	build.root.userData.sculptRuntime.destructionGroups = [
		{
			id: "humidifier-shell-assembly",
			nodes: [
				"humidifier-lower-body-shell",
				"humidifier-bottom-accent-rail",
				"humidifier-front-control-panel"
			]
		},
		{
			id: "humidifier-reservoir-assembly",
			nodes: [
				"humidifier-transparent-water-reservoir",
				"humidifier-inner-water-volume",
				"humidifier-tank-body-seam"
			]
		},
		{
			id: "humidifier-outlet-assembly",
			nodes: [
				"humidifier-outlet-cap-pivot",
				"humidifier-outlet-recess-seat",
				"humidifier-outlet-rotary-cap"
			]
		}
	];
	applyHumidifierOutlineHierarchy(build.root);
	return build;
}
//#endregion
export { humidifier_exports as n, createHumidifierModel as t };

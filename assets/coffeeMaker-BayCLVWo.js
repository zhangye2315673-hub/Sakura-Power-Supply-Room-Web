import { t as __exportAll } from "./rolldown-runtime-D7D4PA-g.js";
import { G as IcosahedronGeometry, Hn as SphereGeometry, N as Euler, Ot as OctahedronGeometry, Qn as TubeGeometry, S as CylinderGeometry, Xn as TorusGeometry, Z as LatheGeometry, dr as Vector3, ht as Mesh, p as Color, u as CatmullRomCurve3, ur as Vector2 } from "./three.core-DlTOC7bx.js";
import { i as RoundedBoxGeometry } from "./BufferGeometryUtils-Bf_-bT2g.js";
import { a as setHullOutlineStyle, d as ApplianceModelKit } from "./outline-Brkgge31.js";
//#region src/appliances/models/coffeeMaker.ts
var coffeeMaker_exports = /* @__PURE__ */ __exportAll({ createCoffeeMakerModel: () => createCoffeeMakerModel });
var V2_REFERENCE_PATH = "references/intake-v2/coffee-maker/views/front.png";
function stableOutlinePhase(name) {
	let hash = 2166136261;
	for (let index = 0; index < name.length; index += 1) {
		hash ^= name.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return (hash >>> 0) % 1e4 * (Math.PI * 2 / 1e4);
}
function applyCoffeeMakerOutlineHierarchy(root) {
	const mainSilhouette = /upper-rounded-shell|rear-l-shaped-spine|separated-base|base-accent-rail|cavity-frame-post|white-hopper-lid/;
	const fineDetail = /status-light|dial-index|tray-slot|rear-vent|power-contact|foot|bean|steam|aroma|light-point|liquid|shower-plate|outlet-nozzle/;
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
var REFERENCE_PATH = "D:/下载文件/ChatGPT Image 2026年8月2日 19_55_20 (10).png";
function tone(accent, lightness, saturation = 0) {
	return new Color(accent).offsetHSL(0, saturation, lightness).getHex();
}
function taperedCupGeometry() {
	const geometry = new CylinderGeometry(.235, .175, .48, 18, 2, false);
	geometry.translate(0, .24, 0);
	return geometry;
}
function volumetricDropGeometry() {
	return new LatheGeometry([
		[0, .1],
		[.035, .045],
		[.065, -.035],
		[.052, -.1],
		[0, -.135]
	].map(([radius, y]) => new Vector2(radius, y)), 10);
}
function beanCreaseGeometry() {
	return new TubeGeometry(new CatmullRomCurve3([
		new Vector3(-.008, -.04, .043),
		new Vector3(.007, -.014, .048),
		new Vector3(-.006, .012, .048),
		new Vector3(.008, .04, .043)
	]), 8, .006, 5, false);
}
function stableUnit(value) {
	return (Math.sin(value * 12.9898 + 78.233) * 43758.5453 % 1 + 1) % 1;
}
function looseBeanPile(count) {
	const poses = [];
	const halfWidth = .44;
	const halfDepth = .21;
	const supportRadius = .165;
	for (let index = 0; index < count; index += 1) {
		let bestPosition = new Vector3();
		let bestScore = Number.POSITIVE_INFINITY;
		for (let attempt = 0; attempt < 8; attempt += 1) {
			const key = index * 8 + attempt + 1;
			const x = -.44 + stableUnit(key * .83) * halfWidth * 2;
			const z = -.21 + stableUnit(key * 1.37 + 4.7) * halfDepth * 2;
			let y = .16 + stableUnit(key * 2.11 + 9.2) * .018;
			poses.forEach(({ position }) => {
				const deltaX = x - position.x;
				const deltaZ = z - position.z;
				const horizontalDistanceSquared = deltaX * deltaX + deltaZ * deltaZ;
				if (horizontalDistanceSquared >= supportRadius * supportRadius) return;
				y = Math.max(y, position.y + Math.sqrt(supportRadius * supportRadius - horizontalDistanceSquared) * .76);
			});
			const score = y + Math.abs(x) * .004 + Math.abs(z) * .003;
			if (score >= bestScore) continue;
			bestScore = score;
			bestPosition = new Vector3(x, y, z);
		}
		poses.push({
			position: bestPosition,
			rotation: new Euler((stableUnit(index * 2.31 + 1.2) - .5) * 1.35, stableUnit(index * 3.17 + 2.8) * Math.PI * 2, (stableUnit(index * 4.13 + 5.4) - .5) * 1.5)
		});
	}
	return poses;
}
function irregularSteamGeometry(radius, seed) {
	const geometry = new IcosahedronGeometry(radius, 1);
	const position = geometry.getAttribute("position");
	for (let index = 0; index < position.count; index += 1) {
		const scale = .88 + Math.sin(seed * 1.93 + index * 2.17) * .09;
		position.setXYZ(index, position.getX(index) * scale, position.getY(index) * scale, position.getZ(index) * scale);
	}
	position.needsUpdate = true;
	geometry.computeVertexNormals();
	return geometry;
}
function aromaCurlGeometry(index) {
	const side = index % 2 === 0 ? -1 : 1;
	return new TubeGeometry(new CatmullRomCurve3([
		new Vector3(side * .04, 0, 0),
		new Vector3(side * .13, .22, .32),
		new Vector3(-side * .08, .46, .52),
		new Vector3(side * .16, .7, .57),
		new Vector3(-side * .05, .94, .61)
	], false, "centripetal"), 24, .014 + index % 3 * .003, 6, false);
}
/**
* Procedural three-view reconstruction of the compact counter coffee maker.
*
* Local frame: +Y up, +Z front, floor at Y=0. The cream upper appliance,
* rear structural column, brewing cavity, cup and rear water tank are kept as
* separate named assemblies so orbit review and activation remain readable.
*/
function createCoffeeMakerModel(options) {
	const kit = new ApplianceModelKit(options);
	const accentLight = tone(options.accent, .2, -.08);
	const accentMid = tone(options.accent, .08, -.04);
	const accentDark = tone(options.accent, -.14, .01);
	const shell = kit.material(16051681, { tint: 7629437 });
	const shellLight = kit.material(16775145, { tint: 8089732 });
	kit.material(accentLight, { tint: 7432060 });
	const accent = kit.material(accentMid, { tint: 6773361 });
	const accentDeep = kit.material(accentDark, { tint: 5589600 });
	const seam = kit.material(6907252, { tint: 5130326 });
	const rubber = kit.material(5196889, { tint: 4209480 });
	const metal = kit.material(10394789, { tint: 6051427 });
	const coffee = kit.material(8076585, {
		tint: 4994368,
		emissive: 5907741,
		transparent: true,
		opacity: 0
	});
	coffee.depthWrite = false;
	const waterTank = kit.material(accentLight, {
		tint: 6714503,
		transparent: true,
		opacity: .46
	});
	waterTank.depthWrite = false;
	waterTank.emissive.set(accentLight);
	waterTank.emissiveIntensity = .08;
	const hopperGlass = kit.material(7828864, {
		tint: 5065558,
		transparent: true,
		opacity: .36
	});
	hopperGlass.depthWrite = false;
	const beanMaterial = kit.material(7156254, { tint: 3940384 });
	const beanCreaseMaterial = kit.material(3282962, { tint: 1773587 });
	const steamMaterial = kit.material(16774376, {
		tint: 10192787,
		emissive: 16768964,
		transparent: true,
		opacity: 0
	});
	steamMaterial.depthWrite = false;
	steamMaterial.userData.coffeeMakerEffectMaterial = "steam";
	const aromaMaterial = kit.material(14262379, {
		tint: 8147808,
		emissive: 16751698,
		transparent: true,
		opacity: 0
	});
	aromaMaterial.depthWrite = false;
	aromaMaterial.userData.coffeeMakerEffectMaterial = "aroma";
	const warmLightMaterial = kit.material(16757852, {
		tint: 11033157,
		emissive: 16744242,
		transparent: true,
		opacity: 0
	});
	warmLightMaterial.depthWrite = false;
	warmLightMaterial.userData.coffeeMakerEffectMaterial = "warm-light";
	coffee.userData.coffeeMakerEffectMaterial = "coffee-liquid";
	const upperAssembly = kit.pivot("coffee-maker-upper-assembly-pivot");
	const upperShell = kit.mesh("coffee-maker-upper-rounded-shell", new RoundedBoxGeometry(1.58, .72, 1.04, 1, .13), shell, upperAssembly);
	upperShell.position.set(0, 1.66, .03);
	upperShell.userData.part = "upper-shell";
	const upperCap = kit.mesh("coffee-maker-upper-cap-highlight", new RoundedBoxGeometry(1.42, .1, .9, 1, .045), shellLight, upperAssembly, false);
	upperCap.position.set(0, 2.01, .02);
	upperCap.userData.explodeWithParent = true;
	const hopperPivot = kit.pivot("coffee-maker-bean-hopper-pivot", upperAssembly);
	hopperPivot.position.set(0, 2.07, -.04);
	const hopperCollar = kit.mesh("coffee-maker-bean-hopper-locking-collar", new RoundedBoxGeometry(1.12, .1, .66, 1, .045), seam, hopperPivot);
	hopperCollar.position.y = .05;
	const hopper = kit.mesh("coffee-maker-gray-translucent-bean-hopper", new RoundedBoxGeometry(1.34, .55, .78, 1, .1), hopperGlass, hopperPivot, false);
	hopper.position.y = .36;
	hopper.renderOrder = 3;
	hopper.userData.part = "bean-hopper";
	const hopperLid = kit.mesh("coffee-maker-white-hopper-lid", new RoundedBoxGeometry(1.38, .075, .82, 1, .045), shellLight, hopperPivot);
	hopperLid.position.y = .68;
	const beanBodyGeometry = new SphereGeometry(1, 10, 7);
	const creaseGeometry = beanCreaseGeometry();
	const beanPile = looseBeanPile(30);
	for (let index = 0; index < 30; index += 1) {
		const pivot = kit.pivot(`coffee-maker-hopper-bean-pivot-${index + 1}`, hopperPivot);
		pivot.position.copy(beanPile[index].position);
		pivot.rotation.copy(beanPile[index].rotation);
		pivot.userData.phaseOffset = index / 30;
		pivot.userData.restingPattern = "deterministic-loose-pile";
		const bean = kit.mesh(`coffee-maker-sculpted-bean-${index + 1}`, beanBodyGeometry, beanMaterial, pivot, false);
		bean.scale.set(.085, .055, .045);
		bean.userData.beanProfile = "oval-seed-with-longitudinal-crease";
		const crease = kit.mesh(`coffee-maker-bean-central-crease-${index + 1}`, creaseGeometry, beanCreaseMaterial, pivot, false);
		crease.userData.explodeWithParent = true;
	}
	const rearSpine = kit.mesh("coffee-maker-rear-l-shaped-spine", new RoundedBoxGeometry(1.42, 1.26, .38, 1, .11), accent);
	rearSpine.position.set(0, .84, -.35);
	rearSpine.userData.part = "rear-spine";
	const cavityBack = kit.mesh("coffee-maker-brewing-cavity-back-panel", new RoundedBoxGeometry(1.12, .9, .045, 1, .07), accentDeep, kit.root, false);
	cavityBack.position.set(-.08, .84, -.13);
	cavityBack.userData.explodeWithParent = true;
	for (const [side, x] of [["left", -.61], ["right", .61]]) {
		const post = kit.mesh(`coffee-maker-cavity-frame-post-${side}`, new RoundedBoxGeometry(.16, .98, .17, 1, .045), accent, kit.root);
		post.position.set(x, .88, -.03);
		post.userData.part = "cavity-frame";
	}
	const base = kit.mesh("coffee-maker-separated-base", new RoundedBoxGeometry(1.56, .25, 1.08, 1, .09), shell);
	base.position.set(0, .18, .02);
	base.userData.part = "base";
	const baseAccent = kit.mesh("coffee-maker-base-accent-rail", new RoundedBoxGeometry(1.48, .095, 1, 1, .04), accent);
	baseAccent.position.set(0, .085, .02);
	baseAccent.userData.explodeWithParent = true;
	const dialPivot = kit.pivot("coffee-maker-control-dial-pivot", upperAssembly);
	dialPivot.position.set(-.47, 1.72, .57);
	dialPivot.userData.rotationAxis = [
		0,
		0,
		1
	];
	dialPivot.userData.rotationRange = [-.76, .25];
	kit.socket("coffee-maker-control-dial-socket", dialPivot, [
		0,
		0,
		0
	]);
	const dialSeat = kit.mesh("coffee-maker-control-dial-seat", new CylinderGeometry(.22, .22, .055, 12), accentDeep, dialPivot);
	dialSeat.rotation.x = Math.PI * .5;
	const dial = kit.mesh("coffee-maker-large-control-dial", new CylinderGeometry(.18, .19, .09, 12), accent, dialPivot);
	dial.rotation.x = Math.PI * .5;
	dial.position.z = .04;
	kit.mesh("coffee-maker-dial-index", new RoundedBoxGeometry(.018, .095, .018, 1, .006), seam, dialPivot, false).position.set(0, .055, .1);
	kit.mesh("coffee-maker-narrow-status-light", new RoundedBoxGeometry(.035, .19, .025, 2, .014), kit.indicatorMaterial, upperAssembly, false).position.set(.45, 1.73, .56);
	const brewHeadPivot = kit.pivot("coffee-maker-brew-head-pivot", upperAssembly);
	brewHeadPivot.position.set(-.12, 1.3, .31);
	brewHeadPivot.userData.rotationAxis = [
		0,
		0,
		1
	];
	brewHeadPivot.userData.rotationRange = [-.03, .03];
	const brewHead = kit.mesh("coffee-maker-brew-head-housing", new RoundedBoxGeometry(.54, .2, .45, 1, .065), seam, brewHeadPivot);
	brewHead.position.y = .02;
	kit.mesh("coffee-maker-brew-head-shower-plate", new CylinderGeometry(.14, .16, .045, 12), metal, brewHeadPivot).position.set(0, -.09, .1);
	kit.mesh("coffee-maker-outlet-nozzle", new CylinderGeometry(.055, .045, .17, 12), accentDeep, brewHeadPivot).position.set(0, -.18, .1);
	kit.socket("coffee-maker-brew-head-socket", brewHeadPivot, [
		0,
		0,
		0
	]);
	const liquidSocket = kit.socket("coffee-maker-liquid-outlet-socket", brewHeadPivot, [
		0,
		-.275,
		.1
	]);
	const tray = kit.mesh("coffee-maker-drip-tray", new RoundedBoxGeometry(1.08, .085, .64, 1, .05), seam);
	tray.position.set(-.08, .34, .28);
	tray.userData.part = "drip-tray";
	for (let index = 0; index < 7; index += 1) {
		const slot = kit.mesh(`coffee-maker-drip-tray-slot-${index + 1}`, new RoundedBoxGeometry(.052, .012, .42, 1, .009), metal, kit.root, false);
		slot.position.set(-.35 + index * .09, .382, .28);
		slot.userData.explodeWithParent = true;
	}
	const cupPivot = kit.pivot("coffee-maker-cup-pivot");
	cupPivot.position.set(-.08, .38, .38);
	cupPivot.userData.translationRange = [[
		-.1,
		0,
		0
	], [
		.1,
		.02,
		0
	]];
	kit.socket("coffee-maker-cup-socket", cupPivot, [
		0,
		0,
		0
	]);
	const cupBody = kit.mesh("coffee-maker-cup-body", taperedCupGeometry(), shell, cupPivot);
	cupBody.userData.part = "cup";
	const cupFootBand = kit.mesh("coffee-maker-cup-accent-foot-band", new CylinderGeometry(.18, .18, .055, 18), accent, cupPivot);
	cupFootBand.position.y = .035;
	const cupRim = kit.mesh("coffee-maker-cup-rim", new TorusGeometry(.225, .024, 6, 20), accentDeep, cupPivot);
	cupRim.rotation.x = Math.PI * .5;
	cupRim.position.y = .48;
	const cupHandle = kit.mesh("coffee-maker-cup-handle", new TorusGeometry(.13, .035, 7, 20), shellLight, cupPivot);
	cupHandle.position.set(.265, .28, 0);
	cupHandle.scale.y = 1.12;
	const liquidSurface = kit.mesh("coffee-maker-cup-liquid-surface", new CylinderGeometry(.19, .19, .026, 18), coffee, cupPivot, false);
	liquidSurface.position.y = .445;
	liquidSurface.visible = false;
	const steamSocket = kit.socket("coffee-maker-steam-socket", cupPivot, [
		0,
		.53,
		0
	]);
	const extractionRig = kit.pivot("coffee-maker-volumetric-extraction-rig", liquidSocket);
	extractionRig.userData.performanceEffect = true;
	for (let index = 0; index < 3; index += 1) {
		const dropPivot = kit.pivot(`coffee-maker-extraction-drop-pivot-${index + 1}`, extractionRig);
		dropPivot.visible = false;
		dropPivot.userData.phaseOffset = index;
		kit.mesh(`coffee-maker-volumetric-extraction-drop-${index + 1}`, volumetricDropGeometry(), coffee, dropPivot, false);
	}
	const flow = kit.mesh("coffee-maker-primary-extraction-flow-center", new CylinderGeometry(.046, .058, .36, 12), coffee, extractionRig, false);
	flow.position.set(0, -.18, 0);
	flow.visible = false;
	flow.userData.performanceEffect = true;
	for (let index = 0; index < 2; index += 1) {
		const ripple = kit.mesh(`coffee-maker-cup-liquid-ripple-${index + 1}`, new TorusGeometry(.09 + index * .055, .008, 5, 18), coffee, cupPivot, false);
		ripple.rotation.x = Math.PI * .5;
		ripple.position.y = .462;
		ripple.visible = false;
	}
	const steamRig = kit.pivot("coffee-maker-volumetric-steam-rig", steamSocket);
	steamRig.userData.performanceEffect = true;
	steamRig.userData.origin = "cup-rim-center";
	steamRig.userData.clearance = "rises-from-cup-then-drifts-forward";
	for (let index = 0; index < 12; index += 1) {
		const puff = kit.pivot(`coffee-maker-steam-volume-pivot-${index + 1}`, steamRig);
		puff.visible = false;
		puff.userData.phaseOffset = index / 12;
		puff.userData.lane = index % 5 - 2;
		for (let lobeIndex = 0; lobeIndex < 3; lobeIndex += 1) kit.mesh(`coffee-maker-steam-volume-${index + 1}-lobe-${lobeIndex + 1}`, irregularSteamGeometry(.08 + lobeIndex * .022, index * 5 + lobeIndex), steamMaterial, puff, false).position.set((lobeIndex - 1) * .055, lobeIndex * .065, ((index + lobeIndex) % 3 - 1) * .035);
	}
	for (let index = 0; index < 5; index += 1) {
		const aroma = kit.mesh(`coffee-maker-volumetric-aroma-curl-${index + 1}`, aromaCurlGeometry(index), aromaMaterial, steamRig, false);
		aroma.visible = false;
		aroma.position.set((index - 2) * .08, 0, 0);
		aroma.userData.phaseOffset = index / 5;
	}
	for (let index = 0; index < 16; index += 1) {
		const glow = kit.mesh(`coffee-maker-warm-aroma-light-point-${index + 1}`, new OctahedronGeometry(.025 + index % 3 * .007, 0), warmLightMaterial, steamRig, false);
		glow.visible = false;
		glow.userData.phaseOffset = index / 16;
		glow.userData.lane = index % 7 - 3;
	}
	const tankPivot = kit.pivot("coffee-maker-water-tank-pivot");
	tankPivot.position.set(.82, 1.02, -.12);
	const tank = kit.mesh("coffee-maker-visible-side-water-tank", new RoundedBoxGeometry(.31, 1.28, .36, 1, .075), waterTank, tankPivot, false);
	tank.renderOrder = 2;
	const tankCap = kit.mesh("coffee-maker-water-tank-cap", new RoundedBoxGeometry(.29, .12, .34, 1, .045), accentDeep, tankPivot);
	tankCap.position.y = .65;
	kit.socket("coffee-maker-water-tank-service-socket", tankPivot, [
		0,
		.66,
		0
	]);
	kit.mesh("coffee-maker-rear-service-panel", new RoundedBoxGeometry(.74, .74, .045, 3, .09), accent, kit.root, false).position.set(-.18, .87, -.565);
	for (let index = 0; index < 7; index += 1) {
		const vent = kit.mesh(`coffee-maker-rear-vent-${index + 1}`, new RoundedBoxGeometry(.43, .025, .025, 1, .009), seam, kit.root, false);
		vent.position.set(-.18, .66 + index * .07, -.6);
		vent.userData.explodeWithParent = true;
	}
	const powerInlet = kit.mesh("coffee-maker-rear-power-inlet", new RoundedBoxGeometry(.28, .2, .05, 2, .05), rubber, kit.root);
	powerInlet.position.set(.3, .28, -.56);
	for (const offset of [-.07, .07]) {
		const contact = kit.mesh(`coffee-maker-rear-power-contact-${offset < 0 ? "left" : "right"}`, new CylinderGeometry(.025, .025, .035, 8), metal, kit.root, false);
		contact.rotation.x = Math.PI * .5;
		contact.position.set(.3 + offset, .28, -.595);
	}
	kit.socket("coffee-maker-power-socket", powerInlet, [
		0,
		0,
		-.05
	]);
	for (const [index, x, z] of [
		[
			1,
			-.57,
			.35
		],
		[
			2,
			.57,
			.35
		],
		[
			3,
			-.57,
			-.35
		],
		[
			4,
			.57,
			-.35
		]
	]) kit.mesh(`coffee-maker-foot-${index}`, new CylinderGeometry(.09, .105, .07, 10), rubber, kit.root, false).position.set(x, .035, z);
	kit.root.userData.coffeeMakerEffectContract = {
		modelOwner: "coffee-maker-model-rig",
		sharedSpectacleEffects: "must-be-disabled-during-integration",
		usesPlaneGeometry: false,
		usesSprite: false,
		sculptedBeans: 30,
		preInfusionDrops: 3,
		extractionColumns: 1,
		steamVolumes: 12,
		aromaCurls: 5,
		warmLightPoints: 16
	};
	applyCoffeeMakerOutlineHierarchy(kit.root);
	const build = kit.finish({
		referencePath: options.referencePath ?? V2_REFERENCE_PATH,
		reconstructed: [
			"reference-defining L-shaped silhouette with an eight-plane overhanging cream shell, open deep-plum cup cavity, pink frame posts and a layered low base",
			"wide faceted transparent hopper with cream lid, dark collar and thirty oval beans with modeled longitudinal creases",
			"large twelve-sided rotary control, index mark and narrow inset mint status light",
			"enlarged suspended brew-head housing, metal shower plate, downward outlet and unchanged liquid socket",
			"wide layered slotted drip tray, tapered removable cup, negative-space handle, pink rim and separate rising coffee surface",
			"faceted right-side translucent water reservoir with removable cap and unchanged service socket",
			"rear ventilation bank, service panel, low power inlet and four rubber feet",
			"model-owned volumetric extraction drops, outlet-aligned flow column, liquid ripples, steam volumes, aroma tubes and warm light bodies"
		],
		inferred: [
			"the GPT Image 2 turn-sheet is visual modeling evidence; archived runtime transforms and package bounds remain authoritative",
			"internal pump, heater, pressure hose routing, valve and wiring are hidden and intentionally not modeled",
			"rear service-panel depth, power-inlet recess and tank attachment rails are inferred from the rear/side presentation",
			"the underside screw pattern and exact foot attachment method are not visible; a stable symmetric four-foot layout is used"
		]
	});
	build.root.userData.visualRevision = "sakura-coffee-maker-v2";
	build.root.userData.legacyReferencePath = REFERENCE_PATH;
	build.root.userData.previewLightingProfile = "sakura-appliance-v2";
	build.root.userData.outlineContract = {
		main: .0048,
		structure: .0041,
		detail: .0033,
		variation: .18,
		stable: true
	};
	build.root.userData.sculptRuntime.colliders = [
		{
			id: "coffee-maker-upper",
			type: "box",
			node: "coffee-maker-upper-assembly-pivot"
		},
		{
			id: "coffee-maker-base",
			type: "box",
			node: "coffee-maker-separated-base"
		},
		{
			id: "coffee-maker-cup-trigger",
			type: "cylinder",
			node: "coffee-maker-cup-pivot",
			trigger: true
		}
	];
	build.root.userData.sculptRuntime.destructionGroups = [
		{
			id: "coffee-maker-upper-system",
			nodes: [
				"coffee-maker-upper-assembly-pivot",
				"coffee-maker-control-dial-pivot",
				"coffee-maker-brew-head-pivot"
			]
		},
		{
			id: "coffee-maker-hopper-system",
			nodes: ["coffee-maker-bean-hopper-pivot"]
		},
		{
			id: "coffee-maker-frame-system",
			nodes: [
				"coffee-maker-rear-l-shaped-spine",
				"coffee-maker-cavity-frame-post-left",
				"coffee-maker-cavity-frame-post-right"
			]
		},
		{
			id: "coffee-maker-cup-system",
			nodes: ["coffee-maker-cup-pivot", "coffee-maker-steam-socket"]
		},
		{
			id: "coffee-maker-water-system",
			nodes: ["coffee-maker-water-tank-pivot", "coffee-maker-water-tank-service-socket"]
		},
		{
			id: "coffee-maker-rear-service",
			nodes: ["coffee-maker-rear-service-panel", "coffee-maker-power-socket"]
		}
	];
	applyCoffeeMakerOutlineHierarchy(build.root);
	return build;
}
//#endregion
export { createCoffeeMakerModel as n, coffeeMaker_exports as t };

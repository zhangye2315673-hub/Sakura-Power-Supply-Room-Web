import { t as __exportAll } from "./rolldown-runtime-D7D4PA-g.js";
import { G as IcosahedronGeometry, Hn as SphereGeometry, Qn as TubeGeometry, S as CylinderGeometry, Xn as TorusGeometry, dr as Vector3, ht as Mesh, l as CapsuleGeometry, p as Color, u as CatmullRomCurve3 } from "./three.core-DlTOC7bx.js";
import { i as RoundedBoxGeometry } from "./BufferGeometryUtils-CSuwXBGj.js";
import { a as setHullOutlineStyle, d as ApplianceModelKit } from "./outline-DAm9XhPL.js";
import { t as ParametricGeometry } from "./ParametricGeometry-CNqXT5Mu.js";
//#region src/appliances/models/riceCooker.ts
var riceCooker_exports = /* @__PURE__ */ __exportAll({ createRiceCookerModel: () => createRiceCookerModel });
var V2_REFERENCE_PATH = "references/intake-v2/rice-cooker/views/front.png";
function stableOutlinePhase(name) {
	let hash = 2166136261;
	for (let index = 0; index < name.length; index += 1) {
		hash ^= name.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return (hash >>> 0) % 1e4 * (Math.PI * 2 / 1e4);
}
function applyRiceCookerOutlineHierarchy(root) {
	const mainSilhouette = /wide-rounded-lower-shell|lower-skirt|upper-body-shoulder|domed-lid-shell|rear-carry-latch/;
	const fineDetail = /status-lamp|power-hole|foot|kernel|steam-puff|top-steam-slot|lid-small-top-crown/;
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
var REFERENCE_PATH = "D:/下载文件/ChatGPT Image 2026年8月2日 20_03_02 (2).png";
function tone(accent, lightness, saturation = 0) {
	return new Color(accent).offsetHSL(0, saturation, lightness).getHex();
}
function seededRandom(seed) {
	let state = seed >>> 0;
	return () => {
		state = Math.imul(state, 1664525) + 1013904223 >>> 0;
		return state / 4294967296;
	};
}
function shuffledRiceAngles(count) {
	const random = seededRandom(1909350125);
	const angles = Array.from({ length: count }, (_, index) => (index + (random() - .5) * .55) / count * Math.PI * 2);
	for (let index = angles.length - 1; index > 0; index -= 1) {
		const swapIndex = Math.floor(random() * (index + 1));
		[angles[index], angles[swapIndex]] = [angles[swapIndex], angles[index]];
	}
	return angles;
}
function tubeThrough(points, radius) {
	return new TubeGeometry(new CatmullRomCurve3([...points], false, "centripetal"), 28, radius, 9, false);
}
function addSculptedRiceKernel(kit, parent, name, bodyGeometry, creaseGeometry, bodyMaterial, creaseMaterial) {
	const body = kit.mesh(`${name}-body`, bodyGeometry, bodyMaterial, parent);
	body.userData.riceKernelRole = "shared-sculpted-body";
	const crease = kit.mesh(`${name}-crease`, creaseGeometry, creaseMaterial, parent, false);
	crease.position.y = .034;
	crease.userData.riceKernelRole = "shared-dorsal-crease";
}
function signedPower(value, exponent) {
	if (value === 0) return 0;
	return Math.sign(value) * Math.abs(value) ** exponent;
}
function reverseWinding(geometry) {
	const index = geometry.index;
	if (!index) return;
	for (let offset = 0; offset < index.count; offset += 3) {
		const second = index.getX(offset + 1);
		index.setX(offset + 1, index.getX(offset + 2));
		index.setX(offset + 2, second);
	}
	index.needsUpdate = true;
	geometry.computeVertexNormals();
}
/** Continuous superellipsoid used instead of a rounded box. It keeps the
* front/side silhouette soft while retaining the reference's broad top and
* rounded-rectangle plan. */
function softSuperellipsoid(xRadius, yRadius, zRadius, exponent) {
	const geometry = new ParametricGeometry((u, v, target) => {
		const longitude = u * Math.PI * 2 - Math.PI;
		const latitude = v * Math.PI - Math.PI * .5;
		const latitudeRadius = signedPower(Math.cos(latitude), exponent);
		target.set(xRadius * latitudeRadius * signedPower(Math.cos(longitude), exponent), yRadius * signedPower(Math.sin(latitude), exponent), zRadius * latitudeRadius * signedPower(Math.sin(longitude), exponent));
	}, 12, 8);
	reverseWinding(geometry);
	return geometry;
}
/** Upper, truncated ellipsoid: broad at the seam, continuously curved toward
* a small top crown. This is the lid's real dome rather than a scaled box. */
function softUpperDome(xRadius, yRadius, zRadius, planExponent = .78) {
	const maximumLatitude = 1.34;
	const geometry = new ParametricGeometry((u, v, target) => {
		const longitude = u * Math.PI * 2 - Math.PI;
		const latitude = v * maximumLatitude;
		const radial = Math.cos(latitude);
		target.set(xRadius * radial * signedPower(Math.cos(longitude), planExponent), yRadius * Math.sin(latitude), zRadius * radial * signedPower(Math.sin(longitude), planExponent));
	}, 12, 7);
	reverseWinding(geometry);
	return geometry;
}
/**
* Animation-ready reconstruction of the supplied three-view rice cooker.
* Local frame: +Y up, +Z front, floor at Y=0. The proportions deliberately
* favour a wide, soft belly and a thick domed lid so the prop cannot read as a
* generic square appliance when reduced to gameplay scale.
*/
function createRiceCookerModel(options) {
	const kit = new ApplianceModelKit(options);
	const accentLight = tone(options.accent, .2, -.09);
	const accentMid = tone(options.accent, .08, -.04);
	const accentDark = tone(options.accent, -.14, .01);
	const shell = kit.material(16051682, { tint: 7629438 });
	const shellLight = kit.material(16775145, { tint: 8155268 });
	const accent = kit.material(accentMid, { tint: 7102069 });
	const accentSoft = kit.material(accentLight, { tint: 7628668 });
	const accentDeep = kit.material(accentDark, { tint: 5589600 });
	const seam = kit.material(6907251, { tint: 5064790 });
	const rubber = kit.material(4999765, { tint: 4077893 });
	const innerPotMaterial = kit.material(4539728, { tint: 3420477 });
	const riceMaterial = kit.material(16775132, { tint: 10128768 });
	const riceCreaseMaterial = kit.material(14207912, { tint: 9207410 });
	const warmLamp = kit.material(13205872, { emissive: 16752512 });
	warmLamp.emissiveIntensity = 0;
	const bodyPivot = kit.pivot("rice-cooker-body-pivot");
	const bodyShell = kit.mesh("rice-cooker-wide-rounded-lower-shell", softSuperellipsoid(.92, .52, .71, .5), shell, bodyPivot);
	bodyShell.position.set(0, .62, 0);
	bodyShell.userData.part = "body-shell";
	const lowerSkirt = kit.mesh("rice-cooker-lower-skirt", softSuperellipsoid(.84, .13, .65, .58), shell, bodyPivot);
	lowerSkirt.position.set(0, .16, 0);
	lowerSkirt.userData.part = "lower-skirt";
	const upperShoulder = kit.mesh("rice-cooker-upper-body-shoulder", softSuperellipsoid(.91, .16, .7, .56), shell, bodyPivot);
	upperShoulder.position.set(0, 1, 0);
	upperShoulder.userData.explodeWithParent = true;
	const lidSeam = kit.pivot("rice-cooker-lid-seat-seam", bodyPivot);
	for (const [name, width, depth, x, z] of [[
		"front",
		1.24,
		.014,
		0,
		.57
	], [
		"rear",
		1.24,
		.014,
		0,
		-.57
	]]) kit.mesh(`rice-cooker-lid-seam-${name}`, new RoundedBoxGeometry(width, .016, depth, 2, .006), accentDeep, lidSeam, false).position.set(x, 1.115, z);
	const lidPivot = kit.pivot("rice-cooker-lid-hinge-pivot", bodyPivot);
	lidPivot.position.set(0, 1.1, -.61);
	lidPivot.userData.rotationAxis = [
		1,
		0,
		0
	];
	lidPivot.userData.rotationRange = [-.34, 0];
	kit.socket("rice-cooker-lid-hinge-socket", lidPivot, [
		0,
		0,
		0
	]);
	const lidShell = kit.mesh("rice-cooker-domed-lid-shell", softUpperDome(.9, .4, .7), accent, lidPivot);
	lidShell.position.set(0, .02, .61);
	lidShell.userData.part = "lid-shell";
	const lidTopCrown = kit.mesh("rice-cooker-lid-small-top-crown", new RoundedBoxGeometry(.48, .055, .35, 3, .024), accentSoft, lidPivot, false);
	lidTopCrown.position.set(0, .41, .61);
	lidTopCrown.userData.explodeWithParent = true;
	kit.mesh("rice-cooker-front-lid-release-seat", new RoundedBoxGeometry(.32, .15, .055, 3, .022), accentDeep, lidPivot, false).position.set(0, .19, 1.305);
	const releaseButton = kit.mesh("rice-cooker-front-lid-release", new RoundedBoxGeometry(.31, .135, .072, 4, .03), shellLight, lidPivot);
	releaseButton.position.set(0, .19, 1.34);
	kit.socket("rice-cooker-release-button-socket", releaseButton, [
		0,
		0,
		.045
	]);
	kit.mesh("rice-cooker-top-steam-seat", new RoundedBoxGeometry(.38, .045, .14, 3, .02), accentDeep, lidPivot, false).position.set(0, .445, .58);
	kit.mesh("rice-cooker-top-steam-slot", new RoundedBoxGeometry(.27, .025, .045, 2, .01), seam, lidPivot, false).position.set(0, .475, .58);
	kit.socket("rice-cooker-steam-socket", lidPivot, [
		0,
		.49,
		.58
	]);
	const innerPotPivot = kit.pivot("rice-cooker-inner-pot-pivot", bodyPivot);
	const innerPot = kit.mesh("rice-cooker-deep-gray-inner-pot", new CylinderGeometry(.69, .61, .3, 28, 1, true), innerPotMaterial, innerPotPivot);
	innerPot.position.y = 1.02;
	const innerRim = kit.mesh("rice-cooker-inner-pot-rim", new TorusGeometry(.69, .035, 8, 30), innerPotMaterial, innerPotPivot, false);
	innerRim.rotation.x = Math.PI * .5;
	innerRim.position.y = 1.17;
	const riceSurface = kit.mesh("rice-cooker-white-rice-surface", new CylinderGeometry(.61, .61, .065, 28), riceMaterial, innerPotPivot, false);
	riceSurface.position.y = 1.145;
	const riceKernelGeometry = new CapsuleGeometry(.038, .11, 5, 8);
	riceKernelGeometry.rotateZ(Math.PI * .5);
	const riceCreaseGeometry = tubeThrough([
		new Vector3(-.046, 0, 0),
		new Vector3(0, -.005, 0),
		new Vector3(.046, 0, 0)
	], .007);
	const riceBedLayout = [
		[-.42, -.26],
		[-.2, -.29],
		[.03, -.3],
		[.27, -.25],
		[-.48, -.04],
		[-.25, -.06],
		[0, -.08],
		[.24, -.04],
		[.46, -.01],
		[-.4, .18],
		[-.18, .16],
		[.06, .17],
		[.29, .18],
		[-.26, .36],
		[-.04, .34],
		[.2, .35],
		[-.08, -.46],
		[.15, -.44],
		[.49, .12],
		[-.46, .31],
		[.43, .3],
		[-.34, -.42],
		[.36, -.4],
		[-.12, -.27],
		[.13, -.22],
		[-.52, -.2],
		[.52, -.18],
		[-.33, .02],
		[.37, .02],
		[0, .02]
	];
	riceBedLayout.forEach(([x, z], index) => {
		const kernel = kit.pivot(`rice-cooker-bed-kernel-${index + 1}-pivot`, innerPotPivot);
		kernel.position.set(x, 1.205 + index % 3 * .006, z);
		kernel.rotation.y = index * 47 % 180 * Math.PI / 180;
		kernel.rotation.z = (index % 3 - 1) * .08;
		addSculptedRiceKernel(kit, kernel, `rice-cooker-bed-kernel-${index + 1}`, riceKernelGeometry, riceCreaseGeometry, riceMaterial, riceCreaseMaterial);
	});
	const airborneRiceRig = kit.pivot("rice-cooker-airborne-rice-rig");
	const airborneAngles = shuffledRiceAngles(28);
	const flightRandom = seededRandom(2709192885);
	for (let index = 0; index < 28; index += 1) {
		const kernel = kit.pivot(`rice-cooker-airborne-kernel-${index + 1}-pivot`, airborneRiceRig);
		const angle = airborneAngles[index];
		const outwardDistance = 1.5 + flightRandom() * .68;
		kernel.userData.flightIndex = index;
		kernel.userData.launchTime = 1.08 + index * .104;
		kernel.userData.flightDuration = 1.08 + flightRandom() * .14;
		kernel.userData.apexHeight = 1.05 + flightRandom() * .52;
		kernel.userData.startPosition = [
			Math.cos(angle) * (.6 + flightRandom() * .08),
			1.16 + flightRandom() * .025,
			Math.sin(angle) * (.53 + flightRandom() * .07)
		];
		kernel.userData.driftX = Math.cos(angle) * outwardDistance;
		kernel.userData.driftZ = Math.sin(angle) * (outwardDistance * .9);
		kernel.position.fromArray(kernel.userData.startPosition);
		kernel.rotation.y = index * .73;
		kernel.visible = false;
		addSculptedRiceKernel(kit, kernel, `rice-cooker-airborne-kernel-${index + 1}`, riceKernelGeometry, riceCreaseGeometry, riceMaterial, riceCreaseMaterial);
	}
	const steamSocket = kit.root.getObjectByName("rice-cooker-steam-socket");
	if (steamSocket) for (let index = 0; index < 8; index += 1) {
		const material = kit.material(16776179, {
			tint: 10326442,
			emissive: accentLight,
			transparent: true,
			opacity: 0
		});
		material.depthWrite = false;
		const puff = kit.pivot(`rice-cooker-volumetric-steam-puff-${index + 1}-pivot`, steamSocket);
		puff.userData.steamPuffIndex = index;
		puff.userData.lateralBias = (index % 3 - 1) * .055;
		puff.userData.baseScale = .82 + index % 4 * .08;
		puff.visible = false;
		[
			[
				0,
				0,
				0,
				.17
			],
			[
				-.12,
				.07,
				.015,
				.115
			],
			[
				.12,
				.08,
				-.018,
				.12
			],
			[
				-.035,
				.18,
				.02,
				.105
			]
		].forEach(([x, y, z, radius], lobeIndex) => {
			kit.mesh(`rice-cooker-volumetric-steam-puff-${index + 1}-lobe-${lobeIndex + 1}`, new IcosahedronGeometry(radius, 1), material, puff, false).position.set(x, y, z);
		});
	}
	const panel = kit.mesh("rice-cooker-front-control-island", new CapsuleGeometry(.19, .3, 4, 10), accent, bodyPivot);
	panel.position.set(0, .6, .69);
	panel.scale.z = .19;
	panel.userData.part = "control-island";
	const panelFrame = kit.mesh("rice-cooker-front-control-island-frame", new CapsuleGeometry(.225, .31, 4, 10), accentDeep, bodyPivot);
	panelFrame.position.set(0, .6, .675);
	panelFrame.scale.z = .17;
	panelFrame.userData.explodeWithParent = true;
	kit.mesh("rice-cooker-status-lamp-left", new SphereGeometry(.046, 8, 5), kit.indicatorMaterial, bodyPivot, false).position.set(-.09, .75, .745);
	kit.mesh("rice-cooker-status-lamp-right", new SphereGeometry(.046, 8, 5), warmLamp, bodyPivot, false).position.set(.09, .75, .745);
	const switchPivot = kit.pivot("rice-cooker-cook-switch-pivot", bodyPivot);
	switchPivot.position.set(0, .48, .742);
	switchPivot.userData.rotationAxis = [
		1,
		0,
		0
	];
	switchPivot.userData.rotationRange = [-.18, .08];
	kit.socket("rice-cooker-switch-socket", switchPivot, [
		0,
		0,
		0
	]);
	kit.mesh("rice-cooker-switch-seat", new RoundedBoxGeometry(.27, .16, .065, 3, .028), accentDeep, switchPivot, false);
	const cookSwitch = kit.mesh("rice-cooker-cook-switch", new RoundedBoxGeometry(.22, .105, .085, 3, .032), shellLight, switchPivot);
	cookSwitch.position.z = .055;
	kit.mesh("rice-cooker-side-control-seat", new RoundedBoxGeometry(.07, .32, .25, 3, .03), accentDeep, bodyPivot, false).position.set(-.88, .72, .03);
	kit.mesh("rice-cooker-side-control", new RoundedBoxGeometry(.055, .13, .15, 3, .025), accent, bodyPivot).position.set(-.92, .74, .03);
	const rearHinge = kit.mesh("rice-cooker-rear-lid-hinge", new CylinderGeometry(.1, .1, .58, 10), accentDeep, bodyPivot);
	rearHinge.rotation.z = Math.PI * .5;
	rearHinge.position.set(0, 1.07, -.68);
	for (const x of [-.32, .32]) {
		const collar = kit.mesh(`rice-cooker-rear-hinge-collar-${x < 0 ? "left" : "right"}`, new CylinderGeometry(.13, .13, .12, 10), accent, bodyPivot);
		collar.rotation.z = Math.PI * .5;
		collar.position.set(x, 1.07, -.68);
	}
	const latchPivot = kit.pivot("rice-cooker-rear-latch-pivot", bodyPivot);
	latchPivot.position.set(0, 1.08, -.72);
	latchPivot.userData.rotationAxis = [
		1,
		0,
		0
	];
	latchPivot.userData.rotationRange = [-.04, .06];
	kit.socket("rice-cooker-latch-socket", latchPivot, [
		0,
		0,
		0
	]);
	const latch = kit.mesh("rice-cooker-rear-carry-latch", tubeThrough([
		new Vector3(-.31, .02, 0),
		new Vector3(-.31, -.21, 0),
		new Vector3(-.24, -.34, 0),
		new Vector3(.24, -.34, 0),
		new Vector3(.31, -.21, 0),
		new Vector3(.31, .02, 0)
	], .085), shellLight, latchPivot);
	latch.userData.part = "rear-latch";
	const powerPlate = kit.mesh("rice-cooker-rear-power-plate", new RoundedBoxGeometry(.38, .25, .065, 3, .03), accent, bodyPivot);
	powerPlate.position.set(0, .34, -.705);
	kit.mesh("rice-cooker-figure-eight-inlet", new RoundedBoxGeometry(.25, .13, .055, 3, .025), rubber, bodyPivot).position.set(0, .34, -.75);
	for (const x of [-.055, .055]) {
		const hole = kit.mesh(`rice-cooker-power-hole-${x < 0 ? "left" : "right"}`, new CylinderGeometry(.029, .029, .04, 9), seam, bodyPivot, false);
		hole.rotation.x = Math.PI * .5;
		hole.position.set(x, .34, -.79);
	}
	kit.socket("rice-cooker-power-socket", powerPlate, [
		0,
		0,
		-.08
	]);
	for (const [index, x, z] of [
		[
			1,
			-.57,
			.44
		],
		[
			2,
			.57,
			.44
		],
		[
			3,
			-.57,
			-.44
		],
		[
			4,
			.57,
			-.44
		]
	]) kit.mesh(`rice-cooker-foot-${index}`, new RoundedBoxGeometry(.22, .1, .18, 2, .045), rubber, kit.root, false).position.set(x, .05, z);
	const build = kit.finish({
		referencePath: options.referencePath ?? V2_REFERENCE_PATH,
		reconstructed: [
			"wide squat rounded cream cooker body with a recessed lower skirt and stable four-foot stance",
			"large pink domed lid with a fixed dark horizontal seam, broad upper crown, front release and top steam slot",
			"front vertical oval control island with paired lamps, inset panel and a large independently pivoted rocker switch",
			"small side control plus separate rear hinge tube, hinge collars and thick U-shaped latch/handle",
			"rear accent power plate, dark figure-eight inlet and two recessed socket holes",
			"activation-ready lid hinge, rear latch, cook switch, steam outlet and power sockets",
			"one reusable outlined rice-kernel form with a dorsal crease shared by the visible pot bed and every airborne grain",
			"socket-bound multi-lobe volumetric steam plus a powered high-low lid rhythm that settles without detaching the lid"
		],
		inferred: [
			"the local reference image path was unavailable to this worker; proportions were reconstructed from the supplied front/side/rear task image",
			"the inner pot, heater plate, thermostat, insulation, wiring and lid seal are hidden and intentionally not modeled",
			"the exact rear hinge linkage and underside fastener pattern are concealed; closed attachment volumes are used",
			"the steam outlet follows the visible top slot, while the internal vapour channel is functional inference"
		]
	});
	build.root.userData.riceCookerEffectContract = {
		modelOwner: "rice-cooker-model-rig",
		timelineOwner: "RiceCookerPerformance",
		sharedSpectacleEffects: "must-be-disabled-during-integration",
		riceBedKernels: riceBedLayout.length,
		airborneRiceKernels: 28,
		steamVolumes: 8,
		flatEffects: 0
	};
	build.root.userData.legacyReferencePath = REFERENCE_PATH;
	applyRiceCookerOutlineHierarchy(build.root);
	build.root.userData.sculptRuntime.colliders = [{
		id: "rice-cooker-body-collider",
		type: "box",
		node: "rice-cooker-body-pivot"
	}, {
		id: "rice-cooker-lid-collider",
		type: "box",
		node: "rice-cooker-lid-hinge-pivot"
	}];
	build.root.userData.sculptRuntime.destructionGroups = [
		{
			id: "rice-cooker-body-group",
			nodes: ["rice-cooker-body-pivot"]
		},
		{
			id: "rice-cooker-lid-group",
			nodes: ["rice-cooker-lid-hinge-pivot"]
		},
		{
			id: "rice-cooker-control-group",
			nodes: ["rice-cooker-cook-switch-pivot"]
		},
		{
			id: "rice-cooker-rear-group",
			nodes: ["rice-cooker-rear-latch-pivot"]
		}
	];
	return build;
}
//#endregion
export { riceCooker_exports as n, createRiceCookerModel as t };

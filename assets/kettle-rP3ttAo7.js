import { t as __exportAll } from "./rolldown-runtime-D7D4PA-g.js";
import { G as IcosahedronGeometry, Qn as TubeGeometry, S as CylinderGeometry, Xn as TorusGeometry, Z as LatheGeometry, dr as Vector3, ht as Mesh, p as Color, u as CatmullRomCurve3, ur as Vector2 } from "./three.core-DlTOC7bx.js";
import { i as RoundedBoxGeometry } from "./BufferGeometryUtils-CtH-hlZf.js";
import { a as setHullOutlineStyle, d as ApplianceModelKit, f as orientCylinderBetween } from "./outline-Cv1Jem2g.js";
//#region src/appliances/models/kettle.ts
var kettle_exports = /* @__PURE__ */ __exportAll({ createKettleModel: () => createKettleModel });
var REFERENCE_PATH = "D:/downloads/ChatGPT Image 2026-08-02 20_03_02 (1).png";
var V2_REFERENCE_PATH = "references/intake-v2/kettle/views/front.png";
function stableOutlinePhase(name) {
	let hash = 2166136261;
	for (let index = 0; index < name.length; index += 1) {
		hash ^= name.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return (hash >>> 0) % 1e4 * (Math.PI * 2 / 1e4);
}
function applyKettleOutlineHierarchy(root) {
	const mainSilhouette = /rounded-tapered-body-shell|cream-shoulder-band|circular-power-base|power-base-accent-ring|separate-domed-lid|short-metal-spout|handle-accent-outer-strap/;
	const fineDetail = /water-gauge-tick|power-switch-index|lid-top-button|rubber-foot|rear-power-cable-port/;
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
function tone(accent, lightness, saturation = 0) {
	return new Color(accent).offsetHSL(0, saturation, lightness).getHex();
}
function lathe(points, segments = 12) {
	return new LatheGeometry(points.map(([radius, y]) => new Vector2(radius, y)), segments);
}
function tubeThrough(points, radius) {
	return new TubeGeometry(new CatmullRomCurve3([...points], false, "centripetal"), 24, radius, 8, false);
}
function irregularSteamLobe(radius, seed) {
	const geometry = new IcosahedronGeometry(radius, 1);
	const position = geometry.getAttribute("position");
	for (let index = 0; index < position.count; index += 1) {
		const x = position.getX(index);
		const y = position.getY(index);
		const z = position.getZ(index);
		const deformation = 1 + Math.sin(x * (11.7 + seed * .31) + y * (8.9 + seed * .23) + z * (13.1 + seed * .17) + seed * 1.73) * .105;
		position.setXYZ(index, x * deformation, y * deformation, z * deformation);
	}
	position.needsUpdate = true;
	geometry.computeVertexNormals();
	return geometry;
}
/**
* Animation-ready Sakura reconstruction of the supplied electric-kettle tri-view.
* Local frame: +Y up, +Z front, floor at Y=0. The lid, handle, switch,
* gauge water, bubbles and spout socket are separate runtime assemblies.
*/
function createKettleModel(options) {
	const kit = new ApplianceModelKit(options);
	const accentLight = tone(options.accent, .2, -.08);
	const accentMid = tone(options.accent, .08, -.04);
	const accentDark = tone(options.accent, -.13, .01);
	const shell = kit.material(16117473, { tint: 7694974 });
	const shellLight = kit.material(16775146, { tint: 8220804 });
	const accent = kit.material(accentMid, { tint: 6839153 });
	const accentDeep = kit.material(accentDark, { tint: 5720928 });
	const seam = kit.material(6841457, { tint: 5064534 });
	const rubber = kit.material(5196888, { tint: 4077894 });
	const metal = kit.material(11120048, { tint: 6249322 });
	const gauge = kit.material(12968927, {
		tint: 7179668,
		transparent: true,
		opacity: .62
	});
	gauge.depthWrite = false;
	const water = kit.material(accentLight, {
		tint: 6453130,
		emissive: accentLight,
		transparent: true,
		opacity: .2
	});
	water.depthWrite = false;
	water.emissiveIntensity = 0;
	const bodyPivot = kit.pivot("kettle-body-pivot");
	const body = kit.mesh("kettle-rounded-tapered-body-shell", lathe([
		[0, .27],
		[.7, .27],
		[.82, .34],
		[.88, .48],
		[.82, 1.68],
		[.72, 1.86],
		[.55, 1.94],
		[0, 1.94]
	], 12), accent, bodyPivot);
	body.userData.part = "body-shell";
	const shoulder = kit.mesh("kettle-cream-shoulder-band", lathe([
		[0, 1.73],
		[.75, 1.73],
		[.79, 1.81],
		[.7, 1.93],
		[0, 1.98]
	], 12), shell, bodyPivot);
	shoulder.userData.part = "shoulder-band";
	const lowerRail = kit.mesh("kettle-lower-cream-rail", lathe([
		[0, .2],
		[.72, .2],
		[.84, .27],
		[.88, .39],
		[0, .39]
	], 12), shell, bodyPivot);
	lowerRail.userData.explodeWithParent = true;
	const bodySeam = kit.mesh("kettle-body-base-seam", new TorusGeometry(.845, .018, 6, 12), seam, bodyPivot, false);
	bodySeam.rotation.x = Math.PI * .5;
	bodySeam.position.y = .39;
	bodySeam.userData.explodeWithParent = true;
	const powerBase = kit.pivot("kettle-power-base-pivot");
	const base = kit.mesh("kettle-circular-power-base", new CylinderGeometry(.89, .84, .2, 12), shellLight, powerBase);
	base.position.y = .12;
	const baseAccent = kit.mesh("kettle-power-base-accent-ring", new CylinderGeometry(.9, .89, .07, 12), accentDeep, powerBase);
	baseAccent.position.y = .055;
	const lidPivot = kit.pivot("kettle-lid-hinge-pivot", bodyPivot);
	lidPivot.position.set(0, 1.93, -.48);
	lidPivot.userData.rotationAxis = [
		1,
		0,
		0
	];
	lidPivot.userData.rotationRange = [0, 1];
	kit.socket("kettle-lid-hinge-socket", lidPivot, [
		0,
		0,
		0
	]);
	kit.mesh("kettle-separate-domed-lid", new CylinderGeometry(.49, .57, .16, 12), shellLight, lidPivot).position.set(0, .09, .48);
	const lidSeat = kit.mesh("kettle-lid-seat-ring", new TorusGeometry(.53, .022, 6, 12), seam, lidPivot, false);
	lidSeat.rotation.x = Math.PI * .5;
	lidSeat.position.set(0, .01, .48);
	kit.mesh("kettle-lid-top-button", new RoundedBoxGeometry(.32, .08, .22, 3, .04), accent, lidPivot).position.set(0, .21, .44);
	const spoutPivot = kit.pivot("kettle-spout-pivot", bodyPivot);
	kit.socket("kettle-spout-body-socket", spoutPivot, [
		-.62,
		1.52,
		.02
	]);
	const spoutStart = new Vector3(-.61, 1.48, .02);
	const spoutEnd = new Vector3(-1.05, 1.79, .02);
	const spout = kit.mesh("kettle-short-metal-spout", new CylinderGeometry(.16, .32, 1, 10, 1, false), metal, spoutPivot);
	orientCylinderBetween(spout, spoutStart, spoutEnd);
	const spoutDirection = spoutEnd.clone().sub(spoutStart).normalize();
	const spoutOutlet = spoutEnd.clone().addScaledVector(spoutDirection, .018);
	const spoutLip = kit.mesh("kettle-spout-outlet-lip", new TorusGeometry(.145, .027, 6, 14), seam, spoutPivot);
	spoutLip.position.copy(spoutOutlet);
	spoutLip.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), spoutDirection);
	const steamSocket = kit.socket("kettle-spout-steam-socket", spoutPivot, spoutOutlet);
	const puffLayouts = [
		[
			[
				0,
				0,
				0,
				1
			],
			[
				-.13,
				.05,
				.01,
				.72
			],
			[
				.13,
				.08,
				-.03,
				.78
			],
			[
				-.02,
				.19,
				.04,
				.82
			],
			[
				.02,
				.02,
				.09,
				.68
			]
		],
		[
			[
				0,
				0,
				0,
				.92
			],
			[
				-.1,
				.11,
				.03,
				.8
			],
			[
				.15,
				.04,
				.02,
				.69
			],
			[
				.05,
				.2,
				-.04,
				.88
			],
			[
				-.04,
				.06,
				.1,
				.62
			]
		],
		[
			[
				0,
				.03,
				0,
				1.04
			],
			[
				-.15,
				.08,
				-.01,
				.65
			],
			[
				.12,
				.13,
				.05,
				.81
			],
			[
				-.03,
				.23,
				-.02,
				.74
			],
			[
				.05,
				.02,
				.11,
				.72
			]
		]
	];
	for (let puffIndex = 0; puffIndex < 7; puffIndex += 1) {
		const pivot = kit.pivot(`kettle-volumetric-steam-puff-${puffIndex + 1}-pivot`, steamSocket);
		pivot.visible = false;
		pivot.userData.steamPuffIndex = puffIndex;
		pivot.userData.phaseOffset = puffIndex * .18;
		pivot.userData.baseScale = .86 + puffIndex % 3 * .11;
		pivot.userData.lateralBias = (puffIndex % 3 - 1) * .035;
		pivot.userData.twistRate = .34 + puffIndex % 4 * .09;
		const shellMaterial = kit.material(16774895, {
			tint: 9405846,
			emissive: 16047335,
			transparent: true,
			opacity: 0
		});
		shellMaterial.depthWrite = false;
		shellMaterial.emissiveIntensity = .045;
		const shadeMaterial = kit.material(14604517, {
			tint: 7629695,
			emissive: 14008270,
			transparent: true,
			opacity: 0
		});
		shadeMaterial.depthWrite = false;
		shadeMaterial.emissiveIntensity = .025;
		const layout = puffLayouts[puffIndex % puffLayouts.length];
		layout.forEach(([x, y, z, scale], lobeIndex) => {
			const lobe = kit.mesh(`kettle-steam-puff-${puffIndex + 1}-lobe-${lobeIndex + 1}`, irregularSteamLobe(.24 * scale, puffIndex * 7 + lobeIndex + 1), lobeIndex === layout.length - 1 ? shadeMaterial : shellMaterial, pivot, false);
			lobe.position.set(x, y, z);
			lobe.scale.set(.84 + (puffIndex + lobeIndex) % 3 * .09, 1.02 + (puffIndex * 2 + lobeIndex) % 3 * .12, .78 + (puffIndex + lobeIndex * 2) % 4 * .08);
			lobe.userData.explodeWithParent = true;
			lobe.userData.volumeEffect = "stylized-condensed-steam";
		});
	}
	const handlePivot = kit.pivot("kettle-handle-pivot", bodyPivot);
	const handlePoints = [
		new Vector3(.56, 1.65, -.18),
		new Vector3(.88, 1.64, -.18),
		new Vector3(1.06, 1.44, -.18),
		new Vector3(1.11, 1.1, -.18),
		new Vector3(1.07, .74, -.18),
		new Vector3(.89, .56, -.18),
		new Vector3(.6, .55, -.18)
	];
	kit.socket("kettle-handle-upper-socket", handlePivot, handlePoints[0]);
	kit.socket("kettle-handle-lower-socket", handlePivot, handlePoints.at(-1));
	const handleOuter = kit.mesh("kettle-handle-accent-outer-strap", tubeThrough(handlePoints, .145), accentDeep, handlePivot);
	handleOuter.userData.part = "handle";
	const handleInner = kit.mesh("kettle-handle-cream-inner-grip", tubeThrough(handlePoints, .095), shellLight, handlePivot);
	handleInner.userData.explodeWithParent = true;
	const gaugePanel = kit.mesh("kettle-front-water-level-window", new RoundedBoxGeometry(.24, .92, .045, 4, .11), gauge, bodyPivot, false);
	gaugePanel.position.set(-.15, 1.1, .815);
	gaugePanel.renderOrder = 3;
	const gaugeWater = kit.mesh("kettle-gauge-water-volume", new RoundedBoxGeometry(.17, .62, .035, 3, .075), water, bodyPivot, false);
	gaugeWater.position.set(-.15, .98, .845);
	gaugeWater.renderOrder = 2;
	for (let index = 0; index < 7; index += 1) {
		const tick = kit.mesh(`kettle-water-gauge-tick-${index + 1}`, new RoundedBoxGeometry(.055, .013, .014, 1, .005), seam, bodyPivot, false);
		tick.position.set(-.15, .82 + index * .095, .875);
		tick.userData.explodeWithParent = true;
	}
	const switchPivot = kit.pivot("kettle-power-switch-pivot", bodyPivot);
	switchPivot.position.set(.12, .5, .86);
	switchPivot.userData.rotationAxis = [
		1,
		0,
		0
	];
	switchPivot.userData.rotationRange = [-.14, .1];
	const switchSeat = kit.mesh("kettle-power-switch-seat", new CylinderGeometry(.105, .105, .035, 16), accentDeep, switchPivot);
	switchSeat.rotation.x = Math.PI * .5;
	const powerSwitch = kit.mesh("kettle-power-switch-button", new CylinderGeometry(.078, .082, .055, 16), accent, switchPivot);
	powerSwitch.rotation.x = Math.PI * .5;
	powerSwitch.position.z = .03;
	kit.mesh("kettle-power-switch-index", new RoundedBoxGeometry(.018, .072, .014, 1, .006), seam, switchPivot, false).position.set(0, .026, .064);
	kit.indicator([
		.12,
		.5,
		.93
	], .025);
	const rearSocket = kit.mesh("kettle-rear-power-cable-port", new RoundedBoxGeometry(.22, .13, .05, 2, .04), rubber, powerBase);
	rearSocket.position.set(0, .13, -.86);
	kit.socket("kettle-rear-power-socket", rearSocket, [
		0,
		0,
		-.045
	]);
	for (const [index, x, z] of [
		[
			1,
			-.56,
			.4
		],
		[
			2,
			.56,
			.4
		],
		[
			3,
			-.56,
			-.4
		],
		[
			4,
			.56,
			-.4
		]
	]) kit.mesh(`kettle-rubber-foot-${index}`, new CylinderGeometry(.085, .1, .07, 10), rubber, kit.root, false).position.set(x, .035, z);
	applyKettleOutlineHierarchy(kit.root);
	const build = kit.finish({
		referencePath: options.referencePath ?? V2_REFERENCE_PATH,
		reconstructed: [
			"twelve-sided tapered kettle shell with a narrower shoulder, broad lower belly and separate two-tier electrical base",
			"independent cream lid, top button, lid seam and animation-ready rear hinge pivot",
			"short upward low-saturation metal spout with dark lip and a true steam socket",
			"large open D-shaped handle with accent rim, cream grip and upper/lower body attachment sockets",
			"front translucent water-level window, separate water volume and seven repeated measurement marks",
			"front power switch/status light, rear power port and four low rubber feet",
			"named body, switch and lid pivots plus one spout socket for the unified performance module",
			"seven staggered volumetric steam-puff assemblies built from lit, vertex-deformed low-poly lobes"
		],
		inferred: [
			"the local reference file path was unavailable to this worker; proportions were reconstructed from the supplied tri-view embedded in the task",
			"internal heating plate, thermostat, wiring, insulation and lid seal are hidden and intentionally not modeled",
			"rear cable-port depth and underside four-foot arrangement are inferred because the reference does not expose the underside clearly",
			"handle screws and internal upper/lower reinforcement are inferred as closed attachments rather than fabricated hardware"
		]
	});
	build.root.userData.kettlePerformanceRig = {
		timelineOwner: "AppliancePerformanceSystem",
		effectOwner: "kettle-model-rig",
		wholeMachineNode: build.root.name,
		bodyPivot: "kettle-body-pivot",
		lidPivot: "kettle-lid-hinge-pivot",
		switchPivot: "kettle-power-switch-pivot",
		steamSocket: "kettle-spout-steam-socket",
		steamPuffs: Array.from({ length: 7 }, (_, index) => `kettle-volumetric-steam-puff-${index + 1}-pivot`)
	};
	build.root.userData.previewLightingProfile = "sakura-appliance-v2";
	build.root.userData.previewFramingScale = .94;
	build.root.userData.legacyReferencePath = REFERENCE_PATH;
	build.root.userData.referenceDimensions = {
		lidHinge: [
			0,
			1.93,
			-.48
		],
		spoutBodySocket: [
			-.62,
			1.52,
			.02
		],
		switchPivot: [
			.12,
			.5,
			.86
		],
		rearPowerSocket: [
			0,
			.13,
			-.905
		]
	};
	build.root.userData.sculptRuntime.colliders = [
		{
			id: "kettle-body",
			type: "cylinder",
			node: "kettle-body-pivot"
		},
		{
			id: "kettle-lid",
			type: "cylinder",
			node: "kettle-lid-hinge-pivot",
			trigger: true
		},
		{
			id: "kettle-base",
			type: "cylinder",
			node: "kettle-power-base-pivot"
		}
	];
	build.root.userData.sculptRuntime.destructionGroups = [
		[
			"kettle-body-pivot",
			"kettle-front-water-level-window",
			"kettle-power-switch-pivot"
		],
		["kettle-lid-hinge-pivot"],
		["kettle-spout-pivot", "kettle-spout-steam-socket"],
		["kettle-handle-pivot"],
		["kettle-power-base-pivot"]
	];
	return build;
}
//#endregion
export { kettle_exports as n, createKettleModel as t };

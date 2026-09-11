import { t as __exportAll } from "./rolldown-runtime-D7D4PA-g.js";
import { Hn as SphereGeometry, I as ExtrudeGeometry, Ln as Shape, S as CylinderGeometry, Xn as TorusGeometry, dr as Vector3, ht as Mesh, i as BoxGeometry, p as Color } from "./three.core-DlTOC7bx.js";
import { a as setHullOutlineStyle, d as ApplianceModelKit, f as orientCylinderBetween } from "./outline-DAm9XhPL.js";
//#region src/appliances/models/fan.ts
var fan_exports = /* @__PURE__ */ __exportAll({ createFanModel: () => createFanModel });
var REFERENCE_PATH = "D:/下载文件/ChatGPT Image 2026年8月2日 19_55_16 (2).png";
function extrudedProfile(points, depth, bevelSize) {
	const shape = new Shape();
	points.forEach(([x, y], index) => {
		if (index === 0) shape.moveTo(x, y);
		else shape.lineTo(x, y);
	});
	shape.closePath();
	const geometry = new ExtrudeGeometry(shape, {
		depth,
		steps: 1,
		bevelEnabled: bevelSize > 0,
		bevelSegments: 2,
		bevelSize,
		bevelThickness: bevelSize,
		curveSegments: 4
	});
	geometry.translate(0, 0, -depth * .5);
	geometry.computeVertexNormals();
	return geometry;
}
function curvedBladeGeometry() {
	const blade = new Shape();
	blade.moveTo(.055, .005);
	blade.bezierCurveTo(.14, .012, .26, .04, .36, .12);
	blade.bezierCurveTo(.43, .2, .45, .3, .38, .36);
	blade.bezierCurveTo(.31, .4, .2, .34, .145, .24);
	blade.bezierCurveTo(.09, .15, .06, .075, .055, .005);
	const geometry = new ExtrudeGeometry(blade, {
		depth: .042,
		steps: 1,
		bevelEnabled: true,
		bevelSegments: 2,
		bevelSize: .012,
		bevelThickness: .01,
		curveSegments: 8
	});
	geometry.translate(0, 0, -.021);
	geometry.computeVertexNormals();
	return geometry;
}
function addRing(kit, name, radius, tube, z, material, parent, outlined = false) {
	const ring = kit.mesh(name, new TorusGeometry(radius, tube, 6, 32), material, parent, outlined);
	ring.position.z = z;
	return ring;
}
function addSpoke(kit, name, angle, innerRadius, outerRadius, z, material, parent) {
	const start = new Vector3(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius, z);
	const end = new Vector3(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius, z);
	const spoke = kit.mesh(name, new CylinderGeometry(.012, .012, 1, 6), material, parent, false);
	orientCylinderBetween(spoke, start, end);
}
function addGuardBridge(kit, name, angle, radius, rearZ, frontZ, material, parent) {
	const x = Math.cos(angle) * radius;
	const y = Math.sin(angle) * radius;
	const bridge = kit.mesh(name, new CylinderGeometry(.026, .026, 1, 6), material, parent, false);
	orientCylinderBetween(bridge, new Vector3(x, y, rearZ), new Vector3(x, y, frontZ));
	bridge.userData.part = "guard-cage";
}
function accentVariation(accent, lightnessOffset) {
	const color = new Color(accent);
	color.offsetHSL(0, -.06, lightnessOffset);
	return color.getHex();
}
function stableOutlinePhase(name) {
	let hash = 2166136261;
	for (let index = 0; index < name.length; index += 1) {
		hash ^= name.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return (hash >>> 0) % 1e4 * (Math.PI * 2 / 1e4);
}
function applyFanOutlineHierarchy(root) {
	const mainSilhouette = /base-shell|base-accent-rail|motor-barrel|front-outer-ring|rear-outer-ring/;
	const detail = /speed-dial-index|status-indicator|rear-vent|medallion-sakura|motor-shaft/;
	root.traverse((object) => {
		if (!(object instanceof Mesh) || object.userData.isOutline !== true) return;
		const parentName = object.parent?.name ?? object.name;
		const tier = mainSilhouette.test(parentName) ? "main" : detail.test(parentName) ? "detail" : "structure";
		setHullOutlineStyle(object, {
			thickness: tier === "main" ? .0048 : tier === "structure" ? .0041 : .0033,
			variation: .18,
			phase: stableOutlinePhase(parentName)
		});
		object.userData.outlineTier = tier;
		object.userData.outlineStable = true;
	});
}
function createFanModel(options) {
	const kit = new ApplianceModelKit(options);
	const shellMaterial = kit.material(15657180, { tint: 7760512 });
	const seamMaterial = kit.material(7761788, { tint: 6182504 });
	const accentMaterial = kit.material(options.accent, { tint: 6707571 });
	const bladeMaterial = kit.material(accentVariation(options.accent, .1), { tint: 7626871 });
	const guardMaterial = kit.material(15854303, { tint: 7103092 });
	const darkMaterial = kit.material(6117735, { tint: 4998741 });
	const baseShell = kit.mesh("fan-base-shell", extrudedProfile([
		[-.5, -.84],
		[.5, -.84],
		[.44, -.56],
		[-.42, -.56]
	], .66, .045), shellMaterial);
	baseShell.userData.part = "base-shell";
	const baseRail = kit.mesh("fan-base-accent-rail", extrudedProfile([
		[-.52, -.87],
		[.52, -.87],
		[.5, -.79],
		[-.5, -.79]
	], .68, .025), accentMaterial);
	baseRail.userData.explodeWithParent = true;
	const baseSeam = kit.mesh("fan-base-panel-seam", new BoxGeometry(.88, .012, .688), seamMaterial, kit.root, false);
	baseSeam.position.y = -.785;
	baseSeam.userData.explodeWithParent = true;
	const dialPivot = kit.pivot("fan-speed-dial-pivot");
	dialPivot.position.set(0, -.675, .305);
	const dial = kit.mesh("fan-speed-dial", new CylinderGeometry(.105, .105, .075, 16), accentMaterial, dialPivot);
	dial.rotation.x = Math.PI * .5;
	const dialInset = kit.mesh("fan-speed-dial-index", new BoxGeometry(.014, .075, .012), darkMaterial, dialPivot, true);
	dialInset.position.set(0, .012, .045);
	dialInset.userData.explodeWithParent = true;
	kit.indicator([
		0,
		-.535,
		.294
	], .025);
	const supportColumn = kit.mesh("fan-support-column", extrudedProfile([
		[-.115, 0],
		[.115, 0],
		[.085, .76],
		[-.085, .76]
	], .16, .022), shellMaterial);
	supportColumn.position.set(0, -.55, -.33);
	supportColumn.userData.part = "support-column";
	const supportCollar = kit.mesh("fan-support-collar", new CylinderGeometry(.13, .14, .065, 12), accentMaterial);
	supportCollar.position.set(0, .2, -.33);
	supportCollar.userData.part = "support-column";
	const oscillationPivot = kit.pivot("fan-oscillation-pivot");
	oscillationPivot.position.set(0, .25, -.33);
	const headHinge = kit.pivot("fan-head-hinge", oscillationPivot);
	headHinge.position.set(0, 0, .33);
	kit.socket("fan-head-socket", headHinge, [
		0,
		0,
		0
	]);
	const hingeBody = kit.mesh("fan-head-hinge-body", new CylinderGeometry(.12, .12, .26, 12), shellMaterial, headHinge);
	hingeBody.rotation.z = Math.PI * .5;
	const hingeCap = kit.mesh("fan-head-hinge-cap", new CylinderGeometry(.074, .074, .03, 12), accentMaterial, headHinge);
	hingeCap.rotation.z = Math.PI * .5;
	hingeCap.position.x = .145;
	const motorHousing = kit.pivot("fan-motor-housing", headHinge);
	const barrel = kit.mesh("fan-motor-barrel", new CylinderGeometry(.205, .25, .34, 14), shellMaterial, motorHousing);
	barrel.rotation.x = Math.PI * .5;
	barrel.position.z = -.39;
	const rearCap = kit.mesh("fan-motor-rear-cap", new CylinderGeometry(.175, .175, .055, 14), accentMaterial, motorHousing);
	rearCap.rotation.x = Math.PI * .5;
	rearCap.position.z = -.575;
	for (let index = 0; index < 5; index += 1) {
		const vent = kit.mesh(`fan-rear-vent-${index + 1}`, new BoxGeometry(.12 - Math.abs(index - 2) * .012, .014, .012), darkMaterial, motorHousing, false);
		vent.position.set(0, (index - 2) * .038, -.608);
		vent.userData.explodeWithParent = true;
	}
	const motorShaft = kit.mesh("fan-motor-shaft", new CylinderGeometry(.045, .045, .22, 10), darkMaterial, motorHousing, false);
	motorShaft.rotation.x = Math.PI * .5;
	motorShaft.position.z = -.12;
	motorShaft.userData.part = "motor-shaft";
	const rotorPivot = kit.pivot("fan-rotor-pivot", headHinge);
	rotorPivot.position.z = .02;
	kit.socket("fan-rotor-axis-socket", rotorPivot, [
		0,
		0,
		0
	]);
	for (let index = 0; index < 5; index += 1) {
		const bladeRoot = kit.pivot(`fan-blade-root-${index + 1}`, rotorPivot);
		bladeRoot.rotation.z = index * (Math.PI * 2 / 5);
		const blade = kit.mesh(`fan-blade-${index + 1}`, curvedBladeGeometry(), bladeMaterial, bladeRoot, true);
		blade.rotation.z = -.2;
	}
	const rotorHub = kit.mesh("fan-rotor-hub", new CylinderGeometry(.12, .12, .12, 14), accentMaterial, rotorPivot);
	rotorHub.rotation.x = Math.PI * .5;
	const rearGuard = kit.pivot("fan-rear-guard", headHinge);
	rearGuard.position.z = -.15;
	const frontGuard = kit.pivot("fan-front-guard", headHinge);
	frontGuard.position.z = .15;
	const frontAirSocket = kit.socket("fan-front-air-socket", frontGuard, [
		0,
		0,
		.22
	]);
	frontAirSocket.userData.direction = [
		0,
		0,
		1
	];
	frontAirSocket.userData.spectacleEffect = {
		type: "fan-sakura-gust",
		poolSize: 24,
		startTime: .4,
		climaxTime: 3.7,
		stopTime: 4.8,
		pushNearbyPetals: true,
		crossScreen: true
	};
	const ringRadii = [
		.27,
		.39,
		.51
	];
	addRing(kit, "fan-front-outer-ring", .62, .035, 0, guardMaterial, frontGuard, true);
	addRing(kit, "fan-rear-outer-ring", .61, .03, 0, guardMaterial, rearGuard, true);
	ringRadii.forEach((radius, index) => {
		addRing(kit, `fan-front-concentric-ring-${index + 1}`, radius, .013, .012, guardMaterial, frontGuard);
		addRing(kit, `fan-rear-concentric-ring-${index + 1}`, radius, .012, -.012, guardMaterial, rearGuard);
	});
	for (let index = 0; index < 8; index += 1) {
		const angle = index * (Math.PI / 4);
		addSpoke(kit, `fan-front-spoke-${index + 1}`, angle, .15, .6, .02, guardMaterial, frontGuard);
		addSpoke(kit, `fan-rear-spoke-${index + 1}`, angle, .16, .59, -.02, guardMaterial, rearGuard);
	}
	for (let index = 0; index < 4; index += 1) addGuardBridge(kit, `fan-guard-cage-bridge-${index + 1}`, Math.PI * .25 + index * Math.PI * .5, .6, -.15, .15, guardMaterial, headHinge);
	const frontMedallion = kit.mesh("fan-front-hub-medallion", new CylinderGeometry(.155, .155, .055, 16), shellMaterial, frontGuard);
	frontMedallion.rotation.x = Math.PI * .5;
	frontMedallion.position.z = .05;
	for (let index = 0; index < 5; index += 1) {
		const angle = index * (Math.PI * 2 / 5) + Math.PI * .5;
		const petal = kit.mesh(`fan-front-medallion-sakura-petal-${index + 1}`, new SphereGeometry(.033, 8, 5), accentMaterial, frontGuard, false);
		petal.scale.set(1.35, .72, .2);
		petal.rotation.z = angle;
		petal.position.set(Math.cos(angle) * .048, Math.sin(angle) * .048, .085);
		petal.userData.explodeWithParent = true;
	}
	headHinge.rotation.x = -.035;
	kit.socket("fan-left-connection-socket", kit.root, [
		-.69,
		.00957517,
		.41
	]);
	kit.socket("fan-right-connection-socket", kit.root, [
		.69,
		.00957517,
		.41
	]);
	kit.socket("fan-top-connection-socket", kit.root, [
		0,
		.94590842,
		.41
	]);
	kit.socket("fan-bottom-connection-socket", kit.root, [
		0,
		-.92675808,
		.41
	]);
	applyFanOutlineHierarchy(kit.root);
	const build = kit.finish({
		referencePath: options.referencePath ?? REFERENCE_PATH,
		reconstructed: [
			"trapezoidal two-layer base with rotary speed dial and status lamp",
			"fixed rear support column beneath separate head-only yaw and tilt pivots",
			"tapered rear motor barrel, visible center shaft, rear cap and five vent slots",
			"depth-separated front and rear guards joined by four outer cage bridges",
			"five broad swept fan blades on an isolated rotor pivot",
			"front medallion with restrained Sakura blossom relief"
		],
		inferred: [
			"internal guard clips and motor shaft bearing are hidden in the reference",
			"oscillation mechanism is represented by a procedural yaw pivot inside the support",
			"blade camber and underside are inferred from the front and side silhouettes"
		]
	});
	build.root.userData.referenceDimensions = {
		envelope: {
			min: [
				-.655,
				-.89175808,
				-.61652837
			],
			max: [
				.655,
				.91090842,
				.37499997
			]
		},
		guardOuterRadius: .62,
		bladeCount: 5,
		guardRingCount: 3
	};
	build.root.userData.previewLightingProfile = "sakura-appliance-v2";
	build.root.userData.previewFramingScale = .92;
	build.root.userData.fanRig = {
		timelineOwner: "ApplianceMechanics/FanPerformance",
		rotorNode: "fan-rotor-pivot",
		yawNode: "fan-oscillation-pivot",
		hingeNode: "fan-head-hinge",
		rotorSocket: "fan-rotor-axis-socket",
		airSocket: "fan-front-air-socket",
		bladeCount: 5,
		guardRings: 3,
		guardSpokes: 16
	};
	build.root.userData.sculptRuntime.colliders = [{
		id: "fan-base",
		type: "box",
		node: "fan-base-shell"
	}, {
		id: "fan-head",
		type: "sphere",
		node: "fan-head-hinge",
		radius: .66
	}];
	build.root.userData.sculptRuntime.destructionGroups = [
		{
			id: "fan-base-assembly",
			nodes: [
				"fan-base-shell",
				"fan-base-accent-rail",
				"fan-speed-dial-pivot"
			]
		},
		{
			id: "fan-support-assembly",
			nodes: [
				"fan-support-column",
				"fan-support-collar",
				"fan-oscillation-pivot"
			]
		},
		{
			id: "fan-head-assembly",
			nodes: [
				"fan-head-hinge",
				"fan-motor-housing",
				"fan-front-guard",
				"fan-rear-guard"
			]
		},
		{
			id: "fan-rotor-assembly",
			nodes: ["fan-rotor-pivot"]
		}
	];
	return build;
}
//#endregion
export { fan_exports as n, createFanModel as t };

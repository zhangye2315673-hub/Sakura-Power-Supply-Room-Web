import { t as __exportAll } from "./rolldown-runtime-D7D4PA-g.js";
import { G as IcosahedronGeometry, Hn as SphereGeometry, I as ExtrudeGeometry, Ln as Shape, Qn as TubeGeometry, S as CylinderGeometry, Xn as TorusGeometry, dr as Vector3, ht as Mesh, p as Color, u as CatmullRomCurve3 } from "./three.core-DlTOC7bx.js";
import { i as RoundedBoxGeometry } from "./BufferGeometryUtils-Bf_-bT2g.js";
import { a as setHullOutlineStyle, d as ApplianceModelKit } from "./outline-Brkgge31.js";
//#region src/appliances/models/washer.ts
var washer_exports = /* @__PURE__ */ __exportAll({ createWasherModel: () => createWasherModel });
var V2_REFERENCE_PATH = "references/intake-v2/washer/views/front.png";
function stableOutlinePhase(name) {
	let hash = 2166136261;
	for (let index = 0; index < name.length; index += 1) {
		hash ^= name.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return (hash >>> 0) % 1e4 * (Math.PI * 2 / 1e4);
}
function applyWasherOutlineHierarchy(root) {
	const mainSilhouette = /cabinet-|top-cap|front-(?:left|right)-stile|front-(?:lower|upper)-apron|door-outer-ring/;
	const fineDetail = /program-dial|detergent-drawer$|door-handle$|dial-index|control-button|drum-perforation|rear-fastener|foot-|door-handle-inset|status-indicator/;
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
	const shape = new Shape();
	shape.moveTo(-halfWidth + chamfer, -halfHeight);
	shape.lineTo(halfWidth - chamfer, -halfHeight);
	shape.lineTo(halfWidth, -halfHeight + chamfer);
	shape.lineTo(halfWidth, halfHeight - chamfer);
	shape.lineTo(halfWidth - chamfer, halfHeight);
	shape.lineTo(-halfWidth + chamfer, halfHeight);
	shape.lineTo(-halfWidth, halfHeight - chamfer);
	shape.lineTo(-halfWidth, -halfHeight + chamfer);
	shape.closePath();
	const geometry = new ExtrudeGeometry(shape, {
		depth,
		bevelEnabled: false,
		curveSegments: 1,
		steps: 1
	});
	geometry.translate(0, 0, -depth * .5);
	return geometry;
}
function shiftColor(color, lightness, saturation = 0) {
	return new Color(color).offsetHSL(0, saturation, lightness).getHex();
}
function roundedPart(kit, name, size, radius, material, parent = kit.root, outlined = true) {
	const part = kit.mesh(name, new RoundedBoxGeometry(size[0], size[1], size[2], 1, radius), material, parent, outlined);
	part.userData.explodeWithParent = true;
	return part;
}
function hose(kit, name, points, radius, material, parent) {
	const curve = new CatmullRomCurve3([...points], false, "catmullrom", .32);
	const mesh = kit.mesh(name, new TubeGeometry(curve, 24, radius, 7, false), material, parent, false);
	mesh.userData.explodeWithParent = true;
	return mesh;
}
/**
* Procedural reconstruction of the supplied three-view front-load washer.
*
* Local frame: +Y up, +Z front, floor at Y=0. The glass door sits on a
* right-edge hinge pivot; the visible drum and laundry use a separate rotor.
*/
function createWasherModel(options) {
	const kit = new ApplianceModelKit(options);
	const accentLight = shiftColor(options.accent, .12, -.06);
	const accentMid = shiftColor(options.accent, .075, -.04);
	const accentDark = shiftColor(options.accent, -.12, -.02);
	const shellMaterial = kit.material(15657439, { tint: 7431805 });
	const shellLightMaterial = kit.material(16314855, { tint: 7826304 });
	const shellShadowMaterial = kit.material(14209482, { tint: 6708336 });
	const accentMaterial = kit.material(accentMid, { tint: 7102582 });
	const accentLightMaterial = kit.material(accentLight, { tint: 7694462 });
	const accentDarkMaterial = kit.material(accentDark, { tint: 5852773 });
	const rubberMaterial = kit.material(5657697, { tint: 4209481 });
	const metalMaterial = kit.material(11052972, { tint: 6380392 });
	const glassMaterial = kit.material(7173248, {
		tint: 5196898,
		transparent: true,
		opacity: .34
	});
	const drumMaterial = kit.material(9606042, { tint: 6117479 });
	const displayMaterial = kit.material(6711159, {
		tint: 4736087,
		emissive: accentLight
	});
	const laundryMaterials = [
		kit.material(shiftColor(options.accent, .12), { tint: 7299448 }),
		kit.material(15773881, { tint: 7627638 }),
		kit.material(8828849, { tint: 5663344 }),
		kit.material(15187818, { tint: 7759443 })
	];
	const cabinet = kit.mesh("washer-cabinet-back-core", facetedPanelGeometry(2.7, 2.9, .22, .12), shellMaterial);
	cabinet.userData.explodeWithParent = true;
	cabinet.position.set(0, 1.56, -.9);
	for (const side of [-1, 1]) roundedPart(kit, `washer-cabinet-${side < 0 ? "left" : "right"}-side-shell`, [
		.3,
		2.72,
		1.86
	], .1, shellMaterial).position.set(side * 1.2, 1.55, -.01);
	const topCap = kit.mesh("washer-top-cap", facetedPanelGeometry(2.66, 1.98, .18, .12), accentLightMaterial);
	topCap.rotation.x = Math.PI * .5;
	topCap.position.set(0, 2.97, 0);
	[
		{
			name: "washer-front-left-stile",
			size: [
				.48,
				2.05,
				.16
			],
			position: [
				-1.05,
				1.38,
				1.01
			]
		},
		{
			name: "washer-front-right-stile",
			size: [
				.48,
				2.05,
				.16
			],
			position: [
				1.05,
				1.38,
				1.01
			]
		},
		{
			name: "washer-front-lower-apron",
			size: [
				2.58,
				.44,
				.16
			],
			position: [
				0,
				.36,
				1.01
			]
		},
		{
			name: "washer-front-upper-apron",
			size: [
				2.58,
				.34,
				.16
			],
			position: [
				0,
				2.31,
				1.01
			]
		}
	].forEach((part) => {
		roundedPart(kit, part.name, part.size, .1, shellLightMaterial).position.set(...part.position);
	});
	roundedPart(kit, "washer-control-band", [
		2.6,
		.54,
		.14
	], .075, shellLightMaterial).position.set(0, 2.645, 1.12);
	roundedPart(kit, "washer-control-band-top-accent", [
		2.53,
		.115,
		.035
	], .035, accentLightMaterial, kit.root, false).position.set(0, 2.895, 1.205);
	const drawerPivot = kit.pivot("washer-detergent-drawer-pivot");
	drawerPivot.position.set(-.86, 2.65, 1.205);
	drawerPivot.userData.travelAxis = [
		0,
		0,
		1
	];
	drawerPivot.userData.travelRange = [0, .28];
	kit.socket("washer-detergent-drawer-socket", drawerPivot, [
		0,
		0,
		0
	]);
	roundedPart(kit, "washer-detergent-drawer", [
		.78,
		.27,
		.11
	], .055, shellShadowMaterial, drawerPivot);
	roundedPart(kit, "washer-detergent-drawer-handle", [
		.48,
		.075,
		.045
	], .027, accentMaterial, drawerPivot, false).position.set(0, -.015, .08);
	const dialPivot = kit.pivot("washer-program-dial-pivot");
	dialPivot.position.set(-.05, 2.65, 1.22);
	dialPivot.userData.rotationAxis = [
		0,
		0,
		1
	];
	kit.socket("washer-program-dial-socket", dialPivot, [
		0,
		0,
		0
	]);
	const dialBezel = kit.mesh("washer-program-dial-bezel", new CylinderGeometry(.24, .24, .085, 12), accentMaterial, dialPivot);
	dialBezel.rotation.x = Math.PI * .5;
	const dial = kit.mesh("washer-program-dial", new CylinderGeometry(.17, .185, .12, 12), shellLightMaterial, dialPivot);
	dial.rotation.x = Math.PI * .5;
	dial.position.z = .075;
	roundedPart(kit, "washer-program-dial-index", [
		.022,
		.095,
		.018
	], .008, accentDarkMaterial, dialPivot, false).position.set(0, .065, .145);
	roundedPart(kit, "washer-display", [
		.72,
		.27,
		.055
	], .055, displayMaterial, kit.root).position.set(.82, 2.69, 1.235);
	for (let index = 0; index < 3; index += 1) {
		const button = kit.mesh(`washer-control-button-${index + 1}`, new CylinderGeometry(.043, .043, .03, 12), index === 2 ? accentLightMaterial : shellLightMaterial, kit.root, false);
		button.rotation.x = Math.PI * .5;
		button.position.set(.64 + index * .17, 2.65, 1.286);
	}
	const drumRotor = kit.pivot("washer-drum-rotor");
	drumRotor.position.set(-.04, 1.42, 1.12);
	drumRotor.userData.rotationAxis = [
		0,
		0,
		1
	];
	kit.socket("washer-drum-axis-socket", drumRotor, [
		0,
		0,
		-.55
	]);
	drumMaterial.side = 2;
	const drumWall = kit.mesh("washer-deep-perforated-drum-wall", new CylinderGeometry(.73, .73, .98, 16, 1, true), drumMaterial, drumRotor, false);
	drumWall.rotation.x = Math.PI * .5;
	drumWall.position.z = -.48;
	const drumBack = kit.mesh("washer-deep-drum-back", new CylinderGeometry(.705, .705, .055, 16), drumMaterial, drumRotor, false);
	drumBack.rotation.x = Math.PI * .5;
	drumBack.position.z = -.965;
	kit.mesh("washer-stainless-drum-mouth", new TorusGeometry(.73, .05, 6, 16), metalMaterial, drumRotor, false).position.z = .01;
	for (let index = 0; index < 12; index += 1) {
		const angle = index * Math.PI * 2 / 12;
		const perforation = kit.mesh(`washer-drum-perforation-${index + 1}`, new SphereGeometry(.026, 6, 4), rubberMaterial, drumRotor, false);
		perforation.scale.z = .3;
		perforation.position.set(Math.cos(angle) * .49, Math.sin(angle) * .49, -.92);
	}
	for (let index = 0; index < 3; index += 1) {
		const angle = index * Math.PI * 2 / 3;
		const baffle = roundedPart(kit, `washer-drum-lifter-baffle-${index + 1}`, [
			.18,
			.48,
			.12
		], .055, shellShadowMaterial, drumRotor, false);
		baffle.position.set(Math.cos(angle) * .53, Math.sin(angle) * .53, -.36);
		baffle.rotation.z = angle;
	}
	const laundry = [];
	[
		[
			-.3,
			-.22,
			.035
		],
		[
			.2,
			-.31,
			.07
		],
		[
			.34,
			.06,
			.025
		],
		[
			-.08,
			.25,
			.08
		],
		[
			-.35,
			.13,
			.02
		]
	].forEach(([x, y, z], index) => {
		const cloth = kit.mesh(`washer-laundry-volume-${index + 1}`, new IcosahedronGeometry(.22, 1), laundryMaterials[index % laundryMaterials.length], drumRotor, false);
		cloth.position.set(x, y, z);
		cloth.rotation.z = index * .7;
		cloth.scale.set(1.18 + index % 2 * .16, .72 + index % 3 * .08, .5 + index % 2 * .08);
		cloth.userData.isVolumetricLaundry = true;
		laundry.push(cloth);
	});
	const sudsRig = kit.pivot("washer-tub-suds-rig", drumRotor);
	sudsRig.position.z = .06;
	for (let index = 0; index < 7; index += 1) {
		const foam = kit.mesh(`washer-volumetric-suds-bubble-${index + 1}`, new SphereGeometry(.055 + index % 3 * .018, 8, 6), glassMaterial, sudsRig, false);
		foam.position.set(-.38 + index * .13, -.48 + index % 2 * .08, .08 + index % 3 * .025);
		foam.visible = false;
		foam.userData.performanceProp = "closed-volume-suds";
	}
	const dropletRig = kit.pivot("washer-glass-droplet-rig");
	dropletRig.position.set(-.04, 1.42, 1.23);
	for (let index = 0; index < 5; index += 1) {
		const drop = kit.mesh(`washer-volumetric-glass-droplet-${index + 1}`, new SphereGeometry(.036, 8, 6), glassMaterial, dropletRig, false);
		const angle = .62 + index * 1.06;
		drop.position.set(Math.cos(angle) * (.38 + index % 2 * .12), Math.sin(angle) * .47, 0);
		drop.scale.set(.72, 1.24 + index % 2 * .22, .55);
		drop.visible = false;
		drop.userData.performanceProp = "glass-water-droplet-volume";
	}
	kit.mesh("washer-fixed-rubber-door-gasket", new TorusGeometry(.82, .105, 8, 16), rubberMaterial, kit.root).position.set(-.04, 1.42, 1.105);
	const gasketThroat = kit.mesh("washer-door-gasket-depth-throat", new CylinderGeometry(.76, .7, .32, 16, 1, true), rubberMaterial, kit.root, false);
	gasketThroat.rotation.x = Math.PI * .5;
	gasketThroat.position.set(-.04, 1.42, .97);
	const doorHinge = kit.pivot("washer-door-hinge");
	doorHinge.position.set(.93, 1.42, 1.18);
	doorHinge.userData.rotationAxis = [
		0,
		1,
		0
	];
	doorHinge.userData.rotationRange = [0, 1.9];
	kit.socket("washer-door-hinge-socket", doorHinge, [
		0,
		0,
		0
	]);
	const doorAssembly = kit.pivot("washer-door-assembly", doorHinge);
	doorAssembly.position.set(-.97, 0, 0);
	kit.mesh("washer-door-outer-ring", new TorusGeometry(.93, .14, 6, 12), accentLightMaterial, doorAssembly);
	const innerDoorRing = kit.mesh("washer-door-inner-ring", new TorusGeometry(.73, .07, 6, 12), rubberMaterial, doorAssembly);
	innerDoorRing.position.z = .06;
	const glass = kit.mesh("washer-door-glass", new CylinderGeometry(.69, .73, .12, 16), glassMaterial, doorAssembly, false);
	glass.rotation.x = Math.PI * .5;
	glass.position.z = .065;
	glass.renderOrder = 4;
	glassMaterial.depthWrite = false;
	const doorHandlePivot = kit.pivot("washer-door-handle-pivot", doorAssembly);
	doorHandlePivot.position.set(.75, 0, .13);
	doorHandlePivot.userData.travelAxis = [
		1,
		0,
		0
	];
	kit.socket("washer-door-handle-socket", doorHandlePivot, [
		0,
		0,
		0
	]);
	roundedPart(kit, "washer-door-handle", [
		.25,
		.58,
		.16
	], .1, accentMaterial, doorHandlePivot);
	const handleInset = roundedPart(kit, "washer-door-handle-inset", [
		.07,
		.32,
		.035
	], .025, shellShadowMaterial, doorHandlePivot, false);
	handleInset.position.z = .1;
	for (const side of [-1, 1]) roundedPart(kit, `washer-side-service-panel-${side < 0 ? "left" : "right"}`, [
		.035,
		1.84,
		1.36
	], .12, shellShadowMaterial, kit.root, true).position.set(side * 1.36, 1.56, -.02);
	const rearAssembly = kit.pivot("washer-rear-service-assembly");
	roundedPart(kit, "washer-rear-inset-panel", [
		2.42,
		2.56,
		.075
	], .16, shellShadowMaterial, rearAssembly).position.set(0, 1.58, -1.045);
	roundedPart(kit, "washer-rear-pressed-panel", [
		1.75,
		1.75,
		.045
	], .14, shellLightMaterial, rearAssembly, false).position.set(.1, 1.63, -1.095);
	roundedPart(kit, "washer-rear-lower-access-panel", [
		.82,
		.48,
		.055
	], .06, shellLightMaterial, rearAssembly).position.set(.08, .63, -1.13);
	[
		[-1.08, 2.76],
		[1.08, 2.76],
		[-1.08, .38],
		[1.08, .38],
		[-.3, .79],
		[.45, .79]
	].forEach(([x, y], index) => {
		const screw = kit.mesh(`washer-rear-fastener-${index + 1}`, new CylinderGeometry(.035, .035, .025, 10), metalMaterial, rearAssembly, false);
		screw.rotation.x = Math.PI * .5;
		screw.position.set(x, y, -1.165);
	});
	const drainPort = kit.mesh("washer-drain-port", new TorusGeometry(.11, .035, 8, 16), rubberMaterial, rearAssembly, false);
	drainPort.position.set(.95, 2.44, -1.14);
	kit.socket("washer-drain-hose-socket", drainPort, [
		0,
		0,
		-.04
	]);
	hose(kit, "washer-drain-hose", [
		new Vector3(.95, 2.44, -1.14),
		new Vector3(1.18, 2.2, -1.18),
		new Vector3(1.18, 1.28, -1.18),
		new Vector3(.92, .72, -1.18)
	], .055, rubberMaterial, rearAssembly);
	const powerPort = roundedPart(kit, "washer-power-entry", [
		.23,
		.23,
		.06
	], .055, accentMaterial, rearAssembly, false);
	powerPort.position.set(-.75, 2.49, -1.15);
	kit.socket("washer-power-cord-socket", powerPort, [
		0,
		0,
		-.04
	]);
	hose(kit, "washer-power-cord", [
		new Vector3(-.75, 2.49, -1.16),
		new Vector3(-.78, 2.22, -1.19),
		new Vector3(-.89, 2.02, -1.19)
	], .025, rubberMaterial, rearAssembly);
	roundedPart(kit, "washer-stowed-power-plug", [
		.18,
		.26,
		.08
	], .035, rubberMaterial, rearAssembly, false).position.set(-.89, 1.91, -1.2);
	for (const [index, [x, z]] of [
		[-1.05, -.72],
		[1.05, -.72],
		[-1.05, .72],
		[1.05, .72]
	].entries()) roundedPart(kit, `washer-foot-${index + 1}`, [
		.38,
		.18,
		.4
	], .065, rubberMaterial, kit.root, false).position.set(x, .09, z);
	kit.indicator([
		1.05,
		2.67,
		1.286
	], .034);
	const build = kit.finish({
		referencePath: options.referencePath ?? V2_REFERENCE_PATH,
		reconstructed: [
			"near-square eight-plane rigid cabinet with true side depth, layered front frame, faceted pink top cap and four rubber feet",
			"thicker upper control band with detergent drawer, twelve-sided program dial, dark display and three buttons",
			"enlarged twelve-sided porthole on the frozen axis with deep gasket, transparent glass and right-edge handle",
			"visible deep sixteen-sided drum with stainless mouth, rear perforations, three lifter baffles and volumetric laundry bundles",
			"closed model-owned rigs for seven volumetric suds bubbles and five glass water droplets",
			"large side service stamp panels and rear pressed service hierarchy with lower access cover and fasteners",
			"rear drain hose, power entry, short power cord and stowed plug built as separate assemblies",
			"animation-ready door hinge, drum rotor, drawer travel pivot and hose/power sockets"
		],
		inferred: [
			"the drum depth, baffles, laundry volume and internal suspension are hidden behind the tinted glass and are inferred",
			"the exact side-panel stamping depth and left/right symmetry are inferred from the single visible side view",
			"rear hose routing, connection depths, power-cord slack and lower access-cover function are simplified from the visible rear drawing",
			"door gasket cross-section, hinge internals, latch travel and underside leveling mechanisms are not visible and are simplified"
		]
	});
	build.root.userData.visualRevision = "sakura-washer-v2";
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
			id: "washer-cabinet",
			type: "box",
			node: "root"
		},
		{
			id: "washer-door",
			type: "cylinder",
			node: "washer-door-assembly"
		},
		{
			id: "washer-drum-trigger",
			type: "cylinder",
			node: "washer-drum-rotor",
			trigger: true
		}
	];
	build.root.userData.sculptRuntime.destructionGroups = [
		{
			id: "washer-cabinet-system",
			nodes: [
				"washer-cabinet-back-core",
				"washer-cabinet-left-side-shell",
				"washer-cabinet-right-side-shell",
				"washer-top-cap"
			]
		},
		{
			id: "washer-control-system",
			nodes: [
				"washer-detergent-drawer-pivot",
				"washer-program-dial-pivot",
				"washer-display"
			]
		},
		{
			id: "washer-door-system",
			nodes: [
				"washer-door-hinge",
				"washer-door-assembly",
				"washer-door-handle-pivot"
			]
		},
		{
			id: "washer-drum-system",
			nodes: [
				"washer-drum-rotor",
				"washer-tub-suds-rig",
				"washer-glass-droplet-rig"
			]
		},
		{
			id: "washer-rear-service",
			nodes: [
				"washer-rear-service-assembly",
				"washer-drain-hose-socket",
				"washer-power-cord-socket"
			]
		}
	];
	applyWasherOutlineHierarchy(build.root);
	return build;
}
//#endregion
export { washer_exports as n, createWasherModel as t };

import { t as __exportAll } from "./rolldown-runtime-D7D4PA-g.js";
import { G as IcosahedronGeometry, Hn as SphereGeometry, I as ExtrudeGeometry, Jn as TetrahedronGeometry, Ln as Shape, Ot as OctahedronGeometry, Qn as TubeGeometry, S as CylinderGeometry, Xn as TorusGeometry, dr as Vector3, ht as Mesh, p as Color, u as CatmullRomCurve3 } from "./three.core-DlTOC7bx.js";
import { i as RoundedBoxGeometry } from "./BufferGeometryUtils-Bf_-bT2g.js";
import { a as setHullOutlineStyle, d as ApplianceModelKit } from "./outline-Brkgge31.js";
//#region src/appliances/models/gameController.ts
var gameController_exports = /* @__PURE__ */ __exportAll({ createGameControllerModel: () => createGameControllerModel });
var REFERENCE_PATH = "references/intake-v2/game-controller/views/front.png";
var ACTIVE_DURATION = 5.2;
function stableOutlinePhase(name) {
	let hash = 2166136261;
	for (let index = 0; index < name.length; index += 1) {
		hash ^= name.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return (hash >>> 0) / 4294967295 * Math.PI * 2;
}
function applyGameControllerOutlineHierarchy(root) {
	const mainSilhouette = /cream-(front|rear)-shell|front-pink-grip-panel|rear-pink-grip-panel/;
	const fineDetail = /grip-boundary-seam|button-.*-crown|cap-inset|shoulder-hinge-cap|battery-cover-seam|upper-shell-highlight/;
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
	});
}
function rounded(width, height, depth, radius, segments = 1) {
	return new RoundedBoxGeometry(width, height, depth, segments, radius);
}
function extrude(shape, depth, bevelSize) {
	const geometry = new ExtrudeGeometry(shape, {
		depth,
		bevelEnabled: true,
		bevelSegments: 1,
		bevelSize,
		bevelThickness: bevelSize,
		curveSegments: 6,
		steps: 1
	});
	geometry.translate(0, 0, -depth * .5);
	geometry.computeVertexNormals();
	return geometry;
}
function controllerOutline() {
	const shape = new Shape();
	shape.moveTo(-2.38, .52);
	[
		[-2.31, 1.06],
		[-2.03, 1.55],
		[-1.62, 1.74],
		[-.92, 1.88],
		[.92, 1.88],
		[1.62, 1.74],
		[2.03, 1.55],
		[2.31, 1.06],
		[2.38, .52],
		[2.44, -.2],
		[2.31, -1.18],
		[2.05, -1.48],
		[1.79, -1.58],
		[1.52, -1.69],
		[1.28, -1.47],
		[1.08, -1.05],
		[.84, -.56],
		[.56, -.4],
		[.3, -.43],
		[0, -.47],
		[-.3, -.43],
		[-.56, -.4],
		[-.84, -.56],
		[-1.08, -1.05],
		[-1.28, -1.47],
		[-1.52, -1.69],
		[-1.79, -1.58],
		[-2.05, -1.48],
		[-2.31, -1.18],
		[-2.44, -.2]
	].forEach(([x, y]) => shape.lineTo(x, y));
	shape.closePath();
	return shape;
}
function gripPanel(side) {
	const s = side;
	const shape = new Shape();
	shape.moveTo(s * 2.36, 0);
	[
		[s * 2.34, -.5],
		[s * 2.2, -1.16],
		[s * 1.96, -1.48],
		[s * 1.78, -1.61],
		[s * 1.53, -1.7],
		[s * 1.3, -1.47],
		[s * 1.1, -1.03],
		[s * 1.22, -.62],
		[s * 1.48, -.25],
		[s * 1.82, .12],
		[s * 2.08, .14],
		[s * 2.36, 0]
	].forEach(([x, y]) => shape.lineTo(x, y));
	shape.closePath();
	return shape;
}
function dpadShape() {
	const s = new Shape();
	const a = .24;
	const b = .58;
	s.moveTo(-.24, b);
	s.lineTo(a, b);
	s.quadraticCurveTo(.32, b, .32, .49999999999999994);
	s.lineTo(.32, .32);
	s.lineTo(.49999999999999994, .32);
	s.quadraticCurveTo(b, .32, b, a);
	s.lineTo(b, -.24);
	s.quadraticCurveTo(b, -.32, .49999999999999994, -.32);
	s.lineTo(.32, -.32);
	s.lineTo(.32, -.58 + .08);
	s.quadraticCurveTo(.32, -.58, a, -.58);
	s.lineTo(-.24, -.58);
	s.quadraticCurveTo(-.32, -.58, -.32, -.58 + .08);
	s.lineTo(-.32, -.32);
	s.lineTo(-.58 + .08, -.32);
	s.quadraticCurveTo(-.58, -.32, -.58, -.24);
	s.lineTo(-.58, a);
	s.quadraticCurveTo(-.58, .32, -.58 + .08, .32);
	s.lineTo(-.32, .32);
	s.lineTo(-.32, .49999999999999994);
	s.quadraticCurveTo(-.32, b, -.24, b);
	s.closePath();
	return s;
}
function starGeometry() {
	const shape = new Shape();
	const points = 10;
	for (let index = 0; index < points; index += 1) {
		const angle = Math.PI * .5 + index / points * Math.PI * 2;
		const radius = index % 2 === 0 ? .28 : .13;
		const x = Math.cos(angle) * radius;
		const y = Math.sin(angle) * radius;
		if (index === 0) shape.moveTo(x, y);
		else shape.lineTo(x, y);
	}
	shape.closePath();
	return extrude(shape, .15, .025);
}
function electricBoltGeometry(variant) {
	const side = variant % 2 === 0 ? 1 : -1;
	const depth = (variant % 3 - 1) * .035;
	const path = new CatmullRomCurve3([
		new Vector3(0, 0, 0),
		new Vector3(.11 * side, .22, depth),
		new Vector3(-.08 * side, .43, -depth),
		new Vector3(.13 * side, .66, depth * .5),
		new Vector3(.02 * side, .88, 0)
	], false, "centripetal", .5);
	const geometry = new TubeGeometry(path, 18, .038, 6, false);
	geometry.computeVertexNormals();
	geometry.userData.performanceProp = "volumetric-electric-bolt";
	return geometry;
}
function mark(mesh, part, relief = false) {
	mesh.userData.part = part;
	if (relief) mesh.userData.explodeWithParent = true;
}
/** Procedural three-view reconstruction of the Sakura wireless game controller. */
function createGameControllerModel(options) {
	const kit = new ApplianceModelKit(options);
	const accent = new Color(options.accent);
	const accentColor = accent.clone().offsetHSL(0, -.035, .055).getHex();
	const accentLight = accent.clone().offsetHSL(0, -.07, .12).getHex();
	const accentDark = accent.clone().offsetHSL(0, .015, -.13).getHex();
	const cream = kit.material(16182748, { tint: 9600390 });
	const creamLight = kit.material(16775144, { tint: 11178642 });
	const pink = kit.material(accentColor, { tint: 9397620 });
	const pinkLight = kit.material(accentLight, { tint: 10975105 });
	const pinkDark = kit.material(accentDark, { tint: 7032411 });
	const cavity = kit.material(6901850, { tint: 4339523 });
	const fastener = kit.material(9007715, { tint: 5588557 });
	const statusMaterial = kit.indicatorMaterial;
	const homeMaterial = kit.material(accentLight, {
		tint: 10975105,
		emissive: 0
	});
	const energyGold = kit.material(16766314, {
		tint: 13133939,
		emissive: 16751429
	});
	const energyRose = kit.material(16744355, {
		tint: 10177911,
		emissive: 16724319
	});
	const energyBlue = kit.material(7791359, {
		tint: 7174330,
		emissive: 3842047
	});
	const motion = kit.pivot("game-controller-motion-pivot");
	motion.position.y = 1.67;
	kit.socket("game-controller-centre-socket", motion, [
		0,
		.15,
		0
	]);
	const shellGeometry = extrude(controllerOutline(), .62, .12);
	const frontShell = kit.mesh("game-controller-cream-front-shell", shellGeometry, cream, motion);
	frontShell.position.z = .14;
	mark(frontShell, "front-shell");
	const rearShell = kit.mesh("game-controller-cream-rear-shell", shellGeometry.clone(), cream, motion);
	rearShell.scale.set(.985, .985, .83);
	rearShell.position.z = -.47;
	mark(rearShell, "rear-shell");
	const upperHighlight = kit.mesh("game-controller-upper-shell-highlight", rounded(3.5, .1, .06, .04, 3), creamLight, motion, false);
	upperHighlight.position.set(0, 1.55, .53);
	mark(upperHighlight, "front-shell", true);
	const gripMeshes = [];
	for (const side of [-1, 1]) {
		const label = side < 0 ? "left" : "right";
		const frontPanel = kit.mesh(`game-controller-${label}-front-pink-grip-panel`, extrude(gripPanel(side), .13, .065), pink, motion);
		frontPanel.position.z = .49;
		mark(frontPanel, `${label}-grip-panel`);
		const rearPanel = kit.mesh(`game-controller-${label}-rear-pink-grip-panel`, extrude(gripPanel(side), .11, .055), pink, motion);
		rearPanel.position.z = -.78;
		mark(rearPanel, `${label}-grip-panel`);
		gripMeshes.push(frontPanel, rearPanel);
		const boundary = kit.mesh(`game-controller-${label}-grip-boundary-seam`, rounded(.76, .05, .035, .018, 1), pinkDark, motion);
		boundary.position.set(side * 1.65, .02, .57);
		boundary.rotation.z = side * -.62;
		mark(boundary, `${label}-grip-panel`, true);
	}
	const dpadPivot = kit.pivot("game-controller-dpad-pivot", motion);
	dpadPivot.position.set(-1.23, .55, .51);
	dpadPivot.userData.rotationAxis = [
		1,
		1,
		0
	];
	kit.socket("game-controller-dpad-socket", motion, [
		-1.23,
		.55,
		.51
	]);
	const dpadCavity = kit.mesh("game-controller-dpad-dark-cavity", extrude(dpadShape(), .055, .075), cavity, dpadPivot, false);
	dpadCavity.scale.setScalar(1.055);
	dpadCavity.position.z = -.015;
	mark(dpadCavity, "dpad", true);
	const dpad = kit.mesh("game-controller-rounded-cross-dpad", extrude(dpadShape(), .15, .065), pink, dpadPivot);
	dpad.position.z = .035;
	mark(dpad, "dpad");
	const dpadInset = kit.mesh("game-controller-dpad-centre-inset", rounded(.34, .34, .045, .1, 3), pinkLight, dpadPivot, false);
	dpadInset.position.z = .19;
	mark(dpadInset, "dpad", true);
	const faceButtonPivots = [];
	const faceButtons = [
		[1.28, .82],
		[1.63, .49],
		[1.31, .15],
		[.96, .48]
	];
	const faceGeometry = new CylinderGeometry(.22, .235, .17, 12, 1);
	faceButtons.forEach(([x, y], index) => {
		const cavityRing = kit.mesh(`game-controller-face-button-${index + 1}-cavity-ring`, new TorusGeometry(.25, .026, 5, 12), cavity, motion, false);
		cavityRing.position.set(x, y, .575);
		mark(cavityRing, `face-button-${index + 1}`, true);
		const pivot = kit.pivot(`game-controller-face-button-${index + 1}-pivot`, motion);
		pivot.position.set(x, y, .56);
		pivot.userData.translationAxis = [
			0,
			0,
			-1
		];
		const button = kit.mesh(`game-controller-face-button-${index + 1}`, faceGeometry, pinkLight, pivot);
		button.rotation.x = Math.PI * .5;
		mark(button, `face-button-${index + 1}`);
		const inset = kit.mesh(`game-controller-face-button-${index + 1}-crown`, new TorusGeometry(.15, .014, 4, 12), pink, pivot, false);
		inset.position.z = .095;
		mark(inset, `face-button-${index + 1}`, true);
		kit.socket(`game-controller-face-button-${index + 1}-burst-socket`, pivot, [
			0,
			0,
			.16
		]);
		faceButtonPivots.push(pivot);
	});
	const stickPivots = [];
	const stickPositions = [-.58, .58];
	const socketGeometry = new TorusGeometry(.405, .06, 6, 12);
	stickPositions.forEach((x, index) => {
		const socket = kit.mesh(`game-controller-stick-${index + 1}-cream-socket-ring`, socketGeometry, creamLight, motion);
		socket.position.set(x, -.38, .56);
		mark(socket, `stick-${index + 1}-socket`);
		const cavityRing = kit.mesh(`game-controller-stick-${index + 1}-cavity-ring`, new TorusGeometry(.34, .028, 5, 12), cavity, motion, false);
		cavityRing.position.set(x, -.38, .585);
		mark(cavityRing, `stick-${index + 1}-socket`, true);
		const pivot = kit.pivot(`game-controller-stick-${index + 1}-pivot`, motion);
		pivot.position.set(x, -.38, .59);
		pivot.userData.rotationAxis = [
			1,
			1,
			0
		];
		kit.socket(`game-controller-stick-${index + 1}-axis-socket`, motion, [
			x,
			-.38,
			.59
		]);
		const stem = kit.mesh(`game-controller-stick-${index + 1}-stem`, new CylinderGeometry(.14, .16, .22, 10), pinkDark, pivot, false);
		stem.rotation.x = Math.PI * .5;
		stem.position.z = .09;
		mark(stem, `analog-stick-${index + 1}`);
		const cap = kit.mesh(`game-controller-stick-${index + 1}-pink-cap`, new CylinderGeometry(.34, .305, .19, 12, 1), pinkLight, pivot);
		cap.rotation.x = Math.PI * .5;
		cap.position.z = .23;
		mark(cap, `analog-stick-${index + 1}`);
		const capInset = kit.mesh(`game-controller-stick-${index + 1}-cap-inset`, new TorusGeometry(.225, .02, 4, 12), pink, pivot, false);
		capInset.position.z = .34;
		mark(capInset, `analog-stick-${index + 1}`, true);
		stickPivots.push(pivot);
	});
	const homePivot = kit.pivot("game-controller-home-button-pivot", motion);
	homePivot.position.set(0, .92, .56);
	homePivot.userData.translationAxis = [
		0,
		0,
		-1
	];
	const home = kit.mesh("game-controller-round-home-button", new CylinderGeometry(.2, .2, .12, 12), homeMaterial, homePivot);
	home.rotation.x = Math.PI * .5;
	mark(home, "home-button");
	const selectPivot = kit.pivot("game-controller-select-button-pivot", motion);
	selectPivot.position.set(0, .46, .56);
	selectPivot.userData.translationAxis = [
		0,
		0,
		-1
	];
	mark(kit.mesh("game-controller-horizontal-select-button", rounded(.36, .17, .13, .055, 1), pinkLight, selectPivot), "select-button");
	const statusLens = kit.mesh("game-controller-rose-status-lens", new SphereGeometry(.07, 10, 6), statusMaterial, motion, false);
	statusLens.scale.set(1.65, .48, .55);
	statusLens.position.set(0, .67, .69);
	mark(statusLens, "status-lens");
	const shoulderPivots = [];
	for (const side of [-1, 1]) {
		const label = side < 0 ? "left" : "right";
		const bumperPivot = kit.pivot(`game-controller-${label}-bumper-pivot`, motion);
		bumperPivot.position.set(side * 1.53, 1.86, -.35);
		bumperPivot.userData.rotationAxis = [
			1,
			0,
			0
		];
		kit.socket(`game-controller-${label}-bumper-hinge-socket`, motion, [
			side * 1.53,
			1.86,
			-.35
		]);
		const bumper = kit.mesh(`game-controller-${label}-pink-bumper`, rounded(.96, .23, .5, .075, 1), pinkLight, bumperPivot);
		bumper.position.set(0, .04, .02);
		bumper.rotation.y = side * -.08;
		mark(bumper, `${label}-bumper`);
		const triggerPivot = kit.pivot(`game-controller-${label}-trigger-pivot`, motion);
		triggerPivot.position.set(side * 1.56, 1.73, -.68);
		triggerPivot.userData.rotationAxis = [
			1,
			0,
			0
		];
		kit.socket(`game-controller-${label}-trigger-hinge-socket`, motion, [
			side * 1.56,
			1.73,
			-.68
		]);
		const trigger = kit.mesh(`game-controller-${label}-pink-trigger`, rounded(.82, .22, .46, .07, 1), pink, triggerPivot);
		trigger.position.z = -.05;
		trigger.rotation.y = side * -.08;
		mark(trigger, `${label}-trigger`);
		const hingeCap = kit.mesh(`game-controller-${label}-shoulder-hinge-cap`, new CylinderGeometry(.105, .105, .14, 8, 1), pinkDark, bumperPivot, false);
		hingeCap.rotation.z = Math.PI * .5;
		hingeCap.position.set(side * .41, .015, .03);
		mark(hingeCap, `${label}-bumper`, true);
		shoulderPivots.push(bumperPivot, triggerPivot);
	}
	const effectRoot = kit.pivot("game-controller-ultimate-effects-pivot", motion);
	const burstOrigins = [
		[
			-2.65,
			1.52,
			.93
		],
		[
			2.65,
			1.52,
			.93
		],
		[
			-2.62,
			-2.05,
			.98
		],
		[
			2.62,
			-2.05,
			.98
		],
		[
			0,
			2.22,
			.98
		]
	];
	const starGeo = starGeometry();
	burstOrigins.forEach(([x, y, z], index) => {
		const star = kit.mesh(`game-controller-ultimate-star-${index + 1}`, starGeo, energyGold, effectRoot, false);
		star.position.set(x, y, z);
		star.visible = false;
		star.userData.performanceEffect = "volumetric-star";
		star.userData.effectIndex = index;
		mark(star, "ultimate-effects", true);
	});
	for (let index = 0; index < 4; index += 1) {
		const side = index % 2 === 0 ? -1 : 1;
		const bolt = kit.mesh(`game-controller-ultimate-electric-bolt-${index + 1}`, electricBoltGeometry(index), energyBlue, effectRoot, false);
		bolt.position.set(side * (2.72 + Math.floor(index / 2) * .28), .72 - index % 2 * 1.34, .9);
		bolt.rotation.z = side * (.52 + index * .08);
		bolt.visible = false;
		bolt.userData.performanceEffect = "volumetric-electric-bolt";
		bolt.userData.effectIndex = index;
		mark(bolt, "ultimate-effects", true);
	}
	for (let index = 0; index < 8; index += 1) {
		const angle = index / 8 * Math.PI * 2;
		const shard = kit.mesh(`game-controller-ultimate-impact-shard-${index + 1}`, index % 2 === 0 ? new OctahedronGeometry(.15, 0) : new TetrahedronGeometry(.17, 0), index % 3 === 0 ? energyRose : energyGold, effectRoot, false);
		shard.position.set(Math.cos(angle) * 2.62, Math.sin(angle) * 1.92 + .2, .96);
		shard.scale.set(.72, 1.45, .82);
		shard.visible = false;
		shard.userData.performanceEffect = "volumetric-impact-shard";
		shard.userData.effectIndex = index;
		shard.userData.burstAngle = angle;
		mark(shard, "ultimate-effects", true);
	}
	for (let index = 0; index < 6; index += 1) {
		const angle = index / 6 * Math.PI * 2 + .3;
		const point = kit.mesh(`game-controller-ultimate-energy-point-${index + 1}`, new IcosahedronGeometry(.085, 1), energyBlue, effectRoot, false);
		point.position.set(Math.cos(angle) * 2.9, Math.sin(angle) * 2.2 + .18, 1.02);
		point.visible = false;
		point.userData.performanceEffect = "volumetric-energy-point";
		point.userData.effectIndex = index;
		point.userData.burstAngle = angle;
		mark(point, "ultimate-effects", true);
	}
	const rearPivot = kit.pivot("game-controller-rear-service-pivot", motion);
	const cover = kit.mesh("game-controller-rear-battery-cover", rounded(.98, .61, .075, .075, 1), creamLight, rearPivot);
	cover.position.set(0, -.15, -.83);
	mark(cover, "rear-battery-cover");
	const coverSeam = kit.mesh("game-controller-rear-battery-cover-seam", rounded(1.07, .7, .035, .09, 1), cavity, rearPivot, false);
	coverSeam.position.set(0, -.15, -.8);
	coverSeam.renderOrder = -1;
	mark(coverSeam, "rear-battery-cover", true);
	const rearInset = kit.mesh("game-controller-rear-upper-centre-inset", rounded(.82, .24, .085, .06, 1), pinkLight, rearPivot);
	rearInset.position.set(0, 1.35, -.89);
	mark(rearInset, "rear-port-cover");
	kit.socket("game-controller-power-connection-socket-inferred", rearPivot, [
		0,
		1.35,
		-.87
	]);
	const screwGeometry = new CylinderGeometry(.072, .072, .035, 8);
	[
		[-.92, -.44],
		[.92, -.44],
		[-1.96, -1.24],
		[1.96, -1.24]
	].forEach(([x, y], index) => {
		const screw = kit.mesh(`game-controller-rear-screw-${index + 1}`, screwGeometry, fastener, rearPivot, false);
		screw.rotation.x = Math.PI * .5;
		screw.position.set(x, y, -.9);
		mark(screw, "rear-screw-array");
	});
	kit.socket("game-controller-left-connection-socket", kit.root, [
		-3.13244048,
		1.78511376,
		1.14
	]);
	kit.socket("game-controller-right-connection-socket", kit.root, [
		3.12759112,
		1.78511376,
		1.14
	]);
	kit.socket("game-controller-top-connection-socket", kit.root, [
		-.00242468,
		4.24035533,
		1.14
	]);
	kit.socket("game-controller-bottom-connection-socket", kit.root, [
		-.00242468,
		-.67012782,
		1.14
	]);
	applyGameControllerOutlineHierarchy(kit.root);
	const build = kit.finish({
		referencePath: options.referencePath ?? REFERENCE_PATH,
		reconstructed: [
			"faceted cream front and rear shells with broad upper deck, narrow waist, deep lower notch and flared ergonomic handles",
			"four separately modeled low-poly pink front/rear grip panels with outlined diagonal material boundaries",
			"faceted cross D-pad, four independent twelve-sided face buttons, two enlarged analog assemblies and two central controls",
			"chunkier two-layer left/right shoulder wedges with frozen hinge pivots and sockets",
			"recessed face-button wells, shoulder hinge caps and independent press pivots for every input family",
			"model-owned extruded stars, tubular electric bolts, polyhedral impact shards and icosahedral energy points for the ultimate burst",
			"rear battery cover, cover seam, upper centre inset, four screw heads and full perimeter shell separation"
		],
		inferred: [
			"PCB, rumble motors, stick gimbals, button membranes, trigger springs and battery contacts are hidden and omitted",
			"rear upper-centre inset function and internal port cavity are inferred; only the observed exterior cover is reconstructed",
			"battery latch, screw drive pattern and exact underside shell wall thickness are not resolved by the supplied views"
		]
	});
	build.root.userData.referenceDimensions = {
		overallWidth: 4.8,
		overallHeight: 3.35,
		shellDepth: 1.28,
		stickSpacing: 1.16,
		lowerNotchWidth: 1.35
	};
	build.root.userData.activeDuration = ACTIVE_DURATION;
	build.root.userData.previewLightingProfile = "sakura-appliance-v2";
	build.root.userData.sculptRuntime.colliders = [
		{
			id: "controller-central-shell",
			type: "box",
			node: "game-controller-motion-pivot"
		},
		{
			id: "controller-left-grip",
			type: "capsule",
			node: "game-controller-left-front-pink-grip-panel"
		},
		{
			id: "controller-right-grip",
			type: "capsule",
			node: "game-controller-right-front-pink-grip-panel"
		}
	];
	build.root.userData.sculptRuntime.destructionGroups = [
		{
			id: "controller-shells",
			nodes: ["game-controller-cream-front-shell", "game-controller-cream-rear-shell"]
		},
		{
			id: "controller-front-controls",
			nodes: [
				"game-controller-dpad-pivot",
				"game-controller-stick-1-pivot",
				"game-controller-stick-2-pivot"
			]
		},
		{
			id: "controller-shoulders",
			nodes: shoulderPivots.map((pivot) => pivot.name)
		},
		{
			id: "controller-ultimate-effects",
			nodes: ["game-controller-ultimate-effects-pivot"]
		},
		{
			id: "controller-rear-service",
			nodes: ["game-controller-rear-service-pivot"]
		}
	];
	build.root.userData.gameControllerEffectContract = {
		owner: "game-controller-model-rig",
		timelineOwner: "AppliancePerformanceSystem",
		forbiddenPrimitives: [
			"PlaneGeometry",
			"Sprite",
			"Line"
		],
		volumeForms: [
			"extruded-star",
			"tube-bolt",
			"octahedral-impact-shard",
			"icosahedral-energy-point"
		]
	};
	return build;
}
//#endregion
export { gameController_exports as n, createGameControllerModel as t };

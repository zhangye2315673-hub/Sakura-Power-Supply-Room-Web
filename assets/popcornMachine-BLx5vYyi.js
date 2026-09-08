import { t as __exportAll } from "./rolldown-runtime-D7D4PA-g.js";
import { At as Path, Dt as Object3D, Hn as SphereGeometry, I as ExtrudeGeometry, J as InstancedMesh, Ln as Shape, N as Euler, S as CylinderGeometry, dr as Vector3, ft as MathUtils, ht as Mesh, i as BoxGeometry, j as DynamicDrawUsage, p as Color } from "./three.core-DlTOC7bx.js";
import { i as RoundedBoxGeometry, t as mergeGeometries } from "./BufferGeometryUtils-Bf_-bT2g.js";
import { a as setHullOutlineStyle, d as ApplianceModelKit } from "./outline-Brkgge31.js";
import { t as ParametricGeometry } from "./ParametricGeometry-B8cqH16S.js";
//#region src/appliances/models/popcornMachine.ts
var popcornMachine_exports = /* @__PURE__ */ __exportAll({ createPopcornMachineModel: () => createPopcornMachineModel });
var V2_REFERENCE_PATH = "references/intake-v2/popcorn-machine/views/front.png";
var CHAMBER_MIN_Y = 1.42;
var CHAMBER_MAX_Y = 2.72;
var CHAMBER_HALF_X = .82;
var CHAMBER_HALF_Z = .49;
function tone(accent, lightness, saturation = 0) {
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
function applyPopcornMachineOutlineHierarchy(root) {
	const mainSilhouette = /rounded-lower-cabinet|continuous-pink-base-band|lower-chamber-frame|wide-upper-chamber-frame|chamber-post|low-pink-dome|dome-eave-band/;
	const secondaryStructure = /delivery-chute|delivery-tray|cabinet-corner-blade|front-marquee|dome-rib|top-crown|window-brace|control-dark-seat|round-control-button|side-release|rear-service-panel/;
	root.traverse((object) => {
		if (!(object instanceof Mesh) || object.userData.isOutline !== true) return;
		const parentName = object.parent?.name ?? object.name;
		const tier = mainSilhouette.test(parentName) ? "main" : secondaryStructure.test(parentName) ? "structure" : "detail";
		setHullOutlineStyle(object, {
			thickness: tier === "main" ? .0048 : tier === "structure" ? .0041 : .0033,
			variation: .18,
			phase: stableOutlinePhase(parentName)
		});
		object.userData.outlineTier = tier;
		object.userData.outlineStable = true;
	});
}
function facetedCabinetGeometry() {
	const shape = new Shape();
	shape.moveTo(-.91, -.63);
	shape.lineTo(.91, -.63);
	shape.lineTo(1.01, -.5);
	shape.lineTo(1.01, .42);
	shape.lineTo(.89, .63);
	shape.lineTo(-.89, .63);
	shape.lineTo(-1.01, .42);
	shape.lineTo(-1.01, -.5);
	shape.closePath();
	const geometry = new ExtrudeGeometry(shape, {
		depth: 1.34,
		bevelEnabled: true,
		bevelSegments: 1,
		bevelSize: .035,
		bevelThickness: .035,
		curveSegments: 1
	});
	geometry.translate(0, 0, -.67);
	return geometry;
}
function seededRandom(seed) {
	let state = seed >>> 0;
	return () => {
		state += 1831565813;
		let value = state;
		value = Math.imul(value ^ value >>> 15, value | 1);
		value ^= value + Math.imul(value ^ value >>> 7, value | 61);
		return ((value ^ value >>> 14) >>> 0) / 4294967296;
	};
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
/** A low superelliptic dome. The rectangular plan is essential: a revolved
* circular cap makes the side elevation much too deep for the turn-sheet. */
function lowRoundedDome(xRadius, yRadius, zRadius) {
	const maximumLatitude = 1.34;
	const planExponent = .63;
	const geometry = new ParametricGeometry((u, v, target) => {
		const longitude = u * Math.PI * 2 - Math.PI;
		const latitude = v * maximumLatitude;
		const radial = Math.cos(latitude);
		target.set(xRadius * radial * signedPower(Math.cos(longitude), planExponent), yRadius * Math.sin(latitude), zRadius * radial * signedPower(Math.sin(longitude), planExponent));
	}, 32, 14);
	reverseWinding(geometry);
	return geometry;
}
function archGeometry(width, height, depth, openingInset = 0) {
	const half = width * .5;
	const shape = new Shape();
	shape.moveTo(-half, -height * .5);
	shape.lineTo(-half, height * .12);
	shape.quadraticCurveTo(-half, height * .5, 0, height * .5);
	shape.quadraticCurveTo(half, height * .5, half, height * .12);
	shape.lineTo(half, -height * .5);
	shape.closePath();
	if (openingInset > 0) {
		const innerWidth = width - openingInset * 2;
		const innerHeight = height - openingInset * 2;
		const innerHalf = innerWidth * .5;
		const hole = new Path();
		hole.moveTo(innerHalf, -innerHeight * .5);
		hole.lineTo(innerHalf, innerHeight * .12);
		hole.quadraticCurveTo(innerHalf, innerHeight * .5, 0, innerHeight * .5);
		hole.quadraticCurveTo(-innerHalf, innerHeight * .5, -innerHalf, innerHeight * .12);
		hole.lineTo(-innerHalf, -innerHeight * .5);
		hole.closePath();
		shape.holes.push(hole);
	}
	const geometry = new ExtrudeGeometry(shape, {
		depth,
		bevelEnabled: true,
		bevelSegments: 3,
		bevelSize: .045,
		bevelThickness: .035,
		curveSegments: 12
	});
	geometry.translate(0, 0, -depth * .5);
	return geometry;
}
function wedgeGeometry() {
	const shape = new Shape();
	shape.moveTo(-.24, -.12);
	shape.lineTo(.22, -.12);
	shape.lineTo(.08, .14);
	shape.lineTo(-.15, .14);
	shape.closePath();
	const geometry = new ExtrudeGeometry(shape, {
		depth: .16,
		bevelEnabled: true,
		bevelSegments: 2,
		bevelSize: .025,
		bevelThickness: .02,
		curveSegments: 6
	});
	geometry.translate(0, 0, -.08);
	return geometry;
}
function popcornGeometry() {
	const lobes = [
		{
			p: [
				-.07,
				.02,
				.01
			],
			s: [
				1.05,
				.82,
				.88
			]
		},
		{
			p: [
				.07,
				.025,
				.015
			],
			s: [
				.92,
				1.02,
				.88
			]
		},
		{
			p: [
				0,
				.085,
				-.025
			],
			s: [
				.88,
				.9,
				.9
			]
		},
		{
			p: [
				.005,
				-.035,
				.055
			],
			s: [
				1,
				.72,
				.9
			]
		},
		{
			p: [
				-.015,
				.015,
				-.065
			],
			s: [
				.8,
				.78,
				.82
			]
		}
	].map(({ p, s }, index) => {
		const geometry = new SphereGeometry(index === 2 ? .095 : .09, 7, 5);
		geometry.scale(s[0], s[1], s[2]);
		geometry.translate(p[0], p[1], p[2]);
		return geometry;
	});
	const merged = mergeGeometries(lobes, false);
	lobes.forEach((geometry) => geometry.dispose());
	if (!merged) throw new Error("Could not merge popcorn lobe geometry.");
	merged.computeVertexNormals();
	return merged;
}
function boundedPosition(target) {
	target.x = MathUtils.clamp(target.x, -.82, CHAMBER_HALF_X);
	target.y = MathUtils.clamp(target.y, CHAMBER_MIN_Y, CHAMBER_MAX_Y);
	target.z = MathUtils.clamp(target.z, -.49, CHAMBER_HALF_Z);
	return target;
}
function staggeredPackedPosition(random, packedPieces, radius, makeCandidate, attempts = 72, clearanceOffsets = [0]) {
	let bestCandidate = boundedPosition(makeCandidate());
	let bestClearance = -Infinity;
	for (let attempt = 0; attempt < attempts; attempt += 1) {
		const candidate = boundedPosition(makeCandidate());
		let nearestClearance = Infinity;
		for (const offset of clearanceOffsets) {
			const clearancePosition = candidate.clone().setY(candidate.y + offset);
			for (const packed of packedPieces) {
				const clearance = clearancePosition.distanceTo(packed.position) / (radius + packed.radius);
				nearestClearance = Math.min(nearestClearance, clearance);
			}
		}
		const scoredClearance = nearestClearance + random() * .002;
		if (scoredClearance > bestClearance) {
			bestClearance = scoredClearance;
			bestCandidate = candidate;
		}
	}
	clearanceOffsets.forEach((offset) => {
		packedPieces.push({
			position: bestCandidate.clone().setY(bestCandidate.y + offset),
			radius
		});
	});
	return bestCandidate;
}
/**
* Procedural reconstruction of the supplied three-view popcorn machine.
*
* Local frame: +Y up, +Z front/dispense side, floor at Y=0. Transparent
* panels, support frames, popper, food system, outlet and controls are kept as
* independent named runtime parts. Hidden heater/gearbox geometry is omitted.
*/
function createPopcornMachineModel(options) {
	const kit = new ApplianceModelKit(options);
	const random = seededRandom(1347375171);
	const accentLight = tone(options.accent, .055, -.035);
	const accentMid = tone(options.accent, -.015, -.02);
	const accentDark = tone(options.accent, -.13, .015);
	const shell = kit.material(16051680, { tint: 7629437 });
	const shellLight = kit.material(16775403, { tint: 8089732 });
	const accent = kit.material(accentMid, { tint: 7036276 });
	const accentSoft = kit.material(accentLight, { tint: 7628668 });
	const accentDeep = kit.material(accentDark, { tint: 5589600 });
	const cavity = kit.material(7489862, { tint: 4994360 });
	const seam = kit.material(7168607, { tint: 5064532 });
	const rubber = kit.material(12289156, { tint: 6310737 });
	const popcornLight = kit.material(16308901, { tint: 9070194 });
	const popcornCream = kit.material(16640964, { tint: 9070194 });
	const kernelGold = kit.material(13802843, { tint: 7032146 });
	const warmLamp = kit.material(16767636, { emissive: 16756825 });
	warmLamp.emissiveIntensity = 0;
	const glass = kit.material(15852498, {
		tint: 10068909,
		transparent: true,
		opacity: .18
	});
	glass.depthWrite = false;
	glass.side = 2;
	const cabinetPivot = kit.pivot("popcorn-machine-lower-cabinet-pivot");
	const lowerCabinet = kit.mesh("popcorn-machine-rounded-lower-cabinet", facetedCabinetGeometry(), shell, cabinetPivot);
	lowerCabinet.position.set(0, .79, 0);
	lowerCabinet.userData.part = "lower-cabinet";
	const baseBand = kit.mesh("popcorn-machine-continuous-pink-base-band", new RoundedBoxGeometry(2.06, .2, 1.38, 4, .09), accent, cabinetPivot);
	baseBand.position.set(0, .17, 0);
	baseBand.userData.part = "base-band";
	for (const x of [-.86, .86]) {
		const cornerBlade = kit.mesh(`popcorn-machine-cabinet-corner-blade-${x < 0 ? "left" : "right"}`, new BoxGeometry(.16, .82, .055, 1, 3, 1), accentSoft, cabinetPivot);
		cornerBlade.position.set(x, .78, .677);
		cornerBlade.rotation.z = x < 0 ? -.06 : .06;
		cornerBlade.userData.part = "cabinet-corner-blades";
	}
	const marqueePanel = kit.mesh("popcorn-machine-front-marquee-panel", new RoundedBoxGeometry(.58, .1, .045, 2, .02), accentDeep, cabinetPivot);
	marqueePanel.position.set(-.1, 1.22, .715);
	marqueePanel.userData.part = "front-marquee";
	const chamberPivot = kit.pivot("popcorn-machine-transparent-chamber-pivot");
	chamberPivot.position.y = 1.39;
	const lowerFrame = kit.mesh("popcorn-machine-lower-chamber-frame", new RoundedBoxGeometry(2, .18, 1.31, 4, .075), shell, chamberPivot);
	lowerFrame.position.y = .09;
	lowerFrame.userData.part = "lower-chamber-frame";
	const upperFrame = kit.mesh("popcorn-machine-wide-upper-chamber-frame", new RoundedBoxGeometry(2.08, .2, 1.38, 4, .075), shellLight, chamberPivot);
	upperFrame.position.y = 1.4;
	upperFrame.userData.part = "upper-chamber-frame";
	const domePivot = kit.pivot("popcorn-machine-top-assembly-pivot");
	domePivot.position.y = 2.82;
	const dome = kit.mesh("popcorn-machine-low-pink-dome", lowRoundedDome(1, .5, .67), accentSoft, domePivot);
	dome.position.y = 0;
	dome.userData.part = "top-dome";
	for (const x of [
		-.7,
		0,
		.7
	]) {
		const roofRib = kit.mesh(`popcorn-machine-dome-rib-${x < 0 ? "left" : x > 0 ? "right" : "center"}`, wedgeGeometry(), x === 0 ? accentDeep : accent, domePivot);
		roofRib.position.set(x, .25, .28);
		roofRib.scale.set(x === 0 ? .42 : .34, .42, .72);
		roofRib.rotation.z = x * -.12;
		roofRib.userData.explodeWithParent = true;
	}
	const domeEave = kit.mesh("popcorn-machine-dome-eave-band", new RoundedBoxGeometry(2.12, .14, 1.4, 4, .065), accent, domePivot);
	domeEave.position.y = .015;
	domeEave.userData.explodeWithParent = true;
	const crown = kit.mesh("popcorn-machine-top-crown", new RoundedBoxGeometry(.34, .14, .27, 4, .055), accent, domePivot);
	crown.position.y = .55;
	crown.userData.part = "top-crown";
	kit.socket("popcorn-machine-dome-crown-seat", domePivot, [
		0,
		.49,
		0
	]);
	const frontPanel = kit.mesh("popcorn-machine-clear-front-panel", new RoundedBoxGeometry(1.78, 1.25, .028, 3, .035), glass, chamberPivot, false);
	frontPanel.position.set(0, .74, .607);
	frontPanel.renderOrder = 5;
	frontPanel.userData.part = "front-glass";
	const backPanel = kit.mesh("popcorn-machine-clear-back-panel", new RoundedBoxGeometry(1.78, 1.25, .028, 3, .035), glass, chamberPivot, false);
	backPanel.position.set(0, .74, -.607);
	backPanel.renderOrder = 5;
	backPanel.userData.part = "back-glass";
	for (const x of [-.93, .93]) {
		const side = kit.mesh(`popcorn-machine-clear-${x < 0 ? "left" : "right"}-panel`, new RoundedBoxGeometry(.028, 1.25, 1.17, 3, .035), glass, chamberPivot, false);
		side.position.set(x, .74, 0);
		side.renderOrder = 5;
		side.userData.part = "side-glass";
	}
	for (const [x, z, label] of [
		[
			-.93,
			.6,
			"front-left"
		],
		[
			.93,
			.6,
			"front-right"
		],
		[
			-.93,
			-.6,
			"rear-left"
		],
		[
			.93,
			-.6,
			"rear-right"
		]
	]) {
		const post = kit.mesh(`popcorn-machine-chamber-post-${label}`, new RoundedBoxGeometry(.105, 1.31, .105, 3, .038), shellLight, chamberPivot);
		post.position.set(x, .75, z);
		post.userData.part = "chamber-posts";
	}
	for (const [x, label] of [[-.78, "left"], [.78, "right"]]) {
		const windowBrace = kit.mesh(`popcorn-machine-front-window-brace-${label}`, new BoxGeometry(.085, 1.05, .055, 1, 4, 1), accentSoft, chamberPivot);
		windowBrace.position.set(x, .75, .626);
		windowBrace.rotation.z = x < 0 ? -.025 : .025;
		windowBrace.userData.part = "window-braces";
	}
	const popperPivot = kit.pivot("popcorn-machine-popper-pivot", domePivot);
	popperPivot.position.set(0, -.2, 0);
	popperPivot.userData.rotationAxis = [
		0,
		1,
		0
	];
	popperPivot.userData.rotationRange = [0, Math.PI * 2];
	kit.socket("popcorn-machine-popper-drive-socket", popperPivot, [
		0,
		.18,
		0
	]);
	const driveColumn = kit.mesh("popcorn-machine-popper-drive-column", new CylinderGeometry(.13, .15, .25, 16), accent, popperPivot);
	driveColumn.position.y = -.01;
	driveColumn.userData.part = "popper-column";
	const rotorDisc = kit.mesh("popcorn-machine-popper-rotating-disc", new CylinderGeometry(.34, .38, .12, 20), accentDeep, popperPivot);
	rotorDisc.position.y = -.16;
	rotorDisc.userData.part = "popper-rotor";
	for (let index = 0; index < 3; index += 1) {
		const arm = kit.mesh(`popcorn-machine-popper-stirring-arm-${index + 1}`, new RoundedBoxGeometry(.48, .055, .07, 2, .025), accent, popperPivot, false);
		arm.position.y = -.22;
		arm.rotation.y = index * Math.PI * 2 / 3;
		arm.userData.explodeWithParent = true;
	}
	const lamp = kit.mesh("popcorn-machine-warm-popper-lamp", new CylinderGeometry(.25, .29, .045, 18), warmLamp, popperPivot, false);
	lamp.position.y = -.235;
	lamp.renderOrder = 3;
	const deliveryPivot = kit.pivot("popcorn-machine-delivery-assembly-pivot", cabinetPivot);
	const chute = kit.mesh("popcorn-machine-deep-arched-delivery-chute", archGeometry(.88, .75, .16, .1), cavity, deliveryPivot);
	chute.position.set(-.1, .67, .69);
	chute.userData.part = "delivery-chute";
	const chuteBack = kit.mesh("popcorn-machine-delivery-chute-back-wall", archGeometry(.72, .6, .03, .06), seam, deliveryPivot, false);
	chuteBack.position.set(-.1, .64, .785);
	chuteBack.userData.explodeWithParent = true;
	const tray = kit.mesh("popcorn-machine-projecting-delivery-tray", new RoundedBoxGeometry(.96, .18, .56, 4, .08), accent, deliveryPivot);
	tray.position.set(-.1, .34, .87);
	tray.rotation.x = -.06;
	tray.userData.part = "delivery-tray";
	const trayLip = kit.mesh("popcorn-machine-delivery-tray-front-lip", new RoundedBoxGeometry(.98, .24, .12, 3, .055), accentSoft, deliveryPivot);
	trayLip.position.set(-.1, .4, 1.12);
	trayLip.userData.explodeWithParent = true;
	kit.socket("popcorn-machine-dispense-socket", deliveryPivot, [
		-.1,
		.76,
		.64
	]);
	const controlPivot = kit.pivot("popcorn-machine-control-pivot", cabinetPivot);
	controlPivot.position.set(.68, .64, .71);
	controlPivot.userData.rotationAxis = [
		0,
		0,
		1
	];
	controlPivot.userData.rotationRange = [-.8, .15];
	kit.socket("popcorn-machine-control-socket", controlPivot, [
		0,
		0,
		0
	]);
	const controlSeat = kit.mesh("popcorn-machine-control-dark-seat", new CylinderGeometry(.17, .17, .055, 18), accentDeep, controlPivot);
	controlSeat.rotation.x = Math.PI * .5;
	const controlButton = kit.mesh("popcorn-machine-round-control-button", new CylinderGeometry(.145, .155, .105, 12), accentSoft, controlPivot);
	controlButton.rotation.x = Math.PI * .5;
	controlButton.position.z = .055;
	kit.mesh("popcorn-machine-control-index-mark", new RoundedBoxGeometry(.025, .075, .018, 1, .007), cavity, controlPivot, false).position.set(0, .075, .12);
	for (const x of [-1.055, 1.055]) {
		const sideHub = kit.mesh(`popcorn-machine-side-chamber-hub-${x < 0 ? "left" : "right"}`, new CylinderGeometry(.115, .115, .075, 16), accent, chamberPivot);
		sideHub.rotation.z = Math.PI * .5;
		sideHub.position.set(x, .72, .02);
		sideHub.userData.part = "side-control";
	}
	const sideRelease = kit.mesh("popcorn-machine-side-release-lever-inferred", wedgeGeometry(), accent, cabinetPivot);
	sideRelease.rotation.y = Math.PI * .5;
	sideRelease.position.set(-1.05, .58, .18);
	sideRelease.userData.part = "side-release";
	kit.mesh("popcorn-machine-rear-service-panel", new RoundedBoxGeometry(1.48, .77, .035, 3, .12), shell, cabinetPivot, false).position.set(0, .74, -.687);
	for (let index = 0; index < 10; index += 1) {
		const vent = kit.mesh(`popcorn-machine-rear-vent-${index + 1}`, new RoundedBoxGeometry(.045, .44, .025, 2, .02), seam, cabinetPivot, false);
		vent.position.set(-.49 + index * .11, .72, -.713);
		vent.userData.explodeWithParent = true;
	}
	kit.socket("popcorn-machine-power-cable-socket", cabinetPivot, [
		0,
		.27,
		-.72
	]);
	for (const [x, z, label] of [
		[
			-.74,
			.43,
			"front-left"
		],
		[
			.74,
			.43,
			"front-right"
		],
		[
			-.74,
			-.43,
			"rear-left"
		],
		[
			.74,
			-.43,
			"rear-right"
		]
	]) {
		const foot = kit.mesh(`popcorn-machine-foot-${label}`, new RoundedBoxGeometry(.32, .12, .3, 3, .05), rubber, kit.root, false);
		foot.position.set(x, .07, z);
		foot.userData.part = "feet";
	}
	const sharedPopcornGeometry = popcornGeometry();
	sharedPopcornGeometry.computeBoundingSphere();
	const popcornBoundingRadius = sharedPopcornGeometry.boundingSphere?.radius ?? .17;
	const staticPieceCount = 56;
	const creamPieceCount = Math.ceil(staticPieceCount / 5);
	const lightPieceCount = 44;
	const makeStaticBatch = (name, count, material) => {
		const batch = new InstancedMesh(sharedPopcornGeometry, material, count);
		batch.name = name;
		batch.castShadow = true;
		batch.receiveShadow = true;
		batch.renderOrder = 2;
		batch.instanceMatrix.setUsage(DynamicDrawUsage);
		batch.userData.applianceId = options.id;
		batch.userData.part = "popcorn-cluster";
		batch.userData.performanceInstances = [];
		kit.root.add(batch);
		kit.interactiveMeshes.push(batch);
		return batch;
	};
	const staticLightBatch = makeStaticBatch("popcorn-machine-popped-kernel-light-batch", lightPieceCount, popcornLight);
	const staticCreamBatch = makeStaticBatch("popcorn-machine-popped-kernel-cream-batch", creamPieceCount, popcornCream);
	const staticBatches = [staticLightBatch, staticCreamBatch];
	const staticTransform = new Object3D();
	const writeStaticInstance = (piece, position, rotation) => {
		staticTransform.position.copy(position);
		staticTransform.rotation.copy(rotation);
		staticTransform.scale.copy(piece.idleScale);
		staticTransform.updateMatrix();
		piece.batch.setMatrixAt(piece.instanceIndex, staticTransform.matrix);
	};
	const packedPieces = [];
	let lightInstanceIndex = 0;
	let creamInstanceIndex = 0;
	for (let index = 0; index < staticPieceCount; index += 1) {
		const creamPiece = index % 5 === 0;
		const batch = creamPiece ? staticCreamBatch : staticLightBatch;
		const instanceIndex = creamPiece ? creamInstanceIndex++ : lightInstanceIndex++;
		const idleRotation = new Euler(random() * 2.4, random() * Math.PI * 2, random() * 2.4);
		const scale = .86 + random() * .3;
		const idleScale = new Vector3(scale * (.9 + random() * .18), scale * (.86 + random() * .22), scale * (.9 + random() * .18));
		const idlePosition = staggeredPackedPosition(random, packedPieces, popcornBoundingRadius * Math.max(idleScale.x, idleScale.y, idleScale.z), () => {
			const x = MathUtils.lerp(-.72, .72, random());
			const z = MathUtils.lerp(-.39, .39, random());
			const xFalloff = 1 - MathUtils.clamp((x / .76) ** 2, 0, 1);
			const zFalloff = 1 - MathUtils.clamp((z / .43) ** 2, 0, 1);
			const moundTop = 1.91 + xFalloff * .24 + zFalloff * .075;
			const y = MathUtils.lerp(1.51, moundTop, random() ** 1.18);
			return new Vector3(x, y, z);
		});
		const phase = random() * Math.PI * 2;
		writeStaticInstance({
			batch,
			instanceIndex,
			idlePosition,
			idleRotation,
			idleScale,
			phase
		}, idlePosition, idleRotation);
		batch.userData.performanceInstances.push({
			instanceIndex,
			idlePosition: idlePosition.toArray(),
			idleRotation: [
				idleRotation.x,
				idleRotation.y,
				idleRotation.z
			],
			idleScale: idleScale.toArray(),
			phase,
			frequency: 7.55 + index % 7 * .31,
			jumpHeight: .09 + index % 5 * .012
		});
	}
	staticBatches.forEach((batch) => {
		batch.instanceMatrix.needsUpdate = true;
	});
	for (let index = 0; index < 24; index += 1) {
		const poppedScale = .78 + index % 5 * .045;
		const jumpHeight = .46 + index % 4 * .055;
		const target = staggeredPackedPosition(random, packedPieces, popcornBoundingRadius * poppedScale, () => new Vector3(MathUtils.lerp(-.68, .68, random()), MathUtils.lerp(1.76, 2.24, random()), MathUtils.lerp(-.37, .37, random())), 96, [
			0,
			jumpHeight * .5,
			jumpHeight + .035
		]);
		const seed = kit.mesh(`popcorn-machine-unpopped-seed-${index + 1}`, new SphereGeometry(.052, 7, 5), kernelGold, kit.root, false);
		seed.scale.set(1.25, .72, .8);
		seed.position.copy(target).setY(1.5 + index % 2 * .055);
		seed.renderOrder = 2;
		const popped = kit.mesh(`popcorn-machine-powered-pop-${index + 1}`, sharedPopcornGeometry, index % 3 === 0 ? popcornCream : popcornLight, kit.root, false);
		popped.position.copy(seed.position);
		popped.scale.setScalar(.001);
		popped.visible = false;
		popped.renderOrder = 2;
		seed.userData.performancePhase = .46 + index * .075;
		popped.userData.performancePhase = .46 + index * .075;
		popped.userData.performanceTarget = target.toArray();
		popped.userData.performanceRotation = [
			random() * 2,
			random() * Math.PI * 2,
			random() * 2
		];
		popped.userData.performanceScale = poppedScale;
		popped.userData.performanceJumpHeight = jumpHeight;
		popped.userData.performanceJumpFrequencyHz = 7.4 + index % 6 * .38;
	}
	const burstRoot = kit.pivot("popcorn-machine-outward-burst-root");
	burstRoot.userData.effectOwner = "PopcornMachinePerformance";
	burstRoot.userData.direction = "inside-to-outside-positive-z";
	const externalPieceCount = 48;
	for (let index = 0; index < externalPieceCount; index += 1) {
		const lateral = (index * 13 % 23 - 11) / 11;
		const heightClass = index % 6;
		const source = new Vector3(-.1, .76, .64);
		const outlet = new Vector3(-.1 + lateral * .22, .78 + heightClass * .018, 1.42);
		const crest = new Vector3(-.1 + lateral * (1.05 + index % 4 * .13), 2.18 + heightClass * .28, 2.72 + index % 4 * .14);
		const exterior = new Vector3(-.1 + lateral * (2.5 + index % 5 * .18), .42 + heightClass * .38, 6.5 + index % 6 * .3);
		const piece = kit.mesh(`popcorn-machine-outward-pop-${index + 1}`, sharedPopcornGeometry, index % 5 === 0 ? popcornCream : popcornLight, burstRoot, false);
		piece.visible = false;
		piece.position.copy(source);
		piece.renderOrder = 3;
		piece.userData.performanceEffect = "same-language-outward-popcorn";
		piece.userData.performanceLaunchTime = .7 + index * .068;
		piece.userData.performanceFlightDuration = 1.45 + index % 5 * .07;
		piece.userData.performancePath = [
			source.toArray(),
			outlet.toArray(),
			crest.toArray(),
			exterior.toArray()
		];
		piece.userData.performanceRotationRate = [
			5.2 + index % 4 * 1.15,
			7.4 + index % 5 * .93,
			4.1 + index % 6 * .82
		];
		piece.userData.performanceScale = .82 + index % 7 * .045;
	}
	const result = kit.finish({
		referencePath: options.referencePath ?? V2_REFERENCE_PATH,
		reconstructed: [
			"tall rounded lower cabinet, continuous pink base band and four feet",
			"wide cream chamber frames, four posts and four independent clear panels",
			"low superelliptic pink dome with crown and broad eave",
			"centered drive column, rotating popper disc and three stirring arms",
			"dense deterministic multi-lobed popcorn pile with golden kernels",
			"deep front arch, projecting tray, layered round control and side release",
			"ten rear ventilation slots and separate rear service panel",
			"popper pivot, dispense socket and power-cable socket"
		],
		inferred: [
			"heater, motor, gearbox and internal dispense gate are hidden and omitted",
			"side triangular projection is interpreted as a release lever",
			"underside tread and power-cable shape are hidden; only a cable socket is provided",
			"popcorn trajectories are purpose-driven while constrained to the observed chamber and outlet"
		]
	});
	applyPopcornMachineOutlineHierarchy(result.root);
	result.root.userData.outlineContract = {
		main: .0048,
		structure: .0041,
		detail: .0033,
		variation: .18,
		stable: true
	};
	result.root.userData.referenceDimensions = {
		totalWidth: 2.12,
		totalHeight: 3.51,
		totalDepth: 1.4,
		lowerCabinetHeight: 1.42,
		chamberHeight: 1.31,
		domeHeight: .69,
		trayProjection: 1.18
	};
	result.root.userData.activeDuration = 5.2;
	result.root.userData.popcornMachinePerformanceRig = {
		timelineOwner: "AppliancePerformanceSystem/PopcornMachinePerformance",
		effectOwner: "PopcornMachinePerformance",
		internalPieceCount: 80,
		staticPieceCount,
		poweredPieceCount: 24,
		externalPieceCount,
		geometryLanguage: "shared-five-lobe-buffer-geometry",
		materialLanguage: "shared-popcorn-light-and-cream-toon-materials",
		direction: "chamber-to-front-outlet-to-positive-z-exterior",
		sharedSpectacleEffects: "must-be-disabled-during-integration"
	};
	result.root.userData.externalPerformanceCue = {
		type: "popcorn-screen-spray",
		socket: "popcorn-machine-dispense-socket",
		poolSize: 18,
		climaxWindow: [3.7, 4.8],
		launchSpeed: [4.8, 7.2],
		cameraBias: .72
	};
	result.root.userData.sculptRuntime.colliders = [
		{
			id: "popcorn-machine-cabinet",
			type: "box",
			node: "popcorn-machine-lower-cabinet-pivot"
		},
		{
			id: "popcorn-machine-chamber",
			type: "box",
			node: "popcorn-machine-transparent-chamber-pivot",
			trigger: true
		},
		{
			id: "popcorn-machine-dome",
			type: "box",
			node: "popcorn-machine-top-assembly-pivot"
		}
	];
	result.root.userData.sculptRuntime.destructionGroups = [
		["popcorn-machine-rounded-lower-cabinet", "popcorn-machine-continuous-pink-base-band"],
		[
			"popcorn-machine-cabinet-corner-blade-left",
			"popcorn-machine-cabinet-corner-blade-right",
			"popcorn-machine-front-marquee-panel"
		],
		["popcorn-machine-clear-front-panel", "popcorn-machine-clear-back-panel"],
		[
			"popcorn-machine-chamber-post-front-left",
			"popcorn-machine-chamber-post-front-right",
			"popcorn-machine-front-window-brace-left",
			"popcorn-machine-front-window-brace-right"
		],
		[
			"popcorn-machine-low-pink-dome",
			"popcorn-machine-top-crown",
			"popcorn-machine-dome-rib-left",
			"popcorn-machine-dome-rib-center",
			"popcorn-machine-dome-rib-right"
		],
		["popcorn-machine-deep-arched-delivery-chute", "popcorn-machine-projecting-delivery-tray"],
		[
			"popcorn-machine-control-dark-seat",
			"popcorn-machine-round-control-button",
			"popcorn-machine-control-index-mark"
		]
	];
	return result;
}
//#endregion
export { popcornMachine_exports as n, createPopcornMachineModel as t };

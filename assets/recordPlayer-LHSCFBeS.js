import { t as __exportAll } from "./rolldown-runtime-D7D4PA-g.js";
import { S as CylinderGeometry, Xn as TorusGeometry, dr as Vector3, ht as Mesh, p as Color } from "./three.core-DlTOC7bx.js";
import { i as RoundedBoxGeometry, o as ensureRecordPlayerPerformanceRig } from "./BufferGeometryUtils-CSuwXBGj.js";
import { a as setHullOutlineStyle, d as ApplianceModelKit, f as orientCylinderBetween } from "./outline-DAm9XhPL.js";
//#region src/appliances/models/recordPlayer.ts
var recordPlayer_exports = /* @__PURE__ */ __exportAll({ createRecordPlayerModel: () => createRecordPlayerModel });
var REFERENCE_PATH = "references/intake/record-player/front.png";
function rounded(width, height, depth, radius) {
	return new RoundedBoxGeometry(width, height, depth, 1, radius);
}
function stableOutlinePhase(name) {
	let hash = 2166136261;
	for (let index = 0; index < name.length; index += 1) {
		hash ^= name.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return (hash >>> 0) % 1e4 * (Math.PI * 2 / 1e4);
}
function applyRecordPlayerOutlineHierarchy(root) {
	const main = /rounded-body-shell|body-side-facet|raised-lid-shell|lid-side-spine|top-deck|front-grille-panel|black-vinyl-platter/;
	const structure = /lower-shell-seam|lid-inner-border|top-lid-latch|rear-hinge|pink-platter-perimeter|tonearm-base|tonearm-counterweight|tonearm-(?:rise|sweep)|pink-cartridge|speed-control-knob|recessed-carry-handle|rear-io-plate|foot-/;
	const excluded = /transparent-lid-panel|performance-|power-status-indicator/;
	root.traverse((object) => {
		if (!(object instanceof Mesh) || object.userData.isOutline !== true) return;
		const source = object.parent?.name ?? object.name;
		const sourceMesh = object.parent instanceof Mesh ? object.parent : null;
		const materials = sourceMesh ? Array.isArray(sourceMesh.material) ? sourceMesh.material : [sourceMesh.material] : [];
		if (excluded.test(source) || materials.some((material) => material.transparent)) {
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
function addCylinderBetween(kit, name, start, end, radius, material, parent, radialSegments = 12) {
	const mesh = kit.mesh(name, new CylinderGeometry(radius, radius, 1, radialSegments), material, parent, false);
	orientCylinderBetween(mesh, start, end);
	return mesh;
}
/**
* SAKURA three-view reconstruction of the compact suitcase record player.
* +Y is up, +Z is the front/grille side, and the floor is y=0.
*/
function createRecordPlayerModel(options) {
	const kit = new ApplianceModelKit(options);
	const accent = new Color(options.accent);
	const accentSoft = accent.clone().offsetHSL(0, -.08, .08).getHex();
	const accentDark = accent.clone().offsetHSL(0, -.06, -.1).getHex();
	const cream = kit.material(16313047, { tint: 7826293 });
	const creamLight = kit.material(16774631, { tint: 8484227 });
	const pink = kit.material(accentSoft, { tint: 7561075 });
	const pinkDark = kit.material(accentDark, { tint: 6115430 });
	const vinyl = kit.material(2368811, { tint: 4604748 });
	const grilleMaterial = kit.material(accentDark, { tint: 6640231 });
	const cavity = kit.material(3814461, { tint: 3157045 });
	const rubber = kit.material(6182496, { tint: 4801359 });
	const metal = kit.material(12103600, { tint: 7827834 });
	const lidMaterial = kit.material(15786195, {
		tint: accentDark,
		transparent: true,
		opacity: .26
	});
	lidMaterial.depthWrite = false;
	const bodyPivot = kit.pivot("record-player-body-pivot");
	bodyPivot.position.y = .54;
	const body = kit.mesh("record-player-rounded-body-shell", rounded(3.55, .78, 2.5, .14), cream, bodyPivot);
	body.userData.part = "body-shell";
	const sideFacetGeometry = new CylinderGeometry(1, 1, 1, 6, 1, false);
	[[-1.65, -1], [1.65, 1]].forEach(([x, direction], index) => {
		const facet = kit.mesh(`record-player-body-side-facet-${index + 1}`, sideFacetGeometry, pink, bodyPivot);
		facet.rotation.z = Math.PI * .5;
		facet.scale.set(.33, .08, .82);
		facet.position.set(x, -.015, 0);
		facet.rotation.y = direction * .08;
		facet.userData.part = "body-side-facets";
	});
	const topDeck = kit.mesh("record-player-top-deck", rounded(3.38, .08, 2.34, .035), creamLight, bodyPivot, false);
	topDeck.position.y = .43;
	topDeck.userData.explodeWithParent = true;
	const lowerSeam = kit.mesh("record-player-lower-shell-seam", rounded(3.44, .045, 2.52, .018), pinkDark, bodyPivot, false);
	lowerSeam.position.y = -.3;
	lowerSeam.userData.explodeWithParent = true;
	const grillePanel = kit.mesh("record-player-front-grille-panel", rounded(3.28, .4, .045, .07), cavity, bodyPivot);
	grillePanel.position.set(0, -.04, 1.265);
	grillePanel.userData.part = "speaker-grille";
	const slatGeometry = rounded(3.08, .025, .035, .012);
	for (let index = 0; index < 11; index += 1) {
		const slat = kit.mesh(`record-player-speaker-grille-slat-${index + 1}`, slatGeometry, grilleMaterial, bodyPivot, false);
		slat.position.set(0, -.195 + index * .031, 1.298);
		slat.userData.part = "grille-slat-array";
		slat.userData.explodeWithParent = true;
	}
	const speakerBadge = kit.mesh("record-player-front-speaker-badge", new CylinderGeometry(.13, .13, .035, 8), creamLight, bodyPivot, false);
	speakerBadge.rotation.x = Math.PI * .5;
	speakerBadge.position.set(-1.39, -.04, 1.292);
	speakerBadge.userData.part = "speaker-badge";
	const speakerPulse = kit.mesh("record-player-front-speaker-pulse-mark", new TorusGeometry(.075, .018, 5, 8), pinkDark, bodyPivot, false);
	speakerPulse.position.set(-1.39, -.04, 1.313);
	speakerPulse.userData.explodeWithParent = true;
	const footGeometry = rounded(.34, .16, .34, .055);
	[
		[-1.4, .98],
		[1.4, .98],
		[-1.4, -.98],
		[1.4, -.98]
	].forEach(([x, z], index) => {
		const foot = kit.mesh(`record-player-foot-${index + 1}`, footGeometry, rubber, kit.root, false);
		foot.position.set(x, .08, z);
		foot.userData.part = "feet";
	});
	const lidPivot = kit.pivot("record-player-lid-hinge-pivot");
	lidPivot.position.set(0, 1, -1.19);
	lidPivot.userData.rotationAxis = [
		1,
		0,
		0
	];
	kit.socket("record-player-lid-attachment-socket", lidPivot, [
		0,
		0,
		0
	]);
	const lidShell = kit.mesh("record-player-raised-lid-shell", rounded(3.46, 2.42, .15, .15), cream, lidPivot);
	lidShell.position.set(0, 1.21, -.02);
	lidShell.userData.part = "lid-shell";
	const lidSideSpineGeometry = rounded(.1, 2.18, .13, .035);
	[-1.61, 1.61].forEach((x, index) => {
		const spine = kit.mesh(`record-player-lid-side-spine-${index + 1}`, lidSideSpineGeometry, pink, lidPivot, false);
		spine.position.set(x, 1.21, .048);
		spine.userData.part = "lid-side-spines";
	});
	const lidInset = kit.mesh("record-player-transparent-lid-panel", rounded(3.16, 2.12, .035, .1), lidMaterial, lidPivot, false);
	lidInset.position.set(0, 1.21, .075);
	lidInset.renderOrder = 5;
	lidInset.userData.part = "lid-panel";
	const lidBorder = kit.mesh("record-player-lid-inner-border", rounded(3.24, 2.2, .04, .105), creamLight, lidPivot, false);
	lidBorder.position.set(0, 1.21, .052);
	lidBorder.scale.z = .98;
	lidBorder.userData.explodeWithParent = true;
	const latch = kit.mesh("record-player-top-lid-latch", rounded(.38, .16, .12, .035), pink, lidPivot);
	latch.position.set(0, 2.34, .08);
	latch.userData.part = "lid-latch";
	const latchInset = kit.mesh("record-player-lid-latch-inset", rounded(.22, .055, .02, .012), pinkDark, lidPivot, false);
	latchInset.position.set(0, 2.3, .148);
	latchInset.userData.explodeWithParent = true;
	lidPivot.rotation.x = -.16;
	[-1.16, 1.16].forEach((x, index) => {
		const hinge = kit.mesh(`record-player-rear-hinge-${index + 1}`, rounded(.32, .25, .13, .04), pink, bodyPivot);
		hinge.position.set(x, .37, -1.275);
		hinge.userData.part = "hinge-pair";
		const pin = kit.mesh(`record-player-rear-hinge-pin-${index + 1}`, new CylinderGeometry(.045, .045, .25, 12), metal, bodyPivot, false);
		pin.rotation.z = Math.PI * .5;
		pin.position.set(x, .37, -1.34);
		pin.userData.explodeWithParent = true;
	});
	const platterPivot = kit.pivot("record-player-platter-spin-pivot", bodyPivot);
	platterPivot.position.set(-.35, .51, 0);
	platterPivot.userData.rotationAxis = [
		0,
		1,
		0
	];
	kit.socket("record-player-platter-axis-socket", platterPivot, [
		0,
		.18,
		0
	]);
	const platter = kit.mesh("record-player-black-vinyl-platter", new CylinderGeometry(1.08, 1.08, .075, 12), vinyl, platterPivot);
	platter.position.y = .06;
	platter.userData.part = "platter";
	const platterRim = kit.mesh("record-player-pink-platter-perimeter", new TorusGeometry(1.055, .075, 6, 12), pink, platterPivot, false);
	platterRim.rotation.x = Math.PI * .5;
	platterRim.position.y = .1;
	platterRim.userData.explodeWithParent = true;
	const recordLabel = kit.mesh("record-player-record-label-ring", new CylinderGeometry(.38, .38, .018, 12), cavity, platterPivot, false);
	recordLabel.position.y = .102;
	recordLabel.userData.explodeWithParent = true;
	const labelRing = kit.mesh("record-player-record-label-rim", new TorusGeometry(.31, .02, 5, 12), metal, platterPivot, false);
	labelRing.rotation.x = Math.PI * .5;
	labelRing.position.y = .116;
	labelRing.userData.explodeWithParent = true;
	const spindle = kit.mesh("record-player-center-spindle", new CylinderGeometry(.035, .045, .22, 14), metal, platterPivot);
	spindle.position.y = .17;
	spindle.userData.part = "spindle";
	[
		.54,
		.72,
		.9
	].forEach((radius, index) => {
		const groove = kit.mesh(`record-player-vinyl-groove-${index + 1}`, new TorusGeometry(radius, .012, 4, 12), pinkDark, platterPivot, false);
		groove.rotation.x = Math.PI * .5;
		groove.position.y = .105;
		groove.userData.part = "vinyl-grooves";
		groove.userData.explodeWithParent = true;
	});
	const tonearmPivot = kit.pivot("record-player-tonearm-pivot", bodyPivot);
	tonearmPivot.position.set(1.05, .55, -.62);
	tonearmPivot.userData.rotationAxis = [
		0,
		1,
		0
	];
	kit.socket("record-player-tonearm-attachment-socket", tonearmPivot, [
		0,
		0,
		0
	]);
	const tonearmBase = kit.mesh("record-player-tonearm-base", new CylinderGeometry(.22, .24, .16, 10), pinkDark, tonearmPivot);
	tonearmBase.position.y = .1;
	tonearmBase.userData.part = "tonearm-base";
	const tonearmCuePivot = kit.pivot("record-player-tonearm-cue-pivot", tonearmPivot);
	tonearmCuePivot.position.set(0, .2, 0);
	tonearmCuePivot.userData.translationAxis = [
		0,
		1,
		0
	];
	tonearmCuePivot.userData.purpose = "lift-and-lower-the-complete-tonearm-before-and-after-sweep";
	const counterweight = kit.mesh("record-player-tonearm-counterweight", new CylinderGeometry(.105, .12, .22, 8), pink, tonearmCuePivot);
	counterweight.rotation.z = Math.PI * .5;
	counterweight.position.set(.07, .055, -.045);
	counterweight.userData.part = "tonearm-counterweight";
	const armStart = new Vector3(0, 0, 0);
	const armMid = new Vector3(-.12, .16, .08);
	const armEnd = new Vector3(-.48, .14, .23);
	addCylinderBetween(kit, "record-player-tonearm-rise", armStart, armMid, .067, cream, tonearmCuePivot, 8);
	addCylinderBetween(kit, "record-player-tonearm-sweep", armMid, armEnd, .058, creamLight, tonearmCuePivot, 8);
	const cartridge = kit.mesh("record-player-pink-cartridge", rounded(.31, .16, .21, .035), pink, tonearmCuePivot);
	cartridge.position.copy(armEnd).add(new Vector3(-.09, -.015, .01));
	cartridge.userData.part = "cartridge";
	const stylus = kit.mesh("record-player-stylus-tip", new CylinderGeometry(.018, .018, .13, 8), metal, tonearmCuePivot, false);
	stylus.position.copy(armEnd).add(new Vector3(-.1, -.1, .01));
	stylus.rotation.z = .12;
	stylus.userData.explodeWithParent = true;
	const controlPivot = kit.pivot("record-player-control-knob-pivot", bodyPivot);
	controlPivot.position.set(1.4, .52, .88);
	controlPivot.userData.rotationAxis = [
		0,
		1,
		0
	];
	kit.socket("record-player-control-socket", controlPivot, [
		0,
		.2,
		0
	]);
	const knob = kit.mesh("record-player-speed-control-knob", new CylinderGeometry(.19, .21, .13, 10), pink, controlPivot);
	knob.position.y = .11;
	knob.userData.part = "control-knob";
	const knobIndex = kit.mesh("record-player-control-index-mark", rounded(.035, .02, .1, .01), creamLight, controlPivot, false);
	knobIndex.position.set(0, .185, .1);
	knobIndex.userData.explodeWithParent = true;
	const indicator = kit.indicator([
		1.59,
		1.03,
		.91
	], .032);
	indicator.name = "record-player-power-status-indicator";
	const handlePivot = kit.pivot("record-player-rear-handle-pivot", bodyPivot);
	handlePivot.position.set(0, -.02, -1.255);
	kit.socket("record-player-handle-attachment-socket", handlePivot, [
		0,
		.28,
		0
	]);
	[-.4, .4].forEach((x, index) => {
		const mount = kit.mesh(`record-player-handle-mount-${index + 1}`, rounded(.26, .3, .12, .055), pink, handlePivot);
		mount.position.set(x, .18, -.015);
		mount.userData.part = "handle-mount";
	});
	const handleBar = kit.mesh("record-player-recessed-carry-handle", rounded(.72, .18, .16, .075), creamLight, handlePivot);
	handleBar.position.set(0, .18, -.08);
	handleBar.userData.part = "carry-handle";
	const handleCavity = kit.mesh("record-player-handle-cavity", rounded(.55, .06, .025, .02), cavity, handlePivot, false);
	handleCavity.position.set(0, .12, -.17);
	handleCavity.userData.explodeWithParent = true;
	const ioPlate = kit.mesh("record-player-rear-io-plate", rounded(.62, .26, .06, .06), pink, bodyPivot);
	ioPlate.position.set(1.08, -.1, -1.275);
	ioPlate.userData.part = "rear-io";
	[-.14, .14].forEach((x, index) => {
		const socket = kit.mesh(`record-player-rear-io-socket-${index + 1}`, new CylinderGeometry(.075, .075, .04, 20), index === 0 ? pinkDark : cavity, bodyPivot, false);
		socket.rotation.x = Math.PI * .5;
		socket.position.set(1.08 + x, -.1, -1.32);
		socket.userData.part = "io-sockets";
	});
	kit.socket("record-player-power-connection-socket", bodyPivot, [
		.94,
		-.1,
		-1.36
	]);
	kit.socket("record-player-audio-connection-socket", bodyPivot, [
		1.22,
		-.1,
		-1.36
	]);
	const motorPivot = kit.pivot("record-player-inferred-motor-pivot", bodyPivot);
	motorPivot.position.set(-.18, .55, -.35);
	motorPivot.visible = false;
	kit.socket("record-player-motor-drive-socket", motorPivot, [
		0,
		0,
		0
	]);
	ensureRecordPlayerPerformanceRig(kit.root, kit.materials);
	const build = kit.finish({
		referencePath: options.referencePath ?? REFERENCE_PATH,
		reconstructed: [
			"low cream rounded suitcase-like base shell with a pink lower seam rail and four independent feet",
			"raised cream lid with inset transparent panel, inner border and centered pink latch",
			"dark circular vinyl platter with pink perimeter, label ring and center spindle",
			"right-rear bent tonearm with independent pivot, pink cartridge and hanging stylus tip",
			"front cavity and eleven horizontal Sakura-pink speaker grille slats",
			"right top control knob with index mark and emissive power indicator",
			"rear two hinge blocks, recessed handle with mounts and dual circular I/O sockets"
		],
		inferred: [
			"internal motor, belt, speaker cone, amplifier and wiring are hidden; motor pivot/socket is non-rendered",
			"hinge stop angle and exact rear connector identities are inferred from side/back silhouettes",
			"record groove relief and stylus contact are simplified for real-time performance"
		]
	});
	build.root.userData.referenceDimensions = {
		totalWidth: 3.55,
		totalHeight: 3.4,
		totalDepth: 2.85,
		baseWidth: 3.55,
		baseHeight: .78,
		baseDepth: 2.5,
		deckWidth: 3.38,
		deckDepth: 2.34,
		lidWidth: 3.46,
		lidClosedDepth: 2.42,
		lidOpenAngle: .16,
		platterDiameter: 2.06
	};
	build.root.userData.activeDuration = 5.2;
	build.root.userData.externalPerformanceCue = {
		type: "record-player-performance-owned-volumetrics",
		socket: "record-player-motor-drive-socket",
		effectOwner: "RecordPlayerPerformance",
		timelineOwner: "ApplianceMechanics/RecordPlayerPerformance",
		sharedSpectacleEffects: "must-be-disabled-during-integration",
		legacyGenericNotes: "removed",
		beatWindow: [1.42, 4.58],
		avoidPlatterIntersection: true
	};
	build.root.userData.recordPlayerPerformanceRig = {
		initialLidPose: "open",
		initialLidRotationX: lidPivot.rotation.x,
		timelineOwner: "ApplianceMechanics/RecordPlayerPerformance",
		effectOwner: "RecordPlayerPerformance",
		mechanicalNodes: {
			wholeMachine: build.root.name,
			lid: lidPivot.name,
			platter: platterPivot.name,
			tonearmSweep: tonearmPivot.name,
			tonearmCue: tonearmCuePivot.name,
			controlKnob: controlPivot.name,
			indicator: indicator.name
		},
		effectGeometry: {
			wave: "closed-irregular-tube",
			notes: "beveled-extrusion",
			particles: "volumetric-only",
			forbidden: [
				"PlaneGeometry",
				"Sprite",
				"Line"
			]
		},
		sharedSpectacleEffects: "must-be-disabled-during-integration"
	};
	build.root.userData.sculptRuntime.colliders = [
		{
			id: "record-player-body",
			type: "box",
			node: "record-player-body-pivot"
		},
		{
			id: "record-player-lid",
			type: "box",
			node: "record-player-lid-hinge-pivot"
		},
		{
			id: "record-player-platter",
			type: "cylinder",
			node: "record-player-platter-spin-pivot",
			trigger: true
		}
	];
	build.root.userData.sculptRuntime.destructionGroups = [
		["record-player-rounded-body-shell", "record-player-top-deck"],
		[
			"record-player-raised-lid-shell",
			"record-player-transparent-lid-panel",
			"record-player-lid-inner-border"
		],
		["record-player-speaker-grille-panel", "record-player-speaker-grille-slat-1"],
		["record-player-black-vinyl-platter", "record-player-pink-platter-perimeter"]
	];
	build.root.traverse((object) => {
		if (object.name.startsWith("record-player-performance-")) build.root.userData.sculptRuntime.nodes[object.name] = object;
	});
	build.root.userData.outlineContract = {
		main: .0048,
		structure: .0041,
		detail: .0033,
		variation: .18,
		stable: true,
		style: "SAKURA low-poly three-band ink; transparent lid and volumetric music effects excluded"
	};
	build.root.userData.recordPlayerV2 = {
		geometryLanguage: "faceted-sakura-suitcase-turntable",
		referenceStatus: "conditional-fallback-v1-three-view-not-gpt-image-2",
		frozenRuntime: [
			"record-player-body-pivot",
			"record-player-lid-hinge-pivot",
			"record-player-platter-spin-pivot",
			"record-player-tonearm-pivot",
			"record-player-tonearm-cue-pivot",
			"record-player-control-knob-pivot",
			"record-player-motor-drive-socket"
		],
		effectCenter: [
			-.35,
			1.2,
			0
		],
		envelopePolicy: "archived v1 bounds, ground and runtime anchors are authoritative"
	};
	applyRecordPlayerOutlineHierarchy(build.root);
	return build;
}
//#endregion
export { recordPlayer_exports as n, createRecordPlayerModel as t };

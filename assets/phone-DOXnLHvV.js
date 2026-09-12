import { t as __exportAll } from "./rolldown-runtime-D7D4PA-g.js";
import { G as IcosahedronGeometry, Hn as SphereGeometry, I as ExtrudeGeometry, Ln as Shape, Qn as TubeGeometry, S as CylinderGeometry, Xn as TorusGeometry, dr as Vector3, ft as MathUtils, ht as Mesh, p as Color, u as CatmullRomCurve3 } from "./three.core-DlTOC7bx.js";
import { i as RoundedBoxGeometry } from "./BufferGeometryUtils-CtH-hlZf.js";
import { a as setHullOutlineStyle, d as ApplianceModelKit } from "./outline-Cv1Jem2g.js";
//#region src/appliances/models/phone.ts
var phone_exports = /* @__PURE__ */ __exportAll({ createPhoneModel: () => createPhoneModel });
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
function applyPhoneOutlineHierarchy(root) {
	const main = /accent-perimeter-rail|cream-rear-shell|front-cream-bezel|layered-rounded-display-glass|rear-rounded-camera-island/;
	const structure = /corner-guard|screen-chin|screen-crown|side-grip|camera-lens-\d+-metal-ring|rear-sakura-ring-motif|independent-power-button|volume-button-/;
	root.traverse((object) => {
		if (!(object instanceof Mesh) || object.userData.isOutline !== true) return;
		const source = object.parent?.name ?? object.name;
		if (/call-feedback|stereo-wave|vibration-pulse|call-signal|notification|information-particle|incoming-/.test(source)) {
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
function chamferedSlabGeometry(width, height, depth, corner) {
	const halfWidth = width * .5;
	const halfHeight = height * .5;
	const cut = Math.min(corner, halfWidth, halfHeight);
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
	const geometry = new ExtrudeGeometry(shape, {
		depth,
		steps: 1,
		bevelEnabled: false,
		curveSegments: 1
	});
	geometry.translate(0, 0, -depth * .5);
	return geometry;
}
function frontDisc(kit, name, radius, depth, material, parent, outlined = false) {
	const mesh = kit.mesh(name, new CylinderGeometry(radius, radius, depth, 18), material, parent, outlined);
	mesh.rotation.x = Math.PI * .5;
	return mesh;
}
var STROKE_FONT = {
	A: [
		[
			-.5,
			-.5,
			0,
			.5
		],
		[
			0,
			.5,
			.5,
			-.5
		],
		[
			-.3,
			0,
			.3,
			0
		]
	],
	C: [
		[
			.45,
			.42,
			.12,
			.5
		],
		[
			.12,
			.5,
			-.42,
			.3
		],
		[
			-.42,
			.3,
			-.42,
			-.3
		],
		[
			-.42,
			-.3,
			.12,
			-.5
		],
		[
			.12,
			-.5,
			.45,
			-.42
		]
	],
	G: [
		[
			.45,
			.42,
			.12,
			.5
		],
		[
			.12,
			.5,
			-.42,
			.3
		],
		[
			-.42,
			.3,
			-.42,
			-.3
		],
		[
			-.42,
			-.3,
			.12,
			-.5
		],
		[
			.12,
			-.5,
			.45,
			-.25
		],
		[
			.45,
			-.25,
			.12,
			-.25
		]
	],
	I: [
		[
			-.42,
			.5,
			.42,
			.5
		],
		[
			0,
			.5,
			0,
			-.5
		],
		[
			-.42,
			-.5,
			.42,
			-.5
		]
	],
	L: [[
		-.42,
		.5,
		-.42,
		-.5
	], [
		-.42,
		-.5,
		.45,
		-.5
	]],
	M: [
		[
			-.5,
			-.5,
			-.5,
			.5
		],
		[
			-.5,
			.5,
			0,
			-.05
		],
		[
			0,
			-.05,
			.5,
			.5
		],
		[
			.5,
			.5,
			.5,
			-.5
		]
	],
	N: [
		[
			-.5,
			-.5,
			-.5,
			.5
		],
		[
			-.5,
			.5,
			.5,
			-.5
		],
		[
			.5,
			-.5,
			.5,
			.5
		]
	],
	O: [
		[
			-.36,
			.5,
			.36,
			.5
		],
		[
			.36,
			.5,
			.5,
			.32
		],
		[
			.5,
			.32,
			.5,
			-.32
		],
		[
			.5,
			-.32,
			.36,
			-.5
		],
		[
			.36,
			-.5,
			-.36,
			-.5
		],
		[
			-.36,
			-.5,
			-.5,
			-.32
		],
		[
			-.5,
			-.32,
			-.5,
			.32
		],
		[
			-.5,
			.32,
			-.36,
			.5
		]
	]
};
function addStrokeText(kit, name, text, material, parent, size, spacing) {
	const group = kit.pivot(name, parent);
	const radius = size * .065;
	const advance = size + spacing;
	const startX = -((text.length - 1) * advance) * .5;
	text.split("").forEach((letter, letterIndex) => {
		const letterGroup = kit.pivot(`${name}-letter-${letterIndex + 1}-${letter}`, group);
		letterGroup.position.x = startX + letterIndex * advance;
		(STROKE_FONT[letter] ?? []).forEach(([x1, y1, x2, y2], strokeIndex) => {
			const start = new Vector3(x1 * size, y1 * size, 0);
			const end = new Vector3(x2 * size, y2 * size, 0);
			const direction = end.clone().sub(start);
			const stroke = kit.mesh(`${name}-letter-${letterIndex + 1}-stroke-${strokeIndex + 1}`, new CylinderGeometry(radius, radius, direction.length(), 7), material, letterGroup, false);
			stroke.position.copy(start).lerp(end, .5);
			stroke.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize());
			stroke.userData.explodeWithParent = true;
		});
	});
	return group;
}
function arcTubeGeometry(radius, startAngle, endAngle, tubeRadius) {
	const points = Array.from({ length: 9 }, (_, index) => {
		const angle = MathUtils.lerp(startAngle, endAngle, index / 8);
		return new Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
	});
	const geometry = new TubeGeometry(new CatmullRomCurve3(points, false, "centripetal"), 18, tubeRadius, 7, false);
	geometry.userData.performanceProp = "volumetric-phone-arc";
	return geometry;
}
function handsetGlyphGeometry() {
	const path = new CatmullRomCurve3([
		new Vector3(-.085, .055, 0),
		new Vector3(-.035, .012, 0),
		new Vector3(.035, -.012, 0),
		new Vector3(.085, .055, 0)
	], false, "centripetal");
	return new TubeGeometry(path, 12, .019, 7, false);
}
/**
* Original Sakura-style smartphone authored from the user's design brief.
* There is deliberately no referencePath fallback: unlike the other appliances,
* this replaces the removed vacuum and is not claimed as an image reconstruction.
* Local frame is +Y up, +Z front, with a real 0.16-unit thick handset.
*/
function createPhoneModel(options) {
	const kit = new ApplianceModelKit(options);
	const accentLight = tone(options.accent, .18, -.05);
	const accentMid = tone(options.accent, .04, -.02);
	const accentDark = tone(options.accent, -.16, .01);
	const cream = kit.material(16249060, { tint: 7760511 });
	const creamLight = kit.material(16775404, { tint: 8221061 });
	const rail = kit.material(accentMid, { tint: 6707826 });
	const railDark = kit.material(accentDark, { tint: 5326681 });
	const lens = kit.material(2434867, { tint: 1973288 });
	const metal = kit.material(11184050, { tint: 6906995 });
	const uiRose = kit.material(accentLight, {
		tint: 7694207,
		emissive: accentLight
	});
	uiRose.emissiveIntensity = 0;
	const screenGlow = kit.material(5067626, {
		tint: 4143434,
		emissive: tone(options.accent, .1, -.12)
	});
	screenGlow.emissiveIntensity = 0;
	const uiWhite = kit.material(16774886, {
		tint: 9272203,
		emissive: 16767464
	});
	uiWhite.emissiveIntensity = 0;
	const callGreen = kit.material(7988912, {
		tint: 5537142,
		emissive: 5625501
	});
	callGreen.emissiveIntensity = 0;
	const callRed = kit.material(15826847, {
		tint: 8410214,
		emissive: 15944562
	});
	callRed.emissiveIntensity = 0;
	const softCyan = kit.material(9101297, {
		tint: 6387865,
		emissive: 5557481
	});
	softCyan.emissiveIntensity = 0;
	const softGold = kit.material(16767375, {
		tint: 9862256,
		emissive: 16758876
	});
	softGold.emissiveIntensity = 0;
	const notificationGlow = kit.material(16773601, {
		tint: 7891583,
		emissive: accentLight
	});
	notificationGlow.emissiveIntensity = 0;
	const shellShade = kit.material(15195106, { tint: 6773618 });
	const handsetPivot = kit.pivot("phone-handset-pivot");
	kit.socket("phone-body-socket", handsetPivot, [
		0,
		.96,
		0
	]);
	const perimeterRail = kit.mesh("phone-accent-perimeter-rail", chamferedSlabGeometry(1.02, 1.92, .17, .13), rail, handsetPivot);
	perimeterRail.position.y = .98;
	perimeterRail.userData.part = "perimeter-rail";
	const rearShell = kit.mesh("phone-cream-rear-shell", chamferedSlabGeometry(.974, 1.87, .14, .115), cream, handsetPivot, false);
	rearShell.position.set(0, .98, -.018);
	rearShell.userData.part = "rear-shell";
	for (const [name, x, y, rotation] of [
		[
			"top-left",
			-.405,
			1.805,
			-.18
		],
		[
			"top-right",
			.405,
			1.805,
			.18
		],
		[
			"bottom-left",
			-.405,
			.155,
			.18
		],
		[
			"bottom-right",
			.405,
			.155,
			-.18
		]
	]) {
		const guard = kit.mesh(`phone-faceted-corner-guard-${name}`, new CylinderGeometry(.105, .125, .19, 6), railDark, handsetPivot, false);
		guard.rotation.set(Math.PI * .5, 0, rotation);
		guard.position.set(x, y, 0);
		guard.scale.set(1, .66, 1);
		guard.userData.part = "corner-guards";
	}
	const rearSpine = kit.mesh("phone-rear-faceted-center-spine", chamferedSlabGeometry(.17, 1.36, .018, .04), shellShade, handsetPivot, false);
	rearSpine.position.set(.28, .87, -.096);
	rearSpine.userData.part = "rear-shell-detail";
	const screenPivot = kit.pivot("phone-screen-assembly-pivot", handsetPivot);
	screenPivot.position.set(0, .99, .09);
	kit.socket("phone-screen-socket", screenPivot, [
		0,
		0,
		0
	]);
	const frontBezel = kit.mesh("phone-front-cream-bezel", chamferedSlabGeometry(.94, 1.8, .035, .1), creamLight, screenPivot, false);
	frontBezel.userData.part = "front-bezel";
	const screen = kit.mesh("phone-layered-rounded-display-glass", chamferedSlabGeometry(.875, 1.71, .032, .082), screenGlow, screenPivot, false);
	screen.position.z = .027;
	screen.userData.part = "display-glass";
	const screenCrown = kit.mesh("phone-low-poly-screen-crown", chamferedSlabGeometry(.54, .08, .025, .028), rail, screenPivot);
	screenCrown.position.set(0, .79, .046);
	screenCrown.userData.part = "screen-trim";
	const screenChin = kit.mesh("phone-low-poly-screen-chin", chamferedSlabGeometry(.42, .055, .025, .02), rail, screenPivot, false);
	screenChin.position.set(0, -.81, .046);
	screenChin.userData.part = "screen-trim";
	for (const side of [-1, 1]) {
		const grip = kit.mesh(`phone-faceted-side-grip-${side < 0 ? "left" : "right"}`, new CylinderGeometry(.052, .068, .54, 6), railDark, handsetPivot, false);
		grip.position.set(side * .485, .88, -.004);
		grip.scale.set(.72, 1, 1);
		grip.userData.part = "side-grips";
	}
	const earpiece = kit.mesh("phone-front-earpiece-slot", new RoundedBoxGeometry(.22, .026, .012, 2, .012), lens, screenPivot, false);
	earpiece.position.set(0, .778, .051);
	earpiece.userData.explodeWithParent = true;
	const frontCamera = frontDisc(kit, "phone-front-camera-dot", .028, .012, lens, screenPivot);
	frontCamera.position.set(.31, .775, .051);
	frontCamera.userData.part = "front-camera";
	const incomingUiPivot = kit.pivot("phone-incoming-call-ui-pivot", screenPivot);
	incomingUiPivot.position.set(0, .03, .058);
	incomingUiPivot.visible = false;
	kit.socket("phone-incoming-call-ui-socket", incomingUiPivot, [
		0,
		0,
		0
	]);
	const avatarPivot = kit.pivot("phone-incoming-avatar-pivot", incomingUiPivot);
	avatarPivot.position.y = .31;
	const avatarHalo = kit.mesh("phone-incoming-avatar-halo", new TorusGeometry(.17, .018, 7, 24), uiRose, avatarPivot, false);
	avatarHalo.userData.performanceRole = "avatar-pulse";
	const avatarFace = kit.mesh("phone-incoming-avatar-face", new SphereGeometry(.125, 14, 9), creamLight, avatarPivot, false);
	avatarFace.scale.set(1, 1, .48);
	avatarFace.position.z = .015;
	avatarFace.userData.performanceRole = "avatar-pulse";
	const avatarHair = kit.mesh("phone-incoming-avatar-hair", new SphereGeometry(.145, 12, 7, 0, Math.PI * 2, 0, Math.PI * .56), railDark, avatarPivot, false);
	avatarHair.scale.set(1, .72, .5);
	avatarHair.position.set(0, .05, .066);
	avatarHair.userData.explodeWithParent = true;
	const avatarBody = kit.mesh("phone-incoming-avatar-body", new RoundedBoxGeometry(.2, .09, .055, 3, .035), uiRose, avatarPivot, false);
	avatarBody.position.set(0, -.13, .01);
	avatarBody.userData.explodeWithParent = true;
	addStrokeText(kit, "phone-contact-name-MOMO", "MOMO", uiWhite, incomingUiPivot, .067, .075).position.y = .035;
	const callingLabel = addStrokeText(kit, "phone-incoming-label-CALLING", "CALLING", uiRose, incomingUiPivot, .035, .027);
	callingLabel.position.y = -.087;
	callingLabel.userData.performanceRole = "prompt-flicker";
	const answerPivot = kit.pivot("phone-call-answer-button-pivot", incomingUiPivot);
	answerPivot.position.set(-.22, -.38, .005);
	answerPivot.userData.performanceRole = "answer-pulse";
	const answerButton = frontDisc(kit, "phone-call-answer-button", .105, .035, callGreen, answerPivot, false);
	answerButton.userData.controlAction = "answer-call";
	const answerGlyph = kit.mesh("phone-call-answer-glyph", handsetGlyphGeometry(), uiWhite, answerPivot, false);
	answerGlyph.position.z = .026;
	answerGlyph.rotation.z = -.18;
	answerGlyph.userData.explodeWithParent = true;
	kit.socket("phone-call-answer-socket", answerPivot, [
		0,
		0,
		.045
	]);
	const hangupPivot = kit.pivot("phone-call-hangup-button-pivot", incomingUiPivot);
	hangupPivot.position.set(.22, -.38, .005);
	hangupPivot.userData.performanceRole = "hangup-pulse";
	const hangupButton = frontDisc(kit, "phone-call-hangup-button", .105, .035, callRed, hangupPivot, false);
	hangupButton.userData.controlAction = "hangup-call";
	const hangupGlyph = kit.mesh("phone-call-hangup-glyph", handsetGlyphGeometry(), uiWhite, hangupPivot, false);
	hangupGlyph.position.z = .026;
	hangupGlyph.rotation.z = .18;
	hangupGlyph.scale.y = -1;
	hangupGlyph.userData.explodeWithParent = true;
	kit.socket("phone-call-hangup-socket", hangupPivot, [
		0,
		0,
		.045
	]);
	const feedbackRoot = kit.pivot("phone-call-feedback-rig", handsetPivot);
	feedbackRoot.position.set(0, .98, .12);
	feedbackRoot.userData.performanceRig = "phone-call-feedback";
	const feedbackMark = (mesh, role) => {
		mesh.userData.performanceEffect = role;
		mesh.userData.explodeWithParent = true;
		mesh.userData.part = "call-feedback";
		mesh.visible = false;
	};
	for (let index = 0; index < 3; index += 1) {
		const wave = kit.mesh(`phone-stereo-wave-ring-${index + 1}`, new TorusGeometry(.46, .018 + index * .004, 8, 28), index === 1 ? softCyan : uiRose, feedbackRoot, false);
		wave.position.z = .05 + index * .008;
		wave.scale.set(.72 + index * .08, 1.22 + index * .1, 1);
		wave.userData.effectIndex = index;
		feedbackMark(wave, "stereo-wave-ring");
	}
	for (let sideIndex = 0; sideIndex < 2; sideIndex += 1) {
		const side = sideIndex === 0 ? -1 : 1;
		for (let index = 0; index < 2; index += 1) {
			const arc = kit.mesh(`phone-vibration-pulse-${side < 0 ? "left" : "right"}-${index + 1}`, arcTubeGeometry(.58 + index * .12, side < 0 ? 1.08 : 2.06, side < 0 ? 2.06 : 3.08, .018), softGold, feedbackRoot, false);
			arc.position.x = side * .35;
			arc.position.y = -.05 + index * .03;
			arc.position.z = .04;
			arc.userData.effectIndex = sideIndex * 2 + index;
			feedbackMark(arc, "vibration-pulse");
		}
	}
	for (let sideIndex = 0; sideIndex < 2; sideIndex += 1) {
		const side = sideIndex === 0 ? -1 : 1;
		for (let index = 0; index < 3; index += 1) {
			const arc = kit.mesh(`phone-call-signal-arc-${side < 0 ? "left" : "right"}-${index + 1}`, arcTubeGeometry(.24 + index * .075, side < 0 ? .88 : 2.26, side < 0 ? 2.26 : 3.4, .014), softCyan, feedbackRoot, false);
			arc.position.set(side * .28, .58, .052);
			arc.userData.effectIndex = sideIndex * 3 + index;
			feedbackMark(arc, "call-signal-arc");
		}
	}
	const dotMaterials = [
		softCyan,
		softGold,
		uiRose
	];
	for (let index = 0; index < 8; index += 1) {
		const dot = kit.mesh(`phone-soft-notification-light-${index + 1}`, new IcosahedronGeometry(.026 + index % 3 * .006, 1), dotMaterials[index % dotMaterials.length], feedbackRoot, false);
		const angle = index / 8 * Math.PI * 2 + .2;
		dot.position.set(Math.cos(angle) * .72, Math.sin(angle) * .95, .08 + index % 2 * .04);
		dot.userData.effectIndex = index;
		dot.userData.baseAngle = angle;
		feedbackMark(dot, "soft-light-point");
	}
	for (let index = 0; index < 6; index += 1) {
		const particlePivot = kit.pivot(`phone-information-particle-${index + 1}`, feedbackRoot);
		const side = index % 2 === 0 ? -1 : 1;
		particlePivot.position.set(side * (.54 + index % 3 * .1), -.48 + Math.floor(index / 2) * .24, .09);
		particlePivot.userData.performanceEffect = "information-particle";
		particlePivot.userData.effectIndex = index;
		particlePivot.visible = false;
		const body = kit.mesh(`phone-information-particle-${index + 1}-body`, new RoundedBoxGeometry(.11 + index % 2 * .03, .074, .045, 3, .025), index % 2 === 0 ? uiWhite : softCyan, particlePivot, false);
		body.userData.explodeWithParent = true;
		const dotA = frontDisc(kit, `phone-information-particle-${index + 1}-dot-a`, .009, .01, uiRose, particlePivot, false);
		dotA.position.set(-.028, 0, .028);
		dotA.userData.explodeWithParent = true;
		const dotB = frontDisc(kit, `phone-information-particle-${index + 1}-dot-b`, .009, .01, uiRose, particlePivot, false);
		dotB.position.set(.028, 0, .028);
		dotB.userData.explodeWithParent = true;
	}
	const powerButtonBaseX = .525;
	const powerButtonPivot = kit.pivot("phone-power-button-pivot", handsetPivot);
	powerButtonPivot.position.set(powerButtonBaseX, 1.03, 0);
	powerButtonPivot.userData.translationAxis = [
		1,
		0,
		0
	];
	powerButtonPivot.userData.translationRange = [-.02, .01];
	kit.socket("phone-power-button-socket", powerButtonPivot, [
		0,
		0,
		0
	]);
	const powerButton = kit.mesh("phone-independent-power-button", new RoundedBoxGeometry(.045, .27, .082, 2, .018), railDark, powerButtonPivot, false);
	powerButton.userData.part = "power-button";
	const volumePivot = kit.pivot("phone-volume-button-pivot", handsetPivot);
	volumePivot.position.set(-.525, 1.26, 0);
	volumePivot.userData.translationAxis = [
		-1,
		0,
		0
	];
	volumePivot.userData.translationRange = [-.01, .02];
	kit.socket("phone-volume-button-socket", volumePivot, [
		0,
		0,
		0
	]);
	for (const [index, y] of [[1, .105], [2, -.105]]) {
		const button = kit.mesh(`phone-volume-button-${index}`, new RoundedBoxGeometry(.045, .15, .082, 2, .018), railDark, volumePivot, false);
		button.position.y = y;
		button.userData.part = "volume-buttons";
	}
	const ioPivot = kit.pivot("phone-bottom-io-pivot", handsetPivot);
	kit.socket("phone-bottom-io-socket", ioPivot, [
		0,
		.035,
		0
	]);
	const usbPort = kit.mesh("phone-bottom-type-c-recess", new RoundedBoxGeometry(.235, .055, .09, 3, .025), lens, ioPivot);
	usbPort.position.y = .035;
	usbPort.userData.part = "usb-c-port";
	const usbTongue = kit.mesh("phone-bottom-type-c-inner-tongue", new RoundedBoxGeometry(.13, .012, .04, 2, .006), uiRose, ioPivot, false);
	usbTongue.position.y = .003;
	usbTongue.userData.explodeWithParent = true;
	kit.socket("phone-usb-c-connection-socket", usbPort, [
		0,
		-.045,
		0
	]);
	for (let index = 0; index < 5; index += 1) {
		const speakerHole = kit.mesh(`phone-bottom-speaker-hole-${index + 1}`, new CylinderGeometry(.017, .017, .055, 8), lens, ioPivot, false);
		speakerHole.position.set(.2 + index * .058, .035, 0);
		speakerHole.userData.explodeWithParent = true;
	}
	kit.mesh("phone-bottom-microphone-hole", new CylinderGeometry(.014, .014, .055, 8), lens, ioPivot, false).position.set(-.27, .035, 0);
	const cameraPivot = kit.pivot("phone-rear-camera-island-pivot", handsetPivot);
	cameraPivot.position.set(-.245, 1.585, -.094);
	kit.socket("phone-rear-camera-island-socket", cameraPivot, [
		0,
		0,
		0
	]);
	const cameraIsland = kit.mesh("phone-rear-rounded-camera-island", chamferedSlabGeometry(.42, .5, .045, .075), rail, cameraPivot, false);
	cameraIsland.userData.part = "camera-island";
	for (const [index, x, y] of [[
		1,
		-.085,
		.105
	], [
		2,
		.085,
		-.095
	]]) {
		const lensPivot = kit.pivot(`phone-rear-camera-lens-${index}-pivot`, cameraPivot);
		lensPivot.position.set(x, y, -.035);
		kit.socket(`phone-camera-lens-${index}-socket`, lensPivot, [
			0,
			0,
			0
		]);
		const ring = kit.mesh(`phone-rear-camera-lens-${index}-metal-ring`, new TorusGeometry(.092, .019, 5, 12), metal, lensPivot, false);
		ring.userData.part = `camera-lens-${index}`;
		const glassLens = frontDisc(kit, `phone-rear-camera-lens-${index}-glass`, .069, .026, lens, lensPivot, false);
		glassLens.position.z = -.015;
		glassLens.scale.x = .94;
		glassLens.userData.explodeWithParent = true;
	}
	const rearFlash = frontDisc(kit, "phone-rear-camera-flash", .038, .018, notificationGlow, cameraPivot);
	rearFlash.position.set(.09, .125, -.04);
	rearFlash.userData.part = "camera-flash";
	kit.mesh("phone-rear-sakura-ring-motif", new TorusGeometry(.075, .012, 6, 20), rail, handsetPivot, false).position.set(0, .73, -.095);
	const petalShape = new Shape();
	for (let index = 0; index < 10; index += 1) {
		const angle = -Math.PI * .5 + index * Math.PI / 5;
		const radius = index % 2 === 0 ? .055 : .022;
		const x = Math.cos(angle) * radius;
		const y = Math.sin(angle) * radius;
		if (index === 0) petalShape.moveTo(x, y);
		else petalShape.lineTo(x, y);
	}
	petalShape.closePath();
	const petalBadge = kit.mesh("phone-rear-sakura-five-petal-badge", new ExtrudeGeometry(petalShape, {
		depth: .012,
		steps: 1,
		bevelEnabled: false,
		curveSegments: 1
	}), rail, handsetPivot, false);
	petalBadge.position.set(0, .73, -.114);
	petalBadge.userData.explodeWithParent = true;
	kit.indicator([
		.35,
		1.7,
		.126
	], .018);
	const build = kit.finish({
		referencePath: null,
		reconstructed: [
			"original Sakura-style eight-corner faceted handset with exaggerated guard caps, side grips, cream rear shell and coloured perimeter rail",
			"enlarged low-poly display with layered cream bezel, crown and chin trims, earpiece slot and independent front-camera dot",
			"volumetric incoming-call screen with portrait, MOMO contact name, CALLING prompt and distinct answer/hang-up controls",
			"model-owned stereo wave rings, vibration pulses, call-signal arcs, soft light points and message-body particles",
			"independent right power button and paired left volume buttons with named pivots and sockets",
			"bottom-centred Type-C recess and tongue, five speaker perforations and a separate microphone perforation",
			"oversized chamfered camera island with two low-segment lens stacks, flash and a brand-neutral five-petal Sakura ring motif",
			"named screen, incoming-call controls, camera and bottom-I/O sockets for gallery orbit and powered animation"
		],
		inferred: [
			"no phone reference image was supplied; the entire handset is an original design guided by the user brief and is not a reference reconstruction",
			"rear-camera island placement, lens count, flash, rear motif and cream back treatment are deliberate design inference",
			"Type-C recess depth, speaker-hole count, microphone location and side-button placement are functional layout inference",
			"internal battery, logic board, antenna breaks, haptics, lens optics, screen stack and all hidden fasteners are intentionally not modeled"
		]
	});
	build.root.userData.phoneEffectContract = {
		modelOwner: "phone-model-rig",
		timelineOwner: "AppliancePerformanceSystem",
		sharedSpectacleEffects: "disabled",
		usesPlaneGeometry: false,
		usesSprite: false,
		forbiddenThemes: [
			"combat-star",
			"electric-bolt",
			"ultimate-attack"
		],
		volumeForms: [
			"torus-stereo-wave",
			"tube-vibration-pulse",
			"tube-call-signal-arc",
			"icosahedral-soft-light",
			"rounded-message-particle"
		]
	};
	build.root.userData.sculptRuntime.destructionGroups.push({
		id: "phone-call-feedback",
		nodes: ["phone-incoming-call-ui-pivot", "phone-call-feedback-rig"]
	});
	build.root.userData.sculptRuntime.destructionGroups.push({
		id: "phone-shell-assembly",
		nodes: [
			"phone-accent-perimeter-rail",
			"phone-cream-rear-shell",
			"phone-front-cream-bezel"
		]
	}, {
		id: "phone-camera-assembly",
		nodes: [
			"phone-rear-camera-island-pivot",
			"phone-rear-camera-lens-1-pivot",
			"phone-rear-camera-lens-2-pivot"
		]
	});
	build.root.userData.outlineContract = {
		main: .0048,
		structure: .0041,
		detail: .0033,
		variation: .18,
		stable: true,
		style: "SAKURA low-poly three-band ink; model-owned call effects excluded"
	};
	build.root.userData.phoneV2 = {
		geometryLanguage: "faceted-handheld-call-totem",
		referenceStatus: "conditional-fallback-original-design-no-gpt-image-2",
		exaggeration: "identity features enlarged within archived envelope by approximately fifteen to twenty-five percent",
		frozenRuntime: [
			"phone-handset-pivot",
			"phone-screen-assembly-pivot",
			"phone-incoming-call-ui-pivot",
			"phone-bottom-io-pivot",
			"phone-rear-camera-island-pivot"
		]
	};
	applyPhoneOutlineHierarchy(build.root);
	return build;
}
//#endregion
export { phone_exports as n, createPhoneModel as t };

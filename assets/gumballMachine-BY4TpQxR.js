import { t as __exportAll } from "./rolldown-runtime-D7D4PA-g.js";
import { At as Path, G as IcosahedronGeometry, Hn as SphereGeometry, I as ExtrudeGeometry, Ln as Shape, Qn as TubeGeometry, S as CylinderGeometry, Xn as TorusGeometry, Z as LatheGeometry, dr as Vector3, ht as Mesh, i as BoxGeometry, l as CapsuleGeometry, p as Color, u as CatmullRomCurve3, ur as Vector2 } from "./three.core-DlTOC7bx.js";
import { i as RoundedBoxGeometry } from "./BufferGeometryUtils-B_UDylAy.js";
import { a as setHullOutlineStyle, d as ApplianceModelKit, i as setHullOutlineSilhouetteOnly } from "./outline-BxlNUz10.js";
//#region src/appliances/models/gumballMachine.ts
var gumballMachine_exports = /* @__PURE__ */ __exportAll({ createGumballMachineModel: () => createGumballMachineModel });
var V2_REFERENCE_PATH = "references/intake-v2/gumball-machine/views/front.png";
function stableOutlinePhase(name) {
	let hash = 2166136261;
	for (let index = 0; index < name.length; index += 1) {
		hash ^= name.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return (hash >>> 0) % 1e4 * (Math.PI * 2 / 1e4);
}
function applyGumballMachineOutlineHierarchy(root) {
	const mainSilhouette = /rounded-frustum-base-shell|transparent-globe-shell|domed-top-lid|wide-top-lid-rim|globe-seat-ring|pink-lower-base-ring|pink-arched-dispense-frame|protruding-dispense-tray|gumball-machine-output-(?:capsule|star-prize|flower-prize|key-prize|bear-prize)/;
	const fineDetail = /foot-|purpose-status|capsule-.*(?:equator-seam|prize)|output-|success-burst|rear-service-panel-seam|rear-cable-notch|center-boss|round-release-button/;
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
var REFERENCE_PATH = "D:/下载文件/ChatGPT Image 2026年8月3日 16_17_49 (7).png";
function tone(accent, lightness, saturation = 0) {
	return new Color(accent).offsetHSL(0, saturation, lightness).getHex();
}
function pedestalGeometry() {
	const points = [
		new Vector2(1.02, -.72),
		new Vector2(1.06, -.62),
		new Vector2(1.01, -.48),
		new Vector2(.94, .24),
		new Vector2(.88, .64),
		new Vector2(.82, .72)
	];
	return new LatheGeometry(points, 12);
}
function lidDomeGeometry() {
	const geometry = new SphereGeometry(1.01, 12, 5, 0, Math.PI * 2, 0, Math.PI * .5);
	geometry.scale(1, .41, .84);
	return geometry;
}
function chuteFrameGeometry() {
	const outer = new Shape();
	outer.moveTo(-.42, -.32);
	outer.lineTo(-.42, .08);
	outer.bezierCurveTo(-.42, .38, -.28, .52, 0, .52);
	outer.bezierCurveTo(.28, .52, .42, .38, .42, .08);
	outer.lineTo(.42, -.32);
	outer.closePath();
	const hole = new Path();
	hole.moveTo(-.28, -.2);
	hole.lineTo(-.28, .06);
	hole.bezierCurveTo(-.28, .27, -.18, .36, 0, .36);
	hole.bezierCurveTo(.18, .36, .28, .27, .28, .06);
	hole.lineTo(.28, -.2);
	hole.closePath();
	outer.holes.push(hole);
	return new ExtrudeGeometry(outer, {
		depth: .13,
		bevelEnabled: true,
		bevelSegments: 1,
		bevelSize: .035,
		bevelThickness: .025,
		curveSegments: 6
	});
}
function tube(points, radius) {
	return new TubeGeometry(new CatmullRomCurve3([...points], false, "centripetal"), 10, radius, 6, false);
}
function capsuleToyShape(kind) {
	const shape = new Shape();
	if (kind === "star") {
		for (let index = 0; index < 10; index += 1) {
			const angle = Math.PI * .5 + index * Math.PI / 5;
			const radius = index % 2 === 0 ? 1 : .45;
			const x = Math.cos(angle) * radius;
			const y = Math.sin(angle) * radius;
			if (index === 0) shape.moveTo(x, y);
			else shape.lineTo(x, y);
		}
		shape.closePath();
		return shape;
	}
	if (kind === "flower") {
		for (let index = 0; index < 24; index += 1) {
			const angle = index * Math.PI / 12;
			const radius = .67 + Math.cos(angle * 6) * .27;
			const x = Math.cos(angle) * radius;
			const y = Math.sin(angle) * radius;
			if (index === 0) shape.moveTo(x, y);
			else shape.lineTo(x, y);
		}
		shape.closePath();
		return shape;
	}
	if (kind === "key") {
		shape.absarc(-.42, .3, .46, 0, Math.PI * 2, false);
		const hole = new Path();
		hole.absarc(-.42, .3, .19, 0, Math.PI * 2, true);
		shape.holes.push(hole);
		shape.moveTo(-.1, .12);
		shape.lineTo(.86, -.84);
		shape.lineTo(1.04, -.66);
		shape.lineTo(.82, -.44);
		shape.lineTo(1.04, -.22);
		shape.lineTo(.83, -.01);
		shape.lineTo(-.02, .28);
		shape.closePath();
		return shape;
	}
	shape.moveTo(-.82, .34);
	shape.bezierCurveTo(-1.02, .74, -.66, 1.02, -.36, .72);
	shape.bezierCurveTo(-.13, .85, .13, .85, .36, .72);
	shape.bezierCurveTo(.66, 1.02, 1.02, .74, .82, .34);
	shape.bezierCurveTo(1.02, -.3, .6, -.91, 0, -.96);
	shape.bezierCurveTo(-.6, -.91, -1.02, -.3, -.82, .34);
	shape.closePath();
	return shape;
}
function capsuleToyGeometry(kind) {
	const geometry = new ExtrudeGeometry(capsuleToyShape(kind), {
		depth: .38,
		bevelEnabled: true,
		bevelSegments: 2,
		bevelSize: .07,
		bevelThickness: .06,
		curveSegments: 10
	});
	geometry.center();
	geometry.scale(.112, .112, .112);
	geometry.computeBoundingBox();
	geometry.computeBoundingSphere();
	return geometry;
}
function outputCapsuleShellGeometry(half) {
	const thetaStart = half === "upper" ? 0 : Math.PI * .5;
	return new SphereGeometry(.285, 18, 10, 0, Math.PI * 2, thetaStart, Math.PI * .5);
}
function successStarGeometry() {
	const geometry = new ExtrudeGeometry(capsuleToyShape("star"), {
		depth: .22,
		bevelEnabled: true,
		bevelSegments: 2,
		bevelSize: .08,
		bevelThickness: .055,
		curveSegments: 2
	});
	geometry.center();
	geometry.scale(.16, .16, .16);
	geometry.computeVertexNormals();
	return geometry;
}
/**
* Procedural reconstruction of the supplied three-view capsule toy machine.
* Local frame: +Y up, +Z front, floor at Y=0. Every serviceable or moving
* assembly is named independently; hidden gearing and the underside remain
* explicitly inferred rather than represented as observed geometry.
*/
function createGumballMachineModel(options) {
	const kit = new ApplianceModelKit(options);
	const accentLight = tone(options.accent, .19, -.07);
	const accentMid = tone(options.accent, .05, -.03);
	const accentDark = tone(options.accent, -.13, .02);
	const cream = kit.material(16183006, { tint: 7958402 });
	const creamLight = kit.material(16775402, { tint: 8484490 });
	const accent = kit.material(accentMid, { tint: 7364469 });
	const accentSoft = kit.material(accentLight, { tint: 7890812 });
	const accentDeep = kit.material(accentDark, { tint: 5852001 });
	const cavity = kit.material(7360082, { tint: 4536645 });
	const rubber = kit.material(10184310, { tint: 5259855 });
	const globe = kit.material(16251641, {
		tint: 8556960,
		transparent: true,
		opacity: .22
	});
	globe.depthWrite = false;
	const capsuleClear = kit.material(16777215, {
		tint: 10138816,
		transparent: true,
		opacity: .34
	});
	capsuleClear.depthWrite = false;
	const globeOutline = kit.material(7897228, {
		tint: 5264483,
		transparent: true,
		opacity: .48
	});
	globeOutline.depthWrite = false;
	const capsulePalette = [
		10344168,
		15509175,
		15912825,
		10408889
	].map((color) => kit.material(color, { tint: 7301244 }));
	const toyPalette = [
		15034751,
		9072578,
		15181383,
		6269329
	].map((color) => kit.material(color, { tint: 5589343 }));
	const toyKinds = [
		"star",
		"flower",
		"key",
		"bear"
	];
	const toyGeometries = new Map(toyKinds.map((kind) => [kind, capsuleToyGeometry(kind)]));
	const successStar = successStarGeometry();
	const successGlow = kit.material(16770982, {
		tint: 8413301,
		emissive: 16747871
	});
	const statusMaterial = kit.indicatorMaterial;
	const motionPivot = kit.pivot("gumball-machine-motion-pivot");
	motionPivot.userData.performanceRoot = true;
	const basePivot = kit.pivot("gumball-machine-base-pivot", motionPivot);
	basePivot.position.y = .8;
	const baseShell = kit.mesh("gumball-machine-rounded-frustum-base-shell", pedestalGeometry(), cream, basePivot);
	baseShell.scale.z = .79;
	baseShell.userData.part = "base-shell";
	for (const [index, x, z, rotationY] of [
		[
			1,
			-.84,
			.56,
			-.18
		],
		[
			2,
			.84,
			.56,
			.18
		],
		[
			3,
			-.84,
			-.56,
			.18
		],
		[
			4,
			.84,
			-.56,
			-.18
		]
	]) {
		const shoulder = kit.mesh(`gumball-machine-pink-shoulder-bracket-${index}`, new BoxGeometry(.2, .43, .16), accentSoft, basePivot);
		shoulder.position.set(x, .47, z);
		shoulder.rotation.y = rotationY;
		shoulder.userData.part = `shoulder-bracket-${index}`;
	}
	const globePivot = kit.pivot("gumball-machine-globe-assembly-pivot", motionPivot);
	globePivot.position.y = 2.42;
	const globeShell = kit.mesh("gumball-machine-transparent-globe-shell", new SphereGeometry(1.38, 12, 8), globe, globePivot, false);
	globeShell.scale.set(1.08, 1, .9);
	globeShell.renderOrder = 6;
	globeShell.userData.part = "globe-shell";
	const frontContour = kit.mesh("gumball-machine-globe-front-silhouette-contour", new TorusGeometry(1.49, .009, 4, 24), globeOutline, globePivot, false);
	frontContour.scale.y = .926;
	frontContour.renderOrder = 7;
	frontContour.userData.explodeWithParent = true;
	const sideContour = kit.mesh("gumball-machine-globe-side-silhouette-contour", new TorusGeometry(1.38, .009, 4, 24), globeOutline, globePivot, false);
	sideContour.rotation.y = Math.PI * .5;
	sideContour.scale.set(.9, 1, 1);
	sideContour.renderOrder = 7;
	sideContour.userData.explodeWithParent = true;
	const topLidPivot = kit.pivot("gumball-machine-top-lid-pivot", globePivot);
	topLidPivot.position.y = 1.03;
	kit.socket("gumball-machine-lid-service-socket", topLidPivot, [
		0,
		0,
		0
	]);
	const lidDome = kit.mesh("gumball-machine-domed-top-lid", lidDomeGeometry(), accent, topLidPivot);
	lidDome.userData.part = "top-lid";
	const lidRim = kit.mesh("gumball-machine-wide-top-lid-rim", new TorusGeometry(1.02, .075, 5, 12), accentDeep, topLidPivot);
	lidRim.rotation.x = Math.PI * .5;
	lidRim.userData.explodeWithParent = true;
	const crown = kit.mesh("gumball-machine-cream-lid-crown", new CylinderGeometry(.16, .18, .16, 10), creamLight, topLidPivot);
	crown.position.y = .47;
	crown.userData.explodeWithParent = true;
	const lowerRing = kit.mesh("gumball-machine-globe-seat-ring", new TorusGeometry(1.02, .075, 5, 12), accentDeep, globePivot);
	lowerRing.rotation.x = Math.PI * .5;
	lowerRing.position.y = -1.03;
	lowerRing.userData.part = "globe-seat-ring";
	const lowerRingHighlight = kit.mesh("gumball-machine-globe-seat-upper-lip", new TorusGeometry(.99, .034, 4, 12), accentSoft, globePivot, false);
	lowerRingHighlight.rotation.x = Math.PI * .5;
	lowerRingHighlight.position.y = -.97;
	lowerRingHighlight.userData.explodeWithParent = true;
	const centerColumn = kit.mesh("gumball-machine-internal-center-column", new RoundedBoxGeometry(.12, 1.34, .12, 3, .035), accent, globePivot);
	centerColumn.position.set(0, .17, -.2);
	centerColumn.userData.part = "center-column";
	const dividerHub = kit.mesh("gumball-machine-inferred-divider-hub", new CylinderGeometry(.21, .23, .09, 10), accentDeep, globePivot);
	dividerHub.position.set(0, -.55, -.04);
	dividerHub.userData.part = "inferred-divider-hub";
	[
		[
			-.6,
			-.42,
			.08,
			.1,
			.2,
			0
		],
		[
			-.28,
			-.52,
			.35,
			-.2,
			.12,
			1
		],
		[
			.08,
			-.52,
			.38,
			.16,
			-.2,
			2
		],
		[
			.45,
			-.47,
			.23,
			-.18,
			.18,
			3
		],
		[
			.63,
			-.36,
			-.14,
			.22,
			-.14,
			0
		],
		[
			-.49,
			-.25,
			-.28,
			-.12,
			.17,
			3
		],
		[
			-.13,
			-.26,
			-.12,
			.24,
			-.22,
			0
		],
		[
			.28,
			-.3,
			-.22,
			-.18,
			-.12,
			1
		],
		[
			.54,
			-.1,
			.05,
			.12,
			.26,
			2
		],
		[
			-.38,
			-.03,
			.04,
			-.16,
			.12,
			1
		],
		[
			.3,
			-.23,
			.12,
			.18,
			-.16,
			2
		],
		[
			-.72,
			-.12,
			.34,
			.14,
			-.16,
			3
		],
		[
			.69,
			-.08,
			.34,
			-.2,
			.15,
			0
		],
		[
			-.58,
			.14,
			-.04,
			.18,
			.12,
			2
		],
		[
			-.08,
			.22,
			.2,
			-.1,
			-.18,
			3
		],
		[
			.38,
			.18,
			-.2,
			.16,
			.19,
			1
		],
		[
			.03,
			.43,
			.03,
			-.14,
			.1,
			0
		]
	].forEach(([x, y, z, rx, rz, palette], index) => {
		const capsulePivot = kit.pivot(`gumball-machine-capsule-${index + 1}-pivot`, globePivot);
		capsulePivot.position.set(x * 1.4, y * 1.5 + .08, z * 1.3);
		capsulePivot.rotation.set(rx, index * .37, rz);
		const upper = kit.mesh(`gumball-machine-capsule-${index + 1}-clear-upper-shell`, new SphereGeometry(.255, 12, 6, 0, Math.PI * 2, 0, Math.PI * .5), capsuleClear, capsulePivot, false);
		upper.renderOrder = 3;
		upper.userData.explodeWithParent = true;
		const lower = kit.mesh(`gumball-machine-capsule-${index + 1}-pastel-lower-shell`, new SphereGeometry(.255, 12, 6, 0, Math.PI * 2, Math.PI * .5, Math.PI * .5), capsulePalette[palette], capsulePivot);
		lower.userData.explodeWithParent = true;
		const seam = kit.mesh(`gumball-machine-capsule-${index + 1}-equator-seam`, new TorusGeometry(.253, .018, 5, 18), accentSoft, capsulePivot, false);
		seam.rotation.x = Math.PI * .5;
		seam.userData.explodeWithParent = true;
		const toyKind = toyKinds[index % toyKinds.length];
		const toyYaw = (index * 2 % 5 - 2) * .1;
		const toyPivot = kit.pivot(`gumball-machine-capsule-${index + 1}-prize-pivot`, capsulePivot);
		toyPivot.position.set(0, .072, .018);
		toyPivot.rotation.set(-rx * .3, -index * .37 + toyYaw, -rz * .3);
		toyPivot.userData.capsulePrize = true;
		toyPivot.userData.capsuleIndex = index + 1;
		toyPivot.userData.prizeKind = toyKind;
		const toy = kit.mesh(`gumball-machine-capsule-${index + 1}-${toyKind}-prize`, toyGeometries.get(toyKind), toyPalette[index % toyPalette.length], toyPivot, false);
		const toyScale = toyKind === "key" ? .98 : toyKind === "star" ? 1.07 : 1.12;
		toy.scale.setScalar(toyScale);
		toy.renderOrder = 2;
		toy.userData.part = `capsule-${index + 1}-${toyKind}-prize`;
		toy.userData.capsulePrize = true;
		toy.userData.capsuleIndex = index + 1;
		toy.userData.prizeKind = toyKind;
		toy.userData.explodeWithParent = true;
	});
	const baseRing = kit.mesh("gumball-machine-pink-lower-base-ring", new CylinderGeometry(1.065, 1.075, .2, 12), accent, basePivot);
	baseRing.scale.z = .79;
	baseRing.position.y = -.69;
	baseRing.userData.part = "base-ring";
	for (const [index, x, z] of [
		[
			1,
			-.72,
			.48
		],
		[
			2,
			.72,
			.48
		],
		[
			3,
			-.72,
			-.48
		],
		[
			4,
			.72,
			-.48
		]
	]) {
		const foot = kit.mesh(`gumball-machine-foot-${index}`, new RoundedBoxGeometry(.26, .1, .23, 3, .04), rubber, basePivot);
		foot.position.set(x, -.79, z);
		foot.userData.part = `foot-${index}`;
	}
	const frontCrankPivot = kit.pivot("gumball-machine-front-crank-pivot", basePivot);
	frontCrankPivot.position.set(0, .22, .79);
	frontCrankPivot.userData.rotationAxis = [
		0,
		0,
		1
	];
	frontCrankPivot.userData.rotationRange = [0, Math.PI * 2];
	kit.socket("gumball-machine-front-crank-socket", frontCrankPivot, [
		0,
		0,
		0
	]);
	const crankSeat = kit.mesh("gumball-machine-front-crank-seat", new CylinderGeometry(.35, .38, .12, 12), accentDeep, frontCrankPivot);
	crankSeat.rotation.x = Math.PI * .5;
	crankSeat.userData.part = "front-crank";
	const crankFace = kit.mesh("gumball-machine-front-crank-face", new CylinderGeometry(.29, .31, .15, 12), accent, frontCrankPivot);
	crankFace.rotation.x = Math.PI * .5;
	crankFace.position.z = .08;
	crankFace.userData.explodeWithParent = true;
	const gripBar = kit.mesh("gumball-machine-front-crank-cross-grip", new CapsuleGeometry(.065, .38, 4, 8), accent, frontCrankPivot);
	gripBar.rotation.z = Math.PI * .5;
	gripBar.position.z = .18;
	gripBar.userData.explodeWithParent = true;
	const crankBoss = kit.mesh("gumball-machine-front-crank-center-boss", new SphereGeometry(.08, 12, 8), accentDeep, frontCrankPivot, false);
	crankBoss.position.z = .24;
	crankBoss.userData.explodeWithParent = true;
	const frontButton = kit.mesh("gumball-machine-front-round-release-button", new CylinderGeometry(.13, .14, .075, 10), accent, basePivot);
	frontButton.rotation.x = Math.PI * .5;
	frontButton.position.set(.57, .43, .8);
	frontButton.userData.part = "release-button";
	const sideCrankPivot = kit.pivot("gumball-machine-side-crank-pivot", basePivot);
	sideCrankPivot.position.set(1, .34, .02);
	sideCrankPivot.userData.rotationAxis = [
		1,
		0,
		0
	];
	sideCrankPivot.userData.rotationRange = [0, Math.PI * 2];
	kit.socket("gumball-machine-side-crank-axle-socket", sideCrankPivot, [
		0,
		0,
		0
	]);
	const sideHub = kit.mesh("gumball-machine-side-crank-hub", new CylinderGeometry(.17, .19, .12, 10), accentDeep, sideCrankPivot);
	sideHub.rotation.z = Math.PI * .5;
	sideHub.userData.part = "side-crank";
	const sideArm = kit.mesh("gumball-machine-side-crank-arm", tube([
		new Vector3(.08, 0, 0),
		new Vector3(.13, -.18, .05),
		new Vector3(.13, -.39, .16)
	], .035), accent, sideCrankPivot);
	sideArm.userData.explodeWithParent = true;
	const sideGrip = kit.mesh("gumball-machine-side-crank-ball-grip", new IcosahedronGeometry(.16, 1), accentSoft, sideCrankPivot);
	sideGrip.position.set(.13, -.39, .16);
	sideGrip.userData.explodeWithParent = true;
	kit.socket("gumball-machine-side-crank-grip-socket", sideCrankPivot, [
		.13,
		-.39,
		.16
	]);
	const chutePivot = kit.pivot("gumball-machine-dispense-chute-pivot", basePivot);
	chutePivot.position.set(0, -.34, .77);
	const chuteBack = kit.mesh("gumball-machine-deep-arched-dispense-cavity", new RoundedBoxGeometry(.6, .48, .12, 4, .18), cavity, chutePivot);
	chuteBack.position.set(0, .07, .06);
	chuteBack.userData.part = "dispense-cavity";
	const chuteFrame = kit.mesh("gumball-machine-pink-arched-dispense-frame", chuteFrameGeometry(), accent, chutePivot);
	chuteFrame.position.set(0, 0, .08);
	chuteFrame.userData.part = "dispense-frame";
	const tray = kit.mesh("gumball-machine-protruding-dispense-tray", new RoundedBoxGeometry(.68, .15, .5, 4, .07), accent, chutePivot);
	tray.position.set(0, -.28, .28);
	tray.userData.part = "dispense-tray";
	kit.socket("gumball-machine-dispense-socket", chutePivot, [
		0,
		.08,
		.24
	]);
	kit.socket("gumball-machine-dispense-tray-rest-socket", chutePivot, [
		0,
		-.2,
		.35
	]);
	const rearPanel = kit.mesh("gumball-machine-rear-rounded-service-panel", new RoundedBoxGeometry(.7, .62, .045, 4, .09), creamLight, basePivot, false);
	rearPanel.position.set(0, .1, -.73);
	rearPanel.userData.part = "rear-service-panel";
	const rearPanelSeam = kit.mesh("gumball-machine-rear-service-panel-seam", new RoundedBoxGeometry(.73, .65, .018, 4, .1), accentDeep, basePivot, false);
	rearPanelSeam.position.set(0, .1, -.69);
	rearPanelSeam.userData.explodeWithParent = true;
	const rearNotch = kit.mesh("gumball-machine-rear-cable-notch", new CylinderGeometry(.16, .16, .1, 10, 1, false, 0, Math.PI), cavity, basePivot, false);
	rearNotch.rotation.x = Math.PI * .5;
	rearNotch.position.set(0, -.7, -.68);
	rearNotch.userData.part = "rear-cable-notch";
	kit.socket("gumball-machine-power-cable-socket", rearNotch, [
		0,
		0,
		-.08
	]);
	kit.mesh("gumball-machine-purpose-status-indicator", new SphereGeometry(.045, 10, 7), statusMaterial, basePivot, false).position.set(.57, .25, .86);
	kit.socket("gumball-machine-capsule-drop-entry-socket", globePivot, [
		.3,
		-.23,
		.12
	]);
	const outputPivot = kit.pivot("gumball-machine-output-capsule-motion-pivot");
	outputPivot.visible = false;
	outputPivot.userData.performanceEffect = true;
	outputPivot.userData.effectOwner = "gumball-machine-model-rig";
	const outputLeft = kit.pivot("gumball-machine-output-capsule-left-shell-pivot", outputPivot);
	const outputRight = kit.pivot("gumball-machine-output-capsule-right-shell-pivot", outputPivot);
	for (const [side, pivot] of [["left", outputLeft], ["right", outputRight]]) {
		const upper = kit.mesh(`gumball-machine-output-capsule-${side}-clear-upper-shell`, outputCapsuleShellGeometry(side === "left" ? "upper" : "lower"), capsuleClear, pivot);
		upper.renderOrder = 3;
		upper.userData.explodeWithParent = true;
		if (side === "right") {
			upper.userData.part = "output-capsule-lower-blue-hemisphere";
			upper.material = capsulePalette[0];
		} else upper.userData.part = "output-capsule-clear-upper-hemisphere";
	}
	const outputSeam = kit.mesh("gumball-machine-output-capsule-equator-seam", new TorusGeometry(.285, .018, 5, 24), creamLight, outputLeft);
	outputSeam.rotation.x = Math.PI * .5;
	outputSeam.userData.part = "output-capsule-clear-cap-seam";
	outputSeam.userData.explodeWithParent = true;
	const outputToyPivot = kit.pivot("gumball-machine-output-prize-pivot");
	outputToyPivot.visible = false;
	outputToyPivot.position.set(-.22, .68, 6.88);
	outputToyPivot.rotation.set(-.08, -.16, .05);
	outputToyPivot.userData.performanceEffect = true;
	outputToyPivot.userData.prizeKind = "star";
	toyKinds.forEach((kind, index) => {
		const outputToy = kit.mesh(`gumball-machine-output-${kind}-prize`, toyGeometries.get(kind), toyPalette[index], outputToyPivot);
		outputToy.visible = kind === "star";
		outputToy.scale.setScalar(2.24);
		outputToy.userData.part = `output-${kind}-prize`;
		outputToy.userData.capsulePrize = true;
		outputToy.userData.prizeKind = kind;
		outputToy.userData.explodeWithParent = true;
	});
	for (let index = 0; index < 3; index += 1) {
		const burstPivot = kit.pivot(`gumball-machine-success-burst-${index + 1}-pivot`);
		burstPivot.visible = false;
		burstPivot.userData.performanceEffect = true;
		burstPivot.userData.effectOwner = "gumball-machine-model-rig";
		const burst = kit.mesh(`gumball-machine-success-burst-${index + 1}-volumetric-star`, successStar, index === 1 ? toyPalette[0] : successGlow, burstPivot, false);
		burst.userData.performanceEffect = true;
		burst.userData.explodeWithParent = true;
	}
	kit.socket("gumball-machine-prize-exit-socket", chutePivot, [
		0,
		.08,
		.24
	]);
	kit.socket("gumball-machine-prize-landing-socket", kit.root, [
		-.16,
		.23,
		3.52
	]);
	applyGumballMachineOutlineHierarchy(kit.root);
	const build = kit.finish({
		referencePath: options.referencePath ?? V2_REFERENCE_PATH,
		reconstructed: [
			"twelve-sided transparent globe whose package and frozen pivot match v1 while its planar silhouette follows the admitted GPT Image 2 turn-sheet",
			"radially faceted pink lid with wide rim and cream crown, double-lip lower globe seat and visible center column",
			"seventeen independently grouped capsules with clear upper hemisphere, pastel lower hemisphere, equator seam and visible star, flower, key or bear prize",
			"twelve-sided front rotary crank with bearing seat, face, transverse grip and center boss",
			"side axle crank with low-segment bent arm and oversized faceted hand grip",
			"real-depth arched dispense cavity, separate pink frame and projecting tray",
			"twelve-sided tapered cream pedestal, four inset pink shoulder brackets, rear service hatch, lower cable notch, four feet and power-cable socket",
			"purpose-readable super-draw cycle: right crank full-turn/rebound, top-impact capsule frenzy, selection pause, one same-language capsule launch with two bounces and roll, split-shell opening, toy landing and three volumetric success stars"
		],
		inferred: [
			"internal divider wheel, anti-double-feed flap and curved chute are hidden; only a collision-safe animation route and a restrained divider hub are provided",
			"side crank and front crank share a hidden gear train; the linkage is not claimed as observed",
			"rear hatch latch depth and inner service volume are concealed; a shallow molded panel is used",
			"underside fasteners, wiring and cable storage are not visible; four symmetric feet and a rear cable socket are inferred"
		]
	});
	const runtime = build.root.userData.sculptRuntime;
	runtime.colliders = [
		{
			id: "gumball-machine-pedestal",
			type: "cylinder",
			node: "gumball-machine-base-pivot"
		},
		{
			id: "gumball-machine-globe",
			type: "sphere",
			node: "gumball-machine-globe-assembly-pivot"
		},
		{
			id: "gumball-machine-dispense-trigger",
			type: "box",
			node: "gumball-machine-dispense-chute-pivot",
			trigger: true
		}
	];
	runtime.destructionGroups = [
		{
			id: "globe-assembly",
			nodes: [
				"gumball-machine-transparent-globe-shell",
				"gumball-machine-domed-top-lid",
				"gumball-machine-globe-seat-ring",
				"gumball-machine-internal-center-column"
			]
		},
		{
			id: "pedestal-assembly",
			nodes: [
				"gumball-machine-rounded-frustum-base-shell",
				"gumball-machine-pink-lower-base-ring",
				"gumball-machine-pink-shoulder-bracket-1",
				"gumball-machine-pink-shoulder-bracket-2",
				"gumball-machine-pink-shoulder-bracket-3",
				"gumball-machine-pink-shoulder-bracket-4"
			]
		},
		{
			id: "control-assembly",
			nodes: ["gumball-machine-front-crank-pivot", "gumball-machine-side-crank-pivot"]
		},
		{
			id: "dispense-assembly",
			nodes: ["gumball-machine-dispense-chute-pivot"]
		},
		{
			id: "prize-reveal-assembly",
			nodes: ["gumball-machine-output-capsule-motion-pivot", "gumball-machine-output-prize-pivot"]
		},
		{
			id: "service-assembly",
			nodes: ["gumball-machine-rear-rounded-service-panel", "gumball-machine-rear-cable-notch"]
		}
	];
	build.root.userData.activeDuration = 5.2;
	build.root.userData.visualRevision = "sakura-gumball-machine-v2";
	build.root.userData.legacyReferencePath = REFERENCE_PATH;
	build.root.userData.previewLightingProfile = "sakura-appliance-v2";
	build.root.userData.outlineContract = {
		main: .0048,
		structure: .0041,
		detail: .0033,
		variation: .18,
		stable: true
	};
	build.root.userData.externalPerformanceCue = {
		type: "gumball-model-owned-prize-reveal",
		socket: "gumball-machine-prize-exit-socket",
		climaxWindow: [2.13, 4.95],
		pooled: false
	};
	applyGumballMachineOutlineHierarchy(build.root);
	setHullOutlineSilhouetteOnly(build.root.getObjectByName("gumball-machine-output-capsule-left-clear-upper-shell-ink"), true);
	return build;
}
//#endregion
export { gumballMachine_exports as n, createGumballMachineModel as t };

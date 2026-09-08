import { t as __exportAll } from "./rolldown-runtime-D7D4PA-g.js";
import { A as DodecahedronGeometry, I as ExtrudeGeometry, Ln as Shape, Qn as TubeGeometry, S as CylinderGeometry, Xn as TorusGeometry, Z as LatheGeometry, dr as Vector3, ht as Mesh, p as Color, u as CatmullRomCurve3, ur as Vector2 } from "./three.core-DlTOC7bx.js";
import { i as RoundedBoxGeometry } from "./BufferGeometryUtils-Bf_-bT2g.js";
import { a as setHullOutlineStyle, d as ApplianceModelKit } from "./outline-Brkgge31.js";
//#region src/appliances/models/standMixer.ts
var standMixer_exports = /* @__PURE__ */ __exportAll({ createStandMixerModel: () => createStandMixerModel });
var REFERENCE_PATH = "references/intake-v2/stand-mixer/views/front.png";
function stableOutlinePhase(name) {
	let hash = 2166136261;
	for (let index = 0; index < name.length; index += 1) {
		hash ^= name.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return (hash >>> 0) % 1e4 * (Math.PI * 2 / 1e4);
}
function applyStandMixerOutlineHierarchy(root) {
	const mainSilhouette = /stepped-base-shell|tapered-rear-column|rounded-motor-head|deep-mixing-bowl|rolled-bowl-rim/;
	const fineDetail = /status-indicator|vent-slot|whisk-wire|liquid|dollop|droplet|wave-ridge|cream-settle|foot|dial-index|hinge-inset/;
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
function shifted(color, lightness) {
	return new Color(color).offsetHSL(0, -.04, lightness).getHex();
}
function rounded(width, height, depth, radius) {
	return new RoundedBoxGeometry(width, height, depth, 5, radius);
}
function bowlGeometry() {
	const profile = [
		new Vector2(.57, 0),
		new Vector2(.73, .04),
		new Vector2(.91, .22),
		new Vector2(1.05, .58),
		new Vector2(1.1, 1.08),
		new Vector2(1.14, 1.36),
		new Vector2(1.09, 1.43)
	];
	const geometry = new LatheGeometry(profile, 32);
	geometry.computeVertexNormals();
	return geometry;
}
function handleCurve(angle) {
	const radial = new Vector3(Math.cos(angle), 0, Math.sin(angle));
	return new CatmullRomCurve3([
		radial.clone().multiplyScalar(1.02).setY(1.15),
		radial.clone().multiplyScalar(1.31).setY(1.1),
		radial.clone().multiplyScalar(1.35).setY(.68),
		radial.clone().multiplyScalar(1.26).setY(.34),
		radial.clone().multiplyScalar(.98).setY(.38)
	], false, "catmullrom", .5);
}
function columnGeometry() {
	const profile = new Shape();
	profile.moveTo(1.04, 0);
	profile.lineTo(1.04, 2.92);
	profile.lineTo(.08, 2.92);
	profile.bezierCurveTo(.08, 2.2, .16, 1.35, .48, .46);
	profile.bezierCurveTo(.52, .28, .55, .12, .56, 0);
	profile.closePath();
	const geometry = new ExtrudeGeometry(profile, {
		depth: .94,
		steps: 1,
		bevelEnabled: true,
		bevelSegments: 3,
		bevelSize: .07,
		bevelThickness: .07,
		curveSegments: 8
	});
	geometry.translate(0, 0, -.47);
	geometry.rotateY(Math.PI * .5);
	geometry.computeVertexNormals();
	return geometry;
}
function whiskWireCurve(angle) {
	const radial = new Vector3(Math.cos(angle), 0, Math.sin(angle));
	return new CatmullRomCurve3([
		radial.clone().multiplyScalar(.12).setY(-.02),
		radial.clone().multiplyScalar(.29).setY(-.2),
		radial.clone().multiplyScalar(.48).setY(-.56),
		radial.clone().multiplyScalar(.42).setY(-.88),
		radial.clone().multiplyScalar(.14).setY(-1.08)
	], false, "catmullrom", .55);
}
function vortexVolumeGeometry() {
	const profile = [
		new Vector2(0, -.16),
		new Vector2(.72, -.16),
		new Vector2(.87, -.1),
		new Vector2(.91, .02),
		new Vector2(.83, .09),
		new Vector2(.63, .065),
		new Vector2(.45, -.005),
		new Vector2(.27, -.095),
		new Vector2(.09, -.205),
		new Vector2(0, -.18)
	];
	const geometry = new LatheGeometry(profile, 40);
	geometry.computeVertexNormals();
	geometry.userData.performanceProp = "closed-volumetric-mixture-vortex";
	geometry.userData.forbiddenPrimitives = [
		"PlaneGeometry",
		"Sprite",
		"Line"
	];
	return geometry;
}
function irregularLiquidRingGeometry(index) {
	const points = [];
	const count = 36;
	for (let point = 0; point < count; point += 1) {
		const angle = point / count * Math.PI * 2;
		const radius = .36 + index * .14 + Math.sin(angle * (3 + index) + index * .8) * .035;
		points.push(new Vector3(Math.cos(angle) * radius, Math.sin(angle * 4 + index) * (.025 + index * .008), Math.sin(angle) * radius));
	}
	const geometry = new TubeGeometry(new CatmullRomCurve3(points, true, "centripetal", .42), 72, .035 + index * .008, 7, true);
	geometry.userData.performanceProp = "volumetric-mixture-wave-ridge";
	geometry.userData.forbiddenPrimitives = [
		"PlaneGeometry",
		"Sprite",
		"Line"
	];
	return geometry;
}
function creamPeakGeometry() {
	const profile = [
		new Vector2(0, 0),
		new Vector2(.2, .025),
		new Vector2(.27, .11),
		new Vector2(.2, .2),
		new Vector2(.13, .31),
		new Vector2(.075, .44),
		new Vector2(.02, .55),
		new Vector2(0, .59)
	];
	const geometry = new LatheGeometry(profile, 24);
	geometry.computeVertexNormals();
	geometry.userData.performanceProp = "whipped-cream-settle-peak";
	geometry.userData.forbiddenPrimitives = [
		"PlaneGeometry",
		"Sprite",
		"Line"
	];
	return geometry;
}
function liquidArcGeometry(index) {
	const side = index % 2 === 0 ? -1 : 1;
	const reach = .72 + index % 3 * .16;
	const curve = new CatmullRomCurve3([
		new Vector3(0, 0, 0),
		new Vector3(side * .18, .32 + index % 2 * .08, .04),
		new Vector3(side * reach * .66, .66 + index % 3 * .1, .1),
		new Vector3(side * reach, .34 + index % 2 * .08, .16)
	], false, "centripetal", .48);
	const geometry = new TubeGeometry(curve, 24, .052 + index % 3 * .012, 8, false);
	geometry.userData.performanceProp = "volumetric-liquid-pull-arc";
	geometry.userData.forbiddenPrimitives = [
		"PlaneGeometry",
		"Sprite",
		"Line"
	];
	return geometry;
}
function liquidDropGeometry(index) {
	const width = .065 + index % 3 * .012;
	const height = .18 + index % 4 * .025;
	const geometry = new LatheGeometry([
		new Vector2(0, -height * .5),
		new Vector2(width * .9, -height * .26),
		new Vector2(width, 0),
		new Vector2(width * .6, height * .28),
		new Vector2(0, height * .5)
	], 12);
	geometry.computeVertexNormals();
	geometry.userData.performanceProp = "volumetric-liquid-droplet";
	geometry.userData.forbiddenPrimitives = [
		"PlaneGeometry",
		"Sprite",
		"Line"
	];
	return geometry;
}
function createStandMixerModel(options) {
	const kit = new ApplianceModelKit(options);
	const pink = shifted(options.accent, .02);
	const pinkLight = shifted(options.accent, .13);
	const pinkDark = shifted(options.accent, -.11);
	const cream = kit.material(16313301, { tint: 8089985 });
	const creamHighlight = kit.material(16774886, { tint: 8812935 });
	const pinkMaterial = kit.material(pink, { tint: 7758970 });
	const pinkLightMaterial = kit.material(pinkLight, { tint: 8416638 });
	const pinkDarkMaterial = kit.material(pinkDark, { tint: 6706791 });
	const steel = kit.material(14209221, { tint: 6910076 });
	const cavity = kit.material(7692905, { tint: 4538187 });
	const rubber = kit.material(5327442, { tint: 3749184 });
	const mixture = kit.material(16767370, {
		tint: 9070448,
		emissive: 16757831
	});
	mixture.emissiveIntensity = .025;
	const creamMixture = kit.material(16773319, {
		tint: 9072496,
		emissive: 16765057
	});
	creamMixture.emissiveIntensity = .018;
	const eggMixture = kit.material(16234059, {
		tint: 8672868,
		emissive: 14251300
	});
	eggMixture.emissiveIntensity = .025;
	const basePivot = kit.pivot("stand-mixer-base-pivot");
	const base = kit.mesh("stand-mixer-stepped-base-shell", rounded(3.08, .48, 3.8, .16), pinkMaterial, basePivot);
	base.position.set(0, .29, -.15);
	base.userData.part = "base-shell";
	const baseTop = kit.mesh("stand-mixer-base-upper-step", rounded(2.86, .2, 3.52, .09), pinkLightMaterial, basePivot, false);
	baseTop.position.set(0, .57, -.12);
	baseTop.userData.explodeWithParent = true;
	const sharedFoot = rounded(.42, .09, .4, .035);
	[
		[
			-1.25,
			.04,
			1.42
		],
		[
			1.25,
			.04,
			1.42
		],
		[
			-1.25,
			.04,
			-1.72
		],
		[
			1.25,
			.04,
			-1.72
		]
	].forEach(([x, y, z], i) => {
		const foot = kit.mesh(`stand-mixer-rubber-foot-${i + 1}`, sharedFoot, rubber, basePivot, false);
		foot.position.set(x, y, z);
		foot.userData.part = `foot-${i + 1}`;
	});
	const columnPivot = kit.pivot("stand-mixer-rear-column-pivot");
	columnPivot.position.set(0, .55, -.78);
	const column = kit.mesh("stand-mixer-tapered-rear-column", columnGeometry(), pinkMaterial, columnPivot);
	column.userData.part = "rear-column";
	const columnFace = kit.mesh("stand-mixer-column-front-highlight", rounded(.72, 1.52, .06, .03), pinkLightMaterial, columnPivot, false);
	columnFace.position.set(0, 2.08, -.035);
	columnFace.userData.explodeWithParent = true;
	const lowerDialPivot = kit.pivot("stand-mixer-lower-control-dial-pivot", columnPivot);
	lowerDialPivot.position.set(0, .56, -.49);
	const lowerRing = kit.mesh("stand-mixer-lower-control-ring", new TorusGeometry(.28, .065, 10, 28), pinkDarkMaterial, lowerDialPivot);
	lowerRing.userData.part = "lower-control";
	const lowerDial = kit.mesh("stand-mixer-lower-cream-control-dial", new CylinderGeometry(.2, .2, .08, 24), cream, lowerDialPivot, false);
	lowerDial.rotation.x = Math.PI * .5;
	lowerDial.position.z = .035;
	lowerDial.userData.explodeWithParent = true;
	const headPivot = kit.pivot("stand-mixer-motor-head-pivot");
	headPivot.position.set(0, 3.35, -1.5);
	headPivot.userData.rotationAxis = [
		1,
		0,
		0
	];
	kit.socket("stand-mixer-head-hinge-socket", columnPivot, [
		0,
		2.8,
		-.72
	]);
	const head = kit.mesh("stand-mixer-rounded-motor-head", rounded(1.82, 1.4, 3.55, .48), cream, headPivot);
	head.position.set(0, .38, 1.22);
	head.userData.part = "motor-head-shell";
	const headHighlight = kit.mesh("stand-mixer-head-upper-highlight", rounded(1.55, .42, 3.28, .18), creamHighlight, headPivot, false);
	headHighlight.position.set(0, .83, 1.22);
	headHighlight.userData.explodeWithParent = true;
	const seamBand = kit.mesh("stand-mixer-continuous-pink-head-band", rounded(1.855, .11, 3.49, .04), pinkLightMaterial, headPivot, false);
	seamBand.position.set(0, -.04, 1.22);
	seamBand.userData.part = "head-seam-band";
	const lowerHeadRail = kit.mesh("stand-mixer-head-lower-cream-rail", rounded(1.78, .17, 3.39, .065), creamHighlight, headPivot, false);
	lowerHeadRail.position.set(0, -.17, 1.22);
	lowerHeadRail.userData.explodeWithParent = true;
	[-1, 1].forEach((side, index) => {
		const hingePivot = kit.pivot(`stand-mixer-side-hinge-pivot-${index + 1}`);
		hingePivot.position.set(side * .62, 3.34, -1.48);
		const hinge = kit.mesh(`stand-mixer-side-hinge-cap-${index + 1}`, new CylinderGeometry(.32, .32, .12, 28), pinkMaterial, hingePivot);
		hinge.rotation.z = Math.PI * .5;
		hinge.userData.part = `side-hinge-${index + 1}`;
		const inset = kit.mesh(`stand-mixer-side-hinge-inset-${index + 1}`, new CylinderGeometry(.2, .2, .135, 24), pinkLightMaterial, hingePivot, false);
		inset.rotation.z = Math.PI * .5;
		inset.userData.explodeWithParent = true;
	});
	const speedDialPivot = kit.pivot("stand-mixer-front-speed-dial-pivot", headPivot);
	speedDialPivot.position.set(0, .28, 3.05);
	speedDialPivot.userData.rotationAxis = [
		0,
		0,
		1
	];
	kit.socket("stand-mixer-speed-control-socket", speedDialPivot, [
		0,
		0,
		0
	]);
	const speedOuter = kit.mesh("stand-mixer-front-speed-dial-outer-ring", new TorusGeometry(.27, .05, 10, 28), pinkDarkMaterial, speedDialPivot);
	speedOuter.userData.part = "speed-dial";
	const speedDial = kit.mesh("stand-mixer-front-speed-dial", new CylinderGeometry(.21, .21, .11, 28), pinkLightMaterial, speedDialPivot, false);
	speedDial.rotation.x = Math.PI * .5;
	speedDial.position.z = .025;
	speedDial.userData.explodeWithParent = true;
	const dialMarker = kit.mesh("stand-mixer-speed-dial-index", rounded(.035, .13, .02, .008), cavity, speedDialPivot, false);
	dialMarker.position.set(0, .08, .1);
	dialMarker.userData.explodeWithParent = true;
	const releasePivot = kit.pivot("stand-mixer-head-release-lever-pivot", headPivot);
	releasePivot.position.set(-.98, -.2, -.05);
	releasePivot.userData.rotationAxis = [
		1,
		0,
		0
	];
	const release = kit.mesh("stand-mixer-stepped-head-release-lever", rounded(.18, .18, .42, .07), pinkLightMaterial, releasePivot);
	release.position.z = .09;
	release.userData.part = "head-release-lever";
	const rearVentPanel = kit.mesh("stand-mixer-arched-rear-vent-panel", rounded(.82, .62, .04, .19), creamHighlight, headPivot, false);
	rearVentPanel.position.set(0, .2, -.58);
	rearVentPanel.userData.part = "rear-vent-panel";
	const ventGeometry = rounded(.055, .31, .05, .024);
	for (let i = 0; i < 8; i += 1) {
		const vent = kit.mesh(`stand-mixer-rear-vent-slot-${i + 1}`, ventGeometry, cavity, headPivot, false);
		const x = (i - 3.5) * .095;
		vent.position.set(x, .21 - Math.abs(i - 3.5) * .012, -.62);
		vent.userData.part = `rear-vent-slot-${i + 1}`;
	}
	const planetaryPivot = kit.pivot("stand-mixer-planetary-pivot", headPivot);
	planetaryPivot.position.set(0, -.22, 1.9);
	planetaryPivot.userData.rotationAxis = [
		0,
		1,
		0
	];
	kit.socket("stand-mixer-tool-drive-socket", planetaryPivot, [
		0,
		-.04,
		0
	]);
	const hub = kit.mesh("stand-mixer-stepped-planetary-hub", new CylinderGeometry(.34, .38, .28, 28), cream, planetaryPivot);
	hub.userData.part = "planetary-hub";
	const hubStep = kit.mesh("stand-mixer-planetary-hub-lower-step", new CylinderGeometry(.25, .29, .19, 24), creamHighlight, planetaryPivot, false);
	hubStep.position.y = -.21;
	hubStep.userData.explodeWithParent = true;
	const beaterPivot = kit.pivot("stand-mixer-beater-spin-pivot", planetaryPivot);
	beaterPivot.position.set(.12, -.31, 0);
	beaterPivot.userData.rotationAxis = [
		0,
		1,
		0
	];
	beaterPivot.userData.attachment = {
		parentId: "stand-mixer-planetary-pivot",
		parentSocket: "stand-mixer-tool-drive-socket",
		localStart: [
			.12,
			-.31,
			0
		],
		localEnd: [
			.12,
			-1.79,
			0
		],
		contactType: "socket",
		overlap: .08,
		gapTolerance: .01
	};
	const beaterShaft = kit.mesh("stand-mixer-beater-shaft", new CylinderGeometry(.075, .075, .34, 16), steel, beaterPivot);
	beaterShaft.position.y = -.15;
	beaterShaft.userData.part = "beater-shaft";
	const collar = kit.mesh("stand-mixer-beater-collar", new CylinderGeometry(.2, .18, .18, 20), cream, beaterPivot);
	collar.position.y = -.34;
	collar.userData.part = "beater-collar";
	for (let i = 0; i < 6; i += 1) {
		const wire = kit.mesh(`stand-mixer-whisk-wire-${i + 1}`, new TubeGeometry(whiskWireCurve(i * Math.PI / 3), 18, .026, 6, false), steel, beaterPivot);
		wire.position.y = -.4;
		wire.userData.part = `whisk-wire-${i + 1}`;
	}
	const whiskRing = kit.mesh("stand-mixer-whisk-lower-ring", new TorusGeometry(.14, .03, 6, 20), steel, beaterPivot, false);
	whiskRing.rotation.x = Math.PI * .5;
	whiskRing.position.y = -1.48;
	whiskRing.userData.explodeWithParent = true;
	const bowlLockPivot = kit.pivot("stand-mixer-bowl-lock-plate-pivot", basePivot);
	bowlLockPivot.position.set(0, .67, .43);
	kit.socket("stand-mixer-bowl-seat-socket", basePivot, [
		0,
		.66,
		.43
	]);
	const bowlSeat = kit.mesh("stand-mixer-raised-pink-bowl-seat", new CylinderGeometry(.91, .96, .2, 36), pinkLightMaterial, bowlLockPivot);
	bowlSeat.position.y = .04;
	bowlSeat.userData.part = "bowl-seat";
	for (let index = 0; index < 3; index += 1) {
		const angle = index * Math.PI * 2 / 3 + Math.PI * .5;
		const lug = kit.mesh(`stand-mixer-bowl-locking-lug-${index + 1}`, rounded(.3, .09, .16, .035), pinkDarkMaterial, bowlLockPivot, false);
		lug.position.set(Math.cos(angle) * .84, .16, Math.sin(angle) * .84);
		lug.rotation.y = -angle;
		lug.userData.part = `bowl-locking-lug-${index + 1}`;
	}
	const bowlPivot = kit.pivot("stand-mixer-bowl-pivot");
	bowlPivot.position.set(0, .67, .43);
	bowlPivot.userData.attachment = {
		parentId: "stand-mixer-bowl-lock-plate-pivot",
		parentSocket: "stand-mixer-bowl-seat-socket",
		localStart: [
			0,
			0,
			0
		],
		localEnd: [
			0,
			1.56,
			0
		],
		contactType: "socket",
		overlap: .12,
		gapTolerance: .015
	};
	const bowl = kit.mesh("stand-mixer-deep-mixing-bowl", bowlGeometry(), cream, bowlPivot);
	bowl.position.y = .12;
	bowl.userData.part = "mixing-bowl";
	const rim = kit.mesh("stand-mixer-rolled-bowl-rim", new TorusGeometry(1.11, .065, 10, 48), creamHighlight, bowlPivot, false);
	rim.rotation.x = Math.PI * .5;
	rim.position.y = 1.56;
	rim.userData.part = "bowl-rim";
	[Math.PI * .75, Math.PI * 1.75].forEach((angle, i) => {
		const handle = kit.mesh(`stand-mixer-bowl-handle-${i + 1}`, new TubeGeometry(handleCurve(angle), 18, .095, 8, false), creamHighlight, bowlPivot);
		handle.position.y = .18;
		handle.userData.part = `bowl-handle-${i + 1}`;
	});
	const mixturePivot = kit.pivot("stand-mixer-mixture-pivot", bowlPivot);
	mixturePivot.position.y = 1.43;
	const mixtureSurface = kit.mesh("stand-mixer-visible-mixture-surface", vortexVolumeGeometry(), mixture, mixturePivot, false);
	mixtureSurface.userData.part = "mixture-surface";
	mixtureSurface.userData.performanceProp = "closed-volumetric-mixture-vortex";
	mixtureSurface.userData.forbiddenPrimitives = [
		"PlaneGeometry",
		"Sprite",
		"Line"
	];
	for (let index = 0; index < 3; index += 1) {
		const ridge = kit.mesh(`stand-mixer-mixture-wave-ridge-${index + 1}`, irregularLiquidRingGeometry(index), index === 2 ? eggMixture : creamMixture, mixturePivot, false);
		ridge.position.y = .035 + index * .012;
		ridge.visible = false;
		ridge.userData.performanceEffect = true;
		ridge.userData.effectKind = "volumetric-wave-ridge";
		ridge.userData.explodeWithParent = true;
	}
	const peak = kit.mesh("stand-mixer-whipped-cream-settle-peak", creamPeakGeometry(), creamMixture, mixturePivot, false);
	peak.position.set(.08, -.03, -.03);
	peak.visible = false;
	peak.userData.performanceEffect = true;
	peak.userData.effectKind = "settle-peak";
	peak.userData.explodeWithParent = true;
	const liquidEffectsPivot = kit.pivot("stand-mixer-volumetric-liquid-effects-pivot", bowlPivot);
	liquidEffectsPivot.position.y = 1.49;
	kit.socket("stand-mixer-liquid-effect-socket", liquidEffectsPivot, [
		0,
		0,
		0
	]);
	for (let index = 0; index < 7; index += 1) {
		const arc = kit.mesh(`stand-mixer-liquid-pull-arc-${index + 1}`, liquidArcGeometry(index), index % 3 === 0 ? eggMixture : creamMixture, liquidEffectsPivot, false);
		const angle = index / 7 * Math.PI * 2;
		arc.position.set(Math.cos(angle) * .42, 0, Math.sin(angle) * .42);
		arc.rotation.y = -angle;
		arc.visible = false;
		arc.userData.performanceEffect = true;
		arc.userData.effectKind = "volumetric-pull-arc";
		arc.userData.launchAngle = angle;
		arc.userData.explodeWithParent = true;
	}
	for (let index = 0; index < 9; index += 1) {
		const dollop = kit.mesh(`stand-mixer-volumetric-cream-dollop-${index + 1}`, new DodecahedronGeometry(.16 + index % 3 * .025, 1), index % 4 === 0 ? eggMixture : creamMixture, liquidEffectsPivot, false);
		dollop.scale.set(1.05 + index % 2 * .24, .8 + index % 3 * .16, .9);
		dollop.visible = false;
		dollop.userData.performanceEffect = true;
		dollop.userData.effectKind = "airborne-volume";
		dollop.userData.launchAngle = index / 9 * Math.PI * 2 + .24;
		dollop.userData.explodeWithParent = true;
	}
	for (let index = 0; index < 16; index += 1) {
		const drop = kit.mesh(`stand-mixer-volumetric-liquid-droplet-${index + 1}`, liquidDropGeometry(index), index % 5 === 0 ? eggMixture : creamMixture, liquidEffectsPivot, false);
		drop.visible = false;
		drop.userData.performanceEffect = true;
		drop.userData.effectKind = "airborne-droplet";
		drop.userData.launchAngle = index / 16 * Math.PI * 2 + .12;
		drop.userData.explodeWithParent = true;
	}
	kit.socket("stand-mixer-power-cable-socket", columnPivot, [
		.48,
		.3,
		-.43
	]);
	kit.indicator([
		.62,
		3.2,
		1.5
	], .035);
	const build = kit.finish({
		referencePath: options.referencePath ?? REFERENCE_PATH,
		reconstructed: [
			"wide stepped pink base, four feet and raised circular bowl seat",
			"deep cream lathed bowl with rolled rim and two U handles",
			"tapered pink rear column with lower concentric control",
			"long cream rounded motor head with pink seam band and front layered dial",
			"mirrored side hinge caps, stepped release lever and eight rear vent slots",
			"stepped planetary hub, offset beater shaft and six curved metal whisk wires",
			"fixed three-lug bowl lock plate separated from the animated bowl assembly",
			"closed vortex volume, three wave ridges, a cream peak, pull arcs, dollops and droplets",
			"independent head, controls, planetary drive, bowl and mixture pivots with runtime sockets"
		],
		inferred: [
			"internal motor, reduction gears and planetary transmission are hidden and omitted",
			"underside cable routing is not visible",
			"head hinge stop and tilt amplitude are inferred from typical mixer operation",
			"rear cable connection location and mixture motion are purpose-driven inferences"
		]
	});
	applyStandMixerOutlineHierarchy(build.root);
	build.root.userData.visualRevision = "sakura-stand-mixer-v2";
	build.root.userData.legacyReferencePath = "references/intake/stand-mixer/front.png";
	build.root.userData.previewLightingProfile = "sakura-appliance-v2";
	build.root.userData.outlineContract = {
		main: .0048,
		structure: .0041,
		detail: .0033,
		variation: .18,
		stable: true
	};
	build.root.userData.referenceDimensions = {
		totalWidth: 3.08,
		totalHeight: 4.5,
		totalDepth: 3.8,
		headSize: [
			1.82,
			1.4,
			3.55
		],
		bowlDiameter: 2.28,
		bowlHeight: 1.43,
		hingeAxisHeight: 3.35
	};
	build.root.userData.sculptRuntime.colliders = [
		{
			id: "stand-mixer-base",
			type: "box",
			node: "stand-mixer-stepped-base-shell"
		},
		{
			id: "stand-mixer-column",
			type: "box",
			node: "stand-mixer-tapered-rear-column"
		},
		{
			id: "stand-mixer-head",
			type: "box",
			node: "stand-mixer-rounded-motor-head"
		},
		{
			id: "stand-mixer-bowl",
			type: "cylinder",
			node: "stand-mixer-deep-mixing-bowl",
			trigger: true
		}
	];
	build.root.userData.sculptRuntime.destructionGroups = [
		["stand-mixer-stepped-base-shell", "stand-mixer-tapered-rear-column"],
		["stand-mixer-rounded-motor-head", "stand-mixer-continuous-pink-head-band"],
		[
			"stand-mixer-raised-pink-bowl-seat",
			"stand-mixer-bowl-locking-lug-1",
			"stand-mixer-bowl-locking-lug-2",
			"stand-mixer-bowl-locking-lug-3"
		],
		[
			"stand-mixer-deep-mixing-bowl",
			"stand-mixer-rolled-bowl-rim",
			"stand-mixer-bowl-handle-1",
			"stand-mixer-bowl-handle-2"
		],
		[
			"stand-mixer-stepped-planetary-hub",
			"stand-mixer-beater-shaft",
			"stand-mixer-whisk-lower-ring"
		]
	];
	build.root.userData.standMixerPerformanceRig = {
		timelineOwner: "AppliancePerformanceSystem",
		effectOwner: "stand-mixer-model-rig",
		planetaryMechanism: "offset beater spins on its own axis while the carrier orbits the bowl",
		bowlConstraint: "bowl pivots against a fixed three-lug lock plate",
		liquidForms: [
			"closed vortex volume",
			"irregular tube wave ridges",
			"thick pull arcs",
			"large low-poly dollops",
			"lathed droplets",
			"settle peak"
		],
		forbiddenPrimitives: [
			"PlaneGeometry",
			"Sprite",
			"Line"
		]
	};
	applyStandMixerOutlineHierarchy(build.root);
	return build;
}
//#endregion
export { standMixer_exports as n, createStandMixerModel as t };

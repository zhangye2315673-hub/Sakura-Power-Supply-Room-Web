import { t as __exportAll } from "./rolldown-runtime-D7D4PA-g.js";
import { A as DodecahedronGeometry, G as IcosahedronGeometry, Hn as SphereGeometry, It as Quaternion, J as InstancedMesh, N as Euler, Qn as TubeGeometry, S as CylinderGeometry, Xn as TorusGeometry, dr as Vector3, h as ConeGeometry, ht as Mesh, i as BoxGeometry, mt as Matrix4, p as Color, u as CatmullRomCurve3 } from "./three.core-DlTOC7bx.js";
import { i as RoundedBoxGeometry } from "./BufferGeometryUtils-CtH-hlZf.js";
import { a as setHullOutlineStyle, d as ApplianceModelKit } from "./outline-Cv1Jem2g.js";
//#region src/appliances/models/inductionCooktop.ts
var inductionCooktop_exports = /* @__PURE__ */ __exportAll({ createInductionCooktopModel: () => createInductionCooktopModel });
var V2_REFERENCE_PATH = "references/intake-v2/induction-cooktop/views/front.png";
var REFERENCE_PATH = "references/intake/induction-cooktop/front.png";
var ACTIVE_DURATION = 5.2;
function rounded(width, height, depth, radius) {
	return new RoundedBoxGeometry(width, height, depth, 4, radius);
}
function markPart(object, part, relief = false) {
	object.userData.part = part;
	if (relief) object.userData.explodeWithParent = true;
}
function stableOutlinePhase(name) {
	let hash = 2166136261;
	for (let index = 0; index < name.length; index += 1) {
		hash ^= name.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return (hash >>> 0) % 1e4 * (Math.PI * 2 / 1e4);
}
function applyInductionCooktopOutlineHierarchy(root) {
	const mainSilhouette = /mint-lower-band|cream-main-enclosure|raised-cream-bezel|pink-glass-ceramic-panel|hotpot-(?:thick-bottom|outer-wall|rolled-rim|left-loop-handle|right-loop-handle)/;
	const fineDetail = /status-indicator|button-face|glyph|icon|index|vent|grille-slot|plug-pin|rubber-foot|food|marbling|rolling-bubble|steam-cloud|powered-heat-ring/;
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
function instanceCluster(kit, name, geometry, material, matrices, parent, part) {
	const mesh = new InstancedMesh(geometry, material, matrices.length);
	mesh.name = name;
	mesh.castShadow = true;
	mesh.receiveShadow = true;
	mesh.userData.applianceId = kit.options.id;
	markPart(mesh, part);
	matrices.forEach((matrix, index) => mesh.setMatrixAt(index, matrix));
	mesh.instanceMatrix.needsUpdate = true;
	parent.add(mesh);
	kit.interactiveMeshes.push(mesh);
	kit.nodes.set(name, mesh);
	return mesh;
}
function horizontalBar(kit, name, width, position, material, parent) {
	const bar = kit.mesh(name, rounded(width, .018, .025, .008), material, parent, false);
	bar.position.set(...position);
	return bar;
}
/**
* Three-view reconstruction of the supplied Sakura portable induction cooktop.
*
* Local frame: +Y up, +Z toward the control edge, floor at Y=0. The admitted
* views are top, right side and underside. Internal coil, airflow and wiring
* are hidden; the powered pot and steam are explicit interaction cues.
*/
function createInductionCooktopModel(options) {
	const kit = new ApplianceModelKit(options);
	const accent = new Color(options.accent);
	const pink = accent.clone().offsetHSL(0, -.025, 0).getHex();
	const cream = kit.material(16182751, { tint: 9207427 });
	const creamHighlight = kit.material(16775145, { tint: 10522513 });
	const glass = kit.material(pink, {
		tint: 9990012,
		emissive: pink
	});
	glass.emissiveIntensity = 0;
	const mint = kit.material(11126197, { tint: 7376776 });
	const rubber = kit.material(8890779, { tint: 5796460 });
	const ink = kit.material(5588810, { tint: 4011583 });
	const cavity = kit.material(4800580, { tint: 3354166 });
	const cordRubber = kit.material(7694952, { tint: 5130060 });
	const metal = kit.material(12103590, { tint: 7170161 });
	const accentDeep = kit.material(accent.clone().offsetHSL(-.015, .04, -.13), { tint: 7230056 });
	const heatMaterial = kit.material(16747896, {
		tint: 13981549,
		emissive: 16732223,
		transparent: true,
		opacity: 0
	});
	heatMaterial.depthWrite = false;
	const soupMaterial = kit.material(16167562, {
		tint: 13138290,
		emissive: 14245709,
		transparent: true,
		opacity: .88
	});
	const soupFoam = kit.material(16766382, {
		tint: 14651514,
		emissive: 16747890,
		transparent: true,
		opacity: .84
	});
	const steamMaterial = kit.material(16773865, {
		tint: 13220038,
		emissive: 16767186,
		transparent: true,
		opacity: .72
	});
	const potInterior = kit.material(7232606, { tint: 4932169 });
	potInterior.side = 1;
	const meat = kit.material(15902370, { tint: 12216437 });
	const meatMarbling = kit.material(16770005, { tint: 14199463 });
	const tofu = kit.material(16770216, { tint: 13085039 });
	const vegetable = kit.material(7977357, { tint: 5210216 });
	const vegetableLight = kit.material(12178838, { tint: 7902829 });
	const meatball = kit.material(13206889, { tint: 9395545 });
	const enclosurePivot = kit.pivot("induction-cooktop-enclosure-pivot");
	const lowerBand = kit.mesh("induction-cooktop-mint-lower-band", rounded(3.58, .34, 3.43, .31), mint, enclosurePivot);
	lowerBand.position.y = .29;
	markPart(lowerBand, "lower-band");
	const mainShell = kit.mesh("induction-cooktop-cream-main-enclosure", rounded(3.62, .42, 3.47, .32), cream, enclosurePivot);
	mainShell.position.y = .43;
	markPart(mainShell, "main-enclosure");
	for (const [x, z, rotationY, label] of [
		[
			0,
			1.64,
			0,
			"front"
		],
		[
			0,
			-1.64,
			0,
			"rear"
		],
		[
			-1.71,
			0,
			Math.PI * .5,
			"left"
		],
		[
			1.71,
			0,
			Math.PI * .5,
			"right"
		]
	]) {
		const shoulder = kit.mesh(`induction-cooktop-faceted-shell-shoulder-${label}`, rounded(label === "front" || label === "rear" ? 2.82 : 2.67, .12, .15, .045), creamHighlight, enclosurePivot);
		shoulder.position.set(x, .54, z);
		shoulder.rotation.y = rotationY;
		markPart(shoulder, "shell-shoulders");
	}
	const topPivot = kit.pivot("induction-cooktop-top-surface-pivot", enclosurePivot);
	const bezel = kit.mesh("induction-cooktop-raised-cream-bezel", rounded(3.48, .15, 3.33, .3), creamHighlight, topPivot);
	bezel.position.y = .625;
	markPart(bezel, "top-bezel");
	const panelSeam = kit.mesh("induction-cooktop-inset-panel-seam", rounded(3.34, .025, 3.19, .265), ink, topPivot, false);
	panelSeam.position.y = .69;
	markPart(panelSeam, "seam-system");
	const panel = kit.mesh("induction-cooktop-pink-glass-ceramic-panel", rounded(3.31, .075, 3.16, .255), glass, topPivot);
	panel.position.y = .72;
	markPart(panel, "cooking-panel");
	const cookingZoneSeat = kit.mesh("induction-cooktop-faceted-cooking-zone-seat", new CylinderGeometry(1.22, 1.25, .045, 12), accentDeep, topPivot);
	cookingZoneSeat.position.set(0, .755, -.28);
	markPart(cookingZoneSeat, "heating-zone");
	const cookingZoneInset = kit.mesh("induction-cooktop-faceted-cooking-zone-inset", new CylinderGeometry(1.18, 1.2, .052, 12), glass, topPivot, false);
	cookingZoneInset.position.set(0, .785, -.28);
	markPart(cookingZoneInset, "heating-zone", true);
	const heatingPivot = kit.pivot("induction-cooktop-heating-zone-pivot", topPivot);
	heatingPivot.position.set(0, .777, -.28);
	heatingPivot.userData.materialState = "induction-zone";
	kit.socket("induction-cooktop-pan-seat-socket", heatingPivot, [
		0,
		.02,
		0
	]);
	instanceCluster(kit, "induction-cooktop-heater-dash-ring", new BoxGeometry(.052, .018, .018), ink, Array.from({ length: 64 }, (_, index) => {
		const angle = index * Math.PI * 2 / 64;
		return new Matrix4().compose(new Vector3(Math.cos(angle) * 1.13, 0, Math.sin(angle) * 1.13), new Quaternion().setFromEuler(new Euler(0, -angle, 0)), new Vector3(1, 1, 1));
	}), heatingPivot, "heating-zone");
	markPart(kit.mesh("induction-cooktop-heater-center-dot", new CylinderGeometry(.025, .025, .018, 12), ink, heatingPivot, false), "heating-zone", true);
	const heatRings = [];
	[
		.56,
		.82,
		1.08
	].forEach((radius, index) => {
		const ring = kit.mesh(`induction-cooktop-powered-heat-ring-${index + 1}`, new TorusGeometry(radius, .025, 7, 48), heatMaterial, heatingPivot, false);
		ring.rotation.x = Math.PI * .5;
		ring.position.y = .035 + index * .004;
		ring.visible = false;
		markPart(ring, "powered-heat-effect");
		heatRings.push(ring);
	});
	const controlPivot = kit.pivot("induction-cooktop-control-assembly-pivot", topPivot);
	controlPivot.position.set(0, .78, 1.18);
	kit.socket("induction-cooktop-control-socket", controlPivot, [
		0,
		0,
		0
	]);
	const buttonGeometry = new CylinderGeometry(.16, .145, .065, 12);
	const buttonRingGeometry = new TorusGeometry(.152, .022, 5, 12);
	const buttonPivots = [
		{
			id: "timer",
			x: -1.13,
			part: "timer-button"
		},
		{
			id: "mode",
			x: -.69,
			part: "mode-button"
		},
		{
			id: "power",
			x: 1.12,
			part: "power-button"
		}
	].map(({ id, x, part }) => {
		const pivot = kit.pivot(`induction-cooktop-${id}-button-pivot`, controlPivot);
		pivot.position.x = x;
		pivot.userData.translationAxis = [
			0,
			1,
			0
		];
		kit.socket(`induction-cooktop-${id}-button-socket`, pivot, [
			0,
			0,
			0
		]);
		markPart(kit.mesh(`induction-cooktop-${id}-button-face`, buttonGeometry, creamHighlight, pivot), part);
		const ring = kit.mesh(`induction-cooktop-${id}-button-ring`, buttonRingGeometry, ink, pivot, false);
		ring.rotation.x = Math.PI * .5;
		ring.position.y = .034;
		markPart(ring, part, true);
		return pivot;
	});
	const timerIcon = kit.mesh("induction-cooktop-timer-icon-ring", new TorusGeometry(.058, .011, 5, 18), ink, buttonPivots[0], false);
	timerIcon.rotation.x = Math.PI * .5;
	timerIcon.position.y = .067;
	markPart(timerIcon, "timer-button", true);
	const timerHand = horizontalBar(kit, "induction-cooktop-timer-hand", .052, [
		.015,
		.068,
		-.006
	], ink, buttonPivots[0]);
	timerHand.rotation.y = -.72;
	markPart(timerHand, "timer-button", true);
	const modeIcon = kit.mesh("induction-cooktop-mode-icon", new SphereGeometry(.045, 10, 7), ink, buttonPivots[1], false);
	modeIcon.scale.set(.65, .18, 1.1);
	modeIcon.position.y = .07;
	markPart(modeIcon, "mode-button", true);
	const modeTip = kit.mesh("induction-cooktop-mode-icon-tip", new ConeGeometry(.035, .075, 9), ink, buttonPivots[1], false);
	modeTip.position.set(.02, .078, -.025);
	markPart(modeTip, "mode-button", true);
	const powerIcon = kit.mesh("induction-cooktop-power-icon-ring", new TorusGeometry(.056, .011, 5, 18), ink, buttonPivots[2], false);
	powerIcon.rotation.x = Math.PI * .5;
	powerIcon.position.y = .067;
	markPart(powerIcon, "power-button", true);
	const powerStem = kit.mesh("induction-cooktop-power-icon-stem", rounded(.018, .018, .075, .006), ink, buttonPivots[2], false);
	powerStem.position.set(0, .072, -.035);
	markPart(powerStem, "power-button", true);
	const knobPivot = kit.pivot("induction-cooktop-rotary-knob-pivot", controlPivot);
	knobPivot.userData.rotationAxis = [
		0,
		1,
		0
	];
	knobPivot.userData.rotationRange = [-2.1, 2.1];
	kit.socket("induction-cooktop-rotary-knob-axis-socket", knobPivot, [
		0,
		0,
		0
	]);
	markPart(kit.mesh("induction-cooktop-rotary-knob-dark-rim", new CylinderGeometry(.32, .3, .105, 12), ink, knobPivot), "control-knob");
	const knob = kit.mesh("induction-cooktop-cream-rotary-knob", new CylinderGeometry(.27, .29, .135, 12), creamHighlight, knobPivot);
	knob.position.y = .055;
	markPart(knob, "control-knob", true);
	for (let index = 0; index < 8; index += 1) {
		const grip = kit.mesh(`induction-cooktop-knob-grip-ridge-${index + 1}`, rounded(.025, .055, .105, .008), accentDeep, knobPivot, false);
		const angle = index * Math.PI * 2 / 8;
		grip.position.set(Math.cos(angle) * .27, .075, Math.sin(angle) * .27);
		grip.rotation.y = -angle;
		markPart(grip, "control-knob", true);
	}
	const knobIndex = horizontalBar(kit, "induction-cooktop-knob-index", .018, [
		0,
		.13,
		-.18
	], ink, knobPivot);
	knobIndex.scale.z = 2.2;
	markPart(knobIndex, "control-knob", true);
	markPart(horizontalBar(kit, "induction-cooktop-minus-glyph", .08, [
		-.4,
		.012,
		0
	], ink, controlPivot), "control-glyphs");
	markPart(horizontalBar(kit, "induction-cooktop-plus-horizontal", .08, [
		.4,
		.012,
		0
	], ink, controlPivot), "control-glyphs");
	const plusVertical = horizontalBar(kit, "induction-cooktop-plus-vertical", .08, [
		.4,
		.013,
		0
	], ink, controlPivot);
	plusVertical.rotation.y = Math.PI * .5;
	markPart(plusVertical, "control-glyphs");
	const indicator = kit.indicator([
		.34,
		.795,
		1.18
	], .025);
	indicator.name = "induction-cooktop-status-indicator";
	kit.nodes.set(indicator.name, indicator);
	markPart(indicator, "control-indicator");
	const sideVentPivot = kit.pivot("induction-cooktop-right-side-vent-pivot", enclosurePivot);
	instanceCluster(kit, "induction-cooktop-nine-side-vents", new BoxGeometry(.025, .18, .045), cavity, Array.from({ length: 9 }, (_, index) => new Matrix4().makeTranslation(1.82, .43, -.46 + index * .12)), sideVentPivot, "side-vents");
	const undersidePivot = kit.pivot("induction-cooktop-underside-service-pivot", enclosurePivot);
	undersidePivot.position.y = .105;
	const fanPivot = kit.pivot("induction-cooktop-underside-fan-pivot", undersidePivot);
	fanPivot.position.set(.4, 0, .34);
	fanPivot.userData.rotationAxis = [
		0,
		1,
		0
	];
	kit.socket("induction-cooktop-fan-axis-socket", fanPivot, [
		0,
		0,
		0
	]);
	markPart(kit.mesh("induction-cooktop-underside-fan-cavity", new CylinderGeometry(.72, .72, .025, 36), cavity, fanPivot, false), "fan-grille");
	const rotorPivot = kit.pivot("induction-cooktop-inferred-fan-rotor-pivot", fanPivot);
	rotorPivot.position.y = -.025;
	const rotorBladeGeometry = rounded(.18, .022, .48, .065);
	for (let index = 0; index < 5; index += 1) {
		const bladePivot = kit.pivot(`induction-cooktop-inferred-fan-blade-pivot-${index + 1}`, rotorPivot);
		bladePivot.rotation.y = index * Math.PI * 2 / 5;
		const blade = kit.mesh(`induction-cooktop-inferred-fan-blade-${index + 1}`, rotorBladeGeometry, glass, bladePivot, false);
		blade.position.z = .23;
		markPart(blade, "inferred-fan-rotor");
	}
	markPart(kit.mesh("induction-cooktop-inferred-fan-hub", new CylinderGeometry(.105, .105, .05, 18), ink, rotorPivot, false), "inferred-fan-rotor");
	const grilleMatrices = [];
	const grilleQuaternion = new Quaternion();
	[
		.27,
		.38,
		.49,
		.6,
		.69
	].forEach((radius, ringIndex) => {
		const count = 10 + ringIndex * 2;
		for (let index = 0; index < count; index += 1) {
			const angle = index * Math.PI * 2 / count + ringIndex * .075;
			grilleQuaternion.setFromEuler(new Euler(0, Math.PI * .5 - angle, 0));
			grilleMatrices.push(new Matrix4().compose(new Vector3(Math.cos(angle) * radius, -.055, Math.sin(angle) * radius), grilleQuaternion.clone(), new Vector3(1, 1, 1)));
		}
	});
	instanceCluster(kit, "induction-cooktop-concentric-fan-grille-slots", new BoxGeometry(.14, .025, .052), cream, grilleMatrices, fanPivot, "fan-grille");
	const fanOuterRing = kit.mesh("induction-cooktop-fan-grille-outer-ring", new TorusGeometry(.74, .026, 7, 40), ink, fanPivot, false);
	fanOuterRing.rotation.x = Math.PI * .5;
	fanOuterRing.position.y = -.06;
	markPart(fanOuterRing, "fan-grille", true);
	const cablePivot = kit.pivot("induction-cooktop-cable-storage-pivot", undersidePivot);
	cablePivot.position.set(-.44, -.04, -1.31);
	kit.socket("induction-cooktop-cable-trough-socket", cablePivot, [
		-.93,
		0,
		0
	]);
	markPart(kit.mesh("induction-cooktop-cable-storage-recess", rounded(2.05, .045, .5, .12), cavity, cablePivot, false), "cable-trough");
	const cableInner = kit.mesh("induction-cooktop-cable-trough-cream-inset", rounded(1.87, .018, .35, .08), cream, cablePivot, false);
	cableInner.position.y = -.035;
	markPart(cableInner, "cable-trough", true);
	const cordCurve = new CatmullRomCurve3([
		new Vector3(-.86, -.075, -.02),
		new Vector3(-.78, -.085, .13),
		new Vector3(-.3, -.09, .14),
		new Vector3(.16, -.09, .13),
		new Vector3(.35, -.08, -.04)
	]);
	markPart(kit.mesh("induction-cooktop-stored-power-cord", new TubeGeometry(cordCurve, 30, .035, 8, false), cordRubber, cablePivot, false), "power-cord");
	const strainRelief = kit.mesh("induction-cooktop-cord-strain-relief", rounded(.22, .07, .12, .03), cordRubber, cablePivot, false);
	strainRelief.position.set(.43, -.075, -.04);
	markPart(strainRelief, "power-cord");
	const plug = kit.mesh("induction-cooktop-stored-two-pin-plug", rounded(.3, .105, .22, .04), creamHighlight, cablePivot);
	plug.position.set(.68, -.08, -.04);
	markPart(plug, "stored-power-plug");
	for (const [z, label] of [[-.075, "rear"], [.075, "front"]]) {
		const pin = kit.mesh(`induction-cooktop-stored-plug-pin-${label}`, new CylinderGeometry(.022, .022, .19, 10), metal, cablePivot, false);
		pin.rotation.z = Math.PI * .5;
		pin.position.set(.92, -.08, -.04 + z);
		markPart(pin, "stored-power-plug", true);
	}
	kit.socket("induction-cooktop-power-cable-socket", cablePivot, [
		1.04,
		-.08,
		-.04
	]);
	const footGeometry = new CylinderGeometry(.14, .16, .15, 18);
	[
		[
			-1.38,
			1.25,
			"front-left"
		],
		[
			1.38,
			1.25,
			"front-right"
		],
		[
			-1.38,
			-1.25,
			"rear-left"
		],
		[
			1.38,
			-1.25,
			"rear-right"
		]
	].forEach(([x, z, label]) => {
		const footPivot = kit.pivot(`induction-cooktop-foot-${label}-pivot`, enclosurePivot);
		footPivot.position.set(x, .075, z);
		kit.socket(`induction-cooktop-foot-${label}-socket`, footPivot, [
			0,
			.075,
			0
		]);
		markPart(kit.mesh(`induction-cooktop-rubber-foot-${label}`, footGeometry, rubber, footPivot, false), "foot-array");
	});
	const cookwarePivot = kit.pivot("induction-cooktop-powered-cookware-pivot", heatingPivot);
	cookwarePivot.position.y = .03;
	cookwarePivot.visible = true;
	const panBottom = kit.mesh("induction-cooktop-hotpot-thick-bottom", new CylinderGeometry(1.11, 1.03, .16, 12), ink, cookwarePivot);
	panBottom.position.y = .1;
	markPart(panBottom, "powered-cookware");
	const panWall = kit.mesh("induction-cooktop-hotpot-outer-wall", new CylinderGeometry(1.18, 1.1, .7, 12, 1, true), creamHighlight, cookwarePivot);
	panWall.position.y = .5;
	markPart(panWall, "powered-cookware");
	const panInnerWall = kit.mesh("induction-cooktop-hotpot-inner-cavity", new CylinderGeometry(1.07, 1.02, .58, 12, 1, true), potInterior, cookwarePivot, false);
	panInnerWall.position.y = .52;
	markPart(panInnerWall, "powered-cookware-interior");
	const panRim = kit.mesh("induction-cooktop-hotpot-rolled-rim", new TorusGeometry(1.125, .065, 6, 12), ink, cookwarePivot);
	panRim.rotation.x = Math.PI * .5;
	panRim.position.y = .86;
	markPart(panRim, "powered-cookware-rim");
	const soup = kit.mesh("induction-cooktop-powered-simmer-surface", new CylinderGeometry(1.03, 1.03, .035, 12), soupMaterial, cookwarePivot, false);
	soup.position.y = .74;
	markPart(soup, "powered-cookware", true);
	const boilRig = kit.pivot("induction-cooktop-volumetric-boil-rig", cookwarePivot);
	boilRig.userData.performanceEffect = true;
	const boilBubbleGeometry = new IcosahedronGeometry(.105, 1);
	for (let index = 0; index < 14; index += 1) {
		const angle = index * 2.399963229728653;
		const radius = .18 + index % 5 * .145;
		const bubble = kit.mesh(`induction-cooktop-soup-rolling-bubble-${index + 1}`, boilBubbleGeometry, soupFoam, boilRig, false);
		bubble.position.set(Math.cos(angle) * radius, .77, Math.sin(angle) * radius);
		bubble.scale.setScalar(.68 + index % 4 * .11);
		bubble.visible = false;
		bubble.userData.performanceEffect = true;
		bubble.userData.bubbleIndex = index;
		bubble.userData.basePosition = bubble.position.toArray();
		markPart(bubble, "volumetric-boil-effects");
	}
	const steamRig = kit.pivot("induction-cooktop-volumetric-steam-rig", cookwarePivot);
	steamRig.userData.performanceEffect = true;
	const steamMainGeometry = new DodecahedronGeometry(.2, 0);
	const steamLobeGeometry = new DodecahedronGeometry(.135, 0);
	const steamCurlGeometry = new TorusGeometry(.13, .035, 6, 14);
	for (let index = 0; index < 18; index += 1) {
		const cloud = kit.pivot(`induction-cooktop-steam-cloud-${index + 1}-pivot`, steamRig);
		const angle = index * 2.399963229728653;
		const radius = .12 + index % 5 * .13;
		cloud.position.set(Math.cos(angle) * radius, .9, Math.sin(angle) * radius);
		cloud.visible = false;
		cloud.userData.performanceEffect = true;
		cloud.userData.steamIndex = index;
		cloud.userData.basePosition = cloud.position.toArray();
		const main = kit.mesh(`induction-cooktop-steam-cloud-${index + 1}-main-lobe`, steamMainGeometry, steamMaterial, cloud, false);
		main.scale.set(.78 + index % 3 * .12, 1.05, .72);
		markPart(main, "volumetric-steam-effects");
		for (const [lobeIndex, sign] of [-1, 1].entries()) {
			const lobe = kit.mesh(`induction-cooktop-steam-cloud-${index + 1}-side-lobe-${lobeIndex + 1}`, steamLobeGeometry, steamMaterial, cloud, false);
			lobe.position.set(sign * .13, .07 + lobeIndex * .04, sign * -.035);
			lobe.scale.set(1, .82 + lobeIndex * .16, .78);
			markPart(lobe, "volumetric-steam-effects", true);
		}
		const curl = kit.mesh(`induction-cooktop-steam-cloud-${index + 1}-closed-curl`, steamCurlGeometry, steamMaterial, cloud, false);
		curl.position.y = .23;
		curl.rotation.set(Math.PI * .5, angle, 0);
		curl.scale.set(.8, 1, .72);
		markPart(curl, "volumetric-steam-effects", true);
	}
	for (const [side, sign] of [["left", -1], ["right", 1]]) {
		const handlePivot = kit.pivot(`induction-cooktop-hotpot-${side}-handle-pivot`, cookwarePivot);
		handlePivot.userData.rotationAxis = [
			0,
			0,
			1
		];
		kit.socket(`induction-cooktop-hotpot-${side}-handle-socket`, handlePivot, [
			sign * 1.08,
			.58,
			0
		]);
		for (const [z, end] of [[-.27, "rear"], [.27, "front"]]) {
			const mount = kit.mesh(`induction-cooktop-hotpot-${side}-handle-${end}-mount`, new CylinderGeometry(.105, .105, .22, 18), ink, handlePivot);
			mount.rotation.z = Math.PI * .5;
			mount.position.set(sign * 1.13, .59, z);
			markPart(mount, `powered-cookware-${side}-handle`);
		}
		const handleCurve = new CatmullRomCurve3([
			new Vector3(sign * 1.13, .59, -.27),
			new Vector3(sign * 1.43, .62, -.25),
			new Vector3(sign * 1.5, .64, 0),
			new Vector3(sign * 1.43, .62, .25),
			new Vector3(sign * 1.13, .59, .27)
		]);
		markPart(kit.mesh(`induction-cooktop-hotpot-${side}-loop-handle`, new TubeGeometry(handleCurve, 24, .085, 8, false), ink, handlePivot), `powered-cookware-${side}-handle`);
	}
	const foodMotions = [];
	const registerFood = (mesh, part, phase, bob = .025) => {
		markPart(mesh, part);
		foodMotions.push({
			mesh,
			basePosition: mesh.position.clone(),
			baseRotation: mesh.rotation.clone(),
			phase,
			bob
		});
	};
	[
		[
			-.52,
			.785,
			-.3,
			-.28
		],
		[
			-.18,
			.79,
			.42,
			.32
		],
		[
			.52,
			.785,
			-.22,
			.62
		]
	].forEach(([x, y, z, yaw], index) => {
		const slicePivot = kit.pivot(`induction-cooktop-hotpot-meat-slice-${index + 1}-pivot`, cookwarePivot);
		slicePivot.position.set(x, y, z);
		slicePivot.rotation.y = yaw;
		markPart(kit.mesh(`induction-cooktop-hotpot-meat-slice-${index + 1}`, rounded(.42, .055, .23, .07), meat, slicePivot), "hotpot-meat-slices");
		for (const stripeZ of [-.055, .055]) {
			const stripe = kit.mesh(`induction-cooktop-hotpot-meat-slice-${index + 1}-marbling-${stripeZ < 0 ? "rear" : "front"}`, rounded(.34, .012, .027, .01), meatMarbling, slicePivot, false);
			stripe.position.set(0, .034, stripeZ);
			markPart(stripe, "hotpot-meat-slices", true);
		}
		registerFood(slicePivot, "hotpot-meat-slices", index * 1.9, .02);
	});
	[
		[
			-.55,
			.82,
			.25
		],
		[
			.08,
			.815,
			-.42
		],
		[
			.48,
			.82,
			.35
		]
	].forEach(([x, y, z], index) => {
		const cube = kit.mesh(`induction-cooktop-hotpot-tofu-cube-${index + 1}`, rounded(.27, .16, .27, .045), tofu, cookwarePivot);
		cube.position.set(x, y, z);
		cube.rotation.y = .22 + index * .7;
		registerFood(cube, "hotpot-tofu-cubes", .7 + index * 1.6, .032);
	});
	[
		[
			-.2,
			.845,
			-.08
		],
		[
			.24,
			.84,
			.12
		],
		[
			.7,
			.835,
			.02
		],
		[
			-.72,
			.835,
			-.02
		]
	].forEach(([x, y, z], index) => {
		const ball = kit.mesh(`induction-cooktop-hotpot-meatball-${index + 1}`, new SphereGeometry(.14, 14, 10), meatball, cookwarePivot);
		ball.position.set(x, y, z);
		registerFood(ball, "hotpot-meatballs", 1.1 + index * 1.25, .04);
	});
	[
		[
			-.73,
			.82,
			.52,
			-.55
		],
		[
			.18,
			.82,
			.56,
			.1
		],
		[
			.7,
			.82,
			-.48,
			.62
		]
	].forEach(([x, y, z, yaw], index) => {
		const vegetablePivot = kit.pivot(`induction-cooktop-hotpot-vegetable-${index + 1}-pivot`, cookwarePivot);
		vegetablePivot.position.set(x, y, z);
		vegetablePivot.rotation.y = yaw;
		const leaf = kit.mesh(`induction-cooktop-hotpot-vegetable-leaf-${index + 1}`, new SphereGeometry(.22, 12, 8), index % 2 === 0 ? vegetable : vegetableLight, vegetablePivot);
		leaf.scale.set(1.28, .18, .72);
		markPart(leaf, "hotpot-vegetables");
		const stem = kit.mesh(`induction-cooktop-hotpot-vegetable-stem-${index + 1}`, rounded(.24, .055, .065, .022), vegetableLight, vegetablePivot, false);
		stem.position.x = -.19;
		markPart(stem, "hotpot-vegetables", true);
		registerFood(vegetablePivot, "hotpot-vegetables", .35 + index * 2.15, .028);
	});
	const build = kit.finish({
		referencePath: options.referencePath ?? V2_REFERENCE_PATH,
		reconstructed: [
			"low rounded-square cream enclosure with inset Sakura-pink glass-ceramic panel and mint lower band",
			"large dotted circular cooking-zone mark with center dot and a front control strip",
			"three independent layered circular buttons, large center rotary knob, plus/minus marks and status indicator",
			"exact nine-slot right-side vent array, four separate mint rubber feet and low side profile",
			"underside concentric fan grille, cable storage recess, U-shaped cord, strain relief and two-pin plug",
			"separate pivots and sockets for heating zone, knob, buttons, fan, feet, cookware seat and power connection",
			"large powered-use hotpot with thick base, complete outer and inner walls, rolled rim and two independently mounted loop handles",
			"separate visible meat slices with marbling, tofu cubes, leafy vegetables, meatballs and fourteen closed-volume boiling bubbles inside the hotpot",
			"eighteen multi-lobe Low Poly steam clouds with closed torus curl volumes and no Plane, Sprite or Line effects"
		],
		inferred: [
			"isolated rear-wall seam is inferred from the shared rounded enclosure because no rear elevation is supplied",
			"fan impeller shape is inferred behind the observed underside grille; induction coil and internal airflow are omitted",
			"cable trough depth, cord attachment and strain-relief overlap are inferred from underside shadows",
			"powered hotpot, food contents, thermal rings and steam are interaction cues designed from the requested appliance use and are not claimed as supplied reference geometry"
		]
	});
	build.root.userData.referenceDimensions = {
		bodyWidth: 3.62,
		bodyDepth: 3.47,
		bodyThickness: .58,
		overallHeight: .795,
		heatingZoneDiameter: 2.26,
		hotpotOuterDiameter: 2.36,
		hotpotInteriorDiameter: 2.14,
		hotpotHeight: .91,
		hotpotHandleSpan: 3,
		visibleFoodPieces: foodMotions.length,
		controlEdgeOffset: 1.18
	};
	build.root.userData.activeDuration = ACTIVE_DURATION;
	build.root.userData.visualRevision = "sakura-induction-cooktop-v2";
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
		type: "induction-cooktop-owned-volumetric-hotpot",
		boilBubbleCount: 14,
		steamCloudCount: 18,
		foodPieceCount: foodMotions.length,
		sharedSpectacleEffects: "must-be-disabled-during-integration"
	};
	build.root.userData.sculptRuntime.colliders = [
		{
			id: "induction-cooktop-body",
			type: "box",
			node: "induction-cooktop-enclosure-pivot"
		},
		{
			id: "induction-cooktop-heating-zone",
			type: "cylinder",
			node: "induction-cooktop-heating-zone-pivot",
			trigger: true
		},
		{
			id: "induction-cooktop-controls",
			type: "box",
			node: "induction-cooktop-control-assembly-pivot",
			trigger: true
		}
	];
	build.root.userData.sculptRuntime.destructionGroups = [
		{
			id: "cooktop-enclosure",
			nodes: ["induction-cooktop-enclosure-pivot"]
		},
		{
			id: "cooktop-surface",
			nodes: ["induction-cooktop-top-surface-pivot", "induction-cooktop-heating-zone-pivot"]
		},
		{
			id: "cooktop-controls",
			nodes: ["induction-cooktop-control-assembly-pivot"]
		},
		{
			id: "cooktop-underside-service",
			nodes: ["induction-cooktop-underside-service-pivot"]
		},
		{
			id: "cooktop-powered-cookware",
			nodes: ["induction-cooktop-powered-cookware-pivot"]
		}
	];
	applyInductionCooktopOutlineHierarchy(build.root);
	return build;
}
//#endregion
export { inductionCooktop_exports as n, createInductionCooktopModel as t };

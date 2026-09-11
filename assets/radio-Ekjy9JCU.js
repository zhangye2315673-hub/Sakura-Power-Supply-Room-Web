import { t as __exportAll } from "./rolldown-runtime-D7D4PA-g.js";
import { Hn as SphereGeometry, S as CylinderGeometry, ht as Mesh, p as Color } from "./three.core-DlTOC7bx.js";
import { i as RoundedBoxGeometry } from "./BufferGeometryUtils-CSuwXBGj.js";
import { a as setHullOutlineStyle, d as ApplianceModelKit } from "./outline-DAm9XhPL.js";
//#region src/appliances/models/radio.ts
var radio_exports = /* @__PURE__ */ __exportAll({ createRadioModel: () => createRadioModel });
var REFERENCE_PATH = "D:/下载文件/ChatGPT Image 2026年8月2日 19_55_17 (3).png";
var ACTIVE_DURATION = 5.2;
var ANTENNA_REST_ANGLE = 1.12;
function shiftedAccent(accent, lightness, saturation = 0) {
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
function applyRadioOutlineHierarchy(root) {
	const main = /outer-shell|front-panel-lip|front-panel|rear-access-panel/;
	const structure = /speaker-frame|speaker-cavity|frequency-frame|frequency-face|knob-ring|knob|antenna-hinge-bracket|antenna-segment/;
	root.traverse((object) => {
		if (!(object instanceof Mesh) || object.userData.isOutline !== true) return;
		const source = object.parent?.name ?? object.name;
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
function addRoundedBar(kit, name, width, height, depth, material, parent) {
	const mesh = kit.mesh(name, new RoundedBoxGeometry(width, height, depth, 2, Math.min(height * .48, .022)), material, parent, false);
	mesh.userData.explodeWithParent = true;
	return mesh;
}
/**
* Procedural reconstruction of the supplied three-view tabletop radio.
*
* Local frame: +Y up, +Z front, floor at Y=0. The radio is a compound
* assembly: shell, inset front/rear panels, speaker system, control cluster,
* and a separate hinged telescopic antenna. Hidden electronics are omitted.
*/
function createRadioModel(options) {
	const kit = new ApplianceModelKit(options);
	const accentLight = shiftedAccent(options.accent, .16, -.1);
	const accentMid = shiftedAccent(options.accent, .075, -.05);
	const accentDark = shiftedAccent(options.accent, -.08, -.02);
	const shellMaterial = kit.material(15854041, { tint: 7497595 });
	const shellHighlightMaterial = kit.material(16314591, { tint: 7891840 });
	const accentMaterial = kit.material(accentMid, { tint: 7036275 });
	const accentLightMaterial = kit.material(accentLight, { tint: 7758967 });
	const accentDarkMaterial = kit.material(accentDark, { tint: 6247016 });
	const cavityMaterial = kit.material(3618630, { tint: 3156794 });
	const screenMaterial = kit.material(5330535, {
		tint: 3748931,
		emissive: 10136256
	});
	const glassMaterial = kit.material(12174026, {
		tint: 7827844,
		transparent: true,
		opacity: .32
	});
	const metalMaterial = kit.material(12107203, { tint: 6117479 });
	const darkMetalMaterial = kit.material(7501443, { tint: 5130327 });
	const rubberMaterial = kit.material(6052196, { tint: 4604238 });
	const shell = kit.mesh("radio-outer-shell", new RoundedBoxGeometry(2.8, 1.62, .8, 2, .16), shellMaterial);
	shell.position.y = .9;
	kit.mesh("radio-front-panel-lip", new RoundedBoxGeometry(2.53, 1.32, .075, 2, .11), shellHighlightMaterial).position.set(0, .91, .435);
	kit.mesh("radio-front-panel", new RoundedBoxGeometry(2.42, 1.22, .065, 2, .095), accentMaterial).position.set(0, .91, .48);
	kit.mesh("radio-speaker-frame", new RoundedBoxGeometry(1.2, .98, .075, 2, .095), shellHighlightMaterial).position.set(-.65, .92, .535);
	kit.mesh("radio-speaker-cavity", new RoundedBoxGeometry(1.08, .86, .055, 2, .07), cavityMaterial).position.set(-.65, .92, .582);
	const speakerPivot = kit.pivot("radio-speaker-diaphragm-pivot");
	speakerPivot.position.set(-.65, .92, .595);
	const speakerSocket = kit.socket("radio-speaker-socket", speakerPivot, [
		0,
		0,
		.13
	]);
	speakerSocket.userData.direction = [
		0,
		0,
		1
	];
	speakerSocket.userData.emissionRule = "front-only-no-body-crossing";
	const speakerDiaphragm = kit.mesh("radio-speaker-diaphragm", new RoundedBoxGeometry(.98, .76, .025, 1, .055), accentDarkMaterial, speakerPivot, false);
	speakerDiaphragm.userData.explodeWithParent = true;
	for (let index = 0; index < 16; index += 1) addRoundedBar(kit, `radio-speaker-slat-${index + 1}`, 1.03, .035, .04, shellHighlightMaterial, kit.root).position.set(-.65, .565 + index * .047, .635);
	kit.mesh("radio-frequency-frame", new RoundedBoxGeometry(.86, .5, .085, 2, .08), shellHighlightMaterial).position.set(.63, 1.23, .545);
	kit.mesh("radio-frequency-face", new RoundedBoxGeometry(.73, .37, .045, 1, .05), screenMaterial).position.set(.63, 1.23, .602);
	for (let index = 0; index < 9; index += 1) addRoundedBar(kit, `radio-frequency-tick-${index + 1}`, .012, index % 2 === 0 ? .105 : .065, .018, shellHighlightMaterial, kit.root).position.set(.34 + index * .073, 1.23, .636);
	const pointerPivot = kit.pivot("radio-frequency-pointer-pivot");
	pointerPivot.position.set(.63, 1.23, .655);
	const pointerVertical = addRoundedBar(kit, "radio-frequency-pointer-vertical", .018, .28, .018, accentLightMaterial, pointerPivot);
	const pointerHorizontal = addRoundedBar(kit, "radio-frequency-pointer-horizontal", .62, .018, .018, accentLightMaterial, pointerPivot);
	pointerVertical.position.set(0, 0, 0);
	pointerHorizontal.position.set(0, 0, -.002);
	const glass = kit.mesh("radio-frequency-glass", new RoundedBoxGeometry(.74, .38, .02, 1, .045), glassMaterial, kit.root, false);
	glass.position.set(.63, 1.23, .681);
	glass.userData.explodeWithParent = true;
	const volumePivot = kit.pivot("radio-volume-knob-pivot");
	volumePivot.position.set(.36, .665, .57);
	volumePivot.userData.rotationAxis = [
		0,
		0,
		1
	];
	const volumeRing = kit.mesh("radio-volume-knob-ring", new CylinderGeometry(.175, .175, .07, 20), accentDarkMaterial, volumePivot);
	volumeRing.rotation.x = Math.PI * .5;
	const volumeKnob = kit.mesh("radio-volume-knob", new CylinderGeometry(.145, .145, .09, 20), shellHighlightMaterial, volumePivot);
	volumeKnob.rotation.x = Math.PI * .5;
	volumeKnob.position.z = .055;
	addRoundedBar(kit, "radio-volume-index", .018, .075, .014, cavityMaterial, volumePivot).position.set(0, .055, .11);
	const tuningPivot = kit.pivot("radio-tuning-knob-pivot");
	tuningPivot.position.set(.92, .66, .57);
	tuningPivot.userData.rotationAxis = [
		0,
		0,
		1
	];
	const tuningOuterRing = kit.mesh("radio-tuning-knob-outer-ring", new CylinderGeometry(.29, .29, .075, 24), accentDarkMaterial, tuningPivot);
	tuningOuterRing.rotation.x = Math.PI * .5;
	const tuningInnerRing = kit.mesh("radio-tuning-knob-inner-ring", new CylinderGeometry(.255, .255, .095, 24), shellHighlightMaterial, tuningPivot);
	tuningInnerRing.rotation.x = Math.PI * .5;
	tuningInnerRing.position.z = .055;
	const tuningKnob = kit.mesh("radio-tuning-knob", new CylinderGeometry(.205, .205, .11, 24), accentLightMaterial, tuningPivot);
	tuningKnob.rotation.x = Math.PI * .5;
	tuningKnob.position.z = .115;
	const tinyIndicator = kit.mesh("radio-tuning-ready-dot", new SphereGeometry(.022, 8, 6), darkMetalMaterial, kit.root, false);
	tinyIndicator.position.set(.35, .905, .655);
	tinyIndicator.userData.explodeWithParent = true;
	kit.indicator([
		.61,
		.415,
		.665
	], .037);
	kit.mesh("radio-rear-access-panel", new RoundedBoxGeometry(2.18, .92, .04, 2, .075), shellHighlightMaterial).position.set(0, .88, -.425);
	for (let row = 0; row < 4; row += 1) for (let column = 0; column < 4; column += 1) addRoundedBar(kit, `radio-rear-vent-r${row + 1}-c${column + 1}`, .22, .035, .022, darkMetalMaterial, kit.root).position.set(-.45 + column * .3, 1.04 - row * .135, -.457);
	for (const x of [-.92, .92]) {
		const screw = kit.mesh(`radio-rear-fastener-${x < 0 ? "left" : "right"}`, new CylinderGeometry(.048, .048, .026, 12), metalMaterial, kit.root, false);
		screw.rotation.x = Math.PI * .5;
		screw.position.set(x, .47, -.46);
		screw.userData.explodeWithParent = true;
	}
	for (const x of [-1.05, 1.05]) for (const z of [-.25, .25]) kit.mesh(`radio-foot-${x < 0 ? "left" : "right"}-${z < 0 ? "rear" : "front"}`, new RoundedBoxGeometry(.25, .12, .28, 1, .035), rubberMaterial, kit.root, false).position.set(x, .06, z);
	kit.mesh("radio-antenna-hinge-bracket", new RoundedBoxGeometry(.18, .36, .095, 1, .045), darkMetalMaterial).position.set(.99, 1.48, -.42);
	const antennaHinge = kit.pivot("radio-antenna-hinge-pivot");
	antennaHinge.position.set(.99, 1.57, -.34);
	antennaHinge.rotation.z = ANTENNA_REST_ANGLE;
	antennaHinge.userData.hingeAxis = [
		0,
		0,
		1
	];
	antennaHinge.userData.rotationRange = [0, 1.42];
	kit.socket("radio-antenna-root-socket", antennaHinge, [
		0,
		0,
		0
	]);
	const hingeAxle = kit.mesh("radio-antenna-hinge-axle", new CylinderGeometry(.075, .075, .14, 14), metalMaterial, antennaHinge);
	hingeAxle.rotation.x = Math.PI * .5;
	const segmentLengths = [
		1.35,
		1.2,
		1.05
	];
	const segmentRadii = [
		.042,
		.032,
		.023
	];
	const storedStarts = [
		.055,
		.34,
		.59
	];
	const extendedStarts = [
		.055,
		1.28,
		2.42
	];
	for (let index = 0; index < segmentLengths.length; index += 1) {
		const length = segmentLengths[index];
		const extensionPivot = kit.pivot(`radio-antenna-extension-pivot-${index + 1}`, antennaHinge);
		extensionPivot.position.y = storedStarts[index];
		extensionPivot.userData.restY = storedStarts[index];
		extensionPivot.userData.extendedY = extendedStarts[index];
		extensionPivot.userData.extensionAxis = [
			0,
			1,
			0
		];
		const segment = kit.mesh(`radio-antenna-segment-${index + 1}`, new CylinderGeometry(segmentRadii[index] * .86, segmentRadii[index], length, 10), index === 0 ? darkMetalMaterial : metalMaterial, extensionPivot);
		segment.position.y = length * .5;
		segment.userData.explodeWithParent = true;
		if (index > 0) {
			const collar = kit.mesh(`radio-antenna-segment-${index + 1}-collar`, new CylinderGeometry(segmentRadii[index] * 1.22, segmentRadii[index] * 1.28, .065, 10), darkMetalMaterial, extensionPivot);
			collar.position.y = .0325;
			collar.userData.explodeWithParent = true;
		}
	}
	const tipExtensionPivot = kit.pivot("radio-antenna-tip-extension-pivot", antennaHinge);
	tipExtensionPivot.position.y = Math.max(...storedStarts.map((start, index) => start + segmentLengths[index]));
	tipExtensionPivot.userData.tracksHighestAntennaSection = true;
	tipExtensionPivot.userData.trackedSections = segmentLengths.map((length, index) => ({
		pivot: `radio-antenna-extension-pivot-${index + 1}`,
		length
	}));
	const antennaCap = kit.mesh("radio-antenna-tip-cap", new SphereGeometry(.082, 12, 8), darkMetalMaterial, tipExtensionPivot);
	antennaCap.position.y = .09;
	antennaCap.scale.y = 1.08;
	antennaCap.userData.persistentAntennaTip = true;
	antennaCap.userData.explodeWithParent = true;
	const build = kit.finish({
		referencePath: options.referencePath ?? REFERENCE_PATH,
		reconstructed: [
			"wide rounded cream outer shell with inset Sakura-colored front panel",
			"separate speaker cavity, raised frame and sixteen horizontal grille slats",
			"beveled frequency window with repeated ticks, glass face and crosshair cursor",
			"unequal volume and tuning knobs with concentric layered rims",
			"rear recessed service panel, four-by-four vent array and two fasteners",
			"four low rounded feet",
			"three nested telescopic antenna segments with independent extension pivots, collars and a hinged tip"
		],
		inferred: [
			"speaker diaphragm depth and motion are inferred because the grille hides the cone",
			"internal tuning mechanism, electronics and acoustic chamber are not reconstructed",
			"underside fasteners and battery compartment are not visible and the floor shell is closed",
			"rear access-panel thickness and hinge construction are reasonable structural inferences"
		]
	});
	build.root.userData.activeDuration = ACTIVE_DURATION;
	build.root.userData.radioRig = {
		qualityContract: "docs/sculpt-specs/radio/quality-contract.md",
		antenna: {
			restAngle: ANTENNA_REST_ANGLE,
			activeAngle: .035,
			extensionPivots: ["radio-antenna-extension-pivot-2", "radio-antenna-extension-pivot-3"],
			terminalCap: "radio-antenna-tip-extension-pivot",
			terminalRule: "always-on-highest-section-top"
		},
		speakerEmitter: {
			socket: "radio-speaker-socket",
			localDirection: [
				0,
				0,
				1
			],
			rule: "front-only-no-body-crossing"
		}
	};
	build.root.userData.outlineContract = {
		main: .0048,
		structure: .0041,
		detail: .0033,
		variation: .18,
		stable: true,
		style: "Sakura low-poly three-band ink; transparent glass and wave effects excluded"
	};
	build.root.userData.radioV2 = {
		geometryLanguage: "faceted-low-poly-radio-shell",
		referenceStatus: "conditional-fallback-v1-views-not-gpt-image-2",
		frozenRuntime: [
			"radio-antenna-hinge-pivot",
			"radio-speaker-socket",
			"radio-antenna-root-socket"
		],
		envelopePolicy: "v1 package bounds authoritative"
	};
	applyRadioOutlineHierarchy(build.root);
	return build;
}
//#endregion
export { radio_exports as n, createRadioModel as t };

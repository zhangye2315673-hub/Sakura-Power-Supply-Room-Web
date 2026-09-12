import { t as __exportAll } from "./rolldown-runtime-D7D4PA-g.js";
import { Hn as SphereGeometry, Qn as TubeGeometry, S as CylinderGeometry, Xn as TorusGeometry, d as CircleGeometry, dr as Vector3, ht as Mesh, p as Color, u as CatmullRomCurve3 } from "./three.core-DlTOC7bx.js";
import { i as RoundedBoxGeometry } from "./BufferGeometryUtils-CtH-hlZf.js";
import { a as setHullOutlineStyle, d as ApplianceModelKit, f as orientCylinderBetween } from "./outline-Cv1Jem2g.js";
//#region src/appliances/models/alarmClock.ts
var alarmClock_exports = /* @__PURE__ */ __exportAll({ createAlarmClockModel: () => createAlarmClockModel });
var REFERENCE_PATH = "E:/AI/codexAI/sakula/arrow-cube/references/intake/alarm-clock/front.png";
var ACTIVE_DURATION = 5.2;
var OUTLINE = {
	main: .0048,
	structure: .0041,
	detail: .0033,
	variation: .18
};
function rounded(width, height, depth, radius) {
	return new RoundedBoxGeometry(width, height, depth, 4, radius);
}
function addBar(kit, name, start, end, radius, material, parent, outlined = false) {
	const bar = kit.mesh(name, new CylinderGeometry(radius, radius, 1, 6), material, parent, outlined);
	orientCylinderBetween(bar, start, end);
	return bar;
}
function applyOutlineTier(mesh, tier, phase) {
	mesh.userData.outlineTier = tier;
	const outline = mesh.children.find((child) => child instanceof Mesh && child.userData.isOutline === true);
	if (!outline) return;
	setHullOutlineStyle(outline, {
		thickness: OUTLINE[tier],
		variation: OUTLINE.variation,
		phase
	});
	outline.userData.outlineTier = tier;
}
/** Three-view procedural reconstruction of the Sakura twin-bell alarm clock. */
function createAlarmClockModel(options) {
	const kit = new ApplianceModelKit(options);
	const accent = new Color(options.accent);
	const pink = accent.clone().offsetHSL(0, -.03, .07).getHex();
	const pinkLight = accent.clone().offsetHSL(0, -.075, .17).getHex();
	const pinkPale = accent.clone().offsetHSL(0, -.12, .25).getHex();
	const pinkDark = accent.clone().offsetHSL(0, 0, -.13).getHex();
	const shellMaterial = kit.material(pink, { tint: 9070454 });
	const shellHighlightMaterial = kit.material(pinkLight, { tint: 10847107 });
	const dialMaterial = kit.material(16773852, { tint: 10323856 });
	const dialGlassMaterial = kit.material(16775145, {
		tint: 12165798,
		transparent: true,
		opacity: .16
	});
	dialGlassMaterial.depthWrite = false;
	const handMaterial = kit.material(8083555, { tint: 5325906 });
	const hardwareMaterial = kit.material(7166306, { tint: 4800845 });
	const bellMaterial = kit.material(pinkPale, { tint: 10848900 });
	const cavityMaterial = kit.material(6573397, { tint: 4339780 });
	const glowMaterial = kit.material(pinkLight, {
		tint: 12023955,
		emissive: pink,
		transparent: true,
		opacity: .08
	});
	const bodyPivot = kit.pivot("alarm-clock-body-pivot");
	bodyPivot.position.y = 1.18;
	const body = kit.mesh("alarm-clock-circular-shell", new CylinderGeometry(.98, .98, .42, 12), shellMaterial, bodyPivot);
	body.rotation.x = Math.PI * .5;
	body.userData.part = "main-shell";
	applyOutlineTier(body, "main", .17);
	const shellBand = kit.mesh("alarm-clock-shell-front-band", new TorusGeometry(.91, .085, 6, 12), shellHighlightMaterial, bodyPivot);
	shellBand.position.z = .225;
	applyOutlineTier(shellBand, "structure", .51);
	const shellInnerBand = kit.mesh("alarm-clock-shell-inner-seam", new TorusGeometry(.82, .023, 5, 12), pinkDark ? kit.material(pinkDark, { tint: 6967392 }) : shellMaterial, bodyPivot, true);
	shellInnerBand.position.z = .244;
	applyOutlineTier(shellInnerBand, "detail", .83);
	const dialPivot = kit.pivot("alarm-clock-dial-assembly-pivot", bodyPivot);
	dialPivot.position.z = .245;
	kit.socket("alarm-clock-dial-axis-socket", dialPivot, [
		0,
		0,
		.04
	]);
	const dial = kit.mesh("alarm-clock-ivory-dial", new CylinderGeometry(.79, .79, .035, 12), dialMaterial, dialPivot, false);
	dial.rotation.x = Math.PI * .5;
	dial.position.z = .025;
	const dialRim = kit.mesh("alarm-clock-dial-raised-rim", new TorusGeometry(.79, .028, 5, 12), shellHighlightMaterial, dialPivot, true);
	dialRim.position.z = .05;
	applyOutlineTier(dialRim, "structure", 1.12);
	const glass = kit.mesh("alarm-clock-dial-transparent-cover", new CylinderGeometry(.76, .76, .018, 12), dialGlassMaterial, dialPivot, false);
	glass.rotation.x = Math.PI * .5;
	glass.position.z = .075;
	glass.renderOrder = 6;
	const dialGlow = kit.mesh("alarm-clock-dial-powered-backlight", new CircleGeometry(.68, 12), glowMaterial, dialPivot, false);
	dialGlow.position.z = .048;
	dialGlow.renderOrder = 1;
	const tickMaterial = kit.material(pink, { tint: 9531263 });
	for (let index = 0; index < 12; index += 1) {
		const angle = index * Math.PI / 6;
		const inner = index % 3 === 0 ? .62 : .66;
		const outer = .72;
		const start = new Vector3(Math.sin(angle) * inner, Math.cos(angle) * inner, .085);
		const end = new Vector3(Math.sin(angle) * outer, Math.cos(angle) * outer, .085);
		const tick = addBar(kit, `alarm-clock-dial-tick-${index + 1}`, start, end, index % 3 === 0 ? .028 : .019, tickMaterial, dialPivot);
		tick.userData.explodeWithParent = true;
		applyOutlineTier(tick, "detail", 1.4 + index * .19);
	}
	const handPivot = kit.pivot("alarm-clock-hands-pivot", dialPivot);
	handPivot.position.z = .11;
	handPivot.userData.rotationAxis = [
		0,
		0,
		1
	];
	kit.socket("alarm-clock-hands-center-socket", handPivot, [
		0,
		0,
		.02
	]);
	const hourHandPivot = kit.pivot("alarm-clock-hour-hand-pivot", handPivot);
	const minuteHandPivot = kit.pivot("alarm-clock-minute-hand-pivot", handPivot);
	const hourHand = addBar(kit, "alarm-clock-hour-hand", new Vector3(0, 0, 0), new Vector3(-.32, .28, 0), .035, handMaterial, hourHandPivot, true);
	hourHand.userData.part = "hour-hand";
	applyOutlineTier(hourHand, "detail", 2.03);
	const minuteHand = addBar(kit, "alarm-clock-minute-hand", new Vector3(0, 0, .012), new Vector3(.46, .39, .012), .028, handMaterial, minuteHandPivot, true);
	minuteHand.userData.part = "minute-hand";
	applyOutlineTier(minuteHand, "detail", 2.37);
	const handHub = kit.mesh("alarm-clock-hands-center-cap", new SphereGeometry(.105, 8, 6), shellHighlightMaterial, handPivot, true);
	handHub.position.z = .035;
	applyOutlineTier(handHub, "detail", 2.71);
	const feetMaterial = kit.material(pinkDark, { tint: 6179933 });
	[[
		-.62,
		-.86,
		.03
	], [
		.62,
		-.86,
		.03
	]].forEach(([x, y, z], index) => {
		const footPivot = kit.pivot(`alarm-clock-foot-${index + 1}-pivot`, bodyPivot);
		footPivot.position.set(x, y, z);
		footPivot.rotation.z = index === 0 ? .25 : -.25;
		const foot = kit.mesh(`alarm-clock-foot-${index + 1}`, rounded(.24, .42, .34, .08), feetMaterial, footPivot);
		foot.position.y = -.15;
		foot.userData.part = `angled-foot-${index + 1}`;
		applyOutlineTier(foot, "main", 3.1 + index * .41);
		kit.socket(`alarm-clock-foot-${index + 1}-socket`, bodyPivot, [
			x,
			-.72,
			z
		]);
	});
	const bellBaseAngles = [.52, -.52];
	[[-.68, .44], [.68, .44]].forEach(([x, z], index) => {
		const bellPivot = kit.pivot(`alarm-clock-bell-${index + 1}-pivot`, bodyPivot);
		bellPivot.position.set(x, .9, z);
		bellPivot.rotation.z = bellBaseAngles[index];
		bellPivot.userData.rotationAxis = [
			0,
			0,
			1
		];
		kit.socket(`alarm-clock-bell-${index + 1}-attachment-socket`, bodyPivot, [
			x,
			.54,
			z
		]);
		const bell = kit.mesh(`alarm-clock-bell-${index + 1}-dome`, new SphereGeometry(.5, 12, 7, 0, Math.PI * 2, 0, Math.PI * .58), bellMaterial, bellPivot);
		bell.scale.set(1.08, .82, .88);
		bell.rotation.x = -.08;
		applyOutlineTier(bell, "main", 3.83 + index * .53);
		const lip = kit.mesh(`alarm-clock-bell-${index + 1}-lower-lip`, new TorusGeometry(.42, .055, 6, 12), shellHighlightMaterial, bellPivot, true);
		lip.rotation.x = Math.PI * .5;
		lip.position.y = -.21;
		applyOutlineTier(lip, "structure", 4.22 + index * .47);
		const cavity = kit.mesh(`alarm-clock-bell-${index + 1}-under-cavity`, new CylinderGeometry(.35, .35, .065, 12), cavityMaterial, bellPivot, false);
		cavity.rotation.x = Math.PI * .5;
		cavity.position.z = .015;
		const post = kit.mesh(`alarm-clock-bell-${index + 1}-support-post`, rounded(.13, .38, .14, .04), pinkDark ? kit.material(pinkDark) : shellMaterial, bodyPivot, false);
		post.position.set(x, .54, .02);
		post.rotation.z = index === 0 ? -.16 : .16;
		applyOutlineTier(post, "structure", 4.71 + index * .37);
		const hammerPivot = kit.pivot(`alarm-clock-bell-hammer-${index + 1}-pivot`, bodyPivot);
		hammerPivot.position.set(x, .54, .35);
		hammerPivot.userData.rotationAxis = [
			0,
			0,
			1
		];
		const hammer = kit.mesh(`alarm-clock-bell-hammer-${index + 1}`, rounded(.11, .45, .1, .045), hardwareMaterial, hammerPivot, true);
		hammer.position.y = .23;
		hammer.rotation.z = index === 0 ? -.12 : .12;
		applyOutlineTier(hammer, "detail", 5.14 + index * .31);
		const hammerCap = kit.mesh(`alarm-clock-bell-hammer-cap-${index + 1}`, new SphereGeometry(.09, 8, 6), shellHighlightMaterial, hammerPivot, false);
		hammerCap.position.y = .45;
		hammerCap.userData.explodeWithParent = true;
	});
	const handlePivot = kit.pivot("alarm-clock-carry-handle-pivot", bodyPivot);
	const handleCurve = new CatmullRomCurve3([
		new Vector3(-.73, 1, 0),
		new Vector3(-.55, 1.45, 0),
		new Vector3(0, 1.66, 0),
		new Vector3(.55, 1.45, 0),
		new Vector3(.73, 1, 0)
	]);
	const handle = kit.mesh("alarm-clock-arched-carry-handle", new TubeGeometry(handleCurve, 12, .065, 6, false), shellMaterial, handlePivot);
	handle.userData.part = "carry-handle";
	applyOutlineTier(handle, "main", 5.81);
	kit.socket("alarm-clock-handle-left-socket", bodyPivot, [
		-.73,
		1,
		0
	]);
	kit.socket("alarm-clock-handle-right-socket", bodyPivot, [
		.73,
		1,
		0
	]);
	const alarmLeverPivot = kit.pivot("alarm-clock-top-alarm-lever-pivot", bodyPivot);
	alarmLeverPivot.position.set(0, 1, 0);
	alarmLeverPivot.userData.rotationAxis = [
		1,
		0,
		0
	];
	const leverPost = kit.mesh("alarm-clock-top-alarm-lever-post", rounded(.1, .29, .1, .03), pinkDark ? kit.material(pinkDark) : shellMaterial, alarmLeverPivot);
	leverPost.position.y = .13;
	applyOutlineTier(leverPost, "structure", 6.17);
	const leverBar = kit.mesh("alarm-clock-top-alarm-lever-bar", rounded(.39, .1, .13, .045), shellMaterial, alarmLeverPivot);
	leverBar.position.y = .29;
	applyOutlineTier(leverBar, "structure", 6.53);
	kit.socket("alarm-clock-alarm-lever-socket", alarmLeverPivot, [
		0,
		.18,
		0
	]);
	const feedbackRig = kit.pivot("alarm-clock-ringing-feedback-rig", bodyPivot);
	feedbackRig.userData.effectOwner = "alarm-clock-model-rig";
	[-1, 1].forEach((side) => {
		for (let index = 0; index < 3; index += 1) {
			const wave = kit.mesh(`alarm-clock-stereo-wave-${side < 0 ? "left" : "right"}-${index + 1}`, new TorusGeometry(.2 + index * .075, .025 + index * .004, 5, 12), glowMaterial, feedbackRig, false);
			wave.position.set(side * (1.08 + index * .11), .74 + index * .03, .08);
			wave.scale.set(.7, 1.2, .82);
			wave.visible = false;
			wave.userData.performanceEffect = true;
			wave.userData.side = side;
			wave.userData.waveIndex = index;
		}
		for (let index = 0; index < 2; index += 1) {
			const x = side * (1.02 + index * .13);
			const arc = kit.mesh(`alarm-clock-vibration-arc-${side < 0 ? "left" : "right"}-${index + 1}`, new TubeGeometry(new CatmullRomCurve3([
				new Vector3(x, .42 - index * .06, .08),
				new Vector3(x + side * .16, .72, .12),
				new Vector3(x, 1.02 + index * .08, .08)
			]), 8, .032, 5, false), shellHighlightMaterial, feedbackRig, false);
			arc.visible = false;
			arc.userData.performanceEffect = true;
			arc.userData.side = side;
			arc.userData.arcIndex = index;
		}
	});
	const rearPivot = kit.pivot("alarm-clock-rear-service-pivot", bodyPivot);
	rearPivot.position.z = -.24;
	const rearPlate = kit.mesh("alarm-clock-rear-circular-service-plate", new CylinderGeometry(.79, .79, .035, 12), shellMaterial, rearPivot, true);
	rearPlate.rotation.x = Math.PI * .5;
	rearPlate.position.z = -.03;
	applyOutlineTier(rearPlate, "structure", 7.01);
	const rearSeam = kit.mesh("alarm-clock-rear-service-seam", new TorusGeometry(.68, .022, 5, 12), shellHighlightMaterial, rearPivot, true);
	rearSeam.position.z = -.055;
	applyOutlineTier(rearSeam, "detail", 7.37);
	const knobPivots = [];
	[-.3, .3].forEach((x, index) => {
		const knobPivot = kit.pivot(`alarm-clock-rear-winding-knob-${index + 1}-pivot`, rearPivot);
		knobPivot.position.set(x, .04, -.09);
		knobPivot.userData.rotationAxis = [
			0,
			0,
			1
		];
		const knob = kit.mesh(`alarm-clock-rear-winding-knob-${index + 1}`, new CylinderGeometry(.13, .13, .09, 8), shellHighlightMaterial, knobPivot);
		knob.rotation.x = Math.PI * .5;
		knob.position.z = -.02;
		applyOutlineTier(knob, "detail", 7.73 + index * .29);
		knobPivots.push(knobPivot);
	});
	kit.mesh("alarm-clock-rear-power-inlet-inferred", rounded(.2, .12, .06, .025), cavityMaterial, rearPivot, false).position.set(0, -.5, -.07);
	kit.socket("alarm-clock-power-connection-socket", rearPivot, [
		0,
		-.5,
		-.13
	]);
	const build = kit.finish({
		referencePath: options.referencePath ?? REFERENCE_PATH,
		reconstructed: [
			"round pink painted-metal shell with layered front rim and warm ivory dial",
			"twelve separate tick marks, independent hour/minute hands and transparent dial cover",
			"paired cream bell domes with lower lips, cavities and separate oscillating hammer pivots",
			"arched carry handle, top alarm lever, two angled front feet and circular rear service plate",
			"two rear winding knobs plus inferred rear-lower power inlet/socket"
		],
		inferred: [
			"internal escapement, bell springs, battery compartment and gear train are hidden by the supplied views",
			"rear power inlet profile and exact knob shaft depth are inferred from appliance interaction conventions",
			"bell hammer attachment depth and underside shell thickness are conservative procedural estimates"
		]
	});
	build.root.userData.sculptRuntime.colliders = [
		{
			id: "alarm-clock-body",
			type: "cylinder",
			node: "alarm-clock-circular-shell"
		},
		{
			id: "alarm-clock-left-bell",
			type: "sphere",
			node: "alarm-clock-bell-1-dome"
		},
		{
			id: "alarm-clock-right-bell",
			type: "sphere",
			node: "alarm-clock-bell-2-dome"
		}
	];
	build.root.userData.sculptRuntime.destructionGroups = [
		{
			id: "body-shell",
			nodes: ["alarm-clock-body-pivot"]
		},
		{
			id: "dial-assembly",
			nodes: ["alarm-clock-dial-assembly-pivot"]
		},
		{
			id: "bells",
			nodes: ["alarm-clock-bell-1-pivot", "alarm-clock-bell-2-pivot"]
		},
		{
			id: "rear-service",
			nodes: ["alarm-clock-rear-service-pivot"]
		}
	];
	build.root.userData.activeDuration = ACTIVE_DURATION;
	build.root.userData.outlineContract = {
		system: "stable-object-space-low-frequency",
		main: OUTLINE.main,
		structure: OUTLINE.structure,
		detail: OUTLINE.detail,
		variation: OUTLINE.variation,
		animated: false
	};
	build.root.userData.alarmClockEffectContract = {
		modelOwner: "alarm-clock-model-rig",
		timelineOwner: "AppliancePerformanceSystem",
		sharedSpectacleEffects: "must-be-disabled-during-integration",
		structuralRoot: "alarm-clock-body-pivot",
		stereoWaveVolumes: 6,
		vibrationArcVolumes: 4,
		flatEffects: 0
	};
	return build;
}
//#endregion
export { createAlarmClockModel as n, alarmClock_exports as t };

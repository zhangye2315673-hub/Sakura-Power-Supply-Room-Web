import { t as __exportAll } from "./rolldown-runtime-D7D4PA-g.js";
import { Hn as SphereGeometry, L as Float32BufferAttribute, S as CylinderGeometry, Xn as TorusGeometry, dr as Vector3, ht as Mesh, i as BoxGeometry, o as BufferGeometry, p as Color } from "./three.core-DlTOC7bx.js";
import { C as PRINTER_PAPER_PROFILES, i as RoundedBoxGeometry, w as PRINTER_PAPER_STOP_END } from "./BufferGeometryUtils-B_UDylAy.js";
import { a as setHullOutlineStyle, d as ApplianceModelKit } from "./outline-BxlNUz10.js";
//#region src/appliances/models/printer.ts
var printer_exports = /* @__PURE__ */ __exportAll({ createPrinterModel: () => createPrinterModel });
var V2_REFERENCE_PATH = "references/intake-v2/printer/views/front.png";
var ACTIVE_DURATION = PRINTER_PAPER_STOP_END;
var PAPER_WIDTH = 1.72;
var PAPER_LENGTH = PAPER_WIDTH * Math.SQRT2 * .5;
var PAPER_THICKNESS = .009;
var PERFORMANCE_PAGE_COUNT = PRINTER_PAPER_PROFILES.length;
function stableOutlinePhase(name) {
	let hash = 2166136261;
	for (let index = 0; index < name.length; index += 1) {
		hash ^= name.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return (hash >>> 0) % 1e4 * (Math.PI * 2 / 1e4);
}
function applyPrinterOutlineHierarchy(root) {
	const mainSilhouette = /main-enclosure|lower-band|top-lid|paper-support-structural|output-tray$/;
	const fineDetail = /guide-|roller-|carriage|control-highlight|status-indicator|power-inlet|foot-|finger-recess|front-grip/;
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
function facetedEnclosureGeometry(width, height, depth, chamfer, shoulderInset) {
	const halfWidth = width * .5;
	const halfHeight = height * .5;
	const halfDepth = depth * .5;
	const ring = (inset) => [
		[-halfWidth + inset + chamfer, -halfDepth + inset],
		[halfWidth - inset - chamfer, -halfDepth + inset],
		[halfWidth - inset, -halfDepth + inset + chamfer],
		[halfWidth - inset, halfDepth - inset - chamfer],
		[halfWidth - inset - chamfer, halfDepth - inset],
		[-halfWidth + inset + chamfer, halfDepth - inset],
		[-halfWidth + inset, halfDepth - inset - chamfer],
		[-halfWidth + inset, -halfDepth + inset + chamfer]
	];
	const lower = ring(0);
	const upper = ring(shoulderInset);
	const vertices = [];
	for (const y of [-halfHeight, halfHeight]) for (const [x, z] of y < 0 ? lower : upper) vertices.push(x, y, z);
	const indices = [];
	for (let index = 0; index < 8; index += 1) {
		const next = (index + 1) % 8;
		indices.push(index, 8 + next, next, index, 8 + index, 8 + next);
	}
	for (let index = 1; index < 7; index += 1) {
		indices.push(0, index + 1, index);
		indices.push(8, 8 + index, 8 + index + 1);
	}
	const geometry = new BufferGeometry();
	geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
	geometry.setIndex(indices);
	geometry.computeVertexNormals();
	geometry.computeBoundingBox();
	geometry.computeBoundingSphere();
	return geometry;
}
function rounded(width, height, depth, radius, segments = 4) {
	return new RoundedBoxGeometry(width, height, depth, segments, radius);
}
function setPart(mesh, part, relief = false) {
	mesh.userData.part = part;
	if (relief) mesh.userData.explodeWithParent = true;
}
/**
* A clean, closed A4 sheet. It is deliberately not PlaneGeometry: duplicated
* top/bottom skins and four edge walls preserve a very thin paper volume. The
* runtime keeps these vertices in their exact rest pose so the printed sheet
* stays smooth and uncreased throughout the whole flight.
*/
function cleanPaperGeometry() {
	const geometry = new BoxGeometry(PAPER_WIDTH, PAPER_THICKNESS, PAPER_LENGTH, 1, 1, 1);
	geometry.computeBoundingBox();
	geometry.computeBoundingSphere();
	geometry.userData.performanceProp = "clean-flat-volumetric-a4-paper";
	geometry.userData.form = "clean-uncreased-closed-thin-sheet";
	geometry.userData.forbiddenPrimitives = [
		"PlaneGeometry",
		"Sprite",
		"Line"
	];
	return geometry;
}
/**
* Procedural reconstruction of the supplied three-view Sakura compact printer.
*
* Local frame: +Y up, +Z faces the output tray, floor at Y=0. The enclosure,
* input support, output path, controls and rear inlet are independent runtime
* parts. Hidden ink cartridges and the internal printhead are not fabricated.
*/
function createPrinterModel(options) {
	const kit = new ApplianceModelKit(options);
	const accent = new Color(options.accent);
	const pink = accent.clone().offsetHSL(0, -.035, .055).getHex();
	const pinkLight = accent.clone().offsetHSL(0, -.07, .13).getHex();
	const pinkDark = accent.clone().offsetHSL(0, .015, -.12).getHex();
	const cream = kit.material(16182750, { tint: 9206658 });
	const creamLight = kit.material(16775402, { tint: 10719636 });
	const pinkShell = kit.material(pink, { tint: 9201013 });
	const pinkEdge = kit.material(pinkLight, { tint: 11041154 });
	const pinkShadow = kit.material(pinkDark, { tint: 7295842 });
	const cavity = kit.material(7230299, { tint: 4799816 });
	const rollerRubber = kit.material(5327184, { tint: 3683390 });
	const paper = kit.material(16776434, { tint: 11706784 });
	const inletDark = kit.material(3683386, { tint: 2499628 });
	const bodyPivot = kit.pivot("printer-main-body-pivot");
	const body = kit.mesh("printer-faceted-main-enclosure", facetedEnclosureGeometry(3.4, 1.58, 2.38, .22, .085), cream, bodyPivot);
	body.position.set(0, .94, 0);
	setPart(body, "main-shell");
	const lowerBand = kit.mesh("printer-continuous-pink-lower-band", rounded(3.27, .16, 2.4, .075, 2), pinkShell, bodyPivot);
	lowerBand.position.set(0, .2, 0);
	setPart(lowerBand, "rear-lower-band");
	const topLidPivot = kit.pivot("printer-top-access-lid-pivot", bodyPivot);
	topLidPivot.position.set(0, 1.73, .01);
	topLidPivot.userData.rotationAxis = [
		1,
		0,
		0
	];
	topLidPivot.userData.rotationRange = [0, .42];
	kit.socket("printer-top-lid-hinge-socket", topLidPivot, [
		0,
		0,
		-.88
	]);
	const topLid = kit.mesh("printer-thin-rounded-top-lid", rounded(3.33, .16, 2.29, .15, 2), creamLight, topLidPivot);
	topLid.position.y = -.11;
	setPart(topLid, "top-lid");
	const lidSeam = kit.mesh("printer-front-top-lid-seam", rounded(3.12, .035, .035, .015, 2), pinkShadow, topLidPivot, false);
	lidSeam.position.set(0, -.18, 1.155);
	setPart(lidSeam, "top-lid", true);
	const shellHighlightBand = kit.mesh("printer-front-shell-highlight-band", rounded(3.08, .045, .035, .016, 2), creamLight, bodyPivot, false);
	shellHighlightBand.position.set(0, 1.54, 1.195);
	setPart(shellHighlightBand, "shell-highlight-band");
	const paperSupportPivot = kit.pivot("printer-rear-paper-support-pivot");
	paperSupportPivot.position.set(0, 1.58, -.82);
	paperSupportPivot.rotation.x = -.17;
	paperSupportPivot.userData.rotationAxis = [
		1,
		0,
		0
	];
	paperSupportPivot.userData.rotationRange = [-.17, .06];
	kit.socket("printer-paper-support-hinge-socket", paperSupportPivot, [
		0,
		0,
		0
	]);
	const supportStructure = kit.mesh("printer-rear-paper-support-structural-plate", rounded(2.34, .9, .12, .12, 2), pinkEdge, paperSupportPivot);
	supportStructure.position.set(0, .39, -.08);
	setPart(supportStructure, "rear-paper-support");
	const supportBackplate = kit.mesh("printer-wide-pink-paper-support-backplate", rounded(2.2, .8, .18, .11, 2), pinkShell, paperSupportPivot);
	supportBackplate.position.set(0, .37, 0);
	setPart(supportBackplate, "rear-support-backplate");
	const supportGrip = kit.mesh("printer-rear-support-lower-finger-recess", rounded(1.18, .11, .035, .05, 3), pinkEdge, paperSupportPivot, false);
	supportGrip.position.set(0, .08, -.105);
	setPart(supportGrip, "rear-support-backplate", true);
	const guideGeometry = rounded(.18, 1.05, .22, .08, 3);
	for (const [x, label] of [[-.91, "left"], [.91, "right"]]) {
		const guide = kit.mesh(`printer-paper-guide-${label}`, guideGeometry, pinkEdge, paperSupportPivot);
		guide.position.set(x, .58, .02);
		setPart(guide, "paper-guide-array");
	}
	const inputPaperPivot = kit.pivot("printer-input-paper-pivot", paperSupportPivot);
	inputPaperPivot.position.set(0, .67, -.01);
	kit.socket("printer-input-paper-seat-socket", inputPaperPivot, [
		0,
		-.58,
		0
	]);
	setPart(kit.mesh("printer-warm-white-input-paper", rounded(1.62, 1.15, .035, .025, 2), paper, inputPaperPivot, false), "input-paper");
	const outputPivot = kit.pivot("printer-output-cavity-pivot");
	outputPivot.position.set(0, .77, 1.18);
	const cavityBack = kit.mesh("printer-deep-output-cavity", rounded(2.56, .69, .18, .1, 2), cavity, outputPivot);
	cavityBack.position.z = .035;
	setPart(cavityBack, "output-cavity");
	const cavityFloor = kit.mesh("printer-output-cavity-inner-floor", rounded(2.26, .13, .46, .035, 2), pinkShadow, outputPivot);
	cavityFloor.position.set(0, -.22, .16);
	setPart(cavityFloor, "output-cavity", true);
	const lipTop = kit.mesh("printer-output-inner-lip-top", rounded(2.67, .16, .14, .045, 2), pinkEdge, outputPivot);
	lipTop.position.set(0, .32, .1);
	setPart(lipTop, "output-cavity-inner-lip");
	for (const [x, label] of [[-1.16, "left"], [1.16, "right"]]) {
		const side = kit.mesh(`printer-output-inner-lip-${label}`, rounded(.17, .66, .14, .045, 2), pinkEdge, outputPivot);
		side.position.set(x, .02, .1);
		setPart(side, "output-cavity-inner-lip");
	}
	const rollerPivot = kit.pivot("printer-feed-roller-pivot", outputPivot);
	rollerPivot.position.set(0, .01, .22);
	rollerPivot.userData.rotationAxis = [
		1,
		0,
		0
	];
	kit.socket("printer-paper-exit-socket", outputPivot, [
		0,
		-.02,
		.35
	]);
	const rollerGeometry = new CylinderGeometry(.095, .095, .76, 8);
	for (const [x, label] of [[-.55, "left"], [.55, "right"]]) {
		const roller = kit.mesh(`printer-feed-roller-${label}`, rollerGeometry, rollerRubber, rollerPivot, false);
		roller.position.x = x;
		roller.rotation.z = Math.PI * .5;
		setPart(roller, "feed-roller-array");
	}
	const carriagePivot = kit.pivot("printer-inferred-print-carriage-pivot", outputPivot);
	carriagePivot.position.set(0, .14, .075);
	setPart(kit.mesh("printer-inferred-printhead-carriage", rounded(.56, .14, .08, .035, 3), pinkShadow, carriagePivot, false), "inferred-print-carriage");
	const paperPerformanceRig = kit.pivot("printer-performance-paper-rig");
	paperPerformanceRig.userData.performanceOwner = "PrinterPerformance";
	paperPerformanceRig.userData.sourceSocket = "printer-paper-exit-socket";
	const pageStart = new Vector3(0, .75, 1.53 - PAPER_LENGTH * .5);
	for (let index = 0; index < PERFORMANCE_PAGE_COUNT; index += 1) {
		const pageNumber = index + 1;
		const profile = PRINTER_PAPER_PROFILES[index];
		const pagePivot = kit.pivot(`printer-performance-page-${pageNumber}`, paperPerformanceRig);
		pagePivot.position.copy(pageStart);
		pagePivot.visible = false;
		pagePivot.userData.performanceEffect = true;
		pagePivot.userData.paperProfileId = profile.id;
		pagePivot.userData.launchTime = profile.launchTime;
		pagePivot.userData.flightDuration = profile.flightDuration;
		pagePivot.userData.feedEnd = profile.feedEnd;
		pagePivot.userData.glideEnd = profile.glideEnd;
		pagePivot.userData.fallFirstStop = profile.fallFirstStop;
		const pageMesh = kit.mesh(`printer-clean-a4-output-page-${pageNumber}`, cleanPaperGeometry(), paper, pagePivot, false);
		pageMesh.frustumCulled = false;
		pageMesh.castShadow = false;
		pageMesh.receiveShadow = false;
		pageMesh.userData.performanceEffect = true;
		pageMesh.userData.performanceProp = "clean-flat-volumetric-a4-paper";
		pageMesh.userData.paperWidth = PAPER_WIDTH;
		pageMesh.userData.paperLength = PAPER_LENGTH;
		pageMesh.userData.paperThickness = PAPER_THICKNESS;
		pageMesh.userData.aspectRatio = PAPER_LENGTH / PAPER_WIDTH;
		pageMesh.userData.sourceSocket = "printer-paper-exit-socket";
		pageMesh.userData.lifecycle = "continuous-feed-loop-slow-depth-fall-recycle";
		pageMesh.userData.forbiddenPrimitives = [
			"PlaneGeometry",
			"Sprite",
			"Line"
		];
		setPart(pageMesh, "performance-paper-stream");
	}
	const trayPivot = kit.pivot("printer-output-tray-hinge-pivot");
	trayPivot.position.set(0, .39, 1.21);
	trayPivot.userData.rotationAxis = [
		1,
		0,
		0
	];
	trayPivot.userData.rotationRange = [-.08, 1.18];
	kit.socket("printer-output-tray-hinge-socket", trayPivot, [
		0,
		0,
		0
	]);
	const tray = kit.mesh("printer-projecting-pink-output-tray", rounded(2.5, .14, 1.02, .085, 2), pinkShell, trayPivot);
	tray.position.set(0, -.06, .34);
	setPart(tray, "output-tray");
	const trayInset = kit.mesh("printer-output-tray-cream-inset", rounded(1.9, .025, .62, .025, 2), pinkEdge, trayPivot, false);
	trayInset.position.set(0, .015, .33);
	setPart(trayInset, "output-tray", true);
	const trayGrip = kit.mesh("printer-output-tray-front-grip", rounded(.92, .045, .13, .035, 3), pinkEdge, trayPivot, false);
	trayGrip.position.set(0, .02, .79);
	setPart(trayGrip, "tray-handle");
	const controlPivot = kit.pivot("printer-main-control-button-pivot");
	controlPivot.position.set(.98, 1.31, 1.26);
	controlPivot.userData.translationAxis = [
		0,
		0,
		-1
	];
	kit.socket("printer-main-control-socket", controlPivot, [
		0,
		0,
		0
	]);
	const controlOuter = kit.mesh("printer-main-control-outer-ring", new CylinderGeometry(.18, .18, .055, 12), pinkShadow, controlPivot);
	controlOuter.rotation.x = Math.PI * .5;
	setPart(controlOuter, "control-button");
	const controlFace = kit.mesh("printer-main-control-pink-face", new CylinderGeometry(.15, .15, .07, 12), pinkEdge, controlPivot);
	controlFace.rotation.x = Math.PI * .5;
	controlFace.position.z = .025;
	setPart(controlFace, "control-button", true);
	const controlHighlight = kit.mesh("printer-main-control-highlight", new TorusGeometry(.135, .012, 5, 12), creamLight, controlPivot, false);
	controlHighlight.position.z = .065;
	setPart(controlHighlight, "control-button", true);
	const status = kit.indicator([
		1.36,
		1.31,
		1.275
	], .058);
	status.name = "printer-small-status-indicator";
	status.userData.part = "status-indicator";
	const rearPivot = kit.pivot("printer-rear-service-pivot");
	rearPivot.position.set(0, 0, -1.205);
	const inletFrame = kit.mesh("printer-rear-power-inlet-pink-frame", rounded(.31, .31, .09, .055, 3), pinkShadow, rearPivot);
	inletFrame.position.set(-1.24, .51, 0);
	setPart(inletFrame, "rear-power-inlet");
	const inletCore = kit.mesh("printer-rear-power-inlet-dark-core", rounded(.19, .19, .07, .035, 3), inletDark, rearPivot, false);
	inletCore.position.set(-1.24, .51, -.075);
	setPart(inletCore, "rear-power-inlet", true);
	const inletPin = kit.mesh("printer-rear-power-inlet-center-pin", new SphereGeometry(.035, 10, 7), creamLight, rearPivot, false);
	inletPin.position.set(-1.24, .51, -.12);
	setPart(inletPin, "rear-power-inlet", true);
	kit.socket("printer-power-cable-socket", rearPivot, [
		-1.24,
		.51,
		-.17
	]);
	const footGeometry = rounded(.48, .12, .38, .055, 3);
	for (const [x, z, label] of [
		[
			-1.18,
			.88,
			"front-left"
		],
		[
			1.18,
			.88,
			"front-right"
		],
		[
			-1.18,
			-.88,
			"rear-left"
		],
		[
			1.18,
			-.88,
			"rear-right"
		]
	]) {
		const foot = kit.mesh(`printer-foot-${label}`, footGeometry, pinkShadow, kit.root, false);
		foot.position.set(x, .09, z);
		setPart(foot, "foot-array");
	}
	const build = kit.finish({
		referencePath: options.referencePath ?? V2_REFERENCE_PATH,
		reconstructed: [
			"wide low eight-plane cream enclosure with a faceted shoulder, thin top lid and continuous pink plinth",
			"exaggerated backward-leaning paper support with twin guides and a warm-white input page",
			"enlarged deep output cavity, chunky pink inner lip, broad hinged tray and centered front grip",
			"twelve-sided right-front control, independent mint indicator and framed rear power inlet",
			"four separate feet, paper exit socket, tray hinge socket, support hinge socket and cable socket",
			"five clean, flat, closed paper volumes with staggered launches, distinct paths and a named exit socket"
		],
		inferred: [
			"paired rubber feed rollers are only partially implied by the output throat and are reconstructed for readable motion",
			"only a small purpose-readable printhead carriage is inferred; cartridge bay, ink routing, controller board and internal gearing are hidden and omitted",
			"tray hinge depth, paper path curvature and support stop angles are inferred from the fixed open views",
			"underside screws, vents, tread and power cable geometry are not visible; the rear socket is the connection anchor"
		]
	});
	build.root.userData.referenceDimensions = {
		bodyWidth: 3.4,
		bodyHeight: 1.58,
		bodyDepth: 2.38,
		overallHeight: 2.78,
		trayProjection: .86,
		outputOpeningWidth: 2.28
	};
	build.root.userData.activeDuration = ACTIVE_DURATION;
	build.root.userData.printerPerformanceRig = {
		owner: "PrinterPerformance",
		sourceSocket: "printer-paper-exit-socket",
		pageCount: PERFORMANCE_PAGE_COUNT,
		pageDimensions: {
			width: PAPER_WIDTH,
			length: PAPER_LENGTH,
			thickness: PAPER_THICKNESS,
			aspectRatio: PAPER_LENGTH / PAPER_WIDTH
		},
		launchTimes: PRINTER_PAPER_PROFILES.map((profile) => profile.launchTime),
		flightDurations: PRINTER_PAPER_PROFILES.map((profile) => profile.flightDuration),
		profiles: PRINTER_PAPER_PROFILES.map((profile) => profile.id),
		lifecycle: "visible-from-exit-through-bottom-viewport-exit",
		sharedSpectacleEffects: "disabled",
		forbiddenPrimitives: [
			"PlaneGeometry",
			"Sprite",
			"Line"
		]
	};
	build.root.userData.visualRevision = "sakura-printer-v2";
	build.root.userData.previewLightingProfile = "sakura-appliance-v2";
	build.root.userData.previewFramingScale = .82;
	build.root.userData.outlineContract = {
		main: .0048,
		structure: .0041,
		detail: .0033,
		variation: .18,
		stable: true
	};
	build.root.userData.sculptRuntime.colliders = [
		{
			id: "printer-main-body",
			type: "box",
			node: "printer-main-body-pivot"
		},
		{
			id: "printer-paper-support",
			type: "box",
			node: "printer-rear-paper-support-pivot"
		},
		{
			id: "printer-output-tray",
			type: "box",
			node: "printer-output-tray-hinge-pivot"
		},
		{
			id: "printer-output-cavity-trigger",
			type: "box",
			node: "printer-output-cavity-pivot",
			trigger: true
		}
	];
	build.root.userData.sculptRuntime.destructionGroups = [
		{
			id: "printer-enclosure",
			nodes: ["printer-main-body-pivot", "printer-top-access-lid-pivot"]
		},
		{
			id: "printer-input-system",
			nodes: ["printer-rear-paper-support-pivot", "printer-input-paper-pivot"]
		},
		{
			id: "printer-output-system",
			nodes: [
				"printer-output-cavity-pivot",
				"printer-output-tray-hinge-pivot",
				"printer-paper-exit-socket",
				"printer-performance-paper-rig"
			]
		},
		{
			id: "printer-controls",
			nodes: ["printer-main-control-button-pivot"]
		},
		{
			id: "printer-rear-service",
			nodes: ["printer-rear-service-pivot"]
		}
	];
	applyPrinterOutlineHierarchy(build.root);
	return build;
}
//#endregion
export { printer_exports as n, createPrinterModel as t };

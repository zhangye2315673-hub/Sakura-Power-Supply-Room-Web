import { t as __exportAll } from "./rolldown-runtime-D7D4PA-g.js";
import { At as Path, Dt as Object3D, I as ExtrudeGeometry, J as InstancedMesh, Ln as Shape, Qn as TubeGeometry, S as CylinderGeometry, Xn as TorusGeometry, dr as Vector3, ht as Mesh, p as Color, u as CatmullRomCurve3 } from "./three.core-DlTOC7bx.js";
import { i as RoundedBoxGeometry, l as PORTABLE_SPEAKER_ACTIVE_DURATION } from "./BufferGeometryUtils-CtH-hlZf.js";
import { a as setHullOutlineStyle, d as ApplianceModelKit } from "./outline-Cv1Jem2g.js";
//#region src/appliances/models/portableSpeaker.ts
var portableSpeaker_exports = /* @__PURE__ */ __exportAll({ createPortableSpeakerModel: () => createPortableSpeakerModel });
var REFERENCE_PATH = "references/intake-v2/portable-speaker/views/front.png";
var LEGACY_REFERENCE_PATH = "references/intake/portable-speaker/front.png";
function rounded(width, height, depth, radius) {
	return new RoundedBoxGeometry(width, height, depth, 5, radius);
}
function stableOutlinePhase(name) {
	let hash = 2166136261;
	for (let index = 0; index < name.length; index += 1) {
		hash ^= name.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return (hash >>> 0) % 1e4 * (Math.PI * 2 / 1e4);
}
function applyPortableSpeakerOutlineHierarchy(root) {
	const mainSilhouette = /cabinet-shell|carry-handle$/;
	const fineDetail = /power-|status-|rear-(?:port|horizontal)|rubber-foot/;
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
function facetedPanelGeometry(width, height, depth, chamfer) {
	const halfWidth = width * .5;
	const halfHeight = height * .5;
	const cut = Math.min(chamfer, halfWidth * .45, halfHeight * .45);
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
		bevelEnabled: false
	});
	geometry.translate(0, 0, -depth * .5);
	geometry.computeVertexNormals();
	return geometry;
}
function carryHandleGeometry() {
	const shape = new Shape();
	const outer = [
		[-1.7, 0],
		[-1.7, .92],
		[-1.58, 1.37],
		[-1.31, 1.76],
		[-.88, 2.05],
		[-.36, 2.22],
		[.36, 2.22],
		[.88, 2.05],
		[1.31, 1.76],
		[1.58, 1.37],
		[1.7, .92],
		[1.7, 0]
	];
	shape.moveTo(outer[0][0], outer[0][1]);
	outer.slice(1).forEach(([x, y]) => shape.lineTo(x, y));
	shape.closePath();
	const opening = new Path();
	const inner = [
		[-1.36, 0],
		[-1.36, .88],
		[-1.25, 1.25],
		[-1.02, 1.55],
		[-.65, 1.76],
		[-.25, 1.87],
		[.25, 1.87],
		[.65, 1.76],
		[1.02, 1.55],
		[1.25, 1.25],
		[1.36, .88],
		[1.36, 0]
	];
	opening.moveTo(inner[0][0], inner[0][1]);
	inner.slice(1).forEach(([x, y]) => opening.lineTo(x, y));
	opening.closePath();
	shape.holes.push(opening);
	const geometry = new ExtrudeGeometry(shape, {
		depth: .46,
		steps: 1,
		bevelEnabled: false,
		curveSegments: 1
	});
	geometry.translate(0, 0, -.23);
	geometry.computeVertexNormals();
	return geometry;
}
/** A closed tube, not a camera-facing ring card: thickness survives every review angle. */
function bassWaveGeometry(variant) {
	const points = [];
	const pointCount = 48;
	const phase = variant * .71;
	for (let index = 0; index < pointCount; index += 1) {
		const angle = index / pointCount * Math.PI * 2;
		const radialWarp = Math.sin(angle * 3 + phase) * .024 + Math.sin(angle * 7 - phase * .6) * .01;
		points.push(new Vector3(Math.cos(angle) * (.72 + radialWarp), Math.sin(angle) * (.64 + radialWarp * .72), Math.sin(angle * 2 + phase) * .028));
	}
	const curve = new CatmullRomCurve3(points, true, "centripetal", .42);
	const geometry = new TubeGeometry(curve, 96, .052 + variant % 3 * .009, 8, true);
	geometry.computeVertexNormals();
	geometry.userData.performanceProp = "portable-speaker-volumetric-bass-wave";
	geometry.userData.geometryProfile = "closed-irregular-tube";
	geometry.userData.forbiddenPrimitives = [
		"PlaneGeometry",
		"Sprite",
		"Line"
	];
	return geometry;
}
function addInstancedPerforations(kit, parent, material) {
	const positions = [];
	const columns = 22;
	const rows = 23;
	for (let row = 0; row < rows; row += 1) {
		const y = .74 + row * .116;
		for (let column = 0; column < columns; column += 1) {
			const x = -1.18 + column * .112;
			if ((Math.abs(x) < 1.13 || Math.abs(x) < 1.24 && y > .86 && y < 3.17) && !(x > .73 && y < 1.22)) positions.push(new Vector3(x, y, .93));
		}
	}
	const geometry = new CylinderGeometry(.027, .027, .045, 8);
	const holes = new InstancedMesh(geometry, material, positions.length);
	holes.name = "portable-speaker-grille-perforations";
	holes.castShadow = false;
	holes.receiveShadow = true;
	holes.userData.applianceId = kit.options.id;
	holes.userData.part = "grille-perforations";
	holes.userData.instanceCount = positions.length;
	holes.userData.basePositions = positions.map((position) => position.toArray());
	holes.userData.rhythmicDisplacement = "radial-delayed-instance-wave";
	const dummy = new Object3D();
	for (let index = 0; index < positions.length; index += 1) {
		dummy.position.copy(positions[index]);
		dummy.rotation.set(Math.PI * .5, 0, 0);
		dummy.updateMatrix();
		holes.setMatrixAt(index, dummy.matrix);
	}
	holes.instanceMatrix.needsUpdate = true;
	parent.add(holes);
	kit.interactiveMeshes.push(holes);
	kit.nodes.set(holes.name, holes);
	return holes;
}
function tag(mesh, part, relief = false) {
	mesh.userData.part = part;
	if (relief) mesh.userData.explodeWithParent = true;
}
/** Three-view procedural reconstruction of the SAKURA portable speaker. */
function createPortableSpeakerModel(options) {
	const kit = new ApplianceModelKit(options);
	const accent = new Color(options.accent);
	const pink = accent.clone().offsetHSL(0, -.04, .045).getHex();
	const pinkLight = accent.clone().offsetHSL(0, -.08, .14).getHex();
	const pinkDark = accent.clone().offsetHSL(0, .02, -.11).getHex();
	const shellMaterial = kit.material(pink, { tint: 8416120 });
	const shellHighlightMaterial = kit.material(pinkLight, { tint: 9993603 });
	const shellSeamMaterial = kit.material(pinkDark, { tint: 6706015 });
	const creamMaterial = kit.material(16247511, { tint: 10192784 });
	const creamHighlightMaterial = kit.material(16774629, { tint: 11376278 });
	const mintMaterial = kit.material(13692642, { tint: 9812397 });
	const cavityMaterial = kit.material(4932423, { tint: 3748924 });
	const rubberMaterial = kit.material(6906213, { tint: 4341061 });
	const wholeMachinePivot = kit.pivot("portable-speaker-whole-machine-pivot");
	wholeMachinePivot.userData.animationRole = "whole-appliance-root";
	const cabinetPivot = kit.pivot("portable-speaker-cabinet-pivot", wholeMachinePivot);
	const cabinet = kit.mesh("portable-speaker-cabinet-shell", facetedPanelGeometry(3.2, 3.55, 1.45, .24), shellMaterial, cabinetPivot);
	cabinet.position.y = 1.84;
	tag(cabinet, "cabinet-shell");
	const crownHighlight = kit.mesh("portable-speaker-cabinet-crown-highlight", facetedPanelGeometry(2.72, .16, 1.17, .055), shellHighlightMaterial, cabinetPivot, false);
	crownHighlight.position.set(0, 3.48, -.02);
	tag(crownHighlight, "cabinet-shell", true);
	const frontSeam = kit.mesh("portable-speaker-front-fascia-seam", facetedPanelGeometry(2.9, 3.09, .08, .22), shellSeamMaterial, cabinetPivot, false);
	frontSeam.position.set(0, 1.92, .738);
	tag(frontSeam, "front-fascia-seam", true);
	const fasciaPivot = kit.pivot("portable-speaker-front-fascia-pivot", cabinetPivot);
	const fascia = kit.mesh("portable-speaker-front-fascia", facetedPanelGeometry(2.78, 2.97, .13, .2), creamMaterial, fasciaPivot);
	fascia.position.set(0, 1.92, .805);
	tag(fascia, "front-fascia");
	const fasciaInset = kit.mesh("portable-speaker-fascia-inner-inset", facetedPanelGeometry(2.56, 2.76, .07, .16), creamHighlightMaterial, fasciaPivot, false);
	fasciaInset.position.set(0, 1.95, .882);
	tag(fasciaInset, "front-fascia", true);
	const grilleRecess = kit.mesh("portable-speaker-grille-recess-plane", facetedPanelGeometry(2.39, 2.58, .035, .13), creamMaterial, fasciaPivot, false);
	grilleRecess.position.set(0, 1.95, .916);
	tag(grilleRecess, "front-fascia", true);
	const driverPulsePivot = kit.pivot("portable-speaker-driver-pulse-pivot", fasciaPivot);
	driverPulsePivot.position.set(-.22, 1.94, .902);
	driverPulsePivot.userData.animationRole = "speaker-diaphragm";
	driverPulsePivot.userData.travelAxis = [
		0,
		0,
		1
	];
	const grillePerforations = addInstancedPerforations(kit, fasciaPivot, cavityMaterial);
	const powerButtonPivot = kit.pivot("portable-speaker-power-button-pivot", fasciaPivot);
	powerButtonPivot.position.set(1, .91, .94);
	powerButtonPivot.userData.rotationAxis = [
		0,
		0,
		1
	];
	tag(kit.mesh("portable-speaker-power-button-outer-ring", new TorusGeometry(.27, .034, 9, 32), shellSeamMaterial, powerButtonPivot), "power-control");
	const buttonBezel = kit.mesh("portable-speaker-power-button-bezel", new CylinderGeometry(.245, .245, .07, 32), creamHighlightMaterial, powerButtonPivot, false);
	buttonBezel.rotation.x = Math.PI * .5;
	buttonBezel.position.z = .015;
	tag(buttonBezel, "power-control", true);
	const buttonFace = kit.mesh("portable-speaker-power-button-face", new CylinderGeometry(.18, .18, .075, 28), creamMaterial, powerButtonPivot, false);
	buttonFace.rotation.x = Math.PI * .5;
	buttonFace.position.z = .055;
	tag(buttonFace, "power-control", true);
	const powerArc = kit.mesh("portable-speaker-power-glyph-arc", new TorusGeometry(.083, .014, 5, 18, Math.PI * 1.52), shellSeamMaterial, powerButtonPivot, false);
	powerArc.rotation.z = Math.PI * .24;
	powerArc.position.z = .102;
	tag(powerArc, "power-control", true);
	const powerStem = kit.mesh("portable-speaker-power-glyph-stem", rounded(.026, .112, .02, .008), shellSeamMaterial, powerButtonPivot, false);
	powerStem.position.set(0, .055, .105);
	tag(powerStem, "power-control", true);
	const indicator = kit.indicator([
		1,
		.42,
		.944
	], .05);
	indicator.name = "portable-speaker-status-indicator";
	fasciaPivot.add(indicator);
	kit.nodes.set(indicator.name, indicator);
	tag(indicator, "status-indicator");
	const handlePivot = kit.pivot("portable-speaker-handle-pivot", wholeMachinePivot);
	handlePivot.position.y = 2.72;
	handlePivot.userData.rotationAxis = [
		1,
		0,
		0
	];
	tag(kit.mesh("portable-speaker-carry-handle", carryHandleGeometry(), shellMaterial, handlePivot), "carry-handle");
	const handleHighlight = kit.mesh("portable-speaker-handle-crown-highlight", facetedPanelGeometry(1.62, .055, .35, .018), shellHighlightMaterial, handlePivot, false);
	handleHighlight.position.set(0, 2.1, 0);
	tag(handleHighlight, "carry-handle", true);
	[-1, 1].forEach((side, index) => {
		const sideName = side < 0 ? "left" : "right";
		const hingePivot = kit.pivot(`portable-speaker-${sideName}-hinge-pivot`, cabinetPivot);
		hingePivot.position.set(side * 1.65, 2.72, 0);
		hingePivot.userData.rotationAxis = [
			1,
			0,
			0
		];
		kit.socket(`portable-speaker-handle-${sideName}-hinge-socket`, hingePivot, [
			0,
			0,
			0
		]);
		const hingeOuter = kit.mesh(`portable-speaker-${sideName}-hinge-outer-cap`, new CylinderGeometry(.29, .29, .16, 12), shellSeamMaterial, hingePivot);
		hingeOuter.rotation.z = Math.PI * .5;
		tag(hingeOuter, `handle-hinge-${index + 1}`);
		const hingeCream = kit.mesh(`portable-speaker-${sideName}-hinge-cream-cap`, new CylinderGeometry(.235, .235, .19, 12), creamMaterial, hingePivot, false);
		hingeCream.rotation.z = Math.PI * .5;
		hingeCream.position.x = side * .035;
		tag(hingeCream, `handle-hinge-${index + 1}`, true);
		const hingeInset = kit.mesh(`portable-speaker-${sideName}-hinge-center-disc`, new CylinderGeometry(.17, .17, .205, 10), creamHighlightMaterial, hingePivot, false);
		hingeInset.rotation.z = Math.PI * .5;
		hingeInset.position.x = side * .045;
		tag(hingeInset, `handle-hinge-${index + 1}`, true);
		const mintInsert = kit.mesh(`portable-speaker-handle-${sideName}-mint-insert`, facetedPanelGeometry(.045, 1.24, .35, .015), mintMaterial, handlePivot, false);
		mintInsert.position.set(side * 1.73, .69, 0);
		tag(mintInsert, "carry-handle", true);
	});
	const rearPivot = kit.pivot("portable-speaker-rear-service-pivot", cabinetPivot);
	const rearPanel = kit.mesh("portable-speaker-rear-service-panel", facetedPanelGeometry(1.46, .68, .1, .09), creamMaterial, rearPivot);
	rearPanel.position.set(0, .53, -.756);
	tag(rearPanel, "rear-service-panel");
	const rearSlotRim = kit.mesh("portable-speaker-rear-port-rim", facetedPanelGeometry(.48, .1, .035, .028), shellSeamMaterial, rearPivot, false);
	rearSlotRim.position.set(0, .56, -.818);
	tag(rearSlotRim, "rear-service-panel", true);
	const rearSlot = kit.mesh("portable-speaker-rear-horizontal-port", facetedPanelGeometry(.39, .055, .04, .018), cavityMaterial, rearPivot, false);
	rearSlot.position.set(0, .56, -.843);
	tag(rearSlot, "rear-service-panel", true);
	const sharedFootGeometry = facetedPanelGeometry(.46, .13, .58, .045);
	[-1.18, 1.18].forEach((x, index) => {
		const foot = kit.mesh(`portable-speaker-rubber-foot-${index + 1}`, sharedFootGeometry, rubberMaterial, cabinetPivot);
		foot.position.set(x, .04, 0);
		tag(foot, `foot-${index + 1}`);
	});
	kit.socket("portable-speaker-sound-wave-socket", fasciaPivot, [
		-.22,
		1.94,
		1.08
	]);
	kit.socket("portable-speaker-power-cable-socket", rearPivot, [
		0,
		.56,
		-.86
	]);
	kit.socket("portable-speaker-left-connection-socket", kit.root, [
		-1.8325,
		2.49000708,
		1.21299384
	]);
	kit.socket("portable-speaker-right-connection-socket", kit.root, [
		1.8325,
		2.49000708,
		1.21299384
	]);
	kit.socket("portable-speaker-top-connection-socket", kit.root, [
		0,
		5.04001415,
		1.21299384
	]);
	kit.socket("portable-speaker-bottom-connection-socket", kit.root, [
		0,
		-.06,
		1.21299384
	]);
	const bassWaveRoot = kit.pivot("portable-speaker-bass-wave-root");
	bassWaveRoot.position.set(-.22, 1.94, 1.08);
	bassWaveRoot.userData.effectOwner = "PortableSpeakerPerformance";
	bassWaveRoot.userData.emitterSocket = "portable-speaker-sound-wave-socket";
	for (let index = 0; index < 8; index += 1) {
		const material = kit.material(index >= 4 ? 16752829 : 12382172, {
			tint: index >= 4 ? 10837368 : 7318176,
			emissive: index >= 4 ? 16739995 : 7595716,
			transparent: true,
			opacity: 0
		});
		material.depthWrite = false;
		material.emissiveIntensity = 0;
		const wave = new Mesh(bassWaveGeometry(index), material);
		wave.name = `portable-speaker-bass-wave-ring-${index + 1}`;
		wave.visible = false;
		wave.castShadow = false;
		wave.receiveShadow = false;
		wave.frustumCulled = false;
		wave.renderOrder = 6;
		wave.userData.applianceId = options.id;
		wave.userData.part = "sound-wave-effect";
		wave.userData.explodeWithParent = true;
		wave.userData.performanceProp = "volumetric-bass-wave";
		wave.userData.geometryProfile = "closed-irregular-tube";
		wave.userData.forbiddenPrimitives = [
			"PlaneGeometry",
			"Sprite",
			"Line"
		];
		bassWaveRoot.add(wave);
		kit.nodes.set(wave.name, wave);
	}
	applyPortableSpeakerOutlineHierarchy(kit.root);
	const build = kit.finish({
		referencePath: options.referencePath ?? REFERENCE_PATH,
		reconstructed: [
			"slightly-taller-than-wide clipped-corner pink cabinet with broad low-poly side planes",
			"deep three-step cream front fascia and dense 480-instance circular perforation field",
			"lower-right concentric power button, raised power glyph and mint status indicator",
			"thick twelve-sided carry-handle arch with paired three-layer hinge stacks and mint side inserts",
			"clipped cream lower rear service panel with one horizontal recessed port",
			"paired shallow rubber feet, shell seams and satin highlight layers",
			"clean perforated fascia with no exposed translucent driver face plates",
			"independent whole-machine bass root, hidden driver pivot and closed TubeGeometry wave rig",
			"stable main, structure and detail outline tiers with object-space plus/minus eighteen percent variation",
			"four frozen zero-geometry scene-edge cable sockets derived from the archived v1 Box3 fallback"
		],
		inferred: [
			"single full-range driver count, cone profile, suspension compliance and enclosure volume are inferred from common compact-speaker construction",
			"handle hinge mechanism, angular stops and internal cable routing are not visible",
			"rear horizontal slot function and panel depth are ambiguous in the supplied back view",
			"powered diaphragm glow and thick irregular sound-wave tubes are purpose-driven animation cues"
		]
	});
	build.root.userData.referenceDimensions = {
		cabinetWidth: 3.2,
		cabinetHeight: 3.55,
		cabinetDepth: 1.45,
		totalHeight: 4.96,
		fasciaSize: [2.76, 2.95],
		hingeAxisHeight: 2.72,
		grilleInstanceCount: grillePerforations.count
	};
	build.root.userData.activeDuration = PORTABLE_SPEAKER_ACTIVE_DURATION;
	build.root.userData.previewLightingProfile = "sakura-appliance-v2";
	build.root.userData.previewFramingScale = .86;
	build.root.userData.legacyReferencePath = LEGACY_REFERENCE_PATH;
	build.root.userData.portableSpeakerRig = {
		timelineOwner: "AppliancePerformanceSystem",
		performanceModule: "PortableSpeakerPerformance",
		wholeMachineNode: "portable-speaker-whole-machine-pivot",
		driverNode: "portable-speaker-driver-pulse-pivot",
		emitterSocket: "portable-speaker-sound-wave-socket",
		waveRoot: "portable-speaker-bass-wave-root",
		waveCount: 8,
		waveGeometry: "closed-irregular-tube",
		forbiddenFlatEffects: [
			"PlaneGeometry",
			"Sprite",
			"Line"
		]
	};
	build.root.userData.sculptRuntime.colliders = [
		{
			id: "portable-speaker-cabinet",
			type: "box",
			node: "portable-speaker-cabinet-shell"
		},
		{
			id: "portable-speaker-handle",
			type: "box",
			node: "portable-speaker-carry-handle",
			trigger: true
		},
		{
			id: "portable-speaker-power-control",
			type: "cylinder",
			node: "portable-speaker-power-button-face",
			trigger: true
		}
	];
	build.root.userData.sculptRuntime.destructionGroups = [
		{
			id: "cabinet-shell",
			nodes: ["portable-speaker-cabinet-pivot"]
		},
		{
			id: "front-acoustic-assembly",
			nodes: ["portable-speaker-front-fascia-pivot", "portable-speaker-driver-pulse-pivot"]
		},
		{
			id: "carry-handle-assembly",
			nodes: [
				"portable-speaker-handle-pivot",
				"portable-speaker-left-hinge-pivot",
				"portable-speaker-right-hinge-pivot"
			]
		},
		{
			id: "rear-service-assembly",
			nodes: ["portable-speaker-rear-service-pivot"]
		}
	];
	return build;
}
//#endregion
export { portableSpeaker_exports as n, createPortableSpeakerModel as t };

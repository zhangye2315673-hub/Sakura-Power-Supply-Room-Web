import { t as __exportAll } from "./rolldown-runtime-D7D4PA-g.js";
import { A as DodecahedronGeometry, I as ExtrudeGeometry, Ln as Shape, Qn as TubeGeometry, S as CylinderGeometry, Xn as TorusGeometry, Z as LatheGeometry, dr as Vector3, ht as Mesh, p as Color, u as CatmullRomCurve3, ur as Vector2 } from "./three.core-DlTOC7bx.js";
import { i as RoundedBoxGeometry } from "./BufferGeometryUtils-CSuwXBGj.js";
import { a as setHullOutlineStyle, d as ApplianceModelKit } from "./outline-DAm9XhPL.js";
//#region src/appliances/models/smartBin.ts
var smartBin_exports = /* @__PURE__ */ __exportAll({ createSmartBinModel: () => createSmartBinModel });
var REFERENCE_PATH = "E:/AI/codexAI/sakula/arrow-cube/references/intake/smart-bin/front.png";
var ACTIVE_DURATION = 5.2;
var LID_DEPTH = .86;
var OUTLINE = {
	main: .0048,
	structure: .0041,
	detail: .0033,
	variation: .18
};
function accentShift(accent, lightness, saturation = 0) {
	return new Color(accent).offsetHSL(0, saturation, lightness).getHex();
}
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
function applySmartBinOutlineHierarchy(root) {
	const main = /body-(?:front|back|left|right)-wall|bottom-rose-skirt|rose-lid-shell|front-door-facet/;
	const structure = /upper-rose-rail|corner-armor|lid-crown|infrared-sensor-window|rear-handle-recess|lid-hinge-block|foot-/;
	root.traverse((object) => {
		if (!(object instanceof Mesh) || object.userData.isOutline === true) return;
		if ((Array.isArray(object.material) ? object.material : [object.material]).some((material) => material.transparent) || /trash|inner-|sensor-glow/.test(object.name)) {
			object.userData.outlineTier = "excluded";
			object.userData.outlineStable = true;
		}
	});
	root.traverse((object) => {
		if (!(object instanceof Mesh) || object.userData.isOutline !== true) return;
		const source = object.parent?.name ?? object.name;
		const sourceMesh = object.parent instanceof Mesh ? object.parent : null;
		if ((sourceMesh ? Array.isArray(sourceMesh.material) ? sourceMesh.material : [sourceMesh.material] : []).some((material) => material.transparent) || /trash|inner-|sensor-glow/.test(source)) {
			object.visible = false;
			object.userData.outlineTier = "excluded";
			return;
		}
		const tier = main.test(source) ? "main" : structure.test(source) ? "structure" : "detail";
		setHullOutlineStyle(object, {
			thickness: OUTLINE[tier],
			variation: OUTLINE.variation,
			phase: stableOutlinePhase(source)
		});
		object.userData.outlineTier = tier;
		object.userData.outlineStable = true;
		sourceMesh?.userData && (sourceMesh.userData.outlineTier = tier);
	});
}
function chamferedPanelGeometry(width, height, depth, inset) {
	const halfWidth = width * .5;
	const halfHeight = height * .5;
	const shape = new Shape();
	shape.moveTo(-halfWidth + inset, halfHeight);
	shape.lineTo(halfWidth - inset, halfHeight);
	shape.lineTo(halfWidth, halfHeight - inset);
	shape.lineTo(halfWidth, -halfHeight + inset);
	shape.lineTo(halfWidth - inset, -halfHeight);
	shape.lineTo(-halfWidth + inset, -halfHeight);
	shape.lineTo(-halfWidth, -halfHeight + inset);
	shape.lineTo(-halfWidth, halfHeight - inset);
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
var SMART_BIN_TRASH_TYPES = [
	"paper-ball",
	"banana-peel",
	"aluminum-can",
	"plastic-bottle",
	"apple-core",
	"coffee-cup",
	"chip-bag",
	"takeout-box"
];
function addTrashRig(kit, materials) {
	const rig = kit.pivot("smart-bin-trash-rig");
	rig.userData.effectOwner = "smart-bin-model-rig";
	rig.userData.volumetricOnly = true;
	const add = (parent, suffix, geometry, material, position = [
		0,
		0,
		0
	]) => {
		const mesh = kit.mesh(`${parent.name}-${suffix}`, geometry, material, parent, false);
		mesh.position.set(...position);
		mesh.userData.explodeWithParent = true;
		return mesh;
	};
	SMART_BIN_TRASH_TYPES.forEach((type, index) => {
		const item = kit.pivot(`smart-bin-trash-${type}-pivot`, rig);
		item.visible = false;
		item.userData.trashType = type;
		item.userData.flightIndex = index;
		item.userData.performanceOwner = "SmartBinPerformance";
		const material = materials[index % materials.length];
		if (type === "paper-ball") {
			add(item, "crumpled-volume", new DodecahedronGeometry(.18, 1).scale(1.08, .82, .94), material);
			add(item, "fold-ridge", new TorusGeometry(.105, .012, 5, 10, Math.PI * 1.25), materials[1]).rotation.x = .8;
		} else if (type === "banana-peel") {
			add(item, "stem", new CylinderGeometry(.035, .055, .22, 7), materials[2], [
				0,
				.08,
				0
			]);
			for (let lobe = 0; lobe < 3; lobe += 1) {
				const angle = lobe / 3 * Math.PI * 2;
				const curve = new CatmullRomCurve3([
					new Vector3(0, .02, 0),
					new Vector3(Math.cos(angle) * .08, -.05, Math.sin(angle) * .08),
					new Vector3(Math.cos(angle) * .19, -.13, Math.sin(angle) * .19),
					new Vector3(Math.cos(angle) * .25, -.04, Math.sin(angle) * .25)
				]);
				add(item, `curved-lobe-${lobe + 1}`, new TubeGeometry(curve, 10, .038, 6, false), materials[2]);
			}
		} else if (type === "aluminum-can") {
			add(item, "can-body", new CylinderGeometry(.105, .105, .34, 12), material);
			add(item, "top-rim", new TorusGeometry(.086, .012, 5, 12), materials[5], [
				0,
				.17,
				0
			]).rotation.x = Math.PI * .5;
			add(item, "bottom-rim", new TorusGeometry(.086, .012, 5, 12), materials[5], [
				0,
				-.17,
				0
			]).rotation.x = Math.PI * .5;
		} else if (type === "plastic-bottle") {
			const profile = [
				new Vector2(.04, -.25),
				new Vector2(.105, -.22),
				new Vector2(.12, .1),
				new Vector2(.075, .18),
				new Vector2(.048, .29),
				new Vector2(0, .29)
			];
			add(item, "bottle-body", new LatheGeometry(profile, 12), material);
			add(item, "bottle-cap", new CylinderGeometry(.052, .052, .055, 10), materials[3], [
				0,
				.315,
				0
			]);
		} else if (type === "apple-core") {
			add(item, "core-waist", new CylinderGeometry(.075, .075, .27, 8), material);
			add(item, "top-fruit", new DodecahedronGeometry(.125, 0).scale(1.2, .55, 1.05), materials[4], [
				0,
				.14,
				0
			]);
			add(item, "bottom-fruit", new DodecahedronGeometry(.115, 0).scale(1.15, .5, 1), materials[4], [
				0,
				-.14,
				0
			]);
			add(item, "stem", new CylinderGeometry(.018, .025, .13, 6), materials[0], [
				.02,
				.27,
				0
			]);
		} else if (type === "coffee-cup") {
			add(item, "cup-shell", new CylinderGeometry(.13, .105, .31, 12, 1, true), material);
			add(item, "cup-rim", new TorusGeometry(.13, .015, 5, 12), materials[0], [
				0,
				.155,
				0
			]).rotation.x = Math.PI * .5;
			add(item, "cup-lid", new CylinderGeometry(.142, .142, .035, 12), materials[0], [
				0,
				.18,
				0
			]);
		} else if (type === "chip-bag") {
			add(item, "puffed-packet", rounded(.29, .38, .13, .055), material);
			add(item, "top-crimp", new CylinderGeometry(.022, .022, .3, 6), materials[5], [
				0,
				.205,
				0
			]).rotation.z = Math.PI * .5;
			add(item, "bottom-crimp", new CylinderGeometry(.022, .022, .3, 6), materials[5], [
				0,
				-.205,
				0
			]).rotation.z = Math.PI * .5;
		} else {
			add(item, "lower-tray", rounded(.36, .15, .29, .045), material, [
				0,
				-.07,
				0
			]);
			const lid = add(item, "hinged-lid", rounded(.35, .08, .28, .04), materials[0], [
				0,
				.08,
				-.035
			]);
			lid.rotation.x = -.18;
		}
	});
}
/**
* Three-view procedural reconstruction of the SAKURA touchless smart bin.
* Local frame: +Y up, +Z front, floor at Y=0. The rear/underside motor,
* liner electronics and battery are inferred because they are occluded by
* the supplied turn sheet; their runtime sockets remain explicit.
*/
function createSmartBinModel(options) {
	const kit = new ApplianceModelKit(options);
	const rose = accentShift(options.accent, .08, -.08);
	const roseLight = accentShift(options.accent, .19, -.12);
	const roseDark = accentShift(options.accent, -.08, -.02);
	const cream = kit.material(16050133, { tint: 7694971 });
	const roseMaterial = kit.material(rose, { tint: 7625584 });
	const roseLightMaterial = kit.material(roseLight, { tint: 8875388 });
	const roseDarkMaterial = kit.material(roseDark, { tint: 6246502 });
	const creamHighlight = kit.material(16774111, { tint: 9338249 });
	const cavity = kit.material(5982292, { tint: 4405318 });
	const sensorMaterial = kit.material(1578268, {
		tint: 5126989,
		emissive: 0
	});
	const linerMaterial = kit.material(15326928, {
		tint: 7760503,
		transparent: true,
		opacity: .16
	});
	linerMaterial.depthWrite = false;
	const bodyPivot = kit.pivot("smart-bin-body-pivot");
	bodyPivot.position.y = .58;
	const bodyShell = kit.pivot("smart-bin-body-shell", bodyPivot);
	bodyShell.userData.part = "body-shell";
	[
		[
			"front",
			1.62,
			1.04,
			.18,
			0,
			0,
			.33
		],
		[
			"back",
			1.62,
			1.04,
			.18,
			0,
			0,
			-.33
		],
		[
			"left",
			.2,
			1.04,
			.5,
			-.71,
			0,
			0
		],
		[
			"right",
			.2,
			1.04,
			.5,
			.71,
			0,
			0
		]
	].forEach(([name, width, height, depth, x, y, z]) => {
		const wall = kit.mesh(`smart-bin-body-${name}-wall`, rounded(width, height, depth, .085), cream, bodyShell);
		wall.position.set(x, y, z);
		wall.userData.explodeWithParent = true;
	});
	const frontDoor = kit.mesh("smart-bin-front-door-facet", chamferedPanelGeometry(1.34, .72, .012, .105), creamHighlight, bodyPivot);
	frontDoor.position.set(0, -.025, .423);
	frontDoor.userData.part = "front-door-facet";
	const upperRail = kit.pivot("smart-bin-upper-rose-rail", bodyPivot);
	upperRail.userData.explodeWithParent = true;
	[
		[
			"front",
			1.65,
			.2,
			.13,
			0,
			.49,
			.4
		],
		[
			"back",
			1.65,
			.2,
			.13,
			0,
			.49,
			-.4
		],
		[
			"left",
			.13,
			.2,
			.68,
			-.76,
			.49,
			0
		],
		[
			"right",
			.13,
			.2,
			.68,
			.76,
			.49,
			0
		]
	].forEach(([name, width, height, depth, x, y, z]) => {
		const rail = kit.mesh(`smart-bin-upper-rose-rail-${name}`, rounded(width, height, depth, .045), roseMaterial, upperRail);
		rail.position.set(x, y, z);
		rail.userData.explodeWithParent = true;
	});
	const bottomSkirt = kit.mesh("smart-bin-bottom-rose-skirt", rounded(1.64, .23, .86, .085), roseMaterial, bodyPivot);
	bottomSkirt.position.y = -.49;
	bottomSkirt.userData.part = "bottom-skirt";
	const upperSeam = kit.mesh("smart-bin-upper-shell-seam", rounded(1.53, .028, .848, .012), roseDarkMaterial, bodyPivot, false);
	upperSeam.position.y = .37;
	upperSeam.userData.explodeWithParent = true;
	const lowerSeam = kit.mesh("smart-bin-lower-shell-seam", rounded(1.53, .028, .848, .012), roseDarkMaterial, bodyPivot, false);
	lowerSeam.position.y = -.38;
	lowerSeam.userData.explodeWithParent = true;
	const cavityWell = kit.pivot("smart-bin-inner-cavity", bodyPivot);
	cavityWell.userData.part = "inner-cavity";
	cavityWell.userData.openMouth = true;
	cavityWell.userData.depth = .82;
	[
		[
			"front",
			1.26,
			.78,
			.045,
			0,
			.08,
			.25
		],
		[
			"back",
			1.26,
			.78,
			.045,
			0,
			.08,
			-.25
		],
		[
			"left",
			.045,
			.78,
			.5,
			-.61,
			.08,
			0
		],
		[
			"right",
			.045,
			.78,
			.5,
			.61,
			.08,
			0
		]
	].forEach(([name, width, height, depth, x, y, z]) => {
		const wall = kit.mesh(`smart-bin-inner-${name}-wall`, rounded(width, height, depth, .018), linerMaterial, cavityWell, false);
		wall.position.set(x, y, z);
		wall.userData.explodeWithParent = true;
	});
	const cavityFloor = kit.mesh("smart-bin-inner-deep-floor", rounded(1.22, .055, .48, .025), cavity, cavityWell, false);
	cavityFloor.position.y = -.325;
	cavityFloor.userData.depthBelowRim = .82;
	cavityFloor.userData.explodeWithParent = true;
	const lidPivot = kit.pivot("smart-bin-lid-hinge-pivot");
	lidPivot.position.set(0, 1.17, -.43);
	lidPivot.userData.rotationAxis = [
		1,
		0,
		0
	];
	lidPivot.userData.rotationRange = [0, -1.25];
	kit.socket("smart-bin-lid-hinge-axis-socket", lidPivot, [
		0,
		0,
		0
	]);
	kit.socket("smart-bin-lid-inner-panel-socket", lidPivot, [
		0,
		.02,
		.12
	]);
	const lidShell = kit.mesh("smart-bin-rose-lid-shell", rounded(1.57, .13, LID_DEPTH, .065), roseMaterial, lidPivot);
	lidShell.position.set(0, .065, LID_DEPTH * .5);
	lidShell.userData.part = "lid-shell";
	const lidInner = kit.mesh("smart-bin-lid-inner-panel", rounded(1.34, .035, .6, .017), roseLightMaterial, lidPivot, false);
	lidInner.position.set(0, -.008, .43);
	lidInner.userData.explodeWithParent = true;
	const lidInnerShade = kit.mesh("smart-bin-lid-inner-cavity-shade", rounded(1.18, .018, .43, .008), roseDarkMaterial, lidPivot, false);
	lidInnerShade.position.set(0, -.032, .43);
	lidInnerShade.userData.explodeWithParent = true;
	const lidCrown = kit.mesh("smart-bin-lid-crown-facet", chamferedPanelGeometry(1.33, .65, .035, .12), creamHighlight, lidPivot);
	lidCrown.rotation.x = -Math.PI * .5;
	lidCrown.position.set(0, .11, .43);
	lidCrown.userData.part = "lid-crown-facet";
	const hingeGeometry = new CylinderGeometry(.11, .11, .16, 16);
	[-.48, .48].forEach((x, index) => {
		const hinge = kit.mesh(`smart-bin-lid-hinge-block-${index + 1}`, rounded(.18, .17, .16, .04), roseLightMaterial, bodyPivot);
		hinge.position.set(x, .59, -.35);
		hinge.userData.part = `lid-hinge-${index + 1}`;
		const barrel = kit.mesh(`smart-bin-lid-hinge-barrel-${index + 1}`, hingeGeometry, roseDarkMaterial, bodyPivot, false);
		barrel.rotation.z = Math.PI * .5;
		barrel.position.set(x, .59, -.43);
		barrel.userData.explodeWithParent = true;
	});
	const sensor = kit.mesh("smart-bin-infrared-sensor-window", rounded(.27, .085, .042, .035), sensorMaterial, bodyPivot);
	sensor.position.set(0, .49, .455);
	sensor.userData.part = "sensor-window";
	const sensorBezel = kit.mesh("smart-bin-sensor-bezel", chamferedPanelGeometry(.42, .16, .018, .045), roseDarkMaterial, bodyPivot);
	sensorBezel.position.set(0, .49, .441);
	sensorBezel.userData.part = "sensor-bezel";
	sensor.renderOrder = 1;
	const sensorGlow = kit.mesh("smart-bin-sensor-glow-strip", rounded(.11, .018, .012, .008), kit.indicatorMaterial, bodyPivot, false);
	sensorGlow.position.set(0, .492, .48);
	sensorGlow.userData.explodeWithParent = true;
	sensorGlow.visible = false;
	kit.socket("smart-bin-sensor-trigger-socket", bodyPivot, [
		0,
		.49,
		.5
	]);
	const rearHandle = kit.mesh("smart-bin-rear-handle-recess", rounded(.48, .12, .055, .03), cavity, bodyPivot);
	rearHandle.position.set(0, .51, -.455);
	rearHandle.userData.part = "rear-handle-recess";
	const rearHandleLip = kit.mesh("smart-bin-rear-handle-lip", rounded(.43, .035, .035, .012), roseDarkMaterial, bodyPivot, false);
	rearHandleLip.position.set(0, .59, -.46);
	rearHandleLip.userData.explodeWithParent = true;
	const footGeometry = rounded(.25, .12, .24, .035);
	[
		[
			-.58,
			.02,
			.27
		],
		[
			.58,
			.02,
			.27
		],
		[
			-.58,
			.02,
			-.27
		],
		[
			.58,
			.02,
			-.27
		]
	].forEach(([x, y, z], index) => {
		const footPivot = kit.pivot(`smart-bin-foot-pivot-${index + 1}`, bodyPivot);
		footPivot.position.set(x, y - .56, z);
		const foot = kit.mesh(`smart-bin-foot-${index + 1}`, footGeometry, roseMaterial, footPivot, false);
		foot.userData.part = `foot-${index + 1}`;
		const pad = kit.mesh(`smart-bin-foot-pad-${index + 1}`, rounded(.19, .025, .18, .01), roseDarkMaterial, footPivot, false);
		pad.position.y = -.07;
		pad.userData.explodeWithParent = true;
	});
	kit.mesh("smart-bin-power-inlet-inferred", rounded(.23, .14, .05, .025), roseDarkMaterial, bodyPivot).position.set(.56, -.42, -.45);
	const powerCavity = kit.mesh("smart-bin-power-inlet-cavity", rounded(.14, .065, .018, .012), cavity, bodyPivot, false);
	powerCavity.position.set(.56, -.42, -.48);
	powerCavity.userData.explodeWithParent = true;
	kit.socket("smart-bin-power-connection-socket", bodyPivot, [
		.56,
		-.42,
		-.5
	]);
	addTrashRig(kit, [
		cream,
		roseLightMaterial,
		kit.material(15976539, { tint: 9070926 }),
		kit.material(7976892, {
			tint: 4876404,
			transparent: true,
			opacity: .78
		}),
		kit.material(11978091, { tint: 6516818 }),
		kit.material(9609386, { tint: 5857646 }),
		kit.material(15303311, { tint: 7753827 }),
		kit.material(13870447, { tint: 7692365 })
	]);
	const build = kit.finish({
		referencePath: options.referencePath ?? REFERENCE_PATH,
		reconstructed: [
			"faceted cream cabinet with inset octagonal disposal door, Sakura corner armor, upper rail and lower skirt",
			"oversized rear-axis lid with chamfered cream crown, Sakura badge, inset inner panel and paired hinge blocks",
			"genuinely open mouth with four vertical liner walls and a floor recessed 0.82 units below the rim",
			"enlarged layered infrared sensor module, back-view handle recess with faceted grip, four independent feet and seam rails",
			"named inferred rear power inlet and sensor trigger socket for existing plug-in gameplay",
			"eight named volumetric trash props owned by the smart-bin performance rig",
			"three stable object-space outline tiers on solid shell geometry with transparent and animated effect exclusions"
		],
		inferred: [
			"lid motor, battery, inner bag liner fastening and control PCB are hidden behind shell",
			"rear power inlet and handle recess depth are inferred from the back silhouette",
			"hinge axle bearing and underside screw bosses are not visible in supplied views"
		]
	});
	build.root.userData.sculptRuntime.colliders = [
		{
			id: "smart-bin-body",
			type: "box",
			node: "smart-bin-body-pivot"
		},
		{
			id: "smart-bin-lid",
			type: "box",
			node: "smart-bin-rose-lid-shell"
		},
		{
			id: "smart-bin-sensor-trigger",
			type: "box",
			node: "smart-bin-infrared-sensor-window",
			isTrigger: true
		}
	];
	build.root.userData.sculptRuntime.destructionGroups = [
		{
			id: "body-shell",
			nodes: [
				"smart-bin-body-shell",
				"smart-bin-front-door-facet",
				"smart-bin-upper-rose-rail",
				"smart-bin-bottom-rose-skirt",
				"smart-bin-inner-cavity"
			]
		},
		{
			id: "lid-assembly",
			nodes: [
				"smart-bin-lid-hinge-pivot",
				"smart-bin-rose-lid-shell",
				"smart-bin-lid-crown-facet",
				"smart-bin-lid-inner-panel"
			]
		},
		{
			id: "sensor-module",
			nodes: [
				"smart-bin-sensor-bezel",
				"smart-bin-infrared-sensor-window",
				"smart-bin-sensor-glow-strip"
			]
		},
		{
			id: "foot-array",
			nodes: [
				"smart-bin-foot-pivot-1",
				"smart-bin-foot-pivot-2",
				"smart-bin-foot-pivot-3",
				"smart-bin-foot-pivot-4"
			]
		}
	];
	build.root.userData.activeDuration = ACTIVE_DURATION;
	build.root.userData.externalPerformanceCue = {
		type: "smart-bin-owned-volumetric-trash",
		socket: "smart-bin-lid-inner-panel-socket",
		poolSize: 8,
		launchWindow: [.72, 3.24],
		sharedSpectacleEffects: "must-be-disabled-during-integration"
	};
	build.root.userData.outlineContract = {
		main: OUTLINE.main,
		structure: OUTLINE.structure,
		detail: OUTLINE.detail,
		variation: OUTLINE.variation,
		stable: true,
		style: "SAKURA low-poly three-band ink; transparent liner, sensor glow and flying trash excluded"
	};
	build.root.userData.smartBinV2 = {
		geometryLanguage: "faceted-touchless-disposal-totem",
		exaggeration: "identity features enlarged within the archived package",
		referenceStatus: "conditional-fallback-v1-four-view-not-gpt-image-2",
		frozenRuntime: [
			"smart-bin-body-pivot",
			"smart-bin-lid-hinge-pivot",
			"smart-bin-lid-hinge-axis-socket",
			"smart-bin-lid-inner-panel-socket",
			"smart-bin-sensor-trigger-socket",
			"smart-bin-power-connection-socket",
			...SMART_BIN_TRASH_TYPES.map((type) => `smart-bin-trash-${type}-pivot`)
		],
		envelopePolicy: "archived v1 bounds, ground, colliders and animation contacts are authoritative"
	};
	applySmartBinOutlineHierarchy(build.root);
	return build;
}
//#endregion
export { smartBin_exports as n, createSmartBinModel as t };

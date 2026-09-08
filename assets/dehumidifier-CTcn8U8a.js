import { t as __exportAll } from "./rolldown-runtime-D7D4PA-g.js";
import { At as Path, G as IcosahedronGeometry, I as ExtrudeGeometry, J as InstancedMesh, L as Float32BufferAttribute, Ln as Shape, Qn as TubeGeometry, S as CylinderGeometry, Xn as TorusGeometry, Z as LatheGeometry, dr as Vector3, ht as Mesh, mt as Matrix4, o as BufferGeometry, p as Color, u as CatmullRomCurve3, ur as Vector2 } from "./three.core-DlTOC7bx.js";
import { i as RoundedBoxGeometry } from "./BufferGeometryUtils-Bf_-bT2g.js";
import { a as setHullOutlineStyle, d as ApplianceModelKit } from "./outline-Brkgge31.js";
//#region src/appliances/models/dehumidifier.ts
var dehumidifier_exports = /* @__PURE__ */ __exportAll({ createDehumidifierModel: () => createDehumidifierModel });
var REFERENCE_PATH = "references/intake-v2/dehumidifier/views/front.png";
var ACTIVE_DURATION = 5.2;
function stableOutlinePhase(name) {
	let hash = 2166136261;
	for (let index = 0; index < name.length; index += 1) {
		hash ^= name.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return (hash >>> 0) % 1e4 * (Math.PI * 2 / 1e4);
}
function applyDehumidifierOutlineHierarchy(root) {
	const mainSilhouette = /rounded-cream-upper-shell|removable-sakura-water-tank|cream-crown-around-exhaust/;
	const transparentOrEffect = /collected-water|water-level-window-glint|humidity|droplet|mist|wisp/;
	const fineDetail = /status-lens|glint|slat|divider|fan-blade|intake-slot|drain-port-core|power-inlet|foot/;
	root.traverse((object) => {
		if (!(object instanceof Mesh) || object.userData.isOutline !== true) return;
		const parentName = object.parent?.name ?? object.name;
		if (transparentOrEffect.test(parentName)) {
			object.visible = false;
			object.userData.outlineTier = "excluded";
			return;
		}
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
function rounded(width, height, depth, radius, segments = 4) {
	return new RoundedBoxGeometry(width, height, depth, segments, radius);
}
function roundedRectangleRing(width, depth, radius, segmentsPerCorner = 6) {
	const halfWidth = width * .5;
	const halfDepth = depth * .5;
	const cornerRadius = Math.min(radius, halfWidth, halfDepth);
	const centers = [
		[
			halfWidth - cornerRadius,
			halfDepth - cornerRadius,
			0
		],
		[
			-halfWidth + cornerRadius,
			halfDepth - cornerRadius,
			Math.PI * .5
		],
		[
			-halfWidth + cornerRadius,
			-halfDepth + cornerRadius,
			Math.PI
		],
		[
			halfWidth - cornerRadius,
			-halfDepth + cornerRadius,
			Math.PI * 1.5
		]
	];
	const points = [];
	centers.forEach(([cx, cz, startAngle]) => {
		for (let index = 0; index < segmentsPerCorner; index += 1) {
			const angle = startAngle + index / segmentsPerCorner * Math.PI * .5;
			points.push(new Vector2(cx + Math.cos(angle) * cornerRadius, cz + Math.sin(angle) * cornerRadius));
		}
	});
	return points;
}
/**
* Rounded-rectangle loft used instead of stacked boxes. Each horizontal ring
* can taper and shift in Z, while the crown ring can tilt down toward the rear.
*/
function makeRoundedLoft(levels, segmentsPerCorner = 7, capTop = true) {
	const rings = levels.map((level) => roundedRectangleRing(level.width, level.depth, level.radius, segmentsPerCorner));
	const ringSize = rings[0].length;
	const positions = [];
	rings.forEach((ring, levelIndex) => {
		const level = levels[levelIndex];
		ring.forEach((point) => {
			const z = point.y + (level.centerZ ?? 0);
			positions.push(point.x, level.y + (level.slopeZ ?? 0) * point.y, z);
		});
	});
	const bottomCenter = positions.length / 3;
	positions.push(0, levels[0].y, levels[0].centerZ ?? 0);
	const topCenter = positions.length / 3;
	if (capTop) {
		const top = levels.at(-1);
		positions.push(0, top.y, top.centerZ ?? 0);
	}
	const indices = [];
	for (let levelIndex = 0; levelIndex < levels.length - 1; levelIndex += 1) {
		const lower = levelIndex * ringSize;
		const upper = (levelIndex + 1) * ringSize;
		for (let index = 0; index < ringSize; index += 1) {
			const next = (index + 1) % ringSize;
			indices.push(lower + index, upper + index, upper + next);
			indices.push(lower + index, upper + next, lower + next);
		}
	}
	for (let index = 0; index < ringSize; index += 1) {
		const next = (index + 1) % ringSize;
		indices.push(bottomCenter, index, next);
		if (capTop) {
			const topOffset = (levels.length - 1) * ringSize;
			indices.push(topCenter, topOffset + next, topOffset + index);
		}
	}
	const geometry = new BufferGeometry();
	geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
	geometry.setIndex(indices);
	geometry.computeVertexNormals();
	geometry.computeBoundingBox();
	geometry.computeBoundingSphere();
	return geometry;
}
function makeRoundedRectangleFrame(outerWidth, outerDepth, outerRadius, innerWidth, innerDepth, innerRadius, thickness) {
	const outer = roundedRectangleRing(outerWidth, outerDepth, outerRadius, 3);
	const inner = roundedRectangleRing(innerWidth, innerDepth, innerRadius, 3).reverse();
	const shape = new Shape(outer);
	shape.holes.push(new Path(inner));
	const geometry = new ExtrudeGeometry(shape, {
		depth: thickness,
		bevelEnabled: false,
		curveSegments: 1
	});
	geometry.rotateX(Math.PI * .5);
	return geometry;
}
function setPart(mesh, part, relief = false) {
	mesh.userData.part = part;
	if (relief) mesh.userData.explodeWithParent = true;
}
function makeFanBladeGeometry() {
	const shape = new Shape();
	shape.moveTo(.08, -.04);
	shape.bezierCurveTo(.2, -.17, .48, -.17, .56, -.02);
	shape.bezierCurveTo(.44, .09, .22, .12, .08, .04);
	shape.closePath();
	const geometry = new ExtrudeGeometry(shape, {
		depth: .025,
		bevelEnabled: true,
		bevelSize: .012,
		bevelThickness: .012,
		bevelSegments: 2,
		curveSegments: 5
	});
	geometry.rotateX(Math.PI * .5);
	geometry.translate(0, .012, 0);
	return geometry;
}
function makeWaterDropletGeometry() {
	const profile = [
		new Vector2(.055, .29),
		new Vector2(.12, .265),
		new Vector2(.18, .19),
		new Vector2(.2, .07),
		new Vector2(.19, -.08),
		new Vector2(.16, -.19),
		new Vector2(.095, -.265),
		new Vector2(.035, -.29),
		new Vector2(0, -.275)
	];
	const geometry = new LatheGeometry(profile, 16);
	geometry.computeVertexNormals();
	return geometry;
}
function makeMistLobeGeometry(seed) {
	const geometry = new IcosahedronGeometry(.2, 1);
	const position = geometry.getAttribute("position");
	const vertex = new Vector3();
	for (let index = 0; index < position.count; index += 1) {
		vertex.fromBufferAttribute(position, index);
		const warp = .82 + Math.sin(index * 2.17 + seed * 1.93) * .11 + Math.cos(index * .73 + seed * 2.71) * .07;
		vertex.multiplyScalar(warp);
		vertex.x *= 1.08 + seed % 3 * .08;
		vertex.y *= .88 + (seed + 1) % 3 * .07;
		position.setXYZ(index, vertex.x, vertex.y, vertex.z);
	}
	position.needsUpdate = true;
	geometry.computeVertexNormals();
	geometry.computeBoundingSphere();
	return geometry;
}
function makeVaporWispGeometry(seed) {
	const sway = seed % 2 === 0 ? 1 : -1;
	const curve = new CatmullRomCurve3([
		new Vector3(-.16 * sway, -.2, 0),
		new Vector3(.05 * sway, -.08, .055),
		new Vector3(-.06 * sway, .08, -.045),
		new Vector3(.13 * sway, .23, .015)
	]);
	return new TubeGeometry(curve, 8, .035, 6, false);
}
var HUMIDITY_EFFECTS = [
	{
		kind: "droplet",
		start: [
			-2.15,
			.72,
			1.18
		],
		control: [
			-1.66,
			2.08,
			1.28
		],
		target: [
			-.5,
			2.88,
			.2
		],
		spawn: .42,
		capture: 3.9,
		size: .9
	},
	{
		kind: "mist",
		start: [
			2.22,
			1.02,
			1.06
		],
		control: [
			1.78,
			2.32,
			1.18
		],
		target: [
			.5,
			2.88,
			.15
		],
		spawn: .55,
		capture: 4.02,
		size: 1.2
	},
	{
		kind: "wisp",
		start: [
			-1.72,
			2.08,
			1.42
		],
		control: [
			-1.12,
			2.72,
			1.08
		],
		target: [
			-.28,
			2.9,
			.28
		],
		spawn: .64,
		capture: 3.72,
		size: 1.15
	},
	{
		kind: "droplet",
		start: [
			1.58,
			2.42,
			1.46
		],
		control: [
			1.24,
			2.75,
			1.02
		],
		target: [
			.3,
			2.89,
			.24
		],
		spawn: .72,
		capture: 4.08,
		size: .72
	},
	{
		kind: "mist",
		start: [
			-2.36,
			1.62,
			.62
		],
		control: [
			-1.56,
			2.4,
			.7
		],
		target: [
			-.62,
			2.86,
			.22
		],
		spawn: .82,
		capture: 3.88,
		size: .92
	},
	{
		kind: "wisp",
		start: [
			2.38,
			1.78,
			.64
		],
		control: [
			1.5,
			2.53,
			.76
		],
		target: [
			.62,
			2.86,
			.22
		],
		spawn: .9,
		capture: 4.14,
		size: .96
	},
	{
		kind: "droplet",
		start: [
			-1.08,
			.48,
			1.82
		],
		control: [
			-.9,
			1.82,
			1.52
		],
		target: [
			-.14,
			2.9,
			.32
		],
		spawn: 1,
		capture: 3.58,
		size: 1.08
	},
	{
		kind: "mist",
		start: [
			.92,
			.64,
			1.92
		],
		control: [
			1.08,
			1.98,
			1.58
		],
		target: [
			.12,
			2.9,
			.31
		],
		spawn: 1.08,
		capture: 3.96,
		size: 1.05
	},
	{
		kind: "wisp",
		start: [
			-2.02,
			2.72,
			.9
		],
		control: [
			-1.22,
			3.02,
			.76
		],
		target: [
			-.44,
			2.9,
			.12
		],
		spawn: 1.16,
		capture: 4.2,
		size: .84
	},
	{
		kind: "droplet",
		start: [
			2.06,
			2.88,
			.82
		],
		control: [
			1.22,
			3.08,
			.7
		],
		target: [
			.45,
			2.9,
			.12
		],
		spawn: 1.24,
		capture: 4.18,
		size: .88
	},
	{
		kind: "mist",
		start: [
			-.32,
			3.42,
			1.42
		],
		control: [
			-.5,
			3.18,
			.92
		],
		target: [
			-.18,
			2.9,
			.16
		],
		spawn: 1.34,
		capture: 3.84,
		size: .8
	},
	{
		kind: "wisp",
		start: [
			.54,
			3.54,
			1.22
		],
		control: [
			.62,
			3.2,
			.78
		],
		target: [
			.2,
			2.9,
			.14
		],
		spawn: 1.44,
		capture: 4.12,
		size: .86
	},
	{
		kind: "droplet",
		start: [
			-2.46,
			.92,
			.54
		],
		control: [
			-1.5,
			2,
			.74
		],
		target: [
			-.56,
			2.86,
			.22
		],
		spawn: 1.52,
		capture: 4,
		size: .78
	},
	{
		kind: "mist",
		start: [
			2.52,
			.78,
			.58
		],
		control: [
			1.52,
			2.06,
			.72
		],
		target: [
			.56,
			2.86,
			.22
		],
		spawn: 1.62,
		capture: 4.22,
		size: .88
	},
	{
		kind: "wisp",
		start: [
			-1.4,
			1.42,
			1.36
		],
		control: [
			-1.02,
			2.42,
			.94
		],
		target: [
			-.3,
			2.87,
			.24
		],
		spawn: 1.72,
		capture: 4.1,
		size: 1.05
	},
	{
		kind: "droplet",
		start: [
			1.44,
			1.58,
			1.3
		],
		control: [
			.96,
			2.48,
			.88
		],
		target: [
			.34,
			2.87,
			.24
		],
		spawn: 1.82,
		capture: 4.24,
		size: .82
	},
	{
		kind: "mist",
		start: [
			-.86,
			.54,
			1.72
		],
		control: [
			-.64,
			1.96,
			1.1
		],
		target: [
			-.12,
			2.88,
			.24
		],
		spawn: 1.92,
		capture: 4.16,
		size: .96
	},
	{
		kind: "wisp",
		start: [
			.76,
			.68,
			1.82
		],
		control: [
			.68,
			2.02,
			1.12
		],
		target: [
			.14,
			2.88,
			.24
		],
		spawn: 2.02,
		capture: 4.26,
		size: .92
	}
];
var HUMIDITY_CAPTURE_OFFSET = .82;
var HUMIDITY_CAPTURE_STEP = .13;
/**
* Three-view reconstruction of the SAKURA compact compressor dehumidifier.
* Local frame: +Y up, +Z front, floor at Y=0. Exterior proportions, vents,
* tank seam and drain are observed; compressor, evaporator and tank float are
* hidden and deliberately omitted rather than represented as known geometry.
*/
function createDehumidifierModel(options) {
	const kit = new ApplianceModelKit(options);
	const accent = new Color(options.accent);
	const pink = accent.clone().offsetHSL(0, -.055, .07).getHex();
	const pinkLight = accent.clone().offsetHSL(0, -.1, .16).getHex();
	const pinkDark = accent.clone().offsetHSL(0, .015, -.11).getHex();
	const cream = kit.material(16116443, { tint: 8483451 });
	const creamLight = kit.material(16774888, { tint: 10126727 });
	const pinkShell = kit.material(pink, { tint: 9201013 });
	const pinkEdge = kit.material(pinkLight, { tint: 11106434 });
	const pinkShadow = kit.material(pinkDark, { tint: 7164514 });
	const mintDark = kit.material(7245702, { tint: 4218460 });
	const cavity = kit.material(5590608, { tint: 3684415 });
	const water = kit.material(8832975, {
		tint: 6983577,
		transparent: true,
		opacity: .72
	});
	water.depthWrite = false;
	const waterGlint = kit.material(16774888, {
		tint: 10126727,
		transparent: true,
		opacity: .48
	});
	waterGlint.depthWrite = false;
	const dropletMaterial = kit.material(8244701, {
		tint: 5083553,
		transparent: true,
		opacity: .84
	});
	const mistMaterial = kit.material(13889265, {
		tint: 10140871,
		transparent: true,
		opacity: .68
	});
	const wispMaterial = kit.material(11984871, {
		tint: 8300983,
		transparent: true,
		opacity: .74
	});
	const suctionGlow = kit.material(12577531, { emissive: 8183295 });
	suctionGlow.emissiveIntensity = 0;
	kit.indicatorMaterial.emissiveIntensity = 0;
	const wholeMachinePivot = kit.pivot("dehumidifier-whole-machine-pivot");
	wholeMachinePivot.userData.animationRole = "whole-appliance-root";
	const bodyPivot = kit.pivot("dehumidifier-main-body-pivot", wholeMachinePivot);
	setPart(kit.mesh("dehumidifier-rounded-cream-upper-shell", makeRoundedLoft([
		{
			y: 1.17,
			width: 2.08,
			depth: 1.36,
			radius: .16
		},
		{
			y: 1.34,
			width: 2.08,
			depth: 1.36,
			radius: .17
		},
		{
			y: 2.38,
			width: 2.04,
			depth: 1.3,
			radius: .2,
			centerZ: .025
		},
		{
			y: 2.64,
			width: 1.98,
			depth: 1.22,
			radius: .23,
			centerZ: .055
		},
		{
			y: 2.76,
			width: 1.86,
			depth: 1.08,
			radius: .25,
			centerZ: .075,
			slopeZ: -.213
		}
	], 3, false), cream, bodyPivot), "upper-shell");
	const shellHighlight = kit.mesh("dehumidifier-front-upper-shell-highlight", rounded(1.66, .035, .022, .012, 2), creamLight, bodyPivot, false);
	shellHighlight.position.set(-.02, 2.5, .666);
	setPart(shellHighlight, "shell-highlight", true);
	const tankPivot = kit.pivot("dehumidifier-water-tank-slide-pivot", wholeMachinePivot);
	tankPivot.userData.translationAxis = [
		0,
		0,
		1
	];
	tankPivot.userData.translationRange = [0, .58];
	kit.socket("dehumidifier-water-tank-release-socket", tankPivot, [
		0,
		.62,
		.68
	]);
	setPart(kit.mesh("dehumidifier-removable-sakura-water-tank", makeRoundedLoft([
		{
			y: .12,
			width: 1.82,
			depth: 1.14,
			radius: .14,
			centerZ: .015
		},
		{
			y: .18,
			width: 1.96,
			depth: 1.28,
			radius: .18,
			centerZ: .012
		},
		{
			y: .34,
			width: 2.07,
			depth: 1.36,
			radius: .2
		},
		{
			y: .95,
			width: 2.09,
			depth: 1.38,
			radius: .17
		},
		{
			y: 1.16,
			width: 2.08,
			depth: 1.36,
			radius: .15
		}
	], 3), pinkShell, tankPivot), "water-tank");
	const tankTopSeam = kit.mesh("dehumidifier-continuous-tank-seam", rounded(2.045, .024, 1.365, .011, 2), pinkShadow, tankPivot, false);
	tankTopSeam.position.set(0, 1.165, 0);
	setPart(tankTopSeam, "tank-seam", true);
	const levelPivot = kit.pivot("dehumidifier-water-level-window-pivot", tankPivot);
	levelPivot.position.set(0, .63, .692);
	setPart(kit.mesh("dehumidifier-vertical-water-level-frame", rounded(.13, .68, .034, .055, 5), pinkShadow, levelPivot), "water-level-window");
	const levelWell = kit.mesh("dehumidifier-water-level-dark-well", rounded(.082, .6, .026, .034, 4), cavity, levelPivot, false);
	levelWell.position.z = .035;
	setPart(levelWell, "water-level-window", true);
	const waterFill = kit.mesh("dehumidifier-visible-collected-water-column", rounded(.052, .53, .018, .021, 4), water, levelPivot, false);
	waterFill.position.set(0, -.2332, .052);
	waterFill.scale.y = .12;
	waterFill.renderOrder = 4;
	setPart(waterFill, "collected-water", true);
	const levelGlint = kit.mesh("dehumidifier-water-level-window-glint", rounded(.011, .45, .006, .004, 2), waterGlint, levelPivot, false);
	levelGlint.position.set(-.019, .02, .065);
	setPart(levelGlint, "water-level-window", true);
	const crownPivot = kit.pivot("dehumidifier-crown-surface-pivot", wholeMachinePivot);
	crownPivot.position.set(0, 2.76, .075);
	crownPivot.rotation.x = .21;
	const exhaustPivot = kit.pivot("dehumidifier-top-exhaust-pivot", wholeMachinePivot);
	exhaustPivot.position.set(0, 2.707, .075);
	exhaustPivot.rotation.x = .38;
	kit.socket("dehumidifier-dry-air-output-socket", exhaustPivot, [
		0,
		.035,
		0
	]);
	kit.socket("dehumidifier-moisture-intake-socket", exhaustPivot, [
		0,
		.16,
		0
	]);
	setPart(kit.mesh("dehumidifier-cream-crown-around-exhaust", makeRoundedRectangleFrame(1.86, 1.08, .25, 1.75, .61, .2, .035), cream, crownPivot, false), "upper-shell", true);
	const exhaustCavity = kit.mesh("dehumidifier-top-exhaust-dark-cavity", rounded(1.67, .04, .51, .19, 5), cavity, exhaustPivot, false);
	exhaustCavity.position.y = -.035;
	setPart(exhaustCavity, "top-exhaust");
	const exhaustRim = kit.mesh("dehumidifier-mint-top-exhaust-rim", makeRoundedRectangleFrame(1.82, .66, .28, 1.64, .49, .19, .045), suctionGlow, exhaustPivot);
	exhaustRim.position.y = .018;
	setPart(exhaustRim, "top-exhaust", true);
	const fanPivot = kit.pivot("dehumidifier-exhaust-fan-pivot", exhaustPivot);
	fanPivot.position.y = -.055;
	fanPivot.userData.rotationAxis = [
		0,
		1,
		0
	];
	kit.socket("dehumidifier-fan-axis-socket", fanPivot, [
		0,
		0,
		0
	]);
	setPart(kit.mesh("dehumidifier-exhaust-fan-hub", new CylinderGeometry(.15, .15, .045, 18), mintDark, fanPivot, false), "exhaust-fan");
	const bladeGeometry = makeFanBladeGeometry();
	for (let index = 0; index < 6; index += 1) {
		const blade = kit.mesh(`dehumidifier-exhaust-fan-blade-${index + 1}`, bladeGeometry, mintDark, fanPivot, false);
		blade.rotation.y = index * Math.PI / 3;
		setPart(blade, "exhaust-fan");
	}
	const slatCount = 13;
	const grilleSlats = new InstancedMesh(rounded(1.56, .024, .013, .006, 2), mintDark, slatCount);
	grilleSlats.name = "dehumidifier-top-grille-horizontal-slat-array";
	grilleSlats.castShadow = true;
	grilleSlats.receiveShadow = true;
	grilleSlats.userData.applianceId = options.id;
	setPart(grilleSlats, "top-grille-array");
	const slatMatrix = new Matrix4();
	for (let index = 0; index < slatCount; index += 1) {
		slatMatrix.makeTranslation(0, .026, -.22 + index * (.44 / 12));
		grilleSlats.setMatrixAt(index, slatMatrix);
	}
	grilleSlats.instanceMatrix.needsUpdate = true;
	exhaustPivot.add(grilleSlats);
	kit.interactiveMeshes.push(grilleSlats);
	kit.nodes.set(grilleSlats.name, grilleSlats);
	const dividerXs = [
		-.58,
		-.29,
		0,
		.29,
		.58
	];
	const grilleDividers = new InstancedMesh(rounded(.018, .028, .48, .008, 2), mintDark, dividerXs.length);
	grilleDividers.name = "dehumidifier-top-grille-vertical-divider-array";
	grilleDividers.castShadow = true;
	grilleDividers.receiveShadow = true;
	grilleDividers.userData.applianceId = options.id;
	setPart(grilleDividers, "top-grille-array");
	dividerXs.forEach((x, index) => {
		slatMatrix.makeTranslation(x, .028, 0);
		grilleDividers.setMatrixAt(index, slatMatrix);
	});
	grilleDividers.instanceMatrix.needsUpdate = true;
	exhaustPivot.add(grilleDividers);
	kit.interactiveMeshes.push(grilleDividers);
	kit.nodes.set(grilleDividers.name, grilleDividers);
	const controlPivot = kit.pivot("dehumidifier-front-control-button-pivot", wholeMachinePivot);
	controlPivot.position.set(0, 2.03, .712);
	controlPivot.userData.translationAxis = [
		0,
		0,
		-1
	];
	kit.socket("dehumidifier-front-control-socket", controlPivot, [
		0,
		0,
		0
	]);
	const controlRing = kit.mesh("dehumidifier-front-control-shadow-ring", new CylinderGeometry(.2, .2, .07, 12), pinkShadow, controlPivot);
	controlRing.rotation.x = Math.PI * .5;
	setPart(controlRing, "control-button");
	const controlFace = kit.mesh("dehumidifier-front-round-sakura-control", new CylinderGeometry(.164, .164, .075, 12), pinkEdge, controlPivot);
	controlFace.rotation.x = Math.PI * .5;
	controlFace.position.z = .048;
	setPart(controlFace, "control-button", true);
	const controlGlint = kit.mesh("dehumidifier-control-button-glint", new TorusGeometry(.154, .006, 4, 12), creamLight, controlPivot, false);
	controlGlint.position.z = .092;
	setPart(controlGlint, "control-button", true);
	const rearServicePivot = kit.pivot("dehumidifier-rear-service-pivot", wholeMachinePivot);
	rearServicePivot.position.z = -.695;
	const handleWell = kit.mesh("dehumidifier-rear-carry-handle-recess", rounded(.72, .22, .06, .09, 4), cavity, rearServicePivot);
	handleWell.position.y = 2.43;
	setPart(handleWell, "rear-carry-handle");
	const handleInner = kit.mesh("dehumidifier-rear-carry-handle-inner-lip", rounded(.57, .095, .035, .04, 3), creamLight, rearServicePivot, false);
	handleInner.position.set(0, 2.43, -.035);
	setPart(handleInner, "rear-carry-handle", true);
	const intakeFrame = kit.mesh("dehumidifier-rear-air-intake-frame", rounded(1.42, 1.07, .055, .12, 4), creamLight, rearServicePivot);
	intakeFrame.position.y = 1.68;
	setPart(intakeFrame, "rear-air-intake");
	const intakeWell = kit.mesh("dehumidifier-rear-air-intake-dark-well", rounded(1.25, .9, .035, .08, 4), cavity, rearServicePivot, false);
	intakeWell.position.set(0, 1.68, -.035);
	setPart(intakeWell, "rear-air-intake", true);
	const ventGeometry = rounded(.49, .035, .03, .014, 2);
	for (let row = 0; row < 13; row += 1) for (const [column, x] of [[0, -.31], [1, .31]]) {
		const vent = kit.mesh(`dehumidifier-rear-intake-slot-r${row + 1}-c${column + 1}`, ventGeometry, cream, rearServicePivot, false);
		vent.position.set(x, 1.28 + row * .067, -.072);
		setPart(vent, "rear-intake-slot-array");
	}
	const drainPivot = kit.pivot("dehumidifier-rear-drain-port-pivot", rearServicePivot);
	drainPivot.position.set(0, .2, -.03);
	kit.socket("dehumidifier-continuous-drain-hose-socket", drainPivot, [
		0,
		0,
		-.12
	]);
	const drainRing = kit.mesh("dehumidifier-rear-drain-port-ring", new CylinderGeometry(.145, .145, .075, 20), pinkShadow, drainPivot);
	drainRing.rotation.x = Math.PI * .5;
	setPart(drainRing, "rear-drain-port");
	const drainCore = kit.mesh("dehumidifier-rear-drain-port-core", new CylinderGeometry(.075, .075, .095, 18), cavity, drainPivot, false);
	drainCore.rotation.x = Math.PI * .5;
	drainCore.position.z = -.025;
	setPart(drainCore, "rear-drain-port", true);
	const powerInlet = kit.mesh("dehumidifier-inferred-lower-rear-power-inlet", rounded(.25, .15, .055, .035, 3), pinkShadow, rearServicePivot);
	powerInlet.position.set(.72, .23, -.015);
	setPart(powerInlet, "inferred-power-inlet");
	kit.socket("dehumidifier-power-cable-socket", rearServicePivot, [
		.72,
		.23,
		-.1
	]);
	const footGeometry = rounded(.34, .11, .28, .04, 3);
	for (const [x, z, label] of [
		[
			-.75,
			.45,
			"front-left"
		],
		[
			.75,
			.45,
			"front-right"
		],
		[
			-.75,
			-.45,
			"rear-left"
		],
		[
			.75,
			-.45,
			"rear-right"
		]
	]) {
		const foot = kit.mesh(`dehumidifier-foot-${label}`, footGeometry, pinkShadow, bodyPivot, false);
		foot.position.set(x, .07, z);
		setPart(foot, "foot-array");
	}
	const effectField = kit.pivot("dehumidifier-humidity-field-pivot");
	effectField.userData.effectType = "volumetric-humidity-field";
	const dropletGeometry = makeWaterDropletGeometry();
	const mistGeometries = [
		0,
		1,
		2
	].map((seed) => makeMistLobeGeometry(seed));
	HUMIDITY_EFFECTS.forEach((effect, index) => {
		const pivot = kit.pivot(`dehumidifier-humidity-particle-pivot-${index + 1}`, effectField);
		pivot.position.fromArray(effect.start);
		pivot.visible = false;
		pivot.userData.effectKind = effect.kind;
		pivot.userData.trajectoryStart = [...effect.start];
		pivot.userData.trajectoryControl = [...effect.control];
		pivot.userData.trajectoryTarget = [...effect.target];
		pivot.userData.spawnTime = effect.spawn;
		pivot.userData.captureTime = effect.spawn + HUMIDITY_CAPTURE_OFFSET + index * HUMIDITY_CAPTURE_STEP;
		pivot.userData.captureOrder = index;
		pivot.userData.baseSize = effect.size;
		pivot.userData.volumetricEffect = true;
		if (effect.kind === "droplet") {
			const drop = kit.mesh(`dehumidifier-volumetric-water-droplet-${index + 1}`, dropletGeometry, dropletMaterial, pivot, false);
			drop.scale.setScalar(effect.size);
			setPart(drop, "volumetric-humidity-effects");
			return;
		}
		if (effect.kind === "wisp") {
			const wisp = kit.mesh(`dehumidifier-volumetric-vapor-wisp-${index + 1}`, makeVaporWispGeometry(index), wispMaterial, pivot, false);
			wisp.scale.setScalar(effect.size);
			setPart(wisp, "volumetric-humidity-effects");
			return;
		}
		[
			[
				-.15,
				.02,
				.02
			],
			[
				.11,
				.07,
				-.025
			],
			[
				.015,
				-.09,
				.08
			]
		].forEach((offset, lobeIndex) => {
			const lobe = kit.mesh(`dehumidifier-volumetric-mist-lobe-${index + 1}-${lobeIndex + 1}`, mistGeometries[lobeIndex], mistMaterial, pivot, false);
			lobe.position.fromArray(offset);
			lobe.scale.setScalar(effect.size * (.78 + lobeIndex * .12));
			setPart(lobe, "volumetric-humidity-effects");
		});
	});
	const build = kit.finish({
		referencePath: options.referencePath ?? REFERENCE_PATH,
		reconstructed: [
			"continuously tapered rounded cream enclosure sharing its side contour with the Sakura-pink lower water tank",
			"embedded mint rounded-rectangle top exhaust with a true open frame, thirteen dense slats, five dividers and a recessed six-blade fan",
			"shallow flush circular front control, narrow status lens and reference-thin inset vertical water-level window",
			"rear carry-handle recess, framed two-column intake grille, centered lower drain port and four feet",
			"removable-tank pivot plus tank release, dry-air output, drain-hose, fan-axis and power-cable sockets",
			"eighteen opaque/translucent 3D humidity actors built as lathed droplets, irregular low-poly mist lobes and tubular vapor wisps, all curving into the top grille without Plane or Sprite effects",
			"one whole-machine action root shared by shell, tank, crown, controls, rear service panel and feet so squash/stretch never separates the assembly"
		],
		inferred: [
			"compressor, evaporator coil, condenser, internal fan duct, tank float and control electronics are hidden and omitted",
			"the exact top-fan blade profile and depth below the dense exhaust grille are inferred from the visible outlet opening",
			"water behind the narrow level lens is animated conceptually; the opaque tank does not reveal its actual internal level",
			"lower-rear power inlet position is inferred because the turn sheet shows a drain port but no electrical connector",
			"underside fasteners, filter retention clips and the internal carry-handle wall thickness are not visible"
		]
	});
	applyDehumidifierOutlineHierarchy(build.root);
	build.root.userData.referenceDimensions = {
		overallWidth: 2.09,
		overallHeight: 2.79,
		overallDepth: 1.38,
		tankHeight: 1.16,
		topExhaustWidth: 1.82,
		rearIntakeWidth: 1.42
	};
	build.root.userData.activeDuration = ACTIVE_DURATION;
	build.root.userData.visualRevision = {
		id: "dehumidifier-v2",
		style: "SAKURA exaggerated low-poly Toon",
		referenceMode: "admitted-existing-three-view",
		outline: {
			main: .0048,
			structure: .0041,
			detail: .0033,
			variation: .18
		},
		frozenRig: true
	};
	build.root.userData.dehumidifierEffectContract = {
		timelineOwner: "AppliancePerformanceSystem",
		machineMotionRoot: "dehumidifier-whole-machine-pivot",
		suctionSocket: "dehumidifier-moisture-intake-socket",
		particleCount: HUMIDITY_EFFECTS.length,
		captureOrder: {
			mode: "staggered-after-spawn",
			offset: HUMIDITY_CAPTURE_OFFSET,
			step: HUMIDITY_CAPTURE_STEP
		},
		effectGeometry: [
			"LatheGeometry water droplets",
			"irregular IcosahedronGeometry mist lobes",
			"TubeGeometry vapor wisps"
		],
		forbiddenGeometry: ["PlaneGeometry", "Sprite"],
		fanRotationDuringSkill: false
	};
	build.root.userData.sculptRuntime.colliders = [
		{
			id: "dehumidifier-upper-shell",
			type: "box",
			node: "dehumidifier-rounded-cream-upper-shell"
		},
		{
			id: "dehumidifier-water-tank",
			type: "box",
			node: "dehumidifier-water-tank-slide-pivot"
		},
		{
			id: "dehumidifier-top-exhaust-trigger",
			type: "box",
			node: "dehumidifier-top-exhaust-pivot",
			trigger: true
		}
	];
	build.root.userData.sculptRuntime.destructionGroups = [
		{
			id: "dehumidifier-enclosure",
			nodes: [
				"dehumidifier-whole-machine-pivot",
				"dehumidifier-main-body-pivot",
				"dehumidifier-rounded-cream-upper-shell"
			]
		},
		{
			id: "dehumidifier-tank-system",
			nodes: ["dehumidifier-water-tank-slide-pivot", "dehumidifier-water-level-window-pivot"]
		},
		{
			id: "dehumidifier-air-system",
			nodes: ["dehumidifier-top-exhaust-pivot", "dehumidifier-exhaust-fan-pivot"]
		},
		{
			id: "dehumidifier-controls",
			nodes: ["dehumidifier-front-control-button-pivot"]
		},
		{
			id: "dehumidifier-rear-service",
			nodes: ["dehumidifier-rear-service-pivot", "dehumidifier-rear-drain-port-pivot"]
		}
	];
	return build;
}
//#endregion
export { dehumidifier_exports as n, createDehumidifierModel as t };

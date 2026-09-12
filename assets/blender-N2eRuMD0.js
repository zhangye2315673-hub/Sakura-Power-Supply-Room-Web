import { t as __exportAll } from "./rolldown-runtime-D7D4PA-g.js";
import { A as DodecahedronGeometry, G as IcosahedronGeometry, Hn as SphereGeometry, I as ExtrudeGeometry, Jn as TetrahedronGeometry, Ln as Shape, Qn as TubeGeometry, S as CylinderGeometry, Xn as TorusGeometry, Z as LatheGeometry, dr as Vector3, ft as MathUtils, h as ConeGeometry, ht as Mesh, p as Color, u as CatmullRomCurve3, ur as Vector2 } from "./three.core-DlTOC7bx.js";
import { i as RoundedBoxGeometry } from "./BufferGeometryUtils-CtH-hlZf.js";
import { a as setHullOutlineStyle, d as ApplianceModelKit } from "./outline-Cv1Jem2g.js";
//#region src/appliances/models/blender.ts
var blender_exports = /* @__PURE__ */ __exportAll({ createBlenderModel: () => createBlenderModel });
var REFERENCE_PATH = "references/intake-v2/blender/views/front.png";
var ACTIVE_DURATION = 5.2;
function stableOutlinePhase(name) {
	let hash = 2166136261;
	for (let index = 0; index < name.length; index += 1) {
		hash ^= name.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return (hash >>> 0) / 4294967295 * Math.PI * 2;
}
function applyBlenderOutlineHierarchy(root) {
	const mainSilhouette = /pink-lower-motor-base|cream-upper-motor-base|transparent-tapered-jar-shell|cream-closed-loop-handle|domed-pink-lid/;
	const fineDetail = /dial-marker|rear-horizontal-vent|power-inlet-pin|fruit-.*-(leaf|crown)|rubber-foot/;
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
	});
}
function setPart(mesh, part, relief = false) {
	mesh.userData.part = part;
	if (relief) mesh.userData.explodeWithParent = true;
}
function rounded(width, height, depth, radius, segments = 1) {
	return new RoundedBoxGeometry(width, height, depth, segments, radius);
}
function taperedRoundedBox(width, height, depth, topScale, radius) {
	const geometry = rounded(width, height, depth, radius, 2);
	const positions = geometry.attributes.position;
	for (let index = 0; index < positions.count; index += 1) {
		const y = positions.getY(index);
		const normalizedY = MathUtils.clamp(y / height + .5, 0, 1);
		const scale = MathUtils.lerp(1, topScale, normalizedY);
		positions.setX(index, positions.getX(index) * scale);
		positions.setZ(index, positions.getZ(index) * scale);
	}
	positions.needsUpdate = true;
	geometry.computeVertexNormals();
	return geometry;
}
function jarShellGeometry() {
	const points = [
		new Vector2(.94, .02),
		new Vector2(1.01, .11),
		new Vector2(1.09, 1.25),
		new Vector2(1.2, 2.34),
		new Vector2(1.28, 2.5),
		new Vector2(1.28, 2.56),
		new Vector2(1.19, 2.56),
		new Vector2(1.17, 2.43),
		new Vector2(1.02, 1.24),
		new Vector2(.89, .12),
		new Vector2(.88, .05)
	];
	const geometry = new LatheGeometry(points, 12);
	geometry.computeVertexNormals();
	return geometry;
}
function lidGeometry() {
	const points = [
		new Vector2(0, -.09),
		new Vector2(.72, -.1),
		new Vector2(1.29, -.12),
		new Vector2(1.35, -.08),
		new Vector2(1.34, .01),
		new Vector2(1.24, .08),
		new Vector2(.9, .19),
		new Vector2(.42, .27),
		new Vector2(0, .28)
	];
	const geometry = new LatheGeometry(points, 12);
	geometry.computeVertexNormals();
	return geometry;
}
function handleGeometry() {
	const curve = new CatmullRomCurve3([
		new Vector3(1.05, 2.19, -.02),
		new Vector3(1.55, 2.17, -.02),
		new Vector3(1.84, 1.94, -.02),
		new Vector3(1.91024, 1.54, -.02),
		new Vector3(1.91024, .72, -.02),
		new Vector3(1.72, .38, -.02),
		new Vector3(1.12, .18, -.02)
	]);
	return new TubeGeometry(curve, 12, .18, 8, false);
}
function jarRibGeometry() {
	const curve = new CatmullRomCurve3([
		new Vector3(0, .24, .96),
		new Vector3(0, .65, 1),
		new Vector3(0, 1.38, 1.08),
		new Vector3(0, 2.2, 1.17)
	]);
	return new TubeGeometry(curve, 8, .034, 5, false);
}
function bladeGeometry() {
	const shape = new Shape();
	shape.moveTo(.04, -.065);
	shape.lineTo(.72, -.11);
	shape.lineTo(.58, .045);
	shape.lineTo(.04, .065);
	shape.closePath();
	const geometry = new ExtrudeGeometry(shape, {
		depth: .045,
		bevelEnabled: true,
		bevelSize: .012,
		bevelThickness: .01,
		bevelSegments: 1,
		curveSegments: 1
	});
	geometry.rotateX(-Math.PI * .5);
	const positions = geometry.attributes.position;
	for (let index = 0; index < positions.count; index += 1) {
		const x = positions.getX(index);
		positions.setY(index, positions.getY(index) + MathUtils.clamp(x - .2, 0, .55) * .16);
	}
	positions.needsUpdate = true;
	geometry.computeVertexNormals();
	return geometry;
}
function strawberryGeometry() {
	const geometry = new IcosahedronGeometry(.24, 1);
	geometry.scale(.9, 1.18, .9);
	const positions = geometry.attributes.position;
	for (let index = 0; index < positions.count; index += 1) {
		const y = positions.getY(index);
		const taper = MathUtils.lerp(.58, 1, MathUtils.clamp((y + .29) / .55, 0, 1));
		positions.setX(index, positions.getX(index) * taper);
		positions.setZ(index, positions.getZ(index) * taper);
	}
	positions.needsUpdate = true;
	geometry.computeVertexNormals();
	return geometry;
}
function appleGeometry() {
	const geometry = new SphereGeometry(.255, 10, 7);
	const positions = geometry.attributes.position;
	for (let index = 0; index < positions.count; index += 1) {
		const x = positions.getX(index);
		const y = positions.getY(index);
		const z = positions.getZ(index);
		const lobe = 1 + Math.cos(Math.atan2(z, x) * 5) * .035;
		const topDimple = y > .12 ? MathUtils.lerp(1, .82, (y - .12) / .14) : 1;
		positions.setX(index, x * lobe * topDimple);
		positions.setZ(index, z * lobe * topDimple);
		positions.setY(index, y * .94);
	}
	positions.needsUpdate = true;
	geometry.computeVertexNormals();
	return geometry;
}
function bananaGeometry() {
	const curve = new CatmullRomCurve3([
		new Vector3(-.34, .02, 0),
		new Vector3(-.2, -.08, .02),
		new Vector3(0, -.13, 0),
		new Vector3(.22, -.07, -.02),
		new Vector3(.36, .08, 0)
	], false, "centripetal", .45);
	return new TubeGeometry(curve, 12, .105, 6, false);
}
function smoothieSurfaceGeometry() {
	const points = [
		new Vector2(0, -.035),
		new Vector2(.16, -.055),
		new Vector2(.48, -.018),
		new Vector2(.82, .035),
		new Vector2(1.075, .015),
		new Vector2(1.075, -.055),
		new Vector2(0, -.055)
	];
	const geometry = new LatheGeometry(points, 12);
	geometry.computeVertexNormals();
	return geometry;
}
/**
* Procedural reconstruction of the supplied Sakura blender turn sheet.
* Local frame: +Y up, +Z faces the speed dial, floor at Y=0.
*/
function createBlenderModel(options) {
	const kit = new ApplianceModelKit(options);
	const accent = new Color(options.accent);
	const pink = accent.clone().offsetHSL(0, -.045, .04).getHex();
	const pinkLight = accent.clone().offsetHSL(0, -.08, .13).getHex();
	const cream = kit.material(16248284, { tint: 9600646 });
	const creamLight = kit.material(16775146, { tint: 10850198 });
	const pinkShell = kit.material(pink, { tint: 9266803 });
	const pinkEdge = kit.material(pinkLight, { tint: 11040899 });
	const pinkShadow = kit.material(accent.clone().offsetHSL(0, .01, -.11).getHex(), { tint: 7361118 });
	const mint = kit.material(12572880, { tint: 7442321 });
	const cavity = kit.material(5130061, { tint: 3354422 });
	const rubber = kit.material(4801609, { tint: 3091506 });
	const steel = kit.material(6842732, { tint: 3422531 });
	const jarMaterial = kit.material(16052968, {
		tint: 11058112,
		transparent: true,
		opacity: .22
	});
	jarMaterial.depthWrite = false;
	const jarHighlight = kit.material(16776692, {
		tint: 11978954,
		transparent: true,
		opacity: .62
	});
	jarHighlight.depthWrite = false;
	const collarMaterial = kit.material(pinkLight, {
		tint: 10910082,
		transparent: true,
		opacity: .5
	});
	collarMaterial.depthWrite = false;
	const smoothieMaterial = kit.material(16099769, {
		tint: 12087432,
		emissive: 15761572,
		transparent: true,
		opacity: .76
	});
	smoothieMaterial.depthWrite = false;
	const smoothieHighlight = kit.material(16765919, {
		tint: 13074069,
		emissive: 16746925,
		transparent: true,
		opacity: .64
	});
	smoothieHighlight.depthWrite = false;
	const fruitRed = kit.material(15292259, { tint: 9185597 });
	const fruitRedLight = kit.material(16747154, { tint: 11026512 });
	const fruitOrange = kit.material(16096066, { tint: 10898983 });
	const fruitYellow = kit.material(16765788, { tint: 11695656 });
	const fruitGreen = kit.material(7384431, { tint: 3432266 });
	const blueberry = kit.material(5858216, { tint: 3160949 });
	const blueberryBloom = kit.material(11186399, { tint: 6120860 });
	const basePivot = kit.pivot("blender-motor-base-pivot");
	const lowerBase = kit.mesh("blender-pink-lower-motor-base", taperedRoundedBox(3.25, .92, 3.05, .96, .18), pinkShell, basePivot);
	lowerBase.position.y = .58;
	setPart(lowerBase, "lower-base-shell");
	const upperBase = kit.mesh("blender-cream-upper-motor-base", taperedRoundedBox(3.08, .76, 2.88, .9, .14), cream, basePivot);
	upperBase.position.y = 1.37;
	setPart(upperBase, "upper-base-shell");
	const seamBand = kit.mesh("blender-horizontal-base-seam-band", rounded(3.08, .055, 2.88, .025, 2), pinkEdge, basePivot, false);
	seamBand.position.y = 1.01;
	setPart(seamBand, "base-seam-band", true);
	const jarSeatPivot = kit.pivot("blender-jar-seat-pivot");
	jarSeatPivot.position.y = 1.74;
	kit.socket("blender-jar-lock-socket", jarSeatPivot, [
		0,
		.05,
		0
	]);
	setPart(kit.mesh("blender-shallow-pink-jar-seat", new CylinderGeometry(1.01, 1.08, .14, 12), pinkEdge, jarSeatPivot), "jar-seat");
	const jarPivot = kit.pivot("blender-removable-jar-pivot");
	jarPivot.position.y = 1.81;
	jarPivot.userData.translationAxis = [
		0,
		1,
		0
	];
	kit.socket("blender-handle-upper-socket", jarPivot, [
		1.05,
		2.19,
		0
	]);
	kit.socket("blender-handle-lower-socket", jarPivot, [
		1.12,
		.18,
		0
	]);
	kit.socket("blender-lid-seat-socket", jarPivot, [
		0,
		2.56,
		0
	]);
	kit.socket("blender-blade-bearing-socket", jarPivot, [
		0,
		.16,
		0
	]);
	const jar = kit.mesh("blender-transparent-tapered-jar-shell", jarShellGeometry(), jarMaterial, jarPivot, false);
	jar.renderOrder = 5;
	setPart(jar, "jar-shell");
	const upperCollar = kit.mesh("blender-translucent-pink-upper-jar-collar", new CylinderGeometry(1.265, 1.2, .34, 12, 1, true), collarMaterial, jarPivot, false);
	upperCollar.position.y = 2.39;
	upperCollar.renderOrder = 6;
	setPart(upperCollar, "jar-upper-collar");
	const jarRim = kit.mesh("blender-rolled-transparent-jar-rim", new TorusGeometry(1.265, .035, 6, 12), jarHighlight, jarPivot, false);
	jarRim.rotation.x = Math.PI * .5;
	jarRim.position.y = 2.53;
	jarRim.renderOrder = 7;
	setPart(jarRim, "jar-rim", true);
	const ribGeometry = jarRibGeometry();
	for (let index = 0; index < 8; index += 1) {
		const rib = kit.mesh(`blender-molded-jar-rib-${index + 1}`, ribGeometry, jarHighlight, jarPivot, false);
		rib.rotation.y = index * Math.PI / 4 + Math.PI / 8;
		rib.renderOrder = 7;
		setPart(rib, "jar-rib-array", true);
	}
	const coupling = kit.mesh("blender-inferred-dark-blade-coupling-ring", new CylinderGeometry(.31, .38, .12, 12), cavity, jarPivot);
	coupling.position.y = .1;
	setPart(coupling, "coupling-ring");
	const bladePivot = kit.pivot("blender-four-blade-rotation-pivot", jarPivot);
	bladePivot.position.y = .19;
	bladePivot.userData.rotationAxis = [
		0,
		1,
		0
	];
	kit.socket("blender-blade-axis-socket", bladePivot, [
		0,
		0,
		0
	]);
	setPart(kit.mesh("blender-stepped-central-blade-hub", new CylinderGeometry(.21, .26, .2, 10), steel, bladePivot), "blade-hub");
	const sharedBladeGeometry = bladeGeometry();
	for (let index = 0; index < 4; index += 1) {
		const blade = kit.mesh(`blender-canted-metal-blade-${index + 1}`, sharedBladeGeometry, steel, bladePivot);
		blade.rotation.y = index * Math.PI / 2;
		setPart(blade, "blade-array");
	}
	const vortexPivot = kit.pivot("blender-powered-liquid-vortex-pivot", jarPivot);
	vortexPivot.position.y = .23;
	vortexPivot.userData.rotationAxis = [
		0,
		1,
		0
	];
	kit.socket("blender-liquid-effect-socket", vortexPivot, [
		0,
		0,
		0
	]);
	const liquidGeometry = new CylinderGeometry(1.15, .79, 2.18, 12, 2, false);
	liquidGeometry.translate(0, 1.09, 0);
	const liquid = kit.mesh("blender-powered-rising-smoothie-volume", liquidGeometry, smoothieMaterial, vortexPivot, false);
	liquid.renderOrder = 3;
	liquid.visible = false;
	setPart(liquid, "liquid-vortex-pivot");
	const liquidSurface = kit.mesh("blender-powered-smoothie-concave-surface", smoothieSurfaceGeometry(), smoothieHighlight, vortexPivot, false);
	liquidSurface.position.y = 2.17;
	liquidSurface.renderOrder = 4;
	liquidSurface.visible = false;
	setPart(liquidSurface, "liquid-vortex-pivot", true);
	const spiralCurve = new CatmullRomCurve3(Array.from({ length: 28 }, (_, index) => {
		const progress = index / 27;
		const angle = progress * Math.PI * 5.5;
		const radius = MathUtils.lerp(.16, .96, progress);
		return new Vector3(Math.cos(angle) * radius, 2.13 + progress * .075, Math.sin(angle) * radius);
	}), false, "centripetal", .4);
	const spiral = kit.mesh("blender-powered-smoothie-vortex-highlight", new TubeGeometry(spiralCurve, 32, .026, 5, false), smoothieHighlight, vortexPivot, false);
	spiral.visible = false;
	spiral.renderOrder = 4;
	setPart(spiral, "liquid-vortex-pivot", true);
	const splashMouthSocket = kit.socket("blender-splash-mouth-socket", jarPivot, [
		-.98,
		2.52,
		.02
	]);
	splashMouthSocket.userData.direction = [
		-.72,
		.34,
		.16
	];
	const splashRightSocket = kit.socket("blender-splash-right-gap-socket", jarPivot, [
		.98,
		2.52,
		.02
	]);
	splashRightSocket.userData.direction = [
		.72,
		.34,
		.16
	];
	const wholeFruitPivot = kit.pivot("blender-whole-fruit-pivot", jarPivot);
	wholeFruitPivot.userData.jarInteriorRadius = 1.14;
	wholeFruitPivot.userData.jarInteriorTop = 2.34;
	[
		{
			id: "strawberry",
			position: [
				-.38,
				1.27,
				.17
			],
			rotation: [
				.12,
				-.35,
				.22
			],
			scale: 1.42
		},
		{
			id: "apple",
			position: [
				.34,
				1.38,
				-.12
			],
			rotation: [
				-.08,
				.42,
				-.12
			],
			scale: 1.38
		},
		{
			id: "orange",
			position: [
				-.17,
				.8,
				-.32
			],
			rotation: [
				.15,
				.16,
				-.08
			],
			scale: 1.48
		},
		{
			id: "banana",
			position: [
				.14,
				1.02,
				.32
			],
			rotation: [
				.22,
				-.42,
				.32
			],
			scale: 1.28
		}
	].forEach((entry) => {
		const fruitPivot = kit.pivot(`blender-fruit-${entry.id}-pivot`, wholeFruitPivot);
		fruitPivot.position.set(entry.position[0], entry.position[1], entry.position[2]);
		fruitPivot.rotation.set(entry.rotation[0], entry.rotation[1], entry.rotation[2]);
		fruitPivot.scale.setScalar(entry.scale);
		fruitPivot.userData.pileScale = entry.scale;
		if (entry.id === "strawberry") {
			setPart(kit.mesh("blender-fruit-strawberry-body", strawberryGeometry(), fruitRed, fruitPivot), "powered-fruit-assembly");
			for (let leafIndex = 0; leafIndex < 5; leafIndex += 1) {
				const leaf = kit.mesh(`blender-fruit-strawberry-leaf-${leafIndex + 1}`, new ConeGeometry(.075, .2, 6), fruitGreen, fruitPivot, false);
				leaf.position.y = .29;
				leaf.rotation.z = Math.PI * .5;
				leaf.rotation.y = leafIndex * Math.PI * .4;
				setPart(leaf, "powered-fruit-assembly", true);
			}
		} else if (entry.id === "apple") {
			setPart(kit.mesh("blender-fruit-apple-lobed-body", appleGeometry(), fruitRedLight, fruitPivot), "powered-fruit-assembly");
			const stem = kit.mesh("blender-fruit-apple-stem", new CylinderGeometry(.025, .032, .17, 7), cavity, fruitPivot, false);
			stem.position.y = .3;
			stem.rotation.z = -.16;
			setPart(stem, "powered-fruit-assembly", true);
			const leaf = kit.mesh("blender-fruit-apple-leaf", new SphereGeometry(.1, 7, 4), fruitGreen, fruitPivot, false);
			leaf.position.set(.11, .32, 0);
			leaf.scale.set(1.45, .2, .66);
			leaf.rotation.z = -.38;
			setPart(leaf, "powered-fruit-assembly", true);
		} else if (entry.id === "orange") {
			setPart(kit.mesh("blender-fruit-orange-dimpled-body", new IcosahedronGeometry(.265, 1), fruitOrange, fruitPivot), "powered-fruit-assembly");
			const calyx = kit.mesh("blender-fruit-orange-calyx", new CylinderGeometry(.055, .085, .035, 7), fruitGreen, fruitPivot, false);
			calyx.position.y = .27;
			setPart(calyx, "powered-fruit-assembly", true);
		} else {
			setPart(kit.mesh("blender-fruit-banana-curved-body", bananaGeometry(), fruitYellow, fruitPivot), "powered-fruit-assembly");
			for (const [x, y, label] of [[
				-.36,
				.08,
				"left"
			], [
				.37,
				.12,
				"right"
			]]) {
				const cap = kit.mesh(`blender-fruit-banana-${label}-cap`, new SphereGeometry(.11, 7, 4), fruitYellow, fruitPivot, false);
				cap.position.set(x, y, 0);
				setPart(cap, "powered-fruit-assembly", true);
			}
		}
	});
	const berryPivot = kit.pivot("blender-fruit-blueberry-cluster-pivot", wholeFruitPivot);
	berryPivot.position.set(.38, .64, .05);
	berryPivot.scale.setScalar(1.34);
	berryPivot.userData.pileScale = 1.34;
	[
		[
			-.11,
			.06,
			.03
		],
		[
			.1,
			.08,
			-.02
		],
		[
			0,
			.24,
			.04
		]
	].forEach((position, index) => {
		const berry = kit.mesh(`blender-fruit-blueberry-${index + 1}-body`, new DodecahedronGeometry(.135, 0), blueberry, berryPivot);
		berry.position.set(position[0], position[1], position[2]);
		setPart(berry, "powered-fruit-assembly");
		const crown = kit.mesh(`blender-fruit-blueberry-${index + 1}-crown`, new TorusGeometry(.042, .012, 4, 6), blueberryBloom, berryPivot, false);
		crown.position.set(position[0], position[1] + .125, position[2]);
		crown.rotation.x = Math.PI * .5;
		setPart(crown, "powered-fruit-assembly", true);
	});
	const fruitChunkPivot = kit.pivot("blender-cut-fruit-chunk-pivot", jarPivot);
	const chunkMaterials = [
		fruitRed,
		fruitOrange,
		fruitYellow,
		blueberry
	];
	[
		[
			-.54,
			.5,
			.18
		],
		[
			-.25,
			.62,
			-.28
		],
		[
			.06,
			.52,
			.4
		],
		[
			.38,
			.66,
			-.22
		],
		[
			.57,
			.78,
			.12
		],
		[
			-.42,
			.9,
			-.16
		],
		[
			-.05,
			.98,
			.25
		],
		[
			.29,
			1.08,
			-.34
		],
		[
			-.34,
			1.18,
			.35
		],
		[
			.42,
			1.28,
			.18
		],
		[
			-.08,
			1.38,
			-.42
		],
		[
			.18,
			1.5,
			.04
		]
	].forEach((position, index) => {
		const chunk = kit.mesh(`blender-cut-fruit-chunk-${index + 1}`, index % 3 === 0 ? new TetrahedronGeometry(.115, 1) : new DodecahedronGeometry(.1, 0), chunkMaterials[index % chunkMaterials.length], fruitChunkPivot);
		chunk.position.set(position[0], position[1], position[2]);
		chunk.rotation.set(index * .31, index * .57, index * .23);
		chunk.visible = false;
		setPart(chunk, "powered-fruit-chunks");
	});
	const handlePivot = kit.pivot("blender-jar-handle-attachment-pivot", jarPivot);
	setPart(kit.mesh("blender-cream-closed-loop-handle", handleGeometry(), cream, handlePivot), "jar-handle");
	const handleRootGeometry = new SphereGeometry(1, 8, 5);
	for (const [x, y, label] of [[
		1.07,
		2.18,
		"upper"
	], [
		1.13,
		.18,
		"lower"
	]]) {
		const root = kit.mesh(`blender-handle-${label}-embedded-root`, handleRootGeometry, cream, jarPivot);
		root.position.set(x, y, -.02);
		root.scale.set(.25, .22, .24);
		setPart(root, "jar-handle", true);
	}
	const lidPivot = kit.pivot("blender-removable-lid-pivot", jarPivot);
	lidPivot.position.y = 2.58;
	lidPivot.userData.translationAxis = [
		0,
		1,
		0
	];
	setPart(kit.mesh("blender-domed-pink-lid", lidGeometry(), pinkShell, lidPivot), "lid-shell");
	const lidFlange = kit.mesh("blender-thin-projecting-lid-flange", new TorusGeometry(1.34, .045, 6, 12), pinkEdge, lidPivot, false);
	lidFlange.rotation.x = Math.PI * .5;
	lidFlange.position.y = -.075;
	setPart(lidFlange, "lid-flange", true);
	const lidKnob = kit.mesh("blender-low-mint-lid-knob", new CylinderGeometry(.46, .48, .14, 10), mint, lidPivot);
	lidKnob.position.y = .34;
	setPart(lidKnob, "lid-knob");
	const dialPivot = kit.pivot("blender-front-speed-dial-pivot");
	dialPivot.position.set(0, .77, 1.52);
	dialPivot.userData.rotationAxis = [
		0,
		0,
		1
	];
	kit.socket("blender-speed-control-socket", dialPivot, [
		0,
		0,
		0
	]);
	const dial = kit.mesh("blender-large-mint-speed-dial", new CylinderGeometry(.45, .47, .16, 12), mint, dialPivot);
	dial.rotation.x = Math.PI * .5;
	setPart(dial, "speed-dial");
	const dialShadowRing = kit.mesh("blender-speed-dial-dark-rear-ring", new TorusGeometry(.475, .035, 6, 12), pinkShadow, dialPivot, false);
	dialShadowRing.position.z = .105;
	setPart(dialShadowRing, "speed-dial", true);
	const dialFaceRing = kit.mesh("blender-speed-dial-pale-face-ring", new TorusGeometry(.405, .018, 5, 12), creamLight, dialPivot, false);
	dialFaceRing.position.z = .105;
	setPart(dialFaceRing, "speed-dial", true);
	const dialMarker = kit.mesh("blender-vertical-speed-dial-marker", rounded(.045, .2, .035, .018, 2), cavity, dialPivot);
	dialMarker.position.set(0, .13, .125);
	setPart(dialMarker, "dial-marker", true);
	const status = kit.indicator([
		0,
		1.22,
		1.39
	], .055);
	status.name = "blender-small-front-status-indicator";
	status.userData.part = "status-indicator";
	const rearServicePivot = kit.pivot("blender-rear-service-pivot");
	const rearPanel = kit.mesh("blender-shallow-rear-service-panel", rounded(.92, .5, .28, .08, 3), creamLight, rearServicePivot, false);
	rearPanel.position.set(0, 1.34, -1.2);
	setPart(rearPanel, "rear-service-panel", true);
	const ventGeometry = rounded(.62, .045, .025, .02, 2);
	for (let index = 0; index < 5; index += 1) {
		const vent = kit.mesh(`blender-rear-horizontal-vent-slot-${index + 1}`, ventGeometry, cavity, rearServicePivot);
		vent.position.set(0, 1.13 + index * .095, -1.47);
		setPart(vent, "rear-vent-array", true);
	}
	const inletFrame = kit.mesh("blender-rear-power-inlet-frame", rounded(.48, .28, .32, .065, 3), pinkShadow, rearServicePivot);
	inletFrame.position.set(0, .42, -1.33);
	setPart(inletFrame, "rear-power-inlet");
	const inletCore = kit.mesh("blender-rear-power-inlet-dark-core", rounded(.34, .18, .04, .045, 3), cavity, rearServicePivot, false);
	inletCore.position.set(0, .42, -1.488);
	setPart(inletCore, "rear-power-inlet", true);
	for (const [x, label] of [[-.08, "left"], [.08, "right"]]) {
		const pin = kit.mesh(`blender-rear-power-inlet-pin-${label}`, new SphereGeometry(.025, 8, 5), rubber, rearServicePivot, false);
		pin.position.set(x, .42, -1.482);
		setPart(pin, "rear-power-inlet", true);
	}
	kit.socket("blender-power-cable-socket", rearServicePivot, [
		0,
		.42,
		-1.16
	]);
	kit.socket("blender-left-connection-socket", kit.root, [
		-1.64728263,
		2.42,
		1.6975
	]);
	kit.socket("blender-right-connection-socket", kit.root, [
		2.15408197,
		2.42,
		1.6975
	]);
	kit.socket("blender-top-connection-socket", kit.root, [
		.25339967,
		4.835,
		1.6975
	]);
	kit.socket("blender-bottom-connection-socket", kit.root, [
		.25339967,
		.005,
		1.6975
	]);
	const footGeometry = rounded(.48, .12, .38, .055, 3);
	for (const [x, z, label] of [
		[
			-.96,
			.72,
			"front-left"
		],
		[
			.96,
			.72,
			"front-right"
		],
		[
			-.96,
			-.72,
			"rear-left"
		],
		[
			.96,
			-.72,
			"rear-right"
		]
	]) {
		const foot = kit.mesh(`blender-rubber-foot-${label}`, footGeometry, rubber, kit.root, false);
		foot.position.set(x, .1, z);
		setPart(foot, "foot-array");
	}
	applyBlenderOutlineHierarchy(kit.root);
	const build = kit.finish({
		referencePath: options.referencePath ?? REFERENCE_PATH,
		reconstructed: [
			"two-band tapered motor base with broad rounded lower footprint and narrower cream shoulder",
			"true-walled upward-flaring transparent jar with independent removable pivot and four named sockets",
			"eight transparent molded jar ribs, rolled rim, translucent pink upper collar and inferred dark coupling ring",
			"large cream curve-swept handle with visible negative space and embedded upper/lower roots",
			"broad shallow Sakura-pink domed lid with projecting flange and low mint knob",
			"four individually named canted steel blades on a dedicated bearing pivot and stepped hub",
			"layered front mint speed dial with vertical marker, independent status indicator and four separate feet",
			"rear service panel with five horizontal vent slots, framed two-pin inlet and cable socket",
			"five recognizable whole-fruit families with secondary silhouette details plus twelve deterministic cut-fruit chunks constrained inside the jar",
			"powered-use hierarchy with rising Sakura-pink smoothie volume, concave surface, visible spiral flow and a dedicated cup-mouth splash socket"
		],
		inferred: [
			"jar wall thickness and handle-root reinforcement are inferred from the exterior silhouettes",
			"lid seal, jar lock, blade coupling depth, motor and wiring are hidden; only a shallow coupling ring is inferred",
			"the supplied turn-sheet handle projections are not perfectly orthographically consistent; its right-side loop orientation prioritizes the front and side identity views",
			"smoothie volume, ingredient pieces and spiral flow are powered-use cues and are not claimed as geometry present in the empty reference jar"
		]
	});
	build.root.userData.previewLightingProfile = "sakura-appliance-v2";
	build.root.userData.referenceDimensions = {
		overallWidthIncludingHandle: 3.7,
		overallHeight: 4.95,
		overallDepth: 2.72,
		baseWidth: 3.25,
		baseDepth: 3.05,
		baseHeight: 1.75,
		jarTopDiameter: 2.56,
		jarBottomDiameter: 1.88,
		jarHeight: 2.56
	};
	build.root.userData.activeDuration = ACTIVE_DURATION;
	build.root.userData.sculptRuntime.colliders = [
		{
			id: "blender-motor-base",
			type: "box",
			node: "blender-motor-base-pivot"
		},
		{
			id: "blender-jar",
			type: "cylinder",
			node: "blender-removable-jar-pivot"
		},
		{
			id: "blender-handle",
			type: "capsule",
			node: "blender-jar-handle-attachment-pivot"
		},
		{
			id: "blender-blade-trigger",
			type: "cylinder",
			node: "blender-four-blade-rotation-pivot",
			trigger: true
		},
		{
			id: "blender-liquid-effect-trigger",
			type: "cylinder",
			node: "blender-powered-liquid-vortex-pivot",
			trigger: true
		}
	];
	build.root.userData.sculptRuntime.destructionGroups = [
		{
			id: "motor-base",
			nodes: ["blender-motor-base-pivot"]
		},
		{
			id: "vessel-assembly",
			nodes: [
				"blender-jar-seat-pivot",
				"blender-removable-jar-pivot",
				"blender-jar-handle-attachment-pivot"
			]
		},
		{
			id: "blade-and-coupling",
			nodes: ["blender-four-blade-rotation-pivot"]
		},
		{
			id: "lid-assembly",
			nodes: ["blender-removable-lid-pivot"]
		},
		{
			id: "control-system",
			nodes: ["blender-front-speed-dial-pivot"]
		},
		{
			id: "rear-service",
			nodes: ["blender-rear-service-pivot"]
		},
		{
			id: "powered-effects",
			nodes: [
				"blender-powered-liquid-vortex-pivot",
				"blender-whole-fruit-pivot",
				"blender-cut-fruit-chunk-pivot"
			]
		}
	];
	return build;
}
//#endregion
export { createBlenderModel as n, blender_exports as t };

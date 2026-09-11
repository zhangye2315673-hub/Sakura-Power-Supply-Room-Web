import { t as __exportAll } from "./rolldown-runtime-D7D4PA-g.js";
import { G as IcosahedronGeometry, Hn as SphereGeometry, I as ExtrudeGeometry, It as Quaternion, J as InstancedMesh, L as Float32BufferAttribute, Ln as Shape, N as Euler, Rn as ShapeGeometry, S as CylinderGeometry, Xn as TorusGeometry, dr as Vector3, ft as MathUtils, gt as MeshBasicMaterial, ht as Mesh, mt as Matrix4, o as BufferGeometry, p as Color, ur as Vector2 } from "./three.core-DlTOC7bx.js";
import { i as RoundedBoxGeometry, t as mergeGeometries } from "./BufferGeometryUtils-CSuwXBGj.js";
import { a as setHullOutlineStyle, d as ApplianceModelKit } from "./outline-DAm9XhPL.js";
//#region src/appliances/models/desktopComputer.ts
var desktopComputer_exports = /* @__PURE__ */ __exportAll({ createDesktopComputerModel: () => createDesktopComputerModel });
var REFERENCE_PATH = "references/intake-v2/desktop-computer/views/front.png";
function shifted(color, lightness, saturation = -.04) {
	return new Color(color).offsetHSL(0, saturation, lightness).getHex();
}
function stableOutlinePhase(name) {
	let hash = 2166136261;
	for (let index = 0; index < name.length; index += 1) {
		hash ^= name.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return (hash >>> 0) / 4294967295 * Math.PI * 2;
}
function applyDesktopOutlineHierarchy(root) {
	const mainSilhouette = /rounded-monitor-shell|crt-tapered-rear-bell|rounded-tower-shell|rounded-keyboard-shell|cream-mouse-lower-shell|pink-mouse-upper-shell/;
	const fineDetail = /front-io-strip|rear-monitor-mount/;
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
function rounded(width, height, depth, radius, segments = 1) {
	return new RoundedBoxGeometry(width, height, depth, segments, Math.min(radius, width * .48, height * .48, depth * .48));
}
function facetedCrtBell(frontWidth, frontHeight, backWidth, backHeight, depth) {
	const ring = (width, height, z) => {
		const halfWidth = width * .5;
		const halfHeight = height * .5;
		const chamfer = Math.min(width, height) * .13;
		return [
			new Vector3(-halfWidth + chamfer, -halfHeight, z),
			new Vector3(halfWidth - chamfer, -halfHeight, z),
			new Vector3(halfWidth, -halfHeight + chamfer, z),
			new Vector3(halfWidth, halfHeight - chamfer, z),
			new Vector3(halfWidth - chamfer, halfHeight, z),
			new Vector3(-halfWidth + chamfer, halfHeight, z),
			new Vector3(-halfWidth, halfHeight - chamfer, z),
			new Vector3(-halfWidth, -halfHeight + chamfer, z)
		];
	};
	const front = ring(frontWidth, frontHeight, depth * .5);
	const back = ring(backWidth, backHeight, -depth * .5);
	const positions = [];
	const triangle = (a, b, c) => {
		positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
	};
	for (let index = 0; index < front.length; index += 1) {
		const next = (index + 1) % front.length;
		triangle(front[index], back[index], back[next]);
		triangle(front[index], back[next], front[next]);
	}
	const frontCenter = new Vector3(0, 0, depth * .5);
	const backCenter = new Vector3(0, 0, -depth * .5);
	for (let index = 0; index < front.length; index += 1) {
		const next = (index + 1) % front.length;
		triangle(frontCenter, front[index], front[next]);
		triangle(backCenter, back[next], back[index]);
	}
	const geometry = new BufferGeometry();
	geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
	geometry.computeVertexNormals();
	geometry.computeBoundingBox();
	geometry.computeBoundingSphere();
	geometry.userData.topology = "faceted-tapered-crt-bell";
	return geometry;
}
function keyboardWedge(width, frontHeight, rearHeight, depth) {
	const halfWidth = width * .5;
	const halfDepth = depth * .5;
	const chamfer = Math.min(width, depth) * .105;
	const bottomY = -Math.max(frontHeight, rearHeight) * .5;
	const footprint = [
		new Vector2(-halfWidth + chamfer, -halfDepth),
		new Vector2(halfWidth - chamfer, -halfDepth),
		new Vector2(halfWidth, -halfDepth + chamfer),
		new Vector2(halfWidth, halfDepth - chamfer),
		new Vector2(halfWidth - chamfer, halfDepth),
		new Vector2(-halfWidth + chamfer, halfDepth),
		new Vector2(-halfWidth, halfDepth - chamfer),
		new Vector2(-halfWidth, -halfDepth + chamfer)
	];
	const topY = (z) => bottomY + MathUtils.lerp(rearHeight, frontHeight, MathUtils.clamp(z / depth + .5, 0, 1));
	const bottom = footprint.map((point) => new Vector3(point.x, bottomY, point.y));
	const top = footprint.map((point) => new Vector3(point.x, topY(point.y), point.y));
	const positions = [];
	const triangle = (a, b, c) => {
		positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
	};
	for (let index = 0; index < footprint.length; index += 1) {
		const next = (index + 1) % footprint.length;
		triangle(bottom[index], bottom[next], top[next]);
		triangle(bottom[index], top[next], top[index]);
	}
	const bottomCenter = new Vector3(0, bottomY, 0);
	const topCenter = new Vector3(0, topY(0), 0);
	for (let index = 0; index < footprint.length; index += 1) {
		const next = (index + 1) % footprint.length;
		triangle(bottomCenter, bottom[next], bottom[index]);
		triangle(topCenter, top[index], top[next]);
	}
	const geometry = new BufferGeometry();
	geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
	geometry.computeVertexNormals();
	geometry.computeBoundingBox();
	geometry.computeBoundingSphere();
	geometry.userData.topology = "faceted-keyboard-wedge";
	return geometry;
}
function flowerGeometry(radius, depth) {
	const shape = new Shape();
	const steps = 40;
	for (let i = 0; i <= steps; i += 1) {
		const angle = i / steps * Math.PI * 2 + Math.PI * .5;
		const r = radius * (.77 + Math.cos(angle * 5) * .23);
		const x = Math.cos(angle) * r;
		const y = Math.sin(angle) * r;
		if (i === 0) shape.moveTo(x, y);
		else shape.lineTo(x, y);
	}
	shape.closePath();
	const geometry = new ExtrudeGeometry(shape, {
		depth,
		steps: 1,
		bevelEnabled: true,
		bevelSegments: 1,
		bevelSize: depth * .38,
		bevelThickness: depth * .38,
		curveSegments: 6
	});
	geometry.translate(0, 0, -depth * .5);
	geometry.computeVertexNormals();
	return geometry;
}
function cursorGeometry() {
	const shape = new Shape();
	shape.moveTo(0, .2);
	shape.lineTo(0, -.2);
	shape.lineTo(.11, -.08);
	shape.lineTo(.18, -.23);
	shape.lineTo(.25, -.19);
	shape.lineTo(.17, -.04);
	shape.lineTo(.31, -.03);
	shape.closePath();
	return new ShapeGeometry(shape, 4);
}
function addInstanced(kit, name, geometry, material, parent, matrices, part) {
	const mesh = new InstancedMesh(geometry, material, matrices.length);
	mesh.name = name;
	mesh.castShadow = true;
	mesh.receiveShadow = true;
	mesh.userData.applianceId = kit.options.id;
	mesh.userData.part = part;
	matrices.forEach((matrix, index) => mesh.setMatrixAt(index, matrix));
	mesh.instanceMatrix.needsUpdate = true;
	parent.add(mesh);
	kit.interactiveMeshes.push(mesh);
	kit.nodes.set(name, mesh);
	return mesh;
}
function matrix(position, rotation = new Euler(), scale = new Vector3(1, 1, 1)) {
	return new Matrix4().compose(position, new Quaternion().setFromEuler(rotation), scale);
}
function irregularSmokeGeometry(variant) {
	const phase = variant * 1.137;
	const lobes = Array.from({ length: 4 + variant % 3 }, (_, index) => {
		const angle = phase + index * 2.18;
		const radius = .16 + (variant + index * 2) % 4 * .028;
		return new IcosahedronGeometry(radius, index % 2 === 0 ? 1 : 0).scale(.84 + index * .055, .9 + index % 3 * .12, .78 + (index + variant) % 3 * .1).translate(Math.cos(angle) * (.09 + index * .018), index * .105, Math.sin(angle) * (.075 + index * .014));
	});
	const normalized = lobes.map((lobe) => lobe.index ? lobe.toNonIndexed() : lobe);
	const geometry = mergeGeometries(normalized, false);
	normalized.forEach((lobe) => lobe.dispose());
	lobes.forEach((lobe, index) => {
		if (lobe !== normalized[index]) lobe.dispose();
	});
	if (!geometry) throw new Error("Unable to create desktop computer smoke volume.");
	geometry.computeVertexNormals();
	geometry.userData.performanceProp = "desktop-computer-irregular-volumetric-smoke";
	geometry.userData.variant = variant;
	geometry.userData.forbiddenPrimitives = [
		"PlaneGeometry",
		"Sprite",
		"Line"
	];
	return geometry;
}
function createDesktopComputerModel(options) {
	const kit = new ApplianceModelKit(options);
	const pink = shifted(options.accent, -.03, .03);
	const pinkLight = shifted(options.accent, .13, -.09);
	const pinkDark = shifted(options.accent, -.11, -.01);
	const cream = kit.material(15982531, { tint: 7695234 });
	const creamHighlight = kit.material(16772563, { tint: 8549769 });
	const pinkMaterial = kit.material(pink, { tint: 7758970 });
	const pinkLightMaterial = kit.material(pinkLight, { tint: 8416638 });
	const pinkDarkMaterial = kit.material(pinkDark, { tint: 6706791 });
	const cavity = kit.material(5721945, { tint: 4012355 });
	const screenOff = new MeshBasicMaterial({
		color: 3157820,
		toneMapped: false
	});
	kit.materials.add(screenOff);
	const screenBlue = kit.material(8111324, {
		tint: 5467275,
		emissive: 7067122
	});
	const screenLight = kit.material(14678263, {
		tint: 7504284,
		emissive: 12976127
	});
	const screenPink = kit.material(pinkLight, {
		tint: 8416638,
		emissive: 16755397
	});
	const blueScreenMaterial = kit.material(1529784, {
		tint: 1195132,
		emissive: 1794774
	});
	const blueScreenText = kit.material(16054271, {
		tint: 12174550,
		emissive: 15397631
	});
	const rubber = kit.material(10385020, { tint: 5589848 });
	screenBlue.emissiveIntensity = 0;
	screenLight.emissiveIntensity = 0;
	screenPink.emissiveIntensity = 0;
	const monitorPivot = kit.pivot("desktop-computer-monitor-assembly-pivot");
	monitorPivot.position.set(-1.7, 0, 0);
	const standPivot = kit.pivot("desktop-computer-monitor-stand-pivot", monitorPivot);
	const standBaseLower = kit.mesh("desktop-computer-monitor-base-lower", rounded(3.24, .38, 2.18, .17), cream, standPivot);
	standBaseLower.position.set(0, .3, -.34);
	standBaseLower.userData.part = "monitor-stand-base";
	const standBasePink = kit.mesh("desktop-computer-monitor-base-pink-step", rounded(3, .19, 1.94, .09), pinkMaterial, standPivot, false);
	standBasePink.position.set(0, .5, -.34);
	standBasePink.userData.explodeWithParent = true;
	const columnPivot = kit.pivot("desktop-computer-monitor-column-pivot", standPivot);
	columnPivot.position.set(0, .5, -.58);
	columnPivot.rotation.x = -.06;
	columnPivot.userData.rotationAxis = [
		1,
		0,
		0
	];
	kit.socket("desktop-computer-monitor-hinge-socket", columnPivot, [
		0,
		1,
		0
	]);
	const column = kit.mesh("desktop-computer-leaning-pink-column", rounded(1.42, 1.1, 1.24, .18), pinkMaterial, columnPivot);
	column.position.y = .52;
	column.userData.part = "monitor-stand-column";
	const columnInset = kit.mesh("desktop-computer-column-cream-inset", rounded(1.08, .72, .16, .07), creamHighlight, columnPivot, false);
	columnInset.position.set(0, .52, -.66);
	columnInset.userData.explodeWithParent = true;
	const screenTiltPivot = kit.pivot("desktop-computer-screen-tilt-pivot", monitorPivot);
	screenTiltPivot.position.set(0, 3, .12);
	screenTiltPivot.userData.rotationAxis = [
		1,
		0,
		0
	];
	const monitorShell = kit.mesh("desktop-computer-rounded-monitor-shell", rounded(5.72, 3.5, .62, .22), cream, screenTiltPivot);
	monitorShell.position.z = -.08;
	monitorShell.userData.part = "monitor-shell";
	const rearShellHighlight = kit.mesh("desktop-computer-monitor-rear-highlight", rounded(5.15, 3.12, 1.58, .34), creamHighlight, screenTiltPivot);
	rearShellHighlight.position.z = -.91;
	rearShellHighlight.userData.part = "monitor-crt-belly";
	const crtBell = kit.mesh("desktop-computer-crt-tapered-rear-bell", facetedCrtBell(4.38, 2.66, 3.68, 2.12, 1.42), cream, screenTiltPivot);
	crtBell.position.z = -2.18;
	crtBell.userData.part = "monitor-crt-rear-bell";
	const crtRearCap = kit.mesh("desktop-computer-crt-rear-service-cap", rounded(3.64, 2.14, .34, .16), pinkLightMaterial, screenTiltPivot);
	crtRearCap.position.z = -3.02;
	crtRearCap.userData.part = "monitor-crt-rear-cap";
	for (let index = 0; index < 9; index += 1) {
		const topVent = kit.mesh(`desktop-computer-crt-top-vent-${index + 1}`, rounded(.16, .065, .92, .025), cavity, screenTiltPivot, false);
		topVent.position.set(-1.45 + index * .36, 1.59, -1.42);
		topVent.rotation.x = -.03;
		topVent.userData.part = "monitor-crt-top-vents";
	}
	[-1, 1].forEach((side) => {
		for (let index = 0; index < 6; index += 1) {
			const sideVent = kit.mesh(`desktop-computer-crt-side-${side < 0 ? "left" : "right"}-vent-${index + 1}`, rounded(.07, .13, .7, .025), cavity, screenTiltPivot, false);
			sideVent.position.set(side * 2.48, .57 - index * .23, -1.45);
			sideVent.rotation.z = side * .025;
			sideVent.userData.part = "monitor-crt-side-vents";
		}
	});
	const bezelDepth = .17;
	const topBezel = kit.mesh("desktop-computer-monitor-bezel-top", rounded(5.45, .34, bezelDepth, .1), creamHighlight, screenTiltPivot);
	topBezel.position.set(0, 1.56, .29);
	topBezel.userData.part = "monitor-bezel";
	const bottomBezel = kit.mesh("desktop-computer-monitor-bezel-bottom", rounded(5.45, .34, bezelDepth, .1), creamHighlight, screenTiltPivot, false);
	bottomBezel.position.set(0, -1.54, .29);
	bottomBezel.userData.explodeWithParent = true;
	[-1, 1].forEach((side, i) => {
		const rail = kit.mesh(`desktop-computer-monitor-bezel-side-${i + 1}`, rounded(.34, 3.08, bezelDepth, .1), creamHighlight, screenTiltPivot, false);
		rail.position.set(side * 2.59, 0, .29);
		rail.userData.explodeWithParent = true;
	});
	const screen = kit.mesh("desktop-computer-recessed-screen-glass", rounded(5.12, 2.96, .07, .11), screenOff, screenTiltPivot, false);
	screen.position.z = .295;
	screen.userData.part = "screen-panel";
	[
		[
			"top",
			5.22,
			.14,
			0,
			1.48
		],
		[
			"bottom",
			5.22,
			.14,
			0,
			-1.48
		],
		[
			"left",
			.14,
			2.88,
			-2.51,
			0
		],
		[
			"right",
			.14,
			2.88,
			2.51,
			0
		]
	].forEach(([part, width, height, x, y]) => {
		const frame = kit.mesh(`desktop-computer-monitor-inner-frame-${part}`, rounded(width, height, .055, .035), cavity, screenTiltPivot, false);
		frame.position.set(x, y, .34);
		frame.userData.part = "monitor-inner-frame";
	});
	const monitorStatus = kit.mesh("desktop-computer-monitor-status-dot", new SphereGeometry(.035, 10, 7), kit.indicatorMaterial, screenTiltPivot, false);
	monitorStatus.position.set(0, -1.55, .4);
	monitorStatus.userData.explodeWithParent = true;
	const rearMount = kit.mesh("desktop-computer-pink-rear-monitor-mount", rounded(1.38, 1.32, .25, .13), pinkMaterial, screenTiltPivot);
	rearMount.position.set(0, -.64, -3.21);
	rearMount.userData.part = "monitor-mount-plate";
	const monitorEmblem = kit.mesh("desktop-computer-monitor-flower-emblem", flowerGeometry(.28, .055), pinkMaterial, screenTiltPivot, false);
	monitorEmblem.position.set(0, .43, -3.205);
	monitorEmblem.rotation.y = Math.PI;
	monitorEmblem.userData.part = "monitor-rear-emblem";
	const monitorEmblemCenter = kit.mesh("desktop-computer-monitor-emblem-center", new SphereGeometry(.065, 12, 8), creamHighlight, screenTiltPivot, false);
	monitorEmblemCenter.position.set(0, .43, -3.25);
	monitorEmblemCenter.userData.explodeWithParent = true;
	const screenStatePivot = kit.pivot("desktop-computer-screen-state-pivot", screenTiltPivot);
	screenStatePivot.position.z = .342;
	const desktopBackground = kit.mesh("desktop-computer-desktop-background", rounded(4.94, 2.78, .014, .08), screenBlue, screenStatePivot, false);
	desktopBackground.userData.part = "screen-gui-layer";
	const taskbar = kit.mesh("desktop-computer-screen-taskbar", rounded(4.7, .18, .017, .04), screenPink, screenStatePivot, false);
	taskbar.position.set(0, -1.22, .014);
	taskbar.userData.explodeWithParent = true;
	const mainWindowPivot = kit.pivot("desktop-computer-main-window-pivot", screenStatePivot);
	mainWindowPivot.position.set(-.65, .12, .025);
	const mainWindow = kit.mesh("desktop-computer-main-window", rounded(2.8, 1.63, .018, .1), screenLight, mainWindowPivot, false);
	mainWindow.userData.part = "screen-main-window";
	const windowHeader = kit.mesh("desktop-computer-main-window-header", rounded(2.62, .2, .02, .05), screenPink, mainWindowPivot, false);
	windowHeader.position.set(0, .61, .018);
	windowHeader.userData.explodeWithParent = true;
	const sidebar = kit.mesh("desktop-computer-main-window-sidebar", rounded(.42, 1.13, .02, .05), screenBlue, mainWindowPivot, false);
	sidebar.position.set(-1, -.04, .02);
	sidebar.scale.set(.95, .95, 1);
	sidebar.userData.explodeWithParent = true;
	const secondaryWindowPivot = kit.pivot("desktop-computer-secondary-window-pivot", screenStatePivot);
	secondaryWindowPivot.position.set(1.4, .42, .04);
	const secondaryWindow = kit.mesh("desktop-computer-secondary-window", rounded(1.42, .98, .018, .08), screenPink, secondaryWindowPivot, false);
	secondaryWindow.userData.part = "screen-secondary-window";
	const cursorPivot = kit.pivot("desktop-computer-screen-cursor-pivot", screenStatePivot);
	const cursor = kit.mesh("desktop-computer-screen-cursor", cursorGeometry(), screenLight, cursorPivot, false);
	cursor.position.z = .07;
	cursor.scale.setScalar(.65);
	cursor.userData.part = "screen-cursor";
	const bootPivot = kit.pivot("desktop-computer-boot-logo-pivot", screenStatePivot);
	const bootLogo = kit.mesh("desktop-computer-boot-flower-logo", flowerGeometry(.42, .018), screenPink, bootPivot, false);
	bootLogo.position.z = .06;
	bootLogo.userData.part = "screen-boot-logo";
	const blueScreenPivot = kit.pivot("desktop-computer-classic-blue-screen-pivot", screenStatePivot);
	const blueScreenPanel = kit.mesh("desktop-computer-classic-blue-screen-panel", rounded(4.9, 2.65, .035, .06), blueScreenMaterial, blueScreenPivot, false);
	blueScreenPanel.position.z = .075;
	[
		2.7,
		3.8,
		2.2,
		4.25,
		3.15
	].forEach((width, index) => {
		kit.mesh(`desktop-computer-blue-screen-text-line-${index + 1}`, rounded(width, index === 0 ? .13 : .08, .02, .02), blueScreenText, blueScreenPivot, false).position.set(-.3 + (width - 3) * .08, .72 - index * .34, .1);
	});
	blueScreenPivot.visible = false;
	const towerPivot = kit.pivot("desktop-computer-tower-assembly-pivot");
	towerPivot.position.set(3.65, 0, -.72);
	const towerShell = kit.mesh("desktop-computer-rounded-tower-shell", rounded(2.72, 5, 3.02, .25), cream, towerPivot);
	towerShell.position.y = 2.68;
	towerShell.userData.part = "tower-shell";
	const towerFront = kit.mesh("desktop-computer-tower-front-highlight", rounded(2.38, 4.57, .13, .18), creamHighlight, towerPivot, false);
	towerFront.position.set(0, 2.66, 1.51);
	towerFront.userData.explodeWithParent = true;
	const topCap = kit.mesh("desktop-computer-pink-tower-top-cap", rounded(2.82, .38, 3.08, .2), pinkMaterial, towerPivot);
	topCap.position.set(0, 5.05, 0);
	topCap.userData.part = "tower-top-cap";
	const topSmokeVentMatrices = [
		-2,
		-1,
		0,
		1,
		2
	].flatMap((x) => [
		-2,
		-1,
		0,
		1,
		2
	].map((z) => matrix(new Vector3(.3 + x * .16, 5.255, z * .16))));
	addInstanced(kit, "desktop-computer-tower-top-smoke-vent-grid", new CylinderGeometry(.055, .055, .045, 8), cavity, towerPivot, topSmokeVentMatrices, "tower-top-smoke-vent");
	const sideSeam = kit.mesh("desktop-computer-tower-side-panel-seam", rounded(.035, 4.18, .045, .012), pinkDarkMaterial, towerPivot, false);
	sideSeam.position.set(1.375, 2.63, .38);
	sideSeam.userData.part = "tower-side-seam";
	const towerEmblem = kit.mesh("desktop-computer-tower-flower-emblem", flowerGeometry(.27, .06), pinkMaterial, towerPivot, false);
	towerEmblem.position.set(.23, 3.85, 1.59);
	towerEmblem.userData.part = "tower-front-emblem";
	const towerEmblemCenter = kit.mesh("desktop-computer-tower-emblem-center", new SphereGeometry(.06, 12, 8), creamHighlight, towerPivot, false);
	towerEmblemCenter.position.set(.23, 3.85, 1.63);
	towerEmblemCenter.userData.explodeWithParent = true;
	const frontIoPivot = kit.pivot("desktop-computer-front-io-pivot", towerPivot);
	frontIoPivot.position.set(.79, 2.35, 1.56);
	const frontIo = kit.mesh("desktop-computer-pink-front-io-strip", rounded(.58, 2.02, .12, .12), pinkMaterial, frontIoPivot);
	frontIo.userData.part = "tower-front-io";
	const powerButtonPivot = kit.pivot("desktop-computer-power-button-pivot", frontIoPivot);
	powerButtonPivot.position.set(0, .65, .09);
	powerButtonPivot.userData.rotationAxis = [
		0,
		0,
		1
	];
	const powerRing = kit.mesh("desktop-computer-power-button-ring", new TorusGeometry(.17, .035, 10, 24), creamHighlight, powerButtonPivot, false);
	powerRing.userData.part = "tower-front-controls";
	const powerButton = kit.mesh("desktop-computer-power-button", new CylinderGeometry(.12, .12, .07, 24), pinkLightMaterial, powerButtonPivot, false);
	powerButton.rotation.x = Math.PI * .5;
	powerButton.position.z = .015;
	powerButton.userData.explodeWithParent = true;
	const powerMark = kit.mesh("desktop-computer-power-mark", rounded(.025, .1, .025, .008), cavity, powerButtonPivot, false);
	powerMark.position.set(0, .015, .075);
	powerMark.userData.explodeWithParent = true;
	const powerLed = kit.mesh("desktop-computer-power-led", new SphereGeometry(.045, 10, 7), kit.indicatorMaterial, frontIoPivot, false);
	powerLed.position.set(0, .22, .12);
	powerLed.userData.explodeWithParent = true;
	const usbGeometry = rounded(.25, .12, .07, .025);
	[0, -.31].forEach((y, i) => {
		const usb = kit.mesh(`desktop-computer-front-usb-port-${i + 1}`, usbGeometry, cavity, frontIoPivot, false);
		usb.position.set(0, -.18 + y, .12);
		usb.userData.part = `front-usb-port-${i + 1}`;
	});
	const sideVentMatrices = [];
	for (let row = 0; row < 8; row += 1) for (let col = 0; col < 6; col += 1) sideVentMatrices.push(matrix(new Vector3(1.385, 1.4 + row * .18, -.92 + col * .18), new Euler(0, 0, Math.PI * .5)));
	addInstanced(kit, "desktop-computer-side-vent-grid", new CylinderGeometry(.045, .045, .075, 8), cavity, towerPivot, sideVentMatrices, "tower-side-vents");
	kit.socket("desktop-computer-top-vent-socket", towerPivot, [
		.3,
		5.28,
		0
	]);
	const rearPanel = kit.mesh("desktop-computer-pink-rear-panel", rounded(2.34, 4.34, .11, .16), pinkMaterial, towerPivot);
	rearPanel.position.set(0, 2.68, -1.54);
	rearPanel.userData.part = "tower-rear-panel";
	const rearCreamInset = kit.mesh("desktop-computer-rear-cream-io-inset", rounded(.65, 3.05, .07, .1), creamHighlight, towerPivot, false);
	rearCreamInset.position.set(-.73, 3.02, -1.615);
	rearCreamInset.userData.explodeWithParent = true;
	const rearVentMatrices = [];
	for (let row = 0; row < 10; row += 1) for (let col = 0; col < 5; col += 1) rearVentMatrices.push(matrix(new Vector3(-.68 + col * .13, 3.28 + row * .15, -1.615), new Euler(Math.PI * .5, 0, 0)));
	for (let row = 0; row < 11; row += 1) for (let col = 0; col < 8; col += 1) rearVentMatrices.push(matrix(new Vector3(.18 + col * .15, 3.2 + row * .16, -1.615), new Euler(Math.PI * .5, 0, 0)));
	addInstanced(kit, "desktop-computer-rear-vent-fields", new CylinderGeometry(.04, .04, .07, 8), cavity, towerPivot, rearVentMatrices, "tower-rear-vents");
	const rearIoPivot = kit.pivot("desktop-computer-rear-io-pivot", towerPivot);
	rearIoPivot.position.set(-.72, 2.45, -1.62);
	const rearAudio = kit.mesh("desktop-computer-rear-audio-port", new CylinderGeometry(.065, .065, .06, 14), cavity, rearIoPivot, false);
	rearAudio.rotation.x = Math.PI * .5;
	rearAudio.position.set(0, .31, 0);
	rearAudio.userData.part = "tower-rear-io";
	[
		-.02,
		-.29,
		-.56
	].forEach((y, i) => {
		const port = kit.mesh(`desktop-computer-rear-io-port-${i + 1}`, rounded(i === 2 ? .3 : .25, .13, .07, .025), cavity, rearIoPivot, false);
		port.position.set(0, y, 0);
		port.userData.part = `rear-io-port-${i + 1}`;
	});
	const servicePanel = kit.mesh("desktop-computer-rear-service-panel", rounded(.85, .34, .08, .07), pinkLightMaterial, towerPivot, false);
	servicePanel.position.set(-.52, 1.05, -1.62);
	servicePanel.userData.part = "tower-service-panel";
	const powerInletFrame = kit.mesh("desktop-computer-rear-power-inlet-frame", rounded(.58, .42, .09, .08), cavity, towerPivot, false);
	powerInletFrame.position.set(.74, 1.04, -1.63);
	powerInletFrame.userData.part = "tower-power-inlet";
	const powerInlet = kit.mesh("desktop-computer-rear-power-inlet", rounded(.37, .24, .05, .04), pinkDarkMaterial, towerPivot, false);
	powerInlet.position.set(.74, 1.04, -1.69);
	powerInlet.userData.explodeWithParent = true;
	addInstanced(kit, "desktop-computer-four-tower-feet", rounded(.42, .22, .52, .08), rubber, towerPivot, [-1, 1].flatMap((x) => [-1, 1].map((z) => matrix(new Vector3(x * .94, .13, z * 1.08)))), "tower-feet");
	const keyboardPivot = kit.pivot("desktop-computer-keyboard-assembly-pivot");
	keyboardPivot.position.set(-1.75, 0, 2.2);
	const keyboardShell = kit.mesh("desktop-computer-rounded-keyboard-shell", keyboardWedge(5.35, .42, .68, 1.72), cream, keyboardPivot);
	keyboardShell.position.y = .36;
	keyboardShell.userData.part = "keyboard-shell";
	const keyboardLip = kit.mesh("desktop-computer-keyboard-front-lip", rounded(5.08, .19, .22, .08), creamHighlight, keyboardPivot, false);
	keyboardLip.position.set(0, .37, .81);
	keyboardLip.userData.explodeWithParent = true;
	const keyDeck = kit.mesh("desktop-computer-pink-keyboard-deck", rounded(5.02, .16, 1.46, .1), pinkLightMaterial, keyboardPivot, false);
	keyDeck.position.set(0, .61, -.05);
	keyDeck.userData.part = "keyboard-deck";
	const keybedPivot = kit.pivot("desktop-computer-keybed-pivot", keyboardPivot);
	const keyGeometry = rounded(.29, .22, .25, .035, 1);
	const pinkKeyMatrices = [];
	const creamKeyMatrices = [];
	const rowCounts = [
		14,
		14,
		13,
		12,
		11,
		9
	];
	const activeKeyCells = [
		[1, 4],
		[1, 8],
		[2, 3],
		[2, 7],
		[3, 5],
		[4, 6]
	];
	const activeKeyIds = new Set(activeKeyCells.map(([row, col]) => `${row}:${col}`));
	rowCounts.forEach((count, row) => {
		const z = -.62 + row * .235;
		const spacing = .355;
		const startX = -(count - 1) * spacing * .5;
		for (let col = 0; col < count; col += 1) {
			if (activeKeyIds.has(`${row}:${col}`)) continue;
			if (row === 5 && col >= 3 && col <= 5) continue;
			(row === 0 || col === 0 || col === count - 1 || row === 5 && col > 5 ? pinkKeyMatrices : creamKeyMatrices).push(matrix(new Vector3(startX + col * spacing, .77 + row * .008, z)));
		}
	});
	addInstanced(kit, "desktop-computer-cream-keycap-field", keyGeometry, creamHighlight, keybedPivot, creamKeyMatrices, "keyboard-row-system");
	addInstanced(kit, "desktop-computer-pink-keycap-field", keyGeometry, pinkMaterial, keybedPivot, pinkKeyMatrices, "keyboard-row-system");
	activeKeyCells.forEach(([row, col], index) => {
		const count = rowCounts[row];
		const spacing = .355;
		const pivot = kit.pivot(`desktop-computer-active-key-${index + 1}-pivot`, keybedPivot);
		pivot.position.set(-(count - 1) * spacing * .5 + col * spacing, .77 + row * .008, -.62 + row * .235);
		pivot.userData.baseY = pivot.position.y;
		const activeKey = kit.mesh(`desktop-computer-active-input-key-${index + 1}`, keyGeometry, creamHighlight, pivot, false);
		activeKey.userData.part = `keyboard-active-key-${index + 1}`;
	});
	const spacebarPivot = kit.pivot("desktop-computer-spacebar-pivot", keybedPivot);
	spacebarPivot.position.set(-.1, .8, .555);
	const spacebar = kit.mesh("desktop-computer-long-pink-spacebar", rounded(1.82, .22, .27, .05), pinkMaterial, spacebarPivot, false);
	spacebar.userData.part = "keyboard-spacebar";
	const mousePivot = kit.pivot("desktop-computer-mouse-assembly-pivot");
	mousePivot.position.set(2.55, 0, 2.55);
	mousePivot.rotation.y = Math.PI;
	const mouseLower = kit.mesh("desktop-computer-cream-mouse-lower-shell", rounded(1.42, .42, 1.72, .28), cream, mousePivot);
	mouseLower.position.y = .29;
	mouseLower.userData.part = "mouse-shell";
	const mouseTop = kit.mesh("desktop-computer-pink-mouse-upper-shell", new SphereGeometry(.75, 12, 8, 0, Math.PI * 2, 0, Math.PI * .52), pinkMaterial, mousePivot);
	mouseTop.scale.set(.93, .8, 1.12);
	mouseTop.position.set(0, .31, .02);
	mouseTop.userData.part = "mouse-top-shell";
	const mouseButtonPivot = kit.pivot("desktop-computer-mouse-button-pivot", mousePivot);
	mouseButtonPivot.position.set(0, .76, .44);
	mouseButtonPivot.userData.rotationAxis = [
		1,
		0,
		0
	];
	[-1, 1].forEach((side, i) => {
		const button = kit.mesh(`desktop-computer-mouse-button-${i + 1}`, rounded(.6, .1, .68, .08), pinkLightMaterial, mouseButtonPivot, false);
		button.position.set(side * .29, 0, 0);
		button.rotation.x = -.085;
		button.rotation.z = -side * .075;
		button.userData.part = `mouse-button-${i + 1}`;
	});
	const mouseWheelPivot = kit.pivot("desktop-computer-mouse-wheel-pivot", mouseButtonPivot);
	mouseWheelPivot.position.set(0, .08, -.05);
	mouseWheelPivot.userData.rotationAxis = [
		1,
		0,
		0
	];
	const mouseWheel = kit.mesh("desktop-computer-mouse-wheel", new CylinderGeometry(.11, .11, .17, 10), cavity, mouseWheelPivot, false);
	mouseWheel.rotation.z = Math.PI * .5;
	mouseWheel.userData.part = "mouse-wheel";
	kit.socket("desktop-computer-monitor-power-socket", monitorPivot, [
		2.65,
		2.2,
		-.24
	]);
	kit.socket("desktop-computer-monitor-display-socket", monitorPivot, [
		1.9,
		2.2,
		-.24
	]);
	kit.socket("desktop-computer-tower-power-socket", towerPivot, [
		.75,
		1.05,
		-1.64
	]);
	kit.socket("desktop-computer-keyboard-link-socket", keyboardPivot, [
		2.55,
		.35,
		-.72
	]);
	kit.socket("desktop-computer-mouse-link-socket", mousePivot, [
		0,
		.25,
		.8
	]);
	kit.socket("desktop-computer-screen-effect-socket", screenStatePivot, [
		0,
		0,
		.08
	]);
	kit.socket("desktop-computer-left-connection-socket", kit.root, [
		-4.595,
		3.0208085,
		3.445
	]);
	kit.socket("desktop-computer-right-connection-socket", kit.root, [
		5.1075,
		3.0208085,
		3.445
	]);
	kit.socket("desktop-computer-top-connection-socket", kit.root, [
		.25625005,
		6.056617,
		3.445
	]);
	kit.socket("desktop-computer-bottom-connection-socket", kit.root, [
		.25625005,
		-.015,
		3.445
	]);
	const smokePivot = kit.pivot("desktop-computer-overheat-smoke-pivot", towerPivot);
	smokePivot.position.set(.3, 5.26, 0);
	for (let index = 0; index < 10; index += 1) {
		const material = kit.material(index % 3 === 0 ? 7892856 : index % 3 === 1 ? 9274251 : 6643561, {
			tint: 5130324,
			transparent: true,
			opacity: 0
		});
		material.depthWrite = false;
		const puff = new Mesh(irregularSmokeGeometry(index), material);
		puff.name = `desktop-computer-volumetric-smoke-puff-${index + 1}`;
		puff.visible = false;
		puff.castShadow = true;
		puff.userData.applianceId = options.id;
		puff.userData.part = "desktop-computer-volumetric-smoke";
		puff.userData.performanceProp = "irregular-low-poly-smoke-cluster";
		puff.userData.forbiddenPrimitives = [
			"PlaneGeometry",
			"Sprite",
			"Line"
		];
		smokePivot.add(puff);
		kit.nodes.set(puff.name, puff);
	}
	screenStatePivot.visible = false;
	bootPivot.visible = false;
	mainWindowPivot.scale.setScalar(.001);
	secondaryWindowPivot.scale.setScalar(.001);
	cursorPivot.visible = false;
	applyDesktopOutlineHierarchy(kit.root);
	const build = kit.finish({
		referencePath: options.referencePath ?? REFERENCE_PATH,
		reconstructed: [
			"wide cream CRT monitor with a preserved recessed screen and a deep stepped rear tube enclosure",
			"squat load-bearing CRT neck, broad two-stage base, rear service cap and thick rounded front collar",
			"top and side monitor ventilation slots distributed across the deep CRT enclosure",
			"rounded cream tower with pink top cap, front flower badge, vertical power/USB panel and four feet",
			"side and rear ventilation fields without the removed fan prop, rear I/O column, service panel and IEC-like inlet",
			"rounded keyboard shell with pink deck, six rows of independent two-tone keycaps and long pink spacebar",
			"cream lower mouse shell, pink arched upper shell, two buttons and independent wheel pivot",
			"independent screen GUI layers, boot emblem, windows and cursor for a purpose-readable powered state",
			"ten reusable irregular multi-lobed low-poly smoke volumes bound to the tower top vent"
		],
		inferred: [
			"motherboard, graphics card, CPU cooler, power supply and internal cable routing are hidden and omitted",
			"exact CRT tube geometry is hidden; the deep narrowing enclosure is based on period side and rear references",
			"monitor hinge bearings, cable tunnel and pitch stops are hidden; the squat support pivot is inferred",
			"keyboard switches, PCB, underside feet and exact matrix are hidden; visible key rows are approximated",
			"mouse sensor, microswitches and underside glides are hidden and omitted",
			"rear socket protocols are not asserted; only visible port silhouettes and placement are reconstructed"
		]
	});
	build.root.userData.referenceDimensions = {
		totalWidth: 9.8,
		totalHeight: 5.12,
		totalDepth: 6.8,
		monitorOuter: [
			5.72,
			3.5,
			3.35
		],
		towerOuter: [
			2.72,
			5,
			3.02
		],
		keyboardOuter: [
			5.35,
			.54,
			1.72
		],
		mouseOuter: [
			1.42,
			.78,
			1.72
		]
	};
	build.root.userData.previewLightingProfile = "sakura-appliance-v2";
	build.root.userData.sculptRuntime.colliders = [
		{
			id: "desktop-computer-monitor",
			type: "compound-box",
			node: "desktop-computer-screen-tilt-pivot"
		},
		{
			id: "desktop-computer-stand",
			type: "compound-box",
			node: "desktop-computer-monitor-stand-pivot"
		},
		{
			id: "desktop-computer-tower",
			type: "box",
			node: "desktop-computer-rounded-tower-shell"
		},
		{
			id: "desktop-computer-keyboard",
			type: "box",
			node: "desktop-computer-rounded-keyboard-shell"
		},
		{
			id: "desktop-computer-mouse",
			type: "ellipsoid",
			node: "desktop-computer-cream-mouse-lower-shell"
		}
	];
	build.root.userData.sculptRuntime.destructionGroups = [
		[
			"desktop-computer-rounded-monitor-shell",
			"desktop-computer-monitor-rear-highlight",
			"desktop-computer-crt-tapered-rear-bell",
			"desktop-computer-crt-rear-service-cap",
			"desktop-computer-recessed-screen-glass"
		],
		["desktop-computer-monitor-base-lower", "desktop-computer-leaning-pink-column"],
		[
			"desktop-computer-rounded-tower-shell",
			"desktop-computer-pink-tower-top-cap",
			"desktop-computer-pink-front-io-strip",
			"desktop-computer-pink-rear-panel"
		],
		[
			"desktop-computer-rounded-keyboard-shell",
			"desktop-computer-cream-keycap-field",
			"desktop-computer-pink-keycap-field",
			"desktop-computer-long-pink-spacebar"
		],
		[
			"desktop-computer-cream-mouse-lower-shell",
			"desktop-computer-pink-mouse-upper-shell",
			"desktop-computer-mouse-wheel"
		]
	];
	return build;
}
//#endregion
export { desktopComputer_exports as n, createDesktopComputerModel as t };

import { t as __exportAll } from "./rolldown-runtime-D7D4PA-g.js";
import { Hn as SphereGeometry, I as ExtrudeGeometry, Ln as Shape, S as CylinderGeometry, Xn as TorusGeometry, ft as MathUtils, h as ConeGeometry, ht as Mesh, i as BoxGeometry, p as Color } from "./three.core-DlTOC7bx.js";
import { c as ensureRobotVacuumPerformanceRig } from "./BufferGeometryUtils-CSuwXBGj.js";
import { a as setHullOutlineStyle, d as ApplianceModelKit } from "./outline-DAm9XhPL.js";
//#region src/appliances/models/robotVacuum.ts
var robotVacuum_exports = /* @__PURE__ */ __exportAll({ createRobotVacuumModel: () => createRobotVacuumModel });
var V2_REFERENCE_PATH = "references/intake-v2/robot-vacuum/views/front.png";
function stableOutlinePhase(name) {
	let hash = 2166136261;
	for (let index = 0; index < name.length; index += 1) {
		hash ^= name.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return (hash >>> 0) % 1e4 * (Math.PI * 2 / 1e4);
}
function applyRobotVacuumOutlineHierarchy(root) {
	const mainSilhouette = /lower-chassis|lower-rubber-skirt|cream-top-rim|large-accent-top-cover|front-semicircle-bumper|raised-lidar-tower/;
	const fineDetail = /button|glyph|status-ring|window|charging-contact|wheel-tread|brush-fin|bristle|fastener|cliff-sensor/;
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
var REFERENCE_PATH = "D:/下载文件/ChatGPT Image 2026年8月2日 20_03_03 (4).png";
function shade(accent, lightness, saturation = 0) {
	return new Color(accent).offsetHSL(0, saturation, lightness).getHex();
}
/**
* Builds a solid annular sector in the XZ plane with Y thickness.  A sector is
* used instead of a flattened box so the bumper and sensor band keep the
* circular silhouette from elevated three-quarter views.
*/
function annularSectorGeometry(innerRadius, outerRadius, startAngle, endAngle, height, segments = 12) {
	const shape = new Shape();
	for (let index = 0; index <= segments; index += 1) {
		const angle = MathUtils.lerp(startAngle, endAngle, index / segments);
		const x = Math.cos(angle) * outerRadius;
		const y = Math.sin(angle) * outerRadius;
		if (index === 0) shape.moveTo(x, y);
		else shape.lineTo(x, y);
	}
	for (let index = segments; index >= 0; index -= 1) {
		const angle = MathUtils.lerp(startAngle, endAngle, index / segments);
		shape.lineTo(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius);
	}
	shape.closePath();
	const geometry = new ExtrudeGeometry(shape, {
		depth: height,
		steps: 1,
		bevelEnabled: true,
		bevelSegments: 1,
		bevelSize: .012,
		bevelThickness: .008,
		curveSegments: 2
	});
	geometry.translate(0, 0, -height * .5);
	geometry.rotateX(-Math.PI * .5);
	geometry.computeVertexNormals();
	return geometry;
}
function addHorizontalRing(kit, name, radius, tube, y, material, parent, outlined = false) {
	const ring = kit.mesh(name, new TorusGeometry(radius, tube, 5, 12), material, parent, outlined);
	ring.rotation.x = Math.PI * .5;
	ring.position.y = y;
	return ring;
}
/**
* Procedural reconstruction of the supplied top / low-side / underside robot
* vacuum sheet. Local frame: +Y up, +Z front. The model intentionally remains
* a horizontal low disc; the elevated gameplay/gallery camera is responsible
* for revealing the top identity features.
*/
function createRobotVacuumModel(options) {
	const kit = new ApplianceModelKit(options);
	const cream = kit.material(16051938, { tint: 7826304 });
	const creamLight = kit.material(16775403, { tint: 8155270 });
	const accent = kit.material(options.accent, { tint: 7167863 });
	const accentLight = kit.material(shade(options.accent, .14, -.06), { tint: 7759743 });
	const accentDark = kit.material(shade(options.accent, -.14), { tint: 5589856 });
	const sensor = kit.material(4145484, { tint: 3420735 });
	const rubber = kit.material(5657695, { tint: 4209993 });
	const metal = kit.material(10921130, { tint: 7170164 });
	const brush = kit.material(3749956, { tint: 3157305 });
	const statusRingMaterial = kit.material(shade(options.accent, .2, .04), {
		tint: 7956351,
		emissive: shade(options.accent, .12)
	});
	statusRingMaterial.emissiveIntensity = 0;
	const motionPivot = kit.pivot("robot-vacuum-motion-pivot");
	const chassisPivot = kit.pivot("robot-vacuum-chassis-pivot", motionPivot);
	kit.socket("robot-vacuum-chassis-socket", chassisPivot, [
		0,
		.3,
		0
	]);
	kit.socket("robot-vacuum-left-connection-socket", chassisPivot, [
		-.96,
		.34,
		0
	]);
	kit.socket("robot-vacuum-right-connection-socket", chassisPivot, [
		.96,
		.34,
		0
	]);
	const lowerChassis = kit.mesh("robot-vacuum-lower-chassis", new CylinderGeometry(.91, .96, .31, 12), cream, chassisPivot);
	lowerChassis.position.y = .28;
	lowerChassis.userData.part = "lower-chassis";
	const lowerSkirt = kit.mesh("robot-vacuum-lower-rubber-skirt", new CylinderGeometry(.89, .92, .075, 12), rubber, chassisPivot);
	lowerSkirt.position.y = .105;
	lowerSkirt.userData.part = "lower-skirt";
	const topAssembly = kit.pivot("robot-vacuum-top-assembly-pivot", chassisPivot);
	topAssembly.position.y = .41;
	kit.socket("robot-vacuum-top-assembly-socket", topAssembly, [
		0,
		0,
		0
	]);
	const topRim = kit.mesh("robot-vacuum-cream-top-rim", new CylinderGeometry(.89, .93, .12, 12), creamLight, topAssembly);
	topRim.position.y = .015;
	topRim.userData.part = "top-rim";
	const topCover = kit.mesh("robot-vacuum-large-accent-top-cover", new CylinderGeometry(.81, .865, .085, 12), accentLight, topAssembly);
	topCover.position.y = .09;
	topCover.userData.part = "top-cover";
	addHorizontalRing(kit, "robot-vacuum-top-cover-seam", .855, .018, .105, accentDark, topAssembly).userData.explodeWithParent = true;
	const bumperPivot = kit.pivot("robot-vacuum-front-bumper-pivot", chassisPivot);
	bumperPivot.position.y = .315;
	bumperPivot.userData.translationAxis = [
		0,
		0,
		1
	];
	bumperPivot.userData.translationRange = [-.025, .01];
	kit.socket("robot-vacuum-bumper-socket", bumperPivot, [
		0,
		0,
		.93
	]);
	const frontBumper = kit.mesh("robot-vacuum-front-semicircle-bumper", annularSectorGeometry(.79, .985, Math.PI, Math.PI * 2, .22), cream, bumperPivot);
	frontBumper.userData.part = "front-bumper";
	const sensorBand = kit.mesh("robot-vacuum-front-black-sensor-band", annularSectorGeometry(.968, 1.008, Math.PI * 1.08, Math.PI * 1.92, .105), sensor, bumperPivot, false);
	sensorBand.position.y = -.045;
	sensorBand.userData.part = "front-sensor-band";
	for (const side of [-1, 1]) {
		const split = kit.mesh(`robot-vacuum-bumper-end-split-${side < 0 ? "left" : "right"}`, new BoxGeometry(.022, .19, .13), accentDark, bumperPivot, false);
		split.position.set(side * .925, .005, .12);
		split.rotation.y = side * .14;
		split.userData.explodeWithParent = true;
	}
	const lidarPivot = kit.pivot("robot-vacuum-lidar-rotor-pivot", topAssembly);
	lidarPivot.position.set(0, .14, -.32);
	lidarPivot.userData.rotationAxis = [
		0,
		1,
		0
	];
	kit.socket("robot-vacuum-lidar-axis-socket", lidarPivot, [
		0,
		0,
		0
	]);
	const lidarSeat = kit.mesh("robot-vacuum-lidar-recessed-seat", new CylinderGeometry(.21, .23, .045, 12), cream, lidarPivot);
	lidarSeat.position.y = -.02;
	const lidarTower = kit.mesh("robot-vacuum-raised-lidar-tower", new CylinderGeometry(.17, .185, .15, 12), creamLight, lidarPivot);
	lidarTower.position.y = .068;
	lidarTower.userData.part = "lidar-tower";
	const lidarCap = kit.mesh("robot-vacuum-lidar-accent-cap", new CylinderGeometry(.178, .17, .045, 12), accent, lidarPivot);
	lidarCap.position.y = .158;
	kit.mesh("robot-vacuum-lidar-window", new BoxGeometry(.15, .06, .018), sensor, lidarPivot, false).position.set(0, .075, .184);
	addHorizontalRing(kit, "robot-vacuum-lidar-status-ring", .176, .018, .18, statusRingMaterial, lidarPivot);
	const buttonPivot = kit.pivot("robot-vacuum-top-button-cluster-pivot", topAssembly);
	buttonPivot.position.set(0, .145, .08);
	kit.socket("robot-vacuum-button-cluster-socket", buttonPivot, [
		0,
		0,
		0
	]);
	const buttonRotors = [];
	for (const [index, z] of [[0, -.03], [1, .12]]) {
		const buttonRotor = kit.pivot(`robot-vacuum-top-${index === 0 ? "power" : "home"}-button-rotor`, buttonPivot);
		buttonRotor.position.z = z;
		buttonRotors.push(buttonRotor);
		const buttonMaterial = index === 0 ? kit.indicatorMaterial : creamLight;
		kit.mesh(`robot-vacuum-top-${index === 0 ? "power" : "home"}-button`, new CylinderGeometry(.06, .06, .025, 10), buttonMaterial, buttonRotor, true);
		const glyph = kit.mesh(`robot-vacuum-top-${index === 0 ? "power" : "home"}-glyph`, index === 0 ? new TorusGeometry(.023, .006, 5, 12, Math.PI * 1.68) : new ConeGeometry(.025, .026, 4), accentDark, buttonRotor, false);
		glyph.rotation.x = Math.PI * .5;
		glyph.position.set(0, .017, 0);
		glyph.userData.explodeWithParent = true;
	}
	const undersidePivot = kit.pivot("robot-vacuum-underside-assembly-pivot", chassisPivot);
	kit.socket("robot-vacuum-underside-socket", undersidePivot, [
		0,
		.08,
		0
	]);
	const undersidePlate = kit.mesh("robot-vacuum-underside-recessed-plate", new CylinderGeometry(.76, .8, .055, 12), creamLight, undersidePivot);
	undersidePlate.position.y = .075;
	undersidePlate.userData.part = "underside-plate";
	const batteryCover = kit.mesh("robot-vacuum-underside-battery-cover", new BoxGeometry(.72, .035, .33), cream, undersidePivot, false);
	batteryCover.position.set(0, .038, -.5);
	batteryCover.userData.part = "battery-cover";
	const casterPivot = kit.pivot("robot-vacuum-front-caster-pivot", undersidePivot);
	casterPivot.position.set(0, .015, .61);
	kit.socket("robot-vacuum-front-caster-socket", casterPivot, [
		0,
		0,
		0
	]);
	kit.mesh("robot-vacuum-front-caster-wheel", new SphereGeometry(.08, 12, 8), rubber, casterPivot).scale.set(.7, .55, 1);
	for (const [index, x] of [[0, -.19], [1, .19]]) {
		const contact = kit.mesh(`robot-vacuum-charging-contact-${index + 1}`, new BoxGeometry(.13, .025, .11), metal, undersidePivot, false);
		contact.position.set(x, .035, .52);
		contact.userData.part = "charging-contact";
	}
	const leftWheelPivot = kit.pivot("robot-vacuum-left-drive-wheel-pivot", undersidePivot);
	const rightWheelPivot = kit.pivot("robot-vacuum-right-drive-wheel-pivot", undersidePivot);
	leftWheelPivot.position.set(-.55, .04, .03);
	rightWheelPivot.position.set(.55, .04, .03);
	leftWheelPivot.userData.rotationAxis = [
		1,
		0,
		0
	];
	rightWheelPivot.userData.rotationAxis = [
		1,
		0,
		0
	];
	kit.socket("robot-vacuum-left-wheel-axle-socket", leftWheelPivot, [
		0,
		0,
		0
	]);
	kit.socket("robot-vacuum-right-wheel-axle-socket", rightWheelPivot, [
		0,
		0,
		0
	]);
	for (const [name, parent] of [["left", leftWheelPivot], ["right", rightWheelPivot]]) {
		const wheel = kit.mesh(`robot-vacuum-${name}-drive-wheel`, new CylinderGeometry(.145, .145, .2, 14), rubber, parent);
		wheel.rotation.z = Math.PI * .5;
		wheel.userData.part = `${name}-drive-wheel`;
		for (const x of [
			-.075,
			-.025,
			.025,
			.075
		]) {
			const tread = kit.mesh(`robot-vacuum-${name}-wheel-tread-${x}`, new TorusGeometry(.145, .012, 5, 14), sensor, parent, false);
			tread.rotation.y = Math.PI * .5;
			tread.position.x = x;
			tread.userData.explodeWithParent = true;
		}
	}
	const mainBrushBay = kit.mesh("robot-vacuum-main-brush-bay", new BoxGeometry(.74, .04, .31), accent, undersidePivot, false);
	mainBrushBay.position.set(0, .022, .12);
	mainBrushBay.userData.part = "main-brush-bay";
	const mainBrushPivot = kit.pivot("robot-vacuum-main-brush-pivot", undersidePivot);
	mainBrushPivot.position.set(0, -.005, .12);
	mainBrushPivot.userData.rotationAxis = [
		1,
		0,
		0
	];
	kit.socket("robot-vacuum-main-brush-axis-socket", mainBrushPivot, [
		0,
		0,
		0
	]);
	const roller = kit.mesh("robot-vacuum-main-brush-roller", new CylinderGeometry(.08, .08, .58, 12), brush, mainBrushPivot);
	roller.rotation.z = Math.PI * .5;
	roller.userData.part = "main-brush";
	for (let index = 0; index < 8; index += 1) {
		const fin = kit.mesh(`robot-vacuum-main-brush-fin-${index + 1}`, new BoxGeometry(.54, .018, .105), index % 2 === 0 ? accentDark : rubber, mainBrushPivot, false);
		fin.rotation.x = index * Math.PI / 4;
		fin.userData.explodeWithParent = true;
	}
	for (const [side, x] of [["left", -.58], ["right", .58]]) {
		const sideBrushPivot = kit.pivot(`robot-vacuum-${side}-side-brush-pivot`, undersidePivot);
		sideBrushPivot.position.set(x, -.015, .47);
		sideBrushPivot.userData.rotationAxis = [
			0,
			1,
			0
		];
		sideBrushPivot.userData.brushSide = side;
		kit.socket(`robot-vacuum-${side}-side-brush-axis-socket`, sideBrushPivot, [
			0,
			0,
			0
		]);
		const sideBrushHub = kit.mesh(`robot-vacuum-${side}-side-brush-hub`, new CylinderGeometry(.073, .073, .04, 12), accent, sideBrushPivot);
		sideBrushHub.userData.part = `${side}-side-brush`;
		for (let armIndex = 0; armIndex < 3; armIndex += 1) {
			const armPivot = kit.pivot(`robot-vacuum-${side}-side-brush-arm-${armIndex + 1}`, sideBrushPivot);
			armPivot.rotation.y = armIndex * Math.PI * 2 / 3;
			const arm = kit.mesh(`robot-vacuum-${side}-side-brush-arm-stem-${armIndex + 1}`, new BoxGeometry(.034, .028, .36), brush, armPivot, false);
			arm.position.z = .18;
			for (let bristleIndex = 0; bristleIndex < 3; bristleIndex += 1) {
				const bristle = kit.mesh(`robot-vacuum-${side}-side-brush-bristle-${armIndex + 1}-${bristleIndex + 1}`, new BoxGeometry(.02, .02, .2), brush, armPivot, false);
				bristle.position.set((bristleIndex - 1) * .03, -.015, .43);
				bristle.rotation.y = (bristleIndex - 1) * .11;
				bristle.userData.explodeWithParent = true;
			}
		}
	}
	for (let index = 0; index < 8; index += 1) {
		const angle = index * Math.PI / 4 + Math.PI / 8;
		kit.mesh(`robot-vacuum-underside-fastener-${index + 1}`, new CylinderGeometry(.022, .022, .018, 8), metal, undersidePivot, false).position.set(Math.cos(angle) * .67, .022, Math.sin(angle) * .67);
	}
	for (const [index, angle] of [
		.15,
		1.42,
		2.85,
		4.4
	].entries()) {
		const cliffSensor = kit.mesh(`robot-vacuum-cliff-sensor-${index + 1}`, new BoxGeometry(.12, .025, .075), sensor, undersidePivot, false);
		cliffSensor.position.set(Math.cos(angle) * .7, .025, Math.sin(angle) * .7);
		cliffSensor.rotation.y = -angle + Math.PI * .5;
	}
	ensureRobotVacuumPerformanceRig(kit.root, kit.materials);
	const build = kit.finish({
		referencePath: options.referencePath ?? V2_REFERENCE_PATH,
		reconstructed: [
			"low twelve-sided cream chassis with broad Toon planes, a larger pink top cover and a clearly stepped protective rim",
			"independent front semicircle bumper with end splits and a dark curved sensor band",
			"exaggerated rear-biased twelve-sided LiDAR turret with a recessed seat, accent cap, optical window and separate status ring",
			"two vertically aligned top buttons on a dedicated button-cluster pivot",
			"underside plate with front caster, paired charging contacts, battery cover and perimeter fasteners",
			"independent left/right drive wheels, central roller brush bay and clearly visible left/right three-arm edge brushes",
			"named pivots and sockets for top assembly, bumper, LiDAR rotor, wheels, main brush and both side brushes",
			"powered motion using brushes, wheels, LiDAR, status ring and a complete large-radius return loop"
		],
		inferred: [
			"the referenced local PNG was unavailable to this worker; proportions follow the supplied top, low-side and underside image visible in the task",
			"the motor, gearbox, fan duct, dust bin, battery cells, internal LiDAR optics and wiring are hidden and intentionally not modeled",
			"the exact underside screw thread, wheel suspension travel and bumper microswitch linkage are inferred as closed attachment volumes",
			"the cliff-sensor depth and optical internals are inferred; their external windows follow the visible bottom-view placement language"
		]
	});
	applyRobotVacuumOutlineHierarchy(build.root);
	build.root.userData.legacyReferencePath = REFERENCE_PATH;
	build.root.userData.sculptRuntime.colliders = [{
		id: "robot-vacuum-chassis-collider",
		type: "cylinder",
		node: "robot-vacuum-chassis-pivot"
	}, {
		id: "robot-vacuum-bumper-collider",
		type: "compound",
		node: "robot-vacuum-front-bumper-pivot"
	}];
	build.root.userData.sculptRuntime.destructionGroups = [
		{
			id: "robot-vacuum-chassis-group",
			nodes: ["robot-vacuum-chassis-pivot"]
		},
		{
			id: "robot-vacuum-top-group",
			nodes: ["robot-vacuum-top-assembly-pivot"]
		},
		{
			id: "robot-vacuum-bumper-group",
			nodes: ["robot-vacuum-front-bumper-pivot"]
		},
		{
			id: "robot-vacuum-cleaning-group",
			nodes: ["robot-vacuum-underside-assembly-pivot"]
		}
	];
	return build;
}
//#endregion
export { robotVacuum_exports as n, createRobotVacuumModel as t };

import { t as __exportAll } from "./rolldown-runtime-D7D4PA-g.js";
import { I as ExtrudeGeometry, It as Quaternion, J as InstancedMesh, L as Float32BufferAttribute, Ln as Shape, N as Euler, S as CylinderGeometry, Xn as TorusGeometry, d as CircleGeometry, dr as Vector3, ht as Mesh, mt as Matrix4, o as BufferGeometry, p as Color } from "./three.core-DlTOC7bx.js";
import { h as createHairDryerRibbonGeometry, i as RoundedBoxGeometry, p as HAIR_DRYER_RIBBON_PROFILES } from "./BufferGeometryUtils-CSuwXBGj.js";
import { a as setHullOutlineStyle, d as ApplianceModelKit } from "./outline-DAm9XhPL.js";
//#region src/appliances/models/hairDryer.ts
var hairDryer_exports = /* @__PURE__ */ __exportAll({ createHairDryerModel: () => createHairDryerModel });
var REFERENCE_PATH = "references/intake/hair-dryer/front.png";
var V2_REFERENCE_PATH = "references/intake-v2/hair-dryer/hair-dryer-v2-turnsheet.png";
var ACTIVE_DURATION = 5.2;
function rounded(width, height, depth, radius) {
	return new RoundedBoxGeometry(width, height, depth, 5, radius);
}
function facetedPanelGeometry(width, height, depth, chamfer) {
	const halfWidth = width * .5;
	const halfHeight = height * .5;
	const cut = Math.min(chamfer, halfWidth * .42, halfHeight * .22);
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
		bevelEnabled: false,
		curveSegments: 1
	});
	geometry.translate(0, 0, -depth * .5);
	geometry.computeVertexNormals();
	return geometry;
}
function stableOutlinePhase(name) {
	let hash = 2166136261;
	for (let index = 0; index < name.length; index += 1) {
		hash ^= name.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return (hash >>> 0) % 1e4 * (Math.PI * 2 / 1e4);
}
function applyHairDryerOutlineHierarchy(root) {
	const mainSilhouette = /motor-shell$|concentrator-nozzle$|handle-shell$/;
	const fineDetail = /button|slider|groove|louver|perforation|fan-|strain-relief|power-cord/;
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
/** Open variable-section loft: circular at the barrel socket, pinched, then flattened at the outlet. */
function nozzleLoftGeometry() {
	const rings = [
		{
			x: -1.13,
			radiusY: .79,
			radiusZ: .76
		},
		{
			x: -1.31,
			radiusY: .73,
			radiusZ: .65
		},
		{
			x: -1.52,
			radiusY: .5,
			radiusZ: .44
		},
		{
			x: -1.78,
			radiusY: .42,
			radiusZ: .33
		},
		{
			x: -2.08,
			radiusY: .55,
			radiusZ: .25
		},
		{
			x: -2.37,
			radiusY: .64,
			radiusZ: .23
		}
	];
	const segments = 12;
	const positions = [];
	const indices = [];
	rings.forEach((ring) => {
		for (let segment = 0; segment < segments; segment += 1) {
			const angle = segment / segments * Math.PI * 2;
			positions.push(ring.x, Math.cos(angle) * ring.radiusY, Math.sin(angle) * ring.radiusZ);
		}
	});
	for (let ring = 0; ring < rings.length - 1; ring += 1) for (let segment = 0; segment < segments; segment += 1) {
		const next = (segment + 1) % segments;
		const a = ring * segments + segment;
		const b = ring * segments + next;
		const c = (ring + 1) * segments + next;
		const d = (ring + 1) * segments + segment;
		indices.push(a, d, b, b, d, c);
	}
	const geometry = new BufferGeometry();
	geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
	geometry.setIndex(indices);
	geometry.computeVertexNormals();
	return geometry;
}
function addPerforationField(kit, parent, material) {
	const points = [];
	const step = .145;
	for (let row = -5; row <= 5; row += 1) for (let column = -5; column <= 5; column += 1) {
		const y = row * step;
		const z = column * step;
		if (Math.hypot(y, z) <= .72) points.push([y, z]);
	}
	const geometry = new CircleGeometry(.041, 8);
	const field = new InstancedMesh(geometry, material, points.length);
	field.name = "hair-dryer-rear-perforation-field";
	field.castShadow = false;
	field.receiveShadow = true;
	field.userData.applianceId = kit.options.id;
	field.userData.part = "rear-perforation-field";
	field.renderOrder = 3;
	const quaternion = new Quaternion().setFromEuler(new Euler(0, Math.PI * .5, 0));
	const scale = new Vector3(1, 1, 1);
	points.forEach(([y, z], index) => {
		const matrix = new Matrix4().compose(new Vector3(.155, y, z), quaternion, scale);
		field.setMatrixAt(index, matrix);
	});
	field.instanceMatrix.needsUpdate = true;
	parent.add(field);
	kit.interactiveMeshes.push(field);
	kit.nodes.set(field.name, field);
	return field;
}
/** Programmatic three-view reconstruction of the SAKURA handheld hair dryer. */
function createHairDryerModel(options) {
	const kit = new ApplianceModelKit(options);
	const accent = new Color(options.accent);
	const pink = accent.clone().offsetHSL(0, -.04, .04).getHex();
	const pinkLight = accent.clone().offsetHSL(0, -.08, .14).getHex();
	const pinkDark = accent.clone().offsetHSL(0, .02, -.1).getHex();
	const cream = kit.material(16247510, { tint: 9732747 });
	const creamHighlight = kit.material(16774372, { tint: 11046546 });
	const pinkMaterial = kit.material(pink, { tint: 8808056 });
	const pinkHighlight = kit.material(pinkLight, { tint: 10976652 });
	const pinkShadow = kit.material(pinkDark, { tint: 6902629 });
	const mint = kit.material(12575194, { tint: 7903126 });
	const mintScreen = kit.material(14151399, {
		tint: 8298138,
		transparent: true,
		opacity: .9
	});
	mintScreen.depthWrite = false;
	const cavity = kit.material(4999755, { tint: 3355194 });
	const grille = kit.material(7696237, { tint: 4539725 });
	const cordMaterial = kit.material(15392718, { tint: 8419200 });
	const ribbonMaterials = [
		kit.material(15833779, {
			tint: 8344429,
			transparent: true,
			opacity: 0
		}),
		kit.material(16308384, {
			tint: 8743516,
			transparent: true,
			opacity: 0
		}),
		kit.material(10475728, {
			tint: 5207163,
			transparent: true,
			opacity: 0
		}),
		kit.material(13152735, {
			tint: 6445173,
			transparent: true,
			opacity: 0
		}),
		kit.material(15905693, {
			tint: 8476769,
			transparent: true,
			opacity: 0
		})
	];
	ribbonMaterials.forEach((material) => {
		material.side = 2;
		material.depthWrite = false;
	});
	const bodyPivot = kit.pivot("hair-dryer-body-pivot");
	bodyPivot.position.y = 1.35;
	bodyPivot.userData.rotationAxis = [
		1,
		0,
		0
	];
	const shell = kit.mesh("hair-dryer-cream-motor-shell", new CylinderGeometry(.78, .82, 2.52, 12, 1, false), cream, bodyPivot);
	shell.rotation.z = Math.PI * .5;
	shell.userData.part = "motor-shell";
	const shellHighlight = kit.mesh("hair-dryer-motor-shell-upper-highlight", new CylinderGeometry(.785, .825, 1.84, 12, 1, true, Math.PI * .08, Math.PI * .5), creamHighlight, bodyPivot, false);
	shellHighlight.rotation.z = Math.PI * .5;
	shellHighlight.position.x = .05;
	shellHighlight.userData.explodeWithParent = true;
	const bodySeam = kit.mesh("hair-dryer-body-mould-seam", new TorusGeometry(.78, .018, 5, 12), pinkShadow, bodyPivot, false);
	bodySeam.rotation.y = Math.PI * .5;
	bodySeam.position.x = .18;
	bodySeam.userData.explodeWithParent = true;
	const frontLip = kit.mesh("hair-dryer-cream-front-transition-lip", new TorusGeometry(.775, .07, 6, 12), creamHighlight, bodyPivot, false);
	frontLip.rotation.y = Math.PI * .5;
	frontLip.position.x = -1.225;
	frontLip.userData.explodeWithParent = true;
	const nozzlePivot = kit.pivot("hair-dryer-nozzle-pivot", bodyPivot);
	nozzlePivot.userData.rotationAxis = [
		1,
		0,
		0
	];
	kit.socket("hair-dryer-nozzle-bayonet-socket", bodyPivot, [
		-1.18,
		0,
		0
	]);
	const nozzleCouplingSleeve = kit.mesh("hair-dryer-wide-nozzle-coupling-sleeve", new CylinderGeometry(.8, .78, .28, 12, 1, true), pinkHighlight, nozzlePivot, false);
	nozzleCouplingSleeve.rotation.z = Math.PI * .5;
	nozzleCouplingSleeve.position.x = -1.19;
	nozzleCouplingSleeve.userData.part = "nozzle-coupling-sleeve";
	const nozzle = kit.mesh("hair-dryer-pink-concentrator-nozzle", nozzleLoftGeometry(), pinkMaterial, nozzlePivot);
	nozzle.userData.part = "concentrator-nozzle";
	const nozzleBand = kit.mesh("hair-dryer-nozzle-socket-band", new TorusGeometry(.72, .045, 5, 12), pinkHighlight, nozzlePivot, false);
	nozzleBand.rotation.y = Math.PI * .5;
	nozzleBand.position.x = -1.17;
	nozzleBand.userData.explodeWithParent = true;
	const outlet = kit.mesh("hair-dryer-flat-outlet-cavity", rounded(.055, 1.12, .38, .11), cavity, nozzlePivot, false);
	outlet.position.x = -2.385;
	outlet.userData.part = "outlet-cavity";
	const outletRim = kit.mesh("hair-dryer-flat-outlet-rim", new TorusGeometry(.57, .045, 5, 12), pinkHighlight, nozzlePivot, false);
	outletRim.rotation.y = Math.PI * .5;
	outletRim.position.x = -2.405;
	outletRim.scale.z = .36;
	outletRim.userData.explodeWithParent = true;
	for (let index = 0; index < 5; index += 1) {
		const louver = kit.mesh(`hair-dryer-outlet-louver-${index + 1}`, rounded(.055, .055, .31, .018), grille, nozzlePivot, false);
		louver.position.set(-2.425, (index - 2) * .205, 0);
		louver.userData.explodeWithParent = true;
	}
	kit.socket("hair-dryer-airflow-emitter-socket", nozzlePivot, [
		-2.43,
		0,
		0
	]);
	const rearPivot = kit.pivot("hair-dryer-rear-intake-pivot", bodyPivot);
	rearPivot.position.x = 1.25;
	kit.socket("hair-dryer-rear-service-socket", bodyPivot, [
		1.25,
		0,
		0
	]);
	const rearCreamRing = kit.mesh("hair-dryer-rear-cream-bezel", new TorusGeometry(.79, .115, 6, 12), creamHighlight, rearPivot);
	rearCreamRing.rotation.y = Math.PI * .5;
	rearCreamRing.userData.part = "rear-cream-bezel";
	const rearMintRing = kit.mesh("hair-dryer-rear-mint-intake-ring", new TorusGeometry(.64, .075, 6, 12), mint, rearPivot);
	rearMintRing.rotation.y = Math.PI * .5;
	rearMintRing.position.x = .125;
	rearMintRing.userData.part = "rear-mint-ring";
	const rearCavity = kit.mesh("hair-dryer-rear-mint-perforated-plate", new CylinderGeometry(.61, .61, .045, 12), mintScreen, rearPivot, false);
	rearCavity.rotation.z = Math.PI * .5;
	rearCavity.position.x = .132;
	rearCavity.renderOrder = 2;
	rearCavity.userData.part = "rear-perforated-plate";
	const fanPivot = kit.pivot("hair-dryer-fan-rotor-pivot", rearPivot);
	fanPivot.position.x = .075;
	fanPivot.userData.rotationAxis = [
		1,
		0,
		0
	];
	kit.socket("hair-dryer-fan-axis-socket", rearPivot, [
		.13,
		0,
		0
	]);
	const fanHub = kit.mesh("hair-dryer-fan-hub", new CylinderGeometry(.15, .15, .08, 10), grille, fanPivot, false);
	fanHub.rotation.z = Math.PI * .5;
	fanHub.userData.part = "fan-hub";
	fanHub.renderOrder = 1;
	for (let index = 0; index < 7; index += 1) {
		const blade = kit.mesh(`hair-dryer-fan-blade-${index + 1}`, rounded(.055, .42, .14, .04), grille, fanPivot, false);
		const angle = index * Math.PI * 2 / 7;
		blade.position.set(0, Math.cos(angle) * .29, Math.sin(angle) * .29);
		blade.rotation.x = angle + .38;
		blade.scale.set(.82, .78, .72);
		blade.renderOrder = 1;
		blade.userData.explodeWithParent = true;
	}
	addPerforationField(kit, rearPivot, cavity);
	const handlePivot = kit.pivot("hair-dryer-handle-pivot");
	handlePivot.position.set(.45, .76, 0);
	handlePivot.userData.rotationAxis = [
		0,
		0,
		1
	];
	kit.socket("hair-dryer-handle-root-socket", bodyPivot, [
		.45,
		-.71,
		0
	]);
	const handle = kit.mesh("hair-dryer-pink-rounded-handle-shell", facetedPanelGeometry(.74, 2.22, .66, .16), pinkMaterial, handlePivot);
	handle.position.y = -.84;
	handle.userData.part = "handle-shell";
	const handleShoulder = kit.mesh("hair-dryer-faceted-handle-shoulder", facetedPanelGeometry(.86, .46, .68, .12), pinkHighlight, handlePivot, false);
	handleShoulder.position.y = .16;
	handleShoulder.userData.part = "handle-shell";
	handleShoulder.userData.explodeWithParent = true;
	const handleFrontHighlight = kit.mesh("hair-dryer-handle-front-highlight", rounded(.47, 1.72, .025, .11), pinkHighlight, handlePivot, false);
	handleFrontHighlight.position.set(0, -.78, .345);
	handleFrontHighlight.userData.explodeWithParent = true;
	const handleSeam = kit.mesh("hair-dryer-handle-centre-seam", rounded(.018, 1.82, .026, .006), pinkShadow, handlePivot, false);
	handleSeam.position.set(0, -.82, -.34);
	handleSeam.userData.explodeWithParent = true;
	const coolButtonPivot = kit.pivot("hair-dryer-cool-shot-button-pivot", handlePivot);
	coolButtonPivot.position.set(0, -.43, .365);
	coolButtonPivot.userData.translationAxis = [
		0,
		0,
		-1
	];
	kit.socket("hair-dryer-cool-button-socket", handlePivot, [
		0,
		-.43,
		.35
	]);
	const coolButtonRing = kit.mesh("hair-dryer-cool-shot-button-ring", new TorusGeometry(.15, .028, 5, 12), pinkShadow, coolButtonPivot, false);
	coolButtonRing.userData.part = "cool-shot-control";
	const coolButton = kit.mesh("hair-dryer-round-cool-shot-button", new CylinderGeometry(.125, .125, .055, 10), creamHighlight, coolButtonPivot, false);
	coolButton.rotation.x = Math.PI * .5;
	coolButton.position.z = .02;
	coolButton.userData.explodeWithParent = true;
	const switchPivot = kit.pivot("hair-dryer-power-slider-pivot", handlePivot);
	switchPivot.position.set(0, -1.03, .365);
	switchPivot.userData.translationAxis = [
		0,
		1,
		0
	];
	kit.socket("hair-dryer-power-switch-socket", handlePivot, [
		0,
		-1.03,
		.35
	]);
	const switchTrack = kit.mesh("hair-dryer-power-slider-track", rounded(.31, .62, .06, .11), cream, switchPivot);
	switchTrack.userData.part = "power-slider-track";
	const switchThumb = kit.mesh("hair-dryer-power-slider-thumb", rounded(.26, .23, .09, .08), creamHighlight, switchPivot, false);
	switchThumb.position.set(0, .12, .055);
	switchThumb.userData.part = "power-slider-thumb";
	const switchGroove = kit.mesh("hair-dryer-power-slider-groove", rounded(.2, .035, .018, .012), pinkShadow, switchThumb, false);
	switchGroove.position.z = .055;
	switchGroove.userData.explodeWithParent = true;
	kit.indicator([
		.45,
		-.16,
		.37
	], .038);
	const cablePivot = kit.pivot("hair-dryer-cable-pivot", handlePivot);
	cablePivot.position.y = -1.96;
	kit.socket("hair-dryer-power-cable-socket", handlePivot, [
		0,
		-1.94,
		0
	]);
	const collar = kit.mesh("hair-dryer-cream-cable-collar", new CylinderGeometry(.34, .31, .22, 10), cream, cablePivot);
	collar.userData.part = "cable-collar";
	for (let index = 0; index < 6; index += 1) {
		const topRadius = .23 - index * .021;
		const rib = kit.mesh(`hair-dryer-strain-relief-rib-${index + 1}`, new CylinderGeometry(topRadius - .012, topRadius, .105, 8), cordMaterial, cablePivot, false);
		rib.position.y = -.15 - index * .09;
		rib.userData.explodeWithParent = true;
	}
	const cord = kit.mesh("hair-dryer-visible-power-cord", new CylinderGeometry(.075, .075, .62, 8), cordMaterial, cablePivot);
	cord.position.y = -.8;
	cord.userData.part = "power-cord";
	const ribbonField = kit.pivot("hair-dryer-ribbon-field-pivot", bodyPivot);
	ribbonField.userData.deformationSystem = "deterministic-segmented-solid-ribbon";
	ribbonField.userData.releaseTime = 4.18;
	HAIR_DRYER_RIBBON_PROFILES.forEach((profile, index) => {
		const ribbon = kit.mesh(`hair-dryer-solid-wind-ribbon-${index + 1}`, createHairDryerRibbonGeometry(index), ribbonMaterials[index], ribbonField, false);
		ribbon.visible = false;
		ribbon.castShadow = true;
		ribbon.receiveShadow = true;
		ribbon.userData.part = `wind-ribbon-${index + 1}`;
		ribbon.userData.anchorSocket = "hair-dryer-airflow-emitter-socket";
		ribbon.userData.anchorLocal = [...profile.anchor];
		ribbon.userData.topologyClass = "segmented-solid-ribbon";
		ribbon.userData.crossSection = "rectangular-solid";
		ribbon.userData.deformation = {
			propagation: "fixed-end-to-free-end",
			phase: profile.phase,
			frequency: profile.frequency,
			waveNumber: profile.waveNumber,
			twist: profile.twist,
			bend: profile.bend,
			turbulence: profile.turbulence
		};
	});
	applyHairDryerOutlineHierarchy(kit.root);
	const build = kit.finish({
		referencePath: options.referencePath ?? REFERENCE_PATH,
		reconstructed: [
			"twelve-sided tapered cream motor shell with broad Toon planes and a clipped pink handle shoulder",
			"twelve-sided pinched concentrator loft with an exaggerated flattened outlet and five recessed louvers",
			"round rear intake with cream bezel, mint ring, dark cavity and dense perforation field",
			"clipped-corner pink vertical handle with front highlight, construction seam, cool-shot button and two-position slider",
			"cream lower collar, six-step strain-relief boot and visible power cord",
			"independent nozzle, fan, handle, controls, cable and airflow pivots with named runtime sockets",
			"five long solid-section fabric ribbons with individually parameterized propagation, twist, bend and deterministic turbulence",
			"stable main, structure and detail outline tiers with object-space plus/minus eighteen percent variation"
		],
		inferred: [
			"internal motor, heater coil, thermal fuse and electrical routing are hidden and omitted",
			"fan blade profile and exact rotor depth are inferred behind the intake perforations",
			"concentrator bayonet depth and outlet louver construction are inferred from the side silhouette",
			"body mould seam, hidden fasteners and cord attachment depth are reasonable manufacturing inferences",
			"the five SAKURA fabric ribbons are an intentionally stylized visualization of wind rather than literal dryer hardware"
		]
	});
	build.root.userData.activeDuration = ACTIVE_DURATION;
	build.root.userData.previewLightingProfile = "sakura-appliance-v2";
	build.root.userData.previewFramingScale = .9;
	build.root.userData.requestedV2ReferencePath = V2_REFERENCE_PATH;
	build.root.userData.v2ReferenceStatus = "gpt-image-2-compatible-endpoint-timeout; archived orthographic references used";
	build.root.userData.referenceDimensions = {
		barrelLength: 2.52,
		bodyDiameter: 1.64,
		nozzleLength: 1.24,
		outletSize: [1.12, .38],
		handleSize: [
			.74,
			2.22,
			.66
		],
		overallWidthWithoutEffects: 3.82,
		overallHeightWithoutCord: 4.05
	};
	build.root.userData.sculptRuntime.colliders = [
		{
			id: "hair-dryer-body",
			type: "cylinder",
			node: "hair-dryer-cream-motor-shell",
			axis: "x"
		},
		{
			id: "hair-dryer-handle",
			type: "box",
			node: "hair-dryer-pink-rounded-handle-shell"
		},
		{
			id: "hair-dryer-nozzle",
			type: "compound",
			node: "hair-dryer-pink-concentrator-nozzle"
		},
		{
			id: "hair-dryer-airflow-trigger",
			type: "box",
			node: "hair-dryer-ribbon-field-pivot",
			trigger: true
		}
	];
	build.root.userData.sculptRuntime.destructionGroups = [
		{
			id: "motor-housing",
			nodes: ["hair-dryer-body-pivot", "hair-dryer-rear-intake-pivot"]
		},
		{
			id: "concentrator",
			nodes: ["hair-dryer-nozzle-pivot"]
		},
		{
			id: "handle-controls",
			nodes: [
				"hair-dryer-handle-pivot",
				"hair-dryer-cool-shot-button-pivot",
				"hair-dryer-power-slider-pivot"
			]
		},
		{
			id: "power-cable",
			nodes: ["hair-dryer-cable-pivot"]
		},
		{
			id: "wind-ribbons",
			nodes: ["hair-dryer-ribbon-field-pivot"]
		}
	];
	return build;
}
//#endregion
export { hairDryer_exports as n, createHairDryerModel as t };

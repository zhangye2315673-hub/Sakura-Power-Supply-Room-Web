import { t as __exportAll } from "./rolldown-runtime-D7D4PA-g.js";
import { Fn as ShaderMaterial, G as IcosahedronGeometry, H as Group, Hn as SphereGeometry, I as ExtrudeGeometry, J as InstancedMesh, Ln as Shape, S as CylinderGeometry, Xn as TorusGeometry, dr as Vector3, gt as MeshBasicMaterial, ht as Mesh, i as BoxGeometry, j as DynamicDrawUsage, mt as Matrix4, p as Color } from "./three.core-DlTOC7bx.js";
import { i as RoundedBoxGeometry } from "./BufferGeometryUtils-CtH-hlZf.js";
import { a as setHullOutlineStyle, d as ApplianceModelKit, f as orientCylinderBetween } from "./outline-Cv1Jem2g.js";
//#region src/appliances/models/bubbleMachine.ts
var bubbleMachine_exports = /* @__PURE__ */ __exportAll({ createBubbleMachineModel: () => createBubbleMachineModel });
var REFERENCE_PATH = "D:/下载文件/ChatGPT Image 2026年8月3日 16_17_49 (8).png";
var V2_REFERENCE_PATH = "references/intake-v2/bubble-machine/views/front.png";
var ACTIVE_DURATION = 5.2;
var ORDINARY_BUBBLE_COUNT = 48;
var BURST_FRAGMENT_COUNT = 8;
function accentShift(accent, lightness, saturation = 0) {
	return new Color(accent).offsetHSL(0, saturation, lightness).getHex();
}
function roundedPlate(width, height, depth, radius) {
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
function applyBubbleMachineOutlineHierarchy(root) {
	const mainSilhouette = /housing-shell|front-window-outer-rim|foot-\d+$|reservoir-fill-cap|drip-tray$/;
	const fineDetail = /status-indicator|control-index|wheel-hub-cap|side-vent|rear-fastener|power-inlet|grille-spoke|bubble-ring-inner/;
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
function addRadialBar(kit, name, angle, innerRadius, outerRadius, z, radius, material, parent) {
	const start = new Vector3(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius, z);
	const end = new Vector3(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius, z);
	const bar = kit.mesh(name, new CylinderGeometry(radius, radius, 1, 8), material, parent, false);
	orientCylinderBetween(bar, start, end);
	return bar;
}
function fanBladeGeometry() {
	const blade = new Shape();
	blade.moveTo(.07, .015);
	blade.bezierCurveTo(.16, .025, .31, .09, .39, .2);
	blade.bezierCurveTo(.43, .28, .4, .36, .31, .37);
	blade.bezierCurveTo(.21, .34, .12, .19, .07, .015);
	const geometry = new ExtrudeGeometry(blade, {
		depth: .035,
		steps: 1,
		bevelEnabled: true,
		bevelSegments: 1,
		bevelSize: .008,
		bevelThickness: .008,
		curveSegments: 7
	});
	geometry.translate(0, 0, -.0175);
	geometry.computeVertexNormals();
	return geometry;
}
function performanceMesh(name, geometry, material, parent, effectKind) {
	const mesh = new Mesh(geometry, material);
	mesh.name = name;
	mesh.castShadow = false;
	mesh.receiveShadow = false;
	mesh.frustumCulled = false;
	mesh.userData.performanceEffect = true;
	mesh.userData.effectKind = effectKind;
	parent.add(mesh);
	return mesh;
}
function createBubbleVisual(name, parent, resources, rainbowIndex) {
	const bubble = new Group();
	bubble.name = name;
	bubble.visible = false;
	bubble.userData.performanceEffect = true;
	bubble.userData.effectKind = "iridescent-bubble";
	parent.add(bubble);
	const film = performanceMesh(`${name}-film-shell`, resources.sphereGeometry, resources.filmMaterial, bubble, "semi-transparent-spherical-film");
	film.rotation.set(rainbowIndex * .37, rainbowIndex * .61, rainbowIndex * .23);
	film.renderOrder = 21;
	return bubble;
}
function addOrdinaryBubbleInstanceBatches(performanceRig, bubbles) {
	const batches = /* @__PURE__ */ new Map();
	bubbles.forEach((bubble) => {
		bubble.children.forEach((object) => {
			if (!(object instanceof Mesh) || Array.isArray(object.material)) return;
			const key = `${object.geometry.uuid}:${object.material.uuid}:${object.renderOrder}`;
			const entries = batches.get(key) ?? [];
			entries.push({
				bubble,
				source: object
			});
			batches.set(key, entries);
			object.visible = false;
			object.userData.performanceWarmupProxy = true;
		});
		bubble.userData.performanceWarmupProxy = true;
	});
	const hiddenMatrix = new Matrix4().makeScale(0, 0, 0);
	let batchIndex = 0;
	batches.forEach((entries) => {
		const first = entries[0].source;
		const batch = new InstancedMesh(first.geometry, first.material, entries.length);
		batchIndex += 1;
		batch.name = `bubble-machine-performance-instance-batch-${batchIndex}`;
		batch.visible = false;
		batch.castShadow = false;
		batch.receiveShadow = false;
		batch.frustumCulled = false;
		batch.renderOrder = first.renderOrder;
		batch.instanceMatrix.setUsage(DynamicDrawUsage);
		batch.userData.performanceEffect = true;
		batch.userData.effectKind = `instanced-${String(first.userData.effectKind ?? "bubble-layer")}`;
		batch.userData.bubbleBatchBindings = entries.map(({ bubble, source }) => ({
			bubbleName: bubble.name,
			sourceMeshName: source.name
		}));
		for (let index = 0; index < entries.length; index += 1) batch.setMatrixAt(index, hiddenMatrix);
		batch.instanceMatrix.needsUpdate = true;
		performanceRig.add(batch);
	});
	return batchIndex;
}
function addBubblePerformanceRig(kit, emitterPosition) {
	const performanceRig = kit.pivot("bubble-machine-performance-rig");
	performanceRig.userData.effectOwner = "BubbleMachinePerformance";
	performanceRig.userData.sharedSpectacleEffects = "disabled";
	performanceRig.userData.forbiddenPrimitives = [
		"PlaneGeometry",
		"Sprite",
		"Line"
	];
	const sphereGeometry = new SphereGeometry(1, 12, 8);
	const filmMaterial = new ShaderMaterial({
		name: "bubble-machine-iridescent-film-material",
		transparent: true,
		depthWrite: false,
		side: 2,
		toneMapped: false,
		vertexShader: `
      varying vec3 vBubbleNormal;
      varying vec3 vViewPosition;
      void main() {
        vec3 objectNormal = normal;
        vec4 localPosition = vec4(position, 1.0);
        #ifdef USE_INSTANCING
          objectNormal = mat3(instanceMatrix) * objectNormal;
          localPosition = instanceMatrix * localPosition;
        #endif
        vec4 mvPosition = modelViewMatrix * localPosition;
        vBubbleNormal = normalize(normalMatrix * objectNormal);
        vViewPosition = mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
		fragmentShader: `
      varying vec3 vBubbleNormal;
      varying vec3 vViewPosition;
      void main() {
        vec3 normalDirection = normalize(vBubbleNormal);
        vec3 viewDirection = normalize(-vViewPosition);
        float fresnel = pow(1.0 - abs(dot(normalDirection, viewDirection)), 2.25);
        float hue = fract(
          normalDirection.x * 0.21
          + normalDirection.y * 0.34
          + normalDirection.z * 0.13
          + 0.58
        );
        vec3 rainbow = 0.58 + 0.42 * cos(
          6.2831853 * (vec3(0.0, 0.34, 0.68) + hue)
        );
        float band = smoothstep(0.18, 0.82, fresnel);
        vec3 film = mix(vec3(0.72, 0.96, 1.0), rainbow, band * 0.86);
        vec3 highlightDirection = normalize(vec3(-0.48, 0.62, 0.62));
        float highlight = pow(max(dot(normalDirection, highlightDirection), 0.0), 18.0);
        film += vec3(1.0, 0.96, 0.92) * highlight * 0.72;
        float alpha = 0.055 + fresnel * 0.34 + highlight * 0.24;
        gl_FragColor = vec4(film, clamp(alpha, 0.04, 0.56));
      }
    `
	});
	const resources = {
		sphereGeometry,
		filmMaterial
	};
	kit.materials.add(filmMaterial);
	const baseSizes = [
		.12,
		.17,
		.24,
		.32
	];
	const ordinaryBubbles = [];
	for (let index = 0; index < ORDINARY_BUBBLE_COUNT; index += 1) {
		const bubble = createBubbleVisual(`bubble-machine-performance-bubble-${index + 1}`, performanceRig, resources, index);
		const lateralTravel = (index % 2 === 0 ? -1 : 1) * (9.5 + index % 5 * .72);
		const forwardTravel = 6.4 + index % 6 * .62;
		const riseTravel = 5.5 + index % 7 * .48;
		bubble.position.set(...emitterPosition);
		Object.assign(bubble.userData, {
			bubbleRole: "ordinary",
			sizeClass: [
				"small",
				"medium",
				"large",
				"hero-large"
			][index % baseSizes.length],
			baseRadius: baseSizes[index % baseSizes.length],
			launchTime: .22 + index * .05,
			flightDuration: 3.45 + index % 6 * .2,
			lateralTravel,
			riseTravel,
			forwardTravel,
			configuredTravelDistance: Math.hypot(lateralTravel, riseTravel, forwardTravel),
			driftAmplitude: .34 + index % 5 * .11,
			driftRate: .86 + index % 7 * .13,
			driftPhase: index * 1.61803398875
		});
		ordinaryBubbles.push(bubble);
	}
	const ordinaryInstanceBatchCount = addOrdinaryBubbleInstanceBatches(performanceRig, ordinaryBubbles);
	const giantBubble = createBubbleVisual("bubble-machine-giant-bubble", performanceRig, resources, 3);
	giantBubble.position.set(...emitterPosition);
	Object.assign(giantBubble.userData, {
		bubbleRole: "giant-climax",
		baseRadius: .94,
		launchTime: 3.18,
		burstTime: 4.62,
		riseTravel: 6.2,
		lateralTravel: .95,
		forwardTravel: 2.15
	});
	const burstRig = kit.pivot("bubble-machine-giant-bubble-burst-rig", performanceRig);
	burstRig.visible = false;
	burstRig.position.set(...emitterPosition);
	burstRig.userData.performanceEffect = true;
	burstRig.userData.effectKind = "giant-bubble-volumetric-burst";
	burstRig.userData.fragmentCount = BURST_FRAGMENT_COUNT;
	const burstLightGeometry = new IcosahedronGeometry(.11, 1);
	const burstLightMaterial = new MeshBasicMaterial({
		name: "bubble-machine-burst-light-material",
		color: 16773549,
		transparent: true,
		opacity: .92,
		toneMapped: false
	});
	kit.materials.add(burstLightMaterial);
	for (let index = 0; index < BURST_FRAGMENT_COUNT; index += 1) {
		const isMiniBubble = index < BURST_FRAGMENT_COUNT / 2;
		const fragment = performanceMesh(isMiniBubble ? `bubble-machine-burst-mini-bubble-${index + 1}` : `bubble-machine-burst-light-point-${index + 1 - BURST_FRAGMENT_COUNT / 2}`, isMiniBubble ? sphereGeometry : burstLightGeometry, isMiniBubble ? filmMaterial : burstLightMaterial, burstRig, isMiniBubble ? "volumetric-mini-bubble" : "volumetric-light-point");
		fragment.visible = false;
		fragment.userData.fragmentIndex = index;
		fragment.userData.fragmentDirection = new Vector3(Math.cos(index * Math.PI * .75) * (.78 + index % 2 * .16), .28 + index % 3 * .38, Math.sin(index * Math.PI * .75) * (.7 + index % 3 * .12)).normalize().toArray();
	}
	kit.root.userData.bubbleMachinePerformanceRig = {
		ordinaryBubbleCount: ORDINARY_BUBBLE_COUNT,
		ordinaryInstanceBatchCount,
		ordinarySourceMeshCount: ORDINARY_BUBBLE_COUNT,
		ordinaryRuntimeDrawMeshes: ordinaryInstanceBatchCount,
		sizeClasses: [
			"small",
			"medium",
			"large",
			"hero-large"
		],
		materialLanguage: "single-pass transparent film with shader rainbow rim and soft highlight",
		minimumConfiguredTravelDistance: Math.min(...performanceRig.children.filter((child) => child.userData.bubbleRole === "ordinary").map((child) => Number(child.userData.configuredTravelDistance))),
		giantBubbleRadius: giantBubble.userData.baseRadius,
		burstFragmentCount: BURST_FRAGMENT_COUNT,
		burstFeedback: "four volumetric mini bubbles and four icosahedral light points",
		forbiddenPrimitives: [
			"PlaneGeometry",
			"Sprite",
			"Line"
		],
		sharedSpectacleEffects: "disabled"
	};
}
/**
* Three-view procedural reconstruction of the supplied SAKURA bubble machine.
*
* Local frame: +Y up, +Z front, floor at Y=0. Every compound assembly is a
* separate named node. Hidden pump, gearing, tubing and wiring are deliberately
* omitted; only their runtime sockets are inferred from the appliance's use.
*/
function createBubbleMachineModel(options) {
	const kit = new ApplianceModelKit(options);
	const accentLight = accentShift(options.accent, .14, -.05);
	const accentMid = accentShift(options.accent, .04, -.03);
	const accentDark = accentShift(options.accent, -.12, .01);
	const mint = 10411987;
	const shellMaterial = kit.material(16182751, { tint: 7628671 });
	const shellHighlightMaterial = kit.material(16775144, { tint: 8483723 });
	const accentMaterial = kit.material(accentMid, { tint: 6904947 });
	const accentLightMaterial = kit.material(accentLight, { tint: 7694203 });
	const accentDarkMaterial = kit.material(accentDark, { tint: 6115430 });
	const mintMaterial = kit.material(mint, { tint: 6715781 });
	const cavityMaterial = kit.material(4208198, { tint: 3156538 });
	const hardwareMaterial = kit.material(7827838, { tint: 4933208 });
	const windowMaterial = kit.material(7494228, {
		tint: accentDark,
		transparent: true,
		opacity: .34
	});
	windowMaterial.depthWrite = false;
	const reservoirMaterial = kit.material(accentLight, {
		tint: 9137538,
		transparent: true,
		opacity: .58
	});
	reservoirMaterial.depthWrite = false;
	reservoirMaterial.emissive.set(accentLight);
	reservoirMaterial.emissiveIntensity = .08;
	const liquidFillMaterial = kit.material(accentLight, {
		tint: 7827855,
		emissive: accentLight,
		transparent: true,
		opacity: .24
	});
	liquidFillMaterial.depthWrite = false;
	const housingPivot = kit.pivot("bubble-machine-housing-pivot");
	housingPivot.position.y = 1.24;
	const housingShell = kit.mesh("bubble-machine-housing-shell", roundedPlate(2.16, 2.24, 1.44, .34), shellMaterial, housingPivot);
	housingShell.userData.part = "housing-shell";
	const shoulderFacetGeometry = new BoxGeometry(.2, .34, 1.38);
	const leftShoulderFacet = kit.mesh("bubble-machine-upper-shoulder-facet-left", shoulderFacetGeometry, shellHighlightMaterial, housingPivot, false);
	leftShoulderFacet.position.set(-.86, .72, 0);
	leftShoulderFacet.rotation.z = -.12;
	leftShoulderFacet.userData.explodeWithParent = true;
	const rightShoulderFacet = kit.mesh("bubble-machine-upper-shoulder-facet-right", shoulderFacetGeometry, shellHighlightMaterial, housingPivot, false);
	rightShoulderFacet.position.set(.86, .72, 0);
	rightShoulderFacet.rotation.z = .12;
	rightShoulderFacet.userData.explodeWithParent = true;
	const shoulderHighlight = kit.mesh("bubble-machine-upper-shoulder-highlight", roundedPlate(1.86, .42, 1.455, .18), shellHighlightMaterial, housingPivot, false);
	shoulderHighlight.position.y = .72;
	shoulderHighlight.scale.z = .997;
	shoulderHighlight.userData.explodeWithParent = true;
	const lowerPanelRail = kit.mesh("bubble-machine-lower-panel-seam", roundedPlate(2.12, .045, 1.46, .018), accentDarkMaterial, housingPivot, false);
	lowerPanelRail.position.y = -.73;
	lowerPanelRail.userData.explodeWithParent = true;
	const footGeometry = roundedPlate(.36, .22, .42, .075);
	[
		[
			-.79,
			.12,
			.48,
			.08
		],
		[
			.79,
			.12,
			.48,
			-.08
		],
		[
			-.79,
			.12,
			-.48,
			-.08
		],
		[
			.79,
			.12,
			-.48,
			.08
		]
	].forEach(([x, y, z, tilt], index) => {
		const footPivot = kit.pivot(`bubble-machine-foot-pivot-${index + 1}`);
		footPivot.position.set(x, y, z);
		footPivot.rotation.z = tilt;
		const foot = kit.mesh(`bubble-machine-foot-${index + 1}`, footGeometry, accentMaterial, footPivot, false);
		foot.userData.part = `foot-${index + 1}`;
		const pad = kit.mesh(`bubble-machine-foot-pad-${index + 1}`, roundedPlate(.27, .035, .33, .015), mintMaterial, footPivot, false);
		pad.position.y = -.115;
		pad.userData.explodeWithParent = true;
	});
	const frontAssembly = kit.pivot("bubble-machine-front-assembly-pivot", housingPivot);
	frontAssembly.position.set(0, .25, .725);
	kit.socket("bubble-machine-front-axis-socket", frontAssembly, [
		0,
		0,
		.13
	]);
	kit.socket("bubble-machine-output-socket", frontAssembly, [
		-.76,
		.04,
		.29
	]);
	const cavityDisc = kit.mesh("bubble-machine-front-cavity", new CylinderGeometry(.8, .8, .07, 16), cavityMaterial, frontAssembly, false);
	cavityDisc.rotation.x = Math.PI * .5;
	cavityDisc.position.z = .025;
	const wheelPivot = kit.pivot("bubble-machine-bubble-wheel-pivot", frontAssembly);
	wheelPivot.position.z = .11;
	wheelPivot.userData.rotationAxis = [
		0,
		0,
		1
	];
	kit.socket("bubble-machine-bubble-emitter-socket", wheelPivot, [
		-.7,
		.04,
		.13
	]);
	const ringGeometry = new TorusGeometry(.13, .032, 5, 12);
	const ringInnerGeometry = new TorusGeometry(.102, .012, 4, 12);
	for (let index = 0; index < 8; index += 1) {
		const angle = index * Math.PI / 4 + Math.PI / 2;
		addRadialBar(kit, `bubble-machine-wheel-spoke-${index + 1}`, angle, .14, .47, 0, .022, mintMaterial, wheelPivot);
		const ringPivot = kit.pivot(`bubble-machine-bubble-ring-pivot-${index + 1}`, wheelPivot);
		ringPivot.position.set(Math.cos(angle) * .52, Math.sin(angle) * .52, .015);
		const ring = kit.mesh(`bubble-machine-bubble-ring-${index + 1}`, ringGeometry, accentLightMaterial, ringPivot, false);
		ring.userData.part = `bubble-ring-${index + 1}`;
		const innerRing = kit.mesh(`bubble-machine-bubble-ring-inner-${index + 1}`, ringInnerGeometry, accentDarkMaterial, ringPivot, false);
		innerRing.position.z = .006;
		innerRing.userData.explodeWithParent = true;
	}
	const wheelHub = kit.mesh("bubble-machine-wheel-hub", new CylinderGeometry(.17, .19, .12, 12), accentMaterial, wheelPivot);
	wheelHub.rotation.x = Math.PI * .5;
	wheelHub.position.z = .035;
	const hubCap = kit.mesh("bubble-machine-wheel-hub-cap", new CylinderGeometry(.045, .045, .018, 10), mintMaterial, wheelPivot, false);
	hubCap.rotation.x = Math.PI * .5;
	hubCap.position.z = .105;
	hubCap.userData.explodeWithParent = true;
	const transparentWindow = kit.mesh("bubble-machine-smoked-front-window", new CylinderGeometry(.82, .82, .026, 16), windowMaterial, frontAssembly, false);
	transparentWindow.rotation.x = Math.PI * .5;
	transparentWindow.position.z = .225;
	transparentWindow.renderOrder = 5;
	const outerRim = kit.mesh("bubble-machine-front-window-outer-rim", new TorusGeometry(.86, .075, 6, 20), accentMaterial, frontAssembly);
	outerRim.position.z = .23;
	const innerRim = kit.mesh("bubble-machine-front-window-inner-rim", new TorusGeometry(.78, .026, 5, 20), mintMaterial, frontAssembly, false);
	innerRim.position.z = .247;
	innerRim.userData.explodeWithParent = true;
	const dripTrayPivot = kit.pivot("bubble-machine-drip-tray-pivot", housingPivot);
	dripTrayPivot.position.set(0, -.58, .84);
	kit.socket("bubble-machine-drip-tray-socket", dripTrayPivot, [
		0,
		.02,
		0
	]);
	const dripTray = kit.mesh("bubble-machine-drip-tray", roundedPlate(.92, .34, .22, .12), accentMaterial, dripTrayPivot);
	dripTray.rotation.x = -.035;
	const dripLip = kit.mesh("bubble-machine-drip-tray-recessed-lip", roundedPlate(.68, .055, .18, .022), accentDarkMaterial, dripTrayPivot, false);
	dripLip.position.set(0, .11, .055);
	dripLip.userData.explodeWithParent = true;
	const controlPivot = kit.pivot("bubble-machine-control-knob-pivot", housingPivot);
	controlPivot.position.set(0, 1.2, .02);
	controlPivot.userData.rotationAxis = [
		0,
		1,
		0
	];
	kit.socket("bubble-machine-control-socket", controlPivot, [
		0,
		0,
		0
	]);
	const controlKnob = kit.mesh("bubble-machine-control-knob", new CylinderGeometry(.22, .22, .13, 12), accentMaterial, controlPivot);
	controlKnob.userData.part = "top-control-knob";
	const controlIndex = kit.mesh("bubble-machine-control-index", roundedPlate(.05, .025, .26, .01), mintMaterial, controlPivot, false);
	controlIndex.position.y = .075;
	controlIndex.userData.explodeWithParent = true;
	kit.indicator([
		0,
		2.26,
		.735
	], .028);
	const reservoirPivot = kit.pivot("bubble-machine-liquid-reservoir-pivot", housingPivot);
	reservoirPivot.position.set(1.08, .06, -.27);
	kit.socket("bubble-machine-reservoir-attachment-socket", housingPivot, [
		.94,
		.06,
		-.27
	]);
	kit.socket("bubble-machine-reservoir-fluid-socket", reservoirPivot, [
		-.17,
		-.48,
		0
	]);
	const reservoirBracket = kit.mesh("bubble-machine-reservoir-bracket-inferred", roundedPlate(.19, .78, .36, .08), accentDarkMaterial, reservoirPivot, false);
	reservoirBracket.position.x = -.12;
	const reservoir = kit.mesh("bubble-machine-translucent-liquid-reservoir", roundedPlate(.52, 1.22, .72, .18), reservoirMaterial, reservoirPivot, false);
	reservoir.position.x = .08;
	reservoir.renderOrder = 3;
	const fillLevel = kit.mesh("bubble-machine-reservoir-fill-level", roundedPlate(.42, .42, .61, .13), liquidFillMaterial, reservoirPivot, false);
	fillLevel.position.set(.08, -.32, 0);
	fillLevel.userData.explodeWithParent = true;
	kit.mesh("bubble-machine-reservoir-fill-cap", new CylinderGeometry(.16, .18, .12, 12), accentMaterial, reservoirPivot).position.set(.08, .68, 0);
	const ventGeometry = roundedPlate(.035, .28, .075, .016);
	for (let index = 0; index < 7; index += 1) {
		const sideVent = kit.mesh(`bubble-machine-side-vent-${index + 1}`, ventGeometry, hardwareMaterial, housingPivot, false);
		sideVent.rotation.y = Math.PI * .5;
		sideVent.position.set(1.085, -.55, -.32 + index * .105);
		sideVent.userData.explodeWithParent = true;
	}
	const rearAssembly = kit.pivot("bubble-machine-rear-fan-assembly-pivot", housingPivot);
	rearAssembly.position.set(0, .18, -.73);
	kit.socket("bubble-machine-rear-fan-axis-socket", rearAssembly, [
		0,
		0,
		-.06
	]);
	const rearCavity = kit.mesh("bubble-machine-rear-fan-cavity", new CylinderGeometry(.59, .59, .055, 16), cavityMaterial, rearAssembly, false);
	rearCavity.rotation.x = Math.PI * .5;
	rearCavity.position.z = -.015;
	const rearFanPivot = kit.pivot("bubble-machine-rear-fan-rotor-pivot", rearAssembly);
	rearFanPivot.position.z = -.075;
	rearFanPivot.userData.rotationAxis = [
		0,
		0,
		1
	];
	const sharedBladeGeometry = fanBladeGeometry();
	for (let index = 0; index < 5; index += 1) {
		const bladePivot = kit.pivot(`bubble-machine-rear-fan-blade-pivot-${index + 1}`, rearFanPivot);
		bladePivot.rotation.z = index * Math.PI * 2 / 5;
		const blade = kit.mesh(`bubble-machine-rear-fan-blade-${index + 1}`, sharedBladeGeometry, accentDarkMaterial, bladePivot, false);
		blade.rotation.z = -.28;
	}
	const rearHub = kit.mesh("bubble-machine-rear-fan-hub", new CylinderGeometry(.2, .2, .1, 12), mintMaterial, rearFanPivot);
	rearHub.rotation.x = Math.PI * .5;
	const grillePivot = kit.pivot("bubble-machine-rear-fan-grille-pivot", rearAssembly);
	grillePivot.position.z = -.14;
	[
		.25,
		.37,
		.49,
		.59
	].forEach((radius, index) => {
		const ring = kit.mesh(`bubble-machine-rear-grille-ring-${index + 1}`, new TorusGeometry(radius, index === 3 ? .035 : .022, 5, 20), accentMaterial, grillePivot, false);
		ring.userData.explodeWithParent = true;
	});
	for (let index = 0; index < 8; index += 1) addRadialBar(kit, `bubble-machine-rear-grille-spoke-${index + 1}`, index * Math.PI / 4, .2, .58, .002, .017, accentMaterial, grillePivot).userData.explodeWithParent = true;
	const rearGrilleCap = kit.mesh("bubble-machine-rear-grille-center-cap", new CylinderGeometry(.21, .21, .075, 12), accentMaterial, grillePivot);
	rearGrilleCap.rotation.x = Math.PI * .5;
	const fastenerGeometry = new SphereGeometry(.052, 10, 7);
	[
		[-.73, .72],
		[.73, .72],
		[-.73, -.65],
		[.73, -.65]
	].forEach(([x, y], index) => {
		const fastener = kit.mesh(`bubble-machine-rear-fastener-${index + 1}`, fastenerGeometry, hardwareMaterial, housingPivot, false);
		fastener.scale.z = .38;
		fastener.position.set(x, y + .08, -.743);
		fastener.userData.explodeWithParent = true;
	});
	kit.mesh("bubble-machine-power-inlet-inferred", roundedPlate(.27, .2, .055, .045), accentDarkMaterial, housingPivot).position.set(.66, -.72, -.738);
	kit.mesh("bubble-machine-power-inlet-cavity", roundedPlate(.17, .105, .02, .026), cavityMaterial, housingPivot, false).position.set(.66, -.72, -.771);
	kit.socket("bubble-machine-power-connection-socket", housingPivot, [
		.66,
		-.72,
		-.79
	]);
	addBubblePerformanceRig(kit, [
		-.76,
		1.53,
		1.015
	]);
	applyBubbleMachineOutlineHierarchy(kit.root);
	const build = kit.finish({
		referencePath: options.referencePath ?? V2_REFERENCE_PATH,
		reconstructed: [
			"rounded cream housing with broad shoulder radius, lower panel seam and four separate Sakura-pink feet",
			"layered front cavity, smoked transparent cover, thick double rim and independent drip tray",
			"front rotor with exactly eight named spokes, eight named bubble rings and a concentric hub cap",
			"right-rear translucent liquid reservoir with fill level, cap, inferred overlap bracket and fluid socket",
			"seven side ventilation slots and rear fan rotor behind four concentric grille rings and eight grille spokes",
			"four rear fasteners, inferred rear-lower power inlet and named power connection socket",
			"forty-eight pooled semi-transparent spherical bubbles in four clear size classes, layered iridescent film arcs and soft volumetric highlights",
			"one late giant bubble with a pre-exit volumetric burst of four mini bubbles and four light points"
		],
		inferred: [
			"internal pump, motor, wheel gearing, liquid tubing and electrical wiring are hidden and intentionally omitted",
			"reservoir hanger/valve depth is represented by a shallow overlap bracket because its rear face is occluded",
			"power inlet position and connector profile are inferred at the rear-lower shell because no port is shown",
			"fan blade camber, internal axle bearings and underside fasteners are inferred from exterior silhouettes"
		]
	});
	build.root.userData.sculptRuntime.colliders = [
		{
			id: "bubble-machine-body",
			type: "box",
			node: "bubble-machine-housing-shell"
		},
		{
			id: "bubble-machine-reservoir",
			type: "box",
			node: "bubble-machine-translucent-liquid-reservoir"
		},
		{
			id: "bubble-machine-front-assembly",
			type: "cylinder",
			node: "bubble-machine-front-assembly-pivot"
		}
	];
	build.root.userData.sculptRuntime.destructionGroups = [
		{
			id: "body-shell",
			nodes: ["bubble-machine-housing-shell"]
		},
		{
			id: "front-wheel",
			nodes: ["bubble-machine-front-assembly-pivot"]
		},
		{
			id: "liquid-reservoir",
			nodes: ["bubble-machine-liquid-reservoir-pivot"]
		},
		{
			id: "rear-fan",
			nodes: ["bubble-machine-rear-fan-assembly-pivot"]
		},
		{
			id: "floor-supports",
			nodes: [
				"bubble-machine-foot-pivot-1",
				"bubble-machine-foot-pivot-2",
				"bubble-machine-foot-pivot-3",
				"bubble-machine-foot-pivot-4"
			]
		},
		{
			id: "controls-and-tray",
			nodes: ["bubble-machine-control-knob-pivot", "bubble-machine-drip-tray-pivot"]
		}
	];
	build.root.userData.activeDuration = ACTIVE_DURATION;
	build.root.userData.visualRevision = "sakura-bubble-machine-v2";
	build.root.userData.legacyReferencePath = REFERENCE_PATH;
	build.root.userData.previewLightingProfile = "sakura-appliance-v2";
	build.root.userData.outlineContract = {
		main: .0048,
		structure: .0041,
		detail: .0033,
		variation: .18,
		stable: true
	};
	applyBubbleMachineOutlineHierarchy(build.root);
	return build;
}
//#endregion
export { createBubbleMachineModel as n, bubbleMachine_exports as t };

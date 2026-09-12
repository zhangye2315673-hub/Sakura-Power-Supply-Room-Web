import { A as DodecahedronGeometry, Dt as Object3D, G as IcosahedronGeometry, H as Group, I as ExtrudeGeometry, It as Quaternion, J as InstancedMesh, Jn as TetrahedronGeometry, L as Float32BufferAttribute, Ln as Shape, Pn as Scene, Pt as PointLight, Qn as TubeGeometry, St as MeshToonMaterial, Zn as TorusKnotGeometry, a as BufferAttribute, bt as MeshPhysicalMaterial, dr as Vector3, ft as MathUtils, ht as Mesh, i as BoxGeometry, l as CapsuleGeometry, o as BufferGeometry, p as Color, u as CatmullRomCurve3, xt as MeshStandardMaterial, yt as MeshLambertMaterial } from "./three.core-DlTOC7bx.js";
import { r as PMREMGenerator } from "./palette-knpLSfXB.js";
//#region node_modules/three/examples/jsm/environments/RoomEnvironment.js
/**
* This class represents a scene with a basic room setup that can be used as
* input for {@link PMREMGenerator#fromScene}. The resulting PMREM represents the room's
* lighting and can be used for Image Based Lighting by assigning it to {@link Scene#environment}
* or directly as an environment map to PBR materials.
*
* The implementation is based on the [EnvironmentScene](https://github.com/google/model-viewer/blob/master/packages/model-viewer/src/three-components/EnvironmentScene.ts)
* component from the `model-viewer` project.
*
* ```js
* const environment = new RoomEnvironment();
* const pmremGenerator = new THREE.PMREMGenerator( renderer );
*
* const envMap = pmremGenerator.fromScene( environment ).texture;
* scene.environment = envMap;
* ```
*
* @augments Scene
* @three_import import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
*/
var RoomEnvironment = class extends Scene {
	constructor() {
		super();
		this.name = "RoomEnvironment";
		this.position.y = -3.5;
		const geometry = new BoxGeometry();
		geometry.deleteAttribute("uv");
		const roomMaterial = new MeshStandardMaterial({ side: 1 });
		const boxMaterial = new MeshStandardMaterial();
		const mainLight = new PointLight(16777215, 900, 28, 2);
		mainLight.position.set(.418, 16.199, .3);
		this.add(mainLight);
		const room = new Mesh(geometry, roomMaterial);
		room.position.set(-.757, 13.219, .717);
		room.scale.set(31.713, 28.305, 28.591);
		this.add(room);
		const boxes = new InstancedMesh(geometry, boxMaterial, 6);
		const transform = new Object3D();
		transform.position.set(-10.906, 2.009, 1.846);
		transform.rotation.set(0, -.195, 0);
		transform.scale.set(2.328, 7.905, 4.651);
		transform.updateMatrix();
		boxes.setMatrixAt(0, transform.matrix);
		transform.position.set(-5.607, -.754, -.758);
		transform.rotation.set(0, .994, 0);
		transform.scale.set(1.97, 1.534, 3.955);
		transform.updateMatrix();
		boxes.setMatrixAt(1, transform.matrix);
		transform.position.set(6.167, .857, 7.803);
		transform.rotation.set(0, .561, 0);
		transform.scale.set(3.927, 6.285, 3.687);
		transform.updateMatrix();
		boxes.setMatrixAt(2, transform.matrix);
		transform.position.set(-2.017, .018, 6.124);
		transform.rotation.set(0, .333, 0);
		transform.scale.set(2.002, 4.566, 2.064);
		transform.updateMatrix();
		boxes.setMatrixAt(3, transform.matrix);
		transform.position.set(2.291, -.756, -2.621);
		transform.rotation.set(0, -.286, 0);
		transform.scale.set(1.546, 1.552, 1.496);
		transform.updateMatrix();
		boxes.setMatrixAt(4, transform.matrix);
		transform.position.set(-2.193, -.369, -5.547);
		transform.rotation.set(0, .516, 0);
		transform.scale.set(3.875, 3.487, 2.986);
		transform.updateMatrix();
		boxes.setMatrixAt(5, transform.matrix);
		this.add(boxes);
		const light1 = new Mesh(geometry, createAreaLightMaterial(50));
		light1.position.set(-16.116, 14.37, 8.208);
		light1.scale.set(.1, 2.428, 2.739);
		this.add(light1);
		const light2 = new Mesh(geometry, createAreaLightMaterial(50));
		light2.position.set(-16.109, 18.021, -8.207);
		light2.scale.set(.1, 2.425, 2.751);
		this.add(light2);
		const light3 = new Mesh(geometry, createAreaLightMaterial(17));
		light3.position.set(14.904, 12.198, -1.832);
		light3.scale.set(.15, 4.265, 6.331);
		this.add(light3);
		const light4 = new Mesh(geometry, createAreaLightMaterial(43));
		light4.position.set(-.462, 8.89, 14.52);
		light4.scale.set(4.38, 5.441, .088);
		this.add(light4);
		const light5 = new Mesh(geometry, createAreaLightMaterial(20));
		light5.position.set(3.235, 11.486, -12.541);
		light5.scale.set(2.5, 2, .1);
		this.add(light5);
		const light6 = new Mesh(geometry, createAreaLightMaterial(100));
		light6.position.set(0, 20, 0);
		light6.scale.set(1, .1, 1);
		this.add(light6);
	}
	/**
	* Frees internal resources. This method should be called
	* when the environment is no longer required.
	*/
	dispose() {
		const resources = /* @__PURE__ */ new Set();
		this.traverse((object) => {
			if (object.isMesh) {
				resources.add(object.geometry);
				resources.add(object.material);
			}
		});
		for (const resource of resources) resource.dispose();
	}
};
function createAreaLightMaterial(intensity) {
	return new MeshLambertMaterial({
		color: 0,
		emissive: 16777215,
		emissiveIntensity: intensity
	});
}
//#endregion
//#region src/style/jelly.ts
/** Pigmented gel: transmission carries the background, opacity remains available
* to the existing mechanical animation's appear/fade/reset timeline. */
function jelly(options) {
	const pigment = new Color(options.color);
	const material = new MeshPhysicalMaterial({
		color: pigment,
		metalness: 0,
		roughness: .19,
		ior: 1.36,
		transmission: .88,
		thickness: options.thickness ?? .55,
		attenuationColor: pigment.clone().lerp(new Color(16777215), .3),
		attenuationDistance: .8,
		clearcoat: 1,
		clearcoatRoughness: .13,
		specularIntensity: .85,
		envMapIntensity: .8,
		emissive: options.emissive ?? 0,
		emissiveIntensity: options.emissiveIntensity ?? 0,
		transparent: options.transparent ?? true,
		opacity: options.opacity ?? .86,
		depthWrite: !(options.transparent ?? false)
	});
	material.name = "sakura-jelly";
	material.userData.jelly = true;
	return material;
}
/** One small PMREM per renderer; broad studio cards give wet edges even on
* small devices. The environment is lighting only, never a background swap. */
function installJellyEnvironment(renderer, scene) {
	const room = new RoomEnvironment();
	const pmrem = new PMREMGenerator(renderer);
	const target = pmrem.fromScene(room, .03, .1, 100);
	room.dispose();
	pmrem.dispose();
	const previous = scene.environment;
	scene.environment = target.texture;
	renderer.transmissionResolutionScale = .5;
	return () => {
		if (scene.environment === target.texture) scene.environment = previous;
		target.dispose();
	};
}
/** Cable gel shares pigment across the body and plug, with a quiet surface
* reflection so dense crossings retain their color and transmitted depth. */
function cableJelly(options) {
	const material = jelly(options);
	material.roughness = .24;
	material.clearcoat = .04;
	material.clearcoatRoughness = .35;
	material.specularIntensity = .12;
	material.envMapIntensity = .1;
	material.transmission = .12;
	material.attenuationColor.copy(material.color);
	material.attenuationDistance = Math.max(.025, (options.thickness ?? .12) * .7);
	material.transparent = true;
	material.opacity = (options.opacity ?? 1) * .97;
	material.depthWrite = true;
	const compile = material.onBeforeCompile.bind(material);
	material.onBeforeCompile = (shader, renderer) => {
		compile(shader, renderer);
		shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>", `#include <color_fragment>
      float cablePigmentFloor = min(diffuseColor.r, min(diffuseColor.g, diffuseColor.b));
      diffuseColor.rgb = clamp(mix(vec3(cablePigmentFloor), diffuseColor.rgb, 1.4) * 0.72, 0.0, 1.0);
    `).replace("#include <lights_fragment_end>", `#include <lights_fragment_end>
      // Dim the diffuse body without changing its pigment or transmission.
      // Bright yellow has high luminance in both red and green channels;
      // compress those bright pigments further while preserving their hue.
      float cableLuminance = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
      float cableBrightness = mix(0.78, 0.58, smoothstep(0.22, 0.6, cableLuminance));
      reflectedLight.directDiffuse *= 0.62 * cableBrightness;
      reflectedLight.indirectDiffuse *= 0.72 * cableBrightness;
    `);
		shader.fragmentShader = shader.fragmentShader.replace("#include <opaque_fragment>", `
      float gelEdge = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 1.6);
      diffuseColor.a *= mix(0.98, 1.0, gelEdge);
      #include <opaque_fragment>
    `);
	};
	material.customProgramCacheKey = () => "cable-gel-pigmented-v5";
	material.userData.cableJelly = true;
	return material;
}
//#endregion
//#region src/appliances/performance/PrinterPaperProfiles.ts
/**
* Five authored pseudo-random paper personalities. Keeping the values fixed
* makes review and reset deterministic, while the unequal launches, loop
* sizes, lanes, landing points and durations avoid a duplicated stream.
*/
var PRINTER_PAPER_PROFILES = Object.freeze([
	{
		id: "center-medium",
		launchTime: .12,
		flightDuration: 6.3,
		feedEnd: .09,
		glideEnd: .38,
		feedForwardDistance: 2,
		feedLaunchBias: .36,
		loopVerticalRadius: .96,
		loopDepthRadius: .52,
		loopForwardDrift: 1.05,
		loopTopSlowdown: .18,
		loopLateralOffset: 0,
		loopLateralSwing: 0,
		fallLateralTarget: 0,
		fallLateralSway: 0,
		fallDepthDirection: 1,
		leafDepthAmplitude: 1.27,
		fallDropDistance: 7.85,
		fallFirstStop: .2,
		fallSecondStop: .6,
		fallFirstStopDrop: .06,
		fallSecondStopDrop: .34,
		leafVelocityPitch: .46,
		leafReactionPitch: .28,
		fallRoll: 0
	},
	{
		id: "left-wide-fast",
		launchTime: .84,
		flightDuration: 5.2,
		feedEnd: .105,
		glideEnd: .39,
		feedForwardDistance: 2.7,
		feedLaunchBias: .43,
		loopVerticalRadius: 1.25,
		loopDepthRadius: .75,
		loopForwardDrift: .88,
		loopTopSlowdown: .14,
		loopLateralOffset: -.55,
		loopLateralSwing: -.35,
		fallLateralTarget: -1.45,
		fallLateralSway: .25,
		fallDepthDirection: -1,
		leafDepthAmplitude: 1.55,
		fallDropDistance: 8,
		fallFirstStop: .18,
		fallSecondStop: .55,
		fallFirstStopDrop: .08,
		fallSecondStopDrop: .38,
		leafVelocityPitch: .52,
		leafReactionPitch: .3,
		fallRoll: .18
	},
	{
		id: "right-tight-slow",
		launchTime: 1.68,
		flightDuration: 7,
		feedEnd: .08,
		glideEnd: .36,
		feedForwardDistance: 1.75,
		feedLaunchBias: .31,
		loopVerticalRadius: .72,
		loopDepthRadius: .36,
		loopForwardDrift: 1.42,
		loopTopSlowdown: .22,
		loopLateralOffset: .46,
		loopLateralSwing: .22,
		fallLateralTarget: 1.18,
		fallLateralSway: -.18,
		fallDepthDirection: 1,
		leafDepthAmplitude: 1.02,
		fallDropDistance: 7.9,
		fallFirstStop: .24,
		fallSecondStop: .64,
		fallFirstStopDrop: .045,
		fallSecondStopDrop: .28,
		leafVelocityPitch: .4,
		leafReactionPitch: .24,
		fallRoll: -.13
	},
	{
		id: "right-high-fast",
		launchTime: 2.61,
		flightDuration: 5.55,
		feedEnd: .115,
		glideEnd: .42,
		feedForwardDistance: 2.9,
		feedLaunchBias: .48,
		loopVerticalRadius: 1.4,
		loopDepthRadius: .88,
		loopForwardDrift: 1.18,
		loopTopSlowdown: .12,
		loopLateralOffset: .22,
		loopLateralSwing: .46,
		fallLateralTarget: 1.6,
		fallLateralSway: .32,
		fallDepthDirection: -1,
		leafDepthAmplitude: 1.72,
		fallDropDistance: 8.15,
		fallFirstStop: .17,
		fallSecondStop: .53,
		fallFirstStopDrop: .1,
		fallSecondStopDrop: .42,
		leafVelocityPitch: .56,
		leafReactionPitch: .32,
		fallRoll: .21
	},
	{
		id: "left-drifter-slow",
		launchTime: 3.37,
		flightDuration: 6.55,
		feedEnd: .095,
		glideEnd: .4,
		feedForwardDistance: 2.25,
		feedLaunchBias: .38,
		loopVerticalRadius: 1.08,
		loopDepthRadius: .58,
		loopForwardDrift: .72,
		loopTopSlowdown: .2,
		loopLateralOffset: -.35,
		loopLateralSwing: .28,
		fallLateralTarget: -.9,
		fallLateralSway: -.42,
		fallDepthDirection: 1,
		leafDepthAmplitude: 1.35,
		fallDropDistance: 7.95,
		fallFirstStop: .22,
		fallSecondStop: .62,
		fallFirstStopDrop: .07,
		fallSecondStopDrop: .32,
		leafVelocityPitch: .48,
		leafReactionPitch: .27,
		fallRoll: -.2
	}
]);
var latestPaperExit = Math.max(...PRINTER_PAPER_PROFILES.map((profile) => profile.launchTime + profile.flightDuration));
var PRINTER_PAPER_STOP_END = Number((latestPaperExit + .5).toFixed(2));
//#endregion
//#region src/appliances/poweredAnimation.ts
/** Default activation window used by appliances without an authored override. */
var POWERED_ACTIVE_DURATION = 5.2;
var PRINTER_POWERED_ACTIVE_DURATION = PRINTER_PAPER_STOP_END;
/** Washer skill presentation lasts 6.6s; keep its appliance alive past the final regroup frame. */
var WASHER_POWERED_ACTIVE_DURATION = 6.75;
var POWERED_WIND_DOWN_DURATION = .55;
function poweredActiveDuration(kind) {
	if (kind === "printer") return PRINTER_POWERED_ACTIVE_DURATION;
	if (kind === "washer") return WASHER_POWERED_ACTIVE_DURATION;
	return POWERED_ACTIVE_DURATION;
}
function poweredPreviewCycleDuration(kind) {
	return poweredActiveDuration(kind) + 1.8999999999999995;
}
function poweredAnimationState(elapsed, kind) {
	const time = Math.max(0, elapsed);
	const activeDuration = poweredActiveDuration(kind);
	const active = time < activeDuration;
	return {
		time,
		power: active ? Math.max(0, Math.min(1, (activeDuration - time) / POWERED_WIND_DOWN_DURATION)) : 0,
		active
	};
}
var HAIR_DRYER_RELEASE_TIME = 4.18;
var HAIR_DRYER_OFFSCREEN_TIME = 5.12;
var HAIR_DRYER_RIBBON_PROFILES = [
	{
		anchor: [
			-2.445,
			-.34,
			-.1
		],
		length: 5.65,
		width: .25,
		thickness: .04,
		amplitudeY: .27,
		amplitudeZ: .18,
		frequency: 7.4,
		waveNumber: 9.7,
		phase: .25,
		twist: 7.2,
		bend: .16,
		turbulence: .085,
		releaseSpeed: 6.8,
		releaseLift: 3.4,
		releaseSide: -1.8,
		releaseGravity: 9.2,
		releaseCurl: 1.15,
		releaseSpin: 4.8,
		seed: .71
	},
	{
		anchor: [
			-2.445,
			-.17,
			.08
		],
		length: 6.1,
		width: .21,
		thickness: .034,
		amplitudeY: .34,
		amplitudeZ: .14,
		frequency: 8.6,
		waveNumber: 11.3,
		phase: 1.46,
		twist: -8.4,
		bend: -.2,
		turbulence: .105,
		releaseSpeed: 5.4,
		releaseLift: -2.2,
		releaseSide: 2.2,
		releaseGravity: 12.6,
		releaseCurl: 1.35,
		releaseSpin: -6.1,
		seed: 1.93
	},
	{
		anchor: [
			-2.445,
			0,
			-.04
		],
		length: 6.45,
		width: .27,
		thickness: .046,
		amplitudeY: .22,
		amplitudeZ: .24,
		frequency: 6.8,
		waveNumber: 8.8,
		phase: 2.82,
		twist: 9.1,
		bend: .25,
		turbulence: .072,
		releaseSpeed: 7.3,
		releaseLift: 1.9,
		releaseSide: .7,
		releaseGravity: 10.1,
		releaseCurl: .95,
		releaseSpin: 5.5,
		seed: 3.17
	},
	{
		anchor: [
			-2.445,
			.18,
			.09
		],
		length: 5.85,
		width: .19,
		thickness: .032,
		amplitudeY: .38,
		amplitudeZ: .16,
		frequency: 9.2,
		waveNumber: 12.6,
		phase: 4.08,
		twist: -10.2,
		bend: -.14,
		turbulence: .118,
		releaseSpeed: 4.9,
		releaseLift: -3.1,
		releaseSide: -2.5,
		releaseGravity: 14.2,
		releaseCurl: 1.5,
		releaseSpin: -7.2,
		seed: 4.61
	},
	{
		anchor: [
			-2.445,
			.35,
			-.08
		],
		length: 6.25,
		width: .23,
		thickness: .038,
		amplitudeY: .29,
		amplitudeZ: .21,
		frequency: 7.9,
		waveNumber: 10.4,
		phase: 5.31,
		twist: 8,
		bend: .19,
		turbulence: .096,
		releaseSpeed: 6.1,
		releaseLift: 2.7,
		releaseSide: 2.7,
		releaseGravity: 10.8,
		releaseCurl: 1.25,
		releaseSpin: 6.4,
		seed: 5.87
	}
];
var tempCenters = Array.from({ length: 31 }, () => new Vector3());
var tangent = new Vector3();
var widthAxis = new Vector3();
var thicknessAxis = new Vector3();
var referenceUp = new Vector3(0, 1, 0);
var twistQuaternion = new Quaternion();
var firstCenter = new Vector3();
var releaseAnchored = new Vector3();
var releaseReleased = new Vector3();
function smoothstep(value, min, max) {
	return MathUtils.smoothstep(value, min, max);
}
function sampleCenter(profile, time, s, deployment, output) {
	const releasedFor = Math.max(0, time - HAIR_DRYER_RELEASE_TIME);
	const waveTime = Math.min(time, HAIR_DRYER_RELEASE_TIME) + releasedFor * .72;
	const amplitudeGate = smoothstep(s, .015, .34) * deployment;
	const phase = waveTime * profile.frequency - s * profile.waveNumber + profile.phase;
	const secondary = waveTime * (profile.frequency * 1.67) - s * (profile.waveNumber * 2.13) + profile.seed * 2.7;
	const tertiary = waveTime * (profile.frequency * .47) - s * 5.4 + profile.seed * 4.9;
	const sCurve = Math.sin(s * Math.PI * 2) * profile.bend;
	const turbulence = (Math.sin(secondary) * .58 + Math.sin(secondary * .43 + tertiary) * .29 + Math.cos(tertiary * 1.31) * .13) * profile.turbulence;
	output.set(profile.anchor[0] - profile.length * s * deployment + Math.sin(phase * .51 + profile.seed) * .075 * amplitudeGate, profile.anchor[1] + (Math.sin(phase) * profile.amplitudeY + sCurve + turbulence) * amplitudeGate, profile.anchor[2] + (Math.cos(phase * .83 + profile.seed) * profile.amplitudeZ + Math.sin(secondary * .74) * profile.turbulence) * amplitudeGate);
	if (releasedFor > 0) {
		const windTravel = releasedFor * (profile.releaseSpeed - releasedFor * (.62 + profile.seed * .025));
		const gravityDrop = .5 * profile.releaseGravity * releasedFor * releasedFor;
		const flexGate = releasedFor * (.28 + smoothstep(s, 0, .72) * .72);
		const releasePhase = releasedFor * (6.2 + profile.seed * .24) + s * (5.4 + profile.releaseCurl);
		output.x -= windTravel;
		output.x += Math.sin(releasePhase * .78 + profile.phase) * profile.releaseCurl * .24 * flexGate;
		output.y += profile.releaseLift * releasedFor;
		output.y -= gravityDrop * (.72 + s * .28);
		output.y += Math.sin(releasePhase + profile.phase) * profile.releaseCurl * .72 * flexGate;
		output.z += profile.releaseSide * releasedFor;
		output.z += Math.cos(releasePhase * 1.17 - profile.phase) * profile.releaseCurl * .68 * flexGate;
	}
	return output;
}
function writeSolidRibbon(geometry, profile, time, deployment) {
	const position = geometry.getAttribute("position");
	for (let segment = 0; segment <= 30; segment += 1) sampleCenter(profile, time, segment / 30, deployment, tempCenters[segment]);
	for (let segment = 0; segment <= 30; segment += 1) {
		const s = segment / 30;
		const before = tempCenters[Math.max(0, segment - 1)];
		const after = tempCenters[Math.min(30, segment + 1)];
		tangent.copy(after).sub(before).normalize();
		widthAxis.copy(referenceUp).addScaledVector(tangent, -referenceUp.dot(tangent)).normalize();
		if (widthAxis.lengthSq() < .1) widthAxis.set(0, 0, 1);
		thicknessAxis.crossVectors(tangent, widthAxis).normalize();
		const releaseTwist = Math.max(0, time - HAIR_DRYER_RELEASE_TIME) * profile.releaseSpin;
		const twist = s * profile.twist + Math.sin(time * 1.9 - s * 5.2 + profile.phase) * .42 * smoothstep(s, .02, .35) + releaseTwist * smoothstep(s, 0, .65);
		twistQuaternion.setFromAxisAngle(tangent, twist);
		widthAxis.applyQuaternion(twistQuaternion);
		thicknessAxis.crossVectors(tangent, widthAxis).normalize();
		const halfWidth = profile.width * (1 - s * .18) * .5;
		const halfThickness = profile.thickness * (1 - s * .08) * .5;
		const center = tempCenters[segment];
		const vertex = segment * 4;
		position.setXYZ(vertex, center.x + widthAxis.x * halfWidth + thicknessAxis.x * halfThickness, center.y + widthAxis.y * halfWidth + thicknessAxis.y * halfThickness, center.z + widthAxis.z * halfWidth + thicknessAxis.z * halfThickness);
		position.setXYZ(vertex + 1, center.x - widthAxis.x * halfWidth + thicknessAxis.x * halfThickness, center.y - widthAxis.y * halfWidth + thicknessAxis.y * halfThickness, center.z - widthAxis.z * halfWidth + thicknessAxis.z * halfThickness);
		position.setXYZ(vertex + 2, center.x - widthAxis.x * halfWidth - thicknessAxis.x * halfThickness, center.y - widthAxis.y * halfWidth - thicknessAxis.y * halfThickness, center.z - widthAxis.z * halfWidth - thicknessAxis.z * halfThickness);
		position.setXYZ(vertex + 3, center.x + widthAxis.x * halfWidth - thicknessAxis.x * halfThickness, center.y + widthAxis.y * halfWidth - thicknessAxis.y * halfThickness, center.z + widthAxis.z * halfWidth - thicknessAxis.z * halfThickness);
	}
	position.needsUpdate = true;
	geometry.computeVertexNormals();
	geometry.computeBoundingSphere();
}
function createHairDryerRibbonGeometry(profileIndex) {
	const geometry = new BufferGeometry();
	geometry.setAttribute("position", new Float32BufferAttribute(/* @__PURE__ */ new Float32Array(372), 3));
	const indices = [];
	for (let segment = 0; segment < 30; segment += 1) {
		const current = segment * 4;
		const next = (segment + 1) * 4;
		for (let face = 0; face < 4; face += 1) {
			const faceNext = (face + 1) % 4;
			indices.push(current + face, next + face, next + faceNext);
			indices.push(current + face, next + faceNext, current + faceNext);
		}
	}
	indices.push(0, 2, 1, 0, 3, 2);
	const end = 120;
	indices.push(end, 121, 122, end, 122, 123);
	geometry.setIndex(indices);
	Object.defineProperty(geometry, "type", {
		value: "HairDryerDynamicSolidRibbonGeometry",
		configurable: true
	});
	geometry.userData.profileIndex = profileIndex;
	geometry.userData.crossSection = "rectangular-solid";
	geometry.userData.hasFrontBackAndEdgeFaces = true;
	writeSolidRibbon(geometry, HAIR_DRYER_RIBBON_PROFILES[profileIndex], 0, .012);
	return geometry;
}
function ribbonMeshes(root) {
	const result = [];
	root.traverse((object) => {
		if (object instanceof Mesh && /^hair-dryer-solid-wind-ribbon-\d+$/.test(object.name)) result.push(object);
	});
	return result.sort((a, b) => a.name.localeCompare(b.name));
}
function ribbonFirstCenter(mesh, output) {
	const position = mesh.geometry.getAttribute("position");
	output.set(0, 0, 0);
	for (let corner = 0; corner < 4; corner += 1) {
		output.x += position.getX(corner);
		output.y += position.getY(corner);
		output.z += position.getZ(corner);
	}
	return output.multiplyScalar(.25);
}
function ribbonFreeEndCenter(mesh, output) {
	const position = mesh.geometry.getAttribute("position");
	const start = position.count - 4;
	output.set(0, 0, 0);
	for (let corner = 0; corner < 4; corner += 1) {
		output.x += position.getX(start + corner);
		output.y += position.getY(start + corner);
		output.z += position.getZ(start + corner);
	}
	return output.multiplyScalar(.25);
}
function applyHairDryerPerformance(root, time, power) {
	const ribbons = ribbonMeshes(root);
	const deployment = Math.max(.012, smoothstep(time, .12, .68));
	const released = time >= HAIR_DRYER_RELEASE_TIME;
	const offscreen = time >= HAIR_DRYER_OFFSCREEN_TIME;
	let anchorMaxError = 0;
	let minRibbonY = Number.POSITIVE_INFINITY;
	let releaseSpread = 0;
	let visibleRibbonCount = 0;
	ribbons.forEach((mesh, index) => {
		const profile = HAIR_DRYER_RIBBON_PROFILES[index];
		writeSolidRibbon(mesh.geometry, profile, time, deployment);
		mesh.visible = time >= .1 && !offscreen && power > .001;
		if (mesh.visible) visibleRibbonCount += 1;
		const material = mesh.material;
		material.opacity = mesh.visible ? Math.min(.98, smoothstep(time, .1, .42) * (.88 + index * .018)) : 0;
		ribbonFirstCenter(mesh, firstCenter);
		if (!released) anchorMaxError = Math.max(anchorMaxError, firstCenter.distanceTo(new Vector3(...profile.anchor)));
		const position = mesh.geometry.getAttribute("position");
		for (let vertex = 0; vertex < position.count; vertex += 1) minRibbonY = Math.min(minRibbonY, position.getY(vertex));
	});
	let releaseContinuityError = 0;
	HAIR_DRYER_RIBBON_PROFILES.forEach((profile) => {
		sampleCenter(profile, HAIR_DRYER_RELEASE_TIME, 0, 1, releaseAnchored);
		sampleCenter(profile, HAIR_DRYER_RELEASE_TIME + Number.EPSILON, 0, 1, releaseReleased);
		releaseContinuityError = Math.max(releaseContinuityError, releaseAnchored.distanceTo(releaseReleased));
	});
	const releasedFor = Math.max(0, time - HAIR_DRYER_RELEASE_TIME);
	if (released) {
		const releaseCenters = ribbons.map((mesh) => {
			ribbonFreeEndCenter(mesh, firstCenter);
			return firstCenter.clone();
		});
		const centre = releaseCenters.reduce((sum, point) => sum.add(point), new Vector3()).multiplyScalar(1 / Math.max(1, releaseCenters.length));
		releaseSpread = Math.max(...releaseCenters.map((point) => point.distanceTo(centre)));
	}
	root.userData.hairDryerPerformanceDiagnostics = {
		time,
		phase: offscreen ? "offscreen" : released ? "released-flight" : time < .68 ? "spooling" : "anchored-wind",
		ribbonCount: ribbons.length,
		visibleRibbonCount,
		geometryType: "HairDryerDynamicSolidRibbonGeometry",
		crossSection: "rectangular-solid",
		usesPlaneOrLine: false,
		uniqueParameterSets: new Set(HAIR_DRYER_RIBBON_PROFILES.map((profile) => JSON.stringify(profile))).size,
		anchorMaxError,
		phaseLagSeconds: HAIR_DRYER_RIBBON_PROFILES.map((profile) => Number((profile.waveNumber * .5 / profile.frequency).toFixed(4))),
		released,
		releaseContinuityError,
		releasedTravel: releasedFor * (Math.max(...HAIR_DRYER_RIBBON_PROFILES.map((profile) => profile.releaseSpeed)) - releasedFor * .78),
		releaseSpread,
		releasedUpCount: HAIR_DRYER_RIBBON_PROFILES.filter((profile) => profile.releaseLift > 0).length,
		releasedDownCount: HAIR_DRYER_RIBBON_PROFILES.filter((profile) => profile.releaseLift < 0).length,
		releaseDirectionDiversity: new Set(HAIR_DRYER_RIBBON_PROFILES.map((profile) => `${profile.releaseSpeed}/${profile.releaseLift}/${profile.releaseSide}/${profile.releaseGravity}`)).size,
		minRibbonY: Number.isFinite(minRibbonY) ? minRibbonY : 0,
		recycledOffscreen: offscreen && visibleRibbonCount === 0,
		timelineOwner: "AppliancePerformanceSystem"
	};
}
function resetHairDryerPerformance(root) {
	ribbonMeshes(root).forEach((mesh, index) => {
		writeSolidRibbon(mesh.geometry, HAIR_DRYER_RIBBON_PROFILES[index], 0, .012);
		mesh.visible = false;
		const material = mesh.material;
		material.opacity = 0;
	});
	delete root.userData.hairDryerPerformanceDiagnostics;
}
//#endregion
//#region src/appliances/performance/PortableSpeakerPerformance.ts
var PORTABLE_SPEAKER_TIMELINE_OWNER = "AppliancePerformanceSystem";
var PORTABLE_SPEAKER_ACTIVE_DURATION = 5.45;
var PORTABLE_SPEAKER_BASS_BEATS = [
	{
		time: .38,
		strength: .44,
		waveSlot: 1,
		section: "groove"
	},
	{
		time: .88,
		strength: .56,
		waveSlot: 2,
		section: "groove"
	},
	{
		time: 1.34,
		strength: .69,
		waveSlot: 3,
		section: "build"
	},
	{
		time: 1.78,
		strength: .82,
		waveSlot: 4,
		section: "build"
	},
	{
		time: 2.2,
		strength: .88,
		waveSlot: 5,
		section: "build"
	},
	{
		time: 2.58,
		strength: .94,
		waveSlot: 6,
		section: "climax"
	},
	{
		time: 2.9,
		strength: 1,
		waveSlot: 7,
		section: "climax"
	},
	{
		time: 3.22,
		strength: 1.06,
		waveSlot: 8,
		section: "climax"
	},
	{
		time: 3.54,
		strength: 1.12,
		waveSlot: 1,
		section: "climax"
	},
	{
		time: 3.86,
		strength: 1.16,
		waveSlot: 2,
		section: "climax"
	},
	{
		time: 4.18,
		strength: 1.2,
		waveSlot: 3,
		section: "climax"
	},
	{
		time: 4.42,
		strength: 1.24,
		waveSlot: 4,
		section: "final"
	}
];
function pulse(time, start, peak, end) {
	return MathUtils.smoothstep(time, start, peak) * (1 - MathUtils.smoothstep(time, peak, end));
}
function phaseAt$1(time) {
	if (time < .3) return "startup";
	if (time < 1.2) return "groove";
	if (time < 2.5) return "build";
	if (time < 4.62) return "climax";
	if (time < 4.94) return "final-impact";
	if (time < 5.12) return "airborne";
	return "settle";
}
function meshMaterial$1(mesh) {
	if (Array.isArray(mesh.material)) return null;
	return mesh.material;
}
var grilleDummy = new Object3D();
function poseGrilleInstances(grille, time, amplitude) {
	const basePositions = grille.userData.basePositions;
	if (!Array.isArray(basePositions)) return 0;
	let maxOffset = 0;
	basePositions.forEach(([x, y, z], index) => {
		const dx = x + .22;
		const dy = y - 1.94;
		const radius = Math.hypot(dx, dy);
		const angle = Math.atan2(dy, dx);
		const delayedPhase = time * 27 - radius * 9.4 + angle * 1.35 + index % 3 * .16;
		const ripple = Math.sin(delayedPhase) * .5 + .5;
		const counterRipple = Math.sin(delayedPhase + Math.PI * .72);
		const zOffset = amplitude * (.18 + ripple * .82);
		const radialOffset = amplitude * .055 * counterRipple;
		const inverseRadius = radius > .001 ? 1 / radius : 0;
		grilleDummy.position.set(x + dx * inverseRadius * radialOffset, y + dy * inverseRadius * radialOffset, z + zOffset);
		grilleDummy.rotation.set(Math.PI * .5, 0, 0);
		grilleDummy.scale.set(1, 1 + ripple * amplitude * 2.1, 1);
		grilleDummy.updateMatrix();
		grille.setMatrixAt(index, grilleDummy.matrix);
		maxOffset = Math.max(maxOffset, Math.abs(zOffset));
	});
	grille.instanceMatrix.needsUpdate = true;
	return maxOffset;
}
/**
* One clean, whole-object low-frequency performance shared by gameplay and gallery.
* The caller restores the captured idle pose before every sample, so every transform
* here is deterministic and stop() can return to the exact authored model state.
*/
function applyPortableSpeakerPerformance(root, time, power) {
	const p = MathUtils.clamp(power, 0, 1);
	const whole = root.getObjectByName("portable-speaker-whole-machine-pivot");
	const driver = root.getObjectByName("portable-speaker-driver-pulse-pivot");
	const waveRoot = root.getObjectByName("portable-speaker-bass-wave-root");
	const grille = root.getObjectByName("portable-speaker-grille-perforations");
	const indicator = root.getObjectByName("portable-speaker-status-indicator");
	const driverGlow = root.getObjectByName("portable-speaker-powered-diaphragm-glow");
	let compression = 0;
	let expansion = 0;
	let rebound = 0;
	let dominantStrength = 0;
	let activeSection = null;
	PORTABLE_SPEAKER_BASS_BEATS.forEach((beat) => {
		const squeeze = pulse(time, beat.time - .105, beat.time, beat.time + .042) * beat.strength;
		const blast = pulse(time, beat.time + .018, beat.time + .098, beat.time + .205) * beat.strength;
		const settleAge = time - (beat.time + .13);
		const settle = settleAge > 0 && settleAge < .42 ? Math.sin(settleAge * 27) * Math.exp(-settleAge * 10.5) * beat.strength : 0;
		compression += squeeze;
		expansion += blast;
		rebound += settle;
		const weight = Math.max(squeeze, blast, Math.abs(settle) * .55);
		if (weight > dominantStrength) {
			dominantStrength = weight;
			activeSection = beat.section;
		}
	});
	compression = MathUtils.clamp(compression, 0, 1.28) * p;
	expansion = MathUtils.clamp(expansion, 0, 1.34) * p;
	rebound = MathUtils.clamp(rebound, -.55, .55) * p;
	const finalLift = pulse(time, 4.82, 4.98, 5.16) * .18 * p;
	const landingSquash = pulse(time, 5.14, 5.2, 5.3) * p;
	const landingSettleAge = time - 5.2;
	const landingSettle = landingSettleAge > 0 ? Math.sin(landingSettleAge * 31) * Math.exp(-landingSettleAge * 17) * p : 0;
	const buildGate = MathUtils.smoothstep(time, 1.55, 3.25) * (1 - MathUtils.smoothstep(time, 4.84, 5.28)) * p;
	if (whole) {
		const contractX = compression * .058;
		const contractY = compression * .046;
		const contractZ = compression * .052;
		const bloomX = expansion * .092;
		const bloomY = expansion * .071;
		const bloomZ = expansion * .086;
		whole.scale.set(1 - contractX + bloomX + rebound * .018 + landingSquash * .055, 1 - contractY + bloomY - rebound * .012 - landingSquash * .092 + landingSettle * .012, 1 - contractZ + bloomZ + rebound * .016 + landingSquash * .05);
		whole.position.y += finalLift + expansion * .024 + landingSettle * .018;
		whole.position.x += Math.sin(time * 5.4) * .018 * buildGate;
		whole.rotation.z += Math.sin(time * 4.7 + .35) * .012 * buildGate + landingSettle * .018;
	}
	const driverTravel = expansion * .225 - compression * .052 + rebound * .026 - landingSquash * .018;
	if (driver) {
		driver.position.z += driverTravel;
		const radialBloom = expansion * .045 - compression * .018 + rebound * .008;
		driver.scale.set(1 + radialBloom, 1 + radialBloom, 1 + expansion * .12);
	}
	const grilleAmplitude = MathUtils.clamp(expansion * .17 + compression * .075 + Math.abs(rebound) * .055, 0, .22);
	const grilleMaxOffset = grille ? poseGrilleInstances(grille, time, grilleAmplitude) : 0;
	if (driverGlow) {
		const material = meshMaterial$1(driverGlow);
		if (material) {
			const glow = MathUtils.clamp(expansion * .9 + compression * .25 + Math.max(0, rebound) * .3, 0, 1.35);
			material.opacity = glow * .58;
			material.emissive?.setHex(16744359);
			material.emissiveIntensity = glow * 1.65;
		}
	}
	const lightStrength = MathUtils.clamp(MathUtils.smoothstep(time, .18, .38) * .58 + expansion * .68 + compression * .24, 0, 1.35) * p;
	if (indicator) {
		const material = meshMaterial$1(indicator);
		if (material) {
			material.color.setHex(lightStrength > .01 ? 13629416 : 8485263);
			material.emissive?.setHex(lightStrength > .01 ? 7794885 : 0);
			material.emissiveIntensity = lightStrength * 1.8;
		}
	}
	if (waveRoot) waveRoot.position.y += finalLift + landingSettle * .018;
	let activeWaveCount = 0;
	PORTABLE_SPEAKER_BASS_BEATS.forEach((beat) => {
		const wave = root.getObjectByName(`portable-speaker-bass-wave-ring-${beat.waveSlot}`);
		if (!wave) return;
		const age = time - (beat.time + .035);
		const life = beat.section === "climax" || beat.section === "final" ? 1.02 : .72;
		const progress = MathUtils.clamp(age / life, 0, 1);
		const visible = age >= 0 && age < life && p > .01;
		wave.visible = visible;
		if (!visible) return;
		activeWaveCount += 1;
		const appear = MathUtils.smoothstep(progress, 0, .08);
		const fade = 1 - MathUtils.smoothstep(progress, .5, 1);
		const growth = .34 + MathUtils.smoothstep(progress, 0, .92) * (2.55 + beat.strength * .62);
		const wobble = Math.sin(progress * Math.PI * 3 + beat.waveSlot * .73) * (1 - progress) * .045;
		wave.position.z = progress * (.66 + beat.strength * .48);
		wave.rotation.z = (beat.waveSlot % 2 === 0 ? 1 : -1) * progress * .12;
		wave.scale.set(growth * (1 + wobble), growth * (.91 - wobble * .62), .82 + beat.strength * .18);
		const material = meshMaterial$1(wave);
		if (material) {
			material.opacity = appear * fade * (.26 + beat.strength * .28) * p;
			material.emissiveIntensity = (.28 + beat.strength * .42) * fade * p;
		}
	});
	root.userData.portableSpeakerPerformance = {
		timelineOwner: PORTABLE_SPEAKER_TIMELINE_OWNER,
		phase: phaseAt$1(time),
		timeline: time,
		wholeMachineNode: "portable-speaker-whole-machine-pivot",
		driverNode: "portable-speaker-driver-pulse-pivot",
		beatCount: PORTABLE_SPEAKER_BASS_BEATS.filter((beat) => time >= beat.time).length,
		activeBeatSection: activeSection,
		bodyCompression: compression,
		bodyExpansion: expansion,
		driverTravel,
		finalLift,
		grilleMaxOffset,
		activeWaveCount,
		waveGeometry: "closed-irregular-tube",
		forbiddenFlatEffects: [
			"PlaneGeometry",
			"Sprite",
			"Line"
		]
	};
}
function resetPortableSpeakerPerformance(root) {
	const grille = root.getObjectByName("portable-speaker-grille-perforations");
	if (grille) poseGrilleInstances(grille, 0, 0);
	delete root.userData.portableSpeakerPerformance;
}
//#endregion
//#region src/appliances/performance/RobotVacuumPerformance.ts
var TAU$1 = Math.PI * 2;
var ROBOT_VACUUM_TIMELINE = Object.freeze({
	engageEnd: .46,
	circleStart: .46,
	circleEnd: 4.52,
	settleStart: 4.58,
	settleEnd: 5.2,
	circleRadius: 1.45,
	wheelRadius: .145,
	halfTrack: .55,
	sideBrushRate: 27,
	mainBrushRate: 22,
	lidarRate: 13
});
function clamp01$1(value) {
	return MathUtils.clamp(value, 0, 1);
}
function smootherstep$1(value) {
	const x = clamp01$1(value);
	return x * x * x * (x * (x * 6 - 15) + 10);
}
function pose(object) {
	return object ? {
		object,
		position: object.position.clone(),
		quaternion: object.quaternion.clone(),
		scale: object.scale.clone(),
		visible: object.visible
	} : null;
}
function restore$1(state) {
	if (!state) return;
	state.object.position.copy(state.position);
	state.object.quaternion.copy(state.quaternion);
	state.object.scale.copy(state.scale);
	state.object.visible = state.visible;
}
function spinSeconds(time) {
	const upStart = .03;
	const upEnd = ROBOT_VACUUM_TIMELINE.engageEnd;
	const downStart = ROBOT_VACUUM_TIMELINE.settleStart;
	const downEnd = ROBOT_VACUUM_TIMELINE.settleEnd;
	if (time <= upStart) return 0;
	const upDuration = upEnd - upStart;
	if (time < upEnd) {
		const u = (time - upStart) / upDuration;
		return upDuration * (u ** 3 - .5 * u ** 4);
	}
	const steady = upDuration * .5 + Math.max(0, Math.min(time, downStart) - upEnd);
	if (time <= downStart) return steady;
	const downDuration = downEnd - downStart;
	const u = clamp01$1((time - downStart) / downDuration);
	return steady + downDuration * (u - u ** 3 + .5 * u ** 4);
}
function makePaperGeometry() {
	const shape = new Shape();
	shape.moveTo(-.16, -.09);
	shape.lineTo(.13, -.07);
	shape.lineTo(.17, .045);
	shape.lineTo(.045, .1);
	shape.lineTo(-.14, .075);
	shape.closePath();
	const geometry = new ExtrudeGeometry(shape, {
		depth: .035,
		steps: 1,
		bevelEnabled: true,
		bevelSize: .008,
		bevelThickness: .008,
		bevelSegments: 1
	});
	geometry.rotateX(Math.PI * .5);
	return geometry;
}
function createDebrisField(root) {
	const existing = root.getObjectByName("robot-vacuum-debris-field");
	if (existing instanceof Group && Array.isArray(existing.userData.debrisRigs)) return {
		field: existing,
		debris: existing.userData.debrisRigs,
		lights: existing.userData.suctionLights
	};
	const field = new Group();
	field.name = "robot-vacuum-debris-field";
	field.userData.effectOwner = "robot-vacuum-model-rig";
	field.userData.volumetricOnly = true;
	field.visible = false;
	root.add(field);
	const materials = [
		new MeshToonMaterial({ color: 16770232 }),
		new MeshToonMaterial({ color: 7890805 }),
		new MeshToonMaterial({ color: 14062194 }),
		new MeshToonMaterial({ color: 10270112 }),
		new MeshToonMaterial({ color: 6248041 })
	];
	const starts = [
		new Vector3(-.12, .035, .48),
		new Vector3(-1.34, .04, 1.43),
		new Vector3(-2.78, .04, -.42),
		new Vector3(-.86, .04, -1.36),
		new Vector3(-.28, .05, -.48)
	];
	const pickupStarts = [
		.82,
		1.62,
		2.44,
		3.3,
		4.02
	];
	const names = [
		"paper-scrap",
		"dust-clump",
		"granules",
		"fragment",
		"hairball"
	];
	const debris = [];
	names.forEach((name, index) => {
		const group = new Group();
		group.name = `robot-vacuum-debris-${name}`;
		const add = (geometry, material = materials[index]) => {
			const mesh = new Mesh(geometry, material);
			mesh.name = `${group.name}-volume-${group.children.length + 1}`;
			mesh.castShadow = true;
			mesh.receiveShadow = true;
			group.add(mesh);
		};
		if (index === 0) add(makePaperGeometry());
		if (index === 1) for (let lobe = 0; lobe < 4; lobe += 1) {
			add(new IcosahedronGeometry(.085 - lobe * .008, 0));
			group.children.at(-1).position.set((lobe - 1.5) * .055, lobe % 2 * .035, (lobe % 3 - 1) * .04);
		}
		if (index === 2) for (let grain = 0; grain < 5; grain += 1) {
			add(new DodecahedronGeometry(.04 + grain % 2 * .012, 0));
			group.children.at(-1).position.set((grain - 2) * .055, 0, grain % 2 * .045);
		}
		if (index === 3) {
			add(new TetrahedronGeometry(.13, 0));
			add(new TetrahedronGeometry(.07, 0));
			group.children[1].position.set(.11, -.02, .04);
		}
		if (index === 4) add(new TorusKnotGeometry(.09, .022, 28, 5, 2, 3));
		group.position.copy(starts[index]);
		group.rotation.y = index * .73;
		field.add(group);
		const rest = pose(group);
		if (!rest) throw new Error(`Unable to capture robot vacuum debris rest pose: ${group.name}`);
		debris.push({
			object: group,
			start: starts[index].clone(),
			rest,
			pickupStart: pickupStarts[index],
			push: new Vector3(index % 2 === 0 ? .22 : -.22, .06, .14)
		});
	});
	const lights = [];
	for (let index = 0; index < 6; index += 1) {
		const material = new MeshToonMaterial({
			color: 16773544,
			emissive: 16752458,
			emissiveIntensity: 1.8,
			transparent: true,
			opacity: .92
		});
		const light = new Mesh(new IcosahedronGeometry(.035 + index % 2 * .012, 0), material);
		light.name = `robot-vacuum-suction-light-${index + 1}`;
		light.visible = false;
		field.add(light);
		lights.push(light);
	}
	field.userData.debrisRigs = debris;
	field.userData.suctionLights = lights;
	return {
		field,
		debris,
		lights
	};
}
/**
* Installs the model-owned debris/suction rig before the first performance
* session so activation never changes the appliance hierarchy. Model factories
* may pass their material set to keep disposal ownership complete.
*/
function ensureRobotVacuumPerformanceRig(root, materials) {
	const { field } = createDebrisField(root);
	if (!materials) return;
	field.traverse((object) => {
		if (!(object instanceof Mesh)) return;
		(Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => materials.add(material));
	});
}
function createRobotVacuumPerformance(root) {
	const motion = root.getObjectByName("robot-vacuum-motion-pivot");
	const chassis = root.getObjectByName("robot-vacuum-chassis-pivot");
	const lidar = root.getObjectByName("robot-vacuum-lidar-rotor-pivot");
	const mainBrush = root.getObjectByName("robot-vacuum-main-brush-pivot");
	const leftBrush = root.getObjectByName("robot-vacuum-left-side-brush-pivot");
	const rightBrush = root.getObjectByName("robot-vacuum-right-side-brush-pivot");
	const leftWheel = root.getObjectByName("robot-vacuum-left-drive-wheel-pivot");
	const rightWheel = root.getObjectByName("robot-vacuum-right-drive-wheel-pivot");
	const tracked = [
		motion,
		chassis,
		lidar,
		mainBrush,
		leftBrush,
		rightBrush,
		leftWheel,
		rightWheel
	].map((object) => pose(object)).filter((state) => state !== null);
	const { field, debris, lights } = createDebrisField(root);
	const lightRest = lights.map((light) => pose(light)).filter((state) => state !== null);
	const statusRest = ["robot-vacuum-lidar-status-ring", "robot-vacuum-top-power-button"].map((name) => root.getObjectByName(name)).filter((object) => object instanceof Mesh).map((mesh) => {
		const material = mesh.material;
		return {
			material,
			color: material.color.clone(),
			emissive: material.emissive.clone(),
			intensity: material.emissiveIntensity
		};
	});
	let signalValue = 0;
	const diagnostics = {
		time: 0,
		phase: "idle",
		circleProgress: 0,
		circleRadius: ROBOT_VACUUM_TIMELINE.circleRadius,
		distanceFromOrigin: 0,
		headingRadians: 0,
		brushSpeed: 0,
		collectedDebris: 0,
		visibleDebris: 0,
		visibleSuctionLights: 0,
		effectOwner: "robot-vacuum-model-rig",
		timelineOwner: "ApplianceMechanics/RobotVacuumPerformance",
		forbiddenLegacyEffects: [
			"PlaneGeometry",
			"Sprite",
			"dust-trail"
		]
	};
	root.userData.robotVacuumPerformance = diagnostics;
	const reset = () => {
		tracked.forEach(restore$1);
		debris.forEach(({ rest }) => restore$1(rest));
		lightRest.forEach(restore$1);
		field.visible = false;
		statusRest.forEach(({ material, color, emissive, intensity }) => {
			material.color.copy(color);
			material.emissive.copy(emissive);
			material.emissiveIntensity = intensity;
		});
		signalValue = 0;
		Object.assign(diagnostics, {
			time: 0,
			phase: "idle",
			circleProgress: 0,
			distanceFromOrigin: 0,
			headingRadians: 0,
			brushSpeed: 0,
			collectedDebris: 0,
			visibleDebris: 0,
			visibleSuctionLights: 0
		});
	};
	const apply = (rawTime, rawPower) => {
		tracked.forEach(restore$1);
		const time = Math.max(0, rawTime);
		const power = clamp01$1(rawPower);
		const timeline = ROBOT_VACUUM_TIMELINE;
		const progress = smootherstep$1((time - timeline.circleStart) / (timeline.circleEnd - timeline.circleStart));
		const angle = progress * TAU$1;
		const settle = smootherstep$1((time - timeline.settleStart) / (timeline.settleEnd - timeline.settleStart));
		const heading = progress >= 1 ? -TAU$1 * (1 - settle) : -angle;
		if (motion) {
			motion.position.x += timeline.circleRadius * (Math.cos(angle) - 1);
			motion.position.z += timeline.circleRadius * Math.sin(angle);
			motion.rotation.y += heading;
		}
		if (chassis) {
			const lean = MathUtils.smoothstep(time, .05, .24) * (1 - MathUtils.smoothstep(time, .42, .82));
			chassis.rotation.x += .075 * lean * power;
		}
		const spin = spinSeconds(time);
		if (lidar) lidar.rotation.y += spin * timeline.lidarRate;
		if (mainBrush) mainBrush.rotation.x += spin * timeline.mainBrushRate;
		if (leftBrush) leftBrush.rotation.y -= spin * timeline.sideBrushRate;
		if (rightBrush) rightBrush.rotation.y += spin * timeline.sideBrushRate;
		const wheelTurns = TAU$1 * progress / timeline.wheelRadius;
		if (leftWheel) leftWheel.rotation.x += wheelTurns * (timeline.circleRadius - timeline.halfTrack);
		if (rightWheel) rightWheel.rotation.x += wheelTurns * (timeline.circleRadius + timeline.halfTrack);
		const activeEnvelope = MathUtils.smoothstep(time, .03, timeline.engageEnd) * (1 - MathUtils.smoothstep(time, timeline.settleStart, timeline.settleEnd)) * power;
		field.visible = time > 0 && power > .001;
		const complete = smootherstep$1((time - timeline.circleEnd) / (timeline.settleEnd - timeline.circleEnd));
		statusRest.forEach(({ material, color }) => {
			material.color.copy(color).lerp(new Color(7989424), complete);
			material.emissive.set(complete > .55 ? 5236634 : 16736383);
			material.emissiveIntensity = .2 + activeEnvelope * 1.9 + complete * .7;
		});
		lightRest.forEach(restore$1);
		const suctionTarget = new Vector3(motion?.position.x ?? 0, .07, motion?.position.z ?? 0);
		let collectedDebris = 0;
		let visibleDebris = 0;
		let visibleSuctionLights = 0;
		debris.forEach((rig, index) => {
			restore$1(rig.rest);
			if (!field.visible) {
				rig.object.visible = false;
				return;
			}
			const pickup = clamp01$1((time - rig.pickupStart) / .56);
			if (pickup >= .97) {
				rig.object.visible = false;
				collectedDebris += 1;
				return;
			}
			rig.object.visible = true;
			visibleDebris += 1;
			const brushPush = smootherstep$1(pickup / .36);
			const suction = smootherstep$1((pickup - .28) / .72);
			rig.object.position.copy(rig.start).lerp(rig.start.clone().add(rig.push), brushPush);
			rig.object.position.lerp(suctionTarget, suction);
			rig.object.position.y += Math.sin(pickup * Math.PI) * .14;
			rig.object.rotation.y += pickup * 2.8 * (index % 2 === 0 ? 1 : -1);
			rig.object.scale.setScalar(1 - suction * .88);
			if (pickup > .28) for (let sparkIndex = 0; sparkIndex < 2; sparkIndex += 1) {
				const light = lights[(index * 2 + sparkIndex) % lights.length];
				const lightProgress = clamp01$1((pickup - .28) / .69 + sparkIndex * .1);
				light.visible = true;
				light.position.copy(rig.object.position).lerp(suctionTarget, lightProgress);
				light.position.y += Math.sin(lightProgress * Math.PI) * (.12 + sparkIndex * .05);
				light.scale.setScalar(Math.max(.12, 1 - lightProgress));
				visibleSuctionLights += 1;
			}
		});
		signalValue = Math.max(activeEnvelope, complete * (1 - settle));
		Object.assign(diagnostics, {
			time,
			phase: time <= 0 ? "idle" : time < timeline.circleStart ? "engage" : time < timeline.circleEnd ? "sweeping" : time < timeline.settleStart ? "returned" : time < timeline.settleEnd ? "settling" : "complete",
			circleProgress: progress,
			distanceFromOrigin: motion ? Math.hypot(motion.position.x, motion.position.z) : 0,
			headingRadians: heading,
			brushSpeed: timeline.sideBrushRate * activeEnvelope,
			collectedDebris,
			visibleDebris,
			visibleSuctionLights
		});
	};
	return {
		apply,
		reset,
		signal: () => signalValue,
		diagnostics
	};
}
//#endregion
//#region src/appliances/performance/RecordPlayerPerformance.ts
var RECORD_PLAYER_TIMELINE_OWNER = "ApplianceMechanics/RecordPlayerPerformance";
var RECORD_PLAYER_EFFECT_OWNER = "RecordPlayerPerformance";
var RECORD_PLAYER_TIMELINE = {
	knobOnStart: .06,
	knobOnEnd: .28,
	platterStart: .15,
	platterFullSpeed: 1,
	cueLiftStart: .35,
	cueLiftEnd: .65,
	cueSweepStart: .62,
	cueSweepEnd: 1.12,
	stylusLowerStart: 1.12,
	stylusLowerEnd: 1.5,
	performanceStart: 1.42,
	climaxStart: 2.72,
	climaxPeak: 3.28,
	climaxEnd: 3.82,
	fadeStart: 3.76,
	returnLiftStart: 4.12,
	returnLiftEnd: 4.36,
	platterSlowStart: 4.05,
	returnSweepStart: 4.3,
	returnSweepEnd: 4.82,
	returnLowerStart: 4.78,
	resetPoseAt: 5.08
};
var TAU = Math.PI * 2;
var PLATTER_RATE = 6.35;
var PLATTER_CENTER = new Vector3(-.35, 1.2, 0);
var EFFECT_COLORS = [
	16740760,
	16757845,
	7461072,
	9087231,
	13274367,
	16770443
];
function clamp01(value) {
	return MathUtils.clamp(value, 0, 1);
}
function smootherstep(value) {
	const t = clamp01(value);
	return t * t * t * (t * (t * 6 - 15) + 10);
}
function windowPulse(time, start, peak, end) {
	return MathUtils.smoothstep(time, start, peak) * (1 - MathUtils.smoothstep(time, peak, end));
}
function capture(object) {
	if (!object) return null;
	return {
		object,
		position: object.position.clone(),
		quaternion: object.quaternion.clone(),
		scale: object.scale.clone(),
		visible: object.visible
	};
}
function restore(pose) {
	pose.object.position.copy(pose.position);
	pose.object.quaternion.copy(pose.quaternion);
	pose.object.scale.copy(pose.scale);
	pose.object.visible = pose.visible;
}
function meshMaterial(mesh) {
	return mesh.material;
}
function makeEffectMaterial(color, opacity) {
	return new MeshToonMaterial({
		color,
		emissive: new Color(color).multiplyScalar(.55),
		emissiveIntensity: .65,
		transparent: true,
		opacity,
		depthWrite: false
	});
}
function createWaveGeometry(variant) {
	const points = [];
	const count = 40;
	for (let index = 0; index < count; index += 1) {
		const angle = index / count * TAU;
		const ripple = Math.sin(angle * (3 + variant) + variant * .8) * .055;
		points.push(new Vector3(Math.cos(angle) * (.56 + ripple), Math.sin(angle * 2 + variant) * .035, Math.sin(angle) * (.45 + ripple * .7)));
	}
	const geometry = new TubeGeometry(new CatmullRomCurve3(points, true, "centripetal", .42), 96, .045 + variant * .006, 8, true);
	geometry.userData.performanceProp = "record-player-volumetric-wave-ring";
	geometry.userData.closed = true;
	geometry.userData.hasThickness = true;
	return geometry;
}
function createNoteGeometry(variant) {
	const shape = new Shape();
	const headScale = variant % 2 === 0 ? 1 : .88;
	shape.moveTo(-.15 * headScale, -.16);
	shape.bezierCurveTo(-.29 * headScale, -.2, -.3 * headScale, .01, -.12 * headScale, .06);
	shape.bezierCurveTo(.03, .09, .1, -.1, -.02, -.17);
	shape.lineTo(.05, .48);
	shape.lineTo(.15, .48);
	shape.lineTo(.15, variant % 3 === 0 ? .12 : .02);
	shape.bezierCurveTo(.31, .13, .34, .28, .21, .37);
	shape.lineTo(.17, .25);
	shape.bezierCurveTo(.24, .2, .2, .13, .15, .11);
	shape.lineTo(.15, -.09);
	shape.bezierCurveTo(.08, -.01, .02, -.05, -.02, -.1);
	shape.bezierCurveTo(-.06, -.13, -.1, -.15, -.15 * headScale, -.16);
	const geometry = new ExtrudeGeometry(shape, {
		depth: .085 + variant * .008,
		steps: 1,
		bevelEnabled: true,
		bevelSize: .018,
		bevelThickness: .018,
		bevelSegments: 2,
		curveSegments: 8
	});
	geometry.center();
	geometry.userData.performanceProp = "record-player-volumetric-note";
	geometry.userData.hasThickness = true;
	return geometry;
}
function createStarGeometry() {
	const shape = new Shape();
	for (let index = 0; index < 10; index += 1) {
		const angle = -Math.PI * .5 + index / 10 * TAU;
		const radius = index % 2 === 0 ? .18 : .075;
		const x = Math.cos(angle) * radius;
		const y = Math.sin(angle) * radius;
		if (index === 0) shape.moveTo(x, y);
		else shape.lineTo(x, y);
	}
	shape.closePath();
	const geometry = new ExtrudeGeometry(shape, {
		depth: .07,
		bevelEnabled: true,
		bevelSize: .015,
		bevelThickness: .014,
		bevelSegments: 2
	});
	geometry.center();
	geometry.userData.performanceProp = "record-player-soft-volumetric-star";
	geometry.userData.hasThickness = true;
	return geometry;
}
function findMeshes(root, prefix) {
	const meshes = [];
	root.traverse((object) => {
		if (object instanceof Mesh && object.name.startsWith(prefix)) meshes.push(object);
	});
	return meshes;
}
function createEffectRig(root) {
	const existing = root.getObjectByName("record-player-performance-effects");
	if (existing instanceof Group) return {
		root: existing,
		waves: findMeshes(existing, "record-player-performance-wave-ring-"),
		notes: findMeshes(existing, "record-player-performance-note-"),
		lights: findMeshes(existing, "record-player-performance-light-point-"),
		rhythms: findMeshes(existing, "record-player-performance-rhythm-particle-"),
		stars: findMeshes(existing, "record-player-performance-soft-star-")
	};
	const effectRoot = new Group();
	effectRoot.name = "record-player-performance-effects";
	effectRoot.userData.effectOwner = RECORD_PLAYER_EFFECT_OWNER;
	effectRoot.userData.timelineOwner = RECORD_PLAYER_TIMELINE_OWNER;
	effectRoot.userData.sharedSpectacleEffects = "disabled";
	effectRoot.userData.geometryContract = {
		wave: "closed-irregular-tube",
		note: "beveled-extrusion",
		lightPoint: "icosahedron",
		rhythmParticle: "capsule",
		softStar: "beveled-extrusion",
		forbidden: [
			"PlaneGeometry",
			"Sprite",
			"Line"
		]
	};
	effectRoot.visible = false;
	root.add(effectRoot);
	const waveGeometries = [
		0,
		1,
		2
	].map(createWaveGeometry);
	const noteGeometries = [
		0,
		1,
		2
	].map(createNoteGeometry);
	const starGeometry = createStarGeometry();
	const lightGeometry = new IcosahedronGeometry(.055, 1);
	const rhythmGeometry = new CapsuleGeometry(.035, .12, 4, 8);
	const materials = EFFECT_COLORS.map((color) => makeEffectMaterial(color, .78));
	const softMaterials = [
		makeEffectMaterial(16773042, .52),
		makeEffectMaterial(16763099, .48),
		makeEffectMaterial(14151679, .46)
	];
	const waves = [];
	for (let index = 0; index < 12; index += 1) {
		const mesh = new Mesh(waveGeometries[index % waveGeometries.length], materials[index % materials.length]);
		mesh.name = `record-player-performance-wave-ring-${index + 1}`;
		mesh.visible = false;
		mesh.renderOrder = 6;
		effectRoot.add(mesh);
		waves.push(mesh);
	}
	const notes = [];
	for (let index = 0; index < 18; index += 1) {
		const mesh = new Mesh(noteGeometries[index % noteGeometries.length], materials[(index + 1) % materials.length]);
		mesh.name = `record-player-performance-note-${index + 1}`;
		mesh.visible = false;
		mesh.renderOrder = 7;
		effectRoot.add(mesh);
		notes.push(mesh);
	}
	const lights = [];
	for (let index = 0; index < 24; index += 1) {
		const mesh = new Mesh(lightGeometry, materials[(index + 2) % materials.length]);
		mesh.name = `record-player-performance-light-point-${index + 1}`;
		mesh.visible = false;
		mesh.renderOrder = 8;
		effectRoot.add(mesh);
		lights.push(mesh);
	}
	const rhythms = [];
	for (let index = 0; index < 20; index += 1) {
		const mesh = new Mesh(rhythmGeometry, materials[(index + 3) % materials.length]);
		mesh.name = `record-player-performance-rhythm-particle-${index + 1}`;
		mesh.visible = false;
		mesh.renderOrder = 7;
		effectRoot.add(mesh);
		rhythms.push(mesh);
	}
	const stars = [];
	for (let index = 0; index < 12; index += 1) {
		const mesh = new Mesh(starGeometry, softMaterials[index % softMaterials.length]);
		mesh.name = `record-player-performance-soft-star-${index + 1}`;
		mesh.visible = false;
		mesh.renderOrder = 8;
		effectRoot.add(mesh);
		stars.push(mesh);
	}
	return {
		root: effectRoot,
		waves,
		notes,
		lights,
		rhythms,
		stars
	};
}
/** Installs the stable model-owned effect hierarchy before first activation. */
function ensureRecordPlayerPerformanceRig(root, materials) {
	const rig = createEffectRig(root);
	if (!materials) return;
	rig.root.traverse((object) => {
		if (!(object instanceof Mesh)) return;
		(Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => materials.add(material));
	});
}
function phaseAt(time, power) {
	if (time <= 0 || power <= .001) return "idle";
	if (time < RECORD_PLAYER_TIMELINE.knobOnEnd + .12) return "powering-on";
	if (time < RECORD_PLAYER_TIMELINE.stylusLowerEnd) return "cueing";
	if (time < RECORD_PLAYER_TIMELINE.climaxStart) return "playing";
	if (time < RECORD_PLAYER_TIMELINE.climaxEnd) return "climax";
	if (time < RECORD_PLAYER_TIMELINE.returnLiftStart) return "fading";
	if (time < RECORD_PLAYER_TIMELINE.resetPoseAt) return "returning";
	return "idle-reset";
}
function platterMotion(time) {
	const local = Math.max(0, time - RECORD_PLAYER_TIMELINE.platterStart);
	const accelDuration = RECORD_PLAYER_TIMELINE.platterFullSpeed - RECORD_PLAYER_TIMELINE.platterStart;
	const fullSpeedDuration = RECORD_PLAYER_TIMELINE.platterSlowStart - RECORD_PLAYER_TIMELINE.platterFullSpeed;
	const slowDuration = RECORD_PLAYER_TIMELINE.resetPoseAt - RECORD_PLAYER_TIMELINE.platterSlowStart;
	const accelAngle = .5 * PLATTER_RATE * accelDuration;
	const stableAngle = PLATTER_RATE * fullSpeedDuration;
	if (local <= accelDuration) {
		const progress = local / accelDuration;
		return {
			angle: .5 * PLATTER_RATE * local * progress,
			speed: PLATTER_RATE * progress
		};
	}
	if (time <= RECORD_PLAYER_TIMELINE.platterSlowStart) return {
		angle: accelAngle + PLATTER_RATE * (time - RECORD_PLAYER_TIMELINE.platterFullSpeed),
		speed: PLATTER_RATE
	};
	const slowTime = Math.min(slowDuration, time - RECORD_PLAYER_TIMELINE.platterSlowStart);
	const progress = slowTime / slowDuration;
	return {
		angle: accelAngle + stableAngle + PLATTER_RATE * slowTime - .5 * PLATTER_RATE * slowTime * progress,
		speed: PLATTER_RATE * (1 - progress)
	};
}
function applyOpacity(mesh, opacity, emissive) {
	const material = meshMaterial(mesh);
	material.opacity = opacity;
	material.emissiveIntensity = emissive;
}
function hideEffects(rig) {
	[
		...rig.waves,
		...rig.notes,
		...rig.lights,
		...rig.rhythms,
		...rig.stars
	].forEach((mesh) => {
		mesh.visible = false;
		mesh.scale.set(1, 1, 1);
	});
}
function createRecordPlayerPerformance(root) {
	const effects = createEffectRig(root);
	const effectObjects = [
		effects.root,
		...effects.waves,
		...effects.notes,
		...effects.lights,
		...effects.rhythms,
		...effects.stars
	];
	const effectPoses = effectObjects.map(capture).filter((pose) => pose !== null);
	const seenEffectMaterials = /* @__PURE__ */ new Set();
	const effectMaterialPoses = [];
	effectObjects.forEach((object) => {
		if (!(object instanceof Mesh)) return;
		(Array.isArray(object.material) ? object.material : [object.material]).forEach((entry) => {
			const material = entry;
			if (seenEffectMaterials.has(material)) return;
			seenEffectMaterials.add(material);
			effectMaterialPoses.push({
				material,
				color: material.color.clone(),
				emissive: material.emissive.clone(),
				emissiveIntensity: material.emissiveIntensity,
				opacity: material.opacity,
				transparent: material.transparent
			});
		});
	});
	const rootPose = capture(root);
	const bodyPose = capture(root.getObjectByName("record-player-body-pivot"));
	const lidPose = capture(root.getObjectByName("record-player-lid-hinge-pivot"));
	const platterPose = capture(root.getObjectByName("record-player-platter-spin-pivot"));
	const tonearmPose = capture(root.getObjectByName("record-player-tonearm-pivot"));
	const cuePose = capture(root.getObjectByName("record-player-tonearm-cue-pivot"));
	const knobPose = capture(root.getObjectByName("record-player-control-knob-pivot"));
	const poses = [
		rootPose,
		bodyPose,
		lidPose,
		platterPose,
		tonearmPose,
		cuePose,
		knobPose
	].filter((pose) => pose !== null);
	const indicator = root.getObjectByName("record-player-power-status-indicator");
	const indicatorMesh = indicator instanceof Mesh ? indicator : null;
	const indicatorMaterial = indicatorMesh ? meshMaterial(indicatorMesh) : null;
	const indicatorRest = indicatorMaterial ? {
		color: indicatorMaterial.color.clone(),
		emissive: indicatorMaterial.emissive.clone(),
		intensity: indicatorMaterial.emissiveIntensity
	} : null;
	let signalValue = 0;
	const diagnostics = {
		time: 0,
		phase: "idle",
		timelineOwner: RECORD_PLAYER_TIMELINE_OWNER,
		effectOwner: RECORD_PLAYER_EFFECT_OWNER,
		initialLidPose: "open",
		knobTurn: 0,
		indicatorStrength: 0,
		platterAngle: 0,
		platterSpeed: 0,
		tonearmSweep: 0,
		tonearmLift: 0,
		stylusState: "rest",
		beatRebound: 0,
		climaxStrength: 0,
		effectEnergy: 0,
		activeWaveRings: 0,
		activeNotes: 0,
		activeLightPoints: 0,
		activeRhythmParticles: 0,
		activeSoftStars: 0,
		totalActiveEffects: 0,
		waveGeometry: "closed-irregular-tube",
		noteGeometry: "beveled-extrusion",
		forbiddenFlatEffects: [
			"PlaneGeometry",
			"Sprite",
			"Line"
		],
		sharedSpectacleEffects: "disabled"
	};
	root.userData.recordPlayerPerformanceDiagnostics = diagnostics;
	const reset = () => {
		poses.forEach(restore);
		effectPoses.forEach(restore);
		effectMaterialPoses.forEach((state) => {
			state.material.color.copy(state.color);
			state.material.emissive.copy(state.emissive);
			state.material.emissiveIntensity = state.emissiveIntensity;
			state.material.opacity = state.opacity;
			state.material.transparent = state.transparent;
		});
		hideEffects(effects);
		effects.root.visible = false;
		if (indicatorMaterial && indicatorRest) {
			indicatorMaterial.color.copy(indicatorRest.color);
			indicatorMaterial.emissive.copy(indicatorRest.emissive);
			indicatorMaterial.emissiveIntensity = indicatorRest.intensity;
		}
		signalValue = 0;
		Object.assign(diagnostics, {
			time: 0,
			phase: "idle",
			knobTurn: 0,
			indicatorStrength: 0,
			platterAngle: 0,
			platterSpeed: 0,
			tonearmSweep: 0,
			tonearmLift: 0,
			stylusState: "rest",
			beatRebound: 0,
			climaxStrength: 0,
			effectEnergy: 0,
			activeWaveRings: 0,
			activeNotes: 0,
			activeLightPoints: 0,
			activeRhythmParticles: 0,
			activeSoftStars: 0,
			totalActiveEffects: 0
		});
	};
	const apply = (rawTime, rawPower) => {
		poses.forEach(restore);
		effectPoses.forEach(restore);
		effectMaterialPoses.forEach((state) => {
			state.material.color.copy(state.color);
			state.material.emissive.copy(state.emissive);
			state.material.emissiveIntensity = state.emissiveIntensity;
			state.material.opacity = state.opacity;
			state.material.transparent = state.transparent;
		});
		hideEffects(effects);
		const time = Math.max(0, rawTime);
		const power = clamp01(rawPower);
		if (power <= .001) {
			reset();
			diagnostics.time = time;
			return;
		}
		const turnOn = smootherstep((time - RECORD_PLAYER_TIMELINE.knobOnStart) / (RECORD_PLAYER_TIMELINE.knobOnEnd - RECORD_PLAYER_TIMELINE.knobOnStart));
		const turnOff = smootherstep((time - 4.64) / (RECORD_PLAYER_TIMELINE.resetPoseAt - 4.64));
		const knobTurn = 2.28 * turnOn * (1 - turnOff);
		if (knobPose) knobPose.object.rotation.y += knobTurn;
		const indicatorStrength = turnOn * (1 - smootherstep((time - 4.7) / .38)) * power;
		if (indicatorMaterial && indicatorRest) {
			indicatorMaterial.color.copy(indicatorRest.color).lerp(new Color(16769954), indicatorStrength);
			indicatorMaterial.emissive.setHex(indicatorStrength > .01 ? 16742254 : 0);
			indicatorMaterial.emissiveIntensity = indicatorRest.intensity + indicatorStrength * 2.4;
		}
		const platter = platterMotion(time);
		if (platterPose) platterPose.object.rotation.y += platter.angle;
		const cueLift = smootherstep((time - RECORD_PLAYER_TIMELINE.cueLiftStart) / (RECORD_PLAYER_TIMELINE.cueLiftEnd - RECORD_PLAYER_TIMELINE.cueLiftStart));
		const cueSweep = smootherstep((time - RECORD_PLAYER_TIMELINE.cueSweepStart) / (RECORD_PLAYER_TIMELINE.cueSweepEnd - RECORD_PLAYER_TIMELINE.cueSweepStart));
		const stylusLower = smootherstep((time - RECORD_PLAYER_TIMELINE.stylusLowerStart) / (RECORD_PLAYER_TIMELINE.stylusLowerEnd - RECORD_PLAYER_TIMELINE.stylusLowerStart));
		const returnLift = smootherstep((time - RECORD_PLAYER_TIMELINE.returnLiftStart) / (RECORD_PLAYER_TIMELINE.returnLiftEnd - RECORD_PLAYER_TIMELINE.returnLiftStart));
		const returnSweep = smootherstep((time - RECORD_PLAYER_TIMELINE.returnSweepStart) / (RECORD_PLAYER_TIMELINE.returnSweepEnd - RECORD_PLAYER_TIMELINE.returnSweepStart));
		const returnLower = smootherstep((time - RECORD_PLAYER_TIMELINE.returnLowerStart) / (RECORD_PLAYER_TIMELINE.resetPoseAt - RECORD_PLAYER_TIMELINE.returnLowerStart));
		const tonearmSweep = -.34 * cueSweep * (1 - returnSweep);
		const tonearmLift = .14 * cueLift - .25 * stylusLower + .25 * returnLift - .14 * returnLower;
		if (tonearmPose) tonearmPose.object.rotation.y += tonearmSweep;
		if (cuePose) {
			cuePose.object.position.y += tonearmLift;
			cuePose.object.rotation.z += clamp01((tonearmLift + .11) / .25) * .055;
		}
		const playEnvelope = MathUtils.smoothstep(time, RECORD_PLAYER_TIMELINE.performanceStart, 1.7) * (1 - MathUtils.smoothstep(time, RECORD_PLAYER_TIMELINE.fadeStart, 4.58));
		const climaxStrength = windowPulse(time, RECORD_PLAYER_TIMELINE.climaxStart, RECORD_PLAYER_TIMELINE.climaxPeak, RECORD_PLAYER_TIMELINE.climaxEnd);
		const rebound = Math.max(0, Math.sin((time - RECORD_PLAYER_TIMELINE.performanceStart) * TAU * 2.15)) ** 6 * playEnvelope * (.32 + climaxStrength * .68) * power;
		if (rootPose) {
			rootPose.object.position.y += rebound * (.025 + climaxStrength * .065);
			rootPose.object.rotation.z += Math.sin(time * 11.4) * playEnvelope * (.008 + climaxStrength * .038) * power;
			rootPose.object.scale.x *= 1 + rebound * (.006 + climaxStrength * .018);
			rootPose.object.scale.y *= 1 - rebound * (.005 + climaxStrength * .012);
		}
		if (bodyPose) bodyPose.object.rotation.z += Math.sin(time * 13.2 + .5) * playEnvelope * (.004 + climaxStrength * .014) * power;
		if (lidPose) {
			lidPose.object.rotation.x += Math.sin(time * 16.4) * playEnvelope * (.006 + climaxStrength * .026) * power;
			lidPose.object.rotation.z += Math.sin(time * 12.3 + .7) * climaxStrength * .018 * power;
		}
		const effectEnergy = playEnvelope * (.6 + climaxStrength * .75) * power;
		effects.root.visible = effectEnergy > .005;
		let activeWaveRings = 0;
		let activeNotes = 0;
		let activeLightPoints = 0;
		let activeRhythmParticles = 0;
		let activeSoftStars = 0;
		const density = .42 + climaxStrength * .46;
		effects.waves.forEach((wave, index) => {
			const phase = (time * 1.36 + index / effects.waves.length) % 1;
			const visible = effects.root.visible && phase < density;
			wave.visible = visible;
			if (!visible) return;
			activeWaveRings += 1;
			const life = phase / density;
			const growth = .58 + smootherstep(life) * (2.15 + climaxStrength * .95);
			const wobble = Math.sin(life * TAU * 1.5 + index) * (1 - life) * .055;
			wave.position.set(PLATTER_CENTER.x, PLATTER_CENTER.y + .16 + life * (1.15 + climaxStrength * .38), PLATTER_CENTER.z);
			wave.rotation.y = time * .35 * (index % 2 === 0 ? 1 : -1);
			wave.rotation.z = wobble;
			wave.scale.set(growth * (1 + wobble), .86 + climaxStrength * .22, growth * (.9 - wobble));
			applyOpacity(wave, (1 - smootherstep(life)) * (.42 + climaxStrength * .28) * power, .7 + climaxStrength);
		});
		effects.notes.forEach((note, index) => {
			const phase = (time * (.43 + climaxStrength * .16) + index / effects.notes.length) % 1;
			const visible = effects.root.visible && phase < .5 + climaxStrength * .32;
			note.visible = visible;
			if (!visible) return;
			activeNotes += 1;
			const life = phase / (.5 + climaxStrength * .32);
			const side = index % 2 === 0 ? -1 : 1;
			const angle = index * 2.399 + time * (.45 + side * .08);
			const radius = .78 + life * (1.05 + climaxStrength * .55) + index % 3 * .12;
			note.position.set(PLATTER_CENTER.x + Math.cos(angle) * radius, PLATTER_CENTER.y + .25 + life * (1.65 + climaxStrength * .55) + Math.sin(angle * 2) * .12, PLATTER_CENTER.z + Math.sin(angle) * radius * .68);
			note.rotation.set(time * .7 + index * .31, angle + Math.PI * .5, Math.sin(time * 1.4 + index) * .32);
			const scale = (.42 + index % 4 * .055) * (1 + climaxStrength * .55) * (.84 + Math.sin(life * Math.PI) * .24);
			note.scale.setScalar(scale);
			applyOpacity(note, (1 - smootherstep(life)) * (.7 + climaxStrength * .18) * power, .72 + climaxStrength * .75);
		});
		effects.lights.forEach((light, index) => {
			const phase = (time * (.58 + climaxStrength * .24) + index / effects.lights.length) % 1;
			const visible = effects.root.visible && phase < .48 + climaxStrength * .38;
			light.visible = visible;
			if (!visible) return;
			activeLightPoints += 1;
			const life = phase / (.48 + climaxStrength * .38);
			const angle = index * 2.17 - time * .8;
			const radius = .62 + index % 5 * .24 + life * .5;
			light.position.set(PLATTER_CENTER.x + Math.cos(angle) * radius, PLATTER_CENTER.y + .2 + life * (1.35 + climaxStrength * .5), PLATTER_CENTER.z + Math.sin(angle) * radius * .8);
			const sparkle = .55 + Math.sin(time * 9 + index * 1.7) * .2;
			light.scale.setScalar(sparkle * (1 + climaxStrength * .48));
			applyOpacity(light, (1 - life) * .78 * power, 1 + climaxStrength * 1.25);
		});
		effects.rhythms.forEach((particle, index) => {
			const phase = (time * (.78 + climaxStrength * .32) + index / effects.rhythms.length) % 1;
			const visible = effects.root.visible && phase < .4 + climaxStrength * .43;
			particle.visible = visible;
			if (!visible) return;
			activeRhythmParticles += 1;
			const life = phase / (.4 + climaxStrength * .43);
			const side = index % 2 === 0 ? -1 : 1;
			const angle = index * 1.91 + side * time * 1.35;
			const radius = .72 + index % 4 * .2 + life * (.4 + climaxStrength * .42);
			particle.position.set(PLATTER_CENTER.x + Math.cos(angle) * radius, PLATTER_CENTER.y + .16 + Math.sin(life * Math.PI) * (.62 + climaxStrength * .32), PLATTER_CENTER.z + Math.sin(angle) * radius);
			particle.rotation.set(angle, life * TAU + index, Math.PI * .5 + angle);
			particle.scale.setScalar((.72 + climaxStrength * .45) * (1 - life * .35));
			applyOpacity(particle, (1 - smootherstep(life)) * .72 * power, .62 + climaxStrength);
		});
		effects.stars.forEach((star, index) => {
			const phase = (time * .31 + index / effects.stars.length) % 1;
			const visible = effects.root.visible && phase < .46 + climaxStrength * .34;
			star.visible = visible;
			if (!visible) return;
			activeSoftStars += 1;
			const life = phase / (.46 + climaxStrength * .34);
			const angle = index * 2.63 + time * .22;
			const radius = 1 + index % 4 * .35 + climaxStrength * .28;
			star.position.set(PLATTER_CENTER.x + Math.cos(angle) * radius, PLATTER_CENTER.y + .55 + index % 3 * .48 + Math.sin(time * .9 + index) * .15, PLATTER_CENTER.z + Math.sin(angle) * radius * .72);
			star.rotation.set(index * .27, time * .3 + index, time * .55 + index * .4);
			const twinkle = .42 + Math.max(0, Math.sin(time * 3.2 + index)) * .34;
			star.scale.setScalar(twinkle * (1 + climaxStrength * .52));
			applyOpacity(star, (.22 + Math.sin(life * Math.PI) * .36) * power, .55 + climaxStrength * .75);
		});
		const totalActiveEffects = activeWaveRings + activeNotes + activeLightPoints + activeRhythmParticles + activeSoftStars;
		const stylusState = time < RECORD_PLAYER_TIMELINE.cueLiftStart ? "rest" : time < RECORD_PLAYER_TIMELINE.cueSweepStart ? "lifted" : time < RECORD_PLAYER_TIMELINE.stylusLowerStart ? "moving-to-edge" : time < RECORD_PLAYER_TIMELINE.stylusLowerEnd ? "lowering" : time < RECORD_PLAYER_TIMELINE.returnLiftStart ? "playing-edge" : "returning";
		signalValue = Math.max(turnOn * (1 - turnOff), platter.speed / PLATTER_RATE, effectEnergy) * power;
		Object.assign(diagnostics, {
			time,
			phase: phaseAt(time, power),
			knobTurn,
			indicatorStrength,
			platterAngle: platter.angle,
			platterSpeed: platter.speed,
			tonearmSweep,
			tonearmLift,
			stylusState,
			beatRebound: rebound,
			climaxStrength,
			effectEnergy,
			activeWaveRings,
			activeNotes,
			activeLightPoints,
			activeRhythmParticles,
			activeSoftStars,
			totalActiveEffects
		});
	};
	return {
		apply,
		reset,
		update: apply,
		stop: reset,
		signal: () => signalValue,
		diagnostics
	};
}
//#endregion
//#region node_modules/three/examples/jsm/geometries/RoundedBoxGeometry.js
var _tempNormal = new Vector3();
function getUv(faceDirVector, normal, uvAxis, projectionAxis, radius, sideLength) {
	const totArcLength = 2 * Math.PI * radius / 4;
	const centerLength = Math.max(sideLength - 2 * radius, 0);
	const halfArc = Math.PI / 4;
	_tempNormal.copy(normal);
	_tempNormal[projectionAxis] = 0;
	_tempNormal.normalize();
	const arcUvRatio = .5 * totArcLength / (totArcLength + centerLength);
	const arcAngleRatio = 1 - _tempNormal.angleTo(faceDirVector) / halfArc;
	if (Math.sign(_tempNormal[uvAxis]) === 1) return arcAngleRatio * arcUvRatio;
	else return centerLength / (totArcLength + centerLength) + arcUvRatio + arcUvRatio * (1 - arcAngleRatio);
}
/**
* A special type of box geometry with rounded corners and edges.
*
* ```js
* const geometry = new THREE.RoundedBoxGeometry();
* const material = new THREE.MeshStandardMaterial( { color: 0x00ff00 } );
* const cube = new THREE.Mesh( geometry, material );
* scene.add( cube );
* ```
*
* @augments BoxGeometry
* @three_import import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
*/
var RoundedBoxGeometry = class RoundedBoxGeometry extends BoxGeometry {
	/**
	* Constructs a new rounded box geometry.
	*
	* @param {number} [width=1] - The width. That is, the length of the edges parallel to the X axis.
	* @param {number} [height=1] - The height. That is, the length of the edges parallel to the Y axis.
	* @param {number} [depth=1] - The depth. That is, the length of the edges parallel to the Z axis.
	* @param {number} [segments=2] - Number of segments that form the rounded corners.
	* @param {number} [radius=0.1] - The radius of the rounded corners.
	*/
	constructor(width = 1, height = 1, depth = 1, segments = 2, radius = .1) {
		const totalSegments = segments * 2 + 1;
		radius = Math.min(width / 2, height / 2, depth / 2, radius);
		super(1, 1, 1, totalSegments, totalSegments, totalSegments);
		this.type = "RoundedBoxGeometry";
		/**
		* Holds the constructor parameters that have been
		* used to generate the geometry. Any modification
		* after instantiation does not change the geometry.
		*
		* @type {Object}
		*/
		this.parameters = {
			width,
			height,
			depth,
			segments,
			radius
		};
		if (totalSegments === 1) return;
		const geometry2 = this.toNonIndexed();
		this.index = null;
		this.attributes.position = geometry2.attributes.position;
		this.attributes.normal = geometry2.attributes.normal;
		this.attributes.uv = geometry2.attributes.uv;
		const position = new Vector3();
		const normal = new Vector3();
		const box = new Vector3(width, height, depth).divideScalar(2).subScalar(radius);
		const positions = this.attributes.position.array;
		const normals = this.attributes.normal.array;
		const uvs = this.attributes.uv.array;
		const faceTris = positions.length / 6;
		const faceDirVector = new Vector3();
		const halfSegmentSize = .5 / totalSegments;
		for (let i = 0, j = 0; i < positions.length; i += 3, j += 2) {
			position.fromArray(positions, i);
			normal.copy(position);
			normal.x -= Math.sign(normal.x) * halfSegmentSize;
			normal.y -= Math.sign(normal.y) * halfSegmentSize;
			normal.z -= Math.sign(normal.z) * halfSegmentSize;
			normal.normalize();
			positions[i + 0] = box.x * Math.sign(position.x) + normal.x * radius;
			positions[i + 1] = box.y * Math.sign(position.y) + normal.y * radius;
			positions[i + 2] = box.z * Math.sign(position.z) + normal.z * radius;
			normals[i + 0] = normal.x;
			normals[i + 1] = normal.y;
			normals[i + 2] = normal.z;
			switch (Math.floor(i / faceTris)) {
				case 0:
					faceDirVector.set(1, 0, 0);
					uvs[j + 0] = getUv(faceDirVector, normal, "z", "y", radius, depth);
					uvs[j + 1] = 1 - getUv(faceDirVector, normal, "y", "z", radius, height);
					break;
				case 1:
					faceDirVector.set(-1, 0, 0);
					uvs[j + 0] = 1 - getUv(faceDirVector, normal, "z", "y", radius, depth);
					uvs[j + 1] = 1 - getUv(faceDirVector, normal, "y", "z", radius, height);
					break;
				case 2:
					faceDirVector.set(0, 1, 0);
					uvs[j + 0] = 1 - getUv(faceDirVector, normal, "x", "z", radius, width);
					uvs[j + 1] = getUv(faceDirVector, normal, "z", "x", radius, depth);
					break;
				case 3:
					faceDirVector.set(0, -1, 0);
					uvs[j + 0] = 1 - getUv(faceDirVector, normal, "x", "z", radius, width);
					uvs[j + 1] = 1 - getUv(faceDirVector, normal, "z", "x", radius, depth);
					break;
				case 4:
					faceDirVector.set(0, 0, 1);
					uvs[j + 0] = 1 - getUv(faceDirVector, normal, "x", "y", radius, width);
					uvs[j + 1] = 1 - getUv(faceDirVector, normal, "y", "x", radius, height);
					break;
				case 5:
					faceDirVector.set(0, 0, -1);
					uvs[j + 0] = getUv(faceDirVector, normal, "x", "y", radius, width);
					uvs[j + 1] = 1 - getUv(faceDirVector, normal, "y", "x", radius, height);
			}
		}
	}
	/**
	* Factory method for creating an instance of this class from the given
	* JSON object.
	*
	* @param {Object} data - A JSON object representing the serialized geometry.
	* @returns {RoundedBoxGeometry} A new instance.
	*/
	static fromJSON(data) {
		return new RoundedBoxGeometry(data.width, data.height, data.depth, data.segments, data.radius);
	}
};
//#endregion
//#region node_modules/three/examples/jsm/utils/BufferGeometryUtils.js
/**
* Merges a set of geometries into a single instance. All geometries must have compatible attributes.
*
* @param {Array<BufferGeometry>} geometries - The geometries to merge.
* @param {boolean} [useGroups=false] - Whether to use groups or not.
* @return {?BufferGeometry} The merged geometry. Returns `null` if the merge does not succeed.
*/
function mergeGeometries(geometries, useGroups = false) {
	const isIndexed = geometries[0].index !== null;
	const attributesUsed = new Set(Object.keys(geometries[0].attributes));
	const morphAttributesUsed = new Set(Object.keys(geometries[0].morphAttributes));
	const attributes = {};
	const morphAttributes = {};
	const morphTargetsRelative = geometries[0].morphTargetsRelative;
	const mergedGeometry = new BufferGeometry();
	let offset = 0;
	for (let i = 0; i < geometries.length; ++i) {
		const geometry = geometries[i];
		let attributesCount = 0;
		if (isIndexed !== (geometry.index !== null)) {
			console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + i + ". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them.");
			return null;
		}
		for (const name in geometry.attributes) {
			if (!attributesUsed.has(name)) {
				console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + i + ". All geometries must have compatible attributes; make sure \"" + name + "\" attribute exists among all geometries, or in none of them.");
				return null;
			}
			if (attributes[name] === void 0) attributes[name] = [];
			attributes[name].push(geometry.attributes[name]);
			attributesCount++;
		}
		if (attributesCount !== attributesUsed.size) {
			console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + i + ". Make sure all geometries have the same number of attributes.");
			return null;
		}
		if (morphTargetsRelative !== geometry.morphTargetsRelative) {
			console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + i + ". .morphTargetsRelative must be consistent throughout all geometries.");
			return null;
		}
		for (const name in geometry.morphAttributes) {
			if (!morphAttributesUsed.has(name)) {
				console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + i + ".  .morphAttributes must be consistent throughout all geometries.");
				return null;
			}
			if (morphAttributes[name] === void 0) morphAttributes[name] = [];
			morphAttributes[name].push(geometry.morphAttributes[name]);
		}
		if (useGroups) {
			let count;
			if (isIndexed) count = geometry.index.count;
			else if (geometry.attributes.position !== void 0) count = geometry.attributes.position.count;
			else {
				console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + i + ". The geometry must have either an index or a position attribute");
				return null;
			}
			mergedGeometry.addGroup(offset, count, i);
			offset += count;
		}
	}
	if (isIndexed) {
		let indexOffset = 0;
		const mergedIndex = [];
		for (let i = 0; i < geometries.length; ++i) {
			const index = geometries[i].index;
			for (let j = 0; j < index.count; ++j) mergedIndex.push(index.getX(j) + indexOffset);
			indexOffset += geometries[i].attributes.position.count;
		}
		mergedGeometry.setIndex(mergedIndex);
	}
	for (const name in attributes) {
		const mergedAttribute = mergeAttributes(attributes[name]);
		if (!mergedAttribute) {
			console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the " + name + " attribute.");
			return null;
		}
		mergedGeometry.setAttribute(name, mergedAttribute);
	}
	for (const name in morphAttributes) {
		const numMorphTargets = morphAttributes[name][0].length;
		if (numMorphTargets === 0) continue;
		mergedGeometry.morphAttributes = mergedGeometry.morphAttributes || {};
		mergedGeometry.morphAttributes[name] = [];
		for (let i = 0; i < numMorphTargets; ++i) {
			const morphAttributesToMerge = [];
			for (let j = 0; j < morphAttributes[name].length; ++j) morphAttributesToMerge.push(morphAttributes[name][j][i]);
			const mergedMorphAttribute = mergeAttributes(morphAttributesToMerge);
			if (!mergedMorphAttribute) {
				console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the " + name + " morphAttribute.");
				return null;
			}
			mergedGeometry.morphAttributes[name].push(mergedMorphAttribute);
		}
	}
	return mergedGeometry;
}
/**
* Merges a set of attributes into a single instance. All attributes must have compatible properties and types.
* Instances of {@link InterleavedBufferAttribute} are not supported.
*
* @param {Array<BufferAttribute>} attributes - The attributes to merge.
* @return {?BufferAttribute} The merged attribute. Returns `null` if the merge does not succeed.
*/
function mergeAttributes(attributes) {
	let TypedArray;
	let itemSize;
	let normalized;
	let gpuType = -1;
	let arrayLength = 0;
	for (let i = 0; i < attributes.length; ++i) {
		const attribute = attributes[i];
		if (TypedArray === void 0) TypedArray = attribute.array.constructor;
		if (TypedArray !== attribute.array.constructor) {
			console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes.");
			return null;
		}
		if (itemSize === void 0) itemSize = attribute.itemSize;
		if (itemSize !== attribute.itemSize) {
			console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes.");
			return null;
		}
		if (normalized === void 0) normalized = attribute.normalized;
		if (normalized !== attribute.normalized) {
			console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes.");
			return null;
		}
		if (gpuType === -1) gpuType = attribute.gpuType;
		if (gpuType !== attribute.gpuType) {
			console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes.");
			return null;
		}
		arrayLength += attribute.count * itemSize;
	}
	const array = new TypedArray(arrayLength);
	const result = new BufferAttribute(array, itemSize, normalized);
	let offset = 0;
	for (let i = 0; i < attributes.length; ++i) {
		const attribute = attributes[i];
		if (attribute.isInterleavedBufferAttribute) {
			const tupleOffset = offset / itemSize;
			for (let j = 0, l = attribute.count; j < l; j++) for (let c = 0; c < itemSize; c++) {
				const value = attribute.getComponent(j, c);
				result.setComponent(j + tupleOffset, c, value);
			}
		} else array.set(attribute.array, offset);
		offset += attribute.count * itemSize;
	}
	if (gpuType !== void 0) result.gpuType = gpuType;
	return result;
}
/**
* Returns a new geometry with vertices for which all similar vertex attributes (within tolerance) are merged.
*
* @param {BufferGeometry} geometry - The geometry to merge vertices for.
* @param {number} [tolerance=1e-4] - The tolerance value.
* @return {BufferGeometry} - The new geometry with merged vertices.
*/
function mergeVertices(geometry, tolerance = 1e-4) {
	tolerance = Math.max(tolerance, Number.EPSILON);
	const hashToIndex = {};
	const indices = geometry.getIndex();
	const positions = geometry.getAttribute("position");
	const vertexCount = indices ? indices.count : positions.count;
	let nextIndex = 0;
	const attributeNames = Object.keys(geometry.attributes);
	const tmpAttributes = {};
	const tmpMorphAttributes = {};
	const newIndices = [];
	const getters = [
		"getX",
		"getY",
		"getZ",
		"getW"
	];
	const setters = [
		"setX",
		"setY",
		"setZ",
		"setW"
	];
	for (let i = 0, l = attributeNames.length; i < l; i++) {
		const name = attributeNames[i];
		const attr = geometry.attributes[name];
		tmpAttributes[name] = new attr.constructor(new attr.array.constructor(attr.count * attr.itemSize), attr.itemSize, attr.normalized);
		const morphAttributes = geometry.morphAttributes[name];
		if (morphAttributes) {
			if (!tmpMorphAttributes[name]) tmpMorphAttributes[name] = [];
			morphAttributes.forEach((morphAttr, i) => {
				const array = new morphAttr.array.constructor(morphAttr.count * morphAttr.itemSize);
				tmpMorphAttributes[name][i] = new morphAttr.constructor(array, morphAttr.itemSize, morphAttr.normalized);
			});
		}
	}
	const halfTolerance = tolerance * .5;
	const exponent = Math.log10(1 / tolerance);
	const hashMultiplier = Math.pow(10, exponent);
	const hashAdditive = halfTolerance * hashMultiplier;
	for (let i = 0; i < vertexCount; i++) {
		const index = indices ? indices.getX(i) : i;
		let hash = "";
		for (let j = 0, l = attributeNames.length; j < l; j++) {
			const name = attributeNames[j];
			const attribute = geometry.getAttribute(name);
			const itemSize = attribute.itemSize;
			for (let k = 0; k < itemSize; k++) hash += `${~~(attribute[getters[k]](index) * hashMultiplier + hashAdditive)},`;
		}
		if (hash in hashToIndex) newIndices.push(hashToIndex[hash]);
		else {
			for (let j = 0, l = attributeNames.length; j < l; j++) {
				const name = attributeNames[j];
				const attribute = geometry.getAttribute(name);
				const morphAttributes = geometry.morphAttributes[name];
				const itemSize = attribute.itemSize;
				const newArray = tmpAttributes[name];
				const newMorphArrays = tmpMorphAttributes[name];
				for (let k = 0; k < itemSize; k++) {
					const getterFunc = getters[k];
					const setterFunc = setters[k];
					newArray[setterFunc](nextIndex, attribute[getterFunc](index));
					if (morphAttributes) for (let m = 0, ml = morphAttributes.length; m < ml; m++) newMorphArrays[m][setterFunc](nextIndex, morphAttributes[m][getterFunc](index));
				}
			}
			hashToIndex[hash] = nextIndex;
			newIndices.push(nextIndex);
			nextIndex++;
		}
	}
	const result = geometry.clone();
	for (const name in geometry.attributes) {
		const tmpAttribute = tmpAttributes[name];
		result.setAttribute(name, new tmpAttribute.constructor(tmpAttribute.array.slice(0, nextIndex * tmpAttribute.itemSize), tmpAttribute.itemSize, tmpAttribute.normalized));
		if (!(name in tmpMorphAttributes)) continue;
		for (let j = 0; j < tmpMorphAttributes[name].length; j++) {
			const tmpMorphAttribute = tmpMorphAttributes[name][j];
			result.morphAttributes[name][j] = new tmpMorphAttribute.constructor(tmpMorphAttribute.array.slice(0, nextIndex * tmpMorphAttribute.itemSize), tmpMorphAttribute.itemSize, tmpMorphAttribute.normalized);
		}
	}
	result.setIndex(newIndices);
	return result;
}
/**
* Modifies the supplied geometry if it is non-indexed, otherwise creates a new,
* non-indexed geometry. Returns the geometry with smooth normals everywhere except
* faces that meet at an angle greater than the crease angle.
*
* @param {BufferGeometry} geometry - The geometry to modify.
* @param {number} [creaseAngle=Math.PI/3] - The crease angle in radians.
* @return {BufferGeometry} - The updated geometry
*/
function toCreasedNormals(geometry, creaseAngle = Math.PI / 3) {
	const creaseDot = Math.cos(creaseAngle);
	const hashMultiplier = (1 + 1e-10) * 100;
	const verts = [
		new Vector3(),
		new Vector3(),
		new Vector3()
	];
	const tempVec1 = new Vector3();
	const tempVec2 = new Vector3();
	const tempNorm = new Vector3();
	const tempNorm2 = new Vector3();
	function hashVertex(v) {
		return `${~~(v.x * hashMultiplier)},${~~(v.y * hashMultiplier)},${~~(v.z * hashMultiplier)}`;
	}
	const resultGeometry = geometry.index ? geometry.toNonIndexed() : geometry;
	const posAttr = resultGeometry.attributes.position;
	const vertexMap = {};
	for (let i = 0, l = posAttr.count / 3; i < l; i++) {
		const i3 = 3 * i;
		const a = verts[0].fromBufferAttribute(posAttr, i3 + 0);
		const b = verts[1].fromBufferAttribute(posAttr, i3 + 1);
		const c = verts[2].fromBufferAttribute(posAttr, i3 + 2);
		tempVec1.subVectors(c, b);
		tempVec2.subVectors(a, b);
		const normal = new Vector3().crossVectors(tempVec1, tempVec2).normalize();
		for (let n = 0; n < 3; n++) {
			const vert = verts[n];
			const hash = hashVertex(vert);
			if (!(hash in vertexMap)) vertexMap[hash] = [];
			vertexMap[hash].push(normal);
		}
	}
	const normalArray = new Float32Array(posAttr.count * 3);
	const normAttr = new BufferAttribute(normalArray, 3, false);
	for (let i = 0, l = posAttr.count / 3; i < l; i++) {
		const i3 = 3 * i;
		const a = verts[0].fromBufferAttribute(posAttr, i3 + 0);
		const b = verts[1].fromBufferAttribute(posAttr, i3 + 1);
		const c = verts[2].fromBufferAttribute(posAttr, i3 + 2);
		tempVec1.subVectors(c, b);
		tempVec2.subVectors(a, b);
		tempNorm.crossVectors(tempVec1, tempVec2).normalize();
		for (let n = 0; n < 3; n++) {
			const vert = verts[n];
			const otherNormals = vertexMap[hashVertex(vert)];
			tempNorm2.set(0, 0, 0);
			for (let k = 0, lk = otherNormals.length; k < lk; k++) {
				const otherNorm = otherNormals[k];
				if (tempNorm.dot(otherNorm) > creaseDot) tempNorm2.add(otherNorm);
			}
			tempNorm2.normalize();
			normAttr.setXYZ(i3 + n, tempNorm2.x, tempNorm2.y, tempNorm2.z);
		}
	}
	resultGeometry.setAttribute("normal", normAttr);
	return resultGeometry;
}
//#endregion
export { PRINTER_PAPER_STOP_END as C, jelly as E, PRINTER_PAPER_PROFILES as S, installJellyEnvironment as T, POWERED_ACTIVE_DURATION as _, createRecordPlayerPerformance as a, poweredAnimationState as b, ensureRobotVacuumPerformanceRig as c, applyPortableSpeakerPerformance as d, resetPortableSpeakerPerformance as f, resetHairDryerPerformance as g, createHairDryerRibbonGeometry as h, RoundedBoxGeometry as i, PORTABLE_SPEAKER_ACTIVE_DURATION as l, applyHairDryerPerformance as m, mergeVertices as n, ensureRecordPlayerPerformanceRig as o, HAIR_DRYER_RIBBON_PROFILES as p, toCreasedNormals as r, createRobotVacuumPerformance as s, mergeGeometries as t, PORTABLE_SPEAKER_BASS_BEATS as u, PRINTER_POWERED_ACTIVE_DURATION as v, cableJelly as w, poweredPreviewCycleDuration as x, poweredActiveDuration as y };

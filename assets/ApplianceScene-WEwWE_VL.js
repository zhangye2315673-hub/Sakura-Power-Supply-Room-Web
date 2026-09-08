import { Cn as Raycaster, Dt as Object3D, Fn as ShaderMaterial, H as Group, It as Quaternion, J as InstancedMesh, Mt as Plane, Qn as TubeGeometry, S as CylinderGeometry, St as MeshToonMaterial, Xn as TorusGeometry, Z as LatheGeometry, a as BufferAttribute, b as Curve, bt as MeshPhysicalMaterial, d as CircleGeometry, dr as Vector3, ft as MathUtils, gt as MeshBasicMaterial, ht as Mesh, i as BoxGeometry, jt as PerspectiveCamera, mt as Matrix4, nt as LineCurve3, p as Color, pt as Matrix3, r as Box3, ur as Vector2, x as CurvePath } from "./three.core-DlTOC7bx.js";
import { n as PAL, t as ARROW_COLORS } from "./palette-knpLSfXB.js";
import { n as applianceCatalogSummary, r as selectAppliancesForSeed, t as APPLIANCE_CATALOG } from "./ApplianceCatalog-2_-hlaHk.js";
import { T as cableJelly, b as poweredActiveDuration, i as RoundedBoxGeometry, t as mergeGeometries, x as poweredAnimationState } from "./BufferGeometryUtils-B_UDylAy.js";
import { c as markSharedResource, l as SOFT_CAGE_FUNCTION_GLSL, s as disposeOwnedResource, t as addHullOutline, u as SOFT_CAGE_UNIFORM_GLSL } from "./outline-BxlNUz10.js";
import { n as createAlarmClockModel } from "./alarmClock-BNlAQNeN.js";
import { n as createBlenderModel } from "./blender-BDBHYjdo.js";
import { n as createBubbleMachineModel } from "./bubbleMachine-D2b3QY1Z.js";
import { n as createCoffeeMakerModel } from "./coffeeMaker-B2t1DEA1.js";
import { t as createDehumidifierModel } from "./dehumidifier-8cAY-H4Y.js";
import { t as createDesktopComputerModel } from "./desktopComputer-CG4Fq4Jb.js";
import { t as createFanModel } from "./fan-BMhmD4-i.js";
import { t as createGameControllerModel } from "./gameController-D1xOIvTz.js";
import { t as createGumballMachineModel } from "./gumballMachine-BY4TpQxR.js";
import { t as createHairDryerModel } from "./hairDryer-BrQ5r1Ff.js";
import { t as createHumidifierModel } from "./humidifier-t_mXQZ6z.js";
import { t as createInductionCooktopModel } from "./inductionCooktop-D_3vZVVR.js";
import { t as createKettleModel } from "./kettle--aaeMZVw.js";
import { t as createLampModel } from "./lamp-DScv1mJm.js";
import { t as createMicrowaveModel } from "./microwave-CxH7q6I_.js";
import { t as createPhoneModel } from "./phone-XQIskcS6.js";
import { t as createPopcornMachineModel } from "./popcornMachine-BHftRIvL.js";
import { t as createPortableSpeakerModel } from "./portableSpeaker-B5SWK5eq.js";
import { t as createPrinterModel } from "./printer-Zr8hcY-8.js";
import { t as createRadioModel } from "./radio-L7jYXCvV.js";
import { t as createRecordPlayerModel } from "./recordPlayer-XJTtlw6v.js";
import { t as createRefrigeratorModel } from "./refrigerator-bFxs-Qd0.js";
import { t as createRiceCookerModel } from "./riceCooker-CGLqYEX-.js";
import { t as createRobotVacuumModel } from "./robotVacuum-D0csz3kr.js";
import { t as createSmartBinModel } from "./smartBin-DJVpKjGh.js";
import { t as createStandMixerModel } from "./standMixer-BZzMtHNs.js";
import { t as createTelevisionModel } from "./television-CF1VEOG3.js";
import { t as createToasterModel } from "./toaster-DCkoL_wG.js";
import { t as createWasherModel } from "./washer-CyT15SzA.js";
//#region src/core/CooperativeYield.ts
/** Yield without waiting for the renderer's next animation frame. */
function yieldToMainThread() {
	const scheduler = globalThis.scheduler;
	if (scheduler?.yield) return scheduler.yield();
	return new Promise((resolve) => setTimeout(resolve, 0));
}
/** Keep long scene-build loops cooperative without paying one RAF per item. */
var CooperativeYieldBudget = class {
	budgetMs;
	maxItems;
	startedAt = performance.now();
	itemCount = 0;
	constructor(budgetMs = 8, maxItems = 4) {
		this.budgetMs = budgetMs;
		this.maxItems = maxItems;
	}
	async afterItem() {
		this.itemCount += 1;
		if (this.itemCount < this.maxItems && performance.now() - this.startedAt < this.budgetMs) return;
		await yieldToMainThread();
		this.startedAt = performance.now();
		this.itemCount = 0;
	}
};
var LANE_PITCH = .58;
var ARROW_RADIUS = .105;
var COLLISION_RADIUS = .15;
var PLUG_HEAD_MAX_RADIUS = .18;
var PLUG_HEAD_MAX_LENGTH = .64;
var CABLE_TAIL_TERMINAL_LENGTH = ARROW_RADIUS * 1.31;
var TERMINAL_PRESERVING_SOCKET_SHIFT = .5024500000000001;
var PLUG_HEAD_BODY_CLEARANCE_LENGTH = .52;
var PLUG_HEAD_PIN_RADIUS = .035;
var PLUG_HEAD_PIN_CLEARANCE = .08;
var PLUG_HEAD_CLEARANCE = .015;
var STATIC_BODY_CLEARANCE = .245;
var STATIC_PLUG_CLEARANCE = .3;
var EXIT_DISTANCE = 11 * LANE_PITCH * 1.65;
var DIRECTION_VECTORS = {
	"+X": new Vector3(1, 0, 0),
	"-X": new Vector3(-1, 0, 0),
	"+Y": new Vector3(0, 1, 0),
	"-Y": new Vector3(0, -1, 0),
	"+Z": new Vector3(0, 0, 1),
	"-Z": new Vector3(0, 0, -1)
};
function gridPointToWorld(point, target = new Vector3()) {
	return target.set((point[0] - 5) * LANE_PITCH, (point[1] - 5) * LANE_PITCH, (point[2] - 5) * LANE_PITCH);
}
function cableSocketPointsToWorld(definition) {
	const points = definition.path.map((point) => gridPointToWorld(point));
	if (definition.terminalAnchorMode !== "preserve-external-endpoints" || points.length < 2) return points;
	const tailDirection = points[0].clone().sub(points[1]).normalize();
	const headDirection = DIRECTION_VECTORS[definition.exitDirection];
	points[0].addScaledVector(tailDirection, TERMINAL_PRESERVING_SOCKET_SHIFT);
	points[points.length - 1].addScaledVector(headDirection, -.5024500000000001);
	return points;
}
function directionKeyFromDelta(delta) {
	if (delta[0] > 0) return "+X";
	if (delta[0] < 0) return "-X";
	if (delta[1] > 0) return "+Y";
	if (delta[1] < 0) return "-Y";
	if (delta[2] > 0) return "+Z";
	return "-Z";
}
//#endregion
//#region src/render/CableGeometry.ts
var CABLE_RADIUS = ARROW_RADIUS;
var CABLE_FILLET_RADIUS = .13;
var CABLE_FILLET_LEG_LIMIT = .28;
var REFRIGERATOR_FREEZE_COLOR = 7324368;
var REFRIGERATOR_ICE_COLOR = 8244952;
var REFRIGERATOR_ICE_OPACITY = .86;
var REFRIGERATOR_SPIKE_OPACITY = .96;
var COFFEE_STAIN_COLOR = 5188387;
var EPSILON = 1e-6;
var zAxis = new Vector3(0, 0, 1);
function createCableToonMaterial(color) {
	const material = cableJelly({
		color,
		thickness: CABLE_RADIUS * 2,
		transparent: false,
		opacity: 1
	});
	material.name = "sakura-cable-jelly";
	material.userData.materialRole = "cable-rubber";
	material.userData.radialSegments = 8;
	const visualInflation = { value: 0 };
	const freezeAmount = { value: 0 };
	const freezeProgress = { value: 0 };
	const freezeSeed = { value: 0 };
	const overheatAmount = { value: 0 };
	const overheatTurns = { value: 2 };
	const overheatTime = { value: 0 };
	const overheatReveal = { value: 0 };
	const coffeeAmount = { value: 0 };
	const coffeeReveal = { value: 0 };
	const coffeeSeed = { value: 0 };
	const coffeeTime = { value: 0 };
	const coffeeDirection = { value: 0 };
	const coffeeColor = { value: new Color(COFFEE_STAIN_COLOR) };
	const skillSweepProgress = { value: 0 };
	const skillSweepStrength = { value: 0 };
	const skillSweepColor = { value: new Color(10189768) };
	const skillRecolorProgress = { value: 0 };
	const skillRecolorColor = { value: new Color(15829589) };
	const previousOnBeforeCompile = material.onBeforeCompile.bind(material);
	const previousProgramCacheKey = material.customProgramCacheKey.bind(material);
	material.userData.visualInflation = visualInflation;
	material.userData.freezeAmount = freezeAmount;
	material.userData.freezeProgress = freezeProgress;
	material.userData.freezeSeed = freezeSeed;
	material.userData.overheatAmount = overheatAmount;
	material.userData.overheatTurns = overheatTurns;
	material.userData.overheatTime = overheatTime;
	material.userData.overheatReveal = overheatReveal;
	material.userData.coffeeAmount = coffeeAmount;
	material.userData.coffeeReveal = coffeeReveal;
	material.userData.coffeeSeed = coffeeSeed;
	material.userData.coffeeTime = coffeeTime;
	material.userData.coffeeDirection = coffeeDirection;
	material.userData.coffeeColor = coffeeColor;
	material.userData.skillSweepProgress = skillSweepProgress;
	material.userData.skillSweepStrength = skillSweepStrength;
	material.userData.skillSweepColor = skillSweepColor;
	material.userData.skillRecolorProgress = skillRecolorProgress;
	material.userData.skillRecolorColor = skillRecolorColor;
	material.userData.progressiveFreeze = true;
	material.onBeforeCompile = (shader, renderer) => {
		previousOnBeforeCompile(shader, renderer);
		shader.uniforms.uCableVisualInflation = visualInflation;
		shader.uniforms.uCableFreezeAmount = freezeAmount;
		shader.uniforms.uCableFreezeProgress = freezeProgress;
		shader.uniforms.uCableFreezeSeed = freezeSeed;
		shader.uniforms.uCableOverheatAmount = overheatAmount;
		shader.uniforms.uCableOverheatTurns = overheatTurns;
		shader.uniforms.uCableOverheatTime = overheatTime;
		shader.uniforms.uCableOverheatReveal = overheatReveal;
		shader.uniforms.uCableCoffeeAmount = coffeeAmount;
		shader.uniforms.uCableCoffeeReveal = coffeeReveal;
		shader.uniforms.uCableCoffeeSeed = coffeeSeed;
		shader.uniforms.uCableCoffeeTime = coffeeTime;
		shader.uniforms.uCableCoffeeDirection = coffeeDirection;
		shader.uniforms.uCableCoffeeColor = coffeeColor;
		shader.uniforms.uCableSkillSweepProgress = skillSweepProgress;
		shader.uniforms.uCableSkillSweepStrength = skillSweepStrength;
		shader.uniforms.uCableSkillSweepColor = skillSweepColor;
		shader.uniforms.uCableSkillRecolorProgress = skillRecolorProgress;
		shader.uniforms.uCableSkillRecolorColor = skillRecolorColor;
		shader.vertexShader = shader.vertexShader.replace("#include <common>", `#include <common>
uniform float uCableVisualInflation;
attribute float aCableProgress;
varying float vCableFreezeProgress;
varying vec3 vCableViewNormal;`).replace("#include <begin_vertex>", `#include <begin_vertex>
vCableFreezeProgress = aCableProgress;
vCableViewNormal = normalize(normalMatrix * objectNormal);
transformed += objectNormal * uCableVisualInflation;`);
		shader.fragmentShader = shader.fragmentShader.replace("#include <common>", `#include <common>
uniform float uCableFreezeAmount;
uniform float uCableFreezeProgress;
uniform float uCableFreezeSeed;
uniform float uCableOverheatAmount;
uniform float uCableOverheatTurns;
uniform float uCableOverheatTime;
uniform float uCableOverheatReveal;
uniform float uCableCoffeeAmount;
uniform float uCableCoffeeReveal;
uniform float uCableCoffeeSeed;
uniform float uCableCoffeeTime;
uniform float uCableCoffeeDirection;
uniform vec3 uCableCoffeeColor;
uniform float uCableSkillSweepProgress;
uniform float uCableSkillSweepStrength;
uniform vec3 uCableSkillSweepColor;
uniform float uCableSkillRecolorProgress;
uniform vec3 uCableSkillRecolorColor;
varying float vCableFreezeProgress;
varying vec3 vCableViewNormal;`).replace("vec4 diffuseColor = vec4( diffuse, opacity );", `vec4 diffuseColor = vec4( diffuse, opacity );
float cableFreezeDistance = 1.0 - vCableFreezeProgress;
float cableFreezeFront = 1.0 - smoothstep(
  uCableFreezeProgress - 0.075,
  uCableFreezeProgress + 0.025,
  cableFreezeDistance
);
if (uCableFreezeProgress > 0.985) cableFreezeFront = 1.0;
float cableFreezeCoverage = clamp(cableFreezeFront * uCableFreezeAmount, 0.0, 1.0);
vec3 cableFrozenColor = vec3(0.49, 0.81, 0.85);
diffuseColor.rgb = mix(diffuseColor.rgb, cableFrozenColor, cableFreezeCoverage * 0.9);

if (uCableSkillRecolorProgress > 0.001) {
  float cableRecolorDistanceFromCenter = abs(vCableFreezeProgress - 0.5) * 2.0;
  float cableRecolorCoverage = 1.0 - smoothstep(
    uCableSkillRecolorProgress - 0.085,
    uCableSkillRecolorProgress + 0.025,
    cableRecolorDistanceFromCenter
  );
  if (uCableSkillRecolorProgress > 0.995) cableRecolorCoverage = 1.0;
  diffuseColor.rgb = mix(diffuseColor.rgb, uCableSkillRecolorColor, cableRecolorCoverage);
}

vec3 cableCoffeeEmission = vec3(0.0);
if (uCableCoffeeAmount > 0.001) {
  float cableCoffeeAlong = mix(
    vCableFreezeProgress,
    1.0 - vCableFreezeProgress,
    step(0.5, uCableCoffeeDirection)
  );
  float cableCoffeeWave = sin(cableCoffeeAlong * 23.0 + uCableCoffeeSeed * 17.0) * 0.032;
  cableCoffeeWave += sin(cableCoffeeAlong * 51.0 - uCableCoffeeTime * 0.68 + uCableCoffeeSeed * 31.0) * 0.018;
  cableCoffeeWave += sin(cableCoffeeAlong * 91.0 + uCableCoffeeSeed * 47.0) * 0.008;
  float cableCoffeeSignedFront = uCableCoffeeReveal * 1.12 - cableCoffeeAlong + cableCoffeeWave;
  float cableCoffeeHalo = smoothstep(-0.16, 0.075, cableCoffeeSignedFront);
  float cableCoffeeCore = smoothstep(-0.045, 0.065, cableCoffeeSignedFront);
  float cableCoffeeEdgeCoverage = cableCoffeeHalo * (1.0 - cableCoffeeCore) * uCableCoffeeAmount;
  float cableCoffeeCoverage = cableCoffeeCore * uCableCoffeeAmount;
  vec3 cableCoffeeWetEdge = clamp(uCableCoffeeColor * 1.34 + vec3(0.018, 0.009, 0.006), 0.0, 1.0);
  diffuseColor.rgb = mix(diffuseColor.rgb, cableCoffeeWetEdge, cableCoffeeEdgeCoverage * 0.58);
  diffuseColor.rgb = mix(diffuseColor.rgb, uCableCoffeeColor, cableCoffeeCoverage);
  cableCoffeeEmission = uCableCoffeeColor * cableCoffeeCoverage * 0.22;
}

vec3 cableSkillSweepEmission = vec3(0.0);
if (uCableSkillSweepStrength > 0.001) {
  float sweepDistance = abs(vCableFreezeProgress - uCableSkillSweepProgress);
  float sweepHalo = 1.0 - smoothstep(0.035, 0.18, sweepDistance);
  float sweepCore = 1.0 - smoothstep(0.008, 0.058, sweepDistance);
  float sweepRim = pow(clamp(1.0 - abs(vCableViewNormal.z), 0.0, 1.0), 1.8);
  float sweepCoverage = clamp(
    sweepHalo * 0.42 + sweepCore * 0.62 + sweepRim * 0.08,
    0.0,
    1.0
  ) * uCableSkillSweepStrength;
  diffuseColor.rgb = mix(diffuseColor.rgb, uCableSkillSweepColor, sweepCoverage * 0.76);
  cableSkillSweepEmission = uCableSkillSweepColor * uCableSkillSweepStrength
    * (sweepCore * 0.78 + sweepHalo * 0.2 + sweepRim * 0.06);
}

vec3 cableHeatEmission = vec3(0.0);
if (uCableOverheatAmount > 0.001) {
  float cableHeatDistanceFromPlug = 1.0 - vCableFreezeProgress;
  float cableHeatReveal = 1.0 - smoothstep(
    uCableOverheatReveal - 0.08,
    uCableOverheatReveal + 0.035,
    cableHeatDistanceFromPlug
  );
  float cableHeatUrgency = 1.0 - step(1.5, uCableOverheatTurns);
  float cableHeatSpeed = mix(0.72, 0.92, cableHeatUrgency);
  float cableHeatPhase = fract(vCableFreezeProgress * 2.65 - uCableOverheatTime * cableHeatSpeed);
  float cableHeatBandA = 1.0 - smoothstep(0.055, 0.16, abs(cableHeatPhase - 0.18));
  float cableHeatBandB = 1.0 - smoothstep(0.045, 0.135, abs(cableHeatPhase - 0.62));
  float cableHeatBand = max(cableHeatBandA, cableHeatBandB);
  float cableHeatCoreA = 1.0 - smoothstep(0.018, 0.052, abs(cableHeatPhase - 0.18));
  float cableHeatCoreB = 1.0 - smoothstep(0.016, 0.046, abs(cableHeatPhase - 0.62));
  float cableHeatCore = max(cableHeatCoreA, cableHeatCoreB);
  float cableHeatRim = pow(clamp(1.0 - abs(vCableViewNormal.z), 0.0, 1.0), 2.2);
  float cableHeatBreath = 0.82 + sin(uCableOverheatTime * mix(3.4, 5.1, cableHeatUrgency)) * 0.18;
  float cableHeatCoverage = uCableOverheatAmount * cableHeatReveal * clamp(
    0.1 + cableHeatBand * 0.9 + cableHeatRim * 0.12,
    0.0,
    1.0
  );
  vec3 cableHeatColor = mix(vec3(1.0, 0.42, 0.055), vec3(1.0, 0.08, 0.025), cableHeatUrgency);
  vec3 cableHeatCoreColor = mix(vec3(1.0, 0.91, 0.48), vec3(1.0, 0.48, 0.16), cableHeatUrgency);
  diffuseColor.rgb = mix(
    diffuseColor.rgb,
    cableHeatColor,
    cableHeatCoverage * (0.38 + cableHeatBreath * 0.22)
  );
  cableHeatEmission = cableHeatColor * uCableOverheatAmount * cableHeatReveal * cableHeatBreath
    * (cableHeatBand * 0.82 + cableHeatRim * 0.08);
  cableHeatEmission += cableHeatCoreColor * uCableOverheatAmount * cableHeatReveal
    * cableHeatCore * 0.82;
}`);
		shader.fragmentShader = shader.fragmentShader.replace("#include <opaque_fragment>", "outgoingLight += cableHeatEmission + cableCoffeeEmission + cableSkillSweepEmission;\n#include <opaque_fragment>");
	};
	material.customProgramCacheKey = () => `${previousProgramCacheKey()}-cable-base-v12-skill-recolor`;
	return material;
}
function setCableSkillSweep(material, progress, strength, color) {
	const progressUniform = material.userData.skillSweepProgress;
	const strengthUniform = material.userData.skillSweepStrength;
	const colorUniform = material.userData.skillSweepColor;
	if (progressUniform) progressUniform.value = progress;
	if (strengthUniform) strengthUniform.value = MathUtils.clamp(strength, 0, 1);
	if (colorUniform) colorUniform.value.set(color);
}
function setCableSkillRecolor(material, progress, color) {
	const progressUniform = material.userData.skillRecolorProgress;
	const colorUniform = material.userData.skillRecolorColor;
	if (progressUniform) progressUniform.value = MathUtils.clamp(progress, 0, 1);
	if (colorUniform) colorUniform.value.set(color);
}
function setCableCoffeeStain(material, amount, reveal, seed, elapsed, direction) {
	const amountUniform = material.userData.coffeeAmount;
	const revealUniform = material.userData.coffeeReveal;
	const seedUniform = material.userData.coffeeSeed;
	const timeUniform = material.userData.coffeeTime;
	const directionUniform = material.userData.coffeeDirection;
	if (amountUniform) amountUniform.value = MathUtils.clamp(amount, 0, 1);
	if (revealUniform) revealUniform.value = MathUtils.clamp(reveal, 0, 1);
	if (seedUniform) seedUniform.value = seed;
	if (timeUniform) timeUniform.value = elapsed;
	if (directionUniform) directionUniform.value = direction >= .5 ? 1 : 0;
}
function setCableOverheat(material, amount, turnsRemaining, elapsed, reveal = 1) {
	const heatAmount = material.userData.overheatAmount;
	const heatTurns = material.userData.overheatTurns;
	const heatTime = material.userData.overheatTime;
	const heatReveal = material.userData.overheatReveal;
	if (heatAmount) heatAmount.value = MathUtils.clamp(amount, 0, 1);
	if (heatTurns) heatTurns.value = Math.max(1, turnsRemaining);
	if (heatTime) heatTime.value = Math.max(0, elapsed);
	if (heatReveal) heatReveal.value = MathUtils.clamp(reveal, 0, 1);
}
function createCableIceShellMaterial() {
	const material = new MeshPhysicalMaterial({
		name: "sakura-cable-ice-shell",
		color: REFRIGERATOR_ICE_COLOR,
		emissive: 2183007,
		emissiveIntensity: .02,
		roughness: .66,
		metalness: 0,
		clearcoat: .3,
		clearcoatRoughness: .34,
		transmission: 0,
		ior: 1.31,
		thickness: CABLE_RADIUS * .82,
		attenuationColor: new Color(6273223),
		attenuationDistance: 1.25,
		specularIntensity: .78,
		specularColor: new Color(13169139),
		transparent: true,
		opacity: .46,
		depthWrite: false,
		alphaTest: .012,
		flatShading: false
	});
	const amount = { value: 0 };
	const progress = { value: 0 };
	material.userData.materialRole = "cable-ice-shell";
	material.userData.iceAmount = amount;
	material.userData.iceProgress = progress;
	material.onBeforeCompile = (shader) => {
		shader.uniforms.uIceAmount = amount;
		shader.uniforms.uIceProgress = progress;
		shader.vertexShader = shader.vertexShader.replace("#include <common>", `#include <common>
attribute float aCableProgress;
varying float vIceCableProgress;
varying vec3 vIceViewNormal;`).replace("#include <begin_vertex>", `#include <begin_vertex>
vIceCableProgress = aCableProgress;
vIceViewNormal = normalize(normalMatrix * objectNormal);`);
		shader.fragmentShader = shader.fragmentShader.replace("#include <common>", `#include <common>
varying float vIceCableProgress;
varying vec3 vIceViewNormal;
uniform float uIceAmount;
uniform float uIceProgress;`).replace("vec4 diffuseColor = vec4( diffuse, opacity );", `vec4 diffuseColor = vec4( diffuse, opacity );
float iceDistance = 1.0 - vIceCableProgress;
float iceFront = 1.0 - smoothstep(
  uIceProgress - 0.075,
  uIceProgress + 0.025,
  iceDistance
);
if (uIceProgress > 0.985) iceFront = 1.0;
float iceCoverage = clamp(iceFront * uIceAmount, 0.0, 1.0);
if (iceCoverage < 0.012) discard;
float iceRim = pow(1.0 - clamp(abs(vIceViewNormal.z), 0.0, 1.0), 1.18);
// The original cable stays visible through the centre while the enlarged
// silhouette becomes denser. This makes the layer read as a clear ice casing
// around rubber instead of another flat cable colour.
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.84, 0.94, 0.91), iceRim * 0.12);
diffuseColor.a *= iceCoverage;`);
	};
	material.customProgramCacheKey = () => "sakura-cable-ice-shell-v3";
	return material;
}
function setCableIceShell(material, amount, progress) {
	const nextAmount = MathUtils.clamp(amount, 0, 1);
	const nextProgress = MathUtils.clamp(progress, 0, 1);
	if (material.userData.iceAmount) material.userData.iceAmount.value = nextAmount;
	if (material.userData.iceProgress) material.userData.iceProgress.value = nextProgress;
	material.visible = nextAmount > .001;
}
new Color(7324368), new Color(8244952), new Color(10412002), new Color(12052195), new Color(14086376);
/**
* A calm, continuous frost casing. The old implementation deliberately
* varied every ring and every triangle; that read as shattered glass once
* the camera moved. This keeps the original silhouette and adds only a soft
* low-poly inflation around it.
*/
function createRoundedIceShellGeometry(source, baseOffset = .012) {
	const geometry = source.clone();
	if (!geometry.getAttribute("normal")) geometry.computeVertexNormals();
	const position = geometry.getAttribute("position");
	const normal = geometry.getAttribute("normal");
	for (let index = 0; index < position.count; index += 1) position.setXYZ(index, position.getX(index) + normal.getX(index) * baseOffset, position.getY(index) + normal.getY(index) * baseOffset, position.getZ(index) + normal.getZ(index) * baseOffset);
	position.needsUpdate = true;
	geometry.computeVertexNormals();
	geometry.computeBoundingBox();
	geometry.computeBoundingSphere();
	geometry.userData.iceShell = true;
	return geometry;
}
function setCableFreeze(material, amount, progress, seed) {
	const amountUniform = material.userData.freezeAmount;
	const progressUniform = material.userData.freezeProgress;
	const seedUniform = material.userData.freezeSeed;
	if (amountUniform) amountUniform.value = MathUtils.clamp(amount, 0, 1);
	if (progressUniform) progressUniform.value = MathUtils.clamp(progress, 0, 1);
	if (seedUniform) seedUniform.value = seed;
}
var QuarterCircleCurve3 = class extends Curve {
	center;
	startRadius;
	axis;
	constructor(center, startRadius, axis) {
		super();
		this.center = center;
		this.startRadius = startRadius;
		this.axis = axis;
	}
	getPoint(t, target = new Vector3()) {
		return target.copy(this.startRadius).applyAxisAngle(this.axis, MathUtils.clamp(t, 0, 1) * Math.PI * .5).add(this.center);
	}
	getTangent(t, target = new Vector3()) {
		const radial = this.startRadius.clone().applyAxisAngle(this.axis, MathUtils.clamp(t, 0, 1) * Math.PI * .5);
		return target.crossVectors(this.axis, radial).normalize();
	}
};
function distinctPoints(points) {
	const result = [];
	points.forEach((point) => {
		if (!result.length || result[result.length - 1].distanceToSquared(point) > EPSILON ** 2) result.push(point.clone());
	});
	return result;
}
function addLine(curve, start, end) {
	if (start.distanceToSquared(end) <= EPSILON ** 2) return;
	curve.add(new LineCurve3(start.clone(), end.clone()));
}
function createRoundedCablePath(points, requestedRadius = CABLE_FILLET_RADIUS) {
	const sourcePoints = distinctPoints(points);
	if (sourcePoints.length < 2) throw new Error("A cable path needs at least two distinct points.");
	const curve = new CurvePath();
	const fillets = [];
	let cursor = sourcePoints[0].clone();
	for (let index = 1; index < sourcePoints.length - 1; index += 1) {
		const previous = sourcePoints[index - 1];
		const corner = sourcePoints[index];
		const next = sourcePoints[index + 1];
		const incomingVector = corner.clone().sub(previous);
		const outgoingVector = next.clone().sub(corner);
		const incomingLength = incomingVector.length();
		const outgoingLength = outgoingVector.length();
		const incoming = incomingVector.clone().normalize();
		const outgoing = outgoingVector.clone().normalize();
		const dot = incoming.dot(outgoing);
		const axis = incoming.clone().cross(outgoing);
		const isOrthogonal = Math.abs(dot) <= 1e-4 && axis.lengthSq() > 1e-8;
		const radius = isOrthogonal ? Math.min(requestedRadius, incomingLength * CABLE_FILLET_LEG_LIMIT, outgoingLength * CABLE_FILLET_LEG_LIMIT) : 0;
		if (!isOrthogonal || radius < .025) {
			if (dot < .9999) {
				addLine(curve, cursor, corner);
				cursor = corner.clone();
			}
			fillets.push({
				cornerIndex: index,
				applied: false,
				radius,
				incomingLength,
				outgoingLength,
				tangentStart: corner.clone(),
				tangentEnd: corner.clone(),
				center: null
			});
			continue;
		}
		axis.normalize();
		const tangentStart = corner.clone().addScaledVector(incoming, -radius);
		const tangentEnd = corner.clone().addScaledVector(outgoing, radius);
		const center = tangentStart.clone().addScaledVector(outgoing, radius);
		const startRadius = tangentStart.clone().sub(center);
		addLine(curve, cursor, tangentStart);
		curve.add(new QuarterCircleCurve3(center, startRadius, axis));
		cursor = tangentEnd;
		fillets.push({
			cornerIndex: index,
			applied: true,
			radius,
			incomingLength,
			outgoingLength,
			tangentStart,
			tangentEnd,
			center
		});
	}
	addLine(curve, cursor, sourcePoints[sourcePoints.length - 1]);
	if (curve.curves.length === 0) throw new Error("Cable path collapsed to zero length.");
	return {
		curve,
		fillets,
		sourcePoints
	};
}
function capGeometry(point, outwardNormal, radius, radialSegments) {
	const cap = new CircleGeometry(radius, radialSegments);
	cap.applyQuaternion(new Quaternion().setFromUnitVectors(zAxis, outwardNormal.clone().normalize()));
	cap.translate(point.x, point.y, point.z);
	return cap;
}
function takeNonIndexed(geometry) {
	const result = geometry.index ? geometry.toNonIndexed() : geometry.clone();
	geometry.dispose();
	return result;
}
function createCappedTubeGeometry(curve, radius = CABLE_RADIUS, radialSegments = 8, tubularSegments = Math.max(2, Math.ceil(curve.getLength() / .16))) {
	const tube = new TubeGeometry(curve, Math.max(2, tubularSegments), radius, radialSegments, false);
	const start = curve.getPoint(0);
	const end = curve.getPoint(1);
	const startTangent = curve.getTangent(0).normalize();
	const endTangent = curve.getTangent(1).normalize();
	const parts = [
		takeNonIndexed(tube),
		takeNonIndexed(capGeometry(start, startTangent.clone().negate(), radius, radialSegments)),
		takeNonIndexed(capGeometry(end, endTangent, radius, radialSegments))
	];
	const geometry = mergeGeometries(parts, false);
	parts.forEach((part) => part.dispose());
	if (!geometry) throw new Error("Unable to merge capped cable tube geometry.");
	const uv = geometry.getAttribute("uv");
	const progress = new Float32Array(geometry.getAttribute("position").count);
	if (uv) for (let index = 0; index < progress.length; index += 1) progress[index] = uv.getX(index);
	geometry.setAttribute("aCableProgress", new BufferAttribute(progress, 1));
	geometry.computeBoundingBox();
	geometry.computeBoundingSphere();
	return geometry;
}
function createRoundedCableGeometry(points, requestedRadius = CABLE_FILLET_RADIUS) {
	const path = createRoundedCablePath(points, requestedRadius);
	const lineSegments = Math.max(2, Math.ceil(path.curve.getLength() / .16));
	const arcSegments = path.fillets.filter((fillet) => fillet.applied).length * 4;
	const geometry = createCappedTubeGeometry(path.curve, CABLE_RADIUS, 8, lineSegments + arcSegments);
	geometry.userData.cableFillets = path.fillets.map((fillet) => ({
		cornerIndex: fillet.cornerIndex,
		applied: fillet.applied,
		radius: fillet.radius,
		tangentStart: fillet.tangentStart.toArray(),
		tangentEnd: fillet.tangentEnd.toArray(),
		center: fillet.center?.toArray() ?? null
	}));
	return {
		...path,
		geometry
	};
}
//#endregion
//#region src/render/PlugParts.ts
var PLUG_STYLE_IDS = [
	"round-two-pin",
	"usb-c",
	"flat-two-blade",
	"three-pin",
	"grounded-round",
	"dc-barrel",
	"magnetic-pogo"
];
var PLUG_STYLE_LABELS = {
	"round-two-pin": "圆形双针",
	"usb-c": "Type-C",
	"flat-two-blade": "扁平双片",
	"three-pin": "三针插头",
	"grounded-round": "圆形接地",
	"dc-barrel": "DC圆孔",
	"magnetic-pogo": "磁吸触点"
};
var PLUG_BODY_RADIUS = PLUG_HEAD_MAX_RADIUS;
var PLUG_BODY_BOTTOM = .14;
var PLUG_BODY_TOP = .46;
var PLUG_PIN_RADIUS = PLUG_HEAD_PIN_RADIUS;
var PLUG_PIN_BOTTOM = .47;
var PLUG_PIN_TOP = PLUG_HEAD_MAX_LENGTH;
var PLUG_HEAD_ENVELOPE = Object.freeze({
	anchorY: 0,
	maxRadius: PLUG_BODY_RADIUS,
	maxLength: PLUG_PIN_TOP,
	bodyRange: [PLUG_BODY_BOTTOM, PLUG_BODY_TOP],
	pinRange: [PLUG_PIN_BOTTOM, PLUG_PIN_TOP]
});
var sharedGeometryCache = /* @__PURE__ */ new Map();
function sharedGeometry(key, create) {
	const cached = sharedGeometryCache.get(key);
	if (cached) return cached;
	const geometry = create();
	geometry.computeBoundingBox();
	geometry.computeBoundingSphere();
	markSharedResource(geometry);
	sharedGeometryCache.set(key, geometry);
	return geometry;
}
var indicatorRecessGeometry = sharedGeometry("plug-indicator-recess", () => new CircleGeometry(.023, 10));
var indicatorGeometry = sharedGeometry("plug-indicator", () => new CircleGeometry(.015, 8));
var jointPickGeometry = sharedGeometry("plug-joint-pick", () => new CylinderGeometry(.172, PLUG_HEAD_ENVELOPE.maxRadius, .22, 10));
var jointPickMaterial = markSharedResource(new MeshBasicMaterial({
	transparent: true,
	opacity: 0,
	depthWrite: false,
	colorWrite: false,
	side: 2
}));
var plugShadowProxyMaterial = markSharedResource(new MeshBasicMaterial({
	colorWrite: false,
	depthWrite: false,
	toneMapped: false
}));
function captureRadialGeometry(geometry) {
	const position = geometry.getAttribute("position");
	return {
		geometry,
		basePositions: Float32Array.from(position.array)
	};
}
function applyRadialGeometryScale(state, scale, weightAtY) {
	const position = state.geometry.getAttribute("position");
	const scaleDelta = scale - 1;
	for (let index = 0; index < position.count; index += 1) {
		const offset = index * 3;
		const x = state.basePositions[offset];
		const y = state.basePositions[offset + 1];
		const z = state.basePositions[offset + 2];
		const radialScale = 1 + scaleDelta * MathUtils.clamp(weightAtY(y), 0, 1);
		position.setXYZ(index, x * radialScale, y, z * radialScale);
	}
	position.needsUpdate = true;
	state.geometry.computeVertexNormals();
	state.geometry.computeBoundingBox();
	state.geometry.computeBoundingSphere();
}
function tagPart(object, partId, styleId) {
	object.userData.partId = partId;
	object.userData.plugStyleId = styleId;
	return object;
}
function tagMaterial(material, name, role) {
	material.name = name;
	material.userData.materialRole = role;
	material.userData.toonBands = name.includes("cavity") ? 2 : 3;
	return material;
}
function installPlugOverheatShader(material, uniforms) {
	const previousOnBeforeCompile = material.onBeforeCompile.bind(material);
	const previousProgramCacheKey = material.customProgramCacheKey.bind(material);
	material.userData.plugOverheatUniforms = uniforms;
	material.onBeforeCompile = (shader, renderer) => {
		previousOnBeforeCompile(shader, renderer);
		shader.uniforms.uPlugOverheatAmount = uniforms.amount;
		shader.uniforms.uPlugOverheatTurns = uniforms.turns;
		shader.uniforms.uPlugOverheatTime = uniforms.time;
		shader.uniforms.uPlugOverheatReveal = uniforms.reveal;
		shader.uniforms.uPlugOverheatPathScale = uniforms.pathScale;
		shader.vertexShader = shader.vertexShader.replace("#include <common>", `#include <common>
varying float vPlugOverheatProgress;
varying vec3 vPlugOverheatViewNormal;`).replace("#include <begin_vertex>", `#include <begin_vertex>
vPlugOverheatProgress = clamp(transformed.y / ${PLUG_HEAD_MAX_LENGTH.toFixed(6)}, 0.0, 1.0);
vPlugOverheatViewNormal = normalize(normalMatrix * objectNormal);`);
		shader.fragmentShader = shader.fragmentShader.replace("#include <common>", `#include <common>
uniform float uPlugOverheatAmount;
uniform float uPlugOverheatTurns;
uniform float uPlugOverheatTime;
uniform float uPlugOverheatReveal;
uniform float uPlugOverheatPathScale;
varying float vPlugOverheatProgress;
varying vec3 vPlugOverheatViewNormal;`).replace("vec4 diffuseColor = vec4( diffuse, opacity );", `vec4 diffuseColor = vec4( diffuse, opacity );
vec3 plugHeatEmission = vec3(0.0);
if (uPlugOverheatAmount > 0.001) {
  float plugHeatUrgency = 1.0 - step(1.5, uPlugOverheatTurns);
  float plugHeatSpeed = mix(0.72, 0.92, plugHeatUrgency);
  float plugHeatPath = 1.0 + vPlugOverheatProgress * uPlugOverheatPathScale;
  float plugHeatPhase = fract(plugHeatPath * 2.65 - uPlugOverheatTime * plugHeatSpeed);
  float plugHeatBandA = 1.0 - smoothstep(0.055, 0.16, abs(plugHeatPhase - 0.18));
  float plugHeatBandB = 1.0 - smoothstep(0.045, 0.135, abs(plugHeatPhase - 0.62));
  float plugHeatBand = max(plugHeatBandA, plugHeatBandB);
  float plugHeatCoreA = 1.0 - smoothstep(0.018, 0.052, abs(plugHeatPhase - 0.18));
  float plugHeatCoreB = 1.0 - smoothstep(0.016, 0.046, abs(plugHeatPhase - 0.62));
  float plugHeatCore = max(plugHeatCoreA, plugHeatCoreB);
  float plugHeatRim = pow(clamp(1.0 - abs(vPlugOverheatViewNormal.z), 0.0, 1.0), 2.2);
  float plugHeatBreath = 0.82 + sin(uPlugOverheatTime * mix(3.4, 5.1, plugHeatUrgency)) * 0.18;
  float plugHeatReveal = smoothstep(0.0, 0.12, uPlugOverheatReveal);
  float plugHeatCoverage = uPlugOverheatAmount * plugHeatReveal * clamp(
    0.1 + plugHeatBand * 0.9 + plugHeatRim * 0.12,
    0.0,
    1.0
  );
  vec3 plugHeatColor = mix(vec3(1.0, 0.42, 0.055), vec3(1.0, 0.08, 0.025), plugHeatUrgency);
  vec3 plugHeatCoreColor = mix(vec3(1.0, 0.91, 0.48), vec3(1.0, 0.48, 0.16), plugHeatUrgency);
  diffuseColor.rgb = mix(
    diffuseColor.rgb,
    plugHeatColor,
    plugHeatCoverage * (0.38 + plugHeatBreath * 0.22)
  );
  plugHeatEmission = plugHeatColor * uPlugOverheatAmount * plugHeatReveal * plugHeatBreath
    * (plugHeatBand * 0.82 + plugHeatRim * 0.08);
  plugHeatEmission += plugHeatCoreColor * uPlugOverheatAmount * plugHeatReveal
    * plugHeatCore * 0.82;
}`);
		shader.fragmentShader = shader.fragmentShader.replace("#include <opaque_fragment>", "outgoingLight += plugHeatEmission;\n#include <opaque_fragment>");
	};
	material.customProgramCacheKey = () => `${previousProgramCacheKey()}-plug-overheat-flow-v1`;
}
var terminalGeometryCache = /* @__PURE__ */ new Map();
function terminalGeometryParts(styleId) {
	const cached = terminalGeometryCache.get(styleId);
	if (cached) return cached;
	const parts = [];
	const add = (geometry, materialRole = "pin", name = "contact", castShadow = true) => {
		parts.push({
			geometry,
			materialRole,
			name,
			castShadow
		});
	};
	if (styleId === "round-two-pin") for (const x of [-.075, .075]) add(new CylinderGeometry(PLUG_PIN_RADIUS, PLUG_PIN_RADIUS, PLUG_PIN_TOP - PLUG_PIN_BOTTOM, 10).translate(x, (PLUG_PIN_TOP + PLUG_PIN_BOTTOM) * .5, 0));
	else if (styleId === "usb-c") {
		add(new RoundedBoxGeometry(.225, .115, .11, 2, .045).translate(0, .555, 0), "pin", "type-c-shell");
		add(new RoundedBoxGeometry(.148, .04, .052, 2, .022).translate(0, .616, 0), "dark", "type-c-slot");
	} else if (styleId === "flat-two-blade") for (const x of [-.068, .068]) add(new BoxGeometry(.045, .17, .092).translate(x, .555, 0), "pin", "blade");
	else if (styleId === "three-pin") for (const [x, z, length] of [
		[
			-.078,
			-.045,
			.145
		],
		[
			.078,
			-.045,
			.145
		],
		[
			0,
			.082,
			.17
		]
	]) add(new CylinderGeometry(.031, .031, length, 12).translate(x, .47 + length * .5, z), "pin", "pin");
	else if (styleId === "grounded-round") {
		for (const x of [-.073, .073]) add(new CylinderGeometry(.033, .033, .15, 12).translate(x, .55, -.028), "pin", "main-pin");
		add(new CylinderGeometry(.026, .026, .115, 12).translate(0, .5275, .09), "pin", "earth-pin");
	} else if (styleId === "dc-barrel") {
		add(new CylinderGeometry(.092, .1, .145, 12).translate(0, .545, 0), "pin", "barrel");
		add(new CylinderGeometry(.047, .047, .012, 12).translate(0, .623, 0), "dark", "hole", false);
	} else {
		add(new CylinderGeometry(.155, .16, .07, 12).translate(0, .515, 0), "dark", "magnetic-face");
		for (const x of [
			-.075,
			0,
			.075
		]) add(new CylinderGeometry(.031, .031, .052, 12).translate(x, .576, 0), "pin", "pogo-contact");
	}
	const partsByMaterial = /* @__PURE__ */ new Map();
	parts.forEach((part) => {
		const materialParts = partsByMaterial.get(part.materialRole);
		if (materialParts) materialParts.push(part);
		else partsByMaterial.set(part.materialRole, [part]);
	});
	const result = [];
	partsByMaterial.forEach((materialParts, materialRole) => {
		let geometry;
		if (materialParts.length === 1) geometry = materialParts[0].geometry;
		else {
			const sourceGeometries = materialParts.map((part) => part.geometry);
			const mergedGeometry = mergeGeometries(sourceGeometries, false);
			sourceGeometries.forEach((source) => source.dispose());
			if (!mergedGeometry) throw new Error(`Unable to merge terminal geometry for ${styleId}`);
			geometry = mergedGeometry;
		}
		geometry.computeBoundingBox();
		geometry.computeBoundingSphere();
		markSharedResource(geometry);
		result.push({
			geometry,
			materialRole,
			name: materialParts.length === 1 ? `${styleId}-${materialParts[0].name}` : `${styleId}-${materialParts.map((part) => part.name).join("-")}-batch`,
			castShadow: materialParts.some((part) => part.castShadow)
		});
	});
	terminalGeometryCache.set(styleId, result);
	return result;
}
function terminalMesh(styleId, pinMaterial, darkMaterial) {
	const terminal = new Group();
	terminal.name = "plug-terminal-assembly";
	terminal.userData.partId = "terminal-assembly";
	terminal.userData.plugStyleId = styleId;
	terminalGeometryParts(styleId).forEach((part) => {
		const material = part.materialRole === "pin" ? pinMaterial : darkMaterial;
		const mesh = new Mesh(part.geometry, material);
		mesh.name = part.name;
		mesh.castShadow = false;
		mesh.userData.partId = "terminal-assembly";
		mesh.userData.plugStyleId = styleId;
		mesh.userData.castsViaPlugShadowProxy = part.castShadow;
		terminal.add(mesh);
	});
	return terminal;
}
function shadowGeometryPart(source) {
	const geometry = source.index ? source.toNonIndexed() : source.clone();
	for (const name of Object.keys(geometry.attributes)) if (name !== "position" && name !== "normal") geometry.deleteAttribute(name);
	return geometry;
}
function fixedPlugShadowGeometry(styleId, shell, frontShoulder, face) {
	return sharedGeometry(`plug-shadow-${styleId}`, () => {
		const parts = [
			shadowGeometryPart(shell),
			shadowGeometryPart(frontShoulder),
			shadowGeometryPart(face),
			...terminalGeometryParts(styleId).filter((part) => part.castShadow).map((part) => shadowGeometryPart(part.geometry))
		];
		const merged = mergeGeometries(parts, false);
		parts.forEach((part) => part.dispose());
		if (!merged) throw new Error(`Unable to merge plug shadow geometry for ${styleId}`);
		return merged;
	});
}
function createPlugHead(color, scale = 1, energized = false, styleId = "round-two-pin") {
	const root = new Group();
	root.name = `plug-head-${styleId}`;
	root.userData.plugStyleId = styleId;
	const lineColor = new Color(color);
	const shellColor = lineColor.clone();
	const faceColor = lineColor.clone();
	const sleeveColor = lineColor.clone();
	const pinColor = new Color(10985645);
	const darkColor = new Color(5590371);
	const inactiveIndicatorColor = new Color(6445680);
	const shellMaterial = tagMaterial(cableJelly({
		color: shellColor,
		thickness: .12,
		transparent: false,
		opacity: 1
	}), "plug-shell-toon", "outer-shell");
	const faceMaterial = tagMaterial(cableJelly({
		color: faceColor,
		thickness: .12,
		transparent: false,
		opacity: 1
	}), "plug-face-toon", "front-shoulder");
	const sleeveMaterial = tagMaterial(cableJelly({
		color: sleeveColor,
		thickness: .12,
		transparent: false,
		opacity: 1
	}), "plug-rubber-toon", "strain-relief");
	const pinMaterial = tagMaterial(cableJelly({
		color: pinColor,
		thickness: .12,
		transparent: false,
		opacity: 1
	}), "plug-metal-toon", "terminal-metal");
	const darkMaterial = tagMaterial(cableJelly({
		color: darkColor,
		thickness: .12,
		transparent: false,
		opacity: 1
	}), "plug-cavity-toon", "interface-cavity");
	const indicatorMaterial = tagMaterial(cableJelly({
		color: energized ? PAL.blossomLight : 6445680,
		thickness: .06,
		emissive: lineColor,
		emissiveIntensity: energized ? 1 : .16
	}), "plug-indicator-toon", "status-indicator");
	const overheatUniforms = {
		amount: { value: 0 },
		turns: { value: 2 },
		time: { value: 0 },
		reveal: { value: 0 },
		pathScale: { value: 0 }
	};
	const overheatMaterials = [
		shellMaterial,
		faceMaterial,
		sleeveMaterial,
		pinMaterial,
		darkMaterial
	];
	overheatMaterials.forEach((material) => installPlugOverheatShader(material, overheatUniforms));
	let skillTintColor = null;
	let skillTintStrength = 0;
	let skillTintEmissionScale = 1;
	let skillGlowStrength = 0;
	let frozenAmount = 0;
	let isHovered = false;
	let recycleSelectionState = "none";
	let recycleSelectionPulse = 0;
	const hoverLight = new Color(PAL.blossomLight);
	const recycleHoverColor = new Color(6288079);
	const recycleSelectedColor = new Color(16768882);
	const recycleSelectionColor = () => {
		if (recycleSelectionState === "hover") return recycleHoverColor;
		if (recycleSelectionState === "selected") return recycleSelectedColor;
		return null;
	};
	const tinted = (base, includeSkillTint = true) => {
		const result = base.clone();
		if (includeSkillTint && skillTintColor) result.lerp(skillTintColor, skillTintStrength);
		if (frozenAmount > 0) {
			const terminal = base === pinColor || base === darkColor;
			result.lerp(new Color(REFRIGERATOR_FREEZE_COLOR), frozenAmount * (terminal ? .84 : .9));
		}
		const selectionColor = recycleSelectionColor();
		if (selectionColor) result.lerp(selectionColor, recycleSelectionState === "selected" ? .56 : .38);
		return result;
	};
	const refreshColor = () => {
		shellMaterial.color.copy(tinted(shellColor));
		faceMaterial.color.copy(tinted(faceColor));
		sleeveMaterial.color.copy(tinted(sleeveColor));
		pinMaterial.color.copy(tinted(pinColor, false));
		darkMaterial.color.copy(tinted(darkColor, false));
		const selectionColor = recycleSelectionColor();
		if (isHovered && !selectionColor) shellMaterial.color.lerp(hoverLight, .2);
		const indicatorBase = isHovered || energized ? new Color(PAL.blossomLight) : inactiveIndicatorColor;
		indicatorMaterial.color.copy(tinted(indicatorBase));
		const coloredMaterials = [
			[
				shellMaterial,
				shellColor,
				true
			],
			[
				faceMaterial,
				faceColor,
				true
			],
			[
				sleeveMaterial,
				sleeveColor,
				true
			],
			[
				pinMaterial,
				pinColor,
				false
			],
			[
				darkMaterial,
				darkColor,
				false
			]
		];
		for (const [material, base, includeSkillTint] of coloredMaterials) if (selectionColor) {
			material.emissive.copy(selectionColor);
			material.emissiveIntensity = recycleSelectionState === "selected" ? .32 + recycleSelectionPulse * .18 : .14 + recycleSelectionPulse * .08;
		} else if (skillGlowStrength > 0) {
			material.emissive.copy(base);
			material.emissiveIntensity = .5 + skillGlowStrength * .72;
		} else if (skillTintColor && includeSkillTint) {
			material.emissive.copy(skillTintColor);
			material.emissiveIntensity = .22 * skillTintEmissionScale;
		} else if (frozenAmount > 0) {
			material.emissive.set(8830417);
			material.emissiveIntensity = frozenAmount * .045;
		} else {
			material.emissive.set(0);
			material.emissiveIntensity = 1;
		}
		indicatorMaterial.emissive.copy(selectionColor ?? (skillGlowStrength > 0 ? lineColor : skillTintColor) ?? (frozenAmount > 0 ? new Color(12381951) : lineColor));
		indicatorMaterial.emissiveIntensity = selectionColor ? .46 + recycleSelectionPulse * .22 : skillGlowStrength > 0 ? .78 + skillGlowStrength * .72 : skillTintColor ? .42 * skillTintEmissionScale : frozenAmount > 0 ? .3 + frozenAmount * .36 : isHovered ? .92 : energized ? 1 : .16;
	};
	const assembly = tagPart(new Group(), "plug-assembly", styleId);
	assembly.name = "plug-assembly";
	const bodyRadius = styleId === "three-pin" ? PLUG_BODY_RADIUS : styleId === "usb-c" ? .168 : .174;
	const radialScale = bodyRadius / PLUG_BODY_RADIUS;
	const shellGeometry = sharedGeometry(`plug-shell-${styleId}`, () => {
		const geometry = new LatheGeometry([
			new Vector2(.16 * radialScale, .164),
			new Vector2(.176 * radialScale, .188),
			new Vector2(PLUG_BODY_RADIUS * radialScale, .216),
			new Vector2(PLUG_BODY_RADIUS * radialScale, .398),
			new Vector2(.176 * radialScale, .422),
			new Vector2(.164 * radialScale, .44)
		], 12);
		geometry.computeVertexNormals();
		return geometry;
	});
	const shell = new Mesh(shellGeometry, shellMaterial);
	shell.name = "plug-outer-shell";
	shell.castShadow = false;
	shell.receiveShadow = true;
	tagPart(shell, "outer-shell", styleId);
	addHullOutline(shell, .0033).visible = false;
	const faceRadius = styleId === "magnetic-pogo" ? .165 : bodyRadius * .9;
	const frontShoulderGeometry = sharedGeometry(`plug-front-shoulder-${styleId}`, () => new CylinderGeometry(faceRadius, bodyRadius * .95, .04, 12).translate(0, .452, 0));
	const frontShoulder = new Mesh(frontShoulderGeometry, faceMaterial);
	frontShoulder.name = "plug-front-shoulder";
	frontShoulder.castShadow = false;
	tagPart(frontShoulder, "front-shoulder", styleId);
	addHullOutline(frontShoulder, .0023).visible = false;
	const faceIceGeometry = sharedGeometry(`plug-face-ice-${styleId}`, () => new CylinderGeometry(faceRadius * .94, faceRadius, .026, 12).translate(0, .477, 0));
	const indicatorFacetRadius = bodyRadius * Math.cos(Math.PI / 12);
	const faceGeometry = sharedGeometry(`plug-face-${styleId}`, () => {
		const recessTransform = new Matrix4().compose(new Vector3(indicatorFacetRadius + 3e-4, .34, 0), new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI * .5), new Vector3(1, 1, 1));
		const facePart = faceIceGeometry.clone();
		const recessPart = indicatorRecessGeometry.clone().applyMatrix4(recessTransform);
		const merged = mergeGeometries([facePart, recessPart], false);
		facePart.dispose();
		recessPart.dispose();
		if (!merged) throw new Error(`Unable to merge plug faceplate geometry for ${styleId}`);
		return merged;
	});
	const face = new Mesh(faceGeometry, darkMaterial);
	face.name = "plug-interface-faceplate";
	face.castShadow = false;
	tagPart(face, "interface-faceplate", styleId);
	const sleeve = new Mesh(new LatheGeometry([
		new Vector2(.105, .004),
		new Vector2(.108, .026),
		new Vector2(.114, .037),
		new Vector2(.11, .048),
		new Vector2(.121, .06),
		new Vector2(.117, .073),
		new Vector2(.129, .087),
		new Vector2(.124, .101),
		new Vector2(.137, .119),
		new Vector2(.145, .14),
		new Vector2(.15, .16)
	], 12), sleeveMaterial);
	sleeve.name = "plug-strain-relief";
	sleeve.castShadow = true;
	tagPart(sleeve, "strain-relief", styleId);
	const sleeveOutline = addHullOutline(sleeve, .00245);
	sleeveOutline.visible = false;
	const rearNeck = new Mesh(new CylinderGeometry(.162 * radialScale, .145, .052, 12).translate(0, .158, 0), sleeveMaterial);
	rearNeck.name = "plug-rear-neck";
	rearNeck.castShadow = true;
	tagPart(rearNeck, "rear-neck", styleId);
	const sleeveGeometryState = captureRadialGeometry(sleeve.geometry);
	const sleeveOutlineGeometryState = captureRadialGeometry(sleeveOutline.geometry);
	const rearNeckGeometryState = captureRadialGeometry(rearNeck.geometry);
	let cableJointThicknessScale = 1;
	const setCableJointThickness = (nextScale = 1) => {
		cableJointThicknessScale = MathUtils.clamp(nextScale, 1, 2.4);
		const sleeveWeight = (y) => .18 + .82 * (1 - MathUtils.smoothstep(y, .004, .16));
		const rearNeckWeight = (y) => .18 * (1 - MathUtils.smoothstep(y, .132, .184));
		applyRadialGeometryScale(sleeveGeometryState, cableJointThicknessScale, sleeveWeight);
		applyRadialGeometryScale(sleeveOutlineGeometryState, cableJointThicknessScale, sleeveWeight);
		applyRadialGeometryScale(rearNeckGeometryState, cableJointThicknessScale, rearNeckWeight);
	};
	const indicatorRecess = new Mesh(indicatorRecessGeometry, darkMaterial);
	indicatorRecess.name = "plug-status-recess";
	indicatorRecess.rotation.y = Math.PI * .5;
	indicatorRecess.position.set(indicatorFacetRadius + 3e-4, .34, 0);
	tagPart(indicatorRecess, "status-indicator", styleId);
	indicatorRecess.visible = false;
	const indicator = new Mesh(indicatorGeometry, indicatorMaterial);
	indicator.name = "plug-status-indicator";
	indicator.rotation.y = Math.PI * .5;
	indicator.position.set(indicatorFacetRadius + 8e-4, .34, 0);
	const jointPick = new Mesh(jointPickGeometry, jointPickMaterial);
	jointPick.name = "plug-cable-joint-pick";
	jointPick.position.y = .11;
	jointPick.visible = false;
	const hoverFocus = new Group();
	hoverFocus.name = "plug-hover-focus";
	hoverFocus.position.y = .555;
	hoverFocus.visible = false;
	const hoverInnerMaterial = new MeshBasicMaterial({
		color: 16771491,
		transparent: true,
		opacity: 0,
		depthWrite: false,
		toneMapped: false
	});
	const hoverOuterMaterial = hoverInnerMaterial.clone();
	const hoverInner = new Mesh(sharedGeometry(`plug-hover-inner-${styleId}`, () => new TorusGeometry(bodyRadius * .78, .012, 4, 12)), hoverInnerMaterial);
	const hoverOuter = new Mesh(sharedGeometry(`plug-hover-outer-${styleId}`, () => new TorusGeometry(bodyRadius * .93, .007, 4, 12)), hoverOuterMaterial);
	hoverInner.rotation.x = Math.PI * .5;
	hoverOuter.rotation.x = Math.PI * .5;
	hoverInner.renderOrder = 9;
	hoverOuter.renderOrder = 9;
	hoverFocus.add(hoverInner, hoverOuter);
	const refreshFocus = () => {
		const selectionColor = recycleSelectionColor();
		const visible = isHovered || selectionColor !== null;
		hoverFocus.visible = visible;
		if (!visible) {
			hoverInnerMaterial.opacity = 0;
			hoverOuterMaterial.opacity = 0;
			hoverFocus.scale.setScalar(1);
			return;
		}
		const focusColor = selectionColor ?? hoverLight;
		hoverInnerMaterial.color.copy(focusColor);
		hoverOuterMaterial.color.copy(focusColor);
		if (recycleSelectionState === "selected") {
			hoverInnerMaterial.opacity = .66;
			hoverOuterMaterial.opacity = .34;
			hoverFocus.scale.setScalar(1.06 + recycleSelectionPulse * .05);
			return;
		}
		if (recycleSelectionState === "hover") {
			hoverInnerMaterial.opacity = .54;
			hoverOuterMaterial.opacity = .24;
			hoverFocus.scale.setScalar(1.02 + recycleSelectionPulse * .025);
			return;
		}
		hoverInnerMaterial.opacity = .72;
		hoverOuterMaterial.opacity = .32;
		hoverFocus.scale.setScalar(1 + Math.sin(performance.now() * .006) * .035);
	};
	tagPart(indicator, "status-indicator", styleId);
	const indicatorGroup = tagPart(new Group(), "status-indicator", styleId);
	indicatorGroup.name = "plug-status-indicator-node";
	indicatorGroup.add(indicatorRecess, indicator);
	const terminal = terminalMesh(styleId, pinMaterial, darkMaterial);
	const shadowProxy = new Mesh(fixedPlugShadowGeometry(styleId, shellGeometry, frontShoulderGeometry, faceGeometry), plugShadowProxyMaterial);
	shadowProxy.name = "plug-fixed-shadow-proxy";
	shadowProxy.castShadow = true;
	shadowProxy.receiveShadow = false;
	shadowProxy.layers.set(30);
	shadowProxy.userData.shadowProxy = true;
	const frozenShell = new Group();
	frozenShell.name = "plug-frozen-shell";
	frozenShell.visible = false;
	frozenShell.userData.iceShell = true;
	frozenShell.scale.setScalar(1.095);
	let frozenGeometryEnabled = false;
	let frozenShellMaterial = null;
	const ensureFrozenShellGeometry = () => {
		if (frozenShell.children.length > 0) return;
		frozenShellMaterial = new MeshPhysicalMaterial({
			name: "sakura-plug-refrigerator-ice-shell",
			color: REFRIGERATOR_ICE_COLOR,
			emissive: 2445153,
			emissiveIntensity: .025,
			roughness: .58,
			metalness: 0,
			clearcoat: .42,
			clearcoatRoughness: .34,
			transparent: true,
			opacity: 0,
			depthWrite: false,
			side: 2,
			flatShading: true
		});
		frozenShellMaterial.userData.materialRole = "plug-refrigerator-ice-shell";
		[
			sleeve,
			rearNeck,
			shell,
			frontShoulder,
			face
		].forEach((source) => {
			const sourceGeometry = source === face ? faceIceGeometry : source.geometry;
			const icePart = new Mesh(sourceGeometry, frozenShellMaterial);
			icePart.name = `ice-${source.name}`;
			icePart.position.copy(source.position);
			icePart.quaternion.copy(source.quaternion);
			icePart.scale.copy(source.scale);
			icePart.renderOrder = 5;
			icePart.userData.iceShell = true;
			const iceOutline = addHullOutline(icePart, .0054, PAL.ink);
			iceOutline.userData.iceShellOutline = true;
			frozenShell.add(icePart);
		});
		const terminalIce = terminal.clone(true);
		terminalIce.name = "ice-terminal-assembly";
		const outlineNodes = [];
		const terminalIceMeshes = [];
		terminalIce.traverse((object) => {
			if (object.userData.isOutline === true) {
				outlineNodes.push(object);
				return;
			}
			if (!(object instanceof Mesh)) return;
			object.material = frozenShellMaterial;
			object.renderOrder = 5;
			object.userData.iceShell = true;
			terminalIceMeshes.push(object);
		});
		outlineNodes.forEach((object) => object.removeFromParent());
		terminalIceMeshes.forEach((iceMesh) => {
			const iceOutline = addHullOutline(iceMesh, .0048, PAL.ink);
			iceOutline.userData.iceShellOutline = true;
		});
		frozenShell.add(terminalIce);
	};
	const refreshFrozenShell = () => {
		const visible = frozenGeometryEnabled && frozenAmount > .01;
		frozenShell.visible = visible;
		frozenShell.userData.amount = visible ? frozenAmount : 0;
		if (frozenShellMaterial) frozenShellMaterial.opacity = visible ? REFRIGERATOR_ICE_OPACITY * frozenAmount : 0;
	};
	const cableSocket = new Object3D();
	cableSocket.name = "plug-cable-socket";
	cableSocket.userData.socket = true;
	const terminalSocket = new Object3D();
	terminalSocket.name = "plug-terminal-socket";
	terminalSocket.position.y = PLUG_PIN_BOTTOM;
	terminalSocket.userData.socket = true;
	const indicatorSocket = new Object3D();
	indicatorSocket.name = "plug-indicator-socket";
	indicatorSocket.position.copy(indicator.position);
	indicatorSocket.userData.socket = true;
	assembly.add(cableSocket, terminalSocket, indicatorSocket, sleeve, rearNeck, shell, frontShoulder, face, terminal, indicatorGroup, shadowProxy, frozenShell, jointPick, hoverFocus);
	root.add(assembly);
	root.userData.sculptRuntime = {
		nodes: {
			root,
			"plug-assembly": assembly,
			"strain-relief": sleeve,
			"rear-neck": rearNeck,
			"outer-shell": shell,
			"front-shoulder": frontShoulder,
			"interface-faceplate": face,
			"terminal-assembly": terminal,
			"status-indicator": indicatorGroup
		},
		sockets: {
			"cable-socket": cableSocket,
			"terminal-socket": terminalSocket,
			"indicator-socket": indicatorSocket
		},
		colliders: [{
			id: `${styleId}-plug-envelope`,
			type: "capsule",
			node: root.name,
			radius: PLUG_HEAD_ENVELOPE.maxRadius,
			length: PLUG_HEAD_ENVELOPE.maxLength,
			trigger: true
		}],
		destructionGroups: [
			["plug-strain-relief", "plug-rear-neck"],
			[
				"plug-outer-shell",
				"plug-front-shoulder",
				"plug-interface-faceplate"
			],
			[terminal.name],
			["plug-status-recess", "plug-status-indicator"]
		]
	};
	root.scale.setScalar(scale);
	const pickMeshes = [];
	for (const object of [
		jointPick,
		sleeve,
		rearNeck,
		shell,
		frontShoulder,
		face
	]) pickMeshes.push(object);
	terminal.traverse((object) => {
		if (object instanceof Mesh) pickMeshes.push(object);
	});
	const reset = () => {
		skillTintColor = null;
		skillTintStrength = 0;
		skillTintEmissionScale = 1;
		skillGlowStrength = 0;
		overheatUniforms.amount.value = 0;
		overheatUniforms.turns.value = 2;
		overheatUniforms.time.value = 0;
		overheatUniforms.reveal.value = 0;
		overheatUniforms.pathScale.value = 0;
		frozenAmount = 0;
		isHovered = false;
		recycleSelectionState = "none";
		recycleSelectionPulse = 0;
		refreshColor();
		refreshFrozenShell();
		refreshFocus();
	};
	return {
		root,
		shell,
		frozenShell,
		pickMeshes,
		styleId,
		setCableJointThickness,
		get cableJointThicknessScale() {
			return cableJointThicknessScale;
		},
		setHovered(hovered, nightProgress = 0) {
			isHovered = hovered;
			refreshColor();
			refreshFocus();
		},
		setRecycleSelectionState(state, pulse = 0) {
			recycleSelectionState = state;
			recycleSelectionPulse = Math.max(0, Math.min(1, pulse));
			refreshColor();
			refreshFocus();
		},
		setSkillTint(color, strength = .42, emissionScale = 1) {
			skillTintColor = color === null ? null : new Color(color);
			skillTintStrength = color === null ? 0 : Math.max(0, Math.min(1, strength));
			skillTintEmissionScale = color === null ? 1 : Math.max(0, Math.min(1, emissionScale));
			refreshColor();
		},
		setSkillGlow(strength = 0) {
			skillGlowStrength = Math.max(0, Math.min(1, strength));
			refreshColor();
		},
		setOverheated(amount = 0, turnsRemaining = 2, elapsed = 0, reveal = 1, cableLength = PLUG_HEAD_MAX_LENGTH) {
			overheatUniforms.amount.value = Math.max(0, Math.min(1, amount));
			overheatUniforms.turns.value = Math.max(1, turnsRemaining);
			overheatUniforms.time.value = Math.max(0, elapsed);
			overheatUniforms.reveal.value = Math.max(0, Math.min(1, reveal));
			overheatUniforms.pathScale.value = PLUG_HEAD_MAX_LENGTH / Math.max(PLUG_HEAD_MAX_LENGTH, cableLength);
		},
		get overheatVisualState() {
			return {
				amount: overheatUniforms.amount.value,
				reveal: overheatUniforms.reveal.value,
				materialCount: overheatMaterials.length,
				pathScale: overheatUniforms.pathScale.value
			};
		},
		setFrozenGeometryEnabled(enabled) {
			frozenGeometryEnabled = enabled;
			if (enabled) ensureFrozenShellGeometry();
			refreshFrozenShell();
		},
		setFrozen(amount = 0) {
			frozenAmount = Math.max(0, Math.min(1, amount));
			refreshColor();
			refreshFrozenShell();
			const ink = new Color(PAL.ink);
			const frozenInk = new Color(4218224);
			root.traverse((object) => {
				if (!(object instanceof Mesh) || object.userData.isOutline !== true) return;
				if (!(object.material instanceof ShaderMaterial)) return;
				const color = object.material.uniforms.uColor?.value;
				if (color instanceof Color) color.copy(ink).lerp(frozenInk, frozenAmount * .58);
			});
		},
		setBlockedFlash(amount) {
			shellMaterial.emissive.set(PAL.redDeep);
			shellMaterial.emissiveIntensity = amount * .72;
		},
		reset,
		dispose() {
			root.removeFromParent();
			const geometries = /* @__PURE__ */ new Set();
			const materials = /* @__PURE__ */ new Set();
			root.traverse((object) => {
				if (!(object instanceof Mesh)) return;
				geometries.add(object.geometry);
				(Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => materials.add(material));
			});
			geometries.add(faceIceGeometry);
			geometries.forEach((geometry) => disposeOwnedResource(geometry));
			materials.forEach((material) => disposeOwnedResource(material));
		}
	};
}
//#endregion
//#region src/appliances/bodyBounds.ts
/** Initial visible body bounds; hidden animation props must not shrink the appliance. */
function applianceBodyBounds(root, result = new Box3()) {
	root.updateWorldMatrix(true, true);
	result.makeEmpty();
	root.traverseVisible((object) => {
		if (!(object instanceof Mesh)) return;
		if (!(Array.isArray(object.material) ? object.material : [object.material]).some((material) => material.visible && material.opacity > 0)) return;
		if (object instanceof InstancedMesh) {
			object.computeBoundingBox();
			if (object.boundingBox) result.union(object.boundingBox.clone().applyMatrix4(object.matrixWorld));
		} else {
			object.geometry.computeBoundingBox();
			if (object.geometry.boundingBox) result.union(object.geometry.boundingBox.clone().applyMatrix4(object.matrixWorld));
		}
	});
	if (result.isEmpty()) result.setFromCenterAndSize(root.getWorldPosition(new Vector3()), new Vector3(1, 1, 1));
	return result;
}
//#endregion
//#region src/appliances/models/index.ts
function assertNever(value) {
	throw new Error(`Missing appliance model for ${String(value)}`);
}
function createApplianceModel(kind, options) {
	switch (kind) {
		case "coffee-maker": return createCoffeeMakerModel(options);
		case "lamp": return createLampModel(options);
		case "fan": return createFanModel(options);
		case "radio": return createRadioModel(options);
		case "television": return createTelevisionModel(options);
		case "humidifier": return createHumidifierModel(options);
		case "refrigerator": return createRefrigeratorModel(options);
		case "toaster": return createToasterModel(options);
		case "microwave": return createMicrowaveModel(options);
		case "washer": return createWasherModel(options);
		case "kettle": return createKettleModel(options);
		case "rice-cooker": return createRiceCookerModel(options);
		case "robot-vacuum": return createRobotVacuumModel(options);
		case "phone": return createPhoneModel(options);
		case "bubble-machine": return createBubbleMachineModel(options);
		case "gumball-machine": return createGumballMachineModel(options);
		case "popcorn-machine": return createPopcornMachineModel(options);
		case "alarm-clock": return createAlarmClockModel(options);
		case "smart-bin": return createSmartBinModel(options);
		case "record-player": return createRecordPlayerModel(options);
		case "stand-mixer": return createStandMixerModel(options);
		case "printer": return createPrinterModel(options);
		case "induction-cooktop": return createInductionCooktopModel(options);
		case "blender": return createBlenderModel(options);
		case "dehumidifier": return createDehumidifierModel(options);
		case "portable-speaker": return createPortableSpeakerModel(options);
		case "hair-dryer": return createHairDryerModel(options);
		case "desktop-computer": return createDesktopComputerModel(options);
		case "game-controller": return createGameControllerModel(options);
		default: return assertNever(kind);
	}
}
//#endregion
//#region src/systems/AppliancePresentation.ts
var TOP_THREE_QUARTER_KINDS = /* @__PURE__ */ new Set([
	"robot-vacuum",
	"induction-cooktop",
	"record-player",
	"printer",
	"toaster",
	"rice-cooker",
	"kettle",
	"alarm-clock",
	"portable-speaker"
]);
function appliancePresentation(kind) {
	return TOP_THREE_QUARTER_KINDS.has(kind) ? "top-three-quarter" : "front-three-quarter";
}
function applianceTopTilt(kind) {
	if (kind === "robot-vacuum") return .74;
	if (kind === "induction-cooktop" || kind === "record-player") return .62;
	return appliancePresentation(kind) === "top-three-quarter" ? .48 : .14;
}
//#endregion
//#region src/systems/JellyDynamicsSettings.ts
var JELLY_CONTROLS = {
	radius: {
		label: "捏住范围",
		min: .12,
		max: 1.2,
		step: .02,
		value: .46,
		help: "小范围捏角，大范围像手掌包住"
	},
	gravity: {
		label: "坠落重力",
		min: .5,
		max: 3,
		step: .1,
		value: 1.4,
		help: "越高提起后下落越有重量"
	},
	bounce: {
		label: "落地弹性",
		min: 0,
		max: .7,
		step: .05,
		value: .25,
		help: "落地后整机反弹的高度"
	},
	inertia: {
		label: "形变惯性",
		min: 0,
		max: 2,
		step: .1,
		value: 1,
		help: "落地晃动，以及进出场时顶部滞后的幅度"
	},
	stiffness: {
		label: "回弹硬度",
		min: 12,
		max: 100,
		step: 1,
		value: 48,
		help: "越高恢复越快，越低更软"
	},
	damping: {
		label: "消振阻尼",
		min: 1.5,
		max: 14,
		step: .1,
		value: 4.5,
		help: "越低来回晃动越久"
	},
	coupling: {
		label: "内部联动",
		min: 8,
		max: 90,
		step: 1,
		value: 32,
		help: "越高零件与整机越紧密相连"
	},
	grab: {
		label: "抓取力度",
		min: 40,
		max: 220,
		step: 5,
		value: 110,
		help: "越高越贴手，越低越有滞后"
	},
	stretch: {
		label: "形变上限",
		min: .12,
		max: .4,
		step: .01,
		value: .32,
		help: "限制最大拉伸，避免过度变形"
	},
	volume: {
		label: "体积保持",
		min: 0,
		max: 1,
		step: .05,
		value: .8,
		help: "越高越饱满，压缩后向周围鼓起"
	}
};
var jellyDefaults = Object.fromEntries(Object.entries(JELLY_CONTROLS).map(([k, v]) => [k, v.value]));
var storageKey = "sakura-jelly-dynamics-v1";
var jellyDynamics = { ...jellyDefaults };
function setJellyDynamics(values) {
	for (const key of Object.keys(JELLY_CONTROLS)) {
		const v = values[key], c = JELLY_CONTROLS[key];
		if (typeof v === "number" && Number.isFinite(v)) jellyDynamics[key] = Math.max(c.min, Math.min(c.max, v));
	}
}
try {
	if (typeof localStorage !== "undefined") {
		const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null");
		if (saved && typeof saved === "object") setJellyDynamics(saved);
	}
} catch {}
function saveJellyDynamics() {
	try {
		localStorage.setItem(storageKey, JSON.stringify(jellyDynamics));
		return true;
	} catch {
		return false;
	}
}
/** Player-facing controls map to a coherent spring/volume profile. */
function setJellyFeel(q) {
	const t = Math.max(0, Math.min(1, q / 100));
	setJellyDynamics({
		stiffness: 75 - 39 * t,
		damping: 9 - 6 * t,
		coupling: 55 - 25 * t,
		grab: 150,
		stretch: .24 + .14 * t,
		volume: .85,
		inertia: .4 + 1.1 * t,
		bounce: .08 + .37 * t
	});
}
function getJellyFeel() {
	return Math.round(Math.max(0, Math.min(1, (9 - jellyDynamics.damping) / 6)) * 100);
}
//#endregion
//#region src/systems/softLatticeVolume.ts
var tetrahedra = [];
for (let z = 0; z < 2; z++) for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) {
	const a = x + y * 3 + z * 9, h = a + 13;
	for (const [b, c] of [
		[1, 4],
		[4, 3],
		[3, 12],
		[12, 9],
		[9, 10],
		[10, 1]
	]) tetrahedra.push([
		a,
		a + b,
		a + c,
		h
	]);
}
var positions = Array.from({ length: 4 }, () => new Vector3());
var gradients = Array.from({ length: 4 }, () => new Vector3());
var ab = new Vector3();
var ac = new Vector3();
var ad = new Vector3();
var rest = new Vector3();
/** Soft volume projection on the 48 tetrahedra of the shared lattice. No mesh
* topology changes; deformation stays bounded before shader interpolation. */
function preserveLatticeVolume(nodes, size, dt, strength = .8) {
	if (strength <= 0) return;
	for (const ids of tetrahedra) {
		ids.forEach((id, k) => positions[k].copy(nodes[id]).add(rest.set(id % 3 * size.x / 2, Math.floor(id / 3) % 3 * size.y / 2, Math.floor(id / 9) * size.z / 2)));
		ab.subVectors(positions[1], positions[0]);
		ac.subVectors(positions[2], positions[0]);
		ad.subVectors(positions[3], positions[0]);
		gradients[1].crossVectors(ac, ad).multiplyScalar(1 / 6);
		gradients[2].crossVectors(ad, ab).multiplyScalar(1 / 6);
		gradients[3].crossVectors(ab, ac).multiplyScalar(1 / 6);
		gradients[0].copy(gradients[1]).add(gradients[2]).add(gradients[3]).negate();
		const volume = ab.dot(gradients[1]);
		const restVolume = size.x * size.y * size.z / 48;
		const denominator = gradients.reduce((sum, g) => sum + g.lengthSq(), 0) + (2e-6 + (1 - strength) * 9e-5) / (dt * dt);
		const correction = -(volume - restVolume) / Math.max(denominator, 1e-12);
		ids.forEach((id, k) => nodes[id].addScaledVector(gradients[k], correction));
	}
}
//#endregion
//#region src/systems/SoftDeformController.ts
var DRAG_STIFFNESS = 380;
var DRAG_DAMPING = 27;
var RELEASE_STIFFNESS_NEAR = 150;
var RELEASE_STIFFNESS_FAR = 205;
var RELEASE_DAMPING_NEAR = 16;
var RELEASE_DAMPING_FAR = 3.15;
var MAX_STEP = 1 / 120;
var MAX_FRAME_CATCHUP = .25;
var SETTLED_DISTANCE = .0015;
var SETTLED_SPEED = .008;
var DEFAULT_MAX_PULL_RADIUS_RATIO = .36;
var CAGE_OPPOSITE_COUPLING = .48;
var CAGE_SURFACE_GAIN = 1.08;
var MAX_NORMAL_COMPRESSION_RATIO = .32;
var RELEASE_SNAP_GAIN_FAR = 2.2;
var RELEASE_VELOCITY_RETENTION_NEAR = .12;
function smoothstep(edge0, edge1, value) {
	const t = MathUtils.clamp((value - edge0) / Math.max(1e-4, edge1 - edge0), 0, 1);
	return t * t * (3 - 2 * t);
}
function softGrabProfile(grabLocal, bounds, surfaceNormalLocal) {
	const center = bounds.getCenter(new Vector3());
	const halfSize = bounds.getSize(new Vector3()).multiplyScalar(.5);
	const normalized = new Vector3((grabLocal.x - center.x) / Math.max(.001, halfSize.x), (grabLocal.y - center.y) / Math.max(.001, halfSize.y), (grabLocal.z - center.z) / Math.max(.001, halfSize.z));
	const normal = surfaceNormalLocal.clone().normalize();
	const dominantAxis = Math.abs(normal.x) >= Math.abs(normal.y) && Math.abs(normal.x) >= Math.abs(normal.z) ? 0 : Math.abs(normal.y) >= Math.abs(normal.z) ? 1 : 2;
	const tangentAxes = dominantAxis === 0 ? [1, 2] : dominantAxis === 1 ? [0, 2] : [0, 1];
	const components = [
		Math.abs(normalized.x),
		Math.abs(normalized.y),
		Math.abs(normalized.z)
	];
	const edgePosition = Math.max(components[tangentAxes[0]], components[tangentAxes[1]]);
	const cornerPosition = Math.min(components[tangentAxes[0]], components[tangentAxes[1]]);
	const edgeFactor = smoothstep(.44, .92, edgePosition);
	const cornerFactor = smoothstep(.54, .94, cornerPosition);
	const centerFactor = 1 - smoothstep(.28, .76, edgePosition);
	return {
		edgeFactor,
		cornerFactor,
		centerFactor,
		radiusScale: 1,
		wholeCoupling: MathUtils.lerp(CAGE_OPPOSITE_COUPLING, .6, edgeFactor),
		localGain: CAGE_SURFACE_GAIN + edgeFactor * .08 + cornerFactor * .1,
		indentStrength: MathUtils.lerp(.24, .38, centerFactor)
	};
}
function softReboundProfile(pullLength, maxPullLength) {
	const pullRatio = MathUtils.clamp(pullLength / Math.max(1e-4, maxPullLength), 0, 1);
	const response = Math.pow(smoothstep(.08, .72, pullRatio), 1.4);
	return {
		pullRatio,
		response,
		stiffness: MathUtils.lerp(RELEASE_STIFFNESS_NEAR, RELEASE_STIFFNESS_FAR, response),
		damping: MathUtils.lerp(RELEASE_DAMPING_NEAR, RELEASE_DAMPING_FAR, response),
		snapGain: RELEASE_SNAP_GAIN_FAR * response,
		velocityRetention: MathUtils.lerp(RELEASE_VELOCITY_RETENTION_NEAR, 1, response)
	};
}
var softProjectVertex = `
  vec4 mvPosition = vec4( transformed, 1.0 );
  #ifdef USE_BATCHING
    mvPosition = batchingMatrix * mvPosition;
  #endif
  #ifdef USE_INSTANCING
    mvPosition = instanceMatrix * mvPosition;
  #endif

  vec4 softWorldPosition = modelMatrix * mvPosition;
  softWorldPosition.xyz = softApplyCage(softWorldPosition.xyz);
  mvPosition = viewMatrix * softWorldPosition;
  gl_Position = projectionMatrix * mvPosition;
`;
function patchMeshMaterial(material, uniforms) {
	if (material.userData.softDeformPatched) return;
	material.userData.softDeformPatched = true;
	const previousCompile = material.onBeforeCompile.bind(material);
	const previousCacheKey = material.customProgramCacheKey.bind(material);
	material.onBeforeCompile = (shader, renderer) => {
		previousCompile(shader, renderer);
		Object.assign(shader.uniforms, uniforms);
		shader.vertexShader = shader.vertexShader.replace("#include <common>", `#include <common>\n${SOFT_CAGE_UNIFORM_GLSL}\n${SOFT_CAGE_FUNCTION_GLSL}`).replace("#include <defaultnormal_vertex>", `
        vec3 softN = normalize(objectNormal);
        vec3 softT = normalize(cross(softN, abs(softN.y) < 0.9 ? vec3(0,1,0) : vec3(1,0,0)));
        vec3 softB = cross(softN, softT);
        mat4 softMeshMatrix = modelMatrix;
        #ifdef USE_INSTANCING
          softMeshMatrix = modelMatrix * instanceMatrix;
        #endif
        vec3 softP = (softMeshMatrix * vec4(position,1.0)).xyz;
        vec3 softDT = softApplyCage(softP + (softMeshMatrix * vec4(softT * 0.002,0.0)).xyz) - softApplyCage(softP - (softMeshMatrix * vec4(softT * 0.002,0.0)).xyz);
        vec3 softDB = softApplyCage(softP + (softMeshMatrix * vec4(softB * 0.002,0.0)).xyz) - softApplyCage(softP - (softMeshMatrix * vec4(softB * 0.002,0.0)).xyz);
        vec3 softWorldN = normalize(cross(softDT, softDB));
        objectNormal = normalize(vec3(dot(softWorldN,softMeshMatrix[0].xyz),dot(softWorldN,softMeshMatrix[1].xyz),dot(softWorldN,softMeshMatrix[2].xyz)));
        #include <defaultnormal_vertex>
      `).replace("#include <project_vertex>", softProjectVertex).replace("#include <worldpos_vertex>", `#include <worldpos_vertex>
        #if defined( USE_TRANSMISSION ) || defined( USE_SHADOWMAP ) || defined( USE_ENVMAP ) || defined( DISTANCE ) || defined( USE_SPOTLIGHTMAP )
          worldPosition = softWorldPosition;
        #endif
      `);
	};
	material.customProgramCacheKey = () => `${previousCacheKey()}|soft-lattice-local-pinch-v6`;
	material.needsUpdate = true;
}
function bindOutlineMaterial(material, uniforms) {
	Object.assign(material.uniforms, uniforms);
}
var SoftDeformController = class {
	deformRoot;
	surfaceRoot;
	pinchVelocity = new Vector3();
	uniforms = {
		uSoftGrabLocal: { value: new Vector3() },
		uSoftGrabRadius: { value: .2 },
		uSoftPinchLocal: { value: new Vector3() },
		uSoftRootWorldToLocal: { value: new Matrix4() },
		uSoftRootLocalToWorld: { value: new Matrix4() },
		uSoftLattice: { value: Array.from({ length: 27 }, () => new Vector3()) },
		uSoftBoundsMin: { value: new Vector3(-.5, -.5, -.5) },
		uSoftBoundsMax: { value: new Vector3(.5, .5, .5) },
		uSoftPullLocal: { value: new Vector3() },
		uSoftSurfaceNormalLocal: { value: new Vector3(0, 0, 1) },
		uSoftPullRatio: { value: 0 },
		uSoftWholeCoupling: { value: CAGE_OPPOSITE_COUPLING },
		uSoftLocalGain: { value: CAGE_SURFACE_GAIN },
		uSoftIndentStrength: { value: .38 }
	};
	latticeVelocity = Array.from({ length: 27 }, () => new Vector3());
	latticePrevious = Array.from({ length: 27 }, () => new Vector3());
	latticeForce = Array.from({ length: 27 }, () => new Vector3());
	latticeTarget = new Vector3();
	latticeNode = new Vector3();
	latticeDelta = new Vector3();
	latticeEnergy = 0;
	localGrab = new Vector3();
	baseGrabWorld = new Vector3();
	targetPull = new Vector3();
	pull = new Vector3();
	velocity = new Vector3();
	acceleration = new Vector3();
	releaseAxis = new Vector3(1, 0, 0);
	localSurfaceNormal = new Vector3(0, 0, 1);
	localBounds = new Box3();
	meshBounds = new Box3();
	relativeMatrix = new Matrix4();
	inverseRootMatrix = new Matrix4();
	localNormalMatrix = new Matrix3();
	localVectorMatrix = new Matrix3();
	shapeSize = new Vector3();
	localPull = new Vector3();
	maxPullWorld = 1;
	reboundPullRatio = 0;
	reboundResponse = 0;
	grabProfile = {
		edgeFactor: 0,
		cornerFactor: 0,
		centerFactor: 1,
		radiusScale: 1,
		wholeCoupling: CAGE_OPPOSITE_COUPLING,
		localGain: CAGE_SURFACE_GAIN,
		indentStrength: .38
	};
	renderableMeshCount = 0;
	boundRenderableMeshCount = 0;
	grabbing = false;
	lastUpdateAt = performance.now();
	constructor(deformRoot, surfaceRoot = deformRoot) {
		this.deformRoot = deformRoot;
		this.surfaceRoot = surfaceRoot;
		const materials = /* @__PURE__ */ new Set();
		surfaceRoot.traverse((object) => {
			if (!(object instanceof Mesh)) return;
			this.renderableMeshCount += 1;
			const entries = Array.isArray(object.material) ? object.material : [object.material];
			entries.forEach((material) => materials.add(material));
			if (entries.every((material) => {
				if (object.userData.isOutline && material instanceof ShaderMaterial) {
					bindOutlineMaterial(material, this.uniforms);
					return true;
				}
				return material instanceof MeshToonMaterial || material instanceof MeshBasicMaterial || material instanceof MeshPhysicalMaterial;
			})) this.boundRenderableMeshCount += 1;
		});
		materials.forEach((material) => {
			if (material instanceof MeshToonMaterial || material instanceof MeshBasicMaterial || material instanceof MeshPhysicalMaterial) patchMeshMaterial(material, this.uniforms);
		});
		this.updateLocalBounds();
		this.syncUniforms();
	}
	applyInertia(worldVelocityChange) {
		this.deformRoot.updateWorldMatrix(true, false);
		const inverse = new Matrix3().setFromMatrix4(this.deformRoot.matrixWorld.clone().invert());
		const impulse = worldVelocityChange.clone().applyMatrix3(inverse);
		for (let i = 0; i < 27; i++) {
			const height = Math.floor(i / 3) % 3 / 2;
			this.latticeVelocity[i].addScaledVector(impulse, -(.08 + height * .7) * jellyDynamics.inertia);
		}
		this.latticeEnergy = 1;
	}
	nudge() {
		this.updateLocalBounds();
		const size = this.localBounds.getSize(this.shapeSize);
		for (let i = 0; i < 27; i++) {
			const height = Math.floor(i / 3) % 3 / 2;
			this.latticeVelocity[i].x += size.x * (.1 + height * 1.2);
			this.latticeVelocity[i].y -= size.y * .12 * height;
		}
		this.latticeEnergy = 1;
	}
	get isGrabbing() {
		return this.grabbing;
	}
	get isSettled() {
		return !this.grabbing && this.pull.length() < SETTLED_DISTANCE && this.velocity.length() < SETTLED_SPEED && this.latticeEnergy < 1e-5;
	}
	get pullLength() {
		return this.pull.length();
	}
	get signedPull() {
		return this.pull.dot(this.releaseAxis);
	}
	get lastReboundPullRatio() {
		return this.reboundPullRatio;
	}
	get lastReboundResponse() {
		return this.reboundResponse;
	}
	get totalRenderableMeshes() {
		return this.renderableMeshCount;
	}
	get boundRenderableMeshes() {
		return this.boundRenderableMeshCount;
	}
	get currentGrabProfile() {
		return this.grabProfile;
	}
	begin(grabWorld, radiusWorld, maxPullWorld, viewDepthAxisWorld, surfaceNormalWorld) {
		this.deformRoot.updateWorldMatrix(true, true);
		this.localGrab.copy(this.deformRoot.worldToLocal(grabWorld.clone()));
		this.updateLocalBounds();
		this.inverseRootMatrix.copy(this.deformRoot.matrixWorld).invert();
		if (surfaceNormalWorld && surfaceNormalWorld.lengthSq() > 1e-6) {
			this.localNormalMatrix.setFromMatrix4(this.deformRoot.matrixWorld).transpose();
			this.localSurfaceNormal.copy(surfaceNormalWorld).applyNormalMatrix(this.localNormalMatrix);
		} else if (viewDepthAxisWorld && viewDepthAxisWorld.lengthSq() > 1e-6) {
			this.localNormalMatrix.setFromMatrix4(this.deformRoot.matrixWorld).transpose();
			this.localSurfaceNormal.copy(viewDepthAxisWorld).negate().applyNormalMatrix(this.localNormalMatrix);
		} else this.localSurfaceNormal.set(0, 0, 1);
		this.grabProfile = softGrabProfile(this.localGrab, this.localBounds, this.localSurfaceNormal);
		this.uniforms.uSoftWholeCoupling.value = this.grabProfile.wholeCoupling;
		this.uniforms.uSoftLocalGain.value = this.grabProfile.localGain;
		this.uniforms.uSoftIndentStrength.value = this.grabProfile.indentStrength;
		this.maxPullWorld = Math.max(.001, maxPullWorld ?? radiusWorld * DEFAULT_MAX_PULL_RADIUS_RATIO);
		this.targetPull.set(0, 0, 0);
		this.pull.set(0, 0, 0);
		this.velocity.set(0, 0, 0);
		this.releaseAxis.set(1, 0, 0);
		this.reboundPullRatio = 0;
		this.reboundResponse = 0;
		this.grabbing = true;
		this.lastUpdateAt = performance.now();
		this.syncUniforms();
	}
	setPointerWorld(pointerWorld) {
		if (!this.grabbing) return;
		this.updateBaseGrabWorld();
		this.targetPull.copy(pointerWorld).sub(this.baseGrabWorld);
		const length = this.targetPull.length();
		if (length > this.maxPullWorld) this.targetPull.multiplyScalar(this.maxPullWorld / length);
	}
	release() {
		if (!this.grabbing) return;
		if (this.pull.lengthSq() > 1e-6) this.releaseAxis.copy(this.pull).normalize();
		const rebound = softReboundProfile(this.pull.length(), this.maxPullWorld);
		this.reboundPullRatio = rebound.pullRatio;
		this.reboundResponse = rebound.response;
		this.velocity.multiplyScalar(rebound.velocityRetention);
		this.grabbing = false;
		this.targetPull.set(0, 0, 0);
		this.lastUpdateAt = performance.now();
	}
	reset() {
		this.uniforms.uSoftLattice.value.forEach((v) => v.set(0, 0, 0));
		this.latticeVelocity.forEach((v) => v.set(0, 0, 0));
		this.latticeEnergy = 0;
		this.uniforms.uSoftPinchLocal.value.set(0, 0, 0);
		this.pinchVelocity.set(0, 0, 0);
		this.grabbing = false;
		this.targetPull.set(0, 0, 0);
		this.pull.set(0, 0, 0);
		this.velocity.set(0, 0, 0);
		this.releaseAxis.set(1, 0, 0);
		this.uniforms.uSoftPullLocal.value.set(0, 0, 0);
		this.uniforms.uSoftPullRatio.value = 0;
		this.uniforms.uSoftWholeCoupling.value = CAGE_OPPOSITE_COUPLING;
		this.uniforms.uSoftLocalGain.value = CAGE_SURFACE_GAIN;
		this.uniforms.uSoftIndentStrength.value = .38;
		this.reboundPullRatio = 0;
		this.reboundResponse = 0;
		this.lastUpdateAt = performance.now();
		this.syncUniforms();
	}
	update(delta) {
		this.updateBaseGrabWorld();
		const now = performance.now();
		const wallDelta = Math.max(0, (now - this.lastUpdateAt) / 1e3);
		this.lastUpdateAt = now;
		let remaining = Math.min(MAX_FRAME_CATCHUP, Math.max(0, delta, wallDelta));
		if (remaining <= 0) {
			this.syncUniforms();
			return;
		}
		const stiffness = this.grabbing ? DRAG_STIFFNESS : 48;
		const damping = this.grabbing ? DRAG_DAMPING : 9;
		while (remaining > 0) {
			const step = Math.min(MAX_STEP, remaining);
			this.acceleration.copy(this.targetPull).sub(this.pull).multiplyScalar(stiffness).addScaledVector(this.velocity, -damping);
			this.velocity.addScaledVector(this.acceleration, step);
			this.pull.addScaledVector(this.velocity, step);
			if (this.grabbing && this.pull.lengthSq() > 1e-6) this.releaseAxis.copy(this.pull).normalize();
			this.stepLattice(step);
			remaining -= step;
		}
		if (this.isSettled) {
			this.pull.set(0, 0, 0);
			this.velocity.set(0, 0, 0);
		}
		this.syncUniforms();
	}
	/** Coupled 3x3x3 elastic volume. Forces propagate between neighboring nodes
	* instead of applying one spring offset independently to mesh parts. */
	stepLattice(dt) {
		const nodes = this.uniforms.uSoftLattice.value;
		const size = this.localBounds.getSize(this.shapeSize);
		this.inverseRootMatrix.copy(this.deformRoot.matrixWorld).invert();
		this.localVectorMatrix.setFromMatrix4(this.inverseRootMatrix);
		this.latticeTarget.copy(this.targetPull).applyMatrix3(this.localVectorMatrix);
		const dimension = Math.max(size.x, size.y, size.z);
		const radius = dimension * jellyDynamics.radius;
		this.uniforms.uSoftGrabRadius.value = Math.max(dimension * .13, radius * .65);
		this.uniforms.uSoftGrabLocal.value.copy(this.localGrab);
		const pinch = this.uniforms.uSoftPinchLocal.value;
		const pinchGain = 1 - MathUtils.smoothstep(jellyDynamics.radius, .12, .8);
		const pinchTarget = this.grabbing ? this.latticeTarget.clone().multiplyScalar(pinchGain * 1.35) : new Vector3();
		pinchTarget.clampLength(0, dimension * .65);
		const pinchStiffness = this.grabbing ? 150 : jellyDynamics.stiffness;
		const pinchDamping = this.grabbing ? 18 : jellyDynamics.damping;
		this.pinchVelocity.addScaledVector(pinchTarget.sub(pinch).multiplyScalar(pinchStiffness).addScaledVector(this.pinchVelocity, -pinchDamping), dt);
		pinch.addScaledVector(this.pinchVelocity, dt).clampLength(0, dimension * .75);
		const limitX = Math.max(.01, size.x * jellyDynamics.stretch);
		const limitY = Math.max(.01, size.y * jellyDynamics.stretch);
		const limitZ = Math.max(.01, size.z * jellyDynamics.stretch);
		for (let z = 0; z < 3; z++) for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) {
			const i = x + y * 3 + z * 9;
			this.latticeNode.set(x * size.x / 2, y * size.y / 2, z * size.z / 2).add(this.localBounds.min);
			const weight = .015 + .985 * Math.exp(-this.latticeNode.distanceToSquared(this.localGrab) / (radius * radius));
			const force = this.latticeForce[i].copy(nodes[i]).multiplyScalar(-jellyDynamics.stiffness).addScaledVector(this.latticeVelocity[i], -jellyDynamics.damping);
			if (this.grabbing) force.addScaledVector(this.latticeDelta.copy(this.latticeTarget).multiplyScalar(weight).sub(nodes[i]), jellyDynamics.grab);
			for (const [dx, dy, dz] of [
				[
					1,
					0,
					0
				],
				[
					-1,
					0,
					0
				],
				[
					0,
					1,
					0
				],
				[
					0,
					-1,
					0
				],
				[
					0,
					0,
					1
				],
				[
					0,
					0,
					-1
				]
			]) {
				const nx = x + dx, ny = y + dy, nz = z + dz;
				if (nx < 0 || nx > 2 || ny < 0 || ny > 2 || nz < 0 || nz > 2) continue;
				force.addScaledVector(this.latticeDelta.copy(nodes[nx + ny * 3 + nz * 9]).sub(nodes[i]), jellyDynamics.coupling);
			}
		}
		this.latticeEnergy = pinch.lengthSq() + this.pinchVelocity.lengthSq();
		for (let i = 0; i < 27; i++) {
			this.latticePrevious[i].copy(nodes[i]);
			this.latticeVelocity[i].addScaledVector(this.latticeForce[i], dt);
			nodes[i].addScaledVector(this.latticeVelocity[i], dt);
		}
		preserveLatticeVolume(nodes, size, dt, jellyDynamics.volume);
		for (let i = 0; i < 27; i++) {
			nodes[i].set(MathUtils.clamp(nodes[i].x, -limitX, limitX), MathUtils.clamp(nodes[i].y, -limitY, limitY), MathUtils.clamp(nodes[i].z, -limitZ, limitZ));
			this.latticeVelocity[i].subVectors(nodes[i], this.latticePrevious[i]).divideScalar(dt);
			this.latticeEnergy += nodes[i].lengthSq() + this.latticeVelocity[i].lengthSq();
		}
	}
	updateBaseGrabWorld() {
		this.deformRoot.updateWorldMatrix(true, true);
		this.baseGrabWorld.copy(this.localGrab);
		this.deformRoot.localToWorld(this.baseGrabWorld);
	}
	syncUniforms() {
		this.deformRoot.updateWorldMatrix(true, true);
		this.uniforms.uSoftRootLocalToWorld.value.copy(this.deformRoot.matrixWorld);
		this.uniforms.uSoftRootWorldToLocal.value.copy(this.deformRoot.matrixWorld).invert();
		this.uniforms.uSoftBoundsMin.value.copy(this.localBounds.min);
		this.uniforms.uSoftBoundsMax.value.copy(this.localBounds.max);
		this.uniforms.uSoftSurfaceNormalLocal.value.copy(this.localSurfaceNormal);
		this.localVectorMatrix.setFromMatrix4(this.uniforms.uSoftRootWorldToLocal.value);
		this.localPull.copy(this.pull).applyMatrix3(this.localVectorMatrix);
		this.localBounds.getSize(this.shapeSize);
		const axisExtent = Math.max(1e-4, Math.abs(this.localSurfaceNormal.x) * this.shapeSize.x + Math.abs(this.localSurfaceNormal.y) * this.shapeSize.y + Math.abs(this.localSurfaceNormal.z) * this.shapeSize.z);
		const normalAmount = this.localPull.dot(this.localSurfaceNormal);
		const clampedNormalAmount = MathUtils.clamp(normalAmount, -axisExtent * MAX_NORMAL_COMPRESSION_RATIO, axisExtent * MAX_NORMAL_COMPRESSION_RATIO);
		this.localPull.addScaledVector(this.localSurfaceNormal, clampedNormalAmount - normalAmount);
		this.uniforms.uSoftPullLocal.value.copy(this.localPull);
		this.uniforms.uSoftPullRatio.value = MathUtils.clamp(this.pull.length() / Math.max(1e-4, this.maxPullWorld), 0, 1);
	}
	updateLocalBounds() {
		this.localBounds.makeEmpty();
		this.deformRoot.updateWorldMatrix(true, true);
		this.inverseRootMatrix.copy(this.deformRoot.matrixWorld).invert();
		this.surfaceRoot.traverse((object) => {
			if (!(object instanceof Mesh) || object.userData.isOutline || this.isPerformanceEffect(object)) return;
			if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
			if (!object.geometry.boundingBox) return;
			this.relativeMatrix.multiplyMatrices(this.inverseRootMatrix, object.matrixWorld);
			this.meshBounds.copy(object.geometry.boundingBox).applyMatrix4(this.relativeMatrix);
			this.localBounds.union(this.meshBounds);
		});
		if (this.localBounds.isEmpty()) this.localBounds.setFromCenterAndSize(this.localGrab, new Vector3(1, 1, 1));
	}
	isPerformanceEffect(object) {
		let current = object;
		while (current) {
			if (current.userData.performanceEffect === true) return true;
			if (current === this.surfaceRoot) break;
			current = current.parent;
		}
		return false;
	}
};
//#endregion
//#region src/systems/ApplianceScene.ts
var REFERENCE_SCREEN_DEPTH = 13.6;
var BACK_LAYER_OFFSET = 5.2;
var THREE_QUARTER_YAW = .46;
var DROP_DISTANCE = 1.08;
var DROP_FALL_DURATION = .46;
var SPAWN_DROP_FALL_DURATION = .86;
var SPAWN_DROP_TOTAL_DURATION = 1.9300000000000002;
var DROP_BOUNCE_FREQUENCY = 8.5;
var SWAY_FREQUENCY = 9.4;
var DROP_REBOUND_COUNT = 5;
var DROP_GRAVITY = 13;
var DROP_FIRST_REBOUND_SPEED = 2.35;
var DROP_RESTITUTION = .78;
var DROP_FIRST_CONTACT_TILT = .14;
var DROP_CONTACT_TILT_DECAY = .75;
var DROP_CONTACT_SWAY = [
	0,
	-.105,
	.074,
	-.047,
	.025,
	0
];
var EDGE_PADDING = .035;
var REPLACEMENT_KIND_HISTORY_SIZE = 6;
var REPLACEMENT_PRELOAD_GENERATIONS = 3;
var REPLACEMENT_WARMUP_CONCURRENCY = 2;
var INFLATE_CYCLE_DURATION = .58;
var INFLATE_AMPLITUDES = [.18];
var REPLACEMENT_DELAY = .18;
var SPAWN_DROP_MIN_HEIGHT = .46;
var SPAWN_DROP_PREPARE_AFTER = .75;
var RUNTIME_REPLACEMENT_PREPARE_GAP = .32;
var SPAWN_DROP_TOP_MARGIN_MIN_PX = 88;
var SPAWN_DROP_TOP_MARGIN_MAX_PX = 120;
var LAYOUT_TOP = .175;
var LAYOUT_GAP = .017;
var SOFT_ELASTIC_LEASH_PX = 42;
var DRAG_HOLD_DELAY_MS = 180;
var DRAG_POSITION_EPSILON = .002;
function dropReboundSpeed(index) {
	return DROP_FIRST_REBOUND_SPEED * DROP_RESTITUTION ** index;
}
function dropContactTilt(index, direction) {
	if (index >= DROP_REBOUND_COUNT) return 0;
	return (index % 2 === 0 ? direction : -direction) * DROP_FIRST_CONTACT_TILT * DROP_CONTACT_TILT_DECAY ** index;
}
function dropContactSway(index, direction) {
	return direction * DROP_CONTACT_SWAY[Math.min(index, DROP_CONTACT_SWAY.length - 1)];
}
var ApplianceTarget = class {
	definition;
	accent;
	root = new Group();
	connectionAnchor = new Group();
	interactiveMeshes = [];
	screenPosition;
	state = "idle";
	connectionCount = 0;
	isConnecting = false;
	isDragging = false;
	facingSide = 1;
	outwardEdge = "right";
	dropOffset = 0;
	dropVelocity = 0;
	isDropping = false;
	isSpawnDrop = false;
	dropLanded = false;
	depthScale = 1;
	presentationScale = 1;
	landingSway = 0;
	landingSwayVelocity = 0;
	landingTilt = 0;
	landingTiltVelocity = 0;
	landingDirection = 1;
	landingImpactCount = 0;
	landingContactSide = 0;
	dropElapsed = 0;
	spawnDropHeight = SPAWN_DROP_MIN_HEIGHT;
	dropStartedAt = 0;
	dropLandedAt = 0;
	dropCommitPending = false;
	activeTimeRemaining = 0;
	lifecycleScale = 1;
	materials = /* @__PURE__ */ new Set();
	indicatorMaterial;
	softDeform;
	deviceBounds = new Box3();
	connectionSocketsByEdge = {};
	baseScale = .68;
	actualScreenHeight = .1;
	pulse = 0;
	activeElapsed = 0;
	activeStartedAt = 0;
	animationPausedAt = 0;
	inflationStartedAt = 0;
	inflationPeakCycle = -1;
	inflationPeakHoldFrames = 0;
	recycleRequested = false;
	constructor(definition, accent, screenPosition) {
		this.definition = definition;
		this.accent = accent;
		this.id = definition.id;
		this.label = definition.label;
		this.kind = definition.id;
		this.sizeTier = definition.sizeTier;
		this.plugStyleId = definition.plugStyleId;
		this.root.name = `appliance-${this.id}`;
		this.root.userData.applianceKind = this.kind;
		this.screenPosition = new Vector2(...screenPosition);
		const modelFactoryStartedAt = performance.now();
		const model = createApplianceModel(definition.id, {
			id: definition.id,
			accent,
			referencePath: definition.referencePath
		});
		const modelFactoryMs = performance.now() - modelFactoryStartedAt;
		const targetSetupStartedAt = performance.now();
		this.indicatorMaterial = model.indicatorMaterial;
		model.materials.forEach((material) => this.materials.add(material));
		this.interactiveMeshes.push(...model.interactiveMeshes);
		this.root.add(model.root);
		this.root.scale.setScalar(1);
		this.root.updateMatrixWorld(true);
		applianceBodyBounds(this.root, this.deviceBounds);
		for (const edge of [
			"left",
			"right",
			"top",
			"bottom"
		]) {
			const socket = model.root.getObjectByName(`${definition.id}-${edge}-connection-socket`);
			if (socket) this.connectionSocketsByEdge[edge] = socket;
		}
		const modelCenter = this.deviceBounds.getCenter(new Vector3());
		model.root.position.sub(modelCenter);
		this.root.updateMatrixWorld(true);
		applianceBodyBounds(this.root, this.deviceBounds);
		const modelWidth = Math.max(.01, this.deviceBounds.max.x - this.deviceBounds.min.x);
		const modelHeight = Math.max(.01, this.deviceBounds.max.y - this.deviceBounds.min.y);
		const referenceVerticalSpan = 2 * Math.tan(MathUtils.degToRad(13)) * REFERENCE_SCREEN_DEPTH;
		const rawScreenWidth = definition.targetScreenHeight * (modelWidth / modelHeight) / (16 / 9);
		const maxScreenWidth = definition.sizeTier === "L" ? .22 : definition.sizeTier === "XL" ? .2 : .205;
		const widthFit = Math.min(1, maxScreenWidth / rawScreenWidth);
		this.actualScreenHeight = definition.targetScreenHeight * widthFit;
		this.baseScale = this.actualScreenHeight * referenceVerticalSpan / modelHeight;
		this.root.scale.setScalar(this.baseScale);
		const targetSetupMs = performance.now() - targetSetupStartedAt;
		const softDeformStartedAt = performance.now();
		this.softDeform = new SoftDeformController(this.root, model.root);
		const softDeformMs = performance.now() - softDeformStartedAt;
		this.root.userData.applianceConstructionTimings = {
			modelFactoryMs,
			targetSetupMs,
			softDeformMs
		};
		this.buildConnectionAnchor();
	}
	id;
	label;
	kind;
	sizeTier;
	plugStyleId;
	reserve(color) {
		this.isConnecting = true;
		this.pulse = 1;
		if (this.state === "idle") this.state = "connected";
		this.root.userData.sensoryConnectionColor = color;
	}
	cancelReservation() {
		if (!this.isConnecting) return false;
		this.isConnecting = false;
		if (this.state === "connected") this.state = "idle";
		delete this.root.userData.sensoryConnectionColor;
		return true;
	}
	activate(color) {
		this.isConnecting = false;
		this.state = "active";
		this.connectionCount += 1;
		this.activeElapsed = 0;
		this.activeStartedAt = performance.now() * .001;
		this.animationPausedAt = 0;
		this.activeTimeRemaining = poweredActiveDuration(this.kind);
		this.inflationStartedAt = 0;
		this.inflationPeakCycle = -1;
		this.inflationPeakHoldFrames = 0;
		this.recycleRequested = false;
		this.lifecycleScale = 1;
		this.root.visible = true;
		this.pulse = 1;
		this.root.userData.sensoryConnectionColor = color;
	}
	reset() {
		this.state = "idle";
		this.connectionCount = 0;
		this.isConnecting = false;
		this.isDragging = false;
		this.dropOffset = 0;
		this.dropVelocity = 0;
		this.isDropping = false;
		this.isSpawnDrop = false;
		this.dropLanded = false;
		this.landingSway = 0;
		this.landingSwayVelocity = 0;
		this.landingTilt = 0;
		this.landingTiltVelocity = 0;
		this.landingImpactCount = 0;
		this.landingContactSide = 0;
		this.dropElapsed = 0;
		this.spawnDropHeight = SPAWN_DROP_MIN_HEIGHT;
		this.dropStartedAt = 0;
		this.dropLandedAt = 0;
		this.dropCommitPending = false;
		this.activeElapsed = 0;
		this.activeStartedAt = 0;
		this.animationPausedAt = 0;
		this.activeTimeRemaining = 0;
		this.inflationStartedAt = 0;
		this.inflationPeakCycle = -1;
		this.inflationPeakHoldFrames = 0;
		this.recycleRequested = false;
		this.lifecycleScale = 1;
		this.root.visible = true;
		this.pulse = 0;
		this.indicatorMaterial.emissive.setHex(0);
		this.indicatorMaterial.emissiveIntensity = 0;
		this.softDeform?.reset();
		this.resetPoweredState();
	}
	update(delta, _elapsed) {
		const now = performance.now() * .001;
		this.pulse = Math.max(0, this.pulse - delta * 2.8);
		const bounce = 1 + Math.sin((1 - this.pulse) * Math.PI) * this.pulse * .055;
		const dragScale = this.isDragging && !this.softDeform ? 1.055 : 1;
		if (this.state === "inflating") this.updateInflation(now);
		this.root.scale.setScalar(this.baseScale * this.depthScale * this.presentationScale * bounce * dragScale * this.lifecycleScale);
		if (this.state !== "active") return;
		if (this.softDeform?.isGrabbing || this.animationPausedAt > 0) return;
		const fixedPerformanceTime = window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__;
		this.activeElapsed = Number.isFinite(fixedPerformanceTime) ? Math.max(0, fixedPerformanceTime) : this.kind === "washer" ? Math.max(0, this.activeElapsed + Math.max(0, delta)) : Math.max(0, now - this.activeStartedAt);
		const activeDuration = poweredActiveDuration(this.kind);
		const powered = poweredAnimationState(this.activeElapsed, this.kind);
		this.activeTimeRemaining = Math.max(0, activeDuration - this.activeElapsed);
		if (!powered.active) {
			this.state = "inflating";
			this.inflationStartedAt = now;
			this.inflationPeakCycle = -1;
			this.inflationPeakHoldFrames = 0;
			this.resetPoweredState();
		}
	}
	consumeRecycleRequest() {
		if (!this.recycleRequested) return false;
		this.recycleRequested = false;
		return true;
	}
	get isLifecycleTransitioning() {
		return this.state === "inflating" || this.state === "hidden" || this.state === "spawning";
	}
	get inflationPeakCount() {
		return this.inflationPeakCycle + 1;
	}
	beginSpawnDrop(height = SPAWN_DROP_MIN_HEIGHT) {
		this.state = "spawning";
		this.root.visible = true;
		this.isDropping = true;
		this.isSpawnDrop = true;
		this.dropLanded = false;
		this.spawnDropHeight = Math.max(SPAWN_DROP_MIN_HEIGHT, height);
		this.dropOffset = -this.spawnDropHeight;
		this.dropVelocity = 0;
		this.landingDirection = this.id.charCodeAt(0) % 2 === 0 ? 1 : -1;
		this.landingSway = 0;
		this.landingTilt = 0;
		this.landingImpactCount = 0;
		this.landingContactSide = 0;
		this.dropElapsed = 0;
		this.dropStartedAt = performance.now() * .001;
		this.dropLandedAt = 0;
	}
	updateInflation(now) {
		if (this.inflationPeakHoldFrames > 0) {
			this.inflationPeakHoldFrames -= 1;
			return;
		}
		const elapsed = Math.max(0, now - this.inflationStartedAt);
		const cycleIndex = Math.floor(elapsed / INFLATE_CYCLE_DURATION);
		const phase = elapsed % INFLATE_CYCLE_DURATION / INFLATE_CYCLE_DURATION;
		const nextPeakCycle = this.inflationPeakCycle + 1;
		if (nextPeakCycle < INFLATE_AMPLITUDES.length && (nextPeakCycle < cycleIndex || nextPeakCycle === cycleIndex && phase >= .3)) {
			this.inflationPeakCycle = nextPeakCycle;
			this.lifecycleScale = 1 + INFLATE_AMPLITUDES[nextPeakCycle];
			this.inflationPeakHoldFrames = 2;
			return;
		}
		if (cycleIndex >= INFLATE_AMPLITUDES.length) {
			this.lifecycleScale = 1;
			if (this.isConnecting) return;
			this.state = "hidden";
			this.root.visible = false;
			this.recycleRequested = true;
			return;
		}
		this.lifecycleScale = 1 + Math.sin(phase * Math.PI) * INFLATE_AMPLITUDES[cycleIndex];
	}
	resetPoweredState() {
		this.activeElapsed = 0;
		this.activeStartedAt = 0;
		this.activeTimeRemaining = 0;
	}
	getConnectionWorldPosition(target = new Vector3()) {
		return this.connectionAnchor.getWorldPosition(target);
	}
	getAnimationSignal() {
		return typeof this.root.userData.appliancePerformanceSignal === "number" ? this.root.userData.appliancePerformanceSignal : 0;
	}
	getActiveElapsed() {
		const override = window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__;
		return this.state === "active" && Number.isFinite(override) ? Math.max(0, override) : this.state === "active" ? this.activeElapsed : 0;
	}
	get supportsSoftDeform() {
		return this.softDeform !== null;
	}
	get softDeformPull() {
		return this.softDeform?.pullLength ?? 0;
	}
	get softDeformSignedPull() {
		return this.softDeform?.signedPull ?? 0;
	}
	get isSoftDeforming() {
		return this.softDeform ? !this.softDeform.isSettled : false;
	}
	beginSoftDeform(grabWorld, viewDepthAxisWorld, surfaceNormalWorld) {
		if (!this.softDeform) return;
		this.root.updateWorldMatrix(true, true);
		const size = new Box3().setFromObject(this.root).getSize(new Vector3());
		const maxDimension = Math.max(size.x, size.y, size.z);
		const influenceRadius = size.length() * .72;
		this.softDeform.begin(grabWorld, influenceRadius, maxDimension * .52, viewDepthAxisWorld, surfaceNormalWorld);
		if (this.state === "active" && this.animationPausedAt <= 0) this.animationPausedAt = performance.now() * .001;
	}
	setSoftDeformPointer(pointerWorld) {
		this.softDeform?.setPointerWorld(pointerWorld);
	}
	releaseSoftDeform() {
		this.softDeform?.release();
		if (this.animationPausedAt > 0) {
			this.activeStartedAt += Math.max(0, performance.now() * .001 - this.animationPausedAt);
			this.animationPausedAt = 0;
		}
	}
	settleSoftDeformForDrop() {
		this.softDeform?.reset();
		if (this.animationPausedAt > 0) {
			this.activeStartedAt += Math.max(0, performance.now() * .001 - this.animationPausedAt);
			this.animationPausedAt = 0;
		}
	}
	updateSoftDeform(delta) {
		if (!this.isDragging && this.softDeform?.isGrabbing) this.softDeform.release();
		this.softDeform?.update(delta);
	}
	getScreenSize(aspect, fov = 26) {
		const width = Math.max(.01, this.deviceBounds.max.x - this.deviceBounds.min.x);
		const height = Math.max(.01, this.deviceBounds.max.y - this.deviceBounds.min.y);
		const projectionScale = Math.tan(MathUtils.degToRad(13)) / Math.tan(MathUtils.degToRad(fov * .5));
		return new Vector2(this.actualScreenHeight * projectionScale * this.presentationScale * (width / height) / Math.max(.1, aspect), this.actualScreenHeight * projectionScale * this.presentationScale);
	}
	setScreenPlacement(position) {
		const side = position.x < .5 ? -1 : 1;
		this.facingSide = side;
		const distances = {
			left: position.x,
			right: 1 - position.x,
			top: position.y,
			bottom: 1 - position.y
		};
		this.outwardEdge = Object.keys(distances).reduce((closest, edge) => distances[edge] < distances[closest] ? edge : closest, "left");
		this.connectionAnchor.rotation.set(0, 0, 0);
		const centerY = (this.deviceBounds.min.y + this.deviceBounds.max.y) * .5;
		const centerX = (this.deviceBounds.min.x + this.deviceBounds.max.x) * .5;
		const frontZ = this.deviceBounds.max.z + EDGE_PADDING;
		const preferredSocket = this.connectionSocketsByEdge[this.outwardEdge];
		if (preferredSocket) {
			this.root.updateWorldMatrix(true, true);
			preferredSocket.getWorldPosition(this.connectionAnchor.position);
			this.root.worldToLocal(this.connectionAnchor.position);
		} else if (this.outwardEdge === "left") this.connectionAnchor.position.set(this.deviceBounds.min.x - EDGE_PADDING, centerY, frontZ);
		else if (this.outwardEdge === "right") this.connectionAnchor.position.set(this.deviceBounds.max.x + EDGE_PADDING, centerY, frontZ);
		else if (this.outwardEdge === "top") this.connectionAnchor.position.set(centerX, this.deviceBounds.max.y + EDGE_PADDING, frontZ);
		else this.connectionAnchor.position.set(centerX, this.deviceBounds.min.y - EDGE_PADDING, frontZ);
		if (this.outwardEdge === "left") this.connectionAnchor.rotation.y = -Math.PI * .5;
		else if (this.outwardEdge === "right") this.connectionAnchor.rotation.y = Math.PI * .5;
		else if (this.outwardEdge === "top") this.connectionAnchor.rotation.x = -Math.PI * .5;
		else this.connectionAnchor.rotation.x = Math.PI * .5;
	}
	beginDrop() {
		this.isDropping = true;
		this.isSpawnDrop = false;
		this.dropLanded = false;
		this.dropOffset = 0;
		this.dropVelocity = 0;
		this.landingDirection = this.id.charCodeAt(0) % 2 === 0 ? 1 : -1;
		this.landingSway = 0;
		this.landingSwayVelocity = 0;
		this.landingTilt = 0;
		this.landingTiltVelocity = 0;
		this.landingImpactCount = 0;
		this.landingContactSide = 0;
		this.dropElapsed = 0;
		const now = performance.now() * .001;
		this.dropStartedAt = now;
		this.dropLandedAt = 0;
		this.dropCommitPending = false;
		if (this.state === "active" && this.animationPausedAt <= 0) this.animationPausedAt = now;
	}
	finishDrop() {
		if (this.animationPausedAt <= 0) return;
		this.activeStartedAt += Math.max(0, performance.now() * .001 - this.animationPausedAt);
		this.animationPausedAt = 0;
	}
	dispose() {
		this.detachForDisposal();
		this.collectDisposalResources().forEach((resource) => resource.dispose());
	}
	detachForDisposal() {
		this.softDeform?.reset();
		this.root.removeFromParent();
	}
	collectDisposalResources() {
		const geometries = /* @__PURE__ */ new Set();
		this.root.traverse((object) => {
			if (object instanceof Mesh) geometries.add(object.geometry);
		});
		return [...geometries, ...this.materials];
	}
	buildConnectionAnchor() {
		this.connectionAnchor.name = `${this.id}-connection-anchor`;
		this.root.add(this.connectionAnchor);
	}
};
var ApplianceScene = class {
	root = new Group();
	targets = [];
	assignments = /* @__PURE__ */ new Map();
	requiredColors = /* @__PURE__ */ new Set();
	colorPlugStyles = /* @__PURE__ */ new Map();
	colorRoutingAliases = /* @__PURE__ */ new Map();
	raycaster = new Raycaster();
	pointer = new Vector2();
	projected = new Vector3();
	cameraUp = new Vector3();
	cameraRight = new Vector3();
	boundedOrbitCamera = new PerspectiveCamera();
	boundedOrbitTarget = new Vector3(0, .05, 0);
	boundedOrbitProjected = new Vector3();
	boundedOrbitProbe = new Object3D();
	boundedCameraInverse = new Quaternion();
	boundedRelativeQuaternion = new Quaternion();
	diagnosticRootUp = new Vector3();
	diagnosticScreenUp = new Vector3();
	diagnosticRootQuaternion = new Quaternion();
	dragOffset = new Vector2();
	dragStartClient = new Vector2();
	dragStartScreenPosition = new Vector2();
	dragPlane = new Plane();
	dragPlanePoint = new Vector3();
	dragHitPoint = new Vector3();
	dragViewAxis = new Vector3();
	dragSurfaceNormal = new Vector3();
	dragNormalMatrix = new Matrix3();
	openingTransforms = /* @__PURE__ */ new Map();
	transitionPosition = new Vector3();
	transitionQuaternion = new Quaternion();
	transitionScale = new Vector3();
	canvas = null;
	camera = null;
	orbitYaw = .76;
	orbitPitch = .56;
	appliancePitch = .56;
	orbitRadius = 19.2;
	boundedOrbitScreenDepth = 24.4;
	pointerId = null;
	dragHoldTimer = 0;
	draggedTarget = null;
	suppressClick = false;
	burstHandler = null;
	assignmentState = 0;
	replacementStates = /* @__PURE__ */ new Map();
	configuredSeed = 0;
	configuredDefinitions = [];
	configuredColors = [];
	replacementKindHistory = /* @__PURE__ */ new Map();
	routingStateRevision = 0;
	routingStateSignature = "";
	replacementFilter = null;
	replacementWarmupHandler = null;
	replacementWarmupActive = 0;
	replacementWarmupQueue = [];
	interactionEnabled = true;
	pendingSpawns = [];
	preparedReplacements = /* @__PURE__ */ new Map();
	queuedReplacements = /* @__PURE__ */ new Map();
	deferredDisposals = [];
	nextRuntimeReplacementPrepareAt = 0;
	replacementDiagnosticsGeneration = 0;
	replacementDiagnostics = {
		prepareCount: 0,
		preparedHitCount: 0,
		preparedMissCount: 0,
		warmupPendingCount: 0,
		preparedCount: 0,
		queuedPreparedCount: 0,
		deferredDisposalCount: 0,
		lastFromKind: null,
		lastToKind: null,
		lastPrepareBuildMs: 0,
		maxPrepareBuildMs: 0,
		lastModelFactoryMs: 0,
		lastTargetSetupMs: 0,
		lastSoftDeformMs: 0,
		lastWarmupMs: 0,
		maxWarmupMs: 0,
		lastFallbackBuildMs: 0,
		maxFallbackBuildMs: 0,
		lastCommitMs: 0,
		maxCommitMs: 0,
		lastDisposalSliceMs: 0,
		maxDisposalSliceMs: 0
	};
	constructor() {
		this.root.name = "appliance-scene";
	}
	configure(seed, definitions = selectAppliancesForSeed(seed), colors = ARROW_COLORS) {
		const arrangedColors = this.arrangeColors(seed, colors, definitions.length);
		this.rememberConfiguration(seed, definitions, arrangedColors);
		const restoreVisibility = this.root.visible;
		this.root.visible = false;
		this.clearTargets(seed);
		definitions.forEach((definition, index) => {
			this.addTarget(definition, index, arrangedColors);
		});
		this.commitInitialLayout(seed, restoreVisibility);
	}
	async configureAsync(seed, onProgress, definitions = selectAppliancesForSeed(seed), colors = ARROW_COLORS) {
		const arrangedColors = this.arrangeColors(seed, colors, definitions.length);
		this.rememberConfiguration(seed, definitions, arrangedColors);
		const restoreVisibility = this.root.visible;
		this.root.visible = false;
		this.clearTargets(seed);
		const buildBudget = new CooperativeYieldBudget();
		for (let index = 0; index < definitions.length; index += 1) {
			const startedAt = performance.now();
			this.addTarget(definitions[index], index, arrangedColors);
			onProgress?.((index + 1) / definitions.length, performance.now() - startedAt);
			await buildBudget.afterItem();
		}
		this.commitInitialLayout(seed, restoreVisibility);
	}
	/** Build three bounded replacement generations per slot while the loading UI is still active. */
	async prepareInitialReplacementsAsync(onProgress, preloadGenerations = REPLACEMENT_PRELOAD_GENERATIONS, awaitWarmups = false) {
		const initialTargets = [...this.targets];
		const generations = Math.max(1, Math.min(REPLACEMENT_PRELOAD_GENERATIONS, Math.floor(preloadGenerations)));
		const totalBuilds = initialTargets.length * generations;
		let completedBuilds = 0;
		const buildBudget = new CooperativeYieldBudget();
		for (let index = 0; index < initialTargets.length; index += 1) {
			const startedAt = performance.now();
			this.prepareReplacement(initialTargets[index]);
			completedBuilds += 1;
			onProgress?.(completedBuilds / Math.max(1, totalBuilds), performance.now() - startedAt);
			await buildBudget.afterItem();
		}
		let projectedTargets = initialTargets.map((target) => this.preparedReplacements.get(target)?.replacement ?? target);
		let projectedRandomStates = initialTargets.map((target, index) => this.preparedReplacements.get(target)?.nextRandomState ?? this.replacementStateFor(index));
		for (let generation = 1; generation < generations; generation += 1) {
			const nextProjectedTargets = [];
			const nextProjectedRandomStates = [];
			for (let index = 0; index < projectedTargets.length; index += 1) {
				const previous = projectedTargets[index];
				const startedAt = performance.now();
				const otherTargets = projectedTargets.filter((_, otherIndex) => otherIndex !== index);
				const recentKinds = [
					previous.kind,
					initialTargets[index].kind,
					...this.replacementKindHistory.get(index) ?? []
				];
				const randomState = projectedRandomStates[index] ?? this.replacementStateFor(index);
				const created = this.createReplacement(previous, index, otherTargets, randomState, recentKinds, initialTargets.map((target) => target.kind));
				nextProjectedTargets[index] = created.replacement.kind !== previous.kind ? created.replacement : previous;
				nextProjectedRandomStates[index] = created.nextRandomState;
				if (created.replacement.kind !== previous.kind) {
					const queued = this.createPreparedReplacement(previous, created.replacement, index, randomState, created.nextRandomState);
					queued.replacement.root.visible = false;
					const queue = this.queuedReplacements.get(index) ?? [];
					queue.push(queued);
					this.queuedReplacements.set(index, queue);
					this.recordPreparedReplacement(previous, queued.replacement, performance.now() - startedAt);
					this.warmPreparedReplacement(queued);
				} else created.replacement.dispose();
				completedBuilds += 1;
				onProgress?.(completedBuilds / Math.max(1, totalBuilds), performance.now() - startedAt);
				await buildBudget.afterItem();
			}
			projectedTargets = nextProjectedTargets;
			projectedRandomStates = nextProjectedRandomStates;
		}
		if (awaitWarmups) {
			const initialWarmups = [...this.preparedReplacements.values(), ...[...this.queuedReplacements.values()].flat()].map((prepared) => prepared.warmupPromise);
			await Promise.all(initialWarmups);
		}
	}
	rememberConfiguration(seed, definitions, colors) {
		this.configuredSeed = seed;
		this.configuredDefinitions = [...definitions];
		this.configuredColors = [...colors];
	}
	arrangeColors(seed, colors, count) {
		const source = colors.length > 0 ? colors : ARROW_COLORS;
		const arranged = Array.from({ length: count }, (_, index) => source[index % source.length]);
		let state = (seed ^ 3039394381) >>> 0;
		const random = () => {
			state = Math.imul(state, 1664525) + 1013904223 >>> 0;
			return state / 4294967296;
		};
		for (let index = arranged.length - 1; index > 0; index -= 1) {
			const swapIndex = Math.floor(random() * (index + 1));
			[arranged[index], arranged[swapIndex]] = [arranged[swapIndex], arranged[index]];
		}
		return arranged;
	}
	clearTargets(seed) {
		this.clearPreparedReplacements();
		this.flushDeferredDisposals();
		this.assignments.clear();
		this.requiredColors.clear();
		this.colorPlugStyles.clear();
		this.colorRoutingAliases.clear();
		this.targets.forEach((target) => target.dispose());
		this.targets.length = 0;
		this.pendingSpawns.length = 0;
		this.replacementKindHistory.clear();
		this.nextRuntimeReplacementPrepareAt = 0;
		this.assignmentState = (seed ^ 2135587861) >>> 0;
		this.replacementStates.clear();
		Object.assign(this.replacementDiagnostics, {
			prepareCount: 0,
			preparedHitCount: 0,
			preparedMissCount: 0,
			warmupPendingCount: 0,
			preparedCount: 0,
			queuedPreparedCount: 0,
			deferredDisposalCount: 0,
			lastFromKind: null,
			lastToKind: null,
			lastPrepareBuildMs: 0,
			maxPrepareBuildMs: 0,
			lastModelFactoryMs: 0,
			lastTargetSetupMs: 0,
			lastSoftDeformMs: 0,
			lastWarmupMs: 0,
			maxWarmupMs: 0,
			lastFallbackBuildMs: 0,
			maxFallbackBuildMs: 0,
			lastCommitMs: 0,
			maxCommitMs: 0,
			lastDisposalSliceMs: 0,
			maxDisposalSliceMs: 0
		});
		this.syncRoutingRevision();
	}
	addTarget(definition, index, colors) {
		const color = colors[index % Math.max(1, colors.length)] ?? ARROW_COLORS[index % ARROW_COLORS.length];
		const target = new ApplianceTarget(definition, color, [.1, .5]);
		target.root.visible = false;
		this.targets.push(target);
		if (!this.colorPlugStyles.has(color)) this.colorPlugStyles.set(color, target.plugStyleId);
		this.root.add(target.root);
	}
	setBurstHandler(handler) {
		this.burstHandler = handler;
	}
	getPlugStyleForColor(color) {
		const style = this.colorPlugStyles.get(color) ?? this.targets.find((target) => target.accent === (this.colorRoutingAliases.get(color) ?? color))?.plugStyleId;
		if (!style) throw new Error(`No appliance plug style registered for color ${color}.`);
		return style;
	}
	setSingleTargetColorAliases(colors) {
		this.colorRoutingAliases.clear();
		const target = this.targets.length === 1 ? this.targets[0] : null;
		if (target) colors.forEach((color) => {
			this.colorRoutingAliases.set(color, target.accent);
			this.colorPlugStyles.set(color, target.plugStyleId);
		});
		this.syncRoutingRevision();
	}
	get routingRevision() {
		return this.routingStateRevision;
	}
	setRequiredColors(colors) {
		const nextColors = new Set(colors);
		if (nextColors.size === this.requiredColors.size && [...nextColors].every((color) => this.requiredColors.has(color))) return;
		this.requiredColors.clear();
		nextColors.forEach((color) => this.requiredColors.add(color));
		this.pruneInvalidPreparedReplacements();
		this.syncRoutingRevision();
	}
	setReplacementFilter(filter) {
		this.clearPreparedReplacements();
		this.replacementFilter = filter;
	}
	setReplacementWarmupHandler(handler) {
		this.replacementWarmupHandler = handler;
	}
	setInteractionEnabled(enabled) {
		this.interactionEnabled = enabled;
		if (enabled || this.pointerId === null) return;
		this.pointerId = null;
		this.draggedTarget = null;
		this.canvas?.classList.remove("dragging-appliance");
	}
	canAssignColor(color) {
		return this.assignmentCandidates(color).length > 0;
	}
	canQueueColor(color) {
		const routedColor = this.colorRoutingAliases.get(color) ?? color;
		return this.targets.some((target) => target.accent === routedColor && !target.isDropping);
	}
	canHandleColor(color) {
		return this.canAssignColor(color) || this.canQueueColor(color);
	}
	reserveAssignment(cableId, color) {
		const existing = this.assignments.get(cableId);
		if (existing) return existing;
		const candidates = this.assignmentCandidates(color);
		if (candidates.length === 0) return null;
		const target = candidates[Math.floor(this.nextAssignmentRandom() * candidates.length)] ?? null;
		if (!target) return null;
		this.assignments.set(cableId, target);
		target.reserve(color);
		this.syncRoutingRevision();
		return target;
	}
	releaseAssignment(cableId, expectedTarget) {
		const target = this.assignments.get(cableId);
		if (!target || expectedTarget && target !== expectedTarget || !target.cancelReservation()) return false;
		this.assignments.delete(cableId);
		this.syncRoutingRevision();
		return true;
	}
	getRoutingSummary() {
		const coveredColors = [.../* @__PURE__ */ new Set([...this.targets.map((target) => target.accent), ...this.colorRoutingAliases.keys()])];
		const assignableTargetColors = new Set(this.targets.filter((target) => this.isAssignableTarget(target)).map((target) => target.accent));
		const assignableColors = [.../* @__PURE__ */ new Set([...assignableTargetColors, ...[...this.colorRoutingAliases].filter(([, routedColor]) => assignableTargetColors.has(routedColor)).map(([color]) => color)])];
		const requiredColors = [...this.requiredColors];
		return {
			requiredColors,
			coveredColors,
			assignableColors,
			allRequiredCovered: requiredColors.every((color) => coveredColors.includes(color)),
			reservations: [...this.assignments].map(([cableId, target]) => ({
				cableId,
				color: target.accent,
				targetId: target.id
			}))
		};
	}
	getActiveLayout() {
		return this.targets.map((target) => ({
			definition: target.definition,
			color: target.accent,
			side: target.screenPosition.x < .5 ? "left" : "right",
			screen: [target.screenPosition.x, target.screenPosition.y]
		}));
	}
	getCatalogSummary() {
		return applianceCatalogSummary();
	}
	isScreenPointBlockedByAppliance(ndcX, ndcY) {
		const aspect = this.canvas ? Math.max(.1, this.canvas.clientWidth / Math.max(1, this.canvas.clientHeight)) : 16 / 9;
		const screenX = (ndcX + 1) * .5;
		const screenY = (1 - ndcY) * .5;
		return this.targets.some((target) => {
			if (!target.root.visible || target.isLifecycleTransitioning || target.isConnecting) return false;
			const size = target.getScreenSize(aspect, this.camera?.fov);
			return Math.abs(screenX - target.screenPosition.x) <= size.x * .46 && Math.abs(screenY - target.screenPosition.y) <= size.y * .46;
		});
	}
	bind(canvas, camera) {
		this.unbind();
		this.canvas = canvas;
		this.camera = camera;
		canvas.addEventListener("pointerdown", this.onPointerDown, true);
		canvas.addEventListener("pointermove", this.onPointerMove, true);
		canvas.addEventListener("pointerup", this.onPointerUp, true);
		canvas.addEventListener("pointercancel", this.onPointerCancel, true);
		canvas.addEventListener("click", this.onClickCapture, true);
	}
	setOrbitState(state) {
		this.orbitYaw = state.yaw;
		this.orbitPitch = state.pitch;
		this.appliancePitch = state.appliancePitch;
		this.orbitRadius = state.radius;
	}
	assign(cableId, color) {
		const target = this.reserveAssignment(cableId, color);
		if (!target) throw new Error(`No assignable appliance for cable ${cableId} and color ${color}.`);
		return target;
	}
	update(delta, elapsed) {
		const camera = this.camera;
		if (!camera) return;
		camera.updateMatrixWorld(true);
		this.prepareBoundedOrbitCamera(camera);
		const screenDepth = camera.position.length() + BACK_LAYER_OFFSET;
		const now = performance.now() * .001;
		this.processDeferredDisposals(now);
		const spawnBursts = [];
		for (let index = this.pendingSpawns.length - 1; index >= 0; index -= 1) {
			const pending = this.pendingSpawns[index];
			if (now < pending.readyAt || !pending.warmup.warmupReady) continue;
			this.pendingSpawns.splice(index, 1);
			pending.target.beginSpawnDrop(this.spawnDropHeightFor(pending.target, camera, screenDepth));
			spawnBursts.push(pending.target);
		}
		const recycle = [];
		let preparedReplacementThisFrame = false;
		for (const target of [...this.targets]) {
			target.depthScale = screenDepth / REFERENCE_SCREEN_DEPTH;
			target.update(delta, elapsed);
			if (!this.preparedReplacements.has(target) && !target.isDragging && (target.state === "active" && target.getActiveElapsed() >= SPAWN_DROP_PREPARE_AFTER || target.state === "inflating") && !preparedReplacementThisFrame && now >= this.nextRuntimeReplacementPrepareAt) {
				this.prepareReplacement(target);
				this.nextRuntimeReplacementPrepareAt = performance.now() * .001 + RUNTIME_REPLACEMENT_PREPARE_GAP;
				preparedReplacementThisFrame = true;
			}
			this.updateDrop(target, delta);
			this.positionTarget(target, camera, screenDepth);
			if (target.dropCommitPending) {
				const settledWorld = target.root.getWorldPosition(new Vector3()).project(camera);
				target.screenPosition.set(settledWorld.x * .5 + .5, .5 - settledWorld.y * .5);
				target.dropOffset = 0;
				target.landingSway = 0;
				target.dropCommitPending = false;
				this.positionTarget(target, camera, screenDepth);
			}
			target.updateSoftDeform(delta);
			if (!target.isDragging && !target.isDropping && target.consumeRecycleRequest()) recycle.push(target);
		}
		spawnBursts.forEach((target) => {
			target.root.updateWorldMatrix(true, true);
			this.burstHandler?.(target.getConnectionWorldPosition(), this.cameraUp.clone().multiplyScalar(.8), 22);
		});
		recycle.forEach((target) => this.replaceTarget(target, camera, screenDepth, now));
		this.syncRoutingRevision();
	}
	replaceActiveTargetForEvidence() {
		const camera = this.camera;
		const target = this.targets.find((candidate) => candidate.state !== "idle");
		if (!camera || !target) return false;
		camera.updateMatrixWorld(true);
		const screenDepth = camera.position.length() + BACK_LAYER_OFFSET;
		const targetIndex = this.targets.indexOf(target);
		this.replaceTarget(target, camera, screenDepth, performance.now() * .001);
		const replacement = this.targets[targetIndex];
		if (!replacement || replacement === target) return false;
		for (let index = this.pendingSpawns.length - 1; index >= 0; index -= 1) if (this.pendingSpawns[index].target === replacement) this.pendingSpawns.splice(index, 1);
		replacement.reset();
		replacement.depthScale = screenDepth / REFERENCE_SCREEN_DEPTH;
		this.positionTarget(replacement, camera, screenDepth);
		this.syncRoutingRevision();
		return true;
	}
	beginOpeningCameraTransition() {
		this.openingTransforms.clear();
		for (const target of this.targets) this.openingTransforms.set(target, {
			position: target.root.position.clone(),
			quaternion: target.root.quaternion.clone(),
			scale: target.root.scale.clone()
		});
	}
	updateOpeningCameraTransition(delta, elapsed, anchorBlend) {
		if (this.openingTransforms.size === 0) this.beginOpeningCameraTransition();
		this.update(delta, elapsed);
		const blend = MathUtils.clamp(anchorBlend, 0, 1);
		for (const target of this.targets) {
			const opening = this.openingTransforms.get(target);
			if (!opening) continue;
			this.transitionPosition.copy(target.root.position);
			this.transitionQuaternion.copy(target.root.quaternion);
			this.transitionScale.copy(target.root.scale);
			target.root.position.lerpVectors(opening.position, this.transitionPosition, blend);
			target.root.quaternion.slerpQuaternions(opening.quaternion, this.transitionQuaternion, blend);
			target.root.scale.lerpVectors(opening.scale, this.transitionScale, blend);
		}
	}
	endOpeningCameraTransition() {
		this.openingTransforms.clear();
	}
	reset() {
		this.resetInteractionState();
		if (this.configuredDefinitions.length > 0) {
			const restoreVisibility = this.root.visible;
			this.clearTargets(this.configuredSeed);
			this.configuredDefinitions.forEach((definition, index) => {
				this.addTarget(definition, index, this.configuredColors);
			});
			this.commitInitialLayout(this.configuredSeed, restoreVisibility);
			return;
		}
		this.clearPreparedReplacements();
		this.assignments.clear();
		this.pendingSpawns.length = 0;
		this.targets.forEach((target) => target.reset());
		this.syncRoutingRevision();
	}
	clear() {
		this.resetInteractionState();
		this.configuredDefinitions = [];
		this.configuredColors = [];
		this.clearTargets(0);
	}
	resetInteractionState() {
		globalThis.clearTimeout(this.dragHoldTimer);
		this.dragHoldTimer = 0;
		this.pointerId = null;
		this.draggedTarget = null;
		this.canvas?.classList.remove("dragging-appliance");
		this.openingTransforms.clear();
	}
	dispose() {
		this.unbind();
		this.clearPreparedReplacements();
		this.flushDeferredDisposals();
		this.targets.forEach((target) => target.dispose());
		this.root.removeFromParent();
	}
	getStateSummary() {
		const aspect = this.canvas ? Math.max(.1, this.canvas.clientWidth / Math.max(1, this.canvas.clientHeight)) : 16 / 9;
		if (this.camera) this.diagnosticScreenUp.set(0, 1, 0).applyQuaternion(this.camera.quaternion);
		return this.targets.map((target) => {
			const size = target.getScreenSize(aspect, this.camera?.fov);
			const rootWorldPosition = target.root.getWorldPosition(new Vector3());
			const rootScreenY = this.camera ? .5 - rootWorldPosition.project(this.camera).y * .5 : target.screenPosition.y;
			const screenUpAlignment = this.camera ? this.diagnosticRootUp.set(0, 1, 0).applyQuaternion(target.root.getWorldQuaternion(this.diagnosticRootQuaternion)).dot(this.diagnosticScreenUp) : 1;
			const orientation = target.root.getWorldQuaternion(this.diagnosticRootQuaternion);
			return {
				id: target.id,
				kind: target.kind,
				accent: target.accent,
				sizeTier: target.sizeTier,
				plugStyleId: target.plugStyleId,
				state: target.state,
				connections: target.connectionCount,
				activeTimeRemaining: target.activeTimeRemaining,
				animationSignal: target.getAnimationSignal(),
				screenX: target.screenPosition.x,
				screenY: target.screenPosition.y,
				screenWidth: size.x,
				screenHeight: size.y,
				rootScreenY,
				instanceId: target.root.uuid,
				dragging: target.isDragging,
				dropping: target.isDropping,
				dropOffset: target.dropOffset,
				landingSway: target.landingSway,
				landingTilt: target.landingTilt,
				landingImpactCount: target.landingImpactCount,
				landingContactSide: target.landingContactSide,
				lifecycleScale: target.lifecycleScale,
				inflationPeakCount: target.inflationPeakCount,
				deforming: target.isSoftDeforming,
				deformPull: target.softDeformPull,
				deformSignedPull: target.softDeformSignedPull,
				screenUpAlignment,
				orientationQuaternion: [
					orientation.x,
					orientation.y,
					orientation.z,
					orientation.w
				],
				facingSide: target.facingSide,
				outwardEdge: target.outwardEdge
			};
		});
	}
	getReplacementDiagnostics() {
		let warmupPendingCount = 0;
		this.preparedReplacements.forEach((prepared) => {
			if (!prepared.warmupReady) warmupPendingCount += 1;
		});
		this.queuedReplacements.forEach((queue) => {
			queue.forEach((prepared) => {
				if (!prepared.warmupReady) warmupPendingCount += 1;
			});
		});
		return {
			...this.replacementDiagnostics,
			warmupPendingCount,
			preparedCount: this.preparedReplacements.size,
			queuedPreparedCount: [...this.queuedReplacements.values()].reduce((count, queue) => count + queue.length, 0),
			deferredDisposalCount: this.deferredDisposals.length
		};
	}
	unbind() {
		if (!this.canvas) return;
		window.clearTimeout(this.dragHoldTimer);
		this.dragHoldTimer = 0;
		this.pointerId = null;
		this.draggedTarget = null;
		this.canvas.removeEventListener("pointerdown", this.onPointerDown, true);
		this.canvas.removeEventListener("pointermove", this.onPointerMove, true);
		this.canvas.removeEventListener("pointerup", this.onPointerUp, true);
		this.canvas.removeEventListener("pointercancel", this.onPointerCancel, true);
		this.canvas.removeEventListener("click", this.onClickCapture, true);
		this.canvas = null;
		this.camera = null;
	}
	resizeLayout() {
		if (this.canvas && this.camera && this.targets.length > 0) this.applyInitialLayout(this.configuredSeed);
	}
	fitTargetToViewport(target) {
		const aspect = this.camera?.aspect ?? 16 / 9;
		let scale = 1;
		if (this.canvas && this.canvas.clientWidth <= 760 && aspect < .8) {
			const size = target.getScreenSize(aspect, this.camera?.fov).divideScalar(target.presentationScale);
			const heightInScreenWidths = target.sizeTier === "XL" ? .29 : target.sizeTier === "L" ? .25 : .2;
			scale = Math.min(.21 / size.x, heightInScreenWidths * aspect / size.y);
		}
		target.root.scale.multiplyScalar(scale / target.presentationScale);
		target.presentationScale = scale;
	}
	applyInitialLayout(seed) {
		const aspect = this.canvas ? Math.max(.1, this.canvas.clientWidth / Math.max(1, this.canvas.clientHeight)) : 16 / 9;
		this.targets.forEach((target) => this.fitTargetToViewport(target));
		if (this.canvas && this.canvas.clientWidth <= 760 && aspect < .8) {
			const compression = MathUtils.clamp((aspect - 750 / 1624) / (750 / 1334 - 750 / 1624), 0, 1);
			const upperInner = .145 + compression * .02;
			const upperOuter = .23 + compression * .015;
			[this.targets.filter((_, index) => index % 2 === 0), this.targets.filter((_, index) => index % 2 === 1)].forEach((targets, band) => {
				const slots = targets.length <= 2 ? [.35, .65] : targets.length === 3 ? [
					.5,
					.15,
					.85
				] : [
					.36,
					.64,
					.15,
					.85
				];
				targets.forEach((target, index) => {
					const positionY = (targets.length === 3 ? index > 0 : index >= 2) ? upperOuter : upperInner;
					target.screenPosition.set(targets.length === 1 ? .5 : slots[index], band === 0 ? positionY : 1 - positionY);
				});
			});
			this.syncRoutingRevision();
			return;
		}
		const left = [];
		const right = [];
		const refrigerator = this.targets.find((target) => target.kind === "refrigerator");
		const refrigeratorSide = (seed >>> 0) % 2 === 0 ? left : right;
		const oppositeSide = refrigeratorSide === left ? right : left;
		if (refrigerator) refrigeratorSide.push(refrigerator);
		const remaining = this.targets.filter((target) => target !== refrigerator).sort((a, b) => b.definition.targetScreenHeight - a.definition.targetScreenHeight);
		for (const target of remaining) {
			const leftHeight = left.reduce((sum, item) => sum + item.definition.targetScreenHeight, 0);
			const rightHeight = right.reduce((sum, item) => sum + item.definition.targetScreenHeight, 0);
			let destination;
			if (left.length >= 4) destination = right;
			else if (right.length >= 4) destination = left;
			else destination = leftHeight <= rightHeight ? left : right;
			destination.push(target);
		}
		while (refrigeratorSide.length > 4) {
			const movable = refrigeratorSide.filter((target) => target !== refrigerator).sort((a, b) => a.definition.targetScreenHeight - b.definition.targetScreenHeight)[0];
			if (!movable) break;
			refrigeratorSide.splice(refrigeratorSide.indexOf(movable), 1);
			oppositeSide.push(movable);
		}
		const arrange = (sideTargets, side) => {
			const refrigeratorTarget = sideTargets.find((target) => target.kind === "refrigerator");
			let ordered = [...sideTargets].sort((a, b) => a.definition.targetScreenHeight - b.definition.targetScreenHeight);
			if (refrigeratorTarget) {
				const rest = ordered.filter((target) => target !== refrigeratorTarget);
				ordered = rest.length > 0 ? [
					rest[0],
					refrigeratorTarget,
					...rest.slice(1)
				] : [refrigeratorTarget];
			} else ordered.reverse();
			const totalHeight = ordered.reduce((sum, target) => sum + target.definition.targetScreenHeight, Math.max(0, ordered.length - 1) * LAYOUT_GAP);
			let cursor = LAYOUT_TOP + Math.max(0, (.73 - totalHeight) * .5);
			for (let index = 0; index < ordered.length; index += 1) {
				const target = ordered[index];
				const halfWidth = target.getScreenSize(aspect, this.camera?.fov).x * .5;
				const edgePadding = aspect < .75 ? .05 : .025;
				const staggeredLane = side === "left" ? index % 2 === 0 ? .12 : .19 : index % 2 === 0 ? .88 : .81;
				const x = side === "left" ? MathUtils.clamp(staggeredLane, edgePadding + halfWidth, Math.max(edgePadding + halfWidth, .23299999999999998 - halfWidth)) : MathUtils.clamp(staggeredLane, Math.min(.767 + halfWidth, 1 - edgePadding - halfWidth), 1 - edgePadding - halfWidth);
				target.screenPosition.set(x, cursor + target.definition.targetScreenHeight * .5);
				cursor += target.definition.targetScreenHeight + LAYOUT_GAP;
			}
		};
		arrange(left, "left");
		arrange(right, "right");
	}
	commitInitialLayout(seed, restoreVisibility) {
		this.applyInitialLayout(seed);
		const camera = this.camera;
		if (camera) {
			camera.updateMatrixWorld(true);
			const screenDepth = camera.position.length() + BACK_LAYER_OFFSET;
			for (const target of this.targets) {
				target.depthScale = screenDepth / REFERENCE_SCREEN_DEPTH;
				this.positionTarget(target, camera, screenDepth);
				target.root.updateWorldMatrix(true, true);
			}
		}
		this.targets.forEach((target) => {
			target.root.visible = true;
		});
		this.root.visible = restoreVisibility;
		this.syncRoutingRevision();
	}
	positionTarget(target, camera, screenDepth) {
		this.fitTargetToViewport(target);
		this.projected.set(target.screenPosition.x * 2 - 1, 1 - target.screenPosition.y * 2, 0).unproject(camera).sub(camera.position).normalize().multiplyScalar(screenDepth).add(camera.position);
		this.cameraUp.set(0, 1, 0).applyQuaternion(camera.quaternion);
		this.cameraRight.set(1, 0, 0).applyQuaternion(camera.quaternion);
		target.root.position.copy(this.projected).addScaledVector(this.cameraUp, -target.dropOffset).addScaledVector(this.cameraRight, target.landingSway * .28);
		const side = target.screenPosition.x < .5 ? -1 : 1;
		if (Math.abs(this.orbitPitch - this.appliancePitch) < 1e-4) {
			target.root.up.set(0, 1, 0);
			target.root.lookAt(camera.position);
			target.root.rotateY(-side * THREE_QUARTER_YAW);
			target.root.rotateX(applianceTopTilt(target.kind));
			target.root.rotateZ(target.landingTilt);
		} else this.applyBoundedOrbitOrientation(target, camera, side);
		target.setScreenPlacement(target.screenPosition);
	}
	prepareBoundedOrbitCamera(camera) {
		if (Math.abs(this.orbitPitch - this.appliancePitch) < 1e-4) return;
		const horizontal = Math.cos(this.appliancePitch) * this.orbitRadius;
		this.boundedOrbitCamera.position.set(Math.sin(this.orbitYaw) * horizontal, Math.sin(this.appliancePitch) * this.orbitRadius, Math.cos(this.orbitYaw) * horizontal);
		this.boundedOrbitCamera.up.set(0, 1, 0);
		this.boundedOrbitCamera.projectionMatrix.copy(camera.projectionMatrix);
		this.boundedOrbitCamera.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
		this.boundedOrbitCamera.lookAt(this.boundedOrbitTarget);
		this.boundedOrbitCamera.updateMatrixWorld(true);
		this.boundedOrbitScreenDepth = this.boundedOrbitCamera.position.length() + BACK_LAYER_OFFSET;
	}
	applyBoundedOrbitOrientation(target, camera, side) {
		this.boundedOrbitProjected.set(target.screenPosition.x * 2 - 1, 1 - target.screenPosition.y * 2, 0).unproject(this.boundedOrbitCamera).sub(this.boundedOrbitCamera.position).normalize().multiplyScalar(this.boundedOrbitScreenDepth).add(this.boundedOrbitCamera.position);
		this.boundedOrbitProbe.position.copy(this.boundedOrbitProjected);
		this.boundedOrbitProbe.up.set(0, 1, 0);
		this.boundedOrbitProbe.lookAt(this.boundedOrbitCamera.position);
		this.boundedOrbitProbe.rotateY(-side * THREE_QUARTER_YAW);
		this.boundedOrbitProbe.rotateX(applianceTopTilt(target.kind));
		this.boundedOrbitProbe.rotateZ(target.landingTilt);
		this.boundedCameraInverse.copy(this.boundedOrbitCamera.quaternion).invert();
		this.boundedRelativeQuaternion.copy(this.boundedCameraInverse).multiply(this.boundedOrbitProbe.quaternion);
		target.root.quaternion.copy(camera.quaternion).multiply(this.boundedRelativeQuaternion);
	}
	updateDrop(target, delta) {
		if (!target.isDropping || target.isDragging) return;
		target.dropElapsed += MathUtils.clamp(delta, 0, .05);
		const now = performance.now() * .001;
		const elapsed = target.dropElapsed;
		if (target.isSpawnDrop) {
			if (elapsed < SPAWN_DROP_FALL_DURATION) {
				const fall = elapsed / SPAWN_DROP_FALL_DURATION;
				target.dropOffset = -target.spawnDropHeight * (1 - fall * fall);
				return;
			}
			const bounceTime = elapsed - SPAWN_DROP_FALL_DURATION;
			const bounceDecay = Math.exp(-2.25 * bounceTime);
			const swayDecay = Math.exp(-2.35 * bounceTime);
			target.dropOffset = -.34 * bounceDecay * Math.abs(Math.sin(bounceTime * DROP_BOUNCE_FREQUENCY));
			target.landingSway = target.landingDirection * .12 * swayDecay * Math.sin(bounceTime * SWAY_FREQUENCY);
			target.landingTilt = -target.landingDirection * .065 * swayDecay * Math.sin(bounceTime * SWAY_FREQUENCY + .42);
			if (elapsed < SPAWN_DROP_TOTAL_DURATION) return;
			target.isDropping = false;
			target.isSpawnDrop = false;
			target.dropOffset = 0;
			target.spawnDropHeight = SPAWN_DROP_MIN_HEIGHT;
			target.landingSway = 0;
			target.landingTilt = 0;
			if (target.state === "spawning") target.state = "idle";
			return;
		}
		if (!target.dropLanded && elapsed < DROP_FALL_DURATION) {
			const fall = elapsed / DROP_FALL_DURATION;
			target.dropOffset = DROP_DISTANCE * fall * fall;
			target.landingTilt = dropContactTilt(0, target.landingDirection) * fall * fall;
			target.landingSway = 0;
			target.landingImpactCount = 0;
			target.landingContactSide = 0;
			return;
		}
		if (!target.dropLanded) {
			target.dropLanded = true;
			target.dropLandedAt = now;
			target.dropElapsed = 0;
			target.dropOffset = DROP_DISTANCE;
			target.landingSway = 0;
			target.landingTilt = dropContactTilt(0, target.landingDirection);
			target.landingImpactCount = 1;
			target.landingContactSide = target.landingDirection;
			target.dropCommitPending = true;
			return;
		}
		let reboundElapsed = target.dropElapsed;
		for (let rebound = 0; rebound < DROP_REBOUND_COUNT; rebound += 1) {
			const upwardSpeed = dropReboundSpeed(rebound);
			const flightDuration = 2 * upwardSpeed / DROP_GRAVITY;
			if (reboundElapsed < flightDuration) {
				const phase = reboundElapsed / flightDuration;
				const lift = upwardSpeed * reboundElapsed - .5 * DROP_GRAVITY * reboundElapsed * reboundElapsed;
				target.dropOffset = -Math.max(0, lift);
				target.landingTilt = MathUtils.lerp(dropContactTilt(rebound, target.landingDirection), dropContactTilt(rebound + 1, target.landingDirection), phase);
				target.landingSway = MathUtils.lerp(dropContactSway(rebound, target.landingDirection), dropContactSway(rebound + 1, target.landingDirection), phase);
				target.landingImpactCount = rebound + 1;
				target.landingContactSide = rebound % 2 === 0 ? target.landingDirection : -target.landingDirection;
				return;
			}
			reboundElapsed -= flightDuration;
		}
		target.finishDrop();
		target.isDropping = false;
		target.dropLanded = false;
		target.dropLandedAt = 0;
		target.dropElapsed = 0;
		target.dropVelocity = 0;
		target.dropOffset = 0;
		target.landingSway = 0;
		target.landingTilt = 0;
		target.landingSwayVelocity = 0;
		target.landingTiltVelocity = 0;
		target.landingImpactCount = 0;
		target.landingContactSide = 0;
	}
	spawnDropHeightFor(target, camera, screenDepth) {
		const viewportHeight = Math.max(1, this.canvas?.clientHeight ?? 720);
		const viewportWidth = Math.max(1, this.canvas?.clientWidth ?? viewportHeight * 16 / 9);
		const aspect = Math.max(.1, viewportWidth / viewportHeight);
		const screenHeight = target.getScreenSize(aspect, camera.fov).y;
		const marginRatio = MathUtils.clamp(viewportHeight * .13, SPAWN_DROP_TOP_MARGIN_MIN_PX, SPAWN_DROP_TOP_MARGIN_MAX_PX) / viewportHeight;
		const visibleVerticalSpan = 2 * Math.tan(MathUtils.degToRad(camera.fov * .5)) * screenDepth;
		return Math.max(SPAWN_DROP_MIN_HEIGHT, (target.screenPosition.y + screenHeight * .55 + marginRatio) * visibleVerticalSpan);
	}
	replaceTarget(previous, camera, screenDepth, now) {
		const commitStartedAt = performance.now();
		const targetIndex = this.targets.indexOf(previous);
		if (targetIndex < 0) return;
		previous.root.updateWorldMatrix(true, true);
		this.burstHandler?.(previous.getConnectionWorldPosition(), this.cameraUp.clone().multiplyScalar(.95), 32);
		const otherTargets = this.targets.filter((target) => target !== previous);
		const prepared = this.preparedReplacements.get(previous);
		this.preparedReplacements.delete(previous);
		const usePrepared = prepared && prepared.targetIndex === targetIndex && prepared.randomState === this.replacementStateFor(targetIndex) && this.isPreparedReplacementValid(previous, prepared.replacement, otherTargets);
		if (usePrepared) this.replacementDiagnostics.preparedHitCount += 1;
		else {
			this.replacementDiagnostics.preparedMissCount += 1;
			this.disposeQueuedReplacements(targetIndex);
		}
		const candidate = usePrepared ? prepared : (() => {
			const fallbackStartedAt = performance.now();
			const created = this.createReplacement(previous, targetIndex, otherTargets);
			const fallbackBuildMs = performance.now() - fallbackStartedAt;
			this.replacementDiagnostics.lastFallbackBuildMs = fallbackBuildMs;
			this.replacementDiagnostics.maxFallbackBuildMs = Math.max(this.replacementDiagnostics.maxFallbackBuildMs, fallbackBuildMs);
			const fallback = this.createPreparedReplacement(previous, created.replacement, targetIndex, this.replacementStateFor(targetIndex), created.nextRandomState, prepared?.previousResources);
			this.warmPreparedReplacement(fallback);
			return fallback;
		})();
		const replacement = candidate.replacement;
		this.replacementStates.set(targetIndex, candidate.nextRandomState);
		if (prepared && prepared.replacement !== replacement) this.disposePreparedReplacement(prepared);
		const recentKinds = this.replacementKindHistory.get(targetIndex) ?? [];
		this.replacementKindHistory.set(targetIndex, [.../* @__PURE__ */ new Set([
			replacement.kind,
			previous.kind,
			...recentKinds
		])].slice(0, REPLACEMENT_KIND_HISTORY_SIZE));
		this.promoteQueuedReplacement(replacement, targetIndex, otherTargets);
		replacement.root.visible = false;
		replacement.depthScale = screenDepth / REFERENCE_SCREEN_DEPTH;
		for (const [cableId, target] of this.assignments) if (target === previous) this.assignments.delete(cableId);
		this.targets[targetIndex] = replacement;
		this.root.add(replacement.root);
		this.positionTarget(replacement, camera, screenDepth);
		previous.detachForDisposal();
		this.deferredDisposals.push({
			resources: candidate.previousResources,
			nextIndex: 0,
			readyAt: now + .12
		});
		this.pendingSpawns.push({
			target: replacement,
			readyAt: now + REPLACEMENT_DELAY,
			warmup: candidate
		});
		const commitMs = performance.now() - commitStartedAt;
		this.replacementDiagnostics.lastFromKind = previous.kind;
		this.replacementDiagnostics.lastToKind = replacement.kind;
		this.replacementDiagnostics.lastCommitMs = commitMs;
		this.replacementDiagnostics.maxCommitMs = Math.max(this.replacementDiagnostics.maxCommitMs, commitMs);
	}
	prepareReplacement(previous) {
		if (this.preparedReplacements.has(previous)) return;
		const targetIndex = this.targets.indexOf(previous);
		if (targetIndex < 0) return;
		const prepareStartedAt = performance.now();
		const otherTargets = this.targets.filter((target) => target !== previous);
		const candidate = this.createReplacement(previous, targetIndex, otherTargets);
		const replacement = candidate.replacement;
		replacement.root.visible = false;
		const prepared = this.createPreparedReplacement(previous, replacement, targetIndex, this.replacementStateFor(targetIndex), candidate.nextRandomState);
		this.recordPreparedReplacement(previous, replacement, performance.now() - prepareStartedAt);
		this.preparedReplacements.set(previous, prepared);
		this.warmPreparedReplacement(prepared);
	}
	createPreparedReplacement(previous, replacement, targetIndex, randomState, nextRandomState, previousResources = previous.collectDisposalResources()) {
		return {
			replacement,
			targetIndex,
			previousResources,
			randomState,
			nextRandomState,
			warmupReady: this.replacementWarmupHandler === null,
			warmupPromise: Promise.resolve()
		};
	}
	recordPreparedReplacement(previous, replacement, prepareBuildMs) {
		const constructionTimings = replacement.root.userData.applianceConstructionTimings;
		this.replacementDiagnostics.prepareCount += 1;
		this.replacementDiagnostics.lastFromKind = previous.kind;
		this.replacementDiagnostics.lastToKind = replacement.kind;
		this.replacementDiagnostics.lastPrepareBuildMs = prepareBuildMs;
		this.replacementDiagnostics.lastModelFactoryMs = constructionTimings?.modelFactoryMs ?? 0;
		this.replacementDiagnostics.lastTargetSetupMs = constructionTimings?.targetSetupMs ?? 0;
		this.replacementDiagnostics.lastSoftDeformMs = constructionTimings?.softDeformMs ?? 0;
		this.replacementDiagnostics.maxPrepareBuildMs = Math.max(this.replacementDiagnostics.maxPrepareBuildMs, prepareBuildMs);
	}
	warmPreparedReplacement(prepared) {
		if (!this.replacementWarmupHandler) {
			prepared.warmupReady = true;
			prepared.warmupPromise = Promise.resolve();
			return;
		}
		const diagnosticsGeneration = this.replacementDiagnosticsGeneration;
		let resolveWarmup;
		let settled = false;
		let started = false;
		let cancelled = false;
		const settle = () => {
			if (settled) return;
			settled = true;
			prepared.warmupReady = true;
			resolveWarmup();
		};
		prepared.warmupPromise = new Promise((resolve) => {
			resolveWarmup = resolve;
		});
		const job = {
			run: async () => {
				if (cancelled) return;
				started = true;
				const warmupStartedAt = performance.now();
				if (diagnosticsGeneration !== this.replacementDiagnosticsGeneration) {
					settle();
					return;
				}
				try {
					await this.replacementWarmupHandler?.(prepared.replacement.root);
				} catch {}
				if (diagnosticsGeneration === this.replacementDiagnosticsGeneration) {
					const warmupMs = performance.now() - warmupStartedAt;
					this.replacementDiagnostics.lastWarmupMs = warmupMs;
					this.replacementDiagnostics.maxWarmupMs = Math.max(this.replacementDiagnostics.maxWarmupMs, warmupMs);
				}
				settle();
			},
			cancel: () => {
				cancelled = true;
				if (!started) settle();
			}
		};
		prepared.cancelWarmup = job.cancel;
		this.replacementWarmupQueue.push(job);
		this.drainReplacementWarmups();
	}
	drainReplacementWarmups() {
		while (this.replacementWarmupActive < REPLACEMENT_WARMUP_CONCURRENCY && this.replacementWarmupQueue.length > 0) {
			const warmup = this.replacementWarmupQueue.shift();
			if (!warmup) break;
			this.replacementWarmupActive += 1;
			warmup.run().finally(() => {
				this.replacementWarmupActive = Math.max(0, this.replacementWarmupActive - 1);
				this.drainReplacementWarmups();
			});
		}
	}
	createReplacement(previous, targetIndex, otherTargets, initialRandomState = this.replacementStateFor(targetIndex), recentKinds = this.replacementKindHistory.get(targetIndex) ?? [], additionalOccupiedKinds = []) {
		let randomState = initialRandomState;
		const random = () => {
			randomState = Math.imul(randomState, 1664525) + 1013904223 >>> 0;
			return randomState / 4294967296;
		};
		const occupiedKinds = new Set(otherTargets.map((target) => target.kind));
		additionalOccupiedKinds.forEach((kind) => occupiedKinds.add(kind));
		this.preparedReplacements.forEach((prepared, preparedFor) => {
			if (preparedFor !== previous && prepared.targetIndex !== targetIndex) occupiedKinds.add(prepared.replacement.kind);
		});
		this.queuedReplacements.forEach((queue, queuedTargetIndex) => {
			if (queuedTargetIndex === targetIndex) return;
			queue.forEach((prepared) => occupiedKinds.add(prepared.replacement.kind));
		});
		const available = APPLIANCE_CATALOG.filter((definition) => definition.id !== previous.kind && !occupiedKinds.has(definition.id) && (this.replacementFilter?.(definition) ?? true));
		const excludedRecentKinds = /* @__PURE__ */ new Set([previous.kind, ...recentKinds]);
		const diversePool = available.filter((definition) => !excludedRecentKinds.has(definition.id));
		const pool = diversePool.length > 0 ? diversePool : available;
		const definition = pool[Math.floor(random() * pool.length)] ?? previous.definition;
		const requiredColorPool = this.requiredColors.size > 0 ? [...this.requiredColors] : [...ARROW_COLORS];
		const previousColorRequired = this.requiredColors.size > 0 && this.requiredColors.has(previous.accent);
		const previousCoveredByOther = otherTargets.some((target) => target.accent === previous.accent);
		const accentPool = !previousColorRequired || previousCoveredByOther ? requiredColorPool.filter((color) => color !== previous.accent) : [];
		return {
			replacement: new ApplianceTarget(definition, accentPool[Math.floor(random() * accentPool.length)] ?? previous.accent, [previous.screenPosition.x, previous.screenPosition.y]),
			nextRandomState: randomState
		};
	}
	isPreparedReplacementValid(previous, replacement, otherTargets) {
		if (replacement.kind === previous.kind) return false;
		if (otherTargets.some((target) => target.kind === replacement.kind)) return false;
		if (!(this.replacementFilter?.(replacement.definition) ?? true)) return false;
		if (!(this.requiredColors.size > 0 ? this.requiredColors : new Set(ARROW_COLORS)).has(replacement.accent)) return false;
		return !(this.requiredColors.has(previous.accent) && !otherTargets.some((target) => target.accent === previous.accent)) || replacement.accent === previous.accent;
	}
	clearPreparedReplacements() {
		this.replacementDiagnosticsGeneration += 1;
		this.preparedReplacements.forEach((prepared) => this.disposePreparedReplacement(prepared));
		this.preparedReplacements.clear();
		this.queuedReplacements.forEach((queue) => {
			queue.forEach((prepared) => this.disposePreparedReplacement(prepared));
		});
		this.queuedReplacements.clear();
		this.replacementWarmupQueue.splice(0).forEach((job) => job.cancel());
	}
	pruneInvalidPreparedReplacements() {
		for (const [previous, prepared] of this.preparedReplacements) {
			const targetIndex = this.targets.indexOf(previous);
			const otherTargets = this.targets.filter((target) => target !== previous);
			if (targetIndex >= 0 && prepared.targetIndex === targetIndex && prepared.randomState === this.replacementStateFor(targetIndex) && this.isPreparedReplacementValid(previous, prepared.replacement, otherTargets)) continue;
			this.preparedReplacements.delete(previous);
			this.disposePreparedReplacement(prepared);
			this.disposeQueuedReplacements(targetIndex);
		}
	}
	promoteQueuedReplacement(previous, targetIndex, otherTargets) {
		const queue = this.queuedReplacements.get(targetIndex);
		if (!queue) return;
		while (queue.length > 0) {
			const prepared = queue.shift();
			if (prepared.randomState === this.replacementStateFor(targetIndex) && this.isPreparedReplacementValid(previous, prepared.replacement, otherTargets)) {
				this.preparedReplacements.set(previous, prepared);
				break;
			}
			this.disposePreparedReplacement(prepared);
		}
		if (queue.length === 0) this.queuedReplacements.delete(targetIndex);
	}
	disposeQueuedReplacements(targetIndex) {
		const queue = this.queuedReplacements.get(targetIndex);
		if (!queue) return;
		queue.forEach((prepared) => this.disposePreparedReplacement(prepared));
		this.queuedReplacements.delete(targetIndex);
	}
	disposePreparedReplacement(prepared) {
		prepared.cancelWarmup?.();
		prepared.warmupPromise.finally(() => prepared.replacement.dispose());
	}
	replacementStateFor(targetIndex) {
		const existing = this.replacementStates.get(targetIndex);
		if (existing !== void 0) return existing;
		const baseState = (this.configuredSeed ^ 2135587861) >>> 0;
		const state = targetIndex === 0 ? baseState : (baseState ^ Math.imul(targetIndex, 2654435769)) >>> 0;
		this.replacementStates.set(targetIndex, state);
		return state;
	}
	nextAssignmentRandom() {
		this.assignmentState = Math.imul(this.assignmentState, 1664525) + 1013904223 >>> 0;
		return this.assignmentState / 4294967296;
	}
	processDeferredDisposals(now) {
		const disposalStartedAt = performance.now();
		const deadline = disposalStartedAt + 1.25;
		while (this.deferredDisposals.length > 0) {
			const batch = this.deferredDisposals[0];
			if (now < batch.readyAt) return;
			batch.resources[batch.nextIndex]?.dispose();
			batch.nextIndex += 1;
			if (batch.nextIndex >= batch.resources.length) this.deferredDisposals.shift();
			if (performance.now() >= deadline) break;
		}
		const disposalSliceMs = performance.now() - disposalStartedAt;
		this.replacementDiagnostics.lastDisposalSliceMs = disposalSliceMs;
		this.replacementDiagnostics.maxDisposalSliceMs = Math.max(this.replacementDiagnostics.maxDisposalSliceMs, disposalSliceMs);
	}
	flushDeferredDisposals() {
		this.deferredDisposals.forEach((batch) => {
			for (let index = batch.nextIndex; index < batch.resources.length; index += 1) batch.resources[index].dispose();
		});
		this.deferredDisposals.length = 0;
	}
	onPointerDown = (event) => {
		if (!this.interactionEnabled || event.button !== 0 || this.pointerId !== null || !this.canvas || !this.camera) return;
		const rect = this.canvas.getBoundingClientRect();
		this.pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
		this.camera.updateMatrixWorld(true);
		this.root.updateMatrixWorld(true);
		this.raycaster.setFromCamera(this.pointer, this.camera);
		const meshes = this.targets.flatMap((target) => target.isConnecting || target.isLifecycleTransitioning || target.isDropping ? [] : target.interactiveMeshes);
		const hit = this.raycaster.intersectObjects(meshes, false)[0];
		const applianceId = hit?.object.userData.applianceId;
		const target = this.targets.find((candidate) => candidate.id === applianceId);
		if (!target) return;
		event.preventDefault();
		event.stopImmediatePropagation();
		this.pointerId = event.pointerId;
		this.draggedTarget = target;
		this.dragStartClient.set(event.clientX, event.clientY);
		this.dragStartScreenPosition.copy(target.screenPosition);
		this.dragHitPoint.copy(hit.point);
		this.camera.getWorldDirection(this.dragViewAxis);
		if (hit.face) {
			this.dragNormalMatrix.getNormalMatrix(hit.object.matrixWorld);
			this.dragSurfaceNormal.copy(hit.face.normal).applyNormalMatrix(this.dragNormalMatrix);
		} else this.dragSurfaceNormal.copy(this.dragViewAxis).negate();
		this.dragPlane.setFromNormalAndCoplanarPoint(this.dragViewAxis, hit.point);
		const pointerX = (event.clientX - rect.left) / rect.width;
		const pointerY = (event.clientY - rect.top) / rect.height;
		this.dragOffset.set(target.screenPosition.x - pointerX, target.screenPosition.y - pointerY);
		this.canvas.setPointerCapture(event.pointerId);
		window.clearTimeout(this.dragHoldTimer);
		this.dragHoldTimer = window.setTimeout(this.activatePendingDrag, DRAG_HOLD_DELAY_MS);
	};
	activatePendingDrag = () => {
		this.dragHoldTimer = 0;
		const target = this.draggedTarget;
		if (!target || this.pointerId === null) return;
		target.isDragging = true;
		target.isDropping = false;
		target.dropOffset = 0;
		target.dropVelocity = 0;
		target.beginSoftDeform(this.dragHitPoint, this.dragViewAxis, this.dragSurfaceNormal);
		this.canvas?.classList.add("dragging-appliance");
	};
	onPointerMove = (event) => {
		if (event.pointerId !== this.pointerId || !this.canvas || !this.draggedTarget) return;
		event.preventDefault();
		event.stopImmediatePropagation();
		if (!this.draggedTarget.isDragging) return;
		const rect = this.canvas.getBoundingClientRect();
		if (this.draggedTarget.supportsSoftDeform && this.camera) {
			const deltaX = event.clientX - this.dragStartClient.x;
			const deltaY = event.clientY - this.dragStartClient.y;
			const distance = Math.hypot(deltaX, deltaY);
			const bodyRatio = distance > SOFT_ELASTIC_LEASH_PX ? (distance - SOFT_ELASTIC_LEASH_PX) / distance : 0;
			this.draggedTarget.screenPosition.set(MathUtils.clamp(this.dragStartScreenPosition.x + deltaX * bodyRatio / rect.width, .06, .94), MathUtils.clamp(this.dragStartScreenPosition.y + deltaY * bodyRatio / rect.height, .07, .92));
			this.pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
			this.camera.updateMatrixWorld(true);
			this.raycaster.setFromCamera(this.pointer, this.camera);
			if (this.raycaster.ray.intersectPlane(this.dragPlane, this.dragPlanePoint)) this.draggedTarget.setSoftDeformPointer(this.dragPlanePoint);
			return;
		}
		this.draggedTarget.screenPosition.set(MathUtils.clamp((event.clientX - rect.left) / rect.width + this.dragOffset.x, .06, .94), MathUtils.clamp((event.clientY - rect.top) / rect.height + this.dragOffset.y, .07, .92));
	};
	onPointerUp = (event) => {
		if (event.pointerId !== this.pointerId || !this.canvas || !this.draggedTarget) return;
		event.preventDefault();
		event.stopImmediatePropagation();
		const target = this.draggedTarget;
		window.clearTimeout(this.dragHoldTimer);
		this.dragHoldTimer = 0;
		const wasDragging = target.isDragging;
		const moved = target.screenPosition.distanceTo(this.dragStartScreenPosition) > DRAG_POSITION_EPSILON;
		target.isDragging = false;
		if (wasDragging && moved) {
			target.settleSoftDeformForDrop();
			target.beginDrop();
		} else if (wasDragging) target.settleSoftDeformForDrop();
		this.suppressClick = true;
		this.pointerId = null;
		this.draggedTarget = null;
		this.canvas.classList.remove("dragging-appliance");
		try {
			this.canvas.releasePointerCapture(event.pointerId);
		} catch {}
	};
	onPointerCancel = (event) => {
		if (event.pointerId !== this.pointerId) return;
		event.stopImmediatePropagation();
		window.clearTimeout(this.dragHoldTimer);
		this.dragHoldTimer = 0;
		if (this.draggedTarget) {
			this.draggedTarget.isDragging = false;
			this.draggedTarget.releaseSoftDeform();
		}
		this.pointerId = null;
		this.draggedTarget = null;
		this.canvas?.classList.remove("dragging-appliance");
	};
	onClickCapture = (event) => {
		if (!this.suppressClick) return;
		this.suppressClick = false;
		event.preventDefault();
		event.stopImmediatePropagation();
	};
	isAssignableTarget(target) {
		return target.root.visible && target.state === "idle" && !target.isLifecycleTransitioning && !target.isConnecting;
	}
	assignmentCandidates(color) {
		const routedColor = this.colorRoutingAliases.get(color) ?? color;
		return this.targets.filter((target) => target.accent === routedColor && target.state === "idle" && this.isAssignableTarget(target));
	}
	syncRoutingRevision() {
		const targetSignature = this.targets.map((target) => [
			target.root.uuid,
			target.accent,
			target.root.visible ? 1 : 0,
			target.isLifecycleTransitioning ? 1 : 0,
			target.isConnecting ? 1 : 0
		].join(":")).join("|");
		const aliasSignature = [...this.colorRoutingAliases].map(([color, routedColor]) => `${color}:${routedColor}`).join(",");
		const signature = `${[...this.requiredColors].join(",")}#${targetSignature}#${aliasSignature}`;
		if (signature === this.routingStateSignature) return;
		this.routingStateSignature = signature;
		this.routingStateRevision += 1;
	}
};
//#endregion
export { setCableSkillRecolor as A, PLUG_HEAD_MAX_LENGTH as B, createCableToonMaterial as C, setCableFreeze as D, setCableCoffeeStain as E, DIRECTION_VECTORS as F, STATIC_PLUG_CLEARANCE as G, PLUG_HEAD_PIN_CLEARANCE as H, EXIT_DISTANCE as I, CooperativeYieldBudget as J, cableSocketPointsToWorld as K, LANE_PITCH as L, ARROW_RADIUS as M, CABLE_TAIL_TERMINAL_LENGTH as N, setCableIceShell as O, COLLISION_RADIUS as P, PLUG_HEAD_BODY_CLEARANCE_LENGTH as R, createCableIceShellMaterial as S, createRoundedIceShellGeometry as T, PLUG_HEAD_PIN_RADIUS as U, PLUG_HEAD_MAX_RADIUS as V, STATIC_BODY_CLEARANCE as W, COFFEE_STAIN_COLOR as _, jellyDefaults as a, REFRIGERATOR_ICE_OPACITY as b, setJellyDynamics as c, applianceBodyBounds as d, PLUG_HEAD_ENVELOPE as f, CABLE_RADIUS as g, createPlugHead as h, getJellyFeel as i, setCableSkillSweep as j, setCableOverheat as k, setJellyFeel as l, PLUG_STYLE_LABELS as m, ApplianceTarget as n, jellyDynamics as o, PLUG_STYLE_IDS as p, directionKeyFromDelta as q, SoftDeformController as r, saveJellyDynamics as s, ApplianceScene as t, createApplianceModel as u, REFRIGERATOR_FREEZE_COLOR as v, createRoundedCableGeometry as w, REFRIGERATOR_SPIKE_OPACITY as x, REFRIGERATOR_ICE_COLOR as y, PLUG_HEAD_CLEARANCE as z };

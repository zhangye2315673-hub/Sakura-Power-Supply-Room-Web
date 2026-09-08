import { $ as Light, A as DodecahedronGeometry, Bn as SkinnedMesh, Cn as Raycaster, Dt as Object3D, E as DepthFormat, En as RepeatWrapping, Fn as ShaderMaterial, Ft as Points, Gn as Sprite, H as Group, Hn as SphereGeometry, Ht as RGBAFormat, I as ExtrudeGeometry, In as ShadowMaterial, It as Quaternion, J as InstancedMesh, Kn as SpriteMaterial, L as Float32BufferAttribute, Ln as Shape, M as EllipseCurve, Mn as SRGBColorSpace, Mt as Plane, N as Euler, Nt as PlaneGeometry, O as DepthTexture, Ot as OctahedronGeometry, Pn as Scene, Pt as PointLight, Qn as TubeGeometry, S as CylinderGeometry, St as MeshToonMaterial, T as DataTexture, U as HalfFloatType, Vn as Sphere, W as HemisphereLight, Xn as TorusGeometry, a as BufferAttribute, at as LinearFilter, bt as MeshPhysicalMaterial, c as CanvasTexture, d as CircleGeometry, dr as Vector3, dt as Material, et as Line, f as ClampToEdgeWrapping, ft as MathUtils, gt as MeshBasicMaterial, h as ConeGeometry, ht as Mesh, i as BoxGeometry, it as LineSegments, j as DynamicDrawUsage, jt as PerspectiveCamera, k as DirectionalLight, kt as OrthographicCamera, l as CapsuleGeometry, mr as WebGLRenderTarget, mt as Matrix4, nr as UnsignedByteType, o as BufferGeometry, or as UnsignedIntType, p as Color, pt as Matrix3, r as Box3, rt as LineLoop, tr as UniformsUtils, u as CatmullRomCurve3, ur as Vector2, wt as NearestFilter, z as Fog } from "./three.core-DlTOC7bx.js";
import { n as PAL, s as WebGLRenderer, t as ARROW_COLORS } from "./palette-CaCEpJJd.js";
import { t as ThemeController } from "./game-CPZQS0u8.js";
import { a as renderSkillCardSymbol, c as pickPrinterCopyCableId, i as getSkillCardStyle, n as getApplianceCardLabel, o as APPLIANCE_SKILL_REGISTRY, s as SkillChallengeEngine, t as GACHA_TIER_LABELS } from "./SkillCardPresentation-DHqhExU7.js";
import { i as selectTutorialAppliances, t as APPLIANCE_CATALOG } from "./ApplianceCatalog-2_-hlaHk.js";
import { E as installJellyEnvironment, S as poweredPreviewCycleDuration, T as cableJelly, _ as POWERED_ACTIVE_DURATION, i as RoundedBoxGeometry, l as PORTABLE_SPEAKER_ACTIVE_DURATION, t as mergeGeometries, u as PORTABLE_SPEAKER_BASS_BEATS, v as PRINTER_POWERED_ACTIVE_DURATION, x as poweredAnimationState, y as WASHER_POWERED_ACTIVE_DURATION } from "./BufferGeometryUtils-Bf_-bT2g.js";
import { C as OrbitControls, S as createLampVolumetricBeam, a as createSummerLeafGeometry, b as LAMP_BEAM_FAR_TO_NEAR_RATIO, c as SEASON_PROFILES, d as lerpEnvironmentState, f as AppliancePerformanceSystem, g as TELEVISION_RAPID_SWITCH_TIMES, h as TELEVISION_INITIAL_SWITCHES, i as createSeasonParticleMaterial, l as cloneEnvironmentState, m as createSakuraPetalMaterial, n as createAutumnLeafGeometry, o as createWinterSnowGeometry, p as createSakuraPetalGeometry, r as createFireflyGeometry, s as SEASON_MODES, t as PetalField, u as isSeasonMode, x as LAMP_BEAM_SOURCE_RADIUS_LOCAL, y as LAMP_BEAM_DEFAULT_LENGTH_LOCAL } from "./PetalField-DFT0OWiW.js";
import { n as cel, t as SkillPresentationController } from "./SkillPresentationController-D9rBle5u.js";
import { a as setHullOutlineStyle, c as markSharedResource, n as setHullOutlineReveal, o as setOutlineResolution, r as setHullOutlineRootFade, s as disposeOwnedResource, t as addHullOutline } from "./outline-Brkgge31.js";
import { A as setCableSkillSweep, B as PLUG_HEAD_MAX_RADIUS, C as createRoundedCableGeometry, D as setCableIceShell, E as setCableFreeze, F as EXIT_DISTANCE, G as cableSocketPointsToWorld, H as PLUG_HEAD_PIN_RADIUS, I as LANE_PITCH, K as directionKeyFromDelta, L as PLUG_HEAD_BODY_CLEARANCE_LENGTH, M as CABLE_TAIL_TERMINAL_LENGTH, N as COLLISION_RADIUS, O as setCableOverheat, P as DIRECTION_VECTORS, R as PLUG_HEAD_CLEARANCE, S as createCableToonMaterial, T as setCableCoffeeStain, U as STATIC_BODY_CLEARANCE, V as PLUG_HEAD_PIN_CLEARANCE, W as STATIC_PLUG_CLEARANCE, _ as REFRIGERATOR_FREEZE_COLOR, a as jellyDefaults, b as REFRIGERATOR_SPIKE_OPACITY, c as setJellyDynamics, d as PLUG_HEAD_ENVELOPE, g as COFFEE_STAIN_COLOR, h as CABLE_RADIUS, i as getJellyFeel, j as ARROW_RADIUS, k as setCableSkillRecolor, l as setJellyFeel, m as createPlugHead, o as jellyDynamics, q as CooperativeYieldBudget, r as SoftDeformController, s as saveJellyDynamics, t as ApplianceScene, u as createApplianceModel, v as REFRIGERATOR_ICE_COLOR, w as createRoundedIceShellGeometry, x as createCableIceShellMaterial, y as REFRIGERATOR_ICE_OPACITY, z as PLUG_HEAD_MAX_LENGTH } from "./ApplianceScene-CRNGlMGl.js";
//#region src/core/Loop.ts
var Loop = class {
	update;
	render;
	frameId = 0;
	lastTime = 0;
	running = false;
	constructor(update, render) {
		this.update = update;
		this.render = render;
	}
	start() {
		if (this.running) return;
		this.running = true;
		this.lastTime = performance.now();
		this.frameId = requestAnimationFrame(this.tick);
	}
	stop() {
		this.running = false;
		cancelAnimationFrame(this.frameId);
	}
	tick = (time) => {
		if (!this.running) return;
		const deltaSeconds = Math.min((time - this.lastTime) / 1e3, .05);
		this.lastTime = time;
		this.update(deltaSeconds, time / 1e3);
		this.render();
		this.frameId = requestAnimationFrame(this.tick);
	};
};
//#endregion
//#region src/puzzle/collision.ts
var SPATIAL_CELL_SIZE = COLLISION_RADIUS * 2;
var SPATIAL_KEY_OFFSET = 128;
var SPATIAL_KEY_STRIDE = 256;
function spatialCoordinate(value) {
	return Math.floor(value / SPATIAL_CELL_SIZE);
}
function spatialKey(x, y, z) {
	return (x + SPATIAL_KEY_OFFSET) * SPATIAL_KEY_STRIDE * SPATIAL_KEY_STRIDE + (y + SPATIAL_KEY_OFFSET) * SPATIAL_KEY_STRIDE + z + SPATIAL_KEY_OFFSET;
}
function sampleArrowPath(definition) {
	const points = [];
	const spacing = LANE_PITCH * .2;
	const socketPoints = cableSocketPointsToWorld(definition);
	for (let index = 0; index < definition.path.length - 1; index += 1) {
		const start = socketPoints[index];
		const end = socketPoints[index + 1];
		const distance = start.distanceTo(end);
		const steps = Math.max(2, Math.ceil(distance / spacing));
		for (let step = 0; step <= steps; step += 1) {
			if (index > 0 && step === 0) continue;
			points.push(start.clone().lerp(end, step / steps));
		}
	}
	return points;
}
function makeRuntime(definition) {
	return {
		definition,
		samplePoints: sampleArrowPath(definition),
		state: "idle"
	};
}
function cableEndsFor(definition) {
	return definition.doubleEnded ? ["head", "tail"] : ["head"];
}
function cableEndDirection(definition, end) {
	if (end === "head") return definition.exitDirection;
	const start = definition.path[0];
	const next = definition.path[1];
	return directionKeyFromDelta([
		Math.sign(start[0] - next[0]),
		Math.sign(start[1] - next[1]),
		Math.sign(start[2] - next[2])
	]);
}
function checkCableEndExit(candidate, arrows, end) {
	return checkCableEndAgainstSharedIndex(candidate, end, buildSharedBlockerIndex(arrows));
}
function buildSharedBlockerIndex(arrows) {
	const blockerCells = /* @__PURE__ */ new Map();
	for (const other of arrows) {
		if (other.state === "removed" || other.state === "moving") continue;
		for (const point of other.samplePoints) {
			const key = spatialKey(spatialCoordinate(point.x), spatialCoordinate(point.y), spatialCoordinate(point.z));
			const cell = blockerCells.get(key);
			const spatialPoint = {
				arrowId: other.definition.id,
				point
			};
			if (cell) cell.push(spatialPoint);
			else blockerCells.set(key, [spatialPoint]);
		}
	}
	return blockerCells;
}
function checkCableEndAgainstSharedIndex(candidate, end, blockerCells) {
	const direction = DIRECTION_VECTORS[cableEndDirection(candidate.definition, end)];
	const collisionDistanceSq = (COLLISION_RADIUS * 2) ** 2;
	const stepSize = LANE_PITCH * .17;
	const headPoint = end === "head" ? candidate.samplePoints[candidate.samplePoints.length - 1] : candidate.samplePoints[0];
	const adjacentBodyPoints = ownAdjacentBodyPoints(candidate, end, stepSize + COLLISION_RADIUS * 2);
	const movingPoint = new Vector3();
	for (let distance = stepSize; distance <= EXIT_DISTANCE; distance += stepSize) {
		movingPoint.copy(headPoint).addScaledVector(direction, distance);
		const cellX = spatialCoordinate(movingPoint.x);
		const cellY = spatialCoordinate(movingPoint.y);
		const cellZ = spatialCoordinate(movingPoint.z);
		for (let offsetX = -1; offsetX <= 1; offsetX += 1) for (let offsetY = -1; offsetY <= 1; offsetY += 1) for (let offsetZ = -1; offsetZ <= 1; offsetZ += 1) {
			const blocker = blockerCells.get(spatialKey(cellX + offsetX, cellY + offsetY, cellZ + offsetZ))?.find((candidateBlocker) => {
				if (movingPoint.distanceToSquared(candidateBlocker.point) >= collisionDistanceSq) return false;
				if (candidateBlocker.arrowId !== candidate.definition.id) return true;
				return !adjacentBodyPoints.has(candidateBlocker.point);
			});
			if (blocker) return {
				clear: false,
				blockerId: blocker.arrowId,
				contact: movingPoint.clone()
			};
		}
	}
	return {
		clear: true,
		blockerId: null,
		contact: null
	};
}
function ownAdjacentBodyPoints(candidate, end, clearance) {
	const points = end === "head" ? [...candidate.samplePoints].reverse() : candidate.samplePoints;
	const adjacent = /* @__PURE__ */ new Set();
	let travelled = 0;
	for (let index = 0; index < points.length; index += 1) {
		if (index > 0) travelled += points[index - 1].distanceTo(points[index]);
		if (travelled > clearance) break;
		adjacent.add(points[index]);
	}
	return adjacent;
}
function availableCableEnds(runtimes) {
	const available = [];
	const blockerIndex = buildSharedBlockerIndex(runtimes);
	for (const runtime of runtimes) {
		if (runtime.state !== "idle") continue;
		for (const end of cableEndsFor(runtime.definition)) if (checkCableEndAgainstSharedIndex(runtime, end, blockerIndex).clear) available.push({
			id: runtime.definition.id,
			end
		});
	}
	return available;
}
function findRemovalSequence(definitions) {
	const runtimes = definitions.map(makeRuntime);
	const runtimesById = new Map(runtimes.map((runtime) => [runtime.definition.id, runtime]));
	const sequence = [];
	while (sequence.length < runtimes.length) {
		const removableEnd = availableCableEnds(runtimes).find(({ end }) => end === "head");
		if (!removableEnd) return null;
		const removable = runtimesById.get(removableEnd.id);
		if (!removable) return null;
		removable.state = "removed";
		sequence.push(removableEnd.id);
	}
	return sequence;
}
//#endregion
//#region src/puzzle/geometryValidation.ts
function segmentsFor(definition) {
	const socketPoints = cableSocketPointsToWorld(definition);
	return socketPoints.slice(0, -1).map((point, index) => ({
		start: point,
		end: socketPoints[index + 1],
		index
	}));
}
function pointSegmentDistanceSq(point, start, end) {
	const delta = end.clone().sub(start);
	const lengthSq = delta.lengthSq();
	if (lengthSq <= 1e-9) return point.distanceToSquared(start);
	const t = MathUtils.clamp(point.clone().sub(start).dot(delta) / lengthSq, 0, 1);
	return point.distanceToSquared(start.clone().addScaledVector(delta, t));
}
function segmentDistanceSq$1(a, b) {
	const u = a.end.clone().sub(a.start);
	const v = b.end.clone().sub(b.start);
	const w = a.start.clone().sub(b.start);
	const aa = u.dot(u);
	const bb = u.dot(v);
	const cc = v.dot(v);
	const dd = u.dot(w);
	const ee = v.dot(w);
	const denominator = aa * cc - bb * bb;
	let sNumerator = denominator;
	let sDenominator = denominator;
	let tNumerator = denominator;
	let tDenominator = denominator;
	if (denominator < 1e-9) {
		sNumerator = 0;
		sDenominator = 1;
		tNumerator = ee;
		tDenominator = cc;
	} else {
		sNumerator = bb * ee - cc * dd;
		tNumerator = aa * ee - bb * dd;
		if (sNumerator < 0) {
			sNumerator = 0;
			tNumerator = ee;
			tDenominator = cc;
		} else if (sNumerator > sDenominator) {
			sNumerator = sDenominator;
			tNumerator = ee + bb;
			tDenominator = cc;
		}
	}
	if (tNumerator < 0) {
		tNumerator = 0;
		if (-dd < 0) sNumerator = 0;
		else if (-dd > aa) sNumerator = sDenominator;
		else {
			sNumerator = -dd;
			sDenominator = aa;
		}
	} else if (tNumerator > tDenominator) {
		tNumerator = tDenominator;
		if (-dd + bb < 0) sNumerator = 0;
		else if (-dd + bb > aa) sNumerator = sDenominator;
		else {
			sNumerator = -dd + bb;
			sDenominator = aa;
		}
	}
	const sc = Math.abs(sNumerator) < 1e-9 ? 0 : sNumerator / sDenominator;
	const tc = Math.abs(tNumerator) < 1e-9 ? 0 : tNumerator / tDenominator;
	return w.addScaledVector(u, sc).addScaledVector(v, -tc).lengthSq();
}
function gridSegmentKey(start, end) {
	const a = start.join(",");
	const b = end.join(",");
	return a < b ? `${a}>${b}` : `${b}>${a}`;
}
function expandUnitEdges(definition) {
	const keys = [];
	for (let index = 0; index < definition.path.length - 1; index += 1) {
		const start = definition.path[index];
		const end = definition.path[index + 1];
		const delta = [
			Math.sign(end[0] - start[0]),
			Math.sign(end[1] - start[1]),
			Math.sign(end[2] - start[2])
		];
		const length = Math.abs(end[0] - start[0]) + Math.abs(end[1] - start[1]) + Math.abs(end[2] - start[2]);
		for (let step = 0; step < length; step += 1) {
			const a = [
				start[0] + delta[0] * step,
				start[1] + delta[1] * step,
				start[2] + delta[2] * step
			];
			const b = [
				a[0] + delta[0],
				a[1] + delta[1],
				a[2] + delta[2]
			];
			keys.push(gridSegmentKey(a, b));
		}
	}
	return keys;
}
var PLUG_BODY_RADIUS = PLUG_HEAD_MAX_RADIUS;
var PLUG_CONTACT_RADIUS = PLUG_HEAD_PIN_RADIUS + PLUG_HEAD_PIN_CLEARANCE;
PLUG_BODY_RADIUS + ARROW_RADIUS + .07;
function plugEnvelope(definition, end = "head") {
	const endpointIndex = end === "head" ? definition.path.length - 1 : 0;
	const head = cableSocketPointsToWorld(definition)[endpointIndex];
	const directionKey = end === "head" ? definition.exitDirection : directionKeyFromDelta([
		Math.sign(definition.path[0][0] - definition.path[1][0]),
		Math.sign(definition.path[0][1] - definition.path[1][1]),
		Math.sign(definition.path[0][2] - definition.path[1][2])
	]);
	const direction = DIRECTION_VECTORS[directionKey];
	return {
		body: {
			start: head,
			end: head.clone().addScaledVector(direction, PLUG_HEAD_BODY_CLEARANCE_LENGTH),
			index: -1
		},
		contacts: {
			start: head.clone().addScaledVector(direction, PLUG_HEAD_BODY_CLEARANCE_LENGTH * .88),
			end: head.clone().addScaledVector(direction, PLUG_HEAD_MAX_LENGTH),
			index: -2
		}
	};
}
function plugEnvelopes(definition) {
	return definition.doubleEnded ? [plugEnvelope(definition, "head"), plugEnvelope(definition, "tail")] : [plugEnvelope(definition, "head")];
}
function nonAdjacentSegmentsForPlug(segments, end) {
	if (segments.length === 0) return [];
	const ordered = end === "head" ? [...segments].reverse() : [...segments];
	const feedDirection = ordered[0].end.clone().sub(ordered[0].start).normalize();
	const adjacentIndices = /* @__PURE__ */ new Set();
	for (const segment of ordered) {
		const direction = segment.end.clone().sub(segment.start).normalize();
		if (Math.abs(direction.dot(feedDirection)) < .999) break;
		adjacentIndices.add(segment.index);
	}
	return segments.filter((segment) => !adjacentIndices.has(segment.index));
}
function envelopeAgainstBodyIsClear(envelope, segment) {
	const bodyClearance = PLUG_BODY_RADIUS + ARROW_RADIUS + PLUG_HEAD_CLEARANCE;
	const contactClearance = PLUG_CONTACT_RADIUS + ARROW_RADIUS + PLUG_HEAD_CLEARANCE;
	return segmentDistanceSq$1(envelope.body, segment) >= bodyClearance ** 2 && segmentDistanceSq$1(envelope.contacts, segment) >= contactClearance ** 2;
}
function envelopesAreClear(a, b) {
	const bodyBody = PLUG_BODY_RADIUS * 2 + PLUG_HEAD_CLEARANCE;
	const bodyContact = PLUG_BODY_RADIUS + PLUG_CONTACT_RADIUS + PLUG_HEAD_CLEARANCE;
	const contactContact = PLUG_CONTACT_RADIUS * 2 + PLUG_HEAD_CLEARANCE;
	return segmentDistanceSq$1(a.body, b.body) >= bodyBody ** 2 && segmentDistanceSq$1(a.body, b.contacts) >= bodyContact ** 2 && segmentDistanceSq$1(a.contacts, b.body) >= bodyContact ** 2 && segmentDistanceSq$1(a.contacts, b.contacts) >= contactContact ** 2;
}
function validatePuzzleGeometry(definitions) {
	const issues = [];
	const bodyClearanceSq = STATIC_BODY_CLEARANCE ** 2;
	const plugClearanceSq = STATIC_PLUG_CLEARANCE ** 2;
	const segmentCatalog = definitions.map((definition) => segmentsFor(definition));
	const edgeOwners = /* @__PURE__ */ new Map();
	definitions.forEach((definition, arrowIndex) => {
		for (let index = 0; index < definition.path.length - 1; index += 1) {
			const start = definition.path[index];
			const end = definition.path[index + 1];
			if ([
				0,
				1,
				2
			].filter((axis) => start[axis] !== end[axis]).length !== 1) issues.push({
				kind: "invalid-segment",
				arrowId: definition.id
			});
		}
		for (const edge of expandUnitEdges(definition)) {
			const owner = edgeOwners.get(edge);
			if (owner) issues.push({
				kind: "shared-lane",
				arrowId: definition.id,
				otherArrowId: owner
			});
			else edgeOwners.set(edge, definition.id);
		}
		const ownSegments = segmentCatalog[arrowIndex];
		for (let left = 0; left < ownSegments.length; left += 1) for (let right = left + 2; right < ownSegments.length; right += 1) {
			const distanceSq = segmentDistanceSq$1(ownSegments[left], ownSegments[right]);
			if (distanceSq < bodyClearanceSq) issues.push({
				kind: "self-overlap",
				arrowId: definition.id,
				distance: Math.sqrt(distanceSq)
			});
		}
		const ownPlugs = plugEnvelopes(definition);
		ownPlugs.forEach((ownPlug, plugIndex) => {
			const nonAdjacentSegments = nonAdjacentSegmentsForPlug(ownSegments, plugIndex === 0 ? "head" : "tail");
			for (const segment of nonAdjacentSegments) {
				if (envelopeAgainstBodyIsClear(ownPlug, segment)) continue;
				const distanceSq = Math.min(segmentDistanceSq$1(ownPlug.body, segment), segmentDistanceSq$1(ownPlug.contacts, segment));
				issues.push({
					kind: "self-plug-overlap",
					arrowId: definition.id,
					distance: Math.sqrt(distanceSq)
				});
			}
		});
		if (definition.doubleEnded && !envelopesAreClear(ownPlugs[0], ownPlugs[1])) issues.push({
			kind: "head-tail-overlap",
			arrowId: definition.id
		});
		const tail = cableSocketPointsToWorld(definition)[0];
		const headTailDistanceSq = pointSegmentDistanceSq(tail, ownPlugs[0].body.start, ownPlugs[0].contacts.end);
		if (!definition.doubleEnded && headTailDistanceSq < plugClearanceSq) issues.push({
			kind: "head-tail-overlap",
			arrowId: definition.id,
			distance: Math.sqrt(headTailDistanceSq)
		});
	});
	for (let left = 0; left < definitions.length; left += 1) for (let right = left + 1; right < definitions.length; right += 1) {
		const leftDefinition = definitions[left];
		const rightDefinition = definitions[right];
		for (const a of segmentCatalog[left]) for (const b of segmentCatalog[right]) {
			const distanceSq = segmentDistanceSq$1(a, b);
			if (distanceSq < bodyClearanceSq) issues.push({
				kind: "body-overlap",
				arrowId: leftDefinition.id,
				otherArrowId: rightDefinition.id,
				distance: Math.sqrt(distanceSq)
			});
		}
		const leftPlugs = plugEnvelopes(leftDefinition);
		const rightPlugs = plugEnvelopes(rightDefinition);
		for (const leftPlug of leftPlugs) for (const segment of segmentCatalog[right]) {
			if (envelopeAgainstBodyIsClear(leftPlug, segment)) continue;
			const distanceSq = Math.min(segmentDistanceSq$1(leftPlug.body, segment), segmentDistanceSq$1(leftPlug.contacts, segment));
			issues.push({
				kind: "plug-overlap",
				arrowId: leftDefinition.id,
				otherArrowId: rightDefinition.id,
				distance: Math.sqrt(distanceSq)
			});
		}
		for (const rightPlug of rightPlugs) for (const segment of segmentCatalog[left]) {
			if (envelopeAgainstBodyIsClear(rightPlug, segment)) continue;
			const distanceSq = Math.min(segmentDistanceSq$1(rightPlug.body, segment), segmentDistanceSq$1(rightPlug.contacts, segment));
			issues.push({
				kind: "plug-overlap",
				arrowId: rightDefinition.id,
				otherArrowId: leftDefinition.id,
				distance: Math.sqrt(distanceSq)
			});
		}
		for (const leftPlug of leftPlugs) for (const rightPlug of rightPlugs) {
			if (envelopesAreClear(leftPlug, rightPlug)) continue;
			const plugDistanceSq = Math.min(segmentDistanceSq$1(leftPlug.body, rightPlug.body), segmentDistanceSq$1(leftPlug.body, rightPlug.contacts), segmentDistanceSq$1(leftPlug.contacts, rightPlug.body), segmentDistanceSq$1(leftPlug.contacts, rightPlug.contacts));
			issues.push({
				kind: "plug-overlap",
				arrowId: leftDefinition.id,
				otherArrowId: rightDefinition.id,
				distance: Math.sqrt(plugDistanceSq)
			});
		}
	}
	return issues;
}
function geometryIsClear(definitions) {
	return validatePuzzleGeometry(definitions).length === 0;
}
//#endregion
//#region src/puzzle/generator.ts
function createRandomSeed() {
	const cryptoSeed = /* @__PURE__ */ new Uint32Array(1);
	crypto.getRandomValues(cryptoSeed);
	return cryptoSeed[0] || Date.now() >>> 0;
}
//#endregion
//#region src/puzzle/rushLayouts.generated.ts
var RUSH_LAYOUTS = {
	"rush-01": {
		"arrows": [
			{
				"id": "arrow-1",
				"path": [
					[
						4,
						5,
						1
					],
					[
						4,
						4,
						1
					],
					[
						2,
						4,
						1
					],
					[
						2,
						6,
						1
					],
					[
						2,
						6,
						0
					]
				],
				"exitDirection": "-Z",
				"color": 3120282,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-2",
				"path": [
					[
						2,
						2,
						2
					],
					[
						2,
						2,
						0
					],
					[
						2,
						4,
						0
					],
					[
						4,
						4,
						0
					]
				],
				"exitDirection": "+X",
				"color": 15770560,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-3",
				"path": [
					[
						4,
						3,
						2
					],
					[
						4,
						3,
						0
					],
					[
						6,
						3,
						0
					],
					[
						6,
						4,
						0
					],
					[
						6,
						4,
						1
					]
				],
				"exitDirection": "+Z",
				"color": 14704481,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-4",
				"path": [
					[
						5,
						4,
						1
					],
					[
						5,
						3,
						1
					],
					[
						5,
						3,
						3
					],
					[
						5,
						4,
						3
					],
					[
						7,
						4,
						3
					]
				],
				"exitDirection": "+X",
				"color": 9400245,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-5",
				"path": [
					[
						2,
						1,
						1
					],
					[
						2,
						1,
						2
					],
					[
						3,
						1,
						2
					],
					[
						3,
						0,
						2
					]
				],
				"exitDirection": "-Y",
				"color": 16039987,
				"lengthClass": "short"
			},
			{
				"id": "arrow-6",
				"path": [
					[
						7,
						3,
						3
					],
					[
						9,
						3,
						3
					],
					[
						9,
						4,
						3
					],
					[
						9,
						4,
						4
					]
				],
				"exitDirection": "+Z",
				"color": 6661503,
				"lengthClass": "short"
			},
			{
				"id": "arrow-7",
				"path": [
					[
						9,
						3,
						4
					],
					[
						9,
						3,
						6
					],
					[
						9,
						4,
						6
					],
					[
						9,
						4,
						7
					]
				],
				"exitDirection": "+Z",
				"color": 4946377,
				"lengthClass": "short"
			},
			{
				"id": "arrow-8",
				"path": [
					[
						10,
						4,
						7
					],
					[
						10,
						4,
						9
					],
					[
						9,
						4,
						9
					],
					[
						9,
						3,
						9
					]
				],
				"exitDirection": "-Y",
				"color": 15698492,
				"lengthClass": "short"
			},
			{
				"id": "arrow-9",
				"path": [
					[
						9,
						5,
						7
					],
					[
						9,
						5,
						6
					],
					[
						9,
						7,
						6
					],
					[
						8,
						7,
						6
					]
				],
				"exitDirection": "-X",
				"color": 3120282,
				"lengthClass": "short"
			},
			{
				"id": "arrow-10",
				"path": [
					[
						2,
						2,
						3
					],
					[
						2,
						3,
						3
					],
					[
						2,
						3,
						2
					],
					[
						2,
						4,
						2
					]
				],
				"exitDirection": "+Y",
				"color": 15770560,
				"lengthClass": "short"
			},
			{
				"id": "arrow-11",
				"path": [
					[
						3,
						5,
						1
					],
					[
						3,
						6,
						1
					],
					[
						3,
						6,
						2
					],
					[
						1,
						6,
						2
					]
				],
				"exitDirection": "-X",
				"color": 14704481,
				"lengthClass": "short"
			},
			{
				"id": "arrow-12",
				"path": [
					[
						8,
						8,
						6
					],
					[
						6,
						8,
						6
					],
					[
						6,
						6,
						6
					]
				],
				"exitDirection": "-Y",
				"color": 9400245,
				"lengthClass": "short"
			},
			{
				"id": "arrow-13",
				"path": [
					[
						7,
						4,
						4
					],
					[
						7,
						4,
						6
					],
					[
						6,
						4,
						6
					],
					[
						6,
						4,
						7
					]
				],
				"exitDirection": "+Z",
				"color": 16039987,
				"lengthClass": "short"
			},
			{
				"id": "arrow-14",
				"path": [
					[
						9,
						6,
						5
					],
					[
						9,
						6,
						4
					],
					[
						9,
						5,
						4
					],
					[
						10,
						5,
						4
					]
				],
				"exitDirection": "+X",
				"color": 6661503,
				"lengthClass": "short"
			},
			{
				"id": "arrow-15",
				"path": [
					[
						8,
						4,
						8
					],
					[
						8,
						4,
						9
					],
					[
						6,
						4,
						9
					],
					[
						6,
						3,
						9
					]
				],
				"exitDirection": "-Y",
				"color": 4946377,
				"lengthClass": "short"
			},
			{
				"id": "arrow-16",
				"path": [
					[
						10,
						3,
						8
					],
					[
						10,
						3,
						9
					],
					[
						10,
						1,
						9
					],
					[
						8,
						1,
						9
					]
				],
				"exitDirection": "-X",
				"color": 15698492,
				"lengthClass": "short"
			},
			{
				"id": "arrow-17",
				"path": [
					[
						5,
						8,
						7
					],
					[
						5,
						8,
						6
					],
					[
						5,
						6,
						6
					]
				],
				"exitDirection": "-Y",
				"color": 3120282,
				"lengthClass": "short"
			},
			{
				"id": "arrow-18",
				"path": [
					[
						6,
						3,
						7
					],
					[
						6,
						3,
						6
					],
					[
						4,
						3,
						6
					]
				],
				"exitDirection": "-X",
				"color": 15770560,
				"lengthClass": "short"
			},
			{
				"id": "arrow-19",
				"path": [
					[
						7,
						4,
						2
					],
					[
						7,
						3,
						2
					],
					[
						8,
						3,
						2
					],
					[
						8,
						3,
						1
					]
				],
				"exitDirection": "-Z",
				"color": 14704481,
				"lengthClass": "short"
			},
			{
				"id": "arrow-20",
				"path": [
					[
						6,
						3,
						10
					],
					[
						6,
						1,
						10
					],
					[
						6,
						1,
						9
					],
					[
						5,
						1,
						9
					]
				],
				"exitDirection": "-X",
				"color": 9400245,
				"lengthClass": "short"
			}
		],
		"solution": [
			"arrow-1",
			"arrow-5",
			"arrow-11",
			"arrow-10",
			"arrow-14",
			"arrow-18",
			"arrow-17",
			"arrow-19",
			"arrow-20",
			"arrow-15",
			"arrow-13",
			"arrow-12",
			"arrow-9",
			"arrow-16",
			"arrow-8",
			"arrow-7",
			"arrow-6",
			"arrow-4",
			"arrow-3",
			"arrow-2"
		],
		"initiallyFree": 7
	},
	"rush-02": {
		"arrows": [
			{
				"id": "arrow-1",
				"path": [
					[
						2,
						4,
						1
					],
					[
						2,
						4,
						2
					],
					[
						2,
						5,
						2
					],
					[
						2,
						5,
						4
					],
					[
						4,
						5,
						4
					]
				],
				"exitDirection": "+X",
				"color": 3120282,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-2",
				"path": [
					[
						4,
						6,
						2
					],
					[
						4,
						6,
						4
					],
					[
						6,
						6,
						4
					],
					[
						6,
						5,
						4
					],
					[
						8,
						5,
						4
					]
				],
				"exitDirection": "+X",
				"color": 14704481,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-3",
				"path": [
					[
						8,
						5,
						5
					],
					[
						8,
						4,
						5
					],
					[
						8,
						4,
						4
					],
					[
						10,
						4,
						4
					],
					[
						10,
						6,
						4
					]
				],
				"exitDirection": "+Y",
				"color": 15770560,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-4",
				"path": [
					[
						8,
						5,
						6
					],
					[
						7,
						5,
						6
					],
					[
						7,
						5,
						5
					],
					[
						5,
						5,
						5
					],
					[
						5,
						3,
						5
					]
				],
				"exitDirection": "-Y",
				"color": 6661503,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-5",
				"path": [
					[
						6,
						3,
						4
					],
					[
						5,
						3,
						4
					],
					[
						5,
						1,
						4
					],
					[
						5,
						1,
						5
					],
					[
						6,
						1,
						5
					]
				],
				"exitDirection": "+X",
				"color": 4946377,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-6",
				"path": [
					[
						10,
						3,
						4
					],
					[
						10,
						3,
						5
					],
					[
						10,
						1,
						5
					],
					[
						9,
						1,
						5
					],
					[
						9,
						1,
						6
					]
				],
				"exitDirection": "+Z",
				"color": 16039987,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-7",
				"path": [
					[
						2,
						4,
						4
					],
					[
						2,
						4,
						3
					],
					[
						2,
						3,
						3
					],
					[
						3,
						3,
						3
					]
				],
				"exitDirection": "+X",
				"color": 15698492,
				"lengthClass": "short"
			},
			{
				"id": "arrow-8",
				"path": [
					[
						6,
						4,
						4
					],
					[
						5,
						4,
						4
					],
					[
						5,
						4,
						3
					],
					[
						5,
						2,
						3
					]
				],
				"exitDirection": "-Y",
				"color": 9400245,
				"lengthClass": "short"
			},
			{
				"id": "arrow-9",
				"path": [
					[
						5,
						7,
						4
					],
					[
						3,
						7,
						4
					],
					[
						3,
						7,
						2
					],
					[
						3,
						8,
						2
					]
				],
				"exitDirection": "+Y",
				"color": 3120282,
				"lengthClass": "short"
			},
			{
				"id": "arrow-10",
				"path": [
					[
						4,
						0,
						2
					],
					[
						4,
						0,
						3
					],
					[
						5,
						0,
						3
					],
					[
						5,
						0,
						4
					]
				],
				"exitDirection": "+Z",
				"color": 14704481,
				"lengthClass": "short"
			},
			{
				"id": "arrow-11",
				"path": [
					[
						3,
						4,
						2
					],
					[
						3,
						4,
						4
					],
					[
						4,
						4,
						4
					],
					[
						4,
						4,
						5
					]
				],
				"exitDirection": "+Z",
				"color": 15770560,
				"lengthClass": "short"
			},
			{
				"id": "arrow-12",
				"path": [
					[
						5,
						1,
						6
					],
					[
						5,
						0,
						6
					],
					[
						5,
						0,
						8
					],
					[
						5,
						1,
						8
					]
				],
				"exitDirection": "+Y",
				"color": 6661503,
				"lengthClass": "short"
			},
			{
				"id": "arrow-13",
				"path": [
					[
						5,
						4,
						6
					],
					[
						5,
						5,
						6
					],
					[
						5,
						5,
						8
					],
					[
						6,
						5,
						8
					]
				],
				"exitDirection": "+X",
				"color": 4946377,
				"lengthClass": "short"
			},
			{
				"id": "arrow-14",
				"path": [
					[
						7,
						6,
						6
					],
					[
						7,
						6,
						5
					],
					[
						7,
						7,
						5
					],
					[
						6,
						7,
						5
					]
				],
				"exitDirection": "-X",
				"color": 16039987,
				"lengthClass": "short"
			},
			{
				"id": "arrow-15",
				"path": [
					[
						4,
						5,
						7
					],
					[
						4,
						5,
						8
					],
					[
						4,
						4,
						8
					],
					[
						3,
						4,
						8
					]
				],
				"exitDirection": "-X",
				"color": 15698492,
				"lengthClass": "short"
			},
			{
				"id": "arrow-16",
				"path": [
					[
						5,
						5,
						2
					],
					[
						6,
						5,
						2
					],
					[
						6,
						5,
						3
					],
					[
						6,
						4,
						3
					]
				],
				"exitDirection": "-Y",
				"color": 9400245,
				"lengthClass": "short"
			},
			{
				"id": "arrow-17",
				"path": [
					[
						4,
						6,
						5
					],
					[
						4,
						7,
						5
					],
					[
						3,
						7,
						5
					],
					[
						3,
						8,
						5
					]
				],
				"exitDirection": "+Y",
				"color": 3120282,
				"lengthClass": "short"
			},
			{
				"id": "arrow-18",
				"path": [
					[
						6,
						1,
						2
					],
					[
						6,
						1,
						3
					],
					[
						6,
						0,
						3
					],
					[
						6,
						0,
						4
					]
				],
				"exitDirection": "+Z",
				"color": 14704481,
				"lengthClass": "short"
			},
			{
				"id": "arrow-19",
				"path": [
					[
						6,
						5,
						1
					],
					[
						6,
						6,
						1
					],
					[
						8,
						6,
						1
					]
				],
				"exitDirection": "+X",
				"color": 15770560,
				"lengthClass": "short"
			},
			{
				"id": "arrow-20",
				"path": [
					[
						7,
						5,
						7
					],
					[
						8,
						5,
						7
					],
					[
						8,
						5,
						8
					],
					[
						8,
						6,
						8
					]
				],
				"exitDirection": "+Y",
				"color": 6661503,
				"lengthClass": "short"
			},
			{
				"id": "arrow-21",
				"path": [
					[
						3,
						5,
						8
					],
					[
						3,
						5,
						6
					],
					[
						3,
						6,
						6
					]
				],
				"exitDirection": "+Y",
				"color": 4946377,
				"lengthClass": "short"
			},
			{
				"id": "arrow-22",
				"path": [
					[
						7,
						0,
						6
					],
					[
						6,
						0,
						6
					],
					[
						6,
						0,
						8
					],
					[
						7,
						0,
						8
					]
				],
				"exitDirection": "+X",
				"color": 16039987,
				"lengthClass": "short"
			}
		],
		"solution": [
			"arrow-3",
			"arrow-2",
			"arrow-1",
			"arrow-6",
			"arrow-5",
			"arrow-4",
			"arrow-9",
			"arrow-15",
			"arrow-11",
			"arrow-17",
			"arrow-14",
			"arrow-19",
			"arrow-20",
			"arrow-13",
			"arrow-12",
			"arrow-10",
			"arrow-8",
			"arrow-7",
			"arrow-21",
			"arrow-22",
			"arrow-18",
			"arrow-16"
		],
		"initiallyFree": 9
	},
	"rush-03": {
		"arrows": [
			{
				"id": "arrow-9",
				"path": [
					[
						1,
						5,
						5
					],
					[
						3,
						5,
						5
					],
					[
						3,
						6,
						5
					],
					[
						3,
						6,
						3
					]
				],
				"exitDirection": "-Z",
				"color": 15770560,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-10",
				"path": [
					[
						3,
						4,
						3
					],
					[
						3,
						4,
						1
					],
					[
						3,
						6,
						1
					],
					[
						4,
						6,
						1
					]
				],
				"exitDirection": "+X",
				"color": 14704481,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-11",
				"path": [
					[
						4,
						8,
						0
					],
					[
						4,
						6,
						0
					],
					[
						2,
						6,
						0
					],
					[
						2,
						4,
						0
					],
					[
						3,
						4,
						0
					]
				],
				"exitDirection": "+X",
				"color": 16039987,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-12",
				"path": [
					[
						2,
						1,
						2
					],
					[
						5,
						1,
						2
					],
					[
						5,
						3,
						2
					],
					[
						7,
						3,
						2
					],
					[
						7,
						3,
						0
					],
					[
						7,
						5,
						0
					]
				],
				"exitDirection": "+Y",
				"color": 15698492,
				"lengthClass": "long"
			},
			{
				"id": "arrow-13",
				"path": [
					[
						10,
						4,
						3
					],
					[
						10,
						6,
						3
					],
					[
						8,
						6,
						3
					],
					[
						8,
						8,
						3
					],
					[
						8,
						8,
						1
					],
					[
						8,
						5,
						1
					]
				],
				"exitDirection": "-Y",
				"color": 9400245,
				"lengthClass": "long"
			},
			{
				"id": "arrow-14",
				"path": [
					[
						3,
						4,
						6
					],
					[
						3,
						6,
						6
					],
					[
						3,
						6,
						8
					],
					[
						1,
						6,
						8
					]
				],
				"exitDirection": "-X",
				"color": 3120282,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-15",
				"path": [
					[
						5,
						5,
						0
					],
					[
						5,
						7,
						0
					],
					[
						7,
						7,
						0
					],
					[
						7,
						7,
						1
					]
				],
				"exitDirection": "+Z",
				"color": 6661503,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-16",
				"path": [
					[
						6,
						6,
						1
					],
					[
						7,
						6,
						1
					],
					[
						7,
						6,
						3
					],
					[
						7,
						8,
						3
					]
				],
				"exitDirection": "+Y",
				"color": 4946377,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-17",
				"path": [
					[
						8,
						3,
						2
					],
					[
						8,
						3,
						1
					],
					[
						8,
						2,
						1
					],
					[
						7,
						2,
						1
					]
				],
				"exitDirection": "-X",
				"color": 15770560,
				"lengthClass": "short"
			},
			{
				"id": "arrow-18",
				"path": [
					[
						4,
						3,
						4
					],
					[
						4,
						3,
						1
					],
					[
						4,
						1,
						1
					],
					[
						5,
						1,
						1
					],
					[
						5,
						3,
						1
					]
				],
				"exitDirection": "+Y",
				"color": 14704481,
				"lengthClass": "long"
			},
			{
				"id": "arrow-19",
				"path": [
					[
						3,
						8,
						2
					],
					[
						3,
						8,
						1
					],
					[
						3,
						7,
						1
					],
					[
						5,
						7,
						1
					],
					[
						5,
						7,
						2
					]
				],
				"exitDirection": "+Z",
				"color": 16039987,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-20",
				"path": [
					[
						3,
						8,
						3
					],
					[
						3,
						7,
						3
					],
					[
						3,
						7,
						5
					],
					[
						5,
						7,
						5
					],
					[
						5,
						7,
						7
					]
				],
				"exitDirection": "+Z",
				"color": 15698492,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-21",
				"path": [
					[
						6,
						6,
						7
					],
					[
						4,
						6,
						7
					],
					[
						4,
						6,
						9
					],
					[
						4,
						7,
						9
					],
					[
						6,
						7,
						9
					]
				],
				"exitDirection": "+X",
				"color": 9400245,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-22",
				"path": [
					[
						1,
						5,
						1
					],
					[
						1,
						4,
						1
					],
					[
						1,
						4,
						3
					]
				],
				"exitDirection": "+Z",
				"color": 3120282,
				"lengthClass": "short"
			},
			{
				"id": "arrow-23",
				"path": [
					[
						7,
						5,
						6
					],
					[
						4,
						5,
						6
					],
					[
						4,
						2,
						6
					],
					[
						1,
						2,
						6
					],
					[
						1,
						5,
						6
					]
				],
				"exitDirection": "+Y",
				"color": 6661503,
				"lengthClass": "long"
			},
			{
				"id": "arrow-24",
				"path": [
					[
						2,
						6,
						1
					],
					[
						2,
						8,
						1
					],
					[
						2,
						8,
						4
					],
					[
						0,
						8,
						4
					],
					[
						0,
						8,
						6
					],
					[
						2,
						8,
						6
					]
				],
				"exitDirection": "+X",
				"color": 4946377,
				"lengthClass": "long"
			},
			{
				"id": "arrow-25",
				"path": [
					[
						4,
						7,
						8
					],
					[
						4,
						7,
						6
					],
					[
						4,
						8,
						6
					],
					[
						5,
						8,
						6
					],
					[
						5,
						8,
						7
					]
				],
				"exitDirection": "+Z",
				"color": 15770560,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-26",
				"path": [
					[
						7,
						9,
						8
					],
					[
						6,
						9,
						8
					],
					[
						6,
						8,
						8
					],
					[
						6,
						8,
						9
					],
					[
						4,
						8,
						9
					]
				],
				"exitDirection": "-X",
				"color": 14704481,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-27",
				"path": [
					[
						8,
						7,
						9
					],
					[
						8,
						7,
						6
					],
					[
						8,
						10,
						6
					],
					[
						7,
						10,
						6
					],
					[
						7,
						10,
						3
					],
					[
						6,
						10,
						3
					]
				],
				"exitDirection": "-X",
				"color": 16039987,
				"lengthClass": "long"
			},
			{
				"id": "arrow-28",
				"path": [
					[
						1,
						7,
						5
					],
					[
						1,
						7,
						2
					],
					[
						4,
						7,
						2
					],
					[
						4,
						10,
						2
					],
					[
						4,
						10,
						4
					]
				],
				"exitDirection": "+Z",
				"color": 15698492,
				"lengthClass": "long"
			},
			{
				"id": "arrow-29",
				"path": [
					[
						8,
						8,
						4
					],
					[
						6,
						8,
						4
					],
					[
						6,
						10,
						4
					],
					[
						6,
						10,
						6
					],
					[
						3,
						10,
						6
					]
				],
				"exitDirection": "-X",
				"color": 9400245,
				"lengthClass": "long"
			},
			{
				"id": "arrow-30",
				"path": [
					[
						0,
						6,
						7
					],
					[
						2,
						6,
						7
					],
					[
						2,
						8,
						7
					],
					[
						2,
						8,
						9
					],
					[
						2,
						7,
						9
					]
				],
				"exitDirection": "-Y",
				"color": 3120282,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-31",
				"path": [
					[
						1,
						4,
						7
					],
					[
						1,
						5,
						7
					],
					[
						1,
						5,
						9
					],
					[
						2,
						5,
						9
					],
					[
						2,
						4,
						9
					]
				],
				"exitDirection": "-Y",
				"color": 6661503,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-32",
				"path": [
					[
						3,
						3,
						2
					],
					[
						3,
						3,
						4
					],
					[
						2,
						3,
						4
					],
					[
						2,
						2,
						4
					],
					[
						4,
						2,
						4
					]
				],
				"exitDirection": "+X",
				"color": 4946377,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-33",
				"path": [
					[
						6,
						0,
						2
					],
					[
						6,
						2,
						2
					],
					[
						6,
						2,
						4
					],
					[
						7,
						2,
						4
					]
				],
				"exitDirection": "+X",
				"color": 15770560,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-34",
				"path": [
					[
						7,
						3,
						6
					],
					[
						9,
						3,
						6
					],
					[
						9,
						3,
						4
					],
					[
						9,
						2,
						4
					],
					[
						9,
						2,
						3
					]
				],
				"exitDirection": "-Z",
				"color": 14704481,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-35",
				"path": [
					[
						5,
						9,
						3
					],
					[
						5,
						9,
						4
					],
					[
						3,
						9,
						4
					],
					[
						3,
						9,
						2
					]
				],
				"exitDirection": "-Z",
				"color": 16039987,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-36",
				"path": [
					[
						2,
						2,
						9
					],
					[
						3,
						2,
						9
					],
					[
						3,
						2,
						7
					],
					[
						1,
						2,
						7
					],
					[
						1,
						2,
						8
					]
				],
				"exitDirection": "+Z",
				"color": 15698492,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-37",
				"path": [
					[
						10,
						6,
						2
					],
					[
						10,
						4,
						2
					],
					[
						8,
						4,
						2
					],
					[
						8,
						4,
						5
					],
					[
						10,
						4,
						5
					],
					[
						10,
						4,
						7
					]
				],
				"exitDirection": "+Z",
				"color": 9400245,
				"lengthClass": "long"
			},
			{
				"id": "arrow-38",
				"path": [
					[
						4,
						2,
						7
					],
					[
						4,
						2,
						10
					],
					[
						6,
						2,
						10
					],
					[
						6,
						3,
						10
					],
					[
						4,
						3,
						10
					]
				],
				"exitDirection": "-X",
				"color": 3120282,
				"lengthClass": "long"
			},
			{
				"id": "arrow-39",
				"path": [
					[
						5,
						8,
						5
					],
					[
						7,
						8,
						5
					],
					[
						7,
						9,
						5
					],
					[
						7,
						9,
						4
					],
					[
						8,
						9,
						4
					]
				],
				"exitDirection": "+X",
				"color": 6661503,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-40",
				"path": [
					[
						1,
						8,
						7
					],
					[
						1,
						7,
						7
					],
					[
						0,
						7,
						7
					],
					[
						0,
						7,
						5
					],
					[
						0,
						6,
						5
					]
				],
				"exitDirection": "-Y",
				"color": 4946377,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-41",
				"path": [
					[
						1,
						2,
						5
					],
					[
						0,
						2,
						5
					],
					[
						0,
						2,
						6
					],
					[
						0,
						3,
						6
					],
					[
						0,
						3,
						4
					]
				],
				"exitDirection": "-Z",
				"color": 15770560,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-42",
				"path": [
					[
						4,
						4,
						8
					],
					[
						4,
						4,
						10
					],
					[
						6,
						4,
						10
					],
					[
						6,
						5,
						10
					]
				],
				"exitDirection": "+Y",
				"color": 14704481,
				"lengthClass": "medium"
			}
		],
		"solution": [
			"arrow-42",
			"arrow-41",
			"arrow-40",
			"arrow-39",
			"arrow-38",
			"arrow-37",
			"arrow-36",
			"arrow-35",
			"arrow-34",
			"arrow-33",
			"arrow-32",
			"arrow-31",
			"arrow-30",
			"arrow-29",
			"arrow-28",
			"arrow-27",
			"arrow-26",
			"arrow-25",
			"arrow-24",
			"arrow-23",
			"arrow-22",
			"arrow-21",
			"arrow-20",
			"arrow-19",
			"arrow-18",
			"arrow-17",
			"arrow-16",
			"arrow-15",
			"arrow-14",
			"arrow-13",
			"arrow-12",
			"arrow-11",
			"arrow-10",
			"arrow-9"
		],
		"initiallyFree": 10
	},
	"rush-04": {
		"arrows": [
			{
				"id": "arrow-9",
				"path": [
					[
						8,
						2,
						5
					],
					[
						7,
						2,
						5
					],
					[
						7,
						0,
						5
					],
					[
						7,
						0,
						3
					]
				],
				"exitDirection": "-Z",
				"color": 6661503,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-10",
				"path": [
					[
						4,
						0,
						8
					],
					[
						4,
						1,
						8
					],
					[
						2,
						1,
						8
					],
					[
						2,
						2,
						8
					],
					[
						2,
						2,
						6
					]
				],
				"exitDirection": "-Z",
				"color": 4946377,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-11",
				"path": [
					[
						10,
						9,
						4
					],
					[
						10,
						9,
						6
					],
					[
						10,
						8,
						6
					],
					[
						10,
						8,
						7
					],
					[
						10,
						7,
						7
					]
				],
				"exitDirection": "-Y",
				"color": 15770560,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-12",
				"path": [
					[
						5,
						3,
						5
					],
					[
						7,
						3,
						5
					],
					[
						7,
						3,
						8
					],
					[
						10,
						3,
						8
					],
					[
						10,
						4,
						8
					],
					[
						10,
						4,
						6
					]
				],
				"exitDirection": "-Z",
				"color": 14704481,
				"lengthClass": "long"
			},
			{
				"id": "arrow-13",
				"path": [
					[
						8,
						0,
						3
					],
					[
						8,
						0,
						5
					],
					[
						10,
						0,
						5
					],
					[
						10,
						2,
						5
					],
					[
						10,
						2,
						3
					],
					[
						10,
						5,
						3
					]
				],
				"exitDirection": "+Y",
				"color": 16039987,
				"lengthClass": "long"
			},
			{
				"id": "arrow-14",
				"path": [
					[
						8,
						5,
						4
					],
					[
						8,
						7,
						4
					],
					[
						10,
						7,
						4
					],
					[
						10,
						7,
						3
					],
					[
						9,
						7,
						3
					]
				],
				"exitDirection": "-X",
				"color": 9400245,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-15",
				"path": [
					[
						7,
						6,
						5
					],
					[
						6,
						6,
						5
					],
					[
						6,
						6,
						3
					],
					[
						5,
						6,
						3
					],
					[
						5,
						8,
						3
					]
				],
				"exitDirection": "+Y",
				"color": 15698492,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-16",
				"path": [
					[
						10,
						7,
						2
					],
					[
						7,
						7,
						2
					],
					[
						7,
						10,
						2
					],
					[
						7,
						10,
						3
					],
					[
						4,
						10,
						3
					]
				],
				"exitDirection": "-X",
				"color": 3120282,
				"lengthClass": "long"
			},
			{
				"id": "arrow-17",
				"path": [
					[
						5,
						5,
						9
					],
					[
						5,
						7,
						9
					],
					[
						5,
						7,
						10
					],
					[
						6,
						7,
						10
					],
					[
						6,
						6,
						10
					]
				],
				"exitDirection": "-Y",
				"color": 6661503,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-18",
				"path": [
					[
						6,
						4,
						9
					],
					[
						6,
						4,
						8
					],
					[
						9,
						4,
						8
					],
					[
						9,
						4,
						10
					],
					[
						6,
						4,
						10
					],
					[
						6,
						2,
						10
					]
				],
				"exitDirection": "-Y",
				"color": 4946377,
				"lengthClass": "long"
			},
			{
				"id": "arrow-19",
				"path": [
					[
						9,
						0,
						6
					],
					[
						9,
						1,
						6
					],
					[
						8,
						1,
						6
					],
					[
						8,
						1,
						7
					]
				],
				"exitDirection": "+Z",
				"color": 15770560,
				"lengthClass": "short"
			},
			{
				"id": "arrow-20",
				"path": [
					[
						8,
						3,
						7
					],
					[
						8,
						3,
						6
					],
					[
						8,
						5,
						6
					],
					[
						9,
						5,
						6
					],
					[
						9,
						5,
						4
					]
				],
				"exitDirection": "-Z",
				"color": 14704481,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-21",
				"path": [
					[
						4,
						5,
						3
					],
					[
						4,
						5,
						6
					],
					[
						4,
						2,
						6
					],
					[
						4,
						2,
						3
					],
					[
						1,
						2,
						3
					]
				],
				"exitDirection": "-X",
				"color": 16039987,
				"lengthClass": "long"
			},
			{
				"id": "arrow-22",
				"path": [
					[
						10,
						6,
						4
					],
					[
						10,
						3,
						4
					],
					[
						9,
						3,
						4
					],
					[
						9,
						3,
						1
					],
					[
						9,
						6,
						1
					]
				],
				"exitDirection": "+Y",
				"color": 9400245,
				"lengthClass": "long"
			},
			{
				"id": "arrow-23",
				"path": [
					[
						4,
						7,
						3
					],
					[
						4,
						9,
						3
					],
					[
						2,
						9,
						3
					],
					[
						2,
						10,
						3
					],
					[
						2,
						10,
						4
					]
				],
				"exitDirection": "+Z",
				"color": 15698492,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-24",
				"path": [
					[
						5,
						8,
						4
					],
					[
						5,
						9,
						4
					],
					[
						7,
						9,
						4
					],
					[
						7,
						9,
						6
					]
				],
				"exitDirection": "+Z",
				"color": 3120282,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-25",
				"path": [
					[
						7,
						7,
						6
					],
					[
						7,
						7,
						8
					],
					[
						7,
						9,
						8
					],
					[
						7,
						9,
						9
					],
					[
						7,
						8,
						9
					]
				],
				"exitDirection": "-Y",
				"color": 6661503,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-26",
				"path": [
					[
						9,
						5,
						7
					],
					[
						7,
						5,
						7
					],
					[
						7,
						5,
						9
					],
					[
						7,
						3,
						9
					]
				],
				"exitDirection": "-Y",
				"color": 4946377,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-27",
				"path": [
					[
						5,
						3,
						3
					],
					[
						5,
						1,
						3
					],
					[
						5,
						1,
						6
					],
					[
						7,
						1,
						6
					],
					[
						7,
						1,
						9
					],
					[
						6,
						1,
						9
					]
				],
				"exitDirection": "-X",
				"color": 15770560,
				"lengthClass": "long"
			},
			{
				"id": "arrow-28",
				"path": [
					[
						6,
						2,
						9
					],
					[
						4,
						2,
						9
					],
					[
						4,
						1,
						9
					],
					[
						3,
						1,
						9
					],
					[
						3,
						2,
						9
					]
				],
				"exitDirection": "+Y",
				"color": 14704481,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-29",
				"path": [
					[
						3,
						6,
						10
					],
					[
						3,
						6,
						9
					],
					[
						4,
						6,
						9
					],
					[
						4,
						5,
						9
					],
					[
						2,
						5,
						9
					]
				],
				"exitDirection": "-X",
				"color": 16039987,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-30",
				"path": [
					[
						5,
						6,
						10
					],
					[
						5,
						3,
						10
					],
					[
						2,
						3,
						10
					],
					[
						2,
						5,
						10
					],
					[
						0,
						5,
						10
					],
					[
						0,
						5,
						8
					]
				],
				"exitDirection": "-Z",
				"color": 9400245,
				"lengthClass": "long"
			},
			{
				"id": "arrow-31",
				"path": [
					[
						3,
						6,
						8
					],
					[
						3,
						6,
						6
					],
					[
						3,
						3,
						6
					],
					[
						0,
						3,
						6
					],
					[
						0,
						6,
						6
					]
				],
				"exitDirection": "+Y",
				"color": 15698492,
				"lengthClass": "long"
			},
			{
				"id": "arrow-32",
				"path": [
					[
						2,
						10,
						7
					],
					[
						2,
						10,
						6
					],
					[
						2,
						9,
						6
					],
					[
						0,
						9,
						6
					],
					[
						0,
						9,
						5
					]
				],
				"exitDirection": "-Z",
				"color": 3120282,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-33",
				"path": [
					[
						3,
						8,
						6
					],
					[
						2,
						8,
						6
					],
					[
						2,
						6,
						6
					],
					[
						2,
						6,
						8
					]
				],
				"exitDirection": "+Z",
				"color": 6661503,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-34",
				"path": [
					[
						5,
						4,
						2
					],
					[
						5,
						4,
						4
					],
					[
						6,
						4,
						4
					],
					[
						6,
						4,
						3
					]
				],
				"exitDirection": "-Z",
				"color": 4946377,
				"lengthClass": "short"
			},
			{
				"id": "arrow-35",
				"path": [
					[
						6,
						7,
						0
					],
					[
						8,
						7,
						0
					],
					[
						8,
						7,
						1
					],
					[
						8,
						4,
						1
					],
					[
						5,
						4,
						1
					]
				],
				"exitDirection": "-X",
				"color": 15770560,
				"lengthClass": "long"
			},
			{
				"id": "arrow-36",
				"path": [
					[
						3,
						9,
						9
					],
					[
						3,
						9,
						8
					],
					[
						4,
						9,
						8
					],
					[
						4,
						8,
						8
					],
					[
						4,
						8,
						10
					]
				],
				"exitDirection": "+Z",
				"color": 14704481,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-37",
				"path": [
					[
						6,
						9,
						2
					],
					[
						6,
						9,
						3
					],
					[
						8,
						9,
						3
					],
					[
						8,
						8,
						3
					],
					[
						8,
						8,
						1
					]
				],
				"exitDirection": "-Z",
				"color": 16039987,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-38",
				"path": [
					[
						3,
						3,
						3
					],
					[
						1,
						3,
						3
					],
					[
						1,
						3,
						1
					],
					[
						1,
						5,
						1
					]
				],
				"exitDirection": "+Y",
				"color": 9400245,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-39",
				"path": [
					[
						3,
						8,
						3
					],
					[
						3,
						7,
						3
					],
					[
						3,
						7,
						1
					],
					[
						1,
						7,
						1
					],
					[
						1,
						7,
						2
					]
				],
				"exitDirection": "+Z",
				"color": 15698492,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-40",
				"path": [
					[
						2,
						9,
						5
					],
					[
						2,
						7,
						5
					],
					[
						2,
						7,
						4
					],
					[
						1,
						7,
						4
					],
					[
						1,
						6,
						4
					]
				],
				"exitDirection": "-Y",
				"color": 3120282,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-41",
				"path": [
					[
						6,
						0,
						1
					],
					[
						6,
						0,
						3
					],
					[
						3,
						0,
						3
					],
					[
						3,
						1,
						3
					],
					[
						1,
						1,
						3
					],
					[
						1,
						1,
						5
					]
				],
				"exitDirection": "+Z",
				"color": 6661503,
				"lengthClass": "long"
			},
			{
				"id": "arrow-42",
				"path": [
					[
						3,
						2,
						8
					],
					[
						3,
						2,
						7
					],
					[
						3,
						1,
						7
					],
					[
						1,
						1,
						7
					],
					[
						1,
						2,
						7
					]
				],
				"exitDirection": "+Y",
				"color": 4946377,
				"lengthClass": "medium"
			}
		],
		"solution": [
			"arrow-42",
			"arrow-41",
			"arrow-40",
			"arrow-39",
			"arrow-38",
			"arrow-37",
			"arrow-36",
			"arrow-35",
			"arrow-34",
			"arrow-33",
			"arrow-32",
			"arrow-31",
			"arrow-30",
			"arrow-29",
			"arrow-28",
			"arrow-27",
			"arrow-26",
			"arrow-25",
			"arrow-24",
			"arrow-23",
			"arrow-22",
			"arrow-21",
			"arrow-20",
			"arrow-19",
			"arrow-18",
			"arrow-17",
			"arrow-16",
			"arrow-15",
			"arrow-14",
			"arrow-13",
			"arrow-12",
			"arrow-11",
			"arrow-10",
			"arrow-9"
		],
		"initiallyFree": 10
	},
	"rush-05": {
		"arrows": [
			{
				"id": "arrow-10",
				"path": [
					[
						0,
						5,
						6
					],
					[
						0,
						5,
						9
					],
					[
						2,
						5,
						9
					],
					[
						2,
						5,
						6
					],
					[
						2,
						2,
						6
					]
				],
				"exitDirection": "-Y",
				"color": 16039987,
				"lengthClass": "long"
			},
			{
				"id": "arrow-11",
				"path": [
					[
						7,
						3,
						0
					],
					[
						7,
						5,
						0
					],
					[
						7,
						5,
						2
					],
					[
						10,
						5,
						2
					],
					[
						10,
						5,
						4
					]
				],
				"exitDirection": "+Z",
				"color": 4946377,
				"lengthClass": "long"
			},
			{
				"id": "arrow-12",
				"path": [
					[
						8,
						7,
						6
					],
					[
						8,
						6,
						6
					],
					[
						10,
						6,
						6
					],
					[
						10,
						5,
						6
					],
					[
						10,
						5,
						7
					]
				],
				"exitDirection": "+Z",
				"color": 6661503,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-13",
				"path": [
					[
						6,
						6,
						2
					],
					[
						6,
						6,
						5
					],
					[
						6,
						9,
						5
					],
					[
						8,
						9,
						5
					],
					[
						8,
						9,
						8
					]
				],
				"exitDirection": "+Z",
				"color": 9400245,
				"lengthClass": "long"
			},
			{
				"id": "arrow-14",
				"path": [
					[
						5,
						7,
						9
					],
					[
						8,
						7,
						9
					],
					[
						8,
						4,
						9
					],
					[
						10,
						4,
						9
					],
					[
						10,
						6,
						9
					]
				],
				"exitDirection": "+Y",
				"color": 15698492,
				"lengthClass": "long"
			},
			{
				"id": "arrow-15",
				"path": [
					[
						5,
						7,
						10
					],
					[
						7,
						7,
						10
					],
					[
						7,
						10,
						10
					],
					[
						10,
						10,
						10
					],
					[
						10,
						10,
						8
					]
				],
				"exitDirection": "-Z",
				"color": 15770560,
				"lengthClass": "long"
			},
			{
				"id": "arrow-16",
				"path": [
					[
						10,
						8,
						7
					],
					[
						10,
						8,
						4
					],
					[
						10,
						10,
						4
					],
					[
						10,
						10,
						1
					],
					[
						10,
						9,
						1
					]
				],
				"exitDirection": "-Y",
				"color": 14704481,
				"lengthClass": "long"
			},
			{
				"id": "arrow-17",
				"path": [
					[
						8,
						1,
						4
					],
					[
						10,
						1,
						4
					],
					[
						10,
						4,
						4
					],
					[
						10,
						4,
						1
					],
					[
						10,
						1,
						1
					]
				],
				"exitDirection": "-Y",
				"color": 3120282,
				"lengthClass": "long"
			},
			{
				"id": "arrow-18",
				"path": [
					[
						8,
						3,
						1
					],
					[
						8,
						0,
						1
					],
					[
						8,
						0,
						4
					],
					[
						10,
						0,
						4
					],
					[
						10,
						0,
						6
					]
				],
				"exitDirection": "+Z",
				"color": 16039987,
				"lengthClass": "long"
			},
			{
				"id": "arrow-19",
				"path": [
					[
						10,
						6,
						10
					],
					[
						10,
						3,
						10
					],
					[
						10,
						3,
						8
					],
					[
						10,
						0,
						8
					],
					[
						9,
						0,
						8
					]
				],
				"exitDirection": "-X",
				"color": 4946377,
				"lengthClass": "long"
			},
			{
				"id": "arrow-20",
				"path": [
					[
						8,
						6,
						10
					],
					[
						8,
						3,
						10
					],
					[
						6,
						3,
						10
					],
					[
						6,
						0,
						10
					],
					[
						6,
						0,
						8
					],
					[
						6,
						1,
						8
					]
				],
				"exitDirection": "+Y",
				"color": 6661503,
				"lengthClass": "long"
			},
			{
				"id": "arrow-21",
				"path": [
					[
						5,
						2,
						10
					],
					[
						5,
						0,
						10
					],
					[
						5,
						0,
						8
					],
					[
						2,
						0,
						8
					],
					[
						2,
						0,
						5
					]
				],
				"exitDirection": "-Z",
				"color": 9400245,
				"lengthClass": "long"
			},
			{
				"id": "arrow-22",
				"path": [
					[
						3,
						10,
						4
					],
					[
						3,
						10,
						6
					],
					[
						3,
						9,
						6
					],
					[
						6,
						9,
						6
					],
					[
						6,
						6,
						6
					],
					[
						6,
						6,
						9
					]
				],
				"exitDirection": "+Z",
				"color": 15698492,
				"lengthClass": "long"
			},
			{
				"id": "arrow-23",
				"path": [
					[
						4,
						0,
						5
					],
					[
						4,
						3,
						5
					],
					[
						4,
						3,
						3
					],
					[
						2,
						3,
						3
					],
					[
						2,
						0,
						3
					],
					[
						2,
						0,
						1
					]
				],
				"exitDirection": "-Z",
				"color": 15770560,
				"lengthClass": "long"
			},
			{
				"id": "arrow-24",
				"path": [
					[
						9,
						8,
						8
					],
					[
						9,
						8,
						10
					],
					[
						8,
						8,
						10
					],
					[
						8,
						9,
						10
					],
					[
						9,
						9,
						10
					]
				],
				"exitDirection": "+X",
				"color": 14704481,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-25",
				"path": [
					[
						5,
						7,
						8
					],
					[
						5,
						7,
						6
					],
					[
						5,
						6,
						6
					],
					[
						3,
						6,
						6
					]
				],
				"exitDirection": "-X",
				"color": 3120282,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-26",
				"path": [
					[
						0,
						4,
						7
					],
					[
						0,
						4,
						6
					],
					[
						1,
						4,
						6
					],
					[
						1,
						6,
						6
					],
					[
						1,
						6,
						7
					]
				],
				"exitDirection": "+Z",
				"color": 16039987,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-27",
				"path": [
					[
						3,
						8,
						9
					],
					[
						3,
						6,
						9
					],
					[
						1,
						6,
						9
					],
					[
						1,
						7,
						9
					]
				],
				"exitDirection": "+Y",
				"color": 4946377,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-28",
				"path": [
					[
						3,
						7,
						10
					],
					[
						3,
						9,
						10
					],
					[
						1,
						9,
						10
					],
					[
						1,
						9,
						8
					]
				],
				"exitDirection": "-Z",
				"color": 6661503,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-29",
				"path": [
					[
						2,
						10,
						6
					],
					[
						2,
						10,
						4
					],
					[
						2,
						9,
						4
					],
					[
						1,
						9,
						4
					],
					[
						1,
						9,
						3
					]
				],
				"exitDirection": "-Z",
				"color": 9400245,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-30",
				"path": [
					[
						2,
						8,
						3
					],
					[
						2,
						10,
						3
					],
					[
						2,
						10,
						1
					],
					[
						1,
						10,
						1
					],
					[
						1,
						8,
						1
					]
				],
				"exitDirection": "-Y",
				"color": 15698492,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-31",
				"path": [
					[
						3,
						6,
						0
					],
					[
						1,
						6,
						0
					],
					[
						1,
						4,
						0
					],
					[
						1,
						4,
						1
					],
					[
						1,
						2,
						1
					]
				],
				"exitDirection": "-Y",
				"color": 15770560,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-32",
				"path": [
					[
						0,
						2,
						0
					],
					[
						1,
						2,
						0
					],
					[
						1,
						0,
						0
					],
					[
						1,
						0,
						2
					]
				],
				"exitDirection": "+Z",
				"color": 14704481,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-33",
				"path": [
					[
						1,
						2,
						7
					],
					[
						1,
						2,
						6
					],
					[
						1,
						0,
						6
					],
					[
						1,
						0,
						8
					]
				],
				"exitDirection": "+Z",
				"color": 3120282,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-34",
				"path": [
					[
						8,
						2,
						5
					],
					[
						7,
						2,
						5
					],
					[
						7,
						2,
						3
					],
					[
						7,
						1,
						3
					]
				],
				"exitDirection": "-Y",
				"color": 16039987,
				"lengthClass": "short"
			},
			{
				"id": "arrow-35",
				"path": [
					[
						1,
						10,
						9
					],
					[
						0,
						10,
						9
					],
					[
						0,
						9,
						9
					],
					[
						0,
						9,
						8
					]
				],
				"exitDirection": "-Z",
				"color": 4946377,
				"lengthClass": "short"
			},
			{
				"id": "arrow-36",
				"path": [
					[
						1,
						10,
						6
					],
					[
						1,
						10,
						5
					],
					[
						0,
						10,
						5
					],
					[
						0,
						10,
						4
					],
					[
						0,
						8,
						4
					]
				],
				"exitDirection": "-Y",
				"color": 6661503,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-37",
				"path": [
					[
						1,
						3,
						5
					],
					[
						1,
						5,
						5
					],
					[
						0,
						5,
						5
					],
					[
						0,
						5,
						3
					]
				],
				"exitDirection": "-Z",
				"color": 9400245,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-38",
				"path": [
					[
						0,
						6,
						0
					],
					[
						0,
						8,
						0
					],
					[
						1,
						8,
						0
					],
					[
						1,
						10,
						0
					]
				],
				"exitDirection": "+Y",
				"color": 15698492,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-39",
				"path": [
					[
						3,
						1,
						8
					],
					[
						1,
						1,
						8
					],
					[
						1,
						2,
						8
					],
					[
						1,
						2,
						10
					],
					[
						1,
						0,
						10
					]
				],
				"exitDirection": "-Y",
				"color": 15770560,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-40",
				"path": [
					[
						1,
						6,
						1
					],
					[
						0,
						6,
						1
					],
					[
						0,
						4,
						1
					]
				],
				"exitDirection": "-Y",
				"color": 14704481,
				"lengthClass": "short"
			},
			{
				"id": "arrow-41",
				"path": [
					[
						0,
						1,
						0
					],
					[
						0,
						0,
						0
					],
					[
						0,
						0,
						1
					],
					[
						0,
						2,
						1
					],
					[
						0,
						2,
						2
					]
				],
				"exitDirection": "+Z",
				"color": 3120282,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-42",
				"path": [
					[
						0,
						4,
						8
					],
					[
						0,
						2,
						8
					],
					[
						0,
						2,
						10
					],
					[
						0,
						1,
						10
					]
				],
				"exitDirection": "-Y",
				"color": 16039987,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-43",
				"path": [
					[
						3,
						3,
						2
					],
					[
						4,
						3,
						2
					],
					[
						4,
						3,
						0
					],
					[
						3,
						3,
						0
					],
					[
						3,
						2,
						0
					]
				],
				"exitDirection": "-Y",
				"color": 4946377,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-44",
				"path": [
					[
						3,
						1,
						4
					],
					[
						3,
						1,
						2
					],
					[
						3,
						0,
						2
					],
					[
						3,
						0,
						0
					],
					[
						4,
						0,
						0
					]
				],
				"exitDirection": "+X",
				"color": 6661503,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-45",
				"path": [
					[
						8,
						2,
						0
					],
					[
						8,
						0,
						0
					],
					[
						9,
						0,
						0
					]
				],
				"exitDirection": "+X",
				"color": 9400245,
				"lengthClass": "short"
			},
			{
				"id": "arrow-46",
				"path": [
					[
						2,
						0,
						10
					],
					[
						2,
						0,
						9
					],
					[
						2,
						1,
						9
					],
					[
						3,
						1,
						9
					]
				],
				"exitDirection": "+X",
				"color": 15698492,
				"lengthClass": "short"
			}
		],
		"solution": [
			"arrow-46",
			"arrow-45",
			"arrow-44",
			"arrow-43",
			"arrow-42",
			"arrow-41",
			"arrow-40",
			"arrow-39",
			"arrow-38",
			"arrow-37",
			"arrow-36",
			"arrow-35",
			"arrow-34",
			"arrow-33",
			"arrow-32",
			"arrow-31",
			"arrow-30",
			"arrow-29",
			"arrow-28",
			"arrow-27",
			"arrow-26",
			"arrow-25",
			"arrow-24",
			"arrow-23",
			"arrow-22",
			"arrow-21",
			"arrow-20",
			"arrow-19",
			"arrow-18",
			"arrow-17",
			"arrow-16",
			"arrow-15",
			"arrow-14",
			"arrow-13",
			"arrow-12",
			"arrow-11",
			"arrow-10"
		],
		"initiallyFree": 10
	},
	"rush-06": {
		"arrows": [
			{
				"id": "arrow-10",
				"path": [
					[
						5,
						9,
						9
					],
					[
						5,
						6,
						9
					],
					[
						2,
						6,
						9
					],
					[
						2,
						4,
						9
					],
					[
						2,
						4,
						7
					]
				],
				"exitDirection": "-Z",
				"color": 3120282,
				"lengthClass": "long"
			},
			{
				"id": "arrow-11",
				"path": [
					[
						6,
						9,
						9
					],
					[
						8,
						9,
						9
					],
					[
						8,
						9,
						7
					],
					[
						5,
						9,
						7
					],
					[
						5,
						9,
						4
					]
				],
				"exitDirection": "-Z",
				"color": 4946377,
				"lengthClass": "long"
			},
			{
				"id": "arrow-12",
				"path": [
					[
						4,
						6,
						8
					],
					[
						1,
						6,
						8
					],
					[
						1,
						6,
						7
					],
					[
						3,
						6,
						7
					],
					[
						3,
						9,
						7
					]
				],
				"exitDirection": "+Y",
				"color": 14704481,
				"lengthClass": "long"
			},
			{
				"id": "arrow-13",
				"path": [
					[
						4,
						7,
						8
					],
					[
						4,
						7,
						5
					],
					[
						4,
						4,
						5
					],
					[
						2,
						4,
						5
					],
					[
						2,
						4,
						2
					]
				],
				"exitDirection": "-Z",
				"color": 15698492,
				"lengthClass": "long"
			},
			{
				"id": "arrow-14",
				"path": [
					[
						4,
						3,
						6
					],
					[
						4,
						0,
						6
					],
					[
						7,
						0,
						6
					],
					[
						7,
						0,
						3
					],
					[
						9,
						0,
						3
					],
					[
						9,
						1,
						3
					]
				],
				"exitDirection": "+Y",
				"color": 16039987,
				"lengthClass": "long"
			},
			{
				"id": "arrow-15",
				"path": [
					[
						5,
						10,
						7
					],
					[
						5,
						10,
						5
					],
					[
						7,
						10,
						5
					],
					[
						7,
						10,
						2
					],
					[
						7,
						9,
						2
					],
					[
						4,
						9,
						2
					]
				],
				"exitDirection": "-X",
				"color": 6661503,
				"lengthClass": "long"
			},
			{
				"id": "arrow-16",
				"path": [
					[
						8,
						10,
						5
					],
					[
						8,
						10,
						3
					],
					[
						9,
						10,
						3
					],
					[
						9,
						10,
						4
					]
				],
				"exitDirection": "+Z",
				"color": 9400245,
				"lengthClass": "short"
			},
			{
				"id": "arrow-17",
				"path": [
					[
						4,
						5,
						4
					],
					[
						4,
						7,
						4
					],
					[
						2,
						7,
						4
					],
					[
						2,
						7,
						1
					],
					[
						2,
						9,
						1
					],
					[
						2,
						9,
						3
					]
				],
				"exitDirection": "+Z",
				"color": 15770560,
				"lengthClass": "long"
			},
			{
				"id": "arrow-18",
				"path": [
					[
						4,
						10,
						7
					],
					[
						4,
						10,
						4
					],
					[
						2,
						10,
						4
					],
					[
						2,
						10,
						6
					],
					[
						2,
						8,
						6
					]
				],
				"exitDirection": "-Y",
				"color": 3120282,
				"lengthClass": "long"
			},
			{
				"id": "arrow-19",
				"path": [
					[
						1,
						2,
						6
					],
					[
						1,
						2,
						3
					],
					[
						1,
						0,
						3
					],
					[
						2,
						0,
						3
					],
					[
						2,
						3,
						3
					],
					[
						2,
						3,
						6
					]
				],
				"exitDirection": "+Z",
				"color": 4946377,
				"lengthClass": "long"
			},
			{
				"id": "arrow-20",
				"path": [
					[
						9,
						9,
						7
					],
					[
						9,
						9,
						8
					],
					[
						9,
						10,
						8
					],
					[
						8,
						10,
						8
					]
				],
				"exitDirection": "-X",
				"color": 14704481,
				"lengthClass": "short"
			},
			{
				"id": "arrow-21",
				"path": [
					[
						5,
						10,
						8
					],
					[
						3,
						10,
						8
					],
					[
						3,
						7,
						8
					],
					[
						1,
						7,
						8
					],
					[
						1,
						10,
						8
					],
					[
						1,
						10,
						7
					]
				],
				"exitDirection": "-Z",
				"color": 15698492,
				"lengthClass": "long"
			},
			{
				"id": "arrow-22",
				"path": [
					[
						3,
						7,
						5
					],
					[
						0,
						7,
						5
					],
					[
						0,
						10,
						5
					],
					[
						1,
						10,
						5
					],
					[
						1,
						10,
						3
					]
				],
				"exitDirection": "-Z",
				"color": 16039987,
				"lengthClass": "long"
			},
			{
				"id": "arrow-23",
				"path": [
					[
						3,
						3,
						8
					],
					[
						2,
						3,
						8
					],
					[
						2,
						3,
						9
					],
					[
						2,
						2,
						9
					]
				],
				"exitDirection": "-Y",
				"color": 6661503,
				"lengthClass": "short"
			},
			{
				"id": "arrow-24",
				"path": [
					[
						5,
						3,
						4
					],
					[
						5,
						5,
						4
					],
					[
						6,
						5,
						4
					]
				],
				"exitDirection": "+X",
				"color": 9400245,
				"lengthClass": "short"
			},
			{
				"id": "arrow-25",
				"path": [
					[
						9,
						7,
						6
					],
					[
						9,
						6,
						6
					],
					[
						9,
						6,
						4
					],
					[
						10,
						6,
						4
					],
					[
						10,
						4,
						4
					]
				],
				"exitDirection": "-Y",
				"color": 15770560,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-26",
				"path": [
					[
						8,
						0,
						6
					],
					[
						8,
						0,
						4
					],
					[
						10,
						0,
						4
					],
					[
						10,
						0,
						5
					]
				],
				"exitDirection": "+Z",
				"color": 3120282,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-27",
				"path": [
					[
						4,
						0,
						5
					],
					[
						4,
						0,
						4
					],
					[
						6,
						0,
						4
					],
					[
						6,
						0,
						3
					],
					[
						6,
						2,
						3
					]
				],
				"exitDirection": "+Y",
				"color": 4946377,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-28",
				"path": [
					[
						5,
						2,
						4
					],
					[
						5,
						2,
						3
					],
					[
						5,
						4,
						3
					],
					[
						7,
						4,
						3
					]
				],
				"exitDirection": "+X",
				"color": 14704481,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-29",
				"path": [
					[
						7,
						5,
						5
					],
					[
						9,
						5,
						5
					],
					[
						9,
						5,
						3
					],
					[
						9,
						4,
						3
					],
					[
						9,
						4,
						4
					]
				],
				"exitDirection": "+Z",
				"color": 15698492,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-30",
				"path": [
					[
						3,
						7,
						3
					],
					[
						3,
						8,
						3
					],
					[
						3,
						8,
						5
					],
					[
						1,
						8,
						5
					],
					[
						1,
						8,
						4
					]
				],
				"exitDirection": "-Z",
				"color": 16039987,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-31",
				"path": [
					[
						10,
						6,
						5
					],
					[
						10,
						6,
						6
					],
					[
						10,
						4,
						6
					],
					[
						8,
						4,
						6
					]
				],
				"exitDirection": "-X",
				"color": 6661503,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-32",
				"path": [
					[
						1,
						5,
						5
					],
					[
						3,
						5,
						5
					],
					[
						3,
						5,
						6
					],
					[
						3,
						3,
						6
					]
				],
				"exitDirection": "-Y",
				"color": 9400245,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-33",
				"path": [
					[
						2,
						6,
						4
					],
					[
						2,
						6,
						2
					],
					[
						1,
						6,
						2
					],
					[
						1,
						8,
						2
					],
					[
						2,
						8,
						2
					]
				],
				"exitDirection": "+X",
				"color": 15770560,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-34",
				"path": [
					[
						2,
						0,
						6
					],
					[
						3,
						0,
						6
					],
					[
						3,
						0,
						5
					],
					[
						3,
						1,
						5
					],
					[
						3,
						1,
						7
					]
				],
				"exitDirection": "+Z",
				"color": 3120282,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-35",
				"path": [
					[
						5,
						7,
						4
					],
					[
						5,
						8,
						4
					],
					[
						5,
						8,
						2
					],
					[
						7,
						8,
						2
					]
				],
				"exitDirection": "+X",
				"color": 4946377,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-36",
				"path": [
					[
						8,
						9,
						4
					],
					[
						8,
						9,
						3
					],
					[
						9,
						9,
						3
					],
					[
						9,
						9,
						2
					],
					[
						9,
						7,
						2
					]
				],
				"exitDirection": "-Y",
				"color": 14704481,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-37",
				"path": [
					[
						7,
						0,
						2
					],
					[
						9,
						0,
						2
					],
					[
						9,
						2,
						2
					],
					[
						8,
						2,
						2
					]
				],
				"exitDirection": "-X",
				"color": 15698492,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-38",
				"path": [
					[
						6,
						0,
						1
					],
					[
						6,
						0,
						2
					],
					[
						6,
						2,
						2
					],
					[
						4,
						2,
						2
					]
				],
				"exitDirection": "-X",
				"color": 16039987,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-39",
				"path": [
					[
						8,
						8,
						3
					],
					[
						8,
						7,
						3
					],
					[
						8,
						7,
						4
					],
					[
						10,
						7,
						4
					],
					[
						10,
						7,
						6
					]
				],
				"exitDirection": "+Z",
				"color": 6661503,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-40",
				"path": [
					[
						1,
						4,
						4
					],
					[
						1,
						4,
						2
					],
					[
						1,
						3,
						2
					],
					[
						2,
						3,
						2
					],
					[
						2,
						1,
						2
					]
				],
				"exitDirection": "-X",
				"color": 9400245,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-41",
				"path": [
					[
						8,
						2,
						3
					],
					[
						8,
						3,
						3
					],
					[
						8,
						3,
						2
					],
					[
						9,
						3,
						2
					]
				],
				"exitDirection": "+X",
				"color": 15770560,
				"lengthClass": "short"
			},
			{
				"id": "arrow-42",
				"path": [
					[
						3,
						3,
						4
					],
					[
						3,
						3,
						3
					],
					[
						4,
						3,
						3
					],
					[
						4,
						4,
						3
					]
				],
				"exitDirection": "+Y",
				"color": 3120282,
				"lengthClass": "short"
			},
			{
				"id": "arrow-43",
				"path": [
					[
						3,
						7,
						1
					],
					[
						3,
						6,
						1
					],
					[
						3,
						6,
						3
					],
					[
						4,
						6,
						3
					],
					[
						4,
						8,
						3
					]
				],
				"exitDirection": "+Y",
				"color": 4946377,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-44",
				"path": [
					[
						5,
						10,
						4
					],
					[
						6,
						10,
						4
					],
					[
						6,
						10,
						3
					],
					[
						4,
						10,
						3
					],
					[
						4,
						10,
						2
					]
				],
				"exitDirection": "-Z",
				"color": 14704481,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-45",
				"path": [
					[
						6,
						7,
						5
					],
					[
						6,
						7,
						2
					],
					[
						4,
						7,
						2
					],
					[
						4,
						7,
						0
					],
					[
						4,
						10,
						0
					],
					[
						5,
						10,
						0
					]
				],
				"exitDirection": "+X",
				"color": 15698492,
				"lengthClass": "long"
			},
			{
				"id": "arrow-46",
				"path": [
					[
						6,
						8,
						4
					],
					[
						6,
						8,
						5
					],
					[
						6,
						9,
						5
					],
					[
						7,
						9,
						5
					]
				],
				"exitDirection": "+X",
				"color": 16039987,
				"lengthClass": "short"
			}
		],
		"solution": [
			"arrow-46",
			"arrow-45",
			"arrow-44",
			"arrow-43",
			"arrow-42",
			"arrow-41",
			"arrow-40",
			"arrow-39",
			"arrow-38",
			"arrow-37",
			"arrow-36",
			"arrow-35",
			"arrow-34",
			"arrow-33",
			"arrow-32",
			"arrow-31",
			"arrow-30",
			"arrow-29",
			"arrow-28",
			"arrow-27",
			"arrow-26",
			"arrow-25",
			"arrow-24",
			"arrow-23",
			"arrow-22",
			"arrow-21",
			"arrow-20",
			"arrow-19",
			"arrow-18",
			"arrow-17",
			"arrow-16",
			"arrow-15",
			"arrow-14",
			"arrow-13",
			"arrow-12",
			"arrow-11",
			"arrow-10"
		],
		"initiallyFree": 11
	},
	"rush-07": {
		"arrows": [
			{
				"id": "arrow-10",
				"path": [
					[
						7,
						4,
						7
					],
					[
						7,
						4,
						9
					],
					[
						7,
						6,
						9
					],
					[
						6,
						6,
						9
					]
				],
				"exitDirection": "-X",
				"color": 15698492,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-11",
				"path": [
					[
						6,
						8,
						10
					],
					[
						6,
						6,
						10
					],
					[
						8,
						6,
						10
					],
					[
						8,
						4,
						10
					],
					[
						7,
						4,
						10
					]
				],
				"exitDirection": "-X",
				"color": 4946377,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-12",
				"path": [
					[
						8,
						1,
						8
					],
					[
						5,
						1,
						8
					],
					[
						5,
						3,
						8
					],
					[
						3,
						3,
						8
					],
					[
						3,
						3,
						10
					],
					[
						3,
						5,
						10
					]
				],
				"exitDirection": "+Y",
				"color": 6661503,
				"lengthClass": "long"
			},
			{
				"id": "arrow-13",
				"path": [
					[
						0,
						4,
						7
					],
					[
						0,
						6,
						7
					],
					[
						2,
						6,
						7
					],
					[
						2,
						8,
						7
					],
					[
						2,
						8,
						9
					],
					[
						2,
						5,
						9
					]
				],
				"exitDirection": "-Y",
				"color": 16039987,
				"lengthClass": "long"
			},
			{
				"id": "arrow-14",
				"path": [
					[
						7,
						4,
						4
					],
					[
						7,
						6,
						4
					],
					[
						7,
						6,
						2
					],
					[
						9,
						6,
						2
					]
				],
				"exitDirection": "+X",
				"color": 3120282,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-15",
				"path": [
					[
						5,
						5,
						10
					],
					[
						5,
						7,
						10
					],
					[
						3,
						7,
						10
					],
					[
						3,
						7,
						9
					]
				],
				"exitDirection": "-Z",
				"color": 9400245,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-16",
				"path": [
					[
						4,
						6,
						9
					],
					[
						3,
						6,
						9
					],
					[
						3,
						6,
						7
					],
					[
						3,
						8,
						7
					]
				],
				"exitDirection": "+Y",
				"color": 14704481,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-17",
				"path": [
					[
						2,
						3,
						8
					],
					[
						2,
						3,
						9
					],
					[
						2,
						2,
						9
					],
					[
						3,
						2,
						9
					]
				],
				"exitDirection": "+X",
				"color": 15770560,
				"lengthClass": "short"
			},
			{
				"id": "arrow-18",
				"path": [
					[
						6,
						3,
						6
					],
					[
						6,
						3,
						9
					],
					[
						6,
						1,
						9
					],
					[
						5,
						1,
						9
					],
					[
						5,
						3,
						9
					]
				],
				"exitDirection": "+Y",
				"color": 15698492,
				"lengthClass": "long"
			},
			{
				"id": "arrow-19",
				"path": [
					[
						7,
						8,
						8
					],
					[
						7,
						8,
						9
					],
					[
						7,
						7,
						9
					],
					[
						5,
						7,
						9
					],
					[
						5,
						7,
						8
					]
				],
				"exitDirection": "-Z",
				"color": 4946377,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-20",
				"path": [
					[
						7,
						8,
						7
					],
					[
						7,
						7,
						7
					],
					[
						7,
						7,
						5
					],
					[
						5,
						7,
						5
					],
					[
						5,
						7,
						3
					]
				],
				"exitDirection": "-Z",
				"color": 6661503,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-21",
				"path": [
					[
						4,
						6,
						3
					],
					[
						6,
						6,
						3
					],
					[
						6,
						6,
						1
					],
					[
						6,
						7,
						1
					],
					[
						4,
						7,
						1
					]
				],
				"exitDirection": "-X",
				"color": 16039987,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-22",
				"path": [
					[
						9,
						5,
						9
					],
					[
						9,
						4,
						9
					],
					[
						9,
						4,
						7
					]
				],
				"exitDirection": "-Z",
				"color": 3120282,
				"lengthClass": "short"
			},
			{
				"id": "arrow-23",
				"path": [
					[
						3,
						5,
						4
					],
					[
						6,
						5,
						4
					],
					[
						6,
						2,
						4
					],
					[
						9,
						2,
						4
					],
					[
						9,
						5,
						4
					]
				],
				"exitDirection": "+Y",
				"color": 9400245,
				"lengthClass": "long"
			},
			{
				"id": "arrow-24",
				"path": [
					[
						8,
						6,
						9
					],
					[
						8,
						8,
						9
					],
					[
						8,
						8,
						6
					],
					[
						10,
						8,
						6
					],
					[
						10,
						8,
						4
					],
					[
						8,
						8,
						4
					]
				],
				"exitDirection": "-X",
				"color": 14704481,
				"lengthClass": "long"
			},
			{
				"id": "arrow-25",
				"path": [
					[
						6,
						7,
						2
					],
					[
						6,
						7,
						4
					],
					[
						6,
						8,
						4
					],
					[
						5,
						8,
						4
					],
					[
						5,
						8,
						3
					]
				],
				"exitDirection": "-Z",
				"color": 15770560,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-26",
				"path": [
					[
						3,
						9,
						2
					],
					[
						4,
						9,
						2
					],
					[
						4,
						8,
						2
					],
					[
						4,
						8,
						1
					],
					[
						6,
						8,
						1
					]
				],
				"exitDirection": "+X",
				"color": 15698492,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-27",
				"path": [
					[
						2,
						7,
						1
					],
					[
						2,
						7,
						4
					],
					[
						2,
						10,
						4
					],
					[
						3,
						10,
						4
					],
					[
						3,
						10,
						7
					],
					[
						4,
						10,
						7
					]
				],
				"exitDirection": "+X",
				"color": 4946377,
				"lengthClass": "long"
			},
			{
				"id": "arrow-28",
				"path": [
					[
						9,
						7,
						5
					],
					[
						9,
						7,
						8
					],
					[
						6,
						7,
						8
					],
					[
						6,
						10,
						8
					],
					[
						6,
						10,
						6
					]
				],
				"exitDirection": "-Z",
				"color": 6661503,
				"lengthClass": "long"
			},
			{
				"id": "arrow-29",
				"path": [
					[
						2,
						8,
						6
					],
					[
						4,
						8,
						6
					],
					[
						4,
						10,
						6
					],
					[
						4,
						10,
						4
					],
					[
						7,
						10,
						4
					]
				],
				"exitDirection": "+X",
				"color": 16039987,
				"lengthClass": "long"
			},
			{
				"id": "arrow-30",
				"path": [
					[
						10,
						6,
						3
					],
					[
						8,
						6,
						3
					],
					[
						8,
						8,
						3
					],
					[
						8,
						8,
						1
					],
					[
						8,
						7,
						1
					]
				],
				"exitDirection": "-Y",
				"color": 3120282,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-31",
				"path": [
					[
						9,
						4,
						3
					],
					[
						9,
						5,
						3
					],
					[
						9,
						5,
						1
					],
					[
						8,
						5,
						1
					],
					[
						8,
						4,
						1
					]
				],
				"exitDirection": "-Y",
				"color": 9400245,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-32",
				"path": [
					[
						7,
						3,
						8
					],
					[
						7,
						3,
						6
					],
					[
						8,
						3,
						6
					],
					[
						8,
						2,
						6
					],
					[
						6,
						2,
						6
					]
				],
				"exitDirection": "-X",
				"color": 14704481,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-33",
				"path": [
					[
						4,
						0,
						8
					],
					[
						4,
						2,
						8
					],
					[
						4,
						2,
						6
					],
					[
						3,
						2,
						6
					]
				],
				"exitDirection": "-X",
				"color": 15770560,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-34",
				"path": [
					[
						3,
						3,
						4
					],
					[
						1,
						3,
						4
					],
					[
						1,
						3,
						6
					],
					[
						1,
						2,
						6
					],
					[
						1,
						2,
						7
					]
				],
				"exitDirection": "+Z",
				"color": 15698492,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-35",
				"path": [
					[
						5,
						9,
						7
					],
					[
						5,
						9,
						6
					],
					[
						7,
						9,
						6
					],
					[
						7,
						9,
						8
					]
				],
				"exitDirection": "+Z",
				"color": 4946377,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-36",
				"path": [
					[
						8,
						2,
						1
					],
					[
						7,
						2,
						1
					],
					[
						7,
						2,
						3
					],
					[
						9,
						2,
						3
					],
					[
						9,
						2,
						2
					]
				],
				"exitDirection": "-Z",
				"color": 6661503,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-37",
				"path": [
					[
						0,
						6,
						8
					],
					[
						0,
						4,
						8
					],
					[
						2,
						4,
						8
					],
					[
						2,
						4,
						5
					],
					[
						0,
						4,
						5
					],
					[
						0,
						4,
						3
					]
				],
				"exitDirection": "-Z",
				"color": 16039987,
				"lengthClass": "long"
			},
			{
				"id": "arrow-38",
				"path": [
					[
						6,
						2,
						3
					],
					[
						6,
						2,
						0
					],
					[
						4,
						2,
						0
					],
					[
						4,
						3,
						0
					],
					[
						6,
						3,
						0
					]
				],
				"exitDirection": "+X",
				"color": 3120282,
				"lengthClass": "long"
			},
			{
				"id": "arrow-39",
				"path": [
					[
						5,
						8,
						5
					],
					[
						3,
						8,
						5
					],
					[
						3,
						9,
						5
					],
					[
						3,
						9,
						6
					],
					[
						2,
						9,
						6
					]
				],
				"exitDirection": "-X",
				"color": 9400245,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-40",
				"path": [
					[
						9,
						8,
						3
					],
					[
						9,
						7,
						3
					],
					[
						10,
						7,
						3
					],
					[
						10,
						7,
						5
					],
					[
						10,
						6,
						5
					]
				],
				"exitDirection": "-Y",
				"color": 14704481,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-41",
				"path": [
					[
						9,
						2,
						5
					],
					[
						10,
						2,
						5
					],
					[
						10,
						2,
						4
					],
					[
						10,
						3,
						4
					],
					[
						10,
						3,
						6
					]
				],
				"exitDirection": "+Z",
				"color": 15770560,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-42",
				"path": [
					[
						6,
						4,
						2
					],
					[
						6,
						4,
						0
					],
					[
						4,
						4,
						0
					],
					[
						4,
						5,
						0
					]
				],
				"exitDirection": "+Y",
				"color": 15698492,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-43",
				"path": [
					[
						2,
						6,
						0
					],
					[
						2,
						4,
						0
					],
					[
						3,
						4,
						0
					],
					[
						3,
						7,
						0
					],
					[
						5,
						7,
						0
					]
				],
				"exitDirection": "+X",
				"color": 4946377,
				"lengthClass": "long"
			},
			{
				"id": "arrow-44",
				"path": [
					[
						4,
						8,
						3
					],
					[
						4,
						10,
						3
					],
					[
						7,
						10,
						3
					],
					[
						7,
						7,
						3
					],
					[
						7,
						7,
						0
					],
					[
						7,
						6,
						0
					]
				],
				"exitDirection": "-Y",
				"color": 6661503,
				"lengthClass": "long"
			},
			{
				"id": "arrow-45",
				"path": [
					[
						3,
						7,
						6
					],
					[
						4,
						7,
						6
					],
					[
						4,
						7,
						4
					],
					[
						4,
						9,
						4
					],
					[
						5,
						9,
						4
					]
				],
				"exitDirection": "+X",
				"color": 16039987,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-46",
				"path": [
					[
						7,
						10,
						5
					],
					[
						7,
						9,
						5
					],
					[
						7,
						9,
						4
					],
					[
						8,
						9,
						4
					]
				],
				"exitDirection": "+X",
				"color": 3120282,
				"lengthClass": "short"
			}
		],
		"solution": [
			"arrow-46",
			"arrow-45",
			"arrow-44",
			"arrow-43",
			"arrow-42",
			"arrow-41",
			"arrow-40",
			"arrow-39",
			"arrow-38",
			"arrow-37",
			"arrow-36",
			"arrow-35",
			"arrow-34",
			"arrow-33",
			"arrow-32",
			"arrow-31",
			"arrow-30",
			"arrow-29",
			"arrow-28",
			"arrow-27",
			"arrow-26",
			"arrow-25",
			"arrow-24",
			"arrow-23",
			"arrow-22",
			"arrow-21",
			"arrow-20",
			"arrow-19",
			"arrow-18",
			"arrow-17",
			"arrow-16",
			"arrow-15",
			"arrow-14",
			"arrow-13",
			"arrow-12",
			"arrow-11",
			"arrow-10"
		],
		"initiallyFree": 11
	},
	"rush-08": {
		"arrows": [
			{
				"id": "arrow-10",
				"path": [
					[
						6,
						10,
						2
					],
					[
						6,
						9,
						2
					],
					[
						8,
						9,
						2
					],
					[
						8,
						8,
						2
					],
					[
						8,
						8,
						4
					]
				],
				"exitDirection": "+Z",
				"color": 15770560,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-11",
				"path": [
					[
						0,
						1,
						6
					],
					[
						0,
						1,
						4
					],
					[
						0,
						2,
						4
					],
					[
						0,
						2,
						3
					],
					[
						0,
						3,
						3
					]
				],
				"exitDirection": "+Y",
				"color": 9400245,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-12",
				"path": [
					[
						5,
						7,
						5
					],
					[
						3,
						7,
						5
					],
					[
						3,
						7,
						2
					],
					[
						0,
						7,
						2
					],
					[
						0,
						6,
						2
					],
					[
						0,
						6,
						4
					]
				],
				"exitDirection": "+Z",
				"color": 4946377,
				"lengthClass": "long"
			},
			{
				"id": "arrow-13",
				"path": [
					[
						2,
						10,
						7
					],
					[
						2,
						10,
						5
					],
					[
						0,
						10,
						5
					],
					[
						0,
						8,
						5
					],
					[
						0,
						8,
						7
					],
					[
						0,
						5,
						7
					]
				],
				"exitDirection": "-Y",
				"color": 6661503,
				"lengthClass": "long"
			},
			{
				"id": "arrow-14",
				"path": [
					[
						2,
						5,
						6
					],
					[
						2,
						3,
						6
					],
					[
						0,
						3,
						6
					],
					[
						0,
						3,
						7
					],
					[
						1,
						3,
						7
					]
				],
				"exitDirection": "+X",
				"color": 16039987,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-15",
				"path": [
					[
						3,
						4,
						5
					],
					[
						4,
						4,
						5
					],
					[
						4,
						4,
						7
					],
					[
						5,
						4,
						7
					],
					[
						5,
						2,
						7
					]
				],
				"exitDirection": "-Y",
				"color": 3120282,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-16",
				"path": [
					[
						0,
						3,
						8
					],
					[
						3,
						3,
						8
					],
					[
						3,
						0,
						8
					],
					[
						3,
						0,
						7
					],
					[
						6,
						0,
						7
					]
				],
				"exitDirection": "+X",
				"color": 15698492,
				"lengthClass": "long"
			},
			{
				"id": "arrow-17",
				"path": [
					[
						5,
						5,
						1
					],
					[
						5,
						3,
						1
					],
					[
						5,
						3,
						0
					],
					[
						4,
						3,
						0
					],
					[
						4,
						4,
						0
					]
				],
				"exitDirection": "+Y",
				"color": 14704481,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-18",
				"path": [
					[
						4,
						6,
						1
					],
					[
						4,
						6,
						2
					],
					[
						1,
						6,
						2
					],
					[
						1,
						6,
						0
					],
					[
						4,
						6,
						0
					],
					[
						4,
						8,
						0
					]
				],
				"exitDirection": "+Y",
				"color": 15770560,
				"lengthClass": "long"
			},
			{
				"id": "arrow-19",
				"path": [
					[
						1,
						10,
						4
					],
					[
						1,
						9,
						4
					],
					[
						2,
						9,
						4
					],
					[
						2,
						9,
						3
					]
				],
				"exitDirection": "-Z",
				"color": 9400245,
				"lengthClass": "short"
			},
			{
				"id": "arrow-20",
				"path": [
					[
						2,
						7,
						3
					],
					[
						2,
						7,
						4
					],
					[
						2,
						5,
						4
					],
					[
						1,
						5,
						4
					],
					[
						1,
						5,
						6
					]
				],
				"exitDirection": "+Z",
				"color": 4946377,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-21",
				"path": [
					[
						6,
						5,
						7
					],
					[
						6,
						5,
						4
					],
					[
						6,
						8,
						4
					],
					[
						6,
						8,
						7
					],
					[
						9,
						8,
						7
					]
				],
				"exitDirection": "+X",
				"color": 6661503,
				"lengthClass": "long"
			},
			{
				"id": "arrow-22",
				"path": [
					[
						0,
						4,
						6
					],
					[
						0,
						7,
						6
					],
					[
						1,
						7,
						6
					],
					[
						1,
						7,
						9
					],
					[
						1,
						4,
						9
					]
				],
				"exitDirection": "-Y",
				"color": 16039987,
				"lengthClass": "long"
			},
			{
				"id": "arrow-23",
				"path": [
					[
						6,
						3,
						7
					],
					[
						6,
						1,
						7
					],
					[
						8,
						1,
						7
					],
					[
						8,
						0,
						7
					],
					[
						8,
						0,
						6
					]
				],
				"exitDirection": "-Z",
				"color": 3120282,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-24",
				"path": [
					[
						5,
						2,
						6
					],
					[
						5,
						1,
						6
					],
					[
						3,
						1,
						6
					],
					[
						3,
						1,
						4
					]
				],
				"exitDirection": "-Z",
				"color": 15698492,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-25",
				"path": [
					[
						3,
						3,
						4
					],
					[
						3,
						3,
						2
					],
					[
						3,
						1,
						2
					],
					[
						3,
						1,
						1
					],
					[
						3,
						2,
						1
					]
				],
				"exitDirection": "+Y",
				"color": 14704481,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-26",
				"path": [
					[
						1,
						5,
						3
					],
					[
						3,
						5,
						3
					],
					[
						3,
						5,
						1
					],
					[
						3,
						7,
						1
					]
				],
				"exitDirection": "+Y",
				"color": 15770560,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-27",
				"path": [
					[
						5,
						7,
						7
					],
					[
						5,
						9,
						7
					],
					[
						5,
						9,
						4
					],
					[
						3,
						9,
						4
					],
					[
						3,
						9,
						1
					],
					[
						4,
						9,
						1
					]
				],
				"exitDirection": "+X",
				"color": 9400245,
				"lengthClass": "long"
			},
			{
				"id": "arrow-28",
				"path": [
					[
						4,
						8,
						1
					],
					[
						6,
						8,
						1
					],
					[
						6,
						9,
						1
					],
					[
						7,
						9,
						1
					],
					[
						7,
						8,
						1
					]
				],
				"exitDirection": "-Y",
				"color": 4946377,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-29",
				"path": [
					[
						7,
						4,
						0
					],
					[
						7,
						4,
						1
					],
					[
						6,
						4,
						1
					],
					[
						6,
						5,
						1
					],
					[
						8,
						5,
						1
					]
				],
				"exitDirection": "+X",
				"color": 6661503,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-30",
				"path": [
					[
						5,
						4,
						0
					],
					[
						5,
						7,
						0
					],
					[
						8,
						7,
						0
					],
					[
						8,
						5,
						0
					],
					[
						10,
						5,
						0
					],
					[
						10,
						5,
						2
					]
				],
				"exitDirection": "+Z",
				"color": 16039987,
				"lengthClass": "long"
			},
			{
				"id": "arrow-31",
				"path": [
					[
						7,
						4,
						2
					],
					[
						7,
						4,
						4
					],
					[
						7,
						7,
						4
					],
					[
						10,
						7,
						4
					],
					[
						10,
						4,
						4
					]
				],
				"exitDirection": "-Y",
				"color": 3120282,
				"lengthClass": "long"
			},
			{
				"id": "arrow-32",
				"path": [
					[
						8,
						0,
						3
					],
					[
						8,
						0,
						4
					],
					[
						8,
						1,
						4
					],
					[
						10,
						1,
						4
					],
					[
						10,
						1,
						5
					]
				],
				"exitDirection": "+Z",
				"color": 15698492,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-33",
				"path": [
					[
						7,
						2,
						4
					],
					[
						8,
						2,
						4
					],
					[
						8,
						4,
						4
					],
					[
						8,
						4,
						2
					]
				],
				"exitDirection": "-Z",
				"color": 14704481,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-34",
				"path": [
					[
						5,
						6,
						8
					],
					[
						5,
						6,
						6
					],
					[
						4,
						6,
						6
					],
					[
						4,
						6,
						7
					]
				],
				"exitDirection": "+Z",
				"color": 15770560,
				"lengthClass": "short"
			},
			{
				"id": "arrow-35",
				"path": [
					[
						4,
						3,
						10
					],
					[
						2,
						3,
						10
					],
					[
						2,
						3,
						9
					],
					[
						2,
						6,
						9
					],
					[
						5,
						6,
						9
					]
				],
				"exitDirection": "+X",
				"color": 9400245,
				"lengthClass": "long"
			},
			{
				"id": "arrow-36",
				"path": [
					[
						7,
						1,
						1
					],
					[
						7,
						1,
						2
					],
					[
						6,
						1,
						2
					],
					[
						6,
						2,
						2
					],
					[
						6,
						2,
						0
					]
				],
				"exitDirection": "-Z",
				"color": 4946377,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-37",
				"path": [
					[
						4,
						1,
						8
					],
					[
						4,
						1,
						7
					],
					[
						2,
						1,
						7
					],
					[
						2,
						2,
						7
					],
					[
						2,
						2,
						9
					]
				],
				"exitDirection": "+Z",
				"color": 6661503,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-38",
				"path": [
					[
						7,
						7,
						7
					],
					[
						9,
						7,
						7
					],
					[
						9,
						7,
						9
					],
					[
						9,
						5,
						9
					]
				],
				"exitDirection": "-Y",
				"color": 16039987,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-39",
				"path": [
					[
						7,
						2,
						7
					],
					[
						7,
						3,
						7
					],
					[
						7,
						3,
						9
					],
					[
						9,
						3,
						9
					],
					[
						9,
						3,
						8
					]
				],
				"exitDirection": "-Z",
				"color": 3120282,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-40",
				"path": [
					[
						6,
						6,
						0
					],
					[
						6,
						3,
						0
					],
					[
						6,
						3,
						1
					],
					[
						9,
						3,
						1
					],
					[
						9,
						4,
						1
					]
				],
				"exitDirection": "-Z",
				"color": 15698492,
				"lengthClass": "long"
			},
			{
				"id": "arrow-41",
				"path": [
					[
						3,
						9,
						8
					],
					[
						3,
						9,
						6
					],
					[
						4,
						9,
						6
					],
					[
						4,
						7,
						6
					],
					[
						4,
						7,
						8
					]
				],
				"exitDirection": "+Z",
				"color": 14704481,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-42",
				"path": [
					[
						5,
						8,
						10
					],
					[
						5,
						6,
						10
					],
					[
						4,
						6,
						10
					],
					[
						4,
						7,
						10
					],
					[
						3,
						7,
						10
					]
				],
				"exitDirection": "-X",
				"color": 15770560,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-43",
				"path": [
					[
						5,
						3,
						10
					],
					[
						8,
						3,
						10
					],
					[
						8,
						4,
						10
					],
					[
						8,
						4,
						8
					],
					[
						8,
						7,
						8
					]
				],
				"exitDirection": "+Y",
				"color": 9400245,
				"lengthClass": "long"
			},
			{
				"id": "arrow-44",
				"path": [
					[
						6,
						7,
						1
					],
					[
						6,
						7,
						3
					],
					[
						7,
						7,
						3
					]
				],
				"exitDirection": "+X",
				"color": 4946377,
				"lengthClass": "short"
			},
			{
				"id": "arrow-45",
				"path": [
					[
						8,
						10,
						5
					],
					[
						10,
						10,
						5
					],
					[
						10,
						8,
						5
					],
					[
						10,
						8,
						3
					],
					[
						10,
						6,
						3
					]
				],
				"exitDirection": "-Z",
				"color": 6661503,
				"lengthClass": "long"
			},
			{
				"id": "arrow-46",
				"path": [
					[
						8,
						3,
						2
					],
					[
						10,
						3,
						2
					],
					[
						10,
						3,
						3
					],
					[
						10,
						4,
						3
					],
					[
						10,
						4,
						2
					]
				],
				"exitDirection": "-Z",
				"color": 16039987,
				"lengthClass": "medium"
			}
		],
		"solution": [
			"arrow-46",
			"arrow-45",
			"arrow-44",
			"arrow-43",
			"arrow-42",
			"arrow-41",
			"arrow-40",
			"arrow-39",
			"arrow-38",
			"arrow-37",
			"arrow-36",
			"arrow-35",
			"arrow-34",
			"arrow-33",
			"arrow-32",
			"arrow-31",
			"arrow-30",
			"arrow-29",
			"arrow-28",
			"arrow-27",
			"arrow-26",
			"arrow-25",
			"arrow-24",
			"arrow-23",
			"arrow-22",
			"arrow-21",
			"arrow-20",
			"arrow-19",
			"arrow-18",
			"arrow-17",
			"arrow-16",
			"arrow-15",
			"arrow-14",
			"arrow-13",
			"arrow-12",
			"arrow-11",
			"arrow-10"
		],
		"initiallyFree": 13
	},
	"rush-09": {
		"arrows": [
			{
				"id": "arrow-11",
				"path": [
					[
						3,
						10,
						7
					],
					[
						5,
						10,
						7
					],
					[
						5,
						8,
						7
					],
					[
						5,
						8,
						10
					],
					[
						5,
						6,
						10
					]
				],
				"exitDirection": "-Y",
				"color": 16039987,
				"lengthClass": "long"
			},
			{
				"id": "arrow-12",
				"path": [
					[
						7,
						4,
						8
					],
					[
						6,
						4,
						8
					],
					[
						6,
						4,
						10
					],
					[
						5,
						4,
						10
					],
					[
						5,
						3,
						10
					]
				],
				"exitDirection": "-Y",
				"color": 4946377,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-13",
				"path": [
					[
						6,
						8,
						6
					],
					[
						6,
						5,
						6
					],
					[
						9,
						5,
						6
					],
					[
						9,
						5,
						8
					],
					[
						9,
						2,
						8
					]
				],
				"exitDirection": "-Y",
				"color": 3120282,
				"lengthClass": "long"
			},
			{
				"id": "arrow-14",
				"path": [
					[
						7,
						1,
						5
					],
					[
						7,
						1,
						8
					],
					[
						4,
						1,
						8
					],
					[
						4,
						1,
						10
					],
					[
						6,
						1,
						10
					]
				],
				"exitDirection": "+X",
				"color": 6661503,
				"lengthClass": "long"
			},
			{
				"id": "arrow-15",
				"path": [
					[
						7,
						0,
						5
					],
					[
						7,
						0,
						7
					],
					[
						10,
						0,
						7
					],
					[
						10,
						0,
						10
					],
					[
						10,
						2,
						10
					]
				],
				"exitDirection": "+Y",
				"color": 15698492,
				"lengthClass": "long"
			},
			{
				"id": "arrow-16",
				"path": [
					[
						8,
						3,
						10
					],
					[
						8,
						6,
						10
					],
					[
						10,
						6,
						10
					],
					[
						10,
						9,
						10
					],
					[
						9,
						9,
						10
					]
				],
				"exitDirection": "-X",
				"color": 14704481,
				"lengthClass": "long"
			},
			{
				"id": "arrow-17",
				"path": [
					[
						1,
						6,
						8
					],
					[
						1,
						6,
						10
					],
					[
						4,
						6,
						10
					],
					[
						4,
						9,
						10
					],
					[
						1,
						9,
						10
					]
				],
				"exitDirection": "-X",
				"color": 15770560,
				"lengthClass": "long"
			},
			{
				"id": "arrow-18",
				"path": [
					[
						3,
						9,
						8
					],
					[
						0,
						9,
						8
					],
					[
						0,
						6,
						8
					],
					[
						0,
						6,
						10
					],
					[
						0,
						4,
						10
					]
				],
				"exitDirection": "-Y",
				"color": 9400245,
				"lengthClass": "long"
			},
			{
				"id": "arrow-19",
				"path": [
					[
						6,
						0,
						10
					],
					[
						3,
						0,
						10
					],
					[
						3,
						2,
						10
					],
					[
						0,
						2,
						10
					],
					[
						0,
						2,
						9
					]
				],
				"exitDirection": "-Z",
				"color": 16039987,
				"lengthClass": "long"
			},
			{
				"id": "arrow-20",
				"path": [
					[
						6,
						0,
						8
					],
					[
						3,
						0,
						8
					],
					[
						3,
						0,
						6
					],
					[
						0,
						0,
						6
					],
					[
						0,
						2,
						6
					],
					[
						1,
						2,
						6
					]
				],
				"exitDirection": "+X",
				"color": 4946377,
				"lengthClass": "long"
			},
			{
				"id": "arrow-21",
				"path": [
					[
						2,
						0,
						5
					],
					[
						0,
						0,
						5
					],
					[
						0,
						2,
						5
					],
					[
						0,
						2,
						2
					],
					[
						0,
						5,
						2
					]
				],
				"exitDirection": "+Y",
				"color": 3120282,
				"lengthClass": "long"
			},
			{
				"id": "arrow-22",
				"path": [
					[
						10,
						6,
						3
					],
					[
						10,
						4,
						3
					],
					[
						9,
						4,
						3
					],
					[
						9,
						4,
						6
					],
					[
						6,
						4,
						6
					],
					[
						6,
						1,
						6
					]
				],
				"exitDirection": "-Y",
				"color": 6661503,
				"lengthClass": "long"
			},
			{
				"id": "arrow-23",
				"path": [
					[
						0,
						5,
						4
					],
					[
						3,
						5,
						4
					],
					[
						3,
						7,
						4
					],
					[
						3,
						7,
						2
					],
					[
						0,
						7,
						2
					],
					[
						0,
						9,
						2
					]
				],
				"exitDirection": "+Y",
				"color": 15698492,
				"lengthClass": "long"
			},
			{
				"id": "arrow-24",
				"path": [
					[
						8,
						2,
						9
					],
					[
						8,
						0,
						9
					],
					[
						8,
						0,
						8
					],
					[
						9,
						0,
						8
					],
					[
						9,
						0,
						9
					]
				],
				"exitDirection": "+Z",
				"color": 14704481,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-25",
				"path": [
					[
						7,
						2,
						5
					],
					[
						7,
						4,
						5
					],
					[
						6,
						4,
						5
					],
					[
						6,
						4,
						3
					]
				],
				"exitDirection": "-Z",
				"color": 15770560,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-26",
				"path": [
					[
						4,
						3,
						0
					],
					[
						4,
						4,
						0
					],
					[
						4,
						4,
						1
					],
					[
						6,
						4,
						1
					],
					[
						6,
						3,
						1
					]
				],
				"exitDirection": "-Y",
				"color": 9400245,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-27",
				"path": [
					[
						8,
						1,
						3
					],
					[
						6,
						1,
						3
					],
					[
						6,
						1,
						1
					],
					[
						7,
						1,
						1
					]
				],
				"exitDirection": "+X",
				"color": 16039987,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-28",
				"path": [
					[
						7,
						0,
						3
					],
					[
						9,
						0,
						3
					],
					[
						9,
						0,
						1
					],
					[
						9,
						2,
						1
					]
				],
				"exitDirection": "+Y",
				"color": 4946377,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-29",
				"path": [
					[
						10,
						4,
						2
					],
					[
						10,
						6,
						2
					],
					[
						9,
						6,
						2
					],
					[
						9,
						6,
						1
					],
					[
						9,
						7,
						1
					]
				],
				"exitDirection": "+Y",
				"color": 3120282,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-30",
				"path": [
					[
						8,
						7,
						2
					],
					[
						10,
						7,
						2
					],
					[
						10,
						9,
						2
					],
					[
						10,
						9,
						1
					],
					[
						8,
						9,
						1
					]
				],
				"exitDirection": "-X",
				"color": 6661503,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-31",
				"path": [
					[
						6,
						10,
						3
					],
					[
						6,
						10,
						1
					],
					[
						4,
						10,
						1
					],
					[
						4,
						9,
						1
					],
					[
						2,
						9,
						1
					]
				],
				"exitDirection": "-X",
				"color": 15698492,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-32",
				"path": [
					[
						2,
						10,
						0
					],
					[
						2,
						10,
						1
					],
					[
						0,
						10,
						1
					],
					[
						0,
						8,
						1
					]
				],
				"exitDirection": "-Y",
				"color": 14704481,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-33",
				"path": [
					[
						2,
						3,
						1
					],
					[
						2,
						4,
						1
					],
					[
						0,
						4,
						1
					],
					[
						0,
						2,
						1
					]
				],
				"exitDirection": "-Y",
				"color": 15770560,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-34",
				"path": [
					[
						2,
						5,
						8
					],
					[
						2,
						5,
						7
					],
					[
						2,
						7,
						7
					],
					[
						1,
						7,
						7
					]
				],
				"exitDirection": "-X",
				"color": 9400245,
				"lengthClass": "short"
			},
			{
				"id": "arrow-35",
				"path": [
					[
						10,
						1,
						1
					],
					[
						10,
						1,
						0
					],
					[
						9,
						1,
						0
					],
					[
						9,
						2,
						0
					]
				],
				"exitDirection": "+Y",
				"color": 16039987,
				"lengthClass": "short"
			},
			{
				"id": "arrow-36",
				"path": [
					[
						10,
						4,
						1
					],
					[
						10,
						5,
						1
					],
					[
						10,
						5,
						0
					],
					[
						10,
						6,
						0
					],
					[
						8,
						6,
						0
					]
				],
				"exitDirection": "-X",
				"color": 4946377,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-37",
				"path": [
					[
						3,
						5,
						1
					],
					[
						5,
						5,
						1
					],
					[
						5,
						5,
						0
					],
					[
						5,
						7,
						0
					]
				],
				"exitDirection": "+Y",
				"color": 3120282,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-38",
				"path": [
					[
						6,
						10,
						0
					],
					[
						8,
						10,
						0
					],
					[
						8,
						10,
						1
					],
					[
						10,
						10,
						1
					]
				],
				"exitDirection": "+X",
				"color": 6661503,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-39",
				"path": [
					[
						1,
						2,
						3
					],
					[
						1,
						2,
						1
					],
					[
						2,
						2,
						1
					],
					[
						2,
						0,
						1
					],
					[
						0,
						0,
						1
					]
				],
				"exitDirection": "-X",
				"color": 15698492,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-40",
				"path": [
					[
						6,
						9,
						1
					],
					[
						6,
						9,
						0
					],
					[
						4,
						9,
						0
					]
				],
				"exitDirection": "-X",
				"color": 14704481,
				"lengthClass": "short"
			},
			{
				"id": "arrow-41",
				"path": [
					[
						1,
						10,
						0
					],
					[
						0,
						10,
						0
					],
					[
						0,
						9,
						0
					],
					[
						2,
						9,
						0
					],
					[
						2,
						8,
						0
					]
				],
				"exitDirection": "-Y",
				"color": 15770560,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-42",
				"path": [
					[
						4,
						2,
						0
					],
					[
						2,
						2,
						0
					],
					[
						2,
						0,
						0
					],
					[
						1,
						0,
						0
					]
				],
				"exitDirection": "-X",
				"color": 9400245,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-43",
				"path": [
					[
						3,
						8,
						3
					],
					[
						3,
						8,
						4
					],
					[
						3,
						10,
						4
					],
					[
						3,
						10,
						3
					],
					[
						2,
						10,
						3
					]
				],
				"exitDirection": "-X",
				"color": 16039987,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-44",
				"path": [
					[
						1,
						6,
						3
					],
					[
						1,
						8,
						3
					],
					[
						0,
						8,
						3
					],
					[
						0,
						10,
						3
					],
					[
						0,
						10,
						4
					]
				],
				"exitDirection": "+Z",
				"color": 4946377,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-45",
				"path": [
					[
						2,
						10,
						8
					],
					[
						0,
						10,
						8
					],
					[
						0,
						10,
						9
					]
				],
				"exitDirection": "+Z",
				"color": 3120282,
				"lengthClass": "short"
			},
			{
				"id": "arrow-46",
				"path": [
					[
						0,
						0,
						2
					],
					[
						0,
						1,
						2
					],
					[
						1,
						1,
						2
					],
					[
						1,
						1,
						3
					]
				],
				"exitDirection": "+Z",
				"color": 6661503,
				"lengthClass": "short"
			},
			{
				"id": "arrow-47",
				"path": [
					[
						2,
						0,
						7
					],
					[
						0,
						0,
						7
					],
					[
						0,
						1,
						7
					],
					[
						1,
						1,
						7
					],
					[
						1,
						1,
						9
					]
				],
				"exitDirection": "+Z",
				"color": 15698492,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-48",
				"path": [
					[
						4,
						0,
						0
					],
					[
						4,
						1,
						0
					],
					[
						4,
						1,
						3
					],
					[
						4,
						4,
						3
					],
					[
						2,
						4,
						3
					]
				],
				"exitDirection": "-X",
				"color": 14704481,
				"lengthClass": "long"
			},
			{
				"id": "arrow-49",
				"path": [
					[
						8,
						1,
						0
					],
					[
						8,
						3,
						0
					],
					[
						8,
						3,
						2
					],
					[
						9,
						3,
						2
					]
				],
				"exitDirection": "+X",
				"color": 15770560,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-50",
				"path": [
					[
						0,
						10,
						7
					],
					[
						2,
						10,
						7
					],
					[
						2,
						9,
						7
					],
					[
						2,
						9,
						4
					],
					[
						2,
						6,
						4
					],
					[
						2,
						6,
						1
					]
				],
				"exitDirection": "-Z",
				"color": 9400245,
				"lengthClass": "long"
			}
		],
		"solution": [
			"arrow-50",
			"arrow-49",
			"arrow-48",
			"arrow-47",
			"arrow-46",
			"arrow-45",
			"arrow-44",
			"arrow-43",
			"arrow-42",
			"arrow-41",
			"arrow-40",
			"arrow-39",
			"arrow-38",
			"arrow-37",
			"arrow-36",
			"arrow-35",
			"arrow-34",
			"arrow-33",
			"arrow-32",
			"arrow-31",
			"arrow-30",
			"arrow-29",
			"arrow-28",
			"arrow-27",
			"arrow-26",
			"arrow-25",
			"arrow-24",
			"arrow-23",
			"arrow-22",
			"arrow-21",
			"arrow-20",
			"arrow-19",
			"arrow-18",
			"arrow-17",
			"arrow-16",
			"arrow-15",
			"arrow-14",
			"arrow-13",
			"arrow-12",
			"arrow-11"
		],
		"initiallyFree": 13
	},
	"rush-10": {
		"arrows": [
			{
				"id": "arrow-11",
				"path": [
					[
						6,
						9,
						9
					],
					[
						8,
						9,
						9
					],
					[
						8,
						9,
						7
					],
					[
						5,
						9,
						7
					],
					[
						5,
						9,
						4
					]
				],
				"exitDirection": "-Z",
				"color": 16039987,
				"lengthClass": "long"
			},
			{
				"id": "arrow-12",
				"path": [
					[
						4,
						6,
						8
					],
					[
						1,
						6,
						8
					],
					[
						1,
						6,
						7
					],
					[
						3,
						6,
						7
					],
					[
						3,
						9,
						7
					]
				],
				"exitDirection": "+Y",
				"color": 15698492,
				"lengthClass": "long"
			},
			{
				"id": "arrow-13",
				"path": [
					[
						4,
						7,
						8
					],
					[
						4,
						7,
						5
					],
					[
						4,
						4,
						5
					],
					[
						2,
						4,
						5
					],
					[
						2,
						4,
						2
					]
				],
				"exitDirection": "-Z",
				"color": 9400245,
				"lengthClass": "long"
			},
			{
				"id": "arrow-14",
				"path": [
					[
						4,
						3,
						6
					],
					[
						4,
						0,
						6
					],
					[
						7,
						0,
						6
					],
					[
						7,
						0,
						3
					],
					[
						9,
						0,
						3
					],
					[
						9,
						1,
						3
					]
				],
				"exitDirection": "+Y",
				"color": 14704481,
				"lengthClass": "long"
			},
			{
				"id": "arrow-15",
				"path": [
					[
						5,
						10,
						7
					],
					[
						5,
						10,
						5
					],
					[
						7,
						10,
						5
					],
					[
						7,
						10,
						2
					],
					[
						7,
						9,
						2
					],
					[
						4,
						9,
						2
					]
				],
				"exitDirection": "-X",
				"color": 3120282,
				"lengthClass": "long"
			},
			{
				"id": "arrow-16",
				"path": [
					[
						8,
						10,
						5
					],
					[
						8,
						10,
						3
					],
					[
						9,
						10,
						3
					],
					[
						9,
						10,
						4
					]
				],
				"exitDirection": "+Z",
				"color": 6661503,
				"lengthClass": "short"
			},
			{
				"id": "arrow-17",
				"path": [
					[
						4,
						5,
						4
					],
					[
						4,
						7,
						4
					],
					[
						2,
						7,
						4
					],
					[
						2,
						7,
						1
					],
					[
						2,
						9,
						1
					],
					[
						2,
						9,
						3
					]
				],
				"exitDirection": "+Z",
				"color": 15770560,
				"lengthClass": "long"
			},
			{
				"id": "arrow-18",
				"path": [
					[
						4,
						10,
						7
					],
					[
						4,
						10,
						4
					],
					[
						2,
						10,
						4
					],
					[
						2,
						10,
						6
					],
					[
						2,
						8,
						6
					]
				],
				"exitDirection": "-Y",
				"color": 4946377,
				"lengthClass": "long"
			},
			{
				"id": "arrow-19",
				"path": [
					[
						1,
						2,
						6
					],
					[
						1,
						2,
						3
					],
					[
						1,
						0,
						3
					],
					[
						2,
						0,
						3
					],
					[
						2,
						3,
						3
					],
					[
						2,
						3,
						6
					]
				],
				"exitDirection": "+Z",
				"color": 16039987,
				"lengthClass": "long"
			},
			{
				"id": "arrow-20",
				"path": [
					[
						9,
						9,
						7
					],
					[
						9,
						9,
						8
					],
					[
						9,
						10,
						8
					],
					[
						8,
						10,
						8
					]
				],
				"exitDirection": "-X",
				"color": 15698492,
				"lengthClass": "short"
			},
			{
				"id": "arrow-21",
				"path": [
					[
						5,
						10,
						8
					],
					[
						3,
						10,
						8
					],
					[
						3,
						7,
						8
					],
					[
						1,
						7,
						8
					],
					[
						1,
						10,
						8
					],
					[
						1,
						10,
						7
					]
				],
				"exitDirection": "-Z",
				"color": 9400245,
				"lengthClass": "long"
			},
			{
				"id": "arrow-22",
				"path": [
					[
						3,
						7,
						5
					],
					[
						0,
						7,
						5
					],
					[
						0,
						10,
						5
					],
					[
						1,
						10,
						5
					],
					[
						1,
						10,
						3
					]
				],
				"exitDirection": "-Z",
				"color": 14704481,
				"lengthClass": "long"
			},
			{
				"id": "arrow-23",
				"path": [
					[
						3,
						3,
						8
					],
					[
						2,
						3,
						8
					],
					[
						2,
						3,
						9
					],
					[
						2,
						2,
						9
					]
				],
				"exitDirection": "-Y",
				"color": 3120282,
				"lengthClass": "short"
			},
			{
				"id": "arrow-24",
				"path": [
					[
						5,
						3,
						4
					],
					[
						5,
						5,
						4
					],
					[
						6,
						5,
						4
					]
				],
				"exitDirection": "+X",
				"color": 6661503,
				"lengthClass": "short"
			},
			{
				"id": "arrow-25",
				"path": [
					[
						9,
						7,
						6
					],
					[
						9,
						6,
						6
					],
					[
						9,
						6,
						4
					],
					[
						10,
						6,
						4
					],
					[
						10,
						4,
						4
					]
				],
				"exitDirection": "-Y",
				"color": 15770560,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-26",
				"path": [
					[
						8,
						0,
						6
					],
					[
						8,
						0,
						4
					],
					[
						10,
						0,
						4
					],
					[
						10,
						0,
						5
					]
				],
				"exitDirection": "+Z",
				"color": 4946377,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-27",
				"path": [
					[
						4,
						0,
						5
					],
					[
						4,
						0,
						4
					],
					[
						6,
						0,
						4
					],
					[
						6,
						0,
						3
					],
					[
						6,
						2,
						3
					]
				],
				"exitDirection": "+Y",
				"color": 16039987,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-28",
				"path": [
					[
						5,
						2,
						4
					],
					[
						5,
						2,
						3
					],
					[
						5,
						4,
						3
					],
					[
						7,
						4,
						3
					]
				],
				"exitDirection": "+X",
				"color": 15698492,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-29",
				"path": [
					[
						7,
						5,
						5
					],
					[
						9,
						5,
						5
					],
					[
						9,
						5,
						3
					],
					[
						9,
						4,
						3
					],
					[
						9,
						4,
						4
					]
				],
				"exitDirection": "+Z",
				"color": 9400245,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-30",
				"path": [
					[
						3,
						7,
						3
					],
					[
						3,
						8,
						3
					],
					[
						3,
						8,
						5
					],
					[
						1,
						8,
						5
					],
					[
						1,
						8,
						4
					]
				],
				"exitDirection": "-Z",
				"color": 14704481,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-31",
				"path": [
					[
						10,
						6,
						5
					],
					[
						10,
						6,
						6
					],
					[
						10,
						4,
						6
					],
					[
						8,
						4,
						6
					]
				],
				"exitDirection": "-X",
				"color": 3120282,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-32",
				"path": [
					[
						1,
						5,
						5
					],
					[
						3,
						5,
						5
					],
					[
						3,
						5,
						6
					],
					[
						3,
						3,
						6
					]
				],
				"exitDirection": "-Y",
				"color": 6661503,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-33",
				"path": [
					[
						2,
						6,
						4
					],
					[
						2,
						6,
						2
					],
					[
						1,
						6,
						2
					],
					[
						1,
						8,
						2
					],
					[
						2,
						8,
						2
					]
				],
				"exitDirection": "+X",
				"color": 15770560,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-34",
				"path": [
					[
						2,
						0,
						6
					],
					[
						3,
						0,
						6
					],
					[
						3,
						0,
						5
					],
					[
						3,
						1,
						5
					],
					[
						3,
						1,
						7
					]
				],
				"exitDirection": "+Z",
				"color": 4946377,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-35",
				"path": [
					[
						5,
						7,
						4
					],
					[
						5,
						8,
						4
					],
					[
						5,
						8,
						2
					],
					[
						7,
						8,
						2
					]
				],
				"exitDirection": "+X",
				"color": 16039987,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-36",
				"path": [
					[
						8,
						9,
						4
					],
					[
						8,
						9,
						3
					],
					[
						9,
						9,
						3
					],
					[
						9,
						9,
						2
					],
					[
						9,
						7,
						2
					]
				],
				"exitDirection": "-Y",
				"color": 15698492,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-37",
				"path": [
					[
						7,
						0,
						2
					],
					[
						9,
						0,
						2
					],
					[
						9,
						2,
						2
					],
					[
						8,
						2,
						2
					]
				],
				"exitDirection": "-X",
				"color": 9400245,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-38",
				"path": [
					[
						6,
						0,
						1
					],
					[
						6,
						0,
						2
					],
					[
						6,
						2,
						2
					],
					[
						4,
						2,
						2
					]
				],
				"exitDirection": "-X",
				"color": 14704481,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-39",
				"path": [
					[
						8,
						8,
						3
					],
					[
						8,
						7,
						3
					],
					[
						8,
						7,
						4
					],
					[
						10,
						7,
						4
					],
					[
						10,
						7,
						6
					]
				],
				"exitDirection": "+Z",
				"color": 3120282,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-40",
				"path": [
					[
						1,
						4,
						4
					],
					[
						1,
						4,
						2
					],
					[
						1,
						3,
						2
					],
					[
						2,
						3,
						2
					],
					[
						2,
						1,
						2
					]
				],
				"exitDirection": "-Y",
				"color": 6661503,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-41",
				"path": [
					[
						8,
						2,
						3
					],
					[
						8,
						3,
						3
					],
					[
						8,
						3,
						2
					],
					[
						9,
						3,
						2
					]
				],
				"exitDirection": "+X",
				"color": 15770560,
				"lengthClass": "short"
			},
			{
				"id": "arrow-42",
				"path": [
					[
						3,
						3,
						4
					],
					[
						3,
						3,
						3
					],
					[
						4,
						3,
						3
					],
					[
						4,
						4,
						3
					]
				],
				"exitDirection": "+Y",
				"color": 4946377,
				"lengthClass": "short"
			},
			{
				"id": "arrow-43",
				"path": [
					[
						3,
						7,
						1
					],
					[
						3,
						6,
						1
					],
					[
						3,
						6,
						3
					],
					[
						4,
						6,
						3
					],
					[
						4,
						8,
						3
					]
				],
				"exitDirection": "+Y",
				"color": 16039987,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-44",
				"path": [
					[
						5,
						10,
						4
					],
					[
						6,
						10,
						4
					],
					[
						6,
						10,
						3
					],
					[
						4,
						10,
						3
					],
					[
						4,
						10,
						2
					]
				],
				"exitDirection": "-Z",
				"color": 15698492,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-45",
				"path": [
					[
						6,
						7,
						5
					],
					[
						6,
						7,
						2
					],
					[
						4,
						7,
						2
					],
					[
						4,
						7,
						0
					],
					[
						4,
						10,
						0
					],
					[
						5,
						10,
						0
					]
				],
				"exitDirection": "+X",
				"color": 9400245,
				"lengthClass": "long"
			},
			{
				"id": "arrow-46",
				"path": [
					[
						6,
						8,
						4
					],
					[
						6,
						8,
						5
					],
					[
						6,
						9,
						5
					],
					[
						7,
						9,
						5
					]
				],
				"exitDirection": "+X",
				"color": 14704481,
				"lengthClass": "short"
			},
			{
				"id": "arrow-47",
				"path": [
					[
						6,
						2,
						10
					],
					[
						6,
						2,
						9
					],
					[
						6,
						4,
						9
					],
					[
						7,
						4,
						9
					]
				],
				"exitDirection": "+X",
				"color": 3120282,
				"lengthClass": "short"
			},
			{
				"id": "arrow-48",
				"path": [
					[
						0,
						3,
						5
					],
					[
						1,
						3,
						5
					],
					[
						1,
						3,
						6
					],
					[
						1,
						4,
						6
					]
				],
				"exitDirection": "+Y",
				"color": 6661503,
				"lengthClass": "short"
			},
			{
				"id": "arrow-49",
				"path": [
					[
						0,
						6,
						5
					],
					[
						0,
						6,
						6
					],
					[
						0,
						7,
						6
					],
					[
						1,
						7,
						6
					],
					[
						1,
						9,
						6
					]
				],
				"exitDirection": "-X",
				"color": 15770560,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-50",
				"path": [
					[
						6,
						4,
						2
					],
					[
						8,
						4,
						2
					],
					[
						8,
						5,
						2
					],
					[
						8,
						5,
						3
					],
					[
						7,
						5,
						3
					]
				],
				"exitDirection": "-X",
				"color": 4946377,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-51",
				"path": [
					[
						0,
						4,
						6
					],
					[
						0,
						2,
						6
					],
					[
						0,
						2,
						4
					],
					[
						0,
						5,
						4
					],
					[
						3,
						5,
						4
					],
					[
						3,
						5,
						2
					]
				],
				"exitDirection": "-Z",
				"color": 16039987,
				"lengthClass": "long"
			},
			{
				"id": "arrow-52",
				"path": [
					[
						5,
						10,
						10
					],
					[
						5,
						8,
						10
					],
					[
						4,
						8,
						10
					],
					[
						4,
						8,
						9
					],
					[
						3,
						8,
						9
					]
				],
				"exitDirection": "-X",
				"color": 15698492,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-53",
				"path": [
					[
						6,
						3,
						7
					],
					[
						6,
						1,
						7
					],
					[
						6,
						1,
						5
					],
					[
						6,
						2,
						5
					],
					[
						7,
						2,
						5
					]
				],
				"exitDirection": "+X",
				"color": 9400245,
				"lengthClass": "medium"
			},
			{
				"id": "arrow-54",
				"path": [
					[
						10,
						1,
						6
					],
					[
						9,
						1,
						6
					],
					[
						9,
						3,
						6
					],
					[
						9,
						3,
						5
					],
					[
						9,
						1,
						5
					]
				],
				"exitDirection": "+X",
				"color": 14704481,
				"lengthClass": "medium"
			}
		],
		"solution": [
			"arrow-54",
			"arrow-53",
			"arrow-52",
			"arrow-51",
			"arrow-50",
			"arrow-49",
			"arrow-48",
			"arrow-47",
			"arrow-46",
			"arrow-45",
			"arrow-44",
			"arrow-43",
			"arrow-42",
			"arrow-41",
			"arrow-40",
			"arrow-39",
			"arrow-38",
			"arrow-37",
			"arrow-36",
			"arrow-35",
			"arrow-34",
			"arrow-33",
			"arrow-32",
			"arrow-31",
			"arrow-30",
			"arrow-29",
			"arrow-28",
			"arrow-27",
			"arrow-26",
			"arrow-25",
			"arrow-24",
			"arrow-23",
			"arrow-22",
			"arrow-21",
			"arrow-20",
			"arrow-19",
			"arrow-18",
			"arrow-17",
			"arrow-16",
			"arrow-15",
			"arrow-14",
			"arrow-13",
			"arrow-12",
			"arrow-11"
		],
		"initiallyFree": 16
	}
};
//#endregion
//#region src/puzzle/randomChallengeModes.ts
var RANDOM_CHALLENGE_MODE_WEIGHTS = Object.freeze([
	{
		mode: "standard",
		weight: 20
	},
	{
		mode: "exploration",
		weight: 20
	},
	{
		mode: "skill",
		weight: 20
	},
	{
		mode: "double-ended",
		weight: 20
	},
	{
		mode: "rush",
		weight: 20
	}
]);
function mixSeed$2(seed) {
	let mixed = seed >>> 0;
	mixed ^= mixed >>> 16;
	mixed = Math.imul(mixed, 2146121005);
	mixed ^= mixed >>> 15;
	mixed = Math.imul(mixed, 2221713035);
	mixed ^= mixed >>> 16;
	return mixed >>> 0;
}
function selectRandomChallengeMode(selectionSeed) {
	const totalWeight = RANDOM_CHALLENGE_MODE_WEIGHTS.reduce((total, entry) => total + entry.weight, 0);
	const roll = mixSeed$2(selectionSeed ^ 2654435769) % totalWeight;
	let cumulativeWeight = 0;
	for (const entry of RANDOM_CHALLENGE_MODE_WEIGHTS) {
		cumulativeWeight += entry.weight;
		if (roll < cumulativeWeight) return entry.mode;
	}
	return "standard";
}
//#endregion
//#region src/puzzle/rushChallenges.ts
var VERIFIED = Object.freeze({
	solvable: true,
	geometrySafe: true
});
Object.freeze({
	challengeCount: 2,
	minimumShortShare: .6,
	maximumLongShare: 0,
	maximumAverageTurns: 2.2
});
function rushLevel(id, seed, shape, difficulty, referenceTargetCount, tuning = {}) {
	const targetCount = tuning.targetCount ?? Math.ceil(referenceTargetCount * .8);
	const warmup = tuning.warmup === true;
	return {
		id: 100 + id,
		seed,
		label: `RUSH ${id.toString().padStart(2, "0")} · ${shape}`,
		shape,
		difficulty,
		targetCount,
		lengthQuota: tuning.lengthQuota ?? {
			short: .1,
			medium: .45,
			long: .45
		},
		minInitiallyFree: warmup ? Math.max(5, Math.ceil(targetCount * .3)) : Math.max(2, Math.floor(targetCount * .2)),
		maxInitiallyFree: warmup ? Math.max(8, Math.ceil(targetCount * .5)) : Math.max(3, Math.ceil(targetCount * .42)),
		boundaryHeadRatio: warmup ? .28 : .055,
		halfExtents: [
			5,
			5,
			5
		],
		minSpans: warmup ? [
			6,
			6,
			6
		] : [
			8,
			8,
			8
		],
		minNeighborRatio: warmup ? .26 : .38,
		minDensity: warmup ? .12 : .2,
		cameraRadius: warmup ? 20.8 : 22.8,
		referenceTargetCount
	};
}
function card(id, title, objective, timeLimitSeconds, level) {
	const challengeId = `rush-${id.toString().padStart(2, "0")}`;
	const layout = RUSH_LAYOUTS[challengeId];
	if (!layout) throw new Error(`Missing fixed layout for ${challengeId}.`);
	return Object.freeze({
		id: challengeId,
		title,
		objective,
		timeLimitSeconds,
		level,
		layout,
		validation: VERIFIED
	});
}
var RUSH_CHALLENGES = Object.freeze([
	card(1, {
		zh: "樱核热身",
		en: "SAKURA CORE WARM-UP"
	}, {
		zh: "快速清空 20 条短线束",
		en: "Quick-clear 20 short cables"
	}, 43, rushLevel(1, 329631713, "cube", "easy", 42, {
		targetCount: 20,
		lengthQuota: {
			short: .8,
			medium: .2,
			long: 0
		},
		warmup: true
	})),
	card(2, {
		zh: "花筒起速",
		en: "BLOOM CYLINDER START"
	}, {
		zh: "快速清空 22 条少转角线束",
		en: "Quick-clear 22 low-turn cables"
	}, 47, rushLevel(2, 746557875, "cylinder", "easy", 42, {
		targetCount: 22,
		lengthQuota: {
			short: .7,
			medium: .3,
			long: 0
		},
		warmup: true
	})),
	card(3, {
		zh: "球心追线",
		en: "SPHERE CORE CHASE"
	}, {
		zh: "清空 34 条球形线束",
		en: "Clear all 34 sphere cables"
	}, 67, rushLevel(3, 936682089, "sphere", "normal", 42)),
	card(4, {
		zh: "八面突围",
		en: "OCTA BREAKOUT"
	}, {
		zh: "清空 34 条八面体线束",
		en: "Clear all 34 octahedron cables"
	}, 69, rushLevel(4, 1219683799, "octahedron", "normal", 42)),
	card(5, {
		zh: "樱核加速",
		en: "SAKURA CORE ACCEL"
	}, {
		zh: "清空 37 条方体线束",
		en: "Clear all 37 cube cables"
	}, 74, rushLevel(5, 1578747011, "cube", "normal", 46)),
	card(6, {
		zh: "环柱穿梭",
		en: "CYLINDER SHUTTLE"
	}, {
		zh: "清空 37 条圆柱线束",
		en: "Clear all 37 cylinder cables"
	}, 78, rushLevel(6, 1777578405, "cylinder", "hard", 46)),
	card(7, {
		zh: "球阵冲刺",
		en: "SPHERE GRID SPRINT"
	}, {
		zh: "清空 37 条球形线束",
		en: "Clear all 37 sphere cables"
	}, 81, rushLevel(7, 2060813007, "sphere", "hard", 46)),
	card(8, {
		zh: "八面折返",
		en: "OCTA TURNBACK"
	}, {
		zh: "清空 37 条八面体线束",
		en: "Clear all 37 octahedron cables"
	}, 84, rushLevel(8, 2227268409, "octahedron", "hard", 46)),
	card(9, {
		zh: "樱核密阵",
		en: "SAKURA CORE GRID"
	}, {
		zh: "清空 40 条高密方体线束",
		en: "Clear all 40 dense cube cables"
	}, 90, rushLevel(9, 2514671425, "cube", "expert", 50)),
	card(10, {
		zh: "终极速接",
		en: "FINAL SPEED LINK"
	}, {
		zh: "清空 44 条高密圆柱线束",
		en: "Clear all 44 dense cylinder cables"
	}, 96, rushLevel(10, 2813606381, "cylinder", "expert", 54))
]);
function mixSeed$1(seed) {
	let mixed = seed >>> 0;
	mixed ^= mixed >>> 16;
	mixed = Math.imul(mixed, 2146121005);
	mixed ^= mixed >>> 15;
	mixed = Math.imul(mixed, 2221713035);
	mixed ^= mixed >>> 16;
	return mixed >>> 0;
}
function getRushChallenge(id) {
	return RUSH_CHALLENGES.find((challenge) => challenge.id === id) ?? null;
}
function getNextRushChallenge(challenge) {
	const index = RUSH_CHALLENGES.findIndex((candidate) => candidate.id === challenge.id);
	return index >= 0 ? RUSH_CHALLENGES[index + 1] ?? null : null;
}
function pickRushChallenge(selectionSeed) {
	return RUSH_CHALLENGES[mixSeed$1(selectionSeed ^ 1831565813) % RUSH_CHALLENGES.length];
}
//#endregion
//#region src/puzzle/levels.ts
var TUTORIAL_QUOTAS = [
	{
		short: .2,
		medium: .6,
		long: .2
	},
	{
		short: .14,
		medium: .58,
		long: .28
	},
	{
		short: .12,
		medium: .55,
		long: .33
	},
	{
		short: .1,
		medium: .55,
		long: .35
	},
	{
		short: .18,
		medium: .52,
		long: .3
	}
];
function level(id, seed, shape, difficulty, targetCount, minInitiallyFree, maxInitiallyFree, halfExtents, minSpans, minNeighborRatio, minDensity, cameraRadius, lengthQuota) {
	return {
		id,
		seed,
		label: `${id.toString().padStart(2, "0")} · ${shape}`,
		shape,
		difficulty,
		targetCount,
		lengthQuota,
		minInitiallyFree,
		maxInitiallyFree,
		boundaryHeadRatio: difficulty === "easy" ? .16 : .08,
		halfExtents,
		minSpans,
		minNeighborRatio,
		minDensity,
		cameraRadius
	};
}
var CAMPAIGN_LEVELS = [
	level(1, 2654435761, "cube", "easy", 5, 2, 3, [
		2,
		2,
		2
	], [
		4,
		4,
		4
	], .2, .24, 19.2, TUTORIAL_QUOTAS[0]),
	level(2, 1013904226, "cuboid", "easy", 7, 2, 3, [
		3,
		2,
		2
	], [
		5,
		3,
		3
	], .24, .25, 19.4, TUTORIAL_QUOTAS[1]),
	level(3, 3668339987, "pyramid", "normal", 9, 2, 3, [
		3,
		3,
		3
	], [
		4,
		5,
		4
	], .28, .18, 19.8, TUTORIAL_QUOTAS[2]),
	level(4, 2802362286, "cylinder", "normal", 12, 3, 4, [
		3,
		3,
		3
	], [
		4,
		5,
		4
	], .32, .35, 20.2, TUTORIAL_QUOTAS[3]),
	level(5, 387276917, "sphere", "hard", 16, 3, 5, [
		4,
		4,
		4
	], [
		6,
		6,
		6
	], .36, .28, 20.8, TUTORIAL_QUOTAS[4]),
	level(6, 19088743, "octahedron", "hard", 20, 4, 6, [
		4,
		4,
		4
	], [
		6,
		6,
		6
	], .38, .3, 21.2, {
		short: .12,
		medium: .53,
		long: .35
	}),
	level(7, 305419896, "cuboid", "hard", 26, 4, 7, [
		5,
		4,
		4
	], [
		7,
		6,
		6
	], .4, .31, 21.8, {
		short: .1,
		medium: .52,
		long: .38
	}),
	level(8, 3735928559, "pyramid", "expert", 32, 5, 8, [
		5,
		5,
		5
	], [
		7,
		7,
		7
	], .42, .32, 22.4, {
		short: .08,
		medium: .5,
		long: .42
	})
];
var RANDOM_CHALLENGE_PROFILES = [
	{
		shape: "cube",
		halfExtents: [
			5,
			5,
			5
		],
		targetCount: 42,
		maxFreeRatio: .48,
		minDensity: .2
	},
	{
		shape: "cylinder",
		halfExtents: [
			5,
			5,
			5
		],
		targetCount: 42,
		maxFreeRatio: .48,
		minDensity: .2
	},
	{
		shape: "sphere",
		halfExtents: [
			5,
			5,
			5
		],
		targetCount: 42,
		maxFreeRatio: .48,
		minDensity: .2
	},
	{
		shape: "octahedron",
		halfExtents: [
			5,
			5,
			5
		],
		targetCount: 42,
		maxFreeRatio: .48,
		minDensity: .2
	},
	{
		shape: "cube",
		halfExtents: [
			5,
			5,
			5
		],
		targetCount: 46,
		maxFreeRatio: .42,
		minDensity: .2
	},
	{
		shape: "cylinder",
		halfExtents: [
			5,
			5,
			5
		],
		targetCount: 46,
		maxFreeRatio: .42,
		minDensity: .2
	},
	{
		shape: "sphere",
		halfExtents: [
			5,
			5,
			5
		],
		targetCount: 46,
		maxFreeRatio: .42,
		minDensity: .2
	},
	{
		shape: "octahedron",
		halfExtents: [
			5,
			5,
			5
		],
		targetCount: 46,
		maxFreeRatio: .42,
		minDensity: .2
	},
	{
		shape: "cube",
		halfExtents: [
			5,
			5,
			5
		],
		targetCount: 50,
		maxFreeRatio: .38,
		minDensity: .2
	},
	{
		shape: "cylinder",
		halfExtents: [
			5,
			5,
			5
		],
		targetCount: 50,
		maxFreeRatio: .38,
		minDensity: .2
	},
	{
		shape: "cube",
		halfExtents: [
			5,
			5,
			5
		],
		targetCount: 54,
		maxFreeRatio: .34,
		minDensity: .2
	},
	{
		shape: "cylinder",
		halfExtents: [
			5,
			5,
			5
		],
		targetCount: 54,
		maxFreeRatio: .34,
		minDensity: .2
	}
];
var RANDOM_COUNT_WEIGHTS = [
	{
		count: 42,
		weight: 20
	},
	{
		count: 46,
		weight: 25
	},
	{
		count: 50,
		weight: 35
	},
	{
		count: 54,
		weight: 20
	}
];
function mixSeed(seed) {
	let mixed = seed >>> 0;
	mixed ^= mixed >>> 16;
	mixed = Math.imul(mixed, 2146121005);
	mixed ^= mixed >>> 15;
	mixed = Math.imul(mixed, 2221713035);
	mixed ^= mixed >>> 16;
	return mixed >>> 0;
}
function randomChallengeProfile(seed, maximumTargetCount = Number.POSITIVE_INFINITY) {
	const mixed = mixSeed(seed ^ 1597463007);
	const eligibleCounts = RANDOM_COUNT_WEIGHTS.filter((entry) => entry.count <= maximumTargetCount);
	const countRoll = mixed % eligibleCounts.reduce((total, entry) => total + entry.weight, 0);
	let cumulativeWeight = 0;
	const targetCount = eligibleCounts.find((entry) => {
		cumulativeWeight += entry.weight;
		return countRoll < cumulativeWeight;
	})?.count ?? eligibleCounts[eligibleCounts.length - 1].count;
	const candidates = RANDOM_CHALLENGE_PROFILES.filter((profile) => profile.targetCount === targetCount);
	return candidates[mixSeed(mixed ^ 2654435769) % candidates.length];
}
function getRandomChallengeKind(seed) {
	return selectRandomChallengeMode(seed) === "double-ended" ? "double-ended" : "standard";
}
function getCampaignLevel(id) {
	return CAMPAIGN_LEVELS[Math.max(1, Math.min(CAMPAIGN_LEVELS.length, id)) - 1];
}
function getRandomLevel(seed) {
	return buildRandomLevel(seed, getRandomChallengeKind(seed), false);
}
function getStandardRandomLevel(seed) {
	return buildRandomLevel(seed, "standard", false);
}
function getDoubleEndedLevel(seed) {
	return buildRandomLevel(seed, "double-ended", false);
}
function getSkillChallengeLevel(seed) {
	return buildRandomLevel(seed, "standard", true);
}
function buildRandomLevel(seed, challengeKind, skillChallenge) {
	const profile = randomChallengeProfile(seed, challengeKind === "double-ended" ? 50 : Number.POSITIVE_INFINITY);
	const referenceTargetCount = profile.targetCount;
	const shape = challengeKind === "double-ended" ? "cube" : profile.shape;
	const targetCount = challengeKind === "double-ended" ? Math.round(referenceTargetCount * .8) : referenceTargetCount;
	return {
		id: 0,
		seed,
		label: `随机 · ${shape}`,
		shape,
		difficulty: targetCount >= 23 ? "expert" : "hard",
		targetCount,
		lengthQuota: {
			short: .1,
			medium: .45,
			long: .45
		},
		minInitiallyFree: challengeKind === "double-ended" ? 1 : skillChallenge ? 4 : Math.max(4, Math.floor(targetCount * .1)),
		maxInitiallyFree: challengeKind === "double-ended" ? 3 : skillChallenge ? 8 : Math.min(18, Math.max(7, Math.ceil(targetCount * (profile.maxFreeRatio ?? .24)))),
		boundaryHeadRatio: .055,
		halfExtents: profile.halfExtents,
		minSpans: profile.halfExtents.map((extent) => Math.max(4, extent * 2 - 2)),
		minNeighborRatio: .38,
		minDensity: profile.minDensity ?? .28,
		cameraRadius: 22.8,
		challengeKind,
		referenceTargetCount
	};
}
function seedForCampaignLevel(id) {
	return getCampaignLevel(id).seed;
}
function applianceSeedForPuzzle(puzzleSeed, levelId = 0) {
	return Math.imul((puzzleSeed ^ (levelId > 0 ? Math.imul(levelId, 2654435769) : 2769414579)) >>> 0, 2246822507) >>> 0;
}
//#endregion
//#region src/render/PlugCableModel.ts
var up$1 = new Vector3(0, 1, 0);
var PLUG_CABLE_SOCKET_OVERLAP = ARROW_RADIUS * .48;
var tailGeometry = markSharedResource(new CylinderGeometry(ARROW_RADIUS * .82, ARROW_RADIUS * 1.08, ARROW_RADIUS * 1.15, 10));
var tailBandGeometry = markSharedResource(new CylinderGeometry(ARROW_RADIUS * 1.03, ARROW_RADIUS * 1.03, ARROW_RADIUS * .38, 10));
var tailCapGeometry = markSharedResource(new SphereGeometry(ARROW_RADIUS * .76, 8, 5));
var inductionInnerRingGeometry = markSharedResource(new TorusGeometry(CABLE_RADIUS * 1.52, CABLE_RADIUS * .18, 8, 28));
var inductionOuterRingGeometry = markSharedResource(new TorusGeometry(CABLE_RADIUS * 2.08, CABLE_RADIUS * .24, 8, 32));
var availableHintGeometry = markSharedResource(new TorusGeometry(PLUG_HEAD_MAX_RADIUS * 1.58, PLUG_HEAD_MAX_RADIUS * .22, 8, 28));
var availableHintOuterGeometry = markSharedResource(new TorusGeometry(PLUG_HEAD_MAX_RADIUS * 2.05, PLUG_HEAD_MAX_RADIUS * .08, 8, 28));
var availableHintBeaconGeometry = markSharedResource(new OctahedronGeometry(PLUG_HEAD_MAX_RADIUS * .56, 0));
var AVAILABLE_HINT_REVEAL_DURATION = .48;
var AVAILABLE_HINT_REVEAL_OVERSHOOT = 1.72;
var AVAILABLE_HINT_PULSE_SPEED = 5.2;
var AVAILABLE_HINT_PULSE_AMOUNT = .11;
var AVAILABLE_HINT_BOB_SPEED = 4.1;
var AVAILABLE_HINT_BOB_AMOUNT = PLUG_HEAD_MAX_RADIUS * .08;
var RECYCLE_HOVER_COLOR = 6288079;
var RECYCLE_SELECTED_COLOR = 16768882;
var BASE_CABLE_OUTLINE_THICKNESS = .00345;
var RECYCLE_SELECTED_OUTLINE_COLOR = 1512479;
var LAMP_GUIDE_APERTURE_RADIUS = PLUG_HEAD_MAX_RADIUS * .94;
var LAMP_GUIDE_SCALE = LAMP_GUIDE_APERTURE_RADIUS / LAMP_BEAM_SOURCE_RADIUS_LOCAL;
var LAMP_GUIDE_LENGTH = LAMP_BEAM_DEFAULT_LENGTH_LOCAL * LAMP_GUIDE_SCALE;
var LAMP_GUIDE_NEAR_FEATHER = .08;
var LAMP_GUIDE_SOURCE_RADIUS = LAMP_GUIDE_APERTURE_RADIUS / (1 + (LAMP_BEAM_FAR_TO_NEAR_RATIO - 1) * LAMP_GUIDE_NEAR_FEATHER);
var LAMP_GUIDE_APERTURE_Y = PLUG_HEAD_ENVELOPE.bodyRange[1];
var LAMP_GUIDE_GEOMETRY_START_Y = LAMP_GUIDE_APERTURE_Y - LAMP_GUIDE_LENGTH * LAMP_GUIDE_NEAR_FEATHER;
var availableHintMaterial = markSharedResource(new MeshBasicMaterial({
	color: PAL.yellow,
	transparent: true,
	opacity: .94,
	depthWrite: false,
	toneMapped: false
}));
var availableHintOuterMaterial = markSharedResource(new MeshBasicMaterial({
	color: PAL.yellow,
	transparent: true,
	opacity: .58,
	depthWrite: false,
	toneMapped: false
}));
function createAvailableEndHint() {
	const hint = new Group();
	hint.name = "available-end-hint";
	hint.position.y = PLUG_HEAD_MAX_LENGTH * .58;
	hint.visible = false;
	const innerRing = new Mesh(availableHintGeometry, availableHintMaterial);
	innerRing.rotation.x = Math.PI * .5;
	innerRing.renderOrder = 8;
	const outerRing = new Mesh(availableHintOuterGeometry, availableHintOuterMaterial);
	outerRing.rotation.x = Math.PI * .5;
	outerRing.renderOrder = 8;
	const beacon = new Mesh(availableHintBeaconGeometry, availableHintMaterial);
	beacon.position.y = PLUG_HEAD_MAX_LENGTH * .82;
	beacon.rotation.y = Math.PI * .25;
	beacon.renderOrder = 8;
	hint.add(innerRing, outerRing, beacon);
	return hint;
}
function createLampGuide() {
	const guide = new Group();
	guide.name = "lamp-cable-guide";
	guide.visible = false;
	guide.userData.performanceEffect = true;
	guide.userData.preparedBeforeSkillTrigger = true;
	const beam = createLampVolumetricBeam("lamp-cable-guide-beam");
	beam.visible = true;
	beam.userData.performanceEffect = true;
	beam.position.y = LAMP_GUIDE_GEOMETRY_START_Y + LAMP_GUIDE_LENGTH * .5;
	beam.scale.set(LAMP_GUIDE_SOURCE_RADIUS, LAMP_GUIDE_LENGTH, LAMP_GUIDE_SOURCE_RADIUS);
	guide.userData.beam = beam;
	guide.userData.apertureY = LAMP_GUIDE_APERTURE_Y;
	guide.userData.geometryStartY = LAMP_GUIDE_GEOMETRY_START_Y;
	guide.userData.sourceRadius = LAMP_GUIDE_SOURCE_RADIUS;
	guide.userData.apertureRadius = LAMP_GUIDE_APERTURE_RADIUS;
	guide.userData.length = LAMP_GUIDE_LENGTH;
	guide.add(beam);
	return guide;
}
function transformedGeometry(source, position, quaternion = new Quaternion(), scale = new Vector3(1, 1, 1)) {
	const geometry = source.index ? source.toNonIndexed() : source.clone();
	geometry.applyMatrix4(new Matrix4().compose(position, quaternion, scale));
	if (!geometry.getAttribute("aCableProgress")) geometry.setAttribute("aCableProgress", new BufferAttribute(new Float32Array(geometry.getAttribute("position").count), 1));
	return geometry;
}
function captureGeometryThicknessState(geometry) {
	const position = geometry.getAttribute("position");
	const normal = geometry.getAttribute("normal");
	geometry.computeBoundingBox();
	geometry.computeBoundingSphere();
	return {
		geometry,
		basePositions: Float32Array.from(position.array),
		baseNormals: Float32Array.from(normal.array),
		baseBoundingBox: geometry.boundingBox.clone(),
		baseBoundingSphere: geometry.boundingSphere.clone()
	};
}
function applyGeometryThickness(state, scale) {
	if (!state) return;
	const position = state.geometry.getAttribute("position");
	const inflation = CABLE_RADIUS * (scale - 1);
	for (let index = 0; index < position.count; index += 1) {
		const offset = index * 3;
		position.setXYZ(index, state.basePositions[offset] + state.baseNormals[offset] * inflation, state.basePositions[offset + 1] + state.baseNormals[offset + 1] * inflation, state.basePositions[offset + 2] + state.baseNormals[offset + 2] * inflation);
	}
	position.needsUpdate = true;
	state.geometry.boundingBox = state.baseBoundingBox.clone().expandByScalar(inflation);
	state.geometry.boundingSphere = state.baseBoundingSphere.clone();
	state.geometry.boundingSphere.radius += inflation;
	state.geometry.userData.visualThicknessScale = scale;
}
function seededRandom$1(seed) {
	let state = seed >>> 0;
	return () => {
		state += 1831565813;
		let value = state;
		value = Math.imul(value ^ value >>> 15, value | 1);
		value ^= value + Math.imul(value ^ value >>> 7, value | 61);
		return ((value ^ value >>> 14) >>> 0) / 4294967296;
	};
}
function createIceSpikeGeometry(shape, random) {
	const radialSegments = shape === "flat-blade" ? 4 : 3 + Math.floor(random() * 3);
	const source = new ConeGeometry(1, 1, radialSegments, 1, true);
	const geometry = source.toNonIndexed();
	source.dispose();
	geometry.translate(0, .5, 0);
	const position = geometry.getAttribute("position");
	const leanX = (random() - .5) * (shape === "flat-blade" ? .52 : .32);
	const leanZ = (random() - .5) * (shape === "flat-blade" ? .24 : .32);
	for (let index = 0; index < position.count; index += 1) {
		const y = position.getY(index);
		const tipWeight = MathUtils.smoothstep(y, .38, 1);
		position.setXYZ(index, position.getX(index) + leanX * tipWeight, Math.max(0, y + (y < .05 ? (random() - .5) * .06 : 0)), position.getZ(index) + leanZ * tipWeight);
	}
	position.needsUpdate = true;
	geometry.computeVertexNormals();
	geometry.userData.iceSpikeShape = shape;
	return geometry;
}
var PlugCableModel = class {
	definition;
	plugStyleId;
	root = new Group();
	pickMeshes = [];
	material;
	pathLength;
	basePoints;
	cumulativeLengths;
	exitDirection;
	tailExitDirection;
	baseColor;
	head;
	tailHead;
	fakeTailPlug = false;
	headAvailableHint = createAvailableEndHint();
	headLampGuide = null;
	tailAvailableHint;
	tailLampGuide = null;
	tailRoot = new Group();
	tailMaterial;
	tailIceShell = new Group();
	iceSpikesRoot = new Group();
	tailBaseColor;
	freezeSeed;
	refrigeratorIceGeometryEnabled = false;
	iceShellMaterial = null;
	iceSpikeMaterial = null;
	skillTintColor = null;
	skillTintStrength = 0;
	skillTintEmissionScale = 1;
	skillGlowStrength = 0;
	skillRecolorColor = null;
	skillRecolorProgress = 0;
	coffeeStainAmount = 0;
	coffeeStainReveal = 0;
	coffeeStainDirection = 0;
	overheatTarget = 0;
	overheatAmount = 0;
	overheatReveal = 0;
	overheatTurns = 2;
	inductionRevealActive = false;
	inductionHeatTarget = 0;
	inductionHeatAmount = 0;
	inductionRingAge = 0;
	inductionRingRoot = new Group();
	inductionInnerRingMaterial = cel({
		color: 16766042,
		tint: 11887931,
		emissive: 16751928,
		emissiveIntensity: .3,
		bands: 3
	});
	inductionOuterRingMaterial = cel({
		color: 15227733,
		tint: 9386313,
		emissive: 13123138,
		emissiveIntensity: .24,
		bands: 3
	});
	inductionInnerRing = new Mesh(inductionInnerRingGeometry, this.inductionInnerRingMaterial);
	inductionOuterRing = new Mesh(inductionOuterRingGeometry, this.inductionOuterRingMaterial);
	inductionRingProgresses = [.5, .5];
	inductionRingTangentAlignments = [1, 1];
	freezeAmount = 0;
	freezeProgress = 0;
	isHovered = false;
	recycleSelectionState = "none";
	recycleSelectionPulse = 0;
	recycleSelectionScale = 1;
	recycleSelectionStartedAt = null;
	recycleSelectionCenter = new Vector3();
	bundleSpacingOffset = new Vector3();
	bundleBaseRootPosition = new Vector3();
	bundleClearanceSegmentsCache = null;
	bodyMesh = null;
	iceShellMesh = null;
	iceShellOutlineMesh = null;
	currentIceCurve = null;
	outlineMesh = null;
	bodyThicknessState = null;
	outlineThicknessState = null;
	lastMotionDistance = 0;
	lastMotionEnd = "head";
	hintRevealProgress = 1;
	visualThickness = 1;
	get motionDistance() {
		return Number.isFinite(this.lastMotionDistance) ? this.lastMotionDistance : 0;
	}
	constructor(definition, plugStyleId = "round-two-pin") {
		this.definition = definition;
		this.plugStyleId = plugStyleId;
		this.root.name = definition.id;
		this.root.userData.arrowId = definition.id;
		this.bundleBaseRootPosition.copy(this.root.position);
		this.baseColor = new Color(definition.color);
		this.material = createCableToonMaterial(definition.color);
		this.freezeSeed = [...this.definition.id].reduce((value, character) => Math.imul(value ^ character.charCodeAt(0), 16777619) >>> 0, 2166136261) / 4294967295;
		this.tailBaseColor = this.baseColor.clone();
		this.tailMaterial = cableJelly({
			color: this.tailBaseColor,
			thickness: CABLE_RADIUS * 2,
			transparent: false,
			opacity: 1
		});
		this.basePoints = cableSocketPointsToWorld(definition);
		new Box3().setFromPoints(this.basePoints).getCenter(this.recycleSelectionCenter);
		this.cumulativeLengths = [0];
		for (let index = 1; index < this.basePoints.length; index += 1) this.cumulativeLengths.push(this.cumulativeLengths[index - 1] + this.basePoints[index - 1].distanceTo(this.basePoints[index]));
		this.pathLength = this.cumulativeLengths[this.cumulativeLengths.length - 1];
		this.exitDirection = DIRECTION_VECTORS[this.definition.exitDirection].clone();
		this.tailExitDirection = DIRECTION_VECTORS[cableEndDirection(definition, "tail")].clone();
		this.head = createPlugHead(definition.color, 1, false, plugStyleId);
		this.tagHeadPickMeshes(this.head, "head");
		this.headLampGuide = createLampGuide();
		this.head.root.add(this.headLampGuide);
		this.tailHead = definition.doubleEnded ? createPlugHead(definition.color, 1, false, plugStyleId) : null;
		if (this.tailHead) {
			this.tagHeadPickMeshes(this.tailHead, "tail");
			this.tailLampGuide = createLampGuide();
			this.tailHead.root.add(this.tailLampGuide);
		}
		this.tailAvailableHint = this.tailHead ? createAvailableEndHint() : null;
		this.head.root.add(this.headAvailableHint);
		if (this.tailHead && this.tailAvailableHint) this.tailHead.root.add(this.tailAvailableHint);
		const tailBand = new Mesh(tailBandGeometry, this.tailMaterial);
		tailBand.name = "plug-cable-tail-ring";
		tailBand.position.y = -ARROW_RADIUS * .16;
		const tailCap = new Mesh(tailCapGeometry, this.tailMaterial);
		tailCap.name = "plug-cable-tail-cap";
		tailCap.position.y = -ARROW_RADIUS * .55;
		this.tailIceShell.name = "plug-cable-tail-frozen-shell";
		this.tailIceShell.visible = false;
		this.tailIceShell.userData.iceShell = true;
		this.iceSpikesRoot.name = `${definition.id}-ice-spikes`;
		this.iceSpikesRoot.visible = false;
		this.iceSpikesRoot.userData.iceSpikes = true;
		this.tailRoot.name = "plug-cable-tail-assembly";
		this.tailRoot.add(tailBand, tailCap, this.tailIceShell);
		this.inductionRingRoot.name = `${definition.id}-induction-heat-rings`;
		this.inductionRingRoot.visible = false;
		this.inductionRingRoot.userData.effectId = "induction-heat-ring";
		this.inductionInnerRing.name = `${definition.id}-induction-inner-yellow-ring`;
		this.inductionOuterRing.name = `${definition.id}-induction-outer-red-ring`;
		this.inductionInnerRing.renderOrder = 7;
		this.inductionOuterRing.renderOrder = 7;
		this.inductionInnerRing.castShadow = false;
		this.inductionOuterRing.castShadow = false;
		this.inductionRingRoot.add(this.inductionInnerRing, this.inductionOuterRing);
		this.root.add(this.head.root, this.tailHead?.root ?? this.tailRoot, this.iceSpikesRoot, this.inductionRingRoot);
		this.build(this.basePoints, true);
	}
	setHovered(hovered, end, nightProgress = 0) {
		const night = MathUtils.clamp(nightProgress, 0, 1);
		this.isHovered = hovered;
		this.refreshCableVisual();
		this.head.setHovered(hovered && (!end || end === "head"), night);
		this.tailHead?.setHovered(hovered && (!end || end === "tail"), night);
	}
	setRecycleSelectionState(state) {
		if (this.recycleSelectionState === state) return;
		this.recycleSelectionState = state;
		this.recycleSelectionStartedAt = null;
		if (state === "selected") this.applyRecycleSelectionScale(1);
		if (state === "none") {
			this.recycleSelectionPulse = 0;
			this.applyRecycleSelectionScale(1);
		}
		this.refreshCableVisual();
		this.head.setRecycleSelectionState(state, this.recycleSelectionPulse);
		this.tailHead?.setRecycleSelectionState(state, this.recycleSelectionPulse);
	}
	updateRecycleSelection(elapsed) {
		if (this.recycleSelectionState === "none") return;
		if (this.recycleSelectionStartedAt === null) this.recycleSelectionStartedAt = elapsed;
		const selectionAge = elapsed - this.recycleSelectionStartedAt;
		if (this.recycleSelectionState === "selected") {
			this.recycleSelectionPulse = (Math.sin(selectionAge * 10) + 1) * .5;
			this.applyRecycleSelectionScale(1);
		} else {
			this.recycleSelectionPulse = (Math.sin(selectionAge * 6.2) + 1) * .5;
			this.applyRecycleSelectionScale(1.012 + this.recycleSelectionPulse * .016);
		}
		this.refreshCableVisual();
		this.head.setRecycleSelectionState(this.recycleSelectionState, this.recycleSelectionPulse);
		this.tailHead?.setRecycleSelectionState(this.recycleSelectionState, this.recycleSelectionPulse);
	}
	setSkillTint(color, strength = .42, emissionScale = 1) {
		this.skillTintColor = color === null ? null : new Color(color);
		this.skillTintStrength = color === null ? 0 : MathUtils.clamp(strength, 0, 1);
		this.skillTintEmissionScale = color === null ? 1 : MathUtils.clamp(emissionScale, 0, 1);
		this.refreshCableVisual();
		this.head.setSkillTint(color, strength, emissionScale);
		this.tailHead?.setSkillTint(color, strength, emissionScale);
	}
	setSkillGlow(strength = 0) {
		this.skillGlowStrength = MathUtils.clamp(strength, 0, 1);
		this.refreshCableVisual();
		this.head.setSkillGlow(this.skillGlowStrength);
		this.tailHead?.setSkillGlow(this.skillGlowStrength);
	}
	setSkillSweep(progress, strength = 0, color = 10189768) {
		setCableSkillSweep(this.material, progress, strength, color);
	}
	setSkillRecolor(color, progress = 0) {
		this.skillRecolorColor = color === null ? null : new Color(color);
		this.skillRecolorProgress = color === null ? 0 : MathUtils.clamp(progress, 0, 1);
		setCableSkillRecolor(this.material, this.skillRecolorProgress, color ?? this.baseColor);
		const endpointProgress = MathUtils.smoothstep(this.skillRecolorProgress, .82, 1);
		this.head.setSkillTint(color, endpointProgress, 0);
		this.tailHead?.setSkillTint(color, endpointProgress, 0);
		this.refreshCableVisual();
	}
	setCoffeeStain(amount, reveal, elapsed, direction) {
		this.coffeeStainAmount = MathUtils.clamp(amount, 0, 1);
		this.coffeeStainReveal = MathUtils.clamp(reveal, 0, 1);
		this.coffeeStainDirection = direction >= .5 ? 1 : 0;
		setCableCoffeeStain(this.material, this.coffeeStainAmount, this.coffeeStainReveal, this.freezeSeed, elapsed, this.coffeeStainDirection);
		const startFromHead = this.coffeeStainDirection >= .5;
		const headDistance = startFromHead ? 0 : 1;
		const tailDistance = startFromHead ? 1 : 0;
		const endpointCoverage = (distance) => MathUtils.smoothstep(this.coffeeStainReveal, Math.max(0, distance - .035), Math.min(1, distance + .11));
		const headCoverage = endpointCoverage(headDistance) * this.coffeeStainAmount;
		const tailCoverage = endpointCoverage(tailDistance) * this.coffeeStainAmount;
		this.head.setSkillTint(COFFEE_STAIN_COLOR, headCoverage);
		this.tailHead?.setSkillTint(COFFEE_STAIN_COLOR, tailCoverage);
		this.tailMaterial.color.copy(this.tailBaseColor).lerp(new Color(COFFEE_STAIN_COLOR), tailCoverage);
		this.tailMaterial.emissive.set(COFFEE_STAIN_COLOR);
		this.tailMaterial.emissiveIntensity = tailCoverage * .22;
	}
	clearCoffeeStain() {
		if (this.coffeeStainAmount <= 0 && this.coffeeStainReveal <= 0) return;
		this.coffeeStainAmount = 0;
		this.coffeeStainReveal = 0;
		this.coffeeStainDirection = 0;
		setCableCoffeeStain(this.material, 0, 0, this.freezeSeed, 0, 0);
		this.head.setSkillTint(null);
		this.tailHead?.setSkillTint(null);
		this.refreshCableVisual();
	}
	setOverheated(enabled, turnsRemaining = 2) {
		this.overheatTarget = enabled ? 1 : 0;
		this.overheatTurns = Math.max(1, Math.round(turnsRemaining));
	}
	setInductionReveal(enabled) {
		if (this.inductionRevealActive === enabled) return;
		this.inductionRevealActive = enabled;
		this.inductionHeatTarget = enabled ? .62 : 0;
		this.inductionRingAge = 0;
		this.inductionRingRoot.visible = enabled;
		if (!enabled) {
			this.inductionHeatAmount = 0;
			this.inductionRingProgresses = [.5, .5];
			this.inductionRingTangentAlignments = [1, 1];
		}
	}
	updateOverheat(delta, elapsed) {
		const response = this.overheatTarget > this.overheatAmount ? 8.5 : 13;
		this.overheatAmount = MathUtils.damp(this.overheatAmount, this.overheatTarget, response, Math.max(0, delta));
		if (this.overheatTarget > .5) this.overheatReveal = Math.min(1, this.overheatReveal + Math.max(0, delta) / .42);
		else if (this.overheatAmount < .002) {
			this.overheatAmount = 0;
			this.overheatReveal = 0;
		}
		this.inductionHeatAmount = MathUtils.damp(this.inductionHeatAmount, this.inductionHeatTarget, 7.5, Math.max(0, delta));
		const cableHeatAmount = Math.max(this.overheatAmount, this.inductionHeatAmount);
		const cableHeatTurns = this.overheatAmount >= this.inductionHeatAmount ? this.overheatTurns : 2;
		const cableHeatReveal = this.overheatTarget > .5 ? this.overheatReveal : 1;
		setCableOverheat(this.material, cableHeatAmount, cableHeatTurns, elapsed, cableHeatReveal);
		this.head.setOverheated(this.overheatAmount, this.overheatTurns, elapsed, this.overheatReveal, this.pathLength);
		this.updateInductionRings(delta);
	}
	setRefrigeratorIceGeometryEnabled(enabled) {
		if (this.refrigeratorIceGeometryEnabled === enabled) return;
		this.refrigeratorIceGeometryEnabled = enabled;
		this.head.setFrozenGeometryEnabled(enabled);
		this.tailHead?.setFrozenGeometryEnabled(enabled);
		if (enabled && this.bodyMesh && this.currentIceCurve) this.buildRefrigeratorIceGeometry(this.bodyMesh.geometry, this.currentIceCurve);
		else if (!enabled) this.clearRefrigeratorIceGeometry(true);
		this.refreshRefrigeratorIceGeometry();
	}
	setFrozen(amount = 0, progress = amount) {
		const nextAmount = MathUtils.clamp(amount, 0, 1);
		const nextProgress = MathUtils.clamp(progress, 0, 1);
		if (Math.abs(nextAmount - this.freezeAmount) < 5e-4 && Math.abs(nextProgress - this.freezeProgress) < 5e-4) return;
		this.freezeAmount = nextAmount;
		this.freezeProgress = nextProgress;
		setCableFreeze(this.material, this.freezeAmount, this.freezeProgress, this.freezeSeed);
		const headFreeze = MathUtils.smoothstep(this.freezeProgress, .02, .2) * this.freezeAmount;
		const tailFreeze = MathUtils.smoothstep(this.freezeProgress, .76, 1) * this.freezeAmount;
		this.head.setFrozen(headFreeze);
		this.tailHead?.setFrozen(tailFreeze);
		this.tailIceShell.visible = false;
		this.tailIceShell.userData.amount = 0;
		this.refreshRefrigeratorIceGeometry();
		this.refreshCableVisual();
		if (this.recycleSelectionState === "none" && this.outlineMesh?.material instanceof ShaderMaterial) {
			const outlineColor = this.outlineMesh.material.uniforms.uColor?.value;
			if (outlineColor instanceof Color) outlineColor.set(PAL.ink).lerp(new Color(4218224), this.freezeAmount * this.freezeProgress * .62);
		}
	}
	setIceShellWarmupVisible(enabled) {
		if (enabled && this.refrigeratorIceGeometryEnabled) {
			if (this.iceShellMesh) this.iceShellMesh.visible = true;
			this.iceSpikesRoot.visible = true;
			this.head.frozenShell.visible = true;
			if (this.tailHead) this.tailHead.frozenShell.visible = true;
			return;
		}
		this.refreshRefrigeratorIceGeometry();
		this.head.frozenShell.visible = false;
		if (this.tailHead) this.tailHead.frozenShell.visible = false;
		this.tailIceShell.visible = false;
	}
	setLampGuide(end) {
		if (end === "head" && !this.headLampGuide) {
			this.headLampGuide = createLampGuide();
			this.head.root.add(this.headLampGuide);
		}
		if (end === "tail" && this.tailHead && !this.tailLampGuide) {
			this.tailLampGuide = createLampGuide();
			this.tailHead.root.add(this.tailLampGuide);
		}
		if (this.headLampGuide) this.headLampGuide.visible = end === "head";
		if (this.tailLampGuide) this.tailLampGuide.visible = end === "tail";
	}
	setLampGuideWarmupVisible(enabled) {
		if (this.headLampGuide) this.headLampGuide.visible = enabled;
		if (this.tailLampGuide) this.tailLampGuide.visible = enabled;
	}
	setFakeTailPlug(enabled) {
		if (this.definition.doubleEnded) return;
		if (enabled === this.fakeTailPlug && (enabled ? this.tailHead !== null : this.tailHead === null)) return;
		if (enabled && !this.tailHead) {
			this.fakeTailPlug = true;
			this.tailHead = createPlugHead(this.definition.color, 1, false, this.plugStyleId);
			this.tagHeadPickMeshes(this.tailHead, "tail");
			this.tailAvailableHint = createAvailableEndHint();
			this.tailHead.root.add(this.tailAvailableHint);
			this.tailAvailableHint.visible = false;
			this.tailHead.setSkillTint(this.skillTintColor, this.skillTintStrength, this.skillTintEmissionScale);
			this.tailHead.setSkillGlow(this.skillGlowStrength);
			this.tailHead.setFrozenGeometryEnabled(this.refrigeratorIceGeometryEnabled);
			this.tailHead.setFrozen(this.freezeAmount);
			this.tailRoot.visible = false;
			this.root.add(this.tailHead.root);
			this.bundleClearanceSegmentsCache = null;
			this.build(this.basePoints, true);
			return;
		}
		if (!enabled && this.tailHead) {
			this.fakeTailPlug = false;
			this.tailHead.root.removeFromParent();
			this.tailHead.dispose();
			this.tailHead = null;
			this.tailAvailableHint = null;
			this.tailLampGuide = null;
			this.tailRoot.visible = true;
			this.bundleClearanceSegmentsCache = null;
			this.build(this.basePoints, true);
		}
	}
	get availableEndCount() {
		return Number(this.headAvailableHint.visible) + Number(this.tailAvailableHint?.visible ?? false);
	}
	get availableHintScale() {
		if (this.headAvailableHint.visible) return this.headAvailableHint.scale.x;
		if (this.tailAvailableHint?.visible) return this.tailAvailableHint.scale.x;
		return 0;
	}
	setAvailableEnds(ends, replayReveal = false) {
		this.headAvailableHint.visible = ends.includes("head");
		if (this.tailAvailableHint) this.tailAvailableHint.visible = ends.includes("tail");
		if (replayReveal && ends.length > 0) this.hintRevealProgress = 0;
	}
	updateAvailableHints(delta, elapsed) {
		this.hintRevealProgress = Math.min(1, this.hintRevealProgress + Math.max(0, delta) / AVAILABLE_HINT_REVEAL_DURATION);
		const revealOffset = this.hintRevealProgress - 1;
		const revealScale = 1 + 2.7199999999999998 * revealOffset ** 3 + AVAILABLE_HINT_REVEAL_OVERSHOOT * revealOffset ** 2;
		const pulse = 1 + (Math.sin(elapsed * AVAILABLE_HINT_PULSE_SPEED + this.definition.id.length) + 1) * AVAILABLE_HINT_PULSE_AMOUNT;
		const scale = Math.max(0, revealScale) * pulse;
		this.headAvailableHint.scale.setScalar(scale);
		this.tailAvailableHint?.scale.setScalar(scale);
		const bob = Math.sin(elapsed * AVAILABLE_HINT_BOB_SPEED + this.definition.id.length) * AVAILABLE_HINT_BOB_AMOUNT;
		this.headAvailableHint.position.y = PLUG_HEAD_MAX_LENGTH * .58 + bob;
		if (this.tailAvailableHint) this.tailAvailableHint.position.y = PLUG_HEAD_MAX_LENGTH * .58 + bob;
		if (this.headLampGuide) this.updateLampGuide(this.headLampGuide, elapsed);
		if (this.tailLampGuide) this.updateLampGuide(this.tailLampGuide, elapsed);
	}
	setBlockedFlash(amount, end = "head") {
		this.material.emissive.set(PAL.redDeep);
		this.material.emissiveIntensity = amount * .75;
		(end === "tail" ? this.tailHead : this.head)?.setBlockedFlash(amount);
	}
	setPrepare(amount, end = "head") {
		const scale = 1 * (1 + amount * .025);
		(end === "tail" ? this.tailHead : this.head)?.root.scale.set(scale, scale * (1 - amount * .02), scale);
	}
	resetMaterial() {
		this.skillTintColor = null;
		this.skillTintStrength = 0;
		this.skillTintEmissionScale = 1;
		this.skillGlowStrength = 0;
		this.setSkillSweep(0, 0);
		this.skillRecolorColor = null;
		this.skillRecolorProgress = 0;
		setCableSkillRecolor(this.material, 0, this.baseColor);
		this.coffeeStainAmount = 0;
		this.coffeeStainReveal = 0;
		this.coffeeStainDirection = 0;
		setCableCoffeeStain(this.material, 0, 0, this.freezeSeed, 0, 0);
		this.overheatTarget = 0;
		this.overheatAmount = 0;
		this.overheatReveal = 0;
		this.overheatTurns = 2;
		this.inductionRevealActive = false;
		this.inductionHeatTarget = 0;
		this.inductionHeatAmount = 0;
		this.inductionRingAge = 0;
		this.inductionRingRoot.visible = false;
		this.inductionRingProgresses = [.5, .5];
		this.inductionRingTangentAlignments = [1, 1];
		setCableOverheat(this.material, 0, 2, 0, 0);
		this.freezeAmount = 0;
		this.freezeProgress = 0;
		setCableFreeze(this.material, 0, 0, 0);
		this.tailIceShell.visible = false;
		this.isHovered = false;
		this.recycleSelectionState = "none";
		this.recycleSelectionPulse = 0;
		this.recycleSelectionStartedAt = null;
		this.applyRecycleSelectionScale(1);
		this.refreshCableVisual();
		this.setLampGuide(null);
		this.head.root.scale.setScalar(1);
		this.head.reset();
		if (this.tailHead) {
			this.tailHead.root.scale.setScalar(1);
			this.tailHead.reset();
		}
		this.refreshRefrigeratorIceGeometry();
	}
	resetPose() {
		this.root.visible = true;
		this.applyRootPresentationTransform();
		if (this.lastMotionDistance > .004) this.setMotionDistance(0, this.lastMotionEnd);
		else this.lastMotionDistance = 0;
		this.lastMotionEnd = "head";
		this.resetMaterial();
	}
	setVisualThickness(scale) {
		this.visualThickness = MathUtils.clamp(scale, 1, 2.4);
		this.bundleClearanceSegmentsCache = null;
		applyGeometryThickness(this.bodyThicknessState, this.visualThickness);
		applyGeometryThickness(this.outlineThicknessState, this.visualThickness);
		this.head.setCableJointThickness(this.visualThickness);
		this.tailHead?.setCableJointThickness(this.visualThickness);
		this.tailRoot.scale.set(this.visualThickness, 1, this.visualThickness);
	}
	get visualThicknessScale() {
		return this.visualThickness;
	}
	getBundleBaseCenter(target = new Vector3()) {
		return target.copy(this.recycleSelectionCenter);
	}
	getBundleBaseCenterRef() {
		return this.recycleSelectionCenter;
	}
	getBundleClearanceSegments() {
		if (this.bundleClearanceSegmentsCache) return this.bundleClearanceSegmentsCache;
		const segments = [];
		for (let index = 0; index < this.basePoints.length - 1; index += 1) segments.push({
			start: this.basePoints[index].clone(),
			end: this.basePoints[index + 1].clone(),
			radius: CABLE_RADIUS * this.visualThickness
		});
		const addPlug = (anchor, direction) => {
			segments.push({
				start: anchor.clone().addScaledVector(direction, PLUG_HEAD_ENVELOPE.bodyRange[0]),
				end: anchor.clone().addScaledVector(direction, PLUG_HEAD_ENVELOPE.bodyRange[1]),
				radius: PLUG_HEAD_MAX_RADIUS
			});
			segments.push({
				start: anchor.clone().addScaledVector(direction, PLUG_HEAD_ENVELOPE.pinRange[0]),
				end: anchor.clone().addScaledVector(direction, PLUG_HEAD_MAX_LENGTH),
				radius: PLUG_HEAD_PIN_RADIUS
			});
		};
		addPlug(this.basePoints[this.basePoints.length - 1], this.exitDirection);
		const tailDirection = this.basePoints[0].clone().sub(this.basePoints[1]).normalize();
		if (this.tailHead) addPlug(this.basePoints[0], tailDirection);
		else segments.push({
			start: this.basePoints[0].clone(),
			end: this.basePoints[0].clone().addScaledVector(tailDirection, CABLE_TAIL_TERMINAL_LENGTH),
			radius: ARROW_RADIUS * this.visualThickness
		});
		this.bundleClearanceSegmentsCache = segments;
		return segments;
	}
	setBundleSpacingOffset(offset) {
		const nextOffset = offset ?? this.bundleSpacingOffset.set(0, 0, 0);
		if (this.bundleSpacingOffset.lengthSq() < 1e-10 && nextOffset.lengthSq() >= 1e-10) this.bundleBaseRootPosition.copy(this.root.position).addScaledVector(this.recycleSelectionCenter, this.recycleSelectionScale - 1);
		if (offset) this.bundleSpacingOffset.copy(offset);
		else this.bundleSpacingOffset.set(0, 0, 0);
		this.applyRootPresentationTransform();
	}
	/**
	* Accept the current root position as the new baseline after another
	* presentation has permanently repositioned the cable. This keeps the
	* spacing/recycle presentation owner from restoring a stale constructor-time
	* position on its next update.
	*/
	commitBundleBaseRootPose() {
		this.bundleBaseRootPosition.copy(this.root.position).sub(this.bundleSpacingOffset).addScaledVector(this.recycleSelectionCenter, this.recycleSelectionScale - 1);
	}
	get skillVisualState() {
		return {
			baseColor: this.baseColor.getHex(),
			cableColor: this.material.color.getHex(),
			tailColor: this.tailMaterial.color.getHex(),
			glowStrength: this.skillGlowStrength,
			skillTintStrength: this.skillTintStrength,
			skillTintEmissionScale: this.skillTintEmissionScale,
			skillSweepProgress: this.material.userData.skillSweepProgress?.value ?? 0,
			skillSweepStrength: this.material.userData.skillSweepStrength?.value ?? 0,
			skillRecolorProgress: this.skillRecolorProgress,
			skillRecolorColor: this.skillRecolorColor?.getHex() ?? null,
			recycleSelectionState: this.recycleSelectionState,
			recycleHighlightStrength: this.recycleSelectionState === "selected" ? 1 : this.recycleSelectionState === "hover" ? .78 : 0,
			recyclePulse: this.recycleSelectionPulse,
			recycleScale: this.recycleSelectionScale,
			bundleSpacingOffset: this.bundleSpacingOffset.toArray(),
			bundleSpacingOffsetLength: this.bundleSpacingOffset.length(),
			overheatAmount: this.overheatAmount,
			overheatReveal: this.overheatReveal,
			overheatTurns: this.overheatTurns,
			inductionRevealActive: this.inductionRevealActive,
			inductionHeatAmount: this.inductionHeatAmount,
			inductionRingCount: this.inductionRingRoot.visible ? 2 : 0,
			inductionRingProgresses: [...this.inductionRingProgresses],
			inductionRingTangentAlignments: [...this.inductionRingTangentAlignments],
			inductionRingMotion: "opposed-path-ping-pong",
			plugOverheatAmount: this.head.overheatVisualState.amount,
			plugOverheatReveal: this.head.overheatVisualState.reveal,
			plugOverheatMaterialCount: this.head.overheatVisualState.materialCount,
			plugOverheatPathScale: this.head.overheatVisualState.pathScale,
			freezeAmount: this.freezeAmount,
			freezeProgress: this.freezeProgress,
			coffeeStainAmount: this.coffeeStainAmount,
			coffeeStainReveal: this.coffeeStainReveal,
			coffeeStainDirection: this.coffeeStainDirection,
			iceShellVisible: this.iceShellMesh?.visible ?? false,
			iceShellOpacity: this.iceShellMaterial?.opacity ?? 0,
			plugIceShellCount: Number(this.head.frozenShell.visible) + Number(this.tailHead?.frozenShell.visible ?? this.tailIceShell.visible),
			visualThicknessScale: this.visualThickness,
			geometryThicknessScale: this.bodyMesh?.geometry.userData.visualThicknessScale ?? 1,
			plugJointThicknessScale: this.head.cableJointThicknessScale,
			fakeTailPlugVisible: this.tailHead !== null && !this.definition.doubleEnded,
			lampGuideEnd: this.headLampGuide?.visible ? "head" : this.tailLampGuide?.visible ? "tail" : null
		};
	}
	setMotionDistance(distance, end = "head") {
		if (this.lastMotionEnd === end && Number.isFinite(this.lastMotionDistance) && Math.abs(distance - this.lastMotionDistance) < .004) return;
		this.lastMotionEnd = end;
		this.lastMotionDistance = Math.max(0, distance);
		const start = this.lastMotionDistance;
		const finish = start + this.pathLength;
		const orientedPoints = end === "head" ? this.basePoints : [...this.basePoints].reverse();
		const orientedLengths = end === "head" ? this.cumulativeLengths : this.cumulativeLengths.map((length) => this.pathLength - length).reverse();
		const points = [this.pointAtDistance(start, end)];
		for (let index = 1; index < orientedPoints.length; index += 1) {
			const length = orientedLengths[index];
			if (length > start && length < finish) points.push(orientedPoints[index].clone());
		}
		points.push(this.pointAtDistance(finish, end));
		this.build(points, this.lastMotionDistance === 0, end);
	}
	getHeadWorldPosition(target = new Vector3(), end = "head") {
		return (end === "tail" ? this.tailHead : this.head)?.root.getWorldPosition(target) ?? target;
	}
	getHeadWorldQuaternion(target = new Quaternion(), end = "head") {
		return (end === "tail" ? this.tailHead : this.head)?.root.getWorldQuaternion(target) ?? target;
	}
	dispose() {
		this.root.removeFromParent();
		this.clearRefrigeratorIceGeometry(true);
		this.bodyMesh?.geometry.dispose();
		this.outlineMesh?.geometry.dispose();
		(this.outlineMesh?.material)?.dispose();
		this.head.dispose();
		this.tailHead?.dispose();
		disposeOwnedResource(this.inductionInnerRing.geometry);
		disposeOwnedResource(this.inductionOuterRing.geometry);
		this.inductionInnerRingMaterial.dispose();
		this.inductionOuterRingMaterial.dispose();
		this.tailRoot.traverse((object) => {
			if (object instanceof Mesh) disposeOwnedResource(object.geometry);
		});
		this.material.dispose();
		this.tailMaterial.dispose();
		this.bodyMesh = null;
		this.bodyThicknessState = null;
		this.currentIceCurve = null;
		this.outlineMesh = null;
		this.outlineThicknessState = null;
		this.pickMeshes.length = 0;
	}
	pointAtDistance(distance, end) {
		const orientedPoints = end === "head" ? this.basePoints : [...this.basePoints].reverse();
		const orientedLengths = end === "head" ? this.cumulativeLengths : this.cumulativeLengths.map((length) => this.pathLength - length).reverse();
		const exitDirection = end === "head" ? this.exitDirection : this.tailExitDirection;
		if (distance <= 0) return orientedPoints[0].clone();
		if (distance >= this.pathLength) return orientedPoints[orientedPoints.length - 1].clone().addScaledVector(exitDirection, distance - this.pathLength);
		for (let index = 1; index < orientedLengths.length; index += 1) {
			if (distance > orientedLengths[index]) continue;
			const segmentStart = orientedLengths[index - 1];
			const segmentLength = orientedLengths[index] - segmentStart;
			return orientedPoints[index - 1].clone().lerp(orientedPoints[index], (distance - segmentStart) / segmentLength);
		}
		return orientedPoints[orientedPoints.length - 1].clone();
	}
	updateInductionRings(delta) {
		if (!this.inductionRevealActive || !this.currentIceCurve) {
			this.inductionRingRoot.visible = false;
			return;
		}
		this.inductionRingRoot.visible = true;
		this.inductionRingAge += Math.max(0, delta);
		const curveLength = Math.max(this.currentIceCurve.getLength(), CABLE_RADIUS * 8);
		const segmentDuration = Math.max(.72, curveLength * .46 / 1.15);
		const phase = this.inductionRingAge / segmentDuration % 4;
		const signedTravel = phase < 1 ? phase : phase < 3 ? 2 - phase : phase - 4;
		const innerProgress = MathUtils.clamp(.5 + signedTravel * .46, .04, .96);
		const outerProgress = MathUtils.clamp(.5 - signedTravel * .46, .04, .96);
		this.inductionRingProgresses = [innerProgress, outerProgress];
		this.inductionRingTangentAlignments = [this.placeInductionRing(this.inductionInnerRing, innerProgress), this.placeInductionRing(this.inductionOuterRing, outerProgress)];
	}
	placeInductionRing(ring, progress) {
		if (!this.currentIceCurve) return 0;
		const tangent = this.currentIceCurve.getTangentAt(progress, new Vector3()).normalize();
		ring.position.copy(this.currentIceCurve.getPointAt(progress, new Vector3()));
		ring.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), tangent);
		return new Vector3(0, 0, 1).applyQuaternion(ring.quaternion).dot(tangent);
	}
	ensureRefrigeratorIceMaterials() {
		if (!this.iceShellMaterial) {
			this.iceShellMaterial = createCableIceShellMaterial();
			this.iceShellMaterial.name = "sakura-refrigerator-cable-ice-shell";
			this.iceShellMaterial.opacity = 0;
			this.iceShellMaterial.depthWrite = false;
			this.iceShellMaterial.flatShading = true;
		}
		if (!this.iceSpikeMaterial) {
			this.iceSpikeMaterial = new MeshPhysicalMaterial({
				name: "sakura-refrigerator-ice-spikes",
				color: REFRIGERATOR_ICE_COLOR,
				emissive: 3235689,
				emissiveIntensity: .025,
				roughness: .56,
				metalness: 0,
				clearcoat: .44,
				clearcoatRoughness: .32,
				transparent: true,
				opacity: 0,
				depthWrite: false,
				flatShading: true
			});
			this.iceSpikeMaterial.userData.materialRole = "refrigerator-ice-spike";
		}
	}
	buildRefrigeratorIceGeometry(sourceGeometry, curve) {
		this.clearRefrigeratorIceGeometry(false);
		if (!this.refrigeratorIceGeometryEnabled) return;
		this.ensureRefrigeratorIceMaterials();
		const shell = new Mesh(createRoundedIceShellGeometry(sourceGeometry, CABLE_RADIUS * .28), this.iceShellMaterial);
		shell.name = `${this.definition.id}-cable-ice-shell`;
		shell.renderOrder = 4;
		shell.castShadow = false;
		shell.receiveShadow = false;
		shell.userData.iceShell = true;
		this.iceShellOutlineMesh = addHullOutline(shell, .0058, PAL.ink);
		setHullOutlineStyle(this.iceShellOutlineMesh, {
			thickness: .0058,
			variation: .08,
			phase: this.freezeSeed * Math.PI * 2,
			color: PAL.ink
		});
		setHullOutlineReveal(this.iceShellOutlineMesh, this.freezeProgress);
		this.iceShellMesh = shell;
		this.root.add(shell);
		const random = seededRandom$1([...this.definition.id].reduce((value, character) => Math.imul(value ^ character.charCodeAt(0), 16777619) >>> 0, 2166136261));
		const length = Math.max(curve.getLength(), CABLE_RADIUS * 2);
		const spikeCount = MathUtils.clamp(Math.round(length * 4.1), 10, 18);
		const flatSpikeCount = Math.ceil(spikeCount * .72);
		const spikeShapes = Array.from({ length: spikeCount }, (_, index) => index < flatSpikeCount ? "flat-blade" : "pointed");
		for (let index = spikeShapes.length - 1; index > 0; index -= 1) {
			const swapIndex = Math.floor(random() * (index + 1));
			[spikeShapes[index], spikeShapes[swapIndex]] = [spikeShapes[swapIndex], spikeShapes[index]];
		}
		const tangent = new Vector3();
		const radialA = new Vector3();
		const radialB = new Vector3();
		const radial = new Vector3();
		const reference = new Vector3();
		for (let index = 0; index < spikeCount; index += 1) {
			const t = MathUtils.clamp((index + .18 + random() * .64) / spikeCount, .035, .965);
			curve.getTangentAt(t, tangent).normalize();
			reference.set(Math.abs(tangent.y) < .82 ? 0 : 1, Math.abs(tangent.y) < .82 ? 1 : 0, 0);
			radialA.crossVectors(tangent, reference).normalize();
			radialB.crossVectors(tangent, radialA).normalize();
			const angle = random() * Math.PI * 2;
			radial.copy(radialA).multiplyScalar(Math.cos(angle)).addScaledVector(radialB, Math.sin(angle)).normalize();
			const shape = spikeShapes[index];
			const geometry = createIceSpikeGeometry(shape, random);
			const spike = new Mesh(geometry, this.iceSpikeMaterial);
			spike.name = `${this.definition.id}-ice-spike-${index + 1}`;
			const surfaceRadiusFactor = 1;
			spike.position.copy(curve.getPointAt(t)).addScaledVector(radial, CABLE_RADIUS * surfaceRadiusFactor);
			spike.quaternion.setFromUnitVectors(up$1, radial);
			spike.rotateY(random() * Math.PI * 2);
			const baseScale = shape === "flat-blade" ? new Vector3(CABLE_RADIUS * (.62 + random() * .92), CABLE_RADIUS * (.88 + random() * 1.62), CABLE_RADIUS * (.2 + random() * .22)) : new Vector3(CABLE_RADIUS * (.3 + random() * .34), CABLE_RADIUS * (.82 + random() * 1.52), CABLE_RADIUS * (.3 + random() * .34));
			spike.scale.setScalar(.001);
			spike.renderOrder = 5;
			spike.userData.iceSpike = true;
			spike.userData.iceSpikeShape = shape;
			spike.userData.baseScale = baseScale;
			spike.userData.pathT = t;
			spike.userData.surfaceRadiusFactor = surfaceRadiusFactor;
			spike.userData.revealAt = MathUtils.clamp(.05 + (1 - t) * .84 + (random() - .5) * .1, .04, .9);
			const spikeOutline = addHullOutline(spike, shape === "flat-blade" ? .0088 : .0078, PAL.ink);
			setHullOutlineStyle(spikeOutline, {
				thickness: shape === "flat-blade" ? .0088 : .0078,
				variation: .13,
				phase: random() * Math.PI * 2,
				color: PAL.ink
			});
			setHullOutlineRootFade(spikeOutline, .035, .28);
			spikeOutline.userData.iceSpikeRootFade = true;
			this.iceSpikesRoot.add(spike);
		}
		this.refreshRefrigeratorIceGeometry();
	}
	refreshRefrigeratorIceGeometry() {
		const enabled = this.refrigeratorIceGeometryEnabled;
		const amount = enabled ? MathUtils.clamp(this.freezeAmount, 0, 1) : 0;
		const progress = enabled ? MathUtils.clamp(this.freezeProgress, 0, 1) : 0;
		if (this.iceShellMaterial) {
			setCableIceShell(this.iceShellMaterial, amount, progress);
			this.iceShellMaterial.opacity = REFRIGERATOR_ICE_OPACITY * amount;
		}
		if (this.iceShellMesh) this.iceShellMesh.visible = amount > .01;
		setHullOutlineReveal(this.iceShellOutlineMesh, enabled ? progress : null);
		if (this.iceShellOutlineMesh?.material instanceof ShaderMaterial) this.iceShellOutlineMesh.material.uniforms.uOpacity.value = amount;
		if (this.iceSpikeMaterial) this.iceSpikeMaterial.opacity = REFRIGERATOR_SPIKE_OPACITY * amount;
		this.iceSpikesRoot.visible = amount > .01;
		this.iceSpikesRoot.children.forEach((child) => {
			if (!(child instanceof Mesh)) return;
			const revealAt = child.userData.revealAt;
			const baseScale = child.userData.baseScale;
			const growth = MathUtils.smoothstep(progress, revealAt, Math.min(1, revealAt + .14)) * Math.pow(amount, .72);
			child.visible = growth > .015;
			child.scale.copy(baseScale).multiplyScalar(Math.max(.001, growth));
		});
	}
	clearRefrigeratorIceGeometry(disposeMaterials) {
		if (this.iceShellMesh) {
			this.iceShellMesh.traverse((object) => {
				if (!(object instanceof Mesh) || object === this.iceShellMesh) return;
				object.geometry.dispose();
				(Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => material.dispose());
			});
			this.root.remove(this.iceShellMesh);
			this.iceShellMesh.geometry.dispose();
			this.iceShellMesh = null;
			this.iceShellOutlineMesh = null;
		}
		this.iceSpikesRoot.children.slice().forEach((child) => {
			this.iceSpikesRoot.remove(child);
			child.traverse((object) => {
				if (!(object instanceof Mesh)) return;
				object.geometry.dispose();
				(Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => {
					if (material !== this.iceSpikeMaterial) material.dispose();
				});
			});
		});
		if (!disposeMaterials) return;
		this.iceShellMaterial?.dispose();
		this.iceSpikeMaterial?.dispose();
		this.iceShellMaterial = null;
		this.iceSpikeMaterial = null;
	}
	refreshCableVisual() {
		const recycleColor = this.recycleSelectionState === "selected" ? new Color(RECYCLE_SELECTED_COLOR) : this.recycleSelectionState === "hover" ? new Color(RECYCLE_HOVER_COLOR) : null;
		const displayColor = this.baseColor.clone();
		if (this.skillTintColor) displayColor.lerp(this.skillTintColor, this.skillTintStrength);
		if (this.isHovered && !recycleColor) displayColor.lerp(new Color(PAL.blossomLight), .22);
		if (recycleColor) displayColor.lerp(recycleColor, this.recycleSelectionState === "selected" ? .56 : .38);
		this.material.color.copy(displayColor);
		const tailColor = this.tailBaseColor.clone();
		if (this.skillTintColor) tailColor.lerp(this.skillTintColor, this.skillTintStrength);
		if (this.skillRecolorColor) tailColor.lerp(this.skillRecolorColor, MathUtils.smoothstep(this.skillRecolorProgress, .82, 1));
		const tailFreeze = MathUtils.smoothstep(this.freezeProgress, .76, 1) * this.freezeAmount;
		if (tailFreeze > 0) tailColor.lerp(new Color(REFRIGERATOR_FREEZE_COLOR), tailFreeze * .9);
		if (recycleColor) tailColor.lerp(recycleColor, this.recycleSelectionState === "selected" ? .58 : .4);
		this.tailMaterial.color.copy(tailColor);
		if (recycleColor) {
			const intensity = this.recycleSelectionState === "selected" ? .34 + this.recycleSelectionPulse * .2 : .16 + this.recycleSelectionPulse * .1;
			this.material.emissive.copy(recycleColor);
			this.material.emissiveIntensity = intensity;
			this.tailMaterial.emissive.copy(recycleColor);
			this.tailMaterial.emissiveIntensity = intensity;
		} else if (this.skillGlowStrength > 0) {
			this.material.emissive.copy(this.baseColor);
			this.material.emissiveIntensity = .58 + this.skillGlowStrength * .82;
			this.tailMaterial.emissive.copy(this.tailBaseColor);
			this.tailMaterial.emissiveIntensity = .58 + this.skillGlowStrength * .82;
		} else if (this.skillTintColor) {
			this.material.emissive.copy(this.skillTintColor);
			this.material.emissiveIntensity = .3 * this.skillTintEmissionScale;
			this.tailMaterial.emissive.copy(this.skillTintColor);
			this.tailMaterial.emissiveIntensity = .3 * this.skillTintEmissionScale;
		} else if (this.freezeAmount > 0) {
			this.material.emissive.set(0);
			this.material.emissiveIntensity = 1;
			this.tailMaterial.emissive.set(8632778);
			this.tailMaterial.emissiveIntensity = tailFreeze * .2;
		} else {
			this.material.emissive.set(this.isHovered ? 3352126 : 0);
			this.material.emissiveIntensity = this.isHovered ? .35 : 1;
			this.tailMaterial.emissive.set(0);
			this.tailMaterial.emissiveIntensity = 1;
		}
		if (this.outlineMesh) {
			const outlineColor = this.recycleSelectionState === "selected" ? new Color(RECYCLE_SELECTED_OUTLINE_COLOR) : new Color(PAL.ink).lerp(new Color(4218224), this.recycleSelectionState === "none" ? this.freezeAmount * this.freezeProgress * .62 : 0);
			const pulseThickness = this.recycleSelectionState === "selected" ? .0012 * this.recycleSelectionPulse : 3e-4 * this.recycleSelectionPulse;
			setHullOutlineStyle(this.outlineMesh, {
				thickness: this.recycleSelectionState === "selected" ? .009 + pulseThickness : this.recycleSelectionState === "hover" ? .0052 + pulseThickness : BASE_CABLE_OUTLINE_THICKNESS,
				color: outlineColor
			});
		}
	}
	applyRecycleSelectionScale(scale) {
		this.recycleSelectionScale = scale;
		this.root.scale.setScalar(scale);
		this.applyRootPresentationTransform();
	}
	applyRootPresentationTransform() {
		this.root.position.copy(this.bundleBaseRootPosition).add(this.bundleSpacingOffset).addScaledVector(this.recycleSelectionCenter, 1 - this.recycleSelectionScale);
	}
	updateLampGuide(guide, elapsed) {
		if (!guide.visible) return;
		const pulse = (Math.sin(elapsed * 3.4 + this.definition.id.length) + 1) * .5;
		const beam = guide.userData.beam;
		beam.material.uniforms.uOpacity.value = .15 + pulse * .02;
	}
	build(points, withOutline = true, activeEnd = "head") {
		if (points.length < 2) return;
		const previousBody = this.bodyMesh;
		const previousOutline = this.outlineMesh;
		if (previousBody) {
			this.clearRefrigeratorIceGeometry(false);
			this.root.remove(previousBody);
			previousBody.geometry.dispose();
			previousOutline?.geometry.dispose();
			(previousOutline?.material)?.dispose();
		}
		this.bodyThicknessState = null;
		this.outlineThicknessState = null;
		this.pickMeshes.length = 0;
		const firstDirection = points[1].clone().sub(points[0]).normalize();
		const activeExitDirection = activeEnd === "tail" ? this.tailExitDirection : this.exitDirection;
		const renderPoints = points.map((point) => point.clone());
		renderPoints.push(points[points.length - 1].clone().addScaledVector(activeExitDirection, PLUG_CABLE_SOCKET_OVERLAP));
		if (this.tailHead && !this.fakeTailPlug) renderPoints.unshift(points[0].clone().addScaledVector(firstDirection, -PLUG_CABLE_SOCKET_OVERLAP));
		const roundedCable = createRoundedCableGeometry(renderPoints);
		const parts = [roundedCable.geometry];
		if (!this.tailHead) parts.push(transformedGeometry(tailGeometry, points[0].clone().addScaledVector(firstDirection, -ARROW_RADIUS * .3), new Quaternion().setFromUnitVectors(up$1, firstDirection)));
		const mergedGeometry = mergeGeometries(parts, false);
		parts.forEach((part) => part.dispose());
		if (!mergedGeometry) throw new Error(`Unable to merge cable geometry for ${this.definition.id}`);
		mergedGeometry.computeBoundingBox();
		mergedGeometry.computeBoundingSphere();
		const mesh = new Mesh(mergedGeometry, this.material);
		mesh.name = `${this.definition.id}-cable`;
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		mesh.userData.arrowId = this.definition.id;
		mesh.userData.cableFillets = roundedCable.geometry.userData.cableFillets;
		this.outlineMesh = withOutline ? addHullOutline(mesh, BASE_CABLE_OUTLINE_THICKNESS) : null;
		if (this.outlineMesh) this.outlineMesh.visible = false;
		this.bodyMesh = mesh;
		this.bodyThicknessState = captureGeometryThicknessState(mesh.geometry);
		this.outlineThicknessState = this.outlineMesh ? captureGeometryThicknessState(this.outlineMesh.geometry) : null;
		this.currentIceCurve = roundedCable.curve;
		this.setVisualThickness(this.visualThickness);
		mesh.userData.cableEnd = "head";
		if (!this.tailHead) this.pickMeshes.push(mesh);
		this.pickMeshes.push(...this.head.pickMeshes);
		if (this.tailHead) this.pickMeshes.push(...this.tailHead.pickMeshes);
		this.root.add(mesh);
		if (this.refrigeratorIceGeometryEnabled) this.buildRefrigeratorIceGeometry(mergedGeometry, roundedCable.curve);
		const lastPoint = points[points.length - 1];
		const activeHead = activeEnd === "tail" ? this.tailHead : this.head;
		const passiveHead = activeEnd === "tail" ? this.head : this.tailHead;
		activeHead?.root.position.copy(lastPoint);
		const activeFakeTailHead = activeHead === this.tailHead && this.fakeTailPlug ? this.tailHead : null;
		if (activeFakeTailHead) activeFakeTailHead.root.position.addScaledVector(activeExitDirection, -PLUG_HEAD_MAX_LENGTH);
		activeHead?.root.quaternion.setFromUnitVectors(up$1, activeExitDirection);
		if (passiveHead) {
			passiveHead.root.position.copy(points[0]);
			if (passiveHead === this.tailHead && this.fakeTailPlug) passiveHead.root.position.addScaledVector(firstDirection, PLUG_HEAD_MAX_LENGTH);
			passiveHead.root.quaternion.setFromUnitVectors(up$1, firstDirection.clone().negate());
		} else {
			this.tailRoot.position.copy(points[0]);
			this.tailRoot.quaternion.setFromUnitVectors(up$1, firstDirection);
		}
		setCableFreeze(this.material, this.freezeAmount, this.freezeProgress, this.freezeSeed);
		if (this.freezeAmount > 0) {
			const amount = this.freezeAmount;
			const progress = this.freezeProgress;
			this.freezeAmount = -1;
			this.setFrozen(amount, progress);
		}
	}
	tagHeadPickMeshes(head, end) {
		for (const mesh of head.pickMeshes) {
			mesh.userData.arrowId = this.definition.id;
			mesh.userData.cableEnd = end;
		}
	}
};
//#endregion
//#region ../arrow-cube/node_modules/three/examples/jsm/postprocessing/Pass.js
var _camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
var FullscreenTriangleGeometry = class extends BufferGeometry {
	constructor() {
		super();
		this.setAttribute("position", new Float32BufferAttribute([
			-1,
			3,
			0,
			-1,
			-1,
			0,
			3,
			-1,
			0
		], 3));
		this.setAttribute("uv", new Float32BufferAttribute([
			0,
			2,
			0,
			0,
			2,
			0
		], 2));
	}
};
var _geometry = new FullscreenTriangleGeometry();
/**
* This module is a helper for passes which need to render a full
* screen effect which is quite common in context of post processing.
*
* The intended usage is to reuse a single full screen quad for rendering
* subsequent passes by just reassigning the `material` reference.
*
* This module can only be used with {@link WebGLRenderer}.
*
* @augments Mesh
* @three_import import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
*/
var FullScreenQuad = class {
	/**
	* Constructs a new full screen quad.
	*
	* @param {?Material} material - The material to render te full screen quad with.
	*/
	constructor(material) {
		this._mesh = new Mesh(_geometry, material);
	}
	/**
	* Frees the GPU-related resources allocated by this instance. Call this
	* method whenever the instance is no longer used in your app.
	*/
	dispose() {
		this._mesh.geometry.dispose();
	}
	/**
	* Renders the full screen quad.
	*
	* @param {WebGLRenderer} renderer - The renderer.
	*/
	render(renderer) {
		renderer.render(this._mesh, _camera);
	}
	/**
	* The quad's material.
	*
	* @type {?Material}
	*/
	get material() {
		return this._mesh.material;
	}
	set material(value) {
		this._mesh.material = value;
	}
};
//#endregion
//#region src/style/post.ts
var NIGHT_INK = new Color(4932959);
var TELEVISION_GLITCH_BURST_WINDOWS = Object.freeze([
	{
		start: .02,
		attackEnd: .055,
		releaseStart: .14,
		end: .23
	},
	{
		start: .78,
		attackEnd: .82,
		releaseStart: .93,
		end: 1.04
	},
	{
		start: 1.65,
		attackEnd: 1.69,
		releaseStart: 1.79,
		end: 1.9
	},
	{
		start: 2.72,
		attackEnd: 2.76,
		releaseStart: 2.87,
		end: 2.98
	},
	{
		start: 4.08,
		attackEnd: 4.12,
		releaseStart: 4.25,
		end: 4.38
	}
]);
var SkillEffectActivationTimeline = class {
	televisionStartedAt = 0;
	effectActivationCount = 0;
	activate(effect, previousEffect, immediate, nowSeconds = performance.now() * .001) {
		if (effect === "none" || effect === previousEffect && !immediate) return;
		if (effect === "television-glitch") this.televisionStartedAt = nowSeconds;
		this.effectActivationCount += 1;
	}
	age(effect, nowSeconds = performance.now() * .001) {
		return effect === "television-glitch" ? Math.max(0, nowSeconds - this.televisionStartedAt) : 0;
	}
	get activationCount() {
		return this.effectActivationCount;
	}
};
var televisionGlitchBurstGlsl = TELEVISION_GLITCH_BURST_WINDOWS.map((window) => `glitchEnvelope(age, ${window.start.toFixed(3)}, ${window.attackEnd.toFixed(3)}, ${window.releaseStart.toFixed(3)}, ${window.end.toFixed(3)})`).reduce((expression, burst) => `max(${expression}, ${burst})`);
var vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;
var inkShader = {
	uniforms: {
		tDiffuse: { value: null },
		tDepth: { value: null },
		uTexel: { value: new Vector2() },
		uNear: { value: .1 },
		uFar: { value: 100 },
		uInk: { value: new Color(PAL.ink) },
		uThickness: { value: 1.35 },
		uSens: { value: .0042 },
		uConcave: { value: .026 },
		uConcaveAmount: { value: .42 },
		uStrength: { value: .92 },
		uSkyDepth: { value: 80 }
	},
	vertexShader,
	fragmentShader: `
    #include <packing>
    uniform sampler2D tDiffuse;
    uniform sampler2D tDepth;
    uniform vec2 uTexel;
    uniform float uNear, uFar, uThickness, uSens, uConcave, uConcaveAmount;
    uniform float uStrength, uSkyDepth;
    uniform vec3 uInk;
    varying vec2 vUv;

    float linearDepth(vec2 uv) {
      float d = texture2D(tDepth, uv).x;
      return -perspectiveDepthToViewZ(d, uNear, uFar);
    }

    void main() {
      vec3 col = texture2D(tDiffuse, vUv).rgb;
      vec2 t = uTexel * uThickness;
      float dc = linearDepth(vUv);

      if (dc > uSkyDepth) {
        gl_FragColor = vec4(col, 1.0);
        return;
      }

      float dl = linearDepth(vUv - vec2(t.x, 0.0));
      float dr = linearDepth(vUv + vec2(t.x, 0.0));
      float du = linearDepth(vUv + vec2(0.0, t.y));
      float dd = linearDepth(vUv - vec2(0.0, t.y));
      float sx = (dl + dr - 2.0 * dc) / max(dc, 0.001);
      float sy = (du + dd - 2.0 * dc) / max(dc, 0.001);
      float convex = max(0.0, sx) + max(0.0, sy);
      float concave = max(0.0, -sx) + max(0.0, -sy);
      float edge = smoothstep(uSens * 0.32, uSens, convex);
      edge = max(edge, smoothstep(uConcave, uConcave * 3.4, concave) * uConcaveAmount);
      edge *= uStrength;
      vec3 line = mix(uInk, col * 0.42, 0.22);
      gl_FragColor = vec4(mix(col, line, clamp(edge, 0.0, 1.0)), 1.0);
    }
  `
};
var gradeShader = {
	uniforms: {
		tDiffuse: { value: null },
		uShadowTint: { value: new Color(11380944) },
		uLightTint: { value: new Color(16775144) },
		uSaturation: { value: 1.1 },
		uLift: { value: .03 },
		uVignette: { value: .1 },
		uWarmth: { value: .045 },
		uThemeProgress: { value: 0 },
		uExplorationProgress: { value: 0 }
	},
	vertexShader,
	fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec3 uShadowTint, uLightTint;
    uniform float uSaturation, uLift, uVignette, uWarmth, uThemeProgress, uExplorationProgress;
    varying vec2 vUv;

    vec3 linearToSRGB(vec3 c) {
      return mix(
        c * 12.92,
        1.055 * pow(max(c, vec3(0.0031308)), vec3(1.0 / 2.4)) - 0.055,
        step(0.0031308, c)
      );
    }

    void main() {
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      float k = smoothstep(0.02, 0.55, l);
      c *= mix(uShadowTint, uLightTint, k);
      c += vec3(uWarmth, uWarmth * 0.45, 0.0) * l * 0.35;
      c += uLift * (1.0 - k) * (1.0 - uExplorationProgress);
      c = mix(vec3(l), c, uSaturation);
      float r = length(vUv - 0.5) * 1.42;
      c *= 1.0 - uVignette * pow(clamp(r, 0.0, 1.0), 2.6);
      vec3 srgb = linearToSRGB(max(c, vec3(0.0)));
      float nightLuma = dot(srgb, vec3(0.2126, 0.7152, 0.0722));
      vec3 night = mix(vec3(nightLuma), srgb, 1.14) * 0.77;
      night *= vec3(0.97, 0.99, 1.04);
      night += vec3(0.025, 0.03, 0.062) * (1.0 - nightLuma) * (1.0 - uExplorationProgress);
      gl_FragColor = vec4(mix(srgb, night, uThemeProgress), 1.0);
    }
  `
};
var lanternShader = {
	uniforms: {
		tDiffuse: { value: null },
		tDepth: { value: null },
		uLantern: { value: new Vector2() },
		uAspect: { value: 1 },
		uIntensity: { value: 0 },
		uThemeProgress: { value: 0 },
		uExplorationProgress: { value: 0 },
		uColor: { value: new Color(16764845) }
	},
	vertexShader,
	fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform sampler2D tDepth;
    uniform vec2 uLantern;
    uniform float uAspect, uIntensity, uThemeProgress, uExplorationProgress;
    uniform vec3 uColor;
    varying vec2 vUv;

    void main() {
      vec3 normalColor = texture2D(tDiffuse, vUv).rgb;
      float depth = texture2D(tDepth, vUv).x;
      vec2 delta = vUv - (uLantern * 0.5 + 0.5);
      delta.x *= uAspect;
      float distanceToLight = length(delta);
      float core = exp(-pow(distanceToLight / 0.062, 2.0));
      float falloff = exp(-pow(distanceToLight / 0.155, 1.38));
      float sceneMask = 1.0 - smoothstep(0.994, 1.0, depth);
      float peak = max(normalColor.r, max(normalColor.g, normalColor.b));
      float trough = min(normalColor.r, min(normalColor.g, normalColor.b));
      float chroma = peak - trough;
      float neonKeep = smoothstep(0.52, 0.88, peak) * smoothstep(0.09, 0.28, chroma);
      vec3 explorationDark = normalColor * mix(0.025, 0.72, neonKeep);
      vec3 color = mix(normalColor, explorationDark, uExplorationProgress);
      float reveal = clamp(falloff * 1.08, 0.0, 1.0) * sceneMask;
      color = mix(color, normalColor, reveal * uExplorationProgress);
      // Preserve the lantern's bloom-like centre while taking exactly five
      // percent off the hottest core so cable intersections do not white out.
      float exposure = (core * 0.2527 + falloff * 0.38) * uIntensity * uThemeProgress * sceneMask;
      vec3 huePreservingLight = color * mix(vec3(1.0), uColor, 0.18);
      color += huePreservingLight * exposure;
      gl_FragColor = vec4(color, 1.0);
    }
  `
};
var bloomShader = {
	uniforms: {
		tDiffuse: { value: null },
		uTexel: { value: new Vector2() },
		uSampleScale: { value: 1 }
	},
	vertexShader,
	fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 uTexel;
    uniform float uSampleScale;
    varying vec2 vUv;

    vec3 bright(vec3 color) {
      float peak = max(color.r, max(color.g, color.b));
      float mask = smoothstep(0.5, 0.92, peak);
      return color * mask;
    }

    void main() {
      vec2 stepSize = uTexel * 3.0 * uSampleScale;
      vec3 glow = bright(texture2D(tDiffuse, vUv + vec2(stepSize.x, 0.0)).rgb);
      glow += bright(texture2D(tDiffuse, vUv - vec2(stepSize.x, 0.0)).rgb);
      glow += bright(texture2D(tDiffuse, vUv + vec2(0.0, stepSize.y)).rgb);
      glow += bright(texture2D(tDiffuse, vUv - vec2(0.0, stepSize.y)).rgb);
      glow += bright(texture2D(tDiffuse, vUv + stepSize).rgb) * 0.65;
      glow += bright(texture2D(tDiffuse, vUv - stepSize).rgb) * 0.65;
      glow += bright(texture2D(tDiffuse, vUv + vec2(stepSize.x, -stepSize.y)).rgb) * 0.65;
      glow += bright(texture2D(tDiffuse, vUv + vec2(-stepSize.x, stepSize.y)).rgb) * 0.65;
      glow /= 6.6;
      gl_FragColor = vec4(glow, 1.0);
    }
  `
};
var bloomCompositeShader = {
	uniforms: {
		tDiffuse: { value: null },
		tBloom: { value: null },
		uStrength: { value: 0 }
	},
	vertexShader,
	fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform sampler2D tBloom;
    uniform float uStrength;
    varying vec2 vUv;

    void main() {
      vec3 base = texture2D(tDiffuse, vUv).rgb;
      vec3 glow = texture2D(tBloom, vUv).rgb;
      gl_FragColor = vec4(base + glow * uStrength, 1.0);
    }
  `
};
var fxaaShader = {
	uniforms: {
		tDiffuse: { value: null },
		uTexel: { value: new Vector2() }
	},
	vertexShader,
	fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 uTexel;
    varying vec2 vUv;
    float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

    void main() {
      vec3 cM = texture2D(tDiffuse, vUv).rgb;
      vec3 cNW = texture2D(tDiffuse, vUv + vec2(-uTexel.x, -uTexel.y)).rgb;
      vec3 cNE = texture2D(tDiffuse, vUv + vec2( uTexel.x, -uTexel.y)).rgb;
      vec3 cSW = texture2D(tDiffuse, vUv + vec2(-uTexel.x,  uTexel.y)).rgb;
      vec3 cSE = texture2D(tDiffuse, vUv + vec2( uTexel.x,  uTexel.y)).rgb;
      float lM = luma(cM), lNW = luma(cNW), lNE = luma(cNE);
      float lSW = luma(cSW), lSE = luma(cSE);
      float lMin = min(lM, min(min(lNW, lNE), min(lSW, lSE)));
      float lMax = max(lM, max(max(lNW, lNE), max(lSW, lSE)));
      vec2 dir = vec2(-((lNW + lNE) - (lSW + lSE)), (lNW + lSW) - (lNE + lSE));
      float reduce = max((lNW + lNE + lSW + lSE) * 0.045, 1.0 / 128.0);
      float reciprocal = 1.0 / (min(abs(dir.x), abs(dir.y)) + reduce);
      dir = clamp(dir * reciprocal, vec2(-8.0), vec2(8.0)) * uTexel;
      vec3 rgbA = 0.5 * (
        texture2D(tDiffuse, vUv + dir * (1.0 / 3.0 - 0.5)).rgb +
        texture2D(tDiffuse, vUv + dir * (2.0 / 3.0 - 0.5)).rgb
      );
      vec3 rgbB = rgbA * 0.5 + 0.25 * (
        texture2D(tDiffuse, vUv - dir * 0.5).rgb +
        texture2D(tDiffuse, vUv + dir * 0.5).rgb
      );
      float lB = luma(rgbB);
      gl_FragColor = vec4((lB < lMin || lB > lMax) ? rgbA : rgbB, 1.0);
    }
  `
};
var steamBlurShader = {
	uniforms: {
		tDiffuse: { value: null },
		uDirection: { value: new Vector2() }
	},
	vertexShader,
	fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 uDirection;
    varying vec2 vUv;

    void main() {
      vec3 color = texture2D(tDiffuse, vUv).rgb * 0.18;
      color += texture2D(tDiffuse, vUv + uDirection).rgb * 0.16;
      color += texture2D(tDiffuse, vUv - uDirection).rgb * 0.16;
      color += texture2D(tDiffuse, vUv + uDirection * 2.0).rgb * 0.12;
      color += texture2D(tDiffuse, vUv - uDirection * 2.0).rgb * 0.12;
      color += texture2D(tDiffuse, vUv + uDirection * 3.0).rgb * 0.08;
      color += texture2D(tDiffuse, vUv - uDirection * 3.0).rgb * 0.08;
      color += texture2D(tDiffuse, vUv + uDirection * 4.0).rgb * 0.05;
      color += texture2D(tDiffuse, vUv - uDirection * 4.0).rgb * 0.05;
      gl_FragColor = vec4(color, 1.0);
    }
  `
};
/**
* Small CPU-side condensation field. It is deliberately a single low-resolution
* texture: the scene stays in the existing Three.js post stack while this field
* only carries droplet height (R) and wet trails (G).
*/
var SteamCondensationField = class {
	texture;
	canvas;
	context;
	microDrops = [];
	drops = [];
	width = 256;
	height = 144;
	randomState = 1831565813;
	elapsed = 0;
	lastStep = 0;
	lastPaint = -1;
	spawnClock = 0;
	microSpawnClock = 0;
	active = false;
	constructor() {
		this.canvas = document.createElement("canvas");
		this.canvas.width = this.width;
		this.canvas.height = this.height;
		const context = this.canvas.getContext("2d");
		if (!context) throw new Error("Unable to create the steam condensation canvas.");
		this.context = context;
		this.texture = new CanvasTexture(this.canvas);
		this.texture.minFilter = LinearFilter;
		this.texture.magFilter = LinearFilter;
		this.texture.wrapS = ClampToEdgeWrapping;
		this.texture.wrapT = ClampToEdgeWrapping;
		this.texture.colorSpace = "";
		this.texture.needsUpdate = true;
		this.seedMicroDrops();
		this.paint();
	}
	setSize(width, height) {
		const nextWidth = Math.max(128, Math.min(480, Math.floor(width)));
		const nextHeight = Math.max(72, Math.min(320, Math.floor(height)));
		if (nextWidth === this.width && nextHeight === this.height) return;
		this.width = nextWidth;
		this.height = nextHeight;
		this.canvas.width = nextWidth;
		this.canvas.height = nextHeight;
		this.seedMicroDrops();
		this.paint();
	}
	get texel() {
		return new Vector2(1 / this.width, 1 / this.height);
	}
	activate() {
		if (this.active) return;
		this.active = true;
		this.elapsed = 0;
		this.lastStep = 0;
		this.lastPaint = -1;
		this.spawnClock = 0;
		this.microSpawnClock = 0;
		this.drops.length = 0;
		this.seedMicroDrops();
		for (let index = 0; index < 18; index += 1) this.spawnDrop(index / 18);
		this.paint();
	}
	deactivate() {
		this.active = false;
		this.drops.length = 0;
		this.paint();
	}
	update(time) {
		if (!this.active) return;
		if (this.lastStep <= 0) this.lastStep = time;
		const delta = Math.min(.05, Math.max(0, time - this.lastStep));
		this.lastStep = time;
		this.elapsed += delta;
		this.spawnClock += delta;
		this.microSpawnClock += delta;
		while (this.spawnClock > .72 && this.drops.length < 26) {
			this.spawnClock -= .72;
			this.spawnDrop();
		}
		while (this.microSpawnClock > .14) {
			this.microSpawnClock -= .14;
			this.spawnMicroDrop();
		}
		for (const micro of this.microDrops) {
			if (!micro.active) continue;
			micro.age += delta;
			micro.radius = Math.min(micro.maxRadius, micro.radius + micro.growthRate * delta);
			if (micro.age > micro.life) this.resetMicroDrop(micro);
		}
		if (this.drops.length < 26 && this.nextRandom() < delta * .34) {
			const start = Math.floor(this.nextRandom() * this.microDrops.length);
			for (let offset = 0; offset < this.microDrops.length; offset += 1) {
				const micro = this.microDrops[(start + offset) % this.microDrops.length];
				if (!micro.active || micro.age < 1.8 || micro.radius < .0082) continue;
				this.spawnDrop(-1, micro);
				micro.active = false;
				break;
			}
		}
		for (const drop of this.drops) {
			drop.age += delta;
			drop.phase += delta;
			const sizeMotion = .35 + MathUtils.clamp(drop.vy / .08, 0, 1);
			drop.radius = MathUtils.clamp(drop.radius + drop.sizeVelocity * sizeMotion * delta, .0085, .042);
			drop.wait = Math.max(0, drop.wait - delta);
			if (drop.wait <= 0) {
				let pulseScale = 1;
				let frictionScale = 1;
				if (drop.motionStyle === "surge") {
					const cycle = (drop.phase + drop.burstAt) % 4.4;
					if (cycle < .85) {
						pulseScale = 2.45;
						frictionScale = .55;
					} else if (cycle < 2.65) {
						pulseScale = .08;
						frictionScale = 2.75;
					} else {
						pulseScale = 2.1;
						frictionScale = .72;
					}
				} else if (drop.motionStyle === "burst") {
					if (!drop.burstTriggered && drop.phase >= drop.burstAt) {
						drop.vy = Math.max(drop.vy, .07 + this.nextRandom() * .035);
						drop.resistance *= .52;
						drop.burstTriggered = true;
					}
					pulseScale = drop.burstTriggered ? 1.35 : .08;
					frictionScale = drop.burstTriggered ? .68 : 1.9;
				} else if (drop.motionStyle === "stutter") {
					pulseScale = 1.65;
					frictionScale = 2.2;
				} else {
					pulseScale = .82;
					frictionScale = .86;
				}
				drop.motionTimer -= delta;
				if (drop.motionTimer <= 0) {
					const sizeFactor = MathUtils.clamp((drop.radius - .01) / .032, 0, 1);
					drop.motionTimer = .28 + this.nextRandom() * .72;
					drop.resistance = .45 + this.nextRandom() * 1.3 + (1 - drop.mobility) * .55;
					drop.drift = (this.nextRandom() - .5) * (.16 - sizeFactor * .06);
					const pauseThreshold = drop.motionStyle === "stutter" ? .24 + drop.mobility * .28 : .38 + drop.mobility * .5;
					if (drop.vy < (drop.motionStyle === "stutter" ? .021 : .007) && this.nextRandom() > pauseThreshold) drop.wait = .16 + this.nextRandom() * (.72 - drop.mobility * .34);
				}
				const sizeFactor = MathUtils.clamp((drop.radius - .01) / .032, 0, 1);
				const gravityPulseChance = (.16 + sizeFactor * 1.22) * (.62 + drop.mobility * .9) * pulseScale * delta;
				if (this.nextRandom() < gravityPulseChance) {
					drop.vy = Math.min(.125, drop.vy + (.007 + this.nextRandom() * .026) * (.55 + sizeFactor) * (.68 + drop.mobility * .58));
					drop.drift = MathUtils.clamp(drop.drift + (this.nextRandom() - .5) * .045, -.12, .12);
				}
				const friction = (.004 + drop.vy * .12) * (.72 + drop.resistance * .55) * frictionScale;
				drop.vy = Math.max(0, drop.vy - friction * delta);
				const targetVx = drop.vy * drop.drift;
				drop.vx = MathUtils.lerp(drop.vx, targetVx, 1 - Math.exp(-delta * 3.2));
				const previousX = drop.x;
				const previousY = drop.y;
				if (drop.vy > 5e-4) {
					drop.x += drop.vx * delta;
					drop.y += drop.vy * delta;
				}
				drop.distanceSinceTrail += Math.hypot(drop.x - previousX, drop.y - previousY);
				if (drop.distanceSinceTrail >= drop.nextTrailDistance && drop.radius > .012) {
					const beadRadius = drop.radius * (.18 + this.nextRandom() * .18);
					drop.trail.push({
						x: drop.x + (this.nextRandom() - .5) * drop.radius * .28,
						y: drop.y - drop.radius * (.35 + this.nextRandom() * .35),
						radius: beadRadius,
						life: 1
					});
					if (drop.trail.length > 14) drop.trail.shift();
					drop.radius = Math.max(.01, Math.sqrt(Math.max(1e-4, drop.radius * drop.radius - beadRadius * beadRadius * .42)));
					drop.distanceSinceTrail = 0;
					const speedFactor = MathUtils.clamp(drop.vy / .085, 0, 1);
					drop.nextTrailDistance = drop.radius * (.85 + this.nextRandom() * 1.15) * (1 - speedFactor * .35);
				}
				const aspect = this.width / this.height;
				for (const micro of this.microDrops) {
					if (!micro.active) continue;
					const dx = (micro.x - drop.x) * aspect;
					const dy = micro.y - drop.y;
					if (Math.hypot(dx, dy) > drop.radius * .72 + micro.radius) continue;
					const dropArea = drop.radius * drop.radius;
					const microArea = micro.radius * micro.radius;
					drop.radius = Math.min(.042, Math.sqrt(dropArea + microArea * .78));
					drop.vy = Math.min(.125, drop.vy + .0035 + micro.radius * .42);
					drop.resistance *= .88;
					drop.motionTimer = Math.min(drop.motionTimer, .12);
					drop.trail.push({
						x: micro.x,
						y: micro.y,
						radius: micro.radius * .86,
						life: 1
					});
					if (drop.trail.length > 14) drop.trail.shift();
					micro.active = false;
				}
			}
			for (const point of drop.trail) point.life -= delta * .115;
			while (drop.trail.length > 1 && drop.trail[0].life <= 0) drop.trail.shift();
		}
		for (let first = 0; first < this.drops.length; first += 1) {
			const a = this.drops[first];
			for (let second = first + 1; second < this.drops.length; second += 1) {
				const b = this.drops[second];
				const mergeDistance = (a.radius + b.radius) * .68;
				if (Math.hypot(a.x - b.x, a.y - b.y) > mergeDistance || a.radius > .038 || b.radius > .038) continue;
				const areaA = a.radius * a.radius;
				const areaB = b.radius * b.radius;
				const area = areaA + areaB;
				a.x = (a.x * areaA + b.x * areaB) / area;
				a.y = (a.y * areaA + b.y * areaB) / area;
				a.radius = Math.min(.042, Math.sqrt(area));
				const mergedMomentum = (a.vy * areaA + b.vy * areaB) / area;
				a.vy = Math.min(.125, Math.max(a.vy, b.vy, mergedMomentum + .013 + a.radius * .25));
				a.vx = (a.vx * areaA + b.vx * areaB) / area;
				a.sizeVelocity = (a.sizeVelocity * areaA + b.sizeVelocity * areaB) / area;
				a.wait = Math.min(a.wait, b.wait);
				a.resistance *= .72;
				a.mobility = Math.max(a.mobility, b.mobility, .82);
				a.motionTimer = Math.min(a.motionTimer, .08);
				a.trail.push(...b.trail.slice(-3));
				this.drops.splice(second, 1);
				second -= 1;
			}
		}
		for (let index = this.drops.length - 1; index >= 0; index -= 1) {
			const drop = this.drops[index];
			if (drop.y > 1.08 || drop.age > drop.life) this.drops.splice(index, 1);
		}
		if (this.drops.length < 14) this.spawnDrop();
		if (this.lastPaint < 0 || time - this.lastPaint > 1 / 30) {
			this.lastPaint = time;
			this.paint();
		}
	}
	dispose() {
		this.texture.dispose();
	}
	nextRandom() {
		let value = this.randomState += 1831565813;
		value = Math.imul(value ^ value >>> 15, value | 1);
		value ^= value + Math.imul(value ^ value >>> 7, value | 61);
		return ((value ^ value >>> 14) >>> 0) / 4294967296;
	}
	seedMicroDrops() {
		this.microDrops.length = 0;
		this.randomState = 1831565813;
		for (let index = 0; index < 260; index += 1) this.microDrops.push(this.createMicroDrop());
	}
	createMicroDrop() {
		const radiusSeed = this.nextRandom();
		const radius = .0042 + Math.pow(radiusSeed, .72) * .0062;
		const micro = {
			x: .5,
			y: .5,
			radius,
			maxRadius: radius + .0012 + this.nextRandom() * .0038,
			growthRate: 5e-5 + this.nextRandom() * 2e-4,
			opacity: .38 + this.nextRandom() * .42,
			age: this.nextRandom() * 7,
			life: 10 + this.nextRandom() * 20,
			active: true
		};
		this.placeMicroDrop(micro);
		return micro;
	}
	placeMicroDrop(micro) {
		const region = this.nextRandom();
		if (region < .7) {
			micro.x = .02 + this.nextRandom() * .96;
			micro.y = .02 + this.nextRandom() * .96;
		} else if (region < .85) {
			micro.x = .025 + this.nextRandom() * .95;
			micro.y = .01 + this.nextRandom() * .3;
		} else {
			micro.x = this.nextRandom() < .5 ? .012 + this.nextRandom() * .13 : .858 + this.nextRandom() * .13;
			micro.y = .025 + this.nextRandom() * .95;
		}
	}
	resetMicroDrop(micro) {
		const radiusSeed = this.nextRandom();
		const radius = .0042 + Math.pow(radiusSeed, .72) * .0062;
		this.placeMicroDrop(micro);
		micro.radius = radius;
		micro.maxRadius = radius + .0012 + this.nextRandom() * .0038;
		micro.growthRate = 5e-5 + this.nextRandom() * 2e-4;
		micro.opacity = .38 + this.nextRandom() * .42;
		micro.age = 0;
		micro.life = 10 + this.nextRandom() * 20;
		micro.active = true;
	}
	spawnMicroDrop() {
		const inactive = this.microDrops.find((micro) => !micro.active);
		if (inactive) {
			this.resetMicroDrop(inactive);
			return;
		}
		if (this.microDrops.length < 320) {
			const micro = this.createMicroDrop();
			micro.age = 0;
			this.microDrops.push(micro);
			return;
		}
		let oldest = null;
		let oldestProgress = 0;
		for (const micro of this.microDrops) {
			const progress = micro.age / micro.life;
			if (progress <= oldestProgress) continue;
			oldest = micro;
			oldestProgress = progress;
		}
		if (oldest && oldestProgress > .82) this.resetMicroDrop(oldest);
	}
	spawnDrop(sequence = -1, origin) {
		const edge = sequence >= 0 ? sequence : this.nextRandom();
		let x = .5;
		let y = 0;
		if (origin) {
			x = origin.x;
			y = origin.y;
		} else if (edge < .62) {
			x = .05 + this.nextRandom() * .9;
			y = -.02 + this.nextRandom() * .1;
		} else if (edge < .72) {
			x = .015 + this.nextRandom() * .09;
			y = .04 + this.nextRandom() * .44;
		} else if (edge < .82) {
			x = .895 + this.nextRandom() * .09;
			y = .04 + this.nextRandom() * .44;
		} else {
			x = .1 + this.nextRandom() * .8;
			y = .08 + this.nextRandom() * .42;
		}
		const mobility = .22 + this.nextRandom() * .78;
		const styleRoll = this.nextRandom();
		const motionStyle = styleRoll < .25 ? "surge" : styleRoll < .5 ? "burst" : styleRoll < .75 ? "stutter" : "steady";
		let vy = .018 + this.nextRandom() * .022;
		let wait = .1 + this.nextRandom() * .6;
		let burstAt = this.nextRandom() * 4.4;
		if (motionStyle === "surge") {
			vy = .035 + this.nextRandom() * .03;
			wait = .05 + this.nextRandom() * .3;
		} else if (motionStyle === "burst") {
			vy = this.nextRandom() * .006;
			wait = .5 + this.nextRandom() * 1.3;
			burstAt = 1.4 + this.nextRandom() * 2.4;
		} else if (motionStyle === "stutter") {
			vy = .008 + this.nextRandom() * .017;
			wait = .2 + this.nextRandom();
		}
		const sizeRoll = this.nextRandom();
		const sizeVelocity = sizeRoll < .35 ? 7e-4 + this.nextRandom() * .0011 : sizeRoll < .65 ? -(5e-4 + this.nextRandom() * 8e-4) : (this.nextRandom() - .5) * 16e-5;
		this.drops.push({
			x,
			y,
			radius: origin ? Math.max(.009, origin.radius * (.95 + this.nextRandom() * .22)) : .0105 + this.nextRandom() * .0135,
			vx: (this.nextRandom() - .5) * .003,
			vy,
			drift: (this.nextRandom() - .5) * .08,
			resistance: .52 + this.nextRandom() * 1.08 + (1 - mobility) * .36,
			mobility,
			motionStyle,
			phase: 0,
			burstAt,
			burstTriggered: false,
			sizeVelocity,
			motionTimer: .15 + this.nextRandom() * .6,
			distanceSinceTrail: 0,
			nextTrailDistance: .018 + this.nextRandom() * .032,
			wait,
			age: 0,
			life: 15 + this.nextRandom() * 12,
			trail: []
		});
	}
	paint() {
		const context = this.context;
		context.imageSmoothingEnabled = true;
		context.imageSmoothingQuality = "high";
		context.globalCompositeOperation = "source-over";
		context.fillStyle = "rgb(0,0,0)";
		context.fillRect(0, 0, this.width, this.height);
		context.globalCompositeOperation = "lighter";
		const drawMask = (x, y, radius, color, stretchX = .78, stretchY = 1.12, opacity = .88) => {
			const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
			gradient.addColorStop(0, color.replace("ALPHA", opacity.toFixed(3)));
			gradient.addColorStop(.58, color.replace("ALPHA", (opacity * .48).toFixed(3)));
			gradient.addColorStop(1, color.replace("ALPHA", "0"));
			context.fillStyle = gradient;
			context.beginPath();
			context.ellipse(x, y, radius * stretchX, radius * stretchY, 0, 0, Math.PI * 2);
			context.fill();
		};
		const drawTeardropMask = (x, y, radius, lean, speed, opacity = .92) => {
			const tipY = -radius * (.9 + speed * .34);
			const baseY = radius * (.72 + speed * .04);
			const halfWidth = radius * (.4 - speed * .028);
			const gradient = context.createLinearGradient(x, y + tipY, x, y + baseY);
			gradient.addColorStop(0, `rgba(255,0,0,${(opacity * .3).toFixed(3)})`);
			gradient.addColorStop(.24, `rgba(255,0,0,${(opacity * .52).toFixed(3)})`);
			gradient.addColorStop(.62, `rgba(255,0,0,${(opacity * .88).toFixed(3)})`);
			gradient.addColorStop(1, `rgba(255,0,0,${(opacity * .72).toFixed(3)})`);
			context.save();
			context.filter = "blur(0.65px)";
			context.fillStyle = gradient;
			context.beginPath();
			context.moveTo(x + lean, y + tipY);
			context.bezierCurveTo(x + lean * .58 - radius * .12, y - radius * .6, x - halfWidth, y - radius * .1, x - halfWidth, y + radius * .24);
			context.bezierCurveTo(x - halfWidth * .92, y + radius * .58, x - halfWidth * .42, y + baseY, x, y + baseY);
			context.bezierCurveTo(x + halfWidth * .42, y + baseY, x + halfWidth * .92, y + radius * .58, x + halfWidth, y + radius * .24);
			context.bezierCurveTo(x + halfWidth, y - radius * .1, x + lean * .58 + radius * .12, y - radius * .6, x + lean, y + tipY);
			context.closePath();
			context.fill();
			context.restore();
		};
		for (const micro of this.microDrops) {
			if (!micro.active) continue;
			const fadeIn = MathUtils.clamp(micro.age / .9, 0, 1);
			const fadeOut = MathUtils.clamp((micro.life - micro.age) / 1.4, 0, 1);
			drawMask(micro.x * this.width, micro.y * this.height, micro.radius * this.height, "rgba(255,0,0,ALPHA)", .72 + micro.radius * 18, .92 + micro.radius * 24, micro.opacity * fadeIn * fadeOut);
		}
		for (const drop of this.drops) {
			for (const bead of drop.trail) {
				drawMask(bead.x * this.width, bead.y * this.height, Math.max(1.2, bead.radius * this.height * 1.9), "rgba(0,255,0,ALPHA)", .86, 1.34, Math.max(0, bead.life) * .1);
				drawMask(bead.x * this.width, bead.y * this.height, Math.max(.7, bead.radius * this.height), "rgba(255,0,0,ALPHA)", .74, 1.06, Math.max(0, bead.life) * .4);
			}
			const x = drop.x * this.width;
			const y = drop.y * this.height;
			const radius = drop.radius * this.height;
			const speed = MathUtils.clamp(drop.vy / .085, 0, 1);
			drawTeardropMask(x, y, radius, MathUtils.clamp(-drop.drift * radius * 1.45, -radius * .25, radius * .25), speed);
		}
		context.globalCompositeOperation = "source-over";
		this.texture.needsUpdate = true;
	}
};
var skillEffectShader = {
	uniforms: {
		tDiffuse: { value: null },
		tScene: { value: null },
		uCondensation: { value: null },
		uTexel: { value: new Vector2() },
		uCondensationTexel: { value: new Vector2() },
		uTime: { value: 0 },
		uEffectAge: { value: 0 },
		uEffect: { value: 0 },
		uEffectProgress: { value: 0 },
		uCoffeeSplashProgress: { value: 1 },
		uThemeProgress: { value: 0 },
		uSteamClearProgress: { value: 0 },
		uSteamClearOrigin: { value: .1 },
		uSteamClearDirection: { value: 1 },
		uSteamRevealProgress: { value: 1 },
		uSteamRevealOrigin: { value: .1 },
		uSteamRevealDirection: { value: 1 }
	},
	vertexShader,
	fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform sampler2D tScene;
    uniform sampler2D uCondensation;
    uniform vec2 uTexel;
    uniform vec2 uCondensationTexel;
    uniform float uTime;
    uniform float uEffectAge;
    uniform float uThemeProgress;
    uniform float uEffectProgress;
    uniform float uCoffeeSplashProgress;
    uniform float uSteamClearProgress;
    uniform float uSteamClearOrigin;
    uniform float uSteamClearDirection;
    uniform float uSteamRevealProgress;
    uniform float uSteamRevealOrigin;
    uniform float uSteamRevealDirection;
    uniform int uEffect;
    varying vec2 vUv;

    float hash(vec2 point) {
      return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453);
    }

    float noise(vec2 point) {
      vec2 cell = floor(point);
      vec2 local = fract(point);
      local = local * local * (3.0 - 2.0 * local);
      float a = hash(cell);
      float b = hash(cell + vec2(1.0, 0.0));
      float c = hash(cell + vec2(0.0, 1.0));
      float d = hash(cell + vec2(1.0, 1.0));
      return mix(mix(a, b, local.x), mix(c, d, local.x), local.y);
    }

    float glitchEnvelope(float age, float start, float attackEnd, float releaseStart, float end) {
      float attack = smoothstep(start, attackEnd, age);
      float release = 1.0 - smoothstep(releaseStart, end, age);
      return attack * release * step(start, age) * (1.0 - step(end, age));
    }

    float televisionGlitchBurst(float age) {
      return clamp(${televisionGlitchBurstGlsl}, 0.0, 1.0);
    }

    float fbm(vec2 point) {
      return noise(point) * 0.58 + noise(point * 2.03 + 13.7) * 0.28 + noise(point * 4.11 - 7.2) * 0.14;
    }


    vec2 coffeeAspectPoint(vec2 sampleUv, vec2 center) {
      vec2 point = sampleUv - center;
      point.x *= uTexel.y / max(uTexel.x, 0.000001);
      return point;
    }

    float coffeeSmoothMerge(float a, float b, float softness) {
      float safeSoftness = max(softness, 0.0001);
      float blend = clamp(0.5 + 0.5 * (a - b) / safeSoftness, 0.0, 1.0);
      return clamp(mix(b, a, blend) + safeSoftness * blend * (1.0 - blend), 0.0, 1.0);
    }

    float coffeeEllipseMask(
      vec2 point,
      vec2 offset,
      vec2 radius,
      float rotation,
      float seed
    ) {
      vec2 local = point - offset;
      float cosine = cos(rotation);
      float sine = sin(rotation);
      local = vec2(
        local.x * cosine + local.y * sine,
        -local.x * sine + local.y * cosine
      );
      vec2 normalized = local / max(radius, vec2(0.0001));
      float squaredDistance = dot(normalized, normalized);
      return 1.0 - smoothstep(0.79, 1.14, squaredDistance);
    }

    float coffeeSplat(vec2 sampleUv, vec2 center, float radius, float seed) {
      vec2 point = coffeeAspectPoint(sampleUv, center);
      float orientation = seed * 0.83;
      vec2 direction = vec2(cos(orientation), sin(orientation));
      vec2 tangent = vec2(-direction.y, direction.x);
      float body = coffeeEllipseMask(
        point,
        vec2(0.0),
        radius * vec2(1.06, 0.88),
        orientation * 0.18,
        seed
      );
      body = coffeeSmoothMerge(body, coffeeEllipseMask(
        point,
        direction * radius * 0.61,
        radius * vec2(0.49, 0.38),
        orientation + 0.18,
        seed + 1.7
      ), 0.055);
      body = coffeeSmoothMerge(body, coffeeEllipseMask(
        point,
        -direction * radius * 0.53,
        radius * vec2(0.43, 0.51),
        orientation - 0.44,
        seed + 3.1
      ), 0.05);
      body = coffeeSmoothMerge(body, coffeeEllipseMask(
        point,
        tangent * radius * 0.58,
        radius * vec2(0.4, 0.52),
        orientation + 0.86,
        seed + 4.8
      ), 0.048);
      body = coffeeSmoothMerge(body, coffeeEllipseMask(
        point,
        -tangent * radius * 0.55,
        radius * vec2(0.47, 0.36),
        orientation - 0.72,
        seed + 6.2
      ), 0.045);
      body = coffeeSmoothMerge(body, coffeeEllipseMask(
        point,
        (direction + tangent) * radius * 0.43,
        radius * vec2(0.34, 0.3),
        orientation + 1.16,
        seed + 8.3
      ), 0.04);
      return body;
    }

    float coffeeCrownFinger(
      vec2 sampleUv,
      vec2 center,
      float angle,
      float start,
      float extent,
      float width,
      float curve
    ) {
      vec2 point = coffeeAspectPoint(sampleUv, center);
      vec2 direction = vec2(cos(angle), sin(angle));
      vec2 tangent = vec2(-direction.y, direction.x);
      float along = dot(point, direction);
      float across = dot(point, tangent);
      float progress = clamp((along - start) / max(extent - start, 0.0001), 0.0, 1.0);
      across -= sin(progress * 3.14159265) * curve;
      float taper = pow(max(0.0, 1.0 - progress), 0.62);
      float unevenness = 0.92 + sin(progress * 7.0 + angle * 2.7) * 0.08;
      float activeWidth = width * max(0.018, taper) * unevenness;
      float shaft = 1.0 - smoothstep(activeWidth, activeWidth + 0.0048, abs(across));
      shaft *= smoothstep(start - width * 0.9, start + width * 0.28, along);
      shaft *= 1.0 - smoothstep(extent - width * 0.18, extent + width * 0.12, along);
      return shaft;
    }

    float coffeeDrop(vec2 sampleUv, vec2 center, vec2 radius) {
      vec2 point = coffeeAspectPoint(sampleUv, center);
      float seed = hash(center * vec2(193.7, 317.3) + radius * vec2(971.0, 613.0));
      float rotation = (seed - 0.5) * 2.8;
      float shape = coffeeEllipseMask(point, vec2(0.0), radius, rotation, seed * 7.0);
      if (seed < 0.34) {
        vec2 offset = vec2(cos(rotation), sin(rotation)) * radius.x * 0.48;
        shape = coffeeSmoothMerge(shape, coffeeEllipseMask(
          point,
          offset,
          radius * vec2(0.58, 0.72),
          rotation + 0.18,
          seed * 11.0
        ), 0.09);
      } else if (seed < 0.67) {
        vec2 direction = vec2(cos(rotation), sin(rotation));
        vec2 tangent = vec2(-direction.y, direction.x);
        shape = coffeeSmoothMerge(shape, coffeeEllipseMask(
          point,
          tangent * radius.y * 0.46,
          radius * vec2(0.64, 0.58),
          rotation - 0.52,
          seed * 13.0
        ), 0.085);
        float notch = coffeeEllipseMask(
          point,
          -tangent * radius.y * 0.88,
          radius * vec2(0.31, 0.36),
          rotation,
          seed * 17.0
        );
        shape *= 1.0 - notch * 0.36;
      } else {
        vec2 direction = vec2(cos(rotation), sin(rotation));
        vec2 tangent = vec2(-direction.y, direction.x);
        shape = coffeeSmoothMerge(shape, coffeeEllipseMask(
          point,
          direction * radius.x * 0.34 + tangent * radius.y * 0.25,
          radius * vec2(0.52, 0.49),
          rotation + 0.64,
          seed * 19.0
        ), 0.075);
        shape = coffeeSmoothMerge(shape, coffeeEllipseMask(
          point,
          -direction * radius.x * 0.28 - tangent * radius.y * 0.31,
          radius * vec2(0.43, 0.38),
          rotation - 0.78,
          seed * 23.0
        ), 0.07);
      }
      return shape;
    }

    float coffeeGlint(vec2 sampleUv, vec2 center, vec2 radius) {
      vec2 point = coffeeAspectPoint(sampleUv, center) / max(radius, vec2(0.0001));
      return 1.0 - smoothstep(0.82, 1.08, length(point));
    }

    float coffeeFlyingDrop(
      vec2 sampleUv,
      vec2 center,
      vec2 velocity,
      vec2 radius,
      float seed,
      float age
    ) {
      float aspect = uTexel.y / max(uTexel.x, 0.000001);
      vec2 point = coffeeAspectPoint(sampleUv, center);
      vec2 aspectVelocity = vec2(velocity.x * aspect, velocity.y);
      float speed = length(aspectVelocity);
      vec2 direction = aspectVelocity / max(speed, 0.0001);
      vec2 tangent = vec2(-direction.y, direction.x);
      float rotation = atan(direction.y, direction.x);
      float stretch = 1.0 + clamp(speed * 1.15, 0.0, 0.72);
      float flutter = sin(age * 8.0 + seed * 9.0) * radius.y * 0.34;
      float body = coffeeEllipseMask(
        point,
        tangent * flutter,
        vec2(radius.x * stretch, radius.y * 1.18),
        rotation,
        seed * 11.0
      );
      body = coffeeSmoothMerge(body, coffeeEllipseMask(
        point,
        direction * radius.x * stretch * 0.42 + tangent * flutter * 0.45,
        vec2(radius.x * 0.62, radius.y * 0.86),
        rotation + 0.14,
        seed * 17.0
      ), 0.09);
      body = coffeeSmoothMerge(body, coffeeEllipseMask(
        point,
        -direction * radius.x * stretch * 0.52 - tangent * flutter * 0.24,
        vec2(radius.x * 0.5, radius.y * 0.72),
        rotation - 0.18,
        seed * 23.0
      ), 0.08);

      vec2 directionUv = vec2(direction.x / aspect, direction.y);
      vec2 tangentUv = vec2(tangent.x / aspect, tangent.y);
      vec2 fragmentCenterA = center - directionUv * radius.x * stretch * 1.48;
      fragmentCenterA += tangentUv * radius.y * mix(-0.72, 0.62, seed);
      vec2 fragmentCenterB = center - directionUv * radius.x * stretch * 2.05;
      fragmentCenterB -= tangentUv * radius.y * mix(0.35, 0.9, seed);
      float fragments = coffeeDrop(sampleUv, fragmentCenterA, radius * vec2(0.32, 0.45));
      fragments = max(fragments, coffeeDrop(sampleUv, fragmentCenterB, radius * vec2(0.2, 0.3)));
      float fragmentReveal = smoothstep(0.1, 0.34, age) * (1.0 - smoothstep(0.78, 1.0, age));
      return max(body, fragments * fragmentReveal * 0.9);
    }

    float coffeeDrip(vec2 sampleUv, vec2 anchor, float width, float extent, float progress) {
      vec2 point = coffeeAspectPoint(sampleUv, anchor);
      float downward = -point.y;
      float head = extent * smoothstep(0.02, 0.94, progress);
      float waviness = sin(downward * 31.0 + anchor.x * 47.0) * width * 0.42;
      waviness += sin(downward * 67.0 - anchor.y * 39.0) * width * 0.15;
      float trailWidth = width * mix(0.72, 0.36, smoothstep(0.0, max(extent, 0.0001), downward));
      float shaft = 1.0 - smoothstep(trailWidth, trailWidth + 0.0045, abs(point.x - waviness));
      shaft *= smoothstep(-width * 0.7, width * 0.35, downward);
      shaft *= 1.0 - smoothstep(head - width * 0.45, head + width * 0.18, downward);
      float beadPulse = pow(max(0.0, sin(downward * 82.0 + anchor.x * 53.0)), 10.0);
      float beads = 1.0 - smoothstep(
        trailWidth * (0.9 + beadPulse * 0.5),
        trailWidth * (1.2 + beadPulse * 0.65),
        abs(point.x - waviness)
      );
      beads *= beadPulse * smoothstep(0.04, 0.24, downward) * (1.0 - smoothstep(head - 0.04, head, downward));
      vec2 bulbPoint = vec2(point.x - waviness, downward - head + width * 0.06);
      bulbPoint.x += bulbPoint.y * sin(anchor.x * 47.0) * 0.18;
      float bulbY = bulbPoint.y / max(width * 2.15, 0.0001);
      float pearWidth = mix(0.28, 1.1, smoothstep(-0.76, 0.2, bulbY));
      pearWidth *= 1.0 - smoothstep(0.38, 1.0, bulbY) * 0.48;
      vec2 bulbShape = vec2(
        bulbPoint.x / max(width * pearWidth, 0.0001),
        bulbY
      );
      vec2 bulbLobe = (bulbShape - vec2(sin(anchor.x * 61.0) * 0.2, 0.24)) / vec2(0.84, 0.7);
      float bulbField = length(bulbShape) - 0.86;
      bulbField = min(bulbField, length(bulbLobe) - 0.72);
      bulbField += clamp(bulbShape.x * bulbShape.y, -1.2, 1.2) * sin(anchor.y * 43.0) * 0.055;
      float bulb = 1.0 - smoothstep(-0.075, 0.1, bulbField);
      return max(shaft * 0.84, max(beads * 0.72, bulb));
    }

    float coffeeCluster(
      vec2 sampleUv,
      vec2 center,
      float radius,
      float seed,
      float growth,
      float gravity
    ) {
      float easedGrowth = 1.0 - pow(1.0 - growth, 3.0);
      float activeRadius = radius * max(0.02, easedGrowth);
      float body = coffeeSplat(sampleUv, center, activeRadius, seed);
      float crownReveal = smoothstep(0.22, 0.68, growth);
      if (radius > 0.125) {
        float crownStart = activeRadius * 0.62;
        float crowns = coffeeCrownFinger(
          sampleUv,
          center,
          seed * 1.73,
          crownStart,
          activeRadius * 1.46,
          radius * 0.145 * easedGrowth,
          sin(seed * 2.1) * radius * 0.045
        );
        crowns = max(crowns, coffeeCrownFinger(
          sampleUv,
          center,
          seed * 2.37 + 1.8,
          crownStart,
          activeRadius * 1.38,
          radius * 0.12 * easedGrowth,
          cos(seed * 1.8) * radius * 0.038
        ));
        if (radius > 0.175) {
          crowns = max(crowns, coffeeCrownFinger(
            sampleUv,
            center,
            seed * 3.19 - 2.2,
            crownStart,
            activeRadius * 1.31,
            radius * 0.105 * easedGrowth,
            sin(seed * 4.2) * radius * 0.032
          ));
        }
        body = coffeeSmoothMerge(body, crowns * crownReveal, 0.09);
      }

      vec2 satelliteDirection = vec2(cos(seed * 5.1), sin(seed * 5.1));
      vec2 satelliteTangent = vec2(-satelliteDirection.y, satelliteDirection.x);
      float satellites = coffeeDrop(
        sampleUv,
        center + satelliteDirection * radius * 1.56,
        vec2(radius * 0.11, radius * 0.085)
      );
      satellites = max(satellites, coffeeDrop(
        sampleUv,
        center + satelliteTangent * radius * 1.31,
        vec2(radius * 0.075, radius * 0.061)
      ));
      satellites = max(satellites, coffeeDrop(
        sampleUv,
        center - satelliteDirection * radius * 1.42 - satelliteTangent * radius * 0.22,
        vec2(radius * 0.052, radius * 0.044)
      ));
      satellites *= smoothstep(0.18, 0.62, growth);

      float drips = 0.0;
      if (radius > 0.105) {
        drips = coffeeDrip(
          sampleUv,
          center + vec2(-radius * 0.18, -activeRadius * 0.66),
          radius * 0.06,
          radius * 2.4,
          gravity
        );
        drips = max(drips, coffeeDrip(
          sampleUv,
          center + vec2(radius * 0.25, -activeRadius * 0.54),
          radius * 0.044,
          radius * 1.68,
          max(0.0, gravity - 0.08)
        ));
      }
      return max(body, max(satellites, drips));
    }

    void main() {
      vec2 uv = vUv;
      vec3 color = texture2D(tDiffuse, uv).rgb;
      if (uEffect == 1) {
        // Bathroom glass is not a uniform Gaussian blur. The low-resolution
        // field stores droplet height in R and wet trails in G; the shader
        // reconstructs a cheap normal, then lets the clear scene bend inside
        // each droplet while the wider scene stays frosted and milky.
        float moisture = texture2D(uCondensation, uv).r;
        float wetTrail = texture2D(uCondensation, uv).g;
        float trailL = texture2D(uCondensation, uv - vec2(uCondensationTexel.x, 0.0)).g;
        float trailR = texture2D(uCondensation, uv + vec2(uCondensationTexel.x, 0.0)).g;
        float heightL = texture2D(uCondensation, uv - vec2(uCondensationTexel.x, 0.0)).r;
        float heightR = texture2D(uCondensation, uv + vec2(uCondensationTexel.x, 0.0)).r;
        float heightD = texture2D(uCondensation, uv - vec2(0.0, uCondensationTexel.y)).r;
        float heightU = texture2D(uCondensation, uv + vec2(0.0, uCondensationTexel.y)).r;
        vec2 gradient = vec2(heightR - heightL, heightU - heightD);
        float dropBody = smoothstep(0.025, 0.17, moisture);
        vec3 dropNormal = normalize(vec3(-gradient * 6.0, 1.0));

        float cloud = fbm(uv * vec2(4.7, 3.9) + vec2(uTime * 0.018, -uTime * 0.012));
        float topCondensation = smoothstep(0.56, 1.0, uv.y);
        float sideCondensation = smoothstep(0.5, 1.0, abs(uv.x - 0.5) * 2.0);
        float edgeCondensation = topCondensation * 0.26 + sideCondensation * 0.15;
        float dayWeight = 1.0 - uThemeProgress;
        float fog = clamp(0.34 + dayWeight * 0.055 + cloud * 0.45 + edgeCondensation - wetTrail * 0.12, 0.24, 0.94);

        vec2 softFlow = vec2(
          noise(uv * vec2(3.4, 2.9) + uTime * 0.025) - 0.5,
          noise(uv * vec2(2.6, 4.2) - uTime * 0.018) - 0.5
        ) * uTexel * 2.3;
        vec3 clearScene = texture2D(tScene, uv).rgb;
        vec3 diffused = texture2D(tDiffuse, uv + softFlow).rgb;
        float diffusedLuma = dot(diffused, vec3(0.2126, 0.7152, 0.0722));
        diffused = mix(diffused, vec3(diffusedLuma), 0.12);
        vec3 frosted = mix(clearScene, diffused, smoothstep(0.12, 0.82, fog));
        frosted = mix(frosted, vec3(0.84, 0.91, 0.93), fog * 0.24);

        vec2 refractedUv = uv + gradient * uTexel * (43.0 + dayWeight * 7.0) * dropBody;
        vec3 refractedClear = texture2D(tScene, refractedUv).rgb;
        vec3 refractedBlur = texture2D(tDiffuse, refractedUv + softFlow).rgb;
        vec3 refractedScene = mix(refractedClear, refractedBlur, 0.44 + dayWeight * 0.16);
        float dropletClarity = dropBody * (0.24 + wetTrail * 0.04);
        color = mix(frosted, refractedScene, clamp(dropletClarity, 0.0, 0.48));
        vec2 trailShift = vec2((noise(uv * vec2(9.0, 3.0) + uTime * 0.04) - 0.5) * uTexel.x * 8.0, 0.0);
        vec3 trailClear = texture2D(tScene, uv + trailShift).rgb;
        vec3 trailBlur = texture2D(tDiffuse, uv + trailShift + softFlow).rgb;
        vec3 trailScene = mix(trailClear, trailBlur, 0.42 + dayWeight * 0.18);
        color = mix(color, trailScene, clamp(wetTrail * 0.2, 0.0, 0.15));
        float trailRim = smoothstep(0.025, 0.18, abs(trailR - trailL));
        color += vec3(0.1, 0.15, 0.17) * trailRim * 0.08;

        // Cell jitter and varied radii avoid the regular pin-grid look. The
        // slow life cycle keeps condensation changing while wet trails clear it.
        vec2 microDomain = vec2(
          uv.x * 58.0 + uv.y * 13.0,
          uv.y * 34.0 - uv.x * 9.0
        );
        vec2 microCell = floor(microDomain);
        vec2 microCellUv = fract(microDomain);
        vec2 microJitter = vec2(
          hash(microCell + vec2(17.3, 4.1)),
          hash(microCell + vec2(8.7, 29.4))
        ) - 0.5;
        vec2 microLocal = microCellUv - (0.5 + microJitter * 0.88);
        float microSeed = hash(microCell);
        float microSizeSeed = hash(microCell + vec2(41.2, 13.8));
        float microRadius = mix(0.15, 0.32, pow(microSizeSeed, 0.72));
        float microDistance = length(microLocal * vec2(1.0, 1.18));
        float microShape = 1.0 - smoothstep(microRadius * 0.38, microRadius, microDistance);
        float microCycle = fract(uTime * 0.035 + hash(microCell + vec2(73.4, 9.6)));
        float microLife = smoothstep(0.0, 0.12, microCycle) * (1.0 - smoothstep(0.82, 1.0, microCycle));
        float clearedByFlow = 1.0 - smoothstep(0.025, 0.2, moisture + wetTrail * 0.9);
        float micro = microShape * step(0.72, microSeed) * microLife * clearedByFlow
          * (0.78 + edgeCondensation * 0.88);
        vec2 microNormal = normalize(microLocal + vec2(0.0001)) * uTexel * (5.0 + microSeed * 4.0);
        vec3 microScene = texture2D(tDiffuse, uv + microNormal).rgb;
        color = mix(color, microScene, micro * (0.28 + dayWeight * 0.05));
        float microCore = 1.0 - smoothstep(microRadius * 0.22, microRadius * 0.52, microDistance);
        float microRim = clamp(microShape - microCore, 0.0, 1.0)
          * step(0.72, microSeed) * microLife * clearedByFlow;
        float microSide = dot(normalize(microLocal + vec2(0.0001)), normalize(vec2(-0.48, 0.72)));
        color *= 1.0 - microRim * (0.055 + dayWeight * 0.025) * max(0.0, -microSide);
        color += vec3(0.12, 0.18, 0.2) * microRim * (0.16 + max(0.0, microSide) * 0.1);

        vec3 lightDirection = normalize(vec3(-0.34, 0.65, 0.78));
        float dropletLight = pow(max(dot(dropNormal, lightDirection), 0.0), 18.0) * dropBody;
        float dropletRim = smoothstep(0.08, 0.65, length(gradient) * 13.0) * dropBody;
        float dropletShade = dot(dropNormal.xy, vec2(0.42, -0.58)) * dropBody;
        color *= 1.0 - max(0.0, -dropletShade) * 0.08;
        color *= 1.0 - dropletRim * (0.055 + dayWeight * 0.025);
        color += vec3(0.13, 0.19, 0.21) * dropletLight * 0.22;
        color += vec3(0.09, 0.14, 0.16) * dropletRim * 0.15;

        float revealProgress = clamp(uSteamRevealProgress, 0.0, 1.0);
        float revealTravel = smoothstep(0.03, 0.96, revealProgress);
        float revealStart = uSteamRevealOrigin - uSteamRevealDirection * 0.14;
        float revealEnd = uSteamRevealDirection > 0.0 ? 1.16 : -0.16;
        float revealFront = mix(revealStart, revealEnd, revealTravel);
        float revealTurbulence = (noise(vec2(uv.y * 5.4, uTime * 0.42)) - 0.5) * 0.07;
        revealTurbulence += sin(uv.y * 15.0 - uTime * 0.75) * 0.012;
        float revealSignedDistance = uSteamRevealDirection
          * (revealFront + revealTurbulence - uv.x);
        float revealCoverage = smoothstep(-0.095, 0.095, revealSignedDistance);
        float revealStrength = smoothstep(0.0, 0.16, revealProgress)
          * mix(0.34, 1.0, smoothstep(0.1, 0.88, revealProgress));
        color = mix(clearScene, color, revealCoverage * revealStrength);

        if (uSteamClearProgress > 0.0) {
          float clearProgress = smoothstep(0.0, 1.0, clamp(uSteamClearProgress, 0.0, 1.0));
          float startFront = uSteamClearOrigin - uSteamClearDirection * 0.18;
          float endFront = uSteamClearDirection > 0.0 ? 1.16 : -0.16;
          float front = mix(startFront, endFront, clearProgress);
          float turbulence = (noise(vec2(uv.y * 7.0, uTime * 1.35)) - 0.5) * 0.085;
          turbulence += sin(uv.y * 21.0 + uTime * 3.0) * 0.014;
          float signedDistance = uSteamClearDirection * (uv.x - front - turbulence);
          float steamRemaining = smoothstep(-0.075, 0.075, signedDistance);
          color = mix(clearScene, color, steamRemaining);
        }
      } else if (uEffect == 2) {
        float progress = clamp(uCoffeeSplashProgress, 0.0, 1.0);
        if (progress < 0.999) {
          float fade = 1.0 - smoothstep(0.74, 1.0, progress);
          float gravity = smoothstep(0.055, 0.7, progress);
          float growthA = smoothstep(0.0, 0.12, progress);
          float growthB = smoothstep(0.025, 0.16, progress);
          float growthC = smoothstep(0.055, 0.2, progress);
          float growthD = smoothstep(0.085, 0.24, progress);
          float growthE = smoothstep(0.115, 0.27, progress);
          float growthF = smoothstep(0.15, 0.31, progress);
          float rawLiquid = coffeeCluster(uv, vec2(0.39, 0.6), 0.205, 1.7, growthA, gravity);
          rawLiquid = max(rawLiquid, coffeeCluster(uv, vec2(0.8, 0.77), 0.13, 4.6, growthB, gravity * 0.86));
          rawLiquid = max(rawLiquid, coffeeCluster(uv, vec2(-0.045, 0.35), 0.175, 7.9, growthC, gravity * 0.94));
          rawLiquid = max(rawLiquid, coffeeCluster(uv, vec2(1.055, 0.23), 0.205, 11.2, growthD, gravity));
          rawLiquid = max(rawLiquid, coffeeCluster(uv, vec2(0.18, 0.975), 0.09, 14.4, growthE, gravity * 0.72));
          rawLiquid = max(rawLiquid, coffeeDrop(uv, vec2(0.69, 0.31), vec2(0.074, 0.061) * growthF));

          float smallGrowth = smoothstep(0.07, 0.28, progress);
          float tinyGrowth = smoothstep(0.12, 0.36, progress);
          rawLiquid = max(rawLiquid, coffeeDrop(uv, vec2(0.115, 0.73), vec2(0.05, 0.034) * smallGrowth));
          rawLiquid = max(rawLiquid, coffeeDrop(uv, vec2(0.935, 0.565), vec2(0.038, 0.045) * smallGrowth));
          rawLiquid = max(rawLiquid, coffeeDrop(uv, vec2(0.555, 1.018), vec2(0.064, 0.041) * smallGrowth));
          rawLiquid = max(rawLiquid, coffeeDrop(uv, vec2(0.575, -0.038), vec2(0.071, 0.047) * tinyGrowth));
          rawLiquid = max(rawLiquid, coffeeDrop(uv, vec2(0.855, 0.095), vec2(0.031, 0.02) * tinyGrowth));
          rawLiquid = max(rawLiquid, coffeeDrop(uv, vec2(0.305, 0.175), vec2(0.023, 0.028) * tinyGrowth));

          float settledSpecks = smoothstep(0.1, 0.34, progress);
          float screenSpecks = coffeeDrop(uv, vec2(0.045, 0.875), vec2(0.011, 0.015));
          screenSpecks = max(screenSpecks, coffeeDrop(uv, vec2(0.16, 0.5), vec2(0.006, 0.008)));
          screenSpecks = max(screenSpecks, coffeeDrop(uv, vec2(0.245, 0.84), vec2(0.014, 0.009)));
          screenSpecks = max(screenSpecks, coffeeDrop(uv, vec2(0.47, 0.91), vec2(0.007, 0.011)));
          screenSpecks = max(screenSpecks, coffeeDrop(uv, vec2(0.635, 0.18), vec2(0.009, 0.007)));
          screenSpecks = max(screenSpecks, coffeeDrop(uv, vec2(0.745, 0.915), vec2(0.006, 0.008)));
          screenSpecks = max(screenSpecks, coffeeDrop(uv, vec2(0.855, 0.45), vec2(0.013, 0.017)));
          screenSpecks = max(screenSpecks, coffeeDrop(uv, vec2(0.975, 0.69), vec2(0.007, 0.01)));
          screenSpecks = max(screenSpecks, coffeeDrop(uv, vec2(1.012, 0.735), vec2(0.013, 0.008)));
          rawLiquid = max(rawLiquid, screenSpecks * settledSpecks);

          float flight = smoothstep(0.04, 0.42, progress);
          float flightFade = 1.0 - smoothstep(0.58, 0.86, progress);
          vec2 flyingA = vec2(0.52, 0.68) + vec2(0.27, 0.2) * flight + vec2(0.0, -0.38) * flight * flight;
          vec2 flyingB = vec2(0.31, 0.57) + vec2(-0.24, 0.12) * flight + vec2(0.0, -0.28) * flight * flight;
          vec2 flyingC = vec2(0.77, 0.48) + vec2(0.18, 0.08) * flight + vec2(0.0, -0.32) * flight * flight;
          vec2 flyingVelocityA = vec2(0.27, 0.2) + vec2(0.0, -0.76) * flight;
          vec2 flyingVelocityB = vec2(-0.24, 0.12) + vec2(0.0, -0.56) * flight;
          vec2 flyingVelocityC = vec2(0.18, 0.08) + vec2(0.0, -0.64) * flight;
          float flyingDrops = coffeeFlyingDrop(uv, flyingA, flyingVelocityA, vec2(0.02, 0.0115), 0.27, flight);
          flyingDrops = max(flyingDrops, coffeeFlyingDrop(uv, flyingB, flyingVelocityB, vec2(0.016, 0.0095), 0.63, flight));
          flyingDrops = max(flyingDrops, coffeeFlyingDrop(uv, flyingC, flyingVelocityC, vec2(0.0125, 0.008), 0.86, flight));
          rawLiquid = max(rawLiquid, flyingDrops * flightFade);
          float paperGrain = fbm(uv * vec2(48.0, 32.0) + vec2(3.7, -9.2));
          float liquid = smoothstep(0.12, 0.72, rawLiquid + (paperGrain - 0.5) * 0.22) * fade;
          float dense = smoothstep(0.48, 0.92, rawLiquid + (paperGrain - 0.5) * 0.11) * fade;
          float soaked = smoothstep(0.025, 0.42, rawLiquid + (paperGrain - 0.5) * 0.34) * fade;
          float wetRim = clamp(soaked - dense, 0.0, 1.0);

          vec2 point = coffeeAspectPoint(uv, vec2(0.5, 0.52));
          vec2 radial = normalize(point + vec2(0.0001));
          vec2 swirl = vec2(-radial.y, radial.x);
          vec2 flow = radial * (noise(uv * 13.0 + 2.3) - 0.5) + swirl * (noise(uv * 17.0 - 5.1) - 0.5);
          vec2 refractedUv = uv + flow * uTexel * mix(4.0, 18.0, dense);
          vec3 wetScene = texture2D(tDiffuse, refractedUv).rgb * 0.46;
          wetScene += texture2D(tDiffuse, refractedUv + vec2(uTexel.x * 2.5, 0.0)).rgb * 0.135;
          wetScene += texture2D(tDiffuse, refractedUv - vec2(uTexel.x * 2.5, 0.0)).rgb * 0.135;
          wetScene += texture2D(tDiffuse, refractedUv + vec2(0.0, uTexel.y * 2.5)).rgb * 0.135;
          wetScene += texture2D(tDiffuse, refractedUv - vec2(0.0, uTexel.y * 2.5)).rgb * 0.135;
          float coffeeVariation = fbm(uv * 9.0 + vec2(6.1, -2.4));
          vec3 coffeeColor = mix(vec3(0.105, 0.027, 0.011), vec3(0.46, 0.17, 0.047), coffeeVariation);
          vec3 paperCoffee = mix(vec3(0.54, 0.31, 0.19), coffeeColor, dense * 0.82);
          vec3 stained = wetScene * mix(vec3(0.9, 0.73, 0.62), vec3(0.52, 0.245, 0.125), dense);
          stained = mix(stained, paperCoffee, 0.24 + dense * 0.34);
          float translucentFilm = liquid * (0.39 + dense * 0.24 + (1.0 - coffeeVariation) * 0.075);
          color = mix(color, stained, translucentFilm);
          color = mix(color, coffeeColor, dense * (0.11 + coffeeVariation * 0.105));
          color += vec3(1.0, 0.72, 0.48) * wetRim * fade * (0.025 + (1.0 - coffeeVariation) * 0.024);

          float impactRadius = mix(0.018, 0.21, smoothstep(0.01, 0.18, progress));
          vec2 impactPointA = coffeeAspectPoint(uv, vec2(0.42, 0.58));
          vec2 impactPointB = coffeeAspectPoint(uv, vec2(0.79, 0.75));
          float impactRing = 1.0 - smoothstep(0.01, 0.023, abs(length(impactPointA) - impactRadius));
          impactRing = max(impactRing, 1.0 - smoothstep(0.008, 0.019, abs(length(impactPointB) - impactRadius * 0.62)));
          impactRing *= (1.0 - smoothstep(0.16, 0.34, progress)) * fade;
          float warmHighlight = wetRim * (0.35 + paperGrain * 0.65);
          float glassGlint = coffeeGlint(uv, vec2(0.37, 0.66), vec2(0.065, 0.008));
          glassGlint += coffeeGlint(uv, vec2(0.755, 0.8), vec2(0.032, 0.005)) * 0.7;
          glassGlint += coffeeGlint(uv, vec2(0.04, 0.45), vec2(0.04, 0.006)) * 0.54;
          glassGlint *= rawLiquid * fade;
          float wetSparkle = pow(noise(uv * 74.0 + vec2(7.3, -4.1)), 13.0) * dense;
          color += impactRing * vec3(0.42, 0.17, 0.09) * 0.12;
          color -= wetRim * vec3(0.11, 0.035, 0.018) * 0.15;
          color += warmHighlight * vec3(0.54, 0.18, 0.2) * 0.055;
          color += glassGlint * vec3(0.82, 0.46, 0.42) * 0.1;
          color += wetSparkle * vec3(0.86, 0.58, 0.48) * 0.085;
        }
      } else if (uEffect == 3) {
        // Cyberpunk digital glitch: each slice is an authored short burst.
        // Between bursts the scene returns exactly to alignment instead of
        // continuously shaking for the whole television animation.
        float burst = televisionGlitchBurst(uEffectAge);
        float frameSeed = floor(uEffectAge * 72.0);
        float row = floor(uv.y * 58.0);
        float slice = step(0.54, hash(vec2(row, frameSeed)));
        float block = step(0.68, hash(vec2(floor(uv.x * 20.0), row + frameSeed * 0.37)));
        float fault = max(slice, block * 0.72) * burst;
        float signedShift = hash(vec2(row * 0.73, frameSeed + 11.0)) - 0.5;
        vec2 glitchUv = clamp(
          uv + vec2(signedShift * (0.018 + block * 0.07) * fault, 0.0),
          vec2(0.002),
          vec2(0.998)
        );
        vec2 pixelUv = (floor(glitchUv * vec2(112.0, 72.0)) + 0.5) / vec2(112.0, 72.0);
        glitchUv = mix(glitchUv, pixelUv, block * burst * 0.72);
        vec3 glitch = texture2D(tDiffuse, glitchUv).rgb;
        float splitPixels = (4.0 + 14.0 * burst) * max(0.28, fault);
        vec3 redSplit = texture2D(tDiffuse, clamp(glitchUv + vec2(uTexel.x * splitPixels, 0.0), vec2(0.002), vec2(0.998))).rgb;
        vec3 blueSplit = texture2D(tDiffuse, clamp(glitchUv - vec2(uTexel.x * splitPixels, 0.0), vec2(0.002), vec2(0.998))).rgb;
        glitch.r = mix(glitch.r, redSplit.r, burst * (0.48 + fault * 0.5));
        glitch.b = mix(glitch.b, blueSplit.b, burst * (0.48 + fault * 0.5));
        float snow = step(0.84, hash(vec2(floor(uv.x * 118.0) + frameSeed, floor(uv.y * 82.0) - frameSeed * 0.7)));
        float signalFlash = step(0.82, hash(vec2(frameSeed, 19.7))) * burst;
        color = mix(color, glitch, clamp(fault * 0.94 + burst * 0.16, 0.0, 0.96));
        color += vec3(0.72, 0.9, 1.0) * snow * burst * 0.2;
        color += vec3(0.98, 0.17, 0.42) * slice * burst * 0.11;
        color = mix(color, vec3(dot(color, vec3(0.299, 0.587, 0.114))), signalFlash * 0.2);
      } else if (uEffect == 4) {
        float scanA = 1.0 - smoothstep(0.0, 0.055, abs(fract(uv.y * 4.8 - uTime * 1.12) - 0.5));
        float scanB = 1.0 - smoothstep(0.0, 0.026, abs(fract(uv.y * 9.5 - uTime * 1.65 + 0.23) - 0.5));
        float scanFine = 1.0 - smoothstep(0.0, 0.012, abs(fract(uv.y * 22.0 - uTime * 2.4) - 0.5));
        float scanExposure = clamp(scanA * 0.72 + scanB * 0.5 + scanFine * 0.28, 0.0, 1.0);
        color = mix(color, vec3(0.82, 0.96, 1.0), scanExposure * 0.78);
        color += scanFine * vec3(0.08, 0.16, 0.19);
      } else if (uEffect == 5) {
        vec2 centered = uv - 0.5;
        float radius = length(centered);
        vec2 refracted = uv + normalize(centered + 0.0001) * sin(radius * 38.0 - uTime * 1.2) * 0.0025;
        vec3 shifted = texture2D(tDiffuse, refracted).rgb;
        shifted.r = texture2D(tDiffuse, refracted + vec2(uTexel.x * 2.0, 0.0)).r;
        shifted.b = texture2D(tDiffuse, refracted - vec2(uTexel.x * 2.0, 0.0)).b;
        float shell = smoothstep(0.53, 0.35, radius) * smoothstep(0.08, 0.42, radius);
        color = mix(color, shifted + vec3(0.035, 0.025, 0.05), shell * 0.36);
      } else if (uEffect == 6) {
        float progress = clamp(uEffectProgress, 0.0, 1.0);
        float heatIn = smoothstep(0.015, 0.16, progress);
        float heatOut = 1.0 - smoothstep(0.82, 1.0, progress);
        float heat = heatIn * heatOut;
        float swapPulse = exp(-pow((progress - 0.735) / 0.095, 2.0));

        // A full-screen field of rising convection cells replaces the old red
        // filter. Different scales and speeds keep the motion from reading as
        // water ripples or television scan lines.
        vec2 coarseDomain = vec2(
          uv.x * 5.4 + noise(vec2(uv.y * 2.1, uTime * 0.09)) * 1.15,
          uv.y * 4.2 - uTime * 0.34
        );
        float coarse = noise(coarseDomain);
        vec2 middleDomain = vec2(
          uv.x * 13.0 + coarse * 2.2 - uTime * 0.08,
          uv.y * 9.0 - uTime * 0.72
        );
        float middle = noise(middleDomain);
        float fine = noise(vec2(
          uv.x * 31.0 + middle * 3.1 + uTime * 0.13,
          uv.y * 22.0 - uTime * 1.42
        ));
        float cellField = coarse * 0.56 + middle * 0.32 + fine * 0.12;
        float broadCells = smoothstep(0.29, 0.72, cellField);
        float brokenEdges = smoothstep(0.37, 0.74, middle * 0.68 + fine * 0.32);
        float heatField = clamp(broadCells * 0.8 + brokenEdges * 0.48, 0.0, 1.0);

        float strength = heat * (1.0 + swapPulse * 0.58);
        vec2 displacementPixels = vec2(
          (middle - 0.5) * 24.0 + (fine - 0.5) * 6.0,
          (coarse - 0.5) * 6.5
        );
        vec2 heatedUv = clamp(
          uv + displacementPixels * uTexel * heatField * strength,
          vec2(0.002),
          vec2(0.998)
        );
        vec3 refracted = texture2D(tDiffuse, heatedUv).rgb;
        vec2 softDirection = normalize(displacementPixels + vec2(0.001)) * uTexel * 2.15;
        vec3 softSample = texture2D(tDiffuse, clamp(heatedUv + softDirection, vec2(0.002), vec2(0.998))).rgb;
        float softAmount = heatField * strength * (0.16 + swapPulse * 0.1);
        vec3 heatedScene = mix(refracted, softSample, softAmount);

        // The whole screen now visibly warms up again, while the stronger
        // peach-red grade still concentrates inside the moving heat cells.
        float luma = dot(heatedScene, vec3(0.2126, 0.7152, 0.0722));
        vec3 screenWarm = heatedScene * vec3(1.08, 0.91, 0.83);
        screenWarm += vec3(0.055, 0.006, 0.0) * (0.32 + luma * 0.68);
        heatedScene = mix(heatedScene, screenWarm, heat * (0.22 + swapPulse * 0.065));
        vec3 warmGrade = heatedScene * vec3(1.045, 0.965, 0.9);
        warmGrade += vec3(0.064, 0.012, 0.002) * (0.28 + luma * 0.72);
        float warmAmount = heatField * heat * (0.15 + swapPulse * 0.09);
        heatedScene = mix(heatedScene, warmGrade, warmAmount);
        color = mix(color, heatedScene, heat * (0.72 + heatField * 0.28));
      } else if (uEffect == 7) {
        float progress = clamp(uEffectProgress, 0.0, 1.0);
        float heatIn = smoothstep(0.015, 0.2, progress);
        float heatOut = 1.0 - smoothstep(0.72, 1.0, progress);
        float heat = heatIn * heatOut;
        float meltPulse = exp(-pow((progress - 0.5) / 0.22, 2.0));

        // A screen-space field of warm rising air communicates the skill as a
        // foreground heat front, not as steam emitted from the kettle model.
        vec2 broadDomain = vec2(
          uv.x * 4.7 + noise(vec2(uv.y * 2.2, uTime * 0.075)) * 1.05,
          uv.y * 3.8 - uTime * 0.28
        );
        float broad = noise(broadDomain);
        vec2 rollingDomain = vec2(
          uv.x * 11.4 + broad * 2.0 - uTime * 0.055,
          uv.y * 8.2 - uTime * 0.64
        );
        float rolling = noise(rollingDomain);
        float filament = noise(vec2(
          uv.x * 25.0 + rolling * 2.8 + uTime * 0.1,
          uv.y * 18.0 - uTime * 1.18
        ));
        float convection = broad * 0.58 + rolling * 0.3 + filament * 0.12;
        float plumeBody = smoothstep(0.3, 0.72, convection);
        float plumeEdges = smoothstep(0.42, 0.72, rolling * 0.7 + filament * 0.3);
        float heatField = clamp(plumeBody * 0.78 + plumeEdges * 0.44, 0.0, 1.0);
        float strength = heat * (0.76 + meltPulse * 0.42);

        vec2 displacementPixels = vec2(
          (rolling - 0.5) * 18.0 + (filament - 0.5) * 4.5,
          (broad - 0.5) * 5.2 - heatField * 1.4
        );
        vec2 heatedUv = clamp(
          uv + displacementPixels * uTexel * heatField * strength,
          vec2(0.002),
          vec2(0.998)
        );
        vec3 refracted = texture2D(tDiffuse, heatedUv).rgb;
        vec3 upperSoft = texture2D(
          tDiffuse,
          clamp(heatedUv + vec2(0.0, uTexel.y * 3.0), vec2(0.002), vec2(0.998))
        ).rgb;
        vec3 lowerSoft = texture2D(
          tDiffuse,
          clamp(heatedUv - vec2(0.0, uTexel.y * 1.8), vec2(0.002), vec2(0.998))
        ).rgb;
        float soften = heatField * strength * (0.12 + meltPulse * 0.08);
        vec3 heatedScene = mix(refracted, (upperSoft + lowerSoft) * 0.5, soften);

        float luma = dot(heatedScene, vec3(0.2126, 0.7152, 0.0722));
        vec3 warmWhite = vec3(1.0, 0.965, 0.84);
        vec3 paleGold = vec3(1.0, 0.79, 0.37);
        float vapor = smoothstep(0.48, 0.78, convection)
          * heat
          * (0.035 + meltPulse * 0.055);
        vec3 warmed = heatedScene * vec3(1.035, 1.012, 0.955);
        warmed += mix(warmWhite, paleGold, heatField * 0.55)
          * vapor
          * (0.58 + luma * 0.42);
        heatedScene = mix(heatedScene, warmed, heat * (0.26 + heatField * 0.18));
        color = mix(color, heatedScene, heat * (0.68 + heatField * 0.24));
      } else if (uEffect == 8) {
        float progress = clamp(uEffectProgress, 0.0, 1.0);
        float preCrash = smoothstep(0.16, 0.7, progress);
        float crashIn = smoothstep(0.7, 0.735, progress);
        float crashOut = 1.0 - smoothstep(0.91, 1.0, progress);
        float crash = crashIn * crashOut;
        float impact = exp(-pow((progress - 0.72) / 0.026, 2.0));

        float bandSeed = hash(vec2(floor(uv.y * 58.0), floor(uTime * 11.0)));
        float faultBand = step(0.78, bandSeed) * preCrash;
        float horizontalShift = (bandSeed - 0.5) * 0.055 * faultBand;
        vec2 faultUv = clamp(uv + vec2(horizontalShift, 0.0), vec2(0.002), vec2(0.998));
        vec3 faulted = texture2D(tDiffuse, faultUv).rgb;
        faulted.r = texture2D(tDiffuse, faultUv + vec2(uTexel.x * 3.0, 0.0)).r;
        faulted.b = texture2D(tDiffuse, faultUv - vec2(uTexel.x * 4.0, 0.0)).b;
        float scanline = 0.5 + 0.5 * sin(uv.y / max(uTexel.y, 0.000001) * 1.7);
        vec3 coldFault = faulted * vec3(0.78, 0.91, 1.08) + vec3(0.0, 0.025, 0.075) * preCrash;
        coldFault *= 1.0 - scanline * preCrash * 0.055;
        color = mix(color, coldFault, preCrash * (0.2 + faultBand * 0.52));

        vec3 blue = vec3(0.018, 0.16, 0.55);
        float vignette = smoothstep(0.9, 0.24, length((uv - 0.5) * vec2(1.25, 1.0)));
        blue *= 0.82 + vignette * 0.18;
        float blueScan = 0.5 + 0.5 * sin(uv.y / max(uTexel.y, 0.000001) * 2.15 + uTime * 10.0);
        blue *= 0.94 + blueScan * 0.06;

        vec2 textUv = vec2(uv.x, 1.0 - uv.y);
        float row = floor((textUv.y - 0.22) * 34.0);
        float rowMask = step(0.0, row) * step(row, 12.0);
        float rowLine = 1.0 - smoothstep(0.08, 0.22, abs(fract((textUv.y - 0.22) * 34.0) - 0.5));
        float rowWidth = mix(0.26, 0.76, hash(vec2(row, 4.7)));
        float wordBreaks = step(0.22, hash(vec2(floor((textUv.x - 0.12) * 52.0), row)));
        float textRows = rowMask * rowLine
          * step(0.11, textUv.x) * step(textUv.x, 0.11 + rowWidth)
          * wordBreaks;
        float titleBar = step(0.12, textUv.x) * step(textUv.x, 0.53)
          * step(0.1, textUv.y) * step(textUv.y, 0.145);
        float errorCode = step(0.12, textUv.x) * step(textUv.x, 0.42)
          * step(0.72, textUv.y) * step(textUv.y, 0.755);
        float errorCopy = clamp(textRows * 0.78 + titleBar + errorCode, 0.0, 1.0);
        blue = mix(blue, vec3(0.78, 0.92, 1.0), errorCopy * 0.88);
        blue += vec3(0.2, 0.42, 0.75) * faultBand * crash * 0.12;
        color = mix(color, blue, crash);
        color = mix(color, vec3(0.84, 0.95, 1.0), impact * 0.36);
      } else if (uEffect == 9) {
        float progress = clamp(uEffectProgress, 0.0, 1.0);
        float heatIn = smoothstep(0.0, 0.13, progress);
        float heatOut = 1.0 - smoothstep(0.78, 1.0, progress);
        float heat = heatIn * heatOut;
        float powerPulse = 0.78 + 0.22 * sin(uTime * 7.8);

        // Microwave heating reads as rising, uneven hot-air refraction across
        // the front glass rather than the toaster's topology-swap flash.
        vec2 broadDomain = vec2(
          uv.x * 6.2 + noise(vec2(uv.y * 2.8, uTime * 0.12)) * 1.5,
          uv.y * 5.0 - uTime * 0.86
        );
        float broad = noise(broadDomain);
        float rolling = noise(vec2(
          uv.x * 15.0 + broad * 2.6 + uTime * 0.1,
          uv.y * 11.0 - uTime * 1.54
        ));
        float filament = noise(vec2(
          uv.x * 34.0 + rolling * 3.4 - uTime * 0.18,
          uv.y * 27.0 - uTime * 2.35
        ));
        float convection = broad * 0.55 + rolling * 0.32 + filament * 0.13;
        float cellMask = smoothstep(0.3, 0.72, convection);
        float edgeMask = smoothstep(0.43, 0.76, rolling * 0.7 + filament * 0.3);
        float heatField = clamp(cellMask * 0.78 + edgeMask * 0.46, 0.0, 1.0);
        vec2 displacementPixels = vec2(
          (rolling - 0.5) * 21.0 + (filament - 0.5) * 5.5,
          (broad - 0.5) * 7.0 - heatField * 1.8
        );
        vec2 heatedUv = clamp(
          uv + displacementPixels * uTexel * heatField * heat * powerPulse,
          vec2(0.002),
          vec2(0.998)
        );
        vec3 refracted = texture2D(tDiffuse, heatedUv).rgb;
        vec3 sideSample = texture2D(
          tDiffuse,
          clamp(heatedUv + normalize(displacementPixels + vec2(0.001)) * uTexel * 2.2, vec2(0.002), vec2(0.998))
        ).rgb;
        vec3 heatedScene = mix(refracted, sideSample, heatField * heat * 0.18);
        float luma = dot(heatedScene, vec3(0.2126, 0.7152, 0.0722));
        vec3 warmScene = heatedScene * vec3(1.09, 0.93, 0.82);
        warmScene += vec3(0.075, 0.016, 0.002) * (0.35 + luma * 0.65);
        float warmAmount = heat * (0.24 + heatField * 0.28) * powerPulse;
        color = mix(color, warmScene, warmAmount);

        // A restrained magnetron pulse gives the restored screen effect a
        // distinct microwave rhythm without obscuring the cable puzzle.
        vec2 centered = (uv - 0.5) * vec2(1.35, 1.0);
        float ringRadius = fract(uTime * 0.34) * 0.72;
        float pulseRing = 1.0 - smoothstep(0.018, 0.052, abs(length(centered) - ringRadius));
        pulseRing *= (1.0 - ringRadius / 0.72) * heat;
        color += vec3(0.18, 0.055, 0.008) * pulseRing * 0.12;
      }
      gl_FragColor = vec4(color, 1.0);
    }
  `
};
function makeQuad(definition) {
	const material = new ShaderMaterial({
		uniforms: UniformsUtils.clone(definition.uniforms),
		vertexShader: definition.vertexShader,
		fragmentShader: definition.fragmentShader,
		depthTest: false,
		depthWrite: false
	});
	return {
		quad: new FullScreenQuad(material),
		material
	};
}
var SakuraPipeline = class {
	renderer;
	scene;
	camera;
	pixelBudget;
	size = new Vector2(1, 1);
	sceneTarget;
	targetA;
	targetB;
	bloomTarget;
	steamTargetA;
	steamTargetB;
	ink = makeQuad(inkShader);
	grade = makeQuad(gradeShader);
	lantern = makeQuad(lanternShader);
	bloom = makeQuad(bloomShader);
	bloomComposite = makeQuad(bloomCompositeShader);
	fxaa = makeQuad(fxaaShader);
	steamBlur = makeQuad(steamBlurShader);
	skillEffect = makeQuad(skillEffectShader);
	skillEffectTimeline = new SkillEffectActivationTimeline();
	steamCondensation = new SteamCondensationField();
	qualityTier = "high";
	themeProgress = 0;
	explorationProgress = 0;
	skillEffectMode = "none";
	steamClearActive = false;
	steamClearStartedAt = 0;
	steamClearProgress = 0;
	steamClearOrigin = .1;
	steamClearDirection = 1;
	steamClearDuration = 2.4;
	steamRevealActive = false;
	steamRevealStartedAt = 0;
	steamRevealProgress = 1;
	steamRevealOrigin = .1;
	steamRevealDirection = 1;
	steamRevealDuration = 5.2;
	coffeeSplashActive = false;
	coffeeSplashStartedAt = 0;
	coffeeSplashProgress = 1;
	coffeeSplashDuration = 8.4;
	renderWidth = 2;
	renderHeight = 2;
	steamWidth = 2;
	steamHeight = 2;
	constructor(renderer, scene, camera, pixelBudget = 46e5) {
		this.renderer = renderer;
		this.scene = scene;
		this.camera = camera;
		this.pixelBudget = pixelBudget;
		const options = {
			type: HalfFloatType,
			minFilter: LinearFilter,
			magFilter: LinearFilter,
			depthBuffer: true,
			stencilBuffer: false,
			colorSpace: ""
		};
		this.sceneTarget = new WebGLRenderTarget(2, 2, options);
		this.sceneTarget.depthTexture = new DepthTexture(2, 2);
		this.sceneTarget.depthTexture.format = DepthFormat;
		this.sceneTarget.depthTexture.type = UnsignedIntType;
		this.sceneTarget.depthTexture.minFilter = NearestFilter;
		this.sceneTarget.depthTexture.magFilter = NearestFilter;
		this.targetA = new WebGLRenderTarget(2, 2, {
			...options,
			depthBuffer: false
		});
		this.targetB = new WebGLRenderTarget(2, 2, {
			...options,
			type: UnsignedByteType,
			depthBuffer: false
		});
		this.bloomTarget = new WebGLRenderTarget(2, 2, {
			...options,
			type: UnsignedByteType,
			depthBuffer: false
		});
		this.steamTargetA = new WebGLRenderTarget(2, 2, {
			...options,
			type: UnsignedByteType,
			depthBuffer: false
		});
		this.steamTargetB = this.steamTargetA.clone();
		this.ink.material.uniforms.tDepth.value = this.sceneTarget.depthTexture;
		this.lantern.material.uniforms.tDepth.value = this.sceneTarget.depthTexture;
		this.skillEffect.material.uniforms.uCondensation.value = this.steamCondensation.texture;
		this.skillEffect.material.uniforms.uCondensationTexel.value.copy(this.steamCondensation.texel);
	}
	setSize(width, height) {
		const dpr = window.devicePixelRatio || 1;
		let scale = dpr < 1.5 ? 1.25 : Math.min(dpr, 2);
		if (width * height * scale * scale > this.pixelBudget) scale = Math.max(1, Math.sqrt(this.pixelBudget / (width * height)));
		const renderWidth = Math.max(2, Math.floor(width * scale));
		const renderHeight = Math.max(2, Math.floor(height * scale));
		this.renderWidth = renderWidth;
		this.renderHeight = renderHeight;
		this.size.set(renderWidth, renderHeight);
		this.renderer.setPixelRatio(scale);
		this.renderer.setSize(width, height, false);
		this.sceneTarget.setSize(renderWidth, renderHeight);
		this.targetA.setSize(renderWidth, renderHeight);
		this.targetB.setSize(renderWidth, renderHeight);
		this.resizeBloomTarget();
		this.resizeSteamTargets();
		const texel = new Vector2(1 / renderWidth, 1 / renderHeight);
		this.ink.material.uniforms.uTexel.value.copy(texel);
		this.fxaa.material.uniforms.uTexel.value.copy(texel);
		this.skillEffect.material.uniforms.uTexel.value.copy(texel);
		this.lantern.material.uniforms.uAspect.value = renderWidth / renderHeight;
		this.ink.material.uniforms.uNear.value = this.camera.near;
		this.ink.material.uniforms.uFar.value = this.camera.far;
		this.ink.material.uniforms.uThickness.value = 1 + .52 * scale;
	}
	render() {
		this.renderer.info.reset();
		this.renderer.setRenderTarget(this.sceneTarget);
		this.renderer.clear();
		this.renderer.render(this.scene, this.camera);
		this.ink.material.uniforms.tDiffuse.value = this.sceneTarget.texture;
		this.renderer.setRenderTarget(this.targetA);
		this.ink.quad.render(this.renderer);
		this.grade.material.uniforms.tDiffuse.value = this.targetA.texture;
		this.renderer.setRenderTarget(this.targetB);
		this.grade.quad.render(this.renderer);
		let fxaaSource = this.targetB.texture;
		if (this.themeProgress > 1e-4) {
			this.lantern.material.uniforms.tDiffuse.value = this.targetB.texture;
			this.renderer.setRenderTarget(this.targetA);
			this.lantern.quad.render(this.renderer);
			fxaaSource = this.targetA.texture;
			if (this.qualityTier !== "minimal") {
				this.bloom.material.uniforms.tDiffuse.value = this.targetA.texture;
				this.renderer.setRenderTarget(this.bloomTarget);
				this.bloom.quad.render(this.renderer);
				this.bloomComposite.material.uniforms.tDiffuse.value = this.targetA.texture;
				this.bloomComposite.material.uniforms.tBloom.value = this.bloomTarget.texture;
				this.renderer.setRenderTarget(this.targetB);
				this.bloomComposite.quad.render(this.renderer);
				fxaaSource = this.targetB.texture;
			}
		}
		this.fxaa.material.uniforms.tDiffuse.value = fxaaSource;
		const fxaaTarget = fxaaSource === this.targetA.texture ? this.targetB : this.targetA;
		this.renderer.setRenderTarget(fxaaTarget);
		this.fxaa.quad.render(this.renderer);
		const skillEffectScene = fxaaTarget.texture;
		let skillEffectSource = skillEffectScene;
		const effectTime = performance.now() * .001;
		let finishSteamClearAfterRender = false;
		if (this.steamRevealActive) {
			const evidenceProgress = window.__STEAM_REVEAL_PROGRESS_OVERRIDE__;
			this.steamRevealProgress = Number.isFinite(evidenceProgress) ? MathUtils.clamp(evidenceProgress, 0, 1) : MathUtils.clamp((effectTime - this.steamRevealStartedAt) / this.steamRevealDuration, 0, 1);
			this.skillEffect.material.uniforms.uSteamRevealProgress.value = this.steamRevealProgress;
			if (this.steamRevealProgress >= 1) this.steamRevealActive = false;
		}
		if (this.steamClearActive) {
			const evidenceProgress = window.__STEAM_CLEAR_PROGRESS_OVERRIDE__;
			this.steamClearProgress = Number.isFinite(evidenceProgress) ? MathUtils.clamp(evidenceProgress, 0, 1) : MathUtils.clamp((effectTime - this.steamClearStartedAt) / this.steamClearDuration, 0, 1);
			this.skillEffect.material.uniforms.uSteamClearProgress.value = this.steamClearProgress;
			finishSteamClearAfterRender = this.steamClearProgress >= 1;
		}
		if (this.coffeeSplashActive) {
			const evidenceProgress = window.__COFFEE_SPLASH_PROGRESS_OVERRIDE__;
			this.coffeeSplashProgress = Number.isFinite(evidenceProgress) ? MathUtils.clamp(evidenceProgress, 0, 1) : MathUtils.clamp((effectTime - this.coffeeSplashStartedAt) / this.coffeeSplashDuration, 0, 1);
			this.skillEffect.material.uniforms.uCoffeeSplashProgress.value = this.coffeeSplashProgress;
			if (!Number.isFinite(evidenceProgress) && this.coffeeSplashProgress >= 1) {
				this.coffeeSplashActive = false;
				this.skillEffect.material.uniforms.uEffect.value = 0;
			}
		}
		if (this.skillEffectMode === "bathroom-steam") {
			this.steamCondensation.update(effectTime);
			this.steamBlur.material.uniforms.tDiffuse.value = fxaaTarget.texture;
			this.steamBlur.material.uniforms.uDirection.value.set(this.size.x > 0 ? 4.7 / this.size.x : 0, 0);
			this.renderer.setRenderTarget(this.steamTargetA);
			this.steamBlur.quad.render(this.renderer);
			this.steamBlur.material.uniforms.tDiffuse.value = this.steamTargetA.texture;
			this.steamBlur.material.uniforms.uDirection.value.set(0, this.steamHeight > 0 ? 1.35 / this.steamHeight : 0);
			this.renderer.setRenderTarget(this.steamTargetB);
			this.steamBlur.quad.render(this.renderer);
			skillEffectSource = this.steamTargetB.texture;
		}
		this.skillEffect.material.uniforms.tDiffuse.value = skillEffectSource;
		this.skillEffect.material.uniforms.tScene.value = skillEffectScene;
		this.skillEffect.material.uniforms.uTime.value = effectTime;
		const televisionAgeOverride = window.__TELEVISION_GLITCH_AGE_OVERRIDE__;
		this.skillEffect.material.uniforms.uEffectAge.value = this.skillEffectMode === "television-glitch" && Number.isFinite(televisionAgeOverride) ? Math.max(0, televisionAgeOverride) : this.skillEffectTimeline.age(this.skillEffectMode, effectTime);
		this.renderer.setRenderTarget(null);
		this.skillEffect.quad.render(this.renderer);
		if (finishSteamClearAfterRender) this.finishSteamClear();
	}
	setSkillEffect(effect, immediate = false) {
		const modes = {
			none: 0,
			"bathroom-steam": 1,
			"coffee-lock": 2,
			"television-glitch": 3,
			"printer-scan": 4,
			"iridescent-bubble": 5,
			"toaster-heat": 6,
			"kettle-thaw-heat": 7,
			"blue-screen": 8,
			"microwave-heat": 9
		};
		if (!immediate && effect === "none" && this.steamClearActive && this.skillEffectMode === "bathroom-steam") return;
		this.skillEffectTimeline.activate(effect, this.skillEffectMode, immediate);
		if (effect !== this.skillEffectMode || immediate) {
			this.cancelSteamClear();
			this.cancelSteamReveal(effect === "bathroom-steam" ? 1 : 0);
			if (effect !== "coffee-lock") this.cancelCoffeeSplash();
			if (effect === "bathroom-steam") this.steamCondensation.activate();
			else this.steamCondensation.deactivate();
		}
		this.skillEffectMode = effect;
		this.skillEffect.material.uniforms.uEffect.value = effect === "coffee-lock" && !this.coffeeSplashActive ? 0 : modes[effect];
		if (effect !== "toaster-heat" && effect !== "kettle-thaw-heat" && effect !== "microwave-heat") this.skillEffect.material.uniforms.uEffectProgress.value = 0;
	}
	setSkillEffectProgress(progress) {
		this.skillEffect.material.uniforms.uEffectProgress.value = MathUtils.clamp(progress, 0, 1);
	}
	get skillEffectState() {
		return {
			mode: this.skillEffectMode,
			progress: Number(this.skillEffect.material.uniforms.uEffectProgress.value),
			age: this.skillEffectTimeline.age(this.skillEffectMode),
			activationCount: this.skillEffectTimeline.activationCount,
			splashActive: this.coffeeSplashActive,
			splashProgress: this.coffeeSplashProgress
		};
	}
	beginCoffeeSplash() {
		this.setSkillEffect("coffee-lock", true);
		this.coffeeSplashStartedAt = performance.now() * .001;
		this.coffeeSplashProgress = 1e-4;
		this.coffeeSplashActive = true;
		this.skillEffect.material.uniforms.uEffect.value = 2;
		this.skillEffect.material.uniforms.uCoffeeSplashProgress.value = this.coffeeSplashProgress;
	}
	beginSteamReveal(originX, duration = 5.2) {
		this.setSkillEffect("bathroom-steam", true);
		this.steamRevealOrigin = MathUtils.clamp(originX, 0, 1);
		this.steamRevealDirection = this.steamRevealOrigin < .5 ? 1 : -1;
		this.steamRevealStartedAt = performance.now() * .001;
		this.steamRevealDuration = Math.max(.1, duration);
		this.steamRevealProgress = 1e-4;
		this.steamRevealActive = true;
		this.skillEffect.material.uniforms.uSteamRevealOrigin.value = this.steamRevealOrigin;
		this.skillEffect.material.uniforms.uSteamRevealDirection.value = this.steamRevealDirection;
		this.skillEffect.material.uniforms.uSteamRevealProgress.value = this.steamRevealProgress;
	}
	beginSteamClear(originX) {
		if (this.skillEffectMode !== "bathroom-steam") return;
		this.steamRevealActive = false;
		this.steamClearOrigin = MathUtils.clamp(originX, 0, 1);
		this.steamClearDirection = this.steamClearOrigin < .5 ? 1 : -1;
		this.steamClearStartedAt = performance.now() * .001;
		this.steamClearProgress = 1e-4;
		this.steamClearActive = true;
		this.skillEffect.material.uniforms.uSteamClearOrigin.value = this.steamClearOrigin;
		this.skillEffect.material.uniforms.uSteamClearDirection.value = this.steamClearDirection;
		this.skillEffect.material.uniforms.uSteamClearProgress.value = this.steamClearProgress;
	}
	get steamClearState() {
		return {
			active: this.steamClearActive,
			progress: this.steamClearProgress,
			origin: this.steamClearOrigin,
			direction: this.steamClearDirection > 0 ? "left-to-right" : "right-to-left"
		};
	}
	get steamRevealState() {
		return {
			active: this.steamRevealActive,
			progress: this.steamRevealProgress,
			origin: this.steamRevealOrigin,
			direction: this.steamRevealDirection > 0 ? "left-to-right" : "right-to-left"
		};
	}
	setThemeProgress(progress) {
		const value = MathUtils.clamp(progress, 0, 1);
		this.themeProgress = value;
		this.grade.material.uniforms.uThemeProgress.value = value;
		this.lantern.material.uniforms.uThemeProgress.value = value;
		this.skillEffect.material.uniforms.uThemeProgress.value = value;
		this.bloomComposite.material.uniforms.uStrength.value = this.qualityTier === "minimal" ? 0 : value * .2;
		this.ink.material.uniforms.uInk.value.set(PAL.ink).lerp(NIGHT_INK, value);
		this.ink.material.uniforms.uStrength.value = MathUtils.lerp(.92, .76, value) * MathUtils.lerp(1, .12, this.explorationProgress);
	}
	setExplorationProgress(progress) {
		this.explorationProgress = MathUtils.clamp(progress, 0, 1);
		this.grade.material.uniforms.uExplorationProgress.value = this.explorationProgress;
		this.lantern.material.uniforms.uExplorationProgress.value = this.explorationProgress;
		this.ink.material.uniforms.uStrength.value = MathUtils.lerp(.92, .76, this.themeProgress) * MathUtils.lerp(1, .12, this.explorationProgress);
	}
	setLantern(position, intensity) {
		this.lantern.material.uniforms.uLantern.value.copy(position);
		this.lantern.material.uniforms.uIntensity.value = MathUtils.clamp(intensity, 0, 1);
	}
	setQualityTier(tier) {
		this.qualityTier = tier;
		this.bloom.material.uniforms.uSampleScale.value = 1;
		this.bloomComposite.material.uniforms.uStrength.value = tier === "minimal" ? 0 : this.themeProgress * .2;
		this.resizeBloomTarget();
	}
	dispose() {
		this.sceneTarget.dispose();
		this.targetA.dispose();
		this.targetB.dispose();
		this.bloomTarget.dispose();
		this.steamTargetA.dispose();
		this.steamTargetB.dispose();
		this.steamCondensation.dispose();
		for (const pass of [
			this.ink,
			this.grade,
			this.lantern,
			this.bloom,
			this.bloomComposite,
			this.fxaa,
			this.steamBlur,
			this.skillEffect
		]) {
			pass.quad.dispose();
			pass.material.dispose();
		}
	}
	resizeBloomTarget() {
		const scale = this.qualityTier === "high" ? 1 : .5;
		const width = Math.max(2, Math.floor(this.renderWidth * scale));
		const height = Math.max(2, Math.floor(this.renderHeight * scale));
		this.bloomTarget.setSize(width, height);
		this.bloom.material.uniforms.uTexel.value.set(1 / width, 1 / height);
	}
	cancelSteamClear() {
		this.steamClearActive = false;
		this.steamClearProgress = 0;
		this.skillEffect.material.uniforms.uSteamClearProgress.value = 0;
	}
	cancelSteamReveal(progress) {
		this.steamRevealActive = false;
		this.steamRevealProgress = MathUtils.clamp(progress, 0, 1);
		this.skillEffect.material.uniforms.uSteamRevealProgress.value = this.steamRevealProgress;
	}
	cancelCoffeeSplash() {
		this.coffeeSplashActive = false;
		this.coffeeSplashProgress = 1;
		this.skillEffect.material.uniforms.uCoffeeSplashProgress.value = 1;
	}
	finishSteamClear() {
		this.cancelSteamClear();
		this.cancelSteamReveal(0);
		this.steamCondensation.deactivate();
		this.skillEffectMode = "none";
		this.skillEffect.material.uniforms.uEffect.value = 0;
	}
	resizeSteamTargets() {
		this.steamWidth = Math.max(2, Math.floor(this.renderWidth * .28));
		this.steamHeight = Math.max(2, Math.floor(this.renderHeight * .28));
		this.steamTargetA.setSize(this.steamWidth, this.steamHeight);
		this.steamTargetB.setSize(this.steamWidth, this.steamHeight);
		this.steamCondensation.setSize(Math.floor(this.renderWidth * .34), Math.floor(this.renderHeight * .34));
		this.skillEffect.material.uniforms.uCondensationTexel.value.copy(this.steamCondensation.texel);
	}
};
//#endregion
//#region src/style/sky.ts
var STAR_COUNT = 140;
var EXPLORATION_EYE_PAIR_COUNT = 22;
function seededRandom(index) {
	let value = (index + 1) * 2654435761;
	value ^= value >>> 16;
	value = Math.imul(value, 2246822507);
	value ^= value >>> 13;
	return (value >>> 0) / 4294967295;
}
function createStars(radius) {
	const positions = /* @__PURE__ */ new Float32Array(420);
	const phases = new Float32Array(STAR_COUNT);
	const sizes = new Float32Array(STAR_COUNT);
	const sparkles = new Float32Array(STAR_COUNT);
	const twinkleSpeeds = new Float32Array(STAR_COUNT);
	const starLuminance = new Float32Array(STAR_COUNT);
	for (let index = 0; index < STAR_COUNT; index += 1) {
		positions[index * 3] = MathUtils.lerp(-.38, .38, seededRandom(index * 5)) * radius;
		positions[index * 3 + 1] = MathUtils.lerp(.015, .34, seededRandom(index * 5 + 1)) * radius;
		positions[index * 3 + 2] = -radius;
		phases[index] = seededRandom(index * 5 + 2) * Math.PI * 2;
		sizes[index] = MathUtils.lerp(3.6, 7.2, seededRandom(index * 5 + 3));
		sparkles[index] = seededRandom(index * 5 + 4) > .9 ? 1 : 0;
		twinkleSpeeds[index] = MathUtils.lerp(.58, 1.42, seededRandom(index * 7 + 91));
		starLuminance[index] = MathUtils.lerp(.68, 1, seededRandom(index * 7 + 92));
	}
	const geometry = new BufferGeometry();
	geometry.setAttribute("position", new BufferAttribute(positions, 3));
	geometry.setAttribute("aPhase", new BufferAttribute(phases, 1));
	geometry.setAttribute("aSize", new BufferAttribute(sizes, 1));
	geometry.setAttribute("aSparkle", new BufferAttribute(sparkles, 1));
	geometry.setAttribute("aTwinkleSpeed", new BufferAttribute(twinkleSpeeds, 1));
	geometry.setAttribute("aLuminance", new BufferAttribute(starLuminance, 1));
	geometry.setDrawRange(0, STAR_COUNT);
	const material = new ShaderMaterial({
		uniforms: {
			uTime: { value: 0 },
			uProgress: { value: 0 },
			uReducedMotion: { value: 0 }
		},
		vertexShader: `
      attribute float aPhase;
      attribute float aSize;
      attribute float aSparkle;
      attribute float aTwinkleSpeed;
      attribute float aLuminance;
      varying float vPhase;
      varying float vSparkle;
      varying float vTwinkleSpeed;
      varying float vLuminance;
      void main() {
        vPhase = aPhase;
        vSparkle = aSparkle;
        vTwinkleSpeed = aTwinkleSpeed;
        vLuminance = aLuminance;
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * viewPosition;
        gl_PointSize = aSize + aSparkle * 1.7;
      }
    `,
		fragmentShader: `
      uniform float uTime;
      uniform float uProgress;
      uniform float uReducedMotion;
      varying float vPhase;
      varying float vSparkle;
      varying float vTwinkleSpeed;
      varying float vLuminance;
      void main() {
        vec2 point = gl_PointCoord - 0.5;
        float radius = length(point);
        float core = smoothstep(0.48, 0.04, radius);
        float cross = max(
          smoothstep(0.12, 0.0, abs(point.x)) * smoothstep(0.5, 0.08, abs(point.y)),
          smoothstep(0.12, 0.0, abs(point.y)) * smoothstep(0.5, 0.08, abs(point.x))
        ) * vSparkle;
        float wave = 0.5 + 0.5 * sin(uTime * vTwinkleSpeed * 2.05 + vPhase);
        float secondary = 0.5 + 0.5 * sin(uTime * (0.43 + vTwinkleSpeed * 0.31) + vPhase * 1.73);
        float twinkle = mix(0.22, 1.0, pow(wave, 2.4));
        float breath = mix(twinkle * mix(0.72, 1.0, secondary), 0.88, uReducedMotion);
        float alpha = max(core, cross * 0.9) * breath * uProgress * vLuminance;
        if (alpha < 0.01) discard;
        vec3 color = mix(vec3(0.64, 0.72, 0.95), vec3(1.0, 0.82, 0.9), vSparkle * 0.28);
        gl_FragColor = vec4(color * 2.75, alpha);
      }
    `,
		transparent: true,
		depthWrite: false,
		depthTest: true,
		blending: 2,
		fog: false
	});
	const points = new Points(geometry, material);
	points.name = "night-stars";
	points.frustumCulled = false;
	points.renderOrder = -9;
	return {
		points,
		material
	};
}
function createExplorationEyes(radius) {
	const positions = /* @__PURE__ */ new Float32Array(66);
	const sizes = new Float32Array(EXPLORATION_EYE_PAIR_COUNT);
	const phases = new Float32Array(EXPLORATION_EYE_PAIR_COUNT);
	const blinkIntervals = new Float32Array(EXPLORATION_EYE_PAIR_COUNT);
	const tilts = new Float32Array(EXPLORATION_EYE_PAIR_COUNT);
	const intensities = new Float32Array(EXPLORATION_EYE_PAIR_COUNT);
	const spreads = new Float32Array(EXPLORATION_EYE_PAIR_COUNT);
	const doubleBlinks = new Float32Array(EXPLORATION_EYE_PAIR_COUNT);
	for (let index = 0; index < EXPLORATION_EYE_PAIR_COUNT; index += 1) {
		const topBand = index < 13;
		const topIndex = Math.min(index, 12);
		const side = index % 2 === 0 ? -1 : 1;
		positions[index * 3] = topBand ? MathUtils.lerp(-radius * .275, radius * .275, topIndex / 12) + MathUtils.lerp(-radius * .016, radius * .016, seededRandom(index * 11 + 202)) : side * MathUtils.lerp(radius * .245, radius * .305, seededRandom(index * 11 + 202));
		positions[index * 3 + 1] = topBand ? MathUtils.lerp(radius * .07, radius * .145, seededRandom(index * 11 + 203)) : MathUtils.lerp(radius * .03, radius * .135, seededRandom(index * 11 + 203));
		positions[index * 3 + 2] = -MathUtils.lerp(radius * .76, radius * .82, seededRandom(index * 11 + 204));
		sizes[index] = MathUtils.lerp(topBand ? 28 : 34, topBand ? 66 : 78, seededRandom(index * 11 + 205));
		blinkIntervals[index] = MathUtils.lerp(2.8, 7.4, seededRandom(index * 11 + 206));
		phases[index] = seededRandom(index * 11 + 207) * blinkIntervals[index];
		tilts[index] = MathUtils.lerp(-.14, .14, seededRandom(index * 11 + 208));
		intensities[index] = MathUtils.lerp(.74, 1.18, seededRandom(index * 11 + 209));
		spreads[index] = MathUtils.lerp(.155, .205, seededRandom(index * 11 + 210));
		doubleBlinks[index] = seededRandom(index * 11 + 211) > .68 ? 1 : 0;
	}
	const geometry = new BufferGeometry();
	geometry.setAttribute("position", new BufferAttribute(positions, 3));
	geometry.setAttribute("aSize", new BufferAttribute(sizes, 1));
	geometry.setAttribute("aPhase", new BufferAttribute(phases, 1));
	geometry.setAttribute("aBlinkInterval", new BufferAttribute(blinkIntervals, 1));
	geometry.setAttribute("aTilt", new BufferAttribute(tilts, 1));
	geometry.setAttribute("aIntensity", new BufferAttribute(intensities, 1));
	geometry.setAttribute("aSpread", new BufferAttribute(spreads, 1));
	geometry.setAttribute("aDoubleBlink", new BufferAttribute(doubleBlinks, 1));
	geometry.setDrawRange(0, EXPLORATION_EYE_PAIR_COUNT);
	const material = new ShaderMaterial({
		uniforms: {
			uTime: { value: 0 },
			uProgress: { value: 0 },
			uReducedMotion: { value: 0 }
		},
		vertexShader: `
      attribute float aSize;
      attribute float aPhase;
      attribute float aBlinkInterval;
      attribute float aTilt;
      attribute float aIntensity;
      attribute float aSpread;
      attribute float aDoubleBlink;
      varying float vPhase;
      varying float vBlinkInterval;
      varying float vTilt;
      varying float vIntensity;
      varying float vSpread;
      varying float vDoubleBlink;
      void main() {
        vPhase = aPhase;
        vBlinkInterval = aBlinkInterval;
        vTilt = aTilt;
        vIntensity = aIntensity;
        vSpread = aSpread;
        vDoubleBlink = aDoubleBlink;
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * viewPosition;
        gl_PointSize = aSize;
      }
    `,
		fragmentShader: `
      uniform float uTime;
      uniform float uProgress;
      uniform float uReducedMotion;
      varying float vPhase;
      varying float vBlinkInterval;
      varying float vTilt;
      varying float vIntensity;
      varying float vSpread;
      varying float vDoubleBlink;

      vec2 rotatePoint(vec2 point, float angle) {
        float cosine = cos(angle);
        float sine = sin(angle);
        return vec2(point.x * cosine - point.y * sine, point.x * sine + point.y * cosine);
      }

      float eyeShape(vec2 point, float openness, float glowScale) {
        vec2 radius = vec2(0.12, mix(0.014, 0.076, openness)) * glowScale;
        return 1.0 - smoothstep(0.62, 1.08, length(point / radius));
      }

      void main() {
        vec2 point = rotatePoint(gl_PointCoord - 0.5, vTilt);
        float cycle = mod(uTime + vPhase, vBlinkInterval);
        float primaryBlink = smoothstep(0.015, 0.085, cycle)
          * (1.0 - smoothstep(0.085, 0.19, cycle));
        float secondaryBlink = smoothstep(0.27, 0.34, cycle)
          * (1.0 - smoothstep(0.34, 0.46, cycle))
          * vDoubleBlink;
        float openness = mix(max(0.035, 1.0 - max(primaryBlink, secondaryBlink)), 0.88, uReducedMotion);
        vec2 leftPoint = rotatePoint(point - vec2(-vSpread, 0.0), 0.2);
        vec2 rightPoint = rotatePoint(point - vec2(vSpread, 0.0), -0.2);
        float core = max(eyeShape(leftPoint, openness, 1.0), eyeShape(rightPoint, openness, 1.0));
        float glow = max(
          eyeShape(leftPoint, max(0.22, openness), 1.8),
          eyeShape(rightPoint, max(0.22, openness), 1.8)
        );
        float breath = mix(0.82, 1.0, 0.5 + 0.5 * sin(uTime * 0.72 + vPhase * 1.9));
        float alpha = (glow * 0.3 + core) * vIntensity * breath * uProgress;
        if (alpha < 0.008) discard;
        vec3 red = mix(vec3(0.72, 0.0, 0.006), vec3(1.0, 0.025, 0.015), core);
        gl_FragColor = vec4(red * mix(1.65, 2.65, core), alpha);
      }
    `,
		transparent: true,
		depthWrite: false,
		depthTest: true,
		blending: 2,
		fog: false
	});
	const points = new Points(geometry, material);
	points.name = "exploration-cave-eyes";
	points.frustumCulled = false;
	points.renderOrder = -7;
	return {
		points,
		material
	};
}
function createCloudTexture() {
	const canvas = document.createElement("canvas");
	canvas.width = 256;
	canvas.height = 128;
	const context = canvas.getContext("2d");
	if (!context) throw new Error("Unable to create cloud texture.");
	context.clearRect(0, 0, canvas.width, canvas.height);
	for (const [x, y, radius, opacity] of [
		[
			28,
			72,
			20,
			.26
		],
		[
			47,
			65,
			27,
			.32
		],
		[
			69,
			56,
			32,
			.34
		],
		[
			91,
			48,
			35,
			.32
		],
		[
			116,
			39,
			38,
			.34
		],
		[
			143,
			44,
			42,
			.34
		],
		[
			169,
			52,
			36,
			.32
		],
		[
			195,
			61,
			31,
			.3
		],
		[
			219,
			70,
			23,
			.26
		],
		[
			78,
			72,
			30,
			.22
		],
		[
			111,
			67,
			35,
			.24
		],
		[
			148,
			69,
			38,
			.24
		],
		[
			180,
			73,
			29,
			.22
		]
	]) {
		const gradient = context.createRadialGradient(x, y, radius * .08, x, y, radius);
		gradient.addColorStop(0, `rgba(255,255,255,${opacity})`);
		gradient.addColorStop(.42, `rgba(255,255,255,${opacity * .92})`);
		gradient.addColorStop(.72, `rgba(255,255,255,${opacity * .48})`);
		gradient.addColorStop(.9, `rgba(255,255,255,${opacity * .12})`);
		gradient.addColorStop(1, "rgba(255,255,255,0)");
		context.fillStyle = gradient;
		context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
	}
	const texture = new CanvasTexture(canvas);
	texture.colorSpace = SRGBColorSpace;
	return texture;
}
function buildSky(scene, radius = 112) {
	const dome = new Mesh(new SphereGeometry(radius, 32, 20), new ShaderMaterial({
		side: 1,
		depthWrite: true,
		fog: false,
		uniforms: {
			uTop: { value: new Color(PAL.skyTop) },
			uMid: { value: new Color(PAL.skyMid) },
			uHaze: { value: new Color(PAL.skyHaze) },
			uNightTop: { value: new Color(1054255) },
			uNightMid: { value: new Color(2435925) },
			uNightHaze: { value: new Color(6115950) },
			uThemeProgress: { value: 0 },
			uExplorationProgress: { value: 0 },
			uBands: { value: 26 }
		},
		vertexShader: `
        varying vec3 vLocal;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vLocal = position;
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
		fragmentShader: `
        uniform vec3 uTop, uMid, uHaze, uNightTop, uNightMid, uNightHaze;
        uniform float uBands, uThemeProgress, uExplorationProgress;
        varying vec3 vLocal;
        void main() {
          float h = normalize(vLocal).y;
          float t = clamp(h * 0.9 + 0.42, 0.0, 1.0);
          float q = floor(t * uBands) / uBands;
          t = mix(t, q, 0.35);
          vec3 color = mix(uHaze, uMid, smoothstep(0.0, 0.30, t));
          color = mix(color, uTop, smoothstep(0.26, 0.92, t));
          color = mix(color, uHaze, smoothstep(0.12, -0.05, h) * 0.6);
          vec3 night = mix(uNightHaze, uNightMid, smoothstep(0.0, 0.34, t));
          night = mix(night, uNightTop, smoothstep(0.25, 0.9, t));
          night = mix(night, uNightHaze, smoothstep(0.1, -0.06, h) * 0.45);
          color = mix(color, night, uThemeProgress);
          color = mix(color, color * vec3(0.035, 0.04, 0.065), uExplorationProgress);
          gl_FragColor = vec4(color, 1.0);
        }
      `
	}));
	dome.frustumCulled = false;
	dome.renderOrder = -10;
	scene.add(dome);
	const stars = createStars(radius * .91);
	scene.add(stars.points);
	const explorationEyes = createExplorationEyes(radius);
	scene.add(explorationEyes.points);
	const texture = createCloudTexture();
	const cloudMaterial = new MeshBasicMaterial({
		color: PAL.cloud,
		map: texture,
		transparent: true,
		opacity: .48,
		depthWrite: false,
		depthTest: true,
		fog: false
	});
	const shadeMaterial = cloudMaterial.clone();
	shadeMaterial.color.setHex(PAL.cloudShade);
	shadeMaterial.opacity = .25;
	const clouds = new Group();
	const cloudDayPositions = [];
	const cloudDriftSpeeds = [];
	const cloudDriftOffsets = [];
	for (let index = 0; index < 11; index += 1) {
		const width = MathUtils.lerp(16, 28, seededRandom(index * 7 + 29));
		const height = width * MathUtils.lerp(.28, .4, seededRandom(index * 7 + 30));
		const cloud = new Group();
		cloud.renderOrder = -8;
		const shade = new Mesh(new PlaneGeometry(width, height), shadeMaterial);
		shade.renderOrder = -8;
		shade.position.set(.3, -.35, -.15);
		const front = new Mesh(new PlaneGeometry(width, height), cloudMaterial);
		front.renderOrder = -8;
		if (seededRandom(index * 7 + 31) > .5) {
			front.scale.x = -1;
			shade.scale.x = -1;
		}
		cloud.add(shade, front);
		cloud.position.set(MathUtils.lerp(-42, 42, seededRandom(index * 7 + 32)), MathUtils.lerp(5, 20, seededRandom(index * 7 + 33)), -94 - index % 3 * 1.5);
		cloudDayPositions.push(cloud.position.clone());
		cloudDriftSpeeds.push(MathUtils.lerp(.24, .72, seededRandom(index * 7 + 40)));
		cloudDriftOffsets.push(seededRandom(index * 7 + 41) * 104);
		cloud.lookAt(0, 5, 0);
		clouds.add(cloud);
	}
	scene.add(clouds);
	const domeMaterial = dome.material;
	const explorationCloudColor = new Color(592661);
	const explorationShadeColor = new Color(197642);
	let themeProgress = 0;
	let explorationProgress = 0;
	let reducedMotion = false;
	let seasonCloudScale = 1;
	let seasonCloudVerticalScale = 1;
	let seasonCloudSpeed = 1;
	let seasonStarVisibility = 1;
	let cloudClock = null;
	let seasonEnvironment = SEASON_PROFILES.spring.day;
	const applyCloudEnvironment = () => {
		cloudMaterial.color.copy(seasonEnvironment.cloud).lerp(explorationCloudColor, explorationProgress);
		shadeMaterial.color.copy(seasonEnvironment.cloudShade).lerp(explorationShadeColor, explorationProgress);
		cloudMaterial.opacity = MathUtils.lerp(seasonEnvironment.cloudOpacity, .045, explorationProgress);
		shadeMaterial.opacity = MathUtils.lerp(seasonEnvironment.cloudShadeOpacity, .07, explorationProgress);
	};
	const applyTheme = () => {
		domeMaterial.uniforms.uThemeProgress.value = themeProgress;
		domeMaterial.uniforms.uExplorationProgress.value = explorationProgress;
		stars.material.uniforms.uProgress.value = themeProgress * seasonStarVisibility * MathUtils.lerp(1, .16, explorationProgress);
		explorationEyes.material.uniforms.uProgress.value = themeProgress * explorationProgress;
		applyCloudEnvironment();
	};
	return {
		dome,
		clouds,
		stars: stars.points,
		explorationEyes: explorationEyes.points,
		update(cameraPosition, cameraQuaternion, elapsed, delta = 0) {
			dome.position.copy(cameraPosition);
			stars.points.position.copy(cameraPosition);
			stars.points.quaternion.copy(cameraQuaternion);
			explorationEyes.points.position.copy(cameraPosition);
			explorationEyes.points.quaternion.copy(cameraQuaternion);
			clouds.position.copy(cameraPosition);
			clouds.quaternion.copy(cameraQuaternion);
			const elapsedStep = cloudClock === null ? 0 : Math.max(0, Math.min(.25, Number.isFinite(delta) && delta > 0 ? delta : elapsed - cloudClock));
			if (cloudClock === null) cloudDriftOffsets.forEach((_, index) => {
				cloudDriftOffsets[index] += elapsed * cloudDriftSpeeds[index] * seasonCloudSpeed;
			});
			else if (elapsed < cloudClock - .001) cloudDriftOffsets.forEach((_, index) => {
				cloudDriftOffsets[index] = seededRandom(index * 7 + 41) * 104 + elapsed * cloudDriftSpeeds[index] * seasonCloudSpeed;
			});
			else cloudDriftOffsets.forEach((_, index) => {
				cloudDriftOffsets[index] += elapsedStep * cloudDriftSpeeds[index] * seasonCloudSpeed;
			});
			cloudClock = elapsed;
			clouds.children.forEach((cloud, index) => {
				const base = cloudDayPositions[index];
				const travelWidth = 104;
				const drift = cloudDriftOffsets[index];
				cloud.position.copy(base);
				cloud.position.x = -52 + (base.x + 52 + drift) % travelWidth;
				cloud.position.y = base.y + Math.sin(elapsed * .055 + index * 1.7) * .38;
				cloud.scale.set(seasonCloudScale, seasonCloudScale * seasonCloudVerticalScale, 1);
			});
		},
		updateTheme(elapsed) {
			stars.material.uniforms.uTime.value = elapsed;
			stars.material.uniforms.uReducedMotion.value = reducedMotion ? 1 : 0;
			explorationEyes.material.uniforms.uTime.value = elapsed;
			explorationEyes.material.uniforms.uReducedMotion.value = reducedMotion ? 1 : 0;
		},
		setThemeProgress(progress) {
			themeProgress = MathUtils.clamp(progress, 0, 1);
			applyTheme();
		},
		setSeasonEnvironment(environment) {
			seasonEnvironment = environment;
			domeMaterial.uniforms.uTop.value.copy(environment.skyTop);
			domeMaterial.uniforms.uMid.value.copy(environment.skyMid);
			domeMaterial.uniforms.uHaze.value.copy(environment.skyHaze);
			domeMaterial.uniforms.uNightTop.value.copy(environment.skyTop);
			domeMaterial.uniforms.uNightMid.value.copy(environment.skyMid);
			domeMaterial.uniforms.uNightHaze.value.copy(environment.skyHaze);
			applyCloudEnvironment();
		},
		setSeasonWeights(weights) {
			seasonCloudScale = 0;
			seasonCloudVerticalScale = 0;
			seasonCloudSpeed = 0;
			seasonStarVisibility = 0;
			for (const mode of SEASON_MODES) {
				const weight = weights[mode];
				const profile = SEASON_PROFILES[mode];
				seasonCloudScale += profile.cloudScale * weight;
				seasonCloudVerticalScale += profile.cloudVerticalScale * weight;
				seasonCloudSpeed += profile.cloudSpeed * weight;
				seasonStarVisibility += profile.starVisibility * weight;
			}
			applyTheme();
		},
		setExplorationProgress(progress) {
			explorationProgress = MathUtils.clamp(progress, 0, 1);
			applyTheme();
		},
		setQualityTier(tier) {
			stars.points.geometry.setDrawRange(0, tier === "high" || tier === "reduced" ? STAR_COUNT : 90);
			explorationEyes.points.geometry.setDrawRange(0, tier === "high" ? EXPLORATION_EYE_PAIR_COUNT : tier === "reduced" ? 17 : 13);
		},
		setReducedMotion(reduced) {
			reducedMotion = reduced;
			stars.material.uniforms.uReducedMotion.value = reduced ? 1 : 0;
		},
		dispose() {
			dome.geometry.dispose();
			domeMaterial.dispose();
			clouds.traverse((object) => {
				if (object instanceof Mesh) object.geometry.dispose();
			});
			texture.dispose();
			cloudMaterial.dispose();
			shadeMaterial.dispose();
			stars.points.geometry.dispose();
			stars.material.dispose();
			explorationEyes.points.geometry.dispose();
			explorationEyes.material.dispose();
			dome.removeFromParent();
			clouds.removeFromParent();
			stars.points.removeFromParent();
			explorationEyes.points.removeFromParent();
		}
	};
}
//#endregion
//#region src/systems/Locale.ts
var STORAGE_KEY$2 = "plug-spirits-locale";
var messages = {
	zh: {
		"start.title": "樱色插线室",
		"start.description": "转一转，找到畅通的出口。抽出插头线，让家电一台台亮起来。",
		"start.loading.initial": "正在唤醒樱色线路",
		"start.loading.sky": "正在点亮樱色天空",
		"start.loading.bundle": "正在整理彩色线束",
		"start.loading.first": "正在编织第一关线路",
		"start.loading.appliances": "正在摆放樱色家电",
		"start.loading.cables": "正在盘紧插头线路",
		"start.loading.materials": "正在准备线路外观",
		"start.loading.applianceMaterials": "正在准备家电外观",
		"start.loading.scene": "正在布置房间",
		"start.ready": "准备好了，开始理线吧",
		"start.enter": "进入第一关",
		"start.challenge": "选择玩法",
		"start.random": "随机挑战",
		"start.explore": "探索模式",
		"start.rush": "限时挑战",
		"start.double": "双插头挑战",
		"start.skill": "技能挑战",
		"start.waiting": "线路准备中…",
		"start.preparing": "正在准备第一关…",
		"start.connecting": "正在接通…",
		"start.reload": "重新加载",
		"start.object": "开放式插头线束",
		"start.footer.controls": "拖动旋转 · 滚轮缩放 · 点击理线",
		"start.footer.modes": "关卡闯关 / 五种额外玩法",
		"hud.subtitle": "樱色插线室",
		"hud.remaining": "剩余线路",
		"status.find": "转动线束，寻找出口畅通的插头",
		"status.blocked": "前方被其他彩线挡住了",
		"status.opened": "新的路径已经打开",
		"status.solved": "线路已经完全解开",
		"status.connected": "新的连接路径已经打开",
		"status.powered": "所有家电已恢复供电",
		"status.gameOver": "三颗心已经用完",
		"loading.new": "正在整理新的线路…",
		"loading.first": "正在整理第一关…",
		"loading.reset": "正在重置当前关卡…",
		"loading.level": "正在进入第 {level} 关…",
		"loading.random": "正在生成随机线路…",
		"loading.rush": "正在准备限时挑战…",
		"loading.skill": "正在生成技能挑战线路…",
		"loader.connected": "线路已接通",
		"flash.wiring": "正在编织彩线…",
		"flash.blocked": "出口被挡住了，试试其他插头",
		"flash.moving": "正在抽出线路",
		"flash.summary": "{count} 条线路 · {free} 条可抽出",
		"flash.connected": "{name}已成功接通",
		"flash.lifeLost": "选错线路，失去一颗心",
		"flash.hint": "已标记一个可拔出的插头 · 剩余 {count} 次",
		"flash.hintUnavailable": "当前没有可提示的插头",
		"flash.wait": "当前插线动画结束后才能返回主界面",
		"mode.random": "随机挑战",
		"mode.explore": "探索模式",
		"mode.rush": "RUSH 速度挑战",
		"mode.skill": "技能挑战",
		"mode.level": "第 {level} 关 · {shape}",
		"continue.next": "进入下一关 →",
		"continue.random": "进入随机综合挑战 →",
		"continue.first": "从第1关开始 →",
		"actions.home": "主界面",
		"actions.gallery": "家电图鉴",
		"actions.reset": "重玩本关",
		"actions.random": "随机综合挑战",
		"help.drag": "<b>拖动</b> 旋转观察",
		"help.zoom": "<b>双指捏合 / 滚轮</b> 缩放",
		"help.click": "<b>点击插头</b> 抽出线路",
		"complete.eyebrow": "线路整理完成",
		"complete.title": "全屋通电",
		"complete.description": "所有插头精灵都找到了自己的家电。",
		"complete.retry": "重新挑战",
		"complete.home": "返回主界面",
		"gameOver.eyebrow": "这次差一点",
		"gameOver.title": "线路断电",
		"gameOver.description": "生命已用完。转动线束看清出口，再试一次吧。",
		"gameOver.retry": "重新挑战",
		"gameOver.new": "生成新线路",
		"lives.label": "生命",
		"lives.continueReady": "随机挑战生命值，复活待命，生命归零时恢复 {restore} 格",
		"lives.continueReadyTitle": "复活待命",
		"lives.continueRestorePrefix": "归零恢复 ",
		"lives.continueRestoreSuffix": " 格",
		"hint.label": "提示",
		"hint.aria": "提示一个可拔出的插头",
		"hint.remaining": "提示一个可拔出的插头，剩余 {count} 次",
		"loader.eyebrow": "准备下一段线路",
		"loader.progress": "关卡生成进度",
		"gallery.aria": "关卡操作",
		"language.switch": "切换到英文",
		"shape.cube": "紧密方体",
		"shape.cuboid": "长方体",
		"shape.pyramid": "阶梯锥体",
		"shape.cylinder": "阶梯圆柱",
		"shape.sphere": "阶梯球体",
		"shape.octahedron": "八面体",
		"shape.torus": "环体",
		"shape.arch": "拱体",
		"doubleEnded.briefing.eyebrow": "双端出口规则",
		"doubleEnded.briefing.title": "双插头挑战",
		"doubleEnded.briefing.rule": "每条线的两端都是插头。观察两端，找到没有被其他线路挡住的一端。",
		"doubleEnded.briefing.hint": "出口不会被标记；拖动旋转线束，从两端自行寻找。点击被挡端会失去一颗心。",
		"doubleEnded.briefing.start": "开始双插头挑战",
		"rush.timer.ready": "准备倒计时",
		"rush.timer.running": "剩余时间",
		"rush.briefing.time": "固定 {seconds} 秒",
		"rush.briefing.start": "开始挑战",
		"rush.difficulty.easy": "入门",
		"rush.difficulty.normal": "标准",
		"rush.difficulty.hard": "困难",
		"rush.difficulty.expert": "专家",
		"rush.result.success": "挑战成功",
		"rush.result.failure": "挑战失败",
		"rush.result.successDescription": "中央线束已经全部清空。",
		"rush.result.failureDescription": "倒计时已经归零，当前题目可以立即重试。",
		"rush.result.nextLevel": "下一关",
		"rush.result.next": "下一轮随机挑战",
		"rush.result.retry": "重新开始"
	},
	en: {
		"start.title": "Sakura Cable Room",
		"start.description": "Untangle the tightly packed plug cables and bring every quiet appliance back to life.",
		"start.loading.initial": "Waking the sakura circuits",
		"start.loading.sky": "Lighting the sakura sky",
		"start.loading.bundle": "Coiling the real plug cables",
		"start.loading.first": "Weaving the first puzzle",
		"start.loading.appliances": "Placing the appliances",
		"start.loading.cables": "Packing the plug cables",
		"start.loading.materials": "Warming cable materials",
		"start.loading.applianceMaterials": "Warming appliance materials",
		"start.loading.scene": "Warming the sakura scene",
		"start.ready": "The first puzzle is ready",
		"start.enter": "Enter Level 1",
		"start.challenge": "CHALLENGE MODES",
		"start.random": "RANDOM CHALLENGE",
		"start.explore": "EXPLORATION MODE",
		"start.rush": "RUSH CHALLENGE",
		"start.double": "DOUBLE-PLUG",
		"start.skill": "SKILL CHALLENGE",
		"start.waiting": "PREPARING CABLES…",
		"start.preparing": "Preparing Level 1…",
		"start.connecting": "Connecting…",
		"start.reload": "Reload",
		"start.object": "OPEN-ENDED PLUG CABLE BUNDLE",
		"start.footer.controls": "DRAG TO ORBIT · WHEEL TO ZOOM · CLICK TO UNTANGLE",
		"start.footer.modes": "STORY LEVELS / FIVE EXTRA MODES",
		"hud.subtitle": "SAKURA CABLE ROOM",
		"hud.remaining": "REMAINING",
		"status.find": "Find a plug cable with a clear exit",
		"status.blocked": "Another cable is blocking this route",
		"status.opened": "A new route has opened",
		"status.solved": "Every cable has been untangled",
		"status.connected": "A new connection route has opened",
		"status.powered": "Every appliance is powered",
		"status.gameOver": "All three hearts are gone",
		"loading.new": "Arranging a new circuit…",
		"loading.first": "Arranging Level 1…",
		"loading.reset": "Resetting this puzzle…",
		"loading.level": "Entering Level {level}…",
		"loading.random": "Generating a random circuit…",
		"loading.rush": "Loading the fixed RUSH card…",
		"loading.skill": "Generating a skill challenge…",
		"loader.connected": "CIRCUIT CONNECTED",
		"flash.wiring": "Weaving the cables…",
		"flash.blocked": "This cable cannot move yet",
		"flash.moving": "Cable is moving out",
		"flash.summary": "{count} cables · {free} clear exits",
		"flash.connected": "{name} is now connected",
		"flash.lifeLost": "Wrong cable — one heart lost",
		"flash.hint": "One removable plug marked · {count} hints left",
		"flash.hintUnavailable": "No removable plug is available to reveal",
		"flash.wait": "Wait for the current connection animation before returning home",
		"mode.random": "RANDOM CHALLENGE",
		"mode.explore": "EXPLORATION MODE",
		"mode.rush": "RUSH SPEED TRIAL",
		"mode.skill": "SKILL CHALLENGE",
		"mode.level": "LEVEL {level} · {shape}",
		"continue.next": "NEXT LEVEL →",
		"continue.random": "RANDOM MIX →",
		"continue.first": "START FROM LEVEL 1 →",
		"actions.home": "HOME",
		"actions.gallery": "APPLIANCES",
		"actions.reset": "RESET",
		"actions.random": "RANDOM MIX",
		"help.drag": "<b>DRAG</b> ORBIT",
		"help.zoom": "<b>PINCH / WHEEL</b> ZOOM",
		"help.click": "<b>CLICK</b> UNTANGLE",
		"complete.eyebrow": "HOME CIRCUIT RESTORED",
		"complete.title": "POWER RESTORED",
		"complete.description": "Every plug spirit has found an appliance.",
		"complete.retry": "RETRY CHALLENGE",
		"complete.home": "RETURN HOME",
		"gameOver.eyebrow": "CIRCUIT OVERLOAD",
		"gameOver.title": "POWER LOST",
		"gameOver.description": "Three wrong choices used all your hearts. Read the overlaps and try again.",
		"gameOver.retry": "RETRY",
		"gameOver.new": "NEW CIRCUIT",
		"lives.label": "LIVES",
		"lives.continueReady": "Random challenge lives, continue ready; restore {restore} lives at zero",
		"lives.continueReadyTitle": "CONTINUE READY",
		"lives.continueRestorePrefix": "Restore ",
		"lives.continueRestoreSuffix": " lives",
		"hint.label": "HINT",
		"hint.aria": "Reveal one removable plug",
		"hint.remaining": "Reveal one removable plug, {count} hints remaining",
		"loader.eyebrow": "NEW CIRCUIT",
		"loader.progress": "PUZZLE GENERATION PROGRESS",
		"gallery.aria": "Puzzle actions",
		"language.switch": "Switch to Chinese",
		"shape.cube": "DENSE CUBE",
		"shape.cuboid": "CUBOID",
		"shape.pyramid": "STEPPED PYRAMID",
		"shape.cylinder": "STEPPED CYLINDER",
		"shape.sphere": "STEPPED SPHERE",
		"shape.octahedron": "OCTAHEDRON",
		"shape.torus": "TORUS",
		"shape.arch": "ARCH",
		"doubleEnded.briefing.eyebrow": "DOUBLE-ENDED CABLE RULE",
		"doubleEnded.briefing.title": "DOUBLE-PLUG CHALLENGE",
		"doubleEnded.briefing.rule": "Every cable has a plug at both ends. Check both ends and find one whose route is not blocked.",
		"doubleEnded.briefing.hint": "Exits are not marked. Rotate the bundle and inspect both ends yourself. A blocked end costs one heart.",
		"doubleEnded.briefing.start": "START DOUBLE-PLUG",
		"rush.timer.ready": "TIMER READY",
		"rush.timer.running": "TIME LEFT",
		"rush.briefing.time": "FIXED {seconds} SECONDS",
		"rush.briefing.start": "START RUSH",
		"rush.difficulty.easy": "EASY",
		"rush.difficulty.normal": "NORMAL",
		"rush.difficulty.hard": "HARD",
		"rush.difficulty.expert": "EXPERT",
		"rush.result.success": "CHALLENGE CLEARED",
		"rush.result.failure": "CHALLENGE FAILED",
		"rush.result.successDescription": "Every cable in the central bundle is clear.",
		"rush.result.failureDescription": "The clock reached zero. Retry this exact card when ready.",
		"rush.result.nextLevel": "NEXT RUSH LEVEL",
		"rush.result.next": "NEXT RANDOM CHALLENGE",
		"rush.result.retry": "RETRY THIS CARD"
	}
};
var currentLocale = (() => {
	try {
		return localStorage.getItem(STORAGE_KEY$2) === "en" ? "en" : "zh";
	} catch {
		return "zh";
	}
})();
function getLocale() {
	return currentLocale;
}
function t(key, params = {}) {
	return messages[currentLocale][key].replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? ""));
}
function toggleLocale() {
	currentLocale = currentLocale === "zh" ? "en" : "zh";
	try {
		localStorage.setItem(STORAGE_KEY$2, currentLocale);
	} catch {}
	return currentLocale;
}
function shapeLabel(shape) {
	const key = `shape.${shape}`;
	return key in messages[currentLocale] ? t(key) : shape.toUpperCase();
}
function applyStaticTranslations() {
	document.documentElement.lang = currentLocale === "zh" ? "zh-CN" : "en";
	document.title = currentLocale === "zh" ? "Plug Cable Spirits · 樱色插线室" : "Plug Cable Spirits · Sakura Cable Room";
	const meta = document.querySelector("meta[name=\"description\"]");
	if (meta) meta.content = t("start.description");
	setHtml("#start-screen-title", `<small>Plug Cable Spirits</small>${t("start.title")}`);
	setText(".start-screen-copy > p", t("start.description"));
	setText(".start-screen-object-note b", t("start.object"));
	setText(".start-screen-footer span:first-child", t("start.footer.controls"));
	setText(".start-screen-footer span:last-child", t("start.footer.modes"));
	setText(".brand-block small", t("hud.subtitle"));
	setText(".progress-copy > span", t("hud.remaining"));
	setText("#home-button", t("actions.home"));
	setText("#challenge-mode-button", t("start.challenge"));
	setText("#start-random-button", t("start.random"));
	setText("#start-explore-button", t("start.explore"));
	setText("#start-rush-button", t("start.rush"));
	setText("#start-double-ended-button", t("start.double"));
	setText("#start-skill-button", t("start.skill"));
	const descriptions = currentLocale === "zh" ? [
		"随机体验不同类型的挑战",
		"进入探索模式，换个节奏",
		"倒计时结束前，抽出所有线",
		"观察两端，选择畅通的插头",
		"家电通电后，触发专属技能"
	] : [
		"A mix of different challenge types",
		"Explore at a different pace",
		"Clear every cable before time runs out",
		"Check both ends for a clear exit",
		"Power appliances to activate skills"
	];
	[
		"start-random-button",
		"start-explore-button",
		"start-rush-button",
		"start-double-ended-button",
		"start-skill-button"
	].forEach((id, index) => {
		const detail = document.createElement("small");
		detail.textContent = descriptions[index] ?? "";
		document.getElementById(id)?.append(detail);
	});
	setText("#appliance-gallery-button", t("actions.gallery"));
	setText("#reset-button", t("actions.reset"));
	setText("#new-button", t("actions.random"));
	setHtml("#help-strip span:nth-child(1)", t("help.drag"));
	setHtml("#help-strip span:nth-child(2)", t("help.zoom"));
	setHtml("#help-strip span:nth-child(3)", t("help.click"));
	setText("#complete-panel .complete-card > span", t("complete.eyebrow"));
	setText("#complete-panel h1", t("complete.title"));
	setText("#complete-panel p", t("complete.description"));
	setText("#complete-home-button", t("complete.home"));
	setText("#game-over-panel .complete-card > span", t("gameOver.eyebrow"));
	setText("#game-over-panel h1", t("gameOver.title"));
	setText("#game-over-panel p", t("gameOver.description"));
	setText("#retry-random-button", t("gameOver.retry"));
	setText("#game-over-new-button", t("gameOver.new"));
	setText("#random-lives .life-label", t("lives.label"));
	setText("#hint-button .life-label", t("hint.label"));
	setText(".puzzle-loader-copy > span", t("loader.eyebrow"));
	document.querySelector("#game-actions")?.setAttribute("aria-label", t("gallery.aria"));
	const languageButton = document.querySelector("#language-button");
	if (languageButton) {
		languageButton.textContent = currentLocale === "zh" ? "EN" : "中文";
		languageButton.setAttribute("aria-label", t("language.switch"));
	}
	document.querySelector("#random-lives")?.setAttribute("aria-label", t("lives.label"));
	const hintButton = document.querySelector("#hint-button");
	hintButton?.setAttribute("aria-label", t("hint.aria"));
	hintButton?.setAttribute("title", t("hint.aria"));
	document.querySelector(".plug-loader")?.setAttribute("aria-label", t("loader.progress"));
}
function setText(selector, text) {
	const element = document.querySelector(selector);
	if (element) element.textContent = text;
}
function setHtml(selector, html) {
	const element = document.querySelector(selector);
	if (element) element.innerHTML = html;
}
//#endregion
//#region src/systems/PuzzleLoadingOverlay.ts
var PuzzleLoadingOverlay = class PuzzleLoadingOverlay {
	static MINIMUM_VISIBLE_MS = 900;
	static CONTACT_HOLD_MS = 420;
	element = this.getElement("#puzzle-loader");
	label = this.getElement("#puzzle-loader-label");
	percent = this.getElement("#puzzle-loader-percent");
	progressBar = this.getElement(".plug-loader");
	frame = 0;
	completionTimer = 0;
	startedAt = 0;
	lifecycle = 0;
	get active() {
		return this.element.classList.contains("visible");
	}
	show(message) {
		this.lifecycle += 1;
		this.cancelTimers();
		this.startedAt = performance.now();
		this.label.textContent = message;
		this.element.classList.remove("plugged");
		this.element.classList.add("visible");
		this.element.setAttribute("aria-hidden", "false");
		this.setProgress(.04);
		this.frame = requestAnimationFrame(this.updateProgress);
	}
	setLabel(message) {
		this.label.textContent = message;
	}
	complete(onCovered, onFinished) {
		const lifecycle = this.lifecycle;
		if (!this.active) {
			Promise.resolve(onCovered()).then(() => {
				if (lifecycle === this.lifecycle) onFinished?.();
			});
			return;
		}
		if (this.frame) cancelAnimationFrame(this.frame);
		this.frame = 0;
		this.setProgress(1);
		this.label.textContent = t("loader.connected");
		this.element.classList.add("plugged");
		const visibleFor = Math.max(0, performance.now() - this.startedAt);
		const remainingMinimum = Math.max(0, PuzzleLoadingOverlay.MINIMUM_VISIBLE_MS - visibleFor);
		this.completionTimer = window.setTimeout(() => {
			Promise.resolve(onCovered()).finally(() => {
				if (lifecycle !== this.lifecycle) return;
				requestAnimationFrame(() => requestAnimationFrame(() => {
					if (lifecycle !== this.lifecycle) return;
					this.hide();
					onFinished?.();
				}));
			});
		}, Math.max(PuzzleLoadingOverlay.CONTACT_HOLD_MS, remainingMinimum));
	}
	fail() {
		this.hide();
	}
	hide() {
		this.lifecycle += 1;
		this.cancelTimers();
		this.element.classList.remove("visible");
		this.element.setAttribute("aria-hidden", "true");
		const lifecycle = this.lifecycle;
		window.setTimeout(() => {
			if (lifecycle === this.lifecycle) this.element.classList.remove("plugged");
		}, 260);
	}
	dispose() {
		this.cancelTimers();
	}
	updateProgress = (now) => {
		const elapsed = Math.max(0, now - this.startedAt);
		const progress = Math.min(.92, .04 + .88 * (1 - Math.exp(-elapsed / 3600)));
		this.setProgress(progress);
		this.frame = requestAnimationFrame(this.updateProgress);
	};
	setProgress(progress) {
		const clamped = Math.max(0, Math.min(1, progress));
		this.element.style.setProperty("--loader-progress", clamped.toFixed(4));
		this.percent.textContent = `${Math.round(clamped * 100)}%`;
		this.progressBar.setAttribute("aria-valuenow", String(Math.round(clamped * 100)));
	}
	cancelTimers() {
		if (this.frame) cancelAnimationFrame(this.frame);
		if (this.completionTimer) window.clearTimeout(this.completionTimer);
		this.frame = 0;
		this.completionTimer = 0;
	}
	getElement(selector) {
		const element = document.querySelector(selector);
		if (!element) throw new Error(`Missing HUD element: ${selector}`);
		return element;
	}
};
//#endregion
//#region src/systems/Hud.ts
var Hud = class {
	remaining = this.getElement("#remaining-value");
	total = this.getElement("#total-value");
	progress = this.getElement("#progress-fill");
	status = this.getElement("#status-line");
	seedLabel = this.getElement("#seed-label");
	toast = this.getElement("#toast");
	completePanel = this.getElement("#complete-panel");
	gameOverPanel = this.getElement("#game-over-panel");
	randomLives = this.getElement("#random-lives");
	lifeIcons = [...this.randomLives.querySelectorAll("i")];
	lifeBurst = this.createLifeBurst();
	continueIndicator = this.createContinueIndicator();
	hintIcons = [...document.querySelectorAll("#hint-button .hint-icons i")];
	toastTimer = 0;
	hintPulseTimer = 0;
	lifeBurstTimer = 0;
	continueReadyTimer = 0;
	lifeLossTimer = 0;
	lifeLossElements = [];
	lifeLossActivation = 0;
	renderedMaxLives = this.lifeIcons.length;
	hintUsesRemaining = 3;
	statusKey = "status.find";
	statusParams = {};
	loadingKey = "loading.new";
	loadingParams = {};
	puzzleMeta = null;
	resetViewButton = this.getButton("#reset-view-button");
	resetButton = this.getButton("#reset-button");
	newButton = this.getButton("#new-button");
	continueButton = this.getButton("#continue-button");
	completeHomeButton = this.getButton("#complete-home-button");
	applianceGalleryButton = this.getButton("#appliance-gallery-button");
	homeButton = this.getButton("#home-button");
	languageButton = this.getButton("#language-button");
	retryRandomButton = this.getButton("#retry-random-button");
	gameOverNewButton = this.getButton("#game-over-new-button");
	hintButton = this.getButton("#hint-button");
	loadingOverlay = new PuzzleLoadingOverlay();
	beginPuzzleLoad(messageKey = "loading.new", immersive = false, params = {}) {
		this.loadingKey = messageKey;
		this.loadingParams = params;
		this.completePanel.classList.remove("visible");
		this.completePanel.setAttribute("aria-hidden", "true");
		this.hideGameOver();
		this.setStatus(messageKey, params);
		this.continueButton.disabled = true;
		this.completeHomeButton.disabled = true;
		this.resetButton.disabled = true;
		this.newButton.disabled = true;
		this.homeButton.disabled = true;
		this.setHintEnabled(false);
		document.querySelector("#app")?.setAttribute("aria-busy", "true");
		if (immersive) this.loadingOverlay.show(t(messageKey, params));
		else this.loadingOverlay.hide();
	}
	completePuzzleLoad(onCovered, onFinished) {
		this.loadingOverlay.complete(onCovered, () => {
			this.finishPuzzleLoad();
			onFinished?.();
		});
	}
	finishPuzzleLoad() {
		this.continueButton.disabled = false;
		this.completeHomeButton.disabled = false;
		this.resetButton.disabled = false;
		this.newButton.disabled = false;
		this.homeButton.disabled = false;
		document.querySelector("#app")?.setAttribute("aria-busy", "false");
	}
	setPuzzle(seed, remaining, total, modeKey = "mode.random", continueKey = "continue.next", modeParams = {}) {
		this.puzzleMeta = {
			seed,
			modeKey,
			modeParams,
			continueKey
		};
		this.writePuzzleMeta();
		this.updateProgress(remaining, total);
		this.setStatus("status.find");
		this.completePanel.classList.remove("visible");
		this.completePanel.setAttribute("aria-hidden", "true");
		this.hideGameOver();
		if (!this.loadingOverlay.active) this.finishPuzzleLoad();
	}
	updateProgress(remaining, total) {
		this.remaining.textContent = String(remaining);
		this.total.textContent = String(total);
		const removed = total === 0 ? 0 : (total - remaining) / total;
		this.progress.style.width = `${Math.round(removed * 100)}%`;
	}
	showBlocked() {
		this.setStatus("status.blocked");
		this.flash(t("flash.blocked"), true);
	}
	showRemoved(remaining) {
		this.setStatus(remaining > 0 ? "status.opened" : "status.solved");
	}
	showConnected(remaining, applianceLabel) {
		this.setStatus(remaining > 0 ? "status.connected" : "status.powered");
		this.flash(t("flash.connected", { name: applianceLabel }));
	}
	showComplete() {
		this.completePanel.classList.add("visible");
		this.completePanel.setAttribute("aria-hidden", "false");
	}
	setRandomLives(visible, lives, maxLives = 3) {
		this.randomLives.classList.toggle("visible", visible);
		this.randomLives.setAttribute("aria-hidden", String(!visible));
		const container = this.randomLives.querySelector("div");
		const previousMaxLives = this.renderedMaxLives;
		const addedIcons = [];
		while (container && this.lifeIcons.length < maxLives) {
			const icon = document.createElement("i");
			icon.textContent = "♥";
			container.append(icon);
			this.lifeIcons.push(icon);
			addedIcons.push(icon);
		}
		while (container && this.lifeIcons.length > maxLives) this.lifeIcons.pop()?.remove();
		this.lifeIcons.forEach((icon, index) => {
			const active = index < lives;
			icon.classList.toggle("lost", !active);
			icon.setAttribute("aria-hidden", String(!active));
		});
		this.renderedMaxLives = maxLives;
		if (visible && maxLives > previousMaxLives) {
			window.clearTimeout(this.lifeBurstTimer);
			this.randomLives.classList.remove("popcorn-burst");
			this.lifeBurst.classList.remove("active");
			addedIcons.forEach((icon) => icon.classList.remove("life-added"));
			this.randomLives.offsetWidth;
			this.randomLives.classList.add("popcorn-burst");
			this.lifeBurst.classList.add("active");
			addedIcons.forEach((icon) => icon.classList.add("life-added"));
			this.lifeBurstTimer = window.setTimeout(() => {
				this.randomLives.classList.remove("popcorn-burst");
				this.lifeBurst.classList.remove("active");
				addedIcons.forEach((icon) => icon.classList.remove("life-added"));
			}, 900);
		}
	}
	showLifeLost(lives) {
		this.setStatus(lives > 0 ? "status.blocked" : "status.gameOver");
		this.playLifeLossFeedback(lives, false);
	}
	setContinueReady(ready, restoreLives = 1) {
		const restore = Math.max(1, restoreLives);
		this.randomLives.classList.toggle("continue-ready", ready);
		this.continueIndicator.setAttribute("aria-hidden", String(!ready));
		this.continueIndicator.querySelector("strong").textContent = t("lives.continueReadyTitle");
		const restoreValue = this.continueIndicator.querySelector("[data-continue-restore]");
		restoreValue.textContent = String(restore);
		this.continueIndicator.querySelector("small").replaceChildren(document.createTextNode(t("lives.continueRestorePrefix")), restoreValue, document.createTextNode(t("lives.continueRestoreSuffix")));
		this.randomLives.dataset.continueRestore = String(restore);
		this.randomLives.setAttribute("aria-label", ready ? t("lives.continueReady", { restore }) : t("lives.label"));
	}
	showContinueGranted(restoreLives) {
		this.setContinueReady(true, restoreLives);
		window.clearTimeout(this.continueReadyTimer);
		this.randomLives.classList.remove("continue-acquired");
		this.randomLives.offsetWidth;
		this.randomLives.classList.add("continue-acquired");
		this.continueReadyTimer = window.setTimeout(() => this.randomLives.classList.remove("continue-acquired"), 1650);
	}
	showComputerLifeLost(livesAfter) {
		this.setStatus(livesAfter > 0 ? "status.blocked" : "status.gameOver");
		this.playLifeLossFeedback(livesAfter, true);
	}
	playLifeLossFeedback(livesAfter, computer = false) {
		this.clearLifeLossFeedback();
		const icon = this.lifeIcons[Math.max(0, Math.min(this.lifeIcons.length - 1, livesAfter))];
		if (!icon) {
			this.flash(t("flash.lifeLost"), true, true);
			return;
		}
		const rect = icon.getBoundingClientRect();
		const ghost = document.createElement("i");
		ghost.className = `life-loss-ghost${computer ? " computer-life-loss-ghost" : ""}`;
		ghost.style.left = `${rect.left}px`;
		ghost.style.top = `${rect.top}px`;
		ghost.style.width = `${rect.width}px`;
		ghost.style.height = `${rect.height}px`;
		document.body.append(ghost);
		this.lifeLossElements.push(ghost);
		for (let index = 0; index < 10; index += 1) {
			const shard = document.createElement("b");
			shard.className = `life-loss-shard${computer ? " computer-life-loss-shard" : ""}`;
			shard.style.left = `${rect.left + rect.width * .5}px`;
			shard.style.top = `${rect.top + rect.height * .5}px`;
			shard.style.setProperty("--life-shard-index", String(index));
			document.body.append(shard);
			this.lifeLossElements.push(shard);
		}
		const readout = document.createElement("strong");
		readout.className = `life-loss-readout${computer ? " computer-life-loss-readout" : ""}`;
		readout.textContent = livesAfter > 0 ? "生命 -1" : "生命归零";
		readout.style.left = `${rect.left + rect.width * .5}px`;
		readout.style.top = `${rect.top + rect.height * .5}px`;
		document.body.append(readout);
		this.lifeLossElements.push(readout);
		const vignette = document.createElement("span");
		vignette.className = "life-loss-vignette";
		vignette.setAttribute("aria-hidden", "true");
		document.body.append(vignette);
		this.lifeLossElements.push(vignette);
		this.lifeLossActivation += 1;
		this.randomLives.dataset.lifeLossActivation = String(this.lifeLossActivation);
		icon.classList.remove("life-lost-now");
		this.randomLives.classList.remove("life-loss-hit", "computer-life-hit");
		this.randomLives.offsetWidth;
		icon.classList.add("life-lost-now");
		this.randomLives.classList.add("life-loss-hit");
		if (computer) this.randomLives.classList.add("computer-life-hit");
		this.flash(t("flash.lifeLost"), true, true);
		this.lifeLossTimer = window.setTimeout(() => this.clearLifeLossFeedback(), 3e4);
	}
	setHintEnabled(enabled) {
		this.hintButton.disabled = !enabled;
		this.hintButton.setAttribute("aria-disabled", String(!enabled));
	}
	setHintUses(remaining) {
		this.hintUsesRemaining = Math.max(0, Math.min(this.hintIcons.length, remaining));
		this.hintIcons.forEach((icon, index) => {
			icon.classList.toggle("used", index >= this.hintUsesRemaining);
		});
		const label = t("hint.remaining", { count: this.hintUsesRemaining });
		this.hintButton.setAttribute("aria-label", label);
		this.hintButton.setAttribute("title", label);
	}
	showHintUsed(remaining) {
		window.clearTimeout(this.hintPulseTimer);
		this.hintButton.classList.remove("revealing");
		this.hintButton.offsetWidth;
		this.hintButton.classList.add("revealing");
		this.hintPulseTimer = window.setTimeout(() => this.hintButton.classList.remove("revealing"), 620);
		this.flash(t("flash.hint", { count: remaining }));
	}
	showHintUnavailable() {
		this.flash(t("flash.hintUnavailable"), true);
	}
	showGameOver() {
		this.setStatus("status.gameOver");
		this.gameOverPanel.classList.add("visible");
		this.gameOverPanel.setAttribute("aria-hidden", "false");
	}
	hideGameOver() {
		this.gameOverPanel.classList.remove("visible");
		this.gameOverPanel.setAttribute("aria-hidden", "true");
	}
	hidePanels() {
		this.completePanel.classList.remove("visible");
		this.completePanel.setAttribute("aria-hidden", "true");
		this.hideGameOver();
	}
	refreshLocale() {
		applyStaticTranslations();
		this.setHintUses(this.hintUsesRemaining);
		this.setContinueReady(this.randomLives.classList.contains("continue-ready"), Number(this.randomLives.dataset.continueRestore ?? 1));
		this.status.textContent = t(this.statusKey, this.statusParams);
		this.writePuzzleMeta();
		if (this.loadingOverlay.active) this.loadingOverlay.setLabel(t(this.loadingKey, this.loadingParams));
	}
	showLoadError(message) {
		this.loadingOverlay.fail();
		this.finishPuzzleLoad();
		this.flash(message, true);
	}
	dispose() {
		window.clearTimeout(this.hintPulseTimer);
		window.clearTimeout(this.lifeBurstTimer);
		window.clearTimeout(this.continueReadyTimer);
		this.clearLifeLossFeedback();
		this.loadingOverlay.dispose();
	}
	flash(message, error = false, lifeLoss = false) {
		window.clearTimeout(this.toastTimer);
		this.toast.textContent = message;
		this.toast.classList.toggle("error", error);
		this.toast.classList.toggle("life-loss", lifeLoss);
		this.toast.classList.add("visible");
		this.toastTimer = window.setTimeout(() => {
			this.toast.classList.remove("visible");
			this.toast.classList.remove("life-loss");
		}, lifeLoss ? 8e3 : 1250);
	}
	setStatus(key, params = {}) {
		this.statusKey = key;
		this.statusParams = params;
		this.status.textContent = t(key, params);
	}
	writePuzzleMeta() {
		if (!this.puzzleMeta) return;
		const { seed, modeKey, modeParams, continueKey } = this.puzzleMeta;
		const resolvedParams = { ...modeParams };
		if (typeof resolvedParams.shapeId === "string") resolvedParams.shape = shapeLabel(resolvedParams.shapeId);
		this.seedLabel.textContent = `${t(modeKey, resolvedParams)} · SEED ${seed.toString(16).toUpperCase().padStart(8, "0")}`;
		this.continueButton.textContent = t(continueKey);
	}
	getElement(selector) {
		const element = document.querySelector(selector);
		if (!element) throw new Error(`Missing UI element: ${selector}`);
		return element;
	}
	createLifeBurst() {
		const burst = document.createElement("span");
		burst.className = "life-popcorn-burst";
		burst.setAttribute("aria-hidden", "true");
		for (let index = 0; index < 7; index += 1) burst.append(document.createElement("b"));
		this.randomLives.append(burst);
		return burst;
	}
	createContinueIndicator() {
		const indicator = document.createElement("span");
		indicator.className = "life-continue-indicator";
		indicator.setAttribute("aria-hidden", "true");
		const loop = document.createElement("span");
		loop.className = "life-continue-loop";
		loop.setAttribute("aria-hidden", "true");
		const title = document.createElement("strong");
		title.textContent = t("lives.continueReadyTitle");
		const detail = document.createElement("small");
		detail.append(t("lives.continueRestorePrefix"));
		const restore = document.createElement("b");
		restore.dataset.continueRestore = "";
		restore.textContent = "1";
		detail.append(restore, t("lives.continueRestoreSuffix"));
		indicator.append(loop, title, detail);
		this.randomLives.append(indicator);
		return indicator;
	}
	clearLifeLossFeedback() {
		window.clearTimeout(this.lifeLossTimer);
		this.lifeLossTimer = 0;
		this.randomLives.classList.remove("life-loss-hit", "computer-life-hit");
		this.lifeIcons.forEach((icon) => icon.classList.remove("life-lost-now"));
		this.lifeLossElements.forEach((element) => element.remove());
		this.lifeLossElements = [];
	}
	getButton(selector) {
		const element = document.querySelector(selector);
		if (!element) throw new Error(`Missing UI button: ${selector}`);
		return element;
	}
};
//#endregion
//#region ../arrow-cube/node_modules/three/examples/jsm/modifiers/TessellateModifier.js
/**
* This class can be used to modify a geometry by breaking its edges if they
* are longer than maximum length.
*
* ```js
* const modifier = new TessellateModifier( 8, 6 );
* geometry = modifier.modify( geometry );
* ```
*
* @three_import import { TessellateModifier } from 'three/addons/modifiers/TessellateModifier.js';
*/
var TessellateModifier = class {
	/**
	* Constructs a new Tessellate modifier.
	*
	* @param {number} [maxEdgeLength=0.1] - The maximum edge length.
	* @param {number} [maxIterations=6] - The number of iterations.
	*/
	constructor(maxEdgeLength = .1, maxIterations = 6) {
		/**
		* The maximum edge length.
		*
		* @type {number}
		* @default 0.1
		*/
		this.maxEdgeLength = maxEdgeLength;
		/**
		* The maximum edge length.
		*
		* @type {number}
		* @default 0.1
		*/
		this.maxIterations = maxIterations;
	}
	/**
	* Returns a new, modified version of the given geometry by applying a tessellation.
	* Please note that the resulting geometry is always non-indexed.
	*
	* @param {BufferGeometry} geometry - The geometry to modify.
	* @return {BufferGeometry} A new, modified geometry.
	*/
	modify(geometry) {
		if (geometry.index !== null) geometry = geometry.toNonIndexed();
		const maxIterations = this.maxIterations;
		const maxEdgeLengthSquared = this.maxEdgeLength * this.maxEdgeLength;
		const va = new Vector3();
		const vb = new Vector3();
		const vc = new Vector3();
		const vm = new Vector3();
		const vs = [
			va,
			vb,
			vc,
			vm
		];
		const na = new Vector3();
		const nb = new Vector3();
		const nc = new Vector3();
		const nm = new Vector3();
		const ns = [
			na,
			nb,
			nc,
			nm
		];
		const ca = new Color();
		const cb = new Color();
		const cc = new Color();
		const cm = new Color();
		const cs = [
			ca,
			cb,
			cc,
			cm
		];
		const ua = new Vector2();
		const ub = new Vector2();
		const uc = new Vector2();
		const um = new Vector2();
		const us = [
			ua,
			ub,
			uc,
			um
		];
		const u2a = new Vector2();
		const u2b = new Vector2();
		const u2c = new Vector2();
		const u2m = new Vector2();
		const u2s = [
			u2a,
			u2b,
			u2c,
			u2m
		];
		const attributes = geometry.attributes;
		const hasNormals = attributes.normal !== void 0;
		const hasColors = attributes.color !== void 0;
		const hasUVs = attributes.uv !== void 0;
		const hasUV1s = attributes.uv1 !== void 0;
		let positions = attributes.position.array;
		let normals = hasNormals ? attributes.normal.array : null;
		let colors = hasColors ? attributes.color.array : null;
		let uvs = hasUVs ? attributes.uv.array : null;
		let uv1s = hasUV1s ? attributes.uv1.array : null;
		let positions2 = positions;
		let normals2 = normals;
		let colors2 = colors;
		let uvs2 = uvs;
		let uv1s2 = uv1s;
		let iteration = 0;
		let tessellating = true;
		function addTriangle(a, b, c) {
			const v1 = vs[a];
			const v2 = vs[b];
			const v3 = vs[c];
			positions2.push(v1.x, v1.y, v1.z);
			positions2.push(v2.x, v2.y, v2.z);
			positions2.push(v3.x, v3.y, v3.z);
			if (hasNormals) {
				const n1 = ns[a];
				const n2 = ns[b];
				const n3 = ns[c];
				normals2.push(n1.x, n1.y, n1.z);
				normals2.push(n2.x, n2.y, n2.z);
				normals2.push(n3.x, n3.y, n3.z);
			}
			if (hasColors) {
				const c1 = cs[a];
				const c2 = cs[b];
				const c3 = cs[c];
				colors2.push(c1.r, c1.g, c1.b);
				colors2.push(c2.r, c2.g, c2.b);
				colors2.push(c3.r, c3.g, c3.b);
			}
			if (hasUVs) {
				const u1 = us[a];
				const u2 = us[b];
				const u3 = us[c];
				uvs2.push(u1.x, u1.y);
				uvs2.push(u2.x, u2.y);
				uvs2.push(u3.x, u3.y);
			}
			if (hasUV1s) {
				const u21 = u2s[a];
				const u22 = u2s[b];
				const u23 = u2s[c];
				uv1s2.push(u21.x, u21.y);
				uv1s2.push(u22.x, u22.y);
				uv1s2.push(u23.x, u23.y);
			}
		}
		while (tessellating && iteration < maxIterations) {
			iteration++;
			tessellating = false;
			positions = positions2;
			positions2 = [];
			if (hasNormals) {
				normals = normals2;
				normals2 = [];
			}
			if (hasColors) {
				colors = colors2;
				colors2 = [];
			}
			if (hasUVs) {
				uvs = uvs2;
				uvs2 = [];
			}
			if (hasUV1s) {
				uv1s = uv1s2;
				uv1s2 = [];
			}
			for (let i = 0, i2 = 0, il = positions.length; i < il; i += 9, i2 += 6) {
				va.fromArray(positions, i + 0);
				vb.fromArray(positions, i + 3);
				vc.fromArray(positions, i + 6);
				if (hasNormals) {
					na.fromArray(normals, i + 0);
					nb.fromArray(normals, i + 3);
					nc.fromArray(normals, i + 6);
				}
				if (hasColors) {
					ca.fromArray(colors, i + 0);
					cb.fromArray(colors, i + 3);
					cc.fromArray(colors, i + 6);
				}
				if (hasUVs) {
					ua.fromArray(uvs, i2 + 0);
					ub.fromArray(uvs, i2 + 2);
					uc.fromArray(uvs, i2 + 4);
				}
				if (hasUV1s) {
					u2a.fromArray(uv1s, i2 + 0);
					u2b.fromArray(uv1s, i2 + 2);
					u2c.fromArray(uv1s, i2 + 4);
				}
				const dab = va.distanceToSquared(vb);
				const dbc = vb.distanceToSquared(vc);
				const dac = va.distanceToSquared(vc);
				if (dab > maxEdgeLengthSquared || dbc > maxEdgeLengthSquared || dac > maxEdgeLengthSquared) {
					tessellating = true;
					if (dab >= dbc && dab >= dac) {
						vm.lerpVectors(va, vb, .5);
						if (hasNormals) nm.lerpVectors(na, nb, .5);
						if (hasColors) cm.lerpColors(ca, cb, .5);
						if (hasUVs) um.lerpVectors(ua, ub, .5);
						if (hasUV1s) u2m.lerpVectors(u2a, u2b, .5);
						addTriangle(0, 3, 2);
						addTriangle(3, 1, 2);
					} else if (dbc >= dab && dbc >= dac) {
						vm.lerpVectors(vb, vc, .5);
						if (hasNormals) nm.lerpVectors(nb, nc, .5);
						if (hasColors) cm.lerpColors(cb, cc, .5);
						if (hasUVs) um.lerpVectors(ub, uc, .5);
						if (hasUV1s) u2m.lerpVectors(u2b, u2c, .5);
						addTriangle(0, 1, 3);
						addTriangle(3, 2, 0);
					} else {
						vm.lerpVectors(va, vc, .5);
						if (hasNormals) nm.lerpVectors(na, nc, .5);
						if (hasColors) cm.lerpColors(ca, cc, .5);
						if (hasUVs) um.lerpVectors(ua, uc, .5);
						if (hasUV1s) u2m.lerpVectors(u2a, u2c, .5);
						addTriangle(0, 1, 3);
						addTriangle(3, 1, 2);
					}
				} else addTriangle(0, 1, 2);
			}
		}
		const geometry2 = new BufferGeometry();
		geometry2.setAttribute("position", new Float32BufferAttribute(positions2, 3));
		if (hasNormals) geometry2.setAttribute("normal", new Float32BufferAttribute(normals2, 3));
		if (hasColors) geometry2.setAttribute("color", new Float32BufferAttribute(colors2, 3));
		if (hasUVs) geometry2.setAttribute("uv", new Float32BufferAttribute(uvs2, 2));
		if (hasUV1s) geometry2.setAttribute("uv1", new Float32BufferAttribute(uv1s2, 2));
		return geometry2;
	}
};
//#endregion
//#region src/systems/JellyPreviewBody.ts
/** Centered gallery specimen: horizontal pulling deforms the lattice only.
* Vertical lifting transfers acceleration and ground impact to that lattice. */
var JellyPreviewBody = class {
	root;
	impulse;
	velocity = new Vector3();
	height = 1;
	grab = new Vector3();
	target = new Vector3();
	localTarget = new Vector3();
	held = false;
	constructor(root, impulse) {
		this.root = root;
		this.impulse = impulse;
	}
	reset(size) {
		this.height = Math.max(size.y, .1);
		this.root.position.set(0, 0, 0);
		this.root.quaternion.identity();
		this.velocity.set(0, 0, 0);
		this.held = false;
	}
	begin(point) {
		this.root.updateWorldMatrix(true, false);
		this.grab.copy(this.root.worldToLocal(point.clone()));
		this.target.copy(point);
		this.held = true;
	}
	move(point) {
		this.target.copy(point);
	}
	release() {
		this.held = false;
	}
	get moving() {
		return this.held || this.root.position.y > 1e-4 || Math.abs(this.velocity.y) > 1e-4;
	}
	update(delta) {
		this.root.position.x = 0;
		this.root.position.z = 0;
		this.root.quaternion.identity();
		this.velocity.x = 0;
		this.velocity.z = 0;
		this.localTarget.copy(this.target);
		this.root.parent?.updateWorldMatrix(true, false);
		this.root.parent?.worldToLocal(this.localTarget);
		const lift = MathUtils.clamp((this.localTarget.y - this.grab.y - this.height * .16) * .5, 0, this.height * .6);
		for (let remaining = Math.min(delta, .05); remaining > 0;) {
			const dt = Math.min(remaining, 1 / 120);
			remaining -= dt;
			const before = this.velocity.y;
			let acceleration = -jellyDynamics.gravity * this.height * 3;
			if (this.held) acceleration += (lift - this.root.position.y) * jellyDynamics.grab * .5 - this.velocity.y * 12;
			this.velocity.y += acceleration * dt;
			this.root.position.y += this.velocity.y * dt;
			if (this.root.position.y < 0) {
				this.root.position.y = 0;
				if (this.velocity.y < 0) this.velocity.y = Math.abs(this.velocity.y) > this.height * .12 ? -this.velocity.y * jellyDynamics.bounce : 0;
			}
			const change = this.velocity.y - before;
			if (Math.abs(change) > .001) this.impulse(new Vector3(0, change, 0));
		}
	}
};
//#endregion
//#region src/systems/JellyDynamicsPanel.ts
function createJellyDynamicsPanel(nudge) {
	const panel = document.createElement("aside");
	panel.className = "jelly-dynamics-panel";
	panel.setAttribute("aria-label", "全局果冻动态");
	panel.innerHTML = "<h3>果冻手感</h3><p>调好一次，所有家电一起生效</p>";
	const status = document.createElement("p");
	status.setAttribute("role", "status");
	const controls = [
		{
			label: "捏住范围",
			help: "小：捏尖角 · 大：拉动一整片",
			min: .12,
			max: 1.2,
			step: .02,
			get: () => jellyDynamics.radius,
			set: (v) => setJellyDynamics({ radius: v }),
			text: (v) => Math.round((v - .12) / 1.08 * 100) + "%"
		},
		{
			label: "Q弹程度",
			help: "低：紧实稳当 · 高：柔软、来回弹",
			min: 0,
			max: 100,
			step: 1,
			get: getJellyFeel,
			set: setJellyFeel,
			text: (v) => Math.round(v) + "%"
		},
		{
			label: "坠落重量",
			help: "轻轻落下 ← → 更有分量",
			min: .5,
			max: 3,
			step: .1,
			get: () => jellyDynamics.gravity,
			set: (v) => setJellyDynamics({ gravity: v }),
			text: (v) => v.toFixed(1)
		}
	];
	const refreshers = [];
	for (const c of controls) {
		const label = document.createElement("label");
		const title = document.createElement("span");
		title.textContent = c.label;
		const output = document.createElement("output");
		const input = document.createElement("input");
		input.type = "range";
		input.min = String(c.min);
		input.max = String(c.max);
		input.step = String(c.step);
		input.setAttribute("aria-label", c.label);
		const refresh = () => {
			input.value = String(c.get());
			output.value = c.text(Number(input.value));
		};
		refreshers.push(refresh);
		refresh();
		input.addEventListener("input", () => {
			c.set(Number(input.value));
			refresh();
			status.textContent = "已应用，尚未保存";
		});
		input.addEventListener("change", () => {
			if (window.matchMedia("(max-width: 700px)").matches) saveJellyDynamics();
		});
		const hint = document.createElement("small");
		hint.textContent = c.help;
		label.append(title, output, input, hint);
		panel.append(label);
	}
	const actions = document.createElement("div");
	actions.className = "jelly-dynamics-actions";
	const button = (text, action) => {
		const b = document.createElement("button");
		b.type = "button";
		b.textContent = text;
		b.addEventListener("click", action);
		actions.append(b);
	};
	button("轻推一下", nudge);
	button("恢复默认", () => {
		setJellyDynamics(jellyDefaults);
		setJellyFeel(65);
		refreshers.forEach((f) => f());
		status.textContent = "已恢复，尚未保存";
		nudge();
	});
	button("保存手感", () => {
		status.textContent = saveJellyDynamics() ? "已保存，刷新后仍生效" : "保存失败，当前调节仍有效";
	});
	panel.append(actions, status);
	for (const event of [
		"pointerdown",
		"pointermove",
		"pointerup",
		"wheel"
	]) panel.addEventListener(event, (e) => e.stopPropagation());
	return panel;
}
//#endregion
//#region ../arrow-cube/node_modules/lucide/dist/esm/defaultAttributes.mjs
/**
* @license lucide v1.31.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var defaultAttributes = {
	xmlns: "http://www.w3.org/2000/svg",
	width: 24,
	height: 24,
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	"stroke-width": 2,
	"stroke-linecap": "round",
	"stroke-linejoin": "round"
};
//#endregion
//#region ../arrow-cube/node_modules/lucide/dist/esm/createElement.mjs
/**
* @license lucide v1.31.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var createSVGElement = ([tag, attrs, children]) => {
	const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
	Object.keys(attrs).forEach((name) => {
		element.setAttribute(name, String(attrs[name]));
	});
	if (children?.length) children.forEach((child) => {
		const childElement = createSVGElement(child);
		element.appendChild(childElement);
	});
	return element;
};
var createElement = (iconNode, customAttrs = {}) => {
	return createSVGElement([
		"svg",
		{
			...defaultAttributes,
			...customAttrs
		},
		iconNode
	]);
};
//#endregion
//#region ../arrow-cube/node_modules/lucide/dist/esm/icons/air-vent.mjs
/**
* @license lucide v1.31.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var AirVent = [
	["path", { d: "M18 17.5a2.5 2.5 0 1 1-4 2.03V12" }],
	["path", { d: "M6 12H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" }],
	["path", { d: "M6 8h12" }],
	["path", { d: "M6.6 15.572A2 2 0 1 0 10 17v-5" }]
];
//#endregion
//#region ../arrow-cube/node_modules/lucide/dist/esm/icons/alarm-clock.mjs
/**
* @license lucide v1.31.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var AlarmClock = [
	["circle", {
		cx: "12",
		cy: "13",
		r: "8"
	}],
	["path", { d: "M12 9v4l2 2" }],
	["path", { d: "M5 3 2 6" }],
	["path", { d: "m22 6-3-3" }],
	["path", { d: "M6.38 18.7 4 21" }],
	["path", { d: "M17.64 18.67 20 21" }]
];
//#endregion
//#region ../arrow-cube/node_modules/lucide/dist/esm/icons/blender.mjs
/**
* @license lucide v1.31.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Blender = [
	["path", { d: "M8 14a2 2 0 0 0-1.963 1.615l-1.018 5.193A1 1 0 0 0 6 22h12a1 1 0 0 0 .981-1.192l-1.018-5.193A2 2 0 0 0 16 14z" }],
	["path", { d: "m17 2-1 12" }],
	["path", { d: "M8.006 14 7 2" }],
	["path", { d: "M7.565 8.787A5 5 0 0 0 12 8a5 5 0 0 1 4.56-.75" }],
	["path", { d: "M19 2H5a2 2 0 0 0-2 2v5a2 2 0 0 0 .688 1.5" }],
	["path", { d: "M12 18h.01" }]
];
//#endregion
//#region ../arrow-cube/node_modules/lucide/dist/esm/icons/bubbles.mjs
/**
* @license lucide v1.31.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Bubbles = [
	["path", { d: "M7.001 15.085A1.5 1.5 0 0 1 9 16.5" }],
	["circle", {
		cx: "18.5",
		cy: "8.5",
		r: "3.5"
	}],
	["circle", {
		cx: "7.5",
		cy: "16.5",
		r: "5.5"
	}],
	["circle", {
		cx: "7.5",
		cy: "4.5",
		r: "2.5"
	}]
];
//#endregion
//#region ../arrow-cube/node_modules/lucide/dist/esm/icons/candy.mjs
/**
* @license lucide v1.31.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Candy = [
	["path", { d: "M10 7v10.9" }],
	["path", { d: "M14 6.1V17" }],
	["path", { d: "M16 7V3a1 1 0 0 1 1.707-.707 2.5 2.5 0 0 0 2.152.717 1 1 0 0 1 1.131 1.131 2.5 2.5 0 0 0 .717 2.152A1 1 0 0 1 21 8h-4" }],
	["path", { d: "M16.536 7.465a5 5 0 0 0-7.072 0l-2 2a5 5 0 0 0 0 7.07 5 5 0 0 0 7.072 0l2-2a5 5 0 0 0 0-7.07" }],
	["path", { d: "M8 17v4a1 1 0 0 1-1.707.707 2.5 2.5 0 0 0-2.152-.717 1 1 0 0 1-1.131-1.131 2.5 2.5 0 0 0-.717-2.152A1 1 0 0 1 3 16h4" }]
];
//#endregion
//#region ../arrow-cube/node_modules/lucide/dist/esm/icons/chef-hat.mjs
/**
* @license lucide v1.31.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var ChefHat = [["path", { d: "M17 21a1 1 0 0 0 1-1v-5.35c0-.457.316-.844.727-1.041a4 4 0 0 0-2.134-7.589 5 5 0 0 0-9.186 0 4 4 0 0 0-2.134 7.588c.411.198.727.585.727 1.041V20a1 1 0 0 0 1 1Z" }], ["path", { d: "M6 17h12" }]];
//#endregion
//#region ../arrow-cube/node_modules/lucide/dist/esm/icons/circle-gauge.mjs
/**
* @license lucide v1.31.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var CircleGauge = [
	["path", { d: "M15.6 2.7a10 10 0 1 0 5.7 5.7" }],
	["circle", {
		cx: "12",
		cy: "12",
		r: "2"
	}],
	["path", { d: "M13.4 10.6 19 5" }]
];
//#endregion
//#region ../arrow-cube/node_modules/lucide/dist/esm/icons/coffee.mjs
/**
* @license lucide v1.31.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Coffee = [
	["path", { d: "M10 2v2" }],
	["path", { d: "M14 2v2" }],
	["path", { d: "M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1" }],
	["path", { d: "M6 2v2" }]
];
//#endregion
//#region ../arrow-cube/node_modules/lucide/dist/esm/icons/computer.mjs
/**
* @license lucide v1.31.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Computer = [
	["rect", {
		width: "14",
		height: "8",
		x: "5",
		y: "2",
		rx: "2"
	}],
	["rect", {
		width: "20",
		height: "8",
		x: "2",
		y: "14",
		rx: "2"
	}],
	["path", { d: "M6 18h2" }],
	["path", { d: "M12 18h6" }]
];
//#endregion
//#region ../arrow-cube/node_modules/lucide/dist/esm/icons/cooking-pot.mjs
/**
* @license lucide v1.31.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var CookingPot = [
	["path", { d: "M2 12h20" }],
	["path", { d: "M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8" }],
	["path", { d: "m4 8 16-4" }],
	["path", { d: "m8.86 6.78-.45-1.81a2 2 0 0 1 1.45-2.43l1.94-.48a2 2 0 0 1 2.43 1.46l.45 1.8" }]
];
//#endregion
//#region ../arrow-cube/node_modules/lucide/dist/esm/icons/droplets.mjs
/**
* @license lucide v1.31.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Droplets = [["path", { d: "M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z" }], ["path", { d: "M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97" }]];
//#endregion
//#region ../arrow-cube/node_modules/lucide/dist/esm/icons/fan.mjs
/**
* @license lucide v1.31.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Fan = [["path", { d: "M10.827 16.379a6.082 6.082 0 0 1-8.618-7.002l5.412 1.45a6.082 6.082 0 0 1 7.002-8.618l-1.45 5.412a6.082 6.082 0 0 1 8.618 7.002l-5.412-1.45a6.082 6.082 0 0 1-7.002 8.618l1.45-5.412Z" }], ["path", { d: "M12 12v.01" }]];
//#endregion
//#region ../arrow-cube/node_modules/lucide/dist/esm/icons/gamepad-2.mjs
/**
* @license lucide v1.31.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Gamepad2 = [
	["line", {
		x1: "6",
		x2: "10",
		y1: "11",
		y2: "11"
	}],
	["line", {
		x1: "8",
		x2: "8",
		y1: "9",
		y2: "13"
	}],
	["line", {
		x1: "15",
		x2: "15.01",
		y1: "12",
		y2: "12"
	}],
	["line", {
		x1: "18",
		x2: "18.01",
		y1: "10",
		y2: "10"
	}],
	["path", { d: "M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z" }]
];
//#endregion
//#region ../arrow-cube/node_modules/lucide/dist/esm/icons/glass-water.mjs
/**
* @license lucide v1.31.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var GlassWater = [["path", { d: "M5.116 4.104A1 1 0 0 1 6.11 3h11.78a1 1 0 0 1 .994 1.105L17.19 20.21A2 2 0 0 1 15.2 22H8.8a2 2 0 0 1-2-1.79z" }], ["path", { d: "M6 12a5 5 0 0 1 6 0 5 5 0 0 0 6 0" }]];
//#endregion
//#region ../arrow-cube/node_modules/lucide/dist/esm/icons/heater.mjs
/**
* @license lucide v1.31.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Heater = [
	["path", { d: "M11 8c2-3-2-3 0-6" }],
	["path", { d: "M15.5 8c2-3-2-3 0-6" }],
	["path", { d: "M6 10h.01" }],
	["path", { d: "M6 14h.01" }],
	["path", { d: "M10 16v-4" }],
	["path", { d: "M14 16v-4" }],
	["path", { d: "M18 16v-4" }],
	["path", { d: "M20 6a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3" }],
	["path", { d: "M5 20v2" }],
	["path", { d: "M19 20v2" }]
];
//#endregion
//#region ../arrow-cube/node_modules/lucide/dist/esm/icons/lamp.mjs
/**
* @license lucide v1.31.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Lamp = [
	["path", { d: "M12 12v6" }],
	["path", { d: "M4.077 10.615A1 1 0 0 0 5 12h14a1 1 0 0 0 .923-1.385l-3.077-7.384A2 2 0 0 0 15 2H9a2 2 0 0 0-1.846 1.23Z" }],
	["path", { d: "M8 20a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1z" }]
];
//#endregion
//#region ../arrow-cube/node_modules/lucide/dist/esm/icons/leaf.mjs
/**
* @license lucide v1.31.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Leaf = [["path", { d: "M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" }], ["path", { d: "M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" }]];
//#endregion
//#region ../arrow-cube/node_modules/lucide/dist/esm/icons/microwave.mjs
/**
* @license lucide v1.31.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Microwave = [
	["rect", {
		width: "20",
		height: "15",
		x: "2",
		y: "4",
		rx: "2"
	}],
	["rect", {
		width: "8",
		height: "7",
		x: "6",
		y: "8",
		rx: "1"
	}],
	["path", { d: "M18 8v7" }],
	["path", { d: "M6 19v2" }],
	["path", { d: "M18 19v2" }]
];
//#endregion
//#region ../arrow-cube/node_modules/lucide/dist/esm/icons/moon.mjs
/**
* @license lucide v1.31.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Moon = [["path", { d: "M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" }]];
//#endregion
//#region ../arrow-cube/node_modules/lucide/dist/esm/icons/panel-top.mjs
/**
* @license lucide v1.31.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var PanelTop = [["rect", {
	width: "18",
	height: "18",
	x: "3",
	y: "3",
	rx: "2"
}], ["path", { d: "M3 9h18" }]];
//#endregion
//#region ../arrow-cube/node_modules/lucide/dist/esm/icons/popcorn.mjs
/**
* @license lucide v1.31.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Popcorn = [
	["path", { d: "M18 8a2 2 0 0 0 0-4 2 2 0 0 0-4 0 2 2 0 0 0-4 0 2 2 0 0 0-4 0 2 2 0 0 0 0 4" }],
	["path", { d: "M10 22 9 8" }],
	["path", { d: "m14 22 1-14" }],
	["path", { d: "M20 8c.5 0 .9.4.8 1l-2.6 12c-.1.5-.7 1-1.2 1H7c-.6 0-1.1-.4-1.2-1L3.2 9c-.1-.6.3-1 .8-1Z" }]
];
//#endregion
//#region ../arrow-cube/node_modules/lucide/dist/esm/icons/printer.mjs
/**
* @license lucide v1.31.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Printer = [
	["path", { d: "M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" }],
	["path", { d: "M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6" }],
	["rect", {
		x: "6",
		y: "14",
		width: "12",
		height: "8",
		rx: "1"
	}]
];
//#endregion
//#region ../arrow-cube/node_modules/lucide/dist/esm/icons/radio.mjs
/**
* @license lucide v1.31.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Radio = [
	["path", { d: "M16.247 7.761a6 6 0 0 1 0 8.478" }],
	["path", { d: "M19.075 4.933a10 10 0 0 1 0 14.134" }],
	["path", { d: "M4.925 19.067a10 10 0 0 1 0-14.134" }],
	["path", { d: "M7.753 16.239a6 6 0 0 1 0-8.478" }],
	["circle", {
		cx: "12",
		cy: "12",
		r: "2"
	}]
];
//#endregion
//#region ../arrow-cube/node_modules/lucide/dist/esm/icons/refrigerator.mjs
/**
* @license lucide v1.31.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Refrigerator = [
	["path", { d: "M5 6a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6Z" }],
	["path", { d: "M5 10h14" }],
	["path", { d: "M15 7v6" }]
];
//#endregion
//#region ../arrow-cube/node_modules/lucide/dist/esm/icons/settings-2.mjs
/**
* @license lucide v1.31.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Settings2 = [
	["path", { d: "M14 17H5" }],
	["path", { d: "M19 7h-9" }],
	["circle", {
		cx: "17",
		cy: "17",
		r: "3"
	}],
	["circle", {
		cx: "7",
		cy: "7",
		r: "3"
	}]
];
//#endregion
//#region ../arrow-cube/node_modules/lucide/dist/esm/icons/smartphone.mjs
/**
* @license lucide v1.31.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Smartphone = [["rect", {
	width: "14",
	height: "20",
	x: "5",
	y: "2",
	rx: "2",
	ry: "2"
}], ["path", { d: "M12 18h.01" }]];
//#endregion
//#region ../arrow-cube/node_modules/lucide/dist/esm/icons/speaker.mjs
/**
* @license lucide v1.31.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Speaker = [
	["rect", {
		width: "16",
		height: "20",
		x: "4",
		y: "2",
		rx: "2"
	}],
	["path", { d: "M12 6h.01" }],
	["circle", {
		cx: "12",
		cy: "14",
		r: "4"
	}],
	["path", { d: "M12 14h.01" }]
];
//#endregion
//#region ../arrow-cube/node_modules/lucide/dist/esm/icons/sun.mjs
/**
* @license lucide v1.31.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Sun = [
	["circle", {
		cx: "12",
		cy: "12",
		r: "4"
	}],
	["path", { d: "M12 2v2" }],
	["path", { d: "M12 20v2" }],
	["path", { d: "m4.93 4.93 1.41 1.41" }],
	["path", { d: "m17.66 17.66 1.41 1.41" }],
	["path", { d: "M2 12h2" }],
	["path", { d: "M20 12h2" }],
	["path", { d: "m6.34 17.66-1.41 1.41" }],
	["path", { d: "m19.07 4.93-1.41 1.41" }]
];
//#endregion
//#region ../arrow-cube/node_modules/lucide/dist/esm/icons/trash-2.mjs
/**
* @license lucide v1.31.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Trash2 = [
	["path", { d: "M10 11v6" }],
	["path", { d: "M14 11v6" }],
	["path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" }],
	["path", { d: "M3 6h18" }],
	["path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" }]
];
//#endregion
//#region ../arrow-cube/node_modules/lucide/dist/esm/icons/turntable.mjs
/**
* @license lucide v1.31.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Turntable = [
	["path", { d: "M10 12.01h.01" }],
	["path", { d: "M18 8v4a8 8 0 0 1-1.07 4" }],
	["circle", {
		cx: "10",
		cy: "12",
		r: "4"
	}],
	["rect", {
		x: "2",
		y: "4",
		width: "20",
		height: "16",
		rx: "2"
	}]
];
//#endregion
//#region ../arrow-cube/node_modules/lucide/dist/esm/icons/tv.mjs
/**
* @license lucide v1.31.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Tv = [["path", { d: "m17 2-5 5-5-5" }], ["rect", {
	width: "20",
	height: "15",
	x: "2",
	y: "7",
	rx: "2"
}]];
//#endregion
//#region ../arrow-cube/node_modules/lucide/dist/esm/icons/volume-2.mjs
/**
* @license lucide v1.31.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Volume2 = [
	["path", { d: "M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" }],
	["path", { d: "M16 9a5 5 0 0 1 0 6" }],
	["path", { d: "M19.364 18.364a9 9 0 0 0 0-12.728" }]
];
//#endregion
//#region ../arrow-cube/node_modules/lucide/dist/esm/icons/volume-x.mjs
/**
* @license lucide v1.31.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var VolumeX = [
	["path", { d: "M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" }],
	["line", {
		x1: "22",
		x2: "16",
		y1: "9",
		y2: "15"
	}],
	["line", {
		x1: "16",
		x2: "22",
		y1: "9",
		y2: "15"
	}]
];
//#endregion
//#region ../arrow-cube/node_modules/lucide/dist/esm/icons/washing-machine.mjs
/**
* @license lucide v1.31.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var WashingMachine = [
	["path", { d: "M3 6h3" }],
	["path", { d: "M17 6h.01" }],
	["rect", {
		width: "18",
		height: "20",
		x: "3",
		y: "2",
		rx: "2"
	}],
	["circle", {
		cx: "12",
		cy: "13",
		r: "5"
	}],
	["path", { d: "M12 18a2.5 2.5 0 0 0 0-5 2.5 2.5 0 0 1 0-5" }]
];
//#endregion
//#region ../arrow-cube/node_modules/lucide/dist/esm/icons/wind.mjs
/**
* @license lucide v1.31.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Wind = [
	["path", { d: "M12.8 19.6A2 2 0 1 0 14 16H2" }],
	["path", { d: "M17.5 8a2.5 2.5 0 1 1 2 4H2" }],
	["path", { d: "M9.8 4.4A2 2 0 1 1 11 8H2" }]
];
//#endregion
//#region ../arrow-cube/node_modules/lucide/dist/esm/icons/x.mjs
/**
* @license lucide v1.31.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var X = [["path", { d: "M18 6 6 18" }], ["path", { d: "m6 6 12 12" }]];
//#endregion
//#region src/appliances/ApplianceSensoryProfiles.ts
var profile = (lightRole, lightColor, spill, radius, activeGain, nodeHints) => ({
	lightRole,
	lightColor,
	spill,
	radius,
	activeGain,
	standbyBrightness: .4,
	nodeHints
});
var APPLIANCE_SENSORY_PROFILES = {
	lamp: profile("lamp", 16767140, 1, 3.8, 2.25, [
		"shade",
		"bulb",
		"beam",
		"light"
	]),
	fan: profile("status", 9426662, .08, 1.2, .55, ["indicator", "status"]),
	radio: profile("output", 14722140, .18, 1.5, .8, [
		"dial",
		"needle",
		"indicator"
	]),
	television: profile("screen", 10209535, .72, 2.5, 1.8, [
		"screen",
		"picture",
		"crt"
	]),
	humidifier: profile("mist", 9164771, .32, 2.1, 1.1, [
		"mist",
		"cloud",
		"light"
	]),
	toaster: profile("heat", 16742474, .36, 1.6, 1.35, [
		"slot",
		"heater",
		"toast"
	]),
	refrigerator: profile("interior", 14872575, .58, 2.1, 1.5, [
		"interior",
		"light",
		"door"
	]),
	washer: profile("screen", 9554408, .35, 2, 1.15, [
		"window",
		"water",
		"indicator"
	]),
	microwave: profile("interior", 15180894, .38, 1.8, 1.25, [
		"interior",
		"cavity",
		"panel"
	]),
	"coffee-maker": profile("heat", 14916183, .3, 1.8, 1.2, [
		"carafe",
		"warming",
		"steam"
	]),
	kettle: profile("mist", 16763273, .22, 1.5, .95, [
		"indicator",
		"steam",
		"base"
	]),
	"rice-cooker": profile("heat", 14183509, .24, 1.6, 1.05, [
		"heat",
		"steam",
		"indicator"
	]),
	phone: profile("screen", 11064575, .65, 1.4, 1.75, [
		"screen",
		"display",
		"avatar"
	]),
	"robot-vacuum": profile("status", 8378335, .2, 1.35, .85, [
		"ring",
		"sensor",
		"indicator"
	]),
	"bubble-machine": profile("reflective", 11000319, .14, 1.8, .7, [
		"bubble",
		"film",
		"indicator"
	]),
	"gumball-machine": profile("output", 16759929, .18, 1.6, .75, [
		"output",
		"prize",
		"indicator"
	]),
	"popcorn-machine": profile("heat", 15769686, .45, 2.1, 1.45, [
		"chamber",
		"heat",
		"lamp"
	]),
	"alarm-clock": profile("status", 8570836, .08, 1.1, .5, [
		"face",
		"indicator",
		"dial"
	]),
	"smart-bin": profile("interior", 13476212, .16, 1.5, .75, [
		"sensor",
		"interior",
		"lid"
	]),
	"record-player": profile("output", 14132079, .2, 1.7, .85, [
		"stylus",
		"indicator",
		"record"
	]),
	"stand-mixer": profile("status", 8574166, .09, 1.4, .55, ["indicator", "status"]),
	printer: profile("output", 9164222, .14, 1.6, .7, [
		"status",
		"paper",
		"slot"
	]),
	"induction-cooktop": profile("heat", 15759183, .34, 1.9, 1.25, [
		"heat",
		"ring",
		"cookware"
	]),
	blender: profile("reflective", 8898520, .1, 1.45, .58, [
		"indicator",
		"liquid",
		"jar"
	]),
	dehumidifier: profile("status", 8243413, .12, 1.6, .65, [
		"indicator",
		"water",
		"window"
	]),
	"portable-speaker": profile("status", 8443356, .14, 1.4, .68, [
		"ring",
		"indicator",
		"speaker"
	]),
	"hair-dryer": profile("heat", 15769964, .22, 1.5, .92, [
		"nozzle",
		"heat",
		"indicator"
	]),
	"desktop-computer": profile("screen", 10669311, .7, 2.3, 1.7, [
		"screen",
		"monitor",
		"status"
	]),
	"game-controller": profile("status", 8444136, .18, 1.4, .8, [
		"ring",
		"indicator",
		"button"
	])
};
//#endregion
//#region src/appliances/ApplianceSensoryController.ts
var NIGHT_NEON_DEFAULT = {
	intensity: .36,
	pulseRate: 1.45
};
var NIGHT_NEON_OVERRIDES = {
	radio: {
		intensity: .46,
		pulseRate: 1.7
	},
	lamp: {
		intensity: .38,
		pulseRate: 1.35
	},
	washer: {
		intensity: .42,
		pulseRate: 1.5
	}
};
var NIGHT_NEON_START = .42;
var NIGHT_NEON_FULL = .9;
var NIGHT_NEON_TARGET_LUMINANCE = .5;
var NIGHT_NEON_MIN_GAIN = .42;
var NIGHT_NEON_MAX_GAIN = 1.8;
var EXPLORATION_NEON_BOOST = 1.76;
var EXPLORATION_POWERED_REVEAL_START = .06;
var EXPLORATION_POWERED_REVEAL_FULL = .92;
var EXPLORATION_POWERED_BODY_INTENSITY = .88;
var EXPLORATION_POWERED_ACCENT_MIX = .52;
var POWERED_BODY_WHITE = new Color(16777215);
function hueDistance(first, second) {
	const distance = Math.abs(first - second);
	return Math.min(distance, 1 - distance);
}
function isAccentFamily(color, accent) {
	const colorHsl = {
		h: 0,
		s: 0,
		l: 0
	};
	const accentHsl = {
		h: 0,
		s: 0,
		l: 0
	};
	color.getHSL(colorHsl);
	accent.getHSL(accentHsl);
	const colorChroma = Math.max(color.r, color.g, color.b) - Math.min(color.r, color.g, color.b);
	const accentChroma = Math.max(accent.r, accent.g, accent.b) - Math.min(accent.r, accent.g, accent.b);
	return colorChroma >= Math.max(.14, accentChroma * .3) && colorHsl.s >= .2 && colorHsl.l >= .16 && colorHsl.l <= Math.min(.82, accentHsl.l + .24) && hueDistance(colorHsl.h, accentHsl.h) <= .105;
}
function neonPerceptualGain(color) {
	const luminance = color.r * .2126 + color.g * .7152 + color.b * .0722;
	return MathUtils.clamp(NIGHT_NEON_TARGET_LUMINANCE / Math.max(luminance, .001), NIGHT_NEON_MIN_GAIN, NIGHT_NEON_MAX_GAIN);
}
function neonPhase(kind) {
	let hash = 0;
	for (let index = 0; index < kind.length; index += 1) hash = hash * 31 + kind.charCodeAt(index) >>> 0;
	return hash % 628 / 100;
}
var ApplianceSensoryController = class {
	neonScale;
	root = new Group();
	materialBaselines = /* @__PURE__ */ new WeakMap();
	targets = /* @__PURE__ */ new Map();
	constructor(neonScale = 1) {
		this.neonScale = neonScale;
		this.root.name = "appliance-sensory-lights";
	}
	update(targets, themeProgress, elapsed, explorationProgress = 0) {
		targets.forEach((target) => this.updateTarget(target, themeProgress, elapsed, explorationProgress));
		[...this.targets.keys()].forEach((target) => {
			if (targets.includes(target)) return;
			this.removeTarget(target);
		});
	}
	register(targets) {
		targets.forEach((target) => this.ensureTarget(target));
	}
	dispose() {
		[...this.targets.keys()].forEach((target) => this.removeTarget(target));
		this.root.removeFromParent();
	}
	getDiagnostics() {
		return [...this.targets.entries()].map(([target, state]) => {
			return {
				kind: target.kind,
				state: target.state,
				matchedNodes: state.matchedNodes,
				missingFunctionalNode: state.matchedNodes.length === 0,
				lightIntensity: state.poweredReveal * EXPLORATION_POWERED_BODY_INTENSITY,
				neonMaterialCount: state.neonMaterialCount,
				neonIntensity: state.neonIntensity,
				poweredReveal: state.poweredReveal
			};
		});
	}
	updateTarget(target, themeProgress, elapsed, explorationProgress) {
		const state = this.ensureTarget(target);
		const neonProfile = NIGHT_NEON_OVERRIDES[target.kind] ?? NIGHT_NEON_DEFAULT;
		const nightNeon = MathUtils.smoothstep(themeProgress, NIGHT_NEON_START, NIGHT_NEON_FULL);
		const exploration = MathUtils.clamp(explorationProgress, 0, 1);
		const explorationBoost = MathUtils.lerp(1, EXPLORATION_NEON_BOOST, exploration);
		const neonPulse = .94 + Math.sin(elapsed * neonProfile.pulseRate + neonPhase(target.kind) + state.neonMaterialCount * .37) * .06;
		state.neonIntensity = state.neonMaterialCount > 0 ? neonProfile.intensity * nightNeon * neonPulse * this.neonScale * explorationBoost : 0;
		state.poweredReveal = target.state === "active" ? MathUtils.smoothstep(target.getActiveElapsed(), EXPLORATION_POWERED_REVEAL_START, EXPLORATION_POWERED_REVEAL_FULL) * exploration : 0;
		state.materials.forEach((entry) => {
			const { material, baseline, neonAccent, neonColor, neonGain, poweredReveal, poweredRevealColor } = entry;
			const toon = material;
			const bodyRevealActive = poweredReveal && state.poweredReveal > .001;
			if (baseline.color && "color" in toon && toon.color instanceof Color) {
				toon.color.copy(baseline.color);
				if (bodyRevealActive) {
					const boost = state.poweredReveal;
					toon.color.lerp(POWERED_BODY_WHITE, boost * .22);
					toon.color.multiplyScalar(1 + boost * .28);
				}
			}
			if ((neonAccent || bodyRevealActive || entry.poweredRevealApplied) && baseline.emissive && "emissive" in toon && toon.emissive instanceof Color) {
				toon.emissive.copy(baseline.emissive);
				toon.emissiveIntensity = baseline.emissiveIntensity ?? 0;
				if (neonAccent && neonColor && state.neonIntensity > .001) {
					toon.emissive.copy(neonColor);
					toon.emissiveIntensity = state.neonIntensity * neonGain;
				}
				if (bodyRevealActive && poweredRevealColor && EXPLORATION_POWERED_BODY_INTENSITY * state.poweredReveal > toon.emissiveIntensity) {
					toon.emissive.copy(poweredRevealColor);
					toon.emissiveIntensity = EXPLORATION_POWERED_BODY_INTENSITY * state.poweredReveal;
				}
			}
			entry.poweredRevealApplied = bodyRevealActive;
		});
	}
	ensureTarget(target) {
		const existing = this.targets.get(target);
		if (existing) return existing;
		const profile = APPLIANCE_SENSORY_PROFILES[target.kind];
		const materials = [];
		const matchedNodes = [];
		const modelRoot = target.root.getObjectByName(`appliance-model-${target.kind}`) ?? target.root;
		const accentValue = Number(modelRoot.userData.applianceAccent);
		const accent = Number.isFinite(accentValue) ? new Color(accentValue) : null;
		target.root.traverse((object) => {
			if (object.type !== "Mesh" || object.userData.isOutline) return;
			const objectName = object.name;
			const lowerName = objectName.toLowerCase();
			const hinted = profile.nodeHints.some((hint) => lowerName.includes(hint));
			const status = lowerName.includes("indicator") || lowerName.includes("status");
			if (hinted) matchedNodes.push(objectName);
			const mesh = object;
			(Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((material) => {
				const baseline = this.getBaseline(material);
				const toon = material;
				const eligibleNeonAccent = Boolean(accent && baseline.color && baseline.emissive && !object.userData.performanceEffect && material.opacity >= .72 && "emissive" in toon && toon.emissive instanceof Color && isAccentFamily(baseline.color, accent));
				const neonAccent = eligibleNeonAccent && !hinted && !status;
				const poweredReveal = Boolean(accent && baseline.color && baseline.emissive && !object.userData.performanceEffect && material.opacity >= .72 && "emissive" in toon && toon.emissive instanceof Color && !status);
				const poweredRevealColor = poweredReveal && baseline.color && accent ? baseline.color.clone().lerp(accent, EXPLORATION_POWERED_ACCENT_MIX) : void 0;
				materials.push({
					objectName,
					material,
					baseline,
					hinted,
					status,
					eligibleNeonAccent,
					neonAccent,
					neonColor: neonAccent ? baseline.color?.clone() : void 0,
					neonGain: neonAccent && baseline.color ? neonPerceptualGain(baseline.color) : 1,
					poweredReveal,
					poweredRevealColor,
					poweredRevealApplied: false
				});
			});
		});
		if (!materials.some((entry) => entry.status)) {
			const fallbackStatus = materials.find((entry) => entry.hinted);
			if (fallbackStatus) fallbackStatus.status = true;
		}
		if (!materials.some((entry) => entry.neonAccent)) materials.forEach((entry) => {
			if (!entry.eligibleNeonAccent) return;
			entry.neonAccent = true;
			entry.neonColor = entry.baseline.color?.clone();
			entry.neonGain = entry.neonColor ? neonPerceptualGain(entry.neonColor) : 1;
		});
		target.root.updateWorldMatrix(true, true);
		const state = {
			materials,
			matchedNodes,
			neonMaterialCount: new Set(materials.filter((entry) => entry.neonAccent).map((entry) => entry.material)).size,
			neonIntensity: 0,
			poweredReveal: 0
		};
		this.targets.set(target, state);
		return state;
	}
	getBaseline(material) {
		const existing = this.materialBaselines.get(material);
		if (existing) return existing;
		const toon = material;
		const baseline = {
			color: "color" in toon && toon.color instanceof Color ? toon.color.clone() : void 0,
			emissive: "emissive" in toon && toon.emissive instanceof Color ? toon.emissive.clone() : void 0,
			emissiveIntensity: "emissiveIntensity" in toon ? toon.emissiveIntensity : void 0,
			opacity: material.opacity
		};
		this.materialBaselines.set(material, baseline);
		return baseline;
	}
	removeTarget(target) {
		this.targets.delete(target);
	}
};
//#endregion
//#region src/systems/ApplianceGallery.ts
var APPLIANCE_ICON_NODES = {
	lamp: Lamp,
	fan: Fan,
	radio: Radio,
	television: Tv,
	humidifier: AirVent,
	toaster: PanelTop,
	refrigerator: Refrigerator,
	washer: WashingMachine,
	microwave: Microwave,
	"coffee-maker": Coffee,
	kettle: GlassWater,
	"rice-cooker": CookingPot,
	phone: Smartphone,
	"robot-vacuum": CircleGauge,
	"bubble-machine": Bubbles,
	"gumball-machine": Candy,
	"popcorn-machine": Popcorn,
	"alarm-clock": AlarmClock,
	"smart-bin": Trash2,
	"record-player": Turntable,
	"stand-mixer": ChefHat,
	printer: Printer,
	"induction-cooktop": Heater,
	blender: Blender,
	dehumidifier: Droplets,
	"portable-speaker": Speaker,
	"hair-dryer": Wind,
	"desktop-computer": Computer,
	"game-controller": Gamepad2
};
var ApplianceGallery = class {
	theme;
	audio;
	element = document.createElement("section");
	canvas = document.createElement("canvas");
	renderer;
	disposeJellyEnvironment;
	scene = new Scene();
	camera = new PerspectiveCamera(31, 1, .1, 80);
	controls;
	transitionRoot = new Group();
	bodyRoot = new Group();
	body = new JellyPreviewBody(this.bodyRoot, (v) => this.softDeform?.applyInertia(v));
	transition = null;
	transitionTime = 0;
	pendingKind = null;
	slideAxis = new Vector3(1, 0, 0);
	slideDistance = 1;
	slideVelocity = 0;
	modelStage = new Group();
	performances = new AppliancePerformanceSystem();
	sensory = new ApplianceSensoryController(.48);
	petals = new PetalField();
	floor = new Mesh(new CircleGeometry(4.5, 48), new ShadowMaterial({
		color: 6247792,
		opacity: .14
	}));
	title = document.createElement("strong");
	subtitle = document.createElement("span");
	list = document.createElement("div");
	resetButton = document.createElement("button");
	rotateButton = document.createElement("button");
	closeButton = document.createElement("button");
	resizeObserver;
	current = null;
	previewBounds = new Box3();
	galleryTarget = null;
	currentDefinition = APPLIANCE_CATALOG[0];
	frameId = 0;
	previewSourceGeometries = /* @__PURE__ */ new Set();
	demoElapsed = 0;
	animationResumeAt = 0;
	previousCycle = -1;
	lastFrameAt = 0;
	isOpen = false;
	softDeform = null;
	deformPointerId = null;
	resumeAutoRotateAfterDeform = false;
	raycaster = new Raycaster();
	pointer = new Vector2();
	deformPlane = new Plane();
	deformPlanePoint = new Vector3();
	cameraForward = new Vector3();
	deformSurfaceNormal = new Vector3();
	deformNormalMatrix = new Matrix3();
	key = new DirectionalLight(PAL.sun, 2.35);
	fill = new DirectionalLight(PAL.fill, 1.08);
	rim = new DirectionalLight(16238810, .48);
	hemi = new HemisphereLight(PAL.hemiSky, PAL.hemiGround, 1.2);
	constructor(theme, audio) {
		this.theme = theme;
		this.audio = audio;
		this.element.id = "appliance-gallery";
		this.element.setAttribute("aria-hidden", "true");
		this.element.innerHTML = `
      <div class="appliance-gallery-shell">
        <header class="appliance-gallery-header">
          <div><span>SAKURA APPLIANCE ARCHIVE</span></div>
          <nav></nav>
        </header>
        <div class="appliance-gallery-stage"></div>
        <footer class="appliance-gallery-footer">
          <div class="appliance-gallery-copy"></div>
        </footer>
      </div>`;
		const headerCopy = this.element.querySelector(".appliance-gallery-header div");
		const headerNav = this.element.querySelector(".appliance-gallery-header nav");
		const stage = this.element.querySelector(".appliance-gallery-stage");
		const footer = this.element.querySelector(".appliance-gallery-footer");
		const copy = this.element.querySelector(".appliance-gallery-copy");
		if (!headerCopy || !headerNav || !stage || !footer || !copy) throw new Error("Unable to create appliance gallery UI.");
		this.title.textContent = "家电图鉴";
		this.subtitle.textContent = "拖动旋转 · 滚轮缩放 · 通电动画自动循环";
		headerCopy.append(this.title, this.subtitle);
		this.resetButton.type = "button";
		this.resetButton.textContent = "重置视角";
		this.rotateButton.type = "button";
		this.rotateButton.textContent = "暂停自转";
		this.closeButton.type = "button";
		this.closeButton.textContent = "关闭";
		this.closeButton.setAttribute("aria-label", "退出家电图鉴");
		headerNav.append(this.resetButton, this.rotateButton, this.closeButton);
		this.canvas.className = "appliance-gallery-canvas";
		stage.append(this.canvas, createJellyDynamicsPanel(() => {
			this.controls.autoRotate = false;
			this.rotateButton.textContent = "继续自转";
			this.softDeform?.nudge();
			this.animationResumeAt = performance.now() * .001 + 4.5;
		}));
		this.list.className = "appliance-gallery-list";
		footer.prepend(this.list);
		document.querySelector("#app")?.append(this.element);
		this.renderer = new WebGLRenderer({
			canvas: this.canvas,
			antialias: true,
			alpha: true
		});
		this.disposeJellyEnvironment = installJellyEnvironment(this.renderer, this.scene);
		this.renderer.outputColorSpace = SRGBColorSpace;
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = 1;
		this.renderer.setClearColor(PAL.fog, 0);
		this.scene.background = new Color(15330806);
		this.scene.fog = null;
		this.scene.add(this.transitionRoot);
		this.transitionRoot.add(this.bodyRoot);
		this.bodyRoot.add(this.modelStage);
		this.scene.add(this.petals.mesh);
		this.scene.add(this.performances.root);
		this.scene.add(this.sensory.root);
		this.floor.rotation.x = -Math.PI * .5;
		this.floor.receiveShadow = true;
		this.scene.add(this.floor);
		this.createLighting();
		this.controls = new OrbitControls(this.camera, this.canvas);
		this.controls.enableDamping = true;
		this.controls.enablePan = false;
		this.controls.dampingFactor = .08;
		this.controls.autoRotate = true;
		this.controls.autoRotateSpeed = 1.15;
		this.controls.minDistance = 1.4;
		this.controls.maxDistance = 20;
		APPLIANCE_CATALOG.forEach((definition, index) => {
			const button = document.createElement("button");
			button.type = "button";
			button.dataset.applianceKind = definition.id;
			const accent = `#${ARROW_COLORS[index % ARROW_COLORS.length].toString(16).padStart(6, "0")}`;
			const icon = createElement(APPLIANCE_ICON_NODES[definition.id], {
				"aria-hidden": "true",
				class: "appliance-gallery-list-icon"
			});
			button.innerHTML = `<i style="--accent:${accent}"></i><b>${definition.label}</b><small>${definition.sizeTier} · ${definition.plugStyleId}</small>`;
			button.append(icon);
			button.addEventListener("click", () => this.select(definition.id));
			this.list.append(button);
		});
		this.resetButton.addEventListener("click", this.resetView);
		this.rotateButton.addEventListener("click", this.toggleRotation);
		this.closeButton.addEventListener("click", this.close);
		this.canvas.addEventListener("pointerdown", this.onDeformPointerDown, true);
		this.canvas.addEventListener("pointermove", this.onDeformPointerMove, true);
		this.canvas.addEventListener("pointerup", this.onDeformPointerUp, true);
		this.canvas.addEventListener("pointercancel", this.onDeformPointerCancel, true);
		this.list.addEventListener("wheel", this.onListWheel, { passive: false });
		window.addEventListener("keydown", this.onKeyDown);
		this.resizeObserver = new ResizeObserver(() => this.resize());
		this.resizeObserver.observe(stage);
	}
	get visible() {
		return this.isOpen;
	}
	show() {
		this.open();
	}
	dispose() {
		this.close();
		this.resetButton.removeEventListener("click", this.resetView);
		this.rotateButton.removeEventListener("click", this.toggleRotation);
		this.closeButton.removeEventListener("click", this.close);
		this.canvas.removeEventListener("pointerdown", this.onDeformPointerDown, true);
		this.canvas.removeEventListener("pointermove", this.onDeformPointerMove, true);
		this.canvas.removeEventListener("pointerup", this.onDeformPointerUp, true);
		this.canvas.removeEventListener("pointercancel", this.onDeformPointerCancel, true);
		this.list.removeEventListener("wheel", this.onListWheel);
		window.removeEventListener("keydown", this.onKeyDown);
		this.resizeObserver.disconnect();
		this.disposeCurrent();
		this.performances.dispose();
		this.sensory.dispose();
		this.petals.dispose();
		this.controls.dispose();
		this.disposeJellyEnvironment();
		this.renderer.dispose();
		this.element.remove();
		delete window.__APPLIANCE_GALLERY_DIAGNOSTICS__;
	}
	open = () => {
		if (this.isOpen) return;
		this.isOpen = true;
		this.element.classList.add("visible");
		this.element.setAttribute("aria-hidden", "false");
		document.body.classList.add("appliance-gallery-open");
		this.loadSelection(this.currentDefinition.id);
		this.demoElapsed = 0;
		this.lastFrameAt = performance.now() * .001;
		this.previousCycle = -1;
		this.resize();
		this.animate();
	};
	close = () => {
		if (!this.isOpen) return;
		this.isOpen = false;
		cancelAnimationFrame(this.frameId);
		this.transition = null;
		this.pendingKind = null;
		this.transitionRoot.position.set(0, 0, 0);
		this.element.classList.remove("visible");
		this.element.setAttribute("aria-hidden", "true");
		document.body.classList.remove("appliance-gallery-open");
		if (this.galleryTarget) {
			this.galleryTarget.state = "idle";
			this.performances.stop(this.galleryTarget);
		}
		this.audio.update(this.theme.progress, []);
		this.sensory.update([], this.theme.progress, this.demoElapsed);
		this.performances.reset();
		this.finishDeformPointer(true);
		this.softDeform?.reset();
		if (this.resumeAutoRotateAfterDeform) {
			this.controls.autoRotate = true;
			this.rotateButton.textContent = "暂停自转";
		}
		this.resumeAutoRotateAfterDeform = false;
		if (window.__APPLIANCE_GALLERY_DIAGNOSTICS__) {
			window.__APPLIANCE_GALLERY_DIAGNOSTICS__.open = false;
			window.__APPLIANCE_GALLERY_DIAGNOSTICS__.active = false;
			window.__APPLIANCE_GALLERY_DIAGNOSTICS__.power = 0;
		}
	};
	select(kind) {
		if (kind === this.currentDefinition.id && !this.transition) return;
		this.pendingKind = kind;
		if (this.transition) return;
		this.finishDeformPointer(true);
		this.body.release();
		this.controls.autoRotate = false;
		this.resumeAutoRotateAfterDeform = false;
		this.rotateButton.textContent = "继续自转";
		this.slideAxis.setFromMatrixColumn(this.camera.matrixWorld, 0).normalize();
		this.slideDistance = this.camera.position.length() * 1.1;
		this.transition = "out";
		this.transitionTime = 0;
		this.slideVelocity = 0;
	}
	loadSelection(kind) {
		const definition = APPLIANCE_CATALOG.find((item) => item.id === kind);
		if (!definition) return;
		this.transitionRoot.position.set(0, 0, 0);
		this.body.reset(new Vector3(1, 1, 1));
		this.currentDefinition = definition;
		if (this.galleryTarget) {
			this.galleryTarget.state = "idle";
			this.performances.stop(this.galleryTarget);
		}
		this.audio.update(this.theme.progress, []);
		this.sensory.update([], this.theme.progress, this.demoElapsed);
		this.performances.reset();
		this.disposeCurrent();
		const catalogIndex = APPLIANCE_CATALOG.indexOf(definition);
		const accent = ARROW_COLORS[catalogIndex % ARROW_COLORS.length];
		const current = createApplianceModel(definition.id, {
			id: definition.id,
			accent,
			referencePath: definition.referencePath
		});
		const refined = /* @__PURE__ */ new Map();
		let refinementVertices = 0;
		current.root.traverse((object) => {
			if (!(object instanceof Mesh) || object instanceof SkinnedMesh) return;
			const source = object.geometry;
			if (refined.has(source)) {
				object.geometry = refined.get(source);
				return;
			}
			if (Array.isArray(object.material) && source.groups.length > 1 || Object.keys(source.morphAttributes).length || source.getAttribute("position").count > 3e3) return;
			source.computeBoundingBox();
			const size = source.boundingBox.getSize(new Vector3());
			const edge = Math.max(size.x, size.y, size.z) / 12;
			if (edge < .025) return;
			const geometry = new TessellateModifier(edge, 7).modify(source);
			const count = geometry.getAttribute("position").count;
			if (refinementVertices + count > 14e4) {
				geometry.dispose();
				return;
			}
			refinementVertices += count;
			this.previewSourceGeometries.add(source);
			refined.set(source, geometry);
			object.geometry = geometry;
		});
		this.current = current;
		this.galleryTarget = {
			root: current.root,
			state: "active",
			kind: definition.id,
			facingSide: 1,
			getActiveElapsed: () => Number.isFinite(window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__) ? Math.max(0, window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__) : this.demoElapsed
		};
		this.modelStage.add(current.root);
		this.modelStage.position.set(0, 0, 0);
		this.transitionRoot.updateMatrixWorld(true);
		this.modelStage.updateMatrixWorld(true);
		current.root.updateMatrixWorld(true);
		this.previewBounds.makeEmpty();
		current.root.traverseVisible((object) => {
			if (!(object instanceof Mesh)) return;
			if (!(Array.isArray(object.material) ? object.material : [object.material]).some((material) => material.visible && material.opacity > 0)) return;
			object.geometry.computeBoundingBox();
			if (object.geometry.boundingBox) this.previewBounds.union(object.geometry.boundingBox.clone().applyMatrix4(object.matrixWorld));
		});
		if (this.previewBounds.isEmpty()) this.previewBounds.setFromCenterAndSize(new Vector3(), new Vector3(1, 1, 1));
		this.softDeform = new SoftDeformController(current.root);
		this.title.textContent = definition.label;
		this.subtitle.textContent = `${definition.sizeTier} · ${definition.plugStyleId} · 通电动画自动循环`;
		this.list.querySelectorAll("button").forEach((button) => {
			button.classList.toggle("active", button.dataset.applianceKind === kind);
		});
		this.resetView();
		this.demoElapsed = 0;
		this.previousCycle = -1;
	}
	resetView = () => {
		if (!this.current) return;
		this.softDeform?.reset();
		this.body.reset(this.previewBounds.getSize(new Vector3()));
		this.modelStage.position.set(0, 0, 0);
		this.transitionRoot.updateMatrixWorld(true);
		this.modelStage.updateMatrixWorld(true);
		this.current.root.position.set(0, 0, 0);
		this.current.root.rotation.set(0, 0, 0);
		this.current.root.scale.setScalar(1);
		this.current.root.updateMatrixWorld(true);
		const bounds = this.previewBounds;
		const center = bounds.getCenter(new Vector3());
		const size = bounds.getSize(new Vector3());
		this.modelStage.position.copy(center).multiplyScalar(-1);
		const halfFov = MathUtils.degToRad(this.camera.fov * .5);
		const limitingFov = Math.min(halfFov, Math.atan(Math.tan(halfFov) * this.camera.aspect));
		const distance = Math.max(2.4, size.length() * .5 / Math.sin(limitingFov) * 1.12);
		const direction = this.currentDefinition.id === "robot-vacuum" ? new Vector3(1.15, 1.9, 2.1) : this.currentDefinition.id === "washer" ? new Vector3(1.32, .74, 2.5) : this.currentDefinition.id === "refrigerator" ? new Vector3(1.35, .68, 2.55) : new Vector3(1.35, .82, 2.45);
		this.controls.enableDamping = false;
		const autoRotate = this.controls.autoRotate;
		this.controls.autoRotate = false;
		this.controls.update();
		this.camera.position.copy(direction.normalize().multiplyScalar(Math.max(2.4, distance)));
		this.camera.near = Math.max(.01, distance / 80);
		this.camera.far = Math.max(30, distance * 10);
		this.controls.minDistance = distance * .8;
		this.controls.maxDistance = distance * 1.55;
		this.camera.updateProjectionMatrix();
		this.controls.target.set(0, 0, 0);
		this.controls.update();
		this.controls.enableDamping = true;
		this.controls.autoRotate = autoRotate;
		this.floor.position.y = -size.y * .5 - .04;
		this.floor.scale.setScalar(Math.max(.7, Math.max(size.x, size.z) * .42));
	};
	toggleRotation = () => {
		this.resumeAutoRotateAfterDeform = false;
		this.controls.autoRotate = !this.controls.autoRotate;
		this.rotateButton.textContent = this.controls.autoRotate ? "暂停自转" : "继续自转";
	};
	onDeformPointerDown = (event) => {
		if (this.transition !== null || event.button !== 0 || this.deformPointerId !== null || !this.current || !this.softDeform) return;
		const rect = this.canvas.getBoundingClientRect();
		this.pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
		this.camera.updateMatrixWorld(true);
		this.scene.updateMatrixWorld(true);
		this.raycaster.setFromCamera(this.pointer, this.camera);
		const hit = this.raycaster.intersectObjects(this.current.interactiveMeshes, false)[0];
		if (!hit) return;
		event.preventDefault();
		event.stopImmediatePropagation();
		this.deformPointerId = event.pointerId;
		this.animationResumeAt = performance.now() * .001 + 4.5;
		this.camera.getWorldDirection(this.cameraForward);
		if (hit.face) {
			this.deformNormalMatrix.getNormalMatrix(hit.object.matrixWorld);
			this.deformSurfaceNormal.copy(hit.face.normal).applyNormalMatrix(this.deformNormalMatrix);
		} else this.deformSurfaceNormal.copy(this.cameraForward).negate();
		this.deformPlane.setFromNormalAndCoplanarPoint(this.cameraForward, hit.point);
		const size = new Box3().setFromObject(this.current.root).getSize(new Vector3());
		const maxDimension = Math.max(size.x, size.y, size.z);
		this.deformPlanePoint.copy(hit.point);
		this.body.begin(hit.point);
		this.softDeform.begin(hit.point, size.length() * .72, maxDimension * .52, this.cameraForward, this.deformSurfaceNormal);
		this.resumeAutoRotateAfterDeform = this.controls.autoRotate;
		this.controls.autoRotate = false;
		this.rotateButton.textContent = "继续自转";
		this.canvas.classList.add("squishing");
		this.canvas.setPointerCapture(event.pointerId);
	};
	onDeformPointerMove = (event) => {
		if (event.pointerId !== this.deformPointerId || !this.softDeform) return;
		event.preventDefault();
		event.stopImmediatePropagation();
		const rect = this.canvas.getBoundingClientRect();
		this.pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
		this.camera.updateMatrixWorld(true);
		this.raycaster.setFromCamera(this.pointer, this.camera);
		if (this.raycaster.ray.intersectPlane(this.deformPlane, this.deformPlanePoint)) {
			this.body.move(this.deformPlanePoint);
			this.softDeform.setPointerWorld(this.deformPlanePoint);
		}
	};
	onDeformPointerUp = (event) => {
		if (event.pointerId !== this.deformPointerId) return;
		event.preventDefault();
		event.stopImmediatePropagation();
		this.finishDeformPointer(true);
	};
	onDeformPointerCancel = (event) => {
		if (event.pointerId !== this.deformPointerId) return;
		event.stopImmediatePropagation();
		this.finishDeformPointer(true);
	};
	finishDeformPointer(release) {
		const pointerId = this.deformPointerId;
		if (release) {
			this.softDeform?.release();
			this.body.release();
		}
		this.deformPointerId = null;
		if (pointerId !== null) this.animationResumeAt = performance.now() * .001 + 4.5;
		this.canvas.classList.remove("squishing");
		if (pointerId === null) return;
		try {
			if (this.canvas.hasPointerCapture(pointerId)) this.canvas.releasePointerCapture(pointerId);
		} catch {}
	}
	onListWheel = (event) => {
		if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
		event.preventDefault();
		this.list.scrollLeft += event.deltaY;
	};
	updateSlide(delta) {
		if (!this.transition) return;
		this.transitionTime += delta;
		const duration = this.transition === "out" ? .5 : .65;
		const t = Math.min(this.transitionTime / duration, 1);
		const distance = this.transition === "out" ? -this.slideDistance * t * t : this.slideDistance * (1 - t) * (1 - t);
		const velocity = (distance - this.transitionRoot.position.dot(this.slideAxis)) / Math.max(delta, .001);
		this.softDeform?.applyInertia(this.slideAxis.clone().multiplyScalar(velocity - this.slideVelocity));
		this.slideVelocity = velocity;
		this.transitionRoot.position.copy(this.slideAxis).multiplyScalar(distance);
		if (t < 1) return;
		if (this.transition === "out") {
			const kind = this.pendingKind ?? this.currentDefinition.id;
			this.pendingKind = null;
			this.loadSelection(kind);
			this.controls.autoRotate = false;
			this.slideAxis.setFromMatrixColumn(this.camera.matrixWorld, 0).normalize();
			this.slideDistance = this.camera.position.length() * 1.1;
			this.transitionRoot.position.copy(this.slideAxis).multiplyScalar(this.slideDistance);
			this.transition = "in";
			this.transitionTime = 0;
			this.slideVelocity = 0;
		} else {
			this.softDeform?.applyInertia(this.slideAxis.clone().multiplyScalar(-this.slideVelocity));
			this.transitionRoot.position.set(0, 0, 0);
			this.transition = null;
			this.slideVelocity = 0;
			const next = this.pendingKind;
			this.pendingKind = null;
			if (next && next !== this.currentDefinition.id) this.select(next);
		}
	}
	animate = () => {
		if (!this.isOpen) return;
		const now = performance.now() * .001;
		const delta = Math.min(.05, Math.max(0, now - this.lastFrameAt));
		this.lastFrameAt = now;
		this.updateSlide(delta);
		if (!this.transition) this.body.update(delta);
		if (this.deformPointerId !== null) this.softDeform?.setPointerWorld(this.deformPlanePoint);
		if (this.deformPointerId !== null) this.animationResumeAt = now + 4.5;
		const kneading = this.deformPointerId !== null || this.body.moving || this.transition !== null || now < this.animationResumeAt;
		if (!kneading) {
			const cycleDuration = poweredPreviewCycleDuration(this.currentDefinition.id);
			this.demoElapsed = (this.demoElapsed + delta) % cycleDuration;
			if (this.demoElapsed < this.previousCycle) this.performances.reset();
			this.previousCycle = this.demoElapsed;
		}
		const cycle = this.demoElapsed;
		const powered = poweredAnimationState(cycle, this.currentDefinition.id);
		const presentationPower = kneading ? 0 : powered.power;
		this.softDeform?.update(delta);
		this.petals.update(delta);
		if (this.galleryTarget && !kneading) {
			this.galleryTarget.state = powered.active ? "active" : "idle";
			this.sensory.register([this.galleryTarget]);
			this.performances.update(delta, cycle, this.camera, [this.galleryTarget], this.petals);
			this.sensory.update([this.galleryTarget], this.theme.progress, cycle);
			this.audio.update(this.theme.progress, [this.galleryTarget], this.camera);
		} else {
			this.sensory.update([], this.theme.progress, cycle);
			this.audio.update(this.theme.progress, []);
		}
		this.applyTheme();
		if (this.resumeAutoRotateAfterDeform && this.deformPointerId === null && now >= this.animationResumeAt && this.softDeform?.isSettled) {
			this.controls.autoRotate = true;
			this.rotateButton.textContent = "暂停自转";
			this.resumeAutoRotateAfterDeform = false;
		}
		this.controls.update(delta);
		this.renderer.render(this.scene, this.camera);
		const performanceState = this.performances.getStateSummary();
		const sensoryState = this.sensory.getDiagnostics().find((item) => item.kind === this.currentDefinition.id);
		window.__APPLIANCE_GALLERY_DIAGNOSTICS__ = {
			open: this.isOpen,
			selected: this.currentDefinition.id,
			catalogSize: APPLIANCE_CATALOG.length,
			active: powered.active && !kneading,
			cycle,
			power: presentationPower,
			animationSignal: this.galleryTarget?.root.userData.appliancePerformanceSignal ?? 0,
			neonMaterialCount: sensoryState?.neonMaterialCount ?? 0,
			neonIntensity: sensoryState?.neonIntensity ?? 0,
			lidRotationX: this.current?.root.getObjectByName("rice-cooker-lid-hinge-pivot")?.rotation.x ?? null,
			refrigeratorDoorRotationY: this.current?.root.getObjectByName("refrigerator-upper-door-pivot")?.rotation.y ?? null,
			refrigeratorInteriorVisible: this.current?.root.getObjectByName("refrigerator-upper-interior-content")?.visible ?? null,
			deforming: this.softDeform ? !this.softDeform.isSettled : false,
			deformPull: this.softDeform?.pullLength ?? 0,
			deformSignedPull: this.softDeform?.signedPull ?? 0,
			deformReboundPullRatio: this.softDeform?.lastReboundPullRatio ?? 0,
			deformReboundResponse: this.softDeform?.lastReboundResponse ?? 0,
			deformEnabled: this.softDeform !== null,
			deformRenderableMeshes: this.softDeform?.totalRenderableMeshes ?? 0,
			deformBoundRenderableMeshes: this.softDeform?.boundRenderableMeshes ?? 0,
			deformGrabEdgeFactor: this.softDeform?.currentGrabProfile.edgeFactor ?? 0,
			deformGrabCornerFactor: this.softDeform?.currentGrabProfile.cornerFactor ?? 0,
			deformGrabCenterFactor: this.softDeform?.currentGrabProfile.centerFactor ?? 0,
			deformWholeCoupling: this.softDeform?.currentGrabProfile.wholeCoupling ?? 0,
			deformLocalGain: this.softDeform?.currentGrabProfile.localGain ?? 0,
			deformIndentStrength: this.softDeform?.currentGrabProfile.indentStrength ?? 0,
			orbitAzimuth: this.controls.getAzimuthalAngle(),
			performanceSessions: performanceState.sessions,
			performanceTimelineOwners: performanceState.timelineOwners,
			performanceElapsed: performanceState.elapsedByKind[this.currentDefinition.id] ?? 0,
			performanceActiveByKind: performanceState.activeByKind,
			performanceCapacityByKind: performanceState.capacityByKind,
			activeToastNdc: performanceState.activeToastNdc,
			lampBeam: performanceState.lampBeam,
			radio: performanceState.radio,
			hairDryer: performanceState.hairDryer,
			refrigerator: performanceState.refrigerator,
			spectacleSessions: performanceState.sessions,
			spectacleActiveTotal: performanceState.activeTotal,
			petalBurstCount: this.petals.activeBurstCount,
			drawCalls: this.renderer.info.render.calls,
			triangles: this.renderer.info.render.triangles,
			geometries: this.renderer.info.memory.geometries,
			textures: this.renderer.info.memory.textures
		};
		this.frameId = requestAnimationFrame(this.animate);
	};
	resize() {
		const rect = this.canvas.parentElement?.getBoundingClientRect();
		if (!rect || rect.width < 1 || rect.height < 1) return;
		const pixelRatio = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(46e5 / (rect.width * rect.height)));
		this.renderer.setPixelRatio(Math.max(1, pixelRatio));
		this.renderer.setSize(rect.width, rect.height, false);
		this.camera.aspect = rect.width / rect.height;
		this.camera.updateProjectionMatrix();
		if (this.isOpen) this.resetView();
	}
	disposeCurrent() {
		this.finishDeformPointer(false);
		this.softDeform?.reset();
		this.softDeform = null;
		if (this.galleryTarget) this.performances.stop(this.galleryTarget);
		this.galleryTarget = null;
		if (!this.current) return;
		this.current.root.removeFromParent();
		const geometries = /* @__PURE__ */ new Set();
		const materials = new Set(this.current.materials);
		this.current.root.traverse((object) => {
			if (!(object instanceof Mesh)) return;
			geometries.add(object.geometry);
			(Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => materials.add(material));
		});
		this.previewSourceGeometries.forEach((geometry) => geometries.add(geometry));
		this.previewSourceGeometries.clear();
		geometries.forEach((geometry) => geometry.dispose());
		materials.forEach((material) => material.dispose());
		this.current = null;
	}
	createLighting() {
		const key = this.key;
		key.position.set(-5.5, 8, 7);
		key.castShadow = true;
		key.shadow.mapSize.set(1024, 1024);
		key.shadow.camera.left = -4;
		key.shadow.camera.right = 4;
		key.shadow.camera.top = 4;
		key.shadow.camera.bottom = -4;
		const fill = this.fill;
		fill.position.set(6, 3, 5);
		const rim = this.rim;
		rim.position.set(0, 4, -6);
		this.scene.add(key, fill, rim, this.hemi);
	}
	applyTheme() {
		const progress = this.theme.progress;
		const dayBackground = new Color(15330806);
		const nightBackground = new Color(3092816);
		const background = dayBackground.lerp(nightBackground, progress);
		this.scene.background = background;
		if (this.scene.fog instanceof Fog) this.scene.fog.color.copy(background);
		this.key.color.set(PAL.sun).lerp(new Color(14081524), progress);
		this.fill.color.set(PAL.fill).lerp(new Color(11450581), progress);
		this.rim.color.set(16238810).lerp(new Color(12888253), progress);
		this.hemi.color.set(PAL.hemiSky).lerp(new Color(11911900), progress);
		this.hemi.groundColor.set(PAL.hemiGround).lerp(new Color(7829646), progress);
		this.key.intensity = MathUtils.lerp(2.35, .84, progress);
		this.fill.intensity = MathUtils.lerp(1.08, .62, progress);
		this.rim.intensity = MathUtils.lerp(.48, .28, progress);
		this.hemi.intensity = MathUtils.lerp(1.2, .7, progress);
	}
	onKeyDown = (event) => {
		if (event.key === "Escape" && this.isOpen) this.close();
	};
};
//#endregion
//#region src/systems/ConnectionSystem.ts
var up = new Vector3(0, 1, 0);
var easeOutCubic$1 = (value) => 1 - (1 - value) ** 3;
var OFFSCREEN_NDC = 1.16;
var INNER_EDGE_NDC = .86;
var EXIT_DURATION = .58;
var ENTER_DURATION = .96;
var TRAIL_SEGMENT_COUNT = 9;
var hiddenTrailMatrix = new Matrix4().makeScale(0, 0, 0);
var trailPointA = new Vector3();
var trailPointB = new Vector3();
var trailMidpoint = new Vector3();
var trailDirection = new Vector3();
var trailQuaternion = new Quaternion();
var trailScale = new Vector3();
var trailMatrix = new Matrix4();
function worldPointAtNdc(ndc, reference, camera) {
	const depth = reference.clone().project(camera).z;
	return new Vector3(ndc.x, ndc.y, depth).unproject(camera);
}
function screenExitDirection(start, direction, camera) {
	const projectedStart = start.clone().project(camera);
	const projectedAhead = start.clone().addScaledVector(direction, 1.2).project(camera);
	const result = new Vector2(projectedAhead.x - projectedStart.x, projectedAhead.y - projectedStart.y);
	if (result.lengthSq() > 4e-4) return result.normalize();
	const cameraRight = new Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
	const cameraUp = new Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
	result.set(direction.dot(cameraRight), direction.dot(cameraUp));
	if (result.lengthSq() > 1e-4) return result.normalize();
	result.set(projectedStart.x, projectedStart.y);
	return result.lengthSq() > 1e-4 ? result.normalize() : result.set(1, 0);
}
function offscreenPoint(origin, direction) {
	const distances = [];
	if (direction.x > 1e-4) distances.push((OFFSCREEN_NDC - origin.x) / direction.x);
	if (direction.x < -1e-4) distances.push((-1.16 - origin.x) / direction.x);
	if (direction.y > 1e-4) distances.push((OFFSCREEN_NDC - origin.y) / direction.y);
	if (direction.y < -1e-4) distances.push((-1.16 - origin.y) / direction.y);
	const distance = Math.min(...distances.filter((value) => value > .02));
	return Number.isFinite(distance) ? origin.clone().addScaledVector(direction, distance + .08) : origin.clone().addScaledVector(direction, .42);
}
function buildExitCurve(start, exitDirection, camera) {
	const projectedStart3 = start.clone().project(camera);
	const projectedStart = new Vector2(projectedStart3.x, projectedStart3.y);
	const projectedEnd = offscreenPoint(projectedStart, screenExitDirection(start, exitDirection, camera));
	const bridge = worldPointAtNdc(projectedStart.clone().lerp(projectedEnd, .62), start, camera);
	const end = worldPointAtNdc(projectedEnd, start, camera);
	return new CatmullRomCurve3([
		start.clone(),
		start.clone().addScaledVector(exitDirection, 1.25),
		bridge,
		end
	], false, "centripetal", .45);
}
function buildEntryCurve(target, camera) {
	const end = target.getConnectionWorldPosition();
	const projectedSocket = end.clone().project(camera);
	const outside = new Vector2(MathUtils.clamp(projectedSocket.x, -.82, .82), MathUtils.clamp(projectedSocket.y, -.82, .82));
	const inside = outside.clone();
	if (target.outwardEdge === "left") {
		outside.x = -1.16;
		inside.x = -.86;
	} else if (target.outwardEdge === "right") {
		outside.x = OFFSCREEN_NDC;
		inside.x = INNER_EDGE_NDC;
	} else if (target.outwardEdge === "top") {
		outside.y = OFFSCREEN_NDC;
		inside.y = INNER_EDGE_NDC;
	} else {
		outside.y = -1.16;
		inside.y = -.86;
	}
	const entry = worldPointAtNdc(outside, end, camera);
	const edgeInside = worldPointAtNdc(inside, end, camera);
	return new CatmullRomCurve3([
		entry,
		edgeInside,
		end
	], false, "centripetal", .45);
}
var ConnectionSystem = class {
	root = new Group();
	flights = [];
	get activeCount() {
		return this.flights.length;
	}
	constructor() {
		this.root.name = "connection-flights";
	}
	begin(start, exitDirection, target, color, plugStyleId, camera, onComplete) {
		target.reserve(color);
		const material = cableJelly({
			color,
			thickness: CABLE_RADIUS * 2
		});
		const head = createPlugHead(color, 1, true, plugStyleId);
		const gelMaterials = /* @__PURE__ */ new Map();
		head.root.traverse((object) => {
			if (!(object instanceof Mesh)) return;
			if (object.userData.isOutline) {
				object.visible = false;
				return;
			}
			const convert = (source) => {
				if (!(source instanceof MeshToonMaterial)) return source;
				let gel = gelMaterials.get(source);
				if (!gel) {
					gel = cableJelly({
						color: source.color,
						thickness: .12
					});
					gelMaterials.set(source, gel);
				}
				return gel;
			};
			object.material = Array.isArray(object.material) ? object.material.map(convert) : convert(object.material);
		});
		gelMaterials.forEach((_, source) => source.dispose());
		const cable = new InstancedMesh(new CylinderGeometry(CABLE_RADIUS, CABLE_RADIUS, 1, 8, 1, false), material, TRAIL_SEGMENT_COUNT);
		cable.instanceMatrix.setUsage(DynamicDrawUsage);
		for (let index = 0; index < TRAIL_SEGMENT_COUNT; index += 1) cable.setMatrixAt(index, hiddenTrailMatrix);
		cable.instanceMatrix.needsUpdate = true;
		cable.castShadow = false;
		cable.receiveShadow = false;
		cable.frustumCulled = false;
		cable.visible = false;
		const root = new Group();
		root.add(cable, head.root);
		this.root.add(root);
		this.flights.push({
			root,
			phase: "exit",
			curve: buildExitCurve(start, exitDirection, camera),
			start: start.clone(),
			exitDirection: exitDirection.clone().normalize(),
			head,
			cable,
			material,
			target,
			color,
			phaseStartedAt: performance.now() * .001,
			duration: EXIT_DURATION,
			onComplete
		});
	}
	update(delta, camera) {
		const now = performance.now() * .001;
		for (let index = this.flights.length - 1; index >= 0; index -= 1) {
			const flight = this.flights[index];
			flight.curve = flight.phase === "exit" ? buildExitCurve(flight.start, flight.exitDirection, camera) : buildEntryCurve(flight.target, camera);
			const rawProgress = Math.min(1, (now - flight.phaseStartedAt) / flight.duration);
			const progress = easeOutCubic$1(rawProgress);
			const position = flight.curve.getPointAt(progress);
			const tangent = flight.curve.getTangentAt(Math.min(.999, progress)).normalize();
			flight.head.root.position.copy(position);
			flight.head.root.quaternion.setFromUnitVectors(up, tangent);
			const trailStart = Math.max(0, progress - (flight.phase === "exit" ? .34 : .24));
			if (progress > .012) {
				flight.curve.getPointAt(trailStart, trailPointA);
				for (let segment = 0; segment < TRAIL_SEGMENT_COUNT; segment += 1) {
					const sampleProgress = MathUtils.lerp(trailStart, progress, (segment + 1) / TRAIL_SEGMENT_COUNT);
					flight.curve.getPointAt(sampleProgress, trailPointB);
					trailDirection.subVectors(trailPointB, trailPointA);
					const length = Math.max(1e-4, trailDirection.length());
					trailDirection.multiplyScalar(1 / length);
					trailMidpoint.addVectors(trailPointA, trailPointB).multiplyScalar(.5);
					trailQuaternion.setFromUnitVectors(up, trailDirection);
					trailScale.set(1, length, 1);
					trailMatrix.compose(trailMidpoint, trailQuaternion, trailScale);
					flight.cable.setMatrixAt(segment, trailMatrix);
					trailPointA.copy(trailPointB);
				}
				flight.cable.instanceMatrix.needsUpdate = true;
				flight.cable.visible = true;
			}
			if (flight.phase === "enter" && rawProgress > .86) {
				const settle = (rawProgress - .86) / .14;
				const squash = 1 - Math.sin(settle * Math.PI) * .08;
				flight.head.root.scale.set(squash, 1 / squash, squash);
			}
			if (flight.phase === "enter") flight.head.root.visible = rawProgress < .995;
			if (rawProgress < 1) continue;
			if (flight.phase === "exit") {
				flight.phase = "enter";
				flight.phaseStartedAt = now;
				flight.duration = ENTER_DURATION;
				flight.curve = buildEntryCurve(flight.target, camera);
				flight.cable.visible = false;
				flight.head.root.visible = true;
				flight.head.root.scale.setScalar(1);
				continue;
			}
			flight.target.activate(flight.color);
			flight.onComplete();
			this.disposeFlight(flight);
			this.flights.splice(index, 1);
		}
	}
	clear() {
		this.flights.forEach((flight) => this.disposeFlight(flight));
		this.flights.length = 0;
	}
	dispose() {
		this.clear();
		this.root.removeFromParent();
	}
	disposeFlight(flight) {
		flight.root.removeFromParent();
		flight.cable.geometry.dispose();
		flight.head.dispose();
		flight.material.dispose();
	}
};
//#endregion
//#region src/systems/OrbitController.ts
var VIEW_SETTLE_DELAY_MS = 360;
var APPLIANCE_MIN_PITCH = -1.12;
var APPLIANCE_MAX_PITCH = 1.18;
function horizontalOrbitInputSign(pitch) {
	return Math.cos(pitch) < 0 ? -1 : 1;
}
var OrbitController = class {
	canvas;
	camera;
	callbacks;
	pointerId = null;
	touches = /* @__PURE__ */ new Map();
	pinchDistance = 0;
	pinchCenter = new Vector2();
	touchLantern = false;
	setTouchLantern(active) {
		this.touchLantern = active;
		this.clearTouches();
	}
	pinching = false;
	startX = 0;
	startY = 0;
	previousX = 0;
	previousY = 0;
	moved = false;
	yaw = .76;
	pitch = .56;
	appliancePitch = .56;
	radius = 19.2;
	velocityX = 0;
	velocityY = 0;
	suppressClick = false;
	enabled = true;
	clickOnly = false;
	viewSettleTimer = 0;
	target = new Vector3(0, .05, 0);
	constructor(canvas, camera, callbacks) {
		this.canvas = canvas;
		this.camera = camera;
		this.callbacks = callbacks;
		canvas.addEventListener("pointerdown", this.onPointerDown);
		canvas.addEventListener("pointermove", this.onPointerMove);
		canvas.addEventListener("pointerup", this.onPointerUp);
		canvas.addEventListener("pointercancel", this.onPointerCancel);
		canvas.addEventListener("pointerleave", this.onPointerLeave);
		canvas.addEventListener("click", this.onClick);
		canvas.addEventListener("wheel", this.onWheel, { passive: false });
		window.addEventListener("blur", this.clearTouches);
		this.updateCamera();
	}
	update(delta) {
		if (this.pointerId === null) {
			const decay = Math.exp(-delta * 8.5);
			this.yaw += this.velocityX * horizontalOrbitInputSign(this.pitch) * delta;
			this.applyPitchDelta(this.velocityY * delta);
			this.velocityX *= decay;
			this.velocityY *= decay;
		}
		this.updateCamera();
	}
	getState() {
		return {
			yaw: this.yaw,
			pitch: this.pitch,
			appliancePitch: this.appliancePitch,
			radius: this.radius
		};
	}
	setAngles(yaw, pitch) {
		this.yaw = yaw;
		this.pitch = pitch;
		this.appliancePitch = MathUtils.clamp(pitch, APPLIANCE_MIN_PITCH, APPLIANCE_MAX_PITCH);
		this.velocityX = 0;
		this.velocityY = 0;
		this.updateCamera();
	}
	setRadius(radius) {
		this.radius = MathUtils.clamp(radius, 12.2, 34);
		this.updateCamera();
	}
	setEnabled(enabled) {
		this.enabled = enabled;
		if (!enabled) this.clearTouches();
		if (enabled || this.pointerId === null) return;
		this.pointerId = null;
		this.moved = false;
		this.velocityX = 0;
		this.velocityY = 0;
		this.canvas.classList.remove("dragging");
	}
	setClickOnly(clickOnly) {
		this.clickOnly = clickOnly;
		if (clickOnly) this.clearTouches();
		if (!clickOnly || this.pointerId === null) return;
		this.pointerId = null;
		this.moved = false;
		this.velocityX = 0;
		this.velocityY = 0;
		this.canvas.classList.remove("dragging");
	}
	dispose() {
		this.clearTouches();
		window.removeEventListener("blur", this.clearTouches);
		window.clearTimeout(this.viewSettleTimer);
		this.canvas.removeEventListener("pointerdown", this.onPointerDown);
		this.canvas.removeEventListener("pointermove", this.onPointerMove);
		this.canvas.removeEventListener("pointerup", this.onPointerUp);
		this.canvas.removeEventListener("pointercancel", this.onPointerCancel);
		this.canvas.removeEventListener("pointerleave", this.onPointerLeave);
		this.canvas.removeEventListener("click", this.onClick);
		this.canvas.removeEventListener("wheel", this.onWheel);
	}
	onPointerDown = (event) => {
		if (event.pointerType === "touch" && this.enabled && !this.clickOnly) {
			this.touches.set(event.pointerId, new Vector2(event.clientX, event.clientY));
			if (this.touches.size > 1) {
				event.preventDefault();
				this.pinching = true;
				this.suppressClick = true;
				this.velocityX = this.velocityY = 0;
				const points = [...this.touches.values()];
				this.pinchDistance = points[0].distanceTo(points[1]);
				this.pinchCenter.copy(points[0]).add(points[1]).multiplyScalar(.5);
				this.canvas.setPointerCapture(event.pointerId);
				return;
			}
			this.suppressClick = false;
		}
		if (!this.enabled || this.clickOnly || event.button !== 0 || this.pointerId !== null) return;
		this.suppressClick = false;
		event.preventDefault();
		this.pointerId = event.pointerId;
		this.startX = this.previousX = event.clientX;
		this.startY = this.previousY = event.clientY;
		this.moved = false;
		this.velocityX = 0;
		this.velocityY = 0;
		window.clearTimeout(this.viewSettleTimer);
		this.canvas.classList.add("dragging");
		try {
			this.canvas.setPointerCapture(event.pointerId);
		} catch {}
	};
	onPointerMove = (event) => {
		if (!this.enabled || this.clickOnly) return;
		if (this.touches.has(event.pointerId)) {
			this.touches.get(event.pointerId).set(event.clientX, event.clientY);
			if (this.pinching) {
				event.preventDefault();
				if (this.touches.size >= 2) {
					const points = [...this.touches.values()];
					const distance = points[0].distanceTo(points[1]);
					if (distance > 0 && this.pinchDistance > 0) this.setRadius(this.radius * this.pinchDistance / distance);
					this.pinchDistance = distance;
					if (this.touchLantern) {
						const center = points[0].clone().add(points[1]).multiplyScalar(.5);
						this.yaw -= (center.x - this.pinchCenter.x) * .0063 * horizontalOrbitInputSign(this.pitch);
						this.applyPitchDelta((center.y - this.pinchCenter.y) * .0063);
						this.pinchCenter.copy(center);
					}
				}
				return;
			}
		}
		if (this.pointerId !== event.pointerId) {
			this.callbacks.onHover(event.clientX, event.clientY);
			return;
		}
		event.preventDefault();
		const deltaX = event.clientX - this.previousX;
		const deltaY = event.clientY - this.previousY;
		this.previousX = event.clientX;
		this.previousY = event.clientY;
		if (Math.hypot(event.clientX - this.startX, event.clientY - this.startY) > 5) this.moved = true;
		if (!this.moved) return;
		if (this.touchLantern && event.pointerType === "touch") return;
		const sensitivity = .0063;
		const horizontalSign = horizontalOrbitInputSign(this.pitch);
		this.yaw -= deltaX * sensitivity * horizontalSign;
		this.applyPitchDelta(deltaY * sensitivity);
		this.velocityX = -deltaX * .2;
		this.velocityY = deltaY * .2;
	};
	onPointerUp = (event) => {
		this.touches.delete(event.pointerId);
		if (this.pinching) {
			event.preventDefault();
			if (this.canvas.hasPointerCapture(event.pointerId)) this.canvas.releasePointerCapture(event.pointerId);
			if (this.touches.size === 0) {
				this.clearTouches();
				this.callbacks.onViewChanged();
			}
			return;
		}
		if (event.pointerId !== this.pointerId) return;
		event.preventDefault();
		this.suppressClick = this.moved;
		this.pointerId = null;
		this.canvas.classList.remove("dragging");
		try {
			this.canvas.releasePointerCapture(event.pointerId);
		} catch {}
		if (event.pointerType === "touch" && !this.moved) this.callbacks.onClick(event.clientX, event.clientY, true);
		if (this.moved) {
			this.updateCamera();
			this.callbacks.onViewChanged();
			this.callbacks.onHover(event.clientX, event.clientY);
			this.scheduleSettledViewChanged();
		}
	};
	onPointerCancel = (event) => {
		if (this.touches.has(event.pointerId)) this.clearTouches();
		if (event.pointerId !== this.pointerId) return;
		this.pointerId = null;
		this.moved = false;
		this.canvas.classList.remove("dragging");
	};
	onPointerLeave = () => {
		if (this.pointerId === null) this.callbacks.onLeave();
	};
	clearTouches = () => {
		for (const pointerId of this.touches.keys()) if (this.canvas.hasPointerCapture(pointerId)) this.canvas.releasePointerCapture(pointerId);
		this.touches.clear();
		this.pinching = false;
		this.pinchDistance = 0;
		this.pointerId = null;
		this.velocityX = this.velocityY = 0;
		this.suppressClick = true;
		this.canvas.classList.remove("dragging");
	};
	onClick = (event) => {
		if (!this.enabled) return;
		if (!this.clickOnly && event.pointerType === "touch") return;
		if (this.suppressClick) {
			this.suppressClick = false;
			return;
		}
		this.callbacks.onClick(event.clientX, event.clientY, event.pointerType === "touch");
	};
	onWheel = (event) => {
		if (!this.enabled || this.clickOnly) return;
		event.preventDefault();
		this.radius = MathUtils.clamp(this.radius + event.deltaY * .011, 12.2, 34);
		this.updateCamera();
		this.scheduleSettledViewChanged();
	};
	scheduleSettledViewChanged() {
		window.clearTimeout(this.viewSettleTimer);
		this.viewSettleTimer = window.setTimeout(() => {
			this.velocityX = 0;
			this.velocityY = 0;
			this.updateCamera();
			this.callbacks.onViewChanged();
		}, VIEW_SETTLE_DELAY_MS);
	}
	applyPitchDelta(delta) {
		this.pitch += delta;
		this.appliancePitch = MathUtils.clamp(this.appliancePitch + delta, APPLIANCE_MIN_PITCH, APPLIANCE_MAX_PITCH);
	}
	updateCamera() {
		const horizontal = Math.cos(this.pitch) * this.radius;
		this.camera.position.set(Math.sin(this.yaw) * horizontal, Math.sin(this.pitch) * this.radius, Math.cos(this.yaw) * horizontal);
		this.camera.up.set(-Math.sin(this.yaw) * Math.sin(this.pitch), Math.cos(this.pitch), -Math.cos(this.yaw) * Math.sin(this.pitch));
		this.camera.lookAt(this.target);
	}
};
//#endregion
//#region src/systems/OpeningScene.ts
var TRANSITION_DURATION = .9;
var UP = new Vector3(0, 1, 0);
var FORWARD = new Vector3(0, 0, 1);
var BUNDLE_VISUAL_RADIUS = 3.15;
var BUNDLE_BASE_SCALE = .88;
var OPENING_PETAL_COUNT = 22;
var PETAL_SPRING = 8.2;
var JELLY_SPRING = 45;
var OPENING_CABLES = [
	{
		id: "opening-red",
		color: PAL.red,
		lengthClass: "long",
		exitDirection: "-Z",
		path: [
			[
				7,
				6,
				6
			],
			[
				6,
				6,
				6
			],
			[
				6,
				3,
				6
			],
			[
				3,
				3,
				6
			],
			[
				3,
				3,
				3
			]
		]
	},
	{
		id: "opening-yellow",
		color: PAL.yellow,
		lengthClass: "long",
		exitDirection: "+X",
		path: [
			[
				7,
				7,
				6
			],
			[
				5,
				7,
				6
			],
			[
				5,
				4,
				6
			],
			[
				3,
				4,
				6
			],
			[
				3,
				4,
				4
			],
			[
				4,
				4,
				4
			]
		]
	},
	{
		id: "opening-teal",
		color: PAL.teal,
		lengthClass: "long",
		exitDirection: "+Y",
		path: [
			[
				4,
				6,
				6
			],
			[
				4,
				6,
				3
			],
			[
				4,
				3,
				3
			],
			[
				4,
				3,
				4
			],
			[
				7,
				3,
				4
			],
			[
				7,
				5,
				4
			]
		]
	},
	{
		id: "opening-blue",
		color: PAL.blue,
		lengthClass: "medium",
		exitDirection: "-X",
		path: [
			[
				5,
				6,
				5
			],
			[
				7,
				6,
				5
			],
			[
				7,
				7,
				5
			],
			[
				7,
				7,
				4
			],
			[
				6,
				7,
				4
			]
		]
	},
	{
		id: "opening-purple",
		color: PAL.purple,
		lengthClass: "long",
		exitDirection: "-Y",
		path: [
			[
				3,
				7,
				6
			],
			[
				4,
				7,
				6
			],
			[
				4,
				7,
				3
			],
			[
				6,
				7,
				3
			],
			[
				6,
				5,
				3
			]
		]
	}
];
var OpeningScene = class {
	root = new Group();
	bundleMotion = new Group();
	bundleJelly = new Group();
	bundle = new Group();
	socket = new Group();
	cables = [];
	petals = [];
	springPetalMaterials = [createSakuraPetalMaterial(PAL.petal, .82), createSakuraPetalMaterial(PAL.petalDeep, .76)];
	summerLeafMaterial = createSeasonParticleMaterial(8695185, 0);
	autumnLeafMaterial = createSeasonParticleMaterial(16777215, 0, false, true);
	winterSnowMaterial = createSeasonParticleMaterial(16777215, 0);
	fireflyMaterial = createSeasonParticleMaterial(16767082, 0, true);
	seasonWeights = {
		spring: 1,
		summer: 0,
		autumn: 0,
		winter: 0
	};
	activeSeason = "spring";
	seasonInitialized = false;
	heroPlug;
	socketNormal = new Vector3();
	plugStart = new Vector3();
	plugApproach = new Vector3();
	plugContact = new Vector3();
	plugStartQuaternion = new Quaternion();
	plugContactQuaternion = new Quaternion();
	cameraRight = new Vector3();
	cameraUp = new Vector3();
	plugDirection = new Vector3();
	bundleScreenPosition = new Vector2(.69, .46);
	bundleScreenVelocity = new Vector2(.044, .029);
	bundleRotationVelocity = new Vector3(.11, .17, .075);
	projectedBundlePosition = new Vector3();
	previousBundlePosition = new Vector3();
	bundleLocalVelocity = new Vector3();
	impactVelocity = new Vector3();
	petalTarget = new Vector3();
	petalForce = new Vector3();
	petalRadial = new Vector3();
	jellyVelocity = new Vector3();
	rootStartPosition = new Vector3(1.12, .34, 0);
	jellyTilt = 0;
	jellyTiltVelocity = 0;
	impactCount = 0;
	petalMotion = 0;
	petalsInitialized = false;
	progress = .03;
	targetProgress = .03;
	transitionStarted = false;
	transitionElapsed = 0;
	burstTriggered = false;
	finished = false;
	preparePromise = null;
	disposed = false;
	constructor() {
		this.root.name = "opening-scene";
		this.root.position.copy(this.rootStartPosition);
		this.bundleMotion.name = "opening-bundle-motion";
		this.bundleJelly.name = "opening-bundle-jelly";
		this.bundle.name = "opening-cable-bundle";
		this.bundle.scale.setScalar(BUNDLE_BASE_SCALE);
		this.bundleMotion.add(this.bundleJelly);
		this.bundleJelly.add(this.bundle);
		this.root.add(this.bundleMotion);
		this.buildSocket();
		this.heroPlug = createPlugHead(PAL.blossomDeep, 1.55, false, "flat-two-blade");
		this.heroPlug.root.name = "opening-hero-plug";
		this.root.add(this.heroPlug.root);
		this.buildPetals();
	}
	prepareAsync(onProgress) {
		if (this.preparePromise) return this.preparePromise;
		this.preparePromise = (async () => {
			const buildBudget = new CooperativeYieldBudget();
			for (let index = 0; index < OPENING_CABLES.length; index += 1) {
				if (this.disposed) return;
				const startedAt = performance.now();
				this.buildCable(index);
				onProgress?.((index + 1) / OPENING_CABLES.length, performance.now() - startedAt);
				await buildBudget.afterItem();
			}
		})();
		return this.preparePromise;
	}
	get transitionComplete() {
		return this.finished;
	}
	getSocketWorldPosition(target = new Vector3()) {
		this.root.updateWorldMatrix(true, true);
		return this.socket.getWorldPosition(target);
	}
	getBundleWorldPosition(target = new Vector3()) {
		this.bundleMotion.updateWorldMatrix(true, false);
		return this.bundleMotion.getWorldPosition(target);
	}
	getStateSummary() {
		return {
			screenX: this.bundleScreenPosition.x,
			screenY: this.bundleScreenPosition.y,
			trailLength: this.petals.length,
			petalMotion: this.petalMotion,
			impactCount: this.impactCount,
			seasonWeights: { ...this.seasonWeights },
			visibleSeasonLayers: SEASON_MODES.filter((mode) => this.petals.some((petal) => petal.season === mode)),
			summerFirefliesVisible: this.fireflyMaterial.opacity > .002,
			jellyScale: [
				this.bundleJelly.scale.x,
				this.bundleJelly.scale.y,
				this.bundleJelly.scale.z
			]
		};
	}
	setProgress(progress) {
		this.targetProgress = Math.max(this.targetProgress, Math.min(1, progress));
	}
	setSeasonState(weights, themeProgress) {
		for (const mode of SEASON_MODES) this.seasonWeights[mode] = weights[mode];
		this.activeSeason = SEASON_MODES.reduce((best, mode) => weights[mode] > weights[best] ? mode : best, SEASON_MODES[0]);
		if (!this.seasonInitialized) {
			this.petals.forEach((petal) => {
				petal.season = this.activeSeason;
			});
			this.seasonInitialized = true;
		}
		const night = MathUtils.clamp(themeProgress, 0, 1);
		this.springPetalMaterials[0].opacity = .82;
		this.springPetalMaterials[1].opacity = .76;
		this.summerLeafMaterial.opacity = .78 * MathUtils.lerp(1, .35, night);
		this.autumnLeafMaterial.opacity = .84;
		this.winterSnowMaterial.opacity = 1;
		this.fireflyMaterial.opacity = 0;
		this.petals.forEach((petal) => {
			for (const mode of SEASON_MODES) petal.visuals[mode].visible = petal.season === mode;
			petal.firefly.visible = false;
		});
	}
	beginTransition() {
		if (this.transitionStarted) return;
		this.transitionStarted = true;
		this.transitionElapsed = 0;
	}
	reset() {
		this.root.visible = true;
		this.root.position.copy(this.rootStartPosition);
		this.root.scale.setScalar(1);
		this.transitionStarted = false;
		this.transitionElapsed = 0;
		this.burstTriggered = false;
		this.finished = false;
		this.bundleJelly.scale.set(1, 1, 1);
		this.bundleJelly.rotation.set(0, 0, 0);
		this.jellyVelocity.set(0, 0, 0);
		this.jellyTilt = 0;
		this.jellyTiltVelocity = 0;
		this.impactCount = 0;
		this.petalMotion = 0;
		this.petalsInitialized = false;
		this.petals.forEach((petal) => {
			petal.mesh.position.copy(petal.anchor);
			petal.velocity.set(0, 0, 0);
			petal.burstVelocity.set(0, 0, 0);
			petal.season = this.activeSeason;
			petal.fallCycle = NaN;
			for (const mode of SEASON_MODES) petal.visuals[mode].visible = mode === petal.season;
			petal.firefly.visible = false;
		});
	}
	update(delta, elapsed, camera, transitionDelta = delta) {
		this.progress = MathUtils.damp(this.progress, this.targetProgress, 5.5, delta);
		this.updateBundleMotion(delta, camera);
		this.updateBundleJelly(delta);
		this.updateSocketAndHeroPlug(camera);
		this.cables.forEach((entry, index) => {
			const reveal = MathUtils.smoothstep(this.progress, entry.threshold, entry.threshold + .19);
			const pulse = 1 + Math.sin(elapsed * 2 + index * .8) * .008 * reveal;
			entry.model.root.visible = reveal > .002;
			entry.model.root.scale.setScalar(Math.max(.001, reveal * pulse));
		});
		this.updatePetals(delta, elapsed);
		if (!this.transitionStarted) {
			const idle = Math.sin(elapsed * 1.55) * .025;
			this.heroPlug.root.position.copy(this.plugStart).addScaledVector(UP, idle);
			return;
		}
		this.transitionElapsed += transitionDelta;
		const transition = Math.min(1, this.transitionElapsed / TRANSITION_DURATION);
		const insert = 1 - (1 - transition) ** 3;
		const inverse = 1 - insert;
		this.heroPlug.root.position.copy(this.plugStart).multiplyScalar(inverse * inverse).addScaledVector(this.plugApproach, 2 * inverse * insert).addScaledVector(this.plugContact, insert * insert);
		this.heroPlug.root.quaternion.slerpQuaternions(this.plugStartQuaternion, this.plugContactQuaternion, MathUtils.smoothstep(insert, .18, .88));
		if (transition > .56 && !this.burstTriggered) {
			this.burstTriggered = true;
			const burstOrigin = this.socket.position.clone().addScaledVector(this.socketNormal, .22);
			this.petals.forEach((petal, index) => {
				const angle = index / this.petals.length * Math.PI * 2;
				petal.mesh.position.copy(burstOrigin);
				petal.burstVelocity.set(Math.cos(angle) * (1.8 + index % 3 * .24), 1.3 + index % 4 * .35, Math.sin(angle) * (1.8 + index % 2 * .3));
			});
		}
		if (transition >= 1) this.finished = true;
	}
	dispose() {
		this.disposed = true;
		this.cables.forEach((entry) => entry.model.dispose());
		this.heroPlug.dispose();
		this.root.traverse((object) => {
			if (!(object instanceof Mesh)) return;
			object.geometry.dispose();
			(Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => material.dispose());
		});
		this.root.removeFromParent();
	}
	buildCable(index) {
		const plugStyles = [
			"round-two-pin",
			"usb-c",
			"three-pin",
			"dc-barrel",
			"grounded-round"
		];
		const definition = OPENING_CABLES[index];
		const model = new PlugCableModel(definition, plugStyles[index]);
		model.root.visible = false;
		model.root.scale.setScalar(.001);
		this.bundle.add(model.root);
		this.cables.push({
			model,
			threshold: .08 + index * .12
		});
	}
	buildSocket() {
		const panel = new Mesh(new RoundedBoxGeometry(1.25, 1.62, .28, 3, .15), cel({
			color: PAL.paper,
			bands: 3,
			tint: PAL.platformShade
		}));
		panel.name = "opening-socket-panel";
		panel.castShadow = true;
		addHullOutline(panel, .006);
		this.socket.add(panel);
		const inset = new Mesh(new RoundedBoxGeometry(.92, 1.22, .13, 3, .13), cel({
			color: PAL.blossomLight,
			bands: 3,
			tint: PAL.blossomDeep
		}));
		inset.name = "opening-socket-face";
		inset.position.z = .185;
		addHullOutline(inset, .0045);
		this.socket.add(inset);
		const slotMaterial = cel({
			color: PAL.ink,
			bands: 2,
			tint: PAL.inkSoft
		});
		for (const x of [-.18, .18]) {
			const slot = new Mesh(new RoundedBoxGeometry(.095, .34, .07, 2, .035), slotMaterial);
			slot.position.set(x, .1, .29);
			this.socket.add(slot);
		}
		const earth = new Mesh(new CylinderGeometry(.085, .085, .07, 14), slotMaterial);
		earth.rotation.x = Math.PI * .5;
		earth.position.set(0, -.34, .29);
		this.socket.add(earth);
		this.socket.position.set(3.35, .38, 1.32);
		this.socket.scale.setScalar(.72);
		this.root.add(this.socket);
	}
	updateBundleMotion(delta, camera) {
		const distance = Math.max(1, camera.position.length() - 2.2);
		const halfViewHeight = Math.tan(MathUtils.degToRad(camera.fov * .5)) * distance;
		const radiusY = MathUtils.clamp(BUNDLE_VISUAL_RADIUS / (halfViewHeight * 2), .13, .24);
		const radiusX = MathUtils.clamp(radiusY / Math.max(.8, camera.aspect), .075, .2);
		const bounds = {
			minX: Math.max(.035, radiusX * .78),
			maxX: Math.min(.965, 1 - radiusX * .78),
			minY: Math.max(.045, radiusY * .76),
			maxY: Math.min(.955, 1 - radiusY * .76)
		};
		this.impactVelocity.copy(this.bundleLocalVelocity);
		if (!this.transitionStarted) {
			this.bundleScreenPosition.addScaledVector(this.bundleScreenVelocity, delta);
			let bouncedX = false;
			let bouncedY = false;
			if (this.bundleScreenPosition.x <= bounds.minX || this.bundleScreenPosition.x >= bounds.maxX) {
				this.bundleScreenPosition.x = MathUtils.clamp(this.bundleScreenPosition.x, bounds.minX, bounds.maxX);
				this.bundleScreenVelocity.x *= -1;
				bouncedX = true;
			}
			if (this.bundleScreenPosition.y <= bounds.minY || this.bundleScreenPosition.y >= bounds.maxY) {
				this.bundleScreenPosition.y = MathUtils.clamp(this.bundleScreenPosition.y, bounds.minY, bounds.maxY);
				this.bundleScreenVelocity.y *= -1;
				bouncedY = true;
			}
			if (bouncedX || bouncedY) {
				this.bundleRotationVelocity.x *= -.96;
				this.bundleRotationVelocity.z += this.bundleScreenVelocity.x * .28;
				this.bundleScreenVelocity.x *= .92;
				this.bundleScreenVelocity.y *= .92;
				this.triggerBundleImpact(bouncedX, bouncedY);
			}
			const cruiseX = Math.sign(this.bundleScreenVelocity.x || 1) * .044;
			const cruiseY = Math.sign(this.bundleScreenVelocity.y || 1) * .029;
			this.bundleScreenVelocity.x = MathUtils.damp(this.bundleScreenVelocity.x, cruiseX, 1.45, delta);
			this.bundleScreenVelocity.y = MathUtils.damp(this.bundleScreenVelocity.y, cruiseY, 1.45, delta);
		}
		this.bundle.rotation.x += this.bundleRotationVelocity.x * delta;
		this.bundle.rotation.y += this.bundleRotationVelocity.y * delta;
		this.bundle.rotation.z += this.bundleRotationVelocity.z * delta;
		camera.updateMatrixWorld(true);
		this.projectedBundlePosition.set(this.bundleScreenPosition.x * 2 - 1, 1 - this.bundleScreenPosition.y * 2, 0).unproject(camera).sub(camera.position).normalize().multiplyScalar(Math.max(8, camera.position.length() - 2.2)).add(camera.position);
		this.root.updateWorldMatrix(true, false);
		this.root.worldToLocal(this.projectedBundlePosition);
		if (this.petalsInitialized) this.bundleLocalVelocity.copy(this.projectedBundlePosition).sub(this.previousBundlePosition).multiplyScalar(1 / Math.max(delta, 1 / 240));
		else this.bundleLocalVelocity.set(0, 0, 0);
		this.previousBundlePosition.copy(this.projectedBundlePosition);
		this.bundleMotion.position.copy(this.projectedBundlePosition);
	}
	triggerBundleImpact(bouncedX, bouncedY) {
		this.impactCount += 1;
		const driftSpeed = Math.hypot(this.bundleScreenVelocity.x, this.bundleScreenVelocity.y);
		const contactSpeed = MathUtils.clamp(driftSpeed * 9, .38, .62);
		if (bouncedX) {
			this.jellyVelocity.x -= contactSpeed;
			this.jellyVelocity.y += contactSpeed * .26;
			this.jellyVelocity.z += contactSpeed * .16;
			this.jellyTiltVelocity += Math.sign(this.bundleScreenVelocity.y || 1) * contactSpeed * .5;
		}
		if (bouncedY) {
			this.jellyVelocity.y -= contactSpeed;
			this.jellyVelocity.x += contactSpeed * .26;
			this.jellyVelocity.z += contactSpeed * .16;
			this.jellyTiltVelocity -= Math.sign(this.bundleScreenVelocity.x || 1) * contactSpeed * .5;
		}
		this.petals.forEach((petal, index) => {
			petal.velocity.addScaledVector(this.impactVelocity, .16 + index % 5 * .022);
		});
	}
	updateBundleJelly(delta) {
		for (const axis of [
			"x",
			"y",
			"z"
		]) {
			this.jellyVelocity[axis] += (1 - this.bundleJelly.scale[axis]) * JELLY_SPRING * delta;
			this.jellyVelocity[axis] *= Math.exp(-7.6 * delta);
			this.bundleJelly.scale[axis] = MathUtils.clamp(this.bundleJelly.scale[axis] + this.jellyVelocity[axis] * delta, .76, 1.14);
		}
		this.jellyTiltVelocity += -this.jellyTilt * 45 * delta;
		this.jellyTiltVelocity *= Math.exp(-8.2 * delta);
		this.jellyTilt += this.jellyTiltVelocity * delta;
		this.bundleJelly.rotation.z = this.jellyTilt;
	}
	updateSocketAndHeroPlug(camera) {
		this.socket.position.x = camera.aspect < .8 ? .2 : 3.35;
		this.socket.position.y = camera.aspect < .8 ? -2.12 : .38;
		this.socket.lookAt(camera.position);
		this.socket.rotateY(-.46);
		this.socketNormal.copy(FORWARD).applyQuaternion(this.socket.quaternion).normalize();
		this.cameraRight.set(1, 0, 0).applyQuaternion(camera.quaternion);
		this.cameraUp.set(0, 1, 0).applyQuaternion(camera.quaternion);
		this.plugContact.copy(this.socket.position).addScaledVector(this.socketNormal, 1.08);
		this.plugApproach.copy(this.socket.position).addScaledVector(this.socketNormal, 1.58).addScaledVector(this.cameraRight, -.12);
		this.plugStart.copy(this.socket.position).addScaledVector(this.socketNormal, 2.08).addScaledVector(this.cameraRight, -.92).addScaledVector(this.cameraUp, .18);
		this.plugDirection.copy(this.plugContact).sub(this.plugStart).normalize();
		this.plugStartQuaternion.setFromUnitVectors(UP, this.plugDirection);
		this.plugContactQuaternion.setFromUnitVectors(UP, this.socketNormal.clone().negate());
		if (!this.transitionStarted) this.heroPlug.root.quaternion.copy(this.plugStartQuaternion);
	}
	buildPetals() {
		const geometries = {
			spring: createSakuraPetalGeometry(1.22),
			summer: createSummerLeafGeometry(1.18),
			autumn: createAutumnLeafGeometry(1.16),
			winter: createWinterSnowGeometry(1.15),
			firefly: createFireflyGeometry(1.18)
		};
		for (let index = 0; index < OPENING_PETAL_COUNT; index += 1) {
			const angle = index / OPENING_PETAL_COUNT * Math.PI * 2 + Math.sin(index * 2.17) * .19;
			const phase = index * .73;
			const beltRadius = 2.72 + Math.sin(index * 1.91) * .38;
			const anchor = new Vector3(Math.cos(angle) * beltRadius, Math.sin(angle * 2 + .45) * .78 + Math.sin(index * .91) * .32, Math.sin(angle) * (1.7 + Math.cos(index * 1.37) * .22));
			const mesh = new Group();
			mesh.name = "opening-season-particle";
			const visuals = {
				spring: new Mesh(geometries.spring, this.springPetalMaterials[index % this.springPetalMaterials.length]),
				summer: new Mesh(geometries.summer, this.summerLeafMaterial),
				autumn: new Mesh(geometries.autumn, this.autumnLeafMaterial),
				winter: new Mesh(geometries.winter, this.winterSnowMaterial)
			};
			const firefly = new Mesh(geometries.firefly, this.fireflyMaterial);
			firefly.position.set(.08, .06, .015);
			firefly.scale.setScalar(.8 + index % 4 * .1);
			for (const mode of SEASON_MODES) {
				visuals[mode].name = `opening-${mode}-particle`;
				visuals[mode].visible = this.seasonWeights[mode] > .002;
				mesh.add(visuals[mode]);
			}
			visuals.summer.scale.set(.72 + index % 3 * .055, .9 + index % 4 * .025, 1);
			visuals.autumn.scale.set(.76 + index % 4 * .045, .75 + index % 5 * .035, 1);
			visuals.winter.scale.set(.94 + index % 4 * .06, .94 + index % 3 * .055, 1);
			firefly.name = "opening-summer-night-firefly";
			firefly.visible = false;
			mesh.add(firefly);
			mesh.position.copy(anchor);
			mesh.rotation.set(phase * .4, phase * .7, phase);
			this.root.add(mesh);
			this.petals.push({
				mesh,
				visuals,
				firefly,
				season: this.activeSeason,
				anchor,
				velocity: new Vector3(),
				phase,
				size: .78 + index % 7 * .055,
				burstVelocity: new Vector3(),
				fallCycle: NaN
			});
		}
	}
	updatePetals(delta, elapsed) {
		let motion = 0;
		for (let index = 0; index < this.petals.length; index += 1) {
			const petal = this.petals[index];
			if (petal.burstVelocity.lengthSq() > .001) {
				petal.burstVelocity.y -= delta * 2.1;
				petal.mesh.position.addScaledVector(petal.burstVelocity, delta);
				petal.mesh.rotation.x += delta * 7;
				petal.mesh.rotation.z += delta * 5;
				motion += petal.burstVelocity.length();
				continue;
			}
			const orbit = elapsed * .2 + Math.sin(elapsed * .31 + petal.phase) * .08;
			const breathe = 1 + Math.sin(elapsed * .82 + petal.phase) * .045;
			const fallCycle = (elapsed * (.09 + index % 5 * .011) + petal.phase) % 1 - .5;
			const lateralSway = Math.sin(elapsed * (.72 + index % 4 * .13) + petal.phase) * .24;
			this.petalTarget.copy(petal.anchor).multiplyScalar(breathe).applyAxisAngle(UP, orbit).applyAxisAngle(FORWARD, Math.sin(elapsed * .24 + petal.phase) * .09).add(this.bundleMotion.position).addScaledVector(UP, fallCycle * .62).addScaledVector(this.petalRadial.set(Math.cos(petal.phase), 0, Math.sin(petal.phase)), lateralSway);
			const fallRate = .09 + index % 5 * .011;
			const fallCycleIndex = Math.floor(elapsed * fallRate + petal.phase);
			if (!Number.isFinite(petal.fallCycle)) petal.fallCycle = fallCycleIndex;
			else if (fallCycleIndex !== petal.fallCycle) {
				petal.fallCycle = fallCycleIndex;
				petal.season = this.activeSeason;
				for (const mode of SEASON_MODES) petal.visuals[mode].visible = mode === petal.season;
				petal.firefly.visible = false;
			}
			if (!this.petalsInitialized) {
				petal.mesh.position.copy(this.petalTarget);
				petal.velocity.copy(this.bundleLocalVelocity);
			}
			this.petalForce.copy(this.petalTarget).sub(petal.mesh.position).multiplyScalar(PETAL_SPRING).addScaledVector(petal.velocity, -3.55);
			this.petalRadial.copy(petal.mesh.position).sub(this.bundleMotion.position);
			const shellDistance = this.petalRadial.length();
			if (shellDistance < 2.15 && shellDistance > .001) this.petalForce.addScaledVector(this.petalRadial, (2.15 - shellDistance) * 2.8 / shellDistance);
			else if (shellDistance > 4.1) this.petalForce.addScaledVector(this.petalRadial, -(shellDistance - 4.1) * 3.2 / shellDistance);
			petal.velocity.addScaledVector(this.petalForce, delta);
			petal.mesh.position.addScaledVector(petal.velocity, delta);
			motion += petal.velocity.length();
			const pulseScale = petal.size * (.92 + Math.sin(elapsed * 1.3 + petal.phase) * .1);
			petal.mesh.scale.setScalar(pulseScale);
			petal.mesh.rotation.x += delta * (.7 + index % 4 * .16);
			petal.mesh.rotation.y += delta * (.45 + index % 5 * .12);
			petal.mesh.rotation.z += delta * (.32 + index % 3 * .15);
		}
		this.petalsInitialized = true;
		this.petalMotion = motion / Math.max(1, this.petals.length);
	}
};
//#endregion
//#region src/systems/StartScreen.ts
var StartScreen = class {
	element = this.getElement("#start-screen");
	startButton = this.getElement("#start-game-button");
	challengeButton = this.getElement("#challenge-mode-button");
	challengeMenu = this.getElement("#challenge-mode-menu");
	randomButton = this.getElement("#start-random-button");
	exploreButton = this.getElement("#start-explore-button");
	rushButton = this.getElement("#start-rush-button");
	doubleEndedButton = this.getElement("#start-double-ended-button");
	skillButton = this.getElement("#start-skill-button");
	status = this.getElement("#start-loading-status");
	percent = this.getElement("#start-loading-percent");
	progressBar = this.getElement(".start-progress");
	objectState = this.getElement("#start-object-state");
	onStart;
	onRandom;
	onExplore;
	onRush;
	onDoubleEnded;
	onSkill;
	onProgress;
	animationFrame = 0;
	lastFrameAt = 0;
	displayedProgress = .03;
	progressFloor = .03;
	progressCeiling = .12;
	ready = false;
	startRequested = false;
	leaving = false;
	exitTimer = 0;
	statusKey = "start.loading.initial";
	statusParams = {};
	statusError = null;
	constructor(options) {
		this.onStart = options.onStart;
		this.onRandom = options.onRandom;
		this.onExplore = options.onExplore;
		this.onRush = options.onRush;
		this.onDoubleEnded = options.onDoubleEnded;
		this.onSkill = options.onSkill;
		this.onProgress = options.onProgress;
		this.startButton.addEventListener("click", this.handleStart);
		this.challengeButton.addEventListener("click", this.toggleChallengeMenu);
		this.randomButton.addEventListener("click", this.handleRandom);
		this.exploreButton.addEventListener("click", this.handleExplore);
		this.rushButton.addEventListener("click", this.handleRush);
		this.doubleEndedButton.addEventListener("click", this.handleDoubleEnded);
		this.skillButton.addEventListener("click", this.handleSkill);
		document.addEventListener("pointerdown", this.handleOutsidePointer);
		document.addEventListener("keydown", this.handleKeyDown);
		document.documentElement.classList.add("opening-active");
		this.refreshLocale();
		this.writeProgress();
		this.animationFrame = requestAnimationFrame(this.updateProgress);
	}
	get active() {
		return !this.element.hidden && !this.element.classList.contains("finished");
	}
	get progress() {
		return this.displayedProgress;
	}
	setStage(messageKey, floor, ceiling, params = {}) {
		if (this.ready) return;
		this.statusKey = messageKey;
		this.statusParams = params;
		this.statusError = null;
		this.status.textContent = t(messageKey, params);
		this.progressFloor = Math.max(this.progressFloor, Math.min(.98, floor));
		this.progressCeiling = Math.max(this.progressFloor, Math.min(.98, ceiling));
		this.displayedProgress = Math.max(this.displayedProgress, this.progressFloor);
		this.writeProgress();
	}
	setExactProgress(messageKey, progress, params = {}) {
		if (this.ready) return;
		this.statusKey = messageKey;
		this.statusParams = params;
		this.statusError = null;
		this.status.textContent = t(messageKey, params);
		const clamped = Math.max(this.displayedProgress, Math.min(.98, progress));
		this.progressFloor = clamped;
		this.progressCeiling = Math.max(this.progressCeiling, clamped);
		this.displayedProgress = clamped;
		this.writeProgress();
	}
	markReady() {
		if (this.ready) return;
		this.ready = true;
		this.displayedProgress = 1;
		this.progressFloor = 1;
		this.progressCeiling = 1;
		this.statusKey = "start.ready";
		this.statusParams = {};
		this.statusError = null;
		this.status.textContent = t(this.statusKey);
		this.objectState.textContent = "READY";
		this.startButton.disabled = false;
		this.challengeButton.disabled = false;
		this.randomButton.disabled = false;
		this.exploreButton.disabled = false;
		this.rushButton.disabled = false;
		this.doubleEndedButton.disabled = false;
		this.skillButton.disabled = false;
		this.startButton.textContent = t("start.enter");
		this.startButton.classList.add("ready");
		this.element.classList.add("ready");
		this.writeProgress();
		if (this.startRequested) this.beginStart();
	}
	showError(message) {
		this.statusError = message;
		this.status.textContent = message;
		this.startButton.disabled = false;
		this.startButton.textContent = t("start.reload");
		this.startButton.classList.add("error");
	}
	beginExit() {
		if (this.leaving) return;
		this.leaving = true;
		this.startButton.disabled = true;
		this.challengeButton.disabled = true;
		this.randomButton.disabled = true;
		this.exploreButton.disabled = true;
		this.rushButton.disabled = true;
		this.doubleEndedButton.disabled = true;
		this.skillButton.disabled = true;
		this.closeChallengeMenu();
		this.startButton.textContent = t("start.connecting");
		this.element.classList.add("connecting");
	}
	finishExit() {
		this.element.classList.add("finished");
		this.element.setAttribute("aria-hidden", "true");
		document.documentElement.classList.remove("opening-active");
		window.clearTimeout(this.exitTimer);
		this.exitTimer = window.setTimeout(() => {
			this.element.hidden = true;
		}, 760);
	}
	showAgain() {
		this.getElement(".start-loading-copy").hidden = true;
		this.progressBar.hidden = true;
		window.clearTimeout(this.exitTimer);
		this.exitTimer = 0;
		this.leaving = false;
		this.startRequested = false;
		this.element.hidden = false;
		this.element.classList.remove("finished", "connecting", "start-requested");
		this.element.setAttribute("aria-hidden", "false");
		this.startButton.classList.remove("error");
		this.startButton.disabled = !this.ready;
		this.challengeButton.disabled = !this.ready;
		this.randomButton.disabled = !this.ready;
		this.exploreButton.disabled = !this.ready;
		this.rushButton.disabled = !this.ready;
		this.doubleEndedButton.disabled = !this.ready;
		this.skillButton.disabled = !this.ready;
		this.closeChallengeMenu();
		document.documentElement.classList.add("opening-active");
		this.refreshLocale();
	}
	refreshLocale() {
		applyStaticTranslations();
		this.status.textContent = this.statusError ?? t(this.statusKey, this.statusParams);
		if (this.statusError) this.startButton.textContent = t("start.reload");
		else if (this.leaving) this.startButton.textContent = t("start.connecting");
		else if (this.ready) this.startButton.textContent = t("start.enter");
		else if (this.startRequested) this.startButton.textContent = t("start.preparing");
		else this.startButton.textContent = t("start.waiting");
	}
	dispose() {
		this.startButton.removeEventListener("click", this.handleStart);
		this.challengeButton.removeEventListener("click", this.toggleChallengeMenu);
		this.randomButton.removeEventListener("click", this.handleRandom);
		this.exploreButton.removeEventListener("click", this.handleExplore);
		this.rushButton.removeEventListener("click", this.handleRush);
		this.doubleEndedButton.removeEventListener("click", this.handleDoubleEnded);
		this.skillButton.removeEventListener("click", this.handleSkill);
		document.removeEventListener("pointerdown", this.handleOutsidePointer);
		document.removeEventListener("keydown", this.handleKeyDown);
		cancelAnimationFrame(this.animationFrame);
		window.clearTimeout(this.exitTimer);
		document.documentElement.classList.remove("opening-active");
	}
	handleStart = () => {
		if (this.leaving) return;
		if (!this.ready) {
			this.startRequested = true;
			this.startButton.disabled = true;
			this.startButton.textContent = t("start.preparing");
			this.element.classList.add("start-requested");
			return;
		}
		this.beginStart();
	};
	handleRush = () => {
		if (!this.ready || this.leaving) return;
		this.closeChallengeMenu();
		this.onRush();
	};
	handleRandom = () => {
		if (!this.ready || this.leaving) return;
		this.closeChallengeMenu();
		this.onRandom();
	};
	handleExplore = () => {
		if (!this.ready || this.leaving) return;
		this.closeChallengeMenu();
		this.onExplore();
	};
	handleDoubleEnded = () => {
		if (!this.ready || this.leaving) return;
		this.closeChallengeMenu();
		this.onDoubleEnded();
	};
	handleSkill = () => {
		if (!this.ready || this.leaving) return;
		this.closeChallengeMenu();
		this.onSkill();
	};
	toggleChallengeMenu = () => {
		if (!this.ready || this.leaving) return;
		if (this.challengeButton.getAttribute("aria-expanded") === "true") this.closeChallengeMenu();
		else {
			this.challengeButton.setAttribute("aria-expanded", "true");
			this.challengeMenu.setAttribute("aria-hidden", "false");
			this.challengeMenu.classList.add("visible");
			this.randomButton.focus({ preventScroll: true });
		}
	};
	handleOutsidePointer = (event) => {
		if (this.challengeButton.getAttribute("aria-expanded") !== "true") return;
		const target = event.target;
		if (target && (this.challengeMenu.contains(target) || this.challengeButton.contains(target))) return;
		this.closeChallengeMenu();
	};
	handleKeyDown = (event) => {
		if (this.challengeButton.getAttribute("aria-expanded") !== "true") return;
		if (event.key === "Escape") {
			event.preventDefault();
			this.closeChallengeMenu();
			this.challengeButton.focus({ preventScroll: true });
			return;
		}
		if (![
			"ArrowDown",
			"ArrowUp",
			"Home",
			"End"
		].includes(event.key)) return;
		const buttons = Array.from(this.challengeMenu.querySelectorAll("button:not(:disabled)"));
		const currentIndex = buttons.indexOf(document.activeElement);
		if (buttons.length === 0 || currentIndex < 0 && document.activeElement !== this.challengeButton) return;
		event.preventDefault();
		buttons[event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (currentIndex + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length]?.focus();
	};
	closeChallengeMenu() {
		this.challengeButton.setAttribute("aria-expanded", "false");
		this.challengeMenu.setAttribute("aria-hidden", "true");
		this.challengeMenu.classList.remove("visible");
	}
	beginStart() {
		if (this.leaving) return;
		this.onStart();
	}
	updateProgress = (now) => {
		const delta = this.lastFrameAt > 0 ? Math.min(50, now - this.lastFrameAt) : 16;
		this.lastFrameAt = now;
		if (!this.ready && this.displayedProgress < this.progressCeiling) {
			const remaining = this.progressCeiling - this.displayedProgress;
			this.displayedProgress += Math.min(remaining, delta * (18e-6 + remaining * 11e-5));
			this.writeProgress();
		}
		this.animationFrame = requestAnimationFrame(this.updateProgress);
	};
	writeProgress() {
		const clamped = Math.max(0, Math.min(1, this.displayedProgress));
		const rounded = Math.round(clamped * 100);
		this.element.style.setProperty("--start-progress", clamped.toFixed(4));
		this.percent.textContent = `${rounded}%`;
		this.progressBar.setAttribute("aria-valuenow", String(rounded));
		this.onProgress?.(clamped);
	}
	getElement(selector) {
		const element = document.querySelector(selector);
		if (!element) throw new Error(`Missing start-screen element: ${selector}`);
		return element;
	}
};
//#endregion
//#region src/systems/RushModeUi.ts
function capRushTimerScaleToTopQuarter(requestedScale, viewportHeight, timerTop, timerHeight) {
	const safeTimerHeight = Math.max(1, timerHeight);
	const availableHeight = Math.max(safeTimerHeight, viewportHeight * .25 - timerTop);
	return Math.min(2, Math.max(1, requestedScale), availableHeight / safeTimerHeight);
}
function mapRushTimerContentScale(requestedScale) {
	return Math.min(2, Math.max(1, requestedScale));
}
function clamp01$1(value) {
	return Math.min(1, Math.max(0, value));
}
function measureRushVisualPressure(remainingSeconds, timeLimitSeconds) {
	const safeTimeLimit = Math.max(1, timeLimitSeconds);
	const safeRemaining = Math.max(0, remainingSeconds);
	const pressure = clamp01$1(1 - safeRemaining / safeTimeLimit);
	const finalPressure = clamp01$1(1 - safeRemaining / Math.min(12, Math.max(8, safeTimeLimit * .22)));
	const baseScale = Math.min(2, 1 + Math.pow(finalPressure, 1.35));
	return {
		pressure,
		finalPressure,
		baseScale,
		tickScale: Math.min(2, baseScale + .018 + Math.pow(pressure, 1.65) * .122 + finalPressure * .08),
		edgePressure: clamp01$1(Math.pow(pressure, 2.1) * .3 + Math.pow(finalPressure, 1.05) * .82)
	};
}
var RushModeUi = class {
	options;
	timer = this.getElement("#rush-timer");
	timerValue = this.getElement("#rush-timer-value");
	timerState = this.getElement("#rush-timer-state");
	edgeAlert = this.getElement("#rush-edge-alert");
	briefingPanel = this.getElement("#rush-briefing-panel");
	briefingTitle = this.getElement("#rush-briefing-title");
	briefingTime = this.getElement("#rush-briefing-time");
	briefingGoal = this.getElement("#rush-briefing-goal");
	briefingDifficulty = this.getElement("#rush-briefing-difficulty");
	startButton = this.getButton("#rush-start-button");
	briefingHomeButton = this.getButton("#rush-briefing-home-button");
	resultPanel = this.getElement("#rush-result-panel");
	resultEyebrow = this.getElement("#rush-result-eyebrow");
	resultTitle = this.getElement("#rush-result-title");
	resultDescription = this.getElement("#rush-result-description");
	nextButton = this.getButton("#rush-next-button");
	retryButton = this.getButton("#rush-retry-button");
	resultHomeButton = this.getButton("#rush-result-home-button");
	challenge = null;
	result = null;
	lastDisplayedSeconds = null;
	timerScaleCap = 2;
	constructor(options) {
		this.options = options;
		this.startButton.addEventListener("click", options.onStart);
		this.nextButton.addEventListener("click", options.onNext);
		this.retryButton.addEventListener("click", options.onRetry);
		this.briefingHomeButton.addEventListener("click", options.onHome);
		this.resultHomeButton.addEventListener("click", options.onHome);
	}
	showBriefing(challenge) {
		this.challenge = challenge;
		this.result = null;
		document.documentElement.classList.add("rush-active");
		document.documentElement.classList.remove("rush-running");
		this.resultPanel.classList.remove("visible");
		this.resultPanel.setAttribute("aria-hidden", "true");
		this.briefingPanel.classList.add("visible");
		this.briefingPanel.setAttribute("aria-hidden", "false");
		this.timer.classList.add("visible", "waiting");
		this.timer.classList.remove("tick", "warning", "urgent", "critical");
		this.timer.setAttribute("aria-hidden", "false");
		this.edgeAlert.classList.remove("visible", "tick");
		this.lastDisplayedSeconds = null;
		this.setTimer(challenge.timeLimitSeconds);
		this.refreshLocale();
	}
	showRunning() {
		this.briefingPanel.classList.remove("visible");
		this.briefingPanel.setAttribute("aria-hidden", "true");
		this.timer.classList.remove("waiting");
		this.timerState.textContent = t("rush.timer.running");
		document.documentElement.classList.add("rush-running");
		this.edgeAlert.classList.add("visible");
	}
	setTimer(remainingSeconds) {
		const seconds = Math.max(0, Math.ceil(remainingSeconds));
		const minutes = Math.floor(seconds / 60);
		this.timerValue.textContent = `${minutes.toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
		const visual = measureRushVisualPressure(remainingSeconds, Math.max(1, this.challenge?.timeLimitSeconds ?? seconds));
		if (this.lastDisplayedSeconds === null || seconds !== this.lastDisplayedSeconds) this.timerScaleCap = capRushTimerScaleToTopQuarter(2, window.innerHeight, this.timer.offsetTop, this.timer.offsetHeight);
		const baseScale = mapRushTimerContentScale(Math.min(visual.baseScale, this.timerScaleCap));
		const tickScale = mapRushTimerContentScale(Math.min(visual.tickScale, this.timerScaleCap));
		this.timer.style.setProperty("--rush-pressure", visual.pressure.toFixed(4));
		this.timer.style.setProperty("--rush-final-pressure", visual.finalPressure.toFixed(4));
		this.timer.style.setProperty("--rush-final-opacity", (visual.finalPressure * .9).toFixed(4));
		this.timer.style.setProperty("--rush-base-scale", baseScale.toFixed(4));
		this.timer.style.setProperty("--rush-tick-scale", tickScale.toFixed(4));
		this.edgeAlert.style.setProperty("--rush-edge-pressure", visual.edgePressure.toFixed(4));
		this.edgeAlert.style.setProperty("--rush-edge-opacity", (visual.edgePressure * .82).toFixed(4));
		this.timer.classList.toggle("warning", remainingSeconds > 10 && visual.pressure >= .68);
		this.timer.classList.toggle("urgent", remainingSeconds > 0 && remainingSeconds <= 10);
		this.timer.classList.toggle("critical", remainingSeconds > 0 && remainingSeconds <= 5);
		if (!this.timer.classList.contains("waiting") && this.lastDisplayedSeconds !== null && seconds !== this.lastDisplayedSeconds) {
			this.timer.classList.remove("tick");
			this.edgeAlert.classList.remove("tick");
			this.timer.offsetWidth;
			this.timer.classList.add("tick");
			this.edgeAlert.classList.add("tick");
		}
		this.lastDisplayedSeconds = seconds;
	}
	showResult(result) {
		this.result = result;
		this.briefingPanel.classList.remove("visible");
		this.briefingPanel.setAttribute("aria-hidden", "true");
		this.timer.classList.remove("visible", "waiting", "tick", "warning", "urgent", "critical");
		this.timer.setAttribute("aria-hidden", "true");
		this.edgeAlert.classList.remove("visible", "tick");
		document.documentElement.classList.remove("rush-running");
		this.lastDisplayedSeconds = null;
		this.resultPanel.classList.add("visible");
		this.resultPanel.setAttribute("aria-hidden", "false");
		this.nextButton.hidden = result !== "success";
		this.retryButton.hidden = result !== "failure";
		this.refreshLocale();
	}
	hide() {
		this.challenge = null;
		this.result = null;
		document.documentElement.classList.remove("rush-active", "rush-running");
		this.timer.classList.remove("visible", "waiting", "tick", "warning", "urgent", "critical");
		this.timer.setAttribute("aria-hidden", "true");
		this.timer.style.removeProperty("--rush-pressure");
		this.timer.style.removeProperty("--rush-final-pressure");
		this.timer.style.removeProperty("--rush-final-opacity");
		this.timer.style.removeProperty("--rush-base-scale");
		this.timer.style.removeProperty("--rush-tick-scale");
		this.edgeAlert.classList.remove("visible", "tick");
		this.edgeAlert.style.removeProperty("--rush-edge-pressure");
		this.edgeAlert.style.removeProperty("--rush-edge-opacity");
		this.lastDisplayedSeconds = null;
		this.timerScaleCap = 2;
		this.briefingPanel.classList.remove("visible");
		this.briefingPanel.setAttribute("aria-hidden", "true");
		this.resultPanel.classList.remove("visible");
		this.resultPanel.setAttribute("aria-hidden", "true");
	}
	refreshLocale() {
		if (this.challenge) {
			const locale = getLocale();
			this.briefingTitle.textContent = this.challenge.title[locale];
			this.briefingTime.textContent = t("rush.briefing.time", { seconds: this.challenge.timeLimitSeconds });
			this.briefingGoal.textContent = this.challenge.objective[locale];
			this.briefingDifficulty.textContent = t(`rush.difficulty.${this.challenge.level.difficulty}`);
		}
		this.timerState.textContent = this.timer.classList.contains("waiting") ? t("rush.timer.ready") : t("rush.timer.running");
		this.startButton.textContent = t("rush.briefing.start");
		this.briefingHomeButton.textContent = t("actions.home");
		this.nextButton.textContent = t("complete.retry");
		this.retryButton.textContent = t("rush.result.retry");
		this.resultHomeButton.textContent = t("actions.home");
		if (!this.result) return;
		const success = this.result === "success";
		this.resultEyebrow.textContent = success ? "RUSH CLEARED" : "TIME OVER";
		this.resultTitle.textContent = t(success ? "rush.result.success" : "rush.result.failure");
		this.resultDescription.textContent = t(success ? "rush.result.successDescription" : "rush.result.failureDescription");
		this.resultPanel.setAttribute("aria-label", getLocale() === "zh" ? `RUSH ${success ? "挑战成功" : "挑战失败"}` : `RUSH ${success ? "success" : "failure"}`);
	}
	dispose() {
		this.startButton.removeEventListener("click", this.options.onStart);
		this.nextButton.removeEventListener("click", this.options.onNext);
		this.retryButton.removeEventListener("click", this.options.onRetry);
		this.briefingHomeButton.removeEventListener("click", this.options.onHome);
		this.resultHomeButton.removeEventListener("click", this.options.onHome);
		this.hide();
	}
	getElement(selector) {
		const element = document.querySelector(selector);
		if (!element) throw new Error(`Missing RUSH UI element: ${selector}`);
		return element;
	}
	getButton(selector) {
		const element = document.querySelector(selector);
		if (!element) throw new Error(`Missing RUSH UI button: ${selector}`);
		return element;
	}
};
//#endregion
//#region src/systems/DoubleEndedModeUi.ts
var DoubleEndedModeUi = class {
	options;
	panel = this.getElement("#double-ended-briefing-panel");
	eyebrow = this.getElement("#double-ended-briefing-eyebrow");
	title = this.getElement("#double-ended-briefing-title");
	rule = this.getElement("#double-ended-briefing-rule");
	hint = this.getElement("#double-ended-briefing-hint");
	startButton = this.getButton("#double-ended-start-button");
	homeButton = this.getButton("#double-ended-home-button");
	briefing = false;
	constructor(options) {
		this.options = options;
		this.startButton.addEventListener("click", options.onStart);
		this.homeButton.addEventListener("click", options.onHome);
	}
	get briefingVisible() {
		return this.briefing;
	}
	showBriefing() {
		this.briefing = true;
		document.documentElement.classList.add("double-ended-active", "double-ended-briefing");
		this.panel.classList.add("visible");
		this.panel.setAttribute("aria-hidden", "false");
		this.refreshLocale();
	}
	showPlaying() {
		this.briefing = false;
		document.documentElement.classList.add("double-ended-active");
		document.documentElement.classList.remove("double-ended-briefing");
		this.panel.classList.remove("visible");
		this.panel.setAttribute("aria-hidden", "true");
	}
	hide() {
		this.briefing = false;
		document.documentElement.classList.remove("double-ended-active", "double-ended-briefing");
		this.panel.classList.remove("visible");
		this.panel.setAttribute("aria-hidden", "true");
	}
	refreshLocale() {
		this.eyebrow.textContent = t("doubleEnded.briefing.eyebrow");
		this.title.textContent = t("doubleEnded.briefing.title");
		this.rule.textContent = t("doubleEnded.briefing.rule");
		this.hint.textContent = t("doubleEnded.briefing.hint");
		this.startButton.textContent = t("doubleEnded.briefing.start");
		this.homeButton.textContent = t("actions.home");
	}
	dispose() {
		this.startButton.removeEventListener("click", this.options.onStart);
		this.homeButton.removeEventListener("click", this.options.onHome);
		this.hide();
	}
	getElement(selector) {
		const element = document.querySelector(selector);
		if (!element) throw new Error(`Missing double-ended UI element: ${selector}`);
		return element;
	}
	getButton(selector) {
		const element = document.querySelector(selector);
		if (!element) throw new Error(`Missing double-ended UI button: ${selector}`);
		return element;
	}
};
//#endregion
//#region src/game/RushRound.ts
/**
* Owns the one and only pressure rule in RUSH: a single whole-round clock.
* Cable removals and mistakes are recorded for diagnostics, but neither can
* mutate the authored time limit.
*/
var RushRound = class {
	timeLimitSeconds;
	remaining = 0;
	removals = 0;
	mistakes = 0;
	startedAtSeconds = 0;
	phase = "briefing";
	constructor(timeLimitSeconds) {
		this.timeLimitSeconds = timeLimitSeconds;
		if (!Number.isFinite(timeLimitSeconds) || timeLimitSeconds <= 0) throw new Error("RUSH time limit must be a positive finite number.");
		this.remaining = timeLimitSeconds;
	}
	get remainingSeconds() {
		return this.remaining;
	}
	get removalCount() {
		return this.removals;
	}
	get mistakeCount() {
		return this.mistakes;
	}
	start(nowSeconds = 0) {
		if (this.phase !== "briefing") return;
		this.startedAtSeconds = nowSeconds;
		this.phase = "running";
	}
	update(nowSeconds) {
		if (this.phase !== "running") return this.phase;
		this.remaining = Math.max(0, this.timeLimitSeconds - Math.max(0, nowSeconds - this.startedAtSeconds));
		if (this.remaining === 0) this.phase = "failed";
		return this.phase;
	}
	recordRemoval() {
		if (this.phase === "running") this.removals += 1;
	}
	recordMistake() {
		if (this.phase === "running") this.mistakes += 1;
	}
	succeed() {
		if (this.phase === "running") this.phase = "succeeded";
	}
	reset() {
		this.remaining = this.timeLimitSeconds;
		this.removals = 0;
		this.mistakes = 0;
		this.startedAtSeconds = 0;
		this.phase = "briefing";
	}
};
//#endregion
//#region src/game/CablePickPreference.ts
var keyOf = ({ id, end }) => `${id}:${end}`;
/**
* Prefer a physically available plug when multiple plug meshes overlap in
* screen space. If none of the hits is currently removable, keep the nearest
* hit so blocked and fake-plug mistakes still receive normal feedback.
*/
function preferAvailableCablePick(hits, available) {
	if (hits.length === 0) return null;
	const availableKeys = new Set(available.map(keyOf));
	return hits.find((hit) => availableKeys.has(keyOf(hit))) ?? hits[0];
}
//#endregion
//#region src/game/ChallengeCompletion.ts
function resolveCompletionContinuation(context) {
	if (context.mode === "campaign") {
		const levelId = context.levelId ?? 1;
		return levelId < Math.max(1, context.campaignLevelCount ?? levelId) ? {
			action: "next-campaign-level",
			labelKey: "continue.next"
		} : {
			action: "new-random",
			labelKey: "continue.random"
		};
	}
	if (context.mode === "skill") return {
		action: "new-skill",
		labelKey: "complete.retry"
	};
	if (context.mode === "rush") return {
		action: "new-rush",
		labelKey: "complete.retry"
	};
	if (context.exploration) return {
		action: "new-exploration",
		labelKey: "complete.retry"
	};
	if (context.challengeKind === "double-ended") return {
		action: "new-double-ended",
		labelKey: "complete.retry"
	};
	return {
		action: "new-random",
		labelKey: "complete.retry"
	};
}
//#endregion
//#region src/skill/SkillChallengeUi.ts
var GACHA_CARD_REVEAL_MS = 4200;
var STATUS_LABELS = {
	"dry-shield": {
		name: "干燥护罩",
		description: "抵挡下一次新增的负面状态。"
	},
	"iridescent-bubble": {
		name: "虹膜泡泡",
		description: "抵挡一次受阻点击。"
	},
	"soothing-record": {
		name: "安心旋律",
		description: "抵挡一次受阻点击。"
	},
	continue: {
		name: "继续游戏",
		description: "生命归零时复活并恢复生命。"
	},
	"induction-reveal": {
		name: "感应显线",
		description: "持续标记全部真实出口。"
	},
	"bass-spacing": {
		name: "节拍扩距",
		description: "线与线外轮廓之间的净空约为原来的 2 倍，不改变可抽判定。"
	},
	"bathroom-steam": {
		name: "浴室蒸汽",
		description: "蒸汽遮挡画面，正确抽线后逐回合消退。"
	},
	"frozen-plug": {
		name: "急冻封头",
		description: "部分真实出口暂时无法抽取。"
	},
	"coffee-lock": {
		name: "咖啡封技",
		description: "咖啡遮蔽线色；家电照常连接和播放动画，但技能暂时被封锁。"
	},
	"rice-thick-cable": {
		name: "米饭粗线",
		description: "线缆暂时视觉膨胀，不改变碰撞。"
	},
	"overheated-plug": {
		name: "限时取餐",
		description: "必须在接下来两次成功拔线内拔出被加热标记的线，否则失去一格生命。"
	},
	"fake-double-plug": {
		name: "双头伪装",
		description: "普通尾端生成永久假插头。"
	}
};
var SkillChallengeUi = class {
	options;
	root = this.getElement("#skill-challenge-ui");
	statusRack = this.getElement("#skill-status-rack");
	buffSlot = this.getElement("#skill-buff-slot");
	debuffSlot = this.getElement("#skill-debuff-slot");
	printer = this.getElement("#skill-printer-pending");
	cue = this.getElement("#skill-cue");
	cueTitle = this.getElement("#skill-cue-title");
	cuePhase = this.getElement("#skill-cue-phase");
	cueSource = this.getElement("#skill-cue-source");
	cueDetail = this.getElement("#skill-cue-detail");
	screenEffect = this.getElement("#skill-screen-effect");
	cardPanel = this.getElement("#skill-card-panel");
	cardList = this.getElement("#skill-card-list");
	recyclePrompt = this.getElement("#skill-recycle-prompt");
	cueTimer = 0;
	cuePointerInside = false;
	cueFocusInside = false;
	cardLocked = false;
	cardRevealTimer = 0;
	buffDeletionTimer = 0;
	buffDeletionElements = [];
	normalizationTimer = 0;
	normalizationBadge = null;
	constructor(options) {
		this.options = options;
		this.cue.addEventListener("pointerenter", this.onCuePointerEnter);
		this.cue.addEventListener("pointerleave", this.onCuePointerLeave);
		this.cue.addEventListener("focusin", this.onCueFocusIn);
		this.cue.addEventListener("focusout", this.onCueFocusOut);
	}
	setVisible(visible) {
		this.root.classList.toggle("visible", visible);
		this.root.setAttribute("aria-hidden", String(!visible));
		this.statusRack.classList.toggle("visible", visible);
		this.statusRack.setAttribute("aria-hidden", String(!visible));
		if (!visible) this.resetTransient();
	}
	render(state) {
		this.renderSlot(this.buffSlot, state.buff, "BUFF");
		this.renderSlot(this.debuffSlot, state.debuff, "DEBUFF");
		this.printer.classList.toggle("visible", state.printerCopyReady);
		this.printer.setAttribute("aria-hidden", String(!state.printerCopyReady));
		const effect = state.debuff?.id ?? state.buff?.id ?? "none";
		this.screenEffect.dataset.effect = effect;
		this.screenEffect.classList.remove("active");
	}
	showComputerBuffDeleted() {
		this.clearBuffDeletion();
		if (!this.buffSlot.classList.contains("occupied")) return;
		const rect = this.buffSlot.getBoundingClientRect();
		const ghost = this.buffSlot.cloneNode(true);
		ghost.id = "";
		ghost.classList.add("skill-status-delete-ghost");
		ghost.querySelector(".skill-status-tooltip")?.remove();
		ghost.style.left = `${rect.left}px`;
		ghost.style.top = `${rect.top}px`;
		ghost.style.width = `${rect.width}px`;
		ghost.style.height = `${rect.height}px`;
		document.body.append(ghost);
		this.buffDeletionElements.push(ghost);
		for (let index = 0; index < 8; index += 1) {
			const pixel = document.createElement("i");
			pixel.className = "skill-status-delete-pixel";
			pixel.style.left = `${rect.left + rect.width * .5}px`;
			pixel.style.top = `${rect.top + rect.height * .5}px`;
			pixel.style.setProperty("--delete-pixel-index", String(index));
			document.body.append(pixel);
			this.buffDeletionElements.push(pixel);
		}
		const label = document.createElement("strong");
		label.className = "skill-status-delete-label";
		label.textContent = "BUFF DELETED";
		label.style.left = `${rect.left + rect.width * .5}px`;
		label.style.top = `${rect.bottom + 7}px`;
		document.body.append(label);
		this.buffDeletionElements.push(label);
		document.documentElement.classList.add("desktop-buff-deleting");
		this.buffDeletionTimer = window.setTimeout(() => this.clearBuffDeletion(), 1150);
	}
	showStatusNormalized(turns) {
		this.clearStatusNormalization();
		const slots = [this.buffSlot, this.debuffSlot].filter((slot) => slot.classList.contains("occupied") && slot.querySelector(".skill-status-count")?.textContent === String(turns));
		if (slots.length === 0) return;
		slots.forEach((slot) => {
			slot.classList.remove("skill-status-normalized");
			slot.offsetWidth;
			slot.classList.add("skill-status-normalized");
		});
		const rects = slots.map((slot) => slot.getBoundingClientRect());
		const centerX = rects.reduce((sum, rect) => sum + rect.left + rect.width * .5, 0) / rects.length;
		const bottom = Math.max(...rects.map((rect) => rect.bottom));
		const badge = document.createElement("strong");
		badge.className = "skill-status-normalized-badge";
		badge.textContent = `限回合状态 → ${turns}`;
		badge.style.left = `${centerX}px`;
		badge.style.top = `${bottom + 8}px`;
		document.body.append(badge);
		this.normalizationBadge = badge;
		this.normalizationTimer = window.setTimeout(() => this.clearStatusNormalization(), 1550);
	}
	showCue(label, phase = "cue", detail = "", source = "家电连接完成") {
		window.clearTimeout(this.cueTimer);
		this.cuePointerInside = this.cue.matches(":hover");
		this.cueFocusInside = this.cue.contains(document.activeElement);
		this.cueTitle.textContent = label;
		this.cueSource.textContent = source;
		this.cueDetail.textContent = detail;
		this.cuePhase.textContent = this.phaseLabel(phase);
		this.cue.dataset.phase = phase;
		this.cue.classList.add("visible");
		this.cue.style.pointerEvents = "auto";
		this.cue.setAttribute("aria-hidden", "false");
		this.scheduleCueHide(5e3);
	}
	setCuePhase(phase, label) {
		if (!this.cue.classList.contains("visible")) return;
		this.cue.dataset.phase = phase;
		this.cuePhase.textContent = label ?? this.phaseLabel(phase);
	}
	showCards(cards) {
		this.cardLocked = false;
		this.cardList.replaceChildren();
		cards.forEach((card, index) => {
			const button = document.createElement("button");
			button.type = "button";
			const tierKind = card.tier.endsWith("benefit") ? "benefit" : "risk";
			const tierStrength = card.tier.startsWith("strong") ? "strong" : "normal";
			const longTitle = card.label.length >= 8 ? " is-long-title" : "";
			const longCopy = card.description.length >= 30 ? " is-long-copy" : "";
			const applianceLabel = getApplianceCardLabel(card.appliance);
			button.className = `skill-card skill-card--${tierKind} skill-card--${tierStrength}`;
			button.setAttribute("aria-label", `选择第 ${index + 1} 张扭蛋卡`);
			button.dataset.skillId = card.skillId;
			button.dataset.appliance = card.appliance;
			button.dataset.tier = card.tier;
			button.style.cssText = getSkillCardStyle(card.skillId);
			button.innerHTML = `
        <span class="skill-card-face skill-card-back">
          <span class="skill-card-frame">
            <span class="skill-card-inset skill-card-back-inset">
              <span class="skill-card-random">随机</span>
              <strong class="skill-card-question">?</strong>
            </span>
          </span>
        </span>
        <span class="skill-card-face skill-card-front">
          <span class="skill-card-frame">
            <span class="skill-card-inset skill-card-front-inset">
              <i>${applianceLabel}</i>
              <b class="${longTitle.trim()}" title="${card.label}">${card.label}</b>
              <span class="skill-card-symbol-stage" role="img" aria-label="${card.label}技能符号">${renderSkillCardSymbol(card.skillId)}</span>
              <span class="skill-card-tier">${GACHA_TIER_LABELS[card.tier]}</span>
              <small class="${longCopy.trim()}">${card.description}</small>
            </span>
          </span>
        </span>`;
			button.addEventListener("click", () => {
				if (this.cardLocked) return;
				this.cardLocked = true;
				button.setAttribute("aria-label", `已选择${applianceLabel}：${card.label}`);
				button.classList.add("selected");
				[...this.cardList.querySelectorAll(".skill-card")].forEach((candidate) => {
					candidate.disabled = true;
					if (candidate !== button) candidate.classList.add("dismissed");
				});
				window.clearTimeout(this.cardRevealTimer);
				this.cardRevealTimer = window.setTimeout(() => {
					this.cardRevealTimer = 0;
					this.options.onCardSelected(index);
				}, GACHA_CARD_REVEAL_MS);
			}, { once: true });
			this.cardList.append(button);
		});
		this.cardPanel.classList.add("visible");
		this.cardPanel.setAttribute("aria-hidden", "false");
	}
	hideCards() {
		window.clearTimeout(this.cardRevealTimer);
		this.cardRevealTimer = 0;
		this.cardPanel.classList.remove("visible");
		this.cardPanel.setAttribute("aria-hidden", "true");
		this.cardLocked = false;
	}
	setRecycleSelection(active) {
		this.recyclePrompt.classList.toggle("visible", active);
		this.recyclePrompt.setAttribute("aria-hidden", String(!active));
		document.documentElement.classList.toggle("skill-recycle-selecting", active);
	}
	setInputLocked(locked) {
		document.documentElement.classList.toggle("skill-input-locked", locked);
	}
	resetTransient() {
		window.clearTimeout(this.cueTimer);
		this.cueTimer = 0;
		window.clearTimeout(this.cardRevealTimer);
		this.cardRevealTimer = 0;
		this.cuePointerInside = false;
		this.cueFocusInside = false;
		this.cue.classList.remove("visible");
		this.cue.style.pointerEvents = "none";
		this.cue.setAttribute("aria-hidden", "true");
		this.hideCards();
		this.setRecycleSelection(false);
		this.setInputLocked(false);
		this.screenEffect.dataset.effect = "none";
		this.screenEffect.classList.remove("active");
		this.clearBuffDeletion();
		this.clearStatusNormalization();
	}
	dispose() {
		window.clearTimeout(this.cueTimer);
		window.clearTimeout(this.cardRevealTimer);
		this.clearBuffDeletion();
		this.cue.removeEventListener("pointerenter", this.onCuePointerEnter);
		this.cue.removeEventListener("pointerleave", this.onCuePointerLeave);
		this.cue.removeEventListener("focusin", this.onCueFocusIn);
		this.cue.removeEventListener("focusout", this.onCueFocusOut);
		this.resetTransient();
	}
	clearBuffDeletion() {
		window.clearTimeout(this.buffDeletionTimer);
		this.buffDeletionTimer = 0;
		document.documentElement.classList.remove("desktop-buff-deleting");
		this.buffDeletionElements.forEach((element) => element.remove());
		this.buffDeletionElements = [];
	}
	clearStatusNormalization() {
		window.clearTimeout(this.normalizationTimer);
		this.normalizationTimer = 0;
		this.buffSlot.classList.remove("skill-status-normalized");
		this.debuffSlot.classList.remove("skill-status-normalized");
		this.normalizationBadge?.remove();
		this.normalizationBadge = null;
	}
	onCuePointerEnter = () => {
		this.cuePointerInside = true;
		window.clearTimeout(this.cueTimer);
		this.cueTimer = 0;
	};
	onCuePointerLeave = () => {
		this.cuePointerInside = false;
		this.scheduleCueHide(1e3);
	};
	onCueFocusIn = () => {
		this.cueFocusInside = true;
		window.clearTimeout(this.cueTimer);
		this.cueTimer = 0;
	};
	onCueFocusOut = (event) => {
		if (event.relatedTarget instanceof Node && this.cue.contains(event.relatedTarget)) return;
		this.cueFocusInside = false;
		this.scheduleCueHide(1e3);
	};
	scheduleCueHide(delayMs) {
		window.clearTimeout(this.cueTimer);
		if (this.cuePointerInside || this.cueFocusInside) return;
		this.cueTimer = window.setTimeout(() => {
			if (this.cuePointerInside || this.cueFocusInside) return;
			this.cue.classList.remove("visible");
			this.cue.style.pointerEvents = "none";
			this.cue.setAttribute("aria-hidden", "true");
			this.cueTimer = 0;
		}, delayMs);
	}
	renderSlot(element, instance, slotLabel) {
		const mark = element.querySelector(".skill-status-mark");
		const name = element.querySelector(".skill-status-name");
		const count = element.querySelector(".skill-status-count");
		const detail = element.querySelector(".skill-status-detail");
		element.classList.toggle("occupied", instance !== null);
		element.dataset.status = instance?.id ?? "empty";
		if (!instance) {
			if (mark) mark.textContent = "";
			if (name) name.textContent = slotLabel;
			if (count) count.textContent = "";
			if (detail) detail.textContent = "";
			element.removeAttribute("tabindex");
			element.removeAttribute("aria-label");
			return;
		}
		const metadata = STATUS_LABELS[instance.id];
		if (mark) mark.textContent = "";
		if (name) name.textContent = metadata.name;
		if (count) count.textContent = this.statusCount(instance);
		if (detail) detail.textContent = `${metadata.description}${this.statusDuration(instance)}`;
		element.tabIndex = 0;
		element.setAttribute("aria-label", `${metadata.name}。${metadata.description}${this.statusDuration(instance)}`);
	}
	statusDuration(instance) {
		if (instance.id === "fake-double-plug") return ` 当前影响 ${instance.targetCableIds.length} 根线。`;
		if (instance.id === "continue") return ` 复活时恢复 ${Number(instance.payload.restoreLives ?? 1)} 格生命。`;
		if (instance.turnsRemaining === null) return " 持续到触发或挑战结束。";
		return ` 剩余 ${instance.turnsRemaining} 回合。`;
	}
	phaseLabel(phase) {
		if (phase === "commit") return "效果生效";
		if (phase === "settle") return "结算完成";
		return "技能发动";
	}
	statusCount(instance) {
		if (instance.id === "fake-double-plug") return String(instance.targetCableIds.length);
		if (instance.id === "soothing-record") return "1";
		if (instance.id === "continue") return `1/${Number(instance.payload.restoreLives ?? 1)}`;
		return instance.turnsRemaining === null ? "" : String(instance.turnsRemaining);
	}
	getElement(selector) {
		const element = document.querySelector(selector);
		if (!element) throw new Error(`Missing skill challenge UI element: ${selector}`);
		return element;
	}
};
//#endregion
//#region src/skill/skillTopology.ts
function reverseCableKeepingExternalEndpoints(definition) {
	const reversed = {
		...definition,
		path: [...definition.path].reverse().map((point) => [...point]),
		exitDirection: cableEndDirection(definition, "tail")
	};
	if (definition.terminalAnchorMode === "preserve-external-endpoints") delete reversed.terminalAnchorMode;
	else reversed.terminalAnchorMode = "preserve-external-endpoints";
	return reversed;
}
function copySpatialRoute(identity, route) {
	return {
		...identity,
		path: route.path.map((point) => [...point]),
		exitDirection: route.exitDirection,
		lengthClass: route.lengthClass,
		terminalAnchorMode: route.terminalAnchorMode
	};
}
function buildTelevisionSpatialReplacements(definitions, targetCableIds) {
	const definitionsById = new Map(definitions.map((definition) => [definition.id, definition]));
	const requestedTargets = [...new Set(targetCableIds)].map((id) => definitionsById.get(id)).filter((definition) => definition !== void 0);
	if (requestedTargets.length < 2) return /* @__PURE__ */ new Map();
	const permutations = (values) => {
		if (values.length <= 1) return [values];
		const result = [];
		values.forEach((value, index) => {
			const rest = [...values.slice(0, index), ...values.slice(index + 1)];
			permutations(rest).forEach((tail) => result.push([value, ...tail]));
		});
		return result;
	};
	for (let subsetSize = requestedTargets.length; subsetSize >= 2; subsetSize -= 1) {
		const choose = (start, picked) => {
			if (picked.length === subsetSize) return [picked];
			const result = [];
			for (let index = start; index <= requestedTargets.length - (subsetSize - picked.length); index += 1) result.push(...choose(index + 1, [...picked, requestedTargets[index]]));
			return result;
		};
		for (const targets of choose(0, [])) {
			const identity = targets.map((_, index) => index);
			for (const permutation of permutations(identity)) {
				if (permutation.some((value, index) => value === index)) continue;
				const replacements = /* @__PURE__ */ new Map();
				targets.forEach((source, index) => {
					const route = targets[permutation[index]];
					replacements.set(source.id, copySpatialRoute(source, route));
				});
				if (skillTopologyDefinitionsAreCommitSafe(definitions.map((definition) => replacements.get(definition.id) ?? definition))) return replacements;
			}
		}
	}
	return /* @__PURE__ */ new Map();
}
function skillTopologyDefinitionsAreCommitSafe(definitions) {
	return geometryIsClear(definitions) && findRemovalSequence([...definitions]) !== null;
}
function frozenStatusBlocksEveryAvailableCable(availableCableIds, frozenCableIds) {
	return availableCableIds.length > 0 && availableCableIds.every((id) => frozenCableIds.has(id));
}
//#endregion
//#region src/skill/SkillEffectModelKit.ts
var SKILL_EFFECT_ASSET_REFERENCES = {
	"humidifier-glass-wiper": "references/skill-effects/intake/humidifier-glass-wiper/reference.png",
	"fan-airflow-ribbon": "references/skill-effects/intake/fan-airflow-ribbon/reference.png",
	"bubble-shell-wave-membrane": "references/skill-effects/intake/bubble-shell-wave-membrane/reference.png",
	"radio-sequence-markers": "references/skill-effects/intake/radio-sequence-markers/reference.png",
	"kettle-steam-ribbon": "references/skill-effects/intake/kettle-steam-ribbon/reference.png",
	"blender-energy-shards": "references/skill-effects/intake/blender-energy-shards/reference.png",
	"gacha-card-frame": "references/skill-effects/intake/gacha-card-frame/reference.png",
	"alarm-time-ring": "references/skill-effects/intake/alarm-time-ring/reference.png",
	"popcorn-target-marker": "references/skill-effects/intake/popcorn-target-marker/reference.png",
	"controller-impact-star": "references/skill-effects/intake/controller-impact-star/reference.png",
	"microwave-double-heat-ring": "references/skill-effects/intake/microwave-double-heat-ring/reference.png",
	"induction-heat-ring": "references/skill-effects/intake/induction-heat-ring/reference.png",
	"speaker-bass-wave-arcs": "references/skill-effects/intake/speaker-bass-wave-arcs/reference.png"
};
function visiblePopcornHintCableId(state) {
	if (!state.popcornHintCableId) return null;
	return state.debuff?.id === "overheated-plug" && state.debuff.targetCableIds.includes(state.popcornHintCableId) ? null : state.popcornHintCableId;
}
var POPCORN_PLANE_TO_PLUG_DIRECTION = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI / 2);
function popcornMarkerQuaternion(plugQuaternion) {
	return plugQuaternion.clone().multiply(POPCORN_PLANE_TO_PLUG_DIRECTION);
}
var ASSET_BY_APPLIANCE = {
	radio: "radio-sequence-markers",
	kettle: "kettle-steam-ribbon",
	"gumball-machine": "gacha-card-frame",
	"popcorn-machine": "popcorn-target-marker",
	microwave: "microwave-double-heat-ring",
	"portable-speaker": "speaker-bass-wave-arcs"
};
function polygonShape(points) {
	const shape = new Shape();
	points.forEach(([x, y], index) => index === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y));
	shape.closePath();
	return shape;
}
function starShape(points = 8, outer = .58, inner = .3) {
	return polygonShape(Array.from({ length: points * 2 }, (_, index) => {
		const angle = Math.PI * .5 + index * Math.PI / points;
		const radius = index % 2 === 0 ? outer : inner;
		return [Math.cos(angle) * radius, Math.sin(angle) * radius];
	}));
}
function heartShape() {
	const shape = new Shape();
	shape.moveTo(0, -.48);
	shape.bezierCurveTo(-.72, -.04, -.62, .52, -.26, .5);
	shape.bezierCurveTo(-.08, .5, 0, .34, 0, .23);
	shape.bezierCurveTo(0, .34, .08, .5, .26, .5);
	shape.bezierCurveTo(.62, .52, .72, -.04, 0, -.48);
	return shape;
}
var SkillEffectModelKit = class {
	root = new Group();
	persistent = new Group();
	transient = new Group();
	materials = /* @__PURE__ */ new Set();
	textures = /* @__PURE__ */ new Set();
	heatCoreTexture = null;
	heatArcTexture = null;
	instances = [];
	pools = /* @__PURE__ */ new Map();
	persistentSignature = "";
	evidenceAsset = null;
	coral = this.material(PAL.red, 10174798);
	teal = this.material(4835779, 2847365);
	yellow = this.material(16766042, 11887931, 16751928, .22);
	cream = this.material(PAL.paper, 12100797);
	purple = this.material(11111893, 6706302);
	ice = this.material(9365759, 4226221, 7593983, .2, true, .72);
	bubble = this.material(13154815, 7303333, 12504063, .2, true, .34);
	constructor() {
		this.root.name = "skill-effect-model-kit";
		this.persistent.name = "skill-effect-persistent";
		this.transient.name = "skill-effect-transient";
		this.root.add(this.persistent, this.transient);
		this.root.userData.sculptRuntime = {
			nodes: {
				root: this.root,
				persistent: this.persistent,
				transient: this.transient
			},
			sockets: { scene: this.root },
			pivots: [
				"cue-pivot",
				"pulse-pivot",
				"flip-pivot",
				"attachment-socket"
			],
			pooledAssets: Object.keys(SKILL_EFFECT_ASSET_REFERENCES),
			referenceRoot: "references/skill-effects/intake"
		};
	}
	get activeAssetIds() {
		const assets = /* @__PURE__ */ new Set();
		this.root.traverse((object) => {
			if (typeof object.userData.assetId === "string") assets.add(object.userData.assetId);
		});
		return [...assets];
	}
	get activeTransientCount() {
		return this.instances.length;
	}
	get popcornTransientCount() {
		return this.transient.children.filter((child) => child.userData.assetId === "popcorn-target-marker").length;
	}
	get microwaveMarkerDiagnostics() {
		return this.persistent.children.filter((child) => child.userData.assetId === "microwave-double-heat-ring").map((child) => ({
			cableId: String(child.userData.cableId ?? ""),
			quaternion: child.quaternion.toArray(),
			rings: ["heat-chance-one", "heat-chance-two"].map((name) => {
				const ring = child.getObjectByName(name);
				const material = ring instanceof Mesh ? ring.material : null;
				return {
					type: ring?.type ?? "missing",
					depthTest: material instanceof Material ? material.depthTest : false
				};
			})
		}));
	}
	get popcornMarkerDiagnostics() {
		return this.persistent.children.filter((child) => child.userData.assetId === "popcorn-target-marker").map((child) => {
			const ringSegment = child.getObjectByName("popcorn-ring-segment-1");
			const ringTubeRadius = ringSegment instanceof Mesh && ringSegment.geometry instanceof TorusGeometry ? ringSegment.geometry.parameters.tube : 0;
			const hintDirection = child.userData.hintDirection;
			const markerDirection = new Vector3(0, 0, 1).applyQuaternion(child.quaternion).normalize();
			const kernelAngles = (child.getObjectByName("popcorn-kernels")?.children ?? []).map((kernel) => kernel.userData.basePosition).filter((position) => position instanceof Vector3).map((position) => Math.atan2(position.y, position.x)).sort((a, b) => a - b);
			const kernelAngularGaps = kernelAngles.map((angle, index) => {
				return ((kernelAngles[(index + 1) % kernelAngles.length] ?? angle) - angle + Math.PI * 2) % (Math.PI * 2);
			});
			return {
				cableId: String(child.userData.cableId ?? ""),
				position: child.position.toArray(),
				kernelCount: child.getObjectByName("popcorn-kernels")?.children.length ?? 0,
				ringSegmentCount: child.getObjectByName("popcorn-target-ring")?.children.length ?? 0,
				rayCount: child.getObjectByName("popcorn-rays")?.children.length ?? 0,
				ringTubeRadius,
				directionAlignment: hintDirection instanceof Vector3 ? markerDirection.dot(hintDirection) : 0,
				orientationMode: String(child.userData.orientationMode ?? ""),
				kernelAngularGaps
			};
		});
	}
	play(appliance, targets = []) {
		const asset = ASSET_BY_APPLIANCE[appliance];
		if (!asset || asset === "popcorn-target-marker") return;
		const root = this.acquire(asset);
		root.name = `skill-effect-${asset}`;
		root.userData.assetId = asset;
		root.userData.referencePath = SKILL_EFFECT_ASSET_REFERENCES[asset];
		root.userData.sculptRuntime = {
			nodes: Object.fromEntries(root.children.map((node) => [node.name, node])),
			sockets: { attachment: root.getObjectByName("attachment-socket") ?? root },
			pivots: [
				"cue-pivot",
				"pulse-pivot",
				"flip-pivot"
			].filter((name) => root.getObjectByName(name))
		};
		root.position.copy(targets[0] ?? new Vector3(0, .2, 2.1));
		if (targets.length === 0) root.position.z = 3.2;
		root.scale.setScalar(.001);
		this.transient.add(root);
		this.instances.push({
			root,
			age: 0,
			duration: asset === "gacha-card-frame" ? 1.8 : 1.35,
			seed: this.instances.length * .77
		});
	}
	showAssetForEvidence(asset, yaw = 0) {
		this.reset();
		const model = this.acquire(asset);
		model.name = `skill-effect-evidence-${asset}`;
		model.userData.assetId = asset;
		model.userData.referencePath = SKILL_EFFECT_ASSET_REFERENCES[asset];
		model.userData.baseScale = 2.4;
		model.position.set(0, 0, 3.2);
		model.rotation.y = yaw;
		model.scale.setScalar(2.4);
		this.persistent.add(model);
		this.evidenceAsset = asset;
		this.persistentSignature = `evidence:${asset}`;
		return model;
	}
	syncPersistent(state, cablePositions, cableOrientations, _availablePositions, hintPositions, hintOrientations) {
		if (this.evidenceAsset) return;
		this.syncPersistentMarkerTransforms(cablePositions, cableOrientations, hintPositions, hintOrientations);
		const visiblePopcornTarget = visiblePopcornHintCableId(state);
		const popcornTargetPosition = visiblePopcornTarget ? hintPositions.get(visiblePopcornTarget) : null;
		const signature = JSON.stringify({
			buff: state.buff?.id ?? null,
			debuff: state.debuff?.id ?? null,
			targets: state.debuff?.targetCableIds ?? [],
			turns: state.debuff?.id === "overheated-plug" ? state.debuff.turnsRemaining : null,
			cablePositions: [...cablePositions].map(([id, position]) => [id, position.toArray().map((value) => value.toFixed(2))]),
			popcornTarget: visiblePopcornTarget,
			popcornPosition: popcornTargetPosition?.toArray().map((value) => value.toFixed(2)) ?? null
		});
		if (signature === this.persistentSignature) return;
		this.persistentSignature = signature;
		this.persistent.clear();
		if (state.debuff?.id === "overheated-plug") state.debuff.targetCableIds.forEach((id) => {
			const marker = this.attach("microwave-double-heat-ring", cablePositions.get(id), .72);
			if (marker) {
				marker.userData.cableId = id;
				marker.userData.turnsRemaining = state.debuff?.turnsRemaining ?? 2;
				const orientation = cableOrientations.get(id);
				if (orientation) marker.quaternion.copy(orientation);
			}
		});
		if (visiblePopcornTarget) {
			const marker = this.attach("popcorn-target-marker", hintPositions.get(visiblePopcornTarget), .86);
			if (marker) {
				marker.userData.cableId = visiblePopcornTarget;
				marker.userData.anchorPosition = marker.position.clone();
				marker.userData.orientationMode = "plug-end";
				const orientation = hintOrientations.get(visiblePopcornTarget);
				if (orientation) {
					marker.quaternion.copy(popcornMarkerQuaternion(orientation));
					marker.userData.hintDirection = new Vector3(0, 1, 0).applyQuaternion(orientation).normalize();
				}
			}
		}
	}
	update(delta, elapsed) {
		for (let index = this.instances.length - 1; index >= 0; index -= 1) {
			const instance = this.instances[index];
			instance.age += delta;
			const progress = MathUtils.clamp(instance.age / instance.duration, 0, 1);
			const enter = MathUtils.smoothstep(progress, 0, .2);
			const exit = 1 - MathUtils.smoothstep(progress, .72, 1);
			instance.root.scale.setScalar(Math.max(.001, enter * exit * 1.2));
			if (instance.root.userData.assetId === "popcorn-target-marker") this.updatePopcornBurst(instance.root, progress, elapsed, instance.seed);
			else {
				instance.root.rotation.y = Math.sin(elapsed * 3.2 + instance.seed) * .16;
				instance.root.rotation.z = Math.sin(elapsed * 4.1 + instance.seed) * .05;
			}
			if (progress < 1) continue;
			this.release(instance.root);
			this.instances.splice(index, 1);
		}
		this.persistent.children.forEach((child, index) => {
			const asset = child.userData.assetId;
			if (asset === "microwave-double-heat-ring") {
				this.updateMicrowaveMarker(child, elapsed);
				return;
			}
			if (asset === "popcorn-target-marker") {
				this.updatePopcornMarker(child, elapsed);
				return;
			}
			const pulse = 1 + Math.sin(elapsed * 3.6 + index * .8) * .06;
			child.scale.setScalar((Number(child.userData.baseScale) || 1) * pulse);
			child.rotation.y += delta * .45;
		});
	}
	reset() {
		this.instances.length = 0;
		[...this.transient.children, ...this.persistent.children].filter((child) => child instanceof Group).forEach((child) => this.release(child));
		this.persistentSignature = "";
		this.evidenceAsset = null;
	}
	dispose() {
		this.reset();
		const disposed = /* @__PURE__ */ new Set();
		const disposeGeometry = (root) => root.traverse((object) => {
			if (object instanceof Mesh && !disposed.has(object.geometry)) {
				disposed.add(object.geometry);
				object.geometry.dispose();
			}
		});
		this.pools.forEach((pool) => pool.forEach(disposeGeometry));
		this.pools.clear();
		this.materials.forEach((material) => material.dispose());
		this.materials.clear();
		this.textures.forEach((texture) => texture.dispose());
		this.textures.clear();
		this.root.removeFromParent();
	}
	attach(asset, position, scale = .72) {
		if (!position) return null;
		const model = this.acquire(asset);
		model.position.copy(position);
		model.scale.setScalar(scale);
		model.userData.baseScale = scale;
		model.userData.assetId = asset;
		model.userData.referencePath = SKILL_EFFECT_ASSET_REFERENCES[asset];
		this.persistent.add(model);
		return model;
	}
	acquire(asset) {
		const model = this.pools.get(asset)?.pop() ?? this.build(asset);
		model.visible = true;
		model.position.set(0, 0, 0);
		model.rotation.set(0, 0, 0);
		model.scale.setScalar(1);
		model.userData.assetId = asset;
		delete model.userData.anchorPosition;
		delete model.userData.cableId;
		delete model.userData.turnsRemaining;
		return model;
	}
	release(model) {
		const asset = model.userData.assetId;
		model.removeFromParent();
		model.visible = false;
		if (!asset) return;
		const pool = this.pools.get(asset) ?? [];
		if (!this.pools.has(asset)) this.pools.set(asset, pool);
		pool.push(model);
	}
	material(color, tint, emissive = 0, emissiveIntensity = 0, transparent = false, opacity = 1) {
		const material = cel({
			color,
			tint,
			emissive,
			emissiveIntensity,
			transparent,
			opacity,
			bands: 3
		});
		material.depthWrite = !transparent;
		this.materials.add(material);
		return material;
	}
	mesh(parent, name, geometry, material, position = [
		0,
		0,
		0
	], rotation = [
		0,
		0,
		0
	], scale = [
		1,
		1,
		1
	], outline = true) {
		const mesh = new Mesh(geometry, material);
		mesh.name = name;
		mesh.position.set(...position);
		mesh.rotation.set(...rotation);
		mesh.scale.set(...scale);
		mesh.castShadow = !material.transparent;
		if (outline) addHullOutline(mesh, .006);
		parent.add(mesh);
		return mesh;
	}
	ring(parent, name, radius, tube, material = this.yellow) {
		return this.mesh(parent, name, new TorusGeometry(radius, tube, 8, 32), material);
	}
	tube(parent, name, points, radius, material) {
		return this.mesh(parent, name, new TubeGeometry(new CatmullRomCurve3(points), 24, radius, 7, false), material);
	}
	heatTexture(kind) {
		const existing = kind === "core" ? this.heatCoreTexture : this.heatArcTexture;
		if (existing) return existing;
		const canvas = document.createElement("canvas");
		canvas.width = 128;
		canvas.height = 128;
		const context = canvas.getContext("2d");
		if (!context) throw new Error("Unable to create microwave marker texture.");
		context.clearRect(0, 0, 128, 128);
		if (kind === "core") {
			const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 62);
			gradient.addColorStop(0, "rgba(255,255,238,1)");
			gradient.addColorStop(.16, "rgba(255,225,130,0.98)");
			gradient.addColorStop(.42, "rgba(255,116,30,0.58)");
			gradient.addColorStop(1, "rgba(255,40,0,0)");
			context.fillStyle = gradient;
			context.fillRect(0, 0, 128, 128);
		} else {
			context.lineCap = "round";
			context.shadowColor = "rgba(255,132,34,0.42)";
			context.shadowBlur = 5;
			context.lineWidth = 18;
			context.strokeStyle = "rgba(50,30,58,0.96)";
			context.beginPath();
			context.arc(64, 64, 45, -Math.PI * .39, Math.PI * .39);
			context.stroke();
			context.shadowBlur = 0;
			context.lineWidth = 8;
			context.strokeStyle = "rgba(255,255,245,1)";
			context.beginPath();
			context.arc(64, 64, 45, -Math.PI * .39, Math.PI * .39);
			context.stroke();
		}
		const texture = new CanvasTexture(canvas);
		texture.name = `microwave-${kind}-texture`;
		texture.colorSpace = SRGBColorSpace;
		texture.needsUpdate = true;
		this.textures.add(texture);
		if (kind === "core") this.heatCoreTexture = texture;
		else this.heatArcTexture = texture;
		return texture;
	}
	sprite(parent, name, texture, color, size, opacity, rotation = 0, blending = 2) {
		const material = new SpriteMaterial({
			map: texture,
			color,
			opacity,
			transparent: true,
			depthTest: true,
			depthWrite: false,
			blending,
			rotation
		});
		this.materials.add(material);
		const sprite = new Sprite(material);
		sprite.name = name;
		sprite.scale.setScalar(size);
		sprite.userData.baseScale = size;
		sprite.renderOrder = 8;
		parent.add(sprite);
		return sprite;
	}
	texturedPlane(parent, name, texture, color, size, opacity, rotation = 0) {
		const geometry = new PlaneGeometry(1, 1);
		geometry.rotateX(Math.PI * .5);
		const material = new MeshBasicMaterial({
			map: texture,
			color,
			opacity,
			transparent: true,
			depthTest: true,
			depthWrite: false,
			side: 2,
			blending: 1
		});
		this.materials.add(material);
		const plane = new Mesh(geometry, material);
		plane.name = name;
		plane.scale.set(size, size, 1);
		plane.rotation.y = rotation;
		plane.userData.baseScale = size;
		plane.renderOrder = 8;
		parent.add(plane);
		return plane;
	}
	syncPersistentMarkerTransforms(cablePositions, cableOrientations, hintPositions, hintOrientations) {
		this.persistent.children.forEach((child) => {
			const cableId = String(child.userData.cableId ?? "");
			const popcornMarker = child.userData.assetId === "popcorn-target-marker";
			if (!popcornMarker && child.userData.assetId !== "microwave-double-heat-ring") return;
			const position = (popcornMarker ? hintPositions : cablePositions).get(cableId);
			const orientation = popcornMarker ? hintOrientations.get(cableId) : cableOrientations.get(cableId);
			if (position) child.position.copy(position);
			if (position && popcornMarker) child.userData.anchorPosition = position.clone();
			if (orientation) {
				child.quaternion.copy(popcornMarker ? popcornMarkerQuaternion(orientation) : orientation);
				if (popcornMarker) {
					child.userData.orientationMode = "plug-end";
					child.userData.hintDirection = new Vector3(0, 1, 0).applyQuaternion(orientation).normalize();
				}
			}
		});
	}
	updatePopcornMarker(root, elapsed) {
		const baseScale = Number(root.userData.baseScale) || 1;
		const anchor = root.userData.anchorPosition;
		if (anchor instanceof Vector3) {
			root.position.copy(anchor);
			root.position.addScaledVector(new Vector3(0, 0, 1).applyQuaternion(root.quaternion), Math.sin(elapsed * 3.8) * .055);
		}
		root.scale.setScalar(baseScale * (1 + Math.sin(elapsed * 4.6) * .035));
		const pivot = root.getObjectByName("pulse-pivot");
		if (pivot) pivot.rotation.z = Math.sin(elapsed * 2.7) * .045;
		this.posePopcornKernels(root, elapsed, 0);
		this.pulsePopcornAccents(root, elapsed, 0);
	}
	updatePopcornBurst(root, progress, elapsed, seed) {
		const burst = Math.sin(Math.PI * MathUtils.clamp(progress, 0, 1));
		const pivot = root.getObjectByName("pulse-pivot");
		if (pivot) {
			pivot.rotation.y = Math.sin(elapsed * 4.8 + seed) * .12;
			pivot.rotation.z = Math.sin(elapsed * 6.4 + seed) * .08;
		}
		this.posePopcornKernels(root, elapsed, burst * .38);
		this.pulsePopcornAccents(root, elapsed, burst * .72);
	}
	posePopcornKernels(root, elapsed, expansion) {
		root.getObjectByName("popcorn-kernels")?.children.forEach((kernel, index) => {
			const basePosition = kernel.userData.basePosition;
			if (!(basePosition instanceof Vector3)) return;
			const direction = basePosition.clone().setZ(0).normalize();
			kernel.position.copy(basePosition).addScaledVector(direction, expansion);
			kernel.position.y += Math.sin(elapsed * 5.2 + index * 1.9) * .045;
			kernel.rotation.z = Math.sin(elapsed * 4.1 + index * 1.4) * .11;
			kernel.scale.setScalar(1 + Math.sin(elapsed * 6.2 + index) * .035 + expansion * .3);
		});
	}
	pulsePopcornAccents(root, elapsed, burst) {
		const ring = root.getObjectByName("popcorn-target-ring");
		if (ring) ring.rotation.z = elapsed * .24;
		ring?.children.forEach((segment, index) => {
			const pulse = .9 + (Math.sin(elapsed * 5.4 - index * .78) + 1) * .08 + burst * .24;
			segment.scale.setScalar(pulse);
		});
		root.getObjectByName("popcorn-rays")?.children.forEach((ray, index) => {
			const pulse = Math.max(.55, .72 + Math.sin(elapsed * 6.8 - index * .95) * .18 + burst * .5);
			ray.scale.set(1, pulse, 1);
		});
	}
	updateMicrowaveMarker(root, elapsed) {
		const turns = Number(root.userData.turnsRemaining) || 2;
		const urgent = turns <= 1;
		const baseScale = Number(root.userData.baseScale) || 1;
		const pulseSpeed = urgent ? 5.2 : 3.4;
		const pulse = 1 + Math.sin(elapsed * pulseSpeed) * (urgent ? .065 : .038);
		root.scale.setScalar(baseScale * pulse);
		const core = root.getObjectByName("heat-core");
		const halo = root.getObjectByName("heat-halo");
		const chanceOne = root.getObjectByName("heat-chance-one");
		const chanceTwo = root.getObjectByName("heat-chance-two");
		if (core?.material instanceof SpriteMaterial) {
			core.material.color.set(urgent ? 16756896 : 16773296);
			core.material.opacity = urgent ? 1 : .9;
		}
		if (halo?.material instanceof SpriteMaterial) {
			halo.material.color.set(urgent ? 16725279 : 16742948);
			halo.material.opacity = (urgent ? .46 : .34) + Math.sin(elapsed * pulseSpeed) * .04;
			halo.material.rotation = -elapsed * (urgent ? .34 : .2);
		}
		[chanceOne, chanceTwo].forEach((chance, index) => {
			if (!(chance?.material instanceof MeshBasicMaterial)) return;
			chance.material.color.set(urgent ? 16726565 : 16751140);
			chance.material.opacity = 1;
			chance.rotation.y = (index === 0 ? 0 : Math.PI) + Math.sin(elapsed * 1.15) * .025;
			const chanceBaseScale = Number(chance.userData.baseScale) || 1;
			const chancePulse = index === 0 && urgent ? 1 + Math.sin(elapsed * 7.2) * .055 : 1;
			chance.scale.set(chanceBaseScale * chancePulse, chanceBaseScale * chancePulse, 1);
		});
		if (chanceTwo) chanceTwo.visible = turns > 1;
		const sparks = root.getObjectByName("heat-sparks");
		if (sparks) {
			sparks.rotation.z = elapsed * (urgent ? 1.15 : .72);
			sparks.children.forEach((spark, index) => {
				const sparkPulse = .72 + (Math.sin(elapsed * (4.2 + index * .17) + index) + 1) * .22;
				const sparkBaseScale = Number(spark.userData.baseScale) || .06;
				spark.scale.setScalar(sparkBaseScale * sparkPulse);
			});
		}
	}
	build(asset) {
		const root = new Group();
		const pivot = new Group();
		pivot.name = asset === "gacha-card-frame" ? "flip-pivot" : "pulse-pivot";
		root.add(pivot);
		const socket = new Object3D();
		socket.name = "attachment-socket";
		root.add(socket);
		switch (asset) {
			case "humidifier-glass-wiper":
				this.mesh(pivot, "wiper-glass-edge", new BoxGeometry(1.5, .22, .16, 3, 1, 1), this.ice, [
					0,
					.18,
					0
				]);
				this.mesh(pivot, "wiper-arm", new CapsuleGeometry(.11, .48, 4, 8), this.coral, [
					0,
					-.2,
					0
				], [
					0,
					0,
					Math.PI / 2
				]);
				break;
			case "fan-airflow-ribbon":
			case "kettle-steam-ribbon": {
				const material = asset === "fan-airflow-ribbon" ? this.ice : this.cream;
				this.tube(pivot, "flow-ribbon", [
					new Vector3(-.8, -.12, 0),
					new Vector3(-.3, .28, 0),
					new Vector3(.25, -.15, 0),
					new Vector3(.85, .18, 0)
				], .1, material);
				this.ring(pivot, "nozzle-socket-ring", .18, .06, this.coral).position.x = -.82;
				break;
			}
			case "bubble-shell-wave-membrane":
				this.mesh(pivot, "bubble-shell", new SphereGeometry(.68, 16, 10), this.bubble, [
					0,
					0,
					0
				], [
					0,
					0,
					0
				], [
					1,
					1,
					.42
				]);
				this.ring(pivot, "impact-wave", .84, .045, this.purple);
				this.mesh(pivot, "membrane", new CircleGeometry(.42, 24), this.bubble, [
					0,
					0,
					.08
				], [
					0,
					0,
					0
				], [
					1,
					1,
					1
				], false);
				break;
			case "radio-sequence-markers":
				[
					1,
					2,
					3
				].forEach((count, row) => Array.from({ length: count }, (_, index) => this.mesh(pivot, `marker-${row + 1}-${index + 1}`, new SphereGeometry(.1, 8, 6), this.teal, [
					(index - (count - 1) / 2) * .28,
					.36 - row * .36,
					0
				])));
				break;
			case "blender-energy-shards":
				[
					this.coral,
					this.teal,
					this.yellow,
					this.purple
				].forEach((material, index) => this.mesh(pivot, `energy-shard-${index + 1}`, new OctahedronGeometry(.24, 0), material, [
					(index - 1.5) * .34,
					Math.abs(index - 1.5) * -.12,
					0
				], [
					0,
					0,
					index * .4
				], [
					.65,
					1.5,
					.65
				]));
				break;
			case "gacha-card-frame":
				this.mesh(pivot, "card-frame", new BoxGeometry(.9, 1.25, .12), this.coral);
				this.mesh(pivot, "card-face", new BoxGeometry(.7, 1.02, .14), this.teal, [
					0,
					0,
					.05
				]);
				this.mesh(pivot, "card-emblem", new ExtrudeGeometry(heartShape(), {
					depth: .07,
					bevelEnabled: true,
					bevelSize: .03,
					bevelThickness: .03
				}), this.cream, [
					0,
					0,
					.14
				], [
					0,
					0,
					0
				], [
					.36,
					.36,
					.36
				]);
				break;
			case "alarm-time-ring":
				this.ring(pivot, "time-ring", .58, .1, this.teal);
				this.ring(pivot, "time-ripple", .82, .035, this.cream);
				for (let index = 0; index < 8; index += 1) {
					const angle = index * Math.PI / 4;
					this.mesh(pivot, `tick-${index + 1}`, new BoxGeometry(.08, .18, .08), this.coral, [
						Math.cos(angle) * .58,
						Math.sin(angle) * .58,
						0
					], [
						0,
						0,
						angle - Math.PI / 2
					]);
				}
				break;
			case "popcorn-target-marker": {
				pivot.position.z = .28;
				const kernels = new Group();
				kernels.name = "popcorn-kernels";
				pivot.add(kernels);
				Array.from({ length: 3 }, (_, index) => {
					const angle = Math.PI / 2 + index * Math.PI * 2 / 3;
					return [
						Math.cos(angle) * .26,
						Math.sin(angle) * .26,
						0
					];
				}).forEach((position, index) => {
					const kernel = new Group();
					kernel.name = `popcorn-kernel-${index + 1}`;
					kernel.position.set(...position);
					kernel.userData.basePosition = kernel.position.clone();
					kernels.add(kernel);
					[
						[
							-.08,
							.04,
							0
						],
						[
							.08,
							.05,
							.01
						],
						[
							0,
							.12,
							-.02
						],
						[
							0,
							-.03,
							.035
						]
					].forEach((offset, lobeIndex) => this.mesh(kernel, `popcorn-kernel-${index + 1}-lobe-${lobeIndex + 1}`, new DodecahedronGeometry(.105, 0), this.cream, offset, [
						0,
						lobeIndex * .42,
						lobeIndex * .31
					], [
						1,
						.86 + lobeIndex * .035,
						.92
					]));
					this.mesh(kernel, `popcorn-kernel-${index + 1}-core`, new CylinderGeometry(.085, .105, .13, 6), this.yellow, [
						0,
						-.09,
						0
					], [
						Math.PI / 2,
						0,
						0
					]);
				});
				const targetRing = new Group();
				targetRing.name = "popcorn-target-ring";
				pivot.add(targetRing);
				for (let index = 0; index < 8; index += 1) this.mesh(targetRing, `popcorn-ring-segment-${index + 1}`, new TorusGeometry(.54, .055, 6, 10, Math.PI * .18), index % 2 === 0 ? this.teal : this.yellow, [
					0,
					0,
					index % 2 === 0 ? -.025 : .025
				], [
					0,
					0,
					index * Math.PI / 4
				], [
					1,
					1,
					1
				]);
				const rays = new Group();
				rays.name = "popcorn-rays";
				pivot.add(rays);
				for (let index = 0; index < 6; index += 1) {
					const angle = index * Math.PI / 3;
					this.mesh(rays, `popcorn-ray-${index + 1}`, new BoxGeometry(.055, .2, .085), index % 2 === 0 ? this.coral : this.teal, [
						Math.cos(angle) * .75,
						Math.sin(angle) * .75,
						index % 2 === 0 ? -.035 : .035
					], [
						0,
						0,
						angle - Math.PI / 2
					], [
						1,
						1,
						1
					]);
				}
				break;
			}
			case "controller-impact-star":
				this.mesh(pivot, "impact-star", new ExtrudeGeometry(starShape(9), {
					depth: .12,
					bevelEnabled: true,
					bevelSize: .035,
					bevelThickness: .035
				}), this.coral, [
					0,
					0,
					-.06
				]);
				break;
			case "microwave-double-heat-ring": {
				this.sprite(pivot, "heat-halo", this.heatTexture("core"), 16739616, .9, .2);
				this.sprite(pivot, "heat-core", this.heatTexture("core"), 16773296, .42, .72);
				this.texturedPlane(pivot, "heat-chance-one", this.heatTexture("arc"), 16751140, 1.18, 1, 0);
				this.texturedPlane(pivot, "heat-chance-two", this.heatTexture("arc"), 16751140, 1.18, 1, Math.PI);
				const sparks = new Group();
				sparks.name = "heat-sparks";
				pivot.add(sparks);
				for (let index = 0; index < 6; index += 1) {
					const angle = index / 6 * Math.PI * 2 + .31;
					const radius = .66 + index % 2 * .055;
					this.sprite(sparks, `heat-spark-${index + 1}`, this.heatTexture("core"), index % 2 === 0 ? 16773258 : 16733480, .055 + index % 3 * .01, .68).position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, .02);
				}
				break;
			}
			case "induction-heat-ring":
				this.ring(pivot, "induction-ring-outer", .48, .08, this.coral);
				this.ring(pivot, "induction-ring-inner", .27, .045, this.yellow);
				break;
			case "speaker-bass-wave-arcs": [-1, 1].forEach((side) => [
				.38,
				.62,
				.86
			].forEach((radius, index) => {
				const curve = new EllipseCurve(0, 0, radius, radius, side < 0 ? Math.PI * .62 : -Math.PI * .38, side < 0 ? Math.PI * 1.38 : Math.PI * .38, false, 0);
				this.tube(pivot, `bass-arc-${side}-${index}`, curve.getPoints(18).map((point) => new Vector3(point.x, point.y, 0)), .055, index % 2 ? this.coral : this.teal);
			}));
		}
		return root;
	}
};
//#endregion
//#region src/skill/SoundWaveShieldPresentation.ts
var BOUNDS_PADDING$2 = 1.11;
var MINIMUM_RADIUS$2 = 1.25;
var ARM_DURATION$1 = POWERED_ACTIVE_DURATION;
var REMINDER_DURATION = 3.45;
var REMINDER_INTERVAL = 8.5;
var IMPACT_DURATION = .9;
var ARM_RING_CYCLES = 4;
var REMINDER_RING_CYCLES = 3;
function createMaterial$2(uniforms) {
	return new ShaderMaterial({
		name: "soothing-record-sound-wave-shield-material",
		uniforms: {
			uTime: uniforms.time,
			uVisibility: uniforms.visibility,
			uMode: uniforms.mode,
			uProgress: uniforms.progress,
			uImpactDirection: uniforms.impactDirection
		},
		vertexShader: `
      varying vec3 vWaveObjectPosition;
      varying vec3 vWaveWorldPosition;
      varying vec3 vWaveWorldNormal;

      void main() {
        vWaveObjectPosition = normalize(position);
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWaveWorldPosition = worldPosition.xyz;
        vWaveWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
		fragmentShader: `
      uniform float uTime;
      uniform float uVisibility;
      uniform float uMode;
      uniform float uProgress;
      uniform vec3 uImpactDirection;

      varying vec3 vWaveObjectPosition;
      varying vec3 vWaveWorldPosition;
      varying vec3 vWaveWorldNormal;

      void main() {
        vec3 direction = normalize(vWaveObjectPosition);
        vec3 viewDirection = normalize(cameraPosition - vWaveWorldPosition);
        float facing = clamp(abs(dot(normalize(vWaveWorldNormal), viewDirection)), 0.0, 1.0);
        float fresnel = pow(1.0 - facing, 2.45);
        float azimuth = atan(direction.z, direction.x);
        float wavePhase = direction.y * 5.4
          + sin(azimuth * 2.0 + uTime * 0.34) * 0.34
          - uTime * 0.82;
        float primaryWave = 1.0 - smoothstep(0.035, 0.14, abs(sin(wavePhase * 3.14159265)));
        float secondaryPhase = direction.y * 3.2
          - direction.x * 1.35
          + sin(azimuth * 3.0 - uTime * 0.21) * 0.22
          + uTime * 0.31;
        float secondaryWave = 1.0 - smoothstep(0.045, 0.18, abs(sin(secondaryPhase * 3.14159265)));
        float impactDistance = acos(clamp(dot(direction, normalize(uImpactDirection)), -1.0, 1.0));
        float impactRadius = mix(0.04, 2.45, smoothstep(0.0, 1.0, uProgress));
        float impactWidth = mix(0.18, 0.07, smoothstep(0.0, 0.65, uProgress));
        float impactRing = 1.0 - smoothstep(
          impactWidth * 0.35,
          impactWidth,
          abs(impactDistance - impactRadius)
        );
        impactRing *= uMode;
        float surface = fresnel * 0.4
          + primaryWave * (0.13 + fresnel * 0.18)
          + secondaryWave * (0.045 + fresnel * 0.08)
          + impactRing * (0.52 + fresnel * 0.34);
        vec3 mint = vec3(0.42, 0.88, 0.82);
        vec3 blush = vec3(0.98, 0.57, 0.7);
        vec3 cream = vec3(1.0, 0.93, 0.76);
        float colorPhase = 0.5 + 0.5 * sin(azimuth * 1.6 + direction.y * 3.2 - uTime * 0.18);
        vec3 waveColor = mix(mint, blush, colorPhase * 0.55);
        waveColor = mix(waveColor, cream, impactRing * 0.38);
        float alpha = surface * uVisibility;
        if (alpha < 0.003) discard;
        gl_FragColor = vec4(waveColor * (0.72 + surface * 0.48), clamp(alpha, 0.0, 0.5));
      }
    `,
		transparent: true,
		depthTest: true,
		depthWrite: false,
		side: 0,
		blending: 1
	});
}
var SoundWaveShieldPresentation = class {
	root = new Group();
	geometry = new SphereGeometry(1, 48, 32);
	uniforms = {
		time: { value: 0 },
		visibility: { value: 0 },
		mode: { value: 0 },
		progress: { value: 0 },
		impactDirection: { value: new Vector3(0, 0, 1) }
	};
	material = createMaterial$2(this.uniforms);
	mesh = new Mesh(this.geometry, this.material);
	bounds = new Box3();
	sphere = new Sphere();
	protectedState = false;
	phase = "idle";
	phaseStartedAt = 0;
	elapsed = 0;
	nextReminderAt = 0;
	reminderCount = 0;
	impactCount = 0;
	activationCount = 0;
	appearanceRingCycles = 0;
	surfaceRingProgress = 0;
	visibility = 0;
	radius = 0;
	targetCount = 0;
	constructor() {
		this.root.name = "soothing-record-sound-wave-shield";
		this.mesh.name = "soothing-record-transient-wave-shell";
		this.mesh.renderOrder = 19;
		this.mesh.visible = false;
		this.mesh.frustumCulled = false;
		this.root.add(this.mesh);
	}
	sync(active, targets) {
		const nextProtected = active && targets.length > 0;
		if (nextProtected) this.updateBounds(targets);
		if (nextProtected && !this.protectedState) {
			this.activationCount += 1;
			this.nextReminderAt = 0;
			this.reminderCount = 0;
			this.startPulse("arming");
		} else if (!nextProtected && this.protectedState && this.phase !== "impact") {
			this.nextReminderAt = 0;
			this.stopPulse();
		}
		this.protectedState = nextProtected;
		this.targetCount = nextProtected ? targets.length : 0;
	}
	retrigger(targets, protectedState = true) {
		if (targets.length === 0) return;
		this.updateBounds(targets);
		this.protectedState = protectedState;
		this.targetCount = targets.length;
		this.nextReminderAt = 0;
		this.activationCount += 1;
		this.startPulse("arming");
	}
	playImpact(worldPosition) {
		if (this.radius <= 0) return;
		this.impactCount += 1;
		this.uniforms.impactDirection.value.copy(worldPosition).sub(this.root.position);
		if (this.uniforms.impactDirection.value.lengthSq() < 1e-4) this.uniforms.impactDirection.value.set(0, 0, 1);
		else this.uniforms.impactDirection.value.normalize();
		this.startPulse("impact");
	}
	update(_delta, elapsed) {
		this.elapsed = elapsed;
		this.uniforms.time.value = elapsed;
		if (this.phase === "idle") {
			if (!this.protectedState) return;
			if (this.nextReminderAt <= 0) this.nextReminderAt = elapsed + REMINDER_INTERVAL;
			if (elapsed >= this.nextReminderAt) {
				this.reminderCount += 1;
				this.nextReminderAt = elapsed + REMINDER_INTERVAL;
				this.startPulse("reminder");
			}
			return;
		}
		const duration = this.phase === "impact" ? IMPACT_DURATION : this.phase === "reminder" ? REMINDER_DURATION : ARM_DURATION$1;
		const progress = MathUtils.clamp((elapsed - this.phaseStartedAt) / duration, 0, 1);
		this.appearanceRingCycles = this.phase === "arming" ? ARM_RING_CYCLES : this.phase === "reminder" ? REMINDER_RING_CYCLES : 1;
		this.surfaceRingProgress = progress >= 1 ? 1 : progress * this.appearanceRingCycles % 1;
		const enter = MathUtils.smoothstep(progress, 0, this.phase === "impact" ? .08 : .16);
		const exit = 1 - MathUtils.smoothstep(progress, this.phase === "impact" ? .48 : .42, 1);
		const peakVisibility = this.phase === "impact" ? .88 : this.phase === "reminder" ? .3 : .48;
		this.visibility = enter * exit * peakVisibility;
		this.uniforms.visibility.value = this.visibility;
		this.uniforms.mode.value = 1;
		this.uniforms.progress.value = this.surfaceRingProgress;
		this.mesh.scale.setScalar(this.phase === "impact" ? this.impactScale(progress) : this.phase === "reminder" ? .9 + (1 - (1 - progress) ** 3) * .12 + Math.sin(progress * Math.PI) * .018 : .8 + (1 - (1 - progress) ** 3) * .22 + Math.sin(progress * Math.PI) * .025);
		this.mesh.rotation.y = Math.sin(elapsed * .19) * .035;
		this.mesh.rotation.z = Math.sin(elapsed * .13 + 1.1) * .025;
		if (progress < 1) return;
		this.stopPulse();
	}
	reset() {
		this.protectedState = false;
		this.phase = "idle";
		this.phaseStartedAt = 0;
		this.elapsed = 0;
		this.nextReminderAt = 0;
		this.reminderCount = 0;
		this.impactCount = 0;
		this.activationCount = 0;
		this.appearanceRingCycles = 0;
		this.surfaceRingProgress = 0;
		this.visibility = 0;
		this.radius = 0;
		this.targetCount = 0;
		this.uniforms.visibility.value = 0;
		this.uniforms.mode.value = 0;
		this.uniforms.progress.value = 0;
		this.uniforms.impactDirection.value.set(0, 0, 1);
		this.mesh.visible = false;
		this.mesh.scale.setScalar(1);
	}
	dispose() {
		this.root.removeFromParent();
		this.geometry.dispose();
		this.material.dispose();
	}
	get diagnostics() {
		return {
			protected: this.protectedState,
			phase: this.phase,
			visible: this.mesh.visible,
			opacity: this.visibility,
			center: this.root.position.toArray(),
			radius: this.radius,
			targetCount: this.targetCount,
			depthWrite: this.material.depthWrite,
			idleVisibility: 0,
			persistentGeometry: false,
			waveBandMode: "spherical-latitude",
			impactProgress: this.phase === "impact" ? this.uniforms.progress.value : 0,
			reminderCount: this.reminderCount,
			impactCount: this.impactCount,
			reminderInterval: REMINDER_INTERVAL,
			secondsUntilReminder: this.protectedState && this.phase === "idle" ? Math.max(0, this.nextReminderAt - this.elapsed) : 0,
			appearanceRingCycles: this.appearanceRingCycles,
			surfaceRingProgress: this.surfaceRingProgress,
			activationCount: this.activationCount
		};
	}
	updateBounds(targets) {
		this.bounds.makeEmpty();
		targets.forEach((target) => {
			target.updateWorldMatrix(true, true);
			this.bounds.expandByObject(target, true);
		});
		if (this.bounds.isEmpty()) return;
		this.bounds.getBoundingSphere(this.sphere);
		this.radius = Math.max(MINIMUM_RADIUS$2, this.sphere.radius * BOUNDS_PADDING$2);
		this.root.position.copy(this.sphere.center);
		this.root.scale.setScalar(this.radius);
	}
	startPulse(phase) {
		this.phase = phase;
		this.phaseStartedAt = performance.now() / 1e3;
		this.visibility = 0;
		this.uniforms.visibility.value = 0;
		this.uniforms.mode.value = 1;
		this.uniforms.progress.value = 0;
		this.appearanceRingCycles = phase === "arming" ? ARM_RING_CYCLES : phase === "reminder" ? REMINDER_RING_CYCLES : 1;
		this.surfaceRingProgress = 0;
		if (phase !== "impact") this.uniforms.impactDirection.value.set(.44, .18, 1).normalize();
		this.mesh.visible = true;
		this.mesh.scale.setScalar(phase === "impact" ? 1 : phase === "reminder" ? .9 : .8);
	}
	stopPulse() {
		this.phase = "idle";
		this.phaseStartedAt = this.elapsed;
		this.visibility = 0;
		this.uniforms.visibility.value = 0;
		this.uniforms.mode.value = 0;
		this.uniforms.progress.value = 0;
		this.appearanceRingCycles = 0;
		this.surfaceRingProgress = 0;
		this.mesh.visible = false;
	}
	impactScale(progress) {
		if (progress < .18) return MathUtils.lerp(1, .91, progress / .18);
		if (progress < .48) return MathUtils.lerp(.91, 1.07, (progress - .18) / .3);
		return MathUtils.lerp(1.07, 1, (progress - .48) / .52);
	}
};
//#endregion
//#region src/skill/DehumidifierDryShieldPresentation.ts
var BOUNDS_PADDING$1 = 1.12;
var MINIMUM_RADIUS$1 = 1.25;
var ARM_DURATION = POWERED_ACTIVE_DURATION;
var TURN_PULSE_DURATION = 1.55;
var ABSORB_DURATION = 1.05;
var ARM_SWEEP_CYCLES = 3;
function createMaterial$1(uniforms) {
	return new ShaderMaterial({
		name: "dehumidifier-directional-dry-air-membrane-material",
		uniforms: {
			uTime: uniforms.time,
			uVisibility: uniforms.visibility,
			uProgress: uniforms.progress,
			uMode: uniforms.mode,
			uDrainDirection: uniforms.drainDirection
		},
		vertexShader: `
      uniform float uTime;
      uniform float uVisibility;
      uniform vec3 uDrainDirection;

      varying vec3 vDryObjectPosition;
      varying vec3 vDryWorldPosition;
      varying vec3 vDryWorldNormal;

      void main() {
        vec3 direction = normalize(position);
        vec3 drainDirection = normalize(uDrainDirection);
        float drainAxis = dot(direction, drainDirection);
        vec3 lateralDirection = direction - drainDirection * drainAxis;
        float outletTaper = mix(1.06, 0.72, smoothstep(-0.5, 1.0, drainAxis));
        vec3 canopyPosition = lateralDirection * outletTaper
          + drainDirection * drainAxis * 1.08;
        float airRipple = sin(
          direction.x * 5.2
          + direction.y * 6.7
          - direction.z * 4.1
          + uTime * 0.72
        ) * 0.004 * uVisibility;
        vec3 displaced = canopyPosition + normalize(canopyPosition) * airRipple;
        vDryObjectPosition = normalize(position);
        vec4 worldPosition = modelMatrix * vec4(displaced, 1.0);
        vDryWorldPosition = worldPosition.xyz;
        vDryWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
		fragmentShader: `
      uniform float uTime;
      uniform float uVisibility;
      uniform float uProgress;
      uniform float uMode;
      uniform vec3 uDrainDirection;

      varying vec3 vDryObjectPosition;
      varying vec3 vDryWorldPosition;
      varying vec3 vDryWorldNormal;

      float hash21(vec2 point) {
        return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453123);
      }

      void main() {
        const float PI = 3.14159265359;
        vec3 direction = normalize(vDryObjectPosition);
        vec3 drainDirection = normalize(uDrainDirection);
        vec3 helper = abs(drainDirection.y) > 0.88 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
        vec3 tangent = normalize(cross(helper, drainDirection));
        vec3 bitangent = normalize(cross(drainDirection, tangent));
        float axis = dot(direction, drainDirection);
        float azimuth = atan(dot(direction, bitangent), dot(direction, tangent));
        vec2 moistureUv = vec2(azimuth / (PI * 2.0) + 0.5, axis * 0.5 + 0.5);

        float outletMask = 1.0 - smoothstep(0.46, 0.84, axis);
        float panelField = abs(cos(azimuth * 1.5 + 0.32));
        float panelMask = smoothstep(0.16, 0.38, panelField) * outletMask;
        float panelEdge = 1.0 - smoothstep(0.045, 0.13, abs(panelField - 0.3));
        panelEdge *= outletMask;

        float sweepCenter = mix(-1.14, 0.78, uProgress);
        float airflowPacket = 1.0 - smoothstep(0.08, 0.28, abs(axis - sweepCenter));
        float airflowLanes = pow(
          0.5 + 0.5 * cos(azimuth * 7.0 + axis * 4.6 - uTime * 0.24),
          12.0
        );
        float airflowRibbon = airflowPacket * (0.28 + airflowLanes * 0.72) * panelMask;
        float trailingStream = 1.0 - smoothstep(0.04, 0.16, abs(axis - (sweepCenter - 0.2)));
        trailingStream *= airflowLanes * panelMask;
        float wetAhead = smoothstep(sweepCenter - 0.06, sweepCenter + 0.2, axis);

        vec2 gridSize = vec2(22.0, 13.0);
        vec2 driftingUv = moistureUv;
        driftingUv.y -= uTime * mix(0.018, 0.052, smoothstep(-0.2, 0.95, axis));
        vec2 cellId = floor(driftingUv * gridSize);
        vec2 cell = fract(driftingUv * gridSize) - 0.5;
        float randomValue = hash21(cellId);
        cell.x += (randomValue - 0.5) * 0.38;
        cell.y += sin(uTime * (0.45 + randomValue * 0.4) + randomValue * 9.0) * 0.08;
        float droplet = 1.0 - smoothstep(0.07, 0.17, length(cell * vec2(1.35, 0.72)));
        droplet *= step(0.56, randomValue) * wetAhead;

        float suctionChannels = pow(0.5 + 0.5 * sin(azimuth * 11.0 + axis * 3.2 + uTime * 0.42), 10.0);
        suctionChannels *= smoothstep(-0.18, 0.78, axis) * panelMask;
        float clearedWake = 1.0 - wetAhead;

        vec3 viewDirection = normalize(cameraPosition - vDryWorldPosition);
        float facing = clamp(abs(dot(normalize(vDryWorldNormal), viewDirection)), 0.0, 1.0);
        float fresnel = pow(1.0 - facing, 2.65);
        float absorbFocus = uMode > 1.5
          ? pow(smoothstep(0.12, 1.0, axis), 2.4) * smoothstep(0.2, 1.0, uProgress)
          : 0.0;

        vec3 dryCyan = vec3(0.48, 0.88, 0.93);
        vec3 cleanWhite = vec3(0.93, 0.98, 0.95);
        vec3 condensedBlue = vec3(0.32, 0.69, 0.86);
        vec3 color = mix(dryCyan, cleanWhite, clearedWake * 0.54 + airflowRibbon * 0.46);
        color = mix(color, condensedBlue, droplet * 0.7 + suctionChannels * 0.32);

        float surface = panelMask * fresnel * 0.055
          + panelEdge * (0.08 + fresnel * 0.08)
          + airflowRibbon * (0.38 + fresnel * 0.18)
          + trailingStream * 0.13
          + droplet * panelMask * (0.24 + fresnel * 0.1)
          + suctionChannels * (0.14 + airflowRibbon * 0.08)
          + absorbFocus * 0.3;
        float alpha = surface * uVisibility;
        if (alpha < 0.003) discard;
        gl_FragColor = vec4(color * (0.78 + surface * 0.52), clamp(alpha, 0.0, 0.42));
      }
    `,
		transparent: true,
		depthTest: true,
		depthWrite: false,
		side: 0,
		blending: 1
	});
}
var DehumidifierDryShieldPresentation = class {
	root = new Group();
	geometry = new SphereGeometry(1, 48, 32);
	uniforms = {
		time: { value: 0 },
		visibility: { value: 0 },
		progress: { value: 0 },
		mode: { value: 0 },
		drainDirection: { value: new Vector3(.7, -.18, .69).normalize() }
	};
	material = createMaterial$1(this.uniforms);
	mesh = new Mesh(this.geometry, this.material);
	bounds = new Box3();
	sphere = new Sphere();
	protectedState = false;
	phase = "idle";
	phaseStartedAt = 0;
	elapsed = 0;
	visibility = 0;
	radius = 0;
	targetCount = 0;
	turnsRemaining = null;
	sweepCycles = 0;
	sweepProgress = 0;
	turnPulseCount = 0;
	absorbCount = 0;
	activationCount = 0;
	constructor() {
		this.root.name = "dehumidifier-dry-air-shield";
		this.mesh.name = "dehumidifier-transient-moisture-extraction-membrane";
		this.mesh.renderOrder = 19;
		this.mesh.visible = false;
		this.mesh.frustumCulled = false;
		this.root.add(this.mesh);
	}
	sync(active, turnsRemaining, targets, sourcePosition, absorbed = false) {
		const nextProtected = active && targets.length > 0;
		if (nextProtected) {
			this.updateBounds(targets);
			this.updateDrainDirection(sourcePosition);
		}
		if (nextProtected && !this.protectedState) {
			this.activationCount += 1;
			this.turnsRemaining = turnsRemaining;
			this.startPulse("arming");
		} else if (nextProtected && this.protectedState && typeof turnsRemaining === "number" && typeof this.turnsRemaining === "number" && turnsRemaining < this.turnsRemaining) {
			this.turnPulseCount += 1;
			this.turnsRemaining = turnsRemaining;
			this.startPulse("turn-pulse");
		} else if (!nextProtected && this.protectedState) {
			this.turnsRemaining = null;
			if (absorbed) {
				this.absorbCount += 1;
				this.startPulse("absorb");
			} else this.stopPulse();
		} else if (nextProtected) this.turnsRemaining = turnsRemaining;
		this.protectedState = nextProtected;
		this.targetCount = nextProtected ? targets.length : 0;
	}
	retrigger(turnsRemaining, targets, sourcePosition, protectedState = true) {
		if (targets.length === 0) return;
		this.updateBounds(targets);
		this.updateDrainDirection(sourcePosition);
		this.protectedState = protectedState;
		this.turnsRemaining = protectedState ? turnsRemaining : null;
		this.targetCount = targets.length;
		this.activationCount += 1;
		this.startPulse("arming");
	}
	update(_delta, elapsed) {
		this.elapsed = elapsed;
		this.uniforms.time.value = elapsed;
		if (this.phase === "idle") return;
		const duration = this.phase === "arming" ? ARM_DURATION : this.phase === "turn-pulse" ? TURN_PULSE_DURATION : ABSORB_DURATION;
		const progress = MathUtils.clamp((elapsed - this.phaseStartedAt) / duration, 0, 1);
		this.sweepCycles = this.phase === "arming" ? ARM_SWEEP_CYCLES : 1;
		this.sweepProgress = progress >= 1 ? 1 : progress * this.sweepCycles % 1;
		const enter = MathUtils.smoothstep(progress, 0, this.phase === "absorb" ? .06 : .12);
		const exit = 1 - MathUtils.smoothstep(progress, this.phase === "arming" ? .78 : .55, 1);
		const peakVisibility = this.phase === "arming" ? .86 : this.phase === "turn-pulse" ? .68 : .92;
		this.visibility = enter * exit * peakVisibility;
		this.uniforms.visibility.value = this.visibility;
		this.uniforms.progress.value = this.sweepProgress;
		this.uniforms.mode.value = this.phase === "arming" ? 0 : this.phase === "turn-pulse" ? 1 : 2;
		const pulse = Math.sin(progress * Math.PI);
		this.mesh.scale.setScalar(this.phase === "arming" ? MathUtils.lerp(.9, 1, MathUtils.smoothstep(progress, 0, .32)) + pulse * .008 : this.phase === "turn-pulse" ? .985 + pulse * .018 : MathUtils.lerp(1.01, .94, progress));
		if (progress >= 1) this.stopPulse();
	}
	reset() {
		this.protectedState = false;
		this.phase = "idle";
		this.phaseStartedAt = 0;
		this.elapsed = 0;
		this.visibility = 0;
		this.radius = 0;
		this.targetCount = 0;
		this.turnsRemaining = null;
		this.sweepCycles = 0;
		this.sweepProgress = 0;
		this.turnPulseCount = 0;
		this.absorbCount = 0;
		this.activationCount = 0;
		this.uniforms.visibility.value = 0;
		this.uniforms.progress.value = 0;
		this.uniforms.mode.value = 0;
		this.uniforms.drainDirection.value.set(.7, -.18, .69).normalize();
		this.mesh.visible = false;
		this.mesh.scale.setScalar(1);
	}
	dispose() {
		this.root.removeFromParent();
		this.geometry.dispose();
		this.material.dispose();
	}
	get diagnostics() {
		return {
			protected: this.protectedState,
			phase: this.phase,
			visible: this.mesh.visible,
			opacity: this.visibility,
			center: this.root.position.toArray(),
			radius: this.radius,
			targetCount: this.targetCount,
			turnsRemaining: this.turnsRemaining,
			depthWrite: this.material.depthWrite,
			idleVisibility: 0,
			persistentGeometry: false,
			behavior: "directional-moisture-extraction",
			moisturePattern: "condense-and-drain",
			shieldShape: "open-three-panel-air-canopy",
			airflowMode: "directional-stream-ribbons",
			outletOpen: true,
			sweepCycles: this.sweepCycles,
			sweepProgress: this.sweepProgress,
			turnPulseCount: this.turnPulseCount,
			absorbCount: this.absorbCount,
			activationCount: this.activationCount,
			drainDirection: this.uniforms.drainDirection.value.toArray()
		};
	}
	get petalFlow() {
		const active = this.mesh.visible && this.phase !== "idle";
		return {
			active,
			center: this.root.position,
			direction: this.uniforms.drainDirection.value,
			radius: this.radius,
			strength: active ? Math.max(.08, this.visibility) : 0
		};
	}
	updateBounds(targets) {
		this.bounds.makeEmpty();
		targets.forEach((target) => {
			target.updateWorldMatrix(true, true);
			this.bounds.expandByObject(target, true);
		});
		if (this.bounds.isEmpty()) return;
		this.bounds.getBoundingSphere(this.sphere);
		this.radius = Math.max(MINIMUM_RADIUS$1, this.sphere.radius * BOUNDS_PADDING$1);
		this.root.position.copy(this.sphere.center);
		this.root.scale.setScalar(this.radius);
	}
	updateDrainDirection(sourcePosition) {
		if (!sourcePosition) return;
		this.uniforms.drainDirection.value.copy(sourcePosition).sub(this.root.position);
		if (this.uniforms.drainDirection.value.lengthSq() < 1e-4) this.uniforms.drainDirection.value.set(.7, -.18, .69);
		this.uniforms.drainDirection.value.normalize();
	}
	startPulse(phase) {
		this.phase = phase;
		this.phaseStartedAt = this.elapsed;
		this.visibility = 0;
		this.sweepCycles = phase === "arming" ? ARM_SWEEP_CYCLES : 1;
		this.sweepProgress = 0;
		this.uniforms.visibility.value = 0;
		this.uniforms.progress.value = 0;
		this.uniforms.mode.value = phase === "arming" ? 0 : phase === "turn-pulse" ? 1 : 2;
		this.mesh.visible = true;
		this.mesh.scale.setScalar(phase === "arming" ? .9 : 1);
	}
	stopPulse() {
		this.phase = "idle";
		this.phaseStartedAt = this.elapsed;
		this.visibility = 0;
		this.sweepCycles = 0;
		this.sweepProgress = 0;
		this.uniforms.visibility.value = 0;
		this.uniforms.progress.value = 0;
		this.uniforms.mode.value = 0;
		this.mesh.visible = false;
		this.mesh.scale.setScalar(1);
	}
};
var PORTABLE_SPEAKER_SPACING_RELEASE_DURATION = .72;
var PORTABLE_SPEAKER_MAX_EXTRA_GAP = .52;
var PORTABLE_SPEAKER_MIN_EXTRA_GAP = .08;
function smooth$1(progress) {
	const clamped = MathUtils.clamp(progress, 0, 1);
	return clamped * clamped * (3 - 2 * clamped);
}
function segmentDistanceSq(a, b) {
	const u = a.end.clone().sub(a.start);
	const v = b.end.clone().sub(b.start);
	const w = a.start.clone().sub(b.start);
	const aa = u.dot(u);
	const bb = u.dot(v);
	const cc = v.dot(v);
	const dd = u.dot(w);
	const ee = v.dot(w);
	const denominator = aa * cc - bb * bb;
	let sNumerator = denominator;
	let sDenominator = denominator;
	let tNumerator = denominator;
	let tDenominator = denominator;
	if (denominator < 1e-9) {
		sNumerator = 0;
		sDenominator = 1;
		tNumerator = ee;
		tDenominator = cc;
	} else {
		sNumerator = bb * ee - cc * dd;
		tNumerator = aa * ee - bb * dd;
		if (sNumerator < 0) {
			sNumerator = 0;
			tNumerator = ee;
			tDenominator = cc;
		} else if (sNumerator > sDenominator) {
			sNumerator = sDenominator;
			tNumerator = ee + bb;
			tDenominator = cc;
		}
	}
	if (tNumerator < 0) {
		tNumerator = 0;
		if (-dd < 0) sNumerator = 0;
		else if (-dd > aa) sNumerator = sDenominator;
		else {
			sNumerator = -dd;
			sDenominator = aa;
		}
	} else if (tNumerator > tDenominator) {
		tNumerator = tDenominator;
		if (-dd + bb < 0) sNumerator = 0;
		else if (-dd + bb > aa) sNumerator = sDenominator;
		else {
			sNumerator = -dd + bb;
			sDenominator = aa;
		}
	}
	const sc = Math.abs(sNumerator) < 1e-9 ? 0 : sNumerator / sDenominator;
	const tc = Math.abs(tNumerator) < 1e-9 ? 0 : tNumerator / tDenominator;
	return w.addScaledVector(u, sc).addScaledVector(v, -tc).lengthSq();
}
function surfaceGap(a, b) {
	let nearest = Number.POSITIVE_INFINITY;
	for (const left of a.clearanceSegments) for (const right of b.clearanceSegments) nearest = Math.min(nearest, Math.sqrt(segmentDistanceSq(left, right)) - left.radius - right.radius);
	return nearest;
}
function portableSpeakerSpacingMultiplierAt(time) {
	const clampedTime = MathUtils.clamp(time, 0, PORTABLE_SPEAKER_ACTIVE_DURATION);
	const beatCount = PORTABLE_SPEAKER_BASS_BEATS.length;
	let multiplier = 1;
	for (let index = 0; index < beatCount; index += 1) {
		const beat = PORTABLE_SPEAKER_BASS_BEATS[index];
		const previous = 1 + index / beatCount;
		const next = 1 + (index + 1) / beatCount;
		const compression = .075 + beat.strength * .035 + index / beatCount * .045;
		const compressed = Math.max(.92, previous - compression);
		const overshoot = next + .035 + beat.strength * .025;
		const localTime = clampedTime - beat.time;
		if (localTime < -.11) break;
		if (localTime < 0) {
			multiplier = MathUtils.lerp(previous, compressed, smooth$1((localTime + .11) / .11));
			break;
		}
		if (localTime < .105) {
			multiplier = MathUtils.lerp(compressed, overshoot, smooth$1(localTime / .105));
			break;
		}
		if (localTime < .24) {
			multiplier = MathUtils.lerp(overshoot, next, smooth$1((localTime - .105) / .135));
			break;
		}
		multiplier = next;
	}
	return MathUtils.clamp(multiplier, .92, 2.08);
}
var PortableSpeakerSpacingPresentation = class {
	phaseValue = "idle";
	timeline = 0;
	multiplier = 1;
	releaseStartMultiplier = 1;
	releaseElapsed = 0;
	wallStartedAt = 0;
	releaseWallStartedAt = 0;
	referenceSurfaceGap = 0;
	geometryTargets = [];
	baseOffsets = /* @__PURE__ */ new Map();
	targets = /* @__PURE__ */ new Map();
	workingOffset = new Vector3();
	get durationMs() {
		return PORTABLE_SPEAKER_ACTIVE_DURATION * 1e3;
	}
	get phase() {
		return this.phaseValue;
	}
	get diagnostics() {
		let maxOffset = 0;
		for (const offset of this.baseOffsets.values()) maxOffset = Math.max(maxOffset, offset.length() * Math.max(0, this.multiplier - 1));
		return {
			phase: this.phaseValue,
			timeline: this.timeline,
			multiplier: this.multiplier,
			targetCount: this.baseOffsets.size,
			maxOffset,
			referenceSurfaceGap: this.referenceSurfaceGap,
			spacingRatio: this.multiplier
		};
	}
	start(targets) {
		this.captureTargets(targets);
		this.phaseValue = "pulsing";
		this.timeline = 0;
		this.multiplier = 1;
		this.releaseElapsed = 0;
		this.wallStartedAt = performance.now() * .001;
		this.applyOffsets();
		return this.durationMs;
	}
	sync(active, targets) {
		this.setTargets(targets);
		if (active) {
			if (this.phaseValue === "idle" || this.phaseValue === "releasing") {
				this.start(targets);
				return;
			}
			this.applyOffsets();
			return;
		}
		if (this.phaseValue === "idle" || this.phaseValue === "releasing") return;
		this.phaseValue = "releasing";
		this.releaseStartMultiplier = this.multiplier;
		this.releaseElapsed = 0;
		this.releaseWallStartedAt = performance.now() * .001;
	}
	update(delta, targets) {
		if (targets) this.setTargets(targets);
		const safeDelta = Math.max(0, delta);
		if (this.phaseValue === "pulsing") {
			const wallTimeline = Math.max(0, performance.now() * .001 - this.wallStartedAt);
			this.timeline = Math.min(PORTABLE_SPEAKER_ACTIVE_DURATION, Math.max(this.timeline + safeDelta, wallTimeline));
			this.multiplier = portableSpeakerSpacingMultiplierAt(this.timeline);
			if (this.timeline >= 5.45) {
				this.phaseValue = "holding";
				this.multiplier = 2;
			}
		} else if (this.phaseValue === "holding") this.multiplier = 2;
		else if (this.phaseValue === "releasing") {
			const wallReleaseElapsed = Math.max(0, performance.now() * .001 - this.releaseWallStartedAt);
			this.releaseElapsed = Math.min(PORTABLE_SPEAKER_SPACING_RELEASE_DURATION, Math.max(this.releaseElapsed + safeDelta, wallReleaseElapsed));
			const progress = smooth$1(this.releaseElapsed / PORTABLE_SPEAKER_SPACING_RELEASE_DURATION);
			this.multiplier = MathUtils.lerp(this.releaseStartMultiplier, 1, progress);
			if (this.releaseElapsed >= .72) {
				this.phaseValue = "idle";
				this.timeline = 0;
				this.multiplier = 1;
				this.baseOffsets.clear();
			}
		}
		this.applyOffsets();
	}
	reset(targets) {
		if (targets) this.setTargets(targets);
		this.multiplier = 1;
		this.applyOffsets();
		this.phaseValue = "idle";
		this.timeline = 0;
		this.releaseStartMultiplier = 1;
		this.releaseElapsed = 0;
		this.wallStartedAt = 0;
		this.releaseWallStartedAt = 0;
		this.referenceSurfaceGap = 0;
		this.geometryTargets = [];
		this.baseOffsets.clear();
		this.targets.clear();
	}
	captureTargets(targets) {
		this.targets.clear();
		this.baseOffsets.clear();
		this.geometryTargets = targets;
		if (targets.length === 0) return;
		const bundleCenter = targets.reduce((center, target) => center.add(target.center), new Vector3()).multiplyScalar(1 / targets.length);
		const nearestGaps = new Map(targets.map((target) => [target.id, Number.POSITIVE_INFINITY]));
		for (let left = 0; left < targets.length; left += 1) for (let right = left + 1; right < targets.length; right += 1) {
			const gap = surfaceGap(targets[left], targets[right]);
			if (!Number.isFinite(gap) || gap <= 0) continue;
			nearestGaps.set(targets[left].id, Math.min(nearestGaps.get(targets[left].id), gap));
			nearestGaps.set(targets[right].id, Math.min(nearestGaps.get(targets[right].id), gap));
		}
		const finiteGaps = [...nearestGaps.values()].filter(Number.isFinite).sort((a, b) => a - b);
		const medianGap = finiteGaps.length > 0 ? finiteGaps[Math.floor((finiteGaps.length - 1) / 2)] : 0;
		this.referenceSurfaceGap = MathUtils.clamp(medianGap || .08, PORTABLE_SPEAKER_MIN_EXTRA_GAP, PORTABLE_SPEAKER_MAX_EXTRA_GAP);
		for (const target of targets) {
			this.targets.set(target.id, target);
			const direction = new Vector3();
			targets.forEach((other) => {
				if (other.id === target.id) return;
				const gap = surfaceGap(target, other);
				if (!Number.isFinite(gap)) return;
				const away = target.center.clone().sub(other.center);
				if (away.lengthSq() < 1e-8) return;
				direction.addScaledVector(away.normalize(), 1 / Math.max(gap, PORTABLE_SPEAKER_MIN_EXTRA_GAP));
			});
			if (direction.lengthSq() < 1e-8) direction.copy(target.center).sub(bundleCenter);
			if (direction.lengthSq() < 1e-8) direction.set(1, 0, 0);
			this.baseOffsets.set(target.id, direction.normalize().multiplyScalar(this.referenceSurfaceGap * .5));
		}
	}
	setTargets(targets) {
		if (!this.sameGeometry(targets)) this.captureTargets(targets);
	}
	sameGeometry(targets) {
		if (targets === this.geometryTargets) return true;
		if (targets.length !== this.geometryTargets.length) return false;
		for (let index = 0; index < targets.length; index += 1) {
			const previous = this.geometryTargets[index];
			const next = targets[index];
			if (!previous || previous.id !== next.id || previous.center !== next.center || previous.clearanceSegments !== next.clearanceSegments) return false;
		}
		return true;
	}
	applyOffsets() {
		const amount = this.multiplier - 1;
		for (const [id, target] of this.targets) {
			const baseOffset = this.baseOffsets.get(id);
			target.setOffset(baseOffset ? this.workingOffset.copy(baseOffset).multiplyScalar(amount) : this.workingOffset.set(0, 0, 0));
		}
	}
};
//#endregion
//#region src/systems/GameSettings.ts
var GameSettings = class {
	trigger = document.createElement("button");
	dialog = document.createElement("dialog");
	restoredElements = [];
	constructor(toolbar) {
		this.trigger.id = "settings-button";
		this.trigger.type = "button";
		this.trigger.setAttribute("aria-haspopup", "dialog");
		this.trigger.setAttribute("aria-controls", "settings-dialog");
		this.trigger.setAttribute("aria-expanded", "false");
		this.trigger.append(createElement(Settings2, {
			width: 20,
			height: 20,
			"aria-hidden": "true"
		}));
		this.dialog.id = "settings-dialog";
		this.dialog.setAttribute("aria-labelledby", "settings-title");
		this.dialog.innerHTML = `
      <div class="settings-sheet">
        <header class="settings-heading">
          <div><span>PLUG SPIRITS</span><h2 id="settings-title"></h2></div>
          <button id="settings-close-button" type="button" autofocus></button>
        </header>
        <section id="settings-preferences" aria-labelledby="settings-preferences-title">
          <h3 id="settings-preferences-title"></h3>
        </section>
        <section id="settings-gameplay" aria-labelledby="settings-gameplay-title">
          <h3 id="settings-gameplay-title"></h3>
        </section>
        <section id="settings-help" aria-labelledby="settings-help-title">
          <h3 id="settings-help-title"></h3>
        </section>
        <p id="settings-rush-notice"></p>
        <button id="settings-done-button" type="button"></button>
      </div>`;
		this.dialog.querySelector("#settings-close-button").append(createElement(X, {
			width: 20,
			height: 20,
			"aria-hidden": "true"
		}));
		this.move(toolbar, this.dialog.querySelector("#settings-preferences"));
		for (const [selector, key] of [
			["#season-picker", "season"],
			["#theme-button", "theme"],
			["#audio-button", "audio"],
			["#language-button", "language"]
		]) {
			const control = toolbar.querySelector(selector);
			const wrapper = document.createElement("div");
			wrapper.className = "settings-preference";
			const label = document.createElement("span");
			label.dataset.settingsLabel = key;
			if (key === "season") {
				control.classList.add("settings-preference");
				control.prepend(label);
			} else {
				control.before(wrapper);
				wrapper.append(label, control);
			}
		}
		const actions = document.querySelector("#game-actions");
		this.move(actions, this.dialog.querySelector("#settings-gameplay"));
		const gallery = actions.querySelector("#appliance-gallery-button");
		if (gallery) this.move(gallery, this.dialog.querySelector("#settings-preferences"));
		this.move(document.querySelector("#hint-button"), actions);
		this.move(document.querySelector("#help-strip"), this.dialog.querySelector("#settings-help"));
		this.trigger.addEventListener("click", this.open);
		this.dialog.addEventListener("click", this.onClick, true);
		this.dialog.addEventListener("close", this.onClose);
		this.dialog.addEventListener("keydown", this.onKeyDown);
		document.querySelector("#app").append(this.trigger, this.dialog);
		this.refreshLocale();
	}
	refreshLocale() {
		const english = getLocale() === "en";
		const copy = english ? {
			title: "Settings",
			preferences: "SOUND & APPEARANCE",
			gameplay: "THIS GAME",
			help: "HOW TO PLAY",
			season: "Season",
			theme: "Day / night",
			audio: "Sound",
			language: "Language",
			done: "Back to game",
			close: "Close settings",
			rush: "The RUSH timer keeps running while settings are open."
		} : {
			title: "设置",
			preferences: "声音与画面",
			gameplay: "游戏操作",
			help: "操作说明",
			season: "季节",
			theme: "昼夜",
			audio: "声音",
			language: "语言",
			done: "返回游戏",
			close: "关闭设置",
			rush: "限时挑战的倒计时在设置打开时继续运行。"
		};
		this.trigger.title = copy.title;
		this.trigger.setAttribute("aria-label", copy.title);
		for (const [id, text] of [
			["settings-title", copy.title],
			["settings-preferences-title", copy.preferences],
			["settings-gameplay-title", copy.gameplay],
			["settings-help-title", copy.help],
			["settings-done-button", copy.done],
			["settings-rush-notice", copy.rush]
		]) this.dialog.querySelector(`#${id}`).textContent = text;
		this.dialog.querySelector("#settings-close-button").setAttribute("aria-label", copy.close);
		this.dialog.querySelectorAll("[data-settings-label]").forEach((label) => {
			label.textContent = copy[label.dataset.settingsLabel];
		});
		this.dialog.querySelector("#reset-view-button").textContent = english ? "Reset view" : "重置视角";
	}
	dispose() {
		this.trigger.removeEventListener("click", this.open);
		this.dialog.removeEventListener("click", this.onClick, true);
		this.dialog.removeEventListener("close", this.onClose);
		this.dialog.removeEventListener("keydown", this.onKeyDown);
		this.dialog.close();
		for (const { element, marker } of this.restoredElements.reverse()) marker.replaceWith(element);
		this.trigger.remove();
		this.dialog.remove();
	}
	move(element, destination) {
		const marker = document.createTextNode("");
		element.before(marker);
		this.restoredElements.push({
			element,
			marker
		});
		destination.append(element);
	}
	open = () => {
		if (this.dialog.open) return;
		this.refreshLocale();
		this.dialog.showModal();
		this.trigger.setAttribute("aria-expanded", "true");
	};
	onClose = () => {
		this.trigger.setAttribute("aria-expanded", "false");
		this.dialog.querySelector("#season-menu")?.classList.remove("visible");
		this.dialog.querySelector("#season-menu")?.setAttribute("aria-hidden", "true");
		this.dialog.querySelector("#season-button")?.setAttribute("aria-expanded", "false");
		if (document.activeElement === document.body || this.dialog.contains(document.activeElement)) this.trigger.focus({ preventScroll: true });
	};
	onKeyDown = (event) => {
		if (event.key !== "Tab") return;
		const buttons = [...this.dialog.querySelectorAll("button:not(:disabled)")].filter((button) => button.getClientRects().length > 0 && getComputedStyle(button).visibility !== "hidden");
		const first = buttons[0];
		const last = buttons[buttons.length - 1];
		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last?.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first?.focus();
		}
	};
	onClick = (event) => {
		if (event.target === this.dialog) {
			this.dialog.close();
			return;
		}
		const button = event.target instanceof Element ? event.target.closest("button") : null;
		if (!button || button.disabled) return;
		if (button.closest("#game-actions") || [
			"settings-close-button",
			"settings-done-button",
			"appliance-gallery-button"
		].includes(button.id)) this.dialog.close();
	};
};
//#endregion
//#region src/theme/GlobalToolbar.ts
function setIcon(button, icon) {
	button.replaceChildren(createElement(icon, {
		width: 17,
		height: 17,
		"stroke-width": 2.2,
		"aria-hidden": "true"
	}));
}
var GlobalToolbar = class {
	theme;
	season;
	audio;
	element = document.createElement("nav");
	themeButton = document.createElement("button");
	seasonWrap = document.createElement("div");
	seasonButton = document.createElement("button");
	seasonMenu = document.createElement("div");
	audioButton = document.createElement("button");
	unsubscribeTheme;
	unsubscribeSeason;
	unsubscribeAudio;
	themeLocked = false;
	settings;
	constructor(theme, season, audio, languageButton) {
		this.theme = theme;
		this.season = season;
		this.audio = audio;
		this.element.id = "global-toolbar";
		this.element.setAttribute("aria-label", "全局设置");
		this.themeButton.id = "theme-button";
		this.seasonWrap.id = "season-picker";
		this.seasonButton.id = "season-button";
		this.seasonMenu.id = "season-menu";
		this.audioButton.id = "audio-button";
		this.themeButton.type = "button";
		this.seasonButton.type = "button";
		this.audioButton.type = "button";
		this.themeButton.addEventListener("click", this.onThemeClick);
		this.seasonButton.addEventListener("click", this.onSeasonToggle);
		this.seasonButton.addEventListener("keydown", this.onSeasonButtonKeyDown);
		this.audioButton.addEventListener("click", this.onAudioClick);
		document.addEventListener("pointerdown", this.onDocumentPointerDown);
		document.addEventListener("keydown", this.onDocumentKeyDown);
		languageButton.classList.add("global-language-button");
		this.seasonButton.setAttribute("aria-haspopup", "menu");
		this.seasonButton.setAttribute("aria-controls", "season-menu");
		this.seasonButton.setAttribute("aria-expanded", "false");
		this.seasonMenu.setAttribute("role", "menu");
		this.seasonMenu.setAttribute("aria-hidden", "true");
		for (const mode of SEASON_MODES) {
			const button = document.createElement("button");
			button.type = "button";
			button.dataset.season = mode;
			button.setAttribute("role", "menuitemradio");
			button.textContent = `${SEASON_PROFILES[mode].label}季`;
			button.addEventListener("click", () => this.selectSeason(mode));
			this.seasonMenu.append(button);
		}
		this.seasonWrap.append(this.seasonButton, this.seasonMenu);
		this.element.append(this.seasonWrap, this.themeButton, this.audioButton, languageButton);
		document.querySelector("#app")?.append(this.element);
		this.unsubscribeTheme = theme.subscribe((snapshot) => this.renderTheme(snapshot));
		this.unsubscribeSeason = season.subscribe((snapshot) => this.renderSeason(snapshot));
		this.unsubscribeAudio = audio.subscribe((muted) => this.renderAudio(muted));
		this.settings = new GameSettings(this.element);
	}
	refreshLocale() {
		this.settings.refreshLocale();
		this.renderTheme(this.theme.snapshot);
		this.renderSeason(this.season.snapshot);
		this.renderAudio(this.audio.muted);
	}
	dispose() {
		this.settings.dispose();
		const language = this.element.querySelector("#language-button");
		if (language) document.querySelector("#game-actions")?.append(language);
		this.unsubscribeTheme();
		this.unsubscribeSeason();
		this.unsubscribeAudio();
		this.themeButton.removeEventListener("click", this.onThemeClick);
		this.seasonButton.removeEventListener("click", this.onSeasonToggle);
		this.seasonButton.removeEventListener("keydown", this.onSeasonButtonKeyDown);
		this.audioButton.removeEventListener("click", this.onAudioClick);
		document.removeEventListener("pointerdown", this.onDocumentPointerDown);
		document.removeEventListener("keydown", this.onDocumentKeyDown);
		this.element.remove();
	}
	setThemeLocked(locked) {
		this.themeLocked = locked;
		this.themeButton.disabled = locked;
		this.themeButton.title = locked ? "探索模式固定为夜晚" : this.themeButton.title;
		this.themeButton.setAttribute("aria-disabled", String(locked));
	}
	onThemeClick = () => {
		if (!this.themeLocked) this.theme.toggle();
	};
	onSeasonToggle = () => this.setSeasonMenuOpen(!this.seasonMenu.classList.contains("visible"));
	onAudioClick = () => this.audio.setMuted(!this.audio.muted, true);
	onSeasonButtonKeyDown = (event) => {
		if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
		event.preventDefault();
		event.stopPropagation();
		this.setSeasonMenuOpen(true, event.key === "ArrowUp" ? "last" : "selected");
	};
	onDocumentPointerDown = (event) => {
		if (!(event.target instanceof Node) || this.seasonWrap.contains(event.target)) return;
		this.setSeasonMenuOpen(false);
	};
	onDocumentKeyDown = (event) => {
		if (!this.seasonMenu.classList.contains("visible")) return;
		if (event.key === "Escape") {
			event.preventDefault();
			this.setSeasonMenuOpen(false);
			this.seasonButton.focus();
			return;
		}
		if (![
			"ArrowDown",
			"ArrowUp",
			"Home",
			"End"
		].includes(event.key)) return;
		const buttons = [...this.seasonMenu.querySelectorAll("button[data-season]")];
		if (buttons.length === 0) return;
		event.preventDefault();
		const activeIndex = Math.max(0, buttons.indexOf(document.activeElement));
		buttons[event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (activeIndex + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length].focus();
	};
	selectSeason(mode) {
		this.season.setMode(mode, true);
		this.setSeasonMenuOpen(false);
		this.seasonButton.focus();
	}
	setSeasonMenuOpen(open, focus = null) {
		this.seasonMenu.classList.toggle("visible", open);
		this.seasonButton.setAttribute("aria-expanded", String(open));
		this.seasonMenu.setAttribute("aria-hidden", String(!open));
		if (!open || !focus) return;
		(focus === "last" ? this.seasonMenu.querySelector("button[data-season]:last-child") : this.seasonMenu.querySelector("button.active") ?? this.seasonMenu.querySelector("button[data-season]"))?.focus();
	}
	renderSeason(snapshot) {
		setIcon(this.seasonButton, Leaf);
		const target = SEASON_PROFILES[snapshot.targetMode];
		const label = getLocale() === "en" ? `Season: ${snapshot.targetMode}` : `选择季节，当前${target.label}季`;
		this.seasonButton.title = label;
		this.seasonButton.setAttribute("aria-label", label);
		this.seasonButton.dataset.season = snapshot.targetMode;
		this.seasonButton.dataset.label = target.label;
		this.seasonMenu.querySelectorAll("button[data-season]").forEach((button) => {
			const selected = button.dataset.season === snapshot.targetMode;
			const mode = button.dataset.season;
			button.textContent = getLocale() === "en" ? mode : `${SEASON_PROFILES[mode].label}季`;
			button.setAttribute("aria-checked", String(selected));
			button.classList.toggle("active", selected);
		});
	}
	renderTheme(snapshot) {
		const switchToNight = snapshot.targetMode === "day";
		const label = getLocale() === "en" ? switchToNight ? "Switch to night" : "Switch to day" : switchToNight ? "切换到夜晚" : "切换到白天";
		setIcon(this.themeButton, switchToNight ? Moon : Sun);
		this.themeButton.title = label;
		this.themeButton.setAttribute("aria-label", label);
		this.themeButton.setAttribute("aria-pressed", String(snapshot.targetMode === "night"));
		this.themeButton.dataset.mode = snapshot.targetMode;
		if (this.themeLocked) this.themeButton.title = "探索模式固定为夜晚";
	}
	renderAudio(muted) {
		const label = getLocale() === "en" ? muted ? "Enable sound" : "Mute sound" : muted ? "开启声音" : "关闭声音";
		setIcon(this.audioButton, muted ? VolumeX : Volume2);
		this.audioButton.title = label;
		this.audioButton.setAttribute("aria-label", label);
		this.audioButton.setAttribute("aria-pressed", String(!muted));
		this.audioButton.dataset.muted = String(muted);
	}
};
//#endregion
//#region src/theme/NightEnvironment.ts
var EXPLORATION_FOG = new Color(461076);
var EXPLORATION_AMBIENT = .015;
var NightEnvironment = class {
	canvas;
	scene;
	camera;
	sky;
	lights;
	progress = 0;
	explorationProgress = 0;
	quality = "high";
	lanternPoint = new PointLight(16766896, 0, 18, 1.45);
	lanternNdc = new Vector2(0, 0);
	lanternTarget = new Vector2(0, 0);
	lanternCenter = new Vector2(0, 0);
	lanternIntensity = 0;
	lanternTargetIntensity = 0;
	lastElapsed = 0;
	pointerActive = false;
	touchTarget = false;
	touchHint = document.createElement("div");
	pointerOverUi = false;
	inApplianceZone = false;
	reducedMotion = false;
	environment = SEASON_PROFILES.spring.day;
	raycaster = new Raycaster();
	lanternPlane = new Plane();
	lanternWorld = new Vector3();
	cameraDirection = new Vector3();
	lanternPlanePoint = new Vector3();
	baseEnvironmentIntensity;
	baseFogNear;
	baseFogFar;
	constructor(canvas, scene, camera, sky, lights) {
		this.canvas = canvas;
		this.scene = scene;
		this.camera = camera;
		this.sky = sky;
		this.lights = lights;
		const fog = scene.fog instanceof Fog ? scene.fog : null;
		this.baseEnvironmentIntensity = scene.environmentIntensity;
		this.baseFogNear = fog?.near ?? 30;
		this.baseFogFar = fog?.far ?? 82;
		this.touchHint.className = "exploration-touch-hint";
		this.touchHint.textContent = "单指提灯 · 双指拖动旋转 / 捏合缩放 · 轻点抽线";
		document.body.append(this.touchHint);
		this.lanternPoint.name = "night-lantern-point-light";
		this.lanternPoint.castShadow = false;
		scene.add(this.lanternPoint);
		canvas.addEventListener("pointermove", this.onPointerMove, { passive: true });
		canvas.addEventListener("pointerdown", this.onPointerMove, { passive: true });
		canvas.addEventListener("pointerleave", this.onPointerLeave, { passive: true });
		canvas.addEventListener("pointerup", this.onPointerUp, { passive: true });
		window.addEventListener("pointermove", this.onWindowPointerMove, { passive: true });
	}
	setThemeProgress(progress) {
		this.progress = MathUtils.clamp(progress, 0, 1);
		this.applyEnvironmentLighting();
	}
	setSeasonEnvironment(environment) {
		this.environment = environment;
		this.applyEnvironmentLighting();
		this.sky.setSeasonEnvironment(environment);
	}
	setExplorationProgress(progress) {
		this.explorationProgress = MathUtils.clamp(progress, 0, 1);
		this.applyEnvironmentLighting();
		this.sky.setExplorationProgress(this.explorationProgress);
	}
	applyEnvironmentLighting() {
		const fog = this.scene.fog instanceof Fog ? this.scene.fog : null;
		if (fog) {
			fog.color.copy(this.environment.fog);
			fog.color.lerp(EXPLORATION_FOG, this.explorationProgress * this.progress);
			fog.near = this.baseFogNear * this.environment.fogNearScale;
			fog.far = this.baseFogFar * this.environment.fogFarScale;
		}
		this.lights.sun.color.copy(this.environment.sun);
		this.lights.fill.color.copy(this.environment.fill);
		this.lights.bounce.color.copy(this.environment.bounce);
		this.lights.hemi.color.copy(this.environment.hemiSky);
		this.lights.hemi.groundColor.copy(this.environment.hemiGround);
		const ambientScale = MathUtils.lerp(1, EXPLORATION_AMBIENT, this.explorationProgress * this.progress);
		this.scene.environmentIntensity = this.baseEnvironmentIntensity * MathUtils.lerp(1, .22, this.progress) * ambientScale;
		this.lights.sun.intensity = this.environment.sunIntensity * ambientScale;
		this.lights.fill.intensity = this.environment.fillIntensity * ambientScale;
		this.lights.bounce.intensity = this.environment.bounceIntensity * ambientScale;
		this.lights.hemi.intensity = this.environment.hemiIntensity * ambientScale;
		this.sky.setThemeProgress(this.progress);
	}
	setQualityTier(tier) {
		this.quality = tier;
		this.sky.setQualityTier(tier);
	}
	setReducedMotion(reduced) {
		this.reducedMotion = reduced;
		this.sky.setReducedMotion(reduced);
	}
	update(delta, elapsed, options) {
		const wallDelta = this.lastElapsed > 0 ? elapsed - this.lastElapsed : delta;
		this.lastElapsed = elapsed;
		const presentationDelta = MathUtils.clamp(Number.isFinite(wallDelta) ? wallDelta : delta, 0, .25);
		const mobileExploration = this.explorationProgress > 0 && !options.opening && (this.touchTarget || window.matchMedia("(pointer: coarse)").matches);
		const forceCenter = options.galleryOpen || !mobileExploration && (this.pointerOverUi || !this.pointerActive);
		const desired = forceCenter ? this.lanternCenter : this.lanternTarget;
		const response = this.reducedMotion ? 1 : 1 - Math.exp(-presentationDelta / .105);
		this.lanternNdc.lerp(desired, response);
		const desiredIntensity = options.galleryOpen ? 0 : forceCenter ? 0 : options.opening ? 1.04 : 1;
		this.lanternTargetIntensity = desiredIntensity;
		const intensityResponse = 1 - Math.exp(-presentationDelta / (forceCenter ? .4 : .12));
		this.lanternIntensity = MathUtils.lerp(this.lanternIntensity, this.lanternTargetIntensity, intensityResponse);
		this.camera.getWorldDirection(this.cameraDirection);
		this.lanternPlane.setFromNormalAndCoplanarPoint(this.cameraDirection, this.lanternPlanePoint.set(0, 0, 0));
		this.raycaster.setFromCamera(this.lanternNdc, this.camera);
		if (!this.raycaster.ray.intersectPlane(this.lanternPlane, this.lanternWorld)) this.lanternWorld.set(0, 0, 0);
		if (options.opening && options.openingFocus) {
			const focusDepth = options.openingFocus.clone().sub(this.camera.position).dot(this.cameraDirection);
			this.raycaster.ray.at(Math.max(1, focusDepth), this.lanternWorld);
		}
		this.lanternWorld.addScaledVector(this.cameraDirection, -2.2);
		this.lanternPoint.position.copy(this.lanternWorld);
		const shimmer = this.reducedMotion ? 1 : .985 + Math.sin(elapsed * 2.3) * .015;
		const openingModelBoost = options.opening ? 1.08 : 1;
		this.lanternPoint.intensity = this.progress * this.lanternIntensity * 3.1 * openingModelBoost * shimmer;
		this.lanternPoint.distance = this.quality === "minimal" ? 18 : 26;
		this.sky.updateTheme(elapsed);
	}
	get lantern() {
		return {
			position: [this.lanternNdc.x, this.lanternNdc.y],
			worldPosition: [
				this.lanternWorld.x,
				this.lanternWorld.y,
				this.lanternWorld.z
			],
			target: [this.lanternTarget.x, this.lanternTarget.y],
			intensity: this.lanternIntensity,
			targetIntensity: this.lanternTargetIntensity,
			inApplianceZone: this.inApplianceZone,
			returning: this.explorationProgress > 0 && (this.touchTarget || window.matchMedia("(pointer: coarse)").matches) ? false : !this.pointerActive || this.pointerOverUi
		};
	}
	dispose() {
		this.canvas.removeEventListener("pointermove", this.onPointerMove);
		this.canvas.removeEventListener("pointerdown", this.onPointerMove);
		this.canvas.removeEventListener("pointerleave", this.onPointerLeave);
		this.canvas.removeEventListener("pointerup", this.onPointerUp);
		window.removeEventListener("pointermove", this.onWindowPointerMove);
		this.touchHint.remove();
		this.lanternPoint.removeFromParent();
		this.lanternPoint.dispose();
	}
	onPointerMove = (event) => {
		this.updatePointerTarget(event);
	};
	updatePointerTarget(event) {
		const rect = this.canvas.getBoundingClientRect();
		if (rect.width <= 0 || rect.height <= 0) return;
		this.touchTarget = event.pointerType === "touch";
		const mobileOffset = event.pointerType === "touch" ? 56 : 0;
		const x = (event.clientX - rect.left) / rect.width;
		const y = (event.clientY - mobileOffset - rect.top) / rect.height;
		this.lanternTarget.set(x * 2 - 1, -(y * 2 - 1));
		this.pointerActive = true;
		this.pointerOverUi = false;
		this.inApplianceZone = x < .24 || x > .76;
	}
	onPointerLeave = () => {
		if (!(this.touchTarget && this.explorationProgress > 0)) this.pointerActive = false;
	};
	onPointerUp = (event) => {
		if (event.pointerType === "touch" && this.explorationProgress === 0) this.pointerActive = false;
	};
	onWindowPointerMove = (event) => {
		const target = event.target;
		if (!(target instanceof Element)) return;
		const startSurface = target.closest("#start-screen");
		const interactive = target.closest("button, a, input, select, textarea, [role=\"button\"]");
		if (startSurface && !interactive) {
			this.updatePointerTarget(event);
			return;
		}
		this.pointerOverUi = target.closest("#game-canvas") === null;
	};
};
//#endregion
//#region src/theme/AdaptiveQuality.ts
var TIER_ORDER = [
	"high",
	"reduced",
	"sparse",
	"minimal"
];
var AdaptiveNightQuality = class {
	onTierChange;
	tierIndex = 0;
	lowDuration = 0;
	highDuration = 0;
	lastUpdateAt = performance.now();
	degradeAfterSeconds;
	restoreAfterSeconds;
	constructor(onTierChange, options = {}) {
		this.onTierChange = onTierChange;
		this.degradeAfterSeconds = Math.max(.25, options.degradeAfterSeconds ?? 2);
		this.restoreAfterSeconds = Math.max(1, options.restoreAfterSeconds ?? 8);
	}
	get tier() {
		return TIER_ORDER[this.tierIndex];
	}
	update(delta) {
		const now = performance.now();
		const wallDelta = Math.min(.25, Math.max(delta, Math.max(0, (now - this.lastUpdateAt) / 1e3)));
		this.lastUpdateAt = now;
		if (wallDelta <= 0) return;
		const fps = 1 / Math.max(delta, .001);
		if (fps < 52) {
			this.lowDuration += wallDelta;
			this.highDuration = 0;
		} else if (fps > 58) {
			this.highDuration += wallDelta;
			this.lowDuration = 0;
		} else {
			this.lowDuration = Math.max(0, this.lowDuration - wallDelta * .5);
			this.highDuration = Math.max(0, this.highDuration - wallDelta * .5);
		}
		if (this.lowDuration + 1e-6 >= this.degradeAfterSeconds && this.tierIndex < TIER_ORDER.length - 1) {
			this.tierIndex += 1;
			this.lowDuration = 0;
			this.highDuration = 0;
			this.onTierChange(this.tier);
		} else if (this.highDuration + 1e-6 >= this.restoreAfterSeconds && this.tierIndex > 0) {
			this.tierIndex -= 1;
			this.lowDuration = 0;
			this.highDuration = 0;
			this.onTierChange(this.tier);
		}
	}
	reset(tier = "high") {
		this.tierIndex = Math.max(0, TIER_ORDER.indexOf(tier));
		this.lowDuration = 0;
		this.highDuration = 0;
		this.lastUpdateAt = performance.now();
		this.onTierChange(this.tier);
	}
	getDiagnostics() {
		return {
			tier: this.tier,
			lowDuration: this.lowDuration,
			highDuration: this.highDuration
		};
	}
};
//#endregion
//#region src/theme/SeasonController.ts
var STORAGE_KEY$1 = "sakura.season";
function nextSeason(mode) {
	return SEASON_MODES[(SEASON_MODES.indexOf(mode) + 1) % SEASON_MODES.length];
}
function resolveInitialSeason(search, savedSeason, internalEntry) {
	const query = new URLSearchParams(search).get("season");
	if (isSeasonMode(query)) return {
		mode: query,
		source: "query"
	};
	if (!internalEntry && isSeasonMode(savedSeason)) return {
		mode: savedSeason,
		source: "saved"
	};
	return {
		mode: "spring",
		source: "default"
	};
}
function oneHot(mode) {
	return Object.fromEntries(SEASON_MODES.map((entry) => [entry, entry === mode ? 1 : 0]));
}
var SeasonController = class {
	target;
	weightsValue;
	sourceWeights;
	transitionProgress = 1;
	sourceValue;
	listeners = /* @__PURE__ */ new Set();
	motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
	reducedMotionValue = this.motionQuery.matches;
	lastUpdateAt = performance.now();
	autoElapsedValue = 0;
	autoIntervalValue;
	dayState = cloneEnvironmentState(SEASON_PROFILES.spring.day);
	nightState = cloneEnvironmentState(SEASON_PROFILES.spring.night);
	finalState = cloneEnvironmentState(SEASON_PROFILES.spring.day);
	constructor(options = {}) {
		let savedSeason = null;
		try {
			savedSeason = localStorage.getItem(STORAGE_KEY$1);
		} catch {}
		const initial = resolveInitialSeason(window.location.search, savedSeason, options.internalEntry ?? false);
		this.target = initial.mode;
		this.weightsValue = oneHot(initial.mode);
		this.sourceWeights = { ...this.weightsValue };
		this.sourceValue = initial.source;
		this.autoIntervalValue = options.autoIntervalSeconds ?? 60;
		this.motionQuery.addEventListener("change", this.onMotionPreferenceChange);
		this.applyDocumentSeason(0);
	}
	get snapshot() {
		return {
			mode: this.transitionProgress >= 1 ? this.target : this.dominantSeason,
			targetMode: this.target,
			transitioning: this.transitionProgress < 1,
			progress: this.transitionProgress,
			weights: { ...this.weightsValue },
			source: this.sourceValue,
			reducedMotion: this.reducedMotionValue,
			automatic: true,
			autoElapsed: this.autoElapsedValue,
			autoInterval: this.autoIntervalValue,
			autoRemaining: Math.max(0, this.autoIntervalValue - this.autoElapsedValue)
		};
	}
	setMode(mode, persist = false) {
		if (persist) {
			this.autoElapsedValue = 0;
			this.sourceValue = "manual";
			try {
				localStorage.setItem(STORAGE_KEY$1, mode);
			} catch {}
		}
		if (mode === this.target && this.transitionProgress >= 1) return;
		this.sourceWeights = { ...this.weightsValue };
		this.target = mode;
		this.transitionProgress = 0;
		this.emit();
	}
	update(delta, themeProgress) {
		const now = performance.now();
		const wallDelta = Math.min(2.4, Math.max(delta, Math.max(0, (now - this.lastUpdateAt) / 1e3)));
		this.lastUpdateAt = now;
		this.autoElapsedValue += Math.min(1, Math.max(0, delta));
		if (this.autoElapsedValue >= this.autoIntervalValue) {
			this.autoElapsedValue %= this.autoIntervalValue;
			this.sourceValue = "automatic";
			this.setMode(nextSeason(this.target));
		}
		if (this.transitionProgress < 1) {
			const duration = this.reducedMotionValue ? .25 : 2.4;
			this.transitionProgress = Math.min(1, this.transitionProgress + wallDelta / duration);
			const eased = MathUtils.smoothstep(this.transitionProgress, 0, 1);
			for (const mode of SEASON_MODES) this.weightsValue[mode] = MathUtils.lerp(this.sourceWeights[mode], mode === this.target ? 1 : 0, eased);
			this.emit();
		}
		this.applyDocumentSeason(themeProgress);
	}
	resolveEnvironment(themeProgress) {
		this.mixSeasonState("day", this.dayState);
		this.mixSeasonState("night", this.nightState);
		return lerpEnvironmentState(this.finalState, this.dayState, this.nightState, themeProgress);
	}
	subscribe(listener) {
		this.listeners.add(listener);
		listener(this.snapshot);
		return () => this.listeners.delete(listener);
	}
	dispose() {
		this.motionQuery.removeEventListener("change", this.onMotionPreferenceChange);
		this.listeners.clear();
	}
	get dominantSeason() {
		return SEASON_MODES.reduce((best, mode) => this.weightsValue[mode] > this.weightsValue[best] ? mode : best, "spring");
	}
	mixSeasonState(time, target) {
		target.skyTop.setRGB(0, 0, 0);
		target.skyMid.setRGB(0, 0, 0);
		target.skyHaze.setRGB(0, 0, 0);
		target.cloud.setRGB(0, 0, 0);
		target.cloudShade.setRGB(0, 0, 0);
		target.fog.setRGB(0, 0, 0);
		target.sun.setRGB(0, 0, 0);
		target.fill.setRGB(0, 0, 0);
		target.bounce.setRGB(0, 0, 0);
		target.hemiSky.setRGB(0, 0, 0);
		target.hemiGround.setRGB(0, 0, 0);
		target.pageBackground.setRGB(0, 0, 0);
		target.startWash.setRGB(0, 0, 0);
		target.cloudOpacity = 0;
		target.cloudShadeOpacity = 0;
		target.fogNearScale = 0;
		target.fogFarScale = 0;
		target.sunIntensity = 0;
		target.fillIntensity = 0;
		target.bounceIntensity = 0;
		target.hemiIntensity = 0;
		for (const mode of SEASON_MODES) {
			const source = SEASON_PROFILES[mode][time];
			const weight = this.weightsValue[mode];
			for (const key of [
				"skyTop",
				"skyMid",
				"skyHaze",
				"cloud",
				"cloudShade",
				"fog",
				"sun",
				"fill",
				"bounce",
				"hemiSky",
				"hemiGround",
				"pageBackground",
				"startWash"
			]) {
				target[key].r += source[key].r * weight;
				target[key].g += source[key].g * weight;
				target[key].b += source[key].b * weight;
			}
			for (const key of [
				"cloudOpacity",
				"cloudShadeOpacity",
				"fogNearScale",
				"fogFarScale",
				"sunIntensity",
				"fillIntensity",
				"bounceIntensity",
				"hemiIntensity"
			]) target[key] += source[key] * weight;
		}
	}
	applyDocumentSeason(themeProgress) {
		const environment = this.resolveEnvironment(themeProgress);
		const root = document.documentElement;
		const cssColor = `#${environment.pageBackground.getHexString()}`;
		const cssRgb = (color) => {
			const srgb = color.clone().convertLinearToSRGB();
			return [
				srgb.r,
				srgb.g,
				srgb.b
			].map((channel) => Math.round(MathUtils.clamp(channel, 0, 1) * 255)).join(", ");
		};
		root.dataset.season = this.transitionProgress >= 1 ? this.target : this.dominantSeason;
		root.dataset.seasonTarget = this.target;
		root.classList.toggle("season-transitioning", this.transitionProgress < 1);
		root.style.setProperty("--season-progress", this.transitionProgress.toFixed(4));
		root.style.setProperty("--page-background", cssColor);
		root.style.setProperty("--season-page-rgb", cssRgb(environment.pageBackground));
		root.style.setProperty("--start-wash-rgb", cssRgb(environment.startWash));
		const nightBlend = MathUtils.clamp(themeProgress, 0, 1);
		const pageLayerScale = MathUtils.lerp(this.weightsValue.spring, 1, nightBlend);
		root.style.setProperty("--start-wash-page-opacity", (.14 * pageLayerScale).toFixed(4));
		root.style.setProperty("--start-wash-page-mid-opacity", (.06 * pageLayerScale).toFixed(4));
		document.body.style.backgroundColor = cssColor;
		const meta = document.querySelector("meta[name=\"theme-color\"]");
		if (meta) meta.content = cssColor;
	}
	onMotionPreferenceChange = (event) => {
		this.reducedMotionValue = event.matches;
		this.emit();
	};
	emit() {
		const snapshot = this.snapshot;
		this.listeners.forEach((listener) => listener(snapshot));
	}
};
//#endregion
//#region src/audio/ApplianceAudioProfiles.ts
var stages = (startup, run, climax, finish, duration) => [
	{
		label: startup,
		at: 0,
		duration: .42
	},
	{
		label: run,
		at: .36,
		duration: Math.max(.12, duration - 1.15)
	},
	{
		label: climax,
		at: duration * .6,
		duration: .78
	},
	{
		label: finish,
		at: duration - .64,
		duration: .58
	}
];
var audio = (character, baseFrequency, runGain, noiseAmount, pitchVariation, labels, duration = POWERED_ACTIVE_DURATION) => ({
	character,
	baseFrequency,
	runGain,
	noiseAmount,
	pitchVariation,
	duration,
	stages: stages(...labels, duration)
});
var APPLIANCE_AUDIO_PROFILES = {
	lamp: audio("mechanical", 118, .12, .015, .02, [
		"开关",
		"关节与轻灯丝鸣",
		"灯丝升亮",
		"断电"
	]),
	fan: audio("air", 82, .2, .34, .045, [
		"开关",
		"马达升速与风噪",
		"高速风噪",
		"降速"
	]),
	radio: audio("musical", 220, .12, .12, .035, [
		"调谐",
		"底噪",
		"短五声音型",
		"收台"
	]),
	television: audio("screen", 156, .16, .26, .025, [
		"启动啸声",
		"换台",
		"静电",
		"关机收线"
	]),
	humidifier: audio("water", 96, .17, .28, .04, [
		"水泵",
		"雾化嘶声",
		"云团闷响",
		"停机"
	]),
	toaster: audio("heat", 105, .14, .09, .025, [
		"压杆",
		"加热",
		"弹起",
		"吐司落下"
	]),
	refrigerator: audio("motor", 62, .16, .08, .018, [
		"压缩机",
		"门封",
		"内部轻响",
		"关门"
	]),
	washer: audio("water", 74, .2, .22, .035, [
		"锁门",
		"进水",
		"滚筒",
		"减速"
	], WASHER_POWERED_ACTIVE_DURATION),
	microwave: audio("heat", 60, .17, .08, .012, [
		"按键",
		"继电器",
		"低频运行",
		"结束音"
	]),
	"coffee-maker": audio("water", 88, .18, .24, .035, [
		"开关",
		"水泵",
		"滴滤",
		"蒸汽收尾"
	]),
	kettle: audio("heat", 96, .2, .3, .04, [
		"开关",
		"加热嘶声",
		"沸腾",
		"跳闸"
	]),
	"rice-cooker": audio("water", 84, .17, .2, .03, [
		"按键",
		"轻沸",
		"蒸汽",
		"完成提示"
	]),
	phone: audio("screen", 196, .11, .03, .02, [
		"唤醒",
		"振动",
		"来电短句",
		"回落"
	]),
	"robot-vacuum": audio("motor", 76, .18, .14, .03, [
		"启动音",
		"轮刷",
		"电机",
		"完成提示"
	]),
	"bubble-machine": audio("air", 92, .15, .25, .04, [
		"电机",
		"液体",
		"送风",
		"柔和破泡"
	]),
	"gumball-machine": audio("mechanical", 128, .13, .05, .03, [
		"投入",
		"摇柄",
		"滚落",
		"出奖提示"
	]),
	"popcorn-machine": audio("heat", 102, .2, .22, .045, [
		"继电器",
		"加热",
		"受控随机爆裂",
		"落料"
	]),
	"alarm-clock": audio("mechanical", 154, .11, .02, .012, [
		"发条",
		"走时",
		"铃铛高潮",
		"按停"
	]),
	"smart-bin": audio("mechanical", 82, .14, .08, .025, [
		"感应",
		"舵机开盖",
		"空腔声",
		"合盖"
	]),
	"record-player": audio("musical", 196, .13, .1, .025, [
		"开盖",
		"落针",
		"底噪",
		"短五声音型"
	]),
	"stand-mixer": audio("motor", 70, .19, .12, .03, [
		"开关",
		"马达升速",
		"搅拌撞击",
		"停机"
	]),
	printer: audio("mechanical", 116, .16, .16, .035, [
		"按键",
		"滚轮",
		"纸张采样",
		"完成提示"
	], PRINTER_POWERED_ACTIVE_DURATION),
	"induction-cooktop": audio("heat", 112, .17, .15, .025, [
		"触控",
		"感应嗡鸣",
		"轻沸",
		"结束音"
	]),
	blender: audio("motor", 84, .23, .16, .055, [
		"开关",
		"分段升速",
		"食材撞击",
		"停转"
	]),
	dehumidifier: audio("air", 68, .18, .2, .025, [
		"风机",
		"压缩机与进气",
		"水滴",
		"停机"
	]),
	"portable-speaker": audio("musical", 110, .16, .04, .025, [
		"开机音",
		"低频运行",
		"短五声音型",
		"关机"
	]),
	"hair-dryer": audio("air", 92, .23, .38, .04, [
		"开关",
		"马达与风噪",
		"热量升降",
		"停机"
	]),
	"desktop-computer": audio("screen", 72, .18, .16, .035, [
		"开机",
		"风扇与键鼠",
		"过载警报",
		"停机"
	]),
	"game-controller": audio("mechanical", 132, .13, .04, .035, [
		"连接",
		"按键与摇杆",
		"震动高潮",
		"完成音"
	])
};
//#endregion
//#region src/audio/AudioManager.ts
var STORAGE_KEY = "sakura.audioMuted";
var PENTATONIC = [
	0,
	2,
	4,
	7,
	9
];
function seededValue(seed) {
	let value = seed >>> 0;
	value ^= value << 13;
	value ^= value >>> 17;
	value ^= value << 5;
	return (value >>> 0) / 4294967295;
}
function hashKind(kind) {
	let result = 2166136261;
	for (const code of kind) result = Math.imul(result ^ code.charCodeAt(0), 16777619);
	return result >>> 0;
}
var AudioManager = class {
	context = null;
	buses = {};
	listeners = /* @__PURE__ */ new Set();
	sessions = /* @__PURE__ */ new Map();
	activeNodes = /* @__PURE__ */ new Set();
	wind = null;
	noiseBuffer = null;
	nextChimeAt = 0;
	nextInsectAt = 0;
	mutedValue = false;
	unlockedValue = false;
	hidden = document.hidden;
	suspendTimer = 0;
	spatialPosition = new Vector3();
	constructor() {
		try {
			this.mutedValue = localStorage.getItem(STORAGE_KEY) === "true";
		} catch {
			this.mutedValue = false;
		}
		window.addEventListener("pointerdown", this.onFirstInteraction, {
			capture: true,
			once: true
		});
		window.addEventListener("touchstart", this.onFirstInteraction, {
			capture: true,
			once: true
		});
		window.addEventListener("keydown", this.onFirstInteraction, {
			capture: true,
			once: true
		});
		document.addEventListener("visibilitychange", this.onVisibilityChange);
	}
	get muted() {
		return this.mutedValue;
	}
	get unlocked() {
		return this.unlockedValue;
	}
	subscribe(listener) {
		this.listeners.add(listener);
		listener(this.mutedValue);
		return () => this.listeners.delete(listener);
	}
	async unlock() {
		if (!this.context) this.createContext();
		if (!this.context) return;
		if (this.context.state !== "running") await this.context.resume();
		this.unlockedValue = this.context.state === "running";
		this.applyMuteState(.04);
		if (this.unlockedValue && !this.wind) this.startAmbient();
	}
	setMuted(muted, persist = false) {
		this.mutedValue = muted;
		if (persist) try {
			localStorage.setItem(STORAGE_KEY, String(muted));
		} catch {}
		this.applyMuteState(.08);
		this.listeners.forEach((listener) => listener(muted));
	}
	update(themeProgress, targets, camera) {
		if (!this.context || !this.unlockedValue || this.hidden) return;
		const ambient = this.buses.ambient;
		if (ambient) {
			const duck = targets.filter((target) => target.state === "active").length > 0 ? .707 : 1;
			ambient.gain.setTargetAtTime(themeProgress * .115 * duck, this.context.currentTime, .18);
		}
		targets.forEach((target) => {
			const existing = this.sessions.get(target);
			if (target.state === "active" && !existing) this.startAppliance(target, target.getActiveElapsed());
			else if (target.state !== "active" && existing) this.stopSession(target, .12);
			const session = this.sessions.get(target);
			if (session && camera) this.updateSpatial(session, camera);
		});
		[...this.sessions.keys()].forEach((target) => {
			if (!targets.includes(target)) this.stopSession(target, .08);
		});
		if (themeProgress > .75 && this.context.currentTime >= this.nextChimeAt) {
			this.playAmbientChime();
			this.nextChimeAt = this.context.currentTime + 12 + seededValue(Math.floor(this.context.currentTime * 10)) * 8;
		}
		if (themeProgress > .55 && this.context.currentTime >= this.nextInsectAt) {
			this.playInsectChirp();
			this.nextInsectAt = this.context.currentTime + 4.5 + seededValue(Math.floor(this.context.currentTime * 17)) * 4;
		}
	}
	playInteraction(sound) {
		if (!this.context || !this.unlockedValue || this.mutedValue || this.hidden) return;
		const frequencies = {
			confirm: [392, 523],
			"cable-success": [
				330,
				440,
				660
			],
			blocked: [147, 123],
			"appliance-land": [92],
			"mode-start": [
				262,
				330,
				440
			],
			complete: [
				330,
				440,
				550,
				660
			],
			failed: [
				220,
				185,
				147
			],
			button: [440]
		};
		const gainScale = sound === "blocked" || sound === "failed" ? .09 : .065;
		frequencies[sound].forEach((frequency, index) => {
			this.scheduleTone(this.buses.interaction, frequency, this.context.currentTime + index * .07, .11, gainScale, "sine");
		});
	}
	getDiagnostics() {
		const busValue = (name) => this.buses[name]?.gain.value ?? 0;
		return {
			unlocked: this.unlockedValue,
			muted: this.mutedValue,
			state: this.context?.state ?? "unavailable",
			buses: {
				master: busValue("master"),
				ambient: busValue("ambient"),
				appliance: busValue("appliance"),
				interaction: busValue("interaction")
			},
			activeNodes: this.activeNodes.size,
			activeAppliances: [...this.sessions.values()].map((session) => session.kind)
		};
	}
	dispose() {
		window.removeEventListener("pointerdown", this.onFirstInteraction, true);
		window.removeEventListener("touchstart", this.onFirstInteraction, true);
		window.removeEventListener("keydown", this.onFirstInteraction, true);
		document.removeEventListener("visibilitychange", this.onVisibilityChange);
		window.clearTimeout(this.suspendTimer);
		[...this.sessions.keys()].forEach((target) => this.stopSession(target, 0));
		if (this.wind) this.stopAudioSession(this.wind, 0);
		this.context?.close();
		this.context = null;
		this.activeNodes.clear();
		this.listeners.clear();
	}
	onFirstInteraction = () => {
		this.unlock();
	};
	onVisibilityChange = () => {
		this.hidden = document.hidden;
		if (!this.context) return;
		window.clearTimeout(this.suspendTimer);
		this.suspendTimer = 0;
		const master = this.buses.master;
		if (this.hidden) {
			master?.gain.setTargetAtTime(0, this.context.currentTime, .05);
			this.suspendTimer = window.setTimeout(() => {
				this.suspendTimer = 0;
				if (this.hidden) this.context?.suspend();
			}, 180);
		} else this.context.resume().then(() => {
			this.unlockedValue = this.context?.state === "running";
			this.applyMuteState(.08);
			[...this.sessions.keys()].forEach((target) => this.stopSession(target, 0));
		});
	};
	createContext() {
		const LegacyWindow = window;
		const Context = window.AudioContext ?? LegacyWindow.webkitAudioContext;
		if (!Context) return;
		const context = new Context();
		const limiter = context.createDynamicsCompressor();
		limiter.threshold.value = -9;
		limiter.knee.value = 16;
		limiter.ratio.value = 5;
		limiter.attack.value = .004;
		limiter.release.value = .18;
		limiter.connect(context.destination);
		const master = context.createGain();
		master.gain.value = this.mutedValue ? 0 : .82;
		master.connect(limiter);
		const ambient = context.createGain();
		const appliance = context.createGain();
		const interaction = context.createGain();
		ambient.gain.value = 0;
		appliance.gain.value = .22;
		interaction.gain.value = .26;
		ambient.connect(master);
		appliance.connect(master);
		interaction.connect(master);
		this.context = context;
		this.buses = {
			master,
			ambient,
			appliance,
			interaction
		};
		this.activeNodes.add(limiter);
		Object.values(this.buses).forEach((node) => this.activeNodes.add(node));
		this.noiseBuffer = this.createNoiseBuffer(context);
	}
	applyMuteState(timeConstant) {
		if (!this.context || !this.buses.master) return;
		this.buses.master.gain.setTargetAtTime(this.mutedValue ? 0 : .82, this.context.currentTime, timeConstant);
	}
	startAmbient() {
		if (!this.context || !this.noiseBuffer || !this.buses.ambient) return;
		const source = this.context.createBufferSource();
		const filter = this.context.createBiquadFilter();
		const gain = this.context.createGain();
		const panner = this.context.createStereoPanner();
		source.buffer = this.noiseBuffer;
		source.loop = true;
		filter.type = "lowpass";
		filter.frequency.value = 720;
		gain.gain.value = .75;
		source.connect(filter).connect(gain).connect(panner).connect(this.buses.ambient);
		source.start();
		this.trackSource(source, [
			filter,
			gain,
			panner
		]);
		this.wind = {
			target: null,
			kind: "fan",
			gain,
			panner,
			sources: [source],
			startedAtContextTime: this.context.currentTime,
			offset: 0
		};
		this.nextChimeAt = this.context.currentTime + 12;
		this.nextInsectAt = this.context.currentTime + 3.5;
	}
	startAppliance(target, offset) {
		if (!this.context || !this.buses.appliance || this.mutedValue) return;
		const profile = APPLIANCE_AUDIO_PROFILES[target.kind];
		const gain = this.context.createGain();
		const panner = this.context.createStereoPanner();
		gain.gain.value = 0;
		gain.connect(panner).connect(this.buses.appliance);
		const session = {
			target,
			kind: target.kind,
			gain,
			panner,
			sources: [],
			startedAtContextTime: this.context.currentTime,
			offset
		};
		this.activeNodes.add(gain);
		this.activeNodes.add(panner);
		this.sessions.set(target, session);
		const seed = hashKind(target.kind);
		const variation = (seededValue(seed) - .5) * profile.pitchVariation;
		const base = profile.baseFrequency * (1 + variation);
		gain.gain.setValueAtTime(0, this.context.currentTime);
		this.addRunVoice(session, base, profile);
		this.addStageTones(session, base, seed, profile);
	}
	addRunVoice(session, base, profile) {
		if (!this.context) return;
		const runStage = profile.stages[1];
		const runEnd = runStage.at + runStage.duration;
		if (runEnd <= session.offset) return;
		const startAt = this.context.currentTime + Math.max(0, runStage.at - session.offset);
		const duration = Math.max(.12, runEnd - Math.max(session.offset, runStage.at));
		const character = profile.character;
		const oscillator = this.context.createOscillator();
		oscillator.type = character === "screen" ? "sine" : character === "musical" ? "triangle" : "sawtooth";
		oscillator.frequency.setValueAtTime(base, startAt);
		oscillator.frequency.exponentialRampToValueAtTime(base * (character === "motor" || character === "air" ? 1.45 : 1.04), startAt + Math.min(.9, duration));
		const filter = this.context.createBiquadFilter();
		filter.type = "lowpass";
		filter.frequency.value = character === "heat" || character === "water" ? 1450 : 980;
		const voiceGain = this.context.createGain();
		voiceGain.gain.value = character === "screen" ? .2 : .34;
		oscillator.connect(filter).connect(voiceGain).connect(session.gain);
		oscillator.start(startAt);
		oscillator.stop(startAt + duration);
		session.sources.push(oscillator);
		this.trackSource(oscillator, [filter, voiceGain]);
		if (profile.noiseAmount <= 0 || !this.noiseBuffer) return;
		const noise = this.context.createBufferSource();
		const noiseFilter = this.context.createBiquadFilter();
		const noiseGain = this.context.createGain();
		noise.buffer = this.noiseBuffer;
		noise.loop = true;
		noiseFilter.type = character === "air" || character === "water" ? "bandpass" : "lowpass";
		noiseFilter.frequency.value = character === "air" ? 1250 : character === "water" ? 1750 : 850;
		noiseFilter.Q.value = character === "water" ? .8 : .35;
		noiseGain.gain.value = profile.noiseAmount;
		noise.connect(noiseFilter).connect(noiseGain).connect(session.gain);
		noise.start(startAt);
		noise.stop(startAt + duration);
		session.sources.push(noise);
		this.trackSource(noise, [noiseFilter, noiseGain]);
	}
	addStageTones(session, base, seed, profile) {
		if (!this.context) return;
		const now = this.context.currentTime;
		const schedule = (at, frequency, duration, gain, type) => {
			if (at + duration <= session.offset) return;
			const localAt = now + Math.max(0, at - session.offset);
			const localDuration = at < session.offset ? Math.max(.04, duration - (session.offset - at)) : duration;
			const oscillator = this.scheduleTone(session.gain, frequency, localAt, localDuration, gain, type);
			if (oscillator) session.sources.push(oscillator);
		};
		const [startup, , climax, finish] = profile.stages;
		schedule(startup.at, base * 1.7, Math.min(.12, startup.duration), .17, "square");
		schedule(startup.at + Math.min(.14, startup.duration * .34), base * 1.12, Math.min(.22, startup.duration * .52), .11, "triangle");
		const kind = session.kind;
		if (profile.character === "musical" || kind === "phone" || kind === "portable-speaker") PENTATONIC.forEach((step, index) => schedule(climax.at + index * Math.min(.1, climax.duration / 6), base * 2 ** (step / 12), Math.min(.16, climax.duration * .3), .1, "sine"));
		else {
			schedule(climax.at, base * (1.9 + seededValue(seed + 9) * .35), Math.min(.18, climax.duration * .3), .19, "triangle");
			schedule(climax.at + climax.duration * .35, base * .72, Math.min(.24, climax.duration * .4), .13, "sine");
		}
		schedule(finish.at, base * 1.25, Math.min(.12, finish.duration * .28), .12, "sine");
		schedule(finish.at + finish.duration * .42, base * .82, Math.min(.18, finish.duration * .42), .09, "triangle");
	}
	playAmbientChime() {
		if (!this.context || !this.buses.ambient) return;
		const seed = Math.floor(this.context.currentTime * 100);
		const root = 523.25;
		for (let index = 0; index < 3; index += 1) {
			const step = PENTATONIC[Math.floor(seededValue(seed + index * 31) * PENTATONIC.length)];
			this.scheduleTone(this.buses.ambient, root * 2 ** (step / 12), this.context.currentTime + index * .22, .7, .055, "sine");
		}
	}
	playInsectChirp() {
		if (!this.context || !this.buses.ambient) return;
		const now = this.context.currentTime;
		const base = 3150 + seededValue(Math.floor(now * 100)) * 520;
		for (let index = 0; index < 3; index += 1) this.scheduleTone(this.buses.ambient, base * (1 + index * .025), now + index * .075, .045, .018, "sine");
	}
	scheduleTone(destination, frequency, at, duration, level, type) {
		if (!this.context) return null;
		const oscillator = this.context.createOscillator();
		const gain = this.context.createGain();
		oscillator.type = type;
		oscillator.frequency.value = Math.max(28, frequency);
		gain.gain.setValueAtTime(1e-4, at);
		gain.gain.exponentialRampToValueAtTime(Math.max(2e-4, level), at + Math.min(.025, duration * .25));
		gain.gain.exponentialRampToValueAtTime(1e-4, at + duration);
		oscillator.connect(gain).connect(destination);
		oscillator.start(at);
		oscillator.stop(at + duration + .02);
		this.trackSource(oscillator, [gain]);
		return oscillator;
	}
	updateSpatial(session, camera) {
		if (!this.context) return;
		const position = session.target.root.getWorldPosition(this.spatialPosition).project(camera);
		session.panner.pan.setTargetAtTime(MathUtils.clamp(position.x * .72, -.8, .8), this.context.currentTime, .08);
		const distanceGain = MathUtils.clamp(1 - Math.abs(position.x) * .12 - Math.abs(position.y) * .08, .72, 1);
		const profile = APPLIANCE_AUDIO_PROFILES[session.kind];
		const activeElapsed = session.target.getActiveElapsed();
		const attack = MathUtils.smoothstep(activeElapsed, 0, .18);
		const release = MathUtils.smoothstep(profile.duration - activeElapsed, 0, .55);
		session.gain.gain.setTargetAtTime(profile.runGain * distanceGain * Math.min(attack, release), this.context.currentTime, .08);
	}
	stopSession(target, fade) {
		const session = this.sessions.get(target);
		if (!session) return;
		this.stopAudioSession(session, fade);
		this.sessions.delete(target);
	}
	stopAudioSession(session, fade) {
		if (!this.context) return;
		const stopAt = this.context.currentTime + Math.max(.01, fade);
		session.gain.gain.cancelScheduledValues(this.context.currentTime);
		session.gain.gain.setValueAtTime(Math.max(1e-4, session.gain.gain.value), this.context.currentTime);
		session.gain.gain.exponentialRampToValueAtTime(1e-4, stopAt);
		session.sources.forEach((source) => {
			try {
				source.stop(stopAt + .02);
			} catch {}
		});
		window.setTimeout(() => {
			session.gain.disconnect();
			session.panner.disconnect();
			this.activeNodes.delete(session.gain);
			this.activeNodes.delete(session.panner);
		}, (fade + .08) * 1e3);
	}
	trackSource(source, extras) {
		this.activeNodes.add(source);
		extras.forEach((node) => this.activeNodes.add(node));
		source.addEventListener("ended", () => {
			source.disconnect();
			extras.forEach((node) => {
				node.disconnect();
				this.activeNodes.delete(node);
			});
			this.activeNodes.delete(source);
		}, { once: true });
	}
	createNoiseBuffer(context) {
		const length = context.sampleRate * 2;
		const buffer = context.createBuffer(1, length, context.sampleRate);
		const channel = buffer.getChannelData(0);
		let last = 0;
		for (let index = 0; index < length; index += 1) {
			const white = seededValue(index + 23063) * 2 - 1;
			last = last * .86 + white * .14;
			channel[index] = last * .72 + white * .28;
		}
		return buffer;
	}
};
//#endregion
//#region src/skill/TelevisionReconstructionTransition.ts
var SWITCH_CENTERS = [...TELEVISION_INITIAL_SWITCHES, ...TELEVISION_RAPID_SWITCH_TIMES];
var NEW_FLASH_DURATIONS = [
	.12,
	.14,
	.1,
	.11,
	.12,
	.13,
	.15,
	.18
];
var OLD_FLICKER_LEAD = .085;
var RGB_OFFSET = .045;
var SWITCH_WINDOWS = SWITCH_CENTERS.map((start, index) => ({
	start,
	end: start + NEW_FLASH_DURATIONS[index]
}));
var EMPTY_DIAGNOSTICS$2 = () => ({
	active: false,
	elapsed: 0,
	duration: POWERED_ACTIVE_DURATION,
	phase: "idle",
	currentTopology: "old",
	targetIds: [],
	switchCount: 0,
	rgbGhostCount: 0,
	committed: false,
	spatiallyChangedCount: 0
});
function spatialSignature(definition) {
	return `${definition.exitDirection}:${definition.path.map((point) => point.join(",")).join(";")}`;
}
function preparePreviewMaterials(model, opacityScale) {
	const materials = [];
	const visited = /* @__PURE__ */ new Set();
	model.root.traverseVisible((object) => {
		if (!(object instanceof Mesh)) return;
		(Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => {
			if (visited.has(material)) return;
			visited.add(material);
			materials.push({
				material,
				visibleOpacity: material.opacity * opacityScale
			});
			material.transparent = true;
			material.opacity = 0;
			material.depthWrite = false;
			material.needsUpdate = true;
		});
	});
	return materials;
}
function setPreviewOpacity(materials, amount) {
	materials.forEach(({ material, visibleOpacity }) => {
		material.opacity = visibleOpacity * amount;
	});
}
function configureGhost(model, color) {
	model.setSkillTint(color, 1);
	model.setSkillGlow(1);
	model.root.traverseVisible((object) => {
		if (!(object instanceof Mesh)) return;
		object.renderOrder = 82;
	});
	return preparePreviewMaterials(model, .3);
}
var TelevisionReconstructionTransition = class {
	root = new Group();
	entries = [];
	startedAt = 0;
	getTimelineElapsed = null;
	commit = null;
	diagnosticsValue = EMPTY_DIAGNOSTICS$2();
	televisionRoot = null;
	televisionFlashBaseline = null;
	constructor() {
		this.root.name = "television-reconstruction-transition";
	}
	get diagnostics() {
		return {
			...this.diagnosticsValue,
			targetIds: [...this.diagnosticsValue.targetIds]
		};
	}
	start(options) {
		this.reset();
		this.startedAt = performance.now() * .001;
		this.getTimelineElapsed = options.getTimelineElapsed ?? null;
		this.commit = options.commit;
		this.televisionRoot = options.televisionRoot ?? null;
		this.televisionFlashBaseline = this.captureTelevisionFlashBaseline(this.televisionRoot);
		options.replacements.forEach((definition, cableId) => {
			const oldModel = options.existingModels.get(cableId);
			if (!oldModel) return;
			const plugStyle = options.getPlugStyle(definition.color);
			const nextModel = new PlugCableModel(definition, plugStyle);
			const redGhost = new PlugCableModel(definition, plugStyle);
			const cyanGhost = new PlugCableModel(definition, plugStyle);
			nextModel.root.name = `television-next-${cableId}`;
			redGhost.root.name = `television-rgb-red-${cableId}`;
			cyanGhost.root.name = `television-rgb-cyan-${cableId}`;
			nextModel.setSkillGlow(.72);
			const nextMaterials = preparePreviewMaterials(nextModel, 1);
			const redGhostMaterials = configureGhost(redGhost, 16725599);
			const cyanGhostMaterials = configureGhost(cyanGhost, 3528703);
			const basePosition = oldModel.root.position.clone();
			const baseQuaternion = oldModel.root.quaternion.clone();
			const baseScale = oldModel.root.scale.clone();
			nextModel.root.position.copy(basePosition);
			nextModel.root.quaternion.copy(baseQuaternion);
			nextModel.root.scale.copy(baseScale);
			redGhost.root.position.copy(basePosition);
			redGhost.root.quaternion.copy(baseQuaternion);
			redGhost.root.scale.copy(baseScale);
			cyanGhost.root.position.copy(basePosition);
			cyanGhost.root.quaternion.copy(baseQuaternion);
			cyanGhost.root.scale.copy(baseScale);
			this.root.add(redGhost.root, cyanGhost.root, nextModel.root);
			this.entries.push({
				cableId,
				oldModel,
				nextModel,
				redGhost,
				cyanGhost,
				basePosition,
				baseQuaternion,
				baseScale,
				nextMaterials,
				redGhostMaterials,
				cyanGhostMaterials
			});
		});
		const spatiallyChangedCount = this.entries.filter((entry) => spatialSignature(entry.oldModel.definition) !== spatialSignature(entry.nextModel.definition)).length;
		this.diagnosticsValue = {
			active: this.entries.length > 0,
			elapsed: 0,
			duration: POWERED_ACTIVE_DURATION,
			phase: this.entries.length > 0 ? "old-hold" : "complete",
			currentTopology: "old",
			targetIds: this.entries.map(({ cableId }) => cableId),
			switchCount: 0,
			rgbGhostCount: 0,
			committed: false,
			spatiallyChangedCount
		};
		return POWERED_ACTIVE_DURATION * 1e3;
	}
	update(camera) {
		if (!this.diagnosticsValue.active) return;
		const wallElapsed = Math.max(0, performance.now() * .001 - this.startedAt);
		const externalElapsed = this.getTimelineElapsed?.();
		const elapsed = Number.isFinite(externalElapsed) && (externalElapsed ?? 0) > 0 ? Math.max(0, externalElapsed) : wallElapsed;
		if (elapsed >= 5.12) {
			this.finish(elapsed);
			return;
		}
		const sample = this.sample(elapsed);
		const cameraRight = new Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
		const cameraUp = new Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
		const jitter = Math.sin(elapsed * 91) * .008;
		const ghostOffset = RGB_OFFSET + Math.abs(Math.sin(elapsed * 73)) * .018;
		const oldVisible = sample.phase === "old-hold" || sample.phase === "old-flicker" && Math.sin(elapsed * 118) > -.18;
		const newVisible = sample.phase === "new-glitch" || sample.phase === "new-locked";
		const ghostsVisible = sample.phase === "new-glitch" || sample.phase === "new-locked" && elapsed < 4.48 + .24;
		this.entries.forEach((entry, index) => {
			entry.oldModel.root.visible = oldVisible;
			entry.oldModel.root.scale.copy(entry.baseScale).multiplyScalar(1 + (sample.phase === "old-flicker" ? Math.abs(Math.sin(elapsed * 72)) * .018 : 0));
			entry.oldModel.setSkillGlow(sample.phase === "old-flicker" ? .95 : .58);
			setPreviewOpacity(entry.nextMaterials, newVisible ? 1 : 0);
			entry.nextModel.root.position.copy(entry.basePosition).addScaledVector(cameraRight, jitter * (index % 2 === 0 ? 1 : -1)).addScaledVector(cameraUp, Math.cos(elapsed * 83 + index) * .006);
			entry.nextModel.root.scale.copy(entry.baseScale).multiplyScalar(1 + (sample.phase === "new-glitch" ? Math.sin(elapsed * 64 + index) * .012 : 0));
			setPreviewOpacity(entry.redGhostMaterials, ghostsVisible ? 1 : 0);
			setPreviewOpacity(entry.cyanGhostMaterials, ghostsVisible ? 1 : 0);
			entry.redGhost.root.position.copy(entry.basePosition).addScaledVector(cameraRight, -ghostOffset).addScaledVector(cameraUp, jitter);
			entry.cyanGhost.root.position.copy(entry.basePosition).addScaledVector(cameraRight, ghostOffset).addScaledVector(cameraUp, -jitter);
		});
		this.updateTelevisionFlash(sample.phase, elapsed);
		this.diagnosticsValue = {
			...this.diagnosticsValue,
			elapsed,
			phase: sample.phase,
			currentTopology: newVisible ? "new" : "old",
			switchCount: sample.switchCount,
			rgbGhostCount: ghostsVisible ? this.entries.length * 2 : 0
		};
	}
	reset() {
		this.entries.forEach((entry) => {
			entry.oldModel.root.visible = true;
			entry.oldModel.root.position.copy(entry.basePosition);
			entry.oldModel.root.quaternion.copy(entry.baseQuaternion);
			entry.oldModel.root.scale.copy(entry.baseScale);
			entry.oldModel.setSkillGlow(0);
			entry.nextModel.dispose();
			entry.redGhost.dispose();
			entry.cyanGhost.dispose();
		});
		this.restoreTelevisionFlashBaseline();
		this.entries = [];
		this.getTimelineElapsed = null;
		this.commit = null;
		this.televisionRoot = null;
		this.televisionFlashBaseline = null;
		this.diagnosticsValue = EMPTY_DIAGNOSTICS$2();
	}
	dispose() {
		this.reset();
		this.root.removeFromParent();
	}
	captureTelevisionFlashBaseline(root) {
		if (!root) return null;
		const staticGroup = root.getObjectByName("television-static-snow-group");
		const scanline = root.getObjectByName("television-scanline-pivot");
		const screen = root.getObjectByName("television-crt-bulged-screen");
		const screenEmissives = [];
		if (screen && screen.type === "Mesh") {
			const rawMaterials = screen.material;
			(Array.isArray(rawMaterials) ? rawMaterials : [rawMaterials]).forEach((material) => {
				const toon = material;
				if ("emissive" in toon && toon.emissive instanceof Color) screenEmissives.push({
					material,
					color: toon.emissive.clone(),
					intensity: toon.emissiveIntensity
				});
			});
		}
		return {
			staticVisible: staticGroup?.visible ?? false,
			scanlineVisible: scanline?.visible ?? false,
			staticPosition: staticGroup?.position.clone() ?? new Vector3(),
			scanlinePosition: scanline?.position.clone() ?? new Vector3(),
			screenEmissives
		};
	}
	updateTelevisionFlash(phase, elapsed) {
		const root = this.televisionRoot;
		if (!root) return;
		const staticGroup = root.getObjectByName("television-static-snow-group");
		const scanline = root.getObjectByName("television-scanline-pivot");
		const screen = root.getObjectByName("television-crt-bulged-screen");
		const active = phase === "old-flicker" || phase === "new-glitch";
		if (staticGroup) {
			staticGroup.visible = active;
			const baseline = this.televisionFlashBaseline;
			if (baseline) {
				staticGroup.position.copy(baseline.staticPosition);
				staticGroup.position.x += Math.sin(elapsed * 91) * .028 * Number(active);
				staticGroup.position.y += Math.cos(elapsed * 67) * .018 * Number(active);
			}
		}
		if (scanline) {
			scanline.visible = active;
			const baseline = this.televisionFlashBaseline;
			if (baseline) scanline.position.copy(baseline.scanlinePosition);
			scanline.position.y += elapsed * 1.2 % 1.08 - .54;
		}
		let intensity = 0;
		if (screen && screen.type === "Mesh") {
			const rawMaterials = screen.material;
			const materials = Array.isArray(rawMaterials) ? rawMaterials : [rawMaterials];
			intensity = active ? .72 + Math.abs(Math.sin(elapsed * 47)) * .24 : 0;
			materials.forEach((material) => {
				const toon = material;
				if (!("emissive" in toon) || !(toon.emissive instanceof Color)) return;
				if (active) {
					toon.emissive.setHex(14674687);
					toon.emissiveIntensity = intensity;
				}
			});
		}
		root.userData.televisionReconstructionFlash = {
			active,
			phase,
			staticVisible: staticGroup?.visible ?? false,
			intensity
		};
	}
	restoreTelevisionFlashBaseline() {
		const root = this.televisionRoot;
		const baseline = this.televisionFlashBaseline;
		if (!root || !baseline) return;
		const staticGroup = root.getObjectByName("television-static-snow-group");
		const scanline = root.getObjectByName("television-scanline-pivot");
		if (staticGroup) {
			staticGroup.visible = baseline.staticVisible;
			staticGroup.position.copy(baseline.staticPosition);
		}
		if (scanline) {
			scanline.visible = baseline.scanlineVisible;
			scanline.position.copy(baseline.scanlinePosition);
		}
		baseline.screenEmissives.forEach(({ material, color, intensity }) => {
			const toon = material;
			if ("emissive" in toon && toon.emissive instanceof Color) {
				toon.emissive.copy(color);
				toon.emissiveIntensity = intensity;
			}
		});
		delete root.userData.televisionReconstructionFlash;
	}
	sample(elapsed) {
		if (elapsed >= 4.48) return {
			phase: "new-locked",
			switchCount: SWITCH_WINDOWS.length + 1
		};
		if (SWITCH_WINDOWS.find((window) => elapsed >= window.start && elapsed < window.end)) return {
			phase: "new-glitch",
			switchCount: SWITCH_WINDOWS.filter((window) => window.start <= elapsed).length
		};
		const nextWindow = SWITCH_WINDOWS.find((window) => elapsed < window.start);
		if (nextWindow && elapsed >= nextWindow.start - OLD_FLICKER_LEAD) return {
			phase: "old-flicker",
			switchCount: SWITCH_WINDOWS.filter((window) => window.end <= elapsed).length
		};
		return {
			phase: "old-hold",
			switchCount: SWITCH_WINDOWS.filter((window) => window.end <= elapsed).length
		};
	}
	finish(elapsed) {
		const commit = this.commit;
		const committed = commit?.() ?? false;
		this.entries.forEach((entry) => {
			if (!committed) {
				entry.oldModel.root.visible = true;
				entry.oldModel.root.position.copy(entry.basePosition);
				entry.oldModel.root.quaternion.copy(entry.baseQuaternion);
				entry.oldModel.root.scale.copy(entry.baseScale);
				entry.oldModel.setSkillGlow(0);
			}
			entry.nextModel.dispose();
			entry.redGhost.dispose();
			entry.cyanGhost.dispose();
		});
		this.entries = [];
		this.getTimelineElapsed = null;
		this.commit = null;
		this.restoreTelevisionFlashBaseline();
		this.diagnosticsValue = {
			...this.diagnosticsValue,
			active: false,
			elapsed,
			phase: "complete",
			currentTopology: committed ? "committed" : "old",
			rgbGhostCount: 0,
			committed,
			spatiallyChangedCount: this.diagnosticsValue.spatiallyChangedCount
		};
	}
};
//#endregion
//#region src/skill/ToasterHeatSwapTransition.ts
var PREHEAT_START = .32;
var COMPRESSION_START = 3.2;
var SWAP_START = 3.52;
var SWAP_END = 4.18;
var LINE_SWAP_START = 3.28;
var LINE_SWAP_END = 3.66;
var TERMINAL_SWAP_START = 3.56;
var TERMINAL_SWAP_END = 4.16;
var RELEASE_END = 4.86;
var COMMIT_TIME = 5.12;
var EMPTY_DIAGNOSTICS$1 = () => ({
	active: false,
	elapsed: 0,
	duration: POWERED_ACTIVE_DURATION,
	phase: "idle",
	currentTopology: "old",
	targetIds: [],
	screenProgress: 0,
	isolation: 0,
	lineProgress: 0,
	terminalProgress: 0,
	swapProgress: 0,
	previewCount: 0,
	committed: false
});
function collectMaterials(model, initialOpacity = 1) {
	const states = [];
	const visited = /* @__PURE__ */ new Set();
	model.root.traverseVisible((object) => {
		if (!(object instanceof Mesh)) return;
		(Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => {
			if (visited.has(material) || material.opacity <= .001 || material.colorWrite === false) return;
			visited.add(material);
			const uniformOpacity = material instanceof ShaderMaterial && typeof material.uniforms.uOpacity?.value === "number" ? Number(material.uniforms.uOpacity.value) : null;
			const role = material.name === "sakura-cable-toon" || object.name.endsWith("-cable") || object.name.endsWith("-cable-ink") ? "line" : "terminal";
			states.push({
				material,
				role,
				visibleOpacity: material.opacity,
				visibleUniformOpacity: uniformOpacity,
				transparent: material.transparent,
				opacity: material.opacity,
				depthWrite: material.depthWrite
			});
			material.transparent = true;
			material.depthWrite = false;
			material.opacity *= initialOpacity;
			if (uniformOpacity !== null) material.uniforms.uOpacity.value = uniformOpacity * initialOpacity;
			material.needsUpdate = true;
		});
	});
	return states;
}
function setOpacity(states, amount, role) {
	const clamped = MathUtils.clamp(amount, 0, 1);
	states.forEach(({ material, visibleOpacity, visibleUniformOpacity, role: stateRole }) => {
		if (role && stateRole !== role) return;
		material.opacity = visibleOpacity * clamped;
		if (visibleUniformOpacity !== null && material instanceof ShaderMaterial) material.uniforms.uOpacity.value = visibleUniformOpacity * clamped;
	});
}
function restoreMaterials(states) {
	states.forEach((state) => {
		state.material.transparent = state.transparent;
		state.material.opacity = state.opacity;
		if (state.visibleUniformOpacity !== null && state.material instanceof ShaderMaterial) state.material.uniforms.uOpacity.value = state.visibleUniformOpacity;
		state.material.depthWrite = state.depthWrite;
		state.material.needsUpdate = true;
	});
}
function phaseAt$2(elapsed) {
	if (elapsed < COMPRESSION_START) return "preheat";
	if (elapsed < SWAP_START) return "compression";
	if (elapsed < SWAP_END) return "swap";
	if (elapsed < COMMIT_TIME) return "release";
	return "complete";
}
var ToasterHeatSwapTransition = class {
	root = new Group();
	entries = [];
	backgroundMaterials = [];
	startedAt = 0;
	getTimelineElapsed = null;
	commit = null;
	diagnosticsValue = EMPTY_DIAGNOSTICS$1();
	constructor() {
		this.root.name = "toaster-heat-swap-transition";
	}
	get diagnostics() {
		return {
			...this.diagnosticsValue,
			targetIds: [...this.diagnosticsValue.targetIds]
		};
	}
	start(options) {
		this.reset();
		this.startedAt = performance.now() * .001;
		this.getTimelineElapsed = options.getTimelineElapsed ?? null;
		this.commit = options.commit;
		const targetIds = new Set(options.replacements.keys());
		options.existingModels.forEach((model, cableId) => {
			if (!targetIds.has(cableId)) this.backgroundMaterials.push(...collectMaterials(model));
		});
		options.replacements.forEach((definition, cableId) => {
			const oldModel = options.existingModels.get(cableId);
			if (!oldModel) return;
			const nextModel = new PlugCableModel(definition, options.getPlugStyle(definition.color));
			nextModel.root.name = `toaster-heat-next-${cableId}`;
			oldModel.setSkillGlow(0);
			nextModel.setSkillGlow(0);
			const oldMaterials = collectMaterials(oldModel);
			const nextMaterials = collectMaterials(nextModel, 0);
			this.root.add(nextModel.root);
			this.entries.push({
				cableId,
				oldModel,
				nextModel,
				oldMaterials,
				nextMaterials
			});
		});
		this.diagnosticsValue = {
			active: this.entries.length > 0,
			elapsed: 0,
			duration: POWERED_ACTIVE_DURATION,
			phase: this.entries.length > 0 ? "preheat" : "complete",
			currentTopology: "old",
			targetIds: this.entries.map(({ cableId }) => cableId),
			screenProgress: 0,
			isolation: 0,
			lineProgress: 0,
			terminalProgress: 0,
			swapProgress: 0,
			previewCount: this.entries.length,
			committed: false
		};
		return POWERED_ACTIVE_DURATION * 1e3;
	}
	update() {
		if (!this.diagnosticsValue.active) return;
		const wallElapsed = Math.max(0, performance.now() * .001 - this.startedAt);
		const externalElapsed = this.getTimelineElapsed?.();
		const elapsed = Number.isFinite(externalElapsed) && (externalElapsed ?? 0) > 0 ? Math.max(0, externalElapsed) : wallElapsed;
		if (elapsed >= COMMIT_TIME) {
			this.finish(elapsed);
			return;
		}
		const phase = phaseAt$2(elapsed);
		const screenProgress = MathUtils.clamp(elapsed / COMMIT_TIME, 0, 1);
		const isolation = MathUtils.smoothstep(elapsed, PREHEAT_START, COMPRESSION_START) * (1 - MathUtils.smoothstep(elapsed, RELEASE_END, COMMIT_TIME));
		const lineProgress = MathUtils.smoothstep(elapsed, LINE_SWAP_START, LINE_SWAP_END);
		const terminalProgress = MathUtils.smoothstep(elapsed, TERMINAL_SWAP_START, TERMINAL_SWAP_END);
		const oldLineOpacity = Math.sqrt(1 - lineProgress);
		const nextLineOpacity = Math.sqrt(lineProgress);
		const oldTerminalOpacity = Math.sqrt(1 - terminalProgress);
		const nextTerminalOpacity = Math.sqrt(terminalProgress);
		setOpacity(this.backgroundMaterials, 1 - isolation * .14);
		this.entries.forEach((entry) => {
			entry.oldModel.root.visible = oldLineOpacity > .015 || oldTerminalOpacity > .015;
			entry.nextModel.root.visible = nextLineOpacity > .015 || nextTerminalOpacity > .015;
			setOpacity(entry.oldMaterials, oldLineOpacity, "line");
			setOpacity(entry.nextMaterials, nextLineOpacity, "line");
			setOpacity(entry.oldMaterials, oldTerminalOpacity, "terminal");
			setOpacity(entry.nextMaterials, nextTerminalOpacity, "terminal");
			entry.oldModel.setSkillGlow(0);
			entry.nextModel.setSkillGlow(0);
		});
		this.diagnosticsValue = {
			...this.diagnosticsValue,
			elapsed,
			phase,
			currentTopology: lineProgress <= .001 && terminalProgress <= .001 ? "old" : terminalProgress >= .999 ? "new" : "blend",
			screenProgress,
			isolation,
			lineProgress,
			terminalProgress,
			swapProgress: terminalProgress
		};
	}
	reset() {
		restoreMaterials(this.backgroundMaterials);
		this.backgroundMaterials = [];
		this.entries.forEach((entry) => {
			restoreMaterials(entry.oldMaterials);
			entry.oldModel.root.visible = true;
			entry.oldModel.setSkillGlow(0);
			entry.nextModel.dispose();
		});
		this.entries = [];
		this.getTimelineElapsed = null;
		this.commit = null;
		this.diagnosticsValue = EMPTY_DIAGNOSTICS$1();
	}
	dispose() {
		this.reset();
		this.root.removeFromParent();
	}
	finish(elapsed) {
		restoreMaterials(this.backgroundMaterials);
		this.backgroundMaterials = [];
		const committed = this.commit?.() ?? false;
		this.entries.forEach((entry) => {
			if (!committed) {
				restoreMaterials(entry.oldMaterials);
				entry.oldModel.root.visible = true;
				entry.oldModel.setSkillGlow(0);
			}
			entry.nextModel.dispose();
		});
		this.entries = [];
		this.getTimelineElapsed = null;
		this.commit = null;
		this.diagnosticsValue = {
			...this.diagnosticsValue,
			active: false,
			elapsed,
			phase: "complete",
			currentTopology: committed ? "committed" : "old",
			screenProgress: 1,
			isolation: 0,
			lineProgress: 1,
			terminalProgress: 1,
			swapProgress: 1,
			previewCount: 0,
			committed
		};
	}
};
//#endregion
//#region src/skill/RefrigeratorFreezePresentation.ts
var FREEZE_COMPLETE_TIME = 3.45;
var ACTIVE_DURATION = 5.2;
var PERSISTENT_ENVIRONMENT_AMOUNT = .86;
var DEFAULT_THAW_DURATION = 1.05;
var MAX_VISUAL_FRAME_STEP = .2;
/**
* Owns only the refrigerator's visual timeline. Gameplay locking remains in
* SkillChallengeEngine; this controller keeps frost visible until that status
* is actually removed, then performs a short thaw instead of a hard cut.
*/
var RefrigeratorFreezePresentation = class {
	phaseValue = "idle";
	elapsedValue = 0;
	lastUpdateAt = 0;
	environmentAmountValue = 0;
	cableAmountValue = 0;
	cableProgressValue = 0;
	thawDurationValue = DEFAULT_THAW_DURATION;
	thawTimelineOrigin = 0;
	getThawTimelineElapsed = null;
	targetCableIdsValue = /* @__PURE__ */ new Set();
	activate(cableIds) {
		this.targetCableIdsValue.clear();
		cableIds.forEach((id) => this.targetCableIdsValue.add(id));
		this.phaseValue = this.targetCableIdsValue.size > 0 ? "freezing" : "idle";
		this.elapsedValue = 0;
		this.lastUpdateAt = performance.now() * .001;
		this.environmentAmountValue = 0;
		this.cableAmountValue = this.targetCableIdsValue.size > 0 ? 1 : 0;
		this.cableProgressValue = 0;
		this.thawDurationValue = DEFAULT_THAW_DURATION;
		this.thawTimelineOrigin = 0;
		this.getThawTimelineElapsed = null;
	}
	beginThaw(duration = DEFAULT_THAW_DURATION, getTimelineElapsed) {
		if (this.targetCableIdsValue.size === 0) return;
		this.phaseValue = "thawing";
		this.elapsedValue = 0;
		this.lastUpdateAt = performance.now() * .001;
		this.thawDurationValue = Math.max(.001, duration);
		this.getThawTimelineElapsed = getTimelineElapsed ?? null;
		this.thawTimelineOrigin = Math.max(0, this.getThawTimelineElapsed?.() ?? 0);
	}
	syncStatus(cableIds) {
		if (cableIds.length > 0) {
			if (this.targetCableIdsValue.size === 0) {
				cableIds.forEach((id) => this.targetCableIdsValue.add(id));
				this.phaseValue = "persistent";
				this.environmentAmountValue = PERSISTENT_ENVIRONMENT_AMOUNT;
				this.cableAmountValue = 1;
				this.cableProgressValue = 1;
			}
			return;
		}
		if (this.targetCableIdsValue.size > 0 && this.phaseValue !== "thawing") this.beginThaw();
	}
	update(delta) {
		const now = performance.now() * .001;
		const wallStep = this.lastUpdateAt > 0 ? Math.min(Math.max(0, now - this.lastUpdateAt), MAX_VISUAL_FRAME_STEP) : 0;
		this.lastUpdateAt = now;
		const step = Math.max(Math.min(Math.max(0, delta), MAX_VISUAL_FRAME_STEP), wallStep);
		if (this.phaseValue === "freezing") {
			this.elapsedValue = Math.min(ACTIVE_DURATION, this.elapsedValue + step);
			const freeze = MathUtils.smoothstep(this.elapsedValue, 0, FREEZE_COMPLETE_TIME);
			this.cableProgressValue = freeze;
			this.cableAmountValue = 1;
			if (this.elapsedValue <= FREEZE_COMPLETE_TIME) this.environmentAmountValue = freeze;
			else {
				const settle = MathUtils.smoothstep(this.elapsedValue, 4.35, ACTIVE_DURATION);
				this.environmentAmountValue = MathUtils.lerp(1, PERSISTENT_ENVIRONMENT_AMOUNT, settle);
			}
			if (this.elapsedValue >= 5.199999) {
				this.elapsedValue = ACTIVE_DURATION;
				this.phaseValue = "persistent";
				this.environmentAmountValue = PERSISTENT_ENVIRONMENT_AMOUNT;
				this.cableProgressValue = 1;
			}
			return;
		}
		if (this.phaseValue === "persistent") {
			this.environmentAmountValue = PERSISTENT_ENVIRONMENT_AMOUNT;
			this.cableAmountValue = 1;
			this.cableProgressValue = 1;
			return;
		}
		if (this.phaseValue === "thawing") {
			const timelineElapsed = this.getThawTimelineElapsed?.();
			this.elapsedValue = Number.isFinite(timelineElapsed) ? Math.min(this.thawDurationValue, Math.max(0, (timelineElapsed ?? 0) - this.thawTimelineOrigin)) : Math.min(this.thawDurationValue, this.elapsedValue + step);
			const remaining = 1 - MathUtils.smoothstep(this.elapsedValue, 0, this.thawDurationValue);
			this.environmentAmountValue = PERSISTENT_ENVIRONMENT_AMOUNT * remaining;
			this.cableAmountValue = remaining;
			this.cableProgressValue = 1;
			if (this.elapsedValue >= this.thawDurationValue - 1e-6) this.reset();
		}
	}
	reset() {
		this.phaseValue = "idle";
		this.elapsedValue = 0;
		this.lastUpdateAt = 0;
		this.environmentAmountValue = 0;
		this.cableAmountValue = 0;
		this.cableProgressValue = 0;
		this.thawDurationValue = DEFAULT_THAW_DURATION;
		this.thawTimelineOrigin = 0;
		this.getThawTimelineElapsed = null;
		this.targetCableIdsValue.clear();
	}
	hasTarget(cableId) {
		return this.targetCableIdsValue.has(cableId);
	}
	get visible() {
		return this.phaseValue !== "idle" && this.environmentAmountValue > .001;
	}
	get environmentAmount() {
		return this.environmentAmountValue;
	}
	get cableAmount() {
		return this.cableAmountValue;
	}
	get cableProgress() {
		return this.cableProgressValue;
	}
	get diagnostics() {
		return {
			phase: this.phaseValue,
			elapsed: this.elapsedValue,
			environmentAmount: this.environmentAmountValue,
			cableAmount: this.cableAmountValue,
			cableProgress: this.cableProgressValue,
			targetCableIds: [...this.targetCableIdsValue]
		};
	}
};
//#endregion
//#region src/skill/KettleThawPresentation.ts
var KETTLE_THAW_DURATION = 2.9;
var EMPTY_DIAGNOSTICS = () => ({
	active: false,
	elapsed: 0,
	duration: KETTLE_THAW_DURATION,
	phase: "idle",
	progress: 0,
	heatAmount: 0,
	targetCableIds: []
});
function phaseAt$1(progress) {
	if (progress < .2) return "heating";
	if (progress < .72) return "melting";
	if (progress < 1) return "release";
	return "complete";
}
var KettleThawPresentation = class {
	startedAt = 0;
	timelineOrigin = 0;
	getTimelineElapsed = null;
	diagnosticsValue = EMPTY_DIAGNOSTICS();
	start(options) {
		this.startedAt = performance.now() * .001;
		this.getTimelineElapsed = options.getTimelineElapsed ?? null;
		this.timelineOrigin = Math.max(0, this.getTimelineElapsed?.() ?? 0);
		this.diagnosticsValue = {
			active: true,
			elapsed: 0,
			duration: KETTLE_THAW_DURATION,
			phase: "heating",
			progress: 1e-4,
			heatAmount: 0,
			targetCableIds: [...options.targetCableIds]
		};
		return KETTLE_THAW_DURATION * 1e3;
	}
	update() {
		if (!this.diagnosticsValue.active) return;
		const wallElapsed = Math.max(0, performance.now() * .001 - this.startedAt);
		const timelineElapsed = this.getTimelineElapsed?.();
		const elapsed = Number.isFinite(timelineElapsed) ? Math.max(0, (timelineElapsed ?? 0) - this.timelineOrigin) : wallElapsed;
		const progress = MathUtils.clamp(elapsed / KETTLE_THAW_DURATION, 0, 1);
		const heatIn = MathUtils.smoothstep(progress, .015, .2);
		const heatOut = 1 - MathUtils.smoothstep(progress, .74, 1);
		const active = progress < 1;
		this.diagnosticsValue = {
			...this.diagnosticsValue,
			active,
			elapsed: Math.min(elapsed, KETTLE_THAW_DURATION),
			phase: phaseAt$1(progress),
			progress,
			heatAmount: heatIn * heatOut
		};
	}
	reset() {
		this.startedAt = 0;
		this.timelineOrigin = 0;
		this.getTimelineElapsed = null;
		this.diagnosticsValue = EMPTY_DIAGNOSTICS();
	}
	get diagnostics() {
		return this.diagnosticsValue;
	}
};
//#endregion
//#region src/skill/RefrigeratorScreenIceOverlay.ts
var SVG_NS = "http://www.w3.org/2000/svg";
var WIDTH = 1600;
var HEIGHT = 1e3;
var OUTWARD_BIAS = 40;
var TOP = [
	[
		18,
		126,
		178,
		12,
		.18,
		0
	],
	[
		190,
		104,
		126,
		-13,
		.38,
		2
	],
	[
		410,
		82,
		92,
		10,
		.56,
		1
	],
	[
		650,
		108,
		132,
		-18,
		.34,
		3
	],
	[
		890,
		72,
		80,
		8,
		.62,
		1
	],
	[
		1110,
		96,
		112,
		15,
		.46,
		2
	],
	[
		1340,
		118,
		148,
		-14,
		.32,
		3
	],
	[
		1582,
		142,
		192,
		-18,
		.17,
		0
	]
];
var BOTTOM = [
	[
		18,
		168,
		228,
		22,
		.16,
		0
	],
	[
		250,
		140,
		178,
		-22,
		.31,
		3
	],
	[
		500,
		92,
		108,
		14,
		.52,
		1
	],
	[
		720,
		68,
		72,
		-8,
		.63,
		2
	],
	[
		935,
		78,
		86,
		8,
		.58,
		1
	],
	[
		1165,
		112,
		138,
		-18,
		.43,
		2
	],
	[
		1390,
		152,
		198,
		20,
		.27,
		3
	],
	[
		1582,
		172,
		236,
		-22,
		.15,
		0
	]
];
var LEFT = [
	[
		28,
		118,
		168,
		14,
		.19,
		0
	],
	[
		225,
		88,
		112,
		-12,
		.43,
		2
	],
	[
		455,
		72,
		84,
		9,
		.61,
		1
	],
	[
		690,
		90,
		118,
		-15,
		.47,
		3
	],
	[
		875,
		116,
		164,
		17,
		.28,
		2
	],
	[
		985,
		132,
		190,
		-18,
		.17,
		0
	]
];
var RIGHT = [
	[
		26,
		132,
		188,
		-16,
		.18,
		0
	],
	[
		220,
		96,
		126,
		14,
		.39,
		3
	],
	[
		445,
		74,
		88,
		-9,
		.59,
		1
	],
	[
		675,
		92,
		122,
		15,
		.45,
		2
	],
	[
		865,
		122,
		172,
		-18,
		.27,
		3
	],
	[
		986,
		142,
		202,
		20,
		.16,
		0
	]
];
var SHARD_VARIANTS = [
	[
		{
			kind: "slab",
			offset: -.42,
			width: .56,
			depth: .66,
			tip: -.34,
			base: .04,
			birth: 0,
			palette: 1
		},
		{
			kind: "blade",
			offset: .46,
			width: .44,
			depth: .78,
			tip: .58,
			base: .02,
			birth: .035,
			palette: 0
		},
		{
			kind: "slab",
			offset: 0,
			width: .72,
			depth: 1,
			tip: .16,
			base: .08,
			birth: .075,
			palette: 2
		},
		{
			kind: "chip",
			offset: -.56,
			width: .38,
			depth: .38,
			tip: -.7,
			base: .12,
			birth: .13,
			palette: 3
		}
	],
	[
		{
			kind: "chip",
			offset: -.48,
			width: .5,
			depth: .46,
			tip: -.62,
			base: .04,
			birth: 0,
			palette: 0
		},
		{
			kind: "blade",
			offset: .08,
			width: .6,
			depth: 1,
			tip: -.08,
			base: .06,
			birth: .055,
			palette: 2
		},
		{
			kind: "slab",
			offset: .55,
			width: .43,
			depth: .58,
			tip: .7,
			base: .1,
			birth: .12,
			palette: 1
		}
	],
	[
		{
			kind: "blade",
			offset: -.4,
			width: .52,
			depth: .78,
			tip: -.55,
			base: .03,
			birth: 0,
			palette: 1
		},
		{
			kind: "slab",
			offset: .2,
			width: .66,
			depth: 1,
			tip: .34,
			base: .07,
			birth: .06,
			palette: 0
		},
		{
			kind: "chip",
			offset: .64,
			width: .34,
			depth: .42,
			tip: .72,
			base: .14,
			birth: .135,
			palette: 3
		}
	],
	[
		{
			kind: "chip",
			offset: -.68,
			width: .38,
			depth: .42,
			tip: -.78,
			base: .06,
			birth: 0,
			palette: 3
		},
		{
			kind: "slab",
			offset: -.32,
			width: .58,
			depth: .82,
			tip: -.46,
			base: .04,
			birth: .025,
			palette: 0
		},
		{
			kind: "blade",
			offset: .26,
			width: .55,
			depth: 1,
			tip: .42,
			base: .07,
			birth: .075,
			palette: 2
		},
		{
			kind: "slab",
			offset: .68,
			width: .35,
			depth: .54,
			tip: .78,
			base: .13,
			birth: .14,
			palette: 1
		}
	]
];
var PALETTES = [
	{
		base: "#9edfe2",
		dark: "#60bbc9",
		light: "#d6f0e8",
		shine: "#f5efd8"
	},
	{
		base: "#7dced8",
		dark: "#55b4c5",
		light: "#c8ece6",
		shine: "#edf1d8"
	},
	{
		base: "#b7e6e3",
		dark: "#72c5cf",
		light: "#e1f2e9",
		shine: "#f7efd7"
	},
	{
		base: "#a6dadd",
		dark: "#69bfcb",
		light: "#d7ede4",
		shine: "#f4ebcf"
	}
];
var NIGHT_PALETTES = [
	{
		base: "#527f8d",
		dark: "#345e70",
		light: "#769ca4",
		shine: "#9fb6ad"
	},
	{
		base: "#456f80",
		dark: "#2d5669",
		light: "#688f9a",
		shine: "#8fa99f"
	},
	{
		base: "#648e98",
		dark: "#426d7c",
		light: "#89a8aa",
		shine: "#a8b9ad"
	},
	{
		base: "#577d88",
		dark: "#385f70",
		light: "#77999d",
		shine: "#9cafaa"
	}
];
var ICE_OUTLINE_DAY = "#496a8d";
var ICE_OUTLINE_NIGHT = "#263b50";
var ICE_FACET_DAY = "#587b98";
var ICE_FACET_NIGHT = "#35566b";
var ROOTS = [
	{
		edge: "top",
		birth: .03,
		samples: [
			24,
			17,
			28,
			19,
			23,
			15,
			27,
			18,
			25,
			16,
			22,
			14,
			26,
			18,
			24,
			16,
			27
		]
	},
	{
		edge: "right",
		birth: .07,
		samples: [
			22,
			16,
			27,
			18,
			24,
			15,
			28,
			17,
			23,
			19,
			26
		]
	},
	{
		edge: "bottom",
		birth: .11,
		samples: [
			26,
			18,
			23,
			15,
			28,
			19,
			24,
			16,
			27,
			17,
			22,
			14,
			26,
			18,
			24,
			16,
			28
		]
	},
	{
		edge: "left",
		birth: .15,
		samples: [
			24,
			17,
			27,
			15,
			22,
			18,
			28,
			16,
			25,
			19,
			26
		]
	}
];
function clamp01(value) {
	return Math.max(0, Math.min(1, value));
}
function smoothstep(edge0, edge1, value) {
	const t = clamp01((value - edge0) / Math.max(1e-6, edge1 - edge0));
	return t * t * (3 - 2 * t);
}
function createSvgElement(tag) {
	return document.createElementNS(SVG_NS, tag);
}
function globalPoint(edge, center, point) {
	if (edge === "top") return [center + point[0], point[1]];
	if (edge === "bottom") return [center + point[0], HEIGHT - point[1]];
	if (edge === "left") return [point[1], center + point[0]];
	return [WIDTH - point[1], center + point[0]];
}
function pointString(points) {
	return points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
}
function mixHexColor(from, to, amount) {
	const fromValue = Number.parseInt(from.slice(1), 16);
	const toValue = Number.parseInt(to.slice(1), 16);
	const channel = (shift) => Math.round((fromValue >> shift & 255) * (1 - amount) + (toValue >> shift & 255) * amount);
	return `rgb(${channel(16)} ${channel(8)} ${channel(0)})`;
}
var RefrigeratorScreenIceOverlay = class {
	root;
	backgroundGrade;
	crystals = [];
	roots = [];
	progress = 0;
	themeProgress = 0;
	outlineScale = .5;
	visibleCrystalCount = 0;
	connectedRootCount = 0;
	constructor(canvas) {
		if (!canvas.parentElement) throw new Error("Refrigerator screen ice requires a canvas parent.");
		this.root = createSvgElement("svg");
		this.root.id = "refrigerator-screen-ice";
		this.root.classList.add("refrigerator-screen-ice");
		this.root.setAttribute("viewBox", `0 0 ${WIDTH} ${HEIGHT}`);
		this.root.setAttribute("preserveAspectRatio", "none");
		this.root.setAttribute("shape-rendering", "geometricPrecision");
		this.root.setAttribute("aria-hidden", "true");
		this.backgroundGrade = createSvgElement("rect");
		this.backgroundGrade.setAttribute("width", `${WIDTH}`);
		this.backgroundGrade.setAttribute("height", `${HEIGHT}`);
		this.backgroundGrade.setAttribute("fill", "#e7f5f3");
		this.backgroundGrade.style.opacity = "0";
		this.root.append(this.backgroundGrade);
		for (const spec of ROOTS) this.roots.push(this.createRoot(spec.edge, spec.birth, spec.samples));
		this.addCrystals("top", TOP);
		this.addCrystals("right", RIGHT);
		this.addCrystals("bottom", BOTTOM);
		this.addCrystals("left", LEFT);
		canvas.insertAdjacentElement("afterend", this.root);
		this.setProgress(0);
	}
	setProgress(value) {
		const progress = clamp01(value);
		if (Math.abs(progress - this.progress) < 5e-4) return;
		this.progress = progress;
		this.root.classList.toggle("visible", progress > .002);
		const gradeOpacity = progress * (.16 - this.themeProgress * .035);
		this.backgroundGrade.style.opacity = `${gradeOpacity}`;
		this.connectedRootCount = 0;
		for (const root of this.roots) {
			const local = smoothstep(0, 1, progress);
			root.element.style.opacity = local > .01 ? `${Math.min(1, local * 1.28)}` : "0";
			root.element.setAttribute("points", pointString(this.rootPoints(root, local)));
			if (local > .94) this.connectedRootCount += 1;
		}
		this.visibleCrystalCount = 0;
		for (const crystal of this.crystals) {
			let clusterGrowth = 0;
			for (const part of crystal.parts) {
				const local = smoothstep(0, 1, progress);
				clusterGrowth = Math.max(clusterGrowth, local);
				part.element.style.display = local > .008 ? "" : "none";
				part.element.style.opacity = `${smoothstep(.02, .2, local)}`;
				const grown = part.points.map(([tangent, inward]) => [part.anchor + (tangent - part.anchor) * (.14 + local * .86), inward * local]);
				part.element.setAttribute("points", pointString(grown.map((point) => globalPoint(crystal.edge, crystal.center, point))));
			}
			crystal.group.style.display = clusterGrowth > .008 ? "" : "none";
			if (clusterGrowth > .6) this.visibleCrystalCount += 1;
		}
	}
	setThemeProgress(value) {
		const next = clamp01(value);
		if (Math.abs(next - this.themeProgress) < .001) return;
		this.themeProgress = next;
		this.backgroundGrade.setAttribute("fill", mixHexColor("#e7f5f3", "#142536", next));
		this.backgroundGrade.style.opacity = `${this.progress * (.16 - next * .035)}`;
		this.updateAppearance();
	}
	setOutlineMode(mode) {
		this.outlineScale = mode === "none" ? 0 : mode === "half" ? .5 : 1;
		this.updateAppearance();
	}
	get diagnostics() {
		return {
			progress: this.progress,
			visible: this.progress > .002,
			crystalCount: this.crystals.length,
			visibleCrystalCount: this.visibleCrystalCount,
			connectedRootCount: this.connectedRootCount,
			centerObscured: false
		};
	}
	dispose() {
		this.root.remove();
	}
	addCrystals(edge, specs) {
		for (const [center, radius, depth, lean, birth, variant] of specs) this.crystals.push(this.createCluster(edge, center, radius, depth, lean, birth, variant));
	}
	createCluster(edge, center, radius, depth, lean, birth, variant) {
		const group = createSvgElement("g");
		group.classList.add("refrigerator-ice-crystal");
		const parts = [];
		for (const shard of SHARD_VARIANTS[variant % SHARD_VARIANTS.length]) this.addShard(group, parts, edge, radius, depth, lean, shard);
		this.root.append(group);
		return {
			edge,
			center,
			birth,
			group,
			parts
		};
	}
	addShard(group, parts, edge, radius, depth, clusterLean, shard) {
		const anchor = radius * shard.offset;
		const tangentScale = edge === "top" ? .68 : 1;
		const halfWidth = radius * shard.width * tangentScale;
		const base = depth * shard.base;
		const shardDepth = depth * shard.depth * (edge === "top" ? 1.1 : 1);
		const tip = radius * shard.tip + clusterLean * shard.depth;
		const left = [anchor - halfWidth, base];
		const right = [anchor + halfWidth, base + depth * .018];
		let outline;
		let darkFacet;
		let lightFacet;
		let shineFacet;
		if ((edge === "top" ? "blade" : shard.kind) === "blade") {
			const leftShoulder = [anchor - halfWidth * .68, shardDepth * .58];
			const rightShoulder = [anchor + halfWidth * .72, shardDepth * .34];
			const tipPoint = [tip, shardDepth];
			const join = [anchor + (tip - anchor) * .2, shardDepth * .36];
			outline = [
				left,
				right,
				rightShoulder,
				tipPoint,
				leftShoulder
			];
			darkFacet = [
				left,
				leftShoulder,
				tipPoint,
				join
			];
			lightFacet = [
				join,
				right,
				rightShoulder,
				tipPoint
			];
			shineFacet = [
				join,
				rightShoulder,
				[tip * .7 + anchor * .3, shardDepth * .66]
			];
		} else if (shard.kind === "slab") {
			const upperLeft = [anchor - halfWidth * .58, shardDepth * .76];
			const upperRight = [anchor + halfWidth * .7, shardDepth * .68];
			const tipPoint = [tip, shardDepth];
			const join = [anchor + halfWidth * .05, shardDepth * .38];
			outline = [
				left,
				right,
				upperRight,
				tipPoint,
				upperLeft
			];
			darkFacet = [
				left,
				upperLeft,
				tipPoint,
				join
			];
			lightFacet = [
				join,
				right,
				upperRight,
				tipPoint
			];
			shineFacet = [
				join,
				upperRight,
				[tip * .58 + anchor * .42, shardDepth * .78],
				tipPoint
			];
		} else {
			const upperLeft = [anchor - halfWidth * .74, shardDepth * .72];
			const upperRight = [anchor + halfWidth * .54, shardDepth * .82];
			const tipPoint = [tip, shardDepth];
			const join = [anchor - halfWidth * .04, shardDepth * .42];
			outline = [
				left,
				right,
				upperRight,
				tipPoint,
				upperLeft
			];
			darkFacet = [
				left,
				upperLeft,
				tipPoint,
				join
			];
			lightFacet = [
				join,
				right,
				upperRight,
				tipPoint
			];
			shineFacet = [
				join,
				upperRight,
				tipPoint
			];
		}
		const shiftOutward = (points) => points.map(([tangent, inward]) => [tangent, inward - OUTWARD_BIAS]);
		const palette = PALETTES[shard.palette % PALETTES.length];
		const nightPalette = NIGHT_PALETTES[shard.palette % NIGHT_PALETTES.length];
		parts.push(this.addPolygon(group, shiftOutward(outline), anchor, shard.birth, palette.base, nightPalette.base, ICE_OUTLINE_DAY, ICE_OUTLINE_NIGHT, 4.6));
		parts.push(this.addPolygon(group, shiftOutward(darkFacet), anchor, shard.birth, palette.dark, nightPalette.dark, ICE_FACET_DAY, ICE_FACET_NIGHT, 1.15));
		parts.push(this.addPolygon(group, shiftOutward(lightFacet), anchor, shard.birth, palette.light, nightPalette.light, ICE_FACET_DAY, ICE_FACET_NIGHT, 1.15));
		parts.push(this.addPolygon(group, shiftOutward(shineFacet), anchor, shard.birth, palette.shine, nightPalette.shine, "none", "none", 0));
	}
	addPolygon(group, points, anchor, birthOffset, dayFill, nightFill, dayStroke, nightStroke, strokeWidth) {
		const element = createSvgElement("polygon");
		element.setAttribute("fill", dayFill);
		element.setAttribute("stroke", dayStroke);
		element.setAttribute("stroke-width", `${strokeWidth}`);
		element.setAttribute("stroke-linejoin", "round");
		element.setAttribute("vector-effect", "non-scaling-stroke");
		group.append(element);
		return {
			element,
			points,
			anchor,
			birthOffset,
			dayFill,
			nightFill,
			dayStroke,
			nightStroke,
			strokeWidth
		};
	}
	createRoot(edge, birth, samples) {
		const element = createSvgElement("polygon");
		element.classList.add("refrigerator-ice-root");
		element.setAttribute("fill", "#94d5da");
		element.setAttribute("stroke", "#496a8d");
		element.setAttribute("stroke-width", "4.2");
		element.setAttribute("stroke-linejoin", "round");
		element.setAttribute("vector-effect", "non-scaling-stroke");
		this.root.append(element);
		return {
			edge,
			birth,
			element,
			samples,
			strokeWidth: 4.2
		};
	}
	updateAppearance() {
		for (const crystal of this.crystals) for (const part of crystal.parts) {
			part.element.setAttribute("fill", mixHexColor(part.dayFill, part.nightFill, this.themeProgress));
			part.element.setAttribute("stroke", part.dayStroke === "none" ? "none" : mixHexColor(part.dayStroke, part.nightStroke, this.themeProgress));
			part.element.setAttribute("stroke-width", `${part.strokeWidth * this.outlineScale}`);
		}
		for (const root of this.roots) {
			root.element.setAttribute("fill", mixHexColor("#94d5da", "#466f7d", this.themeProgress));
			root.element.setAttribute("stroke", mixHexColor(ICE_OUTLINE_DAY, ICE_OUTLINE_NIGHT, this.themeProgress));
			root.element.setAttribute("stroke-width", `${root.strokeWidth * this.outlineScale}`);
		}
	}
	rootPoints(root, growth) {
		const extent = root.edge === "top" || root.edge === "bottom" ? WIDTH : HEIGHT;
		const outer = root.edge === "top" ? [[0, 0], [WIDTH, 0]] : root.edge === "bottom" ? [[WIDTH, HEIGHT], [0, HEIGHT]] : root.edge === "left" ? [[0, HEIGHT], [0, 0]] : [[WIDTH, 0], [WIDTH, HEIGHT]];
		const inner = root.samples.map((sampleDepth, index) => {
			const along = extent * index / (root.samples.length - 1);
			return globalPoint(root.edge, along, [0, sampleDepth * growth]);
		});
		if (root.edge === "top" || root.edge === "right") inner.reverse();
		return [...outer, ...inner];
	}
};
//#endregion
//#region src/skill/WasherSpinPresentation.ts
var WASHER_ACTIVE_DURATION = 6.6;
var SPIN_UP_END = 1.2;
var RING_EXPANSION_END = 1.2;
var CRUISE_END = 3.45;
var SLOWDOWN_END = 5.9;
var REBOUND_END = 6.35;
var FIRST_LAUNCH_AT = 1.98;
var SECOND_LAUNCH_AT = 2.82;
var RING_COLLAPSE_START = 3.48;
var MAX_ANGULAR_SPEED = 15.5;
var TARGET_RING_RADIUS = 4.4;
var MIN_RING_EXPANSION = 2.2;
var MAX_TANGENTIAL_DRIFT = .56;
var MAX_AXIAL_DRIFT = .3;
var MAX_TIMELINE_STEP = .05;
var emptyDiagnostics = () => ({
	active: false,
	elapsed: 0,
	duration: WASHER_ACTIVE_DURATION,
	phase: "idle",
	spinAngle: 0,
	angularVelocity: 0,
	centrifugalAmount: 0,
	averageEntryOffset: 0,
	maxEntryOffset: 0,
	minimumPlanarRadius: 0,
	averagePlanarRadius: 0,
	launchOrder: [],
	launchElapsedSeconds: [],
	targetIds: [],
	remainingCount: 0
});
var smooth = (value) => MathUtils.smoothstep(value, 0, 1);
function phaseAt(elapsed) {
	if (elapsed < SPIN_UP_END) return "spin-up";
	if (elapsed < FIRST_LAUNCH_AT) return "centrifuge";
	if (elapsed < SECOND_LAUNCH_AT) return "launch";
	if (elapsed < SLOWDOWN_END) return "slowdown";
	if (elapsed < REBOUND_END) return "rebound";
	if (elapsed < WASHER_ACTIVE_DURATION) return "settle";
	return "complete";
}
/**
* Visual-only washer centrifuge. Rule state is committed by the skill engine,
* while this controller delays model removal until each cable visibly launches.
*/
var WasherSpinPresentation = class {
	cableRoot = null;
	entries = [];
	targetIds = [];
	launchOrder = [];
	launchElapsedSeconds = [];
	firstLaunchElapsed = -1;
	timelineElapsed = 0;
	baseRootPosition = new Vector3();
	baseRootQuaternion = new Quaternion();
	baseRootScale = new Vector3(1, 1, 1);
	/** The drum axis is captured from the player's view so the spin reads as a
	* left/right circle on screen instead of a world-space tumble. */
	spinAxis = new Vector3(0, 0, 1);
	cameraForwardWorld = new Vector3(0, 0, -1);
	screenRightWorld = new Vector3(1, 0, 0);
	centerOffset = new Vector3();
	rotationScratch = new Quaternion();
	diagnosticsValue = emptyDiagnostics();
	get diagnostics() {
		return this.diagnosticsValue;
	}
	start(options) {
		this.reset();
		this.cableRoot = options.cableRoot;
		this.onLaunch = options.onLaunch;
		this.baseRootPosition.copy(options.cableRoot.position);
		this.baseRootQuaternion.copy(options.cableRoot.quaternion);
		this.baseRootScale.copy(options.cableRoot.scale);
		const worldSpinAxis = options.camera.getWorldDirection(new Vector3()).normalize();
		this.cameraForwardWorld.copy(worldSpinAxis);
		this.screenRightWorld.setFromMatrixColumn(options.camera.matrixWorld, 0).normalize();
		const parentQuaternion = new Quaternion();
		options.cableRoot.parent?.getWorldQuaternion(parentQuaternion);
		this.spinAxis.copy(worldSpinAxis).applyQuaternion(parentQuaternion.invert()).normalize();
		this.targetIds = options.targetIds.filter((id) => options.models.has(id)).slice(0, 2);
		const activeArrows = options.arrows.filter((arrow) => arrow.state !== "removed");
		const center = new Vector3();
		let pointCount = 0;
		activeArrows.forEach((arrow) => arrow.samplePoints.forEach((point) => {
			center.add(point);
			pointCount += 1;
		}));
		if (pointCount > 0) center.multiplyScalar(1 / pointCount);
		this.centerOffset.copy(center);
		activeArrows.forEach((arrow, index) => {
			const model = options.models.get(arrow.definition.id);
			if (!model) return;
			const radial = arrow.samplePoints.reduce((sum, point) => sum.add(point), new Vector3()).multiplyScalar(1 / Math.max(1, arrow.samplePoints.length)).sub(center);
			radial.addScaledVector(this.spinAxis, -radial.dot(this.spinAxis));
			const basePlanarRadius = radial.length();
			if (radial.lengthSq() < .02) {
				const fallback = new Vector3(1, 0, 0);
				if (Math.abs(fallback.dot(this.spinAxis)) > .9) fallback.set(0, 1, 0);
				radial.crossVectors(this.spinAxis, fallback).normalize();
				radial.applyAxisAngle(this.spinAxis, index * 2.399963229728653);
			}
			radial.normalize();
			const tangent = new Vector3().crossVectors(this.spinAxis, radial);
			if (tangent.lengthSq() < .01) tangent.set(-radial.y, radial.x, 0);
			tangent.normalize();
			this.entries.push({
				id: arrow.definition.id,
				model,
				basePosition: model.root.position.clone(),
				baseQuaternion: model.root.quaternion.clone(),
				radial,
				tangent,
				basePlanarRadius,
				ringExpansion: Math.max(MIN_RING_EXPANSION, TARGET_RING_RADIUS - basePlanarRadius),
				phaseOffset: index * 2.399963229728653,
				launched: false
			});
		});
		const centerInParent = center.clone().multiply(this.baseRootScale).applyQuaternion(this.baseRootQuaternion);
		options.cableRoot.position.copy(this.baseRootPosition).add(centerInParent);
		this.entries.forEach((entry) => {
			entry.model.root.position.copy(entry.basePosition).sub(center);
		});
		this.timelineElapsed = 0;
		this.launchOrder = [];
		this.launchElapsedSeconds = [];
		this.diagnosticsValue = {
			...emptyDiagnostics(),
			active: this.entries.length > 0,
			phase: this.entries.length > 0 ? "spin-up" : "complete",
			targetIds: [...this.targetIds],
			remainingCount: this.entries.length
		};
		return WASHER_ACTIVE_DURATION * 1e3;
	}
	update(deltaSeconds) {
		if (!this.cableRoot || !this.diagnosticsValue.active) return;
		this.timelineElapsed = Math.min(WASHER_ACTIVE_DURATION, this.timelineElapsed + MathUtils.clamp(deltaSeconds, 0, MAX_TIMELINE_STEP));
		const elapsed = this.timelineElapsed;
		const phase = phaseAt(elapsed);
		const spin = this.spinAt(elapsed);
		const centrifugal = this.centrifugalAt(elapsed);
		const rebound = this.reboundAt(elapsed);
		const rotation = this.rotationScratch.setFromAxisAngle(this.spinAxis, spin.angle + rebound);
		this.cableRoot.quaternion.copy(this.baseRootQuaternion).premultiply(rotation);
		this.cableRoot.scale.copy(this.baseRootScale);
		if (elapsed >= FIRST_LAUNCH_AT) this.launchAt(0, elapsed);
		if (elapsed >= SECOND_LAUNCH_AT && this.firstLaunchElapsed >= 0 && elapsed - this.firstLaunchElapsed >= .8399999999999999) this.launchAt(1, elapsed);
		let totalEntryOffset = 0;
		let maxEntryOffset = 0;
		let minimumPlanarRadius = Number.POSITIVE_INFINITY;
		let totalPlanarRadius = 0;
		let visibleEntryCount = 0;
		const ringAmount = this.ringAmountAt(elapsed);
		this.entries.forEach((entry) => {
			if (entry.launched) return;
			const waveMotion = ringAmount;
			const wave = .98 + Math.sin(spin.angle * .42 + entry.phaseOffset) * .08 * waveMotion;
			const radialOffset = ringAmount * entry.ringExpansion * wave;
			const tangentialOffset = ringAmount * MAX_TANGENTIAL_DRIFT * Math.sin(spin.angle * .77 + entry.phaseOffset * 1.31);
			const axialOffset = ringAmount * MAX_AXIAL_DRIFT * Math.sin(spin.angle * .53 + entry.phaseOffset * .73);
			entry.model.root.position.copy(entry.basePosition).sub(this.centerOffset).addScaledVector(entry.radial, radialOffset).addScaledVector(entry.tangent, tangentialOffset).addScaledVector(this.spinAxis, axialOffset);
			entry.model.root.quaternion.copy(entry.baseQuaternion);
			entry.model.root.rotateY(Math.sin(spin.angle * .47 + entry.phaseOffset) * ringAmount * .28);
			entry.model.root.rotateZ(Math.sin(spin.angle * .73 + entry.phaseOffset * .6) * ringAmount * .2);
			const entryOffset = Math.sqrt(radialOffset * radialOffset + tangentialOffset * tangentialOffset + axialOffset * axialOffset);
			totalEntryOffset += entryOffset;
			maxEntryOffset = Math.max(maxEntryOffset, entryOffset);
			const planarRadius = Math.sqrt((entry.basePlanarRadius + radialOffset) ** 2 + tangentialOffset * tangentialOffset);
			minimumPlanarRadius = Math.min(minimumPlanarRadius, planarRadius);
			totalPlanarRadius += planarRadius;
			visibleEntryCount += 1;
		});
		this.diagnosticsValue = {
			...this.diagnosticsValue,
			elapsed,
			phase,
			spinAngle: spin.angle,
			angularVelocity: spin.velocity,
			centrifugalAmount: centrifugal,
			averageEntryOffset: visibleEntryCount > 0 ? totalEntryOffset / visibleEntryCount : 0,
			maxEntryOffset,
			minimumPlanarRadius: visibleEntryCount > 0 ? minimumPlanarRadius : 0,
			averagePlanarRadius: visibleEntryCount > 0 ? totalPlanarRadius / visibleEntryCount : 0
		};
		if (elapsed >= WASHER_ACTIVE_DURATION && this.launchOrder.length >= this.targetIds.length) {
			this.cableRoot.scale.copy(this.baseRootScale);
			this.entries.forEach((entry) => {
				if (entry.launched) return;
				entry.model.root.position.copy(entry.basePosition).sub(this.centerOffset);
				entry.model.root.quaternion.copy(entry.baseQuaternion);
				entry.model.commitBundleBaseRootPose();
			});
			this.diagnosticsValue = {
				...this.diagnosticsValue,
				active: false,
				phase: "complete",
				remainingCount: this.entries.length - this.launchOrder.length
			};
		}
	}
	reset() {
		if (this.cableRoot) {
			this.cableRoot.position.copy(this.baseRootPosition);
			this.cableRoot.quaternion.copy(this.baseRootQuaternion);
			this.cableRoot.scale.copy(this.baseRootScale);
		}
		this.entries.forEach((entry) => {
			entry.model.root.position.copy(entry.basePosition);
			entry.model.root.quaternion.copy(entry.baseQuaternion);
		});
		this.cableRoot = null;
		this.entries = [];
		this.targetIds = [];
		this.launchOrder = [];
		this.launchElapsedSeconds = [];
		this.onLaunch = null;
		this.firstLaunchElapsed = -1;
		this.timelineElapsed = 0;
		this.centerOffset.set(0, 0, 0);
		this.spinAxis.set(0, 0, 1);
		this.cameraForwardWorld.set(0, 0, -1);
		this.screenRightWorld.set(1, 0, 0);
		this.diagnosticsValue = emptyDiagnostics();
	}
	dispose() {
		this.reset();
	}
	launchAt(index, elapsed) {
		const id = this.targetIds[index];
		if (!id || this.launchOrder.includes(id) || elapsed < (index === 0 ? FIRST_LAUNCH_AT : SECOND_LAUNCH_AT)) return;
		const entry = this.entries.find((candidate) => candidate.id === id);
		if (!entry || entry.launched) return;
		this.cableRoot?.updateWorldMatrix(true, true);
		const side = index === 0 ? -1 : 1;
		const directionWorld = this.screenRightWorld.clone().multiplyScalar(side).addScaledVector(this.cameraForwardWorld, -.16).normalize();
		const bundleCenterWorld = this.cableRoot?.getWorldPosition(new Vector3()) ?? new Vector3();
		if (this.onLaunch?.(id, {
			directionWorld,
			bundleCenterWorld
		}) ?? false) {
			entry.launched = true;
			this.launchOrder.push(id);
			this.launchElapsedSeconds.push(elapsed);
			if (index === 0) this.firstLaunchElapsed = elapsed;
			this.diagnosticsValue = {
				...this.diagnosticsValue,
				launchOrder: [...this.launchOrder],
				launchElapsedSeconds: [...this.launchElapsedSeconds],
				remainingCount: this.entries.length - this.launchOrder.length
			};
		}
	}
	ringAmountAt(elapsed) {
		if (elapsed <= 0) return 0;
		if (elapsed < RING_EXPANSION_END) return smooth(elapsed / RING_EXPANSION_END);
		if (elapsed <= RING_COLLAPSE_START) return 1;
		if (elapsed >= REBOUND_END) return 0;
		return 1 - smooth((elapsed - RING_COLLAPSE_START) / 2.8699999999999997);
	}
	centrifugalAt(elapsed) {
		if (elapsed < .72) return MathUtils.lerp(0, .62, smooth(elapsed / .72));
		if (elapsed < CRUISE_END) return .62 + .38 * smooth((elapsed - .72) / 2.7300000000000004);
		if (elapsed < SLOWDOWN_END) return MathUtils.lerp(1, .12, smooth((elapsed - CRUISE_END) / 2.45));
		if (elapsed < REBOUND_END) return MathUtils.lerp(.12, 0, smooth((elapsed - SLOWDOWN_END) / .4499999999999993));
		return 0;
	}
	reboundAt(elapsed) {
		if (elapsed < SLOWDOWN_END || elapsed >= REBOUND_END) return 0;
		const eased = smooth((elapsed - SLOWDOWN_END) / .4499999999999993);
		return Math.sin(eased * Math.PI * 2) * (1 - eased) * .08;
	}
	spinAt(elapsed) {
		const spinUpDistance = MAX_ANGULAR_SPEED * SPIN_UP_END * .5;
		if (elapsed < SPIN_UP_END) {
			const progress = elapsed / SPIN_UP_END;
			return {
				angle: spinUpDistance * progress * progress,
				velocity: MAX_ANGULAR_SPEED * progress
			};
		}
		if (elapsed < CRUISE_END) return {
			angle: spinUpDistance + MAX_ANGULAR_SPEED * (elapsed - SPIN_UP_END),
			velocity: MAX_ANGULAR_SPEED
		};
		if (elapsed < SLOWDOWN_END) {
			const progress = (elapsed - CRUISE_END) / 2.45;
			return {
				angle: 44.175 + MAX_ANGULAR_SPEED * 2.45 * (progress - progress * progress * .5),
				velocity: MAX_ANGULAR_SPEED * (1 - progress)
			};
		}
		return {
			angle: 63.162499999999994,
			velocity: 0
		};
	}
	onLaunch = null;
};
//#endregion
//#region src/skill/BubbleShieldPresentation.ts
var ENTER_SPEED = 5.8;
var EXIT_SPEED = 4.2;
var BOUNDS_PADDING = 1.14;
var MINIMUM_RADIUS = 1.25;
var WOBBLE_STIFFNESS = 26;
var MAX_WOBBLE = .32;
function createThicknessTexture() {
	const width = 64;
	const height = 32;
	const data = /* @__PURE__ */ new Uint8Array(8192);
	for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
		const u = x / width;
		const v = y / height;
		const broad = Math.sin(u * Math.PI * 2 + Math.sin(v * Math.PI * 2) * 1.35);
		const diagonal = Math.sin((u * 1.15 + v * .82) * Math.PI * 2 + .8);
		const vertical = Math.cos(v * Math.PI * 3 - u * 1.25);
		const value = MathUtils.clamp(.5 + broad * .25 + diagonal * .19 + vertical * .13, 0, 1);
		const index = (y * width + x) * 4;
		data[index] = 255;
		data[index + 1] = Math.round(value * 255);
		data[index + 2] = 255;
		data[index + 3] = 255;
	}
	const texture = new DataTexture(data, width, height, RGBAFormat);
	texture.name = "bubble-shield-thickness-map";
	texture.wrapS = RepeatWrapping;
	texture.wrapT = RepeatWrapping;
	texture.minFilter = LinearFilter;
	texture.magFilter = LinearFilter;
	texture.generateMipmaps = false;
	texture.needsUpdate = true;
	return texture;
}
function createMaterial(uniforms, thicknessTexture) {
	const material = new MeshPhysicalMaterial({
		name: "bubble-shield-iridescent-thin-film-material",
		color: 16777215,
		emissive: 0,
		emissiveIntensity: 0,
		roughness: .08,
		metalness: 0,
		clearcoat: .32,
		clearcoatRoughness: .1,
		transmission: 0,
		ior: 1.3,
		iridescence: 1,
		iridescenceIOR: 1.3,
		iridescenceThicknessRange: [80, 620],
		iridescenceThicknessMap: thicknessTexture,
		transparent: true,
		opacity: 1,
		depthTest: true,
		depthWrite: false,
		side: 0
	});
	material.onBeforeCompile = (shader) => {
		shader.uniforms.uBubbleTime = uniforms.time;
		shader.uniforms.uBubbleVisibility = uniforms.visibility;
		shader.uniforms.uBubbleExitPulse = uniforms.exitPulse;
		shader.uniforms.uBubbleActivationPulse = uniforms.activationPulse;
		shader.uniforms.uBubbleInertia = uniforms.inertia;
		shader.vertexShader = shader.vertexShader.replace("#include <common>", `#include <common>
        uniform float uBubbleTime;
        uniform vec2 uBubbleInertia;
        varying vec3 vBubbleWorldPosition;
        varying vec3 vBubbleWorldNormal;
        varying vec3 vBubbleRadialWorldNormal;
        varying vec3 vBubbleObjectPosition;`).replace("#include <beginnormal_vertex>", `#include <beginnormal_vertex>
        vBubbleWorldNormal = normalize(mat3(modelMatrix) * objectNormal);`).replace("#include <begin_vertex>", `#include <begin_vertex>
        vec3 bubbleDirection = normalize(position);
        float bubbleInertiaStrength = length(uBubbleInertia);
        vec2 bubbleInertiaDirection = uBubbleInertia / max(bubbleInertiaStrength, 0.0001);
        float bubbleLobe = dot(bubbleDirection.xy, vec2(bubbleInertiaDirection.x, -bubbleInertiaDirection.y));
        float bubbleBreathing =
          sin(bubbleDirection.y * 3.15 + bubbleDirection.x * 1.7 + uBubbleTime * 0.72) * 0.024
          + sin((bubbleDirection.x - bubbleDirection.z) * 3.8 - uBubbleTime * 0.43) * 0.016;
        float bubbleInertialBulge = bubbleLobe * bubbleInertiaStrength * 0.52;
        float bubblePinch = sin((bubbleDirection.y + bubbleDirection.z) * 4.1 + uBubbleTime * 0.36)
          * bubbleInertiaStrength * 0.07;
        transformed = position * (1.0 + bubbleBreathing + bubbleInertialBulge + bubblePinch);
        float bubbleTwist = (uBubbleInertia.x * bubbleDirection.y - uBubbleInertia.y * bubbleDirection.x) * 0.9;
        float bubbleTwistCos = cos(bubbleTwist);
        float bubbleTwistSin = sin(bubbleTwist);
        transformed.xz = mat2(bubbleTwistCos, -bubbleTwistSin, bubbleTwistSin, bubbleTwistCos) * transformed.xz;
        transformed.x += uBubbleInertia.x * (0.22 + 0.11 * bubbleDirection.y);
        transformed.y -= uBubbleInertia.y * (0.18 + 0.09 * bubbleDirection.x);
        transformed.y -= (1.0 - bubbleDirection.y * bubbleDirection.y) * 0.012;
        vBubbleObjectPosition = transformed;
        vBubbleRadialWorldNormal = normalize(mat3(modelMatrix) * normalize(transformed));`).replace("#include <worldpos_vertex>", `#include <worldpos_vertex>
        vBubbleWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;`);
		shader.fragmentShader = shader.fragmentShader.replace("#include <common>", `#include <common>
        uniform float uBubbleTime;
        uniform float uBubbleVisibility;
        uniform float uBubbleExitPulse;
        uniform float uBubbleActivationPulse;
        uniform vec2 uBubbleInertia;
        varying vec3 vBubbleWorldPosition;
        varying vec3 vBubbleWorldNormal;
        varying vec3 vBubbleRadialWorldNormal;
        varying vec3 vBubbleObjectPosition;

        vec3 sakuraBubblePalette(float phase) {
          vec3 blush = vec3(1.0, 0.44, 0.68);
          vec3 aqua = vec3(0.12, 0.9, 0.93);
          vec3 gold = vec3(1.0, 0.68, 0.2);
          vec3 lavender = vec3(0.6, 0.52, 0.88);
          float wrapped = fract(phase);
          if (wrapped < 0.25) return mix(blush, aqua, wrapped * 4.0);
          if (wrapped < 0.5) return mix(aqua, gold, (wrapped - 0.25) * 4.0);
          if (wrapped < 0.75) return mix(gold, lavender, (wrapped - 0.5) * 4.0);
          return mix(lavender, blush, (wrapped - 0.75) * 4.0);
        }`).replace("#include <color_fragment>", `#include <color_fragment>
        vec3 bubbleViewDirection = normalize(cameraPosition - vBubbleWorldPosition);
        vec3 bubbleSmoothNormal = normalize(mix(
          normalize(vBubbleWorldNormal),
          normalize(vBubbleRadialWorldNormal),
          0.65
        ));
        float bubbleFacing = clamp(abs(dot(bubbleSmoothNormal, bubbleViewDirection)), 0.0, 1.0);
        float bubbleFresnel = pow(1.0 - bubbleFacing, 2.05);
        vec3 bubbleSurface = normalize(vBubbleObjectPosition);
        float bubbleFieldA = sin(bubbleSurface.x * 2.8 + bubbleSurface.y * 1.65 - bubbleSurface.z * 2.15 + uBubbleTime * 0.17);
        float bubbleFieldB = sin((bubbleSurface.x - bubbleSurface.y) * 3.35 + bubbleSurface.z * 1.3 - uBubbleTime * 0.12 + 1.4);
        float bubbleFieldC = cos(bubbleSurface.y * 4.1 + bubbleSurface.z * 2.2 + uBubbleTime * 0.09 - 0.65);
        float bubbleThicknessField = bubbleFieldA * 0.48 + bubbleFieldB * 0.32 + bubbleFieldC * 0.2;
        float bubbleFilmWave = 0.5 + 0.5 * sin(
          bubbleThicknessField * 3.6
          + bubbleFacing * 5.4
          + dot(bubbleSurface.xy, uBubbleInertia) * 7.0
          + uBubbleTime * 0.055
        );
        float bubbleFilmRibbon = smoothstep(0.62, 0.9, bubbleFilmWave);
        vec2 bubblePoolAOffset = bubbleSurface.xy - vec2(-0.42, -0.34);
        vec2 bubblePoolBOffset = bubbleSurface.xy - vec2(0.38, 0.26);
        float bubbleFilmPoolA = exp(-dot(bubblePoolAOffset, bubblePoolAOffset) * 14.0);
        float bubbleFilmPoolB = exp(-dot(bubblePoolBOffset, bubblePoolBOffset) * 16.0)
          * (0.68 + sin(uBubbleTime * 0.16 + bubbleSurface.z * 2.0) * 0.18);
        float bubbleFilmInterior = max(
          bubbleFilmRibbon,
          max(bubbleFilmPoolA * 0.8, bubbleFilmPoolB * 0.65)
        ) * smoothstep(0.08, 0.92, bubbleFacing);
        float bubbleHueWarp =
          sin((bubbleSurface.x + bubbleSurface.z) * 4.4 - uBubbleTime * 0.11) * 0.2
          + cos((bubbleSurface.y - bubbleSurface.x) * 3.7 + uBubbleTime * 0.08) * 0.17;
        float bubbleHuePhase =
          bubbleFresnel * 0.34
          + bubbleThicknessField * 0.78
          + bubbleSurface.x * 0.42
          - bubbleSurface.y * 0.29
          + bubbleHueWarp
          + bubbleFilmRibbon * 0.03
          + dot(bubbleSurface.xy, uBubbleInertia) * 0.12
          + uBubbleTime * 0.012;
        vec3 bubbleIridescence = sakuraBubblePalette(bubbleHuePhase);
        float bubbleEdge = smoothstep(0.04, 0.96, bubbleFresnel);
        float bubbleFilmAlpha = pow(bubbleFilmInterior, 1.55) * 0.4;
        // Keep a faint body across the sphere and a decisive coloured rim.
        // The old near-zero body alpha disappeared against the ivory day sky
        // even though diagnostics correctly reported the shield as visible.
        float bubbleAlpha = 0.024 + pow(bubbleEdge, 0.72) * 0.43 + bubbleFilmAlpha;
        bubbleAlpha *= mix(0.9, 1.1, sin(vBubbleObjectPosition.y * 4.2 + uBubbleTime * 0.14) * 0.5 + 0.5);
        bubbleAlpha += uBubbleExitPulse * (1.0 - abs(bubbleFresnel - 0.58) * 1.7) * 0.055;
        bubbleAlpha += uBubbleActivationPulse * (0.08 + pow(bubbleEdge, 0.55) * 0.28);
        float bubbleColorStrength = clamp(0.2 + bubbleEdge * 0.62 + bubbleFilmInterior * 1.22, 0.0, 1.0);
        diffuseColor.rgb = mix(diffuseColor.rgb, bubbleIridescence, bubbleColorStrength);
        diffuseColor.a *= clamp(bubbleAlpha * uBubbleVisibility, 0.0, 0.62);`).replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
        totalEmissiveRadiance += bubbleIridescence
          * (pow(bubbleEdge, 0.72) * 0.78 + bubbleFilmInterior * 0.56)
          * uBubbleVisibility
          + bubbleIridescence * uBubbleActivationPulse * uBubbleVisibility * 0.46;`);
	};
	material.customProgramCacheKey = () => "sakura-bubble-shield-v3-retrigger";
	return material;
}
var BubbleShieldPresentation = class {
	root = new Group();
	geometry = new SphereGeometry(1, 48, 32);
	thicknessTexture = createThicknessTexture();
	uniforms = {
		time: { value: 0 },
		visibility: { value: 0 },
		exitPulse: { value: 0 },
		activationPulse: { value: 0 },
		inertia: { value: new Vector2() }
	};
	material = createMaterial(this.uniforms, this.thicknessTexture);
	mesh = new Mesh(this.geometry, this.material);
	bounds = new Box3();
	sphere = new Sphere();
	targetActive = false;
	visibility = 0;
	exitPulse = 0;
	activationPulse = 0;
	activationHold = 0;
	activationCount = 0;
	targetCount = 0;
	radius = 0;
	wobble = new Vector2();
	wobbleVelocity = new Vector2();
	wobbleTarget = new Vector2();
	previousOrbitYaw = null;
	previousOrbitPitch = null;
	constructor() {
		this.root.name = "bubble-shield-presentation";
		this.mesh.name = "bubble-shield-thin-film";
		this.mesh.renderOrder = 18;
		this.mesh.visible = true;
		this.mesh.frustumCulled = false;
		this.mesh.userData.performanceEffect = true;
		this.root.add(this.mesh);
	}
	sync(active, targets) {
		this.targetActive = active && targets.length > 0;
		this.targetCount = this.targetActive || this.activationHold > 0 ? targets.length : 0;
		if (!this.targetActive) {
			if (this.activationHold <= 0 && this.visibility > .02) this.exitPulse = 1;
			return;
		}
		this.root.visible = true;
		this.updateBounds(targets);
	}
	updateBounds(targets) {
		this.bounds.makeEmpty();
		targets.forEach((target) => {
			target.updateWorldMatrix(true, true);
			this.bounds.expandByObject(target, false);
		});
		if (this.bounds.isEmpty()) {
			this.targetCount = 0;
			return;
		}
		this.bounds.getBoundingSphere(this.sphere);
		this.radius = Math.max(MINIMUM_RADIUS, this.sphere.radius * BOUNDS_PADDING);
		this.root.position.copy(this.sphere.center);
		this.root.scale.setScalar(this.radius);
		this.mesh.visible = true;
	}
	retrigger(targets = []) {
		if (targets.length > 0) {
			this.targetCount = targets.length;
			this.updateBounds(targets);
		}
		this.activationCount += 1;
		this.activationPulse = 1;
		this.activationHold = 1.05;
		this.visibility = Math.min(this.visibility, .24);
		this.uniforms.visibility.value = this.visibility;
		this.uniforms.activationPulse.value = this.activationPulse;
		this.root.visible = true;
		this.mesh.visible = true;
		this.mesh.scale.setScalar(.82);
	}
	update(delta, elapsed, orbit) {
		this.updateWobble(delta, orbit);
		this.activationHold = Math.max(0, this.activationHold - Math.max(0, delta));
		const visuallyActive = this.targetActive || this.activationHold > 0;
		const speed = visuallyActive ? ENTER_SPEED : EXIT_SPEED;
		const blend = 1 - Math.exp(-Math.max(0, delta) * speed);
		this.visibility = MathUtils.lerp(this.visibility, visuallyActive ? 1 : 0, blend);
		this.exitPulse = Math.max(0, this.exitPulse - Math.max(0, delta) * 1.8);
		this.activationPulse = Math.max(0, this.activationPulse - Math.max(0, delta) * 2.35);
		this.uniforms.time.value = elapsed;
		this.uniforms.visibility.value = this.visibility;
		this.uniforms.exitPulse.value = this.exitPulse;
		this.uniforms.activationPulse.value = this.activationPulse;
		this.uniforms.inertia.value.copy(this.wobble);
		this.thicknessTexture.offset.set(elapsed * .0038, -elapsed * .0024);
		const reveal = MathUtils.smoothstep(this.visibility, 0, 1);
		this.mesh.scale.setScalar(MathUtils.lerp(.86, 1, reveal));
		this.mesh.rotation.y = Math.sin(elapsed * .08) * .025 + this.wobble.x * .18;
		this.mesh.rotation.z = Math.sin(elapsed * .065 + 1.2) * .018 - this.wobble.y * .16;
		if (!visuallyActive && this.visibility < .002) {
			this.visibility = 0;
			this.targetCount = 0;
			this.mesh.visible = false;
			this.root.visible = false;
		}
	}
	updateWobble(delta, orbit) {
		const step = Math.min(Math.max(delta, 0), .05);
		this.wobbleTarget.set(0, 0);
		if (orbit) {
			if (this.previousOrbitYaw !== null && this.previousOrbitPitch !== null && step > 0) {
				const yawDelta = Math.atan2(Math.sin(orbit.yaw - this.previousOrbitYaw), Math.cos(orbit.yaw - this.previousOrbitYaw));
				const pitchDelta = orbit.pitch - this.previousOrbitPitch;
				if (this.targetActive) this.wobbleTarget.set(MathUtils.clamp(yawDelta / step * .1, -.32, MAX_WOBBLE), MathUtils.clamp(pitchDelta / step * .11, -.32 * .82, MAX_WOBBLE * .82));
			}
			this.previousOrbitYaw = orbit.yaw;
			this.previousOrbitPitch = orbit.pitch;
		}
		if (step <= 0) return;
		this.wobbleVelocity.x += (this.wobbleTarget.x - this.wobble.x) * WOBBLE_STIFFNESS * step;
		this.wobbleVelocity.y += (this.wobbleTarget.y - this.wobble.y) * WOBBLE_STIFFNESS * step;
		const damping = Math.exp(-4.2 * step);
		this.wobbleVelocity.multiplyScalar(damping);
		this.wobble.addScaledVector(this.wobbleVelocity, step);
		if (this.wobble.length() > MAX_WOBBLE) this.wobble.setLength(MAX_WOBBLE);
	}
	reset() {
		this.targetActive = false;
		this.visibility = 0;
		this.exitPulse = 0;
		this.activationPulse = 0;
		this.activationHold = 0;
		this.activationCount = 0;
		this.targetCount = 0;
		this.radius = 0;
		this.wobble.set(0, 0);
		this.wobbleVelocity.set(0, 0);
		this.wobbleTarget.set(0, 0);
		this.previousOrbitYaw = null;
		this.previousOrbitPitch = null;
		this.uniforms.visibility.value = 0;
		this.uniforms.exitPulse.value = 0;
		this.uniforms.activationPulse.value = 0;
		this.uniforms.inertia.value.set(0, 0);
		this.mesh.visible = false;
	}
	dispose() {
		this.root.removeFromParent();
		this.geometry.dispose();
		this.material.dispose();
		this.thicknessTexture.dispose();
	}
	get diagnostics() {
		return {
			active: this.targetActive,
			visible: this.mesh.visible,
			opacity: this.visibility,
			activationCount: this.activationCount,
			activationPulse: this.activationPulse,
			center: this.root.position.toArray(),
			radius: this.radius,
			targetCount: this.targetCount,
			depthWrite: this.material.depthWrite,
			side: "front",
			wobble: this.wobble.toArray(),
			wobbleAmplitude: this.wobble.length(),
			surfaceIridescence: "distributed",
			deformationMode: "inertial-soft-body",
			surfaceNormalMode: "smooth-radial",
			colorDistributionMode: "balanced-spectrum"
		};
	}
};
//#endregion
//#region src/skill/SkillConnectionVisualPolicy.ts
var SCREEN_EFFECTS = {
	humidifier: "bathroom-steam",
	television: "television-glitch",
	toaster: "toaster-heat",
	kettle: "kettle-thaw-heat",
	"coffee-maker": "coffee-lock",
	printer: "printer-scan",
	microwave: "microwave-heat",
	"desktop-computer": "blue-screen"
};
var SHIELDS = {
	"bubble-machine": "bubble",
	"record-player": "sound-wave",
	dehumidifier: "dry-air"
};
/**
* Visual routing is based on the appliance that was physically connected,
* never on whether the rules engine accepted or suppressed its skill.
*/
function skillConnectionVisualPolicy(appliance) {
	return {
		appliancePerformance: true,
		screenEffect: SCREEN_EFFECTS[appliance] ?? null,
		shield: SHIELDS[appliance] ?? null
	};
}
//#endregion
//#region src/skill/skillPresentationTiming.ts
var PRINTER_EVIDENCE_LOCK_DURATION_MS = 1400;
/** Keep production input locked until the printer's final page exits. */
function printerSkillLockDurationMs(fixedPerformanceTime) {
	return Number.isFinite(fixedPerformanceTime) ? PRINTER_EVIDENCE_LOCK_DURATION_MS : PRINTER_POWERED_ACTIVE_DURATION * 1e3;
}
/** Do not let a following appliance cancel a skill effect that is still visible. */
function skillPresentationStillActive(activity) {
	if (!(activity.controllerActiveTimelines > 0 || activity.transientEffectCount > 0)) return false;
	if (Number.isFinite(activity.elapsedMs) && Number.isFinite(activity.maxVisualWaitMs) && (activity.elapsedMs ?? 0) >= (activity.maxVisualWaitMs ?? 0)) return false;
	return true;
}
//#endregion
//#region src/game/Game.ts
var PERFORMANCE_WARMUP_LAYER = 31;
var DIAGNOSTICS_PUBLISH_INTERVAL_FRAMES = 6;
function diagnosticsEnabled() {
	return new URLSearchParams(window.location.search).get("diagnostics") === "1";
}
var easeOutCubic = (value) => 1 - (1 - value) ** 3;
var MAX_HINT_USES = 3;
var SKILL_RECYCLE_SELECTION_COMMIT_DELAY_MS = 850;
var SKILL_BUFF_SWAP_VISUAL_DURATION_MS = 720;
var Game = class {
	canvas;
	renderer;
	disposeJellyEnvironment = null;
	scene = new Scene();
	camera = new PerspectiveCamera(26, 1, .1, 140);
	applianceGeometryWarmupScene = new Scene();
	applianceGeometryWarmupCamera = new PerspectiveCamera(26, 1, .1, 100);
	applianceGeometryWarmupTarget = new WebGLRenderTarget(1, 1, {
		depthBuffer: false,
		stencilBuffer: false
	});
	applianceGeometryWarmupMaterial = new MeshBasicMaterial();
	pipeline;
	sky;
	hud = new Hud();
	applianceGallery = null;
	raycaster = new Raycaster();
	pointer = new Vector2();
	arrowRoot = new Group();
	appliances = new ApplianceScene();
	connections = new ConnectionSystem();
	petals = new PetalField(28);
	openingScene = new OpeningScene();
	performances = new AppliancePerformanceSystem();
	sensory = new ApplianceSensoryController();
	theme = new ThemeController();
	season = new SeasonController();
	audio = new AudioManager();
	sun = new DirectionalLight(PAL.sun, 2.25);
	fill = new DirectionalLight(PAL.fill, 1.08);
	bounce = new DirectionalLight(14207976, .34);
	hemi = new HemisphereLight(PAL.hemiSky, PAL.hemiGround, 1.12);
	globalToolbar;
	nightEnvironment;
	adaptiveQuality;
	landedTargets = /* @__PURE__ */ new WeakSet();
	startScreen = new StartScreen({
		onStart: () => this.beginOpeningTransition(),
		onRandom: () => this.startRandomFromOpening(),
		onExplore: () => this.startExploreFromOpening(),
		onRush: () => this.startRushFromOpening(),
		onDoubleEnded: () => this.startDoubleEndedFromOpening(),
		onSkill: () => this.startSkillFromOpening(),
		onProgress: (progress) => this.openingScene.setProgress(progress)
	});
	rushUi = new RushModeUi({
		onStart: () => this.startRushRound(),
		onNext: () => this.continueRushChallenge(),
		onRetry: () => this.retryRushPuzzle(),
		onHome: () => this.returnToOpening()
	});
	doubleEndedUi = new DoubleEndedModeUi({
		onStart: () => this.startDoubleEndedChallenge(),
		onHome: () => this.returnToOpening()
	});
	skillUi = new SkillChallengeUi({ onCardSelected: (index) => this.handleSkillCardSelected(index) });
	skillEffects = new SkillEffectModelKit();
	bubbleShield = new BubbleShieldPresentation();
	soundWaveShield = new SoundWaveShieldPresentation();
	dehumidifierDryShield = new DehumidifierDryShieldPresentation();
	portableSpeakerSpacing = new PortableSpeakerSpacingPresentation();
	televisionReconstruction = new TelevisionReconstructionTransition();
	toasterHeatSwap = new ToasterHeatSwapTransition();
	refrigeratorFreeze = new RefrigeratorFreezePresentation();
	kettleThaw = new KettleThawPresentation();
	refrigeratorScreenIce;
	washerSpin = new WasherSpinPresentation();
	skillPresentation;
	puzzleWorker;
	prefetchWorker = null;
	orbit;
	loop = new Loop((delta, elapsed) => this.update(delta, elapsed), () => this.render());
	diagnosticsEnabled = diagnosticsEnabled();
	puzzle = null;
	arrows = [];
	models = /* @__PURE__ */ new Map();
	animations = [];
	pendingApplianceConnections = [];
	hoveredId = null;
	hoveredEnd = null;
	frame = 0;
	removedCount = 0;
	availableCount = 0;
	applianceRoutingRevision = -1;
	clickTarget = null;
	availableClickTargets = [];
	availableChoices = [];
	blockedClickTarget = null;
	activeHint = null;
	blockedRevealTimer = 0;
	hintUsesRemaining = MAX_HINT_USES;
	puzzleRequestId = 0;
	puzzleApplyToken = 0;
	prefetchRequestId = 0;
	prefetchedLevel = null;
	prefetchingLevelId = null;
	waitingForPrefetchLevelId = null;
	skillRemovalSequenceCache = null;
	puzzleRevision = 0;
	currentLevel = null;
	currentMode = "random";
	explorationMode = false;
	explorationReturnTheme = null;
	currentRushChallenge = null;
	rushSelectionHint = null;
	rushRound = null;
	rushFlow = null;
	randomLives = 3;
	randomGameOver = false;
	skillEngine = null;
	skillInputLocked = false;
	skillCommitTimer = 0;
	skillSettleCueTimer = 0;
	skillSettleTimer = 0;
	skillEvidenceCleanupTimer = 0;
	skillRecycleSelectionTimer = 0;
	skillBuffSwapTimer = 0;
	skillBuffVisualReleaseAt = 0;
	lastSkillBuffId = null;
	skillEvidenceVisible = false;
	coffeeLockExitTarget = null;
	coffeeStainElapsed = 0;
	coffeeStainStrength = 0;
	coffeeStainDuration = 4.8;
	coffeeStainProfiles = /* @__PURE__ */ new Map();
	skillTransientHighlights = /* @__PURE__ */ new Set();
	skillColorShufflePreview = /* @__PURE__ */ new Map();
	portableSpeakerSpacingTargetsCache = [];
	skillTransientScreenEffect = "none";
	microwaveHeatStartedAt = 0;
	desktopComputerFeedback = null;
	pendingDryShieldAbsorb = false;
	skillAutoRemovalEnds = /* @__PURE__ */ new Map();
	pendingWasherFlingRemovals = [];
	washerFlingHistory = [];
	washerFlightEuler = new Euler();
	washerFlightQuaternion = new Quaternion();
	washerFlightWorldPosition = new Vector3();
	washerFlightProjectedPosition = new Vector3();
	radioRouteCableIds = [];
	openingActive = true;
	openingTransitioning = false;
	initialPuzzlePreparing = false;
	initialSceneReady = false;
	openingStartPending = false;
	openingCameraPhase = "idle";
	openingCameraElapsed = 0;
	lastOpeningFrameElapsed = 0;
	openingCameraFinal = new Vector3();
	openingCameraClose = new Vector3();
	openingCameraFinalTarget = new Vector3(0, .05, 0);
	lanternScreenPosition = new Vector2();
	openingLanternFocus = new Vector3();
	openingHoldDuration = .65;
	openingFadeOutDuration = 1;
	openingBackgroundHoldDuration = .5;
	openingRevealDuration = 1.25;
	openingCameraPullDuration = 2.6;
	sceneTransitionCurtain;
	startupTimer = 0;
	bootTime = performance.now();
	generationMs = 0;
	modelBuildMs = 0;
	preloadMaxSliceMs = 0;
	performanceEffectsWarmed = false;
	contextLossAtMs = null;
	contextLosses = 0;
	contextRestores = 0;
	contextUnavailable = false;
	onResize = () => this.resize();
	onUiButtonClick = (event) => {
		if (event.target instanceof Element && event.target.closest("button")) this.audio.playInteraction("button");
	};
	onOpenApplianceGallery = () => {
		if (!this.applianceGallery) this.applianceGallery = new ApplianceGallery(this.theme, this.audio);
		this.applianceGallery.show();
	};
	onContextLost = (event) => {
		event.preventDefault();
		this.contextUnavailable = true;
		this.contextLosses += 1;
		this.contextLossAtMs = performance.now() - this.bootTime;
		this.hud.flash(getLocale() === "zh" ? "渲染器正在恢复" : "Restoring the renderer");
	};
	onContextRestored = () => {
		this.contextRestores += 1;
		requestAnimationFrame(() => {
			this.renderer.resetState();
			this.renderer.outputColorSpace = SRGBColorSpace;
			this.renderer.toneMapping = 0;
			this.renderer.info.autoReset = false;
			this.renderer.shadowMap.enabled = true;
			this.renderer.shadowMap.type = 1;
			this.renderer.setClearColor(PAL.fog, 1);
			this.pipeline = new SakuraPipeline(this.renderer, this.scene, this.camera);
			this.pipeline.setThemeProgress(this.theme.progress);
			this.pipeline.setExplorationProgress(this.explorationMode ? 1 : 0);
			this.pipeline.setQualityTier(this.adaptiveQuality.tier);
			this.syncSkillPresentation();
			this.resize();
			this.contextUnavailable = false;
		});
	};
	onPuzzleGenerated = (event) => {
		const result = event.data;
		if (result.requestId !== this.puzzleRequestId) return;
		if (!result.puzzle) {
			this.hud.showLoadError(result.error ?? "线路生成失败");
			return;
		}
		this.generationMs = result.generationMs ?? 0;
		const applyToken = this.puzzleApplyToken;
		if (this.openingActive && !this.initialSceneReady && this.puzzle === null && !this.initialPuzzlePreparing) {
			this.initialPuzzlePreparing = true;
			this.applyPuzzle(result.puzzle, true, false, applyToken).catch((error) => {
				this.initialPuzzlePreparing = false;
				this.startScreen.showError(error instanceof Error ? error.message : String(error));
				this.hud.showLoadError(error instanceof Error ? error.message : String(error));
			});
			return;
		}
		this.hud.completePuzzleLoad(() => this.applyPuzzle(result.puzzle, false, false, applyToken), () => {
			if (applyToken !== this.puzzleApplyToken) return;
			if (this.openingActive && this.openingStartPending) {
				this.openingStartPending = false;
				this.beginOpeningTransition();
			} else this.revealCommittedScene();
		});
	};
	onPuzzlePrefetched = (event) => {
		const result = event.data;
		if (result.requestId !== this.prefetchRequestId || this.prefetchingLevelId === null) return;
		const levelId = this.prefetchingLevelId;
		this.prefetchingLevelId = null;
		if (!result.puzzle) {
			if (this.waitingForPrefetchLevelId === levelId) {
				this.waitingForPrefetchLevelId = null;
				const level = getCampaignLevel(levelId);
				this.loadPuzzle(seedForCampaignLevel(level.id), level, "campaign");
			}
			return;
		}
		this.prefetchedLevel = {
			levelId,
			puzzle: result.puzzle,
			generationMs: result.generationMs ?? 0
		};
		if (this.waitingForPrefetchLevelId !== levelId) return;
		this.waitingForPrefetchLevelId = null;
		this.generationMs = this.prefetchedLevel.generationMs;
		const puzzle = this.prefetchedLevel.puzzle;
		const applyToken = ++this.puzzleApplyToken;
		this.hud.completePuzzleLoad(() => this.applyPuzzle(puzzle, false, false, applyToken), this.revealCommittedScene);
	};
	constructor(canvas) {
		this.canvas = canvas;
		const transitionCurtain = document.querySelector("#scene-transition-curtain");
		if (!transitionCurtain) throw new Error("Missing scene transition curtain");
		this.sceneTransitionCurtain = transitionCurtain;
		this.refrigeratorScreenIce = new RefrigeratorScreenIceOverlay(canvas);
		this.renderer = new WebGLRenderer({
			canvas,
			antialias: false,
			powerPreference: "high-performance",
			stencil: false
		});
		this.renderer.outputColorSpace = SRGBColorSpace;
		this.renderer.toneMapping = 0;
		this.renderer.info.autoReset = false;
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = 1;
		this.renderer.setClearColor(PAL.fog, 1);
		this.scene.fog = new Fog(PAL.fog, 30, 82);
		this.scene.add(this.arrowRoot);
		this.scene.add(this.appliances.root);
		this.scene.add(this.connections.root);
		this.scene.add(this.petals.mesh);
		this.scene.add(this.openingScene.root);
		this.scene.add(this.performances.root);
		this.scene.add(this.sensory.root);
		this.scene.add(this.skillEffects.root);
		this.scene.add(this.bubbleShield.root);
		this.scene.add(this.soundWaveShield.root);
		this.scene.add(this.dehumidifierDryShield.root);
		this.arrowRoot.add(this.televisionReconstruction.root);
		this.arrowRoot.add(this.toasterHeatSwap.root);
		this.arrowRoot.visible = false;
		this.appliances.root.visible = false;
		this.connections.root.visible = false;
		if (this.diagnosticsEnabled) window.__PROFILE_RENDER_BREAKDOWN__ = () => this.profileRenderBreakdown();
		this.appliances.setBurstHandler((origin, direction, count) => {
			this.petals.burst(origin, direction, count);
		});
		this.sky = buildSky(this.scene);
		this.createLighting();
		this.applianceGeometryWarmupCamera.position.set(0, 0, 13.6);
		this.applianceGeometryWarmupCamera.lookAt(0, 0, 0);
		this.applianceGeometryWarmupCamera.updateMatrixWorld(true);
		this.applianceGeometryWarmupScene.overrideMaterial = this.applianceGeometryWarmupMaterial;
		this.appliances.setReplacementWarmupHandler(async (root) => {
			this.performances.primeRoot(root);
			const restorePerformanceVisibility = this.revealPerformanceEffectsForWarmup(root);
			try {
				await this.renderer.compileAsync(root, this.camera, this.scene);
				this.uploadApplianceGeometry(root);
			} finally {
				restorePerformanceVisibility();
			}
		});
		this.pipeline = new SakuraPipeline(this.renderer, this.scene, this.camera);
		this.skillPresentation = new SkillPresentationController(this.scene, this.camera, {
			commitAutoRemoval: (cableId) => {
				const started = this.animateSkillAutoRemoval(cableId);
				queueMicrotask(() => this.publishDiagnostics());
				return started;
			},
			setCableVisualScale: (scale) => {
				for (const model of this.models.values()) model.setVisualThickness(scale);
			},
			getRiceCableVisualScale: () => [...this.models.values()][0]?.visualThicknessScale ?? 1,
			getCableBaseColor: (cableId) => this.models.get(cableId)?.skillVisualState.baseColor ?? null,
			setCableSkillSweep: (cableId, progress, strength, color) => {
				this.models.get(cableId)?.setSkillSweep(progress, strength, color);
			},
			setCableSkillTint: (cableId, color, strength, emissionScale) => {
				if (color === null) this.skillColorShufflePreview.delete(cableId);
				else this.skillColorShufflePreview.set(cableId, {
					color,
					strength,
					emissionScale
				});
				this.models.get(cableId)?.setSkillTint(color, strength, emissionScale);
			},
			setCableSkillRecolor: (cableId, color, progress) => {
				this.models.get(cableId)?.setSkillRecolor(color, progress);
			},
			commitCableColors: (changes) => {
				this.applySkillRecolors(changes);
				this.publishDiagnostics();
			}
		});
		this.nightEnvironment = new NightEnvironment(this.canvas, this.scene, this.camera, this.sky, {
			sun: this.sun,
			fill: this.fill,
			bounce: this.bounce,
			hemi: this.hemi
		});
		this.adaptiveQuality = new AdaptiveNightQuality((tier) => {
			this.pipeline.setQualityTier(tier);
			this.nightEnvironment.setQualityTier(tier);
		}, { degradeAfterSeconds: 1.25 });
		this.globalToolbar = new GlobalToolbar(this.theme, this.season, this.audio, this.hud.languageButton);
		const initialTheme = this.theme.snapshot;
		const initialEnvironment = this.season.resolveEnvironment(initialTheme.progress);
		const initialSeason = this.season.snapshot;
		this.pipeline.setThemeProgress(initialTheme.progress);
		this.nightEnvironment.setThemeProgress(initialTheme.progress);
		this.nightEnvironment.setSeasonEnvironment(initialEnvironment);
		this.sky.setSeasonWeights(initialSeason.weights);
		this.petals.setSeasonState(initialSeason.weights, initialTheme.progress);
		this.openingScene.setSeasonState(initialSeason.weights, initialTheme.progress);
		this.nightEnvironment.setReducedMotion(initialTheme.reducedMotion);
		this.startScreen.setStage("start.loading.sky", .12, .22);
		this.puzzleWorker = new Worker(new URL(
			/* @vite-ignore */
			"" + new URL("generator.worker-Bo7oKbVx.js", import.meta.url).href,
			"" + import.meta.url
		), { type: "module" });
		this.puzzleWorker.addEventListener("message", this.onPuzzleGenerated);
		canvas.addEventListener("webglcontextlost", this.onContextLost);
		canvas.addEventListener("webglcontextrestored", this.onContextRestored);
		this.appliances.bind(canvas, this.camera);
		this.orbit = new OrbitController(canvas, this.camera, {
			onClick: (x, y, touch) => this.handleClick(x, y, void 0, "head", touch),
			onHover: (x, y) => this.handleHover(x, y),
			onLeave: () => this.setHovered(null),
			onViewChanged: () => {
				this.refreshAvailability(false);
				this.publishDiagnostics();
			}
		});
		this.hud.resetViewButton.addEventListener("click", () => {
			this.orbit.setAngles(.76, this.currentLevel?.shape === "sphere" ? .66 : .56);
			this.orbit.setRadius(this.currentLevel?.cameraRadius ?? 19.2);
			this.refreshAvailability(false);
			this.publishDiagnostics();
		});
		this.hud.resetButton.addEventListener("click", this.resetCurrentPuzzle);
		this.hud.newButton.addEventListener("click", this.loadNewPuzzle);
		this.hud.continueButton.addEventListener("click", this.continueAfterComplete);
		this.hud.completeHomeButton.addEventListener("click", this.returnToOpening);
		this.hud.applianceGalleryButton.addEventListener("click", this.onOpenApplianceGallery);
		this.hud.homeButton.addEventListener("click", this.returnToOpening);
		this.hud.languageButton.addEventListener("click", this.toggleLanguage);
		this.hud.retryRandomButton.addEventListener("click", this.retryRandomPuzzle);
		this.hud.gameOverNewButton.addEventListener("click", this.loadNewPuzzle);
		this.hud.hintButton.addEventListener("click", this.revealHint);
		document.querySelector("#app")?.addEventListener("click", this.onUiButtonClick);
		window.addEventListener("resize", this.onResize);
		this.resize();
		if (Number.isFinite(window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__)) {
			window.__FINISH_OPENING_FOR_EVIDENCE__ = () => this.finishOpeningForEvidence();
			window.__SETTLE_APPLIANCE_FOR_EVIDENCE__ = () => this.settleApplianceForEvidence();
			window.__ACTIVATE_APPLIANCE_FOR_EVIDENCE__ = (kind) => this.activateApplianceForEvidence(kind);
			window.__ACTIVATE_RUSH_CABLE_FOR_EVIDENCE__ = (id) => this.activateRushCableForEvidence(id);
			window.__PULL_CABLE_FOR_EVIDENCE__ = (id, end = "head") => this.pullCableForEvidence(id, end);
			window.__TRIGGER_TELEVISION_GLITCH_FOR_EVIDENCE__ = (restart = true) => {
				if (restart) this.pipeline.setSkillEffect("television-glitch", true);
				return this.pipeline.skillEffectState;
			};
			window.__SHOW_SKILL_EFFECT_FOR_EVIDENCE__ = (asset, yaw = 0) => {
				if (!(asset in SKILL_EFFECT_ASSET_REFERENCES)) return false;
				this.arrowRoot.visible = false;
				this.appliances.root.visible = false;
				this.connections.root.visible = false;
				this.performances.root.visible = false;
				this.skillEffects.root.visible = true;
				const model = this.skillEffects.showAssetForEvidence(asset, yaw);
				return Boolean(model.userData.assetId && model.getObjectByName("attachment-socket"));
			};
			window.__SHOW_SKILL_PRESENTATION_FOR_EVIDENCE__ = (skill) => this.showSkillPresentationForEvidence(skill);
			window.__FREEZE_SKILL_PRESENTATION_FOR_EVIDENCE__ = (timeMs) => this.freezeSkillPresentationForEvidence(timeMs);
		}
		const params = new URLSearchParams(window.location.search);
		this.rushSelectionHint = getRushChallenge(params.get("rush"));
		const parsedSeed = Number(params.get("seed"));
		const parsedLevel = Number(params.get("level"));
		const hasCampaignLevel = Number.isInteger(parsedLevel) && parsedLevel >= 1 && parsedLevel <= CAMPAIGN_LEVELS.length;
		const hasExplicitSeed = Number.isFinite(parsedSeed) && parsedSeed > 0;
		const randomRequested = params.get("mode") === "random" && params.get("direct") === "1";
		const exploreRequested = params.get("mode") === "explore" && params.get("direct") === "1";
		const doubleRequested = params.get("mode") === "double" && params.get("direct") === "1";
		const skillRequested = params.get("mode") === "skill" && params.get("direct") === "1";
		const rushRequested = params.get("mode") === "rush" && params.get("direct") === "1";
		this.setExplorationMode(exploreRequested);
		if (rushRequested) {
			this.currentRushChallenge = this.rushSelectionHint ?? RUSH_CHALLENGES[0];
			this.rushSelectionHint = null;
			this.rushRound = new RushRound(this.currentRushChallenge.timeLimitSeconds);
			this.rushFlow = "sequence";
		}
		const staleRandomUrl = params.get("mode") === "random" && !randomRequested;
		const directChallengeRequested = randomRequested || exploreRequested || doubleRequested || skillRequested;
		const initialSeed = rushRequested && this.currentRushChallenge ? this.currentRushChallenge.level.seed : directChallengeRequested ? hasExplicitSeed ? parsedSeed >>> 0 : createRandomSeed() : hasExplicitSeed && !staleRandomUrl ? parsedSeed >>> 0 : seedForCampaignLevel(hasCampaignLevel ? parsedLevel : 1);
		const initialLevel = rushRequested && this.currentRushChallenge ? this.currentRushChallenge.level : doubleRequested ? getDoubleEndedLevel(initialSeed) : skillRequested ? getSkillChallengeLevel(initialSeed) : exploreRequested ? getStandardRandomLevel(initialSeed) : randomRequested ? getRandomLevel(initialSeed) : getCampaignLevel(hasCampaignLevel ? parsedLevel : 1);
		const initialMode = rushRequested ? "rush" : skillRequested ? "skill" : randomRequested || exploreRequested || doubleRequested ? "random" : "campaign";
		if (skillRequested) {
			this.skillEngine = this.createSkillEngine(initialSeed);
			this.skillUi.setVisible(true);
			this.skillUi.render(this.skillEngine.state);
		}
		this.startupTimer = window.setTimeout(() => {
			this.prepareOpeningAndLoadPuzzle(initialSeed, initialLevel, initialMode);
		}, 80);
		this.hud.beginPuzzleLoad(rushRequested ? "loading.rush" : skillRequested ? "loading.skill" : "loading.first");
		this.publishDiagnostics();
	}
	start() {
		this.loop.start();
	}
	dispose() {
		this.loop.stop();
		window.clearTimeout(this.startupTimer);
		this.puzzleWorker.removeEventListener("message", this.onPuzzleGenerated);
		this.puzzleWorker.terminate();
		this.prefetchWorker?.removeEventListener("message", this.onPuzzlePrefetched);
		this.prefetchWorker?.terminate();
		this.prefetchWorker = null;
		this.orbit.dispose();
		this.pipeline.dispose();
		this.globalToolbar.dispose();
		this.nightEnvironment.dispose();
		this.sky.dispose();
		this.theme.dispose();
		this.season.dispose();
		this.audio.dispose();
		this.sensory.dispose();
		this.petals.dispose();
		this.performances.dispose();
		this.clearPuzzle();
		this.connections.dispose();
		this.appliances.dispose();
		this.applianceGallery?.dispose();
		this.openingScene.dispose();
		this.skillPresentation.dispose();
		this.televisionReconstruction.dispose();
		this.toasterHeatSwap.dispose();
		this.washerSpin.dispose();
		this.refrigeratorScreenIce.dispose();
		this.skillEffects.dispose();
		this.bubbleShield.dispose();
		this.soundWaveShield.dispose();
		this.dehumidifierDryShield.dispose();
		this.startScreen.dispose();
		this.rushUi.dispose();
		this.doubleEndedUi.dispose();
		this.skillUi.dispose();
		this.hud.dispose();
		this.applianceGeometryWarmupTarget.dispose();
		this.applianceGeometryWarmupMaterial.dispose();
		this.disposeJellyEnvironment?.();
		this.renderer.dispose();
		if (window.__PROFILE_RENDER_BREAKDOWN__) window.__PROFILE_RENDER_BREAKDOWN__ = void 0;
		this.canvas.removeEventListener("webglcontextlost", this.onContextLost);
		this.canvas.removeEventListener("webglcontextrestored", this.onContextRestored);
		window.removeEventListener("resize", this.onResize);
		this.hud.resetButton.removeEventListener("click", this.resetCurrentPuzzle);
		this.hud.newButton.removeEventListener("click", this.loadNewPuzzle);
		this.hud.continueButton.removeEventListener("click", this.continueAfterComplete);
		this.hud.completeHomeButton.removeEventListener("click", this.returnToOpening);
		this.hud.applianceGalleryButton.removeEventListener("click", this.onOpenApplianceGallery);
		this.hud.homeButton.removeEventListener("click", this.returnToOpening);
		this.hud.languageButton.removeEventListener("click", this.toggleLanguage);
		this.hud.retryRandomButton.removeEventListener("click", this.retryRandomPuzzle);
		this.hud.gameOverNewButton.removeEventListener("click", this.loadNewPuzzle);
		this.hud.hintButton.removeEventListener("click", this.revealHint);
		document.querySelector("#app")?.removeEventListener("click", this.onUiButtonClick);
		window.__THREE_GAME_DIAGNOSTICS__ = void 0;
		window.__ACTIVATE_APPLIANCE_FOR_EVIDENCE__ = void 0;
		window.__ACTIVATE_RUSH_CABLE_FOR_EVIDENCE__ = void 0;
		window.__SHOW_SKILL_EFFECT_FOR_EVIDENCE__ = void 0;
		window.__TRIGGER_TELEVISION_GLITCH_FOR_EVIDENCE__ = void 0;
		window.__SHOW_SKILL_PRESENTATION_FOR_EVIDENCE__ = void 0;
		window.__FREEZE_SKILL_PRESENTATION_FOR_EVIDENCE__ = void 0;
		window.clearTimeout(this.skillSettleTimer);
		window.clearTimeout(this.skillCommitTimer);
		window.clearTimeout(this.skillSettleCueTimer);
		window.clearTimeout(this.skillEvidenceCleanupTimer);
		window.clearTimeout(this.skillBuffSwapTimer);
		this.skillBuffSwapTimer = 0;
		this.skillBuffVisualReleaseAt = 0;
		this.lastSkillBuffId = null;
		window.clearTimeout(this.skillRecycleSelectionTimer);
	}
	uploadApplianceGeometry(root) {
		const originalParent = root.parent;
		const originalIndex = originalParent?.children.indexOf(root) ?? -1;
		const rootVisible = root.visible;
		const culling = [];
		root.traverse((object) => {
			culling.push({
				object,
				frustumCulled: object.frustumCulled
			});
			object.frustumCulled = false;
		});
		root.visible = true;
		const previousTarget = this.renderer.getRenderTarget();
		root.removeFromParent();
		this.applianceGeometryWarmupScene.add(root);
		try {
			this.renderer.setRenderTarget(this.applianceGeometryWarmupTarget);
			this.renderer.clear();
			this.renderer.render(this.applianceGeometryWarmupScene, this.applianceGeometryWarmupCamera);
		} finally {
			root.removeFromParent();
			if (originalParent) {
				originalParent.add(root);
				if (originalIndex >= 0 && originalIndex < originalParent.children.length - 1) {
					originalParent.children.splice(originalParent.children.indexOf(root), 1);
					originalParent.children.splice(originalIndex, 0, root);
				}
			}
			root.visible = rootVisible;
			culling.forEach(({ object, frustumCulled }) => {
				object.frustumCulled = frustumCulled;
			});
			this.renderer.setRenderTarget(previousTarget);
		}
	}
	revealPerformanceEffectsForWarmup(root) {
		const states = [];
		const reveal = /* @__PURE__ */ new Set();
		root.traverse((object) => {
			states.push({
				object,
				visible: object.visible,
				frustumCulled: object.frustumCulled,
				layersMask: object.layers.mask
			});
			if (!object.userData.performanceEffect || object.userData.performanceWarmupProxy === true) return;
			object.traverse((descendant) => reveal.add(descendant));
			let ancestor = object;
			while (ancestor) {
				reveal.add(ancestor);
				if (ancestor === root) break;
				ancestor = ancestor.parent;
			}
		});
		states.forEach(({ object }) => {
			object.frustumCulled = false;
			if (object instanceof Light || reveal.has(object)) {
				object.visible = true;
				object.layers.set(PERFORMANCE_WARMUP_LAYER);
			}
		});
		return () => {
			states.forEach(({ object, visible, frustumCulled, layersMask }) => {
				object.visible = visible;
				object.frustumCulled = frustumCulled;
				object.layers.mask = layersMask;
			});
		};
	}
	async warmPerformanceEffectsAsync() {
		if (this.performanceEffectsWarmed) return;
		this.performanceEffectsWarmed = true;
		const roots = [
			this.performances.root,
			this.bubbleShield.root,
			this.soundWaveShield.root,
			this.dehumidifierDryShield.root
		];
		const previousTarget = this.renderer.getRenderTarget();
		const restorers = roots.map((root) => this.revealPerformanceEffectsForWarmup(root));
		const warmupCamera = this.camera.clone();
		warmupCamera.layers.enable(0);
		warmupCamera.layers.enable(PERFORMANCE_WARMUP_LAYER);
		warmupCamera.updateMatrixWorld(true);
		try {
			for (const root of roots) await this.renderer.compileAsync(root, warmupCamera, this.scene);
			this.renderer.setRenderTarget(this.applianceGeometryWarmupTarget);
			this.renderer.clear();
			this.renderer.render(this.scene, warmupCamera);
		} finally {
			restorers.reverse().forEach((restore) => restore());
			this.renderer.setRenderTarget(previousTarget);
		}
	}
	resetCurrentPuzzle = () => {
		if (!this.puzzle) return;
		this.randomGameOver = false;
		this.hud.beginPuzzleLoad("loading.reset");
		requestAnimationFrame(() => {
			this.resetPuzzleState(true);
			if (this.currentMode === "rush" && this.currentRushChallenge) this.rushUi.showBriefing(this.currentRushChallenge);
		});
	};
	loadNewPuzzle = () => {
		this.cancelPrefetch();
		this.randomGameOver = false;
		this.hud.hideGameOver();
		this.loadRandomChallengeFromPool(createRandomSeed());
	};
	loadRandomChallengeFromPool(seed) {
		const challengeMode = selectRandomChallengeMode(seed);
		if (challengeMode === "rush") {
			this.rushFlow = "random-pool";
			this.loadRushChallenge(pickRushChallenge(seed));
			return;
		}
		if (challengeMode === "skill") {
			this.loadSkillChallenge(seed);
			return;
		}
		if (challengeMode === "exploration") {
			this.loadClassicRandomPuzzle(seed, getStandardRandomLevel(seed), true);
			return;
		}
		this.loadClassicRandomPuzzle(seed, challengeMode === "double-ended" ? getDoubleEndedLevel(seed) : getStandardRandomLevel(seed));
	}
	loadClassicRandomPuzzle(seed, level = getRandomLevel(seed), exploration = false) {
		this.setExplorationMode(exploration);
		this.skillEngine = null;
		this.lastSkillBuffId = null;
		this.skillBuffVisualReleaseAt = 0;
		window.clearTimeout(this.skillBuffSwapTimer);
		this.skillBuffSwapTimer = 0;
		this.setSkillInputLocked(false);
		this.skillTransientScreenEffect = "none";
		this.pipeline.setSkillEffect("none", true);
		this.skillUi.setVisible(false);
		this.appliances.setReplacementFilter(null);
		this.currentRushChallenge = null;
		this.rushRound = null;
		this.rushFlow = null;
		this.rushUi.hide();
		this.doubleEndedUi.hide();
		this.petals.mesh.visible = true;
		this.loadPuzzle(seed, level, "random", exploration ? "exploration" : "random");
	}
	startRandomFromOpening = () => {
		if (!this.leaveOpeningForModeSelection()) return;
		this.loadRandomChallengeFromPool(createRandomSeed());
	};
	startExploreFromOpening = () => {
		if (!this.leaveOpeningForModeSelection()) return;
		const seed = createRandomSeed();
		this.loadClassicRandomPuzzle(seed, getStandardRandomLevel(seed), true);
	};
	startDoubleEndedFromOpening = () => {
		if (!this.leaveOpeningForModeSelection()) return;
		const seed = createRandomSeed();
		this.loadClassicRandomPuzzle(seed, getDoubleEndedLevel(seed));
	};
	startSkillFromOpening = () => {
		if (!this.leaveOpeningForModeSelection()) return;
		this.loadSkillChallenge(createRandomSeed());
	};
	loadSkillChallenge(seed) {
		this.setExplorationMode(false);
		this.currentRushChallenge = null;
		this.rushRound = null;
		this.rushFlow = null;
		this.rushUi.hide();
		this.doubleEndedUi.hide();
		this.petals.mesh.visible = true;
		this.skillEngine = this.createSkillEngine(seed);
		this.lastSkillBuffId = null;
		this.setSkillInputLocked(false);
		this.skillUi.setVisible(true);
		this.skillUi.render(this.skillEngine.state);
		this.appliances.setReplacementFilter((definition) => {
			return !(this.skillEngine?.state.debuff !== null) || ![
				"humidifier",
				"refrigerator",
				"coffee-maker",
				"rice-cooker",
				"microwave",
				"phone"
			].includes(definition.id);
		});
		this.loadPuzzle(seed, getSkillChallengeLevel(seed), "skill");
	}
	leaveOpeningForModeSelection() {
		if (!this.openingActive || !this.initialSceneReady) return false;
		this.puzzleRequestId += 1;
		this.puzzleApplyToken += 1;
		this.cancelPrefetch();
		this.startScreen.beginExit();
		this.startScreen.finishExit();
		this.openingActive = false;
		this.openingTransitioning = false;
		this.openingCameraPhase = "idle";
		this.openingScene.root.visible = false;
		this.arrowRoot.visible = false;
		this.appliances.root.visible = false;
		this.connections.root.visible = false;
		this.petals.mesh.visible = false;
		return true;
	}
	setExplorationMode(active) {
		if (this.explorationMode === active) return;
		this.explorationMode = active;
		this.orbit.setTouchLantern(active);
		document.documentElement.classList.toggle("exploration-mode-active", active);
		if (active) {
			this.explorationReturnTheme = this.theme.targetMode;
			this.theme.setMode("night");
		} else if (this.explorationReturnTheme) {
			this.theme.setMode(this.explorationReturnTheme);
			this.explorationReturnTheme = null;
		}
		this.globalToolbar.setThemeLocked(active);
		this.pipeline.setExplorationProgress(active ? 1 : 0);
		this.nightEnvironment.setExplorationProgress(active ? 1 : 0);
	}
	createSkillEngine(seed) {
		return new SkillChallengeEngine(seed);
	}
	startRushFromOpening = () => {
		if (!this.openingActive || !this.initialSceneReady) return;
		const challenge = this.rushSelectionHint ?? RUSH_CHALLENGES[0];
		this.rushSelectionHint = null;
		if (!this.leaveOpeningForModeSelection()) return;
		this.rushFlow = "sequence";
		this.loadRushChallenge(challenge);
	};
	loadRushChallenge(challenge) {
		this.setExplorationMode(false);
		this.cancelPrefetch();
		this.skillEngine = null;
		this.setSkillInputLocked(false);
		this.skillTransientScreenEffect = "none";
		this.pipeline.setSkillEffect("none", true);
		this.skillUi.setVisible(false);
		this.appliances.setReplacementFilter(null);
		this.rushUi.hide();
		this.doubleEndedUi.hide();
		this.currentRushChallenge = challenge;
		this.rushRound = new RushRound(challenge.timeLimitSeconds);
		this.loadPuzzle(challenge.level.seed, challenge.level, "rush");
	}
	continueRushChallenge() {
		if (this.rushFlow === "sequence" && this.currentRushChallenge) {
			const nextChallenge = getNextRushChallenge(this.currentRushChallenge);
			if (nextChallenge) {
				this.loadRushChallenge(nextChallenge);
				return;
			}
		}
		this.rushFlow = this.rushFlow ?? "random-pool";
		this.loadRushChallenge(pickRushChallenge(createRandomSeed()));
	}
	startRushRound() {
		if (this.currentMode !== "rush" || !this.rushRound || this.rushRound.phase !== "briefing") return;
		this.rushRound.start(performance.now() * .001);
		this.rushUi.showRunning();
		this.refreshAvailability(true);
		this.publishDiagnostics();
	}
	startDoubleEndedChallenge() {
		if (!this.isDoubleEndedChallenge() || !this.doubleEndedUi.briefingVisible) return;
		this.doubleEndedUi.showPlaying();
		this.refreshAvailability(true);
		this.publishDiagnostics();
	}
	retryRushPuzzle = () => {
		if (this.currentMode !== "rush" || !this.currentRushChallenge || !this.puzzle) return;
		this.hud.beginPuzzleLoad("loading.reset");
		requestAnimationFrame(() => {
			this.resetPuzzleState(true);
			this.rushUi.showBriefing(this.currentRushChallenge);
		});
	};
	retryRandomPuzzle = () => {
		if (!this.puzzle || this.currentMode !== "random" && this.currentMode !== "skill") return;
		this.randomGameOver = false;
		this.hud.beginPuzzleLoad("loading.reset");
		requestAnimationFrame(() => this.resetPuzzleState(false));
	};
	resetPuzzleState(preserveRandomLives) {
		if (!this.puzzle) return;
		this.setHovered(null);
		this.animations.length = 0;
		this.pendingApplianceConnections.length = 0;
		this.connections.clear();
		this.performances.reset();
		window.clearTimeout(this.skillEvidenceCleanupTimer);
		window.clearTimeout(this.skillBuffSwapTimer);
		this.skillBuffSwapTimer = 0;
		this.skillBuffVisualReleaseAt = 0;
		this.lastSkillBuffId = null;
		this.skillPresentation.reset();
		this.skillEffects.reset();
		this.bubbleShield.reset();
		this.soundWaveShield.reset();
		this.dehumidifierDryShield.reset();
		this.portableSpeakerSpacing.reset(this.getPortableSpeakerSpacingTargets());
		this.portableSpeakerSpacingTargetsCache = [];
		this.televisionReconstruction.reset();
		this.toasterHeatSwap.reset();
		this.washerSpin.reset();
		this.kettleThaw.reset();
		this.refrigeratorFreeze.reset();
		this.petals.setColdProgress(0);
		this.appliances.reset();
		this.arrows = this.puzzle.arrows.map(makeRuntime);
		this.appliances.setRequiredColors(this.currentMode === "rush" ? [] : this.arrows.map((arrow) => arrow.definition.color));
		this.applianceRoutingRevision = this.appliances.routingRevision;
		this.removedCount = 0;
		this.randomGameOver = false;
		this.setSkillInputLocked(false);
		window.clearTimeout(this.skillSettleTimer);
		window.clearTimeout(this.skillCommitTimer);
		window.clearTimeout(this.skillSettleCueTimer);
		this.skillTransientHighlights.clear();
		this.desktopComputerFeedback = null;
		this.pendingDryShieldAbsorb = false;
		delete document.documentElement.dataset.desktopComputerFeedback;
		this.pendingWasherFlingRemovals = [];
		this.coffeeLockExitTarget = null;
		this.coffeeStainElapsed = 0;
		this.coffeeStainStrength = 0;
		this.coffeeStainProfiles.clear();
		this.skillAutoRemovalEnds.clear();
		this.radioRouteCableIds = [];
		if (this.currentMode === "skill") {
			this.skillEngine ??= this.createSkillEngine(this.puzzle.seed);
			this.skillEngine.reset(this.puzzle.seed);
			this.randomLives = this.skillEngine.state.currentLives;
			this.skillUi.setVisible(true);
			this.skillUi.render(this.skillEngine.state);
			this.commitSkillDefinitions(new Map(this.puzzle.arrows.map((definition) => [definition.id, definition])), false);
		}
		this.activeHint = null;
		this.availableChoices = [];
		if (this.currentMode === "rush") this.rushRound?.reset();
		this.puzzleRevision += 1;
		if (!preserveRandomLives) {
			if (this.currentMode === "random") this.randomLives = 3;
			this.hintUsesRemaining = MAX_HINT_USES;
		}
		this.hud.setRandomLives(this.currentMode === "random" || this.currentMode === "skill", this.randomLives, this.currentMode === "skill" ? this.skillEngine?.state.maxLives ?? 3 : 3);
		this.hud.setHintUses(this.hintUsesRemaining);
		this.appliances.root.visible = this.currentMode !== "rush";
		this.connections.root.visible = this.currentMode !== "rush";
		this.petals.mesh.visible = this.currentMode !== "rush";
		for (const model of this.models.values()) model.resetPose();
		this.hud.setPuzzle(this.puzzle.seed, this.arrows.length, this.arrows.length, this.currentMode === "campaign" && this.currentLevel ? "mode.level" : this.currentMode === "rush" ? "mode.rush" : this.currentMode === "skill" ? "mode.skill" : this.explorationMode ? "mode.explore" : "mode.random", this.getCompletionContinuation().labelKey, this.currentMode === "campaign" && this.currentLevel ? {
			level: this.currentLevel.id.toString().padStart(2, "0"),
			shapeId: this.currentLevel.shape
		} : {});
		this.hud.flash(t("flash.summary", {
			count: this.arrows.length,
			free: this.puzzle.initiallyFree
		}));
		this.refreshAvailability(true);
		if (this.isDoubleEndedChallenge()) this.doubleEndedUi.showBriefing();
		this.publishDiagnostics();
	}
	toggleLanguage = () => {
		toggleLocale();
		this.startScreen.refreshLocale();
		this.hud.refreshLocale();
		this.rushUi.refreshLocale();
		this.doubleEndedUi.refreshLocale();
		this.globalToolbar.refreshLocale();
		this.publishDiagnostics();
	};
	revealHint = () => {
		this.refreshAvailability(false);
		if (!this.canRevealHint() || this.availableChoices.length === 0) {
			this.hud.showHintUnavailable();
			return;
		}
		const selected = (this.clickTarget ? this.availableChoices.find(({ arrow, end }) => arrow.definition.id === this.clickTarget?.id && end === this.clickTarget.end) : null) ?? this.availableChoices[0];
		this.activeHint = {
			id: selected.arrow.definition.id,
			end: selected.end
		};
		this.applyActiveHint(true);
		this.hintUsesRemaining = Math.max(0, this.hintUsesRemaining - 1);
		this.hud.setHintUses(this.hintUsesRemaining);
		this.hud.setHintEnabled(this.canRevealHint() && this.availableChoices.length > 0);
		this.hud.showHintUsed(this.hintUsesRemaining);
		this.publishDiagnostics();
	};
	returnToOpening = () => {
		if (this.openingActive) return;
		this.puzzleRequestId += 1;
		this.puzzleApplyToken += 1;
		this.cancelPrefetch();
		this.clearPuzzle();
		this.puzzle = null;
		this.initialPuzzlePreparing = false;
		this.openingStartPending = false;
		this.removedCount = 0;
		this.randomGameOver = false;
		this.randomLives = 3;
		this.hintUsesRemaining = MAX_HINT_USES;
		this.rushSelectionHint = null;
		this.setHovered(null);
		this.clearActiveHint();
		this.hud.setHintEnabled(false);
		this.rushUi.hide();
		this.doubleEndedUi.hide();
		this.rushRound = null;
		this.currentRushChallenge = null;
		this.rushFlow = null;
		this.setExplorationMode(false);
		this.setSkillInputLocked(false);
		this.skillEngine = null;
		this.skillTransientScreenEffect = "none";
		this.pipeline.setSkillEffect("none", true);
		this.skillUi.setVisible(false);
		this.appliances.setReplacementFilter(null);
		this.openingActive = true;
		this.openingTransitioning = false;
		this.openingCameraPhase = "idle";
		this.openingCameraElapsed = 0;
		this.sceneTransitionCurtain.style.opacity = "0";
		this.sceneTransitionCurtain.classList.remove("visible");
		this.openingScene.reset();
		this.openingScene.root.visible = true;
		this.arrowRoot.visible = false;
		this.appliances.root.visible = false;
		this.connections.root.visible = false;
		this.petals.mesh.visible = true;
		this.hud.hidePanels();
		this.startScreen.showAgain();
		this.orbit.setAngles(.76, .56);
		this.orbit.setRadius(19.2);
		this.publishDiagnostics();
	};
	loadNextPuzzle = () => {
		this.setExplorationMode(false);
		const nextId = this.currentMode === "campaign" && this.currentLevel ? this.currentLevel.id + 1 : 1;
		if (nextId > CAMPAIGN_LEVELS.length) {
			this.loadNewPuzzle();
			return;
		}
		const level = getCampaignLevel(nextId);
		this.currentLevel = level;
		this.currentMode = "campaign";
		this.hud.beginPuzzleLoad("loading.level", true, { level: level.id });
		if (this.prefetchedLevel?.levelId === level.id) {
			const prefetched = this.prefetchedLevel;
			this.prefetchedLevel = null;
			this.generationMs = prefetched.generationMs;
			const applyToken = ++this.puzzleApplyToken;
			this.hud.completePuzzleLoad(() => this.applyPuzzle(prefetched.puzzle, false, false, applyToken), this.revealCommittedScene);
			return;
		}
		if (this.prefetchingLevelId === level.id) {
			this.waitingForPrefetchLevelId = level.id;
			return;
		}
		this.loadPuzzle(seedForCampaignLevel(level.id), level, "campaign");
	};
	continueAfterComplete = () => {
		const continuation = this.getCompletionContinuation();
		const seed = createRandomSeed();
		switch (continuation.action) {
			case "next-campaign-level":
				this.loadNextPuzzle();
				return;
			case "new-skill":
				this.loadSkillChallenge(seed);
				return;
			case "new-exploration":
				this.loadClassicRandomPuzzle(seed, getStandardRandomLevel(seed), true);
				return;
			case "new-double-ended":
				this.loadClassicRandomPuzzle(seed, getDoubleEndedLevel(seed));
				return;
			case "new-rush":
				this.continueRushChallenge();
				return;
			case "new-random": if (this.currentMode === "campaign") this.loadNewPuzzle();
			else this.loadClassicRandomPuzzle(seed, getStandardRandomLevel(seed));
		}
	};
	persistCampaignProgress() {
		if (this.currentMode !== "campaign" || !this.currentLevel) return;
		try {
			const key = "plug-spirits-campaign-progress";
			const previous = Number.parseInt(localStorage.getItem(key) ?? "0", 10);
			localStorage.setItem(key, String(Math.max(previous || 0, this.currentLevel.id)));
		} catch {}
	}
	getCompletionContinuation() {
		return resolveCompletionContinuation({
			mode: this.currentMode,
			exploration: this.explorationMode,
			challengeKind: this.puzzle?.challengeKind ?? this.currentLevel?.challengeKind ?? null,
			levelId: this.currentLevel?.id ?? null,
			campaignLevelCount: CAMPAIGN_LEVELS.length
		});
	}
	async prepareOpeningAndLoadPuzzle(seed, level, mode) {
		try {
			this.startScreen.setStage("start.loading.bundle", .12, .24);
			await this.openingScene.prepareAsync((progress, buildMs) => {
				this.preloadMaxSliceMs = Math.max(this.preloadMaxSliceMs, buildMs);
				this.startScreen.setExactProgress("start.loading.bundle", .12 + progress * .12);
			});
			this.loadPuzzle(seed, level, mode);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			this.startScreen.showError(message);
			this.hud.showLoadError(message);
		}
	}
	loadPuzzle(seed, level, mode = "random", templateMode) {
		this.puzzleRequestId += 1;
		this.puzzleApplyToken += 1;
		this.currentLevel = level ?? null;
		this.currentMode = mode;
		this.arrowRoot.visible = false;
		this.appliances.root.visible = false;
		this.connections.root.visible = false;
		this.doubleEndedUi.hide();
		this.hud.beginPuzzleLoad(mode === "campaign" && level ? "loading.level" : mode === "rush" ? "loading.rush" : mode === "skill" ? "loading.skill" : "loading.random", this.puzzle !== null, mode === "campaign" && level ? { level: level.id } : {});
		this.hud.flash(t("flash.wiring"));
		if (this.openingActive && this.puzzle === null) this.startScreen.setStage("start.loading.first", .24, .56);
		this.puzzleWorker.postMessage({
			requestId: this.puzzleRequestId,
			seed,
			targetCount: level?.targetCount ?? 30,
			level,
			mode,
			templateMode
		});
	}
	async applyPuzzle(puzzle, staged = false, preserveRandomLives = false, applyToken = this.puzzleApplyToken) {
		const isCurrentApply = () => applyToken === this.puzzleApplyToken;
		if (!isCurrentApply()) return;
		const modelBuildStartedAt = performance.now();
		this.clearPuzzle();
		this.puzzle = puzzle;
		this.arrows = this.puzzle.arrows.map(makeRuntime);
		this.resize();
		this.removedCount = 0;
		this.randomGameOver = false;
		if (this.currentMode === "skill") {
			this.skillEngine = this.createSkillEngine(puzzle.seed);
			this.skillInputLocked = false;
			this.skillTransientHighlights.clear();
			this.skillTransientScreenEffect = "none";
			this.skillUi.setVisible(true);
			this.skillUi.render(this.skillEngine.state);
			this.appliances.setReplacementFilter((definition) => {
				return !(this.skillEngine?.state.debuff !== null) || ![
					"humidifier",
					"refrigerator",
					"coffee-maker",
					"rice-cooker",
					"microwave",
					"phone"
				].includes(definition.id);
			});
			this.randomLives = this.skillEngine.state.currentLives;
		} else {
			this.skillEngine = null;
			this.skillUi.setVisible(false);
			this.skillTransientScreenEffect = "none";
			this.pipeline.setSkillEffect("none", true);
			this.appliances.setReplacementFilter(null);
		}
		if (!preserveRandomLives) {
			if (this.currentMode === "random") this.randomLives = 3;
			this.hintUsesRemaining = MAX_HINT_USES;
		}
		this.hud.setRandomLives(this.currentMode === "random" || this.currentMode === "skill", this.randomLives, this.currentMode === "skill" ? this.skillEngine?.state.maxLives ?? 3 : 3);
		this.hud.setHintUses(this.hintUsesRemaining);
		const applianceSeed = applianceSeedForPuzzle(puzzle.seed, this.currentMode === "campaign" && this.currentLevel ? this.currentLevel.id : 0);
		const activeColors = [...new Set(puzzle.arrows.map((arrow) => arrow.color))];
		const configuredDefinitions = this.currentMode === "campaign" && this.currentLevel?.id === 1 ? selectTutorialAppliances(activeColors.length) : void 0;
		if (!staged) this.preloadMaxSliceMs = 0;
		if (this.currentMode === "rush") {
			this.appliances.clear();
			this.appliances.setRequiredColors([]);
			if (staged) this.startScreen.setExactProgress("start.loading.cables", .82);
		} else if (staged) {
			this.startScreen.setStage("start.loading.appliances", .58, .82);
			await this.appliances.configureAsync(applianceSeed, (progress, buildMs) => {
				this.preloadMaxSliceMs = Math.max(this.preloadMaxSliceMs, buildMs);
				this.startScreen.setExactProgress("start.loading.appliances", .58 + progress * .18);
			}, configuredDefinitions, activeColors);
		} else await this.appliances.configureAsync(applianceSeed, (_progress, buildMs) => {
			this.preloadMaxSliceMs = Math.max(this.preloadMaxSliceMs, buildMs);
		}, configuredDefinitions, activeColors);
		if (!isCurrentApply()) return;
		this.appliances.setSingleTargetColorAliases([]);
		this.appliances.setRequiredColors(this.currentMode === "rush" ? [] : this.arrows.map((arrow) => arrow.definition.color));
		if (this.currentMode !== "rush") {
			await this.warmPerformanceEffectsAsync();
			if (!isCurrentApply()) return;
			const performanceBudget = new CooperativeYieldBudget();
			for (const target of this.appliances.targets) {
				this.performances.prime(target);
				await performanceBudget.afterItem();
				if (!isCurrentApply()) return;
			}
			await this.appliances.prepareInitialReplacementsAsync((progress, buildMs) => {
				this.preloadMaxSliceMs = Math.max(this.preloadMaxSliceMs, buildMs);
				if (staged) this.startScreen.setExactProgress("start.loading.appliances", .76 + progress * .06);
			}, this.currentMode === "skill" ? 1 : void 0, true);
			if (!isCurrentApply()) return;
		}
		this.applianceRoutingRevision = this.appliances.routingRevision;
		const cableBuildBudget = new CooperativeYieldBudget();
		for (let index = 0; index < this.arrows.length; index += 1) {
			const arrow = this.arrows[index];
			const cableBuildStartedAt = performance.now();
			const model = new PlugCableModel(arrow.definition, this.currentMode === "rush" ? void 0 : this.appliances.getPlugStyleForColor(arrow.definition.color));
			this.models.set(arrow.definition.id, model);
			this.arrowRoot.add(model.root);
			this.preloadMaxSliceMs = Math.max(this.preloadMaxSliceMs, performance.now() - cableBuildStartedAt);
			if (staged) this.startScreen.setExactProgress("start.loading.cables", .82 + (index + 1) / this.arrows.length * .11);
			if (staged) {
				if ((index + 1) % 5 === 0 || index === this.arrows.length - 1) await cableBuildBudget.afterItem();
			} else await cableBuildBudget.afterItem();
			if (!isCurrentApply()) return;
		}
		this.modelBuildMs = performance.now() - modelBuildStartedAt;
		this.hud.setPuzzle(this.puzzle.seed, this.arrows.length, this.arrows.length, this.currentMode === "campaign" && this.currentLevel ? "mode.level" : this.currentMode === "rush" ? "mode.rush" : this.currentMode === "skill" ? "mode.skill" : this.explorationMode ? "mode.explore" : "mode.random", this.getCompletionContinuation().labelKey, this.currentMode === "campaign" && this.currentLevel ? {
			level: this.currentLevel.id.toString().padStart(2, "0"),
			shapeId: this.currentLevel.shape
		} : {});
		this.hud.flash(t("flash.summary", {
			count: this.arrows.length,
			free: this.puzzle.initiallyFree
		}));
		if (this.currentLevel) {
			const preset = this.currentLevel.shape === "torus" ? {
				yaw: .62,
				pitch: .72
			} : this.currentLevel.shape === "sphere" ? {
				yaw: .76,
				pitch: .66
			} : {
				yaw: .76,
				pitch: .56
			};
			this.orbit.setAngles(preset.yaw, preset.pitch);
			this.orbit.setRadius(this.currentLevel.cameraRadius);
		}
		this.refreshAvailability(true);
		const url = new URL(window.location.href);
		url.searchParams.set("seed", String(this.puzzle.seed));
		if (this.currentMode === "campaign" && this.currentLevel) {
			url.searchParams.set("level", String(this.currentLevel.id));
			url.searchParams.delete("mode");
			url.searchParams.delete("rush");
			url.searchParams.delete("direct");
			url.searchParams.delete("skill");
		} else if (this.currentMode === "rush" && this.currentRushChallenge) {
			url.searchParams.delete("level");
			url.searchParams.set("mode", "rush");
			url.searchParams.set("rush", this.currentRushChallenge.id);
			url.searchParams.set("direct", "1");
			url.searchParams.delete("skill");
		} else if (this.currentMode === "skill") {
			url.searchParams.delete("level");
			url.searchParams.set("mode", "skill");
			url.searchParams.delete("skill");
			url.searchParams.set("direct", "1");
			url.searchParams.delete("rush");
		} else {
			url.searchParams.delete("level");
			url.searchParams.set("mode", this.explorationMode ? "explore" : "random");
			url.searchParams.set("direct", "1");
			url.searchParams.delete("rush");
			url.searchParams.delete("skill");
		}
		window.history.replaceState({}, "", url);
		this.prefetchedLevel = this.prefetchedLevel?.levelId === this.currentLevel?.id ? null : this.prefetchedLevel;
		this.prefetchNextCampaignLevel();
		if (staged) {
			this.startScreen.setStage("start.loading.scene", .94, .985);
			await this.warmInitialSceneInSlices();
			if (!isCurrentApply()) return;
			await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
			if (!isCurrentApply()) return;
			this.initialPuzzlePreparing = false;
			this.initialSceneReady = true;
			this.startScreen.markReady();
			this.publishDiagnostics();
		} else if (this.currentMode === "rush" && this.currentRushChallenge) this.rushUi.showBriefing(this.currentRushChallenge);
		else if (this.isDoubleEndedChallenge()) this.doubleEndedUi.showBriefing();
		if (!staged && !this.openingActive && isCurrentApply()) this.revealCommittedScene();
		this.puzzleRevision += 1;
		this.publishDiagnostics();
	}
	revealCommittedScene = () => {
		if (this.openingActive || !this.puzzle) return;
		this.arrowRoot.visible = true;
		this.appliances.root.visible = this.currentMode !== "rush";
		this.connections.root.visible = this.currentMode !== "rush";
		this.petals.mesh.visible = this.currentMode !== "rush";
		this.publishDiagnostics();
	};
	prefetchNextCampaignLevel() {
		if (this.currentMode !== "campaign" || !this.currentLevel || this.currentLevel.id >= CAMPAIGN_LEVELS.length) return;
		const level = getCampaignLevel(this.currentLevel.id + 1);
		if (this.prefetchedLevel?.levelId === level.id || this.prefetchingLevelId === level.id) return;
		this.prefetchRequestId += 1;
		this.prefetchingLevelId = level.id;
		this.getPrefetchWorker().postMessage({
			requestId: this.prefetchRequestId,
			seed: seedForCampaignLevel(level.id),
			targetCount: level.targetCount,
			level,
			mode: "campaign"
		});
	}
	getPrefetchWorker() {
		if (this.prefetchWorker) return this.prefetchWorker;
		const worker = new Worker(new URL(
			/* @vite-ignore */
			"" + new URL("generator.worker-Bo7oKbVx.js", import.meta.url).href,
			"" + import.meta.url
		), { type: "module" });
		worker.addEventListener("message", this.onPuzzlePrefetched);
		this.prefetchWorker = worker;
		return worker;
	}
	cancelPrefetch() {
		this.prefetchRequestId += 1;
		this.prefetchingLevelId = null;
		this.waitingForPrefetchLevelId = null;
		this.prefetchedLevel = null;
	}
	clearPuzzle() {
		window.clearTimeout(this.skillSettleTimer);
		window.clearTimeout(this.skillCommitTimer);
		window.clearTimeout(this.skillSettleCueTimer);
		window.clearTimeout(this.blockedRevealTimer);
		this.skillTransientHighlights.clear();
		this.skillRemovalSequenceCache = null;
		window.clearTimeout(this.skillEvidenceCleanupTimer);
		window.clearTimeout(this.skillRecycleSelectionTimer);
		window.clearTimeout(this.skillBuffSwapTimer);
		this.skillBuffSwapTimer = 0;
		this.skillBuffVisualReleaseAt = 0;
		this.lastSkillBuffId = null;
		this.desktopComputerFeedback = null;
		this.pendingDryShieldAbsorb = false;
		this.hud.setContinueReady(false);
		delete document.documentElement.dataset.desktopComputerFeedback;
		this.setHovered(null);
		this.animations.length = 0;
		this.pendingApplianceConnections.length = 0;
		this.skillAutoRemovalEnds.clear();
		this.pendingWasherFlingRemovals = [];
		this.washerFlingHistory = [];
		this.coffeeLockExitTarget = null;
		this.coffeeStainElapsed = 0;
		this.coffeeStainStrength = 0;
		this.coffeeStainProfiles.clear();
		this.radioRouteCableIds = [];
		this.connections.clear();
		this.performances.reset();
		this.skillPresentation.reset();
		this.skillEffects.reset();
		this.bubbleShield.reset();
		this.soundWaveShield.reset();
		this.dehumidifierDryShield.reset();
		this.portableSpeakerSpacing.reset(this.getPortableSpeakerSpacingTargets());
		this.portableSpeakerSpacingTargetsCache = [];
		this.televisionReconstruction.reset();
		this.toasterHeatSwap.reset();
		this.washerSpin.reset();
		this.kettleThaw.reset();
		this.refrigeratorFreeze.reset();
		this.petals.setColdProgress(0);
		this.appliances.clear();
		this.appliances.setRequiredColors([]);
		this.applianceRoutingRevision = this.appliances.routingRevision;
		for (const model of this.models.values()) {
			model.root.parent?.remove(model.root);
			model.dispose();
		}
		this.models.clear();
		this.arrows = [];
		this.activeHint = null;
		this.availableChoices = [];
		this.clickTarget = null;
		this.availableClickTargets = [];
		this.blockedClickTarget = null;
		this.doubleEndedUi.hide();
	}
	async warmInitialSceneInSlices() {
		const cableModels = [...this.models.values()];
		const cableRoots = cableModels.map((model) => model.root);
		const applianceRoots = this.appliances.targets.map((target) => target.root);
		const batches = [...cableRoots, ...applianceRoots];
		if (batches.length === 0) return;
		const arrowRootVisible = this.arrowRoot.visible;
		const applianceRootVisible = this.appliances.root.visible;
		const connectionRootVisible = this.connections.root.visible;
		const openingRootVisible = this.openingScene.root.visible;
		const petalsVisible = this.petals.mesh.visible;
		const batchVisibility = batches.map((object) => object.visible);
		this.arrowRoot.visible = true;
		this.appliances.root.visible = true;
		this.connections.root.visible = false;
		this.openingScene.root.visible = false;
		this.petals.mesh.visible = false;
		batches.forEach((object) => {
			object.visible = false;
		});
		try {
			for (let index = 0; index < batches.length; index += 1) {
				const object = batches[index];
				const cableModel = index < cableModels.length ? cableModels[index] : null;
				cableModel?.setIceShellWarmupVisible(true);
				cableModel?.setLampGuideWarmupVisible(true);
				object.visible = true;
				object.updateWorldMatrix(true, true);
				const compileStartedAt = performance.now();
				this.renderer.compile(object, this.camera, this.scene);
				this.preloadMaxSliceMs = Math.max(this.preloadMaxSliceMs, performance.now() - compileStartedAt);
				object.visible = false;
				cableModel?.setIceShellWarmupVisible(false);
				cableModel?.setLampGuideWarmupVisible(false);
				this.startScreen.setExactProgress(index < cableRoots.length ? "start.loading.materials" : "start.loading.applianceMaterials", .94 + (index + 1) / batches.length * .045);
				if ((index + 1) % 5 === 0 || index === batches.length - 1) await new Promise((resolve) => requestAnimationFrame(() => resolve()));
			}
		} finally {
			cableModels.forEach((model) => {
				model.setIceShellWarmupVisible(false);
				model.setLampGuideWarmupVisible(false);
			});
			batches.forEach((object, index) => {
				object.visible = batchVisibility[index];
			});
			this.arrowRoot.visible = arrowRootVisible;
			this.appliances.root.visible = applianceRootVisible;
			this.connections.root.visible = connectionRootVisible;
			this.openingScene.root.visible = openingRootVisible;
			this.petals.mesh.visible = petalsVisible;
		}
	}
	beginOpeningTransition() {
		if (!this.openingActive || this.openingTransitioning || this.openingStartPending) return;
		if (!this.puzzle) {
			if (!this.initialSceneReady) return;
			this.openingStartPending = true;
			this.startScreen.beginExit();
			const firstLevel = getCampaignLevel(1);
			this.loadPuzzle(seedForCampaignLevel(firstLevel.id), firstLevel, "campaign");
			return;
		}
		this.openingTransitioning = true;
		this.openingCameraPhase = "insert";
		this.openingCameraElapsed = 0;
		this.openingCameraFinal.copy(this.camera.position);
		this.sceneTransitionCurtain.style.opacity = "0";
		this.sceneTransitionCurtain.classList.remove("visible");
		this.startScreen.beginExit();
		this.openingScene.beginTransition();
		this.audio.playInteraction("mode-start");
	}
	finishOpeningTransition() {
		if (!this.openingActive) return;
		this.openingActive = false;
		this.openingScene.root.visible = false;
		this.arrowRoot.visible = true;
		this.appliances.root.visible = this.currentMode !== "rush";
		this.connections.root.visible = this.currentMode !== "rush";
		this.petals.mesh.visible = this.currentMode !== "rush";
		if (this.currentMode !== "rush") this.appliances.beginOpeningCameraTransition();
		this.startScreen.finishExit();
		this.openingCameraClose.copy(this.openingCameraFinal).sub(this.openingCameraFinalTarget).normalize().multiplyScalar(5.4).add(this.openingCameraFinalTarget);
		this.camera.position.copy(this.openingCameraClose);
		this.camera.lookAt(this.openingCameraFinalTarget);
		this.openingCameraPhase = "background-hold";
		this.openingCameraElapsed = 0;
		this.clickTarget = null;
		this.availableClickTargets = [];
		this.blockedClickTarget = null;
		this.publishDiagnostics();
	}
	updateOpeningCameraTransition(delta) {
		if (this.openingCameraPhase === "idle") return;
		this.openingCameraElapsed += delta;
		if (this.openingCameraPhase === "insert") {
			if (!this.openingScene.transitionComplete) return;
			this.openingCameraPhase = "hold";
			this.openingCameraElapsed = 0;
			return;
		}
		if (this.openingCameraPhase === "hold") {
			if (this.openingCameraElapsed < this.openingHoldDuration) return;
			this.openingCameraPhase = "fade-out";
			this.openingCameraElapsed = 0;
			this.sceneTransitionCurtain.classList.add("visible");
			return;
		}
		if (this.openingCameraPhase === "fade-out") {
			const progress = MathUtils.clamp(this.openingCameraElapsed / this.openingFadeOutDuration, 0, 1);
			this.sceneTransitionCurtain.style.opacity = String(MathUtils.smoothstep(progress, 0, 1));
			if (progress >= 1) this.finishOpeningTransition();
			return;
		}
		if (this.openingCameraPhase === "background-hold") {
			this.sceneTransitionCurtain.style.opacity = "1";
			this.camera.position.copy(this.openingCameraClose);
			this.camera.lookAt(this.openingCameraFinalTarget);
			if (this.openingCameraElapsed < this.openingBackgroundHoldDuration) return;
			this.openingCameraPhase = "reveal";
			this.openingCameraElapsed = 0;
			return;
		}
		if (this.openingCameraPhase === "reveal") {
			this.camera.position.copy(this.openingCameraClose);
			this.camera.lookAt(this.openingCameraFinalTarget);
			const progress = MathUtils.clamp(this.openingCameraElapsed / this.openingRevealDuration, 0, 1);
			this.sceneTransitionCurtain.style.opacity = String(1 - MathUtils.smoothstep(progress, 0, 1));
			if (progress < 1) return;
			this.sceneTransitionCurtain.style.opacity = "0";
			this.sceneTransitionCurtain.classList.remove("visible");
			this.openingCameraPhase = "pull";
			this.openingCameraElapsed = 0;
			return;
		}
		const progress = MathUtils.clamp(this.openingCameraElapsed / this.openingCameraPullDuration, 0, 1);
		const eased = MathUtils.smoothstep(progress, 0, 1);
		this.camera.position.lerpVectors(this.openingCameraClose, this.openingCameraFinal, eased);
		this.camera.lookAt(this.openingCameraFinalTarget);
		if (progress >= 1) {
			this.openingCameraPhase = "idle";
			this.openingTransitioning = false;
			this.orbit.setAngles(.76, this.currentLevel?.shape === "sphere" ? .66 : .56);
			this.orbit.setRadius(this.currentLevel?.cameraRadius ?? 19.2);
			this.refreshAvailability(true);
			if (this.currentMode === "rush" && this.currentRushChallenge) this.rushUi.showBriefing(this.currentRushChallenge);
			else if (this.isDoubleEndedChallenge()) this.doubleEndedUi.showBriefing();
			this.publishDiagnostics();
		}
	}
	createLighting() {
		this.disposeJellyEnvironment = installJellyEnvironment(this.renderer, this.scene);
		const sun = this.sun;
		sun.position.set(-8.5, 11, 9);
		sun.castShadow = true;
		sun.shadow.mapSize.set(2048, 2048);
		sun.shadow.camera.left = -7;
		sun.shadow.camera.right = 7;
		sun.shadow.camera.top = 7;
		sun.shadow.camera.bottom = -7;
		sun.shadow.camera.near = 1;
		sun.shadow.camera.far = 35;
		sun.shadow.bias = -4e-4;
		sun.shadow.normalBias = .035;
		sun.shadow.camera.layers.enable(30);
		this.scene.add(sun, sun.target);
		const fill = this.fill;
		fill.position.set(8, 4.5, -7);
		this.scene.add(fill, fill.target);
		const bounce = this.bounce;
		bounce.position.set(2, -5, 7);
		this.scene.add(bounce, bounce.target);
		this.scene.add(this.hemi);
	}
	finishOpeningForEvidence() {
		if (!Number.isFinite(window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__) || !this.puzzle) return false;
		this.openingActive = false;
		this.openingTransitioning = false;
		this.openingCameraPhase = "idle";
		this.openingCameraElapsed = 0;
		this.openingScene.root.visible = false;
		this.arrowRoot.visible = true;
		this.appliances.root.visible = this.currentMode !== "rush";
		this.connections.root.visible = this.currentMode !== "rush";
		this.petals.mesh.visible = this.currentMode !== "rush";
		this.startScreen.finishExit();
		this.sceneTransitionCurtain.style.opacity = "0";
		this.sceneTransitionCurtain.classList.remove("visible");
		this.orbit.setAngles(.76, this.currentLevel?.shape === "sphere" ? .66 : .56);
		this.orbit.setRadius(this.currentLevel?.cameraRadius ?? 19.2);
		this.refreshAvailability(true);
		this.publishDiagnostics();
		return true;
	}
	settleApplianceForEvidence() {
		if (!Number.isFinite(window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__)) return false;
		if (this.openingActive || this.openingTransitioning || this.animations.length > 0) return false;
		if (!this.appliances.replaceActiveTargetForEvidence()) return false;
		this.syncRequiredColors();
		this.refreshAvailability(false);
		this.publishDiagnostics();
		return true;
	}
	/**
	* Deterministic selection hook for fixed-time visual evidence. It is only
	* installed when the performance clock override is present, and still
	* enters the normal handleClick -> exit animation -> connection path.
	*/
	activateApplianceForEvidence(kind) {
		if (!Number.isFinite(window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__)) return false;
		if (this.openingActive || this.openingTransitioning || this.animations.length > 0 || this.randomGameOver) return false;
		const target = this.appliances.targets.find((candidate) => candidate.kind === kind);
		if (!target) return false;
		const arrow = this.arrows.find((candidate) => candidate.state === "idle" && candidate.definition.color === target.accent && this.appliances.canAssignColor(candidate.definition.color) && cableEndsFor(candidate.definition).some((end) => checkCableEndExit(candidate, this.arrows, end).clear));
		if (!arrow || !arrow.samplePoints[0]) return false;
		const end = cableEndsFor(arrow.definition).find((candidateEnd) => checkCableEndExit(arrow, this.arrows, candidateEnd).clear) ?? "head";
		this.camera.updateMatrixWorld(true);
		const projected = (end === "head" ? arrow.samplePoints[arrow.samplePoints.length - 1] : arrow.samplePoints[0]).clone().project(this.camera);
		const rect = this.canvas.getBoundingClientRect();
		const clientX = rect.left + (projected.x + 1) * .5 * rect.width;
		const clientY = rect.top + (1 - projected.y) * .5 * rect.height;
		this.handleClick(clientX, clientY, arrow.definition.id, end);
		const animation = this.animations.find((candidate) => candidate.arrow === arrow && candidate.kind === "exit");
		if (animation) {
			animation.elapsed = animation.duration;
			animation.wallClockStartedAtSeconds = null;
			this.updateAnimations(0, performance.now() * .001);
		}
		return arrow.state !== "idle" || this.animations.some((animation) => animation.arrow === arrow);
	}
	pullCableForEvidence(id, end = "head") {
		if (this.openingActive || this.openingTransitioning || this.animations.length > 0 || this.randomGameOver) return false;
		this.refreshAvailability(false);
		const choice = id ? this.availableChoices.find(({ arrow, end: choiceEnd }) => arrow.definition.id === id && choiceEnd === end) ?? this.availableChoices.find(({ arrow }) => arrow.definition.id === id) : void 0;
		const forcedChoice = id ? this.arrows.find((arrow) => arrow.definition.id === id && arrow.state === "idle") : void 0;
		const selected = choice ?? (forcedChoice ? {
			arrow: forcedChoice,
			end
		} : void 0) ?? this.availableChoices[0];
		if (!selected) return false;
		this.handleClick(0, 0, selected.arrow.definition.id, selected.end);
		const animation = this.animations.find((candidate) => candidate.arrow === selected.arrow && candidate.kind === "exit");
		if (Number.isFinite(window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__) && animation) {
			this.publishDiagnostics();
			animation.elapsed = animation.duration;
			animation.wallClockStartedAtSeconds = null;
			this.updateAnimations(0, performance.now() * .001);
		}
		return selected.arrow.state !== "idle" || this.animations.some((candidate) => candidate.arrow === selected.arrow);
	}
	activateRushCableForEvidence(id) {
		if (!Number.isFinite(window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__)) return false;
		if (this.currentMode !== "rush" || this.rushRound?.phase !== "running" || this.animations.length > 0) return false;
		const arrow = this.arrows.find((candidate) => candidate.definition.id === id && candidate.state === "idle");
		if (!arrow) return false;
		const end = cableEndsFor(arrow.definition).find((candidateEnd) => checkCableEndExit(arrow, this.arrows, candidateEnd).clear);
		if (!end) return false;
		this.handleClick(0, 0, arrow.definition.id, end);
		const animation = this.animations.find((candidate) => candidate.arrow === arrow && candidate.kind === "exit");
		if (!animation) return false;
		const nowSeconds = performance.now() * .001;
		animation.elapsed = animation.duration;
		animation.wallClockStartedAtSeconds = null;
		this.updateAnimations(0, nowSeconds);
		return arrow.state === "removed";
	}
	showSkillPresentationForEvidence(skill) {
		if (!Number.isFinite(window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__) || this.openingActive) return false;
		const availableIds = [...new Set(this.availableChoices.map(({ arrow }) => arrow.definition.id))];
		const targetCableIds = skill === "rice-cooker" ? this.arrows.filter((arrow) => arrow.state !== "removed").map((arrow) => arrow.definition.id) : skill === "radio" ? this.skillEngine ? this.createSkillContext().removalSequence.slice(0, 3) : availableIds.slice(0, 3) : availableIds;
		if (targetCableIds.length === 0) return false;
		const resolution = {
			skillId: skill === "radio" ? "route-broadcast" : skill === "robot-vacuum" ? "snapshot-sweep" : "rice-thick-cable",
			appliance: skill,
			label: skill,
			targetCableIds,
			commands: [],
			requiresSelection: null,
			topologyChanged: skill === "robot-vacuum",
			presentation: {
				cue: "evidence",
				commit: "evidence",
				settle: "evidence",
				assetIds: []
			}
		};
		this.skillPresentation.reset();
		this.skillEffects.reset();
		this.bubbleShield.reset();
		this.soundWaveShield.reset();
		this.dehumidifierDryShield.reset();
		this.portableSpeakerSpacing.reset(this.getPortableSpeakerSpacingTargets());
		this.arrowRoot.visible = true;
		this.skillEvidenceVisible = true;
		this.skillPresentation.root.visible = true;
		const evidenceCount = skill === "radio" ? 3 : skill === "robot-vacuum" ? targetCableIds.length : Math.min(5, targetCableIds.length);
		const evidencePositions = Array.from({ length: evidenceCount }, (_, index) => {
			const columns = Math.min(3, evidenceCount);
			const row = Math.floor(index / columns);
			const column = index % columns;
			const x = columns === 1 ? 0 : (column / (columns - 1) - .5) * 2.5;
			const y = .8 - row * .9;
			return this.camera.localToWorld(new Vector3(x, y, -4.2));
		});
		if (skill === "robot-vacuum") {
			this.skillAutoRemovalEnds.clear();
			const snapshotEnds = availableCableEnds(this.arrows);
			targetCableIds.forEach((id) => {
				const snapshot = snapshotEnds.find((candidate) => candidate.id === id);
				if (snapshot) this.skillAutoRemovalEnds.set(id, snapshot.end);
			});
		}
		const evidenceTargets = evidencePositions.map((position, index) => {
			return {
				cableId: targetCableIds[index] ?? `evidence-${index + 1}`,
				position,
				path: skill === "rice-cooker" ? [
					position.clone().add(new Vector3(-.65, -.18, 0)),
					position.clone().add(new Vector3(0, .2, 0)),
					position.clone().add(new Vector3(.65, -.18, 0))
				] : void 0
			};
		});
		const duration = this.skillPresentation.play(resolution, evidenceTargets);
		this.skillPresentation.render();
		this.publishDiagnostics();
		const cleanupEvidence = () => {
			const presentation = this.skillPresentation.diagnostics;
			const sequencePending = skill === "robot-vacuum" && presentation.autoRemovalOrder.length < presentation.targetCount;
			const exitsPending = skill === "robot-vacuum" && this.animations.some((animation) => animation.autoCommitted);
			if (sequencePending || exitsPending) {
				this.skillEvidenceCleanupTimer = window.setTimeout(cleanupEvidence, 100);
				return;
			}
			this.skillPresentation.complete();
			this.skillEvidenceVisible = false;
			if (skill === "rice-cooker") for (const model of this.models.values()) model.setVisualThickness(1);
			this.publishDiagnostics();
		};
		this.skillEvidenceCleanupTimer = window.setTimeout(cleanupEvidence, duration + 80);
		return true;
	}
	freezeSkillPresentationForEvidence(timeMs) {
		const frozen = this.skillPresentation.freezeForEvidence(timeMs);
		if (frozen) {
			this.skillPresentation.render();
			this.publishDiagnostics();
		}
		return frozen;
	}
	handleClick(clientX, clientY, forcedArrowId, forcedEnd = "head", touch = false) {
		if (this.openingActive || this.openingTransitioning || this.animations.some((animation) => animation.kind === "bump") || this.randomGameOver || this.currentMode === "rush" && this.rushRound?.phase !== "running" || this.doubleEndedUi.briefingVisible || this.currentMode === "skill" && this.skillInputLocked && this.skillEngine?.state.phase !== "select-recycle-target") return;
		const picked = forcedArrowId ? {
			id: forcedArrowId,
			end: forcedEnd
		} : this.pickArrow(clientX, clientY, touch);
		if (!picked) return;
		const arrow = this.arrows.find((entry) => entry.definition.id === picked.id);
		const model = this.models.get(picked.id);
		if (!arrow || !model || arrow.state !== "idle") return;
		if (this.currentMode === "skill" && this.skillEngine?.state.phase === "select-recycle-target") {
			this.commitSkillRecycleSelection(arrow);
			return;
		}
		const fakePlug = this.currentMode === "skill" && picked.end === "tail" && this.skillEngine?.getFakePlugCableIds().includes(arrow.definition.id);
		const frozen = this.currentMode === "skill" && this.skillEngine?.getFrozenCableIds().includes(arrow.definition.id);
		const result = fakePlug || frozen ? {
			clear: false,
			blockerId: arrow.definition.id,
			contact: null
		} : checkCableEndExit(arrow, this.arrows, picked.end);
		const direction = DIRECTION_VECTORS[cableEndDirection(arrow.definition, picked.end)].clone();
		this.setHovered(null);
		if (result.clear) {
			const target = this.currentMode === "rush" ? null : this.appliances.reserveAssignment(arrow.definition.id, arrow.definition.color);
			const queueAfterExit = this.currentMode !== "rush" && this.currentMode !== "skill" && !target && this.appliances.canQueueColor(arrow.definition.color);
			if (this.currentMode !== "rush" && !target && !queueAfterExit) return;
			if (this.currentMode === "skill") {
				const wasLastCableAtPullStart = this.arrows.length - this.removedCount === 1;
				if (!target) return;
				if (!this.skillEngine?.beginManualPull(arrow.definition.id, target.kind, wasLastCableAtPullStart)) {
					this.appliances.releaseAssignment(arrow.definition.id, target);
					return;
				}
				this.setSkillInputLocked(true);
			}
			arrow.state = "moving";
			if (this.activeHint?.id === picked.id && this.activeHint.end === picked.end) this.clearActiveHint();
			model.setAvailableEnds([]);
			this.animations.push({
				arrow,
				model,
				kind: "exit",
				target,
				queueAfterExit,
				elapsed: 0,
				wallClockStartedAtSeconds: this.currentMode === "rush" ? performance.now() * .001 : null,
				duration: this.currentMode === "rush" ? Math.min(.9, .48 + model.pathLength * .04) : Math.min(1.5, .66 + model.pathLength * .065),
				direction,
				end: picked.end
			});
			this.hud.flash(t("flash.moving"));
		} else {
			arrow.state = "bumping";
			this.animations.push({
				arrow,
				model,
				kind: "bump",
				target: null,
				queueAfterExit: false,
				elapsed: 0,
				wallClockStartedAtSeconds: this.currentMode === "rush" ? performance.now() * .001 : null,
				duration: .38,
				direction,
				end: picked.end
			});
			if (result.contact) this.petals.burst(result.contact, direction.clone().negate());
			this.hud.showBlocked();
			if (result.blockerId) this.revealBlockingCable(result.blockerId);
			this.audio.playInteraction("blocked");
			if (this.currentMode === "random") this.loseRandomLife();
			if (this.currentMode === "skill") {
				const impactPosition = result.contact ?? model.getHeadWorldPosition(new Vector3(), picked.end);
				this.handleSkillBlockedAttempt(Boolean(fakePlug), impactPosition);
			}
			if (this.currentMode === "rush") this.rushRound?.recordMistake();
		}
	}
	revealBlockingCable(blockerId) {
		window.clearTimeout(this.blockedRevealTimer);
		const blocker = this.models.get(blockerId);
		if (!blocker) return;
		blocker.setHovered(true, void 0, this.theme.snapshot.progress);
		this.blockedRevealTimer = window.setTimeout(() => {
			if (this.hoveredId !== blockerId) blocker.setHovered(false);
		}, 720);
	}
	loseRandomLife() {
		if (this.randomGameOver || this.currentMode !== "random") return;
		this.randomLives = Math.max(0, this.randomLives - 1);
		this.hud.setRandomLives(true, this.randomLives);
		this.hud.showLifeLost(this.randomLives);
		if (this.randomLives > 0) return;
		this.randomGameOver = true;
		this.setHovered(null);
		this.hud.showGameOver();
		this.audio.playInteraction("failed");
	}
	setSkillInputLocked(locked, selectionMode = false) {
		this.skillInputLocked = locked;
		this.skillUi.setInputLocked(locked);
		this.orbit.setEnabled(!locked || selectionMode);
		this.orbit.setClickOnly(false);
		this.appliances.setInteractionEnabled(!locked);
		if (locked) this.setHovered(null);
	}
	handleSkillBlockedAttempt(fakePlug, impactPosition) {
		const wasSoundWaveProtected = this.skillEngine?.state.buff?.id === "soothing-record";
		const result = this.skillEngine?.handleBlockedAttempt(fakePlug);
		if (!result || !this.skillEngine) return;
		this.randomLives = result.lives;
		this.hud.setRandomLives(true, result.lives, this.skillEngine.state.maxLives);
		this.skillUi.render(this.skillEngine.state);
		this.syncSkillPresentation();
		if (result.protected) {
			if (wasSoundWaveProtected) this.soundWaveShield.playImpact(impactPosition);
			this.hud.flash("防护状态抵挡了这次错误");
			return;
		}
		if (result.revived) {
			this.hud.flash("CONTINUE：已恢复生命");
			return;
		}
		this.hud.showLifeLost(result.lives);
		if (!result.failed) return;
		this.randomGameOver = true;
		this.hud.showGameOver();
		this.audio.playInteraction("failed");
	}
	showSkillDamageFeedback(event) {
		this.randomLives = event.lives;
		this.hud.setRandomLives(true, event.lives, this.skillEngine?.state.maxLives ?? 3);
		if (event.revived) {
			this.hud.flash("微波炉超时：CONTINUE 已恢复生命", true);
			return;
		}
		this.hud.showLifeLost(event.lives);
		this.skillUi.setCuePhase("commit", "超时：生命 -1");
	}
	describeBuffFallback(fallback) {
		if (!fallback) return "现有 BUFF 继续生效，本次技能不会覆盖或打断它。";
		if (fallback.type === "extend-buff") return "现有 BUFF 保留，本次技能转换为延长 1 回合。";
		if (fallback.type === "upgrade-continue") return "现有 CONTINUE 保留，本次技能转换为复活恢复量 +1。";
		if (fallback.type === "add-shield-charge") return "现有护盾保留，本次技能转换为额外抵挡 1 次误点。";
		return fallback.amount > 0 ? "现有 BUFF 保留，本次技能转换为恢复 1 格生命。" : "生命已满，现有 BUFF 继续保留。";
	}
	createSkillContext() {
		const remaining = this.arrows.filter((arrow) => arrow.state !== "removed" && arrow.state !== "moving");
		const physicallyAvailable = new Set(availableCableEnds(remaining).map(({ id }) => id));
		const frozen = new Set(this.skillEngine?.getFrozenCableIds() ?? []);
		const fake = new Set(this.skillEngine?.getFakePlugCableIds() ?? []);
		const definitions = remaining.map((arrow) => arrow.definition);
		const resolveRemovalSequence = () => this.getSkillRemovalSequence(definitions);
		return {
			remainingCables: remaining.map((arrow) => ({
				id: arrow.definition.id,
				color: arrow.definition.color,
				available: physicallyAvailable.has(arrow.definition.id) && !frozen.has(arrow.definition.id),
				fakePlug: fake.has(arrow.definition.id)
			})),
			availableCableIds: [...physicallyAvailable].filter((id) => !frozen.has(id)),
			get removalSequence() {
				return resolveRemovalSequence();
			},
			routeColors: [...new Set(this.appliances.targets.map((target) => target.accent))],
			state: this.skillEngine.state
		};
	}
	getSkillRemovalSequence(definitions) {
		const signature = definitions.map((definition) => `${definition.id}:${definition.exitDirection}:${definition.doubleEnded ? 1 : 0}:` + definition.path.map((point) => point.join(",")).join(";")).join("|");
		if (this.skillRemovalSequenceCache?.signature === signature) return this.skillRemovalSequenceCache.sequence;
		const sequence = findRemovalSequence(definitions) ?? [];
		this.skillRemovalSequenceCache = {
			signature,
			sequence
		};
		return sequence;
	}
	resolveSkillConnection(_target, arrow) {
		const engine = this.skillEngine;
		if (!engine) return;
		const desktopComputerHadBuff = _target.kind === "desktop-computer" && engine.state.buff !== null;
		const remaining = this.arrows.length - this.removedCount;
		const context = this.createSkillContext();
		const outcome = engine.resolveConnected(context, remaining === 0);
		engine.consumeDryShieldBlock();
		this.pendingDryShieldAbsorb = outcome.blockedByDryShield;
		const resolution = outcome.resolution;
		let presentationDuration;
		if (outcome.coffeeBlocked && engine.state.debuff?.id === "coffee-lock" && engine.state.debuff.turnsRemaining === 0) this.coffeeLockExitTarget = _target;
		if (outcome.damage) this.showSkillDamageFeedback(outcome.damage);
		presentationDuration = this.playApplianceConnectionVisual(_target, resolution, desktopComputerHadBuff, engine.state.currentLives);
		if (resolution) {
			if (resolution.appliance === "radio") this.radioRouteCableIds = [...resolution.targetCableIds];
			presentationDuration = Math.max(presentationDuration ?? 0, this.playSkillPresentation(resolution, _target) ?? 0);
			if (resolution.appliance === "refrigerator") this.refrigeratorFreeze.activate(resolution.targetCableIds);
			this.skillTransientHighlights.clear();
			if (!this.isDedicatedSkillPresentation(resolution) && resolution.appliance !== "popcorn-machine") resolution.targetCableIds.forEach((id) => this.skillTransientHighlights.add(id));
			const definition = APPLIANCE_SKILL_REGISTRY.get(resolution.appliance);
			this.skillUi.showCue(resolution.label, "cue", outcome.buffPreserved ? this.describeBuffFallback(outcome.buffFallback) : definition?.description ?? "", _target.label);
			this.beginFanSteamClear(resolution, _target);
			this.applySkillCommands(resolution.commands, resolution.appliance, _target);
			const commitCueDelay = resolution.appliance === "blender" ? 4680 : resolution.appliance === "desktop-computer" ? 3720 : resolution.appliance === "stand-mixer" ? 820 : resolution.appliance === "hair-dryer" && resolution.commands.some((command) => command.type === "recolor") ? 2040 : 220;
			this.queueSkillCommitCue(resolution.appliance === "stand-mixer" ? "限回合状态统一为 2" : "效果生效", commitCueDelay);
		} else if (outcome.blockedByDryShield) {
			this.skillUi.showCue("干燥护罩吸收", "cue", "本次负面技能已被护罩抵挡。", _target.label);
			this.queueSkillCommitCue("已吸收");
		} else if (outcome.debuffSuppressed) {
			this.skillUi.showCue("干扰相互抵消", "cue", "已有 DEBUFF 继续生效，本次新干扰不会覆盖或叠加。", _target.label);
			this.queueSkillCommitCue("本次干扰失效");
		} else if (outcome.coffeeBlocked) {
			this.skillUi.showCue("技能被封锁", "cue", "咖啡封技生效中，本次家电技能不会发动。", _target.label);
			this.queueSkillCommitCue("已阻止");
		} else {
			const definition = APPLIANCE_SKILL_REGISTRY.get(_target.kind);
			const isLastCable = remaining === 0;
			this.skillUi.showCue(isLastCable ? "最后一根线" : "技能未发动", "cue", isLastCable ? "挑战收尾连接不触发家电技能。" : `当前条件不满足：${definition?.description ?? "本次没有可结算效果。"}`, _target.label);
			this.queueSkillCommitCue(isLastCable ? "挑战收尾" : "无效果");
		}
		if (resolution?.appliance !== "desktop-computer") this.syncSkillState();
		if (resolution?.appliance === "stand-mixer") this.skillUi.showStatusNormalized(2);
		if (engine.state.phase === "select-card") {
			this.skillUi.showCards(engine.cards);
			this.setSkillInputLocked(true);
			return;
		}
		if (engine.state.phase === "select-recycle-target") {
			this.beginSkillRecycleSelection();
			return;
		}
		this.finishSkillResolution(resolution?.topologyChanged ?? false, presentationDuration, resolution?.appliance !== "desktop-computer");
	}
	isDedicatedSkillPresentation(resolution) {
		return resolution.appliance === "radio" || resolution.appliance === "robot-vacuum" || resolution.appliance === "rice-cooker" || resolution.appliance === "blender" || resolution.appliance === "stand-mixer" || resolution.appliance === "toaster" || resolution.appliance === "refrigerator" || resolution.appliance === "kettle" || resolution.appliance === "washer" || resolution.appliance === "portable-speaker" || resolution.appliance === "hair-dryer";
	}
	playApplianceConnectionVisual(target, resolution, desktopComputerHadBuff, desktopComputerLivesAfter) {
		const visibleCableRoots = this.arrows.filter((arrow) => arrow.state !== "removed").map((arrow) => this.models.get(arrow.definition.id)?.root).filter((root) => Boolean(root?.visible));
		const buff = this.skillEngine?.state.buff;
		const policy = skillConnectionVisualPolicy(target.kind);
		switch (policy.shield) {
			case "bubble":
				this.bubbleShield.retrigger(visibleCableRoots);
				return 1050;
			case "sound-wave":
				this.soundWaveShield.retrigger(visibleCableRoots, buff?.id === "soothing-record");
				return POWERED_ACTIVE_DURATION * 1e3;
			case "dry-air":
				this.dehumidifierDryShield.retrigger(buff?.id === "dry-shield" ? buff.turnsRemaining : null, visibleCableRoots, target.root.getWorldPosition(new Vector3()), buff?.id === "dry-shield");
				return POWERED_ACTIVE_DURATION * 1e3;
		}
		switch (policy.screenEffect) {
			case "blue-screen":
				this.beginDesktopComputerFeedback(desktopComputerHadBuff, desktopComputerLivesAfter, resolution?.appliance === "desktop-computer");
				return POWERED_ACTIVE_DURATION * 1e3;
			case "coffee-lock":
				this.skillTransientScreenEffect = "coffee-lock";
				this.beginCoffeeSplash();
				return POWERED_ACTIVE_DURATION * 1e3;
			case "bathroom-steam":
				this.skillTransientScreenEffect = "bathroom-steam";
				this.beginHumidifierSteamReveal(target);
				return POWERED_ACTIVE_DURATION * 1e3;
			case "microwave-heat":
				this.beginMicrowaveHeatFeedback();
				return POWERED_ACTIVE_DURATION * 1e3;
			case "printer-scan":
				this.skillTransientScreenEffect = "printer-scan";
				this.pipeline.setSkillEffect("printer-scan", true);
				return printerSkillLockDurationMs(window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__);
			case "toaster-heat":
				this.skillTransientScreenEffect = "toaster-heat";
				this.pipeline.setSkillEffect("toaster-heat", true);
				this.pipeline.setSkillEffectProgress(0);
				return POWERED_ACTIVE_DURATION * 1e3;
			case "kettle-thaw-heat":
				this.skillTransientScreenEffect = "kettle-thaw-heat";
				this.pipeline.setSkillEffect("kettle-thaw-heat", true);
				this.pipeline.setSkillEffectProgress(0);
				return POWERED_ACTIVE_DURATION * 1e3;
			case "television-glitch":
				this.skillTransientScreenEffect = "television-glitch";
				this.pipeline.setSkillEffect("television-glitch", true);
				return POWERED_ACTIVE_DURATION * 1e3;
			default: return;
		}
	}
	beginFanSteamClear(resolution, sourceTarget) {
		if (!(resolution.appliance === "fan" && resolution.commands.some((command) => command.type === "clear-status" && command.slot === "debuff" && command.reason === "fan"))) return;
		const fan = sourceTarget?.kind === "fan" ? sourceTarget : this.appliances.targets.find((target) => target.kind === "fan" && target.root.visible);
		this.pipeline.beginSteamClear(fan?.screenPosition.x ?? .1);
	}
	beginHumidifierSteamReveal(sourceTarget) {
		const humidifier = sourceTarget?.kind === "humidifier" ? sourceTarget : this.appliances.targets.find((target) => target.kind === "humidifier" && target.root.visible);
		this.pipeline.beginSteamReveal(humidifier?.screenPosition.x ?? .1, POWERED_ACTIVE_DURATION);
	}
	beginCoffeeSplash() {
		this.coffeeStainElapsed = 0;
		this.coffeeStainStrength = 0;
		this.prepareCoffeeStainProfiles();
		this.pipeline.beginCoffeeSplash();
	}
	prepareCoffeeStainProfiles() {
		this.coffeeStainProfiles.clear();
		const points = this.arrows.flatMap(({ definition }) => definition.path);
		if (points.length === 0) return;
		const minX = Math.min(...points.map(([x]) => x));
		const maxY = Math.max(...points.map(([, y]) => y));
		const minZ = Math.min(...points.map(([, , z]) => z));
		const maxX = Math.max(...points.map(([x]) => x));
		const minY = Math.min(...points.map(([, y]) => y));
		const maxZ = Math.max(...points.map(([, , z]) => z));
		const diagonal = Math.max(1, Math.hypot(maxX - minX, maxY - minY, maxZ - minZ));
		const distanceFromInkCorner = ([x, y, z]) => Math.hypot(x - minX, maxY - y, z - minZ) / diagonal;
		for (const { definition } of this.arrows) {
			const tailDistance = distanceFromInkCorner(definition.path[0]);
			const headDistance = distanceFromInkCorner(definition.path[definition.path.length - 1]);
			const nearestDistance = Math.min(...definition.path.map(distanceFromInkCorner));
			const seed = [...definition.id].reduce((value, character) => Math.imul(value ^ character.charCodeAt(0), 16777619) >>> 0, 2166136261) / 4294967295;
			this.coffeeStainProfiles.set(definition.id, {
				delay: MathUtils.clamp(nearestDistance * .38 + (seed - .5) * .045, 0, .44),
				direction: headDistance <= tailDistance ? 1 : 0
			});
		}
	}
	updateCoffeeStain(delta, elapsed) {
		const coffeeLock = this.skillEngine?.state.debuff?.id === "coffee-lock" ? this.skillEngine.state.debuff : null;
		if (!coffeeLock) return;
		if (this.coffeeStainProfiles.size === 0) this.prepareCoffeeStainProfiles();
		this.coffeeStainElapsed += delta;
		const evidenceProgress = window.__COFFEE_STAIN_PROGRESS_OVERRIDE__;
		const progress = Number.isFinite(evidenceProgress) ? MathUtils.clamp(evidenceProgress, 0, 1) : MathUtils.clamp(this.coffeeStainElapsed / this.coffeeStainDuration, 0, 1);
		const targetStrength = (coffeeLock.turnsRemaining ?? 0) / 3;
		const blend = 1 - Math.exp(-delta * 2.8);
		this.coffeeStainStrength = MathUtils.lerp(this.coffeeStainStrength, targetStrength, blend);
		for (const [id, model] of this.models) {
			const profile = this.coffeeStainProfiles.get(id) ?? {
				delay: 0,
				direction: 0
			};
			const localProgress = MathUtils.clamp((progress - profile.delay) / Math.max(.001, 1 - profile.delay), 0, 1);
			const reveal = localProgress * localProgress * (3 - 2 * localProgress);
			model.setCoffeeStain(this.coffeeStainStrength, reveal, elapsed, profile.direction);
		}
	}
	playSkillPresentation(resolution, sourceTarget) {
		if (resolution.appliance === "portable-speaker") return this.portableSpeakerSpacing.start(this.getPortableSpeakerSpacingTargets());
		if (resolution.appliance === "kettle") {
			const frozenCableIds = this.skillEngine?.state.debuff?.id === "frozen-plug" ? [...this.skillEngine.state.debuff.targetCableIds] : [...this.refrigeratorFreeze.diagnostics.targetCableIds];
			const kettle = sourceTarget?.kind === "kettle" ? sourceTarget : this.appliances.targets.find((target) => target.kind === "kettle" && target.state === "active");
			const getTimelineElapsed = kettle ? () => kettle.getActiveElapsed() : void 0;
			this.refrigeratorFreeze.beginThaw(KETTLE_THAW_DURATION, getTimelineElapsed);
			return this.kettleThaw.start({
				targetCableIds: frozenCableIds,
				getTimelineElapsed
			});
		}
		if (resolution.appliance === "hair-dryer" && resolution.commands.some((command) => command.type === "clear-status" && command.slot === "debuff" && command.reason === "hair-dryer")) this.refrigeratorFreeze.beginThaw(2.4);
		const targets = (resolution.appliance === "rice-cooker" || resolution.appliance === "stand-mixer" ? this.arrows.filter((candidate) => candidate.state !== "removed").map((candidate) => candidate.definition.id) : resolution.appliance === "blender" ? resolution.commands.flatMap((command) => command.type === "recolor" ? command.changes.map(({ cableId }) => cableId) : []) : resolution.targetCableIds).map((id) => {
			const model = this.models.get(id);
			const arrow = this.arrows.find((candidate) => candidate.definition.id === id);
			if (!model) return null;
			return {
				cableId: id,
				position: model.getHeadWorldPosition(new Vector3()),
				path: resolution.appliance === "rice-cooker" || resolution.appliance === "stand-mixer" ? arrow?.samplePoints.map((point) => point.clone()) : void 0
			};
		}).filter((target) => Boolean(target));
		if (this.isDedicatedSkillPresentation(resolution)) {
			if (resolution.appliance === "refrigerator") return POWERED_ACTIVE_DURATION * 1e3;
			if (resolution.appliance === "robot-vacuum") {
				this.skillAutoRemovalEnds.clear();
				const snapshotEnds = availableCableEnds(this.arrows);
				resolution.targetCableIds.forEach((id) => {
					const snapshot = snapshotEnds.find((candidate) => candidate.id === id);
					if (snapshot) this.skillAutoRemovalEnds.set(id, snapshot.end);
				});
			}
			if (resolution.appliance === "washer") {
				this.pendingWasherFlingRemovals = [];
				this.washerFlingHistory = [];
				const snapshotEnds = availableCableEnds(this.arrows);
				resolution.targetCableIds.forEach((id) => {
					const snapshot = snapshotEnds.find((candidate) => candidate.id === id);
					if (snapshot) this.skillAutoRemovalEnds.set(id, snapshot.end);
				});
				return this.washerSpin.start({
					cableRoot: this.arrowRoot,
					camera: this.camera,
					arrows: this.arrows,
					models: this.models,
					targetIds: resolution.targetCableIds,
					onLaunch: (cableId, launch) => this.animateSkillAutoRemoval(cableId, true, launch)
				});
			}
			return this.skillPresentation.play(resolution, targets);
		}
		this.skillEffects.play(resolution.appliance, targets.map((target) => target.position));
		return resolution.appliance === "television" || resolution.appliance === "toaster" || resolution.appliance === "refrigerator" || resolution.appliance === "desktop-computer" ? POWERED_ACTIVE_DURATION * 1e3 : resolution.appliance === "printer" ? printerSkillLockDurationMs(window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__) : void 0;
	}
	applySkillCommands(commands, source, sourceTarget) {
		let availabilityChanged = false;
		for (const command of commands) switch (command.type) {
			case "auto-remove":
				if (source !== "robot-vacuum" && command.source !== "robot-vacuum" && source !== "washer" && command.source !== "washer") {
					command.cableIds.forEach((id) => this.commitSkillAutoRemoval(id));
					availabilityChanged = true;
				}
				break;
			case "recolor":
				if (source !== "blender" && source !== "hair-dryer") {
					this.applySkillRecolors(command.changes);
					availabilityChanged = true;
				}
				break;
			case "reconstruct":
				if (source === "television") this.beginTelevisionReconstruction(command.cableIds, sourceTarget);
				else this.applySkillTopologyMutation(command.cableIds, "reconstruct");
				availabilityChanged = true;
				break;
			case "swap-ends":
				if (source === "toaster") this.beginToasterEndSwap(command.cableIds, sourceTarget);
				else this.applySkillTopologyMutation(command.cableIds, "swap-ends");
				availabilityChanged = true;
				break;
			case "expand":
				this.applySkillTopologyMutation(command.cableIds, "expand");
				availabilityChanged = true;
				break;
			case "fake-plugs":
				if (this.skillEngine?.state.debuff?.id === "fake-double-plug") {
					command.cableIds.forEach((id) => this.models.get(id)?.setFakeTailPlug(true));
					availabilityChanged = true;
				}
				break;
			case "freeze": availabilityChanged = true;
		}
		if (source === "game-controller" && commands.some((command) => command.type === "grant-continue")) {
			const continueBuff = this.skillEngine?.state.buff;
			if (continueBuff?.id === "continue") this.hud.showContinueGranted(Number(continueBuff.payload.restoreLives ?? 1));
		}
		if (availabilityChanged) {
			this.appliances.setRequiredColors(this.arrows.filter((arrow) => arrow.state !== "removed").map((arrow) => arrow.definition.color));
			this.refreshAvailability(false);
		}
	}
	applySkillRecolors(changes) {
		const replacements = /* @__PURE__ */ new Map();
		changes.forEach(({ cableId, color }) => {
			const arrow = this.arrows.find((candidate) => candidate.definition.id === cableId && candidate.state === "idle");
			if (arrow) replacements.set(cableId, {
				...arrow.definition,
				color
			});
		});
		this.commitSkillDefinitions(replacements, false);
	}
	applySkillTopologyMutation(cableIds, kind) {
		const replacements = this.buildSkillTopologyReplacements(cableIds, kind);
		this.commitSkillDefinitions(replacements, true);
	}
	buildSkillTopologyReplacements(cableIds, kind) {
		const remaining = this.arrows.filter((arrow) => arrow.state !== "removed");
		if (kind === "reconstruct") return buildTelevisionSpatialReplacements(remaining.map((arrow) => arrow.definition), cableIds);
		const replacements = /* @__PURE__ */ new Map();
		for (const id of cableIds) {
			const arrow = remaining.find((candidate) => candidate.definition.id === id && candidate.state === "idle");
			if (!arrow) continue;
			const definition = arrow.definition;
			if (kind === "swap-ends") {
				const candidate = reverseCableKeepingExternalEndpoints(definition);
				if (skillTopologyDefinitionsAreCommitSafe(remaining.map((entry) => entry === arrow ? candidate : replacements.get(entry.definition.id) ?? entry.definition))) replacements.set(id, candidate);
				continue;
			}
			const directions = Object.keys(DIRECTION_VECTORS);
			const currentIndex = directions.indexOf(definition.exitDirection);
			for (let offset = 1; offset <= directions.length; offset += 1) {
				const exitDirection = directions[(currentIndex + offset) % directions.length];
				const candidate = {
					...definition,
					exitDirection
				};
				const trial = remaining.map((entry) => entry === arrow ? candidate : replacements.get(entry.definition.id) ?? entry.definition);
				const trialRuntimes = trial.map(makeRuntime);
				const targetRuntime = trialRuntimes.find((runtime) => runtime.definition.id === id);
				if (targetRuntime && skillTopologyDefinitionsAreCommitSafe(trial) && checkCableEndExit(targetRuntime, trialRuntimes, "head").clear) {
					replacements.set(id, candidate);
					break;
				}
			}
		}
		return replacements;
	}
	beginTelevisionReconstruction(cableIds, sourceTarget) {
		const replacements = this.buildSkillTopologyReplacements(cableIds, "reconstruct");
		if (replacements.size === 0) return;
		const television = sourceTarget?.kind === "television" ? sourceTarget : this.appliances.targets.find((target) => target.kind === "television" && target.state === "active");
		this.televisionReconstruction.start({
			replacements,
			existingModels: this.models,
			getPlugStyle: (color) => this.appliances.getPlugStyleForColor(color),
			getTimelineElapsed: television ? () => television.getActiveElapsed() : void 0,
			televisionRoot: television?.root.getObjectByName("appliance-model-television") ?? null,
			commit: () => {
				const committed = this.commitSkillDefinitions(replacements, true);
				this.refreshAvailability(false);
				return committed;
			}
		});
		this.renderer.compileAsync(this.televisionReconstruction.root, this.camera, this.scene);
	}
	beginToasterEndSwap(cableIds, sourceTarget) {
		const replacements = this.buildSkillTopologyReplacements(cableIds, "swap-ends");
		if (replacements.size === 0) return;
		const toaster = sourceTarget?.kind === "toaster" ? sourceTarget : this.appliances.targets.find((target) => target.kind === "toaster" && target.state === "active");
		this.toasterHeatSwap.start({
			replacements,
			existingModels: this.models,
			getPlugStyle: (color) => this.appliances.getPlugStyleForColor(color),
			getTimelineElapsed: toaster ? () => toaster.getActiveElapsed() : void 0,
			commit: () => {
				const committed = this.commitSkillDefinitions(replacements, true);
				this.refreshAvailability(false);
				return committed;
			}
		});
		this.renderer.compileAsync(this.toasterHeatSwap.root, this.camera, this.scene);
	}
	commitSkillDefinitions(replacements, requireSolvable) {
		if (replacements.size === 0) return false;
		const remainingDefinitions = this.arrows.filter((arrow) => arrow.state !== "removed").map((arrow) => replacements.get(arrow.definition.id) ?? arrow.definition);
		if (requireSolvable && !skillTopologyDefinitionsAreCommitSafe(remainingDefinitions)) return false;
		for (let index = 0; index < this.arrows.length; index += 1) {
			const arrow = this.arrows[index];
			const next = replacements.get(arrow.definition.id);
			if (!next || arrow.state === "removed") continue;
			const replacement = makeRuntime(next);
			replacement.state = arrow.state;
			this.arrows[index] = replacement;
			this.models.get(next.id)?.dispose();
			const model = new PlugCableModel(next, this.appliances.getPlugStyleForColor(next.color));
			model.setVisualThickness(this.skillEngine?.state.debuff?.id === "rice-thick-cable" ? 1.5 : 1);
			this.models.set(next.id, model);
			this.arrowRoot.add(model.root);
		}
		return true;
	}
	commitSkillAutoRemoval(cableId) {
		const arrow = this.arrows.find((candidate) => candidate.definition.id === cableId && candidate.state === "idle");
		const model = this.models.get(cableId);
		if (!arrow || !model) return false;
		const origin = arrow.samplePoints[arrow.samplePoints.length - 1] ?? new Vector3();
		this.petals.burst(origin, new Vector3(0, .8, .2), 20);
		model.root.visible = false;
		this.completeRemoval(arrow);
		this.skillEngine?.notifyAutoRemoved(cableId, this.arrows.length - this.removedCount > 0);
		return true;
	}
	animateSkillAutoRemoval(cableId, washerFling = false, washerLaunch, followNormalPull = false) {
		const arrow = this.arrows.find((candidate) => candidate.definition.id === cableId && candidate.state === "idle");
		const model = this.models.get(cableId);
		if (!arrow || !model) return false;
		const end = this.skillAutoRemovalEnds.get(cableId) ?? "head";
		arrow.state = "moving";
		model.setAvailableEnds([]);
		let originPosition;
		let originQuaternion;
		let originScale;
		if (washerFling) {
			model.root.updateWorldMatrix(true, false);
			originPosition = model.root.getWorldPosition(new Vector3());
			originQuaternion = model.root.getWorldQuaternion(new Quaternion());
			originScale = model.root.getWorldScale(new Vector3());
			this.scene.attach(model.root);
			model.root.position.copy(originPosition);
			model.root.quaternion.copy(originQuaternion);
			model.root.scale.copy(originScale);
		}
		this.animations.push({
			arrow,
			model,
			kind: washerFling ? "skill-fling" : "exit",
			target: null,
			queueAfterExit: false,
			elapsed: 0,
			wallClockStartedAtSeconds: null,
			duration: washerFling ? 2.35 : followNormalPull ? Math.min(1.5, .66 + model.pathLength * .065) : Math.min(.62, .4 + model.pathLength * .025),
			direction: washerFling ? washerLaunch?.directionWorld.clone().normalize() ?? new Vector3(1, 0, 0) : DIRECTION_VECTORS[cableEndDirection(arrow.definition, end)].clone(),
			end,
			autoCommitted: true,
			originPosition,
			originQuaternion,
			originScale,
			bundleCenterWorld: washerFling ? washerLaunch?.bundleCenterWorld.clone() : void 0,
			flightAngularVelocity: washerFling ? this.getWasherFlightAngularVelocity(cableId) : void 0
		});
		return true;
	}
	triggerPrinterCopyAutoRemoval() {
		const context = this.createSkillContext();
		const cableId = pickPrinterCopyCableId(context);
		if (!cableId) return;
		const availableEnd = availableCableEnds(this.arrows).find((candidate) => candidate.id === cableId);
		if (availableEnd) this.skillAutoRemovalEnds.set(cableId, availableEnd.end);
		if (!this.animateSkillAutoRemoval(cableId, false, void 0, true)) return;
		this.skillTransientScreenEffect = "printer-scan";
		this.pipeline.setSkillEffect("printer-scan");
		this.skillUi.showCue("复印抽线", "commit", "正确线离开线组时，复印线立即跟随抽出；它不会连接家电。", "打印机");
		this.publishDiagnostics();
	}
	getWasherFlightAngularVelocity(cableId) {
		let hash = 0;
		for (let index = 0; index < cableId.length; index += 1) hash = hash * 31 + cableId.charCodeAt(index) >>> 0;
		const sign = (hash & 1) === 0 ? 1 : -1;
		return new Vector3(sign * (3.4 + (hash >>> 3) % 17 / 10), -sign * (4.1 + (hash >>> 8) % 19 / 10), sign * (2.8 + (hash >>> 13) % 23 / 10));
	}
	handleSkillCardSelected(index) {
		if (this.currentMode !== "skill" || !this.skillEngine) return;
		const desktopComputerHadBuff = this.skillEngine.state.buff !== null;
		const resolution = this.skillEngine.selectCard(index, this.createSkillContext());
		const blockedByDryShield = this.skillEngine.consumeDryShieldBlock();
		this.skillUi.hideCards();
		if (!resolution) {
			this.pendingDryShieldAbsorb = blockedByDryShield;
			if (blockedByDryShield) {
				this.skillUi.showCue("干燥护罩吸收", "cue", "选中的负面技能已被护罩抵挡。", "扭蛋技能选定");
				this.queueSkillCommitCue("已吸收");
			}
			this.finishSkillResolution(false);
			return;
		}
		this.skillTransientHighlights.clear();
		const presentationDuration = this.playSkillPresentation(resolution);
		if (resolution.appliance === "refrigerator") this.refrigeratorFreeze.activate(resolution.targetCableIds);
		if (resolution.appliance === "radio") this.radioRouteCableIds = [...resolution.targetCableIds];
		this.skillTransientScreenEffect = resolution.appliance === "television" ? "television-glitch" : resolution.appliance === "toaster" ? "toaster-heat" : resolution.appliance === "kettle" ? "kettle-thaw-heat" : resolution.appliance === "microwave" ? "microwave-heat" : resolution.appliance === "printer" ? "printer-scan" : resolution.appliance === "desktop-computer" ? "blue-screen" : "none";
		if (resolution.appliance === "microwave") this.beginMicrowaveHeatFeedback();
		if (resolution.appliance === "desktop-computer") this.beginDesktopComputerFeedback(desktopComputerHadBuff, this.skillEngine.state.currentLives);
		if (!this.isDedicatedSkillPresentation(resolution) && resolution.appliance !== "popcorn-machine") resolution.targetCableIds.forEach((id) => this.skillTransientHighlights.add(id));
		const definition = APPLIANCE_SKILL_REGISTRY.get(resolution.appliance);
		this.skillUi.showCue(resolution.label, "cue", definition?.description ?? "", "扭蛋技能选定");
		this.queueSkillCommitCue("效果生效", resolution.appliance === "blender" ? 4680 : resolution.appliance === "desktop-computer" ? 3720 : 220);
		this.beginFanSteamClear(resolution);
		if (resolution.appliance === "humidifier") this.beginHumidifierSteamReveal();
		if (resolution.appliance === "coffee-maker") this.beginCoffeeSplash();
		this.applySkillCommands(resolution.commands, resolution.appliance);
		if (resolution.appliance !== "desktop-computer") this.syncSkillState();
		if (this.skillEngine.state.phase === "select-recycle-target") {
			this.beginSkillRecycleSelection();
			return;
		}
		this.finishSkillResolution(resolution.topologyChanged, presentationDuration, true);
	}
	beginSkillRecycleSelection() {
		window.clearTimeout(this.skillRecycleSelectionTimer);
		for (const model of this.models.values()) model.setRecycleSelectionState("none");
		this.skillUi.hideCards();
		this.skillUi.setRecycleSelection(true);
		this.setSkillInputLocked(true, true);
		this.refreshAvailability(false);
	}
	commitSkillRecycleSelection(arrow) {
		if (!this.skillEngine || this.skillEngine.state.phase !== "select-recycle-target") return;
		const model = this.models.get(arrow.definition.id);
		this.setHovered(null);
		model?.setRecycleSelectionState("selected");
		this.skillEngine.commitRecycleSelection(arrow.definition.id);
		this.skillUi.setRecycleSelection(false);
		this.setSkillInputLocked(true);
		this.publishDiagnostics();
		window.clearTimeout(this.skillRecycleSelectionTimer);
		this.skillRecycleSelectionTimer = window.setTimeout(() => {
			this.skillRecycleSelectionTimer = 0;
			model?.setRecycleSelectionState("none");
			this.commitSkillAutoRemoval(arrow.definition.id);
			this.finishSkillResolution(true);
		}, SKILL_RECYCLE_SELECTION_COMMIT_DELAY_MS);
	}
	finishSkillResolution(topologyChanged, presentationDuration, stateAlreadySynced = false) {
		if (!this.skillEngine) return;
		if (!stateAlreadySynced) this.syncSkillState();
		if (this.skillEngine.state.phase === "failed") {
			this.randomGameOver = true;
			this.hud.showGameOver();
			this.audio.playInteraction("failed");
			this.setSkillInputLocked(true);
			return;
		}
		window.clearTimeout(this.skillSettleTimer);
		window.clearTimeout(this.skillSettleCueTimer);
		const totalDuration = Math.max(topologyChanged ? 900 : 650, presentationDuration ?? 0);
		const settleStartedAt = performance.now();
		const visualSettleDeadlineMs = totalDuration + 2e3;
		const settleDelay = Math.max(280, totalDuration - 320);
		this.skillSettleCueTimer = window.setTimeout(() => {
			const remaining = this.arrows.length - this.removedCount;
			this.skillUi.setCuePhase("settle", remaining === 0 ? "挑战完成" : "结算完成");
		}, settleDelay);
		const settleWhenReady = () => {
			if (!this.skillEngine) return;
			const settleElapsedMs = performance.now() - settleStartedAt;
			const presentation = this.skillPresentation.diagnostics;
			const sequencePending = presentation.skillId === "snapshot-sweep" && presentation.autoRemovalOrder.length < presentation.targetCount;
			const exitsPending = presentation.skillId === "snapshot-sweep" && this.animations.some((animation) => animation.autoCommitted);
			const washerPending = this.washerSpin.diagnostics.active || this.animations.some((animation) => animation.autoCommitted);
			const kettlePending = this.kettleThaw.diagnostics.active;
			const toasterPending = this.toasterHeatSwap.diagnostics.active;
			const coffeePending = this.skillEngine.state.debuff?.id === "coffee-lock" && this.skillEngine.state.debuff.turnsRemaining === 0 && (this.coffeeLockExitTarget?.activeTimeRemaining ?? 0) > 0;
			const generalPresentationPending = skillPresentationStillActive({
				controllerActiveTimelines: presentation.activeTimelines,
				transientEffectCount: this.skillEffects.activeTransientCount,
				elapsedMs: settleElapsedMs,
				maxVisualWaitMs: visualSettleDeadlineMs
			});
			const visualSettleExpired = settleElapsedMs >= visualSettleDeadlineMs && (presentation.activeTimelines > 0 || this.skillEffects.activeTransientCount > 0);
			if (sequencePending || exitsPending || washerPending || kettlePending || toasterPending || coffeePending || generalPresentationPending) {
				this.skillSettleTimer = window.setTimeout(settleWhenReady, 100);
				return;
			}
			this.commitPendingWasherFlingRemovals();
			const remaining = this.arrows.length - this.removedCount;
			this.skillTransientHighlights.clear();
			this.kettleThaw.reset();
			if (this.skillTransientScreenEffect !== "microwave-heat") this.skillTransientScreenEffect = "none";
			this.desktopComputerFeedback = null;
			this.skillPresentation.complete();
			if (visualSettleExpired) this.skillEffects.reset();
			this.skillEngine.clearExhaustedCoffeeLock();
			this.coffeeLockExitTarget = null;
			this.skillEngine.settle();
			this.skillEngine.reselectInvalidHints(this.createSkillContext());
			this.syncSkillState();
			this.setSkillInputLocked(false);
			this.syncRequiredColors();
			this.applianceRoutingRevision = this.appliances.routingRevision;
			this.refreshAvailability(false);
			if (remaining === 0 && this.connections.activeCount === 0) {
				this.hud.showComplete();
				this.persistCampaignProgress();
				this.audio.playInteraction("complete");
			}
		};
		this.skillSettleTimer = window.setTimeout(settleWhenReady, totalDuration);
	}
	queueSkillCommitCue(label = "效果生效", delay = 220) {
		window.clearTimeout(this.skillCommitTimer);
		this.skillCommitTimer = window.setTimeout(() => this.skillUi.setCuePhase("commit", label), delay);
	}
	syncSkillState() {
		if (!this.skillEngine) return;
		this.randomLives = this.skillEngine.state.currentLives;
		this.hud.setRandomLives(true, this.randomLives, this.skillEngine.state.maxLives);
		this.skillUi.render(this.skillEngine.state);
		this.syncSkillPresentation();
	}
	getPortableSpeakerSpacingTargets() {
		let targetIndex = 0;
		let cacheMatches = true;
		for (const arrow of this.arrows) {
			if (arrow.state !== "idle" && arrow.state !== "bumping") continue;
			const model = this.models.get(arrow.definition.id);
			if (!model?.root.visible) continue;
			const cached = this.portableSpeakerSpacingTargetsCache[targetIndex];
			if (!cached || cached.id !== arrow.definition.id || cached.center !== model.getBundleBaseCenterRef() || cached.clearanceSegments !== model.getBundleClearanceSegments()) {
				cacheMatches = false;
				break;
			}
			targetIndex += 1;
		}
		if (cacheMatches && targetIndex === this.portableSpeakerSpacingTargetsCache.length) return this.portableSpeakerSpacingTargetsCache;
		const targets = [];
		for (const arrow of this.arrows) {
			if (arrow.state !== "idle" && arrow.state !== "bumping") continue;
			const model = this.models.get(arrow.definition.id);
			if (!model?.root.visible) continue;
			targets.push({
				id: arrow.definition.id,
				center: model.getBundleBaseCenterRef(),
				clearanceSegments: model.getBundleClearanceSegments(),
				setOffset: (offset) => model.setBundleSpacingOffset(offset)
			});
		}
		this.portableSpeakerSpacingTargetsCache = targets;
		return targets;
	}
	syncSkillPresentation() {
		if (!this.skillEngine) return;
		const state = this.skillEngine.state;
		const nextBuffId = state.buff?.id ?? null;
		if (nextBuffId !== this.lastSkillBuffId) {
			const replacingBuff = this.lastSkillBuffId !== null && nextBuffId !== null;
			this.lastSkillBuffId = nextBuffId;
			if (replacingBuff) {
				this.clearSkillBuffVisuals();
				this.skillBuffVisualReleaseAt = performance.now() + SKILL_BUFF_SWAP_VISUAL_DURATION_MS;
				window.clearTimeout(this.skillBuffSwapTimer);
				this.skillBuffSwapTimer = window.setTimeout(() => {
					this.skillBuffSwapTimer = 0;
					this.skillBuffVisualReleaseAt = 0;
					this.syncSkillPresentation();
				}, SKILL_BUFF_SWAP_VISUAL_DURATION_MS);
			}
		}
		const buffVisualsBlocked = performance.now() < this.skillBuffVisualReleaseAt;
		this.hud.setContinueReady(state.buff?.id === "continue", state.buff?.id === "continue" ? Number(state.buff.payload.restoreLives ?? 1) : 1);
		const frozenCableIds = state.debuff?.id === "frozen-plug" ? state.debuff.targetCableIds : [];
		this.refrigeratorFreeze.syncStatus(frozenCableIds);
		const fakeIds = new Set(this.skillEngine.getFakePlugCableIds());
		const glowHighlighted = /* @__PURE__ */ new Set([
			...this.skillTransientHighlights,
			...state.lampHintCableId ? [state.lampHintCableId] : [],
			...state.debuff?.id === "overheated-plug" ? state.debuff.targetCableIds : []
		]);
		const revealAll = state.buff?.id === "induction-reveal";
		const inductionCableIds = new Set(revealAll ? this.availableChoices.map(({ arrow }) => arrow.definition.id) : []);
		const screenEffect = this.skillTransientScreenEffect !== "none" ? this.skillTransientScreenEffect : state.debuff?.id === "bathroom-steam" ? "bathroom-steam" : state.debuff?.id === "coffee-lock" ? "coffee-lock" : "none";
		this.pipeline.setSkillEffect(screenEffect);
		if (screenEffect === "coffee-lock") {
			const turns = state.debuff?.id === "coffee-lock" ? state.debuff.turnsRemaining ?? 0 : 0;
			this.pipeline.setSkillEffectProgress(turns / 3);
		}
		const cablePositions = /* @__PURE__ */ new Map();
		const cableOrientations = /* @__PURE__ */ new Map();
		for (const [id, model] of this.models) {
			cablePositions.set(id, model.getHeadWorldPosition());
			cableOrientations.set(id, model.getHeadWorldQuaternion());
		}
		const availablePositions = this.availableChoices.map(({ arrow, end }) => this.models.get(arrow.definition.id)?.getHeadWorldPosition(new Vector3(), end)).filter((position) => Boolean(position));
		const hintPositions = /* @__PURE__ */ new Map();
		const hintOrientations = /* @__PURE__ */ new Map();
		this.availableChoices.forEach(({ arrow, end }) => {
			const model = this.models.get(arrow.definition.id);
			if (!model) return;
			hintPositions.set(arrow.definition.id, model.getHeadWorldPosition(new Vector3(), end));
			hintOrientations.set(arrow.definition.id, model.getHeadWorldQuaternion(new Quaternion(), end));
		});
		this.skillEffects.root.visible = this.currentMode === "skill" && !this.openingActive;
		this.skillPresentation.root.visible = (this.currentMode === "skill" || this.skillEvidenceVisible) && !this.openingActive;
		this.skillEffects.syncPersistent(state, cablePositions, cableOrientations, availablePositions, hintPositions, hintOrientations);
		const bubbleShieldTargets = this.arrows.filter((arrow) => arrow.state !== "removed").map((arrow) => this.models.get(arrow.definition.id)?.root).filter((root) => Boolean(root?.visible));
		this.bubbleShield.sync(this.currentMode === "skill" && !this.openingActive && !buffVisualsBlocked && state.buff?.id === "iridescent-bubble", bubbleShieldTargets);
		this.soundWaveShield.sync(this.currentMode === "skill" && !this.openingActive && !buffVisualsBlocked && state.buff?.id === "soothing-record", bubbleShieldTargets);
		const dehumidifier = this.appliances.targets.find((target) => target.kind === "dehumidifier" && target.root.visible);
		this.dehumidifierDryShield.sync(this.currentMode === "skill" && !this.openingActive && !buffVisualsBlocked && state.buff?.id === "dry-shield", state.buff?.id === "dry-shield" ? state.buff.turnsRemaining : null, bubbleShieldTargets, dehumidifier?.root.getWorldPosition(new Vector3()), this.pendingDryShieldAbsorb);
		this.pendingDryShieldAbsorb = false;
		this.portableSpeakerSpacing.sync(this.currentMode === "skill" && !this.openingActive && !buffVisualsBlocked && state.buff?.id === "bass-spacing", this.getPortableSpeakerSpacingTargets());
		this.petals.setCanopyFlow(this.dehumidifierDryShield.petalFlow);
		this.skillPresentation.syncRiceStatus(state.debuff?.id ?? null);
		const microwaveTurns = state.debuff?.id === "overheated-plug" ? state.debuff.turnsRemaining ?? 2 : 2;
		const overheatedCableIds = new Set(state.debuff?.id === "overheated-plug" ? state.debuff.targetCableIds : []);
		for (const [id, model] of this.models) {
			model.setFakeTailPlug(fakeIds.has(id));
			model.setOverheated(overheatedCableIds.has(id), microwaveTurns);
			model.setInductionReveal(!buffVisualsBlocked && inductionCableIds.has(id) && !overheatedCableIds.has(id));
			if (state.debuff?.id === "coffee-lock") model.setSkillTint(null);
			else {
				model.clearCoffeeStain();
				if (state.debuff?.id === "rice-thick-cable") model.setSkillTint(16180129, .28);
				else model.setSkillTint(null);
			}
			const colorShufflePreview = this.skillColorShufflePreview.get(id);
			if (colorShufflePreview) model.setSkillTint(colorShufflePreview.color, colorShufflePreview.strength, colorShufflePreview.emissionScale);
			model.setSkillGlow(overheatedCableIds.has(id) ? .42 : glowHighlighted.has(id) ? .86 : inductionCableIds.has(id) ? .18 : 0);
			const lampGuideEnd = state.lampHintCableId === id && state.popcornHintCableId !== id && !overheatedCableIds.has(id) ? this.availableChoices.find(({ arrow }) => arrow.definition.id === id)?.end ?? "head" : null;
			model.setLampGuide(lampGuideEnd);
		}
		this.syncRadioRouteGuide();
	}
	clearSkillBuffVisuals() {
		const visibleTargets = [];
		this.bubbleShield.sync(false, visibleTargets);
		this.soundWaveShield.sync(false, visibleTargets);
		this.dehumidifierDryShield.sync(false, null, visibleTargets, void 0, false);
		this.portableSpeakerSpacing.sync(false, []);
		for (const model of this.models.values()) model.setInductionReveal(false);
	}
	beginDesktopComputerFeedback(hadBuff, livesAfter, commitOutcome = true) {
		this.desktopComputerFeedback = {
			startedAt: performance.now(),
			hadBuff,
			livesAfter,
			commitOutcome,
			committed: false
		};
		this.skillTransientScreenEffect = "blue-screen";
		document.documentElement.dataset.desktopComputerFeedback = "pending";
		this.pipeline.setSkillEffect("blue-screen", true);
		this.pipeline.setSkillEffectProgress(0);
		this.publishDiagnostics();
	}
	beginMicrowaveHeatFeedback() {
		this.microwaveHeatStartedAt = performance.now();
		this.skillTransientScreenEffect = "microwave-heat";
		this.pipeline.setSkillEffect("microwave-heat", true);
		this.pipeline.setSkillEffectProgress(0);
	}
	updateMicrowaveHeatFeedback() {
		if (this.skillTransientScreenEffect !== "microwave-heat") return;
		const elapsed = this.appliances.targets.find((target) => target.kind === "microwave" && target.state === "active")?.getActiveElapsed() ?? Math.max(0, (performance.now() - this.microwaveHeatStartedAt) / 1e3);
		this.pipeline.setSkillEffect("microwave-heat");
		this.pipeline.setSkillEffectProgress(elapsed / POWERED_ACTIVE_DURATION);
		if (elapsed < 5.2) return;
		this.microwaveHeatStartedAt = 0;
		this.skillTransientScreenEffect = "none";
		this.syncSkillPresentation();
	}
	updateDesktopComputerFeedback() {
		const feedback = this.desktopComputerFeedback;
		if (!feedback) return;
		const evidenceTime = window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__;
		const timelineTime = Number.isFinite(evidenceTime) && evidenceTime > 0 ? evidenceTime : Math.max(0, (performance.now() - feedback.startedAt) / 1e3);
		this.pipeline.setSkillEffect("blue-screen");
		this.pipeline.setSkillEffectProgress(timelineTime / POWERED_ACTIVE_DURATION);
		if (feedback.committed || timelineTime < 3.72) return;
		feedback.committed = true;
		if (!feedback.commitOutcome) {
			document.documentElement.dataset.desktopComputerFeedback = "visual-only";
			this.publishDiagnostics();
			return;
		}
		if (feedback.hadBuff) {
			document.documentElement.dataset.desktopComputerFeedback = "buff-deleted";
			this.skillUi.showComputerBuffDeleted();
			this.skillUi.setCuePhase("commit", "BUFF 已删除");
			this.hud.flash("蓝屏崩溃：BUFF 已删除", true);
		} else {
			document.documentElement.dataset.desktopComputerFeedback = "life-lost";
			this.hud.showComputerLifeLost(feedback.livesAfter);
			this.skillUi.setCuePhase("commit", "生命 -1");
		}
		this.syncSkillState();
		this.publishDiagnostics();
	}
	syncRadioRouteGuide() {
		const availableIds = new Set(this.availableChoices.map(({ arrow }) => arrow.definition.id));
		const state = this.skillEngine?.state;
		const higherPriorityHintIds = /* @__PURE__ */ new Set([
			...state?.lampHintCableId ? [state.lampHintCableId] : [],
			...state?.popcornHintCableId ? [state.popcornHintCableId] : [],
			...state?.debuff?.id === "overheated-plug" ? state.debuff.targetCableIds : []
		]);
		this.radioRouteCableIds = this.radioRouteCableIds.filter((id) => {
			return this.arrows.find((candidate) => candidate.definition.id === id)?.state === "idle" && availableIds.has(id) && this.models.get(id)?.root.visible === true;
		});
		const targets = this.radioRouteCableIds.filter((id) => !higherPriorityHintIds.has(id)).map((id) => {
			const model = this.models.get(id);
			const arrow = this.arrows.find((candidate) => candidate.definition.id === id);
			if (!model || !arrow) return null;
			return {
				cableId: id,
				position: model.getHeadWorldPosition(new Vector3()),
				direction: DIRECTION_VECTORS[cableEndDirection(arrow.definition, "head")].clone()
			};
		}).filter((target) => target !== null);
		this.skillPresentation.syncRadioGuide(targets);
	}
	handleHover(clientX, clientY) {
		if (this.openingActive || this.openingTransitioning || this.animations.some((animation) => animation.kind === "bump") || this.randomGameOver || this.currentMode === "rush" && this.rushRound?.phase !== "running" || this.doubleEndedUi.briefingVisible || this.currentMode === "skill" && this.skillInputLocked && this.skillEngine?.state.phase !== "select-recycle-target") {
			this.setHovered(null);
			return;
		}
		this.setHovered(this.pickArrow(clientX, clientY));
	}
	canPullColor(color) {
		return this.currentMode === "skill" ? this.appliances.canAssignColor(color) : this.appliances.canHandleColor(color);
	}
	pickArrow(clientX, clientY, touch = false) {
		const rect = this.canvas.getBoundingClientRect();
		this.pointer.set((clientX - rect.left) / rect.width * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
		this.raycaster.setFromCamera(this.pointer, this.camera);
		const targets = [];
		const recycleSelectionActive = this.currentMode === "skill" && this.skillEngine?.state.phase === "select-recycle-target";
		for (const arrow of this.arrows) {
			if (arrow.state !== "idle" || !recycleSelectionActive && this.currentMode !== "rush" && !this.canPullColor(arrow.definition.color)) continue;
			const model = this.models.get(arrow.definition.id);
			if (model) targets.push(...model.pickMeshes);
		}
		let intersections = this.raycaster.intersectObjects(targets, false);
		if (touch && intersections.length === 0) {
			for (const radius of [
				6,
				12,
				18
			]) {
				for (let i = 0; i < 12; i++) {
					const angle = i * Math.PI / 6;
					const x = clientX + Math.cos(angle) * radius;
					const y = clientY + Math.sin(angle) * radius;
					if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) continue;
					this.pointer.set((x - rect.left) / rect.width * 2 - 1, 1 - (y - rect.top) / rect.height * 2);
					this.raycaster.setFromCamera(this.pointer, this.camera);
					const hit = this.raycaster.intersectObjects(targets, false)[0];
					if (hit) intersections.push(hit);
				}
				if (intersections.length) break;
			}
			intersections.sort((a, b) => a.distance - b.distance);
		}
		return preferAvailableCablePick(intersections.map(({ object }) => typeof object.userData.arrowId === "string" ? {
			id: object.userData.arrowId,
			end: object.userData.cableEnd === "tail" ? "tail" : "head"
		} : null).filter((candidate) => candidate !== null), recycleSelectionActive ? [] : this.availableChoices.map(({ arrow, end }) => ({
			id: arrow.definition.id,
			end
		})));
	}
	setHovered(picked, force = false) {
		if (!force && this.hoveredId === picked?.id && this.hoveredEnd === picked?.end) return;
		const recycleSelectionActive = this.currentMode === "skill" && this.skillEngine?.state.phase === "select-recycle-target";
		if (this.hoveredId) {
			const previousModel = this.models.get(this.hoveredId);
			previousModel?.setHovered(false);
			if (recycleSelectionActive) previousModel?.setRecycleSelectionState("none");
		}
		this.hoveredId = picked?.id ?? null;
		this.hoveredEnd = picked?.end ?? null;
		if (picked) {
			const model = this.models.get(picked.id);
			model?.setHovered(true, picked.end, this.theme.snapshot.progress);
			if (recycleSelectionActive) model?.setRecycleSelectionState("hover");
		}
		const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
		if (diagnostics) {
			diagnostics.hoveredArrow = this.hoveredId;
			diagnostics.hoveredCableEnd = this.hoveredEnd;
			if (diagnostics.skill) for (const effect of diagnostics.skill.cableEffects) {
				const model = this.models.get(effect.id);
				if (model) Object.assign(effect, model.skillVisualState);
			}
		}
	}
	update(delta, elapsed) {
		const openingWallDelta = this.lastOpeningFrameElapsed > 0 ? Math.min(5, Math.max(delta, elapsed - this.lastOpeningFrameElapsed)) : delta;
		this.lastOpeningFrameElapsed = elapsed;
		this.theme.update(delta);
		const themeSnapshot = this.theme.snapshot;
		this.season.update(delta, themeSnapshot.progress);
		const seasonSnapshot = this.season.snapshot;
		const seasonEnvironment = this.season.resolveEnvironment(themeSnapshot.progress);
		this.pipeline.setThemeProgress(themeSnapshot.progress);
		this.nightEnvironment.setThemeProgress(themeSnapshot.progress);
		this.nightEnvironment.setSeasonEnvironment(seasonEnvironment);
		this.sky.setSeasonWeights(seasonSnapshot.weights);
		this.petals.setSeasonState(seasonSnapshot.weights, themeSnapshot.progress);
		this.openingScene.setSeasonState(seasonSnapshot.weights, themeSnapshot.progress);
		this.nightEnvironment.setReducedMotion(themeSnapshot.reducedMotion);
		if (this.hoveredId && this.hoveredEnd) this.models.get(this.hoveredId)?.setHovered(true, this.hoveredEnd, themeSnapshot.progress);
		if (themeSnapshot.progress > .5) this.adaptiveQuality.update(delta);
		this.nightEnvironment.update(delta, elapsed, {
			opening: this.openingActive,
			galleryOpen: this.applianceGallery?.visible ?? false,
			openingFocus: this.openingActive ? this.openingScene.getBundleWorldPosition(this.openingLanternFocus) : void 0
		});
		const lantern = this.nightEnvironment.lantern;
		this.lanternScreenPosition.set(lantern.position[0], lantern.position[1]);
		this.pipeline.setLantern(this.lanternScreenPosition, lantern.intensity);
		if (this.applianceGallery?.visible) return;
		this.audio.update(themeSnapshot.progress, this.appliances.targets, this.camera);
		this.frame += 1;
		this.orbit.update(delta);
		this.appliances.setOrbitState(this.orbit.getState());
		this.sky.update(this.camera.position, this.camera.quaternion, elapsed, delta);
		this.openingScene.update(delta, elapsed, this.camera, openingWallDelta);
		this.updateOpeningCameraTransition(openingWallDelta);
		this.skillEffects.update(delta, elapsed);
		this.bubbleShield.update(delta, elapsed, this.orbit.getState());
		this.soundWaveShield.update(delta, elapsed);
		this.dehumidifierDryShield.update(delta, elapsed);
		if (this.portableSpeakerSpacing.phase === "idle") this.portableSpeakerSpacing.update(delta);
		else this.portableSpeakerSpacing.update(delta, this.getPortableSpeakerSpacingTargets());
		this.petals.setCanopyFlow(this.dehumidifierDryShield.petalFlow);
		this.petals.update(delta);
		this.toasterHeatSwap.update();
		this.kettleThaw.update();
		this.washerSpin.update(delta);
		this.refrigeratorFreeze.syncStatus(this.skillEngine?.state.debuff?.id === "frozen-plug" ? this.skillEngine.state.debuff.targetCableIds : []);
		this.refrigeratorFreeze.update(delta);
		this.refrigeratorScreenIce.setThemeProgress(themeSnapshot.progress);
		this.refrigeratorScreenIce.setProgress(this.refrigeratorFreeze.visible ? this.refrigeratorFreeze.environmentAmount : 0);
		this.petals.setColdProgress(this.refrigeratorFreeze.visible ? this.refrigeratorFreeze.environmentAmount : 0);
		for (const [id, model] of this.models) {
			model.updateRecycleSelection(elapsed);
			model.updateOverheat(delta, elapsed);
			const frozen = this.refrigeratorFreeze.hasTarget(id);
			model.setRefrigeratorIceGeometryEnabled(frozen);
			model.setFrozen(frozen ? this.refrigeratorFreeze.cableAmount : 0, frozen ? this.refrigeratorFreeze.cableProgress : 0);
		}
		this.updateCoffeeStain(delta, elapsed);
		const toasterHeatSwap = this.toasterHeatSwap.diagnostics;
		if (toasterHeatSwap.active) this.pipeline.setSkillEffect("toaster-heat");
		if (toasterHeatSwap.active) this.pipeline.setSkillEffectProgress(toasterHeatSwap.screenProgress);
		else if (this.skillTransientScreenEffect === "toaster-heat") {
			const toaster = this.appliances.targets.find((target) => target.kind === "toaster" && target.state === "active");
			this.pipeline.setSkillEffect("toaster-heat");
			this.pipeline.setSkillEffectProgress((toaster?.getActiveElapsed() ?? 0) / POWERED_ACTIVE_DURATION);
		}
		const kettleThaw = this.kettleThaw.diagnostics;
		if (kettleThaw.phase !== "idle") {
			this.pipeline.setSkillEffect("kettle-thaw-heat");
			this.pipeline.setSkillEffectProgress(kettleThaw.progress);
		} else if (this.skillTransientScreenEffect === "kettle-thaw-heat") {
			const kettle = this.appliances.targets.find((target) => target.kind === "kettle" && target.state === "active");
			this.pipeline.setSkillEffect("kettle-thaw-heat");
			this.pipeline.setSkillEffectProgress((kettle?.getActiveElapsed() ?? 0) / POWERED_ACTIVE_DURATION);
		}
		this.updateMicrowaveHeatFeedback();
		this.syncRadioRouteGuide();
		this.skillPresentation.update(elapsed);
		if (this.openingActive) return;
		if (this.activeHint) for (const model of this.models.values()) model.updateAvailableHints(delta, elapsed);
		if (this.openingTransitioning) {
			const pullProgress = this.openingCameraPhase === "pull" ? MathUtils.clamp(this.openingCameraElapsed / this.openingCameraPullDuration, 0, 1) : 0;
			const anchorBlend = MathUtils.smoothstep(pullProgress, .55, 1);
			this.appliances.updateOpeningCameraTransition(delta, elapsed, anchorBlend);
		} else {
			this.appliances.endOpeningCameraTransition();
			this.appliances.update(delta, elapsed);
		}
		this.sensory.register(this.appliances.targets);
		this.performances.update(delta, elapsed, this.camera, this.appliances.targets, this.petals);
		this.televisionReconstruction.update(this.camera);
		this.updateDesktopComputerFeedback();
		this.sensory.update(this.appliances.targets, themeSnapshot.progress, elapsed, this.explorationMode ? 1 : 0);
		for (const target of this.appliances.targets) if (target.dropLanded && !this.landedTargets.has(target)) {
			this.landedTargets.add(target);
			this.audio.playInteraction("appliance-land");
		} else if (!target.dropLanded) this.landedTargets.delete(target);
		if (this.currentMode === "rush" && this.rushRound?.phase === "running") {
			const phase = this.rushRound.update(elapsed);
			this.rushUi.setTimer(this.rushRound.remainingSeconds);
			if (phase === "failed") {
				this.finishRushFailure();
				return;
			}
		}
		this.updateAnimations(delta, elapsed);
		this.connections.update(delta, this.camera);
		this.flushPendingApplianceConnections();
		if (this.applianceRoutingRevision !== this.appliances.routingRevision) {
			this.applianceRoutingRevision = this.appliances.routingRevision;
			this.refreshAvailability(false);
		}
	}
	updateAnimations(delta, elapsed) {
		for (let index = this.animations.length - 1; index >= 0; index -= 1) {
			const animation = this.animations[index];
			animation.elapsed = animation.wallClockStartedAtSeconds === null ? animation.elapsed + delta : Math.max(animation.elapsed, elapsed - animation.wallClockStartedAtSeconds);
			const progress = Math.min(1, animation.elapsed / animation.duration);
			if (animation.kind === "exit") {
				const travelDistance = animation.model.pathLength + .85;
				const prepare = progress < .14 ? Math.sin(progress / .14 * Math.PI) : 0;
				animation.model.setPrepare(prepare, animation.end);
				animation.model.setMotionDistance(easeOutCubic(progress) * travelDistance, animation.end);
			} else if (animation.kind === "skill-fling") {
				const travel = progress * (.62 + progress * .38) * 36;
				animation.model.root.position.copy(animation.originPosition ?? new Vector3()).addScaledVector(animation.direction, travel);
				animation.model.root.quaternion.copy(animation.originQuaternion ?? new Quaternion());
				animation.model.root.scale.copy(animation.originScale ?? new Vector3(1, 1, 1));
				const flightAngularVelocity = animation.flightAngularVelocity;
				if (flightAngularVelocity) {
					this.washerFlightEuler.set(flightAngularVelocity.x * animation.elapsed, flightAngularVelocity.y * animation.elapsed, flightAngularVelocity.z * animation.elapsed, "XYZ");
					this.washerFlightQuaternion.setFromEuler(this.washerFlightEuler);
					animation.model.root.quaternion.multiply(this.washerFlightQuaternion);
				}
				const worldPosition = animation.model.root.getWorldPosition(this.washerFlightWorldPosition);
				const flightDistance = worldPosition.distanceTo(animation.originPosition ?? worldPosition);
				const projected = this.washerFlightProjectedPosition.copy(worldPosition).project(this.camera);
				animation.maxScreenRadius = Math.max(animation.maxScreenRadius ?? 0, Math.abs(projected.x), Math.abs(projected.y));
				animation.distanceMonotonic = (animation.distanceMonotonic ?? true) && flightDistance + 1e-4 >= (animation.previousFlightDistance ?? 0);
				animation.previousFlightDistance = flightDistance;
			} else {
				const pulse = Math.sin(progress * Math.PI);
				animation.model.setMotionDistance(pulse * .16, animation.end);
				animation.model.setBlockedFlash(pulse, animation.end);
			}
			if (progress < 1) continue;
			this.animations.splice(index, 1);
			if (animation.kind === "exit" || animation.kind === "skill-fling") {
				const start = (animation.end === "head" ? animation.arrow.samplePoints[animation.arrow.samplePoints.length - 1] : animation.arrow.samplePoints[0]).clone().addScaledVector(animation.direction, 1.9);
				animation.model.root.visible = false;
				if (animation.kind === "skill-fling") this.washerFlingHistory.push({
					id: animation.arrow.definition.id,
					maxScreenRadius: animation.maxScreenRadius ?? 0,
					distanceMonotonic: animation.distanceMonotonic ?? true
				});
				if (animation.autoCommitted) {
					if (animation.kind === "skill-fling") {
						this.pendingWasherFlingRemovals.push(animation.arrow);
						this.skillAutoRemovalEnds.delete(animation.arrow.definition.id);
						continue;
					}
					this.completeRemoval(animation.arrow, false);
					this.skillEngine?.notifyAutoRemoved(animation.arrow.definition.id, this.arrows.length - this.removedCount > 0);
					this.skillAutoRemovalEnds.delete(animation.arrow.definition.id);
					continue;
				}
				const target = animation.target;
				if (this.currentMode === "rush") {
					this.completeRemoval(animation.arrow);
					continue;
				}
				if (animation.queueAfterExit) {
					this.pendingApplianceConnections.push({
						arrow: animation.arrow,
						color: animation.arrow.definition.color,
						start,
						direction: animation.direction
					});
					this.refreshAvailability(false);
					continue;
				}
				if (!target) {
					animation.arrow.state = "idle";
					animation.model.root.visible = true;
					animation.model.resetPose();
					this.refreshAvailability(false);
					continue;
				}
				this.completeRemoval(animation.arrow);
				this.connections.begin(start, animation.direction, target, animation.arrow.definition.color, this.appliances.getPlugStyleForColor(animation.arrow.definition.color), this.camera, () => this.completeConnection(target, animation.arrow));
			} else {
				animation.model.setMotionDistance(0, animation.end);
				animation.model.resetMaterial();
				animation.arrow.state = "idle";
			}
		}
	}
	completeRemoval(arrow, manualSkillRemoval = true) {
		arrow.state = "removed";
		this.removedCount += 1;
		const remaining = this.arrows.length - this.removedCount;
		this.hud.updateProgress(remaining, this.arrows.length);
		this.hud.showRemoved(remaining);
		this.audio.playInteraction("cable-success");
		this.syncRequiredColors();
		if (this.currentMode === "rush") {
			this.rushRound?.recordRemoval();
			if (remaining === 0) this.finishRushSuccess();
		}
		if (this.currentMode === "skill" && manualSkillRemoval) {
			if (this.skillEngine?.commitManualRemoval(arrow.definition.id, remaining > 0) ?? false) {
				this.syncSkillState();
				this.triggerPrinterCopyAutoRemoval();
			}
		}
		this.refreshAvailability(false);
	}
	commitPendingWasherFlingRemovals() {
		if (this.pendingWasherFlingRemovals.length === 0) return;
		const pending = this.pendingWasherFlingRemovals.splice(0);
		let committed = 0;
		for (const arrow of pending) {
			if (arrow.state === "removed") continue;
			arrow.state = "removed";
			this.removedCount += 1;
			committed += 1;
			this.skillEngine?.notifyAutoRemoved(arrow.definition.id, this.arrows.length - this.removedCount > 0);
		}
		if (committed === 0) return;
		const remaining = this.arrows.length - this.removedCount;
		this.hud.updateProgress(remaining, this.arrows.length);
		this.hud.showRemoved(remaining);
		this.audio.playInteraction("cable-success");
	}
	syncRequiredColors() {
		this.appliances.setRequiredColors(this.currentMode === "rush" ? [] : this.arrows.filter((candidate) => candidate.state !== "removed").map((candidate) => candidate.definition.color));
	}
	finishRushSuccess() {
		if (this.currentMode !== "rush" || this.rushRound?.phase !== "running") return;
		this.rushRound.succeed();
		this.setHovered(null);
		this.rushUi.showResult("success");
		this.audio.playInteraction("complete");
		this.publishDiagnostics();
	}
	finishRushFailure() {
		if (this.currentMode !== "rush" || this.rushRound?.phase !== "failed") return;
		this.setHovered(null);
		for (const animation of this.animations) {
			animation.arrow.state = "idle";
			animation.model.resetPose();
		}
		this.animations.length = 0;
		this.pendingApplianceConnections.length = 0;
		this.rushUi.showResult("failure");
		this.audio.playInteraction("failed");
		this.refreshAvailability(false);
		this.publishDiagnostics();
	}
	completeConnection(target, arrow) {
		this.petals.burst(target.getConnectionWorldPosition(), new Vector3(0, .75, .25), 16);
		const remaining = this.arrows.length - this.removedCount;
		this.hud.showConnected(remaining, target.label);
		this.audio.playInteraction("confirm");
		if (this.currentMode === "skill") {
			this.resolveSkillConnection(target, arrow);
			return;
		}
		this.refreshAvailability(false);
		if (remaining !== 0) return;
		const completedApplyToken = this.puzzleApplyToken;
		window.setTimeout(() => {
			if (completedApplyToken !== this.puzzleApplyToken || this.openingActive) return;
			if (this.arrows.length - this.removedCount === 0 && this.connections.activeCount === 0) {
				this.hud.showComplete();
				this.persistCampaignProgress();
				this.audio.playInteraction("complete");
			}
		}, 0);
	}
	flushPendingApplianceConnections() {
		for (let index = 0; index < this.pendingApplianceConnections.length;) {
			const pending = this.pendingApplianceConnections[index];
			const target = this.appliances.reserveAssignment(pending.arrow.definition.id, pending.color);
			if (!target) {
				index += 1;
				continue;
			}
			this.pendingApplianceConnections.splice(index, 1);
			this.completeRemoval(pending.arrow);
			this.connections.begin(pending.start, pending.direction, target, pending.color, this.appliances.getPlugStyleForColor(pending.color), this.camera, () => this.completeConnection(target, pending.arrow));
		}
	}
	render() {
		if (this.applianceGallery?.visible || this.contextUnavailable) return;
		this.pipeline.render();
		this.skillPresentation.render();
		if (!this.diagnosticsEnabled) return;
		if (this.frame % DIAGNOSTICS_PUBLISH_INTERVAL_FRAMES === 0) this.publishDiagnostics();
		else this.publishLiveDiagnostics();
	}
	profileRenderBreakdown() {
		const directChildren = [...this.scene.children];
		const originalVisibility = directChildren.map((object) => ({
			object,
			visible: object.visible
		}));
		const originalVisibilityByObject = new Map(originalVisibility.map(({ object, visible }) => [object, visible]));
		const previousTarget = this.renderer.getRenderTarget();
		const profileEntries = [];
		const liveRenderer = {
			calls: this.renderer.info.render.calls,
			triangles: this.renderer.info.render.triangles,
			geometries: this.renderer.info.memory.geometries,
			textures: this.renderer.info.memory.textures
		};
		const labels = /* @__PURE__ */ new Map([
			[this.arrowRoot, "arrows"],
			[this.appliances.root, "appliances"],
			[this.connections.root, "connections"],
			[this.petals.mesh, "season-petals"],
			[this.openingScene.root, "opening-scene"],
			[this.performances.root, "appliance-performance-effects"],
			[this.sensory.root, "appliance-sensory"],
			[this.skillEffects.root, "skill-effect-models"],
			[this.bubbleShield.root, "bubble-shield"],
			[this.soundWaveShield.root, "sound-wave-shield"],
			[this.dehumidifierDryShield.root, "dehumidifier-dry-shield"],
			[this.sky.dome, "sky-dome"],
			[this.sky.stars, "sky-stars"],
			[this.sky.explorationEyes, "sky-exploration-eyes"],
			[this.sky.clouds, "sky-clouds"]
		]);
		const geometryTriangles = (object) => {
			const geometry = object.geometry;
			const sourceCount = geometry.index?.count ?? geometry.getAttribute("position")?.count ?? 0;
			const drawStart = geometry.drawRange.start ?? 0;
			const drawCount = geometry.drawRange.count === Infinity ? sourceCount - drawStart : Math.min(geometry.drawRange.count, sourceCount - drawStart);
			const instanceCount = object instanceof InstancedMesh ? object.count : 1;
			return Math.max(0, Math.floor(drawCount / 3)) * instanceCount;
		};
		const describe = (object) => {
			const geometries = /* @__PURE__ */ new Set();
			const materials = /* @__PURE__ */ new Set();
			let objects = 0;
			let renderables = 0;
			let visibleRenderables = 0;
			let meshes = 0;
			let lines = 0;
			let points = 0;
			let lights = 0;
			let triangles = 0;
			let potentialTriangles = 0;
			object.traverse((child) => {
				objects += 1;
				if (child instanceof Light) lights += 1;
				if (child instanceof Mesh || child instanceof Line || child instanceof LineLoop || child instanceof LineSegments || child instanceof Points) {
					renderables += 1;
					const renderable = child;
					let effectivelyVisible = true;
					let cursor = child;
					while (cursor) {
						if (!cursor.visible) {
							effectivelyVisible = false;
							break;
						}
						if (cursor === object) break;
						cursor = cursor.parent;
					}
					if (effectivelyVisible) visibleRenderables += 1;
					if (child instanceof Mesh) meshes += 1;
					else if (child instanceof Points) points += 1;
					else lines += 1;
					if (renderable.geometry) {
						geometries.add(renderable.geometry);
						if (child instanceof Mesh) {
							const meshTriangles = geometryTriangles(child);
							potentialTriangles += meshTriangles;
							if (effectivelyVisible) triangles += meshTriangles;
						}
					}
					const material = renderable.material;
					if (Array.isArray(material)) material.forEach((entry) => materials.add(entry));
					else if (material) materials.add(material);
				}
			});
			return {
				name: labels.get(object) ?? (object.name || object.type),
				type: object.type,
				visible: object.visible,
				objects,
				renderables,
				visibleRenderables,
				meshes,
				lines,
				points,
				lights,
				materials: materials.size,
				geometries: geometries.size,
				triangles,
				potentialTriangles
			};
		};
		const renderEntry = (object) => {
			directChildren.forEach((child) => {
				child.visible = child instanceof Light || child === object && originalVisibilityByObject.get(child) === true;
			});
			this.renderer.info.reset();
			this.renderer.setRenderTarget(this.applianceGeometryWarmupTarget);
			this.renderer.clear();
			this.renderer.render(this.scene, this.camera);
			return this.renderer.info.render.calls;
		};
		try {
			directChildren.forEach((child) => {
				child.visible = child instanceof Light || child.visible;
			});
			this.renderer.info.reset();
			this.renderer.setRenderTarget(this.applianceGeometryWarmupTarget);
			this.renderer.clear();
			this.renderer.render(this.scene, this.camera);
			const sceneRenderer = {
				calls: this.renderer.info.render.calls,
				triangles: this.renderer.info.render.triangles,
				geometries: this.renderer.info.memory.geometries,
				textures: this.renderer.info.memory.textures
			};
			for (const object of directChildren) profileEntries.push({
				...describe(object),
				calls: renderEntry(object)
			});
			return {
				capturedAt: (/* @__PURE__ */ new Date()).toISOString(),
				liveRenderer,
				sceneRenderer,
				estimatedPostProcessCalls: Math.max(0, liveRenderer.calls - sceneRenderer.calls),
				entries: profileEntries
			};
		} finally {
			originalVisibility.forEach(({ object, visible }) => {
				object.visible = visible;
			});
			this.renderer.setRenderTarget(previousTarget);
		}
	}
	resize() {
		const width = Math.max(1, this.canvas.clientWidth);
		const height = Math.max(1, this.canvas.clientHeight);
		this.camera.aspect = width / height;
		const portraitFit = width <= 760 ? Math.max(1, .62 / this.camera.aspect) : 1;
		let fittedTangent = Math.tan(MathUtils.degToRad(13)) * portraitFit;
		if (width <= 760 && this.camera.aspect < .8 && this.arrows.length > 0) {
			const radius = this.arrows.reduce((outerRadius, arrow) => Math.max(outerRadius, ...arrow.samplePoints.map((point) => point.length() + .72)), 0);
			const distance = this.currentLevel?.cameraRadius ?? 19.2;
			const angularRadius = Math.asin(Math.min(.9, radius / distance));
			const heightFraction = MathUtils.mapLinear(MathUtils.clamp(this.camera.aspect, 750 / 1624, 750 / 1334), 750 / 1624, 750 / 1334, .54, .48);
			fittedTangent = Math.max(fittedTangent, Math.tan(angularRadius) / Math.min(this.camera.aspect * 1.08, heightFraction));
		}
		this.camera.fov = MathUtils.radToDeg(2 * Math.atan(fittedTangent));
		this.camera.updateProjectionMatrix();
		this.appliances.resizeLayout();
		this.pipeline?.setSize(width, height);
		if (this.pipeline) setOutlineResolution(this.pipeline.size.x, this.pipeline.size.y);
		this.skillPresentation?.resize(width, height);
		if (!this.openingActive && !this.openingTransitioning && this.models.size > 0) {
			this.refreshAvailability(false);
			this.publishDiagnostics();
		}
	}
	refreshAvailability(orientForFirstMove) {
		const runtimeById = new Map(this.arrows.map((arrow) => [arrow.definition.id, arrow]));
		const allChoices = this.arrows.flatMap((arrow) => arrow.state === "idle" && (this.currentMode === "rush" || this.canPullColor(arrow.definition.color)) ? cableEndsFor(arrow.definition).map((end) => ({
			arrow,
			end
		})) : []);
		const availableKeys = new Set(availableCableEnds(this.arrows).map(({ id, end }) => `${id}:${end}`));
		let frozenIds = new Set(this.currentMode === "skill" ? this.skillEngine?.getFrozenCableIds() ?? [] : []);
		const fakeIds = new Set(this.currentMode === "skill" ? this.skillEngine?.getFakePlugCableIds() ?? [] : []);
		const baseAvailable = allChoices.filter(({ arrow, end }) => runtimeById.has(arrow.definition.id) && !(end === "tail" && fakeIds.has(arrow.definition.id)) && availableKeys.has(`${arrow.definition.id}:${end}`));
		if (this.currentMode === "skill" && baseAvailable.length > 0 && frozenStatusBlocksEveryAvailableCable([...new Set(baseAvailable.map(({ arrow }) => arrow.definition.id))], frozenIds) && this.skillEngine?.clearFrozenDeadlock()) {
			frozenIds = /* @__PURE__ */ new Set();
			this.skillUi.render(this.skillEngine.state);
			this.refrigeratorFreeze.beginThaw(.9);
			this.hud.flash("所有出口被冻结，已自动解除急冻", true);
			this.skillUi.showCue("急冻自动解除", "commit", "避免出现无可抽线路。", "安全兜底");
		}
		const available = baseAvailable.filter(({ arrow }) => !frozenIds.has(arrow.definition.id));
		this.availableChoices = available;
		if (this.activeHint && !availableKeys.has(`${this.activeHint.id}:${this.activeHint.end}`)) this.activeHint = null;
		this.applyActiveHint(false);
		this.availableCount = available.length;
		const collectVisibleTargets = Number.isFinite(window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__) && window.__COLLECT_ALL_CLICK_TARGETS_FOR_EVIDENCE__ !== false;
		this.availableClickTargets = collectVisibleTargets ? this.findVisibleClickTargets(available) : [];
		this.clickTarget = this.availableClickTargets[0] ?? this.findVisibleClickTarget(available);
		if (orientForFirstMove && !this.clickTarget && !this.isDoubleEndedChallenge()) for (const [yaw, pitch] of [
			[.72, .42],
			[1.5, .34],
			[2.3, .5],
			[3.1, .28],
			[3.9, .52],
			[4.7, .36],
			[5.5, .46],
			[.2, .75]
		]) {
			this.orbit.setAngles(yaw, pitch);
			this.availableClickTargets = collectVisibleTargets ? this.findVisibleClickTargets(available) : [];
			this.clickTarget = this.availableClickTargets[0] ?? this.findVisibleClickTarget(available);
			if (this.clickTarget) break;
		}
		const blocked = allChoices.filter(({ arrow, end }) => !availableKeys.has(`${arrow.definition.id}:${end}`));
		this.blockedClickTarget = this.findVisibleClickTarget(blocked);
		this.hud.setHintEnabled(this.canRevealHint() && available.length > 0);
		if (this.currentMode === "skill") this.syncSkillPresentation();
	}
	applyActiveHint(replayReveal) {
		for (const model of this.models.values()) model.setAvailableEnds([]);
		if (!this.activeHint) return;
		this.models.get(this.activeHint.id)?.setAvailableEnds([this.activeHint.end], replayReveal);
	}
	clearActiveHint() {
		this.activeHint = null;
		for (const model of this.models.values()) model.setAvailableEnds([]);
	}
	canRevealHint() {
		return !this.openingActive && !this.openingTransitioning && !this.randomGameOver && this.currentMode !== "rush" && this.hintUsesRemaining > 0 && !this.doubleEndedUi.briefingVisible;
	}
	findVisibleClickTarget(available) {
		return this.findVisibleClickTargets(available, 1)[0] ?? null;
	}
	findVisibleClickTargets(available, limit = Number.POSITIVE_INFINITY) {
		this.camera.updateMatrixWorld(true);
		this.scene.updateMatrixWorld(true);
		const allTargets = [];
		for (const arrow of this.arrows) {
			if (arrow.state !== "idle") continue;
			const model = this.models.get(arrow.definition.id);
			if (model) allTargets.push(...model.pickMeshes);
		}
		const rect = this.canvas.getBoundingClientRect();
		const results = [];
		for (const { arrow, end } of available) {
			const samples = arrow.definition.doubleEnded ? [this.models.get(arrow.definition.id)?.getHeadWorldPosition(new Vector3(), end)] : arrow.samplePoints;
			for (const sample of samples) {
				if (!sample) continue;
				const projected = sample.clone().project(this.camera);
				if (Math.abs(projected.x) > .96 || Math.abs(projected.y) > .96 || projected.z > 1) continue;
				if (this.appliances.isScreenPointBlockedByAppliance(projected.x, projected.y)) continue;
				this.raycaster.setFromCamera(new Vector2(projected.x, projected.y), this.camera);
				const hit = this.raycaster.intersectObjects(allTargets, false)[0];
				if (hit?.object.userData.arrowId !== arrow.definition.id || arrow.definition.doubleEnded && hit.object.userData.cableEnd !== end) continue;
				results.push({
					id: arrow.definition.id,
					end,
					color: arrow.definition.color,
					x: rect.left + (projected.x + 1) * .5 * rect.width,
					y: rect.top + (1 - projected.y) * .5 * rect.height
				});
				break;
			}
			if (results.length >= limit) break;
		}
		return results;
	}
	publishLiveDiagnostics() {
		if (!this.diagnosticsEnabled) return;
		const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
		if (!diagnostics) {
			this.publishDiagnostics();
			return;
		}
		diagnostics.frame = this.frame;
		diagnostics.activeAnimations = this.animations.length + this.pendingApplianceConnections.length + this.connections.activeCount;
		diagnostics.activeConnections = this.connections.activeCount;
		diagnostics.activeBurstPetals = this.petals.activeBurstCount;
		diagnostics.queuedConnections = this.pendingApplianceConnections.length;
		diagnostics.remainingArrows = this.arrows.length - this.removedCount;
		if (diagnostics.skill && this.skillEngine) {
			diagnostics.skill.phase = this.skillEngine.state.phase;
			diagnostics.skill.inputLocked = this.skillInputLocked;
			diagnostics.skill.presentation = this.skillPresentation.diagnostics;
			diagnostics.skill.washerSpin = this.washerSpin.diagnostics;
			diagnostics.skill.screenEffect = this.pipeline.skillEffectState;
			if (this.skillRecycleSelectionTimer !== 0 || this.skillEngine.state.buff?.id === "induction-reveal" || this.skillEngine.state.debuff?.id === "overheated-plug" || this.skillPresentation.diagnostics.skillId === "color-shuffle") for (const effect of diagnostics.skill.cableEffects) {
				const model = this.models.get(effect.id);
				if (model) Object.assign(effect, model.skillVisualState);
			}
		}
	}
	publishDiagnostics() {
		if (!this.diagnosticsEnabled) return;
		const info = this.renderer.info;
		const activeAnimation = this.animations[0];
		const activeFlingMotions = this.animations.filter((animation) => animation.kind === "skill-fling").map((animation) => {
			const worldPosition = animation.model.root.getWorldPosition(new Vector3());
			const projected = worldPosition.clone().project(this.camera);
			return {
				id: animation.arrow.definition.id,
				progress: Math.min(1, animation.elapsed / animation.duration),
				worldPosition: worldPosition.toArray(),
				worldDistanceFromLaunch: worldPosition.distanceTo(animation.originPosition ?? worldPosition),
				distanceFromBundleCenter: worldPosition.distanceTo(animation.bundleCenterWorld ?? worldPosition),
				angularVelocity: animation.flightAngularVelocity?.toArray() ?? [],
				direction: animation.direction.toArray(),
				screenX: projected.x,
				screenY: projected.y,
				detachedFromCableRoot: animation.model.root.parent !== this.arrowRoot
			};
		});
		const lengthMix = this.arrows.reduce((mix, arrow) => {
			mix[arrow.definition.lengthClass] += 1;
			return mix;
		}, {
			short: 0,
			medium: 0,
			long: 0
		});
		window.__THREE_GAME_DIAGNOSTICS__ = {
			frame: this.frame,
			seed: this.puzzle?.seed ?? 0,
			puzzleRevision: this.puzzleRevision,
			layoutSignature: this.arrows.map(({ definition }) => `${definition.path.map((point) => point.join(",")).join(";")}>${definition.exitDirection}`).join("|"),
			mode: this.currentMode,
			exploration: {
				active: this.explorationMode,
				environmentScale: this.explorationMode ? .015 : 1,
				lanternPreserved: true
			},
			challengeKind: this.puzzle?.challengeKind ?? this.currentLevel?.challengeKind ?? null,
			locale: getLocale(),
			randomLives: this.randomLives,
			randomGameOver: this.randomGameOver,
			skill: this.skillEngine ? {
				testId: null,
				invulnerable: false,
				registrySize: APPLIANCE_SKILL_REGISTRY.size,
				phase: this.skillEngine.state.phase,
				inputLocked: this.skillInputLocked,
				lives: this.skillEngine.state.currentLives,
				maxLives: this.skillEngine.state.maxLives,
				buff: this.skillEngine.state.buff?.id ?? null,
				buffTurnsRemaining: this.skillEngine.state.buff?.turnsRemaining ?? null,
				debuff: this.skillEngine.state.debuff?.id ?? null,
				debuffTurnsRemaining: this.skillEngine.state.debuff?.turnsRemaining ?? null,
				remainingCableIds: this.arrows.filter((arrow) => arrow.state !== "removed").map((arrow) => arrow.definition.id),
				lampHintCableId: this.skillEngine.state.lampHintCableId,
				popcornHintCableId: this.skillEngine.state.popcornHintCableId,
				cableEffects: [...this.models].map(([id, model]) => ({
					id,
					...model.skillVisualState
				})),
				effectAssets: this.skillEffects.activeAssetIds,
				popcornTransientCount: this.skillEffects.popcornTransientCount,
				microwaveMarkers: this.skillEffects.microwaveMarkerDiagnostics,
				popcornMarkers: this.skillEffects.popcornMarkerDiagnostics,
				bubbleShield: this.bubbleShield.diagnostics,
				soundWaveShield: this.soundWaveShield.diagnostics,
				dehumidifierDryShield: this.dehumidifierDryShield.diagnostics,
				portableSpeakerSpacing: this.portableSpeakerSpacing.diagnostics,
				dehumidifierCanopyPetals: this.petals.canopyFlowState,
				steamReveal: this.pipeline.steamRevealState,
				steamClear: this.pipeline.steamClearState,
				printerCopyReady: this.skillEngine.state.printerCopyReady,
				cardCount: this.skillEngine.cards.length,
				presentation: this.skillPresentation.diagnostics,
				televisionReconstruction: this.televisionReconstruction.diagnostics,
				toasterHeatSwap: this.toasterHeatSwap.diagnostics,
				refrigeratorFreeze: this.refrigeratorFreeze.diagnostics,
				kettleThaw: this.kettleThaw.diagnostics,
				washerSpin: this.washerSpin.diagnostics,
				refrigeratorScreenIce: this.refrigeratorScreenIce.diagnostics,
				coldParticles: this.petals.coldState,
				screenEffect: this.pipeline.skillEffectState
			} : null,
			rush: this.currentRushChallenge && this.rushRound ? {
				challengeId: this.currentRushChallenge.id,
				flow: this.rushFlow,
				phase: this.rushRound.phase,
				timeLimitSeconds: this.rushRound.timeLimitSeconds,
				remainingSeconds: this.rushRound.remainingSeconds,
				removals: this.rushRound.removalCount,
				mistakes: this.rushRound.mistakeCount
			} : null,
			doubleEndedHints: {
				briefingVisible: this.doubleEndedUi.briefingVisible,
				visibleEnds: [...this.models.values()].reduce((count, model) => count + model.availableEndCount, 0),
				visibleClickTargets: this.availableClickTargets.length
			},
			hint: {
				enabled: !this.hud.hintButton.disabled,
				target: this.activeHint,
				remaining: this.hintUsesRemaining,
				maximum: MAX_HINT_USES,
				visibleEnds: [...this.models.values()].reduce((count, model) => count + model.availableEndCount, 0),
				scale: [...this.models.values()].reduce((maximum, model) => Math.max(maximum, model.availableHintScale), 0)
			},
			levelId: this.currentLevel?.id ?? null,
			shape: this.currentLevel?.shape ?? null,
			totalArrows: this.arrows.length,
			doubleEndedCables: this.arrows.filter((arrow) => arrow.definition.doubleEnded).length,
			remainingArrows: this.arrows.length - this.removedCount,
			initiallyFree: this.puzzle?.initiallyFree ?? 0,
			lengthMix,
			availableArrows: this.availableCount,
			clickTarget: this.clickTarget,
			availableClickTargets: this.availableClickTargets,
			availableCableChoices: this.availableChoices.map(({ arrow, end }) => ({
				id: arrow.definition.id,
				end,
				color: arrow.definition.color
			})),
			blockedClickTarget: this.blockedClickTarget,
			activeAnimations: this.animations.length + this.pendingApplianceConnections.length + this.connections.activeCount,
			queuedConnections: this.pendingApplianceConnections.length,
			activeConnections: this.connections.activeCount,
			activeFlingMotions,
			completedFlingMotions: this.washerFlingHistory.map((entry) => ({ ...entry })),
			activeMotion: activeAnimation ? {
				id: activeAnimation.arrow.definition.id,
				end: activeAnimation.end,
				kind: activeAnimation.kind,
				color: activeAnimation.arrow.definition.color,
				targetId: activeAnimation.target?.id ?? null,
				targetAccent: activeAnimation.target?.accent ?? null,
				pathDistance: activeAnimation.model.motionDistance,
				rootOffset: activeAnimation.model.root.position.length()
			} : null,
			hoveredArrow: this.hoveredId,
			hoveredCableEnd: this.hoveredEnd,
			activeBurstPetals: this.petals.activeBurstCount,
			performances: this.performances.getStateSummary(),
			sensory: this.sensory.getDiagnostics(),
			theme: {
				season: this.season.snapshot,
				seasonParticles: this.petals.seasonState,
				...this.theme.snapshot,
				stars: this.sky.stars.geometry.drawRange.count,
				explorationEyes: {
					pairs: this.sky.explorationEyes.geometry.drawRange.count,
					progress: Number(this.sky.explorationEyes.material.uniforms.uProgress.value)
				},
				lantern: this.nightEnvironment.lantern,
				quality: this.adaptiveQuality.getDiagnostics()
			},
			audio: this.audio.getDiagnostics(),
			opening: {
				active: this.openingActive,
				ready: this.initialSceneReady,
				progress: this.startScreen.progress,
				transitioning: this.openingTransitioning,
				cameraPhase: this.openingCameraPhase,
				...this.openingScene.getStateSummary()
			},
			sceneVisibility: {
				arrows: this.arrowRoot.visible,
				appliances: this.appliances.root.visible,
				connections: this.connections.root.visible,
				opening: this.openingScene.root.visible
			},
			appliances: this.appliances.getStateSummary(),
			applianceReplacement: this.appliances.getReplacementDiagnostics(),
			routing: this.appliances.getRoutingSummary(),
			context: {
				losses: this.contextLosses,
				restores: this.contextRestores,
				lossAtMs: this.contextLossAtMs
			},
			timings: {
				generationMs: this.generationMs,
				modelBuildMs: this.modelBuildMs,
				preloadMaxSliceMs: this.preloadMaxSliceMs
			},
			renderer: {
				calls: info.render.calls,
				triangles: info.render.triangles,
				geometries: info.memory.geometries,
				textures: info.memory.textures
			},
			canvas: {
				clientWidth: this.canvas.clientWidth,
				clientHeight: this.canvas.clientHeight,
				width: this.canvas.width,
				height: this.canvas.height
			},
			orbit: this.orbit.getState()
		};
	}
	isDoubleEndedChallenge() {
		return this.currentMode === "random" && (this.puzzle?.challengeKind ?? this.currentLevel?.challengeKind) === "double-ended";
	}
};
//#endregion
export { Game };

import { Dt as Object3D, Fn as ShaderMaterial, H as Group, Hn as SphereGeometry, dr as Vector3, ft as MathUtils, ht as Mesh, mt as Matrix4, p as Color, ur as Vector2 } from "./three.core-DlTOC7bx.js";
import { n as PAL } from "./palette-knpLSfXB.js";
import { D as jelly, n as mergeVertices } from "./BufferGeometryUtils-B_UDylAy.js";
//#region src/appliances/ApplianceModelKit.ts
var HIDDEN_STATUS_MARKER = /(?:^|[-_])(status-indicator|status-dot|status-lamp|status-light|status-lens|power-led|power-status-indicator)(?:[-_]|$)/i;
var ApplianceModelKit = class {
	options;
	root = new Group();
	materials = /* @__PURE__ */ new Set();
	interactiveMeshes = [];
	nodes = /* @__PURE__ */ new Map();
	sockets = /* @__PURE__ */ new Map();
	indicatorMaterial;
	constructor(options) {
		this.options = options;
		this.root.name = `appliance-model-${options.id}`;
		this.root.userData.applianceAccent = options.accent;
		this.nodes.set("root", this.root);
		this.indicatorMaterial = this.material(8485263, { emissive: 0 });
		this.indicatorMaterial.emissiveIntensity = 0;
	}
	material(color, options = {}) {
		const material = jelly({
			color,
			emissive: options.emissive ?? 0,
			emissiveIntensity: options.emissive ? 0 : 1,
			transparent: options.transparent,
			opacity: options.opacity
		});
		this.materials.add(material);
		return material;
	}
	mesh(name, geometry, material, parent = this.root, outlined = true) {
		const mesh = new Mesh(geometry, material);
		mesh.name = name;
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		mesh.userData.applianceId = this.options.id;
		this.interactiveMeshes.push(mesh);
		this.nodes.set(name, mesh);
		parent.add(mesh);
		return mesh;
	}
	pivot(name, parent = this.root) {
		const pivot = new Group();
		pivot.name = name;
		pivot.userData.applianceId = this.options.id;
		parent.add(pivot);
		this.nodes.set(name, pivot);
		return pivot;
	}
	socket(name, parent, position) {
		const socket = new Object3D();
		socket.name = name;
		if (position instanceof Vector3) socket.position.copy(position);
		else socket.position.set(position[0], position[1], position[2]);
		socket.userData.socket = true;
		parent.add(socket);
		this.nodes.set(name, socket);
		this.sockets.set(name, socket);
		return socket;
	}
	indicator(position, radius = .045) {
		const indicator = this.mesh("status-indicator", new SphereGeometry(radius, 8, 6), this.indicatorMaterial, this.root, false);
		indicator.position.set(position[0], position[1], position[2]);
		return indicator;
	}
	finish(accuracy) {
		this.root.traverse((object) => {
			if (!(object instanceof Mesh) || !HIDDEN_STATUS_MARKER.test(object.name)) return;
			object.visible = false;
		});
		this.root.userData.sculptRuntime = {
			nodes: Object.fromEntries(this.nodes),
			sockets: Object.fromEntries(this.sockets),
			colliders: [{
				id: `${this.options.id}-body`,
				type: "box",
				node: "root"
			}],
			destructionGroups: []
		};
		this.root.userData.referenceAccuracy = accuracy;
		return {
			root: this.root,
			indicatorMaterial: this.indicatorMaterial,
			interactiveMeshes: this.interactiveMeshes,
			materials: this.materials,
			accuracy
		};
	}
};
function orientCylinderBetween(mesh, start, end) {
	const direction = end.clone().sub(start);
	mesh.position.copy(start).lerp(end, .5);
	mesh.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), direction.clone().normalize());
	mesh.scale.y = direction.length();
}
//#endregion
//#region src/systems/softDeformShader.ts
var SOFT_CAGE_UNIFORM_GLSL = `
  uniform vec3 uSoftLattice[27];
  uniform vec3 uSoftGrabLocal;
  uniform vec3 uSoftPinchLocal;
  uniform float uSoftGrabRadius;
  uniform mat4 uSoftRootWorldToLocal;
  uniform mat4 uSoftRootLocalToWorld;
  uniform vec3 uSoftBoundsMin;
  uniform vec3 uSoftBoundsMax;
  uniform vec3 uSoftPullLocal;
  uniform vec3 uSoftSurfaceNormalLocal;
  uniform float uSoftPullRatio;
  uniform float uSoftWholeCoupling;
  uniform float uSoftLocalGain;
  uniform float uSoftIndentStrength;
`;
var SOFT_CAGE_FUNCTION_GLSL = `
  vec3 softApplyCage(vec3 worldPosition) {
    vec3 localPosition = (uSoftRootWorldToLocal * vec4(worldPosition, 1.0)).xyz;
    vec3 boundsSize = max(uSoftBoundsMax - uSoftBoundsMin, vec3(0.0001));
    vec3 uv = clamp((localPosition - uSoftBoundsMin) / boundsSize, 0.0, 1.0);
    vec3 bx = vec3((1.0-uv.x)*(1.0-uv.x), 2.0*uv.x*(1.0-uv.x), uv.x*uv.x);
    vec3 by = vec3((1.0-uv.y)*(1.0-uv.y), 2.0*uv.y*(1.0-uv.y), uv.y*uv.y);
    vec3 bz = vec3((1.0-uv.z)*(1.0-uv.z), 2.0*uv.z*(1.0-uv.z), uv.z*uv.z);
    vec3 displacement = vec3(0.0);
    for (int z=0; z<3; z++) for (int y=0; y<3; y++) for (int x=0; x<3; x++) {
      displacement += uSoftLattice[x + y*3 + z*9] * bx[x] * by[y] * bz[z];
    }
    vec3 grabDelta = localPosition - uSoftGrabLocal;
    float pinchWeight = exp(-dot(grabDelta, grabDelta) / max(0.00001,uSoftGrabRadius*uSoftGrabRadius));
    localPosition += displacement + uSoftPinchLocal * pinchWeight;
    return (uSoftRootLocalToWorld * vec4(localPosition, 1.0)).xyz;
  }
`;
//#endregion
//#region src/render/sharedResources.ts
var SHARED_RESOURCE_FLAG = "sharedAcrossInstances";
function markSharedResource(resource) {
	resource.userData[SHARED_RESOURCE_FLAG] = true;
	return resource;
}
function isSharedResource(resource) {
	return resource.userData[SHARED_RESOURCE_FLAG] === true;
}
function disposeOwnedResource(resource) {
	if (resource && !isSharedResource(resource)) resource.dispose();
}
//#endregion
//#region src/style/outline.ts
var vertexShader = `
  uniform float uThickness;
  uniform float uVariation;
  uniform float uVariationPhase;
  uniform float uVisualInflation;
  uniform float uRevealEnabled;
  uniform float uRevealProgress;
  uniform float uRootFadeEnabled;
  uniform float uRootFadeStart;
  uniform float uRootFadeEnd;
  uniform vec2 uResolution;
  attribute float aCableProgress;
  varying float vOutlineCableProgress;
  varying float vOutlineLocalY;
  varying float vOutlineFacing;
  ${SOFT_CAGE_UNIFORM_GLSL}
  ${SOFT_CAGE_FUNCTION_GLSL}

  void main() {
    vOutlineCableProgress = aCableProgress;
    vOutlineLocalY = position.y;
    vec4 world = modelMatrix * vec4(position, 1.0);
    world.xyz += normalize(mat3(modelMatrix) * normal) * uVisualInflation;
    world.xyz = softApplyCage(world.xyz);

    vec4 mv = viewMatrix * world;
    vec3 n = normalize(normalMatrix * normal);
    vOutlineFacing = abs(dot(n, normalize(-mv.xyz)));
    vec4 clip = projectionMatrix * mv;
    vec3 clipN = normalize((projectionMatrix * vec4(n, 0.0)).xyz);
    vec2 aspect = vec2(uResolution.y / uResolution.x, 1.0);
    float stableThickness = uThickness;
    if (uVariation > 0.0001) {
      float lowFrequencyVariation =
        sin(dot(position, vec3(1.37, 0.83, 1.11)) + uVariationPhase) * 0.62 +
        sin(dot(position, vec3(0.41, 1.19, 0.67)) + uVariationPhase * 1.73) * 0.38;
      stableThickness *= 1.0 + lowFrequencyVariation * uVariation;
    }
    float deformOutlineScale = mix(1.0, 0.62, uSoftPullRatio);
    clip.xy += clipN.xy * aspect * stableThickness * deformOutlineScale * clip.w * 0.5;
    gl_Position = clip;
  }
`;
var fragmentShader = `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uRevealEnabled;
  uniform float uRevealProgress;
  uniform float uRootFadeEnabled;
  uniform float uRootFadeStart;
  uniform float uRootFadeEnd;
  uniform float uSilhouetteOnly;
  varying float vOutlineCableProgress;
  varying float vOutlineLocalY;
  varying float vOutlineFacing;
  void main() {
    if (uSilhouetteOnly > 0.5 && vOutlineFacing > 0.3) discard;
    if (uRevealEnabled > 0.5) {
      float revealDistance = 1.0 - vOutlineCableProgress;
      float reveal = 1.0 - smoothstep(
        uRevealProgress - 0.075,
        uRevealProgress + 0.025,
        revealDistance
      );
      if (uRevealProgress > 0.985) reveal = 1.0;
      if (reveal < 0.012) discard;
    }
    float rootFade = uRootFadeEnabled > 0.5
      ? smoothstep(uRootFadeStart, uRootFadeEnd, vOutlineLocalY)
      : 1.0;
    if (rootFade < 0.012) discard;
    gl_FragColor = vec4(uColor, uOpacity * rootFade);
  }
`;
var resolution = new Vector2(1920, 1080);
var materials = /* @__PURE__ */ new Set();
var geometryCache = /* @__PURE__ */ new WeakMap();
function setOutlineResolution(width, height) {
	resolution.set(width, height);
	materials.forEach((material) => {
		material.uniforms.uResolution.value.set(width, height);
	});
}
function smoothGeometry(geometry) {
	const cached = geometryCache.get(geometry);
	if (cached) return cached;
	let result;
	try {
		result = mergeVertices(geometry.clone(), 1e-4);
		result.computeVertexNormals();
	} catch {
		result = geometry.clone();
	}
	for (const name of Object.keys(result.attributes)) if (name !== "position" && name !== "normal" && name !== "aCableProgress") result.deleteAttribute(name);
	if (isSharedResource(geometry)) markSharedResource(result);
	geometryCache.set(geometry, result);
	return result;
}
function addHullOutline(mesh, thickness = .0037, color = PAL.ink) {
	const material = new ShaderMaterial({
		uniforms: {
			uThickness: { value: thickness },
			uVariation: { value: 0 },
			uVariationPhase: { value: 0 },
			uVisualInflation: { value: 0 },
			uRevealEnabled: { value: 0 },
			uRevealProgress: { value: 1 },
			uRootFadeEnabled: { value: 0 },
			uRootFadeStart: { value: 0 },
			uRootFadeEnd: { value: .2 },
			uSilhouetteOnly: { value: 0 },
			uColor: { value: new Color(color) },
			uOpacity: { value: 1 },
			uResolution: { value: resolution.clone() },
			uSoftRootWorldToLocal: { value: new Matrix4() },
			uSoftRootLocalToWorld: { value: new Matrix4() },
			uSoftBoundsMin: { value: new Vector3(-.5, -.5, -.5) },
			uSoftBoundsMax: { value: new Vector3(.5, .5, .5) },
			uSoftPullLocal: { value: new Vector3() },
			uSoftSurfaceNormalLocal: { value: new Vector3(0, 0, 1) },
			uSoftPullRatio: { value: 0 },
			uSoftWholeCoupling: { value: .78 },
			uSoftLocalGain: { value: .92 },
			uSoftIndentStrength: { value: .22 }
		},
		vertexShader,
		fragmentShader,
		side: 1,
		depthWrite: false,
		fog: false
	});
	materials.add(material);
	material.addEventListener("dispose", () => materials.delete(material));
	const outline = new Mesh(smoothGeometry(mesh.geometry), material);
	outline.name = `${mesh.name || "mesh"}-ink`;
	outline.userData.isOutline = true;
	outline.renderOrder = -1;
	mesh.add(outline);
	return outline;
}
function setHullOutlineStyle(outline, options) {
	if (!outline.userData.isOutline || !(outline.material instanceof ShaderMaterial)) return;
	const uniforms = outline.material.uniforms;
	if (uniforms.uThickness) uniforms.uThickness.value = options.thickness;
	if (uniforms.uVariation) uniforms.uVariation.value = MathUtils.clamp(options.variation ?? 0, 0, .35);
	if (uniforms.uVariationPhase) uniforms.uVariationPhase.value = options.phase ?? 0;
	if (options.color !== void 0 && uniforms.uColor?.value instanceof Color) uniforms.uColor.value.set(options.color);
	outline.userData.outlineThickness = options.thickness;
	outline.userData.outlineVariation = options.variation ?? 0;
}
function setHullOutlineSilhouetteOnly(outline, enabled) {
	if (!outline?.userData.isOutline || !(outline.material instanceof ShaderMaterial)) return;
	const uniform = outline.material.uniforms.uSilhouetteOnly;
	if (uniform) uniform.value = enabled ? 1 : 0;
	outline.userData.outlineSilhouetteOnly = enabled;
}
function setHullOutlineReveal(outline, progress) {
	if (!outline?.userData.isOutline || !(outline.material instanceof ShaderMaterial)) return;
	const uniforms = outline.material.uniforms;
	if (uniforms.uRevealEnabled) uniforms.uRevealEnabled.value = progress === null ? 0 : 1;
	if (uniforms.uRevealProgress) uniforms.uRevealProgress.value = progress === null ? 1 : MathUtils.clamp(progress, 0, 1);
}
/**
* Softens the lower part of an outline without fading the mesh itself. Ice
* spikes use this to keep a bold outer silhouette while their buried root
* visually merges into the surrounding ice shell.
*/
function setHullOutlineRootFade(outline, start, end = .24) {
	if (!outline?.userData.isOutline || !(outline.material instanceof ShaderMaterial)) return;
	const uniforms = outline.material.uniforms;
	if (uniforms.uRootFadeEnabled) uniforms.uRootFadeEnabled.value = start === null ? 0 : 1;
	if (start === null) return;
	if (uniforms.uRootFadeStart) uniforms.uRootFadeStart.value = start;
	if (uniforms.uRootFadeEnd) uniforms.uRootFadeEnd.value = Math.max(start + .001, end);
}
//#endregion
export { setHullOutlineStyle as a, markSharedResource as c, ApplianceModelKit as d, orientCylinderBetween as f, setHullOutlineSilhouetteOnly as i, SOFT_CAGE_FUNCTION_GLSL as l, setHullOutlineReveal as n, setOutlineResolution as o, setHullOutlineRootFade as r, disposeOwnedResource as s, addHullOutline as t, SOFT_CAGE_UNIFORM_GLSL as u };

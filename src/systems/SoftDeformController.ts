import { jellyDynamics } from './JellyDynamicsSettings';
import * as THREE from 'three';
import { preserveLatticeVolume } from './softLatticeVolume';
import { SOFT_CAGE_FUNCTION_GLSL, SOFT_CAGE_UNIFORM_GLSL } from './softDeformShader';

const DRAG_STIFFNESS = 380;
const DRAG_DAMPING = 27;
const RELEASE_STIFFNESS_NEAR = 150;
const RELEASE_STIFFNESS_FAR = 205;
const RELEASE_DAMPING_NEAR = 16;
const RELEASE_DAMPING_FAR = 3.15;
const MAX_STEP = 1 / 120;
const MAX_FRAME_CATCHUP = 0.25;
const SETTLED_DISTANCE = 0.0015;
const SETTLED_SPEED = 0.008;
const DEFAULT_MAX_PULL_RADIUS_RATIO = 0.36;
const CAGE_OPPOSITE_COUPLING = 0.48;
const CAGE_SURFACE_GAIN = 1.08;
const MAX_NORMAL_COMPRESSION_RATIO = 0.32;
const MAX_CAGE_SQUEEZE_RATIO = 0.34;
const CAGE_BULGE_FROM_SQUEEZE = 0.85;
const CAGE_BULGE_FROM_PULL = 0.055;
const RELEASE_SNAP_GAIN_FAR = 2.2;
const RELEASE_VELOCITY_RETENTION_NEAR = 0.12;

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = THREE.MathUtils.clamp((value - edge0) / Math.max(0.0001, edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export function softDeformWeightAtPoint(
  worldPoint: THREE.Vector3,
  grabWorld: THREE.Vector3,
  radiusWorld: number,
  viewDepthAxisWorld?: THREE.Vector3,
  wholeCoupling = CAGE_OPPOSITE_COUPLING,
  localGain = CAGE_SURFACE_GAIN,
): number {
  const fromGrab = worldPoint.clone().sub(grabWorld);
  if (viewDepthAxisWorld && viewDepthAxisWorld.lengthSq() > 0.000001) {
    const depthAxis = viewDepthAxisWorld.clone().normalize();
    fromGrab.addScaledVector(depthAxis, -fromGrab.dot(depthAxis));
  }
  const distance = fromGrab.length();
  const localWeight = 1 - smoothstep(radiusWorld * 0.08, Math.max(radiusWorld, 0.0001), distance);
  return THREE.MathUtils.lerp(wholeCoupling, localGain, localWeight);
}

export type SoftGrabProfile = {
  edgeFactor: number;
  cornerFactor: number;
  centerFactor: number;
  radiusScale: number;
  wholeCoupling: number;
  localGain: number;
  indentStrength: number;
};

export function softGrabProfile(
  grabLocal: THREE.Vector3,
  bounds: THREE.Box3,
  surfaceNormalLocal: THREE.Vector3,
): SoftGrabProfile {
  const center = bounds.getCenter(new THREE.Vector3());
  const halfSize = bounds.getSize(new THREE.Vector3()).multiplyScalar(0.5);
  const normalized = new THREE.Vector3(
    (grabLocal.x - center.x) / Math.max(0.001, halfSize.x),
    (grabLocal.y - center.y) / Math.max(0.001, halfSize.y),
    (grabLocal.z - center.z) / Math.max(0.001, halfSize.z),
  );
  const normal = surfaceNormalLocal.clone().normalize();
  const dominantAxis = Math.abs(normal.x) >= Math.abs(normal.y) && Math.abs(normal.x) >= Math.abs(normal.z)
    ? 0
    : Math.abs(normal.y) >= Math.abs(normal.z)
      ? 1
      : 2;
  const tangentAxes = dominantAxis === 0 ? [1, 2] : dominantAxis === 1 ? [0, 2] : [0, 1];
  const components = [Math.abs(normalized.x), Math.abs(normalized.y), Math.abs(normalized.z)];
  const edgePosition = Math.max(components[tangentAxes[0]], components[tangentAxes[1]]);
  const cornerPosition = Math.min(components[tangentAxes[0]], components[tangentAxes[1]]);
  const edgeFactor = smoothstep(0.44, 0.92, edgePosition);
  const cornerFactor = smoothstep(0.54, 0.94, cornerPosition);
  const centerFactor = 1 - smoothstep(0.28, 0.76, edgePosition);
  return {
    edgeFactor,
    cornerFactor,
    centerFactor,
    radiusScale: 1,
    wholeCoupling: THREE.MathUtils.lerp(CAGE_OPPOSITE_COUPLING, 0.6, edgeFactor),
    localGain: CAGE_SURFACE_GAIN + edgeFactor * 0.08 + cornerFactor * 0.1,
    indentStrength: THREE.MathUtils.lerp(0.24, 0.38, centerFactor),
  };
}

export type SoftCageParameters = {
  surfaceNormalLocal: THREE.Vector3;
  pullLocal: THREE.Vector3;
  pullRatio: number;
  wholeCoupling: number;
  localGain: number;
  indentStrength: number;
};

export function softCageDeformPoint(
  pointLocal: THREE.Vector3,
  bounds: THREE.Box3,
  parameters: SoftCageParameters,
  target = new THREE.Vector3(),
): THREE.Vector3 {
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const normal = parameters.surfaceNormalLocal.clone().normalize();
  const axisExtent = Math.max(
    0.0001,
    Math.abs(normal.x) * size.x + Math.abs(normal.y) * size.y + Math.abs(normal.z) * size.z,
  );
  const halfExtent = axisExtent * 0.5;
  const fromCenter = pointLocal.clone().sub(center);
  const layer = THREE.MathUtils.clamp(fromCenter.dot(normal) / halfExtent * 0.5 + 0.5, 0, 1);
  const layerEase = smoothstep(0, 1, layer);
  const cageWeight = THREE.MathUtils.lerp(
    parameters.wholeCoupling,
    parameters.localGain,
    layerEase,
  );
  const radial = fromCenter.clone().addScaledVector(normal, -fromCenter.dot(normal));
  const squeezeRatio = Math.min(
    parameters.pullLocal.length() * parameters.indentStrength / axisExtent,
    MAX_CAGE_SQUEEZE_RATIO,
  );
  return target
    .copy(pointLocal)
    .addScaledVector(parameters.pullLocal, cageWeight)
    .addScaledVector(normal, -fromCenter.dot(normal) * squeezeRatio)
    .addScaledVector(
      radial,
      squeezeRatio * CAGE_BULGE_FROM_SQUEEZE + parameters.pullRatio * CAGE_BULGE_FROM_PULL,
    );
}

export type SoftReboundProfile = {
  pullRatio: number;
  response: number;
  stiffness: number;
  damping: number;
  snapGain: number;
  velocityRetention: number;
};

export function softReboundProfile(pullLength: number, maxPullLength: number): SoftReboundProfile {
  const pullRatio = THREE.MathUtils.clamp(pullLength / Math.max(0.0001, maxPullLength), 0, 1);
  // Small pinches should settle quietly, while a deliberate deep knead needs
  // enough retained energy to read as a multi-cycle jelly rebound. Reaching
  // the full response before the absolute clamp keeps normal mouse gestures
  // from landing in the over-damped middle of the curve.
  const response = Math.pow(smoothstep(0.08, 0.72, pullRatio), 1.4);
  return {
    pullRatio,
    response,
    stiffness: THREE.MathUtils.lerp(RELEASE_STIFFNESS_NEAR, RELEASE_STIFFNESS_FAR, response),
    damping: THREE.MathUtils.lerp(RELEASE_DAMPING_NEAR, RELEASE_DAMPING_FAR, response),
    snapGain: RELEASE_SNAP_GAIN_FAR * response,
    velocityRetention: THREE.MathUtils.lerp(RELEASE_VELOCITY_RETENTION_NEAR, 1, response),
  };
}

type SoftUniforms = {
  uSoftGrabLocal: { value: THREE.Vector3 };
  uSoftGrabRadius: { value: number };
  uSoftPinchLocal: { value: THREE.Vector3 };
  uSoftLattice: { value: THREE.Vector3[] };
  uSoftRootWorldToLocal: { value: THREE.Matrix4 };
  uSoftRootLocalToWorld: { value: THREE.Matrix4 };
  uSoftBoundsMin: { value: THREE.Vector3 };
  uSoftBoundsMax: { value: THREE.Vector3 };
  uSoftPullLocal: { value: THREE.Vector3 };
  uSoftSurfaceNormalLocal: { value: THREE.Vector3 };
  uSoftPullRatio: { value: number };
  uSoftWholeCoupling: { value: number };
  uSoftLocalGain: { value: number };
  uSoftIndentStrength: { value: number };
};

const softProjectVertex = /* glsl */ `
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

function patchMeshMaterial(
  material: THREE.MeshToonMaterial | THREE.MeshBasicMaterial | THREE.MeshPhysicalMaterial,
  uniforms: SoftUniforms,
): void {
  if (material.userData.softDeformPatched) return;
  material.userData.softDeformPatched = true;

  const previousCompile = material.onBeforeCompile.bind(material);
  const previousCacheKey = material.customProgramCacheKey.bind(material);
  material.onBeforeCompile = (shader, renderer) => {
    previousCompile(shader, renderer);
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>\n${SOFT_CAGE_UNIFORM_GLSL}\n${SOFT_CAGE_FUNCTION_GLSL}`,
      )
       .replace('#include <defaultnormal_vertex>', `
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
      `)
      .replace('#include <project_vertex>', softProjectVertex)
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
        #if defined( USE_TRANSMISSION ) || defined( USE_SHADOWMAP ) || defined( USE_ENVMAP ) || defined( DISTANCE ) || defined( USE_SPOTLIGHTMAP )
          worldPosition = softWorldPosition;
        #endif
      `);
  };
  material.customProgramCacheKey = () => `${previousCacheKey()}|soft-lattice-local-pinch-v6`;
  material.needsUpdate = true;
}

function bindOutlineMaterial(material: THREE.ShaderMaterial, uniforms: SoftUniforms): void {
  Object.assign(material.uniforms, uniforms);
}

export class SoftDeformController {
  private readonly pinchVelocity = new THREE.Vector3();
  private readonly uniforms: SoftUniforms = {
    uSoftGrabLocal: { value: new THREE.Vector3() },
    uSoftGrabRadius: { value: 0.2 },
    uSoftPinchLocal: { value: new THREE.Vector3() },
    uSoftRootWorldToLocal: { value: new THREE.Matrix4() },
    uSoftRootLocalToWorld: { value: new THREE.Matrix4() },
    uSoftLattice: { value: Array.from({ length: 27 }, () => new THREE.Vector3()) },
    uSoftBoundsMin: { value: new THREE.Vector3(-0.5, -0.5, -0.5) },
    uSoftBoundsMax: { value: new THREE.Vector3(0.5, 0.5, 0.5) },
    uSoftPullLocal: { value: new THREE.Vector3() },
    uSoftSurfaceNormalLocal: { value: new THREE.Vector3(0, 0, 1) },
    uSoftPullRatio: { value: 0 },
    uSoftWholeCoupling: { value: CAGE_OPPOSITE_COUPLING },
    uSoftLocalGain: { value: CAGE_SURFACE_GAIN },
    uSoftIndentStrength: { value: 0.38 },
  };
  private readonly latticeVelocity = Array.from({ length: 27 }, () => new THREE.Vector3());
  private readonly latticePrevious = Array.from({ length: 27 }, () => new THREE.Vector3());
  private readonly latticeForce = Array.from({ length: 27 }, () => new THREE.Vector3());
  private readonly latticeTarget = new THREE.Vector3();
  private readonly latticeNode = new THREE.Vector3();
  private readonly latticeDelta = new THREE.Vector3();
  private latticeEnergy = 0;
  private readonly localGrab = new THREE.Vector3();
  private readonly baseGrabWorld = new THREE.Vector3();
  private readonly targetPull = new THREE.Vector3();
  private readonly pull = new THREE.Vector3();
  private readonly velocity = new THREE.Vector3();
  private readonly acceleration = new THREE.Vector3();
  private readonly releaseAxis = new THREE.Vector3(1, 0, 0);
  private readonly localSurfaceNormal = new THREE.Vector3(0, 0, 1);
  private readonly localBounds = new THREE.Box3();
  private readonly meshBounds = new THREE.Box3();
  private readonly relativeMatrix = new THREE.Matrix4();
  private readonly inverseRootMatrix = new THREE.Matrix4();
  private readonly localNormalMatrix = new THREE.Matrix3();
  private readonly localVectorMatrix = new THREE.Matrix3();
  private readonly shapeSize = new THREE.Vector3();
  private readonly localPull = new THREE.Vector3();
  private maxPullWorld = 1;
  private reboundPullRatio = 0;
  private reboundResponse = 0;
  private grabProfile: SoftGrabProfile = {
    edgeFactor: 0,
    cornerFactor: 0,
    centerFactor: 1,
    radiusScale: 1,
    wholeCoupling: CAGE_OPPOSITE_COUPLING,
    localGain: CAGE_SURFACE_GAIN,
    indentStrength: 0.38,
  };
  private renderableMeshCount = 0;
  private boundRenderableMeshCount = 0;
  private grabbing = false;
  private lastUpdateAt = performance.now();

  constructor(
    private readonly deformRoot: THREE.Object3D,
    private readonly surfaceRoot: THREE.Object3D = deformRoot,
  ) {
    const materials = new Set<THREE.Material>();
    surfaceRoot.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      this.renderableMeshCount += 1;
      const entries = Array.isArray(object.material) ? object.material : [object.material];
      entries.forEach((material) => materials.add(material));
      const fullyBound = entries.every((material) => {
        if (object.userData.isOutline && material instanceof THREE.ShaderMaterial) {
          bindOutlineMaterial(material, this.uniforms);
          return true;
        }
        return material instanceof THREE.MeshToonMaterial || material instanceof THREE.MeshBasicMaterial || material instanceof THREE.MeshPhysicalMaterial;
      });
      if (fullyBound) this.boundRenderableMeshCount += 1;
    });
    materials.forEach((material) => {
      if (material instanceof THREE.MeshToonMaterial || material instanceof THREE.MeshBasicMaterial || material instanceof THREE.MeshPhysicalMaterial) {
        patchMeshMaterial(material, this.uniforms);
      }
    });
    this.updateLocalBounds();
    this.syncUniforms();
  }

  applyInertia(worldVelocityChange: THREE.Vector3): void {
    this.deformRoot.updateWorldMatrix(true, false);
    const inverse = new THREE.Matrix3().setFromMatrix4(this.deformRoot.matrixWorld.clone().invert());
    const impulse = worldVelocityChange.clone().applyMatrix3(inverse);
    for (let i=0; i<27; i++) {
      const height = (Math.floor(i/3)%3)/2;
      this.latticeVelocity[i].addScaledVector(impulse, -(0.08 + height*0.7)*jellyDynamics.inertia);
    }
    this.latticeEnergy = 1;
  }

  nudge(): void {
    this.updateLocalBounds();
    const size = this.localBounds.getSize(this.shapeSize);
    // A lateral impulse varies with height, like shaking a pudding's support.
    for (let i = 0; i < 27; i++) {
      const height = (Math.floor(i / 3) % 3) / 2;
      this.latticeVelocity[i].x += size.x * (0.1 + height * 1.2);
      this.latticeVelocity[i].y -= size.y * 0.12 * height;
    }
    this.latticeEnergy = 1;
  }

  get isGrabbing(): boolean {
    return this.grabbing;
  }

  get isSettled(): boolean {
    return !this.grabbing && this.pull.length() < SETTLED_DISTANCE && this.velocity.length() < SETTLED_SPEED && this.latticeEnergy < 0.00001;
  }

  get pullLength(): number {
    return this.pull.length();
  }

  get signedPull(): number {
    return this.pull.dot(this.releaseAxis);
  }

  get lastReboundPullRatio(): number {
    return this.reboundPullRatio;
  }

  get lastReboundResponse(): number {
    return this.reboundResponse;
  }

  get totalRenderableMeshes(): number {
    return this.renderableMeshCount;
  }

  get boundRenderableMeshes(): number {
    return this.boundRenderableMeshCount;
  }

  get currentGrabProfile(): SoftGrabProfile {
    return this.grabProfile;
  }

  begin(
    grabWorld: THREE.Vector3,
    radiusWorld: number,
    maxPullWorld?: number,
    viewDepthAxisWorld?: THREE.Vector3,
    surfaceNormalWorld?: THREE.Vector3,
  ): void {
    this.deformRoot.updateWorldMatrix(true, true);
    this.localGrab.copy(this.deformRoot.worldToLocal(grabWorld.clone()));
    this.updateLocalBounds();
    this.inverseRootMatrix.copy(this.deformRoot.matrixWorld).invert();
    if (surfaceNormalWorld && surfaceNormalWorld.lengthSq() > 0.000001) {
      this.localNormalMatrix.setFromMatrix4(this.deformRoot.matrixWorld).transpose();
      this.localSurfaceNormal.copy(surfaceNormalWorld).applyNormalMatrix(this.localNormalMatrix);
    } else if (viewDepthAxisWorld && viewDepthAxisWorld.lengthSq() > 0.000001) {
      this.localNormalMatrix.setFromMatrix4(this.deformRoot.matrixWorld).transpose();
      this.localSurfaceNormal.copy(viewDepthAxisWorld).negate().applyNormalMatrix(this.localNormalMatrix);
    } else {
      this.localSurfaceNormal.set(0, 0, 1);
    }
    this.grabProfile = softGrabProfile(this.localGrab, this.localBounds, this.localSurfaceNormal);
    this.uniforms.uSoftWholeCoupling.value = this.grabProfile.wholeCoupling;
    this.uniforms.uSoftLocalGain.value = this.grabProfile.localGain;
    this.uniforms.uSoftIndentStrength.value = this.grabProfile.indentStrength;
    this.maxPullWorld = Math.max(
      0.001,
      maxPullWorld ?? radiusWorld * DEFAULT_MAX_PULL_RADIUS_RATIO,
    );
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

  setPointerWorld(pointerWorld: THREE.Vector3): void {
    if (!this.grabbing) return;
    this.updateBaseGrabWorld();
    this.targetPull.copy(pointerWorld).sub(this.baseGrabWorld);
    const length = this.targetPull.length();
    if (length > this.maxPullWorld) this.targetPull.multiplyScalar(this.maxPullWorld / length);
  }

  release(): void {
    if (!this.grabbing) return;
    if (this.pull.lengthSq() > 0.000001) this.releaseAxis.copy(this.pull).normalize();
    const rebound = softReboundProfile(this.pull.length(), this.maxPullWorld);
    this.reboundPullRatio = rebound.pullRatio;
    this.reboundResponse = rebound.response;
    this.velocity.multiplyScalar(rebound.velocityRetention);
    // Preserve distributed inertia; never add an artificial release kick.
    this.grabbing = false;
    this.targetPull.set(0, 0, 0);
    this.lastUpdateAt = performance.now();
  }

  reset(): void {
    this.uniforms.uSoftLattice.value.forEach(v => v.set(0, 0, 0));
    this.latticeVelocity.forEach(v => v.set(0, 0, 0));
    this.latticeEnergy = 0;
    this.uniforms.uSoftPinchLocal.value.set(0,0,0); this.pinchVelocity.set(0,0,0);
    this.grabbing = false;
    this.targetPull.set(0, 0, 0);
    this.pull.set(0, 0, 0);
    this.velocity.set(0, 0, 0);
    this.releaseAxis.set(1, 0, 0);
    this.uniforms.uSoftPullLocal.value.set(0, 0, 0);
    this.uniforms.uSoftPullRatio.value = 0;
    this.uniforms.uSoftWholeCoupling.value = CAGE_OPPOSITE_COUPLING;
    this.uniforms.uSoftLocalGain.value = CAGE_SURFACE_GAIN;
    this.uniforms.uSoftIndentStrength.value = 0.38;
    this.reboundPullRatio = 0;
    this.reboundResponse = 0;
    this.lastUpdateAt = performance.now();
    this.syncUniforms();
  }

  update(delta: number): void {
    this.updateBaseGrabWorld();
    const now = performance.now();
    const wallDelta = Math.max(0, (now - this.lastUpdateAt) / 1000);
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
      this.acceleration
        .copy(this.targetPull)
        .sub(this.pull)
        .multiplyScalar(stiffness)
        .addScaledVector(this.velocity, -damping);
      this.velocity.addScaledVector(this.acceleration, step);
      this.pull.addScaledVector(this.velocity, step);
      if (this.grabbing && this.pull.lengthSq() > 0.000001) {
        this.releaseAxis.copy(this.pull).normalize();
      }
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
  private stepLattice(dt: number): void {
    const nodes = this.uniforms.uSoftLattice.value;
    const size = this.localBounds.getSize(this.shapeSize);
    this.inverseRootMatrix.copy(this.deformRoot.matrixWorld).invert();
    this.localVectorMatrix.setFromMatrix4(this.inverseRootMatrix);
    this.latticeTarget.copy(this.targetPull).applyMatrix3(this.localVectorMatrix);
    const dimension = Math.max(size.x, size.y, size.z);
    const radius = dimension * jellyDynamics.radius;
    this.uniforms.uSoftGrabRadius.value = Math.max(dimension * 0.13, radius * 0.65);
    this.uniforms.uSoftGrabLocal.value.copy(this.localGrab);
    // A local spring resolves the sub-cell grab that the coarse cage cannot.
    const pinch = this.uniforms.uSoftPinchLocal.value;
    const pinchGain = 1 - THREE.MathUtils.smoothstep(jellyDynamics.radius, 0.12, 0.8);
    const pinchTarget = this.grabbing ? this.latticeTarget.clone().multiplyScalar(pinchGain * 1.35) : new THREE.Vector3();
    pinchTarget.clampLength(0, dimension * 0.65);
    const pinchStiffness = this.grabbing ? 150 : jellyDynamics.stiffness;
    const pinchDamping = this.grabbing ? 18 : jellyDynamics.damping;
    this.pinchVelocity.addScaledVector(pinchTarget.sub(pinch).multiplyScalar(pinchStiffness).addScaledVector(this.pinchVelocity,-pinchDamping),dt);
    pinch.addScaledVector(this.pinchVelocity,dt).clampLength(0,dimension*0.75);
    const limitX = Math.max(0.01, size.x * jellyDynamics.stretch);
    const limitY = Math.max(0.01, size.y * jellyDynamics.stretch);
    const limitZ = Math.max(0.01, size.z * jellyDynamics.stretch);
    for (let z=0; z<3; z++) for (let y=0; y<3; y++) for (let x=0; x<3; x++) {
      const i = x+y*3+z*9;
      this.latticeNode.set(x*size.x/2, y*size.y/2, z*size.z/2).add(this.localBounds.min);
      const weight = 0.015 + 0.985*Math.exp(-this.latticeNode.distanceToSquared(this.localGrab)/(radius*radius));
      const force = this.latticeForce[i].copy(nodes[i]).multiplyScalar(-jellyDynamics.stiffness)
        .addScaledVector(this.latticeVelocity[i], -jellyDynamics.damping);
      if (this.grabbing) force.addScaledVector(this.latticeDelta.copy(this.latticeTarget).multiplyScalar(weight).sub(nodes[i]), jellyDynamics.grab);
      for (const [dx,dy,dz] of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]) {
        const nx=x+dx, ny=y+dy, nz=z+dz;
        if (nx<0 || nx>2 || ny<0 || ny>2 || nz<0 || nz>2) continue;
        force.addScaledVector(this.latticeDelta.copy(nodes[nx+ny*3+nz*9]).sub(nodes[i]), jellyDynamics.coupling);
      }
    }
    this.latticeEnergy = pinch.lengthSq() + this.pinchVelocity.lengthSq();
    for (let i=0; i<27; i++) {
      this.latticePrevious[i].copy(nodes[i]);
      this.latticeVelocity[i].addScaledVector(this.latticeForce[i], dt);
      nodes[i].addScaledVector(this.latticeVelocity[i], dt);
    }
    preserveLatticeVolume(nodes, size, dt, jellyDynamics.volume);
    for (let i=0; i<27; i++) {
      nodes[i].set(
        THREE.MathUtils.clamp(nodes[i].x, -limitX, limitX),
        THREE.MathUtils.clamp(nodes[i].y, -limitY, limitY),
        THREE.MathUtils.clamp(nodes[i].z, -limitZ, limitZ),
      );
      // Constraint corrections participate in the next step's inertia.
      this.latticeVelocity[i].subVectors(nodes[i], this.latticePrevious[i]).divideScalar(dt);
      this.latticeEnergy += nodes[i].lengthSq() + this.latticeVelocity[i].lengthSq();
    }
  }

  private updateBaseGrabWorld(): void {
    this.deformRoot.updateWorldMatrix(true, true);
    this.baseGrabWorld.copy(this.localGrab);
    this.deformRoot.localToWorld(this.baseGrabWorld);
  }

  private syncUniforms(): void {
    this.deformRoot.updateWorldMatrix(true, true);
    this.uniforms.uSoftRootLocalToWorld.value.copy(this.deformRoot.matrixWorld);
    this.uniforms.uSoftRootWorldToLocal.value.copy(this.deformRoot.matrixWorld).invert();
    this.uniforms.uSoftBoundsMin.value.copy(this.localBounds.min);
    this.uniforms.uSoftBoundsMax.value.copy(this.localBounds.max);
    this.uniforms.uSoftSurfaceNormalLocal.value.copy(this.localSurfaceNormal);
    this.localVectorMatrix.setFromMatrix4(this.uniforms.uSoftRootWorldToLocal.value);
    this.localPull.copy(this.pull).applyMatrix3(this.localVectorMatrix);
    this.localBounds.getSize(this.shapeSize);
    const axisExtent = Math.max(
      0.0001,
      Math.abs(this.localSurfaceNormal.x) * this.shapeSize.x +
        Math.abs(this.localSurfaceNormal.y) * this.shapeSize.y +
        Math.abs(this.localSurfaceNormal.z) * this.shapeSize.z,
    );
    const normalAmount = this.localPull.dot(this.localSurfaceNormal);
    const clampedNormalAmount = THREE.MathUtils.clamp(
      normalAmount,
      -axisExtent * MAX_NORMAL_COMPRESSION_RATIO,
      axisExtent * MAX_NORMAL_COMPRESSION_RATIO,
    );
    this.localPull.addScaledVector(this.localSurfaceNormal, clampedNormalAmount - normalAmount);
    this.uniforms.uSoftPullLocal.value.copy(this.localPull);
    this.uniforms.uSoftPullRatio.value = THREE.MathUtils.clamp(
      this.pull.length() / Math.max(0.0001, this.maxPullWorld),
      0,
      1,
    );
  }

  private updateLocalBounds(): void {
    this.localBounds.makeEmpty();
    this.deformRoot.updateWorldMatrix(true, true);
    this.inverseRootMatrix.copy(this.deformRoot.matrixWorld).invert();
    this.surfaceRoot.traverse((object) => {
      if (
        !(object instanceof THREE.Mesh)
        || object.userData.isOutline
        || this.isPerformanceEffect(object)
      ) return;
      if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
      if (!object.geometry.boundingBox) return;
      this.relativeMatrix.multiplyMatrices(this.inverseRootMatrix, object.matrixWorld);
      this.meshBounds.copy(object.geometry.boundingBox).applyMatrix4(this.relativeMatrix);
      this.localBounds.union(this.meshBounds);
    });
    if (this.localBounds.isEmpty()) {
      this.localBounds.setFromCenterAndSize(this.localGrab, new THREE.Vector3(1, 1, 1));
    }
  }

  private isPerformanceEffect(object: THREE.Object3D): boolean {
    let current: THREE.Object3D | null = object;
    while (current) {
      if (current.userData.performanceEffect === true) return true;
      if (current === this.surfaceRoot) break;
      current = current.parent;
    }
    return false;
  }
}

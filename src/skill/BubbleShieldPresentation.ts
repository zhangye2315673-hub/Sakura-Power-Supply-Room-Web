import * as THREE from 'three';

const ENTER_SPEED = 5.8;
const EXIT_SPEED = 4.2;
const BOUNDS_PADDING = 1.14;
const MINIMUM_RADIUS = 1.25;
const WOBBLE_STIFFNESS = 26;
const WOBBLE_DAMPING = 4.2;
const MAX_WOBBLE = 0.32;

export type BubbleShieldDiagnostics = Readonly<{
  active: boolean;
  visible: boolean;
  opacity: number;
  center: readonly [number, number, number];
  radius: number;
  targetCount: number;
  depthWrite: boolean;
  side: 'front';
  wobble: readonly [number, number];
  wobbleAmplitude: number;
  surfaceIridescence: 'distributed';
  deformationMode: 'inertial-soft-body';
  surfaceNormalMode: 'smooth-radial';
  colorDistributionMode: 'balanced-spectrum';
}>;

type BubbleOrbitState = Readonly<{
  yaw: number;
  pitch: number;
}>;

type BubbleUniforms = {
  time: { value: number };
  visibility: { value: number };
  exitPulse: { value: number };
  inertia: { value: THREE.Vector2 };
};

function createThicknessTexture(): THREE.DataTexture {
  const width = 64;
  const height = 32;
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const u = x / width;
      const v = y / height;
      const broad = Math.sin(u * Math.PI * 2.0 + Math.sin(v * Math.PI * 2.0) * 1.35);
      const diagonal = Math.sin((u * 1.15 + v * 0.82) * Math.PI * 2.0 + 0.8);
      const vertical = Math.cos(v * Math.PI * 3.0 - u * 1.25);
      const value = THREE.MathUtils.clamp(0.5 + broad * 0.25 + diagonal * 0.19 + vertical * 0.13, 0, 1);
      const index = (y * width + x) * 4;
      data[index] = 255;
      data[index + 1] = Math.round(value * 255);
      data[index + 2] = 255;
      data[index + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  texture.name = 'bubble-shield-thickness-map';
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

function createMaterial(uniforms: BubbleUniforms, thicknessTexture: THREE.DataTexture): THREE.MeshPhysicalMaterial {
  const material = new THREE.MeshPhysicalMaterial({
    name: 'bubble-shield-iridescent-thin-film-material',
    color: 0xffffff,
    emissive: 0x000000,
    emissiveIntensity: 0,
    roughness: 0.08,
    metalness: 0,
    clearcoat: 0.32,
    clearcoatRoughness: 0.1,
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
    side: THREE.FrontSide,
  });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uBubbleTime = uniforms.time;
    shader.uniforms.uBubbleVisibility = uniforms.visibility;
    shader.uniforms.uBubbleExitPulse = uniforms.exitPulse;
    shader.uniforms.uBubbleInertia = uniforms.inertia;
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uBubbleTime;
        uniform vec2 uBubbleInertia;
        varying vec3 vBubbleWorldPosition;
        varying vec3 vBubbleWorldNormal;
        varying vec3 vBubbleRadialWorldNormal;
        varying vec3 vBubbleObjectPosition;`,
      )
      .replace(
        '#include <beginnormal_vertex>',
        `#include <beginnormal_vertex>
        vBubbleWorldNormal = normalize(mat3(modelMatrix) * objectNormal);`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
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
        vBubbleRadialWorldNormal = normalize(mat3(modelMatrix) * normalize(transformed));`,
      )
      .replace(
        '#include <worldpos_vertex>',
        `#include <worldpos_vertex>
        vBubbleWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uBubbleTime;
        uniform float uBubbleVisibility;
        uniform float uBubbleExitPulse;
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
        }`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
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
        float bubbleFilmAlpha = pow(bubbleFilmInterior, 1.7) * 0.3;
        float bubbleAlpha = 0.006 + pow(bubbleEdge, 0.8) * 0.28 + bubbleFilmAlpha;
        bubbleAlpha *= mix(0.9, 1.1, sin(vBubbleObjectPosition.y * 4.2 + uBubbleTime * 0.14) * 0.5 + 0.5);
        bubbleAlpha += uBubbleExitPulse * (1.0 - abs(bubbleFresnel - 0.58) * 1.7) * 0.055;
        float bubbleColorStrength = clamp(0.12 + bubbleEdge * 0.54 + bubbleFilmInterior * 1.18, 0.0, 1.0);
        diffuseColor.rgb = mix(diffuseColor.rgb, bubbleIridescence, bubbleColorStrength);
        diffuseColor.a *= clamp(bubbleAlpha * uBubbleVisibility, 0.0, 0.48);`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        totalEmissiveRadiance += bubbleIridescence
          * (pow(bubbleEdge, 0.72) * 0.78 + bubbleFilmInterior * 0.56)
          * uBubbleVisibility;`,
      );
  };
  material.customProgramCacheKey = () => 'sakura-bubble-shield-v2';
  return material;
}

export class BubbleShieldPresentation {
  readonly root = new THREE.Group();
  private readonly geometry = new THREE.SphereGeometry(1, 48, 32);
  private readonly thicknessTexture = createThicknessTexture();
  private readonly uniforms: BubbleUniforms = {
    time: { value: 0 },
    visibility: { value: 0 },
    exitPulse: { value: 0 },
    inertia: { value: new THREE.Vector2() },
  };
  private readonly material = createMaterial(this.uniforms, this.thicknessTexture);
  private readonly mesh = new THREE.Mesh(this.geometry, this.material);
  private readonly bounds = new THREE.Box3();
  private readonly sphere = new THREE.Sphere();
  private targetActive = false;
  private visibility = 0;
  private exitPulse = 0;
  private targetCount = 0;
  private radius = 0;
  private readonly wobble = new THREE.Vector2();
  private readonly wobbleVelocity = new THREE.Vector2();
  private readonly wobbleTarget = new THREE.Vector2();
  private previousOrbitYaw: number | null = null;
  private previousOrbitPitch: number | null = null;

  constructor() {
    this.root.name = 'bubble-shield-presentation';
    this.mesh.name = 'bubble-shield-thin-film';
    this.mesh.renderOrder = 18;
    this.mesh.visible = false;
    this.root.add(this.mesh);
  }

  sync(active: boolean, targets: readonly THREE.Object3D[]): void {
    this.targetActive = active && targets.length > 0;
    this.targetCount = this.targetActive ? targets.length : 0;
    if (!this.targetActive) {
      if (this.visibility > 0.02) this.exitPulse = 1;
      return;
    }
    this.bounds.makeEmpty();
    targets.forEach((target) => {
      target.updateWorldMatrix(true, true);
      this.bounds.expandByObject(target, true);
    });
    if (this.bounds.isEmpty()) {
      this.targetActive = false;
      this.targetCount = 0;
      return;
    }
    this.bounds.getBoundingSphere(this.sphere);
    this.radius = Math.max(MINIMUM_RADIUS, this.sphere.radius * BOUNDS_PADDING);
    this.root.position.copy(this.sphere.center);
    this.root.scale.setScalar(this.radius);
    this.mesh.visible = true;
  }

  update(delta: number, elapsed: number, orbit?: BubbleOrbitState): void {
    this.updateWobble(delta, orbit);
    const speed = this.targetActive ? ENTER_SPEED : EXIT_SPEED;
    const blend = 1 - Math.exp(-Math.max(0, delta) * speed);
    this.visibility = THREE.MathUtils.lerp(this.visibility, this.targetActive ? 1 : 0, blend);
    this.exitPulse = Math.max(0, this.exitPulse - Math.max(0, delta) * 1.8);
    this.uniforms.time.value = elapsed;
    this.uniforms.visibility.value = this.visibility;
    this.uniforms.exitPulse.value = this.exitPulse;
    this.uniforms.inertia.value.copy(this.wobble);
    this.thicknessTexture.offset.set(elapsed * 0.0038, -elapsed * 0.0024);
    const reveal = THREE.MathUtils.smoothstep(this.visibility, 0, 1);
    this.mesh.scale.setScalar(THREE.MathUtils.lerp(0.86, 1, reveal));
    this.mesh.rotation.y = Math.sin(elapsed * 0.08) * 0.025 + this.wobble.x * 0.18;
    this.mesh.rotation.z = Math.sin(elapsed * 0.065 + 1.2) * 0.018 - this.wobble.y * 0.16;
    if (!this.targetActive && this.visibility < 0.002) {
      this.visibility = 0;
      this.mesh.visible = false;
    }
  }

  private updateWobble(delta: number, orbit?: BubbleOrbitState): void {
    const step = Math.min(Math.max(delta, 0), 0.05);
    this.wobbleTarget.set(0, 0);
    if (orbit) {
      if (this.previousOrbitYaw !== null && this.previousOrbitPitch !== null && step > 0) {
        const yawDelta = Math.atan2(
          Math.sin(orbit.yaw - this.previousOrbitYaw),
          Math.cos(orbit.yaw - this.previousOrbitYaw),
        );
        const pitchDelta = orbit.pitch - this.previousOrbitPitch;
        if (this.targetActive) {
          this.wobbleTarget.set(
            THREE.MathUtils.clamp((yawDelta / step) * 0.1, -MAX_WOBBLE, MAX_WOBBLE),
            THREE.MathUtils.clamp((pitchDelta / step) * 0.11, -MAX_WOBBLE * 0.82, MAX_WOBBLE * 0.82),
          );
        }
      }
      this.previousOrbitYaw = orbit.yaw;
      this.previousOrbitPitch = orbit.pitch;
    }
    if (step <= 0) return;
    this.wobbleVelocity.x += (this.wobbleTarget.x - this.wobble.x) * WOBBLE_STIFFNESS * step;
    this.wobbleVelocity.y += (this.wobbleTarget.y - this.wobble.y) * WOBBLE_STIFFNESS * step;
    const damping = Math.exp(-WOBBLE_DAMPING * step);
    this.wobbleVelocity.multiplyScalar(damping);
    this.wobble.addScaledVector(this.wobbleVelocity, step);
    if (this.wobble.length() > MAX_WOBBLE) this.wobble.setLength(MAX_WOBBLE);
  }

  reset(): void {
    this.targetActive = false;
    this.visibility = 0;
    this.exitPulse = 0;
    this.targetCount = 0;
    this.radius = 0;
    this.wobble.set(0, 0);
    this.wobbleVelocity.set(0, 0);
    this.wobbleTarget.set(0, 0);
    this.previousOrbitYaw = null;
    this.previousOrbitPitch = null;
    this.uniforms.visibility.value = 0;
    this.uniforms.exitPulse.value = 0;
    this.uniforms.inertia.value.set(0, 0);
    this.mesh.visible = false;
  }

  dispose(): void {
    this.root.removeFromParent();
    this.geometry.dispose();
    this.material.dispose();
    this.thicknessTexture.dispose();
  }

  get diagnostics(): BubbleShieldDiagnostics {
    return {
      active: this.targetActive,
      visible: this.mesh.visible,
      opacity: this.visibility,
      center: this.root.position.toArray(),
      radius: this.radius,
      targetCount: this.targetCount,
      depthWrite: this.material.depthWrite,
      side: 'front',
      wobble: this.wobble.toArray(),
      wobbleAmplitude: this.wobble.length(),
      surfaceIridescence: 'distributed',
      deformationMode: 'inertial-soft-body',
      surfaceNormalMode: 'smooth-radial',
      colorDistributionMode: 'balanced-spectrum',
    };
  }
}

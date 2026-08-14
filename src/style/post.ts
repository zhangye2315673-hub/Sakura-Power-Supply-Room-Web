import * as THREE from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { PAL } from './palette';
import type { NightQualityTier } from '../theme/ThemeController';

const NIGHT_INK = new THREE.Color(0x4b455f);

type ShaderDefinition = {
  uniforms: Record<string, THREE.IUniform>;
  vertexShader: string;
  fragmentShader: string;
};

export type SkillScreenEffect =
  | 'none'
  | 'bathroom-steam'
  | 'coffee-lock'
  | 'television-glitch'
  | 'printer-scan'
  | 'iridescent-bubble';

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const inkShader: ShaderDefinition = {
  uniforms: {
    tDiffuse: { value: null },
    tDepth: { value: null },
    uTexel: { value: new THREE.Vector2() },
    uNear: { value: 0.1 },
    uFar: { value: 100 },
    uInk: { value: new THREE.Color(PAL.ink) },
    uThickness: { value: 1.35 },
    uSens: { value: 0.0042 },
    uConcave: { value: 0.026 },
    uConcaveAmount: { value: 0.42 },
    uStrength: { value: 0.92 },
    uSkyDepth: { value: 80 },
  },
  vertexShader,
  fragmentShader: /* glsl */ `
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
  `,
};

const gradeShader: ShaderDefinition = {
  uniforms: {
    tDiffuse: { value: null },
    uShadowTint: { value: new THREE.Color(0xada8d0) },
    uLightTint: { value: new THREE.Color(0xfff7e8) },
    uSaturation: { value: 1.1 },
    uLift: { value: 0.03 },
    uVignette: { value: 0.1 },
    uWarmth: { value: 0.045 },
    uThemeProgress: { value: 0 },
  },
  vertexShader,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec3 uShadowTint, uLightTint;
    uniform float uSaturation, uLift, uVignette, uWarmth, uThemeProgress;
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
      c += uLift * (1.0 - k);
      c = mix(vec3(l), c, uSaturation);
      float r = length(vUv - 0.5) * 1.42;
      c *= 1.0 - uVignette * pow(clamp(r, 0.0, 1.0), 2.6);
      vec3 srgb = linearToSRGB(max(c, vec3(0.0)));
      float nightLuma = dot(srgb, vec3(0.2126, 0.7152, 0.0722));
      vec3 night = mix(vec3(nightLuma), srgb, 1.14) * 0.77;
      night *= vec3(0.97, 0.99, 1.04);
      night += vec3(0.025, 0.03, 0.062) * (1.0 - nightLuma);
      gl_FragColor = vec4(mix(srgb, night, uThemeProgress), 1.0);
    }
  `,
};

const lanternShader: ShaderDefinition = {
  uniforms: {
    tDiffuse: { value: null },
    tDepth: { value: null },
    uLantern: { value: new THREE.Vector2() },
    uAspect: { value: 1 },
    uIntensity: { value: 0 },
    uThemeProgress: { value: 0 },
    uColor: { value: new THREE.Color(0xffcfad) },
  },
  vertexShader,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform sampler2D tDepth;
    uniform vec2 uLantern;
    uniform float uAspect, uIntensity, uThemeProgress;
    uniform vec3 uColor;
    varying vec2 vUv;

    void main() {
      vec3 color = texture2D(tDiffuse, vUv).rgb;
      float depth = texture2D(tDepth, vUv).x;
      vec2 delta = vUv - (uLantern * 0.5 + 0.5);
      delta.x *= uAspect;
      float distanceToLight = length(delta);
      float core = exp(-pow(distanceToLight / 0.062, 2.0));
      float falloff = exp(-pow(distanceToLight / 0.155, 1.38));
      float sceneMask = 1.0 - smoothstep(0.994, 1.0, depth);
      // Preserve the lantern's bloom-like centre while taking exactly five
      // percent off the hottest core so cable intersections do not white out.
      float exposure = (core * 0.2527 + falloff * 0.38) * uIntensity * uThemeProgress * sceneMask;
      vec3 huePreservingLight = color * mix(vec3(1.0), uColor, 0.18);
      color += huePreservingLight * exposure;
      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

const bloomShader: ShaderDefinition = {
  uniforms: {
    tDiffuse: { value: null },
    uTexel: { value: new THREE.Vector2() },
    uSampleScale: { value: 1 },
  },
  vertexShader,
  fragmentShader: /* glsl */ `
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
  `,
};

const bloomCompositeShader: ShaderDefinition = {
  uniforms: {
    tDiffuse: { value: null },
    tBloom: { value: null },
    uStrength: { value: 0 },
  },
  vertexShader,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform sampler2D tBloom;
    uniform float uStrength;
    varying vec2 vUv;

    void main() {
      vec3 base = texture2D(tDiffuse, vUv).rgb;
      vec3 glow = texture2D(tBloom, vUv).rgb;
      gl_FragColor = vec4(base + glow * uStrength, 1.0);
    }
  `,
};

const fxaaShader: ShaderDefinition = {
  uniforms: {
    tDiffuse: { value: null },
    uTexel: { value: new THREE.Vector2() },
  },
  vertexShader,
  fragmentShader: /* glsl */ `
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
  `,
};

const skillEffectShader: ShaderDefinition = {
  uniforms: {
    tDiffuse: { value: null },
    uTexel: { value: new THREE.Vector2() },
    uTime: { value: 0 },
    uEffect: { value: 0 },
  },
  vertexShader,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec2 uTexel;
    uniform float uTime;
    uniform int uEffect;
    varying vec2 vUv;

    float hash(vec2 point) {
      return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453);
    }

    void main() {
      vec2 uv = vUv;
      vec3 color = texture2D(tDiffuse, uv).rgb;
      if (uEffect == 1) {
        float wave = sin(uv.y * 18.0 + uTime * 0.7) * 0.5 + 0.5;
        vec2 drift = vec2(sin(uv.y * 11.0 + uTime) * uTexel.x * 5.0, uTexel.y * 3.0);
        vec3 blur = texture2D(tDiffuse, uv + drift).rgb;
        blur += texture2D(tDiffuse, uv - drift).rgb;
        blur += texture2D(tDiffuse, uv + vec2(uTexel.x * 7.0, 0.0)).rgb;
        blur += texture2D(tDiffuse, uv - vec2(uTexel.x * 7.0, 0.0)).rgb;
        blur *= 0.25;
        float mist = 0.28 + wave * 0.16 + hash(floor(uv * 24.0)) * 0.04;
        color = mix(color, blur * vec3(0.91, 0.98, 1.02) + vec3(0.1), mist);
      } else if (uEffect == 2) {
        float dripNoise = hash(vec2(floor(uv.x * 13.0), 3.0));
        float drip = smoothstep(0.78 - dripNoise * 0.34, 0.72 - dripNoise * 0.34, uv.y);
        float rivulet = smoothstep(0.09, 0.0, abs(fract(uv.x * 13.0) - 0.5));
        float liquid = clamp(drip * (0.48 + rivulet * 0.32), 0.0, 0.78);
        color = mix(color, color * vec3(0.48, 0.29, 0.2) + vec3(0.08, 0.025, 0.01), liquid);
      } else if (uEffect == 3) {
        float band = step(0.72, hash(vec2(floor(uv.y * 42.0 + uTime * 18.0), floor(uTime * 8.0))));
        float shift = (hash(vec2(floor(uv.y * 31.0), floor(uTime * 12.0))) - 0.5) * 0.035 * band;
        color.r = texture2D(tDiffuse, uv + vec2(shift + uTexel.x * 2.0, 0.0)).r;
        color.b = texture2D(tDiffuse, uv - vec2(shift + uTexel.x * 2.0, 0.0)).b;
        color += band * vec3(0.05, 0.0, 0.08);
      } else if (uEffect == 4) {
        float scan = smoothstep(0.035, 0.0, abs(fract(uv.y * 1.4 - uTime * 0.9) - 0.5));
        color = mix(color, vec3(1.0, 0.91, 0.78), scan * 0.62);
      } else if (uEffect == 5) {
        vec2 centered = uv - 0.5;
        float radius = length(centered);
        vec2 refracted = uv + normalize(centered + 0.0001) * sin(radius * 38.0 - uTime * 1.2) * 0.0025;
        vec3 shifted = texture2D(tDiffuse, refracted).rgb;
        shifted.r = texture2D(tDiffuse, refracted + vec2(uTexel.x * 2.0, 0.0)).r;
        shifted.b = texture2D(tDiffuse, refracted - vec2(uTexel.x * 2.0, 0.0)).b;
        float shell = smoothstep(0.53, 0.35, radius) * smoothstep(0.08, 0.42, radius);
        color = mix(color, shifted + vec3(0.035, 0.025, 0.05), shell * 0.36);
      }
      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

function makeQuad(definition: ShaderDefinition): {
  quad: FullScreenQuad;
  material: THREE.ShaderMaterial;
} {
  const material = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.clone(definition.uniforms),
    vertexShader: definition.vertexShader,
    fragmentShader: definition.fragmentShader,
    depthTest: false,
    depthWrite: false,
  });
  return { quad: new FullScreenQuad(material), material };
}

export class SakuraPipeline {
  readonly size = new THREE.Vector2(1, 1);
  readonly sceneTarget: THREE.WebGLRenderTarget;
  private readonly targetA: THREE.WebGLRenderTarget;
  private readonly targetB: THREE.WebGLRenderTarget;
  private readonly bloomTarget: THREE.WebGLRenderTarget;
  private readonly ink = makeQuad(inkShader);
  private readonly grade = makeQuad(gradeShader);
  private readonly lantern = makeQuad(lanternShader);
  private readonly bloom = makeQuad(bloomShader);
  private readonly bloomComposite = makeQuad(bloomCompositeShader);
  private readonly fxaa = makeQuad(fxaaShader);
  private readonly skillEffect = makeQuad(skillEffectShader);
  private qualityTier: NightQualityTier = 'high';
  private themeProgress = 0;
  private renderWidth = 2;
  private renderHeight = 2;

  constructor(
    private readonly renderer: THREE.WebGLRenderer,
    private readonly scene: THREE.Scene,
    private readonly camera: THREE.PerspectiveCamera,
    private readonly pixelBudget = 4.6e6,
  ) {
    const options: THREE.RenderTargetOptions = {
      type: THREE.HalfFloatType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: true,
      stencilBuffer: false,
      colorSpace: THREE.NoColorSpace,
    };
    this.sceneTarget = new THREE.WebGLRenderTarget(2, 2, options);
    this.sceneTarget.depthTexture = new THREE.DepthTexture(2, 2);
    this.sceneTarget.depthTexture.format = THREE.DepthFormat;
    this.sceneTarget.depthTexture.type = THREE.UnsignedIntType;
    this.sceneTarget.depthTexture.minFilter = THREE.NearestFilter;
    this.sceneTarget.depthTexture.magFilter = THREE.NearestFilter;

    this.targetA = new THREE.WebGLRenderTarget(2, 2, { ...options, depthBuffer: false });
    this.targetB = new THREE.WebGLRenderTarget(2, 2, {
      ...options,
      type: THREE.UnsignedByteType,
      depthBuffer: false,
    });
    this.bloomTarget = new THREE.WebGLRenderTarget(2, 2, {
      ...options,
      type: THREE.UnsignedByteType,
      depthBuffer: false,
    });
    this.ink.material.uniforms.tDepth.value = this.sceneTarget.depthTexture;
    this.lantern.material.uniforms.tDepth.value = this.sceneTarget.depthTexture;
  }

  setSize(width: number, height: number): void {
    const dpr = window.devicePixelRatio || 1;
    let scale = dpr < 1.5 ? 1.25 : Math.min(dpr, 2);
    if (width * height * scale * scale > this.pixelBudget) {
      scale = Math.max(1, Math.sqrt(this.pixelBudget / (width * height)));
    }
    const renderWidth = Math.max(2, Math.floor(width * scale));
    const renderHeight = Math.max(2, Math.floor(height * scale));
    this.renderWidth = renderWidth;
    this.renderHeight = renderHeight;
    this.size.set(renderWidth, renderHeight);

    this.renderer.setPixelRatio(1);
    this.renderer.setSize(width, height, false);
    this.sceneTarget.setSize(renderWidth, renderHeight);
    this.targetA.setSize(renderWidth, renderHeight);
    this.targetB.setSize(renderWidth, renderHeight);
    this.resizeBloomTarget();

    const texel = new THREE.Vector2(1 / renderWidth, 1 / renderHeight);
    this.ink.material.uniforms.uTexel.value.copy(texel);
    this.fxaa.material.uniforms.uTexel.value.copy(texel);
    this.skillEffect.material.uniforms.uTexel.value.copy(texel);
    this.lantern.material.uniforms.uAspect.value = renderWidth / renderHeight;
    this.ink.material.uniforms.uNear.value = this.camera.near;
    this.ink.material.uniforms.uFar.value = this.camera.far;
    this.ink.material.uniforms.uThickness.value = 1.0 + 0.52 * scale;
  }

  render(): void {
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
    if (this.themeProgress > 0.0001) {
      this.lantern.material.uniforms.tDiffuse.value = this.targetB.texture;
      this.renderer.setRenderTarget(this.targetA);
      this.lantern.quad.render(this.renderer);
      fxaaSource = this.targetA.texture;

      if (this.qualityTier !== 'minimal') {
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

    this.skillEffect.material.uniforms.tDiffuse.value = fxaaTarget.texture;
    this.skillEffect.material.uniforms.uTime.value = performance.now() * 0.001;
    this.renderer.setRenderTarget(null);
    this.skillEffect.quad.render(this.renderer);
  }

  setSkillEffect(effect: SkillScreenEffect): void {
    const modes: Record<SkillScreenEffect, number> = {
      none: 0,
      'bathroom-steam': 1,
      'coffee-lock': 2,
      'television-glitch': 3,
      'printer-scan': 4,
      'iridescent-bubble': 5,
    };
    this.skillEffect.material.uniforms.uEffect.value = modes[effect];
  }

  setThemeProgress(progress: number): void {
    const value = THREE.MathUtils.clamp(progress, 0, 1);
    this.themeProgress = value;
    this.grade.material.uniforms.uThemeProgress.value = value;
    this.lantern.material.uniforms.uThemeProgress.value = value;
    this.bloomComposite.material.uniforms.uStrength.value = this.qualityTier === 'minimal' ? 0 : value * 0.2;
    this.ink.material.uniforms.uInk.value.set(PAL.ink).lerp(NIGHT_INK, value);
    this.ink.material.uniforms.uStrength.value = THREE.MathUtils.lerp(0.92, 0.76, value);
  }

  setLantern(position: THREE.Vector2, intensity: number): void {
    this.lantern.material.uniforms.uLantern.value.copy(position);
    this.lantern.material.uniforms.uIntensity.value = THREE.MathUtils.clamp(intensity, 0, 1);
  }

  setQualityTier(tier: NightQualityTier): void {
    this.qualityTier = tier;
    this.bloom.material.uniforms.uSampleScale.value = 1;
    this.bloomComposite.material.uniforms.uStrength.value = tier === 'minimal' ? 0 : this.themeProgress * 0.2;
    this.resizeBloomTarget();
  }

  dispose(): void {
    this.sceneTarget.dispose();
    this.targetA.dispose();
    this.targetB.dispose();
    this.bloomTarget.dispose();
    for (const pass of [
      this.ink,
      this.grade,
      this.lantern,
      this.bloom,
      this.bloomComposite,
      this.fxaa,
      this.skillEffect,
    ]) {
      pass.quad.dispose();
      pass.material.dispose();
    }
  }

  private resizeBloomTarget(): void {
    const scale = this.qualityTier === 'high' ? 1 : 0.5;
    const width = Math.max(2, Math.floor(this.renderWidth * scale));
    const height = Math.max(2, Math.floor(this.renderHeight * scale));
    this.bloomTarget.setSize(width, height);
    this.bloom.material.uniforms.uTexel.value.set(1 / width, 1 / height);
  }
}

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
  | 'toaster-heat'
  | 'kettle-thaw-heat'
  | 'microwave-heat'
  | 'printer-scan'
  | 'blue-screen'
  | 'iridescent-bubble';

export const TELEVISION_GLITCH_BURST_WINDOWS = Object.freeze([
  { start: 0.02, attackEnd: 0.055, releaseStart: 0.14, end: 0.23 },
  { start: 0.78, attackEnd: 0.82, releaseStart: 0.93, end: 1.04 },
  { start: 1.65, attackEnd: 1.69, releaseStart: 1.79, end: 1.90 },
  { start: 2.72, attackEnd: 2.76, releaseStart: 2.87, end: 2.98 },
  { start: 4.08, attackEnd: 4.12, releaseStart: 4.25, end: 4.38 },
] as const);

function smoothstep01(value: number): number {
  const clamped = THREE.MathUtils.clamp(value, 0, 1);
  return clamped * clamped * (3 - 2 * clamped);
}

export function sampleTelevisionGlitchBurst(age: number): number {
  return TELEVISION_GLITCH_BURST_WINDOWS.reduce((strongest, window) => {
    if (age < window.start || age >= window.end) return strongest;
    const attack = smoothstep01((age - window.start) / (window.attackEnd - window.start));
    const release = 1 - smoothstep01((age - window.releaseStart) / (window.end - window.releaseStart));
    return Math.max(strongest, attack * release);
  }, 0);
}

export class SkillEffectActivationTimeline {
  private televisionStartedAt = 0;
  private effectActivationCount = 0;

  activate(
    effect: SkillScreenEffect,
    previousEffect: SkillScreenEffect,
    immediate: boolean,
    nowSeconds = performance.now() * 0.001,
  ): void {
    if (effect === 'none' || (effect === previousEffect && !immediate)) return;
    if (effect === 'television-glitch') this.televisionStartedAt = nowSeconds;
    this.effectActivationCount += 1;
  }

  age(effect: SkillScreenEffect, nowSeconds = performance.now() * 0.001): number {
    return effect === 'television-glitch'
      ? Math.max(0, nowSeconds - this.televisionStartedAt)
      : 0;
  }

  get activationCount(): number {
    return this.effectActivationCount;
  }
}

const televisionGlitchBurstGlsl = TELEVISION_GLITCH_BURST_WINDOWS
  .map((window) => `glitchEnvelope(age, ${window.start.toFixed(3)}, ${window.attackEnd.toFixed(3)}, ${window.releaseStart.toFixed(3)}, ${window.end.toFixed(3)})`)
  .reduce((expression, burst) => `max(${expression}, ${burst})`);

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
    uExplorationProgress: { value: 0 },
  },
  vertexShader,
  fragmentShader: /* glsl */ `
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
    uExplorationProgress: { value: 0 },
    uColor: { value: new THREE.Color(0xffcfad) },
  },
  vertexShader,
  fragmentShader: /* glsl */ `
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

const steamBlurShader: ShaderDefinition = {
  uniforms: {
    tDiffuse: { value: null },
    uDirection: { value: new THREE.Vector2() },
  },
  vertexShader,
  fragmentShader: /* glsl */ `
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
  `,
};

type SteamTrailPoint = {
  x: number;
  y: number;
  radius: number;
  life: number;
};

type SteamMicroDrop = {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  growthRate: number;
  opacity: number;
  age: number;
  life: number;
  active: boolean;
};

type SteamMotionStyle = 'surge' | 'burst' | 'stutter' | 'steady';

type SteamDrop = {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  drift: number;
  resistance: number;
  mobility: number;
  motionStyle: SteamMotionStyle;
  phase: number;
  burstAt: number;
  burstTriggered: boolean;
  sizeVelocity: number;
  motionTimer: number;
  distanceSinceTrail: number;
  nextTrailDistance: number;
  wait: number;
  age: number;
  life: number;
  trail: SteamTrailPoint[];
};

/**
 * Small CPU-side condensation field. It is deliberately a single low-resolution
 * texture: the scene stays in the existing Three.js post stack while this field
 * only carries droplet height (R) and wet trails (G).
 */
class SteamCondensationField {
  readonly texture: THREE.CanvasTexture;
  readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private readonly microDrops: SteamMicroDrop[] = [];
  private readonly drops: SteamDrop[] = [];
  private width = 256;
  private height = 144;
  private randomState = 0x6d2b79f5;
  private elapsed = 0;
  private lastStep = 0;
  private lastPaint = -1;
  private spawnClock = 0;
  private microSpawnClock = 0;
  private active = false;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    const context = this.canvas.getContext('2d');
    if (!context) throw new Error('Unable to create the steam condensation canvas.');
    this.context = context;
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.wrapS = THREE.ClampToEdgeWrapping;
    this.texture.wrapT = THREE.ClampToEdgeWrapping;
    this.texture.colorSpace = THREE.NoColorSpace;
    this.texture.needsUpdate = true;
    this.seedMicroDrops();
    this.paint();
  }

  setSize(width: number, height: number): void {
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

  get texel(): THREE.Vector2 {
    return new THREE.Vector2(1 / this.width, 1 / this.height);
  }

  activate(): void {
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

  deactivate(): void {
    this.active = false;
    this.drops.length = 0;
    this.paint();
  }

  update(time: number): void {
    if (!this.active) return;
    if (this.lastStep <= 0) this.lastStep = time;
    const delta = Math.min(0.05, Math.max(0, time - this.lastStep));
    this.lastStep = time;
    this.elapsed += delta;
    this.spawnClock += delta;
    this.microSpawnClock += delta;

    while (this.spawnClock > 0.72 && this.drops.length < 26) {
      this.spawnClock -= 0.72;
      this.spawnDrop();
    }

    while (this.microSpawnClock > 0.14) {
      this.microSpawnClock -= 0.14;
      this.spawnMicroDrop();
    }

    for (const micro of this.microDrops) {
      if (!micro.active) continue;
      micro.age += delta;
      micro.radius = Math.min(micro.maxRadius, micro.radius + micro.growthRate * delta);
      if (micro.age > micro.life) this.resetMicroDrop(micro);
    }

    if (this.drops.length < 26 && this.nextRandom() < delta * 0.34) {
      const start = Math.floor(this.nextRandom() * this.microDrops.length);
      for (let offset = 0; offset < this.microDrops.length; offset += 1) {
        const micro = this.microDrops[(start + offset) % this.microDrops.length];
        if (!micro.active || micro.age < 1.8 || micro.radius < 0.0082) continue;
        this.spawnDrop(-1, micro);
        micro.active = false;
        break;
      }
    }

    for (const drop of this.drops) {
      drop.age += delta;
      drop.phase += delta;
      const sizeMotion = 0.35 + THREE.MathUtils.clamp(drop.vy / 0.08, 0, 1);
      drop.radius = THREE.MathUtils.clamp(
        drop.radius + drop.sizeVelocity * sizeMotion * delta,
        0.0085,
        0.042,
      );
      drop.wait = Math.max(0, drop.wait - delta);
      if (drop.wait <= 0) {
        let pulseScale = 1;
        let frictionScale = 1;
        if (drop.motionStyle === 'surge') {
          const cycle = (drop.phase + drop.burstAt) % 4.4;
          if (cycle < 0.85) {
            pulseScale = 2.45;
            frictionScale = 0.55;
          } else if (cycle < 2.65) {
            pulseScale = 0.08;
            frictionScale = 2.75;
          } else {
            pulseScale = 2.1;
            frictionScale = 0.72;
          }
        } else if (drop.motionStyle === 'burst') {
          if (!drop.burstTriggered && drop.phase >= drop.burstAt) {
            drop.vy = Math.max(drop.vy, 0.07 + this.nextRandom() * 0.035);
            drop.resistance *= 0.52;
            drop.burstTriggered = true;
          }
          pulseScale = drop.burstTriggered ? 1.35 : 0.08;
          frictionScale = drop.burstTriggered ? 0.68 : 1.9;
        } else if (drop.motionStyle === 'stutter') {
          pulseScale = 1.65;
          frictionScale = 2.2;
        } else {
          pulseScale = 0.82;
          frictionScale = 0.86;
        }

        drop.motionTimer -= delta;
        if (drop.motionTimer <= 0) {
          const sizeFactor = THREE.MathUtils.clamp((drop.radius - 0.01) / 0.032, 0, 1);
          drop.motionTimer = 0.28 + this.nextRandom() * 0.72;
          drop.resistance = 0.45 + this.nextRandom() * 1.3 + (1 - drop.mobility) * 0.55;
          drop.drift = (this.nextRandom() - 0.5) * (0.16 - sizeFactor * 0.06);
          const pauseThreshold = drop.motionStyle === 'stutter'
            ? 0.24 + drop.mobility * 0.28
            : 0.38 + drop.mobility * 0.5;
          if (drop.vy < (drop.motionStyle === 'stutter' ? 0.021 : 0.007) && this.nextRandom() > pauseThreshold) {
            drop.wait = 0.16 + this.nextRandom() * (0.72 - drop.mobility * 0.34);
          }
        }

        const sizeFactor = THREE.MathUtils.clamp((drop.radius - 0.01) / 0.032, 0, 1);
        const gravityPulseChance = (0.16 + sizeFactor * 1.22)
          * (0.62 + drop.mobility * 0.9)
          * pulseScale
          * delta;
        if (this.nextRandom() < gravityPulseChance) {
          drop.vy = Math.min(
            0.125,
            drop.vy + (0.007 + this.nextRandom() * 0.026) * (0.55 + sizeFactor) * (0.68 + drop.mobility * 0.58),
          );
          drop.drift = THREE.MathUtils.clamp(
            drop.drift + (this.nextRandom() - 0.5) * 0.045,
            -0.12,
            0.12,
          );
        }
        const friction = (0.004 + drop.vy * 0.12)
          * (0.72 + drop.resistance * 0.55)
          * frictionScale;
        drop.vy = Math.max(0, drop.vy - friction * delta);
        const targetVx = drop.vy * drop.drift;
        drop.vx = THREE.MathUtils.lerp(drop.vx, targetVx, 1 - Math.exp(-delta * 3.2));
        const previousX = drop.x;
        const previousY = drop.y;
        if (drop.vy > 0.0005) {
          drop.x += drop.vx * delta;
          drop.y += drop.vy * delta;
        }
        drop.distanceSinceTrail += Math.hypot(drop.x - previousX, drop.y - previousY);

        if (drop.distanceSinceTrail >= drop.nextTrailDistance && drop.radius > 0.012) {
          const beadRadius = drop.radius * (0.18 + this.nextRandom() * 0.18);
          drop.trail.push({
            x: drop.x + (this.nextRandom() - 0.5) * drop.radius * 0.28,
            y: drop.y - drop.radius * (0.35 + this.nextRandom() * 0.35),
            radius: beadRadius,
            life: 1,
          });
          if (drop.trail.length > 14) drop.trail.shift();
          drop.radius = Math.max(0.01, Math.sqrt(Math.max(0.0001, drop.radius * drop.radius - beadRadius * beadRadius * 0.42)));
          drop.distanceSinceTrail = 0;
          const speedFactor = THREE.MathUtils.clamp(drop.vy / 0.085, 0, 1);
          drop.nextTrailDistance = drop.radius * (0.85 + this.nextRandom() * 1.15) * (1 - speedFactor * 0.35);
        }

        const aspect = this.width / this.height;
        for (const micro of this.microDrops) {
          if (!micro.active) continue;
          const dx = (micro.x - drop.x) * aspect;
          const dy = micro.y - drop.y;
          if (Math.hypot(dx, dy) > drop.radius * 0.72 + micro.radius) continue;
          const dropArea = drop.radius * drop.radius;
          const microArea = micro.radius * micro.radius;
          drop.radius = Math.min(0.042, Math.sqrt(dropArea + microArea * 0.78));
          drop.vy = Math.min(0.125, drop.vy + 0.0035 + micro.radius * 0.42);
          drop.resistance *= 0.88;
          drop.motionTimer = Math.min(drop.motionTimer, 0.12);
          drop.trail.push({
            x: micro.x,
            y: micro.y,
            radius: micro.radius * 0.86,
            life: 1,
          });
          if (drop.trail.length > 14) drop.trail.shift();
          micro.active = false;
        }
      }
      for (const point of drop.trail) point.life -= delta * 0.115;
      while (drop.trail.length > 1 && drop.trail[0].life <= 0) drop.trail.shift();
    }

    for (let first = 0; first < this.drops.length; first += 1) {
      const a = this.drops[first];
      for (let second = first + 1; second < this.drops.length; second += 1) {
        const b = this.drops[second];
        const mergeDistance = (a.radius + b.radius) * 0.68;
        if (Math.hypot(a.x - b.x, a.y - b.y) > mergeDistance || a.radius > 0.038 || b.radius > 0.038) continue;
        const areaA = a.radius * a.radius;
        const areaB = b.radius * b.radius;
        const area = areaA + areaB;
        a.x = (a.x * areaA + b.x * areaB) / area;
        a.y = (a.y * areaA + b.y * areaB) / area;
        a.radius = Math.min(0.042, Math.sqrt(area));
        const mergedMomentum = (a.vy * areaA + b.vy * areaB) / area;
        a.vy = Math.min(0.125, Math.max(a.vy, b.vy, mergedMomentum + 0.013 + a.radius * 0.25));
        a.vx = (a.vx * areaA + b.vx * areaB) / area;
        a.sizeVelocity = (a.sizeVelocity * areaA + b.sizeVelocity * areaB) / area;
        a.wait = Math.min(a.wait, b.wait);
        a.resistance *= 0.72;
        a.mobility = Math.max(a.mobility, b.mobility, 0.82);
        a.motionTimer = Math.min(a.motionTimer, 0.08);
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

  dispose(): void {
    this.texture.dispose();
  }

  private nextRandom(): number {
    let value = this.randomState += 0x6d2b79f5;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  }

  private seedMicroDrops(): void {
    this.microDrops.length = 0;
    this.randomState = 0x6d2b79f5;
    for (let index = 0; index < 260; index += 1) this.microDrops.push(this.createMicroDrop());
  }

  private createMicroDrop(): SteamMicroDrop {
    const radiusSeed = this.nextRandom();
    const radius = 0.0042 + Math.pow(radiusSeed, 0.72) * 0.0062;
    const micro: SteamMicroDrop = {
      x: 0.5,
      y: 0.5,
      radius,
      maxRadius: radius + 0.0012 + this.nextRandom() * 0.0038,
      growthRate: 0.00005 + this.nextRandom() * 0.0002,
      opacity: 0.38 + this.nextRandom() * 0.42,
      age: this.nextRandom() * 7,
      life: 10 + this.nextRandom() * 20,
      active: true,
    };
    this.placeMicroDrop(micro);
    return micro;
  }

  private placeMicroDrop(micro: SteamMicroDrop): void {
    const region = this.nextRandom();
    if (region < 0.7) {
      micro.x = 0.02 + this.nextRandom() * 0.96;
      micro.y = 0.02 + this.nextRandom() * 0.96;
    } else if (region < 0.85) {
      micro.x = 0.025 + this.nextRandom() * 0.95;
      micro.y = 0.01 + this.nextRandom() * 0.3;
    } else {
      micro.x = this.nextRandom() < 0.5
        ? 0.012 + this.nextRandom() * 0.13
        : 0.858 + this.nextRandom() * 0.13;
      micro.y = 0.025 + this.nextRandom() * 0.95;
    }
  }

  private resetMicroDrop(micro: SteamMicroDrop): void {
    const radiusSeed = this.nextRandom();
    const radius = 0.0042 + Math.pow(radiusSeed, 0.72) * 0.0062;
    this.placeMicroDrop(micro);
    micro.radius = radius;
    micro.maxRadius = radius + 0.0012 + this.nextRandom() * 0.0038;
    micro.growthRate = 0.00005 + this.nextRandom() * 0.0002;
    micro.opacity = 0.38 + this.nextRandom() * 0.42;
    micro.age = 0;
    micro.life = 10 + this.nextRandom() * 20;
    micro.active = true;
  }

  private spawnMicroDrop(): void {
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
    let oldest: SteamMicroDrop | null = null;
    let oldestProgress = 0;
    for (const micro of this.microDrops) {
      const progress = micro.age / micro.life;
      if (progress <= oldestProgress) continue;
      oldest = micro;
      oldestProgress = progress;
    }
    if (oldest && oldestProgress > 0.82) this.resetMicroDrop(oldest);
  }

  private spawnDrop(sequence = -1, origin?: Pick<SteamMicroDrop, 'x' | 'y' | 'radius'>): void {
    const edge = sequence >= 0 ? sequence : this.nextRandom();
    let x = 0.5;
    let y = 0;
    if (origin) {
      x = origin.x;
      y = origin.y;
    } else if (edge < 0.62) {
      x = 0.05 + this.nextRandom() * 0.9;
      y = -0.02 + this.nextRandom() * 0.1;
    } else if (edge < 0.72) {
      x = 0.015 + this.nextRandom() * 0.09;
      y = 0.04 + this.nextRandom() * 0.44;
    } else if (edge < 0.82) {
      x = 0.895 + this.nextRandom() * 0.09;
      y = 0.04 + this.nextRandom() * 0.44;
    } else {
      x = 0.1 + this.nextRandom() * 0.8;
      y = 0.08 + this.nextRandom() * 0.42;
    }
    const mobility = 0.22 + this.nextRandom() * 0.78;
    const styleRoll = this.nextRandom();
    const motionStyle: SteamMotionStyle = styleRoll < 0.25
      ? 'surge'
      : styleRoll < 0.5
        ? 'burst'
        : styleRoll < 0.75
          ? 'stutter'
          : 'steady';
    let vy = 0.018 + this.nextRandom() * 0.022;
    let wait = 0.1 + this.nextRandom() * 0.6;
    let burstAt = this.nextRandom() * 4.4;
    if (motionStyle === 'surge') {
      vy = 0.035 + this.nextRandom() * 0.03;
      wait = 0.05 + this.nextRandom() * 0.3;
    } else if (motionStyle === 'burst') {
      vy = this.nextRandom() * 0.006;
      wait = 0.5 + this.nextRandom() * 1.3;
      burstAt = 1.4 + this.nextRandom() * 2.4;
    } else if (motionStyle === 'stutter') {
      vy = 0.008 + this.nextRandom() * 0.017;
      wait = 0.2 + this.nextRandom();
    }
    const sizeRoll = this.nextRandom();
    const sizeVelocity = sizeRoll < 0.35
      ? 0.0007 + this.nextRandom() * 0.0011
      : sizeRoll < 0.65
        ? -(0.0005 + this.nextRandom() * 0.0008)
        : (this.nextRandom() - 0.5) * 0.00016;
    this.drops.push({
      x,
      y,
      radius: origin
        ? Math.max(0.009, origin.radius * (0.95 + this.nextRandom() * 0.22))
        : 0.0105 + this.nextRandom() * 0.0135,
      vx: (this.nextRandom() - 0.5) * 0.003,
      vy,
      drift: (this.nextRandom() - 0.5) * 0.08,
      resistance: 0.52 + this.nextRandom() * 1.08 + (1 - mobility) * 0.36,
      mobility,
      motionStyle,
      phase: 0,
      burstAt,
      burstTriggered: false,
      sizeVelocity,
      motionTimer: 0.15 + this.nextRandom() * 0.6,
      distanceSinceTrail: 0,
      nextTrailDistance: 0.018 + this.nextRandom() * 0.032,
      wait,
      age: 0,
      life: 15 + this.nextRandom() * 12,
      trail: [],
    });
  }

  private paint(): void {
    const context = this.context;
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.globalCompositeOperation = 'source-over';
    context.fillStyle = 'rgb(0,0,0)';
    context.fillRect(0, 0, this.width, this.height);
    context.globalCompositeOperation = 'lighter';
    const drawMask = (
      x: number,
      y: number,
      radius: number,
      color: string,
      stretchX = 0.78,
      stretchY = 1.12,
      opacity = 0.88,
    ): void => {
      const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, color.replace('ALPHA', opacity.toFixed(3)));
      gradient.addColorStop(0.58, color.replace('ALPHA', (opacity * 0.48).toFixed(3)));
      gradient.addColorStop(1, color.replace('ALPHA', '0'));
      context.fillStyle = gradient;
      context.beginPath();
      context.ellipse(x, y, radius * stretchX, radius * stretchY, 0, 0, Math.PI * 2);
      context.fill();
    };

    const drawTeardropMask = (
      x: number,
      y: number,
      radius: number,
      lean: number,
      speed: number,
      opacity = 0.92,
    ): void => {
      const tipY = -radius * (0.9 + speed * 0.34);
      const baseY = radius * (0.72 + speed * 0.04);
      const halfWidth = radius * (0.4 - speed * 0.028);
      const gradient = context.createLinearGradient(x, y + tipY, x, y + baseY);
      gradient.addColorStop(0, `rgba(255,0,0,${(opacity * 0.3).toFixed(3)})`);
      gradient.addColorStop(0.24, `rgba(255,0,0,${(opacity * 0.52).toFixed(3)})`);
      gradient.addColorStop(0.62, `rgba(255,0,0,${(opacity * 0.88).toFixed(3)})`);
      gradient.addColorStop(1, `rgba(255,0,0,${(opacity * 0.72).toFixed(3)})`);
      context.save();
      context.filter = 'blur(0.65px)';
      context.fillStyle = gradient;
      context.beginPath();
      context.moveTo(x + lean, y + tipY);
      context.bezierCurveTo(
        x + lean * 0.58 - radius * 0.12,
        y - radius * 0.6,
        x - halfWidth,
        y - radius * 0.1,
        x - halfWidth,
        y + radius * 0.24,
      );
      context.bezierCurveTo(
        x - halfWidth * 0.92,
        y + radius * 0.58,
        x - halfWidth * 0.42,
        y + baseY,
        x,
        y + baseY,
      );
      context.bezierCurveTo(
        x + halfWidth * 0.42,
        y + baseY,
        x + halfWidth * 0.92,
        y + radius * 0.58,
        x + halfWidth,
        y + radius * 0.24,
      );
      context.bezierCurveTo(
        x + halfWidth,
        y - radius * 0.1,
        x + lean * 0.58 + radius * 0.12,
        y - radius * 0.6,
        x + lean,
        y + tipY,
      );
      context.closePath();
      context.fill();
      context.restore();
    };

    for (const micro of this.microDrops) {
      if (!micro.active) continue;
      const fadeIn = THREE.MathUtils.clamp(micro.age / 0.9, 0, 1);
      const fadeOut = THREE.MathUtils.clamp((micro.life - micro.age) / 1.4, 0, 1);
      drawMask(
        micro.x * this.width,
        micro.y * this.height,
        micro.radius * this.height,
        'rgba(255,0,0,ALPHA)',
        0.72 + micro.radius * 18,
        0.92 + micro.radius * 24,
        micro.opacity * fadeIn * fadeOut,
      );
    }
    for (const drop of this.drops) {
      for (const bead of drop.trail) {
        drawMask(
          bead.x * this.width,
          bead.y * this.height,
          Math.max(1.2, bead.radius * this.height * 1.9),
          'rgba(0,255,0,ALPHA)',
          0.86,
          1.34,
          Math.max(0, bead.life) * 0.1,
        );
        drawMask(
          bead.x * this.width,
          bead.y * this.height,
          Math.max(0.7, bead.radius * this.height),
          'rgba(255,0,0,ALPHA)',
          0.74,
          1.06,
          Math.max(0, bead.life) * 0.4,
        );
      }
      const x = drop.x * this.width;
      const y = drop.y * this.height;
      const radius = drop.radius * this.height;
      const speed = THREE.MathUtils.clamp(drop.vy / 0.085, 0, 1);
      const tailLean = THREE.MathUtils.clamp(-drop.drift * radius * 1.45, -radius * 0.25, radius * 0.25);
      // One authored outline replaces the former stack of three ellipses. The
      // lower head stays narrow while motion only lengthens the pointed tail.
      drawTeardropMask(x, y, radius, tailLean, speed);
    }
    context.globalCompositeOperation = 'source-over';
    this.texture.needsUpdate = true;
  }
}

const skillEffectShader: ShaderDefinition = {
  uniforms: {
    tDiffuse: { value: null },
    tScene: { value: null },
    uCondensation: { value: null },
    uTexel: { value: new THREE.Vector2() },
    uCondensationTexel: { value: new THREE.Vector2() },
    uTime: { value: 0 },
    uEffectAge: { value: 0 },
    uEffect: { value: 0 },
    uEffectProgress: { value: 0 },
    uCoffeeSplashProgress: { value: 1 },
    uThemeProgress: { value: 0 },
    uSteamClearProgress: { value: 0 },
    uSteamClearOrigin: { value: 0.1 },
    uSteamClearDirection: { value: 1 },
    uSteamRevealProgress: { value: 1 },
    uSteamRevealOrigin: { value: 0.1 },
    uSteamRevealDirection: { value: 1 },
  },
  vertexShader,
  fragmentShader: /* glsl */ `
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
  private readonly steamTargetA: THREE.WebGLRenderTarget;
  private readonly steamTargetB: THREE.WebGLRenderTarget;
  private readonly ink = makeQuad(inkShader);
  private readonly grade = makeQuad(gradeShader);
  private readonly lantern = makeQuad(lanternShader);
  private readonly bloom = makeQuad(bloomShader);
  private readonly bloomComposite = makeQuad(bloomCompositeShader);
  private readonly fxaa = makeQuad(fxaaShader);
  private readonly steamBlur = makeQuad(steamBlurShader);
  private readonly skillEffect = makeQuad(skillEffectShader);
  private readonly skillEffectTimeline = new SkillEffectActivationTimeline();
  private readonly steamCondensation = new SteamCondensationField();
  private qualityTier: NightQualityTier = 'high';
  private themeProgress = 0;
  private explorationProgress = 0;
  private skillEffectMode: SkillScreenEffect = 'none';
  private steamClearActive = false;
  private steamClearStartedAt = 0;
  private steamClearProgress = 0;
  private steamClearOrigin = 0.1;
  private steamClearDirection: -1 | 1 = 1;
  private readonly steamClearDuration = 2.4;
  private steamRevealActive = false;
  private steamRevealStartedAt = 0;
  private steamRevealProgress = 1;
  private steamRevealOrigin = 0.1;
  private steamRevealDirection: -1 | 1 = 1;
  private steamRevealDuration = 5.2;
  private coffeeSplashActive = false;
  private coffeeSplashStartedAt = 0;
  private coffeeSplashProgress = 1;
  private readonly coffeeSplashDuration = 8.4;
  private renderWidth = 2;
  private renderHeight = 2;
  private steamWidth = 2;
  private steamHeight = 2;

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
    this.steamTargetA = new THREE.WebGLRenderTarget(2, 2, {
      ...options,
      type: THREE.UnsignedByteType,
      depthBuffer: false,
    });
    this.steamTargetB = this.steamTargetA.clone();
    this.ink.material.uniforms.tDepth.value = this.sceneTarget.depthTexture;
    this.lantern.material.uniforms.tDepth.value = this.sceneTarget.depthTexture;
    this.skillEffect.material.uniforms.uCondensation.value = this.steamCondensation.texture;
    this.skillEffect.material.uniforms.uCondensationTexel.value.copy(this.steamCondensation.texel);
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
    this.resizeSteamTargets();

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

    const skillEffectScene = fxaaTarget.texture;
    let skillEffectSource = skillEffectScene;
    const effectTime = performance.now() * 0.001;
    let finishSteamClearAfterRender = false;
    if (this.steamRevealActive) {
      const evidenceProgress = window.__STEAM_REVEAL_PROGRESS_OVERRIDE__;
      this.steamRevealProgress = Number.isFinite(evidenceProgress)
        ? THREE.MathUtils.clamp(evidenceProgress!, 0, 1)
        : THREE.MathUtils.clamp(
            (effectTime - this.steamRevealStartedAt) / this.steamRevealDuration,
            0,
            1,
          );
      this.skillEffect.material.uniforms.uSteamRevealProgress.value = this.steamRevealProgress;
      if (this.steamRevealProgress >= 1) this.steamRevealActive = false;
    }
    if (this.steamClearActive) {
      const evidenceProgress = window.__STEAM_CLEAR_PROGRESS_OVERRIDE__;
      this.steamClearProgress = Number.isFinite(evidenceProgress)
        ? THREE.MathUtils.clamp(evidenceProgress!, 0, 1)
        : THREE.MathUtils.clamp(
            (effectTime - this.steamClearStartedAt) / this.steamClearDuration,
            0,
            1,
          );
      this.skillEffect.material.uniforms.uSteamClearProgress.value = this.steamClearProgress;
      finishSteamClearAfterRender = this.steamClearProgress >= 1;
    }
    if (this.coffeeSplashActive) {
      const evidenceProgress = window.__COFFEE_SPLASH_PROGRESS_OVERRIDE__;
      this.coffeeSplashProgress = Number.isFinite(evidenceProgress)
        ? THREE.MathUtils.clamp(evidenceProgress!, 0, 1)
        : THREE.MathUtils.clamp(
            (effectTime - this.coffeeSplashStartedAt) / this.coffeeSplashDuration,
            0,
            1,
          );
      this.skillEffect.material.uniforms.uCoffeeSplashProgress.value = this.coffeeSplashProgress;
      if (!Number.isFinite(evidenceProgress) && this.coffeeSplashProgress >= 1) {
        this.coffeeSplashActive = false;
        this.skillEffect.material.uniforms.uEffect.value = 0;
      }
    }
    if (this.skillEffectMode === 'bathroom-steam') {
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
    this.skillEffect.material.uniforms.uEffectAge.value = this.skillEffectMode === 'television-glitch'
      && Number.isFinite(televisionAgeOverride)
      ? Math.max(0, televisionAgeOverride as number)
      : this.skillEffectTimeline.age(this.skillEffectMode, effectTime);
    this.renderer.setRenderTarget(null);
    this.skillEffect.quad.render(this.renderer);
    if (finishSteamClearAfterRender) this.finishSteamClear();
  }

  setSkillEffect(effect: SkillScreenEffect, immediate = false): void {
    const modes: Record<SkillScreenEffect, number> = {
      none: 0,
      'bathroom-steam': 1,
      'coffee-lock': 2,
      'television-glitch': 3,
      'printer-scan': 4,
      'iridescent-bubble': 5,
      'toaster-heat': 6,
      'kettle-thaw-heat': 7,
      'blue-screen': 8,
      'microwave-heat': 9,
    };
    if (!immediate && effect === 'none' && this.steamClearActive && this.skillEffectMode === 'bathroom-steam') {
      return;
    }
    this.skillEffectTimeline.activate(effect, this.skillEffectMode, immediate);
    if (effect !== this.skillEffectMode || immediate) {
      this.cancelSteamClear();
      this.cancelSteamReveal(effect === 'bathroom-steam' ? 1 : 0);
      if (effect !== 'coffee-lock') this.cancelCoffeeSplash();
      if (effect === 'bathroom-steam') this.steamCondensation.activate();
      else this.steamCondensation.deactivate();
    }
    this.skillEffectMode = effect;
    this.skillEffect.material.uniforms.uEffect.value = effect === 'coffee-lock' && !this.coffeeSplashActive
      ? 0
      : modes[effect];
    if (effect !== 'toaster-heat' && effect !== 'kettle-thaw-heat' && effect !== 'microwave-heat') {
      this.skillEffect.material.uniforms.uEffectProgress.value = 0;
    }
  }

  setSkillEffectProgress(progress: number): void {
    this.skillEffect.material.uniforms.uEffectProgress.value = THREE.MathUtils.clamp(progress, 0, 1);
  }

  get skillEffectState(): Readonly<{
    mode: SkillScreenEffect;
    progress: number;
    age: number;
    activationCount: number;
    splashActive: boolean;
    splashProgress: number;
  }> {
    return {
      mode: this.skillEffectMode,
      progress: Number(this.skillEffect.material.uniforms.uEffectProgress.value),
      age: this.skillEffectTimeline.age(this.skillEffectMode),
      activationCount: this.skillEffectTimeline.activationCount,
      splashActive: this.coffeeSplashActive,
      splashProgress: this.coffeeSplashProgress,
    };
  }

  beginCoffeeSplash(): void {
    this.setSkillEffect('coffee-lock', true);
    this.coffeeSplashStartedAt = performance.now() * 0.001;
    this.coffeeSplashProgress = 0.0001;
    this.coffeeSplashActive = true;
    this.skillEffect.material.uniforms.uEffect.value = 2;
    this.skillEffect.material.uniforms.uCoffeeSplashProgress.value = this.coffeeSplashProgress;
  }

  beginSteamReveal(originX: number, duration = 5.2): void {
    this.setSkillEffect('bathroom-steam', true);
    this.steamRevealOrigin = THREE.MathUtils.clamp(originX, 0, 1);
    this.steamRevealDirection = this.steamRevealOrigin < 0.5 ? 1 : -1;
    this.steamRevealStartedAt = performance.now() * 0.001;
    this.steamRevealDuration = Math.max(0.1, duration);
    this.steamRevealProgress = 0.0001;
    this.steamRevealActive = true;
    this.skillEffect.material.uniforms.uSteamRevealOrigin.value = this.steamRevealOrigin;
    this.skillEffect.material.uniforms.uSteamRevealDirection.value = this.steamRevealDirection;
    this.skillEffect.material.uniforms.uSteamRevealProgress.value = this.steamRevealProgress;
  }

  beginSteamClear(originX: number): void {
    if (this.skillEffectMode !== 'bathroom-steam') return;
    this.steamRevealActive = false;
    this.steamClearOrigin = THREE.MathUtils.clamp(originX, 0, 1);
    this.steamClearDirection = this.steamClearOrigin < 0.5 ? 1 : -1;
    this.steamClearStartedAt = performance.now() * 0.001;
    this.steamClearProgress = 0.0001;
    this.steamClearActive = true;
    this.skillEffect.material.uniforms.uSteamClearOrigin.value = this.steamClearOrigin;
    this.skillEffect.material.uniforms.uSteamClearDirection.value = this.steamClearDirection;
    this.skillEffect.material.uniforms.uSteamClearProgress.value = this.steamClearProgress;
  }

  get steamClearState(): Readonly<{
    active: boolean;
    progress: number;
    origin: number;
    direction: 'left-to-right' | 'right-to-left';
  }> {
    return {
      active: this.steamClearActive,
      progress: this.steamClearProgress,
      origin: this.steamClearOrigin,
      direction: this.steamClearDirection > 0 ? 'left-to-right' : 'right-to-left',
    };
  }

  get steamRevealState(): Readonly<{
    active: boolean;
    progress: number;
    origin: number;
    direction: 'left-to-right' | 'right-to-left';
  }> {
    return {
      active: this.steamRevealActive,
      progress: this.steamRevealProgress,
      origin: this.steamRevealOrigin,
      direction: this.steamRevealDirection > 0 ? 'left-to-right' : 'right-to-left',
    };
  }

  setThemeProgress(progress: number): void {
    const value = THREE.MathUtils.clamp(progress, 0, 1);
    this.themeProgress = value;
    this.grade.material.uniforms.uThemeProgress.value = value;
    this.lantern.material.uniforms.uThemeProgress.value = value;
    this.skillEffect.material.uniforms.uThemeProgress.value = value;
    this.bloomComposite.material.uniforms.uStrength.value = this.qualityTier === 'minimal' ? 0 : value * 0.2;
    this.ink.material.uniforms.uInk.value.set(PAL.ink).lerp(NIGHT_INK, value);
    this.ink.material.uniforms.uStrength.value = THREE.MathUtils.lerp(0.92, 0.76, value)
      * THREE.MathUtils.lerp(1, 0.12, this.explorationProgress);
  }

  setExplorationProgress(progress: number): void {
    this.explorationProgress = THREE.MathUtils.clamp(progress, 0, 1);
    this.grade.material.uniforms.uExplorationProgress.value = this.explorationProgress;
    this.lantern.material.uniforms.uExplorationProgress.value = this.explorationProgress;
    this.ink.material.uniforms.uStrength.value = THREE.MathUtils.lerp(0.92, 0.76, this.themeProgress)
      * THREE.MathUtils.lerp(1, 0.12, this.explorationProgress);
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


  private cancelSteamClear(): void {
    this.steamClearActive = false;
    this.steamClearProgress = 0;
    this.skillEffect.material.uniforms.uSteamClearProgress.value = 0;
  }

  private cancelSteamReveal(progress: number): void {
    this.steamRevealActive = false;
    this.steamRevealProgress = THREE.MathUtils.clamp(progress, 0, 1);
    this.skillEffect.material.uniforms.uSteamRevealProgress.value = this.steamRevealProgress;
  }

  private cancelCoffeeSplash(): void {
    this.coffeeSplashActive = false;
    this.coffeeSplashProgress = 1;
    this.skillEffect.material.uniforms.uCoffeeSplashProgress.value = 1;
  }

  private finishSteamClear(): void {
    this.cancelSteamClear();
    this.cancelSteamReveal(0);
    this.steamCondensation.deactivate();
    this.skillEffectMode = 'none';
    this.skillEffect.material.uniforms.uEffect.value = 0;
  }

  private resizeSteamTargets(): void {
    this.steamWidth = Math.max(2, Math.floor(this.renderWidth * 0.28));
    this.steamHeight = Math.max(2, Math.floor(this.renderHeight * 0.28));
    this.steamTargetA.setSize(this.steamWidth, this.steamHeight);
    this.steamTargetB.setSize(this.steamWidth, this.steamHeight);
    this.steamCondensation.setSize(
      Math.floor(this.renderWidth * 0.34),
      Math.floor(this.renderHeight * 0.34),
    );
    this.skillEffect.material.uniforms.uCondensationTexel.value.copy(this.steamCondensation.texel);
  }
}

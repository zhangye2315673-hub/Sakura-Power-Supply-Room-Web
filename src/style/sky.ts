import * as THREE from 'three';
import { PAL } from './palette';
import type { NightQualityTier } from '../theme/ThemeController';

const STAR_COUNT = 140;

function seededRandom(index: number): number {
  let value = (index + 1) * 0x9e3779b1;
  value ^= value >>> 16;
  value = Math.imul(value, 0x85ebca6b);
  value ^= value >>> 13;
  return (value >>> 0) / 0xffffffff;
}

function createStars(radius: number): {
  points: THREE.Points;
  material: THREE.ShaderMaterial;
} {
  const positions = new Float32Array(STAR_COUNT * 3);
  const phases = new Float32Array(STAR_COUNT);
  const sizes = new Float32Array(STAR_COUNT);
  const sparkles = new Float32Array(STAR_COUNT);
  const twinkleSpeeds = new Float32Array(STAR_COUNT);
  const starLuminance = new Float32Array(STAR_COUNT);
  for (let index = 0; index < STAR_COUNT; index += 1) {
    positions[index * 3] = THREE.MathUtils.lerp(-0.38, 0.38, seededRandom(index * 5)) * radius;
    // Keep the stars in the actual sky band. Letting the field extend below
    // the horizon made points read as if they were sitting on top of the
    // foreground cable bundle and appliances, even though depth testing was
    // technically correct.
    positions[index * 3 + 1] = THREE.MathUtils.lerp(0.015, 0.34, seededRandom(index * 5 + 1)) * radius;
    positions[index * 3 + 2] = -radius;
    phases[index] = seededRandom(index * 5 + 2) * Math.PI * 2;
    sizes[index] = THREE.MathUtils.lerp(3.6, 7.2, seededRandom(index * 5 + 3));
    sparkles[index] = seededRandom(index * 5 + 4) > 0.9 ? 1 : 0;
    twinkleSpeeds[index] = THREE.MathUtils.lerp(0.58, 1.42, seededRandom(index * 7 + 91));
    starLuminance[index] = THREE.MathUtils.lerp(0.68, 1, seededRandom(index * 7 + 92));
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aSparkle', new THREE.BufferAttribute(sparkles, 1));
  geometry.setAttribute('aTwinkleSpeed', new THREE.BufferAttribute(twinkleSpeeds, 1));
  geometry.setAttribute('aLuminance', new THREE.BufferAttribute(starLuminance, 1));
  geometry.setDrawRange(0, STAR_COUNT);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uReducedMotion: { value: 0 },
    },
    vertexShader: /* glsl */ `
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
    fragmentShader: /* glsl */ `
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
    blending: THREE.AdditiveBlending,
    fog: false,
  });
  const points = new THREE.Points(geometry, material);
  points.name = 'night-stars';
  points.frustumCulled = false;
  // Stars are a background layer: after the opaque dome, before translucent
  // clouds. Depth testing keeps both transparent sky layers behind the cable
  // bundle and appliances, while renderOrder defines stars-before-clouds.
  points.renderOrder = -9;
  return { points, material };
}

function createCloudTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Unable to create cloud texture.');

  context.clearRect(0, 0, canvas.width, canvas.height);
  const gradient = context.createRadialGradient(128, 66, 10, 128, 66, 110);
  gradient.addColorStop(0, 'rgba(255,255,255,0.98)');
  gradient.addColorStop(0.6, 'rgba(255,255,255,0.82)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient;
  context.beginPath();
  context.ellipse(128, 72, 104, 38, 0, 0, Math.PI * 2);
  context.fill();
  for (const [x, y, radius] of [
    [62, 63, 31],
    [96, 46, 40],
    [140, 39, 46],
    [184, 58, 35],
  ] as const) {
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export type SkyRig = {
  dome: THREE.Mesh;
  clouds: THREE.Group;
  stars: THREE.Points;
  update: (cameraPosition: THREE.Vector3, cameraQuaternion: THREE.Quaternion, elapsed: number) => void;
  updateTheme: (elapsed: number) => void;
  setThemeProgress: (progress: number) => void;
  setExplorationProgress: (progress: number) => void;
  setQualityTier: (tier: NightQualityTier) => void;
  setReducedMotion: (reduced: boolean) => void;
  dispose: () => void;
};

export function buildSky(scene: THREE.Scene, radius = 112): SkyRig {
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 32, 20),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: true,
      fog: false,
      uniforms: {
        uTop: { value: new THREE.Color(PAL.skyTop) },
        uMid: { value: new THREE.Color(PAL.skyMid) },
        uHaze: { value: new THREE.Color(PAL.skyHaze) },
        uNightTop: { value: new THREE.Color(0x10162f) },
        uNightMid: { value: new THREE.Color(0x252b55) },
        uNightHaze: { value: new THREE.Color(0x5d526e) },
        uThemeProgress: { value: 0 },
        uExplorationProgress: { value: 0 },
        uBands: { value: 26 },
      },
      vertexShader: /* glsl */ `
        varying vec3 vLocal;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vLocal = position;
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: /* glsl */ `
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
      `,
    }),
  );
  dome.frustumCulled = false;
  dome.renderOrder = -10;
  scene.add(dome);

  const stars = createStars(radius * 0.91);
  scene.add(stars.points);

  const texture = createCloudTexture();
  const cloudMaterial = new THREE.MeshBasicMaterial({
    color: PAL.cloud,
    map: texture,
    transparent: true,
    opacity: 0.48,
    depthWrite: false,
    depthTest: true,
    fog: false,
  });
  const shadeMaterial = cloudMaterial.clone();
  shadeMaterial.color.setHex(PAL.cloudShade);
  shadeMaterial.opacity = 0.25;

  const clouds = new THREE.Group();
  const cloudDayPositions: THREE.Vector3[] = [];
  const cloudDriftSpeeds: number[] = [];
  for (let index = 0; index < 11; index += 1) {
    const width = 16 + (index % 4) * 4;
    const height = width * 0.34;
    const cloud = new THREE.Group();
    cloud.renderOrder = -8;
    const shade = new THREE.Mesh(new THREE.PlaneGeometry(width, height), shadeMaterial);
    shade.renderOrder = -8;
    shade.position.set(0.3, -0.35, -0.15);
    const front = new THREE.Mesh(new THREE.PlaneGeometry(width, height), cloudMaterial);
    front.renderOrder = -8;
    cloud.add(shade, front);
    cloud.position.set(
      THREE.MathUtils.lerp(-42, 42, seededRandom(index * 7 + 32)),
      THREE.MathUtils.lerp(5, 20, seededRandom(index * 7 + 33)),
      -94 - (index % 3) * 1.5,
    );
    cloudDayPositions.push(cloud.position.clone());
    cloudDriftSpeeds.push(THREE.MathUtils.lerp(0.24, 0.72, seededRandom(index * 7 + 40)));
    cloud.lookAt(0, 5, 0);
    clouds.add(cloud);
  }
  scene.add(clouds);

  const domeMaterial = dome.material as THREE.ShaderMaterial;
  const nightCloudColor = new THREE.Color(0x5f6882);
  const nightShadeColor = new THREE.Color(0x343a55);
  const explorationCloudColor = new THREE.Color(0x090b15);
  const explorationShadeColor = new THREE.Color(0x03040a);
  let themeProgress = 0;
  let explorationProgress = 0;
  let reducedMotion = false;
  const applyTheme = () => {
    domeMaterial.uniforms.uThemeProgress.value = themeProgress;
    domeMaterial.uniforms.uExplorationProgress.value = explorationProgress;
    stars.material.uniforms.uProgress.value = themeProgress;
    cloudMaterial.color.set(PAL.cloud).lerp(nightCloudColor, themeProgress).lerp(explorationCloudColor, explorationProgress);
    shadeMaterial.color.set(PAL.cloudShade).lerp(nightShadeColor, themeProgress).lerp(explorationShadeColor, explorationProgress);
    cloudMaterial.opacity = THREE.MathUtils.lerp(
      THREE.MathUtils.lerp(0.48, 0.28, themeProgress),
      0.045,
      explorationProgress,
    );
    shadeMaterial.opacity = THREE.MathUtils.lerp(
      THREE.MathUtils.lerp(0.25, 0.34, themeProgress),
      0.07,
      explorationProgress,
    );
  };
  return {
    dome,
    clouds,
    stars: stars.points,
    update(cameraPosition, cameraQuaternion, elapsed) {
      dome.position.copy(cameraPosition);
      stars.points.position.copy(cameraPosition);
      stars.points.quaternion.copy(cameraQuaternion);
      clouds.position.copy(cameraPosition);
      clouds.quaternion.copy(cameraQuaternion);
      clouds.children.forEach((cloud, index) => {
        const base = cloudDayPositions[index];
        const travelWidth = 104;
        const drift = elapsed * cloudDriftSpeeds[index] + seededRandom(index * 7 + 41) * travelWidth;
        cloud.position.copy(base);
        cloud.position.x = -52 + ((base.x + 52 + drift) % travelWidth);
        cloud.position.y = base.y + Math.sin(elapsed * 0.055 + index * 1.7) * 0.38;
      });
    },
    updateTheme(elapsed) {
      stars.material.uniforms.uTime.value = elapsed;
      stars.material.uniforms.uReducedMotion.value = reducedMotion ? 1 : 0;
    },
    setThemeProgress(progress) {
      themeProgress = THREE.MathUtils.clamp(progress, 0, 1);
      applyTheme();
    },
    setExplorationProgress(progress) {
      explorationProgress = THREE.MathUtils.clamp(progress, 0, 1);
      applyTheme();
    },
    setQualityTier(tier) {
      stars.points.geometry.setDrawRange(0, tier === 'high' || tier === 'reduced' ? STAR_COUNT : 90);
    },
    setReducedMotion(reduced) {
      reducedMotion = reduced;
      stars.material.uniforms.uReducedMotion.value = reduced ? 1 : 0;
    },
    dispose() {
      dome.geometry.dispose();
      domeMaterial.dispose();
      clouds.traverse((object) => {
        if (object instanceof THREE.Mesh) object.geometry.dispose();
      });
      texture.dispose();
      cloudMaterial.dispose();
      shadeMaterial.dispose();
      stars.points.geometry.dispose();
      stars.material.dispose();
      dome.removeFromParent();
      clouds.removeFromParent();
      stars.points.removeFromParent();
    },
  };
}

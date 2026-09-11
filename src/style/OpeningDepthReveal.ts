import * as THREE from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

/** A short depth-ordered focus reveal, using the scene's real depth buffer. */
export class OpeningDepthReveal {
  private readonly blurA = new THREE.WebGLRenderTarget(2, 2, { depthBuffer: false });
  private readonly blurB = new THREE.WebGLRenderTarget(2, 2, { depthBuffer: false });
  private readonly blurMaterial = new THREE.ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    uniforms: {
      tDiffuse: { value: null },
      uStep: { value: new THREE.Vector2() },
    },
    vertexShader,
    fragmentShader: /* glsl */ `
      uniform sampler2D tDiffuse;
      uniform vec2 uStep;
      varying vec2 vUv;
      void main() {
        vec3 color = vec3(0.0);
        float total = 0.0;
        for (int i = -12; i <= 12; i++) {
          float offset = float(i);
          float weight = exp(-offset * offset / 50.0);
          color += texture2D(tDiffuse, vUv + uStep * offset).rgb * weight;
          total += weight;
        }
        gl_FragColor = vec4(color / total, 1.0);
      }
    `,
  });
  private readonly revealMaterial = new THREE.ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    uniforms: {
      tDiffuse: { value: null },
      tBlur: { value: this.blurB.texture },
      tDepth: { value: null },
      uProgress: { value: 0 },
      uFocusDistance: { value: 10 },
      uNear: { value: 0.1 },
      uFar: { value: 100 },
      uDepthStep: { value: new THREE.Vector2() },
    },
    vertexShader,
    fragmentShader: /* glsl */ `
      #include <packing>
      uniform sampler2D tDiffuse, tBlur, tDepth;
      uniform float uProgress, uFocusDistance, uNear, uFar;
      uniform vec2 uDepthStep;
      varying vec2 vUv;
      float depthDelay(vec2 uv) {
        float depth = -perspectiveDepthToViewZ(texture2D(tDepth, uv).r, uNear, uFar);
        return smoothstep(uFocusDistance * 0.78, uFocusDistance * 2.8, depth);
      }
      void main() {
        // Feather depth silhouettes so the focus front never looks like a cutout.
        float depth = depthDelay(vUv) * 0.5;
        depth += depthDelay(vUv + vec2(uDepthStep.x, 0.0)) * 0.125;
        depth += depthDelay(vUv - vec2(uDepthStep.x, 0.0)) * 0.125;
        depth += depthDelay(vUv + vec2(0.0, uDepthStep.y)) * 0.125;
        depth += depthDelay(vUv - vec2(0.0, uDepthStep.y)) * 0.125;
        float delay = 0.02 + depth * 0.38 + (1.0 - vUv.y) * 0.04;
        float focus = smoothstep(delay, delay + 0.56, uProgress);
        vec3 sharp = texture2D(tDiffuse, vUv).rgb;
        vec3 soft = texture2D(tBlur, vUv).rgb;
        gl_FragColor = vec4(mix(soft, sharp, focus), 1.0);
      }
    `,
  });
  private readonly blurQuad = new FullScreenQuad(this.blurMaterial);
  private readonly revealQuad = new FullScreenQuad(this.revealMaterial);

  setSize(width: number, height: number): void {
    // Blur at quarter resolution; only the final depth composite is full size.
    this.blurA.setSize(Math.max(2, Math.ceil(width / 4)), Math.max(2, Math.ceil(height / 4)));
    this.blurB.setSize(this.blurA.width, this.blurA.height);
    this.revealMaterial.uniforms.uDepthStep.value.set(2 / width, 2 / height);
  }

  setProgress(progress: number, focusDistance: number): void {
    this.revealMaterial.uniforms.uProgress.value = progress;
    this.revealMaterial.uniforms.uFocusDistance.value = Math.max(0.1, focusDistance);
  }

  render(
    renderer: THREE.WebGLRenderer,
    source: THREE.Texture,
    depth: THREE.DepthTexture,
    camera: THREE.PerspectiveCamera,
    destination: THREE.WebGLRenderTarget,
  ): void {
    const progress = this.revealMaterial.uniforms.uProgress.value as number;
    const radius = THREE.MathUtils.lerp(1, 0.25, progress);
    this.blurMaterial.uniforms.tDiffuse.value = source;
    this.blurMaterial.uniforms.uStep.value.set(radius / this.blurA.width, 0);
    renderer.setRenderTarget(this.blurA);
    this.blurQuad.render(renderer);
    this.blurMaterial.uniforms.tDiffuse.value = this.blurA.texture;
    this.blurMaterial.uniforms.uStep.value.set(0, radius / this.blurB.height);
    renderer.setRenderTarget(this.blurB);
    this.blurQuad.render(renderer);

    this.revealMaterial.uniforms.tDiffuse.value = source;
    this.revealMaterial.uniforms.tDepth.value = depth;
    this.revealMaterial.uniforms.uNear.value = camera.near;
    this.revealMaterial.uniforms.uFar.value = camera.far;
    renderer.setRenderTarget(destination);
    this.revealQuad.render(renderer);
  }

  dispose(): void {
    this.blurA.dispose();
    this.blurB.dispose();
    this.blurQuad.dispose();
    this.revealQuad.dispose();
    this.blurMaterial.dispose();
    this.revealMaterial.dispose();
  }
}

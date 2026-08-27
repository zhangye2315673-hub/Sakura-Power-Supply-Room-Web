import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PAL } from '../style/palette';
import { createSakuraPetalGeometry, createSakuraPetalMaterial } from './PetalVisual';
import { SEASON_MODES, type SeasonMode } from '../theme/SeasonProfiles';
import {
  createAutumnLeafGeometry,
  createFireflyGeometry,
  createSeasonParticleMaterial,
  createSummerLeafGeometry,
  createWinterSnowGeometry,
} from './SeasonParticleVisual';

type Petal = {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: THREE.Euler;
  spin: THREE.Vector3;
  scale: number;
  phase: number;
  swaySpeed: number;
  swayAmplitude: number;
  burstLife: number;
  coldSeed: number;
  snowScale: number;
  canopyFlowActive: boolean;
  canopyFlowProgress: number;
  canopyFlowSpeed: number;
  canopyFlowLane: number;
};

export type CanopyPetalFlow = Readonly<{
  active: boolean;
  center: THREE.Vector3;
  direction: THREE.Vector3;
  radius: number;
  strength: number;
}>;

const dummy = new THREE.Object3D();

function createLowPolySnowflakeGeometry(scale = 1): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (const angle of [0, Math.PI / 3, Math.PI * 2 / 3]) {
    const arm = new THREE.BoxGeometry(0.5 * scale, 0.046 * scale, 0.018 * scale);
    arm.rotateZ(angle);
    parts.push(arm);
  }
  for (let index = 0; index < 6; index += 1) {
    const angle = index * Math.PI / 3;
    const direction = new THREE.Vector2(Math.cos(angle), Math.sin(angle));
    const anchor = direction.clone().multiplyScalar(0.155 * scale);
    for (const side of [-1, 1]) {
      const branchAngle = angle + Math.PI + side * Math.PI / 3;
      const branchDirection = new THREE.Vector2(Math.cos(branchAngle), Math.sin(branchAngle));
      const branch = new THREE.BoxGeometry(0.12 * scale, 0.028 * scale, 0.015 * scale);
      branch.rotateZ(branchAngle);
      branch.translate(
        anchor.x + branchDirection.x * 0.045 * scale,
        anchor.y + branchDirection.y * 0.045 * scale,
        0,
      );
      parts.push(branch);
    }
  }
  const geometry = mergeGeometries(parts, false);
  parts.forEach((part) => part.dispose());
  if (!geometry) throw new Error('Unable to build low-poly snowflake geometry.');
  geometry.computeVertexNormals();
  return geometry;
}

export class PetalField {
  readonly mesh: THREE.InstancedMesh;
  readonly snowMesh: THREE.InstancedMesh;
  readonly summerMesh: THREE.InstancedMesh;
  readonly autumnMesh: THREE.InstancedMesh;
  readonly winterMesh: THREE.InstancedMesh;
  readonly fireflyMesh: THREE.InstancedMesh;
  private readonly petals: Petal[] = [];
  private elapsed = 0;
  private coldProgress = 0;
  private seasonWeights: Record<SeasonMode, number> = { spring: 1, summer: 0, autumn: 0, winter: 0 };
  private themeProgress = 0;
  private canopyFlowActive = false;
  private readonly canopyCenter = new THREE.Vector3();
  private readonly canopyDirection = new THREE.Vector3(1, 0, 0);
  private readonly canopyTangent = new THREE.Vector3(0, 1, 0);
  private readonly canopyBitangent = new THREE.Vector3(0, 0, 1);
  private canopyRadius = 0;
  private canopyStrength = 0;
  private readonly random = (() => {
    let state = 0x51a7c0de;
    return () => {
      state = Math.imul(1664525, state) + 1013904223;
      return (state >>> 0) / 4294967296;
    };
  })();

  get activeBurstCount(): number {
    return this.petals.filter((petal) => petal.burstLife > 0).length;
  }

  get canopyFlowState(): Readonly<{
    active: boolean;
    particleCount: number;
    radius: number;
    direction: readonly [number, number, number];
    path: 'open-canopy-outer-arc';
    seasonalProps: true;
  }> {
    return {
      active: this.canopyFlowActive,
      particleCount: this.petals.filter((petal) => petal.canopyFlowActive).length,
      radius: this.canopyRadius,
      direction: this.canopyDirection.toArray(),
      path: 'open-canopy-outer-arc',
      seasonalProps: true,
    };
  }

  constructor(count = 28) {
    const geometry = createSakuraPetalGeometry(0.92);
    const material = createSakuraPetalMaterial(PAL.petal, 0.72);
    this.mesh = new THREE.InstancedMesh(geometry, material, count);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 4;
    this.snowMesh = new THREE.InstancedMesh(
      createLowPolySnowflakeGeometry(0.92),
      createSakuraPetalMaterial(0xb9e1ef, 0.92),
      count,
    );
    this.snowMesh.name = 'refrigerator-low-poly-snowflakes';
    this.snowMesh.frustumCulled = false;
    this.snowMesh.renderOrder = 5;
    this.snowMesh.visible = false;
    this.mesh.add(this.snowMesh);
    this.summerMesh = new THREE.InstancedMesh(
      createSummerLeafGeometry(0.92), createSeasonParticleMaterial(0x84ad91, 0), count,
    );
    this.summerMesh.name = 'summer-leaf-particles';
    this.autumnMesh = new THREE.InstancedMesh(
      createAutumnLeafGeometry(0.92), createSeasonParticleMaterial(0xffffff, 0, false, true), count,
    );
    this.autumnMesh.name = 'autumn-leaf-particles';
    this.winterMesh = new THREE.InstancedMesh(
      createWinterSnowGeometry(0.92), createSeasonParticleMaterial(0xe5eff5, 0), count,
    );
    this.winterMesh.name = 'winter-paper-snow';
    this.fireflyMesh = new THREE.InstancedMesh(
      createFireflyGeometry(1), createSeasonParticleMaterial(0xffd86a, 0, true), count,
    );
    this.fireflyMesh.name = 'summer-night-fireflies';
    for (const seasonal of [this.summerMesh, this.autumnMesh, this.winterMesh, this.fireflyMesh]) {
      seasonal.frustumCulled = false;
      seasonal.renderOrder = seasonal === this.fireflyMesh ? 6 : 4;
      seasonal.visible = false;
      this.mesh.add(seasonal);
    }

    for (let index = 0; index < count; index += 1) {
      this.petals.push(this.createAmbientPetal(index / count));
    }
    this.sync();
  }

  update(delta: number): void {
    this.elapsed += delta;
    for (const petal of this.petals) {
      if (petal.canopyFlowActive) {
        this.updateCanopyPetal(petal, delta);
        continue;
      }
      petal.position.addScaledVector(petal.velocity, delta);
      petal.rotation.x += petal.spin.x * delta;
      petal.rotation.y += petal.spin.y * delta;
      petal.rotation.z += petal.spin.z * delta;

      if (petal.burstLife > 0) {
        petal.burstLife -= delta;
        petal.velocity.multiplyScalar(Math.exp(-delta * 0.85));
        petal.velocity.y -= delta * 0.24;
        if (petal.burstLife <= 0) this.resetAmbient(petal, 1);
      } else {
        // Independent phases keep the reduced field from reading as a static backdrop.
        const sway = Math.sin(this.elapsed * petal.swaySpeed + petal.phase);
        petal.position.x += sway * petal.swayAmplitude * delta;
        petal.position.z += Math.cos(this.elapsed * petal.swaySpeed * 0.73 + petal.phase) *
          petal.swayAmplitude * 0.35 * delta;
        const autumn = this.seasonWeights.autumn;
        const winter = this.seasonWeights.winter;
        petal.position.x += autumn * (0.34 + Math.max(0, Math.sin(this.elapsed * 1.9 + petal.phase)) * 0.46) * delta;
        petal.position.z += winter * Math.sin(this.elapsed * 0.8 + petal.phase) * 0.08 * delta;
        if (this.coldProgress > 0.001) {
          const gust = Math.sin(this.elapsed * (1.7 + petal.coldSeed * 2.6) + petal.phase);
          const gustPulse = Math.max(0, gust) ** 2;
          petal.position.x += this.coldProgress * (0.46 + petal.coldSeed * 0.48 + gustPulse * 0.42) * delta;
          petal.position.y -= this.coldProgress * (0.54 + petal.coldSeed * 0.58) * delta;
          petal.position.z += this.coldProgress * Math.sin(this.elapsed * 2.3 + petal.phase) * 0.2 * delta;
          petal.rotation.z += this.coldProgress * (1.1 + petal.coldSeed * 2.4) * delta;
        }
        if (petal.position.y < -4.5 || Math.abs(petal.position.x) > 10 || Math.abs(petal.position.z) > 10) {
          this.resetAmbient(petal, 0);
        }
      }
    }
    this.sync();
  }

  setCanopyFlow(flow: CanopyPetalFlow): void {
    const nextActive = flow.active && flow.radius > 0.1 && flow.strength > 0.01;
    this.canopyCenter.copy(flow.center);
    this.canopyRadius = Math.max(0, flow.radius);
    this.canopyStrength = THREE.MathUtils.clamp(flow.strength, 0, 1);
    this.canopyDirection.copy(flow.direction);
    if (this.canopyDirection.lengthSq() < 0.0001) this.canopyDirection.set(1, 0, 0);
    this.canopyDirection.normalize();
    const helper = Math.abs(this.canopyDirection.y) > 0.88
      ? new THREE.Vector3(1, 0, 0)
      : new THREE.Vector3(0, 1, 0);
    this.canopyTangent.crossVectors(helper, this.canopyDirection).normalize();
    this.canopyBitangent.crossVectors(this.canopyDirection, this.canopyTangent).normalize();

    if (nextActive && !this.canopyFlowActive) this.beginCanopyFlow();
    if (!nextActive && this.canopyFlowActive) this.endCanopyFlow();
    this.canopyFlowActive = nextActive;
  }

  setColdProgress(progress: number): void {
    this.coldProgress = THREE.MathUtils.clamp(progress, 0, 1);
    this.snowMesh.visible = this.coldProgress > 0.001;
  }

  setSeasonState(weights: Readonly<Record<SeasonMode, number>>, themeProgress: number): void {
    for (const mode of SEASON_MODES) this.seasonWeights[mode] = weights[mode];
    this.themeProgress = THREE.MathUtils.clamp(themeProgress, 0, 1);
    const springMaterial = this.mesh.material as THREE.MeshBasicMaterial;
    const summerMaterial = this.summerMesh.material as THREE.MeshBasicMaterial;
    const autumnMaterial = this.autumnMesh.material as THREE.MeshBasicMaterial;
    const winterMaterial = this.winterMesh.material as THREE.MeshBasicMaterial;
    const fireflyMaterial = this.fireflyMesh.material as THREE.MeshBasicMaterial;
    springMaterial.opacity = 0.72 * weights.spring;
    summerMaterial.opacity = 0.78 * weights.summer * THREE.MathUtils.lerp(1, 0.35, this.themeProgress);
    autumnMaterial.opacity = 0.84 * weights.autumn;
    winterMaterial.opacity = 0.92 * weights.winter;
    fireflyMaterial.opacity = 0;
    this.summerMesh.visible = summerMaterial.opacity > 0.002;
    this.autumnMesh.visible = autumnMaterial.opacity > 0.002;
    this.winterMesh.visible = winterMaterial.opacity > 0.002;
    this.fireflyMesh.visible = false;
  }

  get coldState(): Readonly<{ progress: number; snowflakeCount: number }> {
    return {
      progress: this.coldProgress,
      snowflakeCount: this.petals.filter((petal) => (
        THREE.MathUtils.smoothstep(this.coldProgress, petal.coldSeed * 0.5, petal.coldSeed * 0.5 + 0.3) > 0.5
      )).length,
    };
  }

  get seasonState(): Readonly<{
    weights: Record<SeasonMode, number>;
    springOpacity: number;
    summerOpacity: number;
    autumnOpacity: number;
    winterOpacity: number;
    fireflyOpacity: number;
    refrigeratorSnowVisible: boolean;
    refrigeratorColdProgress: number;
  }> {
    return {
      weights: { ...this.seasonWeights },
      springOpacity: (this.mesh.material as THREE.MeshBasicMaterial).opacity,
      summerOpacity: (this.summerMesh.material as THREE.MeshBasicMaterial).opacity,
      autumnOpacity: (this.autumnMesh.material as THREE.MeshBasicMaterial).opacity,
      winterOpacity: (this.winterMesh.material as THREE.MeshBasicMaterial).opacity,
      fireflyOpacity: (this.fireflyMesh.material as THREE.MeshBasicMaterial).opacity,
      refrigeratorSnowVisible: this.snowMesh.visible,
      refrigeratorColdProgress: this.coldProgress,
    };
  }

  burst(origin: THREE.Vector3, direction: THREE.Vector3, count = 12): void {
    const candidates = [...this.petals]
      .sort((a, b) => a.burstLife - b.burstLife)
      .slice(0, Math.max(1, Math.min(this.petals.length, count)));
    for (const petal of candidates) {
      petal.position.copy(origin).add(new THREE.Vector3(
        (this.random() - 0.5) * 0.55,
        (this.random() - 0.5) * 0.55,
        (this.random() - 0.5) * 0.55,
      ));
      petal.velocity
        .copy(direction)
        .multiplyScalar(1.2 + this.random() * 2.1)
        .add(new THREE.Vector3(
          (this.random() - 0.5) * 2.2,
          (this.random() - 0.25) * 1.8,
          (this.random() - 0.5) * 2.2,
        ));
      petal.burstLife = 1.1 + this.random() * 0.8;
      petal.scale = 0.7 + this.random() * 0.75;
    }
  }

  applyWind(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    strength: number,
    radius: number,
  ): void {
    const radiusSq = radius * radius;
    const normalized = direction.clone().normalize();
    for (const petal of this.petals) {
      const distanceSq = petal.position.distanceToSquared(origin);
      if (distanceSq > radiusSq) continue;
      const falloff = 1 - Math.sqrt(distanceSq) / radius;
      petal.velocity.addScaledVector(normalized, strength * falloff);
      petal.spin.z += strength * 0.15 * falloff;
    }
  }

  dispose(): void {
    for (const seasonal of [this.summerMesh, this.autumnMesh, this.winterMesh, this.fireflyMesh]) {
      seasonal.geometry.dispose();
      const seasonalMaterial = seasonal.material;
      if (Array.isArray(seasonalMaterial)) seasonalMaterial.forEach((entry) => entry.dispose());
      else seasonalMaterial.dispose();
    }
    this.snowMesh.geometry.dispose();
    const snowMaterial = this.snowMesh.material;
    if (Array.isArray(snowMaterial)) snowMaterial.forEach((entry) => entry.dispose());
    else snowMaterial.dispose();
    this.mesh.geometry.dispose();
    const material = this.mesh.material;
    if (Array.isArray(material)) material.forEach((entry) => entry.dispose());
    else material.dispose();
  }

  private createAmbientPetal(progress: number): Petal {
    const petal: Petal = {
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      rotation: new THREE.Euler(),
      spin: new THREE.Vector3(),
      scale: 1,
      phase: 0,
      swaySpeed: 1,
      swayAmplitude: 0.1,
      burstLife: 0,
      coldSeed: 0,
      snowScale: 1,
      canopyFlowActive: false,
      canopyFlowProgress: 0,
      canopyFlowSpeed: 0,
      canopyFlowLane: 0,
    };
    this.resetAmbient(petal, progress);
    return petal;
  }

  private resetAmbient(petal: Petal, progress: number): void {
    petal.position.set(
      (this.random() - 0.5) * 17,
      5.5 - progress * 10,
      (this.random() - 0.5) * 13,
    );
    const summer = this.seasonWeights.summer;
    const autumn = this.seasonWeights.autumn;
    const winter = this.seasonWeights.winter;
    const spring = this.seasonWeights.spring;
    petal.velocity.set(
      spring * (-0.16 - this.random() * 0.22)
        + summer * (-0.05 - this.random() * 0.12)
        + autumn * (0.34 + this.random() * 0.4)
        + winter * (-0.03 - this.random() * 0.1),
      spring * (-0.42 - this.random() * 0.34)
        + summer * (-0.18 - this.random() * 0.2)
        + autumn * (-0.48 - this.random() * 0.42)
        + winter * (-0.2 - this.random() * 0.2),
      0.04 + this.random() * 0.14,
    );
    petal.rotation.set(
      this.random() * Math.PI,
      this.random() * Math.PI,
      this.random() * Math.PI,
    );
    petal.spin.set(
      (this.random() - 0.5) * 2.5,
      (this.random() - 0.5) * 2.5,
      (this.random() - 0.5) * 2.5,
    );
    petal.scale = 0.55 + this.random() * 0.8;
    petal.phase = this.random() * Math.PI * 2;
    petal.swaySpeed = 0.55 + this.random() * 1.15;
    petal.swayAmplitude = 0.08 + this.random() * 0.16;
    petal.burstLife = 0;
    petal.coldSeed = this.random();
    petal.snowScale = 0.55 + this.random() * 0.38;
    petal.canopyFlowActive = false;
    petal.canopyFlowProgress = 0;
    petal.canopyFlowSpeed = 0;
    petal.canopyFlowLane = 0;
  }

  private beginCanopyFlow(): void {
    const count = Math.min(this.petals.length, Math.max(8, Math.round(this.petals.length * 0.38)));
    const candidates = [...this.petals]
      .sort((first, second) => first.burstLife - second.burstLife)
      .slice(0, count);
    candidates.forEach((petal, index) => {
      petal.canopyFlowActive = true;
      petal.canopyFlowProgress = (index / count + this.random() * 0.12) % 1;
      petal.canopyFlowSpeed = 0.16 + this.random() * 0.09;
      petal.canopyFlowLane = (index % 3) / 3 + (this.random() - 0.5) * 0.075;
      petal.burstLife = 0;
      petal.scale = 0.62 + this.random() * 0.62;
      petal.spin.set(
        (this.random() - 0.5) * 3.8,
        (this.random() - 0.5) * 3.8,
        (this.random() - 0.5) * 5.2,
      );
      this.placeCanopyPetal(petal);
    });
  }

  private endCanopyFlow(): void {
    for (const petal of this.petals) {
      if (!petal.canopyFlowActive) continue;
      petal.canopyFlowActive = false;
      petal.velocity.copy(this.canopyDirection).multiplyScalar(0.9 + this.random() * 0.8);
      petal.velocity.y -= 0.18 + this.random() * 0.22;
      petal.burstLife = 0.55 + this.random() * 0.4;
    }
  }

  private updateCanopyPetal(petal: Petal, delta: number): void {
    petal.canopyFlowProgress += delta * petal.canopyFlowSpeed * THREE.MathUtils.lerp(0.72, 1.45, this.canopyStrength);
    if (petal.canopyFlowProgress >= 1) {
      petal.canopyFlowProgress %= 1;
      petal.canopyFlowLane = ((petal.canopyFlowLane + 0.36 + this.random() * 0.16) % 1);
      petal.scale = 0.62 + this.random() * 0.62;
    }
    this.placeCanopyPetal(petal);
    petal.rotation.x += petal.spin.x * delta;
    petal.rotation.y += petal.spin.y * delta;
    petal.rotation.z += petal.spin.z * delta;
  }

  private placeCanopyPetal(petal: Petal): void {
    const progress = THREE.MathUtils.smoothstep(petal.canopyFlowProgress, 0, 1);
    const axisNormalized = THREE.MathUtils.lerp(-0.96, 0.76, progress);
    const angle = petal.canopyFlowLane * Math.PI * 2
      + Math.sin(progress * Math.PI) * 0.24
      + this.elapsed * 0.08;
    const radialScale = Math.sqrt(Math.max(0.04, 1 - axisNormalized * axisNormalized));
    const radialDirection = this.canopyTangent.clone().multiplyScalar(Math.cos(angle))
      .addScaledVector(this.canopyBitangent, Math.sin(angle));
    const outerRadius = this.canopyRadius * (1.045 + Math.sin(progress * Math.PI) * 0.055);
    petal.position.copy(this.canopyCenter)
      .addScaledVector(this.canopyDirection, axisNormalized * this.canopyRadius * 1.06)
      .addScaledVector(radialDirection, radialScale * outerRadius);
    const flutter = Math.sin(this.elapsed * (3.2 + petal.canopyFlowSpeed * 4) + petal.phase) * 0.055;
    petal.position.addScaledVector(radialDirection, flutter * this.canopyRadius);
  }

  private sync(): void {
    this.petals.forEach((petal, index) => {
      const localCold = THREE.MathUtils.smoothstep(
        this.coldProgress,
        petal.coldSeed * 0.5,
        petal.coldSeed * 0.5 + 0.3,
      );
      dummy.position.copy(petal.position);
      dummy.rotation.copy(petal.rotation);
      dummy.scale.setScalar(petal.scale * Math.max(0.001, 1 - localCold));
      dummy.updateMatrix();
      this.mesh.setMatrixAt(index, dummy.matrix);

      dummy.rotation.set(
        petal.rotation.x * 0.18,
        petal.rotation.y * 0.18,
        petal.rotation.z + petal.phase * 0.12,
      );
      dummy.scale.setScalar(petal.scale * petal.snowScale * Math.max(0.001, localCold));
      dummy.updateMatrix();
      this.snowMesh.setMatrixAt(index, dummy.matrix);

      dummy.rotation.set(petal.rotation.x * 0.7, petal.rotation.y * 0.7, petal.rotation.z);
      dummy.scale.set(
        petal.scale * (0.72 + petal.coldSeed * 0.1),
        petal.scale * (0.88 + (index % 4) * 0.035),
        1,
      );
      dummy.updateMatrix();
      this.summerMesh.setMatrixAt(index, dummy.matrix);
      dummy.rotation.set(petal.rotation.x * 0.62, petal.rotation.y * 0.62, petal.rotation.z + petal.phase * 0.04);
      dummy.scale.set(
        petal.scale * (0.76 + (index % 3) * 0.07),
        petal.scale * (0.74 + petal.coldSeed * 0.16),
        1,
      );
      dummy.updateMatrix();
      this.autumnMesh.setMatrixAt(index, dummy.matrix);
      dummy.rotation.set(0, 0, petal.rotation.z * 0.22);
      dummy.scale.set(
        petal.scale * (0.72 + (index % 4) * 0.065),
        petal.scale * (0.72 + petal.coldSeed * 0.18),
        1,
      );
      dummy.updateMatrix();
      this.winterMesh.setMatrixAt(index, dummy.matrix);
      dummy.position.y += Math.sin(this.elapsed * (0.65 + petal.coldSeed * 0.5) + petal.phase) * 0.42;
      dummy.position.x += Math.cos(this.elapsed * 0.48 + petal.phase) * 0.18;
      dummy.scale.setScalar((0.55 + petal.coldSeed * 0.42) * (0.8 + Math.sin(this.elapsed * 1.7 + petal.phase) * 0.15));
      dummy.updateMatrix();
      this.fireflyMesh.setMatrixAt(index, dummy.matrix);
    });
    this.mesh.instanceMatrix.needsUpdate = true;
    this.snowMesh.instanceMatrix.needsUpdate = true;
    this.summerMesh.instanceMatrix.needsUpdate = true;
    this.autumnMesh.instanceMatrix.needsUpdate = true;
    this.winterMesh.instanceMatrix.needsUpdate = true;
    this.fireflyMesh.instanceMatrix.needsUpdate = true;
  }
}

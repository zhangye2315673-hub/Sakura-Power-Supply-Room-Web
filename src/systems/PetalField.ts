import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PAL } from '../style/palette';
import { createSakuraPetalGeometry, createSakuraPetalMaterial } from './PetalVisual';

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
};

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
  private readonly petals: Petal[] = [];
  private elapsed = 0;
  private coldProgress = 0;
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

    for (let index = 0; index < count; index += 1) {
      this.petals.push(this.createAmbientPetal(index / count));
    }
    this.sync();
  }

  update(delta: number): void {
    this.elapsed += delta;
    for (const petal of this.petals) {
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

  setColdProgress(progress: number): void {
    this.coldProgress = THREE.MathUtils.clamp(progress, 0, 1);
    this.snowMesh.visible = this.coldProgress > 0.001;
  }

  get coldState(): Readonly<{ progress: number; snowflakeCount: number }> {
    return {
      progress: this.coldProgress,
      snowflakeCount: this.petals.filter((petal) => (
        THREE.MathUtils.smoothstep(this.coldProgress, petal.coldSeed * 0.5, petal.coldSeed * 0.5 + 0.3) > 0.5
      )).length,
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
    petal.velocity.set(
      -0.16 - this.random() * 0.22,
      -0.42 - this.random() * 0.34,
      0.05 + this.random() * 0.15,
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
    });
    this.mesh.instanceMatrix.needsUpdate = true;
    this.snowMesh.instanceMatrix.needsUpdate = true;
  }
}

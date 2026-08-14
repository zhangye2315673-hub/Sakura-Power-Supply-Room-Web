import * as THREE from 'three';

export const DEHUMIDIFIER_TIMELINE_OWNER = 'AppliancePerformanceSystem';

const UP = new THREE.Vector3(0, 1, 0);
const start = new THREE.Vector3();
const control = new THREE.Vector3();
const target = new THREE.Vector3();
const point = new THREE.Vector3();
const tangent = new THREE.Vector3();

function pulse(time: number, startTime: number, peakTime: number, endTime: number): number {
  return THREE.MathUtils.smoothstep(time, startTime, peakTime)
    * (1 - THREE.MathUtils.smoothstep(time, peakTime, endTime));
}

function readVector(value: unknown, fallback: THREE.Vector3): THREE.Vector3 {
  if (Array.isArray(value) && value.length >= 3) {
    fallback.set(Number(value[0]), Number(value[1]), Number(value[2]));
  } else {
    fallback.set(0, 0, 0);
  }
  return fallback;
}

function phaseAt(time: number): 'startup' | 'gather' | 'working' | 'climax' | 'satisfied' {
  if (time < 0.58) return 'startup';
  if (time < 1.42) return 'gather';
  if (time < 3.25) return 'working';
  if (time < 4.26) return 'climax';
  return 'satisfied';
}

/**
 * One authored dehumidifier skill used by both gameplay and gallery sessions.
 * All machine deformation targets the whole-machine pivot. Humidity actors are
 * root siblings and follow curved, accelerating 3D trajectories into the crown.
 */
export function applyDehumidifierPerformance(
  root: THREE.Group,
  time: number,
  power: number,
): void {
  const p = THREE.MathUtils.clamp(power, 0, 1);
  const whole = root.getObjectByName('dehumidifier-whole-machine-pivot');
  const controlButton = root.getObjectByName('dehumidifier-front-control-button-pivot');
  const controlFace = root.getObjectByName('dehumidifier-front-round-sakura-control');
  const controlGlint = root.getObjectByName('dehumidifier-control-button-glint');
  const water = root.getObjectByName('dehumidifier-visible-collected-water-column');
  const suctionRim = root.getObjectByName('dehumidifier-mint-top-exhaust-rim') as THREE.Mesh | null;

  const startupDip = pulse(time, 0.02, 0.24, 0.62) * p;
  const working = THREE.MathUtils.smoothstep(time, 0.48, 0.86)
    * (1 - THREE.MathUtils.smoothstep(time, 4.2, 4.58)) * p;
  const breathing = Math.sin((time - 0.52) * 10.8) * 0.5 + 0.5;
  const climaxSquash = pulse(time, 3.22, 3.56, 3.78) * p;
  const climaxRebound = pulse(time, 3.58, 3.82, 4.08) * p;
  const satisfiedGate = THREE.MathUtils.smoothstep(time, 4.24, 4.36)
    * (1 - THREE.MathUtils.smoothstep(time, 4.36, 5.18)) * p;

  if (whole) {
    const breathAmount = breathing * working;
    whole.scale.set(
      1 + breathAmount * 0.022 + climaxSquash * 0.06 - climaxRebound * 0.028,
      1 - breathAmount * 0.032 - climaxSquash * 0.145 + climaxRebound * 0.095,
      1 + breathAmount * 0.018 + climaxSquash * 0.048 - climaxRebound * 0.022,
    );
    whole.position.x += Math.sin(time * 31) * (0.011 + climaxSquash * 0.022) * working;
    whole.position.y += -startupDip * 0.065
      + Math.sin(time * 37 + 0.4) * 0.008 * working
      + Math.abs(Math.sin((time - 4.24) * 10.6)) * 0.075 * satisfiedGate;
    whole.rotation.z += Math.sin(time * 28) * 0.006 * working
      + Math.sin((time - 4.24) * 9.2) * 0.035 * satisfiedGate;
  }

  if (controlButton) {
    const pressed = THREE.MathUtils.smoothstep(time, 0.06, 0.3)
      * (1 - THREE.MathUtils.smoothstep(time, 4.32, 4.78)) * p;
    // Keep the physical face clear of the front shell through the full press.
    controlButton.position.z -= pressed * 0.018;
  }
  // The button remains a physical control for the whole skill. It can depress
  // and rebound, but its face and highlight never disappear from the appliance.
  if (controlFace) controlFace.visible = true;
  if (controlGlint) controlGlint.visible = true;

  const waterFill = THREE.MathUtils.smoothstep(time, 0.86, 4.34) * p;
  if (water) {
    water.scale.y = 0.12 + waterFill * 0.68;
    water.position.y = -0.2332 + waterFill * 0.18;
  }

  if (suctionRim) {
    const materials = Array.isArray(suctionRim.material)
      ? suctionRim.material
      : [suctionRim.material];
    const glowStrength = (
      THREE.MathUtils.smoothstep(time, 0.28, 0.82) * 0.72
      + climaxSquash * 1.7
      + climaxRebound * 0.75
    ) * p;
    materials.forEach((material) => {
      const toon = material as THREE.MeshToonMaterial;
      toon.emissive?.setHex(glowStrength > 0.01 ? 0x7cddff : 0x000000);
      if (typeof toon.emissiveIntensity === 'number') toon.emissiveIntensity = glowStrength;
    });
  }

  const particles: THREE.Object3D[] = [];
  root.traverse((object) => {
    if (object.name.startsWith('dehumidifier-humidity-particle-pivot-')) particles.push(object);
  });
  const visibleByKind = { droplet: 0, mist: 0, wisp: 0 };
  const climaxPull = THREE.MathUtils.smoothstep(time, 3.26, 4.08);

  particles.forEach((particle, index) => {
    const spawnTime = Number(particle.userData.spawnTime ?? 0);
    const captureTime = Number(particle.userData.captureTime ?? 4.1);
    const kind = String(particle.userData.effectKind ?? 'mist') as keyof typeof visibleByKind;
    const local = THREE.MathUtils.clamp(
      (time - spawnTime) / Math.max(0.01, captureTime - spawnTime),
      0,
      1,
    );
    // Keep each actor on its own eased path. A shared climax override made all
    // droplets reach the grille and disappear on the same frame.
    const accelerated = local ** 1.85;
    const progress = THREE.MathUtils.clamp(accelerated, 0, 1);
    particle.visible = time >= spawnTime && progress < 0.992 && p > 0.01;
    if (!particle.visible) return;
    visibleByKind[kind] += 1;

    readVector(particle.userData.trajectoryStart, start);
    readVector(particle.userData.trajectoryControl, control);
    readVector(particle.userData.trajectoryTarget, target);
    const inverse = 1 - progress;
    point.copy(start).multiplyScalar(inverse * inverse)
      .addScaledVector(control, 2 * inverse * progress)
      .addScaledVector(target, progress * progress);
    particle.position.copy(point);

    tangent.copy(control).sub(start).multiplyScalar(2 * inverse)
      .add(target.clone().sub(control).multiplyScalar(2 * progress));
    if (tangent.lengthSq() > 0.000001) {
      tangent.normalize();
      particle.quaternion.setFromUnitVectors(UP, tangent);
    }

    const appear = THREE.MathUtils.smoothstep(time, spawnTime, spawnTime + 0.16);
    const vanish = 1 - THREE.MathUtils.smoothstep(progress, 0.88, 0.995);
    const flutter = 1 + Math.sin(time * 5.4 + index * 1.77) * 0.09;
    if (kind === 'droplet') {
      particle.scale.set(
        appear * vanish * (0.96 - progress * 0.36),
        appear * vanish * (1 + progress * progress * 1.4),
        appear * vanish * (0.96 - progress * 0.36),
      );
    } else if (kind === 'wisp') {
      particle.scale.set(
        appear * vanish * (0.92 - progress * 0.3),
        appear * vanish * (1 + progress * 1.35),
        appear * vanish * (0.92 - progress * 0.3),
      );
      particle.rotation.y += time * (index % 2 === 0 ? 1.8 : -1.8);
    } else {
      particle.scale.setScalar(appear * vanish * flutter * (1 - progress * 0.24));
      particle.rotation.y += time * (index % 2 === 0 ? 1.2 : -1.2);
      particle.rotation.z += Math.sin(time * 2.6 + index) * 0.22;
    }
  });

  root.userData.dehumidifierPerformance = {
    timelineOwner: DEHUMIDIFIER_TIMELINE_OWNER,
    phase: phaseAt(time),
    time,
    machineMotionRoot: 'dehumidifier-whole-machine-pivot',
    fanRotates: false,
    visibleHumidity: visibleByKind,
    visibleHumidityTotal: visibleByKind.droplet + visibleByKind.mist + visibleByKind.wisp,
    climaxPull,
    waterFill,
  };
}

export function resetDehumidifierPerformance(root: THREE.Group): void {
  delete root.userData.dehumidifierPerformance;
}

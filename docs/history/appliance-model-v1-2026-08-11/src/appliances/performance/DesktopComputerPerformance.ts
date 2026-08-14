import * as THREE from 'three';

export type DesktopComputerPhase = 'boot' | 'working' | 'straining' | 'overload' | 'settle';

export type DesktopComputerPerformanceDiagnostics = {
  timelineTime: number;
  phase: DesktopComputerPhase;
  runEnvelope: number;
  strain: number;
  overload: number;
  settle: number;
  towerShake: number;
  monitorWobble: number;
  visibleSmokePuffs: number;
  smokeGeometry: 'irregular-multi-lobed-low-poly-volume';
  smokeSource: 'desktop-computer-top-vent-socket';
  fanPropRemoved: true;
  screenContentPreserved: true;
  timelineOwner: 'AppliancePerformanceSystem';
};

type NamedNodeCache = {
  tower: THREE.Object3D | null;
  monitor: THREE.Object3D | null;
  screenTilt: THREE.Object3D | null;
  mouse: THREE.Object3D | null;
  mouseButton: THREE.Object3D | null;
  mouseWheel: THREE.Object3D | null;
  powerButton: THREE.Object3D | null;
  screen: THREE.Object3D | null;
  boot: THREE.Object3D | null;
  main: THREE.Object3D | null;
  secondary: THREE.Object3D | null;
  cursor: THREE.Object3D | null;
  blue: THREE.Object3D | null;
  powerLed: THREE.Mesh | null;
  monitorLed: THREE.Mesh | null;
  keys: THREE.Object3D[];
  smoke: THREE.Mesh[];
};

function smoothPulse(time: number, start: number, peak: number, end: number): number {
  return THREE.MathUtils.smoothstep(time, start, peak)
    * (1 - THREE.MathUtils.smoothstep(time, peak, end));
}

function mesh(root: THREE.Object3D, name: string): THREE.Mesh | null {
  const object = root.getObjectByName(name);
  return object instanceof THREE.Mesh ? object : null;
}

function setGlow(target: THREE.Mesh | null, strength: number, color: number): void {
  if (!target) return;
  const materials = Array.isArray(target.material) ? target.material : [target.material];
  materials.forEach((material) => {
    const toon = material as THREE.MeshToonMaterial;
    toon.color?.setHex(strength > 0.02 ? 0xffd8e4 : 0x81798f);
    toon.emissive?.setHex(strength > 0.02 ? color : 0x000000);
    if (typeof toon.emissiveIntensity === 'number') toon.emissiveIntensity = strength * 2.1;
  });
}

function phaseAt(time: number): DesktopComputerPhase {
  if (time < 0.82) return 'boot';
  if (time < 2.15) return 'working';
  if (time < 3.55) return 'straining';
  if (time < 4.48) return 'overload';
  return 'settle';
}

export function createDesktopComputerPerformance(root: THREE.Group): {
  apply(time: number, power: number): void;
  reset(): void;
} {
  const named: NamedNodeCache = {
    tower: root.getObjectByName('desktop-computer-tower-assembly-pivot') ?? null,
    monitor: root.getObjectByName('desktop-computer-monitor-assembly-pivot') ?? null,
    screenTilt: root.getObjectByName('desktop-computer-screen-tilt-pivot') ?? null,
    mouse: root.getObjectByName('desktop-computer-mouse-assembly-pivot') ?? null,
    mouseButton: root.getObjectByName('desktop-computer-mouse-button-pivot') ?? null,
    mouseWheel: root.getObjectByName('desktop-computer-mouse-wheel-pivot') ?? null,
    powerButton: root.getObjectByName('desktop-computer-power-button-pivot') ?? null,
    screen: root.getObjectByName('desktop-computer-screen-state-pivot') ?? null,
    boot: root.getObjectByName('desktop-computer-boot-logo-pivot') ?? null,
    main: root.getObjectByName('desktop-computer-main-window-pivot') ?? null,
    secondary: root.getObjectByName('desktop-computer-secondary-window-pivot') ?? null,
    cursor: root.getObjectByName('desktop-computer-screen-cursor-pivot') ?? null,
    blue: root.getObjectByName('desktop-computer-classic-blue-screen-pivot') ?? null,
    powerLed: mesh(root, 'desktop-computer-power-led'),
    monitorLed: mesh(root, 'desktop-computer-monitor-status-dot'),
    keys: [],
    smoke: [],
  };
  root.traverse((object) => {
    if (object.name.startsWith('desktop-computer-active-key-') && object.name.endsWith('-pivot')) {
      named.keys.push(object);
    }
    if (object instanceof THREE.Mesh && object.name.startsWith('desktop-computer-volumetric-smoke-puff-')) {
      named.smoke.push(object);
    }
  });
  named.smoke.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  const applySmoke = (time: number, power: number, overload: number): number => {
    let visible = 0;
    named.smoke.forEach((puff, index) => {
      const delay = 2.05 + index * 0.205;
      const life = 1.55 + index % 3 * 0.2;
      const local = time - delay;
      const progress = THREE.MathUtils.clamp(local / life, 0, 1);
      const alpha = local >= 0 && local < life
        ? THREE.MathUtils.smoothstep(progress, 0, 0.16) * (1 - THREE.MathUtils.smoothstep(progress, 0.68, 1)) * power
        : 0;
      puff.visible = alpha > 0.012;
      if (!puff.visible) return;
      visible += 1;
      const side = index % 2 === 0 ? -1 : 1;
      const rise = 0.55 + progress * (1.25 + index % 4 * 0.23) + overload * progress * 0.32;
      const drift = side * progress * (0.2 + index % 3 * 0.13)
        + Math.sin(progress * Math.PI * 2.4 + index) * 0.08;
      puff.position.set(drift, rise, Math.cos(index * 1.7 + progress * 4.2) * 0.15 * progress);
      puff.rotation.set(
        progress * (0.7 + index % 3 * 0.21),
        progress * side * (1.2 + index % 4 * 0.18),
        progress * (0.45 + index % 2 * 0.34),
      );
      const growth = 0.28 + THREE.MathUtils.smoothstep(progress, 0, 0.78) * (1.12 + index % 3 * 0.13);
      const billow = Math.sin(progress * Math.PI * 3 + index * 0.8) * 0.07 * (1 - progress);
      puff.scale.set(
        growth * (0.86 + index % 2 * 0.16 + billow),
        growth * (1.02 + index % 3 * 0.08 - billow * 0.5),
        growth * (0.78 + (index + 1) % 3 * 0.11 + billow * 0.35),
      );
      const materials = Array.isArray(puff.material) ? puff.material : [puff.material];
      materials.forEach((material) => { material.opacity = alpha * (0.58 + index % 3 * 0.08); });
    });
    return visible;
  };

  return {
    apply: (time, power) => {
      const p = THREE.MathUtils.clamp(power, 0, 1);
      const startup = THREE.MathUtils.smoothstep(time, 0.03, 0.42) * p;
      const strain = THREE.MathUtils.smoothstep(time, 1.72, 3.42)
        * (1 - THREE.MathUtils.smoothstep(time, 4.35, 5.12)) * p;
      const overload = smoothPulse(time, 3.18, 4.04, 4.7) * p;
      const settle = THREE.MathUtils.smoothstep(time, 4.42, 4.62) * p;
      const settleDecay = settle * Math.exp(-Math.max(0, time - 4.42) * 5.2);
      const inputEnvelope = THREE.MathUtils.smoothstep(time, 0.78, 1.2)
        * (1 - THREE.MathUtils.smoothstep(time, 4.04, 4.45)) * p;
      const towerShake = strain * (0.025 + overload * 0.075);
      const monitorWobble = strain * 0.015 + overload * 0.03 + settleDecay * 0.045;

      if (named.powerButton) named.powerButton.position.z -= THREE.MathUtils.smoothstep(time, 0.02, 0.16) * 0.055 * p;
      setGlow(named.powerLed, startup, 0xff647d);
      setGlow(named.monitorLed, startup * (0.82 + overload * 0.18), overload > 0.35 ? 0xff7a68 : 0x72e7f3);

      named.keys.forEach((key, index) => {
        const rhythm = Math.max(0, Math.sin(time * (19 + strain * 15) + index * 1.73)) ** (5 - overload * 2);
        key.position.y -= rhythm * (0.055 + overload * 0.075) * inputEnvelope;
      });
      if (named.mouse) {
        named.mouse.position.x += Math.sin(time * (2.8 + strain * 4.5)) * (0.18 + strain * 0.22) * inputEnvelope;
        named.mouse.position.z += Math.cos(time * (3.4 + strain * 3.1)) * (0.15 + strain * 0.2) * inputEnvelope;
        named.mouse.rotation.y += Math.sin(time * 5.2) * strain * 0.045;
      }
      if (named.mouseButton) named.mouseButton.rotation.x -= Math.max(0, Math.sin(time * 15.5)) ** 7 * 0.1 * inputEnvelope;
      if (named.mouseWheel) named.mouseWheel.rotation.x += time * (4 + strain * 8) * inputEnvelope;

      if (named.tower) {
        named.tower.position.x += Math.sin(time * (29 + overload * 15)) * towerShake;
        named.tower.position.z += Math.cos(time * (24 + overload * 12)) * towerShake * 0.64;
        named.tower.rotation.z += Math.sin(time * 21) * towerShake * 0.12
          + Math.sin((time - 4.42) * 19) * settleDecay * 0.035;
        named.tower.scale.set(
          1 + overload * 0.018,
          1 - overload * 0.026,
          1 + overload * 0.016,
        );
      }
      if (named.monitor) {
        named.monitor.position.y += Math.sin(time * 23) * monitorWobble;
        named.monitor.rotation.z += Math.sin(time * 18.5) * monitorWobble * 0.45
          + Math.sin((time - 4.42) * 17) * settleDecay * 0.024;
      }
      if (named.screenTilt) named.screenTilt.rotation.x += Math.sin(time * 27) * overload * 0.014;

      const blueVisible = time >= 3.72 && time < 4.55;
      if (named.screen) named.screen.visible = startup > 0.01;
      if (named.boot) named.boot.visible = time >= 0.12 && time < 0.82;
      if (named.main) {
        named.main.visible = time >= 0.62 && !blueVisible;
        named.main.scale.setScalar(Math.max(0.001, THREE.MathUtils.smoothstep(time, 0.62, 1.05)));
      }
      if (named.secondary) {
        named.secondary.visible = time >= 0.92 && !blueVisible;
        named.secondary.scale.setScalar(Math.max(0.001, THREE.MathUtils.smoothstep(time, 0.92, 1.38)));
      }
      if (named.cursor) named.cursor.visible = time >= 1.15 && time < 3.72;
      if (named.blue) {
        named.blue.visible = blueVisible;
        const hit = THREE.MathUtils.smoothstep(time, 3.72, 3.82);
        named.blue.scale.set(1 + (1 - hit) * 0.08, 1 - (1 - hit) * 0.08, 1);
      }

      const visibleSmokePuffs = applySmoke(time, p, overload);
      root.userData.desktopComputerPerformanceDiagnostics = {
        timelineTime: time,
        phase: phaseAt(time),
        runEnvelope: startup,
        strain,
        overload,
        settle,
        towerShake,
        monitorWobble,
        visibleSmokePuffs,
        smokeGeometry: 'irregular-multi-lobed-low-poly-volume',
        smokeSource: 'desktop-computer-top-vent-socket',
        fanPropRemoved: true,
        screenContentPreserved: true,
        timelineOwner: 'AppliancePerformanceSystem',
      } satisfies DesktopComputerPerformanceDiagnostics;
    },
    reset: () => {
      delete root.userData.desktopComputerPerformanceDiagnostics;
    },
  };
}

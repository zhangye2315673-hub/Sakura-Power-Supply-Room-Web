import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  ApplianceModelKit,
  orientCylinderBetween,
  type ApplianceModelBuild,
  type ApplianceModelOptions,
} from '../ApplianceModelKit';

const REFERENCE_PATH = 'D:/downloads/ChatGPT Image 2026-08-02 20_03_02 (1).png';

function tone(accent: number, lightness: number, saturation = 0): number {
  return new THREE.Color(accent).offsetHSL(0, saturation, lightness).getHex();
}

function lathe(points: readonly (readonly [number, number])[], segments = 28): THREE.LatheGeometry {
  return new THREE.LatheGeometry(points.map(([radius, y]) => new THREE.Vector2(radius, y)), segments);
}

function tubeThrough(points: readonly THREE.Vector3[], radius: number): THREE.TubeGeometry {
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3([...points], false, 'centripetal'), 36, radius, 10, false);
}

function irregularSteamLobe(radius: number, seed: number): THREE.IcosahedronGeometry {
  const geometry = new THREE.IcosahedronGeometry(radius, 1);
  const position = geometry.getAttribute('position') as THREE.BufferAttribute;
  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const y = position.getY(index);
    const z = position.getZ(index);
    const deformation = 1 + Math.sin(
      x * (11.7 + seed * 0.31)
      + y * (8.9 + seed * 0.23)
      + z * (13.1 + seed * 0.17)
      + seed * 1.73,
    ) * 0.105;
    position.setXYZ(index, x * deformation, y * deformation, z * deformation);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Animation-ready Sakura reconstruction of the supplied electric-kettle tri-view.
 * Local frame: +Y up, +Z front, floor at Y=0. The lid, handle, switch,
 * gauge water, bubbles and spout socket are separate runtime assemblies.
 */
export function createKettleModel(options: ApplianceModelOptions): ApplianceModelBuild {
  const kit = new ApplianceModelKit(options);
  const accentLight = tone(options.accent, 0.2, -0.08);
  const accentMid = tone(options.accent, 0.08, -0.04);
  const accentDark = tone(options.accent, -0.13, 0.01);

  const shell = kit.material(0xf5eee1, { tint: 0x756a7e });
  const shellLight = kit.material(0xfff7ea, { tint: 0x7d7084 });
  const accent = kit.material(accentMid, { tint: 0x685b71 });
  const accentDeep = kit.material(accentDark, { tint: 0x574b60 });
  const seam = kit.material(0x686471, { tint: 0x4d4756 });
  const rubber = kit.material(0x4f4c58, { tint: 0x3e3946 });
  const metal = kit.material(0xa9adb0, { tint: 0x5f5b6a });
  const gauge = kit.material(0xc9d6d8, { tint: accentMid, transparent: true, opacity: 0.62 });
  gauge.depthWrite = false;
  const water = kit.material(accentLight, {
    tint: 0x62778a,
    emissive: accentLight,
    transparent: true,
    opacity: 0.2,
  });
  water.depthWrite = false;
  water.emissiveIntensity = 0;
  // Pass 1 - lock the reference silhouette with a continuous tapered shell.
  const bodyPivot = kit.pivot('kettle-body-pivot');
  const body = kit.mesh(
    'kettle-rounded-tapered-body-shell',
    lathe([
      [0, 0.27],
      [0.7, 0.27],
      [0.82, 0.34],
      [0.88, 0.48],
      [0.82, 1.68],
      [0.72, 1.86],
      [0.55, 1.94],
      [0, 1.94],
    ], 32),
    accent,
    bodyPivot,
  );
  body.userData.part = 'body-shell';

  const shoulder = kit.mesh(
    'kettle-cream-shoulder-band',
    lathe([
      [0, 1.73],
      [0.75, 1.73],
      [0.79, 1.81],
      [0.7, 1.93],
      [0, 1.98],
    ], 32),
    shell,
    bodyPivot,
  );
  shoulder.userData.part = 'shoulder-band';

  const lowerRail = kit.mesh(
    'kettle-lower-cream-rail',
    lathe([
      [0, 0.2],
      [0.72, 0.2],
      [0.84, 0.27],
      [0.88, 0.39],
      [0, 0.39],
    ], 30),
    shell,
    bodyPivot,
  );
  lowerRail.userData.explodeWithParent = true;

  const bodySeam = kit.mesh(
    'kettle-body-base-seam',
    new THREE.TorusGeometry(0.845, 0.018, 6, 32),
    seam,
    bodyPivot,
    false,
  );
  bodySeam.rotation.x = Math.PI * 0.5;
  bodySeam.position.y = 0.39;
  bodySeam.userData.explodeWithParent = true;

  // Separate electrical base keeps the prop from reading as a plain jug.
  const powerBase = kit.pivot('kettle-power-base-pivot');
  const base = kit.mesh(
    'kettle-circular-power-base',
    new THREE.CylinderGeometry(0.89, 0.84, 0.2, 28),
    shellLight,
    powerBase,
  );
  base.position.y = 0.12;
  const baseAccent = kit.mesh(
    'kettle-power-base-accent-ring',
    new THREE.CylinderGeometry(0.9, 0.89, 0.07, 28),
    accentDeep,
    powerBase,
  );
  baseAccent.position.y = 0.055;

  // Pass 2 - independent lid with a low top button and seating seam.
  const lidPivot = kit.pivot('kettle-lid-hinge-pivot', bodyPivot);
  lidPivot.position.set(0, 1.93, -0.48);
  lidPivot.userData.rotationAxis = [1, 0, 0];
  lidPivot.userData.rotationRange = [0, 1.0];
  kit.socket('kettle-lid-hinge-socket', lidPivot, [0, 0, 0]);

  const lid = kit.mesh(
    'kettle-separate-domed-lid',
    new THREE.CylinderGeometry(0.49, 0.57, 0.16, 26),
    shellLight,
    lidPivot,
  );
  lid.position.set(0, 0.09, 0.48);
  const lidSeat = kit.mesh(
    'kettle-lid-seat-ring',
    new THREE.TorusGeometry(0.53, 0.022, 6, 26),
    seam,
    lidPivot,
    false,
  );
  lidSeat.rotation.x = Math.PI * 0.5;
  lidSeat.position.set(0, 0.01, 0.48);
  const lidButton = kit.mesh(
    'kettle-lid-top-button',
    new RoundedBoxGeometry(0.32, 0.08, 0.22, 3, 0.04),
    accent,
    lidPivot,
  );
  lidButton.position.set(0, 0.21, 0.44);

  // Short upward metal spout, constructed around the actual attachment line.
  const spoutPivot = kit.pivot('kettle-spout-pivot', bodyPivot);
  kit.socket('kettle-spout-body-socket', spoutPivot, [-0.62, 1.52, 0.02]);
  const spoutStart = new THREE.Vector3(-0.61, 1.48, 0.02);
  const spoutEnd = new THREE.Vector3(-1.05, 1.79, 0.02);
  const spout = kit.mesh(
    'kettle-short-metal-spout',
    new THREE.CylinderGeometry(0.14, 0.31, 1, 12, 1, false),
    metal,
    spoutPivot,
  );
  orientCylinderBetween(spout, spoutStart, spoutEnd);
  const spoutDirection = spoutEnd.clone().sub(spoutStart).normalize();
  const spoutOutlet = spoutEnd.clone().addScaledVector(spoutDirection, 0.018);
  const spoutLip = kit.mesh(
    'kettle-spout-outlet-lip',
    new THREE.TorusGeometry(0.145, 0.027, 6, 14),
    seam,
    spoutPivot,
  );
  spoutLip.position.copy(spoutOutlet);
  spoutLip.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), spoutDirection);
  const steamSocket = kit.socket('kettle-spout-steam-socket', spoutPivot, spoutOutlet);

  // The visible plume is an animation-ready assembly of lit, overlapping
  // low-poly volumes. It lives on the real outlet socket so game and gallery
  // can drive the exact same hierarchy without a second particle animation.
  const puffLayouts = [
    [[0, 0, 0, 1.00], [-0.13, 0.05, 0.01, 0.72], [0.13, 0.08, -0.03, 0.78], [-0.02, 0.19, 0.04, 0.82], [0.02, 0.02, 0.09, 0.68]],
    [[0, 0, 0, 0.92], [-0.1, 0.11, 0.03, 0.8], [0.15, 0.04, 0.02, 0.69], [0.05, 0.2, -0.04, 0.88], [-0.04, 0.06, 0.1, 0.62]],
    [[0, 0.03, 0, 1.04], [-0.15, 0.08, -0.01, 0.65], [0.12, 0.13, 0.05, 0.81], [-0.03, 0.23, -0.02, 0.74], [0.05, 0.02, 0.11, 0.72]],
  ] as const;
  for (let puffIndex = 0; puffIndex < 7; puffIndex += 1) {
    const pivot = kit.pivot(`kettle-volumetric-steam-puff-${puffIndex + 1}-pivot`, steamSocket);
    pivot.visible = false;
    pivot.userData.steamPuffIndex = puffIndex;
    pivot.userData.phaseOffset = puffIndex * 0.18;
    pivot.userData.baseScale = 0.86 + (puffIndex % 3) * 0.11;
    pivot.userData.lateralBias = ((puffIndex % 3) - 1) * 0.035;
    pivot.userData.twistRate = 0.34 + (puffIndex % 4) * 0.09;
    const shellMaterial = kit.material(0xfff6ef, {
      tint: 0x8f8596,
      emissive: 0xf4dce7,
      transparent: true,
      opacity: 0,
    });
    shellMaterial.depthWrite = false;
    shellMaterial.emissiveIntensity = 0.045;
    const shadeMaterial = kit.material(0xded8e5, {
      tint: 0x746b7f,
      emissive: 0xd5bfce,
      transparent: true,
      opacity: 0,
    });
    shadeMaterial.depthWrite = false;
    shadeMaterial.emissiveIntensity = 0.025;
    const layout = puffLayouts[puffIndex % puffLayouts.length];
    layout.forEach(([x, y, z, scale], lobeIndex) => {
      const lobe = kit.mesh(
        `kettle-steam-puff-${puffIndex + 1}-lobe-${lobeIndex + 1}`,
        irregularSteamLobe(0.24 * scale, puffIndex * 7 + lobeIndex + 1),
        lobeIndex === layout.length - 1 ? shadeMaterial : shellMaterial,
        pivot,
        false,
      );
      lobe.position.set(x, y, z);
      lobe.scale.set(
        0.84 + ((puffIndex + lobeIndex) % 3) * 0.09,
        1.02 + ((puffIndex * 2 + lobeIndex) % 3) * 0.12,
        0.78 + ((puffIndex + lobeIndex * 2) % 4) * 0.08,
      );
      lobe.userData.explodeWithParent = true;
      lobe.userData.volumeEffect = 'stylized-condensed-steam';
    });
  }

  // D-shaped nested handle follows the reference's cream centre and accent rim.
  // The two tube endpoints overlap the body to eliminate floating attachments.
  const handlePivot = kit.pivot('kettle-handle-pivot', bodyPivot);
  const handlePoints = [
    new THREE.Vector3(0.56, 1.65, -0.18),
    new THREE.Vector3(0.88, 1.64, -0.18),
    new THREE.Vector3(1.06, 1.44, -0.18),
    new THREE.Vector3(1.11, 1.1, -0.18),
    new THREE.Vector3(1.07, 0.74, -0.18),
    new THREE.Vector3(0.89, 0.56, -0.18),
    new THREE.Vector3(0.6, 0.55, -0.18),
  ];
  kit.socket('kettle-handle-upper-socket', handlePivot, handlePoints[0]);
  kit.socket('kettle-handle-lower-socket', handlePivot, handlePoints.at(-1)!);
  const handleOuter = kit.mesh(
    'kettle-handle-accent-outer-strap',
    tubeThrough(handlePoints, 0.145),
    accentDeep,
    handlePivot,
  );
  handleOuter.userData.part = 'handle';
  const handleInner = kit.mesh(
    'kettle-handle-cream-inner-grip',
    tubeThrough(handlePoints, 0.095),
    shellLight,
    handlePivot,
  );
  handleInner.userData.explodeWithParent = true;

  // Front water gauge and repeated marks are real geometry, not a painted icon.
  const gaugePanel = kit.mesh(
    'kettle-front-water-level-window',
    new RoundedBoxGeometry(0.24, 0.92, 0.045, 4, 0.11),
    gauge,
    bodyPivot,
    false,
  );
  gaugePanel.position.set(-0.15, 1.1, 0.815);
  gaugePanel.renderOrder = 3;
  const gaugeWater = kit.mesh(
    'kettle-gauge-water-volume',
    new RoundedBoxGeometry(0.17, 0.62, 0.035, 3, 0.075),
    water,
    bodyPivot,
    false,
  );
  gaugeWater.position.set(-0.15, 0.98, 0.845);
  gaugeWater.renderOrder = 2;
  for (let index = 0; index < 7; index += 1) {
    const tick = kit.mesh(
      `kettle-water-gauge-tick-${index + 1}`,
      new RoundedBoxGeometry(0.055, 0.013, 0.014, 1, 0.005),
      seam,
      bodyPivot,
      false,
    );
    tick.position.set(-0.15, 0.82 + index * 0.095, 0.875);
    tick.userData.explodeWithParent = true;
  }

  // Switch has a real pivot and a separate powered lamp.
  const switchPivot = kit.pivot('kettle-power-switch-pivot', bodyPivot);
  switchPivot.position.set(0.12, 0.5, 0.86);
  switchPivot.userData.rotationAxis = [1, 0, 0];
  switchPivot.userData.rotationRange = [-0.14, 0.1];
  const switchSeat = kit.mesh(
    'kettle-power-switch-seat',
    new THREE.CylinderGeometry(0.105, 0.105, 0.035, 16),
    accentDeep,
    switchPivot,
  );
  switchSeat.rotation.x = Math.PI * 0.5;
  const powerSwitch = kit.mesh(
    'kettle-power-switch-button',
    new THREE.CylinderGeometry(0.078, 0.082, 0.055, 16),
    accent,
    switchPivot,
  );
  powerSwitch.rotation.x = Math.PI * 0.5;
  powerSwitch.position.z = 0.03;
  const switchIndex = kit.mesh(
    'kettle-power-switch-index',
    new RoundedBoxGeometry(0.018, 0.072, 0.014, 1, 0.006),
    seam,
    switchPivot,
    false,
  );
  switchIndex.position.set(0, 0.026, 0.064);
  kit.indicator([0.12, 0.5, 0.93], 0.025);

  const rearSocket = kit.mesh(
    'kettle-rear-power-cable-port',
    new RoundedBoxGeometry(0.22, 0.13, 0.05, 2, 0.04),
    rubber,
    powerBase,
  );
  rearSocket.position.set(0, 0.13, -0.86);
  kit.socket('kettle-rear-power-socket', rearSocket, [0, 0, -0.045]);

  for (const [index, x, z] of [
    [1, -0.56, 0.4], [2, 0.56, 0.4], [3, -0.56, -0.4], [4, 0.56, -0.4],
  ] as const) {
    const foot = kit.mesh(
      `kettle-rubber-foot-${index}`,
      new THREE.CylinderGeometry(0.085, 0.1, 0.07, 10),
      rubber,
      kit.root,
      false,
    );
    foot.position.set(x, 0.035, z);
  }

  return kit.finish(
    {
      referencePath: options.referencePath ?? REFERENCE_PATH,
      reconstructed: [
        'rounded tapered kettle shell with narrower shoulder, broad lower belly and separate electrical base',
        'independent cream lid, top button, lid seam and animation-ready rear hinge pivot',
        'short upward low-saturation metal spout with dark lip and a true steam socket',
        'large open D-shaped handle with accent rim, cream grip and upper/lower body attachment sockets',
        'front translucent water-level window, separate water volume and seven repeated measurement marks',
        'front power switch/status light, rear power port and four low rubber feet',
        'named body, switch and lid pivots plus one spout socket for the unified performance module',
        'seven staggered volumetric steam-puff assemblies built from lit, vertex-deformed low-poly lobes',
      ],
      inferred: [
        'the local reference file path was unavailable to this worker; proportions were reconstructed from the supplied tri-view embedded in the task',
        'internal heating plate, thermostat, wiring, insulation and lid seal are hidden and intentionally not modeled',
        'rear cable-port depth and underside four-foot arrangement are inferred because the reference does not expose the underside clearly',
        'handle screws and internal upper/lower reinforcement are inferred as closed attachments rather than fabricated hardware',
      ],
    },
  );
}

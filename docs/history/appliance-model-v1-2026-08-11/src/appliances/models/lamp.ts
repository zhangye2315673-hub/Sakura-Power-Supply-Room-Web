import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  ApplianceModelKit,
  type ApplianceModelBuild,
  type ApplianceModelOptions,
} from '../ApplianceModelKit';

const REFERENCE_PATH = 'D:/下载文件/ChatGPT Image 2026年8月2日 19_55_15 (1).png';
const SHADE_REST_PITCH = -0.035;

function colorShift(color: THREE.ColorRepresentation, lightness: number, saturation = 0): number {
  return new THREE.Color(color).offsetHSL(0, saturation, lightness).getHex();
}

/**
 * Procedural reconstruction of the Sakura desk lamp reference.
 *
 * Local frame: +Y up, +Z front. The floor contact plane is Y=0.
 * The shade, diffuser and light socket share `lamp-head-hinge-pivot`, so
 * pitch animation never detaches the emitted light from the visible head.
 */
export function createLampModel(options: ApplianceModelOptions): ApplianceModelBuild {
  const kit = new ApplianceModelKit(options);
  const accent = new THREE.Color(options.accent);
  const accentLight = colorShift(accent, 0.075, -0.06);
  const accentMid = colorShift(accent, 0.045, -0.04);
  const accentDark = colorShift(accent, -0.105, -0.03);

  const accentMaterial = kit.material(accentMid);
  const accentLightMaterial = kit.material(accentLight);
  const accentDarkMaterial = kit.material(accentDark);
  const creamMaterial = kit.material(0xf3ead8, { tint: 0x71667f });
  const creamShadeMaterial = kit.material(0xf8f0df, { tint: 0x766a82 });
  const hingeMaterial = kit.material(0xd78fa9, { tint: 0x675b78 });
  const diffuserMaterial = kit.material(0xffedbd, {
    tint: 0x8a7185,
    emissive: 0xffc96b,
  });
  const litRimMaterial = kit.material(0xfff2d8, {
    tint: 0x887388,
    emissive: 0xffcf82,
  });
  const reflectorMaterial = kit.material(0xffe7ad, {
    tint: 0x9a7785,
    emissive: 0xffc35f,
  });

  // Broad, low base: three independent shells preserve the stepped silhouette.
  const lowerRing = kit.mesh(
    'lamp-base-lower-ring',
    new THREE.CylinderGeometry(0.845, 0.865, 0.105, 28, 1),
    accentDarkMaterial,
  );
  lowerRing.position.y = 0.055;

  const baseBody = kit.mesh(
    'lamp-base-body',
    new THREE.CylinderGeometry(0.795, 0.845, 0.145, 28, 2),
    accentMaterial,
  );
  baseBody.position.y = 0.165;

  const baseTop = kit.mesh(
    'lamp-base-top-plate',
    new THREE.CylinderGeometry(0.705, 0.795, 0.075, 28, 1),
    accentLightMaterial,
  );
  baseTop.position.y = 0.275;

  // Small recessed foot pads are inferred from the reference contact shadow.
  for (const x of [-0.57, 0.57]) {
    const foot = kit.mesh(
      `lamp-base-foot-${x < 0 ? 'left' : 'right'}`,
      new THREE.CylinderGeometry(0.095, 0.11, 0.045, 12),
      accentDarkMaterial,
      kit.root,
      false,
    );
    foot.position.set(x, 0.018, 0);
  }

  const stemFoot = kit.mesh(
    'lamp-stem-foot-collar',
    new THREE.CylinderGeometry(0.135, 0.15, 0.28, 20),
    accentMaterial,
  );
  stemFoot.position.y = 0.43;

  const stem = kit.mesh(
    'lamp-stem',
    new THREE.CylinderGeometry(0.055, 0.062, 2.55, 14),
    creamMaterial,
  );
  stem.position.y = 1.795;

  const stemTopSocket = kit.mesh(
    'lamp-stem-top-socket',
    new THREE.CylinderGeometry(0.095, 0.11, 0.23, 16),
    accentMaterial,
  );
  stemTopSocket.position.set(0, 3.04, -0.12);

  const hingeBridge = kit.mesh(
    'lamp-stem-hinge-bridge',
    new THREE.BoxGeometry(0.13, 0.12, 0.38, 1, 1, 2),
    hingeMaterial,
  );
  hingeBridge.position.set(0, 3.08, -0.30);

  // The stationary rear yoke overlaps the stem socket and carries the hinge axis.
  const yoke = kit.mesh(
    'lamp-hinge-yoke',
    new THREE.CapsuleGeometry(0.075, 0.30, 4, 10),
    hingeMaterial,
  );
  yoke.position.set(0, 3.13, -0.47);

  const headPivot = kit.pivot('lamp-head-hinge-pivot');
  headPivot.position.set(0, 3.22, -0.47);
  headPivot.rotation.x = SHADE_REST_PITCH;
  headPivot.userData.hingeAxis = [1, 0, 0];
  headPivot.userData.pitchRange = [-0.9, 0.16];

  // Axle and circular side caps make the articulation legible from orbit views.
  const axle = kit.mesh(
    'lamp-hinge-axle',
    new THREE.CylinderGeometry(0.06, 0.06, 0.34, 14),
    accentDarkMaterial,
    headPivot,
  );
  axle.rotation.z = Math.PI * 0.5;
  axle.position.set(0, 0, -0.04);

  for (const x of [-0.19, 0.19]) {
    const cap = kit.mesh(
      `lamp-hinge-cap-${x < 0 ? 'left' : 'right'}`,
      new THREE.CylinderGeometry(0.11, 0.11, 0.065, 18),
      accentLightMaterial,
      headPivot,
    );
    cap.rotation.z = Math.PI * 0.5;
    cap.position.set(x, 0, -0.04);
  }

  // Open-ended tapered shell: the wide lower mouth remains visibly separate
  // from its recessed diffuser instead of reading as a capped solid cone.
  const shadeShell = kit.mesh(
    'lamp-shade-shell',
    new THREE.CylinderGeometry(0.32, 0.665, 0.94, 24, 2, true),
    creamShadeMaterial,
    headPivot,
  );
  shadeShell.position.set(0, 0.27, 0.74);

  const shadeTop = kit.mesh(
    'lamp-shade-top-cap',
    new THREE.CylinderGeometry(0.305, 0.32, 0.07, 24),
    creamShadeMaterial,
    headPivot,
  );
  shadeTop.position.set(0, 0.755, 0.74);

  const shadeRim = kit.mesh(
    'lamp-shade-front-rim',
    new THREE.TorusGeometry(0.607, 0.038, 8, 28),
    litRimMaterial,
    headPivot,
  );
  shadeRim.rotation.x = Math.PI * 0.5;
  shadeRim.position.set(0, -0.205, 0.74);

  // A recessed, open reflector gives the emitting mouth real depth in orbit
  // views. It is a tapered volume rather than a bright plane hidden under the
  // diffuser, and remains attached to the same articulated head pivot.
  const reflector = kit.mesh(
    'lamp-inner-reflector',
    new THREE.CylinderGeometry(0.29, 0.545, 0.27, 28, 2, true),
    reflectorMaterial,
    headPivot,
  );
  reflector.position.set(0, -0.075, 0.74);

  const bulb = kit.mesh(
    'lamp-bulb-volume',
    new THREE.SphereGeometry(0.155, 18, 12),
    diffuserMaterial,
    headPivot,
  );
  bulb.scale.set(1, 0.72, 1);
  bulb.position.set(0, -0.12, 0.74);

  const diffuser = kit.mesh(
    'lamp-warm-diffuser',
    new THREE.CylinderGeometry(0.565, 0.565, 0.035, 28),
    diffuserMaterial,
    headPivot,
  );
  diffuser.position.set(0, -0.218, 0.74);

  const topButtonPivot = kit.pivot('lamp-shade-top-button-pivot', headPivot);
  topButtonPivot.position.set(0, 0.845, 0.74);
  kit.mesh(
    'lamp-shade-top-button',
    new THREE.CylinderGeometry(0.135, 0.135, 0.115, 16),
    accentMaterial,
    topButtonPivot,
  );
  const topButtonIndex = kit.mesh(
    'lamp-shade-top-button-index',
    new RoundedBoxGeometry(0.024, 0.012, 0.075, 2, 0.007),
    accentDarkMaterial,
    topButtonPivot,
    false,
  );
  topButtonIndex.position.set(0, 0.062, 0.025);

  const lightSocket = kit.socket('lamp-light-socket', headPivot, [0, -0.285, 0.74]);
  lightSocket.userData.direction = [0, -1, 0];
  lightSocket.userData.apertureRadius = 0.565;
  lightSocket.userData.emitter = 'recessed-reflector-and-bulb';
  kit.indicator([0, 0.255, 0.675], 0.031);

  const result = kit.finish(
    {
      referencePath: options.referencePath ?? REFERENCE_PATH,
      reconstructed: [
        'broad shallow three-layer circular base',
        'slender off-white vertical stem with pink foot collar',
        'rear hinge yoke with circular side caps',
        'stem-to-hinge bridge that keeps the rear articulation physically attached',
        'open tapered bell shade, separate front rim and warm diffuser',
        'recessed open reflector and volumetric bulb behind the diffuser',
        'small pink top button',
        'hinge pivot and child light socket',
      ],
      inferred: [
        'diffuser mounting and lamp interior depth are inferred because the reference does not expose the shade interior',
        'base underside feet are inferred from the contact shadow',
        'hinge axle construction is inferred from the visible circular side cap',
      ],
    },
  );

  result.root.userData.referenceDimensions = {
    totalHeight: 4.12,
    baseDiameter: 1.73,
    baseHeight: 0.315,
    stemDiameter: 0.12,
    shadeHeight: 0.94,
    shadeMouthDiameter: 1.33,
  };
  return result;
}

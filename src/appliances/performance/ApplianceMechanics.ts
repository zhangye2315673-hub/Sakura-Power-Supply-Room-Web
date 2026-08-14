import * as THREE from 'three';
import type { PoweredAnimationDriver } from '../poweredAnimation';
import type { ApplianceKind } from '../../systems/ApplianceCatalog';
import { sampleLampHeadPose } from './LampPerformance';
import { applyBlenderPerformance } from './BlenderPerformance';
import { applyHairDryerPerformance, resetHairDryerPerformance } from './HairDryerPerformance';
import { applyRefrigeratorPerformance } from './RefrigeratorPerformance';
import { applyGameControllerPerformance, resetGameControllerPerformance } from './GameControllerPerformance';
import {
  applyDehumidifierPerformance,
  resetDehumidifierPerformance,
} from './DehumidifierPerformance';
import { createDesktopComputerPerformance } from './DesktopComputerPerformance';
import {
  applyStandMixerPerformance,
  resetStandMixerPerformance,
} from './StandMixerPerformance';
import { createGumballMachinePerformance } from './GumballMachinePerformance';
import {
  applyPortableSpeakerPerformance,
  resetPortableSpeakerPerformance,
} from './PortableSpeakerPerformance';
import {
  applyMicrowavePerformance,
  resetMicrowavePerformance,
} from './MicrowavePerformance';
import { createFanPerformance } from './FanPerformance';
import {
  applyTelevisionPerformance,
  resetTelevisionPerformance,
} from './TelevisionPerformance';
import {
  applyHumidifierPerformance,
  resetHumidifierPerformance,
} from './HumidifierPerformance';
import {
  applyCoffeeMakerPerformance,
  resetCoffeeMakerPerformance,
} from './CoffeeMakerPerformance';
import { createWasherPerformance } from './WasherPerformance';
import { createKettlePerformance } from './KettlePerformance';
import { createRiceCookerPerformance } from './RiceCookerPerformance';
import { applyPhonePerformance, resetPhonePerformance } from './PhonePerformance';
import { createRobotVacuumPerformance } from './RobotVacuumPerformance';
import { createPopcornMachinePerformance } from './PopcornMachinePerformance';
import { createBubbleMachinePerformance } from './BubbleMachinePerformance';
import { createSmartBinPerformance } from './SmartBinPerformance';
import { createAlarmClockPerformance } from './AlarmClockPerformance';
import { createPrinterPerformance } from './PrinterPerformance';
import { createRecordPlayerPerformance } from './RecordPlayerPerformance';
import { createInductionCooktopPerformance } from './InductionCooktopPerformance';

type ObjectBaseline = {
  object: THREE.Object3D;
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  scale: THREE.Vector3;
  visible: boolean;
};

type MaterialBaseline = {
  material: THREE.Material;
  color?: THREE.Color;
  emissive?: THREE.Color;
  emissiveIntensity?: number;
  opacity: number;
  transparent: boolean;
};

function smoothPulse(time: number, start: number, peak: number, end: number): number {
  return THREE.MathUtils.smoothstep(time, start, peak)
    * (1 - THREE.MathUtils.smoothstep(time, peak, end));
}

function captureObjects(root: THREE.Object3D): ObjectBaseline[] {
  const result: ObjectBaseline[] = [];
  root.traverse((object) => result.push({
    object,
    position: object.position.clone(),
    quaternion: object.quaternion.clone(),
    scale: object.scale.clone(),
    visible: object.visible,
  }));
  return result;
}

function captureMaterials(root: THREE.Object3D): MaterialBaseline[] {
  const seen = new Set<THREE.Material>();
  const result: MaterialBaseline[] = [];
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const entries = Array.isArray(object.material) ? object.material : [object.material];
    entries.forEach((material) => {
      if (seen.has(material)) return;
      seen.add(material);
      const toon = material as THREE.MeshToonMaterial;
      result.push({
        material,
        color: toon.color?.clone(),
        emissive: toon.emissive?.clone(),
        emissiveIntensity: toon.emissiveIntensity,
        opacity: material.opacity,
        transparent: material.transparent,
      });
    });
  });
  return result;
}

function restore(objects: readonly ObjectBaseline[], materials: readonly MaterialBaseline[]): void {
  objects.forEach((state) => {
    state.object.position.copy(state.position);
    state.object.quaternion.copy(state.quaternion);
    state.object.scale.copy(state.scale);
    state.object.visible = state.visible;
  });
  materials.forEach((state) => {
    const toon = state.material as THREE.MeshToonMaterial;
    if (state.color && toon.color) toon.color.copy(state.color);
    if (state.emissive && toon.emissive) toon.emissive.copy(state.emissive);
    if (state.emissiveIntensity !== undefined) toon.emissiveIntensity = state.emissiveIntensity;
    state.material.opacity = state.opacity;
    state.material.transparent = state.transparent;
  });
}

/**
 * The single mechanical definition used by both live-game performance sessions
 * and gallery previews. Model factories only provide the named rig this module targets.
 */
export function createApplianceMechanicalAnimation(
  kind: ApplianceKind,
  root: THREE.Group,
): PoweredAnimationDriver {
  const objects = captureObjects(root);
  const materials = captureMaterials(root);
  let signalValue = 0;
  const desktopComputerPerformance = kind === 'desktop-computer'
    ? createDesktopComputerPerformance(root)
    : null;
  const gumballMachinePerformance = kind === 'gumball-machine'
    ? createGumballMachinePerformance(root)
    : null;
  const fanPerformance = kind === 'fan'
    ? createFanPerformance(root)
    : null;
  const washerPerformance = kind === 'washer'
    ? createWasherPerformance(root)
    : null;
  const kettlePerformance = kind === 'kettle'
    ? createKettlePerformance(root)
    : null;
  const riceCookerPerformance = kind === 'rice-cooker'
    ? createRiceCookerPerformance(root)
    : null;
  const robotVacuumPerformance = kind === 'robot-vacuum'
    ? createRobotVacuumPerformance(root)
    : null;
  const popcornMachinePerformance = kind === 'popcorn-machine'
    ? createPopcornMachinePerformance(root)
    : null;
  const bubbleMachinePerformance = kind === 'bubble-machine'
    ? createBubbleMachinePerformance(root)
    : null;
  const smartBinPerformance = kind === 'smart-bin'
    ? createSmartBinPerformance(root)
    : null;
  const alarmClockPerformance = kind === 'alarm-clock'
    ? createAlarmClockPerformance(root)
    : null;
  const printerPerformance = kind === 'printer'
    ? createPrinterPerformance(root)
    : null;
  const recordPlayerPerformance = kind === 'record-player'
    ? createRecordPlayerPerformance(root)
    : null;
  const inductionCooktopPerformance = kind === 'induction-cooktop'
    ? createInductionCooktopPerformance(root)
    : null;
  const node = <T extends THREE.Object3D = THREE.Object3D>(name: string): T | null => (
    root.getObjectByName(name) as T | undefined
  ) ?? null;
  const rotate = (name: string, axis: 'x' | 'y' | 'z', value: number): void => {
    const target = node(name);
    if (target) target.rotation[axis] = value;
  };
  const indicator = (): THREE.Mesh<THREE.BufferGeometry, THREE.MeshToonMaterial> | null => (
    node('status-indicator') as THREE.Mesh<THREE.BufferGeometry, THREE.MeshToonMaterial> | null
  );
  const lightIndicator = (strength: number, color = 0xff7185): void => {
    const mesh = indicator();
    if (!mesh) return;
    mesh.material.color.setHex(strength > 0.02 ? 0xffd9e5 : 0x81798f);
    mesh.material.emissive.setHex(strength > 0.02 ? color : 0x000000);
    mesh.material.emissiveIntensity = strength * 1.8;
  };
  const glow = (name: string, strength: number, color: number): void => {
    const mesh = node<THREE.Mesh>(name);
    if (!mesh) return;
    const entries = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    entries.forEach((material) => {
      const toon = material as THREE.MeshToonMaterial;
      if (toon.emissive) toon.emissive.setHex(color);
      if (typeof toon.emissiveIntensity === 'number') toon.emissiveIntensity = strength;
      if (material.transparent) material.opacity = Math.max(material.opacity, strength * 0.82);
    });
  };

  root.userData.performanceDefinition = kind;
  return {
    update: (time, power) => {
      restore(objects, materials);
      const p = THREE.MathUtils.clamp(power, 0, 1);
      const startup = THREE.MathUtils.smoothstep(time, 0.02, 0.42);
      const run = startup * p;
      const climax = smoothPulse(time, 3.68, 4.18, 4.82) * p;
      signalValue = run;
      lightIndicator(run, kind === 'humidifier' ? 0x62d8d2 : 0xff6070);

      switch (kind) {
        case 'lamp': {
          const head = node('lamp-head-hinge-pivot');
          if (head) {
            const pose = sampleLampHeadPose(time);
            // `restore()` has already reinstated the model-authored hinge pitch.
            // Add the sampled offset instead of replacing it, otherwise the first
            // powered frame visibly resets the head before the character motion.
            head.rotation.x += pose.pitch * run;
            head.rotation.z += pose.roll * run;
            head.userData.performancePhase = pose.phase;
            head.userData.performanceSegmentProgress = pose.segmentProgress;
          }
          rotate('lamp-shade-top-button-pivot', 'y', -Math.PI * 0.7 * startup * p);
          glow('lamp-warm-diffuser', run * 1.65, 0xffca6d);
          glow('lamp-shade-front-rim', run * 0.85, 0xffd88c);
          break;
        }
        case 'fan':
          fanPerformance?.apply(time, p);
          signalValue = fanPerformance?.signal() ?? run;
          break;
        case 'radio': {
          const antenna = node('radio-antenna-hinge-pivot');
          const aerialRise = THREE.MathUtils.smoothstep(time, 0.06, 0.5);
          const aerialOvershoot = smoothPulse(time, 0.38, 0.59, 0.86) * p;
          // Keep the hinge upright while the nested sections collapse from
          // the tip inward. Folding starts only after every section is stored.
          const hingeReturn = THREE.MathUtils.smoothstep(time, 5.02, 5.18);
          const upright = aerialRise * (1 - hingeReturn);
          const swayGate = THREE.MathUtils.smoothstep(time, 0.7, 0.98)
            * (1 - THREE.MathUtils.smoothstep(time, 4.22, 4.34)) * p;
          const sway = (
            Math.sin((time - 0.7) * 3.15)
            + Math.sin((time - 0.7) * 7.4 + 0.45) * 0.33
          ) * 0.055 * swayGate;
          if (antenna) {
            antenna.rotation.z = THREE.MathUtils.lerp(1.12, 0.035, upright)
              - aerialOvershoot * 0.145
              + sway;
          }
          const segmentExtensions = [
            THREE.MathUtils.smoothstep(time, 0.5, 0.95)
              * (1 - THREE.MathUtils.smoothstep(time, 4.84, 5)),
            THREE.MathUtils.smoothstep(time, 0.78, 1.25)
              * (1 - THREE.MathUtils.smoothstep(time, 4.68, 4.84)),
            THREE.MathUtils.smoothstep(time, 1.08, 1.58)
              * (1 - THREE.MathUtils.smoothstep(time, 4.52, 4.68)),
            THREE.MathUtils.smoothstep(time, 1.4, 2)
              * (1 - THREE.MathUtils.smoothstep(time, 4.34, 4.52)),
          ];
          [
            'radio-antenna-extension-pivot-2',
            'radio-antenna-extension-pivot-3',
          ].forEach((name, index) => {
            const segment = node(name);
            if (!segment) return;
            const restY = Number(segment.userData.restY ?? segment.position.y);
            const extendedY = Number(segment.userData.extendedY ?? restY);
            segment.position.y = THREE.MathUtils.lerp(restY, extendedY, segmentExtensions[index + 1]);
          });
          const firstSegment = node('radio-antenna-extension-pivot-1');
          if (firstSegment) {
            const restY = Number(firstSegment.userData.restY ?? firstSegment.position.y);
            const extendedY = Number(firstSegment.userData.extendedY ?? restY);
            firstSegment.position.y = THREE.MathUtils.lerp(restY, extendedY, segmentExtensions[0]);
          }
          const antennaTipPivot = node('radio-antenna-tip-extension-pivot');
          const trackedSections = [
            { object: firstSegment, length: 1.35 },
            { object: node('radio-antenna-extension-pivot-2'), length: 1.2 },
            { object: node('radio-antenna-extension-pivot-3'), length: 1.05 },
          ];
          const highestSectionTop = Math.max(...trackedSections.map(({ object, length }) => (
            object ? object.position.y + length : Number.NEGATIVE_INFINITY
          )));
          if (antennaTipPivot && Number.isFinite(highestSectionTop)) {
            antennaTipPivot.position.y = highestSectionTop;
          }
          const pointer = node('radio-frequency-pointer-pivot');
          if (pointer) pointer.position.x += Math.sin(time * 17) * 0.27 * Math.min(1, time / 1.6) * run;
          const speaker = node('radio-speaker-diaphragm-pivot');
          if (speaker) {
            const beat = Math.max(0, Math.sin(time * 13)) ** 5 * run;
            speaker.scale.set(1 + beat * 0.2, 1 + beat * 0.2, 1 + beat * 0.32);
          }
          const body = node('radio-body-pivot') ?? root;
          body.scale.x *= 1 + Math.sin(time * 13) * 0.035 * run;
          const retractionPhase = time < 4.34
            ? 'none'
            : time < 4.52
              ? 'tip'
              : time < 4.68
                ? 'segment-3'
                : time < 4.84
                  ? 'segment-2'
                  : time < 5.02
                    ? 'segment-1'
                    : 'hinge-return';
          const antennaTipCap = node('radio-antenna-tip-cap');
          if (antennaTipCap) antennaTipCap.visible = true;
          root.userData.radioPerformanceDiagnostics = {
            timeline: time,
            hingeAngle: antenna?.rotation.z ?? null,
            extension: segmentExtensions[3],
            rise: aerialRise,
            overshoot: aerialOvershoot,
            sway,
            segmentExtensions,
            retractionPhase,
            tipCapVisible: antennaTipCap?.visible ?? false,
            tipTracksHighestSection: antennaTipPivot?.userData.tracksHighestAntennaSection === true,
            tipTopError: antennaTipPivot && Number.isFinite(highestSectionTop)
              ? Math.abs(antennaTipPivot.position.y - highestSectionTop)
              : null,
            nearVertical: Math.abs(antenna?.rotation.z ?? 99) < 0.16,
          };
          break;
        }
        case 'television':
          applyTelevisionPerformance(root, time, p);
          break;
        case 'humidifier':
          applyHumidifierPerformance(root, time, p);
          break;
        case 'toaster': {
          // One causal latch sequence shared by the live scene and gallery:
          // press the square lever down, hold it above the browning dial, then
          // release it at the exact instant the external toast prop launches.
          const press = THREE.MathUtils.smoothstep(time, 0.15, 0.55);
          const release = THREE.MathUtils.smoothstep(time, 3.72, 3.86);
          const latched = press * (1 - release) * p;
          const carriage = node('toaster-toast-carriage');
          if (carriage) carriage.position.y -= latched * 0.32;
          const lever = node('toaster-lever-pivot');
          if (lever) lever.position.y -= latched * 0.37;
          rotate('toaster-browning-knob-pivot', 'z', -Math.PI * 0.72 * startup * p);
          break;
        }
        case 'refrigerator': {
          applyRefrigeratorPerformance(root, time, p);
          break;
        }
        case 'washer':
          washerPerformance?.update(time, p);
          signalValue = washerPerformance?.signal() ?? run;
          break;
        case 'microwave': {
          applyMicrowavePerformance(root, time, p);
          break;
        }
        case 'coffee-maker':
          applyCoffeeMakerPerformance(root, time, p);
          break;
        case 'kettle':
          kettlePerformance?.apply(time, p);
          signalValue = kettlePerformance?.signal() ?? 0;
          break;
        case 'rice-cooker':
          riceCookerPerformance?.update(time, p);
          signalValue = riceCookerPerformance?.signal() ?? 0;
          break;
        case 'phone':
          applyPhonePerformance(root, time, p);
          break;
        case 'robot-vacuum':
          robotVacuumPerformance?.apply(time, p);
          signalValue = robotVacuumPerformance?.signal() ?? run;
          break;
        case 'bubble-machine':
          bubbleMachinePerformance?.apply(time, p);
          signalValue = bubbleMachinePerformance?.signal() ?? run;
          break;
        case 'gumball-machine':
          gumballMachinePerformance?.apply(time, p);
          break;
        case 'popcorn-machine':
          popcornMachinePerformance?.apply(time, p);
          signalValue = popcornMachinePerformance?.signal() ?? run;
          break;
        case 'alarm-clock':
          alarmClockPerformance?.apply(time, p);
          signalValue = alarmClockPerformance?.signal() ?? run;
          break;
        case 'smart-bin':
          smartBinPerformance?.apply(time, p);
          signalValue = smartBinPerformance?.signal() ?? run;
          break;
        case 'record-player':
          recordPlayerPerformance?.apply(time, p);
          signalValue = recordPlayerPerformance?.signal() ?? run;
          break;
        case 'stand-mixer': {
          applyStandMixerPerformance(root, time, p);
          break;
        }
        case 'printer':
          printerPerformance?.apply(time, p);
          signalValue = printerPerformance?.signal() ?? run;
          break;
        case 'induction-cooktop':
          inductionCooktopPerformance?.apply(time, p);
          signalValue = inductionCooktopPerformance?.signal() ?? run;
          break;
        case 'blender':
          applyBlenderPerformance(root, time, p);
          break;
        case 'dehumidifier': {
          applyDehumidifierPerformance(root, time, p);
          break;
        }
        case 'portable-speaker': {
          applyPortableSpeakerPerformance(root, time, p);
          break;
        }
        case 'hair-dryer':
          rotate('hair-dryer-fan-rotor-pivot', 'x', time * 20 * run);
          rotate('hair-dryer-power-slider-pivot', 'y', -0.28 * startup * p);
          {
            const body = node('hair-dryer-body-pivot');
            if (body) body.position.x += 0.14 * run + climax * 0.12;
            applyHairDryerPerformance(root, time, p);
          }
          break;
        case 'desktop-computer':
          desktopComputerPerformance?.apply(time, p);
          break;
        case 'game-controller': {
          applyGameControllerPerformance(root, time, p);
          break;
        }
      }
    },
    stop: () => {
      restore(objects, materials);
      signalValue = 0;
      if (kind === 'radio') delete root.userData.radioPerformanceDiagnostics;
      if (kind === 'hair-dryer') resetHairDryerPerformance(root);
      if (kind === 'refrigerator') delete root.userData.refrigeratorPerformanceDiagnostics;
      if (kind === 'game-controller') resetGameControllerPerformance(root);
      if (kind === 'dehumidifier') resetDehumidifierPerformance(root);
      if (kind === 'desktop-computer') desktopComputerPerformance?.reset();
      if (kind === 'stand-mixer') resetStandMixerPerformance(root);
      if (kind === 'gumball-machine') gumballMachinePerformance?.reset();
      if (kind === 'portable-speaker') resetPortableSpeakerPerformance(root);
      if (kind === 'microwave') resetMicrowavePerformance(root);
      if (kind === 'fan') fanPerformance?.reset();
      if (kind === 'television') resetTelevisionPerformance(root);
      if (kind === 'humidifier') resetHumidifierPerformance(root);
      if (kind === 'coffee-maker') resetCoffeeMakerPerformance(root);
      if (kind === 'washer') washerPerformance?.stop();
      if (kind === 'kettle') kettlePerformance?.reset();
      if (kind === 'rice-cooker') riceCookerPerformance?.stop();
      if (kind === 'phone') resetPhonePerformance(root);
      if (kind === 'robot-vacuum') robotVacuumPerformance?.reset();
      if (kind === 'popcorn-machine') popcornMachinePerformance?.reset();
      if (kind === 'bubble-machine') bubbleMachinePerformance?.reset();
      if (kind === 'smart-bin') smartBinPerformance?.reset();
      if (kind === 'alarm-clock') alarmClockPerformance?.reset();
      if (kind === 'printer') printerPerformance?.reset();
      if (kind === 'record-player') recordPlayerPerformance?.reset();
      if (kind === 'induction-cooktop') inductionCooktopPerformance?.reset();
      const mesh = indicator();
      if (mesh) {
        mesh.material.color.setHex(0x81798f);
        mesh.material.emissive.setHex(0x000000);
        mesh.material.emissiveIntensity = 0;
      }
    },
    signal: () => signalValue,
  };
}

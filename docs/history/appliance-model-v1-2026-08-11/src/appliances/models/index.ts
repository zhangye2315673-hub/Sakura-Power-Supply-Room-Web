import type { ApplianceModelBuild, ApplianceModelOptions } from '../ApplianceModelKit';
import type { ApplianceKind } from '../../systems/ApplianceCatalog';
import { createCoffeeMakerModel } from './coffeeMaker';
import { createFanModel } from './fan';
import { createHumidifierModel } from './humidifier';
import { createKettleModel } from './kettle';
import { createLampModel } from './lamp';
import { createMicrowaveModel } from './microwave';
import { createPhoneModel } from './phone';
import { createRadioModel } from './radio';
import { createRefrigeratorModel } from './refrigerator';
import { createRiceCookerModel } from './riceCooker';
import { createRobotVacuumModel } from './robotVacuum';
import { createTelevisionModel } from './television';
import { createToasterModel } from './toaster';
import { createWasherModel } from './washer';
import { createBubbleMachineModel } from './bubbleMachine';
import { createGumballMachineModel } from './gumballMachine';
import { createPopcornMachineModel } from './popcornMachine';
import { createAlarmClockModel } from './alarmClock';
import { createSmartBinModel } from './smartBin';
import { createRecordPlayerModel } from './recordPlayer';
import { createStandMixerModel } from './standMixer';
import { createPrinterModel } from './printer';
import { createInductionCooktopModel } from './inductionCooktop';
import { createBlenderModel } from './blender';
import { createDehumidifierModel } from './dehumidifier';
import { createPortableSpeakerModel } from './portableSpeaker';
import { createHairDryerModel } from './hairDryer';
import { createDesktopComputerModel } from './desktopComputer';
import { createGameControllerModel } from './gameController';

function assertNever(value: never): never {
  throw new Error(`Missing appliance model for ${String(value)}`);
}

export function createApplianceModel(
  kind: ApplianceKind,
  options: ApplianceModelOptions,
): ApplianceModelBuild {
  switch (kind) {
    case 'coffee-maker': return createCoffeeMakerModel(options);
    case 'lamp': return createLampModel(options);
    case 'fan': return createFanModel(options);
    case 'radio': return createRadioModel(options);
    case 'television': return createTelevisionModel(options);
    case 'humidifier': return createHumidifierModel(options);
    case 'refrigerator': return createRefrigeratorModel(options);
    case 'toaster': return createToasterModel(options);
    case 'microwave': return createMicrowaveModel(options);
    case 'washer': return createWasherModel(options);
    case 'kettle': return createKettleModel(options);
    case 'rice-cooker': return createRiceCookerModel(options);
    case 'robot-vacuum': return createRobotVacuumModel(options);
    case 'phone': return createPhoneModel(options);
    case 'bubble-machine': return createBubbleMachineModel(options);
    case 'gumball-machine': return createGumballMachineModel(options);
    case 'popcorn-machine': return createPopcornMachineModel(options);
    case 'alarm-clock': return createAlarmClockModel(options);
    case 'smart-bin': return createSmartBinModel(options);
    case 'record-player': return createRecordPlayerModel(options);
    case 'stand-mixer': return createStandMixerModel(options);
    case 'printer': return createPrinterModel(options);
    case 'induction-cooktop': return createInductionCooktopModel(options);
    case 'blender': return createBlenderModel(options);
    case 'dehumidifier': return createDehumidifierModel(options);
    case 'portable-speaker': return createPortableSpeakerModel(options);
    case 'hair-dryer': return createHairDryerModel(options);
    case 'desktop-computer': return createDesktopComputerModel(options);
    case 'game-controller': return createGameControllerModel(options);
    default: return assertNever(kind);
  }
}

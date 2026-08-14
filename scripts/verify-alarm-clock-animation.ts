import { createAlarmClockModel } from '../src/appliances/models/alarmClock';

const build = createAlarmClockModel({ id: 'alarm-clock', accent: 0xe58da8, referencePath: null });
const nodes = build.root.userData.sculptRuntime.nodes as Record<string, { rotation: { z: number; x: number } }>;
build.animation.stop();
build.animation.update(1.8, 1);
const powered = {
  hourZ: nodes['alarm-clock-hour-hand-pivot'].rotation.z,
  minuteZ: nodes['alarm-clock-minute-hand-pivot'].rotation.z,
  leftBellZ: nodes['alarm-clock-bell-1-pivot'].rotation.z,
  rightBellZ: nodes['alarm-clock-bell-2-pivot'].rotation.z,
  leftHammerZ: nodes['alarm-clock-bell-hammer-1-pivot'].rotation.z,
  rightHammerZ: nodes['alarm-clock-bell-hammer-2-pivot'].rotation.z,
  signal: build.animation.signal(),
};
build.animation.stop();
const stopped = {
  hourZ: nodes['alarm-clock-hour-hand-pivot'].rotation.z,
  minuteZ: nodes['alarm-clock-minute-hand-pivot'].rotation.z,
  leftBellZ: nodes['alarm-clock-bell-1-pivot'].rotation.z,
  rightBellZ: nodes['alarm-clock-bell-2-pivot'].rotation.z,
  leftHammerZ: nodes['alarm-clock-bell-hammer-1-pivot'].rotation.z,
  rightHammerZ: nodes['alarm-clock-bell-hammer-2-pivot'].rotation.z,
  signal: build.animation.signal(),
};
const exactReset = Math.abs(stopped.hourZ) < 1e-9
  && Math.abs(stopped.minuteZ) < 1e-9
  && Math.abs(stopped.leftBellZ - 0.52) < 1e-9
  && Math.abs(stopped.rightBellZ + 0.52) < 1e-9
  && Math.abs(stopped.leftHammerZ) < 1e-9
  && Math.abs(stopped.rightHammerZ) < 1e-9
  && stopped.signal === 0;
console.log(JSON.stringify({ powered, stopped, independentHandSpeeds: Math.abs(powered.minuteZ) > Math.abs(powered.hourZ) * 4, bellsAngled: Math.abs(powered.leftBellZ) > 0.35 && Math.abs(powered.rightBellZ) > 0.35, exactReset }, null, 2));

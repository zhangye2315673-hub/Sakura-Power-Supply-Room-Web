export type PrinterPaperProfile = Readonly<{
  id: string;
  launchTime: number;
  flightDuration: number;
  feedEnd: number;
  glideEnd: number;
  feedForwardDistance: number;
  feedLaunchBias: number;
  loopVerticalRadius: number;
  loopDepthRadius: number;
  loopForwardDrift: number;
  loopTopSlowdown: number;
  loopLateralOffset: number;
  loopLateralSwing: number;
  fallLateralTarget: number;
  fallLateralSway: number;
  fallDepthDirection: -1 | 1;
  leafDepthAmplitude: number;
  fallDropDistance: number;
  fallFirstStop: number;
  fallSecondStop: number;
  fallFirstStopDrop: number;
  fallSecondStopDrop: number;
  leafVelocityPitch: number;
  leafReactionPitch: number;
  fallRoll: number;
}>;

/**
 * Five authored pseudo-random paper personalities. Keeping the values fixed
 * makes review and reset deterministic, while the unequal launches, loop
 * sizes, lanes, landing points and durations avoid a duplicated stream.
 */
export const PRINTER_PAPER_PROFILES = Object.freeze([
  {
    id: 'center-medium',
    launchTime: 0.12,
    flightDuration: 6.3,
    feedEnd: 0.09,
    glideEnd: 0.38,
    feedForwardDistance: 2,
    feedLaunchBias: 0.36,
    loopVerticalRadius: 0.96,
    loopDepthRadius: 0.52,
    loopForwardDrift: 1.05,
    loopTopSlowdown: 0.18,
    loopLateralOffset: 0,
    loopLateralSwing: 0,
    fallLateralTarget: 0,
    fallLateralSway: 0,
    fallDepthDirection: 1,
    leafDepthAmplitude: 1.27,
    fallDropDistance: 7.85,
    fallFirstStop: 0.2,
    fallSecondStop: 0.6,
    fallFirstStopDrop: 0.06,
    fallSecondStopDrop: 0.34,
    leafVelocityPitch: 0.46,
    leafReactionPitch: 0.28,
    fallRoll: 0,
  },
  {
    id: 'left-wide-fast',
    launchTime: 0.84,
    flightDuration: 5.2,
    feedEnd: 0.105,
    glideEnd: 0.39,
    feedForwardDistance: 2.7,
    feedLaunchBias: 0.43,
    loopVerticalRadius: 1.25,
    loopDepthRadius: 0.75,
    loopForwardDrift: 0.88,
    loopTopSlowdown: 0.14,
    loopLateralOffset: -0.55,
    loopLateralSwing: -0.35,
    fallLateralTarget: -1.45,
    fallLateralSway: 0.25,
    fallDepthDirection: -1,
    leafDepthAmplitude: 1.55,
    fallDropDistance: 8,
    fallFirstStop: 0.18,
    fallSecondStop: 0.55,
    fallFirstStopDrop: 0.08,
    fallSecondStopDrop: 0.38,
    leafVelocityPitch: 0.52,
    leafReactionPitch: 0.3,
    fallRoll: 0.18,
  },
  {
    id: 'right-tight-slow',
    launchTime: 1.68,
    flightDuration: 7,
    feedEnd: 0.08,
    glideEnd: 0.36,
    feedForwardDistance: 1.75,
    feedLaunchBias: 0.31,
    loopVerticalRadius: 0.72,
    loopDepthRadius: 0.36,
    loopForwardDrift: 1.42,
    loopTopSlowdown: 0.22,
    loopLateralOffset: 0.46,
    loopLateralSwing: 0.22,
    fallLateralTarget: 1.18,
    fallLateralSway: -0.18,
    fallDepthDirection: 1,
    leafDepthAmplitude: 1.02,
    fallDropDistance: 7.9,
    fallFirstStop: 0.24,
    fallSecondStop: 0.64,
    fallFirstStopDrop: 0.045,
    fallSecondStopDrop: 0.28,
    leafVelocityPitch: 0.4,
    leafReactionPitch: 0.24,
    fallRoll: -0.13,
  },
  {
    id: 'right-high-fast',
    launchTime: 2.61,
    flightDuration: 5.55,
    feedEnd: 0.115,
    glideEnd: 0.42,
    feedForwardDistance: 2.9,
    feedLaunchBias: 0.48,
    loopVerticalRadius: 1.4,
    loopDepthRadius: 0.88,
    loopForwardDrift: 1.18,
    loopTopSlowdown: 0.12,
    loopLateralOffset: 0.22,
    loopLateralSwing: 0.46,
    fallLateralTarget: 1.6,
    fallLateralSway: 0.32,
    fallDepthDirection: -1,
    leafDepthAmplitude: 1.72,
    fallDropDistance: 8.15,
    fallFirstStop: 0.17,
    fallSecondStop: 0.53,
    fallFirstStopDrop: 0.1,
    fallSecondStopDrop: 0.42,
    leafVelocityPitch: 0.56,
    leafReactionPitch: 0.32,
    fallRoll: 0.21,
  },
  {
    id: 'left-drifter-slow',
    launchTime: 3.37,
    flightDuration: 6.55,
    feedEnd: 0.095,
    glideEnd: 0.4,
    feedForwardDistance: 2.25,
    feedLaunchBias: 0.38,
    loopVerticalRadius: 1.08,
    loopDepthRadius: 0.58,
    loopForwardDrift: 0.72,
    loopTopSlowdown: 0.2,
    loopLateralOffset: -0.35,
    loopLateralSwing: 0.28,
    fallLateralTarget: -0.9,
    fallLateralSway: -0.42,
    fallDepthDirection: 1,
    leafDepthAmplitude: 1.35,
    fallDropDistance: 7.95,
    fallFirstStop: 0.22,
    fallSecondStop: 0.62,
    fallFirstStopDrop: 0.07,
    fallSecondStopDrop: 0.32,
    leafVelocityPitch: 0.48,
    leafReactionPitch: 0.27,
    fallRoll: -0.2,
  },
] satisfies readonly PrinterPaperProfile[]);

const latestPaperExit = Math.max(
  ...PRINTER_PAPER_PROFILES.map((profile) => profile.launchTime + profile.flightDuration),
);

export const PRINTER_PAPER_STOP_END = Number((latestPaperExit + 0.5).toFixed(2));

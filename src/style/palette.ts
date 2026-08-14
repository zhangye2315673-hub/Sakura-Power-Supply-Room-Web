/**
 * A focused subset of Sakura Crossing's palette.
 * The new game stays visually compatible without depending on the parent app.
 */
export const PAL = {
  skyTop: 0x8fbdea,
  skyMid: 0xd4e8fa,
  // The post grade adds warmth, so the source stays cool enough to land on
  // Sakura's warm paper white instead of drifting into peach or cream.
  skyHaze: 0xf6f8fb,
  cloud: 0xfdfaf8,
  cloudShade: 0xe6e6f2,
  fog: 0xe6ecf7,
  hill: 0xc6cfe6,
  hillFar: 0xd8dded,

  sun: 0xfff1d8,
  fill: 0xa9bdf5,
  hemiSky: 0xdcecff,
  hemiGround: 0xb6a6c6,

  ink: 0x39324f,
  inkSoft: 0x4a4468,
  paper: 0xfbf5ea,
  platform: 0xf4edf0,
  platformShade: 0xd4cfdd,

  red: 0xe05f61,
  redDeep: 0xb5322f,
  yellow: 0xf4c033,
  teal: 0x2f9c9a,
  blue: 0x4b79c9,
  orange: 0xef8a3c,
  purple: 0x8f6fb5,
  green: 0x65a57f,

  blossom: 0xfbc6d8,
  blossomLight: 0xfff0f4,
  blossomWarm: 0xfedde2,
  blossomDeep: 0xf0a3c0,
  petal: 0xfcd9e4,
  petalDeep: 0xf6bccf,
} as const;

export const ARROW_COLORS = [
  PAL.red,
  PAL.yellow,
  PAL.teal,
  PAL.blue,
  PAL.orange,
  PAL.purple,
  PAL.green,
  PAL.blossomDeep,
] as const;

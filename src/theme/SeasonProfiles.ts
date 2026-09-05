import * as THREE from 'three';
import { PAL } from '../style/palette';

export const SEASON_MODES = ['spring', 'summer', 'autumn', 'winter'] as const;
export type SeasonMode = typeof SEASON_MODES[number];

export type SeasonEnvironmentState = {
  skyTop: THREE.Color;
  skyMid: THREE.Color;
  skyHaze: THREE.Color;
  cloud: THREE.Color;
  cloudShade: THREE.Color;
  cloudOpacity: number;
  cloudShadeOpacity: number;
  fog: THREE.Color;
  fogNearScale: number;
  fogFarScale: number;
  sun: THREE.Color;
  sunIntensity: number;
  fill: THREE.Color;
  fillIntensity: number;
  bounce: THREE.Color;
  bounceIntensity: number;
  hemiSky: THREE.Color;
  hemiGround: THREE.Color;
  hemiIntensity: number;
  pageBackground: THREE.Color;
  startWash: THREE.Color;
};

export type SeasonProfile = {
  mode: SeasonMode;
  label: string;
  day: SeasonEnvironmentState;
  night: SeasonEnvironmentState;
  cloudScale: number;
  cloudVerticalScale: number;
  cloudSpeed: number;
  starVisibility: number;
};

function state(values: {
  sky: [number, number, number];
  clouds: [number, number, number, number];
  fog: [number, number, number];
  sun: [number, number];
  fill: [number, number];
  bounce: [number, number];
  hemi: [number, number, number];
  page: number;
  startWash: number;
}): SeasonEnvironmentState {
  return {
    skyTop: new THREE.Color(values.sky[0]),
    skyMid: new THREE.Color(values.sky[1]),
    skyHaze: new THREE.Color(values.sky[2]),
    cloud: new THREE.Color(values.clouds[0]),
    cloudShade: new THREE.Color(values.clouds[1]),
    cloudOpacity: values.clouds[2],
    cloudShadeOpacity: values.clouds[3],
    fog: new THREE.Color(values.fog[0]),
    fogNearScale: values.fog[1],
    fogFarScale: values.fog[2],
    sun: new THREE.Color(values.sun[0]),
    sunIntensity: values.sun[1],
    fill: new THREE.Color(values.fill[0]),
    fillIntensity: values.fill[1],
    bounce: new THREE.Color(values.bounce[0]),
    bounceIntensity: values.bounce[1],
    hemiSky: new THREE.Color(values.hemi[0]),
    hemiGround: new THREE.Color(values.hemi[1]),
    hemiIntensity: values.hemi[2],
    pageBackground: new THREE.Color(values.page),
    startWash: new THREE.Color(values.startWash),
  };
}

// Spring directly mirrors the pre-season day/night constants. It is the visual
// compatibility anchor: routing through the seasonal pipeline must not recolor it.
export const SEASON_PROFILES: Record<SeasonMode, SeasonProfile> = {
  spring: {
    mode: 'spring',
    label: '春',
    day: state({
      sky: [PAL.skyTop, PAL.skyMid, PAL.skyHaze],
      clouds: [PAL.cloud, PAL.cloudShade, 0.48, 0.25],
      fog: [0xd4e8fa, 1, 1],
      sun: [0xfff1d2, 2.25], fill: [0xaab4ec, 1.08], bounce: [0xd8cbe8, 0.34],
      hemi: [0xd4e8fa, 0x9d89aa, 1.12], page: 0xd4e8fa, startWash: 0xfbf5ea,
    }),
    night: state({
      sky: [0x10162f, 0x252b55, 0x5d526e],
      clouds: [0x5f6882, 0x343a55, 0.28, 0.34],
      fog: [0x202641, 0.88, 0.88],
      sun: [0xd6ddf4, 0.82], fill: [0xaeb8d5, 0.62], bounce: [0xc4a8bd, 0.28],
      hemi: [0xb5c2dc, 0x77788e, 0.68], page: 0x11152c, startWash: 0x1d2139,
    }),
    cloudScale: 1,
    cloudVerticalScale: 1,
    cloudSpeed: 1,
    starVisibility: 1,
  },
  summer: {
    mode: 'summer',
    label: '夏',
    day: state({
      sky: [0x8db9b4, 0xc3dccf, 0xdfece4],
      clouds: [0xf0f6ef, 0xbfd4ca, 0.62, 0.22],
      fog: [0xdce8e1, 1.02, 1.06],
      sun: [0xfff1d2, 2.25], fill: [0xaab4ec, 1.05], bounce: [0xd8cbe8, 0.32],
      hemi: [0xd4e8fa, 0x9d89aa, 1.08], page: 0xd7e5df, startWash: 0xdde2ca,
    }),
    night: state({
      sky: [0x071936, 0x12365a, 0x315b70],
      clouds: [0x304c61, 0x20384d, 0.08, 0.07],
      fog: [0x15324a, 0.92, 0.94],
      sun: [0xd6ddf4, 0.82], fill: [0xaeb8d5, 0.62], bounce: [0xc4a8bd, 0.26],
      hemi: [0xb5c2dc, 0x77788e, 0.68], page: 0x0b203b, startWash: 0x15304a,
    }),
    cloudScale: 1.04,
    cloudVerticalScale: 0.86,
    cloudSpeed: 0.82,
    starVisibility: 1.08,
  },
  autumn: {
    mode: 'autumn',
    label: '秋',
    day: state({
      sky: [0xa5b6c4, 0xd5d3c7, 0xf0e3d5],
      clouds: [0xf6ecdf, 0xd1bcaa, 0.58, 0.2],
      fog: [0xe5ded4, 0.98, 0.98],
      sun: [0xfff1d2, 2.18], fill: [0xaab4ec, 1.0], bounce: [0xd8cbe8, 0.32],
      hemi: [0xd4e8fa, 0x9d89aa, 1.05], page: 0xe4ddd3, startWash: 0xf0d9bb,
    }),
    night: state({
      sky: [0x141a31, 0x30364f, 0x5a5364],
      clouds: [0x484958, 0x343540, 0.09, 0.08],
      fog: [0x2e3041, 0.88, 0.88],
      sun: [0xd6ddf4, 0.78], fill: [0xaeb8d5, 0.58], bounce: [0xc4a8bd, 0.28],
      hemi: [0xb5c2dc, 0x77788e, 0.64], page: 0x1d2034, startWash: 0x2a2c42,
    }),
    cloudScale: 0.92,
    cloudVerticalScale: 0.72,
    cloudSpeed: 1.26,
    starVisibility: 0.82,
  },
  winter: {
    mode: 'winter',
    label: '冬',
    day: state({
      sky: [0xa4bfd1, 0xd1e1e8, 0xdde9ef],
      clouds: [0xf6fbfd, 0xb9cfda, 0.65, 0.24],
      fog: [0xdce6eb, 0.88, 0.84],
      sun: [0xe8f2ff, 2.08], fill: [0xb4c5dc, 1.0], bounce: [0xd2cfdb, 0.3],
      hemi: [0xcbdde8, 0x9295a2, 1.02], page: 0xe1eaed, startWash: 0xdbdfd5,
    }),
    night: state({
      sky: [0x091426, 0x1c2b40, 0x46576a],
      clouds: [0x405367, 0x2d3d4d, 0.11, 0.1],
      fog: [0x1d2d3d, 0.79, 0.78],
      sun: [0xdcecff, 0.74], fill: [0xaeb8d5, 0.56], bounce: [0xc4a8bd, 0.22],
      hemi: [0xb5c2dc, 0x77788e, 0.6], page: 0x0e1c2d, startWash: 0x182b3b,
    }),
    cloudScale: 1.14,
    cloudVerticalScale: 0.78,
    cloudSpeed: 0.66,
    starVisibility: 0.64,
  },
};

export function isSeasonMode(value: string | null): value is SeasonMode {
  return value !== null && (SEASON_MODES as readonly string[]).includes(value);
}

export function cloneEnvironmentState(source: SeasonEnvironmentState): SeasonEnvironmentState {
  return {
    ...source,
    skyTop: source.skyTop.clone(), skyMid: source.skyMid.clone(), skyHaze: source.skyHaze.clone(),
    cloud: source.cloud.clone(), cloudShade: source.cloudShade.clone(), fog: source.fog.clone(),
    sun: source.sun.clone(), fill: source.fill.clone(), bounce: source.bounce.clone(),
    hemiSky: source.hemiSky.clone(), hemiGround: source.hemiGround.clone(),
    pageBackground: source.pageBackground.clone(),
    startWash: source.startWash.clone(),
  };
}

export function lerpEnvironmentState(
  target: SeasonEnvironmentState,
  from: SeasonEnvironmentState,
  to: SeasonEnvironmentState,
  progress: number,
): SeasonEnvironmentState {
  target.skyTop.copy(from.skyTop).lerp(to.skyTop, progress);
  target.skyMid.copy(from.skyMid).lerp(to.skyMid, progress);
  target.skyHaze.copy(from.skyHaze).lerp(to.skyHaze, progress);
  target.cloud.copy(from.cloud).lerp(to.cloud, progress);
  target.cloudShade.copy(from.cloudShade).lerp(to.cloudShade, progress);
  target.fog.copy(from.fog).lerp(to.fog, progress);
  target.sun.copy(from.sun).lerp(to.sun, progress);
  target.fill.copy(from.fill).lerp(to.fill, progress);
  target.bounce.copy(from.bounce).lerp(to.bounce, progress);
  target.hemiSky.copy(from.hemiSky).lerp(to.hemiSky, progress);
  target.hemiGround.copy(from.hemiGround).lerp(to.hemiGround, progress);
  target.pageBackground.copy(from.pageBackground).lerp(to.pageBackground, progress);
  target.startWash.copy(from.startWash).lerp(to.startWash, progress);
  for (const key of [
    'cloudOpacity', 'cloudShadeOpacity', 'fogNearScale', 'fogFarScale',
    'sunIntensity', 'fillIntensity', 'bounceIntensity', 'hemiIntensity',
  ] as const) target[key] = THREE.MathUtils.lerp(from[key], to[key], progress);
  return target;
}

export function resolveSeasonEnvironment(
  mode: SeasonMode,
  themeProgress: number,
  target = cloneEnvironmentState(SEASON_PROFILES.spring.day),
): SeasonEnvironmentState {
  const profile = SEASON_PROFILES[mode];
  return lerpEnvironmentState(target, profile.day, profile.night, themeProgress);
}

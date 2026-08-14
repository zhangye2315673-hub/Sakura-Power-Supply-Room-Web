import * as THREE from 'three';
import {
  PRINTER_PAPER_PROFILES,
  PRINTER_PAPER_STOP_END,
  type PrinterPaperProfile,
} from './PrinterPaperProfiles';

const DEFAULT_PAPER_PROFILE = PRINTER_PAPER_PROFILES[0];
const PAPER_LAUNCH_INTERVALS = PRINTER_PAPER_PROFILES.slice(1).map((profile, index) => (
  profile.launchTime - PRINTER_PAPER_PROFILES[index].launchTime
));

export const PRINTER_PERFORMANCE_TIMELINE = Object.freeze({
  startupEnd: 0.18,
  firstLaunch: DEFAULT_PAPER_PROFILE.launchTime,
  launchInterval: PAPER_LAUNCH_INTERVALS[0],
  launchIntervals: PAPER_LAUNCH_INTERVALS,
  flightDuration: DEFAULT_PAPER_PROFILE.flightDuration,
  pageCount: PRINTER_PAPER_PROFILES.length,
  feedEnd: DEFAULT_PAPER_PROFILE.feedEnd,
  glideEnd: DEFAULT_PAPER_PROFILE.glideEnd,
  stopEnd: PRINTER_PAPER_STOP_END,
  previousGenericHorizontalTravel: 4.6,
  horizontalTravel: 4.31,
  bottomExitY: -6.8,
  loopVerticalRadius: DEFAULT_PAPER_PROFILE.loopVerticalRadius,
  feedForwardDistance: DEFAULT_PAPER_PROFILE.feedForwardDistance,
  feedLaunchBias: DEFAULT_PAPER_PROFILE.feedLaunchBias,
  loopDepthRadius: DEFAULT_PAPER_PROFILE.loopDepthRadius,
  loopForwardDrift: DEFAULT_PAPER_PROFILE.loopForwardDrift,
  loopTopSlowdown: DEFAULT_PAPER_PROFILE.loopTopSlowdown,
  leafDepthAmplitude: DEFAULT_PAPER_PROFILE.leafDepthAmplitude,
  leafDepthCycles: 1.25,
  fallDropDistance: DEFAULT_PAPER_PROFILE.fallDropDistance,
  fallFirstStop: DEFAULT_PAPER_PROFILE.fallFirstStop,
  fallSecondStop: DEFAULT_PAPER_PROFILE.fallSecondStop,
  fallFirstStopDrop: DEFAULT_PAPER_PROFILE.fallFirstStopDrop,
  fallSecondStopDrop: DEFAULT_PAPER_PROFILE.fallSecondStopDrop,
  leafVelocityPitch: DEFAULT_PAPER_PROFILE.leafVelocityPitch,
  leafReactionPitch: DEFAULT_PAPER_PROFILE.leafReactionPitch,
});

export type PrinterPerformancePhase =
  | 'idle'
  | 'spin-up'
  | 'continuous-feed'
  | 'paper-glide'
  | 'flutter-fall'
  | 'all-pages-exited';

export type PrinterPageStage = 'queued' | 'feed' | 'glide' | 'fall' | 'recycled';

export type PrinterPerformanceDiagnostics = {
  time: number;
  phase: PrinterPerformancePhase;
  pageCount: number;
  visiblePages: number;
  recycledPages: number;
  activeStages: PrinterPageStage[];
  launchTimes: number[];
  launchInterval: number;
  launchIntervals: number[];
  profileIds: string[];
  a4Width: number;
  a4Length: number;
  a4AspectRatio: number;
  paperThickness: number;
  minimumHorizontalTravel: number;
  previousGenericHorizontalTravel: number;
  horizontalTravelMultiplier: number;
  currentMaximumHorizontalTravel: number;
  currentHighestY: number;
  currentLowestY: number;
  maximumBend: number;
  maximumTwist: number;
  bottomExitY: number;
  recycledOnlyAfterBottomExit: boolean;
  pagesHaveDistinctProgress: boolean;
  allPaperGeometryVolumetric: boolean;
  timelineOwner: 'AppliancePerformanceSystem/PrinterPerformance';
  effectOwner: 'printer-model-rig';
  sharedSpectacleEffects: 'disabled';
  forbiddenPrimitives: readonly ['PlaneGeometry', 'Sprite', 'Line'];
};

export type PrinterPerformanceController = {
  apply(time: number, power: number): void;
  reset(): void;
  signal(): number;
  diagnostics: PrinterPerformanceDiagnostics;
};

type PaperRig = {
  index: number;
  profile: PrinterPaperProfile;
  pivot: THREE.Group;
  mesh: THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>;
  launchTime: number;
  duration: number;
  basePositions: Float32Array;
  restPosition: THREE.Vector3;
  restQuaternion: THREE.Quaternion;
  restScale: THREE.Vector3;
};

type NodeRest = {
  object: THREE.Object3D;
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  scale: THREE.Vector3;
  visible: boolean;
};

type PaperPathSample = {
  x: number;
  y: number;
  z: number;
  stage: Exclude<PrinterPageStage, 'queued' | 'recycled'>;
};

type LeafMotionSample = {
  depth: number;
  descent: number;
  velocity: number;
  acceleration: number;
};

function numberData(object: THREE.Object3D, key: string, fallback: number): number {
  const value = Number(object.userData[key]);
  return Number.isFinite(value) ? value : fallback;
}

function suffixIndex(name: string): number {
  return Number(name.match(/(\d+)$/)?.[1] ?? 0);
}

function captureRest(object: THREE.Object3D | null | undefined): NodeRest | null {
  if (!object) return null;
  return {
    object,
    position: object.position.clone(),
    quaternion: object.quaternion.clone(),
    scale: object.scale.clone(),
    visible: object.visible,
  };
}

function restoreRest(rest: NodeRest | null): void {
  if (!rest) return;
  rest.object.position.copy(rest.position);
  rest.object.quaternion.copy(rest.quaternion);
  rest.object.scale.copy(rest.scale);
  rest.object.visible = rest.visible;
}

function loopProgress(progress: number, profile: PrinterPaperProfile): number {
  const raw = (progress - profile.feedEnd)
    / (profile.glideEnd - profile.feedEnd);
  const clamped = THREE.MathUtils.clamp(raw, 0, 1);
  // The roller impulse carries the page quickly into the climb. This analytic
  // time warp slows the phase only around the loop apex, then gives the page
  // its speed back on the descent without inserting a hold or discontinuity.
  return clamped + profile.loopTopSlowdown
    * Math.sin(clamped * Math.PI * 2) / (Math.PI * 2);
}

function feedProgress(progress: number, profile: PrinterPaperProfile): number {
  const raw = THREE.MathUtils.clamp(
    progress / profile.feedEnd,
    0,
    1,
  );
  // Positive initial bias models the rollers throwing the sheet out quickly;
  // the derivative stays non-zero at the loop join so the page never pauses.
  return raw + profile.feedLaunchBias * raw * (1 - raw);
}

function leafMotion(progress: number, profile: PrinterPaperProfile): LeafMotionSample {
  const p = THREE.MathUtils.clamp(progress, 0, 1);
  const stops = [
    { progress: 0, depth: 0, descent: 0 },
    {
      progress: profile.fallFirstStop,
      depth: 1,
      descent: profile.fallFirstStopDrop,
    },
    {
      progress: profile.fallSecondStop,
      depth: -1,
      descent: profile.fallSecondStopDrop,
    },
    { progress: 1, depth: 1, descent: 1 },
  ] as const;
  const segmentIndex = p <= stops[1].progress ? 0 : p <= stops[2].progress ? 1 : 2;
  const from = stops[segmentIndex];
  const to = stops[segmentIndex + 1];
  const duration = to.progress - from.progress;
  const local = THREE.MathUtils.clamp((p - from.progress) / duration, 0, 1);
  // The loop already gives the sheet forward momentum. The first fall leg is
  // therefore a braking approach to its first landing point, not another
  // zero-speed launch. Later legs still leave and reach their reversal points
  // from rest, so they retain the cosine acceleration/deceleration profile.
  const firstApproach = segmentIndex === 0;
  const eased = firstApproach
    ? 1 - (1 - local) ** 2
    : (1 - Math.cos(local * Math.PI)) * 0.5;
  const depthDelta = to.depth - from.depth;
  const direction = Math.sign(depthDelta);
  return {
    depth: THREE.MathUtils.lerp(from.depth, to.depth, eased),
    descent: THREE.MathUtils.lerp(from.descent, to.descent, eased),
    velocity: firstApproach
      ? direction * (1 - local)
      : direction * Math.sin(local * Math.PI),
    acceleration: firstApproach
      ? -direction
      : direction * Math.cos(local * Math.PI),
  };
}

function samplePath(progress: number, profile: PrinterPaperProfile): PaperPathSample {
  const p = THREE.MathUtils.clamp(progress, 0, 1);
  if (p < profile.feedEnd) {
    const feed = feedProgress(p, profile);
    return {
      x: profile.loopLateralOffset * THREE.MathUtils.smoothstep(feed, 0, 1),
      // A clean sheet leaves the rollers level and already moving. Starting
      // the loop with the same forward tangent avoids the former visible
      // stop/pose snap between ejection and the roller-coaster arc.
      y: 0,
      z: profile.feedForwardDistance * feed,
      stage: 'feed',
    };
  }

  if (p < profile.glideEnd) {
    const loop = loopProgress(p, profile);
    const angle = loop * Math.PI * 2;
    return {
      x: profile.loopLateralOffset
        + profile.loopLateralSwing * (1 - Math.cos(angle)) * 0.5,
      y: profile.loopVerticalRadius * (1 - Math.cos(angle)),
      z: profile.feedForwardDistance
        + profile.loopForwardDrift * loop
        + profile.loopDepthRadius * Math.sin(angle),
      stage: 'glide',
    };
  }

  const fall = (p - profile.glideEnd) / (1 - profile.glideEnd);
  // The first leg inherits the loop's forward momentum and brakes only at its
  // landing point. The remaining fore/aft legs accelerate from rest, brake to
  // a real zero-velocity endpoint, then reverse. Descent shares those points.
  const motion = leafMotion(fall, profile);
  const depthEnvelope = profile.leafDepthAmplitude
    * (1 - motion.descent * 0.2);
  const firstApproach = THREE.MathUtils.clamp(fall / profile.fallFirstStop, 0, 1);
  const firstApproachEase = 1 - (1 - firstApproach) ** 2;
  const lateral = fall <= profile.fallFirstStop
    ? THREE.MathUtils.lerp(
      profile.loopLateralOffset,
      profile.fallLateralTarget,
      firstApproachEase,
    )
    : profile.fallLateralTarget + profile.fallLateralSway * (motion.depth - 1);
  return {
    x: lateral,
    y: -profile.fallDropDistance * motion.descent,
    z: profile.feedForwardDistance
      + profile.loopForwardDrift
      + profile.fallDepthDirection * motion.depth * depthEnvelope,
    stage: 'fall',
  };
}

function sampleTangent(progress: number, profile: PrinterPaperProfile): THREE.Vector3 {
  const epsilon = 0.001;
  const before = samplePath(Math.max(0, progress - epsilon), profile);
  const after = samplePath(Math.min(1, progress + epsilon), profile);
  return new THREE.Vector3(
    after.x - before.x,
    after.y - before.y,
    after.z - before.z,
  ).normalize();
}

function restorePaperGeometry(rig: PaperRig): void {
  const position = rig.mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
  const target = position.array as Float32Array;
  target.set(rig.basePositions);
  position.needsUpdate = true;
  rig.mesh.geometry.computeVertexNormals();
}

function phaseAt(
  power: number,
  visiblePages: number,
  recycledPages: number,
  stages: readonly PrinterPageStage[],
): PrinterPerformancePhase {
  if (power <= 0.001) return 'idle';
  if (visiblePages === 0 && recycledPages === 0) return 'spin-up';
  if (visiblePages === 0 && recycledPages >= PRINTER_PERFORMANCE_TIMELINE.pageCount) {
    return 'all-pages-exited';
  }
  if (stages.includes('fall')) return 'flutter-fall';
  if (stages.includes('glide')) return 'paper-glide';
  return 'continuous-feed';
}

export function createPrinterPerformance(root: THREE.Group): PrinterPerformanceController {
  const papers: PaperRig[] = [];
  root.traverse((object) => {
    if (!(object instanceof THREE.Group) || !/^printer-performance-page-\d+$/.test(object.name)) return;
    const mesh = object.children.find((child): child is THREE.Mesh => (
      child instanceof THREE.Mesh && child.userData.performanceProp === 'clean-flat-volumetric-a4-paper'
    ));
    if (!mesh) return;
    const position = mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
    const index = suffixIndex(object.name);
    const profile = PRINTER_PAPER_PROFILES[index - 1] ?? DEFAULT_PAPER_PROFILE;
    papers.push({
      index,
      profile,
      pivot: object,
      mesh,
      launchTime: numberData(object, 'launchTime', profile.launchTime),
      duration: numberData(object, 'flightDuration', profile.flightDuration),
      basePositions: new Float32Array(position.array as ArrayLike<number>),
      restPosition: object.position.clone(),
      restQuaternion: object.quaternion.clone(),
      restScale: object.scale.clone(),
    });
  });
  papers.sort((first, second) => first.index - second.index);

  const supportRest = captureRest(root.getObjectByName('printer-rear-paper-support-pivot'));
  const rollerRest = captureRest(root.getObjectByName('printer-feed-roller-pivot'));
  const carriageRest = captureRest(root.getObjectByName('printer-inferred-print-carriage-pivot'));
  const trayRest = captureRest(root.getObjectByName('printer-output-tray-hinge-pivot'));
  const indicator = root.getObjectByName('status-indicator') as THREE.Mesh<
    THREE.BufferGeometry,
    THREE.MeshToonMaterial
  > | null;
  const indicatorColor = indicator?.material.color.clone();
  const indicatorEmissive = indicator?.material.emissive.clone();
  const indicatorIntensity = indicator?.material.emissiveIntensity ?? 0;
  const launchTimes = papers.map((paper) => paper.launchTime);
  const launchIntervals = launchTimes.slice(1).map((launch, index) => launch - launchTimes[index]);
  const firstMesh = papers[0]?.mesh;
  const a4Width = firstMesh ? numberData(firstMesh, 'paperWidth', 0) : 0;
  const a4Length = firstMesh ? numberData(firstMesh, 'paperLength', 0) : 0;
  const paperThickness = firstMesh ? numberData(firstMesh, 'paperThickness', 0) : 0;
  let signalValue = 0;

  const diagnostics: PrinterPerformanceDiagnostics = {
    time: 0,
    phase: 'idle',
    pageCount: papers.length,
    visiblePages: 0,
    recycledPages: 0,
    activeStages: [],
    launchTimes,
    launchInterval: launchIntervals[0] ?? 0,
    launchIntervals,
    profileIds: papers.map((paper) => paper.profile.id),
    a4Width,
    a4Length,
    a4AspectRatio: a4Width > 0 ? a4Length / a4Width : 0,
    paperThickness,
    minimumHorizontalTravel: PRINTER_PERFORMANCE_TIMELINE.horizontalTravel,
    previousGenericHorizontalTravel: PRINTER_PERFORMANCE_TIMELINE.previousGenericHorizontalTravel,
    horizontalTravelMultiplier: PRINTER_PERFORMANCE_TIMELINE.horizontalTravel
      / PRINTER_PERFORMANCE_TIMELINE.previousGenericHorizontalTravel,
    currentMaximumHorizontalTravel: 0,
    currentHighestY: 0,
    currentLowestY: 0,
    maximumBend: 0,
    maximumTwist: 0,
    bottomExitY: PRINTER_PERFORMANCE_TIMELINE.bottomExitY,
    recycledOnlyAfterBottomExit: true,
    pagesHaveDistinctProgress: false,
    allPaperGeometryVolumetric: papers.every((paper) => (
      paper.mesh.geometry.type !== 'PlaneGeometry'
      && numberData(paper.mesh, 'paperThickness', 0) > 0
    )),
    timelineOwner: 'AppliancePerformanceSystem/PrinterPerformance',
    effectOwner: 'printer-model-rig',
    sharedSpectacleEffects: 'disabled',
    forbiddenPrimitives: ['PlaneGeometry', 'Sprite', 'Line'],
  };
  root.userData.printerPerformanceDiagnostics = diagnostics;

  const reset = (): void => {
    restoreRest(supportRest);
    restoreRest(rollerRest);
    restoreRest(carriageRest);
    restoreRest(trayRest);
    papers.forEach((paper) => {
      paper.pivot.visible = false;
      paper.pivot.position.copy(paper.restPosition);
      paper.pivot.quaternion.copy(paper.restQuaternion);
      paper.pivot.scale.copy(paper.restScale);
      restorePaperGeometry(paper);
    });
    if (indicator && indicatorColor && indicatorEmissive) {
      indicator.material.color.copy(indicatorColor);
      indicator.material.emissive.copy(indicatorEmissive);
      indicator.material.emissiveIntensity = indicatorIntensity;
    }
    signalValue = 0;
    Object.assign(diagnostics, {
      time: 0,
      phase: 'idle',
      visiblePages: 0,
      recycledPages: 0,
      activeStages: [],
      currentMaximumHorizontalTravel: 0,
      currentHighestY: 0,
      currentLowestY: 0,
      maximumBend: 0,
      maximumTwist: 0,
      recycledOnlyAfterBottomExit: true,
      pagesHaveDistinctProgress: false,
    });
  };

  const apply = (rawTime: number, rawPower: number): void => {
    const time = Math.max(0, rawTime);
    const power = THREE.MathUtils.clamp(rawPower, 0, 1);
    const startup = THREE.MathUtils.smoothstep(time, 0.02, PRINTER_PERFORMANCE_TIMELINE.startupEnd);
    signalValue = startup * power;

    restoreRest(supportRest);
    restoreRest(rollerRest);
    restoreRest(carriageRest);
    restoreRest(trayRest);
    const feedEnvelope = startup * power;
    // The rear input sheet is part of the printer body, not a second effect.
    // Keep its support fixed so it cannot swing forward and masquerade as a
    // giant extra output page during the loop.
    if (rollerRest) rollerRest.object.rotation.x += time * 18.5 * feedEnvelope;
    if (carriageRest) carriageRest.object.position.x += Math.sin(time * 23) * 0.94 * feedEnvelope;
    if (trayRest) trayRest.object.rotation.x += 0.42 * feedEnvelope;
    if (indicator && indicatorColor && indicatorEmissive) {
      indicator.material.color.setHex(feedEnvelope > 0.01 ? 0xffd9e5 : indicatorColor.getHex());
      indicator.material.emissive.setHex(feedEnvelope > 0.01 ? 0xff6070 : indicatorEmissive.getHex());
      indicator.material.emissiveIntensity = feedEnvelope * 1.9;
    }

    let visiblePages = 0;
    let recycledPages = 0;
    let currentMaximumHorizontalTravel = 0;
    let currentHighestY = Number.NEGATIVE_INFINITY;
    let currentLowestY = Number.POSITIVE_INFINITY;
    let maximumBend = 0;
    let maximumTwist = 0;
    let recycledOnlyAfterBottomExit = true;
    const activeStages: PrinterPageStage[] = [];
    const activeProgresses: number[] = [];

    papers.forEach((paper) => {
      paper.pivot.position.copy(paper.restPosition);
      paper.pivot.quaternion.copy(paper.restQuaternion);
      paper.pivot.scale.copy(paper.restScale);
      const age = time - paper.launchTime;
      const progress = age / paper.duration;
      if (age < 0 || power <= 0.001) {
        paper.pivot.visible = false;
        restorePaperGeometry(paper);
        activeStages.push('queued');
        return;
      }
      if (age + 1e-8 >= paper.duration) {
        const exit = samplePath(1, paper.profile);
        paper.pivot.position.set(
          paper.restPosition.x + exit.x,
          paper.restPosition.y + exit.y,
          paper.restPosition.z + exit.z,
        );
        paper.pivot.visible = false;
        paper.pivot.userData.lastRecycleY = paper.pivot.position.y;
        paper.pivot.userData.recycledAfterBottomExit = paper.pivot.position.y <= PRINTER_PERFORMANCE_TIMELINE.bottomExitY;
        recycledOnlyAfterBottomExit &&= Boolean(paper.pivot.userData.recycledAfterBottomExit);
        recycledPages += 1;
        activeStages.push('recycled');
        return;
      }

      const clamped = THREE.MathUtils.clamp(progress, 0, 1);
      const path = samplePath(clamped, paper.profile);
      const tangent = sampleTangent(clamped, paper.profile);
      paper.pivot.visible = true;
      paper.pivot.position.set(
        paper.restPosition.x + path.x,
        paper.restPosition.y + path.y,
        paper.restPosition.z + path.z,
      );
      // During the glide stage the page follows one complete vertical loop in
      // its own forward/depth plane. The explicit turn keeps this a travelling
      // roller-coaster loop rather than an in-place flip around the center.
      let lateralRoll = 0;
      if (path.stage === 'glide') {
        // Use the single continuous loop phase as the sole orientation source.
        // The old atan2 correction changed sign at the apex and looked exactly
        // like one sheet was swapped for another between two frames.
        paper.pivot.rotation.x = -loopProgress(clamped, paper.profile) * Math.PI * 2;
      } else if (path.stage === 'fall') {
        const fall = (clamped - paper.profile.glideEnd)
          / (1 - paper.profile.glideEnd);
        const motion = leafMotion(fall, paper.profile);
        const pitchBlend = THREE.MathUtils.smoothstep(fall, 0, 0.05);
        // Velocity leans the sheet into travel; acceleration adds the opposite
        // reaction when the air brakes it. Keeping the -2π base also avoids an
        // equivalent-but-sign-flipped quaternion at the loop/fall handoff.
        paper.pivot.rotation.x = -Math.PI * 2 + (
          -motion.velocity * paper.profile.fallDepthDirection * paper.profile.leafVelocityPitch
          - motion.acceleration * paper.profile.fallDepthDirection * paper.profile.leafReactionPitch
        ) * pitchBlend;
        lateralRoll = paper.profile.fallRoll * motion.velocity;
      } else {
        paper.pivot.rotation.x = -Math.atan2(tangent.y, Math.max(0.0001, tangent.z));
      }
      paper.pivot.rotation.y = 0;
      paper.pivot.rotation.z = lateralRoll;
      // A freshly printed sheet stays clean and planar. Restore the exact rest
      // vertices every frame so no previous pose or review sample can leave a
      // crease, curl or twist in the geometry.
      restorePaperGeometry(paper);
      currentMaximumHorizontalTravel = Math.max(currentMaximumHorizontalTravel, path.z);
      currentHighestY = Math.max(currentHighestY, paper.pivot.position.y);
      currentLowestY = Math.min(currentLowestY, paper.pivot.position.y);
      visiblePages += 1;
      activeStages.push(path.stage);
      activeProgresses.push(clamped);
    });

    const pagesHaveDistinctProgress = activeProgresses.length > 1
      && Math.max(...activeProgresses) - Math.min(...activeProgresses) > 0.2;
    Object.assign(diagnostics, {
      time,
      phase: phaseAt(power, visiblePages, recycledPages, activeStages),
      visiblePages,
      recycledPages,
      activeStages,
      currentMaximumHorizontalTravel,
      currentHighestY: Number.isFinite(currentHighestY) ? currentHighestY : 0,
      currentLowestY: Number.isFinite(currentLowestY) ? currentLowestY : 0,
      maximumBend,
      maximumTwist,
      recycledOnlyAfterBottomExit,
      pagesHaveDistinctProgress,
    });
  };

  reset();
  return { apply, reset, signal: () => signalValue, diagnostics };
}

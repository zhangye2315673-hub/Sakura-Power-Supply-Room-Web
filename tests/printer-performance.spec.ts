import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { createPrinterModel } from '../src/appliances/models/printer';
import {
  PRINTER_PERFORMANCE_TIMELINE,
  createPrinterPerformance,
  type PrinterPerformanceDiagnostics,
} from '../src/appliances/performance/PrinterPerformance';
import { PRINTER_PAPER_PROFILES } from '../src/appliances/performance/PrinterPaperProfiles';
import {
  PRINTER_POWERED_ACTIVE_DURATION,
  poweredAnimationState,
} from '../src/appliances/poweredAnimation';

function pagePivots(root: THREE.Group): THREE.Group[] {
  const pages: THREE.Group[] = [];
  root.traverse((object) => {
    if (object instanceof THREE.Group && /^printer-performance-page-\d+$/.test(object.name)) {
      pages.push(object);
    }
  });
  return pages.sort((first, second) => (
    Number(first.name.match(/(\d+)$/)?.[1]) - Number(second.name.match(/(\d+)$/)?.[1])
  ));
}

function pageMesh(page: THREE.Group): THREE.Mesh<THREE.BufferGeometry> {
  return page.children.find((child): child is THREE.Mesh<THREE.BufferGeometry> => (
    child instanceof THREE.Mesh && child.userData.performanceProp === 'clean-flat-volumetric-a4-paper'
  )) as THREE.Mesh<THREE.BufferGeometry>;
}

function pose(root: THREE.Group): string {
  const values: unknown[] = [];
  root.traverse((object) => {
    const entry: Record<string, unknown> = {
      name: object.name,
      position: object.position.toArray().map((value) => Number(value.toFixed(7))),
      quaternion: object.quaternion.toArray().map((value) => Number(value.toFixed(7))),
      scale: object.scale.toArray().map((value) => Number(value.toFixed(7))),
      visible: object.visible,
    };
    if (object instanceof THREE.Mesh && object.userData.performanceProp === 'clean-flat-volumetric-a4-paper') {
      entry.vertices = Array.from(object.geometry.getAttribute('position').array as ArrayLike<number>)
        .map((value) => Number(value.toFixed(7)));
    }
    values.push(entry);
  });
  return JSON.stringify(values);
}

function diagnostics(root: THREE.Group): PrinterPerformanceDiagnostics {
  return root.userData.printerPerformanceDiagnostics as PrinterPerformanceDiagnostics;
}

function ySpan(mesh: THREE.Mesh<THREE.BufferGeometry>): number {
  const position = mesh.geometry.getAttribute('position');
  let minimum = Number.POSITIVE_INFINITY;
  let maximum = Number.NEGATIVE_INFINITY;
  for (let index = 0; index < position.count; index += 1) {
    minimum = Math.min(minimum, position.getY(index));
    maximum = Math.max(maximum, position.getY(index));
  }
  return maximum - minimum;
}

test('printer owns five clean, flat, thin paper sheets instead of a folded stream', () => {
  const model = createPrinterModel({ id: 'printer', accent: 0xe8aec4, referencePath: null });
  const pages = pagePivots(model.root);
  const forbidden: string[] = [];

  expect(pages).toHaveLength(PRINTER_PERFORMANCE_TIMELINE.pageCount);
  pages.forEach((page, index) => {
    const mesh = pageMesh(page);
    expect(mesh, `page ${index + 1} mesh`).toBeTruthy();
    mesh.geometry.computeBoundingBox();
    const size = mesh.geometry.boundingBox?.getSize(new THREE.Vector3()) ?? new THREE.Vector3();
    const width = Number(mesh.userData.paperWidth);
    const length = Number(mesh.userData.paperLength);
    const thickness = Number(mesh.userData.paperThickness);
    expect(mesh.geometry.type).toBe('BoxGeometry');
    expect(mesh.geometry.type).not.toBe('PlaneGeometry');
    expect(size.x).toBeCloseTo(width, 4);
    expect(size.z).toBeCloseTo(length, 4);
    expect(size.y).toBeCloseTo(thickness, 4);
    expect(width).toBeGreaterThanOrEqual(1.68);
    expect(width).toBeLessThanOrEqual(1.76);
    expect(length).toBeGreaterThanOrEqual(1.18);
    expect(length).toBeLessThanOrEqual(1.25);
    expect(length / width).toBeGreaterThan(0.65);
    expect(length / width).toBeLessThan(0.75);
    expect(thickness).toBeGreaterThanOrEqual(0.006);
    expect(thickness).toBeLessThanOrEqual(0.012);
    expect(mesh.geometry.getAttribute('position').count).toBeGreaterThanOrEqual(24);
    expect(Number(page.userData.flightDuration)).toBe(PRINTER_PAPER_PROFILES[index].flightDuration);
    expect(page.userData.paperProfileId).toBe(PRINTER_PAPER_PROFILES[index].id);
    expect(page.visible).toBe(false);
  });

  model.root.traverse((object) => {
    if (object instanceof THREE.Sprite || object instanceof THREE.Line) {
      forbidden.push(`${object.name}:${object.type}`);
    }
    if (object instanceof THREE.Mesh && object.userData.performanceEffect
      && object.geometry.type === 'PlaneGeometry') {
      forbidden.push(`${object.name}:${object.geometry.type}`);
    }
  });
  expect(forbidden).toEqual([]);
  expect(model.root.userData.printerPerformanceRig.sharedSpectacleEffects).toBe('disabled');
  expect(model.root.userData.printerPerformanceRig.lifecycle)
    .toBe('visible-from-exit-through-bottom-viewport-exit');
});

test('printer emits five staggered pages with distinct loops, landings, and fall speeds', () => {
  const model = createPrinterModel({ id: 'printer', accent: 0xe8aec4, referencePath: null });
  const performance = createPrinterPerformance(model.root);
  const pages = pagePivots(model.root);

  expect(pages).toHaveLength(5);
  const launchTimes = pages.map((page) => Number(page.userData.launchTime));
  const launchGaps = launchTimes.slice(1).map((launch, index) => launch - launchTimes[index]);
  const durations = pages.map((page) => Number(page.userData.flightDuration));
  expect(Math.min(...launchGaps)).toBeGreaterThan(0.55);
  expect(new Set(launchGaps.map((gap) => gap.toFixed(2))).size).toBeGreaterThanOrEqual(3);
  expect(Math.max(...durations) - Math.min(...durations)).toBeGreaterThan(1.2);
  expect(new Set(pages.map((page) => page.userData.paperProfileId)).size).toBe(5);

  const feedEnds: THREE.Vector3[] = [];
  const loopDiameters: number[] = [];
  const firstLandings: THREE.Vector3[] = [];
  const fallSpeeds: number[] = [];
  pages.forEach((page) => {
    const launch = Number(page.userData.launchTime);
    const duration = Number(page.userData.flightDuration);
    const feedEnd = Number(page.userData.feedEnd);
    const glideEnd = Number(page.userData.glideEnd);
    const firstStop = Number(page.userData.fallFirstStop);

    performance.apply(launch + duration * feedEnd, 1);
    const feedPose = page.position.clone();
    feedEnds.push(feedPose);
    performance.apply(launch + duration * (feedEnd + (glideEnd - feedEnd) * 0.5), 1);
    loopDiameters.push(page.position.y - feedPose.y);
    performance.apply(launch + duration * (glideEnd + firstStop * (1 - glideEnd)), 1);
    firstLandings.push(page.position.clone());

    const fallSample = glideEnd + 0.72 * (1 - glideEnd);
    performance.apply(launch + duration * fallSample, 1);
    const before = page.position.clone();
    performance.apply(launch + duration * fallSample + 0.12, 1);
    fallSpeeds.push(Math.abs(page.position.y - before.y) / 0.12);
  });

  expect(Math.max(...feedEnds.map((position) => position.z))
    - Math.min(...feedEnds.map((position) => position.z))).toBeGreaterThan(0.7);
  expect(Math.max(...loopDiameters) - Math.min(...loopDiameters)).toBeGreaterThan(0.7);
  expect(Math.max(...firstLandings.map((position) => position.x))
    - Math.min(...firstLandings.map((position) => position.x))).toBeGreaterThan(1.8);
  expect(Math.max(...firstLandings.map((position) => position.z))
    - Math.min(...firstLandings.map((position) => position.z))).toBeGreaterThan(1.2);
  expect(Math.max(...fallSpeeds) / Math.min(...fallSpeeds)).toBeGreaterThan(1.25);

  performance.apply(4.2, 1);
  expect(diagnostics(model.root).visiblePages).toBe(5);
  expect(diagnostics(model.root).pagesHaveDistinctProgress).toBe(true);
  expect(new Set(pages.map((page) => (
    page.position.toArray().map((value) => value.toFixed(2)).join(',')
  ))).size).toBe(5);
});

test('the clean page leaves continuously, loops forward, then falls slowly along depth', () => {
  const model = createPrinterModel({ id: 'printer', accent: 0xe8aec4, referencePath: null });
  const performance = createPrinterPerformance(model.root);
  const pages = pagePivots(model.root);
  const first = pages[0];
  const firstMesh = pageMesh(first);
  const rearSupport = model.root.getObjectByName('printer-rear-paper-support-pivot') as THREE.Group;
  const rearSupportRestRotation = rearSupport.rotation.x;
  const launch = Number(first.userData.launchTime);
  const duration = Number(first.userData.flightDuration);

  performance.apply(launch + duration * 0.55, 1);
  const multiPage = { ...diagnostics(model.root) };
  expect(multiPage.visiblePages).toBe(5);
  expect(multiPage.pagesHaveDistinctProgress).toBe(true);
  expect(multiPage.activeStages).toEqual(['fall', 'fall', 'glide', 'glide', 'feed']);
  expect(multiPage.launchTimes).toEqual(PRINTER_PAPER_PROFILES.map((profile) => profile.launchTime));
  expect(multiPage.launchIntervals).toEqual(PRINTER_PERFORMANCE_TIMELINE.launchIntervals);
  expect(new Set(multiPage.launchIntervals.map((gap) => gap.toFixed(2))).size)
    .toBeGreaterThanOrEqual(3);

  const formerCutoff = poweredAnimationState(5.2, 'printer');
  expect(formerCutoff.active).toBe(true);
  expect(formerCutoff.power).toBe(1);
  performance.apply(formerCutoff.time, formerCutoff.power);
  expect(first.visible).toBe(true);
  expect(diagnostics(model.root).activeStages).toContain('fall');

  const socket = model.root.getObjectByName('printer-paper-exit-socket') as THREE.Object3D;
  model.root.updateMatrixWorld(true);
  performance.apply(launch, 1);
  model.root.updateMatrixWorld(true);
  const socketPosition = socket.getWorldPosition(new THREE.Vector3());
  const pagePosition = first.getWorldPosition(new THREE.Vector3());
  const paperLength = Number(firstMesh.userData.paperLength);
  expect(pagePosition.x).toBeCloseTo(socketPosition.x, 4);
  expect(pagePosition.y).toBeCloseTo(socketPosition.y, 4);
  expect(pagePosition.z + paperLength * 0.5).toBeCloseTo(socketPosition.z, 4);

  const launchPosition = first.position.clone();
  const feedSamples = [0, 0.2, 0.4, 0.6, 0.8, 1].map((raw) => {
    performance.apply(launch + duration * PRINTER_PERFORMANCE_TIMELINE.feedEnd * raw, 1);
    return first.position.clone();
  });
  const feedZ = feedSamples.map((sample) => sample.z);
  const feedY = feedSamples.map((sample) => sample.y);
  const feedStepDistances = feedSamples.slice(1).map((sample, index) => (
    sample.distanceTo(feedSamples[index])
  ));
  expect(feedZ.every((value, index) => index === 0 || value > feedZ[index - 1])).toBe(true);
  expect(Math.max(...feedY) - Math.min(...feedY)).toBeLessThan(0.3);
  expect(feedStepDistances[0]).toBeGreaterThan(feedStepDistances.at(-1)! * 1.6);
  expect(PRINTER_PERFORMANCE_TIMELINE.flightDuration).toBeGreaterThanOrEqual(6.2);
  expect(PRINTER_PERFORMANCE_TIMELINE.flightDuration).toBeLessThan(7);

  const joinSamples = [0.13, 0.135, 0.14, 0.145, 0.15].map((progress) => {
    performance.apply(launch + duration * progress, 1);
    return first.position.clone();
  });
  const joinStepDistances = joinSamples.slice(1).map((sample, index) => (
    sample.distanceTo(joinSamples[index])
  ));
  expect(joinSamples.every((sample, index) => index === 0 || sample.z > joinSamples[index - 1].z))
    .toBe(true);
  expect(Math.min(...joinStepDistances)).toBeGreaterThan(0.035);

  performance.apply(launch + duration * PRINTER_PERFORMANCE_TIMELINE.feedEnd, 1);
  expect(first.position.z - launchPosition.z).toBeCloseTo(2, 6);
  performance.apply(launch + duration * PRINTER_PERFORMANCE_TIMELINE.glideEnd, 1);
  expect(first.position.z - launchPosition.z).toBeGreaterThan(3);

  const loopSamples = [0.02, 0.2, 0.4, 0.6, 0.8, 0.98].map((raw) => {
    const progress = PRINTER_PERFORMANCE_TIMELINE.feedEnd
      + raw * (PRINTER_PERFORMANCE_TIMELINE.glideEnd - PRINTER_PERFORMANCE_TIMELINE.feedEnd);
    performance.apply(launch + duration * progress, 1);
    return {
      position: first.position.clone(),
      pitch: first.rotation.x,
    };
  });
  expect(Math.max(...loopSamples.map((sample) => sample.position.y))
    - Math.min(...loopSamples.map((sample) => sample.position.y))).toBeGreaterThan(1.25);
  expect(Math.max(...loopSamples.map((sample) => sample.position.z))
    - Math.min(...loopSamples.map((sample) => sample.position.z))).toBeGreaterThan(0.25);
  expect(Math.abs(loopSamples.at(-1)!.pitch - loopSamples[0].pitch)).toBeGreaterThan(4.8);

  const loopPoseAt = (raw: number) => {
    const progress = PRINTER_PERFORMANCE_TIMELINE.feedEnd
      + raw * (PRINTER_PERFORMANCE_TIMELINE.glideEnd - PRINTER_PERFORMANCE_TIMELINE.feedEnd);
    performance.apply(launch + duration * progress, 1);
    return {
      position: first.position.clone(),
      quaternion: first.quaternion.clone(),
      geometryUuid: firstMesh.geometry.uuid,
    };
  };
  const topSamples = [0.494, 0.497, 0.5, 0.503, 0.506].map(loopPoseAt);
  const topFrameTurns = topSamples.slice(1).map((sample, index) => (
    sample.quaternion.angleTo(topSamples[index].quaternion)
  ));
  expect(Math.max(...topFrameTurns)).toBeLessThan(0.02);
  expect(new Set(topSamples.map((sample) => sample.geometryUuid))).toEqual(new Set([firstMesh.geometry.uuid]));
  const approachSpeed = loopPoseAt(0.12).position.distanceTo(loopPoseAt(0.1).position);
  const topSpeed = loopPoseAt(0.51).position.distanceTo(loopPoseAt(0.49).position);
  const descentSpeed = loopPoseAt(0.7).position.distanceTo(loopPoseAt(0.68).position);
  expect(approachSpeed).toBeGreaterThan(topSpeed * 1.5);
  expect(descentSpeed).toBeGreaterThan(topSpeed * 1.5);
  expect(topSpeed).toBeGreaterThan(approachSpeed * 0.25);

  const restVertices = Array.from(
    firstMesh.geometry.getAttribute('position').array as ArrayLike<number>,
  );
  performance.apply(launch + duration * 0.4, 1);
  expect(rearSupport.rotation.x).toBeCloseTo(rearSupportRestRotation, 8);
  expect(ySpan(firstMesh)).toBeCloseTo(Number(firstMesh.userData.paperThickness), 6);
  expect(Array.from(firstMesh.geometry.getAttribute('position').array as ArrayLike<number>))
    .toEqual(restVertices);
  expect(diagnostics(model.root).maximumBend).toBe(0);
  expect(diagnostics(model.root).maximumTwist).toBe(0);

  const fallingSamples = [0.05, 0.15, 0.2, 0.25, 0.4, 0.55, 0.6, 0.65, 0.75, 0.9, 0.98].map((fall) => {
    const progress = PRINTER_PERFORMANCE_TIMELINE.glideEnd
      + fall * (1 - PRINTER_PERFORMANCE_TIMELINE.glideEnd);
    performance.apply(launch + duration * progress, 1);
    return first.position.clone();
  });
  const fallingZ = fallingSamples.map((sample) => sample.z);
  let directionChanges = 0;
  for (let index = 2; index < fallingZ.length; index += 1) {
    const before = fallingZ[index - 1] - fallingZ[index - 2];
    const after = fallingZ[index] - fallingZ[index - 1];
    if (Math.sign(before) !== Math.sign(after)) directionChanges += 1;
  }
  expect(Math.max(...fallingZ) - Math.min(...fallingZ)).toBeGreaterThan(2.3);
  expect(Math.max(...fallingZ)).toBeLessThan(5.4);
  expect(Math.max(...fallingSamples.map((sample) => sample.x))
    - Math.min(...fallingSamples.map((sample) => sample.x))).toBeLessThan(0.001);
  expect(directionChanges).toBeGreaterThanOrEqual(2);
  const fallDuration = duration * (1 - PRINTER_PERFORMANCE_TIMELINE.glideEnd);
  expect(fallDuration).toBeGreaterThan(3.8);
  expect(fallDuration).toBeLessThan(4.1);
  expect(fallDuration / PRINTER_PERFORMANCE_TIMELINE.leafDepthCycles).toBeGreaterThan(3);

  const leafPoseAt = (fallProgress: number) => {
    const progress = PRINTER_PERFORMANCE_TIMELINE.glideEnd
      + fallProgress * (1 - PRINTER_PERFORMANCE_TIMELINE.glideEnd);
    performance.apply(launch + duration * progress, 1);
    return {
      z: first.position.z,
      y: first.position.y,
      pitch: Math.atan2(Math.sin(first.rotation.x), Math.cos(first.rotation.x)),
    };
  };
  const forwardExtreme = leafPoseAt(0.2);
  const backwardTravel = leafPoseAt(0.4);
  const backwardExtreme = leafPoseAt(0.6);
  const forwardTravel = leafPoseAt(0.8);
  expect(forwardExtreme.z - backwardExtreme.z).toBeGreaterThan(2.2);
  expect(forwardExtreme.pitch).toBeGreaterThan(0.2);
  expect(backwardExtreme.pitch).toBeLessThan(-0.2);
  expect(backwardTravel.pitch).toBeGreaterThan(0.2);
  expect(forwardTravel.pitch).toBeLessThan(-0.2);

  const brakingSamples = Array.from({ length: 11 }, (_, index) => (
    leafPoseAt(PRINTER_PERFORMANCE_TIMELINE.fallFirstStop
      + index / 10 * (
        PRINTER_PERFORMANCE_TIMELINE.fallSecondStop
        - PRINTER_PERFORMANCE_TIMELINE.fallFirstStop
      ))
  ));
  const brakingSteps = brakingSamples.slice(1).map((sample, index) => ({
    spatial: Math.hypot(
      sample.z - brakingSamples[index].z,
      sample.y - brakingSamples[index].y,
    ),
    vertical: Math.abs(sample.y - brakingSamples[index].y),
  }));
  const edgeSpeed = Math.max(brakingSteps[0].spatial, brakingSteps.at(-1)!.spatial);
  const middleSpeed = Math.max(...brakingSteps.slice(3, 7).map((step) => step.spatial));
  expect(middleSpeed).toBeGreaterThan(edgeSpeed * 4);
  expect(Math.max(...brakingSteps.slice(3, 7).map((step) => step.vertical)))
    .toBeGreaterThan(Math.max(brakingSteps[0].vertical, brakingSteps.at(-1)!.vertical) * 4);

  performance.apply(launch + duration * 0.62, 1);
  expect(first.position.y).toBeLessThan(-0.4);

  leafPoseAt(0.2);
  const travel = diagnostics(model.root);
  expect(travel.currentMaximumHorizontalTravel).toBeGreaterThan(4.2);
  expect(travel.currentMaximumHorizontalTravel).toBeLessThan(4.4);
  expect(travel.effectOwner).toBe('printer-model-rig');
  expect(travel.sharedSpectacleEffects).toBe('disabled');

  let minimumSocketClearance = Number.POSITIVE_INFINITY;
  for (let index = 0; index <= 160; index += 1) {
    const progress = PRINTER_PERFORMANCE_TIMELINE.feedEnd
      + (1 - PRINTER_PERFORMANCE_TIMELINE.feedEnd) * index / 160;
    performance.apply(launch + duration * Math.min(progress, 0.999), 1);
    model.root.updateMatrixWorld(true);
    const paperBounds = new THREE.Box3().setFromObject(first);
    minimumSocketClearance = Math.min(
      minimumSocketClearance,
      paperBounds.min.z - socketPosition.z,
    );
  }
  expect(minimumSocketClearance).toBeGreaterThan(0.1);
});

test('after the loop the page travels directly to the first landing point', () => {
  const model = createPrinterModel({ id: 'printer', accent: 0xe8aec4, referencePath: null });
  const performance = createPrinterPerformance(model.root);
  const first = pagePivots(model.root)[0];
  const launch = Number(first.userData.launchTime);
  const duration = Number(first.userData.flightDuration);

  const poseAtFallProgress = (fallProgress: number) => {
    const progress = PRINTER_PERFORMANCE_TIMELINE.glideEnd
      + fallProgress * (1 - PRINTER_PERFORMANCE_TIMELINE.glideEnd);
    performance.apply(launch + duration * progress, 1);
    return first.position.clone();
  };

  const firstLandingProgress = PRINTER_PERFORMANCE_TIMELINE.fallFirstStop;
  const loopExit = poseAtFallProgress(0);
  const firstLanding = poseAtFallProgress(firstLandingProgress);
  const directTravel = firstLanding.clone().sub(loopExit);
  const samples = Array.from({ length: 41 }, (_, index) => (
    poseAtFallProgress(firstLandingProgress * index / 40)
  ));
  const projectedProgress = samples.map((sample) => (
    sample.clone().sub(loopExit).dot(directTravel) / directTravel.lengthSq()
  ));
  const firstFallStep = (1 - PRINTER_PERFORMANCE_TIMELINE.glideEnd)
    * firstLandingProgress / 40;
  performance.apply(
    launch + duration * (PRINTER_PERFORMANCE_TIMELINE.glideEnd - firstFallStep),
    1,
  );
  const beforeLoopExit = first.position.clone();
  const inboundDistance = beforeLoopExit.distanceTo(loopExit);
  const outboundDistance = loopExit.distanceTo(samples[1]);

  expect(projectedProgress[0]).toBeCloseTo(0, 8);
  expect(projectedProgress.at(-1)).toBeCloseTo(1, 8);
  expect(outboundDistance).toBeGreaterThan(inboundDistance * 0.35);
  expect(projectedProgress.every((value, index) => (
    index === 0 || value >= projectedProgress[index - 1] - 1e-6
  ))).toBe(true);
  expect(projectedProgress.slice(1, -1).every((value) => value > 0 && value < 1)).toBe(true);
});

test('printer keeps every page visible through bottom exit, then recycles and resets exactly', () => {
  const model = createPrinterModel({ id: 'printer', accent: 0xe8aec4, referencePath: null });
  const performance = createPrinterPerformance(model.root);
  const pages = pagePivots(model.root);
  const first = pages[0];
  const last = pages.at(-1) as THREE.Group;
  const idle = pose(model.root);
  const firstLaunch = Number(first.userData.launchTime);
  const duration = Number(first.userData.flightDuration);

  performance.apply(firstLaunch + duration - 0.002, 1);
  expect(first.visible).toBe(true);
  expect(first.position.y).toBeLessThan(PRINTER_PERFORMANCE_TIMELINE.bottomExitY);

  performance.apply(firstLaunch + duration, 1);
  expect(first.visible).toBe(false);
  expect(first.userData.recycledAfterBottomExit).toBe(true);
  expect(Number(first.userData.lastRecycleY)).toBeLessThanOrEqual(PRINTER_PERFORMANCE_TIMELINE.bottomExitY);
  expect(diagnostics(model.root).recycledOnlyAfterBottomExit).toBe(true);

  const lastExit = Number(last.userData.launchTime) + Number(last.userData.flightDuration);
  expect(lastExit).toBeLessThan(PRINTER_PERFORMANCE_TIMELINE.stopEnd);
  expect(PRINTER_PERFORMANCE_TIMELINE.stopEnd).toBeGreaterThan(5.2);
  expect(PRINTER_PERFORMANCE_TIMELINE.stopEnd).toBe(PRINTER_POWERED_ACTIVE_DURATION);
  performance.apply(lastExit - 0.002, 0.02);
  expect(last.visible).toBe(true);
  expect(last.position.y).toBeLessThan(PRINTER_PERFORMANCE_TIMELINE.bottomExitY);
  performance.apply(lastExit, 0.02);
  expect(last.visible).toBe(false);
  expect(diagnostics(model.root).recycledPages).toBe(PRINTER_PERFORMANCE_TIMELINE.pageCount);
  expect(diagnostics(model.root).phase).toBe('all-pages-exited');

  performance.reset();
  expect(pose(model.root)).toBe(idle);
  expect(performance.signal()).toBe(0);
  expect(diagnostics(model.root).phase).toBe('idle');
  expect(pages.every((page) => !page.visible)).toBe(true);
});

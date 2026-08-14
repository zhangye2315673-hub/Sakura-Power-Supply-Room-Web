import { expect, test, type Browser, type Page } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PNG } from 'pngjs';
import { APPLIANCE_CATALOG, selectAppliancesForSeed, type ApplianceKind } from '../src/systems/ApplianceCatalog';
import { applianceSeedForPuzzle } from '../src/puzzle/levels';

const EVIDENCE_TIME = 4.2;
const EVIDENCE_KINDS = ['kettle', 'fan', 'washer', 'printer', 'humidifier', 'dehumidifier'] as const;
const EVIDENCE_SEEDS = {
  kettle: 16,
  fan: 12,
  washer: 3,
  printer: 4,
  humidifier: 2,
  dehumidifier: 1,
} as const satisfies Record<typeof EVIDENCE_KINDS[number], number>;
const ARTIFACT_DIR = path.resolve('artifacts/appliance-performance-comparison');

type RuntimeLog = {
  consoleErrors: string[];
  pageErrors: string[];
};

function seedContaining(kind: ApplianceKind): number {
  const deterministic = EVIDENCE_SEEDS[kind as keyof typeof EVIDENCE_SEEDS];
  if (deterministic !== undefined) return deterministic;
  for (let seed = 1; seed < 100_000; seed += 1) {
    const applianceSeed = applianceSeedForPuzzle(seed, 0);
    if (selectAppliancesForSeed(applianceSeed).some((definition) => definition.id === kind)) {
      return seed;
    }
  }
  throw new Error(`Unable to find puzzle seed containing ${kind}`);
}

async function newEvidencePage(browser: Browser): Promise<{ page: Page; log: RuntimeLog }> {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const log: RuntimeLog = { consoleErrors: [], pageErrors: [] };
  page.on('console', (message) => {
    if (message.type() === 'error') log.consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => log.pageErrors.push(error.message));
  await page.addInitScript((time) => {
    window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = time;
  }, EVIDENCE_TIME);
  return { page, log };
}

async function waitForDirectGame(page: Page, requireClickTarget = true): Promise<void> {
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true,
    null,
    { timeout: 90_000 },
  );
  if (await page.locator('#start-game-button').isVisible()) {
    await page.click('#start-game-button');
  }
  await page.waitForFunction(
    (needsClickTarget) => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      return diagnostics?.sceneVisibility.appliances === true
        && diagnostics.appliances.length > 0
        && diagnostics.opening.active === false
        && (!needsClickTarget
          || (diagnostics.availableClickTargets?.length ?? 0) > 0
          || diagnostics.clickTarget !== null);
    },
    requireClickTarget,
    { timeout: 60_000 },
  );
}

async function waitForGamePerformance(page: Page, kind: ApplianceKind): Promise<ThreeGameDiagnostics> {
  await page.waitForFunction(
    (selected) => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      const appliance = diagnostics?.appliances.find((item) => item.kind === selected);
      return appliance?.state === 'active'
        && diagnostics?.performances.sessions === 1
        && diagnostics.performances.timelineOwners === 1
        && Math.abs((diagnostics.performances.elapsedByKind[selected] ?? -1) - 4.2) < 0.0001
        && (diagnostics.performances.signalsByKind[selected] ?? 0) > 0;
    },
    kind,
    { timeout: 30_000 },
  );
  return page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__ as ThreeGameDiagnostics);
}

async function activateGameAppliance(page: Page, kind: ApplianceKind): Promise<ThreeGameDiagnostics> {
  const seed = seedContaining(kind);
  await page.goto(`/?seed=${seed}&mode=random&direct=1`);
  await waitForDirectGame(page, false);
  await page.waitForFunction(
    (selected) => window.__THREE_GAME_DIAGNOSTICS__?.appliances.some((item) => item.kind === selected),
    kind,
    { timeout: 90_000 },
  );

  for (let attempt = 0; attempt < 48; attempt += 1) {
    const diagnostics = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__ ?? null);
    if (!diagnostics) continue;
    const appliance = diagnostics.appliances.find((item) => item.kind === kind);
    if (appliance?.state === 'active') return waitForGamePerformance(page, kind);

    const activationStarted = await page.evaluate(
      (selected) => window.__ACTIVATE_APPLIANCE_FOR_EVIDENCE__?.(selected) ?? false,
      kind,
    );
    if (activationStarted) {
      await page.waitForFunction(
        (selected) => {
          const next = window.__THREE_GAME_DIAGNOSTICS__;
          return next?.appliances.find((item) => item.kind === selected)?.state === 'active'
            || next?.activeAnimations === 0;
        },
        kind,
        { timeout: 60_000 },
      );
      continue;
    }

    const candidates = diagnostics.availableClickTargets ?? [];
    const clickTarget = candidates.find((candidate) => candidate.color === appliance?.accent)
      ?? candidates[0]
      ?? diagnostics.clickTarget;
    if (!clickTarget) {
      await page.waitForTimeout(80);
      continue;
    }

    const remainingBefore = diagnostics.remainingArrows;
    const activeConnectionsBefore = diagnostics.activeConnections;
    const activeAnimationsBefore = diagnostics.activeAnimations;
    await page.mouse.click(clickTarget.x, clickTarget.y);
    try {
      await page.waitForFunction(
        ({ remaining, activeConnections, activeAnimations, selected }) => {
          const next = window.__THREE_GAME_DIAGNOSTICS__;
          const target = next?.appliances.find((item) => item.kind === selected);
          return (next?.remainingArrows ?? remaining) < remaining
            || (next?.activeConnections ?? activeConnections) > activeConnections
            || (next?.activeAnimations ?? activeAnimations) > activeAnimations
            || target?.state === 'active';
        },
        {
          remaining: remainingBefore,
          activeConnections: activeConnectionsBefore,
          activeAnimations: activeAnimationsBefore,
          selected: kind,
        },
        { timeout: 10_000 },
      );
    } catch {
      // A software-rendered frame can move a visible target between sampling
      // and click. Continue with fresh authoritative diagnostics instead of
      // treating one stale candidate as an appliance failure.
    }

    try {
      await page.waitForFunction(
        (selected) => {
          const next = window.__THREE_GAME_DIAGNOSTICS__;
          return next?.appliances.find((item) => item.kind === selected)?.state === 'active'
            || next?.activeConnections === 0;
        },
        kind,
        { timeout: 6_000 },
      );
    } catch {
      // A second cable may already be travelling; the next loop observes the
      // authoritative diagnostics and either captures activation or continues.
    }
  }

  throw new Error(`Unable to activate ${kind} in deterministic seed ${seed}`);
}

function sideBySide(leftBuffer: Buffer, rightBuffer: Buffer): Buffer {
  const left = PNG.sync.read(leftBuffer);
  const right = PNG.sync.read(rightBuffer);
  const result = new PNG({ width: left.width + right.width, height: Math.max(left.height, right.height) });
  PNG.bitblt(left, result, 0, 0, left.width, left.height, 0, 0);
  PNG.bitblt(right, result, 0, 0, right.width, right.height, left.width, 0);
  return PNG.sync.write(result);
}

test('proves gallery pool stability and captures fixed-time gallery evidence', async ({ browser }) => {
  test.setTimeout(900_000);
  await mkdir(ARTIFACT_DIR, { recursive: true });

  const gallerySession = await newEvidencePage(browser);
  const galleryPage = gallerySession.page;
  await galleryPage.goto('/?seed=2679418801&mode=random&direct=1');
  await waitForDirectGame(galleryPage, false);
  await galleryPage.click('#appliance-gallery-button');
  await expect(galleryPage.locator('#appliance-gallery')).toHaveAttribute('aria-hidden', 'false');

  const galleryRounds: Array<Record<string, number>> = [];
  const galleryMetrics: Record<string, unknown> = {};
  for (let round = 0; round < 3; round += 1) {
    for (const definition of APPLIANCE_CATALOG) {
      await galleryPage.locator(`[data-appliance-kind="${definition.id}"]`)
        .evaluate((button: HTMLButtonElement) => button.click());
      await galleryPage.waitForFunction(
        (selected) => {
          const diagnostics = window.__APPLIANCE_GALLERY_DIAGNOSTICS__;
          return diagnostics?.selected === selected
            && diagnostics.performanceSessions === 1
            && diagnostics.performanceTimelineOwners === 1
            && Math.abs(diagnostics.performanceElapsed - 4.2) < 0.0001
            && diagnostics.animationSignal > 0
            && diagnostics.drawCalls > 0
            && diagnostics.triangles > 0;
        },
        definition.id,
        { timeout: 10_000 },
      );

      if (round === 1 && EVIDENCE_KINDS.includes(definition.id as typeof EVIDENCE_KINDS[number])) {
        const buffer = await galleryPage.screenshot();
        await writeFile(path.join(ARTIFACT_DIR, `${definition.id}-gallery-4.2.png`), buffer);
        galleryMetrics[definition.id] = await galleryPage.evaluate(
          () => window.__APPLIANCE_GALLERY_DIAGNOSTICS__ ?? null,
        );
      }
    }
    galleryRounds.push(await galleryPage.evaluate(
      () => ({ ...(window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.performanceCapacityByKind ?? {}) }),
    ));
  }

  expect(galleryRounds[1], 'effect pool capacity must not grow after a full 29-model warm pass').toEqual(galleryRounds[0]);
  expect(galleryRounds[2], 'effect pool capacity must remain stable across repeated 29-model switching').toEqual(galleryRounds[0]);
  const orbitBefore = await galleryPage.evaluate(() => window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.orbitAzimuth ?? 0);
  await galleryPage.waitForTimeout(400);
  const orbitAfter = await galleryPage.evaluate(() => window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.orbitAzimuth ?? 0);
  expect(Math.abs(orbitAfter - orbitBefore), 'gallery auto rotation must remain active').toBeGreaterThan(0.001);
  expect(gallerySession.log.consoleErrors).toEqual([]);
  expect(gallerySession.log.pageErrors).toEqual([]);
  const galleryEvidence = {
    rounds: 3,
    modelsPerRound: APPLIANCE_CATALOG.length,
    capacityAfterEachRound: galleryRounds,
    capacityStable: true,
    autoRotateAzimuthBefore: orbitBefore,
    autoRotateAzimuthAfter: orbitAfter,
    metricsAt4_2s: galleryMetrics,
    ...gallerySession.log,
  };
  await galleryPage.close();

  await writeFile(
    path.join(ARTIFACT_DIR, 'gallery-runtime-diagnostics.json'),
    `${JSON.stringify(galleryEvidence, null, 2)}\n`,
    'utf8',
  );
});

for (const kind of EVIDENCE_KINDS) {
  test(`captures fixed-time game evidence for ${kind}`, async ({ browser }) => {
    test.setTimeout(180_000);
    await mkdir(ARTIFACT_DIR, { recursive: true });
    const gameSession = await newEvidencePage(browser);
    const diagnostics = await activateGameAppliance(gameSession.page, kind);
    const buffer = await gameSession.page.screenshot();
    await writeFile(path.join(ARTIFACT_DIR, `${kind}-game-4.2.png`), buffer);
    const gameMetrics = {
      seed: seedContaining(kind),
      target: diagnostics.appliances.find((item) => item.kind === kind),
      performances: diagnostics.performances,
      renderer: diagnostics.renderer,
      context: diagnostics.context,
      ...gameSession.log,
    };
    expect(diagnostics.performances.sessions).toBe(1);
    expect(diagnostics.performances.timelineOwners).toBe(1);
    expect(diagnostics.performances.elapsedByKind[kind]).toBeCloseTo(EVIDENCE_TIME, 6);
    expect(gameSession.log.consoleErrors).toEqual([]);
    expect(gameSession.log.pageErrors).toEqual([]);
    const gallery = await readFile(path.join(ARTIFACT_DIR, `${kind}-gallery-4.2.png`));
    const comparison = sideBySide(buffer, gallery);
    await writeFile(path.join(ARTIFACT_DIR, `${kind}-game-gallery-4.2.png`), comparison);
    await writeFile(
      path.join(ARTIFACT_DIR, `${kind}-game-runtime-diagnostics.json`),
      `${JSON.stringify(gameMetrics, null, 2)}\n`,
      'utf8',
    );
    await gameSession.page.close();
  });
}

test('assembles appliance performance runtime diagnostics', async () => {
  const galleryEvidence = JSON.parse(await readFile(
    path.join(ARTIFACT_DIR, 'gallery-runtime-diagnostics.json'),
    'utf8',
  )) as Record<string, unknown>;
  const gameMetrics: Record<string, unknown> = {};
  for (const kind of EVIDENCE_KINDS) {
    gameMetrics[kind] = JSON.parse(await readFile(
      path.join(ARTIFACT_DIR, `${kind}-game-runtime-diagnostics.json`),
      'utf8',
    )) as Record<string, unknown>;
  }
  const evidence = {
    capturedAt: new Date().toISOString(),
    fixedTimelineSeconds: EVIDENCE_TIME,
    module: 'AppliancePerformanceSystem',
    gallery: galleryEvidence,
    game: gameMetrics,
  };

  await writeFile(
    path.join(ARTIFACT_DIR, 'runtime-diagnostics.json'),
    `${JSON.stringify(evidence, null, 2)}\n`,
    'utf8',
  );
});

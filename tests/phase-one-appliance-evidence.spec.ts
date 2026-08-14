import { expect, test, type Browser, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PNG } from 'pngjs';
import { selectAppliancesForSeed, type ApplianceKind } from '../src/systems/ApplianceCatalog';
import { applianceSeedForPuzzle } from '../src/puzzle/levels';

const PHASE_ONE_TIMES = {
  lamp: 3.3,
  kettle: 2.4,
  radio: 1.65,
  blender: 3.45,
  refrigerator: 3.4,
  'hair-dryer': 4.55,
} as const satisfies Partial<Record<ApplianceKind, number>>;

// Each seed makes the first removable solution arrow use the appliance's
// assigned plug colour. This keeps evidence deterministic and prevents a
// fallback click from activating a different appliance on the way to the
// requested one.
const PHASE_ONE_SEEDS = {
  lamp: 9,
  kettle: 16,
  radio: 4,
  blender: 3,
  refrigerator: 2,
  'hair-dryer': 2,
} as const satisfies Partial<Record<PhaseOneKind, number>>;

const ARTIFACT_DIR = path.resolve('artifacts/phase-one-appliance-evidence');

type PhaseOneKind = keyof typeof PHASE_ONE_TIMES;
type RuntimeLog = { consoleErrors: string[]; pageErrors: string[] };

function seedContaining(kind: ApplianceKind): number {
  const deterministic = PHASE_ONE_SEEDS[kind as PhaseOneKind];
  if (deterministic !== undefined) return deterministic;
  for (let seed = 1; seed < 100_000; seed += 1) {
    if (selectAppliancesForSeed(applianceSeedForPuzzle(seed, 0)).some((definition) => definition.id === kind)) {
      return seed;
    }
  }
  throw new Error(`Unable to find puzzle seed containing ${kind}`);
}

async function evidencePage(browser: Browser, fixedTime: number): Promise<{ page: Page; log: RuntimeLog }> {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const log: RuntimeLog = { consoleErrors: [], pageErrors: [] };
  page.on('console', (message) => {
    if (message.type() === 'error') log.consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => log.pageErrors.push(error.message));
  await page.addInitScript((time) => {
    window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = time;
  }, fixedTime);
  return { page, log };
}

async function waitForDirectGame(page: Page): Promise<void> {
  await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true, null, { timeout: 90_000 });
  if (await page.locator('#start-game-button').isVisible()) await page.click('#start-game-button');
  await page.waitForFunction(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return diagnostics?.sceneVisibility.appliances === true
      && diagnostics.opening.cameraPhase === 'idle'
      && diagnostics.appliances.length > 0
      && diagnostics.clickTarget !== null;
  }, null, { timeout: 60_000 });
}

async function activateGameAppliance(page: Page, kind: PhaseOneKind, fixedTime: number): Promise<ThreeGameDiagnostics> {
  const seed = seedContaining(kind);
  await page.goto(`/?seed=${seed}&mode=random&direct=1`);
  await waitForDirectGame(page);
  await page.waitForFunction(
    (selected) => window.__THREE_GAME_DIAGNOSTICS__?.appliances.some((item) => item.kind === selected),
    kind,
    { timeout: 90_000 },
  );

  const hookActivated = await page.evaluate((selected) =>
    window.__ACTIVATE_APPLIANCE_FOR_EVIDENCE__?.(selected) ?? false, kind);
  if (hookActivated) {
    await page.waitForFunction(
      (selected) => window.__THREE_GAME_DIAGNOSTICS__?.appliances.find((item) => item.kind === selected)?.state === 'active',
      kind,
      { timeout: 60_000 },
    );
    await page.waitForFunction(([selected, expected]) => {
      const next = window.__THREE_GAME_DIAGNOSTICS__;
      return next?.performances.sessions === 1
        && next.performances.timelineOwners === 1
        && Math.abs((next.performances.elapsedByKind[selected as ApplianceKind] ?? -1) - Number(expected)) < 0.0001
        && (next.performances.signalsByKind[selected as ApplianceKind] ?? 0) > 0;
    }, [kind, fixedTime], { timeout: 10_000 });
    return page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__ as ThreeGameDiagnostics);
  }

  for (let attempt = 0; attempt < 48; attempt += 1) {
    const diagnostics = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__ ?? null);
    if (!diagnostics) continue;
    const appliance = diagnostics.appliances.find((item) => item.kind === kind);
    if (appliance?.state === 'connected') {
      await page.waitForFunction(
        (selected) => window.__THREE_GAME_DIAGNOSTICS__?.appliances.find((item) => item.kind === selected)?.state === 'active',
        kind,
        { timeout: 20_000 },
      );
      continue;
    }
    if (appliance?.state === 'active') {
      await page.waitForFunction(([selected, expected]) => {
        const next = window.__THREE_GAME_DIAGNOSTICS__;
        return next?.performances.sessions === 1
          && next.performances.timelineOwners === 1
          && Math.abs((next.performances.elapsedByKind[selected as ApplianceKind] ?? -1) - Number(expected)) < 0.0001
          && (next.performances.signalsByKind[selected as ApplianceKind] ?? 0) > 0;
      }, [kind, fixedTime], { timeout: 10_000 });
      return page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__ as ThreeGameDiagnostics);
    }

    const clickTarget = diagnostics.availableClickTargets?.find((candidate) => candidate.color === appliance?.accent);
    if (!clickTarget) {
      // The target can be occluded by an appliance at the current orbit. Move
      // the shared game camera a small deterministic amount and let
      // refreshAvailability publish a new projected target list. Never fall
      // back to another colour, because that would contaminate this evidence
      // session with a second appliance timeline.
      const canvas = page.locator('canvas').first();
      const box = await canvas.boundingBox();
      if (box) {
        const direction = attempt % 2 === 0 ? 1 : -1;
        const x = box.x + box.width * 0.5;
        const y = box.y + box.height * 0.5;
        await page.mouse.move(x, y);
        await page.mouse.down();
        await page.mouse.move(x + direction * 72, y + (attempt % 4 === 0 ? 18 : -18), { steps: 6 });
        await page.mouse.up();
      }
      await page.waitForTimeout(140);
      continue;
    }
    const remainingBefore = diagnostics.remainingArrows;
    await page.mouse.click(clickTarget.x, clickTarget.y);
    try {
      await page.waitForFunction(
        (remaining) => (window.__THREE_GAME_DIAGNOSTICS__?.remainingArrows ?? remaining) < remaining,
        remainingBefore,
        { timeout: 10_000 },
      );
    } catch {
      // A software-rendered frame can invalidate a projected coordinate while
      // the camera settles. Retry the same target rather than clicking another
      // colour and contaminating the single-appliance evidence session.
      continue;
    }
    try {
      await page.waitForFunction((selected) => {
        const next = window.__THREE_GAME_DIAGNOSTICS__;
        return next?.appliances.find((item) => item.kind === selected)?.state === 'active'
          || next?.activeConnections === 0;
      }, kind, { timeout: 6_000 });
    } catch {
      // A cable may still be travelling; the next attempt reads authoritative diagnostics.
    }
  }
  throw new Error(`Unable to activate ${kind} in deterministic seed ${seed}`);
}

function sideBySide(gameBuffer: Buffer, galleryBuffer: Buffer): Buffer {
  const game = PNG.sync.read(gameBuffer);
  const gallery = PNG.sync.read(galleryBuffer);
  const output = new PNG({ width: game.width + gallery.width, height: Math.max(game.height, gallery.height) });
  PNG.bitblt(game, output, 0, 0, game.width, game.height, 0, 0);
  PNG.bitblt(gallery, output, 0, 0, gallery.width, gallery.height, game.width, 0);
  return PNG.sync.write(output);
}

for (const [kind, fixedTime] of Object.entries(PHASE_ONE_TIMES) as Array<[PhaseOneKind, number]>) {
  test(`captures same-timeline game and gallery evidence for ${kind}`, async ({ browser }) => {
    test.setTimeout(240_000);
    await mkdir(ARTIFACT_DIR, { recursive: true });

    const gameSession = await evidencePage(browser, fixedTime);
    const gameDiagnostics = await activateGameAppliance(gameSession.page, kind, fixedTime);
    const gameBuffer = await gameSession.page.screenshot();

    // The live page owns a separate gallery performance instance. Reusing it
    // avoids a second expensive random-level build while still proving that
    // game and gallery import the same model, mechanics and fixed timeline.
    const gallerySession = gameSession;
    await gallerySession.page.click('#appliance-gallery-button');
    await gallerySession.page.locator(`[data-appliance-kind="${kind}"]`).evaluate((button: HTMLButtonElement) => button.click());
    await gallerySession.page.waitForFunction(([selected, expected]) => {
      const diagnostics = window.__APPLIANCE_GALLERY_DIAGNOSTICS__;
      return diagnostics?.selected === selected
        && diagnostics.performanceSessions === 1
        && diagnostics.performanceTimelineOwners === 1
        && Math.abs(diagnostics.performanceElapsed - Number(expected)) < 0.0001
        && diagnostics.animationSignal > 0;
    }, [kind, fixedTime], { timeout: 12_000 });
    const orbitBefore = await gallerySession.page.evaluate(() => window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.orbitAzimuth ?? 0);
    await gallerySession.page.waitForTimeout(350);
    const orbitAfter = await gallerySession.page.evaluate(() => window.__APPLIANCE_GALLERY_DIAGNOSTICS__?.orbitAzimuth ?? 0);
    const galleryDiagnostics = await gallerySession.page.evaluate(() => window.__APPLIANCE_GALLERY_DIAGNOSTICS__ ?? null);
    const galleryBuffer = await gallerySession.page.screenshot();
    await gameSession.page.close();

    await Promise.all([
      writeFile(path.join(ARTIFACT_DIR, `${kind}-${fixedTime}-game.png`), gameBuffer),
      writeFile(path.join(ARTIFACT_DIR, `${kind}-${fixedTime}-gallery.png`), galleryBuffer),
      writeFile(path.join(ARTIFACT_DIR, `${kind}-${fixedTime}-game-gallery.png`), sideBySide(gameBuffer, galleryBuffer)),
      writeFile(path.join(ARTIFACT_DIR, `${kind}-${fixedTime}-runtime.json`), `${JSON.stringify({
        kind,
        fixedTimelineSeconds: fixedTime,
        sharedModule: 'AppliancePerformanceSystem',
        game: gameDiagnostics.performances,
        gallery: galleryDiagnostics,
        galleryAutoRotate: { before: orbitBefore, after: orbitAfter },
        consoleErrors: gameSession.log.consoleErrors,
        pageErrors: gameSession.log.pageErrors,
      }, null, 2)}\n`, 'utf8'),
    ]);

    expect(gameDiagnostics.performances.sessions).toBe(1);
    expect(gameDiagnostics.performances.timelineOwners).toBe(1);
    expect(gameDiagnostics.performances.elapsedByKind[kind]).toBeCloseTo(fixedTime, 6);
    expect(galleryDiagnostics?.performanceSessions).toBe(1);
    expect(galleryDiagnostics?.performanceTimelineOwners).toBe(1);
    expect(galleryDiagnostics?.performanceElapsed).toBeCloseTo(fixedTime, 6);
    expect(Math.abs(orbitAfter - orbitBefore), 'gallery auto rotation must remain active during the shared performance').toBeGreaterThan(0.001);
    expect(gameSession.log.consoleErrors).toEqual([]);
    expect(gameSession.log.pageErrors).toEqual([]);
  });
}

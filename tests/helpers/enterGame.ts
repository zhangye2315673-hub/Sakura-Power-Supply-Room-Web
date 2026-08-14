import type { Page } from '@playwright/test';

export async function enterPreparedGame(page: Page): Promise<void> {
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true,
    null,
    { timeout: 90_000 },
  );
  if (await page.locator('#start-game-button').isVisible()) {
    await page.click('#start-game-button');
  }
  await page.waitForFunction(
    () => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      return diagnostics?.sceneVisibility.appliances === true
        && diagnostics.appliances.length > 0
        && diagnostics.opening.active === false
        && ((diagnostics.availableClickTargets?.length ?? 0) > 0
          || diagnostics.clickTarget !== null);
    },
    null,
    { timeout: 150_000 },
  );
}

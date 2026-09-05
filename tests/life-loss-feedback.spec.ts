import { expect, test } from '@playwright/test';

const HUD_FIXTURE = `
  <main id="app">
    <b id="remaining-value">3</b><b id="total-value">3</b><i id="progress-fill"></i>
    <div id="status-line"></div><div id="seed-label"></div><div id="toast"></div>
    <section id="complete-panel"></section><section id="game-over-panel"></section>
    <section id="random-lives"><span class="life-label">LIVES</span><div><i>♥</i><i>♥</i><i>♥</i></div></section>
    <button id="hint-button"><span class="life-label">提示</span><span class="hint-icons"><i></i><i></i><i></i></span></button>
    <button id="reset-button"></button><button id="new-button"></button>
    <button id="continue-button"></button><button id="complete-home-button"></button>
    <button id="appliance-gallery-button"></button><button id="home-button"></button>
    <button id="language-button"></button><button id="retry-random-button"></button>
    <button id="game-over-new-button"></button>
    <section id="puzzle-loader"><span id="puzzle-loader-label"></span><span id="puzzle-loader-percent"></span><i class="plug-loader"></i></section>
  </main>
`;

test('每次掉血都会生成醒目的大号提示、爱心碎裂和全屏冲击反馈', async ({ page }, testInfo) => {
  await page.goto('/src/styles.css');
  await page.setContent(`<link rel="stylesheet" href="/src/styles.css">${HUD_FIXTURE}`);

  const first = await page.evaluate(async () => {
    const moduleUrl = '/src/systems/' + 'Hud.ts';
    const { Hud } = await import(moduleUrl);
    const hud = new Hud();
    hud.setRandomLives(true, 2, 3);
    hud.showLifeLost(2);
    Reflect.set(window, '__HUD_LIFE_LOSS_TEST__', hud);
    const toast = document.querySelector<HTMLElement>('#toast')!;
    return {
      ghosts: document.querySelectorAll('.life-loss-ghost').length,
      shards: document.querySelectorAll('.life-loss-shard').length,
      readouts: document.querySelectorAll('.life-loss-readout').length,
      vignettes: document.querySelectorAll('.life-loss-vignette').length,
      toastClass: toast.className,
      toastFontSize: Number.parseFloat(getComputedStyle(toast).fontSize),
      activation: document.querySelector<HTMLElement>('#random-lives')?.dataset.lifeLossActivation,
    };
  });

  expect(first.ghosts).toBe(1);
  expect(first.shards).toBeGreaterThanOrEqual(8);
  expect(first.readouts).toBe(1);
  expect(first.vignettes).toBe(1);
  expect(first.toastClass).toContain('life-loss');
  expect(first.toastFontSize).toBeGreaterThanOrEqual(18);
  expect(first.activation).toBe('1');
  await page.screenshot({ path: testInfo.outputPath('life-loss-feedback.png') });

  const second = await page.evaluate(() => {
    const hud = Reflect.get(window, '__HUD_LIFE_LOSS_TEST__') as { setRandomLives: (visible: boolean, lives: number, max: number) => void; showLifeLost: (lives: number) => void };
    hud.setRandomLives(true, 1, 3);
    hud.showLifeLost(1);
    return {
      ghosts: document.querySelectorAll('.life-loss-ghost').length,
      readouts: document.querySelectorAll('.life-loss-readout').length,
      activation: document.querySelector<HTMLElement>('#random-lives')?.dataset.lifeLossActivation,
      newlyLost: document.querySelectorAll('#random-lives i.life-lost-now').length,
    };
  });

  expect(second.ghosts).toBe(1);
  expect(second.readouts).toBe(1);
  expect(second.activation).toBe('2');
  expect(second.newlyLost).toBe(1);
});

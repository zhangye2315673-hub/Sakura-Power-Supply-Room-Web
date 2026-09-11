import { expect, test, type Page } from '@playwright/test';
import type { AudioManager } from '../src/audio/AudioManager';

type AudioTestWindow = Window & { audioTest: AudioManager };

async function prepareAudio(page: Page): Promise<void> {
  await page.route('**/src/main.ts', route => route.fulfill({
    contentType: 'application/javascript',
    body: "import { AudioManager } from '/src/audio/AudioManager.ts'; window.audioTest = new AudioManager();",
  }));
  await page.goto('/');
  await page.waitForFunction(() => Boolean((window as unknown as AudioTestWindow).audioTest));
  await page.mouse.click(8, 8);
  await expect.poll(() => page.evaluate(() => (window as unknown as AudioTestWindow).audioTest.unlocked)).toBe(true);
}

test('visual appliances create no audio bus or per-appliance voices', async ({ page }) => {
  await prepareAudio(page);
  const result = await page.evaluate(() => {
    const audio = (window as unknown as AudioTestWindow).audioTest;
    const before = audio.getDiagnostics().activeNodes;
    for (let frame = 0; frame < 1000; frame += 1) audio.update(1);
    return { before, after: audio.getDiagnostics() };
  });
  expect(result.after.applianceAudioEnabled).toBe(false);
  expect(result.after.activeAppliances).toEqual([]);
  expect(Object.keys(result.after.buses).sort()).toEqual(['ambient', 'interaction', 'master']);
  expect(result.after.activeNodes).toBe(result.before);
});

test('rapid input is coalesced, bounded, and completion retains priority', async ({ page }) => {
  await prepareAudio(page);
  const result = await page.evaluate(() => {
    const audio = (window as unknown as AudioTestWindow).audioTest;
    const baseline = audio.getDiagnostics().activeNodes;
    for (let index = 0; index < 100; index += 1) audio.playInteraction('blocked');
    const repeat = audio.getDiagnostics();
    audio.playInteraction('confirm');
    audio.playInteraction('cable-success');
    audio.playInteraction('button');
    audio.playInteraction('cable-grab');
    const mixed = audio.getDiagnostics();
    audio.playInteraction('complete');
    return { baseline, repeat, mixed, complete: audio.getDiagnostics() };
  });
  expect(result.repeat.interactionVoices).toBe(1);
  expect(result.repeat.droppedInteractions).toBe(99);
  expect(result.mixed.interactionVoices).toBe(8);
  expect(result.mixed.droppedInteractions).toBe(100);
  expect(result.complete.interactionVoices).toBe(4);
  await expect.poll(() => page.evaluate(() => (window as unknown as AudioTestWindow).audioTest.getDiagnostics().activeNodes)).toBe(result.baseline);
});

test('mute clears queued feedback and persists without disabling visual state', async ({ page }) => {
  await prepareAudio(page);
  const state = await page.evaluate(() => {
    const audio = (window as unknown as AudioTestWindow).audioTest;
    audio.playInteraction('cable-success');
    audio.setMuted(true, true);
    audio.playInteraction('button');
    return { diagnostics: audio.getDiagnostics(), saved: localStorage.getItem('sakura.audioMuted') };
  });
  expect(state.diagnostics.muted).toBe(true);
  expect(state.diagnostics.interactionVoices).toBe(0);
  expect(state.saved).toBe('true');
  await page.evaluate(() => (window as unknown as AudioTestWindow).audioTest.setMuted(false));
  await page.evaluate(() => (window as unknown as AudioTestWindow).audioTest.playInteraction('button'));
  expect(await page.evaluate(() => (window as unknown as AudioTestWindow).audioTest.getDiagnostics().interactionVoices)).toBe(2);
});

test('music still plays and fades between home and gameplay', async ({ page }) => {
  test.setTimeout(30_000);
  await prepareAudio(page);
  await page.evaluate(() => (window as unknown as AudioTestWindow).audioTest.setMusicProfile('main'));
  await expect.poll(() => page.evaluate(() => (window as unknown as AudioTestWindow).audioTest.getDiagnostics().music.playing.some(track => track.profile === 'main' && track.currentTime > 0 && track.volume > 0))).toBe(true);
  await page.evaluate(() => (window as unknown as AudioTestWindow).audioTest.setMusicProfile('gameplay'));
  await expect.poll(() => page.evaluate(() => (window as unknown as AudioTestWindow).audioTest.getDiagnostics().music.playing.map(track => track.profile))).toEqual(['gameplay']);
  await page.evaluate(() => (window as unknown as AudioTestWindow).audioTest.dispose());
  const disposed = await page.evaluate(() => (window as unknown as AudioTestWindow).audioTest.getDiagnostics());
  expect(disposed.activeNodes).toBe(0);
  expect(disposed.music.playing).toEqual([]);
});

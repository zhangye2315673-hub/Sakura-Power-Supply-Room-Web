import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { BubbleShieldPresentation } from '../src/skill/BubbleShieldPresentation';
import { SoundWaveShieldPresentation } from '../src/skill/SoundWaveShieldPresentation';

test('虹膜泡泡激活后立即恢复包裹线组的可见球面', () => {
  const target = new THREE.Mesh(
    new THREE.BoxGeometry(2, 1.4, 1.1),
    new THREE.MeshBasicMaterial(),
  );
  target.position.set(0.7, -0.2, 0.4);
  const shield = new BubbleShieldPresentation();

  shield.sync(true, [target]);
  shield.update(0.1, 1.2, { yaw: 0, pitch: 0 });

  expect(shield.diagnostics.active).toBe(true);
  expect(shield.diagnostics.visible).toBe(true);
  expect(shield.diagnostics.targetCount).toBe(1);
  expect(shield.diagnostics.radius).toBeGreaterThan(1.25);
  expect(shield.diagnostics.opacity).toBeGreaterThan(0);

  shield.dispose();
  target.geometry.dispose();
  (target.material as THREE.Material).dispose();
});

test('同一局第二次触发泡泡机时重新播放虹膜护罩入场，而不是沿用第一次的静止状态', () => {
  const target = new THREE.Mesh(
    new THREE.BoxGeometry(2, 1.4, 1.1),
    new THREE.MeshBasicMaterial(),
  );
  const shield = new BubbleShieldPresentation();

  shield.sync(true, [target]);
  shield.retrigger();
  shield.update(0.5, 1.5, { yaw: 0, pitch: 0 });
  const first = shield.diagnostics;

  shield.retrigger();
  const restarted = shield.diagnostics;
  shield.sync(true, [target]);
  shield.update(0.08, 1.58, { yaw: 0, pitch: 0 });
  const second = shield.diagnostics;

  expect(first.activationCount).toBe(1);
  expect(first.opacity).toBeGreaterThan(0.8);
  expect(restarted.activationCount).toBe(2);
  expect(restarted.visible).toBe(true);
  expect(restarted.opacity).toBeLessThan(first.opacity * 0.5);
  expect(second.active).toBe(true);
  expect(second.visible).toBe(true);
  expect(second.activationPulse).toBeGreaterThan(0);
  expect(second.targetCount).toBe(1);

  shield.dispose();
  target.geometry.dispose();
  (target.material as THREE.Material).dispose();
});

test('第二次虹膜入场在真实 WebGL 材质中仍能编译并产生可见像素', async ({ page }) => {
  await page.goto('/src/styles.css');
  const result = await page.evaluate(async () => {
    const threeModuleUrl = '/node_modules/three/build/' + 'three.module.js';
    const shieldModuleUrl = '/src/skill/' + 'BubbleShieldPresentation.ts';
    const THREE_BROWSER = await import(threeModuleUrl);
    const { BubbleShieldPresentation: BrowserBubbleShield } = await import(shieldModuleUrl);
    const renderer = new THREE_BROWSER.WebGLRenderer({ antialias: false });
    renderer.setSize(320, 240, false);
    renderer.setClearColor(0x101018, 1);
    const renderTarget = new THREE_BROWSER.WebGLRenderTarget(320, 240);
    const scene = new THREE_BROWSER.Scene();
    const camera = new THREE_BROWSER.PerspectiveCamera(36, 320 / 240, 0.1, 30);
    camera.position.set(0, 0, 5.4);
    camera.lookAt(0, 0, 0);
    scene.add(new THREE_BROWSER.AmbientLight(0xffffff, 1.8));
    const target = new THREE_BROWSER.Mesh(
      new THREE_BROWSER.BoxGeometry(2, 1.4, 1.1),
      new THREE_BROWSER.MeshBasicMaterial(),
    );
    const shield = new BrowserBubbleShield();
    scene.add(shield.root);
    shield.sync(true, [target]);
    shield.retrigger();
    shield.update(0.5, 1.5, { yaw: 0, pitch: 0 });
    shield.retrigger();
    shield.sync(true, [target]);
    shield.update(0.08, 1.58, { yaw: 0, pitch: 0 });
    renderer.setRenderTarget(renderTarget);
    renderer.render(scene, camera);
    const pixels = new Uint8Array(320 * 240 * 4);
    renderer.readRenderTargetPixels(renderTarget, 0, 0, 320, 240, pixels);
    let changedPixels = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      if (Math.abs(pixels[index] - 16) + Math.abs(pixels[index + 1] - 16) + Math.abs(pixels[index + 2] - 24) > 12) {
        changedPixels += 1;
      }
    }
    const diagnostics = shield.diagnostics;
    shield.dispose();
    target.geometry.dispose();
    target.material.dispose();
    renderTarget.dispose();
    renderer.dispose();
    return { changedPixels, diagnostics };
  });

  expect(result.diagnostics.activationCount).toBe(2);
  expect(result.diagnostics.visible).toBe(true);
  expect(result.changedPixels).toBeGreaterThan(250);
});

test('感召护盾抵挡后保留一次冲击波，不被 buff 消费后的同步立即隐藏', () => {
  const target = new THREE.Mesh(
    new THREE.BoxGeometry(2, 1.4, 1.1),
    new THREE.MeshBasicMaterial(),
  );
  const shield = new SoundWaveShieldPresentation();
  shield.sync(true, [target]);
  const now = performance.now() / 1000;
  shield.update(0.05, now + 0.05);
  shield.playImpact(new THREE.Vector3(1, 0, 0));
  shield.sync(false, [target]);

  expect(shield.diagnostics.protected).toBe(false);
  expect(shield.diagnostics.phase).toBe('impact');
  expect(shield.diagnostics.visible).toBe(true);
  expect(shield.diagnostics.impactCount).toBe(1);

  shield.dispose();
  target.geometry.dispose();
  (target.material as THREE.Material).dispose();
});

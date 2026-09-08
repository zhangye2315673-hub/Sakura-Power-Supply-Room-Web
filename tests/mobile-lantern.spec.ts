import { test, expect } from '@playwright/test';

test('mobile exploration lantern remains at the last touch after release', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  try {
    await page.route('**/src/main.ts*', route => route.fulfill({ contentType: 'application/javascript', body: `
      import * as THREE from '/node_modules/three/build/three.module.js';
      import { NightEnvironment } from '/src/theme/NightEnvironment.ts';
      document.body.innerHTML = '<canvas id="game-canvas" style="width:375px;height:812px;position:fixed;inset:0;touch-action:none"></canvas>';
      const sky = { setThemeProgress(){}, setExplorationProgress(){}, updateTheme(){} };
      const lights = { sun:new THREE.DirectionalLight(), fill:new THREE.DirectionalLight(), bounce:new THREE.DirectionalLight(), hemi:new THREE.HemisphereLight() };
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(); camera.position.z = 15;
      const night = new NightEnvironment(document.querySelector('canvas'), scene, camera, sky, lights);
      night.setThemeProgress(1); night.setExplorationProgress(1);
      let elapsed = 0;
      window.readLantern = () => { for(let i=0;i<120;i++){ elapsed+=1/60; night.update(1/60,elapsed,{opening:false,galleryOpen:false}); } return night.lantern; };
    ` }));
    await page.goto('/');
    const initial = await page.evaluate(() => (window as any).readLantern());
    expect(initial.intensity).toBeGreaterThan(0.95);
    expect(initial.position).toEqual([0,0]);
    await page.touchscreen.tap(180, 400);
    const result = await page.evaluate(() => (window as any).readLantern());
    expect(result.returning).toBe(false);
    expect(result.intensity).toBeGreaterThan(0.95);
    expect(result.position[0]).toBeCloseTo(result.target[0], 3);
    expect(result.position[1]).toBeCloseTo(result.target[1], 3);
  } finally { await context.close(); }
});

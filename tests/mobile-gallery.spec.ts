import { expect, test } from '@playwright/test';
import type { Mesh, Object3D, Material } from 'three';

test('gallery keeps mobile exit visible and centers every appliance after resize', async ({ page }) => {
  await page.route('**/src/main.ts*', route => route.fulfill({
    contentType: 'application/javascript',
    body: `import '/src/styles.css';
      import { ApplianceGallery } from '/src/systems/ApplianceGallery.ts';
      import { ThemeController } from '/src/theme/ThemeController.ts';
      import { AudioManager } from '/src/audio/AudioManager.ts';
      document.documentElement.classList.remove('opening-active');
      document.documentElement.classList.add('app-ready');
      document.querySelector('#start-screen').hidden = true;
      window.gallery = new ApplianceGallery(new ThemeController(), new AudioManager());
      window.gallery.show();`,
  }));
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  const gallery = page.locator('#appliance-gallery');
  const close = page.getByRole('button', { name: '退出家电图鉴' });
  await expect(gallery).toBeVisible();
  await page.evaluate(() => cancelAnimationFrame((window as any).gallery.frameId));
  for (const height of [812, 667]) {
    await page.setViewportSize({ width: 375, height });
    await expect(close).toBeInViewport();
    const closeBounds = await close.boundingBox();
    expect(closeBounds!.height).toBeGreaterThanOrEqual(44);
    const stage = await page.locator('.appliance-gallery-stage').boundingBox();
    expect(stage!.height).toBeGreaterThan(350);
    expect(closeBounds!.y + closeBounds!.height).toBeLessThanOrEqual(stage!.y);
    for (const kind of ['washer', 'refrigerator', 'radio', 'robot-vacuum', 'lamp', 'desktop-computer', 'bubble-machine', 'gumball-machine']) {
      await page.locator(`[data-appliance-kind="${kind}"]`).click();
      const centered = await page.evaluate(() => {
        const current = (window as any).gallery;
        const bounds = current.previewBounds.clone().makeEmpty();
        current.scene.updateMatrixWorld(true);
        current.current.root.traverseVisible((object: Object3D) => {
          const mesh = object as Mesh;
          if (!mesh.isMesh) return;
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          if (!materials.some((material: Material) => material.visible && material.opacity > 0)) return;
          mesh.geometry.computeBoundingBox();
          bounds.union(mesh.geometry.boundingBox!.clone().applyMatrix4(mesh.matrixWorld));
        });
        const center = bounds.getCenter(current.modelStage.position.clone());
        return center.distanceTo(current.controls.target);
      });
      expect(centered).toBeLessThan(0.001);
      const view = await page.evaluate(() => {
        const current = (window as any).gallery;
        const distance = current.camera.position.distanceTo(current.controls.target);
        const result = { distance, min: current.controls.minDistance, max: current.controls.maxDistance, fog: current.scene.fog };
        for (const multiplier of [0.01, 100]) {
          current.camera.position.sub(current.controls.target).multiplyScalar(multiplier).add(current.controls.target);
          current.controls.update();
          const clamped = current.camera.position.distanceTo(current.controls.target);
          if (clamped < result.min - 0.001 || clamped > result.max + 0.001) throw new Error('Zoom escaped limits');
        }
        current.resetView();
        current.renderer.render(current.scene, current.camera);
        return result;
      });
      expect(view.fog).toBeNull();
      expect(view.distance).toBeGreaterThan(view.min);
      expect(view.distance).toBeLessThan(view.max);
      if (['desktop-computer', 'bubble-machine', 'gumball-machine'].includes(kind)) {
        await page.screenshot({ path: `artifacts/mobile-gallery-20260907/${kind}-${height}.png` });
      }
    }
    await page.locator('[data-appliance-kind="washer"]').click();
    await page.evaluate(() => {
      const current = (window as any).gallery;
      current.renderer.render(current.scene, current.camera);
    });
    await page.screenshot({ path: `artifacts/mobile-gallery-20260907/washer-${height}.png` });
  }
  await close.click();
  await expect(gallery).toBeHidden();
});

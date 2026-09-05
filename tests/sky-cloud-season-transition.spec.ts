import { expect, test } from '@playwright/test';
import type * as THREE_TYPES from 'three';

test('季节切换只改变云朵目标速度，不会重算历史位移造成瞬移', async ({ page }) => {
  await page.goto('/?theme=day');
  const result = await page.evaluate(async () => {
    // Keep these browser-only module URLs out of TypeScript's filesystem
    // resolver. Vite resolves them at runtime, while `tsc` should type-check
    // the test without treating `/src/...` as a local absolute path.
    const threeModuleUrl = '/node_modules/three/build/three.module.js';
    const skyModuleUrl = '/src/style/sky.ts';
    const THREE = await import(threeModuleUrl);
    const { buildSky } = await import(skyModuleUrl);
    const scene = new THREE.Scene();
    const sky = buildSky(scene);
    const cameraPosition = new THREE.Vector3();
    const cameraQuaternion = new THREE.Quaternion();
    sky.setSeasonWeights({ spring: 1, summer: 0, autumn: 0, winter: 0 });
    sky.update(cameraPosition, cameraQuaternion, 10, 0.016);
    const before: number[] = sky.clouds.children.map((cloud: THREE_TYPES.Object3D) => cloud.position.x);
    sky.setSeasonWeights({ spring: 0, summer: 1, autumn: 0, winter: 0 });
    sky.update(cameraPosition, cameraQuaternion, 10.016, 0.016);
    const after: number[] = sky.clouds.children.map((cloud: THREE_TYPES.Object3D) => cloud.position.x);
    const maxDelta = Math.max(...before.map((value: number, index: number) => Math.abs(after[index] - value)));
    sky.dispose();
    return { maxDelta };
  });
  expect(result.maxDelta).toBeLessThan(0.2);
});

test('云朵纹理不带会在主页中央形成椭圆光斑的底形', async ({ page }) => {
  await page.goto('/?theme=day');
  const alpha = await page.evaluate(async () => {
    const threeModuleUrl = '/node_modules/three/build/three.module.js';
    const skyModuleUrl = '/src/style/sky.ts';
    const THREE = await import(threeModuleUrl);
    const { buildSky } = await import(skyModuleUrl);
    const scene = new THREE.Scene();
    const sky = buildSky(scene);
    const front = sky.clouds.children[0].children[1] as import('three').Mesh;
    const texture = (front.material as import('three').MeshBasicMaterial).map;
    const canvas = texture?.image as HTMLCanvasElement;
    const context = canvas.getContext('2d');
    const sample = context?.getImageData(128, 104, 1, 1).data[3] ?? 255;
    sky.dispose();
    return sample;
  });
  expect(alpha).toBeLessThan(8);
});

test('云朵纹理边缘使用连续羽化，不出现硬切圆团', async ({ page }) => {
  await page.goto('/?theme=day');
  const maximumAlphaJump = await page.evaluate(async () => {
    const threeModuleUrl = '/node_modules/three/build/three.module.js';
    const skyModuleUrl = '/src/style/sky.ts';
    const THREE = await import(threeModuleUrl);
    const { buildSky } = await import(skyModuleUrl);
    const scene = new THREE.Scene();
    const sky = buildSky(scene);
    const front = sky.clouds.children[0].children[1] as import('three').Mesh;
    const canvas = (front.material as import('three').MeshBasicMaterial).map?.image as HTMLCanvasElement;
    const pixels = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
    let maximum = 0;
    for (let y = 0; y < canvas.height; y += 1) {
      for (let x = 0; x < canvas.width; x += 1) {
        const index = (y * canvas.width + x) * 4 + 3;
        if (x + 1 < canvas.width) maximum = Math.max(maximum, Math.abs(pixels[index] - pixels[index + 4]));
        if (y + 1 < canvas.height) maximum = Math.max(maximum, Math.abs(pixels[index] - pixels[index + canvas.width * 4]));
      }
    }
    sky.dispose();
    return maximum;
  });
  expect(maximumAlphaJump).toBeLessThan(48);
});

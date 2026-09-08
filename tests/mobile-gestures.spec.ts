import { expect, test } from '@playwright/test';

for (const lantern of [false, true]) test(`touch gestures keep clicks separate with lantern=${lantern}`,  async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  try {
    await page.route('**/src/main.ts*', route => route.fulfill({ contentType: 'application/javascript', body: `
      import { PerspectiveCamera } from '/node_modules/three/build/three.module.js';
      import { OrbitController } from '/src/systems/OrbitController.ts';
      document.body.innerHTML = '<canvas style="width:375px;height:812px;touch-action:none;position:fixed;inset:0"></canvas>';
      const canvas = document.querySelector('canvas');
      let clicks = 0;
      const orbit = new OrbitController(canvas, new PerspectiveCamera(), { onClick: () => { clicks++; }, onHover: () => {}, onLeave: () => {}, onViewChanged: () => {} });
      orbit.setTouchLantern(${lantern});
      window.readGesture = () => ({ ...orbit.getState(), clicks });
    ` }));
    await page.goto('/');
    const read = () => page.evaluate(() => (window as unknown as { readGesture: () => { radius: number; yaw: number; clicks: number } }).readGesture());
    const client = await context.newCDPSession(page);
    const initial = await read();
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 130, y: 400, id: 1 }, { x: 240, y: 400, id: 2 }] });
    await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 90, y: 400, id: 1 }, { x: 280, y: 400, id: 2 }] });
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    expect((await read()).radius).toBeLessThan(initial.radius);
    expect((await read()).clicks).toBe(0);
    await page.touchscreen.tap(180, 400);
    expect((await read()).clicks).toBe(1);
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 150, y: 400, id: 1 }] });
    await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 220, y: 400, id: 1 }] });
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    if (lantern) expect((await read()).yaw).toBe(initial.yaw);
    else expect((await read()).yaw).not.toBe(initial.yaw);
    expect((await read()).clicks).toBe(1);
    await page.touchscreen.tap(180, 400);
    expect((await read()).clicks).toBe(2);
    if (lantern) {
      await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 110, y: 400, id: 1 }, { x: 220, y: 400, id: 2 }] });
      await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 160, y: 440, id: 1 }, { x: 270, y: 440, id: 2 }] });
      await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      expect((await read()).yaw).not.toBe(initial.yaw);
      expect((await read()).clicks).toBe(2);
    }
  } finally {
    await context.close();
  }
});

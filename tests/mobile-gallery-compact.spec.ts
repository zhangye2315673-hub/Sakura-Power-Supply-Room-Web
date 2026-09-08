import { test, expect } from '@playwright/test';
test('phone gallery keeps actions together and controls compact',async({page})=>{
  await page.route('**/src/main.ts*',route=>route.fulfill({contentType:'application/javascript',body:`
    import '/src/styles.css';
    import { ApplianceGallery } from '/src/systems/ApplianceGallery.ts';
    import { ThemeController } from '/src/theme/ThemeController.ts';
    import { AudioManager } from '/src/audio/AudioManager.ts';
    document.documentElement.classList.remove('opening-active'); document.documentElement.classList.add('app-ready'); document.querySelector('#start-screen').hidden=true;
    window.gallery=new ApplianceGallery(new ThemeController(),new AudioManager()); window.gallery.show();
  `}));
  await page.setViewportSize({width:375,height:812}); await page.goto('/');
  await expect(page.locator('#appliance-gallery')).toBeVisible();
  for(const height of [812,667]){
    await page.setViewportSize({width:375,height});
    const buttons=await page.locator('.appliance-gallery-header nav button').all();
    const boxes=await Promise.all(buttons.map(b=>b.boundingBox()));
    expect(Math.max(...boxes.map(b=>b!.y))-Math.min(...boxes.map(b=>b!.y))).toBeLessThan(2);
    const titleBounds=await page.locator('.appliance-gallery-header strong').boundingBox();
    expect(Math.abs(boxes[0]!.y-titleBounds!.y)).toBeLessThan(22);
    expect(boxes[0]!.x).toBeGreaterThan(titleBounds!.x+titleBounds!.width);
    const panel=page.locator('.jelly-dynamics-panel');
    expect((await panel.boundingBox())!.height).toBeLessThan(80);
    await expect(panel.getByRole('slider')).toHaveCount(3);
    await expect(panel.locator('.jelly-dynamics-actions')).toBeHidden();
    await page.screenshot({path:`artifacts/mobile-gallery-compact-${height}.png`});
  }
  const slider=page.getByRole('slider',{name:'Q弹程度'}); await slider.fill('55');
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sakura-jelly-dynamics-v1')||'{}').damping)).toBe(5.699999999999999);
});


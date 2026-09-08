import { test, expect } from '@playwright/test';

test('jelly panel applies controls, nudges, saves and restores after reload', async ({ page }) => {
  await page.route('**/src/main.ts*', route => route.fulfill({ contentType: 'application/javascript', body: `
    import { createJellyDynamicsPanel } from '/src/systems/JellyDynamicsPanel.ts';
    let nudges = 0;
    document.body.replaceChildren(createJellyDynamicsPanel(()=>nudges++));
    window.readJelly = () => ({ nudges });
  ` }));
  await page.goto('/');
  await expect(page.getByRole('slider')).toHaveCount(3);
  const damping = page.getByRole('slider', {name:'Q弹程度'});
  await damping.fill('80');
  await expect(damping).toHaveValue('80');
  await page.getByRole('button',{name:'轻推一下'}).click();
  expect(await page.evaluate(()=>(window as any).readJelly().nudges)).toBe(1);
  await page.getByRole('button',{name:'保存手感'}).click();
  await expect(page.locator('p[role=status]')).toContainText('已保存');
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('sakura-jelly-dynamics-v1')!).damping)).toBeCloseTo(4.2);
  await page.reload();
  await expect(damping).toHaveValue('80');
  await page.getByRole('button',{name:'恢复默认'}).click();
  await expect(damping).toHaveValue('65');
});

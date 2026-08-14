import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5190';
const output = path.resolve('references/skill-presentations/review');
const skills = ['radio', 'rice-cooker', 'robot-vacuum'];
const viewports = [
  { id: 'desktop', width: 1440, height: 900 },
  { id: 'mobile', width: 390, height: 844 },
];

await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });

for (const viewport of viewports) {
  for (const skill of skills) {
    const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(`${baseUrl}/skill-presentation-review.html?skill=${skill}`);
    await page.waitForFunction(() => window.__SKILL_REVIEW_READY__ === true);
    await page.waitForTimeout(120);
    const suffix = viewport.id === 'desktop' ? '' : `-${viewport.id}`;
    await page.screenshot({ path: path.join(output, `${skill}${suffix}.png`), fullPage: true });
    await page.locator('.skill-world-overlay').evaluate((element) => { element.style.display = 'none'; });
    await page.locator('canvas').screenshot({ path: path.join(output, `${skill}${suffix}-canvas.png`) });
    if (errors.length > 0) throw new Error(`${skill} ${viewport.id}: ${errors.join('\n')}`);
    await page.close();
  }
}

await browser.close();
console.log(`Captured ${skills.length * viewports.length * 2} skill presentation frames in ${output}`);

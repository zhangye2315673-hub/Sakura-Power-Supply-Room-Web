import { chromium } from '@playwright/test';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const root = 'http://127.0.0.1:5190';
const out = 'node_modules/.cache/arrow-cube/stage2-ui';
await mkdir(out, {recursive:true});
// Exercise the real UI modules and CSS without constructing Game or a WebGL renderer.
const localeModule = (await (await fetch(root+'/src/systems/CampaignUi.ts')).text()).match(/from "([^"]*Locale[^"]*)"/)[1];
const html = (await readFile('index.html','utf8')).replace('<script type="module" src="/src/main.ts"></script>', `<script type="module">
import '/src/styles.css';
import { CampaignUi } from '/src/systems/CampaignUi.ts';
import { CampaignProgress } from '/src/game/CampaignProgress.ts';
import { CAMPAIGN_LEVELS } from '/src/puzzle/levels.ts';
import { Hud } from '/src/systems/Hud.ts';
import { StartScreen } from '/src/systems/StartScreen.ts';
import { toggleLocale, applyStaticTranslations } from '${localeModule}';
const progress = new CampaignProgress(8);
window.hud = new Hud();
window.ui = new CampaignUi(progress,CAMPAIGN_LEVELS,id=>{window.selected=id;window.ui.setCurrent(id);window.ui.revealGoal();},()=>window.retried=true);
window.start = new StartScreen({onStart:()=>{},onCampaign:()=>window.ui.show(),campaignStartLabel:()=> '继续战役',onRandom:()=>{},onExplore:()=>{},onRush:()=>{},onDoubleEnded:()=>{},onSkill:()=>{}});
window.start.markReady();
window.finish = id=>{const result={timeMs:65000,mistakes:1,stars:2}; window.hud.showComplete(result,result);window.ui.complete(id,progress.record(id,result));};
window.locale=()=>{toggleLocale();applyStaticTranslations();window.start.refreshLocale();window.hud.refreshLocale();window.ui.refresh();};
document.documentElement.classList.add('app-ready');
window.ready=true;
</script>`);
const browser=await chromium.launch({headless:true,args:['--disable-gpu']});
const reports=[];
try {
 for (const viewport of [{width:1280,height:800},{width:390,height:844},{width:844,height:390}]) {
  const context=await browser.newContext({viewport});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route(root+'/__stage2_ui',route=>route.fulfill({contentType:'text/html',body:html}));
  await page.goto(root+'/__stage2_ui');await page.waitForFunction(()=>window.ready);
  await page.locator('#campaign-select-button').click();
  assert.equal(await page.locator('#campaign-level-list button').count(),8);
  assert.equal(await page.locator('[data-campaign-level="2"]').isDisabled(),true);
  await page.screenshot({path:`${out}/${viewport.width}-chapters.png`});
  await page.locator('[data-campaign-level="1"]').click();
  await page.evaluate(()=>{window.start.finishExit();document.querySelector('#start-screen').hidden=true;});
  await page.locator('#campaign-goal').waitFor({state:'visible'});
  assert.match(await page.locator('#campaign-goal').innerText(),/第一束光/);
  await page.locator('#campaign-goal summary').click();
  assert.equal(await page.locator('#campaign-goal').evaluate(e=>e.open),false);
  await page.locator('#campaign-goal summary').click();
  const overlap = await page.evaluate(()=>{const a=document.querySelector('#hud').getBoundingClientRect(),b=document.querySelector('#campaign-goal').getBoundingClientRect();return a.right>b.left&&b.right>a.left&&a.bottom>b.top&&b.bottom>a.top;});
  assert.equal(overlap,false,'goal must not cover HUD');
  await page.waitForTimeout(160);
  await page.locator('#campaign-goal').screenshot({path:`${out}/${viewport.width}-goal-crop.png`});
  await page.screenshot({path:`${out}/${viewport.width}-goal-v2.png`});
  await page.evaluate(()=>window.ui.collapseGoal());
  assert.equal(await page.locator('#campaign-goal').evaluate(e=>e.open),false);
  await page.evaluate(()=>window.finish(1));
  await page.locator('#complete-panel').waitFor({state:'visible'});

  assert.match(await page.locator('#complete-campaign-summary').textContent(),/转角早餐/);
  assert.equal(await page.locator('#campaign-goal').isVisible(),false);
  await page.locator('#complete-retry-button').click(); assert.equal(await page.evaluate(()=>window.retried),true);
  await page.evaluate(()=>window.locale());

  assert.match(await page.locator('#complete-campaign-summary').textContent(),/Breakfast Around the Corner/);
  await page.screenshot({path:`${out}/${viewport.width}-complete-en.png`});
  await page.evaluate(()=>{document.documentElement.dataset.theme='night';window.hud.hidePanels();window.ui.setCurrent(5);window.ui.revealGoal();});
  assert.match(await page.locator('#campaign-goal').innerText(),/Melody at the Core/);
  await page.screenshot({path:`${out}/${viewport.width}-night-goal.png`});
  await page.evaluate(()=>{window.hud.hidePanels();window.ui.setCurrent(null);});
  assert.equal(await page.locator('#campaign-goal').isVisible(),false);
  assert.equal(await page.locator('#complete-retry-button').isVisible(),false);
  assert.deepEqual(errors,[]);
  reports.push({viewport, passed:true});
  await context.close();
 }
 await writeFile(`${out}/results.json`,JSON.stringify(reports,null,2));
 console.log(JSON.stringify(reports));
} finally { await browser.close(); }

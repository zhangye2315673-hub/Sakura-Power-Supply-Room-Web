export type Locale = 'zh' | 'en';

const STORAGE_KEY = 'plug-spirits-locale';

const zh = {
  'start.title': '樱色插线室',
  'start.description': '整理紧密盘绕的插头线，让安静的家电重新亮起来。',
  'start.loading.initial': '正在唤醒樱色线路',
  'start.loading.sky': '正在点亮樱色天空',
  'start.loading.bundle': '正在盘起真实插头线束',
  'start.loading.first': '正在编织第一关线路',
  'start.loading.appliances': '正在摆放樱色家电',
  'start.loading.cables': '正在盘紧插头线路',
  'start.loading.materials': '正在预热插头线材质',
  'start.loading.applianceMaterials': '正在预热樱花家电',
  'start.loading.scene': '正在预热樱色场景',
  'start.ready': '第一关已经整理完成',
  'start.enter': '进入第一关',
  'start.challenge': '挑战模式',
  'start.random': '随机挑战',
  'start.explore': '探索模式',
  'start.rush': 'RUSH挑战',
  'start.double': '双头挑战',
  'start.skill': '技能挑战',
  'start.skillTest': '冰箱技能测试',
  'start.waiting': '线路准备中…',
  'start.preparing': '正在准备第一关…',
  'start.connecting': '正在接通…',
  'start.reload': '重新加载',
  'start.object': '开放式插头线束',
  'start.footer.controls': '拖动旋转 · 滚轮缩放 · 点击理线',
  'start.footer.modes': '第一关 · 六种挑战模式',
  'hud.subtitle': '樱色插线室',
  'hud.remaining': '剩余线路',
  'status.find': '寻找出口畅通的插头精灵',
  'status.blocked': '前方被其他彩线挡住了',
  'status.opened': '新的路径已经打开',
  'status.solved': '线路已经完全解开',
  'status.connected': '新的连接路径已经打开',
  'status.powered': '所有家电已恢复供电',
  'status.gameOver': '三颗心已经用完',
  'loading.new': '正在整理新的线路…',
  'loading.first': '正在整理第一关…',
  'loading.reset': '正在重置当前关卡…',
  'loading.level': '正在进入第 {level} 关…',
  'loading.random': '正在生成随机线路…',
  'loading.rush': '正在装载固定 RUSH 线组…',
  'loading.skill': '正在生成技能挑战线路…',
  'loader.connected': '线路已接通',
  'flash.wiring': '正在编织彩线…',
  'flash.blocked': '这条线路还不能理顺',
  'flash.moving': '线路开始理顺',
  'flash.summary': '{count} 条彩线 · {free} 个可用接口',
  'flash.connected': '{name}已成功接通',
  'flash.lifeLost': '选错线路，失去一颗心',
  'flash.hint': '已标记一个可拔出的插头 · 剩余 {count} 次',
  'flash.hintUnavailable': '当前没有可提示的插头',
  'flash.wait': '当前插线动画结束后才能返回主界面',
  'mode.random': '随机挑战',
  'mode.explore': '探索模式',
  'mode.rush': 'RUSH 速度挑战',
  'mode.skill': '技能挑战',
  'mode.skillTest': '冰箱技能测试',
  'mode.level': '第 {level} 关 · {shape}',
  'continue.next': '进入下一关 →',
  'continue.random': '进入随机挑战 →',
  'continue.first': '从第1关开始 →',
  'actions.home': '主界面',
  'actions.gallery': '家电图鉴',
  'actions.reset': '重置',
  'actions.random': '随机挑战',
  'help.drag': '<b>拖动</b> 旋转观察',
  'help.zoom': '<b>滚轮</b> 缩放',
  'help.click': '<b>点击</b> 理顺接线',
  'complete.eyebrow': 'HOME CIRCUIT RESTORED',
  'complete.title': '全屋通电',
  'complete.description': '所有插头精灵都找到了自己的家电。',
  'gameOver.eyebrow': 'CIRCUIT OVERLOAD',
  'gameOver.title': '线路断电',
  'gameOver.description': '三次错误已经用完，重新观察遮挡关系再挑战一次。',
  'gameOver.retry': '重新挑战',
  'gameOver.new': '生成新线路',
  'lives.label': '生命',
  'hint.label': '提示',
  'hint.aria': '提示一个可拔出的插头',
  'hint.remaining': '提示一个可拔出的插头，剩余 {count} 次',
  'loader.eyebrow': 'NEW CIRCUIT',
  'loader.progress': '关卡生成进度',
  'gallery.aria': '关卡操作',
  'language.switch': '切换到英文',
  'shape.cube': '紧密方体',
  'shape.cuboid': '长方体',
  'shape.pyramid': '阶梯锥体',
  'shape.cylinder': '阶梯圆柱',
  'shape.sphere': '阶梯球体',
  'shape.octahedron': '八面体',
  'shape.torus': '环体',
  'shape.arch': '拱体',
  'doubleEnded.briefing.eyebrow': '双端出口规则',
  'doubleEnded.briefing.title': '双插头挑战',
  'doubleEnded.briefing.rule': '每条线的两端都是插头。观察两端，找到没有被其他线路挡住的一端。',
  'doubleEnded.briefing.hint': '出口不会被标记；拖动旋转线束，从两端自行寻找。点击被挡端会失去一颗心。',
  'doubleEnded.briefing.start': '开始双插头挑战',
  'rush.timer.ready': '准备倒计时',
  'rush.timer.running': '剩余时间',
  'rush.briefing.time': '固定 {seconds} 秒',
  'rush.briefing.start': '开始挑战',
  'rush.difficulty.easy': '入门',
  'rush.difficulty.normal': '标准',
  'rush.difficulty.hard': '困难',
  'rush.difficulty.expert': '专家',
  'rush.result.success': '挑战成功',
  'rush.result.failure': '挑战失败',
  'rush.result.successDescription': '中央线束已经全部清空。',
  'rush.result.failureDescription': '倒计时已经归零，当前题目可以立即重试。',
  'rush.result.nextLevel': '下一关',
  'rush.result.next': '下一轮随机挑战',
  'rush.result.retry': '重新开始',
} as const;

const en: Record<keyof typeof zh, string> = {
  'start.title': 'Sakura Cable Room',
  'start.description': 'Untangle the tightly packed plug cables and bring every quiet appliance back to life.',
  'start.loading.initial': 'Waking the sakura circuits',
  'start.loading.sky': 'Lighting the sakura sky',
  'start.loading.bundle': 'Coiling the real plug cables',
  'start.loading.first': 'Weaving the first puzzle',
  'start.loading.appliances': 'Placing the appliances',
  'start.loading.cables': 'Packing the plug cables',
  'start.loading.materials': 'Warming cable materials',
  'start.loading.applianceMaterials': 'Warming appliance materials',
  'start.loading.scene': 'Warming the sakura scene',
  'start.ready': 'The first puzzle is ready',
  'start.enter': 'Enter Level 1',
  'start.challenge': 'CHALLENGE MODES',
  'start.random': 'RANDOM CHALLENGE',
  'start.explore': 'EXPLORATION MODE',
  'start.rush': 'RUSH CHALLENGE',
  'start.double': 'DOUBLE-PLUG',
  'start.skill': 'SKILL CHALLENGE',
  'start.skillTest': 'REFRIGERATOR SKILL TEST',
  'start.waiting': 'PREPARING CABLES…',
  'start.preparing': 'Preparing Level 1…',
  'start.connecting': 'Connecting…',
  'start.reload': 'Reload',
  'start.object': 'OPEN-ENDED PLUG CABLE BUNDLE',
  'start.footer.controls': 'DRAG TO ORBIT · WHEEL TO ZOOM · CLICK TO UNTANGLE',
  'start.footer.modes': 'LEVEL 1 · SIX CHALLENGE MODES',
  'hud.subtitle': 'SAKURA CABLE ROOM',
  'hud.remaining': 'REMAINING',
  'status.find': 'Find a plug cable with a clear exit',
  'status.blocked': 'Another cable is blocking this route',
  'status.opened': 'A new route has opened',
  'status.solved': 'Every cable has been untangled',
  'status.connected': 'A new connection route has opened',
  'status.powered': 'Every appliance is powered',
  'status.gameOver': 'All three hearts are gone',
  'loading.new': 'Arranging a new circuit…',
  'loading.first': 'Arranging Level 1…',
  'loading.reset': 'Resetting this puzzle…',
  'loading.level': 'Entering Level {level}…',
  'loading.random': 'Generating a random circuit…',
  'loading.rush': 'Loading the fixed RUSH card…',
  'loading.skill': 'Generating a skill challenge…',
  'loader.connected': 'CIRCUIT CONNECTED',
  'flash.wiring': 'Weaving the cables…',
  'flash.blocked': 'This cable cannot move yet',
  'flash.moving': 'Cable is moving out',
  'flash.summary': '{count} cables · {free} clear exits',
  'flash.connected': '{name} is now connected',
  'flash.lifeLost': 'Wrong cable — one heart lost',
  'flash.hint': 'One removable plug marked · {count} hints left',
  'flash.hintUnavailable': 'No removable plug is available to reveal',
  'flash.wait': 'Wait for the current connection animation before returning home',
  'mode.random': 'RANDOM CHALLENGE',
  'mode.explore': 'EXPLORATION MODE',
  'mode.rush': 'RUSH SPEED TRIAL',
  'mode.skill': 'SKILL CHALLENGE',
  'mode.skillTest': 'REFRIGERATOR SKILL TEST',
  'mode.level': 'LEVEL {level} · {shape}',
  'continue.next': 'NEXT LEVEL →',
  'continue.random': 'RANDOM CHALLENGE →',
  'continue.first': 'START FROM LEVEL 1 →',
  'actions.home': 'HOME',
  'actions.gallery': 'APPLIANCES',
  'actions.reset': 'RESET',
  'actions.random': 'RANDOM',
  'help.drag': '<b>DRAG</b> ORBIT',
  'help.zoom': '<b>WHEEL</b> ZOOM',
  'help.click': '<b>CLICK</b> UNTANGLE',
  'complete.eyebrow': 'HOME CIRCUIT RESTORED',
  'complete.title': 'POWER RESTORED',
  'complete.description': 'Every plug spirit has found an appliance.',
  'gameOver.eyebrow': 'CIRCUIT OVERLOAD',
  'gameOver.title': 'POWER LOST',
  'gameOver.description': 'Three wrong choices used all your hearts. Read the overlaps and try again.',
  'gameOver.retry': 'RETRY',
  'gameOver.new': 'NEW CIRCUIT',
  'lives.label': 'LIVES',
  'hint.label': 'HINT',
  'hint.aria': 'Reveal one removable plug',
  'hint.remaining': 'Reveal one removable plug, {count} hints remaining',
  'loader.eyebrow': 'NEW CIRCUIT',
  'loader.progress': 'PUZZLE GENERATION PROGRESS',
  'gallery.aria': 'Puzzle actions',
  'language.switch': 'Switch to Chinese',
  'shape.cube': 'DENSE CUBE',
  'shape.cuboid': 'CUBOID',
  'shape.pyramid': 'STEPPED PYRAMID',
  'shape.cylinder': 'STEPPED CYLINDER',
  'shape.sphere': 'STEPPED SPHERE',
  'shape.octahedron': 'OCTAHEDRON',
  'shape.torus': 'TORUS',
  'shape.arch': 'ARCH',
  'doubleEnded.briefing.eyebrow': 'DOUBLE-ENDED CABLE RULE',
  'doubleEnded.briefing.title': 'DOUBLE-PLUG CHALLENGE',
  'doubleEnded.briefing.rule': 'Every cable has a plug at both ends. Check both ends and find one whose route is not blocked.',
  'doubleEnded.briefing.hint': 'Exits are not marked. Rotate the bundle and inspect both ends yourself. A blocked end costs one heart.',
  'doubleEnded.briefing.start': 'START DOUBLE-PLUG',
  'rush.timer.ready': 'TIMER READY',
  'rush.timer.running': 'TIME LEFT',
  'rush.briefing.time': 'FIXED {seconds} SECONDS',
  'rush.briefing.start': 'START RUSH',
  'rush.difficulty.easy': 'EASY',
  'rush.difficulty.normal': 'NORMAL',
  'rush.difficulty.hard': 'HARD',
  'rush.difficulty.expert': 'EXPERT',
  'rush.result.success': 'CHALLENGE CLEARED',
  'rush.result.failure': 'CHALLENGE FAILED',
  'rush.result.successDescription': 'Every cable in the central bundle is clear.',
  'rush.result.failureDescription': 'The clock reached zero. Retry this exact card when ready.',
  'rush.result.nextLevel': 'NEXT RUSH LEVEL',
  'rush.result.next': 'NEXT RANDOM CHALLENGE',
  'rush.result.retry': 'RETRY THIS CARD',
};

const messages = { zh, en } as const;
export type TranslationKey = keyof typeof zh;

let currentLocale: Locale = (() => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'zh';
  } catch {
    return 'zh';
  }
})();

export function getLocale(): Locale {
  return currentLocale;
}

export function t(key: TranslationKey, params: Record<string, string | number> = {}): string {
  return messages[currentLocale][key].replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? ''));
}

export function toggleLocale(): Locale {
  currentLocale = currentLocale === 'zh' ? 'en' : 'zh';
  try {
    localStorage.setItem(STORAGE_KEY, currentLocale);
  } catch {
    // Storage is optional; the active session still switches immediately.
  }
  return currentLocale;
}

export function shapeLabel(shape: string): string {
  const key = `shape.${shape}` as TranslationKey;
  return key in messages[currentLocale] ? t(key) : shape.toUpperCase();
}

export function applyStaticTranslations(): void {
  document.documentElement.lang = currentLocale === 'zh' ? 'zh-CN' : 'en';
  document.title = currentLocale === 'zh' ? 'Plug Cable Spirits · 樱色插线室' : 'Plug Cable Spirits · Sakura Cable Room';
  const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (meta) meta.content = t('start.description');

  setHtml('#start-screen-title', `<small>Plug Cable Spirits</small>${t('start.title')}`);
  setText('.start-screen-copy > p', t('start.description'));
  setText('.start-screen-object-note b', t('start.object'));
  setText('.start-screen-footer span:first-child', t('start.footer.controls'));
  setText('.start-screen-footer span:last-child', t('start.footer.modes'));
  setText('.brand-block small', t('hud.subtitle'));
  setText('.progress-copy > span', t('hud.remaining'));
  setText('#home-button', t('actions.home'));
  setText('#challenge-mode-button', t('start.challenge'));
  setText('#start-random-button', t('start.random'));
  setText('#start-explore-button', t('start.explore'));
  setText('#start-rush-button', t('start.rush'));
  setText('#start-double-ended-button', t('start.double'));
  setText('#start-skill-button', t('start.skill'));
  setText('#start-skill-test-button', t('start.skillTest'));
  setText('#appliance-gallery-button', t('actions.gallery'));
  setText('#reset-button', t('actions.reset'));
  setText('#new-button', t('actions.random'));
  setHtml('#help-strip span:nth-child(1)', t('help.drag'));
  setHtml('#help-strip span:nth-child(2)', t('help.zoom'));
  setHtml('#help-strip span:nth-child(3)', t('help.click'));
  setText('#complete-panel .complete-card > span', t('complete.eyebrow'));
  setText('#complete-panel h1', t('complete.title'));
  setText('#complete-panel p', t('complete.description'));
  setText('#game-over-panel .complete-card > span', t('gameOver.eyebrow'));
  setText('#game-over-panel h1', t('gameOver.title'));
  setText('#game-over-panel p', t('gameOver.description'));
  setText('#retry-random-button', t('gameOver.retry'));
  setText('#game-over-new-button', t('gameOver.new'));
  setText('#random-lives .life-label', t('lives.label'));
  setText('#hint-button .life-label', t('hint.label'));
  setText('.puzzle-loader-copy > span', t('loader.eyebrow'));

  const actions = document.querySelector<HTMLElement>('#game-actions');
  actions?.setAttribute('aria-label', t('gallery.aria'));
  const languageButton = document.querySelector<HTMLButtonElement>('#language-button');
  if (languageButton) {
    languageButton.textContent = currentLocale === 'zh' ? 'EN' : '中文';
    languageButton.setAttribute('aria-label', t('language.switch'));
  }
  document.querySelector('#random-lives')?.setAttribute('aria-label', t('lives.label'));
  const hintButton = document.querySelector<HTMLButtonElement>('#hint-button');
  hintButton?.setAttribute('aria-label', t('hint.aria'));
  hintButton?.setAttribute('title', t('hint.aria'));
  document.querySelector('.plug-loader')?.setAttribute('aria-label', t('loader.progress'));
}

function setText(selector: string, text: string): void {
  const element = document.querySelector<HTMLElement>(selector);
  if (element) element.textContent = text;
}

function setHtml(selector: string, html: string): void {
  const element = document.querySelector<HTMLElement>(selector);
  if (element) element.innerHTML = html;
}

export type Locale = 'zh' | 'en';

const STORAGE_KEY = 'plug-spirits-locale';

const zh = {
  'campaign.stage.learn': '入门 · 旋转与出口',
  'campaign.stage.observe': '观察 · 遮挡与视角',
  'campaign.stage.plan': '进阶 · 分步拆解',
  'campaign.stage.master': '综合 · 空间与顺序',
  'campaign.chapter.1.name': '第一束光',
  'campaign.chapter.1.goal': '拖动空白处旋转，找到出口畅通的插头。',
  'campaign.chapter.2.name': '转角早餐',
  'campaign.chapter.2.goal': '正面被挡住时，转到侧面寻找另一个出口。',
  'campaign.chapter.3.name': '书桌高低间',
  'campaign.chapter.3.goal': '抬高或压低视角，看清插头前方是否有线。',
  'campaign.chapter.4.name': '家务绕一圈',
  'campaign.chapter.4.goal': '绕线束观察一圈，从出口最清楚的位置开始。',
  'campaign.chapter.5.name': '球心旋律',
  'campaign.chapter.5.goal': '每拔出一根线，重新观察球面上露出的出口。',
  'campaign.chapter.6.name': '棱面游乐室',
  'campaign.chapter.6.goal': '在不同棱面之间切换视角，分步理清遮挡。',
  'campaign.chapter.7.name': '厨房长线条',
  'campaign.chapter.7.goal': '沿长线找到插头，再确认它的抽出方向是否畅通。',
  'campaign.chapter.8.name': '全屋最后一层',
  'campaign.chapter.8.goal': '结合旋转与俯仰，拆开外层后再寻找深处出口。',
  'campaign.brief.title': '第 {level} 关 · {name}',
  'campaign.brief.start': '开始理线',
  'campaign.brief.meta': '{shape} · {count} 条线路',
  'campaign.goal': '本关目标：{goal}',
  'campaign.preview': '下一关：{name}',
  'campaign.completeShort': '关卡集已完成 · 可以随时重玩',
  'campaign.progress': '关卡进度',
  'campaign.overview': '关卡集',
  'campaign.close': '关闭',
  'campaign.counts': '已完成 {done} / {count} 关 · 星星 {stars} / {total}',
  'campaign.level': '第 {level} 关 / 共 {count} 关 · {shape}',
  'campaign.continue': '继续关卡 · 第 {level} 关',
  'campaign.revisit': '重玩关卡 · 第 {level} 关',
  'campaign.done': '已完成',
  'campaign.current': '当前关',
  'campaign.unlocked': '已解锁',
  'campaign.locked': '未解锁 · 完成第 {level} 关',
  'campaign.noScore': '待补星级',
  'campaign.unlock': '第 {level} 关已解锁',
  'campaign.next': '下一关 · 第 {level} 关',
  'campaign.retry': '重玩本关',
  'campaign.back': '返回关卡集',
  'campaign.first': '首次成绩 · {detail}',
  'campaign.complete': '关卡集完成',
  'campaign.partial': '最终关已完成',
  'campaign.summary': '各关最佳合计（已记录 {recorded} / {count} 关）：{time} · {mistakes} 次错误',
  'campaign.recommend': '推荐重玩：第 {level} 关 · {rating}',
  'campaign.replay': '挑战低星关卡',
  'campaign.perfect': '全关三星达成 · 可继续挑战更快通关',
  'campaign.session': '本次进度仅在当前页面保留，浏览器未能保存。',
  'start.title': '樱色插线室',
  'start.description': '转一转，找到畅通的出口。抽出插头线，让家电一台台亮起来。',
  'start.loading.initial': '正在唤醒樱色线路',
  'start.loading.sky': '正在点亮樱色天空',
  'start.loading.bundle': '正在整理彩色线束',
  'start.loading.first': '正在编织第一关线路',
  'start.loading.appliances': '正在摆放樱色家电',
  'start.loading.cables': '正在盘紧插头线路',
  'start.loading.materials': '正在准备线路外观',
  'start.loading.applianceMaterials': '正在准备家电外观',
  'start.loading.scene': '正在布置房间',
  'start.ready': '准备好了，开始理线吧',
  'start.enter': '进入第一关',
  'start.challenge': '更多玩法',
  'start.random': '随机挑战',
  'start.explore': '探索模式',
  'start.rush': '限时挑战',
  'start.double': '双插头挑战',
  'start.skill': '技能挑战',
  'start.waiting': '线路准备中…',
  'start.preparing': '正在准备第一关…',
  'start.connecting': '正在接通…',
  'start.reload': '重新加载',
  'start.object': '开放式插头线束',
  'start.footer.controls': '拖动旋转 · 滚轮缩放 · 点击理线',
  'start.footer.modes': '关卡闯关 / 五种额外玩法',
  'hud.subtitle': '樱色插线室',
  'hud.remaining': '剩余线路',
  'status.find': '转动线束，寻找出口畅通的插头',
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
  'loading.rush': '正在准备限时挑战…',
  'loading.skill': '正在生成技能挑战线路…',
  'loader.connected': '线路已接通',
  'flash.wiring': '正在编织彩线…',
  'flash.blocked': '出口被挡住了：转动线束，先找外层插头',
  'flash.moving': '正在抽出线路',
  'flash.summary': '{count} 条线路 · {free} 条可抽出',
  'flash.connected': '{name}已成功接通',
  'flash.lifeLost': '选错线路，失去一颗心',
  'flash.hint': '已标记一个可拔出的插头 · 剩余 {count} 次',
  'flash.hintUnavailable': '当前没有可提示的插头',
  'flash.wait': '当前插线动画结束后才能返回主界面',
  'mode.random': '随机挑战',
  'mode.explore': '探索模式',
  'mode.rush': 'RUSH 速度挑战',
  'mode.skill': '技能挑战',
  'mode.level': '第 {level} 关 · {shape}',
  'continue.next': '进入下一关 →',
  'continue.random': '进入随机综合挑战 →',
  'continue.first': '从第1关开始 →',
  'actions.home': '主界面',
  'actions.gallery': '家电图鉴',
  'actions.reset': '重玩本关',
  'actions.random': '随机综合挑战',
  'help.drag': '<b>拖动</b> 旋转观察',
  'help.zoom': '<b>双指捏合 / 滚轮</b> 缩放',
  'help.click': '<b>点击插头</b> 抽出线路',
  'help.firstPlay': '拖动空白处旋转 · 点击外层插头',
  'help.firstBlocked': '这端被挡住了 · 转动线束寻找外层出口',
  'complete.eyebrow': '线路整理完成',
  'complete.title': '全屋通电',
  'complete.description': '所有插头精灵都找到了自己的家电。',
  'complete.time': '用时',
  'complete.mistakes': '错误',
  'complete.rating': '评价',
  'complete.best': '本关最佳：{time} · {mistakes} 次错误 · {stars}',
  'complete.newRecord': '新纪录 · {detail}',
  'complete.nextStar': '再少 {count} 次错误即可获得更高评价',
  'complete.retry': '重新挑战',
  'complete.home': '返回主界面',
  'gameOver.eyebrow': '这次差一点',
  'gameOver.title': '线路断电',
  'gameOver.description': '生命已用完。转动线束看清出口，再试一次吧。',
  'gameOver.retry': '重新挑战',
  'gameOver.new': '生成新线路',
  'lives.label': '生命',
  'lives.continueReady': '随机挑战生命值，复活待命，生命归零时恢复 {restore} 格',
  'lives.continueReadyTitle': '复活待命',
  'lives.continueRestorePrefix': '归零恢复 ',
  'lives.continueRestoreSuffix': ' 格',
  'hint.label': '提示',
  'hint.aria': '提示一个可拔出的插头',
  'hint.remaining': '提示一个可拔出的插头，剩余 {count} 次',
  'loader.eyebrow': '准备下一段线路',
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
  'campaign.stage.learn': 'LEARN · ROTATION & EXITS',
  'campaign.stage.observe': 'OBSERVE · OCCLUSION & VIEWS',
  'campaign.stage.plan': 'PLAN · STEP BY STEP',
  'campaign.stage.master': 'MASTER · SPACE & ORDER',
  'campaign.chapter.1.name': 'First Light',
  'campaign.chapter.1.goal': 'Drag empty space to rotate; find a plug with a clear exit.',
  'campaign.chapter.2.name': 'Breakfast Around the Corner',
  'campaign.chapter.2.goal': 'If the front is blocked, rotate to look for another exit.',
  'campaign.chapter.3.name': 'Above the Desk',
  'campaign.chapter.3.goal': 'Tilt the view up or down to inspect the space ahead of each plug.',
  'campaign.chapter.4.name': 'A Turn Around the House',
  'campaign.chapter.4.goal': 'Look around the bundle and start where the exits are clearest.',
  'campaign.chapter.5.name': 'Melody at the Core',
  'campaign.chapter.5.goal': 'After each removal, check the sphere for newly exposed exits.',
  'campaign.chapter.6.name': 'Facets of Play',
  'campaign.chapter.6.goal': 'Switch between facets and work through the obstructions step by step.',
  'campaign.chapter.7.name': 'The Long Kitchen Route',
  'campaign.chapter.7.goal': 'Follow each long cable to its plug, then check its exit direction.',
  'campaign.chapter.8.name': 'The Final Layer',
  'campaign.chapter.8.goal': 'Rotate and tilt; clear the outer cables, then inspect the deeper exits.',
  'campaign.brief.title': 'LEVEL {level} · {name}',
  'campaign.brief.start': 'START UNTANGLING',
  'campaign.brief.meta': '{shape} · {count} cables',
  'campaign.goal': 'GOAL: {goal}',
  'campaign.preview': 'NEXT · {name}',
  'campaign.completeShort': 'CAMPAIGN COMPLETE · REPLAY ANY LEVEL',
  'campaign.progress': 'CAMPAIGN PROGRESS',
  'campaign.overview': 'CAMPAIGN LEVELS',
  'campaign.close': 'CLOSE',
  'campaign.counts': '{done} / {count} cleared · {stars} / {total} stars',
  'campaign.level': 'LEVEL {level} / {count} · {shape}',
  'campaign.continue': 'CONTINUE · LEVEL {level}',
  'campaign.revisit': 'REVISIT · LEVEL {level}',
  'campaign.done': 'CLEARED',
  'campaign.current': 'CURRENT',
  'campaign.unlocked': 'AVAILABLE',
  'campaign.locked': 'LOCKED · CLEAR LEVEL {level}',
  'campaign.noScore': 'NO RATING YET',
  'campaign.unlock': 'LEVEL {level} UNLOCKED',
  'campaign.next': 'NEXT · LEVEL {level}',
  'campaign.retry': 'REPLAY LEVEL',
  'campaign.back': 'CAMPAIGN',
  'campaign.first': 'FIRST RESULT · {detail}',
  'campaign.complete': 'CAMPAIGN COMPLETE',
  'campaign.partial': 'FINAL LEVEL CLEARED',
  'campaign.summary': 'BEST RESULTS TOTAL ({recorded} / {count} recorded): {time} · {mistakes} mistakes',
  'campaign.recommend': 'RECOMMENDED REPLAY: LEVEL {level} · {rating}',
  'campaign.replay': 'IMPROVE RATING',
  'campaign.perfect': 'ALL STARS EARNED · TRY A FASTER CLEAR',
  'campaign.session': 'Progress is available in this session only; browser storage failed.',
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
  'start.challenge': 'MORE MODES',
  'start.random': 'RANDOM CHALLENGE',
  'start.explore': 'EXPLORATION MODE',
  'start.rush': 'RUSH CHALLENGE',
  'start.double': 'DOUBLE-PLUG',
  'start.skill': 'SKILL CHALLENGE',
  'start.waiting': 'PREPARING CABLES…',
  'start.preparing': 'Preparing Level 1…',
  'start.connecting': 'Connecting…',
  'start.reload': 'Reload',
  'start.object': 'OPEN-ENDED PLUG CABLE BUNDLE',
  'start.footer.controls': 'DRAG TO ORBIT · WHEEL TO ZOOM · CLICK TO UNTANGLE',
  'start.footer.modes': 'STORY LEVELS / FIVE EXTRA MODES',
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
  'flash.blocked': 'Blocked: rotate the bundle and find an outer plug',
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
  'mode.level': 'LEVEL {level} · {shape}',
  'continue.next': 'NEXT LEVEL →',
  'continue.random': 'RANDOM MIX →',
  'continue.first': 'START FROM LEVEL 1 →',
  'actions.home': 'HOME',
  'actions.gallery': 'APPLIANCES',
  'actions.reset': 'RESET',
  'actions.random': 'RANDOM MIX',
  'help.drag': '<b>DRAG</b> ORBIT',
  'help.zoom': '<b>PINCH / WHEEL</b> ZOOM',
  'help.click': '<b>CLICK</b> UNTANGLE',
  'help.firstPlay': 'DRAG EMPTY SPACE TO ORBIT · CLICK AN OUTER PLUG',
  'help.firstBlocked': 'This end is blocked · rotate to find an outer exit',
  'complete.eyebrow': 'HOME CIRCUIT RESTORED',
  'complete.title': 'POWER RESTORED',
  'complete.description': 'Every plug spirit has found an appliance.',
  'complete.time': 'TIME',
  'complete.mistakes': 'MISTAKES',
  'complete.rating': 'RATING',
  'complete.best': 'BEST: {time} · {mistakes} mistakes · {stars}',
  'complete.newRecord': 'NEW RECORD · {detail}',
  'complete.nextStar': '{count} fewer mistakes for a higher rating',
  'complete.retry': 'RETRY CHALLENGE',
  'complete.home': 'RETURN HOME',
  'gameOver.eyebrow': 'CIRCUIT OVERLOAD',
  'gameOver.title': 'POWER LOST',
  'gameOver.description': 'Three wrong choices used all your hearts. Read the overlaps and try again.',
  'gameOver.retry': 'RETRY',
  'gameOver.new': 'NEW CIRCUIT',
  'lives.label': 'LIVES',
  'lives.continueReady': 'Random challenge lives, continue ready; restore {restore} lives at zero',
  'lives.continueReadyTitle': 'CONTINUE READY',
  'lives.continueRestorePrefix': 'Restore ',
  'lives.continueRestoreSuffix': ' lives',
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
  const descriptions = currentLocale === 'zh'
    ? ['随机体验不同类型的挑战', '进入探索模式，换个节奏', '倒计时结束前，抽出所有线', '观察两端，选择畅通的插头', '家电通电后，触发专属技能']
    : ['A mix of different challenge types', 'Explore at a different pace', 'Clear every cable before time runs out', 'Check both ends for a clear exit', 'Power appliances to activate skills'];
  const modeButtons = ['start-random-button', 'start-explore-button', 'start-rush-button', 'start-double-ended-button', 'start-skill-button'];
  modeButtons.forEach((id, index) => {
    const detail = document.createElement('small');
    detail.textContent = descriptions[index] ?? '';
    document.getElementById(id)?.append(detail);
  });
  setText('#appliance-gallery-button', t('actions.gallery'));
  setText('#reset-button', t('actions.reset'));
  setText('#new-button', t('actions.random'));
  setHtml('#first-play-hint', t('help.firstPlay'));
  setHtml('#help-strip span:nth-child(1)', t('help.drag'));
  setHtml('#help-strip span:nth-child(2)', t('help.zoom'));
  setHtml('#help-strip span:nth-child(3)', t('help.click'));

  setText('#complete-panel .complete-card > span', t('complete.eyebrow'));
  setText('#complete-panel h1', t('complete.title'));
  setText('#complete-panel p', t('complete.description'));
  setText('#complete-stats > div:nth-child(1) span', t('complete.time'));
  setText('#complete-stats > div:nth-child(2) span', t('complete.mistakes'));
  setText('#complete-stats > div:nth-child(3) span', t('complete.rating'));
  setText('#complete-home-button', t('complete.home'));
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

export function campaignChapterText(id: number): { name: string; goal: string } {
  return { name: t(`campaign.chapter.${id}.name` as TranslationKey), goal: t(`campaign.chapter.${id}.goal` as TranslationKey) };
}

# 整理进度

## 2026-08-12

- 完成源码入口扫描：`SkillChallengeEngine`、`SkillChallengeUi`、`SkillEffectModelKit`、`Game`、`SakuraPipeline`、`Hud`、`styles.css`。
- 确认技能注册表为 29 项，状态图标为 11 项（5 BUFF + 6 DEBUFF）。
- 确认 20 个技能 3D 资产 ID、7 个持久状态附着效果、5 个全屏后处理效果。
- 建立 29 项技能矩阵，逐项记录逻辑、动画、图标和玩家提醒。
- 标出表现结构性缺口：`presentation.assetIds` 空数组、未映射的技能资产、电脑蓝屏缺少独立后处理、分支技能文案不足。
- 本次只新增整理文档，没有修改游戏逻辑、样式或资产。

## 下一步

- 等用户指定第一个技能和目标改动。
- 修改前先把该技能的“现状/目标/验收”写入本目录，再改对应源码和测试。

## 2026-08-12 状态图标改造

- 核实生命值使用 CSS `clip-path` 多边形双层心形，提示使用描边 `!` 字符；两者均未使用图片生成或 img2threejs。
- 将 5 个 BUFF、6 个 DEBUFF 和打印机 pending 改为单一语义符号 + CSS 多边形 + 两块纯色面的简洁 Low Poly 图标。
- 删除运行时 atlas 坐标表和 PNG 背景引用，测试改为验证全部 11 个主题不加载 `url(...)` 图片。
- 保留技能场景 3D 特效及其 img2threejs 参考，它们不属于本次 HUD 图标删除范围。
- `npm run build` 通过。
- `npx playwright test tests/skill-status-icons.spec.ts --project=desktop-chrome` 通过，2/2 用例成功。
- 已人工检查 1440x900 与 390x844 截图；状态图标、生命、提示、全局工具栏和 HUD 无重叠。

# 进度日志：四季环境系统

## 会话：2026-08-25

### 阶段 12：按用户反馈返工粒子、配色与主界面层级
- **状态：** in_progress
- 执行的操作：
  - 用户否定立体纸艺方向：夏叶、秋枫、冬雪均需恢复为接近樱花尺度的二维圆润面片。
  - 秋叶需要橙到黄的渐变、不同大小与细微形状差异；夏叶更细长且不可过大。
  - 夏秋背景需要重新参考网络小清新配色和旧 SAKULA 设计，优先保证线束与飘落物色彩适配。
  - 春季云冻结；夏秋冬云改为贴近背景的低对比、低存在感层。
  - 开场前景 wash 必须避开插头、插孔和线束主体，不能继续对模型做颜色覆盖。
  - 已核对樱花的真实几何/材质合同，并定位三季云不够隐约的直接参数原因。
  - 旧 `sakula\arrow-cube` 已迁移为空目录；后续通过旧仓库 Git 历史和 Sakura Crossing 根源码读取设计参考。
  - 首轮 Bing 泛化检索结果不相关，已放弃该检索路径，改用直接色值来源。
  - 已从旧 Sakura Git 历史恢复 Arrow Cube 原始天空/花瓣实现，并审计 Sakura Crossing 的窄色域调色板、二维云与圆润花瓣方法。
  - 找到两个 MIT 许可的 Nippon Colors 数据仓库，下一步只提取适合小清新季节偏移的低饱和色值。
  - 已从 Nippon Colors JSON 提取白緑、瓶覗、水、灰桜、鳥の子、蒸栗、时雨茶和白練作为可验证色值参考。
  - 已完成返工设计审计：背景、色彩、粒子和视觉层级均为 2/5，自动轮换与过渡保持 5/5，不改逻辑。

### 阶段 8：一分钟自动轮换与视觉二次设计
- **状态：** complete
- 执行的操作：
  - 读取用户截图，确认左侧固定米白前景层与右侧季节天空色域割裂。
  - 将自动轮换、夏季青绿调色、立体纸艺粒子和前景同步追加为阶段 8–11。
  - 继续冻结春季视觉、昼夜按钮逻辑、玩法与冰箱技能粒子隔离。
  - 默认每 60 秒按春夏秋冬轮换；手动快捷选择重置计时，自动换季不改变昼夜。
  - 夏季天空、雾、云影、页面背景与开场 wash 调整为柔和青绿色。
  - 左侧开场 wash 接入连续插值后的季节 CSS RGB，修复左右色域割裂。
  - 夏叶、秋枫、冬雪升级为带厚度、折脊/枝杈和正反色差的立体纸艺几何。
  - 抓取 `artifacts/season-system-refresh/` 三张 1440×900 日间开场图并逐张目检。
  - 完整季节与工具栏回归 13/13 通过；生产构建 1988 modules transformed。

### 阶段 1：需求、基准与现状审计
- **状态：** complete
- 执行的操作：
  - 核对当前春日、春夜实时画面与现有视觉方向。
  - 审计 ThemeController、NightEnvironment、SkyRig、PetalField、OpeningScene 和 GlobalToolbar。
  - 确认春季保真、昼夜正交、季节连续过渡和冰箱技能隔离要求。
  - 检查工作区状态，确认存在大量无关未提交修改。
- 创建/修改的文件：
  - `.planning/season-system/task_plan.md`
  - `.planning/season-system/findings.md`
  - `.planning/season-system/progress.md`

### 阶段 2：环境模型与春季兼容层
- **状态：** complete
- 执行的操作：
  - 新增四季昼夜环境参数表，春季值直接复用当前参数。
  - 新增 SeasonController，支持查询参数、持久化、2.4 秒过渡、减弱动态和中途重定向。
  - 接入 Game 循环、诊断、NightEnvironment 和 GlobalToolbar。
  - 新增季节菜单的基础 DOM 与样式。
- 创建/修改的文件：
  - `src/theme/SeasonProfiles.ts`
  - `src/theme/SeasonController.ts`
  - `src/theme/NightEnvironment.ts`
  - `src/theme/GlobalToolbar.ts`
  - `src/style/sky.ts`
  - `src/game/Game.ts`
  - `src/styles.css`
  - `src/vite-env.d.ts`

### 阶段 3：天空、云、光照和 CSS 过渡
- **状态：** in_progress
- 执行的操作：
  - 天空、雾和四组环境光已经从最终季节×昼夜状态读取。
  - 待完成云形/速度、页面背景与视觉验证。
- 创建/修改的文件：
  - 见阶段 2 列表。

### 阶段 4：环境粒子与开场同步
- **状态：** complete
- 执行的操作：
  - `PetalField` 已加入夏叶、秋叶、冬季纸片雪和夏夜萤火虫的实例化渲染层。
  - 保留原樱花实例、`burst`、`applyWind` 与冰箱专用低多边形冰晶层。
  - 最新粒子补丁已通过 TypeScript 静态检查；下一步接入每帧季节权重并同步 `OpeningScene`。
  - SkyRig、PetalField、OpeningScene 已在同一帧读取同一份季节权重。
  - 开场 22 个运动节点改为春花、夏叶、秋叶、冬雪、夏夜萤火的交叉淡化容器，原弹簧、碰撞与爆发轨迹不变。
- 创建/修改的文件：
  - `src/systems/SeasonParticleVisual.ts`
  - `src/systems/PetalField.ts`
  - `src/systems/OpeningScene.ts`

### 阶段 5：季节选择器与交互
- **状态：** complete
- 执行的操作：
  - 季节按钮与四季单选菜单已接入手动持久化。
  - 已加入 Escape、方向键、Home/End、外部点击关闭与焦点回归。
  - 菜单增加视口宽度约束；待 Playwright 验证桌面和手机无溢出、无重叠。
  - 已验证 1440×900 与 390×844 无工具区重叠、无横向溢出。
  - 已验证方向键、Home/End、Escape、外部点击和焦点回归。

### 阶段 6：测试、视觉验证和修正
- **状态：** complete
- 执行的操作：
  - 新增 `tests/season-system.spec.ts`，覆盖默认/查询/保存、重定向连续性、昼夜正交、冬雪隔离和移动端菜单。
  - 布局测试两视口已通过；季节专项 5 项中非时序项已通过，重定向与正交项经修正后单独复测通过。
  - 待运行生产构建、整组 7 项复测与实时截图目检。
  - `npm run build` 已通过，Vite 完成 1987 个模块的生产构建。
  - 已生成 8 张桌面四季×昼夜截图与 2 张手机端代表截图，逐张目检通过。
  - 最终 `season-system.spec.ts` + `night-toolbar-layout.spec.ts` 整组 9/9 通过（4.9 分钟）。
  - 低画质状态机专项 1/1 通过；减弱动态与探索组合已包含在最终整组中。

### 阶段 7：交付
- **状态：** complete
- 执行的操作：
  - 完成范围检查、测试证据汇总和计划收口。
  - 实施文件、测试文件与视觉证据均保留在独立季节系统范围内。

## 测试结果
| 测试 | 输入 | 预期结果 | 实际结果 | 状态 |
|------|------|---------|---------|------|
| 工作区边界检查 | `git status --short` | 识别并保留用户改动 | 已识别 46 个已跟踪修改及多项未跟踪文件 | 通过 |
| TypeScript 阶段 2 | `npx tsc --noEmit` | 无类型和未使用符号错误 | 通过 | 通过 |
| TypeScript 粒子补丁 | `npx tsc --noEmit` | 新季节粒子类型与初始化无错误 | 通过（2026-08-25） | 通过 |
| TypeScript 三处接线与菜单 | `npx tsc --noEmit` | 天空、粒子、开场及键盘交互无类型错误 | 修复 2 个失效旧常量后通过 | 通过 |
| 季节与布局最终回归 | `npx playwright test tests/season-system.spec.ts tests/night-toolbar-layout.spec.ts --project=desktop-chrome --reporter=line` | 9 项全部通过 | 9 passed (4.9m) | 通过 |
| 低画质状态机 | `npx playwright test tests/theme-audio.spec.ts ... --grep "adaptive night quality degrades"` | 降级与恢复逻辑通过 | 1 passed | 通过 |
| 生产构建 | `npm run build` | TypeScript 与 Vite 构建成功 | 1987 modules transformed | 通过 |
| 四季视觉证据 | `artifacts/season-system/*.png` | 四季×昼夜与手机代表画面可识别、无溢出 | 10 张截图逐张目检通过 | 通过 |
| 自动轮换与立体纸艺回归 | `season-system.spec.ts` + `night-toolbar-layout.spec.ts` | 自动/手动计时、昼夜正交、wash、Z 厚度与原回归全部通过 | 13 passed (8.6m) | 通过 |
| 二次生产构建 | `npm run build` | TypeScript 与 Vite 构建成功 | 1988 modules transformed | 通过 |
| 二次视觉证据 | `artifacts/season-system-refresh/*.png` | 夏绿、秋橙、冬冷且左右连续，粒子轮廓/厚度可读 | 3 张桌面开场截图逐张目检通过 | 通过 |
| 二维返工合同测试 | `season-system.spec.ts` 粒子与配色合同 | 三季粒子 Z≈0、尺寸接近樱花、枫叶渐变、云低存在感、季节色相明确 | 通过 | 通过 |
| 二维返工视觉证据 | `artifacts/season-system-flat-final/*.png` | 夏季薄荷灰绿、秋季杏灰、冬季雾蓝；三季面片轻盈且线束不染色 | 3 张桌面开场截图逐张目检通过 | 通过 |
| 二维返工完整回归 | `npx playwright test tests/season-system.spec.ts tests/night-toolbar-layout.spec.ts --project=desktop-chrome --reporter=line` | 季节、昼夜、隔离、减弱动态、探索模式与工具栏全部通过 | 13 passed (6.0m) | 通过 |
| 二维返工生产构建 | `npm run build` | TypeScript 与 Vite 构建成功 | 1988 modules transformed | 通过 |
| 枫叶/雪晶轮廓截图 | `artifacts/season-shape-refine/*.png` | 枫叶五裂片有主次、短柄微弯；雪花具六主枝与侧枝 | 秋季第二轮和冬季完整/放大图逐张目检通过 | 通过 |
| 枫叶/雪晶聚焦回归 | `season-system.spec.ts --grep "automatic order...|winter ambient snow..."` | 轮廓、尺寸、红色渐变及冰箱冰晶隔离合同通过 | 2 passed (47.8s) | 通过 |
| 枫叶/雪晶生产构建 | `npm run build` | TypeScript 与 Vite 构建成功 | 1988 modules transformed | 通过 |
| 夏夜萤火与 wash 修正 | `artifacts/season-night-wash-fix/summer-night-opening-v2.png` | 夏夜萤火透明度为 0；固定夜间遮罩取消；左侧单层渐变无纵向切线 | 1497×917 实际截图与诊断值复核 | 通过 |
| 四季昼夜 wash 聚焦回归 | `season-system.spec.ts --grep "opening foreground wash..."` | 三季日间和四季夜间 wash 均跟随对应环境色，夜间伪元素无叠层 | 1 passed (2.1m) | 通过 |
| 极简枫叶面片候选 | 第二轮 6 款 3×2 比较图 | 与樱花瓣同语言：无叶脉/切面/锯齿，仅圆润五裂轮廓和短柄 | 用户选择 6 号 | 通过 |
| 6 号枫叶实机验证 | `artifacts/season-maple-v6/autumn-day-opening-v2.png` | 连续圆润五裂、零二级锯齿、短弯柄、樱花级尺寸 | 1497×917 秋季开场截图目检通过 | 通过 |
| 6 号枫叶季节回归 | `tests/season-system.spec.ts` | 11 项季节合同、换季、wash、昼夜、冬雪与菜单行为 | 9 项首轮通过；2 项预算校正后定向复跑通过 | 通过 |
| 三季白天 wash 融合 | `tests/season-system.spec.ts --grep "opening foreground wash..."` | 春季 wash 不变；夏秋冬白天 wash 与各自背景更接近 | 三季 1497×917 截图目检通过；1 passed (1.1m) | 通过 |
| 白天双层 wash 拆分 | `SeasonController.ts` + `styles.css` | 春季保留 page wash；夏秋冬白天 page wash 为 0；夜间恢复原叠层 | 定向合同覆盖 4 组夜间与 3 组三季白天；截图确认白天无额外 page wash | 通过 |
| 三季 wash 颜色二次校准 | `SeasonProfiles.ts` + `tests/season-system.spec.ts` | 夏秋冬左侧 wash 与 Canvas 实际天空采样对齐，春季不变 | 夏 `221,226,202`、秋 `240,217,187`、冬 `219,223,213`；定向测试 1 passed；截图存于 `artifacts/season-wash-after-v2/` | 通过 |
| 阶段 14 代码验证 | `tsc` + 两条季节聚焦回归 + `npm run build` | wash 合同、昼夜正交与夏夜无萤火均通过；生产构建成功 | 2 tests passed；1988 modules transformed | 通过 |
## 错误日志
| 时间戳 | 错误 | 尝试次数 | 解决方案 |
|--------|------|---------|---------|
| 2026-08-25 | `sky.ts` 的 `nightCloudColor`、`nightShadeColor` 在云色写入顺序修正后触发 TS6133 | 1 | 删除失效旧常量，保留季节环境与探索叠加路径 |
| 2026-08-25 | 1440×900 下 `#game-actions` 与居中 `#play-tools` 重叠 | 1 | 不再横向挤压，桌面 `#game-actions` 下移到工具栏第二行 |
| 2026-08-25 | 软件 WebGL 预热期间低帧率使季节测试错过中间权重，ArrowDown 同时被按钮和 document 处理 | 1 | 过渡改用更合理的 wall-clock 上限；测试先等首屏 ready；键盘事件改为单入口 |
| 2026-08-25 | 菜单 `visibility` 动画阻止打开瞬间聚焦；旧布局测试把弹出菜单项计入顶层工具按钮 | 1 | visibility 立即切换；收紧测试选择器；重 WebGL 测试使用 DOM click 并提高单测预算 |
| 2026-08-25 | 软件 WebGL 即使 ready 后仍可能约 1 FPS，0.25 秒 cap 让 2.4 秒季节过渡耗时十余秒 | 1 | cap 改为完整过渡时长 2.4 秒，按真实经过时间完成 |
| 2026-08-25 | 极低帧率下测试错过季节与昼夜同时处于 transitioning 的中间诊断帧 | 1 | 断言两个目标同时更新并最终抵达夏夜，不再依赖窄中间帧 |
| 2026-08-25 | 重定向后测试读到发布前的旧夏季 progress=1 诊断并提前结束等待 | 1 | 轮询目标季节、稳定季节与 progress 三个条件，防止陈旧快照误判 |
| 2026-08-25 | CSS RGB 直接读取 Three.js 线性颜色导致浅薄荷色变暗 | 1 | 输出 CSS 变量前用 `convertLinearToSRGB()` 转回显示色域 |
| 2026-08-25 | 测试内浏览器绝对动态导入可运行但生产 `tsc` 无法解析 | 1 | 用运行时 `Function(import)` 保留 URL，并用相对 `typeof import` 提供编译期类型 |
| 2026-08-25 | Bing 泛化查询返回语言学习等无关结果 | 1 | 停止使用泛化搜索结果，改为直接读取专业配色站、传统日色数据与旧项目色板 |
| 2026-08-26 | 昼夜正交测试的开场预热预算 90 秒与过渡预算 60 秒超过外层 120 秒总预算 | 2 | 将该重 WebGL 用例总预算校正为 180 秒；复跑 1 passed (2.5m) |
| 2026-08-26 | 完整季节回归中 wash 多页面加载与菜单中途重定向被 120 秒外层预算或 8 秒帧等待提前截断 | 2 | wash 总预算改为 180 秒；菜单总预算改为 240 秒并扩大中间帧/落定等待；定向复跑均通过 |
| 2026-08-26 | 三季白天 wash 聚焦回归连续启动 7 个 WebGL 页面，180 秒预算偶发在后续页面初始化时截断 | 1 | 将该用例预算调至 300 秒；复跑 1 passed (1.1m) |

## 五问重启检查
| 问题 | 答案 |
|------|------|
| 我在哪里？ | 阶段 3：天空、云、光照和 CSS 过渡 |
| 我要去哪里？ | 完成天空、粒子、工具栏、昼夜组合和视觉验证 |
| 目标是什么？ | 保留现有春季并实现可平滑过渡的四季昼夜系统 |
| 我学到了什么？ | 见 findings.md |
| 我做了什么？ | 已完成审计并写入实施计划 |

---
*每个阶段完成后或遇到错误时更新此文件。*

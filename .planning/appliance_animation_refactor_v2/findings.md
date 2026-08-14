# 29 台家电动画重构：发现与决策

## 需求与强制约束
- 最终只允许一个动画 session、一个约 5.2 秒时间轴和一个特效来源。
- 模型工厂只保留几何、材质、命名部件、pivot/socket/collider/effect rig 锚点。
- 游戏与图鉴共享同一动画定义；图鉴自动旋转必须保留且职责独立。
- 每台迁移必须在同一改动中删除原位置旧行为和旧特效，禁止透明隐藏后继续更新。
- 立体道具必须有厚度、轮廓、命名层级和可读物理轨迹，禁止廉价 billboard/通用粒子换色。

## 已确认现状
- 外部交接文件共 265 行，已按 UTF-8 完整读取。
- 核心重复链路是模型内 `animation.update/stop/signal` 与 `ApplianceSpectacleSystem` 同时驱动。
- 图鉴在同一帧先 `drivePoweredAnimation(this.current.animation, cycle)`，再 `this.spectacles.update(...)`；游戏在 `ApplianceTarget.update()` 内驱动 `customAnimation`，随后 `Game.update()` 再驱动 spectacle。
- `ApplianceScene` 的旧通用 `AnimatedParts` 除 `customAnimation` 外均未被赋值，是已经失效但仍保留的浅层旧动画代码。
- 交接点名的核心文件均存在；`CONTEXT.md` 不存在。
- 工作区有大量用户未提交和未跟踪修改，必须逐文件保留。
- 当前未发现 `.planning` 活动计划，因此本任务使用独立 scoped 目录。

## 架构原则
- 深模块的外部 seam 只暴露 start/update/stop 与可诊断快照；29 种表演定义属于内部实现。
- 测试应从同一 seam 观察 session、时间轴、活动 effect rig、部件状态和 stop 后快照，不越过接口绑定实现细节。
- 对象和随机轨迹使用确定性种子及池化，避免每帧分配和池容量持续增长。

## 已产出
- `docs/appliance-animation-migration-v2.md`：29 台逐台旧动作、旧特效、新特效、重复项、保留 rig 和删除项清单。
- `tests/appliance-performance.spec.ts`：水壶双蒸汽最小复现修复前稳定收到 `2` 个 owner；迁移后模型蒸汽为 `0`、统一蒸汽 owner 为 `1`。

## 已完成结论
- `ApplianceModelBuild` 已物理删除 `animation` 字段，模型工厂只提供本体、命名部件、pivot/socket/collider。
- 游戏、图鉴和模型审阅页全部只调用 `AppliancePerformanceSystem`；`ApplianceSpectacleSystem` 仅作为其内部实现存在。
- 29 台在统一 4.2 秒时间点均产生机械姿态和 signal，`stop()` 后精确回到基线。
- 图鉴 knead 会暂停统一时间轴并冻结当前姿态，不再 stop/reset；自动旋转在松手后继续。
- 开场过渡期间不再发布陈旧 clickTarget，最终镜头重新投影后才允许交互。
- 补丁工具以父级 Git 根目录为基准，项目内补丁路径必须加 `arrow-cube/` 前缀。

## 视觉/浏览器发现
- 4.2 秒确定性时钟同时进入游戏和图鉴的 target getter，因此机械与立体特效使用同一时刻。
- 水壶、风扇、洗衣机、打印机、除湿机的游戏/图鉴左右对照均已目视检查。
- 图鉴连续切换 29 台三轮，共 87 次；第一轮后 effect pool capacity 未增长。
- 五台游戏诊断均为 `sessions=1`、`timelineOwners=1`、`elapsed=4.2`、context loss 0、console/page error 0。

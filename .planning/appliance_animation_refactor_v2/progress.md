# 29 台家电动画重构：进度日志

## 2026-08-06

### 阶段 1：现状审计与红色回归
- **状态：** in_progress
- 已完整读取 265 行外部交接文件。
- 已完整读取 `img2threejs`、`codebase-design`、`diagnosing-bugs`、`planning-with-files-zh` 的主说明，并读取深模块的 DEEPENING 规则。
- 已确认项目核心文件存在、`CONTEXT.md` 不存在、工作区包含大量用户修改。
- 创建本次任务独立 scoped 规划文件。
- 建立 `docs/appliance-animation-migration-v2.md`，覆盖 29 台所有权、重复项、保留 rig 和删除项。
- 新增水壶重复蒸汽回归并运行见红：模型蒸汽和统一蒸汽同时活动，owner 数 2（期望 1）。

## 测试结果
| 测试 | 预期 | 实际 | 状态 |
|---|---|---|---|
| 重复动画红色回归 | 修复前捕获模型旧特效与新版特效并存 | `activeSteamOwners=2`，期望 1 | red-capable |
| `npm run build` | 通过 | 待运行 | pending |
| Playwright 游戏/图鉴 | 通过且无控制台错误 | 待运行 | pending |

## 错误日志
| 时间 | 错误 | 尝试次数 | 解决方案 |
|---|---|---:|---|
| 2026-08-06 | PowerShell 默认读取导致中文交接乱码 | 1 | 强制 UTF-8 分段读取成功 |
| 2026-08-06 | 首次补丁按父级 Git 根目录落盘，Playwright 报 `No tests found` | 1 | 精确迁移本轮新建的 4 个文件到 `arrow-cube` 后重跑 |

## 五问重启检查
| 问题 | 答案 |
|---|---|
| 我在哪里？ | 阶段 1，正在读取项目现状并建立所有权清单与红色回归 |
| 我要去哪里？ | 水壶样板，然后同模块迁移剩余 28 台，最后自动化与视觉验收 |
| 目标是什么？ | 29 台家电单一动画所有权，游戏/图鉴完全共享，旧动画彻底移除 |
| 我学到了什么？ | 见 findings.md |
| 我做了什么？ | 见本日志 |

### 阶段 2-5：统一迁移、自动化与视觉验收
- **状态：** completed
- 建立 `AppliancePerformanceSystem` 唯一外部入口，机械定义集中于 `ApplianceMechanics`，立体特效系统成为内部实现。
- 删除 `ApplianceModelBuild.animation`、29 个模型旧动画闭包、模型内重复粒子/道具/光源节点及对应更新逻辑。
- 水壶样板通过后继续完成剩余 28 台；29 台均通过姿态变化、signal、旧节点不存在和 stop 精确复位检查。
- 图鉴保留 OrbitControls 自动旋转，并修复 knead 时统一时间轴暂停/冻结语义。
- 新增 4.2 秒确定性视觉回归和 29 台三轮对象池稳定性回归。
- 捕获水壶、风扇、洗衣机、打印机、除湿机游戏/图鉴各 2 张截图、5 张左右对照及总诊断 JSON。
- 修复开场过渡提前暴露陈旧 clickTarget 的真实交互缺陷。

## 最终测试结果
| 检查 | 结果 |
|---|---|
| `npx tsc --noEmit --pretty false` | passed |
| `npm run build` | passed |
| `npm run verify:appliance-performance` | 2 passed |
| 图鉴 29 台 × 3 轮容量稳定性 | 1 passed，容量无增长 |
| 五台真实游戏接线固定时刻证据 | 5 passed |
| `tests/catalog.spec.ts` | 23 passed |
| `tests/visual.spec.ts` | 1 passed |
| `tests/transitions.spec.ts` | 8 passed |
| `tests/levels.spec.ts` | 6 passed |
| `git diff --check -- arrow-cube` | passed |

## 最终证据
- `artifacts/appliance-performance-comparison/runtime-diagnostics.json`
- `artifacts/appliance-performance-comparison/*-game-gallery-4.2.png`

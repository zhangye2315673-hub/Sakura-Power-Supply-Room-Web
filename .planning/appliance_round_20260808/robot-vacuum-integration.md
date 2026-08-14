# 扫地机器人专项集成说明

## 已完成的专项改动

- `src/appliances/models/robotVacuum.ts`：旧单边刷已替换为前下方左右双边刷。每侧都有独立 pivot、轴 socket、三根刷臂和九束有厚度刷毛；左右驱动轮、前万向轮、中央滚刷的真实底盘关系保持不变。
- `src/appliances/performance/RobotVacuumPerformance.ts`：新增唯一专项 Timeline。启动灯和双边刷先提速，机身前倾后以半径 `1.45` 的圆轨迹离开原点，完整一周准确回到 `(0, 0, 0)`，`+Z` 朝向始终跟随路径切线，最后减速回正。
- 同一模块预置五类立体道具：有厚度纸屑、多瓣灰尘团、颗粒簇、碎片、毛球。垃圾先横向被边刷拨动，再卷向底部、缩小并隐藏；吸入反馈仅使用少量 `IcosahedronGeometry` 体积光点，没有 Plane、Sprite、Line 或地面轨迹。
- `tests/robot-vacuum-performance.spec.ts`：覆盖双边刷/轮组层级、大圆完整返回、切线朝向、全部垃圾被收走、体积特效禁用清单与复位。

## 真实结构参考

- ILIFE V3x 官方产品页：<https://www.iliferobot.com/products/V3x/>。官方产品图的底视角用于核对前万向轮、左右驱动轮、中央清扫/吸入口以及侧刷位于前缘的结构关系。
- ILIFE 2026 官方产品目录：<https://www.iliferobot.com/u_file/file/ILIFEProductCatalog_2026_1.pdf>。用于交叉核对圆盘式机身、底部轮组和清扫组件的产品级布局。
- 双边刷采用用户指定的左右对称结构；现实机型存在单边刷与双边刷两类，本实现没有把单边刷参考误写成双边刷证据。

## 主代理需要做的共享接线（本子任务未改共享文件）

1. 在 `src/appliances/performance/ApplianceMechanics.ts` 导入：
   `import { createRobotVacuumPerformance } from './RobotVacuumPerformance';`
2. 与其他专项 controller 一样，在工厂开头建立：
   `const robotVacuumPerformance = kind === 'robot-vacuum' ? createRobotVacuumPerformance(root) : null;`
3. 将 `case 'robot-vacuum'` 中旧 `motion.position += 0.42`、`motion.rotation.y += angle` 及旧刷/轮旋转代码全部删除，替换为：
   `robotVacuumPerformance?.apply(time, p);`
4. 在 `stop()` 中加入：
   `if (kind === 'robot-vacuum') robotVacuumPerformance?.reset();`
5. 在 `src/systems/ApplianceSpectacleSystem.ts` 把 `case 'robot-vacuum': this.updateRobotVacuum(...)` 改为无发射的 `break`，并删除/留空旧 `updateRobotVacuum`。旧方法当前通过共享 `debris` 池持续发射曲线灰尘，这是必须移除的第二动画/特效 owner。
6. 集成后同一时间戳只有 `ApplianceMechanics/RobotVacuumPerformance` 一个 Timeline owner；游戏与图鉴都会经 `AppliancePerformanceSystem` 调用同一 controller，图鉴自动旋转无需改动。

## 合并后验收

运行：

```powershell
npx playwright test tests/robot-vacuum-performance.spec.ts --project=desktop-chrome --reporter=line
npx tsc --noEmit
npm run build
```

再补跑 `tests/appliance-performance.spec.ts`，确认 `stop()` 后模型姿态复原、旧 Spectacle debris 池在扫地机器人时刻为零，浏览器控制台无报错。

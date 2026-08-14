# 风扇统一时间线接入建议

风扇转速修复必须由统一 `ApplianceMechanics` 时间线调用，但该文件是 16 个家电子任务共享冲突点，本子任务不直接修改。

建议主代理在 `createApplianceMechanicalAnimation()` 中做最小接入：

1. 导入 `createFanPerformance`。
2. 构造阶段增加：
   - `const fanPerformance = kind === 'fan' ? createFanPerformance(root) : null;`
3. `case 'fan'` 中删除旧的三条表达式：
   - `-time * (8 + climax * 7) * run`
   - `Math.sin(time * 1.7) * 0.52 * run`
   - `Math.sin(time * 0.85) * 0.12 * run`
4. 改为 `fanPerformance?.apply(time, p)`，旋钮也由风扇专用控制器负责，避免双写。
5. `stop()` 统一恢复基线后再调用 `fanPerformance?.reset()`；`signal()` 对风扇返回 `fanPerformance?.signal()`。

原因：旧转子角度把累计时间乘以变化中的速度/包络，导数中出现额外的 `time * speed'`，造成突快突慢；停机时把累计角度乘回零还会产生反向回卷。`FanPerformance.ts` 用解析积分输出绝对角度，支持任意帧率、固定时间取证和图鉴 seek，并让 5.2 秒终点精确落在 12 个整圈。

`ApplianceSpectacleSystem.updateFan()` 无需改动。`fan-front-air-socket` 名称、方向和 `fan-sakura-gust` 元数据均已保留，现有樱花发射与 PetalField 风场语义不变。
